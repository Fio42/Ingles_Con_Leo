# SITE HEALTH — 2026-10-17

🔴 Críticos: 0
🟠 Importantes: 4
🟡 Mejoras: 0
🟢 Páginas sin problemas: 65 de 68

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 🆕 NUEVO
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 67/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 🆕 NUEVO
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 67/100.
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

ℹ️ https://inglesconleo.com 🆕 NUEVO
Best Practices se calculó sin la cookie de terceros del Meta Pixel (6 página(s)).
Impacto: Lighthouse penaliza la cookie "fr" de facebook.com aunque no se puede quitar sin desactivar el pixel de anuncios; se ignora para no marcar críticos falsos.
Acción: Nada que hacer, salvo que algún día se quite el pixel.

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 79/100 | 100/100 | 100/100 | 100/100 | 3111ms | 0.001 | 561ms |
| Práctica (gratis) | 81/100 | 100/100 | 90/100 | 100/100 | 1975ms | 0.000 | 741ms |
| Artículos (índice) | 81/100 | 100/100 | 96/100 | 100/100 | 3030ms | 0.002 | 513ms |
| Artículo: verbo to be | 83/100 | 100/100 | 100/100 | 100/100 | 1913ms | 0.001 | 655ms |
| Artículo: presente simple | 82/100 | 100/100 | 100/100 | 100/100 | 2949ms | 0.009 | 497ms |
| Artículo: cómo aprender desde cero | 77/100 | 100/100 | 100/100 | 100/100 | 2929ms | 0.000 | 721ms |
| Miembros (landing de pago) | 67/100 | 100/100 | 98/100 | 77/100 | 3445ms | 0.079 | 979ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3111ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 21ms, elementRenderDelay 124ms)
  - Bloquean el render: inglesconleo.com/style.css (456ms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 321ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 74ms (tercero); fonts.googleapis.com/css2 53ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2425, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 7 corridas osciló entre 50 y 78 (mediana 64); este valor (79) ya se había visto.
- practica: LCP 1975ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 16ms, elementRenderDelay 114ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 94ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 90ms (tercero); www.googletagmanager.com/gtag/js 84ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2463, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 7 corridas osciló entre 53 y 87 (mediana 75); este valor (81) ya se había visto.
- articulos: LCP 3030ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 17ms, elementRenderDelay 101ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/QqTghI1S9Ec/hqdefault.jpg 127ms (tercero); img.youtube.com/vi/IyPbbyuz1ho/hqdefault.jpg 120ms (tercero); img.youtube.com/vi/fhbmGfsFAwY/hqdefault.jpg 101ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2496, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 7 corridas osciló entre 54 y 86 (mediana 82); este valor (81) ya se había visto.
- articulo-verbo-to-be: LCP 1913ms en `body > main > article.article-body > p` (timeToFirstByte 16ms, elementRenderDelay 97ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 118ms (tercero); connect.facebook.net/en_US/fbevents.js 108ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 88ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2471, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 7 corridas osciló entre 75 y 90 (mediana 83); este valor (83) ya se había visto.
- articulo-presente-simple: LCP 2949ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 99ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 99ms (tercero); fonts.googleapis.com/css2 87ms (tercero); www.google-analytics.com/g/collect 78ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2493, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 7 corridas osciló entre 69 y 88 (mediana 85); este valor (82) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2929ms en `body > main > article.article-body > p` (timeToFirstByte 11ms, elementRenderDelay 100ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (454ms); inglesconleo.com/error-monitor.js (151ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 264ms (tercero); www.googletagmanager.com/gtag/js 211ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 116ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2501, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 7 corridas osciló entre 50 y 88 (mediana 78); este valor (77) ya se había visto.
- miembros: LCP 3445ms en `main > div#gate > div > h1` (timeToFirstByte 66ms, elementRenderDelay 149ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: m.stripe.com/6 190ms (tercero); accounts.google.com/gsi/button 140ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 134ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2488, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 7 corridas osciló entre 67 y 82 (mediana 68); este valor (67) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 68 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
