#!/usr/bin/env node
/* Nivel y onboarding en la nube (profiles.level + profiles.onboarded_at).
   Corre con:  node tools/tests/onboarding-nube.test.js   (desde la carpeta inglesconLeo)
   Usa app.js, data.js, temas.js y backend.js REALES. Cada navegador tiene su propio localStorage; la "nube" es una
   fila de profiles + sesiones, con los mismos permisos que Supabase (solo level/onboarded_at/display_name... y
   onboarded_at solo si estaba en NULL). Se puede apagar la red con CLOUD.down = true.

   Regla que se protege: una cuenta que ya hizo (o saltó) el onboarding no lo vuelve a ver al cambiar de navegador, y el
   nivel de la nube manda sobre el de localStorage. Un invitado (sin sesión) no toca profiles y la práctica gratis
   sigue exactamente igual. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const noop = () => {};

const CLOUD = { profile: null, sessions: [], down: false, sessionsDown: false, calls: [], updates: [] };
const WRITABLE = ['level', 'level_source', 'onboarded_at', 'display_name', 'last_seen_at', 'last_practice_at'];   // columnas con GRANT UPDATE
const LEVELS_OK = ['principiante', 'facil', 'medio', 'avanzado'];
const SOURCES_OK = ['self', 'skipped', 'suggested', 'history', 'test'];   // check de profiles.level_source
function resetCloud(){ CLOUD.profile = { id:'u1', is_member:false, level:null, level_source:null, onboarded_at:null, display_name:null }; CLOUD.sessions = []; CLOUD.down = false; CLOUD.sessionsDown = false; CLOUD.failSource = false; CLOUD.calls = []; CLOUD.updates = []; }

function fakeClient(loggedIn){
  const SESSION = loggedIn ? { user:{ id:'u1' }, access_token:'t' } : null;
  function builder(table){
    const st = { table, op:'select', payload:null, eq:{}, isNull:[], inn:{}, single:false, order:null, lim:null };
    const b = {
      select(){ return b; }, eq(k, v){ st.eq[k] = v; return b; }, is(k, v){ st.isNull.push(k); return b; }, in(k, v){ st.inn[k] = v; return b; },
      order(k, o){ st.order = { k, asc: !o || o.ascending !== false }; return b; }, limit(n){ st.lim = n; return b; },
      single(){ st.single = true; return b; }, update(p){ st.op = 'update'; st.payload = p; return b; }, insert(p){ st.op = 'insert'; st.payload = p; return b; },
      then(res, rej){ return run().then(res, rej); }
    };
    async function run(){
      CLOUD.calls.push(st.op + ' ' + st.table);
      if(CLOUD.down) return { data:null, error:{ message:'network' } };
      if(st.table === 'profiles'){
        if(st.op === 'select') return { data: st.single ? Object.assign({}, CLOUD.profile) : [Object.assign({}, CLOUD.profile)], error:null };
        if(st.op === 'update'){
          const bad = Object.keys(st.payload).filter(k => WRITABLE.indexOf(k) === -1);
          if(bad.length) return { data:null, error:{ message:'permission denied for column ' + bad[0] } };
          if(st.payload.level !== undefined && LEVELS_OK.indexOf(st.payload.level) === -1) return { data:null, error:{ message:'check violation' } };
          if(st.payload.level_source !== undefined && SOURCES_OK.indexOf(st.payload.level_source) === -1) return { data:null, error:{ message:'check violation' } };
          if(st.eq.id !== CLOUD.profile.id) return { data:null, error:null };                              // RLS: solo su fila
          if(st.eq.level !== undefined && st.eq.level !== CLOUD.profile.level) return { data:null, error:null };   // .eq('level', x) sin coincidencias
          if(st.isNull.some(k => CLOUD.profile[k] !== null)) return { data:null, error:null };            // .is(k, null) sin coincidencias
          if(CLOUD.failSource && st.payload.level_source !== undefined) return { data:null, error:{ message:'network' } };
          CLOUD.updates.push(Object.keys(st.payload).sort().join(','));
          Object.assign(CLOUD.profile, st.payload);
          return { data:null, error:null };
        }
      }
      if(st.table === 'progress_sessions'){
        if(st.op === 'insert'){ CLOUD.sessions.push(st.payload); return { data:null, error:null }; }
        if(CLOUD.sessionsDown) return { data:null, error:{ message:'network' } };
        let rows = CLOUD.sessions.slice();
        if(st.inn.skill) rows = rows.filter(r => st.inn.skill.indexOf(r.skill) !== -1);
        if(st.inn.level) rows = rows.filter(r => st.inn.level.indexOf(r.level) !== -1);
        if(st.order) rows.sort((a, b) => (st.order.asc ? 1 : -1) * ((a.started_at || 0) - (b.started_at || 0)));
        if(st.lim) rows = rows.slice(0, st.lim);
        return { data: rows.map(r => ({ level: r.level, skill: r.skill, started_at: r.started_at, results: r.results || [], topics: r.topics || [], date: r.date, duration_ms: r.duration_ms, id: 1 })), error:null };
      }
      return { data: st.single ? null : [], error:null };
    }
    return b;
  }
  return { auth:{ getSession: async () => ({ data:{ session: SESSION } }), onAuthStateChange: () => ({ data:{ subscription:{ unsubscribe: noop } } }), signOut: async () => ({}) },
    from: builder, rpc: async () => ({ data:null, error:null }), functions:{ invoke: async () => ({ data:null, error:null }) } };
}

function makeBrowser(opts){
  opts = opts || {};
  const store = {};
  const shown = [];            // overlays de onboarding que se mostraron
  const handlers = {};
  const node = sel => ({ value: (opts.name || ''), addEventListener: (ev, fn) => { handlers[sel] = fn; }, style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop,
    querySelector: noop, querySelectorAll: () => [], appendChild: noop, remove: noop, dataset:{}, textContent:'', innerHTML:'' });
  const overlay = () => { const o = node('overlay'); o.className = ''; o.querySelector = sel => {
      if(sel === '#onbName') return { value: opts.name || 'Ana' };
      if(sel === 'input[name=onbLevel]:checked') return { value: opts.level || 'medio' };
      return node(sel); };
    o.querySelectorAll = () => []; o.remove = noop; return o; };
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams, Event: function(n){ this.type = n; },
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; }, key:i=>Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', documentElement: node('html'),
      body:{ appendChild: o => shown.push(o), style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, addEventListener:noop }, createElement: () => overlay() },
    location:{ hash:'', search:'', pathname:'/', href:'' }, navigator:{ userAgent:'node' }, addEventListener:noop, dispatchEvent: noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; }, matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  if(opts.loggedIn) store['sb-test-auth-token'] = '{}';                  // así reconoce el sitio que hay sesión iniciada en este navegador
  ctx.supabase = { createClient: () => fakeClient(!!opts.loggedIn) };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'backend.js'), 'utf8') + '\n;this.__LeoBackend = LeoBackend;', ctx);
  ctx.LeoBackend = ctx.__LeoBackend;
  vm.runInContext(';this.__t = { getProfile, getUserLevel, getUserLevelSource, setUserLevel, initOnboarding, recordSession, loadProgress, reconcileProfileWithCloud, isValidLevel };', ctx);
  const t = ctx.__t;
  t.ctx = ctx; t.store = store; t.shown = shown; t.handlers = handlers; t.LeoBackend = ctx.LeoBackend;
  t.profile = () => JSON.parse(store.leo_profile || 'null');
  t.settle = () => new Promise(r => setTimeout(r, 30));              // deja terminar los envíos "fire and forget"
  return t;
}

let passed = 0, queue = Promise.resolve();
function test(name, fn){
  queue = queue.then(async () => {
    resetCloud();
    try{ await fn(); passed++; console.log('  ok  ' + name); }
    catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
  });
}
const touchedProfiles = () => CLOUD.calls.filter(c => /profiles/.test(c)).length;
const iso = ms => new Date(ms).toISOString();

test('cuenta nueva: el onboarding sale una vez y un segundo navegador no lo repite (con el nivel elegido)', async () => {
  const A = makeBrowser({ loggedIn:true, level:'medio', name:'Ana' });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding();
  assert.strictEqual(A.shown.length, 1, 'en la cuenta nueva sí se muestra');
  A.handlers['#onbSubmit']();
  await A.settle();
  assert.strictEqual(CLOUD.profile.level, 'medio');
  assert.ok(CLOUD.profile.onboarded_at);
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  B.initOnboarding();
  assert.strictEqual(B.shown.length, 0, 'el segundo navegador no lo repite');
  assert.strictEqual(B.getUserLevel(), 'medio');
  assert.strictEqual(B.profile().level, 'medio');
});

test('"Saltar": la nube lo recuerda y el segundo navegador tampoco lo repite', async () => {
  const A = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding();
  A.handlers['#onbSkip']({ preventDefault: noop });
  await A.settle();
  assert.strictEqual(CLOUD.profile.level, 'facil');
  assert.ok(CLOUD.profile.onboarded_at);
  assert.ok(!A.profile().lp, 'saltar no es una elección de nivel pendiente');
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  B.initOnboarding();
  assert.strictEqual(B.shown.length, 0);
});

/* ---------- ORIGEN DEL NIVEL (profiles.level_source) ---------- */
test('ORIGEN: elegir nivel en el onboarding queda como "self" y el segundo navegador lo lee de la nube', async () => {
  const A = makeBrowser({ loggedIn:true, level:'medio', name:'Ana' });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding(); A.handlers['#onbSubmit'](); await A.settle();
  assert.strictEqual(CLOUD.profile.level, 'medio'); assert.strictEqual(CLOUD.profile.level_source, 'self');
  assert.strictEqual(A.getUserLevelSource(), 'self');
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  assert.strictEqual(B.getUserLevel(), 'medio'); assert.strictEqual(B.getUserLevelSource(), 'self');
});

