/* =========================================================
   Inglés con Leo 2.0 · Capa de experiencia de ejercicios (bloque 3)
   Escucha lo que YA decidió el motor real y lo hace sentir:
     - Academia (academia.js): tarjeta .ac-fb.is-ok / .is-bad y fin de lección .ac-card-end
     - Práctica (app.js): #fb.feedback con .ok / .bad y resumen .session-summary
   Aporta sonidos, combos, animaciones, el Profe Leo en el error, celebraciones,
   pantalla de resultados y una razón para volver mañana.
   REGLAS: nunca decide si una respuesta es correcta, nunca guarda progreso,
   nunca toca respuestas, ids, errores, límites ni audios. Si algo falla aquí,
   el ejercicio sigue funcionando igual.
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled || !window.K) return;
  var d = document, html = d.documentElement, K = window.K, A = K.ART, SND = K.SND;
  var COMBO_AT = { 3: 'Combo ×3', 5: 'Combo ×5', 8: 'Combo ×8', 10: '¡Combo ×10!', 15: '¡Combo ×15!', 20: '¡Combo ×20!' };
  var run = null;                                   // racha de la sesión en curso (solo visual)
  function newRun(){ run = { ok: 0, bad: 0, first: 0, combo: 0, best: 0, t0: Date.now(), seen: new WeakSet(), mis0: null }; }
  newRun();

  function snapshotMistakes(){
    if(run.mis0 || !window.V2D) return;
    run.mis0 = 'pending';
    V2D.mistakes().then(function(m){ run.mis0 = m ? index(m) : null; });
  }
  function index(m){ var o = {}; ['active', 'recovered', 'mastered'].forEach(function(k){ m[k].forEach(function(e){ o[e.id] = { s: k, label: e.label || e.topic }; }); }); return o; }

  /* ---------- Una respuesta calificada por el motor ---------- */
  function graded(node, ok, ctx){
    if(run.seen.has(node)) return; run.seen.add(node);
    snapshotMistakes();
    var card = node;          // el efecto se aplica solo a la retroalimentación (nunca a la página entera)
    if(ok){
      run.ok++; run.combo++; if(run.combo > run.best) run.best = run.combo;
      SND.play(COMBO_AT[run.combo] ? 'combo' : 'correct'); SND.haptic(12);
      pulse(card, 'v2-fx-ok');
      var retry = card && card.querySelector('.ac-retry-tag');
      if(retry) chip(node, A.STK.mend, 'Revancha superada');
      if(COMBO_AT[run.combo]) combo(node, COMBO_AT[run.combo]);
    } else {
      run.bad++; run.combo = 0;
      SND.play('wrong'); SND.haptic([8, 40, 8]);
      pulse(card, 'v2-fx-bad');
      leo(node);
    }
  }
  function pulse(el, cls){ if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(function(){ el.classList.remove(cls); }, 900); }
  function combo(anchor, text){
    var c = K.h('<div class="v2-combo" role="status">' + A.STK.combo + '<b>' + text + '</b></div>');
    anchor.insertBefore(c, anchor.firstChild);
    c.classList.add('k-scope');
  }
  function chip(anchor, ico, text){ var c = K.h('<span class="v2-chip-fx">' + ico + text + '</span>'); c.classList.add('k-scope'); anchor.appendChild(c); }
  /* El Profe Leo aparece solo para enseñar: en el error, junto a la explicación del motor */
  function leo(fb){
    if(fb.querySelector('.v2-leo-tip')) return;
    var t = d.createElement('div'); t.className = 'v2-leo-tip';
    t.innerHTML = '<img src="v2/leo/leo-face.png" alt=""><span>Profe Leo</span>';
    fb.insertBefore(t, fb.firstChild);
  }

  /* ---------- Fin de sesión o de lección: pantalla de resultados ---------- */
  function results(host, kind){
    if(!host || host.querySelector('.v2-results')) return;
    var total = run.ok + run.bad, firstPct = null;
    var engineText = (host.querySelector('.summary-score, .ac-text') || {}).textContent || '';
    var m = /(\d+)\s*(?:de|\/)\s*(\d+)/.exec(engineText);           // lo que el MOTOR dice (aciertos a la primera)
    if(m){ firstPct = Math.round(+m[1] / Math.max(1, +m[2]) * 100); }
    else if(total){ firstPct = Math.round(run.ok / total * 100); }
    var mins = Math.max(1, Math.round((Date.now() - run.t0) / 60000));
    var perfect = firstPct === 100;
    var title = kind === 'leccion' ? (perfect ? '¡Lección perfecta!' : '¡Lección completa!') : (perfect ? '¡Sesión perfecta!' : firstPct >= 90 ? '¡Excelente sesión!' : firstPct >= 70 ? '¡Muy bien!' : 'Sesión completada');
    var sub = firstPct == null ? '' : perfect ? 'Todo a la primera. Así se construye el dominio.' : firstPct >= 90 ? 'Casi todo a la primera. Se nota la práctica.' : firstPct >= 70 ? 'Vas firme. Lo que fallaste ya está en tu repaso.' : 'Cada error quedó guardado para reforzarlo. Así se aprende.';
    var box = K.h('<div class="v2-results">' +
      '<div class="v2-results__top"><div class="ring ring--ok v2-results__ring" role="img" aria-label="Aciertos: ' + (firstPct == null ? 'sin datos' : firstPct + '%') + '">' + K.ring((firstPct || 0) / 100, 30, 8) + '<div class="ring__center"><b class="ring__n">' + (firstPct == null ? '–' : '<span data-n>' + 0 + '</span>%') + '</b></div></div>' +
      '<div><span class="t-eyebrow">' + (kind === 'leccion' ? 'Resultado de la lección' : 'Resultado de la sesión') + '</span><h2>' + title + '</h2><p>' + sub + '</p></div></div>' +
      '<div class="v2-results__chips">' +
        (m ? '<span>' + A.ICO.target + '<b>' + m[1] + '/' + m[2] + '</b><small>a la primera</small></span>' : (total ? '<span>' + A.ICO.target + '<b>' + run.ok + '/' + total + '</b><small>aciertos</small></span>' : '')) +
        '<span>' + A.STK.combo + '<b>' + run.best + '</b><small>mejor combo</small></span>' +
        '<span>' + A.ICO.time + '<b>' + mins + ' min</b><small>de práctica</small></span>' +
      '</div>' +
      '<div class="v2-results__mend" hidden></div>' +
      '<div class="v2-results__why"></div>' +
      '</div>');
    box.classList.add('k-scope');
    host.insertBefore(box, host.firstChild);
    var n = box.querySelector('[data-n]'); if(n) K.countTo(n, 0, firstPct, 900);
    SND.play('complete');
    if(kind === 'leccion' || firstPct >= 90) setTimeout(function(){ K.confetti(kind === 'leccion' ? .7 : .5); }, 250);
    whyReturn(box.querySelector('.v2-results__why'));
    if(kind === 'sesion') simplify(host);
    mendDiff(box.querySelector('.v2-results__mend'));
    var finished = run; newRun(); run.mis0 = null; void finished;
  }
  /* Pocas decisiones a la vez: una acción principal; lo demás, plegado (se MUEVEN los botones reales) */
  function simplify(host){
    var acts = host.querySelector('.summary-actions'), sw = host.querySelector('.summary-switch');
    var back = acts && acts.querySelector('a[href="miembros.html"]');
    var again = acts && acts.querySelector('#againBtn, #dailyAgainBtn');
    var rec = Array.prototype.filter.call(host.querySelectorAll('a.btn-primary, button.btn-primary, a[class*="btn"][class*="primary"]'), function(b){ return b !== again; });
    if(again && rec.length) again.classList.replace('btn-primary', 'btn-ghost');
    if(sw || back){
      var det = d.createElement('details'); det.className = 'v2-details v2-more-opts'; det.innerHTML = '<summary>Más opciones</summary>';
      if(back) det.appendChild(back); if(sw) det.appendChild(sw);
      host.appendChild(det);
    }
  }
  /* Una razón clara para volver: racha real, meta de hoy en minutos y lo que toca mañana */
  function whyReturn(el){
    var rows = [];
    try{
      if(window.V2D && typeof computeStreak === 'function'){
        var p = V2D.practice();
        if(p.practicedToday) rows.push('<li>' + A.STK.flame + '<span><b>' + p.streak + (p.streak === 1 ? ' día' : ' días') + ' de racha.</b> Hoy ya cuenta. Vuelve mañana para el día ' + (p.streak + 1) + '.</span></li>');
        var left = Math.max(0, p.goal - p.todayMin);
        rows.push('<li>' + A.ICO.time + '<span>' + (left ? '<b>Te faltan ' + left + ' min</b> para tu meta de hoy (' + p.goal + ' min).' : '<b>Meta de hoy cumplida:</b> ' + p.todayMin + ' de ' + p.goal + ' min.') + '</span></li>');
      }
    }catch(e){}
    var next = d.querySelector('.ac-card-end ~ .ac-nav a.ac-btn-primary, .ac-nav-col a.ac-btn-primary');
    if(next && /Siguiente lección/.test(next.textContent)) rows.push('<li>' + A.ICO.lesson + '<span><b>Lo que sigue:</b> ' + K.esc(next.textContent.replace(/^Siguiente lección:\s*/, '')) + '.</span></li>');
    if(rows.length) el.appendChild(K.h('<ul class="v2-why">' + rows.join('') + '</ul>'));
  }
  /* Celebración honesta del Método Leo: compara mistake_stats antes y después (la base aplica las reglas) */
  function mendDiff(el){
    var before = run.mis0; if(!before || before === 'pending' || !window.V2D) return;
    var tries = 0;
    (function check(){
      tries++;
      V2D.mistakes().then(function(m){
        if(!m){ return; }
        var after = index(m), rec = [], mas = [];
        Object.keys(after).forEach(function(id){ var b = before[id]; if(!b) return; if(after[id].s === 'mastered' && b.s !== 'mastered') mas.push(after[id].label); else if(after[id].s === 'recovered' && b.s === 'active') rec.push(after[id].label); });
        if(!rec.length && !mas.length){ if(tries < 3) setTimeout(check, 2500); return; }
        var li = function(t, cls){ return '<li class="' + cls + '">' + K.esc(t) + '</li>'; };
        el.innerHTML = K.px('<div class="v2-mend-win">' + A.STK.mend + '<div><b>' + (mas.length ? 'Método Leo: ¡dominaste ' + mas.length + (mas.length === 1 ? ' error' : ' errores') + '!' : 'Método Leo: recuperaste ' + rec.length + (rec.length === 1 ? ' error' : ' errores')) + '</b>' +
          '<ul>' + mas.map(function(t){ return li('Dominado: ' + t, 'is-mas'); }).join('') + rec.map(function(t){ return li('Recuperado: ' + t, 'is-rec'); }).join('') + '</ul></div></div>');
        el.hidden = false;
        SND.play(mas.length ? 'achievement' : 'recovered'); SND.haptic([20, 40, 30]);
        K.toast(A.STK.mend, mas.length ? 'Error dominado' : 'Error recuperado', mas.length ? '4 aciertos seguidos: ya es tuyo.' : '2 aciertos seguidos. Dos más y lo dominas.');
      });
    })();
  }

  /* Evaluación aprobada: la insignia la entregó el SERVIDOR; aquí solo se celebra */
  function badgeWon(el){
    if(el.dataset.v2Done) return; el.dataset.v2Done = '1';
    var id = (location.hash.replace(/^#\/?/, '').split('/')[1]) || 'to-be';
    var art = K.h('<div class="v2-badge-reveal">' + K.emblem(id, { shape: 'hex', size: 112, ribbon: true }) + '</div>'); art.classList.add('k-scope');
    el.parentNode.insertBefore(art, el);
    SND.play('achievement'); SND.haptic([20, 40, 30]);
    setTimeout(function(){ K.confetti(1); }, 200);
  }

  /* Control discreto de sonido dentro de la lección (abre la hoja de sonido y volumen) */
  function soundBtn(top){
    if(top.querySelector('.v2-snd-btn')) return;
    var b = d.createElement('button'); b.type = 'button'; b.className = 'v2-snd-btn';
    var paint = function(){ b.innerHTML = K.px(SND.enabled ? A.UI.speaker : A.UI.soundOff); b.setAttribute('aria-label', SND.enabled ? 'Sonidos de efectos activados. Ajustar' : 'Sonidos de efectos en silencio. Ajustar'); };
    paint(); window.addEventListener('v2:sound', paint);
    b.addEventListener('click', function(){ K.soundSheet(); });
    top.appendChild(b);
  }

  /* ---------- Observador: solo lee clases que pone el motor ---------- */
  function scan(n){
    if(!n || n.nodeType !== 1) return;
    var tops = n.matches && n.matches('.ac-top') ? [n] : (n.querySelectorAll ? n.querySelectorAll('.ac-top') : []);
    Array.prototype.forEach.call(tops, soundBtn);
    var fbs = n.matches && n.matches('.ac-fb') ? [n] : n.querySelectorAll ? n.querySelectorAll('.ac-fb') : [];
    Array.prototype.forEach.call(fbs, function(f){ graded(f, f.classList.contains('is-ok')); });
    var end = n.matches && n.matches('.ac-card-end') ? n : (n.querySelector && n.querySelector('.ac-card-end'));
    if(end && /Lección .* completa|¡Lección completa!/.test(end.textContent)) results(end, 'leccion');
    var won = n.matches && n.matches('.ac-badge-won') ? n : (n.querySelector && n.querySelector('.ac-badge-won'));
    if(won) badgeWon(won);
    var sum = n.matches && n.matches('.session-summary') ? n : (n.querySelector && n.querySelector('.session-summary'));
    if(sum) results(sum, 'sesion');
  }
  var mo = new MutationObserver(function(list){
    list.forEach(function(r){
      if(r.type === 'attributes'){
        var t = r.target;
        if(t.classList.contains('feedback') && t.classList.contains('show') && (t.classList.contains('ok') || t.classList.contains('bad')) && !t.dataset.v2Graded){
          t.dataset.v2Graded = '1'; graded(t, t.classList.contains('ok'));
        }
        return;
      }
      Array.prototype.forEach.call(r.addedNodes, scan);
      /* Un nuevo #fb vacío = nueva pregunta: se puede calificar otra vez */
      Array.prototype.forEach.call(r.addedNodes, function(n){ if(n.nodeType === 1){ var f = n.id === 'fb' ? n : n.querySelector && n.querySelector('#fb'); if(f) delete f.dataset.v2Graded; } });
    });
  });
  mo.observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  /* Academia: modo enfoque dentro de lecciones, repasos y evaluaciones (sin barra inferior) */
  function focusMode(parts){
    parts = parts || location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
    var on = parts[0] === 'curso' && /^(leccion|repaso|practica|evaluacion)$/.test(parts[2] || '');
    html.classList.toggle('v2-focus', on);
    if(!on) newRun();
  }
  window.addEventListener('icl:academia-ruta', function(e){ focusMode(e.detail && e.detail.parts); });
  if(d.getElementById('acRoot')) focusMode();
  /* Práctica (app.js): al empezar otra sesión con "Hacer otra sesión" se reinicia el combo */
  d.addEventListener('click', function(e){ if(e.target.closest('#againBtn, #dailyAgainBtn, .skill-tab-btn, .daily-btn')) newRun(); }, true);
  /* Toques con sensación de app: sonido suave al elegir una opción (no afecta la respuesta) */
  d.addEventListener('click', function(e){ if(e.target.closest('.ac-opt:not(:disabled), .option:not(:disabled), .ac-tok, .ac-mbtn')) SND.play('select'); }, true);
})();
