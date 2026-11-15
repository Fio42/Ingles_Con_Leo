# Respaldo de correo: Resend (activo) y Brevo (reserva)

Estado (2026-11-15): TODO sale por Resend. Brevo es solo reserva. Hasta que Brevo tenga cuenta, dominio verificado y llave,
la funcion `mail-relay` y el gancho `MAIL_API_URL` NO estan desplegados ni en uso.

## Por donde sale cada correo hoy
| Correo | Funcion | Proveedor | Flujo del relevo |
|---|---|---|---|
| Acceso / bienvenida tras pagar | mp-webhook, paypal-webhook, stripe-webhook | Resend | critical |
| Aviso de cobro fallido | stripe-webhook | Resend | transactional |
| Recuperacion de contraseña | send-password-reset | Resend | critical |
| Confirmacion de cuenta (Auth) | Supabase Auth | SMTP personalizado APAGADO: correo integrado de Supabase, NO Resend | no aplica |
| Entrega del libro | libro-download | no manda correo: devuelve el enlace en la pagina de gracias | no aplica |
| Marketing, reactivacion, racha, encuesta, seguimientos | upgrade-nudge-emails, streak-reminder-email, survey-15d-email | Resend directo (no pasan por el relevo: si Resend se pausa, se pausan) | marketing |
| Avisos internos | error-alert, leobot-notify, notify-new-comment | Resend directo | no critico |

## Bloqueos por direccion (tabla email_suppressions)
- critical: nunca se bloquea.
- transactional: solo si hay rebote permanente, queja o supresion.
- marketing (o sin cabecera): cualquier registro, incluida la pausa por rebote temporal.

## Cambio manual a Brevo (cuando exista cuenta)
1. Brevo: dominio inglesconleo.com verificado (registros DNS), remitente hola@inglesconleo.com, llave API v3.
2. Supabase -> Edge Functions -> Secrets: crear `BREVO_API_KEY` (la llave de Brevo) y `MAIL_PROVIDER` = `brevo`.
3. Desplegar `mail-relay` (sin verify-jwt) y las 4 funciones criticas con el gancho.
4. Para activar: crear el secreto `MAIL_API_URL` = `https://iviksyhzhiygkuaojply.supabase.co/functions/v1/mail-relay` (reinicia solas las funciones al guardar).
5. Para volver a Resend: borrar el secreto `MAIL_API_URL` (o poner `MAIL_PROVIDER` = `resend`).
