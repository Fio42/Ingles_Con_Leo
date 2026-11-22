#!/usr/bin/env node
/* Academia: la insignia de cada curso se consulta UNA vez por cuenta y curso (sin repetir en cada redibujo).
   Corre con:  node tools/tests/academia-insignias-cache.test.js
   Cliente de la nube falso, sin red ni base de datos.

   Lo que se protege:
   1. Muchas llamadas a badge() del mismo curso = una sola consulta (aunque lleguen a la vez).
   2. Cada curso hace su propia consulta, con su course_id.
   3. Una cuenta nunca ve la insignia de otra: otra cuenta (o otro cliente) en el mismo navegador consulta de nuevo.
   4. Un fallo de red no se guarda: la siguiente llamada reintenta.
   5. Aprobar una evaluacion olvida lo guardado, y la insignia nueva se ve en la siguiente consulta. */
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'academia-nube.js'), 'utf8');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); }
}
const tick = () => new Promise(r => setTimeout(r, 5));

/* Un "navegador": un solo modulo cargado (la cache es de la pagina), con clientes y cuentas intercambiables. */
function browser(){
  const Nube = vm.runInNewContext(src + ';AcademiaNube');
  return Nube;
}
/* Cliente falso: tabla academia_badges con filas de varias cuentas. Solo devuelve las de SU cuenta (como la politica RLS). */
function fakeClient(userId, rows, opts){
  opts = opts || {};
  const calls = [];
  const c = {
    calls,
    from(table){
      assert.strictEqual(table, 'academia_badges');
      const q = { sel: null, course: null };
      const chain = {
        select(cols){ q.sel = cols; return chain; },
        eq(col, val){ assert.strictEqual(col, 'course_id'); q.course = val; return chain; },
        async maybeSingle(){
          calls.push(q.course);
          await tick();
          if(opts.fail && opts.fail()) return { data: null, error: { message: 'net' } };
          const row = rows.find(r => r.user_id === userId && r.course_id === q.course);
          return { data: row ? { score_pct: row.score_pct, awarded_at: '2026-11-01' } : null, error: null };
        }
      };
      return chain;
    },
    rpc: async (name) => { calls.push('rpc:' + name); return { data: { ok: true, passed: true }, error: null }; }
  };
  return c;
}
async function course(Nube, client, userId, courseId){
  const n = Nube.create({ enabled: true, courseId, getClient: () => client, getSession: async () => ({ user: { id: userId } }), storage: null });
  await n.boot({});
  return n;
}
/* boot() necesita la tabla academia_progress: se agrega al cliente falso sin tocar lo de insignias. */
function withProgress(client){
  const orig = client.from;
  client.from = function(table){
    if(table === 'academia_progress'){
      const ch = { select(){ return ch; }, eq(){ return ch; }, async maybeSingle(){ return { data: null, error: null }; } };
      return ch;
    }
    return orig(table);
  };
  return client;
}

