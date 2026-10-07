#!/usr/bin/env node
/* RUTA INICIAL (cold start del Plan de estudio, solo Miembros).
   Corre con:  node tools/tests/ruta-inicial.test.js   (desde la carpeta inglesconLeo)
   Usa app.js, data.js, temas.js y backend.js REALES con la nube simulada de tools/e2e/lib/sim.js.

   Reglas que se protegen:
   - una cuenta SIN historial anterior al lanzamiento recibe en sus primeras sesiones de Plan la gramática de la ruta, en orden;
   - un usuario existente (aunque tenga UNA sola sesión previa al lanzamiento) jamás entra;
   - la ruta es un FALLBACK: una recomendación más específica (diagnóstico, errores, microtema, tema, foco) gana de inmediato;
   - sale por 6 temas vistos o 18 respuestas calificadas (el número de sesiones de Plan NO es una salida);
   - el repaso de errores entra desde la segunda sesión de Plan con máximo 2 cupos; con otra dificultad no hay ruta;
     sin confirmar el historial de la nube no se asume que la cuenta es nueva. */
const assert = require('assert');
const { createCloud, makeDevice } = require('../e2e/lib/sim.js');
// Los arreglos vienen de otro contexto (vm): se comparan por contenido.
const eq = (a, b, msg) => assert.strictEqual(JSON.stringify(Array.from(a)), JSON.stringify(Array.from(b)), msg);
const LEVELS = ['principiante', 'facil', 'medio', 'avanzado'];
const MEMBERS_ONLY = { principiante:[2,4,5,6], facil:[6,8,9,10], medio:[6,8,9,10], avanzado:[6,8,9,10] };

function newCloud(level){ const c = createCloud(); c.profile.level = level || 'facil'; return c; }
function device(cloud, level){
  const D = makeDevice(cloud, {});
  D.run = code => require('vm').runInContext(code, D.ctx);
  D.LAUNCH = D.run('START_ROUTE_LAUNCH_MS');
  D.store.leo_profile = JSON.stringify({ name:'QA', level: level || cloud.profile.level, createdAt: 1 });
  D.state = lvl => D.run(`startRouteState(${JSON.stringify(lvl || D.getUserLevel())})`);
  D.synced = v => D.run('_startRouteSynced = ' + (v ? 'true' : 'false'));
  let clock = D.LAUNCH + 60000;
  D.tick = () => (clock += 600000);
  // Una sesión de Plan como la arma la página: selección -> pool -> respuestas -> recordSession.
  D.plan = (o) => {
    o = o || {};
    const level = D.getUserLevel();
    const sel = D.computePlanSelection(level, o.items || 9, Object.assign({ startRoute: true }, o.opts));
    const pool = D.buildPlanPool(level, sel);
    const wrong = o.wrong || (() => false);
    const results = pool.map((e, i) => ({ itemId: e.item.id, isCorrect: e.kind === 'speaking' ? null : !wrong(e, i), skill: D.run('PLAN_KIND_TO_SKILL')[e.kind] }));
    if(o.record !== false) D.recordSession({ skill:'plan', level, topics:[], results, startedAt: o.startedAt || D.tick() });
    return { sel, pool, results, route: !!(sel.focus && sel.focus.startRoute) };
  };
  D.graded = () => D.loadProgress().sessions.reduce((n, s) => n + (s.results || []).filter(r => r.isCorrect === true || r.isCorrect === false).length, 0);
  D.yields = () => D.run(`startRouteYields(${JSON.stringify(D.getUserLevel())}, loadProgress())`);
  // n respuestas calificadas de vocabulario del nivel (correctas salvo las `wrong` primeras), sin tocar la ruta
  D.vocab = (n, wrong) => {
    const level = D.getUserLevel();
    const done = new Set(); D.loadProgress().sessions.forEach(s => s.results.forEach(r => done.add(r.itemId)));
    const items = D.memberBankItems('vocabulario', D.run('VOCAB_BANK')[level]).filter(i => !done.has(i.id)).slice(0, n);
    D.recordSession({ skill:'vocabulario', level, topics:[], results: items.map((i, k) => ({ itemId:i.id, isCorrect: !(k < (wrong || 0)) })), startedAt: D.tick() });
  };
  return D;
}
const routeOf = (D, level) => D.run('START_ROUTE')[level];
const topicOf = (D, level) => { const m = {}; D.GRAMMAR_BANK[level].forEach(v => v.forEach(g => g.items.forEach(i => { m[i.id] = g.topic; }))); return m; };

