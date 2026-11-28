/* Riso: garantiza que nada del entorno de pruebas llegue al sitio publicado.
   El simulador (tools/v2-preview/simulado.py) solo existe en la máquina de desarrollo: está excluido de git y cambia la
   dirección del servidor en memoria al servir los archivos. Esta prueba falla si algún archivo del sitio contiene textos o
   direcciones del simulador, o si backend.js no apunta al servidor real.
   Uso: node tools/tests/riso-sin-simulador.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
let p = 0, f = 0;
function test(n, fn) { try { fn(); p++; console.log('  ok   ' + n); } catch (e) { f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }
let archivos;
try { archivos = execSync('git ls-files', { cwd: ROOT }).toString().split('\n').filter(Boolean); }
catch (e) { archivos = []; }
const sitio = archivos.filter(a => /\.(html|js|mjs|ts|json|css)$/.test(a) && !/^tools\//.test(a));
test('el simulador no está en el repositorio', () => {
  assert.ok(!archivos.some(a => /simulado\.py$/.test(a) || /^tools\/v2-preview\//.test(a)), 'tools/v2-preview no debe versionarse');
});
test('ningún archivo del sitio contiene textos ni direcciones del simulador', () => {
  assert.ok(sitio.length > 50, 'lista de archivos del sitio');
  const malos = sitio.filter(a => { const t = fs.readFileSync(path.join(ROOT, a), 'utf8'); return /\(Simulador\)|Respuesta de prueba de Riso|Eco del simulador|after-dinner conversation|127\.0\.0\.1:8792|__vendor\/supabase/.test(t); });
  assert.deepStrictEqual(malos, []);
});
test('backend.js apunta al servidor real de Supabase', () => {
  const b = fs.readFileSync(path.join(ROOT, 'backend.js'), 'utf8');
  assert.ok(/const SUPABASE_URL = 'https:\/\/iviksyhzhiygkuaojply\.supabase\.co';/.test(b));
});
test('Riso en la academia habla con la función real (leo-ai) y no tiene respuestas de prueba', () => {
  const r = fs.readFileSync(path.join(ROOT, 'riso/riso-academia.js'), 'utf8');
  assert.ok(/SUPABASE_URL \+ '\/functions\/v1\/leo-ai'/.test(r) && /LeoBackend\.askLeoAI/.test(r));
  assert.ok(!/simulad|de prueba de riso/i.test(r));
});
test('el eco del simulador solo existe en tools/v2-preview: el servidor real no puede producirlo', () => {
  for (const f of ['supabase/functions/leo-ai/riso-chat.mjs', 'supabase/functions/leo-ai/index.ts', 'supabase/functions/leo-ai/riso-motor.js']) {
    const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(!/Eco del simulador|riso-chat-sim|SIM_ECO|v2-preview/.test(t), f);
  }
  // En producción el modelo es siempre Cloudflare (llamarCloudflare): index.ts no tiene otro camino para el modo chat.
  const ix = fs.readFileSync(path.join(ROOT, 'supabase/functions/leo-ai/index.ts'), 'utf8');
  assert.ok(/llamarModelo: \(mensajes: unknown, o\?: \{ temperatura\?: number \}\) => risoLlamarCloudflare\(/.test(ix));
  assert.strictEqual((ix.match(/llamarModelo:/g) || []).length, 1);
  assert.ok(!archivos.some(a => /riso-chat-sim\.mjs$/.test(a)), 'riso-chat-sim.mjs no debe versionarse');
});
console.log('\n' + p + ' ok, ' + f + ' fallos'); process.exit(f ? 1 : 0);
