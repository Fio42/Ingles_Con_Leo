#!/usr/bin/env node
/* Academia: robustez de la sincronizacion (corre en Postgres embebido, sin tocar Supabase).
   Corre con:  node tools/tests/academia-robustez.test.js

   Lo que se protege:
   1. Todo campo que el cliente guarda (cleared, goalAt...) lo acepta tambien la base; ninguna lista queda desfasada.
   2. Errores de cursos al motor actual EXACTAMENTE una vez: reenviar, perder la respuesta de la red o abrir dos
      pestanas no cuenta doble (apply_mistake_results por si solo NO es idempotente).
   3. Si el motor falla en el examen, la nota se entrega igual y el fallo queda a la vista y se reintenta.
   4. Respuestas dadas sin conexion sobreviven a cerrar el navegador y no se duplican al sincronizar.
   5. Las sesiones de practica de las lecciones no se duplican al reintentar. */
const fs = require('fs'), assert = require('assert'), vm = require('vm');
const H = require('./academia-pg-helpers.js');
const Nube = vm.runInNewContext(H.read('academia-nube.js') + ';AcademiaNube');
const META = vm.runInNewContext(H.read('academia-motor.js') + ';ACADEMIA_MOTOR').courses['to-be'];
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); }
}
const plain = x => JSON.parse(JSON.stringify(x));
const MEM = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m }; };
const BANK = [];
['forma', 'afirm'].forEach(t => {
  BANK.push({ id: 'e-' + t[0] + '1', topic: t, type: 'choice', public: { q: 'P ' + t, options: ['a', 'b'] }, answer: { correct: 'a', why: 'por que a' } });
  BANK.push({ id: 'e-' + t[0] + '2', topic: t, type: 'type', public: { q: 'T ' + t, source: 'She ___.' }, answer: { accepted: ['is'], why: 'is' } });
  BANK.push({ id: 'e-' + t[0] + '3', topic: t, type: 'order', public: { q: 'O ' + t, tokens: ['Is', 'she'] }, answer: { order: ['Is', 'she'], why: 'orden' } });
});

