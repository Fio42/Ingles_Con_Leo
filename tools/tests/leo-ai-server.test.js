#!/usr/bin/env node
/* Pruebas del servidor de Leo AI (supabase_functions/leo-ai.ts) con proveedores y
   Supabase SIMULADOS: no llama a Cloudflare, Groq ni Gemini de verdad.
   Corre con:  node tools/tests/leo-ai-server.test.js   (desde la carpeta inglesconLeo)
   Necesita el paquete "typescript" de node_modules (ya está). */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const ts = require(path.join(__dirname, '..', '..', 'node_modules', 'typescript'));
const root = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(root, 'supabase_functions', 'leo-ai.ts'), 'utf8')
  .replace("import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'", '');
const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;

// Token con forma real de Supabase (la firma la verifica la puerta de
// Supabase con verify_jwt, por eso aquí la parte de firma es de mentira).
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
const jwt = claims => b64u({ alg:'HS256', typ:'JWT' }) + '.' + b64u(claims) + '.firma';
const MEMBER_TOKEN = jwt({ sub:'u-123', role:'authenticated', exp: Math.floor(Date.now()/1000) + 3600, email:'alumno@mail.com' });
const CF_OK = { CLOUDFLARE_ACCOUNT_ID: 'acc', CLOUDFLARE_API_TOKEN: 'cf-token-secreto' };
async function call(o){
  o = o || {};
  let handler; const calls = []; const recorded = [];
  const envAll = Object.assign({ SUPABASE_URL:'x', SUPABASE_SERVICE_ROLE_KEY:'y' }, o.env === undefined ? CF_OK : o.env);
  const ctx = { console:{ error(){}, log(){} }, atob, JSON, Date, Math, Promise, setTimeout, clearTimeout, AbortController, Response, Array, String, Object, Number, parseInt, exports:{}, require,
    Deno:{ env:{ get:k=> envAll[k] }, serve:h=>{ handler = h; } },
    createClient: ()=>({
      auth:{ getUser: async()=>{ throw new Error('no debe usarse auth.getUser (exige sesión viva)'); } },
      from: ()=>({ select:()=>({ eq:()=>({ maybeSingle: async()=>({ data:{ is_member: o.member !== false } }) }) }) }),
      rpc: async (fn, args)=>{
        if(fn === 'leo_ai_reserve') return o.reserve || { data:'ok', error:null };
        if(fn === 'leo_ai_record'){ recorded.push(args); return { data:null, error:null }; }
        return { data:null, error:{ message:'?' } };
      }
    }),
    fetch: async (url, init)=>{ calls.push({ url, body: JSON.parse(init.body), headers: init.headers }); return (o.provider || cfReply())(url, init); }
  };
  vm.createContext(ctx); vm.runInContext(js, ctx);
  const token = o.user === null ? (o.badToken || 'no-es-un-token') : MEMBER_TOKEN;
  const headers = Object.assign({ Authorization:'Bearer ' + token }, o.headers || {});
  const res = await handler({ method:'POST', headers:{ get:k=> headers[k] !== undefined ? headers[k] : (headers[k.toLowerCase()] !== undefined ? headers[k.toLowerCase()] : null) }, json: async()=> o.body || EXPLAIN });
  return { status: res.status, out: await res.json(), calls, recorded };
}
const cfReply = (content, usage, status)=> async()=> new Response(JSON.stringify(
  status && status !== 200 ? { success:false, errors:[{ code:4006, message:'you have used up your daily free allocation' }] }
  : { success:true, result:{ choices:[{ message:{ content: content !== undefined ? content : JSON.stringify({ example_en:'I went to Lima.', example_es:'Fui a Lima.', explanation:'Usamos went porque es pasado.' }) }, finish_reason:'stop' }], usage: usage || { prompt_tokens:310, completion_tokens:74 } } }),
  { status: status || 200 });
const EXPLAIN = { mode:'explain', skill:'grammar', level:'facil', topic:'Pasado simple', exerciseType:'Elegir la opción correcta', question:'Yesterday I ___ to the park.', options:['go','went','gone'],
  studentAnswer:'go', correctAnswer:'went', isCorrect:false, baseExplanation:'Yesterday indica pasado.', email:'alumno@mail.com', name:'Juan', userId:'u-123', history:[1,2,3] };
const WRITING = { mode:'writing', skill:'writing', level:'medio', question:'Escribe una frase con "I have".', target:'I have [x]', example:'I have a dog.', studentAnswer:'I has a cat.' };
const DIAG = { mode:'diagnosis', level:'facil', unit:{ label:'Preposiciones', current:42, answered:31, previous:null, recent:null, trend:'flat', pendingMistakes:6, repeatedMistakes:3 } };

