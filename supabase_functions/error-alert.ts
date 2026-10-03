// ============================================================
// Inglés con Leo — Edge Function: error-alert
//
// Manda a Leo los correos del registro central de errores. Solo la
// llaman la base de datos (pg_net desde log_app_error, y el Cron diario)
// con el header x-internal-secret = llave 'internal_functions_secret' de
// Vault, igual que upgrade-nudge-emails. Sin llave: 401. Se despliega sin
// verify_jwt.
//
//   { "event": "alert",  "error_id": 123, "reason": "new|regression|critical_repeat|escalation" }
//   { "event": "digest" }   resumen de 24 h (9:00 America/Cancun); solo manda correo si hubo algo.
//
// Nunca registra sus propios fallos en app_errors (evita bucles): solo
// console.error. Los correos reutilizan el patrón de leobot-notify.
//
// Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY y
// LEOBOT_NOTIFY_EMAIL (por defecto inglesconleoreal@gmail.com).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const env = (k: string) => Deno.env.get(k) || ''
const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
const NOTIFY_EMAIL = env('LEOBOT_NOTIFY_EMAIL') || 'inglesconleoreal@gmail.com'
const TABLE_URL = 'https://supabase.com/dashboard/project/iviksyhzhiygkuaojply/editor'
const TZ = 'America/Cancun'

const REASONS: Record<string, string> = {
  new: 'nuevo', regression: 'regresión (estaba resuelto)', critical_repeat: 'crítico, sigue pasando', escalation: 'repetido muchas veces',
}

export const escapeHtml = (s: unknown): string =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c])

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('es-MX', { timeZone: TZ, hour12: false }) : '-')
const oneLine = (s: unknown, n: number) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').slice(0, n)

async function sendMail(subject: string, html: string): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [NOTIFY_EMAIL], subject, html }),
    })
    if (!res.ok) console.error('error-alert: Resend respondió', res.status, await res.text())
    return res.ok
  } catch (e) {
    console.error('error-alert: no se pudo enviar el correo:', e)
    return false
  } finally {
    clearTimeout(timer)
  }
}

