#!/usr/bin/env node
/* Curso 9 WH-QUESTIONS (what, where, when, who, why, how): contenido, gramatica y audio (textos).
   Corre con:  node tools/tests/academia-wh.test.js
   Si falta private/contenido/wh.json (contenido privado, no esta en git), la prueba se omite.
   NOTA: el curso todavia NO esta integrado en academia-data.js ni en el puente. Esta prueba lee el contenido privado directamente.
   TODO (cuando se integre): agregar las pruebas OCULTO (ruta, puente, listado), SQL (migracion y seeds) y AUDIO (archivos mp3), copiandolas de academia-do-does.test.js. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const priv = f => path.join(root, 'private', f);
if(!fs.existsSync(priv('contenido/wh.json')) || !fs.existsSync(priv('academia-examen-wh.json'))){ console.log('omitida: falta private/contenido/wh.json (contenido privado, no esta en git)'); process.exit(0); }
const FUENTE = require('../academia_fuente.js'); const ctx = FUENTE.loadData(); const TX = ctx.TX;
const content = JSON.parse(fs.readFileSync(priv('contenido/wh.json'), 'utf8'));
const EXAM = JSON.parse(fs.readFileSync(priv('academia-examen-wh.json'), 'utf8')).items;
const C = { id: 'wh', protected: true, hydrated: true, lessons: content.lessons, exam: { bank: content.practice } };
let passed = 0, failed = 0;
function test(n, f){ try{ f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split('\n').slice(0, 9).join('\n  ')); } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
const acts = []; C.lessons.forEach(l => l.activities.forEach(a => acts.push(a)));
const practice = C.exam.bank;
const TOPICS = ['bas', 'tim', 'ser', 'aux', 'mix'];

/* ---- Oraculo de gramatica (diccionarios cerrados escritos a mano, independientes del contenido) ---- */
const BASE = new Set('live work like need play speak study eat drink want have know cook watch walk sleep drive help open close start begin finish go teach wash fix sell write come make use look give sing cost arrive leave meet call buy learn read say get see take stay do'.split(' '));
function third(v){ if(v === 'have') return 'has'; if(/(sh|ch|ss|x|o)$/.test(v)) return v + 'es'; if(/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies'; return v + 's'; }
const THIRD = {}; BASE.forEach(v => { THIRD[third(v)] = v; });
const PL = new Set(['i', 'you', 'we', 'they', 'these', 'those', 'my parents', 'your parents', 'my friends', 'your friends', 'the children', 'the students', 'your grandparents', 'your cousins', 'your neighbors', 'your teachers', 'your kids', 'my keys', 'your shoes', 'the restrooms']);
const SG = new Set(['he', 'she', 'it', 'this', 'that', 'tom', 'ana', 'pedro', 'my name', 'your name', 'your house', 'my phone', 'your teacher', 'the teacher', 'your sister', 'your brother', 'your father', 'your mother', 'your uncle', 'your friend', 'your best friend', 'your favorite color', 'your grandmother', 'your grandfather', 'your birthday', 'your doctor', 'the class', 'the english class', 'the store', 'the bank', 'the bus', 'the party', 'the concert', 'the weather', 'the library', 'the market', 'the school', 'the airport', 'the station', 'the restaurant', 'the hospital', 'the park', 'your dog', 'my brother']);
const WHS = ['what time', 'how old', 'what', 'where', 'when', 'who', 'why', 'how'];
function takeSubject(w, k){ for(let n = 4; n >= 1; n--){ const c = w.slice(k, k + n).join(' '); if(w.length >= k + n && (PL.has(c) || SG.has(c))) return { s: c, n }; } return null; }
const agrees = (aux, subj) => (PL.has(subj) ? /^(do|don't|do not)$/ : /^(does|doesn't|does not)$/).test(aux);
/* Devuelve la lista de problemas ([] = frase correcta para A1). */
function grammarErrors(text){
  const errs = [];
  text.replace(/[‘’]/g, "'").split(/(?<=[.?!])\s+/).forEach(s0 => {
    const q = /\?$/.test(s0); let w = s0.replace(/[.?!]$/, '').trim().toLowerCase().split(/\s+/); if(!w[0]) return;
    const bad = m => errs.push(s0 + ' -> ' + m);
    if(w[0] === 'because') w = w.slice(1);
    const wh = WHS.find(x => w.slice(0, x.split(' ').length).join(' ') === x);
    if(wh){
      const rest = w.slice(wh.split(' ').length); if(!q) bad('pregunta sin signo de pregunta');
      const aux = rest[0];
      if(aux === 'is' || aux === 'are' || aux === 'am'){
        const sub = takeSubject(rest, 1); if(!sub){ bad('sujeto desconocido tras ' + aux); return; }
        const ok = aux === 'am' ? sub.s === 'i' : aux === 'is' ? SG.has(sub.s) : (PL.has(sub.s) && sub.s !== 'i');
        if(!ok) bad(aux + ' no concuerda con ' + sub.s);
        rest.slice(1 + sub.n).forEach(x => { if(BASE.has(x)) bad('verbo de accion sin do o does: ' + x); });
      } else if(aux === 'do' || aux === 'does'){
        const sub = takeSubject(rest, 1); if(!sub){ bad('sujeto desconocido tras ' + aux); return; }
        if(!agrees(aux, sub.s)) bad(aux + ' no concuerda con ' + sub.s);
        const v = rest[1 + sub.n]; if(!BASE.has(v)) bad('despues de ' + aux + ' el verbo va sin cambios: ' + v);
      } else bad('falta el ayudante (is, are, do o does) despues de ' + wh);
      return;
    }
    if(q){ bad('pregunta que no empieza con palabra wh reconocida'); return; }
    const sub = takeSubject(w, 0); if(!sub){ bad('sujeto desconocido'); return; }
    const v = w[sub.n];
    if(v === 'am' || v === 'is' || v === 'are'){ const ok = v === 'am' ? sub.s === 'i' : v === 'is' ? SG.has(sub.s) : (PL.has(sub.s) && sub.s !== 'i'); if(!ok) bad(v + ' no concuerda con ' + sub.s); return; }
    if(PL.has(sub.s) ? !BASE.has(v) : !THIRD[v]) bad('con ' + sub.s + ' el verbo no va asi: ' + v);
  });
  return errs;
}
const okSentence = t => grammarErrors(t).length === 0;
const fill = (src, x) => src.replace('___', x);
const isEnglishLine = s => /^[A-Za-z][A-Za-z ,.'’?!-]*[.?!]$/.test(s);
const holeSentence = (q, o) => { const i = q.lastIndexOf(': '); const t = i >= 0 ? q.slice(i + 2) : q; return t.indexOf('___') !== -1 ? fill(t, o) : null; };
const WHWORDS = new Set(['what', 'where', 'who', 'when', 'why', 'how']);
function whKey(q){   // palabra wh que pide el espanol del enunciado (antes de los dos puntos)
  const t = q.slice(0, q.lastIndexOf(': ')).toLowerCase(); const keys = [];
  if(/por qu[eé]/.test(t)) keys.push('why'); const t2 = t.replace(/por qu[eé]/g, '');
  if(/d[oó]nde/.test(t2)) keys.push('where'); if(/qui[eé]n/.test(t2)) keys.push('who'); if(/cu[aá]ndo/.test(t2)) keys.push('when'); if(/c[oó]mo/.test(t2)) keys.push('how'); if(/qu[eé]/.test(t2)) keys.push('what');
  return keys;
}

test('estructura: 5 lecciones x 8 actividades, 30 de practica (6 por tema) y 50 de examen (10 por tema)', () => {
  assert.strictEqual(C.lessons.length, 5); assert.deepStrictEqual(Array.from(C.lessons.map(l => l.activities[0].topic)), TOPICS);
  assert.strictEqual(new Set(TOPICS.map(t => t[0])).size, 5, 'iniciales de tema unicas'); assert(!TOPICS.some(t => /^[qdhnr]/.test(t[0]) && ['que', 'do', 'hes', 'neg', 'rep'].includes(t)), 'temas distintos de los del curso 8');
  C.lessons.forEach((l, i) => {
    assert.strictEqual(l.activities.length, 8, 'leccion ' + (i + 1));
    assert.deepStrictEqual(l.activities.slice(0, 4).map(a => a.type), ['choice', 'choice', 'choice', 'choice']);
    assert.deepStrictEqual(l.activities.slice(4, 7).map(a => a.type), ['match', 'type', 'error']);
    assert.strictEqual(l.activities[7].type, i === 4 ? 'write' : 'order');
    l.activities.forEach(a => assert.strictEqual(a.topic, TOPICS[i]));
    assert.strictEqual(l.canSay.length, 3); assert(l.screens.length >= 4 && l.screens.length <= 6, 'pantallas ' + l.screens.length);
  });
  assert.strictEqual(practice.length, 30); assert.strictEqual(EXAM.length, 50); assert.strictEqual(acts.length, 40);
  TOPICS.forEach(t => {
    assert.strictEqual(practice.filter(b => b.topic === t).length, 6, 'practica ' + t); assert.strictEqual(EXAM.filter(b => b.topic === t).length, 10, 'examen ' + t);
    assert.deepStrictEqual(EXAM.filter(b => b.topic === t).map(b => b.type).sort(), ['choice', 'choice', 'choice', 'choice', 'choice', 'choice', 'error', 'order', 'type', 'type']);
    assert.deepStrictEqual(practice.filter(b => b.topic === t).map(b => b.type).sort(), ['choice', 'choice', 'choice', 'error', 'order', 'type']);
    assert(EXAM.filter(b => b.topic === t).every(b => b.id.indexOf('e-' + t[0]) === 0), 'ids e-' + t[0]);
    assert(practice.filter(b => b.topic === t).every(b => b.id.indexOf('x-' + t[0]) === 0));
  });
});
test('ids unicos en todo el curso y un tema por leccion', () => {
  const ids = acts.map(a => a.id).concat(practice.map(b => b.id), EXAM.map(b => b.id)); assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(new Set(C.lessons.map(l => l.id)).size, 5);
  acts.concat(practice).filter(a => a.type === 'choice').forEach(a => { assert(a.options.length >= 2 && a.options.length <= 3, a.id + ' opciones'); });
});
test('sin rayas largas, en espanol latinoamericano y en ingles de Estados Unidos, y sin respuestas Yes / No a preguntas wh', () => {
  const all = JSON.stringify([C.lessons, practice, EXAM]);
  assert(!/—/.test(all), 'raya larga');
  assert(!/\b(?:coche|conducir|football|vosotros|ordenador|zumo|colour|favourite|mum|holiday|autocar)\b/i.test(all), 'espanol / ingles no latinoamericano-americano');
  assert(!/\b(?:am|is|are) (?:\w+ing)\b/i.test(all), 'presente continuo no va aqui');
  C.lessons.forEach(l => { l.canSay.forEach(t => assert(!/^(yes|no)\b/i.test(t))); l.screens.forEach(s => (s.items || []).forEach(i => assert(!/^(yes|no)\b/i.test(i.en), 'Yes/No: ' + i.en))); });
});
test('el oraculo detecta los errores tipicos de wh (control del propio oraculo)', () => {
  ['Where you live?', 'Where does she works?', 'Where do she live?', 'Who are she?', 'How you are?', 'Where is your parents?', 'What time the bus arrives?', 'Why is she study English?', 'Where do you from?', 'How many is your brother?', 'What are this?', 'When does you eat lunch?', 'Where she is?'].forEach(t => assert(!okSentence(t), 'debio fallar: ' + t));
  ['Where do you live?', 'Where does she work?', 'Who is she?', 'How are you?', 'What time is it?', 'What time does the class start?', 'How old are you?', 'Where are you from?', 'What are these?', 'Why do they learn English?', 'What does your brother do on Sundays?', 'My name is Ana.', 'He drinks coffee.', 'Because I need it for work.', 'They study at night.'].forEach(t => assert(okSentence(t), 'debio pasar: ' + t));
});
test('nunca se ensena una estructura incorrecta: toda frase en ingles aprobada pasa el oraculo, y las de "mal" de verdad son incorrectas', () => {
  const o = [];
  C.lessons.forEach(l => { l.canSay.forEach(x => o.push(x)); l.screens.forEach(s => { (s.items || []).forEach(i => { if(isEnglishLine(i.en)) o.push(i.en); }); (s.listen || []).forEach(x => { if(isEnglishLine(x)) o.push(x); });
    if(s.compare) o.push(s.compare.right);
    if(s.table){ const wrongCol = s.table.head[0] === 'Incorrecto' ? 0 : -1; s.table.rows.forEach(r => r.forEach((c, ci) => { if(ci !== wrongCol && isEnglishLine(c)) o.push(c); })); } }); });
  acts.concat(practice).forEach(a => { if(a.say) o.push(a.say); if(a.fix) o.push(a.fix); if(a.example) o.push(a.example); if(a.tokens) o.push(a.tokens.join(' '));
    if(a.type === 'match') a.pairs.forEach(p => o.push(p[1]));
    if(a.type === 'choice'){ const r = a.options[a.answer]; if(isEnglishLine(r)) o.push(r); else if(a.q.indexOf('___') !== -1){ const s = holeSentence(a.q, r); if(s) o.push(s); } }
    if(a.type === 'type' && a.source) a.accepted.forEach(x => o.push(fill(a.source, x).replace(/^./, c => c.toUpperCase()))); });
  EXAM.forEach(b => { if(b.type === 'choice'){ const r = b.answer.correct; if(isEnglishLine(r)) o.push(r); else { const s = holeSentence(b.public.q, r); if(s) o.push(s); } }
    if(b.type === 'type') b.answer.accepted.forEach(x => o.push(fill(b.public.source, x).replace(/^./, c => c.toUpperCase()))); if(b.type === 'error') o.push(b.answer.fix); if(b.type === 'order') o.push(b.answer.order.join(' ')); });
  assert(o.length > 250, 'se analizaron ' + o.length);
  const bad = []; o.forEach(t => grammarErrors(t).forEach(e => bad.push(e))); assert.deepStrictEqual(bad, []);
  C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare){ assert(!okSentence(s.compare.wrong), 'compare.wrong parece correcta: ' + s.compare.wrong); assert(okSentence(s.compare.right), s.compare.right); }
    if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => { assert(/^Mal: /.test(r[0]), 'la celda incorrecta lleva Mal:'); assert(!okSentence(r[0].replace(/^Mal: /, '')), 'incorrecta parece correcta: ' + r[0]); assert(okSentence(r[1]), r[1]); }); }));
});
test('una sola respuesta correcta: palabras wh segun el espanol; ayudantes y frases completas segun la gramatica', () => {
  const bad = []; let sem = 0, gram = 0;
  const items = acts.filter(a => a.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] }))
    .concat(practice.filter(b => b.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] })), EXAM.filter(b => b.type === 'choice').map(b => ({ id: b.id, q: b.public.q, options: b.public.options, correct: b.answer.correct })));
  assert.strictEqual(items.length, 65);
  items.forEach(it => {
    assert.strictEqual(new Set(it.options.map(norm)).size, it.options.length, it.id + ' opciones repetidas');
    if(it.options.every(o => WHWORDS.has(o.toLowerCase()))){
      sem++; const k = whKey(it.q); if(k.length !== 1) bad.push(it.id + ' el espanol pide ' + JSON.stringify(k)); else if(k[0] !== it.correct.toLowerCase()) bad.push(it.id + ' el espanol pide ' + k[0] + ' y la correcta es ' + it.correct);
      const hs = it.options.map(o => holeSentence(it.q, o)); if(hs.some(h => !h)) bad.push(it.id + ' sin hueco'); else if(!okSentence(holeSentence(it.q, it.correct))) bad.push(it.id + ' la correcta no es gramatical');
      return;
    }
    gram++; const texts = it.options.map(o => isEnglishLine(o) ? o : holeSentence(it.q, o));
    const good = texts.filter(okSentence); if(good.length !== 1) bad.push(it.id + ' correctas=' + good.length + ' ' + JSON.stringify(texts));
    else if(it.options[texts.indexOf(good[0])] !== it.correct) bad.push(it.id + ' la correcta no coincide');
  });
  assert(sem >= 18 && gram >= 40, 'revisadas ' + sem + ' / ' + gram); assert.deepStrictEqual(bad, []);
});
test('errores: solo la frase marcada tiene error; ordenar: frase correcta y bien armada; unir: ingles correcto; escribir: ejemplo y negativos', () => {
  const bad = [];
  const errs = acts.concat(practice).filter(a => a.type === 'error').map(a => ({ id: a.id, o: a.options, w: a.wrong, fix: a.fix })).concat(EXAM.filter(b => b.type === 'error').map(b => ({ id: b.id, o: b.public.options, w: b.public.options.indexOf(b.answer.correct), fix: b.answer.fix })));
  assert.strictEqual(errs.length, 15);
  errs.forEach(e => { e.o.forEach((o, i) => { const ok = okSentence(o); if(i === e.w ? ok : !ok) bad.push(e.id + ' opcion ' + i + ' ' + o); }); if(!okSentence(e.fix)) bad.push(e.id + ' fix'); else if(norm(e.fix) === norm(e.o[e.w])) bad.push(e.id + ' fix igual al error'); });
  const ords = acts.concat(practice).filter(a => a.type === 'order').map(a => ({ id: a.id, tok: a.tokens })).concat(EXAM.filter(b => b.type === 'order').map(b => ({ id: b.id, tok: b.answer.order })));
  assert.strictEqual(ords.length, 14);
  ords.forEach(o => { const j = o.tok.join(' '); if(!okSentence(j)) bad.push(o.id + ' ' + j); if(!/\?$/.test(o.tok[o.tok.length - 1])) bad.push(o.id + ' no termina con ?'); if(!/^[A-Z]/.test(o.tok[0])) bad.push(o.id + ' no empieza con mayuscula'); if(new Set(o.tok.map(t => t.toLowerCase())).size !== o.tok.length) bad.push(o.id + ' palabras repetidas (ambiguo)'); });
  acts.filter(a => a.type === 'match').forEach(a => { assert.strictEqual(a.pairs.length, 3); a.pairs.forEach(p => { if(!okSentence(p[1])) bad.push(a.id + ' ' + p[1]); }); assert.strictEqual(new Set(a.pairs.map(p => p[1])).size, 3); });
  const w = acts.find(a => a.type === 'write'); const res = w.checks.map(c => new RegExp(c.re, c.flags));
  assert(res.every(r => r.test(w.example)), 'el ejemplo pasa'); assert(okSentence(w.example));
  ['I like pizza.', 'Where you live?', 'What?', 'Do you live here?', 'Yes, I do.', 'Where.'].forEach(t => assert(!res.every(r => r.test(t)), t + ' no debe pasar'));
  ['What is your name?', 'How old are you?', 'What time is it?', 'Why do you study English?', 'Where does she work?'].forEach(t => assert(res.every(r => r.test(t)), t + ' debe pasar'));
  assert.deepStrictEqual(bad, []);
});
test('escribir una palabra: cada respuesta aceptada completa una frase correcta y el ejemplo del enunciado tambien', () => {
  const bad = []; let n = 0; const cap = s => s.replace(/^./, c => c.toUpperCase());
  const tys = acts.concat(practice).filter(a => a.type === 'type').map(a => ({ id: a.id, src: a.source, acc: a.accepted, ex: a.ex })).concat(EXAM.filter(b => b.type === 'type').map(b => ({ id: b.id, src: b.public.source, acc: b.answer.accepted, ex: b.public.ex })));
  tys.forEach(t => { n++; assert(t.src.indexOf('___') !== -1, t.id); t.acc.forEach(x => { if(!okSentence(cap(fill(t.src, x)))) bad.push(t.id + ' ' + fill(t.src, x)); });
    const m = /^(.*)  →  (.+)$/.exec(t.ex); if(!m) bad.push(t.id + ' ejemplo mal formado: ' + t.ex); else if(!okSentence(cap(fill(m[1], m[2])))) bad.push(t.id + ' ejemplo: ' + fill(m[1], m[2])); });
  assert.strictEqual(n, 5 + 5 + 10, 'ejercicios de escribir'); assert.deepStrictEqual(bad, []);
});
test('sin frases repetidas: ninguna frase en ingles aparece como respuesta de dos ejercicios distintos', () => {
  const S = {}; const add = (k, t) => { const n = norm(t).replace(/'/g, ''); (S[n] = S[n] || []).push(k); };
  acts.concat(practice).forEach(a => { const k = a.id;
    if(a.type === 'choice'){ const r = a.options[a.answer]; add(k, isEnglishLine(r) ? r : (a.q.indexOf('___') !== -1 ? holeSentence(a.q, r) : r)); }
    else if(a.type === 'match') a.pairs.forEach(p => add(k, p[1])); else if(a.type === 'type') add(k, fill(a.source, a.accepted[0])); else if(a.type === 'error') add(k, a.fix); else if(a.type === 'order') add(k, a.tokens.join(' ')); });
  EXAM.forEach(b => { const k = b.id; if(b.type === 'choice'){ const r = b.answer.correct; add(k, isEnglishLine(r) ? r : holeSentence(b.public.q, r)); } else if(b.type === 'type') add(k, fill(b.public.source, b.answer.accepted[0])); else if(b.type === 'error') add(k, b.answer.fix); else if(b.type === 'order') add(k, b.answer.order.join(' ')); });
  const dup = Object.keys(S).filter(t => S[t].length > 1).map(t => t + ' ' + S[t].join(',')); assert.deepStrictEqual(dup, []);
});
test('AUDIO (textos): todo ejemplo y frase en ingles de las pantallas y actividades tiene su audio, y NUNCA hay audio de una frase incorrecta o en espanol', () => {
  const tx = TX(C); const have = new Set(tx.map(x => x.t.trim().toLowerCase())); assert(tx.length >= 100, 'textos de audio: ' + tx.length);
  assert.strictEqual(have.size, tx.length, 'textos de audio repetidos');
  const miss = [];
  C.lessons.forEach(l => { l.canSay.forEach(t => { if(!have.has(t.toLowerCase())) miss.push('canSay ' + t); });
    l.screens.forEach(s => { (s.items || []).forEach(i => { if(!have.has(i.en.toLowerCase())) miss.push('item ' + i.en); }); (s.listen || []).forEach(t => { if(!have.has(String(t.t || t).toLowerCase())) miss.push('listen ' + t); });
      if(s.table){ const wrongCol = s.table.head[0] === 'Incorrecto' ? 0 : -1; const engCols = s.table.head.map(h => /^(Palabra|Verbo|Ejemplo|Frase|Pregunta|Respuesta|Incorrecto|Correcto|Con is o are|Con do o does|Cuando hablas de)$/.test(h)); s.table.rows.forEach(r => r.forEach((c, ci) => { if(ci === wrongCol || !engCols[ci] || ['Palabra'].includes(s.table.head[ci]) && false) return; if(/^[A-Za-z]/.test(c) && !have.has(c.toLowerCase())) miss.push('celda sin audio: ' + c); })); } }); });
  assert.deepStrictEqual(miss, []);
  const WORDS = new Set(['I', 'you', 'we', 'they', 'he', 'she', 'it', 'am', 'is', 'are', 'do', 'does', 'what', 'where', 'who', 'when', 'why', 'how', 'what time', 'how old', 'you, we, they', 'he, she, it']);
  const bad = tx.filter(x => !WORDS.has(x.t) && (!/^[A-Za-z][A-Za-z ,.'’?!-]*[.?!]$/.test(x.t) || !okSentence(x.t))).map(x => x.t); assert.deepStrictEqual(Array.from(bad), [], 'audio de frase incorrecta o con espanol');
  const wrongs = []; C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare) wrongs.push(s.compare.wrong); if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => wrongs.push(r[0].replace(/^Mal: /, ''))); }));
  wrongs.forEach(w => assert(!have.has(w.toLowerCase()), 'tiene audio una frase incorrecta: ' + w));
  // un enunciado en espanol sin tildes no debe leerse en voz inglesa: toda actividad con hueco de las lecciones lleva say con la frase completa
  acts.filter(a => a.type === 'choice' && a.q.indexOf('___') !== -1).forEach(a => assert(a.say && a.say === holeSentence(a.q, a.options[a.answer]), a.id + ' say distinto de la frase completa'));
});
// TODO (cuando el curso se integre en academia-data.js, el puente, la migracion y el audio): OCULTO, SQL y AUDIO (archivos mp3), como en academia-do-does.test.js.
console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : '')); process.exit(failed ? 1 : 0);
