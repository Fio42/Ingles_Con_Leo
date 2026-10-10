/* Pruebas de tools/site-health/lh-detail.js (detalle e historial de Lighthouse). Sin red. */
const assert = require('assert');
const path = require('path');
const d = require(path.join(__dirname, '..', 'site-health', 'lh-detail.js'));
let ok = 0;
function test(name, fn){ try{ fn(); ok++; console.log('  ok  ' + name); }catch(e){ console.log('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; } }

const page = { slug: 'p', url: 'https://inglesconleo.com/p.html', label: 'P' };
const raw = {
  fetchTime: '2026-10-09T00:00:00Z', lighthouseVersion: '12.8.2', userAgent: 'Mozilla Chrome/153.0.0.0 Mobile',
  configSettings: { formFactor: 'mobile', throttlingMethod: 'simulate', throttling: { rttMs: 150, throughputKbps: 1638, cpuSlowdownMultiplier: 4 } },
  environment: { benchmarkIndex: 4600 }, runWarnings: ['aviso'], timing: { total: 7000 },
  audits: {
    'largest-contentful-paint': { numericValue: 3000.4 },
    'largest-contentful-paint-element': { details: { items: [
      { type: 'table', items: [{ node: { selector: 'main > p.lead', snippet: '<p class="lead">', nodeLabel: 'Hola' } }] },
      { type: 'table', items: [{ phase: 'TTFB', timing: 600 }, { phase: 'Render Delay', timing: 2000 }] } ] } },
    'render-blocking-resources': { details: { items: [{ url: 'https://inglesconleo.com/style.css', wastedMs: 300, totalBytes: 2048 }] } },
    'network-requests': { details: { items: [
      { url: 'https://inglesconleo.com/a.js', networkRequestTime: 0, networkEndTime: 100, transferSize: 1024, resourceType: 'Script', statusCode: 200 },
      { url: 'https://www.googletagmanager.com/gtag/js', networkRequestTime: 0, networkEndTime: 500, transferSize: 2048, resourceType: 'Script', statusCode: 200 } ] } },
    'third-party-summary': { details: { items: [{ entity: 'Google Tag Manager', blockingTime: 10, transferSize: 2048 }] } },
  },
};
const sum = { performance: 80, seo: 100, accessibility: 90, bestPractices: 100 };

test('extractDetail guarda el elemento del LCP, sus fases y las condiciones', () => {
  const r = d.extractDetail(raw, page, sum);
  assert.strictEqual(r.lcpElement.selector, 'main > p.lead');
  assert.deepStrictEqual(r.lcpPhases, { TTFB: 600, 'Render Delay': 2000 });
  assert.strictEqual(r.metrics.lcp, 3000);
  assert.strictEqual(r.renderBlocking[0].wastedMs, 300);
  assert.strictEqual(r.slowestRequests[0].thirdParty, true);
  assert.strictEqual(r.slowestRequests[0].ms, 500);
  assert.deepStrictEqual([r.conditions.formFactor, r.conditions.cpuSlowdown, r.conditions.benchmarkIndex, r.conditions.chrome], ['mobile', 4, 4600, 'Chrome/153.0.0.0']);
});
test('extractDetail no truena con un JSON casi vacío', () => {
  const r = d.extractDetail({}, page, sum);
  assert.strictEqual(r.lcpElement, null); assert.deepStrictEqual(r.renderBlocking, []); assert.strictEqual(r.metrics.lcp, null);
});
test('addRecords no duplica la misma corrida y recorta a HISTORY_CAP', () => {
  const h = { pages: {} };
  const r = d.extractDetail(raw, page, sum);
  assert.strictEqual(d.addRecords(h, [r]), 1);
  assert.strictEqual(d.addRecords(h, [r]), 0);
  for (let i = 0; i < d.HISTORY_CAP + 5; i++) d.addRecords(h, [{ slug: 'p', fetchTime: 't' + i, performance: 50 }]);
  assert.strictEqual(h.pages.p.length, d.HISTORY_CAP);
});
test('assessVariation: sin datos suficientes no opina', () => {
  assert.strictEqual(d.assessVariation([{ performance: 90 }], { performance: 50 }).verdict, 'sin-datos');
});
test('assessVariation: un valor ya visto es ruido; uno peor que todo lo visto es real', () => {
  const prev = [90, 60, 88, 92, 57].map((p) => ({ performance: p }));
  assert.strictEqual(d.assessVariation(prev, { performance: 58 }).verdict, 'ruido');
  assert.strictEqual(d.assessVariation(prev, { performance: 30 }).verdict, 'real');
});
test('loadHistory con archivo inexistente o dañado devuelve un historial vacío', () => {
  assert.deepStrictEqual(d.loadHistory('/no/existe.json'), { version: 1, pages: {} });
});
test('detailLines produce líneas cortas con LCP, bloqueos y condiciones', () => {
  const lines = d.detailLines(d.extractDetail(raw, page, sum), null).join('\n');
  assert(/LCP 3000ms/.test(lines) && /style\.css/.test(lines) && /CPU x4/.test(lines));
});
console.log('\n' + ok + ' pruebas correctas');
