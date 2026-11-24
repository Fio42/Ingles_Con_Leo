# SITE HEALTH — 2026-11-24

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
| Home | 80/100 | 100/100 | 100/100 | 100/100 | 3949ms | 0.002 | 340ms |
| Práctica (gratis) | 95/100 | 100/100 | 94/100 | 100/100 | 1168ms | 0.002 | 269ms |
| Artículos (índice) | 95/100 | 100/100 | 96/100 | 100/100 | 1104ms | 0.003 | 258ms |
| Artículo: verbo to be | 88/100 | 100/100 | 100/100 | 95/100 | 1164ms | 0.004 | 487ms |
| Artículo: presente simple | 96/100 | 100/100 | 100/100 | 100/100 | 1149ms | 0.022 | 221ms |
| Artículo: cómo aprender desde cero | 93/100 | 100/100 | 100/100 | 100/100 | 1131ms | 0.002 | 326ms |
| Miembros (landing de pago) | 82/100 | 100/100 | 98/100 | 77/100 | 1110ms | 0.076 | 667ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3949ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 50ms, resourceLoadDelay 50ms, resourceLoadDuration 35ms, elementRenderDelay 92ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (329ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 164ms (tercero); fonts.googleapis.com/css2 107ms (tercero); inglesconleo.com/site.webmanifest 87ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3090, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 88); este valor (80) ya se había visto.
- practica: LCP 1168ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 120ms, elementRenderDelay 173ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (329ms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 221ms (tercero); www.googletagmanager.com/gtag/js 149ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 131ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3082, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 86.5); este valor (95) ya se había visto.
- articulos: LCP 1104ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 98ms, elementRenderDelay 147ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (160ms)
  - Peticiones más lentas: img.youtube.com/vi/gf9T2K-zWcQ/hqdefault.jpg 356ms (tercero); www.googletagmanager.com/gtag/js 157ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 129ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3181, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 91); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1164ms en `body > main > article.article-body > p` (timeToFirstByte 125ms, elementRenderDelay 222ms)
  - Bloquean el render: inglesconleo.com/style.css (331ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/video-guia.css (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 640ms (tercero); www.googletagmanager.com/gtag/js 169ms (tercero); www.youtube.com/embed/HBq0uVtB4VA 161ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2473, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 78 y 98 (mediana 88.5); este valor (88) ya se había visto.
- articulo-presente-simple: LCP 1149ms en `body > main > article.article-body > p` (timeToFirstByte 89ms, elementRenderDelay 86ms)
  - Bloquean el render: inglesconleo.com/style.css (328ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 292ms (tercero); www.googletagmanager.com/gtag/js 143ms (tercero); fonts.googleapis.com/css2 100ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3309, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 82 y 98 (mediana 88.5); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1131ms en `body > main > article.article-body > p` (timeToFirstByte 118ms, elementRenderDelay 129ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 197ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 152ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 144ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3136, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 76 y 98 (mediana 88); este valor (93) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1110ms en `main > div#gate > div > h1` (timeToFirstByte 95ms, elementRenderDelay 116ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 204ms (tercero); accounts.google.com/gsi/button 196ms (tercero); m.stripe.com/6 176ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2955, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 78); este valor (82) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 82 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
