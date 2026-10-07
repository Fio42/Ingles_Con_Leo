/* Ruta inicial del Plan de estudio en un navegador REAL (Chromium, ancho de teléfono) con la nube simulada.
   Necesita Playwright (no forma parte de run-all.js, que no usa dependencias):
     node tools/e2e/ruta-inicial.browser.js            (desde la carpeta inglesconLeo)
   Sirve los archivos reales del sitio; todo lo externo se bloquea y supabase-js se reemplaza por un cliente falso. */
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ chromium = require('/opt/npm-tools/node_modules/playwright').chromium; }
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = process.argv[2] || path.join(__dirname, '..', '..');
const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\//, ''));
  fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
});
const FAKE = `
window.supabase = { createClient: function(){
  var cfg = window.__FAKE || {};
  var SESSION = { user:{ id:'m1' }, access_token:'t' };
  function builder(table){
    var st = { table:table, op:'select', payload:null };
    var b = new Proxy({}, { get: function(_, k){
      if(k === 'then') return function(res, rej){ return run().then(res, rej); };
      if(k === 'insert') return function(p){ st.op = 'insert'; st.payload = p; return b; };
      if(k === 'update') return function(p){ st.op = 'update'; st.payload = p; return b; };
      if(k === 'single' || k === 'maybeSingle') return function(){ st.single = true; return b; };
      return function(){ return b; };
    }});
    async function run(){
      if(st.table === 'profiles' && st.op === 'select'){ var row = { id:'m1', is_member:true, level:cfg.level, level_source:'self', onboarded_at:'2026-01-01T00:00:00Z', display_name:'Ana' }; return { data: st.single ? row : [row], error:null }; }
      if(st.table === 'progress_sessions' && st.op === 'select'){
        if(cfg.delay) await new Promise(function(r){ setTimeout(r, cfg.delay); });
        if(cfg.fail) return { data:null, error:{ message:'network' } };
        return { data: JSON.parse(JSON.stringify(cfg.sessions || [])), error:null };
      }
      if(st.table === 'progress_sessions' && st.op === 'insert'){ (window.__INS = window.__INS || []).push(st.payload); }
      return { data: st.single ? null : [], error:null };
    }
    return b;
  }
  return { auth:{ getSession: async function(){ return { data:{ session: SESSION } }; }, getUser: async function(){ return { data:{ user: SESSION.user } }; }, onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; }, signOut: async function(){ return {}; } },
    from: builder, rpc: async function(){ return { data:[], error:null }; }, functions:{ invoke: async function(){ return { data:null, error:null }; } } };
} };`;

