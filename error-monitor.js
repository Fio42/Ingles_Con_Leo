/* ============================================================
   Inglés con Leo — error-monitor.js (registro central de errores, Fase 1)

   Avisa a Leo cuando algo falla a un usuario real, sin depender de una
   captura. Detecta: errores de JavaScript, promesas rechazadas sin
   capturar, recursos rotos del propio sitio (scripts, estilos, imágenes,
   audios dentro de la página) y llamadas a Supabase que devuelven 5xx o
   se caen. Manda un resumen mínimo a la Edge Function report-error.

   PRIVACIDAD: solo manda tipo, nombre de la página, mensaje y 3 líneas de
   stack ya LIMPIOS (sin correos, tokens, JWT, UUID, números largos, URLs con
   query, textos largos entre comillas), navegador y plataforma aproximada,
   la versión del sitio (el ?v= de app.js) y 3 banderas (online, con sesión,
   en página de miembros). NUNCA respuestas, Writing, audio, correos, ids
   de usuario, tokens ni IP.

   FAIL-SAFE: todo va dentro de try/catch; si algo falla aquí, la web, el
   login, los pagos y Leo AI siguen exactamente igual. El envío usa el fetch
   ORIGINAL (nunca el envuelto) y el monitor jamás se reporta a sí mismo.

   Solo funciona en inglesconleo.com. Se carga como PRIMER script de cada
   página para atrapar errores tempranos y envolver fetch antes de que
   supabase-js cree su cliente.
   ============================================================ */
