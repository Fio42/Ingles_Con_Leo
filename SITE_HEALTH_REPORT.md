# SITE HEALTH — 2026-11-26

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
| Home | 90/100 | 100/100 | 100/100 | 100/100 | 3118ms | 0.002 | 202ms |
| Práctica (gratis) | 95/100 | 100/100 | 94/100 | 100/100 | 1081ms | 0.002 | 268ms |
| Artículos (índice) | 98/100 | 100/100 | 96/100 | 100/100 | 1080ms | 0.003 | 147ms |
| Artículo: verbo to be | 94/100 | 100/100 | 100/100 | 95/100 | 1081ms | 0.004 | 295ms |
| Artículo: presente simple | 94/100 | 100/100 | 100/100 | 100/100 | 2086ms | 0.022 | 208ms |
| Artículo: cómo aprender desde cero | 94/100 | 100/100 | 100/100 | 100/100 | 2054ms | 0.002 | 200ms |
| Miembros (landing de pago) | 84/100 | 100/100 | 98/100 | 77/100 | 2398ms | 0.047 | 437ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3118ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 34ms, resourceLoadDelay 17ms, resourceLoadDuration 18ms, elementRenderDelay 90ms)
  - Bloquean el render: inglesconleo.com/style.css (313ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 193ms (tercero); www.googletagmanager.com/gtag/js 79ms (tercero); fonts.googleapis.com/css2 50ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3444, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 88); este valor (90) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1081ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 29ms, elementRenderDelay 97ms)
  - Bloquean el render: inglesconleo.com/style.css (309ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 194ms (tercero); www.googletagmanager.com/gtag/js 91ms (tercero); fonts.googleapis.com/css2 51ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3365, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 88); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1080ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 28ms, elementRenderDelay 84ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 1235ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 188ms (tercero); www.googletagmanager.com/gtag/js 85ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3469, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 91); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1081ms en `body > main > article.article-body > p` (timeToFirstByte 35ms, elementRenderDelay 127ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/video-guia.css (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 171ms (tercero); www.youtube.com/embed/HBq0uVtB4VA 133ms (tercero); www.googletagmanager.com/gtag/js 95ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3448, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 78 y 98 (mediana 89); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 2086ms en `body > main > article.article-body > p` (timeToFirstByte 35ms, elementRenderDelay 95ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 188ms (tercero); www.googletagmanager.com/gtag/js 94ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 90ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3488, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 82 y 98 (mediana 89); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 2054ms en `body > main > article.article-body > p` (timeToFirstByte 121ms, elementRenderDelay 84ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 183ms (tercero); inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 120ms; iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 85ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3480, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 76 y 98 (mediana 89); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 2398ms en `main > div#gate > div > h1` (timeToFirstByte 29ms, elementRenderDelay 152ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (154ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 194ms (tercero); accounts.google.com/gsi/button 118ms (tercero); www.googletagmanager.com/gtag/js 80ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3462, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 79); este valor (84) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 82 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
