#!/usr/bin/env node
/* Invitación a la membresía tras la primera sesión gratis + conteo de first_session_completed.
   Corre con:  node tools/tests/oferta-primera-sesion.test.js   (desde la carpeta inglesconLeo). Usa data.js, temas.js y app.js REALES. */
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
  vm.runInContext(read('app.js') + ';this.__t = { freeSessionCap, freeFirstOfferEligible, freeFirstOfferHtml, freeFirstSessionClosed, renderFreeSessionSummary, setProfile: p => { _leoAccessTier = "free"; _leoAccessProfile = p; }, setTier: t => { _leoAccessTier = t; }, getDiagItemIndex, getTrackedFound, getArticleFound, articleQuizRecord, articleQuizLoad, articleQuizAttempts, articleQuizFailedIds, articleQuizReinforceHtml, collectDiagAttempts, diagMistakeSummary, loadProgress, ARTICLE_QUIZ_CATALOG, TEMA_BY_ID, DIAG_KIND_TO_SKILL, getMistakesItemIndex, READING_BANK, sessionReinforceRows, diagTemaIdForFound, getFreeAcctExerciseCount, freeDailyLimitReached, updateMistakeStatsFromResults, freeMemoryWeakSpots, setFreeAcct: id => { _leoAccessTier = "free"; _leoAccessProfile = { id: id }; }, setStats: m => { _mistakeStatsCache = m; } }', ctx);
  ctx.__handlers = handlers; ctx.__calls = calls; ctx.__store = store;
  return ctx;
}
let passed = 0, failed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.stack || e.message).split('\n').slice(0, 3).join('\n       ')); } }
console.log('Oferta tras la primera sesión gratis');
function free(uid, opts){
  opts = opts || {};
  const c = load({ account:uid }), T = c.__t;
  c.ACADEMIA_LIVE = opts.live !== false; c.__leoMemberVerified = false;
  T.setProfile({ id:uid, free_first_exercise_at: opts.firstAt || new Date().toISOString(), free_daily_count: opts.count || 0, free_daily_date: new Date().toISOString().slice(0, 10) });
  return c;
}
const ev = c => c.__events;
function withEvents(c){ c.__events = []; c.trackLeoEvent = (n, p) => c.__events.push([n, p]); return c; }
// trackLeoEvent es una función de app.js: se observa por gtag
function mk(uid, opts){ const c = free(uid, opts); c.__events = []; c.gtag = (a, n, p) => { if(a === 'event') c.__events.push([n, p]); }; return c; }

