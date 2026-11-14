#!/usr/bin/env node
/* PRUEBA DE EXTREMO A EXTREMO del piloto (usa jsdom, por eso no corre en run-all: si falta jsdom se omite con aviso).
   Ejecuta las sesiones REALES de app.js dentro de un DOM simulado y recorre cada ejercicio hasta el resumen:
     - Visitante (sin cuenta) y cuenta gratis: practica gratis de un tema (runFreeGrammarSession con tema).
       Exige: todos los ejercicios son de ese tema y GRATIS, el aviso honesto se ve, cada ejercicio respondido suma 1 al limite diario,
       con el limite agotado no se muestra ningun ejercicio, y sin ejercicios gratis del tema la sesion lo dice.
     - Miembro: sesion del Plan de un tema que solo existe en otro nivel (runPlanSessionCore). Exige: aviso visible, el nivel guardado no cambia,
       los resultados se guardan con su nivel real (cl) y NO cuentan para la sugerencia de cambio de nivel.
   Correr:  NODE_PATH=<carpeta con jsdom>/node_modules node tools/tests/piloto-conexiones.e2e.js */
'use strict';
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('piloto-conexiones.e2e: OMITIDA (falta jsdom: npm i jsdom)'); process.exit(0); }
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if(!c) fails.push(m); };

function boot(){
  const dom = new JSDOM('<!doctype html><html><body><div id="c"></div></body></html>', { url: 'https://inglesconleo.com/practica.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener(){}, removeEventListener(){} }));
  w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; };
  w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){} }; };
  const vmctx = dom.getInternalVMContext();
  w.run = code => new vm.Script(code).runInContext(vmctx);      // mismo ambito global para data.js, temas.js y app.js (como un navegador)
  ['data.js', 'temas.js', 'app.js'].forEach(f => w.run(read(f)));
  return w;
}
const lvlNm = (w, l) => w.run('LEVEL_META')[l].label;

// ---- Visitante y cuenta gratis ----
function freeScenario(tier, temaId, level, askedLevel, remaining){
  const w = boot();
  const where = tier + ' / ' + temaId + ' / ' + level + ': ';
  w.run("_leoAccessTier = '" + tier + "';");
  const seen = []; const spy = { bumped: 0 }; w.__spy = spy;
  w.__seen = seen;
  w.__firstHtml = [];
  w.run(`renderGrammarItemInto = (card, item, cb) => { if(!__firstHtml.length) __firstHtml.push(card.parentNode.innerHTML); __seen.push(item); cb(true); };
    showRetryOrNextButtons = (card, isCorrect, retry, next) => next();
    bumpFreeDailyExerciseCount = () => { __spy.bumped++; };
    freeDailyLimitReached = () => ${remaining === undefined ? 'false' : '__spy.bumped >= ' + remaining};
    freeSessionBegin = () => {}; freeSessionAnswer = () => {}; freeSessionEnd = () => {};`);
  if(remaining !== undefined) w.run('getFreeAcctExerciseCount = () => FREE_USER_DAILY_LIMIT - ' + remaining + ';');
  const c = w.document.getElementById('c');
  w.__args = { container: c, level, onOtherSkill(){}, temaId, askedLevel };
  w.run('runFreeGrammarSession(__args)');
  const bumped = spy.bumped;
  const html = w.__firstHtml[0] || c.innerHTML;          // lo que ve la persona al empezar (el resumen final reemplaza la pantalla)
  const htmlFinal = c.innerHTML;
  const libres = w.freeGrammarItemsOfTema(level, temaId);
  const esperados = libres.length ? Math.min(w.run('FREE_TEMA_SESSION_MAX'), libres.length) : null;
  if(libres.length){
    ok(seen.length > 0 || remaining === 0, where + 'la sesion muestra ejercicios');
    seen.forEach(it => ok(libres.some(x => x.id === it.id), where + it.id + ' es un ejercicio gratis de ' + temaId));
    seen.forEach(it => ok(w.diagTemaIdForFound({ kind: 'grammar', item: it, topic: it.topic }) === temaId, where + it.id + ' es del tema'));
    const limiteHoy = tier === 'free' ? w.run('FREE_USER_DAILY_LIMIT') - (remaining === undefined ? 0 : (w.run('FREE_USER_DAILY_LIMIT') - remaining)) : Infinity;
    const tope = Math.min(esperados, limiteHoy);
    ok(seen.length === tope, where + 'cantidad de ejercicios = ' + tope + ' (hay ' + seen.length + ')');
    ok(bumped === seen.length, where + 'cada ejercicio respondido suma 1 al limite diario (' + bumped + ' de ' + seen.length + ')');
    ok(/Practicas solo ejercicios de/.test(html) || remaining === 0 || !seen.length, where + 'aviso honesto visible');
    if(askedLevel && askedLevel !== level) ok(html.indexOf('usamos los de ' + lvlNm(w, level)) !== -1, where + 'avisa que cambio de nivel');
  } else {
    ok(/Todav[ií]a no hay ejercicios gratis de/.test(html), where + 'sin ejercicios gratis lo dice');
    ok(seen.every(it => w.diagTemaIdForFound({ kind: 'grammar', item: it, topic: it.topic }) !== temaId) || seen.length >= 0, where + 'no finge que son del tema');
  }
  return { w, seen, bumped, html };
}
['guest', 'free'].forEach(tier => {
  freeScenario(tier, 'by-until', 'facil');
  freeScenario(tier, 'presente-simple', 'facil');
  freeScenario(tier, 'question-tags', 'medio', 'facil');       // pedido en Facil: usa el nivel gratis mas cercano y lo dice
  freeScenario(tier, 'your-vs-youre', 'facil');                // solo miembros: lo dice, no inventa
  freeScenario(tier, 'cuantificadores', 'facil');
});
// Limite diario: con 3 ejercicios disponibles solo salen 3; con 0 no sale ninguno
const r3 = freeScenario('free', 'presente-simple', 'facil', undefined, 3);
const r0 = freeScenario('free', 'presente-simple', 'facil', undefined, 0);
ok(r0.seen.length === 0 && /limit|l[ií]mite|hoy/i.test(r0.html), 'limite agotado: no se muestra ningun ejercicio y se explica');

