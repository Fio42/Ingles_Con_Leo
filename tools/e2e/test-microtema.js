#!/usr/bin/env node
/* QA E2E reutilizable de UN microtema (o de todos los activos). Sin dependencias.

   Uso:
     node tools/e2e/test-microtema.js cond-1-probable
     node tools/e2e/test-microtema.js going-to-evidencia --level medio
     node tools/e2e/test-microtema.js --all-active            (todos los microtemas con active:true en temas.js)
     node tools/e2e/test-microtema.js cond-2-imaginario --json out.json

   NADA se declara a mano por microtema: nivel, ejercicios de práctica, comprobación, recurso y URL de foco salen de
   temas.js + data.js (la única fuente). Un microtema nuevo con active:true entra solo en --all-active. Si hace falta
   cambiar algo (nivel, fallos requeridos), se declara en tools/e2e/micros.config.json:
     { "defaults": { "failsRequired": 3 }, "micros": { "<microId>": { "level": "medio", "failsRequired": 3 } } }

   Recorre con el app.js/backend.js REALES: 3 fallos distintos -> microdebilidad -> recomendación -> refuerzo ->
   (fallo accidental) -> comprobación -> 3 checks inéditos -> dominio -> no repetición -> segundo navegador con la misma cuenta.
   Verifica también los campos internos m, w, t, f, o, wi, wk, pr, ck, lc. Sale con código 1 si algo falla. */
const fs = require('fs'), path = require('path');
const { root, createCloud, makeDevice } = require('./lib/sim');

const cfgPath = path.join(__dirname, 'micros.config.json');
const CFG = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : { defaults:{}, micros:{} };
const plain = o => JSON.parse(JSON.stringify(o));

function microInfo(T, microId, levelOverride){
  const m = T.MICRO_BY_ID[microId];
  if(!m) throw new Error('Microtema inexistente en temas.js: ' + microId);
  const byLevel = {};
  Object.keys(T.GRAMMAR_BANK).forEach(l => T.GRAMMAR_BANK[l].forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === microId) (byLevel[l] = byLevel[l] || []).push(i); }))));
  const own = (CFG.micros || {})[microId] || {};
  const level = levelOverride || own.level || Object.keys(byLevel).sort((a, b) => byLevel[b].length - byLevel[a].length)[0];
  return { m, level, practice: (byLevel[level] || []), checks: T.GRAMMAR_CHECK_BANK.filter(c => c.micro === microId),
    failsRequired: own.failsRequired || (CFG.defaults || {}).failsRequired || 3, focusUrl: T.microPracticeHref(m, true) };
}

function makeRunner(microId){
  const res = [];
  const check = (name, ok, detail) => { res.push({ name, ok: !!ok, detail: ok ? undefined : detail }); return !!ok; };
  return { res, check };
}

// Una respuesta como en la pantalla: primer intento (mal/bien), reintento opcional y resultado final.
function answer(T, item, how){
  const card = () => ({ dataset:{} });
  if(how === 'fail-retry-ok'){ const c = card(); T.noteGrammarAnswer(c, item, false, 'primera-opcion'); T.markGrammarRetry(c); T.noteGrammarAnswer(card(), item, true, 'segunda-opcion'); return { itemId:item.id, isCorrect:true }; }
  if(how === 'fail'){ T.noteGrammarAnswer(card(), item, false, 'opcion-mala'); return { itemId:item.id, isCorrect:false }; }
  T.noteGrammarAnswer(card(), item, true, 'opcion-buena'); return { itemId:item.id, isCorrect:true };
}
let CLOCK = Date.now() - 3600000;
const play = (T, level, items, hows, skill) => {
  const results = items.map((it, i) => answer(T, it, hows[i] || hows[hows.length - 1]));
  T.recordSession({ skill: skill || 'plan', level, topics:[], results, startedAt: CLOCK += 1000 });
  return T.loadProgress().sessions.slice(-1)[0];
};

