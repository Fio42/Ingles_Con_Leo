#!/usr/bin/env node
/* ============================================================
   Inglés con Leo — Site Health audit
   ------------------------------------------------------------
   Revisa la web PUBLICADA (nunca los archivos locales) buscando
   problemas reales de SEO/rendimiento/salud técnica, y escribe
   SITE_HEALTH_REPORT.md en la raíz del repo.

   Es de solo lectura sobre el sitio: solo hace GET/HEAD, nunca
   escribe nada ahí. Lo único que modifica son 2 archivos de este
   propio repo: SITE_HEALTH_REPORT.md y tools/site-health/history.json
   (un historial chiquito para comparar contra la corrida anterior
   y poder avisar "esto se rompió HOY", no solo una foto del día).

   Cómo correrlo a mano:
     cd tools/site-health
     npm install        (solo la primera vez)
     npm run audit

   El GitHub Action (.github/workflows/site-health.yml) hace lo
   mismo automáticamente una vez al día, más Lighthouse (ver
   run-lighthouse.js), y sube el reporte actualizado.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_URL = 'https://inglesconleo.com';
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HISTORY_PATH = path.join(__dirname, 'history.json');
const REPORT_PATH = path.join(REPO_ROOT, 'SITE_HEALTH_REPORT.md');
const LIGHTHOUSE_DIR = path.join(__dirname, 'lighthouse-raw');

// Páginas clave para Lighthouse (ver run-lighthouse.js). Se listan acá
// también nada más para poder etiquetarlas bonito en el reporte.
const LIGHTHOUSE_PAGES = require('./lighthouse-urls.json');

const FETCH_TIMEOUT_MS = 12000;
const MAX_PAGES_TO_CRAWL = 160; // tope de seguridad, el sitio tiene ~50
const CONCURRENCY = 4;

const SEV = { CRITICAL: 'CRITICAL', IMPORTANT: 'IMPORTANT', WARNING: 'WARNING', INFO: 'INFO' };
const SEV_ICON = { CRITICAL: '🔴', IMPORTANT: '🟠', WARNING: '🟡', INFO: 'ℹ️' };

// ---------------------------------------------------------------
// Utilidades de red
// ---------------------------------------------------------------
async function fetchUrl(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal, ...opts });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runOne() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, runOne);
  await Promise.all(runners);
  return results;
}

// Prefijo que usa articulos.html (sección de videos) para los botones de
// redes sociales todavía sin URL real: el propio JS del sitio los
// detecta e intercepta el clic para mandar al perfil oficial en su
// lugar (ver isPlaceholder() en articulos.html), así que nunca navegan
// de verdad. Sin este chequeo, el crawler los trataba como una URL
// relativa real y los reportaba como página rota (falso positivo).
const PLACEHOLDER_HREF_PREFIX = 'PON_AQUI_LA_URL_DE_';

function isSameSite(href) {
  if (!href) return false;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
  if (href.startsWith('//')) return false; // protocol-relative externo, no lo seguimos
  if (href.startsWith(PLACEHOLDER_HREF_PREFIX)) return false;
  if (/^https?:\/\//i.test(href)) return href.replace(/^http:/i, 'https:').startsWith(BASE_URL);
  return true; // relativo => del mismo sitio
}

function normalizeUrl(href, baseForRelative) {
  try {
    const u = new URL(href, baseForRelative || BASE_URL + '/');
    u.hash = '';
    // Trata http y https como el mismo recurso para deduplicar (el sitio
    // ya fuerza https vía GitHub Pages; si algo linkeara en http sería
    // el propio bug que "URLs redirigiendo innecesariamente" debe cazar).
    return u.toString();
  } catch (e) {
    return null;
  }
}

function pathOf(url) {
  try {
    const u = new URL(url);
    let p = u.pathname;
    if (p === '/') return '/';
    return p.replace(/^\//, '');
  } catch (e) {
    return url;
  }
}

// ---------------------------------------------------------------
// 1. Qué páginas deberían ser públicas/indexables según el propio
//    código fuente del repo (no una lista aparte que se desactualiza).
// ---------------------------------------------------------------
function scanLocalIntent() {
  const files = fs.readdirSync(REPO_ROOT).filter((f) => f.endsWith('.html'));
  const intent = {}; // { 'gramatica.html': { expectNoindex: true } }
  for (const file of files) {
    const html = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    const hasNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
    intent[file] = { expectNoindex: hasNoindex };
  }
  return intent;
}

// ---------------------------------------------------------------
// 2. sitemap.xml y robots.txt (en vivo)
// ---------------------------------------------------------------
async function checkSitemapAndRobots(findings) {
  let sitemapUrls = [];
  try {
    const res = await fetchUrl(`${BASE_URL}/sitemap.xml`);
    if (!res.ok) {
      findings.push(mk(SEV.CRITICAL, 'sitemap', `${BASE_URL}/sitemap.xml`, `sitemap.xml responde ${res.status}`, 'Google no puede descubrir tus páginas por acá.', 'Revisar por qué sitemap.xml no responde 200.'));
    } else {
      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      $('url > loc').each((_, el) => sitemapUrls.push($(el).text().trim()));
      if (sitemapUrls.length === 0) {
        findings.push(mk(SEV.CRITICAL, 'sitemap', `${BASE_URL}/sitemap.xml`, 'sitemap.xml no tiene ninguna URL o no se pudo leer como XML.', 'Google se queda sin mapa del sitio.', 'Revisar el formato de sitemap.xml.'));
      }
    }
  } catch (e) {
    findings.push(mk(SEV.CRITICAL, 'sitemap', `${BASE_URL}/sitemap.xml`, `No se pudo descargar sitemap.xml (${e.message}).`, 'Google no puede leer tu mapa del sitio.', 'Revisar que sitemap.xml esté accesible.'));
  }

  try {
    const res = await fetchUrl(`${BASE_URL}/robots.txt`);
    if (!res.ok) {
      findings.push(mk(SEV.CRITICAL, 'robots', `${BASE_URL}/robots.txt`, `robots.txt responde ${res.status}`, 'Algunos buscadores pueden asumir reglas por defecto equivocadas.', 'Revisar que robots.txt esté accesible.'));
    } else {
      const txt = await res.text();
      if (!/sitemap:/i.test(txt)) {
        findings.push(mk(SEV.WARNING, 'robots', `${BASE_URL}/robots.txt`, 'robots.txt no menciona el sitemap.', 'No es obligatorio, pero ayuda a que lo encuentren más rápido.', 'Agregar la línea Sitemap: en robots.txt.'));
      }
    }
  } catch (e) {
    findings.push(mk(SEV.CRITICAL, 'robots', `${BASE_URL}/robots.txt`, `No se pudo descargar robots.txt (${e.message}).`, 'Puede afectar cómo los buscadores rastrean el sitio.', 'Revisar que robots.txt esté accesible.'));
  }

  return sitemapUrls;
}

// ---------------------------------------------------------------
// 3. Crawl del sitio en vivo (BFS desde home + URLs del sitemap)
// ---------------------------------------------------------------
async function crawlSite(sitemapUrls) {
  const seeds = new Set([`${BASE_URL}/`, ...sitemapUrls]);
  const queue = Array.from(seeds);
  const visited = new Map(); // url -> pageData
  const incomingLinks = new Map(); // url -> Set(sourceUrls)
  const brokenLinks = []; // { from, to, status }

  while (queue.length && visited.size < MAX_PAGES_TO_CRAWL) {
    const batch = queue.splice(0, CONCURRENCY).filter((u) => !visited.has(u));
    if (!batch.length) continue;
    await mapWithConcurrency(batch, CONCURRENCY, async (url) => {
      if (visited.has(url)) return;
      const page = { url, status: null, error: null, html: null, bytes: 0, finalUrl: url };
      visited.set(url, page);
      try {
        const res = await fetchUrl(url);
        page.status = res.status;
        page.finalUrl = res.url || url;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const text = await res.text();
          page.html = text;
          page.bytes = Buffer.byteLength(text, 'utf8');
          if (res.ok) {
            const $ = cheerio.load(text);
            $('a[href]').each((_, el) => {
              const href = $(el).attr('href');
              if (!isSameSite(href)) return;
              const abs = normalizeUrl(href, url);
              if (!abs) return;
              if (!incomingLinks.has(abs)) incomingLinks.set(abs, new Set());
              incomingLinks.get(abs).add(url);
              if (!visited.has(abs) && !queue.includes(abs) && visited.size + queue.length < MAX_PAGES_TO_CRAWL) {
                queue.push(abs);
              }
            });
          }
        }
      } catch (e) {
        page.error = e.message;
      }
    });
  }

  return { visited, incomingLinks };
}

// ---------------------------------------------------------------
// 4. Revisión por página (título, meta, H1, canonical, JSON-LD, etc.)
// ---------------------------------------------------------------
function auditPage(url, page, localIntent, incomingLinks, findings, history, seenTitles, seenDescriptions, sitemapSet) {
  const file = pathOf(url) === '/' ? 'index.html' : pathOf(url).split('/').pop();
  const intent = localIntent[file];
  const isKnownLocalPage = !!intent;
  const shouldBePublic = isKnownLocalPage ? !intent.expectNoindex : null; // null = página no está en el repo (ej. generada aparte)

  if (page.error) {
    findings.push(mk(SEV.CRITICAL, 'broken-page', url, `No se pudo cargar (${page.error}).`, 'Nadie puede ver esta página, ni Google.', 'Revisar por qué esta URL no responde.'));
    return;
  }
  if (page.status >= 400) {
    findings.push(mk(SEV.CRITICAL, 'broken-page', url, `Responde HTTP ${page.status}.`, 'Visitantes y Google encuentran un error en vez de contenido.', 'Arreglar o quitar los enlaces hacia esta URL.'));
    return;
  }
  if (page.status >= 300) {
    // Redirect: solo interesa si alguien enlaza directo a la URL vieja.
    const sources = incomingLinks.get(url);
    if (sources && sources.size) {
      findings.push(mk(SEV.WARNING, 'redirect', url, `Redirige a ${page.finalUrl} pero hay enlaces internos que apuntan directo a la URL vieja.`, 'Cada salto de redirect es una pequeña pérdida de tiempo/SEO evitable.', 'Actualizar esos enlaces para que apunten directo a la URL final.'));
    }
    return;
  }
  if (!page.html) return; // no es HTML (imagen, etc.), nada más que revisar acá

  const $ = cheerio.load(page.html);
  const title = ($('title').first().text() || '').trim();
  const description = ($('meta[name="description"]').attr('content') || '').trim();
  const canonical = ($('link[rel="canonical"]').attr('href') || '').trim();
  const robotsMeta = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
  const liveNoindex = robotsMeta.includes('noindex');
  const h1s = $('h1').toArray().map((el) => $(el).text().trim());

  // --- noindex esperado vs real (evita falsas alarmas en páginas privadas) ---
  if (isKnownLocalPage) {
    if (intent.expectNoindex && !liveNoindex) {
      findings.push(mk(SEV.CRITICAL, 'noindex-regression', url, 'Esta página es de miembros/privada pero YA NO tiene noindex en vivo.', 'Google podría empezar a indexar una página que no debería ser pública.', `Verificar que ${file} tenga <meta name="robots" content="noindex"> y que se haya publicado bien.`));
    }
    if (!intent.expectNoindex && liveNoindex) {
      findings.push(mk(SEV.CRITICAL, 'noindex-regression', url, 'Esta página debería ser pública pero está saliendo noindex en vivo.', 'Google no la va a indexar aunque quieras que la gente la encuentre.', `Quitar noindex de ${file} si fue sin querer.`));
    }
  }

  if (shouldBePublic === false) return; // páginas privadas: no exigirles title único/canonical/etc.

  // A partir de acá solo para páginas públicas (o no reconocidas localmente,
  // que se tratan como públicas porque están accesibles sin noindex).
  if (liveNoindex && shouldBePublic === null) return;

  // Validez del canonical en sí (esto SIEMPRE se revisa, apunte a donde
  // apunte, incluso en variantes que no son la URL canónica).
  if (!canonical) {
    findings.push(mk(SEV.IMPORTANT, 'canonical', url, 'No tiene canonical.', 'Sin canonical, Google decide solo cuál URL indexar si hay variantes.', 'Agregar <link rel="canonical"> apuntando a esta misma URL.'));
  } else {
    const normalizedCanonical = canonical.replace(/\/$/, '');
    const normalizedUrl = url.replace(/\/$/, '');
    if (!canonical.startsWith(BASE_URL)) {
      findings.push(mk(SEV.CRITICAL, 'canonical', url, `Canonical apunta a un dominio distinto: ${canonical}`, 'Google puede indexar la URL equivocada o de otro dominio.', 'Revisar el canonical de esta página.'));
    } else if (normalizedCanonical !== normalizedUrl && !sitemapSet.has(normalizedCanonical)) {
      findings.push(mk(SEV.WARNING, 'canonical', url, `Canonical apunta a otra URL (${canonical}) que no es esta ni está en el sitemap.`, 'Puede ser intencional (contenido duplicado a propósito) o un error.', 'Confirmar que el canonical es el correcto.'));
    }
  }

  // Variantes que ya se auto-declaran "esta no es la página real, la
  // real es esta otra" (ej. /index.html -> canoniza a "/", o
  // practica.html?skill=grammar -> canoniza a practica.html): no tiene
  // sentido exigirles title/description/H1 únicos, porque a propósito
  // no se supone que Google las indexe por separado. La URL canónica sí
  // recibe la revisión completa normalmente.
  const isSelfCanonical = !canonical || canonical.replace(/\/$/, '') === url.replace(/\/$/, '');
  if (!isSelfCanonical) return;

  if (!title) {
    findings.push(mk(SEV.CRITICAL, 'title', url, 'No tiene <title>.', 'Google usa el title como encabezado en resultados de búsqueda.', 'Agregar un <title> descriptivo.'));
  } else {
    if (seenTitles.has(title)) {
      findings.push(mk(SEV.IMPORTANT, 'title-duplicate', url, `Title duplicado: "${title}" (igual que ${seenTitles.get(title)}).`, 'Google no sabe cuál de las dos páginas mostrar primero.', 'Hacer el title único para esta página.'));
    } else {
      seenTitles.set(title, url);
    }
  }

  if (!description) {
    findings.push(mk(SEV.IMPORTANT, 'description', url, 'No tiene meta description.', 'Google genera un resumen automático, casi siempre peor que uno escrito a mano.', 'Agregar meta description de 1-2 frases.'));
  } else if (seenDescriptions.has(description)) {
    findings.push(mk(SEV.IMPORTANT, 'description-duplicate', url, 'Meta description duplicada con otra página.', 'Pierdes la oportunidad de diferenciar cada página en los resultados.', 'Escribir una descripción distinta para esta página.'));
  } else {
    seenDescriptions.set(description, url);
  }

  if (h1s.length === 0) {
    findings.push(mk(SEV.IMPORTANT, 'h1', url, 'No tiene ningún H1.', 'El H1 le dice a Google (y a quien lee por encima) de qué trata la página.', 'Agregar un H1 claro.'));
  } else if (h1s.length > 1) {
    findings.push(mk(SEV.WARNING, 'h1', url, `Tiene ${h1s.length} H1 (debería ser solo 1).`, 'Diluye la señal de "de qué trata esta página" para Google.', 'Dejar un solo H1 y bajar los demás a H2/H3.'));
  } else if (!h1s[0]) {
    findings.push(mk(SEV.IMPORTANT, 'h1', url, 'El único H1 está vacío.', 'Es como no tener H1.', 'Ponerle texto real al H1.'));
  }

  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      JSON.parse(raw);
    } catch (e) {
      findings.push(mk(SEV.IMPORTANT, 'json-ld', url, 'Tiene un bloque JSON-LD con JSON inválido.', 'Google ignora ese schema completo si no puede leerlo.', 'Revisar la sintaxis del JSON-LD (comas, comillas, llaves).'));
    }
  });

  // Imágenes sin alt (una sola alerta por página, no una por imagen)
  const imgsNoAlt = $('img').toArray().filter((el) => {
    const alt = $(el).attr('alt');
    return alt === undefined;
  }).length;
  if (imgsNoAlt > 0) {
    findings.push(mk(SEV.WARNING, 'images-alt', url, `${imgsNoAlt} imagen(es) sin atributo alt.`, 'Afecta accesibilidad y SEO de imágenes.', 'Agregar alt descriptivo (o alt="" si es puramente decorativa).'));
  }

  // Huérfanas: página pública sin ningún enlace interno entrante (aparte de sí misma)
  if (shouldBePublic) {
    const incoming = incomingLinks.get(url) || incomingLinks.get(page.finalUrl) || new Set();
    const realIncoming = Array.from(incoming).filter((src) => src !== url);
    if (realIncoming.length === 0 && url !== `${BASE_URL}/`) {
      findings.push(mk(SEV.WARNING, 'orphan', url, 'No se encontró ningún enlace interno hacia esta página durante el rastreo.', 'Si nada del sitio la enlaza, ni Google ni las personas la encuentran fácil (dependen 100% del sitemap).', 'Enlazarla desde alguna página relacionada (por ejemplo articulos.html u otro artículo).'));
    }
  }

  // Tamaño del HTML, comparado contra la corrida anterior
  const prevBytes = history.pageSizes && history.pageSizes[url];
  if (prevBytes && page.bytes > prevBytes * 1.3 && page.bytes - prevBytes > 8000) {
    findings.push(mk(SEV.WARNING, 'page-size', url, `El HTML creció de ${Math.round(prevBytes / 1024)}KB a ${Math.round(page.bytes / 1024)}KB desde la última corrida.`, 'Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.', 'Revisar si el crecimiento fue intencional.'));
  }

}

// ---------------------------------------------------------------
// 5. Comparación sitemap <-> páginas públicas encontradas
// ---------------------------------------------------------------
function checkSitemapCoverage(sitemapUrls, visited, localIntent, findings) {
  const sitemapSet = new Set(sitemapUrls.map((u) => u.replace(/\/$/, '')));
  for (const file of Object.keys(localIntent)) {
    if (localIntent[file].expectNoindex) continue;
    const url = file === 'index.html' ? `${BASE_URL}/` : `${BASE_URL}/${file}`;
    const normalized = url.replace(/\/$/, '');
    const page = visited.get(url);
    if (page && page.status && page.status < 300 && !sitemapSet.has(normalized)) {
      findings.push(mk(SEV.IMPORTANT, 'sitemap-coverage', url, 'Es una página pública pero no aparece en sitemap.xml.', 'Google puede tardar más en descubrirla si no está en el mapa.', 'Agregarla a sitemap.xml.'));
    }
  }
  for (const sUrl of sitemapUrls) {
    const page = visited.get(sUrl) || visited.get(sUrl.replace(/\/$/, ''));
    if (!page) continue; // ya se reportó como broken-page si aplicaba, o no se pudo rastrear
    if (page.status >= 400 || page.error) {
      findings.push(mk(SEV.CRITICAL, 'sitemap-broken', sUrl, `Está en sitemap.xml pero responde ${page.error ? 'error de red' : 'HTTP ' + page.status}.`, 'Google gasta rastreo en una URL rota que además está "recomendada" por ti mismo.', 'Quitarla del sitemap o arreglar la página.'));
    }
  }
}

// ---------------------------------------------------------------
// 6. Lighthouse (lee los JSON que ya generó run-lighthouse.js)
// ---------------------------------------------------------------
function loadLighthouseResults() {
  const results = {};
  if (!fs.existsSync(LIGHTHOUSE_DIR)) return results;
  for (const page of LIGHTHOUSE_PAGES) {
    const file = path.join(LIGHTHOUSE_DIR, `${page.slug}.json`);
    if (!fs.existsSync(file)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      const cats = raw.categories || {};
      const audits = raw.audits || {};
      results[page.url] = {
        label: page.label,
        performance: cats.performance ? Math.round(cats.performance.score * 100) : null,
        seo: cats.seo ? Math.round(cats.seo.score * 100) : null,
        accessibility: cats.accessibility ? Math.round(cats.accessibility.score * 100) : null,
        bestPractices: cats['best-practices'] ? Math.round(cats['best-practices'].score * 100) : null,
        lcp: audits['largest-contentful-paint'] ? audits['largest-contentful-paint'].numericValue : null,
        cls: audits['cumulative-layout-shift'] ? audits['cumulative-layout-shift'].numericValue : null,
        tbt: audits['total-blocking-time'] ? audits['total-blocking-time'].numericValue : null,
        consoleErrors: (audits['errors-in-console'] && audits['errors-in-console'].details && audits['errors-in-console'].details.items) ? audits['errors-in-console'].details.items.length : 0,
      };
    } catch (e) {
      // JSON corrupto o Lighthouse falló para esa página: no rompe el resto del reporte.
    }
  }
  return results;
}

const LIGHTHOUSE_CAT_LABELS = { performance: 'Performance', seo: 'SEO', accessibility: 'Accesibilidad', bestPractices: 'Best Practices' };

function auditLighthouse(lhResults, history, findings) {
  const prevLh = history.lighthouse || {};
  for (const [url, r] of Object.entries(lhResults)) {
    const prev = prevLh[url];
    ['performance', 'seo', 'accessibility', 'bestPractices'].forEach((cat) => {
      const score = r[cat];
      if (score == null) return;
      const label = LIGHTHOUSE_CAT_LABELS[cat];
      if (score < 50) {
        findings.push(mk(SEV.CRITICAL, `lighthouse-${cat}`, url, `Lighthouse ${label} = ${score}/100.`, 'Puntaje muy bajo, afecta tanto ranking como experiencia real de usuarios.', 'Revisar el detalle del reporte de Lighthouse para esta página.'));
      } else if (score < 80) {
        findings.push(mk(SEV.IMPORTANT, `lighthouse-${cat}`, url, `Lighthouse ${label} = ${score}/100.`, 'Hay margen claro de mejora.', 'Revisar el detalle del reporte de Lighthouse para esta página.'));
      }
      if (prev && typeof prev[cat] === 'number' && score < prev[cat] - 10) {
        findings.push(mk(SEV.CRITICAL, `lighthouse-regression`, url, `Lighthouse ${label} bajó de ${prev[cat]} a ${score} desde la última corrida.`, 'Es una regresión real, algo que se agregó o cambió empeoró el sitio.', 'Revisar qué cambió en esta página desde la corrida anterior.'));
      }
    });
    if (r.consoleErrors > 0) {
      findings.push(mk(SEV.WARNING, 'console-errors', url, `${r.consoleErrors} error(es) de consola detectados por Lighthouse.`, 'Puede indicar JS roto que afecta funcionalidad.', 'Abrir la consola del navegador en esta página y revisar.'));
    }
  }
  if (Object.keys(lhResults).length === 0) {
    findings.push(mk(SEV.INFO, 'lighthouse', BASE_URL, 'No se encontraron resultados de Lighthouse en esta corrida.', 'El reporte de rendimiento queda incompleto.', 'Ejecutar tools/site-health/run-lighthouse.js antes del audit, o revisar el paso de Lighthouse en el workflow.'));
  }
}

// ---------------------------------------------------------------
// Helpers de construcción de findings + reporte
// ---------------------------------------------------------------
function mk(severity, category, url, problem, why, action) {
  return { severity, category, url, problem, why, action };
}
function findingKey(f) {
  return `${f.severity}|${f.category}|${f.url}|${f.problem}`;
}

function severityRank(s) {
  return { CRITICAL: 0, IMPORTANT: 1, WARNING: 2, INFO: 3 }[s];
}

function buildReport(findings, meta) {
  const counts = { CRITICAL: 0, IMPORTANT: 0, WARNING: 0, INFO: 0 };
  for (const f of findings) counts[f.severity]++;

  const pagesWithIssues = new Set(findings.filter((f) => f.severity !== 'INFO').map((f) => f.url));
  const healthyPages = meta.totalPublicPages - pagesWithIssues.size;

  const sorted = [...findings].sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    return severityRank(a.severity) - severityRank(b.severity);
  });

  const top3 = sorted.filter((f) => f.severity === 'CRITICAL' || f.severity === 'IMPORTANT').slice(0, 3);
  const critImportant = sorted.filter((f) => f.severity === 'CRITICAL' || f.severity === 'IMPORTANT');
  const warnings = sorted.filter((f) => f.severity === 'WARNING');
  const infos = sorted.filter((f) => f.severity === 'INFO');

  const lines = [];
  lines.push(`# SITE HEALTH — ${meta.date}`);
  lines.push('');
  lines.push(`🔴 Críticos: ${counts.CRITICAL}`);
  lines.push(`🟠 Importantes: ${counts.IMPORTANT}`);
  lines.push(`🟡 Mejoras: ${counts.WARNING}`);
  lines.push(`🟢 Páginas sin problemas: ${Math.max(healthyPages, 0)} de ${meta.totalPublicPages}`);
  lines.push('');

  if (top3.length) {
    lines.push('## Las 3 cosas que más conviene revisar');
    lines.push('');
    for (const f of top3) {
      lines.push(...renderFinding(f));
      lines.push('');
    }
  } else {
    lines.push('## Las 3 cosas que más conviene revisar');
    lines.push('');
    lines.push('Nada crítico ni importante esta vez. 🎉');
    lines.push('');
  }

  lines.push('## Críticos + Importantes (todos)');
  lines.push('');
  if (critImportant.length === 0) {
    lines.push('Ninguno.');
  } else {
    for (const f of critImportant) lines.push(...renderFinding(f), '');
  }
  lines.push('');

  lines.push('<details>');
  lines.push('<summary>🟡 Mejoras recomendables (click para expandir)</summary>');
  lines.push('');
  if (warnings.length === 0) {
    lines.push('Ninguna.');
  } else {
    for (const f of warnings) lines.push(...renderFinding(f), '');
  }
  lines.push('</details>');
  lines.push('');

  if (infos.length) {
    lines.push('<details>');
    lines.push('<summary>ℹ️ Contexto / notas del propio auditor</summary>');
    lines.push('');
    for (const f of infos) lines.push(...renderFinding(f), '');
    lines.push('</details>');
    lines.push('');
  }

  if (meta.lighthouse && Object.keys(meta.lighthouse).length) {
    lines.push('## Lighthouse (páginas clave)');
    lines.push('');
    lines.push('| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const [url, r] of Object.entries(meta.lighthouse)) {
      lines.push(`| ${r.label} | ${fmt(r.performance)} | ${fmt(r.seo)} | ${fmt(r.accessibility)} | ${fmt(r.bestPractices)} | ${r.lcp != null ? Math.round(r.lcp) + 'ms' : '-'} | ${r.cls != null ? r.cls.toFixed(3) : '-'} | ${r.tbt != null ? Math.round(r.tbt) + 'ms' : '-'} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`Auditado: ${meta.totalCrawled} URLs visitadas, ${meta.totalPublicPages} páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).`);
  lines.push('');
  return lines.join('\n');
}

function fmt(n) {
  return n == null ? '-' : `${n}/100`;
}

function renderFinding(f) {
  const icon = SEV_ICON[f.severity];
  const badge = f.isNew ? ' 🆕 NUEVO' : '';
  return [
    `${icon} ${f.url}${badge}`,
    `${f.problem}`,
    `Impacto: ${f.why}`,
    `Acción: ${f.action}`,
  ];
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  const findings = [];
  let history = { pageSizes: {}, lighthouse: {}, findingKeys: [] };
  if (fs.existsSync(HISTORY_PATH)) {
    try { history = { ...history, ...JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8')) }; } catch (e) { /* historial corrupto, se ignora y se reescribe */ }
  }

  console.log('Revisando sitemap.xml y robots.txt...');
  const sitemapUrls = await checkSitemapAndRobots(findings);
  console.log('Leyendo intención local (noindex) de los archivos .html del repo...');
  const localIntent = scanLocalIntent();

  console.log(`Rastreando el sitio en vivo (${BASE_URL})...`);
  const { visited, incomingLinks } = await crawlSite(sitemapUrls);
  console.log(`  ${visited.size} URLs visitadas.`);

  const sitemapSet = new Set(sitemapUrls.map((u) => u.replace(/\/$/, '')));
  const seenTitles = new Map();
  const seenDescriptions = new Map();
  for (const [url, page] of visited.entries()) {
    auditPage(url, page, localIntent, incomingLinks, findings, history, seenTitles, seenDescriptions, sitemapSet);
  }

  checkSitemapCoverage(sitemapUrls, visited, localIntent, findings);

  console.log('Leyendo resultados de Lighthouse (si existen)...');
  const lhResults = loadLighthouseResults();
  auditLighthouse(lhResults, history, findings);

  // Marca cuáles findings son NUEVOS respecto a la corrida anterior.
  const prevKeys = new Set(history.findingKeys || []);
  for (const f of findings) f.isNew = !prevKeys.has(findingKey(f));

  const totalPublicPages = Object.values(localIntent).filter((v) => !v.expectNoindex).length;
  const report = buildReport(findings, {
    date: new Date().toISOString().slice(0, 10),
    totalCrawled: visited.size,
    totalPublicPages,
    lighthouse: lhResults,
  });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(`Reporte escrito en ${REPORT_PATH}`);

  // Actualiza el historial para la próxima corrida.
  const pageSizes = {};
  for (const [url, page] of visited.entries()) {
    if (page.bytes) pageSizes[url] = page.bytes;
  }
  const newHistory = {
    lastRun: new Date().toISOString(),
    findingKeys: findings.map(findingKey),
    pageSizes,
    lighthouse: Object.fromEntries(Object.entries(lhResults).map(([u, r]) => [u, r])),
  };
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(newHistory, null, 2), 'utf8');
  console.log(`Historial actualizado en ${HISTORY_PATH}`);

  const critCount = findings.filter((f) => f.severity === 'CRITICAL').length;
  if (critCount > 0) {
    console.log(`\n⚠️  ${critCount} problema(s) crítico(s) encontrados. Revisa SITE_HEALTH_REPORT.md.`);
  }
}

main().catch((e) => {
  console.error('El auditor falló:', e);
  process.exit(1);
});
