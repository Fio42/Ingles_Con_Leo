# SITE HEALTH — 2026-11-18

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 79 de 80

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

ℹ️ https://inglesconleo.com
Best Practices se calculó sin la cookie de terceros del Meta Pixel (6 página(s)).
Impacto: Lighthouse penaliza la cookie "fr" de facebook.com aunque no se puede quitar sin desactivar el pixel de anuncios; se ignora para no marcar críticos falsos.
Acción: Nada que hacer, salvo que algún día se quite el pixel.

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 89/100 | 100/100 | 100/100 | 100/100 | 3151ms | 0.002 | 236ms |
| Práctica (gratis) | 95/100 | 100/100 | 94/100 | 100/100 | 1095ms | 0.002 | 246ms |
| Artículos (índice) | 93/100 | 100/100 | 96/100 | 100/100 | 1994ms | 0.003 | 237ms |
| Artículo: verbo to be | 96/100 | 100/100 | 100/100 | 100/100 | 1094ms | 0.004 | 227ms |
| Artículo: presente simple | 92/100 | 100/100 | 100/100 | 100/100 | 1060ms | 0.022 | 342ms |
| Artículo: cómo aprender desde cero | 93/100 | 100/100 | 100/100 | 100/100 | 2101ms | 0.002 | 241ms |
| Miembros (landing de pago) | 86/100 | 100/100 | 98/100 | 77/100 | 1145ms | 0.033 | 550ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3151ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 38ms, resourceLoadDelay 10ms, resourceLoadDuration 24ms, elementRenderDelay 80ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (317ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 186ms (tercero); connect.facebook.net/en_US/fbevents.js 109ms (tercero); www.googletagmanager.com/gtag/js 69ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2990, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 39 corridas osciló entre 46 y 98 (mediana 83); este valor (89) ya se había visto.
- practica: LCP 1095ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 122ms, elementRenderDelay 199ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: inglesconleo.com/data.js 279ms; xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 192ms (tercero); inglesconleo.com/practica.html 121ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2974, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 39 corridas osciló entre 53 y 98 (mediana 85); este valor (95) ya se había visto.
- articulos: LCP 1994ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 35ms, elementRenderDelay 117ms)
  - Bloquean el render: inglesconleo.com/style.css (158ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 182ms (tercero); connect.facebook.net/en_US/fbevents.js 134ms (tercero); img.youtube.com/vi/JPq1KBBsbtI/hqdefault.jpg 101ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2970, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 39 corridas osciló entre 54 y 98 (mediana 89); este valor (93) ya se había visto.
- articulo-verbo-to-be: LCP 1094ms en `body > main > article.article-body > p` (timeToFirstByte 132ms, elementRenderDelay 181ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (317ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 245ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 207ms (tercero); inglesconleo.com/article-quiz.js 164ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3059, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 39 corridas osciló entre 75 y 98 (mediana 87); este valor (96) ya se había visto.
- articulo-presente-simple: LCP 1060ms en `body > main > article.article-body > p` (timeToFirstByte 104ms, elementRenderDelay 73ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (303ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 217ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 183ms (tercero); connect.facebook.net/en_US/fbevents.js 122ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2995, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 39 corridas osciló entre 69 y 98 (mediana 87); este valor (92) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2101ms en `body > main > article.article-body > p` (timeToFirstByte 36ms, elementRenderDelay 90ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 209ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 160ms (tercero); connect.facebook.net/en_US/fbevents.js 111ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2947, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 39 corridas osciló entre 50 y 98 (mediana 86); este valor (93) ya se había visto.
- miembros: LCP 1145ms en `main > div#gate > div > h1` (timeToFirstByte 125ms, elementRenderDelay 300ms)
  - Bloquean el render: inglesconleo.com/style.css (151ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: inglesconleo.com/app.js 274ms; inglesconleo.com/data.js 265ms; xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 209ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3093, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 39 corridas osciló entre 67 y 93 (mediana 77); este valor (86) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 80 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
