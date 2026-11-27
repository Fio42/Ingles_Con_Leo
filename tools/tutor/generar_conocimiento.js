#!/usr/bin/env node
// Genera riso/tutor/conocimiento.js (base de conocimiento PÚBLICA del tutor) desde contenido que ya existe:
//   - verbos irregulares: articulo-verbos-irregulares.html (formas + significado)
//   - glosario: tools/glosario/terminos.js (respuesta corta, ejemplo, guía relacionada)
//   - guías: título y descripción de cada articulo-*.html (para sugerir lecturas)
//   - preguntas frecuentes revisadas: tools/tutor/faq.js (escritas a mano)
// No incluye contenido de cursos de miembros (vive en el servidor y solo lo ven miembros).
// Uso: node tools/tutor/generar_conocimiento.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

// Verbos irregulares
const art = read('articulo-verbos-irregulares.html');
const verbos = [];
const re = /<div class="verb-forms">([\s\S]*?)<\/div><div class="verb-es">([\s\S]*?)<\/div>/g;
let m;
while ((m = re.exec(art))) {
  const formas = [...m[1].matchAll(/<b>([\s\S]*?)<\/b>/g)].map(x => strip(x[1]).replace(/\*$/, ''));
  if (formas.length === 3 && !verbos.some(v => v[0] === formas[0])) verbos.push([formas[0], formas[1], formas[2], strip(m[2])]);
}

// Glosario
const terminos = require(path.join(root, 'tools/glosario/terminos.js'));
const glosario = terminos.map(t => ({
  s: t.slug, t: t.t, tipo: t.tipo, r: strip(t.resp).replace(/_/g, ''),
  ej: Array.isArray(t.ej) && t.ej[0] ? [strip(t.ej[0][0]), strip(t.ej[0][1])] : null,
  art: t.art ? 'articulo-' + t.art + '.html' : null
}));

// Guías
const guias = fs.readdirSync(root).filter(f => /^articulo-.*\.html$/.test(f)).map(f => {
  const h = read(f);
  const titulo = strip((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1]).replace(/\s*[-|]\s*Inglés con Leo\s*$/i, '');
  const desc = strip((h.match(/<meta name="description" content="([^"]*)"/) || [])[1]);
  return { u: f, t: titulo, d: desc };
});

const faq = require('./faq.js');
const extra = require('./verbos-extra.js');
// Verbos: los del artículo + los extra verificados a mano (sin duplicar). Quinto campo: nota opcional.
extra.irregulares.forEach(v => { if (!verbos.some(x => x[0] === v[0])) verbos.push(v.slice()); });
const regulares = [...new Set(extra.regulares)].filter(v => !verbos.some(x => x[0] === v));
const out = { version: new Date().toISOString().slice(0, 10), verbos, regulares, doblanSiempre: extra.doblanSiempre, doblanSoloUK: extra.doblanSoloUK, glosario: glosario.map(g => Object.assign(g, { p: (terminos.find(t => t.slug === g.s) || {}).pron || null })), guias, faq };
const js = '/* Generado por tools/tutor/generar_conocimiento.js. No editar a mano. Contenido público del sitio. */\n' +
  '(function(r){ r.RISO_CONOCIMIENTO = ' + JSON.stringify(out) + '; if(typeof module!=="undefined") module.exports = r.RISO_CONOCIMIENTO; })(typeof window!=="undefined"?window:globalThis);\n';
fs.writeFileSync(path.join(root, 'riso/tutor/conocimiento.js'), js);
console.log('verbos', verbos.length, 'regulares', regulares.length, 'glosario', glosario.length, 'guias', guias.length, 'faq', faq.length, 'bytes', js.length);
