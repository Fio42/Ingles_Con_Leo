// ============================================================
// Inglés con Leo — Edge Function: libro-download
//
// Entrega el PDF del libro "100 errores comunes en inglés" SOLO a
// quien pagó. La página libro-gracias.html la llama con el
// session_id que Stripe pone en la dirección después del pago
// (Payment Link -> "Después del pago" -> redirigir a
// https://inglesconleo.com/libro-gracias.html?session_id={CHECKOUT_SESSION_ID}).
//
// Qué hace:
//   1. Pregunta a Stripe por esa sesión de pago.
//   2. Solo si está pagada (payment_status = paid), fue un pago único
//      (mode = payment) y el producto es el del libro (LIBRO_PRICE_ID),
//      pide a Supabase Storage un enlace firmado que dura 10 minutos.
//   3. Devuelve ese enlace. El PDF vive en un bucket PRIVADO ("libros"),
//      nunca en el repositorio ni en una dirección pública.
//
// Seguridad: el session_id de Stripe es largo e imposible de adivinar.
// Si alguien lo comparte, otra persona podría volver a descargar (igual
// que pasa con cualquier libro digital de pago único). Para frenarlo
// basta con desactivar el Payment Link o cambiar el archivo del bucket.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   STRIPE_SECRET_KEY   la misma que ya usa stripe-checkout.
//   LIBRO_PRICE_ID      el id del Price del libro (empieza con price_...).
//                       Se ve en Stripe -> Product catalog -> el libro.
//   SUPABASE_URL                 (viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY    (la misma que ya usan otras funciones)
//
// Despliegue (desde la carpeta inglesconLeo):
//   npx supabase functions deploy libro-download --no-verify-jwt --use-api
// (--no-verify-jwt porque quien compra no tiene cuenta en el sitio.)
// ============================================================

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
const LIBRO_PRICE_ID = Deno.env.get('LIBRO_PRICE_ID') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const BUCKET = 'libros'
const FILE = 'Ingles_con_Leo_100_errores_comunes.pdf'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://inglesconleo.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  if (!STRIPE_SECRET_KEY || !LIBRO_PRICE_ID || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error('libro-download: faltan variables de entorno')
    return json({ error: 'not_configured' }, 500)
  }

  let sessionId = ''
  try {
    const body = await req.json()
    sessionId = String(body?.session_id || '')
  } catch (_) {
    return json({ error: 'bad_request' }, 400)
  }
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(sessionId)) {
    return json({ error: 'bad_session' }, 400)
  }

  // 1. Pregunta a Stripe por la sesión de pago (con sus productos).
  const sres = await fetch(
    'https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sessionId) + '?expand[]=line_items',
    { headers: { Authorization: 'Bearer ' + STRIPE_SECRET_KEY } },
  )
  if (!sres.ok) return json({ error: 'session_not_found' }, 404)
  const session = await sres.json()

  // 2. Solo pagos únicos, ya pagados, del producto del libro.
  const items: any[] = session?.line_items?.data || []
  const isBook = items.some((li) => li?.price?.id === LIBRO_PRICE_ID)
  if (session?.mode !== 'payment' || session?.payment_status !== 'paid' || !isBook) {
    return json({ error: 'not_paid' }, 402)
  }

  // 3. Enlace firmado de 10 minutos al PDF privado.
  const signRes = await fetch(SUPABASE_URL + '/storage/v1/object/sign/' + BUCKET + '/' + FILE, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + SERVICE_ROLE,
      apikey: SERVICE_ROLE,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: 600 }),
  })
  if (!signRes.ok) {
    console.error('libro-download: no se pudo firmar', signRes.status)
    return json({ error: 'sign_failed' }, 500)
  }
  const signed = await signRes.json()
  const path: string = signed?.signedURL || ''
  if (!path) return json({ error: 'sign_failed' }, 500)

  const url = SUPABASE_URL + '/storage/v1' + path + '&download=' + encodeURIComponent(FILE)
  return json({ url })
})
