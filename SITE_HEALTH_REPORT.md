# SITE HEALTH — 2026-11-22

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 1
🟢 Páginas sin problemas: 81 de 82

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

🟡 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance bajó de 90 a 78 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 77.5); este valor (78) ya se había visto.
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
| Home | 88/100 | 100/100 | 100/100 | 100/100 | 2312ms | 0.002 | 421ms |
| Práctica (gratis) | 89/100 | 100/100 | 94/100 | 100/100 | 1149ms | 0.002 | 446ms |
| Artículos (índice) | 90/100 | 100/100 | 96/100 | 100/100 | 1134ms | 0.003 | 418ms |
| Artículo: verbo to be | 83/100 | 100/100 | 100/100 | 95/100 | 1139ms | 0.004 | 660ms |
| Artículo: presente simple | 90/100 | 100/100 | 100/100 | 100/100 | 1136ms | 0.022 | 410ms |
| Artículo: cómo aprender desde cero | 88/100 | 100/100 | 100/100 | 100/100 | 1131ms | 0.002 | 467ms |
| Miembros (landing de pago) | 78/100 | 100/100 | 98/100 | 77/100 | 1181ms | 0.079 | 867ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 2312ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 65ms, resourceLoadDelay 44ms, resourceLoadDuration 56ms, elementRenderDelay 91ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (335ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 167ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 130ms (tercero); www.googletagmanager.com/gtag/js 124ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2476, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 88); este valor (88) ya se había visto.
- practica: LCP 1149ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 124ms, elementRenderDelay 157ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (334ms)
  - Peticiones más lentas: inglesconleo.com/site.webmanifest 232ms; connect.facebook.net/en_US/fbevents.js 172ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 139ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2496, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 86); este valor (89) ya se había visto.
- articulos: LCP 1134ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 61ms, elementRenderDelay 167ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 239ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 132ms (tercero); connect.facebook.net/signals/config/2182739922655837 97ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2493, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 90.5); este valor (90) ya se había visto.
- articulo-verbo-to-be: LCP 1139ms en `body > main > article.article-body > p` (timeToFirstByte 68ms, elementRenderDelay 140ms)
  - Bloquean el render: inglesconleo.com/style.css (335ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 300ms (tercero); connect.facebook.net/en_US/fbevents.js 180ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 146ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2478, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 78 y 98 (mediana 88.5); este valor (83) ya se había visto.
- articulo-presente-simple: LCP 1136ms en `body > main > article.article-body > p` (timeToFirstByte 113ms, elementRenderDelay 143ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (334ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 241ms (tercero); connect.facebook.net/en_US/fbevents.js 188ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 138ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2469, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 82 y 98 (mediana 88); este valor (90) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1131ms en `body > main > article.article-body > p` (timeToFirstByte 122ms, elementRenderDelay 121ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 332ms (tercero); connect.facebook.net/en_US/fbevents.js 186ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 153ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2438, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 50 y 98 (mediana 87); este valor (88) ya se había visto.
- miembros: LCP 1181ms en `main > div#gate > div > h1` (timeToFirstByte 136ms, elementRenderDelay 130ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 280ms (tercero); accounts.google.com/gsi/client 230ms (tercero); accounts.google.com/gsi/button 228ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2486, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 77.5); este valor (78) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 82 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
