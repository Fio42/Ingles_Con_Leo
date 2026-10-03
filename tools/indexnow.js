/* Avisa a Bing y otros buscadores (IndexNow) de URLs nuevas o cambiadas.
   Uso:  node tools/indexnow.js                -> envia tools/glosario/indexnow_urls.json
         node tools/indexnow.js <url> <url>... -> envia esas URLs
   La llave es el archivo 41c1350951c5e79e95e8a4d0b5c84112.txt de la raiz del sitio.
   Ejecutar DESPUES de publicar (git push) para que las paginas ya existan. */
const fs = require('fs');
const path = require('path');
const KEY = '41c1350951c5e79e95e8a4d0b5c84112';
const HOST = 'inglesconleo.com';
(async () => {
  const args = process.argv.slice(2);
  const urls = args.length ? args : JSON.parse(fs.readFileSync(path.join(__dirname, 'glosario', 'indexnow_urls.json'), 'utf8'));
  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls })
  });
  console.log(`IndexNow: ${urls.length} URLs enviadas. Respuesta ${res.status} ${res.statusText}`);
})().catch(e => { console.error('IndexNow fallo:', e.message); process.exit(1); });
