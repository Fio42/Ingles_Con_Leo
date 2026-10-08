#!/usr/bin/env node
/* Checkout abandonado (2026-10-08): ejecuta el CODIGO REAL de las Edge Functions
   (transpilado desde .ts) contra una base de datos y un Resend falsos, con reloj
   controlado. Cubre: intento nuevo vs recarga/doble clic, varios intentos,
   conversion, email_invalid, baja, duplicados, Stripe/PayPal/Mercado Pago y
   colisiones con racha, encuesta, reactivacion y limit_reached. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let passed = 0, failed = 0; const queue = [];
function test(name, fn){ queue.push({ name, fn }); }

/* ---------------- reloj y base de datos falsos ---------------- */
const H = 3600000;
const state = { now: Date.parse('2026-10-08T18:00:00.000Z'), db: { profiles: [], progress_sessions: [] }, mails: [], resendFail: false };
class FakeDate extends Date {
  constructor(...a){ if(a.length === 0) super(state.now); else super(...a); }
  static now(){ return state.now; }
}
const iso = ms => new Date(ms).toISOString();
const ago = h => iso(state.now - h * H);

function getCol(row, col){
  if(col.includes('->>')){ const [c, k] = col.split('->>'); const o = row[c]; return o && o[k] !== undefined ? o[k] : null; }
  return row[col] === undefined ? null : row[col];
}
function cmp(a, b){
  const isoLike = v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v);
  if(isoLike(a) && isoLike(b)) return Date.parse(a) - Date.parse(b);
  return a < b ? -1 : a > b ? 1 : 0;
}
function evalOp(row, col, op, val){
  const v = getCol(row, col);
  switch(op){
    case 'is': return val === 'null' ? v === null : String(v) === val;
    case 'eq': return v !== null && String(v) === val;
    case 'neq': return v !== null && String(v) !== val;
    case 'lt': return v !== null && cmp(v, val) < 0;
    case 'lte': return v !== null && cmp(v, val) <= 0;
    case 'gt': return v !== null && cmp(v, val) > 0;
    case 'gte': return v !== null && cmp(v, val) >= 0;
  }
  throw new Error('op no soportado ' + op);
}
function splitTop(s){ const out = []; let d = 0, cur = ''; for(const ch of s){ if(ch === '(') d++; if(ch === ')') d--; if(ch === ',' && d === 0){ out.push(cur); cur = ''; } else cur += ch; } if(cur) out.push(cur); return out; }
function evalTerm(row, t){
  let m = t.match(/^(and|or)\((.*)\)$/s);
  if(m){ const parts = splitTop(m[2]).map(x => evalTerm(row, x)); return m[1] === 'and' ? parts.every(Boolean) : parts.some(Boolean); }
  const i = t.indexOf('.'), j = t.indexOf('.', i + 1);
  return evalOp(row, t.slice(0, i), t.slice(i + 1, j), t.slice(j + 1));
}
function makeSupabase(extra){
  return {
    rpc: async (name, args) => name === 'internal_secret_ok' ? { data: args.p_secret === 'ok', error: null } : { data: null, error: null },
    auth: { getUser: async tok => tok === 'tok' ? { data: { user: { id: (extra && extra.userId) || 'u1', email: 'a@x.com' } }, error: null } : { data: null, error: { message: 'bad' } } },
    from(table){
      const rows = state.db[table] || (state.db[table] = []);
      const filters = []; let upd = null, order = null, lim = null, rng = null, wantRows = false;
      const b = {
        select(){ wantRows = true; return b; },
        update(p){ upd = p; return b; },
        eq(c, v){ filters.push(r => getCol(r, c) !== null && String(getCol(r, c)) === String(v)); return b; },
        is(c, v){ filters.push(r => v === null ? getCol(r, c) === null : getCol(r, c) === v); return b; },
        not(c, op, v){ filters.push(r => !(op === 'is' && v === null ? getCol(r, c) === null : false)); return b; },
        gte(c, v){ filters.push(r => evalOp(r, c, 'gte', v)); return b; },
        lte(c, v){ filters.push(r => evalOp(r, c, 'lte', v)); return b; },
        lt(c, v){ filters.push(r => evalOp(r, c, 'lt', v)); return b; },
        or(s){ filters.push(r => splitTop(s).some(t => evalTerm(r, t))); return b; },
        order(c, o){ order = { c, asc: !o || o.ascending !== false }; return b; },
        limit(n){ lim = n; return b; },
        range(a, z){ rng = [a, z]; return b; },
        async maybeSingle(){ const r = await run(); return { data: (r.data || [])[0] || null, error: null }; },
        then(res, rej){ return run().then(res, rej); },
      };
      async function run(){
        let hit = rows.filter(r => filters.every(f => f(r)));
        if(upd){ for(const r of hit) Object.assign(r, JSON.parse(JSON.stringify(upd))); return { data: wantRows ? hit.map(r => ({ id: r.id })) : null, error: null }; }
        if(order) hit = hit.slice().sort((x, y) => (cmp(getCol(x, order.c), getCol(y, order.c))) * (order.asc ? 1 : -1));
        if(rng) hit = hit.slice(rng[0], rng[1] + 1);
        if(lim !== null) hit = hit.slice(0, lim);
        return { data: JSON.parse(JSON.stringify(hit)), error: null };
      }
      return b;
    },
  };
}
function loadTs(file, extra){
  extra = extra || {};
  const src = read('supabase_functions/' + file).replace(/^import .*createClient.*$/m, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const served = [];
  const sb = makeSupabase(extra);
  const ctx = {
    exports: {}, console: { log(){}, error(){}, warn(){} }, crypto: globalThis.crypto, TextEncoder, Request, Response, URL, JSON, Promise, Set, Map, Math, Number, String, Array, Object, parseInt, Date: FakeDate,
    setTimeout, clearTimeout, createClient: () => sb,
    Deno: { env: { get: k => (extra.env || {})[k] || 'x' }, serve: fn => { served.push(fn); } },
    fetch: extra.fetch || (async (url, init) => {
      if(String(url).includes('resend.com')){
        if(state.resendFail) return { ok: false, status: 500, text: async () => 'boom' };
        const body = JSON.parse(init.body); state.mails.push({ to: body.to[0], subject: body.subject, html: body.html, reply_to: body.reply_to, headers: body.headers });
        return { ok: true, status: 200, text: async () => '' };
      }
      return { ok: true, status: 200, text: async () => '', json: async () => ({ init_point: 'https://pay/x', url: 'https://pay/x', id: 'X', access_token: 't', links: [{ rel: 'approve', href: 'https://pay/x' }] }) };
    }),
  };
  vm.createContext(ctx); vm.runInContext(js, ctx, { filename: file });
  return { handler: served[0], ctx };
}
const NUDGE = loadTs('upgrade-nudge-emails.ts'), STREAK = loadTs('streak-reminder-email.ts'), SURVEY = loadTs('survey-15d-email.ts');
const callCron = (m) => m.handler(new Request('https://x/f', { method: 'POST', headers: { 'x-internal-secret': 'ok' }, body: '{}' }));

const BASE_LIFE = { welcome: iso(0), day1: 'skipped', day3: 'skipped', day5: 'skipped', reactivation_day14: 'skipped', final_onboarding: 'skipped', membership_intro: 'skipped', long_term_count: '99', abandoned_signup: 'skipped', active_free_pitch: 'skipped' };
function user(over){
  return Object.assign({
    id: 'u1', email: 'a@x.com', is_member: false, created_at: ago(24 * 40), last_seen_at: ago(1), checkout_started_at: null,
    free_daily_count: 0, free_daily_date: null, free_last_practice_at: null, free_first_exercise_at: ago(24 * 30), free_daily_limit_reached_at: null,
    lifecycle_emails: Object.assign({}, BASE_LIFE), last_marketing_email_at: null, email_invalid: false, email_opt_out_at: null, display_name: 'Ana',
  }, over || {});
}
function reset(mk){ state.now = Date.parse('2026-10-08T18:00:00.000Z'); state.db.profiles = mk ? mk() : []; state.db.progress_sessions = []; state.mails = []; state.resendFail = false; }
// 18:00Z = 13:00 en Cancun (hora permitida).
const P = id => state.db.profiles.find(r => r.id === id || (!id && true));
const subjects = () => state.mails.map(m => m.subject);
const E1 = '¿Quieres terminar de activar tu membresía?', E2 = 'Una pregunta sobre tu membresía';
async function tick(h){ state.now += h * H; await callCron(NUDGE); }

/* ---------------- 1. intento nuevo vs recarga / doble clic (funciones de pago) ---------------- */
for(const [file, label] of [['create-checkout.ts', 'Mercado Pago'], ['stripe-checkout.ts', 'Stripe'], ['paypal-checkout.ts', 'PayPal']]){
  const click = async (m) => { await m.handler(new Request('https://x/f', { method: 'POST', headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'monthly' }) })); };
  const mk = () => loadTs(file, { env: { SUPABASE_SERVICE_ROLE_KEY: 'srk', STRIPE_PRICE_ID: 'price_x', PAYPAL_MODE: 'sandbox' } });
  test(`${label}: primer clic guarda checkout_started_at`, async () => {
    reset(() => [user({ checkout_started_at: null })]); await click(mk());
    assert.strictEqual(P().checkout_started_at, iso(state.now));
  });
  test(`${label}: doble clic / reintento en menos de 10 min NO crea intento nuevo`, async () => {
    reset(() => [user({ checkout_started_at: ago(0.05) })]); const before = P().checkout_started_at; await click(mk());
    assert.strictEqual(P().checkout_started_at, before);
  });
  test(`${label}: intento real nuevo (pasaron mas de 10 min) actualiza al ultimo`, async () => {
    reset(() => [user({ checkout_started_at: ago(5) })]); await click(mk());
    assert.strictEqual(P().checkout_started_at, iso(state.now));
  });
  test(`${label}: no cambia pagos (misma llamada al proveedor, sin tocar is_member)`, async () => {
    reset(() => [user()]); await click(mk()); assert.strictEqual(P().is_member, false);
  });
}
test('Recargar o navegar NO cuenta como intento: start*Checkout solo se llama desde clics en miembros.html', () => {
  const html = read('miembros.html');
  const calls = [...html.matchAll(/LeoBackend\.(startCheckout|startStripeCheckout|startPaypalCheckout)\(/g)];
  assert.strictEqual(calls.length, 3, 'una llamada por proveedor');
  for(const fn of ['goToCheckout', 'goToStripeCheckout', 'goToPaypalCheckout']){
    const uses = [...html.matchAll(new RegExp(fn + '\\(', 'g'))].map(m => html.slice(Math.max(0, m.index - 40), m.index));
    const external = uses.filter(u => !/async function\s+$/.test(u) && !/addEventListener\('click',\s*\(\)=>\{\s*$/.test(u));
    assert.strictEqual(external.length, 0, fn + ' solo se invoca dentro de un listener de clic');
  }
  for(const f of ['app.js', 'backend.js', 'practica.html', 'index.html']){
    if(fs.existsSync(path.join(root, f))) assert(!/LeoBackend\.start(Stripe|Paypal)?Checkout\(/.test(read(f)), f + ' no inicia checkouts');
  }
});

/* ---------------- 2. correo 1 y correo 2 ---------------- */
test('Correo 1 sale entre 2 y 4 h, con el asunto, el CTA y el Reply-To pedidos', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); await callCron(NUDGE);
  assert.deepStrictEqual(subjects(), [E1]);
  const m = state.mails[0]; const flat = m.html.replace(/\s+/g, ' ');
  assert(m.html.includes('Continuar activación'));
  assert(flat.includes('Si tuviste algún problema o algo no quedó claro, puedes responder este correo. Me gustaría escucharte.'));
  assert(m.html.includes('https://inglesconleo.com/miembros.html'));
  assert.strictEqual(m.reply_to, 'inglesconleoreal@gmail.com');
  assert(!/falló el pago|rechazaron la tarjeta|última oportunidad|descuento|—/i.test(m.html), 'copy sin presion ni rayas largas');
  assert(m.headers['List-Unsubscribe'], 'incluye baja en un clic');
});
test('Antes de 2 h no sale nada; pasadas 30 h sin correo 1 ya no se manda (nada atrasado)', async () => {
  reset(() => [user({ checkout_started_at: ago(1.5) })]); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
  reset(() => [user({ checkout_started_at: ago(31) })]); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
});
test('Correo 2: 24 a 48 h despues del 1, con el texto pedido y enlace discreto (sin boton)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); await callCron(NUDGE);
  state.now += 25 * H; await callCron(NUDGE);
  assert.deepStrictEqual(subjects(), [E1, E2]);
  const h = state.mails[1].html.replace(/\s+/g, ' ');
  assert(h.includes('Vi que empezaste a activar tu membresía pero no la terminaste.'));
  assert(h.includes('Puedes responder directamente a este correo.'));
  assert(h.includes('https://inglesconleo.com/miembros.html'));
  assert(!h.includes('padding:14px 28px'), 'el correo 2 no lleva boton grande');
  assert(!/—|última oportunidad|descuento/i.test(h));
});
test('Correo 2 no sale antes de 24 h del correo 1, ni despues de 48 h', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); await callCron(NUDGE);
  state.now += 12 * H; await callCron(NUDGE); assert.strictEqual(state.mails.length, 1);
  state.now += 40 * H; await callCron(NUDGE); assert.strictEqual(state.mails.length, 1, 'ya paso la ventana de 48 h');
});
test('Sin duplicados: correr el Cron muchas veces manda 1 y 1', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]);
  for(let i = 0; i < 4; i++) await callCron(NUDGE);
  for(let i = 0; i < 4; i++){ state.now += 30 * 60000; await callCron(NUDGE); }
  state.now += 24 * H; for(let i = 0; i < 5; i++) await callCron(NUDGE);
  assert.deepStrictEqual(subjects(), [E1, E2]);
});
test('Cron en paralelo: solo uno gana el lugar (sin doble envio)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]);
  await Promise.all([callCron(NUDGE), callCron(NUDGE), callCron(NUDGE)]);
  assert.strictEqual(state.mails.filter(m => m.subject === E1).length, 1);
});

