// ============================================================
// Inglés con Leo — Edge Function: paypal-checkout
//
// La llama el navegador de un usuario YA LOGUEADO (con su sesión
// de Supabase) cuando hace clic en "Pagar con PayPal". Crea una
// suscripción en PayPal ligada al id de ese usuario (custom_id),
// y devuelve la URL de aprobación a la que el navegador redirige.
//
// Es el equivalente de create-checkout.ts (Mercado Pago) y
// stripe-checkout.ts (Stripe) pero para PayPal.
//
// Variables de entorno que necesita (se configuran en Supabase
// -> Edge Functions -> Secrets, NUNCA se pegan en este archivo):
//   PAYPAL_CLIENT_ID      el "Client ID" de tu app de PayPal
//                         (developer.paypal.com -> Apps & Credentials)
//   PAYPAL_CLIENT_SECRET  el "Secret" de esa misma app
//   PAYPAL_PLAN_ID        el id del Plan de suscripción que crees en
//                         PayPal para la membresía (empieza con P-).
//                         Ver DEVLOG para instrucciones.
//   PAYPAL_MODE           'live' o 'sandbox'. Usa 'sandbox' mientras
//                         estés haciendo pruebas, y 'live' cuando ya
//                         quieras cobrar de verdad.
//   SUPABASE_URL          (ya viene puesta sola en Supabase)
//   SUPABASE_ANON_KEY     (ya viene puesta sola en Supabase)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key (Project Settings -> API).
//                              Se usa SOLO para registrar checkout_started_at
//                              (analitica). Si ya la usas en los webhooks de
//                              pago, es la misma, no hay que crear una nueva.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID')!
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET')!
const PAYPAL_PLAN_ID = Deno.env.get('PAYPAL_PLAN_ID')!
const PAYPAL_MODE = (Deno.env.get('PAYPAL_MODE') || 'live').trim().toLowerCase()
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
// OJO: a proposito SIN el "!" al final (a diferencia de las otras
// constantes de este archivo). Si todavia no pegaste este secreto en
// Supabase, esto NO debe tumbar el checkout real: mas abajo se revisa
// que no este vacio antes de usarlo, y si esta vacio simplemente se
// salta el registro de checkout_started_at (analitica), sin afectar
// el pago.
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const PAYPAL_API_BASE = PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

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

    const accessToken = await getPaypalAccessToken()
    if (!accessToken) {
      return json({ error: 'paypal_auth_error' }, 500)
    }

    const subRes = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `sub-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: PAYPAL_PLAN_ID,
        // custom_id es lo que nos permite, en el webhook, saber a
        // qué usuario de Supabase corresponde esta suscripción sin
        // importar con qué correo haya pagado dentro de PayPal.
        custom_id: user.id,
        subscriber: user.email ? { email_address: user.email } : undefined,
        application_context: {
          brand_name: 'Inglés con Leo',
          locale: 'es-MX',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: BACK_URL + '?paypal=success',
          cancel_url: BACK_URL,
        },
      }),
    })

    const subData = await subRes.json()
    if (!subRes.ok) {
      console.error('Error de PayPal:', subData)
      return json({ error: 'paypal_error', detail: subData }, 500)
    }

    const approveLink = (subData.links || []).find((l: any) => l.rel === 'approve')
    if (!approveLink) {
      console.error('PayPal no devolvió link de aprobación:', subData)
      return json({ error: 'paypal_no_approve_link' }, 500)
    }

    // Se devuelve como "init_point" para que el frontend (backend.js)
    // pueda tratar la respuesta igual que la de Mercado Pago/Stripe.
    return json({ init_point: approveLink.href }, 200)
  } catch (e) {
    console.error(e)
    return json({ error: 'server_error' }, 500)
  }
})

// Pide un access token de PayPal usando las credenciales de la app
// (client_id + secret), con el flujo estándar OAuth2 "client
// credentials". Este token es distinto al del usuario: identifica
// a la app de Inglés con Leo ante PayPal, no a la persona que paga.
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

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
