#!/usr/bin/env node
/* Pruebas de "Tu diagnóstico", el resumen semanal y su uso en Plan de estudio (app.js).
   Corre con:  node tools/tests/diagnosis.test.js   (desde la carpeta inglesconLeo)
   Carga el app.js y data.js REALES en un navegador simulado mínimo y prueba
   alumnos inventados en distintas situaciones. No toca Supabase ni la red. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');

const store = {};
const noop = ()=>{};
const fakeEl = ()=>({ style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop });
const ctx = {
  console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
  localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
  document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete',
    body: fakeEl(), documentElement: fakeEl(), createElement: fakeEl },
  location:{ hash:'', search:'', pathname:'/' }, navigator:{ userAgent:'node' }, addEventListener:noop,
  MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
  matchMedia:()=>({ matches:false, addEventListener:noop })
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { computeDiagnosis, computeWeeklyReport, computePlanSelection, summarizePlanSelection, buildPlanPool,
  planSkillAccuracy, computeMistakeIds, diagFamilyForTopic, getDiagItemIndex, PROGRESS_KEY, DIAG, PLAN_LENGTHS,
  G:GRAMMAR_BANK, LB:LISTENING_BANK, VB:VOCAB_BANK, WB:WRITING_BANK, RB:READING_BANK, isLeoAiEnabled };`, ctx);
const T = ctx.__t;

/* ---------- utilidades para armar alumnos inventados ---------- */
const DAY = 86400000, NOW = Date.now();
const dateStr = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
function famItems(fid){
  const out = [];
  Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g=>{
    const f = T.diagFamilyForTopic(g.topic);
    if(f && f.id === fid) g.items.forEach(i => out.push(i.id));
  })));
  return out;
}
const flat = bank => { const o = []; Object.keys(bank).forEach(l => bank[l].forEach(v => v.forEach(i => o.push(i.id)))); return o; };
const IDS = {
  prep: famItems('preposiciones'), tobe: famItems('to-be'), pasado: famItems('pasado'),
  lis: flat(T.LB), voc: flat(T.VB), wri: flat(T.WB), rea: flat(T.RB)
};
// n respuestas de una lista de ids, con un % de aciertos exacto y repartidas en el orden dado
function answers(ids, n, pctOk, offset){
  const out = [];
  for(let i=0; i<n; i++){
    const ok = Math.round((i+1) * pctOk / 100) > Math.round(i * pctOk / 100);
    out.push({ itemId: ids[(i + (offset||0)) % ids.length], isCorrect: ok });
  }
  return out;
}
function session(skill, daysAgo, results){
  const t = NOW - daysAgo * DAY;
  return { skill, level:'facil', topics:[], date: dateStr(t), startedAt: t, durationMs: 240000, results };
}
function setProgress(sessions){ store[T.PROGRESS_KEY] = JSON.stringify({ sessions, lastActivity:null }); }
function allText(d, w){
  return JSON.stringify([d.insights, d.actions, w]);
}
function noJunk(d, w, name){
  const txt = allText(d, w);
  assert(!/undefined|NaN|null%|Infinity/.test(txt), name + ': texto con valores rotos: ' + txt);
  assert(!/—/.test(txt), name + ': texto con raya larga (em dash)');
}
function planOk(target, name){
  for(let k=0; k<60; k++){
    const sel = T.computePlanSelection('facil', target);
    const sum = sel.mistakeCount + Object.values(sel.bySkill).reduce((a,b)=>a+b, 0);
    assert.strictEqual(sum, target, name + ': el plan no suma ' + target + ' (' + sum + ')');
    Object.values(sel.bySkill).forEach(v => assert(Number.isInteger(v) && v >= 0, name + ': cupo invalido ' + v));
    const pool = T.buildPlanPool('facil', sel);
    assert.strictEqual(pool.length, target, name + ': el pool real no tiene ' + target + ' ejercicios (' + pool.length + ')');
    const ids = pool.map(e => e.item.id);
    assert.strictEqual(new Set(ids).size, ids.length, name + ': ejercicio repetido dentro de la misma sesión');
  }
}

let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}

console.log('Tu diagnóstico');

