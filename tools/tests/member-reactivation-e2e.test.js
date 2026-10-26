#!/usr/bin/env node
/* Reactivación de miembros de pago, de punta a punta: ejecuta el CÓDIGO REAL de
   la Edge Function upgrade-nudge-emails (transpilado desde .ts) contra una base
   de datos, un Resend y unos proveedores de pago FALSOS, con reloj controlado.
   Cubre: activos, inactivos, nunca empezaron, pagos pendientes/fallidos,
   cancelación programada, renovación cerca / vencida sin confirmar / confirmada,
   proveedor caído, sin suscripción, duplicados, ejecuciones simultáneas, tope
   por pasada, ventana horaria, simulación sin enviar y sincronización de fechas. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let passed = 0, failed = 0; const queue = [];
function test(name, fn){ queue.push({ name, fn }); }

/* ---------------- reloj y base de datos falsos ---------------- */
const H = 3600000, D = 24 * H;
const T0 = Date.parse('2026-10-13T15:00:00.000Z'); // 10:00 en Cancún
const state = { now: T0, db: {}, mails: [], providers: {}, resendFail: false };
class FakeDate extends Date {
  constructor(...a){ if(a.length === 0) super(state.now); else super(...a); }
  static now(){ return state.now; }
}
const iso = ms => new Date(ms).toISOString();
const ago = days => iso(state.now - days * D);
const inDays = days => state.now + days * D;

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
    case 'lt': return v !== null && cmp(v, val) < 0;
    case 'lte': return v !== null && cmp(v, val) <= 0;
    case 'gt': return v !== null && cmp(v, val) > 0;
    case 'gte': return v !== null && cmp(v, val) >= 0;
  }
  throw new Error('op no soportado ' + op);
}
function splitTop(s){ const out = []; let d = 0, cur = ''; for(const ch of s){ if(ch === '(') d++; if(ch === ')') d--; if(ch === ',' && d === 0){ out.push(cur); cur = ''; } else cur += ch; } if(cur) out.push(cur); return out; }
function evalTerm(row, t){
  const i = t.indexOf('.'), j = t.indexOf('.', i + 1);
  return evalOp(row, t.slice(0, i), t.slice(i + 1, j), t.slice(j + 1));
}
function makeSupabase(){
  return {
    rpc: async (name, args) => name === 'internal_secret_ok' ? { data: args.p_secret === 'ok', error: null } : { data: null, error: null },
    from(table){
      const rows = state.db[table] || (state.db[table] = []);
      const filters = []; let upd = null, order = null, lim = null, rng = null, wantRows = false, head = false, ups = null;
      const b = {
        select(c, opts){ wantRows = true; if(opts && opts.head) head = true; return b; },
        update(p){ upd = p; return b; },
        upsert(row, opts){ ups = { row, opts: opts || {} }; return b; },
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
        if(ups){
          const key = ups.opts.onConflict || '';
          const cols = key.split(',').filter(Boolean);
          const dup = cols.length && rows.some(r => cols.every(c => String(r[c]) === String(ups.row[c])));
          if(dup){ if(!ups.opts.ignoreDuplicates) Object.assign(rows.find(r => cols.every(c => String(r[c]) === String(ups.row[c]))), ups.row); return { data: null, error: null }; }
          rows.push(Object.assign({ id: rows.length + 1, created_at: iso(state.now) }, JSON.parse(JSON.stringify(ups.row))));
          return { data: null, error: null };
        }
        let hit = rows.filter(r => filters.every(f => f(r)));
        if(upd){ for(const r of hit) Object.assign(r, JSON.parse(JSON.stringify(upd))); return { data: wantRows ? hit.map(r => ({ id: r.id })) : null, error: null }; }
        if(head) return { count: hit.length, data: null, error: null };
        if(order) hit = hit.slice().sort((x, y) => (cmp(getCol(x, order.c), getCol(y, order.c))) * (order.asc ? 1 : -1));
        if(rng) hit = hit.slice(rng[0], rng[1] + 1);
        if(lim !== null) hit = hit.slice(0, lim);
        return { data: JSON.parse(JSON.stringify(hit)), error: null };
      }
      return b;
    },
  };
}