/* ---------------- 3. varios intentos: solo cuenta el ultimo ---------------- */
test('Varios intentos: el de hace 30 h ya no cuenta; solo el mas reciente genera correo', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); // el intento reciente (el anterior fue sobreescrito)
  await callCron(NUDGE); assert.deepStrictEqual(subjects(), [E1]);
});
test('Intento nuevo despues del correo 1: cancela el correo 2 del anterior y reinicia la secuencia', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); await callCron(NUDGE);
  state.now += 10 * H; P().checkout_started_at = iso(state.now); // vuelve a intentar
  state.now += 2.5 * H; await callCron(NUDGE);
  assert.strictEqual(state.mails.length, 1, 'el freno de 24 h lo retiene (no se pierde, no sale junto)');
  state.now += 12 * H; await callCron(NUDGE); // ya pasaron 24 h del primero
  assert.deepStrictEqual(subjects(), [E1, E1], 'el intento nuevo recibe SU correo 1');
  state.now += 26 * H; await callCron(NUDGE);
  assert.deepStrictEqual(subjects(), [E1, E1, E2], 'y despues su correo 2, nunca el del intento viejo');
});
test('Intento nuevo tras un intento anterior RECIENTE (3 dias) tambien recibe correo 1: sin cooldown de 14 dias', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), lifecycle_emails: Object.assign({}, BASE_LIFE, { checkout_abandoned: ago(24 * 3), checkout_followup: ago(24 * 2) }), last_marketing_email_at: ago(24 * 2) })]);
  await callCron(NUDGE); assert.deepStrictEqual(subjects(), [E1]);
});
test('Intento nuevo tras un intento viejo (mas de 14 dias) tambien recibe correo 1', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), lifecycle_emails: Object.assign({}, BASE_LIFE, { checkout_abandoned: ago(24 * 20), checkout_followup: ago(24 * 19) }) })]);
  await callCron(NUDGE); assert.deepStrictEqual(subjects(), [E1]);
});

