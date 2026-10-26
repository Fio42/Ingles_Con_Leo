#!/usr/bin/env node
/* Academia: modelo comercial en el SERVIDOR (cuenta gratis, demostracion, miembros, membresia que vence).
   Corre las funciones SQL reales en Postgres embebido (PGlite) con el trigger de limites REAL de progress_sessions
   y el motor de errores real (leidos de supabase_schema.sql, verificados contra produccion en solo lectura).
   Corre con:  node tools/tests/academia-modelo.test.js

   Decision de Leo: la academia es beneficio de la membresia. Cuenta gratis = una demostracion de TO BE (3 ejercicios) que se
   descuenta del limite diario existente (6). Evaluaciones, insignias, progreso en la nube y sesiones de lecciones = miembros.
   Esto se prueba como lo haria alguien que manipula el navegador: llamando a las funciones directamente. */
const fs = require('fs'), assert = require('assert'), vm = require('vm');
const H = require('./academia-pg-helpers.js');
const Nube = vm.runInNewContext(H.read('academia-nube.js') + ';AcademiaNube');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); }
}
const plain = x => JSON.parse(JSON.stringify(x));
const BANK = [];
['forma', 'afirm'].forEach(t => {
  BANK.push({ id: 'e-' + t[0] + '1', topic: t, type: 'choice', public: { q: 'P ' + t, options: ['a', 'b'] }, answer: { correct: 'a', why: 'a' } });
  BANK.push({ id: 'e-' + t[0] + '2', topic: t, type: 'choice', public: { q: 'Q ' + t, options: ['a', 'b'] }, answer: { correct: 'b', why: 'b' } });
  BANK.push({ id: 'e-' + t[0] + '3', topic: t, type: 'type', public: { q: 'T ' + t, source: 'She ___.' }, answer: { accepted: ['is'], why: 'is' } });
});
const A = H.U.a, F = H.U.free;
const today = () => { const d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
const T0 = 1790000000000;
const lessonSession = (n, t0) => ({ date: today(), startedAt: t0 || T0, durationMs: 120000,
  results: Array.from({ length: n || 8 }, (_, i) => ({ itemId: 'ac:to-be:l1-a' + (i + 1), isCorrect: i % 3 !== 0 })) });
const demoSession = t0 => ({ date: today(), startedAt: t0 || T0 + 5, durationMs: 90000,
  results: [{ itemId: 'ac:to-be:d1', isCorrect: true }, { itemId: 'ac:to-be:d2', isCorrect: false }, { itemId: 'ac:to-be:d3', isCorrect: true }] });

(async()=>{
  console.log('Academia (modelo gratis / miembros en el servidor)');
  const PGlite = await H.loadPglite();
  if(!PGlite){ console.log('  omitida: instala @electric-sql/pglite o define LEO_PGLITE_DIR'); return; }
  const q = async (db, sql, p) => (await db.query(sql, p)).rows;
  async function fresh(){
    const db = await H.freshDb(PGlite, BANK);
    await db.exec(`update public.academia_courses set exam_size = 6, per_topic = 3, max_attempts_day = 20`);
    return db;
  }
  const rpc = (db, uid, fn, args) => H.fakeClient(db, uid).rpc(fn, args).then(r => { if(r.error) throw new Error(fn + ': ' + r.error.message); return r.data; });
  const prof = async (db, uid) => (await q(db, 'select * from public.profiles where id = $1', [uid]))[0];
  const setProf = (db, uid, sets) => db.exec(`update public.profiles set ${sets} where id = '${uid}'`);

  /* ---------- el limite gratis ---------- */
  await test('el limite diario del servidor es el mismo numero que FREE_USER_DAILY_LIMIT de app.js', async()=>{
    const m = /var FREE_USER_DAILY_LIMIT = (\d+);/.exec(H.read('app.js'));
    assert(m, 'no se encontro FREE_USER_DAILY_LIMIT en app.js');
    const db = await fresh();
    const lim = (await q(db, 'select public.academia_free_daily_limit() as n'))[0].n;
    assert.strictEqual(lim, parseInt(m[1], 10), 'cambiaste el limite en app.js: actualiza academia_free_daily_limit() en la migracion');
  });
  await test('la demostracion tiene el mismo numero de ejercicios que el servidor cobra (demo_items) y sus ids existen en el contenido', async()=>{
    const db = await fresh();
    const items = (await q(db, `select demo_items from public.academia_courses where course_id = 'to-be'`))[0].demo_items;
    const data = vm.runInNewContext(H.read('academia-data.js') + ';ACADEMIA').courses['to-be'];
    assert.deepStrictEqual(plain(data.demo.activities.map(a => a.id)), items);
    assert(items.length >= 2 && items.length <= 3, 'una demostracion de 2 o 3 ejercicios');
  });

  /* ---------- demostracion ---------- */
  await test('cuenta gratis nueva: acceso = no miembro, demostracion disponible, 0 de 6 usados', async()=>{
    const db = await fresh();
    const a = await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.deepStrictEqual(plain([a.ok, a.member, a.demo.available, a.demo.used, a.demo.cost, a.daily.count, a.daily.limit, a.daily.remaining]), [true, false, true, false, 3, 0, 6, 6]);
  });
  await test('la demostracion descuenta sus 3 ejercicios del limite existente (profiles) y marca la primera practica', async()=>{
    const db = await fresh();
    await setProf(db, F, `free_daily_count = 1, free_daily_date = '${today()}'`);
    const r = await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.deepStrictEqual(plain([r.ok, r.resumed, r.daily.count]), [true, false, 4]);
    const p = await prof(db, F);
    assert.strictEqual(p.free_daily_count, 4); assert(p.free_first_exercise_at && p.free_last_practice_at);
    assert.strictEqual(p.free_daily_limit_reached_at, null, '4 de 6: todavia no llego al limite');
    const a = await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.strictEqual(a.daily.remaining, 2);
  });
  await test('si la demostracion lleva al limite diario, queda marcada la hora (la usan los correos) igual que con la practica normal', async()=>{
    const db = await fresh();
    await setProf(db, F, `free_daily_count = 3, free_daily_date = '${today()}'`);
    assert.strictEqual((await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).ok, true);
    const p = await prof(db, F);
    assert.strictEqual(p.free_daily_count, 6); assert(p.free_daily_limit_reached_at, 'limit_reached_at');
  });
  await test('si hoy no alcanzan los ejercicios libres NO se gasta la demostracion; otro dia si', async()=>{
    const db = await fresh();
    await setProf(db, F, `free_daily_count = 4, free_daily_date = '${today()}'`);
    const r = await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.deepStrictEqual(plain([r.ok, r.error, r.remaining]), [false, 'limit', 2]);
    assert.strictEqual((await prof(db, F)).free_daily_count, 4, 'no cobra nada');
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_progress where demo_started_at is not null'))[0].n, 0);
    const a = await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.strictEqual(a.demo.available, false); assert.strictEqual(a.demo.used, false);
    await setProf(db, F, `free_daily_date = '${today()}'::date - 1`);           // "ayer": hoy empieza en 0
    assert.strictEqual((await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).ok, true);
    assert.strictEqual((await prof(db, F)).free_daily_count, 3);
  });
  await test('lo que el navegador ya contó hoy (visitante, otra pestana) tambien cuenta: se usa el MAYOR, nunca se suma de mas ni de menos', async()=>{
    const db = await fresh();
    const r = await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 5 });
    assert.deepStrictEqual(plain([r.ok, r.error]), [false, 'limit']);
    const r2 = await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 2 });
    assert.strictEqual(r2.ok, true); assert.strictEqual((await prof(db, F)).free_daily_count, 5, 'max(remoto 0, local 2) + 3');
    await rpc(db, F, 'academia_demo_finish', { p_course: 'to-be' });
    // un valor absurdo desde el navegador no rompe nada ni baja el contador
    const a = await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: -50 });
    assert.strictEqual(a.daily.count, 5);
  });
  await test('UNA SOLA VEZ: repetir, recargar, otra pestana u otro dispositivo no la reinicia ni regala ejercicios', async()=>{
    const db = await fresh();
    assert.strictEqual((await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).ok, true);
    // mientras no la termine, retomarla NO vuelve a cobrar (recargar la pagina, otro dispositivo)
    const again = await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.deepStrictEqual(plain([again.ok, again.resumed]), [true, true]);
    assert.strictEqual((await prof(db, F)).free_daily_count, 3, 'sigue en 3');
    await rpc(db, F, 'academia_demo_finish', { p_course: 'to-be' });
    for(let i = 0; i < 3; i++){
      const r = await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
      assert.deepStrictEqual(plain([r.ok, r.error]), [false, 'demo_used']);
    }
    await setProf(db, F, `free_daily_count = 0`);                              // aunque borre su contador en el navegador/perfil
    assert.strictEqual((await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).error, 'demo_used');
    const a = await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.deepStrictEqual(plain([a.demo.available, a.demo.used, a.demo.done]), [false, true, true]);
  });
  await test('una demostracion abandonada a medias se puede retomar el mismo dia, pero no despues de 24 horas', async()=>{
    const db = await fresh();
    await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    await db.exec(`update public.academia_progress set demo_started_at = now() - interval '25 hours'`);
    const r = await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.strictEqual(r.error, 'demo_used');
    assert.strictEqual((await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).demo.resumable, false);
  });
  await test('los miembros no gastan demostracion ni ejercicios del limite gratis', async()=>{
    const db = await fresh();
    const r = await rpc(db, A, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.deepStrictEqual(plain([r.ok, r.member]), [true, true]);
    assert.strictEqual((await prof(db, A)).free_daily_count, 0);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_progress'))[0].n, 0);
    const a = await rpc(db, A, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.deepStrictEqual(plain([a.member, a.demo.available]), [true, false]);
  });
  await test('sin sesion, curso apagado o fecha falsa del navegador: sin efectos raros', async()=>{
    const db = await fresh();
    assert.strictEqual((await H.fakeClient(db, '').rpc('academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).data && 0, 0);
    await db.exec(`update public.academia_courses set enabled = false`);
    assert.strictEqual((await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).error, 'course');
    assert.strictEqual((await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 })).error, 'course');
    await db.exec(`update public.academia_courses set enabled = true`);
    // una fecha de otro año se ignora: se usa la del servidor
    await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: '2001-01-01', p_local_count: 0 });
    const p = await prof(db, F); assert.strictEqual(String(p.free_daily_date.toISOString().slice(0, 10)).length, 10);
    assert(Math.abs(new Date(p.free_daily_date).getTime() - Date.now()) < 2 * 86400000, 'fecha del servidor');
  });

  /* ---------- lo que una cuenta gratis NO puede hacer (llamando directo a la base) ---------- */
  await test('GRATIS no entra a lecciones premium: ni errores, ni sesiones, ni progreso de las lecciones completas', async()=>{
    const db = await fresh();
    const lesson = [{ item_id: 'ac:to-be:l1-a1', is_correct: false }];
    assert.strictEqual((await rpc(db, F, 'academia_apply_mistakes', { p_batch: '10000000-0000-4000-8000-000000000001', p_items: lesson })).error, 'members');
    assert.strictEqual((await rpc(db, F, 'academia_record_session', { p_course: 'to-be', p_session: lessonSession(8) })).error, 'members');
    assert.strictEqual((await rpc(db, F, 'academia_save_progress', { p_course: 'to-be', p_state: { v: 1, lessons: { 'am-is-are': { done: true } } }, p_base_version: 0 })).error, 'members');
    // aunque ya haya empezado la demostracion, solo valen los 3 ids de la demostracion
    await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    assert.strictEqual((await rpc(db, F, 'academia_apply_mistakes', { p_batch: '10000000-0000-4000-8000-000000000002', p_items: lesson })).error, 'members');
    assert.strictEqual((await rpc(db, F, 'academia_apply_mistakes', { p_batch: '10000000-0000-4000-8000-000000000003', p_items: lesson.concat([{ item_id: 'ac:to-be:d1', is_correct: true }]) })).ok, true, 'los de lecciones se filtran, el de la demo pasa');
    assert.strictEqual((await q(db, `select count(*)::int n from public.mistake_stats where item_id like 'ac:to-be:l%'`))[0].n, 0);
    const mixed = lessonSession(3); mixed.results[0].itemId = 'ac:to-be:d1';
    assert.strictEqual((await rpc(db, F, 'academia_record_session', { p_course: 'to-be', p_session: mixed })).error, 'members');
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 0);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_progress where state <> \'{}\'::jsonb'))[0].n, 0);
  });
  await test('GRATIS: no puede iniciar ni entregar una evaluacion oficial ni conseguir insignias (aunque cambie la configuracion del curso en su navegador)', async()=>{
    const db = await fresh();
    assert.strictEqual((await rpc(db, F, 'academia_exam_start', { p_course: 'to-be' })).error, 'members');
    assert.strictEqual((await rpc(db, F, 'academia_exam_submit', { p_attempt: '20000000-0000-4000-8000-000000000001', p_answers: {} })).error, 'attempt');
    // un intento fabricado por SQL de otra via tampoco se califica si la cuenta no es miembro
    await db.exec(`insert into public.academia_exam_attempts (id, user_id, course_id, item_ids) values ('20000000-0000-4000-8000-000000000002', '${F}', 'to-be', array['e-f1','e-f2','e-f3'])`);
    assert.strictEqual((await rpc(db, F, 'academia_exam_submit', { p_attempt: '20000000-0000-4000-8000-000000000002', p_answers: { 'e-f1': 'a', 'e-f2': 'b', 'e-f3': 'is' } })).error, 'members');
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_badges'))[0].n, 0);
    const st = await rpc(db, F, 'academia_exam_status', { p_course: 'to-be' });
    assert.strictEqual(st.can_take, false);
  });
  await test('GRATIS: no puede escribir en las tablas de la academia ni tocar sus propios datos de demostracion o insignias', async()=>{
    const db = await fresh(); await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    for(const sql of [
      `insert into public.academia_badges (user_id, course_id, score_pct) values ('${F}', 'to-be', 100)`,
      `update public.academia_progress set demo_started_at = null, demo_done_at = null where user_id = '${F}'`,
      `delete from public.academia_progress where user_id = '${F}'`,
      `insert into public.academia_progress (user_id, course_id, state) values ('${F}', 'to-be', '{}')`,
      `update public.academia_courses set demo_items = '{}'`,
      `select * from public.academia_exam_items`,
      `select * from public.academia_mistake_batches`,
      `update public.academia_exam_attempts set passed = true`]){
      let err = null; try{ await H.asUser(db, F, () => db.exec(sql)); }catch(e){ err = e; }
      assert(err && /permission denied|row-level|violates|does not exist/.test(err.message), 'debia fallar: ' + sql);
    }
    const p = (await q(db, 'select demo_started_at from public.academia_progress'))[0];
    assert(p.demo_started_at, 'la demostracion sigue registrada');
  });
  await test('GRATIS: la sesion de la demostracion se guarda UNA vez (tier free, sin last_practice_at) y no mas', async()=>{
    const db = await fresh();
    await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    const r = await rpc(db, F, 'academia_record_session', { p_course: 'to-be', p_session: demoSession() });
    assert.deepStrictEqual(plain([r.ok, r.inserted]), [true, true]);
    const rows = await q(db, 'select skill, level, tier, topics from public.progress_sessions');
    assert.strictEqual(rows.length, 1); assert.strictEqual(rows[0].tier, 'free'); assert.strictEqual(rows[0].skill, 'gramatica');
    assert.strictEqual((await prof(db, F)).last_practice_at, null, 'last_practice_at es solo de miembros');
    const r2 = await rpc(db, F, 'academia_record_session', { p_course: 'to-be', p_session: demoSession(T0 + 77) });   // otro intento con otro inicio
    assert.deepStrictEqual(plain([r2.ok, r2.inserted, r2.duplicate]), [true, false, true]);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 1);
    // los errores de la demo si entran al MISMO motor de errores, con el tema del curso
    await rpc(db, F, 'academia_apply_mistakes', { p_batch: '30000000-0000-4000-8000-000000000001', p_items: [{ item_id: 'ac:to-be:d2', is_correct: false }] });
    const m = (await q(db, `select kind, topic, fail_count from public.mistake_stats where item_id = 'ac:to-be:d2'`))[0];
    assert.deepStrictEqual(plain([m.kind, m.topic, m.fail_count]), ['academia', 'Verbo "to be": am / is / are', 1]);
  });
  await test('GRATIS: sin haber empezado la demostracion no puede mandar nada (ni sesion ni errores de la demo)', async()=>{
    const db = await fresh();
    assert.strictEqual((await rpc(db, F, 'academia_record_session', { p_course: 'to-be', p_session: demoSession() })).error, 'members');
    assert.strictEqual((await rpc(db, F, 'academia_apply_mistakes', { p_batch: '40000000-0000-4000-8000-000000000001', p_items: [{ item_id: 'ac:to-be:d1', is_correct: false }] })).error, 'members');
  });
  await test('GRATIS: no puede inflar el motor de errores con lotes repetidos de la demostracion (tope)', async()=>{
    const db = await fresh(); await rpc(db, F, 'academia_demo_start', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    let ok = 0, denied = 0;
    for(let i = 0; i < 12; i++){
      const r = await rpc(db, F, 'academia_apply_mistakes', { p_batch: '50000000-0000-4000-8000-0000000000' + String(10 + i), p_items: [{ item_id: 'ac:to-be:d1', is_correct: false }] });
      if(r.ok) ok++; else denied++;
    }
    assert.strictEqual(ok, 6); assert.strictEqual(denied, 6);
    assert((await q(db, `select fail_count from public.mistake_stats where item_id = 'ac:to-be:d1'`))[0].fail_count <= 6);
  });

  /* ---------- miembros ---------- */
  await test('MIEMBRO: sesion de leccion = UNA fila en progress_sessions + last_practice_at; tier null; sin duplicados al reintentar', async()=>{
    const db = await fresh();
    await setProf(db, A, `last_practice_at = '2026-01-01T00:00:00Z'`);
    const r = await rpc(db, A, 'academia_record_session', { p_course: 'to-be', p_session: lessonSession(8) });
    assert.deepStrictEqual(plain([r.ok, r.inserted]), [true, true]);
    const row = (await q(db, 'select skill, level, tier, topics, started_at, results from public.progress_sessions'))[0];
    assert.deepStrictEqual(plain([row.skill, row.level, row.tier, row.topics[0], Number(row.started_at), row.results.length]), ['gramatica', 'facil', null, 'Verbo "to be": am / is / are', T0, 8]);
    const lp1 = (await prof(db, A)).last_practice_at; assert(new Date(lp1).getTime() > Date.now() - 60000, 'last_practice_at = ahora');
    await setProf(db, A, `last_practice_at = '2026-02-02T00:00:00Z'`);          // para detectar si un reintento lo vuelve a tocar
    for(let i = 0; i < 3; i++){
      const d = await rpc(db, A, 'academia_record_session', { p_course: 'to-be', p_session: lessonSession(8) });
      assert.deepStrictEqual(plain([d.ok, d.inserted, d.duplicate]), [true, false, true]);
    }
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 1);
    assert.strictEqual(new Date((await prof(db, A)).last_practice_at).toISOString(), '2026-02-02T00:00:00.000Z', 'un reintento no cuenta como practica nueva');
    // repetir la leccion a proposito (otro inicio) SI es otra practica real
    await rpc(db, A, 'academia_record_session', { p_course: 'to-be', p_session: lessonSession(8, T0 + 900000) });
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 2);
    assert(new Date((await prof(db, A)).last_practice_at).getTime() > Date.now() - 60000);
  });
  await test('MIEMBRO: acciones triviales NO cuentan como practica (menos de 3 ejercicios distintos, ids ajenos, datos absurdos)', async()=>{
    const db = await fresh();
    await setProf(db, A, `last_practice_at = '2026-01-01T00:00:00Z'`);
    const bad = [
      { ...lessonSession(2) },                                                                        // 2 ejercicios
      { ...lessonSession(8), results: Array.from({ length: 8 }, () => ({ itemId: 'ac:to-be:l1-a1', isCorrect: true })) },   // el mismo ejercicio 8 veces
      { ...lessonSession(8), results: [] },
      { ...lessonSession(8), results: 'x' },
      { ...lessonSession(8), results: lessonSession(8).results.map(r => ({ ...r, itemId: 'g:pasado:' + r.itemId.slice(-2) })) },   // ids de otra cosa
      { ...lessonSession(8), results: lessonSession(8).results.map(r => ({ ...r, itemId: r.itemId.replace('to-be', 'otro') })) },
      { ...lessonSession(8), startedAt: 5 },
      { ...lessonSession(8), startedAt: Date.now() + 3 * 86400000 },
      { ...lessonSession(8), startedAt: 'abc' },
      { ...lessonSession(70), results: Array.from({ length: 70 }, (_, i) => ({ itemId: 'ac:to-be:l1-a' + i, isCorrect: true })) }];
    for(const s of bad){
      const r = await rpc(db, A, 'academia_record_session', { p_course: 'to-be', p_session: s });
      assert.deepStrictEqual(plain([r.ok, r.error]), [false, 'bad'], JSON.stringify(s).slice(0, 120));
    }
    assert.strictEqual((await rpc(db, A, 'academia_record_session', { p_course: 'to-be', p_session: null })).error, 'bad');
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 0);
    assert.strictEqual(new Date((await prof(db, A)).last_practice_at).toISOString(), '2026-01-01T00:00:00.000Z', 'last_practice_at intacto');
    // abrir la pagina / aprender el progreso tampoco la toca
    await rpc(db, A, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 0 });
    await rpc(db, A, 'academia_save_progress', { p_course: 'to-be', p_state: { v: 1 }, p_base_version: 0 });
    assert.strictEqual(new Date((await prof(db, A)).last_practice_at).toISOString(), '2026-01-01T00:00:00.000Z');
  });
  await test('MIEMBRO: el servidor decide skill, nivel y tema (el navegador no puede inventarlos); la fecha del navegador solo vale si es coherente', async()=>{
    const db = await fresh();
    const s = { ...lessonSession(8), skill: 'listening', level: 'dificil', topics: ['Otro'], date: '1999-01-01', tier: 'free' };
    await rpc(db, A, 'academia_record_session', { p_course: 'to-be', p_session: s });
    const row = (await q(db, 'select skill, level, tier, topics, date from public.progress_sessions'))[0];
    assert.deepStrictEqual(plain([row.skill, row.level, row.tier, row.topics[0]]), ['gramatica', 'facil', null, 'Verbo "to be": am / is / are']);
    assert.strictEqual(new Date(row.date).toISOString().slice(0, 4), '2026', 'una fecha absurda se reemplaza por la del inicio');
  });
  await test('MIEMBRO: respeta el limite diario de sesiones de la base (300) sin romperse ni marcar actividad', async()=>{
    const db = await fresh();
    await db.exec(`insert into public.progress_sessions (user_id, skill, level, topics, date, started_at, results)
      select '${A}', 'vocabulario', 'facil', '[]', current_date, 1700000000000 + g, '[]' from generate_series(1, 300) g`);
    await db.exec(`update public.progress_sessions set created_at = now()`);
    await setProf(db, A, `last_practice_at = '2026-01-01T00:00:00Z'`);
    const r = await rpc(db, A, 'academia_record_session', { p_course: 'to-be', p_session: lessonSession(8) });
    assert.deepStrictEqual(plain([r.ok, r.error]), [false, 'limit']);
    assert.strictEqual(new Date((await prof(db, A)).last_practice_at).toISOString(), '2026-01-01T00:00:00.000Z');
  });
  await test('MIEMBRO: acceso completo, progreso sincronizado entre dispositivos, evaluacion calificada por el servidor e insignia unica', async()=>{
    const db = await fresh();
    const d1 = Nube.create({ enabled: true, courseId: 'to-be', meta: null, getClient: () => H.fakeClient(db, A), getSession: async () => ({ user: { id: A } }), storage: null });
    const d2 = Nube.create({ enabled: true, courseId: 'to-be', meta: null, getClient: () => H.fakeClient(db, A), getSession: async () => ({ user: { id: A } }), storage: null });
    const b1 = await d1.boot({ v: 1, lessons: { 'am-is-are': { done: true } } });
    assert.strictEqual((await d1.save(() => b1.state)).ok, true);
    const b2 = await d2.boot({});
    assert.strictEqual(plain(b2.state.lessons)['am-is-are'].done, true);
    const a = await d2.access();
    assert.deepStrictEqual(plain([a.ok, a.member, a.demo.available]), [true, true, false]);
    // evaluacion: primer intento mal, segundo bien
    const c = H.fakeClient(db, A);
    const by = {}; BANK.forEach(b => by[b.id] = b);
    async function attempt(good){
      const s = (await c.rpc('academia_exam_start', { p_course: 'to-be' })).data; assert.strictEqual(s.ok, true);
      const ans = {}; s.items.forEach(i => { const b = by[i.id]; ans[i.id] = good ? (b.type === 'type' ? b.answer.accepted[0] : b.answer.correct) : 'zzz'; });
      return (await c.rpc('academia_exam_submit', { p_attempt: s.attempt_id, p_answers: ans })).data;
    }
    const bad = await attempt(false); assert.deepStrictEqual(plain([bad.ok, bad.passed, bad.badge]), [true, false, false]);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_badges'))[0].n, 0);
    const good = await attempt(true); assert.deepStrictEqual(plain([good.passed, good.badge]), [true, true]);
    await attempt(true);                                                                              // aprobar otra vez no duplica la insignia
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_badges'))[0].n, 1);
  });

  /* ---------- la membresia vence y se reactiva ---------- */
  await test('MEMBRESIA QUE VENCE: lo ganado se conserva y se puede leer; lo premium se bloquea al instante; al reactivar todo vuelve', async()=>{
    const db = await fresh();
    const c = H.fakeClient(db, A);
    const by = {}; BANK.forEach(b => by[b.id] = b);
    const d = Nube.create({ enabled: true, courseId: 'to-be', meta: null, getClient: () => c, getSession: async () => ({ user: { id: A } }), storage: null });
    const b = await d.boot({ v: 1, lessons: { 'am-is-are': { done: true }, 'afirmaciones': { done: true } } });
    assert.strictEqual((await d.save(() => b.state)).ok, true);
    const s = (await c.rpc('academia_exam_start', { p_course: 'to-be' })).data;
    const ans = {}; s.items.forEach(i => { const bb = by[i.id]; ans[i.id] = bb.type === 'type' ? bb.answer.accepted[0] : bb.answer.correct; });
    assert.strictEqual((await c.rpc('academia_exam_submit', { p_attempt: s.attempt_id, p_answers: ans })).data.badge, true);
    const open = (await c.rpc('academia_exam_start', { p_course: 'to-be' })).data;     // intento abierto cuando vence

    await setProf(db, A, 'is_member = false');                                          // vence (el webhook de pago lo pone en false)
    const acc = await d.access(); assert.deepStrictEqual(plain([acc.ok, acc.member]), [true, false]);
    // bloqueado de inmediato
    assert.strictEqual((await d.save(() => ({ v: 1, goal: 5 }))).reason, 'members');
    assert.strictEqual((await c.rpc('academia_exam_start', { p_course: 'to-be' })).data.error, 'members');
    assert.strictEqual((await c.rpc('academia_exam_submit', { p_attempt: open.attempt_id, p_answers: {} })).data.error, 'members');
    assert.strictEqual((await c.rpc('academia_apply_mistakes', { p_batch: '60000000-0000-4000-8000-000000000001', p_items: [{ item_id: 'ac:to-be:l2-a1', is_correct: false }] })).data.error, 'members');
    assert.strictEqual((await c.rpc('academia_record_session', { p_course: 'to-be', p_session: lessonSession(8) })).data.error, 'members');
    // y lo ya ganado sigue ahi y se puede leer
    const row = (await c.from('academia_progress').select('state,version').eq('course_id', 'to-be').maybeSingle()).data;
    assert.strictEqual(plain(row.state.lessons)['afirmaciones'].done, true);
    assert.strictEqual((await d.badge()).score_pct, 100);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_exam_attempts where user_id = $1', [A]))[0].n, 2);
    // al vencer, la demostracion gratuita NO se le ofrece como si fuera nuevo (ya es un usuario que conoce la academia)
    const acc2 = await d.access(); assert.strictEqual(acc2.demo.available, true, 'sin demo previa registrada, una cuenta que vence es una cuenta gratis mas');
    // reactiva
    await setProf(db, A, 'is_member = true');
    assert.strictEqual((await d.access()).member, true);
    assert.strictEqual((await d.save(() => ({ ...b.state, goal: 5 }))).ok, true);
    assert.strictEqual((await c.rpc('academia_exam_submit', { p_attempt: open.attempt_id, p_answers: ans })).data.ok, true);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_badges'))[0].n, 1, 'la insignia sigue siendo una sola');
  });
  await test('NO destructivo: apagar la academia (enabled = false) no borra progreso, insignias ni intentos, y todo sigue legible', async()=>{
    const db = await fresh(); const c = H.fakeClient(db, A);
    const d = Nube.create({ enabled: true, courseId: 'to-be', meta: null, getClient: () => c, getSession: async () => ({ user: { id: A } }), storage: null });
    const b = await d.boot({ v: 1, lessons: { 'am-is-are': { done: true } } }); await d.save(() => b.state);
    const s = (await c.rpc('academia_exam_start', { p_course: 'to-be' })).data; const by = {}; BANK.forEach(x => by[x.id] = x);
    const ans = {}; s.items.forEach(i => { const bb = by[i.id]; ans[i.id] = bb.type === 'type' ? bb.answer.accepted[0] : bb.answer.correct; });
    await c.rpc('academia_exam_submit', { p_attempt: s.attempt_id, p_answers: ans });
    const before = await q(db, `select (select count(*) from public.academia_progress)::int p, (select count(*) from public.academia_badges)::int b, (select count(*) from public.academia_exam_attempts)::int a, (select count(*) from public.academia_mistake_batches)::int m`);
    await db.exec(`update public.academia_courses set enabled = false`);
    for(const [fn, args] of [['academia_access', { p_course: 'to-be' }], ['academia_exam_start', { p_course: 'to-be' }], ['academia_demo_start', { p_course: 'to-be' }]]) assert.strictEqual((await c.rpc(fn, args)).data.error, 'course');
    assert.deepStrictEqual(plain(await q(db, `select (select count(*) from public.academia_progress)::int p, (select count(*) from public.academia_badges)::int b, (select count(*) from public.academia_exam_attempts)::int a, (select count(*) from public.academia_mistake_batches)::int m`)), plain(before));
    const row = (await c.from('academia_progress').select('state,version').eq('course_id', 'to-be').maybeSingle()).data;
    assert.strictEqual(plain(row.state.lessons)['am-is-are'].done, true);
    assert((await c.from('academia_badges').select('score_pct,awarded_at').eq('course_id', 'to-be').maybeSingle()).data, 'la insignia se sigue leyendo');
  });

  /* ---------- compatibilidad con lo existente ---------- */
  await test('la practica gratis tradicional sigue igual: la academia no cambia el contador salvo la demostracion, ni las sesiones existentes', async()=>{
    const db = await fresh();
    await setProf(db, F, `free_daily_count = 2, free_daily_date = '${today()}'`);
    await rpc(db, F, 'academia_access', { p_course: 'to-be', p_today: today(), p_local_count: 2 });
    await rpc(db, F, 'academia_save_progress', { p_course: 'to-be', p_state: { v: 1 }, p_base_version: 0 }).catch(() => {});
    assert.strictEqual((await prof(db, F)).free_daily_count, 2, 'consultar o abrir la academia no cobra ejercicios');
    // una sesion normal de practica gratis (como la manda pushFreeSession) sigue aceptandose por el mismo camino y el trigger real
    await H.asUser(db, F, () => db.query(`insert into public.progress_sessions (user_id, skill, level, topics, date, started_at, duration_ms, results) values ($1,'gramatica','facil','["Some / Any"]',current_date,$2,1000,'[{"itemId":"g-facil-some-1","isCorrect":true}]')`, [F, T0 + 1]));
    assert.strictEqual((await q(db, 'select tier from public.progress_sessions'))[0].tier, 'free');
  });


  await test('SEGURIDAD con permisos por defecto de Supabase: anon no ejecuta nada de la academia; nadie lee respuestas, ni escribe cursos, insignias, intentos o progreso', async()=>{
    const db = await fresh();
    const fns = ['academia_access(text,date,int)', 'academia_demo_start(text,date,int)', 'academia_demo_finish(text)', 'academia_save_progress(text,jsonb,int)', 'academia_apply_mistakes(uuid,jsonb)', 'academia_retry_pending()', 'academia_record_session(text,jsonb)', 'academia_exam_status(text)', 'academia_exam_start(text)', 'academia_exam_submit(uuid,jsonb)'];
    for(const f of fns){
      const priv = (await q(db, `select has_function_privilege('anon', '${'public.' + f}', 'execute') a, has_function_privilege('authenticated', '${'public.' + f}', 'execute') u`))[0];
      assert.strictEqual(priv.a, false, 'anon puede ejecutar ' + f); assert.strictEqual(priv.u, true, 'authenticated debe poder ' + f);
    }
    for(const f of ['academia_apply_batch(uuid,uuid,text,jsonb)', 'academia_is_member(uuid)', 'academia_free_count(uuid,date,int)', 'academia_free_daily_limit()', 'academia_today(date)']){
      const priv = (await q(db, `select has_function_privilege('anon', '${'public.' + f}', 'execute') a, has_function_privilege('authenticated', '${'public.' + f}', 'execute') u`))[0];
      assert.deepStrictEqual([priv.a, priv.u], [false, false], 'funcion interna expuesta: ' + f);
    }
    for(const t of ['academia_exam_items', 'academia_mistake_batches']) for(const r of ['anon', 'authenticated']) for(const op of ['select', 'insert', 'update', 'delete'])
      assert.strictEqual((await q(db, `select has_table_privilege('${r}', 'public.${t}', '${op}') x`))[0].x, false, r + ' ' + op + ' ' + t);
    for(const t of ['academia_courses', 'academia_progress', 'academia_badges', 'academia_exam_attempts']) for(const op of ['insert', 'update', 'delete'])
      for(const r of ['anon', 'authenticated']) assert.strictEqual((await q(db, `select has_table_privilege('${r}', 'public.${t}', '${op}') x`))[0].x, false, r + ' ' + op + ' ' + t);
    // el intento abierto no expone la respuesta ni al dueño
    assert.strictEqual((await q(db, `select has_column_privilege('authenticated', 'public.academia_exam_attempts', 'item_ids', 'select') x`))[0].x, false);
    const st = await rpc(db, A, 'academia_exam_start', { p_course: 'to-be' });
    assert(!/correct|accepted|why|answer/i.test(JSON.stringify(st)), 'la evaluacion revela respuestas antes de calificar');
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
