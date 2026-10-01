#!/usr/bin/env node
/* Pruebas de la personalización (app.js): análisis al terminar una sesión,
   patrones de "Mis errores", "Hoy te conviene", mapa de contenido real, foco
   del Plan de estudio y el resumen que se le manda a Leo AI (modo "insight").
   Corre con:  node tools/tests/personalization.test.js   (desde la carpeta inglesconLeo)
   Usa el app.js y data.js REALES en un navegador simulado. No toca la red. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');

const store = {};
const noop = ()=>{};
const el = ()=>{ let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
  set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
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
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { computeDiagnosis, computeWeeklyReport, computeSessionInsight, sessionInsightAiCtx, computeMistakePatterns, mistakePatternsAiCtx,
  progressAiCtx, getTodayPick, todayStartHref, contentForUnit, familyHasItemsAt, computePlanSelection, buildPlanPool, summarizePlanSelection,
  buildLeoAiPayload, leoAiInsightCacheGet, leoAiInsightCacheSet, diagFamilyForTopic, DIAG_GRAMMAR_FAMILIES, SKILL_PAGE, SKILL_ARTICLE,
  PROGRESS_KEY, G:GRAMMAR_BANK, LB:LISTENING_BANK, VB:VOCAB_BANK, WB:WRITING_BANK };`, ctx);
const T = ctx.__t;

const DAY = 86400000, NOW = Date.now();
const dateStr = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
function famItems(fid, level){
  const out = [];
  Object.keys(T.G).filter(l => !level || l === level).forEach(l => T.G[l].forEach(v => v.forEach(g=>{
    const f = T.diagFamilyForTopic(g.topic);
    if(f && f.id === fid) g.items.forEach(i => out.push(i.id));
  })));
  return out;
}
const flat = bank => { const o = []; Object.keys(bank).forEach(l => bank[l].forEach(v => v.forEach(i => o.push(i.id)))); return o; };
const IDS = { prep: famItems('preposiciones'), pasado: famItems('pasado'), tobe: famItems('to-be'), lis: flat(T.LB), voc: flat(T.VB) };
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
// Simula "terminar una sesión": la agrega al historial (como recordSession) y la analiza.
function finish(history, skill, results){
  const s = session(skill, 0, results);
  setProgress(history.concat([s]));
  return T.computeSessionInsight(results, s.startedAt, skill);
}
const pages = new Set(fs.readdirSync(root).filter(f => f.endsWith('.html')));
function hrefExists(href){
  const file = href.split('?')[0].split('#')[0];
  return pages.has(file);
}
function checkActions(actions, name){
  assert(actions.length <= 3, name + ': más de 3 acciones');
  assert.strictEqual(new Set(actions.map(a=>a.href)).size, actions.length, name + ': acción repetida');
  actions.forEach(a => assert(hrefExists(a.href), name + ': enlace a contenido que no existe: ' + a.href));
}
function noJunk(obj, name){
  const txt = JSON.stringify(obj);
  assert(!/undefined|NaN|null%|Infinity/.test(txt), name + ': texto con valores rotos: ' + txt.slice(0, 300));
  assert(!/—/.test(txt), name + ': raya larga (em dash)');
}

let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}

console.log('Personalización');

test('mapa de contenido: cada familia y habilidad lleva a páginas y artículos que existen', ()=>{
  T.DIAG_GRAMMAR_FAMILIES.forEach(f=>{
    const c = T.contentForUnit('family', f.id);
    assert(c && hrefExists(c.practiceHref), f.id + ': práctica inexistente ' + (c && c.practiceHref));
    if(c.article) assert(hrefExists(c.article), f.id + ': artículo inexistente ' + c.article);
  });
  Object.keys(T.SKILL_PAGE).forEach(sk=>{
    const c = T.contentForUnit('skill', sk);
    assert(c && hrefExists(c.practiceHref));
    if(c.article) assert(hrefExists(c.article));
  });
  assert.strictEqual(T.contentForUnit('family', 'no-existe'), null);
  assert.strictEqual(T.contentForUnit('family', 'preposiciones').article, 'articulo-in-on-at.html');
});

test('recomendaciones sin contenido disponible: familia sin ejercicios en el nivel no manda a un Plan vacío', ()=>{
  // Busca una familia que no tenga ejercicios en "principiante".
  const empty = T.DIAG_GRAMMAR_FAMILIES.find(f => !T.familyHasItemsAt(f.id, 'principiante'));
  store['leo_profile'] = JSON.stringify({ level:'principiante' });
  if(empty){
    const c = T.contentForUnit('family', empty.id);
    assert.strictEqual(c.practiceHref, 'gramatica.html', 'sin ejercicios de esa familia: va a Gramática, no a un foco vacío');
    const sel = T.computePlanSelection('principiante', 9, { focusFamily: empty.id });
    assert(!sel.focus || sel.focus.familyId !== empty.id, 'el Plan no fuerza un foco sin ejercicios');
  }
  delete store['leo_profile'];
});

test('Plan con foco elegido (?foco=preposiciones): más ejercicios de esa familia, total igual, sin repetir', ()=>{
  setProgress([]);
  for(let k=0; k<30; k++){
    const sel = T.computePlanSelection('facil', 10, { focusFamily:'preposiciones' });
    assert(sel.focus && sel.focus.familyId === 'preposiciones' && sel.focus.chosen === true);
    assert(sel.focus.count >= 3, 'al menos 3 de la familia elegida');
    const pool = T.buildPlanPool('facil', sel);
    assert.strictEqual(pool.length, 10);
    const ids = pool.map(e => e.item.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    const prepSet = new Set(IDS.prep);
    assert(pool.filter(e => prepSet.has(e.item.id)).length >= Math.min(3, sel.focus.count));
  }
  const normal = T.computePlanSelection('facil', 10);
  assert.strictEqual(normal.focus, null, 'sin foco ni diagnóstico, el Plan sigue igual que antes');
  const bad = T.computePlanSelection('facil', 10, { focusFamily:'<script>' });
  assert.strictEqual(bad.focus, null, 'foco inválido se ignora');
});

test('miembro nuevo: la primera sesión se analiza sin comparar con nada y lleva a contenido real', ()=>{
  const ins = finish([], 'gramatica', answers(IDS.prep, 8, 50));
  assert(ins && ins.n === 8 && ins.correct === 4);
  assert(!ins.improved, 'sin historial no hay "mejoraste"');
  assert(ins.struggle && ins.struggle.key === 'family:preposiciones');
  assert(ins.lines.some(l => /Hoy te costó Preposiciones: fallaste 4 de 8/.test(l.text)), JSON.stringify(ins.lines));
  assert.strictEqual(ins.actions[0].title, 'Practicar Preposiciones');
  assert(/plan-estudio\.html\?foco=preposiciones&empezar=1/.test(ins.actions[0].href));
  assert(ins.actions.some(a => a.href === 'articulo-in-on-at.html' && /in, on, at/i.test(a.title)));
  checkActions(ins.actions, 'nuevo'); noJunk(ins.lines, 'nuevo');
  assert.strictEqual(T.getTodayPick(T.computeDiagnosis(undefined, null)).href, 'plan-estudio.html', 'sin diagnóstico, hoy toca el Plan');
});

test('pocos datos: sesión de 2 respuestas o solo Speaking no muestra análisis', ()=>{
  assert.strictEqual(finish([], 'gramatica', answers(IDS.prep, 2, 50)), null);
  assert.strictEqual(finish([], 'speaking', [{ itemId:'x', isCorrect:null }, { itemId:'y', isCorrect:null }, { itemId:'z', isCorrect:null }]), null);
  assert.strictEqual(finish([], 'toefl-reading', answers(['toefl-1','toefl-2','toefl-3','toefl-4'], 4, 50)), null, 'exámenes: banco propio, sin análisis');
});

test('mejora: "Tu Listening mejoró respecto a tus sesiones anteriores" con % reales', ()=>{
  const hist = [session('listening', 10, answers(IDS.lis, 12, 50)), session('listening', 5, answers(IDS.lis, 8, 50, 12))];
  const ins = finish(hist, 'listening', answers(IDS.lis, 8, 100, 30));
  assert(ins.improved && ins.improved.key === 'skill:listening');
  assert(ins.lines.some(l => l.text === 'Tu Listening mejoró respecto a tus sesiones anteriores: 100% hoy, 50% antes.'), JSON.stringify(ins.lines));
  assert(ins.lines[0].text === 'Sesión perfecta: 8 de 8 correctas.');
  checkActions(ins.actions, 'mejora');
});

test('mejora en un tema de gramática: nombra la familia, no "Gramática"', ()=>{
  const hist = [session('gramatica', 12, answers(IDS.pasado, 10, 40))];
  const ins = finish(hist, 'gramatica', answers(IDS.pasado, 6, 100, 10));
  assert(ins.lines.some(l => l.text === 'Hoy mejoraste en Pasado simple: 100% de aciertos, antes ibas en 40%.'), JSON.stringify(ins.lines));
});

test('retroceso: "Hoy te costó más X que de costumbre" y acción para practicarlo', ()=>{
  const hist = [session('listening', 8, answers(IDS.lis, 12, 92))];
  const ins = finish(hist, 'listening', answers(IDS.lis, 6, 33, 20));
  assert(ins.lines.some(l => l.tone === 'down' && /Hoy te costó más Listening que de costumbre: 33% hoy, 92% antes/.test(l.text)), JSON.stringify(ins.lines));
  assert.strictEqual(ins.actions[0].href, 'listening.html');
  checkActions(ins.actions, 'retroceso');
});

test('errores repetidos: "Sigues fallando con Preposiciones" y repaso rápido', ()=>{
  const four = IDS.prep.slice(0, 4);
  const hist = [session('gramatica', 3, four.map(id => ({ itemId:id, isCorrect:false })))];
  const ins = finish(hist, 'gramatica', four.map(id => ({ itemId:id, isCorrect:false })).concat(answers(IDS.tobe, 4, 100)));
  assert.strictEqual(ins.repeated, 4);
  assert(ins.lines.some(l => l.text === 'Sigues fallando con Preposiciones: 4 errores hoy.'), JSON.stringify(ins.lines));
  assert(ins.actions.some(a => a.href === 'errores.html?modo=rapido'));
  checkActions(ins.actions, 'repetidos');
});

test('errores recuperados: cuenta los que antes falló y hoy acertó', ()=>{
  const two = IDS.prep.slice(0, 2);
  const hist = [session('gramatica', 2, two.map(id => ({ itemId:id, isCorrect:false })))];
  const ins = finish(hist, 'errores', two.map(id => ({ itemId:id, isCorrect:true })).concat(answers(IDS.tobe, 3, 100)));
  assert.strictEqual(ins.recovered, 2);
  assert(ins.lines.some(l => l.text === 'Corregiste 2 ejercicios que antes habías fallado.'));
});

test('sesión perfecta: lo dice, no inventa problemas y no ofrece gastar Leo AI', ()=>{
  const ins = finish([], 'vocabulario', answers(IDS.voc, 8, 100));
  assert.strictEqual(ins.lines[0].text, 'Sesión perfecta: 8 de 8 correctas.');
  assert(!ins.struggle && !ins.actions.some(a => /repaso/i.test(a.title)));
  assert.strictEqual(T.sessionInsightAiCtx(ins), null, 'sesión perfecta sin cambios: sin botón de IA');
  checkActions(ins.actions, 'perfecta');
});

test('sesión con muchos errores: dificultad principal, máximo 3 frases y 3 acciones', ()=>{
  const res = answers(IDS.prep, 6, 0).concat(answers(IDS.pasado, 6, 17)).concat(answers(IDS.lis, 6, 0));
  const ins = finish([], 'mixto', res);
  assert(ins.lines.length <= 3 && ins.actions.length <= 3);
  assert(ins.struggle && ins.struggle.wrong === 6);
  checkActions(ins.actions, 'muchos'); noJunk(ins.lines, 'muchos');
  const ai = T.sessionInsightAiCtx(ins);
  assert(ai && ai.scope === 'session' && ai.examples.length <= 3 && ai.examples.length >= 1);
});

test('después de un Plan, no recomienda "Hacer tu plan de hoy" otra vez', ()=>{
  const ins = finish([], 'plan', answers(IDS.voc, 6, 100));
  assert(!ins.actions.some(a => a.href === 'plan-estudio.html?empezar=1'));
});

test('"Hoy te conviene": prioridad errores dispersos > punto débil > retroceso > consolidar > olvidado', ()=>{
  // Errores repetidos en Listening (no en el punto débil de gramática): primero repasar errores.
  const s = [];
  const lisBad = IDS.lis.slice(0, 3);
  for(let k=0; k<2; k++) s.push(session('listening', 5 - k, lisBad.map(id => ({ itemId:id, isCorrect:false })).concat(answers(IDS.lis, 6, 100, 10 + k*6))));
  s.push(session('gramatica', 1, answers(IDS.prep, 10, 30)));
  setProgress(s);
  let d = T.computeDiagnosis(undefined, null);
  assert.strictEqual(d.today.href, 'errores.html?modo=rapido', JSON.stringify(d.actions.map(a=>a.title)));
  assert.strictEqual(d.actions[1].title, 'Reforzar Preposiciones');
  // Solo punto débil: va primero y empieza directo en el Plan con foco.
  setProgress([session('gramatica', 1, answers(IDS.prep, 10, 30)), session('vocabulario', 1, answers(IDS.voc, 10, 100))]);
  d = T.computeDiagnosis(undefined, null);
  assert.strictEqual(d.today.title, 'Reforzar Preposiciones');
  assert.strictEqual(T.todayStartHref(d.today), 'plan-estudio.html?foco=preposiciones&empezar=1');
  // Todo bien: el Plan de siempre.
  setProgress([session('vocabulario', 1, answers(IDS.voc, 20, 100))]);
  d = T.computeDiagnosis(undefined, null);
  assert(d.today && hrefExists(d.today.href));
  d.actions.forEach(a => assert(hrefExists(a.href)));
});

test('semana sin actividad: "Hoy te conviene" sugiere volver a lo olvidado o al Plan, nunca vacío', ()=>{
  setProgress([session('gramatica', 20, answers(IDS.tobe, 12, 70)), session('listening', 19, answers(IDS.lis, 12, 72))]);
  const d = T.computeDiagnosis(undefined, null);
  assert(d.ready && d.today, 'siempre hay una recomendación principal');
  assert(hrefExists(d.today.href));
  const ins = finish([session('gramatica', 20, answers(IDS.tobe, 12, 70))], 'gramatica', answers(IDS.tobe, 5, 80));
  assert(!ins.improved, 'datos de hace 20 días no alcanzan para comparar con poca muestra');
});

test('Mis errores: agrupa por familia/habilidad, cuenta repetidos y enlaza a contenido real', ()=>{
  const map = new Map();
  IDS.prep.slice(0, 5).forEach((id, i) => map.set(id, { item_id:id, status:'active', fail_count: i < 3 ? 3 : 1 }));
  IDS.lis.slice(0, 2).forEach(id => map.set(id, { item_id:id, status:'active', fail_count:1 }));
  map.set(IDS.pasado[0], { item_id:IDS.pasado[0], status:'recovered', fail_count:2 });
  const pat = T.computeMistakePatterns(map);
  assert.strictEqual(pat.total, 7); assert.strictEqual(pat.repeatedTotal, 3);
  assert.strictEqual(pat.groups[0].label, 'Preposiciones'); assert.strictEqual(pat.groups[0].count, 5); assert.strictEqual(pat.groups[0].repeated, 3);
  assert.strictEqual(pat.groups[1].reviewHref, 'errores.html?skill=listening');
  pat.groups.forEach(g => { assert(hrefExists(g.content.practiceHref)); if(g.content.article) assert(hrefExists(g.content.article)); });
  const ai = T.mistakePatternsAiCtx(pat);
  assert(ai.facts.length >= 2 && ai.examples.length >= 1 && ai.examples.length <= 4);
  assert(ai.examples.every(e => / → /.test(e)), 'cada ejemplo es "pregunta → respuesta correcta"');
  noJunk(ai, 'patrones');
  // Sin red (statsMap null): usa la misma regla que Mis errores.
  setProgress([session('gramatica', 1, IDS.prep.slice(0, 3).map(id => ({ itemId:id, isCorrect:false })))]);
  assert.strictEqual(T.computeMistakePatterns(null).total, 3);
  // Con 2 errores no hay análisis.
  assert.strictEqual(T.mistakePatternsAiCtx(T.computeMistakePatterns(new Map([[IDS.prep[0], { item_id:IDS.prep[0], status:'active', fail_count:1 }]]))), null);
});

test('Leo AI: el resumen de progreso es compacto (sin historial) y el payload sale igual de chico', ()=>{
  const s = [];
  for(let k=0; k<120; k++) s.push(session(['gramatica','listening','vocabulario'][k%3], k % 30, answers([IDS.prep, IDS.lis, IDS.voc][k%3], 10, 40 + (k%5)*12, k)));
  setProgress(s);
  const d = T.computeDiagnosis(undefined, null), w = T.computeWeeklyReport(d);
  const ai = T.progressAiCtx(d, w);
  assert(ai && ai.facts.length >= 3 && ai.facts.length <= 10);
  const payload = T.buildLeoAiPayload(ai);
  assert.strictEqual(payload.mode, 'insight'); assert.strictEqual(payload.scope, 'progress');
  const size = JSON.stringify(payload).length;
  assert(size < 1500, 'payload de 1.200 respuestas en ' + size + ' caracteres');
  assert(!/itemId|sessions|results/.test(JSON.stringify(payload)), 'nunca manda el historial');
  noJunk(payload, 'progreso');
  assert.strictEqual(T.buildLeoAiPayload({ kind:'insight', scope:'progress', facts:['uno'] }), null, 'con 1 dato no hay botón');
  assert.strictEqual(T.buildLeoAiPayload({ kind:'insight', scope:'otro', facts:['a','b'] }), null);
});

test('caché de análisis: mismos datos = misma respuesta sin llamar; máximo 12 guardadas', ()=>{
  const res = { ok:true, answer:{ explanation:'x', tip:'y' } };
  T.leoAiInsightCacheSet('{"a":1}', res);
  assert.deepStrictEqual(T.leoAiInsightCacheGet('{"a":1}'), res);
  assert.strictEqual(T.leoAiInsightCacheGet('{"a":2}'), null, 'si cambia un número, es otra clave');
  for(let i=0; i<20; i++) T.leoAiInsightCacheSet('{"k":' + i + '}', res);
  assert(Object.keys(JSON.parse(store['leo_ai_insight_cache_v1'])).length <= 12);
  // localStorage roto: no rompe nada.
  const orig = ctx.localStorage.getItem; ctx.localStorage.getItem = ()=>{ throw new Error('bloqueado'); };
  assert.strictEqual(T.leoAiInsightCacheGet('{"a":1}'), null);
  ctx.localStorage.getItem = orig;
});

test('mucho historial (400 sesiones): el análisis de una sesión es rápido', ()=>{
  const s = [];
  for(let k=0; k<400; k++) s.push(session(['gramatica','listening','vocabulario'][k%3], k % 60, answers([IDS.prep, IDS.lis, IDS.voc][k%3], 10, 60, k)));
  const t0 = Date.now();
  const ins = finish(s, 'gramatica', answers(IDS.prep, 10, 40, 3));
  const ms = Date.now() - t0;
  assert(ins && ms < 300, 'tardó ' + ms + ' ms');
  console.log('       (análisis de sesión con 4.000 respuestas en ' + ms + ' ms)');
});

console.log((failed ? failed + ' prueba(s) fallaron, ' : '') + passed + ' pruebas pasaron');
process.exit(failed ? 1 : 0);