const wrap = (inner: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">${inner}<p style="color:#888;font-size:12px;">Tabla: <a href="${TABLE_URL}">Supabase → Table Editor → app_errors</a>. Para silenciar un error: <code>update app_errors set status='ignored' where id=N;</code></p></div>`

export function alertEmail(row: any, reason: string): { subject: string; html: string } {
  const sev = String(row.severity || 'error').toUpperCase()
  const label = REASONS[reason] || reason
  const subject = oneLine(`[Leo ${sev}][${row.section || row.kind}] ${row.error_name ? row.error_name + ': ' : ''}${row.message || row.code || row.kind} (${label})`, 150)
  const top = (obj: any) => Object.entries(obj || {}).sort((a: any, b: any) => b[1] - a[1]).map(([k, v]) => `${escapeHtml(k)} (${escapeHtml(v)})`).join(', ') || '-'
  const rows: [string, string][] = [
    ['Tipo', `${escapeHtml(row.kind)} · ${escapeHtml(row.source)}`],
    ['Sección / función', escapeHtml(row.section || '-')],
    ['Código', escapeHtml(row.code || '-')],
    ['Veces (total)', escapeHtml(row.count)],
    ['Primera vez', escapeHtml(fmt(row.first_seen))],
    ['Última vez', escapeHtml(fmt(row.last_seen))],
    ['Versión del sitio', escapeHtml(row.last_release || '-') + (row.first_release && row.first_release !== row.last_release ? ` (empezó en ${escapeHtml(row.first_release)})` : '')],
    ['Navegadores', top(row.browsers)],
    ['Plataformas', top(row.platforms)],
    ['Contexto', escapeHtml(row.sample ? JSON.stringify(row.sample) : '-')],
  ]
  const html = wrap(`
    <h2 style="margin:0 0 6px;">${row.severity === 'critical' ? '🚨' : '⚠️'} ${escapeHtml(sev)}: ${escapeHtml(label)}</h2>
    <p style="background:#f4f6fb;border-radius:8px;padding:12px;white-space:pre-wrap;margin:8px 0;">${escapeHtml(row.error_name ? row.error_name + ': ' : '')}${escapeHtml(row.message || '(sin mensaje)')}</p>
    ${row.stack_top ? `<pre style="background:#f4f6fb;border-radius:8px;padding:10px;font-size:12px;white-space:pre-wrap;">${escapeHtml(row.stack_top)}</pre>` : ''}
    <table style="font-size:13px;border-collapse:collapse;">${rows.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#666;vertical-align:top;">${k}</td><td>${v}</td></tr>`).join('')}</table>
    <p style="color:#666;font-size:12px;">ID del error: ${escapeHtml(row.id)}</p>`)
  return { subject, html }
}

export function digestEmail(d: any): { subject: string; html: string } | null {
  const events = Number(d.events_24h) || 0
  const suppressed = Number(d.suppressed_alerts) || 0
  if (!events && !suppressed) return null
  const subject = `[Leo RESUMEN] ${events} errores en 24 h, ${Number(d.new_24h) || 0} nuevos` + (suppressed ? ` (+${suppressed} avisos suprimidos)` : '')
  const top: any[] = Array.isArray(d.top) ? d.top : []
  const html = wrap(`
    <h2 style="margin:0 0 6px;">Resumen diario de errores</h2>
    <p>Últimas 24 h: <strong>${events}</strong> eventos, <strong>${Number(d.distinct_24h) || 0}</strong> errores distintos, <strong>${Number(d.new_24h) || 0}</strong> nuevos. Abiertos en total: ${Number(d.open_total) || 0}.${suppressed ? ` Se suprimieron ${suppressed} avisos por el tope de correos.` : ''}</p>
    <table style="font-size:13px;border-collapse:collapse;width:100%;">
      <tr style="text-align:left;color:#666;"><th>ID</th><th>Sev.</th><th>Dónde</th><th>Mensaje</th><th>24 h</th><th>Total</th><th>Estado</th></tr>
      ${top.map((t) => `<tr style="border-top:1px solid #eee;"><td>${escapeHtml(t.id)}</td><td>${escapeHtml(t.severity)}</td><td>${escapeHtml(t.section || t.kind)}</td><td>${escapeHtml(oneLine(t.message, 100))}</td><td>${escapeHtml(t.n24)}</td><td>${escapeHtml(t.count)}</td><td>${escapeHtml(t.status)}</td></tr>`).join('')}
    </table>`)
  return { subject, html }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export async function handle(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return json({ ok: false }, 405)
    const secret = req.headers.get('x-internal-secret') || ''
    const { data: allowed } = await supabase.rpc('internal_secret_ok', { p_secret: secret })
    if (allowed !== true) return json({ ok: false, error: 'unauthorized' }, 401)

    const body = await req.json().catch(() => null)
    if (body && body.event === 'alert') {
      const id = Number(body.error_id)
      if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: 'bad_error_id' }, 400)
      const { data: row, error } = await supabase.from('app_errors').select('*').eq('id', id).maybeSingle()
      if (error || !row) return json({ ok: false, error: 'not_found' }, 404)
      const mail = alertEmail(row, String(body.reason || 'new'))
      return json({ ok: await sendMail(mail.subject, mail.html) })
    }
    if (body && body.event === 'digest') {
      const { data, error } = await supabase.rpc('app_error_digest')
      if (error || !data) return json({ ok: false, error: 'digest_failed' }, 500)
      const mail = digestEmail(data)
      if (!mail) return json({ ok: true, sent: false })
      return json({ ok: await sendMail(mail.subject, mail.html), sent: true })
    }
    return json({ ok: false, error: 'bad_event' }, 400)
  } catch (e) {
    console.error('error-alert:', e) // nunca se registra a sí misma
    return json({ ok: false }, 500)
  }
}

Deno.serve(handle)
