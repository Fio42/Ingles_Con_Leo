/* "Practicar" del menu en miembros.html: una cuenta GRATIS con sesion debe ir a practica.html (practica gratis),
   no a practica-miembros.html (que la rebota). Un MIEMBRO si va a practica-miembros.html. Escritorio y celular.
     node tools/e2e/nav-practicar.browser.js [carpeta-del-sitio]      (necesita Playwright) */
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ chromium = require('/opt/npm-tools/node_modules/playwright').chromium; }
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = process.argv[2] || path.join(__dirname, '..', '..');
const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\//, ''));
  fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
});
const FAKE = `
window.supabase = { createClient: function(){
  var cfg = window.__FAKE || {};
  var SESSION = { user:{ id:cfg.user, email:'ana@example.test' }, access_token:'t' };
  function builder(table){
    var st = { single:false };
    var b = new Proxy({}, { get: function(_, k){
      if(k === 'then') return function(res, rej){ return run().then(res, rej); };
      if(k === 'single' || k === 'maybeSingle') return function(){ st.single = true; return b; };
      return function(){ return b; };
    }});
    async function run(){
      if(table === 'profiles'){ var row = { id:cfg.user, email:'ana@example.test', is_member: !!cfg.member, level:'facil', onboarded_at:'2026-10-01T00:00:00Z', display_name:'Ana' }; return { data: st.single ? row : [row], error:null }; }
      return { data: st.single ? null : [], error:null };
    }
    return b;
  }
  return { auth:{ getSession: async function(){ return { data:{ session: SESSION } }; }, getUser: async function(){ return { data:{ user: SESSION.user } }; }, onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; }, signOut: async function(){ return {}; } },
    from: builder, rpc: async function(){ return { data:null, error:null }; }, functions:{ invoke: async function(){ return { data:null, error:null }; } } };
} };`;
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch().catch(() => chromium.launch());
  let ok = 0;
  for(const [who, member] of [['cuenta gratis', false], ['miembro', true]]){
    for(const [vp, w] of [['escritorio', 1280], ['celular', 375]]){
      const ctx = await browser.newContext({ viewport:{ width:w, height:800 }, isMobile: w < 500 });
      const page = await ctx.newPage();
      await page.addInitScript(m => { window.__FAKE = { user:'u1', member:m }; localStorage.setItem('sb-test-auth-token', '{}'); }, member);
      await page.route('**/*', route => { const u = route.request().url(); if(u.startsWith('http://localhost')) return route.continue(); if(u.includes('supabase-js')) return route.fulfill({ contentType:'application/javascript', body: FAKE }); return route.abort(); });
      await page.goto('http://localhost:' + server.address().port + '/miembros.html');
      await page.waitForFunction(() => document.getElementById('navProfileName') && document.getElementById('navProfileName').textContent.trim() === 'Ana', null, { timeout: 8000 });
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => ({
        nav: [...document.querySelectorAll('.nav-links a')].filter(a => /^Practicar/.test(a.textContent.trim())).map(a => a.getAttribute('href') + '|' + a.textContent.trim()),
        mob: [...document.querySelectorAll('.mobile-nav .mnav-item')].map(b => (b.onclick ? b.onclick.toString() : '') + (b.getAttribute('onclick') || '')).filter(x => /practica/.test(x)),
      }));
      const want = member ? 'practica-miembros.html' : 'practica.html';
      assert.ok(r.nav.length > 0, who + ' ' + vp + ': no se encontró el enlace Practicar');
      r.nav.forEach(n => assert.strictEqual(n.split('|')[0], want, who + ' ' + vp + ': menú ' + n));
      r.mob.forEach(m => assert.ok(m.includes("'" + want + "'") && (member || !m.includes('practica-miembros')), who + ' ' + vp + ': barra móvil ' + m));
      ok++; console.log('  ok  ' + who + ' / ' + vp + ': Practicar -> ' + want + ' ' + JSON.stringify(r.nav));
      await ctx.close();
    }
  }
  await browser.close(); server.close(); console.log('\n' + ok + ' pruebas correctas');
})().catch(e => { console.error('FALLA', e); process.exit(1); });
