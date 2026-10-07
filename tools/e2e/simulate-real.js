#!/usr/bin/env node
/* Simulación Monte Carlo con la IMPLEMENTACIÓN REAL: cada respuesta pasa por applyMicroResults / microFlowState /
   pickCheckItems / markChecksConsumed del app.js real (no por el modelo abstracto de simulate-flow.js).
   Uso:  node tools/e2e/simulate-real.js [microId] [--runs 3000] [--gain 0.01] [--gen 0.95]
   Mide, por nivel de alumno (40/60/80/90 %) y por banco (3 checks vs 6 checks): % que llega al check, respuestas hasta
   la primera oferta, checks gastados en fallo por cada 100 alumnos, resultado de la 1ª ronda, 2ª ronda y callejón. */
const { createCloud, makeDevice } = require('./lib/sim');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : Number(args[i + 1]); };
const RUNS = opt('--runs', 3000), GAIN = opt('--gain', 0.01), GEN = opt('--gen', 0.95), CAP = opt('--cap', 30);
const microId = args.find((a, i) => !a.startsWith('--') && !/^--/.test(args[i - 1] || '')) || 'cond-1-probable';

function rng(seed){ let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const T = makeDevice(createCloud(), {});
let R = rng(1); T.ctx.__rng = () => R(); require('vm').runInContext('Math.random = function(){ return __rng(); };', T.ctx);
const level = 'medio';
const practice = []; T.GRAMMAR_BANK[level].forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === microId) practice.push(i); })));
const checkIds = T.GRAMMAR_CHECK_BANK.filter(c => c.micro === microId).map(c => c.id);
const DATE = '2026-10-07';

function resetStore(banco){
  Object.keys(T.store).forEach(k => delete T.store[k]);
  T.store[T.DERIVED_META_KEY] = JSON.stringify({ sig: 0, v: T.DERIVED_VERSION });    // sin sesiones guardadas: nada que reconstruir
  const seen = {}; if(banco === 3) checkIds.slice(3).forEach(id => { seen[id] = 1; });   // banco de 3 = la 2ª ronda ya "gastada"
  if(Object.keys(seen).length) T.store[T.CHECK_SEEN_KEY] = JSON.stringify(seen);
}
function student(p0, banco, seed){
  R = rng(seed); resetStore(banco);
  const all = {};
  const wk = practice.slice(0, 3).map(it => ({ itemId: it.id, isCorrect: true, m: microId, w: 'x' }));
  T.applyMicroResults(all, wk, DATE);                                         // 3 fallos distintos -> microdebilidad
  const out = { rounds: [], answers: 0 };
  let p = p0;
  while(out.answers < CAP){
    const ok = R() < p; const it = practice[(3 + out.answers) % practice.length];
    out.answers++; T.applyMicroResults(all, [{ itemId: it.id, isCorrect: ok, m: microId, w: ok ? undefined : 'x' }], DATE);
    p = Math.min(0.97, p + GAIN);
    const st = all[microId];
    if(!st.wk){ out.rounds.push({ type: 'cerrada', n: out.answers }); break; }
    if(T.microFlowState(microId, st).state === 'listo-comprobar'){
      const items = T.pickCheckItems(microId, 3); if(!items) continue;
      let k = 0; const results = items.map(c => { const good = R() < p * GEN; if(good) k++; return { itemId: c.id, isCorrect: good, m: microId }; });
      T.markChecksConsumed(results); T.applyMicroResults(all, results, DATE);
      out.rounds.push({ type: 'check', n: out.answers, k, pNow: p });
      if(!all[microId].wk) break;                                             // 3/3 recuperado o 2/3 mejora: alerta cerrada
    }
  }
  return out;
}
function cell(p0, banco){
  let reach = 0, ans = 0, o3 = 0, o2 = 0, o1 = 0, failedFirst = 0, second = 0, secondMaster = 0, dead = 0, mastered = 0, wasted = 0, tooEarly = 0;
  for(let i = 0; i < RUNS; i++){
    const s = student(p0, banco, 7000 + i * 13 + Math.round(p0 * 100));
    const c = s.rounds.filter(r => r.type === 'check');
    if(c[0]){ reach++; ans += c[0].n; if(c[0].pNow < 0.75) tooEarly++; if(c[0].k === 3) o3++; else if(c[0].k === 2) o2++; else { o1++; wasted++; } }
    if(c[0] && c[0].k <= 1){ failedFirst++; if(c[1]){ second++; if(c[1].k === 3) secondMaster++; } const closed = s.rounds.some(r => r.type === 'cerrada'); if((!c[1] || c[1].k <= 1) && !closed) dead++; }
    const last = c[c.length - 1]; if(last && last.k === 3) mastered++;
    if(c[1]) wasted += (c[1].k <= 1 ? 1 : 0);
  }
  const pc = x => 100 * x / RUNS;
  return { p0, banco, reach: pc(reach), avg: reach ? ans / reach : 0, wastedPer100: pc(wasted), out3: reach ? 100 * o3 / reach : 0, out2: reach ? 100 * o2 / reach : 0, out1: reach ? 100 * o1 / reach : 0,
    failedFirst: pc(failedFirst), secondOfFailed: failedFirst ? 100 * second / failedFirst : 0, secondMasterOfFailed: failedFirst ? 100 * secondMaster / failedFirst : 0,
    deadOfFailed: failedFirst ? 100 * dead / failedFirst : 0, mastered: pc(mastered) };
}
const f = (x, d = 0) => x.toFixed(d);
console.log('Simulación con la implementación REAL | microtema ' + microId + ' | ' + RUNS + ' alumnos por celda | +' + (GAIN * 100) + ' pts por respuesta | checks ×' + GEN);
console.log('Reglas leídas del código: ' + JSON.stringify({ oferta: T.MICRO_FLOW.CHECK_AFTER_PRACTICE, distintos: T.MICRO_FLOW.CHECK_MIN_DISTINCT, ultimas5: T.MICRO_FLOW.CHECK_RECENT_OK + '/' + T.MICRO_FLOW.CHECK_RECENT, acumulado: T.MICRO_FLOW.CHECK_MIN_ACC + '%' }) + '\n');
console.log('banco  p0   llega%  resp.med  checks gastados en fallo/100 | 3/3%  2/3%  <=1/3% | fallan 1ª%  2ª ronda%  domina 2ª%  callejón% | dominio total%');
for(const banco of [3, 6]) for(const p0 of [0.4, 0.6, 0.8, 0.9]){
  const c = cell(p0, banco);
  console.log(String(banco).padStart(3) + String(Math.round(p0 * 100) + '%').padStart(7) + f(c.reach, 1).padStart(8) + f(c.avg, 1).padStart(9) + f(c.wastedPer100, 0).padStart(15) + '           |' + f(c.out3).padStart(5) + f(c.out2).padStart(6) + f(c.out1).padStart(7) + ' |' + f(c.failedFirst, 1).padStart(10) + f(c.secondOfFailed).padStart(11) + f(c.secondMasterOfFailed).padStart(11) + f(c.deadOfFailed).padStart(11) + ' |' + f(c.mastered, 1).padStart(10));
}
