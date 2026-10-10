/* ============================================================
   Inglés con Leo — detalle e historial de Lighthouse (Site Health)
   ------------------------------------------------------------
   Lo usa audit.js. NO toca el sitio: solo lee los JSON crudos que deja
   run-lighthouse.js y guarda un resumen compacto de cada corrida en
   tools/site-health/lighthouse-history.json (máx. HISTORY_CAP corridas por
   página) para poder comparar y distinguir problemas reales de ruido del
   simulador.

   Cada registro guarda: puntajes y métricas, el elemento responsable del
   LCP y sus fases, los recursos que bloquean el render, las peticiones más
   lentas y las condiciones de la medición (versión de Lighthouse, tipo de
   dispositivo, throttling, benchmarkIndex de la máquina, avisos).
   ============================================================ */

const fs = require('fs');

const HISTORY_CAP = 40;       // corridas guardadas por página
const MIN_SAMPLES = 4;        // corridas previas mínimas para opinar sobre ruido
const MARGIN = 5;             // puntos de margen para decir "dentro de lo ya visto"

const num = (n, d = 0) => (typeof n === 'number' && isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);
const cut = (s, n) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').slice(0, n) : null);

function hostOf(u) {
  try { return new URL(u).host; } catch (e) { return ''; }
}

function shortUrl(u) {
  try {
    const x = new URL(u);
    return cut(x.host + x.pathname, 90);
  } catch (e) { return cut(u, 90); }
}

function lcpElementAndPhases(audits) {
  const out = { element: null, phases: null };
  const d = audits['largest-contentful-paint-element'] && audits['largest-contentful-paint-element'].details;
  const tables = d && Array.isArray(d.items) ? d.items : [];
  for (const t of tables) {
    const items = Array.isArray(t.items) ? t.items : [];
    if (items[0] && items[0].node && !out.element) {
      const n = items[0].node;
      out.element = { selector: cut(n.selector, 100), snippet: cut(n.snippet, 140), label: cut(n.nodeLabel, 80) };
    }
    if (items[0] && items[0].phase && !out.phases) {
      out.phases = {};
      for (const it of items) out.phases[cut(it.phase, 30)] = num(it.timing);
    }
  }
  return out;
}

function renderBlocking(audits) {
  const items = audits['render-blocking-resources'] && audits['render-blocking-resources'].details && audits['render-blocking-resources'].details.items;
  return (items || []).slice(0, 6).map((i) => ({ url: shortUrl(i.url), wastedMs: num(i.wastedMs), bytes: num(i.totalBytes) }));
}

function slowestRequests(audits, pageHost) {
  const items = audits['network-requests'] && audits['network-requests'].details && audits['network-requests'].details.items;
  return (items || [])
    .filter((i) => typeof i.networkEndTime === 'number' && typeof i.networkRequestTime === 'number' && i.networkEndTime >= i.networkRequestTime)
    .map((i) => ({
      url: shortUrl(i.url),
      ms: num(i.networkEndTime - i.networkRequestTime),
      kb: num((i.transferSize || 0) / 1024),
      type: i.resourceType || null,
      status: i.statusCode || null,
      thirdParty: hostOf(i.url) !== pageHost,
    }))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 5);
}

function thirdParties(audits) {
  const items = audits['third-party-summary'] && audits['third-party-summary'].details && audits['third-party-summary'].details.items;
  return (items || []).slice(0, 4).map((i) => ({
    entity: cut(typeof i.entity === 'string' ? i.entity : (i.entity && i.entity.text) || '', 40),
    blockingMs: num(i.blockingTime),
    kb: num((i.transferSize || 0) / 1024),
  }));
}

function conditions(raw) {
  const cs = raw.configSettings || {};
  const th = cs.throttling || {};
  const env = raw.environment || {};
  return {
    lighthouse: raw.lighthouseVersion || null,
    formFactor: cs.formFactor || null,
    throttlingMethod: cs.throttlingMethod || null,
    rttMs: num(th.rttMs),
    throughputKbps: num(th.throughputKbps),
    cpuSlowdown: num(th.cpuSlowdownMultiplier, 1),
    benchmarkIndex: num(env.benchmarkIndex),
    chrome: (((raw.userAgent || env.hostUserAgent || '').match(/Chrome\/[\d.]+/)) || [null])[0],
    warnings: (raw.runWarnings || []).slice(0, 3).map((w) => cut(String(w), 120)),
    runtimeError: raw.runtimeError ? cut(raw.runtimeError.message || String(raw.runtimeError.code), 120) : null,
    finalUrl: cut(raw.finalDisplayedUrl || raw.finalUrl, 120),
    durationMs: num(raw.timing && raw.timing.total),
  };
}

