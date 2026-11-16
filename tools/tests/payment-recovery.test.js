#!/usr/bin/env node
/* Pruebas de la recuperacion de cobros fallidos de Stripe:
   - payment-recovery-emails.ts: recordatorio (48 h), aviso de pausa, seguimiento a 1 mes y a 2 meses.
   - stripe-webhook.ts: abre el seguimiento en el primer fallo y lo cierra al volver a pagar.
   TODO simulado: base de datos en memoria, reloj, Stripe y Resend falsos. NO manda correos ni cobra nada.
   Corre con:  node tools/tests/payment-recovery.test.js   (desde la carpeta inglesconLeo) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert'), nodeCrypto = require('crypto');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const read = f => fs.readFileSync(f === 'supabase_functions/stripe-webhook.ts' && process.env.WEBHOOK_FILE ? process.env.WEBHOOK_FILE : path.join(root, f), 'utf8'); // WEBHOOK_FILE=ruta prueba otra version del webhook sin tocar el del repo

let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); }
}

/* ---------- Base de datos falsa con varias tablas ---------- */
function parseOr(str){
  return str.split(',').map(c => {
    const m = /^(\w+)\.(is|lt|lte|gt|gte)\.(.*)$/.exec(c);
    return r => {
      const v = r[m[1]];
      if(m[2] === 'is') return m[3] === 'null' ? v == null : false;
      if(v == null) return false;
      if(m[2] === 'lt') return v < m[3];
      if(m[2] === 'lte') return v <= m[3];
      if(m[2] === 'gt') return v > m[3];
      return v >= m[3];
    };
  });
}
function Query(db, table){ this.db = db; this.table = table; this.filters = []; this.mode = 'select'; this.wantRows = false; }
Query.prototype = {
  select(){ if(this.mode !== 'select') this.wantRows = true; return this; },
  update(p){ this.mode = 'update'; this.payload = p; return this; },
  upsert(p){ this.mode = 'upsert'; this.payload = p; return this; },
  eq(c, v){ this.filters.push(r => r[c] === v); return this; },
  is(c, v){ this.filters.push(r => v === null ? r[c] == null : r[c] === v); return this; },
  not(c, op, v){ this.filters.push(r => (op === 'is' && v === null) ? r[c] != null : true); return this; },
  gte(c, v){ this.filters.push(r => r[c] != null && r[c] >= v); return this; },
  limit(){ return this; },
  or(s){ const cs = parseOr(s); this.filters.push(r => cs.some(f => f(r))); return this; },
  maybeSingle(){ this.single = true; return this.exec(); },
  then(a, b){ return this.exec().then(a, b); },
  async exec(){
    const rows = this.db.tables[this.table] = this.db.tables[this.table] || [];
    if(this.table === 'profiles' && this.mode === 'update' && this.payload && 'last_marketing_email_at' in this.payload && this.db.onSlotClaim){ const h = this.db.onSlotClaim; this.db.onSlotClaim = null; h(rows); }
    this.db.log.push({ table: this.table, mode: this.mode });
    const match = rows.filter(r => this.filters.every(f => f(r)));
    if(this.mode === 'update'){
      match.forEach(r => Object.assign(r, this.payload));
      return { data: this.wantRows ? match.map(r => Object.assign({}, r)) : null, error: null };
    }
    if(this.mode === 'upsert'){
      const ex = rows.find(r => r.id === this.payload.id);
      if(ex) Object.assign(ex, this.payload); else rows.push(Object.assign({}, this.payload));
      return { data: null, error: null };
    }
    const out = match.map(r => Object.assign({}, r));
    if(this.single) return { data: out[0] || null, error: null };
    return { data: out, error: null };
  },
};
function newDb(){
  const db = { tables: { profiles: [], payment_recovery: [] }, log: [], rpcCalls: [], rpcError: false, secret: 'good' };
  const T = () => db.tables;
  db.client = {
    from(t){ db.fromCalls = (db.fromCalls || 0) + 1; return new Query(db, t); },
    async rpc(name, args){
      db.rpcCalls.push({ name, args });
      if(name === 'internal_secret_ok' && db.secretError) return { data: null, error: { message: 'db caida' } };
      if(name === 'internal_secret_ok') return { data: args.p_secret === db.secret, error: null };
      if(db.rpcError) return { data: null, error: { code: 'PGRST202', message: 'function does not exist' } };
      // Mismo comportamiento que las funciones SQL de la migracion.
      if(name === 'payment_recovery_open'){
        let n = 0;
        T().profiles.filter(p => p.stripe_customer_id === args.p_customer).forEach(p => {
          const ex = T().payment_recovery.find(e => e.user_id === p.id);
          if(!ex){ T().payment_recovery.push({ user_id: p.id, stripe_customer_id: args.p_customer, started_at: args.p_started, closed_at: null }); n++; }
          else if(ex.closed_at){ Object.keys(ex).forEach(k => { if(k !== 'user_id') ex[k] = null; }); Object.assign(ex, { stripe_customer_id: args.p_customer, started_at: args.p_started }); n++; }
        });
        return { data: n, error: null };
      }
      if(name === 'payment_recovery_close'){
        let n = 0;
        T().payment_recovery.filter(e => e.stripe_customer_id === args.p_customer && !e.closed_at).forEach(e => { e.closed_at = 'closed-now'; e.closed_reason = args.p_reason; n++; });
        return { data: n, error: null };
      }
      return { data: null, error: null };
    },
  };
  return db;
}

