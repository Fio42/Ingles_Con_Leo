#!/usr/bin/env node
/* RECORRIDO: miembro con un Plan a medias pulsa "Practicar este tema" (plan-estudio.html?foco=..&tema=..&empezar=1).
   Debe abrir ESE tema, poder terminarlo, y dejar intacta la sesion pendiente del Plan; "Continuar mi plan" (sin tema) la retoma.
   Correr:  NODE_PATH=<carpeta con jsdom>/node_modules node tools/tests/practicar-tema-plan.e2e.js */
'use strict';
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('practicar-tema-plan.e2e: OMITIDA (falta jsdom)'); process.exit(0); }
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const dom = new JSDOM('<!doctype html><html><body><div id="c"></div></body></html>', { url: 'https://inglesconleo.com/plan-estudio.html', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;
w.HTMLElement.prototype.scrollIntoView = function(){};
w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener(){}, removeEventListener(){} }));
w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; };
w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){} }; };
const ctx = dom.getInternalVMContext();
const run = code => new vm.Script(code).runInContext(ctx);
['data.js', 'temas.js', 'app.js'].forEach(f => run(read(f)));
run("_leoAccessTier = 'member'; _startRouteSynced = true; setUserLevel('facil');");
const c = w.document.getElementById('c');
const text = () => c.textContent;
let n = 0; const ok = (cond, msg) => { n++; assert(cond, msg); };

// 1) Plan a medias guardado (como el de Leo): 9 ejercicios, va por el 3.
run("renderPlanIntro(document.getElementById('c'), { autoStart: true })");
const planKey = 'leo_inflight_plan_facil';
const keyOf = k => run("Object.keys(localStorage).filter(function(x){ return x.indexOf('" + k + "') === 0; })");
ok(run("loadInflightSession('plan','facil')"), 'el Plan normal guardo su sesion');
run("(function(){ var s = loadInflightSession('plan','facil'); s.idx = 2; saveInflightSession('plan','facil', s); })()");
const before = run("JSON.stringify(loadInflightSession('plan','facil'))");
const planFirst = JSON.parse(before).pool[2].item.id;

// 2) "Practicar este tema": ?foco=confusiones&tema=as-vs-like&empezar=1
run("renderPlanIntro(document.getElementById('c'), { focusFamily: 'confusiones', focusTema: 'as-vs-like', autoStart: true })");
const temaIds = run("(function(){ var o = []; LEVELS.forEach(function(l){ GRAMMAR_BANK[l].forEach(function(v){ v.forEach(function(b){ var t = temaForTopic(b.topic); if(t && t.id === 'as-vs-like') b.items.forEach(function(i){ o.push(i.id); }); }); }); }); return o; })()");
const shownPrompt = () => (c.querySelector('.session-card') || {}).textContent || '';
const poolNow = JSON.parse(run("JSON.stringify(loadInflightSession('plantema','as-vs-like'))")).pool;
ok(poolNow.length > 0 && poolNow.every(e => temaIds.indexOf(e.item.id) !== -1), 'la sesion pedida es solo del tema as-vs-like');
ok(!/Pregunta 3 de 9/.test(text()), 'no retomo el Plan a medias (' + text().slice(0, 120) + ')');
ok(run("JSON.stringify(loadInflightSession('plan','facil'))") === before, 'el Plan pendiente no se tocó al empezar el tema');

// 3) Terminar el tema (errores incluidos) con clics reales.
for(let i = 0; i < 40 && !c.querySelector('#planAnotherBtn'); i++){
  const next = [...c.querySelectorAll('button')].find(b => /Siguiente|Ver resultado/.test(b.textContent));
  if(next){ next.click(); continue; }
  const opt = [...c.querySelectorAll('.session-card button')].find(b => !b.disabled && !/Volver/.test(b.textContent) && b.textContent.trim());
  if(!opt) break; opt.click();
}
ok(c.querySelector('#planAnotherBtn'), 'termino el refuerzo y llego al resumen');
ok(run("JSON.stringify(loadInflightSession('plantema','as-vs-like'))") === 'null', 'la sesion del tema se limpia al terminar');
ok(run("JSON.stringify(loadInflightSession('plan','facil'))") === before, 'el Plan pendiente sigue idéntico tras terminar el tema (idx y resultados)');

// 4) "Continuar mi plan" retoma la sesion guardada.
run("renderPlanIntro(document.getElementById('c'), { autoStart: true })");
ok(/Pregunta 3 de/.test(text()), 'Continuar mi plan retoma la sesion guardada (' + text().slice(0, 100) + ')');
ok(JSON.parse(run("JSON.stringify(loadInflightSession('plan','facil'))")).pool[2].item.id === planFirst, 'sigue siendo el mismo ejercicio');
console.log('practicar-tema-plan.e2e: ' + n + ' comprobaciones, todas bien');
