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

// ---- Meta Conversions API: avisa a Meta (Facebook/Instagram Ads) que
// alguien se volvió miembro de pago DE VERDAD (no un simple clic ni un
// registro gratis: es el mismo momento en que se manda el correo de
// bienvenida, justo después de confirmar is_member=true por primera
// vez). Se usa el evento estándar "Subscribe" (no "Purchase": este es
// un pago recurrente/suscripción, no una compra única).
//
// Es intencional que sea código repetido en stripe-webhook.ts,
// paypal-webhook.ts y mp-webhook.ts en vez de un archivo compartido:
// cada uno se pega como una Edge Function independiente en el
// Dashboard de Supabase (copiar/pegar un solo archivo), así que no
// hay forma de importar un archivo local entre ellas.
//
// Variables de entorno nuevas (Supabase -> Edge Functions -> Secrets,
// hay que agregarlas en ESTA función):
//   META_CAPI_ACCESS_TOKEN      Token de "Conversions API" del pixel de
//                               Meta. Se genera en Meta Events Manager ->
//                               elige el pixel "InglesconLeo" -> pestaña
//                               "Configuración" -> sección "Conversions
//                               API" -> "Generar token de acceso". Es
//                               secreto: nunca va en el sitio web.
//   META_CAPI_TEST_EVENT_CODE   Opcional, SOLO mientras se hacen pruebas.
//                               Se obtiene en Events Manager -> pestaña
//                               "Probar eventos" (empieza con "TEST"). Con
//                               esto puesto, los eventos aparecen ahí en
//                               vivo pero NO cuentan como reales para las
//                               campañas. Hay que borrar este secreto (o
//                               dejarlo vacío) para que los eventos de
//                               verdad se registren normal.
// Si META_CAPI_ACCESS_TOKEN no está configurado todavía, esta función
// simplemente no manda nada (no rompe la activación de la membresía).
const META_PIXEL_ID = '2182739922655837' // mismo id que meta-pixel.js, no es secreto
const META_CAPI_ACCESS_TOKEN = Deno.env.get('META_CAPI_ACCESS_TOKEN') || ''
const META_CAPI_TEST_EVENT_CODE = Deno.env.get('META_CAPI_TEST_EVENT_CODE') || ''

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function trackMetaSubscribe(opts: {
  userId: string
  email?: string | null
  value: number
  currency: string
  eventId: string
}) {
  if (!META_CAPI_ACCESS_TOKEN) return
  try {
    const userData: Record<string, unknown> = {
      external_id: await sha256Hex(opts.userId),
    }
    if (opts.email) {
      userData.em = [await sha256Hex(opts.email.trim().toLowerCase())]
    }
    const payload: Record<string, unknown> = {
      data: [{
        event_name: 'Subscribe',
        event_time: Math.floor(Date.now() / 1000),
        // event_id fijo por transacción: si Stripe/PayPal/Mercado Pago
        // reenvían el mismo aviso (reintentos), Meta descarta el
        // duplicado en vez de contar dos "nuevos miembros".
        event_id: opts.eventId,
        action_source: 'website',
        event_source_url: 'https://inglesconleo.com/miembros.html',
        user_data: userData,
        custom_data: { value: opts.value, currency: opts.currency },
      }],
    }
    if (META_CAPI_TEST_EVENT_CODE) payload.test_event_code = META_CAPI_TEST_EVENT_CODE
    const res = await fetch(`https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Limite duro para que, si Meta esta lento o no responde, esto no se
      // quede colgado indefinidamente (ver fireMetaSubscribeInBackground:
      // esto ya corre en segundo plano y no bloquea la respuesta al
      // webhook, pero igual conviene no dejar la conexion abierta).
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error('Error mandando evento Subscribe a Meta:', await res.text())
  } catch (e) {
    console.error('Error mandando evento Subscribe a Meta:', e)
  }
}

// Dispara el evento Subscribe SIN esperar a que termine, para que una
// falla o lentitud de Meta nunca retrase ni ponga en riesgo la
// respuesta al webhook real de pago (la activacion de la membresia ya
// se guardo en Supabase antes de llegar aqui, eso es lo que de verdad
// importa). trackMetaSubscribe ya atrapa sus propios errores, asi que
// esta promesa nunca rechaza.
//
// EdgeRuntime.waitUntil es la API que da el runtime de Supabase Edge
// Functions (Deno Deploy) justo para esto: tareas de "despues de
// responder" (logging, analitica) que no deben demorar la respuesta.
// Si por lo que sea no existe (por ejemplo corriendo esto fuera de ese
// runtime), simplemente se deja correr la promesa de todas formas.
function fireMetaSubscribeInBackground(opts: {
  userId: string
  email?: string | null
  value: number
  currency: string
  eventId: string
}) {
  const promise = trackMetaSubscribe(opts)
  const runtime = (globalThis as any).EdgeRuntime
  if (runtime && typeof runtime.waitUntil === 'function') {
    runtime.waitUntil(promise)
  }
}

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

        // Reclamo atómico de "pasó de gratis a miembro" (auditoría
        // 2026-09-30): los proveedores de pago a veces mandan el mismo
        // aviso dos veces casi al mismo tiempo. Antes, ambas copias
        // leían is_member=false a la vez y las dos mandaban la
        // bienvenida (y el evento a Meta). Ahora solo UNA copia logra
        // este update (filtra is_member=false) y esa es la que manda.
        let esNuevo = false
        if (!yaEraMiembro) {
          const { data: reclamado } = await supabase
            .from('profiles')
            .update({ is_member: true, member_since: new Date().toISOString(), member_welcome_sent_at: null, member_welcome_claimed_at: null })
            .eq('id', userId)
            .eq('is_member', false)
            .select('id')
          if (reclamado && reclamado.length) esNuevo = true
          else if (!existing) esNuevo = true // fila inexistente: el upsert de abajo la crea
        }

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
              ...(esNuevo ? { member_since: new Date().toISOString() } : {}),
              paypal_subscription_id: subscriptionId,
            },
            { onConflict: 'id' }
          )
        if (error) console.error('Error activando miembro (PayPal):', error)
        if (correoDestino) {
          await ensureMemberWelcome(userId, correoDestino)
        }
        // subscriptionDetails solo se llena si de verdad se hizo una
        // consulta a la API de PayPal más abajo (para poder reusarla en
        // refreshNextRenewal sin pedir el mismo dato dos veces). Si se
        // deja en null, refreshNextRenewal simplemente hace su propia
        // consulta normal, igual que siempre.
        let subscriptionDetails: any = null
        let sePidioDetalleAparte = false
        if (esNuevo) {
          // Monto real del primer cobro: primero se busca en el propio
          // aviso (algunos avisos de PayPal ya traen billing_info), y
          // solo si no viene ahí se consulta la suscripción aparte.
          let lastPaymentAmount = resource.billing_info && resource.billing_info.last_payment && resource.billing_info.last_payment.amount
          if (!lastPaymentAmount && subscriptionId) {
            subscriptionDetails = await fetchPaypalSubscriptionDetails(subscriptionId)
            sePidioDetalleAparte = true
            lastPaymentAmount = subscriptionDetails && subscriptionDetails.billing_info && subscriptionDetails.billing_info.last_payment && subscriptionDetails.billing_info.last_payment.amount
          }
          // Si por lo que sea PayPal todavía no trae el monto real en
          // ningún lado, se usa el precio fijo del plan mensual como
          // último respaldo (PayPal solo ofrece mensual, $2 USD, ver
          // PAYPAL_PLAN_ID en paypal-checkout.ts).
          const valorPago = lastPaymentAmount ? parseFloat(lastPaymentAmount.value) : 2
          const moneda = lastPaymentAmount ? lastPaymentAmount.currency_code : 'USD'
          fireMetaSubscribeInBackground({
            userId,
            email: correoDestino,
            value: valorPago,
            currency: moneda,
            eventId: `paypal_subscribe_${subscriptionId}`,
          })
        }
        // Próxima fecha de cobro, para la "zona de silencio" de los
        // correos de reactivación de miembros (ver
        // upgrade-nudge-emails.ts). El aviso de activación no siempre
        // trae esta fecha, así que se consulta aparte (reusando
        // subscriptionDetails solo si de verdad ya se pidió arriba; si
        // no, refreshNextRenewal hace su propia consulta, igual que
        // siempre).
        if (subscriptionId) {
          await refreshNextRenewal(subscriptionId, sePidioDetalleAparte ? subscriptionDetails : undefined)
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

// Consulta el detalle completo de una suscripción en PayPal (incluye
// billing_info.next_billing_time y billing_info.last_payment.amount).
// Se comparte entre refreshNextRenewal y el evento Subscribe de Meta
// para no pedirle a PayPal el mismo dato dos veces.
async function fetchPaypalSubscriptionDetails(subscriptionId: string): Promise<any | null> {
  try {
    const accessToken = await getPaypalAccessToken()
    if (!accessToken) return null
    const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error('Error consultando la suscripción de PayPal:', e)
    return null
  }
}

// Guarda billing_info.next_billing_time (si viene) en next_renewal_at.
// No toca is_member ni nada más: es solo para saber cuándo NO mandar
// los correos de reactivación de miembros (ver
// upgrade-nudge-emails.ts). Si PayPal no trae esa fecha por lo que
// sea, no se escribe nada (no se inventa una fecha aproximada).
// Acepta un "prefetched" opcional (el mismo detalle que ya se haya
// consultado para el evento Subscribe de Meta) para no repetir la
// llamada a la API de PayPal.
async function refreshNextRenewal(subscriptionId: string, prefetched?: any | null) {
  try {
    const data = prefetched !== undefined ? prefetched : await fetchPaypalSubscriptionDetails(subscriptionId)
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

async function mandarCorreoBienvenida(destinatario: string): Promise<boolean> {
  // Hasta 3 intentos (Resend a veces responde 429 o falla un instante).
  for (let intento = 1; intento <= 3; intento++) {
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
      if (res.ok) return true
      const detalle = await res.text()
      console.error(`Error mandando correo de bienvenida (intento ${intento}):`, detalle)
    } catch (e) {
      console.error(`Error mandando correo de bienvenida (intento ${intento}):`, e)
    }
    if (intento < 3) await new Promise((r) => setTimeout(r, 1200 * intento))
  }
  return false
}

// Bienvenida de miembro con reintento seguro (auditoría 2026-09-30).
// member_welcome_sent_at = ya se mandó (lo único que la cierra).
// member_welcome_claimed_at = "alguien la está mandando ahora" (lease de
// WELCOME_LEASE_MINUTES: solo una ejecución a la vez, y si el proceso
// muriera la reserva caduca sola). La membresía ya quedó activa ANTES
// de llamar esto, así que un fallo de Resend nunca afecta el acceso; y
// si la bienvenida falla, el barrido de upgrade-nudge-emails (cada 30
// min) y cualquier aviso repetido del proveedor la reintentan.
const WELCOME_LEASE_MINUTES = 15
async function ensureMemberWelcome(userId: string, email: string): Promise<void> {
  try {
    const { data: row } = await supabase
      .from('profiles')
      .select('is_member, member_welcome_sent_at')
      .eq('id', userId)
      .maybeSingle()
    if (!row || !row.is_member || row.member_welcome_sent_at) return
    const leaseCutoff = new Date(Date.now() - WELCOME_LEASE_MINUTES * 60000).toISOString()
    const { data: reclamado } = await supabase
      .from('profiles')
      .update({ member_welcome_claimed_at: new Date().toISOString() })
      .eq('id', userId)
      .is('member_welcome_sent_at', null)
      .or(`member_welcome_claimed_at.is.null,member_welcome_claimed_at.lt.${leaseCutoff}`)
      .select('id')
    if (!reclamado || !reclamado.length) return
    const ok = await mandarCorreoBienvenida(email)
    await supabase
      .from('profiles')
      .update(ok ? { member_welcome_sent_at: new Date().toISOString(), member_welcome_claimed_at: null } : { member_welcome_claimed_at: null })
      .eq('id', userId)
  } catch (e) {
    console.error('Error en ensureMemberWelcome:', e)
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
    <div style="background-color:#1d2f7a; background-image:linear-gradient(135deg,#0b1736 0%,#1d2f7a 55%,#3554F0 100%); border-radius:12px; padding:20px 18px; margin:18px 0; color:#ffffff;">
      <span style="display:inline-block; background-color:rgba(255,255,255,0.14); border:1px solid rgba(255,255,255,0.28); color:#ffffff; font-size:11px; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase; border-radius:999px; padding:3px 10px;">✦ Leo AI · Incluido</span>
      <p style="color:#ffffff; font-size:18px; font-weight:bold; line-height:1.3; margin:10px 0 6px;">Tu profesor de apoyo con IA ya está activo</p>
      <p style="color:#dfe5ff; font-size:14px; line-height:1.5; margin:0 0 10px;">Después de contestar un ejercicio, busca los botones con la estrellita ✦:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="color:#9fb1ff; font-size:14px; vertical-align:top; padding:3px 8px 3px 0;">✦</td><td style="color:#ffffff; font-size:14px; line-height:1.45; padding:3px 0;"><strong>Explícame por qué</strong>: te explica tu error en español sencillo</td></tr>
        <tr><td style="color:#9fb1ff; font-size:14px; vertical-align:top; padding:3px 8px 3px 0;">✦</td><td style="color:#ffffff; font-size:14px; line-height:1.45; padding:3px 0;"><strong>Revisar mi frase con Leo AI</strong>: en Writing, te dice qué corregir</td></tr>
        <tr><td style="color:#9fb1ff; font-size:14px; vertical-align:top; padding:3px 8px 3px 0;">✦</td><td style="color:#ffffff; font-size:14px; line-height:1.45; padding:3px 0;"><strong>Analizar mi sesión con Leo AI</strong>: al terminar, te dice qué reforzar</td></tr>
      </table>
    </div>
    <p style="text-align:center; margin:28px 0;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:12px 24px; border-radius:8px; font-size:15px; display:inline-block;">
        Entrar a mi cuenta
      </a>
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      No necesitas estudiar horas. Con unos minutos de práctica constante
      puedes avanzar muchísimo, sobre todo si cada error lo conviertes en
      algo que ya entiendes.
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Si no sabes por dónde empezar, entra a tu plan de estudio: está armado
      con tu nivel y tus puntos débiles.
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
