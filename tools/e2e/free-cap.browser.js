/* Cuenta gratis: la sesión se ajusta a lo que queda del día (máximo 6), termina en el resumen (no en el muro) y muestra UNA invitación
   discreta a la membresía después. Chromium real en móvil (375 px), nube simulada. Necesita Playwright:
     node tools/e2e/free-cap.browser.js [carpeta-del-sitio]        (no forma parte de run-all.js) */
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ chromium = require('/opt/npm-tools/node_modules/playwright').chromium; }
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = process.argv[2] || path.join(__dirname, '..', '..');
const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'practica.html');
  fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
});
const FAKE = `
window.supabase = { createClient: function(){
  var cfg = window.__FAKE || {};
  var SESSION = cfg.user ? { user:{ id:cfg.user }, access_token:'t' } : null;
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
      await window.__cloud(JSON.stringify({ table:st.table, op:st.op, payload:st.payload, user: cfg.user || null }));
      if(st.table === 'profiles' && st.op === 'select'){ var row = cfg.user ? Object.assign({ id:cfg.user, is_member:false, level:'facil', onboarded_at:'2026-10-01T00:00:00Z', display_name:'Ana', free_daily_count:0, free_daily_date:null, free_first_exercise_at:null }, cfg.profile || {}) : null; return { data: st.single ? row : [row], error:null }; }
      return { data: st.single ? null : [], error:null };
    }
    return b;
  }
  return { auth:{ getSession: async function(){ return { data:{ session: SESSION } }; }, getUser: async function(){ return { data:{ user: SESSION && SESSION.user } }; }, onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; }, signOut: async function(){ return {}; } },
    from: builder, rpc: async function(n){ await window.__cloud(JSON.stringify({ table:'rpc:' + n, op:'rpc' })); return { data:null, error:null }; }, functions:{ invoke: async function(){ return { data:null, error:null }; } } };
} };`;
const today = () => new Date().toLocaleDateString('en-CA');
async function newPage(browser, user, profile, storage, width){
  const ctx = await browser.newContext({ viewport:{ width:width || 375, height:740 }, isMobile:true, hasTouch:true, storageState: storage || undefined });
  const page = await ctx.newPage(); const cloud = [];
  await page.exposeFunction('__cloud', s => { cloud.push(JSON.parse(s)); return {}; });
  await page.addInitScript(a => { window.__FAKE = { user:a.u, profile:a.p }; 
    if(a.u) localStorage.setItem('sb-test-auth-token', JSON.stringify({ user:{ id:a.u } })); }, { u:user, p:profile });
  await page.route('**/*', route => { const u = route.request().url(); if(u.startsWith('http://localhost')) return route.continue(); if(u.includes('supabase-js')) return route.fulfill({ contentType:'application/javascript', body:FAKE }); return route.abort(); });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  return { ctx, page, cloud, errors };
}
// Responde hasta llegar al resumen o al muro; devuelve cuántos respondió y dónde terminó.
async function runSession(page, max){
  let answered = 0, total = null;
  for(let i = 0; i < (max || 12); i++){
    await page.waitForFunction(() => document.querySelector('#skillBody .session-card') || document.querySelector('#skillBody .session-summary'), null, { timeout: 8000 });
    if(await page.locator('#skillBody .session-summary').count()) break;
    const hdr = await page.locator('#skillBody').textContent(); const m = /(\d+)\s*(?:\/|de)\s*(\d+)/.exec(await page.locator('#skillBody .session-progress, #skillBody .session-header, #skillBody').first().innerText());
    if(total === null && m) total = Number(m[2]);
    const card = page.locator('#skillBody .session-card');
    await card.locator('.option, .word-chip, .error-word').first().click();
    const next = card.locator('#nextRow .next-btn'); await next.click(); answered++;
  }
  await page.waitForTimeout(400);
  const txt = await page.locator('#skillBody').innerText();
  return { answered, total, wall: /Completaste tus 6 ejercicios gratis de hoy/.test(txt), summary: await page.locator('#skillBody .session-summary').count() > 0 && !/Completaste tus 6 ejercicios gratis de hoy/.test(txt), txt };
}
const base = () => 'http://localhost:' + server.address().port + '/practica.html?skill=grammar';
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  let ok = 0; const pass = n => { ok++; console.log('  ok  ' + n); };
  const ready = p => p.waitForFunction(() => document.getElementById('practicaMain') && document.getElementById('practicaMain').style.visibility === 'visible').then(() => p.waitForTimeout(700));
  const noOverflow = async p => assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'sin desbordar en móvil');

  // A) cuenta nueva, 6 disponibles: la sesión se corta a 6, termina en RESUMEN, reconoce la práctica y ofrece UNA vez
  let storageA;
  { const { ctx, page, cloud, errors } = await newPage(browser, 'u1', { free_daily_count:0, free_daily_date:today() });
    await page.goto(base()); await ready(page);
    // las variantes gratis son de 3 u 8 ejercicios al azar: se recarga hasta tener una de 8 (con el cupo, 6)
    for(let t = 0; t < 15; t++){ const m = /(\d+)\s*(?:\/|de)\s*(\d+)/.exec(await page.locator('#skillBody').innerText()); if(m && Number(m[2]) >= 6) break; await page.reload(); await ready(page); }
    assert.ok(/6 preguntas cortas/.test(await page.locator('#skillHead, .skill-head').first().innerText().catch(() => '') || await page.locator('body').innerText()), 'encabezado con el número real (6)');
    assert.ok(!/8 preguntas cortas/.test(await page.locator('body').innerText()), 'ya no dice 8');
    const r = await runSession(page);
    assert.strictEqual(r.answered, 6, 'respondió exactamente 6'); assert.ok(r.summary && !r.wall, 'termina en el resumen, no en el muro');
    assert.ok(/Completaste tu práctica gratis de hoy: 6 de 6/.test(r.txt), 'reconoce la práctica del día');
    assert.strictEqual((r.txt.match(/\$2 USD/g) || []).length, 1, 'un solo mensaje comercial');
    assert.ok(/Conocer la membresía/.test(r.txt) && /Seguir aprendiendo gratis/.test(r.txt) && /9 cursos/.test(r.txt) && /Práctica ilimitada/.test(r.txt) && /¡Terminaste tu primera práctica!/.test(r.txt) && /\$2 USD al mes\./.test(r.txt));
    assert.ok(!/acertaste|Lo que más te costó/.test(await page.locator('[data-first-offer-card]').innerText()), 'la tarjeta no repite puntaje ni temas');
    assert.ok(!/Seguir practicando sin límite/.test(r.txt), 'sin el muro');
    await noOverflow(page);
    assert.ok(!(await page.locator('.practice-members-cta').isVisible()), 'el bloque fijo de membresía de la página se oculta mientras está la tarjeta (un solo mensaje)');
    if(process.env.SHOT){ await page.locator('.session-summary').scrollIntoViewIfNeeded(); await page.screenshot({ path: process.env.SHOT, fullPage: true }); }
    const box = await page.locator('[data-first-offer-card]').boundingBox(); assert.ok(box && box.x >= 0 && box.x + box.width <= 376, 'la tarjeta cabe en 375 px');
    for(const sel of ['[data-first-offer="know"]', '[data-first-offer="free"]']){ const b = await page.locator(sel).boundingBox(); assert.ok(b.height >= 44 && b.x >= 0 && b.x + b.width <= 376, sel + ' tocable'); }
    const ev = await page.evaluate(() => (window.dataLayer || []).filter(function(a){ return a[0] === 'event'; }).map(function(a){ return a[1]; }));
    assert.strictEqual(ev.filter(e => e === 'free_daily_limit_reached').length, 1); assert.strictEqual(ev.filter(e => e === 'first_session_completed').length, 1); assert.strictEqual(ev.filter(e => e === 'first_session_offer_viewed').length, 1);
    assert.strictEqual(cloud.filter(c => c.table === 'profiles' && c.op === 'update' && 'free_daily_count' in c.payload).pop().payload.free_daily_count, 6);
    await page.locator('[data-first-offer="free"]').click(); assert.ok(!(await page.locator('[data-first-offer-card]').isVisible()), 'seguir gratis la oculta');
    await page.waitForTimeout(300); assert.ok(await page.locator('.practice-members-cta').isVisible(), 'al descartar la tarjeta vuelve el bloque fijo de siempre');
    assert.ok((await page.evaluate(() => (window.dataLayer || []).filter(function(a){ return a[0] === 'event'; }).map(function(a){ return a[1]; }))).includes('first_session_offer_dismissed'));
    assert.deepStrictEqual(errors, []);
    pass('A: 6 disponibles -> sesión de 6, resumen, aviso de práctica completa, una oferta, 375 px, eventos correctos');
    storageA = await ctx.storageState();
    // recargar: ni la oferta ni el evento de primera sesión se repiten
    await page.reload(); await ready(page);
    assert.strictEqual(await page.locator('[data-first-offer-card]').count(), 0, 'una vez por cuenta');
    assert.ok(!(await page.evaluate(() => (window.dataLayer || []).filter(function(a){ return a[0] === 'event'; }).map(function(a){ return a[1]; }))).includes('first_session_offer_viewed'));
    pass('A: al recargar la oferta no vuelve');
    // cambio de cuenta en el mismo navegador: otra cuenta, su propio cupo y sin la bandera de la anterior
    await page.evaluate(() => { localStorage.setItem('sb-test-auth-token', JSON.stringify({ user:{ id:'u9' } })); });
    await ctx.close(); }
  { const { ctx, page } = await newPage(browser, 'u9', { free_daily_count:0, free_daily_date:today() }, storageA);
    await page.goto(base()); await ready(page);
    assert.strictEqual(await page.locator('[data-first-offer-card]').count(), 0, 'la otra cuenta no hereda la oferta vista');
    await page.waitForFunction(() => document.querySelector('#skillBody .session-card') || document.querySelector('#skillBody .upgrade-block'), null, { timeout: 8000 });
    const t9 = await page.locator('#skillBody').innerText();
    assert.ok(!/Completaste tus 6 ejercicios gratis de hoy/.test(t9) && await page.locator('#skillBody .session-card').count() === 1, 'el cupo es de CADA cuenta: lo que usó u1 en este navegador no bloquea a u9');
    pass('dos cuentas gratis en el mismo navegador: u9 tiene su propio cupo (u1 ya usó 6) y no hereda la oferta');
    await ctx.close(); }
  { const { ctx, page } = await newPage(browser, 'u9', { free_daily_count:3, free_daily_date:today() });
    await page.goto(base()); await ready(page);
    const r = await runSession(page); assert.strictEqual(r.answered, 3, 'otro dispositivo, 3 usados en la nube -> 3 disponibles'); assert.ok(r.summary);
    pass('otro dispositivo con 3 usados en la nube -> sesión de 3 y resumen');
    await ctx.close(); }

  // B) 1 disponible
  { const { ctx, page, errors } = await newPage(browser, 'u2', { free_daily_count:5, free_daily_date:today(), free_first_exercise_at:'2026-10-01T00:00:00Z' });
    await page.goto(base()); await ready(page);
    assert.ok(/1 pregunta corta/.test(await page.locator('body').innerText()), 'encabezado con 1');
    const r = await runSession(page); assert.strictEqual(r.answered, 1); assert.ok(r.summary && !r.wall);
    assert.ok(/Completaste tu práctica gratis de hoy/.test(r.txt));
    assert.ok(!/data-first-offer-card/.test(await page.content()) , 'cuenta que ya practicaba: sin tarjeta de primera sesión');
    assert.ok(/Descubrir el sistema completo|Leo AI|Leo AI/.test(r.txt), 'su único mensaje comercial es el de siempre');
    assert.ok(!(await page.evaluate(() => (window.dataLayer || []).filter(function(a){ return a[0] === 'event'; }).map(function(a){ return a[1]; }))).includes('first_session_completed'), 'no es su primera sesión');
    assert.deepStrictEqual(errors, []);
    pass('B: 1 disponible -> 1 ejercicio, resumen, un solo mensaje comercial (el existente)');
    await ctx.close(); }

  // C) 0 disponibles: muro de siempre, sin oferta, sin sesión
  { const { ctx, page } = await newPage(browser, 'u3', { free_daily_count:6, free_daily_date:today(), free_first_exercise_at:'2026-10-01T00:00:00Z' });
    await page.goto(base()); await ready(page);
    await page.waitForFunction(() => document.querySelector('#skillBody .session-card') || document.querySelector('#skillBody .session-summary') || document.querySelector('#skillBody .upgrade-block'), null, { timeout: 8000 });
    const txt = await page.locator('#skillBody').innerText();
    assert.ok(/Completaste tus 6 ejercicios gratis de hoy/.test(txt) && /Seguir practicando sin límite/.test(txt)); assert.ok(!/Conocer la membresía/.test(txt));
    await noOverflow(page);
    pass('C: 0 disponibles -> el muro de siempre, sin tarjeta duplicada');
    await ctx.close(); }

  // D) sesión incompleta (se cierra la pestaña): sin oferta ni evento de primera sesión; el cupo no cambia por abandonar
  { const { ctx, page, errors } = await newPage(browser, 'u4', { free_daily_count:0, free_daily_date:today() });
    await page.goto(base()); await ready(page);
    const card = page.locator('#skillBody .session-card'); await card.waitFor();
    await card.locator('.option, .word-chip, .error-word').first().click(); await card.locator('#nextRow .next-btn').click();
    await page.reload(); await ready(page);
    const ev = await page.evaluate(() => (window.dataLayer || []).filter(function(a){ return a[0] === 'event'; }).map(function(a){ return a[1]; }));
    assert.ok(!ev.includes('first_session_completed') && !ev.includes('first_session_offer_viewed'), 'abandonar no cuenta como sesión completada');
    assert.strictEqual(await page.locator('[data-first-offer-card]').count(), 0);
    assert.deepStrictEqual(errors, []);
    pass('D: sesión incompleta -> sin evento de primera sesión ni oferta');
    await ctx.close(); }

  // E) 320, 360 y 375 px: encabezado dinámico, tarjeta sin desbordar y botones tocables
  for(const w of [320, 360, 375]){
    const { ctx, page, errors } = await newPage(browser, 'w' + w, { free_daily_count:3, free_daily_date:today() }, undefined, w);
    await page.goto(base()); await ready(page);
    assert.ok(/3 preguntas cortas/.test(await page.locator('body').innerText()), w + ': encabezado con 3');
    const r = await runSession(page); assert.strictEqual(r.answered, 3);
    assert.ok(/¡Terminaste tu primera práctica!/.test(r.txt) || /Completaste tu práctica gratis de hoy/.test(r.txt));
    await noOverflow(page);
    const card = page.locator('[data-first-offer-card]');
    if(await card.count()){ const box = await card.boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= w + 1, w + ': tarjeta cabe');
      for(const sel of ['[data-first-offer="know"]', '[data-first-offer="free"]']){ const bb = await page.locator(sel).boundingBox(); assert.ok(bb.height >= 44 && bb.x >= 0 && bb.x + bb.width <= w + 1, w + ' ' + sel); } }
    if(process.env.SHOTDIR) await page.screenshot({ path: process.env.SHOTDIR + '/w' + w + '.png', fullPage: true });
    assert.deepStrictEqual(errors, []);
    pass('E: ' + w + ' px -> sesión de 3, encabezado "3 preguntas cortas", sin desbordar'); await ctx.close();
  }
  // F) invitado: encabezado y tope de siempre (3), sin tarjeta de cuenta
  { const { ctx, page } = await newPage(browser, null, null);
    await page.goto(base()); await ready(page);
    assert.strictEqual(await page.locator('[data-first-offer-card]').count(), 0);
    await noOverflow(page); pass('F: invitado sin tarjeta de cuenta'); await ctx.close(); }

  // G) escritorio: la tarjeta aprovecha el ancho sin volverse enorme
  { const { ctx, page, errors } = await newPage(browser, 'desk1', { free_daily_count:3, free_daily_date:today() }, undefined, 1280);
    await page.goto(base()); await ready(page);
    const r = await runSession(page); assert.strictEqual(r.answered, 3);
    const card = page.locator('[data-first-offer-card]'); assert.strictEqual(await card.count(), 1);
    const box = await card.boundingBox(); assert.ok(box.width <= 900 && box.height <= 260, 'tarjeta de escritorio compacta: ' + Math.round(box.width) + 'x' + Math.round(box.height));
    await noOverflow(page);
    if(process.env.SHOTDIR){ await card.scrollIntoViewIfNeeded(); await page.screenshot({ path: process.env.SHOTDIR + '/desk.png' }); }
    assert.deepStrictEqual(errors, []); pass('G: escritorio 1280 px, tarjeta compacta (' + Math.round(box.width) + 'x' + Math.round(box.height) + ')'); await ctx.close(); }
  // H) miembro: sin tarjeta comercial ni muro gratis
  { const { ctx, page } = await newPage(browser, 'mem1', { is_member:true, free_daily_count:6, free_daily_date:today(), free_first_exercise_at:'2026-10-01T00:00:00Z' });
    await page.goto(base()); await page.waitForTimeout(2500);
    const t = await page.locator('body').innerText();
    assert.strictEqual(await page.locator('[data-first-offer-card]').count(), 0); assert.ok(!/Completaste tus 6 ejercicios gratis de hoy/.test(t));
    pass('H: miembro sin tarjeta comercial ni muro gratuito'); await ctx.close(); }

  await browser.close(); server.close(); console.log(ok + ' ok');
})().catch(e => { console.log('FALLA ' + (e && e.stack || e)); process.exit(1); });
