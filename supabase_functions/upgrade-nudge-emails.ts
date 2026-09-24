// ============================================================
// Inglés con Leo — Edge Function: upgrade-nudge-emails
//
// OJO: el nombre del archivo/función en Supabase se dejó igual a
// propósito (para que NO haga falta crear una función nueva ni un
// Cron nuevo: se reutiliza exactamente el mismo deploy y el mismo
// Cron de cada 30 minutos que ya tenías). Pero su alcance creció:
// antes solo mandaba 3 correos de "hazte miembro" a los 30min/2d/7d.
// Ahora es el sistema completo de correos automáticos del ciclo de
// vida de una cuenta gratis (is_member = false): bienvenida,
// recordatorios de práctica, descubrir funciones, y solo AL FINAL
// la membresía. Ver el chat para la explicación completa del
// porqué del cambio (el nuevo modelo es "cuenta gratis primero",
// no "cuenta gratis = quiere pagar").
//
// ------------------------------------------------------------
// QUÉ CORREOS EXISTEN Y CUÁNDO SE DISPARAN (todo con is_member =
// false; en cuanto alguien paga, deja de calificar para CUALQUIERA
// de estos automáticamente, porque cada uno vuelve a revisar
// is_member justo antes de mandar):
//
//  Por calendario (según profiles.created_at). Cada uno es
//  "elegible DESDE" ese momento: si un correo de mayor prioridad le
//  gana el turno el día que le tocaba, no se pierde, se queda
//  pendiente y sale en cuanto pueda. PERO cada uno (menos
//  membership_intro) también tiene un plazo máximo ("caduca"): si
//  para entonces sigue sin mandarse, se marca 'skipped' en
//  lifecycle_emails (registrado como decisión, no como error) y ya
//  no se vuelve a ofrecer, para no mandarlo semanas después fuera de
//  contexto (ver la sección "Caducidad/catch-up" más abajo):
//   - welcome            En cuanto se crea la cuenta. "Tu cuenta
//                        está lista" + llevar a practicar. NO vende
//                        membresía, y NO cuenta para el freno de
//                        24h (ver más abajo), así que nunca le tapa
//                        el paso a abandoned_signup. No caduca (se
//                        manda apenas la cuenta existe, así que
//                        nunca llega tarde).
//   - day1               Elegible desde 20 horas después de crear
//                        la cuenta. Invita a volver a practicar.
//                        Caduca (se marca 'skipped') a los 4 días.
//   - day3               Elegible desde 3 días después. Muestra una
//                        función que tal vez no ha usado (English
//                        Rush). Caduca a los 7 días.
//   - membership_intro   Elegible desde 7 días después. Primera vez
//                        que se presenta la membresía de $2 USD/mes.
//                        NO caduca: hablar de la membresía sigue
//                        siendo útil sin importar cuánto pase.
//   - reactivation_day14 Elegible desde 14 días después. "¿Sigues
//                        practicando inglés?" (no es principalmente
//                        venta). Caduca a los 45 días.
//   - final_onboarding   Elegible desde 30 días después. Última
//                        función a descubrir + mención suave de
//                        membresía. Caduca a los 75 días.
//   - long_term          Después del día 30 (actualización
//                        2026-09-24, pedido de Leo): un correo cada
//                        LONG_TERM_INTERVAL_DAYS (21 días), rotando
//                        por la lista LONG_TERM_EMAILS (un tip útil +
//                        invitación a practicar; solo algunos
//                        mencionan la membresía, y siempre suave).
//                        Empieza 21 días después de final_onboarding
//                        (o desde el día 51 si final_onboarding
//                        caducó sin mandarse). Cada correo de la lista
//                        se manda una sola vez por persona (se lleva
//                        la cuenta en lifecycle_emails.long_term_count);
//                        cuando se acaba la lista, se detiene. Para
//                        seguir más tiempo basta con agregar correos
//                        nuevos al final de LONG_TERM_EMAILS: la gente
//                        que ya terminó la lista los recibe solos.
//                        Se detiene también si la persona lleva más de
//                        LONG_TERM_SUNSET_DAYS (180) días sin entrar
//                        a la página, para no insistirle a quien ya no
//                        abre nada (eso daña la reputación del
//                        remitente y manda todo a spam).
//
//  Por comportamiento (no dependen del día, dependen de lo que hace
//  cada quien):
//   - abandoned_signup   30-180 min después de crear la cuenta,
//                        SOLO si todavía no hizo ni un ejercicio
//                        (profiles.free_first_exercise_at sigue
//                        NULL). Un recordatorio suave, una sola vez.
//                        Como welcome no consume el freno de 24h,
//                        este SÍ puede mandarse el mismo día que
//                        welcome, unas horas después.
//   - reactivation_3d    Ya había practicado antes, pero lleva 3+
//                        días sin entrar (profiles.last_seen_at).
//                        Con cooldown: no se repite antes de que
//                        haya vuelto a entrar Y vuelto a estar
//                        inactivo otra vez.
//   - limit_reached      3-36 horas después de llegar a su límite
//                        diario de ejercicios (lo detecta el propio
//                        navegador y lo guarda en
//                        profiles.free_daily_limit_reached_at). Con
//                        cooldown de varios días: no le llega cada
//                        vez que toca el límite, solo de vez en
//                        cuando.
//   - checkout_abandoned Empezó un checkout (Stripe/PayPal/Mercado
//                        Pago) pero no completó el pago
//                        (profiles.checkout_started_at, que YA
//                        existía y lo pone el propio webhook del
//                        checkout, nunca el simple hecho de visitar
//                        una página: es una señal real, no
//                        inventada). Con cooldown largo.
//   - active_free_pitch  DESACTIVADO por ahora (ver
//                        ACTIVE_FREE_PITCH_ENABLED más abajo: la
//                        lógica queda lista en el código pero no se
//                        manda nada de este tipo todavía). La idea,
//                        cuando se active: cuenta gratis con 10+
//                        días de antigüedad que sigue entrando
//                        seguido y ya practicó alguna vez, pero
//                        sigue sin ser miembro.
//
// ------------------------------------------------------------
// PRIORIDAD Y ANTI-SPAM (muy importante, ver pedido de Leo):
//  - Nadie recibe más de UNO de estos correos por corrida (cada
//    usuario, como mucho, un correo por pasada del Cron).
//  - Nadie recibe más de un correo de este sistema en un lapso de
//    MARKETING_EMAIL_MIN_GAP_HOURS (24h por default), sin importar
//    cuántas condiciones distintas le apliquen ese día. EXCEPCIÓN:
//    "welcome" no cuenta para este freno (ni lo consume al
//    mandarse, ni se bloquea por él), porque es un correo
//    inicial/operacional, no de marketing. Esto tampoco afecta a
//    los correos transaccionales (bienvenida de pago, recuperar
//    contraseña, avisos de comentarios): esos son funciones de
//    Supabase totalmente aparte y no se tocaron.
//  - Si a alguien le aplican varias condiciones a la vez, se manda
//    solo la de mayor prioridad (ver PRIORITY_ORDER más abajo):
//      0) welcome (siempre que aplique, va primero y aparte del
//         freno de 24h)
//      1) limite gratuito alcanzado
//      2) reactivación por abandono (recién creó cuenta sin
//         practicar, o llevaba practicando y dejó de entrar)
//      3) secuencia de onboarding por calendario (day1, day3,
//         membership_intro, reactivation_day14, final_onboarding),
//         sin techo: si algo de mayor prioridad le gana el turno,
//         se queda pendiente para la siguiente pasada, nunca
//         desaparece.
//      4) promoción de membresía "porque sí" (checkout abandonado;
//         "usuario gratis muy activo" existe en el código pero está
//         apagado, ver ACTIVE_FREE_PITCH_ENABLED)
//  - Cada correo se manda UNA sola vez (o con su propio cooldown si
//    es de los que se pueden repetir), y se registra en
//    profiles.lifecycle_emails (una columna jsonb: una sola
//    columna nueva sirve para todos los tipos de correo, en vez de
//    tener que agregar una columna por cada correo nuevo que se te
//    ocurra más adelante).
//
// ------------------------------------------------------------
// PENDIENTE (a propósito NO implementado todavía, falta info o lo
// pediste para después):
//  - (Hecho 2026-09-24: correos después del día 30, ver long_term.)
//    Si hay una novedad puntual que avisar a todos (una sección
//    nueva, por ejemplo), eso sigue siendo un correo aparte.
//  - "Continuar donde lo dejaste" con el ejercicio exacto: hoy no
//    existe ningún registro en Supabase de qué ejercicio exacto
//    veía una cuenta gratis (el progreso de cuentas gratis vive
//    nada más como contador del día, no como sesión guardada; eso
//    solo existe para Miembros, en progress_sessions). Por eso los
//    correos de cuenta gratis invitan a "seguir practicando" en
//    general, no a un ejercicio puntual. Si más adelante quieres
//    eso, hay que guardar el progreso de cuentas gratis en Supabase
//    también (cambio más grande, no lo hice porque no se pidió).
//
// ------------------------------------------------------------
// MIEMBROS INACTIVOS (is_member=true) — Actualización 2026-09-22:
// además de todo lo de arriba (que es solo para cuentas gratis), hay
// 2 correos aparte para miembros que llevan varios días sin entrar.
// NO venden nada (no mencionan pagos/renovación/membresía): solo
// invitan a volver a practicar. Lógica en decideMemberEmail() (no en
// decideEmail(), que es solo cuentas gratis):
//   - member_reactivation_3d   ~3 días sin actividad
//                              (profiles.last_seen_at).
//   - member_reactivation_10d ~10 días sin actividad. Es el ÚLTIMO:
//                              no hay día 15/20/25.
//   - Cada uno se manda como mucho una vez POR EPISODIO real de
//     inactividad: si vuelve a entrar (last_seen_at avanza) y luego
//     vuelve a estar inactivo, cuenta como episodio nuevo y puede
//     recibir los 2 otra vez.
//   - Zona de silencio: no se manda ninguno de los 2 si
//     profiles.next_renewal_at cae entre 3 días antes y 2 días
//     después de "ahora" (para no hacer pensar en el cobro justo
//     antes/después de que pase). Si next_renewal_at es NULL (no se
//     pudo conseguir del proveedor de pago, ver nota de cada webhook)
//     esa cuenta no tiene zona de silencio: sigue recibiendo los
//     recordatorios normal.
//   - Comparte el freno global de 24h (last_marketing_email_at) con
//     el resto del sistema, pero no compite en prioridad con nada de
//     lo de arriba: son consultas y bucles completamente aparte, así
//     que no pueden desplazar ni ser desplazados por la lógica de
//     cuentas gratis.
//
// ------------------------------------------------------------
// Reutiliza exactamente el mismo Resend y el mismo remitente
// (hola@inglesconleo.com) que ya usan los demás correos del sitio.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets), las
// mismas que ya tenías puestas para esta función:
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key.
//   RESEND_API_KEY             la misma que ya usan los demás
//                              correos del sitio.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
const REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'
const SITE = 'https://inglesconleo.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ---- Baja de correos (ver email-unsubscribe.ts) ----
// Misma firma que en email-unsubscribe.ts: si cambias una, cambia las
// dos (y la de streak-reminder-email.ts).
const UNSUB_PAGE = 'https://inglesconleo.com/baja.html'
async function unsubToken(userId: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(SUPABASE_SERVICE_ROLE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode('unsub:' + userId)))
  return Array.from(sig).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}
