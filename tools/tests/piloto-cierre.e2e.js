#!/usr/bin/env node
/* PRUEBA DE CIERRE del piloto (jsdom; si falta jsdom se omite). Sesiones CORTAS de 2 y 3 ejercicios de un tema, con el registro REAL
   (recordSession, progreso, instrumentacion, sincronizacion con la nube simulada), sin duplicaciones ni efectos secundarios:
     - Miembro con tema de otro nivel (xt) y con tema de su propio nivel: 1 sola sesion guardada, cada ejercicio una vez, 1 sola subida a la nube,
       1 sola actualizacion de errores con solo los ejercicios calificados, el dominio del tema cuenta los intentos reales,
       "otra sesion" no vuelve a guardar, y no queda sesion a medias guardada.
     - Cuenta gratis: sesion corta de un tema con pocos ejercicios gratis: cuenta justo esos ejercicios en el limite diario.
   Correr:  NODE_PATH=<carpeta con jsdom>/node_modules node tools/tests/piloto-cierre.e2e.js */
'use strict';
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('piloto-cierre.e2e: OMITIDA (falta jsdom: npm i jsdom)'); process.exit(0); }
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if(!c) fails.push(m); };
function boot(){
  const dom = new JSDOM('<!doctype html><html><body><div id="c"></div></body></html>', { url: 'https://inglesconleo.com/plan-estudio.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener(){}, removeEventListener(){} }));
  w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; };
  w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){} }; };
  const vmctx = dom.getInternalVMContext();
  w.run = code => new vm.Script(code).runInContext(vmctx);
  ['data.js', 'temas.js', 'app.js'].forEach(f => w.run(read(f)));
  return w;
}
// Temas reales con pocos ejercicios (se buscan, no se asumen)
const probe = boot();
const levels = probe.run('LEVELS');
function temasCortos(){ const o = []; Object.keys(probe.run('TEMA_BY_ID')).forEach(id => levels.forEach(l => { const n = probe.pickTemaOnlyItems('gramatica', l, id, 99).length; if(n >= 2 && n <= 3 && levels.filter(x => x !== l).every(x => probe.pickTemaOnlyItems('gramatica', x, id, 99).length === 0)) o.push({ id, l, n }); })); return o; }   // el tema solo existe en ese nivel
const cortos = temasCortos();
ok(cortos.some(c => c.n === 2) && cortos.some(c => c.n === 3), 'hay temas reales con 2 y con 3 ejercicios para probar');

