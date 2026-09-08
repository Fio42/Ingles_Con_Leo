// ============================================================
// Inglés con Leo — Edge Function: create-checkout
//
// La llama el navegador de un usuario YA LOGUEADO (con su
// sesión de Supabase) cuando hace clic en "Pagar con Mercado
// Pago". Crea una suscripción (preapproval) en Mercado Pago
// ligada al id de ese usuario (external_reference), y devuelve
// el link de pago (init_point) al que el navegador redirige.
//
// Ligar el pago al id de usuario (no al email que use en
// Mercado Pago) es lo que permite activar la membresía sola,
// sin importar con qué correo pague dentro de Mercado Pago.
//
// Variables de entorno que necesita (se configuran en Supabase
// -> Edge Functions -> Secrets, NUNCA se pegan en este archivo):
//   MP_ACCESS_TOKEN        el Access Token de PRODUCCIÓN de tu app de Mercado Pago
//   SUPABASE_URL           (ya viene puesta sola en Supabase)
//   SUPABASE_ANON_KEY      (ya viene puesta sola en Supabase)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Precio de la membresía. Cambialo acá si el precio cambia.
const PRICE_MXN = 40
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

    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Membresía Inglés con Leo',
        external_reference: user.id,
        payer_email: user.email,
        back_url: BACK_URL,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: PRICE_MXN,
          currency_id: 'MXN',
        },
        status: 'pending',
      }),
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok) {
      console.error('Error de Mercado Pago:', mpData)
      return json({ error: 'mp_error', detail: mpData }, 500)
    }

    return json({ init_point: mpData.init_point }, 200)
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
