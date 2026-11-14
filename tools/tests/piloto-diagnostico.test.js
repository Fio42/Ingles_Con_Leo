#!/usr/bin/env node
/* Casos concretos: que pasa con el aprendizaje adaptativo cuando una persona de nivel PRINCIPIANTE practica, con el boton
   "Practicar este tema", ejercicios de un nivel superior (el Plan los usa porque su nivel no tiene ejercicios de ese tema).
   Regla que se comprueba (decidida a proposito): esas respuestas cuentan para el DOMINIO DEL TEMA, la familia y las recomendaciones de
   refuerzo (la persona pidio ese tema), pero NO mueven su porcentaje por habilidad ni su estado (que miden SU nivel), ni su nivel guardado,
   ni la sugerencia de cambio de nivel. Lo que la persona practica por su cuenta en otro nivel sigue contando como siempre (sin la marca xt).
   Corre con:  node tools/tests/piloto-diagnostico.test.js */
'use strict';
const { A } = require('./lib/cargar-app');
const day = 86400000, now = Date.now();
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if(!c) fails.push(m); };
const temaItems = (lvl, temaId) => { const o = []; A.GRAMMAR_BANK[lvl].forEach(v => v.forEach(g => { if(A.diagTemaIdForFound({ kind: 'grammar', item: g.items[0], topic: g.topic }) === temaId) g.items.forEach(it => o.push(it.id)); })); return o; };
const own = []; A.GRAMMAR_BANK.principiante.forEach(v => v.forEach(g => g.items.forEach(it => own.push(it.id))));
function history(){            // 40 respuestas propias en Principiante, ~85% bien, en dos sesiones
  const res = []; for(let i = 0; i < 40; i++) res.push({ itemId: own[i % own.length], isCorrect: i % 7 !== 0, skill: 'gramatica' });
  return [{ skill: 'gramatica', level: 'principiante', startedAt: now - 5 * day, results: res.slice(0, 20) }, { skill: 'gramatica', level: 'principiante', startedAt: now - 3 * day, results: res.slice(20) }];
}
function diagWith(temaId, okCount, total, flags){
  const ids = temaItems('facil', temaId).slice(0, total);
  const results = ids.map((id, i) => Object.assign({ itemId: id, isCorrect: i < okCount, skill: 'gramatica', cl: 'facil' }, flags || {}));
  const p = { sessions: history().concat(total ? [{ skill: 'plan', level: 'principiante', startedAt: now - 3600e3, results }] : []) };
  const d = A.computeDiagnosis(p, null);
  return { d, p, gram: d.units.find(u => u.key === 'skill:gramatica'), fam: d.units.find(u => u.key === 'family:' + A.TEMA_BY_ID[temaId].family),
    tema: ((d.units.find(u => u.key === 'family:' + A.TEMA_BY_ID[temaId].family) || {}).temaStats || []).find(s => s.id === temaId) };
}
const T = 'presente-simple';
ok(temaItems('principiante', T).length === 0 && temaItems('facil', T).length >= 10, 'caso: ' + T + ' no existe en Principiante y si en Facil');
const base = diagWith(T, 0, 0);
// 1. Fallar el tema en otro nivel: el porcentaje por habilidad y su estado NO se mueven; el tema SI queda como debil
const falla = diagWith(T, 0, 6, { xt: 1 });
ok(falla.gram.current === base.gram.current && falla.gram.state === base.gram.state, 'fallar 6 de 6 en otro nivel no cambia el porcentaje ni el estado de Gramatica (' + base.gram.current + ' -> ' + falla.gram.current + ')');
ok(!!falla.tema && falla.tema.n === 6 && falla.tema.acc === 0 && !falla.tema.dominated, 'fallar 6 de 6 si queda registrado como debil en el tema (n=' + (falla.tema && falla.tema.n) + ')');
// 2. Acertar todo en otro nivel: no infla Gramatica y el tema no queda "dominado" con 6 respuestas
const acierta = diagWith(T, 6, 6, { xt: 1 });
ok(acierta.gram.current === base.gram.current, 'acertar 6 de 6 en otro nivel no infla el porcentaje de Gramatica');
ok(!!acierta.tema && acierta.tema.acc === 100 && acierta.tema.dominated === false, 'acertar 6 de 6 no declara el tema dominado de golpe');
// 3. Lo que la persona practica por su cuenta en otro nivel (sin la marca) sigue contando como siempre
const propio = diagWith(T, 0, 6, {});
ok(propio.gram.current < base.gram.current, 'sin la marca (nivel elegido por la persona) el comportamiento de siempre se conserva (' + base.gram.current + ' -> ' + propio.gram.current + ')');
// 4. Recomendaciones de refuerzo y progreso posterior
const f = diagWith(T, 2, 10, { xt: 1 });
ok(f.d.weak && f.d.weak.id === T && f.d.weak.focusTema && f.d.weak.focusTema.id === T, 'despues de fallar el tema, el diagnostico recomienda reforzar ese tema');
ok(f.d.today && /foco=presente-simple&tema=presente-simple/.test(f.d.today.href), 'la recomendacion de hoy apunta al Plan de ese tema (' + (f.d.today && f.d.today.href) + ')');
A.saveProfile({ level: 'principiante' });
const q = new URLSearchParams(f.d.today.href.split('?')[1]);
const sel = A.computePlanSelection('principiante', 9, { focusFamily: q.get('foco'), focusTema: q.get('tema') });
ok(sel.focus && sel.focus.temaOnly && sel.focus.temaLevel === 'facil', 'seguir esa recomendacion abre una sesion solo de ese tema con ejercicios de Facil, avisando');
const sinFoco = A.computePlanSelection('principiante', 9, {});
ok(!sinFoco.focus || sinFoco.focus.temaId !== T, 'el Plan sin foco no se desvia al tema de otro nivel');
ok(A.getUserLevel() === 'principiante', 'el nivel guardado sigue siendo Principiante');
// 5. Dominio posterior: practicar su propio nivel despues funciona igual (el historial de otro nivel no estorba)
const mejora = diagWith(T, 9, 10, { xt: 1 });
ok(mejora.tema && mejora.tema.acc === 90 && !(mejora.d.weak && mejora.d.weak.id === T), 'si despues acierta el tema, deja de ser refuerzo');
// 6. El porcentaje historico (legacy) tampoco cuenta lo de otro nivel marcado
const legacyBase = A.computeSkillAccuracy(base.p, 'gramatica'), legacyFalla = A.computeSkillAccuracy(falla.p, 'gramatica');
ok(legacyBase === legacyFalla, 'el porcentaje historico por habilidad tampoco cambia (' + legacyBase + ' / ' + legacyFalla + ')');

if(fails.length){ console.error('FALLA piloto-diagnostico (' + fails.length + ' de ' + checks + '):\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('piloto-diagnostico: ' + checks + ' comprobaciones, todas bien');
