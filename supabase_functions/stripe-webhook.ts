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
        const correoDestino = (existing && existing.email) || obj.customer_details?.email || obj.customer_email

        // upsert en vez de update: si por lo que sea la fila de profiles
        // no existiera todavía (por ejemplo alguien la borró a mano por
        // error, o algo raro pasó justo al crear la cuenta), esto la
        // crea directamente en vez de no hacer nada. Si ya existe, la
        // actualiza normal (no borra el resto de sus columnas).
        const { error } = await supabase
          .from('profiles')
          .upsert(
            { id: userId, email: correoDestino, is_member: true, member_since: new Date().toISOString(), stripe_customer_id: customerId },
            { onConflict: 'id' }
          )
        if (error) console.error('Error activando miembro (Stripe):', error)
        if (!yaEraMiembro && correoDestino) {
          await mandarCorreoBienvenida(correoDestino)
        }
        if (!yaEraMiembro) {
          // amount_total/currency son el monto REAL cobrado en esta sesión
          // (Stripe ya ajusta el precio según el país), así que no hay que
          // inventar ni hardcodear el valor mensual/anual acá.
          const valorPago = typeof obj.amount_total === 'number' ? obj.amount_total / 100 : 2
          const moneda = (obj.currency || 'usd').toUpperCase()
          fireMetaSubscribeInBackground({
            userId,
            email: correoDestino,
            value: valorPago,
            currency: moneda,
            eventId: `stripe_subscribe_${obj.id}`,
          })
        }
      }
    } else if ((type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') && obj) {
      const customerId = obj.customer
      const isActive = type === 'customer.subscription.updated' && ACTIVE_STATUSES.has(obj.status)
      if (customerId) {
        const updatePayload: Record<string, unknown> = { is_member: isActive }
        // Próxima fecha de renovación (para la "zona de silencio" de
        // los correos de reactivación de miembros, ver
        // upgrade-nudge-emails.ts). Stripe movió este dato de la
        // suscripción al "item" de la suscripción a partir de la
        // versión de API 2025-03-31 ("basil"); se revisa primero ahí
        // y, si no está, se usa el campo viejo por si esta cuenta
        // sigue en una versión de API anterior a esa. Si de plano no
        // viene ninguno de los dos, no se manda nada (queda como
        // estaba, no se inventa una fecha).
        const periodEndUnix = obj.items?.data?.[0]?.current_period_end ?? obj.current_period_end
        if (isActive && periodEndUnix) {
          updatePayload.next_renewal_at = new Date(periodEndUnix * 1000).toISOString()
        }
        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
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
