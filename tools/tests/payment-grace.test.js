#!/usr/bin/env node
/* Pruebas de la gracia por cobro fallido (Stripe), la reactivacion de PayPal y la exclusion de campanas.
   TODO simulado: base de datos en memoria, Stripe, PayPal y Resend falsos. NO hace cobros ni manda correos reales.
   Corre con:  node tools/tests/payment-grace.test.js   (desde la carpeta inglesconLeo)
   Necesita el paquete "typescript" de node_modules (ya esta). La parte de SQL usa PGlite si esta disponible
   (npm i --no-save @electric-sql/pglite, o LEO_PGLITE_DIR=<carpeta que lo tiene>); si no, esa parte se omite. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert'), nodeCrypto = require('crypto');
const { createRequire } = require('module'), { pathToFileURL } = require('url');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); }
}

/* ---------- Base de datos falsa (misma forma que usan los webhooks) ---------- */
function newDb(opts){
  const db = { rows: [], missing: new Set((opts && opts.missing) || []) };
  db.client = {
    from(){ return new Query(db); },
    rpc(){ return Promise.resolve({ data: null, error: null }); },
  };
  return db;
}
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
function Query(db){ this.db = db; this.filters = []; this.cols = []; this.mode = 'select'; this.wantRows = false; }
Query.prototype = {
  select(c){ if(this.mode === 'select'){ this.cols = String(c || '').split(',').map(s => s.trim()).filter(Boolean); } else this.wantRows = true; return this; },
  update(p){ this.mode = 'update'; this.payload = p; return this; },
  upsert(p){ this.mode = 'upsert'; this.payload = p; return this; },
  eq(c, v){ this.fcols = (this.fcols || []).concat(c); this.filters.push(r => r[c] === v); return this; },
  is(c, v){ this.fcols = (this.fcols || []).concat(c); this.filters.push(r => v === null ? r[c] == null : r[c] === v); return this; },
  not(c, op, v){ this.fcols = (this.fcols || []).concat(c); this.filters.push(r => (op === 'is' && v === null) ? r[c] != null : true); return this; },
  gte(c, v){ this.fcols = (this.fcols || []).concat(c); this.filters.push(r => r[c] != null && r[c] >= v); return this; },
  limit(){ return this; },
  or(s){ const cs = parseOr(s); this.fcols = (this.fcols || []).concat(s.split(',').map(x => x.split('.')[0])); this.filters.push(r => cs.some(f => f(r))); return this; },
  maybeSingle(){ this.single = true; return this.exec(); },
  then(a, b){ return this.exec().then(a, b); },
  async exec(){
    const db = this.db;
    const touched = [...this.cols, ...(this.fcols || []), ...(this.payload ? Object.keys(this.payload) : [])];
    const bad = touched.find(c => db.missing.has(c));
    if(bad) return { data: null, error: { code: '42703', message: 'column profiles.' + bad + ' does not exist' } };
    const match = db.rows.filter(r => this.filters.every(f => f(r)));
    if(this.mode === 'update'){
      match.forEach(r => Object.assign(r, this.payload));
      return { data: this.wantRows ? match.map(r => ({ id: r.id })) : null, error: null };
    }
    if(this.mode === 'upsert'){
      const ex = db.rows.find(r => r.id === this.payload.id);
      if(ex) Object.assign(ex, this.payload); else db.rows.push(Object.assign({}, this.payload));
      return { data: null, error: null };
    }
    const out = match.map(r => { const o = {}; (this.cols.length ? this.cols : Object.keys(r)).forEach(c => { o[c] = r[c]; }); o.id = r.id; return o; });
    if(this.single) return { data: out[0] || null, error: null };
    return { data: out, error: null };
  },
};

