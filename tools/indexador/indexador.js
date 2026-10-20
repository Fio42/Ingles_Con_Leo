#!/usr/bin/env node
'use strict';
/*
  Robot de indexacion de inglesconleo.com.
  Lee el sitemap, inspecciona cada URL en Google Search Console con tu sesion de Google
  (perfil de Chrome persistente) y, si la URL no esta indexada, pulsa "Solicitar indexacion".
  Solo marca una URL como solicitada cuando Google muestra su confirmacion en pantalla.

  Uso:
    node indexador.js                 ejecucion normal (la que lanza el Programador de tareas)
    node indexador.js --prueba        inspecciona 1 URL SIN pulsar el boton (para comprobar que todo funciona)
    node indexador.js --estado        muestra el resumen de la cola
    node indexador.js --sincronizar   solo actualiza la cola desde el sitemap, sin abrir el navegador
    node indexador.js --reanudar      quita la pausa por CAPTCHA / sesion caducada
  Salida: 0 bien, 2 detenido por CAPTCHA / verificacion / sesion caducada, 3 no se pudo abrir el navegador, 1 error.
*/
const fs = require('fs');
const path = require('path');
const U = require('./lib/util');
const Cola = require('./lib/cola');
const { leerUrls } = require('./lib/sitemap');
const { Alerta, avisar, limpiarAlerta } = require('./lib/alertas');
const { Gsc } = require('./lib/gsc');
const nav = require('./lib/navegador');

function argumentos(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) { const k = t.slice(2); if (argv[i + 1] && !argv[i + 1].startsWith('--') && ['url', 'max-solicitudes'].includes(k)) a[k] = argv[++i]; else a[k] = true; }
  }
  return a;
}

function bloquear(datos) {
  const f = path.join(datos, 'ejecutando.lock');
  try {
    const l = U.leerJSON(f, null);
    if (l && Date.now() - l.ts < 3 * 3600e3) {
      let vivo = true; try { process.kill(l.pid, 0); } catch (e) { vivo = e.code === 'EPERM'; }
      if (vivo) return false;
    }
  } catch (e) {}
  fs.writeFileSync(f, JSON.stringify({ pid: process.pid, ts: Date.now() }));
  return true;
}
function liberar(datos) { try { fs.unlinkSync(path.join(datos, 'ejecutando.lock')); } catch (e) {} }

async function sincronizarSitemap(cola, cfg, datos) {
  try {
    const urls = await leerUrls(cfg.sitemap, cfg.sitio);
    if (!urls.length) throw new Error('El sitemap no devolvio ninguna URL');
    const r = Cola.sincronizar(cola, urls);
    U.registrar(datos, '-', 'sitemap', 'ok', `${urls.length} URLs, ${r.nuevas} nuevas, ${r.quitadas} quitadas`);
    return true;
  } catch (e) {
    U.registrar(datos, '-', 'sitemap', 'error', e.message + ' (se sigue con la cola guardada)');
    return false;
  }
}

// Si una ejecucion anterior se corto justo mientras pulsaba el boton, no sabemos si Google la acepto.
function recuperarInterrumpidas(cola, cfg, datos, ahora) {
  for (const [url, it] of Object.entries(cola.urls)) {
    if (it.enCurso) {
      it.estado = 'sin_confirmar';
      it.reintentoDesde = U.sumarDias(ahora, 2);
      delete it.enCurso;
      U.registrar(datos, url, 'recuperacion', 'sin_confirmar', 'Ejecucion anterior interrumpida durante la solicitud; no se repite antes de 2 dias');
    }
  }
}

async function detener(cola, cfg, datos, e) {
  const primera = !cola.detenido || cola.detenido.tipo !== e.tipo;
  cola.detenido = { tipo: e.tipo, desde: (cola.detenido && cola.detenido.desde) || new Date().toISOString(), mensaje: e.message, ultimoAviso: new Date().toISOString() };
  U.registrar(datos, '-', 'detenido', e.tipo, e.message);
  Cola.guardar(datos, cola);
  await avisar(datos, cfg, e.tipo, e.message);
  return primera;
}

