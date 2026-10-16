/* Comprueba que data.js nuevo vs el anterior SOLO difiere en ejemplos concretos (ids, respuestas, explicaciones, opciones intactos). uso: node verify-data-diff.js <data.js viejo> */
const fs=require('fs'),vm=require('vm'),path=require('path');
const load=f=>{const ctx={console,Math,Date,JSON,Map,Set,Array,Object,String,Number,window:{},localStorage:{getItem:()=>null,setItem(){}},document:{addEventListener(){},querySelector:()=>null}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(f,'utf8')+';this.__b={G:GRAMMAR_BANK,V:VOCAB_BANK}',ctx);return ctx.__b;};
const A=load(process.argv[2]), B=load(path.join(__dirname,'..','..','data.js'));
const flat=b=>{const m={};for(const lv of Object.keys(b.G))b.G[lv].forEach((v,vi)=>v.forEach(tp=>tp.items.forEach(it=>{m[it.id]=it;})));for(const lv of Object.keys(b.V))b.V[lv].forEach(v=>v.forEach(w=>{m[w.id]=w;}));return m;};
const a=flat(A),b=flat(B);let changedEx=0,other=[];
if(Object.keys(a).length!==Object.keys(b).length) other.push('cambio la cantidad de items');
for(const id of Object.keys(a)){const x=a[id],y=b[id];if(!y){other.push('falta '+id);continue;}
 for(const k of new Set([...Object.keys(x),...Object.keys(y)])){ if(k==='examples')continue; if(JSON.stringify(x[k])!==JSON.stringify(y[k]))other.push(id+'.'+k);}
 const ex=x.examples||[],ey=y.examples||[]; if(ex.length!==ey.length)other.push(id+' examples.length');
 ex.forEach((e,i)=>{ if(JSON.stringify(e)!==JSON.stringify(ey[i])) changedEx++; });}
// el resto del archivo (todo lo que no sean los pares en/es) tampoco debe cambiar
console.log(JSON.stringify({items:Object.keys(a).length,ejemplosCambiados:changedEx,otrasDiferencias:other.length}));other.slice(0,10).forEach(o=>console.log('DIF',o));
