#!/usr/bin/env node
/* Promesa vs destino: cuando un boton dice "Practicar <tema>", ¿los ejercicios que realmente se abren son de ese tema?
   Usa data.js, temas.js y app.js REALES (las mismas funciones que corre el navegador: contentForTema, temaPlanHref, computePlanSelection,
   buildPlanPool). No toca la red, Supabase ni los archivos del sitio.
   Corre con:  node tools/tests/promesas.test.js             (desde la carpeta inglesconLeo)
   Es un TRINQUETE: hoy hay huecos conocidos (ver tools/conexiones/linea-base-promesas.json). La prueba falla si algo EMPEORA
   (un tema nuevo cuyo boton no llega a ejercicios de ese tema, o una celda que antes funcionaba y deja de hacerlo) y avisa cuando MEJORA.
   Despues de arreglar algo a proposito:  node tools/tests/promesas.test.js --actualizar-linea-base   y se revisa el diff del JSON.
   Categorias de lo que se abre, de mejor a peor:
     tema      hay ejercicios de ESE tema en la sesion de foco
     familia   solo ejercicios de la familia (el boton nombra el tema y se abre otro)
     sin_foco  el Plan ignora el foco y arma una sesion normal
     general   el destino es una pagina general (gramatica.html, practica.html) */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..');
const BASE_FILE = path.join(root, 'tools', 'conexiones', 'linea-base-promesas.json');
const UPDATE = process.argv.includes('--actualizar-linea-base');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

/* ---- navegador simulado minimo + los archivos reales ---- */
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
vm.runInContext(read('app.js') + '\n;this.__t = { contentForTema, computePlanSelection, buildPlanPool, temaPlanHref, saveProfile, getDiagItemIndex, diagTemaIdForFound, temaHasItemsAt, LEVELS, TEMAS, GRAMMAR_BANK, MEMBERS_ONLY_VARIANT_INDEX, FREE_SAMPLE_IDS };', ctx);
const A = ctx.__t;
const LEVELS = A.LEVELS;
const RANK = { tema: 0, familia: 1, sin_foco: 2, general: 3 };

/* ---- 1. Miembros: lo que abre cada boton, por tema y por nivel ---- */
function evaluate(href, level, temaId){
  if(!/^plan-estudio\.html/.test(href)) return { cat: 'general', n: 0 };
  const q = new URLSearchParams(href.split('?')[1] || '');
  const sel = A.computePlanSelection(level, 9, { focusFamily: q.get('foco') || undefined, focusTema: q.get('tema') || undefined, focusSkill: q.get('habilidad') === 'writing' ? 'writing' : undefined });
  if(!sel.focus) return { cat: 'sin_foco', n: 0 };
  const idx = A.getDiagItemIndex();
  const focusEntries = A.buildPlanPool(level, sel).filter(e => e.focusLabel !== undefined);
  const n = focusEntries.filter(e => { const f = idx.get(e.item.id); return f && A.diagTemaIdForFound(f) === temaId; }).length;
  return n > 0 ? { cat: 'tema', n } : { cat: focusEntries.length ? 'familia' : 'sin_foco', n: 0 };
}
const cells = {};      // "<camino>|<tema>|<nivel>" -> categoria
const detail = [];
A.TEMAS.forEach(t => LEVELS.forEach(lvl => {
  A.saveProfile({ level: lvl });
  const c = A.contentForTema(t.id);
  const a = evaluate(c.practiceHref, lvl, t.id);
  cells['resumen|' + t.id + '|' + lvl] = a.cat; detail.push({ camino: 'resumen', tema: t.id, nivel: lvl, href: c.practiceHref, ...a });
  if(t.family || t.skill === 'vocabulary' || t.skill === 'listening'){   // clases y fichas (bloque tema-cta y gl-tema) siempre ofrecen el Plan con el tema
    const href = A.temaPlanHref(t, true);
    const b = evaluate(href, lvl, t.id);
    cells['clase|' + t.id + '|' + lvl] = b.cat; detail.push({ camino: 'clase', tema: t.id, nivel: lvl, href, ...b });
  }
}));

