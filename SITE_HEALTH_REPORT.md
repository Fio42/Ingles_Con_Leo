# SITE HEALTH — 2026-11-23

🔴 Críticos: 0
🟠 Importantes: 3
🟡 Mejoras: 0
🟢 Páginas sin problemas: 80 de 82

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 78/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 78/100.
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
| Home | 79/100 | 100/100 | 100/100 | 100/100 | 3287ms | 0.003 | 521ms |
| Práctica (gratis) | 83/100 | 100/100 | 94/100 | 100/100 | 2384ms | 0.002 | 472ms |
| Artículos (índice) | 91/100 | 100/100 | 96/100 | 100/100 | 1066ms | 0.003 | 368ms |
| Artículo: verbo to be | 82/100 | 100/100 | 100/100 | 95/100 | 1062ms | 0.004 | 737ms |
| Artículo: presente simple | 89/100 | 100/100 | 100/100 | 100/100 | 1063ms | 0.022 | 446ms |
| Artículo: cómo aprender desde cero | 90/100 | 100/100 | 100/100 | 100/100 | 1062ms | 0.002 | 402ms |
| Miembros (landing de pago) | 78/100 | 100/100 | 98/100 | 77/100 | 1062ms | 0.079 | 898ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3287ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 19ms, resourceLoadDelay 16ms, resourceLoadDuration 17ms, elementRenderDelay 150ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (305ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 135ms (tercero); www.facebook.com/tr/ 100ms (tercero); www.googletagmanager.com/gtag/js 80ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2411, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 88); este valor (79) ya se había visto.
- practica: LCP 2384ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 20ms, elementRenderDelay 118ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (304ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.facebook.com/tr/ 100ms (tercero); www.googletagmanager.com/gtag/js 93ms (tercero); fonts.googleapis.com/css2 44ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2491, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 86.5); este valor (83) ya se había visto.
- articulos: LCP 1066ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 19ms, elementRenderDelay 146ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (152ms)
  - Peticiones más lentas: img.youtube.com/vi/qYfRn_KUcyE/hqdefault.jpg 151ms (tercero); connect.facebook.net/en_US/fbevents.js 129ms (tercero); www.googletagmanager.com/gtag/js 86ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2496, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 90.5); este valor (91) ya se había visto.
- articulo-verbo-to-be: LCP 1062ms en `body > main > article.article-body > p` (timeToFirstByte 17ms, elementRenderDelay 130ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 276ms (tercero); connect.facebook.net/en_US/fbevents.js 217ms (tercero); connect.facebook.net/signals/config/2182739922655837 98ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (1); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2495, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 78 y 98 (mediana 88.5); este valor (82) ya se había visto.
- articulo-presente-simple: LCP 1063ms en `body > main > article.article-body > p` (timeToFirstByte 50ms, elementRenderDelay 124ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 288ms (tercero); connect.facebook.net/en_US/fbevents.js 200ms (tercero); connect.facebook.net/signals/config/2182739922655837 104ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2495, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 82 y 98 (mediana 88); este valor (89) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1062ms en `body > main > article.article-body > p` (timeToFirstByte 18ms, elementRenderDelay 113ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 488ms (tercero); www.facebook.com/tr/ 99ms (tercero); www.googletagmanager.com/gtag/js 89ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2504, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 75 y 98 (mediana 87.5); este valor (90) ya se había visto.
- miembros: LCP 1062ms en `main > div#gate > div > h1` (timeToFirstByte 19ms, elementRenderDelay 182ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (152ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 246ms (tercero); iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 131ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 99ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2486, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 78); este valor (78) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 82 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
