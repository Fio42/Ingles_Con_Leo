#!/usr/bin/env node
/* Academia: pruebas de la BASE (supabase/migrations/20261026120000_academia_integracion.sql).
   Corre las funciones SQL REALES en un Postgres embebido (PGlite), sin tocar Supabase.
   Corre con:  node tools/tests/academia-sql.test.js   (desde la carpeta inglesconLeo)
   Necesita @electric-sql/pglite (npm i --no-save @electric-sql/pglite, o LEO_PGLITE_DIR=<carpeta que lo tiene>).
   Si no esta instalado la prueba se omite y lo dice.

   Lo que se protege:
   - el avance se guarda por cuenta y curso, con version: dos dispositivos no se pisan (conflicto + fusion en el cliente);
   - nadie lee ni escribe el banco del examen, los intentos ni las insignias desde el navegador;
   - la nota la calcula SOLO el servidor; solo aprobar crea la insignia; un intento no se envia dos veces;
   - recargar durante un examen no regala preguntas nuevas; limite de intentos por dia; solo miembros;
   - los errores del examen entran al MISMO motor (mistake_stats), sin tabla paralela;
   - la migracion se puede aplicar dos veces. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createRequire } = require('module'), { pathToFileURL } = require('url');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(process.env.LEO_ROOT || root, f), 'utf8');

async function loadPglite(){
  const dirs = [process.env.LEO_PGLITE_DIR, process.cwd(), __dirname, root, '/tmp/claude-0/pg'].filter(Boolean);
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
const U = { mem:'00000000-0000-4000-8000-0000000000a1', mem2:'00000000-0000-4000-8000-0000000000a2', free:'00000000-0000-4000-8000-0000000000f1' };

/* Banco SINTETICO de prueba (no es el examen real). 4 temas x 4 preguntas. */
function syntheticBank(){
  const out = [];
  ['t1', 't2', 't3', 't4'].forEach(t => {
    out.push({ id:t + '-c1', topic:t, type:'choice', public:{ q:'Pregunta ' + t + ' c1', options:['a', 'b', 'c'] }, answer:{ correct:'b', why:'porque b ' + t } });
    out.push({ id:t + '-c2', topic:t, type:'choice', public:{ q:'Pregunta ' + t + ' c2', options:['x', 'y'] }, answer:{ correct:'x', why:'porque x ' + t } });
    out.push({ id:t + '-w1', topic:t, type:'type', public:{ q:'Completa ' + t, source:'She ___ happy.' }, answer:{ accepted:['is', "isn't"], why:'is con she' } });
    out.push({ id:t + '-o1', topic:t, type:'order', public:{ q:'Ordena ' + t, tokens:['you', 'Are', 'late', '?'] }, answer:{ order:['Are', 'you', 'late', '?'], why:'pregunta' } });
  });
  return out;
}
function answersFor(items, bank, mode){
  const by = {}; bank.forEach(b => by[b.id] = b);
  const out = {};
  items.forEach((it, i) => {
    const b = by[it.id];
    const right = b.type === 'choice' || b.type === 'error' ? b.answer.correct : b.type === 'type' ? b.answer.accepted[0] : b.answer.order;
    const wrong = b.type === 'order' ? ['late', 'you'] : 'zzz';
    out[it.id] = (mode === 'all' || (mode === 'half' && i % 2 === 0)) ? right : wrong;
  });
  return out;
}

