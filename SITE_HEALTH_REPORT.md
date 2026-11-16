# SITE HEALTH — 2026-11-16

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 79 de 80

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
| Home | 83/100 | 100/100 | 100/100 | 100/100 | 3158ms | 0.002 | 418ms |
| Práctica (gratis) | 88/100 | 100/100 | 94/100 | 100/100 | 1164ms | 0.002 | 478ms |
| Artículos (índice) | 92/100 | 100/100 | 96/100 | 100/100 | 1078ms | 0.003 | 343ms |
| Artículo: verbo to be | 88/100 | 100/100 | 100/100 | 100/100 | 1076ms | 0.004 | 488ms |
| Artículo: presente simple | 89/100 | 100/100 | 100/100 | 100/100 | 1077ms | 0.022 | 457ms |
| Artículo: cómo aprender desde cero | 84/100 | 100/100 | 100/100 | 100/100 | 2086ms | 0.002 | 494ms |
| Miembros (landing de pago) | 77/100 | 100/100 | 98/100 | 77/100 | 1077ms | 0.076 | 953ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3158ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 25ms, resourceLoadDelay 22ms, resourceLoadDuration 20ms, elementRenderDelay 98ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (306ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 255ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 206ms (tercero); connect.facebook.net/signals/config/2182739922655837 129ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2451, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 37 corridas osciló entre 46 y 98 (mediana 83); este valor (83) ya se había visto.
- practica: LCP 1164ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 113ms, elementRenderDelay 216ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (310ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 260ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 201ms (tercero); inglesconleo.com/data.js 138ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2474, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 37 corridas osciló entre 53 y 98 (mediana 85); este valor (88) ya se había visto.
- articulos: LCP 1078ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 119ms, elementRenderDelay 124ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (155ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 257ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 200ms (tercero); img.youtube.com/vi/qYfRn_KUcyE/hqdefault.jpg 181ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2476, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 37 corridas osciló entre 54 y 98 (mediana 89); este valor (92) ya se había visto.
- articulo-verbo-to-be: LCP 1076ms en `body > main > article.article-body > p` (timeToFirstByte 26ms, elementRenderDelay 111ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (309ms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 253ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 198ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 149ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2465, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 37 corridas osciló entre 75 y 98 (mediana 87); este valor (88) ya se había visto.
- articulo-presente-simple: LCP 1077ms en `body > main > article.article-body > p` (timeToFirstByte 25ms, elementRenderDelay 89ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 259ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 202ms (tercero); connect.facebook.net/signals/config/2182739922655837 131ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2364, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 37 corridas osciló entre 69 y 98 (mediana 87); este valor (89) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2086ms en `body > main > article.article-body > p` (timeToFirstByte 28ms, elementRenderDelay 117ms)
  - Bloquean el render: inglesconleo.com/style.css (310ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 253ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 199ms (tercero); www.facebook.com/tr/ 139ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2494, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 37 corridas osciló entre 50 y 98 (mediana 86); este valor (84) ya se había visto.
- miembros: LCP 1077ms en `main > div#gate > div > h1` (timeToFirstByte 124ms, elementRenderDelay 130ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (155ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 518ms (tercero); connect.facebook.net/en_US/fbevents.js 254ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 196ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2450, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 37 corridas osciló entre 67 y 93 (mediana 77); este valor (77) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 80 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
