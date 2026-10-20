#!/usr/bin/env node
'use strict';
/*
  Inicio de sesion UNICO y manual. Abre un Chrome normal (sin automatizar) con el perfil del robot.
  Tu inicias sesion en Google y compruebas que ves Search Console. Al cerrar la ventana, la sesion queda
  guardada en el perfil (en tu PC, fuera del repositorio) y el robot la reutiliza.
  Tambien sirve para resolver una verificacion o CAPTCHA que Google haya pedido.
*/
const { spawn } = require('child_process');
const U = require('./lib/util');
const Cola = require('./lib/cola');
const { limpiarAlerta } = require('./lib/alertas');
const nav = require('./lib/navegador');

const cfg = U.cargarConfig();
const datos = U.asegurarCarpeta(U.carpetaDatos());
const chrome = nav.buscarChrome(cfg);
if (!chrome) { console.error('No encuentro Google Chrome. Instalalo o pon la ruta en config.local.json -> navegador.rutaEjecutable'); process.exit(1); }
const inicio = `${cfg.gscBase || 'https://search.google.com'}/search-console?resource_id=${encodeURIComponent(cfg.propiedades[0])}`;
console.log('Se abre Chrome. Inicia sesion en Google (la cuenta propietaria de inglesconleo.com) y comprueba que ves Search Console.');
console.log('Cuando termines, CIERRA TODAS las ventanas de Chrome que se abrieron (mira la barra de tareas). Perfil:', nav.perfilDir(datos));
const p = spawn(chrome, ['--user-data-dir=' + nav.perfilDir(datos), '--no-first-run', '--no-default-browser-check', inicio], { stdio: 'ignore' });
p.on('exit', () => {
  const cola = Cola.cargar(datos);
  cola.detenido = null; Cola.guardar(datos, cola); limpiarAlerta(datos);
  console.log('Listo. Sesion guardada. El robot se reanuda en la siguiente ejecucion.');
  process.exit(0);
});
