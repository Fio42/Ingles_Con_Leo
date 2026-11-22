#!/usr/bin/env node
/* Academia: "la dejaste a medias" solo cuando el alumno ya avanzo (jsdom; si falta jsdom se omite).
   Corre con:  NODE_PATH=<carpeta con jsdom> node tools/tests/academia-lecciones-a-medias.e2e.js
   Usa academia.html y academia.js REALES en modo local (sin nube): el curso TO BE guarda el avance en este navegador.

   Lo que se protege:
   1. Abrir el primer paso de una leccion y salir NO la deja "a medias": el curso sigue en "para empezar" y no se guarda nada.
   2. Al pasar al siguiente paso ya se guarda; el curso dice "la dejaste a medias" y "Seguir" abre ESE paso.
   3. Si ya estaba en la practica, vuelve a la practica.
   4. Los guardados que ya existian siguen valiendo: uno con avance (paso 3) se retoma en el paso 3; uno viejo que solo
      tenia el paso 1 (sin avance) deja de contarse como "a medias".
   5. Volver al paso 1 despues de avanzar sigue contando como a medias.
   6. El tiempo de la leccion cuenta desde que se abrio, no desde el segundo paso. */
'use strict';
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('academia-lecciones-a-medias.e2e: OMITIDA (falta jsdom: npm i jsdom)'); process.exit(0); }
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.resolve(root, f), 'utf8');
const fails = []; let checks = 0; const ok = (c, m) => { checks++; if(!c){ fails.push(m); console.log('  FAIL ' + m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const KEY = 'leo_academia_piloto_v1@@g';
function boot(seed){
  const html = read('academia.html').replace(/<script[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(html, { url: 'https://inglesconleo.com/academia.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.scrollTo = function(){};
  w.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} });
  w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; };
  w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){}, removeEventListener(){} }; };
  if(seed) w.localStorage.setItem(KEY, JSON.stringify(seed));
  const ctx = dom.getInternalVMContext(); w.run = c => new vm.Script(c).runInContext(ctx);
  ['academia-lanzamiento.js', 'academia-audio.js', 'temas.js', 'academia-data.js', process.env.ACADEMIA_JS || 'academia.js'].forEach(f => w.run(read(f)));
  return w;
}
const main = w => w.document.getElementById('acRoot');
const txt = w => main(w).textContent.replace(/\s+/g, ' ');
const state = w => JSON.parse(w.localStorage.getItem(KEY) || 'null');
async function go(w, hash){ w.location.hash = hash; await sleep(60); }
const btn = (w, re) => [...main(w).querySelectorAll('button,a')].find(b => re.test(b.textContent));
async function click(w, re){ const b = btn(w, re); if(!b) throw new Error('no hay boton ' + re); b.click(); await sleep(60); }
const LESSON = (() => { const c = vm.runInNewContext(read('academia-data.js') + ';ACADEMIA').courses['to-be']; return { id: c.lessons[0].id, id2: c.lessons[1].id, screens: c.lessons[0].screens.length }; })();