let passed = 0, queue = Promise.resolve();
function test(name, fn){
  queue = queue.then(async () => {
    try{ await fn(); passed++; console.log('  ok  ' + name); }
    catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
  });
}

test('DATOS: los 6 temas de cada nivel existen con esa etiqueta exacta, en variantes abiertas y con >= 3 ejercicios', async () => {
  const D = device(newCloud());
  LEVELS.forEach(level => {
    const route = routeOf(D, level);
    assert.strictEqual(route.length, 3, level + ': 3 sesiones');
    const flat = [].concat(...route);
    assert.strictEqual(new Set(flat).size, 6, level + ': 6 temas distintos');
    route.forEach(pair => assert.strictEqual(pair.length, 2));
    flat.forEach(topic => {
      const hits = [];
      D.GRAMMAR_BANK[level].forEach((v, i) => v.forEach(g => { if(g.topic === topic) hits.push({ i, n: g.items.length }); }));
      assert.ok(hits.length >= 1, level + ': no existe el tema "' + topic + '"');
      assert.ok(hits.some(h => MEMBERS_ONLY[level].indexOf(h.i) === -1), level + ': "' + topic + '" solo está en variantes de miembros');
      assert.ok(hits.reduce((n, h) => n + h.n, 0) >= 3, level + ': "' + topic + '" tiene menos de 3 ejercicios');
    });
  });
});

LEVELS.forEach(level => {
  test('CUENTA NUEVA (' + level + '): las primeras sesiones Normales siguen la ruta en orden, 2 ejercicios por tema, con variedad de habilidades', async () => {
    const D = device(newCloud(level));
    const route = routeOf(D, level), tOf = topicOf(D, level);
    for(let n = 0; n < 2; n++){
      const st = D.state();
      assert.ok(st, 'sesión ' + (n + 1) + ': sigue en cold start');
      eq(st.topics, route[n]);
      assert.strictEqual(st.seen, n * 2); assert.strictEqual(st.total, 6);
      const { sel, pool, route: used } = D.plan();
      assert.ok(used, 'la selección usa la ruta');
      assert.strictEqual(pool.length, 9);
      assert.strictEqual(sel.focus.label, 'Ruta inicial');
      const grammar = pool.filter(e => e.kind === 'grammar');
      assert.strictEqual(grammar.length, 4, 'gramática = solo los 4 de la ruta');
      route[n].forEach(topic => assert.strictEqual(grammar.filter(e => tOf[e.item.id] === topic).length, 2, '2 ejercicios de "' + topic + '"'));
      assert.strictEqual(new Set(pool.map(e => e.item.id)).size, pool.length, 'sin ejercicios repetidos');
      assert.ok(new Set(pool.filter(e => e.kind !== 'grammar').map(e => e.kind)).size >= 3, 'al menos 3 habilidades más');
      if(n === 0) assert.strictEqual(sel.mistakeCount, 0, 'primera sesión: sin repaso de errores');
    }
    // tercera sesión: si aún no llegó a 18 respuestas ni hay nada más específico, toca el tercer par; si no, Plan de siempre
    const st = D.state();
    if(st){ eq(st.topics, route[2]); assert.ok(D.graded() < 18); }
    else assert.ok(D.graded() >= 18);
    const third = D.plan();
    if(!st) assert.ok(!third.route);
    assert.ok(D.graded() >= 18, 'tres sesiones Normales superan las 18 respuestas');
    assert.strictEqual(D.state(), null, 'ya salió de la ruta');
    assert.ok(!D.plan({ record:false }).route, 'la siguiente sesión es el Plan de siempre');
  });
});

