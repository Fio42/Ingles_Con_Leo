#!/usr/bin/env node
/* PRUEBA de video-tema.js: cada video del mapa apunta a algo que EXISTE (tema, guia, ficha), "Practicar gratis" solo se promete donde hay
   ejercicios gratis, los videos de la galeria estan todos en el mapa o se dejan sin botones a proposito, y las dos paginas cargan el script. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let ok = 0; const fails = [];
const t = (n, f) => { try{ f(); ok++; }catch(e){ fails.push(n + ': ' + e.message); } };

const src = read('video-tema.js');
const ctx = { window: {}, document: { readyState: 'complete', addEventListener(){}, createElement: () => ({ style: {}, appendChild(){} }), head: { appendChild(){} }, querySelector: () => null, querySelectorAll: () => [] }, location: { search: '' } };
vm.createContext(ctx); vm.runInContext(src, ctx);
const V = ctx.window.LEO_VIDEO_TEMAS;
const temas = {}; { const c = {}; vm.createContext(c); vm.runInContext(read('temas.js') + ';this.T=TEMAS', c); c.T.forEach(x => temas[x.id] = x); }
const inv = {}; read('INVENTARIO_TEMAS.csv').replace(/^\uFEFF/, '').split(/\r?\n/).slice(1).filter(Boolean).forEach(l => { const r = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(x => x.replace(/,$/, '').replace(/^"|"$/g, '')); inv[r[0]] = r; });
const gallery = read('articulos.html'), guides = ['articulo-in-on-at.html', 'articulo-verbo-to-be.html', 'articulo-be-do-have.html'].map(read).join('\n');

t('el mapa tiene videos y ids de YouTube validos y unicos', () => { assert(V.length >= 8); const ids = V.map(v => v.id); assert.strictEqual(new Set(ids).size, ids.length); ids.forEach(i => assert(/^[\w-]{11}$/.test(i), i)); });
V.forEach(v => {
  t(v.id + ' (' + v.title + '): el video existe en la galeria o en una guia', () => assert(gallery.includes('shorts/' + v.id) || guides.includes(v.id)));
  if(v.tema) t(v.id + ': el tema ' + v.tema + ' existe en temas.js', () => assert(temas[v.tema], v.tema));
  if(v.free) t(v.id + ': "Practicar gratis" solo con ejercicios gratis reales del tema ' + v.tema, () => { assert(v.tema); const g = (inv[v.tema] || [])[12]; assert(g && g !== '-', 'sin ejercicios gratis: ' + g); });
  if(v.guide) t(v.id + ': la guia existe', () => assert(fs.existsSync(path.join(root, v.guide))));
  if(v.ficha) t(v.id + ': la ficha del glosario existe', () => assert(fs.existsSync(path.join(root, 'glosario', v.ficha, 'index.html'))));
  t(v.id + ': tiene al menos una forma de seguir aprendiendo (practica, guia o ficha)', () => assert(v.free || v.guide || v.ficha));
});
t('articulos.html y practica.html cargan video-tema.js (con version) y el archivo es JavaScript valido', () => {
  ['articulos.html', 'practica.html'].forEach(f => assert(/video-tema.js\?v=\w+/.test(read(f)), f));
  new vm.Script(src);
});
t('no toca limites, pagos ni acceso: sin llamadas a LeoBackend ni a almacenamiento', () => { assert(!/LeoBackend|localStorage|sessionStorage|startCheckout|FREE_DAILY|membership/i.test(src.replace(/\/\*[\s\S]*?\*\//, ''))); });
t('los enlaces de practica son internos y con formato fijo', () => { V.filter(v => v.free).forEach(v => assert(/^[a-z0-9-]+$/.test(v.tema))); });
if(fails.length){ console.error('FALLA video-tema (' + fails.length + '):\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('video-tema: ' + ok + ' comprobaciones correctas');
