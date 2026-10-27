/* Tarjeta "Academia" del Inicio del alumno (miembros.html). Solo LEE: no guarda nada ni toca la academia.
   Los cursos publicados salen de ACADEMIA_CURSOS (generado desde el motor: campo open, el mismo que decide si un curso está abierto); no hay cursos escritos aquí.
   El avance sale del mismo almacenamiento local que usa la academia (una clave por curso).
   Regla para "Continuar curso" (verificable):
     1. Candidatos: cursos abiertos con avance (alguna lección terminada, una sesión a medias o algún día practicado) y sin terminar.
     2. Gana el de actividad más reciente (último día practicado); si empatan, el de más lecciones hechas; si empatan, el primero del motor.
     3. Si no hay candidatos: "Ir a la Academia" (nadie empezó, o todos los empezados están terminados).
   FUENTE DEL AVANCE: el servidor (tabla academia_progress de la cuenta, lectura propia por RLS; es la misma fuente que usa la Academia).
   Los cursos publicados se cruzan además con academia_courses.enabled (si se apaga un curso en la base, deja de ofrecerse aquí).
   El almacenamiento local NO se usa como fuente porque no está separado por cuenta (en un equipo compartido mostraría el avance de otra persona).
   Única excepción: si esta cuenta tiene envíos pendientes en su cola (clave propia de la cuenta), se toma lo más avanzado entre servidor y local
   para no mostrar un avance viejo justo después de terminar una lección. Sin conexión o sin sesión: tarjeta neutra, sin cifras. */
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
  /* stateOf(id) -> estado del curso o null; enabledSet (opcional) -> ids que la base tiene encendidos. */
  function listWith(motor, stateOf, enabledSet){
    var out = [];
    if(!motor || !motor.enabled || !motor.courses) return out;
    Object.keys(motor.courses).forEach(function(id){
      var m = motor.courses[id];
      if(!m || !m.open) return;
      if(enabledSet && !enabledSet[id]) return;
      out.push(summarize(id, m, stateOf(id)));
    });
    return out;
  }
  function list(motor, storage){ return listWith(motor, function(id){ return readState(storage, id); }); }
  function pendingQueue(storage, uid, id){
    try{
      var q = JSON.parse(storage.getItem('leo_academia_cola_v1:' + uid + ':' + id) || 'null');
      return !!(q && ((q.sessions || []).length || (q.batches || []).length || (q.open || []).length));
    }catch(e){ return false; }
  }
  function moreAdvanced(a, b, motor, id){ var sa = summarize(id, motor.courses[id], a), sb = summarize(id, motor.courses[id], b); return sb.done > sa.done ? b : a; }
  /* Lee el avance real de la cuenta. Devuelve { ok, courses } (ok:false = no se pudo saber: tarjeta neutra). */
  async function loadServer(deps){
    try{
      var sess = await deps.getSession();
      if(!sess || !sess.user) return { ok: false };
      var uid = sess.user.id, c = deps.client;
      var r = await Promise.all([ c.from('academia_progress').select('course_id,state'), c.from('academia_courses').select('course_id,enabled') ]);
      if(!r[0] || r[0].error || !Array.isArray(r[0].data)) return { ok: false };
      var byId = {}; r[0].data.forEach(function(row){ byId[row.course_id] = row.state; });
      var en = null;
      if(r[1] && !r[1].error && Array.isArray(r[1].data) && r[1].data.length){ en = {}; r[1].data.forEach(function(row){ if(row.enabled) en[row.course_id] = 1; }); }
      var courses = listWith(deps.motor, function(id){
        var server = byId[id] || null;
        if(pendingQueue(deps.storage, uid, id)){
          var local = readState(deps.storage, id);
          if(local && server) return moreAdvanced(server, local, deps.motor, id);
          return server || local;
        }
        return server;
      }, en);
      return { ok: true, courses: courses };
    }catch(e){ return { ok: false }; }
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
    if(courses.length && fin.length === courses.length) return { state: 'finished', href: 'academia.html', cta: 'Ir a la Academia', line: 'Completaste las lecciones. La evaluación y la insignia están en la Academia.', meta: '', pct: 100 };
    return { state: 'start', href: 'academia.html', cta: 'Ir a la Academia', line: 'Cursos cortos, lección por lección.', meta: '', pct: null };
  }
  function paint(el, v){
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
  var NEUTRAL = { state: 'start', href: 'academia.html', cta: 'Ir a la Academia', line: 'Cursos cortos, lección por lección.', meta: '', pct: null };
  /* Pinta primero la tarjeta neutra y la mejora cuando llega el avance real de la cuenta. */
  function render(el, deps){
    if(!el) return null;
    paint(el, NEUTRAL);
    if(!deps) return NEUTRAL;
    return loadServer(deps).then(function(res){ return res.ok ? paint(el, view(res.courses)) : NEUTRAL; });
  }
  function depsFromPage(){
    try{
      /* LeoBackend es un const de otro script: se ve como variable global, no como propiedad de window. */
      var lb = (typeof LeoBackend !== 'undefined') ? LeoBackend : root.LeoBackend;
      if(!lb || !lb.getClient || !lb.getClient()) return null;
      return { motor: root.ACADEMIA_CURSOS, storage: root.localStorage, client: lb.getClient(), getSession: lb.getSession };
    }catch(e){ return null; }
  }
  /* Lista de cursos para "Mi progreso": una fila por curso abierto. Es avance de cursos, no estadística de práctica. */
  function paintCourses(el, cs){
    if(!cs.length){ el.hidden = true; return 0; }
    el.innerHTML = cs.map(function(c){
      var pct = c.total ? Math.round(c.done / c.total * 100) : 0;
      var st = c.finished ? 'Lecciones completas' : (c.started ? 'Lección ' + Math.min(c.done + 1, c.total) + ' de ' + c.total : 'Sin empezar');
      return '<li><a href="academia.html#/curso/' + esc(c.id) + '"><strong>' + esc(c.title) + '</strong><span>' + esc(c.done) + ' de ' + esc(c.total) + ' lecciones · ' + st + '</span>' +
        '<span class="home-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span></a></li>';
    }).join('');
    el.hidden = false;
    return cs.length;
  }
  /* Mi progreso: una fila por curso con el avance real de la cuenta. Sin poder leerlo, oculta la lista (nunca inventa cifras). */
  function renderCourses(el, deps){
    if(!el) return null;
    el.hidden = true;
    if(!deps) return null;
    return loadServer(deps).then(function(res){ return res.ok ? paintCourses(el, res.courses) : 0; });
  }
  var api = { renderCourses: renderCourses, depsFromPage: depsFromPage, loadServer: loadServer, listWith: listWith, pendingQueue: pendingQueue, keyFor: keyFor, summarize: summarize, list: list, pick: pick, view: view, render: render };
  if(typeof module !== 'undefined' && module.exports) module.exports = api; else root.InicioAlumno = api;
})(typeof window !== 'undefined' ? window : globalThis);
