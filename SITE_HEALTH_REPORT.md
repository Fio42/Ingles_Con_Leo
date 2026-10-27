# SITE HEALTH — 2026-10-27

🔴 Críticos: 0
🟠 Importantes: 3
🟡 Mejoras: 2
🟢 Páginas sin problemas: 71 de 74

## Las 3 cosas que más conviene revisar

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 65/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance = 65/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

## Críticos + Importantes (todos)

🟠 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance = 65/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance = 65/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.

🟠 https://inglesconleo.com/miembros.html
Lighthouse Best Practices = 77/100.
Impacto: Hay margen claro de mejora.
Acción: Revisar el detalle del reporte de Lighthouse para esta página.


<details>
<summary>🟡 Mejoras recomendables (click para expandir)</summary>

🟡 https://inglesconleo.com/ 🆕 NUEVO
Lighthouse Performance bajó de 81 a 65 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 17 corridas osciló entre 50 y 97 (mediana 77); este valor (65) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

🟡 https://inglesconleo.com/articulos.html 🆕 NUEVO
Lighthouse Performance bajó de 83 a 65 desde la última corrida.
Impacto: Probable ruido de medición: en las últimas 17 corridas osciló entre 54 y 95 (mediana 83); este valor (65) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
Acción: No tocar nada todavía: esperar la siguiente corrida (mañana).

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
| Home | 65/100 | 100/100 | 100/100 | 100/100 | 8458ms | 0.000 | 251ms |
| Práctica (gratis) | 94/100 | 100/100 | 93/100 | 100/100 | 2137ms | 0.000 | 216ms |
| Artículos (índice) | 65/100 | 100/100 | 96/100 | 100/100 | 8570ms | 0.002 | 191ms |
| Artículo: verbo to be | 96/100 | 100/100 | 100/100 | 100/100 | 1889ms | 0.001 | 193ms |
| Artículo: presente simple | 97/100 | 100/100 | 100/100 | 100/100 | 1103ms | 0.009 | 197ms |
| Artículo: cómo aprender desde cero | 95/100 | 100/100 | 100/100 | 100/100 | 1094ms | 0.000 | 242ms |
| Miembros (landing de pago) | 90/100 | 100/100 | 98/100 | 77/100 | 2031ms | 0.079 | 303ms |

### Detalle de rendimiento (qué retrasa cada página)

- home: LCP 8458ms en `section.hero-v2 > div.wrap > div.hero-v2-copy > p.hero-v2-sub` (timeToFirstByte 108ms, elementRenderDelay 1209ms)
  - Bloquean el render: inglesconleo.com/academia-lanzamiento.js (158ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (634ms)
  - Peticiones más lentas: inglesconleo.com/backend.js 238ms; connect.facebook.net/signals/config/2182739922655837 218ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 184ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3836, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 17 corridas osciló entre 50 y 97 (mediana 77); este valor (65) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- practica: LCP 2137ms en `main#practicaMain > section.page-hero > div.wrap > h1` (timeToFirstByte 128ms, elementRenderDelay 174ms)
  - Bloquean el render: inglesconleo.com/style.css (479ms); inglesconleo.com/meta-pixel.js (160ms); inglesconleo.com/error-monitor.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 158ms (tercero); inglesconleo.com/data.js 135ms; inglesconleo.com/practica.html 128ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4209, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 17 corridas osciló entre 53 y 87 (mediana 75); este valor (94) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulos: LCP 8570ms en `div.wrap > a.article-featured > div.article-featured-body > p` (timeToFirstByte 237ms, elementRenderDelay 1154ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (607ms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: img.youtube.com/vi/Wv4rEL4wYnE/hqdefault.jpg 307ms (tercero); img.youtube.com/vi/gf9T2K-zWcQ/hqdefault.jpg 268ms (tercero); img.youtube.com/vi/QqTghI1S9Ec/hqdefault.jpg 248ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 3960, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 17 corridas osciló entre 54 y 95 (mediana 83); este valor (65) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-verbo-to-be: LCP 1889ms en `body > main > article.article-body > p` (timeToFirstByte 186ms, elementRenderDelay 73ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/academia-lanzamiento.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 280ms (tercero); inglesconleo.com/articulo-verbo-to-be.html 186ms; xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 163ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4199, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 17 corridas osciló entre 75 y 95 (mediana 83); este valor (96) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-presente-simple: LCP 1103ms en `body > main > article.article-body > p` (timeToFirstByte 179ms, elementRenderDelay 59ms)
  - Bloquean el render: inglesconleo.com/meta-pixel.js (nullms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (309ms)
  - Peticiones más lentas: iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 190ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 184ms (tercero); inglesconleo.com/articulo-presente-simple.html 178ms
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4279, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 17 corridas osciló entre 69 y 94 (mediana 84); este valor (97) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- articulo-como-aprender-desde-cero: LCP 1094ms en `body > main > article.article-body > p` (timeToFirstByte 34ms, elementRenderDelay 70ms)
  - Bloquean el render: inglesconleo.com/style.css (317ms); inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/meta-pixel.js (nullms)
  - Peticiones más lentas: xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 160ms (tercero); iviksyhzhiygkuaojply.supabase.co/rest/v1/article_comments 155ms (tercero); cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js 89ms (tercero)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4039, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 17 corridas osciló entre 50 y 93 (mediana 82); este valor (95) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).
- miembros: LCP 2031ms en `main > div#gate > div > h1` (timeToFirstByte 21ms, elementRenderDelay 103ms)
  - Bloquean el render: inglesconleo.com/error-monitor.js (nullms); inglesconleo.com/style.css (464ms); inglesconleo.com/academia-lanzamiento.js (nullms)
  - Peticiones más lentas: accounts.google.com/gsi/button 182ms (tercero); xd-f1cf3d4fdb19408ea770fc6f80817dcb.ecs.us-east-1.on.aws/events 176ms (tercero); accounts.google.com/gsi/client 173ms (tercero)
  - Best Practices no pasa: Uses third-party cookies (2); Missing source maps for large first-party JavaScript (1); Issues were logged in the `Issues` panel in Chrome Devtools (1)
  - Condiciones: mobile, simulate, CPU x4, RTT 150ms, benchmark 4099, Lighthouse 13.5.0
  - Variación: Probable ruido de medición: en las últimas 17 corridas osciló entre 67 y 87 (mediana 69); este valor (90) ya se había visto. La máquina de medición fue distinta a la habitual (benchmarkIndex).

El historial completo está en tools/site-health/lighthouse-history.json.

---
Auditado: 160 URLs visitadas, 74 páginas públicas conocidas. Generado automáticamente por tools/site-health/audit.js, no editar a mano (se sobreescribe en cada corrida).
