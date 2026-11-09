#!/usr/bin/env node
/* Puente curso -> resto de la plataforma: desde un error en la academia se ofrece la explicación (artículo o glosario) y ejercicios
   distintos del mismo tema; el artículo devuelve al curso. Todo sale de temas.js (sin tablas nuevas) y nunca apunta a algo que no existe.
   Corre con:  node tools/tests/academia-puente.test.js   (desde la carpeta inglesconLeo) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(rd('temas.js') + ';this.__T = { TEMA_BY_ID, ACADEMIA_COURSE_BY_TEMA };', ctx);
const { TEMA_BY_ID, ACADEMIA_COURSE_BY_TEMA } = ctx.__T;
let passed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; } }

console.log('Puente academia -> práctica, artículo y glosario');
test('Cada curso publicado tiene tema, explicación existente y práctica (familia) del mismo tema', () => {
  Object.keys(ACADEMIA_COURSE_BY_TEMA).forEach(k => {
    const t = TEMA_BY_ID[k]; assert(t, 'tema ' + k);
    assert(t.article ? fs.existsSync(path.join(root, t.article)) : (t.glossary && fs.existsSync(path.join(root, 'glosario', t.glossary, 'index.html'))), 'explicación de ' + k);
    assert(t.family, 'familia (práctica) de ' + k);
  });
});
test('Un curso corresponde a un solo tema (el puente no se confunde)', () => {
  const courses = Object.keys(ACADEMIA_COURSE_BY_TEMA).map(k => ACADEMIA_COURSE_BY_TEMA[k].course);
  assert.strictEqual(new Set(courses).size, courses.length);
});
test('academia.html carga temas.js antes de academia.js, con versiones al día', () => {
  const h = rd('academia.html');
  assert(h.indexOf('temas.js?v=') > -1 && h.indexOf('temas.js?v=') < h.indexOf('academia.js?v='));
  assert(h.match(/temas\.js\?v=(\w+)/)[1] === rd('practica.html').match(/temas\.js\?v=(\w+)/)[1], 'misma versión de temas.js que Practicar');
});
test('El refuerzo solo sale en lección y repaso: nunca dentro de la evaluación', () => {
  const j = rd('academia.js');
  const examBranch = j.indexOf("if(opts.mode === 'exam'){\n          answers.push");
  const fbUse = j.indexOf('refuerzoNode(true)');
  assert(examBranch > 0 && fbUse > examBranch, 'el refuerzo está después de la salida de la evaluación');
  assert(j.split('refuerzoNode(').length - 1 === 4, 'definición + 3 usos (error, fin de lección, fin de repaso)');
});
test('Enlaces: miembro va al Plan de estudio del tema, el resto a la práctica gratis; sin membresía no se promete nada', () => {
  const j = rd('academia.js');
  assert(/mode === 'member' && t\.family/.test(j) && /SITE\.plan \+ '\?foco='/.test(j) && /SITE\.practica \+ '\?skill=grammar'/.test(j));
});
test('El artículo devuelve al curso relacionado (miembros), desde la misma tabla', () => {
  const a = rd('app.js');
  assert(/academiaCourseForTema\(tema\.id\)/.test(a) && /Curso relacionado:/.test(a));
});
console.log(passed + ' pruebas ok');
