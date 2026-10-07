/* Simulador compartido del QA E2E (sin dependencias).
   - createCloud(): la "nube" de UNA cuenta (profiles + progress_sessions + llamadas a mistake_stats), con los mismos
     permisos de columna que Supabase.
   - makeDevice(cloud, opts): un navegador independiente (su propio localStorage) que ejecuta el data.js, temas.js, app.js
     y backend.js REALES. Dos dispositivos con la misma nube = dos navegadores con la misma cuenta.
   Nada de esto toca la red ni Supabase. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = process.env.E2E_ROOT || path.join(__dirname, '..', '..', '..');
const noop = () => {};
const WRITABLE = ['level', 'onboarded_at', 'display_name', 'last_seen_at', 'last_practice_at'];

function createCloud(){
  return { profile: { id:'qa', is_member:true, level:'medio', onboarded_at:new Date(Date.now() - 86400000).toISOString(), display_name:'QA' },
    sessions: [], mistakeCalls: [], profileCalls: 0, down: false, updates: [] };
}

function fakeClient(cloud, loggedIn){
  const SESSION = loggedIn ? { user:{ id: cloud.profile.id }, access_token:'t' } : null;
  function builder(table){
    const st = { table, op:'select', payload:null, eq:{}, isNull:[], inn:{}, single:false, order:null, lim:null };
    const b = {
      select(){ return b; }, eq(k, v){ st.eq[k] = v; return b; }, is(k){ st.isNull.push(k); return b; }, in(k, v){ st.inn[k] = v; return b; },
      order(k, o){ st.order = { k, asc: !o || o.ascending !== false }; return b; }, limit(n){ st.lim = n; return b; },
      single(){ st.single = true; return b; }, update(p){ st.op = 'update'; st.payload = p; return b; }, insert(p){ st.op = 'insert'; st.payload = p; return b; },
      upsert(p){ st.op = 'insert'; st.payload = p; return b; }, then(res, rej){ return run().then(res, rej); }
    };
    async function run(){
      if(table === 'profiles') cloud.profileCalls++;
      if(cloud.down) return { data:null, error:{ message:'network' } };
      if(table === 'profiles'){
        if(st.op === 'select') return { data: st.single ? Object.assign({}, cloud.profile) : [Object.assign({}, cloud.profile)], error:null };
        const bad = Object.keys(st.payload).filter(k => WRITABLE.indexOf(k) === -1);
        if(bad.length) return { data:null, error:{ message:'permission denied ' + bad[0] } };
        if(st.isNull.some(k => cloud.profile[k] !== null)) return { data:null, error:null };
        cloud.updates.push(Object.keys(st.payload).sort().join(','));
        Object.assign(cloud.profile, st.payload);
        return { data:null, error:null };
      }
      if(table === 'progress_sessions'){
        if(st.op === 'insert'){ cloud.sessions.push(Object.assign({ id: cloud.sessions.length + 1 }, JSON.parse(JSON.stringify(st.payload)))); return { data:null, error:null }; }
        let rows = cloud.sessions.slice();
        if(st.inn.skill) rows = rows.filter(r => st.inn.skill.indexOf(r.skill) !== -1);
        if(st.inn.level) rows = rows.filter(r => st.inn.level.indexOf(r.level) !== -1);
        if(st.order) rows.sort((a, c) => (st.order.asc ? 1 : -1) * ((a.started_at || 0) - (c.started_at || 0)));
        if(st.lim) rows = rows.slice(0, st.lim);
        return { data: JSON.parse(JSON.stringify(rows)), error:null };
      }
      return { data: st.single ? null : [], error:null };
    }
    return b;
  }
  return { auth:{ getSession: async () => ({ data:{ session: SESSION } }), onAuthStateChange: () => ({ data:{ subscription:{ unsubscribe: noop } } }), signOut: async () => ({}) },
    from: builder,
    rpc: async (name, args) => { if(cloud.down) return { data:null, error:{ message:'network' } }; if(name === 'apply_mistake_results') cloud.mistakeCalls.push(JSON.parse(JSON.stringify(args.p_items || []))); return { data:null, error:null }; },
    functions:{ invoke: async () => ({ data:null, error:null }) } };
}

const EXPORTS = ['recordSession', 'loadProgress', 'noteGrammarAnswer', 'markGrammarRetry', 'microStatsAll', 'microFlowState', 'microDiagActions', 'microCheckStart',
  'checkSeenSet', 'isCheckItem', 'getMistakesItemIndex', 'computePlanSelection', 'buildPlanPool', 'resolveMemberPool', 'memberBankItems', 'MICRO_BY_ID', 'MICROS',
  'GRAMMAR_BANK', 'GRAMMAR_CHECK_BANK', 'MICRO_FLOW', 'microIsActive', 'microHasItemsAt', 'setUserLevel', 'getUserLevel', 'ensureDerived', 'SESSION_LENGTHS',
  'SESSION_LENGTH_KEY', 'PROGRESS_KEY', 'applyMicroResults', 'pickCheckItems', 'markChecksConsumed', 'DERIVED_VERSION', 'DERIVED_META_KEY', 'checkAvailable', 'microCheckReady', 'MICRO_STATS_KEY', 'CHECK_SEEN_KEY', 'microWeakness', 'microPracticeHref', 'initOnboarding', 'TEMAS', 'TEMA_BY_ID'];

function makeDevice(cloud, opts){
  opts = opts || {};
  const store = {}, shown = [];
  const el = () => { let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
    querySelector: noop, querySelectorAll: () => [], remove: noop, dataset:{}, set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; } }; };
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams, Event: function(n){ this.type = n; },
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; }, key:i=>Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', documentElement: el(),
      body:{ appendChild: o => shown.push(o), style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, addEventListener:noop }, createElement: el },
    location:{ hash:'', search: opts.search || '', pathname:'/', href:'' }, navigator:{ userAgent:'node' }, addEventListener:noop, dispatchEvent: noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; }, matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  if(opts.loggedIn !== false) store['sb-qa-auth-token'] = '{}';
  ctx.supabase = { createClient: () => fakeClient(cloud, opts.loggedIn !== false) };
  vm.createContext(ctx);
  ['data.js', 'temas.js', 'app.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
  vm.runInContext(fs.readFileSync(path.join(root, 'backend.js'), 'utf8') + '\n;this.__LeoBackend = LeoBackend;', ctx);
  ctx.LeoBackend = ctx.__LeoBackend;
  vm.runInContext(';this.__t = {};\n' + JSON.stringify(EXPORTS) + '.forEach(n => { try{ this.__t[n] = eval(n); }catch(e){} });', ctx);
  const t = ctx.__t;
  Object.assign(t, { ctx, store, shown, cloud, LeoBackend: ctx.LeoBackend });
  t.settle = () => new Promise(r => setTimeout(r, 25));
  t.stats = micro => { const s = JSON.parse(store[t.MICRO_STATS_KEY] || '{}'); return micro ? s[micro] : s; };
  return t;
}

module.exports = { root, createCloud, makeDevice };
