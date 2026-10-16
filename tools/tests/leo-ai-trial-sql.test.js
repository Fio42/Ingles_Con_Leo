#!/usr/bin/env node
/* Pruebas de la prueba gratis de Leo AI del lado de la BASE (supabase/migrations/20261016001253_leo_ai_trial.sql).
   Corre las funciones SQL REALES (leo-ai.sql + la migracion) en un Postgres embebido (PGlite), sin tocar Supabase.
   Corre con:  node tools/tests/leo-ai-trial-sql.test.js   (desde la carpeta inglesconLeo)
   Necesita el paquete @electric-sql/pglite. No forma parte de las dependencias del sitio: si no esta instalado, la
   prueba se omite y avisa como instalarlo (npm i --no-save @electric-sql/pglite, o LEO_PGLITE_DIR=<carpeta que lo tiene>). */
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createRequire } = require('module'), { pathToFileURL } = require('url');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(process.env.LEO_ROOT || root, f), 'utf8');

async function loadPglite(){
  const dirs = [process.env.LEO_PGLITE_DIR, process.cwd(), __dirname, root].filter(Boolean);
  for(const d of dirs){
    try{
      const p = createRequire(path.join(d, 'x.js')).resolve('@electric-sql/pglite');
      const m = await import(pathToFileURL(p).href);
      return m.PGlite || (m.default && m.default.PGlite);
    }catch(e){ /* sigue */ }
  }
  return null;
}
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}
const U = { free1:'00000000-0000-4000-8000-000000000001', free2:'00000000-0000-4000-8000-000000000002', free3:'00000000-0000-4000-8000-000000000003', member:'00000000-0000-4000-8000-0000000000aa' };

