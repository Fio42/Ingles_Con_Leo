// ============================================================
// Inglés con Leo — Edge Function: writing-feedback
//
// ESTADO (2026-10-01): PREPARADA, NO DESPLEGADA Y APAGADA.
//   - No está desplegada en Supabase.
//   - Aunque se despliegue, no llama a Gemini mientras el secreto
//     WRITING_AI_ENABLED no sea exactamente "true" Y exista
//     GEMINI_API_KEY (doble interruptor).
//   - En la página, app.js tiene WRITING_AI_ENABLED = false: ni
//     siquiera se llama a esta función.
//
// PASOS PARA ACTIVARLA (cuando Leo lo decida):
//   1. Crear la clave gratis en Google AI Studio en un proyecto de
//      Google Cloud SIN facturación (billing). Nunca activar billing.
//   2. Correr supabase_functions/writing-feedback.sql en Supabase
//      (crea la tabla ai_usage para el tope diario).
//   3. Secrets en Supabase: GEMINI_API_KEY y WRITING_AI_ENABLED=true.
//   4. Desplegar esta función con verify_jwt activado.
//   5. app.js: WRITING_AI_ENABLED = true y probar con writing.html?ia=1.
//   6. Cuando Leo apruebe la calidad: app.js WRITING_AI_PUBLIC = true.
//   Para apagar de inmediato sin tocar código: WRITING_AI_ENABLED=false
//   en los secrets de Supabase (el sitio sigue igual que siempre).
//
// Términos de Google para el plan gratis: lo enviado puede usarse para
// mejorar sus productos y revisarse por personas, y la API no puede
// dirigirse a usuarios menores de 18 años. Revisar antes de activar.
//
// Corrección detallada de Writing con Gemini (plan GRATIS de Google).
// La llama writing.html (app.js -> LeoBackend.getWritingFeedback)
// DESPUÉS de la corrección normal del sitio, solo como un extra:
// nunca cambia si el ejercicio cuenta como bien o mal, ni el progreso.
// Si esta función falla, tarda o se acaba el cupo gratis, el sitio
// simplemente no muestra el extra (el alumno no ve ningún error).
//
// Qué se le manda a Gemini: SOLO la consigna del ejercicio, la
// estructura que se pedía y la frase del alumno. Nunca nombre,
// correo, id de usuario ni nada personal (el id solo se usa aquí, en
// nuestra propia base, para el tope diario). Ojo: si el alumno escribe
// algo personal DENTRO de su frase, eso sí viaja como parte de la frase.
//
// Protecciones:
//   - Solo miembros activos (profiles.is_member) con sesión válida.
//   - Tope diario por persona (AI_DAILY_LIMIT, por defecto 20) con la
//     tabla ai_usage (ver writing-feedback.sql; el día se cuenta en
//     hora UTC). Si la tabla no existe o falla, NO se llama a Gemini
//     (mejor no mostrar el extra que gastar de más).
//   - Tiempo máximo de 8 segundos esperando a Gemini.
//   - La respuesta de Gemini se valida (formato y largo) antes de
//     devolverla; si no cumple, se descarta.
//
// Costos: usa el plan gratis. La clave GEMINI_API_KEY debe crearse en
// Google AI Studio en un proyecto SIN facturación (billing) activada:
// así Google nunca puede cobrar; al pasar el límite gratis solo
// responde "429" y esta función devuelve { ok:false }.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   WRITING_AI_ENABLED         "true" para encender. Cualquier otro
//                              valor (o no tenerlo) = apagado.
//   GEMINI_API_KEY             la clave gratis de Google AI Studio.
//   Si falta cualquiera de las dos, la función responde
//   { ok:false, reason:'disabled' } sin llamar a Gemini.
//   GEMINI_MODEL               opcional, por defecto gemini-3.5-flash-lite
//   AI_DAILY_LIMIT             opcional, por defecto 20 por persona/día
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  (ya vienen puestas)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WRITING_AI_ENABLED = Deno.env.get('WRITING_AI_ENABLED') === 'true'
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite'
const AI_DAILY_LIMIT = Math.max(1, Math.min(100, parseInt(Deno.env.get('AI_DAILY_LIMIT') || '20', 10) || 20))
const GEMINI_TIMEOUT_MS = 8000

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const VERDICTS = ['correct', 'minor', 'incorrect']