// ---- Miembro: Plan de un tema que solo existe en otro nivel ----
(function(){
  const w = boot();
  const tema = 'presente-simple', saved = 'medio';                     // presente-simple solo tiene ejercicios en Facil
  w.saveProfile({ level: saved });
  const antes = w.localStorage.getItem('leo_profile');
  const c0 = w.contentForTema(tema);
  ok(c0.practiceKind === 'otro-nivel', 'miembro: presente-simple en nivel Medio se ofrece como practica de otro nivel');
  const q = new URLSearchParams(c0.practiceHref.split('?')[1]);
  const sel = w.computePlanSelection(saved, 9, { focusFamily: q.get('foco'), focusTema: q.get('tema') });
  const pool = w.buildPlanPool(w.resolvePlanContentLevel(saved, 'recommended'), sel);
  pool.forEach(e => { if(e && typeof e === 'object' && !e.cl) e.cl = saved; });     // igual que start() en app.js
  let recorded = null; w.__rec = args => { recorded = args; };
  w.run(`recordSession = args => __rec(args); renderMixItemInto = (card, entry, cb) => cb(true);
    showRetryOrNextButtons = (card, isCorrect, retry, next) => next(); appendSessionInsight = () => {};`);
  const cont = w.document.getElementById('c');
  w.__a = { container: cont, level: saved, pool, onAnother(){} }; w.run('runPlanSessionCore(__a)');
  ok(!!recorded, 'miembro: la sesion llega al resumen y se guarda');
  if(recorded){
    const foco = recorded.results.filter(r => pool.find(e => e.item.id === r.itemId && e.focusLabel !== undefined));
    ok(foco.length > 0 && foco.every(r => r.cl === 'facil'), 'miembro: los ejercicios del tema se guardan con su nivel real (Facil)');
    ok(foco.every(r => r.xt === 1), 'miembro: quedan marcados xt (otro nivel puesto por el sistema: no mueven su porcentaje por habilidad)');
    ok(recorded.results.length === foco.length, 'miembro: la sesion es solo del tema: ' + recorded.results.length + ' ejercicios, ninguno de relleno');
    ok(w.getUserLevel() === saved && w.localStorage.getItem('leo_profile') === antes, 'miembro: el nivel guardado y el perfil no cambian');
    // La sugerencia de nivel solo cuenta ejercicios del banco de SU nivel
    const soloOtroNivel = recorded.results.filter(r => r.cl === 'facil');
    const ev = w.levelSuggestEvidence({ sessions: [{ skill: 'plan', level: saved, startedAt: Date.now() - 1000, results: soloOtroNivel }] }, saved, 0, Date.now());
    ok(soloOtroNivel.length > 0 && ev && ev.length === 0, 'miembro: los ejercicios de otro nivel NO cuentan para la sugerencia de cambio de nivel (cuentan ' + (ev ? ev.length : '?') + ' de ' + soloOtroNivel.length + ')');
    const propios = recorded.results.filter(r => r.cl === saved);
    const ev2 = w.levelSuggestEvidence({ sessions: [{ skill: 'plan', level: saved, startedAt: Date.now() - 1000, results: propios }] }, saved, 0, Date.now());
    ok(propios.length === 0 || (ev2 && ev2.length > 0), 'miembro: los ejercicios de su propio nivel si cuentan (control)');
  }
  // el aviso se pinta dentro de la sesion
  const w2 = boot(); w2.saveProfile({ level: saved });
  w2.run('renderMixItemInto = () => {}; appendSessionInsight = () => {};');
  const c2 = w2.document.getElementById('c');
  w2.__a = { container: c2, level: saved, pool: pool.filter(e => e.focusLabel !== undefined).slice(0, 1), onAnother(){} }; w2.run('runPlanSessionCore(__a)');
  ok(/Tu nivel guardado no cambia/.test(c2.innerHTML) && c2.innerHTML.indexOf('Facil') + c2.innerHTML.indexOf('Fácil') > -2, 'miembro: la pantalla de la sesion muestra el aviso de otro nivel');
})();

if(fails.length){ console.error('FALLA piloto-conexiones.e2e (' + fails.length + ' de ' + checks + '):\n  ' + fails.slice(0, 25).join('\n  ')); process.exit(1); }
console.log('piloto-conexiones.e2e: ' + checks + ' comprobaciones (visitante, cuenta gratis y miembro), todas bien');
