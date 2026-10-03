#!/usr/bin/env node
/* Pruebas del tipo de audio de las grabaciones (app.js: recordedAudioType / recordedAudioBlob / isIosDevice).
   Corre con:  node tools/tests/audio-mime.test.js   (desde la carpeta inglesconLeo) */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'app.js'), 'utf8').replace(/\r\n/g, '\n');
const grab = name => {
  const m = src.match(new RegExp('function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}'));
  assert(m, 'no se encontró ' + name);
  return m[0];
};
const code = ['recordedAudioType', 'recordedAudioBlob', 'isIosDevice'].map(grab).join('\n');
function load(nav){
  const ctx = { Blob, navigator: nav || {} };
  vm.createContext(ctx);
  vm.runInContext(code + ';this.t=recordedAudioType;this.b=recordedAudioBlob;this.i=isIosDevice;', ctx);
  return ctx;
}
let ok = 0, bad = 0;
function test(n, f){
  try{ f(); ok++; console.log('  ok  ' + n); }
  catch(e){ bad++; console.log('  FAIL ' + n + '\n       ' + e.message.split('\n')[0]); }
}
const chunk = type => new Blob(['x'], { type });
console.log('Audio de grabaciones');
const c = load();
test('usa el tipo real del grabador (iPhone mp4, Chrome webm con codec)', () => {
  assert.strictEqual(c.t([chunk('audio/mp4')], { mimeType:'audio/mp4' }), 'audio/mp4');
  assert.strictEqual(c.t([chunk('audio/webm')], { mimeType:'audio/webm;codecs=opus' }), 'audio/webm;codecs=opus');
  assert.strictEqual(c.b([chunk('audio/mp4')], { mimeType:'audio/mp4' }).type, 'audio/mp4');
});
test('si el grabador no informa tipo, usa el del primer fragmento', () => {
  assert.strictEqual(c.t([chunk('audio/mp4'), chunk('audio/mp4')], { mimeType:'' }), 'audio/mp4');
  assert.strictEqual(c.t([chunk('audio/ogg')], {}), 'audio/ogg');
});
test('si ambos vienen vacíos, cae a audio/webm (sin romper)', () => {
  assert.strictEqual(c.t([chunk('')], { mimeType:'' }), 'audio/webm');
  assert.strictEqual(c.t([], null), 'audio/webm');
  assert.strictEqual(c.b([], undefined).type, 'audio/webm');
});
test('el grabador manda sobre un fragmento con otro tipo (no asume mp4 ni webm)', () => {
  assert.strictEqual(c.t([chunk('audio/webm')], { mimeType:'audio/mp4' }), 'audio/mp4');
});
test('app.js ya no fuerza audio/webm al armar la grabación (3 lugares usan el helper)', () => {
  assert.strictEqual((src.match(/new Blob\(chunks, \{ type:'audio\/webm' \}\)/g) || []).length, 0);
  assert.strictEqual((src.match(/const blob = recordedAudioBlob\(chunks, recorder\)/g) || []).length, 3);
});
test('iPhone/iPad (incluido Chrome en iPhone e iPad como Mac) se detecta; desktop y Android no', () => {
  assert(load({ userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120 Mobile/15E148 Safari/604.1' }).i());
  assert(load({ userAgent:'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }).i());
  assert(load({ userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints:5 }).i());
  assert(!load({ userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints:0 }).i());
  assert(!load({ userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', maxTouchPoints:0 }).i());
  assert(!load({ userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile', maxTouchPoints:5 }).i());
});
test('cambridge, clases, ielts, toefl y toeic usan la misma lógica (grabador, primer fragmento, webm) y ya no fuerzan webm', () => {
  const line = "new Blob(chunks, { type: recorder.mimeType || (chunks[0] && chunks[0].type) || 'audio/webm' })";
  ['cambridge.js', 'clases.js', 'ielts.js', 'toefl.js', 'toeic.js'].forEach(f => {
    const s = fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');
    assert.strictEqual(s.split(line).length - 1, 1, f + ': debe usar el tipo real una vez');
    assert.strictEqual((s.match(/new Blob\(chunks, \{ type:'audio\/webm' \}\)/g) || []).length, 0, f + ': ya no fuerza webm');
    assert.strictEqual((s.match(/new Blob\(chunks, \{ type: recorder\.mimeType \|\| 'audio\/webm' \}\)/g) || []).length, 0, f + ': sin el paso del primer fragmento');
  });
  // misma expresión, ejecutada con casos reales
  const pick = (recorder, chunks) => new Function('recorder', 'chunks', 'return ' + line + '.type')(recorder, chunks);
  assert.strictEqual(pick({ mimeType:'audio/mp4' }, [chunk('audio/mp4')]), 'audio/mp4');
  assert.strictEqual(pick({ mimeType:'' }, [chunk('audio/mp4')]), 'audio/mp4');
  assert.strictEqual(pick({ mimeType:'' }, [chunk('')]), 'audio/webm');
  assert.strictEqual(pick({}, []), 'audio/webm');
});
test('ningún archivo del sitio arma una grabación con otra lógica de tipo', () => {
  const root = path.join(__dirname, '..', '..');
  fs.readdirSync(root).filter(f => /\.(js|html)$/.test(f)).forEach(f => {
    const s = fs.readFileSync(path.join(root, f), 'utf8');
    const forced = (s.match(/new Blob\(chunks,[^\n]*?\}\)/g) || []).filter(x => !/recorder\.mimeType \|\| \(chunks\[0\] && chunks\[0\]\.type\) \|\| 'audio\/webm'/.test(x) && !/recordedAudioType\(chunks, recorder\)/.test(x));
    assert.deepStrictEqual(forced, [], f + ': lógica de tipo distinta');
  });
});
console.log((bad ? bad + ' prueba(s) fallaron, ' : '') + ok + ' pruebas pasaron');
process.exit(bad ? 1 : 0);
