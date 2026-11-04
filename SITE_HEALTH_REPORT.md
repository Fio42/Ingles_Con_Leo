# SITE HEALTH — 2026-11-04

🔴 Críticos: 1
🟠 Importantes: 1
🟡 Mejoras: 1
🟢 Páginas sin problemas: 74 de 76

## Las 3 cosas que más conviene revisar

🔴 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 46/100.
Impacto: Puntaje muy bajo, afecta tanto ranking como experiencia real de usuarios.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🔴 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 46/100.
Impacto: Puntaje muy bajo, afecta tanto ranking como experiencia real de usuarios.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

🟡 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance bajó de 90 a 46 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 25 corridas osciló entre 50 y 97 (mediana 79); este valor (46) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

</details>

<details>
<summary>ℹ️ Contexto / notas del propio auditor</summary>

ℹ️ https://inglesconleo.com 🆕 NUEVO
Best Practices se calculó sin la cookie de terceros del Meta Pixel (6 página(s)).
Impacto: Lighthouse penaliza la cookie "fr" de facebook.com aunque no se puede quitar sin desactivar el pixel de anuncios; se ignora para no marcar críticos falsos.
Acción: Nada que hacer, salvo que algún día se quite el pixel.

</details>

## Lighthouse (páginas clave)

| Página | Performance | SEO | Accesibilidad | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 46/100 | 100/100 | 100/100 | 100/100 | 4065ms | 0.000 | 5459ms |
| Práctica (gratis) | 83/100 | 100/100 | 93/100 | 100/100 | 2986ms | 0.002 | 289ms |
| Artículos (índice) | 94/100 | 100/100 | 96/100 | 100/100 | 1909ms | 0.004 | 225ms |
| Artículo: verbo to be | 94/100 | 100/100 | 100/100 | 100/100 | 1077ms | 0.004 | 277ms |
| Artículo: presente simple | 95/100 | 100/100 | 100/100 | 100/100 | 1077ms | 0.022 | 244ms |
| Artículo: cómo aprender desde cero | 95/100 | 100/100 | 100/100 | 100/100 | 1075ms | 0.002 | 241ms |
| Miembros (landing de pago) | 86/100 | 100/100 | 98/100 | 77/100 | 1078ms | 0.080 | 510ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 4065ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 459ms, elementRenderDelay 1292ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/style.css (310ms)
  - Peticiones más lentas: www.google-analytics.com/g/collect 416ms (tercero); inglesconleo.com/chatbot.js 319ms; connect.facebook.net/en_US/fbevents.js 316ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 528, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 25 corridas osciló entre 50 y 97 (mediana 79); este valor (46) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 2986ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 30ms, elementRenderDelay 190ms)
  - Bloquean el render: inglesconleo.com/style.css (310ms); inglesconleo.com/error-monitor.js (155ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 272ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 201ms (tercero); inglesconleo.com/site.webmanifest 135ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2973, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 25 corridas osciló entre 53 y 96 (mediana 83); este valor (83) ya se había visto.
- articulos: LCP 1909ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 31ms, elementRenderDelay 255ms)
  - Bloquean el render: inglesconleo.com/style.css (155ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: inglesconleo.com/chatbot.css 359ms; connect.facebook.net/en_US/fbevents.js 258ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 203ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2940, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 25 corridas osciló entre 54 y 98 (mediana 84); este valor (94) ya se había visto.
- articulo-verbo-to-be: LCP 1077ms en `body > main > article.article-body > p` (timeToFirstByte 28ms, elementRenderDelay 83ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (310ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 207ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 136ms (tercero); www.facebook.com/tr/ 125ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3035, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 25 corridas osciló entre 75 y 96 (mediana 84); este valor (94) ya se había visto.
- articulo-presente-simple: LCP 1077ms en `body > main > article.article-body > p` (timeToFirstByte 28ms, elementRenderDelay 83ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/style.css (310ms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 202ms (tercero); www.facebook.com/tr/ 134ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 65ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3064, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 25 corridas osciló entre 69 y 97 (mediana 85); este valor (95) ya se había visto.
- articulo-como-aprender-desde-cero: LCP 1075ms en `body > main > article.article-body > p` (timeToFirstByte 26ms, elementRenderDelay 82ms)
  - Bloquean el render: inglesconleo.com/style.css (310ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: connect.facebook.net/en_US/fbevents.js 255ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 228ms (tercero); connect.facebook.net/signals/config/2182739922655837 126ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3025, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 25 corridas osciló entre 50 y 95 (mediana 84); este valor (95) ya se había visto.
- miembros: LCP 1078ms en `main > div#gate > div > h1` (timeToFirstByte 29ms, elementRenderDelay 125ms)
  - Bloquean el render: inglesconleo.com/style.css (155ms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 614ms (tercero); iviksyhzhiygkuaojply.supabase.co/functions/v1/stripe-checkout 401ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 199ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 2881, Lighthouse 13.6.0
  - Variación: Probable ruido de medición: en las últimas 25 corridas osciló entre 67 y 91 (mediana 75); este valor (86) ya se había visto.

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 76 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
