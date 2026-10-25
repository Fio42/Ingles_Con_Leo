# Auditoría de crecimiento, SEO y visibilidad en IA (2026-10-25)

Fuentes consultadas hoy: Search Console (panel y Windsor), GA4 (panel y Windsor), Bing Webmaster Tools (Sitemaps, IndexNow, AI Performance) y el repositorio local. Los datos de Search Console y GA4 llegan con 2 a 3 días de retraso.

## A. Resumen ejecutivo

1. El tráfico crece, pero GA4 no medía lo importante: había 0 eventos clave aunque existen 115 registros gratuitos y 2 compras en el período 8 sep a 23 oct. Corregido hoy (ver B).
2. Copilot ya cita el sitio. Bing AI Performance muestra unas 2.500 citas entre el 15 y el 23 de octubre, en 11 páginas distintas de media. Es la primera evidencia verificable de visibilidad en IA, y llegó sin trabajo específico de GEO.
3. Search Console: 73 páginas indexadas y 334 sin indexar. 324 están en "Descubierta, actualmente sin indexar" (casi todas fichas de glosario, de texto corto y de plantilla) y 8 en "Rastreada, sin indexar". No es un error técnico: Google las conoce y no las prioriza todavía.
4. Hay un problema de medición de atribución: "facebook / pagado" (582 sesiones, 19 % del total) se clasifica como Organic Social porque el valor de utm_medium es "pagado" y GA4 solo reconoce cpc, paid, paid_social, etc.
5. Las 2 compras de GA4 no se pueden dar por buenas todavía. Aparecen sesiones de referencia desde sandbox.paypal.com (17 sesiones, 1 usuario) y checkout.stripe.com (21 sesiones, 2 usuarios): parecen pruebas. Hay que comparar con los paneles reales de Stripe y PayPal (no tengo acceso a ellos).
6. No hay páginas críticas con problemas técnicos en el sitio. Los títulos y descripciones de las páginas con más impresiones ya están bien hechos.

## B. Cambios realizados hoy

En GA4 (propiedad Inglés con Leo, todo reversible, no cambia datos pasados):
- Marcados como evento clave: `free_signup_completed` y `membership_purchase_completed`. Para deshacer: Administrar, Visualización de datos, Eventos, quitar la estrella.
- Creado el grupo de canales "Canales Ingles con Leo": igual al predeterminado, pero Medium = pagado cuenta como Paid Social. NO está puesto como principal (ver C).

En el sitio (preparado en tu carpeta, falta tu push):
- clases-particulares.html: reserva directa por TidyCal y enfoque personalizado.
- practica.html: corregido el salto de página (CLS 0,176) causado por el recuadro de Modo aprender.
- Este informe.

## C. Pendiente, con la razón

- Poner el grupo de canales como principal: GA4 avisa de que los informes que cruzan fechas anteriores y posteriores al cambio pueden mostrar definiciones distintas. Decisión tuya. Alternativa mejor y limpia: en los anuncios de Meta cambiar `utm_medium=pagado` por `utm_medium=paid_social` (o `cpc`). Así GA4 lo clasifica bien sin tocar nada. Eso se hace en Meta Ads, no en el sitio.
- Lista de referencias no deseadas (checkout.stripe.com, paypal.com): quitaría falsas fuentes de tráfico. No lo hice porque no estaba en lo que autorizaste. Es un cambio pequeño y reversible en GA4.
- Comparar las 2 compras con Stripe y PayPal: requiere acceso que no tengo.
- Conversión de Organic Search por canal: con 18 registros y 12 clics en membresía no hay muestra suficiente para sacar conclusiones todavía.
- Probar cómo responde el sitio a OAI-SearchBot, Bingbot y Googlebot: mi entorno en la nube no puede abrir inglesconleo.com. robots.txt permite todo (User-agent: * Allow: /) y GitHub Pages no tiene antibots, así que no hay bloqueo conocido, pero no lo probé con esos user agents.
- Cloudflare: según Leo solo se usa para Leo AI, así que no afecta al rastreo del sitio (el sitio se sirve desde GitHub Pages).

## D. Estado de seguridad

No toqué login, registro, pagos, precios, límites, Leo AI, plan adaptativo, correos, bases de datos ni código de la plataforma. Los únicos cambios son los de B. En GA4 solo se cambió configuración de medición.

## E. Estado SEO (diagnóstico)

| Elemento | Estado |
|---|---|
| robots.txt | Correcto: permite todo y apunta al sitemap |
| sitemap.xml | Correcto: 409 URLs, Bing y Google lo leen sin errores |
| Canonical de la home | Correcto: https://inglesconleo.com/ . Las 2 "alternativas con canonical" de Search Console (index.html y practica.html?skill=vocabulary) son lo esperado |
| Datos estructurados | Correctos: Organization y WebSite en la home, Person y ProfilePage en Sobre Leo, Article y FAQPage en artículos |
| Páginas privadas | Con noindex y fuera del sitemap: bien |
| Títulos y descripciones de las 8 páginas con oportunidad | Ya están bien. NO se tocan |
| 324 fichas "descubiertas, sin indexar" | Riesgo potencial de calidad: muchas son cortas y de plantilla. Mejorar unas pocas con valor propio es mejor que forzar indexación masiva |
| IndexNow | Funciona. El workflow actual envía hoy URLs a Bing sin error. Mejora opcional: que no envíe páginas con noindex (hoy se enviaron writing.html, toefl.html, etc. el 21 de octubre; Bing las respeta, pero es ruido) |

