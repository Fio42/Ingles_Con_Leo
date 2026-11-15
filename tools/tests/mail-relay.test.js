#!/usr/bin/env node
/* mail-relay: ejecuta el CODIGO REAL de supabase_functions/mail-relay.ts con Resend y Brevo FALSOS
   (no sale ningun correo ni se llama a ninguna API real). Cubre autenticacion, formato Brevo,
   bloqueos por direccion segun el tipo de flujo y el cambio de proveedor. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
let passed = 0, failed = 0; const queue = [];
const test = (name, fn) => queue.push({ name, fn });

const KEY = 're_test_key';
function load(env, supp, opts){
  opts = opts || {};
  const src = fs.readFileSync(path.join(root, 'supabase_functions', 'mail-relay.ts'), 'utf8').replace(/^import .*createClient.*$/m, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const calls = []; let served;
  const sb = { from(){ return { select(){ return { async in(c, vals){ if(opts.dbError) return { data: null, error: { message: 'x' } }; return { data: supp.filter(r => vals.includes(r.email)), error: null }; } }; } }; } };
  const fakeFetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if(url.includes('brevo')) return new Response(JSON.stringify(opts.brevoFail ? { message: 'bad' } : { messageId: '<b1@brevo>' }), { status: opts.brevoFail ? 400 : 201 });
    return new Response(JSON.stringify({ id: 'resend-1' }), { status: 200 });
  };
  const ctx = { exports: {}, console: { log(){}, error(){}, warn(){} }, TextEncoder, Request, Response, URL, JSON, Promise, Set, Map, Math, Number, String, Array, Object, Date, fetch: fakeFetch,
    Deno: { env: { get: k => Object.prototype.hasOwnProperty.call(env, k) ? env[k] : undefined }, serve: h => { served = h; } }, createClient: () => sb };
  vm.createContext(ctx); vm.runInContext(js, ctx);
  return { handler: served, calls };
}
const MAIL = { from: 'Inglés con Leo <hola@inglesconleo.com>', to: ['ana@x.com'], subject: 'Hola', html: '<p>hi</p>', reply_to: 'leo@inglesconleo.com', tags: [{ name: 'flow', value: 'access' }] };
const post = (h, mail, o) => { o = o || {}; const headers = { 'Content-Type': 'application/json' }; if(o.auth !== null) headers.Authorization = o.auth || 'Bearer ' + KEY; if(o.flow) headers['x-mail-flow'] = o.flow;
  return h.handler(new Request('https://x/mail-relay', { method: 'POST', headers, body: typeof mail === 'string' ? mail : JSON.stringify(mail) })); };
const ENV = (extra) => Object.assign({ RESEND_API_KEY: KEY, SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'k' }, extra || {});
const T = { ana: { email: 'ana@x.com', reason: 'transient_bounce' }, dura: { email: 'dura@x.com', reason: 'permanent_bounce' }, queja: { email: 'q@x.com', reason: 'complaint' } };

test('auth: sin llave, llave mala o metodo GET: 401/405 y no sale nada', async () => {
  const h = load(ENV(), []);
  assert.strictEqual((await post(h, MAIL, { auth: null })).status, 401); assert.strictEqual((await post(h, MAIL, { auth: 'Bearer otra' })).status, 401);
  assert.strictEqual((await h.handler(new Request('https://x', { method: 'GET' }))).status, 405); assert.strictEqual(h.calls.length, 0);
  assert.strictEqual((await post(load({ SUPABASE_URL: 'x', SUPABASE_SERVICE_ROLE_KEY: 'k' }, []), MAIL)).status, 401); // sin RESEND_API_KEY configurada
});
test('cuerpo invalido o incompleto: 400/422 y no sale nada', async () => {
  const h = load(ENV(), []);
  assert.strictEqual((await post(h, 'no json')).status, 400); assert.strictEqual((await post(h, { to: ['a@x.com'] })).status, 422);
  assert.strictEqual((await post(h, Object.assign({}, MAIL, { to: [] }))).status, 422); assert.strictEqual(h.calls.length, 0);
});
test('proveedor por defecto (resend): reenvia tal cual a api.resend.com con la llave y devuelve su respuesta', async () => {
  const h = load(ENV(), []); const r = await post(h, MAIL, { flow: 'critical' });
  assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).id, 'resend-1'); assert.strictEqual(h.calls.length, 1);
  assert.strictEqual(h.calls[0].url, 'https://api.resend.com/emails'); assert.strictEqual(h.calls[0].init.headers.Authorization, 'Bearer ' + KEY); assert.deepStrictEqual(h.calls[0].body.to, ['ana@x.com']); assert.strictEqual(h.calls[0].body.subject, 'Hola');
});
test('proveedor brevo: formato de la API de Brevo (sender, to, htmlContent, replyTo, tags) y respuesta tipo Resend { id }', async () => {
  const h = load(ENV({ MAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'xkeysib-test' }), []); const r = await post(h, MAIL, { flow: 'critical' });
  assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).id, '<b1@brevo>'); assert.strictEqual(h.calls.length, 1);
  const c = h.calls[0]; assert.strictEqual(c.url, 'https://api.brevo.com/v3/smtp/email'); assert.strictEqual(c.init.headers['api-key'], 'xkeysib-test'); assert(!/Authorization/i.test(Object.keys(c.init.headers).join()));
  assert.deepStrictEqual(c.body.sender, { email: 'hola@inglesconleo.com', name: 'Inglés con Leo' }); assert.deepStrictEqual(c.body.to, [{ email: 'ana@x.com' }]); assert.strictEqual(c.body.htmlContent, '<p>hi</p>');
  assert.deepStrictEqual(c.body.replyTo, { name: '', email: 'leo@inglesconleo.com' }); assert.deepStrictEqual(c.body.tags, ['flow:access']); assert.strictEqual(c.body.subject, 'Hola');
});
test('brevo sin BREVO_API_KEY: 500 y no sale nada; error de Brevo: se devuelve el error (quien llama reintenta)', async () => {
  const h = load(ENV({ MAIL_PROVIDER: 'brevo' }), []); assert.strictEqual((await post(h, MAIL, { flow: 'critical' })).status, 500); assert.strictEqual(h.calls.length, 0);
  const h2 = load(ENV({ MAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'k' }), [], { brevoFail: true }); assert.strictEqual((await post(h2, MAIL, { flow: 'critical' })).status, 400);
});
for(const prov of ['resend', 'brevo']){
  const env = () => ENV({ MAIL_PROVIDER: prov, BREVO_API_KEY: 'k' });
  test(`[${prov}] flujo CRITICO (acceso, pagos, recuperacion, libro): NUNCA se bloquea, ni con rebote temporal ni permanente`, async () => {
    for(const t of [T.ana, T.dura, T.queja]){ const h = load(env(), [t]); const r = await post(h, Object.assign({}, MAIL, { to: [t.email] }), { flow: 'critical' }); assert.strictEqual(r.status, 200); assert.strictEqual(h.calls.length, 1, t.reason); }
  });
  test(`[${prov}] flujo TRANSACCIONAL (aviso de cobro fallido): sale con rebote temporal; NO sale con permanente/queja`, async () => {
    let h = load(env(), [T.ana]); await post(h, MAIL, { flow: 'transactional' }); assert.strictEqual(h.calls.length, 1);
    for(const t of [T.dura, T.queja]){ h = load(env(), [t]); const r = await post(h, Object.assign({}, MAIL, { to: [t.email] }), { flow: 'transactional' }); assert.strictEqual((await r.json()).skipped, true); assert.strictEqual(h.calls.length, 0); }
  });
  test(`[${prov}] flujo MARKETING (o sin cabecera): NO sale con ningun bloqueo; si sin bloqueo`, async () => {
    for(const flow of ['marketing', undefined, 'otra-cosa']){
      let h = load(env(), [T.ana]); let r = await post(h, MAIL, { flow }); assert.strictEqual((await r.json()).skipped, true); assert.strictEqual(h.calls.length, 0);
      h = load(env(), []); await post(h, MAIL, { flow }); assert.strictEqual(h.calls.length, 1);
    }
  });
  test(`[${prov}] varios destinatarios: solo se omiten los bloqueados`, async () => {
    const h = load(env(), [T.ana]); await post(h, Object.assign({}, MAIL, { to: ['Ana <ANA@x.com>', 'otro@x.com'] }), { flow: 'marketing' });
    assert.strictEqual(h.calls.length, 1); const to = h.calls[0].body.to.map(x => typeof x === 'string' ? x : x.email); assert.deepStrictEqual(to, ['otro@x.com']);
  });
}
test('error de base de datos en un flujo con bloqueos: 500 y NO se manda a ciegas; en flujo critico no consulta la base', async () => {
  let h = load(ENV(), [], { dbError: true }); assert.strictEqual((await post(h, MAIL, { flow: 'marketing' })).status, 500); assert.strictEqual(h.calls.length, 0);
  h = load(ENV(), [], { dbError: true }); assert.strictEqual((await post(h, MAIL, { flow: 'critical' })).status, 200); assert.strictEqual(h.calls.length, 1);
});
test('las funciones criticas usan MAIL_API_URL (por defecto Resend) y declaran su tipo de flujo; el relevo no se usa todavia en marketing', () => {
  const rd = f => fs.readFileSync(path.join(root, 'supabase_functions', f), 'utf8');
  const want = { 'mp-webhook.ts': ['critical'], 'paypal-webhook.ts': ['critical'], 'send-password-reset.ts': ['critical'], 'stripe-webhook.ts': ['transactional', 'critical'] };
  for(const [f, flows] of Object.entries(want)){
    const s = rd(f);
    assert(/const MAIL_API_URL = Deno\.env\.get\('MAIL_API_URL'\) \|\| 'https:\/\/api\.resend\.com\/emails'/.test(s), f + ' conserva Resend por defecto');
    assert.strictEqual((s.match(/fetch\(MAIL_API_URL/g) || []).length, flows.length, f);
    assert.deepStrictEqual((s.match(/'x-mail-flow': '(\w+)'/g) || []).map(x => x.match(/: '(\w+)'/)[1]), flows, f);
  }
  for(const f of ['upgrade-nudge-emails.ts', 'streak-reminder-email.ts', 'survey-15d-email.ts']) assert(!/MAIL_API_URL/.test(rd(f)), f + ' sigue directo por Resend');
});
test('el codigo no contiene llaves reales', () => {
  const s = fs.readFileSync(path.join(root, 'supabase_functions', 'mail-relay.ts'), 'utf8'); assert(!/re_[A-Za-z0-9]{20,}|xkeysib-[A-Za-z0-9]{20,}/.test(s));
});
(async () => { for(const t of queue){ try { await t.fn(); passed++; console.log('  ok   ' + t.name); } catch(e){ failed++; console.log('  FAIL ' + t.name + '\n       ' + (e && e.message || e)); } } console.log(`\n${passed} ok, ${failed} fallaron`); process.exit(failed ? 1 : 0); })();
