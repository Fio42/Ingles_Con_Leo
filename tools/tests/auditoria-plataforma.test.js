#!/usr/bin/env node
/* PRUEBAS de regresion de la auditoria del 2026-11-24 (AUDITORIA_PLATAFORMA_2026-11-24.md). Sin red.
   Parte con jsdom (si falta se omiten esas); el resto son comprobaciones del codigo fuente y del modulo inicio-alumno.js.
   Corre con:  node tools/tests/auditoria-plataforma.test.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let ok = 0; const fails = []; const pend = [];
const t = (n, f) => { try{ const r = f(); if(r && r.then) pend.push(r.then(() => { ok++; }, e => fails.push(n + ': ' + e.message))); else ok++; }catch(e){ fails.push(n + ': ' + e.message); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---- 1. Inicio del alumno: la evaluacion sola (dia practicado, 0 lecciones, nada a medias) NO es "curso empezado" ---- */
const IA = require(path.join(root, 'inicio-alumno.js'));
const CUR = { enabled: true, courses: { 'there-is-are': { title: 'THERE IS', open: true, lessons: 5 } } };
const mk = o => ({ getItem: k => (k in o ? JSON.stringify(o[k]) : null) });
t('inicio-alumno: solo un dia practicado (evaluacion) y 0 lecciones => no empezado, la tarjeta dice Ir a la Academia', () => {
  const s = mk({ leo_academia_v1_there_is_are: null, 'leo_academia_v1_there-is-are': { lessons: {}, resume: {}, days: ['2026-11-20'] } });
  const l = IA.list(CUR, s); assert.strictEqual(l[0].started, false);
  assert.strictEqual(IA.view(l).state, 'start'); assert.strictEqual(IA.view(l).cta, 'Ir a la Academia');
});
t('inicio-alumno: una leccion terminada o una a medias SI cuentan como empezado', () => {
  const a = IA.list(CUR, mk({ 'leo_academia_v1_there-is-are': { lessons: { l1: { done: true } }, resume: {}, days: [] } }));
  const b = IA.list(CUR, mk({ 'leo_academia_v1_there-is-are': { lessons: {}, resume: { l1: { i: 2 } }, days: [] } }));
  assert.strictEqual(a[0].started, true); assert.strictEqual(b[0].started, true); assert.strictEqual(IA.view(a).cta, 'Continuar curso');
});

