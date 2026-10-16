#!/usr/bin/env node
/* Genera out/eval-fn.ts: una Edge Function TEMPORAL que corre los casos de out/cases.json contra el MISMO modelo (Cloudflare Workers AI)
   con los secretos ya configurados, protegida por una llave aleatoria. Sirve para evaluar respuestas reales ANTES/DESPUÉS.
   Después de usarla se debe redesplegar como "apagada" (ver --off). No se versiona out/.   node tools/leo-ai-eval/make-eval-fn.js [--off] */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const out = path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive:true });
if(process.argv.includes('--off')){
  fs.writeFileSync(path.join(out, 'eval-fn-off.ts'), "Deno.serve(() => new Response(JSON.stringify({ ok:false, reason:'gone' }), { status:410, headers:{ 'content-type':'application/json', 'access-control-allow-origin':'*' } }))\n");
  console.log('out/eval-fn-off.ts listo'); process.exit(0);
}
const cases = require('./out/cases.json');
const key = crypto.randomBytes(24).toString('hex');
fs.writeFileSync(path.join(out, 'eval-key.txt'), key);
// Plantillas IDENTICAS a buildPrompt("explain") antes/despues; se verifican contra cases.json mas abajo.
const levelLine = 'Nivel del alumno: f\u00e1cil (A1-A2)';
function build(v, d){
  const L = ['Habilidad: ' + d.skill, levelLine];
  if(d.topic) L.push('Tema: ' + d.topic);
  L.push('Tipo de ejercicio: ' + d.etype, 'Pregunta: ' + d.q, 'Opciones: ' + d.opts.join(' | '));
  if(v === 'b') L.push('Respuesta del alumno: ' + d.s); else L.push('Respuesta del alumno (INCORRECTA): ' + d.s);
  L.push('Respuesta correcta: ' + d.c, 'El alumno FALL\u00d3.');
  if(v === 'b') L.push('Explicaci\u00f3n del ejercicio: ' + d.base);
  else { L.push('Explicaci\u00f3n que ya ley\u00f3 (no la repitas): ' + d.base); if(d.shown.length) L.push('Ejemplos que ya ve en pantalla (no los repitas ni los reutilices): ' + d.shown.join(' | ')); }
  return L.join('\n');
}
const data = cases.map(c => {
  const m = c.before.text.match(/^Habilidad: (.*)\n.*\n(?:Tema: (.*)\n)?Tipo de ejercicio: (.*)\nPregunta: (.*)\nOpciones: (.*)\nRespuesta del alumno: (.*)\nRespuesta correcta: (.*)\nEl alumno FALL\u00d3\.\nExplicaci\u00f3n del ejercicio: ([\s\S]*)$/);
  if(!m) throw new Error('no se pudo descomponer el caso ' + c.n);
  const d = { skill:m[1], topic:m[2] || '', etype:m[3], q:m[4], opts:m[5].split(' | '), s:m[6], c:m[7], base:m[8], shown:c.shown };
  if(build('b', d) !== c.before.text) throw new Error('plantilla antes distinta en caso ' + c.n);
  if(build('a', d) !== c.after.text) throw new Error('plantilla despues distinta en caso ' + c.n);
  [d.topic, d.q, d.s, d.c, d.base, d.etype, d.skill].concat(d.opts, d.shown).forEach(x => { if(/[`\\]|\$\{/.test(x)) throw new Error('caracter no permitido en caso ' + c.n); });
  return [d.skill, d.topic, d.etype, d.q, d.opts.join(' | '), d.s, d.c, d.base, d.shown.join(' | ')];
});
for(const r of [cases[0].before.rules, cases[0].after.rules]) if(/[`\\]|\$\{/.test(r)) throw new Error('reglas con caracter no permitido');
const T = x => '`' + x + '`';
const src = `const KEY = ${T(key)}
const RB = ${T(cases[0].before.rules)}
const RA = ${T(cases[0].after.rules)}
const D: string[][] = [
${data.map(r => '[' + r.map(T).join(',') + ']').join(',\n')}
]
const NL = String.fromCharCode(10)
function build(v: string, d: string[]) {
  const L = ['Habilidad: ' + d[0], ${T(levelLine)}]
  if (d[1]) L.push('Tema: ' + d[1])
  L.push('Tipo de ejercicio: ' + d[2], 'Pregunta: ' + d[3], 'Opciones: ' + d[4])
  L.push(v === 'b' ? 'Respuesta del alumno: ' + d[5] : 'Respuesta del alumno (INCORRECTA): ' + d[5])
  L.push('Respuesta correcta: ' + d[6], ${T('El alumno FALL\u00d3.')})
  if (v === 'b') L.push(${T('Explicaci\u00f3n del ejercicio: ')} + d[7])
  else { L.push(${T('Explicaci\u00f3n que ya ley\u00f3 (no la repitas): ')} + d[7]); if (d[8]) L.push('Ejemplos que ya ve en pantalla (no los repitas ni los reutilices): ' + d[8]) }
  return L.join(NL)
}
const SCHEMA = { type: 'object', properties: { explanation: { type: 'string' }, example_en: { type: 'string' }, example_es: { type: 'string' } }, required: ['explanation', 'example_en', 'example_es'], additionalProperties: false }
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
async function cf(rules: string, text: string) {
  const acc = Deno.env.get('CLOUDFLARE_ACCOUNT_ID') || '', tok = Deno.env.get('CLOUDFLARE_API_TOKEN') || ''
  const model = Deno.env.get('CLOUDFLARE_AI_MODEL') || '@cf/google/gemma-4-26b-a4b-it'
  const t0 = Date.now(); const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 20000)
  try {
    const r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(acc) + '/ai/run/' + model, { method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
      body: JSON.stringify({ messages: [{ role: 'system', content: rules }, { role: 'user', content: text }], max_completion_tokens: 220, temperature: 0.2,
        chat_template_kwargs: { enable_thinking: false }, response_format: { type: 'json_schema', json_schema: { name: 'leo_ai_explain', schema: SCHEMA } } }) })
    const dd = await r.json().catch(() => null)
    const res = (dd && dd.result) || {}; const ch = Array.isArray(res.choices) ? res.choices[0] : null
    const u = res.usage || {}
    return { ok: r.ok && !!dd && dd.success !== false, status: r.status, raw: ch && ch.message ? ch.message.content : (res.response ?? null), inTok: u.prompt_tokens || 0, outTok: u.completion_tokens || 0, ms: Date.now() - t0 }
  } catch (e) { return { ok: false, status: 0, raw: null, inTok: 0, outTok: 0, ms: Date.now() - t0, err: String(e).slice(0, 80) } } finally { clearTimeout(tm) }
}
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const b = await req.json().catch(() => null)
  if (!b || b.key !== KEY) return J({ ok: false }, 403)
  const from = Math.max(0, b.from | 0), to = Math.min(D.length, b.to | 0 || D.length)
  const jobs: Promise<unknown>[] = []
  for (let i = from; i < to; i++) {
    if (b.which !== 'after') jobs.push(cf(RB, build('b', D[i])).then(r => ({ n: i + 1, v: 'before', ...r })))
    if (b.which !== 'before') jobs.push(cf(RA, build('a', D[i])).then(r => ({ n: i + 1, v: 'after', ...r })))
  }
  return J({ ok: true, results: await Promise.all(jobs) })
})
`;
fs.writeFileSync(path.join(out, 'eval-fn.ts'), src);
console.log('out/eval-fn.ts listo (' + src.length + ' bytes); plantillas verificadas contra cases.json; llave en out/eval-key.txt');
