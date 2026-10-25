#!/usr/bin/env node
/* Academia en el NAVEGADOR con la nube encendida, contra la base REAL de la migracion (PGlite). No toca Supabase.
   Corre con:  node tools/tests/academia-e2e-nube.js
   Necesita: playwright (NODE_PATH=$(npm root -g) si esta instalado global) y @electric-sql/pglite.
   Dos "dispositivos" (dos contextos de navegador) comparten la misma cuenta. Se sirve el repo con un servidor local
   y se sustituyen supabase.js y backend.js por un falso que habla con PGlite (el codigo de la academia es el real).

   Recorrido: lecciones con errores -> la nube guarda progreso, errores (mistake_stats) y una sesion por leccion ->
   el otro dispositivo sigue donde se quedo -> refuerzo y "volver a donde estabas" -> sin red no se pierde nada ->
   evaluacion oficial (falla, se repite, aprueba) -> insignia solo por servidor. */
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert');
const H = require('./academia-pg-helpers.js');
const root = H.root;
let chromium;
try{ chromium = require('playwright').chromium; }catch(e){ console.log('omitida: falta playwright (NODE_PATH=$(npm root -g))'); process.exit(0); }

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
      if(!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
const FAKE_BACKEND = `
var LeoBackend = (function(){
  var CLIENT = {
    rpc: function(fn, args){ return window.__rpc(fn, args); },
    from: function(table){ var st = { cols:'*', eq:{} }, b = {
      select: function(c){ st.cols = c || '*'; return b; }, eq: function(k, v){ st.eq[k] = v; return b; },
      maybeSingle: function(){ return window.__select(table, st.cols, st.eq); } }; return b; }
  };
  return {
    isConfigured: function(){ return true; }, getClient: function(){ return CLIENT; },
    getSession: function(){ return Promise.resolve({ user:{ id: window.__UID } }); },
    applyMistakeResults: function(items){ return CLIENT.rpc('apply_mistake_results', { p_items: items }).then(function(r){ return { ok: !r.error }; }); },
    pushSession: function(s){ return window.__pushSession(s); }
  };
})();`;

let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 4).join('\n       ')); }
}
async function until(fn, ms, what){
  const t0 = Date.now();
  for(;;){ const v = await fn(); if(v) return v; if(Date.now() - t0 > (ms || 9000)) throw new Error('tiempo agotado esperando: ' + what); await new Promise(r => setTimeout(r, 120)); }
}