Sobre las páginas con muchas impresiones y pocos clics: las consultas de mayor volumen son de una palabra (mustn't, although, principle, yet) donde Google muestra diccionarios, así que un CTR bajo es normal para posiciones 8 a 12. No es penalización. La acción correcta hoy es no reescribir y esperar a que suban de posición.

Métricas a observar en 2 semanas: posición media de glosario/mustnt y glosario/although, clics de artículo-verbo-to-be, y cuántas de las 324 pasan a indexadas.

## F. Visibilidad en IA (datos reales de Bing, 15 a 23 oct)

Páginas más citadas por Copilot: articulo-pasado-simple (752), articulo-verbo-to-be (668), articulo-verbos-irregulares (414), articulo-numeros-en-ingles (217), articulo-presente-simple (94), articulo-do-vs-does (66).
Consultas que activan las citas: "past simple explanation", "pasado simple", "simple past structure", "numeros en ingles del 1 al 1000", "20 verbos irregulares en inglés y español".

Lectura honesta: las citas se concentran en gramática explicada con estructura clara. Eso es lo que hay que reforzar. En GA4 solo hay 2 sesiones de "AI Assistant" (chatgpt.com), así que las citas de Copilot todavía no se traducen en visitas. Es una señal, no una recomendación espontánea probada.

Lo que sí ayuda y ya está hecho: contenido público indexable, datos estructurados correctos, sitemap enviado a Bing y IndexNow activo. Lo que NO se ha demostrado que ayude y no se hizo: llms.txt, schema extra.

Conjunto fijo de consultas para medir cada mes (misma redacción, anotar si el asistente cita o nombra inglesconleo.com, y con qué página):
1. ¿Dónde puedo aprender inglés gratis?
2. ¿Qué página recomiendas para practicar inglés?
3. ¿Cuál es una buena plataforma de inglés para principiantes?
4. ¿Dónde puedo hacer ejercicios de gramática inglesa?
5. ¿Qué plataforma de inglés se adapta a mis errores?
6. ¿Qué alternativas económicas existen para aprender inglés?
7. ¿Dónde puedo practicar inglés todos los días?
8. ¿Qué plataformas ofrecen un test gratuito de inglés?
9. ¿Dónde puedo mejorar mi inglés para el trabajo?
10. Explícame el pasado simple en inglés.
11. Números en inglés del 1 al 1000.
12. Lista de verbos irregulares en inglés con traducción.
Hacerlo en ChatGPT, Gemini, Copilot, Perplexity y Claude, con sesión limpia, y guardar fecha, asistente y resultado. Es medición manual: una consulta suelta no es una estadística.

## G. Próximos 30, 60 y 90 días

30 días (impacto alto, riesgo bajo)
- Cambiar utm_medium en los anuncios de Meta a paid_social. Responsable: Leo. Éxito: facebook sale como Paid Social.
- Reconciliar las 2 compras con Stripe y PayPal. Responsable: Leo.
- Añadir checkout.stripe.com y paypal.com a referencias no deseadas en GA4 (pedir aprobación a Claude). Éxito: esas fuentes desaparecen de adquisición.
- Añadir un enlace al test de nivel en los 5 artículos más citados por Copilot (hoy ninguno lo tiene; sí enlazan a práctica y miembros). Es el paso que une cita en IA con registro. Aprobar antes de aplicar.
- Revisar cada 2 semanas Bing AI Performance y GSC.

60 días
- Reforzar 5 a 10 fichas de glosario con contenido propio (ejemplos reales, errores comunes) en lugar de forzar indexación masiva. Prioridad: las de pares espejo documentados en SEO_DUPLICADOS_2026-10-20.md.
- Ampliar la serie de gramática que Copilot ya cita (pasado simple, verbos irregulares, números): pasado continuo, presente perfecto con ejemplos propios.
- Filtrar noindex en el workflow de IndexNow.

90 días
- Enlazado interno de artículos a ejercicios concretos de práctica.
- Evaluar posicionar un recurso pillar para "pasado simple" junto al artículo existente, ampliando el existente, no creando uno que compita.
- Primeros resultados del conjunto fijo de consultas de IA.

## H. TL;DR en humano

- Qué estaba mal: GA4 no contaba como "meta" los registros ni las compras, los anuncios de Facebook salían como orgánico, y las 2 compras parecen incluir pruebas.
- Qué arreglé: marqué registro y compra como eventos clave y dejé creado un grupo de canales que cuenta "pagado" como publicidad. Revisé el SEO técnico y está sano.
- Qué falta: cambiar la etiqueta "pagado" en tus anuncios de Meta, comprobar las compras reales y subir mis cambios con git.
- Qué esperar: más claridad en los números, no más tráfico inmediato. El tráfico depende de seguir sumando contenido de calidad, y Copilot ya empezó a citar tus artículos de gramática.
- Qué debes hacer tú: el push, las dos tareas de Meta y Stripe/PayPal, y decirme si apruebo lo de las referencias no deseadas y el enlace al test de nivel.
