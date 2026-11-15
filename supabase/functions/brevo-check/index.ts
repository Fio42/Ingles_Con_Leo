// ============================================================
// Inglés con Leo — Edge Function: brevo-check (comprobacion del respaldo)
//
// Comprueba que el respaldo de correo (Brevo) sigue vivo, usando la llave
// BREVO_API_KEY. Brevo borra las llaves sin uso en 90 dias; este chequeo
// (cron cada 2 meses, maximo 62 dias entre corridas) la mantiene activa y
// avisa a Leo si algo falla.
//
// Solo la llaman la base de datos (cron / pg_net) con el header
// x-internal-secret = llave 'internal_functions_secret' de Vault, igual que
// error-alert. Sin llave: 401. Se despliega sin verify_jwt.
//
//   { "event": "check" }                 (por defecto, lo que usa el cron)
//       1) GET /v3/account de Brevo (401 = llave invalida o borrada)
//       2) manda un correo de prueba a Leo POR mail-relay (ruta real del respaldo)
//       3) si algo falla, manda alerta a Leo por Resend
//   { "event": "test", "to": "<buzon permitido>" }
//       igual, pero a un buzon de la lista TEST_ALLOWED (nunca a alumnos) y
//       devuelve los eventos de entrega que reporta Brevo.
//
// Nunca envia a alumnos. Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// RESEND_API_KEY, BREVO_API_KEY, LEOBOT_NOTIFY_EMAIL (por defecto
// inglesconleoreal@gmail.com).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const env = (k: string) => Deno.env.get(k) ?? ''
const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
const NOTIFY = env('LEOBOT_NOTIFY_EMAIL') || 'inglesconleoreal@gmail.com'
const FROM = 'Inglés con Leo <hola@inglesconleo.com>'
const TEST_ALLOWED = new Set([NOTIFY.toLowerCase(), 'inglesconleoreal@gmail.com', 'fiocchettaleandro@gmail.com', 'spanishbyleo@gmail.com'])

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// Registro central de errores (error-monitoring.sql): queda guardado en la base aunque el correo de alerta no
// pueda salir (por ejemplo, si Resend esta pausado). Nunca lanza ni espera mas de 2 s.
async function reportServerError(message: string, code: string) {
  let timer: any
  try {
    const base = `email|brevo-check|${code}|${message}`.replace(/\d+/g, '#').slice(0, 200)
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base))
    const fp = Array.from(new Uint8Array(buf)).slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('')
    await Promise.race([
      Promise.resolve(supabase.rpc('log_app_error', {
        p_fp: fp, p_kind: 'email', p_source: 'server', p_severity: 'error', p_section: 'brevo-check', p_message: message,
        p_error_name: null, p_stack_top: null, p_code: code, p_release: null, p_browser: null, p_platform: null, p_sample: null,
      })).then(() => {}, () => {}),
      new Promise((resolve) => { timer = setTimeout(resolve, 2000) }),
    ])
  } catch (_) { /* el registro de errores nunca rompe nada */ } finally { clearTimeout(timer) }
}

async function sendAlert(detail: string) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [NOTIFY], subject: 'ALERTA: el respaldo de correo (Brevo) no pasó la comprobación',
        html: `<p>La comprobación automática del respaldo de Brevo falló.</p><p><b>Detalle:</b> ${detail.replace(/[<>&]/g, '')}</p><p>Los correos a alumnos siguen saliendo por Resend, esto solo afecta al plan B. Revisa la llave BREVO_API_KEY en Supabase (Edge Functions, Secrets) y en Brevo (Configuración, SMTP y API). Guía: supabase/RESPALDO_CORREO.md.</p>`,
      }),
    })
  } catch (e) { console.error('brevo-check alerta', e) }
}

export async function handle(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return json({ ok: false }, 405)
    const secret = req.headers.get('x-internal-secret') || ''
    const { data: allowed } = await supabase.rpc('internal_secret_ok', { p_secret: secret })
    if (allowed !== true) return json({ ok: false, error: 'unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const isTest = body && body.event === 'test'
    let to = NOTIFY
    if (isTest) {
      to = String(body.to || '').trim().toLowerCase()
      if (!TEST_ALLOWED.has(to)) return json({ ok: false, error: 'destinatario_no_permitido' }, 400)
    }

    const out: Record<string, unknown> = { ok: false, to }
    const fail = async (why: string) => {
      out.error = why
      if (!isTest) { await reportServerError('El respaldo de Brevo no paso la comprobacion', 'check_failed'); await sendAlert(why) }
      return json(out, 200)
    }

    const brevoKey = env('BREVO_API_KEY')
    if (!brevoKey) return await fail('Falta el secreto BREVO_API_KEY')

    // 1) Brevo reconoce la llave. La llave es restringida (solo correo transaccional), asi que
    //    /account responde 403 aunque la llave sea buena: solo 401 significa llave invalida/borrada.
    const acc = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': brevoKey, Accept: 'application/json' } })
    out.account_status = acc.status
    if (acc.status === 401) return await fail('Brevo no reconoce la llave (HTTP 401): expiro, se borro o es otra')

    // 2) Correo de prueba por la ruta real del respaldo (mail-relay).
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const res = await fetch(`${env('SUPABASE_URL')}/functions/v1/mail-relay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'x-mail-flow': 'critical' },
      body: JSON.stringify({
        from: FROM, to: [to], reply_to: NOTIFY,
        subject: `Comprobación del respaldo de correo (${stamp} UTC)`,
        html: '<p>Este es un correo de prueba automático del respaldo (Brevo). No requiere ninguna acción.</p>',
        text: 'Correo de prueba automático del respaldo (Brevo). No requiere ninguna acción.',
        tags: [{ name: 'flow', value: 'brevo-check' }],
      }),
    })
    const txt = await res.text()
    let parsed: any = {}
    try { parsed = JSON.parse(txt) } catch { /* texto */ }
    out.relay_status = res.status
    out.provider = parsed.provider ?? null
    if (!res.ok) return await fail(`mail-relay respondio HTTP ${res.status}: ${txt.slice(0, 200)}`)
    if (parsed.provider !== 'brevo') return await fail('mail-relay no uso Brevo (revisa el secreto MAIL_PROVIDER=brevo)')
    out.message_id_present = !!parsed.id

    // 3) Entrega: eventos que reporta Brevo (solo informativo; puede tardar).
    if (isTest && parsed.id) {
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 4000))
        const ev = await fetch(`https://api.brevo.com/v3/smtp/statistics/events?messageId=${encodeURIComponent(String(parsed.id))}&limit=20`, {
          headers: { 'api-key': brevoKey, Accept: 'application/json' },
        })
        if (ev.ok) {
          const j: any = await ev.json().catch(() => ({}))
          out.events = (j.events || []).map((e: any) => e.event)
          if ((out.events as string[]).some((e) => /delivered|opened|clicks|softBounces|hardBounces|blocked|invalid|error/i.test(e))) break
        } else { out.events_status = ev.status }
      }
    }
    out.ok = true
    return json(out)
  } catch (e) {
    console.error('brevo-check', e)
    await reportServerError('brevo-check fallo de forma inesperada', 'unexpected')
    return json({ ok: false, error: 'interno' }, 500)
  }
}

Deno.serve(handle)
