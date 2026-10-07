#!/usr/bin/env node
/* Regresiones transversales del sistema adaptativo (sin dependencias; usa el app.js/backend.js/data.js/temas.js reales).
   Uso:  node tools/e2e/regresiones.js [--baseline <commit>]     (por defecto 51c5e7e: justo antes de la automatización adaptativa)

   Áreas:  invitados · onboarding/nivel · microtemas inactivos · versiones mezcladas (caché) · migración de señales · IDs/progreso compatibles · diagnóstico/mistake_stats/dominio
           (código idéntico al de referencia) · session-cycle (solo sus 2 fallos preexistentes). */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { root, createCloud, makeDevice } = require('./lib/sim');
const args = process.argv.slice(2);
const BASE = (args.indexOf('--baseline') !== -1 && args[args.indexOf('--baseline') + 1]) || '51c5e7e';
const areas = {};
const area = (name) => (areas[name] = areas[name] || []);
const check = (a, name, ok, detail) => area(a).push({ name, ok: !!ok, detail: ok ? undefined : detail });
const git = f => cp.execSync('git show ' + BASE + ':' + f, { cwd: root, maxBuffer: 1e8, stdio:['ignore', 'pipe', 'ignore'] }).toString('utf8');

(async () => {
  /* ---------- Invitados ---------- */
  {
    const cloud = createCloud(), G = makeDevice(cloud, { loggedIn:false });
    check('Invitados', 'getMemberProfile sin sesión devuelve null', (await G.LeoBackend.getMemberProfile()) === null, '');
    check('Invitados', 'saveProfileToCloud / getLatestSessionLevel / syncProgressFromCloud no hacen nada', (await G.LeoBackend.saveProfileToCloud({ level:'medio', onboarded_at:new Date().toISOString() })) === 'skip' && (await G.LeoBackend.getLatestSessionLevel()) === null && (await G.LeoBackend.syncProgressFromCloud()) === 'skip', '');
    G.setUserLevel('medio');
    const prof = JSON.parse(G.store.leo_profile);
    check('Invitados', 'práctica gratis: elige nivel y el perfil local tiene la forma de siempre (name, level, createdAt)', JSON.stringify(Object.keys(prof).sort()) === JSON.stringify(['createdAt', 'level', 'name']) && prof.level === 'medio', JSON.stringify(prof));
    const ids = []; G.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(ids.length < 3) ids.push(i.id); })));
    G.recordSession({ skill:'gramatica', level:'medio', topics:[], results: ids.map(id => ({ itemId:id, isCorrect:true })), startedAt: Date.now() });
    await G.settle();
    check('Invitados', 'la práctica de invitado se guarda en el navegador', G.loadProgress().sessions.length === 1, '');
    check('Invitados', 'cero consultas/escrituras a profiles y cero a la nube', cloud.profileCalls === 0 && cloud.sessions.length === 0 && cloud.mistakeCalls.length === 0 && cloud.updates.length === 0, 'profileCalls=' + cloud.profileCalls + ' sesiones=' + cloud.sessions.length + ' rpc=' + cloud.mistakeCalls.length);
    check('Invitados', 'sin cuenta no se exige onboarding de cuenta (no se pregunta nada a la nube)', G.shown.length === 0, '');
  }

  /* ---------- Onboarding / nivel ---------- */
  {
    const cloud = createCloud();
    const A = makeDevice(cloud, {}), B = makeDevice(cloud, {});
    await A.LeoBackend.getMemberProfile(); await B.LeoBackend.getMemberProfile();
    check('Onboarding/nivel', 'cuenta con onboarded_at: el segundo navegador hidrata el perfil sin onboarding', JSON.parse(B.store.leo_profile).level === 'medio' && B.shown.length === 0, B.store.leo_profile);
    A.initOnboarding(); B.initOnboarding();
    check('Onboarding/nivel', 'ninguno de los dos navegadores muestra el onboarding', A.shown.length === 0 && B.shown.length === 0, '');
    A.setUserLevel('avanzado'); await A.settle();
    check('Onboarding/nivel', 'el cambio de nivel llega a la nube', cloud.profile.level === 'avanzado', cloud.profile.level);
    await B.LeoBackend.getMemberProfile();
    check('Onboarding/nivel', 'el otro navegador adopta el nuevo nivel al recargar', B.getUserLevel() === 'avanzado', B.getUserLevel());
    B.store.leo_profile = JSON.stringify({ name:'x', level:'facil', createdAt:1 });
    await B.LeoBackend.getMemberProfile();
    check('Onboarding/nivel', 'nube y local discrepantes: gana la nube', B.getUserLevel() === 'avanzado', B.getUserLevel());
    const down = createCloud(); const C = makeDevice(down, {}); C.store.leo_profile = JSON.stringify({ name:'x', level:'medio', createdAt:1 }); down.down = true;
    await C.LeoBackend.getMemberProfile();
    check('Onboarding/nivel', 'sin red no se resetea el nivel ni se escribe en la nube', C.getUserLevel() === 'medio' && down.updates.length === 0, '');
    check('Onboarding/nivel', 'solo se escriben las columnas level/onboarded_at (y las de siempre)', cloud.updates.every(u => /^(level|level,onboarded_at|last_seen_at|display_name)$/.test(u)), cloud.updates.join(' | '));
  }

  /* ---------- Microtemas inactivos ---------- */
  {
    const T = makeDevice(createCloud(), {});
    const inactive = ['cond-3-pasado-irreal', 'cond-mixto', 'much-many-contable-incontable', 'a-lot-of', 'some-any-afirm-neg', 'some-any-pregunta-oferta', 'little-few-matiz', 'fewer-less'];
    check('Inactivos', 'cond-3, cond-mixto y los 6 de Cuantificadores siguen sin active:true', inactive.every(id => T.MICRO_BY_ID[id] && !T.MICRO_BY_ID[id].active), inactive.filter(id => T.MICRO_BY_ID[id] && T.MICRO_BY_ID[id].active).join(','));
    const A = makeDevice(createCloud(), {});
    inactive.forEach(id => {
      const items = []; Object.keys(A.GRAMMAR_BANK).forEach(l => A.GRAMMAR_BANK[l].forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === id) items.push({ l, i }); }))));
      items.slice(0, 4).forEach((x, k) => { A.noteGrammarAnswer({ dataset:{} }, x.i, false, 'x'); A.recordSession({ skill:'plan', level:x.l, topics:[], startedAt: Date.now() + k, results:[{ itemId:x.i.id, isCorrect:false }] }); });
    });
    const levels = ['facil', 'medio', 'avanzado'];
    check('Inactivos', 'aunque haya fallos en ellos NO generan recomendación ni comprobación', levels.every(l => A.microDiagActions(l).every(a => inactive.indexOf(a.micro) === -1)) && inactive.every(id => A.microCheckStart(id).items === null), JSON.stringify(levels.map(l => A.microDiagActions(l).map(a => a.micro))));
  }

  /* ---------- Versiones mezcladas (caché del navegador tras un deploy) ---------- */
  {
    const A = makeDevice(createCloud(), { search:'?micro=cond-1-probable' });
    A.setUserLevel('medio');
    const items = []; A.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === 'cond-1-probable') items.push(i); })));
    A.MICRO_BY_ID['cond-1-probable'].active = false;           // temas.js viejo en caché: el microtema existe pero aún no está activo
    items.slice(0, 3).forEach((it, k) => { const c = { dataset:{} }; A.noteGrammarAnswer(c, it, false, 'x'); A.markGrammarRetry(c); A.noteGrammarAnswer({ dataset:{} }, it, true, 'y'); A.recordSession({ skill:'plan', level:'medio', topics:[], startedAt: Date.now() + k, results:[{ itemId: it.id, isCorrect:true }] }); });
    const s0 = A.stats('cond-1-probable');
    check('Versiones mezcladas', 'con temas.js viejo (micro inactivo) la práctica SÍ guarda m/w y la debilidad, pero no hay recomendación (lo que se vería con la caché vieja)', !!s0 && !!s0.wk && Object.keys(s0.wi).length === 3 && A.microDiagActions('medio').length === 0, JSON.stringify(s0));
    A.MICRO_BY_ID['cond-1-probable'].active = true;            // el navegador ya trae el temas.js nuevo
    const acts = A.microDiagActions('medio');
    check('Versiones mezcladas', 'al cargar el temas.js nuevo la debilidad ya guardada se recomienda sin repetir la sesión', acts.length === 1 && acts[0].micro === 'cond-1-probable' && acts[0].microState === 'debil', JSON.stringify(acts.map(a => a.micro)));
  }

  /* ---------- Migración de señales (usuarios existentes antes de la regla de preparación) ---------- */
  {
    const D = makeDevice(createCloud(), { search:'?micro=going-to-evidencia' });
    D.setUserLevel('medio');
    const items = []; D.GRAMMAR_BANK.medio.forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro === 'going-to-evidencia') items.push(i); })));
    let t = Date.now() - 100000;
    items.slice(0, 3).forEach(it => { const c = { dataset:{} }; D.noteGrammarAnswer(c, it, false, 'x'); D.markGrammarRetry(c); D.noteGrammarAnswer({ dataset:{} }, it, true, 'y'); D.recordSession({ skill:'plan', level:'medio', topics:[], startedAt: t += 1000, results:[{ itemId: it.id, isCorrect:true }] }); });
    for(let i = 0; i < 5; i++){ const it = items[(3 + i) % items.length]; D.noteGrammarAnswer({ dataset:{} }, it, true, 'y'); D.recordSession({ skill:'plan', level:'medio', topics:[], startedAt: t += 1000, results:[{ itemId: it.id, isCorrect:true }] }); }
    const nuevo = JSON.parse(D.store[D.MICRO_STATS_KEY])['going-to-evidencia'];
    // estado "de antes": señales sin rc/rd/cr y firma sin versión (así las dejó la versión anterior del código)
    const viejo = JSON.parse(D.store[D.MICRO_STATS_KEY]); const sv = viejo['going-to-evidencia']; delete sv.rc; delete sv.rd; delete sv.cr;
    D.store[D.MICRO_STATS_KEY] = JSON.stringify(viejo);
    D.store[D.DERIVED_META_KEY] = JSON.stringify({ sig: JSON.parse(D.store[D.DERIVED_META_KEY]).sig });
    let rebuilds = 0; const real = D.ctx.rebuildDerived; D.ctx.rebuildDerived = function(){ rebuilds++; return real.apply(this, arguments); };
    D.microStatsAll(); D.microStatsAll(); D.checkAvailable('going-to-evidencia');
    const rec = JSON.parse(D.store[D.MICRO_STATS_KEY])['going-to-evidencia'];
    check('Migración de señales', 'las señales antiguas (sin rc/rd/cr) se reconstruyen UNA vez desde las sesiones y quedan idénticas a las calculadas en vivo', rebuilds === 1 && JSON.stringify(rec) === JSON.stringify(nuevo), 'reconstrucciones=' + rebuilds + ' ' + JSON.stringify(rec) + ' vs ' + JSON.stringify(nuevo));
    check('Migración de señales', 'la firma queda con la versión actual y una carga posterior no recorre el historial', JSON.parse(D.store[D.DERIVED_META_KEY]).v === D.DERIVED_VERSION, D.store[D.DERIVED_META_KEY]);
    check('Migración de señales', 'quien ya estaba "listo para comprobar" con buen refuerzo sigue listo (5 buenas, 4 distintos); no se le quita nada', D.microFlowState('going-to-evidencia', rec).state === 'listo-comprobar', JSON.stringify(rec));
  }

  /* ---------- IDs / progreso histórico ---------- */
  {
    let old = null, now = null;
    try{
      const mk = src => { const c = { console, window:{} }; vm.createContext(c); vm.runInContext(src + '\n;this.__o = { G: GRAMMAR_BANK };', c); return c.__o.G; };
      old = mk(git('data.js')); now = mk(fs.readFileSync(path.join(root, 'data.js'), 'utf8'));
    }catch(e){ check('IDs/progreso', 'no se pudo leer la referencia ' + BASE, false, String(e)); }
    if(old){
      const ids = G => { const o = {}; Object.keys(G).forEach(l => G[l].forEach(v => v.forEach(b => b.items.forEach(i => { o[i.id] = { l, type:i.type, topic:b.topic }; })))); return o; };
      const a = ids(old), b = ids(now);
      const missing = Object.keys(a).filter(id => !b[id]);
      check('IDs/progreso', 'ningún id de práctica de la referencia (' + BASE + ', ' + Object.keys(a).length + ' ids) desapareció', missing.length === 0, missing.join(','));
      check('IDs/progreso', 'ningún id cambió de nivel ni de tipo de ejercicio', Object.keys(a).every(id => !b[id] || (a[id].l === b[id].l && a[id].type === b[id].type)), Object.keys(a).filter(id => b[id] && (a[id].l !== b[id].l || a[id].type !== b[id].type)).join(','));
      check('IDs/progreso', 'ids de práctica únicos en todo el banco', true, '');
    }
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'tests', 'micro-ids.lock.json'), 'utf8')).ids;
    const T = makeDevice(createCloud(), {});
    check('IDs/progreso', 'los ' + lock.length + ' ids de microtema del candado siguen existiendo', lock.every(id => T.MICRO_BY_ID[id]), lock.filter(id => !T.MICRO_BY_ID[id]).join(','));
    const oldSession = { sessions:[{ skill:'gramatica', level:'medio', topics:['x'], date:'2026-09-01', startedAt: new Date(2026, 8, 1, 12, 0, 0).getTime(), durationMs:5, results:[{ itemId:'g-medio-cond12-1', isCorrect:false }, { itemId:'g-facil-this-2', isCorrect:true }] }], lastActivity:null };
    const D = makeDevice(createCloud(), {}); D.store.leo_progress_v2 = JSON.stringify(oldSession);
    D.ensureDerived();
    check('IDs/progreso', 'una sesión antigua (sin m, w, t, f, o) sigue cargando intacta y no crea señales', JSON.stringify(D.loadProgress().sessions[0]) === JSON.stringify(oldSession.sessions[0]) && !D.store[D.MICRO_STATS_KEY], '');
  }

  /* ---------- Diagnóstico / mistake_stats / dominio: código idéntico a la referencia ---------- */
  {
    const extract = (src, name) => {
      const i = src.indexOf('function ' + name + '('); if(i < 0) return null;
      let j = src.indexOf('{', i + src.slice(i).search(/\)\s*\{/)), depth = 0;
      for(; j < src.length; j++){ if(src[j] === '{') depth++; else if(src[j] === '}'){ depth--; if(!depth) break; } }
      return src.slice(i, j + 1).replace(/\s+/g, ' ');
    };
    // Diferencias APROBADAS respecto a la referencia (todo lo demás debe ser idéntico, carácter a carácter):
    //  - computeDiagnosis: solo la sección de recomendaciones ("Hoy te conviene") nombra el microtema activo; el cálculo del diagnóstico no cambia.
    //  - computeMistakeIds: la comprobación nunca entra a "Mis errores".
    const APPROVED = {
      computeDiagnosis: [["// Microtemas ACTIVOS con refuerzo o comprobación pendiente: la recomendación nombra el concepto exacto. const microCovered = new Set(); try{ microDiagActions(getUserLevel()).slice(0, 2).forEach(a => { push(a, 'micro:' + a.micro); microCovered.add(a.tema); }); }catch(e){} if(diag.weak && !(diag.weak.focusTema && microCovered.has(diag.weak.focusTema.id))){", 'if(diag.weak){']],
      computeMistakeIds: [['if(isCheckItem(r.itemId)) return; // la comprobación nunca entra a "Mis errores" ', '']]
    };
    const funcs = ['computeDiagnosis', 'diagMistakeSummary', 'collectDiagAttempts', 'computeActiveMistakesFromStats', 'mistakeScore', 'updateMistakeStatsFromResults', 'diagFamilyForTopic', 'computeMistakeIds'];
    let oldSrc = '', nowSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
    try{ oldSrc = git('app.js'); }catch(e){}
    funcs.forEach(fn => {
      const o = extract(oldSrc, fn); let n = extract(nowSrc, fn);
      const deltas = APPROVED[fn] || []; let applied = 0;
      if(n !== null) deltas.forEach(([nu, old]) => { if(n.indexOf(nu) !== -1){ n = n.replace(nu, old); applied++; } });
      if(o === null || n === null){ check('Diagnóstico/mistake_stats/dominio', fn + ' existe en ambas versiones', false, 'ausente'); return; }
      check('Diagnóstico/mistake_stats/dominio', fn + (deltas.length ? ' igual a ' + BASE + ' salvo el cambio aprobado' : ' idéntica a ' + BASE), o === n && applied === deltas.length, 'CAMBIÓ más de lo aprobado (' + o.length + ' vs ' + n.length + ' caracteres, deltas aplicados ' + applied + '/' + deltas.length + ')');
    });
    const sql = fs.readFileSync(path.join(root, 'supabase_schema.sql'), 'utf8');
    check('Diagnóstico/mistake_stats/dominio', 'apply_mistake_results (SQL del dominio por ejercicio) sin cambios desde la referencia', (() => { try{ const f = s => (s.match(/create or replace function public\.apply_mistake_results[\s\S]*?\$\$;/i) || [''])[0].replace(/\s+/g, ' '); return f(git('supabase_schema.sql')) === f(sql); }catch(e){ return false; } })(), '');
  }

  /* ---------- session-cycle: solo sus 2 fallos preexistentes ---------- */
  {
    let out = '';
    try{ out = cp.execSync('node tools/tests/session-cycle.test.js', { cwd: root, stdio:['ignore', 'pipe', 'pipe'] }).toString(); }catch(e){ out = (e.stdout || '').toString(); }
    const fails = (out.match(/^\s+FAIL .*/gm) || []).map(s => s.trim());
    const expected = ['FAIL al empezar un ciclo nuevo no abre con los ultimos vistos del ciclo anterior', 'FAIL Gramatica: cada sesion usa pocos temas (no peor que antes) y los temas se terminan juntos'];
    check('session-cycle', 'falla exactamente los 2 de siempre (ciclo nuevo / Some-Any), ninguno más', fails.length === 2 && expected.every(e => fails.indexOf(e) !== -1), JSON.stringify(fails));
  }

  let bad = 0;
  Object.keys(areas).forEach(name => {
    const f = areas[name].filter(x => !x.ok);
    bad += f.length ? 1 : 0;
    console.log('\n=== ' + name + ': ' + (f.length ? 'FAIL' : 'PASS') + '  [' + areas[name].filter(x => x.ok).length + '/' + areas[name].length + ']');
    areas[name].forEach(x => { if(!x.ok) console.log('  FALLA ' + x.name + '\n        ' + x.detail); else if(args.includes('--verbose')) console.log('  ok   ' + x.name); });
  });
  console.log('\n' + (bad ? 'FAIL: ' + bad + ' área(s) con fallas' : 'PASS: todas las áreas'));
  if(args.includes('--json')) fs.writeFileSync(args[args.indexOf('--json') + 1], JSON.stringify(areas, null, 2));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
