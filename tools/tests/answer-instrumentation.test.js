#!/usr/bin/env node
/* Registro de la confusión (instrumentación aditiva de las respuestas de gramática).
   Corre con:  node tools/tests/answer-instrumentation.test.js   (desde la carpeta inglesconLeo)
   Usa el app.js y data.js REALES en un navegador simulado. No toca la red.

   Lo más importante: el progreso que ya tienen los alumnos NO cambia. Los campos de
   siempre (itemId, isCorrect) salen idénticos y los campos nuevos son opcionales. */
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
    location:{ hash:'', search:'', pathname:'/' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  if(withTemas) vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { recordSession, loadProgress, noteGrammarAnswer, markGrammarRetry, practiceOrigin, ANSWER_LOG, PROGRESS_KEY,
  computeMistakeIds, progressSessionIdentity, getMistakesItemIndex, resetIndex(){ _mistakesItemIndexCache = undefined; _checkIndex = null; },
  pickCheckItems, markChecksConsumed, checkSeenSet, isCheckItem, updateMicroStats, microWeakness, MICRO_STATS_KEY, CHECK_SEEN_KEY, GRAMMAR_CHECK_BANK };`, ctx);
  ctx.__t.ctx = ctx;
  return ctx.__t;
}

const T = makeCtx();
const ctx = T.ctx;
let passed = 0;
function test(name, fn){
  try{ Object.keys(store).forEach(k => delete store[k]); ctx.location.search = ''; T.ANSWER_LOG.clear(); T.resetIndex(); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
}
const plain = o => JSON.parse(JSON.stringify(o));
const card = () => ({ dataset: {} });
// A y B no tienen microtema (This / That); C sí (going-to-plan-decidido).
const A = 'g-facil-this-1', B = 'g-facil-this-2', C = 'g-medio5-fut-1';
const itemOf = id => T.getMistakesItemIndex().get(id).item;
const last = () => { const p = T.loadProgress(); return p.sessions[p.sessions.length - 1]; };
const rec = (results, extra) => T.recordSession(Object.assign({ skill:'gramatica', level:'facil', topics:[], results, startedAt:1 }, extra || null));

test('los campos de siempre salen idénticos y el progreso anterior sigue leyéndose igual', () => {
  // un alumno con historial guardado con el formato de antes (sin campos nuevos)
  store[T.PROGRESS_KEY] = JSON.stringify({ sessions: [{ skill:'gramatica', level:'facil', topics:['Some / Any'], date:'2026-10-01', startedAt:1, durationMs:5,
    results:[{ itemId:A, isCorrect:false }, { itemId:B, isCorrect:true }] }], lastActivity:null });
  assert.deepStrictEqual(plain(T.computeMistakeIds()), [A]);
  const before = JSON.stringify(T.loadProgress().sessions[0]);
  rec([{ itemId:C, isCorrect:true }], { startedAt:2 });
  const p = T.loadProgress();
  assert.strictEqual(JSON.stringify(p.sessions[0]), before, 'la sesión vieja no se toca');
  assert.deepStrictEqual(plain(p.sessions[1].results), [{ itemId:C, isCorrect:true, m:'going-to-plan-decidido' }]);   // solo se agrega el microtema del ejercicio
  assert.deepStrictEqual(plain(T.computeMistakeIds()), [A]);
});

test('respuesta nueva: guarda la opción elegida y que fue la primera vez', () => {
  T.noteGrammarAnswer(card(), itemOf(A), false, 'some');
  rec([{ itemId:A, isCorrect:false }]);
  assert.deepStrictEqual(plain(last().results[0]), { itemId:A, isCorrect:false, p:'some', f:1 });
  T.noteGrammarAnswer(card(), itemOf(A), true, 'any');       // otro día
  rec([{ itemId:A, isCorrect:true }], { startedAt:2 });
  assert.deepStrictEqual(plain(last().results[0]), { itemId:A, isCorrect:true, p:'any' });   // ya no es primera vez
});

test('reintento: se conserva la PRIMERA confusión aunque el resultado final sea correcto', () => {
  const c = card();
  T.noteGrammarAnswer(c, itemOf(A), false, 'some');          // falla
  T.markGrammarRetry(c);                                      // "Volver a intentar"
  T.noteGrammarAnswer(card(), itemOf(A), true, 'any');       // acierta
  rec([{ itemId:A, isCorrect:true }]);
  assert.deepStrictEqual(plain(last().results[0]), { itemId:A, isCorrect:true, p:'any', t:2, w:'some', f:1 });
});

test('dos reintentos seguidos: w sigue siendo la primera opción equivocada', () => {
  const c = card();
  T.noteGrammarAnswer(c, itemOf(A), false, 'some'); T.markGrammarRetry(c);
  T.noteGrammarAnswer(c, itemOf(A), false, 'much'); T.markGrammarRetry(c);
  T.noteGrammarAnswer(card(), itemOf(A), true, 'any');
  rec([{ itemId:A, isCorrect:true }]);
  const r = last().results[0];
  assert.strictEqual(r.t, 3); assert.strictEqual(r.w, 'some'); assert.strictEqual(r.p, 'any');
});

test('"siguiente" sin reintentar no cuenta como reintento cuando el ejercicio vuelve a salir', () => {
  T.noteGrammarAnswer(card(), itemOf(A), false, 'some');     // falla y sigue (sin pulsar reintentar)
  rec([{ itemId:A, isCorrect:false }]);
  T.noteGrammarAnswer(card(), itemOf(A), true, 'any');       // otro día vuelve a salir
  rec([{ itemId:A, isCorrect:true }], { startedAt:2 });
  const r = last().results[0];
  assert.ok(!('t' in r) && !('w' in r), JSON.stringify(r));
});

test('lo que no es gramática calificada no se toca y no se muta lo recibido', () => {
  T.noteGrammarAnswer(card(), itemOf(B), true, 'some');
  const input = [{ itemId:'s-medio-m100-1', isCorrect:null }, { itemId:'v-medio4-1', isCorrect:true }, { itemId:B, isCorrect:true }];
  rec(input, { skill:'plan', level:'medio' });
  const out = plain(last().results);
  assert.deepStrictEqual(out[0], { itemId:'s-medio-m100-1', isCorrect:null });
  assert.deepStrictEqual(out[1], { itemId:'v-medio4-1', isCorrect:true });
  assert.strictEqual(out[2].p, 'some');
  assert.deepStrictEqual(plain(input[2]), { itemId:B, isCorrect:true }, 'no muta lo que recibe');
});

test('si el registro no coincide con el resultado (p. ej. sesión retomada tras recargar) no se inventa nada', () => {
  T.noteGrammarAnswer(card(), itemOf(A), true, 'any');
  rec([{ itemId:A, isCorrect:false }]);
  assert.deepStrictEqual(plain(last().results[0]), { itemId:A, isCorrect:false });
});

test('microId: sale del ejercicio aunque la sesión se haya retomado (sin registro de la respuesta)', () => {
  rec([{ itemId:C, isCorrect:true }], { level:'medio' });
  assert.deepStrictEqual(plain(last().results[0]), { itemId:C, isCorrect:true, m:'going-to-plan-decidido' });
});

test('microId: se guarda solo cuando el ejercicio lo declara', () => {
  const it = itemOf(A);                       // sin micro
  T.noteGrammarAnswer(card(), it, false, 'x');
  rec([{ itemId:A, isCorrect:false }]);
  assert.ok(!('m' in last().results[0]));
  it.micro = 'will-decision-espontanea';      // ahora lo declara
  T.noteGrammarAnswer(card(), it, false, 'x');
  rec([{ itemId:A, isCorrect:false }], { startedAt:2 });
  assert.strictEqual(last().results[0].m, 'will-decision-espontanea');
  delete it.micro;
});

test('origen de la práctica', () => {
  const q = s => { ctx.location.search = s; return T.practiceOrigin(); };
  assert.strictEqual(q(''), null);
  assert.strictEqual(q('?empezar=1'), 'hoy');
  assert.strictEqual(q('?foco=futuro&empezar=1'), 'foco');
  assert.strictEqual(q('?foco=futuro&tema=will-going-to&empezar=1'), 'tema');
  assert.strictEqual(q('?tema=will-going-to&via=rec'), 'rec');
  ctx.location.search = '?foco=futuro&tema=will-going-to';
  T.noteGrammarAnswer(card(), itemOf(C), false, 'will');
  rec([{ itemId:C, isCorrect:false }], { skill:'plan', level:'medio' });
  assert.strictEqual(last().results[0].o, 'tema');
});

test('privado y barato: solo campos permitidos, la opción se recorta y pesa poco', () => {
  T.noteGrammarAnswer(card(), itemOf(A), false, 'x'.repeat(500));
  rec([{ itemId:A, isCorrect:false }]);
  const r = last().results[0];
  assert.ok(r.p.length <= 40);
  const allowed = new Set(['itemId', 'isCorrect', 'm', 'p', 't', 'w', 'f', 'o']);
  Object.keys(r).forEach(k => assert.ok(allowed.has(k), 'campo no permitido: ' + k));
  assert.ok(JSON.stringify(r).length < 140);
});

test('entradas raras no rompen el guardado de la sesión', () => {
  assert.doesNotThrow(() => T.noteGrammarAnswer(null, null, true, undefined));
  assert.doesNotThrow(() => T.noteGrammarAnswer({}, { id:'zzz' }, true, null));
  assert.doesNotThrow(() => T.markGrammarRetry(null));
  rec([]);
  rec(null, { startedAt:2 });
  assert.strictEqual(T.loadProgress().sessions.length, 2);
});

test('la identidad de la sesión (para no duplicar local/nube) es estable', () => {
  T.noteGrammarAnswer(card(), itemOf(A), true, 'any');
  rec([{ itemId:A, isCorrect:true }], { startedAt:5 });
  const s = last();
  assert.strictEqual(T.progressSessionIdentity(s), T.progressSessionIdentity(JSON.parse(JSON.stringify(s))));
});

/* ---------- microtemas: señales agregadas y comprobación ---------- */
const MICRO = 'going-to-plan-decidido';
const stats = () => JSON.parse(store[T.MICRO_STATS_KEY] || '{}');
const failOn = (id, startedAt, date) => {
  T.noteGrammarAnswer(card(), itemOf(id), false, 'x');
  T.recordSession({ skill:'gramatica', level:'medio', topics:[], results:[{ itemId:id, isCorrect:false }], startedAt });
};
function withCheckItems(ids, micro, fn){
  const added = ids.map(id => ({ id, micro, type:'choice', prompt:'Check ' + id, options:['a','b'], correct:0, explain:'e', examples:[{ en:'x', es:'y' }] }));
  added.forEach(x => T.GRAMMAR_CHECK_BANK.push(x));
  T.resetIndex();
  try{ fn(added); } finally { T.GRAMMAR_CHECK_BANK.length = 0; T.resetIndex(); }
}

test('señales por microtema: se agregan al guardar la sesión (sin recorrer el historial)', () => {
  failOn('g-medio5-fut-1', 1);
  const s = stats()[MICRO];
  assert.strictEqual(s.a, 1); assert.strictEqual(s.w, 1);
  assert.deepStrictEqual(Object.keys(s.wi), ['g-medio5-fut-1']);
  assert.ok(JSON.stringify(stats()).length < 400);
});

test('reintento exitoso cuenta como fallo del primer intento', () => {
  const c = card();
  T.noteGrammarAnswer(c, itemOf(C), false, 'will'); T.markGrammarRetry(c);
  T.noteGrammarAnswer(card(), itemOf(C), true, 'going to');
  rec([{ itemId:C, isCorrect:true }], { level:'medio' });
  assert.strictEqual(stats()[MICRO].w, 1);
});

test('debilidad: repetir el MISMO ejercicio no es debilidad del microtema', () => {
  failOn(C, 1); failOn(C, 2); failOn(C, 3);
  const w = T.microWeakness(stats()[MICRO]);
  assert.deepStrictEqual(plain(w), { weak:false, reason:'mismo-ejercicio' });
});

test('debilidad: errores en ejercicios distintos sí cuentan (>=3, o >=2 en días distintos)', () => {
  failOn('g-medio5-fut-1', 1); failOn('g-medio5-fut-2', 2);
  assert.strictEqual(T.microWeakness(stats()['going-to-plan-decidido']).weak, false);   // fut-2 es de OTRO microtema
  assert.strictEqual(T.microWeakness({ wi:{ a:1, b:1 }, wd:['2026-10-01'] }).weak, false);            // 2 ejercicios, 1 solo día
  assert.strictEqual(T.microWeakness({ wi:{ a:1, b:1 }, wd:['2026-10-01', '2026-10-02'] }).weak, true); // 2 ejercicios, 2 días
  assert.strictEqual(T.microWeakness({ wi:{ a:1, b:1, c:1 }, wd:['2026-10-01'] }).weak, true);         // 3 ejercicios
  assert.deepStrictEqual(plain(T.microWeakness(null)), { weak:false, reason:null });
});

test('sin microtema no se guarda nada (el costo es cero para lo que aún no migró)', () => {
  failOn(A, 1);
  assert.ok(!store[T.MICRO_STATS_KEY]);
});

test('el registro por microtema tiene tope aunque pasen muchos ejercicios', () => {
  const results = [];
  for(let i = 0; i < 60; i++) results.push({ itemId:'g-x-' + i, isCorrect:false, m:'micro-x' });
  T.updateMicroStats(results, '2026-10-01');
  assert.ok(Object.keys(stats()['micro-x'].wi).length <= 24);
});

test('comprobación: solo entrega ejercicios nuevos y avisa (null) cuando no alcanzan', () => {
  withCheckItems(['gc-1', 'gc-2', 'gc-3', 'gc-4'], MICRO, () => {
    const first = T.pickCheckItems(MICRO, 3);
    assert.strictEqual(first.length, 3);
    assert.strictEqual(T.pickCheckItems(MICRO, 5), null);
    // responde dos como comprobación
    first.slice(0, 2).forEach(it => T.noteGrammarAnswer(card(), it, true, 'a'));
    T.recordSession({ skill:'check', level:'medio', topics:[], results: first.slice(0, 2).map(it => ({ itemId:it.id, isCorrect:true })), startedAt:1 });
    const rest = T.pickCheckItems(MICRO, 2);
    assert.strictEqual(rest.length, 2);
    const used = new Set(first.slice(0, 2).map(it => it.id));
    rest.forEach(it => assert.ok(!used.has(it.id), 'repitió un ejercicio ya usado'));
    assert.strictEqual(T.pickCheckItems(MICRO, 3), null);
  });
});

test('comprobación: un ejercicio que ya es de práctica jamás se sirve como comprobación', () => {
  withCheckItems(['g-medio5-fut-1', 'gc-9'], MICRO, () => {
    assert.strictEqual(T.isCheckItem('g-medio5-fut-1'), false);
    assert.strictEqual(T.isCheckItem('gc-9'), true);
    assert.strictEqual(T.pickCheckItems(MICRO, 2), null);   // solo 1 válido
  });
});

test('comprobación: no entra a "Mis errores", ni a mistake_stats, ni a las señales de práctica', () => {
  withCheckItems(['gc-1', 'gc-2'], MICRO, () => {
    T.noteGrammarAnswer(card(), T.pickCheckItems(MICRO, 2)[0], false, 'b');
    T.recordSession({ skill:'check', level:'medio', topics:[], results:[{ itemId:'gc-1', isCorrect:false }, { itemId:'gc-2', isCorrect:false }], startedAt:1 });
    assert.deepStrictEqual(plain(T.computeMistakeIds()), []);                    // no es un error del alumno
    assert.strictEqual(T.getMistakesItemIndex().has('gc-1'), false);              // no se indexa: mistake_stats lo ignora
    const s = stats()[MICRO];
    assert.strictEqual(s.a, 0); assert.strictEqual(s.w, 0);                       // práctica intacta
    assert.deepStrictEqual(plain(s.ck), { a:2, ok:0 });                           // la comprobación se lleva aparte
  });
});

test('comprobación: si se cambia de dispositivo, lo ya visto se reconstruye solo de las sesiones de comprobación', () => {
  withCheckItems(['gc-1', 'gc-2', 'gc-3'], MICRO, () => {
    store[T.PROGRESS_KEY] = JSON.stringify({ sessions:[
      { skill:'gramatica', level:'medio', topics:[], date:'2026-10-01', startedAt:1, durationMs:1, results:[{ itemId:'gc-3', isCorrect:true }] },   // práctica: no cuenta
      { skill:'check', level:'medio', topics:[], date:'2026-10-02', startedAt:2, durationMs:1, results:[{ itemId:'gc-1', isCorrect:true }] }
    ], lastActivity:null });
    delete store[T.CHECK_SEEN_KEY];
    const got = T.pickCheckItems(MICRO, 2).map(it => it.id).sort();
    assert.deepStrictEqual(plain(got), ['gc-2', 'gc-3']);
  });
});

console.log('\n' + passed + ' pruebas correctas');
