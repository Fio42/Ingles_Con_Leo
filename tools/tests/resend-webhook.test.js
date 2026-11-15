#!/usr/bin/env node
/* resend-webhook: ejecuta el CODIGO REAL de supabase_functions/resend-webhook.ts (transpilado)
   con una base de datos falsa y firmas Svix reales generadas con un secreto de prueba aleatorio.
   Cubre: sin secreto, sin cabeceras, firma invalida, marca de tiempo vieja, rebote permanente,
   rebote temporal, retraso, queja, supresion, evento repetido, cuenta inexistente, comodines
   en el correo, error de base de datos, metodo incorrecto y clics. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert'), nodeCrypto = require('crypto');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));

let passed = 0, failed = 0; const queue = [];
function test(name, fn){ queue.push({ name, fn }); }

const SECRET_BYTES = nodeCrypto.randomBytes(24);
const SECRET = 'whsec_' + SECRET_BYTES.toString('base64'); // secreto de PRUEBA, generado en cada ejecucion
const state = { db: {}, dbError: false, now: Date.now() };
const T0 = Date.UTC(2026, 10, 14, 18, 0, 0);
const NEVER = '9999-12-31T00:00:00+00:00'; // "sin vencimiento" (lo pone el trigger de la base)

function like(pattern, value){ // ilike con escape de barra invertida, como Postgres
  let re = '';
  for(let i = 0; i < pattern.length; i++){
    const c = pattern[i];
    if(c === '\\'){ i++; re += (pattern[i] || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    else if(c === '%') re += '.*';
    else if(c === '_') re += '.';
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$', 'i').test(value);
}
function makeSupabase(){
  return {
    from(table){
      const rows = state.db[table] || (state.db[table] = []);
      const filters = []; let upd = null, ups = null;
      const b = {
        select(){ return b; },
        update(p){ upd = p; return b; },
        upsert(row, opts){ ups = { row, opts: opts || {} }; return b; },
        eq(c, v){ filters.push(r => String(r[c]) === String(v)); return b; },
        ilike(c, v){ filters.push(r => typeof r[c] === 'string' && like(v, r[c])); return b; },
        or(str){ filters.push(r => str.split(',').some(t => { const i = t.indexOf('.'), j = t.indexOf('.', i + 1); const c = t.slice(0, i), op = t.slice(i + 1, j), val = t.slice(j + 1); const v = r[c] === undefined ? null : r[c];
          if(op === 'is') return val === 'null' ? v === null : String(v) === val; if(op === 'lt') return v !== null && Date.parse(v) < Date.parse(val); throw new Error('op ' + op); })); return b; },
        async maybeSingle(){ const r = await run(); return { data: (r.data || [])[0] || null, error: r.error }; },
        then(res, rej){ return run().then(res, rej); },
      };
      async function run(){
        if(state.dbError) return { data: null, error: { message: 'boom' } };
        if(ups && table === 'email_suppressions'){ // upsert por correo + trigger de la base (email_suppressions_sync)
          const ex = rows.find(r => r.email === ups.row.email);
          if(ex && ups.opts.ignoreDuplicates) return { data: [], error: null };
          if(ex) Object.assign(ex, ups.row); else rows.push(Object.assign({}, ups.row));
          (state.db.profiles || []).filter(r => (r.email || '').toLowerCase() === ups.row.email).forEach(r => {
            if(ups.row.reason === 'transient_bounce') r.email_paused_until = NEVER;
            else if(!r.email_invalid){ r.email_invalid = true; r.email_invalid_at = r.email_invalid_at || new Date(state.now).toISOString(); }
          });
          return { data: [{ email: ups.row.email }], error: null };
        }
        if(ups){ rows.push(Object.assign({ id: rows.length + 1 }, ups.row)); return { data: null, error: null }; }
        const hit = rows.filter(r => filters.every(f => f(r)));
        if(upd){ hit.forEach(r => Object.assign(r, JSON.parse(JSON.stringify(upd)))); return { data: hit.map(r => ({ id: r.id })), error: null }; }
        return { data: JSON.parse(JSON.stringify(hit)), error: null };
      }
      return b;
    },
  };
}

function load(secret){
  const src = fs.readFileSync(path.join(root, 'supabase_functions', 'resend-webhook.ts'), 'utf8').replace(/^import .*createClient.*$/m, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const served = [];
  class FakeDate extends Date { constructor(...a){ if(a.length === 0) super(state.now); else super(...a); } static now(){ return state.now; } }
  const env = { RESEND_WEBHOOK_SECRET: secret, SUPABASE_URL: 'http://x', SUPABASE_SERVICE_ROLE_KEY: 'k' };
  const sb = makeSupabase();
  const ctx = { exports: {}, console: { log(){}, error(){}, warn(){} }, crypto: globalThis.crypto, TextEncoder, Request, Response, URL, JSON, Promise, Set, Map, Math, Number, String, Array, Object, parseInt, Date: FakeDate, atob, btoa, createClient: () => sb, Deno: { env: { get: k => env[k] }, serve: fn => served.push(fn) } };
  vm.createContext(ctx); vm.runInContext(js, ctx);
  return served[0];
}

function sign(body, id, ts, key){
  const mac = nodeCrypto.createHmac('sha256', key || SECRET_BYTES).update(`${id}.${ts}.${body}`).digest('base64');
  return 'v1,' + mac;
}
function evt(type, extra, to){ return { type, created_at: new Date(state.now).toISOString(), data: Object.assign({ email_id: 'e1', to: to || ['ana@x.com'], subject: 's' }, extra || {}) }; }
async function send(handler, event, o){
  o = o || {};
  const body = typeof event === 'string' ? event : JSON.stringify(event);
  const id = o.id || 'msg_' + Math.random().toString(36).slice(2);
  const ts = o.ts !== undefined ? o.ts : String(Math.floor(state.now / 1000));
  const headers = {};
  if(!o.noHeaders){ headers['svix-id'] = id; headers['svix-timestamp'] = ts; headers['svix-signature'] = o.sig || sign(body, id, ts); }
  const res = await handler(new Request('https://f/x', { method: o.method || 'POST', headers, body: (o.method === 'GET') ? undefined : body }));
  return { status: res.status, body: await res.json() };
}
function reset(){
  state.now = T0; state.dbError = false;
  state.db = { profiles: [
    { id: 'u1', email: 'ana@x.com', email_invalid: false, email_invalid_at: null, email_paused_until: null },
    { id: 'u2', email: 'Luis@Gmail.com', email_invalid: false, email_invalid_at: null },
    { id: 'u3', email: 'a_b@x.com', email_invalid: false, email_invalid_at: null },
    { id: 'u4', email: 'aXb@x.com', email_invalid: false, email_invalid_at: null },
    { id: 'u5', email: 'otra@x.com', email_invalid: false, email_invalid_at: null },
  ], member_reactivation_log: [] };
}
const prof = id => state.db.profiles.find(p => p.id === id);
const nInvalid = () => state.db.profiles.filter(p => p.email_invalid).length;
const bounced = t => evt('email.bounced', { bounce: { type: t, subType: 'General', message: 'm' } });

test('sin RESEND_WEBHOOK_SECRET: 500 y no procesa nada (aunque la firma "cuadre")', async () => {
  reset(); const h = load('');
  const r = await send(h, bounced('Permanent'));
  assert.strictEqual(r.status, 500); assert.strictEqual(nInvalid(), 0);
});
test('sin cabeceras de firma: 400 y no marca', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, bounced('Permanent'), { noHeaders: true });
  assert.strictEqual(r.status, 400); assert.strictEqual(nInvalid(), 0);
});
test('firma invalida (secreto equivocado): 400 y no marca', async () => {
  reset(); const h = load(SECRET);
  const body = JSON.stringify(bounced('Permanent'));
  const ts = String(Math.floor(state.now / 1000));
  const r = await send(h, body, { id: 'm1', ts, sig: sign(body, 'm1', ts, nodeCrypto.randomBytes(24)) });
  assert.strictEqual(r.status, 400); assert.strictEqual(nInvalid(), 0);
});
test('firma valida pero cuerpo alterado: 400', async () => {
  reset(); const h = load(SECRET);
  const ts = String(Math.floor(state.now / 1000));
  const orig = JSON.stringify(bounced('Permanent')), tampered = JSON.stringify(evt('email.bounced', { bounce: { type: 'Permanent' } }, ['otra@x.com']));
  const r = await send(h, tampered, { id: 'm2', ts, sig: sign(orig, 'm2', ts) });
  assert.strictEqual(r.status, 400); assert.strictEqual(nInvalid(), 0);
});
test('marca de tiempo vieja (reenvio): 400 aunque la firma sea correcta', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, bounced('Permanent'), { ts: String(Math.floor(state.now / 1000) - 3600) });
  assert.strictEqual(r.status, 400); assert.strictEqual(nInvalid(), 0);
});
test('marca de tiempo no numerica: 400', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, bounced('Permanent'), { ts: 'abc' });
  assert.strictEqual(r.status, 400); assert.strictEqual(nInvalid(), 0);
});
test('cuerpo no JSON con firma valida: 400', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, 'no-es-json'); assert.strictEqual(r.status, 400);
});
test('metodo distinto de POST: 405', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, bounced('Permanent'), { method: 'GET' }); assert.strictEqual(r.status, 405);
});
test('rebote PERMANENTE: marca email_invalid y guarda la fecha', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, bounced('Permanent'));
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.marked, 1);
  assert.strictEqual(prof('u1').email_invalid, true); assert.strictEqual(prof('u1').email_invalid_at, new Date(T0).toISOString());
  assert.strictEqual(nInvalid(), 1);
  assert(!JSON.stringify(r.body).includes('@'), 'la respuesta no devuelve correos');
});
const supp = () => state.db.email_suppressions || [];
test('rebote TEMPORAL (Transient / Temporary / Undetermined / sin tipo): 200, pausa SIN vencimiento por DIRECCION y NO bloquea', async () => {
  for(const t of ['Transient', 'Temporary', 'Undetermined', '']){
    reset(); const h = load(SECRET);
    const r = await send(h, bounced(t)); assert.strictEqual(r.status, 200); assert.strictEqual(r.body.paused, 1, 'tipo ' + t);
    assert.deepStrictEqual(supp().map(x => [x.email, x.reason]), [['ana@x.com', 'transient_bounce']]);
    assert.strictEqual(prof('u1').email_paused_until, NEVER);
    assert.strictEqual(prof('u1').email_invalid, false); assert.strictEqual(nInvalid(), 0);
    assert.strictEqual(state.db.profiles.filter(p => p.email_paused_until).length, 1, 'solo esa cuenta');
  }
});
test('rebote sin objeto bounce: se trata como no permanente (pausa, no bloqueo)', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, evt('email.bounced')); assert.strictEqual(r.status, 200); assert.strictEqual(r.body.paused, 1); assert.strictEqual(nInvalid(), 0);
});
test('pausa idempotente: un evento repetido o un segundo rebote NO cambian nada (una sola fila)', async () => {
  reset(); const h = load(SECRET);
  await send(h, bounced('Transient'), { id: 'p1' }); const first = JSON.stringify(supp());
  state.now = T0 + 30 * 86400000;
  const r2 = await send(h, bounced('Transient'), { id: 'p1' }); const r3 = await send(h, bounced('Temporary'));
  assert.strictEqual(r2.body.paused, 0); assert.strictEqual(r3.body.paused, 0); assert.strictEqual(JSON.stringify(supp()), first); assert.strictEqual(prof('u1').email_paused_until, NEVER);
});
test('la pausa es de la DIRECCION: se registra aunque no exista cuenta (y se aplicara a una cuenta futura), sin tocar a otros', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, evt('email.bounced', { bounce: { type: 'Transient' } }, ['nadie@x.com'])); assert.strictEqual(r.status, 200); assert.strictEqual(r.body.paused, 1);
  assert.deepStrictEqual(supp().map(x => x.email), ['nadie@x.com']); assert.strictEqual(state.db.profiles.filter(p => p.email_paused_until).length, 0);
});
test('mayusculas / formato "Nombre <correo>": la direccion se guarda normalizada en minusculas', async () => {
  reset(); const h = load(SECRET);
  await send(h, evt('email.bounced', { bounce: { type: 'Transient' } }, ['Ana Perez <ANA@X.com>'])); assert.deepStrictEqual(supp().map(x => x.email), ['ana@x.com']); assert.strictEqual(prof('u1').email_paused_until, NEVER);
});
test('un rebote temporal NO degrada un bloqueo permanente ya registrado', async () => {
  reset(); const h = load(SECRET);
  await send(h, bounced('Permanent')); const r = await send(h, bounced('Transient'));
  assert.strictEqual(r.body.paused, 0); assert.strictEqual(supp()[0].reason, 'permanent_bounce'); assert.strictEqual(prof('u1').email_paused_until, null);
});
test('un rebote permanente posterior ENDURECE una pausa temporal (reason pasa a permanent_bounce y email_invalid=true)', async () => {
  reset(); const h = load(SECRET);
  await send(h, bounced('Transient')); const r = await send(h, bounced('Permanent'));
  assert.strictEqual(supp().length, 1); assert.strictEqual(supp()[0].reason, 'permanent_bounce'); assert.strictEqual(prof('u1').email_invalid, true); assert.strictEqual(r.body.marked, 1);
});
test('rebote PERMANENTE sigue bloqueando (email_invalid) y no usa la pausa', async () => {
  reset(); const h = load(SECRET); const r = await send(h, bounced('Permanent'));
  assert.strictEqual(r.body.marked, 1); assert.strictEqual(prof('u1').email_invalid, true); assert.strictEqual(prof('u1').email_paused_until, null); assert.strictEqual(supp()[0].reason, 'permanent_bounce');
});
test('rebote temporal con firma invalida o sin firma: NO pausa a nadie', async () => {
  reset(); const h = load(SECRET);
  const r1 = await send(h, bounced('Transient'), { noHeaders: true }); const r2 = await send(h, bounced('Transient'), { sig: 'v1,AAAA' });
  assert.strictEqual(r1.status, 400); assert.strictEqual(r2.status, 400); assert.strictEqual(state.db.profiles.filter(p => p.email_paused_until).length, 0); assert.strictEqual(supp().length, 0);
});
test('error de base de datos al pausar: 500 y el reintento si funciona', async () => {
  reset(); const h = load(SECRET); state.dbError = true;
  const r = await send(h, bounced('Transient')); assert.strictEqual(r.status, 500); state.dbError = false;
  assert.strictEqual((await send(h, bounced('Transient'))).body.paused, 1);
});
test('retraso temporal (email.delivery_delayed): 200 y NO bloquea', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, evt('email.delivery_delayed')); assert.strictEqual(r.status, 200); assert.strictEqual(nInvalid(), 0);
});
test('queja de spam: marca email_invalid', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, evt('email.complained')); assert.strictEqual(r.status, 200); assert.strictEqual(prof('u1').email_invalid, true);
});
test('supresion (email.suppressed): marca email_invalid', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, evt('email.suppressed')); assert.strictEqual(r.status, 200); assert.strictEqual(prof('u1').email_invalid, true);
});
test('eventos que no bloquean (entregado, enviado, abierto, desconocido): 200 sin cambios', async () => {
  reset(); const h = load(SECRET);
  for(const t of ['email.delivered', 'email.sent', 'email.opened', 'email.failed', 'domain.updated', 'otra.cosa']){
    const r = await send(h, evt(t)); assert.strictEqual(r.status, 200);
  }
  assert.strictEqual(nInvalid(), 0);
});
test('evento REPETIDO (mismo id, o reintento posterior): 200 y la fecha original no cambia', async () => {
  reset(); const h = load(SECRET);
  const e = bounced('Permanent');
  const r1 = await send(h, e, { id: 'dup1' }); const first = prof('u1').email_invalid_at;
  state.now = T0 + 120000;
  const r2 = await send(h, e, { id: 'dup1' });
  const r3 = await send(h, evt('email.suppressed')); // Resend manda bounced y luego suppressed
  assert.strictEqual(r1.body.marked, 1); assert.strictEqual(r2.status, 200); assert.strictEqual(r2.body.marked, 0); assert.strictEqual(r3.body.marked, 0);
  assert.strictEqual(prof('u1').email_invalid_at, first); assert.strictEqual(nInvalid(), 1);
});
test('direccion sin cuenta: 200, no toca a nadie', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, bounced('Permanent'), null || { }); // ana existe; probamos otra inexistente abajo
  reset();
  const r2 = await send(h, evt('email.bounced', { bounce: { type: 'Permanent' } }, ['nadie@x.com']));
  assert.strictEqual(r2.status, 200); assert.strictEqual(r2.body.marked, 0); assert.strictEqual(nInvalid(), 0);
});
test('mayusculas distintas: "Luis@Gmail.com" se encuentra con "luis@gmail.com"', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, evt('email.bounced', { bounce: { type: 'Permanent' } }, ['LUIS@gmail.COM'])); assert.strictEqual(r.body.marked, 1); assert.strictEqual(prof('u2').email_invalid, true);
});
test('el guion bajo NO es comodin: "a_b@x.com" no marca "aXb@x.com"', async () => {
  reset(); const h = load(SECRET);
  await send(h, evt('email.bounced', { bounce: { type: 'Permanent' } }, ['a_b@x.com']));
  assert.strictEqual(prof('u3').email_invalid, true); assert.strictEqual(prof('u4').email_invalid, false); assert.strictEqual(nInvalid(), 1);
});
test('"%" en la direccion no marca a todos', async () => {
  reset(); const h = load(SECRET);
  await send(h, evt('email.bounced', { bounce: { type: 'Permanent' } }, ['%@x.com'])); assert.strictEqual(nInvalid(), 0);
});
test('formato "Nombre <correo>" y lista con varios destinatarios', async () => {
  reset(); const h = load(SECRET);
  const r = await send(h, evt('email.complained', {}, ['Ana <ana@x.com>', 'otra@x.com']));
  assert.strictEqual(r.body.marked, 2); assert.strictEqual(prof('u5').email_invalid, true);
});
test('error de base de datos: 500 (Resend reintenta) y no hay cambios', async () => {
  reset(); const h = load(SECRET); state.dbError = true;
  const r = await send(h, bounced('Permanent')); assert.strictEqual(r.status, 500);
  state.dbError = false; assert.strictEqual(nInvalid(), 0);
  const r2 = await send(h, bounced('Permanent')); assert.strictEqual(r2.body.marked, 1); // el reintento si funciona
});
test('clic en correo que no es de reactivacion: se ignora; el de reactivacion se registra una vez', async () => {
  reset(); state.db.profiles[0].id = 'u1'; const h = load(SECRET);
  const r = await send(h, evt('email.clicked', { tags: { flow: 'otro' } })); assert.strictEqual(r.status, 200); assert.strictEqual(state.db.member_reactivation_log.length, 0);
  await send(h, evt('email.clicked', { tags: [{ name: 'flow', value: 'member_reactivation' }, { name: 'step', value: '1' }], click: { link: 'https://x' } }));
  assert.strictEqual(state.db.member_reactivation_log.length, 1); assert.strictEqual(nInvalid(), 0);
});
test('el codigo no contiene secretos y documenta --no-verify-jwt', () => {
  const s = fs.readFileSync(path.join(root, 'supabase_functions', 'resend-webhook.ts'), 'utf8');
  assert(!/whsec_[A-Za-z0-9+/=]{20,}/.test(s), 'no hay un secreto real en el archivo');
  assert(/--no-verify-jwt/.test(s));
});

test('lo que se despliega (supabase/functions/resend-webhook/index.ts) es IDENTICO a supabase_functions/resend-webhook.ts', () => {
  const a = fs.readFileSync(path.join(root, 'supabase_functions', 'resend-webhook.ts'), 'utf8').replace(/\r/g, '');
  const b = fs.readFileSync(path.join(root, 'supabase', 'functions', 'resend-webhook', 'index.ts'), 'utf8').replace(/\r/g, '');
  assert.strictEqual(a, b, 'la CLI despliega index.ts: si difiere, se publicaria una version distinta');
});

test('reintento de Resend HORAS despues: misma id de mensaje pero marca de tiempo y firma NUEVAS del intento -> se acepta', async () => {
  reset(); const h = load(SECRET);
  const e = bounced('Permanent');
  const first = await send(h, e, { id: 'retry1', ts: String(Math.floor(T0 / 1000)), sig: 'v1,firma-que-no-sirve' }); // 1er intento falla (400)
  assert.strictEqual(first.status, 400);
  for(const horas of [0.0014, 0.083, 0.5, 2, 5, 10, 20]){ // calendario de reintentos de Svix: 5 s, 5 min, 30 min, 2 h, 5 h, 10 h...
    reset(); state.now = T0 + horas * 3600000;
    const r = await send(h, e, { id: 'retry1' }); // send() firma con la marca de tiempo del momento del intento, como hace Svix
    assert.strictEqual(r.status, 200, 'reintento a las ' + horas + ' h'); assert.strictEqual(r.body.marked, 1);
  }
});
test('lo que SI se rechaza: una peticion capturada y reenviada mas tarde con su marca de tiempo original', async () => {
  reset(); const h = load(SECRET);
  const ts = String(Math.floor(T0 / 1000)), body = JSON.stringify(bounced('Permanent'));
  const captured = { id: 'cap1', ts, sig: sign(body, 'cap1', ts) };
  state.now = T0 + 2 * 3600000; // el atacante la reenvia 2 h despues, tal cual
  const r = await send(h, body, captured); assert.strictEqual(r.status, 400); assert.strictEqual(nInvalid(), 0);
});

(async () => {
  for(const t of queue){
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch(e){ failed++; console.log('  FAIL ' + t.name + '\n       ' + (e && e.message)); }
  }
  console.log('\nresend-webhook: ' + passed + ' ok, ' + failed + ' fallan');
  process.exit(failed ? 1 : 0);
})();