/* ---------------- carga del código real ---------------- */
const env = {};
function loadTs(file){
  let src = read('supabase_functions/' + file).replace(/^import .*createClient.*$/m, '');
  const core = read('supabase_functions/member-reactivation-core.mjs');
  const names = [...core.matchAll(/^export (?:function|const) (\w+)/gm)].map(m => m[1]);
  src = src.replace(/^import \* as RC .*$/m, '');
  src = 'const RC = (() => {\n' + core.replace(/^export /gm, '') + '\nreturn { ' + names.join(', ') + ' };\n})();\n' + src;
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const served = [];
  const sb = makeSupabase();
  const ctx = {
    exports: {}, console: { log(){}, error(){}, warn(){} }, crypto: globalThis.crypto, TextEncoder, Request, Response, URL, JSON, Promise, Set, Map, Math, Number, String, Array, Object, parseInt, Date: FakeDate,
    setTimeout, clearTimeout, createClient: () => sb, AbortSignal, btoa, encodeURIComponent,
    Deno: { env: { get: k => (k in env ? env[k] : 'x') }, serve: fn => { served.push(fn); } },
    fetch: async (url, init) => {
      url = String(url);
      const json = body => ({ ok: true, status: 200, text: async () => JSON.stringify(body), json: async () => body });
      const fail = status => ({ ok: false, status, text: async () => 'error', json: async () => ({}) });
      if(url.includes('resend.com')){
        if(state.resendFail) return fail(500);
        const body = JSON.parse(init.body);
        const id = 're_' + (state.mails.length + 1);
        state.mails.push({ to: body.to[0], subject: body.subject, html: body.html, headers: body.headers, tags: body.tags, id });
        return json({ id });
      }
      const P = state.providers;
      if(url.includes('api.stripe.com/v1/subscriptions')){
        const cus = decodeURIComponent((url.match(/customer=([^&]+)/) || [])[1] || '');
        if(P.stripeDown || !(cus in (P.stripe || {}))) return fail(500);
        return json({ data: P.stripe[cus] });
      }
      if(url.includes('/v1/oauth2/token')) return P.paypalDown ? fail(500) : json({ access_token: 'tok' });
      if(url.includes('/v1/billing/subscriptions/')){
        const id = decodeURIComponent(url.split('/v1/billing/subscriptions/')[1]);
        return (P.paypal || {})[id] ? json(P.paypal[id]) : fail(404);
      }
      if(url.includes('api.mercadopago.com/preapproval/')){
        const id = decodeURIComponent(url.split('/preapproval/')[1]);
        return (P.mp || {})[id] ? json(P.mp[id]) : fail(404);
      }
      return fail(404);
    },
  };
  vm.createContext(ctx); vm.runInContext(js, ctx, { filename: file });
  return served[0];
}
const handler = loadTs('upgrade-nudge-emails.ts');
const call = body => handler(new Request('https://x/f', { method: 'POST', headers: { 'x-internal-secret': 'ok' }, body: JSON.stringify(body || {}) }));
const run = async body => (await call(body)).json();

