/* Prueba gratis de Leo AI en un navegador REAL (Chromium, pantalla de celular) con la nube y el servidor de Leo AI SIMULADOS.
   Cubre: invitado (invitacion unica, sin IA), cuenta gratis (boton al fallar, contador del servidor, invitacion suave y muro
   a los $2 al gastar las 5), interruptor apagado, miembro (Leo AI completo sin tocar la prueba), transicion gratis -> pago
   y que nada se salga de la pantalla en 320/360/375 px.
     node tools/e2e/leo-ai-trial.browser.js [carpeta-del-sitio] [carpeta-de-capturas]      (necesita Playwright)
   Sirve los archivos reales del sitio; todo lo externo se bloquea; supabase-js y la Edge Function leo-ai se reemplazan. */
let chromium; try{ chromium = require('playwright').chromium; }catch(e){ chromium = require('/opt/npm-tools/node_modules/playwright').chromium; }
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = process.argv[2] || path.join(__dirname, '..', '..');
const SHOTS = process.argv[3] || null;
const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'practica.html');
  fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
});
const FAKE = `
window.supabase = { createClient: function(){
  var cfg = window.__FAKE || {};
  var SESSION = cfg.user ? { user:{ id:cfg.user }, access_token:'token-de-prueba' } : null;
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
      if(st.table === 'profiles' && st.op === 'select'){
        var row = cfg.user ? { id:cfg.user, is_member: !!cfg.member, level:'facil', onboarded_at:'2026-10-01T00:00:00Z', display_name:'Ana', free_daily_count:0, free_daily_date:null, free_first_exercise_at:'2026-10-01T00:00:00Z', member_since: cfg.member ? '2026-10-01T00:00:00Z' : null } : null;
        return { data: st.single ? row : [row], error:null };
      }
      return { data: st.single ? null : [], error: null };
    }
    return b;
  }
  return { auth:{ getSession: async function(){ return { data:{ session: SESSION } }; }, getUser: async function(){ return { data:{ user: SESSION && SESSION.user } }; }, onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; }, signOut: async function(){ return {}; } },
    from: builder, rpc: async function(){ return { data:null, error:null }; }, functions:{ invoke: async function(){ return { data:null, error:null }; } } };
} };`;
const CORS = { 'access-control-allow-origin':'*', 'access-control-allow-headers':'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods':'POST, OPTIONS' };
/* Servidor de Leo AI simulado: replica las reglas de la Edge Function + la base (creditos por cuenta, solo al fallar). */
function newServer(over){
  const srv = Object.assign({ enabled:true, credits:5, used:0, member:false, log:[], tokens:[] }, over || {});
  srv.trial = () => ({ enabled: srv.enabled, credits: srv.credits, used: Math.min(srv.used, srv.credits), remaining: Math.max(srv.credits - srv.used, 0) });
  return srv;
}
async function newPage(browser, user, srv, opts){
  opts = opts || {};
  const ctx = opts.ctx || await browser.newContext({ viewport:{ width: opts.w || 375, height: opts.h || 740 }, isMobile:true, hasTouch:true, storageState: opts.storage || undefined });
  const page = await ctx.newPage();
  await page.addInitScript(a => { window.__FAKE = { user:a.u, member:a.m }; if(a.u) localStorage.setItem('sb-test-auth-token', '{}'); }, { u:user, m: !!(srv && srv.member) });
  await page.route('**/*', route => {
    const u = route.request().url();
    if(u.startsWith('http://localhost')) return route.continue();
    if(u.includes('supabase-js')) return route.fulfill({ contentType:'application/javascript', body: FAKE });
    return route.abort();
  });
  if(srv) await page.route('**/functions/v1/leo-ai', async route => {
    const req = route.request();
    if(req.method() === 'OPTIONS') return route.fulfill({ status:204, headers:CORS });
    const body = JSON.parse(req.postData() || '{}'); srv.log.push(body); srv.tokens.push(req.headers()['authorization']);
    let out;
    if(body.mode === 'trial_status') out = srv.member ? { ok:true, trial:{ enabled:false, member:true } } : { ok:true, trial: srv.trial() };
    else if(srv.member) out = { ok:true, mode:body.mode, answer:{ explanation:'Respuesta para miembro', example_en:'I went.', example_es:'Fui.' } };
    else if(body.mode !== 'explain' || body.isCorrect !== false) out = { ok:false, reason:'members_only', final:true };
    else if(!srv.enabled) out = { ok:false, reason:'trial_off', final:true, trial: srv.trial() };
    else if(srv.used >= srv.credits) out = { ok:false, reason:'trial_exhausted', final:true, trial: srv.trial() };
    else { srv.used++; out = { ok:true, mode:'explain', answer:{ explanation:'Explicación de prueba número ' + srv.used, example_en:'I went to school.', example_es:'Fui a la escuela.' }, trial: srv.trial() }; }
    await route.fulfill({ status:200, contentType:'application/json', headers:CORS, body: JSON.stringify(out) });
  });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  return { ctx, page, errors };
}
const base = skill => 'http://localhost:' + server.address().port + '/practica.html?skill=' + (skill || 'grammar');
async function openPractica(page, opts){
  await page.goto(base());
  await page.waitForFunction(() => document.getElementById('practicaMain') && document.getElementById('practicaMain').style.visibility === 'visible', null, { timeout: 8000 });
  await page.waitForTimeout(600);
  if(!(opts && opts.keepLimits)) await page.evaluate(() => { window.FREE_USER_DAILY_LIMIT = 500; window.GUEST_EXERCISE_LIMIT = 500; });
}
/* Responde ejercicios (siempre la 1a opcion) hasta FALLAR uno. Devuelve la tarjeta, con la correccion ya a la vista. */
async function failOne(page, hooks){
  for(let i = 0; i < 16; i++){
    if(await page.locator('#skillBody #freeAgainBtn').count()) await page.locator('#freeAgainBtn').click();
    const card = page.locator('#skillBody .session-card');
    await card.waitFor({ timeout: 6000 });
    await card.locator('.option:not([disabled]), .word-chip, .error-word').first().click();
    await card.locator('#fb.show').waitFor({ timeout: 4000 });
    if(await card.locator('#fb.bad').count()) return card;
    if(hooks && hooks.onCorrect) await hooks.onCorrect(card);
    await card.locator('#nextRow .next-btn').click();
    await page.waitForTimeout(120);
  }
  throw new Error('no se logró fallar un ejercicio');
}
async function next(card, page){ await card.locator('#nextRow .next-btn').click(); await page.waitForTimeout(150); }
async function overflow(page, label){
  const r = await page.evaluate(() => {
    const vw = window.innerWidth, bad = [];
    document.querySelectorAll('.leo-ai, .leo-ai *').forEach(el => { const b = el.getBoundingClientRect(); if(b.width && (b.right > vw + 0.5 || b.left < -0.5)) bad.push((el.className || el.tagName) + ' ' + Math.round(b.left) + '..' + Math.round(b.right)); });
    return { vw, sw: document.documentElement.scrollWidth, bad };
  });
  assert.ok(r.sw <= r.vw, label + ': scroll horizontal (' + r.sw + ' > ' + r.vw + ')');
  assert.deepStrictEqual(r.bad, [], label + ': elementos de Leo AI fuera de pantalla');
}
const aiText = async page => (await page.locator('.leo-ai').allInnerTexts()).join(' | ');
const explainCalls = srv => srv.log.filter(b => b.mode === 'explain');
const shot = async (page, name) => { if(SHOTS){ fs.mkdirSync(SHOTS, { recursive:true }); await page.screenshot({ path: path.join(SHOTS, name + '.png') }); } };

