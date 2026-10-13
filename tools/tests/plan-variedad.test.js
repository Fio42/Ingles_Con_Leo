#!/usr/bin/env node
/* VARIEDAD DEL PLAN DE ESTUDIO (Miembros).
   Corre con:  node tools/tests/plan-variedad.test.js   (desde la carpeta inglesconLeo)
   Usa app.js, data.js, temas.js y backend.js REALES con la nube simulada de tools/e2e/lib/sim.js.

   Problema que protege: el Plan armaba sus ejercicios con bloques fijos y tomaba siempre los primeros de cada bloque, así que solo
   alcanzaba 20-35 % de cada banco y repetía ejercicios mientras quedaban otros sin ver (auditoría 2026-10-13). Ahora usa el mismo
   mazo barajado que las sesiones de Miembros (computeCycleState / pickCycleItems).

   Reglas:
   - repetición EVITABLE = ejercicio de habilidad normal (ni repaso de errores ni refuerzo) que la cuenta ya resolvió mientras en su banco
     quedaban ejercicios sin ver que no venían en esa misma sesión. Debe haber 0, en todas las sesiones (en particular 3, 5 y 9);
   - la sesión siempre tiene la duración pedida y ningún ejercicio dentro de ella se repite;
   - el repaso de errores solo trae ejercicios que la cuenta falló antes; el refuerzo respeta nivel e historial;
   - con el banco agotado (se vuelve a barajar) la sesión sigue completa y sin repetidos dentro de ella. */
const assert = require('assert');
const vm = require('vm');
const { createCloud, makeDevice } = require('../e2e/lib/sim.js');
const LEVELS = ['principiante', 'facil', 'medio', 'avanzado'];
const BANKS = { gramatica:'GRAMMAR_BANK', vocabulario:'VOCAB_BANK', listening:'LISTENING_BANK', writing:'WRITING_BANK', speaking:'SPEAKING_BANK' };

let passed = 0, queue = Promise.resolve();
function test(name, fn){
  queue = queue.then(async () => {
    try{ await fn(); passed++; console.log('  ok  ' + name); }
    catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
  });
}

// Alumno inventado: arma sesiones de Plan como lo hace la página (selección -> pool -> respuestas -> recordSession).
function student(level, seed){
  let s = seed || 12345;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const cloud = createCloud(); cloud.profile.level = level;
  const D = makeDevice(cloud, {});
  D.store.leo_profile = JSON.stringify({ name:'QA', level, createdAt: 1 });
  const run = c => vm.runInContext(c, D.ctx);
  const kindToSkill = run('PLAN_KIND_TO_SKILL');
  const bankIds = {}, seen = {}, failed = new Set();
  Object.keys(BANKS).forEach(sk => { bankIds[sk] = new Set(D.memberBankItems(sk, run('PLAN_BANK_BY_SKILL')[sk][level]).map(i => i.id)); seen[sk] = new Set(); });
  let t = Date.now() - 200 * 86400000;
  const out = { D, bankIds, seen, failed, avoidable: [], sessions: [] };
  out.session = (target, wrongRate) => {
    const sel = D.computePlanSelection(level, target, {});
    const pool = D.buildPlanPool(level, sel);
    const inPool = {};
    pool.forEach(e => { const sk = kindToSkill[e.kind]; (inPool[sk] = inPool[sk] || new Set()).add(e.item.id); });
    let avoidable = 0;
    pool.forEach(e => {
      const sk = kindToSkill[e.kind];
      if(e.reviewOrigin || e.focus) return;
      if(seen[sk].has(e.item.id) && [...bankIds[sk]].some(id => !seen[sk].has(id) && !inPool[sk].has(id))) avoidable++;
    });
    const results = pool.map(e => ({ itemId:e.item.id, isCorrect: e.kind === 'speaking' ? null : !(rnd() < (wrongRate || 0)), skill: kindToSkill[e.kind] }));
    D.recordSession({ skill:'plan', level, topics:[], results, startedAt: (t += 3600000) });
    const info = { pool, sel, avoidable, review: pool.filter(e => e.reviewOrigin), failedBefore: new Set(failed) };
    results.forEach((r, i) => { seen[kindToSkill[pool[i].kind]].add(r.itemId); if(r.isCorrect === false) failed.add(r.itemId); });
    out.avoidable.push(avoidable); out.sessions.push(info);
    return info;
  };
  return out;
}

