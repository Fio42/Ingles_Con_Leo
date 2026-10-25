# Plan de seguimiento (desde 2026-10-25)

Objetivo: ver con datos si el sitio crece en visibilidad, citas en IA, registros y compras, sin mezclar métricas que no son comparables. Línea base: informe SEO_CRECIMIENTO_2026-10-25.md.

## Línea base (ya medida)

| Métrica | Valor base | Fuente | Período |
|---|---|---|---|
| Impresiones en Google | 13.073 | Search Console | 7 sep a 23 oct |
| Clics en Google | 137 | Search Console | 7 sep a 23 oct |
| CTR | 1,05 % | Search Console | 7 sep a 23 oct |
| Posición media | 11,7 | Search Console | 7 sep a 23 oct |
| Páginas indexadas / sin indexar | 73 / 334 | Search Console, Páginas | 25 oct |
| Sesiones | 3.077 | GA4 | 8 sep a 23 oct |
| Sesiones Organic Search | 432 (google 251, bing 139) | GA4 | 8 sep a 23 oct |
| Registros gratis (free_signup_completed) | 115 | GA4 | 8 sep a 23 oct |
| Clics en CTA de membresía | 57 | GA4 | 8 sep a 23 oct |
| Compras (membership_purchase_completed) | 2 (disparadas solo tras confirmar el webhook; sin conciliar con Stripe/PayPal) | GA4 | 8 sep a 23 oct |
| Sesiones de asistentes de IA | 2 | GA4 | 8 sep a 23 oct |
| Citas de Copilot | ~2.500, 11 páginas de media | Bing AI Performance | 15 a 23 oct |

## Qué se mide, dónde y cada cuánto

Semanal (10 minutos, lunes):
- Search Console: impresiones, clics, CTR y posición. Mira también las 8 páginas con oportunidad y las fichas de glosario con más impresiones.
- Bing AI Performance: citas totales, páginas citadas y consultas de fundamentación nuevas.
- GA4: sesiones por canal, free_signup_completed y membership_cta_clicked.
- Regla: comparar siempre períodos de la misma duración y no sacar conclusiones con menos de 14 días.

Quincenal:
- Search Console, Páginas: cuántas de las 324 "descubiertas, sin indexar" pasan a indexadas.
- SITE_HEALTH_REPORT.md (ya se genera solo): LCP, CLS y accesibilidad.

Mensual:
- Conjunto fijo de 12 consultas en ChatGPT, Gemini, Copilot, Perplexity y Claude (lista en SEO_CRECIMIENTO_2026-10-25.md, sección F). Anotar fecha, asistente, si cita inglesconleo.com y qué página. Es medición manual, no estadística.
- Conciliar compras de GA4 con los paneles de Stripe y PayPal.

## Reglas para no engañarse

- Registros, clics de CTA y compras son eventos, no personas únicas ni dinero cobrado.
- Una cita en IA no es una visita ni una recomendación espontánea: se miden por separado.
- Impresiones suben antes que clics en un sitio nuevo. No reescribir una página solo porque tiene pocos clics si su posición sigue mejorando.
- Los eventos clave en GA4 cuentan desde el 25 oct 2026, no cambian el pasado.
- Cualquier cambio en el sitio se anota en DEVLOG.txt con fecha para poder relacionarlo con un cambio de métricas, sin presentarlo como causa.

## Alertas (mirar la causa antes de actuar)

- Clics o impresiones bajan más de 30 % durante 2 semanas seguidas.
- Las citas de Copilot bajan de 100 al día de forma sostenida.
- free_signup_completed baja a 0 durante 3 días (posible fallo del registro o del evento).
- Aparece una página privada en el informe de Páginas indexadas de Search Console.

## Experimentos programados (uno a la vez)

1. Enlace al test de nivel en los 6 artículos más citados por Copilot (esta rama). Medir 4 semanas: clics a test-de-nivel-de-ingles.html desde esos artículos (GA4, evento level_test_started con página de origen) y registros.
2. Cambiar utm_medium de los anuncios de Meta a paid_social. Medir: facebook sale como Paid Social en GA4.
3. Reforzar 5 a 10 fichas de glosario con contenido propio. Medir indexación a 4 semanas.
