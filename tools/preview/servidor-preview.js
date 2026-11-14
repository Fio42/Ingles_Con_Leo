#!/usr/bin/env node
/* Servidor de VISTA PREVIA local (solo en tu computadora, puerto 8765). Sirve el sitio tal como esta en esta carpeta, pero cuando una pagina pide
   backend.js entrega tools/preview/backend-simulado.js: sin Supabase, sin produccion. Cierra la ventana o Ctrl+C para detenerlo.
   Uso:  node tools/preview/servidor-preview.js   y abre  http://localhost:8765/index.html?as=visitante */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if(p === '/backend.js') p = '/tools/preview/backend-simulado.js';
  if(p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if(f.indexOf(root) !== 0){ res.writeHead(403); return res.end('no'); }
  fs.readFile(f, (err, data) => {
    if(err){ res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 ' + p); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(8765, '127.0.0.1', () => console.log('Vista previa lista: http://localhost:8765/index.html  (Ctrl+C para detener)'));
