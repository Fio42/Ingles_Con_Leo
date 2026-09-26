#!/usr/bin/env node
/* ============================================================
   Inglés con Leo — Lighthouse runner para Site Health
   ------------------------------------------------------------
   Corre Lighthouse (CLI) contra un puñado de páginas clave del
   sitio EN VIVO y guarda el JSON crudo de cada una en
   tools/site-health/lighthouse-raw/<slug>.json. audit.js después
   lee esos archivos para armar la sección de rendimiento del
   reporte y comparar contra la corrida anterior.

   Requiere tener "lighthouse" instalado (ver el workflow de
   GitHub Actions, o instalarlo global a mano con:
     npm install -g lighthouse
   ) y Chrome/Chromium disponible en el sistema.

   Si Lighthouse no está instalado o falla para una página, este
   script AVISA y sigue con las demás — nunca hace fallar todo el
   Site Health por esto (audit.js simplemente reporta "sin datos
   de Lighthouse" para esa página).
   ============================================================ */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAGES = require('./lighthouse-urls.json');
const OUT_DIR = path.join(__dirname, 'lighthouse-raw');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function findLighthouseBin() {
  // Prioriza el binario instalado dentro de esta carpeta (npm install
  // local), y si no, asume que hay uno global en el PATH (como hace el
  // workflow de GitHub Actions).
  const local = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'lighthouse.cmd' : 'lighthouse');
  if (fs.existsSync(local)) return local;
  return 'lighthouse';
}

const LIGHTHOUSE_BIN = findLighthouseBin();

for (const page of PAGES) {
  const outFile = path.join(OUT_DIR, `${page.slug}.json`);
  console.log(`Lighthouse: ${page.label} (${page.url})...`);
  try {
    execFileSync(
      LIGHTHOUSE_BIN,
      [
        page.url,
        '--output=json',
        `--output-path=${outFile}`,
        '--only-categories=performance,seo,accessibility,best-practices',
        '--chrome-flags="--headless=new --no-sandbox --disable-gpu"',
        '--quiet',
      ],
      { stdio: 'inherit', shell: true }
    );
  } catch (e) {
    console.error(`  Lighthouse falló para ${page.url}, se sigue con las demás páginas.`);
  }
}

console.log('Listo. JSON crudo guardado en tools/site-health/lighthouse-raw/');