let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String(e.message).split('\n')[0]); }
}
(async()=>{
  console.log('Leo AI (servidor)');
  await test('apagado: por la base (enabled=false) o de emergencia (secreto LEO_AI_ENABLED=false), sin llamadas', async()=>{
    let r = await call({ reserve:{ data:'disabled', error:null } }); assert.strictEqual(r.out.reason, 'disabled'); assert.strictEqual(r.calls.length, 0);
    r = await call({ env:Object.assign({}, CF_OK, { LEO_AI_ENABLED:'false' }) }); assert.strictEqual(r.out.reason, 'disabled'); assert.strictEqual(r.calls.length, 0);
  });
  await test('modo probadores: un miembro que no es probador recibe 403 y no gasta nada', async()=>{
    const r = await call({ reserve:{ data:'not_allowed', error:null } }); assert.strictEqual(r.status, 403); assert.strictEqual(r.out.reason, 'not_allowed'); assert.strictEqual(r.calls.length, 0);
  });
  await test('sin sesión -> 401, no miembro -> 403, sin llamadas', async()=>{
    let r = await call({ user:null }); assert.strictEqual(r.status, 401); assert.strictEqual(r.calls.length, 0);
    r = await call({ user:null, badToken: jwt({ sub:'u-123', role:'authenticated', exp: Math.floor(Date.now()/1000) - 10 }) }); assert.strictEqual(r.status, 401, 'token vencido');
    r = await call({ user:null, badToken: jwt({ sub:'x', role:'anon', exp: Math.floor(Date.now()/1000) + 3600 }) }); assert.strictEqual(r.status, 401, 'token de visitante (anon)');
    r = await call({ member:false }); assert.strictEqual(r.status, 403); assert.strictEqual(r.calls.length, 0);
  });
  await test('datos incompletos o modo raro -> 400 sin llamadas', async()=>{
    let r = await call({ body:Object.assign({}, EXPLAIN, { correctAnswer:'' }) }); assert.strictEqual(r.status, 400);
    r = await call({ body:Object.assign({}, EXPLAIN, { mode:'chat' }) }); assert.strictEqual(r.status, 400); assert.strictEqual(r.calls.length, 0);
  });
  await test('topes: tabla falla / tope del alumno / tope global / presupuesto de neurons -> sin llamadas', async()=>{
    let r = await call({ reserve:{ data:null, error:{ message:'no existe' } } }); assert.strictEqual(r.out.reason, 'usage_error');
    r = await call({ reserve:{ data:'user_limit', error:null } }); assert.strictEqual(r.out.reason, 'daily_limit');
    r = await call({ reserve:{ data:'global_limit', error:null } }); assert.strictEqual(r.out.reason, 'busy');
    r = await call({ reserve:{ data:'neuron_budget', error:null } }); assert.strictEqual(r.out.reason, 'busy'); assert.strictEqual(r.calls.length, 0);
  });
  await test('Cloudflare: pedido correcto (Gemma 4, sin razonamiento, tope 220, formato JSON fijo)', async()=>{
    const r = await call();
    assert.strictEqual(r.out.ok, true); assert.strictEqual(r.out.answer.explanation, 'Usamos went porque es pasado.');
    const c = r.calls[0];
    assert(c.url.includes('/accounts/acc/ai/run/@cf/google/gemma-4-26b-a4b-it'));
    assert.strictEqual(c.headers.Authorization, 'Bearer cf-token-secreto');
    assert.deepStrictEqual(c.body.chat_template_kwargs, { enable_thinking:false });
    assert.strictEqual(c.body.max_completion_tokens, 220);
    assert.strictEqual(c.body.response_format.type, 'json_schema');
    assert.strictEqual(c.body.response_format.json_schema.schema.additionalProperties, false);
  });
  await test('privacidad: al proveedor solo van datos del ejercicio (sin id, token, email, nombre, historial)', async()=>{
    const r = await call();
    const sent = JSON.stringify(r.calls[0].body);
    assert(!/u-123|alumno@mail|Juan|history|firma/.test(sent), sent);
  });
  await test('consumo: se registran solo números (tokens y neurons estimados), nunca texto', async()=>{
    const r = await call();
    assert.strictEqual(r.recorded.length, 1);
    const a = r.recorded[0];
    assert.deepStrictEqual(Object.keys(a).sort(), ['p_day','p_input','p_neurons','p_output','p_provider']);
    assert.strictEqual(a.p_provider, 'cloudflare'); assert.strictEqual(a.p_input, 310); assert.strictEqual(a.p_output, 74);
    assert(Math.abs(a.p_neurons - (310*9091 + 74*27273)/1e6) < 1e-9);
  });
  await test('Writing: el formato nuevo (assessment/tip) llega a la página como antes (verdict/tips)', async()=>{
    const r = await call({ body:WRITING, provider: cfReply(JSON.stringify({ assessment:'minor', corrected:'I have a cat.', explanation:'Con I se usa have.', tip:'I have, he has.' })) });
    assert.deepStrictEqual(r.out.answer, { verdict:'minor', corrected:'I have a cat.', explanation:'Con I se usa have.', tips:['I have, he has.'] });
    const r2 = await call({ body:WRITING, provider: cfReply(JSON.stringify({ assessment:'correct', corrected:'I has a cat.', explanation:'Bien.', tip:'' })) });
    assert.deepStrictEqual(r2.out.answer.tips, []);
  });
  await test('Diagnóstico: solo los números procesados', async()=>{
    const r = await call({ body:DIAG, provider: cfReply(JSON.stringify({ explanation:'Vas en 42%.', tip:'Practica 10 minutos.' })) });
    assert.strictEqual(r.out.ok, true);
    const user = r.calls[0].body.messages[1].content;
    assert(user.includes('Aciertos ahora: 42%') && user.includes('Errores pendientes de corregir en este tema: 6'));
  });
  await test('cuota de Cloudflare agotada -> "quota" (y el sitio sigue igual)', async()=>{ const r = await call({ provider: cfReply(undefined, undefined, 429) }); assert.strictEqual(r.out.reason, 'quota'); });
  await test('respuesta inválida o cortada -> "bad_output"', async()=>{
    let r = await call({ provider: cfReply('{"explanation": "Hola') }); assert.strictEqual(r.out.reason, 'bad_output');
    r = await call({ provider: cfReply('no es json') }); assert.strictEqual(r.out.reason, 'bad_output');
  });
  await test('Cloudflare tarda más de 10 s -> se corta ("timeout")', async()=>{
    const t0 = Date.now();
    const r = await call({ provider:(u, init)=> new Promise((res, rej)=> init.signal.addEventListener('abort', ()=>{ const e = new Error('aborted'); e.name = 'AbortError'; rej(e); })) });
    assert.strictEqual(r.out.reason, 'timeout'); assert(Date.now() - t0 < 11500);
  });
  await test('Gemini NUNCA se usa para alumnos, aunque esté en la lista de proveedores', async()=>{
    const r = await call({ env:Object.assign({}, CF_OK, { LEO_AI_PROVIDERS:'gemini,cloudflare', GEMINI_API_KEY:'g' }), body:Object.assign({}, EXPLAIN, { provider:'gemini' }) });
    assert(r.calls.every(c => !c.url.includes('googleapis')));
    assert(r.calls[0].url.includes('cloudflare'));
  });
  await test('Gemini solo con la clave de admin (mínimo 24 caracteres) y pedido explícito', async()=>{
    const admin = 'k'.repeat(30);
    const gem = async()=> new Response(JSON.stringify({ candidates:[{ content:{ parts:[{ text: JSON.stringify({ explanation:'x', example_en:'', example_es:'' }) }] } }], usageMetadata:{} }), { status:200 });
    let r = await call({ env:Object.assign({}, CF_OK, { GEMINI_API_KEY:'g', LEO_AI_ADMIN_KEY:admin }), headers:{ 'x-leo-ai-admin':'mala' }, body:Object.assign({}, EXPLAIN, { provider:'gemini' }) });
    assert(r.calls[0].url.includes('cloudflare'), 'clave incorrecta: debe usar Cloudflare');
    r = await call({ env:Object.assign({}, CF_OK, { GEMINI_API_KEY:'g', LEO_AI_ADMIN_KEY:'corta' }), headers:{ 'x-leo-ai-admin':'corta' }, body:Object.assign({}, EXPLAIN, { provider:'gemini' }) });
    assert(r.calls[0].url.includes('cloudflare'), 'clave de admin muy corta: no vale');
    r = await call({ env:Object.assign({}, CF_OK, { GEMINI_API_KEY:'g', LEO_AI_ADMIN_KEY:admin }), headers:{ 'x-leo-ai-admin':admin }, body:Object.assign({}, EXPLAIN, { provider:'gemini' }), provider:gem });
    assert(r.calls[0].url.includes('googleapis'), 'admin con clave correcta sí puede probar Gemini');
  });
  await test('Groq apagado por defecto: no se llama aunque tenga clave', async()=>{
    const r = await call({ env:Object.assign({}, CF_OK, { GROQ_API_KEY:'q' }), provider: cfReply(undefined, undefined, 429) });
    assert(r.calls.every(c => !c.url.includes('groq')));
  });
  console.log((failed ? failed + ' prueba(s) fallaron, ' : '') + passed + ' pruebas pasaron');
  process.exit(failed ? 1 : 0);
})();
