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
  var I4 = A.I4 || {};   /* Bloque C: familia de iconos propia (v4-icons.js); si faltara, se usan los de antes */
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

  /* Bloque B (UX): Inicio = una acción principal evidente + "Hoy también" (con check solo si hay práctica real
     de hoy) + meta diaria. La racha está en la barra superior; aciertos y estadísticas en Progreso; las insignias
     en Mis logros. Ningún dato se inventa: todo sale de las sesiones, el Método Leo y la Academia reales. */
  function lastPracticeDays(){
    try{ var best = ''; loadProgress().sessions.forEach(function(s){ if(s && s.skill !== 'check' && s.date && s.date > best) best = s.date; });
      if(!best) return null; return Math.round((new Date(V2D.ymd(new Date()) + 'T12:00:00') - new Date(best + 'T12:00:00')) / 86400000); }catch(e){ return null; }
  }
  function didToday(skill){ try{ var t = V2D.ymd(new Date()); return loadProgress().sessions.some(function(s){ return s.skill === skill && s.date === t; }); }catch(e){ return false; } }
  function task(href, ic, c, t, sub, done, extra){
    return '<a class="v2-task' + (done ? ' is-done' : '') + '" href="' + href + '"' + (extra || '') + '><span class="v2-task__ic v2-task__ic--' + c + '">' + ic + '</span><span><b>' + t + '</b><small>' + sub + '</small></span>' +
      (done ? '<span class="v2-task__check" aria-label="Hecho hoy">' + A.UI.check + '</span>' : A.UI.chevron) + '</a>';
  }
  function render(data){
    var p = data.p, acad = data.acad, mis = data.mis;
    var name = V2D.name();
    var left = Math.max(0, p.goal - p.todayMin), metDone = p.todayMin >= p.goal;
    var nx = nextFrom(acad);
    var away = lastPracticeDays(), back = away != null && away >= 3 && !p.practicedToday;
    var fresh = !p.any && (!nx || nx.state === 'start');
    var line = back ? 'Qué bueno verte de nuevo. Todo lo que aprendiste sigue aquí.'
      : fresh ? 'Tu membresía está activa. Elige por dónde empezar.'
      : metDone ? 'Hoy ya cumpliste tu meta. Lo que sumes es extra.'
      : (p.todayMin ? 'Te faltan <b>' + left + ' min</b> para tu meta de hoy.' : 'Tu meta de hoy: <b>' + p.goal + ' minutos</b> de práctica.');
    var mission;
    if(nx && nx.state !== 'done'){
      var href = 'academia.html#/curso/' + nx.c.id + '/leccion/' + nx.n;
      mission = '<section class="v2-next" id="v2Mission" aria-labelledby="v2MissionT"><span class="v2-next__em" aria-hidden="true">' + K.emblem(nx.c.id, { shape: 'hex', size: 64 }) + '</span>' +
        '<span class="v2-next__eyebrow">' + (nx.state === 'start' ? (fresh ? 'Una buena forma de empezar' : 'Empieza aquí') : (back ? 'Retoma donde lo dejaste' : 'Tu siguiente paso')) + '</span>' +
        '<h2 id="v2MissionT">' + esc(nx.c.title) + '</h2>' +
        '<p>Lección ' + nx.n + ' de ' + nx.c.total + ' · Unos 6 min</p>' +
        '<div class="v2-next__meta"><span>' + (nx.c.done ? nx.c.done + ' de ' + nx.c.total + ' completadas' : 'Curso de la Academia') + '</span></div>' +
        '<a class="btn btn--lg btn--block" href="' + href + '">' + (nx.state === 'start' ? 'Empezar lección' : 'Continuar lección') + '</a>' +
        (fresh ? '<a class="v2-next__alt" href="academia.html">Ver todos los cursos</a>' : '') + '</section>';
    } else if(nx && nx.state === 'done'){
      mission = '<section class="v2-next v2-next--done" aria-labelledby="v2MissionT"><span class="v2-next__eyebrow">Lecciones completadas</span>' +
        '<h2 id="v2MissionT">Terminaste todas las lecciones abiertas</h2><p>Haz la evaluación de cada curso y gana su insignia.</p><div class="v2-next__meta"></div>' +
        '<a class="btn btn--lg btn--block" href="academia.html">Ir a la Academia</a></section>';
    } else {
      mission = '<section class="v2-next" aria-labelledby="v2MissionT"><span class="v2-next__eyebrow">Tu práctica de hoy</span>' +
        '<h2 id="v2MissionT">Sesión recomendada</h2><p>Con tu nivel y tus errores recientes.</p><div class="v2-next__meta"></div>' +
        '<a class="btn btn--lg btn--block" href="plan-estudio.html?empezar=1">Empezar</a></section>';
    }
    /* Hoy también: el reto y el repaso de errores. Check = hay una sesión real de hoy */
    var retoHoy = didToday('reto-diario'), errHoy = didToday('errores');
    var tasks = [task('practica-miembros.html#reto', I4.reto || A.STK.calendar, 'streak', 'Reto diario', retoHoy ? 'Hecho hoy. Mañana hay otro.' : '5 preguntas variadas de tu nivel', retoHoy)];
    if(mis){
      var act = mis.active, quick = V2D.quickReview ? V2D.quickReview(act) : act.slice(0, 10);
      if(quick.length || errHoy) tasks.push(task('errores.html?modo=rapido', I4.mend || A.STK.mend, 'mend', quick.length ? 'Repasa ' + (quick.length === 1 ? 'tu error clave' : 'tus ' + quick.length + ' errores clave') : 'Errores clave', errHoy ? 'Repasados hoy · Método Leo' : 'Método Leo · unos 3 min', errHoy));
    }
    if(fresh) tasks.push(task('test-de-nivel-de-ingles.html', I4.level || A.ICO.level, 'brand', '¿No sabes tu nivel?', 'Test de nivel de unos 5 minutos', false));
    var doneN = tasks.filter(function(t){ return t.indexOf('is-done') >= 0; }).length;
    var pct = Math.min(100, Math.round(p.todayMin / p.goal * 100));
    var html = '<div class="v2-screen v2-home v2-stack">' +
      '<header><h1 class="v2-h1">' + (back ? 'Hola de nuevo' : K.greeting()) + (name ? ', ' + esc(name) : '') + '</h1><p class="v2-sub">' + line + '</p></header>' +
      mission +
      '<section class="v2-stack-sm" aria-labelledby="v2HoyT"><h2 class="v2-eyebrow" id="v2HoyT">Hoy también <small>' + doneN + ' de ' + tasks.length + ' hecho' + (doneN === 1 ? '' : 's') + '</small></h2>' + tasks.join('') +
        '<button type="button" class="v2-goal" id="v2Goal" aria-label="Meta de hoy: ' + p.todayMin + ' de ' + p.goal + ' minutos. Cambiar meta"><span class="v2-task__ic v2-task__ic--ok">' + A.ICO.time + '</span>' +
          '<span class="v2-goal__body"><span class="v2-goal__top"><span>Meta de hoy</span><small><b>' + p.todayMin + '</b> de ' + p.goal + ' min</small></span><span class="v2-bar"><i style="--v:' + pct + '%"></i></span></span></button>' +
      '</section>' +
      /* La sugerencia de nivel (tarjeta real) y la encuesta real se conservan, discretas, al final */
      '<div class="v2-slot-real v2-level-slot" data-real="nivel"></div>' +
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
    /* La racha vive en la barra superior: en Inicio, tocarla abre su detalle (antes estaba en la fila de estadísticas) */
    var tb = d.getElementById('v2Streak');
    if(tb && !tb.dataset.v2Sheet){ tb.dataset.v2Sheet = '1'; tb.addEventListener('click', function(e){ if(!screen || !d.body.contains(screen)) return; e.preventDefault(); SND.play('open'); streakSheet(V2D.practice()); }); }
    var cta = screen.querySelector('.v2-next .k-btn'); if(cta) cta.addEventListener('click', function(){ SND.play('check'); });
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
      '<a class="btn btn--block" href="' + (screen && screen.querySelector('.v2-next .k-btn') ? screen.querySelector('.v2-next .k-btn').getAttribute('href') : 'practica-miembros.html') + '">Practicar ahora</a>' });
    m.box.addEventListener('click', function(e){ var b = e.target.closest('[data-goal]'); if(!b) return; SND.play('select'); V2D.setGoal(+b.getAttribute('data-goal')); m.close(true); refresh(); });
  }
  function streakSheet(p){
    var m = K.sheet({ label: 'Racha', cls: 'modal--streak', html:
      '<div class="modal__art streak-hero' + (p.practicedToday ? '' : ' is-pending') + '">' + (A.flame ? A.flame(!p.streak ? 'off' : p.practicedToday ? 'on' : 'pending').replace('class="ico ', 'class="ico v2-flame-xl ') : A.STK.flame) + '</div>' +
      '<h3>' + p.streak + ' ' + (p.streak === 1 ? 'día' : 'días') + ' de racha</h3>' +
      '<p>' + (p.practicedToday ? 'Racha protegida por hoy. Vuelve mañana para sumar otro día.' : 'Cualquier práctica de hoy suma un día. Si un día no puedes, tu racha aguanta un día de descanso.') + '</p>' +
      '<div class="streak-week">' + weekHTML(p) + '</div>' +
      '<div class="streak-stats"><div><b>' + p.streak + '</b><span>Actual</span></div><div><b>' + p.bestStreak + '</b><span>Mejor racha</span></div><div><b>' + p.weekDaysCount + '/7</b><span>Esta semana</span></div></div>' +
      (p.practicedToday ? '<button type="button" class="btn btn--block" data-close>Genial</button>' : '<a class="btn btn--block" href="practica-miembros.html">Practicar ahora</a>') +
      '<a class="btn btn--block btn--ghost" href="progreso.html">Ver mi progreso</a>' });
    var c = m.box.querySelector('[data-close]'); if(c) c.addEventListener('click', function(){ m.close(true); });
  }

  function refresh(){
    var p = V2D.practice();
    Promise.all([V2D.academy(), V2D.mistakes(), V2D.badges()]).then(function(r){ mount({ p: p, acad: r[0], mis: r[1], bad: r[2] }); });
    if(window.V2SHELL) V2SHELL.paintTop();
  }
  /* Arranca con el shell (que solo existe si el área de miembro ya está visible) */
  /* Bloque B (UX): cuenta gratis o vencida (vista previa de miembros.html). Misma lógica de permisos de siempre:
     una práctica principal gratis, lo que también es gratis y UNA invitación (que usa el botón real de pago).
     Lo que incluye la membresía queda plegado. Nada de pagos, límites ni permisos cambia. */
  var pvScreen = null;
  function renderPreview(){
    var pv = d.getElementById('memberPreview'); if(!pv || pvScreen) return;
    var lapsed = pv.classList.contains('is-lapsed'), name = V2D.name();
    var vis = function(id){ var e = d.getElementById(id); return !!(e && getComputedStyle(e).display !== 'none'); };
    var also = [];
    if(vis('previewAcademia')) also.push(task('academia.html', I4.academia || A.STK.book, 'award', 'Prueba el curso TO BE', 'Una explicación y 3 ejercicios', false));
    if(vis('previewModoAprender')) also.push(task('aprender.html', I4.bulb || A.STK.bulb, 'mend', 'Tu primera microlección', '3 minutos, solo mirando y escuchando', false));
    also.push(task('juego.html', I4.rush || A.STK.rush, 'streak', 'English Rush', 'Preguntas rápidas, modo juego', false));
    var act = d.getElementById('previewActivateBtn');
    var html = '<div class="v2-screen v2-home v2-stack v2-preview-home">' +
      '<header><h1 class="v2-h1">Hola' + (name ? ', ' + esc(name) : '') + '</h1><p class="v2-sub">' + (lapsed ? 'Tu membresía no está activa. Tu progreso y tus insignias siguen aquí.' : 'Tu cuenta gratis está lista.') + '</p></header>' +
      '<section class="v2-next" aria-labelledby="v2PvT"><span class="v2-next__eyebrow">' + (lapsed ? 'Mientras tanto, gratis' : 'Tu práctica de hoy') + '</span>' +
        '<h2 id="v2PvT">' + (typeof FREE_USER_DAILY_LIMIT === 'number' ? FREE_USER_DAILY_LIMIT : 6) + ' ejercicios gratis al día</h2><p>Con la explicación del Profe Leo. Tu racha y tu progreso quedan guardados.</p><div class="v2-next__meta"></div>' +
        '<a class="btn btn--lg btn--block" href="practica.html" data-v2-free>Practicar ahora</a></section>' +
      '<section class="v2-stack-sm"><h2 class="v2-eyebrow">También gratis</h2>' + also.join('') + '</section>' +
      (act ? '<section class="v2-invite"><span class="v2-task__ic v2-task__ic--brand">' + (I4.trophy || A.STK.trophy) + '</span><div><b>' + (lapsed ? 'Vuelve donde lo dejaste' : 'Practica sin límite') + '</b><p>' + (lapsed ? 'Reactiva por $2 USD al mes y retoma la Academia, la práctica sin límite y Leo AI.' : 'Cursos completos, repaso de errores y Leo AI por $2 USD al mes.') + '</p>' +
        '<button type="button" class="btn btn--sm btn--secondary" data-v2-activate>' + esc(act.textContent.trim() || 'Activar membresía') + '</button></div></section>' : '') +
      '<details class="v2-expand" id="v2PvIncl"><summary><span class="v2-task__ic">' + (I4.academia || A.ICO.lesson) + '</span><span>Qué incluye la membresía<small>Todo lo que se abre al activarla</small></span>' + A.UI.chevron + '</summary><div class="v2-expand__body v2-pv-slot"></div></details>' +
      '</div>';
    var el = K.h(html); el.classList.add('k-scope');
    var wrap = pv.querySelector('.member-preview-wrap') || pv;
    wrap.insertBefore(el, wrap.firstChild);
    var grid = pv.querySelector('.locked-grid'), slot = el.querySelector('.v2-pv-slot');
    if(grid && slot) slot.appendChild(grid);
    pv.classList.add('v2-pv-on');
    pvScreen = el;
    el.addEventListener('click', function(e){
      if(e.target.closest('[data-v2-activate]')){ SND.play('tap'); if(act) act.click(); return; }
      if(e.target.closest('[data-v2-free]')){ SND.play('check'); try{ if(typeof trackLeoEvent === 'function') trackLeoEvent('preview_free_practice_clicked'); }catch(_){} }
    });
    d.title = 'Inicio - Inglés con Leo';
  }
  function start(){
    var pvEl = d.getElementById('memberPreview');
    if(d.documentElement.classList.contains('v2-preview') && pvEl && getComputedStyle(pvEl).display !== 'none'){ renderPreview(); return; }
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
