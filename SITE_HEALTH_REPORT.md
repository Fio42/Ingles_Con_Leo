# SITE HEALTH — 2026-10-22

🔴 Críticos: 0
🟠 Importantes: 4
🟡 Mejoras: 0
🟢 Páginas sin problemas: 69 de 72

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 🆕 NUEVO
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html
Lighthouse Performance = 71/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 67/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/articulo-como-aprender-ingles-desde-cero.html 🆕 NUEVO
Lighthouse Performance = 79/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/practica.html
Lighthouse Performance = 71/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 67/100.
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
| Home | 81/100 | 100/100 | 100/100 | 100/100 | 3033ms | 0.001 | 490ms |
| Práctica (gratis) | 71/100 | 100/100 | 93/100 | 100/100 | 3158ms | 0.176 | 587ms |
| Artículos (índice) | 84/100 | 100/100 | 96/100 | 100/100 | 2945ms | 0.002 | 411ms |
| Artículo: verbo to be | 80/100 | 100/100 | 100/100 | 100/100 | 2646ms | 0.001 | 660ms |
| Artículo: presente simple | 83/100 | 100/100 | 100/100 | 100/100 | 2644ms | 0.009 | 554ms |
| Artículo: cómo aprender desde cero | 79/100 | 100/100 | 100/100 | 100/100 | 2642ms | 0.000 | 716ms |
| Miembros (landing de pago) | 67/100 | 100/100 | 98/100 | 77/100 | 3463ms | 0.080 | 1034ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3033ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 18ms, elementRenderDelay 132ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/error-monitor.js (152ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 194ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 147ms (tercero); fonts.googleapis.com/css2 114ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2388, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 12 corridas osciló entre 50 y 82 (mediana 76.5); este valor (81) ya se había visto.
- practica: LCP 3158ms en `section > div.wrap > p#practicaModoAprender > span` (timeToFirstByte 17ms, elementRenderDelay 117ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (304ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 191ms (tercero); fonts.googleapis.com/css2 124ms (tercero); www.google-analytics.com/g/collect 109ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2350, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 12 corridas osciló entre 53 y 87 (mediana 75); este valor (71) ya se había visto.
- articulos: LCP 2945ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 16ms, elementRenderDelay 115ms)
  - Bloquean el render: inglesconleo.com/style.css (455ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 185ms (tercero); fonts.googleapis.com/css2 96ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 94ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2406, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 12 corridas osciló entre 54 y 86 (mediana 81.5); este valor (84) ya se había visto.
- articulo-verbo-to-be: LCP 2646ms en `body > main > article.article-body > p` (timeToFirstByte 17ms, elementRenderDelay 102ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 297ms (tercero); www.googletagmanager.com/gtag/js 175ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 113ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2337, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 12 corridas osciló entre 75 y 90 (mediana 83); este valor (80) ya se había visto.
- articulo-presente-simple: LCP 2644ms en `body > main > article.article-body > p` (timeToFirstByte 13ms, elementRenderDelay 101ms)
  - Bloquean el render: inglesconleo.com/style.css (304ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 256ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 232ms (tercero); fonts.googleapis.com/css2 98ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2413, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 12 corridas osciló entre 69 y 89 (mediana 84); este valor (83) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2642ms en `body > main > article.article-body > p` (timeToFirstByte 19ms, elementRenderDelay 105ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 259ms (tercero); www.googletagmanager.com/gtag/js 204ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 122ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2264, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 12 corridas osciló entre 50 y 88 (mediana 79.5); este valor (79) ya se había visto.
- miembros: LCP 3463ms en `main > div#gate > div > h1` (timeToFirstByte 68ms, elementRenderDelay 140ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (152ms); inglesconleo.com/style.css (456ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 276ms (tercero); m.stripe.com/6 193ms (tercero); accounts.google.com/gsi/button 123ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2341, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 12 corridas osciló entre 67 y 82 (mediana 68); este valor (67) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 72 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
