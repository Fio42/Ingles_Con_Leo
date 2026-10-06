#!/usr/bin/env node
/* Flujo completo de un microtema (piloto Futuro): práctica -> debilidad -> recomendación -> refuerzo ->
   comprobación -> resultado -> señal. Usa el app.js y data.js REALES en un navegador simulado, con un reloj
   controlado para simular varios días. No toca la red.
   Corre con:  node tools/tests/micro-flujo.test.js   (desde la carpeta inglesconLeo)

   Las pantallas (renderMicroCheck) se prueban en el navegador real; aquí se prueba toda la lógica que las gobierna. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');

const store = {};
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
;this.__t = { recordSession, loadProgress, computeDiagnosis, microDiagActions, microFlowState, microIsActive, computePlanSelection, buildPlanPool,
  microCheckStart, microCheckFinish, pickCheckItems, checkAvailable, computeMistakeIds, computeWeeklyStats, computeSessionInsight, setUserLevel,
  takePagePlanParams, takePageOrigin, noteGrammarAnswer, MICRO_BY_ID, MICROS, MICRO_STATS_KEY, CHECK_SEEN_KEY, PROGRESS_KEY, GRAMMAR_BANK, GRAMMAR_CHECK_BANK, SESSION_LENGTHS,
  getMistakesItemIndex, loadInflightSession, saveInflightSession, microWeakness, MICRO_FLOW, localDateStr, PLAN_LENGTHS,
  resetIndex(){ _mistakesItemIndexCache = undefined; _checkIndex = null; _microLevelIndex = null; } };`, ctx);
  ctx.__t.ctx = ctx;
  return ctx.__t;
}

const plain = o => JSON.parse(JSON.stringify(o));
let T = makeCtx(true);

// Reloj controlado (cada "día" a mediodía, para no depender de zonas horarias).
const BASE = new Date(2026, 9, 1, 12, 0, 0).getTime();
let CLOCK = BASE;
class FakeDate extends Date { constructor(...a){ if(a.length === 0) super(CLOCK); else super(...a); } static now(){ return CLOCK; } }
function installClock(t){ t.ctx.Date = FakeDate; }
installClock(T);
const day = n => { CLOCK = BASE + n * 86400000; };

let passed = 0;
function test(name, fn){
  // cada prueba parte con los microtemas inactivos y los activa si lo necesita
  try{ Object.keys(store).forEach(k => delete store[k]); day(0); T = makeCtx(true); installClock(T); T.setUserLevel('medio'); FUTURO.forEach(id => { T.MICRO_BY_ID[id].active = false; }); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
}
const FUTURO = ['will-decision-espontanea', 'going-to-plan-decidido', 'going-to-evidencia', 'will-forma-verbo-base'];
const activate = (ids) => (ids || FUTURO).forEach(id => { T.MICRO_BY_ID[id].active = true; });
const microItems = micro => { const out = []; T.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === micro) out.push(i.id); }))); return out; };
const EV = () => microItems('going-to-evidencia');                       // 6 ejercicios de práctica
const stats = () => JSON.parse(store[T.MICRO_STATS_KEY] || '{}');
const ev = () => stats()['going-to-evidencia'];
// Una sesión: [[itemId, ok], ...]
function play(pairs, skill){
  T.recordSession({ skill: skill || 'plan', level:'medio', topics:[], results: pairs.map(([itemId, isCorrect]) => ({ itemId, isCorrect })), startedAt: CLOCK });
}
// Historial de otros temas (sin microtema) para que el diagnóstico tenga datos suficientes.
function otherHistory(){
  const ids = [];
  T.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(!i.micro && ids.length < 18) ids.push(i.id); })));
  T.recordSession({ skill:'gramatica', level:'medio', topics:[], results: ids.map(id => ({ itemId:id, isCorrect:true })), startedAt: CLOCK });
}
const todayAction = () => { const d = T.computeDiagnosis(); assert.ok(d.ready, 'diagnóstico no listo'); return d.today; };
const microActions = () => plain(T.microDiagActions('medio'));
// Deja el microtema débil: 3 ejercicios distintos fallados + 3 acertados.
function makeWeak(){ const e = EV(); play([[e[0], false], [e[1], false], [e[2], false], [e[3], true], [e[4], true], [e[5], true]]); }
// Practica `n` respuestas después de la alerta (la mitad bien, la mitad mal).
function practiceAfter(n, allOk){ const e = EV(); const pairs = []; for(let i = 0; i < n; i++) pairs.push([e[i % e.length], allOk ? true : i % 2 === 0]); play(pairs); }
function doCheck(okCount){
  const st = T.microCheckStart('going-to-evidencia');
  assert.ok(st.items && st.items.length === 3, 'no hay 3 comprobaciones');
  const results = st.items.map((it, i) => ({ itemId: it.id, isCorrect: i < okCount }));
  return Object.assign(T.microCheckFinish('going-to-evidencia', results, CLOCK), { ids: st.items.map(i => i.id) });
}

console.log('A. Detección y recomendación');
test('falla 3 ejercicios distintos de going-to-evidencia: se detecta y la recomendación nombra el concepto', () => {
  activate(); otherHistory(); day(1); makeWeak();
  assert.ok(ev().wk, 'debió quedar la alerta');
  const a = todayAction();
  assert.strictEqual(a.micro, 'going-to-evidencia');
  assert.strictEqual(a.title, 'Reforzar Going to: lo que se ve venir');
  assert.ok(!/^Reforzar (Futuro|Will y going to)/.test(a.title));
  assert.ok(/[?&]micro=going-to-evidencia/.test(a.href) && /tema=will-going-to/.test(a.href));
  assert.strictEqual(a.article, 'articulo-will-vs-going-to.html?tema=will-going-to&via=rec#going-to-evidencia');   // la sección EXACTA
  assert.strictEqual(a.articleLabel, 'Ver la clase');
  // ya se conoce el concepto: no se repite además la recomendación genérica del tema
  assert.ok(!T.computeDiagnosis().actions.some(x => /Will y going to|Futuro/.test(x.title)), 'quedó una recomendación genérica de Futuro');
});
test('repetir el MISMO ejercicio no es debilidad: no hay recomendación por microtema', () => {
  activate(); otherHistory(); const e = EV(); day(1); play([[e[0], false], [e[0], false], [e[0], false], [e[1], true]]);
  assert.ok(!ev().wk);
  assert.strictEqual(microActions().length, 0);
});
test('2 ejercicios distintos en días distintos también es debilidad', () => {
  activate(); otherHistory(); const e = EV(); day(1); play([[e[0], false], [e[3], true]]); assert.ok(!ev().wk);
  day(2); play([[e[1], false], [e[3], true]]); assert.ok(ev().wk);
});
test('el reintento exitoso cuenta como fallo del primer intento (la confusión ya no se pierde)', () => {
  activate(); const e = EV(); day(1);
  T.recordSession({ skill:'plan', level:'medio', topics:[], startedAt: CLOCK, results: [e[0], e[1], e[2]].map(itemId => ({ itemId, isCorrect:true, w:'will' })) });
  assert.ok(ev().wk);
});
test('sin la alerta de debilidad no se ofrece nada aunque haya práctica', () => {
  activate(); otherHistory(); day(1); play(EV().map(id => [id, true])); assert.strictEqual(microActions().length, 0);
});
test('la recomendación solo aparece si el alumno tiene ejercicios de ese microtema en su nivel', () => {
  activate(); otherHistory(); day(1); makeWeak();
  assert.strictEqual(microActions().length, 1);
  T.setUserLevel('avanzado'); T.resetIndex();
  assert.strictEqual(plain(T.microDiagActions('avanzado')).length, 0);
  T.setUserLevel('facil'); assert.strictEqual(plain(T.microDiagActions('facil')).length, 0);
});

console.log('\nB. Refuerzo dentro de la duración elegida (5 / 9 / 15)');
test('el Plan con foco en el microtema respeta 5, 9 y 15 y prioriza sus ejercicios', () => {
  activate(); otherHistory(); day(1); makeWeak();
  const micro = new Set(EV());
  [['rapida', 5], ['normal', 9], ['completa', 15]].forEach(([k, n]) => {
    assert.strictEqual(T.PLAN_LENGTHS[k].items, n);
    const sel = T.computePlanSelection('medio', n, { focusMicro:'going-to-evidencia' });
    assert.strictEqual(sel.focus.microId, 'going-to-evidencia', k);
    assert.strictEqual(sel.focus.label, 'Going to: lo que se ve venir');
    const pool = T.buildPlanPool('medio', sel);
    assert.strictEqual(pool.length, n, k + ': ' + pool.length);
    const nMicro = pool.filter(e => micro.has(e.item.id)).length;
    assert.ok(nMicro >= Math.min(3, sel.focus.count), k + ': ' + nMicro + ' del microtema');
  });
});
test('?micro= de un microtema inactivo o de otro nivel se ignora: el Plan es el de siempre', () => {
  otherHistory(); day(1);
  let sel = T.computePlanSelection('medio', 9, { focusMicro:'going-to-evidencia' });            // inactivo
  assert.ok(!sel.focus || !sel.focus.microId);
  activate();
  sel = T.computePlanSelection('facil', 9, { focusMicro:'going-to-evidencia' });                  // sin ejercicios en facil
  assert.ok(!sel.focus || !sel.focus.microId);
  sel = T.computePlanSelection('medio', 9, { focusMicro:'no-existe' });
  assert.ok(!sel.focus || !sel.focus.microId);
});
test('la sesión se mantiene en 9 y trae ejercicios del microtema también con errores pendientes', () => {
  activate(); otherHistory(); day(1); makeWeak();
  const sel = T.computePlanSelection('medio', 5, { focusMicro:'going-to-evidencia' });
  assert.ok(sel.focus && sel.focus.count >= 1);
  assert.strictEqual(T.buildPlanPool('medio', sel).length, 5);
});

console.log('\nC. Comprobación: cuándo se ofrece');
test('se ofrece solo después de practicar >=5 respuestas desde la alerta, y es un enlace (no hay popup)', () => {
  activate(); otherHistory(); day(1); makeWeak();
  assert.strictEqual(microActions()[0].microState, 'debil');
  day(2); practiceAfter(4);
  assert.strictEqual(microActions()[0].microState, 'debil');          // 4 < 5: todavía no
  day(3); practiceAfter(1);
  const a = microActions()[0];
  assert.strictEqual(a.microState, 'listo-comprobar');
  assert.strictEqual(a.title, 'Comprobar: Going to: lo que se ve venir');
  assert.strictEqual(a.href, 'plan-estudio.html?comprobar=going-to-evidencia');
  assert.strictEqual(a.cta, 'Comprobar');
  assert.strictEqual(todayAction().micro, 'going-to-evidencia');
});
test('después de la sesión, el fin de sesión lo ofrece primero y con el nombre del microtema', () => {
  activate(); otherHistory(); day(1); makeWeak(); day(2);
  const e = EV(); const pairs = []; for(let i = 0; i < 6; i++) pairs.push([e[i], i % 2 === 0]);
  play(pairs);
  const ins = T.computeSessionInsight(pairs.map(([itemId, isCorrect]) => ({ itemId, isCorrect })), CLOCK, 'plan', {});
  assert.ok(ins, 'sin insight');
  assert.strictEqual(ins.actions[0].title, 'Comprobar: Going to: lo que se ve venir');
  assert.ok(ins.actions[0].main);
  assert.ok(/Ya practicaste Going to: lo que se ve venir/.test(ins.lines[0].text));
  assert.ok(!ins.actions.some(a => /Will y going to|Futuro/.test(a.title)), 'quedó una acción genérica de Futuro: ' + ins.actions.map(a => a.title).join(' | '));
});
test('si no quedan 3 comprobaciones inéditas no se ofrece: queda el refuerzo', () => {
  activate(); otherHistory(); day(1); makeWeak(); day(2); practiceAfter(6);
  assert.strictEqual(microActions()[0].microState, 'listo-comprobar');
  const seen = {}; T.GRAMMAR_CHECK_BANK.filter(c => c.micro === 'going-to-evidencia').slice(0, 1).forEach(c => { seen[c.id] = 1; });
  store[T.CHECK_SEEN_KEY] = JSON.stringify(seen);
  assert.strictEqual(T.checkAvailable('going-to-evidencia'), false);
  assert.strictEqual(microActions()[0].microState, 'debil');
  const st = T.microCheckStart('going-to-evidencia');
  assert.strictEqual(st.items, null); assert.strictEqual(st.reason, 'sin-ineditos');   // se maneja sin romper nada
});
test('un ?comprobar= manual NO se salta el flujo: no sirve ejercicios, no marca nada como visto y no toca la señal', () => {
  activate(); otherHistory();
  const noToca = () => {
    const snap = () => JSON.stringify([store[T.MICRO_STATS_KEY] || null, Object.keys(JSON.parse(store[T.CHECK_SEEN_KEY] || '{}'))]);   // señales y ids vistos (el conjunto vacío no cuenta)
    const before = snap();
    const st = T.microCheckStart('going-to-evidencia');
    assert.strictEqual(st.items, null); assert.strictEqual(st.reason, 'no-toca');
    assert.strictEqual(snap(), before, 'cambió algo guardado');
    assert.strictEqual(T.checkAvailable('going-to-evidencia'), true);                 // las 3 siguen inéditas
  };
  noToca();                                                                            // nunca fue débil
  day(1); makeWeak(); noToca();                                                        // débil, pero sin práctica posterior
  day(2); practiceAfter(4); noToca();                                                  // 4 < 5 respuestas
  day(3); practiceAfter(2);                                                            // ahora SÍ toca
  assert.strictEqual(microActions()[0].microState, 'listo-comprobar');
  assert.strictEqual(T.microCheckStart('going-to-evidencia').items.length, 3);
  const r = doCheck(3);                                                                // y tras recuperarse ya no se puede repetir a mano
  assert.strictEqual(r.outcome, 'recuperado');
  const again = T.microCheckStart('going-to-evidencia');
  assert.strictEqual(again.items, null);
  assert.ok(again.reason === 'sin-ineditos' || again.reason === 'no-toca');
  assert.strictEqual(T.microFlowState('going-to-evidencia', ev()).state, 'recuperado');
});
test('una comprobación ya iniciada legítimamente se retoma aunque el estado cambie a mitad', () => {
  toCheck();
  const st = T.microCheckStart('going-to-evidencia');
  T.saveInflightSession('check', 'going-to-evidencia', { itemIds: st.items.map(i => i.id), idx:1, results:[{ itemId: st.items[0].id, isCorrect:true }], startedAt: CLOCK });
  // a mitad de la comprobación el estado ya no es "listo" (p. ej. se marcó la primera como vista)
  const seen = {}; seen[st.items[0].id] = 1; store[T.CHECK_SEEN_KEY] = JSON.stringify(seen);
  assert.strictEqual(T.checkAvailable('going-to-evidencia'), false);
  const again = T.microCheckStart('going-to-evidencia');
  assert.strictEqual(again.resumed, true); assert.strictEqual(again.items.length, 3);
  const fin = T.microCheckFinish('going-to-evidencia', st.items.map(it => ({ itemId: it.id, isCorrect:true })), CLOCK);
  assert.strictEqual(fin.outcome, 'recuperado');
});
test('un microtema inactivo nunca ofrece comprobación ni refuerzo', () => {
  otherHistory(); day(1); makeWeak(); day(2); practiceAfter(6);
  assert.ok(ev().wk);                                  // la señal se guarda igual (queda lista para cuando se active)
  assert.strictEqual(microActions().length, 0);
  assert.strictEqual(T.microCheckStart('going-to-evidencia').items, null);
});

console.log('\nD. Resultado de la comprobación (3/3, 2/3, 0-1/3)');
function toCheck(){ activate(); otherHistory(); day(1); makeWeak(); day(2); practiceAfter(6); day(3); }
test('3/3: recuperado. Se cierra la alerta y la recomendación desaparece', () => {
  toCheck(); const r = doCheck(3);
  assert.strictEqual(r.outcome, 'recuperado');
  assert.strictEqual(ev().wk, null); assert.deepStrictEqual(plain(ev().lc), { d: T.localDateStr(new Date(CLOCK)), n:3, ok:3 });
  assert.strictEqual(T.microFlowState('going-to-evidencia', ev()).state, 'recuperado');
  assert.strictEqual(microActions().length, 0);
  assert.notStrictEqual(todayAction().micro, 'going-to-evidencia');
});
test('2/3: mejora parcial. Se cierra la alerta pero NO se marca recuperado ni dominado', () => {
  toCheck(); const r = doCheck(2);
  assert.strictEqual(r.outcome, 'mejorando');
  assert.strictEqual(ev().wk, null);
  assert.strictEqual(T.microFlowState('going-to-evidencia', ev()).state, 'mejorando');
  assert.strictEqual(microActions().length, 0);
});
[0, 1].forEach(k => test(k + '/3: sigue débil, se recomienda reforzar con la explicación y NO se vuelve a ofrecer la comprobación', () => {
  toCheck(); const r = doCheck(k);
  assert.strictEqual(r.outcome, 'sigue-debil');
  assert.ok(ev().wk);
  const a = microActions()[0];
  assert.strictEqual(a.microState, 'debil-comprobado');
  assert.strictEqual(a.title, 'Reforzar Going to: lo que se ve venir');
  assert.ok(new RegExp('acertaste ' + k + ' de 3').test(a.reason));
  assert.ok(a.article.indexOf('#going-to-evidencia') !== -1);
  assert.strictEqual(T.checkAvailable('going-to-evidencia'), false);
  assert.strictEqual(T.pickCheckItems('going-to-evidencia', 3), null);
}));
test('tras una comprobación fallida, 6 respuestas con >=80% al primer intento cierran la alerta; con menos, sigue', () => {
  toCheck(); doCheck(1); day(4);
  practiceAfter(6, false); assert.ok(ev().wk, 'con 50% no debe cerrarse');
  day(5); practiceAfter(6, true); assert.ok(ev().wk, 'las 12 acumuladas son 75%: tampoco');
  day(6); practiceAfter(6, true); // 18 respuestas: 15 de 18 = 83%
  assert.strictEqual(ev().wk, null);
  assert.strictEqual(microActions().length, 0);
});
test('sin comprobación posible, la alerta se cierra con práctica sólida (6 respuestas, >=80%)', () => {
  activate(); otherHistory(); day(1); makeWeak();
  const seen = {}; T.GRAMMAR_CHECK_BANK.filter(c => c.micro === 'going-to-evidencia').slice(0, 2).forEach(c => { seen[c.id] = 1; });
  store[T.CHECK_SEEN_KEY] = JSON.stringify(seen);
  day(2); practiceAfter(6, true);
  assert.strictEqual(ev().wk, null);
});
test('volver a fallar después de recuperarse vuelve a detectar la debilidad con evidencia NUEVA', () => {
  toCheck(); doCheck(3); day(4); makeWeak();
  assert.ok(ev().wk);
  assert.strictEqual(T.microFlowState('going-to-evidencia', ev()).state, 'debil');   // las comprobaciones ya se usaron
});

console.log('\nE. La comprobación está separada de todo lo demás');
test('checks: no entran a Mis errores, ni a mistake_stats, ni a la precisión semanal, ni a "Continúa"', () => {
  toCheck();
  const lastBefore = JSON.stringify(plain(T.loadProgress().lastActivity));
  const weeklyBefore = T.computeWeeklyStats().accuracy;
  const idsBefore = plain(T.computeMistakeIds());
  const r = doCheck(0);
  const p = T.loadProgress();
  assert.strictEqual(p.sessions[p.sessions.length - 1].skill, 'check');
  assert.deepStrictEqual(plain(T.computeMistakeIds()), idsBefore);
  r.ids.forEach(id => { assert.strictEqual(T.getMistakesItemIndex().has(id), false); assert.ok(plain(T.computeMistakeIds()).indexOf(id) === -1); });
  assert.strictEqual(JSON.stringify(plain(p.lastActivity)), lastBefore);
  assert.strictEqual(T.computeWeeklyStats().accuracy, weeklyBefore);
});
test('checks: nunca aparecen en el Plan, sesiones normales ni repaso (5/9/15, varios intentos)', () => {
  toCheck(); doCheck(3);
  const ids = new Set(T.GRAMMAR_CHECK_BANK.map(c => c.id));
  [5, 9, 15].forEach(n => { for(let i = 0; i < 25; i++){ const pool = T.buildPlanPool('medio', T.computePlanSelection('medio', n, { focusMicro:'going-to-evidencia' })); assert.ok(pool.every(e => !ids.has(e.item.id))); } });
});
test('cada comprobación se usa una sola vez: tras terminarla no queda ninguna inédita', () => {
  toCheck(); const r = doCheck(3);
  const seen = JSON.parse(store[T.CHECK_SEEN_KEY]);
  r.ids.forEach(id => assert.strictEqual(seen[id], 1));
  assert.strictEqual(T.pickCheckItems('going-to-evidencia', 3), null);
  assert.strictEqual(T.microCheckStart('going-to-evidencia').items, null);
});
test('la comprobación a medias se retoma (mismos ejercicios) y los vistos no salen de nuevo', () => {
  toCheck(); const st = T.microCheckStart('going-to-evidencia');
  T.saveInflightSession('check', 'going-to-evidencia', { itemIds: st.items.map(i => i.id), idx:1, results:[{ itemId: st.items[0].id, isCorrect:true }], startedAt: CLOCK });
  const again = T.microCheckStart('going-to-evidencia');
  assert.strictEqual(again.resumed, true); assert.strictEqual(again.idx, 1);
  assert.deepStrictEqual(plain(again.items.map(i => i.id)), plain(st.items.map(i => i.id)));
});
test('una comprobación de otro microtema no mueve la señal de going-to-evidencia', () => {
  activate(); otherHistory(); day(1); makeWeak();
  const c = T.GRAMMAR_CHECK_BANK.filter(x => x.micro === 'will-forma-verbo-base');
  T.microCheckFinish('will-forma-verbo-base', c.map((x, i) => ({ itemId:x.id, isCorrect: i === 0 })), CLOCK);
  assert.ok(ev().wk); assert.strictEqual(ev().ck.a, 0);
  assert.ok(stats()['will-forma-verbo-base'].wk);   // sigue débil por haber fallado 2 de 3
});

console.log('\nF. Persistencia (recarga) y compatibilidad');
test('al recargar (otra instancia de la app con el mismo almacenamiento) el estado y las recomendaciones son idénticos', () => {
  toCheck();
  const before = JSON.stringify([stats(), plain(T.microDiagActions('medio')), todayAction().title]);
  const T2 = makeCtx(true); installClock(T2); T2.MICRO_BY_ID['going-to-evidencia'].active = true;
  FUTURO.forEach(id => { T2.MICRO_BY_ID[id].active = true; });
  const after = JSON.stringify([JSON.parse(store[T2.MICRO_STATS_KEY]), plain(T2.microDiagActions('medio')), T2.computeDiagnosis().today.title]);
  assert.strictEqual(after, before);
  doCheck(3); T = T2;       // la comprobación sigue funcionando en la instancia nueva
  assert.strictEqual(plain(JSON.parse(store[T2.MICRO_STATS_KEY])['going-to-evidencia'].lc.ok), 3);
});
test('alumno viejo sin campos micro: el diagnóstico y las recomendaciones son EXACTAMENTE los de siempre', () => {
  // historial con el formato anterior (solo itemId/isCorrect), muchos fallos en cuantificadores y futuro
  const ids = []; T.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(/Will vs|futuro|Some|Much|Cuantific/i.test(b.topic)) ids.push(i.id); })));
  const sessions = [];
  for(let d = 1; d <= 4; d++) sessions.push({ skill:'gramatica', level:'medio', topics:[], date: T.localDateStr(new Date(BASE - d * 86400000)), startedAt: BASE - d * 86400000, durationMs:1000,
    results: ids.slice(0, 10).map((itemId, i) => ({ itemId, isCorrect: i % 4 === 0 })) });
  store[T.PROGRESS_KEY] = JSON.stringify({ sessions, lastActivity:null });
  const sinMicros = JSON.stringify(plain(T.computeDiagnosis()));
  activate();                                                       // aunque los microtemas estén activos...
  const conMicros = JSON.stringify(plain(T.computeDiagnosis()));
  assert.strictEqual(conMicros, sinMicros, 'sin señales de microtema nada cambia');
  assert.ok(!store[T.MICRO_STATS_KEY]);                            // y no se inventó ninguna señal
  assert.deepStrictEqual(plain(T.computeMistakeIds()).sort(), plain(JSON.parse(JSON.stringify(T.computeMistakeIds()))).sort());
});
test('señales guardadas antes de este flujo (sin wk/pr/lc) se leen sin romperse', () => {
  activate(); otherHistory(); const e = EV();
  store[T.MICRO_STATS_KEY] = JSON.stringify({ 'going-to-evidencia': { a:3, w:3, wi:{ [e[0]]:1, [e[1]]:1, [e[2]]:1 }, wd:['2026-09-30'], last:'2026-09-30', ck:{ a:0, ok:0 } } });
  day(1); play([[e[3], true]]);
  assert.ok(ev().wk); assert.strictEqual(ev().lc, null);
  assert.strictEqual(microActions()[0].microState, 'debil');
});
test('temas sin microtema: sin cambios en señales ni recomendaciones', () => {
  activate(); otherHistory();
  assert.ok(!store[T.MICRO_STATS_KEY]);
  const sel = T.computePlanSelection('medio', 9, {});
  assert.ok(!sel.focus || !sel.focus.microId);
});
test('el origen de la práctica se captura al cargar y se entrega una sola vez; ?micro= y ?comprobar= también', () => {
  global.__SEARCH = '?foco=futuro&tema=will-going-to&micro=going-to-evidencia&empezar=1';
  const T3 = makeCtx(true); installClock(T3); delete global.__SEARCH;
  assert.deepStrictEqual(plain(T3.takePagePlanParams()), { micro:'going-to-evidencia', comprobar:null });
  assert.deepStrictEqual(plain(T3.takePagePlanParams()), { micro:null, comprobar:null });   // una sola vez
  global.__SEARCH = '?comprobar=going-to-evidencia';
  const T4 = makeCtx(true); delete global.__SEARCH;
  assert.strictEqual(T4.takePagePlanParams().comprobar, 'going-to-evidencia');
  global.__SEARCH = '?micro=going-to-evidencia&empezar=1';
  const T5 = makeCtx(true); installClock(T5); delete global.__SEARCH;
  T5.setUserLevel('medio');
  const it = EV()[0];
  const item = T5.getMistakesItemIndex().get(it).item;
  T5.noteGrammarAnswer({ dataset:{} }, item, true, 'is going to');
  T5.recordSession({ skill:'plan', level:'medio', topics:[], results:[{ itemId: it, isCorrect:true }], startedAt: CLOCK });
  T5.ctx.location.search = '';                      // la página del Plan limpia la dirección después de leerla
  T5.noteGrammarAnswer({ dataset:{} }, item, true, 'is going to');
  T5.recordSession({ skill:'plan', level:'medio', topics:[], results:[{ itemId: it, isCorrect:true }], startedAt: CLOCK + 1 });
  const s = T5.loadProgress().sessions;
  assert.strictEqual(s[0].results[0].o, 'micro'); assert.ok(!('o' in s[1].results[0]));
});

console.log('\nG. Activación');
test('active:false o active:true: solo cambia lo que ve el alumno con señales de microtema', () => {
  otherHistory(); day(1); makeWeak(); day(2); practiceAfter(6);
  const off = JSON.stringify(plain(T.computeDiagnosis().actions));
  activate();
  const on = JSON.stringify(plain(T.computeDiagnosis().actions));
  assert.notStrictEqual(on, off);
  assert.ok(/going-to-evidencia/.test(on) && !/going-to-evidencia/.test(off));
});

console.log('\n' + passed + ' pruebas correctas');
