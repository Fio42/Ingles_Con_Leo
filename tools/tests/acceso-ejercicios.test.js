#!/usr/bin/env node
/* Acceso a los ejercicios: que es gratis y que es exclusivo de Miembros.
   Corre con:  node tools/tests/acceso-ejercicios.test.js
   Usa data.js y app.js REALES en un navegador simulado (sin red, sin cuentas, sin tocar nada): todo con datos de prueba.

   Lo que se protege:
   1. La regla es por IDENTIFICACION: los lotes miembros100 (-m100-) y miembros300 (-m300-) y las variantes exclusivas anteriores
      (se reconocen por el id de su primer ejercicio) son de Miembros; m200, m400, numeros y el resto son gratis.
   2. Agregar, mover o reordenar bloques en data.js NO cambia que es gratis (se simula agregando bloques al principio, en medio y al final).
   3. En las cinco habilidades (gramatica, vocabulario, listening, writing, speaking) y los cuatro niveles:
      - un visitante nunca recibe un ejercicio de m100 ni m300 (sesion normal, reto diario, practica por tema) y SI recibe los gratis previstos;
      - un miembro puede recibir ejercicios de ambos lotes.
   4. Nada se rompe en silencio: cada id de las variantes anteriores existe exactamente una vez. */
const assert = require('assert'), vm = require('vm'), path = require('path');
const { loadAccess } = require('../lib/acceso');
const { A, run, reset, root } = require('./lib/cargar-app');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); }
}
const SKILLS = ['gramatica', 'vocabulario', 'listening', 'writing', 'speaking'];
const LEVELS = ['principiante', 'facil', 'medio', 'avanzado'];
const BANK_NAME = { gramatica: 'GRAMMAR_BANK', vocabulario: 'VOCAB_BANK', listening: 'LISTENING_BANK', writing: 'WRITING_BANK', speaking: 'SPEAKING_BANK' };
const MEMBER_BATCH = /-(m100|m300)-/;
const ids = v => { const out = []; (v || []).forEach(x => { if(x && x.items) x.items.forEach(i => out.push(i.id)); else if(x) out.push(x.id); }); return out; };

console.log('Acceso a los ejercicios');
const acc = loadAccess(root);
const bank = (skill, lvl) => run(BANK_NAME[skill] + '.' + lvl);

test('lotes exclusivos: m100 y m300 (y solo esos)', () => {
  assert.deepStrictEqual(Array.from(acc.MEMBERS_ONLY_BATCHES).sort(), ['m100', 'm300']);
});

test('cada id de las variantes exclusivas anteriores existe exactamente una vez por habilidad y nivel', () => {
  SKILLS.forEach(s => LEVELS.forEach(l => {
    const first = acc.ctx[BANK_NAME[s]] ? null : null; void first;
    const list = acc.MEMBERS_ONLY_LEGACY_VARIANT_IDS[s][l];
    assert.ok(list && list.length >= 2, s + '/' + l + ': lista vacia');
    list.forEach(id => {
      const n = vm.runInContext(BANK_NAME[s] + '.' + l, acc.ctx).filter(v => acc.variantExerciseIds(v)[0] === id).length;
      assert.strictEqual(n, 1, s + '/' + l + ': el id ' + id + ' aparece ' + n + ' veces (deberia ser 1)');
    });
  }));
});

test('toda variante con m100 o m300 esta bloqueada; ninguna otra lo esta salvo las anteriores identificadas', () => {
  SKILLS.forEach(s => LEVELS.forEach(l => {
    const blocked = new Set(A.MEMBERS_ONLY_VARIANT_INDEX[s][l]);
    const legacy = acc.MEMBERS_ONLY_LEGACY_VARIANT_IDS[s][l];
    bank(s, l).forEach((v, vi) => {
      const vids = ids(v), marked = vids.some(i => MEMBER_BATCH.test(i)), isLegacy = legacy.indexOf(vids[0]) !== -1;
      assert.strictEqual(blocked.has(vi), marked || isLegacy, s + '/' + l + ' variante ' + vi + ' (' + vids[0] + '): bloqueada=' + blocked.has(vi) + ', lote exclusivo=' + marked + ', anterior=' + isLegacy);
    });
  }));
});