/* ---------- Proveedores falsos ---------- */
function newNet(cfg){
  const net = Object.assign({ resendOk: true, invoices: {}, paypalSubs: {}, paypalDown: false, calls: [] }, cfg || {});
  net.emails = () => net.calls.filter(c => c.url.includes('api.resend.com')).map(c => JSON.parse(c.body));
  net.fetch = async (url, init) => {
    url = String(url); init = init || {};
    net.calls.push({ url, body: init.body || '' });
    const J = (obj, status) => ({ ok: (status || 200) < 300, status: status || 200, json: async () => obj, text: async () => JSON.stringify(obj) });
    if(url.includes('api.resend.com')) return net.resendOk ? J({ id: 'e1' }) : J({ error: 'x' }, 500);
    const inv = /api\.stripe\.com\/v1\/invoices\/(.+)$/.exec(url);
    if(inv) return net.invoices[inv[1]] ? J(net.invoices[inv[1]]) : J({}, 404);
    if(url.includes('/v1/oauth2/token')) return net.paypalDown ? J({}, 500) : J({ access_token: 'tok' });
    if(url.includes('verify-webhook-signature')) return J({ verification_status: 'SUCCESS' });
    const sub = /\/v1\/billing\/subscriptions\/(.+)$/.exec(url);
    if(sub) return (net.paypalDown || !net.paypalSubs[sub[1]]) ? J({}, net.paypalDown ? 500 : 404) : J(net.paypalSubs[sub[1]]);
    if(url.includes('graph.facebook.com')) return J({});
    return J({}, 404);
  };
  return net;
}

/* ---------- Carga el .ts real de la funcion en una caja con Deno simulado ---------- */
function loadFunction(file, db, net, env){
  let src = read('supabase_functions/' + file).replace(/^import \{ createClient \} from .*$/m, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  let handler = null;
  const sandbox = {
    Deno: { env: { get: k => (env || {})[k] }, serve: fn => { handler = fn; } },
    createClient: () => db.client, fetch: net.fetch, Response, Request, URL, crypto: nodeCrypto.webcrypto, TextEncoder, btoa,
    AbortSignal, console: { log(){}, error(){} }, setTimeout, clearTimeout, Promise, JSON, Date, Math, Set, Map, Object, Array, String, Number, Error, parseFloat, parseInt, encodeURIComponent, Uint8Array,
  };
  sandbox.globalThis = sandbox; sandbox.exports = {};
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { filename: file });
  return handler;
}

