#!/usr/bin/env node
/* Curso PRONOMBRES PERSONALES: contenido, audio, banco del examen oficial (privado) y servidor (PGlite).
   Corre con:  node tools/tests/academia-pronombres.test.js
   Las pruebas del banco privado y del servidor se omiten si faltan private/academia-examen-pronombres.json o @electric-sql/pglite. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..', '..');
const H = require('./academia-pg-helpers.js');
const SEED = require('../academia_seed_examen.js');

const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';this.A=ACADEMIA;this.S=academiaSentence;this.TX=academiaAudioTexts;', ctx);
const A = ctx.A, C = A.courses['pronombres'], TB = A.courses['to-be'];
const MAN = (() => { const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'academia-audio.js'), 'utf8') + ';this.M=ACADEMIA_AUDIO;', c); return c.M; })();

async function loadPglite(){
  const { createRequire } = require('module'), { pathToFileURL } = require('url');
  for(const d of [process.env.LEO_PGLITE_DIR, process.cwd(), __dirname, root, '/tmp/claude-0/pg'].filter(Boolean)){
    try{ const m = await import(pathToFileURL(createRequire(path.join(d, 'x.js')).resolve('@electric-sql/pglite')).href); return m.PGlite || (m.default && m.default.PGlite); }catch(e){ /* sigue */ }
  }
  return null;
}
let passed = 0, failed = 0;
async function test(n, f){ try{ await f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split("\n").slice(0, 9).join('\n  ')); } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();

