#!/usr/bin/env node
/* Test de nivel (test-de-nivel-de-ingles.html).
   Corre con:  node tools/tests/placement-test.test.js   (desde la carpeta inglesconLeo)
   Variable opcional: STRICT_AUDIO=1 hace fallar la prueba si falta algun mp3 (usar antes de publicar).
   Carga el script REAL de la pagina en un navegador simulado (sin red) y revisa: banco de preguntas,
   audios, calculo del nivel (personas, casos limite, bloques contradictorios, azar), flujo por clics,
   fallo de audio, reanudacion y ampliacion del banco.
   OJO: estas pruebas verifican el COMPORTAMIENTO del calculo. La precision real del nivel solo se
   confirma con un piloto con alumnos evaluados de forma independiente (ver DEVLOG). */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),cp=require('child_process');
const root=path.join(__dirname,'..','..');
const html=fs.readFileSync(path.join(root,'test-de-nivel-de-ingles.html'),'utf8').replace(/\r\n/g,'\n');
const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('leoLevelTestV'));
assert(code,'no se encontro el script del test');
const appJs=fs.readFileSync(path.join(root,'app.js'),'utf8');
const shuffleSrc=appJs.match(/function shuffleOptions[\s\S]*?\r?\n\}\r?\n/)[0];
let groups=0;const ok=m=>{groups++;console.log('ok  '+m)};
const tick=()=>new Promise(r=>setImmediate(r));

/* ---------- navegador simulado ---------- */
function boot(opts){
  opts=opts||{};
  const store=opts.store||{};const els={};const events=[];const profile={};const levelCalls=[];
  const mkEl=()=>({style:{},_h:'',get innerHTML(){return this._h},
    set innerHTML(v){this._h=String(v);this.children=[];if(this===els.levelTest)Object.keys(els).forEach(k=>{if(k!=='levelTest')delete els[k]})},
    children:[],handlers:{},disabled:false,className:'',id:'',textContent:'',
    addEventListener(n,f){this.handlers[n]=f},appendChild(c){this.children.push(c)},
    querySelectorAll(){return this.children},getBoundingClientRect(){return{top:0}}});
  const audios=[];
  class FakeAudio{constructor(src){this.src=src;this.l={};this.paused=true;this.played=0;audios.push(this);
      if(FakeAudio.mode==='throw')throw new Error('no audio');
      if(FakeAudio.mode==='error')Promise.resolve().then(()=>this.fire('error'));}
    addEventListener(n,f){this.l[n]=f;}fire(n){const f=this.l[n];if(f)f()}
    pause(){this.paused=true}
    play(){this.played++;this.paused=false;if(FakeAudio.mode==='denied')return Promise.reject({name:'NotAllowedError'});
      if(FakeAudio.mode==='playfail')return Promise.reject({name:'NotSupportedError'});
      if(FakeAudio.mode==='syncthrow')throw new Error('boom');return Promise.resolve();}}
  FakeAudio.mode=opts.audio||'ok';
  const ctx={console,Math,JSON,Date,Array,Object,String,Number,Promise,
    localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},
    document:{getElementById:id=>els[id]||(els[id]=mkEl()),createElement:()=>mkEl()},
    setTimeout:fn=>{fn();return 0},scrollY:0,scrollTo(){},Audio:FakeAudio,
    trackLeoEvent:(n,p)=>events.push([n,p]),
    getProfile:()=>profile.p||null,saveProfile:p=>{profile.p=JSON.parse(JSON.stringify(p))},
    setUserLevel:(l,s)=>levelCalls.push([l,s])};
  ctx.window=ctx;vm.createContext(ctx);
  vm.runInContext(shuffleSrc,ctx);
  let src=code;
  if(opts.extra){const k=src.indexOf('\n  ];\n  /* ---- Reglas');assert(k>0);src=src.slice(0,k)+'\n'+opts.extra+src.slice(k);}
  vm.runInContext(src.replace('var st = load();','window.__lt={QUESTIONS:QUESTIONS,computeLevel:computeLevel,BANDS:BANDS,RESULTS:RESULTS,SIG:SIG};var st = load();'),ctx);
  return {ctx,els,store,events,profile,levelCalls,audios,Audio:FakeAudio,lt:ctx.__lt,root:els.levelTest,
    text:()=>els.levelTest.innerHTML,state:()=>JSON.parse(store.leoLevelTestV3)};
}
// responde la pregunta actual: 'right' | 'wrong' | indice original de opcion
function answerNow(b,kind){const st=b.state(),q=b.lt.QUESTIONS[st.idx],order=st.orders[st.idx];
  const target=kind==='right'?q.correct:kind==='wrong'?(q.correct+1)%q.options.length:kind;
  const btns=b.els.ltOpts.children;assert.strictEqual(btns.length,q.options.length);btns[order.indexOf(target)].handlers.click();}