(async()=>{
  console.log('Academia (robustez de la sincronizacion)');
  const PGlite = await H.loadPglite();
  if(!PGlite){ console.log('  omitida: instala @electric-sql/pglite o define LEO_PGLITE_DIR'); return; }
  const q = async (db, sql, p) => (await db.query(sql, p)).rows;
  async function fresh(){
    const db = await H.freshDb(PGlite, BANK);
    await db.exec(`update public.academia_courses set exam_size = 6, per_topic = 3, max_attempts_day = 20`);
    return db;
  }
  /* Un "dispositivo": cliente de la nube sobre la base, con almacenamiento propio (o compartido) y red controlable. */
  function device(db, uid, opt){
    opt = opt || {};
    const net = opt.net || {};
    const client = H.fakeClient(db, uid, net);
    // "se pierde la respuesta": la base SI ejecuta la llamada, pero el navegador no se entera
    const lossy = { rpc: async (fn, args) => { const r = await client.rpc(fn, args); if(net.loseReply && net.loseReply(fn)) throw new Error('respuesta perdida'); return r; }, from: t => client.from(t) };
    const env = {
      enabled: true, courseId: 'to-be', meta: META, getClient: () => lossy,
      getSession: async () => (uid ? { user: { id: uid } } : null),
      storage: opt.storage || MEM(),
      localDailyCount: () => opt.local || 0, setLocalDailyCount: n => { opt.local = n; }
    };
    return { n: Nube.create(env), storage: env.storage, net };
  }
  const stat = async (db, uid, id) => (await q(db, 'select fail_count, correct_streak, status from public.mistake_stats where user_id = $1 and item_id = $2', [uid, id]))[0];
  const A = H.U.a;

  /* ---------- 1. campos del estado ---------- */
  await test('la lista de campos de la base incluye TODOS los que guarda el cliente (nada se descarta en silencio)', async()=>{
    const sql = H.read('supabase/migrations/20261026120000_academia_integracion.sql');
    const m = sql.match(/allowed text\[\] := array\[([^\]]+)\]/);
    const allowed = m[1].split(',').map(x => x.trim().replace(/'/g, ''));
    assert.deepStrictEqual(plain(Nube.KEYS.filter(k => !allowed.includes(k))), [], 'faltan en la base');
    assert.deepStrictEqual(allowed.filter(k => !plain(Nube.KEYS).includes(k)), [], 'sobran en la base');
  });
  await test('cleared y goalAt viajan a la nube y vuelven a otro dispositivo', async()=>{
    const db = await fresh();
    const d1 = device(db, A), d2 = device(db, A);
    const st = { v: 1, lessons: {}, missed: { 'l1-a1': 50 }, cleared: { 'l1-a2': 90, 'l2-a1': 95 }, goal: 4, goalAt: 77, days: ['2026-10-25'] };
    const b = await d1.n.boot(st);
    assert.strictEqual((await d1.n.save(() => b.state)).ok, true);
    const row = (await q(db, 'select state from public.academia_progress'))[0].state;
    assert.deepStrictEqual(plain(row.cleared), { 'l1-a2': 90, 'l2-a1': 95 });
    assert.strictEqual(row.goalAt, 77); assert.strictEqual(row.goal, 4);
    const b2 = await d2.n.boot({});
    assert.deepStrictEqual(plain(b2.state.cleared), { 'l1-a2': 90, 'l2-a1': 95 });
    assert.strictEqual(b2.state.goalAt, 77);
    // un "no lo tengo" posterior en el segundo dispositivo borra el pendiente en TODOS, no solo en el local
    const st2 = Nube.mergeStates(b2.state, { missed: { 'l1-a1': 40 }, cleared: { 'l1-a1': 120 } });
    assert.strictEqual(st2.missed['l1-a1'], undefined);
    assert.strictEqual((await d2.n.save(() => st2)).ok, true);
    const b3 = await device(db, A).n.boot({});
    assert.strictEqual(b3.state.missed['l1-a1'], undefined); assert.strictEqual(b3.state.cleared['l1-a1'], 120);
  });

  /* ---------- 2. errores: exactamente una vez ---------- */
  await test('el mismo envio llegado dos veces cuenta UNA vez (el servidor recuerda el identificador)', async()=>{
    const db = await fresh(); const c = H.fakeClient(db, A);
    const id = '11111111-1111-4111-8111-111111111111';
    const items = [{ item_id: 'ac:to-be:l1-a1', is_correct: false }, { item_id: 'ac:to-be:l1-a2', is_correct: false }];
    const r1 = (await c.rpc('academia_apply_mistakes', { p_batch: id, p_items: items })).data;
    const r2 = (await c.rpc('academia_apply_mistakes', { p_batch: id, p_items: items })).data;
    const r3 = (await c.rpc('academia_apply_mistakes', { p_batch: id, p_items: items })).data;
    assert.deepStrictEqual([r1.ok, r1.duplicate, r2.ok, r2.duplicate, r3.duplicate], [true, false, true, true, true]);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1);
    // otro envio distinto SI cuenta (es otra respuesta del alumno)
    await c.rpc('academia_apply_mistakes', { p_batch: '22222222-2222-4222-8222-222222222222', p_items: [items[0]] });
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 2);
    const b = (await q(db, 'select status, n, items from public.academia_mistake_batches where batch_id = $1', [id]))[0];
    assert.deepStrictEqual([b.status, b.n, b.items], ['applied', 2, null]);
  });
  await test('el servidor decide el tema y el tipo, y rechaza lo que no es de un curso habilitado', async()=>{
    const db = await fresh(); const c = H.fakeClient(db, A);
    const ok = (await c.rpc('academia_apply_mistakes', { p_batch: '33333333-3333-4333-8333-333333333333',
      p_items: [{ item_id: 'ac:to-be:l1-a1', kind: 'grammar', topic: 'Tema inventado', is_correct: false }] })).data;
    assert.strictEqual(ok.ok, true);
    const row = (await q(db, `select kind, topic from public.mistake_stats where item_id = 'ac:to-be:l1-a1'`))[0];
    assert.deepStrictEqual([row.kind, row.topic], ['academia', 'Verbo "to be": am / is / are']);
    for(const bad of [[{ item_id: 'g:pasado:5', is_correct: false }], [{ item_id: 'ac:otro:x1', is_correct: false }], [{ item_id: 'ac:to-be:' + 'x'.repeat(50), is_correct: false }], [], '"no"'])
      assert.strictEqual((await c.rpc('academia_apply_mistakes', { p_batch: '44444444-4444-4444-8444-444444444444', p_items: bad })).data.error, 'bad');
    assert.strictEqual((await c.rpc('academia_apply_mistakes', { p_batch: '44444444-4444-4444-8444-444444444444', p_items: Array.from({ length: 201 }, (_, i) => ({ item_id: 'ac:to-be:a' + i, is_correct: false })) })).data.error, 'bad');
    assert.strictEqual((await q(db, `select count(*)::int n from public.mistake_stats where item_id not like 'ac:to-be:%'`))[0].n, 0);
    const anon = await H.fakeClient(db, '').rpc('academia_apply_mistakes', { p_batch: '55555555-5555-4555-8555-555555555555', p_items: [{ item_id: 'ac:to-be:l1-a1', is_correct: false }] });
    assert.strictEqual(anon.data && anon.data.error, 'auth');
    await db.exec(`update public.academia_courses set enabled = false`);
    assert.strictEqual((await c.rpc('academia_apply_mistakes', { p_batch: '66666666-6666-4666-8666-666666666666', p_items: [{ item_id: 'ac:to-be:l1-a1', is_correct: false }] })).data.error, 'course');
  });
  await test('nadie lee ni escribe la tabla de envios desde el navegador', async()=>{
    const db = await fresh(); const c = H.fakeClient(db, A);
    await c.rpc('academia_apply_mistakes', { p_batch: '77777777-7777-4777-8777-777777777777', p_items: [{ item_id: 'ac:to-be:l1-a1', is_correct: false }] });
    for(const sql of ['select * from public.academia_mistake_batches', `update public.academia_mistake_batches set status = 'pending'`, 'delete from public.academia_mistake_batches']){
      let err = null; try{ await H.asUser(db, A, () => db.exec(sql)); }catch(e){ err = e; }
      assert(err && /permission denied/.test(err.message), sql);
    }
    for(const fn of ['academia_apply_batch']){
      let err = null; try{ await H.asUser(db, A, () => db.query(`select public.${fn}('${A}', '${'1'.repeat(8)}-1111-4111-8111-111111111111', 'lesson', '[]'::jsonb)`)); }catch(e){ err = e; }
      assert(err && /permission denied/.test(err.message), fn + ' no es publica');
    }
  });

  /* ---------- 3. el motor falla durante el examen ---------- */
  async function doExam(db, uid, mode){
    const c = H.fakeClient(db, uid);
    const s = (await c.rpc('academia_exam_start', { p_course: 'to-be' })).data;
    const by = {}; BANK.forEach(b => by[b.id] = b);
    const ans = {};
    s.items.forEach((i, k) => { const b = by[i.id]; ans[i.id] = (mode === 'all' || (mode === 'half' && k % 2 === 0)) ? (b.type === 'choice' ? b.answer.correct : b.type === 'type' ? b.answer.accepted[0] : b.answer.order) : (b.type === 'order' ? ['x'] : 'zzz'); });
    return { c, s, ans };
  }
  await test('examen con el motor sano: engine_ok y el envio queda aplicado y sin items guardados', async()=>{
    const db = await fresh();
    const { c, s, ans } = await doExam(db, A, 'half');
    const r = (await c.rpc('academia_exam_submit', { p_attempt: s.attempt_id, p_answers: ans })).data;
    assert.strictEqual(r.ok, true); assert.strictEqual(r.engine_ok, true);
    const b = (await q(db, `select status, source, items from public.academia_mistake_batches where batch_id = $1`, [s.attempt_id]))[0];
    assert.deepStrictEqual([b.status, b.source, b.items], ['applied', 'exam', null]);
    assert((await q(db, 'select count(*)::int n from public.mistake_stats'))[0].n > 0);
  });
  await test('examen con el motor ROTO: la nota y la insignia se entregan, el fallo queda visible y nada queda a medias', async()=>{
    const db = await fresh();
    await db.exec(`create or replace function public.apply_mistake_results(p_items jsonb) returns void language plpgsql as $$ begin raise exception 'motor caido de prueba'; end $$;`);
    const { c, s, ans } = await doExam(db, A, 'all');
    const r = (await c.rpc('academia_exam_submit', { p_attempt: s.attempt_id, p_answers: ans })).data;
    assert.strictEqual(r.ok, true); assert.strictEqual(r.passed, true); assert.strictEqual(r.score_pct, 100);
    assert.strictEqual(r.engine_ok, false);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_badges'))[0].n, 1, 'la insignia se crea igual');
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_exam_attempts where submitted_at is not null'))[0].n, 1);
    const b = (await q(db, `select status, tries, error, n, items from public.academia_mistake_batches where batch_id = $1`, [s.attempt_id]))[0];
    assert.strictEqual(b.status, 'pending'); assert.strictEqual(b.tries, 1);
    assert(/motor caido de prueba/.test(b.error), 'el error queda registrado: ' + b.error);
    assert.strictEqual(b.n, 6); assert.strictEqual(b.items.length, 6, 'las respuestas se conservan para reintentar');
    assert.strictEqual((await q(db, 'select count(*)::int n from public.mistake_stats'))[0].n, 0);
    // sigue roto: el reintento deja constancia y no pierde nada
    const t1 = (await c.rpc('academia_retry_pending')).data;
    assert.deepStrictEqual([t1.applied, t1.pending], [0, 1]);
    assert.strictEqual((await q(db, 'select tries from public.academia_mistake_batches'))[0].tries, 2);
    // se arregla el motor: el siguiente reintento aplica UNA vez y despues no hay nada que hacer
    await db.exec(H.read('supabase_schema.sql').slice(H.read('supabase_schema.sql').indexOf('create or replace function public.apply_mistake_results'), H.read('supabase_schema.sql').indexOf('grant execute on function public.apply_mistake_results(jsonb) to authenticated;')));
    const t2 = (await c.rpc('academia_retry_pending')).data;
    assert.deepStrictEqual([t2.applied, t2.pending], [1, 0]);
    const n1 = (await q(db, 'select count(*)::int n, sum(correct_streak)::int s from public.mistake_stats'))[0];
    assert.strictEqual(n1.n, 0, 'todo acertado: no hay filas que abrir (no hubo fallos previos)');
    const t3 = (await c.rpc('academia_retry_pending')).data;
    assert.deepStrictEqual([t3.applied, t3.pending], [0, 0]);
    const b2 = (await q(db, `select status, error, items from public.academia_mistake_batches`))[0];
    assert.deepStrictEqual([b2.status, b2.error, b2.items], ['applied', null, null]);
  });
  await test('examen con fallos y motor roto: al repararse se aplican los fallos exactamente una vez', async()=>{
    const db = await fresh();
    await db.exec(`create or replace function public.apply_mistake_results(p_items jsonb) returns void language plpgsql as $$ begin raise exception 'caido'; end $$;`);
    const { c, s, ans } = await doExam(db, A, 'none');
    const r = (await c.rpc('academia_exam_submit', { p_attempt: s.attempt_id, p_answers: ans })).data;
    assert.deepStrictEqual([r.ok, r.passed, r.engine_ok], [true, false, false]);
    const sch = H.read('supabase_schema.sql');
    await db.exec(sch.slice(sch.indexOf('create or replace function public.apply_mistake_results'), sch.indexOf('grant execute on function public.apply_mistake_results(jsonb) to authenticated;')));
    await c.rpc('academia_retry_pending'); await c.rpc('academia_retry_pending');
    const rows = await q(db, `select item_id, fail_count, status from public.mistake_stats order by item_id`);
    assert.strictEqual(rows.length, 6); assert(rows.every(x => x.fail_count === 1 && x.status === 'active'));
  });
  await test('un envio de leccion con el motor roto: el cliente lo suelta (el servidor lo guarda) y se aplica despues', async()=>{
    const db = await fresh();
    const d = device(db, A);
    await d.n.boot({});
    await db.exec(`create or replace function public.apply_mistake_results(p_items jsonb) returns void language plpgsql as $$ begin raise exception 'caido'; end $$;`);
    d.n.recordAnswer('l1-a1', false); d.n.recordAnswer('l1-a2', true);
    const f = await d.n.flushMistakes();
    assert.strictEqual(f.ok, true); assert.strictEqual(d.n.pendingMistakes, 0); assert.strictEqual(d.n.queuedInServer, 1);
    assert.strictEqual((await q(db, `select status from public.academia_mistake_batches`))[0].status, 'pending');
    const sch = H.read('supabase_schema.sql');
    await db.exec(sch.slice(sch.indexOf('create or replace function public.apply_mistake_results'), sch.indexOf('grant execute on function public.apply_mistake_results(jsonb) to authenticated;')));
    const d2 = device(db, A); await d2.n.boot({});
    await d2.n.flushAll();                                  // al abrir la academia: reintento del servidor
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1);
    await d2.n.flushAll(); await d.n.flushAll();
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1, 'sin duplicados');
  });

  /* ---------- 4. cola persistente de errores ---------- */
  await test('sin conexion: las respuestas se guardan en el dispositivo y sobreviven a cerrar el navegador', async()=>{
    const db = await fresh(); const storage = MEM();
    let d = device(db, A, { storage });
    await d.n.boot({});                                      // conectado al abrir
    d.net.down = true;                                       // se cae la red
    d.n.recordAnswer('l1-a1', false); d.n.recordAnswer('l1-a2', false); d.n.recordAnswer('l1-a3', true);
    const f = await d.n.flushMistakes();
    assert.strictEqual(f.ok, false); assert.strictEqual(d.n.pendingMistakes, 3);
    assert(Object.keys(storage._m).some(k => /leo_academia_cola_v1/.test(k)), 'quedo escrito en el almacenamiento');
    assert.strictEqual((await q(db, 'select count(*)::int n from public.mistake_stats'))[0].n, 0);
    // el alumno cierra el navegador; al otro dia abre de nuevo con red
    const d2 = device(db, A, { storage });
    assert.strictEqual((await d2.n.boot({})).ok, true);
    assert.strictEqual(d2.n.pendingMistakes, 3);
    const r = await d2.n.flushAll();
    assert.strictEqual(r.ok, true); assert.strictEqual(d2.n.pendingMistakes, 0);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a2')).fail_count, 1);
    assert.strictEqual(await stat(db, A, 'ac:to-be:l1-a3'), undefined);
    await d2.n.flushAll(); await device(db, A, { storage }).n.boot({});
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1, 'abrir otra vez no repite');
  });
  await test('abrir la academia SIN red (sesion en cache): las respuestas se guardan y se envian al volver', async()=>{
    const db = await fresh(); const storage = MEM();
    const d = device(db, A, { storage, net: { down: true } });
    const b = await d.n.boot({});
    assert.strictEqual(b.ok, false);                          // no hay red: la academia sigue local
    d.n.recordAnswer('l2-a1', false);
    assert.strictEqual(d.n.pendingMistakes, 1);
    d.net.down = false;
    assert.strictEqual((await d.n.boot({})).ok, true);       // la pagina reintenta al volver la red
    assert.strictEqual((await d.n.flushAll()).ok, true);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l2-a1')).fail_count, 1);
  });
  await test('la red se corta DESPUES de que la base aplico el envio: el reintento no cuenta doble', async()=>{
    const db = await fresh(); const storage = MEM();
    const d = device(db, A, { storage });
    await d.n.boot({});
    d.net.loseReply = fn => fn === 'academia_apply_mistakes';
    d.n.recordAnswer('l1-a1', false);
    const f = await d.n.flushMistakes();
    assert.strictEqual(f.ok, false); assert.strictEqual(d.n.pendingMistakes, 1, 'el cliente no sabe si llego: lo conserva');
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1, 'la base ya lo habia aplicado');
    d.net.loseReply = null;
    assert.strictEqual((await d.n.flushMistakes()).ok, true);
    assert.strictEqual(d.n.pendingMistakes, 0);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1, 'sigue en 1');
  });
  await test('dos pestanas con la misma cola y envios simultaneos: cuenta una vez', async()=>{
    const db = await fresh(); const storage = MEM();
    const t1 = device(db, A, { storage }), t2 = device(db, A, { storage });
    await t1.n.boot({}); await t2.n.boot({});
    t1.n.recordAnswer('l1-a1', false); t2.n.recordAnswer('l1-a2', false);
    assert.strictEqual(t1.n.pendingMistakes, 2, 'ambas ven la misma cola');
    await Promise.all([t1.n.flushMistakes(), t2.n.flushMistakes()]);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a2')).fail_count, 1);
    assert.strictEqual(t1.n.pendingMistakes + t2.n.pendingMistakes, 0);
  });
  await test('una cola de OTRA cuenta en el mismo navegador nunca se envia con esta sesion', async()=>{
    const db = await fresh(); const storage = MEM();
    const x = device(db, A, { storage }); await x.n.boot({});
    x.net.down = true; x.n.recordAnswer('l1-a1', false); await x.n.flushMistakes();
    const y = device(db, H.U.b, { storage }); await y.n.boot({});
    assert.strictEqual(y.n.pendingMistakes, 0);
    await y.n.flushAll();
    assert.strictEqual((await q(db, 'select count(*)::int n from public.mistake_stats where user_id = $1', [H.U.b]))[0].n, 0);
    assert.strictEqual(x.n.pendingMistakes, 1);
  });
  await test('almacenamiento roto o con basura: no se cae y no pierde lo de la sesion actual', async()=>{
    const db = await fresh();
    const bad = { getItem: () => '{no es json', setItem: () => { throw new Error('lleno'); } };
    const d = device(db, A, { storage: bad });
    await d.n.boot({});
    d.n.recordAnswer('l1-a1', false);
    assert.strictEqual(d.n.pendingMistakes, 1);
    assert.strictEqual((await d.n.flushMistakes()).ok, true);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1);
    const none = device(db, A, { storage: null }); await none.n.boot({});
    none.n.recordAnswer('l1-a2', false); await none.n.flushMistakes();
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a2')).fail_count, 1);
  });
  await test('la cola tiene tope: nunca crece sin limite y avisa cuanto soltó', async()=>{
    const db = await fresh(); const d = device(db, A); await d.n.boot({});
    d.net.down = true;
    for(let i = 0; i < 3100; i++) d.n.recordAnswer('l1-a' + (i % 8), false);
    assert(d.n.pendingMistakes <= 3000); assert(d.n.dropped >= 100);
  });
  await test('un envio grande (mas de 200) se parte en lotes y llega completo una vez', async()=>{
    const db = await fresh(); const d = device(db, A); await d.n.boot({});
    for(let i = 0; i < 450; i++) d.n.recordAnswer('x' + i, false);
    assert.strictEqual((await d.n.flushMistakes()).ok, true);
    assert.strictEqual((await q(db, `select count(*)::int n from public.mistake_stats`))[0].n, 450);
    assert.strictEqual((await q(db, `select count(*)::int n from public.academia_mistake_batches`))[0].n, 3);
  });

  /* ---------- 5. sesiones ---------- */
  const lessonRes = [{ id: 'l1-a1', ok: true }, { id: 'l1-a2', ok: false }, { id: 'l1-a3', ok: true }];
  await test('terminar la leccion: UNA sesion; reintentar la misma no la duplica (ni con respuesta perdida)', async()=>{
    const db = await fresh(); const d = device(db, A); await d.n.boot({});
    const t0 = 1790000000000;
    d.net.loseReply = fn => fn === 'academia_record_session';                // la base guarda, el navegador cree que fallo
    await d.n.recordLesson({ n: 1 }, lessonRes, t0);
    assert.strictEqual(d.n.pendingSessions, 1);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 1);
    d.net.loseReply = null;
    await d.n.recordLesson({ n: 1 }, lessonRes, t0);          // misma pantalla final, mismo inicio
    await d.n.flushSessions(); await d.n.flushAll();
    assert.strictEqual(d.n.pendingSessions, 0);
    const rows = await q(db, 'select skill, level, topics, started_at from public.progress_sessions');
    assert.strictEqual(rows.length, 1);
    assert.deepStrictEqual([rows[0].skill, rows[0].level], ['gramatica', 'facil']);
    assert.strictEqual(rows[0].topics[0], 'Verbo "to be": am / is / are');
  });
  await test('sesion sin conexion: se guarda en el dispositivo y sale al volver; repetir la leccion SI es otra sesion', async()=>{
    const db = await fresh(); const storage = MEM();
    const d = device(db, A, { storage }); await d.n.boot({});
    d.net.down = true;
    await d.n.recordLesson({ n: 1 }, lessonRes, 1790000000000);
    assert.strictEqual(d.n.pendingSessions, 1);
    const d2 = device(db, A, { storage });                   // otro dia, mismo navegador
    await d2.n.boot({}); await d2.n.flushAll();
    assert.strictEqual(d2.n.pendingSessions, 0);
    await d2.n.recordLesson({ n: 1 }, lessonRes, 1790000900000);   // la repite despues: practica nueva
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 2);
    await d2.n.flushAll();
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 2);
  });
  await test('ni errores ni sesiones se mezclan: el mismo flujo completo repetido deja los conteos exactos', async()=>{
    const db = await fresh(); const d = device(db, A); await d.n.boot({});
    for(let rep = 0; rep < 2; rep++){
      d.n.recordAnswer('l1-a1', false); d.n.recordAnswer('l1-a2', true);
      await d.n.flushMistakes();
      await d.n.recordLesson({ n: 1 }, lessonRes, 1790000000000 + rep * 1000);
      await d.n.flushAll(); await d.n.flushAll();
    }
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 2);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 2);
  });

  /* ---------- 6. cuentas gratuitas y compatibilidad ---------- */
  await test('cuenta gratuita: ve el curso, pero no guarda avance en la nube ni hace la evaluacion oficial', async()=>{
    const db = await fresh(); const F = H.U.free; const c = H.fakeClient(db, F);
    const st = (await c.rpc('academia_exam_status', { p_course: 'to-be' })).data;
    assert.deepStrictEqual([st.ok, st.can_take, st.members_only], [true, false, true]);
    assert.strictEqual((await c.rpc('academia_exam_start', { p_course: 'to-be' })).data.error, 'members');
    const d = device(db, F); const b = await d.n.boot({ v: 1, lessons: { 'am-is-are': { done: true } } });
    assert.strictEqual(b.ok, true);
    const sv = await d.n.save(() => b.state);
    assert.deepStrictEqual([sv.ok, sv.reason], [false, 'members']);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_progress'))[0].n, 0);
    // aunque Leo pusiera members_only = false en la tabla, la evaluacion sigue siendo solo de miembros
    await db.exec(`update public.academia_courses set members_only = false`);
    assert.strictEqual((await c.rpc('academia_exam_start', { p_course: 'to-be' })).data.error, 'members');
  });
  await test('apagado rapido: con el curso deshabilitado la base deja de aceptar guardados, examen y errores; NADA se pierde y todo sale al reactivarlo', async()=>{
    const db = await fresh(); const d = device(db, A); const b = await d.n.boot({ v: 1 });
    assert.strictEqual((await d.n.save(() => b.state)).ok, true);
    await db.exec(`update public.academia_courses set enabled = false`);
    assert.strictEqual((await d.n.save(() => ({ v: 1, goal: 3 }))).reason, 'course');
    assert.strictEqual((await H.fakeClient(db, A).rpc('academia_exam_start', { p_course: 'to-be' })).data.error, 'course');
    d.n.recordAnswer('l1-a1', false); await d.n.recordLesson({ n: 1 }, lessonRes, 1790000000000);
    const f = await d.n.flushAll();
    assert.strictEqual(f.ok, false);
    assert.strictEqual(await stat(db, A, 'ac:to-be:l1-a1'), undefined);
    assert.strictEqual(d.n.pendingMistakes, 1); assert.strictEqual(d.n.pendingSessions, 1); assert.strictEqual(d.n.dropped, 0, 'no se suelta nada');
    // el progreso ya guardado sigue legible aunque este apagado (no se borra nada)
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_progress'))[0].n, 1);
    await db.exec(`update public.academia_courses set enabled = true`);
    assert.strictEqual((await d.n.flushAll()).ok, true);
    assert.strictEqual((await stat(db, A, 'ac:to-be:l1-a1')).fail_count, 1);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.progress_sessions'))[0].n, 1);
    assert.strictEqual((await d.n.save(() => ({ v: 1, goal: 3 }))).ok, true);
  });
  await test('la migracion se detiene sin crear nada si falta una pieza base de produccion; y se puede aplicar dos veces', async()=>{
    const bare = new PGlite();
    await bare.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql as $$ select null::uuid $$; create table public.profiles (id uuid primary key);`);
    let err = null; try{ await bare.exec(H.read('supabase/migrations/20261026120000_academia_integracion.sql')); }catch(e){ err = e; }
    assert(err && /faltan objetos base/.test(err.message), String(err));
    assert.strictEqual((await q(bare, `select count(*)::int n from pg_class where relname like 'academia%'`))[0].n, 0);
    const db = await fresh();
    await db.exec(H.read('supabase/migrations/20261026120000_academia_integracion.sql'));
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_courses'))[0].n, 1);
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
