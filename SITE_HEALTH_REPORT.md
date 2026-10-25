# SITE HEALTH — 2026-10-25

🔴 Críticos: 0
🟠 Importantes: 4
🟡 Mejoras: 5
🟢 Páginas sin problemas: 67 de 72

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 61/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance = 62/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 69/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 61/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance = 62/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 69/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

🟡 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance bajó de 97 a 61 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 15 corridas osciló entre 50 y 97 (mediana 77); este valor (61) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance bajó de 86 a 62 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 15 corridas osciló entre 53 y 87 (mediana 75); este valor (62) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/articulo-verbo-to-be.html 🆕 NUEVO
Lighthouse Performance bajó de 95 a 83 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 15 corridas osciló entre 75 y 95 (mediana 83); este valor (83) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/articulo-presente-simple.html 🆕 NUEVO
Lighthouse Performance bajó de 94 a 82 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 15 corridas osciló entre 69 y 94 (mediana 84); este valor (82) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance bajó de 87 a 69 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 15 corridas osciló entre 67 y 87 (mediana 68); este valor (69) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

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
| Home | 61/100 | 100/100 | 100/100 | 100/100 | 2806ms | 0.000 | 2935ms |
| Práctica (gratis) | 62/100 | 100/100 | 93/100 | 100/100 | 3535ms | 0.176 | 667ms |
| Artículos (índice) | 86/100 | 100/100 | 96/100 | 100/100 | 2575ms | 0.002 | 404ms |
| Artículo: verbo to be | 83/100 | 100/100 | 100/100 | 100/100 | 2786ms | 0.001 | 525ms |
| Artículo: presente simple | 82/100 | 100/100 | 100/100 | 100/100 | 2790ms | 0.009 | 537ms |
| Artículo: cómo aprender desde cero | 83/100 | 100/100 | 100/100 | 100/100 | 2790ms | 0.000 | 504ms |
| Miembros (landing de pago) | 69/100 | 100/100 | 98/100 | 77/100 | 3449ms | 0.079 | 871ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 2806ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 262ms, elementRenderDelay 1083ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (456ms)
  - Peticiones más lentas: fonts.googleapis.com/css2 331ms (tercero); www.google-analytics.com/g/collect 289ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 229ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 1141, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 15 corridas osciló entre 50 y 97 (mediana 77); este valor (61) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 3535ms en `section > div.wrap > p#practicaModoAprender > span` (timeToFirstByte 71ms, elementRenderDelay 166ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (455ms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 272ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 124ms (tercero); inglesconleo.com/data.js 102ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2429, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 15 corridas osciló entre 53 y 87 (mediana 75); este valor (62) ya se había visto.
- articulos: LCP 2575ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 16ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (455ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 89ms (tercero); www.googletagmanager.com/gtag/js 76ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 76ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2429, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 15 corridas osciló entre 54 y 95 (mediana 82); este valor (86) ya se había visto.
- articulo-verbo-to-be: LCP 2786ms en `body > main > article.article-body > p` (timeToFirstByte 24ms, elementRenderDelay 98ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 268ms (tercero); www.googletagmanager.com/gtag/js 116ms (tercero); fonts.googleapis.com/css2 101ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2459, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 15 corridas osciló entre 75 y 95 (mediana 83); este valor (83) ya se había visto.
- articulo-presente-simple: LCP 2790ms en `body > main > article.article-body > p` (timeToFirstByte 103ms, elementRenderDelay 107ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 335ms (tercero); inglesconleo.com/articulo-presente-simple.html 102ms; fonts.googleapis.com/css2 95ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2462, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 15 corridas osciló entre 69 y 94 (mediana 84); este valor (82) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2790ms en `body > main > article.article-body > p` (timeToFirstByte 18ms, elementRenderDelay 102ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (455ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 379ms (tercero); www.google-analytics.com/g/collect 97ms (tercero); fonts.googleapis.com/css2 85ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2458, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 15 corridas osciló entre 50 y 93 (mediana 81); este valor (83) ya se había visto.
- miembros: LCP 3449ms en `main > div#gate > div > h1` (timeToFirstByte 72ms, elementRenderDelay 146ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (455ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 206ms (tercero); www.google-analytics.com/g/collect 142ms (tercero); accounts.google.com/gsi/button 113ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2478, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 15 corridas osciló entre 67 y 87 (mediana 68); este valor (69) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 72 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
