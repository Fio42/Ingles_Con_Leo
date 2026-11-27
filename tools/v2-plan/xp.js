#!/usr/bin/env node
/* P5 · Experiencia (XP) y niveles: modelo LOCAL para simular. No está conectado a la app ni a la base de datos.
   Reglas propuestas:
   - XP por respuesta correcta 10, por intento fallido 2 (premia el esfuerzo, no adivinar rápido).
   - Sesión terminada +20; sesión perfecta +10 extra; lección de Academia completada +30.
   - Reto diario +50; reto semanal +200 (P6). Nada de cofres, monedas ni premios al azar.
   - Anti-trampa: el mismo ejercicio solo da XP 2 veces por día; respuestas de menos de 2 s no dan XP;
     el servidor recalcula el XP a partir de las sesiones guardadas (el navegador nunca envía "XP").
   - Niveles sin tope: pasar del nivel n al n+1 cuesta 100 + 40·(n-1) XP (cada nivel pide un poco más). */
const XP = { correcta: 10, fallida: 2, sesion: 20, perfecta: 10, leccion: 30, retoDiario: 50, retoSemanal: 200, repeticionesPorDia: 2, minMs: 2000 };

function costoNivel(n) { return 100 + 40 * (n - 1); }               // XP para subir de n a n+1
function xpAcumulado(n) { return (n - 1) * 100 + 20 * (n - 1) * (n - 2); } // XP total para llegar al nivel n
function nivelDe(xp) {
  // inverso exacto de xpAcumulado, sin tope
  let n = Math.max(1, Math.floor((-60 + Math.sqrt(3600 + 80 * (xp + 0))) / 40) + 1);
  while (xpAcumulado(n + 1) <= xp) n++;
  while (n > 1 && xpAcumulado(n) > xp) n--;
  return { nivel: n, enNivel: xp - xpAcumulado(n), paraSubir: costoNivel(n) };
}

/* XP de una sesión, calculado como lo haría el servidor.
   respuestas: [{ item, ok, ms }], vistosHoy: { item: veces } (se actualiza) */
function xpSesion(respuestas, vistosHoy, extras) {
  let xp = 0, validas = 0;
  respuestas.forEach(r => {
    const veces = vistosHoy[r.item] || 0;
    vistosHoy[r.item] = veces + 1;
    if (veces >= XP.repeticionesPorDia || r.ms < XP.minMs) return;
    validas++; xp += r.ok ? XP.correcta : XP.fallida;
  });
  if (validas >= 5) { xp += XP.sesion; if (respuestas.every(r => r.ok)) xp += XP.perfecta; }
  extras = extras || {};
  if (extras.leccion) xp += XP.leccion;
  if (extras.retoDiario) xp += XP.retoDiario;
  if (extras.retoSemanal) xp += XP.retoSemanal;
  return xp;
}

// Simulación de tres perfiles de alumno durante un año (aleatorio con semilla fija, reproducible)
function simular(perfil, dias, semilla) {
  let s = semilla || 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let xp = 0, item = 0; const hitos = {};
  for (let d = 1; d <= dias; d++) {
    if (rnd() < perfil.probDia) {
      const vistos = {};
      for (let k = 0; k < perfil.sesiones; k++) {
        const resp = Array.from({ length: 10 }, () => ({ item: 'i' + (item++ % 5000), ok: rnd() < perfil.acierto, ms: 4000 }));
        xp += xpSesion(resp, vistos, { retoDiario: k === 0 && rnd() < perfil.retos, leccion: rnd() < 0.3 });
      }
      if (d % 7 === 0 && rnd() < perfil.retos) xp += XP.retoSemanal;
    }
    if ([7, 30, 90, 180, 365].includes(d)) hitos[d] = nivelDe(xp).nivel;
  }
  return { xp, nivel: nivelDe(xp).nivel, hitos };
}
const PERFILES = {
  ocasional: { probDia: 0.35, sesiones: 1, acierto: 0.65, retos: 0.3 },
  constante: { probDia: 0.75, sesiones: 2, acierto: 0.75, retos: 0.7 },
  intensivo: { probDia: 0.95, sesiones: 5, acierto: 0.85, retos: 0.95 }
};
/* Rangos (PROPUESTA, pendiente de aprobación de Leo): un nombre cada 10 niveles. */
const RANGOS_PROPUESTOS = ['Explorador', 'Aprendiz', 'Constante', 'Conversador', 'Avanzado', 'Experto', 'Maestro'];

if (require.main === module) {
  console.log('Nivel → XP acumulado:', [2, 5, 10, 20, 30, 50, 100].map(n => n + ':' + xpAcumulado(n)).join('  '));
  for (const [k, p] of Object.entries(PERFILES)) { const r = simular(p, 365, 11); console.log(k.padEnd(10), 'XP año', r.xp, '· nivel por día', JSON.stringify(r.hitos)); }
}
module.exports = { XP, costoNivel, xpAcumulado, nivelDe, xpSesion, simular, PERFILES, RANGOS_PROPUESTOS };