test('ORIGEN: "Saltar" queda como "skipped" (Fácil provisional, no una elección) también en el segundo navegador, sin repetir onboarding', async () => {
  const A = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding(); A.handlers['#onbSkip']({ preventDefault: noop }); await A.settle();
  assert.strictEqual(CLOUD.profile.level, 'facil'); assert.strictEqual(CLOUD.profile.level_source, 'skipped');
  assert.ok(CLOUD.profile.onboarded_at);
  assert.strictEqual(A.getUserLevel(), 'facil'); assert.strictEqual(A.getUserLevelSource(), 'skipped');
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  B.initOnboarding();
  assert.strictEqual(B.shown.length, 0, 'no se repite el onboarding');
  assert.strictEqual(B.getUserLevel(), 'facil'); assert.strictEqual(B.getUserLevelSource(), 'skipped');
  // empezar sesiones (las páginas llaman setUserLevel con el nivel actual) no lo convierte en una elección
  B.setUserLevel('facil'); B.setUserLevel('facil'); await B.settle();
  assert.strictEqual(CLOUD.profile.level_source, 'skipped');
  assert.strictEqual(B.getUserLevelSource(), 'skipped');
});

test('ORIGEN: quien saltó y luego cambia de nivel pasa a "self"; el otro navegador lo adopta', async () => {
  const A = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding(); A.handlers['#onbSkip']({ preventDefault: noop }); await A.settle();
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  B.setUserLevel('medio'); await B.settle();
  assert.strictEqual(CLOUD.profile.level, 'medio'); assert.strictEqual(CLOUD.profile.level_source, 'self');
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(A.getUserLevel(), 'medio'); assert.strictEqual(A.getUserLevelSource(), 'self');
  assert.ok(!A.profile().skipped, 'la marca vieja de "saltó" no sobrevive');
});

