#!/usr/bin/env node
/* Microtemas: estructura, reglas progresivas y compatibilidad con lo que ya existe.
   Corre con:  node tools/tests/micros.test.js   (desde la carpeta inglesconLeo)

   Modelo:  familia -> tema -> microtema -> ejercicios -> recurso -> comprobación
   Reglas PROGRESIVAS (tools/micros-lib.js):
   - microtema solo DECLARADO  -> debe ser coherente, nada más (el sitio se comporta como siempre);
   - microtema con active:true -> además >=6 de práctica, >=3 de comprobación, >=2 tipos y un recurso;
   - ejercicio sin `micro`     -> comportamiento antiguo, sin ninguna regla nueva. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const lib = require('../micros-lib');
const root = path.join(__dirname, '..', '..');

let passed = 0;
function test(name, fn){
  try{ fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; }
}
const real = lib.loadSite(root);
const plain = o => JSON.parse(JSON.stringify(o));   // los datos reales vienen de otro contexto de ejecución

/* ---------- el sitio real ---------- */
console.log('El sitio real');
test('todo el sitio cumple las reglas (declarados coherentes, activos completos, ids estables)', () => {
  assert.deepStrictEqual(lib.validate(real), []);
});

test('los 3 pilotos están declarados con sus microtemas', () => {
  const ids = t => plain((real.temaById[t].micros || []).map(m => m.id));
  assert.deepStrictEqual(ids('will-going-to'), ['will-decision-espontanea', 'going-to-plan-decidido', 'going-to-evidencia', 'will-forma-verbo-base']);
  assert.deepStrictEqual(ids('condicionales'), ['cond-1-probable', 'cond-2-imaginario', 'cond-3-pasado-irreal', 'cond-mixto']);
  assert.deepStrictEqual(ids('cuantificadores'), ['much-many-contable-incontable', 'a-lot-of', 'some-any-afirm-neg', 'some-any-pregunta-oferta', 'little-few-matiz', 'fewer-less']);
});

test('migración gradual: solo los 4 microtemas de Futuro están activos (Condicionales y Cuantificadores no) y el resto de temas no cambió', () => {
  assert.deepStrictEqual(plain(Object.keys(real.microById).filter(id => real.microById[id].active)).sort(),
    ['going-to-evidencia', 'going-to-plan-decidido', 'will-decision-espontanea', 'will-forma-verbo-base']);
  const withMicros = plain(real.TEMAS.filter(t => (t.micros || []).length).map(t => t.id).sort());
  assert.deepStrictEqual(withMicros, ['condicionales', 'cuantificadores', 'will-going-to']);
});

test('los ejercicios sin micro siguen siendo los de siempre (solo 63 declaran micro: 43 existentes + 20 del piloto Futuro)', () => {
  const tagged = real.practice.filter(r => r.item.micro);
  assert.strictEqual(tagged.length, 63);
  assert.ok(real.practice.length - tagged.length > 300);
});

test('fusión de cuantificadores: los ids antiguos siguen existiendo tal cual (enlaces, Writing, Listening, historial)', () => {
  const frozen = {
    'contables-incontables': { family:'cuantificadores', topics:['Sustantivos contables e incontables'] },
    'much-many': { family:'cuantificadores', topics:['Much / Many', 'Cuantificadores (a lot of / much / many / few / little)'], glossary:'much-vs-many' },
    'little-few': { family:'cuantificadores', topics:['A little / Little / A few / Few'] },
    'some-any': { family:'cuantificadores', topics:['Some / Any'] },
    'fewer-vs-less': { family:'cuantificadores', topics:['"Fewer" vs "Less"'], glossary:'fewer-vs-less' }
  };
  Object.keys(frozen).forEach(id => {
    const t = real.temaById[id];
    assert.ok(t, id + ' desapareció');
    assert.strictEqual(t.family, frozen[id].family, id);
    assert.deepStrictEqual(plain(t.topics), frozen[id].topics, id + ': sus topics cambiaron');
    if(frozen[id].glossary) assert.strictEqual(t.glossary, frozen[id].glossary, id);
    assert.strictEqual(real.mergedInto[id], 'cuantificadores', id);
    assert.deepStrictEqual(plain(t.micros || []), [], id + ': los temas antiguos no declaran micros (viven en el paraguas)');
  });
  assert.deepStrictEqual(plain(real.temaById.cuantificadores.topics), [], 'el paraguas no repite topics: se quedan donde estaban');
  assert.deepStrictEqual(plain([...real.temaById.cuantificadores.merges].sort()), Object.keys(frozen).sort());
});