function sessionsOk(st, info, target, label){
  assert.strictEqual(info.pool.length, target, label + ': la sesión no tiene ' + target + ' ejercicios (' + info.pool.length + ')');
  const ids = info.pool.map(e => e.item.id);
  assert.strictEqual(new Set(ids).size, ids.length, label + ': ejercicio repetido dentro de la misma sesión');
  assert.strictEqual(info.avoidable, 0, label + ': ' + info.avoidable + ' repeticiones evitables');
}

console.log('Plan de estudio: variedad de ejercicios');

LEVELS.forEach(level => {
  test(level + ': cuenta nueva, sesiones 1 a 9 (y hasta la 14): sin repeticiones evitables, siempre completas', () => {
    const st = student(level);
    for(let n = 1; n <= 14; n++) sessionsOk(st, st.session(9), 9, level + ' sesión ' + n);
    // las sesiones 3, 5 y 9 en particular
    [3, 5, 9].forEach(n => assert.strictEqual(st.avoidable[n - 1], 0, level + ' sesión ' + n));
  });
});

test('duraciones Rápida (5), Normal (9) y Completa (15): completas y sin repetidos', () => {
  LEVELS.forEach(level => {
    const st = student(level, 777);
    [5, 9, 15, 9, 5, 15, 9, 15].forEach((target, i) => sessionsOk(st, st.session(target), target, level + ' ' + target + ' sesión ' + (i + 1)));
  });
});

test('errores acumulados (40 % de fallos): el repaso solo trae ejercicios ya fallados y lo demás no se repite sin necesidad', () => {
  LEVELS.forEach(level => {
    const st = student(level, 4242);
    for(let n = 1; n <= 12; n++){
      const info = st.session(9, 0.4);
      sessionsOk(st, info, 9, level + ' errores sesión ' + n);
      info.review.forEach(e => assert.ok(info.failedBefore.has(e.item.id), level + ': el repaso trae un ejercicio que nunca falló: ' + e.item.id));
    }
    assert.ok(st.failed.size > 10, 'el alumno inventado sí acumuló errores');
  });
});

test('alumno avanzado (mucho historial previo): sigue sin repetir lo evitable', () => {
  LEVELS.forEach(level => {
    const st = student(level, 99);
    for(let n = 0; n < 30; n++) st.session(15);               // historial largo
    for(let n = 1; n <= 9; n++) sessionsOk(st, st.session(9), 9, level + ' avanzado sesión ' + n);
  });
});

test('banco agotado: al terminar un banco se vuelve a barajar, la sesión sigue completa y sin repetidos dentro de ella', () => {
  const st = student('principiante', 31337);
  let exhausted = false;
  for(let n = 1; n <= 90 && !exhausted; n++){
    sessionsOk(st, st.session(15), 15, 'principiante agotando sesión ' + n);
    exhausted = Object.keys(BANKS).some(sk => st.seen[sk].size >= st.bankIds[sk].size);
  }
  assert.ok(exhausted, 'algún banco llegó a agotarse');
  for(let n = 1; n <= 6; n++) sessionsOk(st, st.session(15), 15, 'principiante tras agotar sesión ' + n);
});

test('el Plan alcanza todo el banco, no solo los primeros ejercicios de cada bloque', () => {
  const st = student('facil', 2026);
  for(let n = 1; n <= 60; n++) st.session(15);
  Object.keys(BANKS).forEach(sk => {
    const frac = st.seen[sk].size / st.bankIds[sk].size;
    assert.ok(frac >= 0.6, sk + ': el Plan solo vio ' + Math.round(frac * 100) + ' % del banco tras 60 sesiones');
  });
});

test('refuerzo con foco de microtema: respeta el nivel y no trae ejercicios de comprobación', () => {
  const st = student('medio', 5);
  const checkIds = new Set(st.D.GRAMMAR_CHECK_BANK.map(c => c.id));
  for(let n = 0; n < 6; n++){
    const sel = st.D.computePlanSelection('medio', 9, { focusMicro:'cond-1-probable' });
    const pool = st.D.buildPlanPool('medio', sel);
    const medioIds = new Set(st.D.memberBankItems('gramatica', st.D.GRAMMAR_BANK.medio).map(i => i.id));
    pool.forEach(e => { assert.ok(!checkIds.has(e.item.id), 'comprobación dentro del Plan: ' + e.item.id); if(e.kind === 'grammar') assert.ok(medioIds.has(e.item.id), e.item.id + ' no es del nivel medio'); });
  }
});

queue.then(() => console.log('\n' + passed + ' pruebas pasaron' + (process.exitCode ? ' (hay fallas)' : '')));
