#!/usr/bin/env node
/* Curso 11 IN / ON / AT (lugar y tiempo): contenido y gramatica. Prueba AUTONOMA: lee solo private/contenido/in-on-at.json
   y private/academia-examen-in-on-at.json. Corre con:  node tools/tests/academia-in-on-at.test.js
   Si falta el contenido privado (no esta en git), se omite.
   TODO (integracion, cuando se publique el esqueleto en academia-data.js): copiar de academia-do-does.test.js las pruebas de
   AUDIO (archivos mp3 y mapa), OCULTO (ruta, puente, listado), SQL (migracion y seeds) y TX/academiaSentence. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const priv = f => path.join(root, 'private', f);
if(!fs.existsSync(priv('contenido/in-on-at.json')) || !fs.existsSync(priv('academia-examen-in-on-at.json'))){ console.log('omitida: falta private/contenido/in-on-at.json (contenido privado, no esta en git)'); process.exit(0); }
const CONT = JSON.parse(fs.readFileSync(priv('contenido/in-on-at.json'), 'utf8'));
const EXAM = JSON.parse(fs.readFileSync(priv('academia-examen-in-on-at.json'), 'utf8')).items;
const lessons = CONT.lessons, practice = CONT.practice;
const acts = []; lessons.forEach(l => l.activities.forEach(a => acts.push(a)));
const TOPICS = ['que', 'lug', 'tie', 'mez', 'rep'];
let passed = 0, failed = 0;
function test(n, f){ try{ f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split('\n').slice(0, 9).join('\n  ')); } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
const fill = (src, x) => src.replace('___', x);
const isEnglishLine = s => /^[A-Za-z][A-Za-z0-9 ,.'’?!:-]*[.?!]$/.test(s);
const holeSentence = (q, o) => { const i = q.lastIndexOf(': '); const t = i >= 0 ? q.slice(i + 2) : q; return t.indexOf('___') !== -1 ? fill(t, o) : null; };

/* ---- Oraculo de gramatica: diccionario cerrado escrito a mano, independiente del contenido ----
   Para cada in / on / at de una frase busca la expresion que sigue (la mas larga) y exige la preposicion correcta.
   Una expresion desconocida es un error: obliga a registrar cada lugar o tiempo que se ensena. */
const MONTHS = 'january february march april may june july august september october november december'.split(' ');
const DAYS = 'monday tuesday wednesday thursday friday saturday sunday'.split(' ');
const HOURS = 'one two three four five six seven eight nine ten eleven twelve'.split(' ');
const DICT = {};
const reg = (prep, list) => list.forEach(p => { DICT[p] = prep; });
reg('in', ['the bag', 'my bag', 'the kitchen', 'the bathroom', 'the fridge', 'the freezer', 'the box', 'a box', 'my pocket', 'the water', 'the garden', 'the room', 'the classroom', 'the car', 'a taxi', 'a big city', 'a small city', 'the city center', 'the city',
  'peru', 'colombia', 'bogotá', 'medellín', 'the morning', 'the afternoon', 'the evening', 'summer', 'winter', 'spring', 'fall', '1995', '1998', '2001', '2005'].concat(MONTHS));
reg('on', ['the table', 'the wall', 'the floor', 'the shelf', 'the chair', 'the roof', 'the bed', 'the desk', 'the screen', 'main street', 'park street', 'the first floor', 'the second floor', 'the third floor', 'the plane', 'the bus', 'the train',
  'my birthday', 'christmas day', 'june 10th', 'may 5th', 'mondays', 'fridays', 'sundays', 'saturdays', 'monday morning', 'monday afternoon', 'friday night', 'sunday night', 'sunday evening', 'tuesday afternoon', 'saturday night', 'monday and tuesday'].concat(DAYS));
