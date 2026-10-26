#!/usr/bin/env node
/* Academia <-> motor adaptativo y nube. Corre con:  node tools/tests/academia-integracion.test.js
   Usa academia-nube.js, academia-motor.js, app.js, data.js y temas.js REALES; la base es PGlite con la migracion REAL
   (si no esta instalado @electric-sql/pglite, la parte de base se omite y lo dice). No toca Supabase ni la red.

   Lo que se protege:
   A. nada cambia mientras la academia este apagada;
   B. dos dispositivos se fusionan sin perder lo logrado;
   C. el cliente guarda/lee progreso, manda errores al motor actual (mistake_stats) y deja una sesion normal por leccion;
      la nota y la insignia salen SOLO del servidor; sin red nada se pierde;
   D. el motor actual (diagnostico) ve los errores de la academia, recomienda la leccion exacta y no se rompe nada mas. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const H = require('./academia-pg-helpers.js');
const root = H.root;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 3).join('\n       ')); }
}
const Nube = require('../../academia-nube.js');

/* ---------------- A. apagado por defecto ---------------- */
async function partA(){
  console.log('A. Apagado por defecto');
  await test('academia.html no carga Supabase ni backend.js de forma fija; el interruptor viene apagado', async()=>{
    const html = read('academia.html'), boot = read('academia-boot.js');
    assert(!/supabase|backend\.js|app\.js|meta-pixel|chatbot/i.test(html.replace(/<!--[\s\S]*?-->/g, '')), 'la pagina no debe cargar sistemas reales');
    assert(/var CLOUD_ON = (true|false);/.test(boot), 'CLOUD_ON debe ser un literal true/false');
    assert.strictEqual(/var CLOUD_ON = true;/.test(boot), /var PUBLIC = true;/.test(read('academia-lanzamiento.js')), 'CLOUD_ON y PUBLIC deben ir juntos');
    assert(/localhost\|127\\\.0\\\.0\\\.1/.test(boot), 'el modo de prueba solo vale en localhost');
  });
  await test('el titulo y la descripcion publicos de la academia no dicen piloto', async()=>{
    const html = read('academia.html');
    assert(!/<title>[^<]*piloto/i.test(html) && !/name="description" content="[^"]*piloto/i.test(html));
    assert(!/mientras dure el piloto|Es parte del piloto/.test(read('academia.js')));
  });
  await test('ACADEMIA_MOTOR.enabled viene en false y academia-motor.js esta al dia con academia-data.js', async()=>{
    const M = vm.runInNewContext(read('academia-motor.js') + ';ACADEMIA_MOTOR');
    assert.strictEqual(M.enabled, /var PUBLIC = true;/.test(read('academia-lanzamiento.js')), 'el motor va junto con PUBLIC');
    if(!M.enabled) assert.strictEqual(M.linkForTema('to-be-presente', [], 'x.html'), null, 'apagado: ningun enlace');
    const gen = require('../generar_academia_motor.js');
    assert.strictEqual(M.enabled ? (process.env.ACADEMIA_MOTOR_ENABLED = '1', gen.build()) : gen.build(), read('academia-motor.js'), 'corre node tools/generar_academia_motor.js');
  });
  await test('la migracion NO se aplica sola: curso apagado por defecto y no esta mezclada en supabase_schema.sql', async()=>{
    const mig = read('supabase/migrations/20261026120000_academia_integracion.sql');
    assert(/values \('to-be', 'Domina el verbo TO BE', false,/.test(mig));
    assert(!/academia_/.test(read('supabase_schema.sql')));
  });
  await test('el banco real del examen NO esta en el repositorio (git lo ignora) y el SQL con respuestas tampoco', async()=>{
    assert(/^private\/$/m.test(read('.gitignore')));
    const tracked = require('child_process').execSync('git ls-files', { cwd: root }).toString();
    assert(!/private\//.test(tracked), 'private/ no debe estar en git');
    const pub = read('academia-data.js') + read('academia.js') + read('academia-nube.js') + read('supabase/migrations/20261026120000_academia_integracion.sql');
    assert(!/e-f1|e-v6|My sister are a doctor/.test(pub), 'una pregunta del examen real aparece en un archivo publico');
  });
  await test('el sitio actual no cambia: app.js sin academia-motor.js se comporta igual (sin referencias obligatorias)', async()=>{
    const app = read('app.js');
    const uses = app.match(/ACADEMIA_MOTOR/g) || [];
    assert(uses.length >= 3);
    // toda referencia va protegida por typeof
    app.split('\n').forEach((l, i) => { if(/ACADEMIA_MOTOR/.test(l) && !/typeof ACADEMIA_MOTOR|^\s*(\/\/|\*)|ACADEMIA_MOTOR\.(indexEntries|linkForTema)/.test(l)) assert.fail('linea ' + (i + 1) + ' usa ACADEMIA_MOTOR sin proteger: ' + l.trim()); });
  });
}

/* ---------------- B. fusion ---------------- */
async function partB(){
  console.log('B. Fusión de dispositivos');
  const L = (done, at, firstOk) => ({ done: true, doneAt: at, firstOk: firstOk || 0, total: 8 });
  await test('lecciones: lo logrado en cualquier dispositivo se conserva; gana la fecha mas antigua y el mejor resultado', async()=>{
    const a = { lessons: { 'am-is-are': L(1, 100, 5) }, days: ['2026-10-01'] };
    const b = { lessons: { 'am-is-are': L(1, 50, 7), afirmaciones: L(1, 200, 6) }, days: ['2026-10-02'] };
    const m = Nube.mergeStates(a, b);
    assert.deepStrictEqual(Object.keys(m.lessons).sort(), ['afirmaciones', 'am-is-are']);
    assert.strictEqual(m.lessons['am-is-are'].doneAt, 50); assert.strictEqual(m.lessons['am-is-are'].firstOk, 7);
    assert.deepStrictEqual(m.days, ['2026-10-01', '2026-10-02']);
  });
  await test('a mitad de leccion: gana el guardado mas reciente; si la leccion se termino despues, no queda "a medias"', async()=>{
    const a = { resume: { 'negaciones': { lessonId: 'negaciones', stage: 'learn', idx: 1, at: 100 } } };
    const b = { resume: { 'negaciones': { lessonId: 'negaciones', stage: 'practice', at: 300 } } };
    let m = Nube.mergeStates(a, b);
    assert.strictEqual(m.resume.negaciones.stage, 'practice'); assert.strictEqual(m.last, 'negaciones');
    m = Nube.mergeStates(a, { lessons: { negaciones: L(1, 500, 6) } });
    assert.strictEqual(m.resume.negaciones, undefined); assert.strictEqual(m.last, null);
    m = Nube.mergeStates(a, { lessons: { negaciones: L(1, 50, 6) } });
    assert(m.resume.negaciones, 'una finalizacion ANTERIOR no borra un avance posterior (repetir la leccion)');
  });
  await test('errores: cuenta el que se fallo DESPUES del ultimo acierto; un acierto posterior en otro dispositivo lo limpia', async()=>{
    const a = { missed: { 'l3-a1': 100, 'l3-a2': 100 }, cleared: {} };
    const b = { missed: {}, cleared: { 'l3-a1': 200 } };
    const m = Nube.mergeStates(a, b);
    assert.deepStrictEqual(Object.keys(m.missed), ['l3-a2']);
    const m2 = Nube.mergeStates({ missed: { x: 300 }, cleared: {} }, { missed: {}, cleared: { x: 200 } });
    assert.deepStrictEqual(Object.keys(m2.missed), ['x'], 'un fallo posterior al acierto vuelve a contar');
    const old = Nube.mergeStates({ missed: { z: true } }, {});   // piloto viejo: missed = true
    assert(old.missed.z, 'estados del piloto (true) siguen valiendo');
  });
  await test('la fusion es conmutativa e idempotente (el orden y repetirla no cambian el resultado)', async()=>{
    const a = { lessons: { a: L(1, 10, 3) }, resume: { b: { at: 5, stage: 'learn', idx: 0 } }, missed: { x: 4 }, cleared: { y: 9 }, days: ['2026-01-02'], goal: 3, goalAt: 7, completions: [{ id: 'a', at: 10 }], exam: { attempts: [{ at: 1, pct: 50 }], best: 50, lastIds: ['x-f1'] }, snooze: '2026-10-01' };
    const b = { lessons: { c: L(1, 20, 4) }, resume: { b: { at: 8, stage: 'practice' } }, missed: { y: 3 }, cleared: { x: 6 }, days: ['2026-01-01'], goal: 5, goalAt: 9, completions: [{ id: 'c', at: 20 }], exam: { attempts: [{ at: 2, pct: 80 }], best: 80, lastIds: ['x-f2'] }, snooze: '2026-10-02' };
    const ab = Nube.mergeStates(a, b), ba = Nube.mergeStates(b, a);
    assert.deepStrictEqual(ab, ba);
    assert.deepStrictEqual(Nube.mergeStates(ab, a), ab); assert.deepStrictEqual(Nube.mergeStates(ab, ab), ab);
    assert.strictEqual(ab.goal, 5); assert.strictEqual(ab.exam.best, 80); assert.strictEqual(ab.exam.attempts.length, 2);
  });
  await test('estados raros o vacios no rompen la fusion', async()=>{
    for(const x of [null, undefined, {}, { lessons: null, resume: [], missed: 'x' }, { days: 'no' }]) Nube.mergeStates(x, { lessons: { a: L(1, 1, 1) } });
    assert.deepStrictEqual(Object.keys(Nube.mergeStates(null, null).lessons), []);
  });
}

/* ---------------- C. cliente + base ---------------- */
async function partC(PGlite){
  console.log('C. Cliente de la nube contra la base real (PGlite)');
  if(!PGlite){ console.log('  omitida: instala @electric-sql/pglite (npm i --no-save @electric-sql/pglite) o define LEO_PGLITE_DIR'); return; }
  const exam = [];
  ['forma', 'afirm'].forEach(t => {
    exam.push({ id: 'e-' + t[0] + '1', topic: t, type: 'choice', public: { q: 'P ' + t, options: ['a', 'b'] }, answer: { correct: 'a', why: 'por que a' } });
    exam.push({ id: 'e-' + t[0] + '2', topic: t, type: 'type', public: { q: 'T ' + t, source: 'She ___.' }, answer: { accepted: ['is'], why: 'is' } });
    exam.push({ id: 'e-' + t[0] + '3', topic: t, type: 'order', public: { q: 'O ' + t, tokens: ['Is', 'she'] }, answer: { order: ['Is', 'she'], why: 'orden' } });
  });
  const META = vm.runInNewContext(read('academia-motor.js') + ';ACADEMIA_MOTOR').courses['to-be'];
  async function device(db, uid, net, extra){
    const pushed = [];
    const client = H.fakeClient(db, uid, net);
    const env = Object.assign({
      enabled: true, courseId: 'to-be', meta: META, getClient: () => client,
      getSession: async () => (uid ? { user: { id: uid } } : null),
      applyMistakeResults: async items => { const r = await client.rpc('apply_mistake_results', { p_items: items }); return { ok: !r.error }; },
      pushSession: async s => { pushed.push(s); }
    }, extra || {});
    return { n: Nube.create(env), pushed, net: net || {}, client };
  }
  const q = async (db, sql, p) => (await db.query(sql, p)).rows;

  await test('sin sesion o con el curso apagado: no hace nada y avisa por que (la academia sigue local)', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const anon = await device(db, null);
    assert.deepStrictEqual((await anon.n.boot({})).reason, 'anon');
    await db.exec(`update public.academia_courses set enabled = false`);
    const d = await device(db, H.U.a);
    const r = await d.n.boot({});
    assert.strictEqual(r.ok, true);   // boot lee; guardar es lo que el servidor rechaza
    const s = await d.n.save(() => ({ v: 1, lessons: {} }));
    assert.strictEqual(s.ok, false); assert.strictEqual(s.reason, 'course');
    const off = Nube.create({ enabled: false, getClient: () => null });
    assert.strictEqual((await off.boot({})).reason, 'off');
  });
  await test('primer dispositivo: guarda el avance local en la cuenta (version 1)', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const d = await device(db, H.U.a);
    const local = { v: 1, lessons: { 'am-is-are': { done: true, doneAt: 5, firstOk: 6, total: 8 } }, days: ['2026-10-25'] };
    const b = await d.n.boot(local);
    assert.deepStrictEqual([b.ok, b.changed, b.hadRemote], [true, true, false]);
    const s = await d.n.save(() => b.state);
    assert.strictEqual(s.ok, true); assert.strictEqual(d.n.version, 1);
    const row = (await q(db, 'select state, version from public.academia_progress'))[0];
    assert.strictEqual(row.version, 1); assert(row.state.lessons['am-is-are'].done);
  });
  await test('segundo dispositivo: ve lo del primero, suma lo suyo y los dos terminan iguales (sin perder nada)', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const A = await device(db, H.U.a), B = await device(db, H.U.a);
    const a0 = await A.n.boot({}); let stA = Nube.mergeStates(a0.state, { lessons: { 'am-is-are': { done: true, doneAt: 1, firstOk: 7, total: 8 } }, days: ['2026-10-24'] });
    await A.n.save(() => stA);
    const b0 = await B.n.boot({ lessons: { afirmaciones: { done: true, doneAt: 2, firstOk: 5, total: 8 } }, days: ['2026-10-25'], resume: { negaciones: { lessonId: 'negaciones', stage: 'learn', idx: 2, at: 50 } } });
    assert.strictEqual(b0.hadRemote, true);
    assert.deepStrictEqual(Object.keys(b0.state.lessons).sort(), ['afirmaciones', 'am-is-are']);
    assert(b0.state.resume.negaciones);
    let stB = b0.state;
    const sb = await B.n.save(() => stB); assert.strictEqual(sb.ok, true);
    // A guarda de nuevo con la version vieja: conflicto, fusiona y reintenta
    let stA2 = Nube.mergeStates(stA, { days: ['2026-10-26'], lessons: { 'am-is-are': stA.lessons['am-is-are'] } });
    const sa = await A.n.save(() => stA2, merged => { stA2 = merged; });
    assert.strictEqual(sa.ok, true, JSON.stringify(sa));
    const final = (await q(db, 'select state from public.academia_progress'))[0].state;
    assert.deepStrictEqual(Object.keys(final.lessons).sort(), ['afirmaciones', 'am-is-are']);
    assert.deepStrictEqual(final.days, ['2026-10-24', '2026-10-25', '2026-10-26']);
    assert(final.resume.negaciones, 'el progreso a mitad de leccion del otro dispositivo sobrevive');
  });
  await test('"continua donde estabas" entre dispositivos: la leccion a medias del telefono aparece en la compu', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const phone = await device(db, H.U.a), pc = await device(db, H.U.a);
    const p0 = await phone.n.boot({});
    const mid = { v: 1, resume: { preguntas: { lessonId: 'preguntas', stage: 'practice', queue: [['l4-a5', 1], ['l4-a6', 1]], firstOk: 3, shown: 4, missedNow: ['l4-a2'], at: 99, t0: 90 } }, last: 'preguntas' };
    await phone.n.save(() => Nube.mergeStates(p0.state, mid));
    const c = await pc.n.boot({});
    assert.strictEqual(c.state.last, 'preguntas');
    assert.deepStrictEqual(c.state.resume.preguntas.queue, [['l4-a5', 1], ['l4-a6', 1]]);
    assert.strictEqual(c.state.resume.preguntas.shown, 4);
  });
  await test('sin red: no pierde nada, queda pendiente y se guarda cuando vuelve', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const net = { down: false };
    const d = await device(db, H.U.a, net);
    const b = await d.n.boot({});
    net.down = true;
    const st = { v: 1, lessons: { 'am-is-are': { done: true, doneAt: 3, firstOk: 8, total: 8 } } };
    const r = await d.n.save(() => st);
    assert.deepStrictEqual([r.ok, r.reason, d.n.dirty, d.n.online], [false, 'net', true, false]);
    assert.strictEqual((await q(db, 'select count(*)::int n from public.academia_progress'))[0].n, 0);
    net.down = false;
    const r2 = await d.n.save(() => st);
    assert.strictEqual(r2.ok, true); assert.strictEqual(d.n.online, true);
    assert((await q(db, 'select state from public.academia_progress'))[0].state.lessons['am-is-are']);
  });
  await test('errores de las actividades -> el MISMO motor (mistake_stats), mismos umbrales: 2 aciertos recupera, 4 domina, un fallo reactiva', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const d = await device(db, H.U.a); await d.n.boot({});
    const st = id => q(db, "select status, fail_count, correct_streak, kind, topic from public.mistake_stats where user_id = $1 and item_id = $2", [H.U.a, id]);
    d.n.recordAnswer('l3-a1', false); d.n.recordAnswer('l3-a2', true);   // el acierto sin fallo previo no crea fila
    assert.strictEqual((await d.n.flushMistakes()).n, 2);
    let r = await st('ac:to-be:l3-a1');
    assert.deepStrictEqual(r[0], { status: 'active', fail_count: 1, correct_streak: 0, kind: 'academia', topic: 'Verbo "to be": am / is / are' });
    assert.strictEqual((await st('ac:to-be:l3-a2')).length, 0);
    d.n.recordAnswer('l3-a1', true); d.n.recordAnswer('l3-a1', true); await d.n.flushMistakes();
    assert.strictEqual((await st('ac:to-be:l3-a1'))[0].status, 'recovered');
    d.n.recordAnswer('l3-a1', true); d.n.recordAnswer('l3-a1', true); await d.n.flushMistakes();
    assert.strictEqual((await st('ac:to-be:l3-a1'))[0].status, 'mastered');
    d.n.recordAnswer('l3-a1', false); await d.n.flushMistakes();
    r = await st('ac:to-be:l3-a1'); assert.deepStrictEqual([r[0].status, r[0].fail_count, r[0].correct_streak], ['active', 2, 0]);
  });
  await test('errores sin red se guardan en memoria y se reenvian (no se pierden ni se duplican)', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const net = {}; const d = await device(db, H.U.a, net); await d.n.boot({});
    d.n.recordAnswer('l1-a1', false); net.down = true;
    assert.strictEqual((await d.n.flushMistakes()).ok, false); assert.strictEqual(d.n.pendingMistakes, 1);
    net.down = false;
    assert.strictEqual((await d.n.flushMistakes()).ok, true); assert.strictEqual(d.n.pendingMistakes, 0);
    assert.strictEqual((await q(db, "select fail_count from public.mistake_stats where item_id = 'ac:to-be:l1-a1'"))[0].fail_count, 1);
  });
  await test('una leccion terminada = UNA sesion normal (skill gramatica, tema real, ids ac:) para racha y diagnostico', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const d = await device(db, H.U.a, null, { now: () => new Date(2026, 9, 25, 18, 0, 0).getTime() }); await d.n.boot({});
    const t0 = new Date(2026, 9, 25, 17, 50, 0).getTime();
    const r = await d.n.recordLesson({ n: 3 }, [{ id: 'l3-a1', ok: true }, { id: 'l3-a2', ok: false }, { id: 'l3-a3', ok: true }], t0);
    assert.strictEqual(r.ok, true);
    const rows = (await db.query('select skill, level, date, duration_ms, topics, results from public.progress_sessions')).rows;
    assert.strictEqual(rows.length, 1);
    const s = rows[0];
    assert.deepStrictEqual([s.skill, s.level, s.duration_ms, s.topics], ['gramatica', 'facil', 600000, ['Verbo "to be": am / is / are']]);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(s.results)), [{ itemId: 'ac:to-be:l3-a1', isCorrect: true }, { itemId: 'ac:to-be:l3-a2', isCorrect: false }, { itemId: 'ac:to-be:l3-a3', isCorrect: true }]);
  });
  await test('evaluacion oficial por el cliente: empieza, entrega sin respuestas, envia, califica el servidor y da insignia', async()=>{
    const db = await H.freshDb(PGlite, exam);
    await db.exec(`update public.academia_courses set exam_size = 6, per_topic = 3, pass_pct = 80`);
    const d = await device(db, H.U.a); await d.n.boot({});
    const stt = await d.n.examStatus(); assert.deepStrictEqual([stt.ok, stt.pass_pct, stt.attempts_left, stt.can_take, stt.badge], [true, 80, 3, true, null]);
    const s = await d.n.examStart();
    assert.strictEqual(s.items.length, 6);
    assert(!/correct|accepted|why|por que/.test(JSON.stringify(s)));
    const bad = {}; s.items.forEach(i => bad[i.id] = 'zzz');
    const r1 = await d.n.examSubmit(s.attempt_id, bad);
    assert.deepStrictEqual([r1.ok, r1.score_pct, r1.passed], [true, 0, false]);
    assert.strictEqual(await d.n.badge(), null);
    const s2 = await d.n.examStart();
    const good = {}; s2.items.forEach(i => good[i.id] = i.type === 'choice' ? 'a' : i.type === 'type' ? 'is' : ['Is', 'she']);
    const r2 = await d.n.examSubmit(s2.attempt_id, good);
    assert.deepStrictEqual([r2.score_pct, r2.passed], [100, true]);
    const b = await d.n.badge(); assert.strictEqual(b.score_pct, 100);
    assert.strictEqual((await d.n.examSubmit(s2.attempt_id, good)).error, 'already_submitted');
    // los errores del examen quedaron en el motor
    assert((await q(db, "select count(*)::int n from public.mistake_stats where item_id like 'ac:to-be:e-%'"))[0].n >= 1);
  });
  await test('un usuario NO puede darse la insignia ni mover su nota desde el cliente (sin RPC ni inserts directos)', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const d = await device(db, H.U.a); await d.n.boot({});
    const c = d.client;
    const ins = async sql => { let e = null; try{ await H.asUser(db, H.U.a, () => db.exec(sql)); }catch(x){ e = x; } return e; };
    assert(await ins(`insert into public.academia_badges (user_id, course_id, score_pct) values ('${H.U.a}', 'to-be', 100)`));
    assert(await ins(`update public.academia_exam_attempts set score_pct = 100, passed = true`));
    assert(await ins(`select answer from public.academia_exam_items`));
    assert((await c.rpc('academia_exam_submit', { p_attempt: '00000000-0000-4000-8000-000000000000', p_answers: {} })).data.error === 'attempt');
    assert.strictEqual(await d.n.badge(), null);
  });
  await test('aislamiento entre cuentas: B no ve el avance, los errores ni la insignia de A', async()=>{
    const db = await H.freshDb(PGlite, exam);
    const A = await device(db, H.U.a); await A.n.boot({}); await A.n.save(() => ({ v: 1, lessons: { x: { done: true } } }));
    const B = await device(db, H.U.b);
    const b = await B.n.boot({});
    assert.strictEqual(b.hadRemote, false); assert.deepStrictEqual(b.state.lessons, {});
  });
}

