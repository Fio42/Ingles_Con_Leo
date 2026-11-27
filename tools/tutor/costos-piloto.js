#!/usr/bin/env node
// Riso + Leo AI dentro de las 10.000 neuronas gratis diarias de Cloudflare: ¿hasta cuántos miembros alcanza con costo cero?
// Datos REALES (lectura agregada de ai_usage_daily, 27 nov 2026, sin datos de alumnos):
//   - Leo AI hoy: 25 miembros, promedio 73,3 neuronas al día en 30 días, máximo 719 (4 nov). Una explicación real
//     usa ~1.000 tokens de entrada y ~85 de salida = ~11,5 neuronas.
// Supuestos (se reemplazan con datos del piloto):
//   - Riso por respuesta generativa: 12 neuronas (instrucciones + historial corto + pregunta; salida máx. 220 tokens).
//   - Leo AI escala igual que hoy por miembro: 73,3 / 25 = 2,9 neuronas por miembro al día (incluye la prueba gratis).
//   - Miembro: 40 preguntas a Riso al mes, 45 % generativas (base) o 60 % (pesimista).
//   - Cuentas gratis activas al día = miembros × factor (hoy hay 268 perfiles y 25 miembros); usan 0,2 preguntas
//     generativas al día de promedio (tope 3).
// Uso: node tools/tutor/costos-piloto.js
const GRATIS_DIA = 10000, USD_NEURONA = 0.011 / 1000;
const RISO_N = 12, LEOAI_POR_MIEMBRO = 73.3 / 25;
function dia(miembros, o) {
  const genMiembro = 40 * o.fraccion / 30;               // respuestas generativas por miembro al día
  const leo = miembros * LEOAI_POR_MIEMBRO;
  const riso = miembros * genMiembro * RISO_N + miembros * o.gratisPorMiembro * 0.2 * RISO_N;
  return { leo, riso, total: leo + riso };
}
const ESC = { base: { fraccion: 0.45, gratisPorMiembro: 1 }, pesimista: { fraccion: 0.60, gratisPorMiembro: 3 } };
const filas = [];
for (const m of [25, 100, 300, 500, 700, 1000, 10000, 100000, 1000000]) {
  for (const [k, o] of Object.entries(ESC)) {
    const d = dia(m, o), exceso = Math.max(0, d.total - GRATIS_DIA);
    filas.push({ miembros: m, escenario: k, leo_ai_neuronas_dia: Math.round(d.leo), riso_neuronas_dia: Math.round(d.riso),
      pct_del_gratis: Math.round(d.total / GRATIS_DIA * 100), costo_extra_usd_mes: +(exceso * 30 * USD_NEURONA).toFixed(2) });
  }
}
function maxCero(o, techo) { let m = 1; while (dia(m + 1, o).total <= techo) m++; return m; }
if (require.main === module) {
  console.log('Piloto: 100 respuestas × 12 neuronas = ' + 100 * RISO_N + ' neuronas en total (' + (100 * RISO_N / GRATIS_DIA * 100).toFixed(0) + ' % de UN día gratis).');
  console.log('Máximo de miembros con costo cero manteniendo el 90 % del gratis: base ' + maxCero(ESC.base, 9000) + ', pesimista ' + maxCero(ESC.pesimista, 9000));
  console.log('Con el techo de Riso del 60 % (Riso + Leo AI ≤ 6.000): base ' + maxCero(ESC.base, 6000) + ', pesimista ' + maxCero(ESC.pesimista, 6000));
  console.table(filas);
}
module.exports = { filas, dia, maxCero, ESC };
