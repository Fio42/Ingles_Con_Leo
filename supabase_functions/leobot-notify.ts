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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NOTIFY_WINDOW_MS = 15 * 60 * 1000   // solo se avisa de reportes de los ultimos 15 minutos

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
    const imageState = body && typeof body.image === 'string' ? body.image : 'none'   // 'ok' | 'failed' | 'none' (solo para el texto del correo)

    if (!reportId || typeof reportId !== 'string' || !UUID_RE.test(reportId)) return json({ error: 'missing_report_id' }, 400)

    const { data: report, error } = await supabase
      .from('leobot_reports')
      .select('type, message, page_url, page_name, email, browser, device, context, created_at, notified_at')
      .eq('id', reportId)
      .maybeSingle()

    if (error) console.error('Error buscando el reporte de LeoBot:', error)
    if (!report) return json({ error: 'not_found' }, 404)

    // Un reporte avisa UNA sola vez y solo mientras es reciente: llamar de nuevo a esta funcion con el mismo id
    // (o con ids viejos) no manda correos ni firma nada.
    if (report.notified_at) return json({ ok: true, already: true }, 200)
    if (Date.now() - new Date(report.created_at).getTime() > NOTIFY_WINDOW_MS) return json({ ok: true, expired: true }, 200)
    const { data: claimed } = await supabase
      .from('leobot_reports')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', reportId)
      .is('notified_at', null)
      .select('id')
    if (!claimed || !claimed.length) return json({ ok: true, already: true }, 200)

    const isBug = report.type === 'bug'
    const ctx: Record<string, unknown> = (report.context && typeof report.context === 'object') ? report.context as Record<string, unknown> : {}
    const categoria = typeof ctx.categoria === 'string' ? ctx.categoria : ''
    const seccion = typeof ctx.seccion === 'string' ? ctx.seccion : ''
    const detalle = typeof ctx.detalle === 'string' ? ctx.detalle : ''
    const subject = isBug
      ? `LeoBot: reporte${categoria ? ' - ' + categoria : ''} (${seccion || report.page_name || report.page_url || 'página desconocida'})`
      : `LeoBot: nuevo mensaje de soporte`

    // Captura de pantalla opcional (bucket privado). La ruta SIEMPRE se arma con el id de ESTE reporte (nunca con
    // texto que venga del navegador o del context) y solo se firma si el archivo existe. El link dura 14 dias.
    let captureUrl = ''
    if (imageState !== 'none') {
      const { data: files } = await supabase.storage.from('leobot-reports').list(reportId, { limit: 5 })
      if (files && files.some((f: { name: string }) => f.name === 'captura.jpg')) {
        const { data: signed, error: signErr } = await supabase.storage.from('leobot-reports').createSignedUrl(reportId + '/captura.jpg', 60 * 60 * 24 * 14)
        if (signErr) console.error('No se pudo firmar la captura de LeoBot:', signErr)
        if (signed && signed.signedUrl) captureUrl = signed.signedUrl
      }
    }

    const HIDDEN_KEYS = ['categoria', 'seccion', 'detalle', 'sesion']
    const show = (v: unknown) => typeof v === 'object' ? JSON.stringify(v) : String(v)
    const rowsOf = (o: Record<string, unknown>, skip: string[] = []) => Object.entries(o)
      .filter(([k, v]) => !skip.includes(k) && v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `<tr><td style="padding:2px 10px 2px 0;color:#666;vertical-align:top;">${escapeHtml(k)}</td><td>${escapeHtml(show(v))}</td></tr>`)
      .join('')
    const contextRows = rowsOf(ctx, HIDDEN_KEYS)
    const sesionObj = (ctx.sesion && typeof ctx.sesion === 'object') ? ctx.sesion as Record<string, unknown> : null
    const sesionRows = sesionObj ? rowsOf(sesionObj) : ''

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
            ${categoria ? `<p><strong>Tipo de problema:</strong> ${escapeHtml(categoria)}</p>` : ''}
            ${seccion ? `<p><strong>Parte del sitio:</strong> ${escapeHtml(seccion)}</p>` : ''}
            ${detalle ? `<p><strong>Curso, lección o ejercicio:</strong> ${escapeHtml(detalle)}</p>` : ''}
            <p><strong>Página:</strong> ${escapeHtml(report.page_name || '-')} ${report.page_url ? `(<a href="${escapeHtml(report.page_url)}">${escapeHtml(report.page_url)}</a>)` : ''}</p>
            ${report.email ? `<p><strong>Contacto (correo o teléfono):</strong> ${escapeHtml(report.email)}</p>` : '<p><strong>Contacto:</strong> no dio uno (invitado)</p>'}
            <p style="background:#f4f6fb;border-radius:8px;padding:14px;white-space:pre-wrap;">${escapeHtml(report.message)}</p>
            ${captureUrl ? `<p><strong>Captura de pantalla:</strong> <a href="${escapeHtml(captureUrl)}">abrir imagen</a> (el link dura 14 días)</p><p><a href="${escapeHtml(captureUrl)}"><img src="${escapeHtml(captureUrl)}" alt="Captura" style="max-width:100%;border-radius:8px;border:1px solid #ddd;"></a></p>` : (imageState === 'failed' ? '<p style="color:#B3261E;">La persona intentó adjuntar una captura pero no se pudo subir.</p>' : '')}
            ${contextRows ? `<p><strong>Contexto técnico:</strong></p><table style="font-size:13px;">${contextRows}</table>` : ''}
            ${sesionRows ? `<p><strong>Información de su sesión:</strong></p><table style="font-size:13px;">${sesionRows}</table>` : ''}
            <p style="color:#666;font-size:13px;">Navegador: ${escapeHtml(report.browser || '-')} · Dispositivo: ${escapeHtml(report.device || '-')}</p>
            <p style="color:#666;font-size:13px;">Este reporte NO se puede ver desde el sitio (solo desde acá o desde Supabase -> Table Editor -> leobot_reports).</p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      console.error('Error enviando la notificación de LeoBot:', await emailRes.text())
      // el correo no salió: se libera el aviso para poder reintentar (solo dentro de la ventana reciente)
      await supabase.from('leobot_reports').update({ notified_at: null }).eq('id', reportId)
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
