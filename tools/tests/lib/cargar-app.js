/* Carga data.js, temas.js y app.js REALES en un navegador simulado minimo (sin red, sin Supabase, sin tocar archivos).
   Devuelve las funciones de app.js que las pruebas de conexiones necesitan y el "localStorage" simulado para poder
   comprobar que nada se escribe donde no debe. Uso: const { A, store, reset } = require('./lib/cargar-app'); */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const store = {}; const noop = () => {};
function node(tag){ const n = { tagName: tag, children: [], style: {}, className: '', dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, setAttribute: noop, addEventListener: noop, appendChild(c){ n.children.push(c); return c; }, querySelector: () => null, querySelectorAll: () => [] }; let h = ''; Object.defineProperty(n, 'innerHTML', { get(){ return h; }, set(v){ h = String(v); } }); return n; }
const ctx = { console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
  localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, key: i => Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
  document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, readyState: 'complete', body: node('body'), documentElement: node('html'), createElement: node },
  location: { hash: '', search: '', pathname: '/' }, navigator: { userAgent: 'node' }, addEventListener: noop,
  MutationObserver: function(){ return { observe: noop }; }, IntersectionObserver: function(){ return { observe: noop }; }, matchMedia: () => ({ matches: false, addEventListener: noop }) };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(read('data.js'), ctx);
vm.runInContext(read('temas.js'), ctx);
const NAMES = ['contentForTema', 'computePlanSelection', 'buildPlanPool', 'temaPlanHref', 'saveProfile', 'getUserLevel', 'getDiagItemIndex', 'diagTemaIdForFound',
  'temaHasItemsAt', 'familyHasItemsAt', 'nearestLevelWithTema', 'planHonestNoteHtml', 'resolvePlanContentLevel', 'loadProgress', 'LEVELS', 'TEMAS', 'TEMA_BY_ID',
  'freeGrammarItemsOfTema', 'freeLevelForTema', 'freeTemaNoteHtml', 'GRAMMAR_BANK', 'VOCAB_BANK', 'MEMBERS_ONLY_VARIANT_INDEX', 'FREE_SAMPLE_IDS', 'LEVEL_META'];
vm.runInContext(read('app.js') + '\n;this.__t = { ' + NAMES.join(', ') + ' };', ctx);
function reset(){ Object.keys(store).forEach(k => delete store[k]); }
module.exports = { A: ctx.__t, store, reset, root, read, run: code => vm.runInContext(code, ctx) };
