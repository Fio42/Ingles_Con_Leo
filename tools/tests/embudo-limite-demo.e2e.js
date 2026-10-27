#!/usr/bin/env node
/* Embudo Academia: aviso del limite gratis + invitacion a la prueba gratis de TO BE, en el NAVEGADOR.
   Usa el app.js, backend.js (real, solo cambia el cliente de Supabase por uno que habla con PGlite) y la migracion REAL.
   Corre con:  NODE_PATH=$(npm root -g) LEO_PGLITE_DIR=<carpeta> SHOTS=<carpeta capturas> node tools/tests/embudo-limite-demo.e2e.js */
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const H = require('./academia-pg-helpers.js');
const root = H.root;
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ console.log('omitida: falta playwright'); process.exit(0); }
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml' };
const serve = () => new Promise(res => { const s = http.createServer((req, rsp) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if(!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ rsp.writeHead(404); return rsp.end(); }
  rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp);
}).listen(0, '127.0.0.1', () => res(s)); });
/* backend.js REAL con el cliente cambiado por el falso (rpc -> PGlite) */
const realBackend = fs.readFileSync(path.join(root, 'backend.js'), 'utf8')
  .replace('function getClient(){', 'function getClient(){ if(window.__UID !== undefined) return { rpc: function(f, a){ return window.__rpc(f, a); } };')
  .replace('async function getSession(){', 'async function getSession(){ if(window.__UID !== undefined) return window.__UID ? { user: { id: window.__UID } } : null;');
let passed = 0, failed = 0;
async function test(name, fn){ try{ await fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 4).join('\n       ')); } }

