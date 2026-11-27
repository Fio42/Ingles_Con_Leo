/* Riso · prueba de la migración PENDIENTE supabase/pendientes/20261128_riso_chat_piloto.sql contra un Postgres embebido
   (PGlite) con el esquema real de Leo AI (supabase_functions/leo-ai.sql + migración de la prueba gratis).
   No toca la base real. Uso: node tools/tests/riso-chat-sql.test.js (necesita @electric-sql/pglite; busca en LEO_PGLITE_DIR, /tmp/pgl). */
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createRequire } = require('module'), { pathToFileURL } = require('url');
const ROOT = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const U = { leo: '00000000-0000-4000-8000-00000000c001', miembro: '00000000-0000-4000-8000-00000000c002', gratis: '00000000-0000-4000-8000-00000000c003', sinConfirmar: '00000000-0000-4000-8000-00000000c004' };

async function loadPglite() {
  for (const d of [process.env.LEO_PGLITE_DIR, '/tmp/pgl', process.cwd(), ROOT].filter(Boolean)) {
    try { const p = createRequire(path.join(d, 'x.js')).resolve('@electric-sql/pglite'); const m = await import(pathToFileURL(p).href); return m.PGlite; } catch (e) { /* sigue */ }
  }
  return null;
}
async function db0(PGlite) {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
    create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false, member_since timestamptz);
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    create table public.log_calls (fp text, severity text, message text);
    create function public.log_app_error(p_fp text, p_kind text, p_source text, p_severity text, p_section text, p_message text, p_error_name text,
      p_stack_top text, p_code text, p_release text, p_browser text, p_platform text, p_sample jsonb) returns jsonb language plpgsql as $$
      begin insert into public.log_calls values (p_fp, p_severity, p_message); return '{"logged":true}'; end $$;
  `);
  await db.exec(read('supabase_functions/leo-ai.sql'));
  await db.exec(read('supabase/migrations/20261016001253_leo_ai_trial.sql'));
  await db.exec(`insert into auth.users values ('${U.leo}', now()), ('${U.miembro}', now()), ('${U.gratis}', now()), ('${U.sinConfirmar}', null);
    insert into public.profiles (id, is_member) values ('${U.leo}', true), ('${U.miembro}', true), ('${U.gratis}', false), ('${U.sinConfirmar}', false);
    insert into public.leo_ai_config (id, enabled, public) values (true, true, true) on conflict (id) do update set enabled = true, public = true;`);
  await db.exec(read('supabase/pendientes/20261128_riso_chat_piloto.sql'));
  return db;
}
const q1 = async (db, sql, p) => (await db.query(sql, p || [])).rows[0];
const reserve = async (db, u, id, est) => (await q1(db, 'select public.riso_chat_reserve($1, $2, $3) r', [u, id, est == null ? 12 : est])).r.status;
const finish = async (db, u, id, ok, inp, out, n) => q1(db, 'select public.riso_chat_finish($1,$2,$3,$4,$5,$6,$7) r', [u, id, ok, inp || 1000, out || 90, n == null ? 11.5 : n, JSON.stringify({ texto: 'x' })]);
const hoy = "(now() at time zone 'utc')::date";

(async () => {
  const PGlite = await loadPglite();
  if (!PGlite) { console.log('  (omitida: falta @electric-sql/pglite)'); return; }
  let p = 0, f = 0;
  async function test(n, fn) { try { await fn(); p++; console.log('  ok   ' + n); } catch (e) { f++; console.log('  FAIL ' + n + '\n       ' + (e && e.message)); } }

  await test('la migración no cambia los límites actuales de Leo AI y nace apagada', async () => {
    const db = await db0(PGlite);
    const c = await q1(db, 'select * from public.leo_ai_config');
    assert.strictEqual(c.user_daily_limit, 100); assert.strictEqual(+c.neuron_budget, 8000); assert.strictEqual(c.global_daily_limit, 1500);
    assert.strictEqual(c.chat_enabled, false); assert.strictEqual(c.chat_pilot_only, true); assert.strictEqual(c.allow_paid, false);
    assert.strictEqual(await reserve(db, U.leo, 'req-00000001'), 'disabled');
  });
  await test('piloto: solo la cuenta de la lista; los demás, aunque sean miembros, no entran', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true; insert into public.riso_pilot_testers values ('${U.leo}')`);
    assert.strictEqual(await reserve(db, U.miembro, 'req-00000001'), 'not_allowed');
    assert.strictEqual(await reserve(db, U.leo, 'req-00000002'), 'ok');
  });
  await test('cuenta gratis sin correo confirmado no entra (fuera del piloto)', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false`);
    assert.strictEqual(await reserve(db, U.sinConfirmar, 'req-00000001'), 'unverified');
    assert.strictEqual(await reserve(db, U.gratis, 'req-00000002'), 'ok');
  });
  await test('cuota por alumno cuenta lo que está en curso (simultáneos) y no lo que falló', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false, chat_free_daily = 2`);
    assert.strictEqual(await reserve(db, U.gratis, 'req-a0000001'), 'ok');
    assert.strictEqual(await reserve(db, U.gratis, 'req-a0000002'), 'ok');
    assert.strictEqual(await reserve(db, U.gratis, 'req-a0000003'), 'user_limit'); // dos en curso
    await finish(db, U.gratis, 'req-a0000001', false, 0, 0, 0);                 // falló: libera
    assert.strictEqual(await reserve(db, U.gratis, 'req-a0000004'), 'ok');
  });
  await test('idempotencia: el mismo request_id no descuenta dos veces y devuelve la respuesta guardada', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false`);
    assert.strictEqual(await reserve(db, U.miembro, 'req-b0000001'), 'ok');
    assert.strictEqual(await reserve(db, U.miembro, 'req-b0000001'), 'in_progress');
    await finish(db, U.miembro, 'req-b0000001', true);
    const r = await q1(db, `select public.riso_chat_reserve($1, 'req-b0000001', 12) r`, [U.miembro]);
    assert.strictEqual(r.r.status, 'duplicate'); assert.strictEqual(r.r.answer.texto, 'x');
    assert.strictEqual((await q1(db, `select count from public.riso_chat_usage where user_id = $1`, [U.miembro])).count, 1);
  });
  await test('pedido colgado más de 60 s se libera solo', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false, chat_free_daily = 1`);
    assert.strictEqual(await reserve(db, U.gratis, 'req-c0000001'), 'ok');
    await db.exec(`update public.riso_chat_requests set updated_at = now() - interval '2 minutes'`);
    assert.strictEqual(await reserve(db, U.gratis, 'req-c0000002'), 'ok');
  });
  await test('total del piloto: 100 consultas generativas como máximo', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_total = 3, chat_member_daily = 50; insert into public.riso_pilot_testers values ('${U.leo}')`);
    for (let i = 1; i <= 3; i++) { assert.strictEqual(await reserve(db, U.leo, 'req-d000000' + i), 'ok'); await finish(db, U.leo, 'req-d000000' + i, true); }
    assert.strictEqual(await reserve(db, U.leo, 'req-d0000009'), 'pilot_total');
    assert.strictEqual(+(await q1(db, 'select chat_pilot_total from public.leo_ai_config')).chat_pilot_total, 3);
  });
  await test('presupuesto propio de Riso (neuronas reales + en curso + estimación)', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false, riso_neuron_budget = 30`);
    assert.strictEqual(await reserve(db, U.miembro, 'req-e0000001', 12), 'ok');
    assert.strictEqual(await reserve(db, U.leo, 'req-e0000002', 12), 'ok');
    assert.strictEqual(await reserve(db, U.gratis, 'req-e0000003', 12), 'riso_budget'); // 12+12+12 > 30
  });
  await test('techo compartido: Riso se detiene antes de dejar sin presupuesto a Leo AI', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false, riso_neuron_budget = 10000;
      insert into public.ai_usage_daily (day, provider, requests, neurons) values (${hoy}, 'cloudflare', 500, 5990)`);
    assert.strictEqual(await reserve(db, U.miembro, 'req-f0000001', 12), 'shared_ceiling'); // 5990 + 12 > 6000 (60 %)
    const c = await q1(db, 'select neuron_budget from public.leo_ai_config'); assert.strictEqual(+c.neuron_budget, 8000);
  });
  await test('pago desactivado: aunque se suba el techo, nunca pasa del 95 % del gratis sin allow_paid', async () => {
    const db = await db0(PGlite);
    let err = null; try { await db.exec(`update public.leo_ai_config set riso_ceiling_pct = 120`); } catch (e) { err = e; }
    assert.ok(err, 'el techo no puede pasar de 95 %');
  });
  await test('cierre registra tokens y neuronas reales como cloudflare:riso', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false`);
    await reserve(db, U.miembro, 'req-g0000001'); await finish(db, U.miembro, 'req-g0000001', true, 1040, 88, 11.86);
    const r = await q1(db, `select * from public.ai_usage_daily where provider = 'cloudflare:riso'`);
    assert.strictEqual(+r.input_tokens, 1040); assert.strictEqual(+r.output_tokens, 88); assert.strictEqual(+r.neurons, 11.86);
  });
  await test('alertas al 70, 90 y 95 % una sola vez por día y umbral (Leo AI incluida)', async () => {
    const db = await db0(PGlite);
    await db.exec(`select public.leo_ai_record(${hoy}, 'cloudflare', 1000, 100, 7100)`);
    await db.exec(`select public.leo_ai_record(${hoy}, 'cloudflare', 10, 1, 10)`);
    let a = (await db.query('select pct from public.ai_budget_alerts order by pct')).rows.map(x => x.pct);
    assert.deepStrictEqual(a, [70]);
    await db.exec(`select public.leo_ai_record(${hoy}, 'cloudflare', 1000, 100, 2450)`);
    a = (await db.query('select pct from public.ai_budget_alerts order by pct')).rows.map(x => x.pct);
    assert.deepStrictEqual(a, [70, 90, 95]);
    const logs = (await db.query('select severity from public.log_calls order by severity')).rows.map(x => x.severity);
    assert.deepStrictEqual(logs.sort(), ['critical', 'error', 'warning']);
  });
  await test('una alerta rota nunca bloquea el registro del consumo', async () => {
    const db = await db0(PGlite);
    await db.exec(`drop function public.log_app_error(text,text,text,text,text,text,text,text,text,text,text,text,jsonb)`);
    await db.exec(`select public.leo_ai_record(${hoy}, 'cloudflare', 1000, 100, 9600)`);
    assert.strictEqual(+(await q1(db, `select neurons from public.ai_usage_daily where provider = 'cloudflare'`)).neurons, 9600);
  });
  await test('solo service_role puede ejecutar las funciones (anon y authenticated no)', async () => {
    const db = await db0(PGlite);
    for (const fn of ['riso_chat_reserve(uuid,text,numeric)', 'riso_chat_finish(uuid,text,boolean,integer,integer,numeric,jsonb)', 'ai_neurons_today(date)']) {
      for (const rol of ['anon', 'authenticated', 'public']) {
        const r = await q1(db, `select has_function_privilege($1, 'public.${fn}', 'execute') ok`, [rol === 'public' ? 'anon' : rol]);
        assert.strictEqual(r.ok, false, rol + ' ' + fn);
      }
      assert.strictEqual((await q1(db, `select has_function_privilege('service_role', 'public.${fn}', 'execute') ok`)).ok, true);
    }
    for (const t of ['riso_pilot_testers', 'riso_chat_usage', 'riso_chat_requests', 'ai_budget_alerts']) {
      assert.strictEqual((await q1(db, `select has_table_privilege('authenticated', 'public.${t}', 'select') ok`)).ok, false, t);
    }
  });
  await test('el día lo decide el servidor (UTC), no hay parámetro de fecha', async () => {
    const db = await db0(PGlite);
    const r = await q1(db, `select pg_get_function_identity_arguments('public.riso_chat_reserve'::regproc) a`);
    assert.ok(!/date/.test(r.a), r.a);
  });
  await test('request_id inválido y estimaciones absurdas se rechazan sin reservar', async () => {
    const db = await db0(PGlite);
    await db.exec(`update public.leo_ai_config set chat_enabled = true, chat_pilot_only = false`);
    assert.strictEqual(await reserve(db, U.miembro, 'x'), 'bad_request');
    assert.strictEqual(await reserve(db, U.miembro, 'req-h0000001', 500), 'too_long');
  });
  console.log('\n' + p + ' ok, ' + f + ' fallos'); process.exit(f ? 1 : 0);
})();
