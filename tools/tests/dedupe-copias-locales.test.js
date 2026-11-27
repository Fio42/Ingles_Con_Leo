#!/usr/bin/env node
/* Copias locales duplicadas de antes de C23 (visto en producción el 27-nov: cada sesión de "errores" aparecía dos
   veces en el navegador, una sin cloudId y otra con su fila de la nube). dedupeProgressSessions() debe quitar SOLO
   la copia local sin cloudId que tiene gemela en la nube, y nunca dos filas de la nube ni sesiones distintas.
   Corre con: node tools/tests/dedupe-copias-locales.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const app = fs.readFileSync(path.join(__dirname, '..', '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const grab = name => { const i = app.indexOf('function ' + name + '('); let d = 0, j = app.indexOf('{', i); for(let k = j; k < app.length; k++){ if(app[k] === '{') d++; else if(app[k] === '}' && --d === 0) return app.slice(i, k + 1); } };
const dedupe = new Function(grab('progressSessionIdentity') + '\n' + grab('dedupeProgressSessions') + '\nreturn dedupeProgressSessions;')();
let p = 0, f = 0;
const test = (n, fn) => { try{ fn(); p++; console.log('  ok  ', n); }catch(e){ f++; console.log('  FAIL', n, '\n   ', e.message); } };
const res = [{ itemId: 'a', isCorrect: true, topic: 't' }];
const resCloud = [{ topic: 't', isCorrect: true, itemId: 'a' }];   // mismas claves, otro orden (jsonb)
test('quita la copia local sin cloudId que tiene gemela de la nube', () => {
  const prog = { sessions: [
    { skill: 'errores', level: 'todos', startedAt: 100, durationMs: 5, results: res, date: 'd' },
    { cloudId: 941, skill: 'errores', level: 'todos', startedAt: 100, durationMs: 5, results: resCloud, date: 'd' } ] };
  assert.strictEqual(dedupe(prog), true);
  assert.deepStrictEqual(prog.sessions.map(s => s.cloudId), [941]);
});
test('no toca dos filas de la nube aunque se parezcan', () => {
  const prog = { sessions: [
    { cloudId: 1, skill: 'gramatica', startedAt: 100, durationMs: 5, results: res },
    { cloudId: 2, skill: 'gramatica', startedAt: 100, durationMs: 5, results: resCloud } ] };
  dedupe(prog); assert.strictEqual(prog.sessions.length, 2);
});
test('no toca una sesión local distinta (otro inicio o otra duración)', () => {
  const prog = { sessions: [
    { skill: 'errores', startedAt: 101, durationMs: 5, results: res },
    { skill: 'errores', startedAt: 100, durationMs: 6, results: res },
    { cloudId: 9, skill: 'errores', startedAt: 100, durationMs: 5, results: resCloud } ] };
  dedupe(prog); assert.strictEqual(prog.sessions.length, 3);
});
test('una sesión local recién guardada (sin copia de la nube todavía) se queda', () => {
  const prog = { sessions: [{ skill: 'vocabulario', startedAt: 200, durationMs: 9, results: res }] };
  assert.strictEqual(dedupe(prog), false); assert.strictEqual(prog.sessions.length, 1);
});
console.log(`\n${p} pass, ${f} fail`); process.exit(f ? 1 : 0);
