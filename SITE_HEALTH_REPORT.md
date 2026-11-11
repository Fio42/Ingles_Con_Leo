# SITE HEALTH — 2026-11-11

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 76 de 77

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 73/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html 🆕 NUEVO
Lighthouse Performance = 73/100.
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
| Home | 88/100 | 100/100 | 100/100 | 100/100 | 1103ms | 0.004 | 470ms |
| Práctica (gratis) | 85/100 | 100/100 | 94/100 | 100/100 | 1062ms | 0.002 | 590ms |
| Artículos (índice) | 89/100 | 100/100 | 96/100 | 100/100 | 1064ms | 0.003 | 461ms |
| Artículo: verbo to be | 87/100 | 100/100 | 100/100 | 100/100 | 1059ms | 0.004 | 507ms |
| Artículo: presente simple | 88/100 | 100/100 | 100/100 | 100/100 | 1063ms | 0.022 | 463ms |
| Artículo: cómo aprender desde cero | 85/100 | 100/100 | 100/100 | 100/100 | 2035ms | 0.002 | 473ms |
| Miembros (landing de pago) | 73/100 | 100/100 | 98/100 | 77/100 | 2394ms | 0.076 | 914ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1103ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 16ms, elementRenderDelay 185ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 86ms (tercero); www.googletagmanager.com/gtag/js 84ms (tercero); inglesconleo.com/audio/leo/bienvenida.mp3 50ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2420, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 32 corridas osciló entre 46 y 98 (mediana 81.5); este valor (88) ya se había visto.
- practica: LCP 1062ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 18ms, elementRenderDelay 140ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 190ms (tercero); www.googletagmanager.com/gtag/js 99ms (tercero); connect.facebook.net/en_US/fbevents.js 53ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2432, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 32 corridas osciló entre 53 y 97 (mediana 83); este valor (85) ya se había visto.
- articulos: LCP 1064ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 20ms, elementRenderDelay 149ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/xaA3y6ipUNE/hqdefault.jpg 149ms (tercero); img.youtube.com/vi/gf9T2K-zWcQ/hqdefault.jpg 136ms (tercero); img.youtube.com/vi/Wv4rEL4wYnE/hqdefault.jpg 125ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2446, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 32 corridas osciló entre 54 y 98 (mediana 86); este valor (89) ya se había visto.
- articulo-verbo-to-be: LCP 1059ms en `body > main > article.article-body > p` (timeToFirstByte 56ms, elementRenderDelay 139ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (303ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 682ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 136ms (tercero); www.googletagmanager.com/gtag/js 88ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2434, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 32 corridas osciló entre 75 y 98 (mediana 85.5); este valor (87) ya se había visto.
- articulo-presente-simple: LCP 1063ms en `body > main > article.article-body > p` (timeToFirstByte 53ms, elementRenderDelay 120ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (307ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 326ms (tercero); www.facebook.com/tr/ 101ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 88ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2442, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 32 corridas osciló entre 69 y 98 (mediana 87); este valor (88) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2035ms en `body > main > article.article-body > p` (timeToFirstByte 19ms, elementRenderDelay 144ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 259ms (tercero); www.google-analytics.com/g/collect 92ms (tercero); www.googletagmanager.com/gtag/js 89ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2452, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 32 corridas osciló entre 50 y 97 (mediana 86); este valor (85) ya se había visto.
- miembros: LCP 2394ms en `main > div#gate > div > h1` (timeToFirstByte 48ms, elementRenderDelay 207ms)
  - Bloquean el render: inglesconleo.com/style.css (151ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: m.stripe.com/6 309ms (tercero); iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 146ms (tercero); accounts.google.com/gsi/button 134ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2462, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 32 corridas osciló entre 67 y 91 (mediana 77); este valor (73) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 77 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
