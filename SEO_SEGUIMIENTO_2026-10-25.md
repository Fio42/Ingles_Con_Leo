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

## Oportunidades detectadas (datos del 7 sep al 23 oct, sin cambios hechos en estas páginas)

### Glosario: qué hacer con las 324 fichas "descubiertas, sin indexar"

- De ~336 fichas, solo 39 reciben impresiones (11 %). El resto no tiene demanda medible todavía, y de eso no se concluye que estén mal: Google decide indexar según prioridad.
- No se elimina ni se desindexa nada. Antes ya se documentó que 277 fichas tienen menos de 150 palabras, 192 usan texto de plantilla y 8 pares son casi duplicados (ver SEO_DUPLICADOS_2026-10-20.md, pendiente de decisión de Leo).
- Mejores oportunidades reales, en este orden (ya indexadas, posición 4 a 18): mustnt (1.840 imp, pos 8,9), although (1.177, 12,3), principal-vs-principle (315, 9,8), yet (151, 10,0), little-vs-a-little (128, 10,2), find-out (119, 10,4), bored-vs-boring (118, 18,2), actually (101, 11,1), money-vs-cash (95, pos 4,8 y 0 clics), already (89), desert-vs-dessert (87), would-rather (77, 22,3), look-for (69), give-up (57, 9,5).
- Acción sugerida, una a la vez y midiendo: que la primera frase de cada ficha responda directamente la búsqueda ("X significa ..."), añadir un enlace desde un artículo relacionado y no cambiar URL ni título si ya posicionan. money-vs-cash es el caso más claro: posición 4,8 y sin clics, revisar su título.
- Para las no indexadas, la palanca más barata es el enlazado interno desde artículos con tráfico (hoy 272 de 336 fichas no tienen ningún enlace desde artículos). Mejorar unas 10 fichas manuales con contenido propio, no forzar indexación.

### Bing AI Performance: qué consultas aprovechar (15 a 23 oct)

Citas altas con cuota baja = Copilot ya usa el sitio pero hay otros que se citan más. Son las mejores candidatas para mejorar la respuesta inicial de la página, sin reescribirla:
- "pasado simple": 88 citas, cuota 3,6 % (articulo-pasado-simple)
- "pasado simple en ingles": 28 citas, cuota 8,4 %
- "when do we use present simple": 16 citas, cuota 7,1 % (articulo-presente-simple)
- "numeros en ingles del 1 al 1000": 70 citas, cuota 9,3 % (articulo-numeros-en-ingles)
- "verbs in past simple": 24 citas, cuota 15,8 %
Consultas donde ya hay buena cuota (mantener sin tocar): "past simple explanation" (66,7 %), "past simple ingles" (58,8 %), "structure past simple" (42,9 %), "20 verbos irregulares en inglés y español" (41,4 %).
Detalle útil: varias consultas están en inglés ("past simple explanation", "simple past structure"), así que un resumen corto con los términos en inglés al inicio de cada artículo puede ayudar. Hacerlo en un artículo, medir 4 semanas y copiar solo si mejora.
Revisar cada semana la pestaña de consultas nuevas de Bing AI Performance: aparecen oportunidades antes que en Search Console.

### Pendiente de decisión (no hecho a propósito)

- Excluir checkout.stripe.com y paypal.com de las referencias de GA4: la revisión indica que es seguro (1 persona probando en septiembre), pero ese cambio de configuración del tag no estaba dentro de lo autorizado y quedó sin hacer.
- Poner el grupo de canales personalizado como principal, o cambiar utm_medium a paid_social en Meta.
- Validación del grupo de canales en un reporte: GA4 solo muestra los grupos no principales en Exploraciones, no en el informe de Adquisición. La lógica es: Paid Social se evalúa antes que Organic Social y ahora incluye Medium = pagado.
