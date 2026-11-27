/* P5: modelo local de XP (tools/v2-plan/xp.js). Uso: node tools/tests/xp-modelo.test.js */
const assert = require('assert'), path = require('path');
const X = require(path.join(__dirname, '..', 'v2-plan', 'xp.js'));
let p = 0, f = 0; function test(n, fn) { try { fn(); p++; console.log('  ok   ' + n); } catch (e) { f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }
test('niveles sin tope y crecientes', () => { let prev = 0; for (let n = 1; n < 2000; n++) { const c = X.costoNivel(n); assert.ok(c > prev); prev = c; } assert.ok(X.nivelDe(1e9).nivel > 1000); });
test('nivelDe es el inverso exacto de xpAcumulado', () => { for (let v = 0; v < 300000; v += 13) { const r = X.nivelDe(v); assert.ok(X.xpAcumulado(r.nivel) <= v && X.xpAcumulado(r.nivel + 1) > v, String(v)); } });
test('el mismo ejercicio solo da XP 2 veces por día', () => { const v = {}; const r = [1, 2, 3].map(() => ({ item: 'a', ok: true, ms: 5000 })); assert.strictEqual(X.xpSesion(r, v), 20); });
test('respuestas demasiado rápidas no dan XP', () => { assert.strictEqual(X.xpSesion([{ item: 'b', ok: true, ms: 500 }], {}), 0); });
test('fallar también suma un poco (esfuerzo)', () => { assert.strictEqual(X.xpSesion([{ item: 'c', ok: false, ms: 5000 }], {}), 2); });
test('sesión de 10 perfecta: 100 + 20 + 10', () => { const r = Array.from({ length: 10 }, (_, i) => ({ item: 'x' + i, ok: true, ms: 4000 })); assert.strictEqual(X.xpSesion(r, {}), 130); });
test('un alumno ocasional sube de nivel en su primera semana', () => { assert.ok(X.simular(X.PERFILES.ocasional, 7, 11).nivel >= 2); });
console.log('\n' + p + ' ok, ' + f + ' fallos'); process.exit(f ? 1 : 0);
