# Medición de renovaciones: propuesta técnica (no implementada)

Estado: PROPUESTA. No se modificó ningún webhook ni sistema de pago.

## Problema

Hoy se sabe quién es miembro (`profiles.is_member`, `member_since`), pero no hay un registro de **cada cobro**. Por eso no se pueden medir la tasa de renovación por mes de alta, la pérdida de miembros (churn), los ingresos recurrentes ni los cobros fallidos recuperados. Analytics no sirve para esto: las renovaciones ocurren entre la pasarela y el servidor, sin que el alumno abra la página.

## Qué ya llega a los webhooks (lectura del código)

| Pasarela | Eventos que ya se reciben | Renovación |
| --- | --- | --- |
| Stripe | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` | `customer.subscription.updated` cambia `current_period_end` cuando se renueva. Lo más claro sería escuchar también `invoice.paid` (con `billing_reason = subscription_cycle`), que hoy no está suscrito |
| PayPal | `BILLING.SUBSCRIPTION.ACTIVATED/CANCELLED/EXPIRED/SUSPENDED`, `PAYMENT.SALE.COMPLETED` | Cada `PAYMENT.SALE.COMPLETED` de una suscripción ya activa es una renovación |
| Mercado Pago | Notificaciones de `preapproval` y `payment` (`authorized`) | Cada pago autorizado de un preapproval ya activo es una renovación |

## Propuesta

1. Una tabla nueva, `membership_events`, solo con datos de negocio y sin datos personales:

| Columna | Contenido |
| --- | --- |
| `id` | Identificador interno |
| `user_id` | Cuenta (uuid interno, nunca el correo ni el nombre) |
| `provider` | stripe, paypal o mercadopago |
| `provider_event_id` | Id del evento de la pasarela, único: evita contar dos veces un evento reenviado |
| `tipo` | alta, renovacion, fallo_cobro, recuperado, cancelacion, reembolso |
| `plan` | mensual o anual |
| `monto` y `moneda` | Lo cobrado |
| `periodo_hasta` | Fin del período pagado |
| `ocurrio_en` | Fecha del evento según la pasarela |

   La tabla tiene RLS y no tiene permisos para el navegador; solo escriben los webhooks (service_role).
2. Una línea por webhook: después de procesar el evento como hoy, `insert ... on conflict (provider_event_id) do nothing`. Si la inserción falla, el webhook sigue funcionando igual (se registra en `log_app_error`). No cambia ninguna lógica de membresía.
3. Llenar el historial una vez, con las exportaciones de Stripe, PayPal y Mercado Pago (CSV), con un script local que solo inserta en `membership_events`.
4. Vistas SQL: renovación por mes de alta, churn mensual, ingresos recurrentes del mes, recuperación de cobros fallidos y tiempo promedio como miembro.

## Riesgos y cuidados

- Tocar los webhooks es delicado: el cambio va en una rama propia, con pruebas de cada evento simulado y con autorización expresa.
- Stripe necesita suscribirse a `invoice.paid` en su panel (cambio de configuración, requiere autorización).
- Los montos se guardan en la moneda original; la conversión a dólares se hace en las vistas.
