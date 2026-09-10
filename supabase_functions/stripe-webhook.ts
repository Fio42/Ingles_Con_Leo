// ============================================================
// Inglés con Leo — Edge Function: stripe-webhook
//
// Stripe llama a esta URL cada vez que pasa algo con una
// suscripción (se completa el pago, se cancela, se actualiza).
// Esta función:
//   1. Verifica que el aviso venga realmente de Stripe (usando la
//      firma que manda en el header "Stripe-Signature" y el
//      "signing secret" del webhook, que es secreto).
//   2. Si el pago se completó (checkout.session.completed), activa
//      is_member=true en profiles y guarda el stripe_customer_id
//      (para poder identificar a este usuario en avisos futuros,
//      que ya no traen su id directamente).
//   3. Si es la primera vez que se activa (no ya era miembro), le
//      manda un correo de bienvenida usando Resend, igual que hace
//      mp-webhook.ts para Mercado Pago.
//   4. Si la suscripción se cancela o queda en un estado que ya no
//      es válido, desactiva is_member.
//
// El id de usuario viaja en "client_reference_id" SOLO en el
// primer aviso (checkout.session.completed), por eso ese aviso es
// el único momento en que guardamos stripe_customer_id: de ahí en
// adelante, los avisos de esa suscripción se identifican por ese
// customer id en vez del id de usuario.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   STRIPE_SECRET_KEY          la misma Secret key de stripe-checkout
//   STRIPE_WEBHOOK_SECRET      el "Signing secret" que Stripe te da
//                              al crear el webhook (empieza con
//                              whsec_...). Ver DEVLOG para instrucciones.
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key (Project Settings -> API).
//                              Esta SÍ es secreta — nunca va en el sitio web,
//                              solo acá como secreto de la función.
//   RESEND_API_KEY             la misma que ya usa mp-webhook.ts para
//                              mandar el correo de bienvenida (los
//                              secretos de Supabase se comparten entre
//                              todas las funciones, así que si ya la
//                              tienes puesta no hay que agregarla de nuevo).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
// Para que si alguien responde el correo de bienvenida, te llegue a ti
// (tu dominio no tiene bandeja de entrada propia todavía).
const REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Estados de suscripción de Stripe que SÍ cuentan como miembro activo.
const ACTIVE_STATUSES = new Set(['active', 'trialing'])

Deno.serve(async (req: Request) => {
  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('Stripe-Signature') || ''
    const isValid = await verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET)
    if (!isValid) {
      console.error('Firma de Stripe inválida, aviso ignorado.')
      return new Response('invalid signature', { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const type = event.type
    const obj = event.data && event.data.object

    if (type === 'checkout.session.completed' && obj) {
      const userId = obj.client_reference_id
      const customerId = obj.customer
      if (userId && obj.mode === 'subscription') {
        // Primero vemos si YA era miembro, para no mandar el correo
        // de bienvenida otra vez en cada aviso futuro (por ejemplo si
        // alguna vez se vuelve a suscribir).
        const { data: existing } = await supabase
          .from('profiles')
          .select('is_member, email')
          .eq('id', userId)
          .maybeSingle()

        const yaEraMiembro = !!(existing && existing.is_member)

        const { error } = await supabase
          .from('profiles')
          .update({ is_member: true, member_since: new Date().toISOString(), stripe_customer_id: customerId })
          .eq('id', userId)
        if (error) console.error('Error activando miembro (Stripe):', error)

        const correoDestino = (existing && existing.email) || obj.customer_details?.email || obj.customer_email
        if (!yaEraMiembro && correoDestino) {
          await mandarCorreoBienvenida(correoDestino)
        }
      }
    } else if ((type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') && obj) {
      const customerId = obj.customer
      const isActive = type === 'customer.subscription.updated' && ACTIVE_STATUSES.has(obj.status)
      if (customerId) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_member: isActive })
          .eq('stripe_customer_id', customerId)
        if (error) console.error('Error actualizando miembro (Stripe):', error)
      }
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    // Devolvemos 200 igual para que Stripe no reintente sin parar;
    // el error queda en los logs de la función para revisar.
    console.error(e)
    return new Response('ok', { status: 200 })
  }
})

// Verifica la firma que manda Stripe en el header "Stripe-Signature"
// (formato "t=TIMESTAMP,v1=FIRMA"), calculando el HMAC-SHA256 del
// mismo cuerpo con el "signing secret" y comparándolo. Así nos
// asegura que el aviso viene de Stripe y no de cualquiera que le
// pegue a esta URL.
async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): Promise<boolean> {
  if (!signatureHeader || !secret) return false
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=')
      return [k, v]
    })
  )
  const timestamp = parts['t']
  const expectedSig = parts['v1']
  if (!timestamp || !expectedSig) return false

  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const computedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return computedSig === expectedSig
}

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