test('el paraguas reutiliza los glosarios que ya existían', () => {
  assert.strictEqual(lib.resourcesOf(real, 'much-many-contable-incontable').glossary, 'much-vs-many');
  assert.strictEqual(lib.resourcesOf(real, 'fewer-less').glossary, 'fewer-vs-less');
});

test('los ejercicios de un tema fusionado apuntan a micros del paraguas, no de otro tema', () => {
  const bySA = real.practice.filter(r => r.item.id === 'g-facil-some-1')[0];
  assert.strictEqual(real.temaByTopic[bySA.topic].id, 'some-any');
  assert.strictEqual(real.microById[bySA.item.micro].tema, 'cuantificadores');
});

test('condicionales: la cadena de prerrequisitos entre microtemas es lineal', () => {
  const m = real.microById;
  assert.deepStrictEqual(plain(m['cond-1-probable'].prereq || []), []);
  assert.deepStrictEqual(plain(m['cond-2-imaginario'].prereq), ['cond-1-probable']);
  assert.deepStrictEqual(plain(m['cond-3-pasado-irreal'].prereq), ['cond-2-imaginario']);
  assert.deepStrictEqual(plain(m['cond-mixto'].prereq), ['cond-3-pasado-irreal']);
});

test('futuro: los 4 ejercicios originales conservan su microtema y cada uno completa 6 de práctica', () => {
  const stats = lib.microStats(real);
  const original = { 'will-decision-espontanea':'g-medio5-fut-3', 'going-to-plan-decidido':'g-medio5-fut-1', 'going-to-evidencia':'g-medio5-fut-2', 'will-forma-verbo-base':'g-medio5-fut-4' };
  Object.keys(original).forEach(id => {
    assert.strictEqual(stats[id].practice.length, 6, id);
    assert.ok(stats[id].practice.some(r => r.item.id === original[id]), id + ' perdió su ejercicio original');
  });
});

test('el banco de comprobación está aparte y solo tiene los 12 del piloto Futuro (3 por microtema)', () => {
  assert.ok(Array.isArray(real.check));
  assert.strictEqual(real.check.length, 12);
  const per = {};
  real.check.forEach(c => { per[c.micro] = (per[c.micro] || 0) + 1; });
  assert.deepStrictEqual(plain(per), { 'will-decision-espontanea':3, 'going-to-plan-decidido':3, 'going-to-evidencia':3, 'will-forma-verbo-base':3 });
});

test('temas.js (runtime) y el validador resuelven igual el recurso de cada microtema', () => {
  const vm = require('vm');
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'temas.js'), 'utf8')
    + '\n;this.__r = { microResources, canonicalTemaId, ids: MICROS.map(m => m.id) };', ctx);
  ctx.__r.ids.forEach(id => assert.deepStrictEqual(plain(ctx.__r.microResources(id)), plain(lib.resourcesOf(real, id)), id));
  assert.strictEqual(ctx.__r.microResources('no-existe'), null);
  assert.strictEqual(ctx.__r.canonicalTemaId('some-any'), 'cuantificadores');
  assert.strictEqual(ctx.__r.canonicalTemaId('condicionales'), 'condicionales');
});

test('ningún motor de sesión puede leer el banco de comprobación', () => {
  const rootJs = fs.readdirSync(root).filter(f => /\.js$/.test(f) && f !== 'data.js');
  rootJs.forEach(f => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    if(f === 'app.js') return;
    assert.ok(src.indexOf('GRAMMAR_CHECK_BANK') === -1, f + ' lee GRAMMAR_CHECK_BANK');
  });
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const start = app.indexOf('function checkIndex(){');
  assert.ok(start > 0);
  let depth = 0, end = -1;
  for(let i = app.indexOf('{', start); i < app.length; i++){
    if(app[i] === '{') depth++;
    if(app[i] === '}'){ depth--; if(depth === 0){ end = i; break; } }
  }
  const outside = (app.slice(0, start) + app.slice(end + 1)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');   // sin comentarios
  assert.ok(outside.indexOf('GRAMMAR_CHECK_BANK') === -1, 'GRAMMAR_CHECK_BANK aparece fuera de checkIndex() en el código de app.js');
});

