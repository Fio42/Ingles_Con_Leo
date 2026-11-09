#!/usr/bin/env node
/* Aislamiento de datos entre cuentas (progreso local, perfil, cachés, sesiones a medias, sincronización y backfill).
   Corre con:  node tools/tests/aislamiento-cuentas.test.js   (desde la carpeta inglesconLeo)
   Usa app.js, backend.js y data.js REALES en un navegador simulado. Supabase es un doble en memoria con RLS simulada
   (cada cuenta solo ve y escribe sus filas). No toca la red ni la base real.
   Un "navegador" = un almacén compartido (localStorage). Cada "pestaña" = un contexto nuevo que carga los scripts. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const SRC = {
  data: fs.readFileSync(path.join(root, 'data.js'), 'utf8'),
  temas: fs.readFileSync(path.join(root, 'temas.js'), 'utf8'),
  app: fs.readFileSync(path.join(root, 'app.js'), 'utf8'),
  backend: fs.readFileSync(path.join(root, 'backend.js'), 'utf8')
};
const A_ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', B_ID = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const USERS = { 'a@test': A_ID, 'b@test': B_ID };
const AUTH_KEY = 'sb-test-auth-token';
const noop = () => {};
const tick = async (n = 6) => { for(let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };

/* ---------- navegador: almacén compartido + nube simulada ---------- */
function newBrowser(){
  const data = {};
  const storage = {
    getItem: k => Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null,
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
    get length(){ return Object.keys(data).length; },
    key: i => Object.keys(data)[i] === undefined ? null : Object.keys(data)[i]
  };
  const cloud = { progress_sessions: [], mistake_stats: [], profiles: {}, offline: false, failNextSelect: false, writes: [] };
  return { data, storage, cloud, tabs: [] };
}
const uidOf = br => { try{ const t = JSON.parse(br.data[AUTH_KEY]); return t && t.user && t.user.id; }catch(e){ return null; } };

function fakeClient(br, tab){
  const listeners = [];
  tab.authListeners = listeners;
  const emit = ev => listeners.forEach(fn => { try{ fn(ev); }catch(e){} });
  tab.emit = emit;
  function from(table){
    const q = { table, op: 'select', filters: [], payload: null, lim: null, one: false };
    const run = async () => {
      if(br.cloud.offline) throw new Error('offline');
      const uid = uidOf(br);
      if(q.op === 'select'){
        if(br.cloud.failNextSelect){ br.cloud.failNextSelect = false; return { data: null, error: { message: 'network' } }; }
        let rows = table === 'profiles' ? Object.values(br.cloud.profiles) : br.cloud[table];
        rows = rows.filter(r => (table === 'profiles' ? r.id === uid : r.user_id === uid));     // RLS
        q.filters.forEach(f => { rows = rows.filter(r => f.kind === 'eq' ? r[f.col] === f.val : true); });
        if(q.one) return rows.length ? { data: rows[0], error: null } : { data: null, error: { message: 'no rows' } };
        return { data: rows.map(r => Object.assign({}, r)), error: null };
      }
      if(q.op === 'insert'){
        const row = Object.assign({ id: 'cloud-' + (br.cloud[table].length + 1) }, q.payload);
        if(row.user_id !== uid) return { data: null, error: { code: '42501', message: 'RLS' } };
        br.cloud.writes.push({ table, user: uid, row });
        br.cloud[table].push(row);
        return { data: null, error: null };
      }
      if(q.op === 'update'){
        if(table === 'profiles'){ const id = (q.filters.find(f => f.col === 'id') || {}).val; if(id === uid){ br.cloud.profiles[id] = Object.assign(br.cloud.profiles[id] || { id }, q.payload); br.cloud.writes.push({ table, user: uid, row: q.payload }); } }
        return { data: null, error: null };
      }
      return { data: null, error: null };
    };
    const api = {
      select(){ q.op = q.op === 'select' ? 'select' : q.op; return api; },
      insert(p){ q.op = 'insert'; q.payload = p; return api; },
      update(p){ q.op = 'update'; q.payload = p; return api; },
      eq(col, val){ q.filters.push({ kind: 'eq', col, val }); return api; },
      is(){ return api; }, in(){ return api; },
      order(){ return api; }, limit(){ return api; }, single(){ q.one = true; return api; },
      then(res, rej){ return run().then(res, rej); }
    };
    return api;
  }
  return {
    auth: {
      getSession: async () => { const uid = uidOf(br); return { data: { session: uid ? { user: { id: uid } } : null } }; },
      onAuthStateChange: fn => { listeners.push(fn); return { data: { subscription: { unsubscribe: noop } } }; },
      signInWithPassword: async ({ email }) => { const id = USERS[email]; if(!id) return { error: { message: 'bad' } };
        br.data[AUTH_KEY] = JSON.stringify({ access_token: 'x', user: { id, email } }); br.cloud.profiles[id] = br.cloud.profiles[id] || { id, is_member: true }; emit('SIGNED_IN'); return { error: null }; },
      signOut: async (opts) => { if(opts && opts.scope === 'others') return { error: null }; delete br.data[AUTH_KEY]; emit('SIGNED_OUT'); return { error: null }; }
    },
    from,
    rpc: async (name, args) => {
      if(br.cloud.offline) throw new Error('offline');
      const uid = uidOf(br); if(!uid) return { error: null };
      (args.p_items || []).forEach(it => {
        br.cloud.writes.push({ table: 'mistake_stats', user: uid, row: it });
        if(it.is_correct) return;
        if(!br.cloud.mistake_stats.some(r => r.user_id === uid && r.item_id === it.item_id)) br.cloud.mistake_stats.push({ user_id: uid, item_id: it.item_id, kind: it.kind, topic: it.topic, fail_count: 1, status: 'active', last_seen_at: new Date().toISOString() });
      });
      return { error: null };
    }
  };
}

