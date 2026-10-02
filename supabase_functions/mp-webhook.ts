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
//   5. Si es la primera vez que se activa (no ya era miembro),
//      le manda un correo de bienvenida usando Resend.
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
//   RESEND_API_KEY             API Key de Resend, para mandar el correo
//                              de bienvenida (resend.com -> API Keys).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
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
          // Primero vemos si YA era miembro, para no mandar el correo
          // de bienvenida otra vez en cada aviso futuro (por ejemplo
          // el cobro del mes siguiente también dispara este webhook).
          const { data: existing } = await supabase
            .from('profiles')
            .select('is_member, email')
            .eq('id', userId)
            .maybeSingle()

          const yaEraMiembro = !!(existing && existing.is_member)
          const correoDestino = (existing && existing.email) || data.payer_email

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
          // no existiera todavía (por ejemplo alguien la borró a mano por
          // error, o algo raro pasó justo al crear la cuenta), esto la
          // crea directamente en vez de no hacer nada. Si ya existe, la
          // actualiza normal (no borra el resto de sus columnas).
          // Próxima fecha de cobro, para la "zona de silencio" de los
          // correos de reactivación de miembros (ver
          // upgrade-nudge-emails.ts). Solo se guarda si Mercado Pago
          // la trae en este aviso (no se inventa una fecha si no
          // viene). Se refresca cada vez que llega este webhook, así
          // que se mantiene al día mientras Mercado Pago lo siga
          // mandando en cada ciclo.
          const upsertPayload: Record<string, unknown> = {
            id: userId,
            email: correoDestino,
            is_member: true,
            ...(esNuevo ? { member_since: new Date().toISOString() } : {}),
            mp_preapproval_id: id,
            mp_preapproval_status: status,
          }
          if (data.next_payment_date) upsertPayload.next_renewal_at = data.next_payment_date

          const { error } = await supabase
            .from('profiles')
            .upsert(upsertPayload, { onConflict: 'id' })
          if (error) console.error('Error activando miembro:', error)
          if (correoDestino) {
            await ensureMemberWelcome(userId, correoDestino)
          }
          if (esNuevo) {
            // Monto real de esta suscripción, tal cual lo devuelve Mercado
            // Pago en el mismo objeto que ya se consultó arriba (no hay
            // que inventarlo). PRICE_MXN de create-checkout.ts ($40 MXN/
            // mes) queda solo como respaldo por si algún día ese campo no
            // viniera.
            const autoRecurring = data.auto_recurring || {}
            const valorPago = typeof autoRecurring.transaction_amount === 'number' ? autoRecurring.transaction_amount : 40
            const moneda = autoRecurring.currency_id || 'MXN'
            fireMetaSubscribeInBackground({
              userId,
              email: correoDestino,
              value: valorPago,
              currency: moneda,
              eventId: `mp_subscribe_${id}`,
            })
          }
        } else if (status === 'cancelled' || status === 'paused') {
          const { error } = await supabase
            .from('profiles')
            .update({
              is_member: false,
              mp_preapproval_id: id,
              mp_preapproval_status: status,
            })
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
