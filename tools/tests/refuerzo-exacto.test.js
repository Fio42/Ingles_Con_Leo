#!/usr/bin/env node
/* Refuerzo exacto o nada. Usa el app.js, data.js y temas.js REALES en un navegador simulado (sin red).
   - Error -> refuerzo: el resumen "Para reforzar" ofrece solo recursos que resuelven ESE tema. Practica gratis de ese tema (nunca la general),
     explicacion si existe, curso publicado; si no hay ninguno de los tres, la fila no sale.
   - Explicacion -> ejercicio: cada clase con 3+ ejercicios gratis de su tema enlaza a practica.html?skill=grammar&tema=<id>.
   - Lo que falta queda apuntado en REFUERZOS_FALTANTES.md (generado).
   Corre con:  node tools/tests/refuerzo-exacto.test.js   (desde la carpeta inglesconLeo) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert'), cp = require('child_process');
const root = path.join(__dirname, '..', '..');
const noop = () => {}; const store = {};
const el = () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, setAttribute: noop, appendChild: noop, addEventListener: noop, set innerHTML(v){}, get innerHTML(){ return ''; } });
const ctx = { console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
  localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, readyState: 'complete', body: el(), documentElement: el(), createElement: el },
  location: { hash: '', search: '', pathname: '/' }, navigator: { userAgent: 'node' }, addEventListener: noop,
  MutationObserver: function(){ return { observe: noop }; }, IntersectionObserver: function(){ return { observe: noop }; }, matchMedia: () => ({ matches: false, addEventListener: noop }) };
ctx.window = ctx; vm.createContext(ctx);
['data.js', 'temas.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + ';this.__t = { sessionReinforceRows, sessionReinforceHtml, freeReinforceHtml, freeGrammarItemsOfTema, setUserLevel, LEVELS, GRAMMAR_BANK, temaForTopic, TEMAS };', ctx);
const T = ctx.__t; T.setUserLevel('medio');
let passed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; } }
const idsOf = (temaId, n) => { const out = []; T.LEVELS.forEach(l => (T.GRAMMAR_BANK[l] || []).forEach(v => v.forEach(b => { const t = T.temaForTopic(b.topic); if(t && t.id === temaId) b.items.forEach(i => { if(out.length < n) out.push(i.id); }); }))); return out; };
const wrong = ids => ids.map(itemId => ({ itemId, isCorrect: false }));
const free = id => T.freeReinforceHtml(wrong(idsOf(id, 2)));
const member = id => T.sessionReinforceHtml(JSON.parse(JSON.stringify(T.sessionReinforceRows(wrong(idsOf(id, 2)), { actions: [] }, new Set()))));
// Todos los temas de gramatica ya tienen explicacion y familia: para probar la regla "sin nada exacto, la fila no sale" se les quita la ficha y la familia un momento.
const sinFicha = (ids, fn) => { const prev = {}; ids.forEach(id => { prev[id] = [vm.runInContext("TEMA_BY_ID['" + id + "'].glossary", ctx), vm.runInContext("TEMA_BY_ID['" + id + "'].family", ctx)]; vm.runInContext("TEMA_BY_ID['" + id + "'].glossary = null; TEMA_BY_ID['" + id + "'].family = null", ctx); }); try { fn(); } finally { ids.forEach(id => { vm.runInContext("TEMA_BY_ID['" + id + "'].glossary = " + JSON.stringify(prev[id][0]) + "; TEMA_BY_ID['" + id + "'].family = " + JSON.stringify(prev[id][1]), ctx); }); } };
const practiceLinks = html => (html.match(/<a href="[^"]*" data-rf="practice">/g) || []);

console.log('Error -> refuerzo (visitante y cuenta gratis)');
test('tema con ejercicios gratis: "Practicar este tema" abre practica.html?skill=grammar&tema=<id>, no la practica general', () => {
  ['do-does', 'to-be-presente', 'in-on-at'].forEach(id => {
    const h = free(id);
    assert(h.indexOf('href="practica.html?skill=grammar&tema=' + id + '" data-rf="practice">Practicar este tema<') !== -1, id + ': ' + h.slice(0, 200));
    assert(!/Practicar más/.test(h), id);
  });
});
test('tema con clase pero sin ejercicios gratis (todo de Miembros): ofrece la explicacion y NO una practica general', () => {
  ['pasado-continuo', 'there-is-are', 'your-vs-youre', 'verbo-have', 'verbos-irregulares'].forEach(id => {
    const h = free(id);
    assert(/data-rf="lesson"/.test(h), id + ' debe ofrecer la explicacion');
    assert.strictEqual(practiceLinks(h).length, 0, id + ' no debe ofrecer practica');
  });
});
test('tema sin explicacion, sin curso y sin ejercicios gratis (se les quita la ficha): la fila no sale', () => {
  sinFicha(['causativos', 'preposiciones-movimiento'], () => ['causativos', 'preposiciones-movimiento'].forEach(id => assert.strictEqual(free(id), '', id)));
});
test('ningun enlace de practica del resumen gratis es una pagina general', () => {
  T.TEMAS.filter(t => t.skill !== 'vocabulary' && t.skill !== 'listening').forEach(t => {
    const ids = idsOf(t.id, 2); if(!ids.length) return;
    (practiceLinks(free(t.id))).forEach(a => assert(/practica\.html\?skill=grammar&tema=/.test(a), t.id + ' ' + a));
  });
});

console.log('Error -> refuerzo (miembro)');
test('question-tags ya tiene familia: la clase y Practicar abre el Plan enfocado en ESE tema (nunca gramatica.html)', () => {
  const h = member('question-tags');
  assert(/data-rf="lesson"/.test(h)); assert.strictEqual(practiceLinks(h).length, 1); assert(/plan-estudio\.html\?foco=preguntas&(amp;)?tema=question-tags/.test(h), h); assert(!/gramatica\.html/.test(h));
  sinFicha(['question-tags'], () => { const g = member('question-tags'); assert(/data-rf="lesson"/.test(g)); assert.strictEqual(practiceLinks(g).length, 0); assert(!/gramatica\.html/.test(g)); });
});
test('tema sin familia, sin clase, ficha ni curso (se les quita la ficha a hedging, inversion-enfasis y subjuntivo-formal): no sale ninguna fila', () => {
  sinFicha(['hedging', 'inversion-enfasis', 'subjuntivo-formal'], () => ['hedging', 'inversion-enfasis', 'subjuntivo-formal'].forEach(id => assert.strictEqual(member(id), '', id)));
});
test('tema normal de miembro: conserva clase, practica del tema y curso', () => {
  const h = member('do-does');
  assert(/data-rf="lesson"/.test(h) && practiceLinks(h).length === 1 && /curso\/do-does/.test(h));
});
test('error repetido: con 2+ errores de un tema, ese tema va primero y es el unico del resumen', () => {
  const a = idsOf('do-does', 2), b = idsOf('in-on-at', 1);
  const rows = JSON.parse(JSON.stringify(T.sessionReinforceRows(wrong(a.concat(b)), { actions: [] }, new Set())));
  assert.strictEqual(rows.length, 1); assert.strictEqual(rows[0].temaId, 'do-does'); assert.strictEqual(rows[0].n, 2);
});

console.log('Explicacion -> ejercicio');
test('cada clase con 3+ ejercicios gratis de su tema enlaza a la practica gratis de ese tema (y no sobra ninguna)', () => {
  const r = cp.spawnSync(process.execPath, [path.join(root, 'tools', 'conexiones', 'enlazar-articulos.js')], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
});
test('los enlaces tema= de las clases apuntan a temas que existen y que tienen ejercicios gratis', () => {
  const ids = new Set(T.TEMAS.map(t => t.id));
  fs.readdirSync(root).filter(f => /^articulo-.*\.html$/.test(f)).forEach(f => {
    (fs.readFileSync(path.join(root, f), 'utf8').match(/practica\.html\?skill=grammar&amp;tema=([a-z0-9-]+)/g) || []).forEach(m => {
      const id = m.split('tema=')[1];
      assert(ids.has(id), f + ': tema inexistente ' + id);
      assert(T.LEVELS.some(l => T.freeGrammarItemsOfTema(l, id).length), f + ': ' + id + ' no tiene ejercicios gratis');
    });
  });
});
test('REFUERZOS_FALTANTES.md esta al dia', () => {
  const r = cp.spawnSync(process.execPath, [path.join(root, 'tools', 'conexiones', 'faltantes.js')], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
});
test('las fichas del glosario de un tema abren la practica de ese tema', () => {
  const r = cp.spawnSync(process.execPath, [path.join(root, 'tools', 'conexiones', 'enlazar-fichas.js')], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  const map = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'glosario', 'fichas-tema.json'), 'utf8'));
  assert(Object.keys(map).length >= 10);
  Object.keys(map).forEach(slug => {
    const h = fs.readFileSync(path.join(root, 'glosario', slug, 'index.html'), 'utf8');
    assert(h.indexOf('practica.html?skill=grammar&amp;tema=' + map[slug]) !== -1, slug);
    assert(T.LEVELS.some(l => T.freeGrammarItemsOfTema(l, map[slug]).length), slug + ' sin ejercicios gratis');
  });
});
test('hedging, inversion-enfasis y subjuntivo-formal ya tienen ficha: el error ofrece la explicacion', () => {
  ['hedging', 'inversion-enfasis', 'subjuntivo-formal'].forEach(id => assert(/data-rf="lesson"/.test(member(id)), id));
});
console.log(passed + ' pruebas ok');