async function unsubLinks(userId: string): Promise<{ page: string; oneClick: string }> {
  const t = await unsubToken(userId)
  const qs = `u=${encodeURIComponent(userId)}&t=${t}`
  return {
    page: `${UNSUB_PAGE}?${qs}`,
    oneClick: `${SUPABASE_URL}/functions/v1/email-unsubscribe?${qs}`,
  }
}

// OJO: este número tiene que ser el mismo que FREE_USER_DAILY_LIMIT
// en app.js. Viven en dos archivos distintos (uno corre en el
// navegador, este corre en Supabase) así que si cambias el límite
// diario de ejercicios en un lado, cámbialo también aquí.
const FREE_USER_DAILY_LIMIT = 20

// ---------------- Configuración centralizada ----------------
// Todos los tiempos y cooldowns importantes están aquí. Para
// ajustar cuándo se manda cada correo, este es el único lugar que
// hace falta tocar.

// Calendario (en base a profiles.created_at). Cada uno es "elegible
// DESDE" ese momento y se queda pendiente (candidato en cada pasada
// del Cron) hasta que se manda de verdad: si un correo de mayor
// prioridad le gana el turno un día, no desaparece, simplemente se
// manda en la siguiente pasada donde nada más le gane. Una vez
// mandado, lifecycle_emails evita que se repita.
//
// PERO: para que esto no forme una cola de correos de onboarding
// viejos (que un día le lleguen todos seguidos a una cuenta de 3
// semanas como si acabara de registrarse), cada uno también tiene un
// "SKIP_AFTER_DAYS": si para entonces todavía no se mandó, se marca
// como 'skipped' en lifecycle_emails (queda registrado que se
// decidió NO mandarlo, no que se perdió) y ya no se vuelve a
// considerar. day1/day3 son los que "caducan" más rápido, porque su
// contenido habla de "acabas de crear tu cuenta" y no tiene sentido
// semanas después. membership_intro NO tiene vencimiento: hablar de
// la membresía sigue siendo útil sin importar cuánto tiempo pase.
const DAY1_MIN_HOURS = 20
const DAY1_SKIP_AFTER_DAYS = 4
const DAY3_MIN_DAYS = 3
const DAY3_SKIP_AFTER_DAYS = 7
const MEMBERSHIP_EMAIL_MIN_DAY = 7
// (sin SKIP_AFTER: membership_intro no caduca, ver nota arriba)
const REACTIVATION_EMAIL_MIN_DAY = 14
const REACTIVATION_EMAIL_SKIP_AFTER_DAYS = 45
const FINAL_ONBOARDING_MIN_DAY = 30
const FINAL_ONBOARDING_SKIP_AFTER_DAYS = 75
// Después del día 30 (ver "long_term" en la nota de arriba):
const LONG_TERM_INTERVAL_DAYS = 21
const LONG_TERM_SUNSET_DAYS = 180

// Las 4 claves de la secuencia por calendario que SÍ pueden caducar
// (con su plazo), en el mismo orden en que se revisan. Se usa para
// no repetir la misma lista dos veces en el código.
const EXPIRABLE_SCHEDULE: { key: EmailKeyScheduled; skipAfterDays: number }[] = [
  { key: 'day1', skipAfterDays: DAY1_SKIP_AFTER_DAYS },
  { key: 'day3', skipAfterDays: DAY3_SKIP_AFTER_DAYS },
  { key: 'reactivation_day14', skipAfterDays: REACTIVATION_EMAIL_SKIP_AFTER_DAYS },
  { key: 'final_onboarding', skipAfterDays: FINAL_ONBOARDING_SKIP_AFTER_DAYS },
]

// Comportamiento:
const ABANDONED_SIGNUP_MIN_MINUTES = 30
const ABANDONED_SIGNUP_MAX_MINUTES = 180
const INACTIVE_USER_DAYS = 3
const INACTIVE_REACTIVATION_COOLDOWN_DAYS = 10
const LIMIT_REACHED_MIN_HOURS = 3
const LIMIT_REACHED_MAX_HOURS = 36
const LIMIT_REACHED_COOLDOWN_DAYS = 7
const CHECKOUT_ABANDONED_MIN_HOURS = 20
const CHECKOUT_ABANDONED_MAX_HOURS = 96
const CHECKOUT_ABANDONED_COOLDOWN_DAYS = 14
const ACTIVE_FREE_USER_MIN_DAYS_SINCE_SIGNUP = 10
const ACTIVE_FREE_USER_LAST_SEEN_MAX_DAYS = 2
const ACTIVE_FREE_USER_COOLDOWN_DAYS = 14

// "active_free_pitch" (correo de venta recurrente a cuentas gratis
// muy activas) queda con la lógica lista pero APAGADO por ahora: no
// se manda nada de este tipo hasta que se ponga en true. Primero se
// quiere medir cómo funcionan onboarding, reactivación, límite
// gratuito, checkout abandonado y el correo de membresía del día 7.
const ACTIVE_FREE_PITCH_ENABLED = false

// Anti-spam global: como mucho un correo de este sistema por
// usuario en este lapso, sin importar qué tipo sea. EXCEPCIÓN:
// "welcome" es un correo inicial/operacional (confirma que la
// cuenta está lista) y no cuenta para este freno, ni al mandarse ni
// al revisarlo: así no le tapa el paso a abandoned_signup unas
// horas después si de verdad no practicó. Los correos
// transaccionales del sitio (recuperar contraseña, bienvenida de
// pago, avisos de comentarios) tampoco cuentan, pero eso es porque
// viven en funciones de Supabase totalmente aparte, ni pasan por
// aquí.
const MARKETING_EMAIL_MIN_GAP_HOURS = 24
const NO_COOLDOWN_KEYS = new Set(['welcome'])

