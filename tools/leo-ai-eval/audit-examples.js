/* Audita los bloques "Mira otros ejemplos" (item.examples) de data.js: ¿alguno es en realidad la pregunta original ya resuelta? */
const { loadApp } = require('./lib');
const t = loadApp();
const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
const out = [];
let items = 0, withEx = 0;
function opts(it){ return it.options || it.bank || (it.quiz && it.quiz.options) || []; }
function solved(it){ // frases "resueltas" del ejercicio, normalizadas
  const r = [];
  if(it.type==='choice' && typeof it.prompt==='string' && it.prompt.includes('___')){
    const o = it.options||[]; r.push(norm(it.prompt.replace('___', o[it.correct]||'')));
  } else if(it.type==='fill' && Array.isArray(it.sentence)){
    const s = it.sentence.slice(); if(typeof it.blankIndex==='number') s[it.blankIndex] = it.correct; r.push(norm(s.join(' ')));
  } else if(it.type==='error'){ ['correctSentence','correct','answer','fixed'].forEach(k=>{ if(typeof it[k]==='string') r.push(norm(it[k])); }); if(typeof it.prompt==='string') r.push(norm(it.prompt)); }
  if(it.quiz && it.quiz.prompt) r.push(norm(it.quiz.prompt));
  if(it.word) r.push(norm(it.word));
  return r.filter(x=>x && x.length>=8);
}
const seen = new Set();
function check(it, where){
  items++;
  if(!Array.isArray(it.examples)||!it.examples.length||(it.quiz&&it.word)) return; // vocabulario: sus ejemplos USAN la palabra a propósito
  withEx++;
  const sol = solved(it);
  it.examples.forEach((e,i)=>{ const en = norm(e&&e.en); if(!en) return;
    const hit = sol.find(s=> en===s || (en.length>=12 && s.includes(en)) || (s.length>=12 && en.includes(s)));
    if(hit && !seen.has(it.id+'#'+i)){ seen.add(it.id+'#'+i); out.push({ id: it.id, where, idx:i, example:e.en, solved: hit, type: it.type||'vocab' }); }
  });
}
for(const lv of Object.keys(t.G)) t.G[lv].forEach((v,vi)=>v.forEach(tp=>tp.items.forEach(it=>check(it, 'G:'+lv+':'+vi+':'+tp.topic))));
for(const lv of Object.keys(t.V)) t.V[lv].forEach((v,vi)=>v.forEach(w=>check(w, 'V:'+lv+':'+vi)));
console.log(JSON.stringify({ items, withEx, confirmados: out.length }));
out.forEach(o=>console.log(o.id, '|', o.type, '| ej#'+o.idx+':', o.example, '| resuelta:', o.solved));
if(process.argv.includes('--dump')){
  const fs=require('fs'); const all={}; 
  const idx={}; for(const lv of Object.keys(t.G)) t.G[lv].forEach(v=>v.forEach(tp=>tp.items.forEach(it=>{idx[it.id]={it,topic:tp.topic,lv};})));
  for(const lv of Object.keys(t.V)) t.V[lv].forEach(v=>v.forEach(w=>{idx[w.id]={it:w,topic:'vocab',lv};}));
  const rows=out.map(o=>{const {it,topic,lv}=idx[o.id];const q = it.type==='choice'?it.prompt:(it.type==='fill'?(it.sentence||[]).join(' '):(it.quiz?it.quiz.prompt:it.prompt||''));
   const ans = it.type==='choice'?(it.options||[])[it.correct]:(it.correct||(it.quiz&&it.quiz.options[it.quiz.correct])||'');
   return {id:o.id,lv,topic,type:o.type,q,ans,idx:o.idx,ex:o.example,other:(it.examples||[]).filter((_,i)=>i!==o.idx).map(e=>e.en).join(' / '),explain:(it.explain||'').slice(0,90)};});
  fs.writeFileSync(__dirname+'/out/dup-examples.json',JSON.stringify(rows,null,1));
  console.log('volcado',rows.length);
}
