/* Utilidades compartidas para auditorías del glosario. No modifican el sitio. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = 'https://inglesconleo.com';
const REPORTS = path.join(__dirname, 'reports');

function glossaryTerms() {
  return require(path.join(ROOT, 'tools', 'glosario', 'terminos.js'));
}

function glossaryUrls() {
  return [
    `${SITE}/glosario-ingles/`,
    ...glossaryTerms().map(term => `${SITE}/glosario/${term.slug}/`)
  ];
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '') + '/';
    return url.toString();
  } catch (_) {
    return String(value || '');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractCanonical(html) {
  return (String(html).match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) || [, ''])[1];
}

function isNoindex(html, headers = {}) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*\bnoindex\b/i.test(String(html)) ||
    /\bnoindex\b/i.test(String(headers['x-robots-tag'] || ''));
}

function writeReport(name, data, markdown) {
  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(path.join(REPORTS, `${name}.json`), JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(REPORTS, `${name}.md`), markdown, 'utf8');
}

async function mapConcurrent(items, concurrency, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return output;
}

module.exports = { ROOT, SITE, REPORTS, glossaryTerms, glossaryUrls, normalizeUrl, sleep, extractCanonical, isNoindex, writeReport, mapConcurrent };
