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

  /* ---------------- Mi ruta ----------------
     Bloque B (UX): ruta compacta. Arriba, qué tan lejos vas (cursos aprobados y lecciones) y la lección para
     seguir con un toque. Debajo, cada etapa es una lista corta; la etapa actual se ve abierta y las demás se
     despliegan. Cada curso abre su hoja real (lecciones, evaluación). Los datos son los del motor real. */
  function stateText(v, now){
    if(v.done >= v.total) return 'Lecciones completas · falta la evaluación';
    if(now && v.next) return 'Lección ' + v.next.n + ' de ' + v.total + ' · estás aquí';
    if(v.done) return v.done + ' de ' + v.total + ' lecciones';
    return 'Disponible · ' + v.total + ' lecciones';
  }
  function renderRoute(){
    var list = apps().map(function(a){ return a.view(); });
    if(!list.length) return;
    var totalL = 0, doneL = 0;
    list.forEach(function(v){ totalL += v.total; doneL += v.done; });
    var pct = totalL ? Math.round(doneL / totalL * 100) : 0;
    var cur = current(list), curIdx = cur ? list.indexOf(cur) : -1;
    var curStage = cur ? K.STAGES.indexOf(stageOf(curIdx)) : 0;
    var html = '<div class="v2-screen is-wide v2-route v2-stack">' +
      '<header><h1 class="v2-h1">Academia</h1><p class="v2-sub">Cursos cortos con evaluación e insignia.</p></header>' +
      '<section class="v2-route-sum" aria-label="Tu avance"><b id="v2RtAprob">Cursos aprobados: …</b><span class="v2-bar"><i id="v2RtBar" style="--v:0%"></i></span>' +
        '<small>' + doneL + ' de ' + totalL + ' lecciones completadas · un curso se aprueba al superar su evaluación</small></section>' +
      (cur && cur.next ? '<section class="v2-next" aria-labelledby="v2RtNext"><span class="v2-next__em" aria-hidden="true">' + K.emblem(cur.id, { shape: stageOf(curIdx).shape, size: 64 }) + '</span>' +
        '<span class="v2-next__eyebrow">' + (cur.next.resume ? 'La dejaste a medias' : (cur.done ? 'Tu siguiente lección' : 'Empieza aquí')) + '</span>' +
        '<h2 id="v2RtNext">' + esc(cur.next.title) + '</h2><p>' + esc(cur.title) + ' · Lección ' + cur.next.n + ' de ' + cur.total + '</p><div class="v2-next__meta"></div>' +
        '<a class="btn btn--lg btn--block" href="#/curso/' + cur.id + '/leccion/' + cur.next.n + '" data-v2-next>' + (cur.next.resume ? 'Seguir la lección' : (cur.done ? 'Continuar' : 'Empezar')) + '</a></section>' : '') +
      K.STAGES.map(function(sg, si){
        var items = list.slice(sg.from, sg.to); if(!items.length) return '';
        var open = si === curStage;
        return '<details class="v2-stage" id="v2stage-' + si + '" style="--k-st:' + sg.c + '"' + (open ? ' open' : '') + '>' +
          '<summary><span><small>' + sg.n + '</small><b>' + sg.t + '</b></span><span class="v2-stage__pill" data-stage-pill="' + si + '">' + items.length + ' cursos</span>' + A.UI.chevron + '</summary>' +
          '<div class="v2-stage__list">' + items.map(function(v){
            var now = cur && v.id === cur.id;
            return '<div class="v2-crow' + (now ? ' is-now' : '') + (v.done >= v.total ? ' is-done' : '') + '" data-crow="' + v.id + '">' +
              '<button type="button" class="v2-crow__main" data-course="' + v.id + '"><span class="v2-crow__em">' + K.emblem(v.id, { shape: sg.shape, size: 44 }) + '</span>' +
              '<span><b>' + esc(v.name || v.title) + '</b><small data-cstate>' + stateText(v, now) + '</small></span>' + (now ? '' : A.UI.chevron) + '</button>' +
              (now && v.next ? '<a class="btn btn--sm" href="#/curso/' + v.id + '/leccion/' + v.next.n + '">Seguir</a>' : '') + '</div>';
          }).join('') + '</div></details>';
      }).join('') + '</div>';
    show(html, 'Mi ruta');
    var mine = screen;   /* C3: si la vista se vuelve a pintar antes de que lleguen las insignias, este resultado se descarta */
    Promise.all(apps().map(function(a){ return a.badge().then(function(b){ return { id: a.id, b: b }; }, function(){ return { id: a.id, b: null }; }); })).then(function(rs){
      if(!screen || screen !== mine) return;
      /* C4: aprobado = evaluación superada con insignia. Las lecciones se cuentan aparte. */
      var aprob = rs.filter(function(r){ return r.b; }).length, ra = screen.querySelector('#v2RtAprob'), bar = screen.querySelector('#v2RtBar');
      if(ra) ra.textContent = aprob + ' de ' + list.length + (list.length === 1 ? ' curso aprobado' : ' cursos aprobados');
      if(bar) bar.style.setProperty('--v', Math.round(aprob / list.length * 100) + '%');
      K.STAGES.forEach(function(sg, si){
        var ids = list.slice(sg.from, sg.to).map(function(v){ return v.id; }); if(!ids.length) return;
        var won = rs.filter(function(r){ return r.b && ids.indexOf(r.id) >= 0; }).length, pill = screen.querySelector('[data-stage-pill="' + si + '"]');
        if(pill) pill.innerHTML = won === ids.length ? A.UI.check + 'Etapa aprobada' : won + ' de ' + ids.length + ' aprobados';
      });
      rs.forEach(function(r){ if(!r.b) return; var row = screen.querySelector('[data-crow="' + r.id + '"]'); if(!row) return;
        row.classList.add('is-won'); var st = row.querySelector('[data-cstate]'); if(st) st.textContent = 'Aprobado · insignia ganada'; });
    });
    screen.addEventListener('click', function(e){
      var c = e.target.closest('[data-course]'); if(c){ SND.play('open'); courseSheet(c.getAttribute('data-course')); return; }
      if(e.target.closest('[data-v2-next], .v2-crow .k-btn')) SND.play('check');
    });
    K.$$('.v2-stage', screen).forEach(function(dt){ dt.addEventListener('toggle', function(){ if(dt.open) SND.play('open'); }); });
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
    var html = '<div class="v2-screen is-wide v2-logros v2-stack">' +
      '<header><h1 class="v2-h1">Mis logros</h1><p class="v2-sub">Cada insignia demuestra que aprobaste un curso: se gana al superar su evaluación.</p></header>' +
      '<section class="v2-route-sum" aria-label="Tu colección"><b><span id="v2LgBad">–</span> de ' + list.length + ' insignias</b><span class="v2-bar"><i id="v2LgBar" style="--v:0%"></i></span><small>' + list.reduce(function(t, v){ return t + v.done; }, 0) + ' lecciones completadas · cada insignia es un curso aprobado</small></section>' +
      '<div class="v2-next-badge-slot"></div>' +
      '<h2 class="v2-eyebrow">Colección por etapa</h2>' +
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
      var b = d.getElementById('v2LgBad'); if(b) b.textContent = won; var lb = d.getElementById('v2LgBar'); if(lb) lb.style.setProperty('--v', Math.round(won / list.length * 100) + '%');
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