reg('at', ['home', 'work', 'school', 'the door', 'the bus stop', 'noon', 'night', 'midnight', '8:30'].concat(HOURS));
const KEYS = Object.keys(DICT).map(k => k.split(' ')).sort((a, b) => b.length - a.length);
function grammarErrors(text){
  const errs = []; if(/^(in|on|at)$/i.test(text.trim())) return errs;   // la palabra suelta (audio de vocabulario)
  text.replace(/[‘’]/g, "'").split(/(?<=[.?!])\s+/).forEach(s0 => {
    const w = s0.replace(/[.?!]$/, '').trim().toLowerCase().replace(/[,]/g, '').split(/\s+/);
    w.forEach((x, i) => {
      if(x !== 'in' && x !== 'on' && x !== 'at') return;
      const rest = w.slice(i + 1); const hit = KEYS.find(k => k.every((t, j) => rest[j] === t));
      if(!hit){ errs.push(s0 + ' -> expresion desconocida tras ' + x + ': ' + rest.slice(0, 3).join(' ')); return; }
      const want = DICT[hit.join(' ')]; if(want !== x) errs.push(s0 + ' -> con "' + hit.join(' ') + '" va ' + want + ', no ' + x);
    });
  });
  return errs;
}
const okSentence = t => grammarErrors(t).length === 0;
const hasPrep = t => /\b(in|on|at)\b/i.test(t);

