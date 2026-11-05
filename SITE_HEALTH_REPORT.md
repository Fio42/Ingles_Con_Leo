# SITE HEALTH — 2026-11-05

🔴 Críticos: 2
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 74 de 76

## Las 3 cosas que más conviene revisar

🔴 https://inglesconleo.com/glosario/world/ 🆕 NUEVO
Responde HTTP 503.
Impacto: Visitantes y Google encuentran un error en vez de contenido.
Acción: Arreglar o quitar los enlaces hacia esta URL.

🔴 https://inglesconleo.com/glosario/world/ 🆕 NUEVO
Está en sitemap.xml pero responde HTTP 503.
Impacto: Google gasta rastreo en una URL rota que además está "recomendada" por ti mismo.
Acción: Quitarla del sitemap o arreglar la página.

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🔴 https://inglesconleo.com/glosario/world/ 🆕 NUEVO
Responde HTTP 503.
Impacto: Visitantes y Google encuentran un error en vez de contenido.
Acción: Arreglar o quitar los enlaces hacia esta URL.

🔴 https://inglesconleo.com/glosario/world/ 🆕 NUEVO
Está en sitemap.xml pero responde HTTP 503.
Impacto: Google gasta rastreo en una URL rota que además está "recomendada" por ti mismo.
Acción: Quitarla del sitemap o arreglar la página.

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

Ninguna.
</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 90/100 | 100/100 | 100/100 | 100/100 | 1140ms | 0.002 | 400ms |
| Práctica (gratis) | 88/100 | 100/100 | 93/100 | 100/100 | 1137ms | 0.002 | 463ms |
| Artículos (índice) | 94/100 | 100/100 | 96/100 | 100/100 | 1138ms | 0.004 | 287ms |
| Artículo: verbo to be | 90/100 | 100/100 | 100/100 | 100/100 | 1142ms | 0.004 | 405ms |
| Artículo: presente simple | 89/100 | 100/100 | 100/100 | 100/100 | 1139ms | 0.022 | 445ms |
| Artículo: cómo aprender desde cero | 87/100 | 100/100 | 100/100 | 100/100 | 1138ms | 0.002 | 504ms |
| Miembros (landing de pago) | 79/100 | 100/100 | 98/100 | 77/100 | 1139ms | 0.079 | 853ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1140ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 62ms, elementRenderDelay 136ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (334ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 172ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 142ms (tercero); www.googletagmanager.com/gtag/js 103ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2456, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 26 corridas osciló entre 46 y 97 (mediana 78.5); este valor (90) ya se había visto.
- practica: LCP 1137ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 60ms, elementRenderDelay 100ms)
  - Bloquean el render: inglesconleo.com/style.css (333ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 182ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 157ms (tercero); www.googletagmanager.com/gtag/js 106ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2473, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 26 corridas osciló entre 53 y 96 (mediana 83); este valor (88) ya se había visto.
- articulos: LCP 1138ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 65ms, elementRenderDelay 116ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 194ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 148ms (tercero); www.googletagmanager.com/gtag/js 109ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2497, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 26 corridas osciló entre 54 y 98 (mediana 84.5); este valor (94) ya se había visto.
- articulo-verbo-to-be: LCP 1142ms en `body > main > article.article-body > p` (timeToFirstByte 130ms, elementRenderDelay 118ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 575ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 221ms (tercero); connect.facebook.net/en_US/fbevents.js 174ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2488, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 26 corridas osciló entre 75 y 96 (mediana 84); este valor (90) ya se había visto.
- articulo-presente-simple: LCP 1139ms en `body > main > article.article-body > p` (timeToFirstByte 62ms, elementRenderDelay 115ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (336ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 149ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 138ms (tercero); www.googletagmanager.com/gtag/js 101ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2438, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 26 corridas osciló entre 69 y 97 (mediana 85); este valor (89) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1138ms en `body > main > article.article-body > p` (timeToFirstByte 66ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 240ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 143ms (tercero); www.facebook.com/tr/ 120ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2491, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 26 corridas osciló entre 50 y 95 (mediana 84.5); este valor (87) ya se había visto.
- miembros: LCP 1139ms en `main > div#gate > div > h1` (timeToFirstByte 131ms, elementRenderDelay 146ms)
  - Bloquean el render: inglesconleo.com/style.css (167ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 361ms (tercero); accounts.google.com/gsi/button 234ms (tercero); accounts.google.com/gsi/client 221ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2456, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 26 corridas osciló entre 67 y 91 (mediana 76); este valor (79) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
