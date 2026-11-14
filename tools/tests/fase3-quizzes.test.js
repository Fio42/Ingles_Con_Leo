#!/usr/bin/env node
/* FASE 3: Reading y quizzes de artículos conectados al seguimiento existente (mistake_stats / diagnóstico / temas.js).
   Corre con:  node tools/tests/fase3-quizzes.test.js   (desde la carpeta inglesconLeo). Usa data.js, temas.js y app.js REALES. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert'), cp = require('child_process');
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

function load(opts){
  opts = opts || {};
  const store = {};
  if(opts.account) store['sb-test-auth-token'] = JSON.stringify({ user:{ id: opts.account } });
  const handlers = {}, calls = [], noop = ()=>{};
  const ctx = { console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; }, key:i=> Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
    sessionStorage:{ getItem:()=>null, setItem:noop, removeItem:noop },
    document:{ addEventListener:(n,f)=>{ (handlers[n] = handlers[n] || []).push(f); }, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body:fakeEl('body'), documentElement:fakeEl('html'), createElement:fakeEl },
    location:{ hash:'', search:'', pathname:'/articulo-in-on-at.html' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop }),
    LeoBackend:{ isConfigured:()=>true, applyMistakeResults: async items => { calls.push(items); return {}; }, askLeoAI: async()=>({ ok:false }) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(read('data.js'), ctx);
  vm.runInContext(read('temas.js'), ctx);
  vm.runInContext(read('app.js') + ';this.__t = { getDiagItemIndex, getTrackedFound, getArticleFound, articleQuizRecord, articleQuizLoad, articleQuizAttempts, articleQuizFailedIds, articleQuizReinforceHtml, collectDiagAttempts, diagMistakeSummary, loadProgress, ARTICLE_QUIZ_CATALOG, TEMA_BY_ID, DIAG_KIND_TO_SKILL, getMistakesItemIndex, READING_BANK, sessionReinforceRows, diagTemaIdForFound, getFreeAcctExerciseCount, freeDailyLimitReached, updateMistakeStatsFromResults, freeMemoryWeakSpots, setFreeAcct: id => { _leoAccessTier = "free"; _leoAccessProfile = { id: id }; }, setStats: m => { _mistakeStatsCache = m; } }', ctx);
  ctx.__handlers = handlers; ctx.__calls = calls; ctx.__store = store;
  return ctx;
}
let passed = 0, failed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 3).join('\n       ')); } }
console.log('Fase 3: Reading y quizzes de artículos');

test('el catálogo de preguntas no se desfasa de los artículos (generador --check)', ()=>{
  cp.execFileSync('node', [path.join(root, 'tools', 'gen-article-quiz-catalog.js'), '--check'], { cwd: root, stdio: 'pipe' });
});

const guest = load(), acct = load({ account:'user-aaa' }), other = load({ account:'user-bbb' });
const Q = { file:'/articulo-in-on-at.html', root:'prepQuiz1', n:2 };
const QID = 'aq:in-on-at:prepQuiz1:2';

test('cada pregunta del catálogo tiene id estable, tema real y habilidad de gramática', ()=>{
  const T = acct.__t; let n = 0;
  Object.keys(T.ARTICLE_QUIZ_CATALOG).forEach(slug => { const a = T.ARTICLE_QUIZ_CATALOG[slug]; assert(T.TEMA_BY_ID[a.tema], 'tema real: ' + a.tema);
    Object.keys(a.quizzes).forEach(r => { for(let i = 0; i < a.quizzes[r]; i++){ const id = 'aq:' + slug + ':' + r + ':' + i; const f = T.getDiagItemIndex().get(id); assert(f && f.kind === 'article' && f.tema === a.tema, id); assert.strictEqual(T.diagTemaIdForFound(f), a.tema); n++; } }); });
  assert.strictEqual(n, 152);
  assert.strictEqual(T.DIAG_KIND_TO_SKILL.article, 'gramatica');
  assert.strictEqual(T.getArticleFound('aq:in-on-at:prepQuiz1:99'), null, 'pregunta inexistente');
  assert.strictEqual(T.getArticleFound('aq:in-on-at:nopeQuiz:0'), null);
});
test('invitado: puede responder pero NO se guarda nada', ()=>{
  assert.strictEqual(guest.__t.articleQuizRecord(Object.assign({ ok:false }, Q)), false);
  assert(!Object.keys(guest.__store).some(k => /leo_article_quiz/.test(k)));
  assert.strictEqual(guest.__calls.length, 0);
  assert.strictEqual(JSON.stringify(guest.__t.articleQuizAttempts()), JSON.stringify([]));
});
test('cuenta: guarda en SU espacio, usa el mismo motor (applyMistakeResults solo miembros) y no duplica', ()=>{
  const T = acct.__t;
  acct.__leoMemberVerified = false;   // gratis: solo local
  assert.strictEqual(T.articleQuizRecord(Object.assign({ ok:false }, Q)), true);
  assert.strictEqual(acct.__calls.length, 0, 'cuenta gratis: nada en mistake_stats');
  assert(Object.keys(acct.__store).some(k => /leo_article_quiz_v1@@u:user-aaa/.test(k)), Object.keys(acct.__store).join());
  assert.strictEqual(JSON.stringify(T.articleQuizFailedIds()), JSON.stringify([QID]));
  acct.__leoMemberVerified = true;
  T.articleQuizRecord(Object.assign({ ok:false }, Q));
  assert.strictEqual(acct.__calls.length, 1);
  assert.strictEqual(JSON.stringify(JSON.parse(JSON.stringify(acct.__calls[0]))), JSON.stringify([{ item_id:QID, kind:'article', topic:null, is_correct:false }]));
  assert.strictEqual(T.articleQuizAttempts().length, 1, 'un intento por pregunta');
  T.articleQuizRecord(Object.assign({ ok:true }, Q));
  assert.strictEqual(JSON.stringify(T.articleQuizFailedIds()), JSON.stringify([]), 'acertar la recupera');
});
test('aislamiento: otra cuenta no ve el historial', ()=>{
  assert.strictEqual(JSON.stringify(other.__t.articleQuizAttempts()), JSON.stringify([]));
  other.__t.articleQuizRecord(Object.assign({ ok:false }, Q, { n:0 }));
  assert.strictEqual(JSON.stringify(other.__t.articleQuizFailedIds()), JSON.stringify(['aq:in-on-at:prepQuiz1:0']));
  assert(acct.__t.articleQuizFailedIds().indexOf('aq:in-on-at:prepQuiz1:0') === -1);
});
test('un fallo de quiz entra al diagnóstico por su tema real (no como comprensión)', ()=>{
  const T = acct.__t; T.articleQuizRecord(Object.assign({ ok:false }, Q));
  const att = T.collectDiagAttempts(T.loadProgress()).filter(a => a.itemId === QID);
  assert.strictEqual(att.length, 1); assert.strictEqual(att[0].tema, 'in-on-at'); assert.strictEqual(att[0].skill, 'gramatica');
  T.setStats(new Map([[QID, { item_id:QID, kind:'article', status:'active', fail_count:1, last_seen_at:new Date().toISOString(), correct_streak:0 }]]));
  const s = T.diagMistakeSummary(T.collectDiagAttempts(T.loadProgress()), new Map([[QID, { item_id:QID, kind:'article', status:'active', fail_count:1, last_seen_at:new Date().toISOString(), correct_streak:0 }]]), Date.now());
  assert(s.active.some(m => m.itemId === QID && m.tema === 'in-on-at'));
});
test('comprensión de Reading: sigue rastreada pero SIN tema de gramática', ()=>{
  const T = acct.__t; let r = null;
  Object.keys(T.READING_BANK).forEach(l => T.READING_BANK[l].forEach(v => v.forEach(it => { r = r || it; })));
  const f = T.getTrackedFound(r.id);
  assert(f && f.kind === 'reading', 'Reading entra al seguimiento');
  assert.strictEqual(T.getMistakesItemIndex().get(r.id), undefined, 'no entra al índice de repaso de gramática');
  assert.strictEqual(T.diagTemaIdForFound(f), null);
  const s = T.diagMistakeSummary([], new Map([[r.id, { item_id:r.id, kind:'reading', status:'active', fail_count:3, last_seen_at:new Date().toISOString(), correct_streak:0 }]]), Date.now());
  const m = s.active.find(x => x.itemId === r.id);
  assert(m && m.skill === 'lectura' && !m.tema && !m.family, 'habilidad lectura, ninguna regla de gramática');
});
test('los ids de Reading son únicos (estables, sin duplicados)', ()=>{
  const T = acct.__t, seen = new Set(); let n = 0;
  Object.keys(T.READING_BANK).forEach(l => T.READING_BANK[l].forEach(v => v.forEach(it => { assert(!seen.has(it.id), 'duplicado ' + it.id); seen.add(it.id); n++; })));
  assert(n > 0);
});
test('bloque "Para reforzar": nueva pestaña, curso solo si está publicado; gratis ve temario, miembro continúa', ()=>{
  const T = acct.__t, slug = 'articulos-a-an-the';
  const d = { file:'/articulo-' + slug + '.html', root:'articlesQuiz', failed:[0, 1] };
  acct.__leoMemberVerified = false;
  let h = T.articleQuizReinforceHtml(d);
  assert(/Para reforzar/.test(h) && /target="_blank"/.test(h) && /rel="noopener"/.test(h));
  assert(/Practicar este tema/.test(h) && !/academia\.html#\/curso/.test(h), 'gratis: sin enlace al curso completo');
  assert.strictEqual(T.articleQuizReinforceHtml({ file:d.file, root:d.root, failed:[] }), '', 'sin fallos no hay bloque');
  assert.strictEqual(T.articleQuizReinforceHtml({ file:'/articulo-no-existe.html', root:'x', failed:[0] }), '');
  acct.__leoMemberVerified = true;
  const withCourse = Object.keys(T.ARTICLE_QUIZ_CATALOG).find(s => { const c = acct.academiaCourseForTema ? acct.academiaCourseForTema(T.ARTICLE_QUIZ_CATALOG[s].tema) : null; return c; });
  if(withCourse){ const hm = T.articleQuizReinforceHtml({ file:'/articulo-' + withCourse + '.html', root:Object.keys(T.ARTICLE_QUIZ_CATALOG[withCourse].quizzes)[0], failed:[0] }); assert(/academia\.html#\/curso\//.test(hm), 'miembro: continúa el curso'); }
});
test('los enlaces del bloque apuntan a páginas que existen', ()=>{
  const T = acct.__t; acct.__leoMemberVerified = true;
  Object.keys(T.ARTICLE_QUIZ_CATALOG).forEach(slug => {
    const root = Object.keys(T.ARTICLE_QUIZ_CATALOG[slug].quizzes)[0];
    const h = T.articleQuizReinforceHtml({ file:'/articulo-' + slug + '.html', root, failed:[0] });
    (h.match(/href="([^"#?]+)/g) || []).forEach(x => { const f = x.slice(6); assert(fs.existsSync(path.join(root0(), f)), 'no existe ' + f + ' (' + slug + ')'); });
  });
});
function root0(){ return root; }
test('el quiz de artículos no toca el límite diario: no hay referencias al contador gratis', ()=>{
  const src = read('app.js'); const a = src.indexOf('function articleQuizRecord'), b = src.indexOf('function articleQuizReinforceHtml');
  assert(!/free_daily|FreeAcctExercise|incrementFree/.test(src.slice(a, b)));
});

test('cuenta GRATIS: fallar quizzes no mueve el contador diario ni el límite (los 6 ejercicios quedan intactos)', ()=>{
  const c = load({ account:'user-free' }), T = c.__t;
  c.__leoMemberVerified = false; T.setFreeAcct('user-free');
  const before = T.getFreeAcctExerciseCount(), keysBefore = Object.keys(c.__store).filter(k => /daily|free/i.test(k) && !/article_quiz/.test(k)).sort().join();
  for(let n = 0; n < 7; n++) T.articleQuizRecord({ file:'/articulo-in-on-at.html', root:'prepQuiz1', n:n, ok:false });
  assert.strictEqual(T.getFreeAcctExerciseCount(), before);
  assert.strictEqual(T.freeDailyLimitReached(), false);
  assert.strictEqual(Object.keys(c.__store).filter(k => /daily|free/i.test(k) && !/article_quiz/.test(k)).sort().join(), keysBefore, 'ninguna llave del contador cambió');
  assert.strictEqual(c.__calls.length, 0, 'gratis: nada a mistake_stats');
  assert.strictEqual(T.articleQuizFailedIds().length, 7);
  const w = T.freeMemoryWeakSpots();
  assert(w.length === 1 && w[0].temaId === 'in-on-at' && w[0].ids.length === 7, 'la memoria gratis ve el tema fallado');
});
test('MIEMBRO: Reading y quiz se registran en el mismo motor, cada uno con su tipo, y a la cuenta correcta', ()=>{
  const c = load({ account:'user-member' }), T = c.__t; c.__leoMemberVerified = true;
  let r = null; Object.keys(T.READING_BANK).forEach(l => T.READING_BANK[l].forEach(v => v.forEach(it => { r = r || it; })));
  T.updateMistakeStatsFromResults([{ itemId:r.id, isCorrect:false }, { itemId:'inventado-xyz', isCorrect:false }]);
  T.articleQuizRecord({ file:'/articulo-articulos-a-an-the.html', root:'articlesQuiz', n:1, ok:false });
  const flat = c.__calls.reduce((a, x) => a.concat(JSON.parse(JSON.stringify(x))), []);
  assert.strictEqual(JSON.stringify(flat.map(x => [x.kind, x.item_id, x.topic])), JSON.stringify([['reading', r.id, null], ['article', 'aq:articulos-a-an-the:articlesQuiz:1', null]]));
  assert(Object.keys(c.__store).some(k => /leo_article_quiz_v1@@u:user-member/.test(k)) && !Object.keys(c.__store).some(k => /user-free|user-aaa/.test(k.replace('sb-test-auth-token',''))));
});
test('INVITADO: nada en ninguna llave de progreso ni historial tras responder quizzes', ()=>{
  const c = load(), T = c.__t; const before = JSON.stringify(c.__store);
  T.articleQuizRecord({ file:'/articulo-in-on-at.html', root:'prepQuiz1', n:0, ok:false });
  assert.strictEqual(JSON.stringify(c.__store), before); assert.strictEqual(c.__calls.length, 0);
});

console.log('\n' + passed + ' ok, ' + failed + ' fallos');
process.exit(failed ? 1 : 0);