async function runMicro(microId, opts){
  opts = opts || {};
  const cloud = createCloud();
  const A = makeDevice(cloud, { search: '' });
  const { res, check } = makeRunner(microId);
  const info = microInfo(A, microId, opts.level);
  const { m, level, practice, checks, failsRequired } = info;
  const checkIds = checks.map(c => c.id);
  const MF = A.MICRO_FLOW;
  A.setUserLevel(level);
  A.ctx.location.search = '?micro=' + microId;          // el origen de la práctica será "micro" (como la URL de foco)
  const st = () => A.stats(microId);
  const state = () => A.microFlowState(microId, A.microStatsAll()[microId]).state;
  const sectionOf = h => h && /[?&]micro=/.test(h);

  // ---- 0. Precondiciones (todo sale de temas.js + data.js)
  check('0.1 el microtema está activo', A.microIsActive(microId), 'temas.js no lo declara active:true');
  check('0.2 tiene >=6 ejercicios de práctica en el nivel ' + level, practice.length >= 6, 'práctica en ' + level + ': ' + practice.length);
  check('0.3 tiene ' + MF.CHECK_SIZE + ' o más ejercicios de comprobación', checks.length >= MF.CHECK_SIZE, 'checks: ' + checks.length);
  check('0.4 tiene recurso (clase con ancla válida)', !!(m.lesson && m.lesson.article && fs.existsSync(path.join(root, m.lesson.article)) &&
    fs.readFileSync(path.join(root, m.lesson.article), 'utf8').indexOf('id="' + (m.lesson.anchor || m.id) + '"') !== -1), 'lesson: ' + JSON.stringify(m.lesson));
  check('0.5 sin historial no hay señales ni recomendación ni comprobación', state() === 'sin-datos' && A.microDiagActions(level, new Set([microId])).length === 0 && A.microCheckStart(microId).reason === 'no-toca', 'estado ' + state());
  if(!res.every(r => r.ok)) return { microId, level, res, info: { focusUrl: info.focusUrl } };

  // ---- 1. Fallos distintos: la debilidad NO aparece antes de tiempo
  const ids = practice.map(i => i.id);
  const early = failsRequired - 1;
  const s1 = play(A, level, practice.slice(0, early), ['fail-retry-ok']);       // fallo -> reintentar -> acertar (cuenta como fallo del primer intento)
  s1.results.forEach((r, i) => {
    check('1.' + (i + 1) + ' el resultado trae m=' + microId, r.m === microId, JSON.stringify(r));
    check('1.' + (i + 1) + ' el reintento conserva el primer error (w) y el nº de intento (t=2)', r.w === 'primera-opcion' && r.t === 2 && r.isCorrect === true, JSON.stringify(r));
    check('1.' + (i + 1) + ' f=1 (primera vez) y o="micro" (origen por URL de foco)', r.f === 1 && r.o === 'micro', JSON.stringify(r));
  });
  check('1.x con ' + early + ' fallos distintos NO hay debilidad (wk vacío)', st() && !st().wk && Object.keys(st().wi).length === early && state() === 'sin-alerta', JSON.stringify(st()));
  check('1.y sin debilidad no hay recomendación ni comprobación', A.microDiagActions(level, new Set([microId])).length === 0 && A.microCheckStart(microId).reason === 'no-toca', '');
  const repeat = play(A, level, [practice[0]], ['fail']);                          // repetir el MISMO ejercicio no es debilidad
  check('1.z fallar otra vez el mismo ejercicio no crea debilidad', !st().wk && Object.keys(st().wi).length === early, JSON.stringify(st()));

  // ---- 2. El fallo distinto Nº failsRequired crea la microdebilidad
  const s2 = play(A, level, [practice[early]], ['fail-retry-ok']);
  check('2.1 ' + failsRequired + ' fallos de ' + failsRequired + ' IDs DISTINTOS (wi)', Object.keys(st().wi).length === failsRequired && ids.slice(0, failsRequired).every(id => st().wi[id]), JSON.stringify(st().wi));
  check('2.2 se crea la debilidad: wk con fecha, estado "debil", pr=0', !!st().wk && state() === 'debil' && st().pr === 0, JSON.stringify(st()));
  check('2.3 el último resultado trae m, w, t, f, o', s2.results[0].m === microId && !!s2.results[0].w && s2.results[0].t === 2 && s2.results[0].f === 1 && s2.results[0].o === 'micro', JSON.stringify(s2.results[0]));

  // ---- 3. Recomendación específica y refuerzo del microtema
  const acts = A.microDiagActions(level, new Set([microId]));
  const all = A.microDiagActions(level);
  check('3.1 recomienda "Reforzar" este microtema, con enlace ?micro=' + microId, acts.length === 1 && acts[0].micro === microId && acts[0].microState === 'debil' && sectionOf(acts[0].href), JSON.stringify(acts.map(a => [a.micro, a.href])));
  check('3.2 no recomienda ningún OTRO microtema', all.every(a => a.micro === microId), JSON.stringify(all.map(a => a.micro)));
  check('3.3 la recomendación enlaza la parte exacta de la clase', !!acts[0] && !!acts[0].article && (!m.lesson || acts[0].article.indexOf('#' + (m.lesson.anchor || '')) !== -1), String(acts[0] && acts[0].article));
  const sel = A.computePlanSelection(level, A.SESSION_LENGTHS.media.items, { focusMicro: microId });
  const pool = A.buildPlanPool(level, sel);
  const focusEntries = pool.filter(e => e.focus);
  const siblings = focusEntries.filter(e => e.item.micro !== microId);
  check('3.4 el Plan con foco trae refuerzo del microtema (la mayoría son suyos; si se agotan, solo completa con ejercicios del MISMO tema)', focusEntries.length >= 1 && focusEntries.length - siblings.length >= Math.ceil(focusEntries.length / 2) && siblings.every(e => e.item.micro && A.MICRO_BY_ID[e.item.micro] && A.MICRO_BY_ID[e.item.micro].tema === m.tema), JSON.stringify(focusEntries.map(e => e.item.id + ':' + e.item.micro)));
  if(siblings.length) res.push({ name: 'OBS el refuerzo se completó con ' + siblings.length + ' ejercicio(s) de otro microtema del mismo tema (' + siblings.map(e => e.item.micro).join(',') + '): con solo ' + practice.length + ' ejercicios de práctica y los fallados yendo al repaso de errores, el microtema se agota pronto', ok: true, obs: true });

  // ---- 4. Refuerzo con un fallo accidental; la comprobación no aparece antes de tiempo
  let n = 0;
  const reinforce = how => { const it = practice[(failsRequired + n) % practice.length]; n++; return play(A, level, [it], [how]); };
  reinforce('ok'); reinforce('fail'); reinforce('ok'); reinforce('ok');                 // 4 respuestas (1 accidental): aún no hay comprobación
  check('4.1 tras ' + (MF.CHECK_AFTER_PRACTICE - 1) + ' respuestas de refuerzo sigue "debil" y NO se ofrece comprobación', state() === 'debil' && A.microCheckStart(microId).reason === 'no-toca', 'estado ' + state() + ' pr=' + st().pr);
  check('4.2 el fallo accidental cuenta en pr pero no en pc (4 respuestas, 3 al primer intento)', st().pr === 4 && st().pc === 3, JSON.stringify(st()));
  check('4.3 no declara dominio sin comprobación (sin lc, sin "recuperado")', st().lc === null && state() !== 'recuperado', JSON.stringify(st()));
  const before = state();
  reinforce('ok');                                                                      // 5ª respuesta
  check('4.4 con ' + MF.CHECK_AFTER_PRACTICE + ' respuestas de refuerzo pasa a "listo-comprobar"', state() === 'listo-comprobar' && before === 'debil', 'estado ' + state() + ' pr=' + st().pr);
  const actC = A.microDiagActions(level, new Set([microId]));
  check('4.5 ahora recomienda "Comprobar" con enlace ?comprobar=' + microId, actC.length === 1 && actC[0].microState === 'listo-comprobar' && /[?&]comprobar=/.test(actC[0].href), JSON.stringify(actC.map(a => a.href)));
  res.push({ name: 'OBS un fallo accidental NO retrasa la comprobación: se ofrece al llegar a ' + MF.CHECK_AFTER_PRACTICE + ' respuestas aunque haya errores (regla actual, solo AUTOCLEAR exige 80%)', ok: true, obs: true });

  // ---- 5. Comprobación: 3 checks inéditos, aislados de la práctica
  const idx = A.getMistakesItemIndex();
  check('5.1 ningún check está en el índice de práctica ni de errores', checkIds.every(id => !idx.has(id)), '');
  const exclusive = (() => {
    let leaked = [];
    for(let i = 0; i < 40; i++){ ['corta', 'media', 'larga'].forEach(len => {
      A.store[A.SESSION_LENGTH_KEY] = len;
      A.resolveMemberPool({ skill:'gramatica', level, bankLevel:A.GRAMMAR_BANK[level], saved:null }).pool.forEach(it => { if(checkIds.indexOf(it.id) !== -1) leaked.push(it.id); });
    }); }
    for(let i = 0; i < 10; i++) A.buildPlanPool(level, A.computePlanSelection(level, 9, { focusMicro: microId })).forEach(e => { if(checkIds.indexOf(e.item.id) !== -1) leaked.push(e.item.id); });
    return leaked;
  })();
  check('5.2 los checks no salieron como práctica (120 sesiones normales + 10 del Plan con foco)', exclusive.length === 0, 'filtrados: ' + exclusive.join(','));
  const seenBefore = Object.keys(JSON.parse(A.store[A.CHECK_SEEN_KEY] || '{}'));
  check('5.3 antes de la comprobación esta cuenta no ha visto ningún check', checkIds.every(id => seenBefore.indexOf(id) === -1), seenBefore.join(','));
  const start = A.microCheckStart(microId);
  check('5.4 la comprobación ofrece ' + MF.CHECK_SIZE + ' ejercicios, todos del banco de comprobación y distintos', !!start.items && start.items.length === MF.CHECK_SIZE && start.items.every(i => checkIds.indexOf(i.id) !== -1) && new Set(start.items.map(i => i.id)).size === MF.CHECK_SIZE, JSON.stringify(start.items && start.items.map(i => i.id)));
  const served = (start.items || []).map(i => i.id);
  if(!start.items) return { microId, level, res: res.concat([{ name:'5.x no se pudo iniciar la comprobación (razón: ' + start.reason + ', estado ' + state() + ')', ok:false, detail: JSON.stringify(st()) }]), info:{ focusUrl: info.focusUrl } };
  const checkSession = play(A, level, start.items, ['ok'], 'check');
  check('5.5 la sesión de comprobación guarda m en cada resultado', checkSession.results.every(r => r.m === microId), JSON.stringify(checkSession.results));
  check('5.6 dominio: 3/3 -> "recuperado", wk vacío, lc={n:3,ok:3}, ck={a:3,ok:3}', state() === 'recuperado' && !st().wk && st().lc && st().lc.n === MF.CHECK_SIZE && st().lc.ok === MF.CHECK_SIZE && st().ck.a === MF.CHECK_SIZE && st().ck.ok === MF.CHECK_SIZE, JSON.stringify(st()));
  check('5.7 la comprobación no suma a la práctica (a sigue igual) ni genera recomendación', A.microDiagActions(level, new Set([microId])).length === 0, JSON.stringify(st()));
  await A.settle();
  const mistakeIds = [].concat(...cloud.mistakeCalls).map(i => i.item_id);
  check('5.8 mistake_stats recibió práctica pero NUNCA un check', mistakeIds.length > 0 && checkIds.every(id => mistakeIds.indexOf(id) === -1), 'mistake_stats con check: ' + checkIds.filter(id => mistakeIds.indexOf(id) !== -1).join(','));

  // ---- 6. No repetición en este navegador y tras recargar
  const again = A.microCheckStart(microId);
  check('6.1 no vuelve a ofrecer checks ya vistos', again.items === null && ['no-toca', 'sin-ineditos'].indexOf(again.reason) !== -1, JSON.stringify(again.reason));
  const seenAfter = JSON.parse(A.store[A.CHECK_SEEN_KEY] || '{}');
  check('6.2 los ' + MF.CHECK_SIZE + ' checks quedaron como vistos', served.length === MF.CHECK_SIZE && served.every(id => seenAfter[id] === 1), JSON.stringify(seenAfter));
  const A2 = makeDevice(cloud, { search: '' });                      // "recargar": mismo localStorage, página nueva
  Object.keys(A.store).forEach(k => { A2.store[k] = A.store[k]; });
  check('6.3 tras recargar no vuelve a ofrecerlos', A2.microCheckStart(microId).items === null, '');

  // ---- 7. Segundo navegador con la misma cuenta
  const B = makeDevice(cloud, { search: '' });
  check('7.1 el segundo navegador arranca vacío', Object.keys(B.stats()).length === 0, '');
  check('7.2 sincroniza con la nube', (await B.LeoBackend.syncProgressFromCloud()) === 'ok', '');
  const sb = B.microStatsAll()[microId], sa = st();
  const pick = s => s && { wk: s.wk, pr: s.pr, ck: s.ck, lc: s.lc, wi: s.wi, a: s.a, w: s.w };
  check('7.3 mismo estado interno que el primero (wk, pr, ck, lc, wi)', JSON.stringify(pick(sb)) === JSON.stringify(pick(sa)), JSON.stringify(pick(sb)) + ' vs ' + JSON.stringify(pick(sa)));
  const seenB = JSON.parse(B.store[B.CHECK_SEEN_KEY] || '{}');
  check('7.4 el segundo navegador sabe que los 3 checks ya se vieron', served.every(id => seenB[id] === 1), JSON.stringify(seenB));
  check('7.5 el segundo navegador NO los vuelve a servir', B.microCheckStart(microId).items === null, '');
  check('7.6 ningún check apareció como práctica en la nube (solo en sesiones "check")', cloud.sessions.every(s => s.skill === 'check' || s.results.every(r => checkIds.indexOf(r.itemId) === -1)), '');

  // ---- 8. Otros desenlaces de la comprobación (cada uno con un alumno nuevo)
  if(!opts.skipOutcomes) for (const [label, okCount, expect] of [['2 de 3', MF.CHECK_SIZE - 1, 'mejorando'], ['1 de 3', 1, 'debil-comprobado']]) {
    const c2 = createCloud(), D = makeDevice(c2, { search:'?micro=' + microId });
    D.setUserLevel(level);
    play(D, level, practice.slice(0, failsRequired), ['fail-retry-ok']);
    for(let i = 0; i < MF.CHECK_AFTER_PRACTICE; i++) play(D, level, [practice[i % practice.length]], ['ok']);
    const items = D.microCheckStart(microId).items;
    if(!items){ check('8 comprobación ' + label + ': no se pudo iniciar', false, 'sin items'); continue; }
    play(D, level, items, items.map((_, i) => i < okCount ? 'ok' : 'fail'), 'check');
    const s = D.microFlowState(microId, D.microStatsAll()[microId]).state;
    check('8 comprobación ' + label + ' -> ' + expect + (expect === 'debil-comprobado' ? ' (la alerta continúa, no hay dominio)' : ' (se cierra la alerta sin declarar dominio)'), s === expect, 'estado ' + s + ' ' + JSON.stringify(D.stats(microId)));
  }
  return { microId, level, res, info: { focusUrl: info.focusUrl, practice: practice.length, checks: checks.length } };
}

