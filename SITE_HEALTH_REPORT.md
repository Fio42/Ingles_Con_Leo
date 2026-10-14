# SITE HEALTH — 2026-10-14

🔴 Críticos: 2
🟠 Importantes: 5
🟡 Mejoras: 0
🟢 Páginas sin problemas: 62 de 67

## Las 3 cosas que más conviene revisar

🔴 https://inglesconleo.com/glosario/id-contraction/ 🆕 NUEVO
Responde HTTP 503.
Impacto: Visitantes y Google encuentran un error en vez de contenido.
Acción: Arreglar o quitar los enlaces hacia esta URL.

🔴 https://inglesconleo.com/glosario/id-contraction/ 🆕 NUEVO
Está en sitemap.xml pero responde HTTP 503.
Impacto: Google gasta rastreo en una URL rota que además está "recomendada" por ti mismo.
Acción: Quitarla del sitemap o arreglar la página.

🟠 https://inglesconleo.com/
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🔴 https://inglesconleo.com/glosario/id-contraction/ 🆕 NUEVO
Responde HTTP 503.
Impacto: Visitantes y Google encuentran un error en vez de contenido.
Acción: Arreglar o quitar los enlaces hacia esta URL.

🔴 https://inglesconleo.com/glosario/id-contraction/ 🆕 NUEVO
Está en sitemap.xml pero responde HTTP 503.
Impacto: Google gasta rastreo en una URL rota que además está "recomendada" por ti mismo.
Acción: Quitarla del sitemap o arreglar la página.

🟠 https://inglesconleo.com/
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html
Lighthouse Performance = 69/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html
Lighthouse Performance = 75/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 68/100.
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
| Home | 77/100 | 100/100 | 100/100 | 100/100 | 3059ms | 0.001 | 475ms |
| Práctica (gratis) | 69/100 | 100/100 | 90/100 | 100/100 | 4077ms | 0.000 | 690ms |
| Artículos (índice) | 82/100 | 100/100 | 96/100 | 100/100 | 2775ms | 0.002 | 530ms |
| Artículo: verbo to be | 80/100 | 100/100 | 100/100 | 100/100 | 2779ms | 0.001 | 635ms |
| Artículo: presente simple | 85/100 | 100/100 | 100/100 | 100/100 | 2642ms | 0.009 | 479ms |
| Artículo: cómo aprender desde cero | 75/100 | 100/100 | 100/100 | 100/100 | 2624ms | 0.000 | 1026ms |
| Miembros (landing de pago) | 68/100 | 100/100 | 98/100 | 77/100 | 3420ms | 0.079 | 934ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3059ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 94ms, elementRenderDelay 227ms)
  - Bloquean el render: inglesconleo.com/style.css (452ms); inglesconleo.com/error-monitor.js (151ms)
  - Peticiones más lentas: inglesconleo.com/favicon-32x32.png 590ms; inglesconleo.com/android-chrome-192x192.png 563ms; inglesconleo.com/app.js 259ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2488, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 4 corridas osciló entre 50 y 64 (mediana 51.5); este valor (77) ya se había visto.
- practica: LCP 4077ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 577ms, elementRenderDelay 327ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (453ms); inglesconleo.com/error-monitor.js (151ms)
  - Peticiones más lentas: inglesconleo.com/practica.html 576ms; inglesconleo.com/site.webmanifest 250ms; xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 240ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2478, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 4 corridas osciló entre 53 y 87 (mediana 74); este valor (69) ya se había visto.
- articulos: LCP 2775ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 13ms, elementRenderDelay 125ms)
  - Bloquean el render: inglesconleo.com/style.css (301ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 200ms (tercero); fonts.googleapis.com/css2 173ms (tercero); img.youtube.com/vi/QqTghI1S9Ec/hqdefault.jpg 134ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2470, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 4 corridas osciló entre 54 y 85 (mediana 83); este valor (82) ya se había visto.
- articulo-verbo-to-be: LCP 2779ms en `body > main > article.article-body > p` (timeToFirstByte 12ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (301ms)
  - Peticiones más lentas: fonts.googleapis.com/css2 1683ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 212ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 147ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2478, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 4 corridas osciló entre 75 y 90 (mediana 81.5); este valor (80) ya se había visto.
- articulo-presente-simple: LCP 2642ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 100ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (301ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 200ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 109ms (tercero); fonts.googleapis.com/css2 108ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2498, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 4 corridas osciló entre 69 y 85 (mediana 82); este valor (85) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2624ms en `body > main > article.article-body > p` (timeToFirstByte 272ms, elementRenderDelay 104ms)
  - Bloquean el render: inglesconleo.com/style.css (302ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 270ms; xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 211ms (tercero); fonts.googleapis.com/css2 106ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2475, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 4 corridas osciló entre 50 y 88 (mediana 77.5); este valor (75) ya se había visto.
- miembros: LCP 3420ms en `main > div#gate > div > h1` (timeToFirstByte 12ms, elementRenderDelay 145ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (151ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (451ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 219ms (tercero); accounts.google.com/gsi/client 171ms (tercero); accounts.google.com/gsi/button 166ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2450, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 4 corridas osciló entre 67 y 82 (mediana 68); este valor (68) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 67 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
