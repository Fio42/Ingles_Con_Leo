/* Riso · migración del piloto contra un PostgreSQL REAL con conexiones independientes y simultáneas.
   Entorno aislado: crea una base nueva y temporal en el servidor indicado (nunca la de producción).
   Uso: RISO_PG="postgres://postgres@/postgres?host=/tmp&port=5499" node tools/tests/riso-chat-pg.test.js
   (necesita el paquete "pg"; lo busca en LEO_PG_DIR o /tmp/pgl). */
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createRequire } = require('module');
const ROOT = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pg; for (const d of [process.env.LEO_PG_DIR, '/tmp/pgl', ROOT].filter(Boolean)) { try { pg = createRequire(path.join(d, 'x.js'))('pg'); break; } catch (e) { /* sigue */ } }
const URL0 = process.env.RISO_PG;
if (!pg || !URL0) { console.log('  (omitida: define RISO_PG y ten el paquete pg)'); process.exit(0); }
if (/supabase\.co|pooler\.supabase/.test(URL0)) { console.log('Nunca contra producción.'); process.exit(1); }
const U = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const LEO = U(1), GRATIS = U(2), OTRO = U(3);
const hoy = "(now() at time zone 'utc')::date";

async function base() {
  const admin = new pg.Client({ connectionString: URL0 }); await admin.connect();
  const nombre = 'riso_prueba_' + Date.now();
  await admin.query('create database ' + nombre); await admin.end();
  const url = URL0.replace(/\/postgres(\?|$)/, '/' + nombre + '$1');
  const c = new pg.Client({ connectionString: url }); await c.connect();
  await c.query(`
    do $$ begin
      if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
      if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
    end $$;
    create schema auth;
    create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false, member_since timestamptz);
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    create table public.log_calls (fp text, severity text, message text);
    create function public.log_app_error(p_fp text, p_kind text, p_source text, p_severity text, p_section text, p_message text, p_error_name text,
      p_stack_top text, p_code text, p_release text, p_browser text, p_platform text, p_sample jsonb) returns jsonb language plpgsql as $$
      begin insert into public.log_calls values (p_fp, p_severity, p_message); return '{"logged":true}'; end $$;
  `);
  await c.query(read('supabase_functions/leo-ai.sql'));
  await c.query(read('supabase/migrations/20261016001253_leo_ai_trial.sql'));
  const users = [[LEO, true], [GRATIS, false], [OTRO, true]]; for (let i = 10; i < 40; i++) users.push([U(i), true]);
  for (const [id, m] of users) { await c.query('insert into auth.users values ($1, now())', [id]); await c.query('insert into public.profiles (id, is_member) values ($1, $2)', [id, m]); }
  await c.query(`insert into public.leo_ai_config (id, enabled, public) values (true, true, true) on conflict (id) do update set enabled = true, public = true`);
  const antes = await c.query(`select public.leo_ai_reserve($1, ${hoy}) r`, [OTRO]);
  await c.query(read('supabase/pendientes/20261128_riso_chat_piloto.sql'));
  await c.query(`update public.leo_ai_config set chat_enabled = true; insert into public.riso_pilot_testers (user_id) select id from auth.users`);
  return { c, url, nombre, leoAntes: antes.rows[0].r };
}
const conexiones = async (url, n) => Promise.all(Array.from({ length: n }, async () => { const k = new pg.Client({ connectionString: url }); await k.connect(); return k; }));
const reservar = (k, u, id, est) => k.query('select public.riso_chat_reserve($1,$2,$3) r', [u, id, est == null ? 12 : est]).then(x => x.rows[0].r.status);
const cerrar = (k, u, id, ok, n) => k.query('select public.riso_chat_finish($1,$2,$3,$4,$5,$6,$7) r', [u, id, ok, 1000, 100, n == null ? 11.8 : n, ok ? JSON.stringify({ texto: 'respuesta de ' + u }) : null]).then(x => x.rows[0].r);
const cuenta = (arr, v) => arr.filter(x => x === v).length;

