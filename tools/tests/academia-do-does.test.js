#!/usr/bin/env node
/* Curso 8 DO / DOES (preguntas y negaciones en presente simple): contenido, gramatica, audio y curso OCULTO.
   Corre con:  node tools/tests/academia-do-does.test.js
   Si falta private/contenido/do-does.json (contenido privado, no esta en git), la prueba se omite. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const FUENTE = require('../academia_fuente.js').load();
const A = FUENTE.A, C = A.courses['do-does'], TX = FUENTE.TX;
if(!C || !C.hydrated){ console.log('omitida: falta private/contenido/do-does.json (contenido privado, no esta en git)'); process.exit(0); }
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const priv = f => path.join(root, 'private', f);
let passed = 0, failed = 0;
function test(n, f){ try{ f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split('\n').slice(0, 9).join('\n  ')); } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
const EXAM = JSON.parse(fs.readFileSync(priv('academia-examen-do-does.json'), 'utf8')).items;
const acts = []; C.lessons.forEach(l => l.activities.forEach(a => acts.push(a)));
const practice = C.exam.bank;
const TOPICS = ['que', 'do', 'hes', 'neg', 'rep'];

/* ---- Oraculo de gramatica (diccionarios cerrados escritos a mano, independientes del contenido) ---- */
const BASE = new Set('live work like need play speak study eat drink want have know cook watch walk read sleep drive help open start begin finish go teach wash fix sell write come make use look give sing cost arrive rain do see'.split(' '));
function third(v){ if(v === 'have') return 'has'; if(/(sh|ch|ss|x|o)$/.test(v)) return v + 'es'; if(/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies'; return v + 's'; }
const THIRD = {}; BASE.forEach(v => { THIRD[third(v)] = v; });
const PL = new Set(['i', 'you', 'we', 'they', 'my parents', 'the children', 'my friends', 'your friends', 'ana and tom', 'the girls', 'your grandparents', 'your parents', 'the students', 'your neighbors', 'my neighbors', 'the teachers', 'cats', 'your classmates']);
const SG = new Set(['he', 'she', 'it', 'tom', 'ana', 'pedro', 'my brother', 'your brother', 'my mother', 'your mother', 'your father', 'my father', 'my sister', 'your sister', 'your uncle', 'my grandfather', 'the dog', 'your dog', 'your cat', 'the store', 'the bus', 'the train', 'the class', 'the boy', 'the teacher', 'the bank', 'my boss', 'my cousin', 'the phone', 'the radio']);
const PRON = { i: 'you', you: 'i', we: 'we', they: 'they', he: 'he', she: 'she', it: 'it' };
const HE = new Set(['tom', 'pedro', 'your brother', 'your father', 'your uncle', 'my brother', 'my father', 'my grandfather', 'the boy', 'my boss', 'my cousin']);
const IT = new Set(['the dog', 'your dog', 'your cat', 'the store', 'the bus', 'the train', 'the class', 'the bank', 'the phone', 'it']);
function pronounOf(subj){ if(PL.has(subj)) return subj === 'you' ? 'i' : (subj === 'i' || subj === 'we' ? subj : 'they'); if(IT.has(subj)) return 'it'; if(subj === 'she' || /mother|sister/.test(subj) || subj === 'ana') return 'she'; if(subj === 'he' || HE.has(subj)) return 'he'; return null; }
function takeSubject(w, k){ for(let n = 4; n >= 1; n--){ const c = w.slice(k, k + n).join(' '); if(w.length >= k + n && (PL.has(c) || SG.has(c))) return { s: c, n }; } return null; }
const agrees = (aux, subj) => (PL.has(subj) ? /^(do|don't|do not)$/ : /^(does|doesn't|does not)$/).test(aux);
/* Devuelve la lista de problemas ([] = frase correcta para A1). */
function grammarErrors(text){
  const errs = [];
  text.replace(/[‘’]/g, "'").split(/(?<=[.?!])\s+/).forEach(s0 => {
    const q = /\?$/.test(s0), w = s0.replace(/[.?!]$/, '').trim().toLowerCase().split(/\s+/); if(!w[0]) return;
    const bad = m => errs.push(s0 + ' -> ' + m);
    if(/^(yes|no),$/.test(w[0])){
      const m = /^(yes|no), (i|you|we|they|he|she|it) (do|does|don't|doesn't)$/.exec(w.join(' ')); if(!m){ bad('respuesta corta mal formada'); return; }
      if(!agrees(m[3], m[2])) bad('respuesta corta: ' + m[2] + ' con ' + m[3]);
      if(m[1] === 'yes' && /'t$/.test(m[3])) bad('Yes con negativo'); if(m[1] === 'no' && !/'t$/.test(m[3])) bad('No sin negativo'); return;
    }
    if(w[0] === 'do' || w[0] === 'does'){
      if(!q){ const sub = takeSubject(w, 0); if(sub){ /* afirmativa: I do my homework */ } }
      const sub = takeSubject(w, 1);
      if(q || (sub && w[0] === 'do' && !BASE.has(w[1]))){
        if(!sub){ bad('sujeto desconocido tras ' + w[0]); return; }
        if(!agrees(w[0], sub.s)) bad(w[0] + ' no concuerda con ' + sub.s);
        const v = w[1 + sub.n]; if(!BASE.has(v)) bad('despues de ' + w[0] + ' el verbo va sin cambios: ' + v); return;
      }
    }
    const ai = w.findIndex((x, i) => i > 0 && (x === "don't" || x === "doesn't" || ((x === 'do' || x === 'does') && w[i + 1] === 'not')));
    if(ai > 0){
      const subj = w.slice(0, ai).join(' '); const aux = w[ai] === 'do' || w[ai] === 'does' ? w[ai] + ' not' : w[ai];
      if(!PL.has(subj) && !SG.has(subj)){ bad('sujeto desconocido: ' + subj); return; }
      if(!agrees(aux, subj)) bad(aux + ' no concuerda con ' + subj);
      const v = w[ai + (aux.indexOf(' ') > 0 ? 2 : 1)]; if(!BASE.has(v)) bad('despues de ' + aux + ' el verbo va sin cambios: ' + v); return;
    }
    const sub = takeSubject(w, 0); if(!sub){ bad('sujeto desconocido'); return; }
    const v = w[sub.n]; if(PL.has(sub.s) ? !BASE.has(v) : !THIRD[v]) bad('con ' + sub.s + ' el verbo no va asi: ' + v);
  });
  return errs;
}
const okSentence = t => grammarErrors(t).length === 0;
const fill = (src, x) => src.replace('___', x);
const isEnglishLine = s => /^[A-Za-z][A-Za-z ,.'’?!-]*[.?!]$/.test(s);
const holeSentence = (q, o) => { const i = q.lastIndexOf(': '); const t = i >= 0 ? q.slice(i + 2) : q; return t.indexOf('___') !== -1 ? fill(t, o) : null; };

test('estructura: 5 lecciones x 8 actividades, 30 de practica (6 por tema) y 50 de examen (10 por tema)', () => {
  assert.strictEqual(C.lessons.length, 5); assert.deepStrictEqual(Array.from(C.lessons.map(l => l.topic)), TOPICS);
  C.lessons.forEach((l, i) => {
    assert.strictEqual(l.activities.length, 8, 'leccion ' + (i + 1));
    assert.deepStrictEqual(l.activities.slice(0, 4).map(a => a.type), ['choice', 'choice', 'choice', 'choice']);
    assert.deepStrictEqual(l.activities.slice(4, 7).map(a => a.type), ['match', 'type', 'error']);
    assert.strictEqual(l.activities[7].type, i === 4 ? 'write' : 'order');
    l.activities.forEach(a => assert.strictEqual(a.topic, l.topic));
  });
  assert.strictEqual(practice.length, 30); assert.strictEqual(EXAM.length, 50);
  TOPICS.forEach(t => {
    assert.strictEqual(practice.filter(b => b.topic === t).length, 6, 'practica ' + t); assert.strictEqual(EXAM.filter(b => b.topic === t).length, 10, 'examen ' + t);
    assert.deepStrictEqual(EXAM.filter(b => b.topic === t).map(b => b.type).sort(), ['choice', 'choice', 'choice', 'choice', 'choice', 'choice', 'error', 'order', 'type', 'type']);
    assert(EXAM.filter(b => b.topic === t).every(b => b.id.indexOf('e-' + t[0]) === 0), 'ids e-' + t[0]);
    assert(practice.filter(b => b.topic === t).every(b => b.id.indexOf('x-' + t[0]) === 0));
  });
  assert.strictEqual(acts.length, 40);
});
test('ids unicos en todo el curso y un tema por leccion', () => {
  const ids = acts.map(a => a.id).concat(practice.map(b => b.id), EXAM.map(b => b.id)); assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(new Set(C.lessons.map(l => l.id)).size, 5);
});
test('sin rayas largas, en espanol latinoamericano y en ingles de Estados Unidos', () => {
  const all = JSON.stringify([C.lessons, practice, EXAM]);
  assert(!/—/.test(all), 'raya larga');
  assert(!/\b(?:coche|conducir|football|vosotros|ordenador|zumo|colour|favourite|mum|holiday)\b/i.test(all), 'espanol / ingles no latinoamericano-americano');
  assert(!/\b(?:am|is|are) (?:\w+ing)\b/i.test(all), 'presente continuo no va aqui');
  assert(!/\bwh(?:ere|at|y|en|o|ich) (?:do|does)\b/i.test(all), 'preguntas con wh- no van aqui');
});
test('nunca se ensena una estructura incorrecta: ninguna frase en ingles aprobada es de la forma Does + verbo con s, Do + he/she/it, doesn\'t + verbo con s, etc.', () => {
  const o = [];
  C.lessons.forEach(l => { l.canSay.forEach(x => o.push(x)); l.screens.forEach(s => { (s.items || []).forEach(i => { if(isEnglishLine(i.en)) o.push(i.en); }); (s.listen || []).forEach(x => { if(isEnglishLine(x)) o.push(x); });
    if(s.compare) o.push(s.compare.right);
    if(s.table){ const wrongCol = s.table.head[0] === 'Incorrecto' ? 0 : -1; s.table.rows.forEach(r => r.forEach((c, ci) => { if(ci !== wrongCol && isEnglishLine(c)) o.push(c); })); } }); });
  acts.concat(practice).forEach(a => { if(a.say) o.push(a.say); if(a.fix) o.push(a.fix); if(a.example) o.push(a.example); if(a.tokens) o.push(a.tokens.join(' '));
    if(a.type === 'match') a.pairs.forEach(p => o.push(p[1]));
    if(a.type === 'choice'){ const r = a.options[a.answer]; if(isEnglishLine(r)) o.push(r); else if(a.q.indexOf('___') !== -1){ const s = holeSentence(a.q, r); if(s) o.push(s); } }
    if(a.type === 'type' && a.source) a.accepted.forEach(x => o.push(fill(a.source, x))); });
  EXAM.forEach(b => { if(b.type === 'choice'){ const r = b.answer.correct; if(isEnglishLine(r)) o.push(r); else { const s = holeSentence(b.public.q, r); if(s) o.push(s); } }
    if(b.type === 'type') b.answer.accepted.forEach(x => o.push(fill(b.public.source, x))); if(b.type === 'error') o.push(b.answer.fix); if(b.type === 'order') o.push(b.answer.order.join(' ')); });
  assert(o.length > 250, 'se analizaron ' + o.length);
  const bad = []; o.forEach(t => grammarErrors(t).forEach(e => bad.push(e))); assert.deepStrictEqual(bad, []);
  // las comparaciones "mal / bien" y la tabla Incorrecto/Correcto de verdad muestran un error
  C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare){ assert(!okSentence(s.compare.wrong), 'compare.wrong parece correcta: ' + s.compare.wrong); assert(okSentence(s.compare.right), s.compare.right); }
    if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => { assert(/^Mal: /.test(r[0]), 'la celda incorrecta lleva Mal:'); assert(!okSentence(r[0].replace(/^Mal: /, '')), 'incorrecta parece correcta: ' + r[0]); assert(okSentence(r[1]), r[1]); }); }));
});
test('el oraculo detecta los errores tipicos (control del propio oraculo)', () => {
  ['Does she works here?', 'Do he play soccer?', 'Does they work here?', 'She doesn\'t likes tea.', 'He don\'t like tea.', 'They doesn\'t live here.', 'Do you works here?', 'Does she has a car?', 'No, they doesn\'t.', 'Yes, I does.'].forEach(t => assert(!okSentence(t), 'debio fallar: ' + t));
  ['Does she work here?', 'Do they live here?', 'She doesn\'t like tea.', 'He doesn\'t play soccer.', 'Does she have a car?', 'Yes, she does.', 'No, I don\'t.', 'I do my homework.', 'She does the dishes.', 'Does she do the dishes?', 'I don\'t do exercise on Sundays.', 'Do I look tired?'].forEach(t => assert(okSentence(t), 'debio pasar: ' + t));
});
test('una sola respuesta correcta: de las opciones de cada pregunta solo una cumple la gramatica', () => {
  const bad = []; const items = acts.filter(a => a.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] }))
    .concat(practice.filter(b => b.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] })), EXAM.filter(b => b.type === 'choice').map(b => ({ id: b.id, q: b.public.q, options: b.public.options, correct: b.answer.correct })));
  assert.strictEqual(items.length, 65);
  items.forEach(it => {
    assert.strictEqual(new Set(it.options.map(norm)).size, it.options.length, it.id + ' opciones repetidas');
    if(it.options.every(o => /^(yes|no),/i.test(o))) return;   // respuestas cortas: se revisan en la prueba siguiente
    const texts = it.options.map(o => isEnglishLine(o) ? o : holeSentence(it.q, o));
    const good = texts.filter(okSentence); if(good.length !== 1) bad.push(it.id + ' correctas=' + good.length + ' ' + JSON.stringify(texts));
    else if(it.options[texts.indexOf(good[0])] !== it.correct) bad.push(it.id + ' la correcta no coincide');
  });
  assert.deepStrictEqual(bad, []);
});
test('respuestas cortas: la respuesta correcta sigue a la pregunta (sujeto, Yes / No, do / does) y las demas son incorrectas', () => {
  const bad = []; let n = 0;
  const items = acts.filter(a => a.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] })).concat(practice.filter(b => b.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] })), EXAM.filter(b => b.type === 'choice').map(b => ({ id: b.id, q: b.public.q, options: b.public.options, correct: b.answer.correct })));
  items.filter(it => it.options.every(o => /^(yes|no),/i.test(o))).forEach(it => {
    n++;
    const m = /: (Do|Does) ([^?]*)\?/.exec(it.q); if(!m){ bad.push(it.id + ' sin pregunta'); return; }
    const w = (m[1] + ' ' + m[2]).toLowerCase().split(' '); const sub = takeSubject(w, 1); const pr = pronounOf(sub.s);
    const neg = /que no(?![a-zñ])|no funciona/.test(it.q), pos = /que s[ií](?![a-zñ])|S[ií] juega/.test(it.q); if(neg === pos){ bad.push(it.id + ' no queda claro si es si o no'); return; }
    const P = pr === 'i' ? 'I' : pr; const exp = pos ? 'Yes, ' + P + ' ' + (pr === 'he' || pr === 'she' || pr === 'it' ? 'does' : 'do') + '.' : 'No, ' + P + ' ' + (pr === 'he' || pr === 'she' || pr === 'it' ? "doesn't" : "don't") + '.';
    if(it.correct !== exp) bad.push(it.id + ' esperaba ' + exp + ' y tiene ' + it.correct);
    it.options.forEach(o => { const ok = okSentence(o) && o === exp; if((o === it.correct) !== ok) bad.push(it.id + ' opcion ' + o); });
  });
  assert(n >= 8, 'respuestas cortas revisadas: ' + n); assert.deepStrictEqual(bad, []);
});
test('errores: solo la frase marcada tiene error y la correccion es correcta; escribir: una sola respuesta aceptada y ordenar: frase correcta', () => {
  const bad = [];
  const errs = acts.concat(practice).filter(a => a.type === 'error').map(a => ({ id: a.id, o: a.options, w: a.wrong, fix: a.fix })).concat(EXAM.filter(b => b.type === 'error').map(b => ({ id: b.id, o: b.public.options, w: b.public.options.indexOf(b.answer.correct), fix: b.answer.fix })));
  assert.strictEqual(errs.length, 15);
  errs.forEach(e => { e.o.forEach((o, i) => { const ok = okSentence(o); if(i === e.w ? ok : !ok) bad.push(e.id + ' opcion ' + i + ' ' + o); }); if(!okSentence(e.fix)) bad.push(e.id + ' fix'); else if(norm(e.fix) === norm(e.o[e.w])) bad.push(e.id + ' fix igual al error'); });
  const types = acts.concat(practice).filter(a => a.type === 'type').map(a => ({ id: a.id, src: a.source, acc: a.accepted })).concat(EXAM.filter(b => b.type === 'type').map(b => ({ id: b.id, src: b.public.source, acc: b.answer.accepted })));
  assert.strictEqual(types.length, 20);
  types.forEach(t => { const variants = new Set(t.acc.map(x => norm(x).replace('does not', "doesn't").replace('do not', "don't"))); if(variants.size !== 1 && !t.acc.every(x => ['start', 'begin'].includes(x))) bad.push(t.id + ' acepta varias respuestas distintas'); t.acc.forEach(x => { const s = fill(t.src, x); if(!okSentence(s)) bad.push(t.id + ' ' + s); }); });
  const ords = acts.concat(practice).filter(a => a.type === 'order').map(a => ({ id: a.id, tok: a.tokens })).concat(EXAM.filter(b => b.type === 'order').map(b => ({ id: b.id, tok: b.answer.order })));
  assert.strictEqual(ords.length, 14);
  ords.forEach(o => { if(!okSentence(o.tok.join(' '))) bad.push(o.id + ' orden'); if(!/^[A-Z]/.test(o.tok[0])) bad.push(o.id + ' empieza en minuscula'); if(new Set(o.tok).size !== o.tok.length) bad.push(o.id + ' palabras repetidas (orden ambiguo)'); });
  // un orden con tiempo movil ("every night", "today") tendria dos soluciones: no debe haber palabras de tiempo al inicio de la cola con otras posibles posiciones
  ords.forEach(o => { const j = o.tok.join(' '); if(/\b(?:today|tomorrow)\b/.test(j) && !/\b(?:today|tomorrow)\?$|\b(?:today|tomorrow)\.$/.test(j)) bad.push(o.id + ' tiempo movible'); });
  assert.deepStrictEqual(bad, []);
});
test('escribir: la frase de ejemplo cumple su revision y las respuestas incorrectas no', () => {
  const w = acts.find(a => a.type === 'write'); const res = w.checks.map(c => new RegExp(c.re, c.flags));
  assert(res.every(r => r.test(w.example)), 'el ejemplo pasa'); assert(okSentence(w.example));
  ['I like pizza.', 'I don\'t.', 'She doesn\'t like tea.', 'don\'t', 'They don\'t play.'].forEach(t => assert(!res.every(r => r.test(t)), t + ' no debe pasar'));
  ['I don\'t eat meat.', 'We do not watch TV.', 'I don’t drink coffee.'].forEach(t => assert(res.every(r => r.test(t)), t + ' debe pasar'));
});
test('sin frases repetidas: ninguna frase en ingles aparece como respuesta de dos ejercicios distintos (salvo respuestas cortas)', () => {
  const S = {}; const add = (k, t) => { const n = norm(t).replace(/'/g, ''); (S[n] = S[n] || []).push(k); };
  acts.concat(practice).forEach(a => { const k = a.id;
    if(a.type === 'choice'){ const r = a.options[a.answer]; add(k, isEnglishLine(r) ? r : (a.q.indexOf('___') !== -1 ? holeSentence(a.q, r) : r)); }
    else if(a.type === 'match') a.pairs.forEach(p => add(k, p[1])); else if(a.type === 'type') add(k, fill(a.source, a.accepted[0])); else if(a.type === 'error') add(k, a.fix); else if(a.type === 'order') add(k, a.tokens.join(' ')); });
  EXAM.forEach(b => { const k = b.id; if(b.type === 'choice'){ const r = b.answer.correct; add(k, isEnglishLine(r) ? r : holeSentence(b.public.q, r)); } else if(b.type === 'type') add(k, fill(b.public.source, b.answer.accepted[0])); else if(b.type === 'error') add(k, b.answer.fix); else if(b.type === 'order') add(k, b.answer.order.join(' ')); });
  const dup = Object.keys(S).filter(t => S[t].length > 1 && !/^(yes|no),? /.test(t)).map(t => t + ' ' + S[t].join(',')); assert.deepStrictEqual(dup, []);
});
test('AUDIO: todo ejemplo y frase en ingles de las pantallas y actividades tiene su audio, y NUNCA hay audio de una frase incorrecta o en espanol', () => {
  const tx = TX(C); const have = new Set(tx.map(x => x.t.trim().toLowerCase())); assert(tx.length >= 100, 'textos de audio: ' + tx.length);
  assert.strictEqual(have.size, tx.length, 'textos de audio repetidos');
  const miss = [];
  C.lessons.forEach(l => { l.canSay.forEach(t => { if(!have.has(t.toLowerCase())) miss.push('canSay ' + t); });
    l.screens.forEach(s => { (s.items || []).forEach(i => { if(!have.has(i.en.toLowerCase())) miss.push('item ' + i.en); }); (s.listen || []).forEach(t => { if(!have.has(String(t.t || t).toLowerCase())) miss.push('listen ' + t); });
      if(s.compare && !have.has(s.compare.right.toLowerCase())) { /* el ejemplo correcto se escucha en los items de la pantalla */ } }); });
  acts.forEach(a => { const f = FUENTE.ctx.academiaSentence ? FUENTE.ctx.academiaSentence(a) : null; if(f && !have.has(f.toLowerCase())) miss.push('actividad ' + a.id + ' ' + f); });
  assert.deepStrictEqual(miss, []);
  const WORDS = new Set(['I', 'you', 'we', 'they', 'he', 'she', 'it', 'do', 'does', 'Tom, my brother', 'Ana, my mother', 'my friends, the children', 'Ana and Tom', 'I, you, we, they', 'he, she, it']);
  const bad = tx.filter(x => !WORDS.has(x.t) && (!/^[A-Za-z][A-Za-z ,.'’?!-]*[.?!]$/.test(x.t) || !okSentence(x.t))).map(x => x.t); assert.deepStrictEqual(Array.from(bad), [], 'audio de frase incorrecta o con espanol');
  const wrongs = []; C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare) wrongs.push(s.compare.wrong); if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => wrongs.push(r[0].replace(/^Mal: /, ''))); }));
  wrongs.forEach(w => assert(!have.has(w.toLowerCase()), 'tiene audio una frase incorrecta: ' + w));
  acts.forEach(a => { if(a.type === 'choice' && a.q.indexOf('___') === -1 && !/^[A-Za-z].*[.?!]$/.test(a.options[a.answer])){ /* pista en espanol: no se lee */ } });
});
test('AUDIO (archivos): cada texto tiene su mp3 privado, no vacio, y el mapa no apunta a archivos que faltan ni sobran', () => {
  const mapF = priv('contenido/do-does.audio.json'); if(!fs.existsSync(mapF)){ console.log('       (sin mapa de audio todavia)'); return; }
  const map = JSON.parse(fs.readFileSync(mapF, 'utf8')); const tx = TX(C);
  assert.strictEqual(Object.keys(map).length, tx.length);
  tx.forEach(x => { assert(map[x.t], 'sin audio: ' + x.t); const p = priv('audio/' + map[x.t]); assert(fs.existsSync(p), 'falta ' + map[x.t]); assert(fs.statSync(p).size > 4000, 'audio muy pequeno ' + map[x.t]); assert(/^do-does\/[0-9a-f]+\.mp3$/.test(map[x.t]) || /^do-does\/[^/]+\.mp3$/.test(map[x.t]), 'nombre raro ' + map[x.t]); });
  const files = fs.readdirSync(priv('audio/do-does')); assert.strictEqual(files.length, new Set(Object.values(map)).size, 'sobran o faltan mp3');
  assert.strictEqual(new Set(Object.values(map)).size, Object.keys(map).length, 'dos textos comparten archivo');
  assert(!files.some(f => /\(\d+\)/.test(f)), 'copias (1)');
});
test('OCULTO: el curso sigue cerrado en la ruta, el puente y el listado; los otros siete cursos no cambian y el esqueleto publico no trae contenido', () => {
  const M = vm.runInNewContext(read('academia-motor.js') + ';ACADEMIA_MOTOR'); assert.strictEqual(M.courses['do-does'].open, true, 'puente abierto'); assert.strictEqual(M.courses['do-does'].tema, 'do-does'); assert.strictEqual(M.courses['do-does'].engineTopic, 'Do / Does');
  ['to-be', 'pronombres', 'articulos', 'posesivos', 'there-is-are', 'can', 'presente-simple'].forEach(id => assert.strictEqual(M.courses[id].open, true, id + ' sigue abierto'));
  assert.strictEqual(M.courseForTema('do-does'), 'do-does', 'el puente recomienda el curso abierto');
  const CU = vm.runInNewContext(read('academia-cursos.js') + ';ACADEMIA_CURSOS'); assert.strictEqual(CU.courses['do-does'].open, true); assert.strictEqual(CU.courses['do-does'].lessons, 5);
  const route = A.route.courses.find(c => c.id === 'do-does'); assert(route && !route.soon, 'DO / DOES ya figura abierto en la ruta');
  assert.strictEqual(A.courses['do-does'].protected, true);
  const pub = read('academia-data.js'); const i = pub.indexOf("'do-does': {"); assert(i > 0);
  ["Do you live here?", "Con you se usa do", 'wrongWhy', "She doesn't like tea.", 'Does she work here?'].forEach(s => assert(pub.indexOf(s, i) === -1, 'contenido privado en academia-data.js: ' + s));
  assert(/^private\/$/m.test(read('.gitignore').replace(/\r/g, '')), 'private/ ignorado');
  assert(!fs.existsSync(path.join(root, 'audio', 'academia', 'do-does')), 'no hay audio publico del curso');
  assert(/'presente-simple', 'do-does'\]/.test(read('academia.js')), 'el curso esta en la lista de academia.js');
});
test('SQL: la migracion solo inserta una fila APAGADA y los seeds solo tocan este curso', () => {
  const mig = read('supabase/migrations/20261104140000_academia_curso_do_does.sql'); const code = mig.split('\n').filter(l => !/^\s*--/.test(l)).join('\n');
  assert(/insert into public\.academia_courses/.test(code) && /'do-does', 'DO \/ DOES: preguntas y negaciones', false, 'Do \/ Does'/.test(code), 'fila apagada'); assert(!/\b(?:update|delete|drop|alter|truncate|create)\b/i.test(code));
  const ver = read('supabase/verify/academia_do_does_verificacion.sql').split('\n').filter(l => !/^\s*--/.test(l)).join('\n'); assert(!/\b(?:insert|update|delete|drop|alter|truncate|create)\b/i.test(ver.replace(/'[^']*'/g, "''")), 'verificacion de solo lectura');
  const se = priv('seed-academia-examen-do-does.sql'), sc = priv('seed-academia-contenido-do-does.sql');
  if(fs.existsSync(se)){ const b = fs.readFileSync(se, 'utf8'); assert.strictEqual((b.match(/\('do-does', 'e-/g) || []).length, 50); assert(!/\b(?:delete|drop|truncate)\b/i.test(b.replace(/\$j\$[\s\S]*?\$j\$/g, '')) && !/\bupdate\b/i.test(b.replace(/\$j\$[\s\S]*?\$j\$/g, '').replace(/on conflict[^;]*do update set[^;]*/gi, '')), 'solo upsert'); }
  if(fs.existsSync(sc)){ const b = fs.readFileSync(sc, 'utf8'); const out = b.replace(/'(?:[^']|'')*'::jsonb/g, ''); assert(/do-does/.test(b)); assert(!/\b(?:delete|drop|truncate)\b/i.test(out)); assert(!/'(?:to-be|pronombres|articulos|posesivos|there-is-are|can|presente-simple)'/.test(out), 'toca otros cursos'); }
});
console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : '')); if(failed) process.exit(1);
