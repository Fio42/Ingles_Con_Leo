#!/usr/bin/env node
/* Catálogo de preguntas de los quizzes de artículos que alimentan la memoria de aprendizaje.
   Uso:  node tools/gen-article-quiz-catalog.js          -> reescribe el bloque ARTICLE_QUIZ_CATALOG de temas.js
         node tools/gen-article-quiz-catalog.js --check  -> no escribe: sale con 1 si temas.js no coincide con los HTML
   Reglas (no se inventa nada):
   - Solo artículos que temas.js ya relaciona con un tema (tema.article === archivo, o la lección de un microtema).
     Si el artículo lo reclaman 2 o más temas (p. ej. verbos modales, presente perfecto), se EXCLUYE: no se atribuye a ninguno.
   - Solo quizzes de PRÁCTICA (grammarQuiz, prepQuiz1...). Los de comprensión (insignia "Listening"/"Lectura") se excluyen:
     fallar una pregunta sobre un diálogo no dice nada de una regla gramatical.
   - El id de cada pregunta es  aq:<archivo sin 'articulo-' ni .html>:<id del quiz>:<n>  (n = 1..N en orden del HTML). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const BEGIN = '/* ARTICLE_QUIZ_CATALOG:BEGIN (generado por tools/gen-article-quiz-catalog.js, no editar a mano) */';
const END = '/* ARTICLE_QUIZ_CATALOG:END */';

function loadTemas(){
  const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8') + ';this.__T = TEMAS;', ctx);
  return ctx.__T;
}
function temaForArticle(TEMAS, file){
  // Temas que declaran este artículo como suyo (directo o por la lección de un microtema). Solo vale si es UNO:
  // si el artículo cubre varios temas (p. ej. "verbos modales"), una pregunta suelta no se puede atribuir a ninguno.
  const claim = TEMAS.filter(t => t.article === file || (t.micros || []).some(m => m.lesson && m.lesson.article === file)).map(t => t.id);
  return claim.length === 1 ? claim[0] : null;
}
function parseQuizzes(html){
  const out = [];
  const re = /<div class="toeic-mini(?:\s[^"]*)?"[^>]*\bid="([^"]+)"[^>]*>/g;
  const starts = []; let m;
  while((m = re.exec(html))) starts.push({ id: m[1], at: m.index });
  starts.forEach((s, i) => {
    const seg = html.slice(s.at, i + 1 < starts.length ? starts[i + 1].at : html.length);
    const n = (seg.match(/class="[^"]*\btoeic-mini-opts\b/g) || []).length;
    const badge = ((seg.match(/toeic-mini-badge">([^<]*)</) || [])[1] || '').trim();
    out.push({ id: s.id, n, badge });
  });
  return out;
}
function build(){
  const TEMAS = loadTemas();
  const cat = {};
  fs.readdirSync(root).filter(f => /^articulo-.*\.html$/.test(f)).sort().forEach(file => {
    const tema = temaForArticle(TEMAS, file);
    if(!tema) return;
    const quizzes = {};
    parseQuizzes(fs.readFileSync(path.join(root, file), 'utf8')).forEach(q => {
      if(!q.n || /listening|lectura|comprensi/i.test(q.badge)) return;
      quizzes[q.id] = q.n;
    });
    if(Object.keys(quizzes).length) cat[file.replace(/^articulo-/, '').replace(/\.html$/, '')] = { tema, quizzes };
  });
  return cat;
}
function render(cat){
  const lines = Object.keys(cat).map(k => `  ${JSON.stringify(k)}: { tema:${JSON.stringify(cat[k].tema)}, quizzes:${JSON.stringify(cat[k].quizzes)} }`);
  return BEGIN + '\nconst ARTICLE_QUIZ_CATALOG = {\n' + lines.join(',\n') + '\n};\n' + END;
}
if(require.main === module){
  const cat = build(), block = render(cat);
  const file = path.join(root, 'temas.js');
  let src = fs.readFileSync(file, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const norm = block.replace(/\n/g, eol);
  const i = src.indexOf(BEGIN), j = src.indexOf(END);
  if(process.argv.includes('--check')){
    const cur = i >= 0 && j > i ? src.slice(i, j + END.length) : '';
    if(cur !== norm){ console.error('ARTICLE_QUIZ_CATALOG desactualizado: corre node tools/gen-article-quiz-catalog.js'); process.exit(1); }
    console.log('catálogo al día: ' + Object.keys(cat).length + ' artículos, ' + Object.values(cat).reduce((a, c) => a + Object.values(c.quizzes).reduce((x, y) => x + y, 0), 0) + ' preguntas');
    process.exit(0);
  }
  if(i >= 0 && j > i) src = src.slice(0, i) + norm + src.slice(j + END.length);
  else {
    const anchor = 'function academiaCourseForTema(temaId){';
    const at = src.indexOf(anchor);
    if(at < 0) throw new Error('no encuentro dónde insertar el catálogo');
    src = src.slice(0, at) + norm + eol + eol + src.slice(at);
  }
  fs.writeFileSync(file, src);
  console.log('catálogo escrito: ' + Object.keys(cat).length + ' artículos');
}
module.exports = { build, render, parseQuizzes, temaForArticle };