// ---------------- Miembros inactivos (is_member=true) ----------------
// Estos correos NO venden nada: solo invitan a volver a practicar.
// Van por fuera de decideEmail()/PRIORITY_ORDER (que son para cuentas
// gratis) porque su lógica es más chica y separada: ver
// decideMemberEmail() más abajo. Máximo 2 por episodio real de
// inactividad (día 3 y día 10); si vuelve a entrar y luego vuelve a
// dejar de entrar, es un episodio nuevo y puede recibir los 2 otra
// vez (se detecta comparando last_seen_at contra la fecha en que se
// mandó cada uno, igual que ya hace reactivation_3d para cuentas
// gratis).
const MEMBER_REACTIVATION_3D_MIN_DAYS = 3
const MEMBER_REACTIVATION_10D_MIN_DAYS = 10

// Zona de silencio alrededor del cobro mensual: no mandar ninguno de
// los 2 correos de arriba si next_renewal_at cae dentro de este
// rango (desde X días antes hasta Y días después). Si next_renewal_at
// es NULL (no se pudo conseguir una fecha confiable del proveedor de
// pago), esta zona simplemente no se aplica para esa cuenta: sigue
// recibiendo los recordatorios normalmente. No se pierde el correo
// por caer en la zona de silencio: se reintenta en cada pasada del
// Cron (cada 30 min) y sale en cuanto ya no esté en la zona,
// mientras las demás condiciones sigan cumpliéndose.
const MEMBER_RENEWAL_SILENCE_BEFORE_DAYS = 3
const MEMBER_RENEWAL_SILENCE_AFTER_DAYS = 2

const MAX_PER_RUN = 300

// Orden de prioridad: si a alguien le aplican varias condiciones el
// mismo momento, se manda solo la primera de esta lista que
// aplique. (Ver la nota larga arriba del archivo.)
const PRIORITY_ORDER = [
  'limit_reached',
  'abandoned_signup',
  'reactivation_3d',
  'welcome',
  'day1',
  'day3',
  'membership_intro',
  'reactivation_day14',
  'final_onboarding',
  'long_term',
  'checkout_abandoned',
  'active_free_pitch',
  // Los siguientes dos son para MIEMBROS (is_member=true), no para
  // cuentas gratis: viven en esta misma lista solo para que el modo
  // manual de prueba (manual_emails + which) los reconozca como
  // válidos. Su lógica de decisión es aparte (ver decideMemberEmail
  // más abajo), no pasan por decideEmail ni compiten en prioridad con
  // los de arriba.
  'member_reactivation_3d',
  'member_reactivation_10d',
] as const
type EmailKey = (typeof PRIORITY_ORDER)[number]

// Las 2 claves de arriba que son de miembros en vez de cuentas
// gratis: se usan para que sendIfStillEligible() sepa que este
// correo requiere is_member=true (en vez de false, como todos los
// demás), y para que el modo manual de prueba busque el perfil
// correcto.
const MEMBER_ONLY_KEYS = new Set<EmailKey>(['member_reactivation_3d', 'member_reactivation_10d'])

// Subconjunto de EmailKey: solo las 4 claves de la secuencia por
// calendario que pueden "caducar" y marcarse 'skipped' (ver
// EXPIRABLE_SCHEDULE arriba). membership_intro queda fuera a
// propósito: nunca caduca.
type EmailKeyScheduled = 'day1' | 'day3' | 'reactivation_day14' | 'final_onboarding'

type Profile = {
  id: string
  email: string | null
  is_member: boolean
  created_at: string
  last_seen_at: string | null
  checkout_started_at: string | null
  free_daily_count: number | null
  free_daily_date: string | null
  free_first_exercise_at: string | null
  free_daily_limit_reached_at: string | null
  lifecycle_emails: Record<string, string> | null
  last_marketing_email_at: string | null
  display_name?: string | null
  next_renewal_at: string | null
}

Deno.serve(async (req: Request) => {
  try {
    // Modo manual (botón "Test" de Supabase o una prueba puntual tuya,
    // NO lo usa el Cron): si el cuerpo trae "manual_emails" y "which",
    // manda ESE correo a esos correos exactos, sin mirar ventanas de
    // tiempo, cooldown, ni (para los 2 de miembros) la zona de
    // silencio de renovación. Para los 11 correos de cuenta gratis
    // sigue revisando is_member=false antes de mandar; para los 2 de
    // miembros (MEMBER_ONLY_KEYS) revisa is_member=true en vez de
    // false. Sigue registrando el envío en lifecycle_emails, para no
    // duplicar después.
    try {
      const body = await req.json()
      if (body && Array.isArray(body.manual_emails) && body.manual_emails.length && body.which) {
        const which = String(body.which) as EmailKey
        if (!PRIORITY_ORDER.includes(which)) {
          return json({ ok: false, error: 'which invalido. Usa uno de: ' + PRIORITY_ORDER.join(', ') }, 200)
        }
        const wantsMember = MEMBER_ONLY_KEYS.has(which)
        let sentManual = 0
        for (const email of body.manual_emails) {
          if (typeof email !== 'string' || !email) continue
          const { data: prof } = await supabase.from('profiles').select('id, is_member').eq('email', email).maybeSingle()
          if (!prof || prof.is_member !== wantsMember) continue
          const didSend = await sendIfStillEligible(prof.id, email, which, wantsMember)
          if (didSend) sentManual++
        }
        return json({ ok: true, manual: true, which, sentManual }, 200)
      }
    } catch (_e) {
      // Sin cuerpo JSON (o vacío): seguimos con el modo automático normal.
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(
        'id, email, is_member, created_at, last_seen_at, checkout_started_at, free_daily_count, free_daily_date, free_first_exercise_at, free_daily_limit_reached_at, lifecycle_emails, last_marketing_email_at'
      )
      .eq('is_member', false)
      .not('email', 'is', null)
      .is('email_opt_out_at', null)
      .limit(MAX_PER_RUN)
    if (error) {
      console.error('Error buscando cuentas gratis:', error)
      return json({ ok: false }, 200)
    }

    const now = Date.now()
    const counts: Record<string, number> = {}

    for (const p of (profiles || []) as Profile[]) {
      // Antes de decidir, revisar si algún correo de la secuencia por
      // calendario ya "caducó" (pasó su SKIP_AFTER_DAYS) sin haberse
      // mandado. Si sí, se marca 'skipped' en lifecycle_emails (una sola
      // escritura ligera, sin mandar correo y sin tocar
      // last_marketing_email_at) ANTES de llamar a decideEmail, para que
      // esta misma pasada ya no lo vuelva a ofrecer.
      const expiredKeys = findNewlyExpiredKeys(p, now)
      if (expiredKeys.length) {
        p.lifecycle_emails = await markExpiredAsSkipped(p.id, p.lifecycle_emails || {}, expiredKeys)
      }

      const key = decideEmail(p, now)
      if (!key) continue
      const didSend = await sendIfStillEligible(p.id, p.email, key)
      if (didSend) counts[key] = (counts[key] || 0) + 1
    }

    // ---- Segunda pasada, aparte: miembros inactivos (is_member=true) ----
    // Consulta y bucle totalmente separados de los de arriba (cuentas
    // gratis): así la lógica existente de onboarding/límite/checkout
    // no se toca ni se puede ver afectada por esto. Ver
    // decideMemberEmail() y la nota larga de MEMBER_REACTIVATION_*
    // más arriba.
    const { data: memberProfiles, error: memberError } = await supabase
      .from('profiles')
      .select('id, email, is_member, last_seen_at, lifecycle_emails, last_marketing_email_at, next_renewal_at')
      .eq('is_member', true)
      .not('email', 'is', null)
      .is('email_opt_out_at', null)
      .not('last_seen_at', 'is', null)
      .limit(MAX_PER_RUN)
    if (memberError) {
      console.error('Error buscando miembros:', memberError)
      // No se corta todo el run por esto: los correos de cuentas
      // gratis de arriba ya se mandaron bien. Se devuelve lo que sí
      // se logró.
      return json({ ok: true, counts }, 200)
    }

    for (const p of (memberProfiles || []) as Profile[]) {
      const key = decideMemberEmail(p, now)
      if (!key) continue
      const didSend = await sendIfStillEligible(p.id, p.email, key, true)
      if (didSend) counts[key] = (counts[key] || 0) + 1
    }

    return json({ ok: true, counts }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false }, 200)
  }
})