test('miembro nuevo sin datos: no afirma nada y el plan funciona igual que antes', ()=>{
  setProgress([]);
  const d = T.computeDiagnosis(undefined, null), w = T.computeWeeklyReport(d);
  assert.strictEqual(d.ready, false); assert.strictEqual(d.total, 0);
  assert.strictEqual(d.insights.length, 0); assert.strictEqual(d.actions.length, 0);
  assert.strictEqual(w.exercises, 0); assert.strictEqual(w.focus, null);
  noJunk(d, w, 'nuevo');
  const sel = T.computePlanSelection('facil', 9);
  assert.strictEqual(sel.focus, null);
  planOk(9, 'nuevo');
});

test('pocos datos (10 respuestas): pide más ejercicios y no opina de ningún tema', ()=>{
  setProgress([session('gramatica', 1, answers(IDS.prep, 10, 20))]);
  const d = T.computeDiagnosis(undefined, null), w = T.computeWeeklyReport(d);
  assert.strictEqual(d.ready, false); assert.strictEqual(d.remaining, 5);
  assert.strictEqual(d.insights.length, 0); assert.strictEqual(d.weak, undefined);
  noJunk(d, w, 'pocos');
  assert.strictEqual(T.computePlanSelection('facil', 9).focus, null, 'no debe haber refuerzo sin diagnóstico');
});

test('sin conclusiones con muestras chicas: un tema con 7 respuestas no tiene estado', ()=>{
  const s = [session('vocabulario', 2, answers(IDS.voc, 20, 80)), session('gramatica', 2, answers(IDS.pasado, 7, 0))];
  setProgress(s);
  const d = T.computeDiagnosis(undefined, null);
  const pas = d.units.find(u => u.key === 'family:pasado');
  assert(pas && pas.state === null, 'Pasado con 7 respuestas no debe tener estado');
  assert(!d.weak || d.weak.key !== 'family:pasado', 'no puede ser punto débil con 7 respuestas');
});

test('mejora real: detecta "Mejoraste en Verbo to be" con los % correctos', ()=>{
  const s = [];
  for(let k=0; k<4; k++) s.push(session('gramatica', 20 - k*3, answers(IDS.tobe, 10, 40, k)));
  for(let k=0; k<3; k++) s.push(session('gramatica', 4 - k, answers(IDS.tobe, 10, 90, k)));
  setProgress(s);
  const d = T.computeDiagnosis(undefined, null), w = T.computeWeeklyReport(d);
  const u = d.units.find(x => x.key === 'family:to-be');
  assert.strictEqual(u.trend, 'up'); assert.strictEqual(u.prevAcc, 40); assert.strictEqual(u.recentAcc, 90);
  assert.strictEqual(u.state, 'mejorando');
  assert(d.insights.some(i => i.text === 'Mejoraste en Verbo to be: de 40% a 90% de aciertos.'), JSON.stringify(d.insights));
  assert(w.improved.includes('Verbo to be'));
  assert(!d.insights.some(i => /Mejoraste en Gramática/.test(i.text)), 'no repetir la mejora como "Gramática"');
  noJunk(d, w, 'mejora');
});

test('retroceso: Listening de 90% a 50% se marca, se dice y pasa a reforzar', ()=>{
  const s = [];
  for(let k=0; k<4; k++) s.push(session('listening', 25 - k*4, answers(IDS.lis, 10, 90, k*10)));
  for(let k=0; k<3; k++) s.push(session('listening', 5 - k, answers(IDS.lis, 10, 50, k*10)));
  s.push(session('vocabulario', 3, answers(IDS.voc, 20, 95)));
  setProgress(s);
  const d = T.computeDiagnosis(undefined, null), w = T.computeWeeklyReport(d);
  const u = d.units.find(x => x.key === 'skill:listening');
  assert.strictEqual(u.trend, 'down'); assert.strictEqual(u.state, 'refuerzo');
  assert(d.insights.some(i => i.tone === 'down' && /Bajaste en Listening: de 90% a 50%/.test(i.text)));
  assert.strictEqual(d.weak.key, 'skill:listening');
  assert(d.strength && d.strength.key === 'skill:vocabulario', 'fortaleza: Vocabulario');
  noJunk(d, w, 'retroceso');
});

test('Plan de estudio usa el mismo % que el diagnóstico y da más cupos a lo que bajó', ()=>{
  // continúa con el alumno del retroceso
  const d = T.computeDiagnosis(undefined, null);
  const u = d.units.find(x => x.key === 'skill:listening');
  assert.strictEqual(T.planSkillAccuracy(JSON.parse(store[T.PROGRESS_KEY]), 'listening', d), u.current);
  let lis = 0, voc = 0;
  for(let k=0; k<300; k++){ const sel = T.computePlanSelection('facil', 15); lis += sel.bySkill.listening; voc += sel.bySkill.vocabulario; }
  assert(lis > voc, 'Listening (bajó a 50%) debe recibir más cupos que Vocabulario (95%): ' + lis + ' vs ' + voc);
  planOk(15, 'retroceso');
});

