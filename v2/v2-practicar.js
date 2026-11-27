/* =========================================================
   Inglés con Leo 2.0 · Practicar (practica-miembros.html)
   Bloque B (UX): una recomendación principal y pocas alternativas.
     1. Tu práctica de hoy: el Plan de estudio real (empieza con un toque)
     2. También puedes: repasar tus errores clave (Método Leo real) y el Reto
        diario (la tarjeta REAL se mueve aquí y sigue funcionando igual)
     3. Elegir qué practicar (desplegable): habilidades, buscador de temas
        (catálogo real de temas.js) y más formas (English Rush, clases, aprender,
        exámenes)
   El motor por habilidad de esta página sigue existiendo: se muestra si se llega
   con ?skill= (enlaces antiguos); lo normal es abrir la página de cada habilidad.
   Las sesiones siguen corriendo en los motores de app.js, sin cambios.
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled || !window.K || !window.V2D) return;
  if((location.pathname.split('/').pop() || '').toLowerCase() !== 'practica-miembros.html') return;
  var d = document, K = window.K, A = K.ART, SND = K.SND, esc = K.esc;
  var I4 = A.I4 || {};   /* Bloque C: familia de iconos propia (v4-icons.js); si faltara, se usan los de antes */
  var screen = null;
  var SK = [
    { k: 'gramatica', n: 'Gramática', ic: 'grammar', c: 'brand' }, { k: 'vocabulario', n: 'Vocabulario', ic: 'vocab', c: 'ok' },
    { k: 'listening', n: 'Listening', ic: 'listen', c: 'mend' }, { k: 'speaking', n: 'Speaking', ic: 'speak', c: 'streak' },
    { k: 'writing', n: 'Writing', ic: 'write', c: 'award' }, { k: 'lectura', n: 'Lectura', ic: 'read', c: 'brand' }
  ];
  var MORE = [
    { h: 'juego.html', ic: I4.rush || A.STK.rush, c: 'streak', t: 'English Rush', s: 'Modo juego con dificultad progresiva' },
    { h: 'clases.html', ic: I4.clases || A.ICO.lesson, c: 'brand', t: 'Clases interactivas', s: 'Situaciones reales: aeropuerto, restaurante, trabajo' },
    { h: 'aprender.html', ic: I4.bulb || A.STK.bulb, c: 'mend', t: 'Modo aprender', s: 'Microlecciones de 3 minutos para mirar y escuchar' },
    { h: 'examenes.html', ic: I4.exam || A.STK.grad, c: 'award', t: 'Preparación de exámenes', s: 'TOEFL, IELTS, TOEIC y Cambridge' }
  ];
  var withEngine = /[?&]skill=/.test(location.search) || location.hash === '#porHabilidad';
  function acc30(){
    var out = {}, cut = Date.now() - 30 * 86400000;
    try{ loadProgress().sessions.forEach(function(s){ if(!s.date || new Date(s.date + 'T12:00:00').getTime() < cut) return; var o = out[s.skill] || (out[s.skill] = { n: 0, ok: 0, s: 0 }); o.s++;
      (s.results || []).forEach(function(r){ if(r && (r.isCorrect === true || r.isCorrect === false)){ o.n++; if(r.isCorrect) o.ok++; } }); }); }catch(e){}
    return out;
  }
  function planInfo(){
    var o = { level: '', dur: '', resume: false };
    try{ var lv = getUserLevel(), m = LEVEL_META[lv]; o.level = m.label + ' ' + m.range;
      var L = PLAN_LENGTHS[getPlanLength()]; o.dur = (L.sub || '').split('·')[0].trim();
      var sv = loadInflightSession('plan', lv); o.resume = !!(sv && Array.isArray(sv.pool) && typeof sv.idx === 'number' && sv.idx < sv.pool.length); }catch(e){}
    return o;
  }
  var chev = A.UI.chevron;
  function task(href, ic, c, t, s, extra){
    return '<a class="v2-task" href="' + href + '"' + (extra || '') + '><span class="v2-task__ic v2-task__ic--' + c + '">' + ic + '</span><span><b>' + t + '</b><small>' + s + '</small></span>' + chev + '</a>';
  }
  function render(mis){
    var acc = acc30(), act = mis ? mis.active : [];
    var quick = V2D.quickReview ? V2D.quickReview(act) : act.slice(0, 10);
    var pi = planInfo();
    var html = '<div class="v2-screen v2-practicar v2-stack">' +
      '<header><h1 class="v2-h1">Practicar</h1><p class="v2-sub">Te recomendamos empezar por aquí.</p></header>' +
      '<section class="v2-next' + (window.__v2Shone ? '' : ' v2-shine') + '" aria-labelledby="v2PlanT"><span class="v2-next__eyebrow">' + (pi.resume ? 'Sigue donde te quedaste' : 'Tu práctica de hoy') + '</span>' +
        '<h2 id="v2PlanT">' + (pi.resume ? 'Tu sesión recomendada' : 'Sesión recomendada') + '</h2>' +
        '<p>Con tu nivel, tus errores recientes y lo que te toca reforzar.</p>' +
        '<div class="v2-next__meta">' + (pi.dur ? '<span>' + esc(pi.dur) + '</span>' : '') + (pi.level ? '<span>' + esc(pi.level) + '</span>' : '') + '</div>' +
        '<a class="btn btn--lg btn--block" href="plan-estudio.html?empezar=1" data-v2-plan>' + (pi.resume ? 'Continuar' : 'Empezar') + '</a>' +
        '<a class="v2-next__alt" href="plan-estudio.html">Cambiar duración o dificultad</a></section>' +
      '<section class="v2-stack-sm" aria-label="También puedes"><h2 class="v2-eyebrow">También puedes</h2>' +
        (quick.length ? task('errores.html?modo=rapido', I4.mend || A.STK.mend, 'mend', 'Repasa ' + (quick.length === 1 ? 'tu error clave' : 'tus ' + quick.length + ' errores clave'), 'Método Leo · los que más te cuestan ahora') : '') +
        '<div class="v2-reto-slot" id="reto"><div class="v2-slot-real" data-real="reto"></div></div>' +
        '<details class="v2-expand" id="v2Elegir"><summary><span class="v2-task__ic v2-task__ic--brand">' + (I4.practicar || A.ICO.target) + '</span><span>Elegir qué practicar<small>Habilidad, tema, English Rush, clases y exámenes</small></span>' + chev + '</summary>' +
          '<div class="v2-expand__body">' +
            '<h3 class="v2-eyebrow">Por habilidad <small>aciertos · 30 días</small></h3>' +
            '<div class="v2-grid2 v2-grid3">' + SK.map(function(s){ var a = acc[s.k], pct = a && a.n ? Math.round(a.ok / a.n * 100) : null;
              return '<a class="v2-skill" href="' + s.k + '.html"><span class="v2-task__ic v2-task__ic--' + s.c + '">' + (I4[s.ic] || A.ICO[s.ic]) + '</span><span><b>' + s.n + '</b><small>' + (pct == null ? 'Sin datos aún' : pct + ' % de aciertos') + '</small></span></a>'; }).join('') +
            '</div>' +
            task('mixto.html', I4.mix || A.STK.combo, 'brand', 'Mixto', 'Un poco de todo en una sesión') +
            '<h3 class="v2-eyebrow">Buscar un tema</h3>' +
            '<div class="v2-topic"><label class="v2-sr" for="v2TopicQ">Buscar un tema</label><input id="v2TopicQ" class="v2-topic__q" type="search" autocomplete="off" placeholder="Ej.: pasado, much, present perfect"><div class="v2-topic__res" id="v2TopicRes" aria-live="polite"></div></div>' +
            '<h3 class="v2-eyebrow">Más formas de practicar</h3>' +
            MORE.map(function(m){ return task(m.h, m.ic, m.c, m.t, m.s); }).join('') +
          '</div></details>' +
      '</section>' +
      (withEngine ? '<h2 class="v2-engine-h" id="v2Engine">Tu sesión por habilidad</h2>' : '') +
      '</div>';
    var el = K.h(html); el.classList.add('k-scope');
    return el;
  }
  /* Bloque C: mientras llegan los datos, un esqueleto con la forma de la pantalla (sin pantalla en blanco) */
  function skeleton(){ var s = d.createElement('div'); s.className = 'v2-skel-screen'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<div class="v2-skel v2-skel--h1"></div><div class="v2-skel v2-skel--hero"></div><div class="v2-skel v2-skel--row"></div><div class="v2-skel v2-skel--row"></div>'; return s; }
  function mount(){
    var main = d.querySelector('main'); if(!main) return;
    var sk = null; if(!screen){ sk = skeleton(); main.insertBefore(sk, main.firstChild); main.classList.add('v2-has-practice'); }
    V2D.mistakes().then(function(mis){
      if(sk) sk.remove();
      var wasOpen = !!(screen && screen.querySelector('#v2Elegir[open]')), q = screen && screen.querySelector('#v2TopicQ') ? screen.querySelector('#v2TopicQ').value : '';
      var fresh = render(mis);
      var reto = d.getElementById('dailyChallengeCard'), slot = fresh.querySelector('[data-real="reto"]');
      if(reto && slot) slot.appendChild(reto);
      if(screen) screen.replaceWith(fresh); else main.insertBefore(fresh, main.firstChild);
      screen = fresh;
      main.classList.add('v2-has-practice');
      main.classList.toggle('v2-no-engine', !withEngine);
      if(wasOpen){ fresh.querySelector('#v2Elegir').open = true; }
      wireTopics(fresh, q);
      var dt = fresh.querySelector('#v2Elegir');
      dt.addEventListener('toggle', function(){ if(dt.open){ SND.play('open'); track('practicar_elegir_abierto'); } });
      fresh.querySelector('[data-v2-plan]').addEventListener('click', function(){ SND.play('check'); track('practicar_plan_empezar'); });
      if(location.hash === '#reto'){ var r = d.getElementById('reto'); if(r) r.scrollIntoView(); }
      if(withEngine){ var e = d.getElementById('v2Engine'); if(e && /[?&]skill=/.test(location.search)) setTimeout(function(){ e.scrollIntoView({ block: 'start' }); }, 50); }
      d.title = 'Practicar - Inglés con Leo';
    });
  }
  function track(ev, p){ try{ if(typeof window.gtag === 'function') window.gtag('event', ev, p || {}); }catch(e){} }

  /* ---- Buscador de temas: catálogo real (TEMAS de temas.js) y destino real (contentForTema de app.js) ---- */
  var EN = { past: 'pasado', present: 'presente', future: 'futuro', perfect: 'perfecto', continuous: 'continuo', progressive: 'continuo',
    conditional: 'condicional', conditionals: 'condicional', comparative: 'comparativ', comparatives: 'comparativ', superlative: 'superlativ', superlatives: 'superlativ',
    passive: 'pasiva', modal: 'modal', modals: 'modal', preposition: 'preposici', prepositions: 'preposici', pronoun: 'pronombre', pronouns: 'pronombre',
    possessive: 'posesiv', possessives: 'posesiv', article: 'articulo', articles: 'articulo', numbers: 'numero', number: 'numero', question: 'pregunta', questions: 'pregunta',
    verb: 'verbo', verbs: 'verbo', irregular: 'irregular', countable: 'contable', uncountable: 'contable', reported: 'indirecto', speech: 'indirecto', relative: 'relativ',
    connectors: 'conector', linking: 'conector', vocabulary: 'vocabulario', words: 'palabra', greetings: 'saludo', family: 'familia', food: 'comida', work: 'trabajo', travel: 'viaje' };
  function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9/'+ -]/g, ' '); }
  var IDX = null;
  function index(){
    if(IDX) return IDX;
    IDX = [];
    try{ TEMAS.forEach(function(t){
      var fam = ''; try{ fam = t.family && DIAG_FAMILY_BY_ID[t.family] ? DIAG_FAMILY_BY_ID[t.family].label : ''; }catch(e){}
      var hay = norm([t.label, fam, t.id.replace(/-/g, ' '), (t.topics || []).join(' '), (t.micros || []).map(function(m){ return m.label; }).join(' '), t.article || '', t.glossary || ''].join(' '));
      IDX.push({ t: t, hay: hay, label: norm(t.label) });
    }); }catch(e){}
    return IDX;
  }
  function search(q){
    var toks = norm(q).split(/\s+/).filter(function(x){ return x.length > 1; });
    if(!toks.length) return [];
    var out = [];
    index().forEach(function(r){
      var score = 0, ok = toks.every(function(tk){
        var alt = EN[tk];
        var hit = r.hay.indexOf(tk) >= 0 || (alt && r.hay.indexOf(alt) >= 0);
        if(hit && (r.label.indexOf(tk) >= 0 || (alt && r.label.indexOf(alt) >= 0))) score += 2; else if(hit) score += 1;
        return hit;
      });
      if(ok) out.push({ t: r.t, s: score + (r.label.indexOf(norm(q).trim()) === 0 ? 3 : 0) });
    });
    out.sort(function(a, b){ return b.s - a.s; });
    return out.slice(0, 6).map(function(x){ return x.t; });
  }
  var SKILL_N = { vocabulary: 'Vocabulario', listening: 'Listening' };
  function wireTopics(root, q0){
    var inp = root.querySelector('#v2TopicQ'), res = root.querySelector('#v2TopicRes'); if(!inp || !res) return;
    var tmr = 0;
    function paint(){
      var q = inp.value.trim();
      if(q.length < 2){ res.innerHTML = ''; return; }
      var list = search(q);
      if(!list.length){ res.innerHTML = '<p class="v2-topic__none">No encontramos ese tema. Prueba con otra palabra, en español o en inglés.</p>'; return; }
      res.innerHTML = list.map(function(t){
        var c = null; try{ c = contentForTema(t.id); }catch(e){}
        var href = c && c.practiceHref ? c.practiceHref : (t.skill ? (t.skill === 'vocabulary' ? 'vocabulario.html' : 'listening.html') : 'gramatica.html');
        var sub = (c && c.practiceKind === 'tema') ? 'Práctica de este tema' : (c && c.practiceKind === 'otro-nivel') ? 'Práctica de este tema (de otro nivel)' : (c && c.practiceLabel ? c.practiceLabel : 'Práctica');
        var cls = t.article ? '<a class="v2-topic__cls" href="' + esc(t.article) + '">Ver la clase</a>' : (t.glossary ? '<a class="v2-topic__cls" href="/glosario/' + esc(t.glossary) + '/">Ver explicación rápida</a>' : '');
        return '<div class="v2-topic__row"><a class="v2-task" href="' + esc(href) + '"><span><b>' + esc(t.label) + '</b><small>' + esc((t.skill ? SKILL_N[t.skill] + ' · ' : '') + sub) + '</small></span>' + chev + '</a>' + cls + '</div>';
      }).join('');
      if(q.length >= 3){ clearTimeout(tmr); tmr = setTimeout(function(){ track('practicar_buscar_tema', { resultados: list.length }); }, 1200); }
    }
    inp.addEventListener('input', paint);
    if(q0){ inp.value = q0; paint(); }
  }
  window.addEventListener('v2:shell', mount);
  /* Las sesiones de otro dispositivo llegan después: se vuelve a pintar con los datos completos */
  window.addEventListener('leo-progress-synced', function(){ if(screen) mount(); });
  if(d.querySelector('.v2-shell')) mount();
})();
