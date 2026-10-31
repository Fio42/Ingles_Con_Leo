# SITE HEALTH — 2026-10-31

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 2
🟢 Páginas sin problemas: 72 de 74

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

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

🟡 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance bajó de 95 a 84 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 21 corridas osciló entre 53 y 95 (mediana 81); este valor (84) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance bajó de 90 a 79 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 21 corridas osciló entre 67 y 90 (mediana 70); este valor (79) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

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
| Home | 88/100 | 100/100 | 100/100 | 100/100 | 1070ms | 0.002 | 491ms |
| Práctica (gratis) | 84/100 | 100/100 | 93/100 | 100/100 | 1064ms | 0.002 | 666ms |
| Artículos (índice) | 90/100 | 100/100 | 96/100 | 100/100 | 1064ms | 0.004 | 403ms |
| Artículo: verbo to be | 87/100 | 100/100 | 100/100 | 100/100 | 1065ms | 0.004 | 497ms |
| Artículo: presente simple | 87/100 | 100/100 | 100/100 | 100/100 | 1066ms | 0.022 | 536ms |
| Artículo: cómo aprender desde cero | 86/100 | 100/100 | 100/100 | 100/100 | 1829ms | 0.002 | 526ms |
| Miembros (landing de pago) | 79/100 | 100/100 | 98/100 | 77/100 | 1121ms | 0.079 | 799ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1070ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 28ms, elementRenderDelay 150ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 95ms (tercero); www.google-analytics.com/g/collect 92ms (tercero); inglesconleo.com/audio/leo/bienvenida.mp3 64ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2400, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 21 corridas osciló entre 50 y 97 (mediana 78); este valor (88) ya se había visto.
- practica: LCP 1064ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 19ms, elementRenderDelay 122ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (303ms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 146ms (tercero); www.googletagmanager.com/gtag/js 103ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 73ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2463, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 21 corridas osciló entre 53 y 95 (mediana 81); este valor (84) ya se había visto.
- articulos: LCP 1064ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 19ms, elementRenderDelay 110ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (152ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 91ms (tercero); www.google-analytics.com/g/collect 89ms (tercero); fonts.googleapis.com/css2 43ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2377, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 21 corridas osciló entre 54 y 98 (mediana 84); este valor (90) ya se había visto.
- articulo-verbo-to-be: LCP 1065ms en `body > main > article.article-body > p` (timeToFirstByte 87ms, elementRenderDelay 96ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 432ms (tercero); www.google-analytics.com/g/collect 91ms (tercero); www.googletagmanager.com/gtag/js 89ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2478, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 21 corridas osciló entre 75 y 96 (mediana 83); este valor (87) ya se había visto.
- articulo-presente-simple: LCP 1066ms en `body > main > article.article-body > p` (timeToFirstByte 20ms, elementRenderDelay 102ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (309ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 315ms (tercero); www.googletagmanager.com/gtag/js 102ms (tercero); www.google-analytics.com/g/collect 88ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2463, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 21 corridas osciló entre 69 y 97 (mediana 84); este valor (87) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1829ms en `body > main > article.article-body > p` (timeToFirstByte 19ms, elementRenderDelay 95ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 277ms (tercero); www.google-analytics.com/g/collect 91ms (tercero); www.googletagmanager.com/gtag/js 80ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2446, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 21 corridas osciló entre 50 y 95 (mediana 83); este valor (86) ya se había visto.
- miembros: LCP 1121ms en `main > div#gate > div > h1` (timeToFirstByte 19ms, elementRenderDelay 154ms)
  - Bloquean el render: inglesconleo.com/style.css (152ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 248ms (tercero); accounts.google.com/gsi/button 108ms (tercero); www.googletagmanager.com/gtag/js 99ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2510, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 21 corridas osciló entre 67 y 90 (mediana 70); este valor (79) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 74 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
