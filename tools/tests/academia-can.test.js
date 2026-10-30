#!/usr/bin/env node
/* Curso 4 POSESIVOS Y DEMOSTRATIVOS (my, your, his, her, its, our, their, this, that, these, those): contenido, gramatica, audio, curso OCULTO, banco del examen (privado) y servidor (PGlite).
   Corre con:  node tools/tests/academia-can.test.js
   Si faltan private/contenido/can.json, private/academia-examen-can.json o @electric-sql/pglite, esas pruebas se omiten. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..', '..');
const H = require('./academia-pg-helpers.js');
const SEED = require('../academia_seed_examen.js');
const FUENTE = require('../academia_fuente.js').load(); const FUENTE_PRIV = require('../academia_fuente.js').privDir;
const ctx = FUENTE.ctx; ctx.A = FUENTE.A; ctx.S = FUENTE.S; ctx.TX = FUENTE.TX;
const A = ctx.A, C = A.courses['can'], TB = A.courses['to-be'], PR = A.courses['pronombres'];
if(!C.hydrated){ console.log('omitida: falta private/contenido/can.json (contenido privado, no esta en git)'); process.exit(0); }
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
function allActivities(c){ const o = []; c.lessons.forEach(l => l.activities.forEach(a => o.push(a))); c.exam.bank.forEach(a => o.push(a)); return o; }
/* ---- Oraculos de gramatica (independientes del contenido: diccionarios cerrados escritos a mano) ---- */
const BASE = new Set('swim run sing dance cook drive speak read write play jump ride open close help use sit come park ask wait eat drink go see hear take fly walk'.split(' '));
const SUBJ = "(?:I|you|he|she|it|we|they|Tom|Ana|Sara|Mark|Leo|(?:my|your|his|her|our|their|the) [a-z]+|birds|dogs|cats|children|students)";
const PRON_OF = { you: 'I', he: 'he', she: 'she', it: 'it', we: 'we', they: 'they', tom: 'he', mark: 'he', leo: 'he', ana: 'she', sara: 'she', birds: 'they', dogs: 'they', cats: 'they', children: 'they', students: 'they' };
const NP_PRON = { brother: 'he', father: 'he', grandfather: 'he', friend: 'he', sister: 'she', mother: 'she', grandmother: 'she', dog: 'it', cat: 'it', baby: 'it', friends: 'they', parents: 'they' };
function pronOf(subj){ const w = subj.toLowerCase().split(' '); return w.length === 1 ? PRON_OF[w[0]] : NP_PRON[w[1]]; }
/* Textos en ingles CORRECTOS del curso (no se incluyen las frases con error a proposito: compare.wrong y las opciones erroneas). */
function correctTexts(c){
  const o = [];
  c.lessons.forEach(l => {
    l.canSay.forEach(x => o.push(x));
    l.screens.forEach(s => { (s.items || []).forEach(i => o.push(i.en)); (s.listen || []).forEach(x => o.push(typeof x === 'string' ? x : x.t)); if(s.compare) o.push(s.compare.right); if(s.table) s.table.rows.forEach(r => r.forEach(x => { if(/[A-Za-z]/.test(x) && !/[áéíóúñ+]/i.test(x) && /^[A-Z]/.test(x)) o.push(x); })); });
  });
  allActivities(c).forEach(a => {
    if(a.tokens) o.push(a.tokens.join(' ')); if(a.fix) o.push(a.fix); if(a.example) o.push(a.example); if(a.say) o.push(a.say);
    if(a.type === 'match') a.pairs.forEach(p => { if(/^[A-Z]/.test(p[1])) o.push(p[1]); });
    if(a.type === 'choice'){ const r = a.options[a.answer]; if(/^[A-Z].*[.?]$/.test(r)) o.push(r); else { const m = /(?:^|: )([^:]*___[^:]*)$/.exec(a.q); if(m && /^[A-Za-z ,.'?!-]+$/.test(m[1].replace('___', 'x'))) o.push(m[1].replace('___', r)); } }
    if(a.type === 'type' && a.source) a.accepted.forEach(x => { o.push(a.source.replace('___', x)); });
  });
  return o;
}
function sentences(t){ return t.split(/(?<=[.?!])\s+/); }
/* Reglas gramaticales de las frases correctas: sujeto + can / can't + verbo sin cambios; preguntas con Can primero; respuestas cortas.
   Devuelve la lista de problemas ([] = la frase es correcta para el nivel A1 del curso). */
function grammarErrors(text){
  const errs = [], T = text.replace(/[‘’]/g, "'");
  sentences(T).forEach(s0 => {
    let s = s0.trim(); if(!s) return;
    const S0 = s.replace(/[.?!]$/, ''); const S = S0.charAt(0).toUpperCase() + S0.slice(1);
    if(!/\bcan(?:'t)?\b|\bcans\b|\bcant\b|\bcannot\b|\bcan not\b/i.test(S)) return;
    if(/\bcans\b|\bcant\b|\bcannot\b|\bcan not\b|\bcan(?:'t)? to\b|\bam able\b|\bis can\b|\bare can\b/i.test(S)) errs.push(s0 + ' -> forma no valida con can');
    let m;
    if((m = /^(Yes|No), (I|you|he|she|it|we|they) (can|can't)$/.exec(S))){
      if((m[1] === 'Yes') !== (m[3] === 'can')) errs.push(s0 + ' -> yes / no no concuerda con can / can\'t');
      return;
    }
    if(/^Can /.test(S)){
      const q = new RegExp('^Can (' + SUBJ + ') ([a-z]+)(?: (.*))?$', 'i').exec(S);
      if(!q) errs.push(s0 + ' -> pregunta con forma desconocida');
      else { if(!BASE.has(q[2].toLowerCase())) errs.push(s0 + ' -> despues de can va el verbo sin cambios: ' + q[2]); if(!/\?$/.test(s0)) errs.push(s0 + ' -> falta el signo de pregunta'); }
      return;
    }
    if(/^Can't /i.test(S)){ errs.push(s0 + " -> pregunta con can't no se ensena"); return; }
    S.split(/, but | but |, and | and /).forEach(cl => {
      const st = new RegExp('^(' + SUBJ + ') (can|can\'t) ([a-z]+)(?: (.*))?$', 'i').exec(cl.trim());
      if(!st){ errs.push(s0 + ' -> afirmativa con forma desconocida: ' + cl); return; }
      if(!BASE.has(st[3].toLowerCase())) errs.push(s0 + ' -> despues de can va el verbo sin cambios: ' + st[3]);
      const rest = st[4] || ''; if(/(^|\s)good\b/.test(rest) && !/\b(a|the|my|your) good\b/.test(rest)) errs.push(s0 + ' -> well, no good');
    });
    if(/\?$/.test(s0)) errs.push(s0 + ' -> frase afirmativa con signo de pregunta');
  });
  return errs;
}
function fillTemplate(q, opt){ const m = /(?:^|: )([^:]*___[^:]*)$/.exec(q); return m ? m[1].replace('___', opt) : null; }
function spanishPart(q){ const i = q.indexOf(': '); return i > -1 && q.slice(i + 2).indexOf('___') !== -1 ? q.slice(0, i) : q.replace(/___.*$/, ''); }
const capFirst = f => f.replace(/^\s*./, c => c.toUpperCase());
const NEG_ES = /\bno (?:puedo|puedes|puede|podemos|pueden|sé|sabes|sabe|sabemos|saben)(?![a-záéíóúñ])|\bno se (?:permite|puede)(?![a-záéíóúñ])|no está permitido|\bque no\b/i;
/* Frase completa valida con la pista en español: forma correcta, usa can / can't, sí o no segun la pista y pregunta solo si hay ¿ */
function sentenceOK(filled, es){
  const f = capFirst(filled);
  if(grammarErrors(f).length) return false;
  if(!/\bcan(?:'t)?\b/i.test(f)) return false;
  const esq = es.replace(/¿Qué frase dices\?/g, '');
  if(NEG_ES.test(esq) !== /can't/i.test(f)) return false;
  if(/¿/.test(esq)){ const canS = sentences(f).filter(x => /\bcan(?:'t)?\b/i.test(x)); if(!canS.length || !canS.every(x => /^Can /.test(x.trim()) && /\?$/.test(x.trim()))) return false; }
  return true;
}

(async()=>{
  console.log("Curso CAN / CAN'T");
  const realFile = path.join(root, 'private', 'academia-examen-can.json');
  const bank = fs.existsSync(realFile) ? JSON.parse(fs.readFileSync(realFile, 'utf8')) : null;
  // Preguntas de practica + examen oficial (privado) con la misma forma que los ejercicios, para pasarles los mismos oraculos
  const examActs = bank ? bank.items.map(i => {
    const o = { id: i.id, type: i.type, topic: i.topic, q: i.public.q, source: i.public.source, tokens: i.public.order || i.public.tokens, options: i.public.options };
    if(i.type === 'choice'){ o.answer = i.public.options.indexOf(i.answer.correct); }
    if(i.type === 'type'){ o.accepted = i.answer.accepted; o.show = i.answer.accepted[0]; }
    if(i.type === 'error'){ o.wrong = i.public.options.indexOf(i.answer.correct); o.fix = i.answer.fix; }
    if(i.type === 'order'){ o.tokens = i.answer.order; }
    return o;
  }) : [];
  const ALL = allActivities(C).concat(examActs);

  await test('estructura: 5 lecciones de 8 actividades, 40 en total, cada una con su microtema', () => {
    assert.strictEqual(C.lessons.length, 5);
    const topics = Object.keys(C.topics);
    assert.deepStrictEqual(topics, ['can', 'neg', 'preg', 'ask', 'juntos']);
    assert.strictEqual(new Set(topics.map(t => t[0])).size, topics.length, 'inicial repetida: rompe los ids del examen oficial');
    let n = 0;
    C.lessons.forEach((l, i) => {
      assert.strictEqual(l.n, i + 1); assert.strictEqual(l.activities.length, 8, 'lección ' + l.n); n += l.activities.length;
      assert.strictEqual(l.topic, topics[i]); assert.ok(l.minutes >= 4 && l.minutes <= 8);
      assert.ok(l.screens.length >= 3 && l.screens.length <= 5, 'pantallas lección ' + l.n);
      l.activities.forEach(a => assert.strictEqual(a.topic, l.topic, a.id));
      assert.strictEqual(l.canSay.length, 3);
      l.screens.forEach(s => (s.items || []).forEach(it => { assert.ok(it.en && it.es, 'cada ejemplo lleva su traduccion debajo (' + l.n + ')'); }));
    });
    assert.strictEqual(n, 40);
    const types = new Set(); C.lessons.forEach(l => l.activities.forEach(a => types.add(a.type)));
    ['choice', 'type', 'order', 'match', 'error', 'write'].forEach(t => assert.ok(types.has(t), 'falta tipo ' + t));
    assert.strictEqual(C.demo, undefined, 'este curso NO tiene prueba gratis');
    assert.ok(!C.lessons.some(l => l.screens.some(s => s.audio)), 'no se presenta audio sintetico como grabacion de Leo');
    assert.strictEqual(C.exam.bank.length, 30); Object.keys(C.topics).forEach(t => assert.strictEqual(C.exam.bank.filter(b => b.topic === t).length, 6, t));
    assert.strictEqual(JSON.stringify(C.exam.practiceIds.map(p => p.id)), JSON.stringify(C.exam.bank.map(b => b.id)), 'los ids publicos de la practica coinciden con el contenido');
  });

  await test('ids: unicos en el curso y con el formato del motor', () => {
    const ids = allActivities(C).map(a => a.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    ids.forEach(id => assert.ok(/^[a-z0-9_-]{1,40}$/.test(id) && ('ac:can:' + id).length < 60, id));
  });

  await test('cada ejercicio esta bien formado, tiene explicacion y una sola respuesta correcta', () => {
    allActivities(C).forEach(a => {
      assert.ok(a.why && a.why.length > 12, a.id + ' sin explicacion');
      if(a.type === 'choice'){
        assert.ok(a.options.length >= 2 && a.options.length <= 4 && new Set(a.options).size === a.options.length, a.id + ' opciones'); assert.ok(a.answer >= 0 && a.answer < a.options.length, a.id);
        if(a.wrongWhy){ Object.keys(a.wrongWhy).forEach(k => assert.ok(a.options.includes(k) && k !== a.options[a.answer], a.id + ' wrongWhy ' + k)); if(C.lessons.some(l => l.activities.includes(a))) a.options.forEach((o, k) => { if(k !== a.answer) assert.ok(a.wrongWhy[o] && a.wrongWhy[o].length > 12, a.id + ': falta explicar el error de "' + o + '"'); }); }
      }
      if(a.type === 'error'){ assert.strictEqual(a.options.length, 3); assert.ok(a.wrong >= 0 && a.wrong < 3); assert.notStrictEqual(a.fix, a.options[a.wrong]); assert.ok(/^[A-Z]/.test(a.fix)); }
      if(a.type === 'type'){ assert.ok(a.source && a.accepted.length && a.show); assert.ok(a.accepted.map(norm).includes(norm(a.show)), a.id + ': show debe estar aceptado'); }
      if(a.type === 'order'){ assert.ok(a.tokens.length >= 3 && /^[A-Z]/.test(a.tokens[0]) && /[.?!]$/.test(a.tokens[a.tokens.length - 1]), a.id); assert.ok(new Set(a.tokens).size === a.tokens.length, a.id + ' fichas repetidas'); }
      if(a.type === 'match'){ assert.ok(a.pairs.length === 3 && new Set(a.pairs.map(p => p[1])).size === 3 && new Set(a.pairs.map(p => p[0])).size === 3, a.id); }
      if(a.type === 'write'){
        const ok = a.checks.every(c => new RegExp(c.re, c.flags || '').test(a.example));
        assert.ok(ok, a.id + ': el ejemplo debe pasar sus propias comprobaciones');
        assert.ok(!a.checks.every(c => new RegExp(c.re, c.flags || '').test('hello world')), a.id + ': una respuesta sin sentido no debe pasar');
        ['I can swim.', "I can't dance.", 'I can cook very well.'].forEach(s => assert.ok(a.checks.every(c => new RegExp(c.re, c.flags || '').test(s)), a.id + ' debe aceptar: ' + s));
        ['I like music.', 'She can swim.', 'I swim.', 'I can to swim.'].forEach(s => assert.ok(!a.checks.every(c => new RegExp(c.re, c.flags || '').test(s)), a.id + ' no debe aceptar: ' + s));
      }
    });
  });

  await test('gramatica: toda frase correcta en ingles cumple las reglas (quien + can / can\'t + verbo sin cambios, Can al principio en preguntas, respuestas cortas, well y no good)', () => {
    let bad = []; const T = correctTexts(C).concat(bank ? examActs.flatMap(a => { const t = []; if(a.fix) t.push(a.fix); if(a.tokens && a.type === 'order') t.push(a.tokens.join(' ')); if(a.type === 'type' && a.source) t.push(a.source.replace('___', a.show)); if(a.type === 'choice'){ const r = a.options[a.answer]; if(/^[A-Z].*[.?]$/.test(r)) t.push(r); else { const f = fillTemplate(a.q, r); if(f) t.push(f); } } return t; }) : []);
    assert.ok(T.length > 180, 'frases revisadas: ' + T.length);
    T.forEach(t => { bad = bad.concat(grammarErrors(t)); });
    assert.deepStrictEqual(bad, []);
    C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare){ assert.ok(grammarErrors(s.compare.wrong).length > 0, 'compare.wrong no es un error: ' + s.compare.wrong); assert.deepStrictEqual(grammarErrors(s.compare.right), [], s.compare.right); } }));
    // el detector de errores de verdad detecta los errores tipicos
    ['She cans dance.', 'He can runs.', 'I can to swim.', 'I can swimming.', 'He can\'t cooks.', 'Do you can swim?', 'Can he to drive?', 'She can swim?', 'Yes, I can\'t.', 'No, I can.', 'He no can cook.', 'She can dance good.', 'I cannot swim.', 'They is can sing.', 'Can\'t you swim?'].forEach(t => assert.ok(grammarErrors(t).length > 0, 'debia ser error: ' + t));
    ['She can dance.', 'He can\'t cook.', 'Can they swim?', 'Yes, I can.', 'No, she can\'t.', 'I can swim, but I can\'t dance.', 'She can dance well.', 'Can I open the window?'].forEach(t => assert.deepStrictEqual(grammarErrors(t), [], 'debia ser correcta: ' + t));
    T.forEach(t => { assert.ok(!/\ba (apple|egg|orange|umbrella|hour|old|idea)\b/i.test(t), 'a/an: ' + t); assert.ok(!/\ban (book|pen|house|dog|cat|car|big|new|small|red|school|chair|bag|desk|doctor|bank|table|bike|photo|question|guitar|piano)\b/i.test(t), 'a/an: ' + t); });
  });

  const esOf = a => (a.type === 'type' ? a.q.replace(/^Escribe[^.]*\.\s*/, '') : a.q);
  await test('oraculo de HUECOS: en cada pregunta de hueco exactamente una opcion forma una frase valida con la pista en español (sí o no, pregunta o no), y es la marcada', () => {
    let n = 0;
    ALL.forEach(a => {
      if(a.type !== 'choice' || /(Yes|No), ___/.test(a.q)) return;
      if(fillTemplate(a.q, a.options[0]) === null) return;
      const es = spanishPart(a.q);
      const good = a.options.filter(o => sentenceOK(fillTemplate(a.q, o), es));
      assert.strictEqual(good.length, 1, a.id + ': opciones validas = ' + JSON.stringify(good) + ' en ' + a.q);
      assert.strictEqual(good[0], a.options[a.answer], a.id + ' (' + a.q + ')'); n++;
    });
    assert.ok(n >= 40, 'huecos revisados: ' + n);
  });

  await test('oraculo de FRASES COMPLETAS ("Quieres decir"): solo una opcion es correcta y es la marcada', () => {
    let n = 0;
    ALL.forEach(a => {
      if(a.type !== 'choice' || !a.options.every(o => /^[A-Z].*[.?]$/.test(o))) return;
      const good = a.options.filter(o => sentenceOK(o, a.q));
      assert.strictEqual(good.length, 1, a.id + ': correctas = ' + JSON.stringify(good));
      assert.strictEqual(good[0], a.options[a.answer], a.id); n++;
    });
    assert.ok(n >= 6, 'frases completas revisadas: ' + n);
  });

  await test('oraculo de ESCRIBE (type): las respuestas aceptadas son todas las que forman frase valida, ni mas ni menos', () => {
    let n = 0;
    ALL.forEach(a => {
      if(a.type !== 'type' || !a.source) return;
      const es = esOf(a);
      const valid = ['can', "can't"].filter(c => sentenceOK(a.source.replace('___', c), es)).sort();
      const acc = a.accepted.map(norm).sort();
      assert.deepStrictEqual(acc, valid, a.id + ': aceptadas ' + JSON.stringify(a.accepted) + ' vs validas ' + JSON.stringify(valid) + ' en ' + a.source);
      n++;
    });
    assert.ok(n >= 8, 'type revisados: ' + n);
  });

  await test('oraculo de RESPUESTAS CORTAS: se contesta por la persona de la pregunta (you -> I) y con can o can\'t segun el sí o el no de la pista', () => {
    let n = 0;
    ALL.forEach(a => {
      if(a.type !== 'choice' || !/(Yes|No), ___/.test(a.q)) return;
      const qq = new RegExp('Can (' + SUBJ + ') [a-z]+', 'i').exec(a.q); assert.ok(qq, a.id + ': sin pregunta'); const pr = pronOf(qq[1]); assert.ok(pr, a.id + ': persona desconocida ' + qq[1]);
      const yes = /que sí/.test(a.q), no = /que no/.test(a.q); assert.ok(yes !== no, a.id + ': pista de sí o no');
      const exp = pr + (yes ? ' can' : " can't");
      assert.strictEqual(a.options.filter(o => o === exp).length, 1, a.id + ': opciones ' + JSON.stringify(a.options) + ' esperada ' + exp);
      assert.strictEqual(a.options[a.answer], exp, a.id); n++;
    });
    assert.ok(n >= 5, 'respuestas cortas revisadas: ' + n);
  });

  await test('oraculo de RELACIONA y de ERRORES: los pares son traducciones correctas y la frase marcada como error es de verdad un error', () => {
    let n = 0;
    ALL.forEach(a => {
      if(a.type === 'match') a.pairs.forEach(p => { n++; assert.deepStrictEqual(grammarErrors(p[1]), [], a.id + ' ' + p[1]); assert.ok(sentenceOK(p[1], p[0]), a.id + ': ' + p[0] + ' -> ' + p[1]); });
      if(a.type === 'error'){
        a.options.forEach((o, k) => { if(k === a.wrong) assert.ok(grammarErrors(o).length > 0, a.id + ': la marcada no es un error: ' + o); else assert.deepStrictEqual(grammarErrors(o), [], a.id + ': una opcion "correcta" tiene error: ' + o); });
        assert.deepStrictEqual(grammarErrors(a.fix), [], a.id + ' el arreglo sigue mal');
        const w1 = a.options[a.wrong].replace(/[.?!,]/g, '').split(' '), w2 = a.fix.replace(/[.?!,]/g, '').split(' ');
        assert.ok(Math.abs(w1.length - w2.length) <= 1, a.id + ' el arreglo cambia demasiado'); n++;
      }
    });
    assert.ok(n >= 25, 'revisados: ' + n);
  });

  await test('VERBOS: despues de can solo van verbos sin cambios (swim, cook...), nunca con s, to ni ing, y cada leccion los usa en la pregunta correcta', () => {
    const all = JSON.stringify(correctTexts(C));
    assert.ok(!/\bcan(?:'t)? (to|[a-z]{3,}ing)\b/i.test(all), 'to o ing despues de can');
    ['swim', 'cook', 'dance', 'drive', 'sing', 'speak', 'play'].forEach(v => assert.ok(new RegExp('\\bcan(?:\'t)? ' + v + '\\b', 'i').test(all), 'no se practica can ' + v));
    const s2 = JSON.stringify(C.lessons[1].screens), s3 = JSON.stringify(C.lessons[2].screens), s4 = JSON.stringify(C.lessons[3].screens), s5 = JSON.stringify(C.lessons[4].screens);
    assert.ok(/can't/.test(s2) && /Yes, I can/.test(s3) && /Can I /.test(s4) && /but/.test(s5), 'cada leccion ensena lo suyo');
    assert.ok(/permiso/i.test(s4) && /habilidad/i.test(s4), 'la leccion 4 distingue habilidad y permiso');
  });

  await test('POLARIDAD: cada pista de no (no sé, no puedo, no se permite, que no) pide can\'t y cada sí pide can; nunca se mezclan', () => {
    let n = 0;
    ALL.forEach(a => { if(a.type !== 'choice' || !a.options.some(o => /^can'?t?$/i.test(o) || /can'?t?$/i.test(o))) return; const es = spanishPart(a.q); const ans = a.options[a.answer]; if(!/^(can|can't)$/.test(ans)) return; assert.strictEqual(ans === "can't", NEG_ES.test(es), a.id + ': ' + a.q); n++; });
    assert.ok(n >= 15, 'polaridad revisada: ' + n);
  });

  await test('sin ambiguedad: ningun hueco queda suelto: toda pregunta trae su pista en español', () => {
    ALL.forEach(a => { if(a.type === 'choice' && /^___ /.test(a.q) && a.q.indexOf(': ') === -1) assert.ok(false, a.id + ' hueco inicial sin contexto: ' + a.q); });
    ALL.forEach(a => { if(a.type === 'choice' || a.type === 'type') assert.ok(/[áéíóúñÉ¿]|\b(Quieres|Te|Pides|Tu|Nosotros|Ella|Él|Yo|Mi|Mis|Ellos|No|Aquí|Los|Tom|Tú|Dices)\b/.test(a.q), a.id + ': sin pista en español: ' + a.q); });
  });

  await test('sin duplicados ni preguntas casi iguales: ninguna pregunta se repite entre lecciones, practica y examen privado', () => {
    const key = a => a.type === 'order' ? 'o:' + (a.tokens || []).join(' ') : a.type === 'match' ? 'm:' + a.pairs.map(p => p.join('=')).join(';') : a.type === 'error' ? 'e:' + a.options.join('|') : 'c:' + (a.source || a.q).toLowerCase().replace(/[^a-z_ áéíóúñ]/g, '').replace(/\s+/g, ' ').trim() + '|' + (a.options || []).join();
    const seen = {}; const dup = [];
    ALL.forEach(a => { const k = key(a); if(seen[k]) dup.push(a.id + ' = ' + seen[k]); else seen[k] = a.id; });
    assert.deepStrictEqual(dup, []);
    // las frases en ingles de las preguntas de hueco tampoco se repiten (misma frase con otra pista de espanol)
    const eng = {}; const rep = [];
    ALL.filter(a => a.type === 'choice' || a.type === 'type').forEach(a => { const t = (a.source || a.q).replace(/^.*?: (?=.*___)/, '').toLowerCase() + ' => ' + String(a.type === 'type' ? a.show : a.options[a.answer]).toLowerCase(); if(t.indexOf('___') === -1) return; if(eng[t]) rep.push(a.id + ' = ' + eng[t]); else eng[t] = a.id; });
    assert.deepStrictEqual(rep, []);
    const oc = {}; ALL.filter(a => a.type === 'order').forEach(a => { const k = a.tokens.join(' '); oc[k] = (oc[k] || 0) + 1; }); Object.keys(oc).forEach(k => assert.strictEqual(oc[k], 1, 'orden repetido: ' + k));
  });

  await test('alcance: lo que ensena el curso no incluye temas de otros cursos (there is/are, presente simple, do/does, must, should)', () => {
    const spanish = JSON.stringify(C.lessons.map(l => l.screens.map(s => [s.title, s.text, s.note])));
    assert.ok(!/there (is|are)|presente simple|do\/does|\bmust\b|\bshould\b|cannot/i.test(spanish));
    correctTexts(C).forEach(t => assert.ok(!/\b(do|does|don't|doesn't|there is|there are|must|should|may|cannot|able|have|has)\b/i.test(t), 'tema de otro curso en: ' + t));
  });

  await test('estilo del sitio: sin rayas largas, sin negritas, titulos y explicaciones cortos', () => {
    const src = fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + JSON.stringify(C) + (bank ? JSON.stringify(bank) : '');
    assert.ok(!/[—–]/.test(src), 'raya larga');
    assert.ok(!/\*\*|<b>|<strong>/.test(src));
    C.lessons.forEach(l => l.screens.forEach(s => { assert.ok(s.title && s.title.length <= 56, 'titulo largo: ' + s.title); if(s.text) assert.ok(s.text.length <= 340, 'explicacion larga (' + s.text.length + '): ' + s.title); }));
  });

  await test('audio: toda frase en ingles tiene su mp3 PRIVADO (no esta en el manifiesto publico) y las palabras clave existen', () => {
    const T = ctx.TX(C), APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'can.audio.json'), 'utf8'));
    assert.ok(T.length >= 66, 'textos de audio: ' + T.length);   // 68 desde el 30-oct (las 2 pistas en español ya no se leen y football pasó a soccer)
    T.forEach(x => { const f = APR[x.t]; assert.ok(f, 'sin audio: ' + x.t); assert.ok(f.indexOf('can/') === 0); assert.ok(fs.existsSync(path.join(FUENTE_PRIV, 'audio', f)), f); assert.ok(!MAN[x.t] || !/\/can\//.test(MAN[x.t].f), 'audio del Curso 4 en el manifiesto publico: ' + x.t); assert.ok(!x.t.includes('___')); assert.ok(!/[áéíóúñ¿¡]/.test(x.t), 'espanol en un audio: ' + x.t); });
    ['I can swim.', "I can't swim.", 'Can you swim?', 'Yes, I can.'].forEach(t => { assert.ok(APR[t], 'falta el audio de ' + t); assert.ok(T.some(x => x.t === t), t + ' debe estar en el contenido'); });
    const folder = fs.readdirSync(path.join(FUENTE_PRIV, 'audio', 'can')).filter(f => f.endsWith('.mp3'));
    const used = new Set(T.map(x => path.basename(APR[x.t])));
    assert.strictEqual(folder.length, used.size, 'mp3 sobrantes en la carpeta privada del curso');
    assert.ok(!fs.existsSync(path.join(root, 'audio/academia/can')) || fs.readdirSync(path.join(root, 'audio/academia/can')).length === 0, 'mp3 del Curso 4 en la carpeta publica');
    ctx.TX(TB).forEach(x => { if(MAN[x.t]) assert.ok(/\/(to-be|pronombres)\//.test(MAN[x.t].f), 'to-be: ' + x.t); });
    ctx.TX(PR).forEach(x => { if(MAN[x.t]) assert.ok(/\/(to-be|pronombres)\//.test(MAN[x.t].f), 'pronombres: ' + x.t); });
  });

  await test('audio en TABLAS: cada columna con ingles tiene boton en todas sus filas o en ninguna (la causa del "an egg" sin boton), y la columna de ejemplos siempre suena', () => {
    const APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'can.audio.json'), 'utf8')); const low = {}; Object.keys(APR).forEach(k => low[k.trim().toLowerCase()] = 1);
    let tables = 0;
    C.lessons.forEach(l => l.screens.forEach(s => { if(!s.table) return; tables++;
      s.table.head.forEach((h, i) => { const col = s.table.rows.map(r => !!low[String(r[i]).trim().toLowerCase()]); assert.ok(col.every(Boolean) || !col.some(Boolean), l.id + ' / ' + h + ': botones a medias ' + col.join()); if(h === 'Ejemplo' || h === 'Una cosa' || h === 'Varias cosas') assert.ok(col.every(Boolean), l.id + ' / ' + h + ': el ejemplo debe sonar'); });
    }));
    assert.ok(tables >= 4, 'tablas: ' + tables);
    // el lector de audio de la pagina no distingue mayusculas (corregido el 28-oct-2026)
    assert.ok(/function audioKey\(map, text\)/.test(fs.readFileSync(path.join(root, 'academia.js'), 'utf8')));
  });

  await test('audio: duracion acorde al texto (sin cortes, sin silencios, sin archivos vacios)', () => {
    let ffprobe = true; try{ execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); }catch(e){ ffprobe = false; }
    if(!ffprobe){ console.log('       (sin ffprobe: omitida)'); return; }
    const APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'can.audio.json'), 'utf8'));
    ctx.TX(C).forEach(x => {
      const f = path.join(FUENTE_PRIV, 'audio', APR[x.t]);
      assert.ok(fs.statSync(f).size > 3000, 'archivo muy pequeño: ' + x.t);
      const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
      const words = x.t.split(/\s+/).length;
      assert.ok(dur >= 0.25 + words * 0.12 && dur <= 1.5 + words * 1.1, x.t + ' dura ' + dur + 's');
    });
  });

  await test('curso OCULTO: sigue "soon" en la ruta, cerrado en el motor, apagado en la migracion, sin enlaces publicos ni sitemap; TO BE, Pronombres y Articulos intactos', () => {
    const r = A.route.courses.find(c => c.id === 'can'); assert.strictEqual(r.soon, true, 'academia-data.js: soon debe seguir en true');
    const out = execFileSync('node', [path.join(root, 'tools', 'generar_academia_motor.js'), '--check'], { env: Object.assign({}, process.env, { ACADEMIA_MOTOR_ENABLED: '1' }) }).toString();
    assert.ok(/al dia/.test(out));
    const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'academia-motor.js'), 'utf8') + ';this.M=ACADEMIA_MOTOR;', c);
    const M = c.M; assert.strictEqual(M.courses['can'].open, false); assert.strictEqual(M.courses['can'].engineTopic, "Can / Can't (habilidad)");
    assert.strictEqual(M.courses['to-be'].open, true); assert.strictEqual(M.courses.pronombres.open, true); assert.strictEqual(M.courses.articulos.open, true);
    assert.ok(M.linkForTema('to-be-presente', [], null), 'TO BE sigue enlazado');
    assert.ok(!M.linkForTema('can', [], null), 'el tema del curso oculto no enlaza a ningun curso mientras open sea false');
    const cx = {}; vm.createContext(cx); vm.runInContext(fs.readFileSync(path.join(root, 'academia-cursos.js'), 'utf8') + ';this.K=ACADEMIA_CURSOS;', cx);
    assert.strictEqual(cx.K.enabled, true); assert.strictEqual(cx.K.courses['can'].open, false); assert.strictEqual(cx.K.courses.articulos.open, true);
    const p = M.parse('ac:can:l3-a2'); assert.deepStrictEqual([p.course, p.lesson], ['can', 3]);
    assert.strictEqual(M.parse('ac:can:e-a3').lesson, 4); assert.strictEqual(M.parse('ac:can:x-j2').lesson, 5); assert.strictEqual(M.parse('ac:can:e-p10').lesson, 3); assert.strictEqual(M.parse('ac:can:x-n5').lesson, 2); assert.strictEqual(M.parse('ac:can:e-c1').lesson, 1);
    ['sitemap.xml', 'academia-de-ingles.html', 'index.html', 'practicar.html'].filter(f => fs.existsSync(path.join(root, f))).forEach(f => assert.ok(!/curso\/can\b/.test(fs.readFileSync(path.join(root, f), 'utf8')), f));
    assert.strictEqual(A.route.courses.filter(c => !c.soon).map(c => c.id).sort().join(), 'articulos,posesivos,pronombres,there-is-are,to-be', 'los cursos visibles no cambian');
    assert.strictEqual(A.route.courses.filter(c => c.soon).length, 3);
    const js = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
    assert.ok(/\['to-be', 'pronombres', 'articulos', 'posesivos', 'there-is-are', 'can'\]\.forEach/.test(js)); assert.ok(/launched\(\)[\s\S]{0,200}!ENTRY\.soon|!ENTRY\.soon/.test(js), 'la puerta de lanzamiento sigue');
  });

  await test('el esqueleto PUBLICO no lleva contenido: ni pantallas, ni respuestas, ni audio; y nada del curso privado esta en archivos versionados', () => {
    const sk = (() => { const c2 = {}; vm.createContext(c2); vm.runInContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';this.A=ACADEMIA', c2); return c2.A.courses['can']; })();
    assert.strictEqual(sk.protected, true); assert.strictEqual(sk.exam.bank.length, 0);
    sk.lessons.forEach(l => { assert.strictEqual(l.screens, undefined); assert.strictEqual(l.activities, undefined); assert.strictEqual(l.canSay, undefined); });
    const pubSrc = JSON.stringify(sk); assert.ok(!/"answer"|"accepted"|"wrongWhy"|"options"|"tokens"|"why"/.test(pubSrc), 'el esqueleto tiene respuestas');
    const tracked = execFileSync('git', ['ls-files'], { cwd: root }).toString().split('\n').filter(Boolean);
    assert.strictEqual(tracked.filter(f => /^private\//.test(f) || /^audio\/academia\/can/.test(f)).length, 0, 'archivos privados en git');
    assert.strictEqual(tracked.filter(f => /\.mp3$/.test(f) && /^(private|audio\/academia)\//.test(f) && /can/.test(f)).length, 0);
    // muestras de texto privado: no aparecen en ningun archivo versionado (el repositorio es publico)
    const samples = [C.lessons[0].activities[0].q, C.lessons[1].activities[2].q, C.lessons[3].activities[3].q, C.lessons[0].screens[2].text, C.lessons[1].screens[3].note, C.lessons[4].screens[3].text, C.exam.bank[7].q];
    if(bank) samples.push(bank.items[0].public.q, bank.items[22].public.q, bank.items[44].public.q);
    samples.filter(Boolean).forEach(s => { const r = require('child_process').spawnSync('git', ['grep', '-q', '-F', '--', s], { cwd: root }); assert.strictEqual(r.status, 1, 'texto privado en git: ' + s); });
    // academia-audio.js (publico) no lista ningun texto o mp3 del curso privado
    ctx.TX(C).forEach(x => assert.ok(!MAN[x.t] || !/\/can\//.test(MAN[x.t].f)));
  });

  await test('migracion del curso: solo agrega una fila APAGADA, sin tocar nada mas', () => {
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261029140000_academia_curso_can.sql'), 'utf8').replace(/--.*$/gm, '');
    assert.ok(/insert into public\.academia_courses/.test(sql) && /'can'/.test(sql) && /false/.test(sql) && /'\{\}'/.test(sql) && /'Can \/ Can''t \(habilidad\)'/.test(sql));
    assert.ok(!/(drop|alter|truncate|delete|update|create)\s/i.test(sql), 'la migracion solo inserta');
    assert.ok(!/to-be|pronombres|articulos/.test(sql), 'no toca otros cursos');
    assert.ok(!/true/.test(sql), 'no enciende el curso');
  });

  if(!bank) console.log('  (sin private/academia-examen-can.json: se omiten las pruebas del banco privado)');
  if(bank) await test('banco oficial privado: 50 preguntas, 10 por tema, validas, sin repetir las de la practica, con respuestas unicas y gramatica correcta', () => {
    assert.strictEqual(bank.course, 'can'); assert.strictEqual(bank.items.length, 50);
    const pub = new Set(); allActivities(C).forEach(a => pub.add(JSON.stringify(a.q) + JSON.stringify(a.source || '') + JSON.stringify(a.options || a.tokens || '')));
    const errs = SEED.validate(bank, { perTopic: 10, publicBankTexts: pub }); assert.deepStrictEqual(errs, []);
    Object.keys(C.topics).forEach(t => assert.strictEqual(bank.items.filter(i => i.topic === t).length, 10, t));
    const letters = { can: 'c', neg: 'n', preg: 'p', ask: 'a', juntos: 'j' };
    bank.items.forEach(i => assert.ok(new RegExp('^e-' + letters[i.topic] + '\\d{1,2}$').test(i.id), 'id/tema: ' + i.id));
    const kinds = {}; bank.items.forEach(i => kinds[i.type] = (kinds[i.type] || 0) + 1);
    ['choice', 'type', 'order', 'error'].forEach(k => assert.ok(kinds[k] >= 5, 'pocas de tipo ' + k));
    const sents = bank.items.map(i => JSON.stringify(i.public)); assert.strictEqual(new Set(sents).size, 50, 'preguntas repetidas');
    // ninguna pregunta del examen es identica en enunciado a una de la practica
    const pubQ = new Set(allActivities(C).map(a => (a.source || a.q) + '|' + (a.options || a.tokens || []).join()));
    bank.items.forEach(i => assert.ok(!pubQ.has((i.public.source || i.public.q) + '|' + (i.public.options || i.public.tokens || []).join()), 'copiada de la practica: ' + i.id));
    bank.items.forEach(i => {
      assert.ok(i.answer.why && i.answer.why.length > 12, i.id + ' explicacion');
    });
    const gi = require('child_process').spawnSync('git', ['check-ignore', realFile], { cwd: root }); assert.strictEqual(gi.status, 0, 'el banco real debe estar ignorado por git');
    const tracked = require('child_process').execFileSync('git', ['ls-files', 'private'], { cwd: root }).toString().trim(); assert.strictEqual(tracked, '', 'nada de private/ en git');
  });
  const PGlite = await loadPglite();
  if(!PGlite) console.log('  (sin @electric-sql/pglite: se omiten las pruebas del servidor)');
  if(PGlite) await test('servidor: gratis NO tiene prueba ni progreso ni evaluacion de este curso; miembro si; TO BE intacto', async () => {
    const items = bank ? bank.items : null;
    const db = await H.freshDb(PGlite, []);
    await db.exec(H.read('supabase/migrations/20261029140000_academia_curso_can.sql'));
    const q = async (sql, p) => (await db.query(sql, p)).rows;
    const rpc = async (uid, fn, args) => (await H.fakeClient(db, uid).rpc(fn, args)).data;
    const c0 = await q(`select course_id, enabled, demo_items, engine_topic from public.academia_courses order by 1`);
    assert.deepStrictEqual(c0.map(r => [r.course_id, r.enabled]), [['can', false], ['to-be', true]]);
    assert.deepStrictEqual(c0[0].demo_items, []); assert.strictEqual(c0[0].engine_topic, "Can / Can't (habilidad)");
    const toBeBefore = JSON.stringify(c0[1]);
    // apagado: nadie entra
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'can' })).error, 'course');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'can', p_state: { v: 1 }, p_base_version: 0 })).error, 'course');
    await db.exec(`update public.academia_courses set enabled = true, max_attempts_day = 20 where course_id = 'can'`);
    if(items) for(const b of items) await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)', ['can', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
    // cuenta gratis: sin demostracion, sin progreso, sin sesiones, sin examen, sin errores
    const acc = await rpc(H.U.free, 'academia_access', { p_course: 'can', p_today: '2026-10-27', p_local_count: 0 });
    assert.strictEqual(acc.ok, true); assert.strictEqual(acc.member, false); assert.strictEqual(acc.demo.cost, 0); assert.strictEqual(acc.demo.available, false);
    const d = await rpc(H.U.free, 'academia_demo_start', { p_course: 'can', p_today: '2026-10-27', p_local_count: 0 });
    assert.deepStrictEqual([d.ok, d.error], [false, 'demo_off']);
    assert.strictEqual((await q(`select coalesce(free_daily_count,0)::int n from public.profiles where id = $1`, [H.U.free]))[0].n, 0, 'no se cobro nada del limite gratis');
    assert.strictEqual((await rpc(H.U.free, 'academia_save_progress', { p_course: 'can', p_state: { v: 1 }, p_base_version: 0 })).error, 'members');
    const sess = { startedAt: Date.now() - 60000, durationMs: 60000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:can:' + id, isCorrect: true })) };
    assert.strictEqual((await rpc(H.U.free, 'academia_record_session', { p_course: 'can', p_session: sess })).error, 'members');
    const batch = '11111111-1111-4111-8111-111111111111';
    assert.strictEqual((await rpc(H.U.free, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:can:l1-a1', is_correct: false }] })).error, 'members');
    assert.strictEqual((await rpc(H.U.free, 'academia_exam_start', { p_course: 'can' })).error, 'members');
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.mistake_stats where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.progress_sessions where user_id = $1`, [H.U.free]))[0].n, 0);
    // miembro
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'can', p_today: '2026-10-27', p_local_count: 0 })).member, true);
    const sv = await rpc(H.U.a, 'academia_save_progress', { p_course: 'can', p_state: { v: 1, lessons: { 'i-you': { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv.ok, true);
    const sv2 = await rpc(H.U.a, 'academia_save_progress', { p_course: 'to-be', p_state: { v: 1, lessons: { x: { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv2.ok, true, 'el avance de TO BE es independiente: misma cuenta, version propia');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'can', p_state: { v: 1 }, p_base_version: 0 })).conflict, true);
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.a]))[0].n, 2);
    const ms = await rpc(H.U.a, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:can:l1-a1', is_correct: false }, { item_id: 'ac:can:l1-a2', is_correct: true }] });
    assert.strictEqual(ms.ok, true, JSON.stringify(ms));
    const mrows = await q(`select item_id, kind, topic from public.mistake_stats where user_id = $1`, [H.U.a]);
    assert.ok(mrows.length >= 1 && mrows.every(r => r.kind === 'academia' && r.topic === "Can / Can't (habilidad)" && r.item_id.indexOf('ac:can:') === 0), JSON.stringify(mrows));
    const rs = await rpc(H.U.a, 'academia_record_session', { p_course: 'can', p_session: sess });
    assert.strictEqual(rs.ok, true, JSON.stringify(rs));
    const ps = await q(`select skill, topics from public.progress_sessions where user_id = $1`, [H.U.a]);
    assert.strictEqual(ps.length, 1); assert.deepStrictEqual(ps[0].topics, ["Can / Can't (habilidad)"]);
    const mix = { startedAt: Date.now() - 30000, durationMs: 30000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:to-be:' + id, isCorrect: true })) };
    const mr = await rpc(H.U.a, 'academia_record_session', { p_course: 'can', p_session: mix });
    assert.strictEqual(mr.ok, false, 'una sesion de un curso no puede llevar ejercicios de otro: ' + JSON.stringify(mr));
    // evaluacion oficial con el banco real
    if(items){
      const right = b => b.type === 'order' ? b.answer.order : (b.type === 'type' ? b.answer.accepted[0] : b.answer.correct);
      const wrong = b => b.type === 'order' ? b.answer.order.slice().reverse() : (b.type === 'type' ? 'zzz' : b.public.options.find(o => o !== b.answer.correct));
      const take = async nWrong => {
        const st = await rpc(H.U.a, 'academia_exam_start', { p_course: 'can' });
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
      assert.deepStrictEqual(await q(`select course_id, score_pct from public.academia_badges where user_id = $1`, [H.U.a]), [{ course_id: 'can', score_pct: 100 }]);
      assert.strictEqual((await q(`select count(*)::int n from public.academia_exam_attempts where course_id = 'to-be'`))[0].n, 0);
    }
    const tbAfter = (await q(`select course_id, enabled, demo_items, engine_topic from public.academia_courses where course_id = 'to-be'`))[0];
    assert.strictEqual(JSON.stringify(tbAfter), toBeBefore, 'la fila de TO BE no cambio');
    const tb = await rpc(H.U.free, 'academia_access', { p_course: 'to-be', p_today: '2026-10-27', p_local_count: 0 });
    assert.strictEqual(tb.demo.cost > 0, true, 'TO BE conserva su prueba gratis');
    const perm = await q(`select count(*)::int n from information_schema.table_privileges where table_name = 'academia_exam_items' and grantee in ('anon','authenticated')`);
    assert.strictEqual(perm[0].n, 0, 'el navegador no puede leer el banco');
  });

  // Los textos de la evaluacion y la insignia no pueden nombrar a TO BE en cursos que no son TO BE (hallazgo de la prueba real).
  await test('las pantallas de evaluacion e insignia usan el nombre del curso, no el de TO BE', async () => {
    const js = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
    assert.strictEqual(/text: 'Curso To be . Evaluaci/.test(js), false, 'kicker fijo de TO BE');
    assert.strictEqual(/text: 'Insignia conseguida: Domina el verbo TO BE'/.test(js), false, 'insignia fija de TO BE');
    assert.ok(/PRIMARY \? 'Domina el verbo TO BE' : COURSE\.title/.test(js), 'TO BE conserva su texto y los demas usan su titulo');
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLAN' : ''));
  if(failed) process.exit(1);
})();

