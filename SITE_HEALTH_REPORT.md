# SITE HEALTH — 2026-11-14

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 6
🟢 Páginas sin problemas: 73 de 80

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

🟡 https://inglesconleo.com/ejercicios-ingles-a1.html 🆕 NUEVO
El HTML creció de 13KB a 22KB desde la última corrida.
Impacto: Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.
Acción: Revisar si el crecimiento fue intencional.

🟡 https://inglesconleo.com/articulo-do-vs-does.html 🆕 NUEVO
El HTML creció de 18KB a 29KB desde la última corrida.
Impacto: Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.
Acción: Revisar si el crecimiento fue intencional.

🟡 https://inglesconleo.com/articulo-pasado-simple.html 🆕 NUEVO
El HTML creció de 28KB a 45KB desde la última corrida.
Impacto: Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.
Acción: Revisar si el crecimiento fue intencional.

🟡 https://inglesconleo.com/articulo-presente-continuo.html 🆕 NUEVO
El HTML creció de 10KB a 37KB desde la última corrida.
Impacto: Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.
Acción: Revisar si el crecimiento fue intencional.

🟡 https://inglesconleo.com/articulo-vocabulario-basico.html 🆕 NUEVO
El HTML creció de 15KB a 29KB desde la última corrida.
Impacto: Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.
Acción: Revisar si el crecimiento fue intencional.

🟡 https://inglesconleo.com/articulo-ingles-recepcionistas-hotel.html 🆕 NUEVO
El HTML creció de 12KB a 25KB desde la última corrida.
Impacto: Un crecimiento brusco a veces es contenido duplicado sin querer o código pegado de más.
Acción: Revisar si el crecimiento fue intencional.

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
| Home | 90/100 | 100/100 | 100/100 | 100/100 | 3150ms | 0.003 | 202ms |
| Práctica (gratis) | 96/100 | 100/100 | 94/100 | 100/100 | 1089ms | 0.002 | 230ms |
| Artículos (índice) | 98/100 | 100/100 | 96/100 | 100/100 | 1087ms | 0.003 | 163ms |
| Artículo: verbo to be | 94/100 | 100/100 | 100/100 | 100/100 | 2070ms | 0.004 | 197ms |
| Artículo: presente simple | 97/100 | 100/100 | 100/100 | 100/100 | 1089ms | 0.022 | 199ms |
| Artículo: cómo aprender desde cero | 94/100 | 100/100 | 100/100 | 100/100 | 2076ms | 0.002 | 194ms |
| Miembros (landing de pago) | 89/100 | 100/100 | 98/100 | 77/100 | 1083ms | 0.046 | 441ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3150ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 42ms, resourceLoadDelay 17ms, resourceLoadDuration 21ms, elementRenderDelay 79ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (316ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 174ms (tercero); www.googletagmanager.com/gtag/js 70ms (tercero); fonts.googleapis.com/css2 51ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3428, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 35 corridas osciló entre 46 y 98 (mediana 82); este valor (90) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1089ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 32ms, elementRenderDelay 79ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (314ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 173ms (tercero); www.googletagmanager.com/gtag/js 69ms (tercero); fonts.googleapis.com/css2 56ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3430, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 35 corridas osciló entre 53 y 98 (mediana 84); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1087ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 30ms, elementRenderDelay 115ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (156ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 177ms (tercero); img.youtube.com/vi/qYfRn_KUcyE/hqdefault.jpg 85ms (tercero); img.youtube.com/vi/VjH45nwgf38/hqdefault.jpg 77ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3429, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 35 corridas osciló entre 54 y 98 (mediana 88); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 2070ms en `body > main > article.article-body > p` (timeToFirstByte 30ms, elementRenderDelay 100ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (312ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 202ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 93ms (tercero); www.googletagmanager.com/gtag/js 65ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3419, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 35 corridas osciló entre 75 y 98 (mediana 87); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1089ms en `body > main > article.article-body > p` (timeToFirstByte 33ms, elementRenderDelay 78ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (315ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 177ms (tercero); www.googletagmanager.com/gtag/js 66ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 66ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3392, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 35 corridas osciló entre 69 y 98 (mediana 87); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 2076ms en `body > main > article.article-body > p` (timeToFirstByte 31ms, elementRenderDelay 89ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (315ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 182ms (tercero); www.googletagmanager.com/gtag/js 61ms (tercero); fonts.googleapis.com/css2 48ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3411, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 35 corridas osciló entre 50 y 98 (mediana 86); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1083ms en `main > div#gate > div > h1` (timeToFirstByte 29ms, elementRenderDelay 129ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (156ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 183ms (tercero); accounts.google.com/gsi/button 118ms (tercero); accounts.google.com/gsi/client 73ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3402, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 35 corridas osciló entre 67 y 93 (mediana 77); este valor (89) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 80 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
