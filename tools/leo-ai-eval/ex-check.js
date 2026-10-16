// Aplica la guarda REAL exampleIsSafe (de leo-ai.ts) a los ejemplos que el modelo generó en la evaluación en vivo.
// uso: node ex-check.js out/ev3-examples.json
const fs=require('fs'),path=require('path'),ts=require('typescript');
const src=fs.readFileSync(path.join(__dirname,'../../supabase_functions/leo-ai.ts'),'utf8').replace("import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'",'');
const js=ts.transpileModule(src,{compilerOptions:{module:'commonjs',target:'es2020'}}).outputText;
const m={exports:{}};new Function('module','exports','require','Deno','createClient',js)(m,m.exports,require,{env:{get:()=>''},serve:()=>{}},()=>({}));
const cases=require('./out/cases.json'),ex=require(path.resolve(process.argv[2]||'out/ev3-examples.json'));
let kept=0;
cases.forEach((c,i)=>{const t=c.after.text;const g=r=>(t.match(r)||[])[1];
 const check={failed:true,chosen:g(/Respuesta del alumno \(INCORRECTA\): (.*)/),correct:g(/Respuesta correcta: (.*)/),question:g(/Pregunta: (.*)/)};
 const ok=m.exports.exampleIsSafe(ex[i],check);if(ok)kept++;console.log(String(i+1).padStart(2),ok?'MANTIENE':'QUITA   ',ex[i],'| correcta:',check.correct,'| alumno:',check.chosen)});
console.log('Se mantienen',kept,'de',cases.length);
