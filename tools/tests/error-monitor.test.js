#!/usr/bin/env node
/* Pruebas del registro central de errores (Fase 1):
     error-monitor.js (navegador), supabase_functions/report-error.ts,
     supabase_functions/error-alert.ts y el helper reportServerError() de leo-ai y los
     webhooks de pago. Todo con navegador, base y correo SIMULADOS: no toca Supabase ni manda correos.
   La deduplicación, los topes y los avisos DE LA BASE se prueban en
   tools/tests/error-monitoring.test.sql (corre en Supabase y se revierte sola).
   Corre con:  node tools/tests/error-monitor.test.js   (desde la carpeta inglesconLeo)
   Necesita el paquete "typescript" de node_modules (ya está). */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const MONITOR_SRC = read('error-monitor.js');

let ok = 0, bad = 0;
const queueTests = [];
function test(name, fn){ queueTests.push({ name, fn }); }
function section(heading){ queueTests.push({ heading }); }

/* ---------------- navegador simulado ---------------- */
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
const SB = 'https://iviksyhzhiygkuaojply.supabase.co';
function makeStorage(initial, throwing){
  const d = Object.assign({}, initial || {});
  return {
    get length(){ if(throwing) throw new Error('storage bloqueado'); return Object.keys(d).length; },
    key(i){ if(throwing) throw new Error('storage bloqueado'); return Object.keys(d)[i]; },
    getItem(k){ if(throwing) throw new Error('storage bloqueado'); return k in d ? d[k] : null; },
    setItem(k, v){ if(throwing) throw new Error('storage bloqueado'); d[k] = String(v); },
    _d: d
  };
}
function makeEnv(opts){
  opts = opts || {};
  const posts = [], timers = [], handlers = {};
  const ctx = {
    console, URL, JSON, Date, Math, parseInt, String, Array, Object, RegExp, Promise, Error, TypeError,
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout(){},
    navigator: { userAgent: opts.ua || CHROME_UA, onLine: opts.onLine !== false, webdriver: !!opts.webdriver },
    location: { hostname: opts.host || 'inglesconleo.com', host: opts.host || 'inglesconleo.com', href: 'https://' + (opts.host || 'inglesconleo.com') + '/speaking.html', pathname: opts.pathname || '/speaking.html' },
    document: { readyState: 'complete', getElementsByTagName: () => [{ getAttribute: () => 'app.js?v=20261003n' }, { getAttribute: () => 'error-monitor.js?v=zzz' }] },
    localStorage: makeStorage(opts.local, opts.storageThrows), sessionStorage: makeStorage(opts.session, opts.storageThrows),
  };
  ctx.window = ctx;
  ctx.addEventListener = (type, fn) => { (handlers[type] = handlers[type] || []).push(fn); };
  ctx.__origFetch = opts.fetch || function(url, init){
    posts.push({ url, init });
    return opts.fetchResult ? opts.fetchResult(url, init) : Promise.resolve({ status: 204 });
  };
  if(!opts.noFetch) ctx.fetch = ctx.__origFetch;
  vm.createContext(ctx);
  if(!opts.noLoad) vm.runInContext(MONITOR_SRC, ctx, { filename: 'error-monitor.js' });
  const env = {
    ctx, posts, handlers, timers,
    fire(type, ev){ (handlers[type] || []).forEach(h => h(ev)); },
    err(message, extra){ env.fire('error', Object.assign({ message, filename: 'https://inglesconleo.com/app.js?v=1', lineno: 10, colno: 5, target: ctx,
      error: { name: 'TypeError', stack: 'TypeError: ' + message + '\n    at renderItem (https://inglesconleo.com/app.js?v=20261003n:123:45)\n    at https://inglesconleo.com/app.js:5:6\n    at foo (https://inglesconleo.com/error-monitor.js:1:1)' } }, extra || {})); },
    flush(){ let n = 0; while(timers.length && n++ < 200) timers.shift()(); },
    async settle(){ env.flush(); await new Promise(r => setImmediate(r)); env.flush(); await new Promise(r => setImmediate(r)); },
    reports(){ return posts.filter(p => p.url === SB + '/functions/v1/report-error'); },
    sent(){ return env.reports().map(p => JSON.parse(p.init.body)); },
  };
  return env;
}

const SECRETS = [
  'ana.perez@gmail.com', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.firmaSecreta99', 'abc123token', 'hunter2',
  '123e4567-e89b-12d3-a456-426614174000', '5512345678', 'respuesta privada del alumno', 'zzzzSECRETquery', 'sb_publishable_97pvm28aLA7UCqTNV6WRUg',
];
const DIRTY = 'Fallo con ana.perez@gmail.com token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.firmaSecreta99 Authorization: Bearer abc123token password=hunter2 '
  + 'user 123e4567-e89b-12d3-a456-426614174000 tel 5512345678 "respuesta privada del alumno que escribio en Writing hoy" '
  + 'https://x.supabase.co/rest/v1/profiles?email=eq.ana.perez@gmail.com&token=zzzzSECRETquery#access_token=zzzzSECRETquery sb_publishable_97pvm28aLA7UCqTNV6WRUg';

/* ---------------- 1. navegador: instalación y filtros ---------------- */
section('error-monitor.js: instalación');
test('solo funciona en inglesconleo.com: en localhost o github.io no instala nada', () => {
  for(const host of ['localhost', '127.0.0.1', 'fio42.github.io']){
    const env = makeEnv({ host });
    assert.strictEqual((env.handlers.error || []).length, 0, host);
    assert.strictEqual(env.ctx.fetch, env.ctx.__origFetch, 'no debe envolver fetch en ' + host);
  }
});
test('no se activa con bots ni navegadores automatizados', () => {
  assert.strictEqual((makeEnv({ webdriver: true }).handlers.error || []).length, 0);
  assert.strictEqual((makeEnv({ ua: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }).handlers.error || []).length, 0);
  assert.strictEqual((makeEnv({ ua: 'Mozilla/5.0 HeadlessChrome/120' }).handlers.error || []).length, 0);
});
test('no pisa window.onerror y no se instala dos veces', () => {
  const env = makeEnv();
  assert.strictEqual(env.ctx.onerror, undefined);
  vm.runInContext(MONITOR_SRC, env.ctx);
  assert.strictEqual(env.handlers.error.length, 1);
});

