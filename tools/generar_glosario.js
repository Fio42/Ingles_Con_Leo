/* ============================================================
   Generador del GLOSARIO DE INGLES (inglesconleo.com/glosario-ingles/)
   Uso (desde la carpeta del proyecto):   node tools/generar_glosario.js

   Lee:   tools/glosario/terminos.js   (entradas con pagina propia)
          tools/glosario/extras.js     (entradas que solo enlazan a un articulo)
          data.js (VOCAB_BANK)         (palabras del curso, solo en el indice)
          articulo-*.html              (titulo real de cada clase)
   Escribe: glosario-ingles/index.html
            glosario/<slug>/index.html
            sitemap.xml (solo las lineas /glosario...)
            tools/glosario/audio_manifest.json  (lo usa generar_audio_glosario.py)
            tools/glosario/indexnow_urls.json
   El audio se muestra solo si existe audio/glosario/<slug>.mp3.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://inglesconleo.com';
const CSS_V = '20261001g';
const GL_V = '20261002a';
const TODAY = new Date().toISOString().slice(0, 10);
const VOICE_A = 'en-US-AvaMultilingualNeural';
const VOICE_B = 'en-US-AndrewMultilingualNeural';

const terms = require('./glosario/terminos.js');
const extras = require('./glosario/extras.js');

/* ---------- utilidades ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/_([^_]+)_/g, '<em>$1</em>');
const plain = s => String(s).replace(/_([^_]+)_/g, '$1');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const jsonLd = o => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;
const trunc = (s, n) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}
const exists = rel => fs.existsSync(path.join(ROOT, rel));

/* ---------- articulos (titulo real) ---------- */
function articleInfo(slug) {
  const file = `articulo-${slug}.html`;
  if (!exists(file)) throw new Error('No existe el articulo ' + file);
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, slug])[1].replace(/<[^>]+>/g, '').trim();
  return { href: '/' + file, title: h1 };
}

/* ---------- validacion ---------- */
const slugs = new Set();
for (const t of terms.concat(extras)) {
  if (slugs.has(t.slug)) throw new Error('Slug repetido: ' + t.slug);
  slugs.add(t.slug);
  if (!t.resp || !t.ej || !t.ej.length) throw new Error('Falta resp/ej en ' + t.slug);
  if (/—/.test(JSON.stringify(t))) throw new Error('Raya larga en ' + t.slug);
}
const pageSlugs = new Set(terms.map(t => t.slug));
for (const t of terms) for (const r of (t.rel || [])) if (!pageSlugs.has(r)) throw new Error(`rel invalido ${t.slug} -> ${r}`);
for (const t of terms.concat(extras)) { if (t.art) articleInfo(t.art); if (t.art2) articleInfo(t.art2); }

/* ---------- vocabulario del curso (solo indice) ---------- */
function vocabEntries() {
  const src = fs.readFileSync(path.join(ROOT, 'data.js'), 'utf8') + '\n;globalThis.__v = VOCAB_BANK;';
  const ctx = { console }; vm.createContext(ctx); vm.runInContext(src, ctx);
  const taken = new Set(terms.concat(extras).map(t => norm(t.t)));
  const seen = new Set(); const out = [];
  for (const lvl of Object.keys(ctx.__v)) for (const variant of ctx.__v[lvl]) for (const w of variant) {
    const word = String(w.word || '').trim(); const key = norm(word);
    if (!word || seen.has(key) || taken.has(key)) continue;
    const segs = String(w.translation || '').split(' · ').map(s => s.trim()).filter(Boolean);
    if (!segs.length) continue;
    let meaning;
    if (norm(segs[0]) === key) meaning = segs[1]; else meaning = segs.length > 1 ? `${segs[0]}: ${segs[1]}` : segs[0];
    if (!meaning) continue;
    seen.add(key);
    const ex = (w.examples && w.examples[0]) || null;
    out.push({ t: word.toLowerCase() === word ? word : word.charAt(0).toLowerCase() + word.slice(1), tipo: 'palabra', resp: cap(meaning.replace(/\s+/g, ' ')), ej: ex ? [ex.en, ex.es] : null, vocab: true });
  }
  return out;
}

