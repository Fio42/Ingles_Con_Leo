# PayPal anual ($20 USD cada 12 meses): orden de despliegue

Estado: listo para revision local. Nada desplegado, nada subido, boton anual apagado.

## Lo que falta antes de empezar (lo hace Leo)
1. En PayPal (el mismo negocio y modo, live) crear el Plan anual: $20.00 USD, cada 12 meses (intervalo YEAR, cuenta 1), sin periodo de prueba, cobro automatico. Copiar su ID (empieza con `P-`).
2. Idealmente probarlo antes en PayPal Sandbox con un plan anual de prueba (ver "Prueba en sandbox").

## Migracion nueva (paso 0, ANTES de desplegar el webhook)
`supabase/migrations/20261119180000_paypal_annual_access_until.sql`: agrega 2 columnas vacias (`paypal_access_until`, `paypal_access_sub`) y una tarea cada 15 min (`suspend_expired_paypal_annual`) que quita el acceso a quien cancelo el anual cuando llega su fecha pagada. No cambia el acceso de nadie al aplicarse. Ejecutarla en Supabase > SQL Editor. Si el webhook se desplegara sin ella, al cancelar un anual se aplica la regla de siempre (quita el acceso) y queda un aviso critico en el registro de errores.

## Variables nuevas en Supabase (Edge Functions > Secrets)
- `PAYPAL_PLAN_ID_ANNUAL` = ID del plan anual. Las dos funciones la leen.
- `PAYPAL_ANNUAL_CHECKOUT` = `on` SOLO al final (paso 5). Sin ella (o con otro valor) el servidor rechaza crear altas anuales. La lee solo `paypal-checkout`; el webhook no.
- No se cambia ni se toca `PAYPAL_PLAN_ID` (mensual), `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE` ni las credenciales.

## Orden exacto
0. Aplicar la migracion de arriba y comprobar que existe la tarea: `select jobname from cron.job where jobname = 'inglesconleo-paypal-annual-expiry';`
1. Crear el plan anual en PayPal y guardar su ID.
2. Supabase: agregar el secreto `PAYPAL_PLAN_ID_ANNUAL`. NO agregar todavia `PAYPAL_ANNUAL_CHECKOUT`.
3. Desplegar las funciones, primero el webhook y luego el checkout:
   `supabase functions deploy paypal-webhook` y `supabase functions deploy paypal-checkout`
   (si hoy se despliegan con otras banderas, usar las mismas de siempre, por ejemplo `--no-verify-jwt` en el webhook).
4. Comprobar el MENSUAL en produccion: abrir `miembros.html` con una cuenta de prueba, "Pagar con PayPal" en plan mensual, confirmar que llega a PayPal con $2 USD (parar antes de pagar si no quieren un cargo real), y revisar en Supabase > Edge Functions > Logs que `paypal-checkout` y `paypal-webhook` no muestren errores nuevos. Confirmar que una suscripcion mensual ya existente sigue igual (su `is_member` y `next_renewal_at` no cambian).
5. Habilitar el anual al final, en este orden:
   a. Secreto `PAYPAL_ANNUAL_CHECKOUT` = `on`.
   b. En `miembros.html` cambiar `const PAYPAL_ANNUAL_ENABLED = false;` a `true`, commit y push (GitHub Pages publica en minutos; los navegadores cargan `backend.js?v=20261119a`).
   c. Una compra real anual de prueba ($20) con una cuenta propia y cancelarla despues, o validar antes en sandbox.

## Como ocultar el boton anual despues (si hay que retirarlo)
1. En `miembros.html` poner `PAYPAL_ANNUAL_ENABLED = false`, push.
2. Poner `PAYPAL_ANNUAL_CHECKOUT` en `off` (o borrarlo).
3. NO borrar `PAYPAL_PLAN_ID_ANNUAL` ni volver a desplegar el webhook sin las ramas anuales: el webhook debe seguir atendiendo renovaciones y cancelaciones de quienes ya contrataron el anual.

## PRUEBAS EN SANDBOX: PENDIENTES (no se pudo hacer desde aqui)
Configuracion que falta: credenciales PayPal Sandbox (Client ID y Secret de una app sandbox), un plan mensual y uno anual ($20 / 12 meses) sandbox, un webhook sandbox apuntando a `paypal-webhook` con su `PAYPAL_WEBHOOK_ID`, y una cuenta compradora sandbox. Lo ideal es un proyecto Supabase de pruebas con la migracion aplicada, o los secretos sandbox temporales. Pendientes de verificar ahi:
- [ ] Compra anual de punta a punta: el webhook procesa el pago, `is_member=true`, `next_renewal_at` = fecha informada por PayPal (a 12 meses).
- [ ] Renovacion de una suscripcion MENSUAL creada ANTES del parche (crearla con la version actual en produccion/sandbox, desplegar, y simular el cobro): el webhook refresca `next_renewal_at` y no toca nada mas.
- [ ] Cancelar el anual: el acceso sigue y `paypal_access_until` = la fecha pagada; al pasar la fecha, la tarea lo quita (se puede forzar poniendo la fecha en el pasado y ejecutando `select public.suspend_expired_paypal_annual();`).
- [ ] Reenvio del webhook (PayPal Developer > Webhooks > Resend) y caso sin `PAYPAL_PLAN_ID_ANNUAL`.
- [ ] Stripe y Mercado Pago abren su flujo.
Todo lo anterior ya se verifico con PayPal simulado (ver tools/tests/paypal-anual.test.js), pero la tarea SQL solo se reviso por lectura: no se ejecuto contra una base real.

## Prueba en sandbox (detalle)
Hace falta `PAYPAL_MODE=sandbox`, credenciales sandbox, un plan mensual y uno anual sandbox y un webhook sandbox. Lista: alta mensual; renovacion y cancelacion de una suscripcion mensual creada antes del cambio; compra anual y su cancelacion; reenvio del webhook (PayPal Developer > Webhooks > Resend); anual sin `PAYPAL_PLAN_ID_ANNUAL` (debe responder 400 y el mensual seguir); Stripe y Mercado Pago abren su flujo.

## Reglas que conviene saber
- Cancelar el ANUAL en PayPal detiene la renovacion y conserva el acceso hasta la fecha ya pagada (la `next_renewal_at` guardada al confirmar el cobro). Si no hay fecha futura guardada se quita el acceso, como siempre. Suspender o expirar el anual, y cancelar el MENSUAL, siguen quitando el acceso al instante (sin cambios).
- Si quien cancelo el anual contrata despues un mensual, la tarea no le quita el mensual (solo actua si la cuenta sigue ligada a la misma suscripcion anual).
- Quien cancelo el anual y aun tiene acceso no puede abrir otro anual de PayPal hasta que venza (el servidor responde 409).
- Quien ya es miembro (Stripe, MP o PayPal) no puede abrir un anual de PayPal: el servidor responde 409 y el sitio muestra un aviso. Para cambiar de plan debe cancelar antes.
- Si PayPal tarda en mostrar el cobro, el webhook responde 503 y PayPal reintenta solo; el acceso se da cuando el cobro de $20 USD aparece confirmado.