test('las variantes de m200, m400 y numeros son gratis; las dos de lotes exclusivos existen en las 5 habilidades', () => {
  SKILLS.forEach(s => LEVELS.forEach(l => {
    const blocked = new Set(A.MEMBERS_ONLY_VARIANT_INDEX[s][l]);
    let has100 = false, has300 = false;
    bank(s, l).forEach((v, vi) => {
      const vids = ids(v);
      if(vids.some(i => /-m100-/.test(i))){ has100 = true; assert.ok(blocked.has(vi), s + '/' + l + ': m100 debe ser de Miembros'); }
      if(vids.some(i => /-m300-/.test(i))){ has300 = true; assert.ok(blocked.has(vi), s + '/' + l + ': m300 debe ser de Miembros'); }
      if(vids.some(i => /-(m200|m400|numeros)-/.test(i)) && !vids.some(i => MEMBER_BATCH.test(i))) assert.ok(!blocked.has(vi), s + '/' + l + ': m200/m400/numeros deben ser gratis (variante ' + vi + ')');
    });
    assert.ok(has100 && has300, s + '/' + l + ': faltan m100 o m300 en los datos de prueba reales');
    assert.ok(bank(s, l).length - blocked.size >= 3, s + '/' + l + ': quedan muy pocas variantes gratis');
  }));
});

test('agregar o mover bloques en data.js no cambia que es gratis (principio, medio y final)', () => {
  const a = loadAccess(root);   // contexto propio: se puede modificar sin tocar nada mas
  const snapshot = () => {
    const out = {};
    SKILLS.forEach(s => LEVELS.forEach(l => {
      const b = vm.runInContext(BANK_NAME[s] + '.' + l, a.ctx), blocked = new Set(a.MEMBERS_ONLY_VARIANT_INDEX[s][l]);
      b.forEach((v, vi) => { out[s + '/' + l + '/' + ids(v)[0]] = blocked.has(vi); });
    }));
    return out;
  };
  const before = snapshot();
  const fakeGrammar = id => '[{ topic: "Prueba", items: [{ id: "' + id + '", type: "choice", prompt: "x", options: ["a","b"], correct: 0 }] }]';
  const fakeFlat = id => '[{ id: "' + id + '" }]';
  SKILLS.forEach(s => LEVELS.forEach(l => {
    const mk = id => s === 'gramatica' ? fakeGrammar(id) : fakeFlat(id);
    const n = vm.runInContext(BANK_NAME[s] + '.' + l + '.length', a.ctx);
    // gratis nuevo: al principio, en medio y al final; lote exclusivo nuevo: al principio y en medio
    vm.runInContext(BANK_NAME[s] + '.' + l + '.unshift(' + mk('x-' + l + '-nuevo-gratis-0') + ');', a.ctx);
    vm.runInContext(BANK_NAME[s] + '.' + l + '.splice(' + Math.floor(n / 2) + ', 0, ' + mk('x-' + l + '-m100-medio-1') + ');', a.ctx);
    vm.runInContext(BANK_NAME[s] + '.' + l + '.splice(3, 0, ' + mk('x-' + l + '-nuevo-gratis-3') + ');', a.ctx);
    vm.runInContext(BANK_NAME[s] + '.' + l + '.push(' + mk('x-' + l + '-m300-final-1') + ', ' + mk('x-' + l + '-nuevo-gratis-9') + ');', a.ctx);
  }));
  const after = snapshot();
  Object.keys(before).forEach(k => assert.strictEqual(after[k], before[k], 'cambio el acceso de ' + k + ' al agregar bloques'));
  SKILLS.forEach(s => LEVELS.forEach(l => {
    assert.strictEqual(after[s + '/' + l + '/x-' + l + '-nuevo-gratis-0'], false);
    assert.strictEqual(after[s + '/' + l + '/x-' + l + '-nuevo-gratis-3'], false);
    assert.strictEqual(after[s + '/' + l + '/x-' + l + '-nuevo-gratis-9'], false);
    assert.strictEqual(after[s + '/' + l + '/x-' + l + '-m100-medio-1'], true);
    assert.strictEqual(after[s + '/' + l + '/x-' + l + '-m300-final-1'], true);
  }));
});

test('reordenar los bloques existentes tampoco cambia el acceso', () => {
  const a = loadAccess(root);
  const acceso = () => { const o = {}; SKILLS.forEach(s => LEVELS.forEach(l => { const b = vm.runInContext(BANK_NAME[s] + '.' + l, a.ctx), bl = new Set(a.MEMBERS_ONLY_VARIANT_INDEX[s][l]); b.forEach((v, vi) => { o[s + '/' + l + '/' + ids(v)[0]] = bl.has(vi); }); })); return o; };
  const before = acceso();
  SKILLS.forEach(s => LEVELS.forEach(l => vm.runInContext('(function(){ var b = ' + BANK_NAME[s] + '.' + l + '; b.reverse(); var x = b.splice(2, 3); Array.prototype.push.apply(b, x); })()', a.ctx)));
  const after = acceso();
  assert.deepStrictEqual(after, before);
});

