# Línea base SEO — glosario

Fecha de captura: 2026-10-11.

## Alcance técnico

- 336 fichas propias y un índice: 337 URLs del glosario.
- Las 337 están presentes en sitemap, tienen canonical local correcto, no tienen `noindex`, no están bloqueadas por robots y tienen enlace interno desde el índice.
- La comprobación HTTP remota desde el entorno de trabajo no pudo completarse por restricción de red (`fetch failed`); no debe interpretarse como un fallo del sitio.

## Search Console

Propiedad: `https://inglesconleo.com/`.

Ventana disponible: 2026-09-11 a 2026-10-08. La misma información aparece al consultar desde 2026-01-01: las fichas fueron publicadas el 4 y 5 de octubre, por lo que no existe una tendencia madura.

| URL | Clics | Impresiones | CTR | Posición media |
| --- | ---: | ---: | ---: | ---: |
| `/glosario/although/` | 1 | 333 | 0.30% | 12.93 |
| `/glosario/mustnt/` | 0 | 231 | 0.00% | 9.93 |
| `/glosario/principal-vs-principle/` | 0 | 95 | 0.00% | 9.85 |
| `/glosario/bored-vs-boring/` | 0 | 24 | 0.00% | 13.88 |
| `/glosario/desert-vs-dessert/` | 0 | 19 | 0.00% | 12.26 |

Las cinco URLs todavía están en fase de descubrimiento: la mayoría de impresiones ocurrió entre el 5 y el 8 de octubre. Solo 16 fichas registraron impresiones; las restantes no deben clasificarse como no indexadas solo por no tener impresiones.

## Piloto y evaluación

Piloto: `/glosario/principal-vs-principle/`. Se mejora la respuesta para la intención específica sin cambiar URL, canonical, schema, sitemap, audio ni CTA.

Evaluar a las 4 y 8 semanas contra esta línea base:

1. Search Console por URL: clics, impresiones, CTR y posición para las consultas que contienen `principal` o `principle`.
2. Comparar con el grupo de control sin cambios: `mustnt`, `bored-vs-boring` y `desert-vs-dessert`.
3. Medir registros atribuidos a la landing del glosario y al CTA de práctica. Esta conexión de Search Console no tiene una propiedad de GA4 enlazada, por lo que el valor inicial de registros no está disponible aquí. Antes de atribuir impacto en usuarios registrados, instrumentar o consultar el evento de registro completado con URL de entrada y término del glosario.

No interpretar movimientos de pocos días como resultado. Mantener el piloto si aumenta clics o CTR sin deterioro sostenido de posición frente al control; revisar contenido o snippet si, tras ocho semanas, recibe más impresiones pero continúa sin clics.