/* ---------- las reglas, con casos pequeños ---------- */
console.log('\nLas reglas (casos pequeños)');
const T0 = [{ id:'t1', label:'T1', family:'f', article:null, glossary:null, topics:['Tema uno'], micros:[{ id:'m-uno', label:'Uno' }] }];
const item = (id, type, text, micro) => {
  const base = { id, micro, explain:'e', examples:[{ en:'a', es:'b' }] };
  if(type === 'choice') return Object.assign(base, { type, prompt:text, options:['a', 'b'], correct:0 });
  if(type === 'fill') return Object.assign(base, { type, sentence:text.split(' ').concat('___'), blankIndex:text.split(' ').length, bank:['a', 'b'], correct:'a' });
  return Object.assign(base, { type:'error', wrong:text, wrongWord:text.split(' ')[0], right:'x', rightWord:'x' });
};
const make = (o) => lib.buildSite(Object.assign({
  TEMAS: JSON.parse(JSON.stringify(T0)), G: { facil: [[{ topic:'Tema uno', items:[] }]] }, CHECK: [],
  files: new Set(['clase.html']), glossaryOk: s => s === 'glos-ok', lock: { ids: [] }
}, o));
const withPractice = (n, microId) => {
  const types = ['choice', 'fill', 'error'];
  const items = []; for(let i = 0; i < n; i++) items.push(item('p' + i, types[i % 3], 'practice sentence number ' + i + ' alpha' + i, microId));
  return { facil: [[{ topic:'Tema uno', items }]] };
};
const checks = (n, microId) => { const out = []; for(let i = 0; i < n; i++) out.push(item('c' + i, 'choice', 'completely different words zeta' + i + ' omega' + i, microId)); return out; };
const lockOf = ids => ({ ids });
const has = (errs, frag) => assert.ok(errs.some(e => e.indexOf(frag) !== -1), 'esperaba "' + frag + '" en: ' + JSON.stringify(errs));
const ok = errs => assert.deepStrictEqual(errs, []);

test('declarado y sin ejercicios: válido (migrar un tema no obliga a crear contenido)', () => ok(lib.validate(make({}))));
test('sin micros en ningún tema: no hay reglas nuevas (los 70+ temas actuales siguen igual)', () => {
  ok(lib.validate(make({ TEMAS: [{ id:'t1', label:'T1', family:'f', topics:['Tema uno'] }] })));
});