/* ---------- Proveedores falsos ---------- */
function newNet(cfg){
  const net = Object.assign({ resendFailTimes: 0, openInvoice: null, calls: [], subs: { sub_1: { id: 'sub_1', customer: 'cus_1', status: 'past_due' } } }, cfg || {});
  net.mails = () => net.calls.filter(c => c.url.includes('api.resend.com')).map(c => Object.assign(JSON.parse(c.body), { _headers: c.headers }));
  net.fetch = async (url, init) => {
    url = String(url); init = init || {};
    net.calls.push({ url, body: init.body || '', headers: init.headers || {} });
    const J = (obj, status) => ({ ok: (status || 200) < 300, status: status || 200, json: async () => obj, text: async () => JSON.stringify(obj) });
    if(url.includes('api.resend.com')){
      if(net.resendFailTimes > 0){ net.resendFailTimes--; return J({ error: 'x' }, 500); }
      return J({ id: 'e1' });
    }
    if(net.stripeDown && url.includes('api.stripe.com')){ if(net.stripeDown === 'throw') throw new Error('red'); return J({ error: 'x' }, 500); }
    if(/api\.stripe\.com\/v1\/invoices\?/.test(url)) return J({ data: net.openInvoice ? [net.openInvoice] : [] });
    if(/api\.stripe\.com\/v1\/invoices\/(.+)$/.test(url)) return net.openInvoice ? J(net.openInvoice) : J({}, 404);
    { const ms = url.match(/api\.stripe\.com\/v1\/subscriptions\/([^?]+)/); if(ms) return net.subs[ms[1]] ? J(net.subs[ms[1]]) : J({}, 404); }
    if(url.includes('graph.facebook.com')) return J({});
    return J({}, 404);
  };
  return net;
}

/* ---------- Carga el .ts real en una caja con Deno y reloj simulados ---------- */
function loadFunction(file, db, net, env, clock){
  const src = read('supabase_functions/' + file).replace(/^import \{ createClient \} from .*$/m, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  let handler = null;
  class FakeDate extends Date {
    constructor(...a){ if(a.length) super(...a); else super(clock.now); }
    static now(){ return clock.now; }
  }
  const sandbox = {
    Deno: { env: { get: k => (env || {})[k] }, serve: fn => { handler = fn; } },
    createClient: () => db.client, fetch: net.fetch, Response, Request, URL, crypto: nodeCrypto.webcrypto, TextEncoder, btoa,
    AbortSignal, console: { log(){}, error(){} }, setTimeout, clearTimeout, Promise, JSON, Date: FakeDate, Math, Set, Map, Object, Array, String, Number, Error, parseFloat, parseInt, encodeURIComponent, Uint8Array, RegExp,
  };
  sandbox.globalThis = sandbox; sandbox.exports = {};
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { filename: file });
  return handler;
}