section('error-monitor.js: errores globales');
test('error de JS: manda tipo, página, mensaje, versión (?v= de app.js), navegador y plataforma', async () => {
  const env = makeEnv();
  env.err('x is not a function');
  await env.settle();
  assert.strictEqual(env.posts.length, 1);
  assert.strictEqual(env.posts[0].url, SB + '/functions/v1/report-error');
  const e = env.sent()[0];
  assert.strictEqual(e.kind, 'js_error'); assert.strictEqual(e.section, 'speaking');
  assert.strictEqual(e.message, 'x is not a function'); assert.strictEqual(e.release, '20261003n');
  assert.strictEqual(e.browser, 'Chrome 120'); assert.strictEqual(e.platform, 'Windows desktop'); assert.strictEqual(e.name, 'TypeError');
  assert.deepStrictEqual(e.stack, ['renderItem (app.js:123:45)', 'anon (app.js:5:6)']);   // sin rutas, sin query, sin el propio monitor
  assert.strictEqual(e.sample.online, true);
});
test('iPhone: Safari 17 / iOS 17 mobile', async () => {
  const env = makeEnv({ ua: IPHONE_UA });
  env.err('boom'); await env.settle();
  assert.strictEqual(env.sent()[0].browser, 'Safari 17'); assert.strictEqual(env.sent()[0].platform, 'iOS 17 mobile');
});
test('usa solo la primera carpeta como sección (glosario/...)', async () => {
  const env = makeEnv({ pathname: '/glosario/a-vs-an/index.html' });
  env.err('boom'); await env.settle();
  assert.strictEqual(env.sent()[0].section, 'glosario');
});
test('PRIVACIDAD: nada sensible sale en el envío (mensaje, stack ni nombre)', async () => {
  const env = makeEnv();
  env.err(DIRTY, { error: { name: 'TypeError', stack: 'TypeError: x\n    at fn (https://inglesconleo.com/app.js?token=zzzzSECRETquery&email=ana.perez@gmail.com:1:2)' } });
  env.fire('unhandledrejection', { reason: { name: 'Error', message: DIRTY, stack: 'Error: x\n    at f (https://inglesconleo.com/app.js?token=zzzzSECRETquery:1:2)' } });
  await env.settle();
  assert(env.posts.length >= 1);
  const wire = env.posts.map(p => p.init.body).join('\n');
  for(const s of SECRETS) assert(!wire.includes(s), 'se filtró: ' + s);
  assert(/\[email\]/.test(wire) && /\[jwt\]/.test(wire) && /\[id\]/.test(wire));
});
test('solo viaja una lista fija de campos y de banderas (nunca user_id, correo, respuestas)', async () => {
  const env = makeEnv({ local: { 'sb-iviksy-auth-token': '{"user":{"id":"u-1","email":"ana@mail.com"}}' } });
  env.ctx.__leoMemberVerified = true;
  env.err('boom'); await env.settle();
  const e = env.sent()[0];
  assert.deepStrictEqual(Object.keys(e).sort(), ['browser', 'code', 'kind', 'message', 'name', 'platform', 'release', 'sample', 'section', 'stack', 'v']);
  assert.deepStrictEqual(Object.keys(e.sample).sort(), ['logged_in', 'member', 'online']);
  assert.strictEqual(e.sample.logged_in, true); assert.strictEqual(e.sample.member, true);
  assert(!/u-1|ana@mail/.test(env.posts[0].init.body));
  assert.strictEqual(env.posts[0].init.credentials, 'omit');   // sin cookies
});
test('rechazos de promesa: Error, texto; un objeto NUNCA se serializa', async () => {
  const env = makeEnv();
  env.fire('unhandledrejection', { reason: { name: 'TypeError', message: 'p1 falla', stack: 'TypeError: p1 falla\n    at f (https://inglesconleo.com/app.js:1:1)' } });
  env.fire('unhandledrejection', { reason: 'texto suelto' });
  env.fire('unhandledrejection', { reason: { answer: 'mi respuesta privada', email: 'ana@mail.com' } });
  await env.settle();
  const wire = env.posts.map(p => p.init.body).join('');
  assert(!/respuesta privada|ana@mail/.test(wire));
  const msgs = env.sent().map(e => e.message);
  assert(msgs.includes('p1 falla') && msgs.includes('texto suelto') && msgs.includes('Non-Error rejection'));
  assert(env.sent().every(e => e.kind === 'promise'));
});
test('ruido que NO se reporta: ResizeObserver, Script error., extensiones, terceros, AbortError, sin internet', async () => {
  const env = makeEnv();
  env.err('ResizeObserver loop completed with undelivered notifications.');
  env.err('Script error.');
  env.err('algo', { filename: 'chrome-extension://abc/content.js' });
  env.err('algo2', { filename: 'https://www.googletagmanager.com/gtag/js', error: { name: 'Error', stack: '' } });
  env.err('algo3', { error: { name: 'Error', stack: 'Error: x\n    at f (moz-extension://abc/a.js:1:1)' } });
  env.fire('unhandledrejection', { reason: { name: 'AbortError', message: 'The user aborted a request.' } });
  env.fire('unhandledrejection', { reason: { name: 'NotAllowedError', message: 'play() not allowed' } });
  env.fire('unhandledrejection', { reason: new TypeError('Failed to fetch') });
  env.fire('unhandledrejection', { reason: 'rechazo de texto sin stack' });
  env.fire('unhandledrejection', { reason: { name: 'Error', message: 'node', stack: 'Error: node\n    at x (/usr/lib/node.js:1:1)' } });
  env.fire('unhandledrejection', { reason: { name: 'Error', message: 'tercero', stack: 'Error: tercero\n    at a (https://otro.com/x.js:1:1)' } });
  await env.settle();
  assert.strictEqual(env.posts.length, 1, 'solo el rechazo de texto (sin stack) pasa: ' + JSON.stringify(env.sent().map(e => e.message)));
  assert.strictEqual(env.sent()[0].message, 'rechazo de texto sin stack');
});
test('recursos rotos: solo archivos propios (ruta sin query), con conexión, y no el propio monitor', async () => {
  const mk = (tag, src, extra) => Object.assign({ target: Object.assign({ tagName: tag, src, currentSrc: src }, extra || {}) });
  let env = makeEnv();
  env.fire('error', mk('IMG', 'https://inglesconleo.com/leo-front.png?v=99&email=ana@mail.com'));
  env.fire('error', mk('AUDIO', 'https://inglesconleo.com/audio/a1/a1listening-001.mp3'));
  env.fire('error', mk('IMG', 'https://tercero.com/foto.png'));
  env.fire('error', mk('LINK', 'https://inglesconleo.com/x.ico', { rel: 'icon' }));
  env.fire('error', mk('LINK', 'https://inglesconleo.com/style.css', { rel: 'stylesheet' }));
  env.fire('error', mk('SCRIPT', 'https://inglesconleo.com/error-monitor.js?v=1'));
  env.fire('error', mk('DIV', 'https://inglesconleo.com/x'));
  await env.settle();
  const m = env.sent().map(e => e.message);
  assert.deepStrictEqual(m.sort(), ['Resource failed: audio /audio/a1/a1listening-001.mp3', 'Resource failed: img /leo-front.png', 'Resource failed: link /style.css']);
  assert(env.sent().every(e => e.kind === 'resource' && e.code === 'load'));
  assert(!env.posts.map(p => p.init.body).join('').includes('ana@mail'));
  env = makeEnv({ onLine: false });
  env.fire('error', mk('IMG', 'https://inglesconleo.com/leo-front.png')); await env.settle();
  assert.strictEqual(env.posts.length, 0, 'sin internet no se reporta');
});

