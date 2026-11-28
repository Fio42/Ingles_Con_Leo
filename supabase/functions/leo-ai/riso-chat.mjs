// ============================================================
// Riso · modo "chat" de la función leo-ai (servidor).
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
  'Eres Riso, la mascota y el asistente inteligente de Inglés con Leo. Profe Leo es el profesor, el creador del método y la figura principal de la academia; tú atiendes las consultas de los estudiantes hispanohablantes mientras practican.',
  'Tienes personalidad propia: eres simpático, cercano y animado, y puedes hacer alguna broma ligera cuando venga al caso, sin desviar la explicación. No menciones a Profe Leo salvo que el alumno pregunte por él o el contexto lo haga relevante.',
  'Responde SIEMPRE en español, en 2 a 4 frases cortas, claras y correctas. Cuando ayude, da un ejemplo en inglés con su traducción.',
  'Solo ayudas con inglés: traducir, explicar gramática y vocabulario, pronunciación aproximada, corregir frases y preparar situaciones reales.',
  'Si te preguntan algo que no es de inglés, dilo con amabilidad y ofrece decirlo en inglés. No des consejos médicos, legales ni financieros.',
  'No hables de precios, pagos ni cuentas: eso lo resuelve Soporte. No pidas ni repitas datos personales.',
  'Si no estás seguro, dilo y sugiere revisar la guía. Nunca inventes reglas. Nunca te presentes como profesor, tutor ni maestro, ni digas que reemplazas a Profe Leo: eres su asistente y usas inteligencia artificial.',
  'Si hay un ejercicio, el dato ACERTÓ o FALLÓ es la verdad: si acertó, confírmalo y explica por qué; si falló, explica por qué la correcta es correcta y por qué la suya no, sin regañar.',
  'Exactitud antes que brevedad. No digas «siempre» ni «nunca» de una regla que tiene excepciones: usa «normalmente» o «en general». Will no expresa certeza por sí mismo. El presente perfecto también va con periodos no terminados (today, this week).',
  'Pronunciación: si usas IPA, escríbela entre barras y di que es IPA; si das una aproximación con letras del español, di que es aproximada. No mezcles las dos. La th tiene un sonido sordo /θ/ (think) y uno sonoro /ð/ (this).',
  'No recomiendes audios, videos, apps, páginas ni otros recursos: la plataforma agrega la guía cuando existe.',
  'Los ejemplos deben ser frases naturales que diría un hablante nativo, con una traducción natural al español. Si piden otro ejemplo, usa otra situación y otras palabras, distinto de los ejemplos ya mostrados en la conversación.',
  'En la traducción al español, usa ¿? y ¡! solo si la frase es una pregunta o una exclamación.',
  'Si piden una forma más educada o cortés, da una petición o frase realmente cortés (por ejemplo Could I…?, I would like…, Would it be possible to…?), no solo una versión más suave.',
  'Si preguntan por excepciones, menciona solo matices reales y conocidos del inglés estándar; si no hay una excepción real, dilo con claridad y da un matiz útil del uso, sin inventar.',
  'Si el alumno ya vio una explicación del ejercicio, no la repitas: aporta algo nuevo (otro ángulo, otro ejemplo, una comparación, un truco para recordarlo o su error concreto).',
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
  // Un mensaje del alumno que el filtro bloquearía (manipulación, insulto, tema sensible) no viaja como historial,
  // y tampoco la respuesta que le siguió: el historial no puede usarse para colar lo que la pregunta no deja pasar.
  const limpio = []
  for (let i = 0; i < historial.length; i++) {
    const m = historial[i]
    if (m.rol === 'alumno') {
      const n = R._int.norm(m.texto), f = R._int.capaFiltro(m.texto, n, R._int.intencion(n, false))
      if (f && (f.bloqueado || f.privado)) { if (historial[i + 1] && historial[i + 1].rol === 'riso') i++; continue }
    }
    limpio.push(m)
  }
  let contexto = null
  if (body.contexto && typeof body.contexto === 'object') {
    const c = body.contexto
    if (typeof c.itemId !== 'string' || !/^[a-z0-9-]{3,60}$/.test(c.itemId) || typeof c.respuestaAlumno !== 'string') return { error: 'bad_context' }
    contexto = { itemId: c.itemId, respuestaAlumno: c.respuestaAlumno.slice(0, 120) }
  }
  return { pregunta, historial: limpio, contexto, requestId: body.request_id }
}

