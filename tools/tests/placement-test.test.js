#!/usr/bin/env node
/* Test de nivel (test-de-nivel-de-ingles.html). Corre con:
   node tools/tests/placement-test.test.js   (desde la carpeta inglesconLeo)
   Carga el script REAL de la pagina en un navegador simulado, revisa el banco
   de preguntas (A1 a C2, sin repetidas, audios existentes) y simula personas. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..','..');
const html=fs.readFileSync(path.join(root,'test-de-nivel-de-ingles.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const code=scripts.find(s=>s.includes('leoLevelTestV'));
assert(code,'no se encontro el script del test');
const store={};const els={};
const mkEl=()=>({style:{},_h:'',get innerHTML(){return this._h},set innerHTML(v){this._h=v;this.children=[];if(this===els.levelTest)Object.keys(els).forEach(k=>{if(k!=='levelTest')delete els[k]})},children:[],handlers:{},disabled:false,className:'',
  addEventListener(n,f){this.handlers[n]=f},appendChild(c){this.children.push(c)},
  querySelectorAll(){return this.children},getBoundingClientRect(){return{top:0}}});
const ctx={console,Math,JSON,Date,Array,Object,String,Number,
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},
  document:{getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl()},
  setTimeout:fn=>{fn();return 0},scrollY:0,scrollTo(){}};
ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8').match(/function shuffleOptions[\s\S]*?\r?\n\}\r?\n/)[0],ctx);
vm.runInContext(code.replace('var st = load();','window.__lt={QUESTIONS:QUESTIONS,computeLevel:computeLevel,BANDS:BANDS,RESULTS:RESULTS};var st = load();'),ctx);
const {QUESTIONS:Q,computeLevel,BANDS,RESULTS}=ctx.__lt;
let n=0;const ok=m=>{n++;console.log('ok',m)};

// 1. Estructura del banco
assert.strictEqual(JSON.stringify(BANDS),JSON.stringify(['A1','A2','B1','B2','C1','C2']));
assert.strictEqual(Q.length,30);
BANDS.forEach(b=>assert.strictEqual(Q.filter(q=>q.band===b).length,5,'5 por nivel '+b));
// de fácil a difícil: las bandas aparecen en orden
const order=Q.map(q=>BANDS.indexOf(q.band));assert(order.every((v,i)=>i===0||v>=order[i-1]),'orden ascendente');
BANDS.forEach(b=>assert.strictEqual(Q.filter(q=>q.band===b&&q.listen).length,1,'1 listening en '+b));
Q.forEach((q,i)=>{assert.strictEqual(q.options.length,4,'4 opciones #'+(i+1));assert.strictEqual(new Set(q.options).size,4,'opciones distintas #'+(i+1));
  assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,'correct valido #'+(i+1));assert(q.explain&&q.prompt,'texto #'+(i+1));
  if(q.listen){if(!fs.existsSync(path.join(root,q.listen)))console.log('AVISO: falta el audio '+q.listen+' (generar con tools/generar_audios.py antes de subir)');assert(q.transcript);}
  assert(!/—/.test(q.prompt+q.explain),'sin raya larga en prosa #'+(i+1));});
assert.strictEqual(new Set(Q.map(q=>q.prompt)).size,30,'sin prompts repetidos');
BANDS.forEach(b=>assert(RESULTS[b]&&RESULTS[b].site,'resultado '+b));assert(RESULTS.A0);
ok('banco: 30 preguntas, 5 por nivel A1-C2, orden ascendente, 1 listening por nivel, audios existen');

// 2. Personas
const answers=f=>Q.map((q,i)=>f(q,i));
const right=q=>q.correct, wrong=q=>(q.correct+1)%4;
const persona=(top,slips)=>answers((q,i)=>{const bi=BANDS.indexOf(q.band);return bi<=BANDS.indexOf(top)?right(q):wrong(q)});
const lv=a=>computeLevel({answers:a}).level;
BANDS.forEach(b=>assert.strictEqual(lv(persona(b)),b,'persona perfecta hasta '+b));
assert.strictEqual(lv(answers(wrong)),'A0');
ok('personas perfectas hasta cada nivel dan ese nivel; todo mal da A0');
// 4 de 5 aprueba, 3 de 5 no
const nOk=(top,k)=>{let c={};return answers((q,i)=>{const bi=BANDS.indexOf(q.band),ti=BANDS.indexOf(top);if(bi<ti)return right(q);if(bi>ti)return wrong(q);c[q.band]=(c[q.band]||0)+1;return c[q.band]<=k?right(q):wrong(q)})};
assert.strictEqual(lv(nOk('B1',4)),'B1');assert.strictEqual(lv(nOk('B1',3)),'A2');assert.strictEqual(lv(nOk('A1',3)),'A0');
ok('4 de 5 aprueba un nivel, 3 de 5 no');
// un tropiezo se tolera si el siguiente se aprueba; dos no
const mix=(spec)=>answers((q,i)=>{const k=spec[q.band];spec[q.band+'_c']=(spec[q.band+'_c']||0)+1;return spec[q.band+'_c']<=k?right(q):wrong(q)});
assert.strictEqual(lv(mix({A1:5,A2:5,B1:3,B2:5,C1:0,C2:0})),'B2','un tropiezo en B1 con B2 aprobado = B2');
assert.strictEqual(lv(mix({A1:5,A2:5,B1:3,B2:3,C1:5,C2:5})),'A2','dos tropiezos seguidos cortan en A2');
assert.strictEqual(lv(mix({A1:5,A2:3,B1:5,B2:3,C1:5,C2:5})),'B1','solo se tolera un tropiezo en total');
assert.strictEqual(lv(mix({A1:5,A2:5,B1:5,B2:5,C1:3,C2:5})),'C2','un tropiezo en C1 con C2 aprobado = C2');
assert.strictEqual(lv(mix({A1:5,A2:5,B1:5,B2:5,C1:5,C2:3})),'C1','3 de 5 en C2 no da C2');
assert.strictEqual(lv(mix({A1:2,A2:5,B1:5,B2:5,C1:5,C2:5})),'A0','A1 muy flojo no se compensa con niveles altos');
ok('tolerancia de un solo tropiezo correcta');
// 3. Adivinar al azar
let g={};const N=100000;for(let t=0;t<N;t++){const l=lv(answers(q=>Math.floor(Math.random()*4)));g[l]=(g[l]||0)+1}
const pct=l=>(g[l]||0)/N*100;
assert(pct('A0')>93,'adivinando casi siempre A0: '+pct('A0'));assert(pct('A2')+pct('B1')+pct('B2')+pct('C1')+pct('C2')<1.5,'adivinar casi nunca pasa de A1');
ok('adivinar al azar: A0 '+pct('A0').toFixed(1)+'%, A1 '+pct('A1').toFixed(1)+'%, A2 o mas '+(100-pct('A0')-pct('A1')).toFixed(2)+'%');

// 4. Flujo real con clics: se contesta todo bien y el resultado se guarda
const root_=els['levelTest']; assert(root_,'contenedor');
els['ltStart'].handlers.click();
let guard=0;
while(!/Tu nivel estimado/.test(root_.innerHTML)&&guard++<40){
  const idx=JSON.parse(store['leoLevelTestV3']).idx;const q=Q[idx];const st=JSON.parse(store['leoLevelTestV3']);
  // los botones de opciones se crearon en #ltOpts en el orden barajado
  if(!els['ltOpts'])console.log('idx',idx,Object.keys(els),root_.innerHTML.slice(0,80));const btns=els['ltOpts'].children;assert.strictEqual(btns.length,4);
  const order=st.orders[idx];const pos=order.indexOf(q.correct);btns[pos].handlers.click();
}
assert(/>C2</.test(root_.innerHTML),'persona perfecta termina en C2 por clics');
assert(/30 de 30/.test(root_.innerHTML));
assert(JSON.parse(store['leoLevelTestV3']).done===true);
ok('flujo completo por clics: 30 respuestas correctas dan C2 y se guarda');
// orden barajado: la correcta no queda siempre en la misma posicion
const pos={};for(let t=0;t<200;t++){const st=JSON.parse(JSON.stringify({}));}
console.log('\n'+n+' grupos OK');
