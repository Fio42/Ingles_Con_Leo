#!/usr/bin/env node
/* RECORRIDOS del refuerzo exacto (usa jsdom; si falta, se omite con aviso). Ejecuta el app.js REAL en un DOM simulado:
     error en la practica -> resumen "Para reforzar" -> el enlace de practica abre de verdad ejercicios gratis de ESE tema.
   Visitante, cuenta gratis y miembro; incluye un error de un tema que todavia no tiene refuerzo (no se ofrece nada generico).
   Correr:  NODE_PATH=<carpeta con jsdom>/node_modules node tools/tests/refuerzo-exacto.e2e.js */
'use strict';
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('refuerzo-exacto.e2e: OMITIDA (falta jsdom: npm i jsdom)'); process.exit(0); }
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if(!c) fails.push(m); };
function boot(tier){
  const dom = new JSDOM('<!doctype html><html><body><div id="c"></div></body></html>', { url: 'https://inglesconleo.com/practica.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener(){}, removeEventListener(){} }));
  w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; };
  w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){} }; };
  const vmctx = dom.getInternalVMContext();
  w.run = code => new vm.Script(code).runInContext(vmctx);
  ['data.js', 'temas.js', 'app.js'].forEach(f => w.run(read(f)));
  w.run("_leoAccessTier = '" + tier + "'; setUserLevel('facil');");
  return w;
}
const idsOf = (w, temaId, n) => w.run(`(function(){ var out = []; LEVELS.forEach(function(l){ (GRAMMAR_BANK[l] || []).forEach(function(v){ v.forEach(function(b){ var t = temaForTopic(b.topic); if(t && t.id === '${temaId}') b.items.forEach(function(i){ if(out.length < ${n}) out.push(i.id); }); }); }); }); return out; })()`);
const wrong = ids => ids.map(itemId => ({ itemId, isCorrect: false }));
const hrefs = html => (html.match(/href="[^"]*"[^>]*data-rf="(practice|lesson|course)"/g) || []).map(s => ({ href: s.match(/href="([^"]*)"/)[1], kind: s.match(/data-rf="(\w+)"/)[1] }));

