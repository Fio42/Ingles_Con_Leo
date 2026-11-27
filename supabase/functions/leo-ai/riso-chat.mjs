// ============================================================
// Riso · modo "chat" de la función leo-ai (servidor). PREPARADO, NO DESPLEGADO.
// Lo usa index.ts solo cuando body.mode === 'chat'. Los modos actuales de Leo AI no cambian.
//
// Orden: sesión (ya verificada en index.ts) → datos mínimos y recortados → filtro del servidor (el mismo motor del
// navegador: datos personales, manipulación, temas sensibles, fuera de alcance, Soporte) → contexto del ejercicio
// resuelto con el índice del servidor → reserva atómica en la base (riso_chat_reserve: interruptor, piloto, cuotas,
// presupuesto compartido con Leo AI dentro de las neuronas gratis) → Gemma 4 en Cloudflare → validación de la
// respuesta → cierre (riso_chat_finish) con tokens y neuronas reales. Nunca guarda ni registra el texto del alumno.
// ============================================================
import './riso-motor.js' // copia de riso/tutor/riso-tutor.js (la genera tools/tutor/generar_indice_ejercicios.js)

const R = globalThis.RisoTutor
export const CHAT = { maxPregunta: 400, maxHistorial: 6, maxTextoHistorial: 700, maxSalida: 220, maxRespuesta: 700, timeoutMs: 20000 }
const CF_NEURONS_PER_M = { input: 9091, output: 27273 }

export const RISO_REGLAS = [
  'Eres Riso, el tutor de inglés con inteligencia artificial de la academia Inglés con Leo. Hablas con estudiantes hispanohablantes.',
  'Responde SIEMPRE en español, en 2 a 4 frases cortas, claras y correctas. Cuando ayude, da un ejemplo en inglés con su traducción.',
  'Solo ayudas con inglés: traducir, explicar gramática y vocabulario, pronunciación aproximada, corregir frases y preparar situaciones reales.',
  'Si te preguntan algo que no es de inglés, dilo con amabilidad y ofrece decirlo en inglés. No des consejos médicos, legales ni financieros.',
  'No hables de precios, pagos ni cuentas: eso lo resuelve Soporte. No pidas ni repitas datos personales.',
  'Si no estás seguro, dilo y sugiere revisar la guía. Nunca inventes reglas. No digas que eres Profe Leo: eres una IA.',
  'Si hay un ejercicio, explica por qué la respuesta correcta es correcta y por qué la del alumno no, sin regañar.',
  'Devuelve solo JSON con: texto (la explicación), ejemplo_en y ejemplo_es (pueden ir vacíos).'
].join(' ')

export const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['texto', 'ejemplo_en', 'ejemplo_es'],
  properties: { texto: { type: 'string' }, ejemplo_en: { type: 'string' }, ejemplo_es: { type: 'string' } }
}

const idValido = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(s)
export const tokensAprox = (s) => Math.ceil(String(s || '').length / 3) // conservador para español
export const neuronas = (inp, out) => (inp * CF_NEURONS_PER_M.input + out * CF_NEURONS_PER_M.output) / 1e6

// 1) Entrada: solo lo necesario, recortado y sin datos personales.
export function validarEntrada(body) {
  if (!body || typeof body !== 'object') return { error: 'bad_input' }
  const pregunta = typeof body.pregunta === 'string' ? body.pregunta.trim() : ''
  if (!pregunta) return { error: 'bad_input' }
  if (pregunta.length > CHAT.maxPregunta) return { error: 'too_long' }
  if (!idValido(body.request_id)) return { error: 'bad_input' }
  const historial = (Array.isArray(body.historial) ? body.historial : []).slice(-CHAT.maxHistorial)
    .filter(m => m && (m.rol === 'alumno' || m.rol === 'riso') && typeof m.texto === 'string')
    .map(m => ({ rol: m.rol, texto: R._int.limpiarPII(m.texto.slice(0, CHAT.maxTextoHistorial)) }))
    .filter(m => !R._int.tienePII(m.texto))
  let contexto = null
  if (body.contexto && typeof body.contexto === 'object') {
    const c = body.contexto
    if (typeof c.itemId !== 'string' || !/^[a-z0-9-]{3,60}$/.test(c.itemId) || typeof c.respuestaAlumno !== 'string') return { error: 'bad_context' }
    contexto = { itemId: c.itemId, respuestaAlumno: c.respuestaAlumno.slice(0, 120) }
  }
  return { pregunta, historial, contexto, requestId: body.request_id }
}

