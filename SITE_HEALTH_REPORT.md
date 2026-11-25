# SITE HEALTH — 2026-11-25

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 81 de 82

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
| Home | 87/100 | 100/100 | 100/100 | 100/100 | 3152ms | 0.003 | 301ms |
| Práctica (gratis) | 94/100 | 100/100 | 94/100 | 100/100 | 1063ms | 0.002 | 275ms |
| Artículos (índice) | 93/100 | 100/100 | 96/100 | 100/100 | 2268ms | 0.003 | 186ms |
| Artículo: verbo to be | 89/100 | 100/100 | 100/100 | 95/100 | 1094ms | 0.004 | 447ms |
| Artículo: presente simple | 93/100 | 100/100 | 100/100 | 100/100 | 2040ms | 0.022 | 232ms |
| Artículo: cómo aprender desde cero | 93/100 | 100/100 | 100/100 | 100/100 | 1934ms | 0.002 | 263ms |
| Miembros (landing de pago) | 87/100 | 100/100 | 98/100 | 77/100 | 1094ms | 0.076 | 469ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3152ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 36ms, resourceLoadDelay 12ms, resourceLoadDuration 27ms, elementRenderDelay 88ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (317ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 178ms (tercero); connect.facebook.net/en_US/fbevents.js 115ms (tercero); www.googletagmanager.com/gtag/js 84ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3054, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 88); este valor (87) ya se había visto.
- practica: LCP 1063ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 17ms, elementRenderDelay 80ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 181ms (tercero); connect.facebook.net/en_US/fbevents.js 118ms (tercero); www.googletagmanager.com/gtag/js 90ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2991, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 87.5); este valor (94) ya se había visto.
- articulos: LCP 2268ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 133ms, elementRenderDelay 240ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (158ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/JPq1KBBsbtI/hqdefault.jpg 220ms (tercero); img.youtube.com/vi/fhbmGfsFAwY/hqdefault.jpg 212ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 212ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2979, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 91); este valor (93) ya se había visto.
- articulo-verbo-to-be: LCP 1094ms en `body > main > article.article-body > p` (timeToFirstByte 34ms, elementRenderDelay 139ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (316ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 198ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 179ms (tercero); www.youtube.com/embed/HBq0uVtB4VA 163ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3003, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 78 y 98 (mediana 88.5); este valor (89) ya se había visto.
- articulo-presente-simple: LCP 2040ms en `body > main > article.article-body > p` (timeToFirstByte 121ms, elementRenderDelay 78ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 215ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 164ms (tercero); www.facebook.com/tr/ 136ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2946, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 82 y 98 (mediana 89); este valor (93) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1934ms en `body > main > article.article-body > p` (timeToFirstByte 121ms, elementRenderDelay 106ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 180ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 167ms (tercero); www.facebook.com/tr/ 132ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3016, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 76 y 98 (mediana 88.5); este valor (93) ya se había visto.
- miembros: LCP 1094ms en `main > div#gate > div > h1` (timeToFirstByte 146ms, elementRenderDelay 211ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (159ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: accounts.google.com/gsi/button 396ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 183ms (tercero); accounts.google.com/gsi/client 162ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3113, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 78.5); este valor (87) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 82 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
