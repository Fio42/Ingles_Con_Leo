#!/usr/bin/env node
/* Curso ARTICULOS Y PLURALES: SEGURIDAD de membresia desde el SERVIDOR (PGlite con los permisos por defecto de Supabase).
   Llama directamente a cada funcion academia_* y a las tablas, como anon, como cuenta GRATIS y como MIEMBRO.
   Corre con:  NODE_PATH=$(npm root -g) node tools/tests/academia-there-is-are-seguridad.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const H = require('./academia-pg-helpers.js');
const root = H.root;
let passed = 0, failed = 0;
async function test(n, f){ try{ await f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split('\n').slice(0, 8).join('\n  ')); } }

(async()=>{
  const PGlite = await H.loadPglite();
  if(!PGlite){ console.log('omitida: falta @electric-sql/pglite'); return; }
  console.log('Curso THERE IS / THERE ARE: seguridad de membresía en el servidor');
  const realFile = path.join(root, 'private', 'academia-examen-there-is-are.json');
  const items = fs.existsSync(realFile) ? JSON.parse(fs.readFileSync(realFile, 'utf8')).items : [];
  const MIGA = 'supabase/migrations/20261028120000_academia_curso_articulos.sql', MIG = 'supabase/migrations/20261029130000_academia_curso_there_is_are.sql', MIGP = 'supabase/migrations/20261027120000_academia_curso_pronombres.sql';

  /* huella de permisos, politicas, funciones y filas de OTROS cursos */
  async function fingerprint(db){
    const q = async s => (await db.query(s)).rows;
    return JSON.stringify({
      fn: await q(`select p.oid::regprocedure::text f, md5(p.prosrc) s, p.prosecdef d, coalesce(p.proacl::text,'') a from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1`),
      tb: await q(`select c.relname t, coalesce(c.relacl::text,'') a, c.relrowsecurity r from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1`),
      pol: await q(`select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2`),
      cols: await q(`select c.relname t, a.attname col, coalesce(a.attacl::text,'') a from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and a.attnum > 0 and a.attacl is not null order by 1, 2`),
      others: await q(`select * from public.academia_courses where course_id in ('to-be', 'pronombres', 'articulos') order by 1`)
    });
  }

  await test('la migracion NO cambia ningun permiso, politica ni funcion y NO toca las filas de TO BE y Pronombres', async()=>{
    const db = await H.freshDb(PGlite, []); await db.exec(H.read(MIGP)); await db.exec(H.read(MIGA));
    const before = await fingerprint(db);
    await db.exec(H.read(MIG));
    { const after = await fingerprint(db); if(after !== before){ let i = 0; while(after[i] === before[i]) i++; console.log("DIF", before.slice(i - 150, i + 150), "\n---\n", after.slice(i - 150, i + 150)); } assert.strictEqual(after, before, "la huella cambio"); }
    const r = (await db.query(`select course_id, enabled, demo_items, engine_topic from public.academia_courses where course_id = 'there-is-are'`)).rows;
    assert.deepStrictEqual(r.map(x => [x.course_id, x.enabled, x.engine_topic]), [['there-is-are', false, 'There is / are (hay)']]); assert.deepStrictEqual(r[0].demo_items, []);
    await db.exec(H.read(MIG));    // idempotente
    assert.strictEqual((await db.query(`select count(*)::int n from public.academia_courses where course_id = 'there-is-are'`)).rows[0].n, 1);
  });

  async function setup(){
    const db = await H.freshDb(PGlite, []); await db.exec(H.read(MIGP)); await db.exec(H.read(MIGA)); await db.exec(H.read(MIG));
    await db.exec(`update public.academia_courses set enabled = true where course_id in ('pronombres', 'articulos', 'there-is-are')`);
    for(const b of items) await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)', ['there-is-are', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
    return db;
  }
  const rpc = (db, uid, fn, args) => H.fakeClient(db, uid).rpc(fn, args);
  const asAnon = async (db, sql, params) => { await db.exec('begin'); try{ await db.exec('set local role anon'); const r = await db.query(sql, params); await db.exec('commit'); return { rows: r.rows }; }catch(e){ try{ await db.exec('rollback'); }catch(x){} return { error: String(e.message) }; } };
  const asRole = async (db, uid, sql, params) => { try{ const r = await H.asUser(db, uid, () => db.query(sql, params)); return { rows: r.rows }; }catch(e){ return { error: String(e.message) }; } };
  const count = async (db, sql, p) => (await db.query(sql, p)).rows[0].n;

  await test('anon (sin sesion): ninguna funcion academia_* se puede ejecutar ni ninguna tabla leer', async()=>{
    const db = await setup();
    const fns = (await db.query(`select p.oid::regprocedure::text f from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname like 'academia\\_%'`)).rows.map(r => r.f);
    // academia_norm(text) es una funcion pura de texto (inmutable, sin tablas), ya existente en main: no da acceso a nada
    assert.ok(/immutable/i.test((await db.query(`select pg_get_functiondef('public.academia_norm(text)'::regprocedure) d`)).rows[0].d) && !/from public\./i.test((await db.query(`select prosrc s from pg_proc where proname = 'academia_norm'`)).rows[0].s));
    assert.ok(fns.length >= 14, 'funciones encontradas: ' + fns.length);
    for(const f of fns.filter(x => x !== 'academia_norm(text)')) assert.strictEqual((await db.query(`select has_function_privilege('anon', '${f}', 'execute') x`)).rows[0].x, false, 'anon ejecuta ' + f);
    for(const t of ['academia_courses', 'academia_progress', 'academia_exam_items', 'academia_exam_attempts', 'academia_badges', 'academia_mistake_batches']){
      const r = await asAnon(db, `select * from public.${t} limit 1`); assert.ok(r.error && /permission denied/i.test(r.error), 'anon lee ' + t);
    }
  });

  await test('cuenta GRATIS: cada funcion con el curso nuevo se rechaza o no entrega nada, y no queda ni una fila escrita', async()=>{
    const db = await setup(); const F = H.U.free;
    const call = (fn, a) => rpc(db, F, fn, a);
    const acc = (await call('academia_access', { p_course: 'there-is-are', p_today: '2026-10-27', p_local_count: 0 })).data;
    assert.deepStrictEqual([acc.ok, acc.member, acc.demo.available, acc.demo.cost], [true, false, false, 0]);
    assert.deepStrictEqual([(await call('academia_demo_start', { p_course: 'there-is-are', p_today: '2026-10-27', p_local_count: 0 })).data.error], ['demo_off']);
    await call('academia_demo_finish', { p_course: 'there-is-are' });    // no-op sin fila de progreso: se comprueba abajo que no escribe nada
    assert.strictEqual((await call('academia_save_progress', { p_course: 'there-is-are', p_state: { v: 1, lessons: { x: { done: true } } }, p_base_version: 0 })).data.error, 'members');
    assert.strictEqual((await call('academia_exam_start', { p_course: 'there-is-are' })).data.error, 'members');
    const es = (await call('academia_exam_status', { p_course: 'there-is-are' })).data; assert.deepStrictEqual([es.can_take, es.badge, es.best_pct, es.members_only], [false, null, null, true]);
    const sess = { startedAt: Date.now() - 60000, durationMs: 60000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:there-is-are:' + id, isCorrect: true })) };
    assert.strictEqual((await call('academia_record_session', { p_course: 'there-is-are', p_session: sess })).data.error, 'members');
    assert.strictEqual((await call('academia_apply_mistakes', { p_batch: '22222222-2222-4222-8222-222222222222', p_items: [{ item_id: 'ac:there-is-are:l1-a1', is_correct: false }] })).data.error, 'members');
    // funciones internas: nadie las llama
    for(const [fn, a] of [['academia_apply_batch', { p_uid: F, p_batch: '33333333-3333-4333-8333-333333333333', p_source: 'x', p_items: [] }], ['academia_is_member', { p_uid: H.U.a }], ['academia_free_count', { p_uid: F, p_today: '2026-10-27', p_local: 0 }]])
      assert.ok((await call(fn, a)).error, 'funcion interna ejecutable: ' + fn);
    // cero escrituras
    for(const t of ['academia_progress', 'academia_exam_attempts', 'academia_badges', 'academia_mistake_batches']) assert.strictEqual(await count(db, `select count(*)::int n from public.${t} where user_id = $1`, [F]), 0, t);
    assert.strictEqual(await count(db, `select count(*)::int n from public.mistake_stats where user_id = $1`, [F]), 0);
    assert.strictEqual(await count(db, `select count(*)::int n from public.progress_sessions where user_id = $1`, [F]), 0);
    assert.strictEqual(await count(db, `select coalesce(free_daily_count, 0)::int n from public.profiles where id = $1`, [F]), 0, 'no se gasta el limite gratis');
  });

  await test('cuenta GRATIS: no lee el banco del examen, ni respuestas, ni el progreso o los intentos de otro, ni escribe en tablas', async()=>{
    const db = await setup(); const F = H.U.free, A = H.U.a;
    const st = (await rpc(db, A, 'academia_exam_start', { p_course: 'there-is-are' })).data; assert.strictEqual(st.ok, true);
    await rpc(db, A, 'academia_save_progress', { p_course: 'there-is-are', p_state: { v: 1 }, p_base_version: 0 });
    let r = await asRole(db, F, 'select * from public.academia_exam_items limit 1'); assert.ok(r.error && /permission denied/i.test(r.error), 'lee el banco');
    r = await asRole(db, F, 'select item_ids from public.academia_exam_attempts'); assert.ok(r.error, 'lee item_ids');
    r = await asRole(db, F, 'select * from public.academia_progress'); assert.deepStrictEqual(r.rows, [], 've el progreso de otro');
    r = await asRole(db, F, 'select * from public.academia_exam_attempts'); assert.ok(r.error || r.rows.length === 0, 've intentos de otro');
    r = await asRole(db, F, 'select * from public.academia_badges'); assert.ok(r.error || r.rows.length === 0);
    for(const t of ['academia_progress', 'academia_exam_attempts', 'academia_badges', 'academia_courses']){
      r = await asRole(db, F, `insert into public.${t} default values`); assert.ok(r.error, 'inserta en ' + t);
      r = await asRole(db, F, `update public.${t} set course_id = 'there-is-are'`); assert.ok(r.error, 'actualiza ' + t);
      r = await asRole(db, F, `delete from public.${t}`); assert.ok(r.error, 'borra ' + t);
    }
    r = await asRole(db, F, `update public.academia_courses set enabled = true, demo_items = '["x"]'::jsonb`); assert.ok(r.error, 'no puede encender el curso ni darle demo');
    // no puede calificar el intento de un miembro ni forzar el suyo
    const a = (await rpc(db, F, 'academia_exam_submit', { p_attempt: st.attempt_id, p_answers: {} })).data; assert.ok(a && a.ok !== true, 'califico un intento ajeno: ' + JSON.stringify(a));
    assert.strictEqual(await count(db, `select count(*)::int n from public.academia_badges where user_id = $1`, [F]), 0);
  });

  await test('el servidor NUNCA manda respuestas: ni al iniciar el examen, ni en el estado, ni al miembro; los items privados no salen en ninguna respuesta de la cuenta gratis', async()=>{
    const db = await setup(); if(!items.length) return;
    const A = H.U.a;
    const st = (await rpc(db, A, 'academia_exam_start', { p_course: 'there-is-are' })).data; assert.strictEqual(st.ok, true); assert.strictEqual(st.items.length, 15);
    const txt = JSON.stringify(st);
    assert.ok(!/"answer"|"correct"|"accepted"|"why"|"fix"|"order":\[/.test(txt), 'respuestas en el examen');
    const ex = (await rpc(db, A, 'academia_exam_status', { p_course: 'there-is-are' })).data; assert.ok(!/"answer"|"correct"|"accepted"|"why"/.test(JSON.stringify(ex)));
    // lo que ve la cuenta gratis, completo, nunca contiene texto privado
    const F = H.U.free; const seen = JSON.stringify([(await rpc(db, F, 'academia_access', { p_course: 'there-is-are' })).data, (await rpc(db, F, 'academia_exam_start', { p_course: 'there-is-are' })).data, (await rpc(db, F, 'academia_exam_status', { p_course: 'there-is-are' })).data]);
    items.forEach(i => { const s = i.public.source || i.public.q; assert.ok(seen.indexOf(s) === -1, 'texto privado visible para gratis: ' + i.id); });
    // el miembro solo recibe la parte publica de 15 preguntas
    st.items.forEach(i => assert.ok(items.some(b => b.id === i.id)));
  });

  await test('MIEMBRO: si accede; el curso apagado no deja entrar a nadie; Pronombres y TO BE conservan exactamente su comportamiento', async()=>{
    const db = await setup(); const A = H.U.a, F = H.U.free;
    assert.strictEqual((await rpc(db, A, 'academia_save_progress', { p_course: 'there-is-are', p_state: { v: 1 }, p_base_version: 0 })).data.ok, true);
    await db.exec(`update public.academia_courses set enabled = false where course_id = 'there-is-are'`);
    for(const u of [A, F]){ assert.strictEqual((await rpc(db, u, 'academia_access', { p_course: 'there-is-are' })).data.error, 'course'); }
    assert.strictEqual((await rpc(db, A, 'academia_exam_start', { p_course: 'there-is-are' })).data.error, 'course');
    assert.strictEqual((await rpc(db, A, 'academia_save_progress', { p_course: 'there-is-are', p_state: { v: 1 }, p_base_version: 1 })).data.error, 'course');
    // pronombres: gratis sigue sin demo y bloqueado; miembro sigue entrando
    const pf = (await rpc(db, F, 'academia_access', { p_course: 'pronombres', p_today: '2026-10-27', p_local_count: 0 })).data; assert.deepStrictEqual([pf.member, pf.demo.available], [false, false]);
    assert.strictEqual((await rpc(db, F, 'academia_save_progress', { p_course: 'pronombres', p_state: { v: 1 }, p_base_version: 0 })).data.error, 'members');
    assert.strictEqual((await rpc(db, A, 'academia_save_progress', { p_course: 'pronombres', p_state: { v: 1 }, p_base_version: 0 })).data.ok, true);
    // TO BE: la demo gratis sigue existiendo y sigue costando lo mismo
    const tb = (await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: '2026-10-27', p_local_count: 0 })).data; assert.ok(tb.demo.cost > 0 && tb.demo.available === true, JSON.stringify(tb));
  });

  await test('guia de lanzamiento: el SQL de verificacion corre (solo lectura), da lo esperado y el seed real solo inserta las 50 filas del curso', async()=>{
    const db = await setup();
    const sql = H.read('supabase/verify/academia_there_is_are_verificacion.sql').replace(/--.*$/gm, '');
    assert.ok(!/\b(insert|update|delete|drop|alter|truncate|create|grant|revoke)\b/i.test(sql.replace(/'[^']*'/g, "''")), 'el SQL de verificacion debe ser solo lectura');
    const out = []; for(const st of sql.split(';').map(x => x.trim()).filter(Boolean)) out.push((await db.query(st)).rows);
    assert.strictEqual(out.length, 6); assert.deepStrictEqual(out[0].map(r => [r.course_id, r.engine_topic]), [['pronombres', 'He / She / It (pronombres)'], ['there-is-are', 'There is / are (hay)'], ['to-be', out[0][2].engine_topic]]);
    if(items.length){ assert.deepStrictEqual(out[1].map(r => [r.topic, Number(r.preguntas), Number(r.activas)]), [['are', 10, 10], ['is', 10, 10], ['juntos', 10, 10], ['neg', 10, 10], ['preg', 10, 10]]); assert.strictEqual(Number(out[2][0].total_there_is_are), 50); }
    assert.deepStrictEqual(Object.values(out[4][0]), [false, false, false, false]);
    assert.deepStrictEqual(Object.values(out[5][0]).map(Number), [0, 0]);
    const seedFile = path.join(root, 'private', 'seed-academia-examen-there-is-are.sql');
    if(fs.existsSync(seedFile)){
      const seed = fs.readFileSync(seedFile, 'utf8'); const body = seed.replace(/--.*$/gm, '');
      assert.ok(!/\b(delete|drop|alter|truncate|grant|revoke|create)\b/i.test(body.replace(/\$j\$[\s\S]*?\$j\$/g, '')), 'el seed solo inserta');
      assert.strictEqual((body.match(/insert into /g) || []).length, 1); assert.ok(/insert into public\.academia_exam_items/.test(body));
      assert.strictEqual((body.match(/\('there-is-are', 'e-/g) || []).length, 50, '50 filas, todas de there-is-are'); assert.ok(!/\('(to-be|pronombres)'/.test(body));
      // se puede correr dos veces sin duplicar (idempotente)
      await db.exec(seed); await db.exec(seed);
      assert.strictEqual((await db.query(`select count(*)::int n from public.academia_exam_items where course_id = 'there-is-are'`)).rows[0].n, 50);
    }
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLAN' : ''));
  process.exit(failed ? 1 : 0);
})();
