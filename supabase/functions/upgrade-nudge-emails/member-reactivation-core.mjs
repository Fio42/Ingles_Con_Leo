// ============================================================
// Inglés con Leo - Reactivación de MIEMBROS DE PAGO inactivos (v2)
//
// Lógica pura (sin red, sin base de datos, sin Date.now): la usa la Edge
// Function upgrade-nudge-emails y la prueba tools/tests/member-
// reactivation.test.js. Está en un archivo aparte a propósito, para poder
// probar EL MISMO código que corre en producción y no una copia.
//
// Secuencia (por ciclo de inactividad, máximo 3 correos):
//   Correo 1: 14 días sin practicar.
//   Correo 2: 21 días después del 1 (día 35 de inactividad), si sigue igual.
//   Correo 3: 21 días después del 2 (día 56 de inactividad). Es el último.
// Si el alumno vuelve a practicar, el ciclo termina solo (los correos
// anteriores ya no cuentan porque son anteriores a su última práctica) y,
// si vuelve a quedar inactivo, empieza uno nuevo.
//
// REGLA ESTRICTA DE RENOVACIÓN (manda sobre todo lo demás): solo se envía
// si el proveedor de pago confirma EN ESTE MOMENTO una suscripción activa,
// con el último cobro pagado, sin cancelación programada ni pago pendiente,
// y con fecha de renovación conocida a MÁS de 5 días. Si la fecha ya pasó y
// el cobro nuevo no está confirmado, tampoco. Ante cualquier duda: no enviar.
// ============================================================

export const REACT = Object.freeze({
  FIRST_INACTIVE_DAYS: 14,
  STEP_GAP_DAYS: 21,
  MAX_PER_CYCLE: 3,
  RENEWAL_SILENCE_DAYS: 5,
  GLOBAL_GAP_DAYS: 14,
  SEND_HOUR_START: 8, // hora de Cancún, inclusive
  SEND_HOUR_END: 21, // hora de Cancún, exclusive (último envío 20:59)
  CANCUN_UTC_OFFSET_HOURS: -5,
})

const DAY = 86400000
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

export function toMs(v) {
  if (v === null || v === undefined || v === '') return null
  const t = typeof v === 'number' ? v : Date.parse(v)
  return Number.isFinite(t) ? t : null
}

// ---------------- Ventana horaria ----------------
export function isReactivationSendHour(nowMs) {
  const utcHour = new Date(nowMs).getUTCHours()
  const local = (utcHour + REACT.CANCUN_UTC_OFFSET_HOURS + 24) % 24
  return local >= REACT.SEND_HOUR_START && local < REACT.SEND_HOUR_END
}

// ---------------- Actividad real ----------------
// Actividad = la más reciente entre profiles.last_practice_at (la escribe
// el sitio al terminar una sesión) y la última fila de progress_sessions.
// Dos fuentes: si una falla o quedó vacía, la otra la respalda. Las visitas
// (last_seen_at) NO cuentan como práctica.
export function lastActivityMs(profile, lastSessionAt) {
  const a = toMs(profile && profile.last_practice_at)
  const b = toMs(lastSessionAt)
  if (a === null && b === null) return null
  return Math.max(a === null ? -Infinity : a, b === null ? -Infinity : b)
}

// returning     = ya practicó desde que es miembro.
// never_started = pagó y no ha practicado ni una vez desde que es miembro
//                 (una práctica de cuando era cuenta gratis no cuenta).
// Si no hay forma fiable de saberlo (sin member_since y sin actividad)
// devuelve kind null: no se asume inactividad con datos dudosos.
export function classifyMember(profile, lastActivity) {
  const since = toMs(profile && profile.member_since)
  if (lastActivity !== null && (since === null || lastActivity >= since)) {
    return { kind: 'returning', anchorMs: lastActivity }
  }
  if (since === null) return { kind: null, reason: 'activity_unreliable' }
  return { kind: 'never_started', anchorMs: since }
}

// ---------------- Ciclo ----------------
export const STEP_KEYS = ['member_react_1', 'member_react_2', 'member_react_3']

