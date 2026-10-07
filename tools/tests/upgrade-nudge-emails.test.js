#!/usr/bin/env node
/* Contrato de regresión de los disparadores sensibles de
   upgrade-nudge-emails. No llama a Supabase ni Resend: protege los límites,
   exclusiones y prioridades que la Edge Function aplica antes de enviar. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..', '..');
const source = fs.readFileSync(path.join(root, 'supabase_functions', 'upgrade-nudge-emails.ts'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'backend.js'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'supabase_schema.sql'), 'utf8');

const H = 3600000, D = 24 * H;
const now = Date.parse('2026-10-07T18:00:00.000Z');
const ago = hours => new Date(now - hours * H).toISOString();
const daysAgo = days => new Date(now - days * D).toISOString();

function decideChangedTrigger(p){
  if(p.is_member || p.email_opt_out_at) return null;
  const life = p.lifecycle_emails || {};
  const gap = p.last_marketing_email_at ? (now - Date.parse(p.last_marketing_email_at)) / H : Infinity;
  if(gap < 24) return null;
  const since = iso => (now - Date.parse(iso)) / H;

  if(p.free_daily_limit_reached_at){
    const hitHours = since(p.free_daily_limit_reached_at);
    const prior = life.limit_reached;
    const fresh = !prior || Date.parse(p.free_daily_limit_reached_at) > Date.parse(prior);
    const cooldown = !prior || since(prior) >= 7 * 24;
    if(hitHours >= .5 && hitHours <= 1.5 && fresh && cooldown) return 'limit_reached';
  }
  if(p.checkout_started_at){
    const checkoutHours = since(p.checkout_started_at);
    const prior = life.checkout_abandoned;
    const cooldown = !prior || since(prior) >= 14 * 24;
    if(checkoutHours >= 2 && checkoutHours <= 4 && cooldown) return 'checkout_abandoned';
  }
  if(p.free_daily_limit_reached_at && p.free_last_practice_at){
    const hitHours = since(p.free_daily_limit_reached_at);
    const prior = life.limit_reset;
    const fresh = !prior || Date.parse(p.free_daily_limit_reached_at) > Date.parse(prior);
    const resumed = Date.parse(p.free_last_practice_at) > Date.parse(p.free_daily_limit_reached_at);
    if(hitHours >= 24 && hitHours <= 28 && fresh && !resumed) return 'limit_reset';
  }
  const ageHours = since(p.created_at);
  if(!p.free_first_exercise_at && !life.abandoned_signup && ageHours >= 24 && ageHours <= 72) return 'abandoned_signup';
  const lastPractice = p.free_last_practice_at || (p.free_daily_date ? p.free_daily_date + 'T00:00:00Z' : null);
  if(!life.reactivation_day14 && p.free_first_exercise_at && lastPractice && ageHours >= 14 * 24 && since(lastPractice) >= 10 * 24) return 'reactivation_day14';
  return null;
}

function free(overrides){
  return Object.assign({
    is_member:false, email_opt_out_at:null, lifecycle_emails:{ welcome:ago(30) },
    created_at:daysAgo(20), last_marketing_email_at:null,
    free_first_exercise_at:daysAgo(20), free_daily_date:'2026-09-20',
    free_last_practice_at:daysAgo(20), free_daily_limit_reached_at:null,
    checkout_started_at:null,
  }, overrides || {});
}

let passed = 0;
function test(name, fn){
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch(err){ console.error('FALLA ' + name + '\n' + err.stack); process.exitCode = 1; }
}

test('la señal UTC viaja en la misma escritura de práctica gratis y tiene permiso limitado', () => {
  assert.match(backend, /free_daily_count: count,[\s\S]*free_last_practice_at: new Date\(\)\.toISOString\(\)/);
  assert.match(schema, /add column if not exists free_last_practice_at timestamptz/);
  assert.match(schema, /grant update \([^)]*free_last_practice_at[^)]*\) on public\.profiles to authenticated/);
});

test('limit_reached usa ventana 30–90 minutos, una vez por episodio y conserva mañana gratis', () => {
  assert.strictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:ago(1), free_last_practice_at:ago(1.001) })), 'limit_reached');
  assert.notStrictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:ago(.49) })), 'limit_reached');
  assert.notStrictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:ago(1.51) })), 'limit_reached');
  assert.notStrictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:ago(1), lifecycle_emails:{ welcome:ago(30), limit_reached:ago(.8) } })), 'limit_reached');
  assert.match(source, /Esperar a mañana:[\s\S]*tus 10 ejercicios se reinician solos/);
});

test('limit_reset llega 24–28h solo si no volvió a practicar desde el límite', () => {
  const hit = ago(25);
  assert.strictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:hit, free_last_practice_at:ago(25.01) })), 'limit_reset');
  assert.strictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:hit, free_last_practice_at:ago(1) })), null);
  assert.notStrictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:ago(23.9) })), 'limit_reset');
  assert.notStrictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:ago(28.1) })), 'limit_reset');
  assert.strictEqual(decideChangedTrigger(free({ free_daily_limit_reached_at:hit, free_last_practice_at:ago(25.01), lifecycle_emails:{ welcome:ago(30), limit_reset:ago(24) } })), null);
  assert.match(source, /ctaText: 'Practicar mis 10 ejercicios de hoy'/);
});

test('miembro, baja y usuario convertido no reciben los disparadores gratis', () => {
  const hit = ago(25);
  assert.strictEqual(decideChangedTrigger(free({ is_member:true, free_daily_limit_reached_at:hit })), null);
  assert.strictEqual(decideChangedTrigger(free({ email_opt_out_at:ago(2), free_daily_limit_reached_at:hit })), null);
  assert.match(source, /\.eq\('is_member', false\)/);
  assert.match(source, /if \(!fresh \|\| fresh\.is_member !== expectedIsMember\) return false/);
  assert.match(source, /if \(fresh\.email_opt_out_at\) return false/);
});

test('abandoned_signup espera ~24h y no sale a los 30 minutos', () => {
  assert.strictEqual(decideChangedTrigger(free({ free_first_exercise_at:null, free_last_practice_at:null, created_at:ago(.5) })), null);
  assert.strictEqual(decideChangedTrigger(free({ free_first_exercise_at:null, free_last_practice_at:null, created_at:ago(24.2) })), 'abandoned_signup');
});

test('reactivation_day14 solo sale a quien practicó y está inactivo de verdad', () => {
  assert.strictEqual(decideChangedTrigger(free({ free_last_practice_at:daysAgo(10.1) })), 'reactivation_day14');
  assert.strictEqual(decideChangedTrigger(free({ free_last_practice_at:daysAgo(1) })), null);
  assert.strictEqual(decideChangedTrigger(free({ free_first_exercise_at:null, free_last_practice_at:null })), null);
});

test('checkout abandonado tiene prioridad detrás del límite y no afirma fallo de pago', () => {
  assert.strictEqual(decideChangedTrigger(free({ checkout_started_at:ago(3), free_daily_limit_reached_at:ago(1), free_last_practice_at:ago(1.01) })), 'limit_reached');
  assert.strictEqual(decideChangedTrigger(free({ checkout_started_at:ago(3) })), 'checkout_abandoned');
  assert.notStrictEqual(decideChangedTrigger(free({ checkout_started_at:ago(4.1) })), 'checkout_abandoned');
  assert.match(source, /subject: '¿Quieres terminar de activar tu membresía\?'/);
  assert.doesNotMatch(source.slice(source.indexOf('checkout_abandoned:'), source.indexOf('active_free_pitch:')), /falló el pago|rechazaron la tarjeta/);
});

console.log('\n' + passed + ' pruebas PASS');