/* ---------------- 2. navegador: límites y anti-bucle ---------------- */
section('error-monitor.js: límites y anti-bucle');
test('el mismo error repetido se manda UNA vez por carga de página', async () => {
  const env = makeEnv();
  for(let i = 0; i < 50; i++) env.err('mismo error');
  await env.settle();
  assert.strictEqual(env.posts.length, 1);
});
test('máximo 10 reportes por carga de página y cola máxima de 5', async () => {
  const env = makeEnv();
  for(let i = 0; i < 40; i++) env.err('error distinto ' + String.fromCharCode(97 + (i % 26)) + i);
  assert(env.timers.length <= 1, 'un solo temporizador a la vez');
  await env.settle();
  assert.strictEqual(env.posts.length, 5, 'solo cupo para 5 en cola de una ráfaga');
  for(let i = 0; i < 40; i++){ env.err('otra tanda ' + i); await env.settle(); }
  assert.strictEqual(env.posts.length, 10);
});
test('tope por pestaña (30 en sessionStorage): al llegar, no manda nada', async () => {
  const env = makeEnv({ session: { leo_err_n: '30' } });
  env.err('boom'); await env.settle();
  assert.strictEqual(env.posts.length, 0);
  const env2 = makeEnv(); env2.err('a'); await env2.settle();
  assert.strictEqual(env2.ctx.sessionStorage._d.leo_err_n, '1');
});
test('separa los envíos (no se manda dentro de la misma llamada, sino por temporizador)', () => {
  const env = makeEnv();
  env.err('uno'); env.err('dos');
  assert.strictEqual(env.posts.length, 0, 'nada se manda sin pasar por el temporizador');
  assert.strictEqual(env.timers.length, 1);
});
test('ANTI-BUCLE: el envío usa el fetch ORIGINAL; el reporte nunca se observa a sí mismo', async () => {
  const env = makeEnv({ fetchResult: () => Promise.resolve({ status: 503 }) });   // el servidor de reportes falla
  env.err('boom'); await env.settle();
  assert.strictEqual(env.posts.length, 1);
  // el fetch envuelto tampoco reporta una llamada a report-error aunque se le pida
  await env.ctx.fetch(SB + '/functions/v1/report-error', { method: 'POST', body: JSON.stringify({ kind: 'manual' }) }).catch(() => {});
  await env.settle();
  assert.strictEqual(env.posts.length, 2, 'esa llamada manual se hizo, pero NO generó un evento nuevo');
  assert.strictEqual(env.sent().filter(e => e.kind === 'network').length, 0);
});
test('ANTI-BUCLE: tras 2 fallos seguidos del envío, el monitor se apaga solo', async () => {
  const env = makeEnv({ fetchResult: () => Promise.resolve({ status: 500 }) });
  env.err('uno'); await env.settle();
  env.err('dos'); await env.settle();
  env.err('tres'); await env.settle();
  env.err('cuatro'); await env.settle();
  assert.strictEqual(env.posts.length, 2, 'se apagó después del segundo fallo');
  const env2 = makeEnv({ fetchResult: () => Promise.reject(new TypeError('Failed to fetch')) });
  env2.err('uno'); await env2.settle(); env2.err('dos'); await env2.settle(); env2.err('tres'); await env2.settle();
  assert.strictEqual(env2.posts.length, 2);
});
test('un éxito reinicia el contador de fallos', async () => {
  let n = 0;
  const env = makeEnv({ fetchResult: () => Promise.resolve({ status: (++n % 2) ? 500 : 204 }) });
  for(let i = 0; i < 5; i++){ env.err('e' + i); await env.settle(); }
  assert.strictEqual(env.posts.length, 5);
});
test('ANTI-BUCLE: errores del propio monitor o de report-error se ignoran', async () => {
  const env = makeEnv();
  env.err('algo', { filename: 'https://inglesconleo.com/error-monitor.js?v=1' });
  env.err('fallo en report-error');
  env.err('LeoErrors se rompio');
  env.err('x', { error: { name: 'Error', stack: 'Error: x\n    at post (https://inglesconleo.com/error-monitor.js:80:5)' } });
  env.fire('unhandledrejection', { reason: { name: 'Error', message: 'x', stack: 'Error: x\n    at https://inglesconleo.com/error-monitor.js:9:9' } });
  env.fire('unhandledrejection', { reason: new Error('POST report-error 500') });
  await env.settle();
  assert.strictEqual(env.posts.length, 0);
});
test('ANTI-BUCLE: un error que ocurre MIENTRAS se envía no genera otro reporte (reentrada)', async () => {
  let env;
  env = makeEnv({ fetch: function(url, init){ env.posts.push({ url, init }); env.err('error dentro del envio'); return Promise.resolve({ status: 204 }); } });
  env.err('el primero'); await env.settle();
  assert.strictEqual(env.posts.length, 1);
});
test('el envío que lanza error síncrono no rompe nada y cuenta como fallo', async () => {
  const env = makeEnv({ fetch: function(){ throw new Error('fetch roto'); } });
  assert.doesNotThrow(() => { env.err('a'); env.flush(); env.err('b'); env.flush(); env.err('c'); env.flush(); });
});

