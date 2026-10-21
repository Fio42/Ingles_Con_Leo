/* ============================================================
   MODO APRENDER (aprender.html)
   Microlecciones visuales con audio, sin escribir ni contestar.

   Qué NO hace (a propósito):
   - No cuenta como ejercicio: no toca los límites diarios, ni la racha, ni el progreso de práctica.
   - No llama a Leo AI ni a ningún servicio de pago.
   - No marca ningún tema como dominado: eso lo sigue comprobando la práctica adaptativa.
   - No escribe en Supabase: su progreso vive en localStorage (leo_aprender_v1).

   Es una función de la MEMBRESÍA, y a la vez un gancho para convertir:
   - Miembro (pago): todas las lecciones.
   - Cuenta gratis: UNA lección de prueba (la que tiene free:true en aprender-data.js) y después una invitación
     a hacerse miembro. Las demás se ven con candado.
   - Sin cuenta: invitación a crear la cuenta gratis para probar una lección.
   aprender.html detecta el tipo de cuenta con LeoBackend.getMemberProfile() y llama a initAprender(tier).

   Qué reutiliza:
   - Recomendación: microDiagActions() y computeDiagnosis() de app.js (el mismo plan adaptativo).
   - Práctica: microPracticeHref() / planFocusHref() de app.js (el Plan de estudio, con foco en el tema).
   - Audio: los mp3 que ya existen en audio/articulos/ y la misma convención de rutas de audio/.
   - Analítica: trackLeoEvent() (Google Analytics) cuando existe.
   ============================================================ */
