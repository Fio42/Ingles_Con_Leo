#!/usr/bin/env node
/* Ficha del glosario -> ejercicio del mismo tema: el boton "Practicar gratis" de una ficha (glosario/<slug>/) abre la practica gratis
   de SU tema (practica.html?skill=grammar&tema=<id>) cuando la ficha es la explicacion de UN solo tema de gramatica con 3 ejercicios
   gratis o mas (sumando niveles). Si dos temas comparten ficha, o el tema tiene menos, el boton se queda general: no se promete un tema.
   Escribe tools/glosario/fichas-tema.json (lo lee tools/generar_glosario.js, asi una regeneracion no lo deshace).
   Corre con:  node tools/conexiones/enlazar-fichas.js --write   (aplica)
               node tools/conexiones/enlazar-fichas.js            (solo comprueba) */
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

const bySlug = {};
T.TEMAS.forEach(t => {
  if(t.skill === 'vocabulary' || t.skill === 'listening' || !t.glossary) return;
  (bySlug[t.glossary] = bySlug[t.glossary] || []).push(t);
});
const map = {};
Object.keys(bySlug).sort().forEach(slug => {
  const ts = bySlug[slug];
  if(ts.length !== 1 || freeCount(ts[0].id) < MIN_FREE) return;
  // Solo fichas cuya practica es de gramatica (las de vocabulario practican palabras, no el tema).
  const pg = path.join(root, 'glosario', slug, 'index.html');
  if(fs.existsSync(pg) && fs.readFileSync(pg, 'utf8').indexOf('href="/practica.html?skill=vocabulary" class="btn btn-primary"') !== -1) return;
  map[slug] = ts[0].id;
});
const jsonPath = path.join(root, 'tools', 'glosario', 'fichas-tema.json');
const json = JSON.stringify(map, null, 2) + '\n';
const write = process.argv.includes('--write');
const problems = [];
if(write) fs.writeFileSync(jsonPath, json);
else if(!fs.existsSync(jsonPath) || fs.readFileSync(jsonPath, 'utf8').replace(/\r\n/g, '\n') !== json) problems.push('fichas-tema.json no esta al dia');
const GENERIC = 'href="/practica.html?skill=grammar" class="btn btn-primary"';
let changed = 0;
Object.keys(map).forEach(slug => {
  const p = path.join(root, 'glosario', slug, 'index.html');
  if(!fs.existsSync(p)){ problems.push(slug + ': no existe la ficha'); return; }
  const raw = fs.readFileSync(p, 'utf8');
  const want = 'href="/practica.html?skill=grammar&amp;tema=' + map[slug] + '" class="btn btn-primary"';
  if(raw.indexOf(want) !== -1) return;
  if(raw.indexOf(GENERIC) === -1){ problems.push(slug + ' (' + map[slug] + '): el boton no es el generico, se revisa a mano'); return; }
  if(write){ fs.writeFileSync(p, raw.replace(GENERIC, want)); changed++; }
  else problems.push(slug + ': falta enlazar a ' + map[slug]);
});
if(write) console.log('Fichas actualizadas: ' + changed + ' de ' + Object.keys(map).length);
if(problems.length){ console.error('PROBLEMAS (' + problems.length + '):\n - ' + problems.join('\n - ')); process.exit(1); }
console.log('OK: ' + Object.keys(map).length + ' fichas enlazan a la practica gratis de su tema');