/* ---------------- 3. navegador: fetch envuelto ---------------- */
section('error-monitor.js: fetch hacia Supabase');
test('5xx hacia Supabase se reporta (método + ruta, SIN query) con código http_5xx', async () => {
  const env = makeEnv({ fetchResult: url => Promise.resolve({ status: /leo-ai/.test(url) ? 503 : 204 }) });
  const r = await env.ctx.fetch(SB + '/functions/v1/leo-ai?token=zzzzSECRETquery', { method: 'post', body: '{"studentAnswer":"mi respuesta privada"}' });
  assert.strictEqual(r.status, 503);
  await env.settle();
  const net = env.sent().filter(e => e.kind === 'network');
  assert.strictEqual(net.length, 1);
  assert.strictEqual(net[0].message, 'HTTP 503 POST /functions/v1/leo-ai'); assert.strictEqual(net[0].code, 'http_503');
  assert.strictEqual(net[0].sample.status, 503); assert.strictEqual(net[0].sample.method, 'POST');
  const wire = env.reports().map(p => p.init.body).join('');
  assert(!/zzzzSECRETquery|respuesta privada/.test(wire), 'ni la query ni el cuerpo de la petición viajan');
});
test('4xx (login incorrecto, límite diario, no encontrado) NO se reportan', async () => {
  for(const status of [400, 401, 403, 404, 409, 422, 429]){
    const env = makeEnv({ fetchResult: () => Promise.resolve({ status }) });
    await env.ctx.fetch(SB + '/auth/v1/token', { method: 'POST' }); await env.settle();
    assert.strictEqual(env.posts.length, 1, 'solo la propia petición, status ' + status);
  }
});
test('llamadas a otros sitios (Stripe, GTM, el propio sitio) no se observan aunque den 500', async () => {
  const env = makeEnv({ fetchResult: () => Promise.resolve({ status: 500 }) });
  await env.ctx.fetch('https://api.stripe.com/v1/x'); await env.ctx.fetch('https://inglesconleo.com/data.js');
  await env.settle();
  assert.strictEqual(env.posts.length, 2);
});
test('caída de red (TypeError) hacia Supabase: kind network, código network; con AbortError o sin internet NO', async () => {
  let env = makeEnv({ fetchResult: () => Promise.reject(new TypeError('Failed to fetch')) });
  await assert.rejects(env.ctx.fetch(SB + '/rest/v1/profiles?id=eq.123', { method: 'GET' }), /Failed to fetch/);
  await env.settle();
  const net = env.sent().filter(e => e.kind === 'network');
  assert.strictEqual(net.length, 1); assert.strictEqual(net[0].code, 'network'); assert.strictEqual(net[0].message, 'Network error GET /rest/v1/profiles');
  const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
  env = makeEnv({ fetchResult: () => Promise.reject(abort) });
  await assert.rejects(env.ctx.fetch(SB + '/functions/v1/leo-ai', { method: 'POST' })); await env.settle();
  assert.strictEqual(env.posts.length, 1);
  env = makeEnv({ onLine: false, fetchResult: () => Promise.reject(new TypeError('Failed to fetch')) });
  await assert.rejects(env.ctx.fetch(SB + '/functions/v1/leo-ai', { method: 'POST' })); await env.settle();
  assert.strictEqual(env.posts.length, 1);
});
test('FAIL-SAFE: el fetch envuelto devuelve el MISMO promise, la misma respuesta y el mismo error', async () => {
  const resp = { status: 200, marca: 'x' }, err = new TypeError('Failed to fetch');
  let p1, p2;
  const env = makeEnv({ fetchResult: url => (p1 = /ok/.test(url) ? Promise.resolve(resp) : Promise.reject(err)) });
  p2 = env.ctx.fetch(SB + '/rest/v1/ok'); assert.strictEqual(p2, p1);
  assert.strictEqual(await p2, resp);
  const p3 = env.ctx.fetch(SB + '/rest/v1/falla');
  await assert.rejects(p3, e => e === err);
});
test('FAIL-SAFE: si fetch lanza al instante, lanza igual que sin monitor; entradas raras no rompen', () => {
  const boom = new Error('invalid url');
  const env = makeEnv({ fetch: function(){ throw boom; } });
  assert.throws(() => env.ctx.fetch('x'), e => e === boom);
  const env2 = makeEnv();
  for(const input of [undefined, null, 42, {}, { url: 5 }, new URL(SB + '/functions/v1/x'), { url: SB + '/a', method: 'PUT' }]){
    assert.doesNotThrow(() => env2.ctx.fetch(input));
  }
});
test('FAIL-SAFE: la carga del monitor nunca lanza, ni sin navegador ni con storage/addEventListener rotos', () => {
  assert.doesNotThrow(() => vm.runInContext(MONITOR_SRC, vm.createContext({})));
  assert.doesNotThrow(() => vm.runInContext(MONITOR_SRC, vm.createContext({ window: {}, location: { hostname: 'inglesconleo.com' }, navigator: {} })));
  const ctx = vm.createContext({ location: { hostname: 'inglesconleo.com', host: 'inglesconleo.com', pathname: '/' }, navigator: { userAgent: CHROME_UA }, fetch(){}, addEventListener(){ throw new Error('roto'); } });
  ctx.window = ctx;
  assert.doesNotThrow(() => vm.runInContext(MONITOR_SRC, ctx));
});
test('FAIL-SAFE: con localStorage/sessionStorage bloqueados igual reporta', async () => {
  const env = makeEnv({ storageThrows: true });
  env.err('boom'); await env.settle();
  assert.strictEqual(env.posts.length, 1);
  assert.strictEqual(env.sent()[0].sample.logged_in, false);
});
test('FAIL-SAFE: un handler que revienta por dentro no lanza hacia la página', () => {
  const env = makeEnv();
  assert.doesNotThrow(() => env.fire('error', null));
  assert.doesNotThrow(() => env.fire('error', { target: { tagName: 'IMG', get src(){ throw new Error('x'); } } }));
  assert.doesNotThrow(() => env.fire('unhandledrejection', { get reason(){ throw new Error('x'); } }));
});
test('LeoErrors.report: API para errores controlados, también limpia y respeta el interruptor', async () => {
  const env = makeEnv();
  env.ctx.LeoErrors.report('leo_ai', 'fallo para ana@mail.com', { code: 'timeout' });
  await env.settle();
  assert.strictEqual(env.sent()[0].message, 'fallo para [email]'); assert.strictEqual(env.sent()[0].kind, 'leo_ai'); assert.strictEqual(env.sent()[0].code, 'timeout');
  assert.doesNotThrow(() => env.ctx.LeoErrors.report());
});

/* ---------------- 4. las 54 páginas cargan el monitor primero ---------------- */
section('páginas HTML');
test('las 54 páginas cargan error-monitor.js UNA vez, en el <head> y como el PRIMER script ejecutable (antes de gtag, meta-pixel, inline, app.js, backend.js, supabase-js, Stripe)', () => {
  const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
  assert.strictEqual(pages.length, 54);
  for(const p of pages){
    const h = read(p);
    assert.strictEqual((h.match(/error-monitor\.js/g) || []).length, 1, p);
    const scripts = [...h.matchAll(/<script\b[^>]*>/g)].filter(m => !/ld\+json/.test(m[0]));   // el JSON-LD no ejecuta nada
    assert(scripts.length > 0, p);
    assert(/error-monitor\.js\?v=/.test(scripts[0][0]), p + ': el primer script ejecutable debe ser error-monitor.js, no ' + scripts[0][0].slice(0, 80));
    assert(scripts[0].index < h.indexOf('</head>'), p + ': debe estar dentro de <head>');
    assert(scripts.slice(1).every(m => !/error-monitor/.test(m[0])), p);
  }
});

