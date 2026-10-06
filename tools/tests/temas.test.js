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
  diagFamilyForTopic, DIAG_FAMILY_BY_ID, PROGRESS_KEY, G:GRAMMAR_BANK, V:VOCAB_BANK, hasLocalAccountHint, todayGrammarTema: typeof todayGrammarTema === 'undefined' ? null : todayGrammarTema, leoAiTemaPool, GTS: typeof GRAMMAR_TOPICS_SIN_TEMA === 'undefined' ? [] : GRAMMAR_TOPICS_SIN_TEMA, LEX: typeof LISTENING_EXCLUIDOS === 'undefined' ? [] : LISTENING_EXCLUIDOS, temaForTopic: typeof temaForTopic === 'undefined' ? null : temaForTopic, W:WRITING_BANK, WTB: typeof WRITING_TEMA_BY_ITEM === 'undefined' ? {} : WRITING_TEMA_BY_ITEM, temaForWritingItem: typeof temaForWritingItem === 'undefined' ? null : temaForWritingItem, L:LISTENING_BANK, temaForListeningItem: typeof temaForListeningItem === 'undefined' ? null : temaForListeningItem, temaHasItemsAt, VGS: typeof VOCAB_GRUPOS_SIN_TEMA === 'undefined' ? [] : VOCAB_GRUPOS_SIN_TEMA, diagSkillsHtml, vocabGroupOf: typeof vocabGroupOf === 'undefined' ? null : vocabGroupOf, articleForTopic, diagUnitRowHtml, computeMistakePatterns, mistakePatternsAiCtx, progressAiCtx, sessionInsightAiCtx,
  computeSessionInsight, renderArticleTema, buildLeoAiPayload, leoAiFocusLink, temaLinksHtml, computeWeeklyReport,
  TEMAS: typeof TEMAS === 'undefined' ? null : TEMAS, TEMA_BY_ID: typeof TEMA_BY_ID === 'undefined' ? null : TEMA_BY_ID };`, ctx);
  return ctx.__t;
}
const T = makeCtx(true);
let passed = 0;
const VIA = id => '?tema=' + id + '&via=rec';
const eq = (a, b, m) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b, m); // los objetos del navegador simulado vienen de otro contexto
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; } }

const files = new Set(fs.readdirSync(root));
const glossaryOk = slug => fs.existsSync(path.join(root, 'glosario', slug, 'index.html'));

console.log('Registro de temas');
test('cada etiqueta de GRAMMAR_BANK tiene tema (tabla explícita)', ()=>{
  const missing = new Set();
  Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g=>{ if(!T.TEMAS.some(t => t.topics.includes(g.topic)) && !T.GTS.includes(g.topic)) missing.add(g.topic); })));
  assert.deepStrictEqual([...missing], [], 'Etiquetas sin tema: ' + [...missing].join(' | '));
});
test('repasos mezclados: ya no quedan etiquetas sin tema (cada bloque de data.js es de un solo tema)', ()=>{
  assert.deepStrictEqual([...T.GTS], []);
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
    if(c.lesson) assert(files.has(c.lesson.href.split('?')[0]) && c.lesson.href.endsWith('?tema=' + t.id + '&via=rec'), t.id + ' lesson');
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
  assert.strictEqual(a.article, 'articulo-verbos-irregulares.html' + VIA('verbos-irregulares'));
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
  assert.strictEqual(d.today.article, '/glosario/its-vs-it-s/' + VIA('its-vs-its'));
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
  assert.deepStrictEqual(links, ['plan-estudio.html?foco=pasado&tema=verbos-irregulares&empezar=1', 'articulo-verbos-irregulares.html' + VIA('verbos-irregulares')]);
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
  assert.strictEqual(links.length, 2); assert.strictEqual(links[1], '/glosario/its-vs-it-s/' + VIA('its-vs-its')); assert(/Ver explicación rápida/.test(html));
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
  assert.deepStrictEqual(linksIn(T.temaLinksHtml(g.temaContent, 'Reforzar en mi Plan')), ['plan-estudio.html?foco=pasado&tema=verbos-irregulares&empezar=1', 'articulo-verbos-irregulares.html' + VIA('verbos-irregulares')]);
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
  eq(f, { href:'articulo-pasado-simple.html' + VIA('pasado-regulares'), text:'Ver la clase: Pasado simple (verbos regulares)' }); assert(hrefOk(f.href));
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
  assert(hrefs.some(h => /tema=verbos-irregulares/.test(h)) && hrefs.includes('articulo-verbos-irregulares.html' + VIA('verbos-irregulares')), hrefs.join(' | '));
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


/* ================= FASE 3: cerrar el circuito (clase/glosario -> práctica -> resultado) ================= */
console.log('\nFase 3: circuito de aprendizaje');
const TV = T.TEMAS.filter(t => t.family);
test('cada clase del registro carga temas.js, backend.js y app.js (si no, el botón de miembros no aparece)', ()=>{
  const arts = [...new Set(T.TEMAS.filter(t => t.article).map(t => t.article))];
  assert(arts.length >= 9);
  arts.forEach(f=>{
    const h = fs.readFileSync(path.join(root, f), 'utf8');
    assert(/<script src="temas\.js\?v=/.test(h), f + ' sin temas.js');
    assert(/<script src="backend\.js\?v=/.test(h) && /<script src="app\.js\?v=/.test(h), f + ' sin backend/app');
    assert(h.indexOf('temas.js') < h.indexOf('app.js?v='), f + ': temas.js debe cargar antes de app.js');
  });
});
test('glosario: cada entrada que es el glosario de un tema ofrece practicarlo (oculto para visitantes), sin duplicar la clase', ()=>{
  const byGl = {}; TV.forEach(t => { if(t.glossary && !byGl[t.glossary]) byGl[t.glossary] = t; });
  let withBlock = 0;
  fs.readdirSync(path.join(root, 'glosario')).forEach(slug=>{
    const f = path.join(root, 'glosario', slug, 'index.html');
    if(!fs.existsSync(f)) return;
    const h = fs.readFileSync(f, 'utf8');
    const t = byGl[slug];
    if(!t){ assert(!/class="gl-tema"/.test(h), slug + ' no debería tener bloque de tema'); return; }
    withBlock++;
    const m = h.match(/<div class="gl-tema" data-tema="([^"]+)" hidden>([\s\S]*?)<\/div><\/div>/);
    assert(m && m[1] === t.id, slug);
    assert(m[2].includes(`href="/plan-estudio.html?foco=${t.family}&amp;tema=${t.id}&amp;empezar=1"`), slug + ' practica');
    assert((m[2].match(/<a /g) || []).length <= 2, slug + ': más de 2 acciones');
    const claseYa = t.article && h.includes(`href="/${t.article}"`);
    if(claseYa) assert(!m[2].includes(t.article), slug + ': la clase ya estaba, no se duplica');
    if(t.article && !claseYa) assert(m[2].includes(`/${t.article}?tema=${t.id}&amp;via=rec`), slug + ': falta la clase del tema');
    assert(h.indexOf('class="gl-tema"') < h.indexOf('class="article-cta"'), slug + ': orden');
  });
  assert(withBlock >= 15, 'bloques: ' + withBlock);
  assert(fs.existsSync(path.join(root, 'plan-estudio.html')));
});
test('glosario: el script solo muestra el bloque a miembros (pista de backend.js) y oculta "practicar gratis"', ()=>{
  const js = fs.readFileSync(path.join(root, 'glosario', 'glosario.js'), 'utf8');
  assert(/leo_member_hint/.test(js) && /box\.hidden = false/.test(js) && /article-cta/.test(js));
  const be = fs.readFileSync(path.join(root, 'backend.js'), 'utf8');
  assert(/leo_member_hint/.test(be) && /setMemberHint\(!!\(data && data\.is_member\)\)/.test(be) && /removeItem\('leo_member_hint'\)/.test(be));
});

// ---- clases (artículos) para miembros, con un DOM mínimo
function fakeBody(){
  const kids = [];
  const mk = cls => ({ className:cls, style:{}, hidden:false, parentNode:null, nextSibling:null, innerHTML:'' });
  const body = { kids, querySelector(sel){ const c = sel.slice(1); return kids.find(k => (k.className || '').split(' ').includes(c)) || null; },
    appendChild(n){ n.parentNode = body; kids.push(n); return n; },
    insertBefore(n, ref){ n.parentNode = body; const i = ref ? kids.indexOf(ref) : -1; if(i < 0) kids.push(n); else kids.splice(i, 0, n); return n; },
    get firstChild(){ return kids[0] || null; } };
  const meta = mk('article-meta'), free = mk('article-cta');
  Object.defineProperty(meta, 'nextSibling', { get: ()=> kids[kids.indexOf(meta) + 1] || null });
  body.appendChild(meta); body.appendChild(free);
  return { body, meta, free };
}
const params = q => new URLSearchParams(q);
test('clase con un tema: miembro ve "Practicar este tema →" con la práctica del tema y la invitación gratis se oculta', ()=>{
  const { body, free } = fakeBody();
  assert.strictEqual(T.renderArticleTema('articulo-verbos-irregulares.html', params(''), body), true);
  const cta = body.querySelector('.tema-cta');
  assert(cta.innerHTML.includes('href="plan-estudio.html?foco=pasado&tema=verbos-irregulares&empezar=1"') && cta.innerHTML.includes('Practicar este tema →'));
  assert(!cta.innerHTML.includes('Volver a mi Plan') && !body.querySelector('.tema-context'), 'sin contexto no hay "Llegaste aquí"');
  assert.strictEqual(free.style.display, 'none');
  assert.strictEqual(body.kids.indexOf(cta) < body.kids.indexOf(free), true);
});
test('clase a la que llegó por una recomendación (?tema=&via=rec): recuerda por qué y ofrece volver al Plan', ()=>{
  const { body, meta } = fakeBody();
  T.renderArticleTema('articulo-verbos-irregulares.html', params('tema=verbos-irregulares&via=rec'), body);
  const ctx = body.querySelector('.tema-context');
  assert(ctx && ctx.innerHTML === 'Llegaste aquí para reforzar <b>Verbos irregulares en pasado</b>.');
  assert.strictEqual(body.kids.indexOf(ctx), body.kids.indexOf(meta) + 1);
  const cta = body.querySelector('.tema-cta');
  assert(cta.innerHTML.includes('href="plan-estudio.html"') && cta.innerHTML.includes('Volver a mi Plan'));
  assert.strictEqual((cta.innerHTML.match(/<a /g) || []).length, 2, 'máximo 2 acciones');
});
test('clase con varios temas (verbo to be): sin contexto elige el más flojo; con contexto, el que recomendó el sistema', ()=>{
  const wasWere = itemsOfTema(T, 'was-were'), others = itemsOfFamily(T, 'to-be').filter(i => !wasWere.includes(i));
  setProgress(T, [ session(2, answers(wasWere, 10, 10)), session(1, answers(others, 10, 90)) ]);
  let { body } = fakeBody();
  T.renderArticleTema('articulo-verbo-to-be.html', params(''), body);
  assert(body.querySelector('.tema-cta').innerHTML.includes('tema=was-were'), 'debería elegir el tema flojo');
  ({ body } = fakeBody());
  T.renderArticleTema('articulo-verbo-to-be.html', params('tema=to-be-presente&via=rec'), body);
  assert(body.querySelector('.tema-cta').innerHTML.includes('tema=to-be-presente'));
});
test('clase: tema inventado o de otra clase se ignora (sin "Llegaste aquí"); sin tema en el registro no hace nada; no se duplica', ()=>{
  let { body } = fakeBody();
  T.renderArticleTema('articulo-verbos-irregulares.html', params('tema=in-on-at&via=rec'), body);
  assert(!body.querySelector('.tema-context') && body.querySelector('.tema-cta').innerHTML.includes('tema=verbos-irregulares'));
  assert.strictEqual(T.renderArticleTema('articulo-verbos-irregulares.html', params(''), body), false, 'no se agrega dos veces');
  ({ body } = fakeBody());
  assert.strictEqual(T.renderArticleTema('articulo-errores-comunes.html', params(''), body), false);
  assert(!body.querySelector('.tema-cta'));
});

// ---- después de practicar un tema
function planSessionFor(history, results){
  const s = session(0, results);
  setProgress(T, history.concat([s]));
  return T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema:'verbos-irregulares' });
}
test('al terminar práctica del tema y SIGUE débil: muestra cómo le fue en ese tema, seguir practicando + clase', ()=>{
  const results = answers(irr.slice(0, 3), 6, 17);
  const ins = planSessionFor(weakIrregularHistory(), results);
  assert(ins.tema && ins.tema.needsMore, 'debería seguir débil');
  assert(/^En Verbos irregulares en pasado acertaste \d+ de 6\. Todavía conviene reforzarlo\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert.strictEqual(ins.actions[0].title, 'Seguir practicando Verbos irregulares en pasado');
  assert(/foco=pasado&tema=verbos-irregulares/.test(ins.actions[0].href));
  assert.strictEqual(ins.actions[1].href, 'articulo-verbos-irregulares.html' + VIA('verbos-irregulares'));
  ins.actions.forEach(a => assert(hrefOk(a.href), a.href));
  assert(ins.actions.length <= 3);
});
test('al terminar práctica del tema y MEJORÓ: lo dice y pasa a la siguiente prioridad (sin repetir el tema ni la clase)', ()=>{
  const results = answers(irr, 14, 100, 3);
  const ins = planSessionFor(weakIrregularHistory([12, 11]), results);
  assert(ins.tema && !ins.tema.needsMore);
  assert(/^En Verbos irregulares en pasado acertaste 14 de 14\. Ya vas bien en este tema\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert(ins.actions.every(a => !/Seguir practicando/.test(a.title) && !/verbos-irregulares/.test(a.href)), JSON.stringify(ins.actions));
  ins.actions.forEach(a => assert(hrefOk(a.href), a.href));
  const d = T.computeDiagnosis();
  assert(!d.today || !/Verbos irregulares/.test(d.today.title), 'la recomendación del sistema cambió');
});
test('tema solo con glosario que sigue débil: la segunda acción es la explicación rápida; sin recurso: solo practicar', ()=>{
  const cases = [ ['its-vs-its', 'confusiones', '/glosario/its-vs-it-s/'], ['question-words', 'bases', null] ];
  cases.forEach(([tid, fam, gl])=>{
    const mine = itemsOfTema(T, tid, 'facil'), rest = itemsOfFamily(T, fam, 'facil').filter(i => !mine.includes(i));
    const results = answers(mine, 6, 17);
    const s = session(0, results);
    setProgress(T, [ session(2, answers(mine, 10, 10)), session(1, answers(rest, 10, 90)), s ]);
    const ins = T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema:tid });
    assert(ins.tema && ins.tema.needsMore, tid);
    assert(/^Seguir practicando/.test(ins.actions[0].title));
    const extra = ins.actions.slice(1).filter(a => /^articulo-|^\/glosario\//.test(a.href));
    if(gl){ assert.strictEqual(extra.length, 1); assert.strictEqual(extra[0].href, gl + VIA(tid)); assert(/^Ver explicación rápida/.test(extra[0].title)); }
    else assert.strictEqual(extra.length, 0, 'no hay recurso: no se inventa ninguno');
  });
});
test('sesión sin foco de tema o con muy pocos ejercicios del tema: se comporta como antes', ()=>{
  const results = answers(irr.slice(0, 3), 6, 17);
  const s = session(0, results); setProgress(T, weakIrregularHistory().concat([s]));
  assert.strictEqual(T.computeSessionInsight(results, s.startedAt, 'plan').tema, null);
  const one = [{ itemId: irr[0], isCorrect:false }, { itemId: reg[0], isCorrect:true }, { itemId: reg[1], isCorrect:true }];
  const s2 = session(0, one); setProgress(T, weakIrregularHistory().concat([s2]));
  const ins = T.computeSessionInsight(one, s2.startedAt, 'plan', { focusTema:'verbos-irregulares' });
  assert.strictEqual(ins.tema, null);
});

// ---- el recorrido completo
test('RECORRIDO: debilidad -> Hoy te conviene -> clase -> practicar tema -> terminar -> recomendación actualizada', ()=>{
  setProgress(T, weakIrregularHistory());
  const d1 = readyDiag(T);
  const today = d1.today;
  assert(/Verbos irregulares/.test(today.title));
  const lessonUrl = new URL('http://x/' + today.article);
  assert.strictEqual(lessonUrl.pathname, '/articulo-verbos-irregulares.html');
  assert.strictEqual(lessonUrl.searchParams.get('via'), 'rec');
  const { body } = fakeBody();
  T.renderArticleTema(lessonUrl.pathname.slice(1), lessonUrl.searchParams, body);
  assert(body.querySelector('.tema-context'));
  const href = body.querySelector('.tema-cta').innerHTML.match(/href="(plan-estudio[^"]+)"/)[1];
  const q = new URL('http://x/' + href).searchParams;
  assert.strictEqual(q.get('foco'), 'pasado'); assert.strictEqual(q.get('tema'), 'verbos-irregulares'); assert.strictEqual(q.get('empezar'), '1');
  const sel = T.computePlanSelection('facil', 12, { focusFamily:q.get('foco'), focusTema:q.get('tema') });
  assert.strictEqual(sel.focus.temaId, 'verbos-irregulares');
  const focus = T.buildPlanPool('facil', sel).filter(e => e.focus);
  assert(focus.length >= 1 && focus.every(e => e.focusTema === 'verbos-irregulares'), 'las entradas del refuerzo llevan el tema');
  const results = answers(irr, 14, 100, 3);
  const s = session(0, results);
  setProgress(T, weakIrregularHistory([12, 11]).concat([s]));
  const ins = T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema: focus[0].focusTema });
  assert(ins.tema && !ins.tema.needsMore && /Ya vas bien/.test(ins.lines[0].text));
  const d2 = T.computeDiagnosis();
  assert(!d2.today || d2.today.title !== today.title, 'la recomendación cambió');
});


/* ================= FASE 4: VOCABULARIO por tema ================= */
console.log('\nFase 4: vocabulario por tema');
const VT = T.TEMAS.filter(t => t.skill === 'vocabulary');
const vocabIdsOf = (temaId, level) => {
  const out = [];
  Object.keys(T.V).filter(l => !level || l === level).forEach(l => T.V[l].forEach(v => v.forEach(w => { if(T.TEMA_BY_ID[temaId].groups.includes(T.vocabGroupOf(w.id))) out.push(w.id); })));
  return out;
};
const vocabOther = (temaId, level) => {
  const mine = new Set(vocabIdsOf(temaId, level)), out = [];
  T.V[level].forEach(v => v.forEach(w => { const g = T.vocabGroupOf(w.id); if(!mine.has(w.id) && T.VGS.includes(g)) out.push(w.id); }));
  return out;
};
const vsession = (daysAgo, results) => Object.assign(session(daysAgo, results), { skill:'vocabulario' });
const vres = (ids, n, pct, off) => answers(ids, n, pct, off).map(r => Object.assign(r, { skill:'vocabulario' }));
function vocabWeakHistory(temaId, days){
  const d = days || [2, 1];
  return [ vsession(d[0], vres(vocabIdsOf(temaId, 'facil'), 12, 10)), vsession(d[1], vres(vocabOther(temaId, 'facil'), 8, 90)) ];
}

test('vocabulario: todo grupo de VOCAB_BANK está en un tema o en la lista "sin tema" (y nada sobra ni se repite)', ()=>{
  const real = new Set();
  Object.keys(T.V).forEach(l => T.V[l].forEach(v => v.forEach(w => real.add(T.vocabGroupOf(w.id)))));
  const seen = new Map();
  VT.forEach(t => t.groups.forEach(g => { assert(!seen.has(g), `${g} está en ${seen.get(g)} y en ${t.id}`); seen.set(g, t.id); }));
  T.VGS.forEach(g => { assert(!seen.has(g), `${g} está en un tema Y en la lista sin tema`); seen.set(g, 'sin-tema'); });
  const missing = [...real].filter(g => !seen.has(g)), extra = [...seen.keys()].filter(g => !real.has(g));
  assert.deepStrictEqual(missing, [], 'grupos sin clasificar: ' + missing.join(', '));
  assert.deepStrictEqual(extra, [], 'grupos que no existen en data.js: ' + extra.join(', '));
});
test('temas de vocabulario: ids propios, skill, nombre y recursos reales (artículo/glosario si existen)', ()=>{
  assert(VT.length >= 5);
  VT.forEach(t=>{
    assert(/^vocab-[a-z0-9-]+$/.test(t.id) && t.skill === 'vocabulary' && t.label && t.groups.length && t.topics.length === 0, t.id);
    if(t.article) assert(files.has(t.article), t.id);
    if(t.glossary) assert(glossaryOk(t.glossary), t.id);
    const c = T.contentForTema(t.id);
    assert(c && c.skill === 'vocabulario' && c.unitKey === 'skill:vocabulario', t.id);
    assert(hrefOk(c.practiceHref), c.practiceHref);
    if(c.lesson) assert(files.has(c.lesson.href.split('?')[0]));
  });
});
test('compatibilidad: los temas de vocabulario no se mezclan con gramática', ()=>{
  const gram = T.TEMAS.filter(t => t.skill !== 'vocabulary');
  assert(gram.length >= 60 && gram.every(t => !t.groups));
  Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g => assert(!T.TEMAS.some(t => t.skill === 'vocabulary' && t.topics.includes(g.topic))))));
});
test('vocabulario SIN suficiente evidencia de un tema: solo "Vocabulario", sin tema', ()=>{
  const compras = vocabIdsOf('vocab-compras', 'facil'), otros = vocabOther('vocab-compras', 'facil');
  setProgress(T, [ vsession(2, vres(compras, 3, 0)), vsession(1, vres(otros, 14, 40)) ]);   // solo 3 intentos del tema (mínimo 4)
  const d = readyDiag(T);
  const u = d.units.find(x => x.key === 'skill:vocabulario');
  assert(u && !u.focusTema, 'no debería señalar tema con 3 intentos');
  if(d.today) assert(!d.today.tema);
  assert(!/Dentro de Vocabulario/.test(T.diagSkillsHtml(JSON.parse(store[T.PROGRESS_KEY]), d)));
});
test('vocabulario con tema débil claro: Hoy te conviene (practicar el tema) + detalle en el diagnóstico', ()=>{
  setProgress(T, vocabWeakHistory('vocab-compras'));
  const d = readyDiag(T);
  assert.strictEqual(d.weak.key, 'skill:vocabulario');
  assert.strictEqual(d.weak.focusTema.id, 'vocab-compras');
  const a = d.today;
  assert.strictEqual(a.title, 'Reforzar Compras y pagos');
  assert.strictEqual(a.tema, 'vocab-compras');
  assert(/^plan-estudio\.html\?tema=vocab-compras$/.test(a.href), a.href);
  assert(/^plan-estudio\.html\?tema=vocab-compras&empezar=1$/.test(T.todayStartHref(a)));
  assert(!a.article, 'Compras no tiene clase ni glosario: solo practicar');
  checkAction(a);
  const html = T.diagSkillsHtml(JSON.parse(store[T.PROGRESS_KEY]), d);
  assert(/Dentro de Vocabulario, lo que más necesitas reforzar es <b>Compras y pagos<\/b>\./.test(html));
});
test('tema de vocabulario con clase: practicar + clase real (con contexto)', ()=>{
  setProgress(T, vocabWeakHistory('vocab-numeros'));
  const a = readyDiag(T).today;
  assert.strictEqual(a.title, 'Reforzar Números, precios y datos personales');
  assert.strictEqual(a.article, 'articulo-numeros-en-ingles.html' + VIA('vocab-numeros'));
  assert.strictEqual(a.articleLabel, 'Ver la clase');
  checkAction(a);
});
test('práctica enfocada en un tema de vocabulario: las palabras del tema primero y se completa con vocabulario del nivel', ()=>{
  const sel = T.computePlanSelection('facil', 12, { focusTema:'vocab-compras' });
  assert.strictEqual(sel.focus.skill, 'vocabulario'); assert.strictEqual(sel.focus.temaId, 'vocab-compras'); assert.strictEqual(sel.focus.label, 'Compras y pagos');
  const pool = T.buildPlanPool('facil', sel);
  const total = sel.mistakeCount + Object.keys(sel.bySkill).reduce((n, k) => n + sel.bySkill[k], 0);
  assert.strictEqual(pool.length, total, 'la sesión mantiene su duración');
  const focus = pool.filter(e => e.focus);
  const mine = new Set(vocabIdsOf('vocab-compras', 'facil'));
  assert(focus.length >= 3 && focus.every(e => e.kind === 'vocab' && mine.has(e.item.id) && e.focusTema === 'vocab-compras'));
  assert.strictEqual(new Set(pool.map(e => e.item.id)).size, pool.length, 'sin ejercicios repetidos');
  const vocabAll = pool.filter(e => e.kind === 'vocab').length;
  assert(vocabAll >= focus.length);
});
test('tema de vocabulario sin palabras en este nivel o inventado: Plan normal (nunca vacío); gramática intacta', ()=>{
  setProgress(T, []);   // sin historial: solo cuenta lo que pide la URL
  let sel = T.computePlanSelection('facil', 12, { focusTema:'vocab-viajes' });       // viajes solo tiene palabras de nivel medio
  assert(!sel.focus || sel.focus.skill !== 'vocabulario');
  sel = T.computePlanSelection('facil', 12, { focusTema:'vocab-inventado' });
  assert(!sel.focus || sel.focus.skill !== 'vocabulario');
  sel = T.computePlanSelection('facil', 12, { focusFamily:'pasado', focusTema:'verbos-irregulares' });
  assert.strictEqual(sel.focus.skill, 'gramatica'); assert.strictEqual(sel.focus.temaId, 'verbos-irregulares');
  assert.strictEqual(T.contentForTema('vocab-viajes').practiceHref, 'vocabulario.html', 'sin palabras en el nivel: la página de vocabulario');
});
test('el Plan sin foco en la URL sigue al tema de vocabulario que detectó el diagnóstico', ()=>{
  setProgress(T, vocabWeakHistory('vocab-compras'));
  const sel = T.computePlanSelection('facil', 12, {});
  assert.strictEqual(sel.focus.skill, 'vocabulario'); assert.strictEqual(sel.focus.temaId, 'vocab-compras');
});
function vocabPlanFor(temaId, history, results){
  const s = vsession(0, results);
  setProgress(T, history.concat([s]));
  return T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema:temaId });
}
test('vocabulario: al terminar el tema y SIGUE débil -> seguir practicando; sin recurso no se inventa clase', ()=>{
  const ins = vocabPlanFor('vocab-compras', vocabWeakHistory('vocab-compras'), vres(vocabIdsOf('vocab-compras', 'facil'), 6, 17));
  assert(ins.tema && ins.tema.needsMore);
  assert(/^En Compras y pagos acertaste \d+ de 6\. Todavía conviene reforzarlo\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert.strictEqual(ins.actions[0].title, 'Seguir practicando Compras y pagos');
  assert(/plan-estudio\.html\?tema=vocab-compras/.test(ins.actions[0].href));
  assert(ins.actions.slice(1).every(a => !/^articulo-|^\/glosario\//.test(a.href)), JSON.stringify(ins.actions));
});
test('vocabulario: tema que MEJORA deja de recomendarse y cambia la recomendación', ()=>{
  const hist = vocabWeakHistory('vocab-compras', [12, 11]);
  const ins = vocabPlanFor('vocab-compras', hist, vres(vocabIdsOf('vocab-compras', 'facil'), 14, 100, 2));
  assert(ins.tema && !ins.tema.needsMore && /^En Compras y pagos acertaste 14 de 14\. Ya vas bien en este tema\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert(ins.actions.every(a => !/Seguir practicando/.test(a.title) && !/vocab-compras/.test(a.href)), JSON.stringify(ins.actions));
  const d = T.computeDiagnosis();
  const u = d.units.find(x => x.key === 'skill:vocabulario');
  const st = (u.temaStats || []).find(s => s.id === 'vocab-compras');
  assert(st && st.current >= 75 && st.trend === 'up', 'el tema refleja la mejora: ' + (st && st.current));
  assert(!d.today || d.today.tema !== 'vocab-compras', 'la recomendación cambió');
});
test('vocabulario con clase que sigue débil: la segunda acción es la clase real', ()=>{
  const ins = vocabPlanFor('vocab-numeros', vocabWeakHistory('vocab-numeros'), vres(vocabIdsOf('vocab-numeros', 'facil'), 6, 17));
  assert(ins.tema && ins.tema.needsMore);
  assert.strictEqual(ins.actions[1].href, 'articulo-numeros-en-ingles.html' + VIA('vocab-numeros'));
});
test('Mis errores con palabras de un tema: "Sobre todo en X" con práctica del tema (+ clase si existe)', ()=>{
  const compras = vocabIdsOf('vocab-compras', 'facil');
  setProgress(T, vocabWeakHistory('vocab-compras'));
  const g = T.computeMistakePatterns(mistakeStats(compras.slice(0, 4))).groups.find(x => x.key === 'skill:vocabulario');
  assert(g && g.temaContent && g.temaContent.id === 'vocab-compras');
  eq(linksIn(T.temaLinksHtml(g.temaContent, 'Reforzar en mi Plan')), ['plan-estudio.html?tema=vocab-compras&empezar=1']);
  const nums = vocabIdsOf('vocab-numeros', 'facil');
  const g2 = T.computeMistakePatterns(mistakeStats(nums.slice(0, 4))).groups.find(x => x.key === 'skill:vocabulario');
  eq(linksIn(T.temaLinksHtml(g2.temaContent)), ['plan-estudio.html?tema=vocab-numeros&empezar=1', 'articulo-numeros-en-ingles.html' + VIA('vocab-numeros')]);
  // palabras generales (sin tema): se queda como antes
  const gen = vocabOther('vocab-compras', 'facil');
  const g3 = T.computeMistakePatterns(mistakeStats(gen.slice(0, 4))).groups.find(x => x.key === 'skill:vocabulario');
  assert(g3 && !g3.temaContent);
});
test('Leo AI (vocabulario): recibe el tema que ya decidió la página como "ya mostrado", sin URLs ni llamadas nuevas', ()=>{
  const compras = vocabIdsOf('vocab-compras', 'facil');
  setProgress(T, vocabWeakHistory('vocab-compras'));
  const payload = T.buildLeoAiPayload(T.mistakePatternsAiCtx(T.computeMistakePatterns(mistakeStats(compras.slice(0, 4)))));
  assert(payload && payload.shown.includes('Compras y pagos'), JSON.stringify(payload.shown));
  assert(!payload.candidates.some(c => c.id === 'vocab-compras'), 'no se ofrece el tema ya mostrado');
  payload.candidates.forEach(c => assert(T.TEMA_BY_ID[c.id] && T.TEMA_BY_ID[c.id].label === c.label));
  noUrls(payload); assert(!('next' in payload));
  assert.strictEqual(T.leoAiFocusLink(payload, { focus_topic:'vocab-compras', focus_action:'practice' }), null, 'mismo tema que la tarjeta: no se duplica');
  assert.strictEqual(T.leoAiFocusLink(payload, { focus_topic:'vocab-inventado', focus_action:'practice' }), null);
});
test('sin temas.js, vocabulario funciona como antes (sin tema)', ()=>{
  setProgress(T0, vocabWeakHistory.call(null, 'vocab-compras').map(s => s));
  const d = T0.computeDiagnosis();
  const u = d.units.find(x => x.key === 'skill:vocabulario');
  assert(!u || !u.focusTema);
  if(d.today) assert(!d.today.tema && !/tema=/.test(d.today.href));
});


/* ================= FASE 5: LISTENING por tema ================= */
console.log('\nFase 5: listening por tema');
const LT = T.TEMAS.filter(t => t.skill === 'listening');
// Criterio explícito de cada tema (el mismo que documenta temas.js), por prioridad.
const LNUMQ = /^(how many|how much|what time|how old|how long|what year|what('s| is) the (total|price|number|address|phone number|email( address)?|confirmation code))/i;
const LRULES = [
  ['listening-numeros', x => /numeros$/.test(x.id.replace(/^l-/, '').replace(/-\d+$/, '')) || LNUMQ.test(x.question)],
  ['listening-conversaciones', x => x.transcript.includes('—')],
  ['listening-condicionales', x => /\b(if|unless)\b|\bwould have\b/i.test(x.transcript) || /^(Had|Were it|Should)\b/.test(x.transcript)],
  ['listening-contraste', x => /\b(not|never|n't|but|except|although|though|despite|nevertheless|whereas|however|even though|instead)\b/i.test(x.transcript) || /^Not (only|until)\b/.test(x.transcript)]
];
const lisAll = []; Object.keys(T.L).forEach(l => T.L[l].forEach(v => v.forEach(x => lisAll.push(Object.assign({ level:l }, x)))));
const lisIds = (temaId, level) => lisAll.filter(x => (!level || x.level === level) && (T.temaForListeningItem(x.id) || {}).id === temaId).map(x => x.id);
const lisGeneral = level => lisAll.filter(x => x.level === level && !T.temaForListeningItem(x.id)).map(x => x.id);
const lsession = (daysAgo, results) => Object.assign(session(daysAgo, results), { skill:'listening' });
const lres = (ids, n, pct, off) => answers(ids, n, pct, off).map(r => Object.assign(r, { skill:'listening' }));
const lisWeak = (temaId, days) => { const d = days || [2, 1]; return [ lsession(d[0], lres(lisIds(temaId, 'facil'), 10, 10)), lsession(d[1], lres(lisGeneral('facil'), 8, 90)) ]; };

test('listening: la tabla coincide EXACTAMENTE con los criterios (ningún ejercicio nuevo se queda sin clasificar ni sobra un id)', ()=>{
  const wrong = [];
  lisAll.forEach(x=>{
    const rule = LRULES.find(r => r[1](x));
    const want = (rule && !T.LEX.includes(x.id.replace(/^l-/, ''))) ? rule[0] : null;
    const got = (T.temaForListeningItem(x.id) || {}).id || null;
    if(want !== got) wrong.push(`${x.id}: criterio=${want} tabla=${got}`);
  });
  assert.deepStrictEqual(wrong, [], wrong.join(' | '));
  const real = new Set(lisAll.map(x => x.id.replace(/^l-/, '')));
  LT.forEach(t => t.items.forEach(i => assert(real.has(i), `${t.id}: el id ${i} ya no existe en data.js`)));
  const all = LT.reduce((a, t) => a.concat(t.items), []);
  assert.strictEqual(new Set(all).size, all.length, 'un ejercicio está en dos temas');
  const classified = lisAll.filter(x => T.temaForListeningItem(x.id)).length;
  assert(classified >= 70 && lisAll.length - classified >= 100, `conectados ${classified}, generales ${lisAll.length - classified}`);
});
test('temas de listening: ids, skill, nombre, recursos reales y práctica válida; niveles con ejercicios', ()=>{
  assert.strictEqual(LT.length, 4);
  LT.forEach(t=>{
    assert(/^listening-[a-z-]+$/.test(t.id) && t.label && t.items.length >= 8 && t.topics.length === 0 && !t.family, t.id);
    if(t.article) assert(files.has(t.article), t.id);
    if(t.glossary) assert(glossaryOk(t.glossary), t.id);
    const c = T.contentForTema(t.id);
    assert(c && c.skill === 'listening' && c.unitKey === 'skill:listening', t.id);
    assert(hrefOk(c.practiceHref), c.practiceHref);
    if(c.lesson) assert(files.has(c.lesson.href.split('?')[0]));
    ['principiante', 'facil', 'medio', 'avanzado'].forEach(l => assert.strictEqual(T.temaHasItemsAt(t.id, l), lisIds(t.id, l).length > 0, t.id + ' ' + l));
  });
});
test('compatibilidad: gramática y vocabulario no se mezclan con listening', ()=>{
  Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g => assert(!LT.some(t => t.topics.includes(g.topic))))));
  Object.keys(T.V).forEach(l => T.V[l].forEach(v => v.forEach(w => assert(!T.temaForListeningItem(w.id)))));
  assert(LT.every(t => !t.groups));
});
test('listening SIN suficiente evidencia de un tema: solo "Listening"', ()=>{
  const nums = lisIds('listening-numeros', 'facil');
  setProgress(T, [ lsession(2, lres(nums, 3, 0)), lsession(1, lres(lisGeneral('facil'), 14, 40)) ]);   // 3 intentos del tema (mínimo 4)
  const d = readyDiag(T);
  const u = d.units.find(x => x.key === 'skill:listening');
  assert(u && !u.focusTema);
  if(d.today) assert(!d.today.tema);
  assert(!/Dentro de Listening/.test(T.diagSkillsHtml(JSON.parse(store[T.PROGRESS_KEY]), d)));
});
test('listening con tema claro: Hoy te conviene (practicar el tema + clase) y detalle en el diagnóstico', ()=>{
  setProgress(T, lisWeak('listening-numeros'));
  const d = readyDiag(T);
  assert.strictEqual(d.weak.key, 'skill:listening'); assert.strictEqual(d.weak.focusTema.id, 'listening-numeros');
  const a = d.today;
  assert.strictEqual(a.title, 'Reforzar Números, horas y precios'); assert.strictEqual(a.tema, 'listening-numeros');
  assert.strictEqual(a.href, 'plan-estudio.html?tema=listening-numeros');
  assert.strictEqual(T.todayStartHref(a), 'plan-estudio.html?tema=listening-numeros&empezar=1');
  assert.strictEqual(a.article, 'articulo-numeros-en-ingles.html' + VIA('listening-numeros'));
  checkAction(a);
  assert(/Dentro de Listening, lo que más necesitas reforzar es <b>Números, horas y precios<\/b>\./.test(T.diagSkillsHtml(JSON.parse(store[T.PROGRESS_KEY]), d)));
});
test('listening: tema con glosario -> explicación rápida; tema sin recurso -> solo practicar', ()=>{
  const gl = lisIds('listening-contraste', 'facil');
  setProgress(T, [ lsession(2, lres(gl, 10, 10)), lsession(1, lres(lisGeneral('facil'), 8, 90)) ]);
  let a = readyDiag(T).today;
  assert.strictEqual(a.tema, 'listening-contraste'); assert.strictEqual(a.article, '/glosario/although/' + VIA('listening-contraste')); assert.strictEqual(a.articleLabel, 'Ver explicación rápida');
  checkAction(a);
  const cv = lisIds('listening-conversaciones', 'facil');
  setProgress(T, [ lsession(2, lres(cv, 10, 10)), lsession(1, lres(lisGeneral('facil'), 8, 90)) ]);
  a = readyDiag(T).today;
  assert.strictEqual(a.tema, 'listening-conversaciones'); assert(!a.article, 'sin recurso: nada inventado');
  checkAction(a);
});
test('práctica enfocada en un tema de listening: sus ejercicios primero y se completa con Listening del nivel', ()=>{
  setProgress(T, []);
  const sel = T.computePlanSelection('facil', 12, { focusTema:'listening-numeros' });
  assert.strictEqual(sel.focus.skill, 'listening'); assert.strictEqual(sel.focus.temaId, 'listening-numeros'); assert.strictEqual(sel.focus.label, 'Números, horas y precios');
  const pool = T.buildPlanPool('facil', sel);
  assert.strictEqual(pool.length, sel.mistakeCount + Object.keys(sel.bySkill).reduce((n, k) => n + sel.bySkill[k], 0), 'la sesión mantiene su duración');
  const mine = new Set(lisIds('listening-numeros', 'facil'));
  const focus = pool.filter(e => e.focus);
  assert(focus.length >= 3 && focus.every(e => e.kind === 'listening' && mine.has(e.item.id) && e.focusTema === 'listening-numeros'));
  assert.strictEqual(new Set(pool.map(e => e.item.id)).size, pool.length);
});
test('tema con pocos ejercicios en su nivel: usa los que hay y completa; sin ninguno en el nivel o inventado: Plan normal (nunca vacío)', ()=>{
  setProgress(T, []);
  assert.strictEqual(lisIds('listening-conversaciones', 'principiante').length, 1);
  let sel = T.computePlanSelection('principiante', 12, { focusTema:'listening-conversaciones' });
  const pool = T.buildPlanPool('principiante', sel);
  assert.strictEqual(pool.length, sel.mistakeCount + Object.keys(sel.bySkill).reduce((n, k) => n + sel.bySkill[k], 0));
  assert(pool.filter(e => e.focus).length <= 1 && pool.length >= 8);
  assert.strictEqual(T.temaHasItemsAt('listening-condicionales', 'principiante'), false);
  sel = T.computePlanSelection('principiante', 12, { focusTema:'listening-condicionales' });
  assert(!sel.focus || sel.focus.skill !== 'listening');
  sel = T.computePlanSelection('facil', 12, { focusTema:'listening-inventado' });
  assert(!sel.focus || sel.focus.skill !== 'listening');
  sel = T.computePlanSelection('facil', 12, { focusFamily:'pasado', focusTema:'verbos-irregulares' });
  assert.strictEqual(sel.focus.skill, 'gramatica');
  sel = T.computePlanSelection('facil', 12, { focusTema:'vocab-compras' });
  assert.strictEqual(sel.focus.skill, 'vocabulario');
});
test('el Plan sin foco en la URL sigue al tema de listening que detectó el diagnóstico', ()=>{
  setProgress(T, lisWeak('listening-numeros'));
  const sel = T.computePlanSelection('facil', 12, {});
  assert.strictEqual(sel.focus.skill, 'listening'); assert.strictEqual(sel.focus.temaId, 'listening-numeros');
});
function lisPlanFor(temaId, history, results){
  const s = lsession(0, results);
  setProgress(T, history.concat([s]));
  return T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema:temaId });
}
test('listening: al terminar el tema y SIGUE débil -> seguir practicando + la clase real', ()=>{
  const ins = lisPlanFor('listening-numeros', lisWeak('listening-numeros'), lres(lisIds('listening-numeros', 'facil'), 6, 17));
  assert(ins.tema && ins.tema.needsMore);
  assert(/^En Números, horas y precios acertaste \d+ de 6\. Todavía conviene reforzarlo\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert.strictEqual(ins.actions[0].title, 'Seguir practicando Números, horas y precios');
  assert(/plan-estudio\.html\?tema=listening-numeros/.test(ins.actions[0].href));
  assert.strictEqual(ins.actions[1].href, 'articulo-numeros-en-ingles.html' + VIA('listening-numeros'));
});
test('listening: tema que MEJORA deja de priorizarse y cambia la recomendación', ()=>{
  const ins = lisPlanFor('listening-numeros', lisWeak('listening-numeros', [12, 11]), lres(lisIds('listening-numeros', 'facil'), 14, 100, 2));
  assert(ins.tema && !ins.tema.needsMore && /^En Números, horas y precios acertaste 14 de 14\. Ya vas bien en este tema\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert(ins.actions.every(a => !/Seguir practicando/.test(a.title) && !/listening-numeros/.test(a.href) && !/numeros-en-ingles/.test(a.href)), JSON.stringify(ins.actions));
  const d = T.computeDiagnosis();
  const st = (d.units.find(x => x.key === 'skill:listening').temaStats || []).find(s => s.id === 'listening-numeros');
  assert(st && st.current >= 75 && st.trend === 'up', 'mejora medida: ' + (st && st.current));
  assert(!d.today || d.today.tema !== 'listening-numeros');
});
test('Mis errores: errores de Listening de un tema -> "Sobre todo en X"; ejercicios generales -> como antes', ()=>{
  const nums = lisIds('listening-numeros', 'facil');
  setProgress(T, lisWeak('listening-numeros'));
  const g = T.computeMistakePatterns(mistakeStats(nums.slice(0, 4))).groups.find(x => x.key === 'skill:listening');
  assert(g && g.temaContent && g.temaContent.id === 'listening-numeros');
  eq(linksIn(T.temaLinksHtml(g.temaContent)), ['plan-estudio.html?tema=listening-numeros&empezar=1', 'articulo-numeros-en-ingles.html' + VIA('listening-numeros')]);
  const g2 = T.computeMistakePatterns(mistakeStats(lisGeneral('facil').slice(0, 4))).groups.find(x => x.key === 'skill:listening');
  assert(g2 && !g2.temaContent);
});
test('Leo AI (listening): el tema ya mostrado no se repite, sin URLs ni tokens extra en el payload', ()=>{
  const nums = lisIds('listening-numeros', 'facil');
  setProgress(T, lisWeak('listening-numeros'));
  const payload = T.buildLeoAiPayload(T.mistakePatternsAiCtx(T.computeMistakePatterns(mistakeStats(nums.slice(0, 4)))));
  assert(payload.shown.includes('Números, horas y precios'));
  assert(!payload.candidates.some(c => c.id === 'listening-numeros'));
  noUrls(payload); assert(payload.facts.length <= 5 && payload.examples.length <= 3);
  assert.strictEqual(T.leoAiFocusLink(payload, { focus_topic:'listening-numeros', focus_action:'practice' }), null);
});
test('sin temas.js, listening funciona como antes', ()=>{
  setProgress(T0, lisWeak('listening-numeros'));
  const d = T0.computeDiagnosis();
  const u = d.units.find(x => x.key === 'skill:listening');
  assert(!u || !u.focusTema);
  if(d.today) assert(!d.today.tema && !/tema=/.test(d.today.href));
});


/* ================= FASE 6: WRITING por tema (mismo topic_id, otra habilidad) ================= */
console.log('\nFase 6: writing por tema');
const wAll = []; Object.keys(T.W).forEach(l => T.W[l].forEach(v => v.forEach(x => wAll.push(Object.assign({ level:l }, x)))));
const wTema = x => (T.temaForWritingItem(x.id) || {}).id || null;
const wIds = (temaId, level) => wAll.filter(x => (!level || x.level === level) && wTema(x) === temaId).map(x => x.id);
const wGeneral = level => wAll.filter(x => x.level === level && !wTema(x)).map(x => x.id);
const wsession = (daysAgo, results) => Object.assign(session(daysAgo, results), { skill:'writing' });
const wres = (ids, n, pct, off, extra) => answers(ids, n, pct, off).map(r => Object.assign(r, { skill:'writing' }, extra || null));
const wWeak = (temaId, days) => { const d = days || [2, 1]; return [ wsession(d[0], wres(wIds(temaId, 'facil'), 10, 10)), wsession(d[1], wres(wGeneral('facil'), 8, 90)) ]; };
const wUnit = d => d.units.find(x => x.key === 'skill:writing');
// Criterios claros por "target" de la consigna (si una consigna NUEVA los cumple y no está en la tabla, el test falla).
const WRULES = [
  [/used to/i, 'used-to'], [/since \/ for/i, 'since-for'], [/presente continuo/i, 'presente-continuo'], [/reported speech/i, 'estilo-indirecto'],
  [/cláusula relativa/i, 'relativas'], [/phrasal verb/i, 'phrasal-verbs'], [/hedging/i, 'hedging'], [/subjuntivo formal/i, 'subjuntivo-formal'],
  [/inversi[oó]n/i, 'inversion-enfasis'], [/voz pasiva/i, 'voz-pasiva'], [/^going to$|am going to/i, 'will-going-to'],
  [/condicional (1|tipo 3|mixto)/i, 'condicionales'], [/must have|modal de deducci/i, 'modales-perfectos'], [/had \+ participio/i, 'past-perfect'],
  [/^can't$/i, 'can-cant'], [/have to/i, 'modales-obligacion'], [/question tag/i, 'question-tags'], [/some \/ any/i, 'some-any']
];

test('writing: la tabla usa temas que existen, ids que existen y respeta los criterios claros (consignas nuevas sin mapear = falla)', ()=>{
  const real = new Set(wAll.map(x => x.id.replace(/^w-/, '')));
  Object.keys(T.WTB).forEach(id => { assert(real.has(id), 'id inexistente en la tabla: ' + id); assert(T.TEMA_BY_ID[T.WTB[id]], `${id}: tema inexistente ${T.WTB[id]}`); });
  const bad = [];
  wAll.forEach(x=>{
    const rule = WRULES.find(r => r[0].test(x.target));
    if(rule && wTema(x) !== rule[1]) bad.push(`${x.id} (${x.target}): debería ser ${rule[1]} y es ${wTema(x)}`);
  });
  assert.deepStrictEqual(bad, [], bad.join(' | '));
  assert(!wAll.some(x => x.target === '...' && /\b(would rather)\b/i.test(x.prompt) && !wTema(x)), 'consigna de would rather sin tema');
  const mapped = wAll.filter(wTema).length;
  assert(mapped >= 140 && wAll.length - mapped >= 40, `con tema ${mapped}, generales ${wAll.length - mapped}`);
});
test('writing NO crea temas propios: todos los topic_id son los del registro de Gramática/Vocabulario', ()=>{
  assert(!T.TEMAS.some(t => /^writing-/.test(t.id)));
  const own = new Set(T.TEMAS.map(t => t.id));
  Object.values(T.WTB).forEach(id => assert(own.has(id)));
});
test('mismo topic_id en Gramática y Writing: cada habilidad guarda y mide lo suyo', ()=>{
  const gPres = itemsOfTema(T, 'presente-simple', 'facil'), wPres = wIds('presente-simple', 'facil');
  assert(gPres.length >= 4 && wPres.length >= 2);
  // Solo falla en Writing -> Gramática no se entera.
  setProgress(T, [ wsession(2, wres(wPres, 10, 10)), wsession(1, wres(wGeneral('facil'), 8, 90)) ]);
  let d = readyDiag(T);
  assert.strictEqual(wUnit(d).focusTema.id, 'presente-simple');
  assert(!d.units.some(u => u.key === 'family:presente-simple'), 'Writing no crea datos de la familia de Gramática');
  // Ahora va bien en Gramática pero mal escribiéndolo: las dos lecturas conviven.
  setProgress(T, [ wsession(2, wres(wPres, 10, 10)), wsession(1, wres(wGeneral('facil'), 8, 90)), session(1, answers(gPres, 12, 100)) ]);
  d = readyDiag(T);
  const fam = d.units.find(u => u.key === 'family:presente-simple');
  assert(fam && fam.acc >= 85, 'Gramática intacta: ' + (fam && fam.acc));
  assert(!(fam.focusTema), 'Gramática no ve debilidad');
  assert.strictEqual(wUnit(d).focusTema.id, 'presente-simple');
  assert(!/También lo fallas en Gramática/.test(d.today.reason), 'no hay señal cruzada si Gramática va bien');
  // Si también falla en Gramática, se dice (señal cruzada) sin mezclar los porcentajes.
  setProgress(T, [ wsession(2, wres(wPres, 10, 10)), wsession(1, wres(wGeneral('facil'), 8, 90)), session(1, answers(gPres, 12, 15)) ]);
  d = readyDiag(T);
  assert.strictEqual(wUnit(d).key, 'skill:writing');
  if(d.today.tema === 'presente-simple' && /en Writing/.test(d.today.title)) assert(/También lo fallas en Gramática\./.test(d.today.reason), d.today.reason);
});
test('writing SIN suficiente evidencia de un tema, o con respuestas de 0-1 palabra (no cuentan para el tema): solo "Writing"', ()=>{
  const ids = wIds('comparativos', 'facil');
  setProgress(T, [ wsession(2, wres(ids, 3, 0)), wsession(1, wres(wGeneral('facil'), 14, 40)) ]);
  let d = readyDiag(T);
  assert(wUnit(d) && !wUnit(d).focusTema);
  assert(!/Dentro de Writing/.test(T.diagSkillsHtml(JSON.parse(store[T.PROGRESS_KEY]), d)));
  // 12 intentos fallidos pero todos de una palabra/vacío: son de Writing, no del tema.
  setProgress(T, [ wsession(2, wres(ids, 12, 0, 0, { lowEffort:true })), wsession(1, wres(wGeneral('facil'), 8, 90)) ]);
  d = readyDiag(T);
  assert(!wUnit(d).focusTema, 'una palabra suelta no marca el tema como débil');
});
test('writing con tema claro: Hoy te conviene (practicar Writing del tema) + detalle en el panel de habilidades', ()=>{
  setProgress(T, wWeak('comparativos'));
  const d = readyDiag(T);
  assert.strictEqual(d.weak.key, 'skill:writing'); assert.strictEqual(wUnit(d).focusTema.id, 'comparativos');
  const a = d.today;
  assert.strictEqual(a.title, 'Reforzar Comparativos en Writing'); assert.strictEqual(a.tema, 'comparativos');
  assert.strictEqual(a.href, 'plan-estudio.html?habilidad=writing&tema=comparativos');
  assert.strictEqual(T.todayStartHref(a), 'plan-estudio.html?habilidad=writing&tema=comparativos&empezar=1');
  assert(!a.article, 'Comparativos no tiene clase ni glosario: solo practicar');
  checkAction(a);
  assert(/Dentro de Writing, lo que más necesitas reforzar es <b>Comparativos<\/b>\./.test(T.diagSkillsHtml(JSON.parse(store[T.PROGRESS_KEY]), d)));
});
test('writing: tema con clase -> practicar + clase real desde temas.js', ()=>{
  setProgress(T, wWeak('presente-simple'));
  const a = readyDiag(T).today;
  assert.strictEqual(a.tema, 'presente-simple');
  assert.strictEqual(a.article, 'articulo-presente-simple.html' + VIA('presente-simple'));
  checkAction(a);
});
test('writing: respuestas correctas no marcan debilidad', ()=>{
  const ids = wIds('comparativos', 'facil');
  setProgress(T, [ wsession(2, wres(ids, 10, 100)), wsession(1, wres(wGeneral('facil'), 8, 100)) ]);
  const d = readyDiag(T);
  assert(!wUnit(d).focusTema && !(d.weak && d.weak.key === 'skill:writing'));
});
test('práctica enfocada de Writing: consignas del tema primero, se completa con Writing del nivel y nunca queda vacía', ()=>{
  setProgress(T, []);
  const sel = T.computePlanSelection('facil', 12, { focusSkill:'writing', focusTema:'comparativos' });
  assert.strictEqual(sel.focus.skill, 'writing'); assert.strictEqual(sel.focus.temaId, 'comparativos'); assert.strictEqual(sel.focus.label, 'Comparativos');
  const pool = T.buildPlanPool('facil', sel);
  assert.strictEqual(pool.length, sel.mistakeCount + Object.keys(sel.bySkill).reduce((n, k) => n + sel.bySkill[k], 0), 'la sesión mantiene su duración');
  const mine = new Set(wIds('comparativos', 'facil'));
  const focus = pool.filter(e => e.focus);
  assert(focus.length >= 3 && focus.every(e => e.kind === 'writing' && mine.has(e.item.id) && e.focusTema === 'comparativos'));
  assert.strictEqual(new Set(pool.map(e => e.item.id)).size, pool.length);
  // Gramática intacta y sin mezclarse: el mismo tema pedido como Gramática sigue siendo Gramática.
  const g = T.computePlanSelection('facil', 12, { focusFamily:'comparativos', focusTema:'comparativos' });
  assert.strictEqual(g.focus.skill, 'gramatica');
  const w2 = T.computePlanSelection('facil', 12, { focusSkill:'writing', focusTema:'comparativos', focusFamily:'comparativos' });
  assert.strictEqual(w2.focus.skill, 'writing', 'habilidad=writing manda');
});
test('Writing con pocos ejercicios del tema en el nivel: usa los que hay y completa; sin ninguno o inventado: Plan normal', ()=>{
  setProgress(T, []);
  assert.strictEqual(wIds('question-tags', 'medio').length, 1);
  let sel = T.computePlanSelection('medio', 12, { focusSkill:'writing', focusTema:'question-tags' });
  const pool = T.buildPlanPool('medio', sel);
  assert.strictEqual(pool.length, sel.mistakeCount + Object.keys(sel.bySkill).reduce((n, k) => n + sel.bySkill[k], 0));
  assert(pool.filter(e => e.focus).length <= 1);
  sel = T.computePlanSelection('facil', 12, { focusSkill:'writing', focusTema:'question-tags' });   // sin consignas en este nivel
  assert(!sel.focus || sel.focus.skill !== 'writing');
  sel = T.computePlanSelection('facil', 12, { focusSkill:'writing', focusTema:'inventado' });
  assert(!sel.focus || sel.focus.skill !== 'writing');
  assert.strictEqual(T.contentForTema('question-tags', 'writing').practiceHref, 'writing.html', 'sin consignas en el nivel: la página de Writing');
});
test('el Plan sin foco en la URL sigue al tema de Writing que detectó el diagnóstico', ()=>{
  setProgress(T, wWeak('comparativos'));
  const sel = T.computePlanSelection('facil', 12, {});
  assert.strictEqual(sel.focus.skill, 'writing'); assert.strictEqual(sel.focus.temaId, 'comparativos');
});
function wPlanFor(temaId, history, results){
  const s = wsession(0, results);
  setProgress(T, history.concat([s]));
  return T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema:temaId, focusSkill:'writing' });
}
test('writing: al terminar el tema y SIGUE débil -> seguir practicando Writing (+ clase si existe)', ()=>{
  const ins = wPlanFor('presente-simple', wWeak('presente-simple'), wres(wIds('presente-simple', 'facil'), 6, 17));
  assert(ins.tema && ins.tema.needsMore);
  assert(/^En Presente simple acertaste \d+ de 6\. Todavía conviene reforzarlo\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert.strictEqual(ins.actions[0].title, 'Seguir practicando Presente simple');
  assert(/habilidad=writing&tema=presente-simple/.test(ins.actions[0].href), ins.actions[0].href);
  assert.strictEqual(ins.actions[1].href, 'articulo-presente-simple.html' + VIA('presente-simple'));
});
test('writing: tema que MEJORA deja de priorizarse; las respuestas de Gramática del mismo tema no cuentan en este resumen', ()=>{
  const wp = wIds('comparativos', 'facil'), gp = itemsOfTema(T, 'comparativos');
  const results = wres(wp, 14, 100, 2).concat(answers(gp, 6, 0));          // fallos de Gramática mezclados en la sesión
  const ins = wPlanFor('comparativos', wWeak('comparativos', [12, 11]), results);
  assert(ins.tema && !ins.tema.needsMore && /^En Comparativos acertaste 14 de 14\. Ya vas bien en este tema\.$/.test(ins.lines[0].text), ins.lines[0].text);
  assert(ins.actions.every(a => !/Seguir practicando/.test(a.title) && !/habilidad=writing&tema=comparativos/.test(a.href)), JSON.stringify(ins.actions));
  const d = T.computeDiagnosis();
  const st = (wUnit(d).temaStats || []).find(s => s.id === 'comparativos');
  assert(st && st.current >= 75 && st.trend === 'up', 'mejora en Writing: ' + (st && st.current));
  assert(!d.today || d.today.tema !== 'comparativos' || !/Writing/.test(d.today.title));
});
test('Mis errores: errores de Writing de un tema -> "Sobre todo en X" con práctica de Writing; consignas generales -> como antes', ()=>{
  const ids = wIds('comparativos', 'facil');
  setProgress(T, wWeak('comparativos'));
  const g = T.computeMistakePatterns(mistakeStats(ids.slice(0, 4))).groups.find(x => x.key === 'skill:writing');
  assert(g && g.temaContent && g.temaContent.id === 'comparativos');
  eq(linksIn(T.temaLinksHtml(g.temaContent)), ['plan-estudio.html?habilidad=writing&tema=comparativos&empezar=1']);
  const g2 = T.computeMistakePatterns(mistakeStats(wGeneral('facil').slice(0, 4))).groups.find(x => x.key === 'skill:writing');
  assert(g2 && !g2.temaContent);
});
test('Leo AI (Writing): el tema viaja como contexto corto solo si la consigna lo tiene; protecciones intactas', ()=>{
  const mapped = wAll.find(x => x.level === 'facil' && wTema(x) === 'comparativos'), general = wAll.find(x => x.level === 'facil' && !wTema(x));
  const p1 = T.buildLeoAiPayload({ kind:'writing', item:mapped, userAnswer:'My car is bigger than yours', isOk:true });
  assert.strictEqual(p1.topic, 'Comparativos'); assert(JSON.stringify(p1).length < 800);
  const p2 = T.buildLeoAiPayload({ kind:'writing', item:general, userAnswer:'I like pizza a lot', isOk:true });
  assert.strictEqual(p2.topic, '');
  assert.strictEqual(T.buildLeoAiPayload({ kind:'writing', item:mapped, userAnswer:'car', isOk:false }), null, 'una palabra: sin IA');
  assert.strictEqual(T.buildLeoAiPayload({ kind:'writing', item:mapped, userAnswer:'   ', isOk:false }), null, 'vacío: sin IA');
});
test('sin temas.js, Writing funciona como antes', ()=>{
  setProgress(T0, wWeak('comparativos'));
  const d = T0.computeDiagnosis();
  const u = d.units.find(x => x.key === 'skill:writing');
  assert(!u || !u.focusTema);
  if(d.today) assert(!d.today.tema && !/tema=/.test(d.today.href));
});


/* ================= AUDITORÍA FINAL: regresiones de integración entre fases ================= */
console.log('\nAuditoría: integración entre habilidades');
test('evidencia: el MISMO ejercicio repetido no cuenta como tema (hacen falta 2+ ejercicios distintos)', ()=>{
  const irr1 = irr.slice(0, 1);
  setProgress(T, [ session(2, answers(irr1, 8, 0)), session(1, answers(reg, 10, 90)) ]);
  const d = T.computeDiagnosis();
  const u = d.units.find(x => x.key === 'family:pasado');
  assert(u && !(u.temaStats || []).some(s => s.id === 'verbos-irregulares'), 'un solo ejercicio fallado 8 veces no es un tema débil');
});
test('"Hoy te conviene" recuerda de qué habilidad es el tema y el diagnóstico de Gramática no esconde botones por un tema de otra habilidad', ()=>{
  assert.strictEqual(T.todayGrammarTema({ today:{ tema:'x', temaSkill:'writing' } }), null);
  assert.strictEqual(T.todayGrammarTema({ today:{ tema:'x', temaSkill:'gramatica' } }), 'x');
  assert.strictEqual(T.todayGrammarTema({ today:{ tema:'x' } }), 'x');
  setProgress(T, wWeak('comparativos'));
  const a = readyDiag(T).today;
  assert.strictEqual(a.temaSkill, 'writing');
  setProgress(T, weakIrregularHistory());
  assert.strictEqual(readyDiag(T).today.temaSkill, 'gramatica');
  setProgress(T, vocabWeakHistory('vocab-compras'));
  assert.strictEqual(readyDiag(T).today.temaSkill, 'vocabulario');
  setProgress(T, lisWeak('listening-numeros'));
  assert.strictEqual(readyDiag(T).today.temaSkill, 'listening');
});
test('resumen de Writing mejorado: si Gramática del MISMO tema sigue débil, esa sigue siendo la siguiente recomendación', ()=>{
  const gp = itemsOfTema(T, 'presente-simple', 'facil'), wp = wIds('presente-simple', 'facil');
  const hist = [ session(1, answers(gp, 12, 10)), wsession(12, wres(wp, 10, 10)), wsession(11, wres(wGeneral('facil'), 8, 90)) ];
  const results = wres(wp, 14, 100, 1);
  const s = wsession(0, results);
  setProgress(T, hist.concat([s]));
  const ins = T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema:'presente-simple', focusSkill:'writing' });
  assert(ins.tema && !ins.tema.needsMore, 'Writing de ese tema mejoró');
  assert(ins.actions.some(a => /foco=presente-simple&tema=presente-simple/.test(a.href)), 'la siguiente necesidad (Gramática) no se debe tapar: ' + JSON.stringify(ins.actions.map(a => a.href)));
});
test('Leo AI no sugiere temas que salen de las estadísticas de Writing (su práctica es otra habilidad)', ()=>{
  setProgress(T, wWeak('comparativos'));
  assert(!T.leoAiTemaPool([], []).includes('comparativos'));
});
test('respuestas de 0-1 palabra no cuentan en el resultado del tema de la sesión', ()=>{
  const ids = wIds('comparativos', 'facil');
  const results = wres(ids, 3, 100).concat(wres(ids, 5, 0, 0, { lowEffort:true }));
  const s = wsession(0, results);
  setProgress(T, wWeak('comparativos', [12, 11]).concat([s]));
  const ins = T.computeSessionInsight(results, s.startedAt, 'plan', { focusTema:'comparativos', focusSkill:'writing' });
  assert(ins.tema && ins.tema.n === 3 && ins.tema.ok === 3, JSON.stringify(ins.tema && { n: ins.tema.n, ok: ins.tema.ok }));
});
test('clase compartida con temas de vocabulario/listening: el contexto y la práctica son de la habilidad que la recomendó', ()=>{
  let { body } = fakeBody();
  assert.strictEqual(T.renderArticleTema('articulo-numeros-en-ingles.html', params('tema=vocab-numeros&via=rec'), body), true);
  assert.strictEqual(body.querySelector('.tema-context').innerHTML, 'Llegaste aquí para reforzar <b>Números, precios y datos personales</b>.');
  assert(body.querySelector('.tema-cta').innerHTML.includes('href="plan-estudio.html?tema=vocab-numeros&empezar=1"'));
  ({ body } = fakeBody());
  T.renderArticleTema('articulo-numeros-en-ingles.html', params('tema=listening-numeros&via=rec'), body);
  assert(body.querySelector('.tema-cta').innerHTML.includes('href="plan-estudio.html?tema=listening-numeros&empezar=1"'));
  ({ body } = fakeBody());
  T.renderArticleTema('articulo-numeros-en-ingles.html', params('tema=numeros-basicos&via=rec'), body);
  assert(body.querySelector('.tema-cta').innerHTML.includes('foco=bases&tema=numeros-basicos'));
});
test('Plan: combinaciones de parámetros nunca mezclan habilidades ni dejan una sesión rota', ()=>{
  setProgress(T, []);
  const total = sel => sel.mistakeCount + Object.keys(sel.bySkill).reduce((n, k) => n + sel.bySkill[k], 0);
  const cases = [
    [{ focusFamily:'pasado', focusTema:'verbos-irregulares' }, 'gramatica'],
    [{ focusTema:'verbos-irregulares' }, 'gramatica'],
    [{ focusTema:'vocab-compras' }, 'vocabulario'],
    [{ focusTema:'listening-numeros' }, 'listening'],
    [{ focusSkill:'writing', focusTema:'comparativos' }, 'writing'],
    [{ focusSkill:'writing', focusTema:'comparativos', focusFamily:'pasado' }, 'writing'],
    [{ focusSkill:'writing', focusTema:'vocab-compras' }, null],          // ese tema no tiene consignas de Writing
    [{ focusSkill:'writing', focusTema:'listening-numeros' }, null],
    [{ focusFamily:'pasado', focusTema:'comparativos' }, 'gramatica'],     // tema de otra familia: queda la familia
    [{ focusFamily:'inventada', focusTema:'inventado' }, null],
    [{}, null]
  ];
  cases.forEach(([o, want])=>{
    const sel = T.computePlanSelection('facil', 12, o);
    const got = sel.focus ? sel.focus.skill : null;
    assert.strictEqual(got, want, JSON.stringify(o) + ' -> ' + got);
    const pool = T.buildPlanPool('facil', sel);
    assert.strictEqual(pool.length, total(sel), 'duración intacta ' + JSON.stringify(o));
    assert.strictEqual(new Set(pool.map(e => e.item.id)).size, pool.length);
    if(want === 'gramatica') assert(pool.filter(e => e.focus).every(e => e.kind === 'grammar'));
    if(want === 'writing') assert(pool.filter(e => e.focus).every(e => e.kind === 'writing'));
  });
});
test('la página de cada habilidad que muestra resumen carga el registro (si no, el tema no aparece al terminar)', ()=>{
  ['gramatica', 'vocabulario', 'listening', 'writing', 'mixto', 'plan-estudio', 'practica-miembros', 'errores', 'progreso', 'miembros'].forEach(f=>{
    assert(/<script src="temas\.js\?v=/.test(fs.readFileSync(path.join(root, f + '.html'), 'utf8')), f + '.html sin temas.js');
  });
  // la práctica gratis NO carga el registro (no debe cambiar)
  assert(!/temas\.js/.test(fs.readFileSync(path.join(root, 'practica.html'), 'utf8')));
  // ninguna página lo carga dos veces
  fs.readdirSync(root).filter(f => f.endsWith('.html')).forEach(f => assert(((fs.readFileSync(path.join(root, f), 'utf8').match(/temas\.js\?v=/g)) || []).length <= 1, f));
});
test('un artículo leído NO cambia ninguna señal: la recomendación sale solo de respuestas', ()=>{
  setProgress(T, weakIrregularHistory());
  const before = JSON.stringify(T.computeDiagnosis().actions);
  const { body } = fakeBody();
  T.renderArticleTema('articulo-verbos-irregulares.html', params('tema=verbos-irregulares&via=rec'), body);
  assert.strictEqual(JSON.stringify(T.computeDiagnosis().actions), before);
});

test('clases: los visitantes sin cuenta guardada no hacen ninguna consulta (la pista local solo ahorra trabajo, no da acceso)', ()=>{
  delete store['leo_member_hint'];
  assert.strictEqual(T.hasLocalAccountHint(), false);
  store['leo_member_hint'] = JSON.stringify({ m:1, t:Date.now() });
  assert.strictEqual(T.hasLocalAccountHint(), true);
  delete store['leo_member_hint'];
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert(/hasLocalAccountHint\(\) \|\| !LeoBackend\.isConfigured|!hasLocalAccountHint\(\)/.test(app));
  assert(/getMemberProfile\(\)\.then\(profile=>\{\s*if\(profile && profile\.is_member\) renderArticleTema/.test(app), 'el botón solo se pinta si el servidor confirma is_member');
});

/* ---------- tema paraguas (cuantificadores): no tiene topics propios ---------- */
console.log('\nTema paraguas');
test('"cuantificadores" (paraguas sin topics) nunca se recomienda ni queda como práctica vacía', ()=>{
  const ids = itemsOfFamily(T, 'cuantificadores', 'facil');
  assert(ids.length >= 8);
  setProgress(T, [session(3, answers(ids, 12, 20)), session(2, answers(ids, 12, 20, 3)), session(1, answers(ids, 12, 20, 6))]);
  const d = readyDiag(T);
  assert.strictEqual(d.weak.id, 'cuantificadores');                      // la FAMILIA sí se detecta, como siempre
  const temaIds = [];
  d.units.forEach(u => (u.temaStats || []).forEach(s => temaIds.push(s.id)));
  if(d.weak.focusTema) temaIds.push(d.weak.focusTema.id);
  assert(temaIds.length > 0 && !temaIds.includes('cuantificadores'), 'el diagnóstico apunta a temas reales: ' + temaIds.join(','));
  assert(!/tema=cuantificadores(?![-\w])/.test(JSON.stringify(d)), 'ningún enlace del diagnóstico usa el paraguas como tema');
  checkAction(d.today);
  // aunque alguien escriba ?tema=cuantificadores en la URL: cae a la familia, con ejercicios reales
  assert.strictEqual(T.temaHasItemsAt('cuantificadores', 'facil'), false);
  const sel = T.computePlanSelection('facil', 9, { focusFamily:'cuantificadores', focusTema:'cuantificadores' });
  const pool = T.buildPlanPool('facil', sel);
  assert(pool.length > 0 && pool.every(e => e.item && e.item.id), 'el Plan quedó vacío o roto');
  const c = T.contentForTema('cuantificadores');
  assert(c && /foco=cuantificadores/.test(c.practiceHref) && !c.lesson && !c.quick);
});

console.log(`\n${passed} pruebas correctas`);