/* ---------------- D. motor adaptativo (app.js real) ---------------- */
function makeEngine(enabled){
  const store = {}; const noop = () => {};
  const fakeEl = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, setAttribute: noop, appendChild: noop, addEventListener: noop });
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, readyState: 'complete', body: fakeEl(), documentElement: fakeEl(), createElement: fakeEl },
    location: { hash: '', search: '', pathname: '/progreso.html' }, navigator: { userAgent: 'node' }, addEventListener: noop,
    MutationObserver: function(){ return { observe: noop }; }, IntersectionObserver: function(){ return { observe: noop }; }, matchMedia: () => ({ matches: false, addEventListener: noop })
  };
  ctx.window = ctx; vm.createContext(ctx);
  ['data.js', 'temas.js'].forEach(f => vm.runInContext(read(f), ctx));
  if(enabled !== null){ vm.runInContext(read('academia-motor.js') + ';this.ACADEMIA_MOTOR = ACADEMIA_MOTOR;', ctx); ctx.ACADEMIA_MOTOR.enabled = !!enabled; }
  vm.runInContext(read('app.js') + `
;this.__t = { computeDiagnosis, PROGRESS_KEY, diagActionBodyHtml, getDiagItemIndex, getMistakesItemIndex, buildMistakePool, computeSkillCoverage, loadProgress, diagFamilyForTopic, computeMistakeIds, G:GRAMMAR_BANK };`, ctx);
  return { ctx, T: ctx.__t, store };
}
async function partD(){
  console.log('D. Motor adaptativo (diagnóstico y recomendaciones)');
  const DAY = 86400000, NOW = Date.now();
  const ds = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function scenario(E){
    const T = E.T, ids = [];
    Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g => { const f = T.diagFamilyForTopic(g.topic); if(f && f.id === 'to-be') g.items.forEach(i => { if(i.id.indexOf('-m500-') === -1) ids.push(i.id); }); })));
    const sess = (d, res) => ({ skill: 'gramatica', level: 'facil', topics: [], date: ds(NOW - d * DAY), startedAt: NOW - d * DAY, durationMs: 240000, results: res });
    const ac = []; for(let i = 1; i <= 8; i++) ac.push({ itemId: 'ac:to-be:l3-a' + i, isCorrect: i > 5 });
    E.store[T.PROGRESS_KEY] = JSON.stringify({ sessions: [sess(3, ids.slice(0, 10).map((id, i) => ({ itemId: id, isCorrect: i % 2 === 0 }))), sess(2, ids.slice(0, 10).map((id, i) => ({ itemId: id, isCorrect: i % 3 === 0 }))), sess(1, ac)], lastActivity: null });
    const stats = new Map();
    ['l3-a1', 'l3-a2', 'l3-a3', 'l2-a1'].forEach(a => stats.set('ac:to-be:' + a, { item_id: 'ac:to-be:' + a, kind: 'academia', topic: 'Verbo "to be": am / is / are', status: 'active', fail_count: 2, correct_streak: 0, last_seen_at: new Date().toISOString() }));
    return stats;
  }
  await test('encendido: los errores de la academia cuentan en el diagnostico y la accion del tema ofrece la leccion exacta con "volver"', async()=>{
    const E = makeEngine(true); const stats = scenario(E);
    const d = E.T.computeDiagnosis(undefined, stats);
    assert.strictEqual(d.ready, true); assert.strictEqual(d.activeMistakes, 4);
    const a = d.actions.find(x => x.tema === 'to-be-presente');
    assert(a, 'debe haber accion del tema to be: ' + JSON.stringify(d.actions.map(x => x.title)));
    assert.strictEqual(a.course.lesson, 3);   // 3 de los 4 errores activos son de la leccion 3
    assert.strictEqual(a.course.href, 'academia.html#/curso/to-be/leccion/3?volver=progreso.html');
    assert(/Repasar la lección 3 del curso TO BE/.test(E.T.diagActionBodyHtml(a)));
    assert(/href="academia\.html#\/curso\/to-be\/leccion\/3\?volver=progreso\.html"/.test(E.T.diagActionBodyHtml(a)));
  });
  await test('apagado (o sin academia-motor.js): el diagnostico es IDENTICO al de antes y ningun enlace a la academia aparece', async()=>{
    const off = makeEngine(false), none = makeEngine(null), on = makeEngine(true);
    const so = scenario(off), sn = scenario(none), sy = scenario(on);
    const jo = JSON.stringify(off.T.computeDiagnosis(undefined, so)), jn = JSON.stringify(none.T.computeDiagnosis(undefined, sn));
    assert.strictEqual(jo, jn, 'apagado debe ser igual a "no existe el puente"');
    assert(!/academia/.test(jo));
    assert(/"activeMistakes":0/.test(jo), 'apagado: los ids ac: se ignoran');
    assert.notStrictEqual(JSON.stringify(on.T.computeDiagnosis(undefined, sy)), jo);
  });
  await test('un alumno SIN datos de academia recibe exactamente el mismo diagnostico con el puente encendido', async()=>{
    const on = makeEngine(true), none = makeEngine(null);
    [on, none].forEach(E => {
      const ids = []; Object.keys(E.T.G).forEach(l => E.T.G[l].forEach(v => v.forEach(g => { const f = E.T.diagFamilyForTopic(g.topic); if(f && f.id === 'to-be') g.items.forEach(i => ids.push(i.id)); })));
      E.store[E.T.PROGRESS_KEY] = JSON.stringify({ sessions: [1, 2, 3].map(d => ({ skill: 'gramatica', level: 'facil', topics: [], date: ds(NOW - d * DAY), startedAt: NOW - d * DAY, durationMs: 1000, results: ids.slice(0, 10).map((id, i) => ({ itemId: id, isCorrect: (i + d) % 2 === 0 })) })), lastActivity: null });
    });
    const strip = d => JSON.stringify(d, (k, v) => k === 'course' ? undefined : v);
    assert.strictEqual(strip(on.T.computeDiagnosis(undefined, null)), strip(none.T.computeDiagnosis(undefined, null)));
  });
  await test('los repasos del sitio nunca reciben actividades de academia (no hay forma de reproducirlas) ni se rompen', async()=>{
    const E = makeEngine(true); scenario(E);
    const idx = E.T.getMistakesItemIndex();
    assert(![...idx.keys()].some(k => k.indexOf('ac:') === 0), 'getMistakesItemIndex no debe traer ids de academia');
    const pool = E.T.buildMistakePool(50);
    assert(pool.every(p => p.item && p.item.id && String(p.item.id).indexOf('ac:') !== 0));
    assert(E.T.computeMistakeIds().some(id => id.indexOf('ac:') === 0), 'los ids sí estan en el historial (diagnostico) pero el pool los salta');
  });
  await test('la cobertura de gramatica no se infla con ids de academia', async()=>{
    const on = makeEngine(true), none = makeEngine(null);
    scenario(on);
    const cov = on.T.computeSkillCoverage(on.T.loadProgress(), 'gramatica');
    const p = on.T.loadProgress();
    p.sessions = p.sessions.filter(s => !s.results.some(r => r.itemId.indexOf('ac:') === 0));
    assert.strictEqual(cov, on.T.computeSkillCoverage(p, 'gramatica'));
  });
  await test('academia-motor: linkForTema sin errores lleva al curso; con errores a la leccion con mas fallos; empate: la menor', async()=>{
    const M = vm.runInNewContext(read('academia-motor.js') + ';ACADEMIA_MOTOR'); M.enabled = true;
    assert.strictEqual(M.linkForTema('to-be-presente', [], null).href, 'academia.html#/curso/to-be');
    assert.strictEqual(M.linkForTema('to-be-presente', ['ac:to-be:l4-a1', 'ac:to-be:l2-a1'], null).lesson, 2);
    assert.strictEqual(M.linkForTema('to-be-presente', ['ac:to-be:e-n3', 'ac:to-be:e-n2', 'ac:to-be:l2-a1'], null).lesson, 3, 'los ids del examen oficial cuentan para su leccion');
    assert.strictEqual(M.linkForTema('presente-simple', ['ac:to-be:l2-a1'], null), null, 'otro tema: sin enlace');
    assert.strictEqual(M.linkForTema('to-be-presente', ['ac:otro:l2-a1', 'basura'], null).lesson, null);
  });
}

(async()=>{
  const PGlite = await H.loadPglite();
  await partA(); await partB(); await partC(PGlite); await partD();
  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
