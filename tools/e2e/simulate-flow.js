#!/usr/bin/env node
/* Simulador Monte Carlo de POLÍTICAS de refuerzo -> comprobación (solo análisis; no modifica app.js ni datos).
   Uso:  node tools/e2e/simulate-flow.js [--runs 20000] [--gain 0.02] [--gen 0.95] [--pool 6] [--json out.json]

   Modelo (supuestos explícitos, todos ajustables):
   - El alumno parte de una precisión al primer intento p0 (40, 60, 80, 90 %) en los ejercicios de refuerzo.
   - Cada respuesta de refuerzo mejora su precisión +gain (aprender practicando), con tope 97 %.
   - El refuerzo recorre los `pool` ejercicios del microtema en rotación (distintos = min(n, pool)).
   - Cada ítem de comprobación (inédito) lo acierta con probabilidad precisión_actual * gen (los checks son ejercicios nuevos).
   - Reglas copiadas de app.js (MICRO_FLOW leído del código real): 3/3 = dominio, 2/3 = mejora (alerta cerrada, sin dominio),
     <=1/3 = sigue débil y los contadores de refuerzo se reinician; auto-cierre sin dominio con >=6 respuestas y >=80 % de aciertos.
   Políticas de oferta del check (siempre exigen >=5 respuestas y >=4 ejercicios distintos):
     A  actual: sin requisito de precisión
     B  60 %: acierto acumulado al primer intento >= 60 %
     C  80 %: en las ÚLTIMAS 5 respuestas, al menos 4 correctas al primer intento (la precisión debe seguir siendo suficiente)
   Horizonte H: hasta cuántas respuestas de refuerzo se evalúa la oferta (5, 8 o sin tope). NUNCA se ofrece "sí o sí" por llegar a H. */
const { makeDevice, createCloud } = require('./lib/sim');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : Number(args[i + 1]); };
const RUNS = opt('--runs', 20000), GAIN = opt('--gain', 0.01), GEN = opt('--gen', 0.95), POOL = opt('--pool', 6), CAP = 30, EXIT_MAX = 15;
const MF = makeDevice(createCloud(), {}).MICRO_FLOW;              // constantes REALES del flujo actual
const MIN_N = MF.CHECK_AFTER_PRACTICE, MIN_DISTINCT = 4, CHECK_SIZE = MF.CHECK_SIZE;
const AUTO = { min: MF.AUTOCLEAR_MIN, acc: MF.AUTOCLEAR_ACC / 100 };

