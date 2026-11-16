// ============================================================
// Inglés con Leo — Edge Function: payment-recovery-emails
//
// Correos de seguimiento cuando falla la RENOVACIÓN de una membresía de Stripe.
// El primer aviso ("No pudimos cobrar tu membresía") ya lo manda stripe-webhook.ts.
// Esta función manda los siguientes, una sola vez cada uno por episodio de fallo:
//
//   reminder   unas 48 h después del primer fallo, si todavía tiene acceso:
//              le quedan menos de 24 h antes de que se pause (la gracia es de 72 h).
//   suspended  cuando ya se le quitó el acceso por falta de pago (máximo 10 días tarde).
//   winback1   ~30 días después del primer fallo, si sigue sin ser miembro.
//   winback2   ~60 días después, si sigue sin ser miembro. Es el último correo.
//
// De dónde salen los episodios: tabla payment_recovery (migración 20261116120000).
// stripe-webhook la abre en el primer fallo y la cierra si la persona vuelve a pagar.
// Esta función también la cierra sola si la persona aparece como miembro otra vez.
//
// Reglas de seguridad (ante la duda NO se manda):
//   - Solo corre con la llave interna (x-internal-secret = 'internal_functions_secret' del Vault),
//     igual que upgrade-nudge-emails. Sin llave: 401.
//   - Solo de 8:00 a 20:59 hora de Cancún (si no es hora, espera a la siguiente pasada).
//   - Una reserva de 15 min por episodio y relectura fresca del perfil justo antes de enviar:
//     nunca dos correos iguales ni un correo a quien ya volvió a ser miembro.
//   - reminder y suspended son correos de COBRO de la cuenta: no respetan la baja de correos de
//     práctica ni la pausa por rebote temporal (igual que el aviso "tu pago no pasó"), pero sí
//     se omiten si el correo está marcado como inválido (email_invalid).
//   - winback1 y winback2 son de MARKETING: respetan la baja (email_opt_out_at), email_invalid, la
//     pausa (email_paused_until) y el freno global de 48 h desde el último correo de marketing
//     (last_marketing_email_at). Llevan enlace de baja y cabecera List-Unsubscribe.
//   - Si Resend falla, no se registra nada y se reintenta en la siguiente pasada.
//
// Simulación sin enviar ni escribir nada: cuerpo {"dry_run": true}. Responde qué haría con cada episodio.
//
// Variables de entorno (las mismas que ya usan las otras funciones):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY, (opcional) MAIL_API_URL.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
// Respaldo de correo: sin el secreto MAIL_API_URL todo sale directo por Resend (igual que stripe-webhook.ts).
const MAIL_API_URL = Deno.env.get('MAIL_API_URL') || 'https://api.resend.com/emails'

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
const REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'
const SITE = 'https://inglesconleo.com'
const UNSUB_PAGE = `${SITE}/baja.html`

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const H = 3600000
const D = 86400000
// Todos los tiempos importantes están aquí.
const CFG = {
  REMINDER_AFTER_H: 48, // el recordatorio sale desde la hora 48 del primer fallo
  GRACE_H: 72, // igual que PAYMENT_GRACE_HOURS en stripe-webhook.ts y la tarea de la base
  SUSPENDED_MAX_DAYS: 10, // pasado esto, el aviso de pausa ya no tiene sentido y se omite
  WINBACK1_FROM_DAYS: 30,
  WINBACK1_UNTIL_DAYS: 45,
  WINBACK2_FROM_DAYS: 60,
  WINBACK2_UNTIL_DAYS: 75,
  MARKETING_GAP_HOURS: 48, // para decidir: no se manda un seguimiento si hubo otro correo de marketing hace menos de 48 h
  GLOBAL_BRAKE_HOURS: 24, // freno global compartido con upgrade-nudge-emails, racha y encuesta (1 correo cada 24 h)
  SLOT_TOLERANCE_MINUTES: 15,
  LEASE_MINUTES: 15,
  SEND_HOUR_START: 8, // hora de Cancún, inclusive
  SEND_HOUR_END: 21, // hora de Cancún, exclusive
  CANCUN_UTC_OFFSET_HOURS: -5,
  BATCH: 100,
}

type Step = 'reminder' | 'suspended' | 'winback1' | 'winback2'
type Decision =
  | { action: 'wait'; reason: string }
  | { action: 'send'; step: Step }
  | { action: 'skip'; step: Step; reason: string }
  | { action: 'close'; reason: string }

