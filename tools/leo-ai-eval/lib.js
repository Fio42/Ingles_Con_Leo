/* Utilidades de la evaluación de calidad de Leo AI (modo "explain"). Cargan el app.js y el leo-ai.ts REALES (no copias). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));

function loadApp(){
  const store = {}, noop = ()=>{};
  const el = ()=>{ let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
    set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
  const ctx = { console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: el(), documentElement: el(), createElement: el },
    location:{ hash:'', search:'', pathname:'/gramatica.html' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop }), LeoBackend:{ askLeoAI: async()=>({ ok:false }) } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + ';this.__t = { buildLeoAiPayload, G:GRAMMAR_BANK, V:VOCAB_BANK };', ctx);
  return ctx.__t;
}
/* Carga un leo-ai.ts (el vigente o el baseline) y devuelve sus funciones exportadas. */
function loadServer(file){
  const src = fs.readFileSync(file, 'utf8').replace("import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'", '');
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const ctx = { console, JSON, Date, Math, Promise, setTimeout, clearTimeout, AbortController, Response, Array, String, Object, Number, parseInt, exports:{}, require,
    Deno:{ env:{ get:()=>'' }, serve:()=>{} }, createClient:()=>({ rpc: async()=>({}) }), fetch: async()=>{ throw new Error('sin red'); } };
  vm.createContext(ctx); vm.runInContext(js, ctx); return ctx.exports;
}
function findItem(t, id){
  for(const lv of Object.keys(t.G)) for(const v of t.G[lv]) for(const topic of v) for(const it of topic.items) if(it.id === id) return { it, topic: topic.topic, level: lv, kind:'grammar' };
  for(const lv of Object.keys(t.V)) for(const v of t.V[lv]) for(const w of v) if(w.id === id) return { it: w, level: lv, kind:'vocab' };
  return null;
}
module.exports = { root, loadApp, loadServer, findItem };