async function open(browser, cfg, opts){
  opts = opts || {};
  const ctx = await browser.newContext({ viewport:{ width: opts.width || 375, height:740 }, isMobile:true, hasTouch:true, storageState: opts.storage || undefined });
  const page = await ctx.newPage();
  await page.addInitScript(c => { window.__FAKE = c; localStorage.setItem('sb-test-auth-token', '{}'); }, cfg);
  if(opts.seed) await page.addInitScript(s => { Object.keys(s).forEach(k => { if(localStorage.getItem(k) === null) localStorage.setItem(k, s[k]); }); }, opts.seed);
  await page.route('**/*', route => {
    const u = route.request().url();
    if(u.startsWith('http://localhost')) return route.continue();
    if(u.includes('supabase-js')) return route.fulfill({ contentType:'application/javascript', body: FAKE });
    return route.abort();
  });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  return { ctx, page, errors };
}
const NOTE = /Tu ruta inicial\./;
const introText = page => page.locator('#planArea').innerText();
const inflight = (page, level) => page.evaluate(l => JSON.parse(localStorage.getItem('leo_inflight_plan_' + l) || 'null'), level);
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const routeTopicsOf = (page, ids) => page.evaluate(ids => { const m = {}; Object.keys(GRAMMAR_BANK).forEach(l => GRAMMAR_BANK[l].forEach(v => v.forEach(g => g.items.forEach(i => { m[i.id] = g.topic; })))); return ids.map(i => m[i]); }, ids);

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://localhost:' + server.address().port + '/plan-estudio.html';
  const browser = await chromium.launch();
  let ok = 0; const pass = n => { ok++; console.log('  ok  ' + n); };
  const LAUNCH = Date.UTC(2026, 9, 7, 15, 0, 0);

  // 1) Miembro nuevo: primero el Plan de siempre, y al confirmar la nube aparece la ruta. Empieza, recarga y sigue igual.
  let storage;
  for(const width of [320, 375]){
    const { ctx, page, errors } = await open(browser, { level:'medio', sessions:[], delay: 500 }, { width });
    await page.goto(base);
    await page.locator('#planStartBtn').waitFor();
    assert.ok(!NOTE.test(await introText(page)), 'antes de confirmar la nube no se muestra la ruta');
    await page.waitForFunction(() => /Tu ruta inicial\./.test(document.getElementById('planArea').innerText), null, { timeout: 5000 });
    const txt = await introText(page);
    assert.ok(/Tu ruta inicial\. Empezamos por lo esencial de tu nivel\./.test(txt.replace(/\n/g, ' ')), txt.slice(0, 400));
    assert.ok(/Gramática esencial de tu nivel\s*4 ejercicios/.test(txt.replace(/\n/g, ' ')), txt);
    assert.ok(!/Repaso de errores/.test(txt));
    assert.ok(await overflow(page) <= 0, 'sin desborde horizontal a ' + width + 'px');
    await page.locator('#planStartBtn').click();
    await page.locator('#planArea .session-card').waitFor();
    assert.ok(await overflow(page) <= 0, 'sin desborde en el ejercicio a ' + width + 'px');
    const sv = await inflight(page, 'medio');
    assert.strictEqual(sv.pool.length, 9);
    const g = sv.pool.filter(e => e.startRoute);
    assert.strictEqual(g.length, 4);
    const topics = await routeTopicsOf(page, g.map(e => e.item.id));
    assert.deepStrictEqual(Array.from(new Set(topics)).sort(), ['Present Perfect vs Past Simple', 'Will vs Going to (futuro)']);
    assert.strictEqual(sv.pool.filter(e => e.kind === 'grammar').length, 4, 'la gramática de la sesión es solo la de la ruta');
    // recarga a mitad: la sesión ya empezada no cambia
    const ids = sv.pool.map(e => e.item.id);
    await page.reload();
    await page.locator('#planStartBtn').waitFor();
    await page.waitForTimeout(900);
    await page.locator('#planStartBtn').click();
    await page.locator('#planArea .session-card').waitFor();
    assert.deepStrictEqual((await inflight(page, 'medio')).pool.map(e => e.item.id), ids, 'misma sesión tras recargar');
    assert.deepStrictEqual(errors, []);
    await ctx.close();
  }
  pass('miembro nuevo (320 y 375 px): la ruta aparece al confirmar la nube, la sesión trae sus 4 de gramática y no cambia al recargar');

  // 2) Miembro antiguo en un navegador nuevo: nunca ve la ruta
  { const old = [{ id: 1, user_id:'m1', skill:'gramatica', level:'medio', topics:[], date:'2026-09-20', started_at: Date.UTC(2026, 8, 20), duration_ms: 1000, results:[{ itemId:'g-medio5-fut-1', isCorrect:true }] }];
    const { ctx, page, errors } = await open(browser, { level:'medio', sessions: old, delay: 400 });
    await page.goto(base);
    await page.locator('#planStartBtn').waitFor();
    await page.waitForTimeout(1500);
    assert.ok(!NOTE.test(await introText(page)), 'usuario existente: sin ruta');
    await page.locator('#planStartBtn').click();
    await page.locator('#planArea .session-card').waitFor();
    assert.strictEqual((await inflight(page, 'medio')).pool.filter(e => e.startRoute).length, 0);
    assert.deepStrictEqual(errors, []);
    await ctx.close();
    // y con ?empezar=1 tampoco
    const b = await open(browser, { level:'medio', sessions: old, delay: 400 });
    await b.page.goto(base + '?empezar=1');
    await b.page.locator('#planArea .session-card').waitFor({ timeout: 6000 });
    assert.strictEqual((await inflight(b.page, 'medio')).pool.filter(e => e.startRoute).length, 0);
    await b.ctx.close();
    pass('miembro antiguo en navegador nuevo: Plan de siempre, también con ?empezar=1'); }

  // 3) ?empezar=1 en cuenta nueva: espera la confirmación y arranca con la ruta
  { const { ctx, page, errors } = await open(browser, { level:'facil', sessions:[], delay: 600 });
    await page.goto(base + '?empezar=1');
    await page.waitForFunction(() => /Preparando tu sesión/.test(document.getElementById('planArea').innerText) || document.querySelector('#planArea .session-card'));
    await page.locator('#planArea .session-card').waitFor({ timeout: 6000 });
    const sv = await inflight(page, 'facil');
    const topics = await routeTopicsOf(page, sv.pool.filter(e => e.startRoute).map(e => e.item.id));
    assert.deepStrictEqual(Array.from(new Set(topics)).sort(), ['A / An', 'Presente simple y "to be"']);
    assert.deepStrictEqual(errors, []);
    await ctx.close();
    pass('?empezar=1 en cuenta nueva: arranca directo con la sesión 1 de la ruta'); }

  // 4) Sesión de Plan empezada ANTES de desplegar la función: se retoma idéntica
  { const tmp = await open(browser, { level:'medio', sessions:[], fail: true });
    await tmp.page.goto(base);
    await tmp.page.locator('#planStartBtn').waitFor();
    await tmp.page.waitForTimeout(700);
    assert.ok(!NOTE.test(await introText(tmp.page)), 'sin poder confirmar la nube no hay ruta');
    await tmp.page.locator('#planStartBtn').click();
    await tmp.page.locator('#planArea .session-card').waitFor();
    const before = await inflight(tmp.page, 'medio');
    assert.strictEqual(before.pool.filter(e => e.startRoute).length, 0, 'sesión armada como antes de la función');
    assert.deepStrictEqual(tmp.errors, []);
    const st = await tmp.ctx.storageState();
    await tmp.ctx.close();
    for(const url of [base, base + '?empezar=1']){
      const { ctx, page, errors } = await open(browser, { level:'medio', sessions:[], delay: 300 }, { storage: st });
      await page.goto(url);
      if(url === base){ await page.locator('#planStartBtn').waitFor(); await page.waitForTimeout(900); assert.ok(!NOTE.test(await introText(page)), 'con sesión a medias no se anuncia la ruta'); await page.locator('#planStartBtn').click(); }
      await page.locator('#planArea .session-card').waitFor({ timeout: 6000 });
      assert.deepStrictEqual((await inflight(page, 'medio')).pool.map(e => e.item.id), before.pool.map(e => e.item.id), 'misma sesión');
      assert.deepStrictEqual(errors, []);
      await ctx.close();
    }
    pass('sesión ya empezada (o sin red): se retoma idéntica, la ruta no la toca'); }

  // 5) Sesión 2: ya hizo una sesión de Plan (después del lanzamiento) con un fallo -> ruta 2 de 3 + repaso de errores
  { const s1 = [{ id: 1, user_id:'m1', skill:'plan', level:'principiante', topics:['Ruta inicial'], date:'2026-10-08', started_at: LAUNCH + 3600000, duration_ms: 60000,
      results:[{ itemId:'g-principiante-m200-tobe-1', isCorrect:false, skill:'gramatica' }, { itemId:'g-principiante-m200-tobe-2', isCorrect:true, skill:'gramatica' }, { itemId:'g-principiante-this-1', isCorrect:true, skill:'gramatica' }, { itemId:'g-principiante-this-2', isCorrect:true, skill:'gramatica' }, { itemId:'v-principiante-2', isCorrect:false, skill:'vocabulario' }, { itemId:'v-principiante-7', isCorrect:false, skill:'vocabulario' }] }];
    const { ctx, page, errors } = await open(browser, { level:'principiante', sessions: s1, delay: 300 });
    await page.goto(base);
    await page.waitForFunction(() => /Tu ruta inicial\./.test(document.getElementById('planArea').innerText), null, { timeout: 5000 });
    const txt = (await introText(page)).replace(/\n/g, ' ');
    assert.ok(/Tu ruta inicial\..*ya viste 2 de 6 temas/.test(txt), txt.slice(0, 400));
    assert.ok(/Repaso de errores\s*2 ejercicios/.test(txt), 'repaso de errores con máximo 2: ' + txt);
    // cambiar la dificultad saca la ruta; volver a "A tu nivel" la devuelve
    await page.locator('#planDiffToggle').click();
    await page.locator('#planDifficultySelector button, #planDifficultySelector [data-diff], #planDifficultySelector .length-card').last().click();
    assert.ok(!NOTE.test(await introText(page)), 'con otra dificultad no hay ruta');
    assert.deepStrictEqual(errors, []);
    await ctx.close();
    pass('segunda sesión: 2 de 6 temas vistos, repaso de errores con 2 cupos; con otra dificultad la ruta se aparta'); }

  // 6) FALLBACK: cuenta nueva con un microtema débil (3 fallos distintos después del lanzamiento): el Plan normal, sin ruta
  { const weak = [{ id: 1, user_id:'m1', skill:'gramatica', level:'medio', topics:[], date:'2026-10-08', started_at: LAUNCH + 3600000, duration_ms: 60000,
      results:['g-medio-fut-gtevid-1', 'g-medio-fut-gtevid-2', 'g-medio-fut-gtevid-3'].map(id => ({ itemId:id, isCorrect:false, m:'going-to-evidencia' })) }];
    const { ctx, page, errors } = await open(browser, { level:'medio', sessions: weak, delay: 300 });
    await page.goto(base);
    await page.locator('#planStartBtn').waitFor();
    await page.waitForTimeout(1500);
    assert.strictEqual(await page.evaluate(() => !!startRouteState('medio')), true, 'por historial seguiría en la ruta');
    assert.strictEqual(await page.evaluate(() => _startRouteSynced), true);
    assert.ok(!NOTE.test(await introText(page)), 'una recomendación más específica gana: sin ruta');
    await page.locator('#planStartBtn').click();
    await page.locator('#planArea .session-card').waitFor();
    assert.strictEqual((await inflight(page, 'medio')).pool.filter(e => e.startRoute).length, 0);
    assert.deepStrictEqual(errors, []);
    await ctx.close();
    pass('fallback: con un microtema débil pendiente el Plan es el de siempre, aunque no haya terminado la ruta'); }

  await browser.close(); server.close();
  console.log('\n' + ok + ' pruebas correctas');
})().catch(e => { console.error('FALLA', e); process.exit(1); });
