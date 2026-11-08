# SITE HEALTH — 2026-11-08

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 75 de 76

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 74/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 74/100.
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
| Home | 90/100 | 100/100 | 100/100 | 100/100 | 1062ms | 0.002 | 396ms |
| Práctica (gratis) | 83/100 | 100/100 | 93/100 | 100/100 | 2404ms | 0.002 | 478ms |
| Artículos (índice) | 90/100 | 100/100 | 96/100 | 100/100 | 1884ms | 0.004 | 340ms |
| Artículo: verbo to be | 89/100 | 100/100 | 100/100 | 100/100 | 1061ms | 0.004 | 460ms |
| Artículo: presente simple | 88/100 | 100/100 | 100/100 | 100/100 | 1901ms | 0.022 | 405ms |
| Artículo: cómo aprender desde cero | 86/100 | 100/100 | 100/100 | 100/100 | 1875ms | 0.002 | 502ms |
| Miembros (landing de pago) | 74/100 | 100/100 | 98/100 | 77/100 | 2415ms | 0.079 | 830ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1062ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 36ms, elementRenderDelay 150ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 99ms (tercero); www.google-analytics.com/g/collect 76ms (tercero); inglesconleo.com/audio/leo/bienvenida.mp3 50ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2419, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 29 corridas osciló entre 46 y 97 (mediana 81); este valor (90) ya se había visto.
- practica: LCP 2404ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 21ms, elementRenderDelay 143ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 97ms (tercero); www.google-analytics.com/g/collect 78ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 45ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2466, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 29 corridas osciló entre 53 y 96 (mediana 83); este valor (83) ya se había visto.
- articulos: LCP 1884ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 19ms, elementRenderDelay 149ms)
  - Bloquean el render: inglesconleo.com/style.css (152ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 92ms (tercero); www.google-analytics.com/g/collect 79ms (tercero); fonts.googleapis.com/css2 54ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2458, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 29 corridas osciló entre 54 y 98 (mediana 85); este valor (90) ya se había visto.
- articulo-verbo-to-be: LCP 1061ms en `body > main > article.article-body > p` (timeToFirstByte 70ms, elementRenderDelay 123ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 738ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 146ms (tercero); www.googletagmanager.com/gtag/js 86ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2490, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 29 corridas osciló entre 75 y 96 (mediana 85); este valor (89) ya se había visto.
- articulo-presente-simple: LCP 1901ms en `body > main > article.article-body > p` (timeToFirstByte 60ms, elementRenderDelay 149ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (307ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 277ms (tercero); www.googletagmanager.com/gtag/js 85ms (tercero); www.google-analytics.com/g/collect 79ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2453, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 29 corridas osciló entre 69 y 97 (mediana 85); este valor (88) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1875ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 133ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 315ms (tercero); www.googletagmanager.com/gtag/js 99ms (tercero); www.google-analytics.com/g/collect 83ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2460, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 29 corridas osciló entre 50 y 95 (mediana 86); este valor (86) ya se había visto.
- miembros: LCP 2415ms en `main > div#gate > div > h1` (timeToFirstByte 18ms, elementRenderDelay 172ms)
  - Bloquean el render: inglesconleo.com/style.css (152ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 247ms (tercero); www.google-analytics.com/g/collect 144ms (tercero); www.googletagmanager.com/gtag/js 100ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2470, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 29 corridas osciló entre 67 y 91 (mediana 77); este valor (74) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
