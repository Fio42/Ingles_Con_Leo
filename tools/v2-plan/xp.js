#!/usr/bin/env node
/* P5 · Experiencia (XP) y niveles de experiencia: modelo LOCAL para simular (versión 2, 27 nov 2026).
   No está conectado a la app ni a la base de datos. El nivel de experiencia NO es el nivel de inglés.
   Recompensas (punto de partida pedido por Leo, pendiente de aprobación tras esta simulación):
     acierto válido 10 · respuesta incorrecta 0 (sin penalización) · sesión terminada 20 · sesión perfecta +10 ·
     lección 30 · error recuperado 15 · error dominado 25 · curso aprobado 100 · reto diario 50 · reto semanal 200.
   Anti-abuso con señales combinadas (no hay regla absoluta de tiempo):
     - Un mismo ejercicio da XP de acierto como máximo 2 veces al día (repetir lo fácil no rinde).
     - «Error recuperado» solo si el fallo fue en una sesión ANTERIOR (no en la misma) y una vez por ejercicio cada 7 días;
       «error dominado» una sola vez por ejercicio en toda la vida. Fallar a propósito no rinde.
     - Recompensas de sesión, lección, curso y retos con clave única: reclamarlas dos veces no suma.
     - Sesión «sospechosa» solo si coinciden VARIAS señales: casi todo respondido en menos de 1,5 s Y acierto bajo
       (< 40 %) Y respuestas repetidas en patrón (misma opción). Entonces se retiene el bono de sesión; los aciertos
       válidos se mantienen. Quien responde rápido y bien no pierde nada.
     - El servidor recalcula el XP desde las sesiones guardadas: el navegador nunca envía «XP».
   Niveles sin tope: subir del nivel n al n+1 cuesta 100 + 40·(n−1) XP. Rangos (provisionales) cada 10 niveles. */
const XP = { acierto: 10, fallo: 0, sesion: 20, perfecta: 10, leccion: 30, errorRecuperado: 15, errorDominado: 25, curso: 100, retoDiario: 50, retoSemanal: 200, repeticionesPorDia: 2, minRespuestasSesion: 5 };
const RANGOS = [ // [desde el nivel, nombre]
  [1, 'Chispa'], [10, 'Brasa'], [20, 'Llama'], [35, 'Fuego'], [55, 'Hoguera'], [80, 'Fuego eterno']
];
function costoNivel(n) { return 100 + 40 * (n - 1); }
function xpAcumulado(n) { return (n - 1) * 100 + 20 * (n - 1) * (n - 2); }
function nivelDe(xp) {
  let n = Math.max(1, Math.floor((-60 + Math.sqrt(3600 + 80 * xp)) / 40) + 1);
  while (xpAcumulado(n + 1) <= xp) n++;
  while (n > 1 && xpAcumulado(n) > xp) n--;
  return { nivel: n, enNivel: xp - xpAcumulado(n), paraSubir: costoNivel(n), rango: rangoDe(n) };
}
function rangoDe(n) { let r = RANGOS[0][1]; RANGOS.forEach(([d, nombre]) => { if (n >= d) r = nombre; }); return r; }

