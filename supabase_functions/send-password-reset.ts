// ============================================================
// Inglés con Leo — Edge Function: send-password-reset
//
// Antes, "olvidé mi contraseña" llamaba directo a una función de
// Supabase (auth.resetPasswordForEmail) que hace que el correo lo
// mande el propio servidor de Supabase. Eso tiene dos problemas:
//   1. El correo llega diciendo "supabase" en vez de tu dominio.
//   2. Supabase deja mandar MUY pocos de estos correos por hora
//      en el plan gratis, así que si varias personas lo piden
//      seguido, a algunas simplemente no les llega.
//
// Esta función arregla los dos problemas mandando el correo por
// Resend (lo mismo que ya usas para el correo de bienvenida) en
// vez de dejar que lo mande Supabase:
//   1. Genera el enlace de recuperación usando la clave secreta
//      de administrador de Supabase (esto NO manda ningún correo,
//      solo crea el enlace).
//   2. Manda ese enlace por Resend, con el remitente que pongas
//      en el secreto RESET_EMAIL_FROM.
//
// Variables de entorno que necesita esta función (se configuran
// en Supabase -> Edge Functions -> Secrets):
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key (secreta).
//                              Si ya la usas en mp-webhook, es la
//                              misma, no hay que crear una nueva.
//   RESEND_API_KEY             la misma que ya usas para el
//                              correo de bienvenida.
//   RESET_EMAIL_FROM           el remitente exacto que quieres que
//                              vean, por ejemplo:
//                              "Inglés con Leo <hola@inglesconleo.com>"
//                              (revisa un correo de bienvenida que
//                              hayas recibido para copiar el mismo
//                              remitente que usas ahí).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESET_EMAIL_FROM = Deno.env.get('RESET_EMAIL_FROM') || 'Inglés con Leo <onboarding@resend.dev>'

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
    const { email, redirectTo } = await req.json()

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'missing_email' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: redirectTo ? { redirectTo } : undefined,
    })

    if (error || !data?.properties?.action_link) {
      // No decimos si el correo existe o no (por seguridad de los
      // usuarios), pero sí dejamos el error en los logs de la
      // función por si hay que revisar algo.
      console.error('Error generando el enlace de recuperación:', error)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const actionLink = data.properties.action_link

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESET_EMAIL_FROM,
        to: email,
        subject: 'Restablece tu contraseña - Inglés con Leo',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
            <h2>Restablece tu contraseña</h2>
            <p>Pediste cambiar tu contraseña en Inglés con Leo. Haz clic en el siguiente botón para elegir una nueva:</p>
            <p style="text-align:center;margin:24px 0;">
              <a href="${actionLink}" style="background:#3554F0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Elegir nueva contraseña</a>
            </p>
            <p style="color:#666;font-size:13px;">Si no pediste esto, puedes ignorar este correo. Tu contraseña no cambiará.</p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      console.error('Error enviando el correo con Resend:', errText)
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
