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
  const h3 = w.renderFreeSessionSummary({ title: '¡Listo!', score: '1 / 3', topics: ['x'], results: wrong(idsOf(w, 'causativos', 2)) });
  ok(!/Para reforzar/.test(h3), where + 'causativos: sin refuerzo exacto no se ofrece nada');
  // 4) error repetido: el tema con mas errores va primero
  const rep = w.renderFreeSessionSummary({ title: '¡Listo!', score: '0 / 3', topics: ['x'], results: wrong(idsOf(w, 'do-does', 2).concat(idsOf(w, 'verbo-have', 1))) });
  ok(/tema=do-does/.test(rep) && !/tema=verbo-have/.test(rep), where + 'error repetido: do-does (2 errores) desplaza a verbo-have (1)');
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
  ok(/data-rf="lesson"/.test(hq) && !/data-rf="practice"/.test(hq) && !/gramatica\.html/.test(hq), where + 'question-tags (sin familia): explicacion, sin boton hacia la practica general');
  ['hedging', 'inversion-enfasis', 'subjuntivo-formal'].forEach(id => ok(w.sessionReinforceHtml(JSON.parse(JSON.stringify(w.sessionReinforceRows(wrong(idsOf(w, id, 2)), { actions: [] }, new Set())))) === '', where + id + ': sin refuerzo exacto no sale la fila'));
}
if(fails.length){ console.error('FALLA refuerzo-exacto.e2e (' + fails.length + ' de ' + checks + '):\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('refuerzo-exacto.e2e: ' + checks + ' comprobaciones (visitante, cuenta gratis y miembro, con y sin refuerzo exacto), todas bien');
