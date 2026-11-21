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
const practiceLinks = html => (html.match(/<a href="[^"]*" data-rf="practice">/g) || []);

console.log('Error -> refuerzo (visitante y cuenta gratis)');
test('tema con ejercicios gratis: "Practicar este tema" abre practica.html?skill=grammar&tema=<id>, no la practica general', () => {
  ['do-does', 'to-be-presente', 'in-on-at', 'verbo-have'].forEach(id => {
    const h = free(id);
    assert(h.indexOf('href="practica.html?skill=grammar&tema=' + id + '" data-rf="practice">Practicar este tema<') !== -1, id + ': ' + h.slice(0, 200));
    assert(!/Practicar más/.test(h), id);
  });
});
test('tema con clase pero sin ejercicios gratis (todo de Miembros): ofrece la explicacion y NO una practica general', () => {
  ['pasado-continuo', 'there-is-are', 'your-vs-youre'].forEach(id => {
    const h = free(id);
    assert(/data-rf="lesson"/.test(h), id + ' debe ofrecer la explicacion');
    assert.strictEqual(practiceLinks(h).length, 0, id + ' no debe ofrecer practica');
  });
});
test('tema sin explicacion, sin curso y sin ejercicios gratis: la fila no sale', () => {
  ['causativos', 'preposiciones-movimiento'].forEach(id => assert.strictEqual(free(id), '', id));
});
test('ningun enlace de practica del resumen gratis es una pagina general', () => {
  T.TEMAS.filter(t => t.skill !== 'vocabulary' && t.skill !== 'listening').forEach(t => {
    const ids = idsOf(t.id, 2); if(!ids.length) return;
    (practiceLinks(free(t.id))).forEach(a => assert(/practica\.html\?skill=grammar&tema=/.test(a), t.id + ' ' + a));
  });
});

console.log('Error -> refuerzo (miembro)');
test('tema sin familia (question-tags): clase si, pero ningun boton Practicar hacia gramatica.html', () => {
  const h = member('question-tags');
  assert(/data-rf="lesson"/.test(h)); assert.strictEqual(practiceLinks(h).length, 0); assert(!/gramatica\.html/.test(h));
});
test('tema sin familia, sin clase, ficha ni curso (hedging, inversion-enfasis, subjuntivo-formal): no sale ninguna fila', () => {
  ['hedging', 'inversion-enfasis', 'subjuntivo-formal'].forEach(id => assert.strictEqual(member(id), '', id));
});
test('tema normal de miembro: conserva clase, practica del tema y curso', () => {
  const h = member('do-does');
  assert(/data-rf="lesson"/.test(h) && practiceLinks(h).length === 1 && /curso\/do-does/.test(h));
});
test('error repetido: con 2+ errores de un tema, ese tema va primero y es el unico del resumen', () => {
  const a = idsOf('do-does', 2), b = idsOf('verbo-have', 1);
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
console.log(passed + ' pruebas ok');
