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

// Una sola medición de Lighthouse en GitHub varía muchísimo (misma página y mismo
// código: 87 -> 53 -> 85 en tres días). Por eso se mide RUNS veces por página y se
// guarda la corrida del medio (mediana por Performance). Así un pico de lentitud
// de la máquina no dispara una falsa alarma.
const RUNS = Number(process.env.LH_RUNS) || 3;

function perfOf(file) {
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    const sc = j.categories && j.categories.performance && j.categories.performance.score;
    return typeof sc === 'number' ? sc : null;
  } catch (e) { return null; }
}

for (const page of PAGES) {
  const outFile = path.join(OUT_DIR, `${page.slug}.json`);
  console.log(`Lighthouse: ${page.label} (${page.url}), ${RUNS} mediciones...`);
  const good = [];
  for (let i = 1; i <= RUNS; i++) {
    const tmp = path.join(OUT_DIR, `${page.slug}.run${i}.json`);
    try {
      execFileSync(
        LIGHTHOUSE_BIN,
        [
          page.url,
          '--output=json',
          `--output-path=${tmp}`,
          '--only-categories=performance,seo,accessibility,best-practices',
          '--chrome-flags="--headless=new --no-sandbox --disable-gpu"',
          '--quiet',
        ],
        { stdio: 'inherit', shell: true }
      );
      const sc = perfOf(tmp);
      if (sc != null) good.push({ tmp, sc });
    } catch (e) {
      console.error(`  Medición ${i} falló para ${page.url}, se sigue.`);
    }
  }
  if (good.length) {
    good.sort((a, b) => a.sc - b.sc);
    const mid = good[Math.floor((good.length - 1) / 2)];
    fs.copyFileSync(mid.tmp, outFile);
    console.log(`  Performance de las mediciones: ${good.map((g) => Math.round(g.sc * 100)).join(', ')}. Se guarda la del medio (${Math.round(mid.sc * 100)}).`);
  } else {
    console.error(`  Lighthouse falló para ${page.url}, se sigue con las demás páginas.`);
  }
  for (let i = 1; i <= RUNS; i++) {
    try { fs.unlinkSync(path.join(OUT_DIR, `${page.slug}.run${i}.json`)); } catch (e) { /* no existe */ }
  }
}

console.log('Listo. JSON crudo guardado en tools/site-health/lighthouse-raw/');