// ---------------- Decidir qué correo (si acaso) le toca a alguien ----------------

function decideEmail(p: Profile, now: number): EmailKey | null {
  const lifecycle = p.lifecycle_emails || {}
  const ageMs = now - new Date(p.created_at).getTime()
  const ageMinutes = ageMs / 60000
  const ageHours = ageMs / 3600000
  const ageDays = ageMs / 86400000

  // 0) "welcome" va ANTES del freno global a propósito: es el correo
  // inicial de "tu cuenta está lista", no cuenta como marketing, y no
  // debe bloquear ni ser bloqueado por abandoned_signup (que sí puede
  // tocarle unas horas después, si de verdad no practicó).
  if (!lifecycle['welcome']) {
    return 'welcome'
  }

  // Anti-spam global: si ya recibió cualquier correo de este sistema
  // (que sí cuente para el freno, ver NO_COOLDOWN_KEYS) hace menos de
  // MARKETING_EMAIL_MIN_GAP_HOURS, no le toca nada más en esta
  // pasada, sin importar qué otra condición cumpla.
  if (p.last_marketing_email_at && hoursSince(p.last_marketing_email_at, now) < MARKETING_EMAIL_MIN_GAP_HOURS) {
    return null
  }

  // 1) Límite gratuito alcanzado: la señal más "caliente" de todas
  // (el usuario está usando la plataforma ahora mismo y chocó con el
  // límite), así que va primero.
  if (p.free_daily_limit_reached_at) {
    const hrs = hoursSince(p.free_daily_limit_reached_at, now)
    const lastSent = lifecycle['limit_reached']
    const cooldownOk = !lastSent || daysSince(lastSent, now) >= LIMIT_REACHED_COOLDOWN_DAYS
    // Solo cuenta si el límite se alcanzó DESPUÉS del último correo de
    // este tipo (si no, sería el mismo "toque de límite" de la vez
    // pasada, no uno nuevo).
    const isFreshHit = !lastSent || new Date(p.free_daily_limit_reached_at).getTime() > new Date(lastSent).getTime()
    if (hrs >= LIMIT_REACHED_MIN_HOURS && hrs <= LIMIT_REACHED_MAX_HOURS && cooldownOk && isFreshHit) {
      return 'limit_reached'
    }
  }

  // 2) Reactivación por abandono.
  //    2a) Creó cuenta y nunca hizo ni un ejercicio.
  if (!p.free_first_exercise_at && !lifecycle['abandoned_signup']) {
    if (ageMinutes >= ABANDONED_SIGNUP_MIN_MINUTES && ageMinutes <= ABANDONED_SIGNUP_MAX_MINUTES) {
      return 'abandoned_signup'
    }
  }
  //    2b) Ya había practicado, pero lleva varios días sin entrar.
  if (p.free_first_exercise_at && p.last_seen_at) {
    const inactiveDays = daysSince(p.last_seen_at, now)
    const lastSent = lifecycle['reactivation_3d']
    const cooldownOk = !lastSent || daysSince(lastSent, now) >= INACTIVE_REACTIVATION_COOLDOWN_DAYS
    // Solo si volvió a entrar (last_seen_at más nuevo) desde el último
    // envío: así no se repite el mismo correo por la misma ausencia.
    const cameBackSince = !lastSent || new Date(p.last_seen_at).getTime() > new Date(lastSent).getTime()
    if (inactiveDays >= INACTIVE_USER_DAYS && cooldownOk && cameBackSince) {
      return 'reactivation_3d'
    }
  }

  // 3) Secuencia de onboarding por calendario. "welcome" ya se
  // resolvió arriba (punto 0). Cada uno de estos es "elegible DESDE"
  // su día/hora, sin techo: si hoy no le toca por prioridad, sigue
  // pendiente y se manda en cuanto pueda (nunca desaparece).
  if (!lifecycle['day1'] && ageHours >= DAY1_MIN_HOURS) {
    return 'day1'
  }
  if (!lifecycle['day3'] && ageDays >= DAY3_MIN_DAYS) {
    return 'day3'
  }
  if (!lifecycle['membership_intro'] && ageDays >= MEMBERSHIP_EMAIL_MIN_DAY) {
    return 'membership_intro'
  }
  if (!lifecycle['reactivation_day14'] && ageDays >= REACTIVATION_EMAIL_MIN_DAY) {
    return 'reactivation_day14'
  }
  if (!lifecycle['final_onboarding'] && ageDays >= FINAL_ONBOARDING_MIN_DAY) {
    return 'final_onboarding'
  }

  // 3b) Después del día 30: un correo cada LONG_TERM_INTERVAL_DAYS,
  // rotando por LONG_TERM_EMAILS (ver nota "long_term" arriba).
  {
    const finalMark = lifecycle['final_onboarding']
    const sentCount = parseInt(lifecycle['long_term_count'] || '0', 10) || 0
    const lastActivity = p.last_seen_at || p.created_at
    const stillAround = daysSince(lastActivity, now) <= LONG_TERM_SUNSET_DAYS
    if (finalMark && sentCount < LONG_TERM_EMAILS.length && stillAround) {
      // Desde cuándo contar los 21 días: el último long_term; si no hay,
      // el envío de final_onboarding; y si ese caducó ('skipped'), el
      // día 30 de la cuenta.
      let sinceIso = lifecycle['long_term']
      if (!sinceIso) {
        sinceIso = finalMark !== 'skipped'
          ? finalMark
          : new Date(new Date(p.created_at).getTime() + FINAL_ONBOARDING_MIN_DAY * 86400000).toISOString()
      }
      if (daysSince(sinceIso, now) >= LONG_TERM_INTERVAL_DAYS) {
        return 'long_term'
      }
    }
  }

  // 4) Promoción de membresía "porque sí" (prioridad más baja: solo
  // se manda si nada de lo anterior aplicó).
  if (p.checkout_started_at) {
    const hrs = hoursSince(p.checkout_started_at, now)
    const lastSent = lifecycle['checkout_abandoned']
    const cooldownOk = !lastSent || daysSince(lastSent, now) >= CHECKOUT_ABANDONED_COOLDOWN_DAYS
    if (hrs >= CHECKOUT_ABANDONED_MIN_HOURS && hrs <= CHECKOUT_ABANDONED_MAX_HOURS && cooldownOk) {
      return 'checkout_abandoned'
    }
  }
  // Desactivado por ahora (ver ACTIVE_FREE_PITCH_ENABLED arriba):
  // se deja la lógica lista pero no se manda nada de este tipo hasta
  // que se decida activar promociones recurrentes.
  if (ACTIVE_FREE_PITCH_ENABLED && p.free_first_exercise_at && p.last_seen_at) {
    const lastSent = lifecycle['active_free_pitch']
    const cooldownOk = !lastSent || daysSince(lastSent, now) >= ACTIVE_FREE_USER_COOLDOWN_DAYS
    const stillComingBack = daysSince(p.last_seen_at, now) <= ACTIVE_FREE_USER_LAST_SEEN_MAX_DAYS
    if (ageDays >= ACTIVE_FREE_USER_MIN_DAYS_SINCE_SIGNUP && stillComingBack && cooldownOk) {
      return 'active_free_pitch'
    }
  }

  return null
}

function hoursSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / 3600000
}
function daysSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / 86400000
}

// ---------------- Decidir el correo (si acaso) de un MIEMBRO inactivo ----------------
// Aparte de decideEmail() a propósito: solo aplica a is_member=true,
// solo tiene 2 posibles correos (nunca un día 15/20/25), y no vende
// nada (ni menciona pagos/renovación/cancelación). Ver la nota larga
// de MEMBER_REACTIVATION_*/MEMBER_RENEWAL_SILENCE_* arriba.

// true si "ahora" cae dentro de la zona de silencio alrededor de
// next_renewal_at (o si no hay next_renewal_at conocido -> false,
// nunca se calla por una fecha que no tenemos).
function inRenewalSilenceZone(p: Profile, now: number): boolean {
  if (!p.next_renewal_at) return false
  const daysUntilRenewal = (new Date(p.next_renewal_at).getTime() - now) / 86400000
  return daysUntilRenewal <= MEMBER_RENEWAL_SILENCE_BEFORE_DAYS && daysUntilRenewal >= -MEMBER_RENEWAL_SILENCE_AFTER_DAYS
}

