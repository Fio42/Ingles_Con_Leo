// ============================================================
// Inglés con Leo — Edge Function: survey-15d-email
//
// Manda UNA encuesta corta a cada miembro que lleva entre 15 y 22
// días pagando (SURVEY_MIN_DAYS / SURVEY_MAX_DAYS abajo), para
// preguntarle qué tan útil le ha parecido la membresía y qué le
// gustaría que mejoráramos. Nunca se manda dos veces a la misma
// persona (queda marcado en profiles.survey_15d_sent_at).
//
// No es una plataforma nueva de emails: reutiliza exactamente el
// mismo Resend y el mismo remitente (hola@inglesconleo.com) que ya
// usan los webhooks de pago y upgrade-nudge-emails.ts.
//
// Cómo se ejecuta sola: no la llama el navegador de nadie. La
// dispara el Cron de Supabase (pg_cron + pg_net) una vez por hora,
// según el SQL que está en supabase_schema.sql.
//
// El correo trae un link a https://inglesconleo.com/encuesta.html?t=TOKEN
// con un token al azar y único por persona (no hace falta que
// inicie sesión para responder). Ese token se guarda en
// profiles.survey_15d_token y lo valida submit-survey.ts cuando
// llega la respuesta.
//
// Revisa is_member justo antes de mandar cada correo (no antes), así
// que si alguien cancela justo antes de que le toque, no le llega.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la "service_role" key. Si ya la usas
//                              en los webhooks de pago, es la misma.
//   RESEND_API_KEY             la misma que ya usan los webhooks de
//                              pago para el correo de bienvenida.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const FROM_EMAIL = 'Inglés con Leo <hola@inglesconleo.com>'
const REPLY_TO_EMAIL = 'inglesconleoreal@gmail.com'
const SURVEY_URL_BASE = 'https://inglesconleo.com/encuesta.html'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const SURVEY_MIN_DAYS = 15
const SURVEY_MAX_DAYS = 22 // ventana de seguridad: si el Cron dejó de
                            // correr por unos días, esto evita mandar
                            // la encuesta semanas tarde. Fuera de esta
                            // ventana, simplemente no se manda.

const MAX_PER_RUN = 200 // tope de correos por corrida, por si acaso

// Ventana horaria (ajustado 2026-09-25 por pedido de Leo), misma
// idea que en upgrade-nudge-emails.ts: 8am-9pm hora de Cancún es la
// ventana preferida, pero no es candado duro (una encuesta que quede
// lista a las 10-11pm sale normal). Lo único que sí se bloquea de
// verdad es la madrugada (1am-7:59am hora de Cancún); la ventana de
// elegibilidad de esta encuesta es de 7 días (15-22 días de
// membresía), así que no hay ningún riesgo de perdérsela por esperar
// a la siguiente pasada del Cron. América/Cancún es UTC-5 todo el
// año, sin horario de verano.
const CANCUN_UTC_OFFSET_HOURS = -5
const BLOCKED_HOUR_LOCAL_START = 1 // 1:00am hora de Cancún
const BLOCKED_HOUR_LOCAL_END = 7 // hasta las 7:59am hora de Cancún
function isGoodSendHour(now: number): boolean {
  const utcHour = new Date(now).getUTCHours()
  const localHour = (utcHour + CANCUN_UTC_OFFSET_HOURS + 24) % 24
  const isMadrugada = localHour >= BLOCKED_HOUR_LOCAL_START && localHour <= BLOCKED_HOUR_LOCAL_END
  return !isMadrugada
}

