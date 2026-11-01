#!/usr/bin/env node
/* Curso 7 PRESENTE SIMPLE (rutinas, verbo sin cambios, la s de he / she / it, reglas s / es / ies, frecuencia): contenido, gramatica, audio y curso OCULTO.
   Corre con:  node tools/tests/academia-presente-simple.test.js
   Si falta private/contenido/presente-simple.json (contenido privado, no esta en git), la prueba se omite. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const FUENTE = require('../academia_fuente.js').load();
const A = FUENTE.A, C = A.courses['presente-simple'], TX = FUENTE.TX;
if(!C || !C.hydrated){ console.log('omitida: falta private/contenido/presente-simple.json (contenido privado, no esta en git)'); process.exit(0); }
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const priv = f => path.join(root, 'private', f);
let passed = 0, failed = 0;
function test(n, f){ try{ f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split('\n').slice(0, 9).join('\n  ')); } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
const EXAM = JSON.parse(fs.readFileSync(priv('academia-examen-presente-simple.json'), 'utf8')).items;
const acts = []; C.lessons.forEach(l => l.activities.forEach(a => acts.push(a)));
const practice = C.exam.bank;

/* ---- Oraculos de gramatica (diccionarios cerrados escritos a mano, independientes del contenido) ---- */
const BASE = 'swim work study live eat drink play read walk speak cook sleep watch wash teach go have carry fly enjoy buy fix arrive'.split(' ');
function third(v){   // regla del ingles escrita aparte: sh ch ss x o -> es; consonante + y -> ies; resto -> s; have -> has
  if(v === 'have') return 'has';
  if(/(sh|ch|ss|x|o)$/.test(v)) return v + 'es';
  if(/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
  return v + 's';
}
const THIRD = {}; BASE.forEach(v => { THIRD[third(v)] = v; });
const PLURAL = new Set(['i', 'you', 'we', 'they', 'my parents', 'the children', 'my friends', 'your friends', 'cats', 'dogs', 'birds', 'cows', 'fish']);
const SINGULAR = new Set(['he', 'she', 'it', 'tom', 'ana', 'my brother', 'my mother', 'my father', 'my sister', 'my grandmother', 'the dog', 'the cat', 'the bird', 'the teacher']);
const ADV = new Set(['always', 'usually', 'often', 'sometimes', 'never']);
const SPANISH_ADV = [['casi siempre', 'usually'], ['muchas veces', 'often'], ['a veces', 'sometimes'], ['siempre', 'always'], ['nunca', 'never']];
/* Devuelve la lista de problemas ([] = frase correcta para A1). Una frase se analiza como: sujeto [adverbio] verbo resto. */
function grammarErrors(text){
  const errs = [];
  text.replace(/[‘’]/g, "'").split(/(?<=[.?!])\s+/).forEach(s0 => {
    const w = s0.replace(/[.?!]$/, '').trim().split(/\s+/).map(x => x.toLowerCase()); if(!w[0]) return;
    let vi = w.findIndex((x, i) => i > 0 && (BASE.includes(x) || THIRD[x] || /^(?:works|plays|studys|watchs|gos|haves|washs|teachs|plaies|cans)$/.test(x) || /ing$/.test(x) && BASE.includes(x.replace(/ing$/, ''))));
    if(vi < 0){ errs.push(s0 + ' -> sin verbo reconocible'); return; }
    let sv = vi; if(ADV.has(w[vi - 1])) sv = vi - 1;
    const subj = w.slice(0, sv).join(' ');
    if(!PLURAL.has(subj) && !SINGULAR.has(subj)){ errs.push(s0 + ' -> sujeto desconocido: ' + subj); return; }
    const v = w[vi], base = BASE.includes(v) ? v : (THIRD[v] || null);
    if(!base){ errs.push(s0 + ' -> verbo no valido: ' + v); return; }
    if(PLURAL.has(subj) && v !== base) errs.push(s0 + ' -> con ' + subj + ' el verbo va sin cambios');
    if(SINGULAR.has(subj) && v !== third(base)) errs.push(s0 + ' -> con ' + subj + ' el verbo va como ' + third(base));
    const ai = w.findIndex(x => ADV.has(x)); if(ai >= 0 && ai !== sv) errs.push(s0 + ' -> la palabra de frecuencia va antes del verbo');
  });
  return errs;
}
const okSentence = t => grammarErrors(t).length === 0;
const fill = (src, x) => src.replace('___', x);
const isEnglishLine = s => /^[A-Za-z][A-Za-z ,.'?!-]*[.?!]$/.test(s);

test('estructura: 5 lecciones x 8 actividades, 30 de practica (6 por tema) y 50 de examen (10 por tema)', () => {
  assert.strictEqual(C.lessons.length, 5); assert.deepStrictEqual(Array.from(C.lessons.map(l => l.topic)), ['uso', 'base', 'tercera', 'reglas', 'frec']);
  C.lessons.forEach((l, i) => {
    assert.strictEqual(l.activities.length, 8, 'leccion ' + (i + 1));
    assert.deepStrictEqual(l.activities.slice(0, 4).map(a => a.type), ['choice', 'choice', 'choice', 'choice']);
    assert.deepStrictEqual(l.activities.slice(4, 7).map(a => a.type), ['match', 'type', 'error']);
    assert.strictEqual(l.activities[7].type, i === 4 ? 'write' : 'order');
    l.activities.forEach(a => assert.strictEqual(a.topic, l.topic));
  });
  assert.strictEqual(practice.length, 30); assert.strictEqual(EXAM.length, 50);
  ['uso', 'base', 'tercera', 'reglas', 'frec'].forEach(t => {
    assert.strictEqual(practice.filter(b => b.topic === t).length, 6, 'practica ' + t); assert.strictEqual(EXAM.filter(b => b.topic === t).length, 10, 'examen ' + t);
    assert.deepStrictEqual(EXAM.filter(b => b.topic === t).map(b => b.type).sort(), ['choice', 'choice', 'choice', 'choice', 'choice', 'choice', 'error', 'order', 'type', 'type']);
    assert(EXAM.filter(b => b.topic === t).every(b => b.id.indexOf('e-' + t[0]) === 0), 'ids e-' + t[0]);
    assert(practice.filter(b => b.topic === t).every(b => b.id.indexOf('x-' + t[0]) === 0));
  });
});
test('ids unicos en todo el curso y un tema por leccion', () => {
  const ids = acts.map(a => a.id).concat(practice.map(b => b.id), EXAM.map(b => b.id)); assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(new Set(C.lessons.map(l => l.id)).size, 5);
});
test('sin rayas largas, sin do / does (es del Curso 8) y en espanol latinoamericano', () => {
  const all = JSON.stringify([C.lessons, practice, EXAM]);
  assert(!/—/.test(all), 'raya larga');
  assert(!/\b(?:do|does|don't|doesn't)\b/i.test(all.replace(/\\u[0-9a-f]{4}/gi, '')), 'do / does es del Curso 8');
  assert(!/\b(?:coche|conducir|football|vosotros|ordenador|zumo)\b/i.test(all), 'espanol / ingles no latinoamericano-americano');
  assert(!/\b(?:am|is|are) (?:\w+ing)\b/i.test(all), 'presente continuo no va aqui');
});
test('gramatica: todas las frases correctas en ingles cumplen las reglas del presente simple', () => {
  const o = [];
  C.lessons.forEach(l => { l.canSay.forEach(x => o.push(x)); l.screens.forEach(s => { (s.items || []).forEach(i => { if(isEnglishLine(i.en)) o.push(i.en); }); (s.listen || []).forEach(x => { if(isEnglishLine(x)) o.push(x); });
    if(s.compare) o.push(s.compare.right); if(s.table) s.table.rows.forEach(r => r.forEach(c => { if(isEnglishLine(c)) o.push(c); })); }); });
  acts.concat(practice).forEach(a => { if(a.say) o.push(a.say); if(a.fix) o.push(a.fix); if(a.example) o.push(a.example); if(a.tokens) o.push(a.tokens.join(' '));
    if(a.type === 'match') a.pairs.forEach(p => o.push(p[1]));
    if(a.type === 'choice'){ const r = a.options[a.answer]; if(isEnglishLine(r)) o.push(r); else if(a.q.indexOf('___') !== -1){ const m = /([A-Z][^:]*___[^:]*)$/.exec(a.q); if(m) o.push(fill(m[1], r)); } }
    if(a.type === 'type' && a.source) a.accepted.forEach(x => o.push(fill(a.source, x))); });
  EXAM.forEach(b => { if(b.type === 'choice'){ const r = b.answer.correct; if(isEnglishLine(r)) o.push(r); else { const m = /([A-Z][^:]*___[^:]*)$/.exec(b.public.q); if(m) o.push(fill(m[1], r)); } }
    if(b.type === 'type') b.answer.accepted.forEach(x => o.push(fill(b.public.source, x))); if(b.type === 'error') o.push(b.answer.fix); if(b.type === 'order') o.push(b.answer.order.join(' ')); });
  assert(o.length > 200, 'se analizaron ' + o.length);
  const bad = []; o.forEach(t => grammarErrors(t).forEach(e => bad.push(e))); assert.deepStrictEqual(bad, []);
});
test('una sola respuesta correcta: de las opciones de cada pregunta (hueco o frase) solo una cumple la gramatica; la palabra de frecuencia la decide el espanol', () => {
  const bad = []; const items = acts.filter(a => a.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] }))
    .concat(practice.filter(b => b.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] })), EXAM.filter(b => b.type === 'choice').map(b => ({ id: b.id, q: b.public.q, options: b.public.options, correct: b.answer.correct })));
  assert.strictEqual(items.length, 65);
  items.forEach(it => {
    assert.strictEqual(new Set(it.options.map(norm)).size, it.options.length, it.id + ' opciones repetidas');
    const adv = it.options.every(o => ADV.has(o));
    if(adv){ const kw = SPANISH_ADV.find(k => it.q.toLowerCase().indexOf(k[0]) !== -1); if(!kw || kw[1] !== it.correct) bad.push(it.id + ' palabra de frecuencia no coincide con el espanol'); return; }
    const texts = it.options.map(o => isEnglishLine(o) ? o : fill(/([A-Z][^:]*___[^:]*)$/.exec(it.q)[1], o));
    const good = texts.filter(okSentence); if(good.length !== 1) bad.push(it.id + ' correctas=' + good.length + ' ' + JSON.stringify(texts));
    else if(it.options[texts.indexOf(good[0])] !== it.correct) bad.push(it.id + ' la correcta no coincide');
  });
  assert.deepStrictEqual(bad, []);
});
test('errores: solo la frase marcada tiene error y la correccion es correcta; escribir: una sola respuesta aceptada y ordenar: sin tiempo movil', () => {
  const bad = [];
  const errs = acts.concat(practice).filter(a => a.type === 'error').map(a => ({ id: a.id, o: a.options, w: a.wrong, fix: a.fix })).concat(EXAM.filter(b => b.type === 'error').map(b => ({ id: b.id, o: b.public.options, w: b.public.options.indexOf(b.answer.correct), fix: b.answer.fix })));
  assert.strictEqual(errs.length, 15);   // 5 de lecciones + 5 de practica + 5 de examen
  errs.forEach(e => { e.o.forEach((o, i) => { const ok = okSentence(o); if(i === e.w ? ok : !ok) bad.push(e.id + ' opcion ' + i + ' ' + o); }); if(!okSentence(e.fix)) bad.push(e.id + ' fix'); });
  const types = acts.concat(practice).filter(a => a.type === 'type').map(a => ({ id: a.id, src: a.source, acc: a.accepted })).concat(EXAM.filter(b => b.type === 'type').map(b => ({ id: b.id, src: b.public.source, acc: b.answer.accepted })));
  types.forEach(t => { if(t.acc.length !== 1) bad.push(t.id + ' acepta varias'); t.acc.forEach(x => { const s = fill(t.src, x); if(!(ADV.has(x) ? true : okSentence(s))) bad.push(t.id + ' ' + s); }); });
  const ords = acts.concat(practice).filter(a => a.type === 'order').map(a => ({ id: a.id, tok: a.tokens })).concat(EXAM.filter(b => b.type === 'order').map(b => ({ id: b.id, tok: b.answer.order })));
  ords.forEach(o => { if(/\b(?:every|night\.?|day\.?|sundays\.?|mondays\.?|morning\.?|today\.?|school\.?)\b/i.test(o.tok.join(' ')) && /\b(?:every|sundays|mondays|morning|today)\b/i.test(o.tok.join(' '))) bad.push(o.id + ' tiempo movible'); if(!okSentence(o.tok.join(' '))) bad.push(o.id + ' orden'); if(!/^[A-Z]/.test(o.tok[0])) bad.push(o.id + ' empieza en minuscula'); });
  assert.deepStrictEqual(bad, []);
});
test('escribir: la frase de ejemplo cumple su revision y las respuestas incompletas no', () => {
  const w = acts.find(a => a.type === 'write'); const res = w.checks.map(c => new RegExp(c.re, c.flags));
  assert(res.every(r => r.test(w.example)), 'el ejemplo pasa');
  ['I like pizza.', 'I always.', 'always', 'She is happy.'].forEach(t => assert(!res.every(r => r.test(t)), t + ' no debe pasar'));
  ['I never eat meat.', 'She sometimes reads at night.', 'We usually walk.'].forEach(t => assert(res.every(r => r.test(t)), t + ' debe pasar'));
});
test('AUDIO: todo ejemplo, palabra y celda de tabla en ingles tiene su audio (sin importar mayusculas)', () => {
  const tx = TX(C); const have = new Set(tx.map(x => x.t.trim().toLowerCase())); assert(tx.length >= 100, 'textos de audio: ' + tx.length);
  const vocab = new Set(); const addv = s => String(s).toLowerCase().replace(/[.,?!]/g, ' ').split(/\s+/).filter(Boolean).forEach(x => vocab.add(x));
  tx.forEach(x => addv(x.t));
  const miss = [];
  C.lessons.forEach(l => { l.canSay.forEach(t => { if(!have.has(t.toLowerCase())) miss.push('canSay ' + t); });
    l.screens.forEach(s => { (s.items || []).forEach(i => { if(!have.has(i.en.toLowerCase())) miss.push('item ' + i.en); }); (s.listen || []).forEach(t => { if(!have.has(String(t.t || t).toLowerCase())) miss.push('listen ' + t); });
      if(s.table) s.table.rows.forEach(r => r.forEach(c => { const toks = c.toLowerCase().replace(/[.,?!]/g, ' ').split(/\s+/).filter(Boolean); const eng = toks.length && toks.every(t => vocab.has(t)); if(eng && !have.has(c.trim().toLowerCase())) miss.push('celda de tabla sin audio: ' + c); })); }); });
  acts.forEach(a => { const f = FUENTE.ctx.academiaSentence ? FUENTE.ctx.academiaSentence(a) : null; if(f && !have.has(f.toLowerCase())) miss.push('actividad ' + a.id + ' ' + f); });
  assert.deepStrictEqual(miss, []);
  // todo texto de audio es SOLO ingles (nunca una pista en espanol leida con voz inglesa)
  const eng = new Set(); const adde = s => String(s).toLowerCase().replace(/[.,?!:]/g, ' ').split(/\s+/).filter(Boolean).forEach(x => eng.add(x));
  C.lessons.forEach(l => { l.canSay.forEach(adde); l.screens.forEach(s => { (s.items || []).forEach(i => adde(i.en)); (s.listen || []).forEach(x => adde(x.t || x)); if(s.compare){ adde(s.compare.right); adde(s.compare.wrong); } }); l.activities.forEach(a => { if(a.say) adde(a.say); if(a.fix) adde(a.fix); if(a.tokens) adde(a.tokens.join(' ')); if(a.type === 'error') a.options.forEach(adde); if(a.type === 'choice') a.options.forEach(o => { if(/^[A-Z].*[.?!]$/.test(o)) adde(o); }); if(a.pairs) a.pairs.forEach(p => adde(p[1])); if(a.type === 'type') a.accepted.forEach(x => adde(a.source.replace('___', x))); }); });
  const sp = tx.filter(x => x.t.toLowerCase().replace(/[.,?!:]/g, ' ').split(/\s+/).filter(Boolean).some(w => !eng.has(w))).map(x => x.t); assert.strictEqual(sp.length, 0, 'audio con texto en espanol: ' + sp.join(' | '));
  // ninguna actividad con pista en espanol debe leerse con voz inglesa: la frase en ingles va en say o se deduce del hueco
  acts.forEach(a => { if(a.type === 'choice' && a.q.indexOf('___') === -1 && !/^[A-Za-z].*[.?!]$/.test(a.options[a.answer])){ assert(a.say, a.id + ' sin say'); } });
});
test('AUDIO (archivos): cada texto tiene su mp3 privado, no vacio, y el mapa no apunta a archivos que faltan', () => {
  const mapF = priv('contenido/presente-simple.audio.json'); if(!fs.existsSync(mapF)){ console.log('       (sin mapa de audio todavia)'); return; }
  const map = JSON.parse(fs.readFileSync(mapF, 'utf8')); const tx = TX(C);
  assert.strictEqual(Object.keys(map).length, tx.length);
  tx.forEach(x => { assert(map[x.t], 'sin audio: ' + x.t); const p = priv('audio/' + map[x.t]); assert(fs.existsSync(p), 'falta ' + map[x.t]); assert(fs.statSync(p).size > 4000, 'audio muy pequeno ' + map[x.t]); });
  const files = fs.readdirSync(priv('audio/presente-simple')); assert.strictEqual(files.length, new Set(Object.values(map)).size, 'sobran o faltan mp3');
});
test('OCULTO: el curso no esta abierto ni en el sitio ni en el puente, y el esqueleto publico no trae contenido', () => {
  const M = vm.runInNewContext(read('academia-motor.js') + ';ACADEMIA_MOTOR'); assert.strictEqual(M.courses['presente-simple'].open, false); assert.strictEqual(M.courses['presente-simple'].tema, 'presente-simple');
  assert.strictEqual(M.courses['presente-simple'].engineTopic, 'Presente simple: la -s de he / she / it');
  ['to-be', 'pronombres', 'articulos', 'posesivos', 'there-is-are', 'can'].forEach(id => assert.strictEqual(M.courses[id].open, true, id + ' sigue abierto'));
  const CU = vm.runInNewContext(read('academia-cursos.js') + ';ACADEMIA_CURSOS'); assert.strictEqual(CU.courses['presente-simple'].open, false); assert.strictEqual(CU.courses['presente-simple'].lessons, 5);
  const route = A.route.courses.find(c => c.id === 'presente-simple'); assert(route && route.soon === true, 'sigue como proximo en la ruta');
  const pub = read('academia-data.js'); const sk = A.courses['presente-simple'];
  assert.strictEqual(sk.protected, true);
  ['We eat rice and beans.', 'Con I el verbo va sin cambios', 'They live in Mexico.', 'wrongWhy'].forEach(s => { const i = pub.indexOf("'presente-simple': {"); assert(pub.indexOf(s, i) === -1 || s === 'They live in Mexico.' && false, 'contenido privado en academia-data.js: ' + s); });
  assert(!/academia-examen-presente-simple|seed-academia/.test(read('.gitignore').replace(/\r/g, '')) || /^private\/$/m.test(read('.gitignore').replace(/\r/g, '')), 'private/ ignorado');
});
test('SQL: la migracion solo inserta una fila APAGADA y los seeds solo tocan este curso', () => {
  const mig = read('supabase/migrations/20261101200000_academia_curso_presente_simple.sql'); const code = mig.split('\n').filter(l => !/^\s*--/.test(l)).join('\n');
  assert(/insert into public\.academia_courses/.test(code) && /'presente-simple', 'Presente simple', false/.test(code), 'fila apagada'); assert(!/\b(?:update|delete|drop|alter|truncate|create)\b/i.test(code));
  const se = priv('seed-academia-examen-presente-simple.sql'), sc = priv('seed-academia-contenido-presente-simple.sql');
  if(fs.existsSync(se)){ const b = fs.readFileSync(se, 'utf8'); assert.strictEqual((b.match(/\('presente-simple', 'e-/g) || []).length, 50); assert(!/\b(?:delete|drop|truncate)\b/i.test(b.replace(/\$j\$[\s\S]*?\$j\$/g, '')) && !/\bupdate\b/i.test(b.replace(/\$j\$[\s\S]*?\$j\$/g, '').replace(/on conflict[^;]*do update set[^;]*/gi, '')), 'solo upsert'); }
  if(fs.existsSync(sc)){ const b = fs.readFileSync(sc, 'utf8'); const out = b.replace(/\$j\$[\s\S]*?\$j\$/g, ''); assert(/presente-simple/.test(out)); assert(!/\b(?:delete|drop|truncate)\b/i.test(out)); assert(!/'(?:to-be|pronombres|articulos|posesivos|there-is-are|can)'/.test(out), 'toca otros cursos'); }
});
console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : '')); if(failed) process.exit(1);