test('ORIGEN: el test de nivel queda como "test", aunque el nivel sea el mismo que ya tenía', async () => {
  const A = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding(); A.handlers['#onbSkip']({ preventDefault: noop }); await A.settle();
  A.setUserLevel('facil', 'test'); await A.settle();                               // el test dijo Fácil
  assert.strictEqual(CLOUD.profile.level, 'facil'); assert.strictEqual(CLOUD.profile.level_source, 'test');
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  assert.strictEqual(B.getUserLevelSource(), 'test');
  B.setUserLevel('avanzado', 'suggested'); await B.settle();                       // sugerencia aceptada (pantalla futura)
  assert.strictEqual(CLOUD.profile.level_source, 'suggested');
  B.setUserLevel('avanzado', 'cualquier-cosa'); await B.settle();                  // origen inválido: se ignora
  assert.strictEqual(CLOUD.profile.level_source, 'suggested');
});

test('ORIGEN: nivel recuperado del historial queda como "history"', async () => {
  CLOUD.sessions = [{ skill:'plan', level:'medio', started_at: 3000 }];
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level, 'medio'); assert.strictEqual(CLOUD.profile.level_source, 'history');
  const C = makeBrowser({ loggedIn:true });
  await C.LeoBackend.getMemberProfile();
  assert.strictEqual(C.getUserLevelSource(), 'history');
});