test('USUARIO EXISTENTE: una sola sesión anterior al lanzamiento (aunque sea de 1 respuesta) y jamás entra', async () => {
  const D = device(newCloud('facil'));
  D.recordSession({ skill:'gramatica', level:'facil', topics:[], results:[{ itemId:'g-facil-some-1', isCorrect:true }], startedAt: D.LAUNCH - 1 });
  assert.strictEqual(D.state(), null);
  LEVELS.forEach(l => assert.strictEqual(D.state(l), null, 'tampoco en ' + l));
  assert.ok(!D.plan({ record:false }).route);
  D.plan(); D.plan();                                        // ni después de practicar más (todo posterior al lanzamiento)
  assert.strictEqual(D.state(), null);
  // una sesión sin fecha fiable también cuenta como historial previo
  const E = device(newCloud('medio'));
  const p = E.loadProgress(); p.sessions.push({ skill:'vocabulario', level:'medio', topics:[], date:'2026-09-01', results:[] });
  E.store[E.PROGRESS_KEY] = JSON.stringify(p);
  assert.strictEqual(E.state(), null);
  // cualquier tipo de sesión previa, aunque esté vacía
  ['plan', 'reto-diario', 'errores', 'check', 'juego', 'clases'].forEach(skill => {
    const F = device(newCloud('facil'));
    F.recordSession({ skill, level:'facil', topics:[], results:[], startedAt: F.LAUNCH - 86400000 });
    assert.strictEqual(F.state(), null, 'con una sesión previa de ' + skill);
    assert.ok(!F.plan({ record:false }).route);
  });
});

test('cuenta ANTIGUA que nunca practicó: sí entra (la antigüedad de la cuenta no importa)', async () => {
  const cloud = newCloud('medio');
  cloud.profile.onboarded_at = '2026-01-01T00:00:00.000Z';
  const D = device(cloud);
  const st = D.state();
  assert.ok(st && st.firstSession && st.seen === 0);
  assert.ok(D.plan({ record:false }).route);
});

test('MIEMBRO ANTIGUO en un navegador NUEVO: sin confirmar la nube no se asume que es nuevo; al sincronizar, no entra', async () => {
  const cloud = newCloud('facil');
  cloud.sessions.push({ id: 1, user_id:'qa', skill:'gramatica', level:'facil', topics:[], date:'2026-09-20', started_at: Date.UTC(2026, 8, 20), duration_ms: 1000, results:[{ itemId:'g-facil-some-1', isCorrect:true }] });
  const D = device(cloud);                                   // localStorage vacío: el historial aún no bajó
  assert.ok(D.state(), 'por el historial local parecería nueva');
  assert.strictEqual(D.run('_startRouteSynced'), false, 'pero la ruta exige confirmar la nube primero');
  assert.strictEqual(await D.run('ensureStartRouteSync()'), true);
  assert.strictEqual(D.loadProgress().sessions.length, 1, 'bajó su historial');
  assert.strictEqual(D.state(), null, 'usuario existente: no entra');
  // sin red no se puede confirmar: no hay ruta
  const down = newCloud('facil'); down.down = true;
  const E = device(down);
  assert.strictEqual(await E.run('ensureStartRouteSync()'), false);
  assert.strictEqual(E.run('_startRouteSynced'), false);
});

test('SEGUNDO NAVEGADOR: tras sincronizar sigue en la misma posición de la ruta', async () => {
  const cloud = newCloud('medio');
  const A = device(cloud);
  A.plan(); await A.settle();
  assert.strictEqual(cloud.sessions.length, 1, 'la sesión llegó a la nube');
  const B = device(cloud);
  assert.strictEqual(await B.run('ensureStartRouteSync()'), true);
  const st = B.state();
  assert.strictEqual(st.seen, 2); assert.strictEqual(st.firstSession, false);
  eq(st.topics, routeOf(B, 'medio')[1]);
  eq(B.plan({ record:false }).sel.focus.startRoute.topics, routeOf(B, 'medio')[1]);
});

test('SALIDA a las 18 respuestas calificadas: con 17 sigue, con 18 sale (cuenten de donde cuenten)', async () => {
  const D = device(newCloud('facil'));
  D.vocab(17);
  assert.strictEqual(D.graded(), 17);
  assert.ok(D.state(), 'con 17 respuestas sigue en la ruta');
  D.vocab(1);
  assert.strictEqual(D.state(), null, 'con 18 sale');
  assert.ok(!D.plan({ record:false }).route);
  // speaking no se califica: no cuenta para las 18
  const E = device(newCloud('facil'));
  E.recordSession({ skill:'speaking', level:'facil', topics:[], results: Array.from({ length: 25 }, (_, i) => ({ itemId:'s-facil-' + i, isCorrect:null })), startedAt: E.tick() });
  assert.ok(E.state() && E.graded() === 0);
});

