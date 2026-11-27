#!/usr/bin/env node
/* English Rush (juego.html) no carga data.js. Al terminar la partida de un miembro, recordSession() no debe fallar
   ("LEVELS is not defined") y la partida se guarda una sola vez, sin registrar sus preguntas como errores del Método Leo.
   Corre con: node tools/tests/rush-guardado.test.js   (APP_JS=<ruta> para probar otra versión de app.js) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const APP = process.env.APP_JS || path.join(root, 'app.js');
const noop = () => {};
const store = {};
const pushed = [], mistakes = [];
const el = () => ({ style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop, innerHTML:'' });
const ctx = {
  console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
  localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; }, key:i=>Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
  document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: el(), documentElement: el(), createElement: el },
  location:{ hash:'', search:'', pathname:'/juego.html' }, navigator:{ userAgent:'node' }, addEventListener:noop, dispatchEvent:noop,
  MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; }, matchMedia:()=>({ matches:false, addEventListener:noop }),
  LeoBackend:{ isConfigured:()=>true, pushSession:s=>{ pushed.push(s); }, applyMistakeResults:items=>{ mistakes.push(items); return Promise.resolve(); } }
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(APP, 'utf8').replace(/\r\n/g, '\n') + '\n;this.__t = { recordSession, loadProgress };', ctx);   // sin data.js, como juego.html
const t = ctx.__t;
let ok = 0;
try{
  t.recordSession({ skill:'juego', level:'todos', topics:['Nivel 1'], results:[{ itemId:'rush-1', isCorrect:true }, { itemId:'rush-2', isCorrect:false }], startedAt: Date.now() - 30000 });
  ok++; console.log('  ok  recordSession no falla sin data.js');
}catch(e){ console.error('FALLA recordSession lanza: ' + e.message); process.exitCode = 1; }
try{
  const s = t.loadProgress().sessions;
  assert.strictEqual(s.length, 1, 'una sola sesión guardada'); assert.strictEqual(s[0].skill, 'juego');
  assert.strictEqual(pushed.length, 1, 'se sube una vez a la nube');
  assert.strictEqual(mistakes.length, 0, 'las preguntas del juego no se registran como errores del Método Leo');
  ok++; console.log('  ok  la partida se guarda una vez y no toca las estadísticas de errores');
}catch(e){ console.error('FALLA ' + e.message); process.exitCode = 1; }
console.log(ok + ' de 2 pruebas ok');
