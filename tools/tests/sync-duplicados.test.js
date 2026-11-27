#!/usr/bin/env node
/* Sesiones duplicadas al sincronizar (C23). Mismo navegador simulado que aislamiento-cuentas.test.js.
   Origen del arnés: aislamiento de datos entre cuentas (progreso local, perfil, cachés, sesiones a medias, sincronización y backfill).
   Corre con:  node tools/tests/aislamiento-cuentas.test.js   (desde la carpeta inglesconLeo)
   Usa app.js, backend.js y data.js REALES en un navegador simulado. Supabase es un doble en memoria con RLS simulada
   (cada cuenta solo ve y escribe sus filas). No toca la red ni la base real.
   Un "navegador" = un almacén compartido (localStorage). Cada "pestaña" = un contexto nuevo que carga los scripts. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
// El arbol de trabajo en Windows puede estar en CRLF y estas pruebas buscan saltos LF: se normaliza al leer texto.
const _readFileSync = fs.readFileSync; fs.readFileSync = function(){ const r = _readFileSync.apply(fs, arguments); return typeof r === 'string' ? r.replace(/\r\n/g, '\n') : r; };
const root = path.join(__dirname, '..', '..');
const SRC = {
  data: fs.readFileSync(path.join(root, 'data.js'), 'utf8'),
  temas: fs.readFileSync(path.join(root, 'temas.js'), 'utf8'),
  app: fs.readFileSync(path.join(root, 'app.js'), 'utf8'),
  backend: fs.readFileSync(process.env.BACKEND_JS || path.join(root, 'backend.js'), 'utf8')
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
const reorder = rs => rs.map(r => { const o = {}; Object.keys(r).reverse().forEach(k => { o[k] = r[k]; }); return o; });   // como jsonb: otro orden de claves
const rowOf = (s, uid, id) => ({ id, user_id: uid, skill: s.skill, level: s.level, topics: s.topics, date: s.date, started_at: s.startedAt, duration_ms: s.durationMs, results: reorder(s.results) });
console.log('Sesiones duplicadas al sincronizar');

await test('Sesión sin id de la nube + la misma en la nube con claves reordenadas: queda UNA, vinculada', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t = openTab(br);
  br.cloud.offline = true; practice(t, ITEM_A, false, Date.now() - 5000); await tick(); br.cloud.offline = false;   // la subida no confirmó su id
  const local = t.T.loadProgress().sessions; assert.strictEqual(local.length, 1); assert(!local[0].cloudId);
  br.cloud.progress_sessions.push(rowOf(local[0], A_ID, 'cloud-x1'));
  assert.strictEqual(await t.LB.syncProgressFromCloud(), 'ok');
  const after = t.T.loadProgress().sessions;
  assert.strictEqual(after.length, 1, 'no se duplica');
  assert.strictEqual(after[0].cloudId, 'cloud-x1', 'queda vinculada a la fila de la nube');
});

await test('Sesiones legítimas distintas (mismo tema, otro inicio) no se pierden', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t = openTab(br);
  br.cloud.offline = true; practice(t, ITEM_A, false, Date.now() - 9000); await tick(); br.cloud.offline = false;
  const s0 = t.T.loadProgress().sessions[0];
  br.cloud.progress_sessions.push(rowOf(s0, A_ID, 'cloud-y1'));
  const other = Object.assign({}, s0, { startedAt: s0.startedAt + 1000 });            // otra sesión, un segundo después
  br.cloud.progress_sessions.push(rowOf(other, A_ID, 'cloud-y2'));
  const third = Object.assign({}, s0, { durationMs: (s0.durationMs || 0) + 500 });   // mismo inicio pero otra duración
  br.cloud.progress_sessions.push(rowOf(third, A_ID, 'cloud-y3'));
  assert.strictEqual(await t.LB.syncProgressFromCloud(), 'ok');
  const ids = t.T.loadProgress().sessions.map(s => s.cloudId).sort();
  same(ids, ['cloud-y1', 'cloud-y2', 'cloud-y3'], 'las tres sesiones distintas están, sin repetir la local');
});

await test('Sincronizar dos veces no añade nada', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const t = openTab(br);
  br.cloud.offline = true; practice(t, ITEM_A, true, Date.now() - 7000); await tick(); br.cloud.offline = false;
  br.cloud.progress_sessions.push(rowOf(t.T.loadProgress().sessions[0], A_ID, 'cloud-z1'));
  await t.LB.syncProgressFromCloud(); await t.LB.syncProgressFromCloud();
  assert.strictEqual(t.T.loadProgress().sessions.length, 1);
});

await test('Entre cuentas: una sesión sin vincular de A nunca se vincula a una fila de B aunque coincidan inicio y duración', async () => {
  const br = newBrowser(); login(br, 'a@test');
  const ta = openTab(br);
  br.cloud.offline = true; practice(ta, ITEM_A, false, Date.now() - 6000); await tick(); br.cloud.offline = false;
  const sa = ta.T.loadProgress().sessions[0];
  await ta.LB.signOut(); await tick();
  login(br, 'b@test');
  br.cloud.progress_sessions.push(rowOf(sa, B_ID, 'cloud-b1'));     // B tiene una fila con la misma clave
  const tb = openTab(br);
  assert.strictEqual(await tb.LB.syncProgressFromCloud(), 'ok');
  same(tb.T.loadProgress().sessions.map(s => s.cloudId), ['cloud-b1'], 'B ve solo su fila');
  const aRaw = JSON.parse(br.data[scoped(A_ID, 'leo_progress_v2')]);
  assert.strictEqual(aRaw.sessions.length, 1); assert(!aRaw.sessions[0].cloudId, 'la sesión de A sigue sin vincular y en el espacio de A');
});

console.log(passed + ' ok' + (failed ? ', ' + failed + ' con fallas' : ''));
})();
