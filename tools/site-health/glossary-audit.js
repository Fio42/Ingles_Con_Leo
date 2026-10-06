#!/usr/bin/env node
/* Auditoría técnica de solo lectura para las URLs reales del glosario. */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const {
  ROOT, SITE, glossaryTerms, glossaryUrls, normalizeUrl, extractCanonical,
  isNoindex, writeReport, mapConcurrent
} = require('./glossary-common');

const TIMEOUT_MS = 15000;
const CONCURRENCY = 6;

function sitemapUrls() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls = [];
  $('url > loc').each((_, el) => urls.push($(el).text().trim()));
  return { xml, urls, valid: $.root().find('parsererror').length === 0 };
}

function robotsAllows(url) {
  const text = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  const pathname = new URL(url).pathname;
  const lines = text.split(/\r?\n/).map(line => line.replace(/#.*/, '').trim());
  let applies = false;
  const rules = [];
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1].toLowerCase(); const value = match[2].trim();
    if (key === 'user-agent') applies = value === '*';
    if (applies && (key === 'allow' || key === 'disallow') && value) rules.push({ key, value });
  }
  const matching = rules.filter(rule => pathname.startsWith(rule.value));
  if (!matching.length) return true;
  matching.sort((a, b) => b.value.length - a.value.length || (a.key === 'allow' ? -1 : 1));
  return matching[0].key === 'allow';
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { redirect: 'manual', signal: controller.signal });
    const html = await response.text();
    return {
      url, status: response.status, redirect: response.headers.get('location') || '',
      canonical: extractCanonical(html), noindex: isNoindex(html, { 'x-robots-tag': response.headers.get('x-robots-tag') || '' }),
      xRobotsTag: response.headers.get('x-robots-tag') || '', soft404Marker: /page not found|404 not found/i.test(html)
    };
  } catch (error) {
    return { url, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

function markdown(summary, problems) {
  const lines = [
    '# GLOSARIO SEO', '',
    `Generado: ${summary.generatedAt}`, '',
    `- Total páginas encontradas: ${summary.total}`, `- Indexables: ${summary.indexable}`,
    `- En sitemap: ${summary.inSitemap}`, `- HTTP 200: ${summary.http200}`,
    `- Canonical correcto: ${summary.canonicalCorrect}`, `- Noindex: ${summary.noindex}`,
    `- Bloqueadas robots: ${summary.blockedRobots}`, `- Huérfanas: ${summary.orphans}`,
    `- Redirects: ${summary.redirects}`, `- 404: ${summary.notFound}`, `- Errores: ${summary.errors}`, ''
  ];
  if (!problems.length) lines.push('Sin problemas detectados.');
  else {
    lines.push('## Problemas', '');
    for (const problem of problems) lines.push(`- ${problem.url || problem.slug} — ${problem.reason}`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const terms = glossaryTerms();
  const urls = glossaryUrls();
  const { xml, urls: sitemap, valid } = sitemapUrls();
  const sitemapSet = new Set(sitemap.map(normalizeUrl));
  const expectedUrlSet = new Set(urls.map(normalizeUrl));
  const indexHtml = fs.readFileSync(path.join(ROOT, 'glosario-ingles', 'index.html'), 'utf8');
  const expectedTerms = new Set(terms.map(term => term.slug));
  const actualDirs = fs.readdirSync(path.join(ROOT, 'glosario'), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);
  const problems = [];

  if (!valid) problems.push({ slug: 'sitemap.xml', reason: 'XML inválido.' });
  const duplicateSitemap = sitemap.filter((url, index) => sitemap.indexOf(url) !== index);
  if (duplicateSitemap.length) problems.push({ slug: 'sitemap.xml', reason: `${new Set(duplicateSitemap).size} URL(s) duplicada(s).` });
  const glossarySitemap = sitemap.filter(url => url.includes('/glosario/') || url.includes('/glosario-ingles/'));
  const staleSitemapUrls = glossarySitemap.filter(url => !expectedUrlSet.has(normalizeUrl(url)));
  const unexpectedDirs = actualDirs.filter(slug => !expectedTerms.has(slug));
  if (unexpectedDirs.length) problems.push({ slug: 'glosario/', reason: `Directorios sin fuente: ${unexpectedDirs.join(', ')}` });
  for (const url of staleSitemapUrls) problems.push({ url, reason: 'Aparece en sitemap.xml, pero no existe en la fuente de verdad del glosario.' });

  const local = urls.map((url, index) => {
    if (index === 0) return { url, file: path.join(ROOT, 'glosario-ingles', 'index.html'), slug: 'glosario-ingles' };
    const term = terms[index - 1];
    return { url, file: path.join(ROOT, 'glosario', term.slug, 'index.html'), slug: term.slug };
  });
  for (const page of local) {
    const exists = fs.existsSync(page.file);
    const html = exists ? fs.readFileSync(page.file, 'utf8') : '';
    page.exists = exists;
    page.canonical = extractCanonical(html);
    page.noindex = isNoindex(html);
    page.inSitemap = sitemapSet.has(normalizeUrl(page.url));
    page.robotsAllowed = robotsAllows(page.url);
    page.linked = page.slug === 'glosario-ingles'
      ? /href=["'](?:\/)?glosario-ingles\//.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) || /href=["'](?:\/)?glosario-ingles\//.test(fs.readFileSync(path.join(ROOT, 'articulos.html'), 'utf8'))
      : indexHtml.includes(`href="/glosario/${page.slug}/"`);
    if (!exists) problems.push({ url: page.url, reason: 'Falta el HTML generado.' });
    if (!page.inSitemap) problems.push({ url: page.url, reason: 'No aparece en sitemap.xml.' });
    if (page.canonical !== page.url) problems.push({ url: page.url, reason: `Canonical local incorrecto: ${page.canonical || 'ausente'}.` });
    if (page.noindex) problems.push({ url: page.url, reason: 'Tiene noindex.' });
    if (!page.robotsAllowed) problems.push({ url: page.url, reason: 'Bloqueada por robots.txt.' });
    if (!page.linked) problems.push({ url: page.url, reason: 'No tiene enlace interno normal.' });
  }

  console.log(`Comprobando ${urls.length} URL(s) publicadas…`);
  const remote = await mapConcurrent(urls, CONCURRENCY, fetchPage);
  for (const page of remote) {
    if (page.error) problems.push({ url: page.url, reason: `Error HTTP: ${page.error}.` });
    else if (page.status !== 200) problems.push({ url: page.url, reason: page.redirect ? `Redirect ${page.status} a ${page.redirect}.` : `HTTP ${page.status}.` });
    else if (page.canonical !== page.url) problems.push({ url: page.url, reason: `Canonical publicado incorrecto: ${page.canonical || 'ausente'}.` });
    else if (page.noindex) problems.push({ url: page.url, reason: 'Noindex publicado.' });
    else if (page.soft404Marker) problems.push({ url: page.url, reason: 'Posible soft 404.' });
  }

  const summary = {
    generatedAt: new Date().toISOString(), total: urls.length,
    indexable: local.filter(p => p.exists && p.inSitemap && p.canonical === p.url && !p.noindex && p.robotsAllowed).length,
    inSitemap: local.filter(p => p.inSitemap).length, http200: remote.filter(p => p.status === 200).length,
    canonicalCorrect: remote.filter(p => p.status === 200 && p.canonical === p.url).length,
    noindex: new Set([...local.filter(p => p.noindex), ...remote.filter(p => p.noindex)].map(p => p.url)).size,
    blockedRobots: local.filter(p => !p.robotsAllowed).length,
    orphans: local.filter(p => !p.linked).length, redirects: remote.filter(p => p.redirect).length,
    notFound: remote.filter(p => p.status === 404).length,
    errors: problems.length, sitemapGlossaryUrls: glossarySitemap.length, sitemapXmlValid: valid
  };
  const report = { summary, source: { terms: terms.length, expectedUrls: urls, sitemapGlossaryUrls: glossarySitemap, unexpectedDirs, staleSitemapUrls }, local, remote, problems };
  writeReport('GLOSSARY_AUDIT_REPORT', report, markdown(summary, problems));
  console.log(markdown(summary, problems));
  process.exitCode = problems.length ? 1 : 0;
}

main().catch(error => { console.error('Error inesperado:', error.message); process.exitCode = 1; });
