/* =========================================================
   Inglés con Leo 2.0 · arranque (se carga en <head>, sin defer)
   - Interruptor general (rollback interno): ICL_V2_ENABLED.
     false = nadie ve 2.0; la página queda exactamente como la clásica.
   - Preferencia cosmética "clásica" (localStorage 'icl.ui' = 'classic').
     Es solo apariencia: nunca decide permisos ni acceso.
   - Tema: 'light' | 'dark' | 'auto' (localStorage 'icl.theme'), aplicado
     antes de pintar para que no haya parpadeo.
   No llama a Supabase, no toca progreso, pagos ni analítica.
   ========================================================= */
(function(){
  var ICL_V2_ENABLED = true;           // <- ROLLBACK: poner false y publicar
  var root = document.documentElement;
  var get = function(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  var ui = get('icl.ui');
  var force = /[?&]v2=(1|0)\b/.exec(location.search);  // ?v2=0 / ?v2=1 solo para pruebas
  var on = ICL_V2_ENABLED && ui !== 'classic';
  if(force) on = force[1] === '1';
  window.ICL_V2 = { enabled: on, switchEnabled: ICL_V2_ENABLED };
  /* C22: quien eligió la versión clásica (Ajustes avanzados) tiene siempre un enlace discreto para volver a 2.0 */
  if(ICL_V2_ENABLED && ui === 'classic' && !force){
    var back = function(){
      var ses = false; try{ for(var b = 0; b < localStorage.length; b++){ if(/^sb-.*-auth-token$/.test(localStorage.key(b))){ ses = true; break; } } }catch(e){}
      if(!ses || !document.body) return;
      var a = document.createElement('a'); a.href = location.pathname + '?v2=1'; a.textContent = 'Volver al diseño nuevo';
      a.style.cssText = 'display:block;text-align:center;font:600 14px/1.4 system-ui,sans-serif;padding:14px 16px 90px;color:#5B6CFF;';
      document.body.appendChild(a);
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', back); else back();
  }
  if(!on) return;
  /* miembros.html es pública e indexada: allí 2.0 se enciende SOLO cuando la página ya
     mostró el área de miembro (v2-home.js llama a ICL_V2.activate()). Visitantes, Google,
     login y pagos se quedan exactamente como están. */
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var deferred = page === 'miembros.html';
  /* Oscuro por defecto. Si el alumno ya eligió Claro, Oscuro o Auto, se respeta (solo se guarda cuando él elige). */
  var pref = get('icl.theme') || 'dark';
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  var apply = function(){
    var t = pref === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : pref;
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', t === 'dark' ? '#0B0F1A' : '#F7F3EC');
  };
  /* Sin destello blanco: el fondo oscuro se pinta antes que cualquier contenido */
  var preStyle = null;
  function preDark(on){
    if(on && !preStyle){ preStyle = document.createElement('style'); preStyle.textContent = 'html.v2-pre,html.v2-pre body{background:#0B0F1A!important;color-scheme:dark}html.v2-pre #gateLoading{color:#AAB1C4}'; document.head.appendChild(preStyle); root.classList.add('v2-pre'); }
    if(!on && preStyle){ root.classList.remove('v2-pre'); preStyle.remove(); preStyle = null; }
  }
  var resolved = function(){ return pref === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : pref; };
  var active = false;
  window.ICL_V2.activate = function(){
    if(active) return; active = true;
    root.classList.add('v2');
    apply();
    if(resolved() === 'dark') preDark(true);
    var off = function(){ preDark(false); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(off, 0); }); else setTimeout(off, 0);
    if(mq && mq.addEventListener) mq.addEventListener('change', function(){ if(pref === 'auto') apply(); });
  };
  window.ICL_V2.active = function(){ return active; };
  /* Tema elegido por el alumno (barra superior y Más). Se define ANTES del return de las páginas privadas:
     antes estaba al final y en esas páginas nunca existía, así que el botón no hacía nada (C1). */
  window.ICL_V2.setTheme = function(t){
    pref = t; try{ localStorage.setItem('icl.theme', t); }catch(e){}
    if(window.ICL_TEMA && window.ICL_TEMA.get && window.ICL_TEMA.get() !== t){ try{ window.ICL_TEMA.set(t); }catch(e){} }
    if(active) apply();
  };
  window.ICL_V2.theme = function(){ return pref; };
  /* English Rush y Modo aprender son páginas públicas e indexadas (C13): para visitantes y buscadores no se descarga
     nada de 2.0. Con sesión guardada se cargan los estilos y scripts al vuelo (como en miembros.html) y aparece la
     barra del alumno; el juego y las microlecciones no cambian. */
  var lazyPublic = page === 'juego.html' || page === 'aprender.html';
  if(lazyPublic) deferred = true;
  if(!deferred){
    /* Páginas privadas con sesión: la cabecera y la barra clásicas no se pintan nunca (antes se veían un instante
       hasta que llegaba la barra de la app). Visitantes de la Academia: sin cambios. */
    try{ for(var j = 0; j < localStorage.length; j++){ if(/^sb-.*-auth-token$/.test(localStorage.key(j))){ root.classList.add('v2-app'); break; } } }catch(e){}
    window.ICL_V2.activate(); return;
  }

  /* miembros.html con sesión guardada y tema oscuro: fondo oscuro mientras la página decide (sin destello).
     Si resulta que no es miembro (login, área gratis), se quita y la página clásica queda igual. */
  var hasSession = false;
  try{ for(var i = 0; i < localStorage.length; i++){ if(/^sb-.*-auth-token$/.test(localStorage.key(i))){ hasSession = true; break; } } }catch(e){}
  if(hasSession && resolved() === 'dark') preDark(true);
  /* Sin destello del panel clásico: con sesión guardada, el área de miembro, la cabecera y la barra clásicas
     quedan ocultas hasta que el Inicio 2.0 está pintado (o la página muestra login / vista previa). Red de seguridad: 6 s. */
  var cloak = null;
  function uncloak(){ if(cloak){ cloak.remove(); cloak = null; } }
  if(hasSession){
    cloak = document.createElement('style');
    cloak.textContent = '#memberContent:not(.v2-has-home),html:not(.v2-preview) #memberPreview,body>header,body>footer,body>.mobile-nav{visibility:hidden!important}';
    document.head.appendChild(cloak);
    setTimeout(uncloak, 6000);
    var waitHome = function(){ var mc = document.getElementById('memberContent'); if((mc && mc.classList.contains('v2-has-home')) || ((lazyPublic || root.classList.contains('v2-preview')) && document.querySelector('.v2-shell'))){ uncloak(); return; } if(cloak) setTimeout(waitHome, 60); };
    waitHome();
  }

  /* miembros.html: nada de 2.0 se descarga para visitantes ni buscadores. Solo cuando la página
     muestra el área de miembro se cargan los estilos y scripts (en orden) y se enciende. */
  var V = '20261129a';
  var CSS = ['v2-tokens.css', 'v2-base.css', 'v2-dark-auto.css', 'v3-ui.css', 'v2-screens.css', 'v2-lecciones.css', 'v2-paginas.css'];
  var JS = ['v3-art.js', 'v3-sound.js', 'v2-kit.js', 'v2-data.js', 'v2-shell.js', 'v2-home.js'];
  var loading = false;
  function loadAll(){
    if(loading) return; loading = true;
    var head = document.head, left = CSS.length;
    var next = function(i){ if(i >= JS.length) return; var sc = document.createElement('script'); sc.src = 'v2/' + JS[i] + '?v=' + V; sc.onload = sc.onerror = function(){ next(i + 1); }; document.body.appendChild(sc); };
    CSS.forEach(function(f){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'v2/' + f + '?v=' + V;
      l.onload = l.onerror = function(){ if(--left === 0){ window.ICL_V2.activate(); preDark(false); next(0); } }; head.appendChild(l); });
  }
  function watch(){
    var mc = document.getElementById('memberContent'); if(!mc) return;
    var shown = function(id){ var e = document.getElementById(id); return !!(e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'); };
    var check = function(){
      if(shown('memberContent')){ obs.disconnect(); loadAll(); return; }
      if(shown('memberPreview')){ obs.disconnect(); loadAll(); return; }   /* C8: cuenta gratis o vencida: también en 2.0 */
      if(shown('gate')){ preDark(false); uncloak(); }
    };
    var obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });
    check();
  }
  if(lazyPublic){
    if(!hasSession) return;
    JS = ['v3-art.js', 'v3-sound.js', 'v2-kit.js', 'v2-data.js', 'v2-shell.js'];
    root.classList.add('v2-app');
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAll); else loadAll();
    return;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
