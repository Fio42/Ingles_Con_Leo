#!/usr/bin/env node
/* Genera academia-motor.js: el PUENTE chico entre la academia y el motor adaptativo del sitio (app.js).
   Lo cargan las paginas que ya tienen app.js (progreso, plan, errores...). Es pequeno a proposito: no trae el
   contenido de las lecciones, solo "que actividad pertenece a que leccion y a que tema del motor".
   Lee academia-data.js (la unica fuente). Uso:  node tools/generar_academia_motor.js [--check]
   --check no escribe: falla si academia-motor.js esta desactualizado (lo usa la prueba). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const OUT = path.join(root, 'academia-motor.js');

// Conexion con el registro de temas (temas.js) y con GRAMMAR_BANK: etiqueta EXACTA.
const COURSES = {
  'to-be': { tema: 'to-be-presente', engineTopic: 'Verbo "to be": am / is / are', level: 'facil', open: true },
  // open=false: el curso existe en el codigo pero el sitio todavia no lo recomienda (planes, progreso, errores). Se pone en true al lanzarlo.
  'pronombres': { tema: 'pronombres', engineTopic: 'He / She / It (pronombres)', level: 'facil', open: true },
  'articulos': { tema: 'a-an', engineTopic: 'A / An', level: 'facil', open: true },
  // Curso 4: publicado el 28-oct-2026.
  'posesivos': { tema: 'posesivos', engineTopic: 'Posesivos (my / your / his / her / our / their)', level: 'facil', open: true },
  // Curso 5 (OCULTO hasta que Leo lo autorice).
  'there-is-are': { tema: 'there-is-are', engineTopic: 'There is / are (hay)', level: 'facil', open: false }
};

function build(){
  const A = vm.runInNewContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';ACADEMIA');
  const courses = {};
  Object.keys(COURSES).forEach(cid => {
    const c = A.courses[cid], cfg = COURSES[cid];
    const lessons = c.lessons.map(l => ({ n: l.n, title: l.title, topic: l.topic }));
    const byTopic = {}; c.lessons.forEach(l => byTopic[l.topic] = l.n);
    const items = {};
    // Un curso PROTEGIDO no trae el contenido en academia-data.js, solo los ids (activityIds / exam.practiceIds): no hace falta el contenido.
    c.lessons.forEach(l => (l.activityIds || l.activities.map(a => a.id)).forEach(id => { items[id] = l.n; }));
    (c.exam.practiceIds || c.exam.bank).forEach(a => { items[a.id] = byTopic[a.topic]; });
    // Demostracion gratuita: sus ejercicios alimentan el mismo motor de errores y refuerzan la leccion 1.
    ((c.demo && c.demo.activities) || []).forEach(a => { items[a.id] = byTopic[a.topic]; });
    // Examen OFICIAL (banco privado, ids e-<letra><n>): la letra es la inicial del tema. Solo se reservan los ids; no hay contenido.
    const letters = {}; Object.keys(c.topics).forEach(k => { if(letters[k[0]]) throw new Error('inicial repetida en temas: ' + k); letters[k[0]] = byTopic[k]; });
    Object.keys(letters).forEach(L => { for(let i = 1; i <= 12; i++) items['e-' + L + i] = letters[L]; });
    courses[cid] = { title: c.title, tema: cfg.tema, engineTopic: cfg.engineTopic, level: cfg.level, open: !!cfg.open, topics: c.topics, lessons, items };
  });
  return `/* GENERADO por tools/generar_academia_motor.js desde academia-data.js. No editar a mano.
   Puente entre la academia y el motor adaptativo (app.js). Sin contenido de lecciones: solo mapas.
   enabled=false: mientras la academia no se lance, el sitio actual se ve y se comporta EXACTAMENTE igual. */
var ACADEMIA_MOTOR = (function(){
  var DATA = ${JSON.stringify(courses, null, 1)};
  var M = { enabled: ${process.env.ACADEMIA_MOTOR_ENABLED === '1' ? 'true' : 'false'}, page: 'academia.html', courses: DATA };
  M.itemId = function(courseId, activityId){ return 'ac:' + courseId + ':' + activityId; };
  M.parse = function(engineId){
    var m = /^ac:([a-z0-9-]+):(.+)$/.exec(String(engineId || ''));
    if(!m || !DATA[m[1]]) return null;
    return { course: m[1], activity: m[2], lesson: DATA[m[1]].items[m[2]] || null };
  };
  /* Entradas para el indice de diagnostico de app.js (getDiagItemIndex). kind 'grammar' + el tema REAL del motor:
     asi el diagnostico, las familias y el registro de temas funcionan igual que con cualquier ejercicio. */
  M.indexEntries = function(){
    var out = [];
    Object.keys(DATA).forEach(function(cid){
      var c = DATA[cid];
      Object.keys(c.items).forEach(function(aid){
        out.push([M.itemId(cid, aid), { kind: 'grammar', item: { id: M.itemId(cid, aid), academia: true }, topic: c.engineTopic, academia: { course: cid, lesson: c.items[aid] } }]);
      });
    });
    return out;
  };
  M.courseForTema = function(temaId){
    var ids = Object.keys(DATA);
    for(var i = 0; i < ids.length; i++) if(DATA[ids[i]].open && DATA[ids[i]].tema === temaId) return ids[i];
    return null;
  };
  /* Donde llevar al alumno para reforzar un tema: la leccion que mas errores activos acumula (empate: la menor).
     failedEngineIds: ids del motor ('ac:to-be:l3-a2') con error activo. back: pagina a la que volver despues. */
  M.linkForTema = function(temaId, failedEngineIds, back){
    var cid = M.courseForTema(temaId);
    if(!M.enabled || !cid) return null;
    var count = {}, best = null;
    (failedEngineIds || []).forEach(function(id){
      var p = M.parse(id); if(!p || p.course !== cid || !p.lesson) return;
      count[p.lesson] = (count[p.lesson] || 0) + 1;
    });
    Object.keys(count).forEach(function(n){ if(best === null || count[n] > count[best] || (count[n] === count[best] && +n < +best)) best = n; });
    var c = DATA[cid];
    var lesson = best ? +best : null;
    var href = M.page + '#/curso/' + cid + (lesson ? '/leccion/' + lesson : '') + (back ? '?volver=' + encodeURIComponent(back) : '');
    return { course: cid, lesson: lesson, href: href, label: lesson ? 'Repasar la lección ' + lesson + ' del curso ' + c.title.replace(/^Domina el verbo /, '') : 'Ver el curso ' + c.title.replace(/^Domina el verbo /, '') };
  };
  return M;
})();
`;
}
module.exports = { build };
if(require.main === module){
const out = build();
if(process.argv.indexOf('--check') !== -1){
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if(cur !== out){ console.error('academia-motor.js esta desactualizado: corre node tools/generar_academia_motor.js'); process.exit(1); }
  console.log('academia-motor.js al dia');
} else { fs.writeFileSync(OUT, out); console.log('academia-motor.js escrito (' + out.length + ' bytes)'); }
}
