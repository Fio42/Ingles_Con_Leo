# SITE HEALTH — 2026-10-20

🔴 Críticos: 0
🟠 Importantes: 2
🟡 Mejoras: 0
🟢 Páginas sin problemas: 71 de 72

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 68/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/miembros.html
Lighthouse Performance = 68/100.
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
| Home | 82/100 | 100/100 | 100/100 | 100/100 | 3098ms | 0.001 | 462ms |
| Práctica (gratis) | 83/100 | 100/100 | 90/100 | 100/100 | 1910ms | 0.000 | 622ms |
| Artículos (índice) | 84/100 | 100/100 | 96/100 | 100/100 | 2554ms | 0.002 | 473ms |
| Artículo: verbo to be | 84/100 | 100/100 | 100/100 | 100/100 | 1918ms | 0.001 | 592ms |
| Artículo: presente simple | 84/100 | 100/100 | 100/100 | 100/100 | 1958ms | 0.009 | 594ms |
| Artículo: cómo aprender desde cero | 83/100 | 100/100 | 100/100 | 100/100 | 2060ms | 0.000 | 622ms |
| Miembros (landing de pago) | 68/100 | 100/100 | 98/100 | 77/100 | 3378ms | 0.079 | 984ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 3098ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > h1` (timeToFirstByte 32ms, elementRenderDelay 131ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (466ms)
  - Peticiones más lentas: connect.facebook.net/signals/config/2182739922655837 294ms (tercero); connect.facebook.net/en_US/fbevents.js 243ms (tercero); www.googletagmanager.com/gtag/js 93ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2504, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 10 corridas osciló entre 50 y 79 (mediana 76); este valor (82) ya se había visto.
- practica: LCP 1910ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 27ms, elementRenderDelay 121ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (466ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 104ms (tercero); www.google-analytics.com/g/collect 98ms (tercero); fonts.googleapis.com/css2 60ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2220, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 10 corridas osciló entre 53 y 87 (mediana 75); este valor (83) ya se había visto.
- articulos: LCP 2554ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 29ms, elementRenderDelay 111ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (466ms); inglesconleo.com/error-monitor.js (155ms)
  - Peticiones más lentas: www.googletagmanager.com/gtag/js 110ms (tercero); www.google-analytics.com/g/collect 94ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 61ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2489, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 10 corridas osciló entre 54 y 86 (mediana 81.5); este valor (84) ya se había visto.
- articulo-verbo-to-be: LCP 1918ms en `body > main > article.article-body > p` (timeToFirstByte 118ms, elementRenderDelay 134ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (471ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 698ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 167ms (tercero); www.googletagmanager.com/gtag/js 124ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2442, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 10 corridas osciló entre 75 y 90 (mediana 81.5); este valor (84) ya se había visto.
- articulo-presente-simple: LCP 1958ms en `body > main > article.article-body > p` (timeToFirstByte 28ms, elementRenderDelay 113ms)
  - Bloquean el render: inglesconleo.com/style.css (466ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 341ms (tercero); www.googletagmanager.com/gtag/js 105ms (tercero); www.google-analytics.com/g/collect 97ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2427, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 10 corridas osciló entre 69 y 88 (mediana 83.5); este valor (84) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 2060ms en `body > main > article.article-body > p` (timeToFirstByte 30ms, elementRenderDelay 123ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (467ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 132ms (tercero); www.google-analytics.com/g/collect 106ms (tercero); www.googletagmanager.com/gtag/js 102ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2425, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 10 corridas osciló entre 50 y 88 (mediana 77.5); este valor (83) ya se había visto.
- miembros: LCP 3378ms en `main > div#gate > div > h1` (timeToFirstByte 60ms, elementRenderDelay 171ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (155ms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (466ms)
  - Peticiones más lentas: m.stripe.com/6 243ms (tercero); www.google-analytics.com/g/collect 141ms (tercero); accounts.google.com/gsi/button 124ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2460, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 10 corridas osciló entre 67 y 82 (mediana 68); este valor (68) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 72 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
