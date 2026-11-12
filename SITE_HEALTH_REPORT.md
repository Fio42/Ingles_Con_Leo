# SITE HEALTH — 2026-11-12

🔴 Críticos: 0
🟠 Importantes: 1
🟡 Mejoras: 0
🟢 Páginas sin problemas: 76 de 77

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
| Home | 98/100 | 100/100 | 100/100 | 100/100 | 1158ms | 0.004 | 161ms |
| Práctica (gratis) | 98/100 | 100/100 | 94/100 | 100/100 | 1121ms | 0.002 | 143ms |
| Artículos (índice) | 97/100 | 100/100 | 96/100 | 100/100 | 1992ms | 0.003 | 110ms |
| Artículo: verbo to be | 97/100 | 100/100 | 100/100 | 100/100 | 1136ms | 0.004 | 201ms |
| Artículo: presente simple | 97/100 | 100/100 | 100/100 | 100/100 | 1102ms | 0.022 | 186ms |
| Artículo: cómo aprender desde cero | 98/100 | 100/100 | 100/100 | 100/100 | 1122ms | 0.002 | 153ms |
| Miembros (landing de pago) | 93/100 | 100/100 | 98/100 | 77/100 | 2086ms | 0.076 | 255ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 1158ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 96ms, elementRenderDelay 151ms)
  - Bloquean el render: inglesconleo.com/style.css (323ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 264ms (tercero); inglesconleo.com/mini-lecciones.js 133ms; inglesconleo.com/leo-pointing.png 113ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4281, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 33 corridas osciló entre 46 y 98 (mediana 82); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 1121ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 51ms, elementRenderDelay 71ms)
  - Bloquean el render: inglesconleo.com/style.css (327ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 249ms (tercero); connect.facebook.net/signals/config/2182739922655837 143ms (tercero); fonts.googleapis.com/css2 98ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4522, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 33 corridas osciló entre 53 y 97 (mediana 83); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 1992ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 54ms, elementRenderDelay 147ms)
  - Bloquean el render: inglesconleo.com/style.css (164ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 236ms (tercero); connect.facebook.net/signals/config/2182739922655837 127ms (tercero); img.youtube.com/vi/JPq1KBBsbtI/hqdefault.jpg 117ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4373, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 33 corridas osciló entre 54 y 98 (mediana 86); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1136ms en `body > main > article.article-body > p` (timeToFirstByte 40ms, elementRenderDelay 69ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (323ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 256ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 149ms (tercero); fonts.googleapis.com/css2 96ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4451, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 33 corridas osciló entre 75 y 98 (mediana 86); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1102ms en `body > main > article.article-body > p` (timeToFirstByte 172ms, elementRenderDelay 131ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 240ms (tercero); inglesconleo.com/articulo-presente-simple.html 171ms; iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 152ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4339, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 33 corridas osciló entre 69 y 98 (mediana 87); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1122ms en `body > main > article.article-body > p` (timeToFirstByte 51ms, elementRenderDelay 107ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 253ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 142ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 112ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4286, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 33 corridas osciló entre 50 y 97 (mediana 86); este valor (98) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 2086ms en `main > div#gate > div > h1` (timeToFirstByte 91ms, elementRenderDelay 152ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (160ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 244ms (tercero); accounts.google.com/gsi/button 197ms (tercero); m.stripe.com/6 170ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (2); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4442, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 33 corridas osciló entre 67 y 91 (mediana 77); este valor (93) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 77 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
