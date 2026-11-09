/* Miembro: el encabezado de la práctica muestra el número REAL de ejercicios de la sesión (9, no 8), a 320/375 px y en escritorio. Chromium + nube simulada.
     node tools/e2e/member-header.browser.js [carpeta-del-sitio] */
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
      await window.__cloud(JSON.stringify({ table:st.table, op:st.op, payload:st.payload, user: cfg.user || null }));
      if(st.table === 'profiles' && st.op === 'select'){ var row = cfg.user ? Object.assign({ id:cfg.user, is_member:false, level:'facil', onboarded_at:'2026-10-01T00:00:00Z', display_name:'Ana', free_daily_count:0, free_daily_date:null, free_first_exercise_at:null }, cfg.profile || {}) : null; return { data: st.single ? row : [row], error:null }; }
      return { data: st.single ? null : [], error:null };
    }
    return b;
  }
  return { auth:{ getSession: async function(){ return { data:{ session: SESSION } }; }, getUser: async function(){ return { data:{ user: SESSION && SESSION.user } }; }, onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; }, signOut: async function(){ return {}; } },
    from: builder, rpc: async function(n){ await window.__cloud(JSON.stringify({ table:'rpc:' + n, op:'rpc' })); return { data:null, error:null }; }, functions:{ invoke: async function(){ return { data:null, error:null }; } } };
} };`;
const today = () => new Date().toLocaleDateString('en-CA');
async function newPage(browser, user, profile, storage, width){
  const ctx = await browser.newContext({ viewport:{ width:width || 375, height:740 }, isMobile:true, hasTouch:true, storageState: storage || undefined });
  const page = await ctx.newPage(); const cloud = [];
  await page.exposeFunction('__cloud', s => { cloud.push(JSON.parse(s)); return {}; });
  await page.addInitScript(a => { window.__FAKE = { user:a.u, profile:a.p }; 
    if(a.u) localStorage.setItem('sb-test-auth-token', JSON.stringify({ user:{ id:a.u } })); }, { u:user, p:profile });
  await page.route('**/*', route => { const u = route.request().url(); if(u.startsWith('http://localhost')) return route.continue(); if(u.includes('supabase-js')) return route.fulfill({ contentType:'application/javascript', body:FAKE }); return route.abort(); });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  return { ctx, page, cloud, errors };
}
// Responde hasta llegar al resumen o al muro; devuelve cuántos respondió y dónde terminó.
async function runSession(page, max){
  let answered = 0, total = null;
  for(let i = 0; i < (max || 12); i++){
    await page.waitForFunction(() => document.querySelector('#skillBody .session-card') || document.querySelector('#skillBody .session-summary'), null, { timeout: 8000 });
    if(await page.locator('#skillBody .session-summary').count()) break;
    const hdr = await page.locator('#skillBody').textContent(); const m = /(\d+)\s*(?:\/|de)\s*(\d+)/.exec(await page.locator('#skillBody .session-progress, #skillBody .session-header, #skillBody').first().innerText());
    if(total === null && m) total = Number(m[2]);
    const card = page.locator('#skillBody .session-card');
    await card.locator('.option, .word-chip, .error-word').first().click();
    const next = card.locator('#nextRow .next-btn'); await next.click(); answered++;
  }
  await page.waitForTimeout(400);
  const txt = await page.locator('#skillBody').innerText();
  return { answered, total, wall: /Completaste tus 6 ejercicios gratis de hoy/.test(txt), summary: await page.locator('#skillBody .session-summary').count() > 0 && !/Completaste tus 6 ejercicios gratis de hoy/.test(txt), txt };
}
const base = () => 'http://localhost:' + server.address().port + '/practica-miembros.html?skill=grammar';
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  let ok = 0;
  for(const w of [320, 375, 1280]){
    const { ctx, page, errors } = await newPage(browser, 'm' + w, { is_member:true, free_daily_count:0, free_daily_date:today() }, undefined, w);
    await page.goto(base()); await page.waitForTimeout(3500);
    const card = page.locator('#skillBody .session-card'); await card.waitFor({ timeout: 10000 });
    const prog = await page.locator('#skillBody').innerText(); const m = /(\d+)\s*(?:\/|de)\s*(\d+)/.exec(prog); const total = Number(m[2]);
    const head = (await page.locator('#skillHead p, .skill-head p').first().innerText());
    assert.ok(new RegExp('^' + total + ' preguntas? cortas?').test(head), w + ': encabezado "' + head + '" vs sesión de ' + total);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), w + ' sin desbordar');
    assert.strictEqual(await page.locator('[data-first-offer-card]').count(), 0);
    assert.deepStrictEqual(errors, []); ok++; console.log('  ok  ' + w + ' px: "' + head + '" (sesión de ' + total + ')'); await ctx.close();
  }
  await browser.close(); server.close(); console.log(ok + ' ok');
})().catch(e => { console.log('FALLA ' + (e && e.stack || e)); process.exit(1); });