(function(){
  'use strict';
  try{
    if(window.__leoErrorsLoaded) return;
    window.__leoErrorsLoaded = true;

    var ENDPOINT = 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/report-error';
    var SUPABASE_ORIGIN = 'https://iviksyhzhiygkuaojply.supabase.co';
    var PROD_HOSTS = { 'inglesconleo.com':1, 'www.inglesconleo.com':1 };
    var MAX_PER_PAGE = 10;      // eventos por carga de página
    var MAX_PER_SESSION = 30;   // eventos por pestaña (sessionStorage)
    var MIN_GAP_MS = 1500;      // separación mínima entre envíos
    var MAX_QUEUE = 5;
    var SELF_FILE = 'error-monitor.js';
    var SESSION_KEY = 'leo_err_n';

    var loc = window.location || {};
    var nav = window.navigator || {};
    var ua = String(nav.userAgent || '');

    // Solo producción; sin bots ni navegadores automatizados.
    if(!PROD_HOSTS[loc.hostname]) return;
    if(nav.webdriver === true) return;
    if(/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|phantom|puppeteer|playwright/i.test(ua)) return;

    var origFetch = typeof window.fetch === 'function' ? window.fetch : null;
    var busy = false, disabled = false, failures = 0, sent = 0, lastSend = 0, timer = null;
    var queue = [], seen = {}, cachedRelease = null;

    /* ---------- Limpieza de texto (mismas reglas, mismo orden que report-error.ts y app_error_clean en SQL) ---------- */
    function clean(s, max){
      try{
        s = String(s == null ? '' : s);
        s = s.replace(/"[^"\n]{41,}"/g, '"[text]"').replace(/'[^'\n]{41,}'/g, "'[text]'");
        s = s.replace(/[?#][^\s"')\]]+/g, '');
        s = s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]');
        s = s.replace(/(?:\d[ -]?){13,19}/g, '[num]');
        s = s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]');
        s = s.replace(/eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}(?:\.[A-Za-z0-9_-]*)?/g, '[jwt]');
        s = s.replace(/Bearer\s+\S+/gi, 'Bearer [token]');
        s = s.replace(/(apikey|api_key|access_token|refresh_token|token|password|passwd|secret|authorization)(["']?\s*[=:]\s*)["']?[^\s&"',;)]+/gi, '$1$2[redacted]');
        s = s.replace(/(?:sb_(?:publishable|secret)|sk_(?:live|test)|pk_(?:live|test)|rk_(?:live|test)|whsec)_[A-Za-z0-9]+/g, '[key]');
        s = s.replace(/\d{6,}/g, '[num]');
        s = s.replace(/[A-Za-z0-9_-]{32,}/g, '[token]');
        return s.replace(/\s+/g, ' ').replace(/^ | $/g, '').slice(0, max);
      }catch(e){ return ''; }
    }

    /* ---------- Contexto aproximado ---------- */
    function sectionName(){
      try{
        var p = String(loc.pathname || '').replace(/^\/+|\/+$/g, '').replace(/\.html$/i, '');
        if(!p) return 'index';
        var first = p.split('/')[0];            // carpetas (glosario/...): una sola sección
        return first.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'unknown';
      }catch(e){ return 'unknown'; }
    }
    function browserInfo(){
      var b = 'Other', m;
      if(/Instagram/i.test(ua)) b = 'Instagram app';
      else if(/FBAN|FBAV/.test(ua)) b = 'Facebook app';
      else if(/TikTok|musical_ly|BytedanceWebview/i.test(ua)) b = 'TikTok app';
      else if((m = ua.match(/EdgA?\/(\d+)/))) b = 'Edge ' + m[1];
      else if((m = ua.match(/OPR\/(\d+)/))) b = 'Opera ' + m[1];
      else if((m = ua.match(/SamsungBrowser\/(\d+)/))) b = 'Samsung ' + m[1];
      else if((m = ua.match(/CriOS\/(\d+)/))) b = 'Chrome iOS ' + m[1];
      else if((m = ua.match(/FxiOS\/(\d+)/))) b = 'Firefox iOS ' + m[1];
      else if((m = ua.match(/Firefox\/(\d+)/))) b = 'Firefox ' + m[1];
      else if((m = ua.match(/Chrome\/(\d+)/))) b = 'Chrome ' + m[1];
      else if((m = ua.match(/Version\/(\d+)[^]*Safari/))) b = 'Safari ' + m[1];
      return b;
    }
    function platformInfo(){
      var p = 'Other', m;
      if(/iPhone|iPad|iPod/.test(ua)){ m = ua.match(/OS (\d+)_/); p = 'iOS' + (m ? ' ' + m[1] : ''); }
      else if(/Android/.test(ua)){ m = ua.match(/Android (\d+)/); p = 'Android' + (m ? ' ' + m[1] : ''); }
      else if(/Windows/.test(ua)) p = 'Windows';
      else if(/Mac OS X/.test(ua)) p = 'macOS';
      else if(/CrOS/.test(ua)) p = 'ChromeOS';
      else if(/Linux/.test(ua)) p = 'Linux';
      var d = /iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet' : (/Mobi|iPhone|iPod|Android/.test(ua) ? 'mobile' : 'desktop');
      return p + ' ' + d;
    }
    function hasSession(){
      try{
        var ls = window.localStorage;
        for(var i = 0; i < ls.length; i++){ if(/^sb-.*-auth-token$/.test(ls.key(i))) return true; }
      }catch(e){}
      return false;
    }
    // La versión del sitio es el ?v= de app.js (el mismo que ya subes al cambiar JS).
    function release(){
      if(cachedRelease !== null) return cachedRelease;
      var out = '', any = '';
      try{
        var tags = document.getElementsByTagName('script');
        for(var i = 0; i < tags.length; i++){
          var src = tags[i].getAttribute('src') || '', m = src.match(/[?&]v=([A-Za-z0-9._-]+)/);
          if(!m) continue;
          if(/(^|\/)app\.js\?/.test(src)){ out = m[1]; break; }
          if(!any) any = m[1];
        }
      }catch(e){}
      out = out || any;
      if(document.readyState !== 'loading' || out) cachedRelease = out;
      return out;
    }

    /* ---------- Stack: máximo 3 líneas "fn (archivo.js:línea:col)", sin rutas ni query ---------- */
    function frames(stack){
      var out = [];
      try{
        var lines = String(stack || '').split('\n');
        for(var i = 0; i < lines.length && i < 12 && out.length < 3; i++){
          var l = lines[i], m = l.match(/^\s*at\s+(?:(.+?)\s+\()?(.*?):(\d+):(\d+)\)?\s*$/) || l.match(/^\s*(.*?)@(.*?):(\d+):(\d+)\s*$/);
          if(!m) continue;
          var file = String(m[2]).split(/[?#]/)[0].split('/').pop() || 'inline';
          if(file === SELF_FILE) continue;
          out.push(clean((m[1] || 'anon').replace(/^.*\./, ''), 40) + ' (' + clean(file, 40) + ':' + m[3] + ':' + m[4] + ')');
        }
      }catch(e){}
      return out;
    }

    /* ---------- Filtros de ruido ---------- */
    var NOISE = /ResizeObserver loop|^Script error\.?$|Non-Error promise rejection captured|(?:chrome|moz|safari(?:-web)?)-extension:\/\//i;
    function isSelf(text){ return typeof text === 'string' && (text.indexOf(SELF_FILE) !== -1 || text.indexOf('report-error') !== -1 || text.indexOf('LeoErrors') !== -1); }
    // ¿La línea de arriba del stack (donde nació el error) es de este archivo?
    function topFrameIsSelf(stack){
      var lines = String(stack || '').split('\n');
      for(var i = 0; i < lines.length && i < 12; i++){
        if(/^\s*at\s|@/.test(lines[i])) return lines[i].indexOf(SELF_FILE) !== -1;
      }
      return false;
    }
    function sameHost(url){
      try{ return new URL(url, loc.href).host === loc.host; }catch(e){ return false; }
    }

    /* ---------- Construcción y envío ---------- */
    function makeEvent(kind, message, name, stackLines, code, extra){
      var sample = { online: nav.onLine !== false, logged_in: hasSession(), member: window.__leoMemberVerified === true };
      if(extra){ if(extra.status) sample.status = extra.status; if(extra.method) sample.method = extra.method; }
      return {
        v: 1, kind: kind, section: sectionName(),
        message: clean(message, kind === 'js_error' || kind === 'promise' ? 200 : 300),
        name: name ? clean(name, 40) : null,
        stack: stackLines && stackLines.length ? stackLines : null,
        code: code || null, release: release(), browser: browserInfo(), platform: platformInfo(), sample: sample
      };
    }
    function sessionCount(delta){
      try{
        var n = parseInt(window.sessionStorage.getItem(SESSION_KEY) || '0', 10) || 0;
        if(delta) window.sessionStorage.setItem(SESSION_KEY, String(n + delta));
        return n;
      }catch(e){ return 0; }
    }
    function enqueue(ev){
      if(disabled || !ev || (!ev.message && !ev.code)) return;
      var key = [ev.kind, ev.section, ev.message, ev.code, ev.stack ? ev.stack[0] : ''].join('|');
      if(seen[key]) return;                                   // 1 por error y por carga de página
      if(sent + queue.length >= MAX_PER_PAGE) return;         // tope por página
      if(queue.length >= MAX_QUEUE) return;
      if(sessionCount(0) + queue.length >= MAX_PER_SESSION) return; // tope por pestaña
      seen[key] = 1;
      queue.push(ev);
      pump();
    }
    function pump(){
      if(disabled || timer || !queue.length) return;
      var wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastSend));
      timer = setTimeout(function(){
        timer = null;
        try{
          var ev = queue.shift();
          if(ev) post(ev);
          pump();
        }catch(e){}
      }, wait);
    }
    function fail(){ failures++; if(failures >= 2) disabled = true; }   // interruptor: tras 2 fallos seguidos, se apaga
    function post(ev){
      if(!origFetch || disabled) return;
      busy = true;
      try{
        lastSend = Date.now();
        sent++;
        sessionCount(1);
        var p = origFetch.call(window, ENDPOINT, {
          method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(ev)
        });
        if(p && typeof p.then === 'function'){
          p.then(function(r){ if(!r || r.status >= 400) fail(); else failures = 0; }, fail);
        }
      }catch(e){ fail(); }
      finally{ busy = false; }
    }

    /* ---------- Errores de JavaScript y recursos rotos ---------- */
    var leavingPage = false;
    window.addEventListener('pagehide', function(){ leavingPage = true; }, true);
    window.addEventListener('beforeunload', function(){ leavingPage = true; }, true);
    window.addEventListener('pageshow', function(){ leavingPage = false; }, true);
    window.addEventListener('error', function(e){
      try{
        if(busy || disabled || !e) return;
        var t = e.target;
        if(t && t !== window && t.tagName){                       // recurso que no cargó
          var tag = String(t.tagName).toUpperCase();
          if(!/^(SCRIPT|LINK|IMG|AUDIO|VIDEO|SOURCE)$/.test(tag)) return;
          if(tag === 'LINK' && !/stylesheet/i.test(String(t.rel || ''))) return;
          var src = t.currentSrc || t.src || t.href || '';
          if(!src || !sameHost(src) || nav.onLine === false) return;   // solo archivos propios y con conexión
          /* Si la persona se está yendo de la página (tocó un enlace, cerró el navegador
             de TikTok/Instagram, bloqueó el celular), el navegador cancela las descargas
             en curso y eso dispara este mismo error: no es una falla real del sitio. */
          if(leavingPage || document.visibilityState === 'hidden') return;
          /* Scripts que la propia página ya va a reintentar (data-retry): solo se
             reporta si el reintento también falla. */
          if(t.getAttribute && t.getAttribute('data-retry') === '1') return;
          var path = new URL(src, loc.href).pathname;
          if(path.indexOf(SELF_FILE) !== -1) return;
          enqueue(makeEvent('resource', 'Resource failed: ' + tag.toLowerCase() + ' ' + path, null, null, 'load'));
          return;
        }
        var msg = String(e.message || ''), file = String(e.filename || ''), err = e.error;
        var stack = err && err.stack ? String(err.stack) : '';
        if(NOISE.test(msg) || NOISE.test(file) || NOISE.test(stack)) return;
        if(isSelf(file) || topFrameIsSelf(stack) || isSelf(msg)) return; // el monitor jamás se reporta a sí mismo
        if(file && !sameHost(file)) return;                          // scripts de terceros
        var fr = frames(stack);
        if(!fr.length && file) fr = [ '(' + clean(file.split(/[?#]/)[0].split('/').pop(), 40) + ':' + (e.lineno || 0) + ':' + (e.colno || 0) + ')' ];
        enqueue(makeEvent('js_error', msg, err && err.name, fr, null));
      }catch(x){}
    }, true);

    window.addEventListener('unhandledrejection', function(e){
      try{
        if(busy || disabled || !e) return;
        var r = e.reason, name = '', msg = '', stack = '';
        if(r && typeof r === 'object' && (r.message || r.stack || r.name)){
          name = String(r.name || ''); msg = String(r.message || ''); stack = String(r.stack || '');
        }else if(typeof r === 'string'){
          msg = r;
        }else{
          msg = 'Non-Error rejection';                               // nunca se serializan objetos (podrían traer datos)
        }
        if(name === 'AbortError' || name === 'NotAllowedError') return;   // cancelaciones y permisos negados: normales
        if(/^(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i.test(msg)) return; // red del usuario
        if(NOISE.test(msg) || NOISE.test(stack)) return;
        if(topFrameIsSelf(stack) || isSelf(msg)) return;
        if(stack && stack.indexOf(loc.host) === -1) return;          // lo que no viene de nuestro código
        enqueue(makeEvent('promise', msg, name, frames(stack), null));
      }catch(x){}
    });

    /* ---------- Llamadas de red a Supabase (solo 5xx, timeout o caída; nunca 4xx) ---------- */
    if(origFetch){
      window.fetch = function(input, init){
        var p = origFetch.apply(window, arguments);                 // si lanza al instante, lanza igual que antes
        try{ watch(p, input, init); }catch(e){}
        return p;                                                   // el mismo promise: el código de la web no nota nada
      };
    }
    function urlOf(input){
      try{
        if(typeof input === 'string') return input;
        if(input && typeof input.url === 'string') return input.url;
        if(input && typeof input.href === 'string') return input.href;
      }catch(e){}
      return '';
    }
    function watch(p, input, init){
      var url = urlOf(input);
      if(!p || typeof p.then !== 'function' || url.indexOf(SUPABASE_ORIGIN) !== 0) return;
      var path = url.slice(SUPABASE_ORIGIN.length).split(/[?#]/)[0];
      if(path.indexOf('/functions/v1/report-error') === 0) return;  // el reporte no se observa a sí mismo
      var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      p.then(function(res){
        try{
          if(res && res.status >= 500){
            enqueue(makeEvent('network', 'HTTP ' + res.status + ' ' + method + ' ' + path, null, null, 'http_' + res.status, { status: res.status, method: method }));
          }
        }catch(e){}
      }, function(err){
        try{
          if(nav.onLine === false || (err && err.name === 'AbortError')) return;   // sin internet o cancelado a propósito
          enqueue(makeEvent('network', 'Network error ' + method + ' ' + path, null, null, 'network', { method: method }));
        }catch(e){}
      });
    }

    /* ---------- API para reportar errores controlados (la usarán las siguientes fases) ---------- */
    window.LeoErrors = {
      report: function(kind, message, opts){
        try{
          if(busy || disabled) return;
          opts = opts || {};
          enqueue(makeEvent(String(kind || 'other'), message, opts.name, null, opts.code, opts));
        }catch(e){}
      }
    };
  }catch(e){ /* el monitor nunca rompe la página */ }
})();
