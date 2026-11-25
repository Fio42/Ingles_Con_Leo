# Mini auditoría de la plataforma (2026-11-24)

Alcance: sitio en vivo (inglesconleo.com) como visitante y miembro (cuenta de Leo, sesión iniciada por Leo) + código local. Primera pasada solo lectura; segunda pasada: correcciones LOCALES, sin publicar ni push.

Leyenda: **Corregido** = cambio hecho en el código local · **Probado** = comprobado con prueba o en navegador · **Pendiente** = falta publicar/verificar.

## Resumen
- Los 13 hallazgos + el fix previo están corregidos y **publicados** (commit 2cfdb63).
- Probado: pruebas automáticas (auditoria-plataforma 21 ok), miembro en producción y visitante con el mismo código en local. **Pendiente**: nada de las 3 modalidades.

## Causas raíz y estado
| # | Hallazgo | Causa raíz | Estado |
|---|---|---|---|
| 1 | Errores pendientes 116 vs 90 | No eran dos criterios: `progreso.html` dibujaba primero con el historial de ESTE dispositivo (90) y ~1 s después con `mistake_stats` del servidor (116, misma fuente que panel y Mis errores). Medido en producción cada 0,5 s. | Corregido en `diagRenderWithStats` (espera al servidor máx. 2 s y dibuja una vez). Probado con pruebas (5 casos). Pendiente verificar en producción. |
| 2 | Gramática "fortaleza" y "Necesita refuerzo" | Fortaleza = % total (79%); estado = % reciente (20%): dos métricas distintas sin explicarlo. | Corregido: la fortaleza excluye habilidades en "Necesita refuerzo" y el texto dice "en total". Probado (fuente). |
| 3 | `aprender.html` "Próximamente" aunque hay curso | Son microlecciones sin audio, distintas de los cursos; nada las conectaba. | Corregido: enlace "El curso completo ya está en la Academia" (4 mapeos validados contra cursos reales). |
| 4 | "A medias" con 0 lecciones (4 cursos) | **No es bug**: leídas las claves de la cuenta (solo lectura), los 4 tienen progreso real (preguntas respondidas o pasos avanzados). Los de solo pantalla 1 ya dicen "Empezar el curso". | Verificado. Sin cambios, progreso intacto. |
| 5 | practica-miembros "8" vs "9" | Texto fijo; la sesión es de ~5, ~9 o ~15 según el ajuste. | Corregido: sin número fijo. Probado. |
| 6 | practica visitante "8 preguntas" | Banco de 8; el límite del visitante (3) corta después. | Corregido: encabezado y contador dicen 3 (`freeShownTotal`); banco y conteo sin cambios. Probado en navegador local. |
| 7 | "To be": Gratis y Solo para miembros | Una lección gratis no abierta caía en el texto genérico. | Corregido: "Gratis con tu cuenta". |
| 8 | Pestaña "Hazte miembro" ya dentro | `<title>` fijo. | Corregido: "Mi panel" / "Tu cuenta". |
| 9 | Título "curso TO BE" un momento al abrir un curso directo | `<title>` estático de la portada (SEO). | **Pendiente a propósito**: cambiarlo afecta SEO; se deja. |
| 10 | "Academia - Academia" | `setTitle('Academia')`. | Corregido. Probado. |
| 11 | Siguiente pegado a LeoBot (pantalla ancha) | Lanzador reducido a la derecha, igual que Siguiente. | Corregido: a la izquierda durante la práctica. |
| 12 | LeoBot tapa "Practicar ahora" (celular) | Lanzador de 64 px. | Mitigado: 56 px y más a la derecha (sigue siendo un botón flotante; puede tapar una esquina según el scroll). |
| 13 | "reforzar es Presente simple" dentro de Presente simple | Texto sin comprobar nombres iguales. | Corregido. Probado (fuente). |
| 0 | Inicio "Continuar curso" con 0 lecciones | La evaluación sola (markDay) contaba como curso empezado. | Corregido en `inicio-alumno.js`. Probado. |

## Fuente centralizada de cursos (punto 3 del encargo)
Se reutiliza lo existente: `hasProgress`/`pendingResume` (academia.js) para "a medias", el motor de cursos (`inicio-alumno.js` lee `ACADEMIA_CURSOS` y `academia_progress`) para Inicio. No se agregó lógica nueva ni se duplicó.

## Pruebas
- Nueva: `tools/tests/auditoria-plataforma.test.js` (17 ok; 11 fallan sin los arreglos).
- Suite (jsdom 24 instalado fuera del proyecto): solo rojas `academia-articulos` y `academia-piloto` (entorno: falta contenido privado y ffprobe). `academia-puente`, `aislamiento-cuentas` y `oferta-primera-sesion` fallaban ya antes de esta auditoría por la prueba, no por el sitio (CRLF y fecha UTC vs local): **corregidas** el mismo día.
- `auditar.js`: OK. Consola del navegador: 0 errores.
- GA4, Meta Pixel, pagos, permisos, progreso y Supabase: no se tocaron; los cambios solo afectan cuándo se dibuja el diagnóstico y textos.

## Riesgos pendientes
- Verificar con sesión (cuenta gratis y miembro) tras publicar; en especial que progreso.html muestre una sola cifra.
- Con red lenta (>2 s) el diagnóstico muestra lo local y se redibuja al llegar el servidor (comportamiento anterior, acotado).
- El visitante sigue con banco de 8 y corte a las 3 (decisión previa para no perder el evento `guest_exercise_limit_reached`).
- Cuenta gratis: no probada. Teléfono real, pagos, correos, Leo AI y audio: no cubiertos.

## Revisión final y verificación en producción
- Diff: 96 de 97 HTML cambian solo el número ?v=; el otro es miembros.html (título). Sin cambios en pagos, permisos, progreso real ni eventos GA4/Pixel.
- Aislamiento: `loadMistakeStatsMap` no guarda en cache datos que llegan cuando el espacio/cuenta ya cambió. Red lenta (>2 s): lo local se muestra con la nota "Actualizando con tus datos guardados" hasta que llegue el servidor o falle.
- LeoBot: en celular el lanzador (56 px) solo toca el borde derecho (5-13 % del ancho) de algunos botones y tarjetas; durante la práctica va a la izquierda y no capta clics.
- **Miembro (producción)**: progreso muestra 116 sin parpadeo; títulos, textos y enlaces nuevos OK; fortaleza queda "Aún sin definir" con los datos actuales (Gramática en refuerzo).
- **Visitante (producción, sin sesión)**: verificado: "3 preguntas" y "Pregunta 1 de 3", aprender (Gratis con tu cuenta, enlaces a cursos), títulos, redirecciones. Detalle menor: con el límite ya gastado el muro conserva el encabezado "8 preguntas cortas".
- **Cuenta gratuita (producción)**: verificada: práctica de 6 (cupo de la cuenta), título "Tu cuenta", páginas de miembros redirigen a miembros.html, aprender y Academia correctos.
- Residual: GitHub Pages cachea el HTML unos minutos.
