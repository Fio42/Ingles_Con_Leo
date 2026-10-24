# SITE HEALTH — 2026-10-24

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 71 de 72

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
| Home | 97/100 | 100/100 | 100/100 | 100/100 | 1942ms | 0.001 | 156ms |
| Práctica (gratis) | 86/100 | 100/100 | 93/100 | 100/100 | 2128ms | 0.176 | 251ms |
| Artículos (índice) | 95/100 | 100/100 | 96/100 | 100/100 | 2209ms | 0.002 | 191ms |
| Artículo: verbo to be | 95/100 | 100/100 | 100/100 | 100/100 | 1096ms | 0.001 | 259ms |
| Artículo: presente simple | 94/100 | 100/100 | 100/100 | 100/100 | 1947ms | 0.009 | 258ms |
| Artículo: cómo aprender desde cero | 93/100 | 100/100 | 100/100 | 100/100 | 2584ms | 0.000 | 236ms |
| Miembros (landing de pago) | 87/100 | 100/100 | 98/100 | 77/100 | 1762ms | 0.080 | 406ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1942ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 90ms, elementRenderDelay 129ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (477ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 190ms (tercero); inglesconleo.com/audio/leo/bienvenida.mp3 123ms; connect.facebook.net/en_US/fbevents.js 115ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4069, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 14 corridas osciló entre 50 y 82 (mediana 76.5); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 2128ms en `section > div.wrap > p#practicaModoAprender > span` (timeToFirstByte 40ms, elementRenderDelay 118ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (484ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 153ms (tercero); inglesconleo.com/chatbot.css 124ms; connect.facebook.net/en_US/fbevents.js 114ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4185, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 14 corridas osciló entre 53 y 87 (mediana 74.5); este valor (86) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 2209ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 36ms, elementRenderDelay 82ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (159ms); inglesconleo.com/style.css (318ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 173ms (tercero); img.youtube.com/vi/qYfRn_KUcyE/hqdefault.jpg 162ms (tercero); img.youtube.com/vi/QqTghI1S9Ec/hqdefault.jpg 154ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4190, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 14 corridas osciló entre 54 y 86 (mediana 82); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1096ms en `body > main > article.article-body > p` (timeToFirstByte 36ms, elementRenderDelay 76ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (318ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 291ms (tercero); www.googletagmanager.com/gtag/js 161ms (tercero); connect.facebook.net/en_US/fbevents.js 123ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4128, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 14 corridas osciló entre 75 y 90 (mediana 82.5); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1947ms en `body > main > article.article-body > p` (timeToFirstByte 114ms, elementRenderDelay 89ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (330ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 316ms (tercero); www.googletagmanager.com/gtag/js 174ms (tercero); connect.facebook.net/en_US/fbevents.js 140ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3823, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 14 corridas osciló entre 69 y 89 (mediana 84); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 2584ms en `body > main > article.article-body > p` (timeToFirstByte 114ms, elementRenderDelay 85ms)
  - Bloquean el render: inglesconleo.com/style.css (333ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 451ms (tercero); connect.facebook.net/en_US/fbevents.js 135ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 115ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3883, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 14 corridas osciló entre 50 y 88 (mediana 80); este valor (93) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1762ms en `main > div#gate > div > h1` (timeToFirstByte 37ms, elementRenderDelay 95ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (159ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (478ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 199ms (tercero); m.stripe.com/6 167ms (tercero); connect.facebook.net/en_US/fbevents.js 161ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3952, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 14 corridas osciló entre 67 y 82 (mediana 68); este valor (87) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 72 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