// Cuántos correos del ciclo ACTUAL se han mandado (0 a 3). Un correo solo
// cuenta si salió DESPUÉS del ancla (última práctica, o member_since si
// nunca empezó) y si el paso anterior también cuenta.
export function cycleState(lifecycle, anchorMs) {
  const lc = lifecycle || {}
  let n = 0
  let lastSentMs = null
  for (let i = 0; i < STEP_KEYS.length; i++) {
    const raw = lc[STEP_KEYS[i]]
    const t = typeof raw === 'string' && ISO_RE.test(raw) ? toMs(raw) : null
    if (t !== null && t > anchorMs) {
      n = i + 1
      lastSentMs = t
    } else break
  }
  return { n, lastSentMs }
}

// Correos de un ciclo que ya terminó porque el alumno volvió a practicar
// (para dejar constancia de que los envíos pendientes se cancelaron).
export function staleCycleEmails(lifecycle, anchorMs) {
  const lc = lifecycle || {}
  const out = []
  for (let i = 0; i < STEP_KEYS.length; i++) {
    const raw = lc[STEP_KEYS[i]]
    const t = typeof raw === 'string' && ISO_RE.test(raw) ? toMs(raw) : null
    if (t !== null && t <= anchorMs) out.push({ step: i + 1, sentMs: t })
  }
  return out
}

export function stepDue(n, lastSentMs, anchorMs, nowMs) {
  if (n >= REACT.MAX_PER_CYCLE) return { step: null, reason: 'cycle_complete' }
  if (n === 0) {
    const inactiveDays = (nowMs - anchorMs) / DAY
    return inactiveDays >= REACT.FIRST_INACTIVE_DAYS
      ? { step: 1 }
      : { step: null, reason: 'not_inactive_long_enough' }
  }
  return (nowMs - lastSentMs) / DAY >= REACT.STEP_GAP_DAYS
    ? { step: n + 1 }
    : { step: null, reason: 'waiting_next_step' }
}

// ---------------- Historial global de correos ----------------
// Último correo automático NO transaccional que recibió esta persona, sin
// importar el flujo: freno global, racha, encuesta, upgrade_email_1/2/3 y
// cualquier marca de fecha en lifecycle_emails (menos 'welcome', que es
// operacional, y los contadores *_count, que no son fechas).
export function lastNonTransactionalEmailMs(profile) {
  const p = profile || {}
  const c = []
  const push = (v) => {
    const t = toMs(v)
    if (t !== null) c.push(t)
  }
  push(p.last_marketing_email_at)
  push(p.survey_15d_sent_at)
  push(p.upgrade_email_1_sent_at)
  push(p.upgrade_email_2_sent_at)
  push(p.upgrade_email_3_sent_at)
  if (typeof p.streak_reminder_last_sent === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.streak_reminder_last_sent)) {
    c.push(Date.parse(p.streak_reminder_last_sent + 'T23:59:59Z')) // conservador: fin del día
  }
  const lc = p.lifecycle_emails || {}
  for (const k of Object.keys(lc)) {
    if (k === 'welcome' || k.endsWith('_count')) continue
    const v = lc[k]
    if (typeof v === 'string' && ISO_RE.test(v)) push(v)
  }
  return c.length ? Math.max(...c) : null
}

// ---------------- Fase 1: todo lo que se decide sin llamar al proveedor ----------------
// input: { profile, lastSessionAt, nowMs, ignoreHours? } (ignoreHours solo para la simulación)
// Devuelve { ok:true, kind, step, anchorMs, inactiveDays } o { ok:false, reason, loggable }.
// loggable = true cuando el correo "ya tocaba" y algo lo frenó (esas razones
// se guardan en la bitácora); false para ruido normal (sigue activo, etc.).
export function precheck(input) {
  const { profile, lastSessionAt, nowMs } = input
  const p = profile || {}
  if (!p.is_member) return { ok: false, reason: 'not_member', loggable: false }
  if (!p.email) return { ok: false, reason: 'no_email', loggable: false }
  if (p.email_opt_out_at) return { ok: false, reason: 'unsubscribed', loggable: false }
  if (p.email_invalid) return { ok: false, reason: 'email_invalid', loggable: false }

  const activity = lastActivityMs(p, lastSessionAt)
  const cls = classifyMember(p, activity)
  if (!cls.kind) return { ok: false, reason: cls.reason, loggable: true }

  const { n, lastSentMs } = cycleState(p.lifecycle_emails, cls.anchorMs)
  const due = stepDue(n, lastSentMs, cls.anchorMs, nowMs)
  const inactiveDays = (nowMs - cls.anchorMs) / DAY
  if (!due.step) {
    return { ok: false, reason: due.reason, loggable: false, kind: cls.kind }
  }

  // Desde aquí el correo YA TOCABA: cualquier freno se registra.
  const lastEmail = lastNonTransactionalEmailMs(p)
  if (lastEmail !== null && (nowMs - lastEmail) / DAY < REACT.GLOBAL_GAP_DAYS) {
    return { ok: false, reason: 'recent_email', loggable: true, kind: cls.kind, step: due.step }
  }
  if (!input.ignoreHours && !isReactivationSendHour(nowMs)) {
    return { ok: false, reason: 'outside_send_hours', loggable: false, kind: cls.kind, step: due.step }
  }
  return { ok: true, kind: cls.kind, step: due.step, anchorMs: cls.anchorMs, inactiveDays }
}

