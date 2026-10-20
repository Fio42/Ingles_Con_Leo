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
//      es válido, desactiva is_member. Excepción (2026-10-20): si falla
//      una RENOVACIÓN (past_due) hay 72 h de gracia y un correo amable;
//      ver "Gracia por cobro fallido" más abajo.
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

// Registro central de errores (ver error-monitoring.sql). A prueba de fallos: nunca lanza ni espera
// más de 2 s, así que si el registro falla el flujo del usuario sigue exactamente igual. Solo se
// mandan textos fijos y códigos, nunca datos del alumno; la base los limpia otra vez.
async function reportServerError(kind: string, section: string, message: string, code: string, severity: string) {
  let timer: any
  try {
    const base = `${kind}|${section}|${code}|${message}`.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '#').replace(/\d+/g, '#').slice(0, 200)
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base))
    const fp = Array.from(new Uint8Array(buf)).slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('')
    await Promise.race([
      Promise.resolve(supabase.rpc('log_app_error', {
        p_fp: fp, p_kind: kind, p_source: 'server', p_severity: severity, p_section: section, p_message: message,
        p_error_name: null, p_stack_top: null, p_code: code, p_release: null, p_browser: null, p_platform: null, p_sample: null,
      })).then(() => {}, () => {}),
      new Promise((resolve) => { timer = setTimeout(resolve, 2000) }),
    ])
  } catch (_) { /* el registro de errores nunca rompe nada */ } finally { clearTimeout(timer) }
}

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

// ---- Gracia por cobro fallido (2026-10-20) ----
// Cuando falla la RENOVACIÓN, Stripe pone la suscripción en 'past_due' y
// reintenta el cobro varios días. Antes se quitaba el acceso en el mismo
// instante del primer fallo. Ahora:
//   - 'past_due': el miembro conserva el acceso PAYMENT_GRACE_HOURS horas
//     contadas desde el PRIMER fallo (profiles.payment_failed_at). Los
//     avisos repetidos de reintentos NO mueven esa fecha.
//   - Si paga antes (vuelve 'active'): se borra payment_failed_at y todo
//     sigue normal.
//   - Si pasan las 72 h sin cobrar: lo suspende la tarea programada de la
//     base de datos suspend_expired_payment_grace() (ver la migración
//     20261020160000_payment_grace.sql), porque Stripe no avisa justo a
//     la hora 72.
//   - Cancelación definitiva ('canceled', evento .deleted, 'unpaid',
//     'incomplete_expired'...): SIN gracia, se quita el acceso al instante.
// payment_failed_at también sirve para que upgrade-nudge-emails no le mande
// campañas de "hazte miembro" a quien ya tiene una suscripción por cobrar.
const PAYMENT_GRACE_HOURS = 72
// Estados definitivos: se borra todo rastro del cobro pendiente.
const TERMINAL_STATUSES = new Set(['canceled', 'incomplete_expired'])

// Quien llama a las columnas nuevas sin que la migración esté aplicada
// recibe este error de Postgres (columna inexistente).
function isMissingColumnError(error: any): boolean {
  return !!error && (error.code === '42703' || error.code === 'PGRST204' || /column .* does not exist|could not find the .* column/i.test(String(error.message || '')))
}

// Aplica un cambio a la fila del cliente de Stripe SOLO si el aviso no es
// más viejo que el último que ya se aplicó (Stripe no garantiza el orden de
// entrega: un 'past_due' viejo llegando tarde no debe pisar una recuperación).
async function updateByCustomer(customerId: string, payload: Record<string, unknown>, eventIso: string): Promise<{ applied: boolean; error: any }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...payload, stripe_event_at: eventIso })
    .eq('stripe_customer_id', customerId)
    .or(`stripe_event_at.is.null,stripe_event_at.lte.${eventIso}`)
    .select('id')
  return { applied: !!(data && data.length), error }
}

