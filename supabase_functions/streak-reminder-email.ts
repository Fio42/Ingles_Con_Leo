// ============================================================
// Inglés con Leo — Edge Function: streak-reminder-email
//
// Manda un correo a los miembros que practicaron AYER (así que
// tienen una racha activa) pero todavía NO han practicado HOY,
// para avisarles antes de que se les rompa la racha.
//
// Cómo se ejecuta sola: no la llama el navegador de nadie. La
// dispara el Cron de Supabase (pg_cron + pg_net) una vez al día,
// según el SQL que está en supabase_schema.sql, a las 13:00 UTC
// (8am hora de Cancún/Quintana Roo, UTC-5). Revisado 2026-09-25
// junto con el resto de correos automáticos (pedido de Leo de evitar
// mandar de noche/madrugada): esta ya cae dentro de la ventana buena
// (8am-9pm hora de Cancún) porque solo corre una vez al día a una
// hora fija, así que no necesitó ningún cambio.
//
// Sobre las zonas horarias (importante): "hoy" y "ayer" aquí se
// calculan usando la hora de México (UTC-6, México ya no usa
// horario de verano desde 2022), no la hora de cada usuario. Para
// la mayoría de tu audiencia (México y Latinoamérica) esto es
// correcto o casi correcto; para alguien en una zona horaria muy
// distinta, el aviso podría llegar un poco "adelantado" o
// "atrasado" cerca de la medianoche. No es perfecto, pero es
// suficiente para este caso, igual que las ventanas de seguridad
// de upgrade-nudge-emails.ts.
//
// No manda nada dos veces el mismo día: usa la columna
// streak_reminder_last_sent (fecha) en profiles.
//
// Reutiliza exactamente el mismo Resend y el mismo remitente
// (hola@inglesconleo.com) que ya usan los demás correos del sitio.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key, la misma que
//                              ya usan los demás correos automáticos.
//   RESEND_API_KEY             la misma que ya usan los demás
//                              correos del sitio.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
const REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Solo el Cron puede llamar esta función (2026-10-01): manda el header
// x-internal-secret con la llave 'internal_functions_secret' de Supabase
// Vault, revisada con public.internal_secret_ok (solo service_role).
async function internalSecretOk(secret: string | null): Promise<boolean> {
  if (!secret) return false
  // Reintenta si la consulta falla (p. ej. "JWT issued at future" al
  // arrancar con el reloj un poco adelantado). Una llave mala no falla:
  // devuelve false y se rechaza de inmediato.
  for (let intento = 1; intento <= 3; intento++) {
    const { data, error } = await supabase.rpc('internal_secret_ok', { p_secret: secret })
    if (!error) return data === true
    console.error(`Error revisando la llave interna (intento ${intento}):`, error)
    if (intento < 3) await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

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

// México (la mayoría de la audiencia) es UTC-6 todo el año.
const MEXICO_UTC_OFFSET_HOURS = -6
const TIME_BUDGET_MS = 100_000
const CLAIM_LEASE_MINUTES = 15

Deno.serve(async (req: Request) => {
  if (!(await internalSecretOk(req.headers.get('x-internal-secret')))) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }
  try {
    const now = new Date(Date.now() + MEXICO_UTC_OFFSET_HOURS * 3600_000)
    const todayStr = now.toISOString().slice(0, 10)
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    // Quiénes practicaron ayer (posible racha activa) y quiénes ya
    // practicaron hoy (a esos no hace falta avisarles). Se leen TODAS
    // las filas por páginas (auditoría 2026-09-30): Supabase corta
    // cualquier consulta en 1000 filas y aquí hay varias sesiones por
    // persona, así que sin paginar, con suficiente actividad, algunos
    // miembros con racha nunca entraban en la lista.
    const practicedYesterday = await fetchUserIdsForDate(yesterdayStr)
    const practicedToday = await fetchUserIdsForDate(todayStr)
    if (!practicedYesterday || !practicedToday) {
      console.error('Error buscando quién practicó ayer/hoy')
      return json({ ok: false }, 200)
    }

    const yaHoy = new Set(practicedToday)
    const candidatos = Array.from(new Set(practicedYesterday)).filter((id) => !yaHoy.has(id))

    // Presupuesto de tiempo en vez de un tope fijo de 500 (que dejaba a
    // los demás sin aviso para siempre): se procesan todos hasta ~100 s.
    // Lo ya mandado queda marcado con la fecha de hoy, así que una
    // segunda ejecución continúa donde se quedó sin repetir a nadie.
    const startedAt = Date.now()
    let sent = 0
    for (const userId of candidatos) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        console.error('Presupuesto de tiempo agotado; quedaron candidatos sin procesar. Volver a ejecutar la función.')
        break
      }
      const didSend = await sendIfStillEligible(userId, todayStr)
      if (didSend) sent++
    }

    return json({ ok: true, sent, candidatos: candidatos.length }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false }, 200)
  }
})