/* ---------------- escenarios ---------------- */
function reset(){
  state.now = T0; state.mails = []; state.resendFail = false; state.providers = { stripe: {}, paypal: {}, mp: {} };
  state.db = { profiles: [], progress_sessions: [], member_reactivation_log: [], mistake_stats: [], leo_ai_config: [{ enabled: true, public: true }] };
  env.MEMBER_REACTIVATION_V2 = 'on';
}
const stripeSub = (o) => Object.assign({
  status: 'active', cancel_at_period_end: false, cancel_at: null, pause_collection: null,
  latest_invoice: { status: 'paid' }, items: { data: [{ current_period_end: Math.floor(inDays(20) / 1000) }] },
}, o || {});
const endsIn = days => ({ items: { data: [{ current_period_end: Math.floor(inDays(days) / 1000) }] } });
function mem(id, o){
  const p = Object.assign({
    id, email: id + '@x.com', is_member: true, display_name: 'Ana',
    member_since: iso(T0 - 400 * D), last_practice_at: iso(T0 - 20 * D), last_seen_at: iso(T0 - 1 * D),
    lifecycle_emails: { welcome: iso(T0 - 400 * D) }, last_marketing_email_at: null,
    streak_reminder_last_sent: null, survey_15d_sent_at: null, upgrade_email_1_sent_at: null, upgrade_email_2_sent_at: null, upgrade_email_3_sent_at: null,
    email_opt_out_at: null, email_invalid: false, next_renewal_at: null,
    stripe_customer_id: 'cus_' + id, paypal_subscription_id: null, mp_preapproval_id: null,
    member_welcome_sent_at: iso(T0 - 400 * D),
  }, o || {});
  return p;
}
function add(id, o, stripe){
  const p = mem(id, o);
  state.db.profiles.push(p);
  if(p.stripe_customer_id) state.providers.stripe[p.stripe_customer_id] = stripe === undefined ? [stripeSub()] : stripe;
  return p;
}
const row = id => state.db.profiles.find(p => p.id === id);
const logs = (event, id) => state.db.member_reactivation_log.filter(l => l.event === event && (!id || l.user_id === id));
const mailsTo = id => state.mails.filter(m => m.to === id + '@x.com');

test('interruptor apagado: nadie recibe nada, aunque cumpla todo', async () => {
  reset(); env.MEMBER_REACTIVATION_V2 = 'off'; add('a1');
  await run();
  assert.strictEqual(state.mails.length, 0);
});

test('elegible con pago al día: sale el correo 1, queda registrado y NO se duplica en la siguiente pasada', async () => {
  reset(); add('a1');
  await run();
  assert.strictEqual(state.mails.length, 1);
  const m = state.mails[0];
  assert.strictEqual(m.subject, '¿Practicamos inglés cinco minutos?');
  assert.match(m.html, /Retomar mi práctica/);
  assert.match(m.html, /utm_campaign=member_react_1/);
  assert.match(m.html, /baja\.html\?u=a1&t=/);
  assert.match(m.html, /Hola, Ana/);
  assert.deepStrictEqual(m.tags, [{ name: 'flow', value: 'member_reactivation' }, { name: 'step', value: '1' }]);
  assert.match(m.headers['List-Unsubscribe-Post'], /One-Click/);
  assert.ok(row('a1').lifecycle_emails.member_react_1);
  assert.strictEqual(row('a1').last_marketing_email_at, iso(state.now));
  assert.strictEqual(logs('sent', 'a1').length, 1);
  assert.strictEqual(logs('sent', 'a1')[0].step, 1);
  // la fecha de renovación verificada se guarda (solo esa columna)
  assert.strictEqual(row('a1').next_renewal_at, iso(Math.floor(inDays(20) / 1000) * 1000));
  // pasadas siguientes (cada 30 min, y también días después dentro de los 14): ninguna repite
  for(let i = 0; i < 6; i++){ state.now += 30 * 60000; await run(); }
  state.now += 10 * D; await run();
  assert.strictEqual(state.mails.length, 1);
});

test('ejecuciones simultáneas: exactamente un correo', async () => {
  reset(); add('a1');
  await Promise.all([call(), call(), call()]);
  assert.strictEqual(mailsTo('a1').length, 1);
});

test('secuencia completa en el tiempo: correo 1, 21 días, correo 2, 21 días, correo 3 y silencio', async () => {
  reset(); add('a1', { last_practice_at: iso(T0 - 14.5 * D) });
  const days = [];
  for(let d = 0; d < 200; d++){
    state.providers.stripe.cus_a1 = [stripeSub({ items: { data: [{ current_period_end: Math.floor((state.now + 20 * D) / 1000) }] } })]; // renovación siempre lejos
    const before = state.mails.length; await run(); if(state.mails.length > before) days.push(d);
    state.now += D;
  }
  assert.strictEqual(days.length, 3);
  assert.ok(days[1] - days[0] >= 21 && days[2] - days[1] >= 21, JSON.stringify(days));
  assert.deepStrictEqual(state.mails.map(m => m.subject), ['¿Practicamos inglés cinco minutos?', 'Hay más formas de practicar tu inglés', 'Tu próximo paso puede ser muy sencillo']);
  assert.strictEqual(logs('sent', 'a1').length, 3);
});

