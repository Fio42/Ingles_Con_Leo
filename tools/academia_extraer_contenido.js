#!/usr/bin/env node
/* Saca el contenido de un curso de academia-data.js y lo deja FUERA de git:
     private/contenido/<curso>.json   (lecciones: pantallas, ejercicios, canSay; y las preguntas de practica)
   y reemplaza el curso en academia-data.js por su ESQUELETO PUBLICO (temario comercial + ids de ejercicios + protected:true).
   Uso:  node tools/academia_extraer_contenido.js articulos
   Es de una sola vez por curso. Para cursos que ya existian en el sitio (to-be, pronombres) NO se usa todavia: ver docs/proteccion-contenido-premium.md */
const fs = require('fs'), path = require('path');
const F = require('./academia_fuente.js');
const id = process.argv[2];
if(!id){ console.error('Falta el id del curso'); process.exit(1); }
const { A } = F.load(); const c = A.courses[id];
if(!c || c.protected){ console.error('Curso inexistente o ya protegido'); process.exit(1); }
const content = {
  course: id, version: 1,
  lessons: c.lessons.map(l => ({ id: l.id, canSay: l.canSay, screens: l.screens, activities: l.activities })),
  practice: c.exam.bank
};
fs.mkdirSync(path.join(F.privDir, 'contenido'), { recursive: true });
fs.writeFileSync(path.join(F.privDir, 'contenido', id + '.json'), JSON.stringify(content, null, 1) + '\n');
const skeleton = {
  id: c.id, title: c.title, name: c.name, short: c.short, tagline: c.tagline, goal: c.goal, protected: true, topics: c.topics,
  lessons: c.lessons.map(l => ({ id: l.id, n: l.n, minutes: l.minutes, topic: l.topic, title: l.title, summary: l.summary, activityIds: l.activities.map(a => a.id) })),
  exam: { id: c.exam.id, n: c.exam.n, title: c.exam.title, bank: [], practiceIds: c.exam.bank.map(b => ({ id: b.id, topic: b.topic })) }
};
const file = path.join(F.root, 'academia-data.js'); let s = fs.readFileSync(file, 'utf8');
const start = s.indexOf("    '" + id + "': {"); if(start < 0) throw new Error('bloque no encontrado');
const endMark = "\n    }\n  }\n};\n"; const end = s.indexOf(endMark, start);
const lit = JSON.stringify(skeleton, null, 2).split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n');
s = s.slice(0, start) + "    // CURSO PROTEGIDO: aqui solo el esqueleto publico (temario comercial). El contenido se entrega desde el servidor a miembros.\n    '" + id + "': " + lit + s.slice(end + "\n    }".length);
fs.writeFileSync(file, s);
console.log('Contenido en private/contenido/' + id + '.json; esqueleto publico en academia-data.js');