// ---------------- Proveedores de pago (se evalúa el JSON que devuelven) ----------------
// Cada evaluador devuelve { provider, state, reason, periodEndMs }:
//   state 'ok'       suscripción activa, cobro al día, fecha futura confiable
//   state 'inactive' el proveedor dice que ya no hay suscripción vigente
//   state 'blocked'  pago pendiente/fallido, cancelación programada, pausa,
//                    fecha desconocida o vencida, o no se pudo verificar
const NON_LIVE_STRIPE = new Set(['canceled', 'incomplete_expired'])

export function evaluateStripe(subs, nowMs) {
  const provider = 'stripe'
  if (!Array.isArray(subs)) return { provider, state: 'blocked', reason: 'provider_unavailable' }
  const live = subs.filter((s) => s && !NON_LIVE_STRIPE.has(s.status))
  if (!live.length) return { provider, state: 'inactive', reason: 'no_live_subscription' }
  let periodEndMs = Infinity
  for (const s of live) {
    if (s.status === 'past_due' || s.status === 'unpaid' || s.status === 'incomplete') {
      return { provider, state: 'blocked', reason: 'payment_failed_or_pending' }
    }
    if (s.status === 'paused' || s.pause_collection) return { provider, state: 'blocked', reason: 'paused' }
    if (s.status !== 'active') return { provider, state: 'blocked', reason: 'status_' + s.status }
    if (s.cancel_at_period_end || s.cancel_at) return { provider, state: 'blocked', reason: 'cancellation_scheduled' }
    const inv = s.latest_invoice
    if (!inv || typeof inv !== 'object') return { provider, state: 'blocked', reason: 'invoice_unverified' }
    if (inv.status !== 'paid') return { provider, state: 'blocked', reason: 'invoice_not_paid' }
    const endUnix =
      (s.items && s.items.data && s.items.data[0] && s.items.data[0].current_period_end) || s.current_period_end
    const end = typeof endUnix === 'number' ? endUnix * 1000 : null
    if (!end) return { provider, state: 'blocked', reason: 'no_renewal_date' }
    periodEndMs = Math.min(periodEndMs, end)
  }
  return { provider, state: 'ok', periodEndMs }
}

export function evaluatePaypal(sub, nowMs) {
  const provider = 'paypal'
  if (!sub || typeof sub !== 'object' || !sub.status) return { provider, state: 'blocked', reason: 'provider_unavailable' }
  const st = String(sub.status).toUpperCase()
  if (st === 'CANCELLED' || st === 'EXPIRED') return { provider, state: 'inactive', reason: 'status_' + st.toLowerCase() }
  if (st !== 'ACTIVE') return { provider, state: 'blocked', reason: 'status_' + st.toLowerCase() }
  const bi = sub.billing_info || {}
  if (Number(bi.failed_payments_count || 0) > 0) return { provider, state: 'blocked', reason: 'payment_failed_or_pending' }
  const owed = bi.outstanding_balance && Number(bi.outstanding_balance.value)
  if (Number.isFinite(owed) && owed > 0) return { provider, state: 'blocked', reason: 'payment_failed_or_pending' }
  if (!bi.last_payment || !bi.last_payment.time) return { provider, state: 'blocked', reason: 'no_payment_recorded' }
  const end = toMs(bi.next_billing_time)
  if (end === null) return { provider, state: 'blocked', reason: 'no_renewal_date' }
  return { provider, state: 'ok', periodEndMs: end }
}

