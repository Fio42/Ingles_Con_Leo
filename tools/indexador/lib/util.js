'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

// Todo lo que cambia (perfil de Chrome con la sesion de Google, cola, registro)
// vive FUERA del repositorio y fuera de OneDrive: nunca se sube a GitHub.
function carpetaDatos() {
  if (process.env.INDEXADOR_DATOS) return process.env.INDEXADOR_DATOS;
  if (process.env.LOCALAPPDATA) return path.join(process.env.LOCALAPPDATA, 'InglesConLeo', 'indexador');
  return path.join(os.homedir(), '.inglesconleo-indexador');
}

function asegurarCarpeta(d) { fs.mkdirSync(d, { recursive: true }); return d; }

function leerJSON(f, def) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); } catch (e) { return def; }
}

function dormir(ms) { return new Promise(r => setTimeout(r, ms)); }

function escribirJSONAtomico(f, obj) {
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  for (let i = 0; i < 6; i++) {
    try { fs.renameSync(tmp, f); return; } catch (e) {
      if (i === 5) { fs.writeFileSync(f, JSON.stringify(obj, null, 2)); try { fs.unlinkSync(tmp); } catch (_) {} return; }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
    }
  }
}

function mezclar(a, b) {
  if (Array.isArray(b) || b === null || typeof b !== 'object') return b === undefined ? a : b;
  const out = Object.assign({}, a && typeof a === 'object' && !Array.isArray(a) ? a : {});
  for (const k of Object.keys(b)) out[k] = mezclar(out[k], b[k]);
  return out;
}

// config.json (repo) + config.local.json (solo tu PC, ignorado por git) + INDEXADOR_CONFIG (pruebas)
function cargarConfig() {
  let c = leerJSON(path.join(RAIZ, 'config.json'), {});
  c = mezclar(c, leerJSON(path.join(RAIZ, 'config.local.json'), {}));
  if (process.env.INDEXADOR_CONFIG) c = mezclar(c, leerJSON(process.env.INDEXADOR_CONFIG, {}));
  return c;
}

const p2 = n => String(n).padStart(2, '0');
function fechaLocal(d = new Date()) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
}
function sumarHoras(d, h) { return new Date(d.getTime() + h * 3600e3).toISOString(); }
function sumarDias(d, n) { return sumarHoras(d, n * 24); }
function aleatorio(min, max) { return min + Math.random() * (max - min); }

// Registro legible en Excel: fecha, url, accion, resultado, detalle
function csv(v) { v = String(v == null ? '' : v).replace(/\r?\n/g, ' '); return /[",;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function registrar(datos, url, accion, resultado, detalle) {
  const f = path.join(datos, 'registro.csv');
  const nuevo = !fs.existsSync(f);
  const linea = [fechaLocal(), url || '-', accion, resultado, detalle || ''].map(csv).join(',') + '\n';
  fs.appendFileSync(f, (nuevo ? '﻿fecha,url,accion,resultado,detalle\n' : '') + linea);
  console.log(`[${fechaLocal()}] ${accion} ${resultado} ${url || ''} ${detalle || ''}`.trim());
}

module.exports = { RAIZ, carpetaDatos, asegurarCarpeta, leerJSON, escribirJSONAtomico, cargarConfig, mezclar, fechaLocal, sumarHoras, sumarDias, aleatorio, registrar, dormir };