/* Abre una "pestaña": ejecuta los scripts reales contra el almacén del navegador. */
function openTab(br, { withBackend = true, search = '', hash = '' } = {}){
  const tab = { reloads: 0, handlers: { storage: [], pageshow: [], visibilitychange: [] }, session: {} };
  const sessionStorage = { getItem: k => k in tab.session ? tab.session[k] : null, setItem: (k, v) => { tab.session[k] = String(v); }, removeItem: k => { delete tab.session[k]; } };
  const docEl = { style: {} };
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams, Event: function(){},
    localStorage: br.storage, sessionStorage,
    document: { addEventListener: (n, fn) => { (tab.handlers[n] = tab.handlers[n] || []).push(fn); }, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
      readyState: 'complete', body: { style: {}, appendChild: noop, classList: { add: noop, remove: noop, toggle: noop, contains: () => false } }, documentElement: docEl, createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, setAttribute: noop, addEventListener: noop, appendChild: noop }), visibilityState: 'visible' },
    location: { hash, search, pathname: '/', reload(){ tab.reloads++; } }, navigator: { userAgent: 'node' },
    addEventListener: (n, fn) => { (tab.handlers[n] = tab.handlers[n] || []).push(fn); }, dispatchEvent: noop,
    MutationObserver: function(){ return { observe: noop }; }, IntersectionObserver: function(){ return { observe: noop }; }, matchMedia: () => ({ matches: false, addEventListener: noop })
  };
  ctx.window = ctx; ctx.self = ctx;
  ctx.supabase = { createClient: () => fakeClient(br, tab) };
  vm.createContext(ctx);
  vm.runInContext(SRC.data, ctx); vm.runInContext(SRC.temas, ctx);
  vm.runInContext(SRC.app + `
;this.__T = { LeoScope, LS_P, loadProgress, saveProgressRaw, recordSession, getProfile, saveProfile, saveInflightSession, loadInflightSession, findResumableSession,
  LeoVault, computeMistakeIds, backfillMistakeStatsIfNeeded, loadMistakeStatsMap, microStatsAll, checkSeenSet, PROGRESS_KEY, MISTAKE_BACKFILL_KEY };`, ctx);
  if(withBackend) vm.runInContext(SRC.backend + '\n;this.__LB = LeoBackend;', ctx);
  tab.T = ctx.__T; tab.LB = ctx.__LB; tab.ctx = ctx; tab.docEl = docEl;
  tab.fire = (name, ev) => (tab.handlers[name] || []).forEach(fn => fn(ev || {}));
  br.tabs.push(tab);
  return tab;
}
const login = (br, email) => { br.data[AUTH_KEY] = JSON.stringify({ access_token: 'x', user: { id: USERS[email], email } }); br.cloud.profiles[USERS[email]] = br.cloud.profiles[USERS[email]] || { id: USERS[email], is_member: true }; };
const practice = (tab, itemId, ok, startedAt) => tab.T.recordSession({ skill: 'gramatica', level: 'facil', topics: ['Prueba'], startedAt: startedAt || Date.now() - 1000, results: [{ itemId, isCorrect: ok }] });
const idsOf = p => p.sessions.reduce((a, s) => a.concat(s.results.map(r => r.itemId)), []);
const ITEM_A = 'g-facil7-dodoes-1', ITEM_B = 'g-facil-this-1', ITEM_G = 'g-medio4-pass-1', ITEM_L = 'g-facil-m300-5';
const scoped = (id, base) => base + '@@u:' + id;

