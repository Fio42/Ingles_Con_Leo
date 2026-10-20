'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { crear } = require('./mock-gsc');
const Cola = require('../lib/cola');
const { locs, leerUrls } = require('../lib/sitemap');
const { veredictoDeTexto, clasificarBloqueo } = require('../lib/gsc');

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const SITIO = 'https://inglesconleo.com';
const u = n => `${SITIO}/${n}`;

async function entorno(extraCfg = {}, urls = []) {
  const m = await crear();
  m.est.sitemap = urls;
  const datos = fs.mkdtempSync(path.join(os.tmpdir(), 'idx-'));
  const cfgPath = path.join(datos, 'cfg-test.json');
  const cfg = Object.assign({
    sitio: SITIO, sitemap: m.base + '/sitemap.xml', gscBase: m.base,
    propiedades: ["https://inglesconleo.com/", "sc-domain:inglesconleo.com"],
    navegador: { rutaEjecutable: CHROME, headless: true },
    limites: { esperaEntreUrlsSeg: [0, 0] }, tiempos: { inspeccionMs: 20000, solicitudMs: 20000, cargaMs: 20000 },
    prioridad: [], excluir: []
  }, extraCfg);
  fs.writeFileSync(cfgPath, JSON.stringify(cfg));
  const post = async o => fetch(m.base + '/__cfg', { method: 'POST', body: JSON.stringify(o) });
  const stats = async () => (await fetch(m.base + '/__stats')).json();
  const correr = (...args) => new Promise(resolve => {
    const p = spawn(process.execPath, [path.join(__dirname, '..', 'indexador.js'), ...args], {
      env: Object.assign({}, process.env, { INDEXADOR_DATOS: datos, INDEXADOR_CONFIG: cfgPath, NODE_PATH: process.env.NODE_PATH || '/opt/npm-tools/node_modules', NO_PROXY: '127.0.0.1' })
    });
    let stdout = '', stderr = '';
    p.stdout.on('data', d => stdout += d); p.stderr.on('data', d => stderr += d);
    const to = setTimeout(() => p.kill('SIGKILL'), 170000);
    p.on('close', status => { clearTimeout(to); resolve({ status, stdout, stderr }); });
  });
  const cola = () => Cola.cargar(datos);
  const registro = () => { try { return fs.readFileSync(path.join(datos, 'registro.csv'), 'utf8'); } catch (e) { return ''; } };
  return { m, datos, post, stats, correr, cola, registro, cerrar: () => m.server.close() };
}

test('sitemap: parsea urlset, indice y filtra otros dominios', async () => {
  assert.deepStrictEqual(locs('<urlset><url><loc> https://a.com/x?a=1&amp;b=2 </loc></url></urlset>'), ['https://a.com/x?a=1&b=2']);
  const docs = {
    'https://inglesconleo.com/s.xml': '<sitemapindex><sitemap><loc>https://inglesconleo.com/s1.xml</loc></sitemap></sitemapindex>',
    'https://inglesconleo.com/s1.xml': '<urlset><url><loc>https://inglesconleo.com/a</loc></url><url><loc>https://inglesconleo.com/a</loc></url><url><loc>https://otro.com/b</loc></url></urlset>'
  };
  assert.deepStrictEqual(await leerUrls('https://inglesconleo.com/s.xml', SITIO, async x => docs[x]), ['https://inglesconleo.com/a']);
});

test('veredicto y bloqueos se reconocen en espanol e ingles', () => {
  assert.strictEqual(veredictoDeTexto('xx La URL no está en Google yy'), 'no_indexada');
  assert.strictEqual(veredictoDeTexto('La URL está en Google, pero tiene problemas'), 'indexada');
  assert.strictEqual(veredictoDeTexto('URL is unknown to Google'), 'no_indexada');
  assert.strictEqual(veredictoDeTexto('URL is on Google'), 'indexada');
  assert.strictEqual(veredictoDeTexto('nada'), null);
  assert.strictEqual(clasificarBloqueo({ url: 'https://www.google.com/sorry/index', texto: '' }), 'captcha');
  assert.strictEqual(clasificarBloqueo({ url: 'https://accounts.google.com/v3/signin/identifier', texto: 'Iniciar sesión' }), 'sesion_caducada');
  assert.strictEqual(clasificarBloqueo({ url: 'https://accounts.google.com/signin/v2/challenge/pwd', texto: '' }), 'verificacion');
  assert.strictEqual(clasificarBloqueo({ url: 'https://search.google.com/search-console', texto: 'Verifica que eres tú' }), 'verificacion');
  assert.strictEqual(clasificarBloqueo({ url: 'https://search.google.com/search-console', texto: 'Inspecciona cualquier URL' }), null);
});

