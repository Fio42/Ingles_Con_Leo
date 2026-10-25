/* ============================================================
   ACADEMIA EN LA NUBE (rama de trabajo, apagada por defecto).

   Une la academia con lo que ya existe, sin crear sistemas paralelos:
   - Progreso del curso   -> tabla academia_progress (RPC academia_save_progress, con versión).
   - Errores de actividades -> el motor ACTUAL: LeoBackend.applyMistakeResults (mistake_stats), item_id 'ac:<curso>:<actividad>'.
   - Lección completada   -> LeoBackend.pushSession (progress_sessions, skill 'gramatica'): cuenta para racha, precisión
                             semanal y diagnóstico igual que cualquier práctica.
   - Evaluación oficial   -> RPC academia_exam_start / academia_exam_submit (la nota y la insignia las decide el servidor).
   - Insignias            -> lectura de academia_badges (solo el servidor las crea).

   Seguridad: este archivo nunca decide una nota ni una insignia. Si algo falla (sin red, sin sesión, curso apagado,
   migración sin aplicar), la academia sigue funcionando en el navegador como en el piloto.

   Se activa SOLO si window.ACADEMIA_CLOUD === true (la página lo define) y hay sesión iniciada.
   Se carga antes de academia.js. Sin dependencias del DOM (se prueba en Node).
   ============================================================ */