/* ---- 2. Tarjetas del inicio: ¿se puede llegar a ese tema desde la practica gratis? ---- */
const literal = (src, name) => { const m = src.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\});')); if(!m) throw new Error('No encuentro ' + name); return vm.runInNewContext('(' + m[1] + ')'); };
const LABELS = literal(read('tools/generar_mini_lecciones.js'), 'LABELS');
const MINI = vm.runInNewContext(read('mini-lecciones.js') + ';MINI_LESSONS');
// Cada tarjeta del inicio trae (columna 4) lo que abre su boton: tema = practica gratis de ese tema; clase = su explicacion; general = practica general con texto honesto.
// La prueba de aceptacion (piloto-conexiones.test.js) exige que eso sea verdad; aqui solo se vigila que ninguna tarjeta EMPEORE.
const cards = {};
MINI.forEach(m => { cards['inicio|' + m[0]] = m[3] || 'general'; });

/* ---- 4. Botones nuevos que prometen un tema: detector de frases de promesa ----
   Cuenta, por archivo, las frases que prometen practica de un tema. Si aparece un sitio NUEVO o mas frases que en la linea base,
   la prueba falla hasta que ese boton se registre en tools/conexiones/destinos-dinamicos.json y se compruebe su destino. */
const stripJs = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
const stripHtml = t => t.replace(/<!--[\s\S]*?-->/g, '');
const PROMISE = [/Practicar este tema/g, /Practicar con otros ejercicios|Practicar ejercicios (distintos|nuevos)/gi, /practiceLabel\s*[:=]/g, /Practicar\s*\$\{/g];
const promFiles = fs.readdirSync(root).filter(f => /\.(js|html)$/.test(f) && !/(^|-)data\.js$|^mini-lecciones\.js$/.test(f))
  .concat(fs.readdirSync(path.join(root, 'tools')).filter(f => /^generar_.*\.js$/.test(f)).map(f => 'tools/' + f));
const promCount = {};
promFiles.forEach(f => { let t = read(f); t = f.endsWith('.html') ? stripHtml(t) : stripJs(t); const n = PROMISE.reduce((a, re) => a + (t.match(re) || []).length, 0); if(n) promCount[f] = n; });
console.log('Frases que prometen practica de un tema, por archivo: ' + JSON.stringify(promCount));

/* ---- 3. Resumen y trinquete ---- */
const tally = obj => Object.keys(obj).reduce((acc, k) => { const g = k.split('|')[0]; acc[g] = acc[g] || {}; acc[g][obj[k]] = (acc[g][obj[k]] || 0) + 1; return acc; }, {});
const T1 = tally(cells), T2 = tally(cards);
console.log('Boton "Practicar <tema>" de miembros: que se abre (' + A.TEMAS.length + ' temas x ' + LEVELS.length + ' niveles)');
['resumen', 'clase'].forEach(g => console.log('  ' + (g === 'resumen' ? 'resumen/Leo AI/Academia (contentForTema)' : 'clase y ficha (temaPlanHref)').padEnd(44) + JSON.stringify(T1[g])));
// Separar los huecos por nivel (el tema no tiene ejercicios en ese nivel) de los fallos reales (si los hay y aun asi no llega)
const split = { resumen: { tema: 0, sinEjerciciosEnNivel: 0, conEjerciciosYNoLlega: 0 }, clase: { tema: 0, sinEjerciciosEnNivel: 0, conEjerciciosYNoLlega: 0 } };
const realFails = [];
Object.keys(cells).forEach(k => { const [g, id, lvl] = k.split('|'); if(cells[k] === 'tema') split[g].tema++; else if(A.temaHasItemsAt(id, lvl)){ split[g].conEjerciciosYNoLlega++; realFails.push(k + ' -> ' + cells[k]); } else split[g].sinEjerciciosEnNivel++; });
if(realFails.length) console.log('  fallos reales (hay ejercicios en el nivel y no llega): ' + realFails.join(' ; '));
console.log('  de ellas, sin ejercicios del tema en ese nivel / con ejercicios y aun asi no llega: ' + JSON.stringify(split));
console.log('Tarjetas del inicio por lo que abre su boton (' + MINI.length + '): ' + JSON.stringify(T2.inicio));

const current = Object.assign({}, cells, cards);
Object.keys(promCount).forEach(f => { current['frases|' + f] = promCount[f]; });
if(UPDATE){
  fs.writeFileSync(BASE_FILE, JSON.stringify({ _leeme: 'Linea base de tools/tests/promesas.test.js. Cada clave es camino|tema|nivel (o inicio|tarjeta) y su valor, lo que se abre hoy. Se actualiza solo a proposito con --actualizar-linea-base y se revisa el diff.', celdas: current }, null, 0).replace(/,"/g, ',\n"') + '\n');
  console.log('linea base actualizada: ' + Object.keys(current).length + ' celdas');
  process.exit(0);
}
if(!fs.existsSync(BASE_FILE)){ console.error('FALLA promesas: falta ' + BASE_FILE + ' (corre con --actualizar-linea-base la primera vez)'); process.exit(1); }
const base = JSON.parse(read('tools/conexiones/linea-base-promesas.json')).celdas;
const order = { tema: 0, clase: 1, familia: 1, sin_foco: 2, general: 3 };
const worse = [], better = [], added = [], gone = [];
const phraseWorse = [];
Object.keys(current).forEach(k => { if(k.indexOf('frases|') === 0){ if(!(k in base) || current[k] > base[k]) phraseWorse.push(k.slice(7) + ': ' + (base[k] || 0) + ' -> ' + current[k]); return; } if(!(k in base)){ added.push(k); return; } const d = order[current[k]] - order[base[k]]; if(d > 0) worse.push(k + ': ' + base[k] + ' -> ' + current[k]); else if(d < 0) better.push(k + ': ' + base[k] + ' -> ' + current[k]); });
Object.keys(base).forEach(k => { if(!(k in current) && k.indexOf('frases|') !== 0) gone.push(k); });
// Celdas nuevas (tema, nivel o tarjeta nueva): deben nacer funcionando, no se aceptan en silencio.
const newBad = added.filter(k => order[current[k]] > 0);
let failed = false;
if(phraseWorse.length){ failed = true; console.error('FALLA promesas: hay frases nuevas que prometen practica de un tema (' + phraseWorse.join('; ') + ').\n  Registra el boton en tools/conexiones/destinos-dinamicos.json, comprueba a donde lleva y luego --actualizar-linea-base.'); }
if(worse.length){ failed = true; console.error('FALLA promesas: empeoro (' + worse.length + '):\n  ' + worse.slice(0, 20).join('\n  ')); }
if(newBad.length){ failed = true; console.error('FALLA promesas: contenido nuevo cuyo boton no llega a ejercicios de su tema (' + newBad.length + '):\n  ' + newBad.slice(0, 20).map(k => k + ' -> ' + current[k]).join('\n  ') + '\n  Conecta el tema (familia en temas.js, ejercicios en ese nivel, ficha) o, si es a proposito, --actualizar-linea-base.'); }
if(better.length || gone.length || added.length - newBad.length) console.log('Mejoro o cambio la lista (' + better.length + ' mejor, ' + (added.length - newBad.length) + ' nuevas bien conectadas, ' + gone.length + ' quitadas). Para fijarlo: node tools/tests/promesas.test.js --actualizar-linea-base');
if(failed) process.exit(1);
console.log('promesas: ninguna conexion empeoro respecto a la linea base');