test('declarado: id repetido, formato, nombre de tema', () => {
  const T = JSON.parse(JSON.stringify(T0)); T[0].micros.push({ id:'m-uno' }, { id:'Mal_Id' }, { id:'t1' });
  const e = lib.validate(make({ TEMAS: T }));
  has(e, 'microtema repetido: m-uno'); has(e, 'kebab-case'); has(e, 'no puede llamarse igual que un tema');
});
test('declarado: prereq inexistente, de otro tema, a sí mismo y ciclos', () => {
  const T = [
    { id:'t1', label:'T1', family:'f', topics:['Tema uno'], micros:[{ id:'a', prereq:['b', 'zzz', 'otro'] }, { id:'b', prereq:['a'] }] },
    { id:'t2', label:'T2', family:'f', topics:[], micros:[{ id:'otro' }] }
  ];
  const e = lib.validate(make({ TEMAS: T }));
  has(e, 'prereq inexistente zzz'); has(e, 'es de otro tema'); has(e, 'ciclo de prerrequisitos');
});
test('declarado: si la clase declara una sección (anchor), el archivo debe tenerla', () => {
  const T = JSON.parse(JSON.stringify(T0)); T[0].micros[0].lesson = { article:'clase.html', anchor:'seccion-x' };
  has(lib.validate(make({ TEMAS: T, articleHas: (f, a) => a === 'otra' })), 'no tiene la sección id="seccion-x"');
  ok(lib.validate(make({ TEMAS: T, articleHas: (f, a) => a === 'seccion-x' })));
});
test('declarado: la comprobación no puede repetir palabra por palabra ningún ejercicio de práctica', () => {
  const G = withPractice(2, 'm-uno'); const c = checks(1, 'm-uno');
  c[0] = item('c0', 'choice', 'practice sentence number 1 alpha1', 'm-uno');
  has(lib.validate(make({ G, CHECK: c, lock: lockOf(['m-uno']) })), 'repite palabra por palabra a la práctica p1');
});
test('declarado: la clase y el glosario que declara deben existir', () => {
  const T = JSON.parse(JSON.stringify(T0)); T[0].micros[0].lesson = { article:'no-existe.html' }; T[0].micros[0].glossary = 'no-glos';
  const e = lib.validate(make({ TEMAS: T }));
  has(e, 'la clase no-existe.html no existe'); has(e, '/glosario/no-glos/');
  const T2 = JSON.parse(JSON.stringify(T0)); T2[0].micros[0].lesson = { article:'clase.html', anchor:'x' }; T2[0].micros[0].glossary = 'glos-ok';
  ok(lib.validate(make({ TEMAS: T2, lock: lockOf([]) })));
});
test('ejercicio con micro no declarado, o de otro tema', () => {
  const T = [
    { id:'t1', label:'T1', family:'f', topics:['Tema uno'], micros:[{ id:'m-uno' }] },
    { id:'t2', label:'T2', family:'f', topics:['Tema dos'], micros:[{ id:'m-dos' }] }
  ];
  const G = { facil: [[{ topic:'Tema uno', items:[item('x1', 'choice', 'one two', 'fantasma'), item('x2', 'choice', 'three four', 'm-dos')] }]] };
  const e = lib.validate(make({ TEMAS: T, G, lock: lockOf(['m-uno', 'm-dos']) }));
  has(e, 'x1: micro "fantasma" no está declarado'); has(e, 'x2: el micro "m-dos" es del tema t2');
});
test('ejercicio sin micro: comportamiento antiguo (ninguna regla)', () => {
  const G = { facil: [[{ topic:'Tema uno', items:[item('x1', 'choice', 'one two', undefined)] }]] };
  ok(lib.validate(make({ G })));
});
test('tema fusionado: sus ejercicios pueden apuntar a micros del tema que lo absorbió', () => {
  const T = [
    { id:'umbrella', label:'U', family:'f', topics:[], merges:['viejo'], micros:[{ id:'m-u' }] },
    { id:'viejo', label:'V', family:'f', topics:['Tema viejo'] }
  ];
  const G = { facil: [[{ topic:'Tema viejo', items:[item('v1', 'choice', 'one two', 'm-u')] }]] };
  ok(lib.validate(make({ TEMAS: T, G, lock: lockOf(['m-u']) })));
  const T2 = JSON.parse(JSON.stringify(T)); T2[0].merges = [];
  has(lib.validate(make({ TEMAS: T2, G, lock: lockOf(['m-u']) })), 'es del tema umbrella pero el bloque "Tema viejo" es de viejo');
});
test('fusión: sin cadenas, sin absorber lo que no existe, un solo paraguas por tema', () => {
  const T = [
    { id:'a', label:'A', family:'f', topics:[], merges:['b', 'zzz'] },
    { id:'b', label:'B', family:'f', topics:[], merges:['c'] },
    { id:'c', label:'C', family:'f', topics:[] },
    { id:'d', label:'D', family:'f', topics:[], merges:['c'] }
  ];
  const e = lib.validate(make({ TEMAS: T }));
  has(e, 'absorbe un tema que no existe: zzz'); has(e, 'sin cadenas'); has(e, 'lo absorben varios temas');
});

test('comprobación: un ejercicio no puede estar en práctica y en comprobación', () => {
  const G = withPractice(1, 'm-uno'); const c = checks(1, 'm-uno'); c[0].id = 'p0';
  has(lib.validate(make({ G, CHECK: c, lock: lockOf(['m-uno']) })), 'está en práctica Y en comprobación');
});
test('comprobación: necesita micro declarado, tipo válido y explain', () => {
  const c = [item('c1', 'choice', 'aaa bbb', undefined), item('c2', 'choice', 'ccc ddd', 'fantasma')];
  const e = lib.validate(make({ CHECK: c.concat([{ id:'c3', micro:'m-uno', type:'raro' }]) }));
  has(e, 'c1: la comprobación necesita micro'); has(e, 'c2: micro "fantasma"'); has(e, 'c3: tipo inválido'); has(e, 'c3: sin explain');
});

