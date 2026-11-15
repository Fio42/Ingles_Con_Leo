// ============================================================
// Inglés con Leo — Edge Function: resend-webhook
//
// Resend llama a esta URL cada vez que pasa algo con un correo que
// enviamos. Esta función:
//   1. Verifica que el aviso venga realmente de Resend (firma Svix,
//      misma idea que stripe-webhook.ts pero con el esquema de
//      Resend/Svix en vez del de Stripe). Sin secreto configurado,
//      sin cabeceras de firma, con firma inválida o con una marca de
//      tiempo de más de 5 minutos (reenvío malicioso) NO procesa nada.
//   2. Marca el profile con email_invalid=true, email_invalid_at=ahora
//      SOLO en estos eventos (bloqueo, no reversible solo):
//        - email.bounced con bounce.type = "Permanent" (rebote duro).
//        - email.complained (alguien marcó el correo como spam).
//        - email.suppressed (Resend bloqueó la dirección por su lista
//          de supresión; seguir intentándolo solo suma rebotes).
//   2b. Un email.bounced que NO es permanente (temporal, indeterminado o
//      sin tipo) PAUSA los correos automáticos de esa dirección durante
//      14 días: profiles.email_paused_until = ahora + 14 días (2026-11-15).
//      Es reversible (email_paused_until = null) y se vence sola. No
//      bloquea nada de la cuenta: ni la academia, ni la recuperación de
//      contraseña, ni el aviso de pago fallido, que siguen igual.
//      email.delivery_delayed y el resto de eventos se ignoran.
//   3. Mientras email_invalid sea true, los correos automáticos
//      (streak-reminder-email.ts, upgrade-nudge-emails.ts,
//      survey-15d-email.ts y el aviso de pago fallido de
//      stripe-webhook.ts) no le envían nada a ese usuario, para no
//      seguir rebotando contra un email que no sirve y dañar la
//      reputación del dominio. La recuperación de contraseña NO mira
//      esta marca (aunque Resend la bloqueará igual si la dirección
//      está suprimida).
//   4. Es idempotente: si Resend repite un evento, no cambia nada
//      (conserva la fecha original de email_invalid_at).
//   5. Códigos de respuesta: 200 = recibido (aunque no hubiera nada
//      que hacer); 400 = firma/cabeceras/cuerpo inválidos; 405 = no
//      es POST; 500 = falta el secreto o falló la base de datos
//      (Resend reintenta solo en estos casos).
//
// Despliegue: SIEMPRE sin verificación JWT, porque quien llama es
// Resend y no un usuario de Supabase (la protección es la firma):
//   npx supabase functions deploy resend-webhook --no-verify-jwt --use-api
//
// Para corregir un email marcado como inválido por error (o cuando
// el usuario avisa que ahora sí funciona): Supabase -> Table Editor
// -> profiles -> busca la fila -> pon email_invalid en false (y de
// paso corrige el email si hacía falta). No hay reseteo automático
// porque no existe una pantalla en el sitio donde el usuario cambie
// su propio email todavía.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   RESEND_WEBHOOK_SECRET       el Signing Secret que da Resend al
//                               crear el webhook (empieza con whsec_).
//   SUPABASE_URL                (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY   la misma que ya usan los demás correos
//                               automáticos.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Eventos que bloquean la dirección (el rebote solo si es permanente).
const BLOCK_EVENTS = new Set(['email.bounced', 'email.complained', 'email.suppressed'])
// Margen para la marca de tiempo de Svix (evita reenviar un aviso viejo).
const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60
const MAX_RECIPIENTS = 5
// Pausa por rebote no permanente: cuantos dias se suspenden los correos automaticos.
const PAUSE_DAYS = 14

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return json({ ok: false, error: 'metodo no permitido' }, 405)
    }
    // Sin secreto no hay forma de comprobar la firma: no se procesa nada y se
    // responde 500 para que se note (y Resend reintente cuando se configure).
    if (!RESEND_WEBHOOK_SECRET) {
      console.error('resend-webhook: falta RESEND_WEBHOOK_SECRET')
      return json({ ok: false, error: 'webhook no configurado' }, 500)
    }

    const rawBody = await req.text()

    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')
    if (!svixId || !svixTimestamp || !svixSignature) {
      return json({ ok: false, error: 'faltan headers de firma' }, 400)
    }

    const ts = Number(svixTimestamp)
    const nowSec = Math.floor(Date.now() / 1000)
    if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > TIMESTAMP_TOLERANCE_SECONDS) {
      return json({ ok: false, error: 'marca de tiempo fuera de rango' }, 400)
    }

    const valid = await verifySvixSignature(svixId, svixTimestamp, rawBody, svixSignature)
    if (!valid) {
      return json({ ok: false, error: 'firma invalida' }, 400)
    }

    let event: any
    try {
      event = JSON.parse(rawBody)
    } catch {
      return json({ ok: false, error: 'cuerpo invalido' }, 400)
    }
    const type = event?.type as string | undefined
    // Clics en los correos de reactivación de miembros (solo seguimiento de
    // resultados; no cambia nada del alumno). Hay que activar el evento
    // "email.clicked" en el webhook de Resend para que llegue.
    if (type === 'email.clicked') {
      await recordReactivationClick(event)
      return json({ ok: true, click: true }, 200)
    }
    if (!type || !BLOCK_EVENTS.has(type)) {
      // Incluye email.delivery_delayed (retraso temporal): no se bloquea a nadie.
      return json({ ok: true, skipped: true }, 200)
    }
    // Un rebote solo bloquea si es permanente. Temporal, indeterminado o sin
    // tipo: no se toca la cuenta (el alumno puede tener el buzón lleno hoy).
    const recipients = extractRecipients(event?.data?.to)
    if (!recipients.length) {
      return json({ ok: true, skipped: true }, 200)
    }
    if (type === 'email.bounced') {
      const bounceType = String(event?.data?.bounce?.type ?? '').toLowerCase()
      if (bounceType !== 'permanent') {
        // Temporal / indeterminado / sin tipo: se pausan los correos automaticos
        // 14 dias (reversible). Idempotente: si ya esta en pausa o bloqueada, no cambia nada.
        const nowIso = new Date().toISOString()
        const untilIso = new Date(Date.now() + PAUSE_DAYS * 86400000).toISOString()
        let paused = 0
        for (const email of recipients) {
          const { data, error } = await supabase
            .from('profiles')
            .update({ email_paused_until: untilIso })
            .ilike('email', escapeLike(email))
            .eq('email_invalid', false)
            .or(`email_paused_until.is.null,email_paused_until.lt.${nowIso}`)
            .select('id')
          if (error) {
            console.error('resend-webhook: error pausando correos', error)
            return json({ ok: false, error: 'base de datos' }, 500) // Resend reintenta
          }
          paused += (data || []).length
        }
        return json({ ok: true, paused, type, reason: 'rebote_no_permanente' }, 200)
      }
    }

    let marked = 0
    for (const email of recipients) {
      // ilike sin comodines: se escapan % _ \ para que "a_b@x.com" no coincida con "aXb@x.com".
      const { data, error } = await supabase
        .from('profiles')
        .update({ email_invalid: true, email_invalid_at: new Date().toISOString() })
        .ilike('email', escapeLike(email))
        .eq('email_invalid', false) // idempotente: un evento repetido no cambia nada
        .select('id')
      if (error) {
        console.error('resend-webhook: error marcando email_invalid', error)
        return json({ ok: false, error: 'base de datos' }, 500) // Resend reintenta
      }
      marked += (data || []).length
    }

    return json({ ok: true, marked, type }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false }, 500)
  }
})