// 2) Contexto del ejercicio: el enunciado y la respuesta correcta salen del índice del servidor, nunca del navegador.
//    Solo ejercicios de práctica publicados; las evaluaciones de la Academia no están en el índice.
export function resolverContexto(contexto, indice) {
  if (!contexto) return { ok: true, ctx: null }
  const it = indice[contexto.itemId]
  if (!it) return { ok: false, error: 'bad_context' }
  const elegida = contexto.respuestaAlumno.trim()
  if (it.k === 'error') {
    // Misma regla que la práctica real (app.js, tipo 'error'): acierta si la palabra tocada está dentro de la marcada.
    if (!/^\d{1,2}$/.test(elegida)) return { ok: false, error: 'bad_context' }
    const i = Number(elegida)
    if (i >= it.p.length) return { ok: false, error: 'bad_context' }
    return { ok: true, ctx: { tema: it.t, tipo: 'error', enunciado: it.e, respuestaAlumno: it.p[i].replace(/[.,?!]/g, ''),
      respuestaCorrecta: it.c, fraseCorrecta: it.f, acerto: i >= it.s[0] && i <= it.s[1], explicacion: it.x || '' } }
  }
  const op = it.o.find(o => o.toLowerCase() === elegida.toLowerCase())
  if (!op) return { ok: false, error: 'bad_context' }
  return { ok: true, ctx: { tema: it.t, enunciado: it.e, respuestaAlumno: op, respuestaCorrecta: it.c, acerto: op.toLowerCase() === it.c.toLowerCase(), explicacion: it.x || '' } }
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
  if (ctx && ctx.tipo === 'error') partes.push(`Ejercicio (${ctx.tema}). Consigna: encontrar la palabra incorrecta en «${ctx.enunciado}». El alumno tocó «${ctx.respuestaAlumno}» y ${ctx.acerto ? 'ACERTÓ' : 'FALLÓ'}. La palabra incorrecta es «${ctx.respuestaCorrecta}» y la frase correcta es «${ctx.fraseCorrecta}».`)
  else if (ctx) partes.push(`Ejercicio (${ctx.tema}): «${ctx.enunciado}». El alumno respondió «${ctx.respuestaAlumno}» y ${ctx.acerto ? 'ACERTÓ' : 'FALLÓ'}. La respuesta correcta es «${ctx.respuestaCorrecta}».`)
  if (ctx && ctx.explicacion) partes.push(`Explicación que el alumno ya vio en la corrección (no la repitas): «${String(ctx.explicacion).slice(0, 300)}».`)
  if (historial.length) partes.push('Conversación reciente:\n' + historial.map(m => (m.rol === 'alumno' ? 'Alumno: ' : 'Riso: ') + m.texto).join('\n'))
  partes.push('Pregunta del alumno: ' + pregunta)
  return [{ role: 'system', content: RISO_REGLAS }, { role: 'user', content: partes.join('\n\n') }]
}
export function estimarNeuronas(mensajes) {
  const inp = mensajes.reduce((s, m) => s + tokensAprox(m.content), 0) + 20
  return Math.round(neuronas(inp, CHAT.maxSalida) * 100) / 100
}