// 2) Contexto del ejercicio: el enunciado y la respuesta correcta salen del índice del servidor, nunca del navegador.
//    Solo ejercicios de práctica publicados; las evaluaciones de la Academia no están en el índice.
export function resolverContexto(contexto, indice) {
  if (!contexto) return { ok: true, ctx: null }
  const it = indice[contexto.itemId]
  if (!it) return { ok: false, error: 'bad_context' }
  const elegida = contexto.respuestaAlumno.trim()
  if (!it.o.some(o => o.toLowerCase() === elegida.toLowerCase())) return { ok: false, error: 'bad_context' }
  return { ok: true, ctx: { tema: it.t, enunciado: it.e, respuestaAlumno: elegida, respuestaCorrecta: it.c } }
}

// 3) Filtro del servidor (por si alguien se salta el navegador). Devuelve una respuesta fija o null.
export function filtroServidor(pregunta, hayHistorial) {
  const n = R._int.norm(pregunta)
  const it = R._int.intencion(n, hayHistorial)
  const f = R._int.capaFiltro(pregunta, n, it)
  return f ? { texto: f.texto, tipo: f.tipo } : null
}

export function construirMensajes(pregunta, historial, ctx) {
  const partes = []
  if (ctx) partes.push(`Ejercicio (${ctx.tema}): «${ctx.enunciado}». El alumno respondió «${ctx.respuestaAlumno}». La respuesta correcta es «${ctx.respuestaCorrecta}».`)
  if (historial.length) partes.push('Conversación reciente:\n' + historial.map(m => (m.rol === 'alumno' ? 'Alumno: ' : 'Riso: ') + m.texto).join('\n'))
  partes.push('Pregunta del alumno: ' + pregunta)
  return [{ role: 'system', content: RISO_REGLAS }, { role: 'user', content: partes.join('\n\n') }]
}
export function estimarNeuronas(mensajes) {
  const inp = mensajes.reduce((s, m) => s + tokensAprox(m.content), 0) + 20
  return Math.round(neuronas(inp, CHAT.maxSalida) * 100) / 100
}

// 4) Respuesta del modelo: JSON válido, no vacía, recortada y sin datos personales.
export function validarSalida(raw) {
  let j = raw
  if (typeof raw === 'string') { try { j = JSON.parse(raw) } catch (_) { return null } }
  if (!j || typeof j.texto !== 'string') return null
  const texto = R._int.limpiarPII(j.texto.replace(/\s+/g, ' ').trim()).slice(0, CHAT.maxRespuesta)
  if (texto.length < 8) return null
  const ej = (s) => typeof s === 'string' ? R._int.limpiarPII(s.trim()).slice(0, 200) : ''
  return { texto, ejemplo_en: ej(j.ejemplo_en), ejemplo_es: ej(j.ejemplo_es) }
}

