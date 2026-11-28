#!/usr/bin/env node
// Riso · batería local (sin red, sin costo): corre preguntas por el motor real con la IA simulada y cuenta, por separado,
// las preguntas EDUCATIVAS resueltas sin IA, las consultas del FILTRO (rechazadas o derivadas), la CONVERSACIÓN
// (saludos, identidad) y las que irían a la IA. Uso: node tools/tutor/bateria-local.js [piloto1|piloto2]
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..', '..');
const K = require(path.join(root, 'riso/tutor/conocimiento.js'));
const T = require(path.join(root, 'riso/tutor/riso-tutor.js'));

function preguntas(archivo, columna) {
  const md = fs.readFileSync(path.join(__dirname, archivo), 'utf8');
  if (columna) return md.split('\n').filter(l => /^\| \d+ \|/.test(l)).map(l => l.split('|')[2].trim());
  return md.split('\n').map(l => l.match(/^\d+\.\s+(.*)$/) || l.match(/→\s*\d+\.\s+(.*)$/)).filter(Boolean).map(m => m[1].trim())
    .concat([...md.matchAll(/\d+\. ([^→\n]+?) → \d+\. ([^\n]+)/g)].flatMap(m => [m[1].trim(), m[2].trim()]));
}
const cual = process.argv[2] || 'piloto2';
let lista;
if (cual === 'piloto1') {
  const md = fs.readFileSync(path.join(__dirname, 'piloto-preguntas.md'), 'utf8');
  lista = [];
  md.split('\n').forEach(l => {
    const par = l.match(/^\d+\.\s+(.+?)\s+→\s+\d+\.\s+(.+)$/);
    if (par) { lista.push(par[1], par[2]); return; }
    const m = l.match(/^\d+\.\s+(.+)$/); if (m) lista.push(m[1]);
  });
} else lista = preguntas('piloto2-preguntas.md', true);

(async () => {
  let t0 = 0, n = 0;
  T.CONFIG.cuotaDiaria.miembro = 1000; // solo en esta simulación local: el cupo real lo pone el servidor
  const tutor = T.crear({ conocimiento: K, plan: 'miembro', ahora: () => (t0 += 20000), generar: () => Promise.resolve({ texto: '(respuesta de la IA)' }) });
  const filas = [], cuenta = { educativa_sin_ia: 0, filtro: 0, conversacion: 0, ia: 0, aviso: 0 };
  for (const q0 of lista) {
    n++;
    const q = q0.replace(/^\(.*?\)\s*/, '');
    if (/^\(ejercicio/.test(q0)) { filas.push([n, q0, 'ejercicio (prueba en el navegador)', '']); cuenta.ia++; continue; }
    const r = await tutor.preguntar(q);
    const c = T.categoria(r); cuenta[c]++;
    filas.push([n, q, c, r.capa === 5 ? '' : (r.id || r.tipo || '') ]);
  }
  filas.forEach(f => console.log(String(f[0]).padStart(2) + '  ' + f[2].padEnd(18) + ' ' + String(f[3]).padEnd(24) + ' ' + f[1]));
  const ed = cuenta.educativa_sin_ia, totalEd = ed + cuenta.ia;
  console.log('\nTotal', lista.length, JSON.stringify(cuenta));
  console.log('Preguntas educativas resueltas sin IA: ' + ed + ' de ' + totalEd + ' (' + Math.round(ed * 100 / totalEd) + ' %). Filtro: ' + cuenta.filtro + '. Conversación: ' + cuenta.conversacion + '.');
})();
