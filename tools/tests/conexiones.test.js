#!/usr/bin/env node
/* Mapa de conexiones: el inventario y los documentos deben estar al dia con el codigo.
   Corre con:  node tools/tests/conexiones.test.js   (desde la carpeta inglesconLeo)
   Si falla porque algo quedo desactualizado:  node tools/conexiones/auditar.js --write  y se incluyen los archivos generados en el commit.
   Si falla por un enlace roto, una clase/ficha/curso inexistente o un destino dinamico desactualizado, el mensaje dice cual. */
const { spawnSync } = require('child_process');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const r = spawnSync(process.execPath, [path.join(root, 'tools', 'conexiones', 'auditar.js')], { cwd: root, encoding: 'utf8' });
if(r.status !== 0){ console.error(r.stdout + r.stderr); console.error('FALLA: conexiones'); process.exit(1); }
console.log('conexiones: inventario y mapa al dia, sin enlaces rotos');
