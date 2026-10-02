// ============================================================
// Inglés con Leo — Edge Function: resend-webhook
//
// Resend llama a esta URL cada vez que pasa algo con un correo que
// enviamos (rebote, marcado como spam, etc). Esta función:
//   1. Verifica que el aviso venga realmente de Resend (firma Svix,
//      misma idea que stripe-webhook.ts pero con el esquema de
//      Resend/Svix en vez del de Stripe).
//   2. Si el evento es "email.bounced" (rebote) o "email.complained"
//      (alguien lo marcó como spam), busca el profile con ese email
//      y le pone email_invalid=true, email_invalid_at=ahora.
//   3. Mientras email_invalid sea true, los correos automáticos
//      (streak-reminder-email.ts, upgrade-nudge-emails.ts,
//      survey-15d-email.ts) no le envían nada a ese usuario, para no
//      seguir rebotando contra un email que no sirve y dañar la
//      reputación del dominio.
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

const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const BOUNCE_EVENTS = new Set(['email.bounced', 'email.complained'])

Deno.serve(async (req: Request) => {
  try {
    const rawBody = await req.text()

    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')
    if (!svixId || !svixTimestamp || !svixSignature) {
      return json({ ok: false, error: 'faltan headers de firma' }, 400)
    }

    const valid = await verifySvixSignature(svixId, svixTimestamp, rawBody, svixSignature)
    if (!valid) {
      return json({ ok: false, error: 'firma invalida' }, 400)
    }

    const event = JSON.parse(rawBody)
    const type = event?.type as string | undefined
    if (!type || !BOUNCE_EVENTS.has(type)) {
      return json({ ok: true, skipped: true }, 200)
    }

    const email = event?.data?.to?.[0] as string | undefined
    if (!email) {
      return json({ ok: true, skipped: true }, 200)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ email_invalid: true, email_invalid_at: new Date().toISOString() })
      .eq('email', email)
    if (error) {
      console.error(`Error marcando email_invalid para ${email}:`, error)
      return json({ ok: false }, 200)
    }

    return json({ ok: true, marked: email, type }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false }, 200)
  }
})

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