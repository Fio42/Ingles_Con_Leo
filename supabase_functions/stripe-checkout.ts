// ============================================================
// Inglés con Leo — Edge Function: stripe-checkout
//
// La llama el navegador de un usuario YA LOGUEADO (con su sesión
// de Supabase) cuando hace clic en "Pagar con tarjeta (Stripe)".
// Crea una sesión de Checkout de Stripe en modo suscripción,
// ligada al id de ese usuario (client_reference_id), y devuelve
// la URL de pago a la que el navegador redirige.
//
// Es el equivalente de create-checkout.ts pero para Stripe en vez
// de Mercado Pago. Se pensó para las personas que pagan desde
// fuera de México (o con una tarjeta que Mercado Pago no acepta).
//
// Variables de entorno que necesita (se configuran en Supabase
// -> Edge Functions -> Secrets, NUNCA se pegan en este archivo):
//   STRIPE_SECRET_KEY     la "Secret key" de tu cuenta de Stripe
//                         (Stripe -> Developers -> API keys). Empieza
//                         con sk_live_... en producción.
//   STRIPE_PRICE_ID       el id del "Price" recurrente que crees en
//                         Stripe para la membresía (empieza con
//                         price_...). Ver DEVLOG para instrucciones.
//   SUPABASE_URL          (ya viene puesta sola en Supabase)
//   SUPABASE_ANON_KEY     (ya viene puesta sola en Supabase)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const BACK_URL = 'https://inglesconleo.com/miembros.html'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return json({ error: 'no_token' }, 401)
    }

    // Verifica el token del usuario contra Supabase Auth para
    // saber quién es (y que la sesión sea real).
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData || !userData.user) {
      return json({ error: 'invalid_session' }, 401)
    }
    const user = userData.user

    const body = new URLSearchParams()
    body.set('mode', 'subscription')
    body.set('line_items[0][price]', STRIPE_PRICE_ID)
    body.set('line_items[0][quantity]', '1')
    body.set('client_reference_id', user.id)
    if (user.email) body.set('customer_email', user.email)
    body.set('success_url', BACK_URL + '?stripe=success')
    body.set('cancel_url', BACK_URL)

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const stripeData = await stripeRes.json()
    if (!stripeRes.ok) {
      console.error('Error de Stripe:', stripeData)
      return json({ error: 'stripe_error', detail: stripeData }, 500)
    }

    return json({ init_point: stripeData.url }, 200)
  } catch (e) {
    console.error(e)
    return json({ error: 'server_error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