const same = (a, b, msg) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);   // los objetos de otro contexto (vm) no se comparan por referencia
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; process.exitCode = 1; console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); }
}

(async () => {
console.log('Espacio local por cuenta');
await test('A practica: su progreso queda en SU espacio y en la nube; nada en el espacio de invitado', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t = openTab(br);
  assert.strictEqual(t.T.LeoScope.scope(), 'u:' + A_ID);
  practice(t, ITEM_A, false); await tick();
  assert(br.data[scoped(A_ID, 'leo_progress_v2')], 'progreso en el espacio de A');
  assert.strictEqual(br.data['leo_progress_v2'], undefined, 'nada en el espacio sin dueño');
  same(br.cloud.progress_sessions.map(r => r.user_id), [A_ID]);
  same(br.cloud.mistake_stats.map(r => r.item_id), [ITEM_A]);
});

await test('A cierra sesión y entra B: B no ve, no usa ni sube nada de A', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const ta = openTab(br); practice(ta, ITEM_A, false); ta.T.saveProfile({ name: 'Alumno A', level: 'facil', createdAt: 1 }); await tick();
  await ta.LB.signOut(); await tick();
  assert.strictEqual(ta.reloads, 1, 'la pantalla de A se recarga al cerrar sesión');
  assert.strictEqual(ta.docEl.style.visibility, 'hidden', 'nada de A queda a la vista mientras se recarga');
  // B entra desde una página de invitado (login en la misma pestaña)
  const tb = openTab(br);
  assert.strictEqual(tb.T.LeoScope.scope(), 'g');
  const r = await tb.LB.signInWithPassword('b@test', 'x'); assert(r.ok);
  assert.strictEqual(tb.T.LeoScope.scope(), 'u:' + B_ID, 'la página pasa al espacio de B');
  same(tb.T.loadProgress().sessions, [], 'B empieza vacío');
  assert.strictEqual(tb.T.getProfile(), null, 'B no ve el perfil de A');
  assert.strictEqual(await tb.LB.syncProgressFromCloud(), 'ok');
  same(idsOf(tb.T.loadProgress()), [], 'la sincronización de B no trae ni mezcla a A');
  same(tb.T.computeMistakeIds(), []);
  assert.strictEqual(tb.T.loadInflightSession('gramatica', 'facil'), null);
});

await test('B practica y sincroniza sin incorporar datos de A; A vuelve y recupera su progreso', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const ta = openTab(br); practice(ta, ITEM_A, false, 1000); await tick();
  await ta.LB.signOut(); await tick();
  login(br, 'b@test');
  const tb = openTab(br); practice(tb, ITEM_B, false, 2000); await tick();
  assert.strictEqual(await tb.LB.syncProgressFromCloud(), 'ok');
  same(idsOf(tb.T.loadProgress()), [ITEM_B]);
  assert(br.cloud.writes.filter(w => w.user === B_ID).every(w => JSON.stringify(w.row).indexOf(ITEM_A) < 0), 'nada de A viaja con la sesión de B');
  same(br.cloud.mistake_stats.filter(r => r.user_id === B_ID).map(r => r.item_id), [ITEM_B]);
  await tb.LB.signOut(); await tick();
  // A regresa
  const r = await openTab(br).LB.signInWithPassword('a@test', 'x'); assert(r.ok);
  const ta2 = openTab(br);
  same(idsOf(ta2.T.loadProgress()), [ITEM_A], 'A conserva lo suyo, sin lo de B');
  await ta2.LB.syncProgressFromCloud();
  same(idsOf(ta2.T.loadProgress()), [ITEM_A], 'la sincronización de A tampoco trae a B');
  same(ta2.T.computeMistakeIds(), [ITEM_A]);
});

await test('Sin conexión: A queda con sesión pendiente; B entra; nada de A se sube con la sesión de B; A la conserva al volver', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const ta = openTab(br); br.cloud.offline = true;
  practice(ta, ITEM_A, false, 1000); await tick();
  assert.strictEqual(br.cloud.progress_sessions.length, 0, 'sin red no se subió');
  assert.strictEqual(ta.T.loadProgress().sessions.length, 1, 'quedó pendiente en el espacio de A');
  delete br.data[AUTH_KEY];                      // A sale (sin red no hay llamada a la nube)
  login(br, 'b@test');                           // B tenía su sesión guardada
  const tb = openTab(br);
  same(tb.T.loadProgress().sessions, []);
  assert.strictEqual(await tb.LB.syncProgressFromCloud(), 'fail');
  same(idsOf(tb.T.loadProgress()), []);
  br.cloud.offline = false;
  assert.strictEqual(await tb.LB.syncProgressFromCloud(), 'ok');
  practice(tb, ITEM_B, true, 3000); await tick();
  assert(br.cloud.writes.every(w => JSON.stringify(w.row).indexOf(ITEM_A) < 0), 'lo pendiente de A nunca se sube con la sesión de B');
  delete br.data[AUTH_KEY]; login(br, 'a@test');
  const ta2 = openTab(br);
  same(idsOf(ta2.T.loadProgress()), [ITEM_A], 'A recupera su sesión pendiente intacta');
  assert.strictEqual(ta2.T.loadProgress().sessions[0].cloudId, undefined, 'sigue pendiente: no se marcó como subida');
});

