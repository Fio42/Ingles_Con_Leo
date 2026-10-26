# SITE HEALTH — 2026-10-26

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 72 de 73

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 75/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 75/100.
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
| Home | 81/100 | 100/100 | 100/100 | 100/100 | 3027ms | 0.000 | 508ms |
| Práctica (gratis) | 83/100 | 100/100 | 93/100 | 100/100 | 1878ms | 0.000 | 617ms |
| Artículos (índice) | 83/100 | 100/100 | 96/100 | 100/100 | 2963ms | 0.002 | 423ms |
| Artículo: verbo to be | 84/100 | 100/100 | 100/100 | 100/100 | 1879ms | 0.001 | 597ms |
| Artículo: presente simple | 84/100 | 100/100 | 100/100 | 100/100 | 1891ms | 0.009 | 584ms |
| Artículo: cómo aprender desde cero | 85/100 | 100/100 | 100/100 | 100/100 | 1880ms | 0.000 | 565ms |
| Miembros (landing de pago) | 75/100 | 100/100 | 98/100 | 77/100 | 2042ms | 0.079 | 954ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3027ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 17ms, elementRenderDelay 137ms)
  - Bloquean el render: inglesconleo.com/style.css (454ms); inglesconleo.com/error-monitor.js (151ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 95ms (tercero); www.googletagmanager.com/gtag/js 92ms (tercero); inglesconleo.com/audio/leo/bienvenida.mp3 49ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2466, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 16 corridas osciló entre 50 y 97 (mediana 76.5); este valor (81) ya se había visto.
- practica: LCP 1878ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 17ms, elementRenderDelay 123ms)
  - Bloquean el render: inglesconleo.com/style.css (454ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 115ms (tercero); www.google-analytics.com/g/collect 91ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 51ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2420, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 16 corridas osciló entre 53 y 87 (mediana 74.5); este valor (83) ya se había visto.
- articulos: LCP 2963ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 23ms, elementRenderDelay 115ms)
  - Bloquean el render: inglesconleo.com/style.css (456ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 126ms (tercero); img.youtube.com/vi/qYfRn_KUcyE/hqdefault.jpg 110ms (tercero); img.youtube.com/vi/IyPbbyuz1ho/hqdefault.jpg 91ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2443, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 16 corridas osciló entre 54 y 95 (mediana 83); este valor (83) ya se había visto.
- articulo-verbo-to-be: LCP 1879ms en `body > main > article.article-body > p` (timeToFirstByte 17ms, elementRenderDelay 115ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (456ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 329ms (tercero); www.google-analytics.com/g/collect 96ms (tercero); www.googletagmanager.com/gtag/js 95ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2424, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 16 corridas osciló entre 75 y 95 (mediana 83); este valor (84) ya se había visto.
- articulo-presente-simple: LCP 1891ms en `body > main > article.article-body > p` (timeToFirstByte 36ms, elementRenderDelay 105ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (151ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (454ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 309ms (tercero); www.google-analytics.com/g/collect 94ms (tercero); www.googletagmanager.com/gtag/js 87ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2481, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 16 corridas osciló entre 69 y 94 (mediana 84); este valor (84) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1880ms en `body > main > article.article-body > p` (timeToFirstByte 19ms, elementRenderDelay 107ms)
  - Bloquean el render: inglesconleo.com/style.css (457ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 312ms (tercero); www.google-analytics.com/g/collect 97ms (tercero); www.googletagmanager.com/gtag/js 82ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2480, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 16 corridas osciló entre 50 y 93 (mediana 81.5); este valor (85) ya se había visto.
- miembros: LCP 2042ms en `main > div#gate > div > h1` (timeToFirstByte 58ms, elementRenderDelay 145ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 243ms (tercero); js.stripe.com/v3/ 131ms (tercero); accounts.google.com/gsi/button 127ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2333, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 16 corridas osciló entre 67 y 87 (mediana 68.5); este valor (75) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 73 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
