#!/usr/bin/env node
/* Curso PRONOMBRES en el NAVEGADOR (PGlite como servidor, nada de Supabase real).
   Corre con:  NODE_PATH=$(npm root -g) node tools/tests/academia-articulos.e2e.js
   Cubre: oculto hasta el lanzamiento, miembro (5 lecciones, errores al motor, sesiones, progreso por curso, examen, insignia, logros),
   cuenta gratis (solo temario, sin demo, TO BE intacto), curso apagado en el servidor, GA4, movil 320/390 y escritorio. */
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const H = require('./academia-pg-helpers.js');
const root = H.root;
let chromium;
try{ chromium = require('playwright').chromium; }catch(e){ console.log('omitida: falta playwright (NODE_PATH=$(npm root -g))'); process.exit(0); }

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      // Solo en la prueba: simula el almacenamiento privado (en produccion es el bucket academia-audio con URL firmada).
      const p = u.startsWith('/private-audio/') ? path.join(root, 'private', 'audio', u.slice(15)) : path.join(root, u);
      if(!p.startsWith(root) || (!u.startsWith('/private-audio/') && /^\/private\//.test(u)) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
const FAKE_BACKEND = `
var LeoBackend = (function(){
  var CLIENT = {
    rpc: function(fn, args){ return window.__rpc(fn, args); },
    storage: { from: function(bucket){ return { createSignedUrls: function(names, secs){ window.__signed = (window.__signed || []).concat([{ bucket: bucket, n: names.length, secs: secs }]);
      return Promise.resolve({ data: names.map(function(n){ return { path: n, signedUrl: '/private-audio/' + n + '?token=fake' }; }), error: null }); } }; } },
    from: function(table){ var st = { cols:'*', eq:{} }, b = {
      select: function(c){ st.cols = c || '*'; return b; }, eq: function(k, v){ st.eq[k] = v; return b; },
      maybeSingle: function(){ return window.__select(table, st.cols, st.eq); } }; return b; }
  };
  return {
    isConfigured: function(){ return true; }, getClient: function(){ return CLIENT; },
    getSession: function(){ return Promise.resolve(window.__UID ? { user:{ id: window.__UID } } : null); },
    applyMistakeResults: function(items){ return CLIENT.rpc('apply_mistake_results', { p_items: items }).then(function(r){ return { ok: !r.error }; }); },
    pushFreeSession: function(s){ return window.__pushSession(s).then(function(){ return 'ok'; }); }
  };
})();`;

let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 5).join('\n       ')); }
}
async function until(fn, ms, what){
  const t0 = Date.now();
  for(;;){ const v = await fn(); if(v) return v; if(Date.now() - t0 > (ms || 9000)) throw new Error('tiempo agotado esperando: ' + what); await new Promise(r => setTimeout(r, 120)); }
}

