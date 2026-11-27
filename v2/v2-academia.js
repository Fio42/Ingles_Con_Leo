/* =========================================================
   Inglés con Leo 2.0 · Academia (academia.html)
   - "Mi ruta" (#/) -> la expedición del prototipo v3: etapas, camino con los
     cursos reales, "Tú estás aquí", siguiente lección y hoja de cada curso.
   - "Mis logros" (#/logros) -> colección visual de las insignias REALES
     (academia_badges, las entrega el servidor al aprobar la evaluación).
   Solo para miembros (modo 'member' del motor). Para quien no es miembro la
   academia sigue mostrando su presentación y su pago reales, sin cambios.
   Lecciones, repasos y evaluaciones siguen siendo las del motor real.
   Lee el estado con ICL_ACADEMIA.apps[id].view() (solo lectura).
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled || !window.K) return;
  var d = document, K = window.K, A = K.ART, SND = K.SND, esc = K.esc;
  var root = d.getElementById('acRoot'); if(!root) return;
  var screen = null;

  function apps(){
    var reg = window.ICL_ACADEMIA; if(!reg) return [];
    var order = []; try{ order = ACADEMIA.route.courses.map(function(c){ return c.id; }); }catch(e){}
    Object.keys(reg.apps).forEach(function(k){ if(order.indexOf(k) < 0) order.push(k); });
    return order.filter(function(k){ var a = reg.apps[k]; return a && (a.primary || a.visible()); }).map(function(k){ return reg.apps[k]; });
  }
  function isMember(){ var reg = window.ICL_ACADEMIA; return !!(reg && reg.apps['to-be'] && reg.apps['to-be'].mode() === 'member'); }
  function stageOf(i){ return K.STAGES.filter(function(s){ return i >= s.from && i < s.to; })[0] || K.STAGES[K.STAGES.length - 1]; }
  function current(list){
    /* El curso para seguir: el empezado y sin terminar con más avance; si no, el primero sin terminar */
    var started = list.filter(function(v){ return v.done > 0 && v.done < v.total || (v.next && v.next.resume); });
    if(started.length) return started.sort(function(a, b){ return b.done - a.done; })[0];
    return list.filter(function(v){ return v.done < v.total; })[0] || null;
  }
  function clear(){ if(screen){ screen.remove(); screen = null; } root.classList.remove('v2-hidden'); }

  /* ---------------- Mi ruta ---------------- */
  function renderRoute(){
    var list = apps().map(function(a){ return a.view(); });
    if(!list.length) return;
    var totalL = 0, doneL = 0, coursesDone = 0;
    list.forEach(function(v){ totalL += v.total; doneL += v.done; if(v.done >= v.total) coursesDone++; });
    var pct = totalL ? Math.round(doneL / totalL * 100) : 0;
    var cur = current(list), curIdx = cur ? list.indexOf(cur) : -1;
    var curStage = cur ? K.STAGES.indexOf(stageOf(curIdx)) : 0;
    var routeTitle = ''; try{ routeTitle = ACADEMIA.route.title; }catch(e){}
    var cols = [1, 2, 3, 2];
    var html = '<div class="v2-screen is-wide v2-route">' +
      '<header class="exp-head"><div class="ring ring--brand" role="img" aria-label="Lecciones completadas de la ruta: ' + pct + '%">' + K.ring(pct / 100, 30, 8) + '<div class="ring__center"><b class="ring__n">' + pct + '%</b></div></div>' +
        '<div><span class="t-eyebrow">Ruta ' + esc(routeTitle || 'de la academia') + '</span><h1>Tu ruta</h1><p><span id="v2RtAprob">Cursos aprobados: …</span> · ' + doneL + ' de ' + totalL + ' lecciones (' + pct + '%)</p><p class="v2-route-note">Un curso queda aprobado al superar su evaluación y ganar su insignia. Entra a cualquiera cuando quieras.</p></div></header>' +
      '<nav class="stage-nav" aria-label="Etapas">' + K.STAGES.map(function(sg, i){ var dn = false; /* se marca al llegar las insignias (C4) */
        return '<button type="button" data-goto="' + i + '" class="' + (i === curStage ? 'is-now' : '') + ' ' + (dn ? 'is-done' : '') + '" style="--k-st:' + sg.c + '"><i>' + (dn ? A.UI.check : i + 1) + '</i><span>' + sg.t + '</span></button>'; }).join('') + '</nav>' +
      (cur && cur.next ? '<a class="next-up" href="#/curso/' + cur.id + '/leccion/' + cur.next.n + '">' + K.emblem(cur.id, { shape: stageOf(curIdx).shape, size: 52 }) +
        '<span><small>' + (cur.next.resume ? 'La dejaste a medias' : (cur.done ? 'Continúa' : 'Empieza')) + ' · Lección ' + cur.next.n + ' de ' + cur.total + '</small><b>' + esc(cur.next.title) + '</b></span><span class="next-up__go">' + A.UI.play + '</span></a>' : '') +
      K.STAGES.map(function(sg, si){
        var items = list.slice(sg.from, sg.to); if(!items.length) return '';
        var stDone = false, stNow = si === curStage;   /* etapa aprobada = todas sus insignias; se marca al llegar (C4) */
        return '<section class="stage ' + (stDone ? 'is-done' : '') + ' ' + (stNow ? 'is-now' : '') + '" id="v2stage-' + si + '" style="--k-st:' + sg.c + '">' +
          '<div class="stage__banner">' + (A.landscape ? A.landscape(sg.c, stDone) : '') + '<span class="t-eyebrow">' + sg.n + '</span><h2>' + sg.t + '</h2><p class="stage__goal">Meta: ' + sg.goal + '</p>' +
            '<span class="pill" data-stage-pill="' + si + '">' + items.length + ' cursos</span></div>' +
          '<div class="board" data-board><svg class="board__path" aria-hidden="true"></svg>' +
          items.map(function(v, j){
            var i = sg.from + j, done = v.done >= v.total, now = cur && v.id === cur.id;
            return '<button type="button" class="cstop ' + (done ? 'is-done' : '') + ' ' + (now ? 'is-now' : '') + '" data-course="' + v.id + '" style="grid-column:' + cols[j % 4] + ';grid-row:' + (j + 1) + '" aria-label="' + esc(v.title) + ': ' + (done ? 'lecciones completas' : v.done + ' de ' + v.total + ' lecciones') + '">' +
              '<span class="cstop__em">' + (now ? '<span class="here">Tú</span>' : '') + K.emblem(v.id, { shape: sg.shape, size: 72 }) + (done ? '<span class="cstop__check">' + A.UI.check + '</span>' : '') + '</span>' +
              '<span class="cstop__name">' + esc(v.name || v.title) + '</span>' +
              '<span class="cstop__state">' + (done ? 'Lecciones completas' : v.done ? v.done + '/' + v.total + ' lecciones' : 'Disponible') + '</span></button>';
          }).join('') +
          '<div class="stage__reward" style="grid-row:' + (items.length + 1) + '" data-stage-badges="' + si + '">' + A.STK.trophy + '<div>Insignias de la etapa<small>Aprueba la evaluación de cada curso para ganar su insignia</small></div></div>' +
          '</div></section>';
      }).join('') + '</div>';
    show(html, 'Mi ruta');
    var mine = screen;   /* C3: si la vista se vuelve a pintar antes de que lleguen las insignias, este resultado se descarta */
    var draw = function(){ K.$$('[data-board]', screen).forEach(drawPath); };
    requestAnimationFrame(draw);
    if(window.ResizeObserver){ var ro = new ResizeObserver(draw); ro.observe(screen); }
    /* Insignias reales por etapa */
    Promise.all(apps().map(function(a){ return a.badge().then(function(b){ return { id: a.id, b: b }; }, function(){ return { id: a.id, b: null }; }); })).then(function(rs){
      if(!screen || screen !== mine) return;
      K.STAGES.forEach(function(sg, si){
        var box = screen.querySelector('[data-stage-badges="' + si + '"]'); if(!box) return;
        var ids = list.slice(sg.from, sg.to).map(function(v){ return v.id; }), won = rs.filter(function(r){ return r.b && ids.indexOf(r.id) >= 0; }).length;
        box.querySelector('div').innerHTML = (won ? won + ' de ' + ids.length + ' insignias de la etapa' : 'Insignias de la etapa') + '<small>' + (won === ids.length ? 'Etapa con todas sus insignias' : 'Aprueba la evaluación de cada curso para ganar su insignia') + '</small>';
      });
      /* C4: aprobado = evaluación superada con insignia. Las lecciones se cuentan aparte. */
      var aprob = rs.filter(function(r){ return r.b; }).length, ra = screen.querySelector('#v2RtAprob');
      if(ra) ra.textContent = aprob + ' de ' + list.length + (list.length === 1 ? ' curso aprobado' : ' cursos aprobados');
      K.STAGES.forEach(function(sg, si){
        var ids = list.slice(sg.from, sg.to).map(function(v){ return v.id; }); if(!ids.length) return;
        var won = rs.filter(function(r){ return r.b && ids.indexOf(r.id) >= 0; }).length, pill = screen.querySelector('[data-stage-pill="' + si + '"]');
        if(pill) pill.innerHTML = won === ids.length ? A.UI.check + 'Etapa aprobada' : won + ' de ' + ids.length + ' aprobados';
        var sec = screen.querySelector('#v2stage-' + si); if(sec) sec.classList.toggle('k-is-done', won === ids.length);
        var nb = screen.querySelector('[data-goto="' + si + '"]');
        if(nb && won === ids.length){ nb.classList.add('k-is-done'); var ic = nb.querySelector('i'); if(ic) ic.innerHTML = A.UI.check; }
      });
      rs.forEach(function(r){ if(!r.b) return; var st = screen.querySelector('[data-course="' + r.id + '"] .k-cstop__state'); if(st) st.textContent = 'Aprobado';
        var em = screen.querySelector('[data-course="' + r.id + '"] .k-cstop__em'); if(em && !em.querySelector('.v2-ribbon')) em.appendChild(K.h('<span class="v2-ribbon" title="Insignia conseguida">' + A.STK.trophy + '</span>')); });
    });
    screen.addEventListener('click', function(e){
      var g = e.target.closest('[data-goto]'); if(g){ SND.play('tap'); var t = d.getElementById('v2stage-' + g.getAttribute('data-goto')); if(t) t.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'start' }); return; }
      var c = e.target.closest('[data-course]'); if(c){ SND.play('open'); courseSheet(c.getAttribute('data-course')); return; }
      if(e.target.closest('.k-next-up')) SND.play('check');
    });
  }
  function drawPath(board){
    var svg = board.querySelector('.k-board__path'), br = board.getBoundingClientRect();
    var pts = K.$$('.k-cstop__em', board).map(function(e){ var r = e.getBoundingClientRect(); return { x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height / 2 }; });
    var stops = K.$$('.k-cstop', board), walked = '', rest = '';
    svg.setAttribute('viewBox', '0 0 ' + br.width + ' ' + br.height);
    for(var i = 1; i < pts.length; i++){
      var p = pts[i - 1], q = pts[i], dy = (q.y - p.y) / 2, seg = 'M' + p.x + ' ' + p.y + 'C' + p.x + ' ' + (p.y + dy) + ' ' + q.x + ' ' + (q.y - dy) + ' ' + q.x + ' ' + q.y;
      var dn = function(n){ return n.classList.contains('k-is-done'); };
      if(dn(stops[i - 1]) && (dn(stops[i]) || stops[i].classList.contains('k-is-now'))) walked += seg; else rest += seg;
    }
    svg.innerHTML = '<path d="' + rest + '"/><path class="k-is-walked" d="' + walked + '"/>';
  }
  function courseSheet(id){
    var a = window.ICL_ACADEMIA.apps[id]; if(!a) return;
    var v = a.view(), i = apps().map(function(x){ return x.id; }).indexOf(id), sg = stageOf(i), done = v.done >= v.total;
    var target = v.next ? '#/curso/' + id + '/leccion/' + v.next.n : '#/curso/' + id + '/evaluacion';
    var m = K.sheet({ label: v.title, cls: 'modal--sheet', html:
      '<div class="sheet-course__head">' + K.emblem(id, { shape: sg.shape, size: 72, ribbon: done }) + '<div><span class="t-eyebrow">' + sg.n + ' · ' + sg.t + '</span><h3>' + esc(v.title) + '</h3><p>' + (done ? 'Lecciones completadas · ' + v.total + ' de ' + v.total : v.done + ' de ' + v.total + ' lecciones') + '</p></div></div>' +
      '<div class="lessons">' + v.lessons.map(function(l){
        return '<a class="lrow ' + (l.done ? 'is-done' : (l.next ? 'is-now' : '')) + '" href="#/curso/' + id + '/leccion/' + l.n + '"><i>' + (l.done ? A.UI.check : l.n) + '</i>' + esc(l.title) + '<small>' + (l.done ? 'Hecha' : l.resume ? 'A medias' : l.next ? 'Siguiente' : l.minutes + ' min') + '</small></a>'; }).join('') +
        '<a class="lrow ' + (done && v.examBest == null ? 'is-now' : '') + (v.examBest != null && v.examBest >= v.passPct ? ' is-done' : '') + '" href="#/curso/' + id + '/evaluacion"><i>' + A.STK.trophy + '</i>Evaluación del curso<small>' + (v.examBest != null ? 'Mejor: ' + v.examBest + '%' : 'Da la insignia') + '</small></a></div>' +
      '<a class="btn btn--block btn--lg" data-go href="' + target + '">' + (v.next ? (v.next.resume ? 'Seguir la lección ' + v.next.n : (v.done ? 'Continuar lección ' + v.next.n : 'Empezar curso')) : 'Ir a la evaluación') + '</a>' +
      '<a class="btn btn--block btn--secondary v2-mt" href="#/curso/' + id + '">Ver el curso completo</a>' });
    m.box.addEventListener('click', function(e){ if(e.target.closest('a[href^="#/"]')){ SND.play('check'); m.close(true); } });
  }

  /* ---------------- Mis logros: colección de insignias reales ---------------- */
  function renderLogros(){
    var list = apps().map(function(a){ return a.view(); });
    var html = '<div class="v2-screen is-wide v2-logros">' +
      '<header class="page-head"><h1>Mis logros</h1><p>Cada insignia se gana al aprobar la evaluación de un curso. La corrige el servidor.</p></header>' +
      '<div class="pstats"><div><span>' + A.ICO.lesson + '</span><b id="v2LgLes">' + list.reduce(function(t, v){ return t + v.done; }, 0) + '</b><small>Lecciones completadas</small></div>' +
        '<div><span>' + A.STK.trophy + '</span><b id="v2LgBad">–</b><small>Cursos aprobados (insignias)</small></div>' +
        '<div><span>' + A.ICO.target + '</span><b>' + list.filter(function(v){ return v.done >= v.total; }).length + '</b><small>Cursos con lecciones completas</small></div></div>' +
      '<div class="v2-next-badge-slot"></div>' +
      '<div class="block__head"><h2>Colección</h2><span class="pill" id="v2LgPill">0 de ' + list.length + '</span></div>' +
      '<div class="coll">' + K.STAGES.map(function(sg){
        var items = list.slice(sg.from, sg.to); if(!items.length) return '';
        return '<div class="coll-group"><h3>' + sg.n + ' · ' + sg.t + ' <span data-grp="' + sg.from + '"></span></h3><div class="badges">' + items.map(function(v){
          return '<button type="button" class="badge is-locked" data-badge="' + v.id + '" aria-label="' + esc(v.title) + ' (pendiente)">' + K.emblem(v.id, { shape: sg.shape, locked: true, size: 58 }) + '<span class="badge__name">' + esc(v.name || v.title) + '</span></button>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
      '<details class="v2-details"><summary>Detalle por curso y opciones</summary><div class="v2-classic-slot"></div></details>' +
      '</div>';
    show(html, 'Mis logros', true);
    var mine = screen;   /* C3: la tarjeta "Tu próxima insignia" se repetía una vez por cada pintado anterior */
    var got = {};
    Promise.all(apps().map(function(a){ return a.badge().then(function(b){ return { id: a.id, b: b }; }, function(){ return { id: a.id, b: null }; }); })).then(function(rs){
      if(!screen || screen !== mine) return;
      var won = 0;
      rs.forEach(function(r){
        if(!r.b) return; won++; got[r.id] = r.b;
        var btn = screen.querySelector('[data-badge="' + r.id + '"]'); if(!btn) return;
        var i = apps().map(function(x){ return x.id; }).indexOf(r.id), sg = stageOf(i);
        btn.className = 'k-badge k-is-new'; btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace(' (pendiente)', ', conseguida'));
        btn.replaceChild(K.h('<span>' + K.emblem(r.id, { shape: sg.shape, size: 58, ribbon: true }) + '</span>').firstChild, btn.firstChild);
      });
      var b = d.getElementById('v2LgBad'); if(b) K.countTo(b, 0, won, 600);
      var pl = d.getElementById('v2LgPill'); if(pl) pl.textContent = won + ' de ' + list.length;
      K.STAGES.forEach(function(sg){ var s = screen.querySelector('[data-grp="' + sg.from + '"]'); if(!s) return; var ids = list.slice(sg.from, sg.to).map(function(v){ return v.id; }); s.textContent = ids.filter(function(id){ return got[id]; }).length + '/' + ids.length; });
      /* Próxima insignia: el curso sin insignia con más lecciones hechas */
      var cand = list.filter(function(v){ return !got[v.id]; }).sort(function(a, b){ return b.done / b.total - a.done / a.total; })[0];
      var slot = screen.querySelector('.v2-next-badge-slot');
      if(cand && slot){
        slot.innerHTML = '';
        var ready = cand.done >= cand.total, i = list.indexOf(cand);
        slot.appendChild(K.h('<a class="next-badge" href="#/curso/' + cand.id + (ready ? '/evaluacion' : '') + '">' + K.emblem(cand.id, { shape: stageOf(i).shape, locked: true, size: 64 }) + '<div><span class="t-eyebrow">Tu próxima insignia</span><h3>' + esc(cand.title) + '</h3><p>' + (ready ? 'Ya terminaste las lecciones: haz la evaluación y gánala.' : 'Llevas ' + cand.done + ' de ' + cand.total + ' lecciones. Al terminar, haz la evaluación.') + '</p><div class="bar bar--sm bar--mend"><div class="bar__fill" style="width:' + Math.round(cand.done / cand.total * 100) + '%"></div></div></div></a>'));
      }
      if(won && !sessionStorage.getItem('icl.logros.visto')){ try{ sessionStorage.setItem('icl.logros.visto', '1'); }catch(e){} SND.play('achievement'); }
    });
    screen.addEventListener('click', function(e){
      var b = e.target.closest('[data-badge]'); if(!b) return;
      SND.play('open');
      var id = b.getAttribute('data-badge'), v = window.ICL_ACADEMIA.apps[id].view(), w = got[id], i = list.map(function(x){ return x.id; }).indexOf(id);
      var when = w && w.awarded_at ? new Date(w.awarded_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      K.modal({ art: '<div class="modal__art badge ' + (w ? '' : 'is-locked') + '">' + K.emblem(id, { shape: stageOf(i).shape, locked: !w, size: 96, ribbon: !!w }) + '</div>', title: v.title,
        text: w ? 'Conseguida' + (when ? ' el ' + when : '') + ' con ' + w.score_pct + '% en la evaluación.' : 'Llevas ' + v.done + ' de ' + v.total + ' lecciones. Aprueba la evaluación (' + v.passPct + '% o más) para ganarla.',
        actions: w ? [{ label: 'Genial' }] : [{ label: v.done >= v.total ? 'Ir a la evaluación' : 'Seguir el curso', href: v.done >= v.total ? '#/curso/' + id + '/evaluacion' : '#/curso/' + id }] });
      if(w){ K.confetti(.4); SND.play('achievement'); }
    });
  }

  function show(html, title, keepClassic){
    var el = K.h(html); el.classList.add('k-scope');
    if(screen) screen.remove();
    root.parentNode.insertBefore(el, root);
    screen = el;
    if(keepClassic){
      /* La vista clásica se conserva completa (incluye opciones como reiniciar el avance) dentro de "Detalle" */
      var slot = el.querySelector('.v2-classic-slot'); if(slot){ slot.appendChild(root); root.classList.remove('v2-hidden'); }
    } else root.classList.add('v2-hidden');
    d.title = title + ' - Academia - Inglés con Leo';
  }
  function restoreRoot(){
    var main = d.querySelector('main');
    if(root.parentNode && root.parentNode.classList && root.parentNode.classList.contains('v2-classic-slot') && main){ main.insertBefore(root, screen || null); }
  }

  function onRoute(parts){
    parts = parts || (location.hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean));
    restoreRoot(); clear();
    if(!isMember()) return;                                   // no miembro: presentación y pago reales, sin cambios
    if(!parts.length) renderRoute();
    else if(parts[0] === 'logros') renderLogros();
    if(window.V2SHELL) V2SHELL.paintTop();
  }
  /* El motor avisa de la ruta varias veces seguidas mientras carga los cursos: se agrupan en un solo pintado (C3) */
  var pendParts, pendT = null;
  window.addEventListener('icl:academia-ruta', function(e){
    pendParts = e.detail && e.detail.parts;
    if(pendT) return;
    pendT = setTimeout(function(){ pendT = null; onRoute(pendParts); }, 30);
  });
  if(window.ICL_ACADEMIA) onRoute();
})();
