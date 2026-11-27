#!/usr/bin/env node
// Modelo de costos de Riso (capa 5). Precios verificados el 27 nov 2026 en la documentación oficial:
//  - Cloudflare Workers AI: US$0.011 por 1.000 neuronas; 10.000 neuronas gratis por día (por cuenta).
//    @cf/google/gemma-4-26b-a4b-it: US$0.100 por millón de tokens de entrada, US$0.300 por millón de salida.
//  - Gemini 3.1 Flash-Lite (plan pago, como respaldo): US$0.25 por millón de entrada, US$1.50 por millón de salida.
// Supuestos (NO medidos todavía, se reemplazan con datos reales tras el piloto):
//  - tokens por respuesta generativa: 600 de entrada (instrucciones + historial corto + pregunta) y 180 de salida.
//  - preguntas por miembro al mes: base 40, alta 120.
//  - en el sistema por capas, la capa 5 resuelve el 45 % (base) o el 60 % (pesimista); el resto lo resuelven las capas 1 a 3 gratis.
// Uso: node tools/tutor/costos.js
const P = { gemmaIn: 0.10 / 1e6, gemmaOut: 0.30 / 1e6, flashIn: 0.25 / 1e6, flashOut: 1.50 / 1e6, neuronasGratisMes: 10000 * 30, usdPorNeurona: 0.011 / 1000 };
const TOK = { in: 600, out: 180 };
const porLlamada = { gemma: TOK.in * P.gemmaIn + TOK.out * P.gemmaOut, flash: TOK.in * P.flashIn + TOK.out * P.flashOut };
const neuronasLlamada = porLlamada.gemma / P.usdPorNeurona;
function costoMes(miembros, preguntas, fraccionGen, modelo) {
  const llamadas = miembros * preguntas * fraccionGen;
  if (modelo === 'gemma') {
    const neur = llamadas * neuronasLlamada;
    return { llamadas, usd: Math.max(0, neur - P.neuronasGratisMes) * P.usdPorNeurona };
  }
  return { llamadas, usd: llamadas * porLlamada.flash };
}
const filas = [];
for (const m of [100, 1000, 10000, 100000, 1000000]) {
  for (const [esc, q] of [['base', 40], ['alta', 120]]) {
    const hib = costoMes(m, q, 0.45, 'gemma'), hibP = costoMes(m, q, 0.60, 'gemma'), todo = costoMes(m, q, 1, 'gemma'), todoF = costoMes(m, q, 1, 'flash');
    filas.push({ miembros: m, escenario: esc, preguntas_mes: m * q, llamadas_hibrido: Math.round(hib.llamadas),
      hibrido_usd: +hib.usd.toFixed(2), hibrido_pesimista_usd: +hibP.usd.toFixed(2), todo_generativo_usd: +todo.usd.toFixed(2), todo_generativo_flash_usd: +todoF.usd.toFixed(2),
      hibrido_usd_por_miembro: +(hib.usd / m).toFixed(4) });
  }
}
if (require.main === module) {
  console.log('Costo por respuesta generativa: Gemma 4 US$' + porLlamada.gemma.toFixed(6) + ' (' + neuronasLlamada.toFixed(1) + ' neuronas), Flash-Lite US$' + porLlamada.flash.toFixed(6));
  console.log('Respuestas gratis al día con Gemma 4 (10.000 neuronas): ~' + Math.floor(10000 / neuronasLlamada));
  console.table(filas);
}
module.exports = { filas, porLlamada, neuronasLlamada };
