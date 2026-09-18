// ============================================================
// Inglés con Leo — Edge Function: upgrade-nudge-emails
//
// Manda como máximo 3 correos a cuentas que se crearon pero
// todavía NO tienen membresía (is_member = false):
//   Correo 1: 30-180 minutos después de crear la cuenta.
//   Correo 2: 2 días después de crear la cuenta (con 1 día extra
//             de margen de seguridad, ver nota de "ventanas" más
//             abajo; solo si recibió el correo 1 y sigue sin ser
//             miembro).
//   Correo 3: 7 días después de crear la cuenta (con 1 día extra
//             de margen de seguridad; solo si recibió el correo 2
//             y sigue sin ser miembro).
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
const EMAIL_2_MAX_DAYS = 3        // ventana de seguridad, ver nota arriba
const EMAIL_3_MIN_DAYS = 7
const EMAIL_3_MAX_DAYS = 8        // ventana de seguridad, ver nota arriba

const MAX_PER_RUN = 200 // tope de correos por corrida, por si acaso

Deno.serve(async (req: Request) => {
  try {
    // Modo manual (uso puntual desde el boton "Test" de Supabase, NO lo
    // usa el Cron): si el cuerpo de la peticion trae "manual_emails",
    // manda el correo indicado (1, 2 o 3) SOLO a esos correos exactos, sin
    // mirar las ventanas de tiempo de mas abajo. Sigue revisando
    // is_member=false antes de mandar cada uno (nunca le llega esto a
    // quien ya paga) y sigue marcando upgrade_email_N_sent_at, para que
    // el Cron normal no lo vuelva a mandar despues. Si el cuerpo viene
    // vacio (asi lo manda el Cron), esto no hace nada y sigue el modo
    // automatico normal como siempre.
    try {
      const body = await req.json()
      if (body && Array.isArray(body.manual_emails) && body.manual_emails.length) {
        const which: 1 | 2 | 3 = body.which === 3 ? 3 : body.which === 2 ? 2 : 1
        let sentManual = 0
        for (const email of body.manual_emails) {
          if (typeof email !== 'string' || !email) continue
          const { data: prof } = await supabase.from('profiles').select('id, is_member').eq('email', email).maybeSingle()
          if (!prof || prof.is_member) continue
          const didSend = await sendIfStillEligible(prof.id, email, which)
          if (didSend) sentManual++
        }
        return json({ ok: true, manual: true, which, sentManual }, 200)
      }
    } catch (_e) {
      // Sin cuerpo JSON (o vacio): seguimos con el modo automatico normal.
    }

    const now = Date.now()
    let sent1 = 0
    let sent2 = 0
    let sent3 = 0

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

    // ---- Correo 3 ----
    const e3From = new Date(now - EMAIL_3_MAX_DAYS * 86400000).toISOString()
    const e3To = new Date(now - EMAIL_3_MIN_DAYS * 86400000).toISOString()
    const { data: candidates3, error: err3 } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .eq('is_member', false)
      .not('upgrade_email_2_sent_at', 'is', null)
      .is('upgrade_email_3_sent_at', null)
      .gte('created_at', e3From)
      .lte('created_at', e3To)
      .limit(MAX_PER_RUN)
    if (err3) console.error('Error buscando candidatos correo 3:', err3)

    for (const p of candidates3 || []) {
      const didSend = await sendIfStillEligible(p.id, p.email, 3)
      if (didSend) sent3++
    }

    return json({ ok: true, sent1, sent2, sent3 }, 200)
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
async function sendIfStillEligible(userId: string, email: string | null, which: 1 | 2 | 3): Promise<boolean> {
  if (!email) return false
  const { data: fresh } = await supabase.from('profiles').select('is_member').eq('id', userId).maybeSingle()
  if (!fresh || fresh.is_member) return false

  const okToSend =
    which === 1 ? await sendEmail1(email) : which === 2 ? await sendEmail2(email) : await sendEmail3(email)
  if (!okToSend) return false

  const field =
    which === 1 ? 'upgrade_email_1_sent_at' : which === 2 ? 'upgrade_email_2_sent_at' : 'upgrade_email_3_sent_at'
  const { error } = await supabase.from('profiles').update({ [field]: new Date().toISOString() }).eq('id', userId)
  if (error) console.error(`Error marcando ${field} para ${userId}:`, error)
  return true
}

async function sendEmail1(to: string): Promise<boolean> {
  return sendViaResend(to, '¡Tu cuenta ya está lista! Desbloquea todo por $2 USD/mes (por tiempo limitado) 🎉', HTML_EMAIL_1)
}

async function sendEmail2(to: string): Promise<boolean> {
  return sendViaResend(to, 'Esto es todo lo que te estás perdiendo en Inglés con Leo 👀', HTML_EMAIL_2)
}

async function sendEmail3(to: string): Promise<boolean> {
  return sendViaResend(to, 'Tu inglés no mejora solo... ¿seguimos? 💬', HTML_EMAIL_3)
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
    <p style="color:#333; font-size:15px; margin:0 0 4px;">¡Hola! 👋</p>
    <h1 style="color:#253ECC; font-size:22px; margin:0 0 14px;">Tu cuenta ya está lista</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      ¡Qué bueno tenerte por aquí! Ya creaste tu cuenta en Inglés con Leo, y
      estás a un paso de tener acceso completo a todo lo que te va a ayudar
      a hablar inglés con confianza, sin importar tu nivel.
    </p>
    <p style="color:#253ECC; font-size:15px; font-weight:bold; margin:20px 0 8px;">
      Por solo $2 USD al mes desbloqueas todo esto (precio por tiempo
      limitado, luego sube):
    </p>
    <ul style="color:#333; font-size:15px; line-height:1.85; padding-left:20px; margin:0;">
      <li><strong>Práctica ilimitada</strong> en gramática, vocabulario, listening, writing y speaking, sin límite diario</li>
      <li><strong>Tu dashboard personalizado</strong>: progreso, racha y estadísticas por habilidad</li>
      <li><strong>Repaso automático de tus errores</strong>, para que no vuelvas a fallar lo mismo</li>
      <li><strong>Clases interactivas</strong> paso a paso</li>
      <li><strong>Preparación para TOEFL, IELTS y Cambridge (B2 First)</strong></li>
      <li><strong>Retos diarios</strong> para mantenerte motivado</li>
    </ul>
    <p style="text-align:center; margin:28px 0 10px;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:14px 28px; border-radius:8px; font-size:15px; font-weight:bold; display:inline-block;">
        Quiero desbloquear todo →
      </a>
    </p>
    <p style="color:#888; font-size:13px; text-align:center; margin:0 0 20px;">
      Menos de lo que cuesta un café. Cancela cuando quieras.
    </p>
    <p style="color:#888; font-size:13px; line-height:1.6; margin:0;">
      Si prefieres seguir practicando gratis por ahora, no hay problema: tu
      cuenta te espera cuando estés listo.
    </p>
  </div>
</div>
`.trim()

const HTML_EMAIL_2 = `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <p style="color:#333; font-size:15px; margin:0 0 4px;">¡Hola de nuevo! 👋</p>
    <h1 style="color:#253ECC; font-size:22px; margin:0 0 14px;">Esto es todo lo que te estás perdiendo</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      Tu cuenta en Inglés con Leo sigue ahí, esperándote. Por si no lo has
      visto, con la membresía (todavía a $2 USD al mes, precio por
      tiempo limitado) tienes acceso a esto:
    </p>
    <table role="presentation" width="100%" style="border-collapse:collapse; margin:20px 0;">
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #eee2cf;">
          <strong style="color:#253ECC;">🎯 Práctica sin límites</strong><br>
          <span style="color:#666; font-size:14px;">Gramática, vocabulario, listening, writing y speaking, cuantas veces quieras cada día.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #eee2cf;">
          <strong style="color:#253ECC;">📊 Tu dashboard personalizado</strong><br>
          <span style="color:#666; font-size:14px;">Progreso, racha y estadísticas por habilidad, para que veas tu avance real.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #eee2cf;">
          <strong style="color:#253ECC;">🔁 Repaso automático de tus errores</strong><br>
          <span style="color:#666; font-size:14px;">El sistema guarda lo que se te complica y te ayuda a repasarlo hasta que lo domines.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #eee2cf;">
          <strong style="color:#253ECC;">🎓 Clases interactivas</strong><br>
          <span style="color:#666; font-size:14px;">Situaciones reales (aeropuerto, restaurante, trabajo) paso a paso.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;">
          <strong style="color:#253ECC;">📝 Preparación para exámenes</strong><br>
          <span style="color:#666; font-size:14px;">TOEFL, IELTS y Cambridge (B2 First), con ejercicios enfocados en el examen real.</span>
        </td>
      </tr>
    </table>
    <p style="text-align:center; margin:28px 0 10px;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:14px 28px; border-radius:8px; font-size:15px; font-weight:bold; display:inline-block;">
        Activar mi membresía →
      </a>
    </p>
    <p style="color:#888; font-size:13px; text-align:center; margin:0 0 20px;">
      $2 USD al mes por tiempo limitado. Cancela cuando quieras.
    </p>
    <p style="color:#888; font-size:13px; line-height:1.6; margin:0;">
      Sin presión: tu cuenta te espera tal cual la dejaste, para cuando
      quieras darle un vistazo.
    </p>
  </div>
</div>
`.trim()

const HTML_EMAIL_3 = `
<div style="font-family: Arial, Helvetica, sans-serif; background-color:#faf6ef; padding:32px 16px;">
  <div style="max-width:520px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:32px; border:1px solid #eee2cf;">
    <p style="color:#333; font-size:15px; margin:0 0 4px;">¡Hola! 👋</p>
    <h1 style="color:#253ECC; font-size:22px; margin:0 0 14px;">Tu inglés no mejora solo</h1>
    <p style="color:#333; font-size:15px; line-height:1.6;">
      La constancia es lo que realmente hace la diferencia para aprender
      inglés, un poquito cada día suma más de lo que parece. Si todavía no
      te has decidido, aquí tienes algunas razones por las que vale la pena:
    </p>
    <ul style="color:#333; font-size:15px; line-height:1.85; padding-left:20px; margin:0;">
      <li>Cuesta <strong>$2 USD al mes</strong> por tiempo limitado, menos de lo que cuesta un café</li>
      <li>Puedes cancelar cuando quieras, sin compromisos ni contratos</li>
      <li>Practicas a tu ritmo, unos minutos al día son suficientes</li>
      <li>El sistema recuerda en qué te equivocas y te ayuda a repasarlo</li>
    </ul>
    <p style="color:#333; font-size:15px; line-height:1.6; margin:20px 0 0;">
      Y si por ahora prefieres seguir practicando gratis, también está
      perfecto. Lo importante es que sigas avanzando.
    </p>
    <p style="text-align:center; margin:28px 0 10px;">
      <a href="https://inglesconleo.com/miembros.html"
         style="background-color:#253ECC; color:#ffffff; text-decoration:none;
                padding:14px 28px; border-radius:8px; font-size:15px; font-weight:bold; display:inline-block;">
        Ver la membresía →
      </a>
    </p>
    <p style="color:#888; font-size:13px; text-align:center; margin:0 0 20px;">
      $2 USD al mes por tiempo limitado. Cancela cuando quieras.
    </p>
    <p style="color:#888; font-size:13px; line-height:1.6; margin:0;">
      Cualquier duda, solo responde este correo y con gusto te ayudo.
    </p>
  </div>
</div>
`.trim()