async function handleSubscriptionChange(type: string, obj: any, eventCreated: unknown): Promise<void> {
  const customerId = obj.customer as string
  const eventIso = new Date(typeof eventCreated === 'number' ? eventCreated * 1000 : Date.now()).toISOString()
  const status: string = type === 'customer.subscription.deleted' ? 'canceled' : String(obj.status || '')
  const isActive = type === 'customer.subscription.updated' && ACTIVE_STATUSES.has(status)
  const isGrace = type === 'customer.subscription.updated' && status === 'past_due'

  // Próxima fecha de renovación (para la "zona de silencio" de los correos
  // de reactivación de miembros, ver upgrade-nudge-emails.ts). Stripe movió
  // este dato de la suscripción al "item" a partir de la versión de API
  // 2025-03-31 ("basil"); se revisa primero ahí y, si no está, el campo
  // viejo. Si no viene ninguno, no se escribe nada (no se inventa una fecha).
  const periodEndUnix = obj.items?.data?.[0]?.current_period_end ?? obj.current_period_end

  if (isGrace) {
    // Primer fallo: se guarda la fecha UNA sola vez (si ya hay una, los
    // reintentos no la reinician). is_member NO se toca: sigue como estaba.
    const { data: claimed, error } = await supabase
      .from('profiles')
      .update({ payment_failed_at: eventIso, stripe_event_at: eventIso })
      .eq('stripe_customer_id', customerId)
      .is('payment_failed_at', null)
      .or(`stripe_event_at.is.null,stripe_event_at.lte.${eventIso}`)
      .select('id')
    if (error) {
      // Migración sin aplicar: se vuelve al comportamiento de antes (quitar
      // el acceso) en vez de dejar a alguien con acceso sin límite.
      console.error('Error guardando gracia de pago (Stripe):', error)
      await reportServerError('payment', 'stripe-webhook', 'Error guardando gracia de pago', 'grace_' + (error.code || 'db'), 'critical')
      if (isMissingColumnError(error)) {
        await supabase.from('profiles').update({ is_member: false }).eq('stripe_customer_id', customerId)
      }
      return
    }
    if (!(claimed && claimed.length)) {
      // Ya había un fallo registrado (reintento): solo se refresca el orden de avisos.
      await supabase.from('profiles').update({ stripe_event_at: eventIso }).eq('stripe_customer_id', customerId)
        .or(`stripe_event_at.is.null,stripe_event_at.lte.${eventIso}`)
    }
    await ensurePaymentFailedEmail(customerId, obj)
    return
  }

  const updatePayload: Record<string, unknown> = {}
  if (isActive) {
    updatePayload.is_member = true
    // Recuperación: se limpia todo lo del cobro fallido para que un fallo
    // futuro vuelva a tener su propia gracia y su propio aviso.
    updatePayload.payment_failed_at = null
    updatePayload.payment_failed_email_sent_at = null
    updatePayload.payment_failed_email_claimed_at = null
    if (periodEndUnix) updatePayload.next_renewal_at = new Date(periodEndUnix * 1000).toISOString()
  } else {
    // Cancelación definitiva o cualquier estado que ya no es válido: sin gracia.
    updatePayload.is_member = false
    if (TERMINAL_STATUSES.has(status)) {
      updatePayload.payment_failed_at = null
      updatePayload.payment_failed_email_sent_at = null
      updatePayload.payment_failed_email_claimed_at = null
    }
  }

  let { applied, error } = await updateByCustomer(customerId, updatePayload, eventIso)
  if (error && isMissingColumnError(error)) {
    // Migración sin aplicar: se usa el comportamiento de antes, sin columnas nuevas.
    const legacy: Record<string, unknown> = { is_member: updatePayload.is_member }
    if (updatePayload.next_renewal_at) legacy.next_renewal_at = updatePayload.next_renewal_at
    const r = await supabase.from('profiles').update(legacy).eq('stripe_customer_id', customerId)
    error = r.error
    applied = !r.error
  }
  if (error) {
    console.error('Error actualizando miembro (Stripe):', error)
    await reportServerError('payment', 'stripe-webhook', 'Error actualizando miembro', 'update_' + (error.code || 'db'), 'error')
    return
  }
  if (!applied) return // aviso viejo o cliente desconocido: no se hace nada

  if (status === 'unpaid') {
    // Reintentos agotados pero la suscripción sigue existiendo y por cobrar:
    // sin acceso, y se deja marcada para no mandarle campañas de conversión.
    await supabase.from('profiles').update({ payment_failed_at: eventIso })
      .eq('stripe_customer_id', customerId).is('payment_failed_at', null)
  }
}

