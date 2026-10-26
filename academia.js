/* ============================================================
   ACADEMIA INGLES CON LEO: curso piloto TO BE (rama de trabajo, no publicado).

   - Una sola pagina con rutas por hash:
       #/                              Mi ruta
       #/logros                        Mis logros
       #/curso/to-be                   Curso
       #/curso/to-be/leccion/3         Leccion (explicacion + actividades)
       #/curso/to-be/evaluacion        Evaluacion de PRACTICA (no certifica)
       #/curso/to-be/repaso/<tema>     Repaso de errores guardados
   - El avance vive en este navegador (leo_academia_piloto_v1).
   - Con window.ACADEMIA_CLOUD=true (apagado por defecto) Y una sesion iniciada, ademas se guarda en la cuenta
     (academia-nube.js): progreso entre dispositivos, errores al motor actual, evaluacion oficial e insignias.
     Sin eso funciona igual que el piloto y NO toca Supabase ni estadisticas reales.
   - Contenido en academia-data.js (plantilla para los demas cursos).
   ============================================================ */
(function(){
  'use strict';

  var CFG = ACADEMIA_CONFIG;
  var COURSE = ACADEMIA.courses['to-be'];
  var KEY = 'leo_academia_piloto_v1';
  var root = document.getElementById('acRoot');
  var SITE = (window.ACADEMIA_SITE || { practica: 'practica.html', plan: 'plan-estudio.html', progreso: 'progreso.html' });
  var tabs = document.getElementById('acTabs');

  /* Contador diario del navegador: el MISMO que usa la practica gratis (app.js, leoLocalDailyCount:<dia>).
     El servidor toma el mayor entre este y el de la cuenta, y nunca los suma. */
  function ymd(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function localDailyCount(){ try{ return parseInt(localStorage.getItem('leoLocalDailyCount:' + ymd()), 10) || 0; }catch(e){ return 0; } }
  function setLocalDailyCount(n){ try{ var k = 'leoLocalDailyCount:' + ymd(); if(n > (parseInt(localStorage.getItem(k), 10) || 0)) localStorage.setItem(k, String(n)); }catch(e){} }

  /* ---------------- Nube (opcional) ---------------- */
  var NUBE = null;
  try{
    if(window.ACADEMIA_CLOUD === true && typeof AcademiaNube !== 'undefined' && typeof LeoBackend !== 'undefined' && LeoBackend.isConfigured()){
      NUBE = AcademiaNube.create({
        enabled: true, courseId: 'to-be', meta: (typeof ACADEMIA_MOTOR !== 'undefined' ? ACADEMIA_MOTOR.courses['to-be'] : null),
        getClient: LeoBackend.getClient, getSession: LeoBackend.getSession,
        storage: window.localStorage,
        localDailyCount: localDailyCount, setLocalDailyCount: setLocalDailyCount
      });
    }
  }catch(e){ NUBE = null; }
  var cloudTimer = null;
  function cloudSchedule(){
    if(!NUBE || !NUBE.ready) return;
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(cloudPush, 1200);
  }
  function cloudPush(){
    clearTimeout(cloudTimer);
    if(!NUBE || !NUBE.ready || mode !== 'member') return Promise.resolve();
    return NUBE.save(function(){ return memState; }, function(merged){ applyMerged(merged); }).then(function(r){
      if(!r.ok && NUBE.dirty) cloudTimer = setTimeout(cloudPush, 15000);   // sin red: se reintenta solo
    });
  }
  function applyMerged(merged){
    memState = Object.assign(blankState(), memState || {}, merged);
    try{ localStorage.setItem(KEY, JSON.stringify(memState)); }catch(e){}
  }
  function cloudFlush(){ if(NUBE && NUBE.ready && mode === 'member'){ NUBE.flushAll(); cloudPush(); } }
  /* Estado de la conexion con la cuenta: pending (conectando) | ready | anon (sin sesion) | failed (sin red o error) | off */
  var bootState = NUBE ? 'pending' : 'off';
  /* Quien es el alumno para la academia: member (todo) | free (presentacion + una demostracion) | anon (sin cuenta)
     | unknown (sin conexion y sin dato reciente) | pending (conectando). Sin nube (piloto local) todo queda abierto.
     Esto es SOLO lo que se muestra: cada accion premium la vuelve a validar el servidor. */
  var mode = NUBE ? 'pending' : 'member';
  var ACC = null;
  var MEMBER_KEY = 'leo_academia_member_v1', MEMBER_TTL = 14 * 86400000;
  function cachedMember(){ try{ var m = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null'); return !!(m && m.m === 1 && Date.now() - m.at < MEMBER_TTL); }catch(e){ return false; } }
  function cacheMember(v){ try{ if(v) localStorage.setItem(MEMBER_KEY, JSON.stringify({ m: 1, at: Date.now() })); else localStorage.removeItem(MEMBER_KEY); }catch(e){} }
  function refreshAccess(){
    return NUBE.access().then(function(a){
      if(a && a.ok){ ACC = a; mode = a.member ? 'member' : 'free'; cacheMember(a.member); }
      else if(a && a.error === 'course'){ mode = 'off'; }
      else if(mode === 'pending' || mode === 'unknown') mode = cachedMember() ? 'member' : 'unknown';
      return a;
    });
  }
  var bootWaiters = [], bootTimer = null, bootTries = 0;
  function bootCloud(){
    if(!NUBE || bootState === 'ready') return;
    clearTimeout(bootTimer);
    NUBE.boot(loadState()).then(function(r){
      if(r && r.ok){
        bootState = 'ready';
        refreshAccess().then(function(){ afterReady(r); });
        return;
      }
      bootState = (r && r.reason === 'anon') ? 'anon' : ((r && r.reason === 'off') ? 'off' : 'failed');
      if(bootState === 'anon'){ mode = 'anon'; cacheMember(false); }
      else if(bootState === 'failed') mode = cachedMember() ? 'member' : 'unknown';
      else mode = 'off';
      var w2 = bootWaiters; bootWaiters = []; w2.forEach(function(f){ f(); });
      if(bootState === 'failed' && bootTries < 6){ bootTries++; bootTimer = setTimeout(bootCloud, Math.min(60000, 4000 * bootTries * bootTries)); }
    });
  }
  function afterReady(r){
      {
        if(mode === 'member') NUBE.flushAll();                                  // errores y sesiones que quedaron pendientes (sin red, navegador cerrado)
        applyMerged(AcademiaNube.mergeStates(r.state, loadState()));   // por si el alumno ya avanzo mientras conectabamos
        if(r.changed || NUBE.dirty) cloudSchedule();
        var first = hashParts().path.split('/').filter(Boolean);
        // Solo se redibuja si NO esta en medio de una leccion, repaso o practica.
        var busy = first[0] === 'curso' && (first[2] === 'leccion' || first[2] === 'repaso' || first[2] === 'practica');
        var w = bootWaiters; bootWaiters = [];
        if(w.length) w.forEach(function(f){ f(); }); else if(!busy || mode !== 'member') route();
      }
  }
  window.addEventListener('online', function(){ if(!NUBE) return; if(bootState === 'failed'){ bootTries = 0; bootCloud(); } else if(bootState === 'ready' && mode === 'member'){ NUBE.flushAll(); cloudPush(); } });
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') cloudFlush(); });
  window.addEventListener('pagehide', cloudFlush);

  /* ---------------- Almacenamiento (con respaldo en memoria) ---------------- */
  var memState = null;
  function blankState(){
    return { v: 1, lessons: {}, resume: {}, last: null, missed: {}, cleared: {}, exam: { attempts: [], best: null, lastIds: [] },
             goal: null, goalAt: 0, days: [], completions: [], snooze: null, returnTo: null };
  }
  function loadState(){
    if(memState) return memState;
    var s = null;
    try{ s = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){ s = null; }
    if(!s || s.v !== 1) s = blankState();
    if(!s.resume || typeof s.resume !== 'object' || s.resume.lessonId) s.resume = {};
    if(!s.exam.lastIds) s.exam.lastIds = [];
    if(!s.cleared || typeof s.cleared !== 'object') s.cleared = {};
    if(typeof s.goalAt !== 'number') s.goalAt = 0;
    memState = s;
    return s;
  }
  function saveState(){
    try{ localStorage.setItem(KEY, JSON.stringify(memState)); }catch(e){}
    cloudSchedule();
  }
  function resetState(){
    memState = blankState();
    try{ localStorage.removeItem(KEY); }catch(e){}
  }

  /* ---------------- "Volver a donde estabas" ---------------- */
  /* #/curso/to-be/leccion/3?volver=<destino>: al terminar un refuerzo, un boton lleva EXACTO a donde estaba el alumno.
     El destino puede ser otra ruta de la academia (la leccion a medias sigue guardada) o una pagina del sitio. */
  function hashParts(){
    var h = (location.hash || '#/').replace(/^#/, ''), q = '', i = h.indexOf('?');
    if(i >= 0){ q = h.slice(i + 1); h = h.slice(0, i); }
    return { path: h, query: q };
  }
  function safeBack(){
    var m = /(?:^|&)volver=([^&]*)/.exec(hashParts().query);
    if(!m) return null;
    var v = ''; try{ v = decodeURIComponent(m[1]); }catch(e){ return null; }
    if(/^#\/[a-z0-9\/\-]*$/i.test(v)) return v;
    if(/^[a-z0-9-]+\.html(\?[a-z0-9=&%._-]*)?$/i.test(v)) return v;
    return null;
  }
  function backLabel(v){
    var m = /leccion\/(\d+)/.exec(v || '');
    if(m) return 'Volver a la lección ' + m[1];
    if(v === '#/' || v === '#/curso/to-be') return 'Volver a Mi ruta';
    if(/progreso\.html/.test(v)) return 'Volver a tu progreso';
    if(/plan-estudio\.html/.test(v)) return 'Volver a tu plan';
    return 'Volver a lo que estabas haciendo';
  }
  function backButton(v){ return v ? link(v, backLabel(v), 'ac-btn ac-btn-primary ac-btn-wide ac-btn-back') : null; }


  /* ---------------- Utilidades ---------------- */
  function el(tag, attrs, kids){
    var n = document.createElement(tag);
    if(attrs) Object.keys(attrs).forEach(function(k){
      var v = attrs[k];
      if(v === null || v === undefined || v === false) return;
      if(k === 'class') n.className = v;
      else if(k === 'text') n.textContent = v;
      else if(k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function(c){
      if(c === null || c === undefined || c === false) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function shuffle(a){
    a = a.slice();
    for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function norm(s){
    return String(s || '').replace(/[‘’´`]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
  }
  function today(){
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function weekStart(){
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var day = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - day);
    return d.getTime();
  }
  function track(name, params){
    try{ if(typeof window.gtag === 'function') window.gtag('event', 'academia_' + name, params || {}); }catch(e){}
  }
  /* Clics hacia la membresia desde cualquier pantalla de la academia (un solo evento, sin tocar el flujo de compra ni los eventos de compra del sitio). */
  if(root) root.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if(a && /miembros\.html\?pagar=1/.test(a.getAttribute('href') || '')) track('cta_membresia', { origen: (location.hash || '#/').split('/').slice(0, 4).join('/') });
  });

  var itemIndex = {};
  COURSE.lessons.forEach(function(l){ l.activities.forEach(function(a){ itemIndex[a.id] = a; }); });
  COURSE.exam.bank.forEach(function(a){ itemIndex[a.id] = a; });

  function lessonById(id){ for(var i = 0; i < COURSE.lessons.length; i++) if(COURSE.lessons[i].id === id) return COURSE.lessons[i]; return null; }
  function lessonByN(n){ return COURSE.lessons[n - 1] || null; }
  function lessonOfTopic(t){ for(var i = 0; i < COURSE.lessons.length; i++) if(COURSE.lessons[i].topic === t) return COURSE.lessons[i]; return null; }
  function pendingResume(){
    var s = loadState(), id = s.last;
    if(id && s.resume[id] && lessonById(id) && !(s.lessons[id] && s.lessons[id].done)) return lessonById(id);
    var keys = Object.keys(s.resume);
    for(var i = 0; i < keys.length; i++){ var l = lessonById(keys[i]); if(l && !(s.lessons[l.id] && s.lessons[l.id].done)) return l; }
    return null;
  }
  function doneCount(){ var s = loadState(), n = 0; COURSE.lessons.forEach(function(l){ if(s.lessons[l.id] && s.lessons[l.id].done) n++; }); return n; }
  function nextLesson(){
    var s = loadState();
    for(var i = 0; i < COURSE.lessons.length; i++){ var l = COURSE.lessons[i]; if(!(s.lessons[l.id] && s.lessons[l.id].done)) return l; }
    return null;
  }
  function missedByTopic(){
    var s = loadState(), out = {};
    Object.keys(s.missed).forEach(function(id){ var it = itemIndex[id]; if(it) (out[it.topic] = out[it.topic] || []).push(id); });
    return out;
  }
  function markDay(){
    var s = loadState(), t = today();
    if(s.days.indexOf(t) === -1) s.days.push(t);
    if(s.days.length > 60) s.days = s.days.slice(-60);
  }
  function streak(){
    var s = loadState(), n = 0, d = new Date(), set = {};
    s.days.forEach(function(x){ set[x] = 1; });
    function key(dt){ return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
    if(!set[key(d)]) d.setDate(d.getDate() - 1);
    while(set[key(d)]){ n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function weekCount(){
    var s = loadState(), ws = weekStart(), n = 0;
    s.completions.forEach(function(c){ if(c.at >= ws) n++; });
    return n;
  }

  /* ---------------- Audio ----------------
     Las grabaciones de Leo (screen.audio) se rotulan "Escuchar a Leo". Las frases en ingles usan voz sintetica
     (Kokoro) y se rotulan "Escuchar" o "Escuchar los ejemplos". Nunca hay autoplay. Si falta el mp3, el boton se oculta. */
  var snd = null, sndBtn = null, sndQueue = [], sndTimer = null;
  function audioFor(text){ return (typeof ACADEMIA_AUDIO !== 'undefined' && ACADEMIA_AUDIO[text]) ? ACADEMIA_AUDIO[text].f : null; }
  function resetBtn(b){
    if(!b) return;
    b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false');
    var l = b.querySelector('.ac-audio-label'); if(l) l.textContent = b.getAttribute('data-label');
    if(b.hasAttribute('data-icon')) b.firstChild.textContent = b.getAttribute('data-icon');
  }
  function stopAudio(){
    clearTimeout(sndTimer); sndQueue = [];
    if(snd){ try{ snd.pause(); }catch(e){} }
    resetBtn(sndBtn); sndBtn = null;
  }
  function playNext(){
    if(!sndQueue.length){ var b = sndBtn; sndBtn = null; resetBtn(b); return; }
    snd.src = sndQueue.shift();
    var p = snd.play(); if(p && p.catch) p.catch(function(){ stopAudio(); });
  }
  function playList(btn, srcs){
    if(sndBtn === btn){ stopAudio(); return; }
    stopAudio();
    if(!snd){
      snd = new Audio(); snd.preload = 'auto';
      snd.addEventListener('ended', function(){ if(sndQueue.length){ sndTimer = setTimeout(playNext, 380); } else playNext(); });
    }
    snd.onerror = function(){ var b = btn; stopAudio(); if(b) b.hidden = true; };
    sndQueue = srcs.slice(); sndBtn = btn;
    btn.classList.add('is-on'); btn.setAttribute('aria-pressed', 'true');
    var l = btn.querySelector('.ac-audio-label'); if(l) l.textContent = 'Detener';
    if(btn.hasAttribute('data-icon')) btn.firstChild.textContent = '■';
    playNext();
  }
  function leoButton(src){
    var b = el('button', { type: 'button', class: 'ac-leo', 'aria-pressed': 'false', 'data-label': 'Escuchar a Leo' }, [
      el('span', { class: 'ac-leo-ico', 'aria-hidden': 'true', text: '▶' }),
      el('span', { class: 'ac-audio-label', text: 'Escuchar a Leo' })
    ]);
    b.addEventListener('click', function(){ playList(b, [src]); });
    return b;
  }
  function listenButton(texts, label){
    var srcs = texts.map(audioFor);
    if(!srcs.length || srcs.some(function(s){ return !s; })) return null;
    var b = el('button', { type: 'button', class: 'ac-leo ac-listen', 'aria-pressed': 'false', 'data-label': label || 'Escuchar los ejemplos' }, [
      el('span', { class: 'ac-leo-ico', 'aria-hidden': 'true', text: '▶' }),
      el('span', { class: 'ac-audio-label', text: label || 'Escuchar los ejemplos' })
    ]);
    b.addEventListener('click', function(){ playList(b, srcs); });
    return b;
  }
  function itemPlay(text, cls, label){
    var src = audioFor(text); if(!src) return null;
    var b = el('button', { type: 'button', class: cls || 'ac-item-play', 'aria-label': label || ('Escuchar: ' + text), 'aria-pressed': 'false', 'data-label': '', 'data-icon': '▶' }, [
      el('span', { 'aria-hidden': 'true', text: '▶' })
    ]);
    b.addEventListener('click', function(){ playList(b, [src]); });
    return b;
  }
  function phraseButton(text){
    var src = audioFor(text); if(!src) return null;
    var b = el('button', { type: 'button', class: 'ac-phrase-btn', 'aria-pressed': 'false', 'data-label': 'Escuchar la frase' }, [
      el('span', { class: 'ac-leo-ico', 'aria-hidden': 'true', text: '▶' }),
      el('span', { class: 'ac-audio-label', text: 'Escuchar la frase' })
    ]);
    b.addEventListener('click', function(){ playList(b, [src]); });
    return b;
  }

  /* ---------------- Piezas de pantalla de explicación ---------------- */
  function renderScreen(sc){
    var box = el('div', { class: 'ac-screen-body' });
    var texts = Array.isArray(sc.text) ? sc.text : (sc.text ? [sc.text] : []);
    texts.forEach(function(t){ box.appendChild(el('p', { class: 'ac-text', text: t })); });
    if(sc.big) box.appendChild(el('div', { class: 'ac-big', text: sc.big }));
    if(sc.chips){
      var ul = el('ul', { class: 'ac-chips' });
      sc.chips.forEach(function(c){ ul.appendChild(el('li', null, [el('span', { class: 'ac-chip-a', text: c.a }), el('span', { class: 'ac-chip-arrow', 'aria-hidden': 'true', text: '→' }), el('span', { class: 'ac-chip-b', text: c.b })])); });
      box.appendChild(ul);
    }
    if(sc.table){
      var tb = el('table', { class: 'ac-table' });
      var thead = el('thead'), trh = el('tr');
      sc.table.head.forEach(function(h){ trh.appendChild(el('th', { scope: 'col', text: h })); });
      thead.appendChild(trh); tb.appendChild(thead);
      var tbody = el('tbody');
      sc.table.rows.forEach(function(r){
        var tr = el('tr');
        r.forEach(function(c, i){
          var cell = el(i === 0 ? 'th' : 'td', i === 0 ? { scope: 'row' } : null);
          var pb = itemPlay(c, 'ac-cell-play', 'Escuchar: ' + c);
          if(pb) cell.appendChild(el('span', { class: 'ac-cell' }, [pb, el('span', { lang: 'en', text: c })])); else cell.appendChild(document.createTextNode(c));
          tr.appendChild(cell);
        });
        tbody.appendChild(tr);
      });
      tb.appendChild(tbody);
      box.appendChild(el('div', { class: 'ac-table-wrap' }, [tb]));
    }
    if(sc.change){
      box.appendChild(el('div', { class: 'ac-change' }, [
        el('div', { class: 'ac-change-box' }, [el('span', { class: 'ac-change-l', text: sc.change.a.label }), el('span', { class: 'ac-change-t', lang: 'en', text: sc.change.a.text }), el('span', { class: 'ac-es', text: sc.change.a.es })]),
        el('span', { class: 'ac-change-arrow', 'aria-hidden': 'true', text: '↓' }),
        el('div', { class: 'ac-change-box is-b' }, [el('span', { class: 'ac-change-l', text: sc.change.b.label }), el('span', { class: 'ac-change-t', lang: 'en', text: sc.change.b.text }), el('span', { class: 'ac-es', text: sc.change.b.es })])
      ]));
    }
    if(sc.compare){
      box.appendChild(el('div', { class: 'ac-compare' }, [
        el('div', { class: 'ac-wrong' }, [el('span', { class: 'ac-mark', 'aria-hidden': 'true', text: '✕' }), el('span', { class: 'ac-sr', text: 'Incorrecto: ' }), sc.compare.wrong]),
        el('div', { class: 'ac-right' }, [el('span', { class: 'ac-mark', 'aria-hidden': 'true', text: '✓' }), el('span', { class: 'ac-sr', text: 'Correcto: ' }), sc.compare.right])
      ]));
    }
    if(sc.items && sc.items.length){
      var ul2 = el('ul', { class: 'ac-items' });
      sc.items.forEach(function(it){
        var li = el('li', { class: 'ac-item' });
        var ip = itemPlay(it.en); if(ip) li.appendChild(ip);
        li.appendChild(el('span', { class: 'ac-item-txt' }, [el('span', { class: 'ac-en', lang: 'en', text: it.en }), el('span', { class: 'ac-es', text: it.es })]));
        ul2.appendChild(li);
      });
      box.appendChild(ul2);
    }
    if(sc.note) box.appendChild(el('p', { class: 'ac-note', text: sc.note }));
    return box;
  }

  /* ---------------- Actividades ---------------- */
  /* Cada constructor devuelve { node, answer(), correct(ans), text(ans), reveal(ans, ok), lock(), feedbackExtra(ans) } */
  function buildActivity(item, onChange){
    var t = item.type;
    var prompt = el('p', { class: 'ac-q', text: item.q });
    var how = ACADEMIA_HOWTO[t] || {};
    var howT = item.how || how.t, howEx = item.ex || how.ex;
    var wrap = el('div', { class: 'ac-act' }, [
      howT ? el('div', { class: 'ac-how' }, [
        el('p', { class: 'ac-how-t' }, [el('strong', { text: 'Qué hacer: ' }), howT]),
        howEx ? el('p', { class: 'ac-how-ex' }, [el('strong', { text: 'Ejemplo: ' }), el('span', { lang: 'en', text: howEx })]) : null
      ]) : null,
      prompt
    ]);
    var ctl = { node: wrap };

    if(t === 'choice' || t === 'error'){
      var order = shuffle(item.options.map(function(_, i){ return i; }));
      var sel = null, btns = [];
      var list = el('div', { class: 'ac-opts', role: 'group', 'aria-label': 'Opciones' });
      if(item.source) wrap.appendChild(el('p', { class: 'ac-source', lang: 'en', text: item.source }));
      order.forEach(function(oi){
        var b = el('button', { type: 'button', class: 'ac-opt', 'aria-pressed': 'false', lang: t === 'error' || /[A-Za-z]/.test(item.options[oi]) ? 'en' : null, text: item.options[oi] });
        b.addEventListener('click', function(){ if(ctl.locked) return; sel = oi; btns.forEach(function(x){ x.b.setAttribute('aria-pressed', 'false'); x.b.classList.remove('is-sel'); }); b.setAttribute('aria-pressed', 'true'); b.classList.add('is-sel'); onChange(); });
        btns.push({ b: b, oi: oi });
        list.appendChild(b);
      });
      wrap.appendChild(list);
      var right = t === 'choice' ? item.answer : item.wrong;
      ctl.answer = function(){ return sel; };
      ctl.correct = function(a){ return a === right; };
      ctl.text = function(a){ return a === null || a === undefined ? '' : item.options[a]; };
      ctl.right = function(){ return t === 'error' ? item.fix : item.options[right]; };
      ctl.reveal = function(a, ok){
        btns.forEach(function(x){
          if(x.oi === right){ x.b.classList.add('is-right'); x.b.appendChild(el('span', { class: 'ac-flag', text: t === 'error' ? ' ← aquí estaba el error' : ' ✓' })); }
          else if(x.oi === a){ x.b.classList.add('is-wrong'); x.b.appendChild(el('span', { class: 'ac-flag', text: ' ✕' })); }
        });
      };
      ctl.lock = function(){ ctl.locked = true; btns.forEach(function(x){ x.b.disabled = true; }); };
    }
    else if(t === 'type'){
      var input = el('input', { type: 'text', class: 'ac-input', lang: 'en', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Tu respuesta', enterkeyhint: 'done' });
      if(item.source) wrap.appendChild(el('p', { class: 'ac-source', lang: 'en', text: item.source }));
      wrap.appendChild(input);
      input.addEventListener('input', onChange);
      input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); if(ctl.onEnter) ctl.onEnter(); } });
      ctl.answer = function(){ var v = norm(input.value); return v ? v : null; };
      ctl.correct = function(a){
        return item.accepted.some(function(x){
          if(norm(x) === a) return true;
          return item.source && item.source.indexOf('___') !== -1 && norm(item.source.replace('___', x)) === a;
        });
      };
      ctl.text = function(a){ return a || ''; };
      ctl.right = function(){ return item.show; };
      ctl.reveal = function(a, ok){ input.classList.add(ok ? 'is-right' : 'is-wrong'); };
      ctl.lock = function(){ ctl.locked = true; input.readOnly = true; };
      ctl.focus = function(){ try{ input.focus(); }catch(e){} };
    }
    else if(t === 'order'){
      var toks = shuffle(item.tokens.map(function(x, i){ return { w: x, i: i }; }));
      if(item.tokens.length > 1){ var tries = 0; while(toks.every(function(x, k){ return x.i === k; }) && tries++ < 5) toks = shuffle(toks); }
      var placed = [];
      var line = el('div', { class: 'ac-line', 'aria-label': 'Tu frase', role: 'group' });
      var bank = el('div', { class: 'ac-bank', role: 'group', 'aria-label': 'Palabras disponibles' });
      var hint = el('p', { class: 'ac-line-hint', text: 'Toca las palabras en orden.' });
      function paint(){
        line.textContent = ''; bank.textContent = '';
        hint.hidden = placed.length > 0;
        placed.forEach(function(tk, pos){ var b = el('button', { type: 'button', class: 'ac-tok is-placed', lang: 'en', text: tk.w }); b.addEventListener('click', function(){ if(ctl.locked) return; placed.splice(pos, 1); paint(); onChange(); }); line.appendChild(b); });
        toks.forEach(function(tk){ if(placed.indexOf(tk) !== -1) return; var b = el('button', { type: 'button', class: 'ac-tok', lang: 'en', text: tk.w }); b.addEventListener('click', function(){ if(ctl.locked) return; placed.push(tk); paint(); onChange(); }); bank.appendChild(b); });
      }
      paint();
      wrap.appendChild(line); wrap.appendChild(hint); wrap.appendChild(bank);
      ctl.answer = function(){ return placed.length === item.tokens.length ? placed.map(function(x){ return x.w; }).join(' ') : null; };
      ctl.correct = function(a){ return norm(a) === norm(item.tokens.join(' ')); };
      ctl.text = function(a){ return a || ''; };
      ctl.right = function(){ return item.tokens.join(' '); };
      ctl.reveal = function(a, ok){ line.classList.add(ok ? 'is-right' : 'is-wrong'); };
      ctl.lock = function(){ ctl.locked = true; Array.prototype.forEach.call(wrap.querySelectorAll('.ac-tok'), function(b){ b.disabled = true; }); };
    }
    else if(t === 'match'){
      var rights = shuffle(item.pairs.map(function(p, i){ return { w: p[1], i: i }; }));
      var pairedL = {}, pairedR = {}, selL = null, lbtns = [], rbtns = [];
      var cols = el('div', { class: 'ac-match' });
      var colL = el('div', { class: 'ac-col' }), colR = el('div', { class: 'ac-col' });
      function pairNo(li){ return Object.keys(pairedL).sort(function(a, b){ return pairedL[a].t - pairedL[b].t; }).indexOf(String(li)) + 1; }
      function paintM(){
        lbtns.forEach(function(x, li){
          x.classList.toggle('is-sel', selL === li);
          var p = pairedL[li];
          x.setAttribute('data-n', p ? String(pairNo(li)) : '');
          x.classList.toggle('is-paired', !!p);
        });
        rbtns.forEach(function(x, ri){
          var li = pairedR[ri];
          x.setAttribute('data-n', li !== undefined ? String(pairNo(li)) : '');
          x.classList.toggle('is-paired', li !== undefined);
        });
      }
      item.pairs.forEach(function(p, li){
        var b = el('button', { type: 'button', class: 'ac-mbtn', lang: 'en', text: p[0] });
        b.addEventListener('click', function(){
          if(ctl.locked) return;
          if(pairedL[li]){ delete pairedR[pairedL[li].r]; delete pairedL[li]; selL = li; }
          else selL = (selL === li ? null : li);
          paintM(); onChange();
        });
        lbtns.push(b); colL.appendChild(b);
      });
      rights.forEach(function(r, ri){
        var b = el('button', { type: 'button', class: 'ac-mbtn', text: r.w, lang: /[A-Za-z]/.test(r.w) && /^[a-z']+$/i.test(r.w) ? 'en' : null });
        b.addEventListener('click', function(){
          if(ctl.locked) return;
          if(pairedR[ri] !== undefined){ var l0 = pairedR[ri]; delete pairedL[l0]; delete pairedR[ri]; selL = l0; paintM(); onChange(); return; }
          if(selL === null) return;
          pairedL[selL] = { r: ri, t: Date.now() + Object.keys(pairedL).length }; pairedR[ri] = selL; selL = null;
          paintM(); onChange();
        });
        rbtns.push(b); colR.appendChild(b);
      });
      cols.appendChild(colL); cols.appendChild(colR);
      wrap.appendChild(el('p', { class: 'ac-line-hint', text: 'Toca una palabra de la izquierda y luego su pareja de la derecha.' }));
      wrap.appendChild(cols);
      ctl.answer = function(){
        if(Object.keys(pairedL).length !== item.pairs.length) return null;
        return item.pairs.map(function(p, li){ return rights[pairedL[li].r].i; });
      };
      ctl.correct = function(a){ return a.every(function(ri, li){ return ri === li; }); };
      ctl.text = function(a){ return a ? a.map(function(ri, li){ return item.pairs[li][0] + ' → ' + item.pairs[ri][1]; }).join(', ') : ''; };
      ctl.right = function(){ return item.pairs.map(function(p){ return p[0] + ' → ' + p[1]; }).join(', '); };
      ctl.reveal = function(a, ok){
        lbtns.forEach(function(x, li){ var good = rights[pairedL[li].r].i === li; x.classList.add(good ? 'is-right' : 'is-wrong'); });
        rbtns.forEach(function(x, ri){ var li = pairedR[ri]; x.classList.add(rights[ri].i === li ? 'is-right' : 'is-wrong'); });
      };
      ctl.lock = function(){ ctl.locked = true; lbtns.concat(rbtns).forEach(function(b){ b.disabled = true; }); };
    }
    else if(t === 'write'){
      var ta = el('textarea', { class: 'ac-input ac-area', rows: '3', lang: 'en', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', 'aria-label': 'Tu frase', placeholder: 'Escribe aquí en inglés' });
      wrap.appendChild(ta);
      wrap.appendChild(el('p', { class: 'ac-line-hint', text: 'Ejemplo: ' + item.example }));
      ta.addEventListener('input', onChange);
      var failMsg = '';
      ctl.answer = function(){ var v = ta.value.trim(); return v.split(/\s+/).length >= 2 ? v : null; };
      ctl.correct = function(a){
        failMsg = '';
        for(var i = 0; i < item.checks.length; i++){
          if(!new RegExp(item.checks[i].re, item.checks[i].flags || '').test(a.replace(/[‘’]/g, "'"))){ failMsg = item.checks[i].msg; return false; }
        }
        return true;
      };
      ctl.text = function(a){ return a || ''; };
      ctl.right = function(){ return item.example; };
      ctl.extra = function(){ return failMsg; };
      ctl.reveal = function(a, ok){ ta.classList.add(ok ? 'is-right' : 'is-wrong'); };
      ctl.lock = function(){ ctl.locked = true; ta.readOnly = true; };
      ctl.focus = function(){ try{ ta.focus(); }catch(e){} };
    }
    return ctl;
  }

  /* Explica POR QUE esa opcion no era la correcta (no solo cual era la correcta). */
  var WORD_RULE = {
    'am': 'Am solo va con I.',
    'is': 'Is va con he, she, it y con una sola persona o cosa.',
    'are': 'Are va con you, we, they y con varias personas o cosas.',
    "isn't": "Isn't va con he, she, it y con una sola persona o cosa.",
    "aren't": "Aren't va con you, we, they y con varias personas o cosas."
  };
  function wrongReason(item, mine){
    if(item.wrongWhy && mine && item.wrongWhy[mine]) return item.wrongWhy[mine];
    if(item.type === 'choice' && mine){
      var w = norm(mine);
      if(WORD_RULE[w] && item.options.every(function(o){ return WORD_RULE[norm(o)]; })) return 'Elegiste ' + mine + '. ' + WORD_RULE[w];
    }
    return '';
  }

  /* ---------------- Ejecución de una serie de actividades ---------------- */
  /* opts: { items:[item], onDone(stats), onProgress(pos,total), mode:'practice'|'exam', startQueue? } */
  function runActivities(host, opts){
    var queue = (opts.startQueue || opts.items.map(function(it){ return { it: it, attempt: 1 }; })).slice();
    var total = opts.items.length;
    var firstOk = opts.firstOk || 0, shown = opts.shown || 0, missedNow = opts.missedNow ? opts.missedNow.slice() : [];
    var answers = [];
    var s = loadState();

    function persist(){ if(opts.persist) opts.persist({ queue: queue.map(function(q){ return [q.it.id, q.attempt]; }), firstOk: firstOk, shown: shown, missedNow: missedNow }); }

    function step(){
      host.textContent = '';
      if(!queue.length){ finish(); return; }
      var cur = queue[0];
      var item = cur.it;
      if(opts.onProgress) opts.onProgress(Math.min(shown, total), total, cur.attempt === 2);
      persist();

      var card = el('section', { class: 'ac-card ac-card-act', 'aria-labelledby': 'acQ', 'data-id': item.id });
      var tag = cur.attempt === 2 ? el('p', { class: 'ac-retry-tag', text: 'Otra vez, con calma' }) : null;
      if(tag) card.appendChild(tag);
      var fbHost = el('div', { class: 'ac-fb-host', 'aria-live': 'polite' });
      var btnCheck = el('button', { type: 'button', class: 'ac-btn ac-btn-primary ac-btn-wide', disabled: true, text: opts.mode === 'exam' ? 'Siguiente' : 'Comprobar' });
      var ctl = buildActivity(item, function(){ btnCheck.disabled = ctl.answer() === null; });
      ctl.onEnter = function(){ if(!btnCheck.disabled) btnCheck.click(); };
      var qEl = ctl.node.querySelector('.ac-q'); qEl.id = 'acQ'; qEl.setAttribute('tabindex', '-1');
      card.appendChild(ctl.node);
      card.appendChild(fbHost);
      var foot = el('div', { class: 'ac-actions' }, [btnCheck]);
      card.appendChild(foot);
      host.appendChild(card);

      btnCheck.addEventListener('click', function(){
        if(btnCheck.disabled || ctl.locked) return;
        var ans = ctl.answer(); if(ans === null) return;
        var ok = ctl.correct(ans);
        if(opts.mode === 'exam'){
          answers.push({ item: item, ok: ok, text: ctl.text(ans), right: ctl.right() });
          queue.shift(); shown++;
          step(); return;
        }
        ctl.lock(); ctl.reveal(ans, ok);
        var s2 = loadState();
        if(cur.attempt === 1){ shown++; if(ok) firstOk++; else { missedNow.push(item.id); if(!opts.demo) s2.missed[item.id] = Date.now(); } }
        if(ok && !opts.demo){ delete s2.missed[item.id]; s2.cleared[item.id] = Date.now(); }
        if(NUBE){ NUBE.recordAnswer(item.id, ok); if(NUBE.pendingMistakes >= 8) NUBE.flushMistakes(); }
        if(!opts.demo) saveState();
        queue.shift();
        var willRetry = !ok && cur.attempt === 1;
        if(willRetry) queue.push({ it: item, attempt: 2 });
        persist();

        var fb = el('div', { class: 'ac-fb ' + (ok ? 'is-ok' : 'is-bad'), role: 'status' });
        fb.appendChild(el('p', { class: 'ac-fb-h', text: ok ? '¡Correcto!' : (cur.attempt === 1 ? 'Todavía no.' : 'Esta vez no salió.') }));
        if(!ok){
          var extra = ctl.extra ? ctl.extra() : '';
          if(extra) fb.appendChild(el('p', { class: 'ac-fb-p', text: extra }));
          fb.appendChild(el('p', { class: 'ac-fb-p' }, [(item.type === 'write' ? 'Un ejemplo: ' : (item.type === 'error' ? 'Debía ser: ' : 'Respuesta correcta: ')), el('strong', { lang: 'en', text: ctl.right() })]));
        }
        if(!ok){
          var mine = ctl.text(ans);
          if((item.type === 'type' || item.type === 'write') && mine) fb.appendChild(el('p', { class: 'ac-fb-p' }, ['Escribiste: ', el('span', { lang: 'en', text: mine })]));
          var ww = wrongReason(item, mine);
          if(ww) fb.appendChild(el('p', { class: 'ac-fb-p', text: ww }));
        }
        if(item.why) fb.appendChild(el('p', { class: 'ac-fb-p', text: item.why }));
        if(willRetry) fb.appendChild(el('p', { class: 'ac-fb-note', text: 'Lo volveremos a ver al final para que lo practiques una vez más.' }));
        else if(!ok) fb.appendChild(el('p', { class: 'ac-fb-note', text: 'Guardamos este punto en tu repaso.' }));
        var sent = academiaSentence(item), pbtn = sent ? phraseButton(sent) : null;
        if(pbtn){ fb.appendChild(el('p', { class: 'ac-fb-p ac-fb-sent' }, [el('span', { lang: 'en', text: sent })])); fb.appendChild(pbtn); }
        fbHost.appendChild(fb);
        btnCheck.textContent = queue.length ? 'Continuar' : 'Terminar';
        btnCheck.disabled = false;
        var again = btnCheck.cloneNode(true);
        btnCheck.parentNode.replaceChild(again, btnCheck);
        again.addEventListener('click', function(){ step(); });
        try{ again.focus(); }catch(e){}
        try{ fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }catch(e){}
      });
      if(ctl.focus && opts.autofocus !== false) setTimeout(ctl.focus, 30);
      else try{ qEl.focus({ preventScroll: true }); }catch(e){}
    }

    function finish(){
      if(opts.mode === 'exam') opts.onDone({ answers: answers });
      else opts.onDone({ firstOk: firstOk, total: total, missedNow: missedNow });
    }
    step();
  }

  /* ---------------- Vistas ---------------- */
  function setTitle(t){ document.title = t + ' - Academia - Inglés con Leo'; }
  function focusMain(){
    var h = root.querySelector('[data-focus]');
    if(h){ h.setAttribute('tabindex', '-1'); try{ h.focus({ preventScroll: true }); }catch(e){} }
    window.scrollTo(0, 0);
  }
  function progressBar(p, label){
    return el('div', { class: 'ac-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(p)), 'aria-label': label || 'Progreso' }, [el('span', { style: 'width:' + Math.max(0, Math.min(100, p)) + '%' })]);
  }
  function link(href, text, cls){ return el('a', { href: href, class: cls || 'ac-btn', text: text }); }
  function setTabs(active){
    tabs.hidden = !active;
    if(!active) return;
    Array.prototype.forEach.call(tabs.querySelectorAll('a'), function(a){
      var on = a.getAttribute('data-tab') === active;
      a.classList.toggle('is-on', on);
      if(on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function pilotBanner(){
    if(NUBE) return document.createTextNode('');     // con la cuenta conectada el avance sí se guarda y cuenta: el aviso del piloto ya no aplica
    return el('p', { class: 'ac-pilot' }, [el('strong', { text: 'Piloto de prueba. ' }), 'Tu avance se guarda solo en este navegador y no cuenta en tus estadísticas. La evaluación es práctica y no da insignia ni certificado.']);
  }

  /* ---- Mi ruta ---- */
  function viewHome(){
    setTabs('ruta'); setTitle('Mi aprendizaje');
    var s = loadState();
    var nl = nextLesson();
    var dc = doneCount();
    var pct = dc / COURSE.lessons.length * 100;
    root.textContent = '';
    root.appendChild(el('div', { class: 'ac-head' }, [el('p', { class: 'ac-eyebrow', text: 'Miembros' }), el('h1', { class: 'ac-h1', 'data-focus': '', text: 'Mi aprendizaje' })]));
    root.appendChild(pilotBanner());

    var resume = pendingResume();
    var target = resume || nl;
    var hero = el('section', { class: 'ac-hero', 'aria-label': 'Continuar' });
    hero.appendChild(el('p', { class: 'ac-eyebrow', text: 'Curso disponible' }));
    hero.appendChild(el('h2', { class: 'ac-hero-h', text: COURSE.title }));
    hero.appendChild(el('div', { class: 'ac-hero-row' }, [el('span', { text: dc + ' de ' + COURSE.lessons.length + ' lecciones' }), el('strong', { text: Math.round(pct) + ' %' })]));
    hero.appendChild(progressBar(pct, 'Avance del curso'));
    var mid = el('div', { class: 'ac-hero-next' });
    var cta;
    if(target){
      mid.appendChild(el('p', { class: 'ac-hero-meta', text: 'Lección ' + target.n + ' de ' + COURSE.lessons.length + (resume ? ' · la dejaste a medias' : (dc === 0 ? ' · para empezar' : ' · sigue aquí')) }));
      mid.appendChild(el('p', { class: 'ac-hero-lesson', text: target.title }));
      mid.appendChild(el('p', { class: 'ac-hero-meta', text: 'Unos ' + target.minutes + ' minutos' }));
    } else {
      mid.appendChild(el('p', { class: 'ac-hero-meta', text: 'Curso ' + COURSE.title }));
      mid.appendChild(el('p', { class: 'ac-hero-lesson', text: 'Terminaste las ' + COURSE.lessons.length + ' lecciones' }));
      mid.appendChild(el('p', { class: 'ac-hero-meta', text: 'Ahora puedes probar la evaluación de práctica.' }));
    }
    cta = link(target ? '#/curso/to-be/leccion/' + target.n : '#/curso/to-be/evaluacion', 'Continuar aprendiendo', 'ac-btn ac-btn-primary ac-btn-wide ac-btn-xl');
    hero.appendChild(mid); hero.appendChild(cta);
    hero.appendChild(el('a', { href: '#/curso/to-be', class: 'ac-hero-link', text: 'Ver todas las lecciones del curso' }));
    root.appendChild(hero);

    /* Repaso recomendado */
    var mb = missedByTopic(), topics = Object.keys(mb);
    if(topics.length && s.snooze !== today()){
      var weakest = topics.sort(function(a, b){ return mb[b].length - mb[a].length; })[0];
      var names = topics.slice(0, 2).map(function(t){ return COURSE.topics[t].toLowerCase(); }).join(' y ');
      var nItems = Math.min(8, mb[weakest].length);
      root.appendChild(el('section', { class: 'ac-review', 'aria-label': 'Repaso recomendado' }, [
        el('p', { class: 'ac-eyebrow ac-eyebrow-amber', text: 'Repaso recomendado' }),
        el('p', { class: 'ac-review-t', text: 'Detectamos dificultades con: ' + names + '.' }),
        el('div', { class: 'ac-review-row' }, [
          el('span', { class: 'ac-hero-meta', text: 'Unos ' + Math.max(2, Math.ceil(nItems * 0.6)) + ' minutos' }),
          el('div', { class: 'ac-review-btns' }, [
            el('button', { type: 'button', class: 'ac-btn ac-btn-quiet', text: 'Ahora no', onclick: function(){ var st = loadState(); st.snooze = today(); saveState(); viewHome(); } }),
            link('#/curso/to-be/repaso/' + weakest + (resume && target ? '?volver=' + encodeURIComponent('#/curso/to-be/leccion/' + target.n) : ''), 'Repasar', 'ac-btn ac-btn-outline')
          ])
        ])
      ]));
    }

    /* Meta semanal: discreta, no compite con el boton principal */
    var goalBox = el('div', { class: 'ac-goal', 'aria-label': 'Meta semanal opcional' });
    if(!s.goal){
      goalBox.appendChild(el('span', { class: 'ac-goal-q', text: 'Meta semanal (opcional):' }));
      CFG.weeklyGoals.forEach(function(g){ goalBox.appendChild(el('button', { type: 'button', class: 'ac-goal-opt', text: g + ' lecciones', onclick: function(){ var st = loadState(); st.goal = g; st.goalAt = Date.now(); saveState(); track('meta_semanal', { meta: g }); viewHome(); } })); });
    } else {
      var wc = weekCount(), g = s.goal;
      var segs = el('span', { class: 'ac-segs', 'aria-hidden': 'true' });
      for(var i = 0; i < g; i++) segs.appendChild(el('span', { class: i < wc ? 'is-on' : '' }));
      goalBox.appendChild(el('span', { class: 'ac-goal-q', text: 'Meta semanal: ' + Math.min(wc, g) + ' de ' + g + ' lecciones' }));
      goalBox.appendChild(segs);
      if(streak() >= 2) goalBox.appendChild(el('span', { class: 'ac-goal-q', text: 'Racha: ' + streak() + ' días' }));
      goalBox.appendChild(el('button', { type: 'button', class: 'ac-goal-opt', text: 'Cambiar', onclick: function(){ var st = loadState(); st.goal = null; st.goalAt = Date.now(); saveState(); viewHome(); } }));
    }
    root.appendChild(goalBox);

    /* Lo que viene: sin dar la impresion de una ruta ya avanzada */
    var soon = ACADEMIA.route.courses.filter(function(c){ return c.soon; });
    var next = el('section', { class: 'ac-soon', 'aria-label': 'Próximos cursos' }, [
      el('h2', { class: 'ac-h2 ac-h2-in', text: 'Lo que viene' }),
      el('p', { class: 'ac-text', text: 'TO BE es el primer curso abierto de la academia. Estamos preparando la ruta ' + ACADEMIA.route.title + ', con estos cursos más:' }),
      el('ul', { class: 'ac-soon-list' }, soon.map(function(c){ return el('li', { text: c.title }); }))
    ]);
    root.appendChild(next);
    focusMain();
  }

  /* ---- Practicar ---- */
  function viewPracticar(){
    setTabs('practicar'); setTitle('Practicar');
    var s = loadState(), mb = missedByTopic(), nMissed = Object.keys(s.missed).filter(function(id){ return itemIndex[id]; }).length;
    root.textContent = '';
    root.appendChild(el('div', { class: 'ac-head' }, [el('p', { class: 'ac-eyebrow', text: 'Miembros' }), el('h1', { class: 'ac-h1', 'data-focus': '', text: 'Practicar' })]));
    root.appendChild(el('p', { class: 'ac-lead', text: 'Aquí sigues practicando con lo de siempre y repasas lo que fallaste en el curso.' }));
    var ul = el('ul', { class: 'ac-courses' });
    function card(href, t, sub, ext){
      return el('li', { class: 'ac-course is-open' }, [el('a', { href: href, class: 'ac-course-a' }, [
        el('span', { class: 'ac-course-b' }, [el('span', { class: 'ac-course-t', text: t }), el('span', { class: 'ac-course-s', text: sub })]),
        el('span', { class: 'ac-course-go', 'aria-hidden': 'true', text: '›' })])]);
    }
    ul.appendChild(card(nMissed ? '#/curso/to-be/repaso/todo' : '#/curso/to-be', nMissed ? 'Repasar mis errores del curso' : 'Repasar mis errores del curso', nMissed ? nMissed + (nMissed === 1 ? ' punto guardado' : ' puntos guardados') + ' en TO BE' : 'Todavía no tienes errores guardados. Aquí aparecerán.'));
    ul.appendChild(card(SITE.practica, 'Ejercicios de práctica', 'Gramática, vocabulario, listening, lectura, speaking y escritura, con corrección.'));
    ul.appendChild(card(SITE.plan, 'Mi plan de estudio', 'Lo que te toca hoy según tus errores.'));
    ul.appendChild(card(SITE.progreso, 'Mi progreso', 'Tus sesiones, rachas y temas.'));
    root.appendChild(ul);
    root.appendChild(el('p', { class: 'ac-foot', text: NUBE ? 'Tus errores del curso TO BE se suman a tu plan de estudio y a tu progreso.' : 'Los ejercicios del curso TO BE se guardan en este navegador.' }));
    focusMain();
  }

  /* ---- Curso ---- */
  function viewCourse(){
    setTabs('ruta'); setTitle(COURSE.title);
    var s = loadState(), dc = doneCount(), pct = dc / COURSE.lessons.length * 100;
    root.textContent = '';
    root.appendChild(el('a', { href: '#/', class: 'ac-back', text: '← Mi ruta' }));
    root.appendChild(el('p', { class: 'ac-eyebrow', text: 'Curso disponible' }));
    root.appendChild(el('h1', { class: 'ac-h1', 'data-focus': '', text: COURSE.title }));
    root.appendChild(el('p', { class: 'ac-lead', text: COURSE.tagline }));
    root.appendChild(el('p', { class: 'ac-text', text: COURSE.goal }));
    root.appendChild(el('div', { class: 'ac-hero-row' }, [el('span', { text: dc + ' de ' + COURSE.lessons.length + ' lecciones' }), el('strong', { text: Math.round(pct) + ' %' })]));
    root.appendChild(progressBar(pct, 'Avance del curso'));

    var nl = nextLesson();
    var ol = el('ol', { class: 'ac-lessons' });
    COURSE.lessons.forEach(function(l){
      var st = s.lessons[l.id] || {};
      var done = !!st.done, isNext = nl && nl.id === l.id;
      var resume = !!s.resume[l.id];
      var sub = done ? 'Completada' + (st.firstOk !== undefined ? ' · ' + st.firstOk + ' de ' + st.total + ' a la primera' : '') : (resume ? 'La dejaste a medias · sigue donde ibas' : l.minutes + ' min · ' + l.summary);
      var mark = el('span', { class: 'ac-ln' + (done ? ' is-done' : (isNext ? ' is-now' : '')), 'aria-hidden': 'true', text: done ? '✓' : String(l.n) });
      ol.appendChild(el('li', { class: 'ac-lesson' + (isNext ? ' is-next' : '') }, [
        el('a', { href: '#/curso/to-be/leccion/' + l.n, class: 'ac-lesson-a' }, [
          mark,
          el('span', { class: 'ac-lesson-b' }, [el('span', { class: 'ac-lesson-t', text: l.title }), el('span', { class: 'ac-lesson-s', text: sub })]),
          el('span', { class: 'ac-course-go', 'aria-hidden': 'true', text: done ? 'Repasar' : (resume ? 'Seguir' : '›') })
        ])
      ]));
    });
    var best = s.exam.best;
    var ready = dc === COURSE.lessons.length;
    var examSub = best !== null ? 'Mejor práctica: ' + best + ' %' : CFG.examSize + ' preguntas · práctica, no certifica';
    ol.appendChild(el('li', { class: 'ac-lesson ac-lesson-exam' + (ready && best === null ? ' is-next' : '') }, [
      el('a', { href: '#/curso/to-be/evaluacion', class: 'ac-lesson-a' }, [
        el('span', { class: 'ac-ln ac-ln-exam' + (best !== null && best >= CFG.passPct ? ' is-done' : ''), 'aria-hidden': 'true', text: best !== null && best >= CFG.passPct ? '✓' : '★' }),
        el('span', { class: 'ac-lesson-b' }, [el('span', { class: 'ac-lesson-t', text: 'Evaluación final (práctica)' }), el('span', { class: 'ac-lesson-s', text: ready ? examSub : 'Se recomienda al terminar las lecciones. Puedes presentarla antes.' })]),
        el('span', { class: 'ac-course-go', 'aria-hidden': 'true', text: '›' })
      ])
    ]));
    root.appendChild(ol);

    var target = pendingResume() || nl;
    root.appendChild(el('div', { class: 'ac-sticky' }, [
      target ? link('#/curso/to-be/leccion/' + target.n, (pendingResume() ? 'Seguir: ' : 'Continuar: ') + target.title, 'ac-btn ac-btn-primary ac-btn-wide ac-btn-xl') : link('#/curso/to-be/evaluacion', 'Hacer la evaluación de práctica', 'ac-btn ac-btn-primary ac-btn-wide ac-btn-xl')
    ]));
    focusMain();
  }

  /* ---- Lección ---- */
  var run = null;
  function viewLesson(n){
    var lesson = lessonByN(n);
    if(!lesson){ location.hash = '#/curso/to-be'; return; }
    setTabs(null); setTitle(lesson.title);
    stopAudio();
    var s = loadState();
    var S = lesson.screens.length, A = lesson.activities.length;
    var r = s.resume[lesson.id] || null;
    run = { lesson: lesson, stage: r ? r.stage : 'learn', idx: r && r.stage === 'learn' ? Math.min(r.idx, S - 1) : 0, saved: r && r.stage === 'practice' ? r : null };
    if(!r) track('leccion_iniciada', { curso: 'to-be', leccion: lesson.n });
    drawLesson();
  }
  function saveResume(patch){
    var s = loadState(), prev = s.resume[run.lesson.id];
    s.resume[run.lesson.id] = Object.assign({ lessonId: run.lesson.id, t0: (prev && prev.t0) || Date.now(), at: Date.now() }, patch);
    s.last = run.lesson.id;
    saveState();
  }
  function lessonShell(title, pos, total, content){
    var topbar = el('div', { class: 'ac-top' }, [
      el('a', { href: safeBack() || '#/curso/to-be', class: 'ac-exit', 'aria-label': 'Salir de la lección', onclick: function(){ stopAudio(); }, text: '← Salir' }),
      el('span', { class: 'ac-top-t', text: title })
    ]);
    var frag = el('div', null, [topbar, progressBar(total ? pos / total * 100 : 0, 'Progreso de la lección'), el('p', { class: 'ac-step', 'aria-live': 'polite', text: pos < total ? 'Paso ' + (pos + 1) + ' de ' + total : 'Lección completa' })]);
    frag.appendChild(content);
    return frag;
  }
  function drawLesson(){
    var l = run.lesson, S = l.screens.length, A = l.activities.length, total = S + A;
    root.textContent = '';
    stopAudio();
    if(run.stage === 'learn'){
      var sc = l.screens[run.idx];
      var card = el('section', { class: 'ac-card', 'aria-labelledby': 'acH' }, [
        el('p', { class: 'ac-kicker', text: 'Lección ' + l.n + ' · ' + (run.idx + 1) + ' de ' + S }),
        el('h1', { class: 'ac-h1 ac-h1-sm', id: 'acH', 'data-focus': '', text: sc.title }),
        el('div', { class: 'ac-audio-row' }, [sc.audio ? leoButton(sc.audio) : null, sc.listen ? listenButton(sc.listen.map(function(x){ return typeof x === 'string' ? x : x.t; }), sc.listen.length > 1 ? 'Escuchar los ejemplos' : 'Escuchar') : null]),
        renderScreen(sc)
      ]);
      var nav = el('div', { class: 'ac-nav' }, [
        el('button', { type: 'button', class: 'ac-btn ac-btn-ghost', disabled: run.idx === 0, text: '← Anterior', onclick: function(){ run.idx--; saveResume({ stage: 'learn', idx: run.idx }); drawLesson(); } }),
        el('button', { type: 'button', class: 'ac-btn ac-btn-primary', text: run.idx === S - 1 ? 'Practicar' : 'Siguiente →', onclick: function(){
          if(run.idx === S - 1){ run.stage = 'practice'; saveResume({ stage: 'practice' }); } else { run.idx++; saveResume({ stage: 'learn', idx: run.idx }); }
          drawLesson();
        } })
      ]);
      var wrap = el('div', null, [card, nav]);
      root.appendChild(lessonShell(l.title, run.idx, total, wrap));
      saveResume({ stage: 'learn', idx: run.idx });
      focusMain();
      return;
    }
    if(run.stage === 'practice'){
      var host = el('div');
      var barHost = el('div');
      var shell = el('div');
      root.appendChild(shell);
      var items = l.activities;
      var startQueue = null, firstOk = 0, shownAt = 0, missedNow = [];
      if(run.saved && run.saved.queue && run.saved.queue.length){
        startQueue = run.saved.queue.map(function(q){ return { it: itemIndex[q[0]], attempt: q[1] }; }).filter(function(q){ return q.it; });
        firstOk = run.saved.firstOk || 0; shownAt = run.saved.shown || 0; missedNow = run.saved.missedNow || [];
        if(!startQueue.length) startQueue = null;
      }
      function paintShell(pos, retry){
        shell.textContent = '';
        shell.appendChild(lessonShell(l.title, S + pos, total, host));
      }
      paintShell(shownAt);
      run.saved = null;
      runActivities(host, {
        items: items, startQueue: startQueue, firstOk: firstOk, shown: shownAt, missedNow: missedNow, mode: 'practice',
        persist: function(p){ saveResume({ stage: 'practice', queue: p.queue, firstOk: p.firstOk, shown: p.shown, missedNow: p.missedNow }); },
        onProgress: function(pos){
          var bar = shell.querySelector('.ac-bar span'); if(bar) bar.style.width = ((S + pos) / total * 100) + '%';
          var st = shell.querySelector('.ac-step'); if(st) st.textContent = 'Actividad ' + Math.min(pos + 1, A) + ' de ' + A;
        },
        onDone: function(res){ run.result = res; run.stage = 'done'; drawLesson(); }
      });
      return;
    }
    if(run.stage === 'done'){
      var res = run.result || { firstOk: 0, total: A, missedNow: [] };
      var s = loadState();
      var first = !(s.lessons[l.id] && s.lessons[l.id].done);
      if(!run.recorded){                       // la pantalla final puede redibujarse: registrar la lección UNA sola vez por intento
        run.recorded = true;
        s.lessons[l.id] = { done: true, doneAt: Date.now(), firstOk: res.firstOk, total: res.total };
        s.completions.push({ id: l.id, at: Date.now() });
        var t0 = s.resume[l.id] && s.resume[l.id].t0;
        run.startedAt = (t0 && Date.now() - t0 < 10800000) ? t0 : Date.now() - 300000;
        delete s.resume[l.id]; if(s.last === l.id) s.last = null;
        markDay();
        saveState();
        if(NUBE){
          var resList = l.activities.map(function(a){ return { id: a.id, ok: res.missedNow.indexOf(a.id) === -1 }; });
          NUBE.flushMistakes();
          NUBE.recordLesson(l, resList, run.startedAt);
          cloudPush();
        }
        track('leccion_completada', { curso: 'to-be', leccion: l.n, aciertos: res.firstOk, total: res.total, primera_vez: first });
        if(first && COURSE.lessons.every(function(x){ return s.lessons[x.id] && s.lessons[x.id].done; })) track('curso_lecciones_completas', { curso: 'to-be' });
      }
      var nxt = nextLesson();
      var card2 = el('section', { class: 'ac-card ac-card-end', 'aria-labelledby': 'acH' }, [
        el('p', { class: 'ac-kicker', text: 'Lección ' + l.n + ' completa' }),
        el('h1', { class: 'ac-h1 ac-h1-end', id: 'acH', 'data-focus': '', text: '¡Lección completa!' }),
        el('p', { class: 'ac-text', text: 'Acertaste ' + res.firstOk + ' de ' + res.total + ' a la primera.' + (res.missedNow.length ? ' Guardamos ' + res.missedNow.length + (res.missedNow.length === 1 ? ' punto' : ' puntos') + ' para tu repaso.' : ' Sin errores, muy bien.') }),
        el('div', { class: 'ac-cansay' }, [
          el('p', { class: 'ac-cansay-h', text: 'Ahora puedes decir...' }),
          el('ul', { class: 'ac-cansay-list' }, l.canSay.map(function(x){ var pb = itemPlay(x, 'ac-item-play ac-item-play-sm'); return el('li', null, [pb, el('span', { lang: 'en', text: x })]); }))
        ])
      ]);
      var acts = el('div', { class: 'ac-nav ac-nav-col' });
      var bb = backButton(safeBack());
      if(bb) acts.appendChild(bb);
      if(nxt && nxt.id !== l.id && !bb){ acts.appendChild(link('#/curso/to-be/leccion/' + nxt.n, 'Siguiente lección: ' + nxt.title, 'ac-btn ac-btn-primary ac-btn-wide')); }
      else if(!nxt && !bb){ acts.appendChild(link('#/curso/to-be/evaluacion', NUBE ? 'Ir a la evaluación del curso' : 'Hacer la evaluación de práctica', 'ac-btn ac-btn-primary ac-btn-wide')); }
      acts.appendChild(link('#/curso/to-be', 'Volver al curso', 'ac-btn ac-btn-outline ac-btn-wide'));
      root.appendChild(lessonShell(l.title, total, total, el('div', null, [card2, acts])));
      focusMain();
    }
  }

  /* ---- Repaso ---- */
  function viewReview(topic){
    setTabs(null); setTitle('Repaso');
    var s = loadState(), mb = missedByTopic();
    var ids = (topic === 'todo' ? Object.keys(s.missed) : (mb[topic] || [])).filter(function(id){ return itemIndex[id]; }).slice(0, 8);
    root.textContent = '';
    var name = topic === 'todo' ? 'tus errores' : (COURSE.topics[topic] || 'tema').toLowerCase();
    if(!ids.length){
      root.appendChild(el('section', { class: 'ac-card ac-card-end' }, [
        el('h1', { class: 'ac-h1', 'data-focus': '', text: 'Nada pendiente por repasar' }),
        el('p', { class: 'ac-text', text: 'No tienes errores guardados en este tema.' }),
        link('#/', 'Volver a mi ruta', 'ac-btn ac-btn-primary')
      ]));
      focusMain(); return;
    }
    var items = ids.map(function(id){ return itemIndex[id]; });
    var host = el('div');
    var shell = el('div', null, [
      el('div', { class: 'ac-top' }, [el('a', { href: safeBack() || '#/', class: 'ac-exit', text: '← Salir' }), el('span', { class: 'ac-top-t', text: 'Repaso: ' + name })]),
      progressBar(0, 'Progreso del repaso'),
      el('p', { class: 'ac-step', 'aria-live': 'polite', text: 'Repaso de ' + items.length + ' actividades' }),
      host
    ]);
    root.appendChild(shell);
    track('repaso_iniciado', { tema: topic });
    runActivities(host, {
      items: items, mode: 'practice',
      onProgress: function(pos, total){ var bar = shell.querySelector('.ac-bar span'); if(bar) bar.style.width = (pos / total * 100) + '%'; var st = shell.querySelector('.ac-step'); if(st) st.textContent = 'Actividad ' + Math.min(pos + 1, total) + ' de ' + total; },
      onDone: function(res){
        var st = loadState(); st.completions.push({ id: 'repaso-' + topic, at: Date.now() }); markDay(); saveState();
        root.textContent = '';
        root.appendChild(el('section', { class: 'ac-card ac-card-end' }, [
          el('p', { class: 'ac-kicker', text: 'Repaso completo' }),
          el('h1', { class: 'ac-h1 ac-h1-end', 'data-focus': '', text: '¡Repaso completo!' }),
          el('p', { class: 'ac-text', text: 'Acertaste ' + res.firstOk + ' de ' + res.total + ' a la primera.' + (res.missedNow.length ? ' Los puntos que fallaste siguen guardados para otro repaso.' : ' Ya no tienes pendientes en este tema.') })
        ]));
        var rb = backButton(safeBack());
        root.appendChild(el('div', { class: 'ac-nav ac-nav-col' }, rb ? [rb, link('#/curso/to-be', 'Ver el curso', 'ac-btn ac-btn-outline ac-btn-wide')] : [link('#/curso/to-be', 'Volver al curso', 'ac-btn ac-btn-primary ac-btn-wide'), link('#/', 'Ir a mi ruta', 'ac-btn ac-btn-outline ac-btn-wide')]));
        if(NUBE) cloudFlush();
        focusMain();
      }
    });
  }

  /* ---- Evaluación de práctica ---- */
  function buildExam(){
    var topics = Object.keys(COURSE.topics), picked = [];
    var last = loadState().exam.lastIds || [];
    topics.forEach(function(t){
      var pool = COURSE.exam.bank.filter(function(x){ return x.topic === t; });
      var fresh = pool.filter(function(x){ return last.indexOf(x.id) === -1; });
      var pick = shuffle(fresh).slice(0, CFG.examPerTopic);
      if(pick.length < CFG.examPerTopic){ pick = pick.concat(shuffle(pool.filter(function(x){ return pick.indexOf(x) === -1; })).slice(0, CFG.examPerTopic - pick.length)); }
      picked = picked.concat(pick);
    });
    var qs = shuffle(picked).slice(0, CFG.examSize);
    var st = loadState(); st.exam.lastIds = qs.map(function(q){ return q.id; }); saveState();
    return qs;
  }
  function viewExam(){
    if(NUBE && bootState === 'ready') return viewOfficialExam();
    if(NUBE && bootState === 'pending'){
      setTabs(null); setTitle('Evaluación del curso'); root.textContent = '';
      root.appendChild(el('div', null, [el('a', { href: '#/curso/to-be', class: 'ac-back', text: '← Curso' }), el('section', { class: 'ac-card' }, [el('p', { class: 'ac-text', role: 'status', text: 'Conectando con tu cuenta...' })])]));
      bootWaiters.push(function(){ if(location.hash.indexOf('evaluacion') !== -1) viewExam(); });
      return;
    }
    if(NUBE && bootState === 'failed'){
      setTabs(null); setTitle('Evaluación del curso'); root.textContent = '';
      root.appendChild(el('div', null, [el('a', { href: '#/curso/to-be', class: 'ac-back', text: '← Curso' }),
        el('section', { class: 'ac-card' }, [el('h1', { class: 'ac-h1 ac-h1-sm', 'data-focus': '', text: 'La evaluación no está disponible ahora' }), el('p', { class: 'ac-text', text: 'No pudimos conectar con tu cuenta. Revisa tu conexión e inténtalo de nuevo. Tu avance está a salvo.' }),
          el('button', { type: 'button', class: 'ac-btn ac-btn-primary', text: 'Reintentar', onclick: function(){ bootTries = 0; bootState = 'pending'; viewExam(); bootCloud(); } }), ' ', link('#/curso/to-be/practica', 'Hacer una práctica', 'ac-btn ac-btn-outline')])]));
      focusMain(); return;
    }
    return viewPracticeExam();
  }
  function viewPracticeExam(){
    setTabs(null); setTitle('Evaluación de práctica');
    stopAudio();
    var s = loadState(), dc = doneCount();
    root.textContent = '';
    var ready = dc === COURSE.lessons.length;
    var intro = el('section', { class: 'ac-card', 'aria-labelledby': 'acH' }, [
      el('p', { class: 'ac-kicker', text: 'Curso To be · Evaluación final' }),
      el('h1', { class: 'ac-h1 ac-h1-sm', id: 'acH', 'data-focus': '', text: 'Evaluación de práctica' }),
      el('p', { class: 'ac-practice-tag', text: 'Práctica: no da insignia ni certificado' }),
      el('p', { class: 'ac-text', text: 'Sirve para ver cómo vas antes de la evaluación oficial.' }),
      el('ul', { class: 'ac-rules' }, [
        el('li', { text: CFG.examSize + ' preguntas de los 5 temas del curso.' }),
        el('li', { text: 'Para superarla necesitas ' + CFG.passPct + ' %, es decir ' + Math.ceil(CFG.examSize * CFG.passPct / 100) + ' de ' + CFG.examSize + '.' }),
        el('li', { text: 'No hay pistas ni explicaciones hasta el final.' }),
        el('li', { text: 'Cada intento usa preguntas distintas.' }),
        el('li', { text: 'Si no la superas, no pierdes nada de lo que ya avanzaste.' })
      ]),
      ready ? null : el('p', { class: 'ac-hint', text: 'Aún no terminas las 5 lecciones. Puedes presentarla ahora si ya dominas el tema, o seguir primero con las lecciones.' })
    ]);
    var acts = el('div', { class: 'ac-nav ac-nav-col' }, [
      el('button', { type: 'button', class: 'ac-btn ac-btn-primary ac-btn-wide', text: 'Empezar la práctica', onclick: startExam }),
      link(ready ? '#/curso/to-be' : '#/curso/to-be/leccion/' + (nextLesson() || COURSE.lessons[0]).n, ready ? 'Volver al curso' : 'Seguir con las lecciones', 'ac-btn ac-btn-outline ac-btn-wide')
    ]);
    root.appendChild(el('div', null, [el('a', { href: '#/curso/to-be', class: 'ac-back', text: '← Curso' }), intro, acts]));
    focusMain();

    function startExam(){
      var qs = buildExam();
      root.textContent = '';
      var host = el('div');
      var shell = el('div', null, [
        el('div', { class: 'ac-top' }, [el('a', { href: '#/curso/to-be', class: 'ac-exit', text: '← Salir' }), el('span', { class: 'ac-top-t', text: 'Evaluación de práctica' })]),
        progressBar(0, 'Progreso de la evaluación'),
        el('p', { class: 'ac-step', 'aria-live': 'polite', text: 'Pregunta 1 de ' + qs.length }),
        host
      ]);
      root.appendChild(shell);
      track('evaluacion_practica_iniciada', { curso: 'to-be' });
      window.scrollTo(0, 0);
      runActivities(host, {
        items: qs, mode: 'exam',
        onProgress: function(pos, total){ var bar = shell.querySelector('.ac-bar span'); if(bar) bar.style.width = (pos / total * 100) + '%'; var st = shell.querySelector('.ac-step'); if(st) st.textContent = 'Pregunta ' + Math.min(pos + 1, total) + ' de ' + total; },
        onDone: function(res){ showExamResult(res.answers); }
      });
    }
  }
  function showExamResult(answers){
    setTabs(null);
    var s = loadState();
    var correct = answers.filter(function(a){ return a.ok; }).length, total = answers.length;
    var pct = Math.round(correct / total * 100);
    var passed = pct >= CFG.passPct;
    var byTopic = {};
    answers.forEach(function(a){ var t = a.item.topic; byTopic[t] = byTopic[t] || { ok: 0, n: 0 }; byTopic[t].n++; if(a.ok) byTopic[t].ok++; });
    answers.forEach(function(a){
      if(a.ok){ delete s.missed[a.item.id]; s.cleared[a.item.id] = Date.now(); } else s.missed[a.item.id] = Date.now();
      if(NUBE) NUBE.recordAnswer(a.item.id, a.ok);
    });
    if(NUBE) NUBE.flushMistakes();
    s.exam.attempts.push({ at: Date.now(), pct: pct, correct: correct, total: total, passed: passed });
    if(s.exam.best === null || pct > s.exam.best) s.exam.best = pct;
    markDay(); saveState();
    track('evaluacion_practica_terminada', { curso: 'to-be', porcentaje: pct, aprobada_practica: passed });

    root.textContent = '';
    var head = el('section', { class: 'ac-card ac-card-end', 'aria-labelledby': 'acH' }, [
      el('p', { class: 'ac-kicker', text: 'Resultado de la práctica' }),
      el('h1', { class: 'ac-h1 ac-h1-sm', id: 'acH', 'data-focus': '', text: passed ? '¡Superaste la práctica!' : (pct >= 60 ? 'Todavía no, vas cerca' : 'Todavía no, sigue practicando') }),
      el('p', { class: 'ac-score', text: pct + ' %' }),
      el('p', { class: 'ac-text', text: 'Respondiste ' + correct + ' de ' + total + ' bien. Para superarla necesitas ' + CFG.passPct + ' %.' + (passed ? '' : ' Tus lecciones siguen completadas.') }),
      el('p', { class: 'ac-practice-tag', text: 'Es una práctica: no da insignia ni certificado.' })
    ]);
    root.appendChild(head);

    var topicsCard = el('section', { class: 'ac-card' }, [el('h2', { class: 'ac-h2 ac-h2-in', text: 'Por tema' })]);
    var weak = [];
    Object.keys(COURSE.topics).forEach(function(t){
      var b = byTopic[t]; if(!b) return;
      var p = Math.round(b.ok / b.n * 100), good = p >= CFG.passPct;
      if(!good) weak.push(t);
      topicsCard.appendChild(el('div', { class: 'ac-trow' }, [
        el('span', { class: 'ac-trow-n', text: COURSE.topics[t] }),
        el('span', { class: 'ac-trow-bar', 'aria-hidden': 'true' }, [el('span', { class: good ? 'is-good' : 'is-mid', style: 'width:' + p + '%' })]),
        el('span', { class: 'ac-trow-v', text: b.ok + ' de ' + b.n + (good ? ' · bien' : ' · repasar') })
      ]));
    });
    root.appendChild(topicsCard);

    if(weak.length){
      var rec = el('section', { class: 'ac-review' }, [
        el('p', { class: 'ac-eyebrow ac-eyebrow-amber', text: 'Te recomendamos' }),
        el('p', { class: 'ac-review-t', text: weak.length > 2 ? 'Repasa los temas marcados y vuelve a intentarlo.' : 'Repasar ' + weak.map(function(t){ return COURSE.topics[t].toLowerCase(); }).join(' y ') + ' y volver a intentarlo.' })
      ]);
      weak.forEach(function(t){
        var l = lessonOfTopic(t);
        var row = el('div', { class: 'ac-rec-row' }, [link('#/curso/to-be/repaso/' + t, 'Repasar mis errores', 'ac-btn ac-btn-outline')]);
        if(l) row.appendChild(link('#/curso/to-be/leccion/' + l.n, 'Ver la lección ' + l.n, 'ac-btn ac-btn-quiet'));
        rec.appendChild(el('p', { class: 'ac-rec-t', text: COURSE.topics[t] }));
        rec.appendChild(row);
      });
      root.appendChild(rec);
    }

    var wrongs = answers.filter(function(a){ return !a.ok; });
    if(wrongs.length){
      var det = el('details', { class: 'ac-details' }, [el('summary', { text: 'Ver las ' + wrongs.length + ' que fallaste' })]);
      wrongs.forEach(function(a){
        det.appendChild(el('div', { class: 'ac-wrongq' }, [
          el('p', { class: 'ac-wq-q', text: a.item.q + (a.item.source ? '  ' + a.item.source : '') }),
          el('p', { class: 'ac-wq-a' }, ['Tu respuesta: ', el('span', { lang: 'en', text: a.text || '(sin respuesta)' })]),
          el('p', { class: 'ac-wq-a' }, [a.item.type === 'error' ? 'Debía ser: ' : 'Correcta: ', el('strong', { lang: 'en', text: a.right })]),
          a.item.why ? el('p', { class: 'ac-wq-w', text: a.item.why }) : null
        ]));
      });
      root.appendChild(det);
    }
    root.appendChild(el('div', { class: 'ac-nav ac-nav-col' }, [
      el('button', { type: 'button', class: 'ac-btn ac-btn-primary ac-btn-wide', text: 'Intentar otra práctica', onclick: function(){ viewPracticeExam(); } }),
      link('#/curso/to-be', 'Volver al curso', 'ac-btn ac-btn-outline ac-btn-wide')
    ]));
    focusMain();
  }


  /* ---- Evaluación OFICIAL (la corrige el servidor; da insignia) ---- */
  var DRAFT_KEY = 'leo_academia_exam_draft_v1';
  function toClientItem(p){
    // El navegador NO conoce la respuesta: estos campos son de relleno para dibujar la actividad. La nota la da el servidor.
    var it = { id: p.id, type: p.type, topic: p.topic, q: p.q, source: p.source, ex: p.ex };
    if(p.type === 'choice'){ it.options = p.options; it.answer = 0; }
    else if(p.type === 'error'){ it.options = p.options; it.wrong = 0; it.fix = ''; }
    else if(p.type === 'type'){ it.accepted = []; it.show = ''; }
    else if(p.type === 'order'){ it.tokens = p.tokens; }
    return it;
  }
  function answerFor(a){
    if(a.item.type === 'order') return (a.text || '').split(' ');
    return a.text || '';
  }
  function readDraft(){ try{ return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); }catch(e){ return null; } }
  function writeDraft(d){ try{ if(d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); else localStorage.removeItem(DRAFT_KEY); }catch(e){} }

  function viewOfficialExam(){
    setTabs(null); setTitle('Evaluación del curso');
    stopAudio();
    root.textContent = '';
    var box = el('div', null, [el('a', { href: '#/curso/to-be', class: 'ac-back', text: '← Curso' }), el('section', { class: 'ac-card' }, [el('p', { class: 'ac-text', text: 'Un momento...' })])]);
    root.appendChild(box);
    NUBE.examStatus().then(function(st){
      if(location.hash.indexOf('evaluacion') === -1) return;
      var dc = doneCount(), ready = dc === COURSE.lessons.length;
      root.textContent = '';
      if(!st || !st.ok){
        root.appendChild(el('div', null, [el('a', { href: '#/curso/to-be', class: 'ac-back', text: '← Curso' }),
          el('section', { class: 'ac-card' }, [el('h1', { class: 'ac-h1 ac-h1-sm', 'data-focus': '', text: 'La evaluación no está disponible ahora' }), el('p', { class: 'ac-text', text: 'No pudimos conectar con tu cuenta. Revisa tu conexión e inténtalo de nuevo. Tu avance está a salvo.' }),
            el('button', { type: 'button', class: 'ac-btn ac-btn-primary', text: 'Reintentar', onclick: viewOfficialExam }), ' ', link('#/curso/to-be/practica', 'Hacer una práctica', 'ac-btn ac-btn-outline')])]));
        focusMain(); return;
      }
      var needed = Math.ceil(st.exam_size * st.pass_pct / 100);
      var intro = el('section', { class: 'ac-card', 'aria-labelledby': 'acH' }, [
        el('p', { class: 'ac-kicker', text: 'Curso To be · Evaluación final' }),
        el('h1', { class: 'ac-h1 ac-h1-sm', id: 'acH', 'data-focus': '', text: st.badge ? 'Ya conseguiste la insignia' : 'Evaluación del curso' }),
        st.badge ? el('p', { class: 'ac-text', text: 'Tu mejor resultado: ' + st.best_pct + ' %. Puedes repetirla cuando quieras para mejorarlo.' }) : el('p', { class: 'ac-text', text: 'Si la superas, ganas la insignia del curso.' }),
        el('ul', { class: 'ac-rules' }, [
          el('li', { text: st.exam_size + ' preguntas de los 5 temas del curso.' }),
          el('li', { text: 'Para superarla necesitas ' + st.pass_pct + ' %, es decir ' + needed + ' de ' + st.exam_size + '.' }),
          el('li', { text: 'No hay pistas ni explicaciones hasta el final.' }),
          el('li', { text: 'Puedes hacerla ' + st.attempts_left + (st.attempts_left === 1 ? ' vez' : ' veces') + ' más hoy.' }),
          el('li', { text: 'Si no la superas, no pierdes nada de lo que ya avanzaste.' })
        ]),
        ready ? null : el('p', { class: 'ac-hint', text: 'Aún no terminas las 5 lecciones. Puedes presentarla ahora si ya dominas el tema.' }),
        !st.can_take ? el('p', { class: 'ac-hint', text: 'La evaluación con insignia es para miembros. Puedes hacer la práctica sin límite.' }) : null,
        st.can_take && st.attempts_left < 1 ? el('p', { class: 'ac-hint', text: 'Hoy ya usaste tus intentos. Vuelve mañana; mientras tanto puedes repasar.' }) : null
      ]);
      var acts = el('div', { class: 'ac-nav ac-nav-col' }, [
        st.can_take && st.attempts_left > 0 ? el('button', { type: 'button', class: 'ac-btn ac-btn-primary ac-btn-wide', id: 'acStartOfficial', text: readDraft() ? 'Enviar mis respuestas guardadas' : 'Empezar la evaluación', onclick: startOfficial }) : null,
        link('#/curso/to-be/practica', 'Hacer una práctica sin nota', 'ac-btn ac-btn-outline ac-btn-wide'),
        link('#/curso/to-be', 'Volver al curso', 'ac-btn ac-btn-quiet ac-btn-wide')
      ]);
      root.appendChild(el('div', null, [el('a', { href: '#/curso/to-be', class: 'ac-back', text: '← Curso' }), intro, acts]));
      focusMain();
    });

    function startOfficial(){
      var draft = readDraft();
      if(draft && draft.attempt){ submitOfficial(draft.attempt, draft.answers); return; }
      NUBE.examStart().then(function(r){
        if(!r || !r.ok){
          var msg = r && r.error === 'limit' ? 'Hoy ya usaste tus intentos. Vuelve mañana.' : (r && r.error === 'members' ? 'La evaluación con insignia es para miembros.' : 'No pudimos empezar la evaluación. Revisa tu conexión e inténtalo de nuevo.');
          var old = root.querySelector('.ac-fb-start'); if(old) old.remove();
          root.appendChild(el('p', { class: 'ac-hint ac-fb-start', role: 'alert', text: msg })); return;
        }
        runOfficial(r);
      });
    }
    function runOfficial(r){
      var qs = r.items.map(toClientItem);
      root.textContent = '';
      var host = el('div');
      var shell = el('div', null, [
        el('div', { class: 'ac-top' }, [el('a', { href: '#/curso/to-be', class: 'ac-exit', text: '← Salir' }), el('span', { class: 'ac-top-t', text: 'Evaluación del curso' })]),
        progressBar(0, 'Progreso de la evaluación'),
        el('p', { class: 'ac-step', 'aria-live': 'polite', text: 'Pregunta 1 de ' + qs.length }),
        host
      ]);
      root.appendChild(shell);
      track('evaluacion_oficial_iniciada', { curso: 'to-be' });
      window.scrollTo(0, 0);
      runActivities(host, {
        items: qs, mode: 'exam',
        onProgress: function(pos, total){ var bar = shell.querySelector('.ac-bar span'); if(bar) bar.style.width = (pos / total * 100) + '%'; var st = shell.querySelector('.ac-step'); if(st) st.textContent = 'Pregunta ' + Math.min(pos + 1, total) + ' de ' + total; },
        onDone: function(res){
          var answers = {};
          res.answers.forEach(function(a){ answers[a.item.id] = answerFor(a); });
          writeDraft({ attempt: r.attempt_id, answers: answers });   // si se corta la conexión, no se pierde lo respondido
          submitOfficial(r.attempt_id, answers);
        }
      });
    }
    function submitOfficial(attempt, answers){
      root.textContent = '';
      root.appendChild(el('section', { class: 'ac-card ac-card-end' }, [el('p', { class: 'ac-text', role: 'status', text: 'Corrigiendo tu evaluación...' })]));
      NUBE.examSubmit(attempt, answers).then(function(res){
        if(res && res.ok){ writeDraft(null); showOfficialResult(res); return; }
        if(res && (res.error === 'already_submitted' || res.error === 'attempt' || res.error === 'expired')){ writeDraft(null); viewOfficialExam(); return; }
        root.textContent = '';
        root.appendChild(el('section', { class: 'ac-card ac-card-end' }, [
          el('h1', { class: 'ac-h1 ac-h1-sm', 'data-focus': '', text: 'No pudimos enviar tus respuestas' }),
          el('p', { class: 'ac-text', text: 'Tus respuestas están guardadas en este dispositivo. Revisa tu conexión y vuelve a intentarlo.' }),
          el('button', { type: 'button', class: 'ac-btn ac-btn-primary ac-btn-wide', text: 'Reintentar', onclick: function(){ submitOfficial(attempt, answers); } })
        ]));
        focusMain();
      });
    }
  }
  function showOfficialResult(res){
    setTabs(null);
    var s = loadState();
    markDay(); saveState();
    track('evaluacion_oficial_terminada', { curso: 'to-be', porcentaje: res.score_pct, aprobada: !!res.passed });
    if(res.passed) track('evaluacion_oficial_aprobada', { curso: 'to-be', porcentaje: res.score_pct });
    root.textContent = '';
    root.appendChild(el('section', { class: 'ac-card ac-card-end', 'aria-labelledby': 'acH' }, [
      el('p', { class: 'ac-kicker', text: 'Resultado de la evaluación' }),
      el('h1', { class: 'ac-h1 ac-h1-sm', id: 'acH', 'data-focus': '', text: res.passed ? '¡Superaste el curso!' : (res.score_pct >= 60 ? 'Todavía no, vas cerca' : 'Todavía no, sigue practicando') }),
      el('p', { class: 'ac-score', text: res.score_pct + ' %' }),
      el('p', { class: 'ac-text', text: 'Respondiste ' + res.correct + ' de ' + res.total + ' bien. Para superarla necesitas ' + res.pass_pct + ' %.' + (res.passed ? '' : ' Tus lecciones siguen completadas.') }),
      res.passed ? el('p', { class: 'ac-badge-won', role: 'status', text: 'Insignia conseguida: Domina el verbo TO BE' }) : null
    ]));
    var weak = [];
    var topicsCard = el('section', { class: 'ac-card' }, [el('h2', { class: 'ac-h2 ac-h2-in', text: 'Por tema' })]);
    Object.keys(COURSE.topics).forEach(function(t){
      var b = res.per_topic && res.per_topic[t]; if(!b) return;
      var p = Math.round(b.ok / b.n * 100), good = p >= res.pass_pct;
      if(!good) weak.push(t);
      topicsCard.appendChild(el('div', { class: 'ac-trow' }, [
        el('span', { class: 'ac-trow-n', text: COURSE.topics[t] }),
        el('span', { class: 'ac-trow-bar', 'aria-hidden': 'true' }, [el('span', { class: good ? 'is-good' : 'is-mid', style: 'width:' + p + '%' })]),
        el('span', { class: 'ac-trow-v', text: b.ok + ' de ' + b.n + (good ? ' · bien' : ' · repasar') })
      ]));
    });
    root.appendChild(topicsCard);
    if(weak.length && !res.passed){
      var rec = el('section', { class: 'ac-review' }, [
        el('p', { class: 'ac-eyebrow ac-eyebrow-amber', text: 'Te recomendamos' }),
        el('p', { class: 'ac-review-t', text: weak.length > 2 ? 'Repasa las lecciones marcadas y vuelve a intentarlo.' : 'Repasar ' + weak.map(function(t){ return COURSE.topics[t].toLowerCase(); }).join(' y ') + ' y volver a intentarlo.' })
      ]);
      weak.forEach(function(t){
        var l = lessonOfTopic(t);
        if(l){ rec.appendChild(el('p', { class: 'ac-rec-t', text: COURSE.topics[t] })); rec.appendChild(el('div', { class: 'ac-rec-row' }, [link('#/curso/to-be/leccion/' + l.n + '?volver=' + encodeURIComponent('#/curso/to-be/evaluacion'), 'Ver la lección ' + l.n, 'ac-btn ac-btn-outline')])); }
      });
      root.appendChild(rec);
    }
    var wrongs = res.review || [];
    if(wrongs.length){
      var det = el('details', { class: 'ac-details' }, [el('summary', { text: 'Ver las ' + wrongs.length + ' que fallaste' })]);
      wrongs.forEach(function(a){
        det.appendChild(el('div', { class: 'ac-wrongq' }, [
          el('p', { class: 'ac-wq-a' }, [el('span', { text: COURSE.topics[a.topic] || '' })]),
          el('p', { class: 'ac-wq-a' }, ['Correcta: ', el('strong', { lang: 'en', text: a.right || '' })]),
          a.why ? el('p', { class: 'ac-wq-w', text: a.why }) : null
        ]));
      });
      root.appendChild(det);
    }
    root.appendChild(el('div', { class: 'ac-nav ac-nav-col' }, [
      el('a', { href: '#/logros', class: 'ac-btn ac-btn-primary ac-btn-wide', text: res.passed ? 'Ver mi insignia' : 'Ver mis logros' }),
      link('#/curso/to-be', 'Volver al curso', 'ac-btn ac-btn-outline ac-btn-wide')
    ]));
    focusMain();
  }

  /* ---- Mis logros ---- */
  function viewLogros(){
    setTabs('logros'); setTitle('Mis logros');
    var s = loadState(), dc = doneCount();
    root.textContent = '';
    root.appendChild(el('div', { class: 'ac-head' }, [el('p', { class: 'ac-eyebrow', text: 'Miembros' }), el('h1', { class: 'ac-h1', 'data-focus': '', text: 'Mis logros' })]));
    root.appendChild(pilotBanner());
    root.appendChild(el('div', { class: 'ac-stats' }, [
      el('div', { class: 'ac-stat' }, [el('strong', { text: dc + ' de ' + COURSE.lessons.length }), el('span', { text: 'lecciones de TO BE' })]),
      el('div', { class: 'ac-stat' }, [el('strong', { text: s.exam.best !== null ? s.exam.best + ' %' : 'Sin hacer' }), el('span', { text: 'mejor práctica' })]),
      el('div', { class: 'ac-stat' }, [el('strong', { text: String(streak()) }), el('span', { text: streak() === 1 ? 'día seguido' : 'días seguidos' })])
    ]));
    var badgeCard = el('section', { class: 'ac-card', id: 'acBadge' }, [
      el('h2', { class: 'ac-h2 ac-h2-in', text: 'Insignia del curso TO BE' }),
      el('p', { class: 'ac-text', id: 'acBadgeT', text: NUBE && NUBE.ready ? 'Se entrega al superar la evaluación del curso. La corrige el servidor, así que no se puede copiar ni cambiar.' : 'Se entrega al aprobar la evaluación oficial del curso, que se corrige en el servidor. En el piloto la evaluación es de práctica, así que todavía no se entrega ninguna insignia.' }),
      el('p', { class: 'ac-text', text: 'Cuando haya más cursos aparecerán aquí sus insignias y, al completar la ruta, un certificado propio de Inglés con Leo con enlace público para verificarlo. No equivale a un nivel oficial.' })
    ]);
    root.appendChild(badgeCard);
    if(NUBE && NUBE.ready){
      NUBE.badge().then(function(b){
        var t = document.getElementById('acBadgeT'); if(!t || !b) return;
        t.textContent = 'Conseguida: Domina el verbo TO BE, con ' + b.score_pct + ' %.'; t.className = 'ac-text ac-badge-won';
      });
      root.appendChild(el('p', { class: 'ac-hero-meta ac-sync', id: 'acSync', text: NUBE.online ? 'Tu avance se guarda en tu cuenta y lo ves en cualquier dispositivo.' : 'Sin conexión: tu avance se guardará en tu cuenta al volver.' }));
    }
    var reset = el('div', { class: 'ac-reset' });
    function drawReset(confirm){
      reset.textContent = '';
      if(!confirm){ reset.appendChild(el('button', { type: 'button', class: 'ac-link', text: 'Borrar mi avance de prueba', onclick: function(){ drawReset(true); } })); }
      else {
        reset.appendChild(el('span', { class: 'ac-hero-meta', text: '¿Seguro? Se borra el avance de este navegador.' }));
        reset.appendChild(el('button', { type: 'button', class: 'ac-btn ac-btn-outline', text: 'Sí, borrar', onclick: function(){ resetState(); viewLogros(); } }));
        reset.appendChild(el('button', { type: 'button', class: 'ac-btn ac-btn-quiet', text: 'Cancelar', onclick: function(){ drawReset(false); } }));
      }
    }
    drawReset(false);
    root.appendChild(reset);
    focusMain();
  }


  /* ---------------- Cuenta gratis y visitantes: presentacion + una demostracion ---------------- */
  var DEMO = COURSE.demo;
  var SALE_TEXT = '¡Muy bien! Ya empezaste a utilizar AM, IS y ARE. Continúa con afirmaciones, negaciones y preguntas. Completa el curso TO BE, practica sin límites y consigue tu primera insignia con Inglés con Leo. Desbloquea la academia por $2 USD al mes.';
  var PAY_URL = 'miembros.html?pagar=1';
  function msgCard(title, text, actions){
    setTabs('ruta'); root.textContent = '';
    root.appendChild(el('section', { class: 'ac-card' }, [el('h1', { class: 'ac-h1 ac-h1-sm', 'data-focus': '', text: title }), el('p', { class: 'ac-text', role: 'status', text: text })].concat(actions || [])));
    focusMain();
  }
  function viewPresentation(){
    setTabs('ruta'); setTitle('Academia');
    root.textContent = '';
    root.appendChild(el('div', { class: 'ac-head' }, [el('p', { class: 'ac-eyebrow', text: 'Academia' }), el('h1', { class: 'ac-h1', 'data-focus': '', text: 'Academia Inglés con Leo' })]));
    root.appendChild(el('p', { class: 'ac-lead', text: 'Cursos cortos, con explicación sencilla, práctica corregida y un repaso que se adapta a tus errores. Es parte de la membresía.' }));
    var course = el('section', { class: 'ac-hero', 'aria-label': 'Curso disponible' });
    course.appendChild(el('p', { class: 'ac-eyebrow', text: 'Curso disponible' }));
    course.appendChild(el('h2', { class: 'ac-hero-h', text: COURSE.title }));
    course.appendChild(el('p', { class: 'ac-text', text: COURSE.goal }));
    var ul = el('ol', { class: 'ac-lessons' });
    COURSE.lessons.forEach(function(l){
      ul.appendChild(el('li', { class: 'ac-lesson' }, [el('div', { class: 'ac-lesson-a' }, [
        el('span', { class: 'ac-ln', 'aria-hidden': 'true', text: String(l.n) }),
        el('span', { class: 'ac-lesson-b' }, [el('span', { class: 'ac-lesson-t', text: l.title }), el('span', { class: 'ac-lesson-s', text: l.minutes + ' min · ' + l.summary })])
      ])]));
    });
    course.appendChild(ul);
    course.appendChild(el('p', { class: 'ac-hero-meta', text: 'Al final, una evaluación corregida por el servidor y tu primera insignia de Inglés con Leo.' }));
    root.appendChild(course);

    var box = el('section', { class: 'ac-card', 'aria-label': 'Cómo empezar' });
    if(mode === 'anon'){
      box.appendChild(el('h2', { class: 'ac-h2 ac-h2-in', text: 'Prueba el curso gratis' }));
      box.appendChild(el('p', { class: 'ac-text', text: 'Crea tu cuenta gratis y haz una prueba corta de TO BE: una explicación y tres ejercicios.' }));
      box.appendChild(el('a', { href: 'miembros.html?modo=registro&volver=academia.html', class: 'ac-btn ac-btn-primary ac-btn-wide', text: 'Crear mi cuenta gratis' }));
    } else if(mode === 'free'){
      var d = ACC && ACC.demo ? ACC.demo : null, left = ACC && ACC.daily ? ACC.daily.remaining : null;
      if(d && d.available || (d && d.resumable)){
        box.appendChild(el('h2', { class: 'ac-h2 ac-h2-in', text: 'Prueba TO BE gratis' }));
        box.appendChild(el('p', { class: 'ac-text', text: 'Una explicación y tres ejercicios. Usa 3 de tus ' + (ACC.daily.limit || 6) + ' ejercicios gratis de hoy y solo se puede hacer una vez.' }));
        box.appendChild(link('#/curso/to-be/demo', 'Probar TO BE gratis', 'ac-btn ac-btn-primary ac-btn-wide'));
      } else if(d && d.used){
        box.appendChild(el('h2', { class: 'ac-h2 ac-h2-in', text: 'Ya hiciste tu prueba gratis' }));
        box.appendChild(el('p', { class: 'ac-text', text: 'Para seguir con las lecciones, la práctica sin límites, la evaluación y tu insignia, desbloquea la academia.' }));
      } else {
        box.appendChild(el('h2', { class: 'ac-h2 ac-h2-in', text: 'Tu prueba gratis está lista' }));
        box.appendChild(el('p', { class: 'ac-text', text: 'Hoy no te alcanzan los ejercicios gratis para la prueba (necesita 3' + (left !== null ? ' y te quedan ' + left : '') + '). Vuelve mañana, o desbloquea la academia y practica sin límites.' }));
      }
      box.appendChild(link(PAY_URL, 'Desbloquear mi academia', 'ac-btn ac-btn-' + ((d && (d.available || d.resumable)) ? 'outline' : 'primary') + ' ac-btn-wide'));
    } else if(mode === 'unknown'){
      box.appendChild(el('h2', { class: 'ac-h2 ac-h2-in', text: 'No pudimos conectar con tu cuenta' }));
      box.appendChild(el('p', { class: 'ac-text', text: 'Revisa tu conexión e inténtalo de nuevo. Tu avance está a salvo.' }));
      box.appendChild(el('button', { type: 'button', class: 'ac-btn ac-btn-primary', text: 'Reintentar', onclick: function(){ bootTries = 0; mode = 'pending'; bootState = 'pending'; route(); bootCloud(); } }));
    } else {
      box.appendChild(el('h2', { class: 'ac-h2 ac-h2-in', text: 'La academia no está disponible ahora' }));
      box.appendChild(el('p', { class: 'ac-text', text: 'Mientras tanto, puedes seguir practicando gratis.' }));
      box.appendChild(el('a', { href: SITE.practica, class: 'ac-btn ac-btn-primary', text: 'Practicar gratis' }));
    }
    root.appendChild(box);

    var soon = ACADEMIA.route.courses.filter(function(c){ return c.soon; });
    if(soon.length){
      var sl = el('ul', { class: 'ac-soon' });
      soon.forEach(function(c){ sl.appendChild(el('li', null, [el('strong', { text: c.title }), ' · Próximamente. ', c.blurb])); });
      root.appendChild(el('section', { class: 'ac-card' }, [el('h2', { class: 'ac-h2 ac-h2-in', text: 'Próximamente' }), sl]));
    }
    root.appendChild(el('section', { class: 'ac-card' }, [
      el('h2', { class: 'ac-h2 ac-h2-in', text: 'Tus logros' }),
      el('p', { class: 'ac-text', text: 'Al aprobar la evaluación de un curso consigues su insignia, y cuando haya más cursos podrás completar rutas con un certificado propio de Inglés con Leo. No equivale a un nivel oficial.' })
    ]));
    focusMain();
    // Al volver (por ejemplo despues de la prueba) se actualiza el estado real desde el servidor, una sola vez por dibujo.
    if(NUBE && NUBE.ready && mode === 'free' && !viewPresentation.fresh){
      var before = JSON.stringify(ACC && ACC.demo), mine = ++viewPresentation.seq;
      refreshAccess().then(function(a){
        if(viewPresentation.seq !== mine || !a || !a.ok || JSON.stringify(a.demo) === before || (mode === 'free' && /demo|curso/.test(location.hash))) return;
        viewPresentation.fresh = true; viewPresentation(); viewPresentation.fresh = false;
      });
    }
  }
  viewPresentation.seq = 0; viewPresentation.fresh = false;

  function viewDemo(){
    if(mode === 'member'){ location.hash = '#/curso/to-be'; return; }
    if(mode !== 'free'){ viewPresentation(); return; }
    setTabs(null); setTitle(DEMO.title); stopAudio();
    msgCard('Preparando tu prueba', 'Un momento...');
    var token = {}; viewDemo.token = token;
    NUBE.demoStart().then(function(r){
      if(viewDemo.token !== token || location.hash.indexOf('/demo') === -1) return;
      if(!r || !r.ok){
        var m = r && r.error;
        if(m === 'members'){ mode = 'member'; return route(); }
        var text = m === 'limit' ? 'Hoy no te alcanzan los ejercicios gratis para esta prueba. Vuelve mañana, o desbloquea la academia y practica sin límites.'
          : (m === 'demo_used' ? 'Ya hiciste tu prueba gratis. Para seguir con el curso completo, desbloquea la academia.' : 'No pudimos empezar la prueba ahora. Revisa tu conexión e inténtalo de nuevo.');
        msgCard(m === 'demo_used' ? 'Ya hiciste tu prueba gratis' : 'La prueba no está disponible ahora', text, [
          (m === 'demo_used' || m === 'limit') ? link(PAY_URL, 'Desbloquear mi academia', 'ac-btn ac-btn-primary ac-btn-wide') : el('button', { type: 'button', class: 'ac-btn ac-btn-primary', text: 'Reintentar', onclick: viewDemo }),
          ' ', link('#/', 'Volver', 'ac-btn ac-btn-outline')
        ]);
        return;
      }
      track('demo_iniciada', { curso: 'to-be', retomada: !!r.resumed });
      drawDemo(0);
    });
  }
  function drawDemo(stage){
    root.textContent = '';
    stopAudio();
    var topbar = el('div', { class: 'ac-top' }, [el('a', { href: '#/', class: 'ac-exit', onclick: stopAudio, text: '← Salir' }), el('span', { class: 'ac-top-t', text: DEMO.title })]);
    if(stage === 0){
      var sc = DEMO.screen;
      var card = el('section', { class: 'ac-card', 'aria-labelledby': 'acH' }, [
        el('p', { class: 'ac-kicker', text: 'Prueba gratis · explicación' }),
        el('h1', { class: 'ac-h1 ac-h1-sm', id: 'acH', 'data-focus': '', text: sc.title }),
        el('div', { class: 'ac-audio-row' }, [sc.audio ? leoButton(sc.audio) : null]),
        renderScreen(sc)
      ]);
      root.appendChild(el('div', null, [topbar, progressBar(0, 'Progreso de la prueba'), card, el('div', { class: 'ac-nav' }, [el('button', { type: 'button', class: 'ac-btn ac-btn-primary ac-btn-wide', text: 'Practicar', onclick: function(){ drawDemo(1); } })])]));
      focusMain(); return;
    }
    var host = el('div'), A = DEMO.activities.length, startedAt = Date.now();
    var shell = el('div', null, [topbar, progressBar(0, 'Progreso de la prueba'), el('p', { class: 'ac-step', 'aria-live': 'polite', text: 'Ejercicio 1 de ' + A }), host]);
    root.appendChild(shell);
    runActivities(host, {
      items: DEMO.activities, mode: 'practice', demo: true,
      onProgress: function(pos){
        var bar = shell.querySelector('.ac-bar span'); if(bar) bar.style.width = (pos / A * 100) + '%';
        var st = shell.querySelector('.ac-step'); if(st) st.textContent = 'Ejercicio ' + Math.min(pos + 1, A) + ' de ' + A;
      },
      onDone: function(res){ finishDemo(res, startedAt); }
    });
  }
  function finishDemo(res, startedAt){
    var list = DEMO.activities.map(function(a){ return { id: a.id, ok: res.missedNow.indexOf(a.id) === -1 }; });
    NUBE.flushMistakes().then(function(){ return NUBE.recordLesson({ n: 0 }, list, startedAt); }).then(function(){ return NUBE.demoFinish(); }).then(function(){ if(ACC && ACC.demo){ ACC.demo.used = true; ACC.demo.available = false; ACC.demo.resumable = false; } }, function(){});
    track('demo_completada', { curso: 'to-be', aciertos: res.firstOk, total: res.total });
    root.textContent = '';
    stopAudio();
    root.appendChild(el('div', null, [
      el('div', { class: 'ac-top' }, [el('a', { href: '#/', class: 'ac-exit', text: '← Salir' }), el('span', { class: 'ac-top-t', text: DEMO.title })]),
      progressBar(100, 'Prueba completa'),
      el('section', { class: 'ac-card ac-card-end', 'aria-labelledby': 'acH' }, [
        el('p', { class: 'ac-kicker', text: 'Prueba completa' }),
        el('h1', { class: 'ac-h1 ac-h1-end', id: 'acH', 'data-focus': '', text: 'Acertaste ' + res.firstOk + ' de ' + res.total + ' a la primera' }),
        el('p', { class: 'ac-text', text: SALE_TEXT })
      ]),
      el('div', { class: 'ac-nav ac-nav-col' }, [
        el('a', { href: PAY_URL, class: 'ac-btn ac-btn-primary ac-btn-wide', onclick: function(){ track('demo_cta_desbloquear', { curso: 'to-be' }); }, text: 'Desbloquear mi academia' }),
        link('#/', 'Volver a la academia', 'ac-btn ac-btn-quiet ac-btn-wide')
      ])
    ]));
    focusMain();
  }

  /* Que vista corresponde a este alumno. Devuelve true si ya dibujo algo (el router no sigue). */
  function gate(parts){
    if(!NUBE || mode === 'member') return false;
    if(mode === 'pending'){
      msgCard('Conectando con tu cuenta', 'Un momento...');
      bootWaiters.push(route);
      return true;
    }
    if(parts[0] === 'curso' && parts[1] === 'to-be' && parts[2] === 'demo'){ viewDemo(); return true; }
    viewPresentation();
    return true;
  }

  /* ---------------- Router ---------------- */
  function route(){
    var h = hashParts().path;
    var parts = h.split('/').filter(Boolean);
    stopAudio();
    try{
      if(gate(parts)) return;
      if(!parts.length) return viewHome();
      if(parts[0] === 'logros') return viewLogros();
      if(parts[0] === 'practicar') return viewPracticar();
      if(parts[0] === 'curso' && parts[1] === 'to-be'){
        if(!parts[2]) return viewCourse();
        if(parts[2] === 'leccion') return viewLesson(parseInt(parts[3], 10) || 1);
        if(parts[2] === 'evaluacion') return viewExam();
        if(parts[2] === 'practica') return viewPracticeExam();
        if(parts[2] === 'repaso') return viewReview(parts[3] || 'todo');
      }
      viewHome();
    }catch(e){
      root.textContent = '';
      root.appendChild(el('section', { class: 'ac-card' }, [el('h1', { class: 'ac-h1', text: 'Algo salió mal' }), el('p', { class: 'ac-text', text: 'Recarga la página. Si sigue igual, vuelve a Mi ruta.' }), link('#/', 'Mi ruta', 'ac-btn ac-btn-primary')]));
      if(window.console) console.error(e);
    }
  }
  window.addEventListener('hashchange', route);
  route();
  if(NUBE) bootCloud();
})();
