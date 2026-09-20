// ============================================================
// Inglés con Leo — Edge Function: stripe-checkout
//
// La llama el navegador de un usuario YA LOGUEADO (con su sesión
// de Supabase) cuando hace clic en "Pagar con tarjeta (Stripe)".
// Crea una sesión de Checkout de Stripe en modo suscripción,
// ligada al id de ese usuario (client_reference_id), en modo
// "embedded_page" (ui_mode=embedded_page): en vez de devolver un link al que
// hay que redirigir, devuelve un client_secret que el navegador usa
// para mostrar el formulario de tarjeta incrustado en la propia
// página (miembros.html), sin salir del sitio. El webhook
// (stripe-webhook.ts) NO cambia: Stripe sigue mandando exactamente
// el mismo aviso checkout.session.completed al terminar, sea
// embedded o redirigido, así que la activación de membresía sigue
// funcionando igual que siempre.
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
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key (Project Settings -> API).
//                              Se usa SOLO para registrar checkout_started_at
//                              (analitica). Si ya la usas en los webhooks de
//                              pago, es la misma, no hay que crear una nueva.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
// OJO: a proposito SIN el "!" al final (a diferencia de las otras
// constantes de este archivo). Si todavia no pegaste este secreto en
// Supabase, esto NO debe tumbar el checkout real: mas abajo se revisa
// que no este vacio antes de usarlo, y si esta vacio simplemente se
// salta el registro de checkout_started_at (analitica), sin afectar
// el pago.
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

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

    // Registra que este usuario llegó hasta el proceso de pago (aunque
    // no lo termine). Es solo para analítica (ver punto 9 del pedido de
    // Leo): no afecta el pago ni is_member, así que si esto falla por lo
    // que sea, seguimos con el checkout normal de todas formas.
    if (SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        await supabaseAdmin
          .from('profiles')
          .update({ checkout_started_at: new Date().toISOString() })
          .eq('id', user.id)
          .is('checkout_started_at', null)
      } catch (e) {
        console.error('No se pudo registrar checkout_started_at:', e)
      }
    }

    const body = new URLSearchParams()
    body.set('mode', 'subscription')
    body.set('line_items[0][price]', STRIPE_PRICE_ID)
    body.set('line_items[0][quantity]', '1')
    body.set('client_reference_id', user.id)
    if (user.email) body.set('customer_email', user.email)
    body.set('ui_mode', 'embedded_page')
    body.set('return_url', BACK_URL + '?stripe=success')

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

    return json({ client_secret: stripeData.client_secret }, 200)
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
