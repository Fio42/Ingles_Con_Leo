#!/usr/bin/env node
/* Refuerzo con ejercicios DISTINTOS: el foco trae preguntas nuevas del mismo microtema, no repite la que acaba de fallar y salta lo que ya domina. Usa el app.js y data.js REALES en un navegador simulado, con un reloj
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
;this.__t = { recordSession, loadProgress, pickDiagFocusItems, pickSkillFocusItems, TEMA_BY_ID, VOCAB_BANK, computeDiagnosis, microDiagActions, microFlowState, microIsActive, computePlanSelection, buildPlanPool,
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
const MICRO = 'going-to-evidencia';
const microItems = () => { const out = []; T.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === MICRO) out.push(i.id); }))); return out; };
const famOf = () => T.TEMA_BY_ID[T.MICRO_BY_ID[MICRO].tema].family;
const temaOf = () => T.MICRO_BY_ID[MICRO].tema;
let clock = 1000;
const session = (ids, ok) => T.recordSession({ skill:'gramatica', level:'medio', topics:['x'], startedAt: (clock += 100000), results: ids.map(id => ({ itemId:id, isCorrect: typeof ok === 'function' ? ok(id) : ok })) });
const focus = n => plain(T.pickDiagFocusItems('medio', famOf(), n, new Set(), temaOf(), MICRO)).map(e => e.item.id);
const inMicro = id => microItems().indexOf(id) >= 0;

console.log('Refuerzo con ejercicios distintos');
test('Sin historial: el foco ofrece ejercicios del microtema', () => {
  const ids = focus(4);
  assert.strictEqual(ids.length, 4); assert(ids.every(inMicro));
});
test('Falló 2 ejercicios en la última sesión: el refuerzo trae otros del mismo microtema primero', () => {
  const m = microItems(); assert(m.length >= 6);
  session([m[0], m[1]], false);
  const ids = focus(4);
  assert.strictEqual(ids.length, 4);
  assert(ids.every(inMicro), 'todo del mismo microtema');
  assert(!ids.slice(0, 4).includes(m[0]) && !ids.slice(0, 4).includes(m[1]), 'no repite lo que acaba de fallar si hay otros: ' + ids);
});
test('Lo que ya domina (último resultado correcto) no vuelve a salir', () => {
  const m = microItems();
  session([m[2]], false); session([m[2]], true);
  const ids = focus(m.length);
  assert(!ids.includes(m[2]), 'dominado fuera');
});
test('Si no quedan nuevos, completa con lo fallado antes y deja para el final lo de la última sesión', () => {
  const m = microItems();
  session(m.slice(0, 3), false);                       // falló 3 hace tiempo
  session(m.slice(3), true);                           // dominó el resto
  session([m[0]], false);                              // la sesión más reciente: m[0]
  const ids = focus(5);
  const iA = ids.indexOf(m[0]);
  assert(!ids.some(id => m.slice(3).includes(id)), 'sin dominados');
  assert(ids.includes(m[1]) && ids.includes(m[2]));
  if(iA >= 0) assert(iA > ids.indexOf(m[1]) && iA > ids.indexOf(m[2]), 'lo de la última sesión al final');
});
test('Vocabulario: el foco por tema evita lo dominado y prioriza lo no visto', () => {
  const t = T.TEMA_BY_ID['vocab-confusas'];
  const lvl = ['principiante', 'facil', 'medio', 'avanzado'].find(l => plain(T.pickSkillFocusItems('vocabulario', l, 'vocab-confusas', 20, new Set())).length >= 4);
  assert(lvl, 'hay un nivel con ejercicios del tema');
  const all = plain(T.pickSkillFocusItems('vocabulario', lvl, 'vocab-confusas', 20, new Set())).map(e => e.item.id);
  T.recordSession({ skill:'vocabulario', level:lvl, topics:['x'], startedAt: 5000, results: [{ itemId: all[0], isCorrect:false }, { itemId: all[1], isCorrect:true }] });
  const after = plain(T.pickSkillFocusItems('vocabulario', lvl, 'vocab-confusas', 20, new Set())).map(e => e.item.id);
  assert(!after.includes(all[1]), 'el dominado sale');
  assert(after.indexOf(all[0]) === after.length - 1 || after.indexOf(all[0]) > 0, 'el fallado hace un momento no va primero');
});
console.log('\n' + passed + ' pruebas ok');
