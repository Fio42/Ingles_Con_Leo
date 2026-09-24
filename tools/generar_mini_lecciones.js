// Genera mini-lecciones.js (la frase del dia del inicio) a partir de
// GRAMMAR_BANK en data.js. Asi index.html no tiene que descargar todo
// data.js (casi 900 KB) solo para mostrar una frase.
// Uso (desde la carpeta del proyecto):  node tools/generar_mini_lecciones.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n;this.GB = GRAMMAR_BANK;', ctx);
const seen = new Set();
const pool = [];
Object.keys(ctx.GB).forEach(level => ctx.GB[level].forEach(variant => variant.forEach(topic => topic.items.forEach(item => {
  if(!item.examples || !item.examples.length) return;
  const en = item.examples[0].en, es = item.examples[0].es, explain = item.explain || '';
  // Mismo filtro que usaba el inicio: frases cortas para que quepan en la tarjeta.
  if(en.length > 45 || explain.length > 90 || seen.has(en)) return;
  seen.add(en);
  pool.push({ en, es, explain });
}))));
const out = '/* Archivo generado por tools/generar_mini_lecciones.js a partir de data.js.\n   No editar a mano: si cambias la gramatica en data.js, vuelve a correr ese script. */\n' +
  'const MINI_LESSONS = ' + JSON.stringify(pool) + ';\n';
fs.writeFileSync(path.join(root, 'mini-lecciones.js'), out);
console.log('mini-lecciones.js:', pool.length, 'frases,', out.length, 'bytes');
