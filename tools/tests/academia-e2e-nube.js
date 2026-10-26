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
    getSession: function(){ return Promise.resolve(window.__UID ? { user:{ id: window.__UID } } : null); },
    applyMistakeResults: function(items){ return CLIENT.rpc('apply_mistake_results', { p_items: items }).then(function(r){ return { ok: !r.error }; }); },
    pushFreeSession: function(s){ return window.__pushSession(s).then(function(){ return 'ok'; }); }
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
  let client = H.fakeClient(db, UID, net);
  let CUR_UID = UID;
  const q = async (sql, p) => (await db.query(sql, p)).rows;

  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const errors = [];
  async function newDevice(label, vp, uid){
    const ctx = await browser.newContext({ viewport: vp || { width: 390, height: 800 } });
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await ctx.route('**/backend.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAKE_BACKEND }));
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const page = await ctx.newPage();
    await page.exposeFunction('__rpc', (fn, args) => client.rpc(fn, args));
    await page.exposeFunction('__select', (table, cols, eq) => { let b = client.from(table).select(cols); Object.keys(eq).forEach(k => { b = b.eq(k, eq[k]); }); return b.maybeSingle(); });
        await page.addInitScript(uid => { window.__UID = uid; }, uid === undefined ? UID : uid);
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
  const sessions = async () => q('select skill, results, tier from public.progress_sessions where user_id = $1 order by started_at', [CUR_UID]);
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
    await until(async () => (await sessions()).length >= 1, 6000, 'sesion de la leccion');
    const ss = (await sessions())[0];
    assert.strictEqual(ss.skill, 'gramatica'); assert(ss.results.length === 8 && ss.results.every(r => r.itemId.indexOf('ac:to-be:l1-a') === 0));
    assert(ss.results.filter(r => !r.isCorrect).length === 2);
    const lp = (await q('select last_practice_at from public.profiles where id = $1', [UID]))[0].last_practice_at;
    assert(lp && Date.now() - new Date(lp).getTime() < 120000, 'estudiar en la academia cuenta como practica real (last_practice_at)');
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
    const failSum = async () => (await q(`select coalesce(sum(fail_count),0)::int n from public.mistake_stats where item_id like 'ac:to-be:%'`))[0].n;
    const f0 = await failSum(), s0 = (await sessions()).length;
    net.down = true;
    await doLesson(p, 3, [0]);
    await p.waitForSelector('.ac-card-end');
    const cola = await p.evaluate(() => Object.keys(localStorage).filter(k => /leo_academia_cola_v1/.test(k)).map(k => JSON.parse(localStorage.getItem(k))));
    assert(cola.length === 1 && (cola[0].open.length + cola[0].batches.length) > 0, 'los errores esperan guardados en el dispositivo');
    assert.strictEqual(cola[0].sessions.length, 1, 'y la sesion de la leccion tambien');
    assert.strictEqual(await failSum(), f0); assert.strictEqual((await sessions()).length, s0);
    const local = await p.evaluate(() => JSON.parse(localStorage.getItem('leo_academia_piloto_v1')));
    assert(local.lessons.negaciones && local.lessons.negaciones.done, 'se guardo en el navegador');
    assert(!(await prog()).state.lessons.negaciones, 'la nube aun no lo tiene');
    await p.reload();                                           // cierra y reabre el navegador SIN red: nada debe perderse
    await p.waitForSelector('#acRoot');
    net.down = false;
    await p.evaluate(() => window.dispatchEvent(new Event('online')));   // el navegador avisa que volvio la red
    await until(async () => (await prog()).state.lessons.negaciones, 20000, 'sincronizar al volver la red');
    await until(async () => (await sessions()).length === s0 + 1, 12000, 'la sesion de la leccion llega a la nube');
    await until(async () => (await failSum()) === f0 + 1, 12000, 'el error llega al motor actual');
    await new Promise(r => setTimeout(r, 1500));
    assert.strictEqual((await sessions()).length, s0 + 1, 'una sola sesion'); assert.strictEqual(await failSum(), f0 + 1, 'un solo error, sin duplicados');
    assert.strictEqual(await p.evaluate(() => Object.keys(localStorage).filter(k => /leo_academia_cola_v1/.test(k)).map(k => { const c = JSON.parse(localStorage.getItem(k)); return c.open.length + c.batches.length + c.sessions.length; })[0]), 0, 'la cola quedo vacia');
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

  /* ================= cuenta gratis y visitante ================= */
  const F = H.U.free;
  client = H.fakeClient(db, F, net); CUR_UID = F;
  await db.exec(`update public.academia_courses set demo_items = array['d1','d2','d3']`);
  const C = await newDevice('gratis', { width: 390, height: 800 }, F);
  const demoItem = (p, id) => p.evaluate(id => ACADEMIA.courses['to-be'].demo.activities.find(a => a.id === id), id);
  await test('GRATIS: ve la presentacion (curso, temario, proximamente) pero NINGUN enlace a lecciones ni evaluacion', async()=>{
    await C.page.goto(base + '/academia.html?nube=1#/'); await C.page.reload();
    await until(async () => /Probar TO BE gratis/.test(await C.page.innerText('#acRoot')), 9000, 'presentacion de cuenta gratis');
    const txt = await C.page.innerText('#acRoot');
    assert(/Próximamente/.test(txt) && /Domina el verbo TO BE/.test(txt) && /Desbloquear mi academia/.test(txt));
    const hrefs = await C.page.$$eval('#acRoot a', as => as.map(a => a.getAttribute('href')));
    assert(!hrefs.some(h => /leccion|evaluacion|practica|repaso/.test(h || '')), 'enlaces premium visibles: ' + hrefs);
    assert(hrefs.includes('miembros.html?pagar=1'), 'usa el pago actual');
    assert.strictEqual(hrefs.filter(h => /pagar=1/.test(h)).length, 1, 'una sola invitacion a pagar');
    await shot(C.page, 'gratis-presentacion');
  });
  await test('GRATIS: entrar a mano a una leccion, la evaluacion, la practica o el repaso muestra la presentacion, no el contenido', async()=>{
    for(const h of ['#/curso/to-be/leccion/1', '#/curso/to-be/leccion/3', '#/curso/to-be/evaluacion', '#/curso/to-be/practica', '#/curso/to-be/repaso/forma', '#/logros']){
      await C.page.goto(base + '/academia.html?nube=1' + h); await C.page.reload();
      await until(async () => /Probar TO BE gratis|Desbloquear/.test(await C.page.innerText('#acRoot')), 9000, 'presentacion en ' + h);
      assert.strictEqual(await C.page.$('.ac-card-act'), null, 'ejercicio visible en ' + h);
      assert.strictEqual(await C.page.$('.ac-cansay'), null);
    }
    assert.strictEqual((await q("select count(*)::int n from public.academia_progress where user_id = $1 and state <> '{}'::jsonb", [F]))[0].n, 0);
  });
  await test('GRATIS: la prueba (explicacion + 3 ejercicios, 1 error) descuenta 3 del limite, guarda sesion y errores, y termina con UNA invitacion', async()=>{
    const p = C.page;
    await p.goto(base + '/academia.html?nube=1#/'); await p.reload();
    await until(async () => /Probar TO BE gratis/.test(await p.innerText('#acRoot')), 9000, 'boton de prueba');
    await p.click('#acRoot >> text=Probar TO BE gratis');
    await p.waitForSelector('text=Prueba gratis · explicación');
    await shot(p, 'gratis-demo-explicacion');
    await p.click('#acRoot >> text=Practicar');
    await p.waitForSelector('.ac-card-act');
    let n = 0;
    while(await p.$('.ac-card-act')){
      const item = await demoItem(p, await p.$eval('.ac-card-act', e => e.dataset.id));
      await answerPublic(p, item, n !== 1);
      await p.click('.ac-actions button'); await p.click('.ac-actions button'); n++;
      assert(n < 8);
    }
    assert.strictEqual(n, 4, '3 ejercicios + 1 repeticion del fallado');
    await p.waitForSelector('.ac-card-end');
    await shot(p, 'gratis-demo-final');
    const txt = await p.innerText('#acRoot');
    assert(/Acertaste 2 de 3 a la primera/.test(txt) && /Desbloquea la academia por \$2 USD al mes/.test(txt), txt.slice(0, 400));
    const ctas = await p.$$eval('#acRoot a', as => as.filter(a => /pagar=1/.test(a.getAttribute('href'))).map(a => a.textContent.trim()));
    assert.deepStrictEqual(ctas, ['Desbloquear mi academia']);
    await until(async () => (await q('select demo_done_at from public.academia_progress where user_id = $1', [F]))[0].demo_done_at, 9000, 'prueba terminada en el servidor');
    assert.strictEqual((await q('select free_daily_count n from public.profiles where id = $1', [F]))[0].n, 3, 'descuenta 3 del limite diario');
    const ses = await sessions(); assert.strictEqual(ses.length, 1); assert.strictEqual(ses[0].tier, 'free');
    const ms = await q("select item_id, status, kind from public.mistake_stats where user_id = $1", [F]);
    assert(ms.some(m => m.item_id === 'ac:to-be:d2' && m.status === 'active'), JSON.stringify(ms));
    assert.strictEqual((await q('select last_practice_at from public.profiles where id = $1', [F]))[0].last_practice_at, null);
    assert.strictEqual(await p.evaluate(() => localStorage.getItem('leoLocalDailyCount:' + (d => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2))(new Date()))), '3', 'el contador del navegador queda igual que el de la cuenta');
    const loc = await p.evaluate(() => JSON.parse(localStorage.getItem('leo_academia_piloto_v1') || '{"lessons":{},"missed":{},"cleared":{}}'));
    assert.deepStrictEqual([Object.keys(loc.lessons).length, Object.keys(loc.missed).length, Object.keys(loc.cleared).length], [0, 0, 0], 'la prueba no escribe progreso de lecciones ni errores locales');
  });
  await test('GRATIS: repetir la prueba (boton, enlace directo, recarga, borrando el navegador) no es posible ni cobra de nuevo', async()=>{
    const p = C.page;
    await p.goto(base + '/academia.html?nube=1#/'); await p.reload();
    await until(async () => /Ya hiciste tu prueba gratis/.test(await p.innerText('#acRoot')), 9000, 'estado de prueba usada');
    assert.strictEqual(await p.$('#acRoot >> text=Probar TO BE gratis'), null);
    for(const clear of [false, true]){
      if(clear) await p.evaluate(() => localStorage.clear());
      await p.goto(base + '/academia.html?nube=1#/curso/to-be/demo'); await p.reload();
      await p.waitForSelector('text=Ya hiciste tu prueba gratis', { timeout: 9000 });
      assert.strictEqual(await p.$('.ac-card-act'), null);
    }
    assert.strictEqual((await q('select free_daily_count n from public.profiles where id = $1', [F]))[0].n, 3);
    assert.strictEqual((await sessions()).length, 1);
  });
  await test('GRATIS: sin ejercicios suficientes hoy, la prueba no se gasta y se explica con claridad', async()=>{
    const p = C.page;
    await db.exec(`update public.academia_progress set demo_started_at = null, demo_done_at = null, demo_session_at = null where user_id = '${F}'; update public.profiles set free_daily_count = 5, free_daily_date = current_date where id = '${F}'`);
    await p.goto(base + '/academia.html?nube=1#/'); await p.reload();
    await until(async () => /no te alcanzan los ejercicios gratis/.test(await p.innerText('#acRoot')), 9000, 'aviso de limite');
    assert.strictEqual(await p.$('#acRoot >> text=Probar TO BE gratis'), null);
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/demo'); await p.reload();
    await p.waitForSelector('text=no te alcanzan los ejercicios gratis', { timeout: 9000 });
    assert.strictEqual((await q('select free_daily_count n from public.profiles where id = $1', [F]))[0].n, 5);
  });
  await test('MEMBRESIA: al volverse miembro la misma cuenta ve TODO el curso (sin recargar la cuenta ni perder la prueba)', async()=>{
    const p = C.page;
    await db.exec(`update public.profiles set is_member = true where id = '${F}'`);
    await p.goto(base + '/academia.html?nube=1#/'); await p.reload();
    await until(async () => /Continuar aprendiendo/.test(await p.innerText('#acRoot')), 9000, 'vista de miembro');
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/leccion/1'); await p.reload(); await p.waitForSelector('.ac-card');
    assert(/lecci[oó]n 1/i.test(await p.innerText('#acRoot')));
    // vence otra vez: vuelve a la presentacion de inmediato
    await db.exec(`update public.profiles set is_member = false where id = '${F}'`);
    await p.goto(base + '/academia.html?nube=1#/curso/to-be/leccion/1'); await p.reload();
    await until(async () => /Desbloquear mi academia/.test(await p.innerText('#acRoot')), 9000, 'bloqueo al vencer');
    assert.strictEqual(await p.$('.ac-card-act'), null);
  });
  await test('VISITANTE sin cuenta: informacion e invitacion a crear cuenta, sin demostracion extra', async()=>{
    const V = await newDevice('visitante', { width: 390, height: 800 }, '');
    await V.page.goto(base + '/academia.html?nube=1#/'); await V.page.reload();
    await until(async () => /Crear mi cuenta gratis/.test(await V.page.innerText('#acRoot')), 9000, 'invitacion a crear cuenta');
    const hrefs = await V.page.$$eval('#acRoot a', as => as.map(a => a.getAttribute('href')));
    assert(hrefs.some(h => /miembros\.html\?modo=registro/.test(h)));
    assert(!hrefs.some(h => /demo|leccion|evaluacion/.test(h || '')));
    await V.page.goto(base + '/academia.html?nube=1#/curso/to-be/demo'); await V.page.reload();
    await until(async () => /Crear mi cuenta gratis/.test(await V.page.innerText('#acRoot')), 9000, 'la demo directa no abre para visitantes');
    assert.strictEqual(await V.page.$('.ac-card-act'), null);
    await V.ctx.close();
  });
  await test('PRUEBA PREVIA: sin interruptor ni bandera la pagina es el piloto local; con la bandera de la cuenta de prueba se conecta (sin ?nube=1)', async()=>{
    const p = C.page;
    await db.exec(`update public.profiles set is_member = false where id = '${F}'`);
    await p.goto(base + '/academia.html'); await p.evaluate(() => localStorage.removeItem('leo_academia_canary')); await p.reload(); await p.waitForTimeout(800);
    assert(!/Probar TO BE gratis|Desbloquear/.test(await p.innerText('#acRoot')), 'sin bandera debe ser el piloto local');
    await p.evaluate(() => localStorage.setItem('leo_academia_canary', '1')); await p.reload();
    await until(async () => /Desbloquear mi academia/.test(await p.innerText('#acRoot')), 9000, 'con bandera se conecta');
    await p.evaluate(() => localStorage.removeItem('leo_academia_canary'));
  });
  await test('sin horizontal overflow en 320 px: presentacion de cuenta gratis y final de la prueba', async()=>{
    await db.exec(`update public.profiles set free_daily_count = 0 where id = '${F}'; update public.academia_progress set demo_started_at = null, demo_done_at = null, demo_session_at = null where user_id = '${F}'`);
    const p = C.page; await p.setViewportSize({ width: 320, height: 640 });
    for(const h of ['#/', '#/curso/to-be/demo']){
      await p.goto(base + '/academia.html?nube=1' + h); await p.reload(); await p.waitForTimeout(700);
      assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'overflow en ' + h);
    }
  });
  await test('sin errores de consola en ninguno de los dispositivos', async()=>{ assert.deepStrictEqual(errors, []); });
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
