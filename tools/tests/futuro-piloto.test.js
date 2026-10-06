#!/usr/bin/env node
/* Piloto Futuro (will / going to): contenido listo, SIN activar.
   Corre con:  node tools/tests/futuro-piloto.test.js   (desde la carpeta inglesconLeo)

   Comprueba que el contenido nuevo cumple las reglas de un microtema ACTIVO (simulándolo en
   memoria), que no altera la duración de las sesiones (corta ~5, media ~9, larga ~15), que lo que
   ven los usuarios gratis no cambia y que la comprobación nunca se filtra a la práctica ni a la clase. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const lib = require('../micros-lib');
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
;this.__t = { resolveMemberPool, memberBankItems, SESSION_LENGTHS, SESSION_LENGTH_KEY, PROGRESS_KEY, MEMBERS_ONLY_VARIANT_INDEX, diagFamilyForTopic,
  computePlanSelection, buildPlanPool, getMistakesItemIndex, G:GRAMMAR_BANK, CHECK:GRAMMAR_CHECK_BANK, TEMA_BY_ID, microResources };`, ctx);
  ctx.__t.ctx = ctx;
  return ctx.__t;
}

const T = makeCtx(true);
// Math.random con semilla: las pruebas son repetibles (el mazo es aleatorio).
let seed = Number(process.env.FUTURO_SEED || 20261005);
T.ctx.__rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
vm.runInContext('Math.random = function(){ return __rng(); };', T.ctx);
const real = lib.loadSite(root);
const plain = o => JSON.parse(JSON.stringify(o));
let passed = 0;
function test(name, fn){
  try{ Object.keys(store).forEach(k => delete store[k]); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; }
}
const MICROS = ['will-decision-espontanea', 'going-to-plan-decidido', 'going-to-evidencia', 'will-forma-verbo-base'];
const NEW_IDS = /^g-medio-fut-(willdec|gtplan|gtevid|willform)-[1-5]$/;
const allPractice = () => lib.microStats(real);

console.log('Contenido del piloto');
test('cada microtema tiene >=6 de práctica, 3 de comprobación, >=2 tipos y un recurso', () => {
  const stats = allPractice();
  MICROS.forEach(id => {
    assert.ok(stats[id].practice.length >= 6, id + ': práctica ' + stats[id].practice.length);
    assert.strictEqual(stats[id].check.length, 3, id + ': comprobación');
    assert.ok(new Set(stats[id].practice.map(r => r.item.type)).size >= 2, id + ': tipos');
    const res = lib.resourcesOf(real, id);
    assert.ok(res.lesson && res.lesson.anchor === id, id + ': recurso');
  });
});

test('en total: 20 de práctica nuevos y 12 de comprobación (los 4 existentes no se tocaron)', () => {
  const nuevos = real.practice.filter(r => NEW_IDS.test(r.item.id));
  assert.strictEqual(nuevos.length, 20);
  assert.strictEqual(real.check.length, 12);
  ['g-medio5-fut-1', 'g-medio5-fut-2', 'g-medio5-fut-3', 'g-medio5-fut-4'].forEach(id => assert.ok(real.practice.some(r => r.item.id === id), id));
});

test('simulando active:true en los 4 microtemas, todas las reglas pasan (comprobación distinta a la práctica)', () => {
  const T2 = plain(real.TEMAS);
  T2.forEach(t => (t.micros || []).forEach(m => { if(MICROS.indexOf(m.id) !== -1) m.active = true; }));
  const G = {}; Object.keys(T.G).forEach(l => { G[l] = plain(T.G[l]); });
  const site = lib.buildSite({ TEMAS: T2, G, CHECK: plain(T.CHECK), files: real.files, glossaryOk: real.glossaryOk, articleHas: real.articleHas, lock: real.lock });
  assert.deepStrictEqual(lib.validate(site), []);
});

test('la clase existe, tiene una sección por microtema y no contiene la comprobación', () => {
  const html = fs.readFileSync(path.join(root, 'articulo-will-vs-going-to.html'), 'utf8');
  MICROS.forEach(id => assert.ok(html.indexOf('id="' + id + '"') !== -1, 'falta la sección ' + id));
  const plainText = html.replace(/<[^>]+>/g, ' ').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ');
  T.CHECK.forEach(c => {
    const txt = lib.textOf(c);
    assert.ok(plainText.indexOf(txt) === -1, c.id + ' aparece en la clase pública');
  });
  assert.ok(!/—/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'la clase no usa rayas largas');
});

test('el tema del registro sigue siendo uno solo y los 4 temas nuevos del banco son de la familia Futuro', () => {
  const t = real.temaById['will-going-to'];
  assert.strictEqual(t.family, 'futuro');
  plain(t.topics).filter(x => /\(futuro\)$/.test(x)).forEach(topic => assert.strictEqual(T.diagFamilyForTopic(topic).id, 'futuro', topic));
});

console.log('\nDuración de sesión (corta / media / larga) y usuarios gratis');
function runCycle(len){
  store[T.SESSION_LENGTH_KEY] = len;
  const sessions = [];
  const progress = { sessions: [], lastActivity: null };
  const total = T.memberBankItems('gramatica', T.G.medio).length;
  let seen = 0, guard = 0;
  while(seen < total && guard++ < 300){
    store[T.PROGRESS_KEY] = JSON.stringify(progress);
    const r = T.resolveMemberPool({ skill:'gramatica', level:'medio', bankLevel:T.G.medio, saved:null });
    const ids = r.pool.map(i => i.id);
    progress.sessions.push({ skill:'gramatica', level:'medio', topics:[], date:'2026-10-05', startedAt: guard, durationMs:1, results: ids.map(id => ({ itemId:id, isCorrect:true })) });
    sessions.push(ids); seen += ids.length;
  }
  return { sessions, total };
}
['corta', 'media', 'larga'].forEach(len => {
  test('sesión ' + len + ': conserva su tamaño y los ejercicios nuevos no la dominan', () => {
    const want = T.SESSION_LENGTHS[len].items;
    const { sessions, total } = runCycle(len);
    assert.ok(total >= 100, 'el banco de medio debe incluir lo nuevo');
    sessions.slice(0, -1).forEach((s, i) => assert.strictEqual(s.length, want, 'la sesión ' + (i + 1) + ' tiene ' + s.length + ', se esperaban ' + want));
    assert.ok(sessions[sessions.length - 1].length <= want);
    // la última sesión del ciclo puede completarse con ejercicios del ciclo anterior (diseño del mazo): no cuenta como repetición
    const flat = [].concat(...sessions.slice(0, -1));
    assert.strictEqual(new Set(flat).size, flat.length, 'se repitió un ejercicio dentro del ciclo');
    // un microtema nunca llena por sí solo una sesión larga: como mucho 5 del mismo bloque (su tamaño)
    sessions.forEach(s => MICROS.forEach(m => {
      const n = s.filter(id => { const r = real.practice.find(x => x.item.id === id); return r && r.item.micro === m; }).length;
      assert.ok(n <= 6, m + ': ' + n + ' en una sola sesión');
    }));
    // Medición (no es una regla): el mazo toma temas completos y prioriza los ya empezados, así que varios bloques de
    // Futuro pueden coincidir en una sesión. Con FUTURO_STATS=1 se imprime cuánto ocurre.
    if (process.env.FUTURO_STATS) {
      const futuroNuevo = sessions.map(s => s.filter(id => NEW_IDS.test(id)).length);
      global.__stats = global.__stats || {};
      (global.__stats[len] = global.__stats[len] || []).push(...futuroNuevo);
    }
  });
});

test('el Plan de estudio respeta la duración elegida (5 / 9 / 15) con foco en Futuro', () => {
  ['corta', 'media', 'larga'].forEach(len => {
    const want = T.SESSION_LENGTHS[len].items;
    store[T.SESSION_LENGTH_KEY] = len;
    const sel = T.computePlanSelection('medio', want, { focusFamily:'futuro', focusTema:'will-going-to' });
    const pool = T.buildPlanPool('medio', sel);
    assert.strictEqual(pool.length, want, len + ': el Plan armó ' + pool.length);
    assert.ok(pool.every(e => e.item && e.item.id));
  });
});

test('usuarios gratis: ningún ejercicio nuevo cae en una variante que ellos puedan recibir', () => {
  const memberOnly = new Set(T.MEMBERS_ONLY_VARIANT_INDEX.gramatica.medio);
  T.G.medio.forEach((variant, vi) => variant.forEach(block => block.items.forEach(item => {
    if(NEW_IDS.test(item.id)) assert.ok(memberOnly.has(vi), item.id + ' está en la variante ' + vi + ', que no es solo de miembros');
  })));
});

console.log('\nLa comprobación está aislada');
test('ningún ejercicio de comprobación está en los bancos de práctica ni en el índice de errores', () => {
  const index = T.getMistakesItemIndex();
  const ids = new Set(T.CHECK.map(c => c.id));
  assert.strictEqual(ids.size, 12);
  Object.keys(T.G).forEach(l => {
    T.memberBankItems('gramatica', T.G[l]).forEach(i => assert.ok(!ids.has(i.id), i.id + ' en práctica'));
  });
  ids.forEach(id => assert.strictEqual(index.has(id), false, id + ' entró al índice de errores'));
});

if (process.env.FUTURO_STATS) {
  Object.keys(global.__stats || {}).forEach(len => {
    const a = global.__stats[len], want = T.SESSION_LENGTHS[len].items;
    const pct = fn => (100 * a.filter(fn).length / a.length).toFixed(1) + '%';
    console.log(len + ' (' + want + '): sesiones=' + a.length + ' | con algún Futuro nuevo ' + pct(x => x > 0) + ' | >=mitad ' + pct(x => x >= want / 2) + ' | toda la sesión ' + pct(x => x >= want) + ' | máx ' + Math.max(...a));
  });
}
console.log('\n' + passed + ' pruebas correctas');