/* ---------------- 5. report-error.ts (servidor) ---------------- */
function loadTs(file, extra){
  const src = read('supabase_functions/' + file).replace(/^import .*createClient.*$/m, '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const served = [];
  const ctx = Object.assign({
    exports: {}, console, crypto: globalThis.crypto, TextEncoder, Request, Response, URL, JSON, setTimeout, clearTimeout, AbortController, Promise,
    createClient: () => (extra && extra.supabase) || { rpc: async () => ({ data: null, error: null }) },
    Deno: { env: { get: k => (extra && extra.env && extra.env[k]) || '' }, serve: fn => { served.push(fn); } },
    fetch: (extra && extra.fetch) || (async () => ({ ok: true, status: 200, text: async () => '' })),
  }, extra && extra.ctx);
  vm.createContext(ctx);
  vm.runInContext(js, ctx, { filename: file });
  return { api: ctx.exports, served, ctx };
}
const RE = loadTs('report-error.ts').api;
section('report-error.ts');
test('PRIVACIDAD servidor: cleanText quita todo lo sensible', () => {
  const out = RE.cleanText(DIRTY, 1000);
  for(const s of SECRETS) assert(!out.includes(s), 'se filtró: ' + s);
  assert(RE.cleanText('x '.repeat(500), 300).length <= 300);
  assert.strictEqual(RE.cleanText("reading 'foo' of undefined"), "reading 'foo' of undefined", 'no destruye mensajes normales');
  assert.strictEqual(RE.cleanText(null), '');
});
test('PARIDAD: la limpieza del navegador y la del servidor dan EXACTAMENTE lo mismo', () => {
  const a = MONITOR_SRC.indexOf('function clean(s, max){'), b = MONITOR_SRC.indexOf('/* ---------- Contexto');
  const ctx = vm.createContext({}); vm.runInContext(MONITOR_SRC.slice(a, b) + ';this.clean = clean;', ctx);
  const corpus = [DIRTY, 'x is not a function', "Cannot read properties of undefined (reading 'value')", 'Bearer abc.def-123 y apikey=zzz', 'GET /rest/v1/p?select=*&id=eq.5 500',
    'tarjeta 4242 4242 4242 4242', 'a'.repeat(70), 'x  y\n z', 'sk_live_abc123 whsec_abc', 'Unexpected token < in JSON at position 0', '#fragmento y ?query', '', 'texto con "' + 'q'.repeat(60) + '" largo'];
  for(const c of corpus) assert.strictEqual(ctx.clean(c, 300), RE.cleanText(c, 300), 'difiere en: ' + c);
});
const FP = (k, s, m, c, st) => RE.fingerprint(k, s, m, c || '', st || '');
test('FINGERPRINT: estable ante ids, números, UUID y líneas de código; 32 hex', async () => {
  const a = await FP('js_error', 'speaking', 'Item 12 failed for 123e4567-e89b-12d3-a456-426614174000 at 0x1f', '', 'renderItem (app.js:123:45)');
  const b = await FP('js_error', 'speaking', 'Item 99 failed for aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee at 0x9', '', 'renderItem (app.js:900:1)');
  assert.strictEqual(a, b); assert(/^[0-9a-f]{32}$/.test(a));
  assert.strictEqual(await FP('js_error', 's', 'falla [email] en [num]'), await FP('js_error', 's', 'falla [email] en 5'), 'los marcadores de limpieza cuentan como "dato variable"');
});
test('FINGERPRINT: distingue tipo, página, código, propiedad concreta y función', async () => {
  const base = await FP('js_error', 'speaking', "Cannot read properties of null (reading 'value')", '', 'f (app.js:1:1)');
  assert.notStrictEqual(base, await FP('promise', 'speaking', "Cannot read properties of null (reading 'value')", '', 'f (app.js:1:1)'));
  assert.notStrictEqual(base, await FP('js_error', 'writing', "Cannot read properties of null (reading 'value')", '', 'f (app.js:1:1)'));
  assert.notStrictEqual(base, await FP('js_error', 'speaking', "Cannot read properties of null (reading 'name')", '', 'f (app.js:1:1)'));
  assert.notStrictEqual(base, await FP('js_error', 'speaking', "Cannot read properties of null (reading 'value')", '', 'g (app.js:1:1)'));
  assert.notStrictEqual(base, await FP('js_error', 'speaking', "Cannot read properties of null (reading 'value')", 'x', 'f (app.js:1:1)'));
  assert.notStrictEqual(await FP('network', 's', 'HTTP 503 POST /a', 'http_503'), await FP('network', 's', 'HTTP 503 POST /a', 'http_502'));
});
test('FINGERPRINT: la versión del sitio no entra (un despliegue no duplica el error)', async () => {
  assert.strictEqual(RE.fingerprint.length, 5, 'la función no recibe la release');
  assert.strictEqual(await FP('js_error', 's', 'm'), await FP('js_error', 's', 'm'));
});
test('SEVERIDAD: la decide el servidor; ningún tipo del navegador llega a critical', () => {
  for(const k of ['js_error', 'promise', 'resource', 'network', 'leo_ai', 'audio', 'auth', 'exercise', 'membership', 'other'])
    for(const c of ['', 'http_503', 'network', 'critical']) assert.notStrictEqual(RE.severityFor(k, c), 'critical');
  assert.strictEqual(RE.severityFor('network', 'network'), 'info'); assert.strictEqual(RE.severityFor('network', 'http_503'), 'warning');
  assert.strictEqual(RE.severityFor('js_error', ''), 'error'); assert.strictEqual(RE.severityFor('resource', 'load'), 'warning');
});
test('VALIDACIÓN: tipos de servidor no entran por la puerta pública; campos extra se descartan', () => {
  for(const kind of ['payment', 'webhook', 'edge_function', 'email', 'inventado', '', null, 5]) assert.strictEqual(RE.buildEvent({ kind, message: 'x' }), null, String(kind));
  assert.strictEqual(RE.buildEvent(null), null); assert.strictEqual(RE.buildEvent([]), null); assert.strictEqual(RE.buildEvent({ kind: 'js_error' }), null);
  const ev = RE.buildEvent({ kind: 'js_error', section: 'Speaking', message: 'boom', severity: 'critical', fingerprint: 'a'.repeat(32), user_id: 'u-1', email: 'ana@mail.com', answer: 'mi respuesta', token: 'abc',
    name: 'TypeError', stack: ['a (app.js:1:1)', 'b (app.js:2:2)', 'c (app.js:3:3)', 'd (app.js:4:4)'], release: '2026 10', browser: 'Chrome 120 <script>', platform: 'Windows desktop',
    sample: { online: true, logged_in: false, member: 'si', status: 503, method: 'POST', email: 'ana@mail.com', answer: 'x' } });
  assert.deepStrictEqual(Object.keys(ev).sort(), ['browser', 'code', 'kind', 'message', 'name', 'platform', 'release', 'sample', 'section', 'stack']);
  assert.strictEqual(ev.section, 'speaking'); assert.strictEqual(ev.release, null); assert.strictEqual(ev.stack.split('\n').length, 3);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(ev.sample)), { online: true, logged_in: false, status: 503, method: 'POST' });
  assert(!/[<>]/.test(ev.browser));
  assert.strictEqual(RE.buildEvent({ kind: 'js_error', section: '../../etc', message: 'x' }).section, 'unknown');
  assert.strictEqual(RE.buildEvent({ kind: 'js_error', message: 'ResizeObserver loop limit exceeded' }), null);
  assert.strictEqual(RE.buildEvent({ kind: 'js_error', message: 'x', stack: ['f (chrome-extension://abc/a.js:1:1)'] }), null);
});

