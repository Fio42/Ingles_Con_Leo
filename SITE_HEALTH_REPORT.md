# SITE HEALTH — 2026-11-27

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 1
🟢 Páginas sin problemas: 80 de 82

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
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
Lighthouse Performance bajó de 95 a 77 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 88); este valor (77) ya se había visto.
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
| Home | 96/100 | 100/100 | 97/100 | 100/100 | 1094ms | 0.039 | 233ms |
| Práctica (gratis) | 77/100 | 100/100 | 90/100 | 100/100 | 2334ms | 0.235 | 299ms |
| Artículos (índice) | 92/100 | 100/100 | 92/100 | 100/100 | 2190ms | 0.002 | 255ms |
| Artículo: verbo to be | 86/100 | 100/100 | 97/100 | 95/100 | 2061ms | 0.004 | 442ms |
| Artículo: presente simple | 95/100 | 100/100 | 97/100 | 100/100 | 1092ms | 0.022 | 247ms |
| Artículo: cómo aprender desde cero | 93/100 | 100/100 | 97/100 | 100/100 | 2108ms | 0.002 | 244ms |
| Miembros (landing de pago) | 84/100 | 100/100 | 95/100 | 77/100 | 2114ms | 0.077 | 440ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1094ms en `section.hm-hero > div.wrap > div.hm-hero-copy > h1` (timeToFirstByte 38ms, elementRenderDelay 149ms)
  - Bloquean el render: inglesconleo.com/style.css (316ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 238ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 171ms (tercero); connect.facebook.net/signals/config/2182739922655837 121ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2973, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 88); este valor (96) ya se había visto.
- practica: LCP 2334ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 111ms, elementRenderDelay 186ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (158ms); inglesconleo.com/tema.js (nullms); inglesconleo.com/v2/v3-ui.css (475ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 230ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 167ms (tercero); inglesconleo.com/app.js 132ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2904, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 88); este valor (77) ya se había visto.
- articulos: LCP 2190ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 115ms, elementRenderDelay 287ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (152ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 254ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 171ms (tercero); inglesconleo.com/meta-pixel.js 160ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3085, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 91.5); este valor (92) ya se había visto.
- articulo-verbo-to-be: LCP 2061ms en `body > main > article.article-body > p` (timeToFirstByte 95ms, elementRenderDelay 195ms)
  - Bloquean el render: inglesconleo.com/video-guia.css (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 198ms (tercero); connect.facebook.net/signals/config/2182739922655837 190ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 162ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3031, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 78 y 98 (mediana 89); este valor (86) ya se había visto.
- articulo-presente-simple: LCP 1092ms en `body > main > article.article-body > p` (timeToFirstByte 118ms, elementRenderDelay 123ms)
  - Bloquean el render: inglesconleo.com/tema.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (316ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 262ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 168ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 163ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2975, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 82 y 98 (mediana 89); este valor (95) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2108ms en `body > main > article.article-body > p` (timeToFirstByte 108ms, elementRenderDelay 103ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 259ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 183ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 179ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3115, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 76 y 98 (mediana 89); este valor (93) ya se había visto.
- miembros: LCP 2114ms en `main > div#gate > div > h1` (timeToFirstByte 118ms, elementRenderDelay 233ms)
  - Bloquean el render: inglesconleo.com/v2/v2-init.js (nullms); inglesconleo.com/style.css (158ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 274ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 191ms (tercero); accounts.google.com/gsi/client 163ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3131, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 79.5); este valor (84) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 82 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