const finished=b=>/Tu nivel estimado/.test(b.text());
function runAll(b,fn){b.els.ltStart.handlers.click();let g=0;
  while(!finished(b)&&g++<200){const st=b.state(),q=b.lt.QUESTIONS[st.idx];answerNow(b,fn(q,st.idx));}
  assert(finished(b),'el test debio terminar');}

/* ---------- 1. Banco de preguntas ---------- */
const probe=boot();const {QUESTIONS:Q,BANDS,RESULTS}=probe.lt;
const J=JSON.stringify;
assert.strictEqual(J(BANDS),J(['A1','A2','B1','B2','C1','C2']));
assert.strictEqual(Q.length,30);
BANDS.forEach(b=>{assert.strictEqual(Q.filter(x=>x.band===b).length,5,'5 por nivel '+b);assert.strictEqual(Q.filter(x=>x.band===b&&x.listen).length,1,'1 listening en '+b);});
const ord=Q.map(x=>BANDS.indexOf(x.band));assert(ord.every((v,i)=>i===0||v>=ord[i-1]),'dificultad creciente (bandas en orden)');
Q.forEach((q,i)=>{const n='#'+(i+1);assert.strictEqual(q.options.length,4,'4 opciones '+n);assert.strictEqual(new Set(q.options).size,4,'opciones distintas '+n);
  assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,'correct valido '+n);assert(q.explain&&q.prompt,'texto '+n);
  assert(!/—/.test(q.prompt+q.explain+(q.context||'')),'sin raya larga en prosa '+n);
  assert(q.prompt.length<=130&&(q.context||q.transcript||'').length<=260,'texto breve '+n);});
assert.strictEqual(new Set(Q.map(q=>q.prompt)).size,30,'sin enunciados repetidos');
Q.filter(q=>q.listen).forEach(q=>assert(q.transcript&&q.transcript.length<=260,'transcripcion breve'));
BANDS.forEach(b=>assert(RESULTS[b]&&RESULTS[b].site));assert(RESULTS.A0);
// preguntas revisadas a mano (una sola respuesta defendible, ingles US y UK)
const has=s=>Q.find(q=>q.prompt.includes(s));
assert(!Q.some(q=>q.prompt.includes('The committee insisted')),'subjuntivo British/American retirado');
assert.strictEqual(J(has('the last bus').options),J(['had already left','has already left','will have already left','is already leaving']));
assert(!Q.some(q=>/woman imply/.test(q.prompt)),'el audio C2 lo responde el hombre');
ok('banco: 30 preguntas, 5 por nivel A1-C2, dificultad creciente, 1 listening por nivel, textos breves, sin repetidas');

