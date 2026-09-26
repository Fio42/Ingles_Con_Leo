// ============================================================
// Inglés con Leo — Edge Function: leobot-notify
//
// La llama el navegador (backend.js, LeoBackend.submitLeobotReport)
// justo después de guardar un reporte nuevo en la tabla
// leobot_reports (bug o mensaje de soporte, mandado desde LeoBot).
// Le manda a Leo un correo avisando el detalle, para que se entere
// al momento sin tener que estar revisando la tabla en Supabase.
//
// Igual que notify-new-comment: el navegador solo manda el
// "report_id", y esta función vuelve a buscar la fila completa en
// la base de datos con la service_role key (que sí puede saltarse
// RLS), en vez de confiar en texto que mande la llamada. Así nadie
// puede mandarte correos falsos llamando a esta función directamente
// con datos inventados.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la misma "service_role" key que ya
//                              usan los webhooks de pago y las demás
//                              funciones de correo.
//   RESEND_API_KEY             la misma que ya usas para los demás
//                              correos (resend.com -> API Keys).
//   LEOBOT_NOTIFY_EMAIL        a qué correo te llega el aviso. Si no
//                              lo configuras, usa
//                              inglesconleoreal@gmail.com por
//                              defecto (el mismo que ya usas como
//                              "responder a" en los demás correos).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
const NOTIFY_EMAIL = Deno.env.get('LEOBOT_NOTIFY_EMAIL') || 'inglesconleoreal@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json().catch(() => null)
    const reportId = body && body.report_id

    if (!reportId) return json({ error: 'missing_report_id' }, 400)

    const { data: report, error } = await supabase
      .from('leobot_reports')
      .select('type, message, page_url, page_name, email, browser, device, context, created_at')
      .eq('id', reportId)
      .maybeSingle()

    if (error) console.error('Error buscando el reporte de LeoBot:', error)
    if (!report) return json({ error: 'not_found' }, 404)

    const isBug = report.type === 'bug'
    const subject = isBug
      ? `LeoBot: nuevo reporte de bug (${report.page_name || report.page_url || 'página desconocida'})`
      : `LeoBot: nuevo mensaje de soporte`

    const contextRows = report.context && typeof report.context === 'object'
      ? Object.entries(report.context)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => `<tr><td style="padding:2px 10px 2px 0;color:#666;">${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`)
          .join('')
      : ''

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
            <h2>${isBug ? '🐞 Nuevo reporte de bug' : '✉️ Nuevo mensaje de soporte'}</h2>
            <p><strong>Página:</strong> ${escapeHtml(report.page_name || '-')} ${report.page_url ? `(<a href="${escapeHtml(report.page_url)}">${escapeHtml(report.page_url)}</a>)` : ''}</p>
            ${report.email ? `<p><strong>Correo de contacto:</strong> ${escapeHtml(report.email)}</p>` : '<p><strong>Correo de contacto:</strong> no dio uno (invitado)</p>'}
            <p style="background:#f4f6fb;border-radius:8px;padding:14px;white-space:pre-wrap;">${escapeHtml(report.message)}</p>
            ${contextRows ? `<p><strong>Contexto técnico:</strong></p><table style="font-size:13px;">${contextRows}</table>` : ''}
            <p style="color:#666;font-size:13px;">Navegador: ${escapeHtml(report.browser || '-')} · Dispositivo: ${escapeHtml(report.device || '-')}</p>
            <p style="color:#666;font-size:13px;">Este reporte NO se puede ver desde el sitio (solo desde acá o desde Supabase -> Table Editor -> leobot_reports).</p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      console.error('Error enviando la notificación de LeoBot:', await emailRes.text())
    }

    return json({ ok: true }, 200)
  } catch (e) {
    console.error(e)
    // Nunca dejamos que un error acá tumbe el reporte (que ya se
    // guardó del lado del navegador): respondemos ok igual.
    return json({ ok: true }, 200)
  }
})

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  } as Record<string, string>)[c])
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