test('ORIGEN, cuentas actuales: nube con nivel y sin origen se queda sin origen (no se inventa "self")', async () => {
  CLOUD.profile.level = 'medio'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const A = makeBrowser({ loggedIn:true });
  A.store.leo_profile = JSON.stringify({ name:'Leo', level:'medio', createdAt: 1 });
  await A.LeoBackend.getMemberProfile(); await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, null);
  assert.strictEqual(A.getUserLevelSource(), null);
  assert.strictEqual(CLOUD.updates.filter(u => /level/.test(u)).length, 0, 'ninguna escritura');
  A.initOnboarding();
  assert.strictEqual(A.shown.length, 0);
});

test('MIGRACIÓN: un navegador viejo que recuerda que saltó (skipped:true, Fácil) lo sube UNA vez; otro navegador lo ve', async () => {
  CLOUD.profile.level = 'facil'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);      // cuenta de antes de level_source
  const A = makeBrowser({ loggedIn:true });
  A.store.leo_profile = JSON.stringify({ name:'', level:'facil', skipped:true, createdAt: 1 });
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, 'skipped');
  assert.strictEqual(CLOUD.profile.level, 'facil');
  assert.strictEqual(A.getUserLevelSource(), 'skipped');
  const n = CLOUD.updates.filter(u => /level_source/.test(u)).length;
  await A.LeoBackend.getMemberProfile(); await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.updates.filter(u => /level_source/.test(u)).length, n, 'no se vuelve a escribir');
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  B.initOnboarding();
  assert.strictEqual(B.shown.length, 0);
  assert.strictEqual(B.getUserLevelSource(), 'skipped');
});

test('MIGRACIÓN segura: la pista vieja de "saltó" NO pisa un origen ya guardado ni un nivel distinto en la nube', async () => {
  // a) la nube ya dice que eligió Fácil en otro navegador
  CLOUD.profile.level = 'facil'; CLOUD.profile.level_source = 'self'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const A = makeBrowser({ loggedIn:true });
  A.store.leo_profile = JSON.stringify({ name:'', level:'facil', skipped:true, createdAt: 1 });
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, 'self');
  assert.strictEqual(A.getUserLevelSource(), 'self', 'la nube manda');
  assert.ok(!A.profile().skipped);
  // b) saltó aquí, pero en otro navegador ya cambió a Medio (cuenta sin origen): no se marca skipped
  resetCloud();
  CLOUD.profile.level = 'medio'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const B = makeBrowser({ loggedIn:true });
  B.store.leo_profile = JSON.stringify({ name:'', level:'facil', skipped:true, createdAt: 1 });
  await B.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, null);
  assert.strictEqual(B.getUserLevel(), 'medio'); assert.strictEqual(B.getUserLevelSource(), null);
  // c) saltó y después cambió de nivel en ESTE navegador viejo (la marca skipped quedó pegada): no cuenta como saltó
  resetCloud();
  CLOUD.profile.level = 'avanzado'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const C = makeBrowser({ loggedIn:true });
  C.store.leo_profile = JSON.stringify({ name:'', level:'avanzado', skipped:true, createdAt: 1 });
  await C.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, null);
  assert.strictEqual(C.getUserLevelSource(), null);
  // d) la base condiciona el UPDATE: aunque dos navegadores viejos lo intenten a la vez, el segundo no pisa
  resetCloud();
  CLOUD.profile.level = 'facil'; CLOUD.profile.level_source = 'test'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const D = makeBrowser({ loggedIn:true });
  assert.strictEqual(await D.LeoBackend.saveProfileToCloud({ level_source:'skipped', onlyIfSourceUnset:true, expectLevel:'facil' }), 'ok');
  assert.strictEqual(CLOUD.profile.level_source, 'test', 'UPDATE condicionado sin coincidencias');
  assert.strictEqual(await D.LeoBackend.saveProfileToCloud({ level_source:'inventado' }), 'fail', 'la nube rechaza orígenes inválidos');
});