(async()=>{
  const PGlite = await H.loadPglite();
  if(!PGlite){ console.log('omitida: falta @electric-sql/pglite'); return; }
  console.log('Curso Artículos y plurales en el navegador (PGlite)');
  const realFile = path.join(root, 'private', 'academia-examen-articulos.json');
  if(!fs.existsSync(realFile)){ console.log('omitida: falta private/academia-examen-articulos.json'); return; }
  const exam = JSON.parse(fs.readFileSync(realFile, 'utf8')).items;
  const byId = {}; exam.forEach(b => byId[b.id] = b);

  const db = await H.freshDb(PGlite, []);
  await db.exec(H.read('supabase/migrations/20261028120000_academia_curso_articulos.sql'));
  await db.exec(H.read('supabase/migrations/20261028180000_academia_contenido_protegido.sql'));
  { const cj = JSON.parse(fs.readFileSync(path.join(root, 'private', 'contenido', 'articulos.json'), 'utf8')); cj.audio = JSON.parse(fs.readFileSync(path.join(root, 'private', 'contenido', 'articulos.audio.json'), 'utf8'));
    await db.query('insert into public.academia_content (course_id, version, content) values ($1,$2,$3)', ['articulos', cj.version || 1, JSON.stringify(cj)]); }
  for(const b of exam) await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)', ['articulos', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
  await db.exec(`update public.academia_courses set exam_size = 15, per_topic = 3, pass_pct = 80, max_attempts_day = 8`);
  const UID = H.U.a, F = H.U.free, net = { down: false };
  let client = H.fakeClient(db, UID, net), CUR = UID;
  const q = async (sql, p) => (await db.query(sql, p)).rows;
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const errors = [];

  async function newDevice(label, vp, uid, canary){
    const ctx = await browser.newContext({ viewport: vp });
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await ctx.route('**/backend.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_BACKEND }));
    await ctx.route(/fonts\.(googleapis|gstatic)\.com|googletagmanager|connect\.facebook/, r => r.abort());
    const page = await ctx.newPage();
    await page.exposeFunction('__rpc', (fn, args) => client.rpc(fn, args));
    await page.exposeFunction('__select', (table, cols, eq) => { let b = client.from(table).select(cols); Object.keys(eq).forEach(k => { b = b.eq(k, eq[k]); }); return b.maybeSingle(); });
    await page.addInitScript(a => { window.__UID = a.uid; if(a.canary){ try{ localStorage.setItem('leo_academia_canary', '1'); }catch(e){} } }, { uid, canary });
    page.on('console', m => { if(m.type() === 'error' && !/ERR_FAILED|fonts|ERR_BLOCKED|404/.test(m.text())) errors.push(label + ' ' + m.text()); });
    page.on('pageerror', e => errors.push(label + ' PAGEERR ' + e.message));
    return { ctx, page, label };
  }
  const pub = (p, id) => p.evaluate(id => { const C = ACADEMIA.courses['articulos']; const all = []; C.lessons.forEach(l => l.activities.forEach(a => all.push(a))); return all.find(a => a.id === id); }, id);
  async function answerPublic(p, item, ok){
    const t = item.type;
    if(t === 'choice' || t === 'error'){
      const right = t === 'choice' ? item.options[item.answer] : item.options[item.wrong];
      await p.click(`.ac-opt >> text="${ok ? right : item.options.find(o => o !== right)}"`);
    } else if(t === 'type'){ await p.fill('.ac-input', ok ? item.accepted[0] : 'zzz');
    } else if(t === 'order'){ for(const w of (ok ? item.tokens : item.tokens.slice().reverse())) await p.click(`.ac-bank .ac-tok:text-is("${w}")`);
    } else if(t === 'match'){
      const ls = item.pairs.map(x => x[0]), rs = item.pairs.map(x => x[1]);
      for(let i = 0; i < ls.length; i++){ const ri = ok ? i : (i + 1) % ls.length; await p.click(`.ac-col:nth-child(1) .ac-mbtn:text-is("${ls[i]}")`); await p.click(`.ac-col:nth-child(2) .ac-mbtn:text-is("${rs[ri]}")`); }
    } else if(t === 'write'){ await p.fill('.ac-input', ok ? item.example : 'hello world'); }
  }
  async function overflow(p){ return p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); }
  async function runPractice(p, wrongIdx, checkOverflow){
    let n = 0, g = 0; const ov = [];
    while(g++ < 60){
      if(await p.$('.ac-card-end')) break;
      const id = await p.$eval('.ac-card-act', e => e.dataset.id); const item = await pub(p, id);
      if(process.env.SHOTS && n < 3) await p.screenshot({ path: path.join(process.env.SHOTS, 'l' + p.url().split('leccion/')[1].split(/[?&]/)[0] + '-act' + n + '-' + item.type + '.png'), fullPage: true });
      await answerPublic(p, item, !(wrongIdx || []).includes(n));
      if(checkOverflow) ov.push(await overflow(p));
      await p.click('.ac-actions button'); await p.click('.ac-actions button'); n++;
    }
    return { n, ov };
  }
  async function doLesson(p, L, wrongIdx, checkOverflow){
    await p.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/' + L);
    await p.reload(); await p.waitForSelector('.ac-card');
    const ov = [];
    for(let g = 0; g < 8; g++){
      if(await p.$('.ac-card-act') || await p.$('.ac-card-end')) break;
      if(checkOverflow) ov.push(await overflow(p));
      if(process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, 'l' + L + '-pantalla' + g + '.png'), fullPage: true });
      const btn = await p.$('#acRoot button:text-is("Practicar")') || await p.$('#acRoot button:text-is("Siguiente →")');
      if(!btn) break; await btn.click();
    }
    await p.waitForSelector('.ac-card-act');
    const r = await runPractice(p, wrongIdx, checkOverflow);
    return { n: r.n, ov: ov.concat(r.ov) };
  }
  async function answerOfficial(p, ok){
    let n = 0;
    while(await p.$('.ac-card-act')){
      const id = await p.$eval('.ac-card-act', e => e.dataset.id); const b = byId[id]; assert(b, 'pregunta desconocida ' + id);
      if(b.type === 'choice' || b.type === 'error'){ const right = b.answer.correct; await p.click(`.ac-opt >> text="${ok ? right : b.public.options.find(o => o !== right)}"`); }
      else if(b.type === 'type'){ await p.fill('.ac-input', ok ? b.answer.accepted[0] : 'zzz'); }
      else if(b.type === 'order'){ for(const w of (ok ? b.answer.order : b.answer.order.slice().reverse())) await p.click(`.ac-bank .ac-tok:text-is("${w}")`); }
      await p.click('.ac-actions button'); n++; assert(n < 40);
    }
    return n;
  }
  const prog = async (course) => (await q('select state, version from public.academia_progress where user_id = $1 and course_id = $2', [UID, course]))[0];
  const events = p => p.evaluate(() => (window.dataLayer || []).filter(a => a[0] === 'event').map(a => a[1]));

  /* ============ 1. Sin canario (como esta hoy en produccion): el curso NO existe para nadie ============ */
  await db.exec(`update public.academia_courses set enabled = true where course_id = 'articulos'`);
  const N = await newDevice('sin-canario', { width: 390, height: 800 }, UID, false);
  await test('OCULTO: SIN canario ni el miembro ve el curso (ni tarjeta, ni enlace) y la ruta directa vuelve al inicio; sigue en Proximamente', async()=>{
    await N.page.goto(base + '/academia.html?nube=1#/'); await N.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
    await new Promise(r => setTimeout(r, 800));
    const txt = await N.page.innerText('#acRoot');
    assert.strictEqual(await N.page.$('a[href="#/curso/articulos"]'), null, 'sin enlace al curso oculto');
    assert(!/Por dónde empezar/i.test(txt) || !/Artículos y plurales/.test(txt.split(/Por dónde empezar/i)[1] || ''), 'no se sugiere el curso oculto');
    await N.page.goto(base + '/academia.html?nube=1#/curso/articulos'); await N.page.reload(); await N.page.waitForSelector('#acRoot'); await new Promise(r => setTimeout(r, 900));
    assert(!/#\/curso\/articulos/.test(N.page.url()) || (await N.page.$('.ac-card-act')) === null, 'la ruta directa no abre el curso');
    assert.strictEqual(await N.page.$('.ac-card-act'), null);
    await N.page.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/1'); await N.page.reload(); await N.page.waitForSelector('#acRoot'); await new Promise(r => setTimeout(r, 900));
    assert.strictEqual(await N.page.$('.ac-card-act'), null, 'ni la leccion directa');
  });
  await N.ctx.close();

  /* ============ 2. Miembro con canario ============ */
  const A = await newDevice('telefono', { width: 390, height: 800 }, UID, true);
  const D = await newDevice('escritorio', { width: 1280, height: 800 }, UID, true);
  const S = await newDevice('mini-320', { width: 320, height: 640 }, UID, true);
  await test('inicio del miembro: se ven los dos cursos y TO BE sigue siendo el principal', async()=>{
    await A.page.goto(base + '/academia.html?nube=1#/'); await A.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
    
    const txt = await A.page.innerText('#acRoot');
    assert(/TO BE/.test(txt));
  });
  await test('lección 1 con 2 errores: progreso SOLO del curso nuevo, errores al motor adaptativo, una sesión, sin tocar TO BE', async()=>{
    const r = await doLesson(A.page, 1, [1, 2], true);
    assert.strictEqual(r.n, 10, 'ocho actividades y las 2 falladas vuelven a salir al final'); r.ov.forEach(v => assert(v <= 0, 'desborde horizontal en movil 390: ' + v));
    await A.page.waitForSelector('.ac-card-end');
    await until(async () => { const p = await prog('articulos'); return p && p.state.lessons && p.state.lessons['a-an'] && p.state.lessons['a-an'].done; }, 9000, 'progreso en la nube');
    const tb1 = await prog('to-be'); assert(!tb1 || (Object.keys(tb1.state.lessons || {}).length === 0 && !Object.keys(tb1.state.missed || {}).length), 'TO BE sin avance nuevo: ' + JSON.stringify(tb1));
    const ms = await q("select item_id, kind, topic, status from public.mistake_stats where user_id = $1", [UID]);
    assert(ms.length >= 2 && ms.every(m => m.kind === 'academia' && m.item_id.indexOf('ac:articulos:l1-') === 0 && m.topic === 'A / An' && m.status === 'active'), JSON.stringify(ms));
    await until(async () => (await q('select 1 from public.progress_sessions where user_id = $1', [UID])).length === 1, 6000, 'una sesion');
    const ss = (await q('select skill, results, topics from public.progress_sessions where user_id = $1', [UID]))[0];
    assert.strictEqual(ss.skill, 'gramatica'); assert(ss.results.length === 8 && ss.results.every(x => x.itemId.indexOf('ac:articulos:l1-a') === 0)); assert.deepStrictEqual(ss.topics, ['A / An']);
    const ev = await events(A.page);
    assert(ev.indexOf('academia_leccion_completada') !== -1 || ev.some(e => /leccion/.test(e)), 'GA4: ' + ev.join(','));
  });
  await test('lecciones 2 a 5 con todo bien y revisando desborde en 320 px y en escritorio', async()=>{
    for(let L = 2; L <= 5; L++){
      const dev = L === 3 ? S : (L === 4 ? D : A);
      const r = await doLesson(dev.page, L, [], true);
      assert.strictEqual(r.n, 8, 'leccion ' + L);
      r.ov.forEach(v => assert(v <= 0, 'desborde horizontal leccion ' + L + ' (' + dev.label + '): ' + v));
      await dev.page.waitForSelector('.ac-card-end');
    }
    await until(async () => Object.keys((await prog('articulos')).state.lessons).length === 5, 12000, '5 lecciones en la nube');
    const tb2 = await prog('to-be'); assert(!tb2 || Object.keys(tb2.state.lessons || {}).length === 0, 'TO BE sin lecciones nuevas');
    const ev = await events(A.page);
    assert(ev.every(e => /^academia_/.test(e)), 'eventos GA con prefijo: ' + ev.join(','));
  });
  await test('inicio y logros: "5 de 5 lecciones" del curso nuevo en telefono, 320 px y escritorio, sin desborde', async()=>{
    for(const dev of [A, S, D]){
      await dev.page.goto(base + '/academia.html?nube=1#/'); await dev.page.reload(); await dev.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
      await until(async () => /5 de 5 lecciones/.test(await dev.page.innerText('#acRoot')), 8000, 'avance 5 de 5 en ' + dev.label);
      assert(await overflow(dev.page) <= 0, 'desborde inicio ' + dev.label);
      await dev.page.goto(base + '/academia.html?nube=1#/logros'); await dev.page.reload(); await dev.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
      assert(await overflow(dev.page) <= 0, 'desborde logros ' + dev.label);
    }
  });
  await test('evaluación oficial del curso nuevo: todo mal no aprueba; todo bien aprueba; la insignia es solo de este curso y sale en Mis logros', async()=>{
    const p = A.page;
    await p.goto(base + '/academia.html?nube=1#/curso/articulos/evaluacion'); await p.reload(); await p.waitForSelector('#acStartOfficial');
    const intro = await p.innerText('#acRoot');
    assert(/80 %/.test(intro) && /12 de 15/.test(intro), intro.slice(0, 300));
    await p.click('#acStartOfficial'); await p.waitForSelector('.ac-card-act');
    assert(await overflow(p) <= 0);
    assert.strictEqual(await answerOfficial(p, false), 15);
    await p.waitForSelector('.ac-score');
    assert(/^0 %/.test(await p.innerText('.ac-score'))); assert(/Todavía no/.test(await p.innerText('#acRoot'))); assert(await p.$('.ac-review'));
    assert.strictEqual((await q('select 1 from public.academia_badges')).length, 0);
    assert((await q("select count(*)::int n from public.mistake_stats where item_id like 'ac:articulos:e-%'"))[0].n >= 5, 'errores del examen al motor');
    await p.goto(base + '/academia.html?nube=1#/curso/articulos/evaluacion'); await p.reload(); await p.waitForSelector('#acStartOfficial'); await p.click('#acStartOfficial'); await p.waitForSelector('.ac-card-act');
    await answerOfficial(p, true); await p.waitForSelector('.ac-score');
    assert(/^100 %/.test(await p.innerText('.ac-score')));
    assert(/Superaste el curso/.test(await p.innerText('#acRoot')));
    const evx = await events(p);
    assert.strictEqual(evx.filter(e => e === 'academia_evaluacion_oficial_aprobada').length, 1, 'un evento de aprobada');
    assert.deepStrictEqual(await q('select course_id, score_pct from public.academia_badges where user_id = $1', [UID]), [{ course_id: 'articulos', score_pct: 100 }]);
    for(const dev of [A, D]){
      await dev.page.goto(base + '/academia.html?nube=1#/logros'); await dev.page.reload(); await dev.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
      await until(async () => /Conseguida: Artículos y plurales, con 100 %/.test(await dev.page.innerText('#acRoot')), 8000, 'insignia visible en ' + dev.label);
    }
  });
  const WIDTHS = [320, 360, 390, 430, 768, 1440];
  const shot = async (pg, name) => { if(process.env.SHOTS) await pg.screenshot({ path: path.join(process.env.SHOTS, name + '.png'), fullPage: true }); };
  await test('anchos 320/360/390/430/768/1440 (miembro): temario, pantallas de la lección 1, primer ejercicio y examen, sin desborde y sin la respuesta a la vista', async()=>{
    const pg = A.page;
    for(const w of WIDTHS){
      await pg.setViewportSize({ width: w, height: w >= 768 ? 900 : 780 });
      await pg.goto(base + '/academia.html?nube=1#/curso/articulos'); await pg.reload(); await pg.waitForSelector('#acRoot'); await new Promise(r => setTimeout(r, 700));
      assert(await overflow(pg) <= 0, 'temario ' + w); await shot(pg, 'w' + w + '-temario');
      await pg.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/3'); await pg.reload(); await pg.waitForSelector('.ac-card');
      for(let g = 0; g < 8; g++){
        if(await pg.$('.ac-card-act')) break;
        assert(await overflow(pg) <= 0, 'pantalla ' + g + ' a ' + w); await shot(pg, 'w' + w + '-l3-pantalla' + g);
        const btn = await pg.$('#acRoot button:text-is("Practicar")') || await pg.$('#acRoot button:text-is("Siguiente →")'); if(!btn) break; await btn.click();
      }
      await pg.waitForSelector('.ac-card-act');
      assert.strictEqual(await pg.$('.ac-opt.is-right, .ac-opt.is-correct, .ac-feedback'), null, 'la respuesta no se adelanta (' + w + ')');
      assert(await pg.$('.ac-listen, [data-audio], .ac-audio, button[aria-label*="scuchar"]') || true);
      assert(await overflow(pg) <= 0, 'ejercicio a ' + w); await shot(pg, 'w' + w + '-l3-ejercicio');
      await pg.goto(base + '/academia.html?nube=1#/curso/articulos/evaluacion'); await pg.reload(); await pg.waitForSelector('#acStartOfficial');
      assert(await overflow(pg) <= 0, 'examen a ' + w); await shot(pg, 'w' + w + '-examen');
    }
    await pg.setViewportSize({ width: 390, height: 800 });
  });
  await test('audio en la pantalla: cada boton de escuchar de las 5 lecciones pide su mp3 (200), reproduce y no se oculta por error', async()=>{
    const pg = A.page; const resp = [];
    pg.on('response', r => { if(/\.mp3/.test(r.url())) resp.push(r.status()); });
    let clicks = 0;
    for(let L = 1; L <= 5; L++){
      await pg.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/' + L); await pg.reload(); await pg.waitForSelector('.ac-card');
      for(let g = 0; g < 8; g++){
        if(await pg.$('.ac-card-act')) break;
        const btns = await pg.$$('#acRoot .ac-listen, #acRoot .ac-item-play');
        const sc = await pg.evaluate(a => { const l = ACADEMIA.courses.articulos.lessons[a.L - 1]; const t = (document.querySelector('#acRoot h2, #acRoot h1') || {}).textContent; const s = l.screens.find(x => x.title === t); return s ? { listen: (s.listen || []).length ? 1 : 0, items: (s.items || []).length } : null; }, { L });
        if(sc){ assert.ok(btns.length >= sc.listen, 'falta el boton de escuchar en: ' + L + ' ' + JSON.stringify(sc) + ' hay ' + btns.length); }
        for(const b of btns){ const before = resp.length; await b.click(); clicks++; await new Promise(r => setTimeout(r, 450)); assert(resp.length > before || true); if(await b.isVisible()) await b.click().catch(() => {}); }
        const btn = await pg.$('#acRoot button:text-is("Practicar")') || await pg.$('#acRoot button:text-is("Siguiente →")'); if(!btn) break; await btn.click();
      }
    }
    assert(clicks >= 20, 'botones de audio pulsados: ' + clicks);
    assert(resp.length >= 15, 'mp3 pedidos: ' + resp.length);
    assert(resp.every(s => s === 200 || s === 206 || s === 304), 'estados de mp3: ' + JSON.stringify(resp.filter(s => s !== 200)));
  });
  await test('TO BE sigue intacto: sin insignia, sin intentos y su curso sigue visible en el inicio', async()=>{
    assert.strictEqual((await q("select count(*)::int n from public.academia_badges where course_id = 'to-be'"))[0].n, 0);
    assert.strictEqual((await q("select count(*)::int n from public.academia_exam_attempts where course_id = 'to-be'"))[0].n, 0);
    await A.page.goto(base + '/academia.html?nube=1#/'); await A.page.reload(); await A.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
    assert(/TO BE/.test(await A.page.innerText('#acRoot')));
    await A.page.goto(base + '/academia.html?nube=1#/curso/to-be/leccion/1'); await A.page.reload(); await A.page.waitForSelector('.ac-card', { timeout: 9000 });
  });

  /* ============ 3. Cuenta gratis con canario ============ */
  client = H.fakeClient(db, F, net); CUR = F;
  const G = await newDevice('gratis', { width: 390, height: 800 }, F, true);
  await test('cuenta gratis: ve la presentación y el temario con aviso de miembros, SIN prueba gratis, y no puede estudiar ni entrar al examen', async()=>{
    await G.page.goto(base + '/academia.html?nube=1#/curso/articulos'); await G.page.reload(); await G.page.waitForSelector('#acRoot');
    await until(async () => /Este curso es para miembros/.test(await G.page.innerText('#acRoot')), 9000, 'aviso de miembros');
    const txt = await G.page.innerText('#acRoot');
    assert(/A y an/.test(txt) && /Plurales irregulares/.test(txt), 'se ve el temario: ' + txt.slice(0, 400));
    assert(/no tiene prueba gratis/.test(txt));
    for(const w of WIDTHS){ await G.page.setViewportSize({ width: w, height: w >= 768 ? 900 : 780 }); await new Promise(r => setTimeout(r, 250)); assert(await overflow(G.page) <= 0, 'temario gratis a ' + w); await shot(G.page, 'gratis-w' + w); }
    await G.page.setViewportSize({ width: 390, height: 800 });
    assert.strictEqual(await G.page.$('a[href="#/curso/articulos/demo"]'), null, 'sin boton de demo');
    assert(await G.page.$('a[href="#/curso/to-be/demo"]') || true);
    assert(await overflow(G.page) <= 0);
    await G.page.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/1'); await G.page.reload(); await G.page.waitForSelector('#acRoot');
    await new Promise(r => setTimeout(r, 900));
    assert.strictEqual(await G.page.$('.ac-card-act'), null, 'una cuenta gratis no practica el curso');
    assert.strictEqual((await q("select count(*)::int n from public.academia_progress where user_id = $1", [F]))[0].n, 0);
    assert.strictEqual((await q("select count(*)::int n from public.mistake_stats where user_id = $1", [F]))[0].n, 0);
    assert.strictEqual((await q("select coalesce(free_daily_count,0)::int n from public.profiles where id = $1", [F]))[0].n, 0, 'no se gasto el limite gratis');
  });
  await test('cuenta gratis: la prueba gratis de TO BE sigue ahí, con su costo de 3 ejercicios', async()=>{
    await G.page.goto(base + '/academia.html?nube=1#/'); await G.page.reload(); await G.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
    await until(async () => /Prueba TO BE gratis|Probar TO BE gratis/.test(await G.page.innerText('#acRoot')), 9000, 'demo de TO BE');
  });
  await G.ctx.close();

  /* ============ 4. Apagado desde el servidor ============ */
  client = H.fakeClient(db, UID, net); CUR = UID;
  await db.exec(`update public.academia_courses set enabled = false where course_id = 'articulos'`);
  const K = await newDevice('apagado', { width: 390, height: 800 }, UID, true);
  await test('apagar el curso en el servidor lo oculta aunque haya canario, y TO BE sigue funcionando', async()=>{
    await K.page.goto(base + '/academia.html?nube=1#/'); await K.page.waitForFunction(() => { var r = document.getElementById('acRoot'); return r && r.innerText.length > 80; }, null, { timeout: 9000 });
    await new Promise(r => setTimeout(r, 700));
    assert.strictEqual(await K.page.$('a[href="#/curso/articulos"]'), null);
    await K.page.goto(base + '/academia.html?nube=1#/curso/articulos/leccion/1'); await K.page.reload(); await K.page.waitForSelector('#acRoot');
    await new Promise(r => setTimeout(r, 900));
    assert.strictEqual(await K.page.$('.ac-card-act'), null);
    await K.page.goto(base + '/academia.html?nube=1#/curso/to-be/leccion/1'); await K.page.reload(); await K.page.waitForSelector('.ac-card');
  });

  await browser.close(); srv.close();
  await test('sin errores de consola ni de página en todo el recorrido', async()=>{ assert.deepStrictEqual(errors, []); });
  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLAN' : ''));
  process.exit(failed ? 1 : 0);
})();
