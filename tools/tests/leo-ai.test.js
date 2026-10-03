#!/usr/bin/env node
/* Pruebas de Leo AI del lado de la página (app.js): interruptores y datos que se envían.
   Corre con:  node tools/tests/leo-ai.test.js   (desde la carpeta inglesconLeo)
   Usa el app.js y data.js REALES. No llama a ningún servidor. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const dataSrc = fs.readFileSync(path.join(root, 'data.js'), 'utf8');

function load(src, opts){
  opts = opts || {};
  const store = {};
  const noop = ()=>{};
  // Elemento mínimo: stripHtmlForAi usa innerHTML -> textContent.
  const el = ()=>{ let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
    set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: el(), documentElement: el(), createElement: el },
    location:{ hash:'', search: opts.search || '', pathname:'/gramatica.html' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop }),
    LeoBackend:{ askLeoAI: async()=>({ ok:false, reason:'test' }) }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(dataSrc, ctx);
  vm.runInContext(src + `;this.__t = { isLeoAiEnabled, buildLeoAiPayload, leoAiDefaultLabel, G:GRAMMAR_BANK, V:VOCAB_BANK, L:LISTENING_BANK, R:READING_BANK, W:WRITING_BANK };`, ctx);
  ctx.__store = store;
  return ctx;
}
const flat = bank => { const o = []; Object.keys(bank).forEach(l => bank[l].forEach(v => v.forEach(x => o.push(x)))); return o; };
const flatGrammar = bank => { const o = []; Object.keys(bank).forEach(l => bank[l].forEach(v => v.forEach(g => g.items.forEach(i => o.push(i))))); return o; };

let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}
console.log('Leo AI (página)');

test('en el código real: encendido y público, pero solo para miembros verificados', ()=>{
  assert(/const LEO_AI_ENABLED = true;/.test(appSrc), 'LEO_AI_ENABLED debe ser true');
  assert(/const LEO_AI_PUBLIC = true;/.test(appSrc), 'LEO_AI_PUBLIC debe ser true');
  let c = load(appSrc);
  assert.strictEqual(c.__t.isLeoAiEnabled(), false, 'no miembro (práctica gratis): no lo ve');
  c.__leoMemberVerified = true;
  assert.strictEqual(c.__t.isLeoAiEnabled(), true, 'miembro: lo ve sin necesidad de ?ia=1');
});
test('con el interruptor apagado nadie lo ve', ()=>{
  const c = load(appSrc.replace(/const LEO_AI_ENABLED = true;/, 'const LEO_AI_ENABLED = false;'), { search:'?ia=1' });
  c.__leoMemberVerified = true;
  assert.strictEqual(c.__t.isLeoAiEnabled(), false);
});

// Copia con el interruptor encendido, solo para probar las demás reglas.
const onSrc = appSrc.replace(/const LEO_AI_PUBLIC = true;/, 'const LEO_AI_PUBLIC = false;');

test('encendido: un NO miembro nunca ve Leo AI (ni con modo prueba)', ()=>{
  const c = load(onSrc, { search:'?ia=1' });
  assert.strictEqual(c.__t.isLeoAiEnabled(), false);
});
test('encendido: miembro sin modo prueba no lo ve (todavía no es público)', ()=>{
  const c = load(onSrc);
  c.__leoMemberVerified = true;
  assert.strictEqual(c.__t.isLeoAiEnabled(), false);
});
test('encendido: miembro con ?ia=1 lo ve, y ?ia=0 lo apaga', ()=>{
  let c = load(onSrc, { search:'?ia=1' });
  c.__leoMemberVerified = true;
  assert.strictEqual(c.__t.isLeoAiEnabled(), true);
  c = load(onSrc, { search:'?ia=0' });
  c.__leoMemberVerified = true;
  assert.strictEqual(c.__t.isLeoAiEnabled(), false);
});
test('encendido y público: lo ven todos los miembros, pero no los demás', ()=>{
  const c = load(onSrc.replace('const LEO_AI_PUBLIC = false;', 'const LEO_AI_PUBLIC = true;'));
  assert.strictEqual(c.__t.isLeoAiEnabled(), false);
  c.__leoMemberVerified = true;
  assert.strictEqual(c.__t.isLeoAiEnabled(), true);
});

const c = load(appSrc);
const T = c.__t;
const ALLOWED = ['mode','skill','level','topic','exerciseType','question','options','studentAnswer','correctAnswer','isCorrect','baseExplanation','context','target','example','unit','pageOk'];
const FORBIDDEN = /"(id|itemId|userId|user_id|email|name|token|access_token|history|sessions)"\s*:/;
function checkPrivacy(p, name){
  Object.keys(p).forEach(k => assert(ALLOWED.indexOf(k) !== -1, name + ': campo no permitido ' + k));
  assert(!FORBIDDEN.test(JSON.stringify(p)), name + ': dato personal o id en ' + JSON.stringify(p));
}

test('Gramática (las 3 formas de ejercicio): respuesta correcta real, tema y sin datos personales', ()=>{
  const items = flatGrammar(T.G);
  ['choice','fill','error'].forEach(type=>{
    const it = items.find(i => i.type === type);
    const user = type === 'choice' ? it.options[(it.correct + 1) % it.options.length] : (type === 'fill' ? 'xx' : 'is');
    const p = T.buildLeoAiPayload({ kind:'grammar', item:it, isCorrect:false, userAnswer:user });
    assert(p, type + ': sin payload');
    checkPrivacy(p, type);
    assert.strictEqual(p.mode, 'explain'); assert.strictEqual(p.skill, 'grammar'); assert.strictEqual(p.isCorrect, false);
    assert(p.topic, type + ': falta el tema');
    assert(!('context' in p), type + ': gramática no manda texto ni transcripción');
    if(type === 'choice') assert.strictEqual(p.correctAnswer, it.options[it.correct]);
    if(type === 'fill') assert.strictEqual(p.correctAnswer, it.correct);
    if(type === 'error') assert(p.correctAnswer.includes(it.right));
  });
  // cada ejercicio de gramática del banco arma su payload
  items.forEach(it => assert(T.buildLeoAiPayload({ kind:'grammar', item:it, isCorrect:true, userAnswer:'x' }), 'sin payload: ' + it.id));
});

test('Vocabulario, Listening y Lectura: respuesta correcta del banco; texto/transcripción solo donde corresponde', ()=>{
  const v = flat(T.V)[0], l = flat(T.L)[0], r = flat(T.R)[0];
  const pv = T.buildLeoAiPayload({ kind:'vocab', item:v, isCorrect:true, userAnswer:v.quiz.options[v.quiz.correct] });
  const pl = T.buildLeoAiPayload({ kind:'listening', item:l, isCorrect:false, userAnswer:'x' });
  const pr = T.buildLeoAiPayload({ kind:'reading', item:r, isCorrect:false, userAnswer:'x' });
  [[pv,'vocab'],[pl,'listening'],[pr,'reading']].forEach(([p,n]) => { assert(p, n); checkPrivacy(p, n); });
  assert.strictEqual(pv.correctAnswer, v.quiz.options[v.quiz.correct]); assert(!('context' in pv));
  assert.strictEqual(pl.correctAnswer, l.options[l.correct]); assert.strictEqual(pl.context, l.transcript);
  assert.strictEqual(pr.correctAnswer, r.options[r.correct]); assert(pr.context.length > 20);
  [T.V, T.L, T.R].forEach((bank, i)=> flat(bank).forEach(it => assert(T.buildLeoAiPayload({ kind:['vocab','listening','reading'][i], item:it, isCorrect:true, userAnswer:'x' }), 'sin payload: ' + it.id)));
});

test('Writing: manda consigna, estructura, ejemplo y la frase; con 1 palabra SÍ hay botón (solo falta si no escribió nada)', ()=>{
  const w = flat(T.W)[0];
  const p = T.buildLeoAiPayload({ kind:'writing', item:w, userAnswer:'I have a red car' });
  checkPrivacy(p, 'writing');
  assert.strictEqual(p.mode, 'writing'); assert.strictEqual(p.studentAnswer, 'I have a red car');
  assert.strictEqual(T.buildLeoAiPayload({ kind:'writing', item:w, userAnswer:'car' }).studentAnswer, 'car');
  assert.strictEqual(T.buildLeoAiPayload({ kind:'writing', item:w, userAnswer:'   ' }), null);
});

test('Tu diagnóstico: solo números ya procesados del tema, nunca el historial', ()=>{
  const unit = { key:'family:preposiciones', label:'Preposiciones', current:42, n:31, trend:null, prevAcc:null, recentAcc:null, activeMistakes:6, repeatedMistakes:3, items:12, lastWhen:123, wilsonLow:0.3 };
  const p = T.buildLeoAiPayload({ kind:'diagnosis', unit });
  checkPrivacy(p, 'diagnosis');
  assert.deepStrictEqual(Object.keys(p.unit).sort(), ['answered','current','label','pendingMistakes','previous','recent','repeatedMistakes','trend'].sort());
  assert.strictEqual(p.unit.trend, 'none'); assert.strictEqual(p.unit.previous, null);
});

test('etiquetas del botón según el caso', ()=>{
  assert.strictEqual(T.leoAiDefaultLabel({ kind:'grammar', isCorrect:false }), 'Explícame por qué');
  assert.strictEqual(T.leoAiDefaultLabel({ kind:'grammar', isCorrect:false, reviewMode:true }), 'Explícame este error');
  assert.strictEqual(T.leoAiDefaultLabel({ kind:'vocab', isCorrect:true }), '¿Por qué es correcta?');
  assert.strictEqual(T.leoAiDefaultLabel({ kind:'writing' }), 'Revisar mi frase con Leo AI');
  assert.strictEqual(T.leoAiDefaultLabel({ kind:'diagnosis' }), '¿Por qué es mi punto débil?');
});

test('datos incompletos o raros: no hay payload (y por lo tanto no hay botón)', ()=>{
  assert.strictEqual(T.buildLeoAiPayload(null), null);
  assert.strictEqual(T.buildLeoAiPayload({ kind:'speaking', item:{} }), null);
  assert.strictEqual(T.buildLeoAiPayload({ kind:'diagnosis', unit:null }), null);
  assert.strictEqual(T.buildLeoAiPayload({ kind:'grammar', item:{ type:'otro' }, userAnswer:'x' }), null);
});

console.log((failed ? failed + ' prueba(s) fallaron, ' : '') + passed + ' pruebas pasaron');
process.exit(failed ? 1 : 0);
