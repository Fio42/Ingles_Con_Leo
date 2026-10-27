/* Genera academia-cursos.js: la lista MÍNIMA de cursos publicados (para el Inicio del alumno), sin cargar el motor completo.
   Sale de academia-motor.js (el mismo campo open/enabled que decide qué cursos están abiertos). */
const fs = require('fs'), vm = require('vm');
const SRC = 'academia-motor.js', OUT = 'academia-cursos.js';
function build(){
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(SRC, 'utf8') + '\nthis.__M = ACADEMIA_MOTOR;', ctx);
  const M = ctx.__M, courses = {};
  Object.keys(M.courses).forEach(id => { const c = M.courses[id]; courses[id] = { title: c.title, open: !!c.open, lessons: c.lessons.length }; });
  return '/* GENERADO por tools/generar_academia_cursos.js desde academia-motor.js. No editar a mano. */\nvar ACADEMIA_CURSOS = ' + JSON.stringify({ enabled: !!M.enabled, courses }, null, 1) + ';\n';
}
if(process.argv.includes('--check')){
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if(cur !== build()){ console.error(OUT + ' desactualizado'); process.exit(1); } console.log(OUT + ' al día');
} else { fs.writeFileSync(OUT, build()); console.log(OUT + ' escrito'); }
