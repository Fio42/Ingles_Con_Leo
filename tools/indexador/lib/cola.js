'use strict';
const path = require('path');
const { leerJSON, escribirJSONAtomico, sumarHoras, sumarDias } = require('./util');

/*
  Estados de cada URL:
   nueva          nunca inspeccionada
   indexada       Google ya la tiene (se vuelve a mirar en reinspeccionIndexadasDias)
   no_indexada    inspeccionada, falta pedir indexacion (por ejemplo por limite de cuota)
   solicitada     Google ACEPTO la solicitud (confirmado en pantalla); se revisa mas tarde
   rechazada      Google rechazo la solicitud (pagina no indexable, etc.)
   sin_boton      no aparecio el boton Solicitar indexacion
   sin_confirmar  el robot se corto en mitad de una solicitud; no se sabe si Google la acepto
   error          fallo tecnico al inspeccionar
   revision_manual demasiados intentos: hay que mirarla a mano
*/

function nuevaCola() {
  return { version: 1, creada: new Date().toISOString(), propiedad: null, detenido: null, cuota: { bloqueadaHasta: null, ultimaDeteccion: null }, urls: {} };
}
function archivoCola(datos) { return path.join(datos, 'cola.json'); }
function cargar(datos) {
  const c = leerJSON(archivoCola(datos), null);
  if (!c || !c.urls) return nuevaCola();
  return c;
}
function guardar(datos, cola) { escribirJSONAtomico(archivoCola(datos), cola); }

function sincronizar(cola, urls, ahora = new Date()) {
  const set = new Set(urls);
  let nuevas = 0, quitadas = 0;
  urls.forEach((u, i) => {
    let it = cola.urls[u];
    if (!it) { it = cola.urls[u] = { estado: 'nueva', agregada: ahora.toISOString(), solicitudes: 0, fallos: 0 }; nuevas++; }
    if (it.enSitemap === false) it.enSitemap = true;
    it.enSitemap = true;
    it.orden = i;
  });
  for (const u of Object.keys(cola.urls)) {
    if (!set.has(u) && cola.urls[u].enSitemap !== false) { cola.urls[u].enSitemap = false; quitadas++; }
  }
  return { nuevas, quitadas };
}

function exclusion(url, cfg, ahora = new Date()) {
  for (const e of cfg.excluir || []) {
    if (!url.includes(e.patron)) continue;
    if (!e.hasta) return e.motivo || 'excluida';
    const fin = new Date(e.hasta + 'T00:00:00');
    if (ahora < fin) return `${e.motivo || 'excluida'} (hasta ${e.hasta})`;
  }
  return null;
}

function indicePrioridad(url, cfg) {
  const i = (cfg.prioridad || []).findIndex(p => url.includes(p));
  return i < 0 ? Infinity : i;
}

function vencida(fechaIso, ahora) { return !fechaIso || new Date(fechaIso) <= ahora; }

// ¿Toca trabajar esta URL ahora?  Devuelve un numero de "rango" (menor = antes) o null.
function rango(url, it, cfg, ahora = new Date()) {
  if (it.enSitemap === false) return null;
  if (exclusion(url, cfg, ahora)) return null;
  switch (it.estado) {
    case 'no_indexada': return 1;
    case 'nueva': return 2;
    case 'solicitada': return vencida(it.proximaRevision, ahora) ? 3 : null;
    case 'rechazada': case 'sin_boton': case 'sin_confirmar': case 'error':
      return vencida(it.reintentoDesde, ahora) ? 4 : null;
    case 'indexada': return vencida(it.proximaRevision, ahora) ? 5 : null;
    default: return null;
  }
}

function pendientes(cola, cfg, ahora = new Date()) {
  const lista = [];
  for (const [url, it] of Object.entries(cola.urls)) {
    const r = rango(url, it, cfg, ahora);
    if (r !== null) lista.push({ url, it, r, p: indicePrioridad(url, cfg) });
  }
  lista.sort((a, b) => (a.p - b.p) || (a.r - b.r) || ((a.it.orden || 0) - (b.it.orden || 0)));
  return lista;
}

function cuotaBloqueada(cola, ahora = new Date()) {
  return !!(cola.cuota && cola.cuota.bloqueadaHasta && new Date(cola.cuota.bloqueadaHasta) > ahora);
}

function resumen(cola, cfg, ahora = new Date()) {
  const r = { total: 0, enSitemap: 0, excluidas: 0 };
  for (const [url, it] of Object.entries(cola.urls)) {
    r.total++;
    if (it.enSitemap === false) continue;
    r.enSitemap++;
    if (exclusion(url, cfg, ahora)) { r.excluidas++; continue; }
    r[it.estado] = (r[it.estado] || 0) + 1;
  }
  return r;
}

module.exports = { nuevaCola, cargar, guardar, sincronizar, exclusion, pendientes, cuotaBloqueada, resumen, rango, sumarHoras, sumarDias };