/* ---- 2. Codigo fuente: contratos que no deben volver a romperse ---- */
const app = read('app.js');
t('progreso: la fortaleza nunca es una habilidad que hoy "Necesita refuerzo"', () => {
  assert(/strengthPool = skills\.filter\(u => u\.n >= 15 && u\.acc >= 70 && u\.state !== 'refuerzo'\)/.test(app));
});
t('progreso: el texto de la fortaleza dice que es el porcentaje TOTAL (no "ahora")', () => {
  assert(/Tu mejor habilidad es \$\{diag\.strength\.label\}, con \$\{diag\.strength\.acc\}% de aciertos en total/.test(app));
  assert(!/Tu mejor habilidad ahora es/.test(app));
});
t('progreso: "Dentro de X, lo que mas necesitas reforzar es X" no se repite cuando tema y unidad se llaman igual', () => {
  assert(/toLowerCase\(\) === String\(u\.label\)\.trim\(\)\.toLowerCase\(\)/.test(app));
});
t('practica de miembros: la descripcion de cada habilidad ya no promete un numero fijo (la sesion es de ~5, ~9 o ~15)', () => {
  const i = app.indexOf('function initMemberPractice'); const j = app.indexOf('const SKILL_DESC = {', i); const k = app.indexOf('};', j);
  const block = app.slice(j, k);
  assert(!/\d/.test(block), 'la descripcion de miembros trae un numero: ' + block);
});
t('miembros.html: la pestana ya no dice "Hazte miembro" a quien ya entro (panel y cuenta gratis)', () => {
  const h = read('miembros.html');
  assert(/document\.title = 'Mi panel - Inglés con Leo'/.test(h)); assert(/document\.title = 'Tu cuenta - Inglés con Leo'/.test(h));
});
t('academia.js: el titulo de la portada no se duplica ("Academia - Academia")', () => {
  const src = read('academia.js'); const m = src.match(/function setTitle\(t\)\{[^\n]*\}/); assert(m, 'setTitle no encontrado');
  const doc = { title: '' }; new Function('document', m[0] + '; setTitle("Academia"); const a = document.title; setTitle("Mis logros"); return [a, document.title];')(doc);
  const out = new Function('document', m[0] + '; setTitle("Academia"); const a = document.title; setTitle("Mis logros"); return [a, document.title];')({ title: '' });
  assert.strictEqual(out[0], 'Academia - Inglés con Leo'); assert.strictEqual(out[1], 'Mis logros - Academia - Inglés con Leo');
});
t('aprender: las microlecciones "Proximamente" con curso completo apuntan a un curso REAL de la Academia', () => {
  const src = read('aprender.js'); const m = src.match(/var SOON_COURSE = (\{[^}]*\});/); assert(m, 'SOON_COURSE no encontrado');
  const map = new Function('return ' + m[1])();
  const data = read('aprender-data.js'); const cursos = read('academia-cursos.js') + read('academia-motor.js');
  Object.keys(map).forEach(id => {
    assert(data.indexOf("id: '" + id + "'") >= 0, 'microleccion inexistente: ' + id);
    assert(cursos.indexOf("'" + map[id] + "'") >= 0 || cursos.indexOf('"' + map[id] + '"') >= 0, 'curso inexistente en la Academia: ' + map[id]);
  });
  assert(/x\.free \? 'Gratis con tu cuenta' : 'Solo para miembros'/.test(src));
});
t('chatbot.css: el lanzador reducido se mueve a la izquierda y en celular se achica', () => {
  const css = read('chatbot.css'); assert(/body\.leobot-away \.leobot-fab\{right:auto;left:14px;\}/.test(css)); assert(/@media \(max-width:480px\)\{\s*\.leobot-fab\{width:56px;height:56px;right:8px;\}/.test(css));
});

/* ---- 3. Comportamiento con jsdom ---- */
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('auditoria-plataforma: pruebas con jsdom OMITIDAS (falta jsdom: npm i jsdom)'); }
if(JSDOM){
  const page = () => {
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://inglesconleo.com/practica.html', runScripts: 'outside-only', pretendToBeVisual: true });
    const w = dom.window; w.HTMLElement.prototype.scrollIntoView = function(){}; w.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} });
    w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; }; w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){} }; };
    const ctx = dom.getInternalVMContext(); w.run = c => new vm.Script(c).runInContext(ctx);
    ['data.js', 'temas.js', 'app.js'].forEach(f => w.run(read(f)));
    return w;
  };
  t('visitante: el encabezado dice solo lo que puede hacer hoy (3, 1, 0), sin cambiar el banco de la sesion', () => {
    const w = page(); w.run("var __d = []; document.addEventListener('leo:free-session-total', e => __d.push(e.detail)); _leoAccessTier = 'guest';");
    const key = w.run('localDailyCountKey()');
    const pool = n => w.run('freeSessionCap(new Array(' + n + ').fill(0)).length');
    assert.strictEqual(pool(8), 8, 'el pool del visitante no cambia');
    w.localStorage.setItem(key, '2'); assert.strictEqual(pool(8), 8);
    w.localStorage.setItem(key, '3'); assert.strictEqual(pool(8), 8);
    assert.deepStrictEqual(JSON.parse(w.run('JSON.stringify(__d)')), [3, 1, 0]);
  });
  t('visitante: el contador "Pregunta X de N" muestra 3 (no 8) mientras le queden ejercicios hoy; cuenta gratis conserva el total', () => {
    const w = page(); const key = w.run('localDailyCountKey()'); w.run("_leoAccessTier = 'guest';");
    const f = (idx, n) => w.run('freeShownTotal(' + idx + ', ' + n + ')');
    assert.strictEqual(f(0, 8), 3);
    w.localStorage.setItem(key, '1'); assert.strictEqual(f(1, 8), 3);
    w.localStorage.setItem(key, '2'); assert.strictEqual(f(2, 8), 3);
    w.localStorage.setItem(key, '0'); assert.strictEqual(f(0, 2), 2, 'una sesion de 2 sigue diciendo 2');
    w.run("_leoAccessTier = 'free';"); assert.strictEqual(f(0, 8), 8);
    assert(/sessionHeaderHtml\('Gramática', level, idx\+1, freeShownTotal\(idx, total\)\)/.test(read('app.js')), 'la sesion gratis de gramatica usa el contador del visitante');
  });
  t('cuenta gratis: el encabezado sigue siendo el tamano real de la sesion (sin tope de visitante)', () => {
    const w = page(); w.run("var __d = []; document.addEventListener('leo:free-session-total', e => __d.push(e.detail)); _leoAccessTier = 'free';");
    w.run('freeSessionCap(new Array(4).fill(0))'); assert.strictEqual(JSON.parse(w.run('JSON.stringify(__d)'))[0], 4);
  });
  t('diagRenderWithStats: con servidor espera los errores del servidor y dibuja UNA vez (sin 90 -> 116)', async () => {
    const w = page();
    w.run("var __paints = 0; window.LeoBackend = { isConfigured: () => true, getMistakeStats: () => new Promise(r => setTimeout(() => r([]), 60)) }; _mistakeStatsCache = undefined; diagRenderWithStats(() => { __paints++; });");
    assert.strictEqual(w.run('__paints'), 0, 'no debe dibujar con el historial local antes del servidor');
    await sleep(200); assert.strictEqual(w.run('__paints'), 1);
  });
  t('diagRenderWithStats: sin servidor configurado dibuja de inmediato (invitados, pruebas)', () => {
    const w = page(); w.run("var __paints = 0; _mistakeStatsCache = undefined; diagRenderWithStats(() => { __paints++; });");
    assert.strictEqual(w.run('__paints'), 1);
  });
  t('diagRenderWithStats: si el servidor falla (null) dibuja igual con lo local, una vez', async () => {
    const w = page();
    w.run("var __paints = 0; window.LeoBackend = { isConfigured: () => true, getMistakeStats: () => Promise.resolve(null) }; _mistakeStatsCache = undefined; diagRenderWithStats(() => { __paints++; });");
    await sleep(100); assert.strictEqual(w.run('__paints'), 1);
  });
  t('diagRenderWithStats: red lenta (>2 s) dibuja lo local a los 2 s y redibuja si llega el servidor', async () => {
    const w = page();
    w.run("var __paints = 0; window.LeoBackend = { isConfigured: () => true, getMistakeStats: () => new Promise(r => setTimeout(() => r([]), 2400)) }; _mistakeStatsCache = undefined; diagRenderWithStats(() => { __paints++; });");
    await sleep(2200); assert.strictEqual(w.run('__paints'), 1, 'a los 2 s ya mostro lo local');
    await sleep(500); assert.strictEqual(w.run('__paints'), 2, 'al llegar el servidor redibuja');
  });
  t('diagRenderWithStats: si tarda >2 s, lo local lleva una nota "provisional" que desaparece al llegar el servidor', async () => {
    const w = page();
    w.run("var __c = document.createElement('div'); document.body.appendChild(__c); window.LeoBackend = { isConfigured: () => true, getMistakeStats: () => new Promise(r => setTimeout(() => r([]), 3000)) }; _mistakeStatsCache = undefined; diagRenderWithStats(() => {}, __c);");
    await sleep(1500); assert.strictEqual(w.run("__c.querySelector('.diag-provisional') !== null"), false, 'antes de 2 s no hay nota');
    await sleep(800); assert.strictEqual(w.run("__c.querySelector('.diag-provisional') !== null"), true, 'a los 2 s lo local se marca como provisional');
    assert(/pueden cambiar/.test(w.run("__c.querySelector('.diag-provisional').textContent")));
    await sleep(1000); assert.strictEqual(w.run("__c.querySelector('.diag-provisional') !== null"), false, 'al llegar el servidor la nota se quita');
  });
  t('diagRenderWithStats: si el servidor falla despues de los 2 s la nota tambien se quita (no queda "actualizando" para siempre)', async () => {
    const w = page();
    w.run("var __c = document.createElement('div'); document.body.appendChild(__c); window.LeoBackend = { isConfigured: () => true, getMistakeStats: () => new Promise(r => setTimeout(() => r(null), 2300)) }; _mistakeStatsCache = undefined; diagRenderWithStats(() => {}, __c);");
    await sleep(2150); assert.strictEqual(w.run("__c.querySelector('.diag-provisional') !== null"), true);
    await sleep(400); assert.strictEqual(w.run("__c.querySelector('.diag-provisional') !== null"), false);
  });
  t('aislamiento: si la cuenta/espacio cambia mientras llegan los errores del servidor, NO se guardan en cache ni se usan', async () => {
    const w = page();
    w.run("window.LeoBackend = { isConfigured: () => true, getMistakeStats: () => new Promise(r => setTimeout(() => { LeoScope.scope = () => 'u:otra-cuenta'; r([{ item_id: 'x', status: 'active' }]); }, 50)) }; _mistakeStatsCache = undefined; var __r = 'pendiente'; loadMistakeStatsMap().then(v => { __r = v; });");
    await sleep(200);
    assert.strictEqual(w.run('__r'), null, 'devuelve null (se usa lo local del espacio nuevo)');
    assert.strictEqual(w.run('_mistakeStatsCache'), undefined, 'no deja datos de la cuenta anterior en la cache');
  });
  t('aislamiento: sin cambio de cuenta, los errores del servidor se guardan como siempre', async () => {
    const w = page();
    w.run("window.LeoBackend = { isConfigured: () => true, getMistakeStats: () => Promise.resolve([{ item_id: 'x', status: 'active' }]) }; _mistakeStatsCache = undefined; var __r2; loadMistakeStatsMap().then(v => { __r2 = v; });");
    await sleep(100); assert.strictEqual(w.run('__r2 instanceof Map && __r2.size'), 1);
  });
}

Promise.all(pend).then(() => {
  console.log('auditoria-plataforma: ' + ok + ' ok, ' + fails.length + ' fallos');
  fails.forEach(x => console.log('  FAIL ' + x));
  process.exit(fails.length ? 1 : 0);
});