function rng(seed){ let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const POLICIES = {
  A: { name:'A actual (sin precisión)', ok: w => true },
  B: { name:'B 60 % acumulado',         ok: w => w.correct / w.n >= 0.6 },
  C: { name:'C 4 de las últimas 5',     ok: w => { const l = w.last5.slice(-5); return l.length >= 5 && l.reduce((s, x) => s + x, 0) >= 4; } },
  F: { name:'F 4/5 recientes + 70% acum.',  ok: w => { const l = w.last5.slice(-5); return l.length >= 5 && l.reduce((s, x) => s + x, 0) >= 4 && w.correct / w.n >= 0.7; } },
  D: { name:'D 6 de las últimas 8',     ok: w => { const l = w.last5.slice(-8); return l.length >= 8 && l.reduce((s, x) => s + x, 0) >= 6; } },
  E: { name:'E 5 de las últimas 6',     ok: w => { const l = w.last5.slice(-6); return l.length >= 6 && l.reduce((s, x) => s + x, 0) >= 5; } }
};

// Un alumno desde que se detecta la debilidad hasta que sale del flujo. Devuelve el historial de rondas.
function student(p0, policy, H, checksAvailable, R){
  let answers = 0, p = p0, rounds = [], bankLeft = checksAvailable, cleared = false;
  let w = { n:0, correct:0, last5:[], items:0 };                   // ventana de refuerzo desde la última (re)detección
  let offeredAt = null, firstOfferAnswers = null;
  while(answers < CAP * 2 && !cleared){
    const ok = R() < p;                                             // acierto al primer intento
    answers++; w.n++; if(ok) w.correct++; w.last5.push(ok ? 1 : 0); if(w.last5.length > 8) w.last5.shift(); w.last8 = w.last5;
    w.items = Math.min(w.n, POOL);
    p = Math.min(0.97, p + GAIN);
    // auto-cierre sin dominio (solo cuando ya hubo comprobación o no quedan checks)
    if(w.n >= AUTO.min && w.correct / w.n >= AUTO.acc && (rounds.length > 0 || bankLeft < CHECK_SIZE)){ cleared = true; rounds.push({ type:'autoclear', n:w.n }); break; }
    const inHorizon = w.n <= H;
    if(bankLeft >= CHECK_SIZE && w.n >= MIN_N && w.items >= MIN_DISTINCT && inHorizon && policy.ok(w)){
      // se ofrece y hace la comprobación
      let k = 0; for(let i = 0; i < CHECK_SIZE; i++) if(R() < p * GEN) k++;
      bankLeft -= CHECK_SIZE;
      const r = { type:'check', n:w.n, answersTotal:answers, k, pNow:p - GAIN };
      rounds.push(r);
      if(k === CHECK_SIZE) break;                                  // dominio
      if(k === CHECK_SIZE - 1) break;                              // mejora: alerta cerrada sin dominio
      w = { n:0, correct:0, last5:[], items:0 };                   // <=1/3: sigue débil, contadores a cero
    }
    if(w.n >= CAP) break;
  }
  return { rounds, answers, p, bankLeft };
}

function simulate(p0, policyKey, H, checks, seed){
  const R = rng(seed), pol = POLICIES[policyKey], out = { n: RUNS };
  let offered1 = 0, sumAns1 = 0, tooEarly = 0, wasted1 = 0, o3 = 0, o2 = 0, o1 = 0, over8 = 0, over15 = 0, never = 0, consumed = 0;
  let failedFirst = 0, secondOffered = 0, secondMaster = 0, secondImprove = 0, deadEnd = 0, autoExit = 0, mastered = 0, improved = 0;
  for(let i = 0; i < RUNS; i++){
    const s = student(p0, pol, H, checks, R);
    const checksDone = s.rounds.filter(r => r.type === 'check');
    consumed += checksDone.length * CHECK_SIZE;
    const c1 = checksDone[0];
    if(!c1){ never++; }
    else {
      offered1++; sumAns1 += c1.n;
      if(c1.pNow < 0.75) tooEarly++;                                 // se ofreció con el alumno aún por debajo de 75 % real
      if(c1.k === 3) o3++; else if(c1.k === 2) o2++; else { o1++; wasted1++; }
      if(c1.n > 8) over8++; if(c1.n > 15) over15++;
    }
    if(c1 && c1.k <= 1){
      failedFirst++;
      const c2 = checksDone[1];
      if(c2){ secondOffered++; if(c2.k === 3) secondMaster++; else if(c2.k === 2) secondImprove++; }
      const exited = s.rounds.some(r => r.type === 'autoclear' && r.n <= EXIT_MAX);   // sale sin dominio solo si ocurre en <=15 respuestas
      if(exited) autoExit++;
      if(!c2 && !exited) deadEnd++;                                   // falló, no quedan checks y no logró salir por auto-cierre
      else if(c2 && c2.k <= 1 && !exited) deadEnd++;
    }
    const last = checksDone[checksDone.length - 1];
    if(last && last.k === 3) mastered++; else if(last && last.k === 2) improved++;
  }
  const pc = x => (100 * x / RUNS);
  return { p0, policy: policyKey, H, checks,
    reach: pc(offered1), avgAns: offered1 ? sumAns1 / offered1 : null, tooEarlyPctOfOffered: offered1 ? 100 * tooEarly / offered1 : 0,
    over8: pc(over8), over15: pc(over15), never: pc(never), avgChecksUsed: consumed / RUNS,
    out3: offered1 ? 100 * o3 / offered1 : 0, out2: offered1 ? 100 * o2 / offered1 : 0, out1: offered1 ? 100 * o1 / offered1 : 0,
    failedFirst: pc(failedFirst), secondOffered: failedFirst ? 100 * secondOffered / failedFirst : 0, secondMaster: failedFirst ? 100 * secondMaster / failedFirst : 0,
    deadEndOfFailed: failedFirst ? 100 * deadEnd / failedFirst : 0, deadEnd: pc(deadEnd), autoExit: failedFirst ? 100 * autoExit / failedFirst : 0, mastered: pc(mastered), improved: pc(improved) };
}

const fmt = (x, d = 0) => x === null ? '  - ' : x.toFixed(d);
const pad = (s, n) => String(s).padStart(n);
const P0 = [0.4, 0.6, 0.8, 0.9], HS = [[5, '5'], [8, '8'], [CAP, '∞']];
const results = [];
for(const key of Object.keys(POLICIES)) for(const [H, hl] of HS) for(const p0 of P0) results.push(simulate(p0, key, H, 3, 1000 + Math.round(p0 * 100)));
for(const key of ['A', 'C', 'D', 'F']) for(const p0 of P0) results.push(simulate(p0, key, CAP, 6, 2000 + Math.round(p0 * 100)));
for(const p0 of P0){ results.push(simulate(p0, 'C', 8, 6, 3000 + Math.round(p0 * 100))); results.push(simulate(p0, 'F', 8, 6, 3500 + Math.round(p0 * 100))); }

console.log('Simulación: ' + RUNS + ' alumnos por celda | ganancia por respuesta +' + (GAIN * 100) + ' pts | factor de los checks ' + GEN + ' | pool de práctica ' + POOL);
console.log('Constantes reales leídas de app.js: oferta a las ' + MIN_N + ' respuestas, check de ' + CHECK_SIZE + ', auto-cierre >=' + AUTO.min + ' respuestas y >=' + (AUTO.acc * 100) + ' %\n');
console.log('=== 1. OFERTA DEL CHECK (banco de 3 checks): ¿llega, cuándo y con qué resultado? ===');
console.log('política              H   p0   llega%  resp.med  ofrecido-aún-flojo%  tarda>8%  tarda>15%  nunca%  | 3/3%  2/3%  <=1/3%(check gastado en fallo)');
results.filter(r => r.checks === 3).forEach(r => console.log((POLICIES[r.policy].name.padEnd(24)) + pad(r.H === CAP ? '∞' : r.H, 1) + pad(Math.round(r.p0 * 100) + '%', 6) + pad(fmt(r.reach, 1), 8) + pad(fmt(r.avgAns, 1), 9) + pad(fmt(r.tooEarlyPctOfOffered, 1), 15) + pad(fmt(r.over8, 1), 14) + pad(fmt(r.over15, 1), 9) + pad(fmt(r.never, 1), 9) + '  | ' + pad(fmt(r.out3, 0), 4) + pad(fmt(r.out2, 0), 6) + pad(fmt(r.out1, 0), 7)));
console.log('\n=== 2. CALLEJÓN SIN SALIDA tras fallar la 1ª comprobación (<=1/3): 3 checks vs 6 checks (política sin tope de horizonte) ===');
console.log('política  banco  p0   fallan1ª%  2ª ronda%  domina2ª%  sale-por-autocierre%  callejón%(de los que fallaron)  dominio-total%  mejora%');
[...results.filter(r => r.checks === 3 && r.H === CAP && r.policy !== 'B'), ...results.filter(r => r.checks === 6)].sort((a, b) => a.policy.localeCompare(b.policy) || a.p0 - b.p0 || a.checks - b.checks)
  .forEach(r => console.log(pad(r.policy, 5) + pad(r.checks, 8) + pad(Math.round(r.p0 * 100) + '%', 7) + pad(fmt(r.failedFirst, 1), 10) + pad(fmt(r.secondOffered, 0), 10) + pad(fmt(r.secondMaster, 0), 11) + pad(fmt(r.autoExit, 0), 15) + pad(fmt(r.deadEndOfFailed, 0), 24) + pad(fmt(r.mastered, 1), 16) + pad(fmt(r.improved, 1), 9)));
const jf = args.indexOf('--json'); if(jf !== -1) require('fs').writeFileSync(args[jf + 1], JSON.stringify(results, null, 2));