await test('Error de red durante la sincronización: no queda a medias ni se mezcla; se reintenta bien', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const ta = openTab(br); practice(ta, ITEM_A, false, 1000); await tick();
  const cloudRows = br.cloud.progress_sessions.length;
  const tb = openTab(br);                         // otra pestaña de A
  br.cloud.failNextSelect = true;
  assert.strictEqual(await tb.LB.syncProgressFromCloud(), 'fail');
  same(idsOf(tb.T.loadProgress()), [ITEM_A], 'lo local sigue igual');
  assert.strictEqual(await tb.LB.syncProgressFromCloud(), 'ok');
  assert.strictEqual(tb.T.loadProgress().sessions.length, 1, 'sin duplicados tras reintentar');
  assert.strictEqual(br.cloud.progress_sessions.length, cloudRows);
});

console.log('Datos antiguos e invitados');
await test('Datos locales antiguos sin dueño: ninguna cuenta los lee, usa ni sube; siguen intactos', async () => {
  const br = newBrowser();
  const legacy = JSON.stringify({ sessions: [{ skill: 'gramatica', level: 'facil', topics: ['viejo'], date: '2026-10-01', startedAt: 500, durationMs: 1, results: [{ itemId: ITEM_L, isCorrect: false }] }], lastActivity: null });
  br.data['leo_progress_v2'] = legacy; br.data['leo_profile'] = JSON.stringify({ name: 'Dueño desconocido', level: 'medio', createdAt: 1 });
  login(br, 'a@test');
  const ta = openTab(br);
  same(ta.T.loadProgress().sessions, [], 'A no hereda lo de dueño desconocido');
  assert.strictEqual(ta.T.getProfile(), null);
  await ta.LB.syncProgressFromCloud(); practice(ta, ITEM_A, false, 2000); await tick();
  await ta.T.backfillMistakeStatsIfNeeded(); await tick();
  assert(br.cloud.writes.every(w => JSON.stringify(w.row).indexOf(ITEM_L) < 0), 'lo antiguo no se sube a ninguna cuenta');
  assert.strictEqual(br.data['leo_progress_v2'], legacy, 'lo antiguo queda byte a byte igual');
  delete br.data[AUTH_KEY]; login(br, 'b@test');
  const tb = openTab(br);
  same(tb.T.loadProgress().sessions, []);
  await tb.T.backfillMistakeStatsIfNeeded(); await tick();
  same(br.cloud.mistake_stats.filter(r => r.user_id === B_ID), [], 'el backfill de B no incorpora errores antiguos ni de A');
  delete br.data[AUTH_KEY];
  const tg = openTab(br);                          // el invitado NO ve lo antiguo: está en la bóveda, recuperable con confirmación
  same(tg.T.loadProgress().sessions, []);
  assert.strictEqual(br.data['leo_progress_v2'], legacy, 'y la bóveda sigue intacta');
});

await test('Invitado: su progreso es aparte, no se sube, no pasa a ninguna cuenta ni se pierde', async () => {
  const br = newBrowser();
  const tg = openTab(br); assert.strictEqual(tg.T.LeoScope.scope(), 'g');
  practice(tg, ITEM_G, false, 1000); await tick();
  assert.strictEqual(br.cloud.progress_sessions.length, 0, 'un invitado no sube nada');
  assert(br.data['leo_progress_v2@@g'] && !br.data['leo_progress_v2']);
  login(br, 'a@test');
  const ta = openTab(br);
  same(ta.T.loadProgress().sessions, [], 'la cuenta no hereda al invitado');
  await ta.LB.syncProgressFromCloud(); await ta.T.backfillMistakeStatsIfNeeded(); await tick();
  assert(br.cloud.writes.every(w => JSON.stringify(w.row).indexOf(ITEM_G) < 0));
  delete br.data[AUTH_KEY];
  same(idsOf(openTab(br).T.loadProgress()), [ITEM_G], 'al cerrar sesión, el invitado conserva lo suyo');
});