(async()=>{
  console.log('Academia (insignias: una consulta por cuenta y curso)');
  const ROWS = [
    { user_id: 'A', course_id: 'to-be', score_pct: 90 },
    { user_id: 'B', course_id: 'to-be', score_pct: 70 },
    { user_id: 'B', course_id: 'wh', score_pct: 100 }
  ];

  await test('muchas llamadas del mismo curso (incluso a la vez) = una sola consulta', async () => {
    const N = browser(), cl = withProgress(fakeClient('A', ROWS));
    const n = await course(N, cl, 'A', 'to-be');
    const all = await Promise.all([n.badge(), n.badge(), n.badge(), n.badge()]);
    for(let i = 0; i < 6; i++) await n.badge();
    assert.strictEqual(cl.calls.filter(x => x === 'to-be').length, 1);
    all.forEach(b => assert.strictEqual(b.score_pct, 90));
  });

  await test('cada curso consulta el suyo, con su course_id, una vez', async () => {
    const N = browser(), cl = withProgress(fakeClient('B', ROWS));
    const a = await course(N, cl, 'B', 'to-be'), b = await course(N, cl, 'B', 'wh'), c = await course(N, cl, 'B', 'can');
    for(let i = 0; i < 5; i++) await Promise.all([a.badge(), b.badge(), c.badge()]);
    assert.deepStrictEqual(cl.calls.filter(x => !x.startsWith('rpc:')).sort(), ['can', 'to-be', 'wh']);
    assert.strictEqual((await a.badge()).score_pct, 70);
    assert.strictEqual((await b.badge()).score_pct, 100);
    assert.strictEqual(await c.badge(), null);
  });

  await test('otra cuenta en el mismo navegador no ve la insignia de la anterior', async () => {
    const N = browser();
    const clA = withProgress(fakeClient('A', ROWS)), clB = withProgress(fakeClient('B', ROWS));
    const nA = await course(N, clA, 'A', 'to-be');
    assert.strictEqual((await nA.badge()).score_pct, 90);
    // la cuenta B entra en la misma pagina (otro cliente y otra cuenta): consulta de nuevo y ve LO SUYO
    const nB = await course(N, clB, 'B', 'to-be');
    assert.strictEqual((await nB.badge()).score_pct, 70);
    assert.strictEqual(clB.calls.filter(x => x === 'to-be').length, 1);
    // y B en un curso donde A no tiene insignia: nunca hereda la de A
    const nB2 = await course(N, clB, 'B', 'wh');
    assert.strictEqual((await nB2.badge()).score_pct, 100);
    // el mismo cliente con otra cuenta (cambio de sesion sin recargar): tambien consulta de nuevo
    const shared = withProgress(fakeClient('A', ROWS));
    const x1 = await course(N, shared, 'A', 'wh');
    assert.strictEqual(await x1.badge(), null);
    const shared2 = withProgress(fakeClient('B', ROWS));
    const x2 = await course(N, shared2, 'B', 'wh');
    assert.strictEqual((await x2.badge()).score_pct, 100);
  });

  await test('un fallo de red no se guarda: la siguiente llamada reintenta', async () => {
    const N = browser();
    let failing = true;
    const cl = withProgress(fakeClient('A', ROWS, { fail: () => failing }));
    const n = await course(N, cl, 'A', 'to-be');
    assert.strictEqual(await n.badge(), null);
    assert.strictEqual(await n.badge(), null);       // sigue fallando: reintenta, no recuerda el fallo como respuesta
    assert.strictEqual(cl.calls.filter(x => x === 'to-be').length, 2);
    failing = false;
    assert.strictEqual((await n.badge()).score_pct, 90);
    assert.strictEqual((await n.badge()).score_pct, 90);
    assert.strictEqual(cl.calls.filter(x => x === 'to-be').length, 3);
  });

  await test('sin cuenta conectada no consulta nada', async () => {
    const N = browser(), cl = withProgress(fakeClient('A', ROWS));
    const n = N.create({ enabled: true, courseId: 'to-be', getClient: () => cl, getSession: async () => null, storage: null });
    await n.boot({});
    assert.strictEqual(await n.badge(), null);
    assert.strictEqual(cl.calls.length, 0);
  });

  await test('aprobar una evaluacion olvida lo guardado: la insignia nueva se ve en la siguiente consulta', async () => {
    const N = browser(), rows = ROWS.slice(), cl = withProgress(fakeClient('A', rows));
    const n = await course(N, cl, 'A', 'wh');
    assert.strictEqual(await n.badge(), null);       // aun sin insignia (y queda guardado)
    assert.strictEqual(await n.badge(), null);
    assert.strictEqual(cl.calls.filter(x => x === 'wh').length, 1);
    rows.push({ user_id: 'A', course_id: 'wh', score_pct: 85 });    // el servidor la entrega al aprobar
    await n.examSubmit('attempt-1', []);
    assert.strictEqual((await n.badge()).score_pct, 85);
    assert.strictEqual(cl.calls.filter(x => x === 'wh').length, 2);
  });

  console.log('\n  ' + passed + ' ok, ' + failed + ' con fallo');
  if(failed) process.exit(1);
})();
