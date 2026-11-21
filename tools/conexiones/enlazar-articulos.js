#!/usr/bin/env node
/* Explicacion -> ejercicio del mismo tema: el boton "Practicar gratis" de cada clase (articulo-*.html) abre la practica gratis
   de SU tema (practica.html?skill=grammar&tema=<id>) cuando el tema tiene 3 ejercicios gratis o mas. Si no los tiene,
   el boton se queda como esta (la practica general): no se promete un tema que no se puede practicar.
   Regla: el tema es el primero de temas.js, en gramatica, que tenga esta clase y 3+ ejercicios gratis (sumando niveles).
   Corre con:  node tools/conexiones/enlazar-articulos.js --write   (aplica)
               node tools/conexiones/enlazar-articulos.js            (solo comprueba; sale con error si falta o sobra algo) */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..');
const MIN_FREE = 3;
const noop = () => {};
const el = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, setAttribute: noop, appendChild: noop, addEventListener: noop, set innerHTML(v){}, get innerHTML(){ return ''; } });
const store = {};
const ctx = { console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
  localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, readyState: 'complete', body: el(), documentElement: el(), createElement: el },
  location: { hash: '', search: '', pathname: '/' }, navigator: { userAgent: 'node' }, addEventListener: noop,
  MutationObserver: function(){ return { observe: noop }; }, IntersectionObserver: function(){ return { observe: noop }; }, matchMedia: () => ({ matches: false, addEventListener: noop }) };
ctx.window = ctx; vm.createContext(ctx);
['data.js', 'temas.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + ';this.__t = { freeGrammarItemsOfTema, LEVELS, TEMAS };', ctx);
const T = ctx.__t;
const freeCount = id => T.LEVELS.reduce((n, l) => n + T.freeGrammarItemsOfTema(l, id).length, 0);

const plan = {};   // archivo -> tema
T.TEMAS.forEach(t => {
  if(!t.article || t.skill === 'vocabulary' || t.skill === 'listening' || plan[t.article]) return;
  if(freeCount(t.id) >= MIN_FREE) plan[t.article] = t.id;
});
const hrefFor = id => 'practica.html?skill=grammar&amp;tema=' + id;
const GENERIC = /href="practica\.html(?:\?skill=grammar)?"/;
const problems = []; let changed = 0;
Object.keys(plan).forEach(file => {
  const p = path.join(root, file);
  if(!fs.existsSync(p)){ problems.push(file + ': no existe'); return; }
  const raw = fs.readFileSync(p, 'utf8');
  const i = raw.indexOf('<div class="article-cta">');
  if(i === -1){ problems.push(file + ' (' + plan[file] + '): no tiene bloque article-cta; hay que agregarlo a mano'); return; }
  const j = raw.indexOf('</div>', i);
  const block = raw.slice(i, j);
  const want = 'href="' + hrefFor(plan[file]) + '"';
  if(block.indexOf(want) !== -1) return;
  if(!GENERIC.test(block)){ problems.push(file + ' (' + plan[file] + '): el boton no es el generico, se revisa a mano'); return; }
  problems.push(file + ': falta enlazar a ' + plan[file]);
  if(process.argv.includes('--write')){
    fs.writeFileSync(p, raw.slice(0, i) + block.replace(GENERIC, want) + raw.slice(j));
    changed++;
    problems.pop();
  }
});
if(process.argv.includes('--write')) console.log('Articulos actualizados: ' + changed + ' de ' + Object.keys(plan).length);
if(problems.length){ console.error('PROBLEMAS (' + problems.length + '):\n - ' + problems.join('\n - ')); process.exit(1); }
console.log('OK: ' + Object.keys(plan).length + ' articulos enlazan a la practica gratis de su tema');