['guest', 'free'].forEach(tier => {
  const w = boot(tier); const where = tier + ': ';
  // 1) tema con ejercicios gratis: el enlace abre de verdad ejercicios de ese tema
  const html = w.renderFreeSessionSummary({ title: '¡Listo!', score: '1 / 3', topics: ['x'], results: wrong(idsOf(w, 'do-does', 2)) });
  const prac = hrefs(html).filter(h => h.kind === 'practice');
  ok(prac.length === 1 && prac[0].href === 'practica.html?skill=grammar&tema=do-does', where + 'do-does: un solo boton, practica gratis de ese tema (' + JSON.stringify(prac) + ')');
  const q = new URLSearchParams(prac[0].href.split('?')[1]);
  const w2 = boot(tier);
  const libres = w2.freeGrammarItemsOfTema(w2.run("freeLevelForTema('" + q.get('tema') + "', 'facil')"), q.get('tema'));
  ok(libres.length > 0, where + 'el destino tiene ejercicios gratis del tema');
  ok(libres.every(it => w2.diagTemaIdForFound({ kind: 'grammar', item: it, topic: it.topic }) === 'do-does'), where + 'y todos son de do-does');
  // 2) tema con explicacion pero sin ejercicios gratis: solo la explicacion
  const h2 = hrefs(w.renderFreeSessionSummary({ title: '¡Listo!', score: '1 / 3', topics: ['x'], results: wrong(idsOf(w, 'pasado-continuo', 2)) }));
  ok(h2.some(h => h.kind === 'lesson') && !h2.some(h => h.kind === 'practice'), where + 'pasado-continuo: explicacion y ninguna practica general (' + JSON.stringify(h2) + ')');
  // 3) tema sin refuerzo exacto: no sale el bloque
  w.run("TEMA_BY_ID['causativos'].glossary = null");
  const h3 = w.renderFreeSessionSummary({ title: '¡Listo!', score: '1 / 3', topics: ['x'], results: wrong(idsOf(w, 'causativos', 2)) });
  ok(!/Para reforzar/.test(h3), where + 'causativos sin ficha ni practica gratis: sin refuerzo exacto no se ofrece nada');
  // 4) error repetido: el tema con mas errores va primero
  const rep = w.renderFreeSessionSummary({ title: '¡Listo!', score: '0 / 3', topics: ['x'], results: wrong(idsOf(w, 'do-does', 2).concat(idsOf(w, 'in-on-at', 1))) });
  ok(/tema=do-does/.test(rep) && !/tema=in-on-at/.test(rep), where + 'error repetido: do-does (2 errores) desplaza a in-on-at (1)');
  // 5) nada apunta a una pagina de miembros ni a la practica general
  [html, rep].forEach(h => hrefs(h).filter(x => x.kind === 'practice').forEach(x => ok(/^practica\.html\?skill=grammar&tema=/.test(x.href), where + 'enlace de practica no es general: ' + x.href)));
  ok(!/href="miembros\.html/.test(html), where + 'sin invitacion a pagar fuera del limite');
});
// Miembro
{
  const w = boot('member'); const where = 'miembro: ';
  const rows = JSON.parse(JSON.stringify(w.sessionReinforceRows(wrong(idsOf(w, 'do-does', 2)), { actions: [] }, new Set())));
  ok(rows.length === 1 && /^plan-estudio\.html\?/.test(rows[0].practiceHref) && /tema=do-does/.test(rows[0].practiceHref), where + 'do-does abre su Plan enfocado en el tema');
  const hq = w.sessionReinforceHtml(JSON.parse(JSON.stringify(w.sessionReinforceRows(wrong(idsOf(w, 'question-tags', 2)), { actions: [] }, new Set()))));
  ok(/data-rf="lesson"/.test(hq) && /plan-estudio\.html\?foco=preguntas/.test(hq) && !/gramatica\.html/.test(hq), where + 'question-tags: explicacion y Plan enfocado en el tema, sin practica general');
  ['hedging', 'inversion-enfasis', 'subjuntivo-formal'].forEach(id => w.run("TEMA_BY_ID['" + id + "'].glossary = null; TEMA_BY_ID['" + id + "'].family = null"));
  ['hedging', 'inversion-enfasis', 'subjuntivo-formal'].forEach(id => ok(w.sessionReinforceHtml(JSON.parse(JSON.stringify(w.sessionReinforceRows(wrong(idsOf(w, id, 2)), { actions: [] }, new Set())))) === '', where + id + ': sin refuerzo exacto no sale la fila'));
}
// Recorrido nuevo: ejercicio -> error -> explicacion (fichas escritas a partir de los errores de los propios ejercicios)
['guest', 'free', 'member'].forEach(tier => {
  const w = boot(tier); const where = tier + ' (ficha nueva): ';
  [['g-facil-alo-2', 'a-lot-of', 'much-many'], ['g-facil-sap-2', 'any-vs-some', 'some-any']].forEach(([itemId, slug]) => {
    const rows = JSON.parse(JSON.stringify(w.sessionReinforceRows([{ itemId, isCorrect: false }], { actions: [] }, new Set())));
    ok(rows.length === 1 && rows[0].lesson && new RegExp('/glosario/' + slug + '/').test(JSON.stringify(rows[0].lesson)), where + itemId + ' lleva a la ficha ' + slug + ' (' + JSON.stringify(rows[0] && rows[0].lesson) + ')');
  });
  [['condicionales', 'articulo-condicionales-1-y-2.html'], ['wish', 'wish-if-only'], ['estilo-indirecto', 'reported-speech'], ['relativas', 'relative-clauses'], ['causativos', 'have-something-done'], ['preposiciones-movimiento', 'to-into-from'], ['preposiciones-sutiles', 'adjective-prepositions'], ['basicos-ingles', 'plural-colores-dias'], ['palabras-parecidas', 'advice-lay-further-quiet'], ['matices-formales', 'formal-natural-ed-ing'], ['inversion-enfasis', 'inversion-enfatica'], ['subjuntivo-formal', 'formal-subjunctive'], ['hedging', 'hedging-arguably-tend-to']].forEach(([tema, slug]) => {
    const rows = JSON.parse(JSON.stringify(w.sessionReinforceRows(wrong(idsOf(w, tema, 1)), { actions: [] }, new Set())));
    ok(rows.length === 1 && rows[0].lesson && JSON.stringify(rows[0].lesson).indexOf(slug.indexOf('.html') > 0 ? slug : '/glosario/' + slug + '/') !== -1, where + tema + ' -> ' + slug + ' (' + JSON.stringify(rows[0] && rows[0].lesson) + ')');
  });
});
/* Enlaces directos por tema (gramatica sin familia antes, vocabulario y listening): se abre la URL real y cada ejercicio mostrado es del tema exacto. */
function abrir(tier, search){
  const w = boot(tier);
  w.history.pushState({}, '', '/practica.html' + search);
  w.document.body.innerHTML = '<div id="lv"></div><div id="tabs"></div><div id="head"></div><div id="body"></div>';
  w.run("initFreePractice({ levelsEl: document.getElementById('lv'), tabsEl: document.getElementById('tabs'), headEl: document.getElementById('head'), bodyEl: document.getElementById('body') })");
  return w;
}
const IDS_VOCAB = "(function(t){ var o = {}; Object.keys(VOCAB_BANK).forEach(function(l){ VOCAB_BANK[l].forEach(function(v){ v.forEach(function(it){ if(vocabTemaIdForItem(it.id) === t) o[it.word] = 1; }); }); }); return Object.keys(o); })";
['guest', 'free'].forEach(tier => {
  const where = tier + ' (enlace por tema): ';
  [['vocabulary', 'vocab-numeros', 'vocabTemaIdForItem'], ['listening', 'listening-numeros', 'listeningTemaIdForItem'], ['grammar', 'do-does', null]].forEach(([skill, tema, fn]) => {
    const w = abrir(tier, '?skill=' + skill + '&tema=' + tema);
    const body = w.document.getElementById('body').textContent + w.document.getElementById('head').textContent;
    const label = w.run("TEMA_BY_ID['" + tema + "'].label");
    ok(body.indexOf(label) !== -1 || /Practicas solo ejercicios|Todav/.test(body), where + tema + ' muestra el aviso del tema (' + body.slice(0, 120) + ')');
    ok(/Practicas solo ejercicios de/.test(w.document.body.innerHTML), where + tema + ' abre en modo tema, no en la practica general');
    // Los ejercicios que el nivel tiene gratis de este tema, y solo esos, son los que se pueden sacar.
    const lvl = w.run("freeLevelForTema('" + tema + "', getUserLevel ? getUserLevel() : 'facil') || 'facil'");
    const items = w.run("freeTemaItems('" + lvl + "', '" + tema + "').length");
    ok(items > 0, where + tema + ' tiene ejercicios gratis en ' + lvl);
    if(fn) ok(w.run("freeTemaItems('" + lvl + "', '" + tema + "').every(function(it){ return " + fn + "(it.id) === '" + tema + "'; })"), where + tema + ': todos los ejercicios son del tema exacto');
    else { const all = idsOf(w, tema, 9999); ok(w.run("freeTemaItems('" + lvl + "', '" + tema + "').map(function(it){ return it.id; })").every(id => all.indexOf(id) !== -1), where + tema + ': todos los ejercicios son de gramatica del tema exacto'); }
  });
  // Un tema de otra habilidad no se cuela: ?skill=grammar&tema=vocab-numeros ignora el tema.
  const x = abrir(tier, '?skill=grammar&tema=vocab-numeros');
  ok(!/Practicas solo ejercicios de/.test(x.document.body.innerHTML), where + 'tema de vocabulario en la pestana de gramatica se ignora');
});
if(fails.length){ console.error('FALLA refuerzo-exacto.e2e (' + fails.length + ' de ' + checks + '):\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('refuerzo-exacto.e2e: ' + checks + ' comprobaciones (visitante, cuenta gratis y miembro, con y sin refuerzo exacto), todas bien');