test('sin actividad reciente de práctica pero con una sesión guardada de ayer: no se envía', async () => {
  reset(); add('a1'); state.db.progress_sessions.push({ user_id: 'a1', created_at: iso(T0 - 1 * D), skill: 'listening' });
  await run();
  assert.strictEqual(state.mails.length, 0);
});

test('miembro activo (practicó ayer) y miembro con 13 días: nada', async () => {
  reset(); add('a1', { last_practice_at: ago(1) }); add('a2', { last_practice_at: ago(13) });
  await run();
  assert.strictEqual(state.mails.length, 0);
});

test('pagó y nunca practicó: recibe el correo adaptado a su primera sesión (sin "te extrañamos")', async () => {
  reset(); add('n1', { last_practice_at: null, member_since: ago(30), lifecycle_emails: { member_activation: ago(28) }, last_marketing_email_at: ago(28) });
  await run();
  assert.strictEqual(state.mails.length, 1);
  assert.match(state.mails[0].html, /primera sesión/);
  assert.doesNotMatch(state.mails[0].html.toLowerCase(), /extra[ñn]|volver|retomar/);
  assert.match(state.mails[0].html, /Empezar mi primera práctica/);
  assert.strictEqual(logs('sent', 'n1')[0].kind, 'never_started');
});

test('personalización real: la última habilidad practicada aparece en el correo 1', async () => {
  reset(); add('a1'); state.db.progress_sessions.push({ user_id: 'a1', created_at: iso(T0 - 25 * D), skill: 'writing' });
  await run();
  assert.match(state.mails[0].html, /practicaste writing/);
});

test('REGLA DE RENOVACIÓN: faltando menos de 5 días no se envía (aunque el registro local diga otra fecha)', async () => {
  reset(); add('a1', { next_renewal_at: iso(inDays(25)) }, [stripeSub(endsIn(3))]);
  await run();
  assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(logs('skipped', 'a1')[0].reason, 'renewal_window');
  assert.strictEqual(row('a1').next_renewal_at, iso(inDays(25))); // no se tocó nada
  // justo 5 días: tampoco; 5 días y 1 hora: sí
  state.providers.stripe.cus_a1 = [stripeSub(endsIn(5))]; await run(); assert.strictEqual(state.mails.length, 0);
  state.providers.stripe.cus_a1 = [stripeSub(endsIn(5 + 1 / 24))]; await run(); assert.strictEqual(state.mails.length, 1);
});

test('REGLA DE RENOVACIÓN: pasada la fecha, espera a que el proveedor confirme el cobro y entonces sí', async () => {
  reset(); add('a1', {}, [stripeSub(endsIn(-0.1))]); // fecha vencida, período sin avanzar
  await run();
  assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(logs('skipped', 'a1')[0].reason, 'renewal_unconfirmed');
  state.providers.stripe.cus_a1 = [stripeSub({ latest_invoice: { status: 'open' }, ...endsIn(30) })]; // factura nueva sin pagar
  await run();
  assert.strictEqual(state.mails.length, 0);
  state.providers.stripe.cus_a1 = [stripeSub(endsIn(30))]; // cobro confirmado
  await run();
  assert.strictEqual(state.mails.length, 1);
});

test('pago fallido, pendiente, pausa o cancelación programada en Stripe: nunca', async () => {
  const cases = [
    { status: 'past_due' }, { status: 'unpaid' }, { status: 'incomplete' }, { cancel_at_period_end: true },
    { pause_collection: { behavior: 'void' } }, { latest_invoice: { status: 'open' } }, { latest_invoice: 'in_1' },
  ];
  for(const c of cases){
    reset(); add('a1', {}, [stripeSub(c)]);
    await run();
    assert.strictEqual(state.mails.length, 0, JSON.stringify(c));
    assert.strictEqual(row('a1').lifecycle_emails.member_react_1, undefined);
  }
});

