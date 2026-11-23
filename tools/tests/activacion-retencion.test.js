#!/usr/bin/env node
/* PRUEBA de activacion y retencion (jsdom; si falta jsdom se omite): first_practice_started para visitantes, practice_return_* por tramo de dias,
   sin datos personales, una vez por dia, y el boton "Empezar ahora" de practica.html (solo con ejercicio gratis disponible y sin tema/nivel pedido). */
'use strict';
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('activacion-retencion: OMITIDA (falta jsdom: npm i jsdom)'); process.exit(0); }
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let ok = 0; const fails = []; const t = (n, f) => { try{ f(); ok++; }catch(e){ fails.push(n + ': ' + e.message); } };

function page(){
  const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://inglesconleo.com/practica.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; w.HTMLElement.prototype.scrollIntoView = function(){}; w.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} });
  w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; }; w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){} }; };
  const ctx = dom.getInternalVMContext(); w.run = c => new vm.Script(c).runInContext(ctx);
  ['data.js', 'temas.js', 'app.js'].forEach(f => w.run(read(f)));
  w.run("var __ev = []; window.gtag = function(){ __ev.push([].slice.call(arguments).slice(1)); };");
  return w;
}
const dayStr = back => { const d = new Date(); d.setDate(d.getDate() - back); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const ev = w => JSON.parse(w.run('JSON.stringify(__ev)'));

t('visitante: el primer ejercicio manda first_practice_started { tier:guest } una sola vez', () => {
  const w = page(); w.run("_leoAccessTier = 'guest'; trackPracticeActivation(); trackPracticeActivation();");
  const e = ev(w).filter(x => x[0] === 'first_practice_started'); assert.strictEqual(e.length, 1); assert.deepStrictEqual(e[0][1], { tier: 'guest' });
  assert.strictEqual(w.localStorage.getItem('leo_first_practice_day'), dayStr(0));
  assert.strictEqual(ev(w).filter(x => /practice_return/.test(x[0])).length, 0, 'el mismo dia no es un regreso');
});
[[1, 'practice_return_d1'], [2, 'practice_return_d2_3'], [3, 'practice_return_d2_3'], [4, 'practice_return_d4_7'], [7, 'practice_return_d4_7'], [8, 'practice_return_d8_plus'], [30, 'practice_return_d8_plus']].forEach(([back, name]) => {
  t('regreso a los ' + back + ' dias -> ' + name + ' (una sola vez)', () => {
    const w = page(); w.localStorage.setItem('leo_first_practice_day', dayStr(back)); w.run("_leoAccessTier = 'guest'; trackPracticeActivation(); trackPracticeActivation(); trackPracticeActivation();");
    const e = ev(w).filter(x => /practice_return|first_practice/.test(x[0])); assert.strictEqual(e.length, 1, JSON.stringify(e)); assert.strictEqual(e[0][0], name);
  });
});
t('solo el PRIMER regreso cuenta: volver otro dia no manda otro tramo (los tramos no se solapan, d1+d2_3+d4_7 = volvio en 7 dias sin duplicar)', () => {
  const w = page(); w.localStorage.setItem('leo_first_practice_day', dayStr(5)); w.localStorage.setItem('leo_first_return_day', dayStr(2));   // ya regreso hace 2 dias
  w.run("_leoAccessTier = 'guest'; trackPracticeActivation();"); assert.strictEqual(ev(w).length, 0);
  const w2 = page(); w2.localStorage.setItem('leo_first_practice_day', dayStr(10)); w2.run("_leoAccessTier = 'guest'; trackPracticeActivation();");
  assert.deepStrictEqual(ev(w2).map(x => x[0]), ['practice_return_d8_plus']);   // su primer regreso fue tarde: nunca cuenta como retencion a 7 dias
});
t('abrir o pintar paginas NO cuenta como volver: ni la practica, ni el aviso de limite, ni consultar el limite', () => {
  const w = page(); w.localStorage.setItem('leo_first_practice_day', dayStr(3)); w.run("_leoAccessTier = 'guest'; freeDailyLimitReached(); renderFreeDailyLimitReachedBlock();");
  assert.strictEqual(ev(w).filter(x => /practice_return|first_practice/.test(x[0])).length, 0, JSON.stringify(ev(w)));
  const app = read('app.js'); assert.strictEqual((app.match(/trackPracticeActivation()/g) || []).length, 2, 'solo la definicion y bumpFreeDailyExerciseCount');
});
t('primera practica COMPLETADA del visitante: first_session_completed { tier:guest } una vez, solo si ya conto un ejercicio', () => {
  const w = page(); w.run("_leoAccessTier = 'guest'; freeSessionEnd('gramatica');"); assert.strictEqual(ev(w).length, 0, 'sin ejercicio contado no hay sesion');
  w.run("trackPracticeActivation(); freeSessionEnd('gramatica'); freeSessionEnd('gramatica'); freeSessionEnd();");
  const e = ev(w); assert.deepStrictEqual(e.map(x => x[0]), ['first_practice_started', 'first_session_completed']); assert.deepStrictEqual(e[1][1], { tier: 'guest' });
});
t('el limite de 3 del visitante tambien cierra su primera sesion: first_session_completed guest una vez, y sin ejercicio contado no', () => {
  const w = page(); w.run("_leoAccessTier = 'guest'; renderFreeDailyLimitReachedBlock();");
  assert.strictEqual(ev(w).filter(x => x[0] === 'first_session_completed').length, 0, 'sin ejercicio contado no hay sesion');
  w.run("trackPracticeActivation(); renderFreeDailyLimitReachedBlock(); renderFreeDailyLimitReachedBlock();");
  assert.strictEqual(ev(w).filter(x => x[0] === 'first_session_completed').length, 1); assert.strictEqual(ev(w).filter(x => x[0] === 'first_practice_started').length, 1);
});
t('cuenta gratis: no repite first_practice_started (ese ya lo manda la cuenta) y el regreso lleva tier free', () => {
  const w = page(); w.localStorage.setItem('leo_first_practice_day', dayStr(2)); w.run("_leoAccessTier = 'free'; trackPracticeActivation();");
  const e = ev(w); assert.strictEqual(e.filter(x => x[0] === 'first_practice_started').length, 0); assert.deepStrictEqual(e.filter(x => /practice_return/.test(x[0]))[0], ['practice_return_d2_3', { tier: 'free' }]);
  const w2 = page(); w2.run("_leoAccessTier = 'free'; trackPracticeActivation();"); assert.strictEqual(ev(w2).filter(x => x[0] === 'first_practice_started').length, 0);
});
t('sin datos personales: los eventos solo llevan tier y el almacenamiento solo fechas', () => {
  const w = page(); w.localStorage.setItem('leo_first_practice_day', dayStr(5)); w.run("_leoAccessTier = 'guest'; trackPracticeActivation();");
  ev(w).forEach(x => assert.deepStrictEqual(Object.keys(x[1] || {}), ['tier']));
  ['leo_first_practice_day', 'leo_first_return_day'].forEach(k => assert(/^\d{4}-\d{2}-\d{2}$/.test(w.localStorage.getItem(k)), k));
});
t('un dia sin fecha valida o futura no rompe ni manda eventos raros', () => {
  const w = page(); w.localStorage.setItem('leo_first_practice_day', 'basura'); assert.doesNotThrow(() => w.run("_leoAccessTier = 'guest'; trackPracticeActivation();")); assert.strictEqual(ev(w).length, 0);
  const w2 = page(); w2.localStorage.setItem('leo_first_practice_day', dayStr(-3)); w2.run("_leoAccessTier = 'guest'; trackPracticeActivation();"); assert.strictEqual(ev(w2).length, 0);
});
t('se cuenta en el unico punto de conteo (bumpFreeDailyExerciseCount) y no cambia el limite 3/6', () => {
  const app = read('app.js'); assert(/function bumpFreeDailyExerciseCount\(\)\{\s*trackPracticeActivation\(\);/.test(app));
  assert(/var GUEST_EXERCISE_LIMIT = 3;/.test(app) && /var FREE_USER_DAILY_LIMIT = 6;/.test(app));
});
t('boton "Empezar ahora": solo sin tema/nivel pedido y con ejercicios gratis disponibles; un evento nuevo', () => {
  const app = read('app.js'); const i = app.indexOf('quickStartBox'); assert(i > 0); const blk = app.slice(i - 500, i + 1800);
  assert(/!sp\.get\('tema'\)/.test(blk) && /LEVELS\.includes\(sp\.get\('level'\)\)/.test(blk) && /!freeDailyLimitReached\(\)/.test(blk));
  assert.strictEqual((app.match(/practice_quick_start_clicked/g) || []).length, 1);
});
if(fails.length){ console.error('FALLA activacion-retencion (' + fails.length + '):\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('activacion-retencion: ' + ok + ' comprobaciones correctas');