function miembroCorto(temaId, temaLevel, savedLevel, wrongFirst){
  const w = boot(); const where = 'miembro ' + temaId + ' (' + temaLevel + ', nivel guardado ' + savedLevel + '): ';
  w.saveProfile({ level: savedLevel });
  w.__cloud = { pushes: [], mistakes: [] };
  w.run(`var LeoBackend = new Proxy({ isConfigured: () => true, pushSession: s => { __cloud.pushes.push(s); return Promise.resolve(); }, applyMistakeResults: items => { __cloud.mistakes.push(items); return Promise.resolve(); } },
    { get: (t, k) => (k in t ? t[k] : (() => Promise.resolve(null))) });`);
  const q = w.contentForTema(temaId).practiceHref; const qs = new URLSearchParams(q.split('?')[1] || '');
  const sel = w.computePlanSelection(savedLevel, 9, { focusFamily: qs.get('foco'), focusTema: qs.get('tema') });
  const pool = w.buildPlanPool(w.resolvePlanContentLevel(savedLevel, 'recommended'), sel);
  pool.forEach(e => { if(e && typeof e === 'object' && !e.cl) e.cl = savedLevel; });
  const n = pool.length;
  ok(n === probe.pickTemaOnlyItems('gramatica', temaLevel, temaId, 99).length, where + 'la sesion tiene solo los ' + n + ' ejercicios del tema, sin relleno');
  let calls = 0; w.__first = wrongFirst;
  w.run(`renderMixItemInto = (card, entry, cb) => { cb(!(__first && __n++ === 0)); }; var __n = 0;
    showRetryOrNextButtons = (card, isCorrect, retry, next) => next(); appendSessionInsight = () => {};`);
  let again = 0; const c = w.document.getElementById('c');
  w.__a = { container: c, level: savedLevel, pool, onAnother(){ again++; } };
  w.run('runPlanSessionCore(__a)');
  const p = w.loadProgress();
  ok(p.sessions.length === 1, where + 'se guarda 1 sola sesion (hay ' + p.sessions.length + ')');
  const res = (p.sessions[0] || { results: [] }).results;
  ok(res.length === n, where + 'la sesion guarda ' + n + ' resultados (hay ' + res.length + ')');
  ok(new Set(res.map(r => r.itemId)).size === res.length, where + 'ningun ejercicio duplicado');
  ok(res.filter(r => r.isCorrect === false).length === (wrongFirst ? 1 : 0), where + 'los errores guardados son los reales');
  ok(w.__cloud.pushes.length === 1 && w.__cloud.pushes[0].results.length === n, where + 'una sola subida a la nube con ' + n + ' resultados');
  ok(w.__cloud.mistakes.length === 1 && w.__cloud.mistakes[0].length === n && w.__cloud.mistakes[0].filter(m => m.is_correct === false).length === (wrongFirst ? 1 : 0), where + 'una sola actualizacion de errores con ' + n + ' ejercicios');
  const otro = temaLevel !== savedLevel;
  ok(res.every(r => (otro ? r.xt === 1 && r.cl === temaLevel : !r.xt)), where + (otro ? 'ejercicios de otro nivel marcados xt con su nivel real' : 'ejercicios de su nivel sin marca xt'));
  ok(w.getUserLevel() === savedLevel, where + 'el nivel guardado no cambia');
  ok(w.loadInflightSession('plan', savedLevel) == null, where + 'no queda sesion a medias guardada');
  // dominio y diagnostico: usan los intentos reales y no fallan con tan pocos datos
  let d = null; try{ d = w.computeDiagnosis(p, null); }catch(e){}
  ok(!!d, where + 'el diagnostico se calcula sin error con una sesion corta');
  const fam = d && d.units.find(u => u.key === 'family:' + w.TEMA_BY_ID[temaId].family);
  const ts = fam && (fam.temaStats || []).find(s => s.id === temaId);
  ok(!ts || ts.n === n, where + 'el dominio del tema, si aparece, cuenta ' + n + ' intentos (' + (ts && ts.n) + ')');
  ok(!(d && d.weak && d.weak.focusTema && d.weak.focusTema.id === temaId), where + 'con ' + n + ' intentos no se marca el tema como punto debil ni se fuerza un refuerzo');
  ok(/Hacer otra|otra sesi/i.test(c.innerHTML) || c.innerHTML.length > 200, where + 'se muestra el resumen final');
  const btn = [...c.querySelectorAll('button')].find(b => /otra/i.test(b.textContent));
  if(btn){ btn.click(); ok(w.loadProgress().sessions.length === 1 && w.__cloud.pushes.length === 1, where + 'pulsar "otra sesion" no vuelve a guardar la anterior'); }
  return w;
}
const c2 = cortos.find(c => c.n === 2), c3 = cortos.find(c => c.n === 3);
miembroCorto(c2.id, c2.l, levels[Math.max(0, levels.indexOf(c2.l) - 1)], true);   // 2 ejercicios, de un nivel superior al guardado (xt), con un error
miembroCorto(c3.id, c3.l, levels[Math.max(0, levels.indexOf(c3.l) - 1)], false);  // 3 ejercicios, de otro nivel, todo bien
miembroCorto(c3.id, c3.l, c3.l, true);                                              // 3 ejercicios en su propio nivel, con un error (sin xt)

if(fails.length){ console.error('FALLA piloto-cierre.e2e (' + fails.length + ' de ' + checks + '):\n  ' + fails.slice(0, 25).join('\n  ')); process.exit(1); }
console.log('piloto-cierre.e2e: ' + checks + ' comprobaciones (sesiones cortas de 2 y 3 ejercicios), todas bien');