(async()=>{
  const PGlite = await H.loadPglite();
  if(!PGlite){ console.log('omitida: falta @electric-sql/pglite'); return; }
  console.log('Academia en el navegador con la nube (PGlite)');
  const realFile = path.join(root, 'private', 'academia-examen-to-be.json');
  const bank = fs.existsSync(realFile) ? JSON.parse(fs.readFileSync(realFile, 'utf8')).items : null;
  if(!bank) console.log('  (sin private/academia-examen-to-be.json: la evaluacion oficial se prueba con un banco de prueba)');
  const exam = bank || (() => { const o = []; ['forma', 'afirm', 'neg', 'preg', 'vida'].forEach(t => { for(let i = 1; i <= 4; i++) o.push({ id: 'e-' + t[0] + i, topic: t, type: 'choice', public: { q: 'Pregunta ' + t + i, options: ['uno', 'dos', 'tres'] }, answer: { correct: 'dos', why: 'porque dos' } }); }); return o; })();
  const byId = {}; exam.forEach(b => byId[b.id] = b);

  const db = await H.freshDb(PGlite, exam);
  await db.exec(`update public.academia_courses set exam_size = 15, per_topic = 3, pass_pct = 80, max_attempts_day = 5`);
  const UID = H.U.a, net = { down: false };
  const client = H.fakeClient(db, UID, net);
  const pushed = [];
  const q = async (sql, p) => (await db.query(sql, p)).rows;

  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const errors = [];
  async function newDevice(label, vp){
    const ctx = await browser.newContext({ viewport: vp || { width: 390, height: 800 } });
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await ctx.route('**/backend.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_BACKEND }));
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    await page.exposeFunction('__rpc', (fn, args) => client.rpc(fn, args));
    await page.exposeFunction('__select', (table, cols, eq) => { let b = client.from(table).select(cols); Object.keys(eq).forEach(k => { b = b.eq(k, eq[k]); }); return b.maybeSingle(); });
    await page.exposeFunction('__pushSession', s => { pushed.push(s); });
    await page.addInitScript(uid => { window.__UID = uid; }, UID);
    page.on('console', m => { if(m.type() === 'error' && !/ERR_FAILED|fonts|ERR_BLOCKED/.test(m.text())) errors.push(label + ' ' + m.text()); });
    page.on('pageerror', e => errors.push(label + ' PAGEERR ' + e.message));
    return { ctx, page, label };
  }
  const find = (p, id) => p.evaluate(id => { const C = ACADEMIA.courses['to-be']; const all = []; C.lessons.forEach(l => l.activities.forEach(a => all.push(a))); C.exam.bank.forEach(a => all.push(a)); return all.find(a => a.id === id) || null; }, id);
  async function answerPublic(p, item, ok){
    const t = item.type;
    if(t === 'choice' || t === 'error'){
      const right = t === 'choice' ? item.options[item.answer] : item.options[item.wrong];
      await p.click(`.ac-opt >> text="${ok ? right : item.options.find(o => o !== right)}"`);
    } else if(t === 'type'){ await p.fill('.ac-input', ok ? item.accepted[0] : 'zzz');
    } else if(t === 'order'){ for(const w of (ok ? item.tokens : item.tokens.slice().reverse())) await p.click(`.ac-bank .ac-tok:text-is("${w}")`);
    } else if(t === 'match'){ const ls = item.pairs.map(x => x[0]), rs = item.pairs.map(x => x[1]); for(let i = 0; i < ls.length; i++){ const ri = ok ? i : (i + 1) % ls.length; await p.click(`.ac-col:nth-child(1) .ac-mbtn:text-is("${ls[i]}")`); await p.click(`.ac-col:nth-child(2) .ac-mbtn:text-is("${rs[ri]}")`); }
    } else if(t === 'write'){ await p.fill('.ac-input', ok ? item.example : 'hello world'); }
  }
  async function runPractice(p, wrongIdx, stopAfter){
    let n = 0, g = 0;
    while(g++ < 60){
      if(await p.$('.ac-card-end')) break;
      if(stopAfter !== undefined && n >= stopAfter) break;
      const id = await p.$eval('.ac-card-act', e => e.dataset.id); const item = await find(p, id);
      await answerPublic(p, item, !(wrongIdx || []).includes(n));
      await p.click('.ac-actions button'); await p.click('.ac-actions button'); n++;
    }
    return n;
  }
  async function doLesson(p, L, wrongIdx, stopAfter){
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/leccion/' + L);
    await p.evaluate(() => location.reload());
    await p.waitForSelector('.ac-card');
    // salta las pantallas de explicacion
    for(let g = 0; g < 8; g++){
      if(await p.$('.ac-card-act') || await p.$('.ac-card-end')) break;
      const btn = await p.$('#acRoot >> text=Practicar') || await p.$('#acRoot >> text=Siguiente →');
      if(!btn) break; await btn.click();
    }
    await p.waitForSelector('.ac-card-act');
    return runPractice(p, wrongIdx, stopAfter);
  }
  async function bootReady(p){
    await p.goto(base + '/academia.html?nube=1#/logros');
    await p.waitForSelector('#acSync', { timeout: 8000 });
  }
  const shot = async (p, name) => { if(process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, name + '.png'), fullPage: true }); };
  const prog = async () => (await q('select state, version from public.academia_progress where user_id = $1', [UID]))[0];

  const A = await newDevice('telefono', { width: 390, height: 800 });
  const B = await newDevice('computadora', { width: 1280, height: 800 });

  await test('el curso arranca en la nube: se ve "tu avance se guarda en tu cuenta" y sin errores', async()=>{
    await bootReady(A.page);
    assert(/se guarda en tu cuenta/.test(await A.page.innerText('#acSync')));
  });
  await test('lección 1 con 2 errores: progreso en la nube + errores en el motor + UNA sesión normal', async()=>{
    await doLesson(A.page, 1, [1, 2]);
    await A.page.waitForSelector('.ac-card-end');
    await until(async () => { const r = await prog(); return r && r.state.lessons && r.state.lessons['am-is-are'] && r.state.lessons['am-is-are'].done; }, 9000, 'progreso de la leccion 1 en la nube');
    const ms = await q("select item_id, status, kind from public.mistake_stats where user_id = $1 order by item_id", [UID]);
    assert(ms.length >= 2, 'esperaba errores en mistake_stats: ' + JSON.stringify(ms));
    assert(ms.every(m => m.kind === 'academia' && m.item_id.indexOf('ac:to-be:l1-') === 0 && m.status === 'active'));
    await until(() => pushed.length >= 1, 6000, 'sesion de la leccion');
    assert.strictEqual(pushed[0].skill, 'gramatica'); assert(pushed[0].results.length === 8 && pushed[0].results.every(r => r.itemId.indexOf('ac:to-be:l1-a') === 0));
    assert(pushed[0].results.filter(r => !r.isCorrect).length === 2);
  });
  await test('lección 2 a medias en el telefono: queda guardada para otro dispositivo', async()=>{
    await doLesson(A.page, 2, [], 3);
    await A.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await A.page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await until(async () => { const r = await prog(); return r && r.state.resume && r.state.resume.afirmaciones && r.state.resume.afirmaciones.queue; }, 9000, 'lección 2 a medias en la nube');
  });
  await test('en la computadora (otro navegador, vacío) aparece lo hecho y la lección 2 sigue EXACTO donde estaba', async()=>{
    await B.page.goto(base + '/academia.html?nube=1#/');
    await until(async () => /Seguir|a medias/.test(await B.page.innerText('#acRoot')), 8000, 'la computadora ve la leccion a medias');
    const txt = await B.page.innerText('#acRoot');
    assert(/1 de 5 lecciones/.test(txt), txt.slice(0, 300));
    await B.page.click('#acRoot >> text=Continuar aprendiendo');
    await B.page.waitForSelector('.ac-card-act');
    assert(/Actividad 4 de 8/.test(await B.page.innerText('.ac-step')), await B.page.innerText('.ac-step'));
  });
  await test('refuerzo y "volver": repasar la lección 1 desde la 2 y regresar a la actividad 4, no al inicio', async()=>{
    await B.page.goto(base + '/academia.html?nube=1#/curso/to-be/leccion/1?volver=' + encodeURIComponent('#/curso/to-be/leccion/2'));
    await B.page.reload(); await B.page.waitForSelector('.ac-card');
    assert(/← Salir/.test(await B.page.innerText('.ac-exit')));
    assert.strictEqual(await B.page.getAttribute('.ac-exit', 'href'), '#/curso/to-be/leccion/2');
    await runPracticeFromLearn(B.page);
    await B.page.waitForSelector('.ac-card-end');
    const back = await B.page.$('.ac-btn-back');
    assert(back, 'debe haber boton de volver'); assert.strictEqual((await back.innerText()).trim(), 'Volver a la lección 2');
    await back.click();
    await B.page.waitForSelector('.ac-card-act');
    assert(/Actividad 4 de 8/.test(await B.page.innerText('.ac-step')), 'volvio a: ' + await B.page.innerText('.ac-step'));
  });
  async function runPracticeFromLearn(p){
    for(let g = 0; g < 8; g++){ if(await p.$('.ac-card-act')) break; const b = await p.$('#acRoot >> text=Practicar') || await p.$('#acRoot >> text=Siguiente →'); if(!b) break; await b.click(); }
    await p.waitForSelector('.ac-card-act'); return runPractice(p, []);
  }
  await test('volver a una pagina del sitio (ej. desde el diagnostico) y valores de "volver" peligrosos se ignoran', async()=>{
    const p = B.page;
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/repaso/forma?volver=progreso.html'); await p.reload();
    await p.waitForSelector('.ac-card, .ac-card-end');
    if(await p.$('.ac-card-act')){ await runPractice(p, []); await p.waitForSelector('.ac-card-end'); const b = await p.$('.ac-btn-back'); assert.strictEqual(await b.getAttribute('href'), 'progreso.html'); assert(/tu progreso/.test(await b.innerText())); }
    for(const bad of ['javascript:alert(1)', 'https://malo.example/x', '//malo.example', 'x.html?a=<script>']){
      await p.goto(base + '/academia.html?nube=1#/curso/to-be/repaso/forma?volver=' + encodeURIComponent(bad)); await p.reload(); await p.waitForTimeout(300);
      const hrefs = await p.$$eval('#acRoot a', as => as.map(a => a.getAttribute('href')));
      assert(!hrefs.some(h => /malo|javascript|<script/.test(h || '')), 'enlace peligroso aceptado: ' + bad + ' -> ' + hrefs);
    }
  });
  await test('sin red: el alumno sigue, nada se pierde y al volver la conexión se sincroniza', async()=>{
    const p = B.page;
    net.down = true;
    await doLesson(p, 3, [0]);
    await p.waitForSelector('.ac-card-end');
    const local = await p.evaluate(() => JSON.parse(localStorage.getItem('leo_academia_piloto_v1')));
    assert(local.lessons.negaciones && local.lessons.negaciones.done, 'se guardo en el navegador');
    assert(!(await prog()).state.lessons.negaciones, 'la nube aun no lo tiene');
    net.down = false;
    await p.evaluate(() => window.dispatchEvent(new Event('online')));   // el navegador avisa que volvio la red
    await until(async () => (await prog()).state.lessons.negaciones, 20000, 'sincronizar al volver la red');
    const st = (await prog()).state;
    assert(st.lessons['am-is-are'] && st.lessons.negaciones && st.resume.afirmaciones, 'no se perdio nada de lo anterior al fusionar');
  });
  await test('termina lecciones 2, 4 y 5 en la computadora; el telefono (recarga) ve las 5 hechas', async()=>{
    await doLesson(B.page, 2, []); await B.page.waitForSelector('.ac-card-end');
    await doLesson(B.page, 4, []); await B.page.waitForSelector('.ac-card-end');
    await doLesson(B.page, 5, []); await B.page.waitForSelector('.ac-card-end');
    await until(async () => Object.keys((await prog()).state.lessons).length === 5, 12000, '5 lecciones en la nube');
    await A.page.goto(base + '/academia.html?nube=1#/'); await A.page.reload();
    await until(async () => /5 de 5 lecciones/.test(await A.page.innerText('#acRoot')), 8000, 'el telefono ve 5 de 5');
  });

  async function answerOfficial(p, ok){
    let n = 0;
    while(await p.$('.ac-card-act')){
      const id = await p.$eval('.ac-card-act', e => e.dataset.id);
      const b = byId[id]; assert(b, 'pregunta desconocida ' + id);
      if(b.type === 'choice' || b.type === 'error'){
        const right = b.answer.correct; const label = ok ? right : b.public.options.find(o => o !== right);
        await p.click(`.ac-opt >> text="${label}"`);
      } else if(b.type === 'type'){ await p.fill('.ac-input', ok ? b.answer.accepted[0] : 'zzz');
      } else if(b.type === 'order'){ for(const w of (ok ? b.answer.order : b.answer.order.slice().reverse())) await p.click(`.ac-bank .ac-tok:text-is("${w}")`); }
      await p.click('.ac-actions button'); n++;
      assert(n < 40);
    }
    return n;
  }
  await test('evaluacion oficial: primer intento TODO MAL no aprueba, no hay insignia y sugiere repasar', async()=>{
    const p = A.page;
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/evaluacion'); await p.reload();
    await p.waitForSelector('#acStartOfficial');
    const intro = await p.innerText('#acRoot');
    assert(/80 %/.test(intro) && /12 de 15/.test(intro) && /5 veces más hoy/.test(intro), intro.slice(0, 400));
    await shot(p, 'oficial-intro');
    await p.click('#acStartOfficial');
    await p.waitForSelector('.ac-card-act');
    await shot(p, 'oficial-pregunta');
    const n = await answerOfficial(p, false);
    await p.waitForSelector('.ac-score');
    await shot(p, 'oficial-resultado-mal');
    assert.strictEqual(n, 15);
    assert(/^0 %/.test(await p.innerText('.ac-score')));
    assert(/Todavía no/.test(await p.innerText('#acRoot')));
    assert(await p.$('.ac-review'), 'debe recomendar repasar');
    assert(!(await q('select 1 from public.academia_badges')).length);
    const row = (await q("select count(*)::int n from public.mistake_stats where item_id like 'ac:to-be:e-%'"))[0];
    assert(row.n >= 5, 'los errores del examen entran al motor: ' + row.n);
  });
  await test('segundo intento TODO BIEN: aprueba, la insignia la crea el servidor y aparece en Mis logros de los dos dispositivos', async()=>{
    const p = A.page;
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/evaluacion'); await p.reload();
    await p.waitForSelector('#acStartOfficial'); await p.click('#acStartOfficial'); await p.waitForSelector('.ac-card-act');
    await answerOfficial(p, true);
    await p.waitForSelector('.ac-score');
    await shot(p, 'oficial-resultado-bien');
    assert(/^100 %/.test(await p.innerText('.ac-score')));
    assert(/Superaste el curso/.test(await p.innerText('#acRoot')) && /Insignia conseguida/.test(await p.innerText('#acRoot')));
    const b = await q('select course_id, score_pct from public.academia_badges where user_id = $1', [UID]);
    assert.deepStrictEqual(b, [{ course_id: 'to-be', score_pct: 100 }]);
    for(const dev of [A, B]){
      await dev.page.goto(base + '/academia.html?nube=1#/logros'); await dev.page.reload(); await dev.page.waitForSelector('#acSync');
      await until(async () => /Conseguida: Domina el verbo TO BE, con 100 %/.test(await dev.page.innerText('#acBadge')), 6000, 'insignia visible en ' + dev.label);
    }
  });
  await test('recargar la pagina de la evaluacion en mitad del intento devuelve las MISMAS preguntas; respuestas guardadas si falla el envio', async()=>{
    const p = A.page;
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/evaluacion'); await p.reload(); await p.waitForSelector('#acStartOfficial'); await p.click('#acStartOfficial'); await p.waitForSelector('.ac-card-act');
    const first = await p.$eval('.ac-card-act', e => e.dataset.id);
    const ids = []; ids.push(first);
    await p.reload(); await p.waitForSelector('#acStartOfficial'); await p.click('#acStartOfficial'); await p.waitForSelector('.ac-card-act');
    const att = await q("select item_ids from public.academia_exam_attempts where user_id = $1 and submitted_at is null", [UID]);
    assert.strictEqual(att.length, 1, 'un solo intento abierto');
    assert(att[0].item_ids.indexOf(await p.$eval('.ac-card-act', e => e.dataset.id)) !== -1);
    // responde todo y que falle el envio
    net.down = true;
    await answerOfficial(p, true);
    await p.waitForSelector('text=No pudimos enviar tus respuestas');
    const draft = await p.evaluate(() => localStorage.getItem('leo_academia_exam_draft_v1'));
    assert(draft && /attempt/.test(draft), 'borrador guardado');
    net.down = false;
    await p.click('text=Reintentar');
    await p.waitForSelector('.ac-score');
    assert(/^100 %/.test(await p.innerText('.ac-score')));
    assert.strictEqual(await p.evaluate(() => localStorage.getItem('leo_academia_exam_draft_v1')), null);
  });
  await test('sin errores de consola en ninguno de los dos dispositivos', async()=>{ assert.deepStrictEqual(errors, []); });
  await test('sin horizontal overflow en el telefono durante la evaluacion y los logros', async()=>{
    await A.page.setViewportSize({ width: 320, height: 640 });
    for(const h of ['#/logros', '#/curso/to-be/evaluacion', '#/curso/to-be']){
      await A.page.goto(base + '/academia.html?nube=1' + h); await A.page.reload(); await A.page.waitForTimeout(400);
      assert.strictEqual(await A.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'overflow en ' + h);
    }
  });

  await browser.close(); srv.close();
  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLARON' : ''));
  process.exit(failed ? 1 : 0);
})();
