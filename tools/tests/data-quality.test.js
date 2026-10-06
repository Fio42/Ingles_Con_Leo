#!/usr/bin/env node
/* Calidad de los datos de gramática (data.js) frente al registro de temas (temas.js).
   Corre con:  node tools/tests/data-quality.test.js   (desde la carpeta inglesconLeo)

   Protege lo que el diagnóstico y las recomendaciones dan por cierto:
   - cada bloque de ejercicios pertenece a UN tema del registro (nada de bloques mixtos
     ni de etiquetas que no están en temas.js);
   - los ids son únicos y ningún ejercicio repite palabra por palabra a otro;
   - cada ejercicio es válido (la respuesta existe entre las opciones, la oración tiene
     su hueco, el error marcado está en la frase, etc.);
   - los ítems corregidos a mano siguen donde deben. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'temas.js'), 'utf8')
  + '\n;this.__d = { G:GRAMMAR_BANK, TEMAS };', ctx);
const { G, TEMAS } = ctx.__d;

const temaByTopic = {};
TEMAS.forEach(t => (t.topics || []).forEach(tp => { (temaByTopic[tp] = temaByTopic[tp] || []).push(t.id); }));

// Aplana GRAMMAR_BANK: [{ level, topic, item }]
const rows = [];
Object.keys(G).forEach(level => G[level].forEach(variant => variant.forEach(block => {
  block.items.forEach(item => rows.push({ level, topic: block.topic, item }));
})));

let passed = 0;
function test(name, fn){
  try{ fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; }
}
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const textOf = it => norm(it.prompt != null ? it.prompt : it.type === 'fill' ? it.sentence.join(' ') : it.wrong);

test('hay ejercicios cargados', () => assert.ok(rows.length > 300));

test('cada bloque de ejercicios pertenece a un tema del registro (sin bloques mixtos)', () => {
  const bad = [...new Set(rows.map(r => r.topic))].filter(tp => !temaByTopic[tp] || temaByTopic[tp].length !== 1);
  assert.deepStrictEqual(bad, [], 'etiquetas sin tema, o con más de uno: ' + bad.join(' | '));
});

test('los ids son únicos', () => {
  const seen = {}, dup = [];
  rows.forEach(r => { if(seen[r.item.id]) dup.push(r.item.id); seen[r.item.id] = true; });
  assert.deepStrictEqual(dup, []);
});

test('ningún ejercicio repite palabra por palabra a otro del mismo tipo de pregunta', () => {
  const seen = {}, dup = [];
  rows.forEach(r => {
    const key = textOf(r.item);
    if(seen[key]) dup.push(seen[key] + ' = ' + r.item.id); else seen[key] = r.item.id;
  });
  assert.deepStrictEqual(dup, [], 'duplicados: ' + dup.join(' ; '));
});

test('cada ejercicio es válido (respuesta presente, hueco, error dentro de la frase)', () => {
  const bad = [];
  rows.forEach(({ item: it }) => {
    const id = it.id;
    if(!it.explain) bad.push(id + ': sin explain');
    if(!Array.isArray(it.examples) || !it.examples.length) bad.push(id + ': sin ejemplos');
    if(it.type === 'choice'){
      if(!Array.isArray(it.options) || it.options.length < 2) bad.push(id + ': opciones');
      else if(!(it.correct >= 0 && it.correct < it.options.length)) bad.push(id + ': correct fuera de rango');
      else if(new Set(it.options.map(norm)).size !== it.options.length) bad.push(id + ': opciones repetidas');
    } else if(it.type === 'fill'){
      if(!Array.isArray(it.sentence) || it.sentence[it.blankIndex] !== '___') bad.push(id + ': el hueco no está en blankIndex');
      if(!Array.isArray(it.bank) || it.bank.indexOf(it.correct) === -1) bad.push(id + ': la respuesta no está en el banco');
    } else if(it.type === 'error'){
      if(!it.wrong || !it.right || it.wrong === it.right) bad.push(id + ': wrong/right');
      else if(it.wrongWord && it.wrong.indexOf(it.wrongWord) === -1) bad.push(id + ': wrongWord no está en la frase');
    } else bad.push(id + ': tipo desconocido ' + it.type);
  });
  assert.deepStrictEqual(bad, []);
});

test('los ítems corregidos a mano siguen en su tema', () => {
  const where = id => { const r = rows.find(x => x.item.id === id); return r && temaByTopic[r.topic][0]; };
  // "Despite of the rain" estaba por error en Condicional tipo 3.
  assert.strictEqual(where('g-avz-c3-4'), 'conectores-avanzados');
  const c3 = rows.filter(r => r.topic === 'Condicional tipo 3');
  assert.ok(c3.length >= 3 && c3.every(r => !/despite/i.test(textOf(r.item))), 'Condicional tipo 3 solo debe tener condicionales');
  // Los dos packs de repaso que mezclaban temas: cada ítem en el suyo.
  assert.strictEqual(where('g-facil-m400-1'), 'condicionales');
  assert.strictEqual(where('g-facil-m400-2'), 'comparativos');
  assert.strictEqual(where('g-facil-m400-3'), 'since-for');
  assert.strictEqual(where('g-medio-m400-1'), 'wish');
  assert.strictEqual(where('g-medio-m400-2'), 'estilo-indirecto');
  assert.strictEqual(where('g-medio-m400-3'), 'past-perfect');
});

console.log('\n' + passed + ' pruebas correctas');
