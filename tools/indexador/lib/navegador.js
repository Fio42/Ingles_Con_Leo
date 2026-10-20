'use strict';
const path = require('path');
const fs = require('fs');

function playwright() {
  try { return require('playwright-core'); } catch (e) { return require('playwright'); }
}

function perfilDir(datos) { return path.join(datos, 'perfil-chrome'); }

function buscarChrome(cfg) {
  if (cfg.navegador && cfg.navegador.rutaEjecutable) return cfg.navegador.rutaEjecutable;
  const c = [];
  for (const v of ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']) if (process.env[v]) c.push(path.join(process.env[v], 'Google', 'Chrome', 'Application', 'chrome.exe'));
  return c.find(p => fs.existsSync(p)) || null;
}

// Chrome mantiene 'lockfile' bloqueado mientras el perfil esta abierto.
function perfilEnUso(datos) {
  const f = path.join(perfilDir(datos), 'lockfile');
  if (!fs.existsSync(f)) return false;
  try { fs.closeSync(fs.openSync(f, 'r+')); return false; } catch (e) { return ['EBUSY', 'EPERM', 'EACCES'].includes(e.code); }
}

// Sesion persistente: el perfil de Chrome guarda la sesion de Google que iniciaste TU a mano.
async function abrir(cfg, datos) {
  const { chromium } = playwright();
  const nav = cfg.navegador || {};
  const opciones = { headless: !!nav.headless, viewport: { width: 1280, height: 900 }, locale: 'es-ES', args: ['--no-first-run', '--no-default-browser-check'] };
  if (nav.rutaEjecutable) opciones.executablePath = nav.rutaEjecutable; else if (nav.canal) opciones.channel = nav.canal;
  if (!nav.headless && process.platform === 'win32') opciones.args.push('--start-minimized');
  fs.mkdirSync(perfilDir(datos), { recursive: true });
  if (perfilEnUso(datos)) throw new Error('profile already in use: hay un Chrome abierto con el perfil del robot (la ventana de login.bat)');
  opciones.timeout = 60000;
  return chromium.launchPersistentContext(perfilDir(datos), opciones);
}

module.exports = { abrir, perfilDir, buscarChrome };
