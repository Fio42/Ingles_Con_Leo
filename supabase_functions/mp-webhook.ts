// ============================================================
// Inglés con Leo — Edge Function: mp-webhook
//
// Mercado Pago llama a esta URL cada vez que pasa algo con una
// suscripción (se activa, se paga, se cancela, se pausa). Esta
// función:
//   1. Recibe el aviso (solo trae un id, no hay que confiar en
//      los datos que manda directamente).
//   2. Le pregunta a la API de Mercado Pago los datos reales de
//      esa suscripción (usando el Access Token, que es secreto).
//   3. Si está "authorized" (pagando), activa is_member=true en
//      la fila de profiles que tenga ese id de usuario.
//   4. Si se cancela o se pausa, la desactiva.
//
// El id de usuario viaja en "external_reference" (lo puso
// create-checkout al crear la suscripción), así que no importa
// con qué correo haya pagado la persona en Mercado Pago.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   MP_ACCESS_TOKEN            Access Token de PRODUCCIÓN de Mercado Pago
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key (Project Settings -> API).
//                              Esta SÍ es secreta — nunca va en el sitio web,
//                              solo acá como secreto de la función.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url)
    let topic = url.searchParams.get('type') || url.searchParams.get('topic')
    let id = url.searchParams.get('data.id') || url.searchParams.get('id')

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        topic = topic || body.type || body.topic
        id = id || (body.data && body.data.id) || body.id
      } catch (_e) {
        // sin cuerpo JSON, seguimos con lo que haya en la URL
      }
    }

    if (!topic || !id) {
      return new Response('ignored', { status: 200 })
    }

    if (topic === 'subscription_preapproval' || topic === 'preapproval') {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      })
      const data = await res.json()
      const userId = data.external_reference
      const status = data.status // 'authorized' | 'paused' | 'cancelled' | 'pending'

      if (userId) {
        if (status === 'authorized') {
          const { error } = await supabase
            .from('profiles')
            .update({ is_member: true, member_since: new Date().toISOString() })
            .eq('id', userId)
          if (error) console.error('Error activando miembro:', error)
        } else if (status === 'cancelled' || status === 'paused') {
          const { error } = await supabase
            .from('profiles')
            .update({ is_member: false })
            .eq('id', userId)
          if (error) console.error('Error desactivando miembro:', error)
        }
      }
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    // Devolvemos 200 igual para que Mercado Pago no reintente sin
    // parar; el error queda en los logs de la función para revisar.
    console.error(e)
    return new Response('ok', { status: 200 })
  }
})
