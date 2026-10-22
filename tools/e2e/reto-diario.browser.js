/* RETO DIARIO exclusivo de miembros de pago, en un navegador REAL (Chromium) con la nube simulada.
   Comprueba los tres tipos de cuenta: visitante, cuenta gratis y miembro de pago.
     node tools/e2e/reto-diario.browser.js          (desde la carpeta inglesconLeo)
   Necesita Playwright (no forma parte de run-all.js). */
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
      if(st.table === 'profiles' && st.op === 'select'){ var row = cfg.user ? { id:cfg.user, is_member:!!cfg.member, level:'facil', onboarded_at:'2026-10-01T00:00:00Z', display_name:'Ana', free_daily_count:0, free_daily_date:null, free_first_exercise_at:'2026-10-01T00:00:00Z' } : null; return { data: st.single ? row : [row], error:null }; }
      return { data: st.single ? null : [], error: r && r.error || null };
    }
    return b;
  }
  return { auth:{ getSession: async function(){ return { data:{ session: SESSION } }; }, getUser: async function(){ return { data:{ user: SESSION && SESSION.user } }; }, onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; }, signOut: async function(){ return {}; } },
    from: builder, rpc: async function(n){ await window.__cloud(JSON.stringify({ table:'rpc:' + n, op:'rpc' })); return { data:null, error:null }; }, functions:{ invoke: async function(){ return { data:null, error:null }; } } };
} };`;

async function newPage(browser, user, storage, member){
  const ctx = await browser.newContext({ viewport:{ width:375, height:740 }, isMobile:true, hasTouch:true, storageState: storage || undefined });
  const page = await ctx.newPage();
  const cloud = [];
  await page.exposeFunction('__cloud', s => { const c = JSON.parse(s); cloud.push(c);
    if(c.table === 'progress_sessions' && c.op === 'insert' && cloud.filter(x => x.table === 'progress_sessions' && x.op === 'insert' && x.payload.started_at === c.payload.started_at && x.payload.skill === c.payload.skill).length > 1) return { error:{ code:'23505' } };
    return {}; });
  await page.addInitScript(([u, m]) => { window.__FAKE = { user:u, member:!!m }; if(u) localStorage.setItem('sb-test-auth-token', '{}'); }, [user, member]);
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
const reto0 = c => c.filter(x => x.table === 'progress_sessions' && x.op === 'insert' && x.payload.skill === 'reto-diario').length;
const retoRows = c => c.filter(x => x.table === 'progress_sessions' && x.op === 'insert' && x.payload.skill === 'reto-diario').map(x => x.payload);
(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const practica = 'http://localhost:' + port + '/practica.html';
  const miembros = 'http://localhost:' + port + '/miembros.html';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  let ok = 0; const pass = n => { ok++; console.log('  ok  ' + n); };
  const ready = page => page.waitForFunction(() => document.getElementById('practicaMain') && document.getElementById('practicaMain').style.visibility === 'visible', null, { timeout: 8000 });

  // Visitante y cuenta gratis: practica.html sin tarjeta, enlace viejo = invitacion, y la LOGICA tambien se niega
  for(const [name, user] of [['visitante', null], ['cuenta gratis', 'u1']]){
    const { ctx, page, cloud, errors } = await newPage(browser, user, undefined, false);
    await page.goto(practica); await ready(page); await page.waitForTimeout(500);
    assert.strictEqual(await page.locator('#retoMiembrosInvite').isVisible(), false, name + ': sin tarjeta del reto');
    assert.strictEqual(await page.locator('#dailyStartBtn').count(), 0, name + ': ningun boton para empezar el reto');
    const body = await page.evaluate(() => document.body.innerText);
    assert.ok(!/Empezar reto diario|5 ejercicios, un minuto al día/.test(body), name + ': el texto del reto no aparece en la practica gratis');
    // logica: llamar directamente a las funciones no abre ejercicios
    const logic = await page.evaluate(() => {
      const c = document.createElement('div'); document.body.appendChild(c);
      initDailyChallenge(c, { isFree: false });                   // como si fuera "miembro" pero sin verificar
      const a = { locked: !!c.querySelector('[data-daily-locked]'), cards: c.querySelectorAll('.session-card').length, start: c.querySelectorAll('#dailyStartBtn').length };
      const d = document.createElement('div'); document.body.appendChild(d);
      runDailyChallengeSession({ container: d, isFree: false, level: 'facil' });
      const b = { locked: !!d.querySelector('[data-daily-locked]'), cards: d.querySelectorAll('.session-card').length };
      const e = document.createElement('div'); document.body.appendChild(e);
      runDailyChallengeSession({ container: e, isFree: true, level: 'facil' });
      return { a, b, free: { locked: !!e.querySelector('[data-daily-locked]'), cards: e.querySelectorAll('.session-card').length }, verified: window.__leoMemberVerified === true, allowed: isDailyChallengeAllowed() };
    });
    assert.deepStrictEqual(logic.a, { locked: true, cards: 0, start: 0 }, name + ': initDailyChallenge se niega: ' + JSON.stringify(logic));
    assert.deepStrictEqual(logic.b, { locked: true, cards: 0 }, name + ': runDailyChallengeSession se niega');
    assert.deepStrictEqual(logic.free, { locked: true, cards: 0 }, name + ': ni siquiera con isFree');
    assert.strictEqual(logic.allowed, false);
    assert.strictEqual(retoRows(cloud).length, 0, name + ': no se sube nada de reto');
    // enlace viejo
    for(const url of [practica + '#reto', practica + '#dailyChallengeCard', practica + '?reto=1']){
      await page.goto(url); await page.reload(); await ready(page);
      await page.waitForFunction(() => document.querySelector('#dailyChallengeBody [data-daily-locked]'), null, { timeout: 4000 });
      const t = await page.locator('#dailyChallengeBody').innerText();
      assert.ok(/solo para miembros/.test(t) && /Hazte miembro/.test(t), name + ' ' + url + ': ' + t);
      assert.strictEqual(await page.locator('#dailyChallengeBody a[href="miembros.html?pagar=1"]').count(), 1);
      assert.strictEqual(await page.locator('#dailyChallengeBody .session-card, #dailyStartBtn').count(), 0);
    }
    assert.deepStrictEqual(errors, []);
    pass(name + ': sin tarjeta del reto, la logica se niega y un enlace viejo muestra la invitacion a hacerse miembro');
    await ctx.close();
  }

  // Cuenta gratis en miembros.html: ve la vista previa (no el panel) y el reto no se inicia
  { const { ctx, page, errors } = await newPage(browser, 'u1', undefined, false);
    await page.goto(miembros + '#dailyChallengeCard'); await page.waitForTimeout(2500);
    const s = await page.evaluate(() => ({ verified: window.__leoMemberVerified === true, body: document.getElementById('dailyChallengeBody') ? document.getElementById('dailyChallengeBody').innerHTML.trim() : 'sin-cuerpo', previewVisible: !!document.getElementById('memberPreview') && getComputedStyle(document.getElementById('memberPreview')).display !== 'none' }));
    assert.strictEqual(s.verified, false); assert.strictEqual(s.body, '', 'el cuerpo del reto sigue vacío (no se inicializa)');
    assert.strictEqual(s.previewVisible, true, 've la vista previa con la invitación a activar la membresía');
    assert.deepStrictEqual(errors, []);
    pass('cuenta gratis en miembros.html (incluso con #dailyChallengeCard): vista previa, sin reto');
    await ctx.close(); }

  // Miembro de pago: panel con el reto, lo completa (5 ejercicios) y se guarda como sesion normal; su progreso previo se conserva
  { const { ctx, page, cloud, errors } = await newPage(browser, 'u7', undefined, true);
    const prior = { v: 2, sessions: [{ id: 'old1', skill: 'gramatica', level: 'facil', date: '2026-10-19', started_at: 1760000000000, duration_ms: 60000, topics: ['x'], results: [{ itemId: 'g-facil-some-1', isCorrect: true }] }] };
    await page.addInitScript(p => { try{ if(!localStorage.getItem('leo_progress_v2')) localStorage.setItem('leo_progress_v2', JSON.stringify(p)); }catch(e){} }, prior);
    await page.goto(miembros); await page.waitForFunction(() => window.__leoMemberVerified === true, null, { timeout: 10000 });
    await page.waitForSelector('#dailyStartBtn', { timeout: 8000 });
    assert.ok(/Empezar reto diario/.test(await page.locator('#dailyStartBtn').innerText()));
    await page.locator('#dailyStartBtn').click();
    for(let i = 0; i < 5; i++){
      const card = page.locator('#dailyChallengeBody .session-card'); await card.waitFor({ timeout: 6000 });
      const kind = await card.evaluate(c => c.querySelector('.option, .word-chip, .error-word') ? 'pick' : (c.querySelector('textarea, input[type=text]') ? 'write' : 'other'));
      if(kind === 'pick') await card.locator('.option, .word-chip, .error-word').first().click();
      else if(kind === 'write'){ await card.locator('textarea, input[type=text]').first().fill('I am a student.'); await card.locator('button').filter({ hasText: /Revisar/ }).first().click(); }
      const next = card.locator('#nextRow .next-btn, #nextRow .btn-primary').last();
      await next.waitFor({ timeout: 5000 });
      // si falla el ejercicio hay "Reintentar"/"Siguiente": seguimos con el ultimo boton
      await next.click();
    }
    await page.waitForFunction(() => /Reto completado/.test(document.getElementById('dailyChallengeBody').textContent), null, { timeout: 6000 });
    await page.waitForTimeout(500);
    const rows = retoRows(cloud);
    assert.strictEqual(rows.length, 1, 'el miembro guarda UNA sesion de reto-diario (' + rows.length + ')');
    assert.ok(rows[0].results.length >= 5, 'respuestas guardadas: ' + rows[0].results.length);
    assert.ok(await page.locator('#dailyAgainBtn').count() === 1, 'el miembro puede hacer otro reto');
    const local = await page.evaluate(() => { try{ const p = JSON.parse(localStorage.getItem('leo_progress_v2')); return p.sessions.map(s => s.skill + ':' + s.started_at); }catch(e){ return 'err ' + e.message; } });
    assert.ok(Array.isArray(local) && local.some(x => x === 'gramatica:1760000000000') && local.some(x => x.startsWith('reto-diario')), 'progreso previo conservado + reto nuevo: ' + JSON.stringify(local));
    assert.deepStrictEqual(errors, []);
    pass('miembro de pago: panel con reto, lo completa (5 ejercicios), se guarda como sesion normal y su progreso previo sigue ahi');
    await ctx.close(); }

  await browser.close(); server.close();
  console.log('\n' + ok + ' pruebas correctas');
})().catch(e => { console.error('FALLA', e); process.exit(1); });