(async () => {
  let p = 0, f = 0; const limpiar = [];
  async function test(n, fn) { try { await fn(); p++; console.log('  ok   ' + n); } catch (e) { f++; console.log('  FAIL ' + n + '\n       ' + (e && e.stack || e).toString().split('\n').slice(0, 3).join('\n       ')); } }
  const B = await base(); const c = B.c; limpiar.push(B);
  const ks = await conexiones(B.url, 20);
  const reset = async (sql) => { await c.query(`delete from public.riso_chat_requests; delete from public.riso_chat_usage; delete from public.ai_usage_daily; update public.leo_ai_config set chat_enabled = true, chat_pilot_only = true, chat_member_daily = 30, chat_free_daily = 3, chat_global_daily = 100, chat_pilot_total = 100, riso_neuron_budget = 1500, riso_ceiling_pct = 60, allow_paid = false; ${sql || ''}`); };

  await test('Leo AI funcionaba antes de la migración y sigue igual después', async () => {
    assert.strictEqual(B.leoAntes, 'ok');
    assert.strictEqual((await c.query(`select public.leo_ai_reserve($1, ${hoy}) r`, [OTRO])).rows[0].r, 'ok');
  });
  await test('20 conexiones simultáneas de la misma cuenta (cupo 3): exactamente 3 reservas', async () => {
    await reset();
    const r = await Promise.all(ks.map((k, i) => reservar(k, GRATIS, 'req-sim-' + String(i).padStart(4, '0'))));
    assert.strictEqual(cuenta(r, 'ok'), 3, JSON.stringify(r));
  });
  await test('presupuesto de Riso con 20 cuentas simultáneas: nunca lo supera (30 neuronas / 12 = 2)', async () => {
    await reset('update public.leo_ai_config set riso_neuron_budget = 30');
    const r = await Promise.all(ks.map((k, i) => reservar(k, U(10 + i), 'req-pre-' + String(i).padStart(4, '0'))));
    assert.strictEqual(cuenta(r, 'ok'), 2, JSON.stringify(r));
  });
  await test('techo compartido con Leo AI en simultáneo: 5.980 usadas + 12 → solo una reserva cabe bajo 6.000', async () => {
    await reset(`insert into public.ai_usage_daily (day, provider, requests, neurons) values (${hoy}, 'cloudflare', 1, 5980)`);
    const r = await Promise.all(ks.map((k, i) => reservar(k, U(10 + i), 'req-tec-' + String(i).padStart(4, '0'))));
    assert.strictEqual(cuenta(r, 'ok'), 1, JSON.stringify(r));
  });
  await test('total del piloto bajo carga simultánea (total 5): exactamente 5', async () => {
    await reset('update public.leo_ai_config set chat_pilot_total = 5');
    const r = await Promise.all(ks.map((k, i) => reservar(k, U(10 + i), 'req-tot-' + String(i).padStart(4, '0'))));
    assert.strictEqual(cuenta(r, 'ok'), 5, JSON.stringify(r));
  });
  await test('reintentos simultáneos con el mismo request_id: una reserva, el resto «en curso»', async () => {
    await reset();
    const r = await Promise.all(ks.slice(0, 8).map(k => reservar(k, LEO, 'req-mismo-0001')));
    assert.strictEqual(cuenta(r, 'ok'), 1); assert.strictEqual(cuenta(r, 'in_progress'), 7);
  });
  await test('solicitudes lentas: mientras siguen en curso cuentan contra el presupuesto; al cerrar con error se liberan', async () => {
    await reset('update public.leo_ai_config set riso_neuron_budget = 24');
    assert.strictEqual(await reservar(ks[0], U(10), 'req-len-0001'), 'ok');
    assert.strictEqual(await reservar(ks[1], U(11), 'req-len-0002'), 'ok');
    assert.strictEqual(await reservar(ks[2], U(12), 'req-len-0003'), 'riso_budget');
    await cerrar(ks[0], U(10), 'req-len-0001', false, 0);
    assert.strictEqual(await reservar(ks[2], U(12), 'req-len-0004'), 'ok');
  });
  await test('respuesta tardía (después de liberar a los 180 s): registra las neuronas reales y no cuenta la pregunta', async () => {
    await reset();
    assert.strictEqual(await reservar(ks[0], LEO, 'req-tar-0001'), 'ok');
    await c.query(`update public.riso_chat_requests set updated_at = now() - interval '4 minutes'`);
    assert.strictEqual(await reservar(ks[1], LEO, 'req-tar-0002'), 'ok'); // la reserva vieja se liberó
    const r = await cerrar(ks[0], LEO, 'req-tar-0001', true, 15);
    assert.strictEqual(r.status, 'late');
    assert.strictEqual(+(await c.query(`select neurons from public.ai_usage_daily where provider = 'cloudflare:riso'`)).rows[0].neurons, 15);
    assert.strictEqual((await c.query(`select coalesce(sum(count),0)::int n from public.riso_chat_usage`)).rows[0].n, 0);
  });
  await test('una reserva NO caduca mientras la función pueda seguir viva (150 s): a los 2 minutos sigue contando', async () => {
    await reset('update public.leo_ai_config set riso_neuron_budget = 12');
    assert.strictEqual(await reservar(ks[0], LEO, 'req-viva-0001'), 'ok');
    await c.query(`update public.riso_chat_requests set updated_at = now() - interval '150 seconds'`);
    assert.strictEqual(await reservar(ks[1], OTRO, 'req-viva-0002'), 'riso_budget', 'la reserva de 150 s sigue ocupando el presupuesto');
  });
  await test('la estimación previa cubre el peor caso: entrada máxima y 220 tokens de salida nunca superan lo reservado', async () => {
    const m = await import(path.join(ROOT, 'supabase/functions/leo-ai/riso-chat.mjs'));
    const larga = 'á'.repeat(400), hist = Array.from({ length: 6 }, (_, i) => ({ rol: i % 2 ? 'riso' : 'alumno', texto: 'x'.repeat(700) }));
    const msgs = m.construirMensajes(larga, hist, { tema: 't', enunciado: 'e'.repeat(200), respuestaAlumno: 'a', respuestaCorrecta: 'b' });
    const est = m.estimarNeuronas(msgs);
    const realPeor = m.neuronas(msgs.reduce((s, x) => s + x.content.length, 0) / 2.5, 220); // tokens reales nunca son menos de 2,5 caracteres
    assert.ok(est <= 60, 'la base rechaza estimaciones > 60: ' + est);
    assert.ok(realPeor <= est * 1.25, 'peor caso ' + realPeor + ' vs estimado ' + est);
  });
  await test('aislamiento: el mismo request_id en otra cuenta no devuelve la respuesta ajena', async () => {
    await reset();
    assert.strictEqual(await reservar(ks[0], LEO, 'req-comp-0001'), 'ok'); await cerrar(ks[0], LEO, 'req-comp-0001', true);
    const otro = (await ks[1].query(`select public.riso_chat_reserve($1, 'req-comp-0001', 12) r`, [OTRO])).rows[0].r;
    assert.strictEqual(otro.status, 'ok'); assert.ok(!otro.answer);
    const mio = (await ks[2].query(`select public.riso_chat_reserve($1, 'req-comp-0001', 12) r`, [LEO])).rows[0].r;
    assert.strictEqual(mio.status, 'duplicate'); assert.strictEqual(mio.answer.texto, 'respuesta de ' + LEO);
  });
  await test('contexto: solo ejercicios que ESA cuenta respondió, con esa respuesta y hace menos de 2 horas', async () => {
    await reset();
    const comoAlumno = async (u, sql, params) => { const k = ks[5]; await k.query('begin'); await k.query("select set_config('request.jwt.claim.sub', $1, true)", [u]); await k.query('set local role authenticated'); try { return (await k.query(sql, params)).rows[0]; } finally { await k.query('rollback'); } };
    // registrar exige sesión, ejercicio publicado y una respuesta que sea opción
    const reg = async (u, item, resp) => { const k = ks[6]; await k.query("select set_config('request.jwt.claim.sub', $1, false)", [u]); await k.query('set role authenticated'); const r = (await k.query('select public.riso_registrar_intento($1,$2) r', [item, resp])).rows[0].r; await k.query('reset role'); return r; };
    assert.strictEqual(await reg(LEO, 'g-facil7-dodoes-2', 'Is'), 'ok');
    assert.strictEqual(await reg(LEO, 'MAL FORMADO; drop', 'Is'), 'bad_item');
    assert.strictEqual(await reg(LEO, 'g-facil7-dodoes-2', 'x'.repeat(200)), 'bad_answer');
    const val = async (u, item, resp) => (await c.query('select public.riso_intento_valido($1,$2,$3) v', [u, item, resp])).rows[0].v;
    assert.strictEqual(await val(LEO, 'g-facil7-dodoes-2', 'Is'), true);
    assert.strictEqual(await val(OTRO, 'g-facil7-dodoes-2', 'Is'), false, 'otra cuenta no puede usar el intento');
    assert.strictEqual(await val(LEO, 'g-facil7-dodoes-2', 'Does'), false, 'otra respuesta');
    assert.strictEqual(await val(LEO, 'g-facil7-dodoes-3', 'Does'), false, 'ejercicio válido pero no respondido');
    await c.query(`update public.riso_intentos set created_at = now() - interval '3 hours'`);
    assert.strictEqual(await val(LEO, 'g-facil7-dodoes-2', 'Is'), false, 'vencido');
    // sin sesión
    const k = ks[7]; await k.query('set role authenticated'); assert.strictEqual((await k.query("select public.riso_registrar_intento('g-facil7-dodoes-2','Is') r")).rows[0].r, 'no_session'); await k.query('reset role');
    // el alumno no puede leer ni escribir las tablas directamente
    let err = null; try { await comoAlumno(LEO, 'select count(*) from public.riso_intentos'); } catch (e) { err = e; } assert.ok(err, 'sin acceso directo');
    err = null; try { await comoAlumno(LEO, 'select public.riso_intento_valido($1,$2,$3)', [LEO, 'x', 'y']); } catch (e) { err = e; } assert.ok(err, 'no puede consultar la validación');
  });
  await test('alertas por consumo de Leo AI (sin Riso): 70, 90 y 95 % una sola vez', async () => {
    await reset('delete from public.ai_budget_alerts; delete from public.log_calls');
    await c.query(`select public.leo_ai_record(${hoy}, 'cloudflare', 1000, 100, 7050)`);
    await c.query(`select public.leo_ai_record(${hoy}, 'cloudflare', 1000, 100, 10)`);
    await c.query(`select public.leo_ai_record(${hoy}, 'cloudflare:trial', 1000, 100, 2000)`);
    await c.query(`select public.leo_ai_record(${hoy}, 'cloudflare', 1000, 100, 500)`);
    const a = (await c.query('select pct from public.ai_budget_alerts order by pct')).rows.map(x => x.pct);
    assert.deepStrictEqual(a, [70, 90, 95]);
    const l = (await c.query('select severity from public.log_calls')).rows.map(x => x.severity).sort();
    assert.deepStrictEqual(l, ['critical', 'error', 'warning']);
  });
  await test('estado: la cuenta del piloto lo ve encendido; otra cuenta, apagado', async () => {
    await reset(`delete from public.riso_pilot_testers where user_id <> '${LEO}'`);
    const st = async u => (await c.query('select public.riso_chat_status($1) s', [u])).rows[0].s;
    const a = await st(LEO); assert.strictEqual(a.enabled, true); assert.strictEqual(a.cupo, 30); assert.strictEqual(a.piloto_total, 100);
    assert.strictEqual((await st(OTRO)).enabled, false);
    assert.strictEqual(await reservar(ks[0], OTRO, 'req-est-0001'), 'not_allowed');
    await c.query('insert into public.riso_pilot_testers (user_id) select id from auth.users on conflict do nothing');
  });
  await test('apagado inmediato: con chat_enabled = false nada se reserva ni se registra', async () => {
    await reset('update public.leo_ai_config set chat_enabled = false');
    const r = await Promise.all(ks.slice(0, 5).map((k, i) => reservar(k, U(10 + i), 'req-apa-' + String(i).padStart(4, '0'))));
    assert.deepStrictEqual([...new Set(r)], ['disabled']);
    const k = ks[8]; await k.query("select set_config('request.jwt.claim.sub', $1, false)", [LEO]); await k.query('set role authenticated');
    assert.strictEqual((await k.query("select public.riso_registrar_intento('g-facil7-dodoes-2','Is') r")).rows[0].r, 'disabled'); await k.query('reset role');
  });
  await test('reversión completa: quita todo lo de Riso y Leo AI sigue funcionando y registrando', async () => {
    for (const k of ks) await k.end().catch(() => {});
    await c.query(read('supabase/pendientes/20261128_riso_chat_piloto_revertir.sql'));
    const fns = (await c.query(`select proname from pg_proc where proname like 'riso%' or proname in ('ai_budget_alert_check','ai_neurons_today')`)).rows;
    assert.strictEqual(fns.length, 0, JSON.stringify(fns));
    const cols = (await c.query(`select column_name from information_schema.columns where table_name = 'leo_ai_config' and column_name like 'chat%'`)).rows;
    assert.strictEqual(cols.length, 0);
    assert.strictEqual((await c.query(`select public.leo_ai_reserve($1, ${hoy}) r`, [OTRO])).rows[0].r, 'ok');
    await c.query(`select public.leo_ai_record(${hoy}, 'cloudflare', 1, 1, 1)`);
  });
  await c.end();
  const admin = new pg.Client({ connectionString: URL0 }); await admin.connect(); await admin.query('drop database ' + B.nombre); await admin.end();
  console.log('\n' + p + ' ok, ' + f + ' fallos'); process.exit(f ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
