# SITE HEALTH — 2026-10-21

🔴 Críticos: 0
🟠 Importantes: 4
🟡 Mejoras: 2
🟢 Páginas sin problemas: 69 de 72

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance = 53/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance = 54/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance = 53/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance = 54/100.
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

🟡 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance bajó de 83 a 53 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 11 corridas osciló entre 53 y 87 (mediana 75); este valor (53) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance bajó de 84 a 54 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 11 corridas osciló entre 54 y 86 (mediana 82); este valor (54) ya se había visto.
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
| Home | 82/100 | 100/100 | 100/100 | 100/100 | 3032ms | 0.001 | 462ms |
| Práctica (gratis) | 53/100 | 100/100 | 90/100 | 100/100 | 8934ms | 0.000 | 507ms |
| Artículos (índice) | 54/100 | 100/100 | 96/100 | 100/100 | 8575ms | 0.000 | 363ms |
| Artículo: verbo to be | 85/100 | 100/100 | 100/100 | 100/100 | 2096ms | 0.001 | 537ms |
| Artículo: presente simple | 89/100 | 100/100 | 100/100 | 100/100 | 1571ms | 0.009 | 424ms |
| Artículo: cómo aprender desde cero | 86/100 | 100/100 | 100/100 | 100/100 | 2041ms | 0.000 | 493ms |
| Miembros (landing de pago) | 77/100 | 100/100 | 98/100 | 77/100 | 2202ms | 0.079 | 845ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3032ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 17ms, elementRenderDelay 130ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 178ms (tercero); www.googletagmanager.com/gtag/js 86ms (tercero); www.google-analytics.com/g/collect 83ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2625, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 11 corridas osciló entre 50 y 82 (mediana 76); este valor (82) ya se había visto.
- practica: LCP 8934ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 138ms, elementRenderDelay 1200ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (633ms); inglesconleo.com/error-monitor.js (158ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 267ms (tercero); inglesconleo.com/meta-pixel.js 231ms; inglesconleo.com/logo.png 174ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2621, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 11 corridas osciló entre 53 y 87 (mediana 75); este valor (53) ya se había visto.
- articulos: LCP 8575ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 17ms, elementRenderDelay 2318ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (759ms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: inglesconleo.com/meta-pixel.js 240ms; xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 195ms (tercero); img.youtube.com/vi/Wv4rEL4wYnE/hqdefault.jpg 194ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2569, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 11 corridas osciló entre 54 y 86 (mediana 82); este valor (54) ya se había visto.
- articulo-verbo-to-be: LCP 2096ms en `body > main > article.article-body > p` (timeToFirstByte 36ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (475ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 770ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 194ms (tercero); www.google-analytics.com/g/collect 92ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2610, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 11 corridas osciló entre 75 y 90 (mediana 83); este valor (85) ya se había visto.
- articulo-presente-simple: LCP 1571ms en `body > main > article.article-body > p` (timeToFirstByte 34ms, elementRenderDelay 94ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (474ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 189ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 177ms (tercero); www.googletagmanager.com/gtag/js 81ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2609, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 11 corridas osciló entre 69 y 88 (mediana 84); este valor (89) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2041ms en `body > main > article.article-body > p` (timeToFirstByte 264ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (475ms)
  - Peticiones más lentas: inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 264ms; xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 222ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 101ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2609, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 11 corridas osciló entre 50 y 88 (mediana 78); este valor (86) ya se había visto.
- miembros: LCP 2202ms en `main > div#gate > div > h1` (timeToFirstByte 129ms, elementRenderDelay 154ms)
  - Bloquean el render: inglesconleo.com/style.css (474ms); inglesconleo.com/error-monitor.js (158ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 201ms (tercero); accounts.google.com/gsi/client 164ms (tercero); accounts.google.com/gsi/button 156ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2615, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 11 corridas osciló entre 67 y 82 (mediana 68); este valor (77) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 72 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