function decideMemberEmail(p: Profile, now: number): EmailKey | null {
  if (!p.last_seen_at) return null // nunca hay señal de actividad real, no hay "inactividad" que detectar

  const lifecycle = p.lifecycle_emails || {}

  // Mismo freno global de 24h que ya usa decideEmail() para cuentas
  // gratis, leyendo la misma columna (last_marketing_email_at).
  if (p.last_marketing_email_at && hoursSince(p.last_marketing_email_at, now) < MARKETING_EMAIL_MIN_GAP_HOURS) {
    return null
  }

  // Zona de silencio de renovación: se salta esta pasada nada más,
  // no se pierde el correo (se reintenta cada 30 min hasta salir de
  // la zona, mientras siga cumpliendo lo demás).
  if (inRenewalSilenceZone(p, now)) {
    return null
  }

  const inactiveDays = daysSince(p.last_seen_at, now)

  // Día 10 se revisa PRIMERO a propósito: si por cooldown/prioridad
  // nunca se mandó el de día 3 y ya vamos en el día 12, no tiene
  // sentido mandar el de día 3 ("hace unos días que no practicas")
  // tan tarde; se manda directo el de día 10, que sigue siendo
  // válido. "cameBackSince" es lo que separa un episodio de otro: si
  // last_seen_at no ha avanzado desde el último envío de esta clave,
  // sigue siendo el MISMO episodio (no se repite); si sí avanzó
  // (volvió a entrar y volvió a estar inactivo), es un episodio
  // nuevo y puede volver a recibirlo.
  const lastSent10 = lifecycle['member_reactivation_10d']
  const cameBackSince10 = !lastSent10 || new Date(p.last_seen_at).getTime() > new Date(lastSent10).getTime()
  if (inactiveDays >= MEMBER_REACTIVATION_10D_MIN_DAYS && cameBackSince10) {
    return 'member_reactivation_10d'
  }

  const lastSent3 = lifecycle['member_reactivation_3d']
  const cameBackSince3 = !lastSent3 || new Date(p.last_seen_at).getTime() > new Date(lastSent3).getTime()
  if (inactiveDays >= MEMBER_REACTIVATION_3D_MIN_DAYS && cameBackSince3) {
    return 'member_reactivation_3d'
  }

  return null
}

// ---------------- Caducidad/catch-up de la secuencia por calendario ----------------
// Objetivo: un correo puede retrasarse por el freno de 24h o porque otro
// de mayor prioridad le ganó el turno, pero si pasa DEMASIADO tiempo sin
// mandarse, ya no tiene sentido mandarlo fuera de contexto semanas
// después. En vez de eso, se marca 'skipped' en lifecycle_emails (queda
// registrado que se decidió NO mandarlo a propósito, no que se perdió
// por error) y decideEmail() ya no lo vuelve a ofrecer, porque su check
// es "!lifecycle[key]" y 'skipped' (como cualquier string) ya es un
// valor "truthy".

// Revisa las 4 claves de EXPIRABLE_SCHEDULE y devuelve las que recién
// cruzaron su plazo (SKIP_AFTER_DAYS) sin haberse mandado ni marcado ya.
function findNewlyExpiredKeys(p: Profile, now: number): EmailKeyScheduled[] {
  const lifecycle = p.lifecycle_emails || {}
  const ageDays = (now - new Date(p.created_at).getTime()) / 86400000
  const expired: EmailKeyScheduled[] = []
  for (const item of EXPIRABLE_SCHEDULE) {
    if (!lifecycle[item.key] && ageDays > item.skipAfterDays) {
      expired.push(item.key)
    }
  }
  return expired
}

// Escritura ligera y aparte de sendIfStillEligible: NO manda ningún
// correo, NO toca last_marketing_email_at (no debe contar como si se
// hubiera mandado marketing, para no tapar el paso a otro correo real
// en esta misma pasada). Solo guarda 'skipped' en lifecycle_emails para
// esas claves. Devuelve el lifecycle_emails ya actualizado para que el
// resto de esta pasada (decideEmail) lo use sin tener que releer de la
// base de datos.
async function markExpiredAsSkipped(
  userId: string,
  currentLifecycle: Record<string, string>,
  expiredKeys: EmailKeyScheduled[]
): Promise<Record<string, string>> {
  const merged = Object.assign({}, currentLifecycle)
  for (const key of expiredKeys) merged[key] = 'skipped'
  const { error } = await supabase.from('profiles').update({ lifecycle_emails: merged }).eq('id', userId)
  if (error) console.error(`Error marcando como 'skipped' (${expiredKeys.join(', ')}) para ${userId}:`, error)
  return merged
}

// ---------------- Mandar + registrar ----------------

// Vuelve a leer is_member y lifecycle_emails EN ESTE MOMENTO (no el
// valor que traía la lista original, que pudo quedar viejo mientras
// se mandaban los correos anteriores de esta misma corrida), manda
// el correo que corresponde, y si se mandó, registra el envío tanto
// en lifecycle_emails[key] como en last_marketing_email_at (el
// freno global de "no más de uno cada 24h").
//
// expectedIsMember: para los 11 correos de cuenta gratis de siempre
// es false (el default, no hace falta pasarlo). Para los 2 correos
// nuevos de miembros (ver MEMBER_ONLY_KEYS) es true: así, si alguien
// se dio de baja o se hizo miembro justo entre que se decidió el
// correo y este momento, no se manda a la audiencia equivocada.
async function sendIfStillEligible(
  userId: string,
  email: string | null,
  key: EmailKey,
  expectedIsMember: boolean = false
): Promise<boolean> {
  if (!email) return false
  const { data: fresh } = await supabase
    .from('profiles')
    .select('is_member, lifecycle_emails, email_opt_out_at, display_name')
    .eq('id', userId)
    .maybeSingle()
  if (!fresh || fresh.is_member !== expectedIsMember) return false
  if (fresh.email_opt_out_at) return false // se dio de baja de estos correos

  // long_term rota por LONG_TERM_EMAILS: se elige el siguiente de la
  // lista según cuántos ya se le mandaron a esta persona.
  const freshLifecycle: Record<string, string> = fresh.lifecycle_emails || {}
  const longTermIdx = parseInt(freshLifecycle['long_term_count'] || '0', 10) || 0
  if (key === 'long_term' && longTermIdx >= LONG_TERM_EMAILS.length) return false
  const content = key === 'long_term' ? LONG_TERM_EMAILS[longTermIdx] : EMAIL_CONTENT[key]

  const okToSend = await sendEmailFor(key, email, userId, personalize(content, fresh.display_name))
  if (!okToSend) return false

  const nowIso = new Date().toISOString()
  const extra: Record<string, string> = { [key]: nowIso }
  if (key === 'long_term') extra['long_term_count'] = String(longTermIdx + 1)
  const mergedLifecycle = Object.assign({}, freshLifecycle, extra)
  const updatePayload: Record<string, unknown> = { lifecycle_emails: mergedLifecycle }
  // "welcome" no cuenta para el freno global de 24h (ver
  // NO_COOLDOWN_KEYS): se registra en lifecycle_emails para no
  // repetirse, pero NO se guarda en last_marketing_email_at, así no
  // le tapa el paso a abandoned_signup (ni a nada más) unas horas
  // después.
  if (!NO_COOLDOWN_KEYS.has(key)) {
    updatePayload.last_marketing_email_at = nowIso
  }
  const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId)
  if (error) console.error(`Error registrando el envío de "${key}" para ${userId}:`, error)
  return true
}

async function sendEmailFor(key: EmailKey, to: string, userId: string, override?: EmailContent): Promise<boolean> {
  const content = override || EMAIL_CONTENT[key]
  const links = await unsubLinks(userId)
  return sendViaResend(to, content.subject, emailShell(content, links.page), links.oneClick)
}

