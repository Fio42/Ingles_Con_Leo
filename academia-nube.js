/* ============================================================
   ACADEMIA EN LA NUBE (rama de trabajo, apagada por defecto).

   Une la academia con lo que ya existe, sin crear sistemas paralelos:
   - Progreso del curso   -> tabla academia_progress (RPC academia_save_progress, con versión).
   - Errores de actividades -> el motor ACTUAL (mistake_stats) vía academia_apply_mistakes, item_id 'ac:<curso>:<actividad>'.
   - Lección completada   -> RPC academia_record_session (progress_sessions, skill 'gramatica'): cuenta para racha, precisión
                             semanal y diagnóstico, y marca last_practice_at si es un miembro.
   - Acceso y prueba gratis -> academia_access / academia_demo_start / academia_demo_finish (todo lo decide el servidor).
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
    var S = { ready: false, user: null, version: 0, remote: null, saving: false, dirty: false, timer: null, online: true, dropped: 0, queuedServer: 0 };

    function client(){ try{ return env.getClient ? env.getClient() : null; }catch(e){ return null; } }
    function enabled(){ return !!env.enabled && !!client(); }

    async function boot(localState){
      if(!enabled()) return { ok: false, reason: 'off' };
      var sess = null;
      try{ sess = await env.getSession(); }catch(e){}
      if(!sess || !sess.user){ return { ok: false, reason: 'anon' }; }
      S.user = sess.user.id;
      adoptPre();
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

    /* ---- Cola de envíos (sobrevive a cerrar el navegador) ----
       La fuente de verdad es el almacenamiento: cada operación lee, cambia y escribe en un solo bloque
       síncrono, así dos pestañas no se pisan. Un envío de errores se "sella" con un identificador ANTES de
       mandarlo y el servidor recuerda cuáles ya aplicó: reintentar, o que dos pestañas manden lo mismo,
       nunca cuenta dos veces. */
    var MAX_ITEMS = 3000;
    var mem = {};                                   // respaldo si el almacenamiento no está disponible
    function qKey(){ return 'leo_academia_cola_v1:' + S.user + ':' + courseId; }
    function qRead(){
      var raw = null;
      try{ raw = env.storage ? env.storage.getItem(qKey()) : null; }catch(e){ raw = null; }
      var q = null;
      if(raw){ try{ q = JSON.parse(raw); }catch(e){ q = null; } }
      if(!q && mem[qKey()]) q = JSON.parse(mem[qKey()]);
      if(!isObj(q)) q = {};
      if(!Array.isArray(q.open)) q.open = [];
      if(!Array.isArray(q.batches)) q.batches = [];
      if(!Array.isArray(q.sessions)) q.sessions = [];
      return q;
    }
    function qWrite(q){
      var txt = JSON.stringify(q);
      mem[qKey()] = txt;
      try{ if(env.storage) env.storage.setItem(qKey(), txt); }catch(e){}
    }
    function qMutate(fn){ var q = qRead(); var out = fn(q); qWrite(q); return out; }
    function qCount(q){ var n = q.open.length; q.batches.forEach(function(b){ n += b.items.length; }); return n; }
    function newId(){
      if(env.uuid) return env.uuid();
      try{ if(typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
      var h = '0123456789abcdef', o = '';
      for(var i = 0; i < 36; i++){ o += (i === 8 || i === 13 || i === 18 || i === 23) ? '-' : (i === 14 ? '4' : h[Math.floor(Math.random() * 16)]); }
      return o;
    }
    var pre = [];                                   // respuestas dadas antes de saber qué cuenta es
    function adoptPre(){
      if(S.user && pre.length){ var p = pre; pre = []; qMutate(function(q){ q.open = q.open.concat(p); }); }
    }

    /* ---- errores al motor actual ---- */
    function engineId(activityId){ return 'ac:' + courseId + ':' + activityId; }
    function recordAnswer(activityId, isCorrect){
      var it = { item_id: engineId(activityId), kind: 'academia', topic: meta ? meta.engineTopic : null, is_correct: !!isCorrect };
      if(!S.user){ if(enabled() && pre.length < 500) pre.push(it); return; }
      qMutate(function(q){
        q.open.push(it);
        while(qCount(q) > MAX_ITEMS){ if(q.batches.length){ q.batches.shift(); } else { q.open.shift(); } S.dropped++; }
      });
    }
    function seal(){
      return qMutate(function(q){
        while(q.open.length){ q.batches.push({ id: newId(), items: q.open.splice(0, 200) }); }
      });
    }
    var flushChain = Promise.resolve();
    function flushMistakes(){
      flushChain = flushChain.then(doFlushMistakes, doFlushMistakes);
      return flushChain;
    }
    async function doFlushMistakes(){
      if(!S.ready || !S.user) return { ok: true, n: 0, pending: S.user ? qCount(qRead()) : 0 };
      seal();
      var sent = 0, failed = false;
      var batches = qRead().batches.slice();
      for(var i = 0; i < batches.length; i++){
        var b = batches[i], res = null;
        try{
          var r = await client().rpc('academia_apply_mistakes', { p_batch: b.id, p_items: b.items });
          res = r && !r.error ? r.data : null;
        }catch(e){ res = null; }
        if(res && res.ok){ sent += b.items.length; qMutate(function(q){ q.batches = q.batches.filter(function(x){ return x.id !== b.id; }); }); continue; }
        if(res && (res.error === 'bad' || res.error === 'members' || res.error === 'limit')){ S.dropped += b.items.length; qMutate(function(q){ q.batches = q.batches.filter(function(x){ return x.id !== b.id; }); }); continue; }   // el servidor lo rechaza para siempre
        if(res && res.error === 'engine'){ S.queuedServer++; qMutate(function(q){ q.batches = q.batches.filter(function(x){ return x.id !== b.id; }); }); continue; }  // el servidor lo guardó pendiente y lo reintenta
        failed = true; break;                         // sin red o sin función: se queda en la cola y se reintenta
      }
      return { ok: !failed, n: sent, pending: qCount(qRead()) };
    }
    /* Una lección terminada = UNA sesión de práctica normal (misma tabla y forma que las demás).
       Se encola con su hora de inicio fija y la guarda el SERVIDOR (academia_record_session): valida, no duplica
       (regla única usuario + inicio + skill) y, si es estudio real de un miembro, marca profiles.last_practice_at.
       Reintentar el envío, o terminar dos veces la misma pantalla, no duplica nada. */
    function recordLesson(lesson, results, startedAt){
      if(!S.user) return Promise.resolve({ ok: false });
      var now = env.now ? env.now() : Date.now();
      var d = new Date(now);
      var date = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
      var st = startedAt || now;
      var session = {
        date: date, startedAt: st, durationMs: Math.max(0, now - st),
        results: results.map(function(r){ return { itemId: engineId(r.id), isCorrect: !!r.ok }; })
      };
      qMutate(function(q){
        var dup = q.sessions.some(function(x){ return x.startedAt === session.startedAt; });
        if(!dup) q.sessions.push(session);
        if(q.sessions.length > 50) q.sessions.shift();
      });
      return flushSessions();
    }
    var sessChain = Promise.resolve();
    function flushSessions(){ sessChain = sessChain.then(doFlushSessions, doFlushSessions); return sessChain; }
    async function doFlushSessions(){
      if(!S.ready || !S.user) return { ok: false };
      var list = qRead().sessions.slice(), failed = false;
      for(var i = 0; i < list.length; i++){
        var ss = list[i], res = null;
        try{
          var r = await client().rpc('academia_record_session', { p_course: courseId, p_session: ss });
          res = r && !r.error ? r.data : null;
        }catch(e){ res = null; }
        var done = res && (res.ok || res.error === 'bad' || res.error === 'members' || res.error === 'limit');
        if(done){
          qMutate(function(q){ q.sessions = q.sessions.filter(function(x){ return x.startedAt !== ss.startedAt; }); });
          if(!res.ok) S.dropped++;
          continue;
        }
        failed = true; break;                         // sin red, curso apagado o error del servidor: se reintenta más tarde
      }
      return { ok: !failed };
    }
    /* Todo lo pendiente de la cuenta: errores, sesiones y envíos que el servidor dejó en espera. */
    async function flushAll(){
      if(!S.ready) return { ok: false };
      var a = await flushMistakes();
      var b = await flushSessions();
      try{ await client().rpc('academia_retry_pending'); }catch(e){}
      return { ok: a.ok && b.ok };
    }

    /* ---- acceso y demostración gratuita (todo lo decide el servidor) ---- */
    function localDay(){ var d = new Date(env.now ? env.now() : Date.now()); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function localCount(){ try{ return env.localDailyCount ? (env.localDailyCount() || 0) : 0; }catch(e){ return 0; } }
    async function access(){
      if(!S.ready) return { ok: false, error: S.user ? 'net' : 'anon' };
      var r = await rpcCall('academia_access', { p_course: courseId, p_today: localDay(), p_local_count: localCount() });
      if(r && r.ok){ S.access = r; }
      return r;
    }
    async function demoStart(){
      if(!S.ready) return { ok: false, error: S.user ? 'net' : 'anon' };
      var r = await rpcCall('academia_demo_start', { p_course: courseId, p_today: localDay(), p_local_count: localCount() });
      if(r && r.ok && r.daily && env.setLocalDailyCount){ try{ env.setLocalDailyCount(r.daily.count); }catch(e){} }
      return r;
    }
    function demoFinish(){ return S.ready ? rpcCall('academia_demo_finish', { p_course: courseId }) : Promise.resolve({ ok: false, error: 'anon' }); }

    /* ---- examen oficial ---- */
    function rpcCall(name, args){ return rpc(name, args); }
    async function rpc(name, args){
      try{
        var r = await client().rpc(name, args);
        if(r.error || !r.data) return { ok: false, error: 'net' };
        return r.data;
      }catch(e){ return { ok: false, error: 'net' }; }
    }
    /* ---- contenido premium (solo miembros vigentes; el servidor decide) ---- */
    function content(){ return S.ready ? rpc('academia_get_content', { p_course: courseId }) : Promise.resolve({ ok: false, error: 'anon' }); }
    /* URLs temporales (6 h) de los audios privados. Devuelve { 'curso/hash.mp3': url } o null. */
    async function signAudio(names){
      if(!S.ready || !names || !names.length) return null;
      try{
        var r = await client().storage.from('academia-audio').createSignedUrls(names, 21600);
        if(!r || r.error || !r.data) return null;
        var out = {}; r.data.forEach(function(x){ if(x && x.signedUrl && !x.error) out[x.path] = x.signedUrl; });
        return out;
      }catch(e){ return null; }
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

    return { boot: boot, save: save, recordAnswer: recordAnswer, flushMistakes: flushMistakes, recordLesson: recordLesson, flushAll: flushAll, flushSessions: flushSessions, access: access, demoStart: demoStart, demoFinish: demoFinish,
      content: content, signAudio: signAudio, examStatus: examStatus, examStart: examStart, examSubmit: examSubmit, badge: badge,
      get ready(){ return S.ready; }, get dirty(){ return S.dirty; }, get online(){ return S.online; }, get version(){ return S.version; },
      get pendingMistakes(){ return S.user ? qCount(qRead()) : pre.length; }, get pendingSessions(){ return S.user ? qRead().sessions.length : 0; },
      get dropped(){ return S.dropped; }, get queuedInServer(){ return S.queuedServer; }, enabled: enabled };
  }

  return { create: create, mergeStates: mergeStates, cleanState: cleanState, sameState: sameState, KEYS: CLEAN_KEYS.slice() };
})();
if(typeof module !== 'undefined' && module.exports) module.exports = AcademiaNube;
