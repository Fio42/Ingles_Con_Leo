#!/usr/bin/env node
/* Prueba en el SANDBOX de Stripe: renovacion mensual que falla, reintentos, cruce con la siguiente renovacion y pago.
   Solo usa una clave sk_test_ (si no empieza asi, se niega a correr: NUNCA toca produccion).
   Usa un reloj de pruebas (test clock): avanza el tiempo sin esperar y borra todo al final.

   Uso (en TU computadora, la clave no se pega en el chat):
     PowerShell:  $env:STRIPE_TEST_KEY="sk_test_..."; node tools/stripe-sandbox-renovacion.js
     macOS/Linux: STRIPE_TEST_KEY=sk_test_... node tools/stripe-sandbox-renovacion.js
   Escenarios (ESCENARIO=dia5 | ciclo31 | todas, por defecto todas):
     dia5    : falla la renovacion, el dia 5 se paga con pm_card_visa; debe quedar factura pagada, suscripcion activa, acceso SI.
     ciclo31 : suscripcion con renovacion el 31 de enero (siguiente 28 de febrero); se deja impaga y se cuentan las facturas abiertas/cobrables.

   IMPORTANTE: la configuracion de Smart Retries del sandbox es independiente de la de produccion y no se puede
   cambiar por API. Antes de correr esto, en el panel del sandbox: Configuracion > Facturacion > Pagos fallidos
   > Smart Retries > 1 mes y "cancelar la suscripcion" al agotarse. El script solo imprime lo que Stripe hace.

   Para cada dia imprime: estado de la suscripcion, facturas abiertas, que enlace tomaria el boton (misma regla que
   stripe-checkout / payment-recovery-emails) y que acceso tendria la cuenta segun stripe-webhook.ts. */
const KEY = process.env.STRIPE_TEST_KEY || '';
if(!/^sk_test_/.test(KEY)){ console.error('Falta STRIPE_TEST_KEY con una clave sk_test_ (sandbox). No se ejecuta con claves de produccion.'); process.exit(1); }
const WINDOW = Number(process.env.DIAS_VENTANA || 28);
const API = 'https://api.stripe.com/v1';
const DAY = 86400;