test('cola: prioridad, exclusiones con fecha, reintentos y no duplicar', () => {
  const ahora = new Date('2026-10-20T12:00:00');
  const cfg = { prioridad: ['/p1'], excluir: [{ patron: '/x/', hasta: '2026-10-26', motivo: 'm' }, { patron: '/y/', hasta: null }] };
  const c = Cola.nuevaCola();
  Cola.sincronizar(c, [u('a'), u('p1'), u('x/1'), u('y/1'), u('b')], ahora);
  assert.deepStrictEqual(Cola.pendientes(c, cfg, ahora).map(e => e.url), [u('p1'), u('a'), u('b')]);
  assert.strictEqual(Cola.exclusion(u('x/1'), cfg, new Date('2026-10-27T00:00:00')), null);
  c.urls[u('a')].estado = 'solicitada'; c.urls[u('a')].proximaRevision = '2026-11-01T00:00:00Z';
  c.urls[u('b')].estado = 'no_indexada';
  assert.deepStrictEqual(Cola.pendientes(c, cfg, ahora).map(e => e.url), [u('p1'), u('b')]);
  c.urls[u('b')].estado = 'error'; c.urls[u('b')].reintentoDesde = '2026-10-21T00:00:00Z';
  assert.deepStrictEqual(Cola.pendientes(c, cfg, ahora).map(e => e.url), [u('p1')]);
  Cola.sincronizar(c, [u('p1')], ahora);
  assert.deepStrictEqual(Cola.pendientes(c, cfg, ahora).map(e => e.url), [u('p1')]);
});

test('flujo completo: pulsa el boton, confirma, registra y no duplica', async () => {
  const urls = ['a', 'b', 'c', 'd', 'e'].map(u);
  const t = await entorno({}, urls);
  await t.post({ indexadas: [u('a'), u('b')] });
  const r1 = await t.correr();
  assert.strictEqual(r1.status, 0, r1.stdout + r1.stderr);
  let s = await t.stats();
  assert.deepStrictEqual(s.aceptadas.sort(), [u('c'), u('d'), u('e')]);
  const c = t.cola();
  assert.strictEqual(c.urls[u('c')].estado, 'solicitada');
  assert.strictEqual(c.urls[u('a')].estado, 'indexada');
  assert.ok(c.urls[u('c')].ultimaSolicitud);
  assert.match(t.registro(), /fecha,url,accion,resultado,detalle/);
  assert.match(t.registro(), /c,solicitud,aceptada,Google confirmo/);
  const r2 = await t.correr();
  assert.strictEqual(r2.status, 0, r2.stdout + r2.stderr);
  s = await t.stats();
  assert.strictEqual(s.solicitudes.length, 3, 'no debe repetir solicitudes');
  assert.strictEqual(s.inspecciones, 5, 'tampoco re-inspecciona antes de tiempo');
  t.cerrar();
});

test('interfaz en ingles tambien funciona', async () => {
  const t = await entorno({}, [u('a')]);
  await t.post({ idioma: 'en' });
  const r = await t.correr();
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual((await t.stats()).aceptadas.length, 1);
  t.cerrar();
});

test('limite de cuota: suspende, no sigue y no abre el navegador hasta que pase el enfriamiento', async () => {
  const urls = ['a', 'b', 'c', 'd'].map(u);
  const t = await entorno({}, urls);
  await t.post({ limiteSolicitudes: 2 });
  const r1 = await t.correr();
  assert.strictEqual(r1.status, 0, r1.stdout + r1.stderr);
  let s = await t.stats();
  assert.deepStrictEqual(s.aceptadas, [u('a'), u('b')]);
  assert.strictEqual(s.solicitudes.length, 3, 'la 3a recibe el aviso de cuota y se para');
  let c = t.cola();
  assert.ok(new Date(c.cuota.bloqueadaHasta) > new Date());
  assert.strictEqual(c.urls[u('c')].estado, 'no_indexada', 'queda pendiente, no marcada como enviada');
  assert.strictEqual(c.urls[u('d')].estado, 'nueva');
  assert.match(t.registro(), /limite_cuota/);
  const antes = (await t.stats()).inspecciones;
  const r2 = await t.correr();
  assert.strictEqual(r2.status, 0);
  assert.strictEqual((await t.stats()).inspecciones, antes, 'suspendido: ni siquiera inspecciona');
  assert.match(t.registro(), /omitido,limite_cuota/);
  // pasa el enfriamiento y Google vuelve a aceptar
  c = t.cola(); c.cuota.bloqueadaHasta = new Date(Date.now() - 1000).toISOString(); Cola.guardar(t.datos, c);
  await t.post({ limiteSolicitudes: 'Infinity', solicitudes: [] });
  const r3 = await t.correr();
  assert.strictEqual(r3.status, 0, r3.stdout + r3.stderr);
  s = await t.stats();
  assert.ok(s.aceptadas.includes(u('c')) && s.aceptadas.includes(u('d')));
  assert.strictEqual(s.aceptadas.filter(x => x === u('a')).length, 1, 'a no se repite');
  t.cerrar();
});