test('sin primera sesión terminada NO hay invitación (ni a invitados, miembros o cuentas que no son nuevas)', ()=>{
  const c = mk('u1'); assert.strictEqual(c.__t.freeFirstOfferEligible(), false);
  const g = load(); assert.strictEqual(g.__t.freeFirstOfferEligible(), false);
});
test('tras la primera sesión: aparece UNA vez, con precio, 9 cursos, evaluaciones, insignias, ilimitada y dos decisiones', ()=>{
  const c = mk('u2'); c.localStorage.setItem('leo_first_session_evt@@u:u2', '1');
  const h = c.__t.freeFirstOfferHtml([{ isCorrect:true }, { isCorrect:false }, { isCorrect:true }, { isCorrect:true }]);
  assert(/\$2 USD al mes/.test(h) && !/MXN|37/.test(h));
  assert(/9 cursos/.test(h) && /evaluaciones e insignias/.test(h) && /Práctica ilimitada/.test(h));
  assert(/Conocer la membresía/.test(h) && /Seguir aprendiendo gratis/.test(h) && /href="miembros\.html"/.test(h));
  assert(/acertaste <strong>3 de 4<\/strong>/.test(h), 'datos reales de la sesión');
  assert(!/<script|popup|modal/i.test(h));
  assert.strictEqual(c.__t.freeFirstOfferHtml([]), '', 'una sola vez por cuenta');
  assert.strictEqual(c.__events.filter(e => e[0] === 'first_session_offer_viewed').length, 1);
});
test('no inventa datos: sin resultados ni errores no muestra aciertos ni tema', ()=>{
  const c = mk('u3'); c.localStorage.setItem('leo_first_session_evt@@u:u3', '1');
  const h = c.__t.freeFirstOfferHtml(null);
  assert(h && !/acertaste/.test(h) && !/Lo que más te costó/.test(h));
});
test('con Academia apagada no promete cursos; al llegar al límite no se muestra (ya hay bloque propio)', ()=>{
  const c = mk('u4', { live:false }); c.localStorage.setItem('leo_first_session_evt@@u:u4', '1');
  assert(!/cursos/.test(c.__t.freeFirstOfferHtml(null)));
  const d = mk('u5', { count:6 }); d.localStorage.setItem('leo_first_session_evt@@u:u5', '1');
  assert.strictEqual(d.__t.freeFirstOfferHtml(null), '');
});
test('miembros no la ven', ()=>{
  const c = mk('u6'); c.localStorage.setItem('leo_first_session_evt@@u:u6', '1'); c.__leoMemberVerified = true;
  assert.strictEqual(c.__t.freeFirstOfferHtml(null), '');
  const m = mk('u7'); m.localStorage.setItem('leo_first_session_evt@@u:u7', '1'); m.__t.setTier('member');
  assert.strictEqual(m.__t.freeFirstOfferHtml(null), '');
});
test('el resumen gratis la incluye una vez y no cambia el resto (botones, límite)', ()=>{
  const c = mk('u8'); c.localStorage.setItem('leo_first_session_evt@@u:u8', '1');
  const h1 = c.__t.renderFreeSessionSummary({ title:'¡Listo!', score:'4 / 6 correctas', topics:['X'], results:[{ isCorrect:true }, { isCorrect:true }, { isCorrect:false }] });
  assert(/data-first-offer-card/.test(h1) && /freeAgainBtn/.test(h1) && /freeOtherSkillBtn/.test(h1));
  const h2 = c.__t.renderFreeSessionSummary({ title:'¡Listo!', score:'4 / 6 correctas', topics:['X'], results:[] });
  assert(!/data-first-offer-card/.test(h2), 'la segunda vez ya no');
});
test('el límite de 6 y los contadores no cambian por la oferta', ()=>{
  const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert(/var FREE_USER_DAILY_LIMIT = 6;/.test(src));
  const a = src.indexOf('function freeFirstOfferHtml'), b = src.indexOf('document.addEventListener(\'click\', e => {', a);
  assert(!/bumpFree|free_daily|FREE_USER_DAILY_LIMIT\s*=/.test(src.slice(a, b)));
});
test('first_session_completed: solo la primera sesión REAL de la cuenta (otro dispositivo con cuenta antigua no cuenta)', ()=>{
  const now = Date.now();
  const nueva = mk('u9', { firstAt:new Date(now - 1000).toISOString() });
  assert.strictEqual(nueva.__t.freeFirstSessionClosed([{ uid:'u9', open:false, startedAt:now - 600000, endedAt:now }]), true);
  const antigua = mk('u10', { firstAt:new Date(now - 5 * 86400000).toISOString() });
  assert.strictEqual(antigua.__t.freeFirstSessionClosed([{ uid:'u10', open:false, startedAt:now - 600000, endedAt:now }]), false, 'cuenta que ya practicaba hace días');
  assert.strictEqual(nueva.__t.freeFirstSessionClosed([{ uid:'u9', open:true, startedAt:now - 600000, endedAt:now }]), false, 'sesión aún abierta');
  assert.strictEqual(nueva.__t.freeFirstSessionClosed([{ uid:'otro', open:false, startedAt:now - 600000, endedAt:now }]), false, 'sesión de otra cuenta');
});
test('el evento se manda una sola vez por cuenta aunque se cierren varias sesiones', ()=>{
  const c = mk('u11'); const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert(/function trackFirstSessionOnce[\s\S]*leo_first_session_evt[\s\S]*trackLeoEvent\('first_session_completed'/.test(src));
});
const pool8 = () => [1, 2, 3, 4, 5, 6, 7, 8];
test('cupo: con 6, 3, 1 y 0 disponibles la sesión trae 6, 3, 1 y 0 ejercicios (máximo 6)', ()=>{
  [[0, 6], [3, 3], [5, 1], [6, 0], [4, 2]].forEach(([used, want]) => {
    const c = mk('cap' + used, { count:used });
    assert.strictEqual(c.__t.freeSessionCap(pool8()).length, want, used + ' usados');
  });
  const big = mk('capbig', { count:0 }); assert.strictEqual(big.__t.freeSessionCap(Array.from({ length:26 }, (_, i) => i)).length, 6, 'nunca más de 6');
  const short = mk('capshort', { count:1 }); assert.strictEqual(short.__t.freeSessionCap([1, 2, 3]).length, 3, 'una sesión corta que cabe no se toca');
  const p = pool8(); mk('capmut', { count:2 }).__t.freeSessionCap(p); assert.strictEqual(p.length, 8, 'no modifica el banco original');
});
test('cupo: invitados y miembros no cambian; cada cuenta usa SU contador', ()=>{
  const g = load(); assert.strictEqual(g.__t.freeSessionCap(pool8()).length, 8);
  const m = mk('capm', { count:5 }); m.__t.setTier('member'); assert.strictEqual(m.__t.freeSessionCap(pool8()).length, 8);
  const a = mk('capa', { count:0 }), b = mk('capb', { count:5 });
  assert.strictEqual(a.__t.freeSessionCap(pool8()).length, 6); assert.strictEqual(b.__t.freeSessionCap(pool8()).length, 1);
});
test('las 6 sesiones gratis (gramática, vocabulario, listening, writing, speaking, mixto) ajustan su tamaño', ()=>{
  const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  ['runFreeGrammarSession', 'runFreeVocabSession', 'runFreeListeningSession', 'runFreeWritingSession', 'runFreeSpeakingSession'].forEach(f => {
    const a = src.indexOf('function ' + f), b = src.indexOf('\nfunction ', a + 10); assert(a > 0 && /freeSessionCap\(/.test(src.slice(a, b)), f);
  });
  const a = src.indexOf('function runMixSessionCore'), b = src.indexOf('\nfunction ', a + 10); assert(/isFree \? freeSessionCap\(pickMixItems/.test(src.slice(a, b)));
  assert(/if\(freeDailyLimitReached\(\)\)\{\s*container\.innerHTML = renderFreeDailyLimitReachedBlock\(\);/.test(src), 'el muro con 0 disponibles sigue ahí');
});
test('resumen al usar el último ejercicio, primera sesión: reconoce la práctica, UNA sola oferta, sin muro ni pitch duplicado', ()=>{
  const c = mk('s1', { count:6 }); c.localStorage.setItem('leo_first_session_evt@@u:s1', '1');
  const h = c.__t.renderFreeSessionSummary({ title:'¡Listo!', score:'3 / 6 correctas', topics:['X'], results:[{ isCorrect:true }, { isCorrect:false }, { isCorrect:true }] });
  assert(/Completaste tu práctica gratis de hoy: 6 de 6/.test(h));
  assert.strictEqual((h.match(/\$2 USD/g) || []).length, 1, 'un solo mensaje de precio');
  assert(/data-first-offer-card/.test(h) && !/summary-unlock/.test(h) && !/leo-ai-pitch|leoAiPitch/i.test(h));
  assert(h.indexOf('free-limit-note') < h.indexOf('data-first-offer-card'), 'primero se reconoce la práctica');
  assert(/freeAgainBtn/.test(h) && /freeOtherSkillBtn/.test(h) && /reinforce|summary-actions/.test(h));
  const names = c.__events.map(e => e[0]);
  assert.strictEqual(names.filter(n => n === 'free_daily_limit_reached').length, 1, 'límite alcanzado se registra desde el resumen');
  assert.strictEqual(names.filter(n => n === 'first_session_offer_viewed').length, 1);
});
test('resumen al límite sin ser la primera sesión: aviso de práctica completa + el bloque comercial de siempre (uno solo)', ()=>{
  const c = mk('s2', { count:6 });
  const h = c.__t.renderFreeSessionSummary({ title:'¡Listo!', score:'5 / 6', topics:[], results:[{ isCorrect:true }] });
  assert(/Completaste tu práctica gratis de hoy/.test(h) && !/data-first-offer-card/.test(h));
  assert(/summary-unlock|leo-ai-pitch|Leo AI/i.test(h));
});
test('resumen sin llegar al límite: sin aviso de límite ni evento de límite; la oferta va después del resumen', ()=>{
  const c = mk('s3', { count:2 }); c.localStorage.setItem('leo_first_session_evt@@u:s3', '1');
  const h = c.__t.renderFreeSessionSummary({ title:'¡Listo!', score:'2 / 2', topics:[], results:[{ isCorrect:true }, { isCorrect:true }] });
  assert(!/free-limit-note/.test(h) && /data-first-offer-card/.test(h) && !/summary-unlock/.test(h));
  assert.strictEqual(c.__events.filter(e => e[0] === 'free_daily_limit_reached').length, 0);
});
test('invitado en su resumen: sin cambios (ni oferta ni aviso de cuenta)', ()=>{
  const g = load(); g.gtag = () => {}; g.__t.setTier('guest');
  const h = g.__t.renderFreeSessionSummary({ title:'¡Listo!', score:'1 / 1', topics:[], results:[{ isCorrect:true }] });
  assert(!/free-limit-note|data-first-offer-card/.test(h));
});

console.log('\n' + passed + ' ok, ' + failed + ' fallos'); process.exit(failed ? 1 : 0);
