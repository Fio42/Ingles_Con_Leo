#!/usr/bin/env node
/* LeoBot: reporte con captura opcional (backend.js, submitLeobotReport). Corre con: node tools/tests/leobot-reporte.test.js
   Orden: primero se GUARDA el reporte, despues se sube la captura a <id>/captura.jpg y por ultimo se avisa a Leo
   (leobot-notify) diciendo solo el estado de la imagen. Si la subida falla, el reporte ya esta guardado y se avisa igual. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const ID = '11111111-2222-4333-8444-555555555555';

function run(args, uploadResult){
  const calls = { order: [], rows: [], uploads: [], fetches: [] };
  const sb = {
    auth: { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe(){} } } }) },
    storage: { from: b => ({ upload: async (p, blob, o) => { calls.order.push('upload'); calls.uploads.push([b, p, o.contentType, o.upsert]); return uploadResult; } }) },
    from: t => ({ insert: async row => { calls.order.push('insert'); calls.rows.push([t, row]); return { error: null }; } })
  };
  const ctx = { console, Math, Date, JSON, Promise, setTimeout, clearTimeout, URLSearchParams,
    fetch: (u, o) => { calls.order.push('notify'); calls.fetches.push([u, JSON.parse(o.body)]); return Promise.resolve({}); },
    localStorage: { getItem: () => null, setItem(){}, removeItem(){} }, document: { addEventListener(){}, querySelector: () => null, readyState: 'complete' },
    location: { search: '', pathname: '/', href: '' }, navigator: { userAgent: 'n' }, addEventListener(){}, supabase: { createClient: () => sb } };
  ctx.window = ctx; ctx.crypto = { randomUUID: () => ID };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'backend.js'), 'utf8') + '\n;this.__B = LeoBackend;', ctx);
  return ctx.__B.submitLeobotReport(args).then(r => ({ r, calls }));
}
let passed = 0, queue = Promise.resolve();
const test = (name, fn) => { queue = queue.then(async () => { try{ await fn(); passed++; console.log('  ok  ' + name); }catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; } }); };
const plain = o => JSON.parse(JSON.stringify(o));

test('con captura: primero se guarda el reporte, luego se sube SOLO a <id>/captura.jpg (sin upsert) y al final se avisa', async () => {
  const { r, calls } = await run({ type:'bug', message:'m', context:{ categoria:'x' }, imageBlob:{ size:5 } }, { error: null });
  assert.deepStrictEqual(plain(r), { ok:true, id:ID, imageFailed:false });
  assert.deepStrictEqual(calls.order, ['insert', 'upload', 'notify']);
  assert.deepStrictEqual(calls.uploads[0], ['leobot-reports', ID + '/captura.jpg', 'image/jpeg', false]);
  assert.deepStrictEqual(plain(calls.rows[0][1].context), { categoria:'x' });          // el context ya no lleva rutas de archivos
  assert.deepStrictEqual(calls.fetches[0][1], { report_id: ID, image: 'ok' });
});
test('si la subida falla (bucket sin crear, reporte rechazado), el reporte ya esta guardado y se avisa con image:failed', async () => {
  const { r, calls } = await run({ type:'bug', message:'m', context:{}, imageBlob:{ size:5 } }, { error: { message: 'new row violates row-level security policy' } });
  assert.strictEqual(r.ok, true); assert.strictEqual(r.imageFailed, true);
  assert.strictEqual(calls.rows.length, 1);
  assert.deepStrictEqual(calls.fetches[0][1], { report_id: ID, image: 'failed' });
});
test('sin imagen: no se sube nada y el aviso dice image:none', async () => {
  const { r, calls } = await run({ type:'support', message:'m', context:{ page:'index.html' } }, { error: null });
  assert.strictEqual(r.imageFailed, false); assert.strictEqual(calls.uploads.length, 0);
  assert.deepStrictEqual(calls.order, ['insert', 'notify']);
  assert.deepStrictEqual(plain(calls.rows[0][1].context), { page:'index.html' });
  assert.deepStrictEqual(calls.fetches[0][1], { report_id: ID, image: 'none' });
});
test('sin context y sin imagen el campo context queda en null', async () => {
  const { calls } = await run({ type:'support', message:'m' }, { error: null });
  assert.strictEqual(calls.rows[0][1].context, null);
});
queue.then(() => console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : '')));
