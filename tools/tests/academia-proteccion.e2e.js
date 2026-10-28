#!/usr/bin/env node
/* PROTECCION en el NAVEGADOR: servidor PGlite con las funciones reales de la migracion; el almacenamiento firmado se simula
   aplicando la MISMA regla del servidor (academia_audio_allowed) a cada ruta pedida. Moviles emulados (iPhone 12 y Pixel 5, motor Chromium).
   NO prueba Safari/iOS reales ni el Storage real de Supabase.
   Corre con:  NODE_PATH=$(npm root -g) node tools/tests/academia-proteccion.e2e.js */
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const H = require('./academia-pg-helpers.js');
const root = H.root;
let pw; try{ pw = require('playwright'); }catch(e){ console.log('omitida: falta playwright'); process.exit(0); }
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
const log = { urls: [] };
function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split('?')[0]); log.urls.push(u);
      const priv = u.startsWith('/private-audio/');
      const p = priv ? path.join(root, 'private', 'audio', u.slice(15)) : path.join(root, u);
      if(!p.startsWith(root) || (!priv && /^\/private\//.test(u)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'content-length': fs.statSync(p).size }); fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
const FAKE_BACKEND = `
var LeoBackend = (function(){
  var CLIENT = {
    rpc: function(fn, args){ window.__calls = (window.__calls || []).concat([fn]); return window.__rpc(fn, args); },
    storage: { from: function(bucket){ return { createSignedUrls: function(names, secs){
      window.__signed = (window.__signed || []).concat([{ bucket: bucket, n: names.length, secs: secs, at: Date.now() }]);
      return window.__sign(names).then(function(allowed){ return { data: names.map(function(n){ return allowed.indexOf(n) !== -1 ? { path: n, signedUrl: '/private-audio/' + n + '?token=t' + (window.__signed.length) } : { path: n, signedUrl: null, error: 'denied' }; }), error: null }; }); } }; } },
    from: function(table){ var st = { cols:'*', eq:{} }, b = {
      select: function(c){ st.cols = c || '*'; return b; }, eq: function(k, v){ st.eq[k] = v; return b; },
      maybeSingle: function(){ return window.__select(table, st.cols, st.eq); } }; return b; }
  };
  return { isConfigured: function(){ return true; }, getClient: function(){ return CLIENT; },
    getSession: function(){ return Promise.resolve(window.__UID ? { user:{ id: window.__UID } } : null); },
    applyMistakeResults: function(items){ return CLIENT.rpc('apply_mistake_results', { p_items: items }).then(function(r){ return { ok: !r.error }; }); },
    pushFreeSession: function(s){ return window.__pushSession(s).then(function(){ return 'ok'; }); } };
})();`;
let passed = 0, failed = 0;
async function test(name, fn){ try{ await fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 5).join('\n       ')); } }
async function until(fn, ms, what){ const t0 = Date.now(); for(;;){ const v = await fn(); if(v) return v; if(Date.now() - t0 > (ms || 9000)) throw new Error('tiempo agotado: ' + what); await new Promise(r => setTimeout(r, 100)); } }