test('MIGRACIÓN sin red: la pista vieja se conserva y se sube cuando vuelve la red', async () => {
  CLOUD.profile.level = 'facil'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const A = makeBrowser({ loggedIn:true });
  A.store.leo_profile = JSON.stringify({ name:'', level:'facil', skipped:true, createdAt: 1 });
  CLOUD.failSource = true;                    // la lectura funciona, la escritura del origen falla
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, null);
  assert.strictEqual(A.getUserLevelSource(), 'skipped', 'no se pierde la evidencia local');
  CLOUD.failSource = false;
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, 'skipped');
});

test('"Saltar" sin red: al volver la red la nube queda con Fácil provisional y origen skipped (una sola vez)', async () => {
  const A = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding();
  CLOUD.down = true;
  A.handlers['#onbSkip']({ preventDefault: noop }); await A.settle();
  assert.strictEqual(CLOUD.profile.level, null);
  CLOUD.down = false;
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level, 'facil'); assert.strictEqual(CLOUD.profile.level_source, 'skipped'); assert.ok(CLOUD.profile.onboarded_at);
  A.initOnboarding();
  assert.strictEqual(A.shown.length, 1, 'no se vuelve a mostrar (solo el de antes)');
});

test('origen pendiente sin red (mismo nivel, test hecho sin conexión): no lo pisa la nube y se sube después', async () => {
  CLOUD.profile.level = 'medio'; CLOUD.profile.level_source = 'self'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const A = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile();
  CLOUD.down = true;
  A.setUserLevel('medio', 'test'); await A.settle();
  assert.strictEqual(CLOUD.profile.level_source, 'self');
  CLOUD.down = false;
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level_source, 'test'); assert.strictEqual(CLOUD.profile.level, 'medio');
  assert.ok(!A.profile().lp);
});

test('INVITADO: el test de nivel guarda "test" solo en su navegador; al crear la cuenta sube con ese origen', async () => {
  const G = makeBrowser({ loggedIn:false });
  G.setUserLevel('medio', 'test');
  await G.settle();
  assert.strictEqual(CLOUD.calls.length, 0, 'invitado: ninguna llamada a la nube');
  assert.strictEqual(G.getUserLevelSource(), 'test');
  const U = makeBrowser({ loggedIn:true });                                       // crea su cuenta en ese mismo navegador
  U.store.leo_profile = G.store.leo_profile;
  await U.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level, 'medio'); assert.strictEqual(CLOUD.profile.level_source, 'test');
  U.initOnboarding();
  assert.strictEqual(U.shown.length, 0);
});

test('cuenta existente con perfil local viejo y nube vacía: inicializa la nube una sola vez (sin pisar la fecha)', async () => {
  const A = makeBrowser({ loggedIn:true });
  const created = Date.now() - 40 * 86400000;
  A.store.leo_profile = JSON.stringify({ name:'Leo', level:'medio', createdAt: created });
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level, 'medio');
  assert.strictEqual(CLOUD.profile.onboarded_at, iso(created));
  assert.strictEqual(A.profile().level, 'medio');
  assert.strictEqual(A.profile().name, 'Leo');
  const before = CLOUD.updates.length;
  await A.LeoBackend.getMemberProfile();                                          // otra carga: nada que subir
  assert.strictEqual(CLOUD.profile.onboarded_at, iso(created));
  assert.strictEqual(CLOUD.updates.filter(u => /onboarded_at/.test(u)).length, 1, 'onboarded_at se escribe una sola vez');
  assert.ok(CLOUD.updates.length >= before);
});

test('sin perfil local pero con historial fiable: recupera el nivel sin onboarding (y lo guarda en la nube)', async () => {
  // última sesión REAL de práctica = medio; después hay un "errores" (nivel 'todos') y un reto-diario: no cuentan
  CLOUD.sessions = [
    { skill:'gramatica', level:'facil', started_at: 1000 }, { skill:'plan', level:'medio', started_at: 3000 },
    { skill:'reto-diario', level:'avanzado', started_at: 4000 }, { skill:'errores', level:'todos', started_at: 5000 }
  ];
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  B.initOnboarding();
  assert.strictEqual(B.shown.length, 0);
  assert.strictEqual(B.getUserLevel(), 'medio');
  assert.strictEqual(CLOUD.profile.level, 'medio');
  assert.ok(CLOUD.profile.onboarded_at);
  const C = makeBrowser({ loggedIn:true });                                       // un tercer navegador ya lee la nube, no infiere otra vez
  await C.LeoBackend.getMemberProfile();
  assert.strictEqual(C.getUserLevel(), 'medio');
});

