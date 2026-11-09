#!/usr/bin/env node
/* Conexión educativa: ejercicio -> explicación existente -> curso de academia publicado (con membresía). Usa el app.js y data.js REALES en un navegador simulado, con un reloj
   controlado para simular varios días. No toca la red.
   Corre con:  node tools/tests/micro-flujo.test.js   (desde la carpeta inglesconLeo)

   Las pantallas (renderMicroCheck) se prueban en el navegador real; aquí se prueba toda la lógica que las gobierna. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');

const store = require('./lib/guest-store.js')();
const noop = ()=>{};
const el = ()=>{ let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
  set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
function makeCtx(withTemas){
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: el(), documentElement: el(), createElement: el },
    location:{ hash:'', search: (global.__SEARCH || ''), pathname:'/' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  if(withTemas) vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { recordSession, loadProgress, renderFreeSessionSummary, freeReinforceHtml, freeDailyLimitReached, localDailyCountKey, GUEST_EXERCISE_LIMIT, skillErrorResource, errorResourceForItem, sessionReinforceRows, sessionReinforceHtml, VOCAB_GLOSSARY_BY_ITEM, ACADEMIA_COURSE_BY_TEMA, academiaCourseForTema, TEMA_BY_ID, VOCAB_BANK, LISTENING_BANK, READING_BANK, temaForTopic, LEVELS, computeDiagnosis, microDiagActions, microFlowState, microIsActive, computePlanSelection, buildPlanPool,
  microCheckStart, microCheckFinish, pickCheckItems, checkAvailable, computeMistakeIds, computeWeeklyStats, computeSessionInsight, setUserLevel,
  takePagePlanParams, takePageOrigin, noteGrammarAnswer, MICRO_BY_ID, MICROS, MICRO_STATS_KEY, CHECK_SEEN_KEY, PROGRESS_KEY, GRAMMAR_BANK, GRAMMAR_CHECK_BANK, SESSION_LENGTHS,
  getMistakesItemIndex, loadInflightSession, saveInflightSession, microWeakness, MICRO_FLOW, localDateStr, PLAN_LENGTHS,
  resetIndex(){ _mistakesItemIndexCache = undefined; _checkIndex = null; _microLevelIndex = null; } };`, ctx);
  ctx.__t.ctx = ctx;
  return ctx.__t;
}


const plain = o => JSON.parse(JSON.stringify(o));
let T = makeCtx(true);
let passed = 0;
function test(name, fn){
  try{ Object.keys(store).forEach(k => delete store[k]); T = makeCtx(true); T.setUserLevel('medio'); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
}
const exists = href => fs.existsSync(path.join(root, href.replace(/^\//, '').split(/[?#]/)[0].replace(/\/$/, '') + (/^\/?glosario\//.test(href) ? '/index.html' : '')));
const allIds = bank => { const out = []; T.LEVELS.forEach(l => (bank[l] || []).forEach(v => v.forEach(i => out.push(i.id)))); return out; };

console.log('Explicaciones por ejercicio');
test('Vocabulario con pareja de palabras: enlaza a su glosario real', () => {
  const r = plain(T.skillErrorResource('vocab', 'v-facil8-4'));
  assert.strictEqual(r.href, '/glosario/accept-vs-except/'); assert(exists(r.href));
  assert.strictEqual(r.title, 'Accept vs Except');
});
test('Todas las entradas de la tabla de glosario apuntan a un ejercicio y a una página que existen', () => {
  const ids = new Set(allIds(T.VOCAB_BANK));
  Object.keys(plain(T.VOCAB_GLOSSARY_BY_ITEM)).forEach(id => { assert(ids.has(id), 'ejercicio inexistente ' + id); assert(exists('/glosario/' + T.VOCAB_GLOSSARY_BY_ITEM[id] + '/'), 'sin página ' + T.VOCAB_GLOSSARY_BY_ITEM[id]); });
});
test('Vocabulario/Listening de principiante sin tema: la guía del nivel; otros niveles sin tema: ningún enlace inventado', () => {
  const g = plain(T.skillErrorResource('vocab', 'v-principiante-1'));
  assert.strictEqual(g.href, 'articulo-vocabulario-basico.html'); assert(exists(g.href));
  const l = plain(T.skillErrorResource('listening', 'l-principiante-1'));
  assert.strictEqual(l.href, 'articulo-listening-a1.html'); assert(exists(l.href));
  assert.strictEqual(T.skillErrorResource('vocab', 'v-medio-1'), null);
  assert.strictEqual(T.skillErrorResource('vocab', 'v-avz-1'), null);
});
test('Listening con tema (números) enlaza a la clase real del tema', () => {
  const id = allIds(T.LISTENING_BANK).find(i => /numeros/.test(i) && !/principiante/.test(i));
  const r = plain(T.skillErrorResource('listening', id));
  assert(r && /numeros/.test(r.href) && exists(r.href), id + ' ' + JSON.stringify(r));
});
test('Reading no inventa explicaciones: sin enlace', () => {
  const id = (T.READING_BANK.facil[0][0]).id;
  assert.strictEqual(T.errorResourceForItem({ id }), null);
});
test('errorResourceForItem: gramática sigue igual (do/does enlaza a su clase)', () => {
  let found = null;
  T.LEVELS.forEach(l => T.GRAMMAR_BANK[l].forEach(v => v.forEach(b => { const t = T.temaForTopic(b.topic); if(!found && t && t.id === 'do-does') found = b.items[0].id; })));
  const r = plain(T.errorResourceForItem({ id: found }));
  assert(r && exists(r.href));
});

console.log('Academia conectada');
test('La tabla de cursos coincide con academia-motor.js: solo cursos publicados, nunca apagados', () => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'academia-motor.js'), 'utf8') + '\nthis.M = ACADEMIA_MOTOR;', ctx);
  const open = {}; Object.keys(ctx.M.courses).forEach(id => { const c = ctx.M.courses[id]; if(c.open) open[c.tema] = { course:id, title:c.title }; });
  const tabla = plain(T.ACADEMIA_COURSE_BY_TEMA);
  assert.deepStrictEqual(Object.keys(tabla).sort(), Object.keys(open).sort(), 'mismos temas publicados');
  Object.keys(tabla).forEach(t => { assert.strictEqual(tabla[t].course, open[t].course); assert.strictEqual(tabla[t].title, open[t].title); assert(T.TEMA_BY_ID[t], 'tema inexistente ' + t); });
  assert(!tabla['in-on-at'] && !tabla['presente-continuo']);
});
test('Resumen de sesión: errores de DO/DOES ofrecen explicación, practicar y el curso (con membresía)', () => {
  const ids = [];
  T.LEVELS.forEach(l => T.GRAMMAR_BANK[l].forEach(v => v.forEach(b => { const t = T.temaForTopic(b.topic); if(t && t.id === 'do-does' && ids.length < 2) ids.push(b.items[0].id); })));
  const rows = plain(T.sessionReinforceRows(ids.map(id => ({ itemId:id, isCorrect:false })), { actions: [] }, new Set()));
  assert(rows.length >= 1);
  const r = rows[0];
  assert(r.lesson && exists(r.lesson.href), 'explicación'); assert(r.practiceHref, 'practicar');
  assert(r.course && r.course.course === 'do-does' && r.course.member === true && exists('academia.html'));
  const html = T.sessionReinforceHtml(rows);
  assert(/Curso: <a href="academia\.html#\/curso\/do-does"/.test(html) && /con membresía/.test(html));
});
test('Un tema sin curso publicado no muestra curso; to-be indica la demo gratis', () => {
  assert.strictEqual(T.academiaCourseForTema('in-on-at'), null);
  assert.strictEqual(T.academiaCourseForTema('presente-continuo'), null);
  assert.strictEqual(plain(T.academiaCourseForTema('to-be-presente')).demo, true);
  assert.strictEqual(plain(T.academiaCourseForTema('do-does')).demo, false);
});

console.log('Cuenta gratis / invitado');
const doDoesIds = n => { const ids = []; T.LEVELS.forEach(l => T.GRAMMAR_BANK[l].forEach(v => v.forEach(b => { const t = T.temaForTopic(b.topic); if(t && t.id === 'do-does' && ids.length < n) ids.push(b.items[0].id); }))); return ids; };
const wrongRes = ids => ids.map(id => ({ itemId:id, isCorrect:false }));
test('Resumen gratis tras errores: muestra qué reforzar (explicación, práctica gratis, curso con membresía) y NO invita a pagar', () => {
  const events = []; T.ctx.gtag = (...a) => events.push(a);
  assert.strictEqual(T.freeDailyLimitReached(), false);
  const html = T.renderFreeSessionSummary({ title:'¡Listo!', score:'1 / 3', topics:['x'], results: wrongRes(doDoesIds(2)) });
  assert(/Para reforzar/.test(html) && /data-rf="lesson"/.test(html));
  assert(/practica\.html\?skill=grammar/.test(html) && /Practicar más/.test(html), 'practicar lleva a la práctica gratis');
  assert(/curso\/do-does/.test(html) && /con membresía/.test(html));
  assert(!/summary-unlock/.test(html) && !/Descubrir el sistema completo/.test(html) && !/href="miembros\.html/.test(html), 'sin invitación a pagar fuera del límite');
  assert(!/ai-pitch/.test(html), 'sin pitch de Leo AI fuera del límite');
  assert(events.some(e => e[1] === 'reinforce_shown' && e[2].tier === 'free'), 'medición: recomendación mostrada');
});
test('Al llegar al límite del día sí aparece la invitación a la membresía', () => {
  const k = T.localDailyCountKey(); store[k] = String(T.GUEST_EXERCISE_LIMIT);
  assert.strictEqual(T.freeDailyLimitReached(), true);
  const html = T.renderFreeSessionSummary({ title:'¡Listo!', score:'1 / 3', topics:['x'], results: wrongRes(doDoesIds(2)) });
  assert(/href="miembros\.html/.test(html) && /Para reforzar/.test(html));
});
test('Sin errores no hay bloque de refuerzo ni invitación', () => {
  const html = T.renderFreeSessionSummary({ title:'¡Listo!', score:'3 / 3', topics:['x'], results: doDoesIds(2).map(id => ({ itemId:id, isCorrect:true })) });
  assert(!/Para reforzar/.test(html) && !/summary-unlock/.test(html));
});
test('Los textos de Inicio, Practicar y Miembros no anuncian "solo TO BE" ni "más cursos próximamente"', () => {
  ['index.html', 'practica.html', 'miembros.html'].forEach(f => { const h = fs.readFileSync(path.join(root, f), 'utf8'); assert(!/Más cursos, próximamente|hoy TO BE|Primer curso: TO BE|llegarán más adelante/.test(h), f); });
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ['pronombres', 'artículos', 'posesivos', 'presente simple', 'DO / DOES'].forEach(w => assert(idx.indexOf(w) >= 0, 'index menciona ' + w));
});
console.log('\n' + passed + ' pruebas ok');
