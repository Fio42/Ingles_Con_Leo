#!/usr/bin/env node
/* Curso 10 Presente continuo (lo que pasa ahora): contenido, gramatica y audio (textos).
   Corre con:  node tools/tests/academia-presente-continuo.test.js
   Lee el contenido privado directamente (private/contenido/presente-continuo.json), sin tocar archivos compartidos.
   Si falta ese archivo (contenido privado, no esta en git), la prueba se omite.
   TODO (integracion): cuando se agregue el esqueleto del curso a academia-data.js, al motor y a la migracion, anadir las pruebas
   de curso OCULTO, SQL y archivos mp3 siguiendo academia-do-does.test.js. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const priv = f => path.join(root, 'private', f);
if(!fs.existsSync(priv('contenido/presente-continuo.json')) || !fs.existsSync(priv('academia-examen-presente-continuo.json'))){ console.log('omitida: falta private/contenido/presente-continuo.json (contenido privado, no esta en git)'); process.exit(0); }
const C = JSON.parse(fs.readFileSync(priv('contenido/presente-continuo.json'), 'utf8'));
const EXAM = JSON.parse(fs.readFileSync(priv('academia-examen-presente-continuo.json'), 'utf8')).items;
/* Funciones de audio reales (academiaSentence / academiaAudioTexts) cargadas desde academia-data.js sin modificarlo. */
const ctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';this.S=academiaSentence;this.TX=academiaAudioTexts;', ctx);
const TX = ctx.TX, SENT = ctx.S;
let passed = 0, failed = 0;
function test(n, f){ try{ f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split('\n').slice(0, 9).join('\n  ')); } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
const acts = []; C.lessons.forEach(l => l.activities.forEach(a => acts.push(a)));
const practice = C.practice;
const TOPICS = ['ing', 'afi', 'neg', 'pre', 'vs'];