const SYSTEM_PROMPT = `Eres un profesor de inglés paciente que corrige frases de alumnos hispanohablantes.
Reglas:
- Corrige SOLO errores reales de gramática, vocabulario u ortografía. No cambies el estilo si la frase ya es correcta y natural.
- Si la frase es correcta, dilo claramente y no inventes errores.
- Revisa también si el alumno usó la estructura que pedía el ejercicio.
- Explica en español sencillo, en 1 a 3 frases cortas, sin tecnicismos. Trata al alumno de "tú".
- "corrected" debe ser la frase del alumno corregida con los mínimos cambios posibles (igual a la original si era correcta).
- "tips": como máximo 2 consejos cortos en español, o una lista vacía.
- Nunca incluyas enlaces, código ni datos personales.`

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ ok: false, reason: 'method' }, 405)
  if (!WRITING_AI_ENABLED || !GEMINI_API_KEY) return json({ ok: false, reason: 'disabled' })

  try {
    // 1) Quién llama: sesión válida y miembro activo.
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (!token) return json({ ok: false, reason: 'no_session' }, 401)
    const { data: userData, error: userErr } = await supabase.auth.getUser(token)
    const user = userData && userData.user
    if (userErr || !user) return json({ ok: false, reason: 'no_session' }, 401)
    const { data: profile } = await supabase.from('profiles').select('is_member').eq('id', user.id).maybeSingle()
    if (!profile || !profile.is_member) return json({ ok: false, reason: 'not_member' }, 403)

    // 2) Datos del ejercicio, con topes de largo.
    const body = await req.json().catch(() => null)
    const prompt = cleanText(body && body.prompt, 300)
    const target = cleanText(body && body.target, 160)
    const answer = cleanText(body && body.answer, 400)
    if (!prompt || !answer || answer.split(' ').length < 2) return json({ ok: false, reason: 'bad_input' }, 400)

    // 3) Tope diario por persona (cuenta el intento antes de llamar).
    const today = new Date().toISOString().slice(0, 10)
    const { data: allowed, error: usageErr } = await supabase.rpc('bump_ai_usage', {
      p_user: user.id, p_day: today, p_limit: AI_DAILY_LIMIT,
    })
    if (usageErr) { console.error('ai_usage error:', usageErr); return json({ ok: false, reason: 'usage_error' }) }
    if (!allowed) return json({ ok: false, reason: 'daily_limit' })

    // 4) Gemini, con tiempo máximo y respuesta en JSON con forma fija.
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), GEMINI_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            role: 'user',
            parts: [{ text: `Consigna del ejercicio: ${prompt}\nEstructura que se pedía: ${target || '(libre)'}\nFrase del alumno: ${answer}` }],
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024, // margen para que el JSON no llegue cortado
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                verdict: { type: 'STRING', enum: VERDICTS },
                corrected: { type: 'STRING' },
                explanation: { type: 'STRING' },
                tips: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: ['verdict', 'corrected', 'explanation'],
            },
          },
        }),
      })
    } finally {
      clearTimeout(timer)
    }
    if (!res.ok) {
      console.error('Gemini respondió', res.status)
      return json({ ok: false, reason: res.status === 429 ? 'quota' : 'gemini_error' })
    }
    const data = await res.json().catch(() => null)
    // Se juntan solo las partes de texto de la respuesta (no las de
    // "razonamiento" que algunos modelos agregan).
    const parts = data?.candidates?.[0]?.content?.parts
    const raw = Array.isArray(parts)
      ? parts.filter((p: any) => p && typeof p.text === 'string' && !p.thought).map((p: any) => p.text).join('')
      : ''
    let parsed: any = null
    try { parsed = JSON.parse(raw) } catch (_) { parsed = null }

    // 5) Validar antes de devolver: si algo no cuadra, se descarta.
    const verdict = parsed && VERDICTS.includes(parsed.verdict) ? parsed.verdict : null
    const corrected = cleanText(parsed && parsed.corrected, 400)
    const explanation = cleanText(parsed && parsed.explanation, 500)
    const tips = Array.isArray(parsed && parsed.tips)
      ? parsed.tips.map((t: unknown) => cleanText(t, 160)).filter(Boolean).slice(0, 2)
      : []
    if (!verdict || !corrected || !explanation) return json({ ok: false, reason: 'bad_output' })

    return json({ ok: true, feedback: { verdict, corrected, explanation, tips } })
  } catch (e) {
    console.error('writing-feedback error:', e)
    return json({ ok: false, reason: 'error' })
  }
})
