/* Práctica gratis en un navegador REAL (Chromium) con la nube simulada: invitado, cuenta gratis con corte a los 10,
   sesión a medias y reto diario. Necesita Playwright (no forma parte de run-all.js, que no usa dependencias):
     node tools/e2e/free-sessions.browser.js            (desde la carpeta inglesconLeo)
   Sirve los archivos reales del sitio en un servidor local; todo lo externo se bloquea y supabase-js se reemplaza
   por un cliente falso que solo anota lo que el sitio intenta leer o guardar. */
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
      var r = await window.__cloud(JSON.stringify({ table:st.table, op:st.op, payload:st.payload, user: cfg.user || null }));
      if(st.table === 'profiles' && st.op === 'select'){ var row = cfg.user ? { id:cfg.user, is_member:false, level:'facil', onboarded_at:'2026-10-01T00:00:00Z', display_name:'Ana', free_daily_count:0, free_daily_date:null, free_first_exercise_at:'2026-10-01T00:00:00Z' } : null; return { data: st.single ? row : [row], error:null }; }
      return { data: st.single ? null : [], error: r && r.error || null };
    }
    return b;
  }
  return { auth:{ getSession: async function(){ return { data:{ session: SESSION } }; }, getUser: async function(){ return { data:{ user: SESSION && SESSION.user } }; }, onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; }, signOut: async function(){ return {}; } },
    from: builder, rpc: async function(n){ await window.__cloud(JSON.stringify({ table:'rpc:' + n, op:'rpc' })); return { data:null, error:null }; }, functions:{ invoke: async function(){ return { data:null, error:null }; } } };
} };`;

async function newPage(browser, user, storage){
  const ctx = await browser.newContext({ viewport:{ width:375, height:740 }, isMobile:true, hasTouch:true, storageState: storage || undefined });
  const page = await ctx.newPage();
  const cloud = [];
  await page.exposeFunction('__cloud', s => { const c = JSON.parse(s); cloud.push(c);
    if(c.table === 'progress_sessions' && c.op === 'insert' && cloud.filter(x => x.table === 'progress_sessions' && x.op === 'insert' && x.payload.started_at === c.payload.started_at && x.payload.skill === c.payload.skill).length > 1) return { error:{ code:'23505' } };
    return {}; });
  await page.addInitScript(u => { window.__FAKE = { user:u }; if(u) localStorage.setItem('sb-test-auth-token', '{}'); }, user);
  await page.route('**/*', route => {
    const u = route.request().url();
    if(u.startsWith('http://localhost')) return route.continue();
    if(u.includes('supabase-js')) return route.fulfill({ contentType:'application/javascript', body: FAKE });
    return route.abort();
  });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  return { ctx, page, cloud, errors };
}
const inserts = c => c.filter(x => x.table === 'progress_sessions' && x.op === 'insert').map(x => x.payload);
// Responde `n` ejercicios de gramática (los 3 tipos). Las variantes tienen 3 u 8 ejercicios: si una sesión termina
// antes, pulsa "Hacer otra sesión" y sigue. Devuelve cuántas sesiones se TERMINARON y si quedó una a medias.
async function doAnswers(page, n){
  let finished = 0, inCurrent = 0;
  for(let i = 0; i < n; i++){
    await page.waitForFunction(() => document.querySelector('#skillBody .session-card') || document.querySelector('#skillBody #freeAgainBtn'), null, { timeout: 8000 });
    if(await page.locator('#skillBody #freeAgainBtn').count()){ await page.locator('#freeAgainBtn').click(); }
    const card = page.locator('#skillBody .session-card');
    await card.waitFor({ timeout: 5000 });
    await card.locator('.option, .word-chip, .error-word').first().click();
    const nextBtn = card.locator('#nextRow .next-btn');
    const label = await nextBtn.textContent();
    await nextBtn.click();
    inCurrent++;
    if(/Ver resultado/.test(label)){ finished++; inCurrent = 0; }
  }
  await page.waitForTimeout(350);
  return { finished, open: inCurrent };
}
(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://localhost:' + server.address().port + '/practica.html?skill=grammar';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  let ok = 0; const pass = n => { ok++; console.log('  ok  ' + n); };

  // 1) INVITADO: 5 ejercicios, bloque de "crea tu cuenta", cero subidas
  { const { ctx, page, cloud, errors } = await newPage(browser, null);
    await page.goto(base); await page.waitForTimeout(800);
    await doAnswers(page, 5);
    await page.waitForFunction(() => /ejercicios de prueba/.test(document.querySelector('#skillBody').textContent));
    await page.waitForTimeout(300);
    assert.strictEqual(inserts(cloud).length, 0); assert.strictEqual(cloud.length, 0, 'invitado: ninguna llamada');
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('leo_free_pending_v1')), null);
    assert.deepStrictEqual(errors, []);
    pass('invitado: límite de 5, sin subir nada');
    await ctx.close(); }

  // 2) CUENTA GRATIS: sesión completa de 8 -> 1 fila; otra sesión, el límite la corta a los 2 -> segunda fila
  let storage;
  { const { ctx, page, cloud, errors } = await newPage(browser, 'u1');
    await page.goto(base);
    await page.waitForFunction(() => document.getElementById('practicaMain').style.visibility === 'visible'); await page.waitForTimeout(800);
    const r1 = await doAnswers(page, 4);
    let ins = inserts(cloud);
    assert.strictEqual(ins.length, r1.finished, 'una fila por sesión TERMINADA (' + r1.finished + '), ninguna por la que sigue abierta');
    const r2 = await doAnswers(page, 6);                                  // con esta llega a 10
    await page.waitForFunction(() => /10 ejercicios gratis de hoy/.test(document.querySelector('#skillBody').textContent));
    await page.waitForTimeout(350);
    ins = inserts(cloud);
    const total = ins.reduce((n, x) => n + x.results.length, 0);
    assert.strictEqual(total, 10, 'las 10 respuestas del día quedan guardadas, también las de la sesión que cortó el límite');
    assert.strictEqual(new Set(ins.map(x => x.started_at)).size, ins.length, 'cada sesión con su propio inicio');
    assert.ok(ins.every(x => x.skill === 'gramatica' && x.user_id === 'u1' && !('tier' in x) && x.topics.length >= 1 && x.level === 'facil'));
    assert.ok(ins.every(x => x.results.every(r => typeof r.itemId === 'string' && typeof r.isCorrect === 'boolean' && typeof r.p === 'string' && !('f' in r))), JSON.stringify(ins[0].results[0]));
    pass('cuenta gratis: ' + ins.length + ' sesiones = 10 respuestas instrumentadas (terminadas y cortada por el límite de 10)');
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('leo_free_pending_v1')), null, 'nada pendiente');
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('leo_progress') || localStorage.getItem('leo_micro_stats_v1')), null, 'sin progreso local ni microtemas');
    assert.ok(!cloud.some(c => c.op === 'rpc'), 'sin mistake_stats');
    assert.ok(!cloud.some(c => c.table === 'profiles' && c.op === 'update' && 'last_practice_at' in c.payload));
    assert.strictEqual(cloud.filter(c => c.table === 'profiles' && c.op === 'update' && 'free_daily_count' in c.payload).pop().payload.free_daily_count, 10, 'el contador gratis sigue igual: 10');
    assert.deepStrictEqual(errors, []);
    await ctx.close(); }

  // 3) SESIÓN A MEDIAS: 3 respuestas, cierra; al volver se sube sola
  { const a = await newPage(browser, 'u2');
    await a.page.goto(base);
    await a.page.waitForFunction(() => document.getElementById('practicaMain').style.visibility === 'visible'); await a.page.waitForTimeout(800);
    let ra = await doAnswers(a.page, 2);
    if(!ra.open) ra = await doAnswers(a.page, 1);                          // por si la variante era de 2-3: deja una sesión abierta
    const before = inserts(a.cloud).length, openN = ra.open;
    assert.ok(openN >= 1);
    storage = await a.ctx.storageState();
    await a.ctx.close();
    const b = await newPage(browser, 'u2', storage);
    await b.page.goto(base);
    await b.page.waitForFunction(() => document.getElementById('practicaMain').style.visibility === 'visible');
    await b.page.waitForTimeout(400);
    const ins = inserts(b.cloud);
    assert.strictEqual(ins.length, 1, 'la sesión a medias se sube al volver'); assert.strictEqual(ins[0].results.length, openN);
    await b.page.reload();
    await b.page.waitForTimeout(400);
    assert.strictEqual(inserts(b.cloud).length, 1, 'recargar no la sube otra vez');
    assert.deepStrictEqual(b.errors, []);
    pass('sesión a medias: se sube al volver, una sola vez');
    // 4) reto diario gratis (5 ejercicios, no cuenta para el límite)
    await b.page.locator('#dailyChallengeBody button').first().click();
    for(let i = 0; i < 12; i++){
      const done = await b.page.evaluate(() => /Reto completado/.test(document.getElementById('dailyChallengeBody').textContent));
      if(done) break;
      const card = b.page.locator('#dailyChallengeBody .session-card');
      const kind = await card.evaluate(c => c.querySelector('.option, .word-chip, .error-word') ? 'pick' : (c.querySelector('textarea, input[type=text]') ? 'write' : 'other'));
      if(kind === 'pick'){ await card.locator('.option, .word-chip, .error-word').first().click(); }
      else if(kind === 'write'){ await card.locator('textarea, input[type=text]').first().fill('I am a student.'); await card.locator('button').filter({ hasText: /Revisar/ }).first().click(); }
      const next = card.locator('#nextRow .next-btn, #nextRow .btn-primary').last();
      await next.waitFor({ timeout: 4000 }); await next.click();
    }
    await b.page.waitForTimeout(400);
    const reto = inserts(b.cloud).filter(x => x.skill === 'reto-diario');
    assert.strictEqual(reto.length, 1, 'reto diario: una fila'); assert.ok(reto[0].results.length >= 4, 'respuestas del reto: ' + reto[0].results.length);
    assert.deepStrictEqual(b.errors, []);
    pass('reto diario gratis: una fila al completarlo (' + reto[0].results.length + ' respuestas)');
    await b.ctx.close(); }

  await browser.close(); server.close();
  console.log('\n' + ok + ' pruebas correctas');
})().catch(e => { console.error('FALLA', e); process.exit(1); });
