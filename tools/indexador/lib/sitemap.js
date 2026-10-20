'use strict';

function decodificar(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();
}
function locs(xml) {
  const out = [];
  const re = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml))) out.push(decodificar(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')));
  return out;
}

async function descargar(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': 'indexador-inglesconleo/1.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} al leer ${url}`);
  return r.text();
}

// Devuelve las URLs del sitemap (soporta indice de sitemaps), solo del sitio indicado, sin duplicados.
async function leerUrls(urlSitemap, sitio, descargarFn = descargar, prof = 0) {
  const xml = await descargarFn(urlSitemap);
  let urls;
  if (/<sitemapindex/i.test(xml)) {
    if (prof >= 3) return [];
    urls = [];
    for (const sub of locs(xml)) urls.push(...await leerUrls(sub, sitio, descargarFn, prof + 1));
  } else {
    urls = locs(xml);
  }
  const origen = sitio ? new URL(sitio).origin : null;
  const vistos = new Set();
  const out = [];
  for (let u of urls) {
    try { const o = new URL(u); o.hash = ''; u = o.href; if (origen && o.origin !== origen) continue; } catch (e) { continue; }
    if (!vistos.has(u)) { vistos.add(u); out.push(u); }
  }
  return out;
}

module.exports = { leerUrls, locs };