test('ACTIVO: menos de 6 de práctica, menos de 3 de comprobación, 1 solo tipo, sin recurso', () => {
  const T = JSON.parse(JSON.stringify(T0)); T[0].micros[0].active = true;
  const e = lib.validate(make({ TEMAS: T, G: withPractice(5, 'm-uno'), CHECK: checks(2, 'm-uno'), lock: lockOf(['m-uno']) }));
  has(e, '5 ejercicios de práctica, mínimo 6'); has(e, '2 ejercicios de comprobación, mínimo 3'); has(e, 'sin recurso');
  const G1 = { facil: [[{ topic:'Tema uno', items:[0, 1, 2, 3, 4, 5].map(i => item('q' + i, 'choice', 'only choice ' + i + ' word' + i, 'm-uno')) }]] };
  has(lib.validate(make({ TEMAS: T, G: G1, CHECK: checks(3, 'm-uno'), lock: lockOf(['m-uno']) })), '1 tipo(s) de ejercicio, mínimo 2');
});
test('ACTIVO completo: 6 de práctica + 3 de comprobación + recurso (del tema o propio) = válido', () => {
  const T = JSON.parse(JSON.stringify(T0)); T[0].micros[0].active = true; T[0].glossary = 'glos-ok';
  ok(lib.validate(make({ TEMAS: T, G: withPractice(6, 'm-uno'), CHECK: checks(3, 'm-uno'), lock: lockOf(['m-uno']) })));
  const T2 = JSON.parse(JSON.stringify(T0)); T2[0].micros[0].active = true; T2[0].micros[0].lesson = { article:'clase.html' };
  ok(lib.validate(make({ TEMAS: T2, G: withPractice(6, 'm-uno'), CHECK: checks(3, 'm-uno'), lock: lockOf(['m-uno']) })));
});
test('ACTIVO: la comprobación no puede repetir ni parecerse a la práctica (mide generalización, no memoria)', () => {
  const T = JSON.parse(JSON.stringify(T0)); T[0].micros[0].active = true; T[0].glossary = 'glos-ok';
  const G = withPractice(6, 'm-uno');
  const same = checks(3, 'm-uno'); same[0] = item('c0', 'choice', 'practice sentence number 2 alpha2', 'm-uno');
  has(lib.validate(make({ TEMAS: T, G, CHECK: same, lock: lockOf(['m-uno']) })), 'se parece demasiado a la práctica p2');
  const near = checks(3, 'm-uno'); near[1] = item('c1', 'choice', 'practice sentence number 3 alpha3 extra', 'm-uno');
  has(lib.validate(make({ TEMAS: T, G, CHECK: near, lock: lockOf(['m-uno']) })), 'c1');
});
test('un microtema declarado y sin activar no exige nada aunque tenga poco contenido', () => {
  ok(lib.validate(make({ G: withPractice(2, 'm-uno'), CHECK: checks(1, 'm-uno'), lock: lockOf(['m-uno']) })));
});

test('ids estables: no se pueden borrar ni renombrar, y los nuevos con contenido deben entrar al candado', () => {
  has(lib.validate(make({ lock: lockOf(['m-viejo']) })), 'm-viejo" está en micro-ids.lock.json y ya no existe');
  has(lib.validate(make({ G: withPractice(1, 'm-uno'), lock: lockOf([]) })), 'm-uno" ya se usa pero no está');
  ok(lib.validate(make({ lock: lockOf([]) })));   // declarado sin uso: aún se puede renombrar
});

test('reporte: dice exactamente qué le falta a cada microtema', () => {
  const r = lib.report(make({ G: withPractice(2, 'm-uno'), CHECK: checks(1, 'm-uno'), lock: lockOf(['m-uno']) }));
  assert.strictEqual(r.rows.length, 1);
  assert.strictEqual(r.rows[0].practica, 2); assert.strictEqual(r.rows[0].comprobacion, 1);
  assert.deepStrictEqual(r.rows[0].huecos, ['faltan 4 de práctica', 'faltan 2 de comprobación', 'sin clase ni glosario']);
});

console.log('\n' + passed + ' pruebas correctas');
