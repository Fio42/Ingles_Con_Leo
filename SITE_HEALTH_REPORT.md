# SITE HEALTH — 2026-11-19

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 79 de 80

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
| Home | 94/100 | 100/100 | 100/100 | 100/100 | 2807ms | 0.002 | 152ms |
| Práctica (gratis) | 97/100 | 100/100 | 94/100 | 100/100 | 1128ms | 0.002 | 184ms |
| Artículos (índice) | 96/100 | 100/100 | 96/100 | 100/100 | 2027ms | 0.003 | 158ms |
| Artículo: verbo to be | 98/100 | 100/100 | 100/100 | 100/100 | 1146ms | 0.004 | 150ms |
| Artículo: presente simple | 97/100 | 100/100 | 100/100 | 100/100 | 1117ms | 0.022 | 209ms |
| Artículo: cómo aprender desde cero | 98/100 | 100/100 | 100/100 | 100/100 | 1121ms | 0.002 | 153ms |
| Miembros (landing de pago) | 91/100 | 100/100 | 98/100 | 77/100 | 1125ms | 0.078 | 337ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 2807ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 55ms, resourceLoadDelay 17ms, resourceLoadDuration 34ms, elementRenderDelay 68ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (328ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 139ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 112ms (tercero); fonts.googleapis.com/css2 98ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4101, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 83); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1128ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 102ms, elementRenderDelay 192ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 196ms (tercero); inglesconleo.com/data.js 152ms; inglesconleo.com/meta-pixel.js 114ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4037, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 85.5); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 2027ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 108ms, elementRenderDelay 161ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (164ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 235ms (tercero); www.googletagmanager.com/gtag/js 182ms (tercero); img.youtube.com/vi/fhbmGfsFAwY/hqdefault.jpg 150ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4108, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 89); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1146ms en `body > main > article.article-body > p` (timeToFirstByte 103ms, elementRenderDelay 73ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (326ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 384ms (tercero); www.googletagmanager.com/gtag/js 187ms (tercero); fonts.googleapis.com/css2 136ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4176, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 75 y 98 (mediana 87.5); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1117ms en `body > main > article.article-body > p` (timeToFirstByte 106ms, elementRenderDelay 103ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 185ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 162ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 143ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4020, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 69 y 98 (mediana 87.5); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1121ms en `body > main > article.article-body > p` (timeToFirstByte 55ms, elementRenderDelay 87ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (332ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 364ms (tercero); www.googletagmanager.com/gtag/js 187ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 100ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4014, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 50 y 98 (mediana 86.5); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1125ms en `main > div#gate > div > h1` (timeToFirstByte 54ms, elementRenderDelay 74ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: accounts.google.com/gsi/button 187ms (tercero); www.googletagmanager.com/gtag/js 172ms (tercero); m.stripe.com/6 171ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4029, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 77); este valor (91) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 80 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
