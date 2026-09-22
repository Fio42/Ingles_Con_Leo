// ============================================================
// Inglés con Leo — Edge Function: paypal-webhook
//
// PayPal llama a esta URL cada vez que pasa algo con una
// suscripción (se activa, se cancela, se suspende). Esta función:
//   1. Verifica que el aviso venga realmente de PayPal, llamando a
//      la API de verificación de firmas de PayPal (así no hay que
//      implementar a mano el algoritmo de firma).
//   2. Si la suscripción se activó (BILLING.SUBSCRIPTION.ACTIVATED),
//      activa is_member=true en profiles y guarda el id de la
//      suscripción (para identificar a este usuario en avisos
//      futuros, como la cancelación).
//   3. Si es la primera vez que se activa (no ya era miembro), le
//      manda un correo de bienvenida usando Resend, igual que hacen
//      mp-webhook.ts y stripe-webhook.ts.
//   4. Si la suscripción se cancela, suspende o expira, desactiva
//      is_member.
//
// El id de usuario viaja en "custom_id" (lo puso paypal-checkout al
// crear la suscripción), así que no importa con qué correo haya
// pagado la persona dentro de PayPal.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   PAYPAL_CLIENT_ID           la misma Client ID de paypal-checkout
//   PAYPAL_CLIENT_SECRET       el mismo Secret de paypal-checkout
//   PAYPAL_WEBHOOK_ID          el id del webhook que crees en PayPal
//                              (developer.paypal.com -> tu app ->
//                              Webhooks -> Add Webhook). Ver DEVLOG
//                              para instrucciones.
//   PAYPAL_MODE                'live' o 'sandbox', igual que en
//                              paypal-checkout.ts
//   SUPABASE_URL                (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY   la "service_role" key (Project Settings -> API).
//                               Esta SÍ es secreta — nunca va en el sitio web,
//                               solo acá como secreto de la función.
//   RESEND_API_KEY              la misma que ya usan mp-webhook.ts y
//                               stripe-webhook.ts para mandar el correo
//                               de bienvenida (los secretos de Supabase se
//                               comparten entre todas las funciones, así
//                               que si ya la tienes puesta no hay que
//                               agregarla de nuevo).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')!
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')!
const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID')!
const PAYPAL_MODE = (Deno.env.get('PAYPAL_MODE') || 'live').trim().toLowerCase()
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const PAYPAL_API_BASE = PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
// Para que si alguien responde el correo de bienvenida, te llegue a ti
// (tu dominio no tiene bandeja de entrada propia todavía).
const REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Eventos de PayPal que SÍ cuentan como "ya no es miembro activo".
const CANCEL_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED',
])

