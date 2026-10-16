# SITE HEALTH — 2026-10-16

🔴 Críticos: 0
🟠 Importantes: 3
🟡 Mejoras: 0
🟢 Páginas sin problemas: 66 de 68

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/
Lighthouse Performance = 76/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 74/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/
Lighthouse Performance = 76/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

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

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 76/100 | 100/100 | 100/100 | 100/100 | 3913ms | 0.001 | 304ms |
| Práctica (gratis) | 87/100 | 100/100 | 90/100 | 100/100 | 1578ms | 0.000 | 462ms |
| Artículos (índice) | 86/100 | 100/100 | 96/100 | 100/100 | 2998ms | 0.002 | 326ms |
| Artículo: verbo to be | 85/100 | 100/100 | 100/100 | 100/100 | 2786ms | 0.001 | 426ms |
| Artículo: presente simple | 88/100 | 100/100 | 100/100 | 100/100 | 2140ms | 0.009 | 407ms |
| Artículo: cómo aprender desde cero | 86/100 | 100/100 | 100/100 | 100/100 | 2729ms | 0.000 | 413ms |
| Miembros (landing de pago) | 74/100 | 100/100 | 98/100 | 77/100 | 3429ms | 0.078 | 592ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3913ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 38ms, elementRenderDelay 1154ms)
  - Bloquean el render: inglesconleo.com/style.css (475ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 237ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 162ms (tercero); inglesconleo.com/favicon.ico 135ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3036, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 6 corridas osciló entre 50 y 78 (mediana 58); este valor (76) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1578ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 36ms, elementRenderDelay 81ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (474ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 260ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 177ms (tercero); connect.facebook.net/signals/config/2182739922655837 120ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2972, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 6 corridas osciló entre 53 y 87 (mediana 74); este valor (87) ya se había visto.
- articulos: LCP 2998ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 36ms, elementRenderDelay 99ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (476ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 248ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 165ms (tercero); www.facebook.com/tr/ 152ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3088, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 6 corridas osciló entre 54 y 85 (mediana 82); este valor (86) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 2786ms en `body > main > article.article-body > p` (timeToFirstByte 17ms, elementRenderDelay 81ms)
  - Bloquean el render: inglesconleo.com/style.css (456ms); inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 180ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 167ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 140ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2974, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 6 corridas osciló entre 75 y 90 (mediana 81.5); este valor (85) ya se había visto.
- articulo-presente-simple: LCP 2140ms en `body > main > article.article-body > p` (timeToFirstByte 186ms, elementRenderDelay 96ms)
  - Bloquean el render: inglesconleo.com/style.css (476ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 252ms (tercero); inglesconleo.com/articulo-presente-simple.html 186ms; www.facebook.com/tr/ 180ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2983, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 6 corridas osciló entre 69 y 85 (mediana 84); este valor (88) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2729ms en `body > main > article.article-body > p` (timeToFirstByte 130ms, elementRenderDelay 86ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (477ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 255ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 177ms (tercero); inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 130ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2979, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 6 corridas osciló entre 50 y 88 (mediana 77.5); este valor (86) ya se había visto.
- miembros: LCP 3429ms en `main > div#gate > div > h1` (timeToFirstByte 34ms, elementRenderDelay 122ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (158ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (474ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 249ms (tercero); accounts.google.com/gsi/button 229ms (tercero); accounts.google.com/gsi/client 168ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2912, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 6 corridas osciló entre 67 y 82 (mediana 68); este valor (74) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 68 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
