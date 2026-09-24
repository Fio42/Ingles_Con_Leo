// ============================================================
// Inglés con Leo — Edge Function: streak-reminder-email
//
// Manda un correo a los miembros que practicaron AYER (así que
// tienen una racha activa) pero todavía NO han practicado HOY,
// para avisarles antes de que se les rompa la racha.
//
// Cómo se ejecuta sola: no la llama el navegador de nadie. La
// dispara el Cron de Supabase (pg_cron + pg_net) una vez al día,
// según el SQL que está en supabase_schema.sql.
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
const MAX_PER_RUN = 500

Deno.serve(async (_req: Request) => {
  try {
    const now = new Date(Date.now() + MEXICO_UTC_OFFSET_HOURS * 3600_000)
    const todayStr = now.toISOString().slice(0, 10)
    const yesterday = new Date(now)
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    // Quiénes practicaron ayer (posible racha activa) y quiénes ya
    // practicaron hoy (a esos no hace falta avisarles).
    const { data: practicedYesterday, error: err1 } = await supabase
      .from('progress_sessions')
      .select('user_id')
      .eq('date', yesterdayStr)
    if (err1) {
      console.error('Error buscando quién practicó ayer:', err1)
      return json({ ok: false }, 200)
    }

    const { data: practicedToday, error: err2 } = await supabase
      .from('progress_sessions')
      .select('user_id')
      .eq('date', todayStr)
    if (err2) {
      console.error('Error buscando quién practicó hoy:', err2)
      return json({ ok: false }, 200)
    }

    const yaHoy = new Set((practicedToday || []).map((r) => r.user_id))
    const candidatos = Array.from(new Set((practicedYesterday || []).map((r) => r.user_id))).filter(
      (id) => !yaHoy.has(id)
    )

    let sent = 0
    for (const userId of candidatos.slice(0, MAX_PER_RUN)) {
      const didSend = await sendIfStillEligible(userId, todayStr)
      if (didSend) sent++
    }

    return json({ ok: true, sent, candidatos: candidatos.length }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false }, 200)
  }
})

// Revisa TODO otra vez justo antes de mandar (no confía en la lista de
// candidatos, que pudo quedar vieja mientras se mandaban los correos
// anteriores de esta misma corrida): que siga sin practicar hoy, que
// siga siendo miembro, y que no se le haya mandado ya este aviso hoy.
async function sendIfStillEligible(userId: string, todayStr: string): Promise<boolean> {
  const { data: prof } = await supabase
    .from('profiles')
    .select('email, is_member, streak_reminder_last_sent, email_opt_out_at')
    .eq('id', userId)
    .maybeSingle()
  if (!prof || !prof.is_member || !prof.email) return false
  if (prof.email_opt_out_at) return false // se dio de baja de estos correos
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

  const okToSend = await sendEmail(prof.email, streakCount, userId)
  if (!okToSend) return false

  const { error } = await supabase
    .from('profiles')
    .update({ streak_reminder_last_sent: todayStr })
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
        subject: 'Tu racha está a punto de romperse 🔥',
        html: buildHtmlRacha(streakCount, links.page),
        headers: {
          'List-Unsubscribe': `<${links.oneClick}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    })
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