// Todos los user_id con al menos una sesión en una fecha, paginado
// (orden fijo por id). Devuelve null si alguna página falla.
async function fetchUserIdsForDate(dateStr: string): Promise<string[] | null> {
  const ids: string[] = []
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from('progress_sessions')
      .select('user_id')
      .eq('date', dateStr)
      .order('id', { ascending: true })
      .range(page * 1000, page * 1000 + 999)
    if (error) {
      console.error('Error leyendo progress_sessions:', error)
      return null
    }
    ids.push(...(data || []).map((r: { user_id: string }) => r.user_id))
    if (!data || data.length < 1000) break
  }
  return ids
}

// Revisa TODO otra vez justo antes de mandar (no confía en la lista de
// candidatos, que pudo quedar vieja mientras se mandaban los correos
// anteriores de esta misma corrida): que siga sin practicar hoy, que
// siga siendo miembro, y que no se le haya mandado ya este aviso hoy.
async function sendIfStillEligible(userId: string, todayStr: string): Promise<boolean> {
  const { data: prof } = await supabase
    .from('profiles')
    .select('email, is_member, streak_reminder_last_sent, email_opt_out_at, email_invalid, last_marketing_email_at')
    .eq('id', userId)
    .maybeSingle()
  if (!prof || !prof.is_member || !prof.email) return false
  if (prof.email_opt_out_at) return false // se dio de baja de estos correos
  if (prof.email_invalid) return false // rebotó o marcó spam: no se le escribe más
  if (prof.streak_reminder_last_sent === todayStr) return false

  const { data: hoy } = await supabase
    .from('progress_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .limit(1)
  if (hoy && hoy.length) return false // ya practicó hoy, se adelantó al correo

  const streakCount = await computeCurrentStreak(userId)
  if (streakCount < 1) return false // sin racha activa no tiene sentido este correo

  // Reserva con "lease" (auditoría 2026-09-30): streak_reminder_claimed_at
  // marca "alguien está mandando este aviso ahora". Solo UNA ejecución
  // logra la reserva (evita doble envío en ejecuciones simultáneas). Si el
  // envío falla, se libera en el acto. Si el proceso muriera a media
  // operación, la reserva caduca sola a los CLAIM_LEASE_MINUTES y una
  // nueva ejecución el mismo día puede volver a intentarlo: nunca queda
  // bloqueada para siempre. Solo al confirmar el envío se escribe
  // streak_reminder_last_sent (lo que de verdad cierra el día).
  const leaseCutoff = new Date(Date.now() - CLAIM_LEASE_MINUTES * 60000).toISOString()
  const { data: reclamado, error: claimError } = await supabase
    .from('profiles')
    .update({ streak_reminder_claimed_at: new Date().toISOString() })
    .eq('id', userId)
    .or(`and(or(streak_reminder_last_sent.is.null,streak_reminder_last_sent.neq.${todayStr}),or(streak_reminder_claimed_at.is.null,streak_reminder_claimed_at.lt.${leaseCutoff}))`)
    .select('id')
  if (claimError) {
    console.error(`Error reservando el aviso de racha para ${userId}:`, claimError)
    return false
  }
  if (!reclamado || !reclamado.length) return false

  // Freno global compartido con upgrade-nudge-emails (2026-10-08): máx. 1
  // correo no transaccional por usuario cada 24h (profiles.last_marketing_email_at).
  // Se reserva el lugar de forma atómica; si otro correo lo tomó, este se
  // pospone (se libera la reserva y el Cron de otro día lo vuelve a intentar).
  const slotIso = new Date().toISOString()
  const slotCutoff = new Date(Date.now() - (24 * 60 - 15) * 60000).toISOString()
  const { data: slot } = await supabase
    .from('profiles')
    .update({ last_marketing_email_at: slotIso })
    .eq('id', userId)
    .or(`last_marketing_email_at.is.null,last_marketing_email_at.lt.${slotCutoff}`)
    .select('id')
  if (!slot || !slot.length) {
    await supabase.from('profiles').update({ streak_reminder_claimed_at: null }).eq('id', userId)
    return false
  }

  let okToSend = false
  try {
    okToSend = await sendEmail(prof.email, streakCount, userId)
  } catch (e) {
    console.error('Error inesperado mandando aviso de racha:', e)
  }
  if (!okToSend) {
    await supabase.from('profiles').update({ streak_reminder_claimed_at: null }).eq('id', userId)
    await supabase.from('profiles').update({ last_marketing_email_at: prof.last_marketing_email_at ?? null }).eq('id', userId).eq('last_marketing_email_at', slotIso)
    return false
  }
  const { error } = await supabase
    .from('profiles')
    .update({ streak_reminder_last_sent: todayStr, streak_reminder_claimed_at: null })
    .eq('id', userId)
  if (error) console.error(`Error marcando streak_reminder_last_sent para ${userId}:`, error)
  return true
}

// Cuenta cuántos días seguidos lleva practicando este usuario, contando
// hacia atrás desde ayer (a estas alturas ya sabemos que hoy todavía no
// practicó). Usa la misma lógica de "streak freeze" que la página de
// miembros (computeActiveStreakDates() en app.js): tolera UN solo día
// salteado sin romper la racha, pero dos huecos seguidos sí la cortan.
async function computeCurrentStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('progress_sessions')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(400)
  if (error || !data) return 0

  const practicedSet = new Set(data.map((r: { date: string }) => r.date))
  const now = new Date(Date.now() + MEXICO_UTC_OFFSET_HOURS * 3600_000)
  const cursor = new Date(now)
  cursor.setUTCDate(cursor.getUTCDate() - 1) // arrancamos en "ayer"

  let streak = 0
  let freezeAvailable = true
  while (true) {
    const cursorStr = cursor.toISOString().slice(0, 10)
    if (practicedSet.has(cursorStr)) {
      streak++
    } else if (freezeAvailable) {
      freezeAvailable = false
    } else {
      break
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

async function sendEmail(destinatario: string, streakCount: number, userId: string): Promise<boolean> {
  try {
    const links = await unsubLinks(userId)
    const doFetch = () => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [destinatario],
        reply_to: REPLY_TO_EMAIL,
        subject: 'Tu racha está a punto de romperse 🔥',
        html: buildHtmlRacha(streakCount, links.page),
        headers: {
          'List-Unsubscribe': `<${links.oneClick}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })
    // Resend limita a ~2 envíos por segundo: si responde 429, se espera
    // un momento y se reintenta una vez (este aviso corre solo 1 vez al día).
    let res = await doFetch()
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200))
      res = await doFetch()
    }
    if (!res.ok) {
      const detalle = await res.text()
      console.error('Error mandando correo de racha:', detalle)
      return false
    }
    return true
  } catch (e) {
    console.error('Error mandando correo de racha:', e)
    return false
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildHtmlRacha(streakCount: number, unsubUrl: string): string {
  const dias = streakCount === 1 ? 'día' : 'días'
  return `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <p style="color:#333; font-size:15px; margin:0 0 4px;">¡Hola! 👋</p>
    <h1 style="color:#253ECC; font-size:22px; margin:0 0 14px;">Tu racha está a punto de romperse 🔥</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Llevas ${streakCount} ${dias} seguidos practicando en Inglés con Leo, pero todavía no has
      hecho ningún ejercicio hoy. Con un solo ejercicio corto (2-3 minutos)
      ya cuenta y sigues tu racha.
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Y si fallas alguno, toca <strong>Explícame por qué</strong>: Leo AI te
      lo explica en segundos, así ese error ya no se repite.
    </p>
    <p style="text-align:center; margin:28px 0 10px;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:14px 28px; border-radius:8px; font-size:15px; font-weight:bold; display:inline-block;">
        Practicar ahora →
      </a>
    </p>
  </div>
  <p style="max-width:520px; margin:14px auto 0; text-align:center; color:#999; font-size:12px; line-height:1.6;">
    Recibes este correo porque eres miembro de Inglés con Leo.<br>
    <a href="${unsubUrl}" style="color:#999;">Ya no quiero recibir estos correos</a>
  </p>
</div>
`.trim()
}
