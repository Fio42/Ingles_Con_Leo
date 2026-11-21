# SITE HEALTH — 2026-11-21

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
| Home | 90/100 | 100/100 | 100/100 | 100/100 | 3133ms | 0.003 | 204ms |
| Práctica (gratis) | 95/100 | 100/100 | 94/100 | 100/100 | 1090ms | 0.002 | 267ms |
| Artículos (índice) | 96/100 | 100/100 | 96/100 | 100/100 | 1913ms | 0.003 | 168ms |
| Artículo: verbo to be | 93/100 | 100/100 | 100/100 | 95/100 | 1091ms | 0.004 | 324ms |
| Artículo: presente simple | 97/100 | 100/100 | 100/100 | 100/100 | 1082ms | 0.022 | 196ms |
| Artículo: cómo aprender desde cero | 97/100 | 100/100 | 100/100 | 100/100 | 1089ms | 0.002 | 196ms |
| Miembros (landing de pago) | 90/100 | 100/100 | 98/100 | 77/100 | 1091ms | 0.065 | 398ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3133ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 32ms, resourceLoadDelay 32ms, resourceLoadDuration 19ms, elementRenderDelay 86ms)
  - Bloquean el render: inglesconleo.com/style.css (314ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 177ms (tercero); www.googletagmanager.com/gtag/js 67ms (tercero); fonts.googleapis.com/css2 51ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3545, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 86.5); este valor (90) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1090ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 34ms, elementRenderDelay 95ms)
  - Bloquean el render: inglesconleo.com/style.css (314ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 170ms (tercero); inglesconleo.com/assets/libro/libro-portada.webp 113ms; www.googletagmanager.com/gtag/js 69ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3560, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 86); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1913ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 46ms, elementRenderDelay 110ms)
  - Bloquean el render: inglesconleo.com/style.css (156ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 191ms (tercero); img.youtube.com/vi/IyPbbyuz1ho/hqdefault.jpg 79ms (tercero); img.youtube.com/vi/QqTghI1S9Ec/hqdefault.jpg 78ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3569, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 90); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1091ms en `body > main > article.article-body > p` (timeToFirstByte 33ms, elementRenderDelay 133ms)
  - Bloquean el render: inglesconleo.com/video-guia.css (nullms); inglesconleo.com/style.css (315ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 172ms (tercero); www.youtube.com/embed/HBq0uVtB4VA 143ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 106ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3506, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 78 y 98 (mediana 88.5); este valor (93) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1082ms en `body > main > article.article-body > p` (timeToFirstByte 30ms, elementRenderDelay 85ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (311ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 169ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 78ms (tercero); www.googletagmanager.com/gtag/js 68ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3509, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 82 y 98 (mediana 88); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1089ms en `body > main > article.article-body > p` (timeToFirstByte 127ms, elementRenderDelay 117ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (315ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 171ms (tercero); inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 125ms; iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 96ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3556, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 50 y 98 (mediana 87); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1091ms en `main > div#gate > div > h1` (timeToFirstByte 38ms, elementRenderDelay 132ms)
  - Bloquean el render: inglesconleo.com/style.css (158ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 172ms (tercero); inglesconleo.com/data.js 134ms; accounts.google.com/gsi/button 121ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3559, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 77.5); este valor (90) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 82 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