function fakeRpc(opts){
  opts = opts || {};
  const calls = [], buckets = new Map();
  const rpc = async (name, args) => {
    calls.push({ name, args });
    if(opts.throwOn === name) throw new Error('rpc roto');
    if(opts.rejectOn === name) return { data: null, error: { message: 'db caida' } };
    if(name === 'err_rate_hit'){ const n = (buckets.get(args.p_bucket) || 0) + 1; buckets.set(args.p_bucket, n); return { data: n <= args.p_limit, error: null }; }
    return { data: { logged: true }, error: null };
  };
  return { rpc, calls, buckets, logs: () => calls.filter(c => c.name === 'log_app_error') };
}
const GOOD = { kind: 'js_error', section: 'speaking', message: 'x is not a function', name: 'TypeError', stack: ['f (app.js:1:1)'], release: '20261003n', browser: 'Chrome 120', platform: 'Windows desktop', sample: { online: true } };
const req = (body, o) => new Request('https://x.supabase.co/functions/v1/report-error', Object.assign({
  method: 'POST', headers: { origin: 'https://inglesconleo.com', 'content-type': 'text/plain', 'user-agent': CHROME_UA, 'x-forwarded-for': '203.0.113.7' },
  body: typeof body === 'string' ? body : JSON.stringify(body) }, o));
const run = (r, db) => RE.handleRequest(r, { rpc: db.rpc, salt: 'sal' });

test('SERVIDOR: caso feliz = 204, 1 límite + 1 registro con campos fijos, severidad del servidor, source client', async () => {
  const db = fakeRpc();
  const res = await run(req(Object.assign({ severity: 'critical', fingerprint: 'f'.repeat(32), user_id: 'u1', email: 'ana@mail.com' }, GOOD)), db);
  assert.strictEqual(res.status, 204); assert.strictEqual(await res.text(), '');
  assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://inglesconleo.com');
  assert.deepStrictEqual(db.calls.map(c => c.name), ['err_rate_hit', 'log_app_error']);
  const a = db.logs()[0].args;
  assert.deepStrictEqual(Object.keys(a).sort(), ['p_browser', 'p_code', 'p_error_name', 'p_fp', 'p_kind', 'p_message', 'p_platform', 'p_release', 'p_sample', 'p_section', 'p_severity', 'p_source', 'p_stack_top']);
  assert.strictEqual(a.p_source, 'client'); assert.strictEqual(a.p_severity, 'error'); assert.notStrictEqual(a.p_fp, 'f'.repeat(32)); assert(/^[0-9a-f]{32}$/.test(a.p_fp));
  assert(!JSON.stringify(a).includes('ana@mail') && !JSON.stringify(a).includes('u1'));
});
test('SERVIDOR: origen no permitido, método GET, bots, cuerpo grande o JSON roto = 204 sin tocar la base', async () => {
  const cases = [
    req(GOOD, { headers: { origin: 'https://malo.com', 'user-agent': CHROME_UA } }),
    req(GOOD, { headers: { 'user-agent': CHROME_UA } }),
    new Request('https://x.supabase.co/f', { method: 'GET', headers: { origin: 'https://inglesconleo.com' } }),
    req(GOOD, { headers: { origin: 'https://inglesconleo.com', 'user-agent': 'Googlebot/2.1' } }),
    req(GOOD, { headers: { origin: 'https://inglesconleo.com', 'user-agent': 'curl/8.0' } }),
    req(Object.assign({}, GOOD, { message: 'a'.repeat(5000) })),
  ];
  for(const r of cases){ const db = fakeRpc(); const res = await run(r, db); assert.strictEqual(res.status, 204); assert.strictEqual(db.logs().length, 0); }
  const db = fakeRpc(); assert.strictEqual((await run(req('{no es json'), db)).status, 204); assert.strictEqual(db.logs().length, 0);
});
test('SERVIDOR: el origen no permitido no recibe cabecera CORS', async () => {
  const res = await run(req(GOOD, { headers: { origin: 'https://malo.com', 'user-agent': CHROME_UA } }), fakeRpc());
  assert.strictEqual(res.headers.get('access-control-allow-origin'), null);
});
test('SUPLANTACIÓN: el endpoint público SIEMPRE manda source=client; no hay forma de pedir server, critical ni tipos de servidor', async () => {
  const attempts = [
    Object.assign({}, GOOD, { source: 'server', severity: 'critical', p_source: 'server', p_severity: 'critical' }),
    Object.assign({}, GOOD, { kind: 'leo_ai', section: 'leo-ai', code: 'exception', source: 'server', severity: 'critical' }),
    Object.assign({}, GOOD, { kind: 'payment', source: 'server' }),
    Object.assign({}, GOOD, { kind: 'webhook', section: 'stripe-webhook', source: 'server', severity: 'critical' }),
    Object.assign({}, GOOD, { kind: 'edge_function', source: 'server' }),
  ];
  for(const body of attempts){
    const db = fakeRpc(); await run(req(body), db);
    for(const c of db.logs()){
      assert.strictEqual(c.args.p_source, 'client'); assert.notStrictEqual(c.args.p_severity, 'critical');
      assert(!['payment', 'webhook', 'edge_function', 'email'].includes(c.args.p_kind));
    }
  }
  const src = read('supabase_functions/report-error.ts');
  assert.strictEqual((src.match(/p_source:/g) || []).length, 1); assert(/p_source: 'client'/.test(src));
  assert(!/p_source: (raw|ev|body)/.test(src), 'p_source nunca sale de datos del navegador');
});
test('SUPLANTACIÓN: solo las Edge Functions internas mandan source=server (con service_role); el navegador no tiene acceso a la RPC', () => {
  for(const f of ['leo-ai.ts', 'stripe-webhook.ts', 'paypal-webhook.ts', 'mp-webhook.ts']) assert(/p_source: 'server'/.test(read('supabase_functions/' + f)), f);
  const sql = read('supabase_functions/error-monitoring.sql');
  assert(/revoke all on function public\.log_app_error\([^)]*\) from public, anon, authenticated;/.test(sql));
  assert(/grant execute on function public\.log_app_error\([^)]*\) to service_role;/.test(sql));
  // ni backend.js ni app.js ni las páginas llaman a la RPC
  for(const f of ['backend.js', 'app.js', 'error-monitor.js']) assert(!/log_app_error/.test(read(f)), f);
  // presupuestos de correo separados por origen en la base
  assert(/mail_hour:' \|\| v_budget/.test(sql) && /'client' then 5 else 10/.test(sql) && /server_critical/.test(sql));
});
test('RATE LIMIT por IP: 30 por hora; el 31 se descarta; otra IP no se afecta; la IP no se guarda en claro', async () => {
  const db = fakeRpc();
  for(let i = 0; i < 40; i++) await run(req(Object.assign({}, GOOD, { message: 'error ' + i + 'x' })), db);
  assert.strictEqual(db.logs().length, 30);
  const other = await run(req(GOOD, { headers: { origin: 'https://inglesconleo.com', 'user-agent': CHROME_UA, 'x-forwarded-for': '198.51.100.9' } }), db);
  assert.strictEqual(other.status, 204); assert.strictEqual(db.logs().length, 31);
  const buckets = [...db.buckets.keys()];
  assert.strictEqual(buckets.length, 2);
  for(const b of buckets){ assert(/^ip:[0-9a-f]{24}$/.test(b), b); assert(!b.includes('203.0.113') && !b.includes('198.51')); }
  const limit = db.calls.find(c => c.name === 'err_rate_hit').args;
  assert.strictEqual(limit.p_limit, 30); assert.strictEqual(limit.p_window, 3600);
});
test('FAIL-SAFE servidor: si la base falla o lanza, igual 204 y no hay reintentos ni bucle', async () => {
  for(const o of [{ throwOn: 'log_app_error' }, { rejectOn: 'log_app_error' }, { throwOn: 'err_rate_hit' }, { rejectOn: 'err_rate_hit' }]){
    const db = fakeRpc(o); const before = console.error; let logged = 0; console.error = () => { logged++; };
    let res; try{ res = await run(req(GOOD), db); } finally { console.error = before; }
    assert.strictEqual(res.status, 204);
    assert(db.calls.length <= 2, 'sin reintentos: ' + db.calls.length);
    assert(db.calls.every(c => c.args.p_source !== 'server'), 'jamás se reporta a sí mismo como error de servidor');
    assert(db.calls.filter(c => c.name === 'log_app_error').length <= 1);
  }
});
test('el endpoint público se despliega sin JWT pero solo acepta POST del sitio (Deno.serve registrado)', () => {
  const { served } = loadTs('report-error.ts'); assert.strictEqual(served.length, 1);
});

