// ============================================================
// Inglés con Leo — Edge Function: mp-webhook
//
// Mercado Pago llama a esta URL cada vez que pasa algo con una
// suscripción (se activa, se paga, se cancela, se pausa). Esta
// función:
//   1. Recibe el aviso (solo trae un id, no hay que confiar en
//      los datos que manda directamente).
//   2. Le pregunta a la API de Mercado Pago los datos reales de
//      esa suscripción (usando el Access Token, que es secreto).
//   3. Si está "authorized" (pagando), activa is_member=true en
//      la fila de profiles que tenga ese id de usuario.
//   4. Si se cancela o se pausa, la desactiva.
//   5. Si es la primera vez que se activa (no ya era miembro),
//      le manda un correo de bienvenida usando Resend.
//
// El id de usuario viaja en "external_reference" (lo puso
// create-checkout al crear la suscripción), así que no importa
// con qué correo haya pagado la persona en Mercado Pago.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   MP_ACCESS_TOKEN            Access Token de PRODUCCIÓN de Mercado Pago
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key (Project Settings -> API).
//                              Esta SÍ es secreta — nunca va en el sitio web,
//                              solo acá como secreto de la función.
//   RESEND_API_KEY             API Key de Resend, para mandar el correo
//                              de bienvenida (resend.com -> API Keys).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
// Para que si alguien responde el correo de bienvenida, te llegue a ti
// (tu dominio no tiene bandeja de entrada propia todavía).
const REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url)
    let topic = url.searchParams.get('type') || url.searchParams.get('topic')
    let id = url.searchParams.get('data.id') || url.searchParams.get('id')

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        topic = topic || body.type || body.topic
        id = id || (body.data && body.data.id) || body.id
      } catch (_e) {
        // sin cuerpo JSON, seguimos con lo que haya en la URL
      }
    }

    if (!topic || !id) {
      return new Response('ignored', { status: 200 })
    }

    if (topic === 'subscription_preapproval' || topic === 'preapproval') {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      })
      const data = await res.json()
      const userId = data.external_reference
      const status = data.status // 'authorized' | 'paused' | 'cancelled' | 'pending'

      if (userId) {
        if (status === 'authorized') {
          // Primero vemos si YA era miembro, para no mandar el correo
          // de bienvenida otra vez en cada aviso futuro (por ejemplo
          // el cobro del mes siguiente también dispara este webhook).
          const { data: existing } = await supabase
            .from('profiles')
            .select('is_member, email')
            .eq('id', userId)
            .maybeSingle()

          const yaEraMiembro = !!(existing && existing.is_member)

          const { error } = await supabase
            .from('profiles')
            .update({
              is_member: true,
              member_since: new Date().toISOString(),
              mp_preapproval_id: id,
              mp_preapproval_status: status,
            })
            .eq('id', userId)
          if (error) console.error('Error activando miembro:', error)

          const correoDestino = (existing && existing.email) || data.payer_email
          if (!yaEraMiembro && correoDestino) {
            await mandarCorreoBienvenida(correoDestino)
          }
        } else if (status === 'cancelled' || status === 'paused') {
          const { error } = await supabase
            .from('profiles')
            .update({
              is_member: false,
              mp_preapproval_id: id,
              mp_preapproval_status: status,
            })
            .eq('id', userId)
          if (error) console.error('Error desactivando miembro:', error)
        }
      }
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    // Devolvemos 200 igual para que Mercado Pago no reintente sin
    // parar; el error queda en los logs de la función para revisar.
    console.error(e)
    return new Response('ok', { status: 200 })
  }
})

async function mandarCorreoBienvenida(destinatario: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [destinatario],
        reply_to: REPLY_TO_EMAIL,
        subject: 'Tu acceso a Inglés con Leo ya está listo 🎉',
        html: HTML_BIENVENIDA,
      }),
    })
    if (!res.ok) {
      const detalle = await res.text()
      console.error('Error mandando correo de bienvenida:', detalle)
    }
  } catch (e) {
    console.error('Error mandando correo de bienvenida:', e)
  }
}

const HTML_BIENVENIDA = `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <h1 style="color:#253ECC; font-size:22px; margin-top:0;">¡Bienvenido a Inglés con Leo!</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Tu membresía ya está activa y puedes empezar a practicar desde hoy.
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Dentro encontrarás actividades de gramática, vocabulario, listening,
      speaking y writing, organizadas para que avances a tu ritmo y sin
      complicaciones.
    </p>
    <p style="text-align:center; margin:28px 0;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:12px 24px; border-radius:8px; font-size:15px; display:inline-block;">
        Entrar a mi cuenta
      </a>
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      No necesitas estudiar horas. Con unos minutos de práctica constante
      puedes avanzar muchísimo.
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Empieza por la habilidad que más quieras mejorar y continúa desde ahí.
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Si en algún momento tienes una duda o necesitas ayuda, puedes responder
      directamente a este correo.
    </p>
    <p style="color:#333; font-size:15px; margin-bottom:0;">
      Gracias por formar parte de Inglés con Leo. ¡Bienvenida(o)!
    </p>
  </div>
</div>
`.trim()
