# SITE HEALTH — 2026-11-06

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 75 de 76

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 77/100.
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

ℹ️ https://inglesconleo.com 🆕 NUEVO
Best Practices se calculó sin la cookie de terceros del Meta Pixel (6 página(s)).
Impacto: Lighthouse penaliza la cookie "fr" de facebook.com aunque no se puede quitar sin desactivar el pixel de anuncios; se ignora para no marcar críticos falsos.
Acción: Nada que hacer, salvo que algún día se quite el pixel.

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 89/100 | 100/100 | 100/100 | 100/100 | 1097ms | 0.002 | 425ms |
| Práctica (gratis) | 88/100 | 100/100 | 93/100 | 100/100 | 1061ms | 0.002 | 464ms |
| Artículos (índice) | 88/100 | 100/100 | 96/100 | 100/100 | 1911ms | 0.004 | 412ms |
| Artículo: verbo to be | 87/100 | 100/100 | 100/100 | 100/100 | 1064ms | 0.004 | 524ms |
| Artículo: presente simple | 88/100 | 100/100 | 100/100 | 100/100 | 1066ms | 0.022 | 493ms |
| Artículo: cómo aprender desde cero | 89/100 | 100/100 | 100/100 | 100/100 | 1065ms | 0.002 | 441ms |
| Miembros (landing de pago) | 77/100 | 100/100 | 98/100 | 77/100 | 1101ms | 0.079 | 954ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1097ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 26ms, elementRenderDelay 152ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 91ms (tercero); www.google-analytics.com/g/collect 82ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 63ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2470, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 27 corridas osciló entre 46 y 97 (mediana 79); este valor (89) ya se había visto.
- practica: LCP 1061ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 18ms, elementRenderDelay 144ms)
  - Bloquean el render: inglesconleo.com/style.css (303ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 112ms (tercero); connect.facebook.net/signals/config/2182739922655837 104ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 50ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2469, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 27 corridas osciló entre 53 y 96 (mediana 83); este valor (88) ya se había visto.
- articulos: LCP 1911ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 19ms, elementRenderDelay 174ms)
  - Bloquean el render: inglesconleo.com/style.css (152ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/gf9T2K-zWcQ/hqdefault.jpg 87ms (tercero); www.google-analytics.com/g/collect 81ms (tercero); www.googletagmanager.com/gtag/js 79ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2443, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 27 corridas osciló entre 54 y 98 (mediana 85); este valor (88) ya se había visto.
- articulo-verbo-to-be: LCP 1064ms en `body > main > article.article-body > p` (timeToFirstByte 16ms, elementRenderDelay 119ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (303ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 406ms (tercero); www.googletagmanager.com/gtag/js 87ms (tercero); www.google-analytics.com/g/collect 82ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2468, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 27 corridas osciló entre 75 y 96 (mediana 84); este valor (87) ya se había visto.
- articulo-presente-simple: LCP 1066ms en `body > main > article.article-body > p` (timeToFirstByte 69ms, elementRenderDelay 139ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 333ms (tercero); www.googletagmanager.com/gtag/js 93ms (tercero); www.google-analytics.com/g/collect 77ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2452, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 27 corridas osciló entre 69 y 97 (mediana 85); este valor (88) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1065ms en `body > main > article.article-body > p` (timeToFirstByte 15ms, elementRenderDelay 140ms)
  - Bloquean el render: inglesconleo.com/style.css (312ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 430ms (tercero); www.googletagmanager.com/gtag/js 96ms (tercero); www.google-analytics.com/g/collect 85ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2456, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 27 corridas osciló entre 50 y 95 (mediana 85); este valor (89) ya se había visto.
- miembros: LCP 1101ms en `main > div#gate > div > h1` (timeToFirstByte 17ms, elementRenderDelay 178ms)
  - Bloquean el render: inglesconleo.com/style.css (152ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 430ms (tercero); m.stripe.com/6 249ms (tercero); iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 239ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2474, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 27 corridas osciló entre 67 y 91 (mediana 77); este valor (77) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
