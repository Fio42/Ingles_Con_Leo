/* Fuente unica del contenido de la Academia para las HERRAMIENTAS y las PRUEBAS (no para el navegador).
   - Los cursos publicos (to-be, pronombres) salen enteros de academia-data.js.
   - Un curso PROTEGIDO (protected:true) solo trae su esqueleto en academia-data.js (titulo, temas, lecciones con titulo y resumen,
     ids de ejercicios). Su contenido real vive FUERA de git en private/contenido/<curso>.json y en el servidor.
   Aqui se vuelve a unir, solo si el archivo privado existe. Si no existe, el curso queda como esqueleto (hydrated:false). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const privDir = process.env.LEO_PRIVATE_DIR || path.join(root, 'private');

function loadData(){
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';this.A=ACADEMIA;this.S=academiaSentence;this.TX=academiaAudioTexts;', ctx);
  return ctx;
}
function privateContent(course){
  const f = path.join(privDir, 'contenido', course + '.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
/* Une el contenido privado al esqueleto (misma forma que usa el navegador despues de pedirlo al servidor). */
function merge(course, content){
  const byId = {}; content.lessons.forEach(l => byId[l.id] = l);
  course.lessons.forEach(l => { const c = byId[l.id]; if(!c) throw new Error('falta la leccion ' + l.id + ' en el contenido privado'); l.screens = c.screens; l.activities = c.activities; l.canSay = c.canSay; });
  course.exam.bank = content.practice;
  course.hydrated = true;
  return course;
}
function load(){
  const ctx = loadData(), A = ctx.A;
  Object.keys(A.courses).forEach(id => {
    const c = A.courses[id];
    if(c.protected){ const pc = privateContent(id); if(pc) merge(c, pc); else c.hydrated = false; }
    else c.hydrated = true;
  });
  return { A, S: ctx.S, TX: ctx.TX, ctx };
}
module.exports = { load, loadData, privateContent, merge, root, privDir };
if(require.main === module){
  const { A, TX } = load();
  const id = process.argv[2];
  if(id){ const c = A.courses[id]; console.log(JSON.stringify(c.hydrated ? TX(c) : null)); }
}