async function principal(argv, opts = {}) {
  const args = argumentos(argv);
  const cfg = U.cargarConfig();
  const datos = U.asegurarCarpeta(U.carpetaDatos());
  const L = cfg.limites;
  const ahora = new Date();
  const cola = Cola.cargar(datos);

  if (args.estado) {
    const r = Cola.resumen(cola, cfg, ahora);
    console.log('Carpeta de datos:', datos);
    console.log('Resumen:', JSON.stringify(r));
    if (cola.detenido) console.log('DETENIDO por:', cola.detenido.tipo, '-', cola.detenido.mensaje);
    if (Cola.cuotaBloqueada(cola, ahora)) console.log('Limite de solicitudes de Google activo hasta', cola.cuota.bloqueadaHasta);
    return 0;
  }
  if (args.reanudar) {
    cola.detenido = null; Cola.guardar(datos, cola); limpiarAlerta(datos);
    console.log('Pausa quitada. La siguiente ejecucion volvera a trabajar.');
    return 0;
  }
  if (!bloquear(datos)) { console.log('Ya hay otra ejecucion en marcha. Salgo.'); return 0; }

  let codigo = 0, ctx = null;
  const cont = { inspecciones: 0, solicitudes: 0, indexadas: 0, rechazadas: 0, errores: 0 };
  try {
    if (!args.prueba) recuperarInterrumpidas(cola, cfg, datos, ahora);
    const sincOk = await sincronizarSitemap(cola, cfg, datos);
    Cola.guardar(datos, cola);
    if (args.sincronizar) return 0;

    if (cola.detenido && !args.prueba) {
      U.registrar(datos, '-', 'omitido', 'detenido', `Pausado por ${cola.detenido.tipo} desde ${cola.detenido.desde}. Resuelvelo con login.bat.`);
      const ult = new Date(cola.detenido.ultimoAviso || 0);
      if (Date.now() - ult.getTime() > 24 * 3600e3) { cola.detenido.ultimoAviso = new Date().toISOString(); Cola.guardar(datos, cola); await avisar(datos, cfg, cola.detenido.tipo, 'Sigo pausado: ' + cola.detenido.mensaje); }
      return 2;
    }
    if (Cola.cuotaBloqueada(cola, ahora) && !args.prueba) {
      U.registrar(datos, '-', 'omitido', 'limite_cuota', `Limite de Google activo hasta ${U.fechaLocal(new Date(cola.cuota.bloqueadaHasta))}; no envio nada`);
      return 0;
    }

    let trabajo = Cola.pendientes(cola, cfg, ahora);
    if (args.url) trabajo = [{ url: args.url, it: cola.urls[args.url] || { estado: 'nueva', solicitudes: 0, fallos: 0 } }];
    if (args.prueba) trabajo = trabajo.slice(0, 1);
    if (!trabajo.length) { U.registrar(datos, '-', 'ejecucion', 'nada_que_hacer', JSON.stringify(Cola.resumen(cola, cfg, ahora))); return 0; }

    console.log('Abriendo Chrome (si ves una ventana minimizada en la barra de tareas, es el robot)...');
    try { ctx = await nav.abrir(cfg, datos); } catch (e) {
      const enUso = /already in use|ProcessSingleton|user data directory|Target page, context or browser has been closed/i.test(e.message);
      const al = new Alerta(enUso ? 'perfil_en_uso' : 'navegador', 'No se pudo abrir Chrome: ' + e.message.split('\n')[0]);
      U.registrar(datos, '-', 'navegador', 'error', al.message);
      await avisar(datos, cfg, al.tipo, al.message);
      return 3;
    }
    const gsc = new Gsc({ ctx, cfg, datos, propiedadInicial: cola.propiedad });
    await gsc.iniciar();
    const maxSol = args['max-solicitudes'] ? parseInt(args['max-solicitudes'], 10) : L.solicitudesPorEjecucion;

    for (const { url, it } of trabajo) {
      if (cont.inspecciones >= L.inspeccionesPorEjecucion || cont.solicitudes >= maxSol) break;
      if (cont.inspecciones > 0 && !args.prueba) await U.dormir(U.aleatorio(...L.esperaEntreUrlsSeg) * (opts.rapido ? 0 : 1000));
      const ins = await gsc.inspeccionar(url);
      cont.inspecciones++;
      cola.propiedad = gsc.propiedad;
      const ahoraUrl = new Date();
      it.ultimaInspeccion = ahoraUrl.toISOString();

      if (args.prueba) await gsc.capturaPrueba(url); // evidencia visual de lo que vio el robot
      if (ins.veredicto === 'indexada') {
        it.estado = 'indexada'; it.proximaRevision = U.sumarDias(ahoraUrl, L.reinspeccionIndexadasDias); it.fallos = 0; delete it.reintentoDesde;
        cont.indexadas++; U.registrar(datos, url, 'inspeccion', 'indexada', ins.detalle);
      } else if (ins.veredicto === 'no_indexada') {
        U.registrar(datos, url, 'inspeccion', 'no_indexada', ins.detalle);
        if (args.prueba) {
          const b = await gsc.hayBoton();
          U.registrar(datos, url, 'prueba', b ? 'boton_encontrado' : 'sin_boton', 'No se pulso nada (modo prueba)');
          await gsc.capturaPrueba(url);
          it.estado = it.estado || 'nueva';
          continue;
        }
        // Evitar duplicados: no repetir una solicitud reciente ni superar el maximo por URL
        const reciente = it.ultimaSolicitud && (ahoraUrl - new Date(it.ultimaSolicitud)) < L.noRepetirSolicitudDias * 86400e3;
        if (reciente || (it.solicitudes || 0) >= L.maxSolicitudesPorUrl) {
          if ((it.solicitudes || 0) >= L.maxSolicitudesPorUrl) { it.estado = 'revision_manual'; U.registrar(datos, url, 'solicitud', 'revision_manual', `Ya se pidio ${it.solicitudes} veces y sigue sin indexar`); }
          else { it.estado = 'solicitada'; it.proximaRevision = U.sumarDias(ahoraUrl, 7); U.registrar(datos, url, 'solicitud', 'omitida_duplicada', `Solicitada el ${U.fechaLocal(new Date(it.ultimaSolicitud))}; no se repite`); }
          Cola.guardar(datos, cola); continue;
        }
        it.estado = 'no_indexada';
        it.enCurso = { desde: ahoraUrl.toISOString() };
        Cola.guardar(datos, cola); // marca de seguridad antes de pulsar
        const r = await gsc.solicitar(url);
        delete it.enCurso;
        if (r.resultado === 'aceptada') {
          it.estado = 'solicitada'; it.solicitudes = (it.solicitudes || 0) + 1; it.ultimaSolicitud = new Date().toISOString();
          it.proximaRevision = U.sumarDias(new Date(), L.reinspeccionSolicitadasDias); it.fallos = 0; delete it.reintentoDesde;
          cont.solicitudes++; U.registrar(datos, url, 'solicitud', 'aceptada', r.detalle);
        } else if (r.resultado === 'limite_cuota') {
          cola.cuota = { bloqueadaHasta: U.sumarHoras(new Date(), L.enfriamientoCuotaHoras), ultimaDeteccion: new Date().toISOString() };
          U.registrar(datos, url, 'solicitud', 'limite_cuota', r.detalle);
          U.registrar(datos, '-', 'cuota', 'suspendido', `Envios suspendidos hasta ${U.fechaLocal(new Date(cola.cuota.bloqueadaHasta))}`);
          Cola.guardar(datos, cola); break;
        } else if (r.resultado === 'rechazada') {
          it.estado = 'rechazada'; it.fallos = (it.fallos || 0) + 1; it.reintentoDesde = U.sumarDias(new Date(), L.reintentoRechazoDias);
          cont.rechazadas++; U.registrar(datos, url, 'solicitud', 'rechazada', r.detalle);
        } else {
          it.estado = r.resultado === 'sin_boton' ? 'sin_boton' : 'sin_confirmar';
          it.fallos = (it.fallos || 0) + 1; it.reintentoDesde = U.sumarHoras(new Date(), L.reintentoErrorHoras * (r.resultado === 'sin_boton' ? 1 : 8));
          cont.errores++; U.registrar(datos, url, 'solicitud', r.resultado, r.detalle);
        }
      } else {
        it.fallos = (it.fallos || 0) + 1; cont.errores++;
        if (!args.prueba) { it.estado = 'error'; it.reintentoDesde = U.sumarHoras(ahoraUrl, L.reintentoErrorHoras); }
        U.registrar(datos, url, 'inspeccion', 'error', ins.detalle);
      }
      if ((it.fallos || 0) >= L.maxFallosPorUrl && !['indexada', 'solicitada', 'nueva'].includes(it.estado)) it.estado = 'revision_manual';
      if (!args.prueba) Cola.guardar(datos, cola);
    }
    if (!args.prueba) Cola.guardar(datos, cola);
    U.registrar(datos, '-', 'ejecucion', 'fin', JSON.stringify(cont) + ' ' + JSON.stringify(Cola.resumen(cola, cfg)));
  } catch (e) {
    if (e instanceof Alerta) { await detener(cola, cfg, datos, e); codigo = 2; }
    else { U.registrar(datos, '-', 'ejecucion', 'error_inesperado', e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e.message); try { Cola.guardar(datos, cola); } catch (_) {} codigo = 1; }
  } finally {
    if (ctx) { try { await ctx.close(); } catch (e) {} }
    liberar(datos);
  }
  return codigo;
}

module.exports = { principal, argumentos };
if (require.main === module) principal(process.argv.slice(2)).then(c => process.exit(c), e => { console.error(e); process.exit(1); });
