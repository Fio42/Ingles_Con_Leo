#!/usr/bin/env node
/* Contrato de la reactivación de miembros de pago (secuencia 14/35/56).
   Prueba EL MISMO módulo que corre en producción (member-reactivation-core.mjs)
   con casos de: activos, inactivos, nunca empezaron, pagos pendientes,
   renovaciones, cancelaciones, fechas desconocidas, duplicados y conflictos
   con otros correos. No llama a Supabase, Resend ni a los proveedores. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8').replace(/\r\n/g, '\n');
const D = 86400000, H = 3600000;
// 2026-10-13 15:00 UTC = 10:00 en Cancún (dentro de la ventana de envío)
const NOW = Date.parse('2026-10-13T15:00:00.000Z');
const iso = ms => new Date(ms).toISOString();
const ago = days => iso(NOW - days * D);

let passed = 0;
const queue = [];
function test(name, fn) { queue.push({ name, fn }); }

function member(o) {
  return Object.assign({
    is_member: true, email: 'alumno@example.com', email_opt_out_at: null, email_invalid: false,
    member_since: ago(1000), last_practice_at: ago(20), lifecycle_emails: {},
    last_marketing_email_at: null, streak_reminder_last_sent: null, survey_15d_sent_at: null,
    upgrade_email_1_sent_at: null, upgrade_email_2_sent_at: null, upgrade_email_3_sent_at: null,
  }, o || {});
}
const okBilling = (days) => ({ state: 'ok', periodEndMs: NOW + days * D, results: [] });

(async () => {
  const RC = await import(require('url').pathToFileURL(path.join(root, 'supabase_functions', 'member-reactivation-core.mjs')).href);

  const decide = (p, o) => {
    o = o || {};
    const nowMs = o.nowMs || NOW;
    const pre = RC.precheck({ profile: p, lastSessionAt: o.lastSessionAt || null, nowMs, ignoreHours: !!o.ignoreHours });
    return { pre, fin: RC.finalize(pre, o.billing === undefined ? okBilling(20) : o.billing, nowMs) };
  };

  // ---------------- Quién es elegible ----------------
  test('miembro inactivo 20 días con pago al día: sale el correo 1', () => {
    const r = decide(member());
    assert.strictEqual(r.fin.send, true);
    assert.strictEqual(r.fin.step, 1);
    assert.strictEqual(r.fin.kind, 'returning');
  });
  test('miembro que practicó hace menos de 14 días no recibe nada', () => {
    for (const d of [0, 1, 7, 13.9]) {
      const r = decide(member({ last_practice_at: ago(d) }));
      assert.strictEqual(r.fin.send, false, 'día ' + d);
      assert.strictEqual(r.fin.reason, 'not_inactive_long_enough');
    }
    assert.strictEqual(decide(member({ last_practice_at: ago(14.01) })).fin.send, true);
  });
  test('la actividad real es la más reciente entre last_practice_at y progress_sessions', () => {
    assert.strictEqual(decide(member({ last_practice_at: ago(30) }), { lastSessionAt: ago(2) }).fin.send, false);
    assert.strictEqual(decide(member({ last_practice_at: null, member_since: ago(1000) }), { lastSessionAt: ago(2) }).fin.send, false);
    assert.strictEqual(decide(member({ last_practice_at: ago(2) }), { lastSessionAt: ago(40) }).fin.send, false);
  });
  test('las visitas (last_seen_at) no cuentan como práctica', () => {
    const r = decide(member({ last_seen_at: ago(0.1) }));
    assert.strictEqual(r.fin.send, true);
  });
  test('quien pagó y nunca practicó es inactivo, pero con otro tipo (never_started)', () => {
    const p = member({ last_practice_at: null, member_since: ago(15) });
    const r = decide(p);
    assert.strictEqual(r.fin.send, true);
    assert.strictEqual(r.fin.kind, 'never_started');
    assert.strictEqual(decide(member({ last_practice_at: null, member_since: ago(13) })).fin.send, false);
  });
  test('una práctica de cuando era cuenta gratis (antes de member_since) no cuenta', () => {
    const r = decide(member({ last_practice_at: ago(50), member_since: ago(20) }));
    assert.strictEqual(r.fin.kind, 'never_started');
  });
  test('sin member_since ni actividad no se asume inactividad (dato no fiable)', () => {
    const r = decide(member({ last_practice_at: null, member_since: null }));
    assert.strictEqual(r.fin.send, false);
    assert.strictEqual(r.fin.reason, 'activity_unreliable');
  });
  test('baja, correo inválido, no miembro o sin correo: nunca', () => {
    assert.strictEqual(decide(member({ email_opt_out_at: ago(1) })).fin.send, false);
    assert.strictEqual(decide(member({ email_invalid: true })).fin.send, false);
    assert.strictEqual(decide(member({ is_member: false })).fin.send, false);
    assert.strictEqual(decide(member({ email: null })).fin.send, false);
  });

  // ---------------- Secuencia y ciclo ----------------
  test('correo 2 espera 21 días después del 1; correo 3 otros 21 después del 2; luego silencio', () => {
    const sent1 = ago(20.9);
    let p = member({ last_practice_at: ago(60), lifecycle_emails: { member_react_1: sent1 }, last_marketing_email_at: sent1 });
    assert.strictEqual(decide(p).fin.reason, 'waiting_next_step');
    p = member({ last_practice_at: ago(60), lifecycle_emails: { member_react_1: ago(21.1) }, last_marketing_email_at: ago(21.1) });
    assert.strictEqual(decide(p).fin.step, 2);
    p = member({ last_practice_at: ago(90), lifecycle_emails: { member_react_1: ago(45), member_react_2: ago(20.5) }, last_marketing_email_at: ago(20.5) });
    assert.strictEqual(decide(p).fin.reason, 'waiting_next_step');
    p = member({ last_practice_at: ago(90), lifecycle_emails: { member_react_1: ago(45), member_react_2: ago(21.2) }, last_marketing_email_at: ago(21.2) });
    assert.strictEqual(decide(p).fin.step, 3);
    p = member({ last_practice_at: ago(200), lifecycle_emails: { member_react_1: ago(150), member_react_2: ago(129), member_react_3: ago(108) }, last_marketing_email_at: ago(108) });
    assert.strictEqual(decide(p).fin.send, false);
    assert.strictEqual(decide(p).fin.reason, 'cycle_complete');
  });
  test('máximo tres correos por ciclo aunque pasen meses', () => {
    const p = member({ last_practice_at: ago(400), lifecycle_emails: { member_react_1: ago(300), member_react_2: ago(279), member_react_3: ago(258) } });
    assert.strictEqual(decide(p).fin.reason, 'cycle_complete');
  });
  test('si vuelve a practicar, el ciclo se cierra y los correos anteriores ya no cuentan', () => {
    const lc = { member_react_1: ago(10), member_react_2: ago(8) };
    const lp = ago(5);
    const st = RC.cycleState(lc, Date.parse(lp));
    assert.strictEqual(st.n, 0);
    const stale = RC.staleCycleEmails(lc, Date.parse(lp));
    assert.deepStrictEqual(stale.map(s => s.step), [1, 2]);
    // no hay nada pendiente: todavía no cumple 14 días nuevos
    assert.strictEqual(decide(member({ last_practice_at: lp, lifecycle_emails: lc })).fin.reason, 'not_inactive_long_enough');
  });
  test('si vuelve a quedar inactivo, empieza un ciclo nuevo respetando el freno de 14 días', () => {
    const lc = { member_react_1: ago(50), member_react_2: ago(29) };
    // volvió hace 20 días; el último correo fue hace 29 días: ciclo nuevo, correo 1
    const p = member({ last_practice_at: ago(20), lifecycle_emails: lc, last_marketing_email_at: ago(29) });
    const r = decide(p);
    assert.strictEqual(r.fin.send, true);
    assert.strictEqual(r.fin.step, 1);
    // si el último correo fue hace 5 días, el freno global lo detiene
    const p2 = member({ last_practice_at: ago(20), lifecycle_emails: lc, last_marketing_email_at: ago(5) });
    assert.strictEqual(decide(p2).fin.reason, 'recent_email');
  });
  test('sin duplicados: justo después de enviar el correo 1 no puede salir otro', () => {
    const justSent = iso(NOW - 60000);
    const p = member({ lifecycle_emails: { member_react_1: justSent }, last_marketing_email_at: justSent });
    assert.strictEqual(decide(p).fin.send, false);
    assert.strictEqual(decide(p).fin.reason, 'waiting_next_step');
  });
  test('una marca vieja en lifecycle_emails no cuenta si es anterior a la última práctica', () => {
    const st = RC.cycleState({ member_react_1: ago(100), member_react_2: ago(79), member_react_3: ago(58) }, Date.parse(ago(20)));
    assert.strictEqual(st.n, 0);
  });
  test('un paso suelto sin el anterior no cuenta (no se salta pasos)', () => {
    const st = RC.cycleState({ member_react_3: ago(1) }, Date.parse(ago(30)));
    assert.strictEqual(st.n, 0);
  });

  // ---------------- Freno global entre flujos (solo miembros) ----------------
  test('14 días desde el último correo no transaccional, sea del flujo que sea', () => {
    assert.strictEqual(decide(member({ last_marketing_email_at: ago(13.9) })).fin.reason, 'recent_email');
    assert.strictEqual(decide(member({ last_marketing_email_at: ago(14.1) })).fin.send, true);
    assert.strictEqual(decide(member({ lifecycle_emails: { checkout_followup: ago(5) } })).fin.reason, 'recent_email');
    assert.strictEqual(decide(member({ lifecycle_emails: { member_activation: ago(9) } })).fin.reason, 'recent_email');
    assert.strictEqual(decide(member({ lifecycle_emails: { long_term: ago(3), long_term_count: '2' } })).fin.reason, 'recent_email');
    assert.strictEqual(decide(member({ streak_reminder_last_sent: iso(NOW - 2 * D).slice(0, 10) })).fin.reason, 'recent_email');
    assert.strictEqual(decide(member({ survey_15d_sent_at: ago(4) })).fin.reason, 'recent_email');
    assert.strictEqual(decide(member({ upgrade_email_2_sent_at: ago(10) })).fin.reason, 'recent_email');
  });
  test('welcome, contadores y marcas "skipped" no cuentan como correo de marketing', () => {
    assert.strictEqual(decide(member({ lifecycle_emails: { welcome: ago(1), long_term_count: '5', day3: 'skipped', member_reactivation_3d_count: '2' } })).fin.send, true);
    assert.strictEqual(RC.lastNonTransactionalEmailMs(member({ lifecycle_emails: { welcome: ago(1) } })), null);
  });
  test('nunca dos correos de marketing el mismo día (cubierto por los 14 días)', () => {
    const sameDay = member({ last_marketing_email_at: iso(NOW - 6 * H) });
    assert.strictEqual(decide(sameDay).fin.send, false);
  });

  // ---------------- Ventana horaria ----------------
  test('solo de 8:00 a 20:59 hora de Cancún', () => {
    const at = utc => Date.parse('2026-10-13T' + utc + ':00.000Z');
    assert.strictEqual(RC.isReactivationSendHour(at('12:59')), false); // 7:59
    assert.strictEqual(RC.isReactivationSendHour(at('13:00')), true);  // 8:00
    assert.strictEqual(RC.isReactivationSendHour(at('01:59')), true);  // 20:59 (día anterior)
    assert.strictEqual(RC.isReactivationSendHour(at('02:00')), false); // 21:00
    assert.strictEqual(RC.isReactivationSendHour(at('08:00')), false); // 3:00
    const early = decide(member(), { nowMs: Date.parse('2026-10-13T08:00:00.000Z') });
    assert.strictEqual(early.fin.reason, 'outside_send_hours');
  });

  // ---------------- Protección de renovación (regla obligatoria) ----------------
  test('cinco días antes de renovar no se envía; el día de la renovación tampoco', () => {
    assert.strictEqual(RC.renewalGate(NOW + 6 * D, NOW), null);
    assert.strictEqual(RC.renewalGate(NOW + 5.01 * D, NOW), null);
    assert.strictEqual(RC.renewalGate(NOW + 5 * D, NOW), 'renewal_window');
    assert.strictEqual(RC.renewalGate(NOW + 4 * D, NOW), 'renewal_window');
    assert.strictEqual(RC.renewalGate(NOW + 1 * H, NOW), 'renewal_window');
    assert.strictEqual(RC.renewalGate(NOW, NOW), 'renewal_unconfirmed');
  });
  test('pasada la fecha prevista, no se envía hasta que el proveedor confirme el cobro nuevo', () => {
    assert.strictEqual(RC.renewalGate(NOW - 1 * H, NOW), 'renewal_unconfirmed');
    assert.strictEqual(RC.renewalGate(NOW - 3 * D, NOW), 'renewal_unconfirmed');
    // ya confirmado: el proveedor muestra el siguiente período a 30 días
    assert.strictEqual(RC.renewalGate(NOW + 30 * D, NOW), null);
  });
  test('ejemplo del pedido: renueva el día 20 -> nada desde el día 15; reanuda tras confirmar', () => {
    const base = Date.parse('2026-11-01T15:00:00.000Z');
    const renewal = base + 20 * D;
    const gate = day => RC.renewalGate(renewal, base + day * D);
    assert.strictEqual(gate(14), null);
    assert.strictEqual(gate(15), 'renewal_window');
    assert.strictEqual(gate(19), 'renewal_window');
    assert.strictEqual(gate(20), 'renewal_unconfirmed');
    assert.strictEqual(gate(21), 'renewal_unconfirmed'); // proveedor aún sin período nuevo
    assert.strictEqual(RC.renewalGate(renewal + 30 * D, base + 21 * D), null); // cobro confirmado
  });
  test('fecha desconocida, proveedor caído o sin suscripción: no se envía', () => {
    assert.strictEqual(decide(member(), { billing: { state: 'blocked', reason: 'no_renewal_date' } }).fin.reason, 'no_renewal_date');
    assert.strictEqual(decide(member(), { billing: RC.combineBilling([RC.evaluateStripe(null, NOW)]) }).fin.reason, 'provider_unavailable');
    assert.strictEqual(decide(member(), { billing: RC.combineBilling([]) }).fin.reason, 'no_paid_subscription');
    assert.strictEqual(decide(member(), { billing: null }).fin.send, false);
    assert.strictEqual(decide(member(), { billing: { state: 'ok', periodEndMs: null, results: [] } }).fin.reason, 'no_renewal_date');
  });
  test('la verificación del proveedor manda aunque el registro local diga otra cosa', () => {
    const p = member({ next_renewal_at: iso(NOW + 25 * D) }); // local dice lejos
    assert.strictEqual(decide(p, { billing: okBilling(2) }).fin.reason, 'renewal_window'); // proveedor dice cerca
  });

  // Stripe
  const stripeSub = (o) => Object.assign({
    status: 'active', cancel_at_period_end: false, cancel_at: null, pause_collection: null,
    latest_invoice: { status: 'paid' }, items: { data: [{ current_period_end: Math.floor((NOW + 20 * D) / 1000) }] },
  }, o || {});
  test('Stripe: activa y pagada con fecha futura -> ok', () => {
    const r = RC.evaluateStripe([stripeSub()], NOW);
    assert.strictEqual(r.state, 'ok');
    assert.strictEqual(r.periodEndMs, Math.floor((NOW + 20 * D) / 1000) * 1000);
  });
  test('Stripe: campo de fecha antiguo (current_period_end en la suscripción) también sirve', () => {
    const s = stripeSub({ items: { data: [{}] }, current_period_end: Math.floor((NOW + 9 * D) / 1000) });
    assert.strictEqual(RC.evaluateStripe([s], NOW).state, 'ok');
  });
  test('Stripe: pago fallido, pendiente, cancelación programada, pausa o factura sin pagar -> bloqueado', () => {
    for (const [o, why] of [
      [{ status: 'past_due' }, 'payment_failed_or_pending'],
      [{ status: 'unpaid' }, 'payment_failed_or_pending'],
      [{ status: 'incomplete' }, 'payment_failed_or_pending'],
      [{ cancel_at_period_end: true }, 'cancellation_scheduled'],
      [{ cancel_at: Math.floor(NOW / 1000) + 99999 }, 'cancellation_scheduled'],
      [{ pause_collection: { behavior: 'void' } }, 'paused'],
      [{ latest_invoice: { status: 'open' } }, 'invoice_not_paid'],
      [{ latest_invoice: { status: 'draft' } }, 'invoice_not_paid'],
      [{ latest_invoice: 'in_123' }, 'invoice_unverified'],
      [{ latest_invoice: null }, 'invoice_unverified'],
      [{ status: 'trialing' }, 'status_trialing'],
      [{ items: { data: [{}] } }, 'no_renewal_date'],
    ]) {
      const r = RC.evaluateStripe([stripeSub(o)], NOW);
      assert.strictEqual(r.state, 'blocked', JSON.stringify(o));
      assert.strictEqual(r.reason, why, JSON.stringify(o));
    }
  });
  test('Stripe: sin suscripciones vivas -> inactiva; si hay una mala y otra buena, bloquea', () => {
    assert.strictEqual(RC.evaluateStripe([{ status: 'canceled' }], NOW).state, 'inactive');
    assert.strictEqual(RC.evaluateStripe([], NOW).state, 'inactive');
    assert.strictEqual(RC.evaluateStripe([stripeSub(), stripeSub({ status: 'past_due' })], NOW).state, 'blocked');
    const two = RC.evaluateStripe([stripeSub(), stripeSub({ items: { data: [{ current_period_end: Math.floor((NOW + 3 * D) / 1000) }] } })], NOW);
    assert.strictEqual(two.periodEndMs, Math.floor((NOW + 3 * D) / 1000) * 1000); // manda la fecha más cercana
  });
  // PayPal
  const ppSub = (o) => Object.assign({
    status: 'ACTIVE',
    billing_info: { failed_payments_count: 0, outstanding_balance: { value: '0.00' }, last_payment: { time: ago(10), amount: { value: '2.00' } }, next_billing_time: iso(NOW + 20 * D) },
  }, o || {});
  test('PayPal: ACTIVE, sin fallos ni saldo y con próximo cobro futuro -> ok', () => {
    assert.strictEqual(RC.evaluatePaypal(ppSub(), NOW).state, 'ok');
  });
  test('PayPal: suspendida, fallos, saldo pendiente, sin fecha o sin cobro registrado -> bloqueado; cancelada -> inactiva', () => {
    assert.strictEqual(RC.evaluatePaypal(ppSub({ status: 'SUSPENDED' }), NOW).state, 'blocked');
    assert.strictEqual(RC.evaluatePaypal(ppSub({ status: 'APPROVAL_PENDING' }), NOW).state, 'blocked');
    const f = ppSub(); f.billing_info.failed_payments_count = 1;
    assert.strictEqual(RC.evaluatePaypal(f, NOW).reason, 'payment_failed_or_pending');
    const o = ppSub(); o.billing_info.outstanding_balance = { value: '2.00' };
    assert.strictEqual(RC.evaluatePaypal(o, NOW).reason, 'payment_failed_or_pending');
    const n = ppSub(); delete n.billing_info.next_billing_time;
    assert.strictEqual(RC.evaluatePaypal(n, NOW).reason, 'no_renewal_date');
    const l = ppSub(); delete l.billing_info.last_payment;
    assert.strictEqual(RC.evaluatePaypal(l, NOW).reason, 'no_payment_recorded');
    assert.strictEqual(RC.evaluatePaypal(ppSub({ status: 'CANCELLED' }), NOW).state, 'inactive');
    assert.strictEqual(RC.evaluatePaypal(null, NOW).reason, 'provider_unavailable');
  });
  // Mercado Pago
  const mpPre = (o) => Object.assign({ status: 'authorized', next_payment_date: iso(NOW + 20 * D), summarized: {} }, o || {});
  test('Mercado Pago: authorized con próximo cobro futuro -> ok; pausada, pendiente o sin fecha -> bloqueado', () => {
    assert.strictEqual(RC.evaluateMp(mpPre(), NOW).state, 'ok');
    assert.strictEqual(RC.evaluateMp(mpPre({ status: 'paused' }), NOW).state, 'blocked');
    assert.strictEqual(RC.evaluateMp(mpPre({ status: 'pending' }), NOW).state, 'blocked');
    assert.strictEqual(RC.evaluateMp(mpPre({ next_payment_date: null }), NOW).reason, 'no_renewal_date');
    assert.strictEqual(RC.evaluateMp(mpPre({ summarized: { pending_charge_quantity: 1 } }), NOW).reason, 'payment_failed_or_pending');
    assert.strictEqual(RC.evaluateMp(mpPre({ status: 'cancelled' }), NOW).state, 'inactive');
    assert.strictEqual(RC.evaluateMp(undefined, NOW).reason, 'provider_unavailable');
  });
  test('varios proveedores: cualquier bloqueo bloquea; una inactiva no estorba a una activa; solo inactivas -> sin suscripción', () => {
    const ok = RC.evaluateStripe([stripeSub()], NOW);
    const bad = RC.evaluatePaypal(ppSub({ status: 'SUSPENDED' }), NOW);
    const dead = RC.evaluateMp(mpPre({ status: 'cancelled' }), NOW);
    assert.strictEqual(RC.combineBilling([ok, bad]).state, 'blocked');
    assert.strictEqual(RC.combineBilling([ok, dead]).state, 'ok');
    assert.strictEqual(RC.combineBilling([dead]).reason, 'no_paid_subscription');
  });

  // ---------------- Simulación de meses, sin repartir atrasados de golpe ----------------
  test('simulación de 200 días para cada día de renovación posible: máximo 3 correos, separados 21+ días y ninguno en la ventana de renovación', () => {
    for (let offset = 0; offset < 30; offset++) {
      const start = Date.parse('2026-09-01T00:00:00.000Z');
      const lastPractice = start - 1 * D;
      let lifecycle = {}, lastMarketing = null;
      const sends = [];
      for (let h = 0; h < 200 * 24; h++) {
        const t = start + h * H;
        // renovaciones cada 30 días desde "offset"; el proveedor tarda 3 h en confirmar el cobro nuevo
        const rel = t - (start + offset * D);
        const R = start + offset * D + Math.floor(rel / (30 * D)) * 30 * D;
        const periodEnd = (t - R < 3 * H) ? R : R + 30 * D; // en esas 3 h el proveedor aún muestra el período vencido
        const p = member({ last_practice_at: iso(lastPractice), member_since: iso(start - 90 * D), lifecycle_emails: lifecycle, last_marketing_email_at: lastMarketing ? iso(lastMarketing) : null });
        const pre = RC.precheck({ profile: p, lastSessionAt: null, nowMs: t });
        const fin = RC.finalize(pre, { state: 'ok', periodEndMs: periodEnd, results: [] }, t);
        if (fin.send) {
          assert.ok(periodEnd - t > 5 * D, 'envío dentro de la ventana de 5 días (offset ' + offset + ')');
          sends.push(t);
          lifecycle = Object.assign({}, lifecycle, { ['member_react_' + fin.step]: iso(t) });
          for (let i = fin.step; i < 3; i++) delete lifecycle['member_react_' + (i + 1)];
          lastMarketing = t;
        }
      }
      assert.ok(sends.length <= 3, 'más de 3 correos (offset ' + offset + ')');
      assert.strictEqual(sends.length, 3, 'debía completar los 3 (offset ' + offset + ')');
      for (let i = 1; i < sends.length; i++) assert.ok(sends[i] - sends[i - 1] >= 21 * D - 1000, 'separación menor a 21 días (offset ' + offset + ')');
    }
  });

  // ---------------- Contenido ----------------
  const SITE = 'https://inglesconleo.com';
  const EM_DASH = '—';
  test('asuntos y botones exactamente como se pidieron', () => {
    const c1 = RC.buildContent({ site: SITE, kind: 'returning', step: 1 });
    const c2 = RC.buildContent({ site: SITE, kind: 'returning', step: 2, leoAi: true });
    const c3 = RC.buildContent({ site: SITE, kind: 'returning', step: 3 });
    assert.strictEqual(c1.subject, '¿Practicamos inglés cinco minutos?');
    assert.strictEqual(c1.ctaText, 'Retomar mi práctica');
    assert.strictEqual(c2.subject, 'Hay más formas de practicar tu inglés');
    assert.strictEqual(c2.ctaText, 'Explorar mi plan de estudio');
    assert.strictEqual(c3.subject, 'Tu próximo paso puede ser muy sencillo');
    assert.strictEqual(c3.ctaText, 'Continuar aprendiendo');
    assert.strictEqual(new Set([c1.subject, c2.subject, c3.subject]).size, 3);
  });
  test('quien nunca empezó no recibe "te extrañamos" ni "volver"; el correo 1 se adapta a su primera sesión', () => {
    for (let step = 1; step <= 3; step++) {
      const c = RC.buildContent({ site: SITE, kind: 'never_started', step, leoAi: true });
      const text = (c.title + c.bodyHtml + c.ctaText + c.preheader).toLowerCase();
      assert.doesNotMatch(text, /extra[ñn]|volver|retomar|de nuevo|otra vez|hace tiempo|dejaste/);
    }
    const c1 = RC.buildContent({ site: SITE, kind: 'never_started', step: 1 });
    assert.match(c1.bodyHtml, /primera sesión/);
    assert.strictEqual(c1.ctaText, 'Empezar mi primera práctica');
  });
  test('los correos no hablan de pagos, renovación ni cancelación, ni presionan', () => {
    for (const kind of ['returning', 'never_started']) for (let step = 1; step <= 3; step++) {
      const c = RC.buildContent({ site: SITE, kind, step, leoAi: true, mistakes: 3, skill: 'listening' });
      const text = (c.title + c.bodyHtml + c.subject + c.preheader + c.ctaText).toLowerCase();
      assert.doesNotMatch(text, /pago|cobro|renov|cancel|suscrip|membres|precio|oferta|descuento|últim[oa] oportunidad|no pierdas/);
      assert.ok(!text.includes(EM_DASH), 'raya larga en el texto');
      assert.ok(!/\bpierdes\b|culpa|abandon/.test(text));
    }
  });
  test('personalización solo con datos reales: habilidad conocida y errores guardados', () => {
    const a = RC.buildContent({ site: SITE, kind: 'returning', step: 1, skill: 'listening' });
    assert.match(a.bodyHtml, /practicaste listening/);
    const b = RC.buildContent({ site: SITE, kind: 'returning', step: 1, skill: 'plan' });
    assert.doesNotMatch(b.bodyHtml, /practicaste/); // "plan" no es una habilidad: no se inventa
    const c = RC.buildContent({ site: SITE, kind: 'returning', step: 2, mistakes: 7, leoAi: true });
    assert.match(c.bodyHtml, /tienes 7 errores guardados/);
    const d = RC.buildContent({ site: SITE, kind: 'returning', step: 2, mistakes: 0, leoAi: true });
    assert.doesNotMatch(d.bodyHtml, /tienes \d+ error/);
    const e = RC.buildContent({ site: SITE, kind: 'returning', step: 2, mistakes: 1, leoAi: false });
    assert.match(e.bodyHtml, /1 error guardado/);
    assert.doesNotMatch(e.bodyHtml, /Leo AI/); // si Leo AI no está disponible, no se promete
    assert.match(c.bodyHtml, /Leo AI/);
  });
  test('el correo 2 presenta exactamente 3 funciones reales y el 3 avisa que es el último', () => {
    const c2 = RC.buildContent({ site: SITE, kind: 'returning', step: 2, leoAi: true });
    assert.strictEqual((c2.bodyHtml.match(/<li /g) || []).length, 3);
    const c3 = RC.buildContent({ site: SITE, kind: 'returning', step: 3 });
    assert.match(c3.bodyHtml, /último correo de esta serie/);
  });
  test('los botones llevan a páginas que existen, con seguimiento por campaña', () => {
    const expect = { 1: 'practica-miembros.html', 2: 'plan-estudio.html', 3: 'practica-miembros.html' };
    for (const kind of ['returning', 'never_started']) for (const step of [1, 2, 3]) {
      const c = RC.buildContent({ site: SITE, kind, step });
      const u = new URL(c.ctaUrl);
      assert.strictEqual(u.origin, SITE);
      assert.strictEqual(u.pathname, '/' + expect[step]);
      assert.ok(fs.existsSync(path.join(root, expect[step])), 'no existe ' + expect[step]);
      assert.strictEqual(u.searchParams.get('utm_campaign'), 'member_react_' + step);
      assert.strictEqual(u.searchParams.get('utm_medium'), 'reactivacion');
    }
    // los textos no repiten los asuntos de otros flujos existentes
    const src = read('supabase_functions', 'upgrade-nudge-emails.ts');
    for (const step of [1, 2, 3]) {
      const subj = RC.buildContent({ site: SITE, kind: 'returning', step }).subject;
      const count = src.split("subject: '" + subj.replace(/'/g, "\\'") + "'").length - 1;
      assert.strictEqual(count, 0, 'asunto repetido en otro flujo: ' + subj);
    }
  });

  // ---------------- Cableado en la Edge Function (código real) ----------------
  const idx = read('supabase_functions', 'upgrade-nudge-emails.ts');
  const dep = read('supabase', 'functions', 'upgrade-nudge-emails', 'index.ts');
  test('la copia que se despliega es idéntica a la de supabase_functions (función y reglas)', () => {
    assert.strictEqual(dep, idx);
    assert.strictEqual(
      read('supabase', 'functions', 'upgrade-nudge-emails', 'member-reactivation-core.mjs'),
      read('supabase_functions', 'member-reactivation-core.mjs')
    );
  });
  test('el flujo viejo de 3 y 10 días ya no existe como envío', () => {
    assert.doesNotMatch(idx, /'member_reactivation_3d'|'member_reactivation_10d'/);
    assert.doesNotMatch(idx, /MEMBER_REACTIVATION_(3D|10D)_MIN_DAYS|inRenewalSilenceZone|MEMBER_RENEWAL_SILENCE/);
  });
  test('se conservan activación de miembro, bienvenida y las reglas de cuentas gratis', () => {
    assert.match(idx, /'member_activation'/);
    assert.match(idx, /const MARKETING_EMAIL_MIN_GAP_HOURS = 24/);
    assert.match(idx, /async function sweepMemberWelcomes/);
    assert.match(idx, /\.eq\('is_member', false\)/);
    assert.match(idx, /function decideEmail\(/);
    assert.doesNotMatch(idx, /REACT\.GLOBAL_GAP_DAYS[\s\S]{0,200}function decideEmail/);
  });
  test('el envío está apagado salvo MEMBER_REACTIVATION_V2=on y se limita por pasada', () => {
    assert.match(idx, /Deno\.env\.get\('MEMBER_REACTIVATION_V2'\) === 'on'/);
    assert.match(idx, /if \(!reactEnabled \|\| reactSent >= MAX_REACTIVATION_PER_RUN\) continue/);
    assert.match(idx, /const MAX_REACTIVATION_PER_RUN = \d+/);
  });
  test('orden dentro de runReactivationFor: reglas -> proveedor en vivo -> decisión -> freno atómico -> envío -> registro', () => {
    const body = idx.slice(idx.indexOf('async function runReactivationFor'));
    const order = ['RC.precheck(', 'verifyMemberBilling(p)', 'RC.finalize(', "if (dryRun) return", '.or(`last_marketing_email_at.is.null', 'sendReactivationViaResend(', "merged[RC.STEP_KEYS", "'sent'"];
    let at = -1;
    for (const frag of order) {
      const i = body.indexOf(frag, at + 1);
      assert.ok(i > at, 'falta o está fuera de orden: ' + frag);
      at = i;
    }
  });
  test('la simulación y el envío real comparten el mismo camino; la simulación no escribe correos', () => {
    assert.match(idx, /runReactivationFor\(m\.id, true\)/);
    assert.match(idx, /runReactivationFor\(p\.id, false\)/);
    const dry = idx.slice(idx.indexOf('async function runReactivationFor'), idx.indexOf('// Si el alumno volvió a practicar después'));
    // todo lo que escribe o envía va después del return de la simulación
    const afterDry = dry.slice(dry.indexOf('if (dryRun) return'));
    const beforeDry = dry.slice(0, dry.indexOf('if (dryRun) return'));
    assert.doesNotMatch(beforeDry.replace(/if \(!dryRun[\s\S]*?\n    \}\n/g, ''), /\.update\(|\.upsert\(|sendReactivationViaResend\(/);
    assert.match(afterDry, /sendReactivationViaResend\(/);
  });
  test('el freno atómico revisa miembro, baja y correo inválido, y se devuelve si el envío falla', () => {
    const body = idx.slice(idx.indexOf('async function runReactivationFor'));
    assert.match(body, /\.eq\('is_member', true\)\s*\.is\('email_opt_out_at', null\)\s*\.eq\('email_invalid', false\)/);
    assert.match(body, /if \(!sent\.ok\) \{[\s\S]*last_marketing_email_at: p\.last_marketing_email_at \?\? null/);
  });
  test('los correos llevan baja con un clic, enlace de baja y etiquetas para medir', () => {
    assert.match(idx, /'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'/);
    assert.match(idx, /flow', value: 'member_reactivation'|name: 'flow', value: 'member_reactivation'/);
    assert.match(idx, /unsubLinks\(userId\)/);
  });
  test('con los proveedores de pago solo se hacen LECTURAS (GET) y nunca se cambia un cobro', () => {
    const block = idx.slice(idx.indexOf('async function stripeSubscriptions'), idx.indexOf('async function lastSessionInfo'));
    assert.doesNotMatch(block, /method: '(PUT|PATCH|DELETE)'/);
    assert.strictEqual((block.match(/method: '/g) || []).length, 1); // la única no-lectura es el token de PayPal
    assert.match(block, /oauth2\/token`, \{\s*method: 'POST'/);
    assert.match(block, /api\.stripe\.com\/v1\/subscriptions\?customer=/);
    assert.match(block, /\/v1\/billing\/subscriptions\//);
    assert.match(block, /api\.mercadopago\.com\/preapproval\//);
    // lo único que se escribe de pagos es la fecha de renovación
    const writes = idx.slice(idx.indexOf('async function runReactivationFor')).match(/\.update\(\{ next_renewal_at[^}]*\}\)/g) || [];
    assert.ok(writes.length >= 1);
    assert.doesNotMatch(idx.slice(idx.indexOf('async function billingSync')), /is_member: (true|false)\s*[,}]\s*\)/);
  });
  test('billing_sync solo guarda la fecha cuando el proveedor confirma suscripción activa y pagada', () => {
    const b = idx.slice(idx.indexOf('async function billingSync'));
    assert.match(b, /b\.state === 'ok' && b\.periodEndMs && b\.periodEndMs > Date\.now\(\)/);
    assert.match(b, /if \(apply && /);
    assert.match(b, /\.update\(\{ next_renewal_at: new Date\(b\.periodEndMs\)\.toISOString\(\) \}\)/);
    assert.match(idx, /body\.billing_sync === true[\s\S]{0,80}billingSync\(body\.apply === true\)/);
  });
  test('quien volvió a practicar cancela los pendientes: se registra y se limpia el ciclo', () => {
    assert.match(idx, /async function closeReturnedCycles/);
    assert.match(idx, /'cancelled_returned'/);
    assert.match(idx, /await closeReturnedCycles\(p as unknown as Record<string, any>\)/);
  });
  test('la bitácora existe en el esquema, sin acceso público, y los clics se registran desde Resend', () => {
    const schema = read('supabase_schema.sql');
    assert.match(schema, /create table if not exists public\.member_reactivation_log/);
    assert.match(schema, /alter table public\.member_reactivation_log enable row level security/);
    assert.match(schema, /revoke all on table public\.member_reactivation_log from anon, authenticated/);
    assert.match(schema, /create or replace view public\.member_reactivation_results/);
    const hook = read('supabase_functions', 'resend-webhook.ts');
    assert.match(hook, /type === 'email\.clicked'/);
    assert.match(hook, /'member_reactivation'/);
    assert.match(hook, /BOUNCE_EVENTS\.has\(type\)/); // los rebotes siguen igual
  });
  test('los correos esenciales de pago no se tocaron: los webhooks de pago no se modificaron para esto', () => {
    for (const f of ['stripe-webhook.ts', 'paypal-webhook.ts', 'mp-webhook.ts']) {
      assert.doesNotMatch(read('supabase_functions', f), /member_react|member_reactivation_log/);
    }
  });

  test('SEGURIDAD: la función de correos exige llave interna ANTES de leer el cuerpo; el webhook de Resend verifica la firma ANTES de procesar clics', () => {
    const serve = idx.slice(idx.indexOf('Deno.serve('));
    assert.ok(serve.indexOf('internalSecretOk(') > -1 && serve.indexOf('internalSecretOk(') < serve.indexOf('await req.json()'));
    assert.ok(serve.indexOf('internalSecretOk(') < serve.indexOf('reactivation_dry_run'));
    assert.ok(serve.indexOf('internalSecretOk(') < serve.indexOf('billing_sync'));
    assert.match(serve.slice(0, serve.indexOf('await req.json()')), /return json\(\{ ok: false, error: 'unauthorized' \}, 401\)/);
    const hook = read('supabase_functions', 'resend-webhook.ts');
    assert.ok(hook.indexOf('verifySvixSignature(svixId') > -1);
    assert.ok(hook.indexOf('await verifySvixSignature(') < hook.indexOf("type === 'email.clicked'"));
    assert.ok(hook.indexOf('await verifySvixSignature(') < hook.indexOf('recordReactivationClick(event)'));
    // el clic solo escribe en la bitácora, nunca en perfiles
    const click = hook.slice(hook.indexOf('async function recordReactivationClick'), hook.indexOf('// Verificación de firma Svix'));
    assert.doesNotMatch(click, /from\('profiles'\)\s*\.(update|upsert|insert|delete)/);
  });
  test('ALCANCE DEL FRENO DE 14 DÍAS: solo la reactivación de miembros lo usa; los correos de pago, claves y avisos no lo leen ni lo escriben', () => {
    const files = fs.readdirSync(path.join(root, 'supabase_functions')).filter(f => f.endsWith('.ts'));
    for (const f of files) {
      if (f === 'upgrade-nudge-emails.ts') continue;
      assert.doesNotMatch(read('supabase_functions', f), /lastNonTransactionalEmailMs|GLOBAL_GAP_DAYS|member-reactivation-core/, f);
    }
    for (const f of ['stripe-webhook.ts', 'paypal-webhook.ts', 'mp-webhook.ts', 'send-password-reset.ts', 'notify-new-comment.ts']) {
      assert.doesNotMatch(read('supabase_functions', f), /last_marketing_email_at/, f);
    }
    // dentro de la función de correos, el freno de 14 días solo existe en precheck (reactivación)
    assert.strictEqual((idx.match(/RC\.precheck\(/g) || []).length, 1);
    assert.doesNotMatch(idx.slice(0, idx.indexOf('async function runReactivationFor')), /GLOBAL_GAP_DAYS/);
    // activación inicial y bienvenida conservan su regla propia
    assert.match(idx, /hoursSince\(p\.last_marketing_email_at, now\) < MARKETING_EMAIL_MIN_GAP_HOURS/);
    assert.match(idx, /const NO_COOLDOWN_KEYS = new Set\(\['welcome'\]\)/);
  });

  for (const t of queue) {
    try { t.fn(); passed++; console.log('  ok  ' + t.name); }
    catch (err) { console.error('FALLA ' + t.name + '\n' + err.stack); process.exitCode = 1; }
  }
  console.log('\n' + passed + ' de ' + queue.length + ' pruebas PASS');
})().catch(e => { console.error(e); process.exit(1); });