// Llamada a Cloudflare Workers AI (mismo proveedor y modelo que Leo AI).
export async function llamarCloudflare(mensajes, { fetchImpl, env }) {
  const account = env('CLOUDFLARE_ACCOUNT_ID'), token = env('CLOUDFLARE_API_TOKEN')
  if (!account || !token) return { ok: false, reason: 'not_configured' }
  const model = env('CLOUDFLARE_AI_MODEL') || '@cf/google/gemma-4-26b-a4b-it'
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), CHAT.timeoutMs)
  try {
    const res = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/${model}`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: mensajes, max_completion_tokens: CHAT.maxSalida, temperature: 0.2,
        chat_template_kwargs: { enable_thinking: false }, response_format: { type: 'json_schema', json_schema: { name: 'riso_chat', schema: SCHEMA } } })
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.success === false) {
      const msg = JSON.stringify(data && data.errors || '')
      return { ok: false, reason: (res.status === 429 || /allocation|quota|limit|4006/i.test(msg)) ? 'quota' : 'provider_error' }
    }
    const r = data.result || {}, c = Array.isArray(r.choices) ? r.choices[0] : null
    const raw = c && c.message ? c.message.content : (r.response !== undefined ? r.response : null)
    const u = r.usage || data.usage || {}
    return { ok: true, raw, usage: { input: u.prompt_tokens || 0, output: u.completion_tokens || 0 } }
  } catch (e) {
    return { ok: false, reason: e && e.name === 'AbortError' ? 'timeout' : 'network' }
  } finally { clearTimeout(t) }
}

const MOTIVOS = { disabled: 'disabled', not_allowed: 'not_allowed', unverified: 'unverified', user_limit: 'daily_limit', global_limit: 'busy',
  pilot_total: 'busy', riso_budget: 'busy', shared_ceiling: 'busy', too_long: 'too_long', bad_request: 'bad_input' }

/* Orquestación. deps: { rpc(nombre, args) → { data, error }, llamarModelo(mensajes) → resultado de llamarCloudflare,
   indice, ahora() → ms, log(objeto sin textos) }. Devuelve el cuerpo JSON para el navegador. */
export async function procesarChat(userId, body, deps) {
  const t0 = deps.ahora()
  const log = deps.log || (() => {})
  const e = validarEntrada(body)
  if (e.error) return { ok: false, reason: e.error }
  const fijo = filtroServidor(e.pregunta, e.historial.length > 0)
  if (fijo) { log({ ev: 'riso_chat', capa: 1, tipo: fijo.tipo }); return { ok: true, answer: { texto: fijo.texto, ejemplo_en: '', ejemplo_es: '' }, fixed: true } }
  const rc = resolverContexto(e.contexto, deps.indice)
  if (!rc.ok) return { ok: false, reason: rc.error }
  const mensajes = construirMensajes(R._int.limpiarPII(e.pregunta), e.historial, rc.ctx)
  const est = estimarNeuronas(mensajes)

  const { data: res, error } = await deps.rpc('riso_chat_reserve', { p_user: userId, p_request: e.requestId, p_est_neurons: est })
  if (error || !res) { log({ ev: 'riso_chat', fallo: 'reserve_error' }); return { ok: false, reason: 'busy' } }
  if (res.status === 'duplicate') return { ok: true, answer: res.answer, duplicate: true }
  if (res.status === 'in_progress') return { ok: false, reason: 'in_progress' }
  if (res.status !== 'ok') { log({ ev: 'riso_chat', limite: res.status }); return { ok: false, reason: MOTIVOS[res.status] || 'busy', final: true } }

  const r = await deps.llamarModelo(mensajes)
  const usage = r && r.usage ? r.usage : { input: 0, output: 0 }
  const n = neuronas(usage.input, usage.output)
  const salida = r && r.ok ? validarSalida(r.raw) : null
  await deps.rpc('riso_chat_finish', { p_user: userId, p_request: e.requestId, p_ok: !!salida, p_input: usage.input, p_output: usage.output, p_neurons: n, p_answer: salida })
  log({ ev: 'riso_chat', capa: 5, ok: !!salida, motivo: salida ? null : (r && r.reason) || 'bad_output', in: usage.input, out: usage.output, neuronas: Math.round(n * 100) / 100, est, ms: deps.ahora() - t0, ctx: !!rc.ctx, hist: e.historial.length })
  if (!salida) return { ok: false, reason: (r && r.reason === 'quota') ? 'busy' : 'retry' }
  return { ok: true, answer: salida }
}