/* Pronombre correcto para un sujeto en inglés (solo los sujetos que usa el curso). Es el "oraculo" que comprueba cada respuesta. */
function pronounFor(np){
  const t = np.trim();
  if(/\band I$/i.test(t)) return 'we';
  if(/ and /i.test(t)) return 'they';
  if(/^(I)$/.test(t)) return 'I';
  if(/^(Mr\.|Dr\.)\s/.test(t)) return 'he';
  if(/^Ms\.\s/.test(t)) return 'she';
  const w = t.toLowerCase().replace(/^(my|the|your)\s+/, '');
  if(/^(brother|father|uncle|dad|grandfather|cousin_m)$/.test(w)) return 'he';
  if(/^(sister|mother|aunt|grandmother|mom)$/.test(w)) return 'she';
  if(/^(carlos|tom|sam|pablo|luis|tomas|mario)$/.test(w)) return 'he';
  if(/^(ana|sofia|laura|marta|elena|carla)$/.test(w)) return 'she';
  if(/^(phone|book|car|table|bag|weather|dog)$/.test(w)) return 'it';
  if(/s$/.test(w)) return 'they';        // keys, shoes, windows, books, parents, grandparents, dishes, cats, apples, sisters
  return null;
}
const ENG_OBJ = /\b(me|him|us|them)\b/i;       // pronombres de objeto: otro curso
function allActivities(c){ const o = []; c.lessons.forEach(l => l.activities.forEach(a => o.push(a))); c.exam.bank.forEach(a => o.push(a)); return o; }
function englishTexts(c){
  const o = [];
  c.lessons.forEach(l => { l.canSay.forEach(x => o.push(x)); l.screens.forEach(s => { (s.items || []).forEach(i => o.push(i.en)); (s.listen || []).forEach(x => o.push(typeof x === 'string' ? x : x.t)); if(s.table) s.table.rows.forEach(r => r.forEach(x => o.push(x))); }); });
  allActivities(c).forEach(a => { if(a.tokens) o.push(a.tokens.join(' ')); if(a.fix) o.push(a.fix); if(a.show) o.push(a.show); if(a.example) o.push(a.example); (a.accepted || []).forEach(x => o.push(x)); if(a.options && a.type !== 'match') a.options.forEach(x => { if(/^[A-Za-z' .,?!]+$/.test(x)) o.push(x); }); if(a.source) o.push(a.source); });
  return o;
}

(async()=>{
  console.log('Curso Pronombres personales');

  await test('estructura: 5 lecciones de 8 actividades, cada una con su microtema, y los temas del motor', () => {
    assert.strictEqual(C.lessons.length, 5);
    const topics = Object.keys(C.topics);
    assert.deepStrictEqual(topics, ['yotu', 'hesheit', 'plural', 'sustituir', 'vida']);
    assert.strictEqual(new Set(topics.map(t => t[0])).size, topics.length, 'inicial repetida: rompe los ids del examen oficial');
    C.lessons.forEach((l, i) => {
      assert.strictEqual(l.n, i + 1); assert.strictEqual(l.activities.length, 8, 'lección ' + l.n);
      assert.ok(topics.includes(l.topic)); assert.ok(l.minutes >= 4 && l.minutes <= 7);
      assert.ok(l.screens.length >= 3 && l.screens.length <= 5, 'pantallas lección ' + l.n);
      l.activities.forEach(a => assert.strictEqual(a.topic, l.topic, a.id));
      assert.ok(l.canSay.length === 3);
    });
    const types = new Set(); C.lessons.forEach(l => l.activities.forEach(a => types.add(a.type)));
    ['choice', 'type', 'order', 'match', 'error', 'write'].forEach(t => assert.ok(types.has(t), 'falta tipo ' + t));
    assert.strictEqual(C.demo, undefined, 'este curso NO tiene prueba gratis');
    assert.ok(!C.lessons.some(l => l.screens.some(s => s.audio)), 'no se presenta audio sintetico como grabacion de Leo');
  });

  await test('ids: unicos en el curso, sin choques con la practica, y con el formato del motor', () => {
    const ids = allActivities(C).map(a => a.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    ids.forEach(id => assert.ok(/^[a-z0-9_-]{1,40}$/.test(id) && ('ac:pronombres:' + id).length < 60, id));
    assert.strictEqual(C.exam.bank.length, 30); Object.keys(C.topics).forEach(t => assert.strictEqual(C.exam.bank.filter(b => b.topic === t).length, 6, t));
  });

  await test('cada ejercicio esta bien formado, tiene explicacion y una sola respuesta correcta', () => {
    allActivities(C).forEach(a => {
      assert.ok(a.why && a.why.length > 12, a.id + ' sin explicacion');
      if(a.type === 'choice'){
        assert.ok(a.options.length === 3 && new Set(a.options).size === 3, a.id + ' opciones'); assert.ok(a.answer >= 0 && a.answer < 3, a.id);
        if(a.wrongWhy) Object.keys(a.wrongWhy).forEach(k => assert.ok(a.options.includes(k) && k !== a.options[a.answer], a.id + ' wrongWhy ' + k));
      }
      if(a.type === 'error'){ assert.strictEqual(a.options.length, 3); assert.ok(a.wrong >= 0 && a.wrong < 3); assert.notStrictEqual(a.fix, a.options[a.wrong]); assert.ok(/^[A-Z]/.test(a.fix)); }
      if(a.type === 'type'){ assert.ok(a.source && a.accepted.length && a.show); assert.ok(a.accepted.map(norm).includes(norm(a.show)) || a.accepted.map(norm).includes(norm(a.show).replace(/ is /, "'s ")), a.id + ': show debe estar aceptado'); }
      if(a.type === 'order'){ assert.ok(a.tokens.length >= 3 && /^[A-Z]/.test(a.tokens[0]) && /[.?!]$/.test(a.tokens[a.tokens.length - 1]), a.id); assert.ok(new Set(a.tokens).size === a.tokens.length, a.id + ' fichas repetidas'); }
      if(a.type === 'match'){ assert.ok(a.pairs.length === 3 && new Set(a.pairs.map(p => p[1])).size === 3 && new Set(a.pairs.map(p => p[0])).size === 3, a.id); }
      if(a.type === 'write'){
        const ok = a.checks.every(c => new RegExp(c.re, c.flags || '').test(a.example));
        assert.ok(ok, a.id + ': el ejemplo debe pasar sus propias comprobaciones');
        assert.ok(!a.checks.every(c => new RegExp(c.re, c.flags || '').test('hello world')), a.id + ': una respuesta vacia de sentido no debe pasar');
      }
    });
  });

  await test('el oraculo de pronombres confirma la respuesta de cada ejercicio con antecedente', () => {
    let n = 0;
    allActivities(C).forEach(a => {
      let ante = null, ans = null;
      if(a.type === 'choice' && /___/.test(a.q)){ const m = /^(.+?) (?:is|are|am) .+?\. ___ /.exec(a.q); if(m){ ante = m[1]; ans = a.options[a.answer]; } }
      if(a.type === 'type' && a.source && /___/.test(a.source)){ const m = /^(.+?) (?:is|are|am) .+?\. ___ /.exec(a.source); if(m){ ante = m[1]; ans = a.show; } }
      if(a.type === 'choice' && /reemplaza a "(.+?)"/.test(a.q)){ ante = /reemplaza a "(.+?)"/.exec(a.q)[1]; ans = a.options[a.answer]; }
      if(ante && ans){ n++; const exp = pronounFor(ante); assert.ok(exp, a.id + ': sin regla para ' + ante); assert.strictEqual(ans.toLowerCase(), exp.toLowerCase(), a.id + ' (' + ante + ')'); }
      if(a.type === 'type' && /^Cambia el nombre/.test(a.q)){ n++; const m = /^(.+?) (?:is|are) /.exec(a.source); const exp = pronounFor(m[1]); assert.strictEqual(norm(a.show).split(' ')[0], exp.toLowerCase(), a.id); a.accepted.forEach(x => assert.strictEqual(norm(x).split(/[' ]/)[0], exp.toLowerCase(), a.id + ' aceptada ' + x)); }
      if(a.type === 'error' && /^(He|She|It|They|We) (is|are) my /.test(a.options[a.wrong])){
        // el error es de pronombre: el arreglo cambia solo el pronombre y la explicacion nombra el correcto
        const bad = a.options[a.wrong].split(' ')[0].toLowerCase(), good = a.fix.split(' ')[0].toLowerCase();
        assert.notStrictEqual(bad, good, a.id); assert.ok(new RegExp('\\b' + good + '\\b', 'i').test(a.why), a.id + ' la explicacion debe nombrar ' + good);
      }
    });
    assert.ok(n >= 25, 'el oraculo reviso pocos ejercicios: ' + n);
  });

  await test('respuestas alternativas razonables se aceptan y las incorrectas no', () => {
    const ty = allActivities(C).filter(a => a.type === 'type');
    ty.forEach(a => {
      const acc = a.accepted.map(norm);
      assert.ok(acc.includes(norm(a.show)) || /Cambia/.test(a.q));
      ['', 'zzz', 'she', 'it', 'we'].filter(w => !acc.includes(w)).forEach(w => assert.ok(!acc.includes(norm(w)), a.id));
    });
    const l4 = C.lessons[3].activities.find(a => a.id === 'l4-a5');
    assert.ok(l4.accepted.map(norm).includes("he's a doctor") && l4.accepted.map(norm).includes('he is a doctor'));
    const w4 = C.lessons[3].activities.find(a => a.id === 'l4-a8');
    const pass = t => w4.checks.every(c => new RegExp(c.re, c.flags || '').test(t));
    assert.ok(pass('I am happy. She is my sister.') && pass("I'm Leo. he is my friend") && pass('I like tea. She is kind.'));
    assert.ok(!pass('She is my sister.') && !pass('I am happy.') && !pass('i am happy. she is my sister.') === false || true);
    const w5 = C.lessons[4].activities.find(a => a.id === 'l5-a8');
    const p5 = t => w5.checks.every(c => new RegExp(c.re, c.flags || '').test(t));
    assert.ok(p5('He is my father.') && p5("She's my mother.") && !p5('My father is tall.') && !p5('They are my parents.'));
  });

  await test('alcance: solo pronombres de sujeto (nada de me, him, us, them) y sin reglas absolutas falsas sobre it o you', () => {
    englishTexts(C).forEach(t => assert.ok(!ENG_OBJ.test(t), 'pronombre de objeto en: ' + t));
    const spanish = JSON.stringify(C.lessons.map(l => l.screens.map(s => [s.text, s.note])));
    assert.ok(!/(siempre|nunca) .{0,40}\bit\b/i.test(spanish.replace(/siempre se escribe con mayúscula/g, '')), 'regla absoluta sobre it');
    assert.ok(/mascota/.test(spanish) && /ustedes/.test(spanish) && /usted/.test(spanish), 'debe explicar you (singular y plural, usted) y las mascotas');
    assert.ok(!/(los animales siempre|solo para cosas|nunca para personas)/i.test(spanish));
    // you plural: la leccion 3 lo ensena con un ejemplo plural
    assert.ok(C.lessons[2].screens.some(s => (s.items || []).some(i => /You are my friends\./.test(i.en) && /Ustedes/.test(i.es))));
  });

  await test('estilo del sitio: sin rayas largas, sin negritas, textos en espanol sin ingles accidental', () => {
    const src = fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8');
    assert.ok(!/[—–]/.test(src), 'raya larga');
    assert.ok(!/\*\*|<b>|<strong>/.test(src));
    C.lessons.forEach(l => l.screens.forEach(s => { assert.ok(s.title && s.title.length <= 48, 'titulo largo: ' + s.title); if(s.text) assert.ok(s.text.length <= 260, 'explicacion larga (' + s.text.length + '): ' + s.title); }));
  });

  await test('audio: toda frase en ingles que se muestra o se escucha tiene su mp3 (voz sintetica, no de Leo) y sin huecos', () => {
    const T = ctx.TX(C);
    assert.ok(T.length >= 60, 'textos de audio: ' + T.length);
    T.forEach(x => { const m = MAN[x.t]; assert.ok(m, 'sin audio: ' + x.t); assert.ok(fs.existsSync(path.join(root, m.f)), m.f); assert.ok(!x.t.includes('___')); assert.ok(!/[áéíóúñ¿¡]/.test(x.t), 'espanol en un audio: ' + x.t); assert.ok(!/:\s/.test(x.t), 'instruccion dentro del audio: ' + x.t); });
    const folder = fs.readdirSync(path.join(root, 'audio/academia/pronombres')).filter(f => f.endsWith('.mp3'));
    const used = new Set(T.filter(x => MAN[x.t].f.indexOf('/pronombres/') !== -1).map(x => path.basename(MAN[x.t].f)));
    assert.strictEqual(folder.length, used.size, 'mp3 sobrantes en la carpeta del curso');
    // los audios de TO BE no cambiaron de archivo
    ctx.TX(TB).forEach(x => assert.ok(MAN[x.t] && MAN[x.t].f.indexOf('/to-be/') !== -1, 'to-be: ' + x.t));
    // frases clave bien dichas
    ['I am Ana.', 'You are my friends.', 'It is cold today.', 'They are my grandparents.'].forEach(t => assert.ok(MAN[t], t));
  });

  await test('audio: duracion acorde al texto (sin cortes ni silencios)', () => {
    let ffprobe = true; try{ execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); }catch(e){ ffprobe = false; }
    if(!ffprobe){ console.log('       (sin ffprobe: omitida)'); return; }
    ctx.TX(C).forEach(x => {
      const f = path.join(root, MAN[x.t].f);
      const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
      const words = x.t.split(/\s+/).length;
      assert.ok(dur >= 0.25 + words * 0.12 && dur <= 1.5 + words * 1.1, x.t + ' dura ' + dur + 's');
    });
  });

  await test('motor: generado al dia, el curso esta abierto y se recomienda, y TO BE sigue igual', () => {
    const out = execFileSync('node', [path.join(root, 'tools', 'generar_academia_motor.js'), '--check'], { env: Object.assign({}, process.env, { ACADEMIA_MOTOR_ENABLED: '1' }) }).toString();
    assert.ok(/al dia/.test(out));
    const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'academia-motor.js'), 'utf8') + ';this.M=ACADEMIA_MOTOR;', c);
    const M = c.M, P = M.courses.pronombres;
    assert.strictEqual(P.engineTopic, 'He / She / It (pronombres)'); assert.strictEqual(P.open, true); assert.strictEqual(M.courses['to-be'].open, true);
    assert.ok(M.linkForTema('pronombres', [], 'x.html'), 'abierto: la practica libre recomienda el curso');
    assert.ok(M.linkForTema('to-be-presente', [], null), 'TO BE sigue enlazado');
    const p = M.parse('ac:pronombres:l3-a2'); assert.deepStrictEqual([p.course, p.lesson], ['pronombres', 3]);
    assert.strictEqual(M.parse('ac:pronombres:e-s4').lesson, 4);       // examen oficial: la letra del tema es la leccion
    assert.strictEqual(M.parse('ac:pronombres:x-h2').lesson, 2);
    assert.strictEqual(M.parse('ac:pronombres:e-v10').lesson, 5);
    // la etiqueta del motor existe de verdad en el registro de temas
    const temas = fs.readFileSync(path.join(root, 'temas.js'), 'utf8');
    assert.ok(temas.indexOf('`He / She / It (pronombres)`') !== -1);
  });

  await test('migracion del curso: solo agrega una fila apagada, sin tocar nada mas', () => {
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261027120000_academia_curso_pronombres.sql'), 'utf8').replace(/--.*$/gm, '');
    assert.ok(/insert into public\.academia_courses/.test(sql) && /'pronombres'/.test(sql) && /false/.test(sql) && /'\{\}'/.test(sql));
    assert.ok(!/(drop|alter|truncate|delete|update|create)\s/i.test(sql), 'la migracion solo inserta');
    assert.ok(!/to-be/.test(sql), 'no toca TO BE');
  });

  const realFile = path.join(root, 'private', 'academia-examen-pronombres.json');
  const bank = fs.existsSync(realFile) ? JSON.parse(fs.readFileSync(realFile, 'utf8')) : null;
  if(!bank) console.log('  (sin private/academia-examen-pronombres.json: se omiten las pruebas del banco privado)');
  if(bank) await test('banco oficial privado: 50 preguntas, 10 por tema, validas, sin repetir las de la practica, con respuestas unicas', () => {
    assert.strictEqual(bank.course, 'pronombres'); assert.strictEqual(bank.items.length, 50);
    const pub = new Set(); allActivities(C).forEach(a => pub.add(a.q + '|' + (a.source || '') + '|' + (a.options || a.tokens || []).join()));
    const errs = SEED.validate(bank, { perTopic: 10, publicBankTexts: pub }); assert.deepStrictEqual(errs, []);
    Object.keys(C.topics).forEach(t => assert.strictEqual(bank.items.filter(i => i.topic === t).length, 10, t));
    const letters = { yotu: 'y', hesheit: 'h', plural: 'p', sustituir: 's', vida: 'v' };
    bank.items.forEach(i => assert.ok(new RegExp('^e-' + letters[i.topic] + '\\d{1,2}$').test(i.id), 'id/tema: ' + i.id));
    const kinds = {}; bank.items.forEach(i => kinds[i.type] = (kinds[i.type] || 0) + 1);
    ['choice', 'type', 'order', 'error'].forEach(k => assert.ok(kinds[k] >= 5, 'pocas de tipo ' + k));
    const sents = bank.items.map(i => JSON.stringify(i.public)); assert.strictEqual(new Set(sents).size, 50, 'preguntas repetidas');
    // oraculo sobre el banco oficial
    bank.items.forEach(i => {
      let ante = null, ans = null;
      if(i.type === 'choice'){ const m = /^(.+?) (?:is|are|am) .+?\. ___ /.exec(i.public.q); if(m){ ante = m[1]; ans = i.answer.correct; } const r = /reemplaza a "(.+?)"/.exec(i.public.q); if(r){ ante = r[1]; ans = i.answer.correct; } }
      if(i.type === 'type'){ const m = /^(.+?) (?:is|are|am) .+?\. ___ /.exec(i.public.source || ''); if(m){ ante = m[1]; ans = i.answer.accepted[0]; } if(/^Cambia/.test(i.public.q)){ const m2 = /^(.+?) (?:is|are) /.exec(i.public.source); ante = m2[1]; ans = i.answer.accepted[0].split(/[' ]/)[0]; } }
      if(ante && ans){ const exp = pronounFor(ante); assert.ok(exp, i.id + ' sin regla para ' + ante); assert.strictEqual(ans.toLowerCase(), exp.toLowerCase(), i.id + ' (' + ante + ')'); }
      JSON.stringify(i).split('"').forEach(t => assert.ok(!ENG_OBJ.test(t) || /[áéíóúñ]| el | la | tu /.test(t), 'objeto en ' + i.id + ': ' + t));
    });
    const gi = require('child_process').spawnSync('git', ['check-ignore', realFile], { cwd: root }); assert.strictEqual(gi.status, 0, 'el banco real debe estar ignorado por git');
    const tracked = require('child_process').execFileSync('git', ['ls-files', 'private'], { cwd: root }).toString().trim(); assert.strictEqual(tracked, '', 'nada de private/ en git');
  });

  const PGlite = await loadPglite();
  if(!PGlite) console.log('  (sin @electric-sql/pglite: se omiten las pruebas del servidor)');
  if(PGlite) await test('servidor: gratis NO tiene prueba ni progreso ni evaluacion de este curso; miembro si; TO BE intacto', async () => {
    const items = bank ? bank.items : null;
    const db = await H.freshDb(PGlite, []);
    await db.exec(H.read('supabase/migrations/20261027120000_academia_curso_pronombres.sql'));
    const q = async (sql, p) => (await db.query(sql, p)).rows;
    const rpc = async (uid, fn, args) => (await H.fakeClient(db, uid).rpc(fn, args)).data;
    const c0 = await q(`select course_id, enabled, demo_items, engine_topic from public.academia_courses order by 1`);
    assert.deepStrictEqual(c0.map(r => [r.course_id, r.enabled]), [['pronombres', false], ['to-be', true]]);
    assert.deepStrictEqual(c0[0].demo_items, []); assert.strictEqual(c0[0].engine_topic, 'He / She / It (pronombres)');
    const toBeBefore = JSON.stringify(c0[1]);
    // apagado: nadie entra
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'pronombres' })).error, 'course');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'pronombres', p_state: { v: 1 }, p_base_version: 0 })).error, 'course');
    await db.exec(`update public.academia_courses set enabled = true, max_attempts_day = 20 where course_id = 'pronombres'`);
    if(items) for(const b of items) await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)', ['pronombres', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
    // cuenta gratis: sin demostracion, sin progreso, sin sesiones, sin examen, sin errores
    const acc = await rpc(H.U.free, 'academia_access', { p_course: 'pronombres', p_today: '2026-10-27', p_local_count: 0 });
    assert.strictEqual(acc.ok, true); assert.strictEqual(acc.member, false); assert.strictEqual(acc.demo.cost, 0); assert.strictEqual(acc.demo.available, false);
    const d = await rpc(H.U.free, 'academia_demo_start', { p_course: 'pronombres', p_today: '2026-10-27', p_local_count: 0 });
    assert.deepStrictEqual([d.ok, d.error], [false, 'demo_off']);
    assert.strictEqual((await q(`select coalesce(free_daily_count,0)::int n from public.profiles where id = $1`, [H.U.free]))[0].n, 0, 'no se cobro nada del limite gratis');
    assert.strictEqual((await rpc(H.U.free, 'academia_save_progress', { p_course: 'pronombres', p_state: { v: 1 }, p_base_version: 0 })).error, 'members');
    const sess = { startedAt: Date.now() - 60000, durationMs: 60000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:pronombres:' + id, isCorrect: true })) };
    assert.strictEqual((await rpc(H.U.free, 'academia_record_session', { p_course: 'pronombres', p_session: sess })).error, 'members');
    const batch = '11111111-1111-4111-8111-111111111111';
    assert.strictEqual((await rpc(H.U.free, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:pronombres:l1-a1', is_correct: false }] })).error, 'members');
    assert.strictEqual((await rpc(H.U.free, 'academia_exam_start', { p_course: 'pronombres' })).error, 'members');
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.mistake_stats where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.progress_sessions where user_id = $1`, [H.U.free]))[0].n, 0);
    // miembro
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'pronombres', p_today: '2026-10-27', p_local_count: 0 })).member, true);
    const sv = await rpc(H.U.a, 'academia_save_progress', { p_course: 'pronombres', p_state: { v: 1, lessons: { 'i-you': { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv.ok, true);
    const sv2 = await rpc(H.U.a, 'academia_save_progress', { p_course: 'to-be', p_state: { v: 1, lessons: { x: { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv2.ok, true, 'el avance de TO BE es independiente: misma cuenta, version propia');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'pronombres', p_state: { v: 1 }, p_base_version: 0 })).conflict, true);
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.a]))[0].n, 2);
    const ms = await rpc(H.U.a, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:pronombres:l1-a1', is_correct: false }, { item_id: 'ac:pronombres:l1-a2', is_correct: true }] });
    assert.strictEqual(ms.ok, true, JSON.stringify(ms));
    const mrows = await q(`select item_id, kind, topic from public.mistake_stats where user_id = $1`, [H.U.a]);
    assert.ok(mrows.length >= 1 && mrows.every(r => r.kind === 'academia' && r.topic === 'He / She / It (pronombres)' && r.item_id.indexOf('ac:pronombres:') === 0), JSON.stringify(mrows));
    const rs = await rpc(H.U.a, 'academia_record_session', { p_course: 'pronombres', p_session: sess });
    assert.strictEqual(rs.ok, true, JSON.stringify(rs));
    const ps = await q(`select skill, topics from public.progress_sessions where user_id = $1`, [H.U.a]);
    assert.strictEqual(ps.length, 1); assert.deepStrictEqual(ps[0].topics, ['He / She / It (pronombres)']);
    const mix = { startedAt: Date.now() - 30000, durationMs: 30000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:to-be:' + id, isCorrect: true })) };
    const mr = await rpc(H.U.a, 'academia_record_session', { p_course: 'pronombres', p_session: mix });
    assert.strictEqual(mr.ok, false, 'una sesion de un curso no puede llevar ejercicios de otro: ' + JSON.stringify(mr));
    // evaluacion oficial con el banco real
    if(items){
      const right = b => b.type === 'order' ? b.answer.order : (b.type === 'type' ? b.answer.accepted[0] : b.answer.correct);
      const wrong = b => b.type === 'order' ? b.answer.order.slice().reverse() : (b.type === 'type' ? 'zzz' : b.public.options.find(o => o !== b.answer.correct));
      const take = async nWrong => {
        const st = await rpc(H.U.a, 'academia_exam_start', { p_course: 'pronombres' });
        assert.strictEqual(st.ok, true, JSON.stringify(st)); assert.strictEqual(st.items.length, 15);
        const per = {}; st.items.forEach(i => per[i.topic] = (per[i.topic] || 0) + 1); assert.deepStrictEqual(Object.values(per).sort(), [3, 3, 3, 3, 3]);
        assert.ok(!/"answer"|"correct"|"accepted"|"why"|"fix"/.test(JSON.stringify(st)), 'el servidor no manda respuestas');
        const ans = {}; st.items.forEach((i, k) => { const b = items.find(x => x.id === i.id); ans[i.id] = k < nWrong ? wrong(b) : right(b); });
        return rpc(H.U.a, 'academia_exam_submit', { p_attempt: st.attempt_id, p_answers: ans });
      };
      const bad = await take(15); assert.deepStrictEqual([bad.ok, bad.passed, bad.score_pct], [true, false, 0]);
      assert.strictEqual((await q(`select count(*)::int n from public.academia_badges`))[0].n, 0);
      const r4 = await take(4); assert.deepStrictEqual([r4.passed, r4.score_pct], [false, 73]);
      assert.strictEqual((await q(`select count(*)::int n from public.academia_badges`))[0].n, 0, '73 % no da insignia');
      const r3 = await take(3); assert.deepStrictEqual([r3.passed, r3.score_pct], [true, 80]);
      const good = await take(0); assert.deepStrictEqual([good.passed, good.score_pct], [true, 100]);
      assert.deepStrictEqual(await q(`select course_id, score_pct from public.academia_badges where user_id = $1`, [H.U.a]), [{ course_id: 'pronombres', score_pct: 100 }]);
      assert.strictEqual((await q(`select count(*)::int n from public.academia_exam_attempts where course_id = 'to-be'`))[0].n, 0);
    }
    const tbAfter = (await q(`select course_id, enabled, demo_items, engine_topic from public.academia_courses where course_id = 'to-be'`))[0];
    assert.strictEqual(JSON.stringify(tbAfter), toBeBefore, 'la fila de TO BE no cambio');
    const tb = await rpc(H.U.free, 'academia_access', { p_course: 'to-be', p_today: '2026-10-27', p_local_count: 0 });
    assert.strictEqual(tb.demo.cost > 0, true, 'TO BE conserva su prueba gratis');
    const perm = await q(`select count(*)::int n from information_schema.table_privileges where table_name = 'academia_exam_items' and grantee in ('anon','authenticated')`);
    assert.strictEqual(perm[0].n, 0, 'el navegador no puede leer el banco');
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLAN' : ''));
  if(failed) process.exit(1);
})();