function flat(obj, pre, out){ out = out || []; for(const [k, v] of Object.entries(obj)){ const key = pre ? pre + '[' + k + ']' : k; if(v === undefined || v === null) continue; if(Array.isArray(v)) v.forEach((x, i) => typeof x === 'object' ? flat(x, key + '[' + i + ']', out) : out.push([key + '[' + i + ']', x])); else if(typeof v === 'object') flat(v, key, out); else out.push([key, v]); } return out; }
async function api(method, p, body){
  const qs = method === 'GET' && body ? '?' + flat(body).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&') : '';
  const res = await fetch(API + p + qs, { method, headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: method === 'GET' || !body ? undefined : new URLSearchParams(flat(body)) });
  const j = await res.json(); if(!res.ok) throw new Error(method + ' ' + p + ' -> ' + res.status + ' ' + JSON.stringify(j.error || j)); return j;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = t => new Date(t * 1000).toISOString().slice(0, 16).replace('T', ' ');
const URL_RE = /^https:\/\/invoice\.stripe\.com\/[A-Za-z0-9_\-\/?=&%.]+$/;

async function advance(clock, to){
  await api('POST', '/test_helpers/test_clocks/' + clock + '/advance', { frozen_time: to });
  for(let i = 0; i < 90; i++){ const c = await api('GET', '/test_helpers/test_clocks/' + clock); if(c.status === 'ready') return; await sleep(2000); }
  throw new Error('el reloj no termino de avanzar');
}
/* Misma regla que el servidor: past_due/unpaid + factura abierta de la misma suscripcion + enlace de invoice.stripe.com */
async function whatButton(customer){
  const subs = await api('GET', '/subscriptions', { customer, status: 'all', limit: 20, expand: ['data.latest_invoice'] });
  let unresolved = false;
  for(const s of subs.data){
    if(s.status !== 'past_due' && s.status !== 'unpaid') continue;
    const inv = s.latest_invoice;
    if(inv && inv.customer === customer && inv.status === 'open' && URL_RE.test(inv.hosted_invoice_url || '')) return { boton: 'FACTURA PENDIENTE', url: inv.hosted_invoice_url, factura: inv.id };
    unresolved = true;
  }
  return unresolved ? { boton: 'error temporal (pendiente sin enlace seguro)' } : { boton: 'checkout normal / sitio (nada recuperable)' };
}
/* Acceso segun stripe-webhook.ts: active/trialing = si; past_due = si dentro de las 72 h, luego pausa; unpaid/canceled = no */
function acceso(sub, failedAt, now){
  if(!sub) return 'sin suscripcion: NO';
  if(sub.status === 'active' || sub.status === 'trialing') return 'SI';
  if(sub.status === 'past_due') return (now - failedAt) / 3600 < 72 ? 'SI (gracia de 72 h)' : 'NO (pausa a las 72 h; Stripe sigue reintentando)';
  return 'NO (' + sub.status + ')';
}
async function snapshot(label, customer, subId, clockTime, failedAt){
  const sub = subId ? await api('GET', '/subscriptions/' + subId).catch(() => null) : null;
  const invs = await api('GET', '/invoices', { customer, limit: 10 });
  const btn = await whatButton(customer);
  console.log('\n--- ' + label + ' (reloj: ' + fmt(clockTime) + ') ---');
  console.log('suscripcion:', sub ? sub.status : '(ninguna)', sub && sub.items ? '| proximo corte: ' + fmt(sub.items.data[0].current_period_end) : '');
  console.log('facturas:'); invs.data.forEach(i => console.log('   ' + i.id + '  ' + i.status.padEnd(14) + ' ' + String(i.amount_due / 100).padStart(7) + ' ' + i.currency.toUpperCase() + '  periodo ' + fmt(i.period_start) + '  intentos=' + i.attempt_count + '  abierta=' + (i.status === 'open') + '  enlace=' + (URL_RE.test(i.hosted_invoice_url || '') ? 'ok' : 'no')));
  console.log('abiertas:', invs.data.filter(i => i.status === 'open').map(i => i.id).join(', ') || '(ninguna)');
  console.log('BOTON del correo / sitio:', btn.boton, btn.url ? '-> ' + btn.url : '');
  console.log('ACCESO segun el webhook:', acceso(sub, failedAt, clockTime));
  return { sub, invs: invs.data, btn };
}


const CHECKS = [];
function check(name, ok, detail){ CHECKS.push({ name, ok }); console.log((ok ? 'PASA   ' : 'FALLA  ') + name + (detail ? '  (' + detail + ')' : '')); }

/* Precio mensual del sandbox: se reutiliza por lookup_key y, si no existe, se crea producto + precio.
   (La API de suscripciones NO acepta price_data[product_data]: pide un precio existente o price_data[product].) */
let PRICE_ID = null;
async function ensurePrice(){
  if(PRICE_ID) return PRICE_ID;
  const KEY_LOOKUP = 'sandbox-membresia-mxn-3700-mensual';
  const found = await api('GET', '/prices', { lookup_keys: [KEY_LOOKUP], active: true, limit: 1 });
  if(found.data.length){ PRICE_ID = found.data[0].id; console.log('Precio reutilizado:', PRICE_ID); return PRICE_ID; }
  const prod = await api('POST', '/products', { name: 'Membresia sandbox (pruebas de renovacion)' });
  const price = await api('POST', '/prices', { product: prod.id, currency: 'mxn', unit_amount: 3700, recurring: { interval: 'month' }, lookup_key: KEY_LOOKUP });
  PRICE_ID = price.id; console.log('Precio creado:', PRICE_ID);
  return PRICE_ID;
}
/* El reloj se crea primero y por separado para que SIEMPRE se pueda borrar, aunque falle lo que sigue. */
async function newClock(startTs, name){
  const clock = await api('POST', '/test_helpers/test_clocks', { frozen_time: startTs, name: name + '-' + Math.floor(Date.now() / 1000) });
  console.log('\n==== ' + name + ' | reloj ' + clock.id + ' empieza ' + fmt(startTs) + ' ====');
  return { clock };
}
async function populate(c){
  const price = await ensurePrice();
  const cust = await api('POST', '/customers', { email: 'sandbox@example.com', test_clock: c.clock.id, payment_method: 'pm_card_visa' });
  c.cust = cust;
  const pms = await api('GET', '/payment_methods', { customer: cust.id, type: 'card' });
  c.good = pms.data[0].id;
  await api('POST', '/customers/' + cust.id, { invoice_settings: { default_payment_method: c.good } });
  c.sub = await api('POST', '/subscriptions', { customer: cust.id, items: [{ price }], default_payment_method: c.good });
  console.log('Suscripcion', c.sub.id, '| estado', c.sub.status);
  return c;
}
async function breakCard(c){
  const bad = await api('POST', '/payment_methods/pm_card_chargeCustomerFail/attach', { customer: c.cust.id });
  await api('POST', '/customers/' + c.cust.id, { invoice_settings: { default_payment_method: bad.id } });
  await api('POST', '/subscriptions/' + c.sub.id, { default_payment_method: bad.id });
  return (await api('GET', '/subscriptions/' + c.sub.id)).items.data[0].current_period_end;
}
async function cleanup(c){ await api('DELETE', '/test_helpers/test_clocks/' + c.clock.id).then(() => console.log('Reloj y datos borrados.')).catch(e => console.log('Borra a mano el reloj', c.clock.id, e.message)); }

async function escenarioDia5(){
  const t0 = Math.floor(Date.now() / 1000);
  let c;
  try {
    c = await newClock(t0, 'dia5');
    await populate(c);
    const renewal = await breakCard(c);
    await advance(c.clock.id, renewal + 3600);
    await snapshot('Dia 0: falla la renovacion', c.cust.id, c.sub.id, renewal + 3600, renewal);
    await advance(c.clock.id, renewal + 5 * DAY + 3600);
    const before = await snapshot('Dia 5, ANTES de pagar', c.cust.id, c.sub.id, renewal + 5 * DAY + 3600, renewal);
    const pend = before.invs.find(i => i.status === 'open');
    check('antes de pagar hay UNA factura abierta y el boton la enlaza', !!pend && before.btn.boton === 'FACTURA PENDIENTE' && before.invs.filter(i => i.status === 'open').length === 1);
    // El pago lo hace el cliente con una tarjeta buena (aqui pm_card_visa) sobre la factura enlazada
    const good = await api('POST', '/payment_methods/pm_card_visa/attach', { customer: c.cust.id });
    await api('POST', '/customers/' + c.cust.id, { invoice_settings: { default_payment_method: good.id } });
    await api('POST', '/subscriptions/' + c.sub.id, { default_payment_method: good.id });
    const paid = await api('POST', '/invoices/' + pend.id + '/pay', { payment_method: good.id });
    await sleep(3000);
    const after = await snapshot('Dia 5, DESPUES de pagar', c.cust.id, c.sub.id, renewal + 5 * DAY + 3600, null);
    check('la factura queda PAGADA', paid.status === 'paid', paid.status);
    check('la suscripcion vuelve a ACTIVA', after.sub && after.sub.status === 'active', after.sub && after.sub.status);
    check('no queda ninguna factura abierta', after.invs.filter(i => i.status === 'open').length === 0);
    check('acceso premium segun las reglas del webhook = SI', acceso(after.sub, null, renewal + 5 * DAY) === 'SI');
    console.log('Eventos que Stripe enviaria al webhook: invoice.paid y customer.subscription.updated (active). Este script NO ejecuta el webhook: solo calcula el acceso con sus reglas.');
  } catch(e){ check('escenario dia5 termino sin errores', false, e.message); }
  finally { if(c) await cleanup(c); }
}
async function escenarioCiclo31(){
  const start = Date.UTC(2026, 11, 31, 15, 12) / 1000; // 31 dic 2026: renueva 31 ene, luego 28 feb
  let c;
  try {
    try { c = await newClock(start, 'ciclo31'); }
    catch(e){ check('crear el reloj con inicio el 31 dic 2026', false, e.message); return; }
    await populate(c);
    const renewal = await breakCard(c);
    console.log('Primera renovacion (la que fallara):', fmt(renewal));
    await advance(c.clock.id, renewal + 3600);
    await snapshot('31 ene: falla la renovacion', c.cust.id, c.sub.id, renewal + 3600, renewal);
    const feb27 = Date.UTC(2027, 1, 27, 15, 12) / 1000;
    await advance(c.clock.id, feb27);
    await snapshot('27 feb (dia 27): todavia dentro de la ventana de un mes', c.cust.id, c.sub.id, feb27, renewal);
    const next = (await api('GET', '/subscriptions/' + c.sub.id)).items.data[0].current_period_end;
    console.log('Siguiente corte segun Stripe:', fmt(next));
    await advance(c.clock.id, next + 3600);
    const cross = await snapshot('28 feb: llega la siguiente renovacion', c.cust.id, c.sub.id, next + 3600, renewal);
    await advance(c.clock.id, next + 2 * DAY);
    const post = await snapshot('2 dias despues de la siguiente renovacion', c.cust.id, c.sub.id, next + 2 * DAY, renewal);
    const openNow = [cross, post].map(x => x.invs.filter(i => i.status === 'open').length);
    check('en ningun momento hay DOS facturas abiertas cobrables', Math.max(...openNow) <= 1, 'abiertas: ' + openNow.join(' / '));
    console.log('Estado final de la suscripcion:', post.sub ? post.sub.status : '(ninguna)');
  } catch(e){ check('escenario ciclo31 termino sin errores', false, e.message); }
  finally { if(c) await cleanup(c); }
}

(async () => {
  const which = (process.env.ESCENARIO || 'todas').toLowerCase();
  if(which === 'dia5' || which === 'todas') await escenarioDia5();
  if(which === 'ciclo31' || which === 'todas') await escenarioCiclo31();
  console.log('\n==== RESUMEN ====');
  CHECKS.forEach(x => console.log((x.ok ? 'PASA   ' : 'FALLA  ') + x.name));
  process.exit(CHECKS.every(x => x.ok) ? 0 : 2);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
