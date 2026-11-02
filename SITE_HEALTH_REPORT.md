# SITE HEALTH — 2026-11-02

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

ℹ️ https://inglesconleo.com 🆕 NUEVO
Best Practices se calculó sin la cookie de terceros del Meta Pixel (6 página(s)).
Impacto: Lighthouse penaliza la cookie "fr" de facebook.com aunque no se puede quitar sin desactivar el pixel de anuncios; se ignora para no marcar críticos falsos.
Acción: Nada que hacer, salvo que algún día se quite el pixel.

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 97/100 | 100/100 | 100/100 | 100/100 | 1097ms | 0.002 | 188ms |
| Práctica (gratis) | 96/100 | 100/100 | 93/100 | 100/100 | 1098ms | 0.002 | 222ms |
| Artículos (índice) | 97/100 | 100/100 | 96/100 | 100/100 | 1795ms | 0.004 | 138ms |
| Artículo: verbo to be | 95/100 | 100/100 | 100/100 | 100/100 | 1616ms | 0.004 | 220ms |
| Artículo: presente simple | 95/100 | 100/100 | 100/100 | 100/100 | 1100ms | 0.022 | 241ms |
| Artículo: cómo aprender desde cero | 95/100 | 100/100 | 100/100 | 100/100 | 1095ms | 0.002 | 240ms |
| Miembros (landing de pago) | 91/100 | 100/100 | 98/100 | 77/100 | 1105ms | 0.079 | 325ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1097ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 39ms, elementRenderDelay 89ms)
  - Bloquean el render: inglesconleo.com/style.css (318ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 171ms (tercero); www.googletagmanager.com/gtag/js 89ms (tercero); connect.facebook.net/en_US/fbevents.js 78ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4079, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 23 corridas osciló entre 50 y 97 (mediana 78); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1098ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 126ms, elementRenderDelay 149ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (318ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 176ms (tercero); www.googletagmanager.com/gtag/js 129ms (tercero); inglesconleo.com/practica.html 126ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4399, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 23 corridas osciló entre 53 y 95 (mediana 82); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1795ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 41ms, elementRenderDelay 160ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (162ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 176ms (tercero); inglesconleo.com/site.webmanifest 133ms; inglesconleo.com/chatbot.js 101ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4211, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 23 corridas osciló entre 54 y 98 (mediana 84); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1616ms en `body > main > article.article-body > p` (timeToFirstByte 138ms, elementRenderDelay 1178ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (323ms); inglesconleo.com/academia-lanzamiento.js (161ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 591ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 255ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 166ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4414, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 23 corridas osciló entre 75 y 96 (mediana 84); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1100ms en `body > main > article.article-body > p` (timeToFirstByte 128ms, elementRenderDelay 143ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (325ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 424ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 170ms (tercero); inglesconleo.com/articulo-presente-simple.html 128ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4238, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 23 corridas osciló entre 69 y 97 (mediana 85); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1095ms en `body > main > article.article-body > p` (timeToFirstByte 120ms, elementRenderDelay 72ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 190ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 179ms (tercero); inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 120ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4205, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 23 corridas osciló entre 50 y 95 (mediana 83); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1105ms en `main > div#gate > div > h1` (timeToFirstByte 40ms, elementRenderDelay 98ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: accounts.google.com/gsi/client 186ms (tercero); accounts.google.com/gsi/button 178ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 175ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3959, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 23 corridas osciló entre 67 y 90 (mediana 74); este valor (91) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
