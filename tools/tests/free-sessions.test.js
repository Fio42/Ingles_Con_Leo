#!/usr/bin/env node
/* Sesiones de PRÁCTICA GRATIS de una cuenta (no miembro) -> progress_sessions.
   Corre con:  node tools/tests/free-sessions.test.js   (desde la carpeta inglesconLeo)
   Usa app.js, data.js, temas.js y backend.js REALES. La "nube" imita lo que hace Supabase después de la migración
   progress_sessions_free_tier_guard: la base pone tier ('free' si la cuenta no es miembro), rechaza una sesión
   repetida (misma cuenta + inicio + habilidad, código 23505) y corta al pasar el límite diario (P0001).

   Reglas que se protegen:
   - un INVITADO no sube nada ni guarda borradores;
   - una CUENTA GRATIS sube su sesión al terminar, al toparse con el límite diario y, si cerró la pestaña a medias,
     la próxima vez que abre la práctica; nunca dos veces la misma;
   - no se toca el progreso local, mistake_stats, las señales de microtemas ni last_practice_at;
   - los límites 5 / 10 no cambian y un MIEMBRO sigue guardando exactamente como antes. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const noop = () => {};

const CLOUD = { member:false, sessions:[], down:false, cap:40, calls:[], profileUpdates:[], rpc:[] };
function resetCloud(){ CLOUD.member = false; CLOUD.sessions = []; CLOUD.down = false; CLOUD.cap = 40; CLOUD.calls = []; CLOUD.profileUpdates = []; CLOUD.rpc = []; }

function fakeClient(userId){
  const SESSION = userId ? { user:{ id:userId }, access_token:'t' } : null;
  function builder(table){
    const st = { table, op:'select', payload:null, eq:{} };
    const b = {
      select(){ return b; }, eq(k, v){ st.eq[k] = v; return b; }, is(){ return b; }, in(){ return b; }, order(){ return b; }, limit(){ return b; }, single(){ return b; },
      update(p){ st.op = 'update'; st.payload = p; return b; }, insert(p){ st.op = 'insert'; st.payload = p; return b; },
      then(res, rej){ return run().then(res, rej); }
    };
    async function run(){
      CLOUD.calls.push(st.op + ' ' + st.table);
      if(CLOUD.down) return { data:null, error:{ message:'network' } };
      if(st.table === 'profiles' && st.op === 'update'){ CLOUD.profileUpdates.push(Object.keys(st.payload).sort().join(',')); return { data:null, error:null }; }
      if(st.table === 'progress_sessions'){
        if(st.op === 'insert'){
          const p = st.payload;
          if(!SESSION || p.user_id !== SESSION.user.id) return { data:null, error:{ code:'42501', message:'rls' } };
          if('tier' in p || 'created_at' in p) throw new Error('el navegador no debe mandar tier ni created_at');
          if(CLOUD.sessions.some(r => r.user_id === p.user_id && r.started_at === p.started_at && r.skill === p.skill)) return { data:null, error:{ code:'23505', message:'duplicate key' } };
          if(CLOUD.sessions.filter(r => r.user_id === p.user_id).length >= CLOUD.cap) return { data:null, error:{ code:'P0001', message:'progress_sessions: limite diario de sesiones' } };
          CLOUD.sessions.push(Object.assign({ id: CLOUD.sessions.length + 1, tier: CLOUD.member ? null : 'free' }, JSON.parse(JSON.stringify(p))));
          return { data:null, error:null };
        }
        return { data: CLOUD.sessions.filter(r => !st.eq.user_id || r.user_id === st.eq.user_id).map(r => Object.assign({}, r)), error:null };
      }
      return { data: [], error:null };
    }
    return b;
  }
  return { auth:{ getSession: async () => ({ data:{ session: SESSION } }), onAuthStateChange: () => ({ data:{ subscription:{ unsubscribe: noop } } }), signOut: async () => ({}) },
    from: builder, rpc: async (name) => { CLOUD.rpc.push(name); return { data:null, error:null }; }, functions:{ invoke: async () => ({ data:null, error:null }) } };
}

// Un navegador: su propio localStorage. opts.user = id de la cuenta con sesión iniciada (o nada = invitado);
// opts.tier = 'free' para la práctica gratis de una cuenta; opts.store = localStorage heredado (misma máquina, otra carga).
function makeBrowser(opts){
  opts = opts || {};
  const store = opts.store || {};
  const node = () => ({ addEventListener:noop, style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, querySelector:()=>null, querySelectorAll:()=>[], appendChild:noop, remove:noop, dataset:{}, textContent:'', innerHTML:'' });
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams, Event: function(n){ this.type = n; },
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; }, key:i=>Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', documentElement: node(), body: node(), createElement: () => node() },
    location:{ hash:'', search:'', pathname:'/practica.html', href:'' }, navigator:{ userAgent:'node' }, addEventListener:noop, dispatchEvent: noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; }, matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  if(opts.user) store['sb-test-auth-token'] = '{}';
  ctx.supabase = { createClient: () => fakeClient(opts.user || null) };
  vm.createContext(ctx);
  ['data.js', 'temas.js', 'app.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
  vm.runInContext(fs.readFileSync(path.join(root, 'backend.js'), 'utf8') + '\n;this.__LeoBackend = LeoBackend;', ctx);
  ctx.LeoBackend = ctx.__LeoBackend;
  const run = code => vm.runInContext(code, ctx);
  if(opts.tier === 'free') run(`initLeoAccessTier('free', { id:${JSON.stringify(opts.user)}, is_member:false, free_daily_count:0, free_daily_date:null, free_first_exercise_at:'2026-01-01T00:00:00Z' })`);
  const t = run(';({ freeSessionBegin, freeSessionAnswer, freeSessionEnd, freeSessionResume, flushFreeSessions, renderFreeDailyLimitReachedBlock, freeDailyLimitReached, bumpFreeDailyExerciseCount, recordSession, loadProgress, noteGrammarAnswer, markGrammarRetry })');
  t.run = run; t.store = store; t.LeoBackend = ctx.LeoBackend;
  t.pending = () => JSON.parse(store.leo_free_pending_v1 || '[]');
  t.settle = () => new Promise(r => setTimeout(r, 40));
  return t;
}
// Responde un ejercicio como lo hace una sesión gratis: (gramática) queda anotado lo elegido y se confirma con "Siguiente".
function answer(B, skill, level, itemId, isCorrect, pick){
  if(pick !== undefined) B.noteGrammarAnswer(null, { id:itemId }, isCorrect, pick);
  B.bumpFreeDailyExerciseCount();
  B.freeSessionAnswer(skill, level, ['Tema'], { itemId, isCorrect });
}

let passed = 0, queue = Promise.resolve();
function test(name, fn){
  queue = queue.then(async () => {
    resetCloud();
    try{ await fn(); passed++; console.log('  ok  ' + name); }
    catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
  });
}
const inserts = () => CLOUD.calls.filter(c => c === 'insert progress_sessions').length;

test('los límites gratis no cambian: 5 de invitado y 10 de cuenta gratis', async () => {
  const B = makeBrowser({});
  assert.strictEqual(B.run('GUEST_EXERCISE_LIMIT'), 5);
  assert.strictEqual(B.run('FREE_USER_DAILY_LIMIT'), 10);
});

test('INVITADO: no sube nada, no guarda borradores y su límite sigue siendo 5', async () => {
  const B = makeBrowser({});
  B.freeSessionResume();
  B.freeSessionBegin('gramatica');
  for(let i = 1; i <= 5; i++) answer(B, 'gramatica', 'facil', 'g-facil-some-' + ((i % 4) + 1), i % 2 === 0, 'some');
  assert.strictEqual(B.freeDailyLimitReached(), true, 'a los 5 el invitado llega a su límite');
  B.renderFreeDailyLimitReachedBlock();
  B.freeSessionEnd('gramatica');
  await B.settle();
  assert.strictEqual(CLOUD.calls.length, 0, 'ninguna llamada a la nube (' + CLOUD.calls.join(', ') + ')');
  assert.strictEqual(B.store.leo_free_pending_v1, undefined, 'ni un borrador en el navegador');
});

test('invitado que luego crea su cuenta: lo que hizo como invitado no se sube', async () => {
  const G = makeBrowser({});
  G.freeSessionBegin('gramatica');
  answer(G, 'gramatica', 'facil', 'g-facil-some-1', false, 'any');
  const U = makeBrowser({ user:'u1', tier:'free', store: G.store });            // misma máquina, ahora con cuenta
  U.freeSessionResume();
  await U.settle();
  assert.strictEqual(CLOUD.sessions.length, 0);
  U.freeSessionBegin('gramatica');
  answer(U, 'gramatica', 'facil', 'g-facil-some-2', true, 'some');
  U.freeSessionEnd('gramatica');
  await U.settle();
  assert.strictEqual(CLOUD.sessions.length, 1);
  assert.deepStrictEqual(CLOUD.sessions[0].results.map(r => r.itemId), ['g-facil-some-2'], 'solo lo respondido ya con cuenta');
});

test('CUENTA GRATIS: al terminar se sube UNA fila con la misma forma que las de Miembros, marcada free por la base', async () => {
  const B = makeBrowser({ user:'u1', tier:'free' });
  B.freeSessionBegin('gramatica');
  // 1) falla y reintenta (la primera confusión no se pierde); 2) acierta a la primera
  B.noteGrammarAnswer(null, { id:'g-medio-fut-gtevid-1' }, false, 'will');
  B.run("RETRY_ITEM_ID = 'g-medio-fut-gtevid-1'");
  answer(B, 'gramatica', 'medio', 'g-medio-fut-gtevid-1', true, 'is going to');
  answer(B, 'gramatica', 'medio', 'g-medio5-fut-1', true, 'am going to');
  assert.strictEqual(B.pending().length, 1, 'el borrador se guarda en cada respuesta');
  assert.strictEqual(inserts(), 0, 'todavía no se sube: la sesión sigue abierta');
  B.freeSessionEnd('gramatica');
  await B.settle();
  assert.strictEqual(CLOUD.sessions.length, 1);
  const row = CLOUD.sessions[0];
  assert.deepStrictEqual(Object.keys(row).sort(), ['date', 'duration_ms', 'id', 'level', 'results', 'skill', 'started_at', 'tier', 'topics', 'user_id']);
  assert.strictEqual(row.tier, 'free'); assert.strictEqual(row.user_id, 'u1'); assert.strictEqual(row.skill, 'gramatica'); assert.strictEqual(row.level, 'medio');
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.started_at > 0 && row.duration_ms >= 0);
  assert.strictEqual(row.results.length, 2);
  const r0 = row.results[0];
  assert.strictEqual(r0.itemId, 'g-medio-fut-gtevid-1'); assert.strictEqual(r0.isCorrect, true);
  assert.strictEqual(r0.m, 'going-to-evidencia', 'lleva su microtema');
  assert.strictEqual(r0.t, 2); assert.strictEqual(r0.w, 'will'); assert.strictEqual(r0.p, 'is going to');
  assert.ok(row.results.every(r => !('f' in r)), 'sin "primera vez": en gratis no hay historial local con qué saberlo');
  assert.strictEqual(B.pending().length, 0, 'subida: ya no queda pendiente');
});

test('no toca el progreso local, mistake_stats, microtemas ni last_practice_at', async () => {
  const B = makeBrowser({ user:'u1', tier:'free' });
  B.freeSessionBegin('gramatica');
  ['g-medio-fut-gtevid-1', 'g-medio-fut-gtevid-2', 'g-medio-fut-gtevid-3'].forEach(id => answer(B, 'gramatica', 'medio', id, false, 'will'));
  B.freeSessionEnd('gramatica');
  await B.settle();
  assert.strictEqual(CLOUD.sessions.length, 1);
  assert.strictEqual(B.loadProgress().sessions.length, 0, 'leo_progress sigue vacío');
  assert.strictEqual(B.store.leo_micro_stats_v1, undefined, 'sin señales de microtemas');
  assert.strictEqual(CLOUD.rpc.length, 0, 'no se llama a apply_mistake_results');
  assert.ok(!CLOUD.profileUpdates.some(u => /last_practice_at/.test(u)), 'last_practice_at es solo de miembros');
});

test('LÍMITE DIARIO: al llegar a 10 la sesión se corta y se guarda lo respondido hasta ahí', async () => {
  const B = makeBrowser({ user:'u1', tier:'free' });
  B.freeSessionBegin('vocabulario');
  for(let i = 1; i <= 8; i++) answer(B, 'vocabulario', 'facil', 'v-facil8-' + i, true);
  B.freeSessionEnd('vocabulario');                       // terminó la primera sesión (8)
  B.freeSessionBegin('listening');
  answer(B, 'listening', 'facil', 'l-facil6-1', true);
  assert.strictEqual(B.freeDailyLimitReached(), false, 'con 9 todavía puede seguir');
  answer(B, 'listening', 'facil', 'l-facil6-2', false);
  assert.strictEqual(B.freeDailyLimitReached(), true, 'a los 10 llega al límite, como siempre');
  const html = B.renderFreeDailyLimitReachedBlock();     // lo que pinta cada sesión gratis al toparse con el límite
  assert.ok(/10 ejercicios gratis de hoy/.test(html));
  await B.settle();
  assert.strictEqual(CLOUD.sessions.length, 2);
  assert.deepStrictEqual(CLOUD.sessions.map(s => s.skill + ':' + s.results.length), ['vocabulario:8', 'listening:2']);
  assert.strictEqual(B.pending().length, 0);
});

test('SESIÓN A MEDIAS (pestaña cerrada): se sube la próxima vez que abre la práctica, una sola vez', async () => {
  const A = makeBrowser({ user:'u1', tier:'free' });
  A.freeSessionBegin('gramatica');
  answer(A, 'gramatica', 'facil', 'g-facil-some-1', true, 'some');
  answer(A, 'gramatica', 'facil', 'g-facil-some-2', false, 'some');
  await A.settle();
  assert.strictEqual(CLOUD.sessions.length, 0, 'abierta: no se ha subido');
  const B = makeBrowser({ user:'u1', tier:'free', store: A.store });            // vuelve otro día al mismo navegador
  B.freeSessionResume();
  await B.settle();
  assert.strictEqual(CLOUD.sessions.length, 1);
  assert.strictEqual(CLOUD.sessions[0].results.length, 2);
  const C = makeBrowser({ user:'u1', tier:'free', store: B.store });
  C.freeSessionResume();
  await C.settle();
  assert.strictEqual(CLOUD.sessions.length, 1, 'no se vuelve a subir');
});

test('SIN RED: queda pendiente, se reintenta después y la base no deja guardarla dos veces', async () => {
  const A = makeBrowser({ user:'u1', tier:'free' });
  A.freeSessionBegin('gramatica');
  answer(A, 'gramatica', 'facil', 'g-facil-some-1', true, 'some');
  CLOUD.down = true;
  A.freeSessionEnd('gramatica');
  await A.settle();
  assert.strictEqual(CLOUD.sessions.length, 0);
  assert.strictEqual(A.pending().length, 1, 'sigue pendiente');
  assert.strictEqual(A.pending()[0].tries, 1);
  CLOUD.down = false;
  // la subida llegó a la base pero el navegador no se enteró: reintenta la misma sesión
  const copy = A.pending()[0];
  CLOUD.sessions.push({ id:1, tier:'free', user_id:'u1', skill:copy.skill, level:copy.level, started_at:copy.startedAt, results:copy.results, topics:copy.topics });
  const B = makeBrowser({ user:'u1', tier:'free', store: A.store });
  B.freeSessionResume();
  await B.settle();
  assert.strictEqual(CLOUD.sessions.length, 1, 'la repetida se rechaza (23505) y cuenta como guardada');
  assert.strictEqual(B.pending().length, 0);
});

test('una sesión que nunca se puede subir se descarta tras 5 intentos; la rechazada por la base, al primero', async () => {
  const A = makeBrowser({ user:'u1', tier:'free' });
  A.freeSessionBegin('gramatica');
  answer(A, 'gramatica', 'facil', 'g-facil-some-1', true, 'some');
  CLOUD.down = true;
  A.freeSessionEnd('gramatica');
  await A.settle();
  for(let i = 0; i < 4; i++){ await A.flushFreeSessions(); }
  assert.strictEqual(A.pending().length, 0, 'tras 5 fallos deja de insistir');
  CLOUD.down = false; CLOUD.cap = 0;                                              // la base corta por límite diario de filas
  A.freeSessionBegin('gramatica');
  answer(A, 'gramatica', 'facil', 'g-facil-some-2', true, 'some');
  A.freeSessionEnd('gramatica');
  await A.settle();
  assert.strictEqual(CLOUD.sessions.length, 0);
  assert.strictEqual(A.pending().length, 0, 'rechazo definitivo: no se reintenta');
});

test('el borrador de OTRA cuenta en el mismo navegador no se sube con esta', async () => {
  const A = makeBrowser({ user:'u1', tier:'free' });
  A.freeSessionBegin('gramatica');
  answer(A, 'gramatica', 'facil', 'g-facil-some-1', true, 'some');
  const B = makeBrowser({ user:'u2', tier:'free', store: A.store });            // otra persona inicia sesión aquí
  B.freeSessionResume();
  B.freeSessionBegin('gramatica');
  answer(B, 'gramatica', 'facil', 'g-facil-some-3', true, 'some');
  B.freeSessionEnd('gramatica');
  await B.settle();
  assert.deepStrictEqual(CLOUD.sessions.map(s => s.user_id + ':' + s.results[0].itemId), ['u2:g-facil-some-3']);
  assert.ok(B.pending().some(d => d.uid === 'u1'), 'lo de u1 espera a que u1 vuelva');
  const A2 = makeBrowser({ user:'u1', tier:'free', store: B.store });
  A2.freeSessionResume();
  await A2.settle();
  assert.deepStrictEqual(CLOUD.sessions.map(s => s.user_id).sort(), ['u1', 'u2']);
});

test('el reto diario a medias no se cierra porque termine otra sesión ni por el límite diario', async () => {
  const B = makeBrowser({ user:'u1', tier:'free' });
  B.freeSessionBegin('reto-diario');
  B.freeSessionAnswer('reto-diario', 'facil', ['Reto diario'], { itemId:'g-facil-some-1', isCorrect:true });
  B.freeSessionBegin('gramatica');
  answer(B, 'gramatica', 'facil', 'g-facil-some-2', true, 'some');
  B.freeSessionEnd('gramatica');
  B.freeSessionEnd();                                                             // corte por límite diario
  await B.settle();
  assert.deepStrictEqual(CLOUD.sessions.map(s => s.skill), ['gramatica']);
  B.freeSessionAnswer('reto-diario', 'facil', ['Reto diario'], { itemId:'g-facil-some-3', isCorrect:false });
  B.freeSessionEnd('reto-diario');
  await B.settle();
  assert.deepStrictEqual(CLOUD.sessions.map(s => s.skill + ':' + s.results.length), ['gramatica:1', 'reto-diario:2'], 'el reto queda en UNA fila');
});

test('volver a empezar la misma habilidad: son dos sesiones distintas, con inicio distinto', async () => {
  const B = makeBrowser({ user:'u1', tier:'free' });
  B.freeSessionBegin('gramatica');
  answer(B, 'gramatica', 'facil', 'g-facil-some-1', true, 'some');
  B.freeSessionBegin('gramatica');                                                // cambió de nivel o volvió a tocar la pestaña
  answer(B, 'gramatica', 'medio', 'g-medio5-fut-1', true, 'will');
  B.freeSessionEnd('gramatica');
  await B.settle();
  assert.strictEqual(CLOUD.sessions.length, 2);
  assert.notStrictEqual(CLOUD.sessions[0].started_at, CLOUD.sessions[1].started_at);
});

test('MIEMBRO: recordSession guarda igual que antes (progreso local, nube y last_practice_at) y no usa borradores', async () => {
  CLOUD.member = true;
  const B = makeBrowser({ user:'m1' });                                           // páginas de miembros: nunca se activa el nivel "free"
  B.freeSessionBegin('gramatica');
  B.freeSessionAnswer('gramatica', 'medio', ['x'], { itemId:'g-medio5-fut-1', isCorrect:true });
  B.freeSessionEnd('gramatica');
  B.recordSession({ skill:'gramatica', level:'medio', topics:['Futuro'], results:[{ itemId:'g-medio5-fut-1', isCorrect:false }], startedAt: Date.now() - 5000 });
  await B.settle();
  assert.strictEqual(B.loadProgress().sessions.length, 1);
  assert.strictEqual(CLOUD.sessions.length, 1);
  assert.strictEqual(CLOUD.sessions[0].tier, null, 'la base no marca free a un miembro');
  assert.ok(CLOUD.profileUpdates.some(u => /last_practice_at/.test(u)));
  assert.ok(CLOUD.rpc.indexOf('apply_mistake_results') !== -1);
  assert.strictEqual(B.store.leo_free_pending_v1, undefined);
});

test('al hacerse miembro, la sincronización trae sus sesiones gratis y conserva tier "free"', async () => {
  const F = makeBrowser({ user:'u1', tier:'free' });
  F.freeSessionBegin('gramatica');
  answer(F, 'gramatica', 'medio', 'g-medio5-fut-1', false, 'will');
  answer(F, 'gramatica', 'medio', 'g-medio5-fut-2', true, 'is going to');
  F.freeSessionEnd('gramatica');
  await F.settle();
  CLOUD.member = true;
  const M = makeBrowser({ user:'u1' });                                           // ya pagó: entra a Miembros (otro navegador, sin nada local)
  assert.strictEqual(await M.LeoBackend.syncProgressFromCloud(), 'ok');
  const s = M.loadProgress().sessions;
  assert.strictEqual(s.length, 1);
  assert.strictEqual(s[0].tier, 'free');
  assert.deepStrictEqual(s[0].results.map(r => r.itemId + ':' + r.isCorrect), ['g-medio5-fut-1:false', 'g-medio5-fut-2:true']);
  assert.strictEqual(await M.LeoBackend.syncProgressFromCloud(), 'ok');
  assert.strictEqual(M.loadProgress().sessions.length, 1, 'sincronizar otra vez no duplica');
});

queue.then(() => console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : '')));