/* ---------------- 4. conversion ---------------- */
test('Conversion antes del correo 1: no sale nada', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), is_member: true, lifecycle_emails: Object.assign({}, BASE_LIFE) })]);
  await callCron(NUDGE); assert(!subjects().includes(E1));
});
test('Conversion entre correo 1 y correo 2: el 2 se cancela', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); await callCron(NUDGE);
  P().is_member = true; state.now += 25 * H; await callCron(NUDGE);
  assert.deepStrictEqual(subjects(), [E1]);
});
test('Conversion justo entre decidir y enviar (relectura fresca) no manda a quien ya pago', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]);
  const real = NUDGE.ctx.sendIfStillEligible;
  P().is_member = true; // la lista ya estaba cargada: simulamos que cambia antes del envio
  const ok = await real('u1', 'a@x.com', 'checkout_abandoned');
  assert.strictEqual(ok, false); assert.strictEqual(state.mails.length, 0);
});

/* ---------------- 5. email_invalid y bajas ---------------- */
test('email_invalid=true: ningun correo de ciclo de vida sale (checkout 1 y 2)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), email_invalid: true })]); await callCron(NUDGE);
  state.now += 25 * H; await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
});
test('email_invalid=true se respeta aunque la lista este vieja (relectura fresca)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), email_invalid: true })]);
  assert.strictEqual(await NUDGE.ctx.sendIfStillEligible('u1', 'a@x.com', 'checkout_abandoned'), false);
});
test('Baja (email_opt_out_at): no sale correo 1 ni 2', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), email_opt_out_at: ago(1) })]); await callCron(NUDGE);
  state.now += 25 * H; await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
});
test('Baja entre correo 1 y 2 cancela el 2', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); await callCron(NUDGE);
  P().email_opt_out_at = ago(0); state.now += 25 * H; await callCron(NUDGE); assert.strictEqual(state.mails.length, 1);
});
test('resend-webhook sigue marcando email_invalid en rebote y queja', () => {
  const s = read('supabase_functions/resend-webhook.ts');
  assert(/email\.bounced/.test(s) && /email\.complained/.test(s) && /email_invalid/.test(s));
});
test('Fallo de Resend: no se marca como enviado ni se pierde el lugar del freno', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); state.resendFail = true; await callCron(NUDGE);
  assert.strictEqual(state.mails.length, 0); assert.strictEqual(P().last_marketing_email_at, null);
  assert(!P().lifecycle_emails.checkout_abandoned);
  state.resendFail = false; await callCron(NUDGE); assert.deepStrictEqual(subjects(), [E1]);
});

