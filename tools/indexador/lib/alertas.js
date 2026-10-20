'use strict';
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { fechaLocal } = require('./util');

class Alerta extends Error {
  constructor(tipo, mensaje) { super(mensaje); this.tipo = tipo; }
}

const TITULOS = {
  captcha: 'Google pide un CAPTCHA',
  verificacion: 'Google pide verificar tu identidad',
  sesion_caducada: 'La sesion de Google caduco',
  propiedad: 'No se pudo abrir la propiedad en Search Console',
  perfil_en_uso: 'El perfil del robot esta abierto en otro Chrome'
};
const PASOS = {
  captcha: 'Abre login.bat, resuelve la verificacion tu mismo en esa ventana, cierra Chrome y el robot se reanuda solo en la siguiente ejecucion.',
  verificacion: 'Abre login.bat, completa la verificacion tu mismo en esa ventana, cierra Chrome y el robot se reanuda solo en la siguiente ejecucion.',
  sesion_caducada: 'Abre login.bat, inicia sesion en Google en esa ventana, cierra Chrome y el robot se reanuda solo en la siguiente ejecucion.',
  propiedad: 'Revisa en config.json la lista "propiedades" y que la cuenta de Google sea propietaria de inglesconleo.com en Search Console. Luego ejecuta reanudar.bat.',
  perfil_en_uso: 'Cierra TODAS las ventanas de Chrome que abrio login.bat (comprueba la barra de tareas) y vuelve a ejecutar.'
};

function toastWindows(titulo, texto) {
  if (process.platform !== 'win32') return;
  const q = s => String(s).replace(/'/g, "''").replace(/[\r\n]+/g, ' ');
  const script = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$x = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$n = $x.GetElementsByTagName('text')
$n.Item(0).AppendChild($x.CreateTextNode('${q(titulo)}')) | Out-Null
$n.Item(1).AppendChild($x.CreateTextNode('${q(texto)}')) | Out-Null
$t = [Windows.UI.Notifications.ToastNotification]::new($x)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe').Show($t)`;
  try { execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true }, () => {}); } catch (e) { /* el aviso es de cortesia, el archivo ALERTA.txt es el respaldo */ }
}

async function ntfy(cfg, titulo, texto) {
  const tema = process.env.INDEXADOR_NTFY || (cfg.avisos && cfg.avisos.ntfyTema);
  if (!tema) return;
  try {
    await fetch('https://ntfy.sh/' + encodeURIComponent(tema), {
      method: 'POST', body: texto, headers: { Title: titulo.replace(/[^\x20-\x7E]/g, '') || 'Indexador', Priority: 'high', Tags: 'warning' },
      signal: AbortSignal.timeout(15000)
    });
  } catch (e) { /* sin red: no pasa nada */ }
}

// Avisa a Leo por todos los canales disponibles. Nunca lanza.
async function avisar(datos, cfg, tipo, mensaje) {
  const titulo = 'Indexador inglesconleo: ' + (TITULOS[tipo] || tipo);
  const paso = PASOS[tipo] || '';
  const texto = `${fechaLocal()}\n${titulo}\n\n${mensaje}\n\nQue hacer: ${paso}\n`;
  try { fs.writeFileSync(path.join(datos, 'ALERTA.txt'), texto); } catch (e) {}
  toastWindows(titulo, (TITULOS[tipo] || tipo) + '. ' + paso);
  await ntfy(cfg, titulo, mensaje + ' ' + paso);
}

function limpiarAlerta(datos) { try { fs.unlinkSync(path.join(datos, 'ALERTA.txt')); } catch (e) {} }

module.exports = { Alerta, avisar, limpiarAlerta, TITULOS, PASOS };
