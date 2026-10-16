// Aplica la guarda REAL exampleContrasts (de leo-ai.ts) a los ejemplos que el modelo generó en la evaluación en vivo.
const fs=require('fs'),path=require('path'),ts=require('typescript');
const src=fs.readFileSync(path.join(__dirname,'../../supabase_functions/leo-ai.ts'),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:'commonjs',target:'es2020'}}).outputText;
const m={exports:{}};new Function('module','exports','require','Deno',js)(m,m.exports,(n)=>/^https?:/.test(n)?{createClient:()=>({})}:require(n),{env:{get:()=>''},serve:()=>{}});
const cases=require('./out/cases.json'),ex=require('./out/ev2-examples.json');
let kept=0;
cases.forEach((c,i)=>{const t=c.after.text;const ch=(t.match(/Respuesta del alumno \(INCORRECTA\): (.*)/)||[])[1],co=(t.match(/Respuesta correcta: (.*)/)||[])[1];
 const ok=m.exports.exampleContrasts(ex[i],co,ch);if(ok)kept++;console.log(String(i+1).padStart(2),ok?'MANTIENE':'QUITA   ',ex[i],'| correcta:',co,'| alumno:',ch)});
console.log('Se mantienen',kept,'de',cases.length);
