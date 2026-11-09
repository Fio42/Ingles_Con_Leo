#!/usr/bin/env node
/* Conexión error -> clase (Fase 1): enlace discreto en el feedback y bloque "Para reforzar" del resumen.
   Corre con:  node tools/tests/conexion-recursos.test.js   (desde la carpeta inglesconLeo)
   Usa data.js, temas.js y app.js REALES en un navegador simulado. No toca la red ni Supabase. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');

const store = {};
const noop = ()=>{};
function node(tag){
  const n = { tagName: tag, children: [], style:{}, className:'', dataset:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false },
    setAttribute:noop, addEventListener:noop, appendChild(c){ n.children.push(c); return c; },
    querySelector(sel){ return find(n, sel); } };
  let html = '';
  Object.defineProperty(n, 'innerHTML', { get(){ return html; }, set(v){ html = String(v); n.children = []; } });
  return n;
}
function find(n, sel){
  const cls = sel[0] === '.' ? sel.slice(1) : null;
  for(const c of n.children){
    if(cls && String(c.className || '').split(/\s+/).includes(cls)) return c;
    const d = find(c, sel); if(d) return d;
  }
  return null;
}
function makeCtx(withTemas){
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: node('body'), documentElement: node('html'), createElement: tag => node(tag) },
    location:{ hash:'', search:'', pathname:'/' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  if(withTemas) vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
  // Fixture: 'to-too-two' hace de "tema sin clase ni glosario" (hoy ya tiene ficha en el sitio; aquí se quita para probar que no se inventa ningún enlace).
  if(withTemas) vm.runInContext("TEMA_BY_ID['to-too-two'].glossary = null;", ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { errorResourceForItem, addErrorLessonLink, computeSessionInsight, sessionInsightHtml, sessionReinforceRows, getMistakesItemIndex, G:GRAMMAR_BANK };`, ctx);
  return ctx.__t;
}
const T = makeCtx(true), T0 = makeCtx(false);
let passed = 0;
const wrong = ids => ids.map(itemId => ({ itemId, isCorrect:false }));
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; } }
const files = new Set(fs.readdirSync(root));
const TEMA_CTX = (()=>{ const c = vm.createContext({ window:{} }); vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8') + ';this.TEMAS=TEMAS;', c); return c; })();
const itemOf = (TT, id) => { const f = TT.getMistakesItemIndex().get(id); assert(f, 'no existe ' + id); return f.item; };
const feedback = () => { const c = node('div'); const fb = node('div'); fb.id = '#fb'; c.querySelector = sel => sel === '#fb' ? fb : null; return { c, fb }; };
const linkOf = (TT, id, ok) => { const { c, fb } = feedback(); TT.addErrorLessonLink(c, itemOf(TT, id), ok); return fb.children.find(x => x.className === 'fb-lesson') || null; };
const anchorOf = p => p && p.children[0];

console.log('Enlace en el feedback de error');
test('microtema con sección propia: la clase exacta, en otra pestaña', ()=>{
  const a = anchorOf(linkOf(T, 'g-facil7-dodoes-1', false));
  assert(a, 'debe haber enlace');
  assert.strictEqual(a.href, 'articulo-do-vs-does.html?tema=do-does&via=rec#do-o-does');
  assert.strictEqual(a.target, '_blank'); assert(/noopener/.test(a.rel));
  assert(/^Ver la clase: /.test(a.textContent));
});
test('acierto: nunca hay enlace', ()=>{ assert.strictEqual(linkOf(T, 'g-facil7-dodoes-1', true), null); });
test('artículos recién conectados: this/that, voz pasiva, will/going to, question tags y secuenciadores', ()=>{
  const want = { 'g-facil-this-1':'articulo-this-that-these-those.html', 'g-medio4-pass-1':'articulo-voz-pasiva-ingles.html', 'g-medio-m100-1':'articulo-question-tags-ingles.html', 'g-facil-m300-5':'articulo-conectores-ingles.html' };
  Object.keys(want).forEach(id => {
    const a = anchorOf(linkOf(T, id, false));
    assert(a && a.href.indexOf(want[id]) === 0, id + ': ' + (a && a.href));
    assert(files.has(a.href.split('?')[0]), 'el destino existe');
  });
  const a = anchorOf(linkOf(T, 'g-facil-this-1', false));
  assert.strictEqual(a.href, 'articulo-this-that-these-those.html?tema=this-that&via=rec#como-elegir');
});
test('pronombres y posesivos usan la sección de su microtema', ()=>{
  assert.strictEqual(anchorOf(linkOf(T, 'g-principiante-m300-3', false)).href, 'articulo-pronombres-personales-ingles.html?tema=pronombres&via=rec#pronombres-objeto');
  assert.strictEqual(anchorOf(linkOf(T, 'g-facil5-poss-4', false)).href, 'articulo-adjetivos-posesivos-ingles.html?tema=posesivos&via=rec#tabla-posesivos');
});
test('sin recurso real no se muestra nada: tema sin clase ni glosario', ()=>{
  const id = firstItemOfTema(T, 'to-too-two');
  assert(id, 'debe existir un ejercicio de to-too-two');
  assert.strictEqual(linkOf(T, id, false), null);
});
test('etiquetas que mezclan reglas o que la clase no explica (noClassTopics): sin enlace, salvo que tengan microtema propio', ()=>{
  ['g-principiante-m400-2', 'g-facil-tobe-4'].forEach(id => assert.strictEqual(linkOf(T, id, false), null, id));   // "has breakfast" y "in my bag" no son to be
  const cleft = []; T.getMistakesItemIndex().forEach((f, id) => { if(f.topic === 'Inversiones enfáticas' || /cleft/.test(f.topic || '')) cleft.push(id); });
  assert(cleft.length >= 6); cleft.forEach(id => assert.strictEqual(linkOf(T, id, false), null, id));
  assert(anchorOf(linkOf(T, 'g-principiante-m200-tobe-1', false)), 'un ejercicio de to be con microtema sigue enlazando');
});
test('resumen: si todos los errores de un tema son de una etiqueta sin clase, solo se ofrece Practicar', ()=>{
  const rows = T.sessionReinforceRows(wrong(['g-facil-tobe-2', 'g-facil-tobe-4']), { actions: [] }, new Set());
  assert.strictEqual(rows.length, 1); assert.strictEqual(rows[0].lesson, null); assert(rows[0].practiceHref);
});
test('condicional 3 (la clase solo cubre 1 y 2): no se manda a una clase que no corresponde', ()=>{
  const id = firstItemOfMicro(T, 'cond-3-pasado-irreal');
  assert(id, 'debe existir un ejercicio de cond-3');
  assert.strictEqual(linkOf(T, id, false), null);
});
test('sin temas.js (práctica gratis) el feedback queda como siempre y no falla', ()=>{
  assert.strictEqual(linkOf(T0, 'g-facil7-dodoes-1', false), null);
});
test('ejercicios que no son de gramática o ids desconocidos: nada', ()=>{
  assert.strictEqual(T.errorResourceForItem(null), null);
  assert.strictEqual(T.errorResourceForItem({ id:'no-existe' }), null);
});
test('todo destino ofrecido existe (artículo o glosario) y su ancla existe', ()=>{
  let checked = 0;
  Object.keys(T.G).forEach(l => T.G[l].forEach(v => v.forEach(g => g.items.forEach(i => {
    const r = T.errorResourceForItem(i); if(!r) return; checked++;
    const [file, anchor] = r.href.split('?')[0].split('#'); const hash = r.href.split('#')[1];
    const base = r.href.split(/[?#]/)[0];
    if(base.indexOf('/glosario/') === 0) assert(fs.existsSync(path.join(root, base, 'index.html')), r.href);
    else { assert(files.has(base), r.href); if(hash) assert(fs.readFileSync(path.join(root, base), 'utf8').includes('id="' + hash + '"'), 'ancla ' + r.href); }
  }))));
  assert(checked > 200, 'ejercicios con recurso: ' + checked);
});

function firstItemOfTema(TT, temaId){
  let out = null; const idx = TT.getMistakesItemIndex();
  idx.forEach((f, id) => { if(!out && f.kind === 'grammar' && f.topic && topicTema(f.topic) === temaId) out = id; });
  return out;
}
function firstItemOfMicro(TT, microId){
  let out = null; TT.getMistakesItemIndex().forEach((f, id) => { if(!out && f.item && f.item.micro === microId) out = id; });
  return out;
}
function topicTema(topic){
  const ctx = TEMA_CTX; const t = ctx.TEMAS.find(x => x.topics.includes(topic)); return t && t.id;
}

console.log('\nResumen de sesión: "Para reforzar"');
const right = ids => ids.map(itemId => ({ itemId, isCorrect:true }));
test('dos errores del mismo tema: una fila con clase y práctica, sin inventar', ()=>{
  const rows = T.sessionReinforceRows(wrong(['g-facil-this-1', 'g-facil-this-3']), { actions: [] }, new Set());
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].n, 2);
  assert(/^articulo-this-that-these-those\.html\?tema=this-that&via=rec#como-elegir$/.test(rows[0].lesson.href));
  assert(/^plan-estudio\.html\?/.test(rows[0].practiceHref));
});
test('máximo 2 temas, ordenados por errores', ()=>{
  const rows = T.sessionReinforceRows(wrong(['g-facil-this-1', 'g-facil-this-3', 'g-medio4-pass-1', 'g-medio-m100-1', 'g-medio-m100-3', 'g-medio-m100-5']), { actions: [] }, new Set());
  assert(rows.length <= 2); assert.strictEqual(rows[0].n >= rows[1].n, true);
});
test('un tema ya cubierto por "Lo mejor para hacer ahora" no se repite', ()=>{
  const rows = T.sessionReinforceRows(wrong(['g-facil-this-1', 'g-facil-this-3']), { actions: [] }, new Set(['this-that']));
  assert.strictEqual(rows.length, 0);
});
test('sin errores o con aciertos: no hay bloque', ()=>{
  assert.deepStrictEqual(JSON.parse(JSON.stringify(T.sessionReinforceRows(right(['g-facil-this-1']), { actions: [] }, new Set()))), []);
  assert.strictEqual(T.sessionInsightHtml({ lines:[], actions:[], reinforce:[] }).includes('Para reforzar'), false);
});
test('sin temas.js: el resumen no cambia (sin filas)', ()=>{
  assert.deepStrictEqual(JSON.parse(JSON.stringify(T0.sessionReinforceRows(wrong(['g-facil-this-1', 'g-facil-this-3']), { actions: [] }, new Set()))), []);
});
test('computeSessionInsight entrega reinforce y el HTML lo muestra con enlaces reales', ()=>{
  const res = [...wrong(['g-facil-this-1', 'g-facil-this-3']), ...right(['g-facil-this-2'])];
  const ins = T.computeSessionInsight(res, Date.now() - 60000, 'gramatica');
  assert(ins, 'hay análisis con 3 respuestas');
  const html = T.sessionInsightHtml(ins);
  assert.strictEqual(Array.isArray(ins.reinforce), true);
  // si el análisis ya cubre el tema arriba, no se repite; si no, aparece con sus dos enlaces
  if(ins.reinforce.length){ assert(html.includes('Para reforzar') && html.includes('Practicar')); }
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  hrefs.forEach(h => { const base = h.split(/[?#]/)[0]; if(/\.html$/.test(base)) assert(files.has(base), 'destino inexistente ' + h); });
});

console.log('\n' + passed + ' pruebas correctas');
