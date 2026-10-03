#!/usr/bin/env node
/* Pruebas del botón "Revisar mi frase con Leo AI" en Writing (app.js) y de lo que
   se pinta con la respuesta. DOM simulado mínimo; no llama a ningún servidor.
   Corre con:  node tools/tests/writing-ai.test.js   (desde la carpeta inglesconLeo) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const noop = ()=>{};

function node(tag){
  const n = { tag, children:[], className:'', _text:'', _html:'', attrs:{}, listeners:{}, isConnected:true, style:{}, parent:null,
    classList:{ add:c=>{ if(!(' ' + n.className + ' ').includes(' ' + c + ' ')) n.className = (n.className + ' ' + c).trim(); }, remove:noop, toggle:noop,
      contains:c=>(' ' + n.className + ' ').includes(' ' + c + ' ') },
    setAttribute(k, v){ n.attrs[k] = v; }, addEventListener(t, f){ n.listeners[t] = f; },
    appendChild(c){ n.children.push(c); c.parent = n; return c; },
    remove(){ if(n.parent) n.parent.children = n.parent.children.filter(x => x !== n); },
    querySelector(sel){ return find(n, sel); } };
  Object.defineProperty(n, 'innerHTML', { get:()=> n._html, set:v=>{ n._html = String(v); n.children = []; n._text = ''; if(/<span><\/span>/.test(n._html)) n.appendChild(node('span')); } });
  Object.defineProperty(n, 'textContent', { get:()=> n.children.length ? n.children.map(c => c.textContent).join('') : (n._text || n._html.replace(/<[^>]*>/g, '')), set:v=>{ n._text = String(v); n.children = []; } });
  return n;
}
function find(n, sel){
  for(const c of n.children){
    if((sel[0] === '.' && c.classList.contains(sel.slice(1))) || c.tag === sel) return c;
    const r = find(c, sel); if(r) return r;
  }
  return null;
}
const walk = (n, f)=>{ f(n); n.children.forEach(c => walk(c, f)); };

const store = {};
let asked = [];
const ctx = {
  console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
  localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
  document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: node('body'), documentElement: node('html'), createElement: node },
  location:{ hash:'', search:'', pathname:'/writing.html' }, navigator:{ userAgent:'node' }, addEventListener:noop,
  MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
  matchMedia:()=>({ matches:false, addEventListener:noop }),
  LeoBackend:{ askLeoAI: async p => { asked.push(p); return ctx.__reply(p); } }
};
ctx.__reply = ()=>({ ok:false, reason:'test' });
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `;this.__t = { leoAiAttach, evaluateWritingAnswer, buildLeoAiPayload, WB:WRITING_BANK };`, ctx);
const T = ctx.__t;
ctx.window.__leoMemberVerified = true; // miembro verificado

let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}
const items = []; Object.keys(T.WB).forEach(l => T.WB[l].forEach((v, vi) => v.forEach(i => items.push({ level:l, item:i }))));
const wait = ()=> new Promise(r => setTimeout(r, 5));

// Igual que la página de Writing: califica con evaluateWritingAnswer y adjunta el botón.
function reviewLikePage(item, text){
  const ev = T.evaluateWritingAnswer(text, item);
  const fb = node('div');
  T.leoAiAttach(fb, { kind:'writing', item, userAnswer:text, isOk: ev.isOk });
  return { fb, ev, box: find(fb, '.leo-ai'), btn: find(fb, '.leo-ai-btn') };
}
const labelOf = btn => find(btn, 'span').textContent;

(async()=>{
  console.log('Writing + Leo AI');
  const first = items[0].item;
  await test('frase CORRECTA: aparece "Revisar mi frase con Leo AI" y no se llama sola', async()=>{
    asked = [];
    const r = reviewLikePage(first, first.example.en);
    assert.strictEqual(r.ev.isOk, true, 'la prueba necesita una frase que la página califique bien');
    assert(r.btn && labelOf(r.btn) === 'Revisar mi frase con Leo AI');
    await wait(); assert.strictEqual(asked.length, 0, 'ninguna llamada automática');
  });
  await test('frase INCORRECTA: también aparece el botón', async()=>{
    const r = reviewLikePage(first, 'I am cat the blue');
    assert.strictEqual(r.ev.isOk, false);
    assert(r.btn && labelOf(r.btn) === 'Revisar mi frase con Leo AI');
  });
  await test('frase INCOMPLETA o sin sentido ("text", "ee", una palabra): aparece el botón', async()=>{
    for(const t of ['text', 'ee', 'a', 'car', 'asdf']){
      const r = reviewLikePage(first, t);
      assert(r.btn, 'sin botón para "' + t + '"');
    }
  });
  await test('una sola palabra: la página pide una frase completa (no es correcta) y el botón de Leo AI sigue ahí', async()=>{
    items.forEach(x=>{
      const w = x.item.example.en.split(/\s+/)[0];
      const ev = T.evaluateWritingAnswer(w, x.item);
      assert.strictEqual(ev.isOk, false, x.item.id);
      assert(/^Escribe una frase completa, no solo una palabra\. /.test(ev.hint), x.item.id);
    });
    assert.strictEqual(T.evaluateWritingAnswer(first.example.en, first).isOk, true, 'una frase completa sigue calificando igual');
    assert(reviewLikePage(first, 'have').btn);
  });
  await test('sin escribir nada no hay botón (no hay nada que revisar)', async()=>{
    assert.strictEqual(reviewLikePage(first, '').btn, null);
    assert.strictEqual(reviewLikePage(first, '   ').btn, null);
  });
  await test('ejercicio de vocabulario dentro de Writing', async()=>{
    const v = items.find(x => /palabra|vocab|word/i.test(x.item.prompt)) || items.find(x => x.level === 'facil');
    const ok = reviewLikePage(v.item, v.item.example.en), bad = reviewLikePage(v.item, 'text');
    assert(ok.btn && bad.btn);
  });
  await test('estructura gramatical avanzada', async()=>{
    const adv = items.filter(x => x.level === 'avanzado');
    assert(adv.length > 10);
    adv.slice(0, 40).forEach(x => { assert(reviewLikePage(x.item, x.item.example.en).btn, x.item.id); assert(reviewLikePage(x.item, 'ee').btn, x.item.id); });
  });
  await test('TODOS los ejercicios de Writing del banco (correcta, incorrecta e incompleta)', async()=>{
    let n = 0;
    items.forEach(x => ['correcta', 'wrong words here', 'ee'].forEach((kind, k)=>{
      const text = k === 0 ? x.item.example.en : kind;
      assert(reviewLikePage(x.item, text).btn, x.item.id + ' / ' + text); n++;
    }));
    assert(n >= 600);
  });
  await test('la calificación de la página no cambia por Leo AI (isOk viaja solo como dato)', async()=>{
    const ev1 = T.evaluateWritingAnswer(first.example.en, first), ev2 = T.evaluateWritingAnswer('text', first);
    assert.strictEqual(ev1.isOk, true); assert.strictEqual(ev2.isOk, false);
    const p = T.buildLeoAiPayload({ kind:'writing', item:first, userAnswer:'text', isOk:false });
    assert.strictEqual(p.pageOk, false); assert.strictEqual(p.studentAnswer, 'text');
    assert(JSON.stringify(p).length < 700, 'payload corto: ' + JSON.stringify(p).length);
  });
  await test('una sola llamada al pulsar (doble toque ignorado) y respuesta CORRECTA sin felicitación repetida', async()=>{
    asked = [];
    ctx.__reply = ()=>({ ok:true, answer:{ verdict:'correct', corrected:'I have a dog and a cat.', explanation:'"A dog and a cat" suena más natural que repetir "have".', tips:['Une con and.'] } });
    const r = reviewLikePage(first, 'I have a dog. I have a cat.');
    r.btn.listeners.click(); r.btn.listeners.click();
    await wait(); await wait();
    assert.strictEqual(asked.length, 1, 'llamadas: ' + asked.length);
    assert.strictEqual(asked[0].mode, 'writing');
    const out = find(r.fb, '.leo-ai-answer'); const cls = []; const texts = [];
    walk(out, n => { cls.push(n.className); texts.push(n.textContent); });
    assert(!cls.includes('leo-ai-verdict'), 'no debe repetir "tu frase está bien escrita"');
    assert(texts.some(t => /^Más natural: I have a dog and a cat\./.test(t)));
    assert(!texts.some(t => /bien escrita/i.test(t)));
  });
  await test('respuesta INCORRECTA: muestra el veredicto, la corrección mínima y el truco', async()=>{
    ctx.__reply = ()=>({ ok:true, answer:{ verdict:'incorrect', corrected:'I am a cat.', explanation:'Falta "a" antes de cat.', tips:['Persona o cosa: a/an.'] } });
    const r = reviewLikePage(first, 'I am cat'); r.btn.listeners.click(); await wait(); await wait();
    const out = find(r.fb, '.leo-ai-answer'); const cls = [], texts = [];
    walk(out, n => { cls.push(n.className); texts.push(n.textContent); });
    assert(cls.includes('leo-ai-verdict') && cls.includes('leo-ai-fixed') && cls.includes('leo-ai-tip'));
    assert(texts.includes('I am a cat.') && !texts.some(t => /^Más natural/.test(t)));
  });
  await test('frase que Leo AI deja igual (ya es natural): no repite la frase del alumno', async()=>{
    ctx.__reply = ()=>({ ok:true, answer:{ verdict:'correct', corrected:'I have a dog.', explanation:'Ya suena natural; en conversación también dirían "I\'ve got a dog".', tips:[] } });
    const r = reviewLikePage(first, 'I have a dog'); r.btn.listeners.click(); await wait(); await wait();
    const cls = []; walk(find(r.fb, '.leo-ai-answer'), n => cls.push(n.className));
    assert(!cls.includes('leo-ai-fixed'), 'no se repite igual (ignora mayúsculas y punto final)');
  });
  console.log((failed ? failed + ' prueba(s) fallaron, ' : '') + passed + ' pruebas pasaron');
  process.exit(failed ? 1 : 0);
})();
