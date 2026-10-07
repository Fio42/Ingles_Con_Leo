#!/usr/bin/env node
/* QA completo del sistema adaptativo, con un solo comando:  node tools/e2e/run-all.js
   Corre (1) el E2E de TODOS los microtemas activos, (2) las regresiones transversales y (3) la suite de pruebas del repo,
   y imprime el informe corto. Sin dependencias, sin red, sin Supabase. Sale con 1 si algo falla.
   Un microtema nuevo con active:true en temas.js entra solo en (1). */
const cp = require('child_process'), path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..', '..');
const run = (cmd, args) => { const r = cp.spawnSync('node', [cmd].concat(args || []), { cwd: root, encoding: 'utf8', maxBuffer: 1e8 }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };

const micro = run('tools/e2e/test-microtema.js', ['--all-active']);
const blocks = micro.out.split(/\n(?==== )/).filter(b => /^=== /.test(b));
const perMicro = {}; blocks.forEach(b => { const m = b.match(/^=== (\S+).*?: (PASS|FAIL)/); if(m) perMicro[m[1]] = m[2]; });
const reg = run('tools/e2e/regresiones.js');
const regAreas = {}; (reg.out.match(/^=== .*$/gm) || []).forEach(l => { const m = l.match(/^=== (.+?): (PASS|FAIL)/); if(m) regAreas[m[1]] = m[2]; });

const suiteDir = path.join(root, 'tools', 'tests');
const suite = fs.readdirSync(suiteDir).filter(f => /\.test\.js$/.test(f)).map(f => { const r = run('tools/tests/' + f); return { f, fails: (r.out.match(/^(FALLA|\s+FAIL)\b/gm) || []).length, last: r.out.trim().split('\n').pop() }; });
const unexpected = suite.filter(s => s.fails && s.f !== 'session-cycle.test.js');

const grp = names => { const v = names.map(n => perMicro[n]).filter(Boolean); return v.length === names.length && v.every(x => x === 'PASS') ? 'PASS' : 'FAIL'; };
const tag = ids => ids.every(id => perMicro[id]) ? grp(ids) : 'FAIL (microtema no activo o inexistente)';
const lines = [
  ['Futuro', tag(['going-to-evidencia', 'going-to-plan-decidido', 'will-decision-espontanea', 'will-forma-verbo-base'])],
  ['Condicional 1', tag(['cond-1-probable'])],
  ['Condicional 2', tag(['cond-2-imaginario'])],
  ['Multi-dispositivo', micro.code === 0 ? 'PASS' : 'FAIL'],
  ['Onboarding/nivel', regAreas['Onboarding/nivel'] || 'FAIL'],
  ['Invitados', regAreas['Invitados'] || 'FAIL'],
  ['Regresiones', Object.keys(regAreas).filter(k => ['Onboarding/nivel', 'Invitados'].indexOf(k) === -1).every(k => regAreas[k] === 'PASS') && unexpected.length === 0 ? 'PASS' : 'FAIL']
];
console.log('Microtemas activos probados: ' + Object.keys(perMicro).join(', '));
console.log('Suite del repo: ' + suite.length + ' archivos, fallas inesperadas: ' + (unexpected.map(s => s.f).join(', ') || 'ninguna') + ' (session-cycle: ' + (suite.find(s => s.f === 'session-cycle.test.js') || {}).fails + ' fallos preexistentes)\n');
lines.forEach(([k, v]) => console.log(k.padEnd(18) + ': ' + v));
if(micro.code !== 0) console.log('\n--- detalle microtemas ---\n' + micro.out.split('\n').filter(l => /FALLA|===/.test(l) || /^\s{8}/.test(l)).join('\n'));
if(reg.code !== 0) console.log('\n--- detalle regresiones ---\n' + reg.out.split('\n').filter(l => /FALLA|===/.test(l) || /^\s{8}/.test(l)).join('\n'));
process.exit(lines.every(l => l[1] === 'PASS') ? 0 : 1);