function isSendHour(nowMs: number): boolean {
  const utcHour = new Date(nowMs).getUTCHours()
  const local = (utcHour + CFG.CANCUN_UTC_OFFSET_HOURS + 24) % 24
  return local >= CFG.SEND_HOUR_START && local < CFG.SEND_HOUR_END
}

function ms(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const t = Date.parse(String(v))
  return Number.isFinite(t) ? t : null
}

// Decide qué hacer con un episodio. Función pura: no toca la red ni la base.
function decide(ep: any, prof: any, nowMs: number, ignoreHour: boolean): Decision {
  const started = ms(ep && ep.started_at)
  if (started === null) return { action: 'close', reason: 'bad_start_date' }
  if (!prof) return { action: 'close', reason: 'no_profile' }
  const email = prof.email ? String(prof.email).trim() : ''
  if (!email || prof.email_invalid) return { action: 'close', reason: 'email_unusable' }
  const age = nowMs - started
  const hourOk = ignoreHour || isSendHour(nowMs)
  const otherProvider = !!(prof.paypal_subscription_id || prof.mp_preapproval_id)

  if (prof.is_member) {
    // Volvió a ser miembro después de la pausa: el episodio terminó.
    if (ep.suspended_at) return { action: 'close', reason: 'member_again' }
    if (age < CFG.GRACE_H * H) {
      if (ep.reminder_at) return { action: 'wait', reason: 'reminder_done_in_grace' }
      if (age < CFG.REMINDER_AFTER_H * H) return { action: 'wait', reason: 'too_early' }
      if (!hourOk) return { action: 'wait', reason: 'outside_send_hour' }
      return { action: 'send', step: 'reminder' }
    }
    // Pasó la gracia y sigue como miembro. Con PayPal o Mercado Pago la tarea de la base nunca lo
    // suspende (su acceso lo deciden esos proveedores): ya no hay nada que recuperar aquí.
    if (otherProvider) return { action: 'close', reason: 'member_again' }
    return { action: 'wait', reason: 'waiting_for_suspension_sweep' }
  }

  // No es miembro (se le quitó el acceso por falta de pago, o Stripe canceló la suscripción).
  if (!ep.suspended_at) {
    if (age > CFG.SUSPENDED_MAX_DAYS * D) return { action: 'skip', step: 'suspended', reason: 'too_late' }
    if (!hourOk) return { action: 'wait', reason: 'outside_send_hour' }
    return { action: 'send', step: 'suspended' }
  }
  const winbacks: Array<{ step: Step; doneAt: unknown; fromD: number; untilD: number }> = [
    { step: 'winback1', doneAt: ep.winback1_at, fromD: CFG.WINBACK1_FROM_DAYS, untilD: CFG.WINBACK1_UNTIL_DAYS },
    { step: 'winback2', doneAt: ep.winback2_at, fromD: CFG.WINBACK2_FROM_DAYS, untilD: CFG.WINBACK2_UNTIL_DAYS },
  ]
  for (const w of winbacks) {
    if (w.doneAt) continue
    if (age < w.fromD * D) return { action: 'wait', reason: 'too_early' }
    if (age >= w.untilD * D) return { action: 'skip', step: w.step, reason: 'window_passed' }
    if (prof.email_opt_out_at) return { action: 'skip', step: w.step, reason: 'opted_out' }
    if (!hourOk) return { action: 'wait', reason: 'outside_send_hour' }
    const paused = ms(prof.email_paused_until)
    if (paused !== null && paused > nowMs) return { action: 'wait', reason: 'email_paused' }
    const lastMarketing = ms(prof.last_marketing_email_at)
    if (lastMarketing !== null && nowMs - lastMarketing < CFG.MARKETING_GAP_HOURS * H) return { action: 'wait', reason: 'marketing_gap' }
    return { action: 'send', step: w.step }
  }
  return { action: 'close', reason: 'completed' }
}

