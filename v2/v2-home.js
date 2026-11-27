/* =========================================================
   Inglés con Leo 2.0 · Inicio del alumno (miembros.html, solo miembros)
   Pantalla "Inicio" del prototipo v3 con datos REALES:
     siguiente lección (academia_progress), meta diaria en minutos (sesiones
     reales), racha (computeStreak), aciertos (últimos 7 días), reto diario,
     Método Leo (mistake_stats) e insignias (academia_badges).
   Las tarjetas reales de sugerencia de nivel y de opinión se conservan.
   SEO: solo corre cuando la página ya mostró el área de miembro.
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled || !window.K || !window.V2D) return;
  var d = document, K = window.K, A = K.ART, SND = K.SND, esc = K.esc;
  if((location.pathname.split('/').pop() || '').toLowerCase() !== 'miembros.html') return;
  var screen = null, celebrated = false;
  var COURSES = function(){ try{ return ACADEMIA_CURSOS.courses; }catch(e){ return {}; } };
  var px = function(s){ return K.px(s); };

  function weekHTML(p){
    var names = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return '<div class="week" aria-label="Días practicados esta semana">' + names.map(function(n, i){
      return '<div><span>' + n + '</span><i class="' + (p.weekDays[i] ? 'is-on' : '') + ' ' + (i === p.todayIdx ? 'is-today' : '') + '">' + (p.weekDays[i] ? A.UI.check : '') + '</i></div>'; }).join('') + '</div>';
  }
  function nextFrom(courses){
    if(!courses || !courses.length) return null;
    var pick = window.InicioAlumno ? InicioAlumno.pick(courses) : null;
    if(pick) return { c: pick, n: Math.min(pick.done + 1, pick.total), state: 'continue' };
    var fresh = courses.filter(function(c){ return !c.started && !c.finished; })[0];
    if(fresh) return { c: fresh, n: 1, state: 'start' };
    return { c: courses[courses.length - 1], n: 0, state: 'done' };
  }

  function render(data){
    var p = data.p, acad = data.acad, mis = data.mis, bad = data.bad;
    var name = V2D.name();
    var left = Math.max(0, p.goal - p.todayMin), metDone = p.todayMin >= p.goal;
    var nx = nextFrom(acad);
    var retoHoy = (function(){ try{ return loadProgress().sessions.some(function(s){ return s.skill === 'reto-diario' && s.date === V2D.ymd(new Date()); }); }catch(e){ return false; } })();
    var mission;
    if(nx && nx.state !== 'done'){
      var href = 'academia.html#/curso/' + nx.c.id + '/leccion/' + nx.n;
      mission = '<section class="mission" id="v2Mission" aria-labelledby="v2MissionT">' +
        '<div class="mission__copy"><span class="mission__eyebrow">' + (nx.state === 'start' ? 'Empieza aquí' : 'Tu siguiente lección') + '</span>' +
        '<h2 id="v2MissionT">' + esc(nx.c.title) + '</h2>' +
        '<p class="mission__course">Lección ' + nx.n + ' de ' + nx.c.total + ' · ' + nx.c.done + ' completadas</p>' +
        '<div class="mission__chips"><span>' + A.UI.clockLine + 'Unos 6 min</span><span>' + A.STK.flame + 'Suma a tu racha</span></div></div>' +
        '<div class="mission__node" aria-hidden="true">' + K.ring(nx.c.total ? nx.c.done / nx.c.total : 0, 31, 6, 'mission__ring') + '<span class="mission__em">' + K.emblem(nx.c.id, { shape: 'hex', size: 84 }) + '</span></div>' +
        '<a class="btn btn--lg btn--block mission__cta" href="' + href + '">' + (nx.state === 'start' ? 'Empezar lección' : 'Continuar lección') + '</a></section>';
    } else if(nx && nx.state === 'done'){
      mission = '<section class="mission is-done" aria-labelledby="v2MissionT"><div class="mission__copy"><span class="mission__eyebrow">' + A.UI.check + 'Lecciones completadas</span>' +
        '<h2 id="v2MissionT">Terminaste todas las lecciones abiertas</h2><p class="mission__course">Haz la evaluación de cada curso y gana su insignia.</p></div>' +
        '<a class="btn btn--lg btn--block mission__cta" href="academia.html">Ir a la Academia</a></section>';
    } else {
      mission = '<section class="mission" aria-labelledby="v2MissionT"><div class="mission__copy"><span class="mission__eyebrow">Academia</span>' +
        '<h2 id="v2MissionT">Aprende inglés paso a paso</h2><p class="mission__course">Cursos cortos, lección por lección.</p></div>' +
        '<a class="btn btn--lg btn--block mission__cta" href="academia.html">Ir a la Academia</a></section>';
    }
    var acc = p.acc7.pct;
    var won = (bad || []).map(function(b){ return b.course_id; });
    var order = V2D.courseOrder();
    var methodHTML = '';
    if(mis){
      var act = mis.active;
      methodHTML = '<section class="mcard" aria-labelledby="v2McT"><div class="mcard__head"><span class="method__eyebrow">' + A.STK.mend + 'Método Leo</span><a class="link" href="progreso.html#metodo">Tu historial</a></div>' +
        '<div class="mcard__row"><div><h2 id="v2McT">' + act.length + ' ' + (act.length === 1 ? 'error' : 'errores') + ' en refuerzo</h2>' +
        '<p><b>' + mis.recovered.length + '</b> recuperados · <b>' + mis.mastered.length + '</b> dominados · 2 aciertos seguidos recuperan, 4 dominan</p></div></div>' +
        '<ul class="mlist">' + (act.slice(0, 3).map(function(e){ return '<li><span><b>' + esc(e.label || e.topic) + '</b><small>' + esc(e.topic) + '</small></span>' + K.steps(e.streak) + '</li>'; }).join('') || '<li class="is-empty">Sin errores pendientes. ¡Bien!</li>') + '</ul>' +
        (act.length ? '<a class="btn btn--mend btn--block" href="errores.html">Reforzar ahora</a>' : '') + '</section>';
    }
    var badgesHTML = order.length ? '<section class="v2-badges-row"><div class="block__head"><h2>Tus insignias</h2><a class="link" href="academia.html#/logros">Ver colección</a></div>' +
      '<div class="course-row">' + order.map(function(id, i){ var sg = K.STAGES.filter(function(s){ return i >= s.from && i < s.to; })[0] || K.STAGES[0];
        var ok = won.indexOf(id) >= 0; return '<a href="academia.html#/logros" aria-label="' + esc((COURSES()[id] || {}).title || id) + (ok ? ', insignia conseguida' : ', pendiente') + '">' + K.emblem(id, { shape: sg.shape, locked: !ok, size: 44 }) + '</a>'; }).join('') + '</div></section>' : '';

    var html = '<div class="v2-screen v2-home">' +
      '<section class="hello"><div><h1>' + K.greeting() + (name ? ', ' + esc(name) : '') + '</h1>' +
        '<p class="hello__line">' + (metDone ? 'Hoy ya cumpliste tu meta. Lo que sumes es extra.' : (p.todayMin ? 'Te faltan <b>' + left + ' min</b> para tu meta de hoy.' : 'Tu meta de hoy: <b>' + p.goal + ' minutos</b> de práctica.')) + '</p></div></section>' +
      mission +
      '<div class="v2-slot-real" data-real="nivel"></div>' +
      '<div class="today" role="group" aria-label="Tu día">' +
        '<button type="button" class="today__item" id="v2Goal"><span class="ring" style="--k-ring:40px">' + K.ring(p.todayMin / p.goal, 30, 9) + '<span class="ring__center">' + (metDone ? A.UI.check : '') + '</span></span><span class="today__num"><span id="v2GoalN">' + p.todayMin + '</span><small>/' + p.goal + ' min</small></span><span class="today__lbl">Meta de hoy</span></button>' +
        '<button type="button" class="today__item ' + (p.practicedToday ? '' : 'is-pending') + '" id="v2StreakT">' + A.STK.flame + '<span class="today__num">' + p.streak + '</span><span class="today__lbl">' + (p.streak === 1 ? 'Día' : 'Días') + ' de racha</span></button>' +
        '<a class="today__item" href="progreso.html">' + A.ICO.target + '<span class="today__num">' + (acc == null ? '–' : acc) + '<small>' + (acc == null ? '' : '%') + '</small></span><span class="today__lbl">Aciertos 7 días</span></a>' +
      '</div>' +
      '<a class="v2-reto ' + (retoHoy ? 'is-done' : '') + '" href="practica-miembros.html#reto">' + A.STK.calendar + '<span><span class="t-eyebrow">Reto diario</span><b>' + (retoHoy ? 'Reto de hoy completado' : 'El reto de hoy te espera') + '</b><small>' + (retoHoy ? 'Mañana hay otro. Puedes repetirlo cuando quieras.' : 'Preguntas variadas de tu nivel, unos 5 minutos.') + '</small></span>' + (retoHoy ? '<span class="v2-reto__ok">' + A.UI.check + '</span>' : A.UI.chevron) + '</a>' +
      methodHTML + badgesHTML +
      '<div class="v2-slot-real" data-real="opinion"></div>' +
      '</div>';
    /* En miembros.html el sitio fija "#memberContent section{padding}": se usan div con rol de región */
    html = html.replace(/<section\b/g, '<div role="region"').replace(/<\/section>/g, '</div>');
    var el = K.h(html); el.classList.add('k-scope');
    return el;
  }

  function mount(data){
    var mc = d.getElementById('memberContent'); if(!mc) return;
    var fresh = render(data);
    /* Tarjetas reales que deben seguir funcionando: se mueven, no se copian */
    [['nivel', 'levelSuggest'], ['opinion', 'feedbackCard']].forEach(function(x){ var real = d.getElementById(x[1]), slot = fresh.querySelector('[data-real="' + x[0] + '"]'); if(real && slot) slot.appendChild(real); });
    if(screen){ screen.replaceWith(fresh); } else { mc.insertBefore(fresh, mc.firstChild); mc.classList.add('v2-has-home'); }
    screen = fresh;
    d.title = 'Inicio - Inglés con Leo';
    wire(data);
  }
  function wire(data){
    var p = data.p;
    var g = d.getElementById('v2Goal'); if(g) g.addEventListener('click', function(){ SND.play('open'); goalSheet(p); });
    var s = d.getElementById('v2StreakT'); if(s) s.addEventListener('click', function(){ SND.play('open'); streakSheet(p); });
    var cta = screen.querySelector('.k-mission__cta'); if(cta) cta.addEventListener('click', function(){ SND.play('check'); });
    /* Celebración honesta: solo cuando la meta de hoy ya está cumplida con práctica real, una vez por día */
    if(!celebrated && p.todayMin >= p.goal){
      celebrated = true;
      var k = 'icl.celebrado.meta', today = V2D.ymd(new Date()), seen = null;
      try{ seen = localStorage.getItem(k); }catch(e){}
      if(seen !== today){ try{ localStorage.setItem(k, today); }catch(e){} setTimeout(function(){ SND.play('challenge'); K.confetti(.6); K.toast(A.ICO.target, 'Meta diaria cumplida', p.goal + ' minutos hoy. Lo que sumes es extra.'); }, 600); }
    }
  }
  function goalSheet(p){
    var m = K.sheet({ label: 'Meta de hoy', cls: 'modal--sheet', html:
      '<div class="modal__art">' + K.ring(p.todayMin / p.goal, 30, 9, 'v2-goal-ring') + '</div><h3>' + p.todayMin + ' de ' + p.goal + ' minutos hoy</h3>' +
      '<p>Cuentan los minutos reales de tus lecciones y prácticas. Elige una meta que puedas cumplir todos los días.</p>' +
      '<div class="seg v2-goal-seg" role="group" aria-label="Meta diaria">' + [5, 10, 15, 20].map(function(g){ return '<button type="button" data-goal="' + g + '" aria-pressed="' + (p.goal === g) + '">' + g + ' min</button>'; }).join('') + '</div>' +
      '<a class="btn btn--block" href="' + (screen && screen.querySelector('.k-mission__cta') ? screen.querySelector('.k-mission__cta').getAttribute('href') : 'practica-miembros.html') + '">Practicar ahora</a>' });
    m.box.addEventListener('click', function(e){ var b = e.target.closest('[data-goal]'); if(!b) return; SND.play('select'); V2D.setGoal(+b.getAttribute('data-goal')); m.close(true); refresh(); });
  }
  function streakSheet(p){
    var m = K.sheet({ label: 'Racha', cls: 'modal--streak', html:
      '<div class="modal__art streak-hero' + (p.practicedToday ? '' : ' is-pending') + '">' + A.STK.flame + '</div>' +
      '<h3>' + p.streak + ' ' + (p.streak === 1 ? 'día' : 'días') + ' de racha</h3>' +
      '<p>' + (p.practicedToday ? 'Racha protegida por hoy. Vuelve mañana para sumar otro día.' : 'Cualquier práctica de hoy suma un día. Si un día no puedes, tu racha aguanta un día de descanso.') + '</p>' +
      '<div class="streak-week">' + weekHTML(p) + '</div>' +
      '<div class="streak-stats"><div><b>' + p.streak + '</b><span>Actual</span></div><div><b>' + p.bestStreak + '</b><span>Mejor racha</span></div><div><b>' + p.weekDaysCount + '/7</b><span>Esta semana</span></div></div>' +
      (p.practicedToday ? '<button type="button" class="btn btn--block" data-close>Genial</button>' : '<a class="btn btn--block" href="practica-miembros.html">Practicar ahora</a>') });
    var c = m.box.querySelector('[data-close]'); if(c) c.addEventListener('click', function(){ m.close(true); });
  }

  function refresh(){
    var p = V2D.practice();
    Promise.all([V2D.academy(), V2D.mistakes(), V2D.badges()]).then(function(r){ mount({ p: p, acad: r[0], mis: r[1], bad: r[2] }); });
    if(window.V2SHELL) V2SHELL.paintTop();
  }
  /* Arranca con el shell (que solo existe si el área de miembro ya está visible) */
  function start(){
    var mc = d.getElementById('memberContent');
    /* C8: con la vista previa de una cuenta gratis o vencida hay barra 2.0, pero NO Inicio de miembro */
    if(!mc || mc.style.display === 'none' || getComputedStyle(mc).display === 'none') return;
    if(d.querySelector('.v2-shell')) refresh();
  }
  window.addEventListener('v2:shell', start);
  window.addEventListener('v2:goal', function(){ if(screen) refresh(); });
  window.addEventListener('leo-progress-synced', function(){ if(screen) refresh(); });
  start();
})();