console.log('Backfill de errores');
await test('Backfill: sube solo los errores de la cuenta dueña y solo cuando el espacio coincide con la sesión', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const ta = openTab(br, {});
  br.cloud.offline = true; practice(ta, ITEM_A, false, 1000); await tick(); br.cloud.offline = false;   // error local sin subir
  br.cloud.mistake_stats.length = 0; br.cloud.writes.length = 0;
  await ta.T.backfillMistakeStatsIfNeeded(); await tick();
  same(br.cloud.mistake_stats.map(r => r.user_id + ':' + r.item_id), [A_ID + ':' + ITEM_A]);
  assert(br.data[scoped(A_ID, 'leo_mistake_backfill_v1_done')], 'la marca de hecho es de A');
  delete br.data[AUTH_KEY]; login(br, 'b@test');
  const tb = openTab(br); await tb.T.backfillMistakeStatsIfNeeded(); await tick();
  same(br.cloud.mistake_stats.filter(r => r.user_id === B_ID), []);
  assert.strictEqual(br.data[scoped(B_ID, 'leo_mistake_backfill_v1_done')], undefined, 'B sin sesiones aún: no se da por hecho (se reintenta)');
});

await test('Página de invitado que queda abierta cuando otra pestaña inicia sesión: no sube datos a esa cuenta', async () => {
  const br = newBrowser();
  const tg = openTab(br);                          // pestaña de invitado
  br.data['leo_progress_v2@@g'] = JSON.stringify({ sessions: [{ skill: 'gramatica', level: 'facil', topics: [], date: '2026-10-01', startedAt: 5, durationMs: 1, results: [{ itemId: ITEM_L, isCorrect: false }] }], lastActivity: null });
  login(br, 'b@test');                             // otra pestaña inicia sesión
  await tg.T.backfillMistakeStatsIfNeeded(); practice(tg, ITEM_G, false, 9000); await tick();
  same(br.cloud.writes, [], 'nada del invitado viaja con la sesión de B');
  assert.strictEqual(await tg.LB.syncProgressFromCloud(), 'skip');
  same(idsOf(tg.T.loadProgress()).sort(), [ITEM_G, ITEM_L].sort(), 'el invitado conserva lo suyo en su espacio');
});

console.log('Pestañas, recarga y pantalla');
await test('Cerrar sesión en otra pestaña recarga la pestaña de esa cuenta (una sola vez) y la oculta', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t1 = openTab(br), t2 = openTab(br);
  t1.fire('storage', { key: 'otra-clave' }); assert.strictEqual(t1.reloads, 0);
  t1.fire('storage', { key: AUTH_KEY }); assert.strictEqual(t1.reloads, 0, 'misma cuenta: no recarga');
  delete br.data[AUTH_KEY];                        // t2 cierra sesión
  t1.fire('storage', { key: AUTH_KEY });
  assert.strictEqual(t1.reloads, 1); assert.strictEqual(t1.docEl.style.visibility, 'hidden');
  t1.fire('storage', { key: AUTH_KEY }); t1.fire('visibilitychange'); assert.strictEqual(t1.reloads, 1, 'sin recargas en bucle');
  assert(t2);
});
await test('Cambio de cuenta en otra pestaña, y volver con "atrás" (pageshow) desde la caché: se recarga', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t1 = openTab(br);
  login(br, 'b@test');
  t1.fire('pageshow', { persisted: false }); assert.strictEqual(t1.reloads, 0);
  t1.fire('pageshow', { persisted: true }); assert.strictEqual(t1.reloads, 1);
  // y una página nueva ya queda en el espacio de B
  assert.strictEqual(openTab(br).T.LeoScope.scope(), 'u:' + B_ID);
});
await test('Un invitado no se recarga cuando otra pestaña inicia sesión (no se interrumpe)', async () => {
  const br = newBrowser(); const tg = openTab(br); login(br, 'a@test');
  tg.fire('storage', { key: AUTH_KEY }); tg.fire('visibilitychange'); assert.strictEqual(tg.reloads, 0);
  assert.strictEqual(tg.T.LeoScope.scope(), 'g');
});
await test('Recarga de la misma cuenta: conserva todo (progreso, perfil, sesión a medias)', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t1 = openTab(br); practice(t1, ITEM_A, false, 1000); t1.T.saveProfile({ name: 'A', level: 'facil', createdAt: 1 });
  t1.T.saveInflightSession('gramatica', 'facil', { idx: 2, total: 6, startedAt: Date.now(), itemIds: ['x'] }); await tick();
  const t2 = openTab(br);
  same(idsOf(t2.T.loadProgress()), [ITEM_A]);
  assert.strictEqual(t2.T.getProfile().name, 'A');
  assert(t2.T.loadInflightSession('gramatica', 'facil'));
  assert(t2.T.findResumableSession(t2.T.LS_P, Date.now(), 'facil'), 'la sesión a medias de A se puede retomar');
});
await test('Sesión a medias: aislada por cuenta (B e invitado no la ven ni la retoman)', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t1 = openTab(br); t1.T.saveInflightSession('gramatica', 'facil', { idx: 2, total: 6, startedAt: Date.now(), itemIds: ['x'] });
  delete br.data[AUTH_KEY]; login(br, 'b@test');
  const tb = openTab(br);
  assert.strictEqual(tb.T.loadInflightSession('gramatica', 'facil'), null);
  assert.strictEqual(tb.T.findResumableSession(tb.T.LS_P, Date.now(), 'facil'), null);
  delete br.data[AUTH_KEY];
  const tg = openTab(br);
  assert.strictEqual(tg.T.findResumableSession(tg.T.LS_P, Date.now(), 'facil'), null);
});
await test('Volver de un enlace de acceso (OAuth): la página de invitado pasa a la cuenta; sin enlace de acceso, no', async () => {
  const br = newBrowser();
  const t1 = openTab(br, { search: '?oauth=google' }); t1.LB.getClient();
  login(br, 'a@test'); t1.emit('SIGNED_IN');
  assert.strictEqual(t1.T.LeoScope.scope(), 'u:' + A_ID);
  const br2 = newBrowser(); const t2 = openTab(br2); t2.LB.getClient(); login(br2, 'a@test'); t2.emit('SIGNED_IN');
  assert.strictEqual(t2.T.LeoScope.scope(), 'g', 'un SIGNED_IN de otra pestaña no mueve una página de invitado');
});
await test('Cierre de sesión: el evento SIGNED_OUT recarga la página de la cuenta y limpia la memoria', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t = openTab(br); t.LB.getClient();
  t.T.LeoScope.onRebind(() => { t.rebound = true; });
  delete br.data[AUTH_KEY]; t.emit('SIGNED_OUT');
  assert.strictEqual(t.reloads, 1); assert.strictEqual(t.docEl.style.visibility, 'hidden');
  t.T.LeoScope.rebind(); assert(t.rebound);
});