test('sin ninguna evidencia (ni perfil, ni historial): sí muestra el onboarding y no inventa nivel', async () => {
  const B = makeBrowser({ loggedIn:true });
  await B.LeoBackend.getMemberProfile();
  assert.strictEqual(CLOUD.profile.level, null);
  assert.strictEqual(B.profile(), null);
  B.initOnboarding();
  assert.strictEqual(B.shown.length, 1);
});

test('cambio de nivel en A: B lo adopta al volver a cargar', async () => {
  CLOUD.profile.level = 'facil'; CLOUD.profile.onboarded_at = iso(Date.now() - 1000);
  const A = makeBrowser({ loggedIn:true }), B = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile(); await B.LeoBackend.getMemberProfile();
  assert.strictEqual(B.getUserLevel(), 'facil');
  A.setUserLevel('avanzado');
  assert.strictEqual(A.getUserLevel(), 'avanzado', 'local inmediato');
  await A.settle();
  assert.strictEqual(CLOUD.profile.level, 'avanzado');
  assert.ok(!A.profile().lp, 'confirmado en la nube: ya no está pendiente');
  await B.LeoBackend.getMemberProfile();
  assert.strictEqual(B.getUserLevel(), 'avanzado');
});

test('nube y local discrepantes con onboarded_at existente: gana la nube (y no se toca)', async () => {
  CLOUD.profile.level = 'medio'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const A = makeBrowser({ loggedIn:true });
  A.store.leo_profile = JSON.stringify({ name:'Vieja', level:'facil', createdAt: 1 });
  await A.LeoBackend.getMemberProfile();
  assert.strictEqual(A.getUserLevel(), 'medio');
  assert.strictEqual(CLOUD.profile.level, 'medio');
  assert.strictEqual(CLOUD.updates.filter(u => /level/.test(u)).length, 0, 'no se escribió nada en level');
});

test('fallo de red: no sobrescribe la nube ni resetea al usuario a Fácil', async () => {
  CLOUD.profile.level = 'medio'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const A = makeBrowser({ loggedIn:true });
  A.store.leo_profile = JSON.stringify({ name:'Leo', level:'medio', createdAt: 1 });
  CLOUD.down = true;
  assert.strictEqual(await A.LeoBackend.getMemberProfile(), null);
  assert.strictEqual(A.getUserLevel(), 'medio', 'sigue con su caché');
  assert.strictEqual(CLOUD.updates.length, 0);
  // navegador nuevo + perfil leído pero el historial no se puede consultar: no se pregunta ni se guarda nada
  CLOUD.down = false;
  const B = makeBrowser({ loggedIn:true });
  CLOUD.profile.level = null; CLOUD.profile.onboarded_at = null;
  CLOUD.sessionsDown = true;                                                      // el perfil se lee bien pero el historial no
  await B.LeoBackend.getMemberProfile();
  B.initOnboarding();
  assert.strictEqual(B.shown.length, 0, 'sin poder confirmar, no se muestra onboarding');
  assert.strictEqual(B.profile(), null, 'no se guardó un Fácil inventado');
  assert.strictEqual(CLOUD.updates.filter(u => u !== 'last_seen_at').length, 0);
});

test('cambio de nivel sin red: queda pendiente, no lo pisa la nube vieja y se sube en el siguiente arranque', async () => {
  CLOUD.profile.level = 'facil'; CLOUD.profile.onboarded_at = iso(Date.now() - 5000);
  const A = makeBrowser({ loggedIn:true });
  await A.LeoBackend.getMemberProfile();
  CLOUD.down = true;
  A.setUserLevel('medio');
  await A.settle();
  assert.strictEqual(A.getUserLevel(), 'medio');
  assert.ok(A.profile().lp, 'quedó pendiente');
  assert.strictEqual(CLOUD.profile.level, 'facil', 'la nube sigue igual: no se pudo escribir');
  CLOUD.down = false;
  await A.LeoBackend.getMemberProfile();                                          // vuelve la red: gana el cambio pendiente
  assert.strictEqual(CLOUD.profile.level, 'medio');
  assert.strictEqual(A.getUserLevel(), 'medio');
  assert.ok(!A.profile().lp);
});

