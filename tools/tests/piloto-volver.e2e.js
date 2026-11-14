#!/usr/bin/env node
/* PRUEBA de "volver al tema despues de crear cuenta o entrar" (jsdom; si falta jsdom se omite).
   Usa el app.js REAL y el codigo REAL de miembros.html (con un backend simulado; la unica sustitucion es que la navegacion
   "window.location.href = X" se anota en window.__nav en vez de navegar). Comprueba:
     - Validacion estricta de destinos (leoSafeVolver): paginas internas simples; en practica.html solo skill/tema/level con formato fijo;
       nada de URLs externas, "//", "javascript:", rutas, la pagina de miembros ni parametros extra.
     - Visitante -> registro -> su tema (con ?cuenta=nueva); visitante -> entrar (cuenta gratis y miembro) -> su tema; Google (destino guardado en la pestana).
     - Enlaces antiguos y accesos sin parametros: igual que antes. */
'use strict';
let JSDOM; try{ ({ JSDOM } = require('jsdom')); }catch(e){ console.log('piloto-volver.e2e: OMITIDA (falta jsdom: npm i jsdom)'); process.exit(0); }
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const fails = []; let checks = 0; const ok = (c, m) => { checks++; if(!c) fails.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function page(html, url, extraGlobals){
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = function(){};
  w.matchMedia = () => ({ matches: false, addEventListener(){}, removeEventListener(){} });
  w.IntersectionObserver = function(){ return { observe(){}, disconnect(){} }; };
  w.Audio = function(){ return { play: () => Promise.resolve(), pause(){}, addEventListener(){} }; };
  const ctx = dom.getInternalVMContext(); w.run = c => new vm.Script(c).runInContext(ctx);
  return w;
}
const load = (w, files) => files.forEach(f => w.run(read(f)));

// ---- 1. Validacion de destinos ----
{
  const w = page('<!doctype html><body></body>', 'https://inglesconleo.com/practica.html');
  load(w, ['data.js', 'temas.js', 'app.js']);
  const S = v => w.run('leoSafeVolver(' + JSON.stringify(v) + ')');
  const buenos = { 'practica.html': 'practica.html', 'plan-estudio.html': 'plan-estudio.html',
    'practica.html?skill=grammar&tema=causativos': 'practica.html?skill=grammar&tema=causativos',
    'practica.html?tema=in-on-at&level=facil&skill=grammar': 'practica.html?skill=grammar&tema=in-on-at&level=facil',
    'practica.html?skill=grammar&tema=x&evil=1': 'practica.html?skill=grammar&tema=x',            // parametro extra: se descarta
    'practica.html?skill=hack&tema=ok': 'practica.html?tema=ok',                                  // valor fuera de la lista: se descarta
    'practica.html?tema=a&tema=b': 'practica.html?tema=a' };                                      // repetido: el primero
  Object.keys(buenos).forEach(k => ok(S(k) === buenos[k], 'valido ' + k + ' -> ' + buenos[k] + ' (da ' + S(k) + ')'));
  ['https://evil.com', 'http://evil.com/x.html', '//evil.com', 'javascript:alert(1)', '/practica.html', '../practica.html', 'practica.html/../x', 'a/b.html',
   'miembros.html', 'miembros.html?tema=x', 'practica.html?tema=<script>', 'practica.html?tema=%3Cscript%3E', 'practica.html#x', 'practica.html?tema=a b', 'PRACTICA.html', '',
   'practica.html?tema=' + 'a'.repeat(61), 'x'.repeat(250) + '.html', 'practica.html\nhttps://evil.com', 'practica.html?skill=grammar&tema=x%0d%0a']
   .forEach(k => ok(S(k) === '' || (S(k).indexOf('evil') === -1 && S(k).indexOf('<') === -1 && S(k).indexOf('%') === -1 && S(k).indexOf('/') === -1), 'rechazado o saneado: ' + JSON.stringify(k).slice(0, 50) + ' -> ' + JSON.stringify(S(k))));
  ['https://evil.com', '//evil.com', 'javascript:alert(1)', 'miembros.html', 'practica.html?tema=<script>'].forEach(k => ok(S(k) === '' || S(k) === 'practica.html', 'nunca devuelve un destino externo: ' + k));
  ok(S('otra.html?tema=x') === 'otra.html', 'fuera de practica.html los parametros se descartan');
}

// ---- 2. Enlaces de registro/entrada que genera app.js ----
function enlaces(url){
  const w = page('<!doctype html><body></body>', url); load(w, ['data.js', 'temas.js', 'app.js']);
  w.run("_leoAccessTier = 'guest';");
  const d = w.document.createElement('div'); d.innerHTML = w.renderFreeDailyLimitReachedBlock();
  return [...d.querySelectorAll('a')].map(a => a.getAttribute('href'));
}
{
  const h = enlaces('https://inglesconleo.com/practica.html?skill=grammar&tema=causativos&level=medio');
  ok(h.includes('miembros.html?modo=registro&volver=practica.html%3Fskill%3Dgrammar%26tema%3Dcausativos%26level%3Dmedio'), 'registro desde un tema conserva skill, tema y level: ' + h.join(' | '));
  ok(h.includes('miembros.html?volver=practica.html%3Fskill%3Dgrammar%26tema%3Dcausativos%26level%3Dmedio'), 'Ya tengo cuenta tambien conserva el tema: ' + h.join(' | '));
  const sinParam = enlaces('https://inglesconleo.com/practica.html');
  ok(sinParam.includes('miembros.html?modo=registro&volver=practica.html') && sinParam.includes('miembros.html'), 'sin parametros: los enlaces quedan exactamente como antes: ' + sinParam.join(' | '));
  const malo = enlaces('https://inglesconleo.com/practica.html?tema=%3Cscript%3E&skill=grammar');
  ok(malo.every(x => x.indexOf('script') === -1 && x.indexOf('%3C') === -1), 'un parametro manipulado no llega al enlace: ' + malo.join(' | '));
}

// ---- 3. Regreso en miembros.html (codigo real) ----
const miembros = read('miembros.html');
const inline = (miembros.split('<script>').find(c => c.indexOf('async function afterAuthSuccess') !== -1) || '').split('</script>')[0];
ok(!!inline, 'se encontro el script de miembros.html');
async function regreso({ url, profile, fromSignup, session, click }){
  const w = page(miembros.replace(/<script[\s\S]*?<\/script>/g, ''), url);
  load(w, ['data.js', 'temas.js', 'app.js']);
  w.__nav = null; w.__google = []; w.__calls = [];
  if(session) w.sessionStorage.setItem('leo_volver_full', session);
  w.run(`var LeoBackend = new Proxy({ isConfigured: () => true, getMemberProfile: async () => (${JSON.stringify(profile || null)}), syncProgressFromCloud: async () => { __calls.push('sync'); },
    signInWithGoogle: async v => { __google.push(v); return { ok: true }; }, onPasswordRecovery(){}, onAuthChange(){}, getSession: async () => null },
    { get: (t, k) => (k in t ? t[k] : (async () => null)) });`);
  w.run('var GOOGLE_LOGIN_ENABLED = true;');
  const src = inline.replace(/window\.location\.href\s*=\s*/g, 'window.__nav = ');
  try{ w.run(src); }catch(e){ fails.push('miembros.html no se pudo ejecutar: ' + e.message); return w; }
  await sleep(50);
  if(click){ w.document.getElementById('googleLoginBtn').click(); await sleep(50); }
  else if(fromSignup !== undefined){ await w.run('afterAuthSuccess(' + fromSignup + ')'); await sleep(900); }
  return w;
}

// ---- 4. Cuenta recien creada: practica.html quita ?cuenta=nueva pero conserva el tema (initFreePractice lo lee despues) ----
(function(){
  const pr = read('practica.html');
  const m = /const restoQuery = [^\n]*\n\s*(history\.replaceState\([^\n]*\);)/.exec(pr);
  ok(!!m, 'practica.html conserva el resto de la direccion al quitar ?cuenta=nueva');
  if(!m) return;
  [['?skill=grammar&tema=causativos&cuenta=nueva', '?skill=grammar&tema=causativos'], ['?cuenta=nueva', ''], ['?tema=a&cuenta=nueva&level=facil', '?tema=a&level=facil']].forEach(([q, esperado]) => {
    const w = page('<!doctype html><body></body>', 'https://inglesconleo.com/practica.html' + q);
    w.run("const restoQuery = new URLSearchParams(window.location.search); restoQuery.delete('cuenta'); " + m[1]);
    ok(w.location.pathname + w.location.search === '/practica.html' + esperado, 'cuenta nueva ' + q + ' -> ' + w.location.search + ' (esperado ' + esperado + ')');
  });
})();

(async function(){
  const V = 'practica.html%3Fskill%3Dgrammar%26tema%3Dcausativos';
  const dest = 'practica.html?skill=grammar&tema=causativos';
  const free = { is_member: false, created_at: new Date().toISOString() }, member = { is_member: true };
  let w;
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?modo=registro&volver=' + V, profile: free, fromSignup: true });
  ok(w.__nav === dest + '&cuenta=nueva', 'visitante -> registro -> su tema (con ?cuenta=nueva): ' + w.__nav);
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?volver=' + V, profile: free, fromSignup: false });
  ok(w.__nav === dest, 'visitante -> entra (cuenta gratis) -> su tema: ' + w.__nav);
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?volver=' + V, profile: member, fromSignup: false });
  ok(w.__nav === dest && w.__calls.includes('sync'), 'miembro -> entra -> su tema (tras sincronizar su progreso): ' + w.__nav);
  // Google: el destino completo viaja en la pestana; a Google solo se le pasa el nombre de la pagina (direccion de regreso sin cambios)
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?volver=' + V, click: true });
  ok(w.__google.length === 1 && w.__google[0] === 'practica.html' && w.sessionStorage.getItem('leo_volver_full') === dest, 'Google: se pasa solo practica.html y el destino queda guardado: ' + JSON.stringify(w.__google));
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?oauth=google&volver=practica.html', profile: member, session: dest });
  ok(w.__nav === dest, 'regreso de Google (miembro) -> su tema: ' + w.__nav);
  ok(w.sessionStorage.getItem('leo_volver_full') === null, 'el destino guardado se consume una sola vez');
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?volver=practica.html', profile: free, fromSignup: false, session: dest });
  ok(w.__nav === null, 'el destino guardado solo se usa al volver de Google (no en un acceso normal)');
  // Enlaces antiguos y sin parametros: igual que antes
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?modo=registro&volver=practica.html', profile: free, fromSignup: true });
  ok(w.__nav === 'practica.html?cuenta=nueva', 'enlace antiguo de registro (solo pagina): igual que antes: ' + w.__nav);
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?volver=practica.html', profile: free, fromSignup: false });
  ok(w.__nav === null, 'enlace antiguo de entrada con solo la pagina: sigue sin redirigir');
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html', profile: member, fromSignup: false });
  ok(w.__nav === null, 'miembro sin parametros: entra a su panel como siempre');
  w = await regreso({ url: 'https://inglesconleo.com/miembros.html?modo=registro', profile: free, fromSignup: true });
  ok(w.__nav === null, 'registro sin parametros: sigue su flujo de siempre (sin redirigir)');
  // Manipulados
  for(const v of ['https%3A%2F%2Fevil.com', '%2F%2Fevil.com', 'javascript%3Aalert(1)', 'miembros.html', 'practica.html%3Ftema%3D%3Cscript%3E', 'practica.html%3Ftema%3Dok%26evil%3D1%26skill%3Dhack']){
    for(const [prof, signup] of [[free, true], [free, false], [member, false]]){
      w = await regreso({ url: 'https://inglesconleo.com/miembros.html?volver=' + v, profile: prof, fromSignup: signup });
      const n = w.__nav;
      ok(n === null || /^practica\.html(\?(tema=ok)(&cuenta=nueva)?|\?cuenta=nueva)?$/.test(n), 'manipulado ' + decodeURIComponent(v) + ' (' + (signup ? 'registro' : prof.is_member ? 'miembro' : 'entrar') + ') -> ' + n);
    }
  }
  if(fails.length){ console.error('FALLA piloto-volver.e2e (' + fails.length + ' de ' + checks + '):\n  ' + fails.slice(0, 25).join('\n  ')); process.exit(1); }
  console.log('piloto-volver.e2e: ' + checks + ' comprobaciones (visitante, cuenta gratis, miembro, Google, enlaces antiguos y destinos manipulados), todas bien');
})();