test('SALIDA por los 6 temas vistos (12 respuestas, sin ninguna sesión de Plan)', async () => {
  const E = device(newCloud('facil'));
  const tOf = topicOf(E, 'facil');
  const flat = [].concat(...routeOf(E, 'facil'));
  const two = topic => Object.keys(tOf).filter(id => tOf[id] === topic).slice(0, 2).map(id => ({ itemId:id, isCorrect:true }));
  flat.slice(0, 5).forEach(t => E.recordSession({ skill:'gramatica', level:'facil', topics:[t], results: two(t), startedAt: E.tick() }));
  const st = E.state();
  assert.ok(st, 'falta un tema');
  eq(st.topics, [flat[5]], 'solo queda el último');
  assert.strictEqual(st.seen, 5);
  assert.strictEqual(st.firstSession, true, 'las sesiones de Gramática no cuentan como sesiones de Plan');
  E.recordSession({ skill:'gramatica', level:'facil', topics:[flat[5]], results: two(flat[5]), startedAt: E.tick() });
  assert.strictEqual(E.graded(), 12);
  assert.strictEqual(E.state(), null, 'vistos los 6: sale');
});

test('el número de sesiones de Plan NO es una salida: 4 sesiones Rápidas (menos de 18 respuestas) y sigue en la ruta', async () => {
  const D = device(newCloud('principiante'));
  for(let i = 0; i < 4; i++){
    if(D.graded() + 5 >= 18) break;
    assert.ok(D.state(), 'antes de la Rápida ' + (i + 1) + ' sigue en la ruta');
    const r = D.plan({ items: 5 });
    assert.ok(r.route, 'la Rápida ' + (i + 1) + ' usa la ruta');
  }
  assert.ok(D.loadProgress().sessions.filter(s => s.skill === 'plan').length >= 3, 'ya lleva 3 o más sesiones de Plan');
  if(D.graded() < 18) assert.ok(D.state(), 'y sigue en cold start');
});

test('RÁPIDA: 1 ejercicio por tema; el par se repite con ejercicios NUEVOS hasta tener 2 por tema y entonces avanza', async () => {
  const D = device(newCloud('avanzado'));
  const route = routeOf(D, 'avanzado'), tOf = topicOf(D, 'avanzado');
  const r1 = D.plan({ items: 5 });
  assert.strictEqual(r1.pool.length, 5);
  const g1 = r1.pool.filter(e => e.kind === 'grammar');
  eq(g1.map(e => tOf[e.item.id]).sort(), Array.from(route[0]).sort(), '1 de cada tema');
  assert.strictEqual(r1.sel.mistakeCount, 0);
  eq(D.state().topics, route[0], 'con 1 por tema aún no cuentan como vistos');
  assert.strictEqual(D.state().seen, 0);
  const r2 = D.plan({ items: 5 });
  const g2 = r2.pool.filter(e => e.kind === 'grammar');
  eq(g2.map(e => tOf[e.item.id]).sort(), Array.from(route[0]).sort());
  assert.ok(!g2.some(e => g1.some(x => x.item.id === e.item.id)), 'no repite los ejercicios de la Rápida anterior');
  eq(D.state().topics, route[1], 'ahora sí avanza al segundo par');
  assert.strictEqual(D.state().seen, 2);
});

test('NORMAL y COMPLETA: 2 por tema (4 de gramática); MEZCLA de duraciones: Rápida y luego Normal completan el par y avanzan', async () => {
  const D = device(newCloud('medio'));
  const route = routeOf(D, 'medio'), tOf = topicOf(D, 'medio');
  const c = D.plan({ items: 15, record:false });
  assert.strictEqual(c.pool.length, 15);
  assert.strictEqual(c.pool.filter(e => e.kind === 'grammar').length, 4, 'Completa: gramática = los 4 de la ruta');
  const n = D.plan({ items: 9, record:false });
  assert.strictEqual(n.pool.filter(e => e.kind === 'grammar').length, 4);
  // mezcla
  const r = D.plan({ items: 5 });
  assert.strictEqual(r.pool.filter(e => e.kind === 'grammar').length, 2);
  const m = D.plan({ items: 9 });
  assert.ok(m.route);
  eq(Array.from(new Set(m.pool.filter(e => e.kind === 'grammar').map(e => tOf[e.item.id]))).sort(), Array.from(route[0]).sort(), 'la Normal termina el primer par');
  assert.strictEqual(m.pool.length, 9);
  const st = D.state();
  if(st) eq(st.topics, route[1], 'y después sigue el segundo par');
  else assert.ok(D.graded() >= 18);
});

