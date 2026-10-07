#!/usr/bin/env node
/* Comprobaciones y señales de microtema con VARIOS dispositivos.
   Corre con:  node tools/tests/multi-dispositivo.test.js   (desde la carpeta inglesconLeo)
   Usa app.js, data.js y temas.js REALES. Cada dispositivo tiene su propio localStorage y la "nube" es una lista de
   sesiones (como progress_sessions). Se puede probar otro app.js con APP_JS=<ruta> (para ver que la prueba falla con el código viejo).

   Regla que se protege: si el alumno hizo una comprobación en el dispositivo A, el dispositivo B NUNCA debe ofrecer
   ese mismo ejercicio como "no visto", aunque B haya mirado su estado ANTES de que llegara el sync. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const APP = process.env.APP_JS || path.join(root, 'app.js');
const noop = () => {};
const el = () => { let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
  set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };

const CLOUD = [];   // la nube compartida: sesiones de todos los dispositivos de ESTE alumno
function makeDevice(opts){
  const store = {};
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; }, key:i=>Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: el(), documentElement: el(), createElement: el },
    location:{ hash:'', search:'', pathname:'/' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  if(opts && opts.account) store.leo_member_hint = JSON.stringify({ m:1, t:1 });
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
  const calls = { sync:0 };
  if(opts && opts.backend){
    // Imita backend.js: pushSession sube la sesión; syncProgressFromCloud mezcla en localStorage las que faltan.
    ctx.LeoBackend = {
      isConfigured: () => true,
      pushSession: s => { CLOUD.push(JSON.parse(JSON.stringify(s))); },
      syncProgressFromCloud: async () => {
        calls.sync++;
        if(opts.syncResult) return opts.syncResult;
        const p = JSON.parse(store.leo_progress_v2 || '{"sessions":[],"lastActivity":null}');
        const have = new Set(p.sessions.map(s => s.startedAt + '|' + s.skill));
        CLOUD.forEach((s, i) => { if(!have.has(s.startedAt + '|' + s.skill)) p.sessions.push(Object.assign({}, s, { cloudId: i + 1 })); });
        p.sessions.sort((a, b) => a.startedAt - b.startedAt);
        store.leo_progress_v2 = JSON.stringify(p);
        return 'ok';
      },
      askLeoAI: noop, applyMistakeResults: async () => {}, loadMistakeStats: async () => null
    };
  }
  vm.runInContext(fs.readFileSync(APP, 'utf8') + `
;this.__t = {};
['recordSession', 'loadProgress', 'pickCheckItems', 'checkSeenSet', 'checkAvailable', 'isCheckItem', 'microCheckStart', 'microFlowState', 'microStatsAll', 'syncBeforeCheck', 'cloudSyncNeeded', 'ensureDerived', 'MICRO_STATS_KEY', 'CHECK_SEEN_KEY', 'PROGRESS_KEY', 'GRAMMAR_CHECK_BANK', 'MICRO_BY_ID', 'GRAMMAR_BANK', 'getMistakesItemIndex'].forEach(n => { try{ this.__t[n] = eval(n); }catch(e){} });`, ctx);
  const t = ctx.__t;
  t.ctx = ctx; t.store = store; t.calls = calls;
  t.stats = () => JSON.parse(store['leo_micro_stats_v1'] || '{}');
  return t;
}

let passed = 0, queue = Promise.resolve();
function test(name, fn){
  queue = queue.then(async () => {
    CLOUD.length = 0;
    try{ await fn(); passed++; console.log('  ok  ' + name); }
    catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
  });
}
const MICRO = 'going-to-evidencia';
const checkIds = t => t.GRAMMAR_CHECK_BANK.filter(i => i.micro === MICRO).map(i => i.id);
const practiceIds = t => { const out = []; t.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === MICRO) out.push(i.id); }))); return out; };
const plain = o => JSON.parse(JSON.stringify(o));
let CLOCKT = Date.now() - 100000;
const rec = (t, skill, ids, ok) => t.recordSession({ skill, level:'medio', topics:[], startedAt: CLOCKT += 1, results: ids.map(id => ({ itemId:id, isCorrect: ok })) });
function activate(t){ t.MICRO_BY_ID[MICRO].active = true; }

// A: falla 3 ejercicios distintos (debilidad), practica 5 más y termina la comprobación (3 ejercicios inéditos)
function alumnoEnA(a){
  const pr = practiceIds(a);
  rec(a, 'gramatica', pr.slice(0, 3), false);
  rec(a, 'gramatica', pr.slice(0, 5), true);
  assert.strictEqual(a.microFlowState(MICRO, a.stats()[MICRO]).state, 'listo-comprobar');
  rec(a, 'check', checkIds(a).slice(0, 3), true);                  // 1ª ronda
  rec(a, 'check', checkIds(a).slice(3), true);                     // 2ª ronda: A consumió los 6 checks
}

test('base: en el mismo dispositivo, una comprobación hecha no vuelve a salir', () => {
  const a = makeDevice({ backend:true, account:true }); activate(a);
  alumnoEnA(a);
  assert.strictEqual(a.checkAvailable(MICRO), false);
  assert.strictEqual(a.pickCheckItems(MICRO, 3), null);
});

test('B carga ANTES del sync: el conjunto vacío no queda como verdad definitiva', async () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  const b = makeDevice({ backend:true, account:true }); activate(b);
  // B arranca: pregunta por lo visto antes de que llegue el progreso de la nube
  assert.strictEqual(Object.keys(plain(b.checkSeenSet())).length, 0);
  assert.strictEqual(b.checkAvailable(MICRO), true);              // todavía no sabe nada: es lo esperado
  // llega el sync (otro dispositivo ya hizo la comprobación)
  assert.strictEqual(await b.ctx.LeoBackend.syncProgressFromCloud(), 'ok');
  assert.deepStrictEqual(Object.keys(plain(b.checkSeenSet())).sort(), plain(checkIds(b)).sort());
});

test('después del sync, la comprobación ya hecha en A no se vuelve a ofrecer en B', async () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  const b = makeDevice({ backend:true, account:true }); activate(b);
  b.checkSeenSet(); b.checkAvailable(MICRO);                       // caché vacía creada antes del sync
  await b.ctx.LeoBackend.syncProgressFromCloud();
  assert.strictEqual(b.checkAvailable(MICRO), false);
  assert.strictEqual(b.pickCheckItems(MICRO, 3), null);
  const st = b.microCheckStart(MICRO);
  assert.strictEqual(st.items, null);
  assert.notStrictEqual(st.reason, undefined);
});

test('segundo dispositivo: las señales por microtema se reconstruyen igual que en A (misma debilidad, misma comprobación)', async () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  const b = makeDevice({ backend:true, account:true }); activate(b);
  assert.deepStrictEqual(b.stats(), {});                           // B no sabe nada todavía
  await b.ctx.LeoBackend.syncProgressFromCloud();
  const sb = plain(b.microStatsAll()), sa = plain(a.stats());
  assert.deepStrictEqual(sb, sa);
  assert.strictEqual(sb[MICRO].ck.a, 6);
  assert.ok(sb[MICRO].lc && sb[MICRO].lc.n === 3, 'la última comprobación se recupera');
});

test('B ya tenía su propia práctica: al llegar lo de A se suman, no se pisan', async () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  const b = makeDevice({ backend:true, account:true }); activate(b);
  rec(b, 'gramatica', practiceIds(b).slice(0, 1), true);           // práctica propia en B, sin sync
  await b.ctx.LeoBackend.syncProgressFromCloud();
  const s = b.microStatsAll()[MICRO];
  assert.strictEqual(s.ck.a, 6);                                   // lo de A llegó
  assert.strictEqual(s.a, 3 + 5 + 1);                              // práctica de A (3 + 5) y la de B
  assert.strictEqual(b.checkAvailable(MICRO), false);
});

test('B graba una sesión nueva con datos de A ya descargados sin haberlos mirado: no se pierden', async () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  const b = makeDevice({ backend:true, account:true }); activate(b);
  b.checkSeenSet();
  await b.ctx.LeoBackend.syncProgressFromCloud();                  // las sesiones llegan al progreso pero nadie reconstruye todavía
  rec(b, 'gramatica', practiceIds(b).slice(0, 1), true);           // recordSession pone al día las cachés ANTES de sumar
  assert.deepStrictEqual(Object.keys(plain(b.checkSeenSet())).sort(), plain(checkIds(b)).sort());
  assert.strictEqual(b.stats()[MICRO].ck.a, 6);
});

test('antes de ofrecer la comprobación se sincroniza con la nube (y si no se puede, no se arriesga a repetir)', async () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  const b = makeDevice({ backend:true, account:true }); activate(b);
  assert.strictEqual(b.cloudSyncNeeded(), true);
  assert.strictEqual(await b.syncBeforeCheck(), 'ok');
  assert.strictEqual(b.calls.sync, 1);
  assert.strictEqual(b.checkAvailable(MICRO), false);
  const off = makeDevice({ backend:true, account:true, syncResult:'fail' });
  assert.strictEqual(await off.syncBeforeCheck(), 'fail');
  const guest = makeDevice({ backend:true });                       // sin cuenta: no hay nada que sincronizar
  assert.strictEqual(guest.cloudSyncNeeded(), false);
  assert.strictEqual(await guest.syncBeforeCheck(), 'skip');
  assert.strictEqual(guest.calls.sync, 0);
});

test('escala: sin cambios en el progreso NO se recorre el historial otra vez', () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  let n = 0;
  const real = a.ctx.rebuildDerived;
  a.ctx.rebuildDerived = function(){ n++; return real.apply(this, arguments); };
  for(let i = 0; i < 20; i++){ a.checkSeenSet(); a.microStatsAll(); a.checkAvailable(MICRO); }
  assert.strictEqual(n, 0, 'las lecturas repetidas usan la caché');
  rec(a, 'gramatica', practiceIds(a).slice(0, 1), true);            // guardar una sesión nueva tampoco reconstruye
  a.checkSeenSet(); a.microStatsAll();
  assert.strictEqual(n, 0);
});

test('reconstruir desde las sesiones da lo mismo que llevar la cuenta sesión a sesión (y no toca otras cosas)', () => {
  const a = makeDevice({ backend:true, account:true }); activate(a); alumnoEnA(a);
  const incremental = plain(a.stats());
  const seenBefore = plain(a.checkSeenSet());
  const progressBefore = a.store.leo_progress_v2;
  delete a.store.leo_derived_meta_v1; delete a.store['leo_micro_stats_v1']; delete a.store['leo_check_seen_v1'];
  a.ensureDerived();
  assert.deepStrictEqual(plain(a.stats()), incremental);
  assert.deepStrictEqual(plain(a.checkSeenSet()), seenBefore);
  assert.strictEqual(a.store.leo_progress_v2, progressBefore, 'el progreso guardado no cambia');
});

test('alumno viejo sin microtemas: no se guarda ninguna caché nueva', async () => {
  const b = makeDevice({ backend:true, account:true });
  b.store.leo_progress_v2 = JSON.stringify({ sessions:[{ skill:'gramatica', level:'facil', topics:['x'], date:'2026-10-01', startedAt:1, durationMs:1, results:[{ itemId:'g-facil-this-1', isCorrect:false }] }], lastActivity:null });
  b.ensureDerived(); b.checkSeenSet(); b.microStatsAll();
  assert.strictEqual(b.store['leo_micro_stats_v1'], undefined);
  assert.strictEqual(b.store['leo_check_seen_v1'], undefined);
});

queue.then(() => console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : '')));
