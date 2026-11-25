# Mini auditoría de la plataforma (2026-11-24)

Alcance: sitio en vivo (inglesconleo.com) como visitante y miembro (cuenta de Leo, sesión iniciada por Leo) + código local. Primera pasada solo lectura; segunda pasada: correcciones LOCALES, sin publicar ni push.

Leyenda: **Corregido** = cambio hecho en el código local · **Probado** = comprobado con prueba o en navegador · **Pendiente** = falta publicar/verificar.

## Resumen
- Los 13 hallazgos + el fix previo tienen corrección local. Nada publicado.
- Probado: pruebas automáticas (auditoria-plataforma 17 ok) y visitante en navegador local. **Pendiente**: verificar como cuenta gratis y miembro con los cambios ya publicados (en local no hay sesión).

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
