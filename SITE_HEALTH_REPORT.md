# SITE HEALTH — 2026-10-29

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
| Home | 94/100 | 100/100 | 100/100 | 100/100 | 1066ms | 0.002 | 285ms |
| Práctica (gratis) | 91/100 | 100/100 | 93/100 | 100/100 | 1091ms | 0.002 | 382ms |
| Artículos (índice) | 95/100 | 100/100 | 96/100 | 100/100 | 1064ms | 0.004 | 274ms |
| Artículo: verbo to be | 91/100 | 100/100 | 100/100 | 100/100 | 1070ms | 0.004 | 381ms |
| Artículo: presente simple | 94/100 | 100/100 | 100/100 | 100/100 | 1062ms | 0.022 | 285ms |
| Artículo: cómo aprender desde cero | 89/100 | 100/100 | 100/100 | 100/100 | 1062ms | 0.002 | 444ms |
| Miembros (landing de pago) | 85/100 | 100/100 | 98/100 | 77/100 | 1063ms | 0.079 | 520ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1066ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 26ms, elementRenderDelay 108ms)
  - Bloquean el render: inglesconleo.com/style.css (304ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 163ms (tercero); www.googletagmanager.com/gtag/js 110ms (tercero); inglesconleo.com/audio/leo/bienvenida.mp3 49ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3102, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 19 corridas osciló entre 50 y 97 (mediana 77); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1091ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 45ms, elementRenderDelay 119ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (305ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 83ms (tercero); inglesconleo.com/data.js 72ms; www.google-analytics.com/g/collect 71ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3069, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 19 corridas osciló entre 53 y 94 (mediana 75); este valor (91) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1064ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 18ms, elementRenderDelay 94ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (152ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 85ms (tercero); www.google-analytics.com/g/collect 72ms (tercero); connect.facebook.net/en_US/fbevents.js 52ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2889, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 19 corridas osciló entre 54 y 95 (mediana 83); este valor (95) ya se había visto.
- articulo-verbo-to-be: LCP 1070ms en `body > main > article.article-body > p` (timeToFirstByte 33ms, elementRenderDelay 93ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 342ms (tercero); www.googletagmanager.com/gtag/js 84ms (tercero); www.google-analytics.com/g/collect 79ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3043, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 19 corridas osciló entre 75 y 96 (mediana 83); este valor (91) ya se había visto.
- articulo-presente-simple: LCP 1062ms en `body > main > article.article-body > p` (timeToFirstByte 17ms, elementRenderDelay 82ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (304ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 373ms (tercero); www.googletagmanager.com/gtag/js 84ms (tercero); www.google-analytics.com/g/collect 74ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3007, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 19 corridas osciló entre 69 y 97 (mediana 84); este valor (94) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1062ms en `body > main > article.article-body > p` (timeToFirstByte 16ms, elementRenderDelay 72ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 330ms (tercero); www.googletagmanager.com/gtag/js 88ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 88ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3067, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 19 corridas osciló entre 50 y 95 (mediana 83); este valor (89) ya se había visto.
- miembros: LCP 1063ms en `main > div#gate > div > h1` (timeToFirstByte 20ms, elementRenderDelay 112ms)
  - Bloquean el render: inglesconleo.com/style.css (152ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 560ms (tercero); m.stripe.com/6 240ms (tercero); accounts.google.com/gsi/button 200ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3151, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 19 corridas osciló entre 67 y 90 (mediana 69); este valor (85) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 74 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