// ---------------- Llave interna ----------------
async function internalSecretOk(secret: string | null): Promise<boolean> {
  if (!secret) return false
  for (let intento = 1; intento <= 3; intento++) {
    const { data, error } = await supabase.rpc('internal_secret_ok', { p_secret: secret })
    if (!error) return data === true
    console.error(`Error revisando la llave interna (intento ${intento}):`, error)
    if (intento < 3) await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

// ---------------- Baja de correos (misma firma que email-unsubscribe.ts y upgrade-nudge-emails.ts) ----------------
async function unsubToken(userId: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(SUPABASE_SERVICE_ROLE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode('unsub:' + userId)))
  return Array.from(sig).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}
async function unsubLinks(userId: string): Promise<{ page: string; oneClick: string }> {
  const t = await unsubToken(userId)
  const qs = `u=${encodeURIComponent(userId)}&t=${t}`
  return { page: `${UNSUB_PAGE}?${qs}`, oneClick: `${SUPABASE_URL}/functions/v1/email-unsubscribe?${qs}` }
}

// ---------------- Enlace seguro de Stripe para pagar la renovacion pendiente ----------------
// REGLA: mientras Stripe todavia pueda recuperar el cobro (suscripcion past_due/unpaid con factura abierta),
// TODO correo que invite a volver (aviso, pausa y seguimientos) lleva a ESA factura, no a un checkout nuevo
// (otra suscripcion = riesgo de cobro doble). Una factura solo se acepta si:
//   - es del mismo cliente, esta abierta y su enlace es https://invoice.stripe.com/...
//   - su suscripcion es del mismo cliente y SIGUE viva y reintentandose (past_due o unpaid). Si Stripe ya la
//     cancelo, pagar esa factura vieja NO devolveria el acceso: entonces el boton va al sitio (miembros.html).
// Resultado:
//   link        -> hay renovacion recuperable: el boton va a la factura.
//   none        -> Stripe respondio y no hay nada recuperable: el boton va al sitio.
//   unavailable -> Stripe no respondio o la respuesta no se pudo confirmar: el correo ESPERA (se reintenta en la
//                  siguiente pasada); nunca se manda un boton a ciegas.
const STRIPE_INVOICE_URL_RE = /^https:\/\/invoice\.stripe\.com\/[A-Za-z0-9_\-\/?=&%.]+$/
type PayLink = { state: 'link'; url: string } | { state: 'none' } | { state: 'unavailable' }
async function findPaymentLink(customerId: string | null | undefined): Promise<PayLink> {
  if (!customerId) return { state: 'none' }
  try {
    const secret = Deno.env.get('STRIPE_SECRET_KEY') || ''
    if (!secret) return { state: 'unavailable' }
    const headers = { Authorization: `Bearer ${secret}` }
    const res = await fetch(`https://api.stripe.com/v1/invoices?customer=${encodeURIComponent(customerId)}&status=open&limit=10`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { state: 'unavailable' }
    const list = await res.json()
    if (!list || !Array.isArray(list.data)) return { state: 'unavailable' }
    for (const inv of list.data) {
      if (!inv || inv.customer !== customerId || inv.status !== 'open') continue
      const url = String(inv.hosted_invoice_url || '')
      if (!STRIPE_INVOICE_URL_RE.test(url)) continue
      // La suscripcion de la factura: campo viejo (invoice.subscription) o nuevo (invoice.parent.subscription_details.subscription).
      const rawSub = inv.subscription ?? (inv.parent && inv.parent.subscription_details && inv.parent.subscription_details.subscription)
      const subId = rawSub && typeof rawSub === 'object' ? rawSub.id : rawSub
      if (!subId) continue
      const sres = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(String(subId))}`, { headers, signal: AbortSignal.timeout(5000) })
      if (sres.status === 404) continue
      if (!sres.ok) return { state: 'unavailable' }
      const sub = await sres.json()
      if (sub && sub.customer === customerId && (sub.status === 'past_due' || sub.status === 'unpaid')) return { state: 'link', url }
    }
    return { state: 'none' }
  } catch (e) {
    console.error('Error buscando el enlace de pago (Stripe):', e)
    return { state: 'unavailable' }
  }
}

// ---------------- Textos ----------------
function cleanFirstName(raw: string | null | undefined): string {
  if (!raw) return ''
  let first = String(raw).trim().split(/\s+/)[0] || ''
  if (first.includes('@')) return ''
  first = first.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\-]/g, '').slice(0, 20)
  if (first.length < 2) return ''
  first = first.charAt(0).toLocaleUpperCase('es') + first.slice(1).toLocaleLowerCase('es')
  return first.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;')
}

const P = 'color:#333; font-size:15px; line-height:1.6;'
const BOX = 'background-color:#f1f4fe; border-left:4px solid #253ECC; border-radius:8px; padding:14px 16px; margin:18px 0; color:#333; font-size:15px; line-height:1.6;'

interface Content {
  subject: string
  title: string
  bodyHtml: string
  ctaText: string
  ctaUrl: string
  footerNote: string
}

function shell(greeting: string, c: Content, unsubUrl: string | null): string {
  const bajaHtml = unsubUrl
    ? `Recibes este correo porque tienes una cuenta en Inglés con Leo.<br>
    <a href="${unsubUrl}" style="color:#999;">Ya no quiero recibir estos correos</a>`
    : 'Recibes este correo porque tienes una membresía en Inglés con Leo.'
  return `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <p style="color:#333; font-size:15px; margin:0 0 4px;">${greeting}</p>
    <h1 style="color:#253ECC; font-size:22px; margin:0 0 14px;">${c.title}</h1>
    ${c.bodyHtml}
    <p style="text-align:center; margin:28px 0 10px;">
      <a href="${c.ctaUrl.replace(/"/g, '&quot;')}"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:14px 28px; border-radius:8px; font-size:15px; font-weight:bold; display:inline-block;">
        ${c.ctaText}
      </a>
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6; margin:24px 0 0;">
      Gracias por practicar con nosotros,<br><strong>Leo</strong>
    </p>
    <p style="color:#888; font-size:13px; line-height:1.6; margin:16px 0 0;">
      ${c.footerNote}
    </p>
  </div>
  <p style="max-width:520px; margin:14px auto 0; text-align:center; color:#999; font-size:12px; line-height:1.6;">
    ${bajaHtml}
  </p>
</div>
`.trim()
}

function contentFor(step: Step, payLink: string | null): Content {
  const memberPage = `${SITE}/miembros.html`
  if (step === 'reminder') {
    return {
      subject: 'Un paso rápido para no perder tu acceso a Inglés con Leo',
      title: 'Tu pago sigue pendiente',
      bodyHtml: `
    <p style="${P}">Hace un par de días intentamos renovar tu membresía y el pago no se pudo completar. A veces pasa por la tarjeta o por el banco, y suele arreglarse en un minuto.</p>
    <p style="${P}">Tu acceso sigue activo, pero se pausará en menos de un día si el pago no se completa. Puedes pagarla ahora mismo, con la misma tarjeta o con otra, desde aquí:</p>`,
      ctaText: payLink ? 'Pagar mi renovación pendiente' : 'Ver mi membresía',
      ctaUrl: payLink || memberPage,
      footerNote: 'Si ya lo resolviste, ignora este mensaje. Si necesitas ayuda, responde este correo y la vemos juntos.',
    }
  }
  if (step === 'suspended') {
    return {
      subject: 'Pausamos tu membresía de Inglés con Leo',
      title: 'Tu membresía está en pausa',
      bodyHtml: `
    <p style="${P}">No pudimos completar el cobro de tu renovación, así que pausamos tu acceso de miembro. No borramos nada: tu cuenta sigue creada y puedes practicar con la versión gratis cuando quieras.</p>
    <p style="${P}">Si quieres recuperar el acceso completo, solo falta pagar tu renovación pendiente, con la misma tarjeta o con otra:</p>`,
      ctaText: payLink ? 'Pagar mi renovación pendiente' : 'Reactivar mi membresía',
      ctaUrl: payLink || memberPage,
      footerNote: 'Si ya pagaste o crees que esto es un error, responde este correo y lo revisamos.',
    }
  }
  if (step === 'winback1') {
    return {
      subject: '¿Retomamos el inglés? Tu cuenta te está esperando',
      title: 'Tu lugar sigue aquí',
      bodyHtml: `
    <p style="${P}">Hace un mes pausamos tu membresía porque no pudimos cobrar la renovación. Solo quería avisarte que tu cuenta sigue ahí y que volver toma un minuto.</p>
    <div style="${BOX}">Para cuando regreses: <i>I'm back</i> significa «ya volví». Con esa frase ya estás practicando.</div>
    <p style="${P}">Si el problema fue la tarjeta, puedes usar otra. Sin compromiso.</p>`,
      ctaText: payLink ? 'Pagar mi renovación pendiente' : 'Reactivar mi membresía',
      ctaUrl: payLink || memberPage,
      footerNote: 'Si algo te hizo dejar de practicar, respóndeme y cuéntame. Me ayuda a mejorar la página.',
    }
  }
  return {
    subject: 'Último mensaje: tu lugar en Inglés con Leo',
    title: '¿Seguimos practicando juntos?',
    bodyHtml: `
    <p style="${P}">Te escribo una última vez sobre tu membresía. Si por ahora no es el momento, está bien: tu cuenta gratis sigue activa y puedes entrar cuando quieras.</p>
    <p style="${P}">Si quieres retomar con todo, aquí te dejo el acceso. Y si hubo algo que no te gustó, respóndeme este correo, me ayuda a mejorar.</p>`,
    ctaText: payLink ? 'Pagar mi renovación pendiente' : 'Reactivar mi membresía',
    ctaUrl: payLink || memberPage,
    footerNote: 'Este es el último correo que te mando sobre esto.',
  }
}

const IS_MARKETING: Record<Step, boolean> = { reminder: false, suspended: false, winback1: true, winback2: true }

async function sendMail(to: string, subject: string, html: string, oneClickUnsubUrl: string | null): Promise<boolean> {
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }
      const body: Record<string, unknown> = { from: FROM_EMAIL, to: [to], reply_to: REPLY_TO_EMAIL, subject, html }
      if (oneClickUnsubUrl) {
        body.headers = { 'List-Unsubscribe': `<${oneClickUnsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      } else {
        headers['x-mail-flow'] = 'transactional'
      }
      const res = await fetch(MAIL_API_URL, { method: 'POST', headers, body: JSON.stringify(body) })
      if (res.ok) return true
      console.error(`Error mandando correo de recuperación (intento ${intento}):`, await res.text())
    } catch (e) {
      console.error(`Error mandando correo de recuperación (intento ${intento}):`, e)
    }
    if (intento < 3) await new Promise((r) => setTimeout(r, 800 * intento))
  }
  return false
}