/* ---------------- 6. error-alert.ts ---------------- */
section('error-alert.ts');
async function alertEnv(opts){
  opts = opts || {};
  const mails = [];
  const sb = {
    rpc: async (name, args) => name === 'internal_secret_ok' ? { data: opts.secretOk !== false && args.p_secret === 'buena', error: null } : { data: opts.digest || null, error: null },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: opts.row === undefined ? ROW : opts.row, error: null }) }) }) }),
  };
  const m = loadTs('error-alert.ts', { supabase: sb, env: { RESEND_API_KEY: 're_x' }, fetch: async (url, init) => { mails.push({ url, body: JSON.parse(init.body) }); return { ok: true, status: 200, text: async () => '' }; } });
  return { m, mails, call: (body, secret) => m.api.handle(new Request('https://x/f', { method: 'POST', headers: secret === undefined ? {} : { 'x-internal-secret': secret }, body: JSON.stringify(body) })) };
}
const ROW = { id: 7, kind: 'js_error', source: 'client', severity: 'error', section: 'speaking', message: 'boom <img src=x onerror=alert(1)>', error_name: 'TypeError', stack_top: 'f (app.js:1:1)', code: null,
  browsers: { 'Chrome 120': 3 }, platforms: { 'Windows desktop': 3 }, sample: { online: true }, first_release: '1', last_release: '2', count: 3, first_seen: '2026-10-03T14:00:00Z', last_seen: '2026-10-03T15:00:00Z' };
test('ALERTA: sin la llave interna = 401 y NO se manda correo', async () => {
  const e = await alertEnv();
  for(const secret of [undefined, '', 'mala']){ const r = await e.call({ event: 'alert', error_id: 7 }, secret); assert.strictEqual(r.status, 401); }
  assert.strictEqual(e.mails.length, 0);
});
test('ALERTA: con llave manda UN correo a inglesconleoreal@gmail.com, con el HTML escapado y asunto con prefijo', async () => {
  const e = await alertEnv();
  const r = await e.call({ event: 'alert', error_id: 7, reason: 'new' }, 'buena');
  assert.strictEqual(r.status, 200); assert.strictEqual(e.mails.length, 1);
  const mail = e.mails[0];
  assert.strictEqual(mail.url, 'https://api.resend.com/emails'); assert.deepStrictEqual(mail.body.to, ['inglesconleoreal@gmail.com']);
  assert(/^\[Leo ERROR\]\[speaking\] TypeError: boom/.test(mail.body.subject) && /\(nuevo\)$/.test(mail.body.subject), mail.body.subject);
  assert(!/<img src=x/.test(mail.body.html) && /&lt;img/.test(mail.body.html));
  assert(!/\n/.test(mail.body.subject));
});
test('ALERTA: id inválido, error inexistente o evento raro no mandan nada', async () => {
  let e = await alertEnv(); assert.strictEqual((await e.call({ event: 'alert', error_id: 'x' }, 'buena')).status, 400);
  assert.strictEqual((await e.call({ event: 'otra' }, 'buena')).status, 400); assert.strictEqual(e.mails.length, 0);
  e = await alertEnv({ row: null }); assert.strictEqual((await e.call({ event: 'alert', error_id: 9 }, 'buena')).status, 404); assert.strictEqual(e.mails.length, 0);
});
test('RESUMEN: solo manda si hubo algo; el asunto marca los avisos suprimidos', async () => {
  let e = await alertEnv({ digest: { events_24h: 0, suppressed_alerts: 0, top: [] } });
  let r = await (await e.call({ event: 'digest' }, 'buena')).json(); assert.strictEqual(r.sent, false); assert.strictEqual(e.mails.length, 0);
  e = await alertEnv({ digest: { events_24h: 12, distinct_24h: 3, new_24h: 2, open_total: 5, suppressed_alerts: 4, top: [{ id: 1, severity: 'error', kind: 'js_error', section: 'speaking', message: '<b>x</b>', n24: 9, count: 20, status: 'open' }] } });
  r = await (await e.call({ event: 'digest' }, 'buena')).json(); assert.strictEqual(r.sent, true);
  assert.strictEqual(e.mails.length, 1); assert(/\[Leo RESUMEN\] 12 errores en 24 h, 2 nuevos \(\+4 avisos suprimidos\)/.test(e.mails[0].body.subject));
  assert(!/<b>x<\/b>/.test(e.mails[0].body.html));
});
test('FAIL-SAFE: Resend caído o base lanzando no tumba la función ni se registra a sí misma', async () => {
  const sb = { rpc: async () => { throw new Error('db'); }, from: () => { throw new Error('db'); } };
  const m = loadTs('error-alert.ts', { supabase: sb, env: {}, fetch: async () => { throw new Error('red'); } });
  const before = console.error; console.error = () => {};
  try{ const r = await m.api.handle(new Request('https://x/f', { method: 'POST', headers: { 'x-internal-secret': 'buena' }, body: '{}' })); assert.strictEqual(r.status, 500); }
  finally { console.error = before; }
  const e = await alertEnv();
  const m2 = loadTs('error-alert.ts', { supabase: { rpc: async (n) => ({ data: n === 'internal_secret_ok' ? true : null }), from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: ROW }) }) }) }) }, env: {}, fetch: async () => { throw new Error('red'); } });
  console.error = () => {};
  try{ const r = await m2.api.handle(new Request('https://x/f', { method: 'POST', headers: { 'x-internal-secret': 'buena' }, body: JSON.stringify({ event: 'alert', error_id: 7 }) })); assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).ok, false); }
  finally { console.error = before; }
});