/* ---------------- 6. freno global y prioridad ---------------- */
test('Otro correo hace menos de 24 h: el de checkout espera (y sale si aun cae en la ventana)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.2), last_marketing_email_at: ago(10) })]); await callCron(NUDGE);
  assert.strictEqual(state.mails.length, 0);
});
test('Colision con reactivacion: dos correos candidatos a la vez -> solo sale uno por 24 h', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), last_seen_at: ago(24 * 5) })]);
  await callCron(NUDGE); await callCron(NUDGE);
  assert.strictEqual(state.mails.length, 1);
  assert.strictEqual(state.mails[0].subject, E1, 'checkout abandonado va antes que reactivacion');
});
test('Reclamo atomico del freno global: si otro proceso lo tomo, no se manda', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]);
  P().last_marketing_email_at = ago(0.1); // otra funcion lo tomo justo ahora
  assert.strictEqual(await NUDGE.ctx.sendIfStillEligible('u1', 'a@x.com', 'checkout_abandoned'), false);
  assert.strictEqual(state.mails.length, 0);
});
test('Correo 2 tambien respeta el freno global (otro correo entre el 1 y el 2)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5) })]); await callCron(NUDGE);
  state.now += 25 * H; P().last_marketing_email_at = ago(2); await callCron(NUDGE);
  assert.strictEqual(state.mails.length, 1);
});