const PROFILE_COLS =
  'id, email, display_name, is_member, email_invalid, email_paused_until, email_opt_out_at, last_marketing_email_at, stripe_customer_id, paypal_subscription_id, mp_preapproval_id'

async function readProfile(userId: string): Promise<any> {
  const { data } = await supabase.from('profiles').select(PROFILE_COLS).eq('id', userId).maybeSingle()
  return data || null
}
async function readEpisode(userId: string): Promise<any> {
  const { data } = await supabase.from('payment_recovery').select('*').eq('user_id', userId).maybeSingle()
  return data || null
}
async function releaseClaim(userId: string): Promise<void> {
  await supabase.from('payment_recovery').update({ claimed_at: null }).eq('user_id', userId)
}
async function closeEpisode(userId: string, reason: string): Promise<void> {
  await supabase.from('payment_recovery').update({ closed_at: new Date().toISOString(), closed_reason: reason, claimed_at: null }).eq('user_id', userId).is('closed_at', null)
}

// Procesa un episodio. Devuelve un texto corto con lo que pasó (para el resumen).
async function processEpisode(userId: string): Promise<string> {
  let ep = await readEpisode(userId)
  if (!ep || ep.closed_at) return 'gone'
  let prof = await readProfile(userId)
  let d = decide(ep, prof, Date.now(), false)
  if (d.action === 'wait') return 'wait:' + d.reason
  if (d.action === 'close') { await closeEpisode(userId, d.reason); return 'closed:' + d.reason }

  // Reserva corta: evita que dos pasadas simultáneas manden el mismo correo.
  const leaseCutoff = new Date(Date.now() - CFG.LEASE_MINUTES * 60000).toISOString()
  const { data: claimed } = await supabase
    .from('payment_recovery')
    .update({ claimed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('closed_at', null)
    .or(`claimed_at.is.null,claimed_at.lt.${leaseCutoff}`)
    .select('user_id')
  if (!claimed || !claimed.length) return 'locked'

  try {
    // Relectura fresca ya con la reserva: si algo cambió (volvió a pagar, se dio de baja), se vuelve a decidir.
    ep = await readEpisode(userId)
    if (!ep || ep.closed_at) return 'gone'
    prof = await readProfile(userId)
    d = decide(ep, prof, Date.now(), false)
    if (d.action === 'wait') { await releaseClaim(userId); return 'wait:' + d.reason }
    if (d.action === 'close') { await closeEpisode(userId, d.reason); return 'closed:' + d.reason }
    if (d.action === 'skip') {
      await supabase.from('payment_recovery').update({ [d.step + '_at']: new Date().toISOString(), [d.step + '_result']: 'skipped', claimed_at: null }).eq('user_id', userId)
      return 'skipped:' + d.step + ':' + d.reason
    }

    const step = d.step
    const marketing = IS_MARKETING[step]
    // Boton del correo: mientras Stripe pueda recuperar el cobro, TODOS los correos van a la factura pendiente.
    // Si Stripe no responde, el correo espera (se revisa ANTES de tomar el turno del freno de marketing).
    const pay = await findPaymentLink(prof.stripe_customer_id || ep.stripe_customer_id)
    if (pay.state === 'unavailable') { await releaseClaim(userId); return 'wait:stripe_unavailable' }
    const payLink = pay.state === 'link' ? pay.url : null
    // Turno del freno global de marketing, reservado de forma ATOMICA igual que upgrade-nudge-emails, racha y
    // encuesta: si otra funcion lo tomo en el ultimo dia (aunque sea hace un segundo), este correo espera.
    let slotIso: string | null = null
    if (marketing) {
      slotIso = new Date().toISOString()
      const slotCutoff = new Date(Date.now() - (CFG.GLOBAL_BRAKE_HOURS * 60 - CFG.SLOT_TOLERANCE_MINUTES) * 60000).toISOString()
      const { data: slot } = await supabase
        .from('profiles')
        .update({ last_marketing_email_at: slotIso })
        .eq('id', userId)
        .or(`last_marketing_email_at.is.null,last_marketing_email_at.lt.${slotCutoff}`)
        .select('id')
      if (!slot || !slot.length) { await releaseClaim(userId); return 'wait:marketing_slot_taken' }
    }
    const content = contentFor(step, payLink)
    const name = cleanFirstName(prof.display_name)
    const greeting = name ? `Hola, ${name}.` : 'Hola.'
    let links: { page: string; oneClick: string } | null = null
    if (marketing) links = await unsubLinks(userId)
    const html = shell(greeting, content, links ? links.page : null)
    const ok = await sendMail(String(prof.email).trim(), content.subject, html, links ? links.oneClick : null)
    if (!ok) {
      // No salio nada: se devuelve el turno del freno global y se libera la reserva para reintentar.
      if (slotIso) {
        await supabase.from('profiles').update({ last_marketing_email_at: prof.last_marketing_email_at ?? null }).eq('id', userId).eq('last_marketing_email_at', slotIso)
      }
      await releaseClaim(userId)
      return 'send_failed:' + step
    }
    await supabase.from('payment_recovery').update({ [step + '_at']: new Date().toISOString(), [step + '_result']: 'sent', claimed_at: null }).eq('user_id', userId)
    return 'sent:' + step
  } catch (e) {
    console.error('Error procesando episodio de recuperación:', e)
    try { await releaseClaim(userId) } catch (_) { /* nada */ }
    return 'error'
  }
}

// Simulación: dice qué haría con cada episodio abierto, sin enviar ni escribir nada.
async function dryRun(): Promise<unknown> {
  const { data: eps } = await supabase.from('payment_recovery').select('*').is('closed_at', null).limit(CFG.BATCH)
  const out: unknown[] = []
  for (const ep of eps || []) {
    const prof = await readProfile(ep.user_id)
    const d = decide(ep, prof, Date.now(), true)
    let cta: string | null = null
    if (d.action === 'send') {
      const pay = await findPaymentLink(prof ? prof.stripe_customer_id || ep.stripe_customer_id : ep.stripe_customer_id)
      cta = pay.state === 'link' ? 'factura_pendiente' : pay.state === 'none' ? 'sitio_miembros' : 'esperaria_stripe_sin_respuesta'
    }
    out.push({
      user: String(ep.user_id).slice(0, 8),
      email_domain: prof && prof.email ? String(prof.email).split('@')[1] || null : null,
      started_at: ep.started_at,
      is_member: prof ? !!prof.is_member : null,
      decision: d,
      boton: cta,
    })
  }
  return { ok: true, dry_run: true, in_send_hour_now: isSendHour(Date.now()), episodes: out }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (!(await internalSecretOk(req.headers.get('x-internal-secret')))) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }
  try {
    let body: any = null
    try { body = await req.json() } catch (_) { body = null }
    if (body && body.dry_run === true) return json(await dryRun(), 200)

    const { data: eps, error } = await supabase.from('payment_recovery').select('user_id').is('closed_at', null).limit(CFG.BATCH)
    if (error) {
      console.error('Error leyendo payment_recovery:', error)
      return json({ ok: false, error: 'read_failed' }, 200)
    }
    const results: Record<string, number> = {}
    for (const e of eps || []) {
      const r = await processEpisode(e.user_id as string)
      const key = r.split(':').slice(0, 2).join(':')
      results[key] = (results[key] || 0) + 1
    }
    return json({ ok: true, episodes: (eps || []).length, results }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false, error: 'exception' }, 200)
  }
})
