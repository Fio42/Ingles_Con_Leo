// ============================================================
// Inglés con Leo — Edge Function: mail-relay (RESPALDO de correo)
//
// Recibe un correo con el MISMO formato que la API de Resend
// (POST /emails: from, to, subject, html, text, reply_to, headers, tags)
// y lo entrega por el proveedor activo:
//   MAIL_PROVIDER = resend (por defecto)  -> reenvia a api.resend.com
//   MAIL_PROVIDER = brevo                 -> envia por la API de Brevo
// Asi, si Resend pausa los envios, el cambio es UN solo secreto
// (ver docs en DEVLOG 2026-11-15), sin tocar codigo.
//
// Hoy NO esta en uso: los correos siguen saliendo directo por Resend.
// Solo se usa cuando se configura MAIL_API_URL (apuntando a esta
// funcion) en las funciones criticas.
//
// Autenticacion: Authorization: Bearer <RESEND_API_KEY> (la misma llave
// que ya usan las demas funciones; no hay secretos nuevos para llamarla).
//
// Bloqueos por direccion (tabla email_suppressions), segun la cabecera
// x-mail-flow que manda quien llama:
//   critical       -> NO se bloquea nunca (confirmacion, recuperacion de
//                     contraseña, correos de acceso/pago/entrega).
//   transactional  -> se bloquea solo si la direccion tiene un rebote
//                     PERMANENTE, queja o supresion (aviso de cobro fallido).
//   cualquier otro (o sin cabecera) -> marketing: se bloquea con cualquier
//                     registro, incluida la pausa por rebote temporal.
// Si TODOS los destinatarios estan bloqueados no se envia nada y se
// responde 200 { skipped: true }.
//
// Secretos: RESEND_API_KEY, MAIL_PROVIDER, BREVO_API_KEY (solo si brevo),
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (ya existen).
// Despliegue: npx supabase functions deploy mail-relay --no-verify-jwt --use-api
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? ''
const MAIL_PROVIDER = (Deno.env.get('MAIL_PROVIDER') ?? 'resend').toLowerCase()
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const HARD_REASONS = new Set(['permanent_bounce', 'complaint', 'suppressed'])

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return json({ error: 'metodo no permitido' }, 405)
    if (!RESEND_API_KEY || !timingSafeEqual(req.headers.get('authorization') ?? '', `Bearer ${RESEND_API_KEY}`)) {
      return json({ error: 'no autorizado' }, 401)
    }
    let mail: any
    try { mail = await req.json() } catch { return json({ error: 'cuerpo invalido' }, 400) }
    const recipients = toList(mail?.to)
    if (!recipients.length || !mail?.from || !mail?.subject || !(mail?.html || mail?.text)) {
      return json({ error: 'faltan campos (from, to, subject, html/text)' }, 422)
    }

    // 1) Bloqueos por direccion segun el tipo de flujo.
    const flow = (req.headers.get('x-mail-flow') ?? '').toLowerCase()
    let allowed = recipients
    if (flow !== 'critical') {
      const { data, error } = await supabase.from('email_suppressions').select('email, reason').in('email', recipients.map((r) => r.email))
      if (error) return json({ error: 'base de datos' }, 500) // quien llama reintenta; no se manda a ciegas
      const blocked = new Set(
        (data || []).filter((r: any) => (flow === 'transactional' ? HARD_REASONS.has(r.reason) : true)).map((r: any) => r.email)
      )
      allowed = recipients.filter((r) => !blocked.has(r.email))
      if (!allowed.length) return json({ ok: true, skipped: true, reason: 'direccion_bloqueada' }, 200)
    }

    // 2) Entrega por el proveedor activo.
    const out = { ...mail, to: allowed.map((r) => r.raw) }
    if (MAIL_PROVIDER === 'brevo') return await sendBrevo(out, allowed)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(out),
    })
    return new Response(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('mail-relay', e)
    return json({ error: 'interno' }, 500)
  }
})

async function sendBrevo(mail: any, to: Array<{ email: string; raw: string }>): Promise<Response> {
  if (!BREVO_API_KEY) return json({ error: 'falta BREVO_API_KEY' }, 500)
  const from = parseAddress(String(mail.from))
  const body: Record<string, unknown> = {
    sender: from.name ? { email: from.email, name: from.name } : { email: from.email },
    to: to.map((r) => { const a = parseAddress(r.raw); return a.name ? { email: a.email, name: a.name } : { email: a.email } }),
    subject: mail.subject,
  }
  if (mail.html) body.htmlContent = mail.html
  if (mail.text) body.textContent = mail.text
  const rt = mail.reply_to ?? mail.replyTo
  if (rt) body.replyTo = parseAddress(String(Array.isArray(rt) ? rt[0] : rt))
  if (mail.headers && typeof mail.headers === 'object') body.headers = mail.headers
  if (Array.isArray(mail.tags)) body.tags = mail.tags.map((t: any) => (t && t.name ? `${t.name}:${t.value ?? ''}` : String(t))).slice(0, 10)
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (res.ok) {
    let id = ''
    try { id = JSON.parse(text).messageId ?? '' } catch { /* sin id */ }
    return json({ id, provider: 'brevo' }, 200) // mismo formato que Resend: { id }
  }
  console.error('mail-relay brevo', res.status, text.slice(0, 300))
  return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } })
}

function toList(to: unknown): Array<{ email: string; raw: string }> {
  const raw = Array.isArray(to) ? to : typeof to === 'string' ? [to] : []
  const out: Array<{ email: string; raw: string }> = []
  for (const item of raw.slice(0, 10)) {
    if (typeof item !== 'string') continue
    const email = parseAddress(item).email.toLowerCase()
    if (email.includes('@') && !out.some((o) => o.email === email)) out.push({ email, raw: item })
  }
  return out
}

function parseAddress(s: string): { name: string; email: string } {
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^<>]+)>\s*$/)
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: '', email: s.trim() }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