(async()=>{
  const PGlite = await H.loadPglite(); if(!PGlite){ console.log('omitida: falta pglite'); return; }
  console.log('Embudo: aviso del limite gratis + invitacion a la prueba de TO BE');
  const db = await H.freshDb(PGlite, []);
  const F = H.U.free, M = H.U.a;
  let CUR = F, FAIL = false;
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch(); const errors = [];
  const q = async (sql, p) => (await db.query(sql, p)).rows;
  async function open(uid, vp, opts){
    opts = opts || {};
    const ctx = await browser.newContext({ viewport: vp || { width: 390, height: 800 } });
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await ctx.route('**/backend.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: realBackend }));
    await ctx.route(/fonts\.(googleapis|gstatic)\.com|googletagmanager|connect\.facebook|cdn\.jsdelivr/, r => r.abort());
    const page = await ctx.newPage();
    await page.exposeFunction('__rpc', (fn, args) => { if(FAIL) throw new Error('red caida'); return H.fakeClient(db, CUR).rpc(fn, args); });
    await page.addInitScript(([u, live]) => { window.__UID = u; window.dataLayer = []; window.gtag = function(){ window.dataLayer.push(Array.prototype.slice.call(arguments)); };
      if(live === false) Object.defineProperty(window, 'ACADEMIA_LIVE', { get: () => false, set: () => {} }); }, [uid, opts.live]);
    page.on('console', m => { if(m.type() === 'error' && !/ERR_FAILED|fonts|ERR_BLOCKED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERR ' + e.message));
    await page.goto(base + '/practica.html'); await page.waitForFunction(() => typeof renderFreeDailyLimitReachedBlock === 'function');
    return { ctx, page };
  }
  /* pinta el aviso real dentro de la pagina real, como lo hacen las sesiones de practica al llegar al limite */
  const wall = async (page, tier, times) => { await page.evaluate(([tier, n]) => {
    initLeoAccessTier(tier, tier === 'free' ? { id: window.__UID } : null);
    const m = document.getElementById('practicaMain'); m.style.visibility = 'visible'; m.innerHTML = '<div id="w"></div>';
    for(let i = 0; i < n; i++) document.getElementById('w').innerHTML = renderFreeDailyLimitReachedBlock();
  }, [tier, times || 1]); await page.waitForTimeout(500); };
  const events = p => p.evaluate(() => window.dataLayer.filter(a => a[0] === 'event').map(a => a[1]));
  const shot = async (p, n) => { if(process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, n + '.png'), fullPage: true }); };
  const COPY = '¿Quieres seguir aprendiendo?', COPY2 = 'Prueba gratis una parte de nuestro curso TO BE: una explicación sencilla y tres ejercicios.';

  await test('CUENTA GRATIS con 6/6 y demo disponible: ve la invitacion (texto exacto, boton), la membresia de $2 sigue visible y primero', async()=>{
    await db.exec(`update public.profiles set free_daily_count = 6, free_daily_date = current_date where id = '${F}'`);
    const { page } = await open(F); await wall(page, 'free');
    const box = await page.$('[data-academia-offer]'); assert(box && await box.isVisible(), 'invitacion visible');
    const t = await box.innerText(); assert(t.includes(COPY) && t.includes(COPY2) && t.includes('Probar la Academia gratis'), t);
    assert.strictEqual(await page.$eval('[data-academia-offer] a', a => a.getAttribute('href')), 'academia.html#/curso/to-be/demo');
    const w = await page.innerText('.upgrade-block'); assert(/\$2 USD al mes/.test(w) && /Seguir practicando sin límite/.test(w));
    assert.strictEqual(await page.evaluate(() => !![...document.querySelectorAll('.modal, [role=dialog], dialog[open]')].some(e => e.offsetParent !== null)), false, 'sin ventanas emergentes');
    const order = await page.evaluate(() => { const a = document.querySelector('a[href^="miembros.html?pagar=1"]'), b = document.querySelector('[data-academia-offer]'); return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); });
    assert(order, 'la membresia va antes que la invitacion');
    await shot(page, 'limite-con-invitacion-390');
    await page.setViewportSize({ width: 1440, height: 900 }); await shot(page, 'limite-con-invitacion-1440');
    await page.setViewportSize({ width: 320, height: 640 });
    assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'overflow 320');
  });
  await test('eventos: ofrecer = 1, clic = 1, limite alcanzado = 1 aunque el aviso se pinte 5 veces; sin compra ni checkout', async()=>{
    const { page } = await open(F); await wall(page, 'free', 5);
    let ev = await events(page);
    assert.strictEqual(ev.filter(e => e === 'free_daily_limit_reached').length, 1, JSON.stringify(ev));
    assert.strictEqual(ev.filter(e => e === 'academia_demo_oferta_vista').length, 1, JSON.stringify(ev));
    await page.$eval('[data-academia-offer] a', a => { a.addEventListener('click', e => e.preventDefault(), true); a.click(); });
    ev = await events(page); assert.strictEqual(ev.filter(e => e === 'academia_demo_clic').length, 1);
    assert(!ev.includes('membership_purchase_completed') && !ev.includes('purchase') && !ev.includes('begin_checkout'));
  });
  await test('el boton lleva a la demo real y esta se puede hacer con el limite en 6/6 (el contador no cambia)', async()=>{
    const r = await H.fakeClient(db, F).rpc('academia_demo_start', { p_course: 'to-be', p_today: null, p_local_count: 0 });
    assert.strictEqual(r.data.ok, true);
    assert.strictEqual((await q('select free_daily_count n from public.profiles where id = $1', [F]))[0].n, 6);
  });
  await test('DEMO YA USADA: no se vuelve a ofrecer (solo membresia)', async()=>{
    await H.fakeClient(db, F).rpc('academia_demo_finish', { p_course: 'to-be' });
    const { page } = await open(F); await wall(page, 'free');
    assert.strictEqual(await page.$eval('[data-academia-offer]', e => e.hidden), true);
    assert(/\$2 USD al mes/.test(await page.innerText('.upgrade-block')));
    assert.strictEqual((await events(page)).filter(e => e === 'academia_demo_oferta_vista').length, 0);
    await shot(page, 'limite-demo-usada-390');
  });
  await test('MANIPULAR el navegador no cambia lo que dice el servidor (borrar datos locales, contador local, fecha falsa)', async()=>{
    const { page } = await open(F);
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('leo_academia_demo_done', '0'); });
    await wall(page, 'free'); assert.strictEqual(await page.$eval('[data-academia-offer]', e => e.hidden), true, 'demo usada sigue usada');
    await db.exec(`update public.academia_progress set demo_started_at = null, demo_done_at = null where user_id = '${F}'`);
    const p2 = (await open(F)).page; await p2.evaluate(() => { localStorage.setItem('leo_academia_demo_done', '1'); }); await wall(p2, 'free');
    assert.strictEqual(await p2.$eval('[data-academia-offer]', e => e.hidden), false, 'disponible aunque el navegador diga lo contrario');
    const a = await H.fakeClient(db, F).rpc('academia_access', { p_course: 'to-be', p_today: '2001-01-01', p_local_count: 99 });
    assert.strictEqual(a.data.demo.available, true);
    const bad = await H.fakeClient(db, F).rpc('academia_demo_start', { p_course: 'pronombres', p_today: null, p_local_count: 0 });
    assert.notStrictEqual(bad.data && bad.data.ok, true, 'otro curso no tiene demo');
  });
  await test('MIEMBRO activo: no ve la invitacion ni gasta demo', async()=>{
    const { page } = await open(M); CUR = M; await wall(page, 'free'); CUR = F;
    assert.strictEqual(await page.$eval('[data-academia-offer]', e => e.hidden), true);
  });
  await test('VISITANTE sin cuenta: aviso de crear cuenta, sin invitacion a la demo', async()=>{
    const { page } = await open(null); await wall(page, 'guest');
    assert.strictEqual(await page.$('[data-academia-offer]'), null);
    assert(/Crear cuenta gratis/.test(await page.innerText('#w')));
    await shot(page, 'limite-visitante-390');
  });
  await test('academia apagada (bandera) o curso apagado en el servidor: no se ofrece', async()=>{
    const { page } = await open(F, null, { live: false }); await wall(page, 'free');
    assert.strictEqual(await page.$eval('[data-academia-offer]', e => e.hidden), true);
    await db.exec(`update public.academia_progress set demo_started_at = null where user_id = '${F}'; update public.academia_courses set enabled = false`);
    const p3 = (await open(F)).page; await wall(p3, 'free'); assert.strictEqual(await p3.$eval('[data-academia-offer]', e => e.hidden), true);
    await db.exec(`update public.academia_courses set enabled = true`);
  });
  await test('si el servidor falla, el aviso sigue funcionando sin invitacion y sin errores', async()=>{
    const { page } = await open(F); FAIL = true; await wall(page, 'free'); FAIL = false;
    assert.strictEqual(await page.$eval('[data-academia-offer]', e => e.hidden), true);
    assert(/Seguir practicando sin límite/.test(await page.innerText('.upgrade-block')));
  });
  await test('sin errores de consola', async()=>{ assert.deepStrictEqual(errors, []); });
  await browser.close(); srv.close();
  console.log('\n' + (failed ? failed + ' FALLARON, ' : '') + passed + ' pruebas ok'); process.exit(failed ? 1 : 0);
})();