test('estructura: 5 lecciones x 8 actividades, 30 de practica (6 por tema) y 50 de examen (10 por tema)', () => {
  assert.strictEqual(lessons.length, 5); assert.deepStrictEqual(Array.from(lessons.map(l => l.activities[0].topic)), TOPICS);
  lessons.forEach((l, i) => {
    assert.strictEqual(l.activities.length, 8, 'leccion ' + (i + 1));
    assert.deepStrictEqual(l.activities.slice(0, 4).map(a => a.type), ['choice', 'choice', 'choice', 'choice']);
    assert.deepStrictEqual(l.activities.slice(4, 7).map(a => a.type), ['match', 'type', 'error']);
    assert.strictEqual(l.activities[7].type, i === 4 ? 'write' : 'order');
    l.activities.forEach(a => { assert.strictEqual(a.topic, TOPICS[i]); assert(a.id.indexOf('l' + (i + 1) + '-a') === 0, 'id ' + a.id); });
    assert(l.canSay.length === 3 && l.screens.length === 5 || l.screens.length === 5, 'pantallas');
  });
  assert.strictEqual(practice.length, 30); assert.strictEqual(EXAM.length, 50);
  TOPICS.forEach(t => {
    assert.strictEqual(practice.filter(b => b.topic === t).length, 6, 'practica ' + t); assert.strictEqual(EXAM.filter(b => b.topic === t).length, 10, 'examen ' + t);
    assert.deepStrictEqual(EXAM.filter(b => b.topic === t).map(b => b.type).sort(), ['choice', 'choice', 'choice', 'choice', 'choice', 'choice', 'error', 'order', 'type', 'type']);
    assert(EXAM.filter(b => b.topic === t).every(b => b.id.indexOf('e-' + t[0]) === 0), 'ids e-' + t[0]);
    assert(practice.filter(b => b.topic === t).every(b => b.id.indexOf('x-' + t[0]) === 0));
  });
  assert.strictEqual(new Set(TOPICS.map(t => t[0])).size, 5, 'iniciales de tema unicas');
  assert.strictEqual(acts.length, 40);
});
test('ids unicos en todo el curso', () => {
  const ids = acts.map(a => a.id).concat(practice.map(b => b.id), EXAM.map(b => b.id)); assert.strictEqual(new Set(ids).size, ids.length); assert.strictEqual(new Set(lessons.map(l => l.id)).size, 5);
});
test('sin rayas largas, espanol latinoamericano e ingles de Estados Unidos', () => {
  const all = JSON.stringify([lessons, practice, EXAM]);
  assert(!/—/.test(all), 'raya larga');
  assert(!/\b(?:coche|conducir|football|vosotros|ordenador|zumo|colour|favourite|mum|holiday|flat|lift)\b/i.test(all), 'espanol / ingles no latinoamericano-americano');
  assert(!/\bat the (?:home|school|work)\b/i.test(all.replace(/Con home no se dice at the home[^"]*/, '')), 'at the home / school / work');
});
test('el oraculo detecta los errores tipicos (control del propio oraculo)', () => {
  ['She is in home.', 'I wake up in seven.', 'We have class in Monday.', 'The picture is in the wall.', 'She lives on Peru.', 'My birthday is at July.', 'He sleeps in night.', 'We are on a taxi.', 'My room is in the first floor.', 'The bank is in Main Street.', 'We work in Monday morning.']
    .forEach(t => assert(!okSentence(t), 'debio fallar: ' + t));
  ['She is at home.', 'I wake up at seven.', 'We have class on Monday.', 'The picture is on the wall.', 'She lives in Peru.', 'My birthday is in July.', 'He sleeps at night.', 'We are in a taxi.', 'My room is on the first floor.', 'The bank is on Main Street.', 'I work on Monday morning.', 'I study at home in the morning.']
    .forEach(t => assert(okSentence(t), 'debio pasar: ' + t));
});
const collect = () => {
  const o = [];
  lessons.forEach(l => { l.canSay.forEach(x => o.push(x)); l.screens.forEach(s => {
    (s.items || []).forEach(i => { if(isEnglishLine(i.en)) o.push(i.en); });
    (s.listen || []).forEach(x => o.push(x));
    if(s.compare) o.push(s.compare.right);
    if(s.table){ const wrongCol = s.table.head[0] === 'Incorrecto' ? 0 : -1; s.table.rows.forEach(r => r.forEach((c, ci) => { if(ci !== wrongCol && (/^(in|on|at) /i.test(c) || isEnglishLine(c))) o.push(c); })); } }); });
  acts.concat(practice).forEach(a => { if(a.say) o.push(a.say); if(a.fix) o.push(a.fix); if(a.example) o.push(a.example); if(a.tokens) o.push(a.tokens.join(' '));
    if(a.type === 'match') a.pairs.forEach(p => o.push(p[1]));
    if(a.type === 'choice'){ const r = a.options[a.answer]; if(isEnglishLine(r)) o.push(r); else if(a.q.indexOf('___') !== -1) o.push(holeSentence(a.q, r)); }
    if(a.type === 'type' && a.source) a.accepted.forEach(x => o.push(fill(a.source, x))); });
  EXAM.forEach(b => { if(b.type === 'choice'){ const r = b.answer.correct; if(isEnglishLine(r)) o.push(r); else o.push(holeSentence(b.public.q, r)); }
    if(b.type === 'type') b.answer.accepted.forEach(x => o.push(fill(b.public.source, x))); if(b.type === 'error') o.push(b.answer.fix); if(b.type === 'order') o.push(b.answer.order.join(' ')); });
  return o;
};
test('nunca se ensena una estructura incorrecta: toda frase en ingles que se ensena pasa el oraculo', () => {
  const o = collect().filter(x => x && (hasPrep(x) || isEnglishLine(x)));
  assert(o.length > 250, 'se analizaron ' + o.length);
  const SKIP = /^(where (are|is)|wait for me)/i; const bad = []; o.forEach(t => { if(!hasPrep(t) && !isEnglishLine(t)) return; grammarErrors(t).forEach(e => bad.push(e)); }); assert.deepStrictEqual(bad, []);
  lessons.forEach(l => l.screens.forEach(s => { if(s.compare){ assert(!okSentence(s.compare.wrong), 'compare.wrong parece correcta: ' + s.compare.wrong); assert(okSentence(s.compare.right), s.compare.right); }
    if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => { assert(/^Mal: /.test(r[0]), 'la celda incorrecta lleva Mal:'); assert(!okSentence(r[0].replace(/^Mal: /, '')), 'incorrecta parece correcta: ' + r[0]); assert(okSentence(r[1]), r[1]); }); }));
});
test('una sola respuesta correcta: de las opciones de cada pregunta solo una cumple la gramatica', () => {
  const bad = []; const items = acts.filter(a => a.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] }))
    .concat(practice.filter(b => b.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] })), EXAM.filter(b => b.type === 'choice').map(b => ({ id: b.id, q: b.public.q, options: b.public.options, correct: b.answer.correct })));
  assert.strictEqual(items.length, 20 + 15 + 30, 'preguntas de eleccion: ' + items.length);
  items.forEach(it => {
    assert.strictEqual(new Set(it.options.map(norm)).size, it.options.length, it.id + ' opciones repetidas');
    const texts = it.options.map(o => isEnglishLine(o) ? o : holeSentence(it.q, o));
    const good = texts.filter(okSentence); if(good.length !== 1) bad.push(it.id + ' correctas=' + good.length + ' ' + JSON.stringify(texts));
    else if(it.options[texts.indexOf(good[0])] !== it.correct) bad.push(it.id + ' la correcta no coincide');
  });
  assert.deepStrictEqual(bad, []);
});
test('errores: solo la frase marcada tiene error y la correccion es correcta; escribir: una sola respuesta; ordenar: frase correcta', () => {
  const bad = [];
  const errs = acts.concat(practice).filter(a => a.type === 'error').map(a => ({ id: a.id, o: a.options, w: a.wrong, fix: a.fix })).concat(EXAM.filter(b => b.type === 'error').map(b => ({ id: b.id, o: b.public.options, w: b.public.options.indexOf(b.answer.correct), fix: b.answer.fix })));
  assert.strictEqual(errs.length, 5 + 5 + 5);
  errs.forEach(e => { e.o.forEach((o, i) => { const ok = okSentence(o); if(i === e.w ? ok : !ok) bad.push(e.id + ' opcion ' + i + ' ' + o); }); if(!okSentence(e.fix)) bad.push(e.id + ' fix'); else if(norm(e.fix) === norm(e.o[e.w])) bad.push(e.id + ' fix igual al error'); });
  const types = acts.concat(practice).filter(a => a.type === 'type').map(a => ({ id: a.id, src: a.source, acc: a.accepted })).concat(EXAM.filter(b => b.type === 'type').map(b => ({ id: b.id, src: b.public.source, acc: b.answer.accepted })));
  assert.strictEqual(types.length, 5 + 5 + 10);
  types.forEach(t => { const variants = new Set(t.acc.map(norm)); if(variants.size !== 1) bad.push(t.id + ' acepta varias respuestas distintas'); t.acc.forEach(x => { const s = fill(t.src, x); if(!okSentence(s)) bad.push(t.id + ' ' + s); }); });
  const ords = acts.concat(practice).filter(a => a.type === 'order').map(a => ({ id: a.id, tok: a.tokens })).concat(EXAM.filter(b => b.type === 'order').map(b => ({ id: b.id, tok: b.answer.order })));
  assert.strictEqual(ords.length, 4 + 5 + 5);
  ords.forEach(o => { if(!okSentence(o.tok.join(' '))) bad.push(o.id + ' orden'); if(!/^[A-Z]/.test(o.tok[0])) bad.push(o.id + ' empieza en minuscula'); if(new Set(o.tok).size !== o.tok.length) bad.push(o.id + ' palabras repetidas (orden ambiguo)'); });
  assert.deepStrictEqual(bad, []);
});
test('escribir: la frase de ejemplo cumple su revision y las respuestas incorrectas no', () => {
  const w = acts.find(a => a.type === 'write'); const res = w.checks.map(c => new RegExp(c.re, c.flags));
  assert(res.every(r => r.test(w.example)), 'el ejemplo pasa'); assert(okSentence(w.example));
  ['I like pizza.', 'in the morning', 'She works at night.', 'on Monday'].forEach(t => assert(!res.every(r => r.test(t)), t + ' no debe pasar'));
  ['I work at home.', 'We study on Monday.', 'I am in Peru.'].forEach(t => assert(res.every(r => r.test(t)), t + ' debe pasar'));
});
test('sin frases repetidas: ninguna frase en ingles es la respuesta de dos ejercicios distintos (leccion, practica y examen)', () => {
  const S = {}; const add = (k, t) => { const n = norm(t).replace(/'/g, ''); (S[n] = S[n] || []).push(k); };
  acts.concat(practice).forEach(a => { const k = a.id;
    if(a.type === 'choice'){ const r = a.options[a.answer]; add(k, isEnglishLine(r) ? r : holeSentence(a.q, r)); }
    else if(a.type === 'match') a.pairs.forEach(p => add(k, p[1])); else if(a.type === 'type') add(k, fill(a.source, a.accepted[0])); else if(a.type === 'error') add(k, a.fix); else if(a.type === 'order') add(k, a.tokens.join(' ')); });
  EXAM.forEach(b => { const k = b.id; if(b.type === 'choice'){ const r = b.answer.correct; add(k, isEnglishLine(r) ? r : holeSentence(b.public.q, r)); } else if(b.type === 'type') add(k, fill(b.public.source, b.answer.accepted[0])); else if(b.type === 'error') add(k, b.answer.fix); else if(b.type === 'order') add(k, b.answer.order.join(' ')); });
  const dup = Object.keys(S).filter(t => S[t].length > 1).map(t => t + ' ' + S[t].join(',')); assert.deepStrictEqual(dup, []);
});
test('hole-choice con pregunta sin tildes lleva say (evita leer el espanol con voz inglesa); y las pistas dicen "dentro" o "sobre" cuando hace falta', () => {
  acts.filter(a => a.type === 'choice' && a.q.indexOf('___') !== -1).forEach(a => assert(a.say, 'falta say en ' + a.id));
  acts.filter(a => a.say).forEach(a => assert(okSentence(a.say) && isEnglishLine(a.say), 'say ' + a.id));
});
test('audio de las lecciones: toda frase en ingles es correcta, las incorrectas no estan en listen ni en items y las celdas con ejemplo en ingles tienen listen', () => {
  const miss = []; lessons.forEach(l => l.screens.forEach(s => {
    const listen = new Set((s.listen || []).concat((s.items || []).map(i => i.en)).map(t => String(t).toLowerCase()));
    if(s.table){ const wrongCol = s.table.head[0] === 'Incorrecto' ? 0 : -1;
      s.table.rows.forEach(r => r.forEach((c, ci) => { if(ci === wrongCol) return; if((/^(in|on|at)\b/i.test(c) || isEnglishLine(c)) && !listen.has(c.toLowerCase())) miss.push(l.id + ': ' + c); })); }
    (s.listen || []).forEach(t => { if(hasPrep(t) && !okSentence(t)) miss.push('audio incorrecto: ' + t); });
    (s.items || []).forEach(i => { if(!okSentence(i.en)) miss.push('item incorrecto: ' + i.en); }); }));
  assert.deepStrictEqual(miss, []);
  const wrongs = new Set(); lessons.forEach(l => l.screens.forEach(s => { if(s.compare) wrongs.add(s.compare.wrong.toLowerCase()); if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => wrongs.add(r[0].replace(/^Mal: /, '').toLowerCase())); }));
  lessons.forEach(l => l.screens.forEach(s => (s.listen || []).concat((s.items || []).map(i => i.en)).forEach(t => assert(!wrongs.has(String(t).toLowerCase()), 'audio de frase incorrecta: ' + t))));
});
console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : '')); process.exit(failed ? 1 : 0);
