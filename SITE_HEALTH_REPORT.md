# SITE HEALTH — 2026-11-15

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 1
🟢 Páginas sin problemas: 78 de 80

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

🟡 https://inglesconleo.com/test-de-nivel-de-ingles.html 🆕 NUEVO
El HTML creció de 42KB a 55KB desde la última corrida.
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
| Home | 83/100 | 100/100 | 100/100 | 100/100 | 3194ms | 0.002 | 423ms |
| Práctica (gratis) | 88/100 | 100/100 | 94/100 | 100/100 | 1086ms | 0.002 | 467ms |
| Artículos (índice) | 91/100 | 100/100 | 96/100 | 100/100 | 2485ms | 0.003 | 295ms |
| Artículo: verbo to be | 89/100 | 100/100 | 100/100 | 100/100 | 1060ms | 0.004 | 439ms |
| Artículo: presente simple | 87/100 | 100/100 | 100/100 | 100/100 | 1060ms | 0.022 | 495ms |
| Artículo: cómo aprender desde cero | 89/100 | 100/100 | 100/100 | 100/100 | 1061ms | 0.002 | 433ms |
| Miembros (landing de pago) | 80/100 | 100/100 | 98/100 | 77/100 | 1102ms | 0.076 | 788ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3194ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 25ms, resourceLoadDelay 13ms, resourceLoadDuration 60ms, elementRenderDelay 80ms)
  - Bloquean el render: inglesconleo.com/style.css (304ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 83ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 82ms (tercero); connect.facebook.net/en_US/fbevents.js 70ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2460, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 36 corridas osciló entre 46 y 98 (mediana 85); este valor (83) ya se había visto.
- practica: LCP 1086ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 35ms, elementRenderDelay 127ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 82ms (tercero); connect.facebook.net/en_US/fbevents.js 69ms (tercero); inglesconleo.com/data.js 68ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2490, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 36 corridas osciló entre 53 y 98 (mediana 84.5); este valor (88) ya se había visto.
- articulos: LCP 2485ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 17ms, elementRenderDelay 121ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (151ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 86ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 74ms (tercero); fonts.googleapis.com/css2 36ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2495, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 36 corridas osciló entre 54 y 98 (mediana 88.5); este valor (91) ya se había visto.
- articulo-verbo-to-be: LCP 1060ms en `body > main > article.article-body > p` (timeToFirstByte 56ms, elementRenderDelay 135ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 715ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 107ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 87ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2499, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 36 corridas osciló entre 75 y 98 (mediana 87); este valor (89) ya se había visto.
- articulo-presente-simple: LCP 1060ms en `body > main > article.article-body > p` (timeToFirstByte 29ms, elementRenderDelay 120ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (302ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 325ms (tercero); www.googletagmanager.com/gtag/js 85ms (tercero); connect.facebook.net/en_US/fbevents.js 63ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2486, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 36 corridas osciló entre 69 y 98 (mediana 87.5); este valor (87) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1061ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 107ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 290ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 94ms (tercero); www.googletagmanager.com/gtag/js 84ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2492, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 36 corridas osciló entre 50 y 98 (mediana 86); este valor (89) ya se había visto.
- miembros: LCP 1102ms en `main > div#gate > div > h1` (timeToFirstByte 88ms, elementRenderDelay 116ms)
  - Bloquean el render: inglesconleo.com/style.css (151ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 241ms (tercero); connect.facebook.net/en_US/fbevents.js 201ms (tercero); inglesconleo.com/academia-cursos.js 116ms
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2495, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 36 corridas osciló entre 67 y 93 (mediana 77); este valor (80) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 80 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
