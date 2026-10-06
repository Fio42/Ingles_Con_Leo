#!/usr/bin/env node
/* Reporte de cobertura de microtemas (solo lectura, no toca ningún archivo del sitio).
     node tools/micros-report.js          tabla: tema > microtema > ejercicios > tipos > comprobación > recurso > huecos
     node tools/micros-report.js --json   lo mismo en JSON
     node tools/micros-report.js --lock   agrega al candado de ids (tools/tests/micro-ids.lock.json) los microtemas ya usados
   Para crear un microtema nuevo basta declararlo en temas.js y poner `micro:'<id>'` en sus ejercicios:
   este reporte dice exactamente qué le falta. */
const fs = require('fs'), path = require('path');
const lib = require('./micros-lib');
const root = path.join(__dirname, '..');
const site = lib.loadSite(root);

if(process.argv.includes('--lock')){
  const stats = lib.microStats(site);
  const file = path.join(root, 'tools', 'tests', 'micro-ids.lock.json');
  const used = Object.keys(site.microById).filter(id => site.microById[id].active || stats[id].practice.length || stats[id].check.length);
  const ids = [...new Set((site.lock.ids || []).concat(used))].sort();
  fs.writeFileSync(file, JSON.stringify({
    _nota: 'Ids de microtema que ya se usan (con ejercicios o activos). Con progreso asociado NO se renombran ni se borran; micros.test.js falla si alguno desaparece. Se actualiza con: node tools/micros-report.js --lock',
    ids
  }, null, 2) + '\n');
  console.log('candado actualizado: ' + ids.length + ' ids');
  process.exit(0);
}

const r = lib.report(site);
if(process.argv.includes('--json')){ console.log(JSON.stringify(r, null, 2)); process.exit(0); }

const pad = (s, n) => String(s).padEnd(n);
console.log('Temas con microtemas: ' + r.temasConMicros + ' de ' + r.temasTotal + ' (el resto sigue con el comportamiento de siempre)\n');
console.log([pad('tema', 17), pad('microtema', 32), pad('estado', 10), pad('práct.', 7), pad('tipos', 18), pad('compr.', 7), pad('clase', 9), pad('glosario', 9), 'huecos'].join(' '));
r.rows.forEach(x => console.log([pad(x.tema, 17), pad(x.micro, 32), pad(x.estado, 10), pad(x.practica, 7), pad(x.tipos, 18), pad(x.comprobacion, 7), pad(x.clase, 9), pad(x.glosario, 9), x.huecos.join('; ') || 'ninguno'].join(' ')));
if(r.untagged.length){
  console.log('\nEjercicios de esos temas que todavía no declaran micro (siguen funcionando como siempre):');
  r.untagged.forEach(x => console.log('  ' + pad(x.tema, 17) + x.ejerciciosSinMicro));
}
const errs = lib.validate(site);
console.log('\nReglas: ' + (errs.length ? errs.length + ' problema(s)\n  - ' + errs.join('\n  - ') : 'todo en regla'));