(async()=>{
  const PGlite = await loadPglite();
  console.log('Leo AI prueba gratis (base de datos)');
  if(!PGlite){ console.log('  omitida: instala @electric-sql/pglite (npm i --no-save @electric-sql/pglite) o define LEO_PGLITE_DIR'); return; }

  async function fresh(){
    const db = new PGlite();
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
      create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false, member_since timestamptz);
      insert into auth.users values ('${U.free1}', now()), ('${U.free2}', now()), ('${U.free3}', null), ('${U.member}', now());
      insert into public.profiles (id, is_member, member_since) values ('${U.free1}', false, null), ('${U.free2}', false, null), ('${U.free3}', false, null), ('${U.member}', true, now());
    `);
    await db.exec(read('supabase_functions/leo-ai.sql'));
    await db.exec(read('supabase/migrations/20261016001253_leo_ai_trial.sql'));
    await db.exec(`update public.leo_ai_config set enabled = true, public = true, trial_enabled = true`);
    return db;
  }
  const one = async (db, sql, params) => (await db.query(sql, params)).rows[0];
  const begin = async (db, u, r) => (await one(db, 'select public.leo_ai_begin($1,$2) as r', [u, r])).r;
  const finish = (db, u, r, status, ans) => db.query('select public.leo_ai_finish($1,$2,$3,$4,$5,1)', [u, r, status, ans ? JSON.stringify(ans) : null, status === 'failed' ? 'timeout' : '']);
  const status = async (db, u) => (await one(db, 'select public.leo_ai_trial_status($1) as s', [u])).s;
  const used = async (db, u) => { const r = await one(db, 'select used from public.leo_ai_trial where user_id = $1', [u]); return r ? r.used : null; };
  const ANS = { explanation:'x' };

  let db = await fresh();
  await test('la migracion se puede aplicar dos veces sin error (idempotente)', async()=>{
    await db.exec(read('supabase/migrations/20261016001253_leo_ai_trial.sql'));
  });
  await test('por defecto la prueba viene APAGADA (trial_enabled=false) y el gratis no entra', async()=>{
    const d = new PGlite();
    await d.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
      create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
      create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false, member_since timestamptz);
      insert into auth.users values ('${U.free1}', now()); insert into public.profiles (id) values ('${U.free1}');`);
    await d.exec(read('supabase_functions/leo-ai.sql')); await d.exec(read('supabase/migrations/20261016001253_leo_ai_trial.sql'));
    await d.exec(`update public.leo_ai_config set enabled = true, public = true`);
    assert.strictEqual((await begin(d, U.free1, 'req-default-1')).status, 'trial_disabled');
    assert.strictEqual((await one(d, 'select trial_enabled, trial_credits, trial_daily_pool, trial_neuron_budget from public.leo_ai_config')).trial_credits, 5);
  });
  await test('estado inicial: 5 de 5 disponibles', async()=>{
    const s = await status(db, U.free1); assert.deepStrictEqual([s.enabled, s.credits, s.used, s.remaining], [true, 5, 0, 5]);
  });
  await test('un credito se gasta SOLO al entregar bien la explicacion (no al pedirla)', async()=>{
    const b = await begin(db, U.free1, 'req-0001-aaaa'); assert.strictEqual(b.status, 'go'); assert.strictEqual(b.trial, true);
    assert.strictEqual(await used(db, U.free1), null, 'aun no se cobro');
    await finish(db, U.free1, 'req-0001-aaaa', 'completed', ANS); assert.strictEqual(await used(db, U.free1), 1);
    await finish(db, U.free1, 'req-0001-aaaa', 'completed', ANS); assert.strictEqual(await used(db, U.free1), 1, 'el doble finish no cobra dos veces');
    const again = await begin(db, U.free1, 'req-0001-aaaa'); assert.strictEqual(again.status, 'completed'); assert.strictEqual(again.answer.explanation, 'x');
    assert.strictEqual(await used(db, U.free1), 1, 'reintentar el mismo id no cobra');
  });
  await test('un fallo del modelo (timeout / mala salida) NO gasta credito', async()=>{
    await begin(db, U.free1, 'req-fail-0002'); await finish(db, U.free1, 'req-fail-0002', 'failed');
    assert.strictEqual(await used(db, U.free1), 1);
  });
  await test('nunca se entregan mas de 5: pedidos simultaneos con 1 credito -> trial_busy; luego trial_exhausted', async()=>{
    for(let i = 3; i <= 5; i++){ await begin(db, U.free1, 'req-seq-000' + i); await finish(db, U.free1, 'req-seq-000' + i, 'completed', ANS); }
    assert.strictEqual(await used(db, U.free1), 4);
    assert.strictEqual((await begin(db, U.free1, 'req-conc-aaaa')).status, 'go');
    assert.strictEqual((await begin(db, U.free1, 'req-conc-bbbb')).status, 'trial_busy', 'el segundo simultaneo no pasa');
    assert.strictEqual((await begin(db, U.free1, 'req-conc-cccc')).status, 'trial_busy');
    await finish(db, U.free1, 'req-conc-aaaa', 'completed', ANS);
    const t = await one(db, 'select used, exhausted_at is not null as ex from public.leo_ai_trial where user_id = $1', [U.free1]);
    assert.deepStrictEqual([t.used, t.ex], [5, true]);
    assert.strictEqual((await begin(db, U.free1, 'req-after-0001')).status, 'trial_exhausted');
    assert.strictEqual((await one(db, "select count(*)::int n from public.leo_ai_requests where request_id = 'req-after-0001'")).n, 0, 'lo rechazado no deja fila');
    const s = await status(db, U.free1); assert.deepStrictEqual([s.used, s.remaining], [5, 0]);
  });
  await test('un pedido que se quedo colgado (sin terminar) vuelve a poder reintentarse sin cobrar dos veces', async()=>{
    const b = await begin(db, U.free2, 'req-hang-0001'); assert.strictEqual(b.status, 'go');
    await db.query("update public.leo_ai_requests set updated_at = now() - interval '60 seconds' where request_id = 'req-hang-0001'");
    const r = await begin(db, U.free2, 'req-hang-0001'); assert.strictEqual(r.status, 'go'); assert.strictEqual(r.attempt, 2);
    await finish(db, U.free2, 'req-hang-0001', 'completed', ANS); assert.strictEqual(await used(db, U.free2), 1);
  });
  await test('miembros: exactamente como antes (sin fila de prueba, cuenta en ai_usage, tope por alumno)', async()=>{
    const b = await begin(db, U.member, 'req-mem-0001'); assert.deepStrictEqual([b.status, b.trial], ['go', false]);
    await finish(db, U.member, 'req-mem-0001', 'completed', ANS);
    assert.strictEqual(await used(db, U.member), null);
    assert.strictEqual((await one(db, 'select count from public.ai_usage where user_id = $1', [U.member])).count, 1);
    const s = await status(db, U.member); assert.deepStrictEqual([s.enabled, s.member], [false, true]);
    await db.query('update public.leo_ai_config set user_daily_limit = 2');
    assert.strictEqual((await begin(db, U.member, 'req-mem-0002')).status, 'go');
    assert.strictEqual((await begin(db, U.member, 'req-mem-0003')).status, 'user_limit');
    await db.query('update public.leo_ai_config set user_daily_limit = 100');
  });
  await test('interruptor: con trial_enabled=false el gratis no entra y el miembro sigue igual', async()=>{
    await db.query('update public.leo_ai_config set trial_enabled = false');
    assert.strictEqual((await begin(db, U.free2, 'req-off-00001')).status, 'trial_disabled');
    assert.strictEqual((await begin(db, U.member, 'req-off-mem-1')).status, 'go');
    assert.strictEqual((await status(db, U.free2)).enabled, false);
    await db.query('update public.leo_ai_config set trial_enabled = true');
  });
  await test('correo sin confirmar -> trial_unverified (y el estado lo oculta)', async()=>{
    assert.strictEqual((await begin(db, U.free3, 'req-unv-00001')).status, 'trial_unverified');
    assert.strictEqual((await status(db, U.free3)).enabled, false);
  });
  await test('cuenta sin perfil -> not_allowed', async()=>{
    assert.strictEqual((await begin(db, '00000000-0000-4000-8000-0000000000ff', 'req-noprof-01')).status, 'not_allowed');
  });
  await test('bolsa diaria de pedidos de la prueba: llena -> trial_pool, y el MIEMBRO sigue pudiendo', async()=>{
    await db.query('update public.leo_ai_config set trial_daily_pool = 0');
    assert.strictEqual((await begin(db, U.free2, 'req-pool-0001')).status, 'trial_pool');
    assert.strictEqual((await begin(db, U.member, 'req-pool-mem-1')).status, 'go');
    await db.query('update public.leo_ai_config set trial_daily_pool = 400');
  });
  await test('bolsa de neurons de la prueba al tope -> trial_pool, y el MIEMBRO sigue pudiendo (capacidad reservada)', async()=>{
    await db.query("insert into public.ai_usage_daily (day, provider, requests, neurons) values ((now() at time zone 'utc')::date, 'cloudflare:trial', 1, 2600) on conflict (day, provider) do update set neurons = 2600");
    assert.strictEqual((await begin(db, U.free2, 'req-neu-00001')).status, 'trial_pool');
    assert.strictEqual((await begin(db, U.member, 'req-neu-mem-1')).status, 'go');
  });
  await test('tope global de pedidos y presupuesto de neurons siguen mandando para todos', async()=>{
    await db.query("update public.ai_usage_daily set neurons = 0 where provider = 'cloudflare:trial'");
    await db.query("insert into public.ai_usage_daily (day, provider, requests, neurons) values ((now() at time zone 'utc')::date, 'cloudflare', 1, 9000) on conflict (day, provider) do update set neurons = 9000");
    assert.strictEqual((await begin(db, U.free2, 'req-glob-00001')).status, 'neuron_budget');
    assert.strictEqual((await begin(db, U.member, 'req-glob-mem-1')).status, 'neuron_budget');
    await db.query("update public.ai_usage_daily set neurons = 0 where provider = 'cloudflare'");
    await db.query("update public.leo_ai_config set global_daily_limit = 1");
    assert.strictEqual((await begin(db, U.free2, 'req-glob-00002')).status, 'global_limit');
    await db.query("update public.leo_ai_config set global_daily_limit = 1500");
  });
  await test('modo probadores (public=false): el gratis tampoco entra si no es probador', async()=>{
    await db.query('update public.leo_ai_config set public = false');
    assert.strictEqual((await begin(db, U.free2, 'req-beta-00001')).status, 'not_allowed');
    assert.strictEqual((await status(db, U.free2)).enabled, false);
    await db.query('update public.leo_ai_config set public = true');
  });
  await test('reporte: cuentas, agotadas y conversion a membresia dentro de 7 dias', async()=>{
    // free1 agoto sus 5 y pago 2 dias despues; free2 uso 1 y pago 10 dias despues del primer uso (fuera de la ventana).
    await db.query("update public.leo_ai_trial set first_used_at = now() - interval '30 days', exhausted_at = case when exhausted_at is null then null else now() - interval '29 days' end");
    await db.query("update public.profiles set is_member = true, member_since = now() - interval '27 days' where id = $1", [U.free1]);
    await db.query("update public.profiles set is_member = true, member_since = now() - interval '20 days' where id = $1", [U.free2]);
    const r = (await one(db, 'select public.leo_ai_trial_report() as r')).r;
    assert.strictEqual(r.cuentas_que_probaron, 2); assert.strictEqual(r.gastaron_los_5, 1);
    assert.strictEqual(r.hoy_son_miembros, 2);
    assert.strictEqual(r.pagaron_en_7d_desde_primer_uso, 1);
    assert.strictEqual(r.pagaron_en_7d_desde_agotar, 1);
    assert.strictEqual(r.primer_uso_madurados_7d, 2); assert.strictEqual(r.agotaron_madurados_7d, 1);
    assert.strictEqual(Number(r.promedio_usadas), 3);
  });
  await test('permisos: anon/authenticated no ven la tabla ni ejecutan nada; service_role si', async()=>{
    const q = async s => (await one(db, s)).v;
    assert.strictEqual(await q("select has_table_privilege('anon','public.leo_ai_trial','select') v"), false);
    assert.strictEqual(await q("select has_table_privilege('authenticated','public.leo_ai_trial','select') v"), false);
    for(const f of ['leo_ai_trial_status(uuid)', 'leo_ai_trial_report()', 'leo_ai_begin(uuid,text)', 'leo_ai_finish(uuid,text,text,jsonb,text,int)', 'leo_ai_reserve(uuid,date)']){
      assert.strictEqual(await q(`select has_function_privilege('anon','public.${f}','execute') v`), false, 'anon ' + f);
      assert.strictEqual(await q(`select has_function_privilege('authenticated','public.${f}','execute') v`), false, 'authenticated ' + f);
      assert.strictEqual(await q(`select has_function_privilege('service_role','public.${f}','execute') v`), true, 'service_role ' + f);
    }
    assert.strictEqual(await q("select relrowsecurity v from pg_class where oid = 'public.leo_ai_trial'::regclass"), true);
  });
  console.log(`\n${passed} ok, ${failed} con error`);
  process.exit(failed ? 1 : 0);
})();
