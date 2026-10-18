# SITE HEALTH — 2026-10-18

🔴 Críticos: 0
🟠 Importantes: 6
🟡 Mejoras: 1
🟢 Páginas sin problemas: 66 de 72

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance = 74/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulo-verbo-to-be.html 🆕 NUEVO
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance = 74/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulo-verbo-to-be.html 🆕 NUEVO
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 69/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

🟡 https://inglesconleo.com/articulo-verbos-irregulares.html 🆕 NUEVO
El HTML creció de 22KB a 70KB desde la última corrida.
Impacto: Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.
Acción: Revisar si el crecimiento fue intencional.

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
| Home | 78/100 | 100/100 | 100/100 | 100/100 | 3121ms | 0.001 | 619ms |
| Práctica (gratis) | 74/100 | 100/100 | 90/100 | 100/100 | 3314ms | 0.000 | 712ms |
| Artículos (índice) | 78/100 | 100/100 | 96/100 | 100/100 | 3039ms | 0.002 | 608ms |
| Artículo: verbo to be | 78/100 | 100/100 | 100/100 | 100/100 | 1940ms | 0.001 | 920ms |
| Artículo: presente simple | 84/100 | 100/100 | 100/100 | 100/100 | 2790ms | 0.009 | 458ms |
| Artículo: cómo aprender desde cero | 81/100 | 100/100 | 100/100 | 100/100 | 2964ms | 0.000 | 515ms |
| Miembros (landing de pago) | 69/100 | 100/100 | 98/100 | 77/100 | 3461ms | 0.079 | 844ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3121ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 17ms, elementRenderDelay 149ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 92ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 83ms (tercero); www.googletagmanager.com/gtag/js 68ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2403, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 8 corridas osciló entre 50 y 79 (mediana 70); este valor (78) ya se había visto.
- practica: LCP 3314ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 18ms, elementRenderDelay 120ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (455ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 95ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 87ms (tercero); www.googletagmanager.com/gtag/js 83ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2449, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 8 corridas osciló entre 53 y 87 (mediana 75); este valor (74) ya se había visto.
- articulos: LCP 3039ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 70ms, elementRenderDelay 114ms)
  - Bloquean el render: inglesconleo.com/style.css (456ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/IyPbbyuz1ho/hqdefault.jpg 160ms (tercero); img.youtube.com/vi/JPq1KBBsbtI/hqdefault.jpg 156ms (tercero); img.youtube.com/vi/qYfRn_KUcyE/hqdefault.jpg 126ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2477, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 8 corridas osciló entre 54 y 86 (mediana 82); este valor (78) ya se había visto.
- articulo-verbo-to-be: LCP 1940ms en `body > main > article.article-body > p` (timeToFirstByte 12ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 304ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 248ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 159ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2404, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 8 corridas osciló entre 75 y 90 (mediana 83); este valor (78) ya se había visto.
- articulo-presente-simple: LCP 2790ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 101ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 113ms (tercero); www.google-analytics.com/g/collect 85ms (tercero); www.googletagmanager.com/gtag/js 81ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2499, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 8 corridas osciló entre 69 y 88 (mediana 84); este valor (84) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2964ms en `body > main > article.article-body > p` (timeToFirstByte 16ms, elementRenderDelay 109ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 100ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 90ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 84ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2450, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 8 corridas osciló entre 50 y 88 (mediana 77.5); este valor (81) ya se había visto.
- miembros: LCP 3461ms en `main > div#gate > div > h1` (timeToFirstByte 156ms, elementRenderDelay 157ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (456ms)
  - Peticiones más lentas: m.stripe.com/6 197ms (tercero); inglesconleo.com/miembros.html 156ms; connect.facebook.net/signals/config/2182739922655837 143ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2460, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 8 corridas osciló entre 67 y 82 (mediana 68); este valor (69) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 72 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
