#!/usr/bin/env node
/* Medición de compras (GA4/Pixel): la compra se registra SOLO con confirmación del webhook (is_member + member_since), una vez, sin duplicados
   y sin datos personales. Corre con:  node tools/tests/compras-ga4.test.js   (desde la carpeta inglesconLeo). Extrae la función REAL de miembros.html. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'miembros.html'), 'utf8');
const a = html.indexOf('function trackPurchaseOnce'), b = html.indexOf('async function pollForMembershipAfterCheckout');
assert(a > 0 && b > a, 'no se encontró trackPurchaseOnce');
const fnSrc = html.slice(a, b);
let passed = 0, failed = 0;
function test(n, f){ try{ f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.log('  FAIL ' + n + '\n       ' + String(e.message).split('\n')[0]); } }
function env(search, store){
  const events = [], ls = store || {};
  const ctx = { Date, Math, events, window:{ location:{ search } }, localStorage:{ getItem:k => k in ls ? ls[k] : null, setItem:(k, v)=>{ ls[k] = String(v); } },
    trackLeoEvent:(n, p)=> events.push([n, p]), getPurchaseParams:()=>({ value:2, currency:'USD', plan:'monthly' }), cameFromCheckoutReturn: /(^|[?&])(paypal|stripe|mp)=success(&|$)/.test(search) };
  ctx.fnRun = vm.runInContext; vm.createContext(ctx); vm.runInContext(fnSrc + ';this.t = trackPurchaseOnce;', ctx); return ctx;
}
const fresh = () => ({ is_member:true, member_since:new Date(Date.now() - 60000).toISOString() });
console.log('Compras en GA4');
test('compra reciente confirmada (webhook ya activo al volver): se registra con método e id opaco', ()=>{
  const c = env('?stripe=success'); c.t(fresh());
  assert.strictEqual(c.events.length, 1); const [n, p] = c.events[0];
  assert.strictEqual(n, 'membership_purchase_completed'); assert.strictEqual(p.method, 'stripe'); assert(/^m[0-9a-z]+$/.test(p.transaction_id)); assert.strictEqual(p.value, 2);
  assert(!/@|[0-9a-f]{8}-[0-9a-f]{4}/i.test(JSON.stringify(p)), 'sin correo ni uuid');
});
test('PayPal y Mercado Pago cuentan igual', ()=>{ ['paypal', 'mp'].forEach(m => { const c = env('?' + m + '=success'); c.t(fresh()); assert.strictEqual(c.events[0][1].method, m); }); });
test('recargar o reabrir la pantalla NO duplica (misma compra)', ()=>{
  const store = {}, pr = fresh(); const c1 = env('?stripe=success', store); c1.t(pr); c1.t(pr);
  const c2 = env('?stripe=success', store); c2.t(pr);
  assert.strictEqual(c1.events.length, 1); assert.strictEqual(c2.events.length, 0);
});
test('no cuenta: sin volver del pago, miembro manual (sin member_since), miembro antiguo o no miembro', ()=>{
  let c = env(''); c.t(fresh()); assert.strictEqual(c.events.length, 0, 'sin ?success');
  c = env('?stripe=success'); c.t({ is_member:true, member_since:null }); assert.strictEqual(c.events.length, 0, 'manual');
  c = env('?stripe=success'); c.t({ is_member:true, member_since:new Date(Date.now() - 3 * 86400000).toISOString() }); assert.strictEqual(c.events.length, 0, 'antiguo');
  c = env('?stripe=success'); c.t({ is_member:false, member_since:new Date().toISOString() }); assert.strictEqual(c.events.length, 0, 'aún no confirmado');
  c = env('?stripe=success'); c.t(null); assert.strictEqual(c.events.length, 0);
});
test('las tres rutas de retorno llaman a la misma función (poll, initGate y login posterior)', ()=>{
  assert.strictEqual((html.match(/^\s+trackPurchaseOnce\(profile\);/gm) || []).length, 3);
  assert(!/leoPurchaseTracked'/.test(html), 'ya no se usa la llave de sesión vieja');
});
test('cobros intactos: las funciones de pago no se tocaron (return_url, webhooks)', ()=>{
  const sc = fs.readFileSync(path.join(root, 'supabase_functions/stripe-checkout.ts'), 'utf8');
  assert(/return_url', BACK_URL \+ '\?stripe=success'/.test(sc));
  const pp = fs.readFileSync(path.join(root, 'supabase_functions/paypal-checkout.ts'), 'utf8');
  assert(/return_url: BACK_URL \+ '\?paypal=success'/.test(pp));
});
test('eventos esenciales instrumentados sin datos personales', ()=>{
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  ['first_practice_started', 'first_session_completed', 'free_daily_limit_reached'].forEach(e => assert(app.indexOf("'" + e + "'") !== -1, e));
  assert(html.indexOf("trackLeoEvent('checkout_started', from") !== -1 && html.indexOf("trackLeoEvent('free_signup_completed')") !== -1);
  assert(!/trackLeoEvent\('(first_practice_started|first_session_completed|checkout_started)'[^)]*(email|uid|userId|\.id)/.test(app + html));
});
console.log('\n' + passed + ' ok, ' + failed + ' fallos'); process.exit(failed ? 1 : 0);
