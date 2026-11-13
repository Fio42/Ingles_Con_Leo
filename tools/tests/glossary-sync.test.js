#!/usr/bin/env node
/*
  El glosario publicado debe coincidir con lo que genera tools/generar_glosario.js.
  Corre desde la raiz: node tools/tests/glossary-sync.test.js
  Evita tres problemas que ya ocurrieron: fichas editadas solo en el HTML (regenerar las borraba),
  enlaces de practica corregidos solo en el HTML, y fechas de actualizacion falsas.
  No toca el repositorio: genera en una copia temporal.
*/
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const terms = require(path.join(ROOT, 'tools', 'glosario', 'terminos.js'));
const editadas = require(path.join(ROOT, 'tools', 'glosario', 'fichas-editadas.js'));
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const unesc = s => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const canon = s => unesc(s.replace(/\r/g, '')).replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
const sinFecha = s => s.replace(/"dateModified":\s*"[^"]*"/, '"dateModified": ""');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (error) { console.error('  FAIL ' + name + '\n       ' + (error.message || error).split('\n').join('\n       ')); process.exitCode = 1; }
}

// Copia temporal con lo minimo que necesita el generador (el audio solo se comprueba por existencia).
function copiaTemporal() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'glosario-sync-'));
  const cp = (from, to) => { fs.mkdirSync(path.dirname(path.join(tmp, to)), { recursive: true }); fs.copyFileSync(path.join(ROOT, from), path.join(tmp, to)); };
  ['data.js', 'temas.js', 'sitemap.xml', 'tools/generar_glosario.js'].forEach(f => cp(f, f));
  fs.readdirSync(ROOT).filter(f => /^articulo-.*\.html$/.test(f)).forEach(f => cp(f, f));
  fs.readdirSync(path.join(ROOT, 'tools', 'glosario')).forEach(f => cp('tools/glosario/' + f, 'tools/glosario/' + f));
  fs.cpSync(path.join(ROOT, 'glosario'), path.join(tmp, 'glosario'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'glosario-ingles'), path.join(tmp, 'glosario-ingles'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'audio', 'glosario'), { recursive: true });
  fs.readdirSync(path.join(ROOT, 'audio', 'glosario')).forEach(f => fs.writeFileSync(path.join(tmp, 'audio', 'glosario', f), ''));
  return tmp;
}
const generar = tmp => execFileSync(process.execPath, [path.join(tmp, 'tools', 'generar_glosario.js')], { cwd: tmp, stdio: 'pipe' });
function huella(tmp) {
  const out = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : out.push(p); });
  ['glosario', 'glosario-ingles'].forEach(d => walk(path.join(tmp, d)));
  ['sitemap.xml', 'tools/glosario/fechas.json', 'tools/glosario/indexnow_urls.json', 'tools/glosario/audio_manifest.json'].forEach(f => out.push(path.join(tmp, f)));
  return out.sort().map(p => path.relative(tmp, p) + ':' + crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex')).join('\n');
}

const tmp = copiaTemporal();
let primera, segunda;
try {
  generar(tmp); primera = huella(tmp);
  generar(tmp); segunda = huella(tmp);
} catch (e) { console.error('  FAIL el generador no se pudo ejecutar: ' + (e.stderr || e.message)); process.exit(1); }

test('ejecutar el generador dos veces da exactamente el mismo resultado', () => {
  assert.strictEqual(segunda, primera);
});

test('lo publicado coincide con lo que genera el generador (salvo espacios, apostrofes y fecha)', () => {
  const distintas = [];
  terms.forEach(t => {
    const a = canon(sinFecha(read(`glosario/${t.slug}/index.html`)));
    const b = canon(sinFecha(fs.readFileSync(path.join(tmp, 'glosario', t.slug, 'index.html'), 'utf8')));
    if (a !== b) distintas.push(t.slug);
  });
  assert.deepStrictEqual(distintas, [], 'fichas distintas de lo que genera el script (¿editaste el HTML a mano? pasa el cambio a tools/glosario/): ' + distintas.join(', '));
  assert.strictEqual(canon(read('glosario-ingles/index.html')), canon(fs.readFileSync(path.join(tmp, 'glosario-ingles', 'index.html'), 'utf8')), 'el indice del glosario no coincide con el generado');
});

test('regenerar no cambia ninguna fecha (dateModified ni lastmod)', () => {
  const fechas = s => (s.match(/"dateModified":\s*"[^"]*"/g) || []).join('|') + (s.match(/<lastmod>[^<]*<\/lastmod>/g) || []).join('|');
  const antes = terms.map(t => fechas(read(`glosario/${t.slug}/index.html`))).join('\n') + fechas(read('sitemap.xml'));
  const despues = terms.map(t => fechas(fs.readFileSync(path.join(tmp, 'glosario', t.slug, 'index.html'), 'utf8'))).join('\n') + fechas(fs.readFileSync(path.join(tmp, 'sitemap.xml'), 'utf8'));
  assert.strictEqual(despues, antes, 'regenerar cambiaria fechas: la fuente y lo publicado no estan sincronizados');
});

test('regenerar no mueve ni agrega lineas al sitemap', () => {
  const locs = x => (x.match(/<loc>[^<]*<\/loc>/g) || []).join('\n');
  assert.strictEqual(locs(fs.readFileSync(path.join(tmp, 'sitemap.xml'), 'utf8')), locs(read('sitemap.xml')), 'el orden o las URLs del sitemap cambiarian al regenerar');
});

test('cada ficha tiene la misma fecha en su pagina y en el sitemap', () => {
  const sm = read('sitemap.xml');
  const malas = terms.filter(t => {
    const m = /"dateModified":\s*"([^"]+)"/.exec(read(`glosario/${t.slug}/index.html`));
    const s = new RegExp(`/glosario/${t.slug}/</loc><lastmod>([^<]+)</lastmod>`).exec(sm);
    return !m || !s || m[1] !== s[1];
  }).map(t => t.slug);
  assert.deepStrictEqual(malas, []);
});

test('las fichas editadas a mano existen y conservan todas sus secciones', () => {
  Object.keys(editadas).forEach(slug => {
    const t = terms.find(x => x.slug === slug);
    assert.ok(t, `fichas-editadas.js tiene un slug que no existe: ${slug}`);
    if (!t.secciones) return;
    const html = canon(read(`glosario/${slug}/index.html`));
    t.secciones.forEach(sec => assert.ok(html.includes(canon(`<h2>${sec.h2}</h2>`)), `${slug}: falta la seccion "${sec.h2}"`));
  });
  assert.ok(Object.values(editadas).filter(e => e.secciones).length >= 12, 'deberian ser al menos 12 fichas con secciones propias');
});

test('las fichas de gramatica practican gramatica', () => {
  const g = terms.filter(t => t.prac === 'grammar');
  assert.ok(g.length >= 35);
  g.forEach(t => assert.ok(read(`glosario/${t.slug}/index.html`).includes('/practica.html?skill=grammar'), `${t.slug}: el boton Practicar no lleva a gramatica`));
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${passed} pruebas pasaron.`);