test('proveedor caído, sin respuesta o sin suscripción: no se envía y queda el motivo', async () => {
  reset(); add('a1'); state.providers.stripeDown = true;
  await run(); assert.strictEqual(state.mails.length, 0); assert.strictEqual(logs('skipped', 'a1')[0].reason, 'provider_unavailable');
  reset(); add('a1', {}, []); await run(); assert.strictEqual(state.mails.length, 0); assert.strictEqual(logs('skipped', 'a1')[0].reason, 'no_paid_subscription');
  reset(); add('a1', { stripe_customer_id: null }); await run(); assert.strictEqual(state.mails.length, 0); assert.strictEqual(logs('skipped', 'a1')[0].reason, 'no_paid_subscription');
  reset(); add('a1', {}, [{ status: 'canceled' }]); await run(); assert.strictEqual(state.mails.length, 0);
});

test('PayPal y Mercado Pago: al día sale; suspendido/pendiente/sin fecha no', async () => {
  reset();
  add('p1', { stripe_customer_id: null, paypal_subscription_id: 'I-1' }); state.providers.paypal['I-1'] = { status: 'ACTIVE', billing_info: { failed_payments_count: 0, outstanding_balance: { value: '0.00' }, last_payment: { time: ago(10) }, next_billing_time: iso(inDays(18)) } };
  add('p2', { stripe_customer_id: null, paypal_subscription_id: 'I-2' }); state.providers.paypal['I-2'] = { status: 'SUSPENDED', billing_info: { next_billing_time: iso(inDays(18)) } };
  add('m1', { stripe_customer_id: null, mp_preapproval_id: 'MP-1' }); state.providers.mp['MP-1'] = { status: 'authorized', next_payment_date: iso(inDays(18)), summarized: {} };
  add('m2', { stripe_customer_id: null, mp_preapproval_id: 'MP-2' }); state.providers.mp['MP-2'] = { status: 'authorized', next_payment_date: null };
  add('m3', { stripe_customer_id: null, mp_preapproval_id: 'MP-3' }); state.providers.mp['MP-3'] = { status: 'paused', next_payment_date: iso(inDays(18)) };
  await run();
  assert.deepStrictEqual(state.mails.map(m => m.to).sort(), ['m1@x.com', 'p1@x.com']);
  assert.strictEqual(logs('skipped', 'p2')[0].reason, 'status_suspended');
  assert.strictEqual(logs('skipped', 'm2')[0].reason, 'no_renewal_date');
  assert.strictEqual(logs('skipped', 'm3')[0].reason, 'status_paused');
});

test('miembro sin ningún proveedor de pago (acceso manual/cortesía): nunca', async () => {
  reset(); add('c1', { stripe_customer_id: null });
  await run();
  assert.strictEqual(state.mails.length, 0);
});

test('conflicto entre flujos: con un correo de cualquier flujo en los últimos 14 días espera y queda el motivo', async () => {
  const cases = [
    { last_marketing_email_at: ago(5) }, { lifecycle_emails: { checkout_followup: ago(6) } }, { survey_15d_sent_at: ago(2) },
    { streak_reminder_last_sent: iso(T0 - 3 * D).slice(0, 10) }, { lifecycle_emails: { member_activation: ago(8) } },
  ];
  for(const c of cases){
    reset(); add('a1', c); await run();
    assert.strictEqual(state.mails.length, 0, JSON.stringify(c));
    assert.strictEqual(logs('skipped', 'a1')[0].reason, 'recent_email');
  }
  // al cumplirse los 14 días, sale
  reset(); add('a1', { last_marketing_email_at: ago(14.5) }); await run(); assert.strictEqual(state.mails.length, 1);
});

test('baja de correos y correo inválido: nunca', async () => {
  reset(); add('a1', { email_opt_out_at: ago(1) }); add('a2', { email_invalid: true });
  await run();
  assert.strictEqual(state.mails.length, 0);
});

test('ventana horaria: antes de las 8:00 y desde las 21:00 (Cancún) no sale; a las 10:00 sí', async () => {
  reset(); add('a1');
  state.now = Date.parse('2026-10-13T12:00:00.000Z'); await run(); assert.strictEqual(state.mails.length, 0); // 7:00
  state.now = Date.parse('2026-10-14T02:30:00.000Z'); await run(); assert.strictEqual(state.mails.length, 0); // 21:30
  state.now = Date.parse('2026-10-13T15:00:00.000Z'); await run(); assert.strictEqual(state.mails.length, 1); // 10:00
});