/** Resumen compacto de un JSON crudo de Lighthouse. */
function extractDetail(raw, page, summary) {
  const audits = raw.audits || {};
  const metric = (id) => (audits[id] ? num(audits[id].numericValue) : null);
  const pageHost = hostOf(page.url);
  const lcp = lcpElementAndPhases(audits);
  return {
    slug: page.slug,
    url: page.url,
    fetchTime: raw.fetchTime || null,
    performance: summary.performance,
    seo: summary.seo,
    accessibility: summary.accessibility,
    bestPractices: summary.bestPractices,
    metrics: {
      fcp: metric('first-contentful-paint'),
      lcp: metric('largest-contentful-paint'),
      tbt: metric('total-blocking-time'),
      cls: audits['cumulative-layout-shift'] ? num(audits['cumulative-layout-shift'].numericValue, 3) : null,
      speedIndex: metric('speed-index'),
      ttfb: metric('server-response-time'),
      pageKb: audits['total-byte-weight'] ? num(audits['total-byte-weight'].numericValue / 1024) : null,
    },
    lcpElement: lcp.element,
    lcpPhases: lcp.phases,
    renderBlocking: renderBlocking(audits),
    slowestRequests: slowestRequests(audits, pageHost),
    thirdParties: thirdParties(audits),
    conditions: conditions(raw),
  };
}

function loadHistory(file) {
  try {
    const h = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (h && typeof h === 'object' && h.pages) return h;
  } catch (e) { /* sin historial todavía o archivo dañado: se empieza de cero */ }
  return { version: 1, pages: {} };
}

/** Agrega registros nuevos (sin duplicar por fetchTime) y recorta a HISTORY_CAP. */
function addRecords(history, records) {
  let added = 0;
  for (const r of records) {
    const list = (history.pages[r.slug] = history.pages[r.slug] || []);
    if (r.fetchTime && list.some((x) => x.fetchTime === r.fetchTime)) continue;
    list.push(r);
    added++;
    if (list.length > HISTORY_CAP) list.splice(0, list.length - HISTORY_CAP);
  }
  return added;
}

function median(a) {
  const s = a.slice().sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * ¿La variación de este puntaje es ruido o algo real?
 * prevRecords: corridas ANTERIORES de la misma página (sin la actual).
 * Regla simple y explicable:
 *  - menos de MIN_SAMPLES corridas previas: "sin-datos" (no se opina)
 *  - el valor actual ya se vio antes (>= mínimo previo - MARGIN): "ruido"
 *  - es peor que todo lo visto: "real"
 */
function assessVariation(prevRecords, current, cat = 'performance') {
  const vals = prevRecords.map((r) => r[cat]).filter((v) => typeof v === 'number');
  if (vals.length < MIN_SAMPLES || typeof current[cat] !== 'number') {
    return { verdict: 'sin-datos', samples: vals.length, text: `Aún hay pocas corridas guardadas (${vals.length} de ${MIN_SAMPLES} necesarias) para saber si es ruido.` };
  }
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const med = median(vals);
  const range = `en las últimas ${vals.length} corridas osciló entre ${min} y ${max} (mediana ${med})`;
  const bm = prevRecords.map((r) => r.conditions && r.conditions.benchmarkIndex).filter((v) => typeof v === 'number');
  let cond = '';
  const cb = current.conditions && current.conditions.benchmarkIndex;
  if (bm.length && typeof cb === 'number' && Math.abs(cb - median(bm)) / median(bm) > 0.25) {
    cond = ' La máquina de medición fue distinta a la habitual (benchmarkIndex).';
  }
  if (current[cat] >= min - MARGIN) {
    return { verdict: 'ruido', samples: vals.length, text: `Probable ruido de medición: ${range}; este valor (${current[cat]}) ya se había visto.${cond}` };
  }
  return { verdict: 'real', samples: vals.length, text: `Peor que todo lo visto: ${range}; este valor (${current[cat]}) es nuevo.${cond}` };
}

/** Líneas cortas de markdown con el detalle de una corrida. */
function detailLines(rec, variation) {
  const m = rec.metrics || {};
  const lines = [];
  const el = rec.lcpElement;
  const ph = rec.lcpPhases;
  let l = `- ${rec.slug}: LCP ${m.lcp != null ? Math.round(m.lcp) + 'ms' : '-'}`;
  if (el) l += ` en \`${(el.selector || el.snippet || el.label || '').slice(0, 70)}\``;
  if (ph) l += ` (${Object.entries(ph).map(([k, v]) => `${k} ${v}ms`).join(', ')})`;
  lines.push(l);
  if (rec.renderBlocking && rec.renderBlocking.length) {
    lines.push(`  - Bloquean el render: ${rec.renderBlocking.slice(0, 3).map((r) => `${r.url} (${r.wastedMs}ms)`).join('; ')}`);
  }
  if (rec.slowestRequests && rec.slowestRequests.length) {
    lines.push(`  - Peticiones más lentas: ${rec.slowestRequests.slice(0, 3).map((r) => `${r.url} ${r.ms}ms${r.thirdParty ? ' (tercero)' : ''}`).join('; ')}`);
  }
  const c = rec.conditions || {};
  lines.push(`  - Condiciones: ${c.formFactor || '?'}, ${c.throttlingMethod || '?'}, CPU x${c.cpuSlowdown ?? '?'}, RTT ${c.rttMs ?? '?'}ms, benchmark ${c.benchmarkIndex ?? '?'}, Lighthouse ${c.lighthouse || '?'}`);
  if (variation) lines.push(`  - Variación: ${variation.text}`);
  return lines;
}

module.exports = { HISTORY_CAP, MIN_SAMPLES, extractDetail, loadHistory, addRecords, assessVariation, detailLines };