/* ---------- fechas estables (lastmod no cambia si el contenido no cambia) ---------- */
const FECHAS_FILE = path.join(__dirname, 'glosario', 'fechas.json');
let fechas = {}; try { fechas = JSON.parse(fs.readFileSync(FECHAS_FILE, 'utf8')); } catch (e) {}
function fechaDe(key, contenido) {
  const h = crypto.createHash('md5').update(contenido).digest('hex').slice(0, 10);
  if (!fechas[key] || fechas[key].h !== h) fechas[key] = { d: TODAY, h };
  return fechas[key].d;
}

/* ---------- piezas HTML compartidas ---------- */
const PRACTICE = { grammar: '/practica.html?skill=grammar', vocabulary: '/practica.html?skill=vocabulary', listening: '/practica.html?skill=listening' };
const TIPO_LABEL = { palabra: 'Palabra', expresion: 'Expresión', phrasal: 'Phrasal verb', diferencia: 'Diferencia', gramatica: 'Gramática' };

function head({ title, desc, canonical, ogType, schema }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#030b1a">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title.replace(/ - Inglés con Leo$/, ''))}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/og-logo.png">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="Inglés con Leo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title.replace(/ - Inglés con Leo$/, ''))}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/og-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css?v=${CSS_V}">
<link rel="stylesheet" href="/glosario/glosario.css?v=${GL_V}">
${schema.map(jsonLd).join('\n')}
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0DRL810MYR"></script>
<script src="/meta-pixel.js"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-0DRL810MYR');
</script>
</head>
<body>
<header>
  <div class="wrap nav">
    <a href="/index.html" class="logo">
      <img src="/logo.png" class="logo-mark" alt="Inglés con Leo" width="40" height="40">
      Inglés con <span class="leo">Leo</span>
    </a>
    <nav class="nav-links">
      <a href="/index.html">Inicio</a>
      <a href="/articulos.html" class="current">Aprende inglés</a>
      <a href="/practica.html">Practicar gratis</a>
      <a href="/miembros.html">Miembros</a>
      <a href="/clases-particulares.html">Clases particulares</a>
      <a href="/index.html#contacto">Contacto</a>
    </nav>
    <a href="/miembros.html" class="btn btn-primary btn-sm nav-cta">Entrar a miembros</a>
    <button class="nav-burger" aria-label="Abrir menú"><span></span></button>
  </div>
</header>
`;
}

const FOOT = `
<footer>
  <div class="wrap foot-row">
    <a href="/index.html" class="logo" style="font-size:1.1rem;"><img src="/logo.png" class="logo-mark" alt="Inglés con Leo" style="width:28px;height:28px;">Inglés con <span class="leo">Leo</span></a>
    <div class="foot-links">
      <a href="/index.html">Inicio</a>
      <a href="/articulos.html">Aprende inglés</a>
      <a href="/glosario-ingles/">Glosario</a>
      <a href="/practica.html">Practicar</a>
      <a href="/miembros.html">Miembros</a>
      <a href="/clases-particulares.html">Clases con Leo</a>
      <a href="/privacidad.html">Privacidad</a>
    </div>
    <div class="foot-copy">© 2026 Inglés con Leo</div>
  </div>
</footer>

<nav class="mobile-nav">
  <a class="mnav-item" href="/index.html">
    <svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
    Inicio
  </a>
  <a class="mnav-item active" href="/articulos.html">
    <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    Aprende inglés
  </a>
  <a class="mnav-item" href="/practica.html">
    <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l3 3 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>
    Practicar
  </a>
  <a class="mnav-item" href="/miembros.html">
    <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="2"/></svg>
    Miembros
  </a>
</nav>
<script src="/glosario/glosario.js?v=${GL_V}"></script>
</body>
</html>
`;

const PLAY_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 2l9 5-9 5V2z" fill="currentColor"/></svg>';
const audioBtn = (src, label) => `<button type="button" class="gl-play" data-audio="${src}" aria-label="${esc(label)}">${PLAY_SVG}<span>Escuchar</span></button>`;

/* ---------- audio ---------- */
const audioManifest = [];
function audioTextFor(t) {
  return t.ej.slice(0, 3).map(e => e[0].trim()).join(' ');
}
function registerAudio(t) {
  audioManifest.push({ term: t.slug, kind: 'frases', file: `audio/glosario/${t.slug}.mp3`, voice: VOICE_A, text: audioTextFor(t) });
  if (t.dialogo) audioManifest.push({ term: t.slug, kind: 'dialogo', file: `audio/glosario/${t.slug}-dialogo.mp3`, voice: `${VOICE_A}|${VOICE_B}`, text: t.dialogo.map(l => '— ' + l[0]).join('\n') });
}

/* ---------- pagina de una entrada ---------- */
function h1Of(t) { return t.tipo === 'diferencia' ? `${cap(t.t)}: diferencia y uso` : `${cap(t.t)}: significado y cómo usarlo`; }

function termPage(t) {
  const url = `${SITE}/glosario/${t.slug}/`;
  const h1 = h1Of(t);
  const title = `${h1} - Inglés con Leo`;
  const suffix = t.tipo === 'diferencia' ? ' Con ejemplos, errores comunes y audio.' : ' Con ejemplos, pronunciación y audio.';
  const desc = trunc(plain(t.resp) + suffix, 158);
  const hasAudio = exists(`audio/glosario/${t.slug}.mp3`);
  const hasDialogAudio = t.dialogo && exists(`audio/glosario/${t.slug}-dialogo.mp3`);
  const arts = [t.art, t.art2].filter(Boolean).map(articleInfo);
  const practice = PRACTICE[t.prac] || '/practica.html';

  const rel = (t.rel || []).map(s => terms.find(x => x.slug === s)).filter(Boolean);
  const body = [];
  body.push(`<nav class="gl-crumbs" aria-label="Migas de pan"><a href="/index.html">Inicio</a> <span aria-hidden="true">›</span> <a href="/glosario-ingles/">Glosario</a> <span aria-hidden="true">›</span> <span>${esc(t.t)}</span></nav>`);
  body.push(`<span class="badge badge-free gl-badge">${TIPO_LABEL[t.tipo]}</span>`);
  body.push(`<h1>${esc(h1)}</h1>`);
  body.push(`<div class="gl-answer"><div class="gl-answer-label">Respuesta rápida</div><p>${md(t.resp)}</p></div>`);
  if (t.pron || hasAudio) {
    body.push(`<div class="gl-pron">${t.pron ? `<span class="gl-pron-text"><span class="gl-pron-label">Se pronuncia</span> <strong>${esc(t.pron)}</strong></span>` : ''}${hasAudio ? audioBtn(`/audio/glosario/${t.slug}.mp3`, `Escuchar ejemplos de ${t.t}`) : ''}</div>`);
  }
  body.push(`<h2>Cómo se usa</h2>`);
  body.push(t.uso.map(p => `<p>${md(p)}</p>`).join('\n'));
  body.push(`<h2>Ejemplos</h2>`);
  body.push(t.ej.map(e => `<div class="article-example"><div class="en">${esc(e[0])}</div><div class="es">${esc(e[1])}</div></div>`).join('\n'));
  if (t.err) {
    body.push(`<h2>Error común</h2>`);
    body.push(`<div class="article-wrong">❌ ${esc(t.err[0])}</div><div class="article-right">✅ ${esc(t.err[1])}</div>`);
    if (t.err[2]) body.push(`<p>${md(t.err[2])}</p>`);
  }
  if (t.truco) { body.push(`<h2>Truco para recordarlo</h2>`); body.push(`<p>${md(t.truco)}</p>`); }
  if (t.dialogo) {
    body.push(`<h2>Mini conversación</h2>`);
    if (hasDialogAudio) body.push(`<div class="gl-pron">${audioBtn(`/audio/glosario/${t.slug}-dialogo.mp3`, `Escuchar la conversación de ${t.t}`)}</div>`);
    body.push(`<div class="gl-dialog">${t.dialogo.map((l, i) => `<div class="gl-line ${i % 2 ? 'b' : 'a'}"><div class="en">${esc(l[0])}</div><div class="es">${esc(l[1])}</div></div>`).join('')}</div>`);
  }
  if (arts.length) {
    body.push(`<div class="gl-fullclass"><div class="gl-fullclass-label">Clase completa</div>${arts.map(a => `<p><a class="inline-link" href="${a.href}">${esc(a.title)}</a></p>`).join('')}<a class="gl-more" href="${arts[0].href}">Ver la clase completa →</a></div>`);
  }
  body.push(`<div class="article-cta"><h3>¿Quieres practicarlo?</h3><p style="color:var(--ink-soft);">Ejercicios cortos y gratis, sin registrarte.</p><a href="${practice}" class="btn btn-primary" style="width:fit-content;">Practicar gratis →</a></div>`);
  if (rel.length) {
    body.push(`<h2 class="gl-rel-title">Mira también</h2><ul class="gl-chips">${rel.map(r => `<li><a href="/glosario/${r.slug}/">${esc(r.t)}</a></li>`).join('')}</ul>`);
  }
  body.push(`<p class="gl-back"><a class="inline-link" href="/glosario-ingles/">← Ver todo el glosario de inglés</a></p>`);

  const schema = [
    { '@context': 'https://schema.org', '@type': 'WebPage', '@id': url, url, name: h1, description: plain(t.resp), inLanguage: 'es',
      isPartOf: { '@type': 'WebSite', name: 'Inglés con Leo', url: SITE + '/' },
      mainEntity: { '@type': 'DefinedTerm', name: t.t, description: plain(t.resp), inDefinedTermSet: SITE + '/glosario-ingles/' },
      dateModified: fechaDe('p:' + t.slug, JSON.stringify(t)) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Glosario de inglés', item: SITE + '/glosario-ingles/' },
      { '@type': 'ListItem', position: 3, name: t.t, item: url } ] }
  ];
  return head({ title, desc, canonical: url, ogType: 'article', schema }) +
    `\n<main>\n  <article class="article-body gl-article">\n    ${body.join('\n    ')}\n  </article>\n</main>\n` + FOOT;
}

/* ---------- indice ---------- */
function indexPage(entries) {
  const url = `${SITE}/glosario-ingles/`;
  const title = 'Glosario de inglés: significado, uso y diferencias - Inglés con Leo';
  const desc = 'Glosario de inglés gratis: significado de palabras y expresiones, diferencias como since vs for o make vs do, phrasal verbs y errores comunes, con ejemplos y audio.';
  const sorted = entries.slice().sort((a, b) => norm(a.t).localeCompare(norm(b.t)));
  const letterOf = e => { const m = norm(e.t).match(/[a-z]/); return m ? m[0].toUpperCase() : '#'; };
  const groups = {};
  for (const e of sorted) (groups[letterOf(e)] = groups[letterOf(e)] || []).push(e);
  const letters = Object.keys(groups).sort();
  const filtros = [['todo', 'Todo'], ['palabra', 'Palabras'], ['expresion', 'Expresiones'], ['phrasal', 'Phrasal verbs'], ['diferencia', 'Diferencias'], ['gramatica', 'Gramática'], ['comun', 'Errores comunes']];

  const row = e => {
    const page = e.page; const art = e.art ? articleInfo(e.art) : null;
    const tags = e.tipo + (e.comun ? ' comun' : '');
    const q = norm([e.t, plain(e.resp), e.slug && e.slug.replace(/-/g, ' ')].join(' '));
    const termHtml = page ? `<a class="gl-term" href="/glosario/${e.slug}/">${esc(e.t)}</a>` : `<span class="gl-term">${esc(e.t)}</span>`;
    const ex = e.ej ? (Array.isArray(e.ej[0]) ? e.ej[0] : e.ej) : null;
    const links = [];
    if (page) links.push(`<a href="/glosario/${e.slug}/">Ver detalle →</a>`);
    if (art) links.push(`<a href="${art.href}">Ver la clase completa →</a>`);
    return `<li class="gl-row" data-tipo="${tags}" data-q="${esc(q)}"${page || e.art ? ` id="${e.slug}"` : ''}><div class="gl-row-top">${termHtml}<span class="gl-tag">${TIPO_LABEL[e.tipo]}</span></div><p class="gl-meaning">${md(e.resp)}</p>${ex ? `<p class="gl-ex"><span class="en">${esc(ex[0])}</span> <span class="es">${esc(ex[1])}</span></p>` : ''}${links.length ? `<p class="gl-links">${links.join(' ')}</p>` : ''}</li>`;
  };

  const sections = letters.map(L => `<section class="gl-letter" id="letra-${L.toLowerCase()}" data-letter="${L}"><h2>${L}</h2><ul class="gl-list">${groups[L].map(row).join('')}</ul></section>`).join('\n');
  const popular = terms.filter(t => t.tipo === 'diferencia').slice(0, 8);
  const pageCount = terms.length;

  const body = `
<main>
  <div class="gl-wrap">
    <nav class="gl-crumbs" aria-label="Migas de pan"><a href="/index.html">Inicio</a> <span aria-hidden="true">›</span> <span>Glosario</span></nav>
    <h1>Glosario de inglés: significado, uso y diferencias</h1>
    <p class="gl-intro">Busca una duda y resuélvela en segundos, con ejemplos, audio y un enlace a la clase completa cuando existe. ${entries.length} entradas y creciendo.</p>
    <div class="gl-search">
      <label for="gl-q" class="gl-sr">Buscar en el glosario</label>
      <input id="gl-q" type="search" placeholder="Busca: although, since vs for, look for..." autocomplete="off" enterkeyhint="search">
    </div>
    <div class="gl-filters" role="group" aria-label="Filtrar por tipo">${filtros.map(f => `<button type="button" class="article-filter${f[0] === 'todo' ? ' active' : ''}" data-filter="${f[0]}" aria-pressed="${f[0] === 'todo'}">${f[1]}</button>`).join('')}</div>
    <nav class="gl-az" aria-label="Ir a una letra">${letters.map(L => `<a href="#letra-${L.toLowerCase()}" data-letter="${L}">${L}</a>`).join('')}</nav>
    <p class="gl-count" id="gl-count" role="status" aria-live="polite"></p>
    <section class="gl-popular">
      <h2>Dudas que más se confunden</h2>
      <ul class="gl-chips">${popular.map(p => `<li><a href="/glosario/${p.slug}/">${esc(p.t)}</a></li>`).join('')}</ul>
    </section>
    <p class="gl-none" id="gl-none" hidden>No encontramos esa palabra. Prueba con otra o <a class="inline-link" href="/practica.html">practica gratis</a>.</p>
    <div id="gl-list">
${sections}
    </div>
    <section class="gl-note" id="como-leer">
      <h2>Cómo leer la pronunciación</h2>
      <p>La sílaba con más fuerza va en MAYÚSCULAS. Es una guía aproximada con letras que ya conoces; para oír el sonido real, usa el botón de audio de cada entrada.</p>
    </section>
    <div class="article-cta"><h3>¿Quieres practicarlo?</h3><p style="color:var(--ink-soft);">Ejercicios cortos de gramática y vocabulario, gratis y sin registrarte.</p><a href="/practica.html" class="btn btn-primary" style="width:fit-content;">Practicar gratis →</a></div>
  </div>
</main>
`;
  const schema = [
    { '@context': 'https://schema.org', '@type': 'CollectionPage', '@id': url, url, name: 'Glosario de inglés', description: desc, inLanguage: 'es',
      isPartOf: { '@type': 'WebSite', name: 'Inglés con Leo', url: SITE + '/' },
      mainEntity: { '@type': 'ItemList', numberOfItems: pageCount, itemListElement: terms.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/glosario/${t.slug}/`, name: t.t })) } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Glosario de inglés', item: url } ] }
  ];
  return head({ title, desc, canonical: url, ogType: 'website', schema }) + body + FOOT;
}