/* ---------------- 6b. checkout nocturno, ventana especial, sin atrasados ---------------- */
// Cancun = UTC-5. Horas sin envio: 01:00 a 07:59 locales = 06:00Z a 12:59Z.
const at = (utc) => { state.now = Date.parse('2026-10-08T' + utc + ':00.000Z'); };
test('Checkout nocturno: 2 a 4 h caen de madrugada -> NO se cancela, queda pendiente y sale a las 8:00; nunca de madrugada', async () => {
  reset(() => [user({ checkout_started_at: '2026-10-08T05:30:00.000Z' })]); // 00:30 Cancun
  for(const t of ['08:00', '09:30', '11:00', '12:30', '12:55']){ at(t); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0, 'madrugada ' + t); }
  at('13:00'); await callCron(NUDGE); assert.deepStrictEqual(subjects(), [E1], 'primera franja de la manana');
});
test('Correo 2 de madrugada tambien espera a la manana', async () => {
  reset(() => [user({ checkout_started_at: '2026-10-08T10:00:00.000Z' })]); at('13:00'); await callCron(NUDGE); // E1 a las 13:00Z
  state.now += 24 * H - 7 * H; // 06:00Z del dia siguiente
  await callCron(NUDGE); assert.strictEqual(state.mails.length, 1);
  state.now += 7 * H; await callCron(NUDGE); assert.deepStrictEqual(subjects(), [E1, E2]);
});
const NOISY = { last_seen_at: ago(24 * 5) }; // candidato a reactivacion
test('Ventana especial: reactivacion, tips y limit_reset NO salen mientras dura el seguimiento', async () => {
  reset(() => [user(Object.assign({ checkout_started_at: ago(1), lifecycle_emails: Object.assign({}, BASE_LIFE, { long_term_count: '0', reactivation_3d_count: '0' }) }, NOISY))]);
  await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(NUDGE.ctx.checkoutWindowActive(P(), state.now), true);
});
test('Control: sin checkout, ese mismo usuario SI recibe un nudge normal (la ventana es lo que lo frena)', async () => {
  reset(() => [user(Object.assign({ checkout_started_at: null, lifecycle_emails: Object.assign({}, BASE_LIFE, { long_term_count: '0' }) }, NOISY))]);
  await callCron(NUDGE); assert.strictEqual(state.mails.length, 1); assert(subjects()[0] !== E1 && subjects()[0] !== E2);
});
test('Ventana: se cierra con el correo 2, a las 72 h, o si el correo 1 ya no es posible', () => {
  const w = (t, life) => NUDGE.ctx.checkoutWindowActive({ checkout_started_at: t, lifecycle_emails: life || {} }, state.now);
  state.now = Date.parse('2026-10-08T18:00:00.000Z');
  assert.strictEqual(w(ago(1)), true); assert.strictEqual(w(ago(23)), true); assert.strictEqual(w(ago(29)), true); assert.strictEqual(w(ago(31)), false, 'sin correo 1 y >30 h');
  assert.strictEqual(w(ago(30), { checkout_abandoned: ago(27) }), true, 'entre correo 1 y 2');
  assert.strictEqual(w(ago(60), { checkout_abandoned: ago(55) }), false, 'pasaron 48 h del correo 1');
  assert.strictEqual(w(ago(30), { checkout_abandoned: ago(27), checkout_followup: ago(1) }), false, 'correo 2 enviado');
  assert.strictEqual(w(ago(80), {}), false); assert.strictEqual(w(null), false);
});
test('Despues del correo 2: 24 h sin otro correo, y luego sale UNO solo (sin descargar atrasados)', async () => {
  reset(() => [user(Object.assign({ checkout_started_at: ago(2.5), lifecycle_emails: Object.assign({}, BASE_LIFE, { long_term_count: '0', reactivation_3d_count: '0' }) }, NOISY))]);
  await callCron(NUDGE); state.now += 25 * H; await callCron(NUDGE);
  assert.deepStrictEqual(subjects(), [E1, E2]);
  state.now += 2 * H; await callCron(NUDGE); assert.strictEqual(state.mails.length, 2, 'dentro de las 24 h posteriores al correo 2 no sale nada');
  state.now += 24 * H; await callCron(NUDGE); await callCron(NUDGE); await callCron(NUDGE);
  assert.strictEqual(state.mails.length, 3, 'solo uno, aunque varios nudges estuvieran acumulados');
});
test('Checkout y limit_reached compiten: sale checkout, limit_reached se suprime (no se pone en cola)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), free_daily_limit_reached_at: ago(1), free_daily_count: 10 })]);
  await callCron(NUDGE); await callCron(NUDGE);
  assert.deepStrictEqual(subjects(), [E1], 'solo checkout, nunca juntos');
});
test('limit_reached NO reaparece atrasado despues (ni durante ni al cerrar la ventana)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), free_daily_limit_reached_at: ago(1), free_daily_count: 10 })]);
  await callCron(NUDGE);
  for(let i = 0; i < 12; i++){ state.now += 6 * H; await callCron(NUDGE); } // 72 h mas
  assert(!subjects().some(x => /límite|limite|ejercicios/i.test(x) && x !== E1 && x !== E2), 'sin limit_reached: ' + subjects().join(' | '));
  assert.deepStrictEqual(subjects().filter(x => x === E1 || x === E2), [E1, E2]);
});
test('Durante la ventana activa limit_reached no puede retrasar el correo 1', async () => {
  reset(() => [user({ checkout_started_at: ago(1), free_daily_limit_reached_at: ago(1), free_daily_count: 10 })]);
  await callCron(NUDGE); assert.strictEqual(state.mails.length, 0, 'ni limit_reached ni checkout todavia');
  state.now += 1.5 * H; await callCron(NUDGE); assert.deepStrictEqual(subjects(), [E1], 'el seguimiento sale a tiempo, sin 24 h de retraso');
});
test('Sin checkout activo, limit_reached funciona exactamente como antes', async () => {
  reset(() => [user({ checkout_started_at: null, free_daily_limit_reached_at: ago(1), free_daily_count: 10 })]);
  await callCron(NUDGE); assert.strictEqual(state.mails.length, 1); assert(subjects()[0] !== E1 && subjects()[0] !== E2);
  await callCron(NUDGE); assert.strictEqual(state.mails.length, 1, 'una sola vez');
  reset(() => [user({ checkout_started_at: ago(24 * 10), free_daily_limit_reached_at: ago(1), free_daily_count: 10 })]);
  await callCron(NUDGE); assert.strictEqual(state.mails.length, 1, 'un checkout viejo (fuera de ventana) no lo bloquea');
});
test('Mismo correo de bienvenida y de checkout comparten Reply-To (el que ya te llega)', async () => {
  reset(() => [user({ checkout_started_at: ago(2.5), lifecycle_emails: {}, created_at: ago(5) })]);
  await callCron(NUDGE); // sale la bienvenida (respaldo)
  const w = state.mails[0].reply_to; assert.strictEqual(w, 'inglesconleoreal@gmail.com');
  for(const f of ['mp-webhook.ts', 'stripe-webhook.ts', 'paypal-webhook.ts']) assert(read('supabase_functions/' + f).includes("REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'"));
});
test('Conversion: sale del flujo gratis/checkout y entra al de miembro (racha SI le llega)', async () => {
  streakFixture({ checkout_started_at: ago(5), lifecycle_emails: Object.assign({}, BASE_LIFE, { checkout_abandoned: ago(3) }) });
  await callCron(NUDGE); assert(!subjects().includes(E2)); await callCron(STREAK);
  assert.strictEqual(state.mails.filter(m => m.subject !== E1 && m.subject !== E2).length >= 1, true);
});