async function sendViaResend(to: string, subject: string, html: string, oneClickUnsubUrl: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        reply_to: REPLY_TO_EMAIL,
        subject,
        html,
        // Botón "Cancelar suscripción" de Gmail/Outlook junto al remitente.
        headers: {
          'List-Unsubscribe': `<${oneClickUnsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })
    if (!res.ok) {
      const detalle = await res.text()
      console.error('Error mandando correo con Resend:', detalle)
      return false
    }
    return true
  } catch (e) {
    console.error('Error mandando correo con Resend:', e)
    return false
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ---------------- Contenido de cada correo ----------------
// Un solo "molde" (emailShell) con el mismo estilo que ya usa el
// resto del sitio (tarjeta blanca, azul #253ECC, Resend), para no
// repetir el HTML completo 11 veces. Cada correo solo define su
// saludo, título, cuerpo, botón y una nota chiquita al pie.

type EmailContent = {
  // Opcional: versión del título con el nombre de la persona. Usa
  // {name} donde va el nombre. Si no hay nombre, se usa "title".
  titleWithName?: string
  subject: string
  // Texto gris que Gmail muestra junto al asunto en la bandeja de
  // entrada (antes de abrir el correo). Va oculto dentro del correo.
  preheader: string
  greeting: string
  title: string
  bodyHtml: string
  ctaText: string
  ctaUrl: string
  footerNote: string
}

// ---------------- Nombre de la persona (profiles.display_name) ----------------
// Deja solo el primer nombre, con mayúscula inicial, sin símbolos raros
// y escapado para HTML. Si no parece un nombre (vacío, un correo, puros
// números), devuelve '' y el correo sale sin nombre, como antes.
function cleanFirstName(raw: string | null | undefined): string {
  if (!raw) return ''
  let first = String(raw).trim().split(/\s+/)[0] || ''
  if (first.includes('@')) return ''
  first = first.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\-]/g, '').slice(0, 20)
  if (first.length < 2) return ''
  first = first.charAt(0).toLocaleUpperCase('es') + first.slice(1).toLocaleLowerCase('es')
  return first.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;')
}

// Pone el nombre en el saludo ("¡Hola, Ana! 👋") y, si el correo tiene
// titleWithName, también en el título. Sin nombre, devuelve el correo tal cual.
function personalize(c: EmailContent, rawName: string | null | undefined): EmailContent {
  const name = cleanFirstName(rawName)
  if (!name) return c
  let greeting = c.greeting
  if (greeting.startsWith('¡Hola de nuevo!')) greeting = greeting.replace('¡Hola de nuevo!', `¡Hola de nuevo, ${name}!`)
  else if (greeting.startsWith('¡Hola!')) greeting = greeting.replace('¡Hola!', `¡Hola, ${name}!`)
  const title = c.titleWithName ? c.titleWithName.replace('{name}', name) : c.title
  return Object.assign({}, c, { greeting, title })
}

function emailShell(c: EmailContent, unsubUrl: string): string {
  return `
<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${c.preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <p style="color:#333; font-size:15px; margin:0 0 4px;">${c.greeting}</p>
    <h1 style="color:#253ECC; font-size:22px; margin:0 0 14px;">${c.title}</h1>
    ${c.bodyHtml}
    <p style="text-align:center; margin:28px 0 10px;">
      <a href="${c.ctaUrl}"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:14px 28px; border-radius:8px; font-size:15px; font-weight:bold; display:inline-block;">
        ${c.ctaText} →
      </a>
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6; margin:24px 0 0;">
      Nos vemos en la práctica,<br><strong>Leo</strong>
    </p>
    <p style="color:#888; font-size:13px; line-height:1.6; margin:16px 0 0;">
      ${c.footerNote}
    </p>
  </div>
  <p style="max-width:520px; margin:14px auto 0; text-align:center; color:#999; font-size:12px; line-height:1.6;">
    Recibes este correo porque tienes una cuenta en Inglés con Leo.<br>
    <a href="${unsubUrl}" style="color:#999;">Ya no quiero recibir estos correos</a>
  </p>
</div>
`.trim()
}

// Estilos compartidos de los correos (para no repetirlos en cada uno).
const P = 'color:#333; font-size:15px; line-height:1.6;'
// Cajita azul clara para el "mini tip" de inglés de cada correo: le da
// a la persona algo útil por abrirlo, no solo un "vuelve a practicar".
const BOX = 'background-color:#f1f4fe; border-left:4px solid #253ECC; border-radius:8px; padding:14px 16px; margin:18px 0; color:#333; font-size:15px; line-height:1.6;'
const LINK = 'color:#253ECC; font-weight:bold;'

const EMAIL_CONTENT: Record<EmailKey, EmailContent> = {
  // long_term no usa esta entrada: su contenido sale de
  // LONG_TERM_EMAILS según long_term_count (ver sendIfStillEligible).
  // Se deja un getter para cumplir con el tipo sin duplicar texto.
  get long_term() { return LONG_TERM_EMAILS[0] },
  welcome: {
    subject: 'Ya estás dentro 🎉 (y un truco para empezar bien)',
    preheader: 'Ya puedes practicar gratis. Así le sacas el máximo.',
    greeting: '¡Hola! 👋',
    title: 'Tu cuenta gratis ya está activa',
    titleWithName: '{name}, tu cuenta gratis ya está activa',
    bodyHtml: `
    <p style="${P}">
      Desde hoy puedes practicar gratis gramática, vocabulario, listening,
      writing y speaking, con ejercicios adaptados a tu nivel.
    </p>
    <div style="${BOX}">
      <strong>Truco para empezar bien:</strong> si no sabes tu nivel exacto,
      haz primero el <a href="${SITE}/test-de-nivel-de-ingles.html" style="${LINK}">test de nivel</a>
      (unos 10 minutos). Así los ejercicios no se te hacen ni muy fáciles ni
      imposibles.
    </div>
    <p style="${P}">
      Mi recomendación: pocos minutos, pero todos los días. Eso le gana a
      estudiar dos horas una vez a la semana.
    </p>`,
    ctaText: 'Empezar a practicar',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: '¿Dudas? Responde este correo, lo leo yo.',
  },
  abandoned_signup: {
    subject: '¿Cómo dirías "tengo 25 años" en inglés?',
    preheader: 'Casi todos lo dicen mal al principio. Aquí va la respuesta.',
    greeting: '¡Hola de nuevo!',
    title: 'Una pregunta rápida',
    titleWithName: '{name}, una pregunta rápida',
    bodyHtml: `
    <p style="${P}">¿Cuál es la correcta?</p>
    <div style="${BOX}">
      A) I have 25 years.<br>
      B) I am 25 years old.
    </div>
    <p style="${P}">
      Es la <strong>B</strong>. En inglés la edad se dice con <em>to be</em>
      (soy/estoy), no con <em>have</em>. Si pensaste en la A, no te
      preocupes: es de los errores más comunes entre hispanohablantes.
    </p>
    <p style="${P}">
      Así son los ejercicios de tu cuenta: cortos, con la explicación en
      español en cuanto contestas. El primero te toma menos de un minuto.
    </p>`,
    ctaText: 'Hacer mi primer ejercicio',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: '¿Algo no funcionó al entrar? Responde este correo y lo vemos.',
  },
  reactivation_3d: {
    subject: '3 palabras que no significan lo que parece 👀',
    preheader: 'Una de ellas te puede meter en un lío. Y tu práctica sigue guardada.',
    greeting: '¡Hola! 👋',
    title: 'Cuidado con estos "falsos amigos"',
    bodyHtml: `
    <div style="${BOX}">
      <strong>Embarrassed</strong> = avergonzado (no embarazada: esa es <em>pregnant</em>)<br>
      <strong>Actually</strong> = en realidad (no actualmente: ese es <em>currently</em>)<br>
      <strong>Library</strong> = biblioteca (no librería: esa es <em>bookstore</em>)
    </div>
    <p style="${P}">
      Llevas unos días sin practicar, y tu progreso sigue exactamente donde
      lo dejaste. Una sesión corta hoy basta para no perder el ritmo.
    </p>`,
    ctaText: 'Retomar mi práctica',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: '¿Te gustan estos tips? Responde este correo y cuéntame qué te cuesta más del inglés.',
  },
  day1: {
    subject: '¿"People is" o "people are"?',
    preheader: 'Un error que se cuela hasta en nivel intermedio.',
    greeting: '¡Hola! 👋',
    title: 'El tip de hoy',
    titleWithName: '{name}, este es el tip de hoy',
    bodyHtml: `
    <p style="${P}">
      Se dice <strong>people are</strong>. En español "la gente" es singular,
      pero en inglés <em>people</em> es plural, igual que <em>police</em>.
    </p>
    <div style="${BOX}">
      ✗ People is very friendly here.<br>
      ✓ People are very friendly here.
    </div>
    <p style="${P}">
      Ayer creaste tu cuenta. Hoy te propongo algo sencillo: 5 ejercicios,
      unos 3 minutos. Tu progreso se guarda solo.
    </p>`,
    ctaText: 'Hacer mis 5 ejercicios',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: '¿Dudas? Responde este correo, lo leo yo.',
  },
  day3: {
    subject: '¿Hasta qué nivel llegas con 3 vidas? 🎮',
    preheader: 'English Rush: preguntas rápidas que se ponen cada vez más difíciles.',
    greeting: '¡Hola! 👋',
    title: 'Te reto a una partida de English Rush',
    bodyHtml: `
    <p style="${P}">
      English Rush es el juego gratis de Inglés con Leo: preguntas rápidas de
      vocabulario, gramática y listening, con tiempo. Tienes 3 vidas, y cada
      5 aciertos subes de nivel.
    </p>
    <div style="${BOX}">
      <strong>Reto:</strong> llega al nivel 4 sin perder ni una vida.
      Suena fácil, hasta que empieza a correr el tiempo. 😅
    </div>
    <p style="${P}">
      Es la forma más divertida de practicar cuando no tienes ganas de
      "estudiar".
    </p>`,
    ctaText: 'Jugar una partida',
    ctaUrl: `${SITE}/juego.html`,
    footerNote: '¿Hasta qué nivel llegaste? Responde este correo y cuéntame.',
  },
  membership_intro: {
    subject: 'Una semana practicando 🙌 ¿Qué sigue?',
    preheader: 'Todo Inglés con Leo sin límite, por menos de lo que cuesta un café.',
    greeting: '¡Hola! 👋',
    title: 'Llevas una semana. ¿Vamos por más?',
    titleWithName: '{name}, llevas una semana. ¿Vamos por más?',
    bodyHtml: `
    <p style="${P}">
      Tu cuenta gratis sigue funcionando todo el tiempo que quieras. Si ya le
      agarraste el gusto, la membresía te da todo esto sin límites:
    </p>
    <ul style="${P} padding-left:20px; margin:0;">
      <li>Práctica ilimitada en las 5 habilidades</li>
      <li>Dashboard con tu progreso, racha y estadísticas</li>
      <li>Repaso automático de tus errores</li>
      <li>Clases interactivas paso a paso</li>
      <li>Preparación para TOEFL, IELTS, TOEIC y Cambridge</li>
    </ul>
    <div style="${BOX}">
      <strong>$2 USD al mes</strong> (en México, $37 MXN), o <strong>$20 USD al año</strong>,
      que son 2 meses gratis. Cancelas cuando quieras, sin llamadas ni letras chiquitas.
    </div>`,
    ctaText: 'Ver todo lo que incluye',
    ctaUrl: `${SITE}/miembros.html`,
    footerNote: 'Sin presión: tu cuenta gratis sigue funcionando igual si prefieres seguir así.',
  },
  reactivation_day14: {
    subject: 'Te guardé tu lugar',
    preheader: '3 frases en inglés para volver sin sentir que empiezas de cero.',
    greeting: '¡Hola! 👋',
    title: 'Volver es más fácil de lo que parece',
    bodyHtml: `
    <p style="${P}">
      Si el inglés se te fue quedando de lado estas semanas, pasa muchísimo.
      Aquí van 3 frases que sirven justo para eso:
    </p>
    <div style="${BOX}">
      <strong>I'm back!</strong> ¡Ya regresé!<br>
      <strong>Where was I?</strong> ¿En qué me quedé?<br>
      <strong>Let's pick up where we left off.</strong> Sigamos donde nos quedamos.
    </div>
    <p style="${P}">
      Tu cuenta y tu progreso siguen ahí. Cinco minutos hoy y ya estás de vuelta.
    </p>`,
    ctaText: 'Seguir donde me quedé',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: 'Si algo te hizo dejar de practicar, respóndeme y cuéntame. Me ayuda a mejorar la página.',
  },
  final_onboarding: {
    subject: 'Un mes después: ¿cuánto has avanzado?',
    preheader: 'Una forma rápida de medirlo, y un reto de 1 minuto al día.',
    greeting: '¡Hola! 👋',
    title: 'Mide cuánto has avanzado',
    titleWithName: '{name}, mide cuánto has avanzado',
    bodyHtml: `
    <p style="${P}">
      Ya pasó un mes desde que creaste tu cuenta. Dos ideas para este mes:
    </p>
    <div style="${BOX}">
      <strong>1. Vuelve a hacer el test de nivel.</strong> Compara tu resultado
      con el de antes. Ver el avance en números motiva muchísimo.<br><br>
      <strong>2. Haz el reto diario.</strong> Son 5 ejercicios, más o menos un
      minuto. Está en la página de práctica, gratis.
    </div>
    <p style="${P}">
      Y si quieres ir más rápido, la membresía te da práctica sin límite y
      clases interactivas por $2 USD al mes.
    </p>
    <p style="${P}">
      <a href="${SITE}/test-de-nivel-de-ingles.html" style="${LINK}">Hacer el test de nivel</a>
    </p>`,
    ctaText: 'Hacer el reto de hoy',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: '¿Dudas? Responde este correo, lo leo yo.',
  },
  limit_reached: {
    subject: 'Llegaste al límite 💪 (y eso dice mucho de ti)',
    preheader: 'Completaste tus 20 ejercicios gratis. Así puedes seguir.',
    greeting: '¡Hola! 👋',
    title: 'Completaste tus 20 ejercicios del día',
    titleWithName: '¡Bien hecho, {name}! Completaste tus 20 ejercicios del día',
    bodyHtml: `
    <p style="${P}">
      La mayoría de la gente deja el inglés porque no practica. Tú hiciste
      justo lo contrario: llegaste al tope de tu cuenta gratis.
    </p>
    <p style="${P}">Tienes dos opciones:</p>
    <div style="${BOX}">
      <strong>Esperar a mañana:</strong> tus 20 ejercicios se reinician solos.<br><br>
      <strong>Seguir sin límite:</strong> con la membresía practicas todo lo
      que quieras, por $2 USD al mes (o $20 USD al año). Cancelas cuando quieras.
    </div>`,
    ctaText: 'Seguir sin límite',
    ctaUrl: `${SITE}/miembros.html`,
    footerNote: 'Si prefieres esperar a mañana, perfecto: aquí te esperan tus ejercicios.',
  },
  checkout_abandoned: {
    subject: '¿Se atoró algo con tu pago?',
    preheader: 'A veces la tarjeta falla. Aquí van otras opciones que sí funcionan.',
    greeting: '¡Hola! 👋',
    title: 'Tu membresía quedó a medias',
    bodyHtml: `
    <p style="${P}">
      Empezaste a activar tu membresía, pero el pago no se completó. Pasa
      seguido, y casi siempre tiene solución rápida:
    </p>
    <div style="${BOX}">
      <strong>¿Te rechazaron la tarjeta?</strong> Prueba con Mercado Pago o PayPal.
      Están en la misma pantalla de pago.<br><br>
      <strong>¿Tienes dudas?</strong> Responde este correo o
      <a href="https://wa.me/529994996520" style="${LINK}">escríbenos por WhatsApp</a>
      y te ayudamos.<br><br>
      <strong>¿Te preocupa quedarte amarrado?</strong> Cancelas cuando quieras
      desde tu cuenta, sin llamadas.
    </div>`,
    ctaText: 'Terminar de activar',
    ctaUrl: `${SITE}/miembros.html`,
    footerNote: 'Si decidiste no continuar, no hay problema: tu cuenta gratis sigue funcionando igual.',
  },
  active_free_pitch: {
    subject: 'Se nota que le estás echando ganas 🔥',
    preheader: 'Ya que practicas seguido, esto te puede servir.',
    greeting: '¡Hola! 👋',
    title: 'Se nota que le estás echando ganas',
    titleWithName: '{name}, se nota que le estás echando ganas',
    bodyHtml: `
    <p style="${P}">
      Llevas varios días practicando con tu cuenta gratis. Ya que la usas
      seguido, la membresía te quita el límite diario y te suma tu dashboard
      de progreso, el repaso automático de tus errores y las clases interactivas.
    </p>
    <div style="${BOX}">
      <strong>$2 USD al mes</strong> o <strong>$20 USD al año</strong>. Cancelas cuando quieras.
    </div>`,
    ctaText: 'Ver la membresía',
    ctaUrl: `${SITE}/miembros.html`,
    footerNote: 'Sin presión: tu cuenta gratis sigue funcionando igual si prefieres seguir así.',
  },
  member_reactivation_3d: {
    subject: 'Tu sesión de 5 minutos está lista',
    preheader: 'Y un phrasal verb que vas a usar esta misma semana.',
    greeting: '¡Hola! 👋',
    title: 'Un tip rápido antes de volver',
    titleWithName: '{name}, un tip rápido antes de volver',
    bodyHtml: `
    <div style="${BOX}">
      <strong>Catch up</strong> = ponerse al día<br>
      I need to catch up on my English practice. (Necesito ponerme al día con mi práctica de inglés.)
    </div>
    <p style="${P}">
      Hace unos días que no practicas. Elige una sesión corta en tu área de
      miembros y retomas en 5 minutos.
    </p>`,
    ctaText: 'Hacer una sesión corta',
    ctaUrl: `${SITE}/practica-miembros.html`,
    footerNote: '¿Hay algo que te gustaría practicar y no encuentras? Respóndeme, lo leo yo.',
  },
  member_reactivation_10d: {
    subject: 'Hay cosas nuevas en tu membresía 👀',
    preheader: 'Preparación TOEIC, un test de nivel con listening y más.',
    greeting: '¡Hola! 👋',
    title: 'Esto es nuevo desde tu última visita',
    bodyHtml: `
    <div style="${BOX}">
      <strong>Preparación para el TOEIC:</strong> el examen que piden muchas
      empresas, con listening y reading tipo examen.<br><br>
      <strong>Test de nivel con listening:</strong> para ver cuánto has avanzado.
    </div>
    <p style="${P}">
      Y todo lo de siempre: ejercicios por nivel, clases interactivas y
      English Rush. Tu progreso sigue guardado.
    </p>`,
    ctaText: 'Volver a practicar',
    ctaUrl: `${SITE}/practica-miembros.html`,
    footerNote: '¿Dudas? Responde este correo, lo leo yo.',
  },
}

// ---------------- Correos después del día 30 (long_term) ----------------
// Se mandan en este orden, uno cada LONG_TERM_INTERVAL_DAYS. Cada uno
// trae algo útil (un tip real) para que valga la pena abrirlo; solo
// algunos mencionan la membresía, y siempre de forma suave. Para
// alargar la secuencia, agrega correos nuevos AL FINAL (nunca en medio
// ni reordenando: el orden es lo que usa long_term_count). No repetir
// tips que ya salen en otros correos (edad con to be, falsos amigos,
// people are, English Rush, test de nivel, reto diario).
const LONG_TERM_EMAILS: EmailContent[] = [
  {
    subject: '4 frases para sonar más natural en inglés',
    preheader: 'Las usan los nativos todo el tiempo y casi nunca salen en los libros.',
    greeting: '¡Hola! 👋',
    title: 'Suena más natural con estas 4 frases',
    bodyHtml: `
    <div style="${BOX}">
      <strong>No worries.</strong> No te preocupes / No pasa nada.<br>
      <strong>Sounds good.</strong> Me parece bien.<br>
      <strong>I'm on my way.</strong> Voy en camino.<br>
      <strong>How's it going?</strong> ¿Cómo va todo?
    </div>
    <p style="${P}">
      Son cortas, sirven en casi cualquier conversación y te hacen sonar
      mucho menos "de libro". Pruébalas esta semana en un mensaje.
    </p>`,
    ctaText: 'Practicar un poco hoy',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: '¿Qué frase te cuesta decir en inglés? Respóndeme y te ayudo.',
  },
  {
    subject: '¿Worked se pronuncia "work-ed"? 🤔',
    preheader: 'La terminación -ed tiene 3 sonidos distintos. Así los distingues.',
    greeting: '¡Hola! 👋',
    title: 'Los 3 sonidos de la -ed',
    bodyHtml: `
    <p style="${P}">
      En pasado, la -ed casi nunca se pronuncia "ed". Tiene 3 sonidos:
    </p>
    <div style="${BOX}">
      <strong>/t/</strong> worked, stopped, watched (suena "workt")<br>
      <strong>/d/</strong> played, called, lived (suena "pleid")<br>
      <strong>/id/</strong> wanted, needed (solo después de t o d)
    </div>
    <p style="${P}">
      La mejor forma de agarrarle el oído es escuchando frases reales.
      Los ejercicios de listening son justo para eso.
    </p>`,
    ctaText: 'Hacer un listening',
    ctaUrl: `${SITE}/practica.html?skill=listening`,
    footerNote: '¿Dudas? Responde este correo, lo leo yo.',
  },
  {
    subject: 'Los 5 verbos irregulares que más vas a usar',
    preheader: 'Si te sabes estos, ya cubres una buena parte de las conversaciones.',
    greeting: '¡Hola! 👋',
    title: '5 verbos irregulares que no pueden faltar',
    bodyHtml: `
    <div style="${BOX}">
      <strong>go / went</strong> ir / fui<br>
      <strong>have / had</strong> tener / tuve<br>
      <strong>make / made</strong> hacer / hice<br>
      <strong>get / got</strong> conseguir, llegar / conseguí, llegué<br>
      <strong>say / said</strong> decir / dije
    </div>
    <p style="${P}">
      Si quieres la lista completa con traducción, está en
      <a href="${SITE}/articulo-verbos-irregulares.html" style="${LINK}">esta guía gratis</a>.
      Y si quieres practicarlos sin límite y repasar tus errores
      automáticamente, la membresía cuesta $2 USD al mes.
    </p>`,
    ctaText: 'Practicar gramática',
    ctaUrl: `${SITE}/practica.html?skill=grammar`,
    footerNote: 'Tu cuenta gratis sigue funcionando igual, sin presión.',
  },
  {
    subject: '¿Make o do? El truco para no confundirlos',
    preheader: 'Los dos significan "hacer", pero no se usan igual.',
    greeting: '¡Hola! 👋',
    title: 'Make vs do, en 30 segundos',
    bodyHtml: `
    <p style="${P}">
      Regla rápida: <strong>make</strong> es crear o producir algo;
      <strong>do</strong> es realizar una tarea o actividad.
    </p>
    <div style="${BOX}">
      make a mistake, make a decision, make dinner<br>
      do homework, do the dishes, do exercise
    </div>
    <p style="${P}">
      Hay excepciones, pero con esta regla aciertas la mayoría de las veces.
    </p>`,
    ctaText: 'Ponerlo a prueba',
    ctaUrl: `${SITE}/practica.html?skill=grammar`,
    footerNote: '¿Te sirven estos tips? Respóndeme y dime qué tema quieres en el próximo.',
  },
  {
    subject: '"Tell me about yourself": cómo responder en inglés',
    preheader: 'La pregunta que abre casi todas las entrevistas de trabajo.',
    greeting: '¡Hola! 👋',
    title: 'Tu respuesta en 3 pasos',
    bodyHtml: `
    <p style="${P}">
      Si algún día tienes una entrevista en inglés, casi seguro empieza con
      esta pregunta. Una estructura simple que funciona:
    </p>
    <div style="${BOX}">
      <strong>1. Presente:</strong> I'm a sales assistant at...<br>
      <strong>2. Pasado:</strong> Before that, I worked in...<br>
      <strong>3. Futuro:</strong> Now I'm looking for...
    </div>
    <p style="${P}">
      En <a href="${SITE}/articulo-entrevista-trabajo-ingles.html" style="${LINK}">esta guía</a>
      tienes más preguntas comunes con ejemplos de respuesta.
    </p>`,
    ctaText: 'Leer la guía',
    ctaUrl: `${SITE}/articulo-entrevista-trabajo-ingles.html`,
    footerNote: '¿Tienes una entrevista pronto? Respóndeme y cuéntame para qué puesto.',
  },
  {
    subject: '¿In, on o at? Así se usan con el tiempo',
    preheader: 'Una regla de "de grande a pequeño" que te ahorra muchos errores.',
    greeting: '¡Hola! 👋',
    title: 'In, on, at: de grande a pequeño',
    bodyHtml: `
    <div style="${BOX}">
      <strong>in</strong> para lo más grande: in 2026, in March, in summer<br>
      <strong>on</strong> para días: on Monday, on my birthday<br>
      <strong>at</strong> para horas exactas: at 7 pm, at night
    </div>
    <p style="${P}">
      Llevas un buen tiempo con tu cuenta. Si quieres dar el siguiente
      paso, la membresía te da práctica ilimitada, clases interactivas y
      preparación para exámenes por $2 USD al mes (o $20 USD al año).
    </p>`,
    ctaText: 'Seguir practicando',
    ctaUrl: `${SITE}/practica.html`,
    footerNote: 'Gracias por seguir aquí. Si algo se puede mejorar, respóndeme: lo leo yo.',
  },
]