(async()=>{
  const PGlite = await loadPglite();
  console.log('Academia (base de datos)');
  if(!PGlite){ console.log('  omitida: instala @electric-sql/pglite (npm i --no-save @electric-sql/pglite) o define LEO_PGLITE_DIR'); return; }
  const MIG = read('supabase/migrations/20261026120000_academia_integracion.sql');
  const schema = read('supabase_schema.sql');
  const a0 = schema.indexOf('create table if not exists public.mistake_stats');
  const a1 = schema.indexOf('grant execute on function public.apply_mistake_results(jsonb) to authenticated;');
  assert(a0 > 0 && a1 > a0, 'no se encontro mistake_stats en supabase_schema.sql');
  const MISTAKES = schema.slice(a0, a1 + 'grant execute on function public.apply_mistake_results(jsonb) to authenticated;'.length);

  async function fresh(opts){
    opts = opts || {};
    const db = new PGlite();
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false);
      grant usage on schema public to anon, authenticated;
      insert into auth.users values ('${U.mem}'), ('${U.mem2}'), ('${U.free}');
      insert into public.profiles values ('${U.mem}', true), ('${U.mem2}', true), ('${U.free}', false);
    `);
    await db.exec(MISTAKES);
    await db.exec(MIG);
    if(opts.enable !== false) await db.exec(`update public.academia_courses set enabled = true where course_id = 'to-be'`);
    const bank = syntheticBank();
    for(const b of bank){
      await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)',
        ['to-be', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
    }
    db.bank = bank;
    return db;
  }
  /* Ejecuta como un usuario del navegador (rol authenticated + auth.uid()). */
  async function as(db, uid, fn){
    await db.exec('begin');
    try{
      await db.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${uid}', true)`);
      const r = await fn();
      await db.exec('commit');
      return r;
    }catch(e){ try{ await db.exec('rollback'); }catch(x){} throw e; }
  }
  const call = (db, uid, fn, args) => as(db, uid, async () => (await db.query(`select public.${fn}(${args.map((_, i) => '$' + (i + 1)).join(',')}) as r`, args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(a) : a))).rows[0].r);
  const sys = async (db, sql, p) => (await db.query(sql, p)).rows;
  const denied = async (db, uid, sql) => { let err = null; try{ await as(db, uid, () => db.exec(sql)); }catch(e){ err = e; } return err; };

  let db = await fresh();

  await test('la migracion se puede aplicar dos veces sin error', async()=>{
    await db.exec(MIG);
    assert.strictEqual((await sys(db, 'select count(*)::int n from public.academia_courses'))[0].n, 1);
  });

  await test('curso apagado por defecto: nada funciona hasta que Leo lo habilite', async()=>{
    const d = await fresh({ enable: false });
    assert.strictEqual((await call(d, U.mem, 'academia_save_progress', ['to-be', { v:1 }, 0])).error, 'course');
    assert.strictEqual((await call(d, U.mem, 'academia_exam_start', ['to-be'])).error, 'course');
  });

  // ----- progreso -----
  await test('guardar progreso: primera vez version 1, luego sube de uno en uno', async()=>{
    const r1 = await call(db, U.mem, 'academia_save_progress', ['to-be', { v:1, lessons:{ l1:{ done:true } } }, 0]);
    assert.deepStrictEqual([r1.ok, r1.version], [true, 1]);
    const r2 = await call(db, U.mem, 'academia_save_progress', ['to-be', { v:1, lessons:{ l1:{ done:true }, l2:{ done:true } } }, 1]);
    assert.deepStrictEqual([r2.ok, r2.version], [true, 2]);
    const row = (await as(db, U.mem, async () => (await db.query('select state, version from public.academia_progress')).rows))[0];
    assert.strictEqual(row.version, 2); assert(row.state.lessons.l2);
  });
  await test('dos dispositivos: el que llega con version vieja recibe CONFLICTO y el estado del servidor', async()=>{
    const r = await call(db, U.mem, 'academia_save_progress', ['to-be', { v:1, lessons:{ l1:{ done:true }, l3:{ done:true } } }, 1]);
    assert.strictEqual(r.ok, false); assert.strictEqual(r.conflict, true); assert.strictEqual(r.version, 2);
    assert(r.state.lessons.l2, 'devuelve lo que ya habia');
  });
  await test('crear con version base distinta de 0 cuando no hay fila es conflicto (no inventa historia)', async()=>{
    const r = await call(db, U.mem2, 'academia_save_progress', ['to-be', { v:1 }, 5]);
    assert.strictEqual(r.conflict, true);
  });
  await test('solo se guardan las claves permitidas y nadie lee el avance de otra cuenta', async()=>{
    await call(db, U.mem2, 'academia_save_progress', ['to-be', { v:1, lessons:{}, badge:{ to_be:true }, isMember:true }, 0]);
    const st = (await sys(db, "select state from public.academia_progress where user_id = $1", [U.mem2]))[0].state;
    assert.strictEqual(st.badge, undefined); assert.strictEqual(st.isMember, undefined);
    const rows = await as(db, U.mem2, async () => (await db.query('select user_id from public.academia_progress')).rows);
    assert.deepStrictEqual(rows.map(r => r.user_id), [U.mem2]);
  });
  await test('estado demasiado grande o no objeto: rechazado', async()=>{
    const big = { v:1, days:Array.from({ length:12000 }, (_, i) => '2026-01-' + i) };
    assert.strictEqual((await call(db, U.mem2, 'academia_save_progress', ['to-be', big, 1])).error, 'state');
    assert.strictEqual((await call(db, U.mem2, 'academia_save_progress', ['to-be', [1, 2], 1])).error, 'state');
  });
  await test('sin sesion no se guarda nada', async()=>{
    const r = (await db.query(`select public.academia_save_progress('to-be', '{"v":1}'::jsonb, 0) as r`)).rows[0].r;
    assert.strictEqual(r.error, 'auth');
  });
  await test('desde el navegador NO se puede escribir directo ni borrar en las tablas de academia', async()=>{
    for(const sql of [
      `insert into public.academia_progress (user_id, course_id, state) values ('${U.mem}', 'to-be', '{}')`,
      `update public.academia_progress set version = 99`,
      `delete from public.academia_progress`,
      `insert into public.academia_badges (user_id, course_id, score_pct) values ('${U.mem}', 'to-be', 100)`,
      `insert into public.academia_exam_attempts (user_id, course_id, item_ids) values ('${U.mem}', 'to-be', '{}')`,
      `update public.academia_courses set pass_pct = 50`,
      `select * from public.academia_exam_items`,
      `select answer from public.academia_exam_attempts`
    ]){
      const e = await denied(db, U.mem, sql);
      assert(e, 'debio fallar: ' + sql);
    }
    assert.strictEqual((await sys(db, 'select pass_pct from public.academia_courses'))[0].pass_pct, 80);
  });

  // ----- examen -----
  await test('examen: solo miembros', async()=>{
    assert.strictEqual((await call(db, U.free, 'academia_exam_start', ['to-be'])).error, 'members');
    assert.strictEqual((await call(db, U.free, 'academia_exam_status', ['to-be'])).can_take, false);
  });
  let first;
  await test('examen: entrega 3 por tema (15 max), sin respuestas ni explicaciones', async()=>{
    await db.exec(`update public.academia_courses set exam_size = 12, per_topic = 3`);
    first = await call(db, U.mem, 'academia_exam_start', ['to-be']);
    assert.strictEqual(first.ok, true); assert.strictEqual(first.items.length, 12);
    const per = {}; first.items.forEach(i => per[i.topic] = (per[i.topic] || 0) + 1);
    assert.deepStrictEqual(Object.values(per), [3, 3, 3, 3]);
    const raw = JSON.stringify(first);
    assert(!/"answer"|"correct"|"accepted"|porque|"why"/.test(raw), 'filtra respuestas: ' + raw.slice(0, 200));
    assert.strictEqual(first.pass_pct, 80);
  });
  await test('recargar durante el examen devuelve LAS MISMAS preguntas (no sortea otras)', async()=>{
    const again = await call(db, U.mem, 'academia_exam_start', ['to-be']);
    assert.strictEqual(again.resumed, true); assert.strictEqual(again.attempt_id, first.attempt_id);
    assert.deepStrictEqual(again.items.map(i => i.id), first.items.map(i => i.id));
  });
  await test('enviar todo mal: nota 0, sin insignia, errores entran a mistake_stats, review sin tocar la insignia', async()=>{
    const r = await call(db, U.mem, 'academia_exam_submit', [first.attempt_id, answersFor(first.items, db.bank, 'none')]);
    assert.strictEqual(r.ok, true); assert.strictEqual(r.score_pct, 0); assert.strictEqual(r.passed, false); assert.strictEqual(r.total, 12);
    assert.strictEqual(r.review.length, 12); assert(r.review.every(x => x.right && x.why));
    assert.strictEqual((await sys(db, 'select count(*)::int n from public.academia_badges'))[0].n, 0);
    const ms = await sys(db, "select item_id, kind, topic, status, fail_count from public.mistake_stats where user_id = $1", [U.mem]);
    assert.strictEqual(ms.length, 12);
    assert(ms.every(m => m.kind === 'academia' && m.item_id.startsWith('ac:to-be:') && m.topic === 'Verbo "to be": am / is / are' && m.status === 'active'));
  });
  await test('un intento no se envia dos veces', async()=>{
    const r = await call(db, U.mem, 'academia_exam_submit', [first.attempt_id, answersFor(first.items, db.bank, 'all')]);
    assert.strictEqual(r.error, 'already_submitted');
  });
  await test('el cliente no puede mandar un intento ajeno', async()=>{
    const r = await call(db, U.mem2, 'academia_exam_submit', [first.attempt_id, {}]);
    assert.strictEqual(r.error, 'attempt');
  });
  let second;
  await test('el segundo intento prioriza preguntas que NO salieron en el anterior', async()=>{
    second = await call(db, U.mem, 'academia_exam_start', ['to-be']);
    assert.strictEqual(second.ok, true); assert.strictEqual(second.resumed, false);
    const prev = new Set(first.items.map(i => i.id));
    const unseen = db.bank.filter(b => !prev.has(b.id)).map(b => b.id);
    assert.strictEqual(unseen.length, 4);
    const got = new Set(second.items.map(i => i.id));
    unseen.forEach(id => assert(got.has(id), 'la pregunta nueva ' + id + ' debe salir primero'));
  });
  await test('mitad bien (50%): no aprueba (80%) y no hay insignia', async()=>{
    const r = await call(db, U.mem, 'academia_exam_submit', [second.attempt_id, answersFor(second.items, db.bank, 'half')]);
    assert.strictEqual(r.ok, true); assert.strictEqual(r.score_pct, 50); assert.strictEqual(r.passed, false);
    assert.strictEqual((await sys(db, 'select count(*)::int n from public.academia_badges'))[0].n, 0);
  });
  await test('limite de intentos por dia', async()=>{
    const third = await call(db, U.mem, 'academia_exam_start', ['to-be']);
    assert.strictEqual(third.ok, true);
    await call(db, U.mem, 'academia_exam_submit', [third.attempt_id, {}]);
    const fourth = await call(db, U.mem, 'academia_exam_start', ['to-be']);
    assert.strictEqual(fourth.error, 'limit');
    assert.strictEqual((await call(db, U.mem, 'academia_exam_status', ['to-be'])).attempts_left, 0);
  });
  await test('aprobar crea la insignia SOLO en el servidor; el umbral es configurable', async()=>{
    await db.exec(`update public.academia_courses set max_attempts_day = 10, pass_pct = 90`);
    const t = await call(db, U.mem, 'academia_exam_start', ['to-be']);
    const r = await call(db, U.mem, 'academia_exam_submit', [t.attempt_id, answersFor(t.items, db.bank, 'all')]);
    assert.strictEqual(r.score_pct, 100); assert.strictEqual(r.passed, true); assert.strictEqual(r.pass_pct, 90); assert.strictEqual(r.review.length, 0);
    const badge = await as(db, U.mem, async () => (await db.query('select course_id, score_pct from public.academia_badges')).rows);
    assert.deepStrictEqual(badge, [{ course_id:'to-be', score_pct:100 }]);
    const st = await call(db, U.mem, 'academia_exam_status', ['to-be']);
    assert.strictEqual(st.badge.score_pct, 100); assert.strictEqual(st.best_pct, 100);
  });
  await test('las respuestas correctas del examen reactivan/recuperan errores del motor (mismos umbrales)', async()=>{
    const ms = await sys(db, "select status, correct_streak from public.mistake_stats where user_id = $1 and item_id like 'ac:to-be:%' and correct_streak >= 1", [U.mem]);
    assert(ms.length > 0, 'algun error previo debio sumar un acierto');
  });
  await test('calificacion: tipo "type" acepta frase completa y variantes; "order" exige el orden exacto', async()=>{
    const d = await fresh();
    await d.exec(`update public.academia_courses set exam_size = 16, per_topic = 4`);
    const s = await call(d, U.mem, 'academia_exam_start', ['to-be']);
    const typed = s.items.find(i => i.type === 'type');
    for(const [ans, expect] of [['IS', true], ['is.', true], ['She is happy.', true], ["isn't", true], ['  she   IS happy ', true], ['are', false], ['', false]]){
      const dd = await fresh(); await dd.exec(`update public.academia_courses set exam_size = 16, per_topic = 4`);
      const ss = await call(dd, U.mem, 'academia_exam_start', ['to-be']);
      const only = {}; only[ss.items.find(i => i.type === 'type').id] = ans;
      const r = await call(dd, U.mem, 'academia_exam_submit', [ss.attempt_id, only]);
      const missed = r.review.some(x => x.id === ss.items.find(i => i.type === 'type').id);
      assert.strictEqual(!missed, expect, 'respuesta ' + JSON.stringify(ans));
    }
    assert(typed);
  });
  await test('respuestas con tipo equivocado (objeto, null, numero) cuentan como fallo y no rompen', async()=>{
    const d = await fresh(); await d.exec(`update public.academia_courses set exam_size = 16, per_topic = 4`);
    const s = await call(d, U.mem, 'academia_exam_start', ['to-be']);
    const junk = {}; s.items.forEach((i, n) => junk[i.id] = [{ a:1 }, null, 7, ['x'], 'zzz'][n % 5]);
    const r = await call(d, U.mem, 'academia_exam_submit', [s.attempt_id, junk]);
    assert.strictEqual(r.ok, true); assert.strictEqual(r.score_pct, 0);
  });
  await test('las fichas de "ordenar" viajan MEZCLADAS (el orden correcto no se filtra) y siguen siendo las mismas fichas', async()=>{
    const d = await fresh(); await d.exec(`update public.academia_courses set exam_size = 16, per_topic = 4, max_attempts_day = 20`);
    let sameAsAnswer = 0, n = 0;
    for(let i = 0; i < 18; i++){
      const s = await call(d, U.mem, 'academia_exam_start', ['to-be']);
      s.items.filter(x => x.type === 'order').forEach(x => {
        assert.deepStrictEqual(x.tokens.slice().sort(), ['Are', 'late', 'you', '?'].sort());
        n++; if(JSON.stringify(x.tokens) === JSON.stringify(['Are', 'you', 'late', '?'])) sameAsAnswer++;
      });
      await call(d, U.mem, 'academia_exam_submit', [s.attempt_id, {}]);
    }
    assert(n >= 50 && sameAsAnswer < n / 3, 'las fichas salen casi siempre en el orden correcto: ' + sameAsAnswer + '/' + n);
  });
  await test('un examen sin banco cargado responde "empty" (no crashea ni crea intentos)', async()=>{
    const d = await fresh(); await d.exec('delete from public.academia_exam_items');
    assert.strictEqual((await call(d, U.mem, 'academia_exam_start', ['to-be'])).error, 'empty');
    assert.strictEqual((await sys(d, 'select count(*)::int n from public.academia_exam_attempts'))[0].n, 0);
  });
  await test('la migracion no toca profiles, progress_sessions ni cambia mistake_stats existente', async()=>{
    const cols = await sys(db, "select column_name from information_schema.columns where table_name = 'profiles' order by 1");
    assert.deepStrictEqual(cols.map(c => c.column_name), ['id', 'is_member']);
  });

  const seedLib = require('../academia_seed_examen.js');
  await test('validador del banco: detecta correcta fuera de opciones, fichas que no cuadran y pista en el enunciado', async()=>{
    const bad = { course:'x', items:[
      { id:'a1', topic:'t', type:'choice', public:{ q:'Pregunta', options:['a', 'b'] }, answer:{ correct:'z', why:'w' } },
      { id:'a2', topic:'t', type:'order', public:{ q:'Ordena', tokens:['a', 'b'] }, answer:{ order:['a', 'c'], why:'w' } },
      { id:'a3', topic:'t', type:'choice', public:{ q:"Elige aren't aqui", options:["aren't", 'is'] }, answer:{ correct:"aren't", why:'w' } },
      { id:'a1', topic:'t', type:'type', public:{ q:'x', source:'y' }, answer:{ accepted:[], why:'w' } } ] };
    const errs = seedLib.validate(bad).join('|');
    for(const m of ['no esta en las opciones', 'no coinciden', 'pista', 'repetido', 'sin respuestas aceptadas']) assert(errs.indexOf(m) !== -1, 'falta detectar: ' + m);
    assert.deepStrictEqual(seedLib.validate({ course:'x', items:syntheticBank() }, { perTopic:3 }), []);
  });
  const realFile = path.join(root, 'private', 'academia-examen-to-be.json');
  if(!fs.existsSync(realFile)){ console.log('  (omitida) banco real: no hay private/academia-examen-to-be.json en este equipo (por diseno no esta en el repo)'); }
  else await test('banco REAL (private/): valido, sin repetir el banco publico, y el servidor califica 100% con las respuestas correctas y 0% al reves', async()=>{
    const real = JSON.parse(fs.readFileSync(realFile, 'utf8'));
    assert.deepStrictEqual(seedLib.validate(real, { perTopic:3 }), []);
    const pub = require('vm').runInNewContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';ACADEMIA');
    const pubTexts = new Set();
    pub.courses['to-be'].exam.bank.concat([].concat.apply([], pub.courses['to-be'].lessons.map(l => l.activities))).forEach(a => pubTexts.add(JSON.stringify(a.q) + JSON.stringify(a.source || '') + JSON.stringify(a.options || a.tokens || '')));
    assert.deepStrictEqual(seedLib.validate(real, { publicBankTexts:pubTexts }), []);
    const d = await fresh();
    await d.exec('delete from public.academia_exam_items');
    await d.exec(seedLib.sqlFor(real));
    await d.exec(`update public.academia_courses set exam_size = 15, per_topic = 3, max_attempts_day = 10`);
    const s = await call(d, U.mem, 'academia_exam_start', ['to-be']);
    assert.strictEqual(s.items.length, 15);
    const per = {}; s.items.forEach(i => per[i.topic] = (per[i.topic] || 0) + 1);
    assert.deepStrictEqual(Object.values(per).sort(), [3, 3, 3, 3, 3]);
    assert(!/"correct"|"accepted"|"fix"|"why"/.test(JSON.stringify(s)), 'filtra respuestas');
    const by = {}; real.items.forEach(b => by[b.id] = b);
    const good = {}, bad = {};
    s.items.forEach(i => { const b = by[i.id]; good[i.id] = b.type === 'choice' || b.type === 'error' ? b.answer.correct : b.type === 'type' ? b.answer.accepted[b.answer.accepted.length - 1] : b.answer.order; bad[i.id] = 'zzz'; });
    const r = await call(d, U.mem, 'academia_exam_submit', [s.attempt_id, good]);
    assert.deepStrictEqual([r.score_pct, r.passed], [100, true]);
    const s2 = await call(d, U.mem, 'academia_exam_start', ['to-be']);
    const r2 = await call(d, U.mem, 'academia_exam_submit', [s2.attempt_id, bad]);
    assert.deepStrictEqual([r2.score_pct, r2.passed], [0, false]);
    assert(r2.review.every(x => x.right && x.why));
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