test('si Resend falla, no se pierde el lugar: se reintenta y no se cuenta como enviado', async () => {
  reset(); add('a1'); state.resendFail = true;
  await run();
  assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(row('a1').last_marketing_email_at, null);
  assert.strictEqual(row('a1').lifecycle_emails.member_react_1, undefined);
  state.resendFail = false; await run();
  assert.strictEqual(state.mails.length, 1);
});

test('volvió a practicar después del correo 1: se cancela lo pendiente, queda constancia y nada más sale', async () => {
  reset(); add('a1');
  await run(); assert.strictEqual(state.mails.length, 1);
  state.now += 3 * D; row('a1').last_practice_at = iso(state.now - 1 * D); // volvió ayer
  await run();
  assert.strictEqual(logs('cancelled_returned', 'a1').length, 1);
  assert.strictEqual(row('a1').lifecycle_emails.member_react_1, undefined);
  // ciclo nuevo: no hay nada hasta 14 días de nueva inactividad (y 14 días desde el último correo)
  for(let d = 0; d < 12; d++){ state.now += D; await run(); }
  assert.strictEqual(state.mails.length, 1);
  state.now += 4 * D; state.providers.stripe.cus_a1 = [stripeSub()]; await run();
  assert.strictEqual(state.mails.length, 2); // inactivo otra vez: ciclo nuevo, correo 1
  assert.strictEqual(logs('sent', 'a1')[1].step, 1);
});

test('tope por pasada: con 40 elegibles no salen todos juntos', async () => {
  reset(); for(let i = 0; i < 40; i++) add('u' + String(i).padStart(2, '0'));
  await run();
  assert.ok(state.mails.length > 0 && state.mails.length <= 25, 'salieron ' + state.mails.length);
  const first = state.mails.length;
  state.now += 30 * 60000; await run();
  assert.ok(state.mails.length > first && state.mails.length === 40);
  assert.strictEqual(new Set(state.mails.map(m => m.to)).size, 40);
});

test('activación de miembro nuevo se conserva y no se mezcla con la reactivación', async () => {
  reset(); add('v1', { member_since: ago(1.3), last_practice_at: null, lifecycle_emails: {} });
  await run();
  assert.strictEqual(state.mails.length, 1);
  assert.match(state.mails[0].subject, /Ya tienes todo listo/);
  assert.strictEqual(logs('sent').length, 0);
});

test('SIMULACIÓN: dice a quién le tocaría sin enviar ni escribir nada ni mostrar correos', async () => {
  reset();
  add('s1'); add('s2', { last_practice_at: ago(2) }); add('s3', {}, [stripeSub(endsIn(2))]); add('s4', {}, [stripeSub({ status: 'past_due' })]);
  add('s5', { last_practice_at: null, member_since: ago(20) }); add('s6', { stripe_customer_id: null }); add('s7', { last_marketing_email_at: ago(3) });
  const before = JSON.stringify(state.db);
  env.MEMBER_REACTIVATION_V2 = 'off'; // la simulación funciona aunque el envío esté apagado
  const out = await run({ reactivation_dry_run: true });
  assert.strictEqual(JSON.stringify(state.db), before, 'la simulación escribió algo');
  assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(out.dry_run, true);
  assert.strictEqual(out.members, 7);
  const by = Object.fromEntries(out.rows.map(r => [r.id, r]));
  assert.strictEqual(by.s1.decision, 'would_send');
  assert.strictEqual(by.s2.reason, 'not_inactive_long_enough');
  assert.strictEqual(by.s3.reason, 'renewal_window');
  assert.strictEqual(by.s4.reason, 'payment_failed_or_pending');
  assert.strictEqual(by.s5.decision, 'would_send'); assert.strictEqual(by.s5.kind, 'never_started');
  assert.strictEqual(by.s6.reason, 'no_paid_subscription');
  assert.strictEqual(by.s7.reason, 'recent_email');
  assert.doesNotMatch(JSON.stringify(out), /@/); // sin correos de personas
});