/* ============ construccion ============ */
const entries = [];
for (const t of terms) entries.push(Object.assign({}, t, { page: true }));
for (const e of extras) entries.push(Object.assign({}, e, { page: false }));
const vocab = vocabEntries();
for (const v of vocab) entries.push(v);

for (const t of terms) { write(`glosario/${t.slug}/index.html`, termPage(t)); registerAudio(t); }
write('glosario-ingles/index.html', indexPage(entries));
write('tools/glosario/audio_manifest.json', JSON.stringify(audioManifest, null, 1));
fs.writeFileSync(FECHAS_FILE, JSON.stringify(fechas, null, 1));

/* ---------- sitemap ---------- */
const indexDate = fechaDe('index', JSON.stringify(entries.map(e => [e.t, e.resp, e.art])));
fs.writeFileSync(FECHAS_FILE, JSON.stringify(fechas, null, 1));
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8').split('\n').filter(l => !/\/glosario/.test(l)).join('\n');
const urls = [{ loc: `${SITE}/glosario-ingles/`, d: indexDate }].concat(terms.map(t => ({ loc: `${SITE}/glosario/${t.slug}/`, d: fechas['p:' + t.slug].d })));
sm = sm.replace('</urlset>', urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.d}</lastmod></url>`).join('\n') + '\n</urlset>');
fs.writeFileSync(smPath, sm);
write('tools/glosario/indexnow_urls.json', JSON.stringify(urls.map(u => u.loc), null, 1));

console.log(`Glosario: ${terms.length} paginas propias, ${extras.length} entradas con clase, ${vocab.length} palabras del curso, ${entries.length} entradas en el indice.`);
console.log(`Audios en la lista: ${audioManifest.length} (${audioManifest.filter(a => exists(a.file)).length} ya existen).`);
