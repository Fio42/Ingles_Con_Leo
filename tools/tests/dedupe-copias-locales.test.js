#!/usr/bin/env node
/* Copias locales duplicadas de antes de C23 (visto en producción el 27-nov: sesiones que aparecían dos veces en el
   navegador, una sin cloudId y otra con su fila de la nube). dedupeProgressSessions() debe quitar SOLO la copia
   local sin cloudId que es idéntica a una fila de la nube, y nunca filas de la nube, sesiones legítimas parecidas
   ni sesiones pendientes de subir.
   Corre con: node tools/tests/dedupe-copias-locales.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const app = fs.readFileSync(path.join(__dirname, '..', '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const grab = name => { const i = app.indexOf('function ' + name + '('); let d = 0; const j = app.indexOf('{', i); for(let k = j; k < app.length; k++){ if(app[k] === '{') d++; else if(app[k] === '}' && --d === 0) return app.slice(i, k + 1); } };
const dedupe = new Function(grab('progressSessionIdentity') + '\n' + grab('dedupeProgressSessions') + '\nreturn dedupeProgressSessions;')();
let p = 0, f = 0;
function test(n, fn){ try{ fn(); p++; console.log('  ok  ', n); }catch(e){ f++; console.log('  FAIL', n, '\n   ', e.message); } }
const res = [{ itemId: 'a', isCorrect: true, topic: 't' }];
const resCloud = [{ topic: 't', isCorrect: true, itemId: 'a' }];   // mismas claves y valores, otro orden (jsonb)

test('quita la copia local sin cloudId idéntica a una fila de la nube', () => {
  const prog = { sessions: [
    { skill: 'errores', level: 'todos', topics: ['x'], startedAt: 100, durationMs: 5, results: res, date: 'd' },
    { cloudId: 941, skill: 'errores', level: 'todos', topics: ['x'], startedAt: 100, durationMs: 5, results: resCloud, date: 'd' } ] };
  assert.strictEqual(dedupe(prog), true);
  assert.deepStrictEqual(prog.sessions.map(s => s.cloudId), [941]);
});
test('no toca dos filas de la nube aunque sean iguales', () => {
  const prog = { sessions: [
    { cloudId: 1, skill: 'gramatica', startedAt: 100, durationMs: 5, results: res },
    { cloudId: 2, skill: 'gramatica', startedAt: 100, durationMs: 5, results: resCloud } ] };
  dedupe(prog); assert.strictEqual(prog.sessions.length, 2);
});
test('conserva sesiones legítimas del mismo tema y con resultados idénticos (otro inicio)', () => {
  const prog = { sessions: [
    { skill: 'gramatica', level: 'facil', topics: ['x'], startedAt: 300, durationMs: 5, results: res },
    { skill: 'gramatica', level: 'facil', topics: ['x'], startedAt: 400, durationMs: 5, results: res },
    { cloudId: 7, skill: 'gramatica', level: 'facil', topics: ['x'], startedAt: 300, durationMs: 5, results: resCloud } ] };
  dedupe(prog); assert.deepStrictEqual(prog.sessions.map(s => s.startedAt + ':' + (s.cloudId || '-')), ['300:7', '400:-']);
});
test('mismo inicio pero distinta duración, nivel, temas o resultados: no se toca', () => {
  const otro = [{ itemId: 'a', isCorrect: false, topic: 't' }];
  const base = { skill: 'errores', level: 'todos', topics: ['x'], startedAt: 500, durationMs: 5, results: res };
  [{ durationMs: 6 }, { level: 'facil' }, { topics: ['y'] }, { results: otro }].forEach(cambio => {
    const prog = { sessions: [Object.assign({}, base, cambio), Object.assign({}, base, { cloudId: 8, results: resCloud })] };
    dedupe(prog); assert.strictEqual(prog.sessions.length, 2, JSON.stringify(cambio));
  });
});
test('una sesión pendiente de subir (sin gemela en la nube) se conserva', () => {
  const prog = { sessions: [
    { cloudId: 1, skill: 'vocabulario', startedAt: 600, durationMs: 9, results: resCloud },
    { skill: 'vocabulario', startedAt: 700, durationMs: 9, results: res } ] };
  assert.strictEqual(dedupe(prog), false); assert.strictEqual(prog.sessions.length, 2);
});
console.log(`\n${p} pass, ${f} fail`); process.exit(f ? 1 : 0);
