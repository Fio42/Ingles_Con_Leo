#!/usr/bin/env node
/* Panel de miembros: UNA accion principal segun el estado (app.js: pickDashHero, findResumableSession,
   renderTodayHero, syncContinueWithHero) y practica gratis que respeta el nivel elegido por la cuenta.
   Corre con:  node tools/tests/panel-accion-principal.test.js   (desde la carpeta inglesconLeo)
   Usa el app.js, data.js y temas.js REALES en un navegador simulado. No toca la red. NO cambia limites, pagos ni motor adaptativo. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
let p = 0, f = 0;
function test(n, fn){ try { fn(); p++; console.log('  ok   ' + n); } catch(e){ f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }

const store = {};
const noop = () => {};
function mkEl(extra){
  let html = '';
  const el = Object.assign({ style:{}, dataset:{}, hidden:false, className:'', id:'',
    classList:{ _s:new Set(), add(c){ this._s.add(c); }, remove(c){ this._s.delete(c); }, toggle(c, on){ (on === undefined ? !this._s.has(c) : on) ? this._s.add(c) : this._s.delete(c); }, contains(c){ return this._s.has(c); } },
    setAttribute:noop, appendChild:noop, addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], closest:()=>null,
    set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }, extra || {});
  return el;
}
const els = {};
const ctx = {
  console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout:(fn)=>0, clearTimeout, URLSearchParams,
  localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; }, key:i=>Object.keys(store)[i] || null, get length(){ return Object.keys(store).length; } },
  document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:id=>els[id] || null, readyState:'complete', body: mkEl(), documentElement: mkEl(), createElement: ()=>mkEl() },
  location:{ hash:'', search:'', pathname:'/', reload:noop }, navigator:{ userAgent:'node' }, addEventListener:noop,
  MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
  matchMedia:()=>({ matches:false, addEventListener:noop })
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(read('data.js'), ctx);
vm.runInContext(read('temas.js'), ctx);
vm.runInContext(read('app.js') + `
;this.__t = { findResumableSession, pickDashHero, renderTodayHero, syncContinueWithHero, getUserLevel, saveProfile, getProfile, loadProgress, DASH_RESUME_MAX_AGE_MS };`, ctx);
const T = ctx.__t;
const NOW = Date.now(), H = 3600000;
const fakeStorage = o => ({ get length(){ return Object.keys(o).length; }, key:i=>Object.keys(o)[i] || null, getItem:k=> k in o ? JSON.stringify(o[k]) : null });
const sess = (idx, total, ageMs, extra) => Object.assign({ idx, total, startedAt: NOW - ageMs, results: [] }, extra || {});

test('Sesion a medias reciente del nivel actual: se ofrece, con respondidas y total', () => {
  const r = T.findResumableSession(fakeStorage({ leo_inflight_gramatica_medio: sess(3, 8, H) }), NOW, 'medio');
  assert.deepStrictEqual({ s:r.skill, d:r.done, t:r.total, l:r.level }, { s:'gramatica', d:3, t:8, l:'medio' });
});
test('Plan (pool) y sesiones con itemIds cuentan su total sin campo total', () => {
  assert.strictEqual(T.findResumableSession(fakeStorage({ leo_inflight_plan_facil: { idx:4, pool:new Array(15).fill(0), startedAt: NOW - H } }), NOW, 'facil').total, 15);
  assert.strictEqual(T.findResumableSession(fakeStorage({ leo_inflight_vocabulario_facil: { idx:1, itemIds:['a','b','c'], startedAt: NOW - H } }), NOW, 'facil').total, 3);
});
test('No se ofrece: otro nivel, sin respuestas, ya terminada, muy vieja, sin fecha, basura, ni comprobaciones/reto/skill-', () => {
  const o = {
    leo_inflight_gramatica_avanzado: sess(3, 8, H),                  // otro nivel: su pagina no la retomaria
    leo_inflight_vocabulario_facil: sess(0, 8, H),                   // sin respuestas
    leo_inflight_listening_facil: sess(8, 8, H),                     // terminada
    leo_inflight_writing_facil: sess(2, 4, 4 * 86400000),            // mas de 3 dias
    leo_inflight_speaking_facil: { idx:2, total:3 },                 // sin startedAt
    leo_inflight_mixto_facil: 'no es json',
    leo_inflight_check_micro1: sess(1, 3, H),                        // comprobacion de microtema
    'leo_inflight_reto-diario_facil': sess(2, 5, H),                 // el reto vive dentro del panel
    'leo_inflight_errores_skill-grammar': sess(2, 5, H),             // repaso por habilidad: no tiene enlace directo
    otra_clave: sess(2, 5, H)
  };
  assert.strictEqual(T.findResumableSession(fakeStorage(o), NOW, 'facil'), null);
});
test('Errores: solo repaso rapido y completo tienen enlace; se elige la sesion mas reciente', () => {
  const r = T.findResumableSession(fakeStorage({ leo_inflight_errores_rapido: sess(2, 5, 5 * H), leo_inflight_plan_facil: sess(2, 15, 2 * H), leo_inflight_gramatica_facil: sess(4, 8, 9 * H) }), NOW, 'facil');
  assert.strictEqual(r.skill, 'plan');
});
test('Un almacenamiento que falla no rompe el panel', () => {
  assert.strictEqual(T.findResumableSession({ get length(){ throw new Error('x'); }, key(){}, getItem(){} }, NOW, 'facil'), null);
});

const today = (href, title) => ({ title: title || 'Reforzar algo', reason:'Porque si.', href, cta:'Practicar', voice:'sigue-tema' });
test('Prioridad: sesion a medias > recomendacion del diagnostico > primera practica > tarjeta del Plan', () => {
  const resume = { skill:'gramatica', level:'facil', done:3, total:8, startedAt: NOW };
  assert.strictEqual(T.pickDashHero({ resume, today: today('plan-estudio.html'), hasHistory:true }).state, 'resume');
  assert.strictEqual(T.pickDashHero({ resume:null, today: today('plan-estudio.html'), hasHistory:true }).state, 'today');
  assert.strictEqual(T.pickDashHero({ resume:null, today:null, hasHistory:false }).state, 'first');
  assert.strictEqual(T.pickDashHero({ resume:null, today:null, hasHistory:true }), null);
});
test('Sesion a medias: texto con lo que falta y enlace que la retoma (Plan con empezar=1, habilidad a su pagina)', () => {
  const a = T.pickDashHero({ resume:{ skill:'plan', level:'facil', done:5, total:15, startedAt:NOW }, today:null, hasHistory:true });
  assert.strictEqual(a.href, 'plan-estudio.html?empezar=1'); assert(/Te faltan 10 ejercicios/.test(a.reason)); assert(/llevas 5 de 15/.test(a.title));
  const b = T.pickDashHero({ resume:{ skill:'vocabulario', level:'facil', done:7, total:8, startedAt:NOW }, today:null, hasHistory:true });
  assert.strictEqual(b.href, 'vocabulario.html'); assert(/Te falta 1 ejercicio/.test(b.reason));
  assert.strictEqual(T.pickDashHero({ resume:{ skill:'errores', level:'rapido', done:1, total:5, startedAt:NOW }, today:null, hasHistory:true }).href, 'errores.html?modo=rapido');
});
test('Errores pendientes: se presentan como refuerzo SOLO cuando el diagnostico ya los puso de primera', () => {
  const r = T.pickDashHero({ resume:null, today: today('errores.html?modo=rapido', 'Repasar tus errores'), hasHistory:true });
  assert.strictEqual(r.state, 'refuerzo'); assert.strictEqual(r.eyebrow, 'Refuerzo pendiente');
  assert.strictEqual(T.pickDashHero({ resume:null, today: today('plan-estudio.html?foco=x&tema=y'), hasHistory:true }).state, 'today');
});
test('Recomendacion normal: mismo texto y enlace que antes (Plan con empezar=1)', () => {
  const r = T.pickDashHero({ resume:null, today: today('plan-estudio.html?foco=a&tema=b'), hasHistory:true });
  assert.strictEqual(r.eyebrow, 'Hoy te conviene'); assert.strictEqual(r.cta, 'Empezar lo que me toca hoy →');
  assert.strictEqual(r.href, 'plan-estudio.html?foco=a&tema=b&empezar=1');
});
test('Primera practica: el Plan arranca directo (usa la ruta inicial que ya existe)', () => {
  const r = T.pickDashHero({ resume:null, today:null, hasHistory:false });
  assert.strictEqual(r.href, 'plan-estudio.html?empezar=1'); assert(/primera práctica/i.test(r.eyebrow));
});

// ---- Pintado real: cuenta nueva (sin sesiones) ----
function heroEnv(){
  const cc = mkEl({ id:'continueCard' }); const grid = mkEl(); cc.closest = () => grid;
  const link = { getAttribute: () => 'gramatica.html' }; cc.querySelector = sel => sel === 'a.btn' ? link : null;
  els.continueCard = cc; els.todayHero = mkEl({ id:'todayHero' });
  let painted = null; els.todayHero.replaceWith = c => { painted = c; };
  return { cc, grid, link, hero: els.todayHero, painted: () => painted };
}
test('Cuenta nueva (sin sesiones ni sesion a medias): la tarjeta principal invita a la primera practica y "Empieza aqui" se oculta', () => {
  const e = heroEnv();
  T.renderTodayHero(e.hero);
  const c = e.painted(); assert(c, 'se pinto la tarjeta');
  assert.strictEqual(c.dataset.heroState, 'first');
  assert(/Tu primera práctica/.test(c.innerHTML) && /plan-estudio\.html\?empezar=1/.test(c.innerHTML));
  assert.strictEqual(e.cc.hidden, true); assert(e.grid.classList.contains('no-continue'));
});
test('Con sesion a medias en otra pagina que "Continuar": ambas se ven; si coinciden, solo la principal', () => {
  const e = heroEnv();
  store['leo_inflight_gramatica_facil'] = JSON.stringify({ idx:3, total:8, startedAt: NOW - H });
  T.renderTodayHero(e.hero);
  assert.strictEqual(e.painted().dataset.heroState, 'resume');
  assert.strictEqual(e.cc.hidden, true, 'Continuar apunta a gramatica.html, igual que la accion principal: se oculta');
  e.link.getAttribute = () => 'vocabulario.html';
  T.syncContinueWithHero({ state:'resume', href:'gramatica.html' });
  assert.strictEqual(e.cc.hidden, false); assert(!e.grid.classList.contains('no-continue'));
  delete store['leo_inflight_gramatica_facil'];
});
test('El panel no pinta nada si falla el diagnostico o no hay almacenamiento (se queda la tarjeta del HTML)', () => {
  const e = heroEnv();
  const ls = ctx.localStorage; ctx.localStorage = { getItem(){ throw new Error('x'); }, setItem(){}, removeItem(){}, key(){ return null; }, length:0 };
  try { assert.doesNotThrow(() => T.renderTodayHero(e.hero)); } finally { ctx.localStorage = ls; }
});

// ---- Contratos de codigo ----
const app = read('app.js'), html = read('miembros.html'), css = read('style.css'), prac = read('practica.html');
test('Evento de medicion solo en Analytics (no esta en el mapa del Pixel de Meta)', () => {
  assert(/trackLeoEvent\('dash_hero_clicked', \{ hero_state: hero\.state \}\)/.test(app));
  const map = app.slice(app.indexOf('var META_PIXEL_EVENT_MAP'), app.indexOf('function fireMetaPixelEvent'));
  assert(!/dash_hero/.test(map));
});
test('Limites gratis, pagos y reglas del motor adaptativo siguen intactos', () => {
  assert(/var FREE_USER_DAILY_LIMIT = 10;/.test(app));
  assert(/var GUEST_EXERCISE_LIMIT = 5;/.test(app));
  assert(/LEVEL_SUGGEST/.test(app));
});
test('Panel: etiqueta "Otras formas de practicar hoy" antes de la fila secundaria y CSS para el hueco de Continuar', () => {
  assert(/<p class="dash-more-label">Otras formas de practicar hoy<\/p>\n\s*<div class="dash-top-grid">/.test(html));
  assert(/\.dash-top-grid\.no-continue\{grid-template-columns:1fr 1fr;\}/.test(css));
  assert(!/—/.test(app.slice(app.indexOf('const DASH_RESUME_SKILLS'), app.indexOf('SUGERENCIA DE NIVEL (solo Miembros'))), 'sin rayas largas en los textos nuevos');
});
test('Practica gratis: una cuenta con nivel elegido arranca en ese nivel; los invitados siguen en Facil', () => {
  const fp = app.slice(app.indexOf('function initFreePractice('), app.indexOf('function initMemberPractice('));
  assert(/let currentLevel = 'facil';\n\s*try\{ if\(_leoAccessTier === 'free' && getProfile\(\)\) currentLevel = getUserLevel\(\); \}catch\(e\)\{\}/.test(fp));
  assert(/return \{\s*syncLevel\(\)/.test(fp));
  assert(/const freePractice = initFreePractice\(/.test(prac) && /initOnboarding\(function\(\)\{ if\(freePractice && freePractice\.syncLevel\) freePractice\.syncLevel\(\); \}\)/.test(prac));
  assert(/if\(loggedInProfile\)\{\s*initOnboarding/.test(prac), 'el onboarding sigue siendo solo para cuentas');
});
test('Los scripts en linea de practica.html y miembros.html siguen siendo JavaScript valido', () => {
  for(const h of [prac, html]){
    const scripts = [...h.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert(scripts.length > 0);
    for(const s of scripts) new vm.Script(s);
  }
});
console.log(`\n${p} pass, ${f} fail`); process.exit(f ? 1 : 0);