test('REPASO DE ERRORES: nada en la primera sesión; desde la segunda entra con máximo 2 cupos y no desplaza a la ruta', async () => {
  const D = device(newCloud('facil'));
  let failed = 0;
  const s1 = D.plan({ wrong: e => e.kind !== 'speaking' && failed++ < 4 });   // falla exactamente 4 ejercicios calificables
  assert.strictEqual(s1.sel.mistakeCount, 0);
  assert.ok(D.graded() < 15, 'aún sin diagnóstico');
  const s2 = D.plan({ record:false });
  assert.ok(s2.route, 'sigue en la ruta');
  assert.strictEqual(s2.sel.mistakeCount, 2, 'máximo 2 aunque haya más pendientes');
  assert.strictEqual(s2.pool.filter(e => e.reviewOrigin).length, 2);
  assert.strictEqual(s2.pool.filter(e => e.startRoute).length, 4, 'la ruta mantiene sus 4');
  assert.strictEqual(s2.pool.length, 9);
  // fuera de la ruta el cupo de errores vuelve a ser el de siempre (30 %)
  assert.strictEqual(D.computePlanSelection('facil', 9, {}).mistakeCount, 3);
});

test('FALLBACK: una recomendación del DIAGNÓSTICO gana durante el cold start (sin haber terminado la ruta)', async () => {
  const D = device(newCloud('facil'));
  D.plan({ items: 5 });                                       // empezó la ruta
  D.vocab(11, 8);                                             // 15-16 respuestas, 8 errores de vocabulario: ya hay diagnóstico
  assert.ok(D.graded() >= 15 && D.graded() < 18, 'con diagnóstico y aún dentro de las 18 respuestas: ' + D.graded());
  assert.ok(D.state(), 'por historial seguiría en la ruta');
  const diag = D.run('computeDiagnosis(loadProgress())');
  assert.ok(diag.ready && diag.today && diag.today.href !== 'plan-estudio.html', 'el diagnóstico recomienda algo concreto: ' + (diag.today && diag.today.title));
  assert.strictEqual(D.yields(), true);
  const r = D.plan({ record:false });
  assert.ok(!r.route, 'el Plan ya es el adaptativo de siempre');
  assert.strictEqual(r.sel.mistakeCount, 3, 'con el repaso de errores normal (30 %), no el tope de 2 de la ruta');
  assert.strictEqual(r.pool.length, 9);
});

test('FALLBACK: un MICROTEMA con refuerzo pendiente gana aunque lleve muy pocas respuestas', async () => {
  const D = device(newCloud('medio'));
  assert.ok(D.plan({ record:false }).route, 'cuenta nueva: empieza en la ruta');
  const ids = ['g-medio-fut-gtevid-1', 'g-medio-fut-gtevid-2', 'g-medio-fut-gtevid-3'];
  D.recordSession({ skill:'gramatica', level:'medio', topics:[], results: ids.map(id => ({ itemId:id, isCorrect:false })), startedAt: D.tick() });
  assert.strictEqual(D.graded(), 3);
  assert.ok(D.run("microDiagActions('medio')").length >= 1, 'hay un microtema débil');
  assert.ok(D.state(), 'por historial seguiría en la ruta');
  assert.strictEqual(D.yields(), true);
  assert.ok(!D.plan({ record:false }).route, 'el Plan normal: la ruta se aparta');
  // y el enlace de refuerzo del microtema arma su sesión con foco, como siempre
  const sel = D.computePlanSelection('medio', 9, { startRoute:true, focusMicro:'going-to-evidencia' });
  assert.ok(sel.focus && !sel.focus.startRoute && sel.focus.microId === 'going-to-evidencia');
});

test('sin nada más específico, la ruta sigue siendo la que decide (y vuelve cuando la recomendación desaparece)', async () => {
  const D = device(newCloud('medio'));
  D.plan();                                                   // todo correcto: sin errores ni puntos débiles
  assert.ok(D.graded() < 15);
  assert.strictEqual(D.yields(), false);
  assert.ok(D.plan({ record:false }).route);
  // coherencia general: hay ruta si y solo si hay estado y nada más específico
  for(let i = 0; i < 3; i++){
    const st = D.state(), y = D.yields();
    assert.strictEqual(D.plan({ wrong: (e, k) => e.kind === 'vocab' && k % 2 === 0 }).route, !!st && !y);
  }
});

