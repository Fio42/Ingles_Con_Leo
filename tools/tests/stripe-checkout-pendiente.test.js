#!/usr/bin/env node
/* Checkouts de membresia (Stripe, PayPal y Mercado Pago): cuenta ligada a Stripe (2026-11-16).
   - Renovacion pendiente en Stripe -> { pending_payment_url } y NO se abre otra membresia.
   - Cuenta ligada a Stripe y Stripe no responde (500, red, tiempo, clave ausente, lectura de perfil, pendiente sin enlace)
     -> 503 { error:'stripe_unavailable' } y NO se abre nada.
   - Altas nuevas (sin stripe_customer_id) y cuentas con Stripe sin pendientes -> flujo normal. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const compile = f => ts.transpileModule(fs.readFileSync(path.join(root, 'supabase_functions', f), 'utf8').replace(/^import .*createClient.*$/m, ''), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;

const URL_OK = 'https://invoice.stripe.com/i/acct_1/live_abc';
const PROVIDERS = {
  stripe: { file: 'stripe-checkout.ts', hit: u => u.includes('/v1/checkout/sessions'), ok: b => b.client_secret === 'cs_new' },
  paypal: { file: 'paypal-checkout.ts', hit: u => u.includes('/v1/billing/subscriptions'), ok: b => b.init_point === 'https://paypal/approve' },
  mp:     { file: 'create-checkout.ts', hit: u => u.includes('mercadopago.com/preapproval'), ok: b => b.init_point === 'https://mp/pay' },
};
function load(kind, { profile, profileError, stripe, serviceKey, stripeKey }){
  const calls = [], served = [];
  const sb = {
    auth: { getUser: async tok => tok === 'tok' ? { data: { user: { id: 'u1', email: 'a@x.com' } }, error: null } : { data: null, error: { message: 'bad' } } },
    from(){ const c = { select(){ return c; }, eq(){ return c; }, or(){ return c; }, update(){ return c; }, maybeSingle: async () => profileError ? { data: null, error: { message: 'db' } } : { data: profile, error: null }, then(a, b){ return Promise.resolve({ data: null, error: null }).then(a, b); } }; return c; },
  };
  const J = (o, s) => ({ ok: (s || 200) < 300, status: s || 200, json: async () => o, text: async () => JSON.stringify(o) });
  const env = k => ({ SUPABASE_SERVICE_ROLE_KEY: serviceKey === undefined ? 'srk' : serviceKey, STRIPE_SECRET_KEY: stripeKey === undefined ? 'sk_x' : stripeKey, STRIPE_PRICE_ID_ANNUAL: 'price_y', PAYPAL_MODE: 'sandbox' }[k] ?? 'x');
  const ctx = {
    exports: {}, console: { log(){}, error(){}, warn(){} }, URLSearchParams, TextEncoder, Request, Response, URL, JSON, Promise, Set, Map, Math, Number, String, Array, Object, Date, AbortSignal, encodeURIComponent, btoa, setTimeout, clearTimeout,
    createClient: () => sb, Deno: { env: { get: env }, serve: fn => served.push(fn) },
    fetch: async (url, init) => {
      url = String(url); calls.push(url);
      if(url.includes('api.stripe.com/v1/subscriptions?')){
        if(stripe === 'throw') throw new Error('red');
        if(stripe === 'timeout') throw Object.assign(new Error('timeout'), { name: 'TimeoutError' });
        if(stripe === 'error') return J({ error: { message: 'x' } }, 500);
        if(stripe === 'missing') return J({ error: { code: 'resource_missing' } }, 404);
        if(stripe === 'forbidden') return J({ error: { code: 'x' } }, 403);
        return J(stripe);
      }
      if(url.includes('/v1/checkout/sessions')) return J({ client_secret: 'cs_new' });
      if(url.includes('oauth2/token')) return J({ access_token: 'pp' });
      if(url.includes('/v1/billing/subscriptions')) return J({ links: [{ rel: 'approve', href: 'https://paypal/approve' }] });
      if(url.includes('mercadopago.com/preapproval')) return J({ init_point: 'https://mp/pay' });
      return J({}, 404);
    },
  };
  vm.createContext(ctx); vm.runInContext(compile(PROVIDERS[kind].file), ctx);
  const call = async (body, tok) => { const r = await served[0](new Request('https://x/f', { method: 'POST', headers: { Authorization: 'Bearer ' + (tok || 'tok'), 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })); return { status: r.status, body: await r.json() }; };
  return { call, calls, opened: () => calls.some(PROVIDERS[kind].hit) };
}
const sub = (over, inv) => ({ data: [Object.assign({ customer: 'cus_1', status: 'past_due', latest_invoice: Object.assign({ customer: 'cus_1', status: 'open', hosted_invoice_url: URL_OK }, inv || {}) }, over || {})] });
const P = { stripe_customer_id: 'cus_1' };
let ok = 0, bad = 0;
async function t(name, fn){ try{ await fn(); ok++; console.log('  ok   ' + name); }catch(e){ bad++; console.log('  FAIL ' + name + '\n       ' + (e && e.message || e)); } }

(async () => {
  for(const kind of Object.keys(PROVIDERS)){
    console.log(kind + ': cuenta ligada a Stripe');
    const pend = async (stripe, over) => { const h = load(kind, Object.assign({ profile: P, stripe }, over || {})); const r = await h.call({ plan: 'monthly', track: false }); return { h, r }; };
    const mustPending = ({ h, r }) => { assert.strictEqual(r.status, 200); assert.strictEqual(r.body.pending_payment_url, URL_OK); assert(!h.opened(), 'no debe abrir membresia nueva'); };
    const mustTemp = ({ h, r }) => { assert.strictEqual(r.status, 503, JSON.stringify(r)); assert.strictEqual(r.body.error, 'stripe_unavailable'); assert(!h.opened(), 'no debe abrir membresia nueva'); };
    const mustNormal = ({ h, r }) => { assert.strictEqual(r.status, 200, JSON.stringify(r)); assert(PROVIDERS[kind].ok(r.body), JSON.stringify(r.body)); assert(h.opened()); };

    await t('renovacion pendiente (past_due + factura abierta): ofrece pagar esa factura', async () => mustPending(await pend(sub())));
    await t('estado unpaid con factura abierta tambien cuenta como pendiente', async () => mustPending(await pend(sub({ status: 'unpaid' }))));
    await t('alta nueva (sin stripe_customer_id): flujo normal y NO consulta Stripe', async () => { const x = await pend(sub(), { profile: { stripe_customer_id: null } }); mustNormal(x); assert(!x.h.calls.some(u => u.includes('api.stripe.com/v1/subscriptions'))); });
    await t('perfil todavia inexistente (null): alta nueva normal', async () => mustNormal(await pend(sub(), { profile: null })));
    await t('cuenta con Stripe pero sin renovacion pendiente (lista vacia): flujo normal', async () => mustNormal(await pend({ data: [] })));
    await t('suscripciones canceladas/expiradas ya resueltas: flujo normal', async () => mustNormal(await pend({ data: [{ customer: 'cus_1', status: 'canceled', latest_invoice: null }, { customer: 'cus_1', status: 'incomplete_expired', latest_invoice: null }] })));
    await t('cliente borrado en Stripe (404 resource_missing): flujo normal', async () => mustNormal(await pend('missing')));
    await t('Stripe responde 500: error temporal reintentable, no abre nada', async () => mustTemp(await pend('error')));
    await t('Stripe responde 403 (clave mala): error temporal, no abre nada', async () => mustTemp(await pend('forbidden')));
    await t('Stripe no responde (excepcion de red): error temporal', async () => mustTemp(await pend('throw')));
    await t('Stripe tarda mas del limite (timeout): error temporal', async () => mustTemp(await pend('timeout')));
    await t('respuesta de Stripe rara (sin data): error temporal', async () => mustTemp(await pend({ nope: 1 })));
    await t('falta la clave de Stripe en una cuenta ligada: error temporal', async () => mustTemp(await pend(sub(), { stripeKey: '' })));
    await t('no se pudo leer el perfil: error temporal (no se abre a ciegas)', async () => mustTemp(await pend(sub(), { profileError: true })));
    await t('past_due pero la factura ya no esta abierta (pagada/anulada): error temporal, no otra membresia', async () => { for(const st of ['paid', 'void', 'uncollectible']) mustTemp(await pend(sub({}, { status: st }))); });
    await t('past_due con enlace que no es de invoice.stripe.com: no se ofrece, error temporal', async () => { for(const u of ['https://evil.example.com/pay', 'http://invoice.stripe.com/i/x', 'https://invoice.stripe.com.evil.com/i/x', '']) mustTemp(await pend(sub({}, { hosted_invoice_url: u }))); });
    await t('latest_invoice sin expandir (solo id): error temporal', async () => mustTemp(await pend({ data: [{ customer: 'cus_1', status: 'past_due', latest_invoice: 'in_1' }] })));
    await t('factura o suscripcion de OTRO cliente: no se ofrece, error temporal', async () => { mustTemp(await pend(sub({}, { customer: 'cus_X' }))); mustTemp(await pend(sub({ customer: 'cus_X' }))); });
    await t('una pendiente valida entre varias suscripciones: se ofrece esa', async () => { const l = sub(); l.data.unshift({ customer: 'cus_1', status: 'canceled', latest_invoice: null }); mustPending(await pend(l)); });
    await t('sin clave de servicio: se salta la revision (como antes) y sigue normal', async () => mustNormal(await pend(sub(), { serviceKey: '' })));
    await t('sin token o token malo: 401 igual que antes', async () => { const h = load(kind, { profile: P, stripe: sub() }); assert.strictEqual((await h.call({}, 'malo')).status, 401); });
  }
  console.log('stripe: casos propios');
  await t('plan anual tambien ofrece la factura pendiente', async () => { const h = load('stripe', { profile: P, stripe: sub() }); const r = await h.call({ plan: 'annual' }); assert.strictEqual(r.body.pending_payment_url, URL_OK); assert(!h.opened()); });
  await t('action:mark no cambia (responde ok y no consulta Stripe)', async () => { const h = load('stripe', { profile: P, stripe: 'error' }); const r = await h.call({ action: 'mark' }); assert.strictEqual(r.body.ok, true); assert(!h.calls.length); });
  console.log(`\n${ok} ok, ${bad} fallan`); process.exit(bad ? 1 : 0);
})();