Deno.serve(async (req: Request) => {
  try {
    const rawBody = await req.text()
    const headers = Object.fromEntries(req.headers.entries())

    const isValid = await verifyPaypalSignature(rawBody, headers)
    if (!isValid) {
      console.error('Firma de PayPal inválida, aviso ignorado.')
      return new Response('invalid signature', { status: 400 })
    }

    const event = JSON.parse(rawBody)
    const type = event.event_type
    const resource = event.resource || {}

    if (type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const userId = resource.custom_id
      const subscriptionId = resource.id
      const paypalEmail = resource.subscriber && resource.subscriber.email_address

      if (userId) {
        // Primero vemos si YA era miembro, para no mandar el correo
        // de bienvenida otra vez en cada aviso futuro.
        const { data: existing } = await supabase
          .from('profiles')
          .select('is_member, email')
          .eq('id', userId)
          .maybeSingle()

        const yaEraMiembro = !!(existing && existing.is_member)
        const correoDestino = (existing && existing.email) || paypalEmail

        // upsert en vez de update: si por lo que sea la fila de profiles
        // no existiera todavía, esto la crea directamente en vez de no
        // hacer nada. Si ya existe, la actualiza normal (no borra el
        // resto de sus columnas).
        const { error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              email: correoDestino,
              is_member: true,
              member_since: new Date().toISOString(),
              paypal_subscription_id: subscriptionId,
            },
            { onConflict: 'id' }
          )
        if (error) console.error('Error activando miembro (PayPal):', error)
        if (!yaEraMiembro && correoDestino) {
          await mandarCorreoBienvenida(correoDestino)
        }
        // Próxima fecha de cobro, para la "zona de silencio" de los
        // correos de reactivación de miembros (ver
        // upgrade-nudge-emails.ts). El aviso de activación no siempre
        // trae esta fecha, así que se consulta aparte.
        if (subscriptionId) {
          await refreshNextRenewal(subscriptionId)
        }
      }
    } else if (CANCEL_EVENTS.has(type)) {
      const subscriptionId = resource.id
      if (subscriptionId) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_member: false })
          .eq('paypal_subscription_id', subscriptionId)
        if (error) console.error('Error desactivando miembro (PayPal):', error)
      }
    } else if (type === 'PAYMENT.SALE.COMPLETED') {
      // Se dispara en cada cobro recurrente ya hecho de una
      // suscripción (no solo en la activación). Se usa SOLO para
      // mantener next_renewal_at al día mes a mes: no toca is_member
      // ni ninguna otra columna.
      const billingAgreementId = resource.billing_agreement_id
      if (billingAgreementId) {
        await refreshNextRenewal(billingAgreementId)
      }
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    // Devolvemos 200 igual para que PayPal no reintente sin parar;
    // el error queda en los logs de la función para revisar.
    console.error(e)
    return new Response('ok', { status: 200 })
  }
})

// PayPal no manda un secreto de firma como Stripe: en vez de eso,
// hay que reenviarle el aviso completo (con sus headers de firma) a
// su propia API de verificación, y ella responde si es válido o no.
async function verifyPaypalSignature(rawBody: string, headers: Record<string, string>): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) return false
  const transmissionId = headers['paypal-transmission-id']
  const transmissionTime = headers['paypal-transmission-time']
  const certUrl = headers['paypal-cert-url']
  const authAlgo = headers['paypal-auth-algo']
  const transmissionSig = headers['paypal-transmission-sig']
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false
  }

  const accessToken = await getPaypalAccessToken()
  if (!accessToken) return false

  let webhookEvent: unknown
  try {
    webhookEvent = JSON.parse(rawBody)
  } catch (_e) {
    return false
  }

  try {
    const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: webhookEvent,
      }),
    })
    const data = await res.json()
    return data.verification_status === 'SUCCESS'
  } catch (e) {
    console.error('Error verificando firma de PayPal:', e)
    return false
  }
}

async function getPaypalAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    const data = await res.json()
    if (!res.ok || !data.access_token) {
      console.error('Error obteniendo token de PayPal:', data)
      return null
    }
    return data.access_token
  } catch (e) {
    console.error(e)
    return null
  }
}

// Consulta el detalle de la suscripción en PayPal y guarda
// billing_info.next_billing_time (si viene) en next_renewal_at. No
// toca is_member ni nada más: es solo para saber cuándo NO mandar
// los correos de reactivación de miembros (ver
// upgrade-nudge-emails.ts). Si PayPal no trae esa fecha por lo que
// sea, no se escribe nada (no se inventa una fecha aproximada).
async function refreshNextRenewal(subscriptionId: string) {
  try {
    const accessToken = await getPaypalAccessToken()
    if (!accessToken) return
    const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return
    const data = await res.json()
    const nextBillingTime = data && data.billing_info && data.billing_info.next_billing_time
    if (nextBillingTime) {
      const { error } = await supabase
        .from('profiles')
        .update({ next_renewal_at: nextBillingTime })
        .eq('paypal_subscription_id', subscriptionId)
      if (error) console.error('Error guardando next_renewal_at (PayPal):', error)
    }
  } catch (e) {
    console.error('Error consultando la próxima renovación (PayPal):', e)
  }
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