test('PRIORIDAD: enlaces de microtema / tema / foco y otra dificultad ganan; sin startRoute todo es como antes', async () => {
  const D = device(newCloud('medio'));
  assert.ok(D.state());
  [{ focusMicro:'cond-1-probable' }, { focusFamily:'futuro' }, { focusFamily:'futuro', focusTema:'will-going-to' }, { focusSkill:'writing', focusTema:'will-going-to' }, { focusTema:'will-going-to' }].forEach(o => {
    const sel = D.computePlanSelection('medio', 9, Object.assign({ startRoute:true }, o));
    assert.ok(!(sel.focus && sel.focus.startRoute), 'con ' + JSON.stringify(o) + ' no hay ruta');
  });
  // quien llama no la pide (nube sin confirmar u otra dificultad) o no pasa opciones: Plan de siempre
  [undefined, {}, { startRoute:false }].forEach(o => {
    const sel = D.computePlanSelection('medio', 9, o);
    assert.ok(!(sel.focus && sel.focus.startRoute));
    assert.strictEqual(Object.keys(sel.bySkill).reduce((n, k) => n + sel.bySkill[k], 0) + sel.mistakeCount, 9);
  });
});

test('CAMBIO DE NIVEL a mitad: sigue con la ruta del nivel nuevo, sin reiniciar las respuestas contadas', async () => {
  const D = device(newCloud('facil'));
  D.plan();
  const g = D.graded();
  D.store.leo_profile = JSON.stringify({ name:'QA', level:'medio', createdAt: 1 });
  const st = D.state();
  eq(st.topics, routeOf(D, 'medio')[0], 'primeros temas del nivel nuevo');
  assert.strictEqual(st.seen, 0); assert.strictEqual(st.firstSession, false);
  D.vocab(18 - g);
  assert.strictEqual(D.state(), null, '18 respuestas en total: sale, aunque en el nivel nuevo no haya visto nada');
});

test('GRATIS -> MIEMBRO: lo que practicó gratis (después del lanzamiento) cuenta; antes del lanzamiento, no entra', async () => {
  const cloud = newCloud('facil');
  const A = device(cloud);
  const tOf = topicOf(A, 'facil'), route = routeOf(A, 'facil');
  const ids = t => Object.keys(tOf).filter(id => tOf[id] === t);
  cloud.sessions.push({ id: 1, user_id:'qa', tier:'free', skill:'gramatica', level:'facil', topics:[], date:'2026-10-08', started_at: A.LAUNCH + 5000, duration_ms: 1000,
    results: ids(route[0][0]).concat(ids(route[0][1])).map(id => ({ itemId:id, isCorrect:true })) });
  assert.strictEqual(await A.run('ensureStartRouteSync()'), true);
  const st = A.state();
  assert.strictEqual(st.firstSession, true, 'aún no hizo ninguna sesión de Plan');
  eq(st.topics, route[1], 'los 2 temas que ya vio gratis no se repiten');
  const old = newCloud('facil');
  old.sessions.push({ id: 1, user_id:'qa', tier:'free', skill:'listening', level:'facil', topics:[], date:'2026-10-07', started_at: A.LAUNCH - 3600000, duration_ms: 1000, results:[{ itemId:'l-facil-numeros-1', isCorrect:false }] });
  const B = device(old);
  await B.run('ensureStartRouteSync()');
  assert.strictEqual(B.state(), null);
});

test('la ruta prefiere ejercicios que la cuenta no ha visto y calcularla no escribe nada', async () => {
  const D = device(newCloud('facil'));
  const tOf = topicOf(D, 'facil'), t0 = routeOf(D, 'facil')[0][0];
  const seen = Object.keys(tOf).filter(id => tOf[id] === t0)[0];
  D.recordSession({ skill:'gramatica', level:'facil', topics:[t0], results:[{ itemId: seen, isCorrect:true }], startedAt: D.tick() });
  for(let k = 0; k < 12; k++){
    const { pool } = D.plan({ record:false });
    assert.ok(!pool.some(e => e.item.id === seen), 'no repite el que ya vio habiendo otros sin ver');
  }
  assert.strictEqual(D.getUserLevel(), 'facil');
  const calls = D.cloud.mistakeCalls.length, sessions = JSON.stringify(D.loadProgress().sessions);
  D.computePlanSelection('facil', 9, { startRoute:true }); D.state(); D.yields();
  assert.strictEqual(D.cloud.mistakeCalls.length, calls, 'no llama a mistake_stats');
  assert.strictEqual(JSON.stringify(D.loadProgress().sessions), sessions, 'no toca el progreso');
});

queue.then(() => console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : '')));
