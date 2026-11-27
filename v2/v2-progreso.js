/* =========================================================
   Inglés con Leo 2.0 · Centro de Progreso (progreso.html)
   Pantalla "Tu progreso" del prototipo v3 con datos REALES:
     historia de la semana, minutos, aciertos, racha, Método Leo
     (en refuerzo / recuperados / dominados), aciertos por semana,
     actividad diaria y cursos de la academia con sus insignias.
   No hay XP ni nivel inventado. Las estadísticas detalladas de siempre
   siguen disponibles (abajo, en "Estadísticas detalladas").
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled || !window.K || !window.V2D) return;
  if((location.pathname.split('/').pop() || '').toLowerCase() !== 'progreso.html') return;
  var d = document, K = window.K, A = K.ART, SND = K.SND, esc = K.esc;
  var screen = null, details = null;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var LEVEL = { principiante: 'Principiante', facil: 'Fácil', medio: 'Intermedio', avanzado: 'Avanzado' };

  function initial(){ var n = V2D.name() || ''; if(!n){ var a = d.getElementById('navAvatar'); n = a ? a.textContent.trim() : ''; } return (n.charAt(0) || '?').toUpperCase(); }
  function weekLabel(){
    var now = new Date(), mon = new Date(now.getFullYear(), now.getMonth(), now.getDate()); mon.setDate(mon.getDate() - (mon.getDay() + 6) % 7);
    var sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    return 'Semana del ' + mon.getDate() + (mon.getMonth() !== sun.getMonth() ? ' de ' + MESES[mon.getMonth()] : '') + ' al ' + sun.getDate() + ' de ' + MESES[sun.getMonth()];
  }

  function render(p, mis, acad, bad){
    var acc = p.acc7.pct, prev = p.weeks[4].g.pct, cur = p.weeks[5].g.pct;
    var lvl = (function(){ try{ return LEVEL[getUserLevel()] || ''; }catch(e){ return ''; } })();
    var won = (bad || []).map(function(b){ return b.course_id; });
    /* Historia honesta: solo lo que pasó */
    var parts = [];
    parts.push('practicaste <b>' + p.weekDaysCount + ' ' + (p.weekDaysCount === 1 ? 'día' : 'días') + '</b> (' + p.weekMin + ' min)');
    if(mis && mis.recoveredWeek) parts.push('recuperaste <b>' + mis.recoveredWeek + ' ' + (mis.recoveredWeek === 1 ? 'error' : 'errores') + '</b>');
    if(p.accWeek.pct != null) parts.push('acertaste el <b>' + p.accWeek.pct + '%</b>');
    var story = p.weekDaysCount ? 'Esta semana ' + parts.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.' : 'Esta semana todavía no practicas. Una sesión corta ya cuenta.';
    var tag = (cur != null && prev != null) ? (cur > prev ? '<span class="story__tag">' + A.UI.check + 'Aciertas más que la semana pasada</span>' : cur === prev ? '<span class="story__tag">Igual que la semana pasada</span>' : '<span class="story__tag v2-tag-soft">La semana pasada acertaste ' + prev + '%</span>') : '';

    /* Aciertos por semana (solo semanas con datos) */
    var wk = p.weeks.map(function(w, i){ return { i: i, v: w.g.pct, n: w.g.n, from: w.from }; }).filter(function(w){ return w.v != null; });
    var accChart = wk.length >= 2 ? K.lineChart({ series: [{ v: wk.map(function(w){ return w.v; }), c: 'var(--k-chart-a)', area: true }], min: Math.max(0, Math.min.apply(null, wk.map(function(w){ return w.v; })) - 10), max: 100,
        labels: wk.map(function(w){ return w.from.getDate() + '/' + (w.from.getMonth() + 1); }), aria: 'Porcentaje de aciertos por semana', tip: function(i){ return 'Semana del ' + wk[i].from.getDate() + '/' + (wk[i].from.getMonth() + 1) + ': ' + wk[i].v + '% (' + wk[i].n + ' respuestas)'; }, last: wk[wk.length - 1].v + '%' })
      : '<p class="panel__sub">Con dos semanas de práctica verás aquí cómo evolucionan tus aciertos.</p>';

    /* Método Leo: acumulado de recuperados por semana a partir de recovered_at (dato real) */
    var mendChart = '';
    if(mis){
      var all = mis.recovered.concat(mis.mastered).filter(function(e){ return e.recoveredAt; });
      if(all.length){
        var labels = [], vals = [];
        p.weeks.forEach(function(w){ var end = new Date(w.from); end.setDate(end.getDate() + 7); labels.push(w.from.getDate() + '/' + (w.from.getMonth() + 1)); vals.push(all.filter(function(e){ return new Date(e.recoveredAt) < end; }).length); });
        mendChart = K.lineChart({ series: [{ v: vals, c: 'var(--k-chart-mend)', area: true }], min: 0, max: Math.max(4, vals[vals.length - 1] + 2), labels: labels, aria: 'Errores recuperados (acumulado) por semana',
          tip: function(i){ return 'Hasta la semana del ' + labels[i] + ': ' + vals[i] + ' recuperados'; }, last: vals[vals.length - 1] });
      }
    }
    var listRow = function(e){ return '<li><span><b>' + esc(e.label || e.topic) + '</b><small>' + esc(e.topic) + (e.fails > 1 ? ' · fallado ' + e.fails + ' veces' : '') + '</small></span>' + K.steps(e.streak) + '</li>'; };

    var html = '<div class="v2-screen is-wide v2-progreso">' +
      '<header class="prog-head"><div><span class="t-eyebrow">' + weekLabel() + '</span><h1>Tu progreso</h1></div></header>' +
      '<section class="story"><div class="story__av"><span class="v2-me" aria-hidden="true">' + esc(initial()) + '</span></div><div><p class="story__lead">' + story + '</p>' + tag + '</div></section>' +
      '<div class="measures">' +
        '<div class="measure"><span class="measure__ic">' + A.ICO.time + '</span><b>' + p.weekMin + '<em>min</em></b><span class="measure__k">Práctica</span><small>Esta semana</small></div>' +
        '<div class="measure"><span class="measure__ic">' + A.ICO.target + '</span><b>' + (acc == null ? '–' : acc + '<em>%</em>') + '</b><span class="measure__k">Aciertos</span><small>Últimos 7 días</small></div>' +
        '<div class="measure"><span class="measure__ic">' + A.ICO.days + '</span><b>' + p.streak + '</b><span class="measure__k">Racha</span><small>Mejor: ' + p.bestStreak + ' días</small></div>' +
        '<div class="measure measure--level"><span class="measure__ic">' + A.ICO.level + '</span><b>' + esc(lvl || '–') + '</b><span class="measure__k">Nivel de práctica</span><small>El que elegiste</small></div>' +
      '</div>' +
      (mis ? '<section class="panel" id="metodo"><div class="panel__head"><h2>Método Leo</h2><span class="pill pill--mend">' + mis.mastered.length + ' dominados</span></div>' +
        '<p class="panel__sub">Un error se recupera con 2 aciertos seguidos y se domina con 4. Si vuelves a fallar, empieza de nuevo.</p>' +
        '<div class="v2-mend-counts"><div><b>' + mis.active.length + '</b><span>En refuerzo</span></div><div><b>' + mis.recovered.length + '</b><span>Recuperados</span></div><div><b>' + mis.mastered.length + '</b><span>Dominados</span></div></div>' +
        mendChart +
        (mis.active.length ? '<h3 class="v2-sub">En refuerzo</h3><ul class="mlist mlist--panel">' + mis.active.slice(0, 6).map(listRow).join('') + '</ul>' : '') +
        (mis.recovered.length ? '<h3 class="v2-sub">Camino a dominarlos</h3><ul class="mlist mlist--panel">' + mis.recovered.slice(0, 4).map(listRow).join('') + '</ul>' : '') +
        (mis.active.length ? '<a class="btn btn--mend btn--block" href="errores.html">Reforzar ahora</a>' : '<p class="panel__sub">Sin errores pendientes. Cuando falles algo, aparecerá aquí para reforzarlo.</p>') +
        '</section>' : '') +
      '<section class="panel"><div class="panel__head"><h2>Evolución de tus aciertos</h2>' + (cur != null && prev != null ? '<b class="t-num delta">' + (cur - prev >= 0 ? '+' : '') + (cur - prev) + ' pts</b>' : '') + '</div><p class="panel__sub">Porcentaje de respuestas correctas, por semana.</p>' + accChart + '</section>' +
      '<section class="panel"><div class="panel__head"><h2>Actividad</h2><b class="t-num">' + p.weekMin + ' min</b></div><p class="panel__sub">Minutos de práctica por día esta semana. Tu meta: ' + p.goal + ' min al día.</p>' + K.barChart(p.week, ['L', 'M', 'X', 'J', 'V', 'S', 'D'], p.todayIdx, 'min') + '</section>' +
      (acad && acad.length ? '<section class="panel"><div class="panel__head"><h2>Academia</h2><b class="t-num">' + won.length + '/' + acad.length + ' insignias</b></div><p class="panel__sub">Tus cursos y sus insignias. Toca uno para seguir.</p>' +
        '<div class="v2-course-list">' + V2D.courseOrder().map(function(id, i){ var c = acad.filter(function(x){ return x.id === id; })[0]; if(!c) return ''; var sg = K.STAGES.filter(function(s){ return i >= s.from && i < s.to; })[0] || K.STAGES[0], ok = won.indexOf(id) >= 0;
          return '<a class="v2-course" href="academia.html#/curso/' + id + '">' + K.emblem(id, { shape: sg.shape, locked: !ok && !c.done, size: 44, ribbon: ok }) + '<span><b>' + esc(c.title) + '</b><small>' + (ok ? 'Insignia conseguida' : c.finished ? 'Lecciones completas · falta la evaluación' : c.done ? c.done + ' de ' + c.total + ' lecciones' : 'Sin empezar') + '</small><span class="bar bar--sm bar--brand"><span class="bar__fill" style="width:' + Math.round(c.done / c.total * 100) + '%"></span></span></span></a>'; }).join('') + '</div></section>' : '') +
      '<p class="honest">' + A.UI.info + '<span><b>Minutos</b> = tiempo registrado mientras practicas' + (p.weekEstimated ? ' (esta semana, ' + p.weekEstimated + (p.weekEstimated === 1 ? ' sesión retomada se cuenta' : ' sesiones retomadas se cuentan') + ' como 1 min por ejercicio)' : '') + '. <b>Aciertos</b> = respuestas correctas sobre las calificadas. <b>Recuperado</b> = 2 aciertos seguidos; <b>dominado</b> = 4. Las <b>insignias</b> solo se ganan aprobando la evaluación de un curso.</span></p>' +
      '</div>';
    var el = K.h(html); el.classList.add('k-scope');
    return el;
  }

  function mount(){
    var main = d.querySelector('main'); if(!main) return;
    var p = V2D.practice();
    Promise.all([V2D.mistakes(), V2D.academy(), V2D.badges()]).then(function(r){
      var fresh = render(p, r[0], r[1], r[2]);
      if(screen) screen.replaceWith(fresh); else main.insertBefore(fresh, main.firstChild);
      screen = fresh;
      K.wireCharts(screen);
      if(!details){
        /* Lo clásico queda completo, plegado (divulgación progresiva) */
        details = d.createElement('details'); details.className = 'v2-details v2-classic-progress';
        details.innerHTML = '<summary>Estadísticas detalladas</summary>';
        K.$$('main > :not(.v2-screen):not(.v2-details)').forEach(function(n){ if(n.id !== 'acTabs') details.appendChild(n); });
        main.appendChild(details);
      }
      if(location.hash === '#metodo'){ var m = d.getElementById('metodo'); if(m) m.scrollIntoView(); }
      d.title = 'Tu progreso - Inglés con Leo';
    });
  }
  window.addEventListener('v2:shell', mount);
  window.addEventListener('v2:goal', mount);
  window.addEventListener('leo-progress-synced', function(){ if(screen) mount(); });
  if(d.querySelector('.v2-shell')) mount();
})();