test('visitante: ninguna variante elegida para una sesion gratis es de m100 ni m300, y salen los gratis previstos (5 habilidades x 4 niveles)', () => {
  SKILLS.forEach(s => LEVELS.forEach(l => {
    reset();
    const b = bank(s, l), blocked = A.MEMBERS_ONLY_VARIANT_INDEX[s][l];
    const seen = new Set();
    for(let i = 0; i < 600; i++){
      const vi = run('pickVariantIndex(' + JSON.stringify(s) + ',' + JSON.stringify(l) + ',' + b.length + ',' + JSON.stringify(blocked) + ')');
      assert.ok(blocked.indexOf(vi) === -1, s + '/' + l + ': el visitante recibio la variante ' + vi + ' (exclusiva)');
      ids(b[vi]).forEach(id => assert.ok(!MEMBER_BATCH.test(id), s + '/' + l + ': el visitante recibio ' + id));
      seen.add(vi);
    }
    const freeIdx = Array.from(b, (v, i) => i).filter(i => blocked.indexOf(i) === -1);
    assert.deepStrictEqual(Array.from(seen).sort((x, y) => x - y), freeIdx, s + '/' + l + ': el visitante debe poder recibir TODAS las variantes gratis');
    // entre los gratis previstos estan los lotes m200 y m400 (y numeros donde existen)
    const freeIds = freeIdx.reduce((acc2, i) => acc2.concat(ids(b[i])), []);
    assert.ok(freeIds.some(id => /-m200-/.test(id)) && freeIds.some(id => /-m400-/.test(id)) || s === 'writing', s + '/' + l + ': faltan m200/m400 en lo gratis');
  }));
});

test('miembro: puede recibir ejercicios de ambos lotes (m100 y m300) en las 5 habilidades x 4 niveles', () => {
  SKILLS.forEach(s => LEVELS.forEach(l => {
    const items = run('memberBankItems(' + JSON.stringify(s) + ', ' + BANK_NAME[s] + '.' + l + ')');
    const got = new Set(); items.forEach(it => { const m = String(it.id).match(MEMBER_BATCH); if(m) got.add(m[1]); });
    assert.deepStrictEqual([...got].sort(), ['m100', 'm300'], s + '/' + l + ': el miembro debe recibir m100 y m300, recibe ' + [...got]);
    // y una sesion de miembro sin exclusiones (como pickVariantIndex para miembros) alcanza todas las variantes
    reset();
    const b = bank(s, l), seen = new Set();
    for(let i = 0; i < 800; i++) seen.add(run('pickVariantIndex(' + JSON.stringify(s) + ',' + JSON.stringify(l) + ',' + b.length + ')'));
    const reach = [...seen].some(vi => ids(b[vi]).some(id => /-m100-/.test(id))) && [...seen].some(vi => ids(b[vi]).some(id => /-m300-/.test(id)));
    assert.ok(reach, s + '/' + l + ': una sesion de miembro no llega a m100 y m300');
  }));
});

test('visitante: el reto diario gratis nunca trae m100 ni m300; el de miembro si puede', () => {
  LEVELS.forEach(l => {
    reset();
    for(let i = 0; i < 300; i++){
      const picks = run('pickDailyChallengeItems(' + JSON.stringify(l) + ', true)');
      picks.forEach(p => assert.ok(!MEMBER_BATCH.test(String(p.item.id)), l + ': reto gratis con ' + p.item.id));
    }
    let member = false;
    for(let i = 0; i < 600 && !member; i++){ run('pickDailyChallengeItems(' + JSON.stringify(l) + ', false)').forEach(p => { if(MEMBER_BATCH.test(String(p.item.id))) member = true; }); }
    assert.ok(member, l + ': el reto de miembro no alcanza los lotes exclusivos');
  });
});

test('visitante: la practica gratis por tema (gramatica, vocabulario, listening) no incluye m100 ni m300 y sigue ofreciendo ejercicios gratis', () => {
  let total = 0;
  const temas = run('TEMAS').map(t => t.id);
  LEVELS.forEach(l => temas.forEach(tid => {
    const t = run('TEMA_BY_ID[' + JSON.stringify(tid) + ']');
    const items = run('freeTemaItems(' + JSON.stringify(l) + ',' + JSON.stringify(tid) + ')');
    items.forEach(it => assert.ok(!MEMBER_BATCH.test(String(it.id)), l + '/' + tid + ' (' + t.skill + '): ofrece ' + it.id));
    total += items.length;
  }));
  assert.ok(total > 400, 'la practica gratis por tema quedo casi vacia: ' + total);
});

console.log('\n  ' + passed + ' ok, ' + failed + ' con fallo');
if(failed) process.exit(1);
