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
const MEMBER_TOKEN = jwt({ sub:'u-123', role:'authenticated', exp: Math.floor(Date.now()/1000) + 3600*24*365*10, email:'alumno@mail.com' });
const CF_OK = { CLOUDFLARE_ACCOUNT_ID: 'acc', CLOUDFLARE_API_TOKEN: 'cf-token-secreto' };
/* Base falsa que replica leo_ai_begin / leo_ai_finish / leo_ai_reserve de
   supabase_functions/leo-ai.sql (cada función corre entera, de una vez, como una
   transacción). Se comparte entre llamadas con { db }. */
function newDb(opts){
  const db = Object.assign({ rows:new Map(), usage:new Map(), limit:100, clock:()=> Date.now(), beginCalls:0, missing:false }, opts || {});
  const dayOf = ms => new Date(ms).toISOString().slice(0, 10);
  db.reserve = (user, day)=>{
    const k = user + '|' + day, n = db.usage.get(k) || 0;
    if(n >= db.limit) return 'user_limit';
    db.usage.set(k, n + 1); return 'ok';
  };
  db.begin = (user, req)=>{
    db.beginCalls++;
    const now = db.clock(), day = dayOf(now), key = user + '|' + req;
    for(const [k, r] of db.rows) if(r.created_at < now - 24*3600e3) db.rows.delete(k);
    if(!db.rows.has(key)){
      db.rows.set(key, { day, status:'processing', answer:null, reason:null, attempts:0, created_at:now, updated_at:now });
      const gate = db.reserve(user, day);
      if(gate !== 'ok'){ db.rows.delete(key); return { status:gate, day }; }
      db.rows.get(key).attempts = 1; return { status:'go', attempt:1, day };
    }
    const r = db.rows.get(key);
    if(r.status === 'completed') return { status:'completed', answer:r.answer, day:r.day };
    if(r.status === 'processing' && r.updated_at > now - 45000) return { status:'processing', day:r.day };
    if(r.attempts >= 2){
      if(r.status === 'processing'){ r.status = 'failed'; r.reason = r.reason || 'error'; }
      return { status:'failed_final', reason:r.reason || 'error', day:r.day };
    }
    r.status = 'processing'; r.attempts++; r.updated_at = now;
    return { status:'go', attempt:r.attempts, day:r.day };
  };
  db.finish = (user, req, status, answer, reason, attempt)=>{
    const r = db.rows.get(user + '|' + req);
    if(!r || r.status === 'completed') return;
    if(status !== 'completed' && r.attempts !== attempt) return;
    r.status = status; r.answer = status === 'completed' ? answer : null; r.reason = status === 'failed' ? reason : null; r.updated_at = db.clock();
  };
  return db;
}
const sleepReal = ms => new Promise(r => setTimeout(r, ms));
async function call(o){
  o = o || {};
  let handler; const calls = []; const recorded = []; const reserveArgs = [];
  const envAll = Object.assign({ SUPABASE_URL:'x', SUPABASE_SERVICE_ROLE_KEY:'y' }, o.env === undefined ? CF_OK : o.env);
  const db = o.db || null;
  // Tiempo acelerado (1 s del servidor = 5 ms) y, si se pide, reloj falso para probar el día UTC.
  const FakeDate = o.now ? class extends Date { constructor(...a){ if(a.length) super(...a); else super(o.now); } static now(){ return o.now; } } : Date;
  const fastTimeout = (f, ms)=> setTimeout(f, Math.max(1, Math.floor(ms / 200)));
  const ctx = { console:{ error(){}, log(){} }, atob, JSON, Date: FakeDate, Math, Promise, setTimeout: fastTimeout, clearTimeout, AbortController, Response, Array, String, Object, Number, parseInt, exports:{}, require,
    Deno:{ env:{ get:k=> envAll[k] }, serve:h=>{ handler = h; } },
    createClient: ()=>({
      auth:{ getUser: async()=>{ throw new Error('no debe usarse auth.getUser (exige sesión viva)'); } },
      from: ()=>({ select:()=>({ eq:()=>({ maybeSingle: async()=>({ data:{ is_member: o.member !== false } }) }) }) }),
      rpc: async (fn, args)=>{
        if(fn === 'leo_ai_reserve'){ reserveArgs.push(args); if(db && !o.reserve) return { data: db.reserve(args.p_user, args.p_day), error:null }; return o.reserve || { data:'ok', error:null }; }
        if(fn === 'leo_ai_begin'){
          if(!db || db.missing) return { data:null, error:{ code:'PGRST202', message:'Could not find the function public.leo_ai_begin' } };
          return { data: db.begin(args.p_user, args.p_request), error:null };
        }
        if(fn === 'leo_ai_finish'){ if(db) db.finish(args.p_user, args.p_request, args.p_status, args.p_answer, args.p_reason, args.p_attempt); return { data:null, error:null }; }
        if(fn === 'leo_ai_record'){ recorded.push(args); return { data:null, error:null }; }
        return { data:null, error:{ message:'?' } };
      }
    }),
    fetch: async (url, init)=>{ calls.push({ url, body: JSON.parse(init.body), headers: init.headers }); if(o.delayMs) await sleepReal(o.delayMs); return (o.provider || cfReply())(url, init); }
  };
  vm.createContext(ctx); vm.runInContext(js, ctx);
  const token = o.user === null ? (o.badToken || 'no-es-un-token') : MEMBER_TOKEN;
  const headers = Object.assign({ Authorization:'Bearer ' + token }, o.headers || {});
  const res = await handler({ method:'POST', headers:{ get:k=> headers[k] !== undefined ? headers[k] : (headers[k.toLowerCase()] !== undefined ? headers[k.toLowerCase()] : null) }, json: async()=> o.body || EXPLAIN });
  return { status: res.status, out: await res.json(), calls, recorded, reserveArgs };
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
  await test('Writing: acepta texto suelto de 2+ palabras, avisa cómo calificó la página y pide poco (220 tokens)', async()=>{
    const r = await call({ body:Object.assign({}, WRITING, { studentAnswer:'text ee', pageOk:false }), provider: cfReply(JSON.stringify({ assessment:'incorrect', corrected:'I have a dog.', explanation:'No es una frase con sentido.', tip:'' })) });
    assert.strictEqual(r.out.ok, true); assert.strictEqual(r.calls.length, 1);
    const b = r.calls[0].body, all = b.messages.map(m => m.content).join('\n');
    assert.strictEqual(b.max_completion_tokens, 220);
    assert(/Frase del alumno: text ee/.test(all) && /no cumple lo pedido/.test(all));
    assert(/NO felicites/.test(all) && /NO adivines lo que quiso decir/.test(all), 'las reglas piden complementar, no felicitar');
    const ok = await call({ body:Object.assign({}, WRITING, { pageOk:true }), provider: cfReply(JSON.stringify({ assessment:'correct', corrected:'I have a dog.', explanation:'x', tip:'' })) });
    assert(/cumple lo pedido/.test(ok.calls[0].body.messages.map(m => m.content).join('\n')));
  });
  await test('Writing: vacío o menos de 2 palabras reales -> insufficient_text, sin cupo y sin llamar al modelo', async()=>{
    for(const t of ['', '   ', 'text', 'ee', 'have', '...', '-- !!', 'hi ...', undefined]){
      let reserved = 0;
      const r = await call({ body:Object.assign({}, WRITING, { studentAnswer:t }), reserve:{ get data(){ reserved++; return 'ok'; }, error:null } });
      assert.strictEqual(r.out.reason, 'insufficient_text', JSON.stringify(t)); assert.strictEqual(r.status, 400);
      assert.strictEqual(r.calls.length, 0, 'no debe llamar al modelo: ' + JSON.stringify(t));
      assert.strictEqual(reserved, 0, 'no debe gastar cupo: ' + JSON.stringify(t));
    }
    const ok = await call({ body:Object.assign({}, WRITING, { studentAnswer:'I has cat' }), provider: cfReply(JSON.stringify({ assessment:'incorrect', corrected:'I have a cat.', explanation:'x', tip:'' })) });
    assert.strictEqual(ok.out.ok, true); assert.strictEqual(ok.calls.length, 1);
    const exp = await call({ body:Object.assign({}, EXPLAIN, { studentAnswer:'go' }), provider: cfReply() });
    assert.strictEqual(exp.out.ok, true, 'las demás modalidades no cambian (explain con una palabra sigue valiendo)');
  });
  await test('Writing: el tema de la consigna viaja como contexto corto (solo si existe) y no cambia llamadas ni límites', async()=>{
    const r = await call({ body:Object.assign({}, WRITING, { studentAnswer:'My car is bigger', topic:'Comparativos' }), provider: cfReply(JSON.stringify({ assessment:'correct', corrected:'My car is bigger than yours.', explanation:'x', tip:'' })) });
    const all = r.calls[0].body.messages.map(m => m.content).join(String.fromCharCode(10));
    assert(all.includes('Tema que practica la consigna (solo contexto, no lo menciones): Comparativos'));
    assert.strictEqual(r.calls.length, 1); assert.strictEqual(r.calls[0].body.max_completion_tokens, 220);
    const r2 = await call({ body:Object.assign({}, WRITING, { studentAnswer:'My car is bigger' }), provider: cfReply(JSON.stringify({ assessment:'correct', corrected:'x y', explanation:'x', tip:'' })) });
    assert(!r2.calls[0].body.messages.map(m => m.content).join(' ').includes('Tema que practica'));
    const r3 = await call({ body:Object.assign({}, WRITING, { studentAnswer:'text', topic:'Comparativos' }) });
    assert.strictEqual(r3.out.reason, 'insufficient_text'); assert.strictEqual(r3.calls.length, 0);
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
  const INSIGHT = { mode:'insight', scope:'session', level:'facil',
    facts:['Ejercicios: 12, correctos: 8 (67%)', 'Sigues fallando con Preposiciones: 3 errores hoy.', 'Corregiste 2 ejercicios que antes habías fallado.'],
    examples:['In / On / At: I was born ___ 1990. → in'], shown:['Preposiciones'], candidates:[{ id:'in-on-at', label:'In, on y at' }, { id:'by-until', label:'By y until' }] };
  await test('insight (sesión/errores/progreso): un solo pedido compacto, sin thinking y con formato fijo', async()=>{
    const r = await call({ body:INSIGHT, provider: cfReply(JSON.stringify({ explanation:'Hoy acertaste 8 de 12.', tip:'Practica preposiciones hoy.' })) });
    assert.strictEqual(r.out.ok, true); assert.strictEqual(r.out.answer.tip, 'Practica preposiciones hoy.');
    assert.strictEqual(r.calls.length, 1);
    const b = r.calls[0].body;
    assert.deepStrictEqual(b.chat_template_kwargs, { enable_thinking:false });
    assert.strictEqual(b.max_completion_tokens, 200, 'salida baja: solo complementa');
    assert.strictEqual(b.response_format.json_schema.name, 'leo_ai_insight');
    const user = b.messages.map(m => m.content).join('\n');
    assert(/Análisis de la sesión/.test(user) && /- Sigues fallando con Preposiciones/.test(user));
    assert(!/Siguiente paso/.test(user), 'ya no se le pide repetir el siguiente paso de la página');
    assert(/La página ya le muestra \(no lo repitas\): Preposiciones/.test(user));
    assert(/NO lo repitas/.test(user), 'las reglas piden no repetir lo que ya muestra la página');
    assert(user.length < 2400, 'prompt compacto (' + user.length + ' caracteres)');
  });
  await test('insight: recorta a 5 datos y 3 ejemplos; scope desconocido o menos de 2 datos -> bad_input sin llamar', async()=>{
    const many = Object.assign({}, INSIGHT, { scope:'mistakes', facts: Array.from({ length:20 }, (_, i)=> 'dato ' + i), examples: Array.from({ length:9 }, (_, i)=> 'ej ' + i) });
    let r = await call({ body:many, provider: cfReply(JSON.stringify({ explanation:'x', tip:'y' })) });
    const user = r.calls[0].body.messages.map(m => m.content).join('\n');
    assert(/dato 4/.test(user) && !/dato 5/.test(user)); assert(/ej 2/.test(user) && !/ej 3/.test(user));
    r = await call({ body:Object.assign({}, INSIGHT, { scope:'otra' }) }); assert.strictEqual(r.out.reason, 'bad_input'); assert.strictEqual(r.calls.length, 0);
    r = await call({ body:Object.assign({}, INSIGHT, { facts:['solo uno'] }) }); assert.strictEqual(r.out.reason, 'bad_input'); assert.strictEqual(r.calls.length, 0);
  });
  await test('insight: sin explicación se descarta (bad_output); el consejo ya es opcional', async()=>{
    let r = await call({ body:INSIGHT, provider: cfReply(JSON.stringify({ explanation:'', tip:'x' })) });
    assert.strictEqual(r.out.reason, 'bad_output');
    r = await call({ body:INSIGHT, provider: cfReply(JSON.stringify({ explanation:'Mezclas on con in.', tip:'', focus_topic:'none', focus_action:'none' })) });
    assert.strictEqual(r.out.ok, true); assert.strictEqual(r.out.answer.tip, ''); assert(!('focus_topic' in r.out.answer));
  });
  await test('insight: el tema extra es un enum cerrado con los ids que mandó la página (+ none)', async()=>{
    const r = await call({ body:INSIGHT, provider: cfReply(JSON.stringify({ explanation:'x', tip:'', focus_topic:'by-until', focus_action:'lesson' })) });
    const sch = r.calls[0].body.response_format.json_schema.schema;
    assert.deepStrictEqual(sch.properties.focus_topic.enum, ['in-on-at', 'by-until', 'none']);
    assert.deepStrictEqual(sch.properties.focus_action.enum, ['lesson', 'practice', 'none']);
    const user = r.calls[0].body.messages.map(m => m.content).join('\n');
    assert(/in-on-at = In, on y at; by-until = By y until/.test(user));
    assert.deepStrictEqual({ t:r.out.answer.focus_topic, a:r.out.answer.focus_action }, { t:'by-until', a:'lesson' });
  });
  await test('insight: un topic_id inventado o fuera de la lista se descarta (la respuesta sigue valiendo)', async()=>{
    for(const bad of ['verbos-irregulares', 'http://malo.com', 'IN-ON-AT', 'in-on-at; DROP']){
      const r = await call({ body:INSIGHT, provider: cfReply(JSON.stringify({ explanation:'Mezclas on con in.', tip:'', focus_topic:bad, focus_action:'lesson' })) });
      assert.strictEqual(r.out.ok, true, bad); assert(!('focus_topic' in r.out.answer) && !('focus_action' in r.out.answer), bad);
    }
  });
  await test('insight: candidatos con formato raro se ignoran; máximo 3; sin candidatos no se piden campos extra', async()=>{
    const body = Object.assign({}, INSIGHT, { candidates:[{ id:'a-1', label:'A' }, { id:'MALO ID', label:'x' }, { id:'b-2' }, { id:'c-3', label:'C' }, { id:'d-4', label:'D' }, { id:'e-5', label:'E' }] });
    let r = await call({ body, provider: cfReply(JSON.stringify({ explanation:'x', tip:'' })) });
    assert.deepStrictEqual(r.calls[0].body.response_format.json_schema.schema.properties.focus_topic.enum, ['a-1', 'c-3', 'd-4', 'none']);
    r = await call({ body:Object.assign({}, INSIGHT, { candidates:[] }), provider: cfReply(JSON.stringify({ explanation:'x', tip:'y', focus_topic:'in-on-at' })) });
    const props = r.calls[0].body.response_format.json_schema.schema.properties;
    assert(!props.focus_topic && !props.focus_action, 'sin candidatos no se piden esos campos');
    assert(!('focus_topic' in r.out.answer));
  });
  await test('insight: el servidor sigue haciendo UNA sola llamada al proveedor', async()=>{
    const r = await call({ body:INSIGHT, provider: cfReply(JSON.stringify({ explanation:'x', tip:'y', focus_topic:'in-on-at', focus_action:'practice' })) });
    assert.strictEqual(r.calls.length, 1);
  });
  await test('se registra el tipo real de fallo (timeout, quota, bad_output, daily_limit)', async()=>{
    let r = await call({ provider: async()=>{ const e = new Error('x'); e.name = 'AbortError'; throw e; } });
    assert.strictEqual(r.out.reason, 'timeout'); assert(r.recorded.some(x => x.p_provider === 'fail:timeout'));
    r = await call({ provider: cfReply('{}', null, 429) });
    assert(r.recorded.some(x => x.p_provider === 'fail:quota'));
    r = await call({ provider: cfReply('no es json') });
    assert(r.recorded.some(x => x.p_provider === 'fail:bad_output'));
    r = await call({ reserve:{ data:'user_limit', error:null } });
    assert(r.recorded.some(x => x.p_provider === 'fail:daily_limit'));
  });
  // ---- Idempotencia por request_id ----
  const RID = Object.assign({}, EXPLAIN, { request_id:'req-abc-12345' });
  const usedToday = db => [...db.usage.values()].reduce((a, b)=> a + b, 0);
  await test('dos pedidos simultáneos con el mismo request_id: solo uno llama al modelo y los dos reciben la misma respuesta', async()=>{
    const db = newDb();
    const [a, b] = await Promise.all([call({ db, body:RID, delayMs:30 }), call({ db, body:RID, delayMs:30 })]);
    assert.strictEqual(a.calls.length + b.calls.length, 1, 'una sola llamada real al proveedor');
    assert.strictEqual(a.out.ok, true); assert.strictEqual(b.out.ok, true);
    assert.deepStrictEqual(a.out.answer, b.out.answer);
    assert.strictEqual(usedToday(db), 1, 'una sola explicación descontada');
  });
  await test('timeout del cliente mientras la 1ª sigue ejecutándose: el reintento espera y NO vuelve a llamar al modelo', async()=>{
    const db = newDb();
    const first = call({ db, body:RID, delayMs:40 });          // el navegador "se rindió", pero el servidor sigue
    await sleepReal(5);
    const retry = await call({ db, body:RID, delayMs:40 });
    const f = await first;
    assert.strictEqual(f.calls.length, 1); assert.strictEqual(retry.calls.length, 0, 'el reintento no llama al proveedor');
    assert.strictEqual(retry.out.ok, true); assert.deepStrictEqual(retry.out.answer, f.out.answer);
    assert.strictEqual(usedToday(db), 1);
  });
  await test('completed: devuelve exactamente la respuesta guardada sin 2ª llamada; repetido 10 veces no consume más límite', async()=>{
    const db = newDb();
    const first = await call({ db, body:RID });
    assert.strictEqual(first.out.ok, true);
    let extraCalls = 0, last = null;
    for(let i = 0; i < 10; i++){ last = await call({ db, body:RID }); extraCalls += last.calls.length; assert.deepStrictEqual(last.out.answer, first.out.answer); }
    assert.strictEqual(extraCalls, 0); assert.strictEqual(usedToday(db), 1);
    assert.strictEqual(db.rows.get('u-123|req-abc-12345').attempts, 1, 'un solo intento real');
  });
  await test('processing normal: si no termina en unos segundos responde in_progress (sin llamar al modelo ni gastar límite)', async()=>{
    const db = newDb();
    const first = call({ db, body:RID, delayMs:400 });
    await sleepReal(5);
    const retry = await call({ db, body:RID });
    assert.strictEqual(retry.out.ok, false); assert.strictEqual(retry.out.reason, 'in_progress'); assert.strictEqual(retry.calls.length, 0);
    assert(retry.recorded.some(x => x.p_provider === 'fail:in_progress'));
    await first; assert.strictEqual(usedToday(db), 1);
  });
  await test('processing abandonado (función muerta, >45 s): se retoma como intento 2 sin gastar límite; con 2 intentos ya usados no llama más', async()=>{
    const db = newDb(); let now = 1e12; db.clock = ()=> now;
    db.rows.set('u-123|req-abc-12345', { day:new Date(now).toISOString().slice(0,10), status:'processing', answer:null, reason:null, attempts:1, created_at:now, updated_at:now });
    db.usage.set('u-123|' + new Date(now).toISOString().slice(0,10), 1);
    now += 20000; let r = await call({ db, body:RID, delayMs:1 });
    assert.strictEqual(r.out.reason, 'in_progress', 'a los 20 s todavía se considera en curso'); assert.strictEqual(r.calls.length, 0);
    now += 40000; r = await call({ db, body:RID });
    assert.strictEqual(r.out.ok, true); assert.strictEqual(r.calls.length, 1); assert.strictEqual(db.rows.get('u-123|req-abc-12345').attempts, 2); assert.strictEqual(usedToday(db), 1);
    const db2 = newDb(); let now2 = 1e12; db2.clock = ()=> now2;
    db2.rows.set('u-123|req-abc-12345', { day:'2001-09-09', status:'processing', answer:null, reason:null, attempts:2, created_at:now2, updated_at:now2 });
    now2 += 60000; r = await call({ db:db2, body:RID });
    assert.strictEqual(r.out.ok, false); assert.strictEqual(r.out.final, true); assert.strictEqual(r.calls.length, 0, 'sin más llamadas al proveedor');
  });
  await test('primer fallo + segundo intento permitido; el tercero se bloquea (máx. 2 intentos reales por request_id)', async()=>{
    const db = newDb();
    const fail = cfReply('{}', null, 429);
    let r1 = await call({ db, body:RID, provider:fail });
    assert.strictEqual(r1.out.ok, false); assert.strictEqual(r1.out.reason, 'quota'); assert.strictEqual(r1.calls.length, 1);
    assert(r1.recorded.some(x => x.p_provider === 'fail:quota'));
    let r2 = await call({ db, body:RID, provider:fail });
    assert.strictEqual(r2.calls.length, 1, 'el 2º intento sí llama');
    let r3 = await call({ db, body:RID }); // aunque ahora el proveedor funcionaría
    assert.strictEqual(r3.calls.length, 0, 'el 3º NO llama'); assert.strictEqual(r3.out.ok, false); assert.strictEqual(r3.out.final, true); assert.strictEqual(r3.out.reason, 'quota');
    for(let i = 0; i < 5; i++){ const x = await call({ db, body:RID }); assert.strictEqual(x.calls.length, 0); }
    assert.strictEqual(usedToday(db), 1, 'nunca se convierte en una explicación nueva');
    // primer fallo, segundo bien
    const db2 = newDb();
    await call({ db:db2, body:RID, provider:fail });
    const ok = await call({ db:db2, body:RID });
    assert.strictEqual(ok.out.ok, true); assert.strictEqual(usedToday(db2), 1);
    assert.strictEqual((await call({ db:db2, body:RID })).calls.length, 0, 'ya completada: no llama más');
  });
  await test('límite diario de 100: el 100 pasa, el 101 se rechaza (final) y no llama al modelo; el id repetido no cuenta', async()=>{
    const db = newDb(); assert.strictEqual(db.limit, 100);
    db.usage.set('u-123|' + new Date().toISOString().slice(0,10), 99);
    const ok = await call({ db, body:Object.assign({}, EXPLAIN, { request_id:'req-last-0001' }) });
    assert.strictEqual(ok.out.ok, true); assert.strictEqual(usedToday(db), 100);
    const again = await call({ db, body:Object.assign({}, EXPLAIN, { request_id:'req-last-0001' }) });
    assert.strictEqual(again.out.ok, true); assert.strictEqual(again.calls.length, 0); assert.strictEqual(usedToday(db), 100);
    const over = await call({ db, body:Object.assign({}, EXPLAIN, { request_id:'req-over-0002' }) });
    assert.strictEqual(over.out.reason, 'daily_limit'); assert.strictEqual(over.out.final, true); assert.strictEqual(over.calls.length, 0);
    assert(over.recorded.some(x => x.p_provider === 'fail:daily_limit'));
    assert.strictEqual(db.rows.has('u-123|req-over-0002'), false, 'un id rechazado no queda ocupando lugar');
    const sql = fs.readFileSync(path.join(root, 'supabase_functions', 'leo-ai.sql'), 'utf8');
    assert(/user_daily_limit int not null default 100/.test(sql)); assert(/set user_daily_limit = 100;/.test(sql)); assert(!/user_daily_limit[^;\n]*\b30\b/.test(sql));
  });
  await test('día UTC: a las 23:59:59.999Z y a las 00:00:00.000Z el límite cambia de día (el servidor decide, no el navegador)', async()=>{
    const t1 = Date.UTC(2026, 9, 3, 23, 59, 59, 999), t2 = Date.UTC(2026, 9, 4, 0, 0, 0, 0);
    const db = newDb({ limit:1 });
    db.clock = ()=> t1;
    let r = await call({ db, now:t1, body:Object.assign({}, EXPLAIN, { request_id:'req-day1-0001', day:'2030-01-01', today:'1999-01-01' }) });
    assert.strictEqual(r.out.ok, true);
    r = await call({ db, now:t1, body:Object.assign({}, EXPLAIN, { request_id:'req-day1-0002' }) });
    assert.strictEqual(r.out.reason, 'daily_limit', 'mismo día UTC: se agotó');
    db.clock = ()=> t2;
    r = await call({ db, now:t2, body:Object.assign({}, EXPLAIN, { request_id:'req-day2-0001' }) });
    assert.strictEqual(r.out.ok, true, 'ya es otro día UTC');
    assert.deepStrictEqual([...db.usage.keys()].sort(), ['u-123|2026-10-03', 'u-123|2026-10-04']);
    // camino sin request_id (versión anterior del navegador): también UTC
    const a = await call({ now:t1, body:EXPLAIN }), b = await call({ now:t2, body:EXPLAIN });
    assert.strictEqual(a.reserveArgs[0].p_day, '2026-10-03'); assert.strictEqual(b.reserveArgs[0].p_day, '2026-10-04');
  });
  await test('compatibilidad: si el SQL nuevo aún no existe, sigue funcionando con la reserva de siempre (sin idempotencia)', async()=>{
    const db = newDb({ missing:true });
    const r = await call({ db, body:RID });
    assert.strictEqual(r.out.ok, true); assert.strictEqual(r.calls.length, 1);
    assert.strictEqual(r.reserveArgs.length, 1); assert.strictEqual(usedToday(db), 1);
  });
  await test('un request_id con formato raro se ignora (usa la reserva de siempre)', async()=>{
    const db = newDb(); db.begin = ()=>{ throw new Error('no debe usarse'); };
    const r = await call({ db, body:Object.assign({}, EXPLAIN, { request_id:'x; drop table' }) });
    assert.strictEqual(r.out.ok, true);
  });
  console.log((failed ? failed + ' prueba(s) fallaron, ' : '') + passed + ' pruebas pasaron');
  process.exit(failed ? 1 : 0);
})();
