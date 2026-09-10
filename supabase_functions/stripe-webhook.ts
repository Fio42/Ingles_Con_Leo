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
//   3. Si la suscripción se cancela o queda en un estado que ya no
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
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
        const { error } = await supabase
          .from('profiles')
          .update({ is_member: true, member_since: new Date().toISOString(), stripe_customer_id: customerId })
          .eq('id', userId)
        if (error) console.error('Error activando miembro (Stripe):', error)
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