test('seguridad: solo se escriben level y onboarded_at, nunca is_member u otras columnas, y onboarded_at no se pisa', async () => {
  const A = makeBrowser({ loggedIn:true, level:'medio' });
  await A.LeoBackend.getMemberProfile();
  A.initOnboarding(); A.handlers['#onbSubmit'](); await A.settle();
  A.setUserLevel('avanzado'); await A.settle();
  CLOUD.updates.filter(u => u !== 'last_seen_at' && u !== 'display_name').forEach(u => assert.ok(u === 'level,level_source,onboarded_at' || u === 'level,level_source', 'columna inesperada: ' + u));   // last_seen_at y display_name ya se escribían antes
  assert.strictEqual(CLOUD.profile.is_member, false);
  const first = CLOUD.profile.onboarded_at;
  assert.strictEqual(await A.LeoBackend.saveProfileToCloud({ level:'facil', onboarded_at: '2000-01-01T00:00:00.000Z' }), 'ok');
  assert.strictEqual(CLOUD.profile.onboarded_at, first, 'onboarded_at ya existía: no se pisa');
  assert.strictEqual(CLOUD.profile.level, 'avanzado', 'y como el UPDATE condicionado no coincide, tampoco se cambia el nivel');
  assert.strictEqual(await A.LeoBackend.saveProfileToCloud({ level:'cualquiera' }), 'fail', 'la nube rechaza niveles inválidos');
});

test('INVITADO (sin sesión): no lee ni escribe profiles, no exige onboarding de cuenta y la práctica gratis funciona igual', async () => {
  const G = makeBrowser({ loggedIn:false });
  assert.strictEqual(await G.LeoBackend.getMemberProfile(), null);
  assert.strictEqual(await G.LeoBackend.getLatestSessionLevel(), null);
  assert.strictEqual(await G.LeoBackend.saveProfileToCloud({ level:'medio', onboarded_at: iso(Date.now()) }), 'skip');
  assert.strictEqual(await G.LeoBackend.syncProgressFromCloud(), 'skip');
  // practica gratis: elige nivel, practica y se guarda local, como siempre
  const before = Date.now();
  G.setUserLevel('medio');
  const p = G.profile();
  assert.deepStrictEqual(Object.keys(p).sort(), ['createdAt', 'level', 'name'], 'el perfil local tiene la forma de siempre (sin marcas de nube)');
  assert.strictEqual(p.level, 'medio'); assert.strictEqual(p.name, ''); assert.ok(p.createdAt >= before - 1000);
  assert.strictEqual(G.getUserLevel(), 'medio');
  G.recordSession({ skill:'gramatica', level:'medio', topics:[], results:[{ itemId:'g-medio-fut-gtevid-1', isCorrect:false }], startedAt: Date.now() });
  assert.strictEqual(G.loadProgress().sessions.length, 1, 'la práctica se guarda en el navegador');
  await G.settle();
  // cero tráfico: ni una consulta ni una escritura a profiles / progress_sessions
  assert.strictEqual(CLOUD.calls.length, 0, 'invitado: ninguna llamada a la nube (' + CLOUD.calls.join(', ') + ')');
  assert.strictEqual(touchedProfiles(), 0);
  assert.strictEqual(CLOUD.sessions.length, 0);
  assert.ok(!G.profile().lp, 'sin cuenta no hay nada "pendiente" de subir');
});

test('INVITADO que luego inicia sesión en una cuenta con nivel: la nube manda sobre lo que eligió de invitado', async () => {
  CLOUD.profile.level = 'avanzado'; CLOUD.profile.onboarded_at = iso(Date.now() - 9000);
  const G = makeBrowser({ loggedIn:false });
  G.setUserLevel('facil');                                                        // eligió Fácil como invitado
  G.store['sb-test-auth-token'] = '{}';                                           // ahora inicia sesión (la página recarga con sesión)
  const U = makeBrowser({ loggedIn:true });
  Object.keys(G.store).forEach(k => { if(k !== 'sb-test-auth-token') U.store[k] = G.store[k]; });
  await U.LeoBackend.getMemberProfile();
  assert.strictEqual(U.getUserLevel(), 'avanzado');
  assert.strictEqual(CLOUD.profile.level, 'avanzado', 'la elección de invitado no pisa la nube');
});

queue.then(() => console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : '')));
