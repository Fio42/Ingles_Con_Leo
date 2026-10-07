#!/usr/bin/env node
/* Piloto Condicionales 1 y 2 (cond-1-probable y cond-2-imaginario): segundo piloto adaptativo, ACTIVO.
   Corre con:  node tools/tests/condicionales-piloto.test.js   (desde la carpeta inglesconLeo)

   Comprueba que el contenido cumple las reglas de un microtema activo, que la comprobación está aislada de la
   práctica, que los IDs históricos y los temas no migrados siguen igual, que las sesiones conservan su tamaño y
   que la comprobación no se sirve antes de tiempo. Usa app.js, data.js y temas.js REALES. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const lib = require('../micros-lib');
const root = path.join(__dirname, '..', '..');

const store = {};
const noop = () => {};
const el = () => { let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
  set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
function makeCtx(){
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
  vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { resolveMemberPool, memberBankItems, SESSION_LENGTHS, SESSION_LENGTH_KEY, PROGRESS_KEY, MEMBERS_ONLY_VARIANT_INDEX, diagFamilyForTopic,
  computePlanSelection, buildPlanPool, getMistakesItemIndex, recordSession, loadProgress, microCheckStart, microFlowState, microStatsAll, microIsActive,
  MICRO_STATS_KEY, CHECK_SEEN_KEY, G:GRAMMAR_BANK, CHECK:GRAMMAR_CHECK_BANK, TEMA_BY_ID, MICRO_BY_ID };`, ctx);
  ctx.__t.ctx = ctx;
  return ctx.__t;
}
const T = makeCtx();
let seed = Number(process.env.COND_SEED || 20261006);
T.ctx.__rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
vm.runInContext('Math.random = function(){ return __rng(); };', T.ctx);
const real = lib.loadSite(root);
const plain = o => JSON.parse(JSON.stringify(o));
let passed = 0;
function test(name, fn){
  try{ Object.keys(store).forEach(k => delete store[k]); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; }
}
const MICROS = ['cond-1-probable', 'cond-2-imaginario'];
const NEW_PRACTICE = /^g-medio-cond[12]-[1-5]$/;
const NEW_CHECK = /^g-chk-cond[12]-[1-3]$/;
const ARTICLE = 'articulo-condicionales-1-y-2.html';
const practiceAt = (micro, level) => real.practice.filter(r => r.item.micro === micro && r.level === level);

console.log('Contenido del piloto');
test('los dos microtemas están activos; cond-3, cond-mixto y Cuantificadores siguen sin activar', () => {
  MICROS.forEach(id => assert.strictEqual(real.microById[id].active, true, id));
  ['cond-3-pasado-irreal', 'cond-mixto', 'much-many-contable-incontable', 'a-lot-of', 'some-any-afirm-neg', 'some-any-pregunta-oferta', 'little-few-matiz', 'fewer-less']
    .forEach(id => assert.ok(!real.microById[id].active, id + ' no debe estar activo'));
  MICROS.forEach(id => assert.strictEqual(T.microIsActive(id), true));
});

test('cada microtema tiene 6 de práctica en nivel Medio, >=2 tipos, 3 de comprobación y un recurso con su ancla', () => {
  const stats = lib.microStats(real);
  MICROS.forEach(id => {
    assert.strictEqual(practiceAt(id, 'medio').length, 6, id + ': práctica en medio');
    assert.ok(new Set(practiceAt(id, 'medio').map(r => r.item.type)).size >= 2, id + ': tipos distintos');
    assert.strictEqual(stats[id].check.length, 3, id + ': comprobación');
    const res = lib.resourcesOf(real, id);
    assert.ok(res.lesson && res.lesson.article === ARTICLE && res.lesson.anchor === id, id + ': recurso');
  });
});

test('en total: 8 de práctica nuevos y 6 de comprobación; los 4 ejercicios que ya existían no se tocaron', () => {
  assert.strictEqual(real.practice.filter(r => NEW_PRACTICE.test(r.item.id)).length, 8);
  assert.strictEqual(real.check.filter(c => NEW_CHECK.test(c.id)).length, 6);
  assert.strictEqual(real.check.filter(c => MICROS.indexOf(c.micro) !== -1).length, 6);
  const originales = { 'g-medio-cond12-1':'cond-1-probable', 'g-medio-cond12-2':'cond-2-imaginario', 'g-medio-cond12-3':'cond-2-imaginario', 'g-medio-cond12-4':'cond-2-imaginario', 'g-facil-m400-1':'cond-1-probable' };
  Object.keys(originales).forEach(id => { const r = real.practice.find(x => x.item.id === id); assert.ok(r, id + ' sigue existiendo'); assert.strictEqual(r.item.micro, originales[id]); });
});

test('las reglas de microtemas activos pasan completas (comprobación distinta a la práctica, ids bloqueados)', () => {
  assert.deepStrictEqual(lib.validate(real), []);
});

test('IDs estables: ninguno de los ids históricos de Condicionales desapareció ni cambió de microtema', () => {
  const frozen = { 'g-avz-c3-1':'cond-3-pasado-irreal', 'g-avz-c3-2':'cond-3-pasado-irreal', 'g-avz-c3-3':'cond-3-pasado-irreal',
    'g-avz4-mix-1':'cond-mixto', 'g-avz4-mix-2':'cond-mixto', 'g-avz4-mix-3':'cond-mixto', 'g-avz4-mix-4':'cond-mixto' };
  Object.keys(frozen).forEach(id => { const r = real.practice.find(x => x.item.id === id); assert.ok(r, id); assert.strictEqual(r.item.micro, frozen[id], id); });
  const ids = real.practice.map(r => r.item.id).concat(real.check.map(c => c.id));
  assert.strictEqual(new Set(ids).size, ids.length, 'ids únicos en todo el sitio');
  MICROS.concat(['cond-3-pasado-irreal', 'cond-mixto']).forEach(id => assert.ok(real.lock.ids.indexOf(id) !== -1, id + ' está en el candado'));
});

test('los temas no migrados no cambian: Wish sigue sin micro y los bloques nuevos pertenecen al tema Condicionales (familia condicionales)', () => {
  real.practice.filter(r => /Wish/.test(r.topic)).forEach(r => assert.ok(!r.item.micro, r.item.id + ' no debe tener micro'));
  const t = real.temaById.condicionales;
  ['Condicional 1: algo probable', 'Condicional 2: algo imaginario'].forEach(topic => {
    assert.ok(plain(t.topics).indexOf(topic) !== -1, topic + ' está en temas.js');
    assert.strictEqual(T.diagFamilyForTopic(topic).id, 'condicionales', topic);
    assert.strictEqual(real.temaByTopic[topic].id, 'condicionales');
  });
  assert.strictEqual(t.family, 'condicionales');
  assert.deepStrictEqual(plain(real.temaById.wish.prereq), ['condicionales']);
});

test('la clase existe, tiene una sección por microtema y no contiene la comprobación', () => {
  const html = fs.readFileSync(path.join(root, ARTICLE), 'utf8');
  MICROS.forEach(id => assert.ok(html.indexOf('id="' + id + '"') !== -1, 'falta la sección ' + id));
  const plainText = html.replace(/<[^>]+>/g, ' ').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ');
  T.CHECK.forEach(c => assert.ok(plainText.indexOf(lib.textOf(c)) === -1, c.id + ' aparece en la clase pública'));
  const right = s => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  T.CHECK.filter(c => c.right).forEach(c => assert.ok(plainText.indexOf(right(c.right)) === -1, c.id + ': su respuesta está en la clase'));
  assert.ok(!/—/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'la clase no usa rayas largas');
  assert.ok(/<link rel="canonical" href="https:\/\/inglesconleo\.com\/articulo-condicionales-1-y-2\.html">/.test(html));
});

console.log('\nDuración de sesión y usuarios gratis');
function runCycle(len){
  store[T.SESSION_LENGTH_KEY] = len;
  const sessions = [], progress = { sessions: [], lastActivity: null };
  const total = T.memberBankItems('gramatica', T.G.medio).length;
  let seen = 0, guard = 0;
  while(seen < total && guard++ < 300){
    store[T.PROGRESS_KEY] = JSON.stringify(progress);
    const r = T.resolveMemberPool({ skill:'gramatica', level:'medio', bankLevel:T.G.medio, saved:null });
    const ids = r.pool.map(i => i.id);
    progress.sessions.push({ skill:'gramatica', level:'medio', topics:[], date:'2026-10-06', startedAt: guard, durationMs:1, results: ids.map(id => ({ itemId:id, isCorrect:true })) });
    sessions.push(ids); seen += ids.length;
  }
  return { sessions, total };
}
['corta', 'media', 'larga'].forEach(len => {
  test('sesión ' + len + ': conserva su tamaño, sin repetidos, y un bloque nuevo no la llena', () => {
    const want = T.SESSION_LENGTHS[len].items;
    const { sessions } = runCycle(len);
    sessions.slice(0, -1).forEach((s, i) => assert.strictEqual(s.length, want, 'la sesión ' + (i + 1) + ' tiene ' + s.length));
    const flat = [].concat(...sessions.slice(0, -1));
    assert.strictEqual(new Set(flat).size, flat.length, 'se repitió un ejercicio dentro del ciclo');
    sessions.forEach(s => assert.ok(s.filter(id => NEW_PRACTICE.test(id)).length <= 5, 'más de 5 ejercicios nuevos de Condicionales en una sesión'));
  });
});

test('el Plan de estudio con foco en el microtema respeta la duración y trae ejercicios de ese microtema', () => {
  MICROS.forEach(m => ['corta', 'media', 'larga'].forEach(len => {
    const want = T.SESSION_LENGTHS[len].items;
    store[T.SESSION_LENGTH_KEY] = len;
    const sel = T.computePlanSelection('medio', want, { focusMicro: m });
    const pool = T.buildPlanPool('medio', sel);
    assert.strictEqual(pool.length, want, m + '/' + len + ': el Plan armó ' + pool.length);
    assert.ok(pool.some(e => e.item && e.item.micro === m), m + '/' + len + ': ningún ejercicio del microtema');
  }));
});

test('usuarios gratis: ningún ejercicio nuevo cae en una variante que ellos puedan recibir', () => {
  const memberOnly = new Set(T.MEMBERS_ONLY_VARIANT_INDEX.gramatica.medio);
  T.G.medio.forEach((variant, vi) => variant.forEach(block => block.items.forEach(item => {
    if(NEW_PRACTICE.test(item.id)) assert.ok(memberOnly.has(vi), item.id + ' está en la variante ' + vi + ', que no es solo de miembros');
  })));
});

console.log('\nLa comprobación está aislada y no se sirve antes de tiempo');
test('ningún ejercicio de comprobación está en los bancos de práctica ni en el índice de errores', () => {
  const index = T.getMistakesItemIndex();
  const mine = T.CHECK.filter(c => MICROS.indexOf(c.micro) !== -1);
  assert.strictEqual(mine.length, 6);
  Object.keys(T.G).forEach(l => T.memberBankItems('gramatica', T.G[l]).forEach(i => assert.ok(!mine.some(c => c.id === i.id), i.id + ' en práctica')));
  mine.forEach(c => assert.strictEqual(index.has(c.id), false, c.id + ' entró al índice de errores'));
});

const fail = (id, t) => T.recordSession({ skill:'gramatica', level:'medio', topics:[], startedAt: t, results:[{ itemId:id, isCorrect:false }] });
const okAns = (ids, t) => T.recordSession({ skill:'gramatica', level:'medio', topics:[], startedAt: t, results: ids.map(id => ({ itemId:id, isCorrect:true })) });
const flow = m => T.microFlowState(m, T.microStatsAll()[m]).state;

MICROS.forEach(m => {
  test(m + ': sin debilidad o con poca práctica NO ofrece comprobación; con debilidad y refuerzo sí, solo con ejercicios inéditos', () => {
    const ids = practiceAt(m, 'medio').map(r => r.item.id), checks = T.CHECK.filter(c => c.micro === m).map(c => c.id);
    assert.strictEqual(T.microCheckStart(m).items, null, 'sin historial');
    assert.strictEqual(T.microCheckStart(m).reason, 'no-toca');
    let t = 1000;
    fail(ids[0], t++); fail(ids[1], t++);                                   // 2 fallos distintos: todavía no es debilidad
    assert.strictEqual(flow(m), 'sin-alerta');
    assert.strictEqual(T.microCheckStart(m).reason, 'no-toca');
    fail(ids[2], t++);                                                      // 3er ejercicio distinto: debilidad
    assert.strictEqual(flow(m), 'debil');
    assert.strictEqual(T.microCheckStart(m).reason, 'no-toca', 'con debilidad pero sin refuerzo aún no toca comprobar');
    okAns(ids.slice(0, 4), t++); assert.strictEqual(flow(m), 'debil');      // 4 respuestas de refuerzo: faltan
    okAns(ids.slice(4, 6), t++);                                            // 6 en total >= 5
    assert.strictEqual(flow(m), 'listo-comprobar');
    const st = T.microCheckStart(m);
    assert.ok(st.items && st.items.length === 3, 'ofrece 3 ejercicios');
    st.items.forEach(it => assert.ok(checks.indexOf(it.id) !== -1, it.id + ' es de comprobación'));
    assert.strictEqual(new Set(st.items.map(i => i.id)).size, 3);
    T.recordSession({ skill:'check', level:'medio', topics:[], startedAt: t++, results: st.items.map(i => ({ itemId:i.id, isCorrect:true })) });
    assert.strictEqual(flow(m), 'recuperado');
    const again = T.microCheckStart(m);
    assert.strictEqual(again.items, null, 'ya los vio: no se repiten');
    assert.ok(['no-toca', 'sin-ineditos'].indexOf(again.reason) !== -1, again.reason);
    const seen = JSON.parse(store[T.CHECK_SEEN_KEY]);
    checks.forEach(id => assert.strictEqual(seen[id], 1, id + ' quedó como visto'));
  });
});

test('un microtema no activado (cond-3) no recomienda ni comprueba nada aunque haya errores', () => {
  const ids = T.G.avanzado.reduce((a, v) => a.concat(v.reduce((b, blk) => b.concat(blk.items.filter(i => i.micro === 'cond-3-pasado-irreal').map(i => i.id)), [])), []);
  assert.strictEqual(ids.length, 3);
  ids.forEach((id, i) => T.recordSession({ skill:'gramatica', level:'avanzado', topics:[], startedAt: 10 + i, results:[{ itemId:id, isCorrect:false }] }));
  assert.strictEqual(T.microCheckStart('cond-3-pasado-irreal').items, null);
});

console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : ''));