(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }).catch(() => chromium.launch());
  let ok = 0; const pass = n => { ok++; console.log('  ok  ' + n); };

  // 1) INVITADO: sin Leo AI; UNA invitacion a crear cuenta (no es acceso a la IA); sus 5 ejercicios no cambian
  { const srv = newServer(); const { ctx, page, errors } = await newPage(browser, null, srv, { w:360 });
    await openPractica(page, { keepLimits:true });
    // Con el interruptor APAGADO (valor por defecto) el invitado no ve ninguna promesa de la prueba
    await page.evaluate(() => { LEO_AI_TRIAL_PUBLIC = false; });      // el código real ya viene en true: aquí se simula apagado
    const cardOff = await failOne(page); await page.waitForTimeout(300);
    assert.strictEqual(await page.locator('.leo-ai').count(), 0, 'prueba apagada: ninguna invitación engañosa al invitado');
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('leo_ai_teaser_day')), null, 'apagada: ni siquiera se marca el día');
    await page.evaluate(() => { LEO_AI_TRIAL_PUBLIC = true; });
    await next(cardOff, page);
    const card = await failOne(page);
    assert.strictEqual(await page.locator('.leo-ai-btn').count(), 0, 'invitado: ningún botón de IA');
    const t = await aiText(page);
    assert.ok(/¿Por qué te equivocaste\?/.test(t) && /Leo AI te ayuda a entender tus errores\. Crea tu cuenta gratis y prueba 5 explicaciones\./.test(t) && /Crear mi cuenta gratis/.test(t), t);
    assert.ok(!/ilimitad|sin l[ií]mites?/i.test(t));
    assert.ok(!/ilimitad/i.test(t));
    assert.match(await page.locator('.leo-ai.is-teaser a').getAttribute('href'), /^miembros\.html\?modo=registro&volver=practica\.html$/);
    assert.strictEqual(srv.log.length, 0, 'invitado: ninguna llamada a Leo AI');
    await overflow(page, 'invitado 360'); await shot(page, 'invitado-360');
    await next(card, page);
    await failOne(page);                                                  // 2o fallo: la invitación NO se repite
    assert.strictEqual(await page.locator('.leo-ai').count(), 0, 'una sola invitación por página');
    await page.reload(); await openPractica(page); await page.evaluate(() => { LEO_AI_TRIAL_PUBLIC = true; }); await failOne(page);
    assert.strictEqual(await page.locator('.leo-ai').count(), 0, 'ni al recargar el mismo día');
    assert.strictEqual(srv.log.length, 0);
    assert.deepStrictEqual(errors, []);
    pass('invitado: sin IA, una sola invitación a crear cuenta gratis, sin llamadas al servidor');
    await ctx.close(); }

  // 1b) INVITADO: el limite de 5 ejercicios y su bloque siguen igual
  { const { ctx, page, errors } = await newPage(browser, null, newServer());
    await openPractica(page, { keepLimits:true });
    for(let i = 0; i < 5; i++){
      if(await page.locator('#skillBody #freeAgainBtn').count()) await page.locator('#freeAgainBtn').click();
      const card = page.locator('#skillBody .session-card'); await card.waitFor({ timeout:6000 });
      await card.locator('.option:not([disabled]), .word-chip, .error-word').first().click();
      await card.locator('#nextRow .next-btn').click(); await page.waitForTimeout(150);
    }
    await page.waitForFunction(() => /ejercicios de prueba/.test(document.querySelector('#skillBody').textContent), null, { timeout:5000 });
    assert.deepStrictEqual(errors, []);
    pass('invitado: sigue limitado a 5 ejercicios con su bloque de "crea tu cuenta"');
    await ctx.close(); }

  // 2) CUENTA GRATIS: boton solo al fallar, contador del servidor, invitacion suave y muro a los $2
  { const srv = newServer(); const { ctx, page, errors } = await newPage(browser, 'u1', srv);
    await openPractica(page);
    const card1 = await failOne(page, { onCorrect: async () => { await page.waitForTimeout(250); assert.strictEqual(await page.locator('.leo-ai:not([hidden])').count(), 0, 'al acertar no se ofrece Leo AI'); } });
    const btn = page.locator('.leo-ai.is-trial .leo-ai-btn'); await btn.waitFor({ timeout: 4000 });
    assert.match(await btn.innerText(), /Explícame mi error con Leo AI/);
    assert.match(await page.locator('.leo-ai-credits').innerText(), /Te quedan 5 explicaciones gratis para probarlo\./);
    assert.strictEqual(await page.locator('.leo-ai-pitch-title').innerText(), '¿Por qué te equivocaste?');
    assert.match(await page.locator('.leo-ai-pitch-text').innerText(), /No te quedes solo con la respuesta correcta\. Leo AI te ayuda a entender tu error para que aprendas de él\./);
    assert.strictEqual(explainCalls(srv).length, 0, 'ver el botón no gasta nada');
    assert.deepStrictEqual(srv.log.map(b => b.mode), ['trial_status'], 'solo se pregunta el estado');
    await overflow(page, 'gratis botón 375'); await shot(page, 'gratis-boton-375');
    await btn.click();
    await page.locator('.leo-ai-answer .leo-ai-text').waitFor({ timeout: 4000 });
    assert.match(await page.locator('.leo-ai-answer').innerText(), /Explicación de prueba número 1/);
    assert.match(await page.locator('.leo-ai-credits').innerText(), /Te quedan 4 explicaciones/);
    assert.strictEqual(await page.locator('.leo-ai-upsell').count(), 0, 'con 4 restantes no hay recuadro de venta');
    assert.strictEqual(await page.locator('.leo-ai-soft').innerText(), 'Aprende de cada error con Leo AI. Incluido en tu membresía por solo $2 USD al mes.');
    const sent = explainCalls(srv)[0];
    assert.strictEqual(sent.mode, 'explain'); assert.strictEqual(sent.isCorrect, false); assert.ok(/^[A-Za-z0-9_-]{8,64}$/.test(sent.request_id));
    assert.ok(!/"u1"|token-de-prueba|@|user_id|email/i.test(JSON.stringify(sent)), 'sin datos personales: ' + JSON.stringify(sent));
    assert.ok(srv.tokens.every(t => t === 'Bearer token-de-prueba'));
    await shot(page, 'gratis-respuesta-375');
    await next(card1, page);
    // 2a..5a explicaciones
    for(let n = 2; n <= 5; n++){
      const c = await failOne(page);
      const b = page.locator('.leo-ai.is-trial .leo-ai-btn'); await b.waitFor({ timeout: 4000 });
      assert.strictEqual(await page.locator('.leo-ai-pitch-title').count(), 0, 'el texto largo de venta no se repite en cada ejercicio');
      assert.match(await page.locator('.leo-ai-credits').innerText(), new RegExp('Te quedan ' + (6 - n) + ' explicaciones|Te queda 1 explicación'));
      await b.click();
      await page.locator('.leo-ai-answer .leo-ai-text').waitFor({ timeout: 4000 });
      const txt = await aiText(page);
      assert.ok(!/ilimitad/i.test(txt), 'nunca se dice ilimitado: ' + txt);
      if(n === 2){ assert.strictEqual(await page.locator('.leo-ai-upsell').count(), 0); assert.strictEqual(await page.locator('.leo-ai-soft').count(), 1); }
      if(n === 3 || n === 4){
        const up = page.locator('.leo-ai-upsell:not(.is-done)'); await up.waitFor({ timeout: 2000 });
        const ut = await up.innerText();
        assert.ok(/¿Te está ayudando Leo AI\?/.test(ut) && /Tu prueba está por terminar\. Sigue aprendiendo de tus errores con Leo AI, incluido en la membresía de \$2 USD al mes\./.test(ut) && /Conocer la membresía/.test(ut), ut);
        assert.strictEqual(await page.locator('.leo-ai-soft').count(), 0, 'con 1 o 2 no se duplica el mensaje discreto');
        assert.ok(/\d explicaci/.test(await page.locator('.leo-ai-credits').innerText()), 'los créditos siguen visibles');
        assert.strictEqual(await up.locator('a').getAttribute('href'), 'miembros.html#leo-ai');
        await overflow(page, 'invitación suave ' + n); if(n === 3) await shot(page, 'gratis-invitacion-suave-375');
      }
      if(n === 5){
        const wall = page.locator('.leo-ai-upsell.is-done'); await wall.waitFor({ timeout: 2000 });
        const wt = await wall.innerText();
        assert.ok(/¡Que tus errores sigan enseñándote!/.test(wt) && /Ya probaste Leo AI\. Hazte miembro y sigue recibiendo ayuda con tus errores, además de Writing con IA y otras herramientas para miembros\./.test(wt) && /\$2 USD \/ mes/.test(wt) && /Quiero seguir aprendiendo con Leo AI/.test(wt), wt);
        assert.ok(!/ilimitad|sin l[ií]mites?|garantiz/i.test(wt));
        assert.strictEqual(await wall.locator('a').getAttribute('href'), 'miembros.html#leo-ai');
        assert.strictEqual(await page.locator('.leo-ai-credits').count(), 0, 'sin contador al llegar a 0');
        await overflow(page, 'muro 375'); await shot(page, 'gratis-muro-375');
      }
      await next(c, page);
    }
    assert.strictEqual(explainCalls(srv).length, 5, 'exactamente 5 llamadas de explicación');
    // 6o fallo: muro directo, sin botón y sin llamar a la IA
    const c6 = await failOne(page);
    await page.locator('.leo-ai-upsell.is-done').waitFor({ timeout: 4000 });
    assert.strictEqual(await page.locator('.leo-ai-btn').count(), 0);
    assert.strictEqual(explainCalls(srv).length, 5, 'no se vuelve a llamar a la IA');
    assert.deepStrictEqual(errors, []);
    pass('cuenta gratis: botón solo al fallar, 5 explicaciones con contador del servidor, invitación suave y muro de $2 (sin decir "ilimitado")');
    await ctx.close(); }

  // 3) Interruptor apagado en el servidor: no aparece NADA
  { const srv = newServer({ enabled:false }); const { ctx, page, errors } = await newPage(browser, 'u1', srv);
    await openPractica(page); await failOne(page); await page.waitForTimeout(500);
    assert.strictEqual(await page.locator('.leo-ai:not([hidden])').count(), 0); assert.strictEqual(explainCalls(srv).length, 0);
    assert.deepStrictEqual(errors, []);
    pass('trial_enabled=false: la cuenta gratis no ve nada de Leo AI');
    await ctx.close(); }

  // 4) Ya las gasto en otro dispositivo: muro directo; y el contador manda el SERVIDOR, no localStorage
  { const srv = newServer({ used:5 }); const { ctx, page } = await newPage(browser, 'u1', srv);
    await openPractica(page); await failOne(page);
    await page.locator('.leo-ai-upsell.is-done').waitFor({ timeout: 4000 });
    assert.strictEqual(explainCalls(srv).length, 0); assert.strictEqual(await page.locator('.leo-ai-btn').count(), 0);
    await ctx.close();
    const srv2 = newServer({ used:2 }); const p2 = await newPage(browser, 'u1', srv2);
    await p2.page.addInitScript(() => { ['leo_ai_trial','leo_ai_trial_used','leo_trial_remaining','leo_ai_credits'].forEach(k => localStorage.setItem(k, '0')); });
    await openPractica(p2.page); await failOne(p2.page);
    await p2.page.locator('.leo-ai-credits').waitFor({ timeout: 4000 });
    assert.match(await p2.page.locator('.leo-ai-credits').innerText(), /Te quedan 3 explicaciones/);
    pass('el contador sale del servidor (no de localStorage) y el muro aparece directo si ya gastó las 5');
    await p2.ctx.close(); }

  // 5) Writing y analisis NO se ofrecen a cuentas gratis; el servidor tambien los rechaza
  { const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
    assert.ok(/LEO_AI_TRIAL_KINDS = \{ grammar:1, vocab:1, listening:1, reading:1 \}/.test(appSrc), 'solo ejercicios de elección');
    pass('Writing, insight y diagnóstico quedan fuera de la prueba (solo grammar/vocab/listening/reading)'); }

  // 6) MIEMBRO: Leo AI completo como siempre; la prueba ni se consulta
  { const srv = newServer({ member:true }); const { ctx, page, errors } = await newPage(browser, 'm1', srv);
    await page.goto('http://localhost:' + server.address().port + '/practica-miembros.html?skill=grammar');
    await page.waitForTimeout(1500);
    const kinds = await page.evaluate(() => ({ verified: window.__leoMemberVerified === true, body: document.body.innerText.slice(0, 200) }));
    assert.ok(kinds.verified, 'miembro verificado: ' + JSON.stringify(kinds));
    // arrancar una sesión de gramática de miembro
    const start = page.locator('#skillBody button, #skillBody .btn').filter({ hasText: /Empezar|Comenzar|Iniciar|Practicar|sesión/i }).first();
    if(await start.count()) await start.click();
    await page.waitForTimeout(500);
    let failed = false;
    for(let i = 0; i < 16 && !failed; i++){
      const card = page.locator('#skillBody .session-card'); await card.waitFor({ timeout: 6000 });
      await card.locator('.option:not([disabled]), .word-chip, .error-word').first().click();
      await card.locator('#fb.show').waitFor({ timeout: 4000 });
      if(await card.locator('#fb.bad').count()){ failed = true; break; }
      await card.locator('#nextRow .next-btn').click(); await page.waitForTimeout(150);
    }
    assert.ok(failed);
    const mb = page.locator('.leo-ai .leo-ai-btn'); await mb.waitFor({ timeout: 4000 });
    assert.match(await mb.innerText(), /Explícame por qué/);
    assert.strictEqual(await page.locator('.leo-ai.is-trial, .leo-ai-credits, .leo-ai-upsell, .is-teaser').count(), 0, 'el miembro no ve nada de la prueba');
    await mb.click(); await page.locator('.leo-ai-answer .leo-ai-text').waitFor({ timeout: 4000 });
    assert.match(await page.locator('.leo-ai-answer').innerText(), /Respuesta para miembro/);
    assert.ok(!srv.log.some(b => b.mode === 'trial_status'), 'a un miembro no se le consulta la prueba');
    assert.deepStrictEqual(errors, []);
    pass('miembro: Leo AI completo ("Explícame por qué"), sin contador ni invitaciones');
    await ctx.close(); }

  // 7) TRANSICION gratis -> pago: agotó las 5, paga, vuelve a practicar y ya tiene Leo AI de miembro
  { const srv = newServer({ used:5 }); let r = await newPage(browser, 'u9', srv);
    await openPractica(r.page); await failOne(r.page);
    await r.page.locator('.leo-ai-upsell.is-done').waitFor({ timeout: 4000 });
    const storage = await r.ctx.storageState(); await r.ctx.close();
    srv.member = true;                                                    // el pago se confirmó
    r = await newPage(browser, 'u9', srv, { storage });
    await r.page.goto(base()); await r.page.waitForTimeout(1500);
    assert.match(r.page.url(), /practica-miembros\.html/, 'al ser miembro lo manda a la práctica de miembros');
    assert.strictEqual(await r.page.evaluate(() => window.__leoMemberVerified === true), true);
    assert.strictEqual(await r.page.locator('.leo-ai-upsell, .is-teaser').count(), 0);
    pass('transición gratis -> pago: el muro desaparece y entra a la práctica de miembros con Leo AI completo');
    await r.ctx.close(); }

  // 8) Celular: 320 / 360 / 375, estados clave sin salirse de la pantalla
  for(const w of [320, 360, 375]){
    const srv = newServer({ used:3 }); const { ctx, page, errors } = await newPage(browser, 'u1', srv, { w, h:700 });
    await openPractica(page);
    const c = await failOne(page); const b = page.locator('.leo-ai.is-trial .leo-ai-btn'); await b.waitFor({ timeout:4000 });
    await overflow(page, w + 'px botón');
    await b.click(); await page.locator('.leo-ai-answer .leo-ai-text').waitFor({ timeout:4000 });
    await page.locator('.leo-ai-upsell:not(.is-done)').waitFor({ timeout:3000 });      // quedan 1: invitación suave
    await overflow(page, w + 'px invitación suave'); await shot(page, 'celular-' + w + '-suave');
    await next(c, page);
    const c2 = await failOne(page);
    const b2 = page.locator('.leo-ai.is-trial .leo-ai-btn'); await b2.waitFor({ timeout:4000 }); await b2.click();
    await page.locator('.leo-ai-upsell.is-done').waitFor({ timeout:3000 });
    await overflow(page, w + 'px muro'); await shot(page, 'celular-' + w + '-muro');
    assert.deepStrictEqual(errors, []);
    await ctx.close();
  }
  pass('celular 320/360/375 px: botón, respuesta, invitación suave y muro sin desbordes');

  await browser.close(); server.close();
  console.log('\n' + ok + ' pruebas correctas');
})().catch(e => { console.error('FALLA', e); process.exit(1); });
