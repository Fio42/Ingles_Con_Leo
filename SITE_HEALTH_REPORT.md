# SITE HEALTH — 2026-11-09

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
| Home | 98/100 | 100/100 | 100/100 | 100/100 | 1123ms | 0.004 | 169ms |
| Práctica (gratis) | 97/100 | 100/100 | 93/100 | 100/100 | 1163ms | 0.002 | 203ms |
| Artículos (índice) | 97/100 | 100/100 | 96/100 | 100/100 | 1994ms | 0.004 | 115ms |
| Artículo: verbo to be | 98/100 | 100/100 | 100/100 | 100/100 | 1115ms | 0.004 | 140ms |
| Artículo: presente simple | 98/100 | 100/100 | 100/100 | 100/100 | 1107ms | 0.022 | 156ms |
| Artículo: cómo aprender desde cero | 97/100 | 100/100 | 100/100 | 100/100 | 1159ms | 0.002 | 202ms |
| Miembros (landing de pago) | 91/100 | 100/100 | 98/100 | 77/100 | 1103ms | 0.076 | 333ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1123ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 39ms, elementRenderDelay 145ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (318ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 161ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 137ms (tercero); fonts.googleapis.com/css2 70ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4114, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 30 corridas osciló entre 46 y 97 (mediana 81); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1163ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 113ms, elementRenderDelay 179ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: inglesconleo.com/data.js 170ms; www.googletagmanager.com/gtag/js 148ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 136ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3982, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 30 corridas osciló entre 53 y 96 (mediana 83); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1994ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 47ms, elementRenderDelay 140ms)
  - Bloquean el render: inglesconleo.com/style.css (161ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 167ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 121ms (tercero); img.youtube.com/vi/JPq1KBBsbtI/hqdefault.jpg 117ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4203, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 30 corridas osciló entre 54 y 98 (mediana 85.5); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1115ms en `body > main > article.article-body > p` (timeToFirstByte 114ms, elementRenderDelay 71ms)
  - Bloquean el render: inglesconleo.com/style.css (325ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 631ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 164ms (tercero); www.googletagmanager.com/gtag/js 143ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4202, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 30 corridas osciló entre 75 y 96 (mediana 85); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1107ms en `body > main > article.article-body > p` (timeToFirstByte 46ms, elementRenderDelay 76ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 235ms (tercero); www.googletagmanager.com/gtag/js 156ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 133ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4157, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 30 corridas osciló entre 69 y 97 (mediana 86); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1159ms en `body > main > article.article-body > p` (timeToFirstByte 50ms, elementRenderDelay 85ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (332ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 255ms (tercero); www.googletagmanager.com/gtag/js 156ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 123ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4370, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 30 corridas osciló entre 50 y 95 (mediana 86); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1103ms en `main > div#gate > div > h1` (timeToFirstByte 108ms, elementRenderDelay 109ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (162ms)
  - Peticiones más lentas: inglesconleo.com/academia-cursos.js 215ms; www.googletagmanager.com/gtag/js 205ms (tercero); m.stripe.com/6 204ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4455, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 30 corridas osciló entre 67 y 91 (mediana 77); este valor (91) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