(async()=>{
  console.log('Academia (lecciones a medias)');

  // 1. abrir el primer paso y salir
  {
    const w = boot(); await go(w, '#/');
    ok(/para empezar/.test(txt(w)) && !/a medias/.test(txt(w)), '1a: curso nuevo dice "para empezar"');
    await go(w, '#/curso/to-be/leccion/1');
    ok(/Lección 1 · 1 de/.test(txt(w)), '1b: la leccion abre en el paso 1: ' + txt(w).slice(0, 80));
    const st = state(w);
    ok(!st || !st.resume || Object.keys(st.resume).length === 0, '1c: abrir el paso 1 no guarda avance: ' + JSON.stringify(st && st.resume));
    ok(!st || !st.last, '1d: no se marca como ultima leccion abierta');
    await go(w, '#/');
    ok(/para empezar/.test(txt(w)) && !/a medias/.test(txt(w)), '1e: tras salir sigue en "para empezar": ' + (txt(w).match(/Lección \d de \d[^A-Z]{0,40}/) || [''])[0]);
    await go(w, '#/curso/to-be');
    ok(!/a medias/.test(txt(w)), '1f: la lista de lecciones tampoco dice "a medias"');
    ok(/Continuar:/.test(txt(w)), '1g: el boton dice "Continuar", no "Seguir"');
  }

  // 2. avanzar un paso: se guarda, y Seguir abre ese paso
  {
    const w = boot(); await go(w, '#/curso/to-be/leccion/1');
    await click(w, /Siguiente/);
    await click(w, /Siguiente/);
    const st = state(w), r = st && st.resume && st.resume[LESSON.id];
    ok(r && r.stage === 'learn' && r.idx === 2, '2a: avance guardado en el paso 3: ' + JSON.stringify(r));
    ok(typeof r.t0 === 'number' && Date.now() - r.t0 < 60000, '2b: se conserva la hora de inicio');
    await go(w, '#/');
    ok(/la dejaste a medias/.test(txt(w)), '2c: Mi ruta dice "la dejaste a medias"');
    await go(w, '#/curso/to-be');
    ok(/La dejaste a medias/.test(txt(w)) && /Seguir:/.test(txt(w)), '2d: la lista dice "La dejaste a medias" y el boton "Seguir"');
    await click(w, /Seguir:/);
    ok(/Lección 1 · 3 de/.test(txt(w)), '2e: Seguir abre el paso 3: ' + txt(w).slice(0, 80));
  }

  // 3. practica
  {
    const w = boot(); await go(w, '#/curso/to-be/leccion/1');
    for(let i = 0; i < LESSON.screens; i++) await click(w, /Siguiente|Practicar/);
    ok(/Actividad 1 de/.test(txt(w)), '3a: llego a la practica: ' + txt(w).slice(0, 80));
    const r = state(w).resume[LESSON.id];
    ok(r && r.stage === 'practice', '3b: guardado en la practica: ' + JSON.stringify(r));
    await go(w, '#/curso/to-be'); await click(w, /Seguir:/);
    ok(/Actividad 1 de/.test(txt(w)), '3c: Seguir vuelve a la practica');
  }

  // 4. guardados que ya existian
  {
    const base = { v: 1, lessons: {}, missed: {}, cleared: {}, exam: { attempts: [], best: null, lastIds: [] }, goal: null, goalAt: 0, days: [], completions: [], snooze: null, returnTo: null };
    const viejoConAvance = Object.assign({}, base, { resume: { [LESSON.id]: { lessonId: LESSON.id, t0: Date.now() - 1000, at: Date.now(), stage: 'learn', idx: 2 } }, last: LESSON.id });
    let w = boot(viejoConAvance); await go(w, '#/curso/to-be');
    ok(/La dejaste a medias/.test(txt(w)), '4a: un guardado viejo con avance (paso 3, sin marca nueva) sigue "a medias"');
    await click(w, /Seguir:/);
    ok(/Lección 1 · 3 de/.test(txt(w)), '4b: y se retoma en el paso 3: ' + txt(w).slice(0, 60));

    const viejoSinAvance = Object.assign({}, base, { resume: { [LESSON.id]: { lessonId: LESSON.id, t0: Date.now() - 1000, at: Date.now(), stage: 'learn', idx: 0 } }, last: LESSON.id });
    w = boot(viejoSinAvance); await go(w, '#/');
    ok(/para empezar/.test(txt(w)) && !/a medias/.test(txt(w)), '4c: un guardado viejo de solo el paso 1 ya no cuenta como "a medias"');
    await go(w, '#/curso/to-be/leccion/1');
    ok(/Lección 1 · 1 de/.test(txt(w)), '4d: y abre la leccion en el paso 1');

    const hecha = Object.assign({}, base, { lessons: { [LESSON.id]: { done: true, doneAt: Date.now(), firstOk: 6, total: 8 } }, resume: { [LESSON.id]: { lessonId: LESSON.id, stage: 'learn', idx: 2, at: 1 } }, last: LESSON.id });
    w = boot(hecha); await go(w, '#/curso/to-be');
    ok(!/La dejaste a medias/.test(txt(w)), '4e: una leccion ya terminada no aparece "a medias"');
  }

  // 5. volver al paso 1 despues de avanzar
  {
    const w = boot(); await go(w, '#/curso/to-be/leccion/1');
    await click(w, /Siguiente/); await click(w, /Anterior/);
    ok(/Lección 1 · 1 de/.test(txt(w)), '5a: de vuelta en el paso 1');
    await go(w, '#/curso/to-be');
    ok(/La dejaste a medias/.test(txt(w)), '5b: volver al paso 1 despues de avanzar sigue contando como a medias');
  }

  // 6. el tiempo cuenta desde que se abrio la leccion
  {
    const w = boot(); await go(w, '#/curso/to-be/leccion/1');
    const abierta = Date.now(); await sleep(250);
    await click(w, /Siguiente/);
    const r = state(w).resume[LESSON.id];
    ok(r.t0 <= abierta + 30, '6: t0 = hora de apertura (no la del segundo paso): ' + (r.t0 - abierta) + ' ms');
  }

  console.log('\n  ' + checks + ' comprobaciones, ' + fails.length + ' con fallo');
  if(fails.length){ fails.forEach(f => console.log('   - ' + f)); process.exit(1); }
  process.exit(0);
})().catch(e => { console.log('  ERROR de la prueba: ' + (e && e.stack || e)); process.exit(1); });