/* ---------- STRIPE ---------- */
const T0 = 1800000000; // segundos
const H = h => T0 + Math.round(h * 3600);
const WH_SECRET = 'whsec_test';
const STRIPE_ENV = { STRIPE_WEBHOOK_SECRET: WH_SECRET, SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'k', RESEND_API_KEY: 'r', STRIPE_SECRET_KEY: 'sk_test' };
const INV_OK = { id: 'in_1', customer: 'cus_1', status: 'open', hosted_invoice_url: 'https://invoice.stripe.com/i/acct_1/test_abc123' };
function stripe(opts){
  const db = newDb(opts), net = newNet(Object.assign({ invoices: { in_1: INV_OK } }, opts && opts.net));
  db.rows.push(Object.assign({ id: 'u1', email: 'ana@mail.com', is_member: true, stripe_customer_id: 'cus_1', email_invalid: false }, opts && opts.row));
  const handler = loadFunction('stripe-webhook.ts', db, net, STRIPE_ENV);
  const row = () => db.rows.find(r => r.id === 'u1');
  async function send(type, obj, created){
    const body = JSON.stringify({ id: 'evt_' + Math.random(), type, created, data: { object: obj } });
    const t = '1700000000', sig = nodeCrypto.createHmac('sha256', WH_SECRET).update(t + '.' + body).digest('hex');
    return handler(new Request('https://x/stripe-webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}` }, body }));
  }
  const sub = (status, extra) => Object.assign({ id: 'sub_1', customer: 'cus_1', status, latest_invoice: 'in_1', items: { data: [{ current_period_end: H(24 * 30) }] } }, extra);
  return { db, net, row, send, sub };
}
const iso = s => new Date(s * 1000).toISOString();
/* Replica en JS la tarea SQL (la version real se prueba aparte con PGlite) */
function sweepJs(row, nowSec, hours){
  if(row.is_member && row.payment_failed_at && Date.parse(row.payment_failed_at) <= (nowSec - hours * 3600) * 1000 && !row.paypal_subscription_id && !row.mp_preapproval_id) row.is_member = false;
}

(async()=>{
  console.log('Stripe: pago fallido, gracia de 72 h, suspension y recuperacion');

  await test('Primer fallo (past_due): conserva el acceso, guarda la fecha del primer fallo y manda UN correo con enlace seguro', async()=>{
    const s = stripe();
    const r = await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    assert.strictEqual(r.status, 200);
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.row().payment_failed_at, iso(H(0)));
    const mails = s.net.emails();
    assert.strictEqual(mails.length, 1);
    assert.deepStrictEqual(mails[0].to, ['ana@mail.com']);
    assert.ok(mails[0].html.includes('https://invoice.stripe.com/i/acct_1/test_abc123'), 'debe llevar el enlace de la factura');
    assert.ok(mails[0].html.includes('Actualizar mi método de pago'));
    assert.ok(mails[0].html.includes('3 días'));
    assert.ok(!/—/.test(mails[0].html + mails[0].subject), 'sin rayas largas');
    assert.ok(s.row().payment_failed_email_sent_at);
  });

  await test('Los reintentos NO reinician el plazo ni repiten el correo', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    await s.send('customer.subscription.updated', s.sub('past_due'), H(20));
    await s.send('customer.subscription.updated', s.sub('past_due'), H(48));
    assert.strictEqual(s.row().payment_failed_at, iso(H(0)));
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.net.emails().length, 1);
  });

  await test('Dos avisos identicos al mismo tiempo mandan un solo correo', async()=>{
    const s = stripe();
    await Promise.all([
      s.send('customer.subscription.updated', s.sub('past_due'), H(0)),
      s.send('customer.subscription.updated', s.sub('past_due'), H(0)),
    ]);
    assert.strictEqual(s.net.emails().length, 1);
    assert.strictEqual(s.row().payment_failed_at, iso(H(0)));
  });

  await test('Antes de 72 h sigue activo; pasadas 72 h sin cobrar se suspende', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    sweepJs(s.row(), H(71), 72);  assert.strictEqual(s.row().is_member, true, 'a las 71 h aun tiene acceso');
    sweepJs(s.row(), H(72.5), 72); assert.strictEqual(s.row().is_member, false, 'a las 72.5 h se suspende');
    assert.ok(s.row().payment_failed_at, 'queda marcada: sigue con cobro pendiente');
  });

  await test('Recuperacion DENTRO de la gracia: sigue miembro, se limpia todo y un fallo futuro avisa de nuevo', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    await s.send('customer.subscription.updated', s.sub('active'), H(30));
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.row().payment_failed_at, null);
    assert.strictEqual(s.row().payment_failed_email_sent_at, null);
    sweepJs(s.row(), H(200), 72); assert.strictEqual(s.row().is_member, true, 'ya no hay nada que suspender');
    await s.send('customer.subscription.updated', s.sub('past_due'), H(24 * 30));
    assert.strictEqual(s.net.emails().length, 2, 'el segundo episodio tiene su propio aviso');
    assert.strictEqual(s.row().payment_failed_at, iso(H(24 * 30)));
  });

  await test('Recuperacion DESPUES de la suspension: vuelve a ser miembro automaticamente', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    sweepJs(s.row(), H(80), 72);
    assert.strictEqual(s.row().is_member, false);
    await s.send('customer.subscription.updated', s.sub('active'), H(90));
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.row().payment_failed_at, null);
  });

  await test('Un past_due tardio despues de la suspension NO la revierte', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    sweepJs(s.row(), H(80), 72);
    await s.send('customer.subscription.updated', s.sub('past_due'), H(85));
    assert.strictEqual(s.row().is_member, false);
    assert.strictEqual(s.row().payment_failed_at, iso(H(0)));
    assert.strictEqual(s.net.emails().length, 1);
  });

  await test('Cancelacion definitiva: SIN gracia (deleted, canceled e incomplete_expired quitan el acceso al instante)', async()=>{
    for(const [type, status] of [['customer.subscription.deleted', 'canceled'], ['customer.subscription.updated', 'canceled'], ['customer.subscription.updated', 'incomplete_expired']]){
      const s = stripe();
      await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
      assert.strictEqual(s.row().is_member, true);
      await s.send(type, s.sub(status), H(5));
      assert.strictEqual(s.row().is_member, false, type + '/' + status);
      assert.strictEqual(s.row().payment_failed_at, null, 'se limpia el cobro pendiente');
    }
    const s2 = stripe();  // cancelar estando al corriente tambien es inmediato
    await s2.send('customer.subscription.deleted', s2.sub('canceled'), H(1));
    assert.strictEqual(s2.row().is_member, false);
  });

  await test("Estado 'unpaid' (reintentos agotados): sin acceso, pero queda marcada como cobro pendiente", async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('unpaid'), H(100));
    assert.strictEqual(s.row().is_member, false);
    assert.strictEqual(s.row().payment_failed_at, iso(H(100)));
  });

  await test('Renovacion normal: sin cambios de acceso, guarda la fecha de renovacion y no manda ningun correo', async()=>{
    const s = stripe({ row: { next_renewal_at: null } });
    await s.send('customer.subscription.updated', s.sub('active'), H(10));
    await s.send('customer.subscription.updated', s.sub('active'), H(24 * 30));
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.row().next_renewal_at, iso(H(24 * 30)));
    assert.strictEqual(s.row().payment_failed_at, null);
    assert.strictEqual(s.net.emails().length, 0);
    assert.strictEqual(s.net.calls.length, 0, 'no llama a ningun servicio externo');
  });

  await test("'trialing' tambien cuenta como activo", async()=>{
    const s = stripe({ row: { is_member: false } });
    await s.send('customer.subscription.updated', s.sub('trialing'), H(1));
    assert.strictEqual(s.row().is_member, true);
  });

  await test('Un aviso VIEJO que llega tarde no pisa una recuperacion ya aplicada', async()=>{
    const s = stripe();
    await s.send('customer.subscription.updated', s.sub('active'), H(50));
    await s.send('customer.subscription.updated', s.sub('past_due'), H(10)); // enviado antes, entregado despues
    assert.strictEqual(s.row().payment_failed_at, null);
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.net.emails().length, 0);
    await s.send('customer.subscription.deleted', s.sub('canceled'), H(20));  // cancelacion vieja tampoco pisa
    assert.strictEqual(s.row().is_member, true);
  });

  await test('Una compra nueva (checkout) limpia el cobro fallido anterior', async()=>{
    const s = stripe({ row: { is_member: false, payment_failed_at: iso(H(0)), payment_failed_email_sent_at: iso(H(0)) } });
    await s.send('checkout.session.completed', { id: 'cs_1', mode: 'subscription', client_reference_id: 'u1', customer: 'cus_1', amount_total: 200, currency: 'usd', customer_details: { email: 'ana@mail.com' } }, H(200));
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.row().payment_failed_at, null);
    assert.strictEqual(s.row().payment_failed_email_sent_at, null);
  });

  await test('Firma falsa: 400 y no cambia nada', async()=>{
    const s = stripe();
    const h = loadFunction('stripe-webhook.ts', s.db, s.net, STRIPE_ENV);
    const r = await h(new Request('https://x', { method: 'POST', headers: { 'Stripe-Signature': 't=1,v1=00' }, body: JSON.stringify({ type: 'customer.subscription.deleted', data: { object: s.sub('canceled') } }) }));
    assert.strictEqual(r.status, 400);
    assert.strictEqual(s.row().is_member, true);
  });

  console.log('Stripe: correo de pago fallido');

  await test('Enlace no confiable (factura de otro cliente, ya pagada o dominio ajeno): el correo sale SIN boton', async()=>{
    for(const bad of [
      Object.assign({}, INV_OK, { customer: 'cus_OTRO' }),
      Object.assign({}, INV_OK, { status: 'paid' }),
      Object.assign({}, INV_OK, { hosted_invoice_url: 'https://evil.example.com/pay' }),
      Object.assign({}, INV_OK, { hosted_invoice_url: 'https://invoice.stripe.com.evil.com/x' }),
      Object.assign({}, INV_OK, { hosted_invoice_url: 'javascript:alert(1)' }),
    ]){
      const s = stripe({ net: { invoices: { in_1: bad } } });
      await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
      const m = s.net.emails();
      assert.strictEqual(m.length, 1);
      assert.ok(!m[0].html.includes('<a '), 'sin enlace: ' + bad.hosted_invoice_url);
      assert.ok(m[0].html.includes('responde a este correo'));
    }
  });

  await test('Si Stripe no responde con la factura, igual avisa (sin boton) y el acceso no se afecta', async()=>{
    const s = stripe({ net: { invoices: {} } });
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    assert.strictEqual(s.net.emails().length, 1);
    assert.strictEqual(s.row().is_member, true);
  });

  await test('Si Resend falla, el acceso no se afecta y el aviso se reintenta en el siguiente evento', async()=>{
    const s = stripe({ net: { resendOk: false } });
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.row().payment_failed_email_sent_at, undefined);
    assert.strictEqual(s.row().payment_failed_email_claimed_at, null, 'la reserva se libera');
    s.net.resendOk = true;
    await s.send('customer.subscription.updated', s.sub('past_due'), H(24));
    assert.ok(s.row().payment_failed_email_sent_at, 'se manda al reintentar');
    assert.strictEqual(s.row().payment_failed_at, iso(H(0)), 'el plazo sigue contando desde el primer fallo');
  });

  await test('Correo rebotado (email_invalid): no se manda, pero la gracia funciona igual', async()=>{
    const s = stripe({ row: { email_invalid: true } });
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    assert.strictEqual(s.net.emails().length, 0);
    assert.strictEqual(s.row().payment_failed_at, iso(H(0)));
  });

  await test('Quien se dio de baja de correos de practica igual recibe el aviso de cobro (es un correo de la cuenta)', async()=>{
    const s = stripe({ row: { email_opt_out_at: iso(H(-100)) } });
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    assert.strictEqual(s.net.emails().length, 1);
  });

  console.log('Stripe: migracion todavia sin aplicar (columnas nuevas inexistentes)');
  const NEW_COLS = ['payment_failed_at', 'payment_failed_email_sent_at', 'payment_failed_email_claimed_at', 'stripe_event_at'];

  await test('Renovacion normal sigue funcionando igual que antes', async()=>{
    const s = stripe({ missing: NEW_COLS });
    await s.send('customer.subscription.updated', s.sub('active'), H(5));
    assert.strictEqual(s.row().is_member, true);
    assert.strictEqual(s.row().next_renewal_at, iso(H(24 * 30)));
  });
  await test('past_due vuelve al comportamiento anterior (sin acceso) en vez de dejar acceso sin limite', async()=>{
    const s = stripe({ missing: NEW_COLS });
    await s.send('customer.subscription.updated', s.sub('past_due'), H(0));
    assert.strictEqual(s.row().is_member, false);
  });
  await test('Cancelar sigue quitando el acceso', async()=>{
    const s = stripe({ missing: NEW_COLS });
    await s.send('customer.subscription.deleted', s.sub('canceled'), H(0));
    assert.strictEqual(s.row().is_member, false);
  });
  await test('La compra nueva (checkout) activa igual aunque falten las columnas', async()=>{
    const s = stripe({ missing: NEW_COLS, row: { is_member: false } });
    await s.send('checkout.session.completed', { id: 'cs_9', mode: 'subscription', client_reference_id: 'u1', customer: 'cus_1', amount_total: 200, currency: 'usd', customer_details: { email: 'ana@mail.com' } }, H(1));
    assert.strictEqual(s.row().is_member, true);
  });

  /* ---------- PAYPAL ---------- */
  console.log('PayPal: suspension y reactivacion');
  const PP_ENV = { PAYPAL_CLIENT_ID: 'c', PAYPAL_CLIENT_SECRET: 's', PAYPAL_WEBHOOK_ID: 'w', PAYPAL_MODE: 'live', SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'k', RESEND_API_KEY: 'r', PAYPAL_PLAN_ID: 'P-PLAN' };
  const PP_SUB = { id: 'I-SUB1', status: 'ACTIVE', plan_id: 'P-PLAN', billing_info: { next_billing_time: '2026-12-01T10:00:00Z' } };
  function paypal(opts){
    const db = newDb(opts), net = newNet(Object.assign({ paypalSubs: { 'I-SUB1': PP_SUB } }, opts && opts.net));
    db.rows.push(Object.assign({ id: 'u1', email: 'ana@mail.com', is_member: true, paypal_subscription_id: 'I-SUB1' }, opts && opts.row));
    const handler = loadFunction('paypal-webhook.ts', db, net, Object.assign({}, PP_ENV, opts && opts.env));
    const row = () => db.rows.find(r => r.id === 'u1');
    const send = (type, resource) => handler(new Request('https://x/paypal-webhook', { method: 'POST', body: JSON.stringify({ event_type: type, resource }),
      headers: { 'paypal-transmission-id': 'a', 'paypal-transmission-time': 'b', 'paypal-cert-url': 'c', 'paypal-auth-algo': 'd', 'paypal-transmission-sig': 'e' } }));
    return { db, net, row, send };
  }

  await test('Suspension -> RE-ACTIVATED: recupera la membresia y refresca la renovacion', async()=>{
    const p = paypal();
    await p.send('BILLING.SUBSCRIPTION.SUSPENDED', { id: 'I-SUB1' });
    assert.strictEqual(p.row().is_member, false);
    const r = await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-SUB1' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(p.row().is_member, true);
    assert.strictEqual(p.row().next_renewal_at, '2026-12-01T10:00:00Z');
    assert.strictEqual(p.net.emails().length, 0, 'no es un miembro nuevo: sin bienvenida');
    assert.ok(!p.net.calls.some(c => c.url.includes('graph.facebook.com')), 'sin evento de Meta');
  });
  await test('Aviso RE-ACTIVATED pero PayPal dice que NO esta activa (aviso viejo o suspendida otra vez): no reactiva', async()=>{
    for(const status of ['SUSPENDED', 'CANCELLED', 'EXPIRED', 'APPROVAL_PENDING']){
      const p = paypal({ row: { is_member: false }, net: { paypalSubs: { 'I-SUB1': Object.assign({}, PP_SUB, { status }) } } });
      await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-SUB1' });
      assert.strictEqual(p.row().is_member, false, status);
    }
  });
  await test('Suscripcion desconocida (ningun perfil la tiene): no crea perfiles ni cambia a nadie', async()=>{
    const p = paypal({ row: { is_member: false }, net: { paypalSubs: { 'I-OTRA': Object.assign({}, PP_SUB, { id: 'I-OTRA' }) } } });
    const r = await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-OTRA', custom_id: 'u-inventado' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(p.db.rows.length, 1);
    assert.strictEqual(p.row().is_member, false);
  });
  await test('Plan que no es el de la tienda: no reactiva', async()=>{
    const p = paypal({ row: { is_member: false }, net: { paypalSubs: { 'I-SUB1': Object.assign({}, PP_SUB, { plan_id: 'P-OTRO' }) } } });
    await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-SUB1' });
    assert.strictEqual(p.row().is_member, false);
  });
  await test('PayPal no responde: contesta 503 para que PayPal reintente, sin cambiar nada', async()=>{
    const p = paypal({ row: { is_member: false } });
    p.net.paypalSubs = {};   // la firma se acepta, pero la consulta de la suscripcion falla
    const r = await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-SUB1' });
    assert.strictEqual(r.status, 503);
    assert.strictEqual(p.row().is_member, false);
  });
  await test('Reactivacion repetida (ya es miembro): sigue siendo miembro', async()=>{
    const p = paypal();
    await p.send('BILLING.SUBSCRIPTION.RE-ACTIVATED', { id: 'I-SUB1' });
    assert.strictEqual(p.row().is_member, true);
  });
  await test('Cancelaciones, suspensiones y expiraciones siguen quitando el acceso', async()=>{
    for(const t of ['BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.EXPIRED']){
      const p = paypal(); await p.send(t, { id: 'I-SUB1' });
      assert.strictEqual(p.row().is_member, false, t);
    }
  });
  await test('Cobro normal (PAYMENT.SALE.COMPLETED) solo refresca la fecha: no toca is_member', async()=>{
    const p = paypal();
    await p.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    assert.strictEqual(p.row().is_member, true);
    assert.strictEqual(p.row().next_renewal_at, '2026-12-01T10:00:00Z');
    const p2 = paypal({ row: { is_member: false } });
    await p2.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    assert.strictEqual(p2.row().is_member, false);
  });
  await test('Cobro mensual: next_renewal_at usa la fecha real de PayPal y avanza mes a mes', async()=>{
    const p = paypal({ row: { next_renewal_at: '2026-11-01T10:00:00Z' } });
    await p.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1', state: 'completed' });
    assert.strictEqual(p.row().next_renewal_at, '2026-12-01T10:00:00Z', 'exactamente lo que devolvio PayPal');
    assert.strictEqual(p.row().is_member, true);
    assert.ok(p.net.calls.some(c => c.url.includes('/v1/billing/subscriptions/I-SUB1')), 'consulta a PayPal, no calcula');
  });
  await test('Aviso repetido o atrasado: no devuelve la fecha a una anterior ni la reescribe', async()=>{
    // PayPal ya dice 2026-12-01, pero el perfil ya tiene una fecha MAS NUEVA (otro aviso mas reciente ya la guardo)
    const p = paypal({ row: { next_renewal_at: '2027-01-01T10:00:00Z' } });
    await p.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    assert.strictEqual(p.row().next_renewal_at, '2027-01-01T10:00:00Z');
    // repetido con la misma fecha: queda igual
    const q = paypal({ row: { next_renewal_at: '2026-12-01T10:00:00Z' } });
    await q.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    await q.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    assert.strictEqual(q.row().next_renewal_at, '2026-12-01T10:00:00Z');
  });
  await test('Cobro sin fecha valida de PayPal, sin suscripcion o sin billing_agreement_id: no escribe nada ni toca is_member', async()=>{
    const a = paypal({ row: { next_renewal_at: '2026-11-01T10:00:00Z' }, net: { paypalSubs: { 'I-SUB1': { id: 'I-SUB1', status: 'ACTIVE', plan_id: 'P-PLAN', billing_info: {} } } } });
    await a.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    assert.strictEqual(a.row().next_renewal_at, '2026-11-01T10:00:00Z');
    const b = paypal({ row: { next_renewal_at: '2026-11-01T10:00:00Z' }, net: { paypalSubs: { 'I-SUB1': { id: 'I-SUB1', status: 'ACTIVE', billing_info: { next_billing_time: 'basura' } } } } });
    await b.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    assert.strictEqual(b.row().next_renewal_at, '2026-11-01T10:00:00Z');
    const c = paypal({ row: { next_renewal_at: '2026-11-01T10:00:00Z' } });
    c.net.paypalSubs = {};
    const r = await c.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-SUB1' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(c.row().next_renewal_at, '2026-11-01T10:00:00Z');
    const d = paypal({ row: { next_renewal_at: '2026-11-01T10:00:00Z' } });
    await d.send('PAYMENT.SALE.COMPLETED', {});
    assert.strictEqual(d.row().next_renewal_at, '2026-11-01T10:00:00Z');
    for(const x of [a, b, c, d]) assert.strictEqual(x.row().is_member, true);
  });
  await test('Cobro de una suscripcion ajena (ningun perfil): no crea ni cambia perfiles', async()=>{
    const p = paypal({ net: { paypalSubs: { 'I-OTRA': Object.assign({}, PP_SUB, { id: 'I-OTRA' }) } } });
    await p.send('PAYMENT.SALE.COMPLETED', { billing_agreement_id: 'I-OTRA' });
    assert.strictEqual(p.db.rows.length, 1);
    assert.strictEqual(p.row().next_renewal_at, undefined);
  });
  await test('Activacion nueva (ACTIVATED) sigue igual: activa y manda bienvenida', async()=>{
    const p = paypal({ row: { is_member: false, member_welcome_sent_at: null } });
    await p.send('BILLING.SUBSCRIPTION.ACTIVATED', { id: 'I-SUB1', custom_id: 'u1', subscriber: { email_address: 'ana@mail.com' }, billing_info: { last_payment: { amount: { value: '2.00', currency_code: 'USD' } } } });
    assert.strictEqual(p.row().is_member, true);
    assert.strictEqual(p.net.emails().length, 1);
  });

  /* ---------- Campanas de conversion ---------- */
  console.log('Campanas de "hazte miembro": exclusion de cobros pendientes');
  const nudgeSrc = read('supabase_functions/upgrade-nudge-emails.ts');
  const block = nudgeSrc.slice(nudgeSrc.indexOf('const PENDING_PAYMENT_MAX_DAYS'), nudgeSrc.indexOf('// Vuelve a leer is_member y lifecycle_emails EN ESTE MOMENTO'));
  function nudgeFns(db){
    const sb = { supabase: db.client, Date, Set, Map, Object, Promise };
    vm.createContext(sb);
    vm.runInContext(ts.transpileModule(block + '\nglobalThis.__f = { loadPendingPaymentIds, hasPendingPayment };', { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, sb);
    return sb.__f;
  }
  const ago = d => new Date(Date.now() - d * 86400000).toISOString();
  await test('Cobro pendiente reciente: excluido; sin cobro pendiente o muy viejo (45+ dias): no', async()=>{
    const db = newDb();
    db.rows.push({ id: 'a', payment_failed_at: ago(2) }, { id: 'b', payment_failed_at: null }, { id: 'c', payment_failed_at: ago(60) }, { id: 'd' });
    const f = nudgeFns(db);
    const ids = await f.loadPendingPaymentIds();
    assert.deepStrictEqual([...ids], ['a']);
    assert.strictEqual(await f.hasPendingPayment('a'), true);
    for(const id of ['b', 'c', 'd', 'zzz']) assert.strictEqual(await f.hasPendingPayment(id), false, id);
  });
  await test('Si la migracion no esta aplicada, no excluye a nadie y no rompe el envio', async()=>{
    const db = newDb({ missing: ['payment_failed_at'] });
    db.rows.push({ id: 'a' });
    const f = nudgeFns(db);
    assert.strictEqual((await f.loadPendingPaymentIds()).size, 0);
    assert.strictEqual(await f.hasPendingPayment('a'), false);
  });
  await test('El codigo aplica la exclusion en el barrido y justo antes de cada envio (no en envios manuales ni de miembros)', async()=>{
    assert.ok(/if \(pendingPaymentIds\.has\(p\.id\)\) continue/.test(nudgeSrc));
    assert.ok(/if \(!manual && !expectedIsMember && \(await hasPendingPayment\(userId\)\)\) return false/.test(nudgeSrc));
  });
  await test('Las dos copias de upgrade-nudge-emails (supabase_functions y supabase/functions) son identicas', async()=>{
    assert.strictEqual(nudgeSrc, read('supabase/functions/upgrade-nudge-emails/index.ts'));
  });

  console.log('Mercado Pago: sin cambios');
  await test('mp-webhook.ts no menciona la gracia ni las columnas nuevas', async()=>{
    const mp = read('supabase_functions/mp-webhook.ts');
    for(const w of ['payment_failed', 'stripe_event_at', 'RE-ACTIVATED', 'PAYMENT_GRACE']) assert.ok(!mp.includes(w), w);
  });

  /* ---------- SQL real (PGlite) ---------- */
  console.log('Base de datos: tarea que suspende a las 72 h (SQL real)');
  async function loadPglite(){
    for(const d of [process.env.LEO_PGLITE_DIR, process.cwd(), __dirname, root].filter(Boolean)){
      try{ const p = createRequire(path.join(d, 'x.js')).resolve('@electric-sql/pglite'); const m = await import(pathToFileURL(p).href); return m.PGlite || (m.default && m.default.PGlite); }catch(e){ /* sigue */ }
    }
    return null;
  }
  const PGlite = await loadPglite();
  if(!PGlite){ console.log('  omitida: instala @electric-sql/pglite (npm i --no-save @electric-sql/pglite) o define LEO_PGLITE_DIR'); }
  else {
    const mig = read('supabase/migrations/20261020160000_payment_grace.sql');
    async function freshSql(){
      const db = new PGlite();
      await db.exec(`create role anon; create role authenticated;
        create table public.profiles (id text primary key, is_member boolean not null default false, paypal_subscription_id text, mp_preapproval_id text);`);
      await db.exec(mig);
      return db;
    }
    const ins = (db, id, o) => db.query('insert into public.profiles (id,is_member,payment_failed_at,paypal_subscription_id,mp_preapproval_id) values ($1,$2,$3,$4,$5)', [id, o.m !== false, o.at || null, o.pp || null, o.mp || null]);
    const hrs = h => new Date(Date.now() - h * 3600e3).toISOString();
    const state = async db => Object.fromEntries((await db.query('select id,is_member from public.profiles')).rows.map(r => [r.id, r.is_member]));

    await test('La migracion se aplica dos veces sin error (idempotente) y no suspende a nadie al aplicarse', async()=>{
      const db = await freshSql();
      await ins(db, 'x', { at: hrs(100) });
      await db.exec(mig);
      assert.strictEqual((await state(db)).x, true);
    });
    await test('Suspende solo a quien pasa de 72 h con el cobro fallido; respeta a los demas', async()=>{
      const db = await freshSql();
      await ins(db, 'a_71h', { at: hrs(71) });
      await ins(db, 'b_73h', { at: hrs(73) });
      await ins(db, 'c_sin_fallo', {});
      await ins(db, 'd_ya_no_miembro', { m: false, at: hrs(200) });
      await ins(db, 'e_paypal', { at: hrs(200), pp: 'I-1' });
      await ins(db, 'f_mp', { at: hrs(200), mp: 'mp1' });
      const n = (await db.query('select public.suspend_expired_payment_grace(72) as n')).rows[0].n;
      const st = await state(db);
      assert.strictEqual(n, 1);
      assert.deepStrictEqual([st.a_71h, st.b_73h, st.c_sin_fallo, st.e_paypal, st.f_mp], [true, false, true, true, true]);
      const fecha = (await db.query("select payment_failed_at from public.profiles where id='b_73h'")).rows[0].payment_failed_at;
      assert.ok(fecha, 'conserva payment_failed_at (sigue excluido de campanas)');
    });
    await test('Ejecutarla otra vez no cambia nada; un usuario normal no puede llamarla', async()=>{
      const db = await freshSql();
      await ins(db, 'b', { at: hrs(73) });
      await db.query('select public.suspend_expired_payment_grace(72)');
      assert.strictEqual((await db.query('select public.suspend_expired_payment_grace(72) as n')).rows[0].n, 0);
      await db.exec('set role authenticated');
      let denied = false;
      try{ await db.query('select public.suspend_expired_payment_grace(72)'); }catch(e){ denied = /permission denied/.test(e.message); }
      assert.ok(denied, 'authenticated no tiene permiso para ejecutarla');
    });
  }

  console.log('\n' + passed + ' pruebas PASS' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
