# SITE HEALTH — 2026-11-03

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 75 de 76

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

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
| Home | 90/100 | 100/100 | 100/100 | 100/100 | 1252ms | 0.000 | 366ms |
| Práctica (gratis) | 86/100 | 100/100 | 93/100 | 100/100 | 1138ms | 0.002 | 544ms |
| Artículos (índice) | 93/100 | 100/100 | 96/100 | 100/100 | 1137ms | 0.004 | 302ms |
| Artículo: verbo to be | 89/100 | 100/100 | 100/100 | 100/100 | 1139ms | 0.004 | 426ms |
| Artículo: presente simple | 88/100 | 100/100 | 100/100 | 100/100 | 1140ms | 0.022 | 462ms |
| Artículo: cómo aprender desde cero | 88/100 | 100/100 | 100/100 | 100/100 | 1139ms | 0.002 | 492ms |
| Miembros (landing de pago) | 81/100 | 100/100 | 98/100 | 77/100 | 1181ms | 0.080 | 670ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1252ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 254ms, elementRenderDelay 1173ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (334ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 358ms (tercero); inglesconleo.com/ 247ms; connect.facebook.net/signals/config/2182739922655837 222ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2060, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 24 corridas osciló entre 50 y 97 (mediana 78.5); este valor (90) ya se había visto.
- practica: LCP 1138ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 62ms, elementRenderDelay 88ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (334ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 210ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 152ms (tercero); www.googletagmanager.com/gtag/js 104ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2273, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 24 corridas osciló entre 53 y 96 (mediana 82.5); este valor (86) ya se había visto.
- articulos: LCP 1137ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 60ms, elementRenderDelay 146ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 186ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 137ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 112ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2290, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 24 corridas osciló entre 54 y 98 (mediana 84); este valor (93) ya se había visto.
- articulo-verbo-to-be: LCP 1139ms en `body > main > article.article-body > p` (timeToFirstByte 68ms, elementRenderDelay 123ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 307ms (tercero); connect.facebook.net/en_US/fbevents.js 195ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 168ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2299, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 24 corridas osciló entre 75 y 96 (mediana 84); este valor (89) ya se había visto.
- articulo-presente-simple: LCP 1140ms en `body > main > article.article-body > p` (timeToFirstByte 66ms, elementRenderDelay 109ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 273ms (tercero); connect.facebook.net/en_US/fbevents.js 192ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 137ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2398, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 24 corridas osciló entre 69 y 97 (mediana 85); este valor (88) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1139ms en `body > main > article.article-body > p` (timeToFirstByte 62ms, elementRenderDelay 105ms)
  - Bloquean el render: inglesconleo.com/style.css (335ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 164ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 155ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 139ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2417, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 24 corridas osciló entre 50 y 95 (mediana 83.5); este valor (88) ya se había visto.
- miembros: LCP 1181ms en `main > div#gate > div > h1` (timeToFirstByte 131ms, elementRenderDelay 148ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: accounts.google.com/gsi/button 244ms (tercero); accounts.google.com/gsi/client 222ms (tercero); connect.facebook.net/en_US/fbevents.js 205ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2315, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 24 corridas osciló entre 67 y 91 (mediana 74.5); este valor (81) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
