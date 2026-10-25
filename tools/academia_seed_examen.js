#!/usr/bin/env node
/* Academia: prepara la carga del banco REAL del examen oficial.
   El repositorio es publico, asi que las respuestas NO viven en el repo. El banco esta en
   private/academia-examen-<curso>.json (carpeta ignorada por git) y este script lo convierte en un SQL
   que Leo (o Claude con su autorizacion) corre UNA vez en Supabase -> SQL Editor.

   Uso:  node tools/academia_seed_examen.js to-be
   Salida: private/seed-academia-examen-to-be.sql  (tampoco se sube a git)

   Formato del JSON: { course, items:[ { id, topic, type: choice|type|order|error,
     public:{ q, options|tokens|source, ex? }, answer:{ correct | accepted[] | order[] , fix?, why } } ] } */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

function validate(bank, opts){
  opts = opts || {};
  const errs = [];
  if(!bank || !Array.isArray(bank.items) || !bank.items.length){ return ['el banco esta vacio']; }
  const ids = new Set(), topics = {};
  bank.items.forEach(it => {
    const w = m => errs.push((it && it.id || '?') + ': ' + m);
    if(!it.id || !/^[a-z0-9-]{2,30}$/.test(it.id)) w('id invalido');
    if(ids.has(it.id)) w('id repetido'); ids.add(it.id);
    if(!it.topic) w('sin tema'); else topics[it.topic] = (topics[it.topic] || 0) + 1;
    if(['choice', 'type', 'order', 'error'].indexOf(it.type) === -1){ w('tipo invalido ' + it.type); return; }
    const p = it.public || {}, a = it.answer || {};
    if(!p.q) w('sin enunciado');
    if(!a.why) w('sin explicacion (why)');
    if(it.type === 'choice' || it.type === 'error'){
      if(!Array.isArray(p.options) || p.options.length < 2) w('opciones insuficientes');
      else {
        if(new Set(p.options).size !== p.options.length) w('opciones repetidas');
        if(p.options.indexOf(a.correct) === -1) w('la correcta no esta en las opciones');
        if(p.options.filter(o => o === a.correct).length !== 1) w('correcta ambigua');
      }
      if(it.type === 'error' && !a.fix) w('error sin fix');
    }
    if(it.type === 'type'){
      if(!p.source) w('sin source');
      if(!Array.isArray(a.accepted) || !a.accepted.length) w('sin respuestas aceptadas');
    }
    if(it.type === 'order'){
      if(!Array.isArray(p.tokens) || !Array.isArray(a.order)) w('order incompleto');
      else if(JSON.stringify(p.tokens.slice().sort()) !== JSON.stringify(a.order.slice().sort())) w('las fichas no coinciden con el orden correcto');
    }
    const flat = JSON.stringify(p) + JSON.stringify(a);
    if(/[—–]/.test(flat)) w('raya larga');
    if(it.type !== 'type' && a.correct !== undefined && p.q && p.q.indexOf(a.correct) !== -1 && a.correct.length > 3) w('el enunciado contiene la respuesta (pista)');
  });
  if(opts.perTopic) Object.keys(topics).forEach(t => { if(topics[t] < opts.perTopic) errs.push('tema ' + t + ' con menos de ' + opts.perTopic + ' preguntas'); });
  if(opts.publicBankTexts){
    bank.items.forEach(it => { if(opts.publicBankTexts.has(JSON.stringify(it.public.q) + JSON.stringify(it.public.source || '') + JSON.stringify(it.public.options || it.public.tokens || ''))) errs.push(it.id + ': ya esta en el banco publico'); });
  }
  return errs;
}
function sqlFor(bank){
  const esc = s => s.replace(/'/g, "''");
  const rows = bank.items.map(it =>
    `('${esc(bank.course)}', '${esc(it.id)}', '${esc(it.topic)}', '${it.type}', $j$${JSON.stringify(it.public)}$j$::jsonb, $j$${JSON.stringify(it.answer)}$j$::jsonb, true)`);
  return `-- Banco del examen oficial de '${bank.course}'. GENERADO. NO SUBIR A GIT (contiene las respuestas).\n` +
    `-- Correr UNA vez en Supabase -> SQL Editor. Es idempotente (upsert).\n` +
    `insert into public.academia_exam_items (course_id, id, topic, type, public, answer, active) values\n${rows.join(',\n')}\n` +
    `on conflict (course_id, id) do update set topic = excluded.topic, type = excluded.type, public = excluded.public, answer = excluded.answer, active = excluded.active;\n`;
}
module.exports = { validate, sqlFor };

if(require.main === module){
  const course = process.argv[2] || 'to-be';
  const src = path.join(root, 'private', 'academia-examen-' + course + '.json');
  if(!fs.existsSync(src)){ console.error('No existe ' + src); process.exit(1); }
  const bank = JSON.parse(fs.readFileSync(src, 'utf8'));
  const errs = validate(bank, { perTopic: 3 });
  if(errs.length){ console.error('Banco invalido:\n - ' + errs.join('\n - ')); process.exit(1); }
  const out = path.join(root, 'private', 'seed-academia-examen-' + course + '.sql');
  fs.writeFileSync(out, sqlFor(bank));
  console.log('Listo: ' + out + ' (' + bank.items.length + ' preguntas). NO se sube a git.');
}