export function evaluateMp(pre, nowMs) {
  const provider = 'mercadopago'
  if (!pre || typeof pre !== 'object' || !pre.status) return { provider, state: 'blocked', reason: 'provider_unavailable' }
  if (pre.status === 'cancelled') return { provider, state: 'inactive', reason: 'status_cancelled' }
  if (pre.status !== 'authorized') return { provider, state: 'blocked', reason: 'status_' + pre.status }
  const sm = pre.summarized || {}
  if (Number(sm.pending_charge_quantity || 0) > 0 || Number(sm.pending_charge_amount || 0) > 0) {
    return { provider, state: 'blocked', reason: 'payment_failed_or_pending' }
  }
  const end = toMs(pre.next_payment_date)
  if (end === null) return { provider, state: 'blocked', reason: 'no_renewal_date' }
  return { provider, state: 'ok', periodEndMs: end }
}

// Une los resultados de todos los proveedores que tenga la persona.
// Cualquier 'blocked' bloquea; hace falta al menos un 'ok'; la fecha que
// manda es la MÁS cercana.
export function combineBilling(results) {
  if (!results || !results.length) return { state: 'blocked', reason: 'no_paid_subscription', results: [] }
  const blocked = results.find((r) => r.state === 'blocked')
  if (blocked) return { state: 'blocked', reason: blocked.reason, results }
  const oks = results.filter((r) => r.state === 'ok')
  if (!oks.length) return { state: 'blocked', reason: 'no_paid_subscription', results }
  return { state: 'ok', periodEndMs: Math.min(...oks.map((r) => r.periodEndMs)), results }
}

// Regla de los 5 días y del cobro sin confirmar. Devuelve null si se puede
// enviar, o el motivo del bloqueo.
export function renewalGate(periodEndMs, nowMs) {
  if (periodEndMs === null || periodEndMs === undefined) return 'no_renewal_date'
  if (periodEndMs <= nowMs) return 'renewal_unconfirmed'
  if ((periodEndMs - nowMs) / DAY <= REACT.RENEWAL_SILENCE_DAYS) return 'renewal_window'
  return null
}

// ---------------- Fase 2: decisión final con el resultado del proveedor ----------------
export function finalize(pre, billing, nowMs) {
  if (!pre.ok) return { send: false, reason: pre.reason }
  if (!billing || billing.state !== 'ok') return { send: false, reason: (billing && billing.reason) || 'no_paid_subscription' }
  const gate = renewalGate(billing.periodEndMs, nowMs)
  if (gate) return { send: false, reason: gate }
  return { send: true, step: pre.step, kind: pre.kind }
}

// ---------------- Contenido de los 3 correos ----------------
const P = 'color:#333; font-size:15px; line-height:1.6;'
const BOX =
  'background-color:#f1f4fe; border-left:4px solid #253ECC; border-radius:8px; padding:14px 16px; margin:18px 0; color:#333; font-size:15px; line-height:1.6;'
const UL = 'color:#333; font-size:15px; line-height:1.6; padding-left:20px; margin:14px 0;'
const LI = 'margin-bottom:8px;'

const SKILL_LABELS = {
  gramatica: 'gramática',
  vocabulario: 'vocabulario',
  listening: 'listening',
  speaking: 'speaking',
  writing: 'writing',
}
export function skillLabel(skill) {
  return Object.prototype.hasOwnProperty.call(SKILL_LABELS, skill) ? SKILL_LABELS[skill] : null
}

function utm(url, step) {
  return url + (url.includes('?') ? '&' : '?') + 'utm_source=email&utm_medium=reactivacion&utm_campaign=member_react_' + step
}

