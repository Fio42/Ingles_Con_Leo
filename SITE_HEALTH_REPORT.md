# SITE HEALTH — 2026-11-10

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
| Home | 91/100 | 100/100 | 100/100 | 100/100 | 1133ms | 0.004 | 370ms |
| Práctica (gratis) | 89/100 | 100/100 | 93/100 | 100/100 | 1096ms | 0.002 | 436ms |
| Artículos (índice) | 91/100 | 100/100 | 96/100 | 100/100 | 2019ms | 0.004 | 314ms |
| Artículo: verbo to be | 90/100 | 100/100 | 100/100 | 100/100 | 1324ms | 0.000 | 415ms |
| Artículo: presente simple | 92/100 | 100/100 | 100/100 | 100/100 | 1937ms | 0.022 | 294ms |
| Artículo: cómo aprender desde cero | 89/100 | 100/100 | 100/100 | 100/100 | 1130ms | 0.002 | 447ms |
| Miembros (landing de pago) | 82/100 | 100/100 | 98/100 | 77/100 | 1093ms | 0.076 | 667ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1133ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 20ms, elementRenderDelay 136ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (309ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 895ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 176ms (tercero); connect.facebook.net/en_US/fbevents.js 166ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2687, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 31 corridas osciló entre 46 y 98 (mediana 81); este valor (91) ya se había visto.
- practica: LCP 1096ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 36ms, elementRenderDelay 143ms)
  - Bloquean el render: inglesconleo.com/style.css (316ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 214ms (tercero); connect.facebook.net/en_US/fbevents.js 87ms (tercero); www.google-analytics.com/g/collect 73ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2633, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 31 corridas osciló entre 53 y 97 (mediana 83); este valor (89) ya se había visto.
- articulos: LCP 2019ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 138ms, elementRenderDelay 250ms)
  - Bloquean el render: inglesconleo.com/style.css (159ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 169ms (tercero); inglesconleo.com/articulos.html 138ms; inglesconleo.com/style.css 129ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2736, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 31 corridas osciló entre 54 y 98 (mediana 86); este valor (91) ya se había visto.
- articulo-verbo-to-be: LCP 1324ms en `body > main > article.article-body > p` (timeToFirstByte 281ms, elementRenderDelay 353ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (317ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: inglesconleo.com/leobot.png 315ms; inglesconleo.com/favicon.ico 308ms; inglesconleo.com/articulo-verbo-to-be.html 280ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2704, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 31 corridas osciló entre 75 y 98 (mediana 85); este valor (90) ya se había visto.
- articulo-presente-simple: LCP 1937ms en `body > main > article.article-body > p` (timeToFirstByte 128ms, elementRenderDelay 151ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 175ms (tercero); connect.facebook.net/en_US/fbevents.js 157ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 146ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2731, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 31 corridas osciló entre 69 y 98 (mediana 87); este valor (92) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1130ms en `body > main > article.article-body > p` (timeToFirstByte 134ms, elementRenderDelay 152ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 182ms (tercero); connect.facebook.net/en_US/fbevents.js 153ms (tercero); inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 133ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2692, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 31 corridas osciló entre 50 y 97 (mediana 86); este valor (89) ya se había visto.
- miembros: LCP 1093ms en `main > div#gate > div > h1` (timeToFirstByte 34ms, elementRenderDelay 157ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: js.stripe.com/v3/ 232ms (tercero); accounts.google.com/gsi/client 179ms (tercero); accounts.google.com/gsi/button 176ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2740, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 31 corridas osciló entre 67 y 91 (mediana 77); este valor (82) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