console.log('Cobertura del código');
await test('Ningún dato personal se lee ni escribe fuera del espacio de la cuenta (solo las claves sin aislar a propósito)', () => {
  const allowed = ['const lsGet', 'const lsSet', 'LEO_AI_BETA_KEY', 'LEO_AI_TEASER_DAY_KEY', 'localDailyCountKey()', "'leo_member_hint'", 'COMMENT_GUEST_NAME_KEY'];
  const lines = SRC.app.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /localStorage\.(getItem|setItem|removeItem)\(/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l));
  const inModule = ([n]) => n < SRC.app.split('\n').findIndex(l => /^const LS_P =/.test(l)) + 1;
  const bad = lines.filter(x => !inModule(x)).filter(([, l]) => !allowed.some(a => l.indexOf(a) >= 0));
  same(bad, [], 'accesos directos a localStorage con clave personal: ' + JSON.stringify(bad));
  ['clases.js', 'aprender.js'].forEach(f => { const s = fs.readFileSync(path.join(root, f), 'utf8'); assert(!/localStorage\.(get|set|remove)Item\((CLASE_PROGRESS_KEY|KEY)/.test(s), f + ' usa localStorage directo'); });
});
await test('Toda subida o bajada de datos de la nube verifica al dueño local (backend.js)', () => {
  const b = SRC.backend.replace(/\r\n/g, '\n');
  ['syncProgressFromCloud', 'pushSession', 'pushFreeSession', 'getMistakeStats', 'applyMistakeResults', 'saveProfileToCloud', 'getLatestSessionLevel', 'saveDisplayName', 'getMemberProfile'].forEach(fn => {
    const i = b.indexOf('async function ' + fn + '(');
    assert(i >= 0, fn);
    const body = b.slice(i, i + 1400);
    assert(/ownerOk\(/.test(body), fn + ' no verifica al dueño');
  });
});

console.log('Recuperación del progreso anterior (bóveda)');
const sess = (id, startedAt, extra) => Object.assign({ skill: 'gramatica', level: 'facil', topics: ['viejo'], date: '2026-10-01', startedAt, durationMs: 1, results: [{ itemId: id, isCorrect: false }] }, extra || {});
const putLegacy = (br, sessions, extra) => {
  br.data['leo_progress_v2'] = JSON.stringify({ sessions, lastActivity: null });
  if(extra) Object.keys(extra).forEach(k => { br.data[k] = extra[k]; });
};
const snapshotLegacy = br => JSON.stringify(Object.keys(br.data).filter(k => k.indexOf('@@') < 0 && k !== 'leo_vault_claims_v1' && k !== AUTH_KEY).sort().map(k => [k, br.data[k]]));
const limitKeys = br => JSON.stringify(Object.keys(br.data).filter(k => /DailyCount|leo_ai_trial|leo_rush_runs/.test(k)).sort().map(k => [k, br.data[k]]));

await test('Datos antiguos sin dueño demostrable: ni invitado ni cuenta los ven, ofrecen, reclaman ni suben; la primera cuenta en entrar no se los queda', async () => {
  const br = newBrowser();
  putLegacy(br, [sess(ITEM_L, 500), sess(ITEM_A, 600)], { leo_profile: JSON.stringify({ name: 'Otro', level: 'medio' }) });
  const before = snapshotLegacy(br);
  const tg = openTab(br);
  same(tg.T.loadProgress().sessions, []); assert.strictEqual(tg.T.getProfile(), null);
  assert.strictEqual(tg.T.LeoVault.offer, undefined, 'no existe ninguna invitación ni reclamo');
  assert.strictEqual(tg.T.LeoVault.recover, undefined);
  login(br, 'a@test');
  const ta = openTab(br);
  await ta.LB.syncProgressFromCloud(); await ta.T.backfillMistakeStatsIfNeeded(); await tick();
  same(ta.T.loadProgress().sessions, []); assert.strictEqual(ta.T.getProfile(), null);
  assert.strictEqual(br.cloud.writes.length, 0);
  assert.strictEqual(snapshotLegacy(br), before, 'la bóveda queda byte a byte igual');
  assert(!br.data['leo_vault_claims_v1'] || !JSON.parse(br.data['leo_vault_claims_v1']).owner, 'nadie queda como dueño');
  delete br.data[AUTH_KEY]; login(br, 'b@test');
  const tb = openTab(br); await tb.LB.syncProgressFromCloud(); await tick();
  same(tb.T.loadProgress().sessions, []);
  assert.strictEqual(snapshotLegacy(br), before);
});

await test('Miembro antiguo: recupera todo lo que ya existe en Supabase (con la bóveda presente), sin duplicar ni mezclar con otras cuentas', async () => {
  const br = newBrowser();
  const row = (id, uid, st, item) => ({ id, user_id: uid, skill: 'gramatica', level: 'facil', topics: ['viejo'], started_at: st, duration_ms: 1, results: [{ itemId: item, isCorrect: false }], created_at: new Date(st).toISOString() });
  br.cloud.progress_sessions.push(row('cloud-1', A_ID, 500, ITEM_L), row('cloud-2', A_ID, 600, ITEM_A), row('cloud-3', B_ID, 700, ITEM_B));
  putLegacy(br, [sess(ITEM_L, 500, { cloudId: 'cloud-1' }), sess(ITEM_A, 600, { cloudId: 'cloud-2' }), sess(ITEM_G, 800)]);   // la última nunca se subió: dueño desconocido
  login(br, 'a@test');
  const t = openTab(br);
  await t.LB.syncProgressFromCloud(); await tick();
  same(idsOf(t.T.loadProgress()).sort(), [ITEM_A, ITEM_L].sort(), 'todo lo de la nube de A, y solo eso');
  await t.LB.syncProgressFromCloud(); await tick();
  assert.strictEqual(t.T.loadProgress().sessions.length, 2, 'sincronizar otra vez no duplica');
  assert.strictEqual(br.cloud.writes.length, 0);
  assert(JSON.parse(br.data['leo_progress_v2']).sessions.length === 3, 'la bóveda conserva las 3');
});

await test('Cuenta gratis nueva e invitado nuevo: funcionan normal (practican, se guarda en su espacio, límites intactos)', async () => {
  const br = newBrowser();
  const lim = limitKeys(br);
  const tg = openTab(br); practice(tg, ITEM_G, true, 1000); await tick();
  same(idsOf(tg.T.loadProgress()), [ITEM_G]); assert(br.data['leo_progress_v2@@g']);
  login(br, 'a@test'); const ta = openTab(br);
  await ta.LB.syncProgressFromCloud(); practice(ta, ITEM_A, false, 2000); await tick();
  same(idsOf(ta.T.loadProgress()), [ITEM_A]);
  assert.strictEqual(limitKeys(br), lim, 'no se tocan los contadores de límites');
});

await test('Sesiones gratis pendientes: solo pasan a la cuenta las que traen su propio id; nunca las de otra persona', async () => {
  const br = newBrowser();
  const mk = (uid, st) => ({ uid, skill: 'gramatica', level: 'facil', topics: [], startedAt: st, endedAt: st + 5, results: [{ itemId: ITEM_L, isCorrect: true }], open: false, tries: 0 });
  br.data['leo_free_pending_v1'] = JSON.stringify([mk(A_ID, 10), mk(B_ID, 20)]);
  login(br, 'a@test'); const ta = openTab(br);
  const pa = JSON.parse(br.data[scoped(A_ID, 'leo_free_pending_v1')]);
  assert.strictEqual(pa.length, 1); assert.strictEqual(pa[0].uid, A_ID);
  delete br.data[AUTH_KEY];
  const tg = openTab(br); assert.strictEqual(br.data['leo_free_pending_v1@@g'], undefined);
  login(br, 'b@test'); openTab(br);
  const pb = JSON.parse(br.data[scoped(B_ID, 'leo_free_pending_v1')]);
  assert.strictEqual(pb.length, 1); assert.strictEqual(pb[0].uid, B_ID);
  assert(JSON.parse(br.data['leo_free_pending_v1']).length === 2, 'la bóveda conserva ambas');
});

console.log('Cierre de sesión y operaciones en curso');
await test('Cerrar sesión desde una página que nunca creó el cliente: las demás páginas de la cuenta se recargan igual', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t = openTab(br);                           // no llama a getClient()
  delete br.data[AUTH_KEY];
  t.fire('storage', { key: AUTH_KEY });
  assert.strictEqual(t.reloads, 1); assert.strictEqual(t.docEl.style.visibility, 'hidden');
  const br2 = newBrowser(); login(br2, 'a@test');
  const t2 = openTab(br2);
  await t2.LB.signOut(); await tick();
  assert(t2.reloads >= 1, 'signOut mismo recarga la página aunque el evento no llegue');
});
await test('Sincronización en curso mientras se cambia de cuenta: lo que termina cae en el espacio de A y nada llega a B', async () => {
  const br = newBrowser(); login(br, 'a@test');
  br.cloud.progress_sessions.push({ id: 'cloud-1', user_id: A_ID, skill: 'gramatica', level: 'facil', topics: [], started_at: 700, results: [{ itemId: ITEM_A, isCorrect: false }], created_at: new Date(700).toISOString() });
  const ta = openTab(br);
  const p = ta.LB.syncProgressFromCloud();         // empieza con A...
  delete br.data[AUTH_KEY]; login(br, 'b@test');    // ...y otra pestaña entra con B antes de que termine
  await p; await tick();
  assert(!Object.keys(br.data).some(k => /@@u:bbbbbbbb/.test(k)), 'nada se escribe en el espacio de B');
  assert.strictEqual(br.cloud.writes.length, 0);
  const tb = openTab(br);
  same(tb.T.loadProgress().sessions, [], 'B no ve nada de A');
});

