#!/usr/bin/env node
/* Consulta manual de URL Inspection. Nunca solicita indexación ni modifica GSC. */
const { google } = require('googleapis');
const { glossaryUrls, normalizeUrl, sleep, writeReport } = require('./glossary-common');

const START_INTERVAL_MS = 334; // máximo aproximado de 3 inspecciones por segundo.
const MAX_ATTEMPTS = 2;
const REQUEST_TIMEOUT_MS = 15000;

function requestedLimit() {
  const environmentValue = process.env.GSC_URL_LIMIT;
  const marker = process.argv.indexOf('--limit');
  if (environmentValue === undefined && marker === -1) return null;
  const value = Number(environmentValue === undefined ? process.argv[marker + 1] : environmentValue);
  if (!Number.isInteger(value) || value < 1) throw new Error('Define GSC_URL_LIMIT con un entero positivo, por ejemplo: GSC_URL_LIMIT=1.');
  return value;
}

async function withTimeout(work, label) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    return await work(controller.signal);
  } catch (error) {
    if (timedOut || error?.name === 'AbortError') {
      const timeout = new Error(`${label} superó el timeout de ${REQUEST_TIMEOUT_MS / 1000} s.`);
      timeout.code = 'ETIMEDOUT';
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function configError(message) {
  console.error(`GSC no configurado: ${message}`);
  console.error('Define GSC_SERVICE_ACCOUNT_JSON con el JSON completo de una service account con acceso Full user a la propiedad de Search Console (no Owner).');
  process.exitCode = 2;
}

function parseCredentials() {
  if (!process.env.GSC_SERVICE_ACCOUNT_JSON) return null;
  try { return JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON); }
  catch (_) { throw new Error('GSC_SERVICE_ACCOUNT_JSON no contiene JSON válido.'); }
}

function enforceTransportTimeout(client) {
  const transporter = client?.transporter;
  if (!transporter?.request || transporter.__glossaryTimeoutInstalled) return;
  const request = transporter.request.bind(transporter);
  transporter.request = options => withTimeout(
    signal => request({ ...options, signal, retry: false }),
    `HTTP de Google (${options?.url || 'sin URL'})`
  );
  transporter.__glossaryTimeoutInstalled = true;
}

async function verifyAuthentication(auth) {
  console.log('Comprobando autenticación de la service account…');
  const client = await withTimeout(() => auth.getClient(), 'Crear el cliente de autenticación');
  // GoogleAuth reutiliza este cliente para token y API; así el AbortSignal
  // también protege la petición interna de token, no solo URL Inspection.
  enforceTransportTimeout(client);
  await withTimeout(() => client.getAccessToken(), 'Obtener el token de acceso');
  console.log('OK — autenticación válida.');
}

async function resolveProperty(searchconsole) {
  const configured = process.env.GSC_SITE_URL;
  console.log('Comprobando acceso a la propiedad de Search Console…');
  const entries = (await withTimeout(
    signal => searchconsole.sites.list({}, { signal, retry: false }),
    'Consultar propiedades de Search Console'
  )).data.siteEntry || [];
  const available = new Set(entries.map(entry => entry.siteUrl));
  if (configured) {
    if (!available.has(configured)) throw new Error(`GSC_SITE_URL no está disponible para esta credencial: ${configured}`);
    console.log(`OK — acceso confirmado a ${configured}.`);
    return configured;
  }
  const candidates = ['sc-domain:inglesconleo.com', 'https://inglesconleo.com/'].filter(site => available.has(site));
  if (candidates.length === 1) {
    console.log(`OK — acceso confirmado a ${candidates[0]}.`);
    return candidates[0];
  }
  if (!candidates.length) throw new Error('No se encontró la propiedad sc-domain:inglesconleo.com ni https://inglesconleo.com/. Define GSC_SITE_URL con la propiedad exacta.');
  throw new Error(`Hay más de una propiedad compatible (${candidates.join(', ')}). Define GSC_SITE_URL explícitamente.`);
}

function apiStatus(error) {
  return error?.code || error?.response?.status || 0;
}

async function inspectWithRetry(searchconsole, url, siteUrl) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await withTimeout(
        signal => searchconsole.urlInspection.index.inspect(
          { requestBody: { inspectionUrl: url, siteUrl, languageCode: 'es-419' } },
          { signal, retry: false }
        ),
        `URL Inspection (${url})`
      );
      return { url, result: response.data.inspectionResult || {}, attempts: attempt + 1 };
    } catch (error) {
      const status = apiStatus(error);
      const transient = status === 408 || status === 429 || status >= 500 || status === 0 || ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'].includes(error?.code);
      if (!transient || attempt === MAX_ATTEMPTS - 1) return { url, error: { status, message: error.message }, attempts: attempt + 1 };
      await sleep((1000 * (2 ** attempt)) + Math.floor(Math.random() * 250));
    }
  }
}

function classification(item = {}) {
  if (item.error) return 'apiError';
  const index = item.result?.indexStatusResult || {};
  if (index.verdict === 'PASS') return 'indexed';
  if (index.verdict === 'FAIL' || index.verdict === 'NEUTRAL') return 'notIndexed';
  return 'unknown';
}

function canonicalState(item = {}) {
  // Se ejecuta después de compact(): los campos ya no viven en result.indexStatusResult.
  if (item.error || item.apiError) return 'unknown';
  if (!item.googleCanonical || !item.userCanonical) return 'unknown';
  return normalizeUrl(item.googleCanonical) === normalizeUrl(item.userCanonical) ? 'match' : 'different';
}

