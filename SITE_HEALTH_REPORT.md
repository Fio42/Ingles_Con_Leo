# SITE HEALTH — 2026-10-28

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 5
🟢 Páginas sin problemas: 69 de 74

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

🟡 https://inglesconleo.com/practica.html 🆕 NUEVO
Lighthouse Performance bajó de 94 a 83 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 18 corridas osciló entre 53 y 94 (mediana 75); este valor (83) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/articulo-verbo-to-be.html 🆕 NUEVO
Lighthouse Performance bajó de 96 a 84 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 18 corridas osciló entre 75 y 96 (mediana 83); este valor (84) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/articulo-presente-simple.html 🆕 NUEVO
Lighthouse Performance bajó de 97 a 84 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 18 corridas osciló entre 69 y 97 (mediana 84); este valor (84) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 🆕 NUEVO
Lighthouse Performance bajó de 95 a 83 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 18 corridas osciló entre 50 y 95 (mediana 82.5); este valor (83) ya se había visto.
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance bajó de 90 a 77 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 18 corridas osciló entre 67 y 90 (mediana 69); este valor (77) ya se había visto.
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
| Home | 88/100 | 100/100 | 100/100 | 100/100 | 1096ms | 0.002 | 476ms |
| Práctica (gratis) | 83/100 | 100/100 | 93/100 | 100/100 | 1060ms | 0.002 | 677ms |
| Artículos (índice) | 89/100 | 100/100 | 96/100 | 100/100 | 1060ms | 0.004 | 454ms |
| Artículo: verbo to be | 84/100 | 100/100 | 100/100 | 100/100 | 1059ms | 0.004 | 617ms |
| Artículo: presente simple | 84/100 | 100/100 | 100/100 | 100/100 | 1060ms | 0.022 | 659ms |
| Artículo: cómo aprender desde cero | 83/100 | 100/100 | 100/100 | 100/100 | 1058ms | 0.002 | 711ms |
| Miembros (landing de pago) | 77/100 | 100/100 | 98/100 | 77/100 | 1143ms | 0.079 | 975ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1096ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 21ms, elementRenderDelay 142ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 101ms (tercero); www.googletagmanager.com/gtag/js 86ms (tercero); inglesconleo.com/audio/leo/bienvenida.mp3 77ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2454, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 18 corridas osciló entre 50 y 97 (mediana 76.5); este valor (88) ya se había visto.
- practica: LCP 1060ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 15ms, elementRenderDelay 122ms)
  - Bloquean el render: inglesconleo.com/style.css (303ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 99ms (tercero); www.googletagmanager.com/gtag/js 98ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 53ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2406, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 18 corridas osciló entre 53 y 94 (mediana 75); este valor (83) ya se había visto.
- articulos: LCP 1060ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 19ms, elementRenderDelay 132ms)
  - Bloquean el render: inglesconleo.com/style.css (151ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 97ms (tercero); www.googletagmanager.com/gtag/js 87ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 70ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2430, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 18 corridas osciló entre 54 y 95 (mediana 82.5); este valor (89) ya se había visto.
- articulo-verbo-to-be: LCP 1059ms en `body > main > article.article-body > p` (timeToFirstByte 20ms, elementRenderDelay 125ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (302ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 337ms (tercero); www.google-analytics.com/g/collect 103ms (tercero); www.googletagmanager.com/gtag/js 85ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2364, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 18 corridas osciló entre 75 y 96 (mediana 83); este valor (84) ya se había visto.
- articulo-presente-simple: LCP 1060ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 115ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 362ms (tercero); www.google-analytics.com/g/collect 103ms (tercero); www.googletagmanager.com/gtag/js 91ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2421, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 18 corridas osciló entre 69 y 97 (mediana 84); este valor (84) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1058ms en `body > main > article.article-body > p` (timeToFirstByte 16ms, elementRenderDelay 111ms)
  - Bloquean el render: inglesconleo.com/style.css (302ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 352ms (tercero); www.google-analytics.com/g/collect 116ms (tercero); www.googletagmanager.com/gtag/js 101ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2386, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 18 corridas osciló entre 50 y 95 (mediana 82.5); este valor (83) ya se había visto.
- miembros: LCP 1143ms en `main > div#gate > div > h1` (timeToFirstByte 19ms, elementRenderDelay 184ms)
  - Bloquean el render: inglesconleo.com/style.css (151ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 242ms (tercero); iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 110ms (tercero); iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 105ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2451, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 18 corridas osciló entre 67 y 90 (mediana 69); este valor (77) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 74 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
