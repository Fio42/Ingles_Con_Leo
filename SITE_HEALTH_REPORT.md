# SITE HEALTH — 2026-11-13

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 76 de 77

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
| Home | 97/100 | 100/100 | 100/100 | 100/100 | 1166ms | 0.004 | 198ms |
| Práctica (gratis) | 96/100 | 100/100 | 94/100 | 100/100 | 1110ms | 0.002 | 221ms |
| Artículos (índice) | 92/100 | 100/100 | 96/100 | 100/100 | 2125ms | 0.003 | 250ms |
| Artículo: verbo to be | 95/100 | 100/100 | 100/100 | 100/100 | 1097ms | 0.004 | 262ms |
| Artículo: presente simple | 97/100 | 100/100 | 100/100 | 100/100 | 1106ms | 0.022 | 199ms |
| Artículo: cómo aprender desde cero | 93/100 | 100/100 | 100/100 | 100/100 | 1956ms | 0.002 | 261ms |
| Miembros (landing de pago) | 91/100 | 100/100 | 98/100 | 77/100 | 1103ms | 0.076 | 316ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1166ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 45ms, elementRenderDelay 133ms)
  - Bloquean el render: inglesconleo.com/style.css (325ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 178ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 111ms (tercero); www.google-analytics.com/g/collect 97ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4001, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 34 corridas osciló entre 46 y 98 (mediana 82); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1110ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 43ms, elementRenderDelay 82ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 209ms (tercero); www.googletagmanager.com/gtag/js 144ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 118ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3713, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 34 corridas osciló entre 53 y 98 (mediana 83.5); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 2125ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 124ms, elementRenderDelay 206ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (164ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 182ms (tercero); img.youtube.com/vi/IyPbbyuz1ho/hqdefault.jpg 170ms (tercero); img.youtube.com/vi/JPq1KBBsbtI/hqdefault.jpg 168ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3803, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 34 corridas osciló entre 54 y 98 (mediana 87); este valor (92) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1097ms en `body > main > article.article-body > p` (timeToFirstByte 43ms, elementRenderDelay 93ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (318ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 381ms (tercero); www.googletagmanager.com/gtag/js 161ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 114ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3918, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 34 corridas osciló entre 75 y 98 (mediana 86.5); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1106ms en `body > main > article.article-body > p` (timeToFirstByte 97ms, elementRenderDelay 88ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (330ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 251ms (tercero); www.googletagmanager.com/gtag/js 182ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 136ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3858, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 34 corridas osciló entre 69 y 98 (mediana 87); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1956ms en `body > main > article.article-body > p` (timeToFirstByte 121ms, elementRenderDelay 168ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 187ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 161ms (tercero); inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 121ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3690, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 34 corridas osciló entre 50 y 98 (mediana 86); este valor (93) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1103ms en `main > div#gate > div > h1` (timeToFirstByte 148ms, elementRenderDelay 104ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 248ms (tercero); accounts.google.com/gsi/button 195ms (tercero); m.stripe.com/6 180ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3940, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 34 corridas osciló entre 67 y 93 (mediana 77); este valor (91) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 77 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
