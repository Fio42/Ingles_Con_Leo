# SITE HEALTH — 2026-11-20

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 80 de 81

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
| Home | 85/100 | 100/100 | 100/100 | 100/100 | 3101ms | 0.002 | 376ms |
| Práctica (gratis) | 94/100 | 100/100 | 94/100 | 100/100 | 1086ms | 0.002 | 280ms |
| Artículos (índice) | 97/100 | 100/100 | 96/100 | 100/100 | 1083ms | 0.002 | 198ms |
| Artículo: verbo to be | 95/100 | 100/100 | 100/100 | 100/100 | 1072ms | 0.004 | 247ms |
| Artículo: presente simple | 95/100 | 100/100 | 100/100 | 100/100 | 1083ms | 0.022 | 246ms |
| Artículo: cómo aprender desde cero | 91/100 | 100/100 | 100/100 | 100/100 | 2065ms | 0.002 | 289ms |
| Miembros (landing de pago) | 82/100 | 100/100 | 98/100 | 77/100 | 2433ms | 0.046 | 473ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3101ms en `div.wrap > div.hero-v2-media > div.hero-v2-character-wrap > img.hero-v` (timeToFirstByte 28ms, resourceLoadDelay 36ms, resourceLoadDuration 17ms, elementRenderDelay 80ms)
  - Bloquean el render: inglesconleo.com/style.css (311ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 281ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 207ms (tercero); connect.facebook.net/signals/config/2182739922655837 141ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3024, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 46 y 98 (mediana 85.5); este valor (85) ya se había visto.
- practica: LCP 1086ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 38ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/style.css (314ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 277ms (tercero); connect.facebook.net/en_US/fbevents.js 260ms (tercero); www.facebook.com/tr/ 132ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3058, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 53 y 98 (mediana 86); este valor (94) ya se había visto.
- articulos: LCP 1083ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 31ms, elementRenderDelay 138ms)
  - Bloquean el render: inglesconleo.com/style.css (156ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 252ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 188ms (tercero); www.facebook.com/tr/ 135ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2981, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 54 y 98 (mediana 89.5); este valor (97) ya se había visto.
- articulo-verbo-to-be: LCP 1072ms en `body > main > article.article-body > p` (timeToFirstByte 24ms, elementRenderDelay 112ms)
  - Bloquean el render: inglesconleo.com/style.css (307ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 250ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 203ms (tercero); www.facebook.com/tr/ 138ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2993, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 75 y 98 (mediana 88); este valor (95) ya se había visto.
- articulo-presente-simple: LCP 1083ms en `body > main > article.article-body > p` (timeToFirstByte 27ms, elementRenderDelay 84ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (312ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 259ms (tercero); connect.facebook.net/signals/config/2182739922655837 236ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 232ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2848, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 69 y 98 (mediana 88); este valor (95) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2065ms en `body > main > article.article-body > p` (timeToFirstByte 27ms, elementRenderDelay 82ms)
  - Bloquean el render: inglesconleo.com/style.css (311ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 253ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 187ms (tercero); connect.facebook.net/signals/config/2182739922655837 128ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2981, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 50 y 98 (mediana 87); este valor (91) ya se había visto.
- miembros: LCP 2433ms en `main > div#gate > div > h1` (timeToFirstByte 117ms, elementRenderDelay 121ms)
  - Bloquean el render: inglesconleo.com/style.css (156ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 250ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 194ms (tercero); iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 135ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3098, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 40 corridas osciló entre 67 y 93 (mediana 77); este valor (82) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 81 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
