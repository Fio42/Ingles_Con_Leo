# SITE HEALTH — 2026-10-23

🔴 Críticos: 0
🟠 Importantes: 4
🟡 Mejoras: 2
🟢 Páginas sin problemas: 69 de 72

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 59/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html
Lighthouse Performance = 60/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 70/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 59/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html
Lighthouse Performance = 60/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 70/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

🟡 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance bajó de 81 a 59 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 13 corridas osciló entre 50 y 82 (mediana 77); este valor (59) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance bajó de 71 a 60 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 13 corridas osciló entre 53 y 87 (mediana 75); este valor (60) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 59/100 | 100/100 | 100/100 | 100/100 | 8079ms | 0.001 | 415ms |
| Práctica (gratis) | 60/100 | 100/100 | 93/100 | 100/100 | 4096ms | 0.176 | 563ms |
| Artículos (índice) | 85/100 | 100/100 | 96/100 | 100/100 | 2783ms | 0.002 | 418ms |
| Artículo: verbo to be | 82/100 | 100/100 | 100/100 | 100/100 | 2776ms | 0.001 | 549ms |
| Artículo: presente simple | 85/100 | 100/100 | 100/100 | 100/100 | 2785ms | 0.009 | 447ms |
| Artículo: cómo aprender desde cero | 82/100 | 100/100 | 100/100 | 100/100 | 2621ms | 0.000 | 572ms |
| Miembros (landing de pago) | 70/100 | 100/100 | 98/100 | 77/100 | 3443ms | 0.079 | 800ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 8079ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 110ms, elementRenderDelay 1212ms)
  - Bloquean el render: inglesconleo.com/style.css (603ms); inglesconleo.com/error-monitor.js (151ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 197ms (tercero); inglesconleo.com/style.css 124ms; inglesconleo.com/app.js 121ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2465, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 13 corridas osciló entre 50 y 82 (mediana 77); este valor (59) ya se había visto.
- practica: LCP 4096ms en `section > div.wrap > p#practicaModoAprender > span` (timeToFirstByte 102ms, elementRenderDelay 222ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (151ms); inglesconleo.com/style.css (452ms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 328ms (tercero); connect.facebook.net/en_US/fbevents.js 298ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 215ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2444, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 13 corridas osciló entre 53 y 87 (mediana 75); este valor (60) ya se había visto.
- articulos: LCP 2783ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 12ms, elementRenderDelay 128ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (302ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/VjH45nwgf38/hqdefault.jpg 306ms (tercero); img.youtube.com/vi/gf9T2K-zWcQ/hqdefault.jpg 300ms (tercero); img.youtube.com/vi/IyPbbyuz1ho/hqdefault.jpg 285ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2472, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 13 corridas osciló entre 54 y 86 (mediana 82); este valor (85) ya se había visto.
- articulo-verbo-to-be: LCP 2776ms en `body > main > article.article-body > p` (timeToFirstByte 19ms, elementRenderDelay 101ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (302ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 281ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 248ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 212ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2444, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 13 corridas osciló entre 75 y 90 (mediana 83); este valor (82) ya se había visto.
- articulo-presente-simple: LCP 2785ms en `body > main > article.article-body > p` (timeToFirstByte 12ms, elementRenderDelay 90ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (302ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 278ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 227ms (tercero); connect.facebook.net/signals/config/2182739922655837 136ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2432, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 13 corridas osciló entre 69 y 89 (mediana 84); este valor (85) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2621ms en `body > main > article.article-body > p` (timeToFirstByte 12ms, elementRenderDelay 106ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (301ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: fonts.googleapis.com/css2 1269ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 200ms (tercero); www.google-analytics.com/g/collect 100ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2425, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 13 corridas osciló entre 50 y 88 (mediana 79); este valor (82) ya se había visto.
- miembros: LCP 3443ms en `main > div#gate > div > h1` (timeToFirstByte 19ms, elementRenderDelay 144ms)
  - Bloquean el render: inglesconleo.com/style.css (453ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (151ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 213ms (tercero); accounts.google.com/gsi/button 190ms (tercero); accounts.google.com/gsi/client 154ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2456, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 13 corridas osciló entre 67 y 82 (mediana 68); este valor (70) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 72 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
