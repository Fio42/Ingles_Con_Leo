# Respaldo de correo: Resend (activo) y Brevo (reserva)

Estado (2026-11-15): TODO sale por Resend. Brevo es solo reserva y YA ESTA LISTO: cuenta, dominio y remitente verificados,
llave `BREVO_API_KEY` guardada (permiso solo "Emails transaccionales"), `MAIL_PROVIDER` = `brevo`, `mail-relay` y los 4 ganchos
desplegados. Mientras NO exista el secreto `MAIL_API_URL`, nada pasa por el relevo y todo sale directo por Resend.
Prueba real (2026-11-15): mail-relay -> Brevo -> fiocchettaleandro@gmail.com, Brevo reporto "delivered".

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

## Activar el respaldo (si Resend te pausa o banea)
UN solo cambio: Supabase -> Edge Functions -> Secrets -> Add new secret:
- Nombre: `MAIL_API_URL`
- Valor: `https://iviksyhzhiygkuaojply.supabase.co/functions/v1/mail-relay`
Desde ese momento los correos de acceso/bienvenida (Mercado Pago, PayPal, Stripe), el aviso de cobro fallido y la recuperacion de
contraseña salen por Brevo. Los bloqueos por direccion se respetan igual (tabla email_suppressions, segun el flujo).

## Revertir
Supabase -> Edge Functions -> Secrets -> borrar `MAIL_API_URL`. Vuelve todo a Resend de inmediato. (`MAIL_PROVIDER` se queda en `brevo`: solo lo usa el relevo.)

## Que NO cubre el respaldo
Marketing, reactivacion, racha, encuestas, seguimientos y avisos internos siguen directo por Resend: si Resend se pausa, esos se detienen.
La confirmacion de cuenta NO existe: "Confirm email" esta APAGADO en Supabase Auth (verificado 2026-11-15 con un registro real: el alta devuelve sesion al instante y no manda correo).

## Comprobacion automatica (cada 2 meses)
Cron `inglesconleo-brevo-check` (jobid 17, `0 15 1 */2 *`, meses 1,3,5,7,9,11: nunca mas de 62 dias entre corridas) llama a la funcion `brevo-check`
con la llave interna de Vault. Hace una llamada a Brevo y manda un correo de prueba a inglesconleoreal@gmail.com POR `mail-relay`.
Si falla, manda una alerta por Resend a inglesconleoreal@gmail.com. Brevo borra las llaves tras 90 dias sin uso y expiran el 15 nov 2027:
antes de esa fecha crear otra llave (Brevo -> Configuracion -> SMTP y API -> Claves API, solo "Emails transaccionales") y reemplazar el secreto `BREVO_API_KEY`.
Prueba manual a un buzon permitido (no manda a alumnos): SQL Editor ->
`select net.http_post(url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/brevo-check', headers := jsonb_build_object('Content-Type','application/json','x-internal-secret',(select decrypted_secret from vault.decrypted_secrets where name='internal_functions_secret')), body := jsonb_build_object('event','test','to','fiocchettaleandro@gmail.com'), timeout_milliseconds := 40000);`
y luego leer `net._http_response`.

## Notas tecnicas
- Brevo exige `name` en `replyTo`: el relevo lo completa con "Inglés con Leo" si falta (corregido tras la primera prueba en vivo).
- La llave de Brevo es restringida: `/v3/account` responde 403 aunque sirva; solo un 401 significa llave invalida.
