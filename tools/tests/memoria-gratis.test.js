#!/usr/bin/env node
/* Memoria de aprendizaje de la cuenta gratis: recuerda qué le costó, propone ejercicios distintos, cuenta en el límite de siempre
   y no sube nada extra. Usa el app.js, data.js y temas.js REALES en un navegador simulado.
   Corre con:  node tools/tests/memoria-gratis.test.js   (desde la carpeta inglesconLeo) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const noop = ()=>{};
const el = ()=>{ let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
  set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
const calls = { pushSession:0, apply:0, free:[], bump:0 };
function makeCtx(store, tier, uid){
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
;this.__t = { freeSessionAnswer, freeSessionEnd, freeMemoryWeakSpots, freeMemoryBoost, freeMemoryCardHtml, freeMemoryNoteHtml, loadProgress, readFreePending,
  progressSessionIdentity, GRAMMAR_BANK, VOCAB_BANK, MEMBERS_ONLY_VARIANT_INDEX, FREE_USER_DAILY_LIMIT, todayStr, localDailyCountKey, flushFreeSessions,
  getMistakesItemIndex, diagTemaIdForFound, diagTemaIdForTopic, computeMistakeIds,
  setAcct(t, p){ _leoAccessTier = t; _leoAccessProfile = p; } };`, ctx);
  ctx.__t.ctx = ctx;
  ctx.__t.setAcct(tier, tier === 'free' ? { id: uid } : null);
  ctx.LeoBackend = {
    isConfigured:()=>true, pushSession(){ calls.pushSession++; }, applyMistakeResults(){ calls.apply++; return Promise.resolve(); },
    pushFreeSession(s){ calls.free.push(s); return Promise.resolve('ok'); }, bumpFreeDailyCount(){ calls.bump++; return Promise.resolve(); },
    syncProgressFromCloud(){ return Promise.resolve('ok'); }
  };
  return ctx.__t;
}
const plain = o => JSON.parse(JSON.stringify(o));
let passed = 0;
async function test(name, fn){
  try{ Object.keys(calls).forEach(k => calls[k] = Array.isArray(calls[k]) ? [] : 0); await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
}
function doDoesIds(T, level){
  // ejercicios del tema Presente simple (Do/Does, don't/doesn't...) que existen en variantes abiertas a cuentas gratis
  const out = [];
  const blocked = T.MEMBERS_ONLY_VARIANT_INDEX.gramatica[level] || [];
  T.GRAMMAR_BANK[level].forEach((variant, vi) => variant.forEach(tg => tg.items.forEach(it => {
    if(T.diagTemaIdForTopic(tg.topic) === 'presente-simple' && blocked.indexOf(vi) === -1) out.push({ id: it.id, vi, topic: tg.topic });
  })));
  return out;
}
const DAY = 86400000;
(async () => {
  console.log('Memoria de aprendizaje (cuentas gratis)');
  await test('Cuenta gratis: el fallo de hoy queda en SU progreso, sin subir nada extra', async () => {
    const store = {}; const T = makeCtx(store, 'free', 'user-A');
    const ids = doDoesIds(T, 'facil'); assert(ids.length >= 6, 'hay ejercicios de Presente simple libres: ' + ids.length);
    const topics = [ids[0].topic];
    T.freeSessionAnswer('gramatica', 'facil', topics, { itemId: ids[0].id, isCorrect: false });
    T.freeSessionAnswer('gramatica', 'facil', topics, { itemId: ids[1].id, isCorrect: false });
    const p = plain(T.loadProgress());
    assert.strictEqual(p.sessions.length, 1); assert.strictEqual(p.sessions[0].tier, 'free'); assert.strictEqual(p.sessions[0].results.length, 2);
    assert.strictEqual(calls.pushSession, 0); assert.strictEqual(calls.apply, 0);
    T.freeSessionEnd('gramatica'); await T.flushFreeSessions();
    assert.strictEqual(calls.free.length, 1, 'una sola subida'); assert.strictEqual(calls.pushSession, 0);
    // la copia que vuelve de la nube tiene la misma identidad que la local: no se duplica
    const s = p.sessions[0], cloud = Object.assign({}, calls.free[0]);
    assert.strictEqual(T.progressSessionIdentity(s), T.progressSessionIdentity(cloud));
    assert(!Object.keys(store).some(k => /^leo_progress/.test(k) && !/@@/.test(k)), 'nada en claves sin aislar');
    const weak = plain(T.freeMemoryWeakSpots()); assert.strictEqual(weak.length, 1); assert.strictEqual(weak[0].ids.length, 2);
  });
  await test('Mañana: recuerda la dificultad y propone ejercicios DISTINTOS del mismo tema, solo de variantes libres', async () => {
    const store = {}; const T = makeCtx(store, 'free', 'user-A');
    const ids = doDoesIds(T, 'facil');
    const failed = ids.slice(0, 2).map(x => x.id);
    failed.forEach(id => T.freeSessionAnswer('gramatica', 'facil', [ids[0].topic], { itemId: id, isCorrect: false }));
    T.freeSessionEnd('gramatica');
    // pasa un día
    const key = Object.keys(store).find(k => /^leo_progress/.test(k));
    const p = JSON.parse(store[key]); p.sessions.forEach(s => { s.startedAt -= DAY; s.date = '2000-01-01'; }); store[key] = JSON.stringify(p);
    // una variante cualquiera (de otro tema) como sesión base
    const baseVariant = T.GRAMMAR_BANK.facil.findIndex((v, i) => (T.MEMBERS_ONLY_VARIANT_INDEX.gramatica.facil.indexOf(i) === -1) && !v.some(tg => T.diagTemaIdForTopic(tg.topic) === 'presente-simple'));
    assert(baseVariant >= 0, 'variante base sin Do/Does');
    const base = []; T.GRAMMAR_BANK.facil[baseVariant].forEach(tg => tg.items.forEach(it => base.push(Object.assign({ topic: tg.topic }, it))));
    const snapshot = JSON.stringify(T.GRAMMAR_BANK.facil);
    const m = T.freeMemoryBoost('gramatica', 'facil', base);
    assert(m.boosted.length >= 1 && m.boosted.length <= 4, 'refuerzo: ' + m.boosted.length);
    assert.strictEqual(m.pool.length, base.length, 'mismo largo = mismo conteo del límite');
    m.boosted.forEach((id, i) => { assert.strictEqual(m.pool[i].id, id); assert(failed.indexOf(id) === -1, 'no repite el que falló: ' + id); assert(ids.some(x => x.id === id), 'es del mismo tema y de variante libre'); });
    assert.strictEqual(JSON.stringify(T.GRAMMAR_BANK.facil), snapshot, 'el banco no se modifica');
    assert(/Recordamos/.test(T.freeMemoryNoteHtml(m, 0)) && T.freeMemoryNoteHtml(m, 1) === '');
    const card = T.freeMemoryCardHtml(); assert(/Recordamos lo que te costó/.test(card) && /data-free-memory="gramatica"/.test(card) && /6 de hoy/.test(card));
    assert(/href="[^"]+"/.test(card), 'conserva el enlace a la explicación');
  });
  await test('Sin errores pendientes no hay tarjeta ni cambios; si lo acierta, deja de recordarlo', async () => {
    const store = {}; const T = makeCtx(store, 'free', 'user-A');
    const ids = doDoesIds(T, 'facil');
    assert.strictEqual(T.freeMemoryCardHtml(), '');
    T.freeSessionAnswer('gramatica', 'facil', [ids[0].topic], { itemId: ids[0].id, isCorrect: false });
    assert(T.freeMemoryCardHtml());
    T.freeSessionEnd('gramatica');
    T.freeSessionAnswer('gramatica', 'facil', [ids[0].topic], { itemId: ids[0].id, isCorrect: true });
    T.freeSessionEnd('gramatica');
    assert.strictEqual(T.freeMemoryCardHtml(), '', 'ya lo acertó');
  });
  await test('En el límite diario la tarjeta no ofrece más ejercicios (el límite sigue siendo 6)', async () => {
    const store = {}; const T = makeCtx(store, 'free', 'user-A');
    const ids = doDoesIds(T, 'facil');
    T.freeSessionAnswer('gramatica', 'facil', [ids[0].topic], { itemId: ids[0].id, isCorrect: false });
    store[T.localDailyCountKey()] = String(T.FREE_USER_DAILY_LIMIT);
    const card = T.freeMemoryCardHtml();
    assert(!/data-free-memory/.test(card) && /Mañana seguimos/.test(card)); assert.strictEqual(T.FREE_USER_DAILY_LIMIT, 6);
  });
  await test('Invitado: nada se guarda ni se recomienda', async () => {
    const store = {}; const T = makeCtx(store, 'guest');
    const ids = doDoesIds(T, 'facil');
    T.freeSessionAnswer('gramatica', 'facil', [ids[0].topic], { itemId: ids[0].id, isCorrect: false });
    assert.strictEqual(plain(T.loadProgress()).sessions.length, 0);
    assert.strictEqual(T.freeMemoryCardHtml(), '');
    const base = ids.slice(0, 8).map(x => ({ id: x.id, topic: x.topic }));
    assert.strictEqual(T.freeMemoryBoost('gramatica', 'facil', base).boosted.length, 0);
  });
  await test('Aislamiento: otra cuenta (otro espacio) no hereda lo que costó', async () => {
    const storeA = {}; const A = makeCtx(storeA, 'free', 'user-A');
    const ids = doDoesIds(A, 'facil');
    A.freeSessionAnswer('gramatica', 'facil', [ids[0].topic], { itemId: ids[0].id, isCorrect: false });
    assert(A.freeMemoryCardHtml());
    const B = makeCtx({}, 'free', 'user-B');       // otro navegador/espacio local, misma app
    assert.strictEqual(B.freeMemoryCardHtml(), '');
  });
  console.log(passed + ' pruebas ok');
})();
