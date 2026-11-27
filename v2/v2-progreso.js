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

    /* Bloque B (UX): cuatro respuestas claras arriba (esta semana, lo que superaste, lo que aprendiste, lo que
       mejora) y un siguiente paso. Las gráficas, el detalle del Método Leo y los cursos quedan en desplegables;
       las estadísticas clásicas siguen al final. Mismos datos reales que antes. */
    var prevDays = (function(){ try{ var mon = new Date(); mon.setHours(12, 0, 0, 0); mon.setDate(mon.getDate() - (mon.getDay() + 6) % 7); var pm = new Date(mon); pm.setDate(pm.getDate() - 7);
      var a = V2D.ymd(pm), b = V2D.ymd(mon), set = {}; loadProgress().sessions.forEach(function(x){ if(x && x.skill !== 'check' && x.date >= a && x.date < b) set[x.date] = 1; }); return Object.keys(set).length; }catch(e){ return null; } })();
    var dd = prevDays == null ? '' : p.weekDaysCount > prevDays ? ' · ' + (p.weekDaysCount - prevDays) + (p.weekDaysCount - prevDays === 1 ? ' día más' : ' días más') + ' que la semana pasada' : p.weekDaysCount === prevDays && prevDays ? ' · igual que la semana pasada' : '';
    var names = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    var dots = '<div class="v2-wdots" aria-label="Días practicados esta semana">' + names.map(function(n, i){ return '<span class="' + (p.weekDays[i] ? 'is-on' : '') + (i === p.todayIdx ? ' is-today' : '') + '"><i>' + (p.weekDays[i] ? A.UI.check : '') + '</i>' + n + '</span>'; }).join('') + '</div>';
    var row = function(ic, c, t, sub, href, cta){ return '<' + (href ? 'a href="' + href + '"' : 'div') + ' class="v2-task"><span class="v2-task__ic v2-task__ic--' + c + '">' + ic + '</span><span><b>' + t + '</b><small>' + sub + '</small></span>' + (href ? (cta ? '<span class="v2-task__cta">' + cta + '</span>' : A.UI.chevron) : '') + '</' + (href ? 'a' : 'div') + '>'; };
    var lessonsDone = (acad || []).reduce(function(t, c){ return t + (c.done || 0); }, 0);
    var superaste = mis ? row(A.STK.mend, 'mend', mis.recovered.length + mis.mastered.length ? (mis.recovered.length + mis.mastered.length) + ' errores superados' : 'Todavía sin errores superados',
        (mis.recoveredWeek ? mis.recoveredWeek + ' esta semana · ' : '') + mis.mastered.length + ' dominados · ' + mis.active.length + ' en refuerzo', '#metodo') : '';
    var aprendiste = acad && acad.length ? row(A.STK.trophy, 'award', won.length + (won.length === 1 ? ' curso aprobado' : ' cursos aprobados'), lessonsDone + (lessonsDone === 1 ? ' lección completada' : ' lecciones completadas') + ' en la Academia', 'academia.html#/logros', 'Ver') : '';
    var mejora = row(A.ICO.target, 'ok', 'Aciertos: ' + (acc == null ? 'sin datos aún' : acc + ' %'),
      (cur != null && prev != null ? (cur > prev ? '+' + (cur - prev) + ' puntos frente a la semana pasada' : cur === prev ? 'Igual que la semana pasada' : 'La semana pasada acertaste ' + prev + ' %') : 'Últimos 7 días') + (lvl ? ' · nivel ' + esc(lvl) : ''));
    var quickN = mis ? (V2D.quickReview ? V2D.quickReview(mis.active) : mis.active.slice(0, 10)).length : 0;
    var nextStep = quickN ? '<a class="btn btn--lg btn--block btn--mend v2-prog-next" href="errores.html?modo=rapido">Siguiente paso: repasa ' + (quickN === 1 ? 'tu error clave' : quickN + ' errores clave') + '</a>'
      : '<a class="btn btn--lg btn--block v2-prog-next" href="plan-estudio.html?empezar=1">Siguiente paso: tu sesión recomendada</a>';
    var exp = function(id, ic, c, t, sub, body){ return '<details class="v2-expand"' + (id ? ' id="' + id + '"' : '') + '><summary><span class="v2-task__ic v2-task__ic--' + c + '">' + ic + '</span><span>' + t + '<small>' + sub + '</small></span>' + A.UI.chevron + '</summary><div class="v2-expand__body">' + body + '</div></details>'; };
    var html = '<div class="v2-screen is-wide v2-progreso v2-stack">' +
      '<header><h1 class="v2-h1">Tu progreso</h1><p class="v2-sub">' + weekLabel() + '</p></header>' +
      '<section class="v2-week" aria-labelledby="v2WkT"><div class="v2-week__top"><div><b id="v2WkT">' + (p.weekDaysCount ? 'Practicaste ' + p.weekDaysCount + (p.weekDaysCount === 1 ? ' día' : ' días') + ' esta semana' : 'Esta semana todavía no practicas') + '</b>' +
        '<small>' + (p.weekDaysCount ? p.weekMin + ' minutos' + dd : 'Una sesión corta ya cuenta.') + '</small></div><span class="v2-week__streak" aria-label="Racha: ' + p.streak + ' días">' + A.STK.flame + p.streak + '</span></div>' + dots + '</section>' +
      (superaste ? '<section class="v2-stack-sm"><h2 class="v2-eyebrow">Lo que superaste</h2>' + superaste + '</section>' : '') +
      (aprendiste ? '<section class="v2-stack-sm"><h2 class="v2-eyebrow">Lo que aprendiste</h2>' + aprendiste + '</section>' : '') +
      '<section class="v2-stack-sm"><h2 class="v2-eyebrow">Está mejorando</h2>' + mejora + '</section>' +
      nextStep +
      '<section class="v2-stack-sm"><h2 class="v2-eyebrow">En detalle</h2>' +
      (mis ? exp('metodo', A.STK.mend, 'mend', 'Método Leo', mis.active.length + ' en refuerzo · ' + mis.recovered.length + ' recuperados · ' + mis.mastered.length + ' dominados',
        '<p class="panel__sub">Un error se recupera con 2 aciertos seguidos y se domina con 4. Si vuelves a fallar, empieza de nuevo.</p>' + mendChart +
        (mis.active.length ? '<h3 class="v2-sub">En refuerzo</h3><ul class="mlist mlist--panel">' + mis.active.slice(0, 6).map(listRow).join('') + '</ul>' : '') +
        (mis.recovered.length ? '<h3 class="v2-sub">Camino a dominarlos</h3><ul class="mlist mlist--panel">' + mis.recovered.slice(0, 4).map(listRow).join('') + '</ul>' : '') +
        (mis.active.length ? '<a class="btn btn--mend btn--block" href="errores.html">Ver todos mis errores</a>' : '<p class="panel__sub">Sin errores pendientes. Cuando falles algo, aparecerá aquí para reforzarlo.</p>')) : '') +
      exp('', A.ICO.target, 'ok', 'Aciertos y actividad', 'Gráficas por semana y por día',
        '<h3 class="v2-sub">Evolución de tus aciertos' + (cur != null && prev != null ? ' <b class="t-num delta">' + (cur - prev >= 0 ? '+' : '') + (cur - prev) + ' pts</b>' : '') + '</h3><p class="panel__sub">Porcentaje de respuestas correctas, por semana.</p>' + accChart +
        '<h3 class="v2-sub">Actividad: ' + p.weekMin + ' min</h3><p class="panel__sub">Minutos de práctica por día esta semana. Tu meta: ' + p.goal + ' min al día. Racha: ' + p.streak + ' (mejor: ' + p.bestStreak + ').</p>' + K.barChart(p.week, ['L', 'M', 'X', 'J', 'V', 'S', 'D'], p.todayIdx, 'min')) +
      (acad && acad.length ? exp('', A.ICO.lesson, 'brand', 'Cursos de la Academia', won.length + ' de ' + acad.length + ' aprobados · ' + lessonsDone + ' lecciones',
        '<p class="panel__sub">Un curso queda aprobado al superar su evaluación y ganar su insignia. La barra muestra sus lecciones.</p>' +
        '<div class="v2-course-list">' + V2D.courseOrder().map(function(id, i){ var c = acad.filter(function(x){ return x.id === id; })[0]; if(!c) return ''; var sg = K.STAGES.filter(function(s){ return i >= s.from && i < s.to; })[0] || K.STAGES[0], ok = won.indexOf(id) >= 0;
          return '<a class="v2-course" href="academia.html#/curso/' + id + '">' + K.emblem(id, { shape: sg.shape, locked: !ok && !c.done, size: 44, ribbon: ok }) + '<span><b>' + esc(c.title) + '</b><small>' + (ok ? 'Insignia conseguida' : c.finished ? 'Lecciones completas · falta la evaluación' : c.done ? c.done + ' de ' + c.total + ' lecciones' : 'Sin empezar') + '</small><span class="bar bar--sm bar--brand"><span class="bar__fill" style="width:' + Math.round(c.done / c.total * 100) + '%"></span></span></span></a>'; }).join('') + '</div>') : '') +
      '</section>' +
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
      /* Enlaces a "tu diagnóstico" (Plan de estudio): está en las estadísticas detalladas, que se abren */
      if(location.hash === '#diagnostico' && details){ details.open = true; var dg = d.getElementById('diagnostico'); if(dg) setTimeout(function(){ dg.scrollIntoView({ block: 'start' }); }, 80); }
      if(location.hash === '#metodo' || location.hash === '#diagnostico'){ var m = d.getElementById('metodo'); if(m && location.hash === '#metodo'){ m.open = true; m.scrollIntoView(); } }
      screen.addEventListener('click', function(e){ var a = e.target.closest('a[href="#metodo"]'); if(!a) return; e.preventDefault(); var m = d.getElementById('metodo'); if(m){ m.open = true; m.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'start' }); } });
      K.$$('.v2-expand', screen).forEach(function(dt){ dt.addEventListener('toggle', function(){ if(dt.open) SND.play('open'); }); });
      d.title = 'Tu progreso - Inglés con Leo';
    });
  }
  window.addEventListener('v2:shell', mount);
  window.addEventListener('v2:goal', mount);
  window.addEventListener('leo-progress-synced', function(){ if(screen) mount(); });
  if(d.querySelector('.v2-shell')) mount();
})();
