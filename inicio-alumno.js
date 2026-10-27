/* Tarjeta "Academia" del Inicio del alumno (miembros.html). Solo LEE: no guarda nada ni toca la academia.
   Los cursos publicados salen de ACADEMIA_CURSOS (generado desde el motor: campo open, el mismo que decide si un curso está abierto); no hay cursos escritos aquí.
   El avance sale del mismo almacenamiento local que usa la academia (una clave por curso).
   Regla para "Continuar curso" (verificable):
     1. Candidatos: cursos abiertos con avance (alguna lección terminada, una sesión a medias o algún día practicado) y sin terminar.
     2. Gana el de actividad más reciente (último día practicado); si empatan, el de más lecciones hechas; si empatan, el primero del motor.
     3. Si no hay candidatos: "Ir a la Academia" (nadie empezó, o todos los empezados están terminados).
   Limitación: el avance viene de este navegador. Si el alumno avanzó en otro dispositivo, se actualiza al abrir la Academia aquí. */
(function(root){
  function keyFor(id){ return id === 'to-be' ? 'leo_academia_piloto_v1' : 'leo_academia_v1_' + id; }
  function readState(storage, id){
    try{ var s = JSON.parse(storage.getItem(keyFor(id)) || 'null'); return s && typeof s === 'object' ? s : null; }catch(e){ return null; }
  }
  function summarize(id, meta, state){
    var total = +meta.lessons || 0;
    var lessons = (state && state.lessons) || {}, done = 0;
    Object.keys(lessons).forEach(function(k){ if(lessons[k] && lessons[k].done) done++; });
    var days = (state && state.days) || [];
    var started = done > 0 || Object.keys((state && state.resume) || {}).length > 0 || days.length > 0;
    return { id: id, title: meta.title, total: total, done: Math.min(done, total || done), started: started,
             finished: total > 0 && done >= total, lastDay: days.length ? String(days[days.length - 1]) : '' };
  }
  function list(motor, storage){
    var out = [];
    if(!motor || !motor.enabled || !motor.courses) return out;
    Object.keys(motor.courses).forEach(function(id){
      var m = motor.courses[id];
      if(m && m.open) out.push(summarize(id, m, readState(storage, id)));
    });
    return out;
  }
  function pick(courses){
    var c = courses.filter(function(x){ return x.started && !x.finished; });
    if(!c.length) return null;
    var best = c[0];
    c.forEach(function(x, i){
      if(i === 0) return;
      if(x.lastDay > best.lastDay || (x.lastDay === best.lastDay && x.done > best.done)) best = x;
    });
    return best;
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function view(courses){
    var p = pick(courses);
    if(p){
      var pct = p.total ? Math.round(p.done / p.total * 100) : 0;
      return { state: 'continue', href: 'academia.html#/curso/' + p.id, cta: 'Continuar curso', course: p,
        line: p.title, meta: 'Lección ' + Math.min(p.done + 1, p.total) + ' de ' + p.total, pct: pct };
    }
    var fin = courses.filter(function(x){ return x.finished; });
    if(courses.length && fin.length === courses.length) return { state: 'finished', href: 'academia.html', cta: 'Ir a la Academia', line: 'Terminaste ' + (fin.length === 1 ? 'tu curso' : 'tus cursos') + '. Revisa tus insignias.', meta: '', pct: 100 };
    return { state: 'start', href: 'academia.html', cta: 'Ir a la Academia', line: 'Cursos cortos, lección por lección.', meta: '', pct: null };
  }
  function render(el){
    if(!el) return null;
    var v;
    try{ v = view(list(root.ACADEMIA_CURSOS, root.localStorage)); }catch(e){ v = view([]); }
    el.setAttribute('data-academia-state', v.state);
    el.setAttribute('href', v.href);
    var bar = v.pct === null ? '' : '<span class="home-bar" aria-hidden="true"><span style="width:' + v.pct + '%"></span></span>';
    el.querySelector('[data-slot="line"]').textContent = v.line;
    var meta = el.querySelector('[data-slot="meta"]');
    meta.innerHTML = v.meta ? esc(v.meta) + bar : bar;
    meta.hidden = !(v.meta || bar);
    el.querySelector('[data-slot="cta"]').textContent = v.cta;
    return v;
  }
  /* Lista de cursos para "Mi progreso": una fila por curso abierto. Es avance de cursos, no estadística de práctica. */
  function renderCourses(el){
    if(!el) return 0;
    var cs = [];
    try{ cs = list(root.ACADEMIA_CURSOS, root.localStorage); }catch(e){ cs = []; }
    if(!cs.length){ el.hidden = true; return 0; }
    el.innerHTML = cs.map(function(c){
      var pct = c.total ? Math.round(c.done / c.total * 100) : 0;
      var st = c.finished ? 'Terminado' : (c.started ? 'Lección ' + Math.min(c.done + 1, c.total) + ' de ' + c.total : 'Sin empezar');
      return '<li><a href="academia.html#/curso/' + esc(c.id) + '"><strong>' + esc(c.title) + '</strong><span>' + esc(c.done) + ' de ' + esc(c.total) + ' lecciones · ' + st + '</span>' +
        '<span class="home-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span></a></li>';
    }).join('');
    el.hidden = false;
    return cs.length;
  }
  var api = { renderCourses: renderCourses, keyFor: keyFor, summarize: summarize, list: list, pick: pick, view: view, render: render };
  if(typeof module !== 'undefined' && module.exports) module.exports = api; else root.InicioAlumno = api;
})(typeof window !== 'undefined' ? window : globalThis);