/* ---------- 1b. Audios ---------- */
function parseCsv(txt){const rows=[];let f='',row=[],q=false;txt=txt.replace(/\r\n/g,'\n');
  for(let i=0;i<txt.length;i++){const c=txt[i];
    if(q){if(c==='"'){if(txt[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===','){row.push(f);f=''}else if(c==='\n'){row.push(f);rows.push(row);row=[];f=''}else f+=c}
  if(f||row.length){row.push(f);rows.push(row)}return rows}
const csv=parseCsv(fs.readFileSync(path.join(root,'tools','lista_audios.csv'),'utf8'));
const norm=s=>s.replace(/\s+/g,' ').trim();
let missing=[];let hasFfprobe=true;try{cp.execSync('ffprobe -version',{stdio:'ignore'})}catch(e){hasFfprobe=false}
Q.filter(q=>q.listen).forEach(q=>{
  const row=csv.find(r=>r[0]===q.listen);assert(row,'fila en lista_audios.csv para '+q.listen);
  assert.strictEqual(norm(row[1]),norm(q.transcript),'transcripcion de la pagina = texto del CSV para '+q.listen);
  if(/\n/.test(q.transcript))assert(/\|/.test(row[2]||''),'dialogo con dos voces '+q.listen);
  const f=path.join(root,q.listen);
  if(!fs.existsSync(f)){missing.push(q.listen);return}
  if(hasFfprobe){const d=parseFloat(cp.execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 "'+f+'"').toString());
    const words=q.transcript.replace(/—/g,' ').split(/\s+/).filter(Boolean).length;
    assert(d>2&&words/d>1.5&&words/d<4.5,'duracion plausible '+q.listen+' ('+d.toFixed(1)+'s, '+words+' palabras)');
    cp.execSync('ffmpeg -v error -i "'+f+'" -f null -',{stdio:'pipe'});}});
if(missing.length){console.log('PENDIENTE: faltan audios '+missing.join(', ')+'  (python generar_audios.py '+missing.join(' ')+')');
  if(process.env.STRICT_AUDIO)assert.fail('faltan audios y STRICT_AUDIO=1');}
ok('audios: transcripcion = CSV, dialogos con dos voces, mp3 validos'+(missing.length?' (FALTAN '+missing.length+')':' (los 6 existen)'));

/* ---------- 2. Calculo ---------- */
const fromCounts=(c,extraSkipped)=>{const seen={};const answers=Q.map(q=>{seen[q.band]=(seen[q.band]||0)+1;return seen[q.band]<=c[BANDS.indexOf(q.band)]?q.correct:(q.correct+1)%4});return{answers,skipped:{}}};
const calc=c=>probe.lt.computeLevel(fromCounts(c));
const show=r=>r.range?r.low+'–'+r.high:r.level;
BANDS.forEach((b,i)=>{const c=BANDS.map((_,j)=>j<=i?5:0);const r=calc(c);assert.strictEqual(r.level,b,'perfecto hasta '+b);assert(!r.range||r.low===b||r.high===b);});
assert.strictEqual(calc([5,5,5,5,5,5]).level,'C2');assert.strictEqual(calc([0,0,0,0,0,0]).level,'A0');
ok('personas perfectas hasta cada nivel dan ese nivel; todo mal da A0');

// regla anterior de produccion (4 de 6, se detiene al primer bloque bajo) y la del commit 021c3f0 (4 de 5 con un tropiezo)
function oldProd(c){let l='A0';for(let i=0;i<5;i++){if(c[i]>=4)l=BANDS[i];else break}return l}
function old021(c){let l='A0',slip=false;for(let i=0;i<6;i++){if(c[i]>=4){l=BANDS[i];continue}const nx=c[i+1];if(!slip&&c[i]>=3&&nx!==undefined&&nx>=4){slip=true;continue}break}return l}
const scen=[
 ['2,5,5,5,5,5  (fallo de produccion: A1 flojo, el resto perfecto)',[2,5,5,5,5,5]],
 ['5,5,5,5,0,5  (un bloque alto aislado)',[5,5,5,5,0,5]],
 ['5,5,0,5,5,5  (un bloque bajo aislado)',[5,5,0,5,5,5]],
 ['5,5,3,3,0,0  (dudoso entre A2 y B1/B2)',[5,5,3,3,0,0]],
 ['5,5,4,2,0,0  (B1 claro)',[5,5,4,2,0,0]],
 ['5,4,3,1,0,0',[5,4,3,1,0,0]],
 ['3,1,0,0,0,0  (principiante dudoso)',[3,1,0,0,0,0]],
 ['4,3,2,1,0,0  (descenso gradual)',[4,3,2,1,0,0]],
 ['5,5,5,3,2,0',[5,5,5,3,2,0]]];
console.log('\n  Ejemplos de puntuacion (aciertos por bloque A1..C2) | produccion | 021c3f0 | nueva');
const table={};scen.forEach(([n,c])=>{const r=calc(c);table[n]=r;console.log('  '+n.padEnd(66)+' | '+oldProd(c).padEnd(3)+' | '+old021(c).padEnd(3)+' | '+show(r)+(r.irregular?'  (aviso: irregular)':'')+'  inicio: '+r.start)});
console.log('');
// requisitos del encargo
const T=n=>table[scen.find(s=>s[0].startsWith(n))[0]];
assert.notStrictEqual(T('2,5,5,5,5,5').level,'A0');assert.notStrictEqual(T('2,5,5,5,5,5').low,'A0');assert(T('2,5,5,5,5,5').irregular,'se avisa que fue irregular');
assert(BANDS.indexOf(T('5,5,5,5,0,5').high)<=3,'un bloque alto aislado no infla: nunca pasa de B2');assert.strictEqual(T('5,5,5,5,0,5').level,'B2');
assert(BANDS.indexOf(T('5,5,0,5,5,5').level)>=4,'un bloque bajo aislado no borra los altos solidos');assert(T('5,5,0,5,5,5').irregular);
assert(T('5,5,3,3,0,0').range,'evidencia entre vecinos = rango');
assert.strictEqual(T('5,5,4,2,0,0').level,'B1');assert(!T('5,5,4,2,0,0').range);
ok('casos del encargo: 2/5 en A1 + 5/5 despues NO es A0; bloque alto aislado no infla; bloque bajo aislado no borra altos');

// rangos coherentes en TODAS las combinaciones de aciertos (6^6)
let combos=0,ranges=0;const rangeSet={};
for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)for(let c=0;c<=5;c++)for(let d=0;d<=5;d++)for(let e=0;e<=5;e++)for(let f=0;f<=5;f++){
  const r=calc([a,b,c,d,e,f]);combos++;const L=['A0',...BANDS];const lo=L.indexOf(r.low),hi=L.indexOf(r.high),bs=L.indexOf(r.level);
  assert(lo<=bs&&bs<=hi&&hi-lo<=1,'rango vecino y contiene el mejor '+[a,b,c,d,e,f]);
  assert.strictEqual(r.start,RESULTS[r.low].site,'inicio = nivel de practica del extremo bajo');
  assert.strictEqual(r.right,a+b+c+d+e+f);if(r.range){ranges++;rangeSet[r.low+'-'+r.high]=[a,b,c,d,e,f]}}
console.log('  '+combos+' combinaciones; '+ranges+' con rango ('+(ranges/combos*100).toFixed(1)+'%)');
ok('rangos siempre entre niveles vecinos, contienen el mejor y practican desde el extremo bajo');
// monotonia: acertar una pregunta mas nunca baja el nivel estimado
let mono=0;for(let t=0;t<3000;t++){const ans=Q.map(q=>Math.random()<0.5?q.correct:(q.correct+1)%4);const base=probe.lt.computeLevel({answers:ans,skipped:{}});
  const wr=ans.map((a,i)=>a!==Q[i].correct?i:-1).filter(i=>i>=0);if(!wr.length)continue;const i=wr[Math.floor(Math.random()*wr.length)];
  const a2=ans.slice();a2[i]=Q[i].correct;const up=probe.lt.computeLevel({answers:a2,skipped:{}});
  assert(['A0',...BANDS].indexOf(up.level)>=['A0',...BANDS].indexOf(base.level),'monotonia');mono++;}
ok('monotonia: acertar una mas nunca baja el nivel ('+mono+' casos)');
// azar
const NR=60000;const g={};let ge=0,hiB1=0,rng=0;const L=['A0',...BANDS];
for(let t=0;t<NR;t++){const r=probe.lt.computeLevel({answers:Q.map(q=>Math.floor(Math.random()*4)),skipped:{}});g[r.level]=(g[r.level]||0)+1;if(L.indexOf(r.level)>=2)ge++;if(L.indexOf(r.high)>=3)hiB1++;if(r.range)rng++;}
console.log('  azar: '+L.map(l=>l+' '+((g[l]||0)/NR*100).toFixed(2)+'%').join(', ')+' | con rango '+(rng/NR*100).toFixed(1)+'%');
assert(g.A0/NR>0.95,'adivinar casi siempre da A0');assert(ge/NR<0.01,'adivinar da A2 o mas en <1%');assert(hiB1/NR<0.005,'adivinar casi nunca roza B1');
ok('respuestas al azar: A0 '+(g.A0/NR*100).toFixed(1)+'%, A2 o mas '+(ge/NR*100).toFixed(2)+'%');
// sin respuestas
const none=probe.lt.computeLevel({answers:[],skipped:{}});assert.strictEqual(none.level,'A0');assert(!none.range);ok('sin respuestas: A0 sin rango');
// preguntas de audio omitidas no cuentan: mismo resultado que si no existieran
const skipAns=Q.map(q=>q.listen?null:q.correct),skipMap={};Q.forEach((q,i)=>{if(q.listen)skipMap[i]=true});
const rs=probe.lt.computeLevel({answers:skipAns,skipped:skipMap});assert.strictEqual(rs.level,'C2');assert.strictEqual(rs.skipped,6);assert.strictEqual(rs.answered,24);
const wrongAudio=probe.lt.computeLevel({answers:Q.map(q=>q.listen?(q.correct+1)%4:q.correct),skipped:{}});
assert(rs.scores[6]-rs.scores[5]>wrongAudio.scores[6]-wrongAudio.scores[5],'omitir no castiga como fallar');
ok('audios omitidos: no cuentan (24 respuestas, 6 omitidas) y no se tratan como incorrectas');

/* ---------- 3. Banco ampliable ---------- */
const extra=[1,2].map(n=>"    { band:'B1', prompt:\"Extra question "+n+" ___ test.\", options:[\"is\",\"are\",\"am\",\"be\"], correct:0, explain:\"Extra.\" }").join(',\n');
const bx=boot({extra});assert.strictEqual(bx.lt.QUESTIONS.length,32);
const cb=bx.lt.computeLevel({answers:bx.lt.QUESTIONS.map(q=>q.correct),skipped:{}});assert.strictEqual(cb.count.B1,7);assert.strictEqual(cb.level,'C2');assert.strictEqual(cb.answered,32);

runAll(bx,q=>'right');assert(/32 de 32/.test(bx.text())&&/>7\/7</.test(bx.text()),'barras y total se ajustan a 32');
const bx2=boot({extra});assert(/32 preguntas, de m/.test(bx2.text()),'la portada cuenta las preguntas del banco');
ok('banco ampliable: con 32 preguntas (7 en B1) el conteo, las barras y el calculo se ajustan solos');

/* ---------- 4. Flujo completo, perfil, enlace y eventos ---------- */
let b=boot();assert(/¿Listo para descubrir tu nivel\?/.test(b.text()));assert(/30 preguntas, de más fácil/.test(b.text()));
runAll(b,()=> 'right');
assert(/>C2</.test(b.text())&&/30 de 30/.test(b.text()));assert(/estimado: se basa en tus respuestas de lectura, listening, gramática y vocabulario/.test(b.text()),'frase de estimacion');
assert(/href="practica\.html\?level=avanzado"/.test(b.text()));assert.strictEqual(b.profile.p.level,'avanzado');assert.strictEqual(b.profile.p.levelTest,'C2');
assert.strictEqual(J(b.levelCalls.slice(-1)[0]),J(['avanzado','test']));
assert(b.events.some(e=>e[0]==='level_test_started')&&b.events.some(e=>e[0]==='level_test_completed'&&e[1].level==='C2')&&b.events.some(e=>e[0]==='test_complete'));
assert(JSON.parse(b.store.leoLevelTestV3).done===true);
ok('flujo completo por clics: 30 correctas = C2, frase de estimacion, perfil y enlace avanzado, eventos intactos');
// todos los niveles por clics
BANDS.forEach((lv,i)=>{const bb=boot();runAll(bb,q=>BANDS.indexOf(q.band)<=i?'right':'wrong');assert(new RegExp('class="lt-level">'+lv+'<').test(bb.text()),'por clics '+lv);
  assert(bb.text().includes('practica.html?level='+RESULTS[lv].site));assert.strictEqual(bb.profile.p.level,RESULTS[lv].site);});
{const bb=boot();runAll(bb,()=> 'wrong');assert(/class="lt-level">A0</.test(bb.text())&&/level=principiante/.test(bb.text()));}
ok('flujo por clics para los seis niveles y A0: nivel mostrado, perfil y enlace coinciden');
// rango por clics: perfil y enlace usan el mismo nivel de practica
Object.keys(rangeSet).forEach(k=>{const c=rangeSet[k],seen={};const bb=boot();
  runAll(bb,(q)=>{seen[q.band]=(seen[q.band]||0)+1;return seen[q.band]<=c[BANDS.indexOf(q.band)]?'right':'wrong'});
  const [lo,hi]=k.split('-');const start=RESULTS[lo].site;
  assert(bb.text().includes('class="lt-level">'+lo+'–'+hi+'<'),'rango mostrado '+k+' -> '+bb.text().match(/class="lt-level">([^<]*)</)[1]);
  assert(bb.text().includes('href="practica.html?level='+start+'"'),'enlace '+k);assert.strictEqual(bb.profile.p.level,start,'perfil '+k);
  assert.strictEqual(J(bb.levelCalls.slice(-1)[0]),J([start,'test']));assert.strictEqual(bb.profile.p.levelTestRange,lo+'–'+hi);
  assert(new RegExp('Empieza a practicar en el nivel').test(bb.text()));});
console.log('  rangos probados por clics: '+Object.keys(rangeSet).join(', '));
ok('rango por clics: se muestra, se guarda y se enlaza el nivel de practica del extremo bajo');
// patron irregular por clics
{const c=[2,5,5,5,5,5],seen={};const bb=boot();runAll(bb,q=>{seen[q.band]=(seen[q.band]||0)+1;return seen[q.band]<=c[BANDS.indexOf(q.band)]?'right':'wrong'});
 assert(!/class="lt-level">A0</.test(bb.text()));assert(/id="ltIrregular"/.test(bb.text()));}
ok('bloques contradictorios por clics: 2/5 en A1 y 5/5 despues no da A0 y avisa que fue irregular');
// revision de respuestas
{const bb=boot();runAll(bb,(q,i)=>i===0?'wrong':'right');bb.ctx.document.getElementById('ltReview').style.display='none';bb.els.ltReviewBtn.handlers.click.call(bb.els.ltReviewBtn);assert(/Tu respuesta:/.test(bb.els.ltReview.innerHTML));}
ok('"Ver mis respuestas" muestra la correccion con explicacion');
// el orden de opciones se baraja (la correcta no queda siempre en la misma posicion)
{const pos={};for(let t=0;t<60;t++){const s=boot();s.els.ltStart.handlers.click();const st=s.state();Q.forEach((q,i)=>{pos[st.orders[i].indexOf(q.correct)]=(pos[st.orders[i].indexOf(q.correct)]||0)+1});}
 [0,1,2,3].forEach(p=>assert(pos[p]>1800*0.15,'posicion '+p+' usada: '+pos[p]));}
ok('opciones barajadas: la respuesta correcta aparece en las 4 posiciones');

/* ---------- 5. Fallo de audio ---------- */
(async()=>{
  // a) el audio falla: se ofrece reintentar o continuar; omitir no es una respuesta incorrecta
  let a=boot({audio:'error'});a.els.ltStart.handlers.click();
  for(let i=0;i<4;i++)answerNow(a,'right');
  await tick();
  assert(a.els.ltAudioRetry&&a.els.ltAudioSkip,'aparecen Reintentar y Continuar sin audio');
  assert(a.els.ltOpts.children.every(x=>x.disabled),'las opciones quedan bloqueadas mientras el audio falla');
  assert(a.events.some(e=>e[0]==='level_test_audio_failed'));
  a.els.ltAudioSkip.handlers.click();
  let st=a.state();assert.strictEqual(st.idx,5);assert.strictEqual(st.answers[4],null);assert.strictEqual(st.skipped[4],true);
  while(!finished(a)){const cur=a.state(),q=a.lt.QUESTIONS[cur.idx];if(q.listen){await tick();a.els.ltAudioSkip.handlers.click();}else answerNow(a,'right');}
  assert(/>C2</.test(a.text())&&/24 de 24/.test(a.text())&&/No contamos 6 preguntas de audio/.test(a.text()),'6 audios omitidos no bajan el nivel');
  ok('fallo de audio: opciones bloqueadas, "Continuar sin este audio" no cuenta como incorrecta (C2 con 24 de 24)');
  // b) reintento que funciona
  a=boot({audio:'error'});a.els.ltStart.handlers.click();for(let i=0;i<4;i++)answerNow(a,'right');await tick();
  a.Audio.mode='ok';a.els.ltAudioRetry.handlers.click();await tick();
  assert(a.els.ltOpts.children.every(x=>!x.disabled),'tras reintentar se pueden responder');
  assert(a.audios[a.audios.length-1].played===1&&/\?r=/.test(a.audios[a.audios.length-1].src),'el reintento pide el archivo de nuevo');
  answerNow(a,'right');assert.strictEqual(a.state().idx,5);assert.strictEqual(a.state().skipped[4],undefined);
  ok('reintentar el audio: vuelve a cargar y se puede responder normalmente');
  // c) el navegador pide un toque (NotAllowedError): no es fallo
  a=boot({audio:'denied'});a.els.ltStart.handlers.click();for(let i=0;i<4;i++)answerNow(a,'right');a.els.ltPlay.handlers.click();await tick();
  assert(!a.els.ltAudioRetry,'NotAllowedError no muestra el aviso de fallo');
  // d) play falla de verdad / lanza error
  a=boot({audio:'playfail'});a.els.ltStart.handlers.click();for(let i=0;i<4;i++)answerNow(a,'right');a.els.ltPlay.handlers.click();await tick();assert(a.els.ltAudioRetry,'play rechazado = fallo');
  a=boot({audio:'syncthrow'});a.els.ltStart.handlers.click();for(let i=0;i<4;i++)answerNow(a,'right');a.els.ltPlay.handlers.click();await tick();assert(a.els.ltAudioRetry,'play que lanza = fallo');
  a=boot({audio:'throw'});a.els.ltStart.handlers.click();for(let i=0;i<4;i++)answerNow(a,'right');assert(a.els.ltAudioRetry,'sin soporte de Audio = fallo');
  ok('fallos de reproduccion detectados (error de carga, play rechazado, excepcion) y toque requerido no es fallo');
  // e) reproduccion normal
  a=boot();a.els.ltStart.handlers.click();for(let i=0;i<4;i++)answerNow(a,'right');a.els.ltPlay.handlers.click();assert.strictEqual(a.audios[0].played,1);assert(!a.els.ltAudioRetry);
  ok('reproduccion normal: un clic reproduce el audio sin avisos');

  /* ---------- 6. Reanudacion ---------- */
  const store={};let r1=boot({store});r1.els.ltStart.handlers.click();for(let i=0;i<7;i++)answerNow(r1,i%2?'wrong':'right');
  const saved=r1.state();assert.strictEqual(saved.idx,7);
  const r2=boot({store});assert(/Tienes un test a medias/.test(r2.text())&&/pregunta 8 de 30/.test(r2.text()));
  r2.els.ltStart.handlers.click();assert(/Pregunta 8 de 30/.test(r2.text()));assert.strictEqual(J(r2.state().orders),J(saved.orders),'mismo orden de opciones');
  assert.strictEqual(J(r2.state().answers),J(saved.answers));
  assert(!r2.events.some(e=>e[0]==='level_test_started'),'continuar no cuenta como inicio nuevo');
  while(!finished(r2))answerNow(r2,'right');
  const expectedAns=Q.map((q,i)=>i<7?(i%2?(q.correct+1)%4:q.correct):q.correct);
  assert.strictEqual(r2.text().match(/Acertaste (\d+) de/)[1],String(expectedAns.filter((a,i)=>a===Q[i].correct).length),'el resultado usa las respuestas de antes y de despues');
  // ya terminado: abre directo el resultado
  const r3=boot({store});assert(finished(r3));assert(!r3.events.some(e=>e[0]==='level_test_completed'),'no se reenvia el evento al volver a ver el resultado');
  // "Empezar de nuevo"
  const store2={};const q1=boot({store:store2});q1.els.ltStart.handlers.click();answerNow(q1,'right');const q2=boot({store:store2});q2.els.ltRestart.handlers.click();assert(/Pregunta 1 de 30/.test(q2.text()));
  ok('reanudacion: continua en la pregunta correcta con el mismo orden y respuestas; el resultado final suma ambas partes');
  // intento de otra version del banco / datos danados / claves viejas
  const s3=Object.assign({},saved,{sig:'30:1234'});const st3={leoLevelTestV3:JSON.stringify(s3)};const r4=boot({store:st3});
  assert(/¿Listo para descubrir tu nivel\?/.test(r4.text()),'un intento de otra version del banco se descarta');assert(!('leoLevelTestV3' in st3));
  const r5=boot({store:{leoLevelTestV3:'{rota'}});assert(/¿Listo/.test(r5.text()));
  const r6=boot({store:{leoLevelTestV3:JSON.stringify({sig:probe.lt.SIG,idx:99,orders:[],answers:[]})}});assert(/¿Listo/.test(r6.text()));
  const old={leoLevelTestV2:'x',leoLevelTestV1:'y'};boot({store:old});assert(!('leoLevelTestV2' in old)&&!('leoLevelTestV1' in old));
  ok('reanudacion segura: otra version del banco, datos danados o incompletos empiezan limpio; claves V1/V2 se borran');

  console.log('\n'+groups+' grupos OK'+(missing.length?'  |  PENDIENTE DE PUBLICACION: falta el mp3 '+missing.join(', '):''));
})().catch(e=>{console.error(e);process.exit(1)});