(async()=>{
  const PGlite = await H.loadPglite(); if(!PGlite){ console.log('omitida: falta pglite'); return; }
  const cf = path.join(root, 'private', 'contenido', 'articulos.json'); if(!fs.existsSync(cf)){ console.log('omitida: falta private/contenido'); return; }
  console.log('Protección en el navegador (PGlite + moviles emulados)');
  const db = await H.freshDb(PGlite, []);
  for(const m of ['20261027120000_academia_curso_pronombres', '20261028120000_academia_curso_articulos', '20261028180000_academia_contenido_protegido']) await db.exec(H.read('supabase/migrations/' + m + '.sql'));
  const cj = JSON.parse(fs.readFileSync(cf, 'utf8')); cj.audio = JSON.parse(fs.readFileSync(path.join(root, 'private', 'contenido', 'articulos.audio.json'), 'utf8'));
  await db.query('insert into public.academia_content (course_id, version, content) values ($1,$2,$3)', ['articulos', 1, JSON.stringify(cj)]);
  await db.exec(`update public.academia_courses set enabled = true where course_id in ('pronombres','articulos')`);
  await db.exec(`insert into auth.users values ('${H.U.b}') on conflict do nothing`);
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await pw.chromium.launch();
  const errors = [];
  const clients = {};
  async function device(label, uid, opts){
    const ctx = await browser.newContext(Object.assign({}, opts || { viewport: { width: 390, height: 800 } }));
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await ctx.route('**/backend.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_BACKEND }));
    await ctx.route(/fonts\.(googleapis|gstatic)\.com|googletagmanager|connect\.facebook/, r => r.abort());
    const page = await ctx.newPage(); const cl = H.fakeClient(db, uid || H.U.a); clients[label] = cl;
    await page.exposeFunction('__rpc', (fn, args) => uid ? cl.rpc(fn, args) : Promise.resolve({ data: null, error: { message: 'anon' } }));
    await page.exposeFunction('__select', (t, c, eq) => { let b = cl.from(t).select(c); Object.keys(eq).forEach(k => { b = b.eq(k, eq[k]); }); return b.maybeSingle(); });
    await page.exposeFunction('__pushSession', () => Promise.resolve());
    // misma regla que la politica del bucket: academia_audio_allowed(name) calculada por el servidor para ESTE usuario
    await page.exposeFunction('__sign', async names => { if(!uid) return []; const ok = []; for(const n of names){ const r = await H.asUser(db, uid, () => db.query('select public.academia_audio_allowed($1) a', [n])); if(r.rows[0].a) ok.push(n); } return ok; });
    await page.addInitScript(a => { window.__UID = a.uid; try{ localStorage.setItem('leo_academia_canary', '1'); }catch(e){}
      var P = HTMLMediaElement.prototype.play; window.__plays = []; HTMLMediaElement.prototype.play = function(){ window.__plays.push(this.src); return P.apply(this, arguments); }; }, { uid });
    page.on('pageerror', e => errors.push(label + ' ' + e.message));
    return { ctx, page, label };
  }
  const calls = p => p.evaluate(() => window.__calls || []);
  const signed = p => p.evaluate(() => window.__signed || []);
  async function openLesson(p, course, n){
    await p.goto(base + '/academia.html?nube=1#/curso/' + course + '/leccion/' + n); await p.reload(); await p.waitForSelector('.ac-card', { timeout: 15000 });
  }
  async function findAudioBtn(p){
    for(let g = 0; g < 8; g++){
      const b = await p.$('.ac-listen, .ac-item-play, .ac-phrase-btn, .ac-leo'); if(b && await b.isVisible()) return b;
      const nx = await p.$('#acRoot button:text-is("Siguiente →")') || await p.$('#acRoot button:text-is("Practicar")'); if(!nx) break; await nx.click();
    }
    return null;
  }

  await test('VISITANTE (sin sesion): no recibe lecciones ni pide audio; ve la presentacion', async()=>{
    const d = await device('visitante', null);
    await d.page.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/1'); await d.page.reload(); await new Promise(r => setTimeout(r, 2500));
    assert.strictEqual(await d.page.$('.ac-card-act'), null);
    const has = await d.page.evaluate(() => { const l = ACADEMIA.courses.articulos.lessons[0]; return !!(l.screens || l.activities || l.canSay); });
    assert.strictEqual(has, false, 'el visitante tiene contenido en memoria');
    assert.deepStrictEqual(await signed(d.page), []);
    assert.ok(!log.urls.some(u => u.startsWith('/private-audio/')));
    await d.ctx.close();
  });

  await test('CUENTA GRATIS: solo temario; el contenido nunca llega a la memoria ni se pide audio', async()=>{
    const d = await device('gratis', H.U.free);
    await d.page.goto(base + '/academia.html?nube=1#/curso/articulos'); await d.page.reload(); await new Promise(r => setTimeout(r, 3000));
    assert.strictEqual(await d.page.$('.ac-card-act'), null);
    const txt = await d.page.innerText('#acRoot'); assert.ok(/miembro|membres|Desbloquear|academia/i.test(txt), txt.slice(0, 200));
    const has = await d.page.evaluate(() => { const C = ACADEMIA.courses.articulos; return C.lessons.some(l => !!(l.screens || l.activities)) || (C.exam.bank || []).length > 0; });
    assert.strictEqual(has, false);
    assert.deepStrictEqual(await signed(d.page), []);
    await d.ctx.close();
  });

  await test('MIEMBRO en telefono (iPhone 12 y Pixel 5): la leccion carga desde el servidor, el audio suena con enlace de 15 min y no hay URL publica del mp3', async()=>{
    for(const name of ['iPhone 12', 'Pixel 5']){
      const d = await device('movil-' + name, H.U.a, Object.assign({}, pw.devices[name]));
      const before = log.urls.length;
      await openLesson(d.page, 'articulos', 1);
      assert.ok((await calls(d.page)).includes('academia_get_content'));
      const sg = await signed(d.page); assert.ok(sg.length >= 1 && sg[0].bucket === 'academia-audio' && sg[0].secs === 900, JSON.stringify(sg));
      const btn = await findAudioBtn(d.page); assert.ok(btn, 'sin boton de audio');
      await btn.tap();
      await until(async () => (await d.page.evaluate(() => window.__plays)).length > 0, 6000, 'play() en el toque');
      const played = (await d.page.evaluate(() => window.__plays))[0]; assert.ok(/\/private-audio\/articulos\/[0-9a-f]+\.mp3\?token=/.test(played), played);
      await until(() => log.urls.slice(before).some(u => /^\/private-audio\/articulos\/.+\.mp3$/.test(u)), 6000, 'descarga del mp3 firmado');
      assert.ok(!log.urls.some(u => u.startsWith('/audio/academia/articulos')), 'se pidio una ruta publica del curso 3');
      await d.ctx.close();
    }
  });

  await test('RENOVACION: pasados 8 min el enlace se renueva solo; si el enlace vencio a mitad, se pide otro y se reintenta una vez', async()=>{
    const d = await device('renovar', H.U.a, Object.assign({}, pw.devices['Pixel 5']));
    await d.page.clock.install();
    await openLesson(d.page, 'articulos', 1);
    const n0 = (await signed(d.page)).length;
    await d.page.clock.fastForward(5 * 60 * 1000); await d.page.waitForTimeout(300);
    assert.strictEqual((await signed(d.page)).length, n0, 'no debe renovar antes de 8 min');
    await d.page.clock.fastForward(5 * 60 * 1000); await d.page.waitForTimeout(600);   // 10 min en total: toca el temporizador de 4 min
    const n1 = (await signed(d.page)).length; assert.ok(n1 > n0, 'no renovo: ' + n0 + ' -> ' + n1);
    // enlace vencido: el primer pedido del mp3 da 403, el reintento (con enlace nuevo) funciona
    let first = true; await d.ctx.route('**/private-audio/**', r => { if(first){ first = false; return r.fulfill({ status: 403, body: 'expired' }); } return r.continue(); });
    const btn = await findAudioBtn(d.page); await btn.tap();
    await until(async () => (await signed(d.page)).length > n1, 6000, 'nueva firma tras el error');
    await until(async () => (await d.page.evaluate(() => window.__plays)).length >= 2, 6000, 'reintento de reproduccion');
    assert.ok(await btn.isVisible(), 'el boton no debe esconderse tras un enlace vencido');
    await d.ctx.close();
  });

  await test('REVOCACION: si la membresia vence, el siguiente pedido de enlaces ya no entrega ninguno y el audio deja de reproducirse', async()=>{
    await db.exec(`insert into public.profiles (id, is_member) values ('${H.U.b}', true) on conflict (id) do update set is_member = true`);
    const d = await device('revocar', H.U.b, Object.assign({}, pw.devices['iPhone 12']));
    await d.page.clock.install();
    await openLesson(d.page, 'articulos', 1);
    await db.exec(`update public.profiles set is_member = false where id = '${H.U.b}'`);   // el webhook marca el vencimiento
    await d.page.clock.fastForward(10 * 60 * 1000); await d.page.waitForTimeout(800);
    const btn = await findAudioBtn(d.page); const plays0 = (await d.page.evaluate(() => window.__plays)).length;
    if(btn){ await btn.tap(); await d.page.waitForTimeout(800); }
    assert.strictEqual((await d.page.evaluate(() => window.__plays)).length, plays0, 'sono audio sin membresia');
    await d.ctx.close();
    await db.exec(`update public.profiles set is_member = true where id = '${H.U.b}'`);
  });

  await test('CURSO OCULTO: aunque sea miembro, no llega contenido ni se firma audio', async()=>{
    await db.exec(`update public.academia_courses set enabled = false where course_id = 'articulos'`);
    const d = await device('oculto', H.U.a);
    await d.page.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/1'); await d.page.reload(); await new Promise(r => setTimeout(r, 3000));
    assert.strictEqual(await d.page.$('.ac-card-act'), null);
    assert.deepStrictEqual(await signed(d.page), []);
    const has = await d.page.evaluate(() => ACADEMIA.courses.articulos.lessons.some(l => !!(l.screens || l.activities)));
    assert.strictEqual(has, false);
    await d.ctx.close(); await db.exec(`update public.academia_courses set enabled = true where course_id = 'articulos'`);
  });

  await test('TO BE y PRONOMBRES: su leccion carga como siempre, con audio publico, sin ninguna llamada nueva (ni contenido ni firmas)', async()=>{
    const d = await device('cursos-viejos', H.U.a);
    for(const [c, folder] of [['to-be', 'to-be'], ['pronombres', 'pronombres']]){
      const before = log.urls.length;
      await openLesson(d.page, c, 1);
      const btn = await findAudioBtn(d.page);
      if(process.env.DBG) console.log(c, !!btn, btn && await btn.evaluate(e => e.className + '|' + e.innerText));
      if(btn){ await btn.click(); if(process.env.DBG){ await d.page.waitForTimeout(1500); console.log(await d.page.evaluate(() => window.__plays), log.urls.slice(before).filter(u => /mp3|audio/.test(u))); } await until(() => log.urls.slice(before).some(u => /^\/audio\/(academia|aprender)\/.+\.mp3$/.test(u) && u.indexOf('articulos') === -1), 6000, 'audio publico de ' + c); }
    }
    assert.ok(!(await calls(d.page)).includes('academia_get_content'));
    assert.deepStrictEqual(await signed(d.page), []);
    await d.ctx.close();
  });

  await browser.close(); srv.close();
  if(errors.length) console.log('errores de pagina:', errors.slice(0, 5));
  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLAN' : ''));
  process.exit(failed || errors.length ? 1 : 0);
})();
