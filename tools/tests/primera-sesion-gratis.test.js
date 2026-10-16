#!/usr/bin/env node
/* Primera sesion de una cuenta gratis (miembros.html): contrato del codigo, sin red ni navegador.
   Cubre solo la salida a la practica gratis en la pantalla "Tu cuenta esta lista" y en el area de miembros con candados.
   NO debe cambiar: boton de activar membresia, pasos de pago, regreso a la practica (?volver=), onboarding ni limites. */
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'miembros.html'), 'utf8').replace(/\r\n/g, '\n');
let p = 0, f = 0;
function test(n, fn){ try { fn(); p++; console.log('  ok   ' + n); } catch(e){ f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }

const welcome = html.slice(html.indexOf('id="loginWelcome"'), html.indexOf('id="loginPending"'));
const preview = html.slice(html.indexOf('id="memberPreview"'), html.indexOf('<!-- MEMBER DASHBOARD -->'));

test('Bienvenida: Activar membresia sigue siendo el boton principal y va antes que la practica gratis', () => {
  const a = welcome.indexOf('id="welcomeActivateBtn"'), b = welcome.indexOf('id="welcomeSkipBtn"');
  assert(a > 0 && b > a);
  assert(/class="btn btn-primary btn-block" id="welcomeActivateBtn">Activar membresía: \$2 USD\/mes</.test(welcome));
});
test('Bienvenida: la practica gratis es un enlace visible a practica.html?cuenta=nueva (misma ruta que ya usa el registro desde la practica)', () => {
  assert(/<a href="practica\.html\?cuenta=nueva" class="btn btn-ghost btn-block" id="welcomeSkipBtn"[^>]*>Practicar gratis ahora<\/a>/.test(welcome));
});
test('Bienvenida: ya no hay un "Ahora no" que lleve a otra pantalla de pago', () => {
  assert(!/Ahora no/.test(welcome));
  assert(!/welcomeSkipBtn\.addEventListener\('click', \(e\)=>\{ e\.preventDefault\(\); showMemberPreview/.test(html));
});
test('Area con candados: boton de activar intacto y boton visible de practica gratis al lado', () => {
  assert(/<button type="button" class="btn btn-primary" id="previewActivateBtn">Activar membresía<\/button>/.test(preview));
  assert(/<a href="practica\.html" class="btn btn-ghost" id="previewPracticeBtn">Practicar gratis ahora<\/a>/.test(preview));
  assert(preview.indexOf('previewActivateBtn') < preview.indexOf('previewPracticeBtn'));
});
test('El enlace de abajo de la pagina se conserva', () => {
  assert(/Mientras tanto, sigue practicando gratis/.test(preview));
});
test('Los pasos de pago y el regreso con ?volver= no cambiaron', () => {
  assert(/welcomeActivateBtn\.addEventListener\('click', goToPayment\)/.test(html));
  assert(/function goToPayment\(\)\{\s*showGate\(\); showLoginStep\(3\);[\s\S]*?scrollIntoView/.test(html), 'el pago se muestra y se baja hasta el');
  assert(/previewActivateBtn\.addEventListener\('click', goToPayment\)/.test(html) && /get\('pagar'\) === '1'/.test(html));
  /* el boton de la vista previa ahora usa goToPayment (ver arriba) */
  assert(/window\.location\.href = volver \+ '\?cuenta=nueva'/.test(html));
  assert(/else if\(fromSignup\)\{[\s\S]{0,200}free_signup_completed/.test(html));
});
test('Eventos de medicion (solo Analytics, no van al Pixel de Meta)', () => {
  assert(/trackLeoEvent\('welcome_free_practice_clicked'\)/.test(html) && /trackLeoEvent\('preview_free_practice_clicked'\)/.test(html));
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const map = app.slice(app.indexOf('var META_PIXEL_EVENT_MAP'), app.indexOf('function fireMetaPixelEvent'));
  assert(!/free_practice_clicked/.test(map));
});
test('Los scripts en linea siguen siendo JavaScript valido', () => {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  assert(scripts.length > 0);
  for(const s of scripts){ if(/application\/ld\+json/.test(s)) continue; new vm.Script(s); }
});
console.log(`\n${p} pass, ${f} fail`); process.exit(f ? 1 : 0);