// 4) Respuesta del modelo: JSON válido, no vacía, recortada y sin datos personales.
// Frases que recomiendan un recurso que no podemos comprobar (audio, video, app, página): se quitan. La guía real la
// agrega la plataforma con su enlace verificado.
const RECURSO = /\b(escuch\w*|audio|video|v[ií]deo|app|aplicaci[oó]n|glosario|p[aá]gina|sitio web|enlace|link|youtube|podcast|diccionario)\b/i
const RECOMIENDA = /\b(te recomiendo|recomiendo|te sugiero|puedes (escuchar|ver|consultar|revisar|buscar|visitar|usar)|consulta|visita|revisa|busca|escucha|mira)\b/i
// Identidad: Profe Leo es el profesor; Riso, el asistente inteligente de la academia. Solo se corrige cuando RISO se
// atribuye ese papel («soy tu tutor», «como tu profesor», «tu profesor Riso»). Las palabras profesor, maestro o tutor en
// explicaciones, traducciones y ejemplos («Soy profesor» = I am a teacher) no se tocan, y lo que va entre comillas tampoco.
const ROL = '(?:nuevo |nueva )?(?:profesor|profesora|tutor|tutora|maestro|maestra|profe)(?: de ingl[eé]s| personal| particular| virtual)?'
const AUTOATRIBUCION = [
  [new RegExp('\\b(soy|seré|sere) (?:tu|el|la) ' + ROL + '\\b', 'gi'), (m, v) => v + ' el asistente inteligente de Inglés con Leo'],
  // Con «un/una» solo si el papel es claro (soy un profesor de inglés / soy un tutor.): «soy un maestro de los phrasal verbs» es una broma.
  [new RegExp('\\b(soy|seré|sere) (?:un|una) (?:profesor|profesora|tutor|tutora|maestro|maestra|profe)(?: de ingl[eé]s| personal| particular| virtual|(?=[.,;:!?]|$))', 'gi'), (m, v) => v + ' el asistente inteligente de Inglés con Leo'],
  [new RegExp('\\b(como|siendo) tu ' + ROL + '\\b', 'gi'), (m, v) => v + ' asistente de Inglés con Leo'],
  [new RegExp('\\btu ' + ROL + ' Riso\\b', 'gi'), () => 'Riso'],
]
export function corregirIdentidad(texto) {
  // Se trabaja solo fuera de las comillas («...», "...", “...”, '...').
  return String(texto).split(/(«[^»]*»|"[^"]*"|“[^”]*”|'[^']*')/).map((tramo, i) => {
    if (i % 2) return tramo
    return AUTOATRIBUCION.reduce((t, [re, fn]) => t.replace(re, fn), tramo)
  }).join('')
}
export function quitarRecursos(texto) {
  const frases = texto.match(/[^.!?]+[.!?]*/g) || [texto]
  const quedan = frases.filter(f => !(RECURSO.test(f) && RECOMIENDA.test(f)))
  return (quedan.length ? quedan : frases).join('').replace(/\s+/g, ' ').trim()
}
export function validarSalida(raw) {
  let j = raw
  if (typeof raw === 'string') { try { j = JSON.parse(raw) } catch (_) { return null } }
  if (!j || typeof j.texto !== 'string') return null
  const texto = corregirIdentidad(quitarRecursos(R._int.limpiarPII(j.texto.replace(/\s+/g, ' ').trim()))).slice(0, CHAT.maxRespuesta)
  if (texto.length < 8) return null
  const ej = (s) => typeof s === 'string' ? R._int.limpiarPII(s.trim()).slice(0, 200) : ''
  return { texto, ejemplo_en: ej(j.ejemplo_en), ejemplo_es: ej(j.ejemplo_es) }
}

// Índice de ejercicios: el mismo archivo público del sitio (riso-ejercicios.json), cacheado en memoria 1 hora.
let _indice = null, _indiceT = 0
export async function cargarIndice(url, fetchImpl) {
  if (_indice && Date.now() - _indiceT < 3600000) return _indice
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 5000)
    const r = await fetchImpl(url, { signal: ctrl.signal }); clearTimeout(t)
    if (!r.ok) return _indice
    const j = await r.json()
    if (j && typeof j === 'object' && Object.keys(j).length > 100) { _indice = j; _indiceT = Date.now() }
  } catch (_) { /* sin índice: el modo ejercicio responde bad_context */ }
  return _indice
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

// Estado de Riso para esta cuenta (sin IA, sin gastar nada).
export const INDICE_URL = 'https://inglesconleo.com/supabase/functions/leo-ai/riso-ejercicios.json'
export async function estadoChat(userId, deps) {
  const { data, error } = await deps.rpc('riso_chat_status', { p_user: userId })
  if (error || !data || typeof data !== 'object') return { ok: true, riso: { enabled: false } }
  // La página consulta el estado al abrirse: se aprovecha para tener listo el índice de ejercicios (la primera pregunta
  // sobre un ejercicio ya no espera a descargarlo). Solo en el servidor real (Deno) y sin esperar el resultado.
  if (data.enabled === true) {
    const precargar = deps.precargarIndice || (typeof Deno !== 'undefined' ? () => cargarIndice((Deno.env.get('RISO_EJERCICIOS_URL') || INDICE_URL), fetch) : null)
    if (precargar) Promise.resolve().then(precargar).catch(() => {})
  }
  return { ok: true, riso: data }
}