// Busca el enlace seguro de Stripe para pagar la factura pendiente con otra
// tarjeta (hosted_invoice_url). No se usa el portal de cliente porque su
// enlace caduca a los pocos minutos y un correo se abre horas después.
// Solo se acepta una factura abierta, del mismo cliente y con un enlace
// https://invoice.stripe.com/...; si algo no cuadra devuelve null.
async function findPaymentLink(subscription: any, customerId: string): Promise<string | null> {
  try {
    const secret = Deno.env.get('STRIPE_SECRET_KEY') || ''
    const invoiceId = typeof subscription.latest_invoice === 'string' ? subscription.latest_invoice : subscription.latest_invoice?.id
    if (!secret || !invoiceId) return null
    const res = await fetch(`https://api.stripe.com/v1/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const inv = await res.json()
    const url = String(inv.hosted_invoice_url || '')
    if (inv.customer !== customerId || inv.status !== 'open') return null
    if (!/^https:\/\/invoice\.stripe\.com\/[A-Za-z0-9_\-\/?=&%.]+$/.test(url)) return null
    return url
  } catch (e) {
    console.error('Error buscando el enlace de pago (Stripe):', e)
    return null
  }
}

// Aviso amable de "tu pago no pasó". Una sola vez por episodio de fallo:
// payment_failed_email_sent_at lo cierra (se borra al recuperarse el pago) y
// payment_failed_email_claimed_at es una reserva corta para que dos avisos
// simultáneos de Stripe no manden dos correos. Es un correo de la cuenta
// (cobro), por eso NO respeta la baja de correos de práctica/marketing;
// solo se omite si el correo está marcado como rebotado.
const PAYMENT_EMAIL_LEASE_MINUTES = 15
async function ensurePaymentFailedEmail(customerId: string, subscription: any): Promise<void> {
  try {
    const { data: row } = await supabase
      .from('profiles')
      .select('id, email, email_invalid, payment_failed_at, payment_failed_email_sent_at')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (!row || !row.email || row.email_invalid || !row.payment_failed_at || row.payment_failed_email_sent_at) return
    const leaseCutoff = new Date(Date.now() - PAYMENT_EMAIL_LEASE_MINUTES * 60000).toISOString()
    const { data: reclamado } = await supabase
      .from('profiles')
      .update({ payment_failed_email_claimed_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('payment_failed_email_sent_at', null)
      .not('payment_failed_at', 'is', null)
      .or(`payment_failed_email_claimed_at.is.null,payment_failed_email_claimed_at.lt.${leaseCutoff}`)
      .select('id')
    if (!reclamado || !reclamado.length) return
    const link = await findPaymentLink(subscription, customerId)
    const ok = await mandarCorreoPagoFallido(row.email, link)
    await supabase
      .from('profiles')
      .update(ok ? { payment_failed_email_sent_at: new Date().toISOString(), payment_failed_email_claimed_at: null } : { payment_failed_email_claimed_at: null })
      .eq('id', row.id)
  } catch (e) {
    console.error('Error en ensurePaymentFailedEmail:', e)
  }
}

async function mandarCorreoPagoFallido(destinatario: string, link: string | null): Promise<boolean> {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [destinatario],
          reply_to: REPLY_TO_EMAIL,
          subject: 'No pudimos cobrar tu membresía de Inglés con Leo',
          html: htmlPagoFallido(link),
        }),
      })
      if (res.ok) return true
      console.error(`Error mandando correo de pago fallido (intento ${intento}):`, await res.text())
    } catch (e) {
      console.error(`Error mandando correo de pago fallido (intento ${intento}):`, e)
    }
    if (intento < 3) await new Promise((r) => setTimeout(r, 1200 * intento))
  }
  return false
}

function htmlPagoFallido(link: string | null): string {
  const boton = link
    ? `<p style="text-align:center; margin:28px 0;">
      <a href="${link.replace(/"/g, '&quot;')}"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:12px 24px; border-radius:8px; font-size:15px; display:inline-block;">
        Actualizar mi método de pago
      </a>
    </p>
    <p style="color:#666; font-size:13px; line-height:1.5;">
      El enlace es de Stripe, nuestra plataforma de pagos. Ahí puedes pagar con otra tarjeta de forma segura.
    </p>`
    : `<p style="color:#333; font-size:15px; line-height:1.6;">
      Si quieres actualizar tu método de pago o tienes dudas, responde a este correo y te ayudamos.
    </p>`
  return `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <h1 style="color:#253ECC; font-size:22px; margin-top:0;">Tu pago no pasó</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Hola. Intentamos renovar tu membresía de Inglés con Leo y tu banco no aprobó el cobro.
      Suele pasar por saldo insuficiente, una tarjeta vencida o un bloqueo temporal, y casi siempre se arregla rápido.
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Tranquilo(a): tu acceso sigue activo durante los próximos ${Math.round(PAYMENT_GRACE_HOURS / 24)} días. Stripe volverá a intentar el cobro por su cuenta,
      y si el pago pasa, no tienes que hacer nada.
    </p>
    ${boton}
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Si ya lo resolviste, ignora este mensaje.
    </p>
    <p style="color:#333; font-size:15px; margin-bottom:0;">
      Gracias por practicar con nosotros.
    </p>
  </div>
</div>
`.trim()
}

Deno.serve(async (req: Request) => {
  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('Stripe-Signature') || ''
    const isValid = await verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET)
    if (!isValid) {
      console.error('Firma de Stripe inválida, aviso ignorado.')
      await reportServerError('webhook', 'stripe-webhook', 'Firma de Stripe invalida', 'bad_signature', 'warning')
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
        const { error } = await supabase
          .from('profiles')
          .upsert(
            { id: userId, email: correoDestino, is_member: true, ...(esNuevo ? { member_since: new Date().toISOString() } : {}), stripe_customer_id: customerId },
            { onConflict: 'id' }
          )
        if (error) {
          console.error('Error activando miembro (Stripe):', error)
          await reportServerError('payment', 'stripe-webhook', 'Error activando miembro tras un pago', 'activate_' + (error.code || 'db'), 'critical')
        }
        // Una compra nueva borra cualquier cobro fallido anterior (si no, la
        // tarea de gracia podría suspender a quien acaba de volver a pagar).
        // Aparte y sin mirar el resultado: si la migración de la gracia aún
        // no está aplicada esto falla en silencio y no afecta la activación.
        await supabase
          .from('profiles')
          .update({ payment_failed_at: null, payment_failed_email_sent_at: null, payment_failed_email_claimed_at: null })
          .eq('id', userId)
        if (correoDestino) {
          await ensureMemberWelcome(userId, correoDestino)
        }
        if (esNuevo) {
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
      if (customerId) {
        await handleSubscriptionChange(type, obj, event.created)
      }
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    // Devolvemos 200 igual para que Stripe no reintente sin parar;
    // el error queda en los logs de la función para revisar.
    console.error(e)
    await reportServerError('payment', 'stripe-webhook', 'Excepcion no controlada: ' + String((e as Error)?.message ?? e).slice(0, 150), 'exception', 'critical')
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
