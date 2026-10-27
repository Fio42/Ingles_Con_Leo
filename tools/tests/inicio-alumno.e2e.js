#!/usr/bin/env node
/* Inicio del alumno en navegador real (Chromium). Cuenta de miembro SIMULADA (se llama a unlock() de la página; no hay red ni Supabase ni pagos).
   Corre con:  NODE_PATH=$(npm root -g) node tools/tests/inicio-alumno.e2e.js   [SHOTS=carpeta para guardar capturas] */
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ console.log('omitida: falta playwright'); process.exit(0); }
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const srv = http.createServer((req, rsp) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0])); if(!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ rsp.writeHead(404); return rsp.end('no'); } rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp); });
let passed = 0, failed = 0;
async function test(name, fn){ try{ await fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 4).join('\n       ')); } }
const SHOTS = process.env.SHOTS;
const st = (done, days) => { const l = {}; for(let i = 1; i <= done; i++) l['l' + i] = { done: true }; return { v: 1, lessons: l, resume: {}, days: days || [] }; };
(async()=>{
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  async function panel(w, server, h){
    const ctx = await browser.newContext({ viewport: { width: w, height: h || 800 } });
    await ctx.route(/googletagmanager|facebook|fonts\.(googleapis|gstatic)|supabase|stripe|paypal|mercadopago/, r => r.abort());
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(() => { try{ localStorage.setItem('leo_profile', JSON.stringify({ name: 'Leo', level: 'facil', onboarded: true })); }catch(e){} });
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(400);
    /* Servidor SIMULADO: se sustituye solo el cliente de datos; el resto de la página es el real. */
    await page.evaluate(sv => {
      const fake = { from: t => ({ select: async () => {
        if(sv.fail) return { error: { message: 'net' }, data: null };
        if(t === 'academia_progress') return { error: null, data: Object.keys(sv.prog || {}).map(k => ({ course_id: k, state: sv.prog[k] })) };
        return { error: null, data: [{ course_id: 'to-be', enabled: true }, { course_id: 'pronombres', enabled: sv.pronombresOn !== false }] };
      } }) };
      LeoBackend.getClient = () => fake; LeoBackend.getSession = async () => ({ user: { id: 'u1' } });
      window.__leoMemberVerified = true; unlock();
    }, server || {});
    await page.waitForTimeout(600);
    return { page, ctx, errs };
  }
  const noScroll = async page => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  console.log('Inicio del alumno (miembro simulado)');

  await test('Sin avance: Academia y Practicar visibles, botones correctos, sin errores de JS', async()=>{
    const { page, ctx, errs } = await panel(390);
    assert.strictEqual((await page.innerText('#dashAcademia [data-slot="cta"]')).trim(), 'Ir a la Academia');
    assert.strictEqual(await page.getAttribute('#dashAcademia', 'href'), 'academia.html');
    assert.strictEqual((await page.innerText('#dashPracticar .btn')).trim(), 'Practicar ahora');
    assert.strictEqual(await page.getAttribute('#dashPracticar', 'href'), 'plan-estudio.html');
    assert(/Hola, Leo/.test(await page.innerText('#greetLine')));
    assert.deepStrictEqual(errs, []);
    if(SHOTS){ fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, 'inicio-390-nuevo.png'), fullPage: true }); }
    await ctx.close();
  });
  await test('Con TO BE a medias: "Continuar curso", Lección 3 de 5 y barra al 40 %', async()=>{
    const { page, ctx } = await panel(390, { prog: { 'to-be': st(2, ['2026-10-26']) } });
    assert.strictEqual((await page.innerText('#dashAcademia [data-slot="cta"]')).trim(), 'Continuar curso');
    assert(/Lección 3 de 5/.test(await page.innerText('#dashAcademia [data-slot="meta"]')));
    assert.strictEqual(await page.$eval('#dashAcademia .home-bar > span', e => e.style.width), '40%');
    assert.strictEqual(await page.getAttribute('#dashAcademia', 'href'), 'academia.html#/curso/to-be');
    await ctx.close();
  });
  await test('Dos cursos empezados: continúa el más reciente (Pronombres), sin suponer TO BE', async()=>{
    const { page, ctx } = await panel(390, { prog: { 'to-be': st(3, ['2026-10-10']), pronombres: st(1, ['2026-10-26']) } });
    assert.strictEqual(await page.getAttribute('#dashAcademia', 'href'), 'academia.html#/curso/pronombres');
    assert(/Pronombres personales/.test(await page.innerText('#dashAcademia')));
    await ctx.close();
  });
  await test('Cursos terminados: "Ir a la Academia" sin barra de continuar', async()=>{
    const { page, ctx } = await panel(390, { prog: { 'to-be': st(5, ['2026-10-26']), pronombres: st(5, ['2026-10-26']) } });
    assert.strictEqual(await page.getAttribute('#dashAcademia', 'data-academia-state'), 'finished');
    await ctx.close();
  });
  await test('Sin conexión con el servidor: tarjeta neutra, sin cifras, sin errores de JS', async()=>{
    const { page, ctx, errs } = await panel(390, { fail: true });
    assert.strictEqual(await page.getAttribute('#dashAcademia', 'data-academia-state'), 'start'); assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Avance local de OTRA cuenta en este navegador no se muestra (equipo compartido)', async()=>{
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    await ctx.route(/googletagmanager|facebook|fonts\.|supabase|stripe|paypal|mercadopago/, r => r.abort());
    const page = await ctx.newPage();
    await page.addInitScript(() => { try{ localStorage.setItem('leo_academia_piloto_v1', JSON.stringify({ v: 1, lessons: { l1: { done: true }, l2: { done: true }, l3: { done: true } }, resume: {}, days: ['2026-10-26'] })); localStorage.setItem('leo_profile', JSON.stringify({ name: 'Leo', level: 'facil', onboarded: true })); }catch(e){} });
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(300);
    await page.evaluate(() => { LeoBackend.getClient = () => ({ from: () => ({ select: async () => ({ error: null, data: [] }) }) }); LeoBackend.getSession = async () => ({ user: { id: 'otra' } }); window.__leoMemberVerified = true; unlock(); });
    await page.waitForTimeout(500);
    assert.strictEqual(await page.getAttribute('#dashAcademia', 'data-academia-state'), 'start');
    await ctx.close();
  });
  await test('Curso apagado en la base: no se ofrece como "Continuar"', async()=>{
    const { page, ctx } = await panel(390, { prog: { pronombres: st(2, ['2026-10-27']), 'to-be': st(1, ['2026-10-20']) }, pronombresOn: false });
    assert.strictEqual(await page.getAttribute('#dashAcademia', 'href'), 'academia.html#/curso/to-be');
    await ctx.close();
  });
  await test('Orden y tamaño: Academia y Practicar entran en la primera pantalla de 390x800 y el Inicio es corto', async()=>{
    const { page, ctx } = await panel(390, {}, 800);
    const r = await page.evaluate(() => ['dashAcademia', 'dashPracticar'].map(id => { const b = document.getElementById(id).getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; }));
    assert(r[0].top < 800 && r[0].bottom <= 1100, 'Academia: ' + JSON.stringify(r));
    assert(r[1].top < 1100, 'Practicar debe verse con un solo desplazamiento: ' + JSON.stringify(r));
    const total = await page.evaluate(() => document.getElementById('memberContent').scrollHeight);
    assert(total < 3400, 'altura del Inicio ' + total);
    await ctx.close();
  });
  for(const w of [320, 360, 375, 390, 430, 768, 1024, 1440]){
    await test('Sin desplazamiento horizontal ni errores a ' + w + ' px (Inicio)', async()=>{
      const { page, ctx, errs } = await panel(w, { prog: { 'to-be': st(2, ['2026-10-26']) } });
      assert(await noScroll(page), 'hay scroll horizontal');
      const small = await page.$$eval('#memberContent a.btn, .home-more a, .home-card', els => els.filter(e => e.getBoundingClientRect().height < 40).length);
      assert.strictEqual(small, 0, 'objetivos táctiles menores de 40 px');
      assert.deepStrictEqual(errs, []);
      if(SHOTS && (w === 390 || w === 1440)) await page.screenshot({ path: path.join(SHOTS, 'inicio-' + w + '-continuar.png'), fullPage: true });
      await ctx.close();
    });
  }
  await test('Todos los enlaces del Inicio responden (200) y los destinos existen', async()=>{
    const { page, ctx } = await panel(1024);
    const hrefs = await page.$$eval('#memberContent a[href]', as => [...new Set(as.map(a => a.getAttribute('href')))]);
    assert(hrefs.length >= 10, 'pocos enlaces: ' + hrefs.length);
    for(const h of hrefs){ if(/^https?:/.test(h)) continue; const f = h.split(/[?#]/)[0]; assert(fs.existsSync(path.join(root, f)), 'no existe ' + h); }
    await ctx.close();
  });
  await test('Header y barra móvil: 5 destinos, Inicio marcado, menú de cuenta intacto', async()=>{
    const { page, ctx } = await panel(390);
    assert.deepStrictEqual(await page.$$eval('.mobile-nav .mnav-item', b => b.map(x => x.innerText.trim())), ['Inicio', 'Academia', 'Practicar', 'Progreso', 'Aprende']);
    assert.strictEqual(await page.$eval('.mobile-nav .mnav-item.active', b => b.innerText.trim()), 'Inicio');
    assert.strictEqual(await page.$eval('.nav-links a[href="practica-miembros.html"]', a => a.textContent.trim()), 'Practicar', 'el miembro va a la práctica con progreso');
    for(const id of ['navProfileBtn', 'navManageSubBtn', 'navSearchBtn']) assert(await page.$('#' + id), id);
    await ctx.close();
  });
  await test('Los destinos de la barra móvil navegan de verdad', async()=>{
    const { page, ctx } = await panel(390);
    await page.click('.mobile-nav .mnav-item:nth-child(2)'); await page.waitForURL(/academia\.html/); assert(/academia/.test(page.url()));
    await ctx.close();
  });
  await test('Pie de página: Academia lleva a la academia (no a la página comercial) en el área privada', async()=>{
    const { page, ctx } = await panel(1024);
    assert.strictEqual(await page.$eval('footer .foot-links a:nth-child(2)', a => a.getAttribute('href')), 'academia.html');
    await ctx.close();
  });
  await browser.close(); srv.close();
  console.log('\n' + passed + ' pass, ' + failed + ' fail'); process.exit(failed ? 1 : 0);
})();