/* ---------------- 7. reportServerError() de leo-ai y los 3 webhooks ---------------- */
section('reportServerError (leo-ai y webhooks de pago)');
const FILES = ['leo-ai.ts', 'stripe-webhook.ts', 'paypal-webhook.ts', 'mp-webhook.ts'];
function loadHelper(file, supabase){
  const src = read('supabase_functions/' + file);
  const a = src.indexOf('async function reportServerError'), end = src.indexOf('\n}\n', a) + 3;
  assert(a > 0 && end > a, file + ': no se encontró el helper');
  const js = ts.transpileModule(src.slice(a, end), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
  const ctx = vm.createContext({ supabase, crypto: globalThis.crypto, TextEncoder, Promise, setTimeout, clearTimeout, Array, Uint8Array });
  vm.runInContext(js + ';this.f = reportServerError;', ctx);
  return ctx.f;
}
for(const file of FILES){
  test(file + ': el helper manda campos fijos, source server y el MISMO fingerprint aunque cambien números', async () => {
    const calls = []; const f = loadHelper(file, { rpc: async (n, a) => { calls.push({ n, a }); return { data: { logged: true } }; } });
    await f('payment', 'x-hook', 'Fallo 12 con 123e4567-e89b-12d3-a456-426614174000', 'activate_23505', 'critical');
    await f('payment', 'x-hook', 'Fallo 99 con aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'activate_23505', 'critical');
    assert.strictEqual(calls.length, 2); assert.strictEqual(calls[0].n, 'log_app_error');
    assert.strictEqual(calls[0].a.p_source, 'server'); assert.strictEqual(calls[0].a.p_severity, 'critical'); assert(/^[0-9a-f]{32}$/.test(calls[0].a.p_fp));
    assert.strictEqual(calls[0].a.p_fp, calls[1].a.p_fp);
    for(const k of ['p_error_name', 'p_stack_top', 'p_release', 'p_browser', 'p_platform', 'p_sample']) assert.strictEqual(calls[0].a[k], null);
  });
  test(file + ': FAIL-SAFE si la base lanza, rechaza o devuelve error, el helper termina y no lanza', async () => {
    for(const sb of [{ rpc: () => { throw new Error('sync'); } }, { rpc: () => Promise.reject(new Error('async')) }, { rpc: async () => ({ error: { message: 'x' } }) }, {}, null]){
      const f = loadHelper(file, sb); await assert.doesNotReject(f('payment', 's', 'm', 'c', 'critical'));
    }
  });
}
test('FAIL-SAFE: si la base se CUELGA, el helper suelta el flujo en ~2 s (no bloquea pagos ni Leo AI)', async () => {
  const f = loadHelper('stripe-webhook.ts', { rpc: () => new Promise(() => {}) });
  const t = Date.now(); await f('payment', 's', 'm', 'c', 'critical'); const dt = Date.now() - t;
  assert(dt >= 1900 && dt < 3000, 'tardó ' + dt + ' ms');
});
test('leo-ai: solo se reportan fallos ANORMALES (no límite diario, tope global ni reintentos en curso)', () => {
  const src = read('supabase_functions/leo-ai.ts');
  const m = src.match(/const REPORTABLE_FAILURES[^=]*= \{([^}]*)\}/); assert(m);
  const keys = m[1].split(',').map(s => s.split(':')[0].trim()).sort();
  assert.deepStrictEqual(keys, ['bad_output', 'network', 'provider_error', 'quota', 'timeout']);
  for(const k of ['daily_limit', 'busy', 'in_progress', 'retries_exhausted', 'disabled', 'no_session']) assert(!keys.includes(k));
});
test('pagos: activar miembro fallido = critical; firma inválida = solo warning; sin tocar la respuesta 200/400 a los proveedores', () => {
  for(const f of ['stripe-webhook.ts', 'paypal-webhook.ts', 'mp-webhook.ts']){
    const s = read('supabase_functions/' + f);
    assert(/reportServerError\('payment', '[a-z-]+', 'Error activando miembro tras un pago', 'activate_' \+ \(error\.code \|\| 'db'\), 'critical'\)/.test(s), f);
    assert(/reportServerError\('payment', '[a-z-]+', 'Excepcion no controlada: ' \+ String\(\(e as Error\)\?\.message \?\? e\)\.slice\(0, 150\), 'exception', 'critical'\)\s+return new Response\('ok', \{ status: 200 \}\)/.test(s), f + ' catch externo');
  }
  assert(/'bad_signature', 'warning'\)\s+return new Response\('invalid signature', \{ status: 400 \}\)/.test(read('supabase_functions/stripe-webhook.ts')));
  assert(/'bad_signature', 'warning'\)\s+return new Response\('invalid signature', \{ status: 400 \}\)/.test(read('supabase_functions/paypal-webhook.ts')));
});

/* ---------------- ejecutar ---------------- */
(async () => {
  for(const t of queueTests){
    if(t.heading){ console.log(t.heading); continue; }
    try{ await t.fn(); ok++; console.log('  ok  ' + t.name); }
    catch(e){ bad++; console.log('  FAIL ' + t.name + '\n       ' + String(e && e.message || e).split('\n')[0]); }
  }
  console.log('\n' + ok + ' pruebas pasaron' + (bad ? ' (hay fallas: ' + bad + ')' : ''));
  process.exit(bad ? 1 : 0);
})();
