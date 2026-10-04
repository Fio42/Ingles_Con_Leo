#!/usr/bin/env node
/*
  Validacion del glosario generado.
  Corre desde la raiz: node tools/tests/glossary.test.js
*/
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const terms = require(path.join(ROOT, 'tools', 'glosario', 'terminos.js'));
const extras = require(path.join(ROOT, 'tools', 'glosario', 'extras.js'));
const manifest = require(path.join(ROOT, 'tools', 'glosario', 'audio_manifest.json'));
const index = fs.readFileSync(path.join(ROOT, 'glosario-ingles', 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

const norm = value => String(value).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u2018\u2019\u02bc\uff07']/g, '')
  .replace(/[^a-z0-9]+/g, '');
const dupes = values => [...new Set(values.filter((value, index, all) => all.indexOf(value) !== index))];
const matchAll = (source, expression) => [...source.matchAll(expression)].map(match => match[1]);
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok  ' + name);
  } catch (error) {
    console.error('  FAIL ' + name + '\n       ' + error.message);
    process.exitCode = 1;
  }
}

console.log('Glosario');
test('cada ficha tiene los campos educativos obligatorios', () => {
  const incomplete = terms.filter(t => !t.slug || !t.t || !t.tipo || !t.resp || !t.pron || !Array.isArray(t.uso) || !t.uso.length || !Array.isArray(t.ej) || !t.ej.length || !t.prac);
  assert.deepStrictEqual(incomplete.map(t => t.slug), []);
});
test('no hay slugs ni términos normalizados duplicados', () => {
  assert.deepStrictEqual(dupes(terms.concat(extras).map(t => t.slug)), []);
  assert.deepStrictEqual(dupes(terms.concat(extras).map(t => norm(t.t))), []);
});
test('todas las relaciones apuntan a fichas existentes', () => {
  const slugs = new Set(terms.map(t => t.slug));
  const broken = terms.flatMap(t => (t.rel || []).filter(rel => !slugs.has(rel)).map(rel => t.slug + ' -> ' + rel));
  assert.deepStrictEqual(broken, []);
});
test('cada ficha generada tiene URL, title, description, canonical y DefinedTerm únicos', () => {
  const titles = [], descriptions = [], bodies = [];
  for (const term of terms) {
    const urlPath = path.join(ROOT, 'glosario', term.slug, 'index.html');
    assert(fs.existsSync(urlPath), 'falta ' + urlPath);
    const html = fs.readFileSync(urlPath, 'utf8');
    const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
    const description = (html.match(/<meta name="description" content="([^"]+)">/) || [])[1];
    assert(title, term.slug + ': sin title');
    assert(description, term.slug + ': sin meta description');
    assert(html.includes(`<link rel="canonical" href="https://inglesconleo.com/glosario/${term.slug}/">`), term.slug + ': canonical incorrecto');
    assert(html.includes('"@type": "DefinedTerm"'), term.slug + ': falta DefinedTerm');
    assert(html.includes(`<h1>${esc(term.t.charAt(0).toUpperCase() + term.t.slice(1))}`), term.slug + ': H1 no corresponde');
    titles.push(title);
    descriptions.push(description);
    bodies.push((html.match(/<article[\s\S]*?<\/article>/) || [''])[0].replace(/\s+/g, ' '));
  }
  assert.deepStrictEqual(dupes(titles), [], 'titles duplicados: ' + dupes(titles).join(', '));
  assert.deepStrictEqual(dupes(descriptions), [], 'descriptions duplicadas: ' + dupes(descriptions).join(', '));
  assert.deepStrictEqual(dupes(bodies), [], 'fichas con contenido idéntico');
});
test('el índice incluye todas las fichas y no duplica IDs', () => {
  for (const term of terms) assert(index.includes(`href="/glosario/${term.slug}/"`), 'falta enlace de ' + term.slug);
  const ids = matchAll(index, /<li class="gl-row"[^>]* id="([^"]+)"/g);
  assert.deepStrictEqual(dupes(ids), []);
  assert.strictEqual(matchAll(index, /class="gl-row"/g).length, 503, 'total de filas inesperado');
});
test('el sitemap conserva y representa exactamente las URLs del glosario', () => {
  const urls = matchAll(sitemap, /<loc>(https:\/\/inglesconleo\.com\/(?:glosario-ingles\/|glosario\/[^<]+\/))<\/loc>/g);
  assert.strictEqual(urls.length, terms.length + 1, 'cantidad de URLs del glosario en sitemap');
  assert.deepStrictEqual(dupes(urls), []);
  for (const term of terms) assert(urls.includes(`https://inglesconleo.com/glosario/${term.slug}/`), 'sitemap sin ' + term.slug);
});
test('el manifiesto tiene una pista por ficha y nombres de archivo seguros', () => {
  const expectedAudioCount = terms.length + terms.filter(term => term.dialogo).length;
  const phraseTracks = manifest.filter(item => item.kind === 'frases');
  const dialogueTracks = manifest.filter(item => item.kind === 'dialogo');
  assert.strictEqual(manifest.length, expectedAudioCount, 'cantidad de pistas');
  assert.strictEqual(phraseTracks.length, terms.length, 'pistas de ejemplos');
  assert.strictEqual(dialogueTracks.length, terms.filter(term => term.dialogo).length, 'pistas de diálogo');
  assert.deepStrictEqual(dupes(manifest.map(item => item.file)), []);
  assert.deepStrictEqual(dupes(phraseTracks.map(item => item.term)), []);
  for (const item of manifest) {
    assert(/^audio\/glosario\/[a-z0-9-]+\.mp3$/.test(item.file), 'ruta insegura: ' + item.file);
    const expectedVoice = item.kind === 'dialogo'
      ? 'en-US-AvaMultilingualNeural|en-US-AndrewMultilingualNeural'
      : 'en-US-AvaMultilingualNeural';
    assert.strictEqual(item.voice, expectedVoice, 'voz inesperada: ' + item.file);
  }
});
test('la normalización encuentra contracciones con o sin apóstrofe', () => {
  const variants = ["mustn't", 'mustn’t', 'mustnt', "MUSTN'T"];
  assert(variants.every(value => norm(value) === norm("mustn't")));
  const mustntRow = (index.match(/<li class="gl-row"[^>]*id="mustnt"[\s\S]*?<\/li>/) || [''])[0];
  assert(mustntRow && norm(mustntRow).includes(norm('mustnt')));
  const js = fs.readFileSync(path.join(ROOT, 'glosario', 'glosario.js'), 'utf8');
  assert(js.includes("replace(/[^a-z0-9]+/g,'')"), 'la búsqueda no elimina puntuación');
});

const files = manifest.filter(item => fs.existsSync(path.join(ROOT, item.file))).length;
const missing = manifest.length - files;
console.log(`${passed} pruebas pasaron. ${terms.length} fichas, ${manifest.length} audios: ${files} existentes, ${missing} pendientes.`);
process.exit(process.exitCode || 0);