console.log('Academia y TOEIC');
await test('Academia y TOEIC: avance, examen, membresía y borradores van en el espacio de la cuenta', () => {
  const ac = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
  assert(/var KEY = \(PRIMARY \? 'leo_academia_piloto_v1' : 'leo_academia_v1_' \+ courseId\) \+ AC_SFX;/.test(ac));
  assert(/MEMBER_KEY = 'leo_academia_member_v1' \+ AC_SFX/.test(ac));
  assert(/DRAFT_KEY = \(PRIMARY[^;]*\) \+ AC_SFX;/.test(ac));
  assert(/getSession: acSession/.test(ac), 'la sesión solo se acepta si es la dueña del espacio local');
  const to = fs.readFileSync(path.join(root, 'toeic.js'), 'utf8');
  assert(!/localStorage\.(get|set|remove)Item\(toeicDraftKey/.test(to) && /LS_P\.getItem\(toeicDraftKey/.test(to));
});
await test('Academia: el espacio local lo decide la sesión guardada (cuenta / invitado / ilegible)', () => {
  const ac = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
  const m = ac.match(/function acReadSfx\(\)\{[\s\S]*?\n  \}\n/);
  assert(m);
  const mk = tok => { const st = {}; if(tok !== undefined) st['sb-x-auth-token'] = tok; const ls = { get length(){ return Object.keys(st).length; }, key: i => Object.keys(st)[i], getItem: k => st[k] }; return new Function('localStorage', 'AC_AUTH', m[0] + '; return acReadSfx();')(ls, /^sb-.*-auth-token$/); };
  assert.strictEqual(mk(undefined), '@@g');
  assert.strictEqual(mk(JSON.stringify({ user: { id: 'u-1' } })), '@@u:u-1');
  assert.strictEqual(mk('{roto'), '@@u:?');
});

console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' con fallas' : ''));
})();
