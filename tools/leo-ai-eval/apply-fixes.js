/* Reemplaza SOLO el ejemplo repetido de "Mira otros ejemplos" (data.js). No toca ids, respuestas, explicaciones ni el otro ejemplo.
   uso: node apply-fixes.js [--write] */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..','..');
const rows=require('./out/dup-examples.json');
const map=Object.assign({},...fs.readdirSync(path.join(__dirname,'fixes')).filter(f=>/^part\d+\.json$/.test(f)).map(f=>require('./fixes/'+f)));
let src=fs.readFileSync(path.join(root,'data.js'),'utf8');
const allText=['data.js','toefl-data.js','ielts-data.js','toeic-data.js','cambridge-data.js','cambridge-b1-data.js','cambridge-c1-data.js','juego-data.js','mini-lecciones.js','temas.js','clases.js'].map(f=>{try{return fs.readFileSync(path.join(root,f),'utf8')}catch(e){return ''}}).join('\n');
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
const grammarRows=rows.map((r,i)=>({r,i})).filter(x=>!/^v-/.test(x.r.id));
const problems=[], seenNew=new Set(); let done=0;
for(const {r,i} of grammarRows){
  const fix=map[String(i)]; if(!fix){ problems.push('sin reemplazo: '+i+' '+r.id); continue; }
  const [en,es]=fix;
  if(norm(en)===norm(r.ex)) problems.push('igual al viejo: '+i);
  if(seenNew.has(norm(en))) problems.push('repetido entre los nuevos: '+i+' '+en); seenNew.add(norm(en));
  const esc=(s,q)=>s.replace(/\\/g,'\\\\').replace(new RegExp(q,'g'),'\\'+q);
  // ¿ya existe esa frase inglesa en algun banco?
  const hay=allText.split(en).length-1; if(hay>0) problems.push('la frase nueva YA existe ('+hay+'x): '+i+' '+en);
  const at=src.indexOf('"'+r.id+'"')>=0 ? src.indexOf('"'+r.id+'"') : src.indexOf("'"+r.id+"'");
  if(at<0){ problems.push('id no encontrado '+r.id); continue; }
  const next=src.indexOf('{id:',at+5), nextJson=src.indexOf('"id":',at+5); const end=Math.min(next<0?1e9:next, nextJson<0?1e9:nextJson, at+6000);
  let pos=-1, q='', oldRaw='';
  for(const quote of ['"',"'"]) for(const cand of [r.ex, r.ex.replace(/'/g,"\\'")]){
    // solo cuenta si es el valor de la clave "en" (no una opcion ni el texto de la pregunta)
    let k=src.indexOf(quote+cand+quote, at);
    while(k>=0 && k<end && !/\ben["']?\s*:\s*$/.test(src.slice(Math.max(0,k-12),k))) k=src.indexOf(quote+cand+quote, k+1);
    if(k>=0 && k<end && (pos<0||k<pos)){ pos=k; q=quote; oldRaw=cand; }
  }
  if(pos<0){ problems.push('no se encontro el texto viejo en '+r.id+': '+r.ex); continue; }
  const tail=src.slice(pos, pos+oldRaw.length+400);
  const m=tail.match(/^(["'])(.*?)\1(\s*,\s*["']?es["']?\s*:\s*)(["'])((?:\\.|(?!\4).)*)\4/s);
  if(!m){ problems.push('formato es no reconocido en '+r.id); continue; }
  const newChunk=q+esc(en,q)+q+m[3]+m[4]+esc(es,m[4])+m[4];
  src=src.slice(0,pos)+newChunk+src.slice(pos+m[0].length); done++;
}
console.log(JSON.stringify({filas:rows.length, gramatica:grammarRows.length, aplicadas:done, problemas:problems.length}));
problems.forEach(p=>console.log('PROBLEMA',p));
if(process.argv.includes('--write')&&!problems.length){ fs.writeFileSync(path.join(root,'data.js'),src); console.log('data.js escrito'); }
