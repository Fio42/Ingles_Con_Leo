#!/usr/bin/env node
/* Leo AI como tutor COMPLEMENTARIO (lado de la página): recomendación de práctica solo con errores repetidos en un tema,
   usando el Plan de estudio existente, y la línea "ya tienes lo necesario" cuando no hay nada nuevo.
   Corre con:  node tools/tests/leo-ai-complementario.test.js   (desde la carpeta inglesconLeo)
   Usa data.js, temas.js y app.js REALES. No llama a ningún servidor. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function fakeEl(tag){
  let h = '', t = null;
  const e = { tag, children:[], className:'', href:'', style:{}, hidden:false,
    classList:{ add(c){ e.className += ' ' + c; }, remove(){}, toggle(){}, contains(c){ return (' ' + e.className + ' ').includes(' ' + c + ' '); } },
    appendChild(c){ e.children.push(c); return c; }, setAttribute(){}, addEventListener(){}, remove(){},
    set innerHTML(v){ h = String(v); t = null; e.children = []; }, get innerHTML(){ return h; },
    set textContent(v){ t = String(v); }, get textContent(){ return t !== null ? t : h.replace(/<[^>]*>/g, ''); } };
  return e;
}
function load(){
  const store = {}, noop = ()=>{};
  const ctx = { console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body:fakeEl('body'), documentElement:fakeEl('html'), createElement:fakeEl },
    location:{ hash:'', search:'', pathname:'/gramatica.html' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop }), LeoBackend:{ askLeoAI: async()=>({ ok:false }) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(read('data.js'), ctx);
  vm.runInContext(read('temas.js'), ctx);
  vm.runInContext(read('app.js') + ';this.__t = { renderLeoAiAnswer, leoAiRepeatPractice, buildLeoAiPayload, setStats:m=>{ _mistakeStatsCache = m; }, G:GRAMMAR_BANK, temaForTopic, LEO_AI_REPEAT_MIN };', ctx);
  return ctx;
}
let passed = 0, failed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 3).join('\n       ')); } }
console.log('Leo AI complementario (página)');

const c = load(), T = c.__t;
// Un tema real con al menos 4 ejercicios de gramática (de cualquier nivel).
let groups = null;
Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g => { if(!groups && g.items.length >= 4 && T.temaForTopic(g.topic)) groups = g; })));
assert(groups, 'no hay un tema con 4 ejercicios para probar');
const ids = groups.items.map(i => i.id), item = groups.items[0];
const stat = (id, fails) => ({ item_id:id, status:'active', fail_count:fails || 1, last_seen_at:new Date().toISOString(), correct_streak:0 });
const stats = list => new Map(list.map(s => [s.item_id, s]));
const ctxFail = { kind:'grammar', item, isCorrect:false, userAnswer:'x' };

test('un solo error en el tema NO recomienda nada (aunque sea el primero)', ()=>{
  c.__leoMemberVerified = true; T.setStats(stats([]));
  assert.strictEqual(T.leoAiRepeatPractice(ctxFail), null);
  T.setStats(stats([stat(ids[1])]));
  assert.strictEqual(T.leoAiRepeatPractice(ctxFail), null, 'dos errores del tema todavía no es un patrón');
});
test('varios errores en el mismo tema recomiendan el Plan de estudio con foco (mismo destino que "Hoy te conviene")', ()=>{
  c.__leoMemberVerified = true; T.setStats(stats([stat(ids[1]), stat(ids[2])]));
  const r = T.leoAiRepeatPractice(ctxFail);
  assert(r && /^plan-estudio\.html\?foco=/.test(r.href), 'apunta al Plan de estudio: ' + (r && r.href));
  assert(/empezar=1/.test(r.href), 'abre la práctica enfocada');
  assert(/Varios errores en /.test(r.text) && !/—/.test(r.text));
});
test('el mismo ejercicio fallado antes + otro del tema SÍ es patrón; el mismo solo (sin otro) no', ()=>{
  c.__leoMemberVerified = true; T.setStats(stats([stat(ids[0], 2), stat(ids[1])]));
  assert(T.leoAiRepeatPractice(ctxFail), 'fallar de nuevo el mismo ejercicio con otro del tema pendiente');
  T.setStats(stats([stat(ids[0], 3)]));
  assert.strictEqual(T.leoAiRepeatPractice(ctxFail), null, 'un solo ejercicio no es un tema con errores');
});
test('no recomienda si acertó, si no es miembro (el Plan es de miembros) o si el ejercicio no tiene tema', ()=>{
  T.setStats(stats([stat(ids[1]), stat(ids[2])]));
  c.__leoMemberVerified = true;
  assert.strictEqual(T.leoAiRepeatPractice(Object.assign({}, ctxFail, { isCorrect:true })), null);
  assert.strictEqual(T.leoAiRepeatPractice({ kind:'grammar', item:{ id:'no-existe' }, isCorrect:false }), null);
  assert.strictEqual(T.leoAiRepeatPractice(null), null);
  c.__leoMemberVerified = false;
  assert.strictEqual(T.leoAiRepeatPractice(ctxFail), null, 'cuenta gratis: sin enlace al Plan');
});
test('los errores de OTRO tema no cuentan', ()=>{
  c.__leoMemberVerified = true;
  let other = null; Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g => { const a = T.temaForTopic(g.topic), b = T.temaForTopic(groups.topic); if(!other && a && b && a.id !== b.id && g.items.length >= 2) other = g; })));
  assert(other, 'hace falta otro tema');
  T.setStats(stats([stat(other.items[0].id), stat(other.items[1].id)]));
  assert.strictEqual(T.leoAiRepeatPractice(ctxFail), null);
});

const out = () => fakeEl('div');
const kids = (o, tag) => o.children.filter(k => k.tag === tag);
const payload = T.buildLeoAiPayload(ctxFail);
test('explicación nueva: se muestra igual y SOLO añade el enlace al Plan cuando hay errores repetidos', ()=>{
  c.__leoMemberVerified = true;
  const res = { ok:true, answer:{ explanation:'Truco: piensa en "yesterday" como una señal de pasado.', example_en:'', example_es:'' } };
  T.setStats(stats([])); let o = out(); T.renderLeoAiAnswer(o, payload, res, ctxFail);
  assert.strictEqual(kids(o, 'a').length, 0, 'sin patrón: nada que recomendar');
  assert(kids(o, 'p').some(p => /Truco/.test(p.textContent)));
  T.setStats(stats([stat(ids[1]), stat(ids[2])])); o = out(); T.renderLeoAiAnswer(o, payload, res, ctxFail);
  const a = kids(o, 'a'); assert.strictEqual(a.length, 1); assert(/plan-estudio\.html/.test(a[0].href)); assert(/leo-ai-focus/.test(a[0].className));
});
test('un fallo técnico (incluida una salida inválida) es un error, nunca un mensaje pedagógico, y no recomienda nada', ()=>{
  c.__leoMemberVerified = true; T.setStats(stats([stat(ids[1]), stat(ids[2])]));
  ['bad_output', 'timeout', 'no_extra'].forEach(reason => {
    const o = out(); T.renderLeoAiAnswer(o, payload, { ok:false, reason }, ctxFail);
    assert(/is-error/.test(o.className), reason + ' se muestra como error');
    assert(!kids(o, 'p').some(p => /ya tienes lo necesario|suficiente/.test(p.textContent)), 'sin mensaje pedagógico');
    assert.strictEqual(kids(o, 'a').length, 0);
  });
  assert(!/no_extra|ya tienes lo necesario/.test(read('app.js')), 'app.js ya no tiene el caso no_extra');
});
test('el payload que viaja al servidor NO cambia (sin ids de ejercicio, sin historial)', ()=>{
  const keys = Object.keys(payload).sort().join(',');
  assert.strictEqual(keys, 'baseExplanation,correctAnswer,exerciseType,isCorrect,level,mode,options,question,shownExamples,skill,studentAnswer,topic');
});
test('el umbral y el destino reutilizan lo existente (sin motor nuevo)', ()=>{
  const src = read('app.js');
  assert.strictEqual(T.LEO_AI_REPEAT_MIN, 3);
  assert(/diagMistakeSummary\(collectDiagAttempts\(loadProgress\(\)\), stats, Date\.now\(\)\)/.test(src), 'usa el diagnóstico existente');
  assert(/contentForTema\(temaId\)/.test(src));
});
console.log((failed ? failed + ' prueba(s) fallaron, ' : '') + passed + ' pruebas pasaron');
process.exit(failed ? 1 : 0);