test('CAPTCHA: se detiene, avisa, no reintenta ni evade, y se reanuda solo tras --reanudar', async () => {
  const t = await entorno({}, ['a', 'b', 'c'].map(u));
  await t.post({ captchaEnInspeccion: 2 });
  const r1 = await t.correr();
  assert.strictEqual(r1.status, 2, r1.stdout + r1.stderr);
  const c = t.cola();
  assert.strictEqual(c.detenido.tipo, 'captcha');
  assert.ok(fs.existsSync(path.join(t.datos, 'ALERTA.txt')));
  assert.match(fs.readFileSync(path.join(t.datos, 'ALERTA.txt'), 'utf8'), /login\.bat/);
  const antes = await t.stats();
  const r2 = await t.correr();
  assert.strictEqual(r2.status, 2);
  assert.deepStrictEqual(await t.stats(), antes, 'en pausa no toca Google');
  assert.strictEqual((await t.correr('--reanudar')).status, 0);
  assert.ok(!fs.existsSync(path.join(t.datos, 'ALERTA.txt')));
  await t.post({ captchaEnInspeccion: null });
  assert.strictEqual((await t.correr()).status, 0);
  assert.ok((await t.stats()).aceptadas.length >= 2);
  t.cerrar();
});

test('sesion caducada: se detiene con aviso', async () => {
  const t = await entorno({}, [u('a')]);
  await t.post({ sesionCaducada: true });
  const r = await t.correr();
  assert.strictEqual(r.status, 2, r.stdout + r.stderr);
  assert.strictEqual(t.cola().detenido.tipo, 'sesion_caducada');
  assert.strictEqual((await t.stats()).solicitudes.length, 0);
  t.cerrar();
});

test('propiedad: si la de dominio no tiene acceso usa la de prefijo de URL', async () => {
  const t = await entorno({}, [u('a')]);
  await t.post({ propiedadesSinAcceso: ['sc-domain:inglesconleo.com'] });
  const r = await t.correr();
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.strictEqual(t.cola().propiedad, 'https://inglesconleo.com/');
  assert.strictEqual((await t.stats()).aceptadas.length, 1);
  await t.post({ propiedadesSinAcceso: ['sc-domain:inglesconleo.com', 'https://inglesconleo.com/'] });
  const c = t.cola(); c.urls[u('a')].estado = 'nueva'; delete c.urls[u('a')].ultimaSolicitud; Cola.guardar(t.datos, c);
  assert.strictEqual((await t.correr()).status, 2);
  assert.strictEqual(t.cola().detenido.tipo, 'propiedad');
  t.cerrar();
});

test('rechazo y sin boton: no se marcan como enviadas', async () => {
  const t = await entorno({}, [u('a'), u('b'), u('c')]);
  await t.post({ rechazar: [u('a')], sinBoton: [u('b')] });
  const r = await t.correr();
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  const c = t.cola();
  assert.strictEqual(c.urls[u('a')].estado, 'rechazada');
  assert.strictEqual(c.urls[u('b')].estado, 'sin_boton');
  assert.strictEqual(c.urls[u('c')].estado, 'solicitada');
  t.cerrar();
});

test('exclusiones y prioridad se respetan; --prueba no pulsa nada', async () => {
  const t = await entorno({ prioridad: ['/z'], excluir: [{ patron: '/glosario/though/', hasta: '2099-01-01' }] }, [u('a'), u('glosario/though/'), u('z')]);
  const rp = await t.correr('--prueba');
  assert.strictEqual(rp.status, 0, rp.stdout + rp.stderr);
  assert.match(rp.stdout, /boton_encontrado/);
  assert.strictEqual((await t.stats()).solicitudes.length, 0);
  assert.match(t.registro(), /z,inspeccion/);
  const r = await t.correr();
  assert.strictEqual(r.status, 0);
  const s = await t.stats();
  assert.deepStrictEqual(s.solicitudes, [u('z'), u('a')]);
  t.cerrar();
});

test('ejecucion cortada durante una solicitud: no se repite a ciegas', async () => {
  const t = await entorno({}, [u('a')]);
  assert.strictEqual((await t.correr('--sincronizar')).status, 0);
  const c = t.cola(); c.urls[u('a')].enCurso = { desde: new Date().toISOString() }; c.urls[u('a')].estado = 'no_indexada'; Cola.guardar(t.datos, c);
  assert.strictEqual((await t.correr()).status, 0);
  assert.strictEqual((await t.stats()).solicitudes.length, 0);
  assert.strictEqual(t.cola().urls[u('a')].estado, 'sin_confirmar');
  t.cerrar();
});

test('sitemap caido: sigue con la cola guardada', async () => {
  const t = await entorno({}, [u('a')]);
  assert.strictEqual((await t.correr()).status, 0);
  await new Promise(r => t.m.server.close(r));
  const r = await t.correr();
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  assert.match(t.registro(), /sitemap,error/);
});
