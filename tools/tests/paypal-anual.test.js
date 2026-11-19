#!/usr/bin/env node
/* Pruebas de PayPal ANUAL ($20 USD cada 12 meses) y de que el MENSUAL ($2 USD) sigue igual (2026-11-19).
   TODO simulado: base de datos en memoria y PayPal falso. NO hace cobros ni manda correos reales.
   Corre con:  node tools/tests/paypal-anual.test.js   (desde la carpeta inglesconLeo)
   Variables opcionales para comparar contra la version ANTERIOR (copias en otra carpeta):
     OLD_CHECKOUT=ruta/paypal-checkout.ts  OLD_WEBHOOK=ruta/paypal-webhook.ts   (prueba diferencial mensual viejo vs nuevo) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert'), nodeCrypto = require('crypto');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const NEW_OVERRIDE = { 'paypal-checkout.ts': process.env.NEW_CHECKOUT, 'paypal-webhook.ts': process.env.NEW_WEBHOOK }; // solo para pruebas de mutacion
const srcOf = (file, override) => fs.readFileSync(override || NEW_OVERRIDE[file] || path.join(root, 'supabase_functions', file), 'utf8');
const compile = src => ts.transpileModule(src.replace(/^import .*createClient.*$/m, ''), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
let ok = 0, bad = 0;
async function t(name, fn){ try{ await fn(); ok++; console.log('  ok   ' + name); }catch(e){ bad++; console.log('  FAIL ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); } }
const J = (o, s) => ({ ok: (s || 200) < 300, status: s || 200, json: async () => o, text: async () => JSON.stringify(o) });
const tick = () => new Promise(r => setTimeout(r, 15));

/* ================= CHECKOUT ================= */
function checkout({ env, profile, profileError, ppSubs, ppDown, file } = {}){
  const calls = [], served = [];
  const sb = {
    auth: { getUser: async tok => tok === 'tok' ? { data: { user: { id: 'u1', email: 'a@x.com' } }, error: null } : { data: null, error: { message: 'bad' } } },
    from(){ const c = { select(){ return c; }, eq(){ return c; }, or(){ return c; }, update(){ return c; },
      maybeSingle: async () => profileError ? { data: null, error: { message: 'db' } } : { data: profile === undefined ? null : profile, error: null },
      then(a, b){ return Promise.resolve({ data: null, error: null }).then(a, b); } }; return c; },
  };
  const E = Object.assign({ SUPABASE_SERVICE_ROLE_KEY: 'srk', PAYPAL_MODE: 'sandbox', PAYPAL_PLAN_ID: 'P-MONTHLY', PAYPAL_CLIENT_ID: 'c', PAYPAL_CLIENT_SECRET: 's' }, env || {});
  const ctx = {
    exports: {}, console: { log(){}, error(){}, warn(){} }, URLSearchParams, TextEncoder, Request, Response, URL, JSON, Promise, Set, Map, Math, Number, String, Array, Object, Date, AbortSignal, encodeURIComponent, btoa, setTimeout, clearTimeout,
    createClient: () => sb, Deno: { env: { get: k => (k === 'PAYPAL_PLAN_ID_ANNUAL' || k === 'PAYPAL_ANNUAL_CHECKOUT') ? E[k] : (E[k] === undefined ? 'x' : E[k]) }, serve: fn => served.push(fn) },
    fetch: async (url, init) => {
      url = String(url); calls.push({ url, body: init && init.body });
      if(url.includes('oauth2/token')) return ppDown ? J({}, 500) : J({ access_token: 'pp' });
      const g = /\/v1\/billing\/subscriptions\/(.+)$/.exec(url);
      if(g && !(init && init.method === 'POST')){ if(ppSubs === 'error') return J({}, 500); if(ppSubs === 'throw') throw new Error('red'); const s = ppSubs && ppSubs[decodeURIComponent(g[1])]; return s ? J(s) : J({}, 404); }
      if(url.endsWith('/v1/billing/subscriptions')) return J({ links: [{ rel: 'approve', href: 'https://paypal/approve' }] });
      if(url.includes('api.stripe.com')) return J({ data: [] });
      return J({}, 404);
    },
  };
  vm.createContext(ctx); vm.runInContext(compile(srcOf('paypal-checkout.ts', file)), ctx);
  const call = async (body, raw) => { const r = await served[0](new Request('https://x/f', { method: 'POST', headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' }, body: raw !== undefined ? raw : (body === undefined ? undefined : JSON.stringify(body)) })); return { status: r.status, body: await r.json() }; };
  const created = () => calls.filter(c => c.url.endsWith('/v1/billing/subscriptions') && c.body).map(c => JSON.parse(c.body));
  return { call, calls, created };
}
const ANNUAL_ON = { PAYPAL_PLAN_ID_ANNUAL: 'P-ANNUAL', PAYPAL_ANNUAL_CHECKOUT: 'on' };

(async () => {
  console.log('Checkout: el MENSUAL no cambia');
  for(const [label, body, raw] of [['sin cuerpo', undefined], ['cuerpo vacio {}', {}], ['cuerpo no JSON', undefined, 'basura'], ['plan: monthly (como manda hoy el sitio)', { plan: 'monthly', track: false }], ['plan desconocido', { plan: 'weekly' }], ['plan: ANNUAL en mayusculas', { plan: 'ANNUAL' }]]){
    await t(`mensual (${label}) usa el plan mensual y devuelve el enlace`, async () => {
      const h = checkout({ env: ANNUAL_ON }); const r = await h.call(body, raw);
      assert.strictEqual(r.status, 200); assert.strictEqual(r.body.init_point, 'https://paypal/approve');
      assert.strictEqual(h.created().length, 1); assert.strictEqual(h.created()[0].plan_id, 'P-MONTHLY'); assert.strictEqual(h.created()[0].custom_id, 'u1');
    });
  }
  await t('mensual sin NINGUNA variable anual configurada: funciona igual', async () => {
    const h = checkout(); const r = await h.call({}); assert.strictEqual(r.status, 200); assert.strictEqual(h.created()[0].plan_id, 'P-MONTHLY');
  });
  await t('mensual: un miembro que contrata mensual NO es bloqueado (regla actual sin cambios)', async () => {
    const h = checkout({ env: ANNUAL_ON, profile: { is_member: true, paypal_subscription_id: 'I-X' } }); const r = await h.call({});
    assert.strictEqual(r.status, 200); assert.strictEqual(h.created()[0].plan_id, 'P-MONTHLY');
  });
  await t('mensual: el cuerpo no puede inyectar un plan_id (se ignora)', async () => {
    const h = checkout({ env: ANNUAL_ON }); await h.call({ plan_id: 'P-ANNUAL', plan: 'monthly' }); assert.strictEqual(h.created()[0].plan_id, 'P-MONTHLY');
  });

  console.log('Checkout: configuracion anual ausente o apagada');
  await t('anual sin PAYPAL_PLAN_ID_ANNUAL -> 400 annual_not_configured, no se crea nada', async () => {
    const h = checkout({ env: { PAYPAL_ANNUAL_CHECKOUT: 'on' } }); const r = await h.call({ plan: 'annual' });
    assert.strictEqual(r.status, 400); assert.strictEqual(r.body.error, 'annual_not_configured'); assert.strictEqual(h.created().length, 0);
  });
  await t('anual con plan pero interruptor apagado/ausente/otro valor -> 400, no se crea nada', async () => {
    for(const v of [undefined, 'off', '', 'true', '1']){
      const h = checkout({ env: { PAYPAL_PLAN_ID_ANNUAL: 'P-ANNUAL', PAYPAL_ANNUAL_CHECKOUT: v } }); const r = await h.call({ plan: 'annual' });
      assert.strictEqual(r.status, 400, 'valor ' + v); assert.strictEqual(h.created().length, 0);
    }
  });
  await t('...y con el anual apagado el mensual del mismo despliegue sigue funcionando', async () => {
    const h = checkout({ env: { PAYPAL_PLAN_ID_ANNUAL: 'P-ANNUAL' } }); assert.strictEqual((await h.call({ plan: 'annual' })).status, 400);
    const r = await h.call({}); assert.strictEqual(r.status, 200); assert.strictEqual(h.created()[0].plan_id, 'P-MONTHLY');
  });
  await t('anual con ID de plan solo de espacios cuenta como ausente', async () => {
    const h = checkout({ env: { PAYPAL_PLAN_ID_ANNUAL: '   ', PAYPAL_ANNUAL_CHECKOUT: 'on' } }); assert.strictEqual((await h.call({ plan: 'annual' })).status, 400);
  });

  console.log('Checkout: alta anual y proteccion contra segundo cobro');
  await t('anual, cuenta nueva: crea la suscripcion con el plan ANUAL elegido por el servidor', async () => {
    const h = checkout({ env: ANNUAL_ON, profile: { is_member: false, paypal_subscription_id: null } }); const r = await h.call({ plan: 'annual' });
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.init_point, 'https://paypal/approve');
    assert.strictEqual(h.created().length, 1); assert.strictEqual(h.created()[0].plan_id, 'P-ANNUAL'); assert.strictEqual(h.created()[0].custom_id, 'u1');
  });
  await t('anual sin fila de perfil todavia: permitido', async () => {
    const h = checkout({ env: ANNUAL_ON, profile: null }); assert.strictEqual((await h.call({ plan: 'annual' })).status, 200);
  });
  await t('anual, miembro activo (cualquier proveedor) -> 409 already_member y NO crea suscripcion', async () => {
    const h = checkout({ env: ANNUAL_ON, profile: { is_member: true } }); const r = await h.call({ plan: 'annual' });
    assert.strictEqual(r.status, 409); assert.strictEqual(r.body.error, 'already_member'); assert.strictEqual(h.created().length, 0);
  });
  for(const st of ['ACTIVE', 'SUSPENDED']) await t(`anual, no miembro pero con suscripcion PayPal ${st} -> 409 y NO crea otra`, async () => {
    const h = checkout({ env: ANNUAL_ON, profile: { is_member: false, paypal_subscription_id: 'I-OLD' }, ppSubs: { 'I-OLD': { id: 'I-OLD', status: st } } });
    const r = await h.call({ plan: 'annual' }); assert.strictEqual(r.status, 409); assert.strictEqual(h.created().length, 0);
  });
  for(const st of ['CANCELLED', 'EXPIRED']) await t(`anual con suscripcion PayPal anterior ${st} -> permitido`, async () => {
    const h = checkout({ env: ANNUAL_ON, profile: { is_member: false, paypal_subscription_id: 'I-OLD' }, ppSubs: { 'I-OLD': { id: 'I-OLD', status: st } } });
    assert.strictEqual((await h.call({ plan: 'annual' })).status, 200); assert.strictEqual(h.created()[0].plan_id, 'P-ANNUAL');
  });
  await t('anual: PayPal no encuentra la suscripcion anterior (404) -> permitido', async () => {
    const h = checkout({ env: ANNUAL_ON, profile: { is_member: false, paypal_subscription_id: 'I-GONE' }, ppSubs: {} }); assert.strictEqual((await h.call({ plan: 'annual' })).status, 200);
  });
  for(const [label, o] of [['PayPal responde 500 al revisar', { ppSubs: 'error' }], ['PayPal se cae al revisar', { ppSubs: 'throw' }]]) await t(`anual, ${label} -> 503 member_check_unavailable, NO crea (falla cerrado)`, async () => {
    const h = checkout(Object.assign({ env: ANNUAL_ON, profile: { is_member: false, paypal_subscription_id: 'I-OLD' } }, o)); const r = await h.call({ plan: 'annual' });
    assert.strictEqual(r.status, 503); assert.strictEqual(r.body.error, 'member_check_unavailable'); assert.strictEqual(h.created().length, 0);
  });
  await t('anual, no se puede leer el perfil -> 503 y NO crea', async () => {
    const h = checkout({ env: ANNUAL_ON, profileError: true }); const r = await h.call({ plan: 'annual' }); assert.strictEqual(r.status, 503); assert.strictEqual(h.created().length, 0);
  });
  await t('anual sin SUPABASE_SERVICE_ROLE_KEY -> 503 y NO crea', async () => {
    const h = checkout({ env: Object.assign({ SUPABASE_SERVICE_ROLE_KEY: '' }, ANNUAL_ON) }); const r = await h.call({ plan: 'annual' }); assert.strictEqual(r.status, 503); assert.strictEqual(h.created().length, 0);
  });
  await t('anual, PayPal sin token -> 500 paypal_auth_error, no crea', async () => {
    const h = checkout({ env: ANNUAL_ON, ppDown: true }); assert.strictEqual((await h.call({ plan: 'annual' })).status, 500); assert.strictEqual(h.created().length, 0);
  });

  /* ================= WEBHOOK ================= */
  console.log('Webhook: plan anual');
  const { newDb, newNet, loadFunctionFrom } = (() => {
    function newDb(){ const db = { rows: [] };
      db.client = { from(){ return new Q(db); }, rpc: () => Promise.resolve({ data: null, error: null }) }; return db; }
    function Q(db){ this.db = db; this.f = []; this.cols = []; this.mode = 'select'; this.wantRows = false; }
    Q.prototype = {
      select(c){ if(this.mode === 'select') this.cols = String(c || '').split(',').map(s => s.trim()).filter(Boolean); else this.wantRows = true; return this; },
      update(p){ this.mode = 'update'; this.payload = p; return this; }, upsert(p){ this.mode = 'upsert'; this.payload = p; return this; },
      eq(c, v){ this.f.push(r => r[c] === v); return this; }, is(c, v){ this.f.push(r => v === null ? r[c] == null : r[c] === v); return this; },
      not(c, op, v){ this.f.push(r => (op === 'is' && v === null) ? r[c] != null : true); return this; },
      gte(c, v){ this.f.push(r => r[c] != null && r[c] >= v); return this; }, limit(){ return this; },
      or(s){ const cs = s.split(',').map(c => { const m = /^(\w+)\.(is|lt|lte|gt|gte)\.(.*)$/.exec(c); return r => { const v = r[m[1]]; if(m[2] === 'is') return m[3] === 'null' ? v == null : false; if(v == null) return false; const a = new Date(v), b = new Date(m[3]); if(m[2] === 'lt') return a < b; if(m[2] === 'lte') return a <= b; if(m[2] === 'gt') return a > b; return a >= b; }; }); this.f.push(r => cs.some(x => x(r))); return this; },
      maybeSingle(){ this.single = true; return this.exec(); }, then(a, b){ return this.exec().then(a, b); },
      async exec(){
        const db = this.db;
        if(db.noAccessCols && this.mode === 'update' && 'paypal_access_until' in this.payload) return { data: null, error: { code: '42703', message: 'column paypal_access_until does not exist' } };
        if(db.failUpdate && this.mode === 'update' && this.payload.is_member === true) return { data: null, error: { code: 'XX000', message: 'boom' } };
        const match = db.rows.filter(r => this.f.every(x => x(r)));
        if(this.mode === 'update'){ match.forEach(r => Object.assign(r, this.payload)); return { data: this.wantRows ? match.map(r => ({ id: r.id })) : null, error: null }; }
        if(this.mode === 'upsert'){ const ex = db.rows.find(r => r.id === this.payload.id); if(ex) Object.assign(ex, this.payload); else db.rows.push(Object.assign({}, this.payload)); return { data: null, error: null }; }
        const out = match.map(r => { const o = {}; (this.cols.length ? this.cols : Object.keys(r)).forEach(c => { o[c] = r[c]; }); o.id = r.id; return o; });
        return this.single ? { data: out[0] || null, error: null } : { data: out, error: null };
      } };
    function newNet(cfg){
      const net = Object.assign({ paypalSubs: {}, paypalDown: false, calls: [] }, cfg || {});
      net.emails = () => net.calls.filter(c => c.url.includes('api.resend.com')).map(c => JSON.parse(c.body));
      net.meta = () => net.calls.filter(c => c.url.includes('graph.facebook.com')).map(c => JSON.parse(c.body));
      net.fetch = async (url, init) => { url = String(url); init = init || {}; net.calls.push({ url, body: init.body || '' });
        if(url.includes('api.resend.com')) return J({ id: 'e1' });
        if(url.includes('/v1/oauth2/token')) return net.paypalDown ? J({}, 500) : J({ access_token: 'tok' });
        if(url.includes('verify-webhook-signature')) return J({ verification_status: net.badSig ? 'FAILURE' : 'SUCCESS' });
        const sub = /\/v1\/billing\/subscriptions\/(.+)$/.exec(url);
        if(sub){ if(net.paypalDown) return J({}, 500); const s = net.paypalSubs[sub[1]]; return s ? J(typeof s === 'function' ? s() : s) : J({}, 404); }
        if(url.includes('graph.facebook.com')) return J({});
        return J({}, 404); };
      return net; }
    function loadFunctionFrom(src, db, net, env){
      let handler = null;
      const sandbox = { Deno: { env: { get: k => (env || {})[k] }, serve: fn => { handler = fn; } }, createClient: () => db.client, fetch: net.fetch, Response, Request, URL, crypto: nodeCrypto.webcrypto, TextEncoder, btoa,
        AbortSignal, console: { log(){}, error(){} }, setTimeout, clearTimeout, Promise, JSON, Date, Math, Set, Map, Object, Array, String, Number, Error, parseFloat, parseInt, encodeURIComponent, Uint8Array };
      sandbox.globalThis = sandbox; sandbox.exports = {}; vm.createContext(sandbox); vm.runInContext(compile(src), sandbox); return handler; }
    return { newDb, newNet, loadFunctionFrom };
  })();

  const ENV = { PAYPAL_CLIENT_ID: 'c', PAYPAL_CLIENT_SECRET: 's', PAYPAL_WEBHOOK_ID: 'w', PAYPAL_MODE: 'sandbox', SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'k', RESEND_API_KEY: 'r', PAYPAL_PLAN_ID: 'P-MONTHLY', META_CAPI_ACCESS_TOKEN: 'meta' };
  const ANN = { id: 'I-ANN', status: 'ACTIVE', plan_id: 'P-ANNUAL', custom_id: 'u1', subscriber: { email_address: 'ana@mail.com' }, billing_info: { next_billing_time: '2027-11-19T10:00:00Z', last_payment: { amount: { value: '20.00', currency_code: 'USD' }, time: '2026-11-19T10:00:00Z' } } };
  const MON = { id: 'I-MON', status: 'ACTIVE', plan_id: 'P-MONTHLY', custom_id: 'u1', billing_info: { next_billing_time: '2026-12-19T10:00:00Z' } };
  function pp(opts){
    opts = opts || {};
    const db = newDb(), net = newNet(Object.assign({ paypalSubs: { 'I-ANN': ANN, 'I-MON': MON } }, opts.net));
    if(opts.noRow !== true) db.rows.push(Object.assign({ id: 'u1', email: 'ana@mail.com', is_member: false }, opts.row));
    const handler = loadFunctionFrom(srcOf('paypal-webhook.ts', opts.file), db, net, Object.assign({}, ENV, { PAYPAL_PLAN_ID_ANNUAL: 'P-ANNUAL' }, opts.env));
    const row = () => db.rows.find(r => r.id === 'u1');
    const send = (type, resource) => handler(new Request('https://x/paypal-webhook', { method: 'POST', body: JSON.stringify({ event_type: type, resource }),
      headers: { 'paypal-transmission-id': 'a', 'paypal-transmission-time': 'b', 'paypal-cert-url': 'c', 'paypal-auth-algo': 'd', 'paypal-transmission-sig': 'e' } }));
    return { db, net, row, send };
  }
  const SALE = (over) => Object.assign({ id: 'SALE1', state: 'completed', billing_agreement_id: 'I-ANN', amount: { total: '20.00', currency: 'USD' } }, over || {});
  const ACT = { id: 'I-ANN', plan_id: 'P-ANNUAL', custom_id: 'u1' };

  await t('firma invalida: nada cambia (400)', async () => {
    const p = pp({ net: { badSig: true } }); const r = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT);
    assert.strictEqual(r.status, 400); assert.strictEqual(p.row().is_member, false); assert.strictEqual(p.net.meta().length, 0);
  });
  await t('ACTIVATED anual confirmado ($20 USD, ACTIVE, plan anual): acceso, renovacion de PayPal, 1 bienvenida, 1 Meta con 20 USD', async () => {
    const p = pp(); const r = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(r.status, 200); const w = p.row();
    assert.strictEqual(w.is_member, true); assert.strictEqual(w.paypal_subscription_id, 'I-ANN'); assert.ok(w.member_since);
    assert.strictEqual(w.next_renewal_at, '2027-11-19T10:00:00Z', 'fecha que informa PayPal');
    assert.strictEqual(p.net.emails().length, 1, 'una bienvenida');
    const m = p.net.meta(); assert.strictEqual(m.length, 1); const ev = m[0].data[0];
    assert.strictEqual(ev.custom_data.value, 20); assert.strictEqual(ev.custom_data.currency, 'USD'); assert.strictEqual(ev.event_id, 'paypal_subscribe_I-ANN');
  });
  await t('el usuario sale del custom_id guardado en PayPal, NO del aviso', async () => {
    const p = pp(); p.db.rows.push({ id: 'u2', email: 'otro@mail.com', is_member: false });
    await p.send('BILLING.SUBSCRIPTION.ACTIVATED', Object.assign({}, ACT, { custom_id: 'u2' })); await tick();
    assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.db.rows.find(r => r.id === 'u2').is_member, false);
  });
  await t('MISMO aviso 3 veces en serie: 1 acceso, 1 bienvenida, 1 solo evento Meta', async () => {
    const p = pp(); for(let i = 0; i < 3; i++) await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(p.net.meta().length, 1); assert.strictEqual(p.net.emails().length, 1); assert.strictEqual(p.row().is_member, true);
  });
  await t('MISMO aviso 5 veces AL MISMO TIEMPO: 1 solo evento Meta y 1 bienvenida', async () => {
    const p = pp(); await Promise.all([1, 2, 3, 4, 5].map(() => p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT))); await tick();
    assert.strictEqual(p.net.meta().length, 1, 'meta ' + p.net.meta().length); assert.strictEqual(p.net.emails().length, 1, 'correos ' + p.net.emails().length);
  });
  await t('ACTIVATED + SALE.COMPLETED del mismo cobro (mezcla y reenvios): 1 Meta, 1 bienvenida, fecha de PayPal', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT);
    for(let i = 0; i < 3; i++) await p.send('PAYMENT.SALE.COMPLETED', SALE()); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(p.net.meta().length, 1); assert.strictEqual(p.net.emails().length, 1); assert.strictEqual(p.row().next_renewal_at, '2027-11-19T10:00:00Z');
  });
  await t('SALE.COMPLETED llega ANTES del ACTIVATED: ya da acceso y luego no duplica', async () => {
    const p = pp(); const r = await p.send('PAYMENT.SALE.COMPLETED', SALE()); await tick();
    assert.strictEqual(r.status, 200); assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.net.meta().length, 1);
    await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick(); assert.strictEqual(p.net.meta().length, 1);
  });
  await t('ACTIVATED sin cobro visible aun: 503 (PayPal reintenta), SIN acceso ni Meta; al reintentar con cobro, se activa', async () => {
    const noPay = Object.assign({}, ANN, { billing_info: { next_billing_time: ANN.billing_info.next_billing_time } });
    let cur = noPay; const p = pp({ net: { paypalSubs: { 'I-ANN': () => cur } } });
    const r1 = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(r1.status, 503); assert.strictEqual(p.row().is_member, false); assert.strictEqual(p.net.meta().length, 0);
    cur = ANN; const r2 = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(r2.status, 200); assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.net.meta().length, 1);
  });
  for(const [label, mod] of [['2 USD', { value: '2.00', currency_code: 'USD' }], ['20 MXN', { value: '20.00', currency_code: 'MXN' }], ['200 USD', { value: '200.00', currency_code: 'USD' }]]) await t(`cobro de ${label}: SIN acceso ni Meta`, async () => {
    const badSub = Object.assign({}, ANN, { billing_info: { next_billing_time: ANN.billing_info.next_billing_time, last_payment: { amount: mod } } });
    const p = pp({ net: { paypalSubs: { 'I-ANN': badSub } } }); const r = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(r.status, 200); assert.strictEqual(p.row().is_member, false); assert.strictEqual(p.net.meta().length, 0);
  });
  await t('SALE con importe distinto de 20 USD: SIN acceso', async () => {
    const p = pp(); await p.send('PAYMENT.SALE.COMPLETED', SALE({ amount: { total: '2.00', currency: 'USD' } })); await tick(); assert.strictEqual(p.row().is_member, false); assert.strictEqual(p.net.meta().length, 0);
  });
  await t('SALE no completada (pending): SIN acceso', async () => {
    const p = pp(); await p.send('PAYMENT.SALE.COMPLETED', SALE({ state: 'pending' })); await tick(); assert.strictEqual(p.row().is_member, false);
  });
  for(const st of ['APPROVAL_PENDING', 'SUSPENDED', 'CANCELLED']) await t(`suscripcion anual en estado ${st} en PayPal: SIN acceso`, async () => {
    const p = pp({ net: { paypalSubs: { 'I-ANN': Object.assign({}, ANN, { status: st }) } } }); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(p.row().is_member, false); assert.strictEqual(p.net.meta().length, 0);
  });
  await t('el aviso dice plan anual pero PayPal dice otro plan: SIN acceso', async () => {
    const p = pp({ net: { paypalSubs: { 'I-ANN': Object.assign({}, ANN, { plan_id: 'P-OTRO' }) } } }); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(p.row().is_member, false);
  });
  await t('PayPal no responde al confirmar: 503 y SIN acceso', async () => {
    const p = pp({ net: { paypalSubs: {} } }); const r = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); assert.strictEqual(r.status, 503); assert.strictEqual(p.row().is_member, false);
  });
  await t('error de base de datos al activar: 503 (PayPal reintenta) y sin Meta', async () => {
    const p = pp(); p.db.failUpdate = true; const r = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(r.status, 503); assert.strictEqual(p.net.meta().length, 0);
  });
  await t('suscripcion anual sin custom_id: SIN acceso (no se adivina el usuario)', async () => {
    const p = pp({ net: { paypalSubs: { 'I-ANN': Object.assign({}, ANN, { custom_id: undefined }) } } }); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick(); assert.strictEqual(p.row().is_member, false);
  });
  await t('cuenta que YA era miembro por otra suscripcion: no se pisa su suscripcion ni se manda Meta', async () => {
    const p = pp({ row: { is_member: true, paypal_subscription_id: 'I-MON' } }); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(p.row().paypal_subscription_id, 'I-MON'); assert.strictEqual(p.net.meta().length, 0);
  });
  await t('perfil aun no existe: se crea con acceso anual', async () => {
    const p = pp({ noRow: true }); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    const w = p.db.rows.find(r => r.id === 'u1'); assert.ok(w && w.is_member === true && w.paypal_subscription_id === 'I-ANN');
  });
  await t('renovacion anual (12 meses despues): solo avanza la fecha; sin otro Meta ni otra bienvenida', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    p.net.paypalSubs['I-ANN'] = Object.assign({}, ANN, { billing_info: { next_billing_time: '2028-11-19T10:00:00Z', last_payment: { amount: { value: '20.00', currency_code: 'USD' } } } });
    await p.send('PAYMENT.SALE.COMPLETED', SALE({ id: 'SALE2' })); await tick();
    assert.strictEqual(p.row().next_renewal_at, '2028-11-19T10:00:00Z'); assert.strictEqual(p.net.meta().length, 1); assert.strictEqual(p.net.emails().length, 1);
  });
  await t('aviso viejo o fuera de orden NO retrocede la fecha de renovacion', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    p.net.paypalSubs['I-ANN'] = Object.assign({}, ANN, { billing_info: { next_billing_time: '2026-12-01T00:00:00Z', last_payment: { amount: { value: '20.00', currency_code: 'USD' } } } });
    await p.send('PAYMENT.SALE.COMPLETED', SALE()); await tick(); assert.strictEqual(p.row().next_renewal_at, '2027-11-19T10:00:00Z');
  });
  for(const ev of ['BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED']) await t(`${ev} del anual: quita el acceso al instante (como siempre)`, async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    const r = await p.send(ev, { id: 'I-ANN' }); assert.strictEqual(r.status, 200); assert.strictEqual(p.row().is_member, false);
  });
  const CANC = { id: 'I-ANN', plan_id: 'P-ANNUAL' };
  const sweepJs = (db, nowMs) => { db.rows.forEach(r => { if(r.paypal_access_until && Date.parse(r.paypal_access_until) <= nowMs){ if(r.is_member && r.paypal_access_sub && r.paypal_access_sub === r.paypal_subscription_id){ r.is_member = false; r.paypal_access_until = null; r.paypal_access_sub = null; } else if(r.paypal_access_sub !== r.paypal_subscription_id){ r.paypal_access_until = null; r.paypal_access_sub = null; } } }); }; // replica en JS de suspend_expired_paypal_annual()
  await t('CANCELLED del anual: DETIENE la renovacion pero CONSERVA el acceso hasta la fecha pagada guardada', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    const r = await p.send('BILLING.SUBSCRIPTION.CANCELLED', CANC); assert.strictEqual(r.status, 200);
    assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.row().paypal_access_until, '2027-11-19T10:00:00.000Z'); assert.strictEqual(p.row().paypal_access_sub, 'I-ANN');
    assert.strictEqual(p.row().next_renewal_at, '2027-11-19T10:00:00Z');
  });
  await t('CANCELLED sin plan_id en el aviso: se consulta a PayPal y se trata como anual', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    await p.send('BILLING.SUBSCRIPTION.CANCELLED', { id: 'I-ANN' }); assert.strictEqual(p.row().is_member, true); assert.ok(p.row().paypal_access_until);
  });
  await t('cancelacion del anual reenviada 3 veces: mismo resultado, sigue con acceso, sin Meta ni correos nuevos', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    for(let i = 0; i < 3; i++) await p.send('BILLING.SUBSCRIPTION.CANCELLED', CANC); await tick();
    assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.row().paypal_access_until, '2027-11-19T10:00:00.000Z'); assert.strictEqual(p.net.meta().length, 1); assert.strictEqual(p.net.emails().length, 1);
  });
  await t('anual cancelado: un cobro atrasado NO cambia el acceso y al vencer la tarea lo quita; antes no', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick(); await p.send('BILLING.SUBSCRIPTION.CANCELLED', CANC);
    sweepJs(p.db, Date.parse('2027-11-19T09:59:00Z')); assert.strictEqual(p.row().is_member, true, 'un minuto antes del vencimiento sigue con acceso');
    sweepJs(p.db, Date.parse('2027-11-19T10:01:00Z')); assert.strictEqual(p.row().is_member, false, 'vencido: sin acceso'); assert.strictEqual(p.row().paypal_access_until, null);
  });
  await t('anual cancelado y luego contrata MENSUAL antes del vencimiento: la tarea NO le quita la membresia mensual', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick(); await p.send('BILLING.SUBSCRIPTION.CANCELLED', CANC);
    await p.send('BILLING.SUBSCRIPTION.ACTIVATED', { id: 'I-MON', plan_id: 'P-MONTHLY', custom_id: 'u1' }); await tick();
    assert.strictEqual(p.row().paypal_subscription_id, 'I-MON'); sweepJs(p.db, Date.parse('2027-12-01T00:00:00Z')); assert.strictEqual(p.row().is_member, true);
  });
  await t('anual cancelado SIN fecha guardada o con fecha ya vencida: se quita el acceso (regla de siempre)', async () => {
    const a = pp({ row: { is_member: true, paypal_subscription_id: 'I-ANN', next_renewal_at: null } }); await a.send('BILLING.SUBSCRIPTION.CANCELLED', CANC); assert.strictEqual(a.row().is_member, false);
    const b = pp({ row: { is_member: true, paypal_subscription_id: 'I-ANN', next_renewal_at: '2026-01-01T00:00:00Z' } }); await b.send('BILLING.SUBSCRIPTION.CANCELLED', CANC); assert.strictEqual(b.row().is_member, false);
  });
  await t('anual cancelado y la base aun SIN las columnas nuevas: cae a la regla de siempre (quita acceso) y no se rompe', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick(); p.db.noAccessCols = true;
    const r = await p.send('BILLING.SUBSCRIPTION.CANCELLED', CANC); assert.strictEqual(r.status, 200); assert.strictEqual(p.row().is_member, false);
  });
  await t('CANCELLED MENSUAL con la config anual puesta: sigue quitando el acceso al instante y sin escribir fechas nuevas', async () => {
    const p = pp({ row: { is_member: true, paypal_subscription_id: 'I-MON', next_renewal_at: '2027-01-01T00:00:00Z' } });
    await p.send('BILLING.SUBSCRIPTION.CANCELLED', { id: 'I-MON', plan_id: 'P-MONTHLY' }); assert.strictEqual(p.row().is_member, false); assert.strictEqual(p.row().paypal_access_until, undefined);
  });
  await t('RE-ACTIVATED del anual (suspension -> pago): recupera acceso sin otra bienvenida ni otro Meta', async () => {
    const p = pp(); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    await p.send('BILLING.SUBSCRIPTION.SUSPENDED', { id: 'I-ANN' }); assert.strictEqual(p.row().is_member, false);
    const r = await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-ANN' }); await tick();
    assert.strictEqual(r.status, 200); assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.net.meta().length, 1); assert.strictEqual(p.net.emails().length, 1);
  });
  await t('boton anual oculto (PAYPAL_ANNUAL_CHECKOUT apagado): el webhook SIGUE atendiendo al anual', async () => {
    const p = pp({ env: { PAYPAL_ANNUAL_CHECKOUT: 'off' } }); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', ACT); await tick();
    assert.strictEqual(p.row().is_member, true);
    await p.send('BILLING.SUBSCRIPTION.CANCELLED', { id: 'I-ANN', plan_id: 'P-ANNUAL' }); assert.strictEqual(p.row().is_member, true, 'el anual cancelado conserva el acceso hasta el vencimiento');
    sweepJs(p.db, Date.parse('2027-11-20T00:00:00Z')); assert.strictEqual(p.row().is_member, false);
  });

  console.log('Webhook: SIN configuracion anual todo se comporta como antes');
  await t('sin PAYPAL_PLAN_ID_ANNUAL: ACTIVATED mensual normal (acceso, bienvenida)', async () => {
    const p = pp({ env: { PAYPAL_PLAN_ID_ANNUAL: '' } }); await p.send('BILLING.SUBSCRIPTION.ACTIVATED', { id: 'I-MON', plan_id: 'P-MONTHLY', custom_id: 'u1' }); await tick();
    assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.row().paypal_subscription_id, 'I-MON'); assert.strictEqual(p.net.emails().length, 1);
  });
  await t('sin PAYPAL_PLAN_ID_ANNUAL: un cobro de plan anual NO da acceso por la via mensual', async () => {
    const p = pp({ env: { PAYPAL_PLAN_ID_ANNUAL: '' } }); await p.send('PAYMENT.SALE.COMPLETED', SALE()); await tick(); assert.strictEqual(p.row().is_member, false);
  });
  await t('con config anual, el ACTIVATED MENSUAL sigue su camino de siempre', async () => {
    const p = pp(); const r = await p.send('BILLING.SUBSCRIPTION.ACTIVATED', { id: 'I-MON', plan_id: 'P-MONTHLY', custom_id: 'u1' }); await tick();
    assert.strictEqual(r.status, 200); assert.strictEqual(p.row().is_member, true); assert.strictEqual(p.row().paypal_subscription_id, 'I-MON'); assert.strictEqual(p.row().next_renewal_at, '2026-12-19T10:00:00Z');
  });
  await t('con config anual, el SALE.COMPLETED mensual sigue refrescando la renovacion', async () => {
    const p = pp({ row: { is_member: true, paypal_subscription_id: 'I-MON', next_renewal_at: '2026-11-19T10:00:00Z' } });
    const r = await p.send('PAYMENT.SALE.COMPLETED', { id: 'S9', state: 'completed', billing_agreement_id: 'I-MON', amount: { total: '2.00', currency: 'USD' } }); await tick();
    assert.strictEqual(r.status, 200); assert.strictEqual(p.row().next_renewal_at, '2026-12-19T10:00:00Z'); assert.strictEqual(p.net.meta().length, 0);
  });
  await t('con config anual y PayPal caido al consultar: el SALE mensual cae al flujo mensual y no rompe', async () => {
    const p = pp({ row: { is_member: true, paypal_subscription_id: 'I-MON', next_renewal_at: '2026-11-19T10:00:00Z' }, net: { paypalDown: true } });
    const r = await p.send('PAYMENT.SALE.COMPLETED', { id: 'S9', state: 'completed', billing_agreement_id: 'I-MON', amount: { total: '2.00', currency: 'USD' } });
    assert.ok(r.status < 600); assert.strictEqual(p.row().is_member, true);
  });
  for(const ev of ['BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED']) await t(`${ev} MENSUAL de una suscripcion anterior al cambio: quita acceso como siempre`, async () => {
    const p = pp({ row: { is_member: true, paypal_subscription_id: 'I-MON' } }); await p.send(ev, { id: 'I-MON' }); assert.strictEqual(p.row().is_member, false);
  });
  await t('RE-ACTIVATED mensual (suscripcion previa) sigue funcionando; plan ajeno sigue rechazado', async () => {
    const p = pp({ row: { is_member: false, paypal_subscription_id: 'I-MON' } }); await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-MON' }); assert.strictEqual(p.row().is_member, true);
    const q = pp({ row: { is_member: false, paypal_subscription_id: 'I-X' }, net: { paypalSubs: { 'I-X': Object.assign({}, MON, { id: 'I-X', plan_id: 'P-OTRO' }) } } }); await q.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-X' }); assert.strictEqual(q.row().is_member, false);
  });

  /* ===== DIFERENCIAL: mensual de la version ANTERIOR vs la NUEVA, mismas entradas y mismos resultados ===== */
  if(process.env.OLD_WEBHOOK){
    console.log('Diferencial mensual: webhook ANTERIOR vs NUEVO');
    const scen = [
      ['ACTIVATED mensual', { row: { is_member: false } }, [['BILLING.SUBSCRIPTION.ACTIVATED', { id: 'I-MON', plan_id: 'P-MONTHLY', custom_id: 'u1' }]]],
      ['ACTIVATED mensual repetido', { row: { is_member: false } }, [['BILLING.SUBSCRIPTION.ACTIVATED', { id: 'I-MON', plan_id: 'P-MONTHLY', custom_id: 'u1' }], ['BILLING.SUBSCRIPTION.ACTIVATED', { id: 'I-MON', plan_id: 'P-MONTHLY', custom_id: 'u1' }]]],
      ['SALE mensual', { row: { is_member: true, paypal_subscription_id: 'I-MON', next_renewal_at: '2026-11-19T10:00:00Z' } }, [['PAYMENT.SALE.COMPLETED', { id: 'S1', state: 'completed', billing_agreement_id: 'I-MON', amount: { total: '2.00', currency: 'USD' } }]]],
      ['CANCELLED', { row: { is_member: true, paypal_subscription_id: 'I-MON' } }, [['BILLING.SUBSCRIPTION.CANCELLED', { id: 'I-MON' }]]],
      ['SUSPENDED y RE-ACTIVATED', { row: { is_member: true, paypal_subscription_id: 'I-MON' } }, [['BILLING.SUBSCRIPTION.SUSPENDED', { id: 'I-MON' }], ['BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-MON' }]]],
    ];
    for(const [name, o, evs] of scen) await t('mensual igual en ambas versiones: ' + name, async () => {
      const a = pp(Object.assign({ file: process.env.OLD_WEBHOOK, env: { PAYPAL_PLAN_ID_ANNUAL: '' } }, o)), b = pp(o), ra = [], rb = [];
      for(const [ty, rs] of evs){ ra.push((await a.send(ty, rs)).status); rb.push((await b.send(ty, rs)).status); } await tick();
      assert.deepStrictEqual(rb, ra); const strip = r => { const c = Object.assign({}, r); Object.keys(c).forEach(k => { if(/_at$|^member_since$/.test(k) && k !== 'next_renewal_at') c[k] = c[k] ? 'fecha' : c[k]; }); return c; }; // marcas de hora de "ahora" solo se comparan como presente/ausente
      assert.deepStrictEqual(strip(b.row()), strip(a.row())); assert.strictEqual(b.net.emails().length, a.net.emails().length); assert.strictEqual(b.net.meta().length, a.net.meta().length);
    });
  }
  if(process.env.OLD_CHECKOUT){
    console.log('Diferencial mensual: checkout ANTERIOR vs NUEVO');
    for(const body of [undefined, {}, { plan: 'monthly', track: false }]) await t('checkout mensual igual en ambas versiones, cuerpo ' + JSON.stringify(body), async () => {
      const a = checkout({ file: process.env.OLD_CHECKOUT }), b = checkout({ env: ANNUAL_ON }); const ra = await a.call(body), rb = await b.call(body);
      assert.deepStrictEqual(rb, ra); assert.deepStrictEqual(b.created(), a.created());
    });
  }

  console.log(`\n${ok} ok, ${bad} fallaron`);
  process.exit(bad ? 1 : 0);
})();