// ctx: { site, kind, step, skill (clave de progress_sessions o null),
//        mistakes (número de errores activos o null), leoAi (boolean) }
export function buildContent(ctx) {
  const site = ctx.site
  const never = ctx.kind === 'never_started'
  const sk = skillLabel(ctx.skill)
  const mistakes = Number.isInteger(ctx.mistakes) && ctx.mistakes > 0 ? ctx.mistakes : 0
  const footer = '¿Dudas o algo no te funciona? Responde este correo, lo leo yo.'

  if (ctx.step === 1) {
    const body = never
      ? `
    <p style="${P}">
      Tu cuenta ya está lista y solo falta la parte más fácil: tu primera sesión.
      No necesitas estudiar una hora. Con cinco minutos ya empiezas.
    </p>
    <div style="${BOX}">
      Elige una habilidad que te llame la atención, resuelve unos ejercicios y ya
      habrás arrancado. Después puedes seguir a tu ritmo.
    </div>`
      : `
    <p style="${P}">
      No necesitas estudiar una hora para retomar el hábito. Una sesión corta de
      cinco minutos es suficiente para volver a entrar en ritmo.
    </p>
    <div style="${BOX}">
      ${sk ? `La última vez practicaste ${sk}. Puedes empezar por ahí, con unos pocos ejercicios.` : 'Elige una habilidad, resuelve unos pocos ejercicios y listo. Sin prisa y sin presión.'}
    </div>`
    return {
      subject: '¿Practicamos inglés cinco minutos?',
      preheader: never ? 'Tu primera sesión puede durar solo cinco minutos.' : 'Una sesión corta es suficiente para retomar el hábito.',
      greeting: '¡Hola! 👋',
      title: never ? 'Tu primera sesión puede durar cinco minutos' : 'Solo necesitas cinco minutos',
      titleWithName: never ? '{name}, tu primera sesión puede durar cinco minutos' : '{name}, solo necesitas cinco minutos',
      bodyHtml: body,
      ctaText: never ? 'Empezar mi primera práctica' : 'Retomar mi práctica',
      ctaUrl: utm(site + '/practica-miembros.html', 1),
      footerNote: footer,
    }
  }

  if (ctx.step === 2) {
    const items = []
    items.push(
      `<li style="${LI}"><strong>Plan de estudio:</strong> se arma con tu nivel, tu progreso y tus errores más frecuentes, para que no tengas que decidir por dónde empezar.</li>`
    )
    if (mistakes) {
      items.push(
        `<li style="${LI}"><strong>Repaso de errores:</strong> tienes ${mistakes} ${mistakes === 1 ? 'error guardado' : 'errores guardados'} para repasar con una sesión rápida.</li>`
      )
    } else {
      items.push(
        `<li style="${LI}"><strong>Repaso de errores:</strong> los ejercicios que fallas se guardan para que los repases con calma en una sesión rápida.</li>`
      )
    }
    if (ctx.leoAi) {
      items.push(
        `<li style="${LI}"><strong>Leo AI:</strong> después de contestar, el botón "Explícame por qué" te explica tu error en español sencillo.</li>`
      )
    } else {
      items.push(
        `<li style="${LI}"><strong>Cinco habilidades:</strong> gramática, vocabulario, listening, speaking y writing, para practicar lo que más necesites.</li>`
      )
    }
    return {
      subject: 'Hay más formas de practicar tu inglés',
      preheader: 'Tu plan de estudio, el repaso de errores y más te están esperando.',
      greeting: '¡Hola! 👋',
      title: 'Lo que ya tienes disponible',
      titleWithName: '{name}, mira lo que ya tienes disponible',
      bodyHtml: `
    <p style="${P}">
      ${never ? 'Tu cuenta incluye varias formas de practicar, y todas empiezan con pocos minutos.' : 'Por si te sirve, esto es lo que puedes aprovechar hoy en tu cuenta.'}
    </p>
    <ul style="${UL}">${items.join('')}</ul>
    <p style="${P}">
      Empieza por el plan de estudio: te dice qué practicar sin que tengas que pensarlo.
    </p>`,
      ctaText: 'Explorar mi plan de estudio',
      ctaUrl: utm(site + '/plan-estudio.html', 2),
      footerNote: footer,
    }
  }

  // step 3
  return {
    subject: 'Tu próximo paso puede ser muy sencillo',
    preheader: 'Unos pocos ejercicios bastan para recuperar el ritmo.',
    greeting: '¡Hola! 👋',
    title: 'Avanzar no tiene que ser todo de golpe',
    titleWithName: '{name}, avanzar no tiene que ser todo de golpe',
    bodyHtml: `
    <p style="${P}">
      ${never ? 'No tienes que hacer nada especial para empezar.' : 'No tienes que ponerte al día con nada.'}
      Lo único que cuenta es el siguiente paso, y puede ser muy pequeño.
    </p>
    <div style="${BOX}">
      Tu paso de hoy: ${sk && !never ? `abre ${sk}` : 'elige una habilidad'}, resuelve unos pocos ejercicios y cierra. Eso ya cuenta.
    </div>
    <p style="${P}">
      Este es el último correo de esta serie, así que no te escribiré más sobre esto.
      Tu cuenta sigue aquí para cuando quieras ${never ? 'empezar' : 'volver'}.
    </p>`,
    ctaText: never ? 'Hacer mi primera sesión' : 'Continuar aprendiendo',
    ctaUrl: utm(site + '/practica-miembros.html', 3),
    footerNote: footer,
  }
}