function compact(item = {}) {
  const index = item.result?.indexStatusResult || {};
  return {
    url: item.url, classification: classification(item), apiError: item.error || null,
    verdict: index.verdict || null, coverageState: index.coverageState || null,
    robotsTxtState: index.robotsTxtState || null, indexingState: index.indexingState || null,
    lastCrawlTime: index.lastCrawlTime || null, pageFetchState: index.pageFetchState || null,
    userCanonical: index.userCanonical || null, googleCanonical: index.googleCanonical || null,
    sitemap: index.sitemap || [], referringUrls: index.referringUrls || [], attempts: item.attempts
  };
}

function markdown(summary, results) {
  const lines = [
    '# GOOGLE INDEX — GLOSARIO', '', `Generado: ${summary.generatedAt}`, `Propiedad: ${summary.siteUrl}`, '',
    `- URLs consultadas: ${summary.total}`, `- Indexadas: ${summary.indexed}`,
    `- No indexadas: ${summary.notIndexed}`, `- Estado desconocido: ${summary.unknown}`,
    `- Errores API: ${summary.apiErrors}`, '', '## CANONICALS', '',
    `- Google coincide con canonical declarado: ${summary.canonicalMatch}`,
    `- Google eligió otro canonical: ${summary.canonicalDifferent}`,
    `- Sin información: ${summary.canonicalUnknown}`, '', '## RASTREO', '',
    `- Rastreadas alguna vez: ${summary.crawled}`, `- Sin lastCrawlTime: ${summary.notCrawled}`, ''
  ];
  const add = (title, list, formatter) => {
    if (!list.length) return;
    lines.push(`## ${title}`, '');
    for (const item of list) lines.push(formatter(item), '');
  };
  add('NO INDEXADAS', results.filter(x => x.classification === 'notIndexed'), item =>
    `### ${item.url}\n- Estado Google: ${item.coverageState || 'sin información'}\n- Verdict: ${item.verdict || 'sin información'}\n- Último rastreo: ${item.lastCrawlTime || 'sin información'}\n- Fetch: ${item.pageFetchState || 'sin información'}\n- Canonical declarado: ${item.userCanonical || 'sin información'}\n- Canonical Google: ${item.googleCanonical || 'sin información'}`);
  add('PROBLEMAS DE CANONICAL', results.filter(x => x.canonicalState === 'different'), item =>
    `### ${item.url}\n- Declarado: ${item.userCanonical}\n- Google: ${item.googleCanonical}\n- Estado Google: ${item.coverageState || 'sin información'}`);
  add('ERRORES', results.filter(x => x.classification === 'apiError'), item =>
    `### ${item.url}\n- HTTP/API: ${item.apiError.status || 'red'}\n- Error: ${item.apiError.message}`);
  return lines.join('\n') + '\n';
}

async function main() {
  let credentials;
  try { credentials = parseCredentials(); } catch (error) { return configError(error.message); }
  if (!credentials) return configError('falta la variable de entorno GSC_SERVICE_ACCOUNT_JSON.');
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  try { await verifyAuthentication(auth); }
  catch (error) { return configError(`no se pudo autenticar: ${error.message}`); }
  let siteUrl;
  try { siteUrl = await resolveProperty(searchconsole); }
  catch (error) { return configError(error.message); }
  const limit = requestedLimit();
  const urls = limit ? glossaryUrls().slice(0, limit) : glossaryUrls();
  console.log(`Consultando ${urls.length} URL(s) en Google Search Console para ${siteUrl}…`);
  const results = [];
  for (let index = 0; index < urls.length; index++) {
    const started = Date.now();
    console.log(`[${index + 1}/${urls.length}] ${urls[index]}`);
    const item = compact(await inspectWithRetry(searchconsole, urls[index], siteUrl));
    results.push(item);
    if (item.apiError) console.error(`ERROR temporal — ${item.apiError.status || 'red'}: ${item.apiError.message}`);
    else console.log(`OK — ${item.classification}${item.coverageState ? ` (${item.coverageState})` : ''}`);
    const remaining = START_INTERVAL_MS - (Date.now() - started);
    if (remaining > 0 && index < urls.length - 1) await sleep(remaining);
  }
  for (const item of results) item.canonicalState = canonicalState(item);
  const summary = {
    generatedAt: new Date().toISOString(), siteUrl, total: results.length,
    indexed: results.filter(x => x.classification === 'indexed').length,
    notIndexed: results.filter(x => x.classification === 'notIndexed').length,
    unknown: results.filter(x => x.classification === 'unknown').length,
    apiErrors: results.filter(x => x.classification === 'apiError').length,
    canonicalMatch: results.filter(x => x.canonicalState === 'match').length,
    canonicalDifferent: results.filter(x => x.canonicalState === 'different').length,
    canonicalUnknown: results.filter(x => x.canonicalState === 'unknown').length,
    crawled: results.filter(x => x.lastCrawlTime).length,
    notCrawled: results.filter(x => !x.lastCrawlTime).length
  };
  writeReport('GSC_GLOSSARY_REPORT', { summary, results }, markdown(summary, results));
  console.log(markdown(summary, results));
  if (summary.apiErrors) process.exitCode = 1;
}

main().catch(error => { console.error('Error inesperado de GSC:', error.message); process.exitCode = 1; });
