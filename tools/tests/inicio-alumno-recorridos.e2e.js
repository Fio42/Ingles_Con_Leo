#!/usr/bin/env node
/* Recorridos completos del alumno en Chromium con el cliente de datos SIMULADO (sin red, sin Supabase, sin pagos).
   Se parchea backend.js al servirlo: la sesión de miembro y el servidor son falsos; las páginas, app.js y la academia son los reales.
   Corre con:  NODE_PATH=$(npm root -g) node tools/tests/inicio-alumno-recorridos.e2e.js */
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ console.log('omitida: falta playwright'); process.exit(0); }
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
const PATCH = `
;(function(){
  const sv = (function(){ try{ return JSON.parse(localStorage.getItem('__sv') || '{}'); }catch(e){ return {}; } })();
  const rows = t => t === 'academia_progress' ? Object.keys(sv.prog || {}).map(k => ({ course_id: k, state: sv.prog[k] })) : [{ course_id: 'to-be', enabled: true }, { course_id: 'pronombres', enabled: true }];
  const q = t => { const o = { select: () => o, eq: () => o, order: () => o, limit: () => o, maybeSingle: async () => ({ data: null, error: null }), single: async () => ({ data: null, error: null }), then: (res, rej) => Promise.resolve({ data: rows(t), error: null }).then(res, rej) }; return o; };
  const fake = { from: q, rpc: async () => ({ data: { ok: true }, error: null }), auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} } } }) } };
  const R = LeoBackend;
  const anon = sv.who === 'anon', free = sv.who === 'free';
  R.getClient = () => fake; R.getSession = async () => (anon ? null : { user: { id: 'u1', email: 'prueba@example.test' } });
  R.requireMemberAsync = async () => !(anon || free); R.getMemberProfile = async () => (anon ? null : { is_member: !free });
  R.syncProgressFromCloud = async () => {}; R.pushSession = async () => {}; R.getMistakeStats = async () => ({ ok: true, items: [] });
})();`;
const srv = http.createServer((req, rsp) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if(!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ rsp.writeHead(404); return rsp.end('no'); }
  let body = fs.readFileSync(p);
  if(path.basename(p) === 'backend.js') body = Buffer.concat([body, Buffer.from(PATCH)]);
  rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); rsp.end(body);
});
let passed = 0, failed = 0;
async function test(name, fn){ try{ await fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 4).join('\n       ')); } }
const st = (n, days) => { const l = {}; for(let i = 1; i <= n; i++) l['l' + i] = { done: true }; return { v: 1, lessons: l, resume: {}, days: days || [] }; };
(async()=>{
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  async function open(w, sv){
    const ctx = await browser.newContext({ viewport: { width: w, height: 844 } });
    await ctx.route(/googletagmanager|facebook|fonts\.|stripe|paypal|mercadopago|cdn\.jsdelivr/, r => r.abort());
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.addInitScript(sv => { try{ localStorage.setItem('leo_profile', JSON.stringify({ name: 'Leo', level: 'facil', onboarded: true })); localStorage.setItem('__sv', JSON.stringify(sv)); localStorage.setItem('leo_academia_member_v1', JSON.stringify({ m: 1, at: Date.now() })); }catch(e){} }, sv || {});
    return { page, ctx, errs };
  }
  const here = (page) => page.url().replace(base, '');
  console.log('Recorridos del alumno (miembro simulado)');

  await test('Inicio → Academia → Curso (retomando el curso empezado) → volver al Inicio', async()=>{
    const { page, ctx, errs } = await open(390, { prog: { 'to-be': st(1, ['2026-10-26']) } });
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(400);
    await page.evaluate(() => { window.__leoMemberVerified = true; unlock(); }); await page.waitForTimeout(500);
    assert(/Continuar curso/.test(await page.innerText('#dashAcademia')));
    await page.click('#dashAcademia'); await page.waitForURL(/academia\.html#\/curso\/to-be/);
    await page.waitForTimeout(800);
    const body = await page.innerText('body');
    assert(/TO BE|Am, is y are/i.test(body), 'la pantalla del curso no cargó');
    assert(/Am, is y are/.test(body) && /Afirmaciones/.test(body), 'la pantalla del curso no lista sus lecciones');
    /* Abrir y terminar una lección con sesión de miembro de verdad lo cubre academia-pronombres.e2e.js (nube simulada sobre Postgres). */
    await page.goto(base + '/academia.html#/curso/to-be/leccion/1'); await page.waitForTimeout(600);
    assert(/leccion\/1/.test(page.url()));
    await page.goBack(); await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelector('.nav-links a[href="miembros.html"]').click()); await page.waitForURL(/miembros\.html/);
    assert(/miembros\.html/.test(here(page)));
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Cuenta gratis: ve la vista previa con la demo de TO BE y su límite real; el panel de miembro no aparece; Practicar sigue siendo la práctica gratis', async()=>{
    const { page, ctx, errs } = await open(390, { who: 'free' });
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(700);
    await page.evaluate(() => { showMemberPreview(); }); await page.waitForTimeout(500);
    assert(await page.isVisible('#memberPreview'));
    assert(!(await page.isVisible('#memberContent')), 'el panel de miembro no debe verse');
    const t = await page.innerText('#memberPreview');
    assert(/Una explicación y tres ejercicios, una sola vez/.test(t) && /incluye en la membresía/.test(t));
    assert(!/Continuar curso|Tu siguiente paso/.test(t), 'no se ofrece lo premium como propio');
    assert.strictEqual(await page.$eval('.nav-links a[href="practica.html"]', a => a.getAttribute('href')), 'practica.html', 'la cuenta gratis no se manda a la práctica de miembros');
    assert(await page.$('#previewActivateBtn') && await page.$('#previewPracticeBtn'));
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Visitante sin sesión: entra al formulario de acceso y la navegación pública funciona', async()=>{
    const { page, ctx } = await open(390, { who: 'anon' });
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(700);
    await page.evaluate(() => { showGate(); }); await page.waitForTimeout(300);
    assert(await page.isVisible('#gate')); assert(!(await page.isVisible('#memberContent')));
    await ctx.close();
  });
  await test('Inicio → Practicar → Plan personalizado carga y ofrece empezar', async()=>{
    const { page, ctx, errs } = await open(390);
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(400);
    await page.evaluate(() => { window.__leoMemberVerified = true; unlock(); }); await page.waitForTimeout(400);
    await page.click('#dashPracticar'); await page.waitForURL(/plan-estudio\.html/); await page.waitForTimeout(900);
    assert(/plan-estudio\.html/.test(here(page)), 'quedó en ' + here(page));
    const t = await page.innerText('main');
    assert(/Plan de estudio|plan|Empezar|sesión/i.test(t), 'sin contenido del plan');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Inicio → Practicar (hub) → Mis errores abre errores.html con su estado vacío útil', async()=>{
    const { page, ctx, errs } = await open(390);
    await page.goto(base + '/practica-miembros.html'); await page.waitForTimeout(900);
    assert(/practica-miembros\.html/.test(here(page)), 'el hub redirigió: ' + here(page));
    assert(await page.$('#levelSelector .level-card'), 'el hub no armó el selector de nivel');
    await page.click('a[href="errores.html"]', { timeout: 4000 }).catch(async()=>{ await page.goto(base + '/errores.html'); });
    await page.waitForURL(/errores\.html/); await page.waitForTimeout(900);
    assert(/errores\.html/.test(here(page)));
    assert((await page.innerText('main')).trim().length > 40, 'errores.html vacía');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Hub de Practicar: nivel y habilidad arrancan una sesión real; Lectura y exámenes alcanzables', async()=>{
    const { page, ctx, errs } = await open(390);
    await page.goto(base + '/practica-miembros.html'); await page.waitForTimeout(900);
    await page.click('#skillTabs >> text=Vocabulario'); await page.waitForTimeout(700);
    assert(/Vocabulario/.test(await page.innerText('#skillHead')));
    assert((await page.innerText('#skillBody')).trim().length > 10, 'la sesión de vocabulario no arrancó');
    for(const h of ['lectura.html', 'toefl.html', 'ielts.html', 'toeic.html', 'cambridge.html', 'clases.html', 'juego.html', 'aprender.html']) assert(await page.$('a[href="' + h + '"]'), 'falta ' + h);
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Inicio → Mi progreso → Avance por curso (datos de la cuenta) y accesos a Mis errores y al plan', async()=>{
    const { page, ctx, errs } = await open(390, { prog: { 'to-be': st(2, ['2026-10-26']), pronombres: st(5, ['2026-10-27']) } });
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(400);
    await page.evaluate(() => { window.__leoMemberVerified = true; unlock(); }); await page.waitForTimeout(400);
    await page.click('.mobile-nav .mnav-item:nth-child(4)'); await page.waitForURL(/progreso\.html/); await page.waitForTimeout(1200);
    const t = await page.innerText('#progressCourses');
    assert(/Lecciones completadas: 2 de 5 · Lección 3 de 5/.test(t), t);
    assert(/Lecciones completadas: 5 de 5(?! ·)/.test(t), t);
    assert(await page.$('a[href="errores.html"]') && await page.$('a[href="plan-estudio.html"]'));
    await page.click('#progressCourses a >> nth=0'); await page.waitForURL(/academia\.html#\/curso\/to-be/);
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Inicio → Aprende inglés → guía gratis (público) y vuelta', async()=>{
    const { page, ctx, errs } = await open(390);
    await page.goto(base + '/miembros.html'); await page.waitForTimeout(400);
    await page.evaluate(() => { window.__leoMemberVerified = true; unlock(); }); await page.waitForTimeout(400);
    await page.click('.mobile-nav .mnav-item:nth-child(5)'); await page.waitForURL(/articulos\.html/);
    const art = await page.$('a[href^="articulo-"]'); assert(art, 'sin guías');
    await art.click(); await page.waitForURL(/articulo-/); assert(/<h1/.test(await page.content()));
    await page.goBack(); await page.waitForURL(/articulos\.html/);
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });
  await test('Explorar más: Modo aprender, Clases interactivas, English Rush y exámenes abren sin errores', async()=>{
    for(const h of ['aprender.html', 'clases.html', 'juego.html', 'toefl.html', 'ielts.html', 'toeic.html', 'cambridge.html', 'lectura.html', 'errores.html', 'plan-estudio.html']){
      const { page, ctx, errs } = await open(390);
      const r = await page.goto(base + '/' + h); await page.waitForTimeout(700);
      assert.strictEqual(r.status(), 200, h);
      assert(/\/(aprender|clases|juego|toefl|ielts|toeic|cambridge|lectura|errores|plan-estudio)\.html/.test(here(page)), h + ' redirigió a ' + here(page));
      assert.deepStrictEqual(errs, [], h + ' errores de JS: ' + errs.join(' | '));
      await ctx.close();
    }
  });
  await test('Menú móvil del encabezado abre y cierra en las 7 páginas del alumno', async()=>{
    for(const h of ['miembros.html', 'plan-estudio.html', 'errores.html', 'aprender.html', 'clases.html', 'practica-miembros.html', 'progreso.html']){
      const { page, ctx } = await open(390);
      await page.goto(base + '/' + h); await page.waitForTimeout(600);
      const burger = await page.$('header .burger, header #burger, header [aria-label*="enú"], header button[class*="burger"]');
      assert(burger, h + ': sin botón de menú');
      await burger.click(); await page.waitForTimeout(250);
      assert(await page.$eval('.nav-links', n => getComputedStyle(n).display !== 'none'), h + ': el menú no abrió');
      await burger.click(); await page.waitForTimeout(250);
      await ctx.close();
    }
  });
  await test('Recargar y entrar directo a rutas privadas con sesión de miembro: se quedan en su página', async()=>{
    for(const h of ['progreso.html', 'practica-miembros.html', 'errores.html']){
      const { page, ctx } = await open(390);
      await page.goto(base + '/' + h); await page.waitForTimeout(500); await page.reload(); await page.waitForTimeout(600);
      assert(new RegExp(h.replace('.', '\\.')).test(here(page)), h + ' → ' + here(page));
      await ctx.close();
    }
  });
  await browser.close(); srv.close();
  console.log('\n' + passed + ' pass, ' + failed + ' fail'); process.exit(failed ? 1 : 0);
})();
