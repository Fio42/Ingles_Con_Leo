#!/usr/bin/env node
/* Pruebas del registro de temas (temas.js) y de su uso en app.js:
   cobertura de etiquetas, enlaces reales, familias, foco del Plan por tema
   y recomendaciones por tema en "Hoy te conviene".
   Corre con:  node tools/tests/temas.test.js   (desde la carpeta inglesconLeo)
   Usa el app.js y data.js REALES en un navegador simulado. No toca la red. */
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
;this.__t = { computeDiagnosis, contentForTema, computePlanSelection, buildPlanPool, todayStartHref,
  diagFamilyForTopic, DIAG_FAMILY_BY_ID, PROGRESS_KEY, G:GRAMMAR_BANK, ARTICLE_BY_TOPIC,
  TEMAS: typeof TEMAS === 'undefined' ? null : TEMAS, TEMA_BY_ID: typeof TEMA_BY_ID === 'undefined' ? null : TEMA_BY_ID };`, ctx);
  return ctx.__t;
}
const T = makeCtx(true);
let passed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; } }

const files = new Set(fs.readdirSync(root));
const glossaryOk = slug => fs.existsSync(path.join(root, 'glosario', slug, 'index.html'));

console.log('Registro de temas');
test('cada etiqueta de GRAMMAR_BANK tiene tema (tabla explícita)', ()=>{
  const missing = new Set();
  Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g=>{ if(!T.TEMAS.some(t => t.topics.includes(g.topic))) missing.add(g.topic); })));
  assert.deepStrictEqual([...missing], [], 'Etiquetas sin tema: ' + [...missing].join(' | '));
});
test('ninguna etiqueta está en dos temas y todas existen en data.js', ()=>{
  const real = new Set();
  Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g => real.add(g.topic))));
  const seen = new Map();
  T.TEMAS.forEach(t => t.topics.forEach(topic=>{
    assert(!seen.has(topic), `"${topic}" está en ${seen.get(topic)} y en ${t.id}`);
    seen.set(topic, t.id);
    assert(real.has(topic), `${t.id}: la etiqueta "${topic}" no existe en data.js`);
  }));
});
test('ids únicos y con formato válido', ()=>{
  const ids = T.TEMAS.map(t => t.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  ids.forEach(id => assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id), id));
});
test('la familia de cada tema coincide con la que ya usa el diagnóstico', ()=>{
  T.TEMAS.forEach(t => t.topics.forEach(topic=>{
    const fam = T.diagFamilyForTopic(topic);
    assert.strictEqual(fam ? fam.id : null, t.family, `${t.id} / "${topic}": familia ${t.family} vs ${fam && fam.id}`);
  }));
});
test('enlaces reales: artículos y glosario existen', ()=>{
  T.TEMAS.forEach(t=>{
    if(t.article) assert(files.has(t.article), `${t.id}: no existe ${t.article}`);
    if(t.glossary) assert(glossaryOk(t.glossary), `${t.id}: no existe /glosario/${t.glossary}/`);
  });
});
test('no contradice los artículos que ya tenía ARTICLE_BY_TOPIC', ()=>{
  Object.keys(T.ARTICLE_BY_TOPIC).forEach(topic=>{
    const t = T.TEMAS.find(x => x.topics.includes(topic));
    assert(t && t.article === T.ARTICLE_BY_TOPIC[topic], `${topic}: ${t && t.article} vs ${T.ARTICLE_BY_TOPIC[topic]}`);
  });
});
test('contentForTema: sin enlaces falsos y un solo enlace secundario', ()=>{
  T.TEMAS.filter(t => t.family).forEach(t=>{
    const c = T.contentForTema(t.id);
    assert(c && c.label === t.label, t.id);
    if(c.lesson) assert(files.has(c.lesson.href), t.id + ' lesson');
    if(c.quick) assert(glossaryOk(c.quick.href.split('/')[2]), t.id + ' quick');
    assert(!(c.lesson && c.quick), t.id + ': solo un enlace secundario');
    assert(/^plan-estudio\.html\?foco=/.test(c.practiceHref) || c.practiceHref === 'gramatica.html', t.id + ' ' + c.practiceHref);
  });
  assert.strictEqual(T.contentForTema('no-existe'), null);
});

/* ---------- recorrido: debilidad -> tema -> clase -> práctica -> mejora ---------- */
const DAY = 86400000, NOW = Date.now();
const dateStr = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
function itemsOfTema(TT, id, level){
  const t = TT.TEMA_BY_ID[id], out = [];
  Object.keys(TT.G).filter(l => !level || l === level).forEach(l => TT.G[l].forEach(v => v.forEach(g=>{ if(t.topics.includes(g.topic)) g.items.forEach(i => out.push(i.id)); })));
  return out;
}
function itemsOfFamily(TT, fid, level){
  const out = [];
  Object.keys(TT.G).filter(l => !level || l === level).forEach(l => TT.G[l].forEach(v => v.forEach(g=>{ const f = TT.diagFamilyForTopic(g.topic); if(f && f.id === fid) g.items.forEach(i => out.push(i.id)); })));
  return out;
}
function answers(ids, n, pctOk, offset){
  const out = [];
  for(let i=0; i<n; i++){ const ok = Math.round((i+1) * pctOk / 100) > Math.round(i * pctOk / 100); out.push({ itemId: ids[(i + (offset||0)) % ids.length], isCorrect: ok }); }
  return out;
}
function session(daysAgo, results){
  const t = NOW - daysAgo * DAY;
  return { skill:'gramatica', level:'facil', topics:[], date: dateStr(t), startedAt: t, durationMs: 240000, results };
}
function setProgress(TT, sessions){ store[TT.PROGRESS_KEY] = JSON.stringify({ sessions, lastActivity:null }); }
const hrefOk = href => {
  if(/^\/glosario\//.test(href)) return glossaryOk(href.split('/')[2]);
  return files.has(href.split('?')[0].split('#')[0]);
};
function checkAction(a){
  if(a.article) assert(hrefOk(a.article), 'enlace inexistente: ' + a.article);
  assert(hrefOk(a.href), 'href inexistente: ' + a.href);
}
function readyDiag(TT){ const d = TT.computeDiagnosis(); assert(d.ready, 'diagnóstico no listo'); return d; }

console.log('\nRecorrido por tema');
const irr = itemsOfTema(T, 'verbos-irregulares', 'facil');
const reg = itemsOfTema(T, 'pasado-regulares', 'facil');
test('hay ejercicios de verbos irregulares y regulares en el nivel de prueba', ()=>{ assert(irr.length >= 4 && reg.length >= 4); });

function weakIrregularHistory(days){ const d = days || [2, 1]; return [ session(d[0], answers(irr.slice(0, 3), 10, 20)), session(d[1], answers(reg, 10, 90)) ]; }
test('falla en verbos irregulares -> el diagnóstico señala ese tema dentro de Pasado simple', ()=>{
  setProgress(T, weakIrregularHistory());
  const d = readyDiag(T);
  assert.strictEqual(d.weak.id, 'pasado');
  assert.strictEqual(d.weak.focusTema.id, 'verbos-irregulares');
  assert.strictEqual(d.weak.focusTema.n, 10);
});
test('"Hoy te conviene": Practicar el tema + Ver la clase real', ()=>{
  const a = T.computeDiagnosis().today;
  assert(/Verbos irregulares/.test(a.title), a.title);
  assert(/foco=pasado&tema=verbos-irregulares/.test(a.href), a.href);
  assert.strictEqual(a.article, 'articulo-verbos-irregulares.html');
  assert.strictEqual(a.articleLabel, 'Ver la clase');
  assert(/foco=pasado&tema=verbos-irregulares&empezar=1/.test(T.todayStartHref(a)));
  checkAction(a);
});
test('Plan con ?foco&tema: el refuerzo prioriza los ejercicios del tema', ()=>{
  const sel = T.computePlanSelection('facil', 12, { focusFamily:'pasado', focusTema:'verbos-irregulares' });
  assert.strictEqual(sel.focus.temaId, 'verbos-irregulares');
  assert.strictEqual(sel.focus.label, 'Verbos irregulares en pasado');
  const pool = T.buildPlanPool('facil', sel);
  const focusIds = pool.filter(e => e.focus).map(e => e.item.id);
  const inMistakes = new Set(pool.filter(e => e.reviewOrigin).map(e => e.item.id));
  // Los ejercicios del tema que siguen disponibles (no son errores ya incluidos)
  // deben entrar al refuerzo antes que cualquier otro de la familia.
  const available = irr.filter((id, i) => i >= 3 && !inMistakes.has(id)); // los 3 primeros son los que el alumno falló
  assert(available.length >= 1, 'la prueba no tiene ejercicios disponibles del tema');
  assert(focusIds.length >= available.length, 'pocos ejercicios de refuerzo: ' + focusIds.length);
  available.forEach(id => assert(focusIds.includes(id), 'falta un ejercicio del tema en el refuerzo: ' + id));
});
test('compatibilidad: ?foco=<familia> sin tema sigue igual', ()=>{
  const sel = T.computePlanSelection('facil', 12, { focusFamily:'preposiciones' });
  assert.strictEqual(sel.focus.familyId, 'preposiciones');
  assert.strictEqual(sel.focus.temaId, null);
  assert.strictEqual(sel.focus.label, 'Preposiciones');
});
test('tema de otra familia o inexistente se ignora', ()=>{
  [{ focusFamily:'pasado', focusTema:'in-on-at' }, { focusFamily:'pasado', focusTema:'inventado' }].forEach(o=>{
    const sel = T.computePlanSelection('facil', 12, o);
    assert.strictEqual(sel.focus.familyId, 'pasado');
    assert.strictEqual(sel.focus.temaId, null);
  });
});
test('solo ?tema= deduce la familia', ()=>{
  const sel = T.computePlanSelection('facil', 12, { focusTema:'verbos-irregulares' });
  assert.strictEqual(sel.focus.familyId, 'pasado');
  assert.strictEqual(sel.focus.temaId, 'verbos-irregulares');
});
test('tema sin ejercicios en el nivel: se practica la familia, nunca vacío', ()=>{
  const sel = T.computePlanSelection('principiante', 12, { focusFamily:'pasado', focusTema:'verbos-irregulares' });
  assert(!sel.focus || sel.focus.temaId === null);
});
test('el Plan sin foco en la URL sigue al tema que detectó el diagnóstico', ()=>{
  const sel = T.computePlanSelection('facil', 12, {});
  assert.strictEqual(sel.focus.familyId, 'pasado');
  assert.strictEqual(sel.focus.temaId, 'verbos-irregulares');
});
test('mide mejora: al practicar y acertar el tema, la recomendación cambia', ()=>{
  const hist = weakIrregularHistory([12, 11]);
  hist.push(session(0, answers(irr, 14, 100, 3)));
  setProgress(T, hist);
  const d = T.computeDiagnosis();
  const ts = d.units.find(u => u.key === 'family:pasado').temaStats.find(s => s.id === 'verbos-irregulares');
  assert(ts.current >= 75 && ts.trend === 'up', 'el tema no refleja la mejora: ' + ts.current + ' ' + ts.trend);
  assert(!d.today || !/Verbos irregulares/.test(d.today.title), 'sigue recomendando el tema que ya mejoró: ' + (d.today && d.today.title));
});
test('tema sin clase y con glosario -> "Ver explicación rápida" (enlace real)', ()=>{
  const its = itemsOfTema(T, 'its-vs-its', 'facil');
  const conf = itemsOfFamily(T, 'confusiones', 'facil').filter(i => !its.includes(i));
  setProgress(T, [ session(2, answers(its, 10, 10)), session(1, answers(conf, 10, 90)) ]);
  const d = readyDiag(T);
  assert.strictEqual(d.weak.id, 'confusiones');
  assert.strictEqual(d.weak.focusTema.id, 'its-vs-its');
  assert.strictEqual(d.today.article, '/glosario/its-vs-it-s/');
  assert.strictEqual(d.today.articleLabel, 'Ver explicación rápida');
  checkAction(d.today);
});
test('tema sin clase ni glosario -> solo Practicar, ningún enlace inventado', ()=>{
  const qw = itemsOfTema(T, 'question-words', 'facil');
  const bases = itemsOfFamily(T, 'bases', 'facil').filter(i => !qw.includes(i));
  setProgress(T, [ session(2, answers(qw, 10, 10)), session(1, answers(bases, 10, 90)) ]);
  const d = readyDiag(T);
  assert.strictEqual(d.weak.focusTema && d.weak.focusTema.id, 'question-words');
  assert(!d.today.article, 'no debe haber enlace: ' + d.today.article);
  checkAction(d.today);
});
test('todas las acciones de cualquier familia débil apuntan a recursos reales', ()=>{
  let probed = 0;
  Object.keys(T.DIAG_FAMILY_BY_ID).forEach(fid=>{
    const ids = itemsOfFamily(T, fid, 'facil');
    if(ids.length < 4) return;
    setProgress(T, [ session(2, answers(ids, 12, 15)), session(1, answers(ids, 8, 20, 5)) ]);
    const d = T.computeDiagnosis();
    if(!d.ready) return;
    probed++;
    d.actions.forEach(checkAction);
  });
  assert(probed >= 8, 'se probaron pocas familias: ' + probed);
});

console.log('\nSin temas.js (compatibilidad)');
const T0 = makeCtx(false);
test('sin el registro todo funciona por familias, sin errores', ()=>{
  setProgress(T0, weakIrregularHistory());
  const d = T0.computeDiagnosis();
  assert(d.ready && d.weak.id === 'pasado');
  assert(!d.weak.focusTema);
  assert(!/tema=/.test(d.today.href), d.today.href);
  assert.strictEqual(T0.contentForTema('verbos-irregulares'), null);
  const sel = T0.computePlanSelection('facil', 12, { focusFamily:'pasado', focusTema:'verbos-irregulares' });
  assert.strictEqual(sel.focus.temaId, null);
  assert.strictEqual(sel.focus.familyId, 'pasado');
});

console.log(`\n${passed} pruebas correctas`);
