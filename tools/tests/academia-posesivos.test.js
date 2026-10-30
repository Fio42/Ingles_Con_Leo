#!/usr/bin/env node
/* Curso 4 POSESIVOS Y DEMOSTRATIVOS (my, your, his, her, its, our, their, this, that, these, those): contenido, gramatica, audio, curso OCULTO, banco del examen (privado) y servidor (PGlite).
   Corre con:  node tools/tests/academia-posesivos.test.js
   Si faltan private/contenido/posesivos.json, private/academia-examen-posesivos.json o @electric-sql/pglite, esas pruebas se omiten. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..', '..');
const H = require('./academia-pg-helpers.js');
const SEED = require('../academia_seed_examen.js');
const FUENTE = require('../academia_fuente.js').load(); const FUENTE_PRIV = require('../academia_fuente.js').privDir;
const ctx = FUENTE.ctx; ctx.A = FUENTE.A; ctx.S = FUENTE.S; ctx.TX = FUENTE.TX;
const A = ctx.A, C = A.courses['posesivos'], TB = A.courses['to-be'], PR = A.courses['pronombres'];
if(!C.hydrated){ console.log('omitida: falta private/contenido/posesivos.json (contenido privado, no esta en git)'); process.exit(0); }
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
const MALE = /\b(Tom|Paul|Mark|Leo|Pedro)\b/, FEMALE = /\b(Ana|Anna|Eva|Sara|Lucy)\b/;
const PLURAL_NOUNS = new Set(['books','cars','shoes','bags','keys','pens','pencils','apples','dogs','cats','houses','friends','children','phones','bikes','cars','trees','chairs','shoes','flowers']);
const SINGULAR_NOUNS = new Set(['book','car','shoe','bag','key','pen','pencil','apple','dog','cat','house','friend','child','phone','bike','tree','chair','flower','school','room','bus','park','teacher','sister','brother','mother','desk','city','town','country','family','name','toy','ball','bed','milk','food','nest','lunch','hat','backpack','building','door','bone']);
/* Textos en ingles CORRECTOS del curso (no se incluyen las frases con error a proposito: compare.wrong y las opciones erroneas). */
function correctTexts(c){
  const o = [];
  c.lessons.forEach(l => {
    l.canSay.forEach(x => o.push(x));
    l.screens.forEach(s => { (s.items || []).forEach(i => o.push(i.en)); (s.listen || []).forEach(x => o.push(typeof x === 'string' ? x : x.t)); if(s.compare) o.push(s.compare.right); if(s.table) s.table.rows.forEach(r => r.forEach(x => { if(/[A-Za-z]/.test(x) && !/[áéíóúñ]/i.test(x)) o.push(x); })); });
  });
  allActivities(c).forEach(a => {
    if(a.tokens) o.push(a.tokens.join(' ')); if(a.fix) o.push(a.fix); if(a.example) o.push(a.example); if(a.say) o.push(a.say);
    if(a.type === 'match') a.pairs.forEach(p => o.push(p[1]));
    if(a.type === 'choice'){ const r = a.options[a.answer]; if(/^[A-Z].*[.?]$/.test(r)) o.push(r); else { const m = /(?:^|: )([^:]*___[^:]*)$/.exec(a.q); if(m && /^[A-Za-z ,.'?!-]+$/.test(m[1].replace('___', 'x'))) o.push(m[1].replace('___', r)); } }
    if(a.type === 'type' && a.source) a.accepted.forEach(x => o.push(a.source.replace('___', x)));
  });
  return o;
}
function sentences(t){ return t.split(/(?<=[.?!])\s+/); }
/* Reglas gramaticales de las frases correctas */
function grammarErrors(text){
  const errs = [], T = text.replace(/[‘’]/g, "'");
  sentences(T).forEach(s => {
    let m;
    if(/\b(this|that)\s+(are)\b/i.test(s)) errs.push(s + ' -> this/that con are');
    if(/\b(these|those)\s+(is)\b/i.test(s)) errs.push(s + ' -> these/those con is');
    if((m = /\b(these|those)\s+([a-z]+)\b/i.exec(s)) && SINGULAR_NOUNS.has(m[2].toLowerCase())) errs.push(s + ' -> these/those con nombre singular');
    if((m = /\b(this|that)\s+([a-z]+)\b/i.exec(s)) && PLURAL_NOUNS.has(m[2].toLowerCase())) errs.push(s + ' -> this/that con nombre plural');
    if(/\b(its)\s+(a|an|the|my|your|very)\b/i.test(s)) errs.push(s + ' -> its donde va it\'s');
    if((m = /\bit's\s+([a-z]+)\b/i.exec(s)) && SINGULAR_NOUNS.has(m[1].toLowerCase())) errs.push(s + ' -> it\'s antes de un nombre (va its)');
    if((m = /\b(I|you|he|she|we|they)\s+([a-z]+)\b/i.exec(s)) && (SINGULAR_NOUNS.has(m[2].toLowerCase()) || PLURAL_NOUNS.has(m[2].toLowerCase()))) errs.push(s + ' -> pronombre en lugar de posesivo');
    if(/\b(a|an|the)\s+(my|your|his|her|its|our|their)\b/i.test(s)) errs.push(s + ' -> articulo junto al posesivo');
    if(MALE.test(s) && !FEMALE.test(s) && /\bher\b/i.test(s) && !/\b(of|for|to) her\b/i.test(s) && !/Those|That|These|This/.test(s)) errs.push(s + ' -> her con dueno hombre');
    if(FEMALE.test(s) && !MALE.test(s) && /\bhis\b/i.test(s)) errs.push(s + ' -> his con dueno mujer');
    if(/\b(mine)\b/i.test(s) && !/\b(is|are) mine\b/i.test(s)) errs.push(s + ' -> mine fuera de lugar');
  });
  return errs;
}
const POSS = ['my', 'your', 'his', 'her', 'our', 'their', 'its'];
/* Quien es el dueno, deducido del contexto (ingles primero, espanol despues). Devuelve null si no hay pista. */
function ownerOf(q){
  const pieces = q.split(/(?<=[.?!:])\s+/);
  const isEs = p => /[áéíóúñ¿¡]/i.test(p) || /\b(el|la|los|las|un|una|es|son|de|del|que|tu|tus|mi|mis|su|sus|y|en|con|tiene|tienen|nuestro|nuestra|dices|dice)\b/i.test(p);
  let k = pieces.length; while(k > 0 && !isEs(pieces[k - 1])) k--;
  const S = pieces.slice(0, k).join(' ');
  let E = pieces.slice(k).join(' ');
  const cues = [];
  if(/\b(We|\w+ and I)\b/.test(E)) { cues.push('our'); E = E.replace(/\b\w+ and I\b/, ''); }
  if(/\b(Tom and Ana|Mark and Eva|Mark and Leo|The girls|My parents|The students|They)\b/.test(E)) cues.push('their');
  if(/\bThe (dog|cat|bird|school)\b/.test(E)) cues.push('its');
  const voc = /,\s*(Tom|Paul|Mark|Leo|Pedro|Ana|Eva|Sara|Lucy)\?/.exec(E);
  if(voc) cues.push('your');
  const sent = E.split(/(?<=[.?!])\s+/).map(x => x.indexOf('___') !== -1 ? x.replace(/\bis (Tom|Paul|Mark|Leo|Pedro|Ana|Eva|Sara|Lucy)\b/, 'is X') : x).join(' ');
  const E2 = sent.replace(/\b(Tom|Paul|Mark|Leo|Pedro|Ana|Eva|Sara|Lucy) and (Tom|Paul|Mark|Leo|Pedro|Ana|Eva|Sara|Lucy)\b/g, '').replace(/,\s*\w+\?/, '?');
  if(MALE.test(E2)) cues.push('his'); if(FEMALE.test(E2)) cues.push('her');
  if(/(^|[.?!] )I (am|eat|have|love|like|wash)\b/.test(E)) cues.push('my');
  if(cues.length) return Array.from(new Set(cues));
  const sp = [];
  if(/\bmis?\b/i.test(S)) sp.push('my'); if(/\btus?\b/i.test(S)) sp.push('your'); if(/\bnuestr[oa]s?\b/i.test(S)) sp.push('our');
  return sp.length ? sp : null;
}
const NEAR = /en (la|tu) mano|en tu mesa|sobre tu|cerca de ti|a tu lado|junto a ti|next to me|in my hand|on my desk|on my table|\bhere\b|en tu escritorio|sobre tu escritorio|cerca/i;
const FAR = /lejos|lejan|al otro lado|al fondo|over there|\bfar\b|junto a la puerta/i;
function distance(text){ const t = text.replace(/far from here|lejos de aquí/gi, 'far'); const n = NEAR.test(t.replace(/\bfar\b/gi, '')), f = FAR.test(t); return n && !f ? 'near' : f && !n ? 'far' : null; }

(async()=>{
  console.log('Curso Posesivos y demostrativos');
  const realFile = path.join(root, 'private', 'academia-examen-posesivos.json');
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
    assert.deepStrictEqual(topics, ['my', 'our', 'this', 'plural', 'juntos']);
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
    ids.forEach(id => assert.ok(/^[a-z0-9_-]{1,40}$/.test(id) && ('ac:posesivos:' + id).length < 60, id));
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
        ['This is my book.', 'These are our shoes.', 'That is her car.', 'Those are their bags.'].forEach(s => assert.ok(a.checks.every(c => new RegExp(c.re, c.flags || '').test(s)), a.id + ' debe aceptar: ' + s));
        ['This is a book.', 'My book is here.', 'I like music.'].forEach(s => assert.ok(!a.checks.every(c => new RegExp(c.re, c.flags || '').test(s)), a.id + ' no debe aceptar: ' + s));
      }
    });
  });

  await test('gramatica: toda frase correcta en ingles cumple las reglas (this/that con is, these/those con are, its / it\'s, posesivo y no pronombre, sin articulo junto al posesivo, his/her segun el dueno)', () => {
    let bad = []; const T = correctTexts(C).concat(bank ? examActs.flatMap(a => { const t = []; if(a.fix) t.push(a.fix); if(a.tokens && a.type === 'order') t.push(a.tokens.join(' ')); if(a.type === 'type' && a.source) t.push(a.source.replace('___', a.show)); if(a.type === 'choice'){ const r = a.options[a.answer]; if(/^[A-Z].*\.$/.test(r)) t.push(r); else if(a.q.indexOf('___') !== -1){ const m = /(?:^|: )([^:]*___[^:]*)$/.exec(a.q); if(m) t.push(m[1].replace('___', r)); } } return t; }) : []);
    assert.ok(T.length > 250, 'frases revisadas: ' + T.length);
    T.forEach(t => { bad = bad.concat(grammarErrors(t)); });
    assert.deepStrictEqual(bad, []);
    // las frases con error de las pantallas SI son errores
    C.lessons.forEach(l => l.screens.forEach(s => { if(s.compare){ assert.ok(grammarErrors(s.compare.wrong).length > 0 || /\b(I|He|She) name\b/.test(s.compare.wrong) || /these are my book/i.test(s.compare.wrong), 'compare.wrong no es un error: ' + s.compare.wrong); assert.deepStrictEqual(grammarErrors(s.compare.right), [], s.compare.right); } }));
    // a / an: el curso solo usa a/an delante de sonido correcto
    T.forEach(t => { assert.ok(!/\ba (apple|egg|orange|umbrella|hour|old|idea)\b/i.test(t), 'a/an: ' + t); assert.ok(!/\ban (book|pen|house|dog|cat|car|big|new|small|red|school|chair|bag|desk|doctor)\b/i.test(t), 'a/an: ' + t); });
  });

  await test('oraculo de DUENO: cada hueco de my / your / his / her / our / their / its tiene como unica correcta la que manda el contexto', () => {
    let n = 0;
    ALL.forEach(a => {
      let text, ans;
      if(a.type === 'choice' && a.q.indexOf('___') !== -1 && a.options.every(o => POSS.includes(o.toLowerCase()))){ text = a.q; ans = a.options[a.answer]; }
      else if(a.type === 'type' && /Escribe (my, your|our, their)/.test(a.q || '')){ text = a.source; ans = a.show; }
      if(!text) return;
      const exp = ownerOf(text); assert.ok(exp, a.id + ': sin contexto para decidir el dueno: ' + text);
      assert.strictEqual(exp.length, 1, a.id + ' pistas que se contradicen: ' + exp + ' en ' + text);
      assert.strictEqual(ans.toLowerCase(), exp[0], a.id + ' (' + text + ')'); n++;
    });
    assert.ok(n >= 28, 'huecos de posesivo revisados: ' + n);
  });

  await test('oraculo ITS / IT\'S: its antes de un nombre, it\'s antes de a, an, my... (forma corta de it is)', () => {
    let n = 0;
    ALL.forEach(a => {
      let text, ans;
      if(a.type === 'choice' && a.options.some(o => o.toLowerCase() === "it's") && a.options.some(o => o.toLowerCase() === 'its')){ text = a.q; ans = a.options[a.answer]; }
      else if(a.type === 'type' && /its o it's/.test(a.q || '')){ text = a.source; ans = a.show; }
      if(!text) return; n++;
      const next = (/___ ([A-Za-z]+)/.exec(text) || [])[1].toLowerCase();
      const exp = /^(a|an|the|my|your|very|nice|good|cold|hot|raining|time)$/.test(next) ? "it's" : (SINGULAR_NOUNS.has(next) ? 'its' : null);
      assert.ok(exp, a.id + ': palabra siguiente desconocida ' + next); assert.strictEqual(ans.toLowerCase(), exp, a.id);
    });
    assert.ok(n >= 7, 'revisados: ' + n);
    assert.ok(!/it's (bed|name|nest|toy|ball|food|milk)/i.test(JSON.stringify(correctTexts(C))));
  });

  await test('oraculo THIS / THAT / THESE / THOSE: cerca o lejos y una o varias cosas; is con una, are con varias', () => {
    let n = 0, m = 0;
    ALL.forEach(a => {
      let text, ans, extra = '';
      if(a.type === 'choice' && a.q.indexOf('___') !== -1 && a.options.every(o => /^(this|that|these|those)$/i.test(o))){ text = a.q; ans = a.options[a.answer]; }
      else if(a.type === 'type' && /Escribe (this|these)/.test(a.q || '')){ text = a.source; ans = a.show; extra = ' ' + a.q; }
      else if(a.type === 'choice' && a.options.length === 2 && a.options.includes('is') && a.options.includes('are')){
        const dm = /\b(this|that|these|those)\s+___/i.exec(a.q); assert.ok(dm, a.id); assert.strictEqual(a.options[a.answer], /^(these|those)$/i.test(dm[1]) ? 'are' : 'is', a.id); m++; return;
      }
      if(!text) return;
      const d = distance(text + extra); assert.ok(d, a.id + ': sin pista de distancia: ' + text);
      const nx = ((/___ ([A-Za-z]+)/.exec(text) || [])[1] || '').toLowerCase();
      const plural = /\b(Are|What are) ___/.test(text) ? true : /\b(Is|What is) ___/.test(text) ? false : (nx === 'are' || PLURAL_NOUNS.has(nx) ? true : (nx === 'is' || SINGULAR_NOUNS.has(nx) ? false : null));
      assert.notStrictEqual(plural, null, a.id + ': no se puede decidir el numero: ' + text);
      const exp = plural ? (d === 'near' ? 'these' : 'those') : (d === 'near' ? 'this' : 'that');
      assert.strictEqual(ans.toLowerCase(), exp, a.id + ' (' + text + ')'); n++;
    });
    assert.ok(n >= 28, 'huecos de demostrativo revisados: ' + n); assert.ok(m >= 4, 'is/are revisados: ' + m);
    // las frases con "over there" / "in my hand" no mezclan cerca y lejos
    correctTexts(C).forEach(t => { const d = distance(t), w = /\b(this|these)\b/i.test(t) ? 'near' : /\b(that|those)\b/i.test(t) ? 'far' : null; if(d && w) assert.strictEqual(d, w, 'cerca/lejos: ' + t); });
  });

  await test('oraculo de FRASES COMPLETAS (demostrativo + verbo + posesivo): exactamente una opcion cumple las tres reglas y es la marcada', () => {
    let n = 0;
    ALL.forEach(a => {
      if(a.type !== 'choice' || !a.options.every(o => /^(This|That|These|Those) (is|are) /.test(o))) return;
      const q = a.q;
      const plural = /\b(Estos|Estas|Esos|Esas|unas|Unas|unos|Unos|llaves|bolsas|zapatos|libros|coches)\b/.test(q);
      const near = /\b(Este|Esta|Estos|Estas)\b/.test(q) ? true : /\b(Ese|Esa|Esos|Esas)\b/.test(q) ? false : distance(q) === 'near';
      const far = /\b(Ese|Esa|Esos|Esas)\b/.test(q) ? true : /\b(Este|Esta|Estos|Estas)\b/.test(q) ? false : distance(q) === 'far';
      assert.ok(near !== far, a.id + ': pista de distancia confusa: ' + q);
      const poss = /nuestr/.test(q) ? 'our' : /\(de ella\)|de una mujer/.test(q) ? 'her' : /\(de él\)|de un hombre/.test(q) ? 'his' : /\(de ellos\)|de Tom y Sara/.test(q) ? 'their' : /\bmis?\b|Tienes tu\b/.test(q) ? 'my' : null;
      assert.ok(poss, a.id + ': sin pista de posesivo: ' + q);
      const dem = plural ? (near ? 'These' : 'Those') : (near ? 'This' : 'That'), verb = plural ? 'are' : 'is';
      const re = new RegExp('^' + dem + ' ' + verb + ' ' + poss + ' ');
      const good = a.options.filter(o => re.test(o)); assert.strictEqual(good.length, 1, a.id + ': opciones correctas = ' + good.length);
      assert.strictEqual(a.options[a.answer], good[0], a.id); n++;
    });
    assert.ok(n >= 12, 'frases completas revisadas: ' + n);
  });

  await test('oraculo de RELACIONA y de ERRORES: los pares son traducciones correctas y la frase marcada como error es de verdad un error', () => {
    const exp = es => { const t = es.replace(/\(.*?\)/g, m => m); return /^mi /i.test(t) ? 'my' : /^tu /i.test(t) ? 'your' : /^nuestr/i.test(t) ? 'our' : /\(de él\)/.test(t) ? 'his' : /\(de ella\)/.test(t) ? 'her' : /\(de ellos\)/.test(t) ? 'their' : /\(del (perro|gato)\)/.test(t) ? 'its' : /^Este es /.test(t) ? 'this' : /^Esa es /.test(t) ? 'that' : /^(estos|estas)\b/i.test(t) ? 'these' : /^(esos|esas)\b/i.test(t) ? 'those' : /^(esta|este)\b/i.test(t) ? 'this' : /^(esa|ese)\b/i.test(t) ? 'that' : /^¿Qué es esto/.test(t) ? 'this' : /^¿Qué son esos/.test(t) ? 'those' : null; };
    let n = 0;
    ALL.forEach(a => {
      if(a.type === 'match') a.pairs.forEach(p => { const e = exp(p[0]); if(!e) return; n++; assert.ok(new RegExp('\\b' + e + '\\b', 'i').test(p[1]), a.id + ': ' + p[0] + ' -> ' + p[1] + ' debia llevar ' + e); });
      if(a.type === 'error'){
        const dem = t => (/\b(this|these)\b/i.test(t) ? 'near' : /\b(that|those)\b/i.test(t) ? 'far' : null);
        const isErr = t => grammarErrors(t).length > 0 || (distance(t) && dem(t) && distance(t) !== dem(t)) || /\b(That|This) are\b|\b(These|Those) is\b/.test(t);
        a.options.forEach((o, k) => { if(k === a.wrong) assert.ok(isErr(o), a.id + ': la marcada no es un error: ' + o); else assert.ok(!isErr(o), a.id + ': una opcion "correcta" tiene error: ' + o); });
        assert.ok(!isErr(a.fix), a.id + ' el arreglo sigue mal');
        // el arreglo es la opcion mala corregida en UNA sola palabra
        const w1 = a.options[a.wrong].replace(/[.?!]/g, '').split(' '), w2 = a.fix.replace(/[.?!]/g, '').split(' ');
        assert.strictEqual(w1.length, w2.length, a.id + ' el arreglo cambia mas de una palabra'); assert.strictEqual(w1.filter((x, i) => x !== w2[i]).length, 1, a.id + ' el arreglo cambia mas de una palabra'); n++;
      }
    });
    assert.ok(n >= 25, 'revisados: ' + n);
  });

  await test('MY / MINE: mine solo se presenta en la ultima leccion como aviso y nunca se pregunta; no hay ejercicios con mine', () => {
    C.lessons.forEach((l, i) => { const s = JSON.stringify(l.screens); if(i < 4) assert.ok(!/\bmine\b/i.test(s), 'mine fuera de la leccion 5 (' + l.n + ')'); });
    assert.ok(!/\bmine\b/i.test(JSON.stringify(allActivities(C).concat(examActs))), 'ningun ejercicio ni pregunta usa mine');
    assert.ok(/ITS|Its/.test(JSON.stringify(C.lessons[1].screens)) && /It's/.test(JSON.stringify(C.lessons[1].screens)), 'la leccion 2 explica its y it\'s');
    ['this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'].forEach(w => assert.ok(new RegExp('\\b' + w + '\\b', 'i').test(JSON.stringify(C.lessons.map(l => l.screens))), 'no se ensena ' + w));
  });

  await test('sin ambiguedad: toda pregunta de posesivo trae su dueno (nombre, nosotros, ellos o pista en español); ningun hueco queda suelto', () => {
    ALL.forEach(a => {
      const t = a.type === 'type' ? a.source : a.q;
      if(a.type === 'choice' && a.options.every(o => POSS.includes(o.toLowerCase()))) assert.ok(ownerOf(t), a.id);
      if(a.type === 'choice' && /^___ /.test(a.q)) assert.ok(false, a.id + ' hueco inicial sin contexto: ' + a.q);
    });
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

  await test('alcance: lo que ensena el curso no incluye temas de otros cursos (there is/are, can, presente simple, do/does)', () => {
    const spanish = JSON.stringify(C.lessons.map(l => l.screens.map(s => [s.title, s.text, s.note])));
    assert.ok(!/there (is|are)|can't|\bcan\b|presente simple|do\/does/i.test(spanish));
    correctTexts(C).forEach(t => assert.ok(!/\b(there is|there are|can|cannot|do|does|don't|doesn't)\b/i.test(t), 'tema de otro curso en: ' + t));
  });

  await test('estilo del sitio: sin rayas largas, sin negritas, titulos y explicaciones cortos', () => {
    const src = fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + JSON.stringify(C) + (bank ? JSON.stringify(bank) : '');
    assert.ok(!/[—–]/.test(src), 'raya larga');
    assert.ok(!/\*\*|<b>|<strong>/.test(src));
    C.lessons.forEach(l => l.screens.forEach(s => { assert.ok(s.title && s.title.length <= 56, 'titulo largo: ' + s.title); if(s.text) assert.ok(s.text.length <= 340, 'explicacion larga (' + s.text.length + '): ' + s.title); }));
  });

  await test('audio: toda frase en ingles tiene su mp3 PRIVADO (no esta en el manifiesto publico) y las palabras clave existen', () => {
    const T = ctx.TX(C), APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'posesivos.audio.json'), 'utf8'));
    assert.ok(T.length >= 90, 'textos de audio: ' + T.length);
    T.forEach(x => { const f = APR[x.t]; assert.ok(f, 'sin audio: ' + x.t); assert.ok(f.indexOf('posesivos/') === 0); assert.ok(fs.existsSync(path.join(FUENTE_PRIV, 'audio', f)), f); assert.ok(!MAN[x.t] || !/posesivos/.test(MAN[x.t].f), 'audio del Curso 4 en el manifiesto publico: ' + x.t); assert.ok(!x.t.includes('___')); assert.ok(!/[áéíóúñ¿¡]/.test(x.t), 'espanol en un audio: ' + x.t); });
    ['This is my book.', 'That is her car.', 'These are our shoes.', 'Those are their bags.', 'My name is Leo.', 'Our house is big.', 'What is that?', 'What are those?'].forEach(t => { assert.ok(APR[t], 'falta el audio de ' + t); assert.ok(T.some(x => x.t === t), t + ' debe estar en el contenido'); });
    const folder = fs.readdirSync(path.join(FUENTE_PRIV, 'audio', 'posesivos')).filter(f => f.endsWith('.mp3'));
    const used = new Set(T.map(x => path.basename(APR[x.t])));
    assert.strictEqual(folder.length, used.size, 'mp3 sobrantes en la carpeta privada del curso');
    assert.ok(!fs.existsSync(path.join(root, 'audio/academia/posesivos')) || fs.readdirSync(path.join(root, 'audio/academia/posesivos')).length === 0, 'mp3 del Curso 4 en la carpeta publica');
    ctx.TX(TB).forEach(x => assert.ok(MAN[x.t] && /\/(to-be|pronombres)\//.test(MAN[x.t].f), 'to-be: ' + x.t));
    ctx.TX(PR).forEach(x => assert.ok(MAN[x.t], 'pronombres: ' + x.t));
  });

  await test('audio en TABLAS: cada columna con ingles tiene boton en todas sus filas o en ninguna (la causa del "an egg" sin boton), y la columna de ejemplos siempre suena', () => {
    const APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'posesivos.audio.json'), 'utf8')); const low = {}; Object.keys(APR).forEach(k => low[k.trim().toLowerCase()] = 1);
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
    const APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'posesivos.audio.json'), 'utf8'));
    ctx.TX(C).forEach(x => {
      const f = path.join(FUENTE_PRIV, 'audio', APR[x.t]);
      assert.ok(fs.statSync(f).size > 3000, 'archivo muy pequeño: ' + x.t);
      const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
      const words = x.t.split(/\s+/).length;
      assert.ok(dur >= 0.25 + words * 0.12 && dur <= 1.5 + words * 1.1, x.t + ' dura ' + dur + 's');
    });
  });

  await test('curso PUBLICADO (28-oct-2026): visible en la ruta, abierto en el motor, fila apagada en la migracion (se enciende en la base), sin enlaces publicos ni sitemap; TO BE, Pronombres y Articulos intactos', () => {
    const r = A.route.courses.find(c => c.id === 'posesivos'); assert.ok(!r.soon, 'academia-data.js: soon debe estar quitado tras el lanzamiento');
    const out = execFileSync('node', [path.join(root, 'tools', 'generar_academia_motor.js'), '--check'], { env: Object.assign({}, process.env, { ACADEMIA_MOTOR_ENABLED: '1' }) }).toString();
    assert.ok(/al dia/.test(out));
    const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'academia-motor.js'), 'utf8') + ';this.M=ACADEMIA_MOTOR;', c);
    const M = c.M; assert.strictEqual(M.courses.posesivos.open, true); assert.strictEqual(M.courses.posesivos.engineTopic, 'Posesivos (my / your / his / her / our / their)');
    assert.strictEqual(M.courses['to-be'].open, true); assert.strictEqual(M.courses.pronombres.open, true); assert.strictEqual(M.courses.articulos.open, true);
    assert.ok(M.linkForTema('to-be-presente', [], null), 'TO BE sigue enlazado');
    const cx = {}; vm.createContext(cx); vm.runInContext(fs.readFileSync(path.join(root, 'academia-cursos.js'), 'utf8') + ';this.K=ACADEMIA_CURSOS;', cx);
    assert.strictEqual(cx.K.enabled, true); assert.strictEqual(cx.K.courses.posesivos.open, true); assert.strictEqual(cx.K.courses.articulos.open, true);
    const p = M.parse('ac:posesivos:l3-a2'); assert.deepStrictEqual([p.course, p.lesson], ['posesivos', 3]);
    assert.strictEqual(M.parse('ac:posesivos:e-o3').lesson, 2); assert.strictEqual(M.parse('ac:posesivos:x-j2').lesson, 5); assert.strictEqual(M.parse('ac:posesivos:e-p10').lesson, 4); assert.strictEqual(M.parse('ac:posesivos:x-t5').lesson, 3); assert.strictEqual(M.parse('ac:posesivos:e-m1').lesson, 1);
    ['sitemap.xml', 'academia-de-ingles.html', 'index.html', 'practicar.html'].filter(f => fs.existsSync(path.join(root, f))).forEach(f => assert.ok(!/curso\/posesivos|posesivos-y-demostrativos/.test(fs.readFileSync(path.join(root, f), 'utf8')), f));
    assert.strictEqual(A.route.courses.filter(c => !c.soon).map(c => c.id).sort().join(), 'articulos,posesivos,pronombres,to-be', 'TO BE, Pronombres, Articulos y Posesivos estan visibles');
    assert.strictEqual(A.route.courses.filter(c => c.soon).length, 4);
    const js = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
    assert.ok(/\['to-be', 'pronombres', 'articulos', 'posesivos'(, 'there-is-are')?(, 'can')?\]\.forEach/.test(js)); assert.ok(/launched\(\)[\s\S]{0,200}!ENTRY\.soon|!ENTRY\.soon/.test(js), 'la puerta de lanzamiento sigue');
  });

  await test('el esqueleto PUBLICO no lleva contenido: ni pantallas, ni respuestas, ni audio; y nada del curso privado esta en archivos versionados', () => {
    const sk = (() => { const c2 = {}; vm.createContext(c2); vm.runInContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';this.A=ACADEMIA', c2); return c2.A.courses.posesivos; })();
    assert.strictEqual(sk.protected, true); assert.strictEqual(sk.exam.bank.length, 0);
    sk.lessons.forEach(l => { assert.strictEqual(l.screens, undefined); assert.strictEqual(l.activities, undefined); assert.strictEqual(l.canSay, undefined); });
    const pubSrc = JSON.stringify(sk); assert.ok(!/"answer"|"accepted"|"wrongWhy"|"options"|"tokens"|"why"/.test(pubSrc), 'el esqueleto tiene respuestas');
    const tracked = execFileSync('git', ['ls-files'], { cwd: root }).toString().split('\n').filter(Boolean);
    assert.strictEqual(tracked.filter(f => /^private\//.test(f) || /^audio\/academia\/posesivos/.test(f)).length, 0, 'archivos privados en git');
    assert.strictEqual(tracked.filter(f => /\.mp3$/.test(f) && /^(private|audio\/academia)\//.test(f) && /posesivos/.test(f)).length, 0);
    // muestras de texto privado: no aparecen en ningun archivo versionado (el repositorio es publico)
    const samples = [C.lessons[0].activities[0].q, C.lessons[1].activities[2].q, C.lessons[3].activities[3].q, C.lessons[0].screens[1].items[0].es + '', C.lessons[1].screens[2].note, C.lessons[4].screens[3].text, C.exam.bank[7].q];
    if(bank) samples.push(bank.items[0].public.q, bank.items[22].public.q, bank.items[44].public.q);
    samples.filter(Boolean).forEach(s => { const r = require('child_process').spawnSync('git', ['grep', '-q', '-F', '--', s], { cwd: root }); assert.strictEqual(r.status, 1, 'texto privado en git: ' + s); });
    // academia-audio.js (publico) no lista ningun texto o mp3 del curso privado
    ctx.TX(C).forEach(x => assert.ok(!MAN[x.t] || !/posesivos/.test(MAN[x.t].f)));
  });

  await test('migracion del curso: solo agrega una fila APAGADA, sin tocar nada mas', () => {
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261029120000_academia_curso_posesivos.sql'), 'utf8').replace(/--.*$/gm, '');
    assert.ok(/insert into public\.academia_courses/.test(sql) && /'posesivos'/.test(sql) && /false/.test(sql) && /'\{\}'/.test(sql) && /'Posesivos \(my \/ your \/ his \/ her \/ our \/ their\)'/.test(sql));
    assert.ok(!/(drop|alter|truncate|delete|update|create)\s/i.test(sql), 'la migracion solo inserta');
    assert.ok(!/to-be|pronombres|articulos/.test(sql), 'no toca otros cursos');
    assert.ok(!/true/.test(sql), 'no enciende el curso');
  });

  if(!bank) console.log('  (sin private/academia-examen-posesivos.json: se omiten las pruebas del banco privado)');
  if(bank) await test('banco oficial privado: 50 preguntas, 10 por tema, validas, sin repetir las de la practica, con respuestas unicas y gramatica correcta', () => {
    assert.strictEqual(bank.course, 'posesivos'); assert.strictEqual(bank.items.length, 50);
    const pub = new Set(); allActivities(C).forEach(a => pub.add(JSON.stringify(a.q) + JSON.stringify(a.source || '') + JSON.stringify(a.options || a.tokens || '')));
    const errs = SEED.validate(bank, { perTopic: 10, publicBankTexts: pub }); assert.deepStrictEqual(errs, []);
    Object.keys(C.topics).forEach(t => assert.strictEqual(bank.items.filter(i => i.topic === t).length, 10, t));
    const letters = { my: 'm', our: 'o', this: 't', plural: 'p', juntos: 'j' };
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
    await db.exec(H.read('supabase/migrations/20261029120000_academia_curso_posesivos.sql'));
    const q = async (sql, p) => (await db.query(sql, p)).rows;
    const rpc = async (uid, fn, args) => (await H.fakeClient(db, uid).rpc(fn, args)).data;
    const c0 = await q(`select course_id, enabled, demo_items, engine_topic from public.academia_courses order by 1`);
    assert.deepStrictEqual(c0.map(r => [r.course_id, r.enabled]), [['posesivos', false], ['to-be', true]]);
    assert.deepStrictEqual(c0[0].demo_items, []); assert.strictEqual(c0[0].engine_topic, 'Posesivos (my / your / his / her / our / their)');
    const toBeBefore = JSON.stringify(c0[1]);
    // apagado: nadie entra
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'posesivos' })).error, 'course');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'posesivos', p_state: { v: 1 }, p_base_version: 0 })).error, 'course');
    await db.exec(`update public.academia_courses set enabled = true, max_attempts_day = 20 where course_id = 'posesivos'`);
    if(items) for(const b of items) await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)', ['posesivos', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
    // cuenta gratis: sin demostracion, sin progreso, sin sesiones, sin examen, sin errores
    const acc = await rpc(H.U.free, 'academia_access', { p_course: 'posesivos', p_today: '2026-10-27', p_local_count: 0 });
    assert.strictEqual(acc.ok, true); assert.strictEqual(acc.member, false); assert.strictEqual(acc.demo.cost, 0); assert.strictEqual(acc.demo.available, false);
    const d = await rpc(H.U.free, 'academia_demo_start', { p_course: 'posesivos', p_today: '2026-10-27', p_local_count: 0 });
    assert.deepStrictEqual([d.ok, d.error], [false, 'demo_off']);
    assert.strictEqual((await q(`select coalesce(free_daily_count,0)::int n from public.profiles where id = $1`, [H.U.free]))[0].n, 0, 'no se cobro nada del limite gratis');
    assert.strictEqual((await rpc(H.U.free, 'academia_save_progress', { p_course: 'posesivos', p_state: { v: 1 }, p_base_version: 0 })).error, 'members');
    const sess = { startedAt: Date.now() - 60000, durationMs: 60000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:posesivos:' + id, isCorrect: true })) };
    assert.strictEqual((await rpc(H.U.free, 'academia_record_session', { p_course: 'posesivos', p_session: sess })).error, 'members');
    const batch = '11111111-1111-4111-8111-111111111111';
    assert.strictEqual((await rpc(H.U.free, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:posesivos:l1-a1', is_correct: false }] })).error, 'members');
    assert.strictEqual((await rpc(H.U.free, 'academia_exam_start', { p_course: 'posesivos' })).error, 'members');
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.mistake_stats where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.progress_sessions where user_id = $1`, [H.U.free]))[0].n, 0);
    // miembro
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'posesivos', p_today: '2026-10-27', p_local_count: 0 })).member, true);
    const sv = await rpc(H.U.a, 'academia_save_progress', { p_course: 'posesivos', p_state: { v: 1, lessons: { 'i-you': { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv.ok, true);
    const sv2 = await rpc(H.U.a, 'academia_save_progress', { p_course: 'to-be', p_state: { v: 1, lessons: { x: { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv2.ok, true, 'el avance de TO BE es independiente: misma cuenta, version propia');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'posesivos', p_state: { v: 1 }, p_base_version: 0 })).conflict, true);
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.a]))[0].n, 2);
    const ms = await rpc(H.U.a, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:posesivos:l1-a1', is_correct: false }, { item_id: 'ac:posesivos:l1-a2', is_correct: true }] });
    assert.strictEqual(ms.ok, true, JSON.stringify(ms));
    const mrows = await q(`select item_id, kind, topic from public.mistake_stats where user_id = $1`, [H.U.a]);
    assert.ok(mrows.length >= 1 && mrows.every(r => r.kind === 'academia' && r.topic === 'Posesivos (my / your / his / her / our / their)' && r.item_id.indexOf('ac:posesivos:') === 0), JSON.stringify(mrows));
    const rs = await rpc(H.U.a, 'academia_record_session', { p_course: 'posesivos', p_session: sess });
    assert.strictEqual(rs.ok, true, JSON.stringify(rs));
    const ps = await q(`select skill, topics from public.progress_sessions where user_id = $1`, [H.U.a]);
    assert.strictEqual(ps.length, 1); assert.deepStrictEqual(ps[0].topics, ['Posesivos (my / your / his / her / our / their)']);
    const mix = { startedAt: Date.now() - 30000, durationMs: 30000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:to-be:' + id, isCorrect: true })) };
    const mr = await rpc(H.U.a, 'academia_record_session', { p_course: 'posesivos', p_session: mix });
    assert.strictEqual(mr.ok, false, 'una sesion de un curso no puede llevar ejercicios de otro: ' + JSON.stringify(mr));
    // evaluacion oficial con el banco real
    if(items){
      const right = b => b.type === 'order' ? b.answer.order : (b.type === 'type' ? b.answer.accepted[0] : b.answer.correct);
      const wrong = b => b.type === 'order' ? b.answer.order.slice().reverse() : (b.type === 'type' ? 'zzz' : b.public.options.find(o => o !== b.answer.correct));
      const take = async nWrong => {
        const st = await rpc(H.U.a, 'academia_exam_start', { p_course: 'posesivos' });
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
      assert.deepStrictEqual(await q(`select course_id, score_pct from public.academia_badges where user_id = $1`, [H.U.a]), [{ course_id: 'posesivos', score_pct: 100 }]);
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