test('errores repetidos: se agrupan y se nombra el tema (sin red, regla de Mis errores)', ()=>{
  const s = [];
  const four = IDS.prep.slice(0, 4);
  for(let k=0; k<3; k++) s.push(session('gramatica', 6 - k, four.map(id => ({ itemId:id, isCorrect:false }))));
  s.push(session('vocabulario', 1, answers(IDS.voc, 12, 100)));
  setProgress(s);
  const d = T.computeDiagnosis(undefined, null), w = T.computeWeeklyReport(d);
  assert.strictEqual(d.activeMistakes, T.computeMistakeIds().length, 'mismo conteo que Mis errores');
  assert(d.repeated[0] && d.repeated[0].label === 'Preposiciones' && d.repeated[0].count === 4);
  assert(d.insights.some(i => i.text === 'Sigues fallando con Preposiciones: 4 ejercicios que ya fallaste más de una vez.'));
  assert.strictEqual(d.weak.key, 'family:preposiciones');
  assert(d.actions[0].title === 'Reforzar Preposiciones' && d.actions[0].article === 'articulo-in-on-at.html');
  const sel = T.computePlanSelection('facil', 9);
  assert(sel.focus && sel.focus.familyId === 'preposiciones', 'el plan incluye refuerzo de Preposiciones');
  planOk(9, 'repetidos');
  noJunk(d, w, 'repetidos');
});

test('errores repetidos con mistake_stats (Supabase): usa fail_count y estado', ()=>{
  const map = new Map();
  IDS.prep.slice(0, 3).forEach(id => map.set(id, { item_id:id, status:'active', fail_count:3, correct_streak:0, last_seen_at:new Date().toISOString() }));
  map.set(IDS.prep[3], { item_id:IDS.prep[3], status:'active', fail_count:1, correct_streak:0, last_seen_at:new Date().toISOString() });
  const d = T.computeDiagnosis(undefined, map);
  assert.strictEqual(d.activeMistakes, 4);
  assert(d.repeated[0].count === 3, 'solo cuenta los fallados 2+ veces');
});

test('errores recuperados y dominados esta semana (Supabase)', ()=>{
  const now = new Date().toISOString(), old = new Date(NOW - 20*DAY).toISOString();
  const map = new Map([
    ['a', { item_id:IDS.prep[0], status:'recovered', fail_count:2, recovered_at:now, updated_at:now }],
    ['b', { item_id:IDS.prep[1], status:'mastered', fail_count:1, recovered_at:now, updated_at:now }],
    ['c', { item_id:IDS.prep[2], status:'recovered', fail_count:1, recovered_at:old, updated_at:old }]
  ]);
  const d = T.computeDiagnosis(undefined, map), w = T.computeWeeklyReport(d);
  assert.strictEqual(d.recoveredWeek, 2, 'recuperados esta semana (incluye el que luego se dominó)');
  assert.strictEqual(d.masteredWeek, 1);
  assert.strictEqual(w.recovered, 2); assert.strictEqual(w.mastered, 1);
  assert(d.insights.some(i => i.text === 'Recuperaste 2 errores esta semana.'));
});

test('errores recuperados sin red: falló y luego 2 aciertos seguidos esta semana', ()=>{
  const id = IDS.prep[0];
  setProgress([
    session('gramatica', 10, [{ itemId:id, isCorrect:false }]),
    session('gramatica', 3, [{ itemId:id, isCorrect:true }]),
    session('gramatica', 1, [{ itemId:id, isCorrect:true }]),
    session('vocabulario', 1, answers(IDS.voc, 14, 90))
  ]);
  const d = T.computeDiagnosis(undefined, null);
  assert.strictEqual(d.recoveredWeek, 1);
  assert.strictEqual(d.activeMistakes, T.computeMistakeIds().length);
});