const ENV = { SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'k', RESEND_API_KEY: 'r', STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test' };
const HR = 3600000, DAY = 86400000;
// Primer fallo: 12 nov 2026 03:52 UTC (= 11 nov 22:52 hora de Cancun)
const START = Date.parse('2026-11-12T03:52:00.000Z');
const iso = t => new Date(t).toISOString();
// Instante dentro de la ventana de envio (15:00 UTC = 10:00 Cancun) del dia en que cae START + ms.
const inWindow = ms => { const d = new Date(START + ms); d.setUTCHours(15, 0, 0, 0); return d.getTime(); };
const SUSP_EARLY = { suspended_at: iso(START + 3 * DAY), suspended_result: 'sent' };
const INV = { id: 'in_1', customer: 'cus_1', status: 'open', subscription: 'sub_1', hosted_invoice_url: 'https://invoice.stripe.com/i/acct_1/test_abc123' };

function recovery(opts){
  opts = opts || {};
  const db = newDb(), net = newNet(opts.net), clock = { now: opts.now || inWindow(DAY) };
  db.tables.profiles.push(Object.assign({ id: 'u1', email: 'gladys@mail.com', display_name: 'Gladys del carmen', is_member: true, email_invalid: false, email_opt_out_at: null, email_paused_until: null, last_marketing_email_at: null, stripe_customer_id: 'cus_1', paypal_subscription_id: null, mp_preapproval_id: null }, opts.profile));
  db.tables.payment_recovery.push(Object.assign({ user_id: 'u1', stripe_customer_id: 'cus_1', started_at: iso(START), closed_at: null, claimed_at: null }, opts.ep));
  const handler = loadFunction('payment-recovery-emails.ts', db, net, ENV, clock);
  const ep = () => db.tables.payment_recovery.find(e => e.user_id === 'u1');
  const prof = () => db.tables.profiles.find(p => p.id === 'u1');
  const run = (body, secret) => handler(new Request('https://x/payment-recovery-emails', { method: 'POST', headers: { 'x-internal-secret': secret === undefined ? 'good' : secret }, body: JSON.stringify(body || {}) })).then(async r => ({ status: r.status, json: await r.json() }));
  return { db, net, clock, ep, prof, run, handler };
}
const allText = m => m.subject + '\n' + m.html;

(async()=>{
  console.log('Seguimiento de cobros fallidos: recordatorio, pausa y regreso');

  await test('Sin la llave interna responde 401 y no manda nada', async()=>{
    const r = recovery({ now: inWindow(2 * DAY) });
    assert.strictEqual((await r.run({}, undefined === 1 ? '' : 'mala')).status, 401);
    assert.strictEqual((await r.run({}, '')).status, 401);
    assert.strictEqual(r.net.mails().length, 0);
    assert.ok(!r.ep().reminder_at);
  });

  await test('SEGURIDAD (Verify JWT apagado): sin credenciales del cron se rechaza TODO, sin tocar la base, Stripe ni Resend', async()=>{
    const r = recovery({ now: inWindow(3 * DAY + 2 * HR), profile: { is_member: false }, net: { openInvoice: INV } });
    const fn = r.handler;
    const call = (init, url) => fn(new Request(url || 'https://x/payment-recovery-emails', init)).then(async x => ({ status: x.status, body: await x.json().catch(() => null) }));
    const ANON = 'Bearer eyJhbGciOiJIUzI1NiJ9.anon.key', BODY = JSON.stringify({ dry_run: false });
    const cases = [
      ['sin ningun encabezado', { method: 'POST', body: BODY }],
      ['solo Authorization Bearer (llave anon o de usuario, lo unico que Supabase exigiria con JWT activo)', { method: 'POST', headers: { Authorization: ANON }, body: BODY }],
      ['x-internal-secret vacio', { method: 'POST', headers: { 'x-internal-secret': '' }, body: BODY }],
      ['x-internal-secret incorrecto', { method: 'POST', headers: { 'x-internal-secret': 'mala' }, body: BODY }],
      ['secreto bueno pero en el cuerpo en vez del encabezado', { method: 'POST', body: JSON.stringify({ 'x-internal-secret': 'good', secret: 'good' }) }],
      ['dry_run sin credenciales', { method: 'POST', body: JSON.stringify({ dry_run: true }) }],
      ['metodo GET', { method: 'GET' }],
    ];
    for(const [label, init] of cases){ const x = await call(init); assert.strictEqual(x.status, 401, label); assert.strictEqual(x.body.ok, false, label); }
    const q = await call({ method: 'POST', body: BODY }, 'https://x/payment-recovery-emails?x-internal-secret=good&secret=good');
    assert.strictEqual(q.status, 401, 'el secreto en la URL no vale');
    assert.strictEqual(r.net.calls.length, 0, 'nada de Stripe ni Resend');
    assert.strictEqual(r.net.mails().length, 0);
    assert.strictEqual(r.db.rpcCalls.filter(c => c.name !== 'internal_secret_ok').length, 0, 'ninguna otra funcion SQL');
    assert.ok(!r.db.fromCalls, 'no se leyo ni escribio ninguna tabla');
    assert.ok(!r.ep().suspended_at && !r.ep().claimed_at);
    // y con la credencial correcta SI funciona (la prueba no esta rota)
    assert.strictEqual((await r.run({}, 'good')).status, 200);
  });

  await test('SEGURIDAD: si la base no puede verificar la llave, falla CERRADO (401), no abierto', async()=>{
    const r = recovery({ now: inWindow(3 * DAY + 2 * HR), profile: { is_member: false } });
    r.db.secretError = true;
    const x = await r.run({}, 'good');
    assert.strictEqual(x.status, 401);
    assert.strictEqual(r.net.mails().length, 0);
    assert.ok(!r.db.fromCalls);
  });

  await test('Recordatorio: pasadas 48 h y con acceso, sale UNA vez con el enlace seguro de Stripe', async()=>{
    // 14 nov 15:00 UTC = 83 h... usamos un instante de ~58 h: START + 58 h = 14 nov 13:52 UTC = 08:52 Cancun
    const r = recovery({ now: START + 58 * HR, net: { openInvoice: INV } });
    const out = await r.run();
    assert.strictEqual(out.json.results['sent:reminder'], 1);
    const m = r.net.mails();
    assert.strictEqual(m.length, 1);
    assert.deepStrictEqual(m[0].to, ['gladys@mail.com']);
    assert.ok(m[0].html.includes('https://invoice.stripe.com/i/acct_1/test_abc123'));
    assert.ok(m[0].html.includes('menos de un día'));
    assert.ok(m[0].html.includes('Hola, Gladys.'));
    assert.strictEqual(r.ep().reminder_result, 'sent');
    r.clock.now += HR;
    await r.run();
    assert.strictEqual(r.net.mails().length, 1, 'no se repite');
  });

  await test('Recordatorio: antes de 48 h no sale, y fuera de horario (madrugada de Cancun) espera', async()=>{
    const r1 = recovery({ now: START + 40 * HR });
    await r1.run(); assert.strictEqual(r1.net.mails().length, 0);
    const r2 = recovery({ now: START + 50 * HR }); // 14 nov 05:52 UTC = 00:52 Cancun
    const o = await r2.run();
    assert.strictEqual(r2.net.mails().length, 0);
    assert.ok(o.json.results['wait:outside_send_hour']);
    assert.ok(!r2.ep().claimed_at, 'no deja reserva colgada');
  });

  await test('Recordatorio sin factura abierta: el boton lleva a la pagina de membresia', async()=>{
    const r = recovery({ now: START + 58 * HR });
    await r.run();
    const m = r.net.mails()[0];
    assert.ok(m.html.includes('https://inglesconleo.com/miembros.html'));
    assert.ok(!m.html.includes('invoice.stripe.com'));
  });

  await test('Enlace de Stripe de otro cliente o que no es de invoice.stripe.com se ignora', async()=>{
    const r = recovery({ now: START + 58 * HR, net: { openInvoice: Object.assign({}, INV, { customer: 'cus_OTRO' }) } });
    await r.run(); assert.ok(!r.net.mails()[0].html.includes('invoice.stripe.com'));
    const r2 = recovery({ now: START + 58 * HR, net: { openInvoice: Object.assign({}, INV, { hosted_invoice_url: 'https://evil.example.com/pay' }) } });
    await r2.run(); assert.ok(!r2.net.mails()[0].html.includes('evil.example.com'));
  });

  await test('Enlace de pago: solo si la suscripcion sigue en reintento (past_due/unpaid); cancelada, activa o ajena -> pagina de membresia', async()=>{
    for(const sub of [{ id: 'sub_1', customer: 'cus_1', status: 'canceled' }, { id: 'sub_1', customer: 'cus_1', status: 'active' }, { id: 'sub_1', customer: 'cus_OTRO', status: 'past_due' }]){
      const r = recovery({ now: START + 58 * HR, net: { openInvoice: INV, subs: { sub_1: sub } } });
      await r.run();
      const h = r.net.mails()[0].html;
      assert.ok(!h.includes('invoice.stripe.com'), sub.status + '/' + sub.customer);
      assert.ok(h.includes('https://inglesconleo.com/miembros.html'));
    }
    const rNo = recovery({ now: START + 58 * HR, net: { openInvoice: Object.assign({}, INV, { subscription: null }) } });
    await rNo.run(); assert.ok(!rNo.net.mails()[0].html.includes('invoice.stripe.com'), 'factura sin suscripcion');
    const rUnp = recovery({ now: START + 58 * HR, net: { openInvoice: INV, subs: { sub_1: { id: 'sub_1', customer: 'cus_1', status: 'unpaid' } } } });
    await rUnp.run(); assert.ok(rUnp.net.mails()[0].html.includes('invoice.stripe.com'), 'unpaid sigue siendo pagable');
  });

  await test('Enlace de pago: API nueva de Stripe (parent.subscription_details.subscription) tambien vale', async()=>{
    const inv = Object.assign({}, INV, { subscription: undefined, parent: { subscription_details: { subscription: 'sub_1' } } });
    const r = recovery({ now: START + 58 * HR, net: { openInvoice: inv } });
    await r.run(); assert.ok(r.net.mails()[0].html.includes('https://invoice.stripe.com/i/acct_1/test_abc123'));
  });

  await test('Boton del correo: texto "Pagar mi renovacion pendiente" cuando hay enlace', async()=>{
    const r = recovery({ now: START + 58 * HR, net: { openInvoice: INV } });
    await r.run(); assert.ok(r.net.mails()[0].html.includes('Pagar mi renovación pendiente'));
  });

  await test('REGLA: mientras Stripe pueda recuperar el cobro, el seguimiento 1 y el 2 tambien llevan a la factura pendiente', async()=>{
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: false }, ep: SUSP_EARLY, net: { openInvoice: INV } });
    await r.run();
    const m = r.net.mails()[0];
    assert.ok(/Retomamos/.test(m.subject));
    assert.ok(m.html.includes('https://invoice.stripe.com/i/acct_1/test_abc123'));
    assert.ok(m.html.includes('Pagar mi renovación pendiente'));
    assert.ok(!m.html.includes('inglesconleo.com/miembros.html"'), 'el boton no va a un checkout nuevo');
    const r2 = recovery({ now: inWindow(61 * DAY), profile: { is_member: false }, ep: Object.assign({ winback1_at: iso(START + 31 * DAY), winback1_result: 'sent' }, SUSP_EARLY), net: { openInvoice: INV } });
    await r2.run();
    assert.ok(r2.net.mails()[0].html.includes('https://invoice.stripe.com/i/acct_1/test_abc123'));
  });

  await test('Stripe ya cancelo la suscripcion: los seguimientos llevan al sitio (la factura vieja no devolveria el acceso)', async()=>{
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: false }, ep: SUSP_EARLY, net: { openInvoice: INV, subs: { sub_1: { id: 'sub_1', customer: 'cus_1', status: 'canceled' } } } });
    await r.run();
    const h = r.net.mails()[0].html;
    assert.ok(!h.includes('invoice.stripe.com') && h.includes('https://inglesconleo.com/miembros.html'));
  });

  await test('Stripe sin responder: NINGUN correo sale (aviso, pausa, seguimientos), no se gasta el freno ni queda reserva, y sale cuando Stripe vuelve', async()=>{
    for(const [label, o] of [['reminder', { now: START + 58 * HR }], ['suspended', { now: inWindow(3 * DAY + 2 * HR), profile: { is_member: false } }], ['winback1', { now: inWindow(31 * DAY), profile: { is_member: false }, ep: SUSP_EARLY }]]){
      for(const down of [true, 'throw']){
        const r = recovery(Object.assign({}, o, { net: { openInvoice: INV, stripeDown: down } }));
        const before = r.prof().last_marketing_email_at;
        const out = await r.run();
        assert.strictEqual(r.net.mails().length, 0, label);
        assert.ok(out.json.results['wait:stripe_unavailable'], label + ' ' + JSON.stringify(out.json.results));
        assert.strictEqual(r.prof().last_marketing_email_at, before, label + ': no gasta el turno del freno');
        assert.ok(!r.ep().claimed_at, label + ': sin reserva colgada');
        assert.ok(!r.ep()[label + '_at'], label + ': no queda marcado como enviado');
        r.net.stripeDown = false; r.clock.now += HR;
        await r.run();
        assert.strictEqual(r.net.mails().length, 1, label + ': sale al volver Stripe');
      }
    }
  });

  await test('dry_run: dice si el boton iria a la factura, al sitio o esperaria a Stripe, sin enviar ni escribir', async()=>{
    for(const [cfg, expect] of [[{ openInvoice: INV }, 'factura_pendiente'], [{}, 'sitio_miembros'], [{ openInvoice: INV, stripeDown: true }, 'esperaria_stripe_sin_respuesta']]){
      const r = recovery({ now: inWindow(3 * DAY + 2 * HR), profile: { is_member: false }, net: cfg });
      const snap = JSON.stringify(r.db.tables);
      const out = await r.run({ dry_run: true });
      assert.strictEqual(out.json.episodes[0].boton, expect);
      assert.strictEqual(r.net.mails().length, 0);
      assert.strictEqual(JSON.stringify(r.db.tables), snap);
    }
  });

  await test('Aviso de pausa: sin acceso por falta de pago, sale UNA vez y no menciona saldo', async()=>{
    const r = recovery({ now: inWindow(3 * DAY + 2 * HR), profile: { is_member: false }, net: { openInvoice: INV } });
    const out = await r.run();
    assert.strictEqual(out.json.results['sent:suspended'], 1);
    const m = r.net.mails()[0];
    assert.ok(/Pausamos tu membres/.test(m.subject));
    assert.ok(m.html.includes('https://invoice.stripe.com/i/acct_1/test_abc123'));
    assert.strictEqual(r.ep().suspended_result, 'sent');
    r.clock.now += HR; await r.run();
    assert.strictEqual(r.net.mails().length, 1);
  });

  await test('Si Stripe cancela antes de las 72 h (sin acceso), el aviso de pausa sale igual, y el recordatorio ya no', async()=>{
    const r = recovery({ now: START + 10 * HR, profile: { is_member: false } }); // 12 nov 13:52 UTC = 08:52 Cancun
    await r.run();
    const m = r.net.mails();
    assert.strictEqual(m.length, 1);
    assert.ok(/Pausamos/.test(m[0].subject));
    assert.ok(!r.ep().reminder_at);
  });

  await test('Aviso de pausa muy tarde (mas de 10 dias): se omite, queda registrado y no se manda', async()=>{
    const r = recovery({ now: inWindow(12 * DAY), profile: { is_member: false } });
    const out = await r.run();
    assert.strictEqual(r.net.mails().length, 0);
    assert.strictEqual(r.ep().suspended_result, 'skipped');
    assert.ok(out.json.results['skipped:suspended']);
  });

  await test('Los correos de COBRO ignoran la pausa por rebote temporal y la baja de marketing; email_invalid los bloquea', async()=>{
    const r = recovery({ now: inWindow(4 * DAY), profile: { is_member: false, email_paused_until: iso(inWindow(20 * DAY)), email_opt_out_at: iso(START) } });
    await r.run(); assert.strictEqual(r.net.mails().length, 1, 'es un correo de la cuenta');
    const r2 = recovery({ now: inWindow(4 * DAY), profile: { is_member: false, email_invalid: true } });
    await r2.run(); assert.strictEqual(r2.net.mails().length, 0);
    assert.strictEqual(r2.ep().closed_reason, 'email_unusable');
  });

  const SUSP = { suspended_at: iso(START + 3 * DAY), suspended_result: 'sent' };

  await test('Seguimiento a 1 mes: sale a los 30 dias, con enlace de baja y cabecera List-Unsubscribe, y cuenta para el freno de marketing', async()=>{
    const r = recovery({ now: inWindow(29 * DAY), profile: { is_member: false }, ep: SUSP });
    await r.run(); assert.strictEqual(r.net.mails().length, 0, 'a los 29 dias todavia no');
    r.clock.now = inWindow(31 * DAY);
    const out = await r.run();
    assert.strictEqual(out.json.results['sent:winback1'], 1);
    const m = r.net.mails()[0];
    assert.ok(/Retomamos/.test(m.subject));
    assert.ok(m.html.includes('/baja.html?u=u1&t='), 'enlace de baja');
    assert.ok(m._headers && m.headers && m.headers['List-Unsubscribe'] && m.headers['List-Unsubscribe'].includes('/functions/v1/email-unsubscribe?u=u1&t='));
    assert.ok(r.prof().last_marketing_email_at);
    assert.strictEqual(r.ep().winback1_result, 'sent');
    r.clock.now += HR; await r.run();
    assert.strictEqual(r.net.mails().length, 1, 'no se repite');
  });

  await test('La firma del enlace de baja es la misma que usa email-unsubscribe (HMAC de "unsub:" + id)', async()=>{
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: false }, ep: SUSP });
    await r.run();
    const expected = nodeCrypto.createHmac('sha256', 'k').update('unsub:u1').digest('hex').slice(0, 32);
    assert.ok(r.net.mails()[0].html.includes('t=' + expected));
  });

  await test('Seguimiento: respeta el freno de 48 h desde el ultimo correo de marketing', async()=>{
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: false, last_marketing_email_at: iso(inWindow(31 * DAY) - DAY) }, ep: SUSP });
    const out = await r.run();
    assert.strictEqual(r.net.mails().length, 0);
    assert.ok(out.json.results['wait:marketing_gap']);
    r.clock.now += 2 * DAY;
    await r.run(); assert.strictEqual(r.net.mails().length, 1, 'pasado el freno, sale');
  });

  await test('Turno de marketing atomico: si otra funcion lo toma justo antes, el seguimiento NO sale y no deja nada colgado', async()=>{
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: false }, ep: SUSP });
    // Otra campania (upgrade-nudge, racha o encuesta) toma el turno entre que se lee el perfil y se reserva.
    r.db.onSlotClaim = rows => { rows.forEach(p => { p.last_marketing_email_at = iso(r.clock.now - 1000); }); };
    const out = await r.run();
    assert.strictEqual(r.net.mails().length, 0);
    assert.ok(out.json.results['wait:marketing_slot_taken']);
    assert.ok(!r.ep().claimed_at && !r.ep().winback1_at);
    assert.strictEqual(r.prof().last_marketing_email_at, iso(r.clock.now - 1000), 'no pisa el turno de la otra campania');
  });

  await test('Turno de marketing: si el envio falla, se devuelve el valor anterior del freno', async()=>{
    const before = iso(inWindow(31 * DAY) - 5 * DAY);
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: false, last_marketing_email_at: before }, ep: SUSP, net: { resendFailTimes: 3 } });
    const out = await r.run();
    assert.ok(out.json.results['send_failed:winback1']);
    assert.strictEqual(r.prof().last_marketing_email_at, before);
    assert.ok(!r.ep().winback1_at && !r.ep().claimed_at);
  });

  await test('Seguimiento: la pausa por rebote espera y la baja de correos lo omite para siempre', async()=>{
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: false, email_paused_until: iso(inWindow(31 * DAY) + 5 * DAY) }, ep: SUSP });
    await r.run(); assert.strictEqual(r.net.mails().length, 0);
    const r2 = recovery({ now: inWindow(31 * DAY), profile: { is_member: false, email_opt_out_at: iso(START) }, ep: SUSP });
    await r2.run(); assert.strictEqual(r2.net.mails().length, 0);
    assert.strictEqual(r2.ep().winback1_result, 'skipped');
  });

  await test('Seguimiento 1 vencido (mas de 45 dias sin mandarse): se omite y no se manda tarde', async()=>{
    const r = recovery({ now: inWindow(50 * DAY), profile: { is_member: false }, ep: SUSP });
    await r.run();
    assert.strictEqual(r.net.mails().length, 0);
    assert.strictEqual(r.ep().winback1_result, 'skipped');
  });

  await test('Seguimiento a 2 meses: sale a los 60 dias y es el ultimo; despues el episodio se cierra', async()=>{
    const r = recovery({ now: inWindow(61 * DAY), profile: { is_member: false }, ep: Object.assign({ winback1_at: iso(START + 31 * DAY), winback1_result: 'sent' }, SUSP) });
    await r.run();
    const m = r.net.mails();
    assert.strictEqual(m.length, 1);
    assert.ok(/ltimo mensaje/.test(m[0].subject));
    assert.strictEqual(r.ep().winback2_result, 'sent');
    r.clock.now += HR; await r.run();
    assert.strictEqual(r.net.mails().length, 1);
    assert.strictEqual(r.ep().closed_reason, 'completed');
  });

  await test('Si vuelve a ser miembro (por cualquier via) el episodio se cierra y no se le escribe', async()=>{
    const r = recovery({ now: inWindow(31 * DAY), profile: { is_member: true }, ep: SUSP });
    await r.run();
    assert.strictEqual(r.net.mails().length, 0);
    assert.strictEqual(r.ep().closed_reason, 'member_again');
  });

  await test('Pasadas 72 h con acceso: si solo es Stripe espera a que la tarea lo suspenda; con PayPal o Mercado Pago se cierra', async()=>{
    const r = recovery({ now: inWindow(3 * DAY + 1 * HR) });
    const out = await r.run();
    assert.strictEqual(r.net.mails().length, 0);
    assert.ok(out.json.results['wait:waiting_for_suspension_sweep']);
    const r2 = recovery({ now: inWindow(3 * DAY + 1 * HR), profile: { paypal_subscription_id: 'I-123' } });
    await r2.run(); assert.strictEqual(r2.ep().closed_reason, 'member_again'); assert.strictEqual(r2.net.mails().length, 0);
  });

  await test('Sin correo, o con el perfil borrado, se cierra sin escribir', async()=>{
    const r = recovery({ now: inWindow(4 * DAY), profile: { is_member: false, email: null } });
    await r.run(); assert.strictEqual(r.net.mails().length, 0); assert.strictEqual(r.ep().closed_reason, 'email_unusable');
    const r2 = recovery({ now: inWindow(4 * DAY), profile: { is_member: false } });
    r2.db.tables.profiles.length = 0;
    await r2.run(); assert.strictEqual(r2.net.mails().length, 0); assert.strictEqual(r2.ep().closed_reason, 'no_profile');
  });

  await test('Dos pasadas al mismo tiempo mandan un solo correo', async()=>{
    const r = recovery({ now: inWindow(4 * DAY), profile: { is_member: false } });
    await Promise.all([r.run(), r.run()]);
    assert.strictEqual(r.net.mails().length, 1);
  });

  await test('Si Resend falla no se registra nada, se libera la reserva y la siguiente pasada lo reintenta', async()=>{
    const r = recovery({ now: inWindow(4 * DAY), profile: { is_member: false }, net: { resendFailTimes: 3 } });
    const out = await r.run();
    assert.ok(out.json.results['send_failed:suspended']);
    assert.ok(!r.ep().suspended_at);
    assert.ok(!r.ep().claimed_at);
    const out2 = await r.run();
    assert.strictEqual(out2.json.results['sent:suspended'], 1);
  });

  await test('Simulacion (dry_run): dice que haria, sin mandar ni escribir nada, y no muestra el correo completo', async()=>{
    const r = recovery({ now: START + 50 * HR }); // fuera de horario a proposito: la simulacion lo ignora
    const before = JSON.stringify(r.db.tables);
    const out = await r.run({ dry_run: true });
    assert.strictEqual(out.json.dry_run, true);
    assert.strictEqual(out.json.episodes.length, 1);
    assert.deepStrictEqual(out.json.episodes[0].decision, { action: 'send', step: 'reminder' });
    assert.strictEqual(out.json.episodes[0].email_domain, 'mail.com');
    assert.ok(!JSON.stringify(out.json).includes('gladys@'));
    assert.strictEqual(r.net.mails().length, 0);
    assert.strictEqual(JSON.stringify(r.db.tables), before);
  });

  await test('Los 4 correos: sin rayas largas, sin hablar de saldo, tono amable y un solo texto en negrita (la firma)', async()=>{
    const variants = [
      recovery({ now: START + 58 * HR }),
      recovery({ now: inWindow(4 * DAY), profile: { is_member: false } }),
      recovery({ now: inWindow(31 * DAY), profile: { is_member: false }, ep: SUSP }),
      recovery({ now: inWindow(61 * DAY), profile: { is_member: false }, ep: Object.assign({ winback1_at: iso(START + 31 * DAY), winback1_result: 'sent' }, SUSP) }),
    ];
    for(const v of variants){
      await v.run();
      const m = v.net.mails();
      assert.strictEqual(m.length, 1);
      const t = allText(m[0]);
      assert.ok(!/—/.test(t), 'sin rayas largas');
      assert.ok(!/saldo|fondos|insuficiente|rechaz/i.test(t), 'sin palabras duras: ' + m[0].subject);
      assert.strictEqual((m[0].html.match(/<strong>/g) || []).length, 1, 'solo la firma en negrita');
      assert.ok(!/undefined|null|\$\{/.test(t), 'sin datos sin rellenar');
    }
  });

  /* ---------- stripe-webhook.ts: abre y cierra el seguimiento ---------- */
  console.log('stripe-webhook: abrir y cerrar el seguimiento');
  const T0 = 1800000000, Hs = h => T0 + Math.round(h * 3600);
  function stripe(opts){
    opts = opts || {};
    const db = newDb(), net = newNet({ openInvoice: INV }), clock = { now: Date.now() };
    db.rpcError = !!opts.rpcError;
    db.tables.profiles.push({ id: 'u1', email: 'ana@mail.com', is_member: true, stripe_customer_id: 'cus_1', email_invalid: false });
    const handler = loadFunction('stripe-webhook.ts', db, net, ENV, clock);
    async function send(type, obj, created){
      const body = JSON.stringify({ id: 'evt_' + Math.random(), type, created, data: { object: obj } });
      const t = '1700000000', sig = nodeCrypto.createHmac('sha256', 'whsec_test').update(t + '.' + body).digest('hex');
      return handler(new Request('https://x/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}` }, body }));
    }
    const sub = status => ({ id: 'sub_1', customer: 'cus_1', status, latest_invoice: 'in_1', items: { data: [{ current_period_end: Hs(24 * 30) }] } });
    const calls = name => db.rpcCalls.filter(c => c.name === name);
    return { db, net, send, sub, calls };
  }

  await test('Primer fallo abre el seguimiento UNA vez (los reintentos no), con la fecha del primer fallo', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(24));
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(48));
    const opens = s.calls('payment_recovery_open');
    assert.strictEqual(opens.length, 1);
    assert.strictEqual(JSON.stringify(opens[0].args), JSON.stringify({ p_customer: 'cus_1', p_started: new Date(Hs(0) * 1000).toISOString() }));
    assert.strictEqual(s.db.tables.payment_recovery.length, 1);
  });

  await test('Volver a pagar (active) cierra el seguimiento; un fallo nuevo despues abre otro con sus propios correos', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    await s.send('customer.subscription.updated', s.sub('active'), Hs(30));
    assert.strictEqual(s.calls('payment_recovery_close').length, 1);
    assert.strictEqual(s.db.tables.payment_recovery[0].closed_reason, 'paid');
    s.db.tables.payment_recovery[0].reminder_at = 'x';
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(24 * 30));
    const ep = s.db.tables.payment_recovery[0];
    assert.strictEqual(ep.closed_at, null);
    assert.strictEqual(ep.reminder_at, null, 'episodio nuevo, correos nuevos');
  });

  await test('Una compra nueva (checkout.session.completed) tambien cierra el seguimiento', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    await s.send('checkout.session.completed', { id: 'cs_1', mode: 'subscription', client_reference_id: 'u1', customer: 'cus_1', customer_details: { email: 'ana@mail.com' } }, Hs(10));
    assert.strictEqual(s.db.tables.payment_recovery[0].closed_reason, 'paid');
  });

  await test('Cancelacion definitiva NO cierra el seguimiento (empieza la parte de volver)', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    await s.send('customer.subscription.deleted', s.sub('canceled'), Hs(80));
    assert.strictEqual(s.calls('payment_recovery_close').length, 0);
    assert.strictEqual(s.db.tables.payment_recovery[0].closed_at, null);
  });

  await test('Un aviso viejo de past_due que llega tarde no reabre un episodio ya cerrado', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    await s.send('customer.subscription.updated', s.sub('active'), Hs(30));
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(5));
    assert.strictEqual(s.calls('payment_recovery_open').length, 1);
    assert.ok(s.db.tables.payment_recovery[0].closed_at);
  });

  await test('Fuera de orden: un "active" viejo que llega despues de un past_due mas nuevo NO cierra el seguimiento ni limpia el cobro', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(40));
    await s.send('customer.subscription.updated', s.sub('active'), Hs(30));
    const p = s.db.tables.profiles[0];
    assert.strictEqual(s.calls('payment_recovery_close').length, 0);
    assert.strictEqual(s.db.tables.payment_recovery[0].closed_at, null);
    assert.strictEqual(p.payment_failed_at, new Date(Hs(0) * 1000).toISOString());
  });

  await test('Fuera de orden: un past_due viejo que llega despues de la cancelacion no abre seguimiento ni da acceso', async()=>{
    const s = stripe();
    await s.send('customer.subscription.deleted', s.sub('canceled'), Hs(80));
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    assert.strictEqual(s.calls('payment_recovery_open').length, 0);
    assert.strictEqual(s.db.tables.payment_recovery.length, 0);
    assert.strictEqual(s.db.tables.profiles[0].is_member, false);
  });

  await test('Pago tras la pausa (acceso ya quitado): invoice.paid se ignora y customer.subscription.updated(active) devuelve el acceso y cierra el seguimiento', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    const p = s.db.tables.profiles[0];
    p.is_member = false; // la pausa de las 72 h ya quito el acceso premium
    const antes = JSON.stringify(p);
    const r1 = await s.send('invoice.paid', { id: 'in_1', customer: 'cus_1', subscription: 'sub_1', status: 'paid' }, Hs(24 * 5));
    assert.strictEqual(r1.status, 200);
    assert.strictEqual(JSON.stringify(p), antes, 'invoice.paid por si solo no cambia nada (el acceso lo devuelve el aviso de la suscripcion)');
    assert.strictEqual(s.db.tables.payment_recovery[0].closed_at, null);
    const r2 = await s.send('customer.subscription.updated', s.sub('active'), Hs(24 * 5 + 0.01));
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(p.is_member, true, 'acceso premium devuelto');
    assert.strictEqual(p.payment_failed_at, null);
    assert.strictEqual(s.db.tables.payment_recovery[0].closed_reason, 'paid');
    assert.ok(s.db.tables.payment_recovery[0].closed_at);
  });

  await test('Si la migracion aun no esta aplicada (rpc falla), el webhook sigue igual: acceso, fecha y correo de pago fallido', async()=>{
    const s = stripe({ rpcError: true });
    const r = await s.send('customer.subscription.updated', s.sub('past_due'), Hs(0));
    assert.strictEqual(r.status, 200);
    const p = s.db.tables.profiles[0];
    assert.strictEqual(p.is_member, true);
    assert.strictEqual(p.payment_failed_at, new Date(Hs(0) * 1000).toISOString());
    assert.strictEqual(s.net.mails().length, 1);
    const r2 = await s.send('customer.subscription.updated', s.sub('active'), Hs(30));
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(p.payment_failed_at, null);
  });

  console.log(`\n${passed} ok, ${failed} fallan`);
  process.exit(failed ? 1 : 0);
})();
