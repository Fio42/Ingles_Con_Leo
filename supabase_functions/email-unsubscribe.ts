// ============================================================
// Inglés con Leo — Edge Function: email-unsubscribe
//
// Da de baja (o vuelve a dar de alta) a una persona de los correos
// automáticos de práctica y promoción (upgrade-nudge-emails y
// streak-reminder-email). NO afecta correos importantes de la cuenta
// (recuperar contraseña, pagos).
//
// Cómo se llama:
//   1) Desde la página baja.html (el link "Darte de baja" al pie de
//      cada correo), con el header "apikey" y un JSON
//      { u, t, action? } donde action puede ser 'resubscribe'.
//   2) Directo desde Gmail/Outlook con el botón "Cancelar suscripción"
//      que muestran junto al remitente (List-Unsubscribe one-click):
//      POST a esta URL con ?u=...&t=... en la dirección.
//
// u = id del usuario (profiles.id). t = firma HMAC de ese id, hecha
// con la SUPABASE_SERVICE_ROLE_KEY (la misma función de firma está
// copiada en upgrade-nudge-emails.ts y streak-reminder-email.ts). Así
// nadie puede dar de baja a otra persona adivinando links.
//
// IMPORTANTE: en Supabase hay que apagar "Verify JWT" para esta
// función (igual que submit-survey), porque la llaman Gmail y la
// página sin sesión iniciada.
//
// Guarda la baja en profiles.email_opt_out_at (ver supabase_schema.sql).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function unsubToken(userId: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(SUPABASE_SERVICE_ROLE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode('unsub:' + userId)))
  return Array.from(sig).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

  try {
    const url = new URL(req.url)
    let u = url.searchParams.get('u') || ''
    let t = url.searchParams.get('t') || ''
    let action = 'unsubscribe'
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      try {
        const b = await req.json()
        if (b && b.u) u = String(b.u)
        if (b && b.t) t = String(b.t)
        if (b && b.action === 'resubscribe') action = 'resubscribe'
      } catch (_e) { /* cuerpo vacío: se usan los de la URL */ }
    }

    if (!/^[0-9a-f-]{36}$/i.test(u) || !/^[0-9a-f]{32}$/i.test(t)) {
      return json({ ok: false, error: 'invalid_token' }, 400)
    }
    const expected = await unsubToken(u)
    if (!sameString(expected, t.toLowerCase())) {
      return json({ ok: false, error: 'invalid_token' }, 400)
    }

    const value = action === 'resubscribe' ? null : new Date().toISOString()
    const { error } = await supabase.from('profiles').update({ email_opt_out_at: value }).eq('id', u)
    if (error) {
      console.error('Error guardando la baja:', error)
      return json({ ok: false, error: 'server_error' }, 500)
    }
    return json({ ok: true, action }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false, error: 'server_error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
