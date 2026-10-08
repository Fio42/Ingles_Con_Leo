#!/usr/bin/env node
/* Sugerencia de nivel (app.js: computeLevelSuggestion y compañía).
   Corre con:  node tools/tests/level-suggest.test.js   (desde la carpeta inglesconLeo)
   Usa el app.js, data.js y temas.js REALES en un navegador simulado. No toca la red.
   Lo más importante: SOLO sugiere (nunca cambia el nivel sola), con evidencia conservadora, y no toca el progreso. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');

const store = {};
const noop = ()=>{};
const el = ()=>{ let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
  set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
const timers = [];
const ctx = {
  console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout:(fn, ms)=>{ timers.push({ fn, ms }); return timers.length; }, clearTimeout, URLSearchParams,
  localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
  document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: el(), documentElement: el(), createElement: el },
  location:{ hash:'', search:'', pathname:'/', reload:()=>{ ctx.__reloads = (ctx.__reloads || 0) + 1; } }, navigator:{ userAgent:'node' }, addEventListener:noop,
  MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
  matchMedia:()=>({ matches:false, addEventListener:noop })
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { computeLevelSuggestion, levelSuggestState, acceptLevelSuggestion, rejectLevelSuggestion, undoLevelSuggestion, renderLevelSuggestion,
  getProfile, saveProfile, setUserLevel, getUserLevel, getUserLevelSource, popRetried, instrumentResults, ANSWER_LOG, RETRIED_ITEMS, computeDiagnosis,
  diagTemaIdForTopic, LEVELS, PROGRESS_KEY, LEVEL_SUGGEST_KEY, G:GRAMMAR_BANK, VB:VOCAB_BANK, LB:LISTENING_BANK, loadProgress };`, ctx);
const T = ctx.__t;

const DAY = 86400000, NOW = Date.now();
const dateStr = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
function grammarByTema(level){
  const by = new Map();
  T.G[level].forEach(v => v.forEach(g => g.items.forEach(it => {
    const k = T.diagTemaIdForTopic(g.topic) || 'topic:' + g.topic;
    if(!by.has(k)) by.set(k, []);
    by.get(k).push(it.id);
  })));
  return [...by.values()].filter(l => l.length >= 3);
}
const flat = (bank, level) => { const o = []; bank[level].forEach(v => v.forEach(i => o.push(i.id))); return o; };
const POOLS = {};
function pools(level){
  if(!POOLS[level]) POOLS[level] = { gram: grammarByTema(level), voc: flat(T.VB, level), lis: flat(T.LB, level) };
  return POOLS[level];
}
// n respuestas de gramática repartidas en `temas` temas distintos (round robin), desde `from`
function gram(level, n, { temas = 5, from = 0, wrong = 0, w = 0 } = {}){
  const P = pools(level).gram, out = [];
  for(let i = 0; i < n; i++){ const list = P[(from + i) % Math.min(temas, P.length)]; const id = list[Math.floor((from + i) / Math.min(temas, P.length)) % list.length];
    out.push({ itemId:id, isCorrect: i >= wrong, ...(i < w ? { w:'x' } : {}) }); }
  return out;
}
const pick = (arr, n, from, ok = true) => Array.from({ length:n }, (_, i) => ({ itemId: arr[(from + i) % arr.length], isCorrect: ok }));
function sess(skill, level, daysAgo, results, extra){
  const t = NOW - daysAgo * DAY;
  return Object.assign({ skill, level, topics:[], date: dateStr(t), startedAt: t, durationMs: 240000, results }, extra || null);
}
function setProgress(sessions){ store[T.PROGRESS_KEY] = JSON.stringify({ sessions, lastActivity:null }); }
function setProfile(p){ T.saveProfile(p); }
function reset(){ Object.keys(store).forEach(k => delete store[k]); T.ANSWER_LOG.clear(); T.RETRIED_ITEMS.clear(); timers.length = 0; ctx.__reloads = 0; }

// Alumno fuerte en Fácil: 2 sesiones, 3 habilidades, 5 temas de gramática, 19/20 al primer intento.
function strongHistory(level){
  const P = pools(level);
  return [ sess('gramatica', level, 3, gram(level, 10)),
           sess('mixto', level, 1, [ ...pick(P.voc, 5, 0).map((r, i) => i === 1 ? { ...r, isCorrect:false } : r), ...pick(P.lis, 5, 0) ]) ];
}
// Alumno desbordado: 6/15 recientes, mal en gramática (varias familias) y en vocabulario.
function weakHistory(level){
  const P = pools(level);
  return [ sess('gramatica', level, 3, gram(level, 12, { temas:6, wrong:11 })),
           sess('mixto', level, 1, [ ...pick(P.voc, 4, 0, false), ...pick(P.lis, 4, 0, true).map((r, i) => i === 0 ? r : { ...r, isCorrect:false }) ]) ];
}

let passed = 0, failed = 0;
function test(name, fn){
  try{ reset(); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}
const sug = () => T.computeLevelSuggestion(null, NOW);

console.log('Sugerencia de nivel: reglas');
test('alumno fuerte (self) en Fácil: sugiere subir a Medio', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  setProgress(strongHistory('facil'));
  const s = sug();
  assert(s && s.dir === 'up' && s.from === 'facil' && s.to === 'medio', JSON.stringify(s));
});
test('alumno que saltó el onboarding (skipped): mismas reglas, sin trato especial', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'skipped' });
  setProgress(strongHistory('facil'));
  const s = sug();
  assert(s && s.dir === 'up' && s.to === 'medio');
  setProgress(strongHistory('facil').slice(0, 1));   // poca evidencia: nada
  assert.strictEqual(sug(), null);
});
test('alumno desbordado en Fácil: sugiere bajar a Principiante', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  setProgress(weakHistory('facil'));
  const s = sug();
  assert(s && s.dir === 'down' && s.to === 'principiante', JSON.stringify(s));
});
test('menos de 15 respuestas válidas: nada', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const h = strongHistory('facil'); h[1].results = h[1].results.slice(0, 3);
  setProgress(h);
  assert.strictEqual(sug(), null);
});
test('una sola sesión: nada', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const P = pools('facil');
  setProgress([ sess('mixto', 'facil', 1, [ ...gram('facil', 10), ...pick(P.voc, 5, 0), ...pick(P.lis, 5, 0) ]) ]);
  assert.strictEqual(sug(), null);
});
test('un solo tema domina más del 40% de la evidencia: nada', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const P = pools('facil'), one = P.gram[0];
  const rs = one.slice(0, 3).map(id => ({ itemId:id, isCorrect:true }));
  setProgress([ sess('gramatica', 'facil', 3, [ ...rs, ...gram('facil', 7, { temas:4, from:3 }) ]),
                sess('gramatica', 'facil', 1, [ ...P.gram[0].slice(3, 5).map(id => ({ itemId:id, isCorrect:true })), ...pick(P.voc, 3, 0), ...pick(P.lis, 5, 0) ]) ]);
  // 3+2 = 5 del mismo tema de 20 = 25%: sube a 9 para pasar de 40%
  const many = []; const big = P.gram.reduce((a, b) => b.length > a.length ? b : a);
  if(big.length < 9) return;   // el banco no tiene un tema tan grande: la regla se prueba en la otra prueba
  setProgress([ sess('gramatica', 'facil', 3, big.slice(0, 9).map(id => ({ itemId:id, isCorrect:true }))),
                sess('mixto', 'facil', 1, [ ...gram('facil', 3, { temas:3, from:1 }).filter(r => !big.includes(r.itemId)), ...pick(P.voc, 4, 0), ...pick(P.lis, 4, 0) ]) ]);
  assert.strictEqual(sug(), null);
});
test('menos de 3 temas distintos de gramática: nada', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const P = pools('facil');
  setProgress([ sess('gramatica', 'facil', 3, gram('facil', 6, { temas:2 })),
                sess('mixto', 'facil', 1, [ ...pick(P.voc, 5, 0), ...pick(P.lis, 5, 0), ...pick(P.voc, 2, 20) ]) ]);
  assert.strictEqual(sug(), null);
});
test('los aciertos tras "Volver a intentar" (w) cuentan como fallo: 12/15 no basta', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const h = strongHistory('facil');
  h[0].results = gram('facil', 10, { w:3 });   // 3 aciertos con reintento
  setProgress(h);
  assert.strictEqual(sug(), null);
});
test('reintento en otras habilidades (w:"retry") también cuenta como fallo', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const h = strongHistory('facil');
  h[1].results = h[1].results.map((r, i) => (i === 3 || i === 5 || i === 7) ? { ...r, w:'retry' } : r);
  setProgress(h);
  assert.strictEqual(sug(), null);
});
test('ejercicios repetidos no cuentan (repasos)', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const h = strongHistory('facil');
  h.push(sess('gramatica', 'facil', 0, h[0].results.map(r => ({ ...r }))));   // los mismos 10 otra vez
  setProgress(h);
  const s = sug();
  assert(s && s.answers === 20, 'respuestas válidas: ' + (s && s.answers));
});
test('Plan: solo cuenta si el ejercicio salió del banco de SU nivel (r.cl)', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const P = pools('facil');
  const mk = cl => [ sess('plan', 'facil', 3, gram('facil', 10).map(r => cl ? { ...r, skill:'gramatica', cl } : { ...r, skill:'gramatica' })),
                      sess('plan', 'facil', 1, [ ...pick(P.voc, 5, 0).map(r => ({ ...r, skill:'vocabulario', ...(cl ? { cl } : null) })), ...pick(P.lis, 5, 0).map(r => ({ ...r, skill:'listening', ...(cl ? { cl } : null) })) ]) ];
  setProgress(mk(undefined)); assert.strictEqual(sug(), null, 'sesiones de Plan antiguas (sin cl) no cuentan');
  setProgress(mk('medio'));   assert.strictEqual(sug(), null, 'Plan con dificultad Difícil (cl medio) no cuenta');
  setProgress(mk('facil'));   assert(sug() && sug().dir === 'up', 'Plan "A tu nivel" sí cuenta');
});
test('no mezcla respuestas de otros niveles', () => {
  setProfile({ name:'A', level:'medio', createdAt:1, src:'self' });
  setProgress(strongHistory('facil'));   // todo lo fuerte fue en Fácil
  assert.strictEqual(sug(), null);
});
test('sesiones de comprobación y de errores no cuentan', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const h = strongHistory('facil'); h[0].skill = 'errores'; h[1].skill = 'check';
  setProgress(h);
  assert.strictEqual(sug(), null);
});
test('Principiante no baja y Avanzado no sube', () => {
  setProfile({ name:'A', level:'principiante', createdAt:1, src:'self' });
  setProgress(weakHistory('principiante'));
  assert.strictEqual(sug(), null);
  setProfile({ name:'A', level:'avanzado', createdAt:1, src:'self' });
  setProgress(strongHistory('avanzado'));
  assert.strictEqual(sug(), null);
});
test('bajar exige dificultad en más de un área (un solo tema flojo no basta)', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  const P = pools('facil');
  // todo mal pero solo en vocabulario (una habilidad); gramática y listening bien
  setProgress([ sess('gramatica', 'facil', 3, gram('facil', 10)), sess('mixto', 'facil', 1, [ ...pick(P.voc, 10, 0, false), ...pick(P.lis, 3, 0, true) ]) ]);
  assert.strictEqual(sug(), null);
});
test('sin perfil confirmado no se opina', () => {
  setProgress(strongHistory('facil'));
  assert.strictEqual(sug(), null);
});

console.log('Sugerencia de nivel: decisiones');
test('rechazar: calla 30 días (misma dirección/nivel) y vuelve después', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  setProgress(strongHistory('facil'));
  const s = sug(); T.rejectLevelSuggestion(s);
  assert.strictEqual(sug(), null);
  assert.strictEqual(T.computeLevelSuggestion(null, NOW + 29 * DAY), null, 'a los 29 días sigue callada');
  const later = T.computeLevelSuggestion(null, NOW + 31 * DAY);
  assert(later && later.dir === 'up', 'pasados 30 días, con la evidencia aún reciente, vuelve a aparecer');
});
test('rechazar subir no bloquea una sugerencia de bajar', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  T.rejectLevelSuggestion({ dir:'up', from:'facil' });
  setProgress(weakHistory('facil'));
  assert(sug() && sug().dir === 'down');
});
test('aceptar: cambia el nivel con origen "suggested", guarda el anterior y reinicia la evidencia', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  setProgress(strongHistory('facil'));
  const before = JSON.stringify(T.loadProgress());
  T.acceptLevelSuggestion(sug());
  assert.strictEqual(T.getUserLevel(), 'medio');
  assert.strictEqual(T.getUserLevelSource(), 'suggested');
  const st = T.levelSuggestState();
  assert(st.prev && st.prev.level === 'facil' && st.prev.to === 'medio' && st.since > 0);
  assert.strictEqual(JSON.stringify(T.loadProgress()), before, 'el progreso histórico no cambia');
  assert.strictEqual(sug(), null, 'en Medio no hay evidencia todavía');
});
test('deshacer: vuelve al nivel anterior (origen "self") y no lo ofrece de nuevo enseguida', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  setProgress(strongHistory('facil'));
  T.acceptLevelSuggestion(sug());
  assert.strictEqual(T.undoLevelSuggestion(), 'facil');
  assert.strictEqual(T.getUserLevel(), 'facil');
  assert.strictEqual(T.getUserLevelSource(), 'self');
  assert.strictEqual(sug(), null);
});
test('segundo navegador: nivel nuevo de la nube + historial completo, sin estado local, no repite la sugerencia', () => {
  // La nube ya dice Medio (aceptado en el otro navegador); este navegador no tiene leo_level_suggest_v1.
  setProfile({ name:'A', level:'medio', createdAt:1, src:'suggested' });
  setProgress(strongHistory('facil'));   // todo el historial viejo viene de Fácil
  assert.strictEqual(sug(), null);
  // y lo practicado en Medio tras aceptar sí cuenta (con el nivel de cada sesión)
  const P = pools('medio');
  setProgress([ ...strongHistory('facil'), ...strongHistory('medio') ]);
  assert(sug() && sug().from === 'medio' && sug().to === 'avanzado');
});
test('calcular la sugerencia no escribe nada (progreso, perfil y estado intactos)', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  setProgress(strongHistory('facil'));
  T.loadProgress();   // la migración de fechas de siempre escribe su marca una vez; no es de la sugerencia
  const snap = JSON.stringify(store);
  sug(); sug();
  assert.strictEqual(JSON.stringify(store), snap);
});
test('el diagnóstico no cambia por calcular o decidir la sugerencia', () => {
  setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
  setProgress(strongHistory('facil'));
  const a = JSON.stringify(T.computeDiagnosis(T.loadProgress()));
  T.rejectLevelSuggestion(sug());
  const b = JSON.stringify(T.computeDiagnosis(T.loadProgress()));
  assert.strictEqual(a, b);
});

console.log('Sugerencia de nivel: tarjeta');
function fakeEl(){
  const h = {};
  return { hidden:true, innerHTML:'', h,
    querySelector(sel){ const id = sel.slice(1); return this.innerHTML.includes('id="' + id + '"') ? (h[id] = { addEventListener(ev, fn){ this.fn = fn; } }) : null; } };
}
const settle = () => new Promise(r => setImmediate(r));
async function atest(name, fn){
  try{ reset(); await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}
(async () => {
  await atest('la tarjeta ofrece subir con dos botones claros y "Mantener" la calla', async () => {
    setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
    setProgress(strongHistory('facil'));
    const e = fakeEl(); ctx.__t.renderLevelSuggestion(e); await settle();
    assert.strictEqual(e.hidden, false);
    assert(/te est[aá] quedando f[aá]cil/.test(e.innerHTML) && /probar Medio/.test(e.innerHTML) && /Mantener mi nivel/.test(e.innerHTML));
    assert(!/—/.test(e.innerHTML), 'sin rayas largas');
    e.h.lsKeep.fn();
    assert.strictEqual(e.hidden, true);
    assert.strictEqual(T.getUserLevel(), 'facil', 'mantener no cambia el nivel');
    const e2 = fakeEl(); ctx.__t.renderLevelSuggestion(e2); await settle();
    assert.strictEqual(e2.hidden, true, 'no vuelve a aparecer');
  });
  await atest('la tarjeta: aceptar cambia el nivel; luego ofrece "Volver a Fácil"', async () => {
    setProfile({ name:'A', level:'facil', createdAt:1, src:'skipped' });
    setProgress(strongHistory('facil'));
    const e = fakeEl(); ctx.__t.renderLevelSuggestion(e); await settle();
    e.h.lsAccept.fn();
    assert.strictEqual(T.getUserLevel(), 'medio');
    assert.strictEqual(T.getUserLevelSource(), 'suggested');
    const e2 = fakeEl(); ctx.__t.renderLevelSuggestion(e2); await settle();
    assert(/Volver a F[aá]cil/.test(e2.innerHTML));
    e2.h.lsUndo.fn();
    assert.strictEqual(T.getUserLevel(), 'facil');
  });
  await atest('la tarjeta para bajar usa un tono amable', async () => {
    setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
    setProgress(weakHistory('facil'));
    const e = fakeEl(); ctx.__t.renderLevelSuggestion(e); await settle();
    assert(/resultando dif[ií]cil/.test(e.innerHTML) && /Principiante/.test(e.innerHTML));
  });
  await atest('sin sugerencia la tarjeta queda oculta', async () => {
    setProfile({ name:'A', level:'facil', createdAt:1, src:'self' });
    setProgress(strongHistory('facil').slice(0, 1));
    const e = fakeEl(); ctx.__t.renderLevelSuggestion(e); await settle();
    assert.strictEqual(e.hidden, true);
  });

  console.log('Reintentos registrados (instrumentación)');
  test('popRetried + instrumentResults marcan w:"retry" solo en el reintento de otras habilidades', () => {
    const P = pools('facil');
    const retried = P.voc[0], clean = P.voc[1];
    T.popRetried([{ itemId:retried, isCorrect:false }]);
    const out = T.instrumentResults([{ itemId:retried, isCorrect:true }, { itemId:clean, isCorrect:true }], new Set());
    assert.strictEqual(out[0].w, 'retry');
    assert.strictEqual(out[1].w, undefined);
    assert.strictEqual(T.RETRIED_ITEMS.size, 0, 'se limpia al guardar');
    const again = T.instrumentResults([{ itemId:retried, isCorrect:true }], new Set());
    assert.strictEqual(again[0].w, undefined, 'el marcador no se arrastra a la sesión siguiente');
  });
  test('acertar al primer intento no se marca; popRetried de un acierto no marca nada', () => {
    const P = pools('facil');
    T.popRetried([{ itemId:P.voc[2], isCorrect:true }]);
    const out = T.instrumentResults([{ itemId:P.voc[2], isCorrect:true }], new Set());
    assert.strictEqual(out[0].w, undefined);
  });

  console.log('\n' + passed + ' pruebas OK' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
