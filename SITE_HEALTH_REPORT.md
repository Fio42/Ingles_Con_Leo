# SITE HEALTH — 2026-10-15

🔴 Críticos: 0
🟠 Importantes: 4
🟡 Mejoras: 0
🟢 Páginas sin problemas: 65 de 68

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html
Lighthouse Performance = 75/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html
Lighthouse Performance = 75/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

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

ℹ️ https://inglesconleo.com 🆕 NUEVO
Best Practices se calculó sin la cookie de terceros del Meta Pixel (6 página(s)).
Impacto: Lighthouse penaliza la cookie "fr" de facebook.com aunque no se puede quitar sin desactivar el pixel de anuncios; se ignora para no marcar críticos falsos.
Acción: Nada que hacer, salvo que algún día se quite el pixel.

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 78/100 | 100/100 | 100/100 | 100/100 | 3132ms | 0.001 | 581ms |
| Práctica (gratis) | 75/100 | 100/100 | 90/100 | 100/100 | 3322ms | 0.000 | 697ms |
| Artículos (índice) | 81/100 | 100/100 | 96/100 | 100/100 | 2945ms | 0.002 | 500ms |
| Artículo: verbo to be | 83/100 | 100/100 | 100/100 | 100/100 | 1992ms | 0.001 | 646ms |
| Artículo: presente simple | 83/100 | 100/100 | 100/100 | 100/100 | 2040ms | 0.009 | 640ms |
| Artículo: cómo aprender desde cero | 84/100 | 100/100 | 100/100 | 100/100 | 1874ms | 0.000 | 585ms |
| Miembros (landing de pago) | 77/100 | 100/100 | 98/100 | 77/100 | 2080ms | 0.079 | 834ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3132ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 21ms, elementRenderDelay 126ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 124ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 111ms (tercero); inglesconleo.com/mini-lecciones.js 68ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2505, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 5 corridas osciló entre 50 y 77 (mediana 52); este valor (78) ya se había visto.
- practica: LCP 3322ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 19ms, elementRenderDelay 113ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 92ms (tercero); www.google-analytics.com/g/collect 90ms (tercero); www.googletagmanager.com/gtag/js 83ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2498, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 5 corridas osciló entre 53 y 87 (mediana 73); este valor (75) ya se había visto.
- articulos: LCP 2945ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 26ms, elementRenderDelay 112ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/VjH45nwgf38/hqdefault.jpg 102ms (tercero); connect.facebook.net/en_US/fbevents.js 101ms (tercero); img.youtube.com/vi/fhbmGfsFAwY/hqdefault.jpg 93ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2459, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 5 corridas osciló entre 54 y 85 (mediana 82); este valor (81) ya se había visto.
- articulo-verbo-to-be: LCP 1992ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 99ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (151ms); inglesconleo.com/style.css (454ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 285ms (tercero); connect.facebook.net/en_US/fbevents.js 93ms (tercero); www.google-analytics.com/g/collect 87ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2489, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 5 corridas osciló entre 75 y 90 (mediana 80); este valor (83) ya se había visto.
- articulo-presente-simple: LCP 2040ms en `body > main > article.article-body > p` (timeToFirstByte 22ms, elementRenderDelay 107ms)
  - Bloquean el render: inglesconleo.com/style.css (454ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (151ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 409ms (tercero); www.google-analytics.com/g/collect 91ms (tercero); www.googletagmanager.com/gtag/js 83ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2414, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 5 corridas osciló entre 69 y 85 (mediana 85); este valor (83) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1874ms en `body > main > article.article-body > p` (timeToFirstByte 23ms, elementRenderDelay 97ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (457ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 127ms (tercero); www.google-analytics.com/g/collect 98ms (tercero); www.googletagmanager.com/gtag/js 93ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2471, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 5 corridas osciló entre 50 y 88 (mediana 77); este valor (84) ya se había visto.
- miembros: LCP 2080ms en `main > div#gate > div > h1` (timeToFirstByte 16ms, elementRenderDelay 134ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: m.stripe.com/6 237ms (tercero); www.google-analytics.com/g/collect 155ms (tercero); accounts.google.com/gsi/button 104ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2492, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 5 corridas osciló entre 67 y 82 (mediana 68); este valor (77) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 68 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
