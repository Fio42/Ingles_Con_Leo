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
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key (Project Settings -> API).
//                              Se usa SOLO para registrar checkout_started_at
//                              (analitica). Si ya la usas en los webhooks de
//                              pago, es la misma, no hay que crear una nueva.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
// OJO: a proposito SIN el "!" al final (a diferencia de las otras
// constantes de este archivo). Si todavia no pegaste este secreto en
// Supabase, esto NO debe tumbar el checkout real: mas abajo se revisa
// que no este vacio antes de usarlo, y si esta vacio simplemente se
// salta el registro de checkout_started_at (analitica), sin afectar
// el pago.
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Precio de la membresía. Cambialo acá si el precio cambia.
const PRICE_MXN = 40
const BACK_URL = 'https://inglesconleo.com/miembros.html'

// ---- Cuenta ligada a Stripe: renovacion pendiente y estado no confirmado (2026-11-16) ----
// Antes de abrir CUALQUIER membresia nueva (Stripe, PayPal o Mercado Pago) se revisa en Stripe si esta cuenta ya
// tiene una renovacion fallida que Stripe sigue reintentando. Crear otra suscripcion podria cobrarle dos veces.
//   pending     -> se devuelve el enlace seguro de Stripe para pagar ESA factura (no se crea nada nuevo).
//   unavailable -> la cuenta esta ligada a Stripe y no se pudo confirmar su estado (Stripe no responde, error de
//                  red, clave ausente, o hay una renovacion pendiente sin enlace seguro): error temporal 503 para
//                  que la persona reintente. Nunca se abre una membresia a ciegas.
//   ok          -> cuenta sin Stripe (alta nueva), o Stripe confirmo que no hay nada pendiente: flujo normal.
const STRIPE_SECRET_KEY_GUARD = Deno.env.get('STRIPE_SECRET_KEY') || ''
const STRIPE_INVOICE_URL_RE = /^https:\/\/invoice\.stripe\.com\/[A-Za-z0-9_\-\/?=&%.]+$/
type StripeGuard = { kind: 'ok' } | { kind: 'pending'; url: string } | { kind: 'unavailable' }
async function checkStripeAccount(userId: string): Promise<StripeGuard> {
  // Sin la clave de servicio no se puede ni leer el perfil: igual que antes de este cambio (nunca fue obligatoria).
  if (!SUPABASE_SERVICE_ROLE_KEY) return { kind: 'ok' }
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: prof, error } = await admin.from('profiles').select('stripe_customer_id').eq('id', userId).maybeSingle()
    if (error) return { kind: 'unavailable' }
    const customerId = prof && prof.stripe_customer_id ? String(prof.stripe_customer_id) : ''
    if (!customerId) return { kind: 'ok' }
    if (!STRIPE_SECRET_KEY_GUARD) return { kind: 'unavailable' }
    const res = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=20&expand[]=data.latest_invoice`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY_GUARD}` }, signal: AbortSignal.timeout(4000) },
    )
    if (!res.ok) {
      // Cliente que ya no existe en Stripe: no hay nada pendiente que proteger.
      if (res.status === 404) {
        const e = await res.json().catch(() => null)
        if (e && e.error && e.error.code === 'resource_missing') return { kind: 'ok' }
      }
      return { kind: 'unavailable' }
    }
    const list = await res.json()
    if (!list || !Array.isArray(list.data)) return { kind: 'unavailable' }
    let unresolved = false
    for (const sub of list.data) {
      if (!sub || (sub.status !== 'past_due' && sub.status !== 'unpaid')) continue
      const inv = sub.latest_invoice
      const url = inv && typeof inv === 'object' ? String(inv.hosted_invoice_url || '') : ''
      if (sub.customer === customerId && inv && typeof inv === 'object' && inv.customer === customerId && inv.status === 'open' && STRIPE_INVOICE_URL_RE.test(url)) {
        return { kind: 'pending', url }
      }
      unresolved = true
    }
    return unresolved ? { kind: 'unavailable' } : { kind: 'ok' }
  } catch (_e) {
    return { kind: 'unavailable' }
  }
}

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
        // checkout_started_at = ULTIMO intento real (2026-10-08). Cada
        // llamada a esta función es un clic explícito en un botón de pago
        // (recargar la página no la llama). Antirrebote de 10 min: un doble
        // clic o un reintento inmediato no cuenta como intento nuevo.
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const debounceCutoff = new Date(Date.now() - 10 * 60000).toISOString()
        await supabaseAdmin
          .from('profiles')
          .update({ checkout_started_at: new Date().toISOString() })
          .eq('id', user.id)
          .or(`checkout_started_at.is.null,checkout_started_at.lt.${debounceCutoff}`)
      } catch (e) {
        console.error('No se pudo registrar checkout_started_at:', e)
      }
    }

    // Cuenta ligada a Stripe: renovacion pendiente -> pagar esa factura; Stripe sin responder -> error temporal.
    const stripeGuard = await checkStripeAccount(user.id)
    if (stripeGuard.kind === 'pending') return json({ pending_payment_url: stripeGuard.url }, 200)
    if (stripeGuard.kind === 'unavailable') return json({ error: 'stripe_unavailable' }, 503)

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
        back_url: BACK_URL + '?mp=success',
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