test('semanas sin actividad: no inventa tendencias, sugiere volver y la meta es retomar', ()=>{
  const s = [];
  for(let k=0; k<5; k++) s.push(session('gramatica', 60 - k*5, answers(IDS.pasado, 10, 50, k)));
  for(let k=0; k<3; k++) s.push(session('listening', 45 - k*5, answers(IDS.lis, 10, 85, k*10)));
  setProgress(s);
  const d = T.computeDiagnosis(undefined, null), w = T.computeWeeklyReport(d);
  assert(d.ready);
  d.units.forEach(u => assert.strictEqual(u.trend, null, 'sin tendencia sin datos recientes: ' + u.key));
  assert(!d.insights.some(i => /Mejoraste|Bajaste|esta semana/.test(i.text)), JSON.stringify(d.insights));
  assert.strictEqual(w.exercises, 0); assert.strictEqual(w.days, 0);
  assert.strictEqual(w.goal, 'Retomar tu ritmo: practicar al menos 3 días esta semana.');
  assert(d.actions.some(a => /^Volver a /.test(a.title) && /Hace \d+ días/.test(a.reason)), JSON.stringify(d.actions));
  planOk(9, 'inactivo');
  noJunk(d, w, 'inactivo');
});

test('mucha actividad (400 sesiones, 4.000 respuestas): rápido y coherente', ()=>{
  const s = [];
  const pools = [['gramatica', IDS.prep, 55], ['gramatica', IDS.tobe, 92], ['listening', IDS.lis, 78], ['vocabulario', IDS.voc, 88], ['writing', IDS.wri, 70], ['lectura', IDS.rea, 81]];
  for(let k=0; k<400; k++){
    const [sk, ids, pct] = pools[k % pools.length];
    s.push(session(sk, 120 - k * 0.3, answers(ids, 10, pct, k * 7)));
  }
  setProgress(s);
  const t0 = Date.now();
  const d = T.computeDiagnosis(undefined, null);
  const ms = Date.now() - t0;
  const w = T.computeWeeklyReport(d);
  assert(ms < 300, 'tardó ' + ms + ' ms');
  assert(d.ready && d.total === 4000);
  const tobe = d.units.find(u => u.key === 'family:to-be');
  assert.strictEqual(tobe.state, 'dominado');
  assert(d.mastered.some(u => u.id === 'to-be'));
  assert.strictEqual(d.weak.key, 'family:preposiciones');
  assert(d.insights.length <= 6 && d.actions.length <= 3);
  planOk(15, 'mucha actividad');
  noJunk(d, w, 'mucha actividad');
  console.log('       (diagnóstico de 4.000 respuestas en ' + ms + ' ms)');
});

test('"Dominado" exige muestra: 100% con 9 respuestas no es dominado', ()=>{
  setProgress([session('vocabulario', 1, answers(IDS.voc, 9, 100)), session('listening', 1, answers(IDS.lis, 10, 60))]);
  const d = T.computeDiagnosis(undefined, null);
  const v = d.units.find(u => u.key === 'skill:vocabulario');
  assert.notStrictEqual(v.state, 'dominado');
  assert.strictEqual(d.strength, null, 'no hay fortaleza con menos de 15 respuestas en una habilidad');
});

test('ejercicios de Mixto y del Plan cuentan en su habilidad real', ()=>{
  setProgress([
    session('mixto', 1, answers(IDS.lis.slice(0, 50), 10, 80)),
    session('plan', 1, answers(IDS.voc.slice(0, 50), 10, 70).map(r => Object.assign(r, { skill:'vocabulario' })))
  ]);
  const d = T.computeDiagnosis(undefined, null);
  assert.strictEqual(d.units.find(u => u.key === 'skill:listening').n, 10);
  assert.strictEqual(d.units.find(u => u.key === 'skill:vocabulario').n, 10);
  assert(!d.units.some(u => u.id === 'mixto' || u.id === 'plan'));
});

test('Speaking (sin calificar) y secciones de examen no entran al diagnóstico', ()=>{
  setProgress([
    session('speaking', 1, [{ itemId:'s-facil-1', isCorrect:null }, { itemId:'s-facil-2', isCorrect:null }]),
    session('toefl-reading', 1, [{ itemId:'toefl-r-1', isCorrect:true }])
  ]);
  const d = T.computeDiagnosis(undefined, null);
  assert.strictEqual(d.total, 0);
});

test('Leo AI queda totalmente apagado (ni con modo prueba ni siendo miembro)', ()=>{
  store.leo_ai_beta = '1'; ctx.__leoMemberVerified = true;
  assert.strictEqual(T.isLeoAiEnabled(), false);
  delete store.leo_ai_beta; delete ctx.__leoMemberVerified;
});

console.log((failed ? failed + ' prueba(s) fallaron, ' : '') + passed + ' pruebas pasaron');
process.exit(failed ? 1 : 0);