(function(){
  'use strict';

  var KEY = 'leo_aprender_v1';
  var LESSONS = (typeof APRENDER_LESSONS !== 'undefined') ? APRENDER_LESSONS : [];
  var END_AUDIO = 'audio/aprender/fin.mp3';
  var END_SAY = '¡Muy bien! Ahora puedes practicar lo que aprendiste.';
  var SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function byId(id){ for(var i = 0; i < LESSONS.length; i++) if(LESSONS[i].id === id) return LESSONS[i]; return null; }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dayNum(str){ var p = String(str).split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }

  /* ---------------- Progreso (localStorage) ---------------- */
  function freshState(){ return { v: 1, done: {}, cur: null, auto: false, first: null, lastVisit: null, d7: false }; }
  function loadState(){
    try{
      var s = JSON.parse(localStorage.getItem(KEY));
      if(s && s.v === 1 && typeof s.done === 'object' && s.done){
        if(typeof s.auto !== 'boolean') s.auto = false;
        return s;
      }
    }catch(e){}
    return freshState();
  }
  var state = loadState();
  function saveState(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  /* ---------------- Analítica ligera ---------------- */
  function track(name, params){
    try{
      if(typeof trackLeoEvent === 'function') trackLeoEvent(name, params || {});
      else if(typeof gtag === 'function') gtag('event', name, params || {});
    }catch(e){}
  }
  function trackVisit(){
    var t = today();
    if(!state.first) state.first = t;
    if(state.lastVisit !== t){
      var days = dayNum(t) - dayNum(state.first);
      if(days >= 1) track('aprender_return', { days_since_first: days });
      if(days >= 7 && !state.d7){ state.d7 = true; track('aprender_return_7d', { days_since_first: days }); }
      state.lastVisit = t;
    }
    saveState();
  }

  /* ---------------- Datos ya cargados de otras partes del sitio ---------------- */
    var accessInfo = { tier: 'guest', resolved: true };   // 'guest' | 'free' | 'member'
  var reco = null;

  function userLevel(){
    try{ if(typeof getUserLevel === 'function') return getUserLevel(); }catch(e){}
    return 'facil';
  }

  /* ---------------- Recomendación (reutiliza el plan adaptativo) ---------------- */
  function lessonFor(opts){
    var i, l;
    if(opts.micro){ for(i = 0; i < LESSONS.length; i++){ l = LESSONS[i]; if((l.micros || []).indexOf(opts.micro) !== -1) return l; } }
    if(opts.tema){ for(i = 0; i < LESSONS.length; i++){ l = LESSONS[i]; if((l.temas || []).indexOf(opts.tema) !== -1) return l; } }
    if(opts.family){ for(i = 0; i < LESSONS.length; i++){ l = LESSONS[i]; if((l.families || []).indexOf(opts.family) !== -1) return l; } }
    return null;
  }
  function microLabel(id){ try{ return (MICRO_BY_ID && MICRO_BY_ID[id] && MICRO_BY_ID[id].label) || null; }catch(e){ return null; } }
  function temaLabel(id){ try{ return (TEMA_BY_ID && TEMA_BY_ID[id] && TEMA_BY_ID[id].label) || null; }catch(e){ return null; } }

  function computeReco(){
    var cands = [];   // en orden de prioridad
    var level = userLevel();
    // 1) Microtemas donde el alumno falla (mismo cálculo que "Hoy te conviene").
    try{
      if(typeof microDiagActions === 'function'){
        microDiagActions(level).forEach(function(a){
          var l = lessonFor({ micro: a.micro, tema: a.tema });
          if(l){
            var lab = microLabel(a.micro) || temaLabel(a.tema) || l.title;
            cands.push({ lesson: l, source: 'errores', micro: a.micro, reason: 'Tienes errores en "' + lab + '". Esta lección repasa la regla en 3 minutos.' });
          }
        });
      }
    }catch(e){}
    // 2) Lo que recomienda su plan de estudio (diagnóstico existente).
    try{
      if(typeof computeDiagnosis === 'function'){
        var diag = computeDiagnosis();
        if(diag && diag.ready && diag.actions){
          diag.actions.forEach(function(a){
            var fam = null, m = /foco=([a-z0-9-]+)/.exec(a.href || '');
            if(m) fam = m[1];
            var l = lessonFor({ micro: a.micro, tema: a.tema, family: fam });
            if(l){
              var lab = (a.tema && temaLabel(a.tema)) || l.title;
              cands.push({ lesson: l, source: 'plan', micro: a.micro || null, reason: 'Tu plan de estudio te sugiere reforzar "' + lab + '".' });
            }
          });
        }
      }
    }catch(e){}
    // 3) Lecciones básicas: la primera que no ha visto; si ya vio todas, la menos reciente.
    var seenAny = false, firstNew = null, oldest = null;
    LESSONS.forEach(function(l){
      var d = state.done[l.id];
      if(d) seenAny = true;
      if(!d && !firstNew) firstNew = l;
      if(d && (!oldest || (d.last || '') < (state.done[oldest.id].last || ''))) oldest = l;
    });
    if(firstNew) cands.push({ lesson: firstNew, source: 'basica', reason: seenAny ? 'La siguiente lección de tu ruta.' : 'Una lección básica para empezar.' });
    else if(oldest) cands.push({ lesson: oldest, source: 'repaso', reason: 'Es buen momento de repasarla.' });

    // Evita ofrecer de nuevo la que ya completó hoy, si hay otra opción.
    var t = today();
    for(var i = 0; i < cands.length; i++){
      var d2 = state.done[cands[i].lesson.id];
      if(!(d2 && d2.last === t)) return cands[i];
    }
    return cands[0] || { lesson: LESSONS[0], source: 'basica', reason: 'Una lección básica para empezar.' };
  }
  function nextReco(excludeId){
    var r = computeReco();
    if(r && r.lesson.id !== excludeId) return r;
    for(var i = 0; i < LESSONS.length; i++){
      if(LESSONS[i].id !== excludeId && !state.done[LESSONS[i].id]) return { lesson: LESSONS[i], source: 'basica', reason: 'La siguiente lección de tu ruta.' };
    }
    for(var j = 0; j < LESSONS.length; j++) if(LESSONS[j].id !== excludeId) return { lesson: LESSONS[j], source: 'repaso', reason: 'Para repasar.' };
    return null;
  }

  /* ---------------- Acceso y enlace a la práctica ---------------- */
  function resolveAccess(){ return Promise.resolve(accessInfo); }
  function isOpen(lesson){ return accessInfo.tier === 'member' || (accessInfo.tier === 'free' && !!lesson.free); }
  function freeLesson(){ for(var i = 0; i < LESSONS.length; i++) if(LESSONS[i].free) return LESSONS[i]; return LESSONS[0]; }
  function memberPracticeHref(lesson, microId){
    try{
      var level = userLevel(), i, id;
      var tryMicros = (microId ? [microId] : []).concat(lesson.micros || []);
      for(i = 0; i < tryMicros.length; i++){
        id = tryMicros[i];
        if(typeof microIsActive === 'function' && microIsActive(id) && microHasItemsAt(id, level)) return microPracticeHref(MICRO_BY_ID[id], true);
      }
      var temas = lesson.temas || [];
      for(i = 0; i < temas.length; i++){
        if(typeof temaHasItemsAt === 'function' && TEMA_BY_ID[temas[i]] && TEMA_BY_ID[temas[i]].family && temaHasItemsAt(temas[i], level)) return planFocusHref(TEMA_BY_ID[temas[i]].family, true, temas[i]);
      }
      var fams = lesson.families || [];
      for(i = 0; i < fams.length; i++){
        if(typeof familyHasItemsAt === 'function' && familyHasItemsAt(fams[i], level)) return planFocusHref(fams[i], true);
      }
    }catch(e){}
    return 'plan-estudio.html?empezar=1';
  }
  function practiceHref(lesson){
    if(accessInfo.tier === 'member') return memberPracticeHref(lesson, reco && reco.lesson.id === lesson.id ? reco.micro : null);
    // Cuentas gratis: la práctica gratis solo admite habilidad y nivel (y respeta sus límites diarios).
    return 'practica.html?skill=grammar&level=' + encodeURIComponent(userLevel());
  }
  /* Texto honesto del botón: solo dice "este tema" si el enlace de verdad lleva a ese tema del Plan.
     (En el banco actual, "To be" solo tiene ejercicios de gramática en el nivel Principiante; en otros niveles el Plan abre la sesión de hoy.) */
  function practiceLabel(lesson){
    if(accessInfo.tier !== 'member') return 'Practicar gramática gratis';
    return practiceHref(lesson).indexOf('foco=') !== -1 ? 'Practicar este tema' : 'Practicar con mi plan de hoy';
  }
  var PAY_HREF = 'miembros.html?pagar=1';
  var SIGNUP_HREF = 'miembros.html?modo=registro&volver=aprender.html';

  /* ---------------- Motor de audio ---------------- */
  var snd = null;                 // un solo <audio> reutilizado (iOS exige desbloquearlo con un toque)
  var synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  var runId = 0;                  // cada reproducción nueva invalida a la anterior
  var cancelHook = null;
  var missing = {};               // mp3 que no existen todavía (cae a la voz del navegador)
  var voicesCache = {};
  var autoTimer = null;
  var unlocked = false;

  function sndEl(){ if(!snd){ snd = new Audio(); snd.preload = 'auto'; } return snd; }
  function unlockAudio(){
    if(unlocked) return;
    unlocked = true;
    try{ var a = sndEl(); a.src = SILENT_WAV; var p = a.play(); if(p && p.catch) p.catch(function(){}); }catch(e){}
  }
  function stopAll(){
    runId++;
    if(autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
    var h = cancelHook; cancelHook = null;
    try{ if(snd){ snd.pause(); } }catch(e){}
    try{ if(synth) synth.cancel(); }catch(e){}
    if(h){ try{ h(); }catch(e){} }
    ui.setPlaying(false);
    ui.markRow(-1);
  }
  function wait(ms, token){
    return new Promise(function(res){
      if(token !== runId) return res();
      var t = setTimeout(function(){ cancelHook = null; res(); }, ms);
      cancelHook = function(){ clearTimeout(t); res(); };
    });
  }
  function playMp3(src, token){
    return new Promise(function(resolve){
      var done = false, started = false, a = sndEl();
      function finish(v){
        if(done) return; done = true; clearTimeout(tm);
        a.onended = a.onerror = a.onplaying = null; cancelHook = null; resolve(v);
      }
      var tm = setTimeout(function(){ if(!started){ try{ a.pause(); }catch(e){} finish(false); } }, 5000);
      cancelHook = function(){ finish('cancel'); };
      a.onplaying = function(){ started = true; };
      a.onended = function(){ finish(true); };
      a.onerror = function(){ finish(false); };
      try{
        a.src = src;
        var p = a.play();
        if(p && p.catch) p.catch(function(err){ finish(err && err.name === 'NotAllowedError' ? 'blocked' : false); });
      }catch(e){ finish(false); }
    });
  }
  function pickVoice(lang){
    if(!synth) return null;
    if(voicesCache[lang]) return voicesCache[lang];
    var vs = synth.getVoices() || [], prefs = lang === 'en' ? ['en-US', 'en-GB', 'en'] : ['es-MX', 'es-US', 'es-419', 'es-CO', 'es-ES', 'es'];
    for(var i = 0; i < prefs.length; i++){
      for(var j = 0; j < vs.length; j++){
        var l = (vs[j].lang || '').replace('_', '-');
        if(l === prefs[i] || l.indexOf(prefs[i] + '-') === 0){ voicesCache[lang] = vs[j]; return vs[j]; }
      }
    }
    return null;
  }
  function partsOf(say){
    var out = [], re = /\{\{(.+?)\}\}/g, last = 0, m;
    say = String(say || '');
    while((m = re.exec(say))){
      if(m.index > last) out.push({ t: say.slice(last, m.index), lang: 'es' });
      out.push({ t: m[1], lang: 'en' });
      last = re.lastIndex;
    }
    if(last < say.length) out.push({ t: say.slice(last), lang: 'es' });
    return out.filter(function(p){ return p.t.trim(); });
  }
  function speak(parts, token){
    return new Promise(function(resolve){
      if(!synth) return resolve('nosupport');
      var idx = 0;
      function next(){
        cancelHook = null;
        if(token !== runId) return resolve('cancel');
        if(idx >= parts.length) return resolve(true);
        var part = parts[idx++], u = new SpeechSynthesisUtterance(part.t), settled = false;
        u.lang = part.lang === 'en' ? 'en-US' : 'es-MX';
        u.rate = part.lang === 'en' ? 0.88 : 0.95;
        var v = pickVoice(part.lang); if(v) u.voice = v;
        var guard = setTimeout(function(){ go(); }, 2500 + part.t.length * 120);
        function go(){ if(settled) return; settled = true; clearTimeout(guard); next(); }
        u.onend = go; u.onerror = go;
        cancelHook = function(){ settled = true; clearTimeout(guard); resolve('cancel'); };
        try{ synth.speak(u); }catch(e){ go(); }
      }
      next();
    });
  }
  /* clip: { src, parts }.  Devuelve 'blocked' | 'cancel' | 'nosupport' | true */
  function playClip(clip, token){
    var chain = Promise.resolve(false);
    if(clip.src && !missing[clip.src]){
      chain = playMp3(clip.src, token).then(function(r){
        if(r === false) missing[clip.src] = true;
        return r;
      });
    }
    return chain.then(function(r){
      if(r === true || r === 'blocked' || r === 'cancel') return r;
      if(token !== runId) return 'cancel';
      return speak(clip.parts, token);
    });
  }
  function buildSeq(lesson, i, resolved){
    if(i >= lesson.screens.length) return [{ kind: 'es', src: END_AUDIO, parts: partsOf(END_SAY), row: -1 }];
    var sc = lesson.screens[i], seq = [{ kind: 'es', src: aprenderExplainAudio(lesson.id, i), parts: partsOf(sc.say), row: -1 }];
    (resolved[i] || []).forEach(function(it, k){ seq.push({ kind: 'en', src: it.audio, parts: [{ t: it.en, lang: 'en' }], row: k }); });
    return seq;
  }
  function runSeq(seq, token){
    var spoke = false;
    ui.setPlaying(true);
    function step(k){
      if(token !== runId) return Promise.resolve('cancel');
      if(k >= seq.length) return Promise.resolve(spoke ? 'done' : 'silent');
      ui.markRow(seq[k].row);
      return playClip(seq[k], token).then(function(r){
        if(r === true) spoke = true;
        if(r === 'blocked' || r === 'cancel') return r;
        if(token !== runId) return 'cancel';
        return wait(k + 1 < seq.length ? (seq[k + 1].kind === 'en' ? 450 : 250) : 0, token).then(function(){ return step(k + 1); });
      });
    }
    return step(0).then(function(r){
      if(token === runId){ ui.setPlaying(false); ui.markRow(-1); }
      return r;
    });
  }

  /* ---------------- Reproductor ---------------- */
  var run = null;     // { lesson, i, resolved, completed, source }
  var ui = {
    setPlaying: function(on){
      var b = $('apListen'); if(!b) return;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.querySelector('.ap-btn-label').textContent = on ? 'Pausar' : 'Escuchar';
      b.querySelector('.ap-btn-icon').textContent = on ? '❚❚' : '▶';
      b.classList.toggle('is-on', on);
    },
    markRow: function(k){
      var rows = document.querySelectorAll('#apScreen .ap-item');
      for(var i = 0; i < rows.length; i++) rows[i].classList.toggle('is-playing', i === k);
    }
  };

  function screenHtml(lesson, i){
    var resolved = run.resolved;
    if(i >= lesson.screens.length) return endHtml(lesson);
    var sc = lesson.screens[i], h = '';
    h += '<p class="ap-kicker">' + esc(lesson.title) + '</p>';
    h += '<h2 class="ap-h" id="apScreenTitle" tabindex="-1">' + esc(sc.title) + '</h2>';
    if(sc.big) h += '<div class="ap-big" aria-hidden="false">' + esc(sc.big) + '</div>';
    if(sc.text) h += '<p class="ap-text">' + esc(sc.text) + '</p>';
    if(sc.chips) h += '<ul class="ap-chips">' + sc.chips.map(function(c){ return '<li><span class="ap-chip-a">' + esc(c.a) + '</span><span class="ap-chip-arrow" aria-hidden="true">→</span><span class="ap-chip-b">' + esc(c.b) + '</span></li>'; }).join('') + '</ul>';
    if(sc.table){
      h += '<div class="ap-table-wrap"><table class="ap-table"><thead><tr>' + sc.table.head.map(function(x){ return '<th scope="col">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        sc.table.rows.map(function(r){ return '<tr>' + r.map(function(x){ return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }
    if(sc.compare){
      h += '<div class="ap-compare"><div class="ap-wrong">' + esc(sc.compare.wrong) + '</div><div class="ap-right">' + esc(sc.compare.right) + '</div></div>';
    }
    var items = resolved[i] || [];
    if(items.length){
      h += '<ul class="ap-items">' + items.map(function(it, k){
        return '<li class="ap-item" data-k="' + k + '"><button type="button" class="ap-item-play" data-k="' + k + '" aria-label="Escuchar: ' + esc(it.en) + '"><span aria-hidden="true">▶</span></button>' +
          '<span class="ap-item-txt"><span class="ap-en" lang="en">' + esc(it.en) + '</span><span class="ap-es">' + esc(it.es) + '</span></span></li>';
      }).join('') + '</ul>';
    }
    if(sc.note) h += '<p class="ap-note">' + esc(sc.note) + '</p>';
    return h;
  }
  function upsellHtml(ctx){
    var h = '<div class="ap-upsell" id="apUpsell"><p class="ap-eyebrow">Solo para miembros</p>' +
      '<h2 class="ap-upsell-h">' + (ctx && ctx.title ? esc(ctx.title) : 'Desbloquea las ' + LESSONS.length + ' microlecciones') + '</h2>';
    if(ctx && ctx.reason) h += '<p class="ap-upsell-reason">' + esc(ctx.reason) + '</p>';
    h += '<ul class="ap-upsell-list"><li>Las ' + LESSONS.length + ' microlecciones, con audio, ejemplos y trucos para recordar</li>' +
      '<li>Te recomendamos la que necesitas según tus errores</li>' +
      '<li>Práctica ilimitada, repaso de errores y Plan de estudio</li></ul>' +
      '<a class="btn btn-primary ap-big-btn" id="apPay" href="' + PAY_HREF + '" data-from="' + esc((ctx && ctx.from) || 'lista') + '">Hazte miembro</a>' +
      '<p class="ap-hero-note">$2 USD al mes · Cancela cuando quieras</p></div>';
    return h;
  }
  function bindUpsell(root){
    var a = root.querySelector('#apPay');
    if(a) a.addEventListener('click', function(){ track('aprender_upsell_clicked', { tier: accessInfo.tier, from: a.getAttribute('data-from'), lesson_id: (reco && reco.lesson.id) || '' }); });
  }
  function endHtml(lesson){
    var nxt = accessInfo.tier === 'member' ? nextReco(lesson.id) : null;
    var h = '<p class="ap-kicker">' + esc(lesson.title) + '</p>';
    h += '<h2 class="ap-h ap-h-end" id="apScreenTitle" tabindex="-1">¡Muy bien!</h2>';
    h += '<p class="ap-text ap-text-end">Ahora puedes practicar lo que aprendiste.</p>';
    h += '<a class="btn btn-primary ap-practice" id="apPractice" href="' + esc(practiceHref(lesson)) + '">' + practiceLabel(lesson) + '</a>';
    h += '<p class="ap-note">Ver una lección te ayuda a entender. La práctica es la que comprueba que ya lo sabes.</p>';
    if(accessInfo.tier !== 'member'){
      h += '<div class="ap-end-upsell">' + upsellHtml({ title: 'Te quedan ' + (LESSONS.length - 1) + ' microlecciones por desbloquear', from: 'fin' }) + '</div>';
    }
    h += '<div class="ap-end-links">';
    h += '<button type="button" class="ap-link" id="apAgain">Repetir esta lección</button>';
    if(nxt) h += '<button type="button" class="ap-link" id="apNext" data-id="' + esc(nxt.lesson.id) + '">Siguiente: ' + esc(nxt.lesson.title) + '</button>';
    if(lesson.article) h += '<a class="ap-link" href="' + esc(lesson.article) + '">Leer la clase completa</a>';
    h += '<button type="button" class="ap-link" id="apHomeBack">Volver al Modo aprender</button>';
    h += '</div>';
    return h;
  }

  function renderScreen(opts){
    opts = opts || {};
    var lesson = run.lesson, i = run.i, total = lesson.screens.length + 1;
    stopAll();
    var scr = $('apScreen');
    scr.innerHTML = screenHtml(lesson, i);
    scr.setAttribute('data-screen', String(i + 1));
    $('apStep').textContent = 'Pantalla ' + (i + 1) + ' de ' + total;
    var bar = $('apBar');
    bar.style.width = Math.round(((i + 1) / total) * 100) + '%';
    $('apProgress').setAttribute('aria-valuenow', String(i + 1));
    $('apProgress').setAttribute('aria-valuemax', String(total));
    $('apPrev').disabled = i === 0;
    var isEnd = i >= lesson.screens.length;
    $('apNextBtn').disabled = isEnd;
    $('apNextBtn').hidden = false;
    $('apListen').hidden = false;
    $('apRepeat').hidden = false;
    // Guarda la última pantalla vista; al llegar al final, la lección queda completada.
    if(isEnd){
      if(!run.completed){
        run.completed = true;
        var prev = state.done[lesson.id];
        state.done[lesson.id] = { n: (prev ? prev.n : 0) + 1, first: prev ? prev.first : today(), last: today() };
        state.cur = null;
        track('aprender_lesson_completed', { lesson_id: lesson.id, repeat: prev ? 1 : 0, tier: accessInfo.tier });
      }
    } else {
      state.cur = { id: lesson.id, i: i, t: Date.now() };
    }
    saveState();
    if(!opts.silentFocus){ var t = $('apScreenTitle'); if(t && t.focus) try{ t.focus({ preventScroll: true }); }catch(e){} }
    bindScreen();
    if(isEnd) resolveAccess().then(function(){ var a = $('apPractice'); if(a && run && run.lesson === lesson) { a.setAttribute('href', practiceHref(lesson)); a.textContent = practiceLabel(lesson); } });
    if(state.auto && opts.autoplay) play();
  }

  function bindScreen(){
    var plays = document.querySelectorAll('#apScreen .ap-item-play');
    for(var p = 0; p < plays.length; p++){
      plays[p].addEventListener('click', function(ev){
        var k = +ev.currentTarget.getAttribute('data-k');
        var it = run.resolved[run.i][k];
        stopAll();
        unlockAudio();
        var token = runId;
        runSeq([{ kind: 'en', src: it.audio, parts: [{ t: it.en, lang: 'en' }], row: k }], token).then(function(r){ if(r === 'blocked') hint('Toca el botón Escuchar para activar el sonido.'); });
      });
    }
    var pr = $('apPractice');
    if(pr) pr.addEventListener('click', function(ev){
      ev.preventDefault();
      var lesson = run.lesson;
      resolveAccess().then(function(a){
        var href = practiceHref(lesson);
        track('aprender_practice_clicked', { lesson_id: lesson.id, tier: accessInfo.tier, from: 'end' });
        location.href = href;
      });
    });
    var again = $('apAgain'); if(again) again.addEventListener('click', function(){ run.i = 0; run.completed = false; renderScreen({ autoplay: true }); });
    var nx = $('apNext'); if(nx) nx.addEventListener('click', function(){ startLesson(nx.getAttribute('data-id'), 'siguiente'); });
    var hb = $('apHomeBack'); if(hb) hb.addEventListener('click', leavePlayer);
    bindUpsell($('apScreen'));
  }

  function hint(msg){
    var el = $('apHint'); if(!el) return;
    el.textContent = msg; el.hidden = false;
    clearTimeout(hint._t); hint._t = setTimeout(function(){ el.hidden = true; }, 4500);
  }

  function play(){
    if(!run) return;
    unlockAudio();
    stopAll();
    var token = runId, lesson = run.lesson, i = run.i;
    runSeq(buildSeq(lesson, i, run.resolved), token).then(function(r){
      if(token !== runId || !run) return;
      if(r === 'blocked'){ hint('Toca Escuchar para activar el sonido.'); return; }
      if(r === 'silent') hint('No se pudo reproducir el audio en este navegador. Lee la pantalla a tu ritmo.');
      if(state.auto && i < lesson.screens.length){
        autoTimer = setTimeout(function(){ autoTimer = null; if(run && run.i === i) go(1, true); }, r === 'silent' ? 9000 : 1500);
      }
    });
  }
  function toggleListen(){
    if(!run) return;
    var playing = $('apListen').getAttribute('aria-pressed') === 'true';
    if(playing){ stopAll(); return; }
    play();
  }
  function go(delta, auto){
    if(!run) return;
    var max = run.lesson.screens.length;
    var ni = Math.min(max, Math.max(0, run.i + delta));
    if(ni === run.i) return;
    run.i = ni;
    renderScreen({ autoplay: !!(state.auto && (auto || unlocked)), silentFocus: !!auto });
  }

  function startLesson(id, source, fromScreen){
    var lesson = byId(id);
    if(!lesson) return;
    if(!isOpen(lesson)){ showPaywall(id, 'lista'); return; }
    var resumeAt = (typeof fromScreen === 'number') ? fromScreen : 0;
    run = { lesson: lesson, i: resumeAt, resolved: aprenderResolveItems(lesson), completed: !!(state.done[id] && resumeAt >= lesson.screens.length), source: source || 'lista' };
    if(resumeAt > 0) track('aprender_lesson_resumed', { lesson_id: id, screen: resumeAt + 1 });
    else track('aprender_lesson_started', { tier: accessInfo.tier, lesson_id: id, source: run.source, repeat: state.done[id] ? 1 : 0, reco_source: (reco && reco.lesson.id === id) ? reco.source : 'none' });
    $('apHome').hidden = true;
    $('apIntro').hidden = true;
    $('apPlayer').hidden = false;
    $('apAuto').checked = !!state.auto;
    $('apTitleBar').textContent = lesson.title;
    unlockAudio();
    try{ window.scrollTo(0, 0); }catch(e){}
    renderScreen({ autoplay: true });
    resolveAccess();
  }
  function leavePlayer(){
    stopAll();
    run = null;
    $('apPlayer').hidden = true;
    $('apIntro').hidden = false;
    $('apHome').hidden = false;
    try{ if(history.replaceState && location.search) history.replaceState(null, '', location.pathname); }catch(e){}
    renderHome();
    try{ window.scrollTo(0, 0); }catch(e){}
  }

  /* ---------------- Portada del Modo aprender ---------------- */
  function statusOf(l){
    var d = state.done[l.id];
    if(state.cur && state.cur.id === l.id) return { k: 'cur', t: 'En curso: pantalla ' + (state.cur.i + 1) + ' de ' + (l.screens.length + 1) };
    if(d) return { k: 'done', t: 'Vista' + (d.n > 1 ? ' ' + d.n + ' veces' : '') + ' ✓' };
    return { k: 'new', t: 'Nueva' };
  }
  var paywallFor = null;
  function showPaywall(lessonId, from){
    paywallFor = lessonId || true;
    track('aprender_locked_clicked', { tier: accessInfo.tier, lesson_id: lessonId || '', from: from || 'lista' });
    if(run){ stopAll(); run = null; $('apPlayer').hidden = true; $('apIntro').hidden = false; $('apHome').hidden = false; }
    renderHome();
    try{ window.scrollTo(0, 0); }catch(e){}
  }
  function lockedReason(){
    // Usa el plan adaptativo para decir, con datos reales, qué lección le conviene.
    var r = null;
    try{ r = computeReco(); }catch(e){}
    if(r && !isOpen(r.lesson) && r.source !== 'basica') return { title: 'La lección que te ayuda es para miembros', reason: r.reason.replace('Esta lección repasa la regla en 3 minutos.', '') + 'Con la membresía la tienes en 3 minutos: ' + r.lesson.title + '.' };
    return null;
  }
  function listHtml(l){
    var h = '<h2 class="ap-list-h">Todas las lecciones</h2><ul class="ap-list">';
    LESSONS.forEach(function(x){
      var open = isOpen(x), st = statusOf(x), isReco = open && x.id === l.id;
      var label = !open ? 'Desbloquear' : (st.k === 'done' ? 'Repetir' : (st.k === 'cur' ? 'Continuar' : 'Ver lección'));
      h += '<li class="ap-card ap-card-' + (open ? st.k : 'locked') + '"><div class="ap-card-main"><p class="ap-card-t">' + esc(x.title) +
        (isReco ? ' <span class="ap-tag">Recomendada</span>' : '') + (x.free && accessInfo.tier !== 'member' ? ' <span class="ap-tag ap-tag-free">Gratis</span>' : '') + '</p>' +
        '<p class="ap-card-s">' + esc(x.short) + '</p><p class="ap-card-st">' + (open ? esc(st.t) : 'Solo para miembros') + ' · 3 min</p></div>' +
        '<button type="button" class="btn ' + (open ? 'btn-ghost' : 'btn-ghost ap-locked-btn') + ' btn-sm" data-go="' + esc(x.id) + '" data-at="' + (open && st.k === 'cur' ? state.cur.i : 0) + '" data-src="lista">' + label + '</button></li>';
    });
    return h + '</ul>';
  }
  function renderHome(){
    var tier = accessInfo.tier, h = '';
    if(tier === 'guest'){
      h += '<div class="ap-hero"><p class="ap-eyebrow">Modo aprender</p><h2 class="ap-hero-h">Prueba una microlección gratis</h2>' +
        '<p class="ap-hero-reason">Crea tu cuenta gratis, sin tarjeta, y mira cómo funciona: una lección de 3 minutos con audio, ejemplos y un truco para recordar.</p>' +
        '<a class="btn btn-primary ap-big-btn" id="apSignup" href="' + SIGNUP_HREF + '">Crear cuenta gratis</a>' +
        '<p class="ap-hero-note">¿Ya tienes cuenta? <a class="inline-link" href="miembros.html?volver=aprender.html">Inicia sesión</a></p></div>';
      h += listHtml(freeLesson());
      $('apHome').innerHTML = h;
      var su = $('apSignup'); if(su) su.addEventListener('click', function(){ track('aprender_signup_clicked', { from: 'portada' }); });
      var lb = $('apHome').querySelectorAll('[data-go]');
      for(var g = 0; g < lb.length; g++) lb[g].addEventListener('click', function(){ track('aprender_locked_clicked', { tier: 'guest', from: 'lista' }); location.href = SIGNUP_HREF; });
      return;
    }
    if(!reco) reco = computeReco();
    var l = reco.lesson, heroReason = reco.reason, eyebrow = 'Tu lección de hoy', lockedCtx = null;
    if(tier === 'free'){
      lockedCtx = lockedReason();
      var fl = freeLesson();
      if(!isOpen(l)) { l = fl; }
      var doneFree = !!state.done[fl.id];
      eyebrow = 'Tu microlección gratis';
      heroReason = doneFree ? 'Ya la viste. Puedes repetirla cuando quieras.' : 'Pruébala: 3 minutos, solo mirando y escuchando.';
    }
    var cur = state.cur && byId(state.cur.id) && isOpen(byId(state.cur.id)) ? state.cur : null;
    var curSame = cur && cur.id === l.id;
    if(cur && !curSame){
      var cl = byId(cur.id);
      h += '<div class="ap-continue"><div><p class="ap-eyebrow">Continuar aprendiendo</p><p class="ap-continue-t">' + esc(cl.title) + '</p><p class="ap-continue-s">Te quedaste en la pantalla ' + (cur.i + 1) + ' de ' + (cl.screens.length + 1) + '.</p></div>' +
        '<button type="button" class="btn btn-primary" data-go="' + esc(cl.id) + '" data-at="' + cur.i + '" data-src="continuar">Continuar aprendiendo</button></div>';
    }
    if(tier === 'free' && (paywallFor || state.done[freeLesson().id])) h += upsellHtml(lockedCtx || { from: paywallFor ? 'candado' : 'portada' });
    h += '<div class="ap-hero"><p class="ap-eyebrow">' + eyebrow + '</p><h2 class="ap-hero-h">Aprende en 3 minutos</h2>' +
      '<p class="ap-hero-lesson">' + esc(l.title) + '</p><p class="ap-hero-reason">' + esc(heroReason) + '</p>' +
      '<button type="button" class="btn btn-primary ap-big-btn" id="apStart" data-go="' + esc(l.id) + '" data-at="' + (curSame ? cur.i : 0) + '" data-src="' + (curSame ? 'continuar' : 'recomendada') + '">' + (curSame ? 'Continuar aprendiendo' : 'Empezar a aprender') + '</button>' +
      '<p class="ap-hero-note">Solo mira y escucha. No tienes que escribir ni contestar.</p></div>';
    if(tier === 'free' && !paywallFor && !state.done[freeLesson().id]) { /* el upsell sale después de probar la lección */ }
    h += listHtml(l);
    h += '<p class="ap-foot">Ver una lección no cuenta como dominar un tema. Para comprobar lo que aprendiste, practica.</p>';
    $('apHome').innerHTML = h;
    bindUpsell($('apHome'));
    var btns = $('apHome').querySelectorAll('[data-go]');
    for(var b = 0; b < btns.length; b++){
      btns[b].addEventListener('click', function(ev){
        var t = ev.currentTarget;
        startLesson(t.getAttribute('data-go'), t.getAttribute('data-src'), +t.getAttribute('data-at') || 0);
      });
    }
  }

  /* ---------------- Arranque ---------------- */
  function bindPlayer(){
    $('apPrev').addEventListener('click', function(){ go(-1, false); });
    $('apNextBtn').addEventListener('click', function(){ go(1, false); });
    $('apListen').addEventListener('click', toggleListen);
    $('apRepeat').addEventListener('click', function(){ play(); });
    $('apExit').addEventListener('click', leavePlayer);
    $('apAuto').addEventListener('change', function(ev){
      state.auto = !!ev.target.checked; saveState();
      if(state.auto){ unlockAudio(); var playing = $('apListen').getAttribute('aria-pressed') === 'true'; if(!playing && run && run.i < run.lesson.screens.length) play(); }
      else if(autoTimer){ clearTimeout(autoTimer); autoTimer = null; }
    });
    document.addEventListener('keydown', function(ev){
      if(!run || $('apPlayer').hidden) return;
      var tag = (ev.target && ev.target.tagName) || '';
      if(tag === 'INPUT' && ev.target.type !== 'checkbox') return;
      if(ev.key === 'ArrowRight'){ go(1, false); }
      else if(ev.key === 'ArrowLeft'){ go(-1, false); }
    });
    addEventListener('pagehide', stopAll);
    document.addEventListener('visibilitychange', function(){ if(document.hidden) stopAll(); });
    if(synth && synth.addEventListener) synth.addEventListener('voiceschanged', function(){ voicesCache = {}; });
  }

  function init(tier){
    if(!LESSONS.length || !$('apHome')) return;
    accessInfo = { tier: (tier === 'member' || tier === 'free') ? tier : 'guest', resolved: true };
    bindPlayer();
    trackVisit();
    track('aprender_opened', { tier: accessInfo.tier });
    renderHome();
    // ?leccion=<id> (enlaces desde las clases): resalta esa lección como la de hoy. No inicia audio ni nada solo.
    var wanted = null;
    try{ wanted = new URLSearchParams(location.search).get('leccion'); }catch(e){}
    if(wanted && byId(wanted) && accessInfo.tier !== 'guest'){ reco = { lesson: byId(wanted), source: 'enlace', reason: 'Elegiste esta lección desde una clase del sitio.' }; renderHome(); }
    if(accessInfo.tier !== 'guest' && !(wanted && byId(wanted))){
      var repaint = function(){
        var fresh = computeReco();
        reco = fresh;
        if(!run) renderHome();      // no mover nada mientras el alumno está dentro de una lección
      };
      try{
        if(typeof diagRenderWithStats === 'function') diagRenderWithStats(repaint); else repaint();
      }catch(e){ repaint(); }
    }
  }

  window.__aprender = {
    state: function(){ return state; },
    run: function(){ return run; },
    reco: function(){ return reco; },
    computeReco: computeReco,
    practiceHref: practiceHref,
    practiceLabel: practiceLabel,
    tier: function(){ return accessInfo.tier; },
    isOpen: isOpen,
    start: startLesson,
    loaded: true
  };
  window.initAprender = init;   // lo llama aprender.html cuando guardMemberPage() confirma que es miembro
})();
