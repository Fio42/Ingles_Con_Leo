# SITE HEALTH — 2026-10-30

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 73 de 74

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
| Home | 97/100 | 100/100 | 100/100 | 100/100 | 1189ms | 0.002 | 186ms |
| Práctica (gratis) | 95/100 | 100/100 | 93/100 | 100/100 | 1157ms | 0.002 | 249ms |
| Artículos (índice) | 98/100 | 100/100 | 96/100 | 100/100 | 1097ms | 0.004 | 139ms |
| Artículo: verbo to be | 96/100 | 100/100 | 100/100 | 100/100 | 1114ms | 0.004 | 232ms |
| Artículo: presente simple | 93/100 | 100/100 | 100/100 | 100/100 | 1129ms | 0.022 | 316ms |
| Artículo: cómo aprender desde cero | 94/100 | 100/100 | 100/100 | 100/100 | 1151ms | 0.002 | 276ms |
| Miembros (landing de pago) | 90/100 | 100/100 | 98/100 | 77/100 | 1099ms | 0.079 | 348ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1189ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 108ms, elementRenderDelay 155ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (325ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 1282ms (tercero); www.googletagmanager.com/gtag/js 204ms (tercero); inglesconleo.com/mini-lecciones.js 152ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3378, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 20 corridas osciló entre 50 y 97 (mediana 77.5); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1157ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 46ms, elementRenderDelay 161ms)
  - Bloquean el render: inglesconleo.com/style.css (325ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 205ms (tercero); connect.facebook.net/en_US/fbevents.js 141ms (tercero); inglesconleo.com/style.css 108ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3335, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 20 corridas osciló entre 53 y 94 (mediana 78); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1097ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 167ms, elementRenderDelay 118ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (159ms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 313ms (tercero); www.googletagmanager.com/gtag/js 209ms (tercero); inglesconleo.com/articulos.html 168ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3300, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 20 corridas osciló entre 54 y 95 (mediana 83.5); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1114ms en `body > main > article.article-body > p` (timeToFirstByte 91ms, elementRenderDelay 80ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 593ms (tercero); www.googletagmanager.com/gtag/js 214ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 161ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3536, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 20 corridas osciló entre 75 y 96 (mediana 83); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1129ms en `body > main > article.article-body > p` (timeToFirstByte 34ms, elementRenderDelay 65ms)
  - Bloquean el render: inglesconleo.com/style.css (321ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 217ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 209ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 125ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3637, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 20 corridas osciló entre 69 y 97 (mediana 84); este valor (93) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1151ms en `body > main > article.article-body > p` (timeToFirstByte 50ms, elementRenderDelay 78ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 232ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 198ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 137ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3565, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 20 corridas osciló entre 50 y 95 (mediana 83); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 1099ms en `main > div#gate > div > h1` (timeToFirstByte 39ms, elementRenderDelay 93ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 229ms (tercero); m.stripe.com/6 174ms (tercero); accounts.google.com/gsi/button 164ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3431, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 20 corridas osciló entre 67 y 90 (mediana 69.5); este valor (90) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 74 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
