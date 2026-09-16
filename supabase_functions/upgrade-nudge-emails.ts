// ============================================================
// Inglés con Leo — Edge Function: upgrade-nudge-emails
//
// Manda como máximo 2 correos a cuentas que se crearon pero
// todavía NO tienen membresía (is_member = false):
//   Correo 1: 30-180 minutos después de crear la cuenta.
//   Correo 2: 2-10 días después de crear la cuenta (solo si
//             recibió el correo 1 y sigue sin ser miembro).
//
// No es una plataforma nueva de emails: reutiliza exactamente el
// mismo Resend y el mismo remitente (hola@inglesconleo.com) que ya
// usan mp-webhook.ts, stripe-webhook.ts y paypal-webhook.ts para el
// correo de bienvenida.
//
// Cómo se ejecuta sola: no la llama el navegador de nadie. La
// dispara el Cron de Supabase (pg_cron + pg_net) cada 30 minutos,
// según el SQL que está en supabase_schema.sql. Cada vez que corre,
// revisa profiles y decide sola a quién le toca cada correo — no
// hace falta ningún cambio en el resto del sitio.
//
// Ventanas de seguridad (MAX_MINUTES / MAX_DAYS): si por lo que sea
// el Cron dejó de correr por varias horas o días, esto evita mandar
// el correo 1 "recién creaste tu cuenta" varios días tarde, o el
// correo 2 muchísimo después de lo pensado. Fuera de esas ventanas,
// simplemente no se manda nada (no se "acumula" para mandarlo después).
//
// Revisa is_member justo antes de mandar cada correo (no antes), así
// que si alguien paga entre medio, no le llega nada de esto.
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const EMAIL_1_MIN_MINUTES = 30
const EMAIL_1_MAX_MINUTES = 180   // ventana de seguridad, ver nota arriba
const EMAIL_2_MIN_DAYS = 2
const EMAIL_2_MAX_DAYS = 10       // ventana de seguridad, ver nota arriba

const MAX_PER_RUN = 200 // tope de correos por corrida, por si acaso

Deno.serve(async (req: Request) => {
  try {
    const now = Date.now()
    let sent1 = 0
    let sent2 = 0

    // ---- Correo 1 ----
    const e1From = new Date(now - EMAIL_1_MAX_MINUTES * 60000).toISOString()
    const e1To = new Date(now - EMAIL_1_MIN_MINUTES * 60000).toISOString()
    const { data: candidates1, error: err1 } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('is_member', false)
      .is('upgrade_email_1_sent_at', null)
      .gte('created_at', e1From)
      .lte('created_at', e1To)
      .limit(MAX_PER_RUN)
    if (err1) console.error('Error buscando candidatos correo 1:', err1)

    for (const p of candidates1 || []) {
      const didSend = await sendIfStillEligible(p.id, p.email, 1)
      if (didSend) sent1++
    }

    // ---- Correo 2 ----
    const e2From = new Date(now - EMAIL_2_MAX_DAYS * 86400000).toISOString()
    const e2To = new Date(now - EMAIL_2_MIN_DAYS * 86400000).toISOString()
    const { data: candidates2, error: err2 } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('is_member', false)
      .not('upgrade_email_1_sent_at', 'is', null)
      .is('upgrade_email_2_sent_at', null)
      .gte('created_at', e2From)
      .lte('created_at', e2To)
      .limit(MAX_PER_RUN)
    if (err2) console.error('Error buscando candidatos correo 2:', err2)

    for (const p of candidates2 || []) {
      const didSend = await sendIfStillEligible(p.id, p.email, 2)
      if (didSend) sent2++
    }

    return json({ ok: true, sent1, sent2 }, 200)
  } catch (e) {
    console.error(e)
    return json({ ok: false }, 200)
  }
})

// Revisa is_member EN ESTE MOMENTO (no el valor que traía la lista
// de candidatos, que pudo quedar viejo mientras se mandaban los
// correos anteriores de esta misma corrida) y, si sigue sin ser
// miembro, manda el correo que corresponde y marca la columna de
// "ya se mandó" para no repetirlo nunca.
async function sendIfStillEligible(userId: string, email: string | null, which: 1 | 2): Promise<boolean> {
  if (!email) return false
  const { data: fresh } = await supabase.from('profiles').select('is_member').eq('id', userId).maybeSingle()
  if (!fresh || fresh.is_member) return false

  const okToSend = which === 1 ? await sendEmail1(email) : await sendEmail2(email)
  if (!okToSend) return false

  const field = which === 1 ? 'upgrade_email_1_sent_at' : 'upgrade_email_2_sent_at'
  const { error } = await supabase.from('profiles').update({ [field]: new Date().toISOString() }).eq('id', userId)
  if (error) console.error(`Error marcando ${field} para ${userId}:`, error)
  return true
}

async function sendEmail1(to: string): Promise<boolean> {
  return sendViaResend(to, 'Tu cuenta ya está lista - Inglés con Leo', HTML_EMAIL_1)
}

async function sendEmail2(to: string): Promise<boolean> {
  return sendViaResend(to, 'Todo lo que te estás perdiendo en Inglés con Leo', HTML_EMAIL_2)
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

const HTML_EMAIL_1 = `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <h1 style="color:#253ECC; font-size:22px; margin-top:0;">Tu cuenta ya está lista</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Creaste tu cuenta en Inglés con Leo. Cuando quieras, puedes desbloquear
      todas las herramientas (práctica ilimitada, tus errores, tu progreso,
      clases interactivas y preparación para TOEFL/IELTS) por $2 USD al mes.
    </p>
    <p style="text-align:center; margin:28px 0;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:12px 24px; border-radius:8px; font-size:15px; display:inline-block;">
        Ver mi cuenta
      </a>
    </p>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Si ya no te interesa, no pasa nada: puedes seguir practicando gratis
      cuando quieras.
    </p>
  </div>
</div>
`.trim()

const HTML_EMAIL_2 = `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <h1 style="color:#253ECC; font-size:22px; margin-top:0;">Todo lo que te estás perdiendo</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Con la membresía de Inglés con Leo ($2 USD al mes) tienes:
    </p>
    <ul style="color:#333; font-size:15px; line-height:1.8; padding-left:20px;">
      <li>Práctica ilimitada en gramática, vocabulario, listening, writing y speaking</li>
      <li>Repaso automático de tus errores</li>
      <li>Tu progreso y estadísticas guardados</li>
      <li>Clases interactivas</li>
      <li>Preparación para TOEFL, IELTS y otros exámenes</li>
    </ul>
    <p style="text-align:center; margin:28px 0;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:12px 24px; border-radius:8px; font-size:15px; display:inline-block;">
        Activar membresía
      </a>
    </p>
    <p style="color:#333; font-size:13px; color:#888;">
      Este es el último correo de este tipo que te mandamos. Si más adelante
      cambias de opinión, tu cuenta te espera.
    </p>
  </div>
</div>
`.trim()
