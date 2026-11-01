# SITE HEALTH — 2026-11-01

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 75 de 76

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 78/100.
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
| Home | 89/100 | 100/100 | 100/100 | 100/100 | 1137ms | 0.002 | 435ms |
| Práctica (gratis) | 85/100 | 100/100 | 93/100 | 100/100 | 1141ms | 0.002 | 581ms |
| Artículos (índice) | 91/100 | 100/100 | 96/100 | 100/100 | 1138ms | 0.004 | 376ms |
| Artículo: verbo to be | 86/100 | 100/100 | 100/100 | 100/100 | 1136ms | 0.004 | 542ms |
| Artículo: presente simple | 87/100 | 100/100 | 100/100 | 100/100 | 1138ms | 0.022 | 510ms |
| Artículo: cómo aprender desde cero | 87/100 | 100/100 | 100/100 | 100/100 | 1139ms | 0.002 | 499ms |
| Miembros (landing de pago) | 78/100 | 100/100 | 98/100 | 77/100 | 1145ms | 0.079 | 905ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1137ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 60ms, elementRenderDelay 136ms)
  - Bloquean el render: inglesconleo.com/style.css (334ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 227ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 125ms (tercero); www.googletagmanager.com/gtag/js 99ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2426, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 22 corridas osciló entre 50 y 97 (mediana 78); este valor (89) ya se había visto.
- practica: LCP 1141ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 64ms, elementRenderDelay 103ms)
  - Bloquean el render: inglesconleo.com/style.css (334ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 179ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 132ms (tercero); www.googletagmanager.com/gtag/js 99ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2451, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 22 corridas osciló entre 53 y 95 (mediana 81.5); este valor (85) ya se había visto.
- articulos: LCP 1138ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 62ms, elementRenderDelay 137ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (167ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 218ms (tercero); connect.facebook.net/signals/config/2182739922655837 209ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 154ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2450, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 22 corridas osciló entre 54 y 98 (mediana 84); este valor (91) ya se había visto.
- articulo-verbo-to-be: LCP 1136ms en `body > main > article.article-body > p` (timeToFirstByte 60ms, elementRenderDelay 129ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (333ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 300ms (tercero); connect.facebook.net/en_US/fbevents.js 171ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 170ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2384, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 22 corridas osciló entre 75 y 96 (mediana 83.5); este valor (86) ya se había visto.
- articulo-presente-simple: LCP 1138ms en `body > main > article.article-body > p` (timeToFirstByte 174ms, elementRenderDelay 92ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 277ms (tercero); connect.facebook.net/signals/config/2182739922655837 248ms (tercero); inglesconleo.com/articulo-presente-simple.html 174ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2416, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 22 corridas osciló entre 69 y 97 (mediana 84.5); este valor (87) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1139ms en `body > main > article.article-body > p` (timeToFirstByte 64ms, elementRenderDelay 109ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 449ms (tercero); connect.facebook.net/en_US/fbevents.js 197ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 143ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2484, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 22 corridas osciló entre 50 y 95 (mediana 83); este valor (87) ya se había visto.
- miembros: LCP 1145ms en `main > div#gate > div > h1` (timeToFirstByte 125ms, elementRenderDelay 137ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (167ms)
  - Peticiones más lentas: accounts.google.com/gsi/button 213ms (tercero); connect.facebook.net/en_US/fbevents.js 200ms (tercero); accounts.google.com/gsi/client 183ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2447, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 22 corridas osciló entre 67 y 90 (mediana 72); este valor (78) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