test('SINCRONIZACIÓN DE FECHAS: sin apply solo informa; con apply guarda únicamente next_renewal_at de los verificados', async () => {
  reset();
  add('f1'); add('f2', {}, [stripeSub({ cancel_at_period_end: true })]); add('f3', {}, [stripeSub({ status: 'past_due' })]);
  add('f4', { stripe_customer_id: null, paypal_subscription_id: 'I-9' }); state.providers.paypal['I-9'] = { status: 'ACTIVE', billing_info: { failed_payments_count: 0, outstanding_balance: { value: '0.00' }, last_payment: { time: ago(5) }, next_billing_time: iso(inDays(12)) } };
  add('f5', { stripe_customer_id: null });
  const snapshot = JSON.stringify(state.db.profiles);
  let out = await run({ billing_sync: true });
  assert.strictEqual(JSON.stringify(state.db.profiles), snapshot);
  assert.strictEqual(out.apply, false); assert.strictEqual(out.verified_ok, 2); assert.strictEqual(out.updated, 0);
  out = await run({ billing_sync: true, apply: true });
  assert.strictEqual(out.updated, 2); assert.strictEqual(out.no_provider_subscription, 1);
  assert.strictEqual(row('f1').next_renewal_at, iso(Math.floor(inDays(20) / 1000) * 1000));
  assert.strictEqual(row('f4').next_renewal_at, iso(inDays(12)));
  for(const id of ['f2', 'f3', 'f5']) assert.strictEqual(row(id).next_renewal_at, null);
  // nada más cambió en los perfiles
  const strip = p => { const c = Object.assign({}, p); delete c.next_renewal_at; return JSON.stringify(c); };
  const before = JSON.parse(snapshot);
  for(const p of before) assert.strictEqual(strip(p), strip(row(p.id)));
  assert.strictEqual(state.mails.length, 0);
});

test('un correo de cuenta gratis y los demás flujos no se alteran: la función sigue sin tocar a no miembros', async () => {
  reset(); state.db.profiles.push({ id: 'g1', email: 'g1@x.com', is_member: false, created_at: ago(40), last_seen_at: ago(1), lifecycle_emails: { welcome: ago(40) }, last_marketing_email_at: null, email_invalid: false, email_opt_out_at: null, free_first_exercise_at: null });
  const out = await run({ reactivation_dry_run: true });
  assert.strictEqual(out.members, 0);
  assert.strictEqual(logs('sent').length, 0);
});

test('SEGURIDAD: sin la llave interna (o con una falsa) nadie puede enviar, simular ni sincronizar fechas', async () => {
  reset(); add('a1');
  const before = JSON.stringify(state.db);
  const bodies = [{}, { reactivation_dry_run: true }, { billing_sync: true, apply: true }, { manual_emails: ['a1@x.com'], which: 'member_activation' }, { welcome_user_id: 'a1' }];
  for(const body of bodies){
    for(const headers of [{}, { 'x-internal-secret': 'mala' }, { 'x-internal-secret': '' }]){
      const res = await handler(new Request('https://x/f', { method: 'POST', headers, body: JSON.stringify(body) }));
      assert.strictEqual(res.status, 401, JSON.stringify(body) + JSON.stringify(headers));
    }
  }
  assert.strictEqual(state.mails.length, 0);
  assert.strictEqual(JSON.stringify(state.db), before);
});

test('FRENO DE 14 DÍAS: no bloquea la activación inicial de un miembro nuevo (sigue con su regla de 24 h)', async () => {
  reset(); add('v1', { member_since: ago(1.3), last_practice_at: null, lifecycle_emails: {}, last_marketing_email_at: ago(3) });
  await run();
  assert.strictEqual(state.mails.length, 1);
  assert.match(state.mails[0].subject, /Ya tienes todo listo/);
});

test('FRENO DE 14 DÍAS: no bloquea la bienvenida de pago de un miembro nuevo (barrido de respaldo)', async () => {
  reset(); add('w1', { member_since: ago(0.1), last_practice_at: null, member_welcome_sent_at: null, last_marketing_email_at: ago(2), lifecycle_emails: { checkout_followup: ago(2) } });
  await run();
  assert.strictEqual(state.mails.filter(m => /acceso a Inglés con Leo ya está listo/.test(m.subject)).length, 1);
  assert.strictEqual(logs('sent').length, 0);
});