/* ---- Oraculo de gramatica (reglas y diccionarios cerrados escritos a mano, independientes del contenido) ---- */
function ing(v){
  if(/ie$/.test(v)) return v.slice(0, -2) + 'ying';
  if(/[^e]e$/.test(v)) return v.slice(0, -1) + 'ing';                         // make -> making
  if(/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) return v + v.slice(-1) + 'ing';  // run -> running (una silaba: consonante, vocal, consonante)
  return v + 'ing';
}
const VERBS = 'work play eat read study watch cook sleep write make come dance drive take run sit swim stop get cut listen wait talk drink walk rain snow sing clean wash cry use start help look wear learn buy open call speak see'.split(' ');
const VING = new Set(VERBS.map(ing));
const STATIVE = new Set('want like love need know have hate prefer'.split(' '));
const BASE = new Set(VERBS.concat(Array.from(STATIVE), 'arrive go'.split(' ')));
function third(v){ if(v === 'have') return 'has'; if(/(sh|ch|ss|x|o)$/.test(v)) return v + 'es'; if(/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies'; return v + 's'; }
const THIRD = {}; BASE.forEach(v => { THIRD[third(v)] = v; });
const PL = new Set(['you', 'we', 'they', 'my friends', 'your friends', 'the children', 'my parents', 'your parents', 'the students', 'the girls', 'ana and tom', 'my cousins', 'the dogs', 'my neighbors', 'the kids', 'the teachers', 'the boys']);
const SG = new Set(['he', 'she', 'it', 'tom', 'ana', 'pedro', 'my brother', 'your brother', 'my mother', 'your mother', 'my father', 'your father', 'my sister', 'your sister', 'my uncle', 'the dog', 'the cat', 'the baby', 'the teacher', 'my teacher', 'the boy', 'the girl', 'the bus', 'my boss', 'my cousin']);
const NOTVERB = new Set('morning evening sing something nothing anything thing king ring spring building string'.split(' '));
const SIMPLE_MARK = /\b(every (day|morning|night|evening|week)|always|usually|often|sometimes|never|on (sundays|saturdays|mondays|fridays))\b/;
const NOW_MARK = /\b(now|right now|at the moment)\b/;
const beFor = s => s === 'i' ? 'am' : (PL.has(s) ? 'are' : 'is');
function takeSubject(w, k){ if(w[k] === 'i') return { s: 'i', n: 1 }; for(let n = 4; n >= 1; n--){ const c = w.slice(k, k + n).join(' '); if(w.length >= k + n && (PL.has(c) || SG.has(c))) return { s: c, n }; } return null; }
function expand(s){ return s.replace(/\bi'm\b/g, 'i am').replace(/\b(you|we|they)'re\b/g, '$1 are').replace(/\b(he|she|it)'s\b/g, '$1 is').replace(/\bisn't\b/g, 'is not').replace(/\baren't\b/g, 'are not'); }
function ingTokens(w, bad){ w.forEach(x => { if(/ing$/.test(x) && !NOTVERB.has(x) && !VING.has(x)) bad('ing mal escrito o verbo no permitido: ' + x); }); }
/* Devuelve la lista de problemas ([] = frase correcta para este curso). */
function grammarErrors(text){
  const errs = [];
  text.replace(/[‘’]/g, "'").split(/(?<=[.?!])\s+/).forEach(s0 => {
    const q = /\?$/.test(s0), raw = s0.replace(/[.?!]$/, '').trim().toLowerCase(), bad = m => errs.push(s0 + ' -> ' + m); if(!raw) return;
    if(/^(yes|no),/.test(raw)){
      const y = /^yes, (i|you|we|they|he|she|it) (am|is|are)$/.exec(raw);
      if(y){ const exp = y[1] === 'i' ? 'am' : (/^(you|we|they)$/.test(y[1]) ? 'are' : 'is'); if(exp !== y[2]) bad('respuesta corta: ' + y[1] + ' con ' + y[2]); return; }
      const n = /^no, (?:i(?: am not|'m not)|(?:he|she|it) (?:is not|isn't)|(?:you|we|they) (?:are not|aren't))$/.exec(raw);
      if(!n) bad('respuesta corta mal formada'); return;
    }
    const w = expand(raw).split(/\s+/);
    if(w[0] === 'do' || w[0] === 'does' || /^(don't|doesn't)$/.test(w[0])){ bad('do/does no van en este curso'); return; }
    if(w.includes("don't") || w.includes("doesn't")){ bad("don't / doesn't no van con ing"); return; }
    if(w[0] === 'what'){
      const sub = takeSubject(w, 2); if(!/^(am|is|are)$/.test(w[1]) || !sub || w[2 + sub.n] !== 'doing' || w.length !== 3 + sub.n){ bad('what + be + sujeto + doing'); return; }
      if(beFor(sub.s) !== w[1]) bad('what ' + w[1] + ' no concuerda con ' + sub.s); return;
    }
    if(/^(am|is|are)$/.test(w[0])){
      const sub = takeSubject(w, 1); if(!q) bad('pregunta sin signo'); if(!sub){ bad('sujeto desconocido tras ' + w[0]); return; }
      if(beFor(sub.s) !== w[0]) bad(w[0] + ' no concuerda con ' + sub.s);
      const v = w[1 + sub.n]; if(!VING.has(v)) bad('despues del sujeto va el verbo con ing bien escrito: ' + v); ingTokens(w.slice(2 + sub.n), bad); return;
    }
    const sub = takeSubject(w, 0); if(!sub){ bad('sujeto desconocido'); return; }
    let i = sub.n; const full = w.join(' ');
    if(/^(am|is|are)$/.test(w[i])){
      if(beFor(sub.s) !== w[i]) bad(w[i] + ' no concuerda con ' + sub.s);
      i++; if(w[i] === 'not') i++;
      if(!VING.has(w[i])) bad('despues de be va el verbo con ing bien escrito: ' + (w[i] || '(nada)'));
      if(SIMPLE_MARK.test(full)) bad('palabra de costumbre con presente continuo');
      ingTokens(w.slice(i + 1), bad); return;
    }
    if(/^(always|usually|often|sometimes|never)$/.test(w[i])) i++;
    const v = w[i]; const plural = sub.s === 'i' || PL.has(sub.s);
    if(/ing$/.test(v) && !NOTVERB.has(v)){ bad('falta am, is o are antes del ing: ' + v); return; }
    if(plural ? !BASE.has(v) : !THIRD[v]) bad('con ' + sub.s + ' el verbo no va asi: ' + v);
    else if(NOW_MARK.test(full) && !STATIVE.has(plural ? v : THIRD[v])) bad('palabra de ahora con presente simple');
    ingTokens(w.slice(i + 1), bad);
  });
  return errs;
}
const okSentence = t => grammarErrors(t).length === 0;
const fill = (src, x) => src.replace('___', x);
const isEnglishLine = s => /^[A-Za-z][A-Za-z ,.'’?!-]*[.?!]$/.test(s);
const holeSentence = (q, o) => { const i = q.lastIndexOf(': '); const t = i >= 0 ? q.slice(i + 2) : q; return t.indexOf('___') !== -1 ? fill(t, o) : null; };
const capital = s => s.replace(/^./, c => c.toUpperCase());
const isWordCell = s => /^(am|is|are|isn't|aren't|I'm not|I|you|he|she|it|we|they|he, she, it|you, we, they|always|now|usually|right now|every day|at the moment|on Sundays|look!)$/.test(s);

test('el propio oraculo: formacion del ing y errores tipicos (control)', () => {
  const T = { work: 'working', play: 'playing', eat: 'eating', read: 'reading', study: 'studying', watch: 'watching', make: 'making', write: 'writing', come: 'coming', dance: 'dancing', drive: 'driving', take: 'taking', use: 'using', run: 'running', sit: 'sitting', swim: 'swimming', stop: 'stopping', get: 'getting', cut: 'cutting', listen: 'listening', wait: 'waiting', see: 'seeing', rain: 'raining', snow: 'snowing', sing: 'singing', clean: 'cleaning', cry: 'crying', cook: 'cooking', open: 'opening' };
  Object.keys(T).forEach(k => assert.strictEqual(ing(k), T[k], k));
  ['She is work now.', 'I is working.', 'They is playing.', 'He are eating.', 'She working now.', 'I am runing.', 'She is makeing dinner.', 'We are siting here.', 'Does she working?', 'Do you working now?', "She doesn't working now.", 'I am wanting a coffee.', 'I am working every day.', 'She cooks right now.', "Yes, I'm.", "No, I amn't.", 'Yes, he do.', 'Are he working?', 'Is they working?', 'Am you working?', 'They are knowing the answer.', "No, she's not."].forEach(t => assert(!okSentence(t), 'debio fallar: ' + t));
  ['I am working now.', 'She is making a cake.', "They're playing soccer.", "He isn't reading.", "I'm not sleeping.", 'Is she reading?', 'Are you working?', 'Am I talking too fast?', 'Yes, I am.', "No, I'm not.", "No, she isn't.", 'What are you doing?', 'I work every day.', 'She studies every day.', 'He never arrives late.', 'I want a coffee.', 'We need help right now.', "We aren't running.", 'The children are running.', 'The baby is crying.', 'It is raining.'].forEach(t => assert(okSentence(t), 'debio pasar: ' + t + ' ' + grammarErrors(t)));
});
test('estructura: 5 lecciones x 8 actividades, 30 de practica (6 por tema) y 50 de examen (10 por tema)', () => {
  assert.strictEqual(C.lessons.length, 5);
  C.lessons.forEach((l, i) => {
    assert.strictEqual(l.activities.length, 8, 'leccion ' + (i + 1));
    assert.deepStrictEqual(l.activities.slice(0, 4).map(a => a.type), ['choice', 'choice', 'choice', 'choice']);
    assert.deepStrictEqual(l.activities.slice(4, 7).map(a => a.type), ['match', 'type', 'error']);
    assert.strictEqual(l.activities[7].type, i === 4 ? 'write' : 'order');
    l.activities.forEach(a => assert.strictEqual(a.topic, TOPICS[i]));
    assert.strictEqual(l.canSay.length, 3); assert(l.screens.length >= 4, 'pantallas');
  });
  assert.strictEqual(practice.length, 30); assert.strictEqual(EXAM.length, 50); assert.strictEqual(acts.length, 40);
  assert.strictEqual(new Set(TOPICS.map(t => t[0])).size, 5, 'iniciales de tema unicas');
  TOPICS.forEach(t => {
    assert.strictEqual(practice.filter(b => b.topic === t).length, 6, 'practica ' + t); assert.strictEqual(EXAM.filter(b => b.topic === t).length, 10, 'examen ' + t);
    assert.deepStrictEqual(EXAM.filter(b => b.topic === t).map(b => b.type).sort(), ['choice', 'choice', 'choice', 'choice', 'choice', 'choice', 'error', 'order', 'type', 'type']);
    assert(EXAM.filter(b => b.topic === t).every(b => b.id.indexOf('e-' + t[0]) === 0), 'ids e-' + t[0]);
    assert(practice.filter(b => b.topic === t).every(b => b.id.indexOf('x-' + t[0]) === 0));
  });
});
test('ids unicos en todo el curso', () => {
  const ids = acts.map(a => a.id).concat(practice.map(b => b.id), EXAM.map(b => b.id)); assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(new Set(C.lessons.map(l => l.id)).size, 5);
});
test('sin rayas largas y en espanol latinoamericano / ingles de Estados Unidos', () => {
  const all = JSON.stringify([C.lessons, practice, EXAM]);
  assert(!/—/.test(all), 'raya larga');
  assert(!/\b(?:coche|conducir|football|vosotros|ordenador|zumo|colour|favourite|mum|holiday)\b/i.test(all), 'espanol / ingles no latinoamericano-americano');
});
test('nunca se ensena una estructura incorrecta: toda frase en ingles aprobada pasa el oraculo', () => {
  const o = [];
  C.lessons.forEach(l => { l.canSay.forEach(x => o.push(x)); l.screens.forEach(s => { (s.items || []).forEach(i => { if(isEnglishLine(i.en)) o.push(i.en); }); (s.listen || []).forEach(x => { if(isEnglishLine(x) && !isWordCell(x)) o.push(x); });
    if(s.compare) o.push(s.compare.right);
    if(s.table){ const wrongCol = s.table.head[0] === 'Incorrecto' ? 0 : -1; if(s.table.head[0] !== 'Verbo') s.table.rows.forEach(r => r.forEach((c, ci) => { if(ci !== wrongCol && isEnglishLine(c) && !isWordCell(c)) o.push(c); })); } }); });
  acts.concat(practice).forEach(a => { if(a.say) o.push(a.say); if(a.fix) o.push(a.fix); if(a.example) o.push(a.example); if(a.tokens) o.push(a.tokens.join(' '));
    if(a.type === 'match') a.pairs.forEach(p => o.push(p[1]));
    if(a.type === 'choice'){ const r = a.options[a.answer]; if(isEnglishLine(r)) o.push(r); else if(a.q.indexOf('___') !== -1){ const s = holeSentence(a.q, r); if(s) o.push(capital(s)); } }
    if(a.type === 'type' && a.source) a.accepted.forEach(x => o.push(capital(fill(a.source, x)))); });
  EXAM.forEach(b => { if(b.type === 'choice'){ const r = b.answer.correct; if(isEnglishLine(r)) o.push(r); else { const s = holeSentence(b.public.q, r); if(s) o.push(capital(s)); } }
    if(b.type === 'type') b.answer.accepted.forEach(x => o.push(capital(fill(b.public.source, x)))); if(b.type === 'error') o.push(b.answer.fix); if(b.type === 'order') o.push(b.answer.order.join(' ')); });
  assert(o.length > 250, 'se analizaron ' + o.length);
  const bad = []; o.forEach(t => grammarErrors(t).forEach(e => bad.push(e))); assert.deepStrictEqual(bad, []);
  C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare){ assert(!okSentence(s.compare.wrong), 'compare.wrong parece correcta: ' + s.compare.wrong); assert(okSentence(s.compare.right), s.compare.right); }
    if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => { assert(/^Mal: /.test(r[0]), 'la celda incorrecta lleva Mal:'); assert(!okSentence(r[0].replace(/^Mal: /, '')), 'incorrecta parece correcta: ' + r[0]); assert(okSentence(r[1]), r[1]); }); }));
});
test('una sola respuesta correcta: de las opciones de cada pregunta solo una cumple la gramatica', () => {
  const bad = []; const items = acts.concat(practice).filter(a => a.type === 'choice').map(a => ({ id: a.id, q: a.q, options: a.options, correct: a.options[a.answer] }))
    .concat(EXAM.filter(b => b.type === 'choice').map(b => ({ id: b.id, q: b.public.q, options: b.public.options, correct: b.answer.correct })));
  items.forEach(it => {
    const sents = it.options.map(o => it.q.indexOf('___') !== -1 ? capital(holeSentence(it.q, o)) : o);
    const ok = sents.map(s => okSentence(s)); const nok = ok.filter(Boolean).length;
    if(nok !== 1 || !ok[it.options.indexOf(it.correct)]) bad.push(it.id + ' ' + JSON.stringify(sents.map((s, i) => [s, ok[i]])));
  });
  assert.deepStrictEqual(bad, []);
});
test('respuestas cortas: la respuesta correcta sigue a la pregunta (sujeto, Yes / No, am / is / are) y coincide con lo que dice el enunciado', () => {
  const bad = []; const all = acts.concat(practice).filter(a => a.type === 'choice').map(a => ({ id: a.id, q: a.q, o: a.options[a.answer] })).concat(EXAM.filter(b => b.type === 'choice').map(b => ({ id: b.id, q: b.public.q, o: b.answer.correct })));
  let n = 0;
  all.forEach(x => { const m = /^Te preguntan: (.+\?) Tú dices que (sí|no)\./.exec(x.q); if(!m) return; n++;
    const w = expand(norm(m[1])).split(/\s+/); const sub = takeSubject(w, 1);
    const pron = sub.s === 'you' ? 'i' : (PL.has(sub.s) ? 'they' : (/mother|sister|ana|she/.test(sub.s) ? 'she' : (/dog|cat|it|bus/.test(sub.s) ? 'it' : 'he')));
    const got = norm(x.o);
    if(m[2] === 'sí'){ const exp = 'yes, ' + pron + ' ' + (pron === 'i' ? 'am' : (pron === 'they' ? 'are' : 'is')); if(got !== exp) bad.push(x.id + ' ' + x.o + ' != ' + exp); }
    else { const exp = pron === 'i' ? "no, i'm not" : (pron === 'they' ? "no, they aren't" : 'no, ' + pron + " isn't"); if(got !== exp) bad.push(x.id + ' ' + x.o + ' != ' + exp); } });
  assert(n >= 6, 'respuestas cortas revisadas: ' + n); assert.deepStrictEqual(bad, []);
});
test('errores: solo la frase marcada tiene error y la correccion es correcta; ordenar: frase correcta', () => {
  const bad = []; const E = acts.concat(practice).filter(a => a.type === 'error').map(a => ({ id: a.id, o: a.options, w: a.wrong, fix: a.fix })).concat(EXAM.filter(b => b.type === 'error').map(b => ({ id: b.id, o: b.public.options, w: b.public.options.indexOf(b.answer.correct), fix: b.answer.fix })));
  E.forEach(e => { e.o.forEach((s, i) => { const good = okSentence(s); if((i === e.w) === good) bad.push(e.id + ' opcion ' + i + ' ' + s); }); if(!okSentence(e.fix)) bad.push(e.id + ' fix ' + e.fix); if(norm(e.o[e.w]) === norm(e.fix)) bad.push(e.id + ' la correccion no cambia nada'); });
  assert.deepStrictEqual(bad, []);
  acts.concat(practice).filter(a => a.type === 'order').forEach(a => assert(okSentence(a.tokens.join(' ')) && /^[A-Z]/.test(a.tokens[0]) && /[.?]$/.test(a.tokens[a.tokens.length - 1]), a.id));
  EXAM.filter(b => b.type === 'order').forEach(b => assert(okSentence(b.answer.order.join(' ')), b.id));
});
test('escribir la palabra: cada palabra aceptada completa una frase correcta y, si pide am / is / are / isn\'t / aren\'t, ninguna otra vale', () => {
  const T = acts.concat(practice).filter(a => a.type === 'type').map(a => ({ id: a.id, q: a.q, src: a.source, acc: a.accepted, show: a.show })).concat(EXAM.filter(b => b.type === 'type').map(b => ({ id: b.id, q: b.public.q, src: b.public.source, acc: b.answer.accepted, show: b.answer.accepted[0] })));
  const bad = []; let be = 0, verb = 0;
  T.forEach(t => { t.acc.forEach(x => { if(!okSentence(capital(fill(t.src, x)))) bad.push(t.id + ' acepta ' + x); });
    if(/^(am|is|are|isn't|aren't)$/i.test(t.show)){ be++; const acc = t.acc.map(x => x.replace('’', "'").toLowerCase()); const accN = acc.filter(x => !/ /.test(x));
      (/isn't o aren't/.test(t.q) ? ["isn't", "aren't"] : ['am', 'is', 'are']).forEach(c => { const pass = okSentence(capital(fill(t.src, c))); if(pass !== accN.includes(c)) bad.push(t.id + ' ' + c + ' pass=' + pass); }); }
    else { verb++; const base = t.acc[0]; if(/ing$/.test(base) ? !VING.has(base) : !(BASE.has(base) || THIRD[base])) bad.push(t.id + ' verbo ' + base); } });
  assert.deepStrictEqual(bad, []); assert(be >= 8 && verb >= 8, 'be ' + be + ' verbo ' + verb);
});
test('escribir: la frase de ejemplo cumple su revision y las respuestas incorrectas no', () => {
  const w = acts.find(a => a.type === 'write'); const res = w.checks.map(c => new RegExp(c.re, c.flags));
  assert(res.every(r => r.test(w.example)), 'el ejemplo pasa'); assert(okSentence(w.example));
  ['I study English.', "I'm.", 'She is working.', 'I am study.', 'I work now.'].forEach(t => assert(!res.every(r => r.test(t)), t + ' no debe pasar'));
  ["I'm reading a book.", 'I am working now.', 'I’m studying English.'].forEach(t => assert(res.every(r => r.test(t)), t + ' debe pasar'));
});
test('sin frases repetidas: ninguna frase en ingles aparece como respuesta de dos ejercicios distintos (salvo respuestas cortas)', () => {
  const S = {}; const add = (k, t) => { const n = norm(t).replace(/'/g, ''); (S[n] = S[n] || []).push(k); };
  acts.concat(practice).forEach(a => { const k = a.id;
    if(a.type === 'choice'){ const r = a.options[a.answer]; add(k, isEnglishLine(r) ? r : (a.q.indexOf('___') !== -1 ? holeSentence(a.q, r) : r)); }
    else if(a.type === 'match') a.pairs.forEach(p => add(k, p[1])); else if(a.type === 'type') add(k, fill(a.source, a.accepted[0])); else if(a.type === 'error') add(k, a.fix); else if(a.type === 'order') add(k, a.tokens.join(' ')); });
  EXAM.forEach(b => { const k = b.id; if(b.type === 'choice'){ const r = b.answer.correct; add(k, isEnglishLine(r) ? r : holeSentence(b.public.q, r)); } else if(b.type === 'type') add(k, fill(b.public.source, b.answer.accepted[0])); else if(b.type === 'error') add(k, b.answer.fix); else if(b.type === 'order') add(k, b.answer.order.join(' ')); });
  const dup = Object.keys(S).filter(t => S[t].length > 1 && !/^(yes|no),? /.test(t)).map(t => t + ' ' + S[t].join(',')); assert.deepStrictEqual(dup, []);
});
test('AUDIO (textos): todo ejemplo, celda y frase en ingles tiene audio; nunca hay audio de frases incorrectas, de espanol ni de enunciados; los huecos llevan say', () => {
  const tx = TX(C); const have = new Set(tx.map(x => x.t.trim().toLowerCase())); assert(tx.length >= 100, 'textos de audio: ' + tx.length);
  assert.strictEqual(have.size, tx.length, 'textos de audio repetidos');
  const miss = [];
  C.lessons.forEach(l => { l.canSay.forEach(t => { if(!have.has(t.toLowerCase())) miss.push('canSay ' + t); });
    l.screens.forEach(s => { (s.items || []).forEach(i => { if(!have.has(i.en.toLowerCase())) miss.push('item ' + i.en); }); (s.listen || []).forEach(t => { if(!have.has(String(t.t || t).toLowerCase())) miss.push('listen ' + t); });
      if(s.compare && !have.has(s.compare.right.toLowerCase())) miss.push('compare.right ' + s.compare.right);
      if(s.table) s.table.rows.forEach(r => r.forEach(c => { if(/^Mal: /.test(c) || s.table.head[0] === 'Incorrecto' && c === r[0]) return; if(!have.has(c.toLowerCase())) miss.push('celda ' + c); })); }); });
  acts.forEach(a => { const f = SENT(a); if(f && !have.has(f.toLowerCase())) miss.push('actividad ' + a.id + ' ' + f); });
  assert.deepStrictEqual(Array.from(miss), []);
  const WORDS = new Set(['Tom, my brother', 'Ana, my mother', 'my friends, the children', 'Ana and Tom']);
  const VW = new Set(VERBS.concat(VERBS.map(ing)));
  const bad = tx.filter(x => !WORDS.has(x.t) && !isWordCell(x.t) && !VW.has(x.t) && (!/^[A-Za-z][A-Za-z ,.'’?!-]*[.?!]$/.test(x.t) || !okSentence(x.t))).map(x => x.t); assert.deepStrictEqual(Array.from(bad), [], 'audio de frase incorrecta o con espanol');
  C.lessons.forEach(l => l.screens.forEach(s => { if(s.table && s.table.head[0] === 'Verbo' && s.table.head[1] === 'Con ing') s.table.rows.forEach(r => assert.strictEqual(ing(r[0]), r[1], r[0])); }));
  const wrongs = []; C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare) wrongs.push(s.compare.wrong); if(s.table && s.table.head[0] === 'Incorrecto') s.table.rows.forEach(r => wrongs.push(r[0].replace(/^Mal: /, ''))); }));
  wrongs.forEach(w => assert(!have.has(w.toLowerCase()), 'tiene audio una frase incorrecta: ' + w));
  acts.forEach(a => { if(a.type === 'choice' && a.q.indexOf('___') !== -1){ assert(a.say, 'el hueco necesita say: ' + a.id); assert(okSentence(a.say), a.say); assert.strictEqual(norm(a.say), norm(holeSentence(a.q, a.options[a.answer])), 'say no coincide con la frase: ' + a.id); assert(/^[A-Za-z0-9'.,?!: _-]+$/.test(a.say), 'say con caracteres raros ' + a.id); } });
  acts.filter(a => a.type === 'match').forEach(a => a.pairs.forEach(p => { assert(p[0].length <= 26 && p[1].length <= 26, 'par muy largo para 320 px: ' + p.join(' / ')); }));
});
test('wrongWhy: cada opcion incorrecta de las actividades tiene su explicacion y coincide con una opcion', () => {
  acts.filter(a => a.type === 'choice').forEach(a => { const wrong = a.options.filter((o, i) => i !== a.answer); assert.deepStrictEqual(Object.keys(a.wrongWhy).sort(), wrong.slice().sort(), a.id); });
});
// TODO (integracion, cuando Leo autorice agregar el curso a la plataforma): pruebas de curso OCULTO, esqueleto publico, SQL, mapa de audio y mp3 (ver academia-do-does.test.js).
console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : '')); process.exit(failed ? 1 : 0);