Deno.serve(async (req: Request) => {
  try {
    // Modo manual (uso puntual desde el botón "Test" de Supabase, NO lo
    // usa el Cron): si el cuerpo trae "manual_emails", manda la encuesta
    // SOLO a esos correos exactos, sin mirar la ventana de días de más
    // abajo. Sigue revisando is_member=true antes de mandarla, y sigue
    // marcando survey_15d_sent_at, para que el Cron normal no la vuelva
    // a mandar después. Si el cuerpo viene vacío (así lo manda el Cron),
    // esto no hace nada y sigue el modo automático normal.
    try {
      const body = await req.json()
      if (body && Array.isArray(body.manual_emails) && body.manual_emails.length) {
        let sentManual = 0
        for (const email of body.manual_emails) {
          if (typeof email !== 'string' || !email) continue
          const { data: prof } = await supabase.from('profiles').select('id, is_member, survey_15d_sent_at').eq('email', email).maybeSingle()
          if (!prof || !prof.is_member) continue
          const didSend = await sendSurveyIfStillEligible(prof.id, email)
          if (didSend) sentManual++
        }
        return json({ ok: true, manual: true, sentManual }, 200)
      }
    } catch (_e) {
      // Sin cuerpo JSON (o vacío): seguimos con el modo automático normal.
    }

    const now = Date.now()
    const from = new Date(now - SURVEY_MAX_DAYS * 86400000).toISOString()
    const to = new Date(now - SURVEY_MIN_DAYS * 86400000).toISOString()

    const { data: candidates, error } = await supabase
      .from('profiles')
      .select('id, email, member_since')
      .eq('is_member', true)
      .is('survey_15d_sent_at', null)
      .gte('member_since', from)
      .lte('member_since', to)
      .limit(MAX_PER_RUN)
    if (error) console.error('Error buscando candidatos para la encuesta:', error)

    let sent = 0
    if (isGoodSendHour(now)) {
      for (const p of candidates || []) {
        const didSend = await sendSurveyIfStillEligible(p.id, p.email)
        if (didSend) sent++
      }
    }

    return json({ ok: true, sent }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false }, 200)
  }
})

// Revisa is_member EN ESTE MOMENTO (no el valor que traía la lista de
// candidatos) y, si sigue siendo miembro, genera un token al azar,
// manda el correo con el link de la encuesta, y marca que ya se le
// mandó (para no repetirlo nunca).
async function sendSurveyIfStillEligible(userId: string, email: string | null): Promise<boolean> {
  if (!email) return false
  const { data: fresh } = await supabase.from('profiles').select('is_member').eq('id', userId).maybeSingle()
  if (!fresh || !fresh.is_member) return false

  const token = crypto.randomUUID()
  const surveyUrl = `${SURVEY_URL_BASE}?t=${token}`

  const okToSend = await sendViaResend(email, '¿Cómo va tu experiencia con Inglés con Leo? 📝', htmlEncuesta(surveyUrl))
  if (!okToSend) return false

  const { error } = await supabase
    .from('profiles')
    .update({ survey_15d_sent_at: new Date().toISOString(), survey_15d_token: token })
    .eq('id', userId)
  if (error) console.error(`Error marcando survey_15d_sent_at para ${userId}:`, error)
  return true
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
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

function htmlEncuesta(surveyUrl: string): string {
  return `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <div style="text-align:center; margin-bottom:18px;">
      <img src="https://inglesconleo.com/logo.png" alt="Inglés con Leo" width="56" height="56" style="border-radius:12px;">
    </div>
    <p style="color:#333; font-size:15px; margin:0 0 4px; text-align:center;">¡Hola! 👋</p>
    <h1 style="color:#253ECC; font-size:22px; margin:0 0 14px; text-align:center;">Ya llevas un par de semanas con nosotros</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Queremos que Inglés con Leo sea cada vez mejor, y tu opinión nos
      ayuda muchísimo a decidir qué mejorar primero. Son solo 3
      preguntas rápidas y un espacio para lo que quieras contarnos,
      no toma más de 2 minutos.
    </p>
    <p style="text-align:center; margin:28px 0 10px;">
      <a href="${surveyUrl}"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:14px 28px; border-radius:8px; font-size:15px; font-weight:bold; display:inline-block;">
        Responder la encuesta →
      </a>
    </p>
    <p style="color:#888; font-size:13px; text-align:center; margin:0;">
      No hace falta que inicies sesión, el link ya sabe quién eres.
    </p>
  </div>
</div>
`.trim()
}