function activeMicros(){ const T = makeDevice(createCloud(), {}); return T.MICROS.filter(m => m.active).map(m => m.id); }

async function main(){
  const args = process.argv.slice(2);
  const flag = n => { const i = args.indexOf(n); return i === -1 ? null : (args[i + 1] || true); };
  const ids = args.includes('--all-active') ? activeMicros() : args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--level' && args[i - 1] !== '--json');
  if(!ids.length){ console.error('Uso: node tools/e2e/test-microtema.js <microId> [--level medio] [--json out.json]  |  --all-active'); process.exit(2); }
  const out = []; let failed = 0;
  for(const id of ids){
    let r;
    try{ r = await runMicro(id, { level: flag('--level') && flag('--level') !== true ? flag('--level') : null }); }
    catch(e){ r = { microId:id, res:[{ name:'ejecución', ok:false, detail:String(e && e.stack || e) }] }; }
    const bad = r.res.filter(x => !x.ok);
    failed += bad.length ? 1 : 0;
    console.log('\n=== ' + id + (r.level ? ' (nivel ' + r.level + ')' : '') + ': ' + (bad.length ? 'FAIL' : 'PASS') + '  [' + r.res.filter(x => x.ok && !x.obs).length + ' comprobaciones]');
    if(r.info && r.info.focusUrl) console.log('    URL de foco: https://inglesconleo.com/' + r.info.focusUrl);
    r.res.forEach(x => { if(!x.ok) console.log('  FALLA ' + x.name + '\n        ' + x.detail); else if(x.obs || args.includes('--verbose')) console.log('  ' + (x.obs ? 'nota ' : 'ok   ') + x.name); });
    out.push(r);
  }
  const jf = flag('--json'); if(jf && jf !== true) fs.writeFileSync(jf, JSON.stringify(out, null, 2));
  console.log('\n' + (failed ? 'FAIL: ' + failed + ' de ' + ids.length + ' microtemas con fallas' : 'PASS: ' + ids.length + ' microtema(s) completos'));
  process.exit(failed ? 1 : 0);
}
if(require.main === module) main(); else module.exports = { runMicro, activeMicros };