// ---------- Caché compartida de respuestas genéricas (APAGADA por defecto: leo_ai_config.riso_cache) ----------
// Solo preguntas sueltas de inglés (sin ejercicio, sin conversación previa, sin datos personales) de traducción,
// significado, pronunciación o explicación. Se guarda la pregunta NORMALIZADA (sin datos personales) y la respuesta ya
// validada, para reutilizarla con otro alumno que pregunte lo mismo. No es la biblioteca oficial: Leo revisa, aprueba o
// retira (riso_cache_revisar / riso_cache_aprobar / riso_cache_retirar); un «No me ayudó» la retira sola.
const CACHE_INTENCIONES = { traduccion: 1, significado: 1, pronunciacion: 1, explicacion: 1 }
export function preguntaCacheable(pregunta, historial, contexto) {
  if (contexto || (historial && historial.length)) return null
  if (R._int.tienePII(pregunta)) return null
  const n = R._int.norm(pregunta), it = R._int.intencion(n, false)
  if (!CACHE_INTENCIONES[it.tipo] || n.length < 4 || n.length > 160) return null
  return { norm: n, intencion: it.tipo }
}
export async function claveCache(intencion, norm) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(intencion + '|' + norm))
  return Array.from(new Uint8Array(buf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
}

/* Orquestación. deps: { rpc(nombre, args) → { data, error }, llamarModelo(mensajes) → resultado de llamarCloudflare,
   obtenerIndice() → índice de ejercicios (o null), ahora() → ms, log(objeto sin textos) }. Devuelve el cuerpo JSON para el navegador. */
export async function procesarChat(userId, body, deps) {
  const t0 = deps.ahora()
  const log = deps.log || (() => {})
  // 0) Autorización en el servidor ANTES de todo: interruptor, piloto, cuenta. Una cuenta fuera del piloto no recibe
  //    ni siquiera las respuestas fijas.
  const { data: st, error: errSt } = await deps.rpc('riso_chat_status', { p_user: userId })
  if (errSt || !st || st.enabled !== true) { log({ ev: 'riso_chat', fallo: 'no_autorizado' }); return { ok: false, reason: 'not_allowed', final: true } }
  const e = validarEntrada(body)
  if (e.error) return { ok: false, reason: e.error }
  const fijo = filtroServidor(e.pregunta, e.historial.length > 0)
  if (fijo) { log({ ev: 'riso_chat', capa: 1, tipo: fijo.tipo }); return { ok: true, answer: { texto: fijo.texto, ejemplo_en: '', ejemplo_es: '' }, fixed: true } }
  const indice = e.contexto ? await deps.obtenerIndice() : null
  if (e.contexto && !indice) return { ok: false, reason: 'bad_context' }
  const rc = resolverContexto(e.contexto, indice)
  if (!rc.ok) return { ok: false, reason: rc.error }
  if (e.contexto) {
    // Solo ejercicios que ESTA cuenta respondió (con esa misma respuesta) en las últimas 2 horas.
    const { data: valido, error: errV } = await deps.rpc('riso_intento_valido', { p_user: userId, p_item: e.contexto.itemId, p_respuesta: e.contexto.respuestaAlumno })
    if (errV || valido !== true) { log({ ev: 'riso_chat', fallo: 'contexto_sin_intento' }); return { ok: false, reason: 'bad_context' } }
  }
  const cacheable = preguntaCacheable(e.pregunta, e.historial, e.contexto)
  const clave = cacheable ? await claveCache(cacheable.intencion, cacheable.norm) : null
  if (clave) {
    try {
      const { data: hit, error: errC } = await deps.rpc('riso_cache_buscar', { p_clave: clave })
      if (!errC && hit && typeof hit.texto === 'string' && hit.texto.length >= 8) {
        const metricaC = { c: 'cache', i: cacheable.intencion, t: 'cache:' + clave }
        try { await deps.rpc('riso_metrica_ia', { p_intencion: metricaC.i, p_tema: metricaC.t, p_ms: deps.ahora() - t0, p_in: 0, p_out: 0, p_neur: 0, p_ok: true, p_cache: true }) } catch (err) { /* medir nunca rompe */ }
        log({ ev: 'riso_chat', capa: 'cache', ms: deps.ahora() - t0 })
        return { ok: true, answer: { texto: hit.texto, ejemplo_en: hit.ejemplo_en || '', ejemplo_es: hit.ejemplo_es || '', metrica: metricaC }, cache: true }
      }
    } catch (err) { /* sin caché (migración no aplicada o apagada): sigue igual */ }
  }
  const mensajes = construirMensajes(R._int.limpiarPII(e.pregunta), e.historial, rc.ctx)
  const est = estimarNeuronas(mensajes)

  const { data: res, error } = await deps.rpc('riso_chat_reserve', { p_user: userId, p_request: e.requestId, p_est_neurons: est })
  if (error || !res) { log({ ev: 'riso_chat', fallo: 'reserve_error' }); return { ok: false, reason: 'busy' } }
  if (res.status === 'duplicate') return { ok: true, answer: res.answer, duplicate: true }
  if (res.status === 'in_progress') return { ok: false, reason: 'in_progress' }
  if (res.status !== 'ok') { log({ ev: 'riso_chat', limite: res.status }); return { ok: false, reason: MOTIVOS[res.status] || 'busy', final: true } }

  const r = await deps.llamarModelo(mensajes)
  const usage = r && r.usage ? r.usage : { input: 0, output: 0 }
  // Si se cortó por tiempo o por red, Cloudflare pudo haber procesado igual: se registra la estimación completa
  // (conservador) para que una solicitud que el proveedor siga procesando nunca deje gastar de más.
  const cortada = r && !r.ok && (r.reason === 'timeout' || r.reason === 'network')
  const n = cortada ? est : neuronas(usage.input, usage.output)
  const salida = r && r.ok ? validarSalida(r.raw) : null
  await deps.rpc('riso_chat_finish', { p_user: userId, p_request: e.requestId, p_ok: !!salida, p_input: usage.input, p_output: usage.output, p_neurons: n, p_answer: salida })
  log({ ev: 'riso_chat', capa: 5, ok: !!salida, motivo: salida ? null : (r && r.reason) || 'bad_output', in: usage.input, out: usage.output, neuronas: Math.round(n * 100) / 100, est, ms: deps.ahora() - t0, ctx: !!rc.ctx, hist: e.historial.length })
  // Métrica agregada (fase 1): capa IA, intención, tema corto, tiempo, tokens y neuronas reales. Sin texto ni alumno.
  // Si la migración de métricas aún no está aplicada, el error se ignora y la respuesta sigue igual.
  const metrica = { c: 'ia', i: rc.ctx ? 'ejercicio' : R._int.intencion(R._int.norm(e.pregunta), e.historial.length > 0).tipo, t: temaMetrica(rc.ctx) }
  try {
    await deps.rpc('riso_metrica_ia', { p_intencion: metrica.i, p_tema: metrica.t, p_ms: deps.ahora() - t0, p_in: usage.input, p_out: usage.output, p_neur: Math.round(n * 100) / 100, p_ok: !!salida, p_cache: false })
  } catch (err) { /* medir nunca rompe una respuesta */ }
  if (!salida) return { ok: false, reason: (r && r.reason === 'quota') ? 'busy' : 'retry' }
  if (clave) {
    try { await deps.rpc('riso_cache_guardar', { p_clave: clave, p_intencion: cacheable.intencion, p_pregunta: R._int.limpiarPII(cacheable.norm).slice(0, 200), p_texto: salida.texto, p_ejemplo_en: salida.ejemplo_en, p_ejemplo_es: salida.ejemplo_es }) } catch (err) { /* sin caché: no pasa nada */ }
  }
  return { ok: true, answer: Object.assign({}, salida, { metrica }), metrica }
}

// Tema de la métrica: el tema del ejercicio convertido a identificador corto, o 'libre'. Nunca texto del alumno.
export function temaMetrica(ctx) {
  if (!ctx || !ctx.tema) return 'libre'
  const slug = String(ctx.tema).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
  return slug ? 'ejercicio:' + slug : 'ejercicio'
}