/* Estado anti-abuso del alumno (lo guardaría el servidor): vistosHoy, fallos (item → {sesion, dia}), recuperados (item → dia), dominados (Set), reclamadas (Set) */
function estadoNuevo() { return { vistosHoy: {}, fallos: {}, recuperados: {}, dominados: new Set(), reclamadas: new Set() }; }
function sospechosa(resp) {
  if (resp.length < 6) return false;
  const rapidas = resp.filter(r => r.ms < 1500).length / resp.length;
  const acierto = resp.filter(r => r.ok).length / resp.length;
  const opciones = {}; resp.forEach(r => { opciones[r.opcion] = (opciones[r.opcion] || 0) + 1; });
  const patron = Math.max(...Object.values(opciones)) / resp.length >= 0.7;
  return rapidas >= 0.8 && acierto < 0.4 && patron;
}
/* respuestas: [{ item, ok, ms, opcion, aciertosSeguidos? }]; sesion: { id, dia, leccion?, curso?, retoDiario?, retoSemanal? } */
function xpSesion(respuestas, sesion, est) {
  let xp = 0, validas = 0; const detalle = { aciertos: 0, recuperados: 0, dominados: 0, bonos: 0 };
  respuestas.forEach(r => {
    const veces = est.vistosHoy[r.item] || 0; est.vistosHoy[r.item] = veces + 1;
    validas++;
    if (!r.ok) { if (!est.fallos[r.item]) est.fallos[r.item] = { sesion: sesion.id, dia: sesion.dia }; return; }
    if (veces < XP.repeticionesPorDia) { xp += XP.acierto; detalle.aciertos++; }
    const f = est.fallos[r.item];
    if (f && f.sesion !== sesion.id) {
      const ult = est.recuperados[r.item];
      if (ult == null || sesion.dia - ult >= 7) { xp += XP.errorRecuperado; est.recuperados[r.item] = sesion.dia; detalle.recuperados++; }
      if ((r.aciertosSeguidos || 0) >= 3 && !est.dominados.has(r.item)) { xp += XP.errorDominado; est.dominados.add(r.item); detalle.dominados++; delete est.fallos[r.item]; }
    }
  });
  const bono = (clave, v) => { if (!est.reclamadas.has(clave)) { est.reclamadas.add(clave); xp += v; detalle.bonos += v; } };
  if (validas >= XP.minRespuestasSesion && !sospechosa(respuestas)) {
    bono('sesion:' + sesion.id, XP.sesion);
    if (respuestas.every(r => r.ok)) bono('perfecta:' + sesion.id, XP.perfecta);
  }
  if (sesion.leccion) bono('leccion:' + sesion.leccion, XP.leccion);
  if (sesion.curso) bono('curso:' + sesion.curso, XP.curso);
  if (sesion.retoDiario) bono('retoD:' + sesion.dia, XP.retoDiario);
  if (sesion.retoSemanal) bono('retoS:' + Math.floor(sesion.dia / 7), XP.retoSemanal);
  return { xp, detalle };
}

// Simulación de un año (semilla fija, reproducible). El banco tiene 3.000 ejercicios; los fallos vuelven en repasos.
function simular(perfil, dias, semilla) {
  let s = semilla || 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const est = estadoNuevo(); let xp = 0, item = 0, sid = 0; const hitos = {}; const racha = {};
  const pendientes = [];
  for (let d = 1; d <= dias; d++) {
    est.vistosHoy = {};
    let activo = rnd() < perfil.probDia, sesiones = 0;
    if (activo) for (let k = 0; k < perfil.sesiones; k++) {
      sid++; sesiones++;
      const resp = Array.from({ length: 10 }, (_, i) => {
        const repaso = i < 2 && pendientes.length;
        const it = repaso ? pendientes.shift() : 'i' + (item++ % 3000);
        const ok = rnd() < (repaso ? Math.min(0.95, perfil.acierto + 0.1) : perfil.acierto);
        racha[it] = ok ? (racha[it] || 0) + 1 : 0;
        if (!ok) pendientes.push(it);
        return { item: it, ok, ms: 4000, opcion: Math.floor(rnd() * 3), aciertosSeguidos: racha[it] };
      });
      const r = xpSesion(resp, { id: sid, dia: d, leccion: rnd() < perfil.lecciones ? 'l' + sid : null, curso: (sid % perfil.cursoCada === 0) ? 'c' + sid : null, retoDiario: k === 0 && rnd() < perfil.retos, retoSemanal: d % 7 === 0 && k === 0 && rnd() < perfil.retos }, est);
      xp += r.xp;
    }
    if ([7, 30, 90, 180, 365].includes(d)) hitos[d] = nivelDe(xp).nivel;
  }
  const f = nivelDe(xp); return { xp, nivel: f.nivel, rango: f.rango, hitos };
}
const PERFILES = {
  ocasional: { probDia: 0.35, sesiones: 1, acierto: 0.65, retos: 0.3, lecciones: 0.1, cursoCada: 60 },
  constante: { probDia: 0.75, sesiones: 2, acierto: 0.75, retos: 0.7, lecciones: 0.25, cursoCada: 40 },
  intensivo: { probDia: 0.95, sesiones: 5, acierto: 0.85, retos: 0.95, lecciones: 0.3, cursoCada: 30 }
};
if (require.main === module) {
  console.log('Nivel → XP acumulado:', [2, 5, 10, 20, 35, 55, 80, 100].map(n => n + ':' + xpAcumulado(n)).join('  '));
  console.log('Rangos:', RANGOS.map(([d, n]) => n + ' desde el nivel ' + d).join(', '));
  for (const [k, p] of Object.entries(PERFILES)) { const r = simular(p, 365, 11); console.log(k.padEnd(10), 'XP año', r.xp, '· rango final', r.rango, '· nivel por día', JSON.stringify(r.hitos)); }
}
module.exports = { XP, RANGOS, costoNivel, xpAcumulado, nivelDe, rangoDe, xpSesion, estadoNuevo, sospechosa, simular, PERFILES };
