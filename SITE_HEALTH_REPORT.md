# SITE HEALTH — 2026-11-17

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 79 de 80

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 76/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 76/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

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
| Home | 82/100 | 100/100 | 100/100 | 100/100 | 3258ms | 0.002 | 439ms |
| Práctica (gratis) | 88/100 | 100/100 | 94/100 | 100/100 | 1062ms | 0.002 | 489ms |
| Artículos (índice) | 89/100 | 100/100 | 96/100 | 100/100 | 2038ms | 0.003 | 350ms |
| Artículo: verbo to be | 88/100 | 100/100 | 100/100 | 100/100 | 1061ms | 0.004 | 482ms |
| Artículo: presente simple | 86/100 | 100/100 | 100/100 | 100/100 | 2029ms | 0.022 | 460ms |
| Artículo: cómo aprender desde cero | 87/100 | 100/100 | 100/100 | 100/100 | 1062ms | 0.002 | 501ms |
| Miembros (landing de pago) | 76/100 | 100/100 | 98/100 | 77/100 | 2395ms | 0.076 | 720ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3258ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 18ms, resourceLoadDelay 12ms, resourceLoadDuration 31ms, elementRenderDelay 106ms)
  - Bloquean el render: inglesconleo.com/style.css (303ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 96ms (tercero); connect.facebook.net/en_US/fbevents.js 67ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 66ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2470, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 38 corridas osciló entre 46 y 98 (mediana 83); este valor (82) ya se había visto.
- practica: LCP 1062ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 17ms, elementRenderDelay 133ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 259ms (tercero); connect.facebook.net/en_US/fbevents.js 205ms (tercero); www.googletagmanager.com/gtag/js 87ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2442, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 38 corridas osciló entre 53 y 98 (mediana 85); este valor (88) ya se había visto.
- articulos: LCP 2038ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 21ms, elementRenderDelay 140ms)
  - Bloquean el render: inglesconleo.com/style.css (151ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 199ms (tercero); connect.facebook.net/signals/config/2182739922655837 102ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 87ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2442, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 38 corridas osciló entre 54 y 98 (mediana 89); este valor (89) ya se había visto.
- articulo-verbo-to-be: LCP 1061ms en `body > main > article.article-body > p` (timeToFirstByte 17ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/style.css (303ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 342ms (tercero); connect.facebook.net/en_US/fbevents.js 123ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 87ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2454, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 38 corridas osciló entre 75 y 98 (mediana 87); este valor (88) ya se había visto.
- articulo-presente-simple: LCP 2029ms en `body > main > article.article-body > p` (timeToFirstByte 12ms, elementRenderDelay 115ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (301ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 303ms (tercero); connect.facebook.net/en_US/fbevents.js 199ms (tercero); connect.facebook.net/signals/config/2182739922655837 105ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2467, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 38 corridas osciló entre 69 y 98 (mediana 87.5); este valor (86) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1062ms en `body > main > article.article-body > p` (timeToFirstByte 18ms, elementRenderDelay 105ms)
  - Bloquean el render: inglesconleo.com/style.css (303ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 288ms (tercero); connect.facebook.net/en_US/fbevents.js 128ms (tercero); www.googletagmanager.com/gtag/js 77ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2480, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 38 corridas osciló entre 50 y 98 (mediana 86); este valor (87) ya se había visto.
- miembros: LCP 2395ms en `main > div#gate > div > h1` (timeToFirstByte 153ms, elementRenderDelay 151ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (151ms)
  - Peticiones más lentas: m.stripe.com/6 244ms (tercero); accounts.google.com/gsi/button 173ms (tercero); inglesconleo.com/miembros.html 152ms
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2429, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 38 corridas osciló entre 67 y 93 (mediana 77); este valor (76) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 80 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
