// ============================================================
// Inglés con Leo — Edge Function: notify-new-comment
//
// La llama el navegador (backend.js, postArticleComment) justo
// después de guardar un comentario nuevo en la tabla
// article_comments. Le manda a Leo un correo avisando qué artículo
// recibió el comentario y quién lo escribió (miembro o invitado),
// para que se entere al momento y pueda borrarlo desde Supabase si
// hace falta (los comentarios se publican de inmediato, sin
// revisión previa).
//
// Solo recibe el "comment_id" del navegador y vuelve a buscar la
// fila completa en la base de datos con la service_role key, en vez
// de confiar en el texto que mande la llamada: así nadie puede
// mandarte correos falsos llamando a esta función directamente con
// datos inventados.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la misma "service_role" key que usan
//                              los webhooks de pago y las demás
//                              funciones de correo.
//   RESEND_API_KEY             la misma que ya usas para los demás
//                              correos (resend.com -> API Keys).
//   COMMENT_NOTIFY_EMAIL       a qué correo te llega el aviso.
//                              Si no lo configuras, usa
//                              inglesconleoreal@gmail.com por
//                              defecto (el mismo que ya usas como
//                              "responder a" en los demás correos).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
const NOTIFY_EMAIL = Deno.env.get('COMMENT_NOTIFY_EMAIL') || 'inglesconleoreal@gmail.com'

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
    const commentId = body && body.comment_id

    if (!commentId) return json({ error: 'missing_comment_id' }, 400)

    const { data: comment, error } = await supabase
      .from('article_comments')
      .select('article_slug, article_title, display_name, is_member, comment_text, created_at')
      .eq('id', commentId)
      .maybeSingle()

    if (error) console.error('Error buscando el comentario:', error)
    if (!comment) return json({ error: 'not_found' }, 404)

    const articleLabel = comment.article_title || comment.article_slug
    const articleUrl = `https://inglesconleo.com/${comment.article_slug}.html`
    const who = comment.is_member
      ? `${comment.display_name} (miembro)`
      : `${comment.display_name} (invitado, sin cuenta)`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject: `Nuevo comentario en: ${articleLabel}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
            <h2>Nuevo comentario en tu web</h2>
            <p><strong>Artículo:</strong> <a href="${articleUrl}">${articleLabel}</a></p>
            <p><strong>De:</strong> ${escapeHtml(who)}</p>
            <p style="background:#f4f6fb;border-radius:8px;padding:14px;white-space:pre-wrap;">${escapeHtml(comment.comment_text)}</p>
            <p style="color:#666;font-size:13px;">Se publicó de inmediato en la página. Si hace falta borrarlo, entra a Supabase -> Table Editor -> article_comments.</p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      console.error('Error enviando la notificación de comentario:', await emailRes.text())
    }

    return json({ ok: true }, 200)
  } catch (e) {
    console.error(e)
    // Nunca dejamos que un error acá tumbe la publicación del
    // comentario (que ya pasó del lado del navegador): respondemos
    // ok igual.
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