// "to" puede venir como lista o como texto; acepta "Nombre <a@b.com>".
function extractRecipients(to: unknown): string[] {
  const raw = Array.isArray(to) ? to : typeof to === 'string' ? [to] : []
  const out: string[] = []
  for (const item of raw.slice(0, MAX_RECIPIENTS)) {
    if (typeof item !== 'string') continue
    const m = item.match(/<([^<>]+)>/)
    const addr = (m ? m[1] : item).trim().toLowerCase()
    if (addr.includes('@') && addr.length <= 254 && !out.includes(addr)) out.push(addr)
  }
  return out
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => '\\' + c)
}

async function recordReactivationClick(event: any): Promise<void> {
  try {
    const tags = event?.data?.tags
    const tagVal = (name: string) =>
      Array.isArray(tags) ? tags.find((t: any) => t && t.name === name)?.value : tags && tags[name]
    if (tagVal('flow') !== 'member_reactivation') return
    const step = parseInt(String(tagVal('step') || ''), 10) || null
    const email = event?.data?.to?.[0] as string | undefined
    if (!email) return
    const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
    if (!prof) return
    const emailId = String(event?.data?.email_id || '')
    const { error } = await supabase.from('member_reactivation_log').upsert(
      {
        user_id: prof.id,
        event: 'clicked',
        step,
        detail: { email_id: emailId, link: event?.data?.click?.link || null },
        dedupe_key: `clicked:${step}:${emailId || new Date().toISOString().slice(0, 10)}`,
      },
      { onConflict: 'user_id,dedupe_key', ignoreDuplicates: true }
    )
    if (error) console.error('Error guardando el clic de reactivación:', error)
  } catch (e) {
    console.error('Error guardando el clic de reactivación:', e)
  }
}

// Verificación de firma Svix (el sistema de webhooks que usa Resend).
// El "mensaje firmado" es "{svix-id}.{svix-timestamp}.{cuerpo crudo}",
// firmado con HMAC-SHA256 usando la parte del secreto después de
// "whsec_" (que en realidad está en base64). El header svix-signature
// puede traer varias firmas separadas por espacio (formato "v1,firma"),
// alcanza con que una coincida.
async function verifySvixSignature(
  svixId: string,
  svixTimestamp: string,
  rawBody: string,
  svixSignatureHeader: string
): Promise<boolean> {
  const secretB64 = RESEND_WEBHOOK_SECRET.startsWith('whsec_')
    ? RESEND_WEBHOOK_SECRET.slice('whsec_'.length)
    : RESEND_WEBHOOK_SECRET
  const secretBytes = base64ToBytes(secretB64)

  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
  const sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent)))
  const expected = bytesToBase64(sigBytes)

  const candidates = svixSignatureHeader.split(' ').map((part) => part.split(',')[1]).filter(Boolean)
  return candidates.some((sig) => timingSafeEqual(sig, expected))
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}