var AcademiaNube = (function(){
  'use strict';

  var CLEAN_KEYS = ['v', 'lessons', 'resume', 'last', 'missed', 'cleared', 'exam', 'goal', 'goalAt', 'days', 'completions', 'snooze', 'returnTo'];

  /* ---------------- Fusión de dos estados (puro) ---------------- */
  function num(x){ return typeof x === 'number' && isFinite(x) ? x : (x ? 1 : 0); }
  function isObj(o){ return o && typeof o === 'object' && !Array.isArray(o); }
  function uniq(list){ var seen = {}, out = []; list.forEach(function(x){ var k = typeof x === 'string' ? x : JSON.stringify(x); if(!seen[k]){ seen[k] = 1; out.push(x); } }); return out; }

  /* Reglas: nada que el alumno ya logró se pierde al abrir otro dispositivo.
     - lección: hecha si en cualquiera está hecha (gana la fecha más antigua y el mejor resultado);
     - a mitad de lección: gana el guardado más reciente, salvo que la lección ya esté hecha después;
     - errores: un error cuenta si se falló DESPUÉS de la última vez que se acertó (marcas de tiempo por actividad);
     - días, completados, intentos de práctica: unión. */
  function mergeStates(a, b){
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var out = {};
    out.v = 1;
    // lecciones
    out.lessons = {};
    [a, b].forEach(function(st){
      var L = isObj(st.lessons) ? st.lessons : {};
      Object.keys(L).forEach(function(id){
        var x = L[id]; if(!x || !x.done) return;
        var y = out.lessons[id];
        if(!y){ out.lessons[id] = { done: true, doneAt: x.doneAt || 0, firstOk: x.firstOk || 0, total: x.total || 0 }; return; }
        y.doneAt = Math.min(y.doneAt || x.doneAt || 0, x.doneAt || y.doneAt || 0);
        if((x.firstOk || 0) > (y.firstOk || 0)){ y.firstOk = x.firstOk; y.total = x.total || y.total; }
      });
    });
    // a mitad de lección
    out.resume = {};
    [a, b].forEach(function(st){
      var R = isObj(st.resume) ? st.resume : {};
      Object.keys(R).forEach(function(id){
        var x = R[id]; if(!x) return;
        var y = out.resume[id];
        if(!y || (x.at || 0) > (y.at || 0)) out.resume[id] = x;
      });
    });
    Object.keys(out.resume).forEach(function(id){
      var l = out.lessons[id];
      if(l && (l.doneAt || 0) >= (out.resume[id].at || 0)) delete out.resume[id];
    });
    // última lección abierta: la del guardado más reciente que siga pendiente
    var best = null;
    Object.keys(out.resume).forEach(function(id){ if(best === null || (out.resume[id].at || 0) > (out.resume[best].at || 0)) best = id; });
    out.last = best;
    // errores con marca de tiempo
    var missed = {}, cleared = {};
    [a, b].forEach(function(st){
      var M = isObj(st.missed) ? st.missed : {}, C = isObj(st.cleared) ? st.cleared : {};
      Object.keys(M).forEach(function(id){ missed[id] = Math.max(missed[id] || 0, num(M[id])); });
      Object.keys(C).forEach(function(id){ cleared[id] = Math.max(cleared[id] || 0, num(C[id])); });
    });
    out.missed = {}; out.cleared = {};
    Object.keys(missed).forEach(function(id){ if(missed[id] > (cleared[id] || 0)) out.missed[id] = missed[id]; });
    // Los aciertos se conservan (sin ellos, otro dispositivo podria "resucitar" un error ya corregido). Tope: los 300 mas recientes.
    Object.keys(cleared).sort(function(x, y){ return cleared[y] - cleared[x]; }).slice(0, 300).forEach(function(id){ out.cleared[id] = cleared[id]; });
    // práctica de evaluación (NO es la oficial)
    var ea = isObj(a.exam) ? a.exam : {}, eb = isObj(b.exam) ? b.exam : {};
    var attempts = uniq([].concat(ea.attempts || [], eb.attempts || [])).sort(function(x, y){ return (x.at || 0) - (y.at || 0); }).slice(-30);
    var bests = [ea.best, eb.best].filter(function(x){ return typeof x === 'number'; });
    var lastSrc = (ea.attempts && ea.attempts.length && (!eb.attempts || !eb.attempts.length || ea.attempts[ea.attempts.length - 1].at >= eb.attempts[eb.attempts.length - 1].at)) ? ea : eb;
    out.exam = { attempts: attempts, best: bests.length ? Math.max.apply(null, bests) : null, lastIds: (lastSrc.lastIds || []).slice(0, 40) };
    // meta semanal: la última que se eligió
    var ga = a.goalAt || 0, gb = b.goalAt || 0;
    var gsrc = gb > ga ? b : a;
    out.goal = (gsrc.goal === undefined ? null : gsrc.goal); out.goalAt = Math.max(ga, gb);
    // días y completados
    out.days = uniq([].concat(a.days || [], b.days || [])).sort().slice(-60);
    out.completions = uniq([].concat(a.completions || [], b.completions || [])).sort(function(x, y){ return (x.at || 0) - (y.at || 0); }).slice(-200);
    out.snooze = [a.snooze, b.snooze].filter(Boolean).sort().pop() || null;
    // volver a donde estaba: el más reciente
    var ra = a.returnTo, rb = b.returnTo;
    out.returnTo = ra && rb ? ((rb.at || 0) > (ra.at || 0) ? rb : ra) : (ra || rb || null);
    return out;
  }
  function cleanState(st){
    var out = {};
    CLEAN_KEYS.forEach(function(k){ if(st && st[k] !== undefined) out[k] = st[k]; });
    return out;
  }
  function sameState(a, b){ return JSON.stringify(cleanState(a)) === JSON.stringify(cleanState(b)); }

  /* ---------------- Cliente ---------------- */
  /* env: { enabled, getClient(), getSession(), applyMistakeResults(items), pushSession(session), now() }
     En la página, env sale de window.LeoBackend. En las pruebas se inyecta uno falso o uno sobre Postgres. */
  function create(env){
    var courseId = env.courseId || 'to-be';
    var meta = env.meta || null;           // ACADEMIA_MOTOR.courses[courseId]
    var S = { ready: false, user: null, version: 0, remote: null, saving: false, dirty: false, timer: null, mistakeBuf: [], online: true };

    function client(){ try{ return env.getClient ? env.getClient() : null; }catch(e){ return null; } }
    function enabled(){ return !!env.enabled && !!client(); }

    async function boot(localState){
      if(!enabled()) return { ok: false, reason: 'off' };
      var sess = null;
      try{ sess = await env.getSession(); }catch(e){}
      if(!sess || !sess.user){ return { ok: false, reason: 'anon' }; }
      S.user = sess.user.id;
      var row = null;
      try{
        var r = await client().from('academia_progress').select('state,version').eq('course_id', courseId).maybeSingle();
        if(r.error){ return { ok: false, reason: 'db' }; }
        row = r.data;
      }catch(e){ return { ok: false, reason: 'net' }; }
      S.version = row ? row.version : 0;
      S.remote = row ? row.state : null;
      S.ready = true;
      var merged = mergeStates(row ? row.state : {}, localState || {});
      var changed = !row || !sameState(merged, row.state);
      if(changed){ S.dirty = true; }
      return { ok: true, state: merged, changed: changed, hadRemote: !!row };
    }

    /* Guarda con versión. Ante un conflicto (otro dispositivo guardó antes) fusiona y reintenta. */
    async function save(getState, onMerged){
      if(!S.ready || S.saving) { S.dirty = true; return { ok: false, reason: S.ready ? 'busy' : 'notready' }; }
      S.saving = true; S.dirty = false;
      try{
        for(var i = 0; i < 4; i++){
          var st = cleanState(getState());
          var r = await client().rpc('academia_save_progress', { p_course: courseId, p_state: st, p_base_version: S.version });
          if(r.error || !r.data){ S.online = false; S.dirty = true; return { ok: false, reason: 'net' }; }
          var d = r.data;
          if(d.ok){ S.version = d.version; S.remote = st; S.online = true; return { ok: true, version: d.version }; }
          if(d.conflict){
            S.version = d.version;
            var merged = mergeStates(d.state || {}, st);
            if(onMerged) onMerged(merged);
            continue;
          }
          S.dirty = false; return { ok: false, reason: d.error || 'rejected' };
        }
        S.dirty = true; return { ok: false, reason: 'conflict' };
      } catch(e){ S.online = false; S.dirty = true; return { ok: false, reason: 'net' }; }
      finally { S.saving = false; }
    }

    /* ---- errores al motor actual ---- */
    function engineId(activityId){ return 'ac:' + courseId + ':' + activityId; }
    function recordAnswer(activityId, isCorrect){
      if(!S.ready) return;
      S.mistakeBuf.push({ item_id: engineId(activityId), kind: 'academia', topic: meta ? meta.engineTopic : null, is_correct: !!isCorrect });
    }
    async function flushMistakes(){
      if(!S.ready || !S.mistakeBuf.length || !env.applyMistakeResults) return { ok: true, n: 0 };
      var items = S.mistakeBuf.slice(0, 200);
      S.mistakeBuf = S.mistakeBuf.slice(items.length);
      var r;
      try{ r = await env.applyMistakeResults(items); }catch(e){ r = { ok: false }; }
      if(!r || !r.ok){ S.mistakeBuf = items.concat(S.mistakeBuf); return { ok: false }; }   // se reintenta en el próximo flush
      return { ok: true, n: items.length };
    }
    /* Una lección terminada = UNA sesión de práctica normal (misma tabla y forma que las demás). */
    async function recordLesson(lesson, results, startedAt){
      if(!S.ready || !env.pushSession) return { ok: false };
      var now = env.now ? env.now() : Date.now();
      var d = new Date(now);
      var date = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      var session = {
        skill: 'gramatica', level: meta ? meta.level : 'facil', topics: [meta ? meta.engineTopic : 'academia'],
        date: date, startedAt: startedAt || now, durationMs: Math.max(0, now - (startedAt || now)),
        results: results.map(function(r){ return { itemId: engineId(r.id), isCorrect: !!r.ok }; })
      };
      try{ await env.pushSession(session); return { ok: true }; }catch(e){ return { ok: false }; }
    }

    /* ---- examen oficial ---- */
    async function rpc(name, args){
      try{
        var r = await client().rpc(name, args);
        if(r.error || !r.data) return { ok: false, error: 'net' };
        return r.data;
      }catch(e){ return { ok: false, error: 'net' }; }
    }
    function examStatus(){ return S.ready ? rpc('academia_exam_status', { p_course: courseId }) : Promise.resolve({ ok: false, error: 'anon' }); }
    function examStart(){ return S.ready ? rpc('academia_exam_start', { p_course: courseId }) : Promise.resolve({ ok: false, error: 'anon' }); }
    function examSubmit(attemptId, answers){ return S.ready ? rpc('academia_exam_submit', { p_attempt: attemptId, p_answers: answers }) : Promise.resolve({ ok: false, error: 'anon' }); }
    async function badge(){
      if(!S.ready) return null;
      try{
        var r = await client().from('academia_badges').select('score_pct,awarded_at').eq('course_id', courseId).maybeSingle();
        return r && !r.error ? r.data : null;
      }catch(e){ return null; }
    }

    return { boot: boot, save: save, recordAnswer: recordAnswer, flushMistakes: flushMistakes, recordLesson: recordLesson,
      examStatus: examStatus, examStart: examStart, examSubmit: examSubmit, badge: badge,
      get ready(){ return S.ready; }, get dirty(){ return S.dirty; }, get online(){ return S.online; }, get version(){ return S.version; },
      get pendingMistakes(){ return S.mistakeBuf.length; }, enabled: enabled };
  }

  return { create: create, mergeStates: mergeStates, cleanState: cleanState, sameState: sameState };
})();
if(typeof module !== 'undefined' && module.exports) module.exports = AcademiaNube;
