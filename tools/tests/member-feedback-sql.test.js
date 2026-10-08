#!/usr/bin/env node
/* Tarjeta de feedback: prueba la MIGRACION REAL (supabase/migrations/20261008190000_member_feedback.sql)
   en una base Postgres local en memoria (PGlite), con RLS y roles. No toca Supabase.
   Necesita el paquete "@electric-sql/pglite"; si no esta instalado, se omite (exit 0).
   Para correrla:  npm install --no-save @electric-sql/pglite  y luego  node tools/tests/member-feedback-sql.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
let PGlite;
try { ({ PGlite } = require('@electric-sql/pglite')); } catch (e) { console.log('OMITIDA: falta @electric-sql/pglite (npm install --no-save @electric-sql/pglite)'); process.exit(0); }
const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'supabase', 'migrations', '20261008190000_member_feedback.sql'), 'utf8');

const U = { member: '00000000-0000-0000-0000-000000000001', other: '00000000-0000-0000-0000-000000000002', free: '00000000-0000-0000-0000-000000000003',
  young: '00000000-0000-0000-0000-000000000004', nosince: '00000000-0000-0000-0000-000000000005' };
let passed = 0, failed = 0; const queue = [];
const test = (n, f) => queue.push({ n, f });

(async () => {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
    create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false, member_since timestamptz, level text);
    create table public.progress_sessions (id bigint generated always as identity primary key, user_id uuid not null references auth.users(id), skill text);
    create table public.survey_responses (id bigint generated always as identity primary key, user_id uuid, created_at timestamptz not null default now());
  `);
  await db.exec(sql);
  const asSuper = async () => { await db.exec('reset role; select set_config(\'request.jwt.claim.sub\', \'\', false);'); };
  const as = async (uid, role = 'authenticated') => { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${role};`); };
  async function seed() {
    await asSuper();
    await db.exec(`truncate public.member_feedback, public.member_feedback_state, public.progress_sessions, public.survey_responses, public.profiles, auth.users restart identity cascade;`);
    for (const id of Object.values(U)) await db.exec(`insert into auth.users values ('${id}')`);
    await db.exec(`
      insert into public.profiles values ('${U.member}', true, now() - interval '10 days', 'medio');
      insert into public.profiles values ('${U.other}', true, now() - interval '10 days', 'facil');
      insert into public.profiles values ('${U.free}', false, null, 'facil');
      insert into public.profiles values ('${U.young}', true, now() - interval '3 days', 'facil');
      insert into public.profiles values ('${U.nosince}', true, null, 'facil');`);
    for (const id of [U.member, U.other, U.young, U.nosince]) await db.exec(`insert into public.progress_sessions (user_id, skill) select '${id}', 'x' from generate_series(1,3)`);
  }
  const status = async uid => { await as(uid); const r = await db.query('select public.member_feedback_status() as s'); return r.rows[0].s; };
  const dismiss = async uid => { await as(uid); await db.query('select public.dismiss_member_feedback()'); };
  const submit = async (uid, score, comment) => { await as(uid); return db.query('select public.submit_member_feedback($1, $2)', [score, comment === undefined ? null : comment]); };
  const rejects = async (p, re) => { try { await p; } catch (e) { assert(re.test(String(e.message)), 'mensaje inesperado: ' + e.message); return; } assert.fail('debia fallar: ' + re); };
  const sup = async q => { await asSuper(); return (await db.query(q)).rows; };

  test('Solo miembros con 5+ dias y 3+ sesiones ven la tarjeta', async () => {
    await seed();
    assert.strictEqual((await status(U.member)).show, true);
    assert.strictEqual((await status(U.free)).show, false, 'no miembro');
    assert.strictEqual((await status(U.young)).show, false, 'menos de 5 dias');
    assert.strictEqual((await status(U.nosince)).show, false, 'sin member_since');
    await asSuper(); await db.exec(`delete from public.progress_sessions where user_id='${U.member}' and id in (select id from public.progress_sessions where user_id='${U.member}' limit 1)`);
    assert.strictEqual((await status(U.member)).show, false, 'solo 2 sesiones');
  });
  test('Sin sesion iniciada: no se muestra y no se puede enviar', async () => {
    await seed(); await as(null, 'anon');
    await rejects(db.query('select public.member_feedback_status()'), /permission denied/i);
    await as('', 'authenticated');
    assert.strictEqual((await db.query('select public.member_feedback_status() as s')).rows[0].s.show, false);
    await rejects(db.query('select public.submit_member_feedback(8, null)'), /not_authenticated/);
  });
  test('Enviar: valida puntuacion y comentario (texto plano, max 600) y guarda contexto minimo', async () => {
    await seed();
    for (const bad of [0, 11, null, -1]) await rejects(submit(U.member, bad), /invalid_score/);
    await rejects(submit(U.member, 8, 'a'.repeat(601)), /comment_too_long/);
    await submit(U.member, 8, '  Me gusta Leo AI\u0007\u0000 <b>x</b>  '.replace('\u0000', ''));
    const r = (await sup('select * from public.member_feedback'))[0];
    assert.strictEqual(r.score, 8); assert.strictEqual(r.comment, 'Me gusta Leo AI <b>x</b>', 'sin caracteres de control, tal cual como texto'); assert.strictEqual(r.low_score, false);
    assert.strictEqual(r.days_as_member, 10); assert.strictEqual(r.sessions_count, 3); assert.strictEqual(r.level, 'medio');
    assert(!('email' in r) && !('name' in r) && !('plan' in r), 'sin datos personales ni campos sin uso');
  });
  test('Comentario opcional: vacio o solo espacios se guarda como null', async () => {
    await seed(); await submit(U.member, 9, '   '); assert.strictEqual((await sup('select comment from public.member_feedback'))[0].comment, null);
  });
  test('Puntuaciones de 6 o menos quedan marcadas low_score; 7 o mas no', async () => {
    await seed(); await submit(U.member, 6); await submit(U.other, 7);
    const rows = await sup('select user_id, low_score from public.member_feedback order by score');
    assert.deepStrictEqual(rows.map(r => r.low_score), [true, false]);
    assert.strictEqual((await sup('select count(*)::int c from public.member_feedback where low_score'))[0].c, 1);
  });
  test('Una respuesta cada 90 dias, forzada por la base (tambien al repetir)', async () => {
    await seed(); await submit(U.member, 8);
    await rejects(submit(U.member, 9), /feedback_too_soon/);
    assert.strictEqual((await status(U.member)).show, false);
    await asSuper(); await db.exec(`update public.member_feedback set created_at = now() - interval '89 days'; update public.member_feedback_state set last_answered_at = now() - interval '89 days'`);
    await rejects(submit(U.member, 9), /feedback_too_soon/);
    assert.strictEqual((await status(U.member)).show, false);
    await asSuper(); await db.exec(`update public.member_feedback set created_at = now() - interval '91 days'; update public.member_feedback_state set last_answered_at = now() - interval '91 days'`);
    assert.strictEqual((await status(U.member)).show, true);
    await submit(U.member, 9); assert.strictEqual((await sup('select count(*)::int c from public.member_feedback'))[0].c, 2);
  });
  test('Servidor: miembro con menos de 5 dias NO puede enviar (aunque tenga 3 sesiones)', async () => {
    await seed(); await rejects(submit(U.young, 8), /feedback_not_eligible/);
    assert.strictEqual((await sup('select count(*)::int c from public.member_feedback'))[0].c, 0);
    await asSuper(); await db.exec(`update public.profiles set member_since = now() - interval '4 days 23 hours' where id='${U.young}'`);
    await rejects(submit(U.young, 8), /feedback_not_eligible/);
  });
  test('Servidor: miembro sin member_since NO puede enviar', async () => { await seed(); await rejects(submit(U.nosince, 8), /feedback_not_eligible/); });
  test('Servidor: miembro con menos de 3 sesiones totales NO puede enviar', async () => {
    await seed(); await asSuper(); await db.exec(`delete from public.progress_sessions where id in (select id from public.progress_sessions where user_id='${U.member}' limit 1)`);
    await rejects(submit(U.member, 8), /feedback_not_eligible/);
    assert.strictEqual((await sup('select count(*)::int c from public.member_feedback'))[0].c, 0);
  });
  test('Servidor: miembro con 5+ dias y 3+ sesiones SI puede enviar (la practica previa a ser miembro cuenta)', async () => {
    await seed(); await asSuper(); await db.exec(`update public.profiles set member_since = now() - interval '5 days 1 minute' where id='${U.young}'`);
    await submit(U.young, 8); assert.strictEqual((await sup(`select count(*)::int c from public.member_feedback where user_id='${U.young}'`))[0].c, 1);
    await submit(U.member, 9); assert.strictEqual((await sup(`select sessions_count from public.member_feedback where user_id='${U.member}'`))[0].sessions_count, 3);
  });
  test('La tarjeta y el envio aplican la misma regla (si no se muestra, tampoco se puede enviar)', async () => {
    await seed();
    for (const u of [U.young, U.nosince, U.free]) { assert.strictEqual((await status(u)).show, false); await rejects(submit(u, 8), /feedback_not_eligible|not_member/); }
    assert.strictEqual((await status(U.member)).show, true); await submit(U.member, 8);
  });
  test('No miembro no puede enviar', async () => { await seed(); await rejects(submit(U.free, 8), /not_member/); });
  test('Ahora no: espera 7 dias, luego 30, luego 90', async () => {
    await seed();
    await dismiss(U.member); let st = (await sup('select * from public.member_feedback_state'))[0]; assert.strictEqual(st.dismiss_count, 1);
    assert.strictEqual((await status(U.member)).show, false);
    const back = async d => { await asSuper(); await db.exec(`update public.member_feedback_state set last_dismissed_at = now() - interval '${d} days'`); };
    await back(6); assert.strictEqual((await status(U.member)).show, false); await back(8); assert.strictEqual((await status(U.member)).show, true);
    await dismiss(U.member); assert.strictEqual((await sup('select dismiss_count c from public.member_feedback_state'))[0].c, 2);
    await back(29); assert.strictEqual((await status(U.member)).show, false); await back(31); assert.strictEqual((await status(U.member)).show, true);
    await dismiss(U.member); assert.strictEqual((await sup('select dismiss_count c from public.member_feedback_state'))[0].c, 3);
    await back(89); assert.strictEqual((await status(U.member)).show, false); await back(91); assert.strictEqual((await status(U.member)).show, true);
  });
  test('Doble clic en Ahora no no sube el contador', async () => {
    await seed(); await dismiss(U.member); await dismiss(U.member); await dismiss(U.member);
    assert.strictEqual((await sup('select dismiss_count c from public.member_feedback_state'))[0].c, 1);
  });
  test('Responder reinicia el contador de Ahora no', async () => {
    await seed(); await dismiss(U.member);
    await asSuper(); await db.exec(`update public.member_feedback_state set last_dismissed_at = now() - interval '8 days'`);
    await submit(U.member, 8); assert.strictEqual((await sup('select dismiss_count c from public.member_feedback_state'))[0].c, 0);
  });
  test('Encuesta de 15 dias reciente: la tarjeta espera 14 dias', async () => {
    await seed(); await asSuper(); await db.exec(`insert into public.survey_responses (user_id, created_at) values ('${U.member}', now() - interval '5 days')`);
    assert.strictEqual((await status(U.member)).show, false);
    await asSuper(); await db.exec(`update public.survey_responses set created_at = now() - interval '15 days'`);
    assert.strictEqual((await status(U.member)).show, true);
  });
  test('Cuando no toca, next_check_at es una fecha futura (para no consultar de mas)', async () => {
    await seed(); const s = await status(U.young); assert(Date.parse(s.next_check_at) > Date.now());
  });
  test('RLS: sin escrituras directas; cada quien solo ve lo suyo', async () => {
    await seed(); await submit(U.member, 5, 'mal'); await submit(U.other, 9, 'bien');
    await as(U.member);
    assert.strictEqual((await db.query('select count(*)::int c from public.member_feedback')).rows[0].c, 1, 'solo la propia');
    await rejects(db.query(`insert into public.member_feedback (user_id, score) values ('${U.member}', 10)`), /permission denied/i);
    await rejects(db.query(`update public.member_feedback set score = 10`), /permission denied/i);
    await rejects(db.query(`delete from public.member_feedback`), /permission denied/i);
    await rejects(db.query(`insert into public.member_feedback_state (user_id) values ('${U.member}')`), /permission denied/i);
    await rejects(db.query(`update public.member_feedback_state set dismiss_count = 0`), /permission denied/i);
    await rejects(db.query(`select public._member_feedback_status('${U.other}')`), /permission denied/i);
    await as(U.member, 'anon');
    await rejects(db.query('select * from public.member_feedback'), /permission denied/i);
    await rejects(db.query('select public.submit_member_feedback(8, null)'), /permission denied/i);
  });
  test('Nadie puede enviar a nombre de otra cuenta (user_id sale de la sesion)', async () => {
    await seed(); await submit(U.member, 7);
    const r = await sup('select user_id from public.member_feedback'); assert.strictEqual(r[0].user_id, U.member);
  });

  for (const t of queue) { try { await t.f(); passed++; console.log('  ok   ' + t.n); } catch (e) { failed++; console.log('  FAIL ' + t.n + '\n       ' + (e && e.message || e)); } }
  console.log(`\n${passed} ok, ${failed} fallaron`); process.exit(failed ? 1 : 0);
})();