/* ---------------- 7. racha y encuesta (miembros) ---------------- */
const member = over => user(Object.assign({ is_member: true, member_since: ago(24 * 16), streak_reminder_last_sent: null, survey_15d_sent_at: null, survey_15d_token: null, member_welcome_sent_at: ago(24 * 15), next_renewal_at: iso(state.now + 10 * 24 * H), last_seen_at: ago(1) }, over || {}));
function streakFixture(over){
  reset(() => [member(over)]);
  const d = x => iso(state.now - 6 * H - x * 24 * H).slice(0, 10);
  state.db.progress_sessions = [{ id: 1, user_id: 'u1', date: d(1) }, { id: 2, user_id: 'u1', date: d(2) }, { id: 3, user_id: 'u1', date: d(3) }];
}
test('Racha: sale a un miembro sano sin correo reciente', async () => {
  streakFixture(); await callCron(STREAK); assert.strictEqual(state.mails.length, 1);
});
test('Racha: colision con otro correo de las ultimas 24 h -> se pospone, sin duplicar', async () => {
  streakFixture({ last_marketing_email_at: ago(5) }); await callCron(STREAK); assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(P().streak_reminder_last_sent, null, 'queda pendiente, no se marca como enviado');
});
test('Racha: email_invalid y baja se respetan', async () => {
  streakFixture({ email_invalid: true }); await callCron(STREAK); assert.strictEqual(state.mails.length, 0);
  streakFixture({ email_opt_out_at: ago(1) }); await callCron(STREAK); assert.strictEqual(state.mails.length, 0);
});
test('Racha diaria no se bloquea un dia si y otro no (tolerancia de 15 min)', async () => {
  streakFixture({ last_marketing_email_at: iso(state.now - 24 * H + 60000) }); await callCron(STREAK); assert.strictEqual(state.mails.length, 1);
});
test('Encuesta: colision con otro correo reciente se pospone; email_invalid se respeta', async () => {
  reset(() => [member({ member_since: ago(24 * 16), last_marketing_email_at: ago(3) })]); await callCron(SURVEY); assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(P().survey_15d_sent_at, null);
  reset(() => [member({ member_since: ago(24 * 16), email_invalid: true })]); await callCron(SURVEY); assert.strictEqual(state.mails.length, 0);
  reset(() => [member({ member_since: ago(24 * 16) })]); await callCron(SURVEY); assert.strictEqual(state.mails.length, 1);
});
test('Encuesta y racha el mismo dia para el mismo miembro: sale solo una', async () => {
  streakFixture({ member_since: ago(24 * 16) });
  await callCron(SURVEY); await callCron(STREAK);
  assert.strictEqual(state.mails.length, 1);
});
test('Miembros: el Cron de nudges no manda reactivacion a un miembro con correo reciente', async () => {
  reset(() => [member({ last_seen_at: ago(24 * 5), last_marketing_email_at: ago(2) })]); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
});

/* ---------------- 8. contrato del codigo ---------------- */
test('Codigo: las consultas de lista excluyen email_invalid y el envio vuelve a leerlo', () => {
  const s = read('supabase_functions/upgrade-nudge-emails.ts');
  assert.strictEqual((s.match(/\.eq\('email_invalid', false\)/g) || []).length, 3);
  assert(/if \(fresh\.email_invalid\) return false/.test(s));
  assert(/checkout_followup/.test(s));
  const bloque = s.slice(s.indexOf('  checkout_abandoned: {'), s.indexOf('  active_free_pitch: {'));
  assert(!/—/.test(bloque) && !/falló el pago|rechazaron la tarjeta/.test(bloque));
});
test('No se tocan precios ni membresia: los webhooks y funciones de pago conservan su monto', () => {
  assert(/PRICE_MXN = 40/.test(read('supabase_functions/create-checkout.ts')));
});

(async () => {
  for(const t of queue){
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch(e){ failed++; console.log('  FAIL ' + t.name + '\n       ' + (e && e.message || e)); }
  }
  console.log(`\n${passed} ok, ${failed} fallaron`);
  process.exit(failed ? 1 : 0);
})();
