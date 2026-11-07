# SITE HEALTH — 2026-11-07

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 75 de 76

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 77/100.
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

<details>
<summary>ℹ️ Contexto / notas del propio auditor</summary>

ℹ️ https://inglesconleo.com
Best Practices se calculó sin la cookie de terceros del Meta Pixel (6 página(s)).
Impacto: Lighthouse penaliza la cookie "fr" de facebook.com aunque no se puede quitar sin desactivar el pixel de anuncios; se ignora para no marcar críticos falsos.
Acción: Nada que hacer, salvo que algún día se quite el pixel.

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 92/100 | 100/100 | 100/100 | 100/100 | 1129ms | 0.002 | 341ms |
| Práctica (gratis) | 86/100 | 100/100 | 93/100 | 100/100 | 1913ms | 0.002 | 476ms |
| Artículos (índice) | 92/100 | 100/100 | 96/100 | 100/100 | 1120ms | 0.004 | 341ms |
| Artículo: verbo to be | 91/100 | 100/100 | 100/100 | 100/100 | 1852ms | 0.004 | 332ms |
| Artículo: presente simple | 87/100 | 100/100 | 100/100 | 100/100 | 1877ms | 0.022 | 463ms |
| Artículo: cómo aprender desde cero | 89/100 | 100/100 | 100/100 | 100/100 | 1900ms | 0.002 | 377ms |
| Miembros (landing de pago) | 77/100 | 100/100 | 98/100 | 77/100 | 2421ms | 0.076 | 657ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1129ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 62ms, elementRenderDelay 200ms)
  - Bloquean el render: inglesconleo.com/style.css (331ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 74ms (tercero); connect.facebook.net/en_US/fbevents.js 71ms (tercero); www.google-analytics.com/g/collect 69ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2768, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 28 corridas osciló entre 46 y 97 (mediana 80); este valor (92) ya se había visto.
- practica: LCP 1913ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 54ms, elementRenderDelay 189ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (329ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 75ms (tercero); inglesconleo.com/site.webmanifest 70ms; inglesconleo.com/app.js 58ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2675, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 28 corridas osciló entre 53 y 96 (mediana 83); este valor (86) ya se había visto.
- articulos: LCP 1120ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 55ms, elementRenderDelay 171ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (163ms)
  - Peticiones más lentas: img.youtube.com/vi/E2IFaTqUsT0/hqdefault.jpg 144ms (tercero); img.youtube.com/vi/JPq1KBBsbtI/hqdefault.jpg 142ms (tercero); img.youtube.com/vi/IyPbbyuz1ho/hqdefault.jpg 90ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2777, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 28 corridas osciló entre 54 y 98 (mediana 85); este valor (92) ya se había visto.
- articulo-verbo-to-be: LCP 1852ms en `body > main > article.article-body > p` (timeToFirstByte 76ms, elementRenderDelay 150ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (328ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 677ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 114ms (tercero); inglesconleo.com/articulo-verbo-to-be.html 77ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2771, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 28 corridas osciló entre 75 y 96 (mediana 84.5); este valor (91) ya se había visto.
- articulo-presente-simple: LCP 1877ms en `body > main > article.article-body > p` (timeToFirstByte 57ms, elementRenderDelay 141ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (329ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 345ms (tercero); connect.facebook.net/en_US/fbevents.js 70ms (tercero); inglesconleo.com/articulo-presente-simple.html 57ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2723, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 28 corridas osciló entre 69 y 97 (mediana 85); este valor (87) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1900ms en `body > main > article.article-body > p` (timeToFirstByte 53ms, elementRenderDelay 190ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 416ms (tercero); connect.facebook.net/en_US/fbevents.js 73ms (tercero); inglesconleo.com/site.webmanifest 61ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2704, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 28 corridas osciló entre 50 y 95 (mediana 85.5); este valor (89) ya se había visto.
- miembros: LCP 2421ms en `main > div#gate > div > h1` (timeToFirstByte 77ms, elementRenderDelay 192ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 216ms (tercero); js.stripe.com/v3/ 116ms (tercero); accounts.google.com/gsi/button 95ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2683, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 28 corridas osciló entre 67 y 91 (mediana 77); este valor (77) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
