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
  diagFamilyForTopic, DIAG_FAMILY_BY_ID, PROGRESS_KEY, G:GRAMMAR_BANK, articleForTopic, diagUnitRowHtml, computeMistakePatterns, mistakePatternsAiCtx, progressAiCtx, sessionInsightAiCtx,
  computeSessionInsight, buildLeoAiPayload, leoAiFocusLink, temaLinksHtml, computeWeeklyReport,
  TEMAS: typeof TEMAS === 'undefined' ? null : TEMAS, TEMA_BY_ID: typeof TEMA_BY_ID === 'undefined' ? null : TEMA_BY_ID };`, ctx);
  return ctx.__t;
}
const T = makeCtx(true);
let passed = 0;
const eq = (a, b, m) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, m); // los objetos del navegador simulado vienen de otro contexto
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


/* ================= FASE 2: diagnóstico, Mis errores y Leo AI ================= */
console.log('\nFase 2: una sola fuente, Leo AI solo complementa');
function weakIrrDiag(){ setProgress(T, weakIrregularHistory()); return readyDiag(T); }
const familyUnit = (d, fid) => d.units.find(u => u.key === 'family:' + fid);
const linksIn = html => (html.match(/<a [^>]*href="[^"]+"/g) || []).map(a => a.match(/href="([^"]+)"/)[1]);

test('prerrequisitos del registro: existen, sin ciclos ni auto-referencias', ()=>{
  T.TEMAS.forEach(t => (t.prereq || []).forEach(id=>{
    assert(T.TEMA_BY_ID[id], `${t.id}: prereq inexistente ${id}`);
    assert(id !== t.id, t.id + ' se pide a sí mismo');
  }));
  const visit = (id, path)=>{ assert(!path.includes(id), 'ciclo de prerrequisitos: ' + path.concat(id).join(' > ')); ((T.TEMA_BY_ID[id].prereq) || []).forEach(p => visit(p, path.concat(id))); };
  T.TEMAS.forEach(t => visit(t.id, []));
});
test('Mis errores usa el registro (articleForTopic) y no perdió ningún artículo anterior', ()=>{
  const antes = { 'Preguntas con Do/Does en presente simple':'articulo-do-vs-does.html', 'Do / Does':'articulo-do-vs-does.html', 'Presente simple y "to be"':'articulo-presente-simple.html',
    'Verbo "to be": am / is / are':'articulo-verbo-to-be.html', '"To be" en pasado: was / were':'articulo-verbo-to-be.html', 'Pasado simple con verbos regulares (-ed)':'articulo-pasado-simple.html',
    'Present Perfect vs Past Simple':'articulo-presente-perfecto.html', 'Phrasal verbs comunes (look for / give up / find out)':'articulo-phrasal-verbs.html',
    'Los números (1-10)':'articulo-numeros-en-ingles.html', 'Números parecidos que confunden (13 vs 30, 14 vs 40...)':'articulo-numeros-en-ingles.html', 'In / On / At':'articulo-in-on-at.html' };
  Object.keys(antes).forEach(t => assert.strictEqual(T.articleForTopic(t), antes[t], t));
  assert.strictEqual(T.articleForTopic('Etiqueta que no existe'), null);
  assert.strictEqual(T.articleForTopic('Pasado simple con verbos irregulares'), 'articulo-verbos-irregulares.html');
});
test('diagnóstico con evidencia de tema: "Dentro de X..." + máx. 2 acciones (practicar + clase)', ()=>{
  const d = weakIrrDiag();
  const html = T.diagUnitRowHtml(familyUnit(d, 'pasado'));
  assert(/Dentro de Pasado simple, lo que más necesitas reforzar es <b>Verbos irregulares en pasado<\/b>/.test(html), html);
  const links = linksIn(html);
  assert.deepStrictEqual(links, ['plan-estudio.html?foco=pasado&tema=verbos-irregulares&empezar=1', 'articulo-verbos-irregulares.html']);
  links.forEach(h => assert(hrefOk(h), h));
  assert(/Ver la clase/.test(html));
});
test('diagnóstico: si el tema ya es el de "Hoy te conviene" no se repite el enlace', ()=>{
  const d = weakIrrDiag();
  const html = T.diagUnitRowHtml(familyUnit(d, 'pasado'), 'verbos-irregulares');
  assert(/lo que más necesitas reforzar es/.test(html)); assert.deepStrictEqual(linksIn(html), []);
});
test('diagnóstico con tema sin clase pero con glosario: practicar + explicación rápida', ()=>{
  const its = itemsOfTema(T, 'its-vs-its', 'facil');
  const conf = itemsOfFamily(T, 'confusiones', 'facil').filter(i => !its.includes(i));
  setProgress(T, [ session(2, answers(its, 10, 10)), session(1, answers(conf, 10, 90)) ]);
  const html = T.diagUnitRowHtml(familyUnit(readyDiag(T), 'confusiones'));
  const links = linksIn(html);
  assert.strictEqual(links.length, 2); assert.strictEqual(links[1], '/glosario/its-vs-it-s/'); assert(/Ver explicación rápida/.test(html));
});
test('diagnóstico con tema sin clase ni glosario: solo practicar', ()=>{
  const qw = itemsOfTema(T, 'question-words', 'facil');
  const bases = itemsOfFamily(T, 'bases', 'facil').filter(i => !qw.includes(i));
  setProgress(T, [ session(2, answers(qw, 10, 10)), session(1, answers(bases, 10, 90)) ]);
  assert.strictEqual(linksIn(T.diagUnitRowHtml(familyUnit(readyDiag(T), 'bases'))).length, 1);
});
test('diagnóstico SIN datos suficientes de un tema: solo la familia, como antes', ()=>{
  const pas = itemsOfFamily(T, 'pasado', 'facil');
  setProgress(T, [ session(2, pas.map(id => ({ itemId:id, isCorrect:false })).slice(0, 3)), session(1, answers(itemsOfFamily(T, 'presente-simple', 'facil'), 12, 90)) ]);
  const d = T.computeDiagnosis();
  const u = familyUnit(d, 'pasado');
  if(u){ assert(!u.focusTema, 'no debería señalar tema con tan poca evidencia'); assert(!/Dentro de/.test(T.diagUnitRowHtml(u))); }
  if(d.today) assert(!d.today.tema);
});
test('diagnóstico: una familia que va bien no muestra la línea del tema', ()=>{
  setProgress(T, [ session(2, answers(itemsOfFamily(T, 'pasado', 'facil'), 12, 95)), session(1, answers(itemsOfFamily(T, 'pasado', 'facil'), 12, 95, 2)) ]);
  const d = readyDiag(T);
  assert(!/Dentro de/.test(T.diagUnitRowHtml(familyUnit(d, 'pasado'))));
});

// ---- Mis errores
function mistakeStats(ids, fails){ const m = new Map(); ids.forEach(id => m.set(id, { item_id:id, status:'active', fail_count:fails || 2 })); return m; }
test('Mis errores con topic_id válido: práctica del tema + clase, usando el registro', ()=>{
  setProgress(T, weakIrregularHistory());
  const pat = T.computeMistakePatterns(mistakeStats(irr.slice(0, 3)));
  const g = pat.groups[0];
  assert.strictEqual(g.key, 'family:pasado');
  assert.strictEqual(g.temaContent.id, 'verbos-irregulares');
  assert.deepStrictEqual(linksIn(T.temaLinksHtml(g.temaContent, 'Reforzar en mi Plan')), ['plan-estudio.html?foco=pasado&tema=verbos-irregulares&empezar=1', 'articulo-verbos-irregulares.html']);
});
test('Mis errores con tema sin recurso extra: solo práctica', ()=>{
  const qw = itemsOfTema(T, 'question-words', 'facil');
  setProgress(T, [ session(1, answers(qw, 6, 0)) ]);
  const g = T.computeMistakePatterns(mistakeStats(qw.slice(0, 3))).groups[0];
  assert.strictEqual(g.temaContent.id, 'question-words');
  assert.strictEqual(linksIn(T.temaLinksHtml(g.temaContent)).length, 1);
});

// ---- Leo AI
const noUrls = o => { const j = JSON.stringify(o); assert(!/https?:|\.html|\/glosario|plan-estudio/.test(j), 'el payload no debe llevar URLs: ' + j); };
test('Leo AI (errores): manda lo ya mostrado + máx. 3 temas válidos, sin "next", sin URLs, sin repetir el tema de la tarjeta', ()=>{
  setProgress(T, weakIrregularHistory());
  const ctx = T.mistakePatternsAiCtx(T.computeMistakePatterns(mistakeStats(irr.slice(0, 3))));
  const payload = T.buildLeoAiPayload(ctx);
  assert.strictEqual(payload.mode, 'insight'); assert(!('next' in payload));
  assert(payload.shown.includes('Verbos irregulares en pasado'));
  assert(payload.candidates.length >= 1 && payload.candidates.length <= 3);
  assert(!payload.candidates.some(c => c.id === 'verbos-irregulares'), 'no ofrece el tema que la página ya muestra');
  assert(payload.candidates.some(c => c.id === 'pasado-regulares'), 'ofrece el prerrequisito');
  payload.candidates.forEach(c => { assert(T.TEMA_BY_ID[c.id] && T.TEMA_BY_ID[c.id].label === c.label); });
  noUrls(payload);
  assert(payload.facts.length <= 5 && payload.examples.length <= 3);
});
test('Leo AI: un candidato desconocido que llegue en el contexto nunca se manda', ()=>{
  const payload = T.buildLeoAiPayload({ kind:'insight', scope:'mistakes', facts:['a','b'], candidates:['inventado', 'pasado-regulares', '<script>'], shown:[] });
  eq(payload.candidates.map(c => c.id), ['pasado-regulares']);
});
test('Leo AI (progreso): lo ya mostrado es el tema de "Hoy te conviene" y no hay "next"', ()=>{
  const d = weakIrrDiag();
  const payload = T.buildLeoAiPayload(T.progressAiCtx(d, T.computeWeeklyReport(d)));
  eq(payload.shown, ['Verbos irregulares en pasado']);
  assert(!('next' in payload)); noUrls(payload);
  assert(JSON.stringify(payload).length < 1100, 'payload compacto: ' + JSON.stringify(payload).length);
});
const PAY = { candidates:[{ id:'pasado-regulares', label:'Pasado simple (verbos regulares)' }, { id:'question-words', label:'Palabras de pregunta (what, where, when, who)' }], shown:['Verbos irregulares en pasado'] };
test('Leo AI devuelve un topic_id inventado: no se muestra ningún enlace', ()=>{
  ['verbos-irregulares-2', 'http://x.com', '', 'none', undefined, 'in-on-at'].forEach(id => assert.strictEqual(T.leoAiFocusLink(PAY, { focus_topic:id, focus_action:'lesson' }), null, String(id)));
});
test('Leo AI devuelve el MISMO tema que ya muestra la tarjeta: no se duplica', ()=>{
  assert.strictEqual(T.leoAiFocusLink(PAY, { focus_topic:'verbos-irregulares', focus_action:'practice' }), null);
  const pay2 = { candidates:[{ id:'verbos-irregulares', label:'Verbos irregulares en pasado' }], shown:['Verbos irregulares en pasado'] };
  assert.strictEqual(T.leoAiFocusLink(pay2, { focus_topic:'verbos-irregulares', focus_action:'practice' }), null, 'aunque estuviera en la lista, el nombre mostrado manda');
});
test('Leo AI sugiere un tema válido: el enlace sale del registro (clase o práctica)', ()=>{
  let f = T.leoAiFocusLink(PAY, { focus_topic:'pasado-regulares', focus_action:'lesson' });
  eq(f, { href:'articulo-pasado-simple.html', text:'Ver la clase: Pasado simple (verbos regulares)' }); assert(hrefOk(f.href));
  f = T.leoAiFocusLink(PAY, { focus_topic:'pasado-regulares', focus_action:'practice' });
  assert.strictEqual(f.text, 'Practicar Pasado simple (verbos regulares)'); assert(/^plan-estudio\.html\?foco=pasado&tema=pasado-regulares/.test(f.href));
  f = T.leoAiFocusLink(PAY, { focus_topic:'question-words', focus_action:'lesson' });
  assert(/^Practicar /.test(f.text) && hrefOk(f.href), 'pide lesson pero no hay clase: practicar, nunca un enlace inventado');
});
test('Leo AI: los mismos datos dan el mismo payload (misma clave de caché, 0 llamadas nuevas)', ()=>{
  setProgress(T, weakIrregularHistory());
  const mk = () => T.buildLeoAiPayload(T.mistakePatternsAiCtx(T.computeMistakePatterns(mistakeStats(irr.slice(0, 3)))));
  assert.strictEqual(JSON.stringify(mk()), JSON.stringify(mk()));
});
test('sesión: si los fallos son de un tema, las acciones del final salen del registro', ()=>{
  const results = answers(irr.slice(0, 3), 6, 0).concat(answers(reg, 4, 100));
  const s = session(0, results);
  setProgress(T, weakIrregularHistory([12, 11]).concat([s]));
  const ins = T.computeSessionInsight(results, s.startedAt, 'gramatica');
  assert.strictEqual(ins.struggleTema, 'verbos-irregulares');
  const hrefs = ins.actions.map(a => a.href);
  assert(hrefs.some(h => /tema=verbos-irregulares/.test(h)) && hrefs.includes('articulo-verbos-irregulares.html'), hrefs.join(' | '));
  ins.actions.forEach(a => assert(hrefOk(a.href), a.href));
  const ctx = T.sessionInsightAiCtx(ins);
  if(ctx) eq(ctx.shown, ['Verbos irregulares en pasado']);
});
test('sin temas.js: Leo AI y Mis errores funcionan como antes (sin candidatos, sin enlaces de tema)', ()=>{
  setProgress(T0, weakIrregularHistory());
  const pat = T0.computeMistakePatterns(mistakeStats(irr.slice(0, 3)));
  assert(pat.groups[0] && !pat.groups[0].temaContent);
  const payload = T0.buildLeoAiPayload(T0.mistakePatternsAiCtx(pat));
  eq(payload.candidates, []);
  assert.strictEqual(T0.leoAiFocusLink(payload, { focus_topic:'pasado-regulares', focus_action:'lesson' }), null);
  assert.strictEqual(T0.articleForTopic('In / On / At'), null);
});

console.log(`\n${passed} pruebas correctas`);
