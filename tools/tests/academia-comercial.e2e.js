#!/usr/bin/env node
/* Presentacion comercial de la Academia: interruptor de lanzamiento, navegacion, portada, miembros, practica y articulo.
   Corre con:  NODE_PATH=$(npm root -g) node tools/tests/academia-comercial.e2e.js
   Sin la bandera el sitio publico NO anuncia la academia (nada cambia para nadie); con la bandera de prueba (la misma
   que usa la cuenta de prueba) se ve la version de lanzamiento. No hace pagos ni llama a Supabase. */
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ console.log('omitida: falta playwright'); process.exit(0); }
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const srv = http.createServer((req, rsp) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if(!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ rsp.writeHead(404); return rsp.end(); } rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp); });
let passed = 0, failed = 0;
async function test(name, fn){ try{ await fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 4).join('\n       ')); } }
(async()=>{
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  console.log('Academia: presentacion comercial');
  async function open(url, live, w){
    const ctx = await browser.newContext({ viewport: { width: w || 390, height: 800 } });
    await ctx.route(/googletagmanager|facebook|fonts\.(googleapis|gstatic)|supabase/, r => r.abort());
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    if(live) await page.addInitScript(() => { try{ localStorage.setItem('leo_academia_canary', '1'); }catch(e){} });
    await page.goto(base + '/' + url); await page.waitForTimeout(500);
    return { page, ctx, errs };
  }
  const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, sel);
  const text = p => p.evaluate(() => document.body.innerText);
  const NAV_PAGES = ['index.html', 'miembros.html', 'practica.html', 'plan-estudio.html', 'progreso.html', 'articulos.html', 'articulo-verbo-to-be.html', 'toefl.html', 'clases.html'];

  await test('SIN el interruptor: el sitio publico no anuncia la academia en ninguna pagina (nav, portada, miembros, practica, articulo)', async()=>{
    for(const u of NAV_PAGES){
      const { page, ctx } = await open(u, false);
      const t = await text(page);
      assert(!/Explorar la academia|Academia Inglés con Leo|Probar el curso TO BE|curso TO BE/i.test(t), u + ' anuncia la academia: ' + (t.match(/.{30}(academia).{30}/i) || [''])[0]);
      const navAc = await page.$$eval('.nav-links a[href="academia.html"]', as => as.map(a => getComputedStyle(a).display));
      assert(navAc.every(d => d === 'none'), u + ' muestra el enlace Academia: ' + navAc);
      await ctx.close();
    }
    const { page, ctx } = await open('index.html', false);
    assert(/sistema que se adapta a ti/.test(await page.innerText('h1')) && /Modo aprender/.test(await text(page)));
    await ctx.close();
  });
  await test('CON la bandera: portada con el mensaje nuevo, boton principal "Explorar la academia" y secundario "Practicar gratis"', async()=>{
    const { page, ctx, errs } = await open('index.html', true);
    assert.strictEqual((await page.innerText('h1.ac-live-only')).replace(/\s+/g, ' '), 'Aprende inglés paso a paso con Inglés con Leo.');
    assert(/Cursos interactivos, explicaciones sencillas, ejercicios y un sistema que detecta tus errores/.test(await text(page)));
    const main = await page.$('#heroAcademiaCta'); assert.strictEqual(await main.getAttribute('href'), 'academia.html'); assert((await main.innerText()).startsWith('Explorar la academia'));
    assert(await vis(page, '.hero-v2-actions.ac-live-only a.btn-ghost'));
    const t = await text(page);
    assert(!/Modo aprender/.test(t), 'queda "Modo aprender" visible en la portada');
    assert(/\$2 USD/.test(t) && /\$20 USD al año/.test(t) && !/1\.99/.test(t), 'el precio debe seguir siendo $2 / $20');
    assert(!/certificado de Fundamentos/i.test(t), 'no se promete el certificado');
    const plans = await page.innerText('#planes'); assert(/Academia: los cursos publicados \(hoy TO BE\)/.test(plans) && /demostración gratis/.test(plans));
    assert.notStrictEqual(await page.$eval('.nav-links a[href="academia.html"]', e => getComputedStyle(e).display), 'none');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('CON la bandera: miembros (bienvenida, precio, tarjetas) presenta la academia y conserva el pago actual', async()=>{
    const { page, ctx } = await open('miembros.html', true);
    const html = await page.content();
    const live = await page.$$eval('.ac-live-only', es => es.filter(e => getComputedStyle(e).display !== 'none').map(e => (e.id || e.className)));
    assert(live.length >= 1);
    for(const id of ['welcomeAcademiaBtn', 'previewAcademia', 'dashAcademia']) assert(html.includes('id="' + id + '"'), id);
    assert(/Activar membresía: \$2 USD\/mes/.test(html) && /\$20 USD al año/.test(html));
    assert(await page.$eval('#welcomeAcademiaBtn', e => e.getAttribute('href')) === 'academia.html');
    const hidden = await page.$$eval('#previewModoAprender, #dashModoAprender', es => es.map(e => getComputedStyle(e).display));
    assert(hidden.every(d => d === 'none'), 'Modo aprender sigue visible: ' + hidden);
    await ctx.close();
  });
  await test('CON la bandera: practica y articulo de TO BE llevan a la academia; el Modo aprender sigue existiendo (enlaces anteriores)', async()=>{
    let r = await open('practica.html', true);
    assert(await vis(r.page, '#practicaAcademia') || (await r.page.$('#practicaAcademia')), 'aviso de academia en practica');
    assert.strictEqual(await r.page.$eval('#practicaAcademia a', e => e.getAttribute('href')), 'academia.html'); await r.ctx.close();
    r = await open('articulo-verbo-to-be.html', true);
    const a = await r.page.$eval('.ap-callout.ac-live-only a', e => e.getAttribute('href')); assert.strictEqual(a, 'academia.html#/curso/to-be');
    assert(await vis(r.page, '.ap-callout.ac-live-only')); assert(!(await vis(r.page, '.ap-callout.ac-pre'))); await r.ctx.close();
    for(const u of ['aprender.html', 'aprender.html?leccion=to-be']){ r = await open(u, false); assert((await text(r.page)).length > 200, u + ' debe seguir funcionando'); await r.ctx.close(); }
    r = await open('aprender.html', true); assert(await vis(r.page, '#apAcademiaAviso')); await r.ctx.close();
  });
  await test('muro de limite de la practica: con la bandera ofrece la academia en el listado de beneficios (y sin ella no cambia)', async()=>{
    const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
    assert(/window\.ACADEMIA_LIVE \? '<li><strong>Academia Inglés con Leo<\/strong>/.test(src));
    assert(/<a href="miembros\.html\?pagar=1" class="btn btn-primary" onclick="trackLeoEvent\('membership_cta_clicked'\)">Seguir practicando sin límite<\/a>/.test(src), 'el boton de pago actual no cambio');
  });
  await test('sin horizontal overflow en 320 px con la bandera: portada, miembros, academia', async()=>{
    for(const u of ['index.html', 'miembros.html', 'practica.html', 'articulo-verbo-to-be.html']){
      const { page, ctx } = await open(u, true, 320);
      assert.strictEqual(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'overflow en ' + u);
      await ctx.close();
    }
  });
  await test('analitica: las paginas de la academia cargan GA4 y Meta con los MISMOS ids que el resto del sitio y ninguna otra cosa cambia en las compras', async()=>{
    const a = fs.readFileSync(path.join(root, 'academia.html'), 'utf8'), idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert(a.includes("gtag('config', 'G-0DRL810MYR')") && a.includes("fbq('init', '2182739922655837')"));
    assert.strictEqual((a.match(/fbq\('track', 'PageView'\)/g) || []).length, 1);
    const m = fs.readFileSync(path.join(root, 'miembros.html'), 'utf8');
    assert.strictEqual((m.match(/trackLeoEvent\('membership_purchase_completed'/g) || []).length, 2, 'los dos disparos de compra originales (con y sin respuesta del servidor)');
    assert(/getPurchaseParams/.test(m));
  });
  await browser.close(); srv.close();
  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