/* ---- Academia: un miembro que SOLO estudia en la academia cuenta como activo ----
   academia_record_session (servidor) deja exactamente esto: una fila gramatica en progress_sessions y profiles.last_practice_at = ahora
   (ver tools/tests/academia-modelo.test.js, que prueba la funcion real). Aqui se prueba lo que hacen los correos con ese estado. */
test('ACADEMIA: miembro que estudia una leccion cada dia durante 60 dias no recibe reactivacion ni activacion', async () => {
  reset(); add('ac1', { last_practice_at: ago(0.2), member_since: ago(200) });
  for(let d = 0; d < 60; d++){
    row('ac1').last_practice_at = iso(state.now - 2 * H);   // la leccion de hoy
    state.db.progress_sessions.push({ user_id: 'ac1', created_at: iso(state.now - 2 * H), skill: 'gramatica' });
    state.providers.stripe.cus_ac1 = [stripeSub(endsIn(20))];
    await run(); state.now += D;
  }
  assert.strictEqual(mailsTo('ac1').length, 0);
  assert.strictEqual(logs('sent', 'ac1').length, 0);
});

test('ACADEMIA: miembro nuevo que empieza por la academia dentro de las primeras horas NO recibe "pagaste y no has practicado"', async () => {
  reset(); add('ac2', { member_since: ago(1.3), last_practice_at: iso(state.now - 0.5 * D), lifecycle_emails: {} });   // estudio ~12 h antes
  state.db.progress_sessions.push({ user_id: 'ac2', created_at: iso(state.now - 0.5 * D), skill: 'gramatica' });
  await run();
  assert.strictEqual(mailsTo('ac2').length, 0);
});

test('ACADEMIA: contraste: miembro nuevo SIN actividad (ni academia ni nada) sigue recibiendo su correo de activacion', async () => {
  reset(); add('ac3', { member_since: ago(1.3), last_practice_at: null, lifecycle_emails: {} });
  await run();
  assert.strictEqual(mailsTo('ac3').length, 1);
  assert.match(mailsTo('ac3')[0].subject, /Ya tienes todo listo/);
});

test('ACADEMIA: inactivo que recibio el correo 1 y vuelve estudiando SOLO en la academia: el ciclo se cierra y no sale mas', async () => {
  reset(); add('ac4', { last_practice_at: ago(15) });
  await run();
  assert.strictEqual(mailsTo('ac4').length, 1);
  state.now += 2 * D;
  row('ac4').last_practice_at = iso(state.now - H);         // estudia una leccion de la academia
  state.db.progress_sessions.push({ user_id: 'ac4', created_at: iso(state.now - H), skill: 'gramatica' });
  state.providers.stripe.cus_ac4 = [stripeSub(endsIn(20))];
  await run();
  assert.strictEqual(logs('cancelled_returned', 'ac4').length, 1);
  for(let d = 0; d < 40; d++){ state.now += D; state.providers.stripe.cus_ac4 = [stripeSub(endsIn(20))]; row('ac4').last_practice_at = iso(state.now - H); await run(); }
  assert.strictEqual(mailsTo('ac4').length, 1, 'ningun correo mas mientras sigue estudiando');
});

test('ACADEMIA: cuenta gratis que hace la demostracion no entra al flujo de miembros (la funcion sigue sin tocar a no miembros)', async () => {
  reset(); state.db.profiles.push(mem('fr1', { is_member: false, member_since: null, last_practice_at: null, stripe_customer_id: null, member_welcome_sent_at: null }));
  await run();
  assert.strictEqual(mailsTo('fr1').filter(m => /Ya tienes todo listo|Practicamos/.test(m.subject)).length, 0);
});

(async () => {
  for(const t of queue){
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch(e){ failed++; console.log('  FAIL ' + t.name + '\n       ' + (e && e.stack || e)); }
  }
  console.log('\n' + passed + ' ok, ' + failed + ' fallaron');
  if(failed) process.exitCode = 1;
})();
