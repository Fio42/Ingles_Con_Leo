/* P5: modelo local de XP v2 (tools/v2-plan/xp.js). Uso: node tools/tests/xp-modelo.test.js */
const assert = require('assert'), path = require('path');
const X = require(path.join(__dirname, '..', 'v2-plan', 'xp.js'));
let p = 0, f = 0; function test(n, fn) { try { fn(); p++; console.log('  ok   ' + n); } catch (e) { f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }
const R = (item, ok, extra) => Object.assign({ item, ok, ms: 4000, opcion: Math.random() * 3 | 0 }, extra || {});
test('niveles sin tope y cada vez más largos', () => { let prev = 0; for (let n = 1; n < 2000; n++) { const c = X.costoNivel(n); assert.ok(c > prev); prev = c; } assert.ok(X.nivelDe(1e9).nivel > 1000); });
test('nivelDe es el inverso exacto de xpAcumulado', () => { for (let v = 0; v < 300000; v += 13) { const r = X.nivelDe(v); assert.ok(X.xpAcumulado(r.nivel) <= v && X.xpAcumulado(r.nivel + 1) > v, String(v)); } });
test('rangos de fuego y ninguno con nombre de dominio del idioma', () => {
  assert.deepStrictEqual(X.RANGOS.map(r => r[1]), ['Chispa', 'Brasa', 'Llama', 'Fuego', 'Hoguera', 'Fuego eterno']);
  assert.strictEqual(X.rangoDe(1), 'Chispa'); assert.strictEqual(X.rangoDe(500), 'Fuego eterno');
  X.RANGOS.forEach(([, n]) => assert.ok(!/avanzado|experto|maestro|conversador|b1|b2|c1/i.test(n)));
});
test('respuesta incorrecta: 0 XP, sin penalización', () => { assert.strictEqual(X.xpSesion([R('a', false)], { id: 1, dia: 1 }, X.estadoNuevo()).xp, 0); });
test('sesión de 10 perfecta: 100 + 20 + 10', () => { const r = Array.from({ length: 10 }, (_, i) => R('x' + i, true)); assert.strictEqual(X.xpSesion(r, { id: 1, dia: 1 }, X.estadoNuevo()).xp, 130); });
test('repetir el mismo ejercicio fácil solo da XP 2 veces al día', () => { const e = X.estadoNuevo(); assert.strictEqual(X.xpSesion([R('a', true), R('a', true), R('a', true)], { id: 1, dia: 1 }, e).xp, 20); });
test('fallar a propósito y corregir en la MISMA sesión no da «error recuperado»', () => { const e = X.estadoNuevo(); assert.strictEqual(X.xpSesion([R('a', false), R('a', true)], { id: 1, dia: 1 }, e).detalle.recuperados, 0); });
test('error recuperado en otra sesión: +15, y no otra vez en 7 días', () => {
  const e = X.estadoNuevo(); X.xpSesion([R('a', false)], { id: 1, dia: 1 }, e);
  assert.strictEqual(X.xpSesion([R('a', true)], { id: 2, dia: 2 }, e).detalle.recuperados, 1);
  e.vistosHoy = {}; e.fallos.a = { sesion: 3, dia: 3 };
  assert.strictEqual(X.xpSesion([R('a', true)], { id: 4, dia: 4 }, e).detalle.recuperados, 0);
});
test('error dominado una sola vez en la vida', () => {
  const e = X.estadoNuevo(); X.xpSesion([R('a', false)], { id: 1, dia: 1 }, e);
  assert.strictEqual(X.xpSesion([R('a', true, { aciertosSeguidos: 3 })], { id: 2, dia: 9 }, e).detalle.dominados, 1);
  e.fallos.a = { sesion: 3, dia: 20 }; e.vistosHoy = {};
  assert.strictEqual(X.xpSesion([R('a', true, { aciertosSeguidos: 3 })], { id: 4, dia: 30 }, e).detalle.dominados, 0);
});
test('recompensas con clave única: lección, curso y retos no se reclaman dos veces', () => {
  const e = X.estadoNuevo(), s = { id: 1, dia: 1, leccion: 'l1', curso: 'c1', retoDiario: true, retoSemanal: true };
  const a = X.xpSesion([], s, e).xp, b = X.xpSesion([], Object.assign({}, s, { id: 2 }), e).xp;
  assert.strictEqual(a, 30 + 100 + 50 + 200); assert.strictEqual(b, 0);
});
test('responder rápido y bien NO se castiga', () => { const r = Array.from({ length: 10 }, (_, i) => R('q' + i, true, { ms: 800 })); assert.strictEqual(X.xpSesion(r, { id: 1, dia: 1 }, X.estadoNuevo()).xp, 130); });
test('rápido + acierto bajo + misma opción: se retiene solo el bono de sesión', () => {
  const r = Array.from({ length: 10 }, (_, i) => ({ item: 'z' + i, ok: i < 2, ms: 600, opcion: 0 }));
  assert.ok(X.sospechosa(r)); assert.strictEqual(X.xpSesion(r, { id: 1, dia: 1 }, X.estadoNuevo()).xp, 20);
});
test('un alumno ocasional sube de nivel en su primera semana', () => { assert.ok(X.simular(X.PERFILES.ocasional, 7, 11).nivel >= 2); });
console.log('\n' + p + ' ok, ' + f + ' fallos'); process.exit(f ? 1 : 0);
