# Academia: integración con el motor adaptativo y Supabase

Estado: **preparada y probada en aislamiento. Nada está aplicado en producción.** Rama `academia/piloto-to-be`.

## Idea central

La academia no tiene sistema de errores propio. Cada actividad se registra como un ejercicio más del motor actual:

| Qué pasa en la academia | Dónde queda | Quién lo usa después |
|---|---|---|
| Fallas o aciertas una actividad | `mistake_stats` (RPC `apply_mistake_results`), `item_id = ac:to-be:l3-a2`, `kind = academia`, `topic = Verbo "to be": am / is / are` | Mismos umbrales: 2 aciertos seguidos recupera, 4 domina, un fallo reactiva |
| Terminas una lección | UNA fila en `progress_sessions` (skill `gramatica`, nivel `facil`) | Racha, precisión semanal, diagnóstico, `last_practice_at` |
| Avance del curso (lecciones hechas, lección a medias, meta semanal) | `academia_progress` (un documento por cuenta y curso, con versión) | Cualquier dispositivo |
| Evaluación oficial | RPC `academia_exam_start` / `academia_exam_submit` | La nota la calcula el servidor |
| Aprobar | `academia_badges`, solo la crea `academia_exam_submit` | Mis logros |

Del lado del sitio, `academia-motor.js` (generado desde `academia-data.js`) le dice a `app.js`:
- que las actividades `ac:*` pertenecen al tema real `to-be-presente` (diagnóstico, familias, "Reforzar...");
- que si ese tema es el punto débil, además de la acción de siempre se ofrezca **"Repasar la lección N del curso TO BE"**, con la lección donde más errores activos tiene y `?volver=` para regresar a la página de origen.

Los repasos de errores del sitio (Errores, Plan) **nunca** reciben actividades de academia: el índice de repasos no cambia, solo el del diagnóstico.

## Interruptores (todo apagado hoy)

1. `academia_courses.enabled` (base): sin esto ninguna función de academia hace nada.
2. `CLOUD_ON` en `academia-boot.js`: sin esto la página no carga Supabase y funciona como el piloto.
3. `ACADEMIA_MOTOR.enabled` en `academia-motor.js` (se carga en las páginas con `app.js`): sin esto el diagnóstico es idéntico al de hoy.

Hay pruebas que demuestran que, apagados, el diagnóstico es byte a byte el mismo.

## Seguridad

- Las tablas nuevas no aceptan escritura directa desde el navegador (solo RPC `security definer`). Se prueba que insertar una insignia, editar una nota o leer el banco del examen falla.
- El repositorio es público: **las respuestas del examen real no están en el repo.** Viven en `private/` (ignorado por git) y se cargan con `tools/academia_seed_examen.js` → SQL que se corre una vez. El examen entrega las fichas de "ordenar" mezcladas y nunca manda respuestas ni explicaciones.
- Límites: 3 intentos por día (configurable), un intento abierto se retoma (recargar no sortea preguntas nuevas), solo miembros (configurable), umbral 80 % (configurable en la base).
- Riesgo conocido: tras cada intento se muestran las respuestas correctas de lo que falló. Alguien con muchas cuentas e intentos podría ir recopilando el banco. Mitigaciones: límite diario, preguntas distintas entre intentos, banco ampliable. Se puede apagar mostrando solo la explicación.

## Envío de errores: exactamente una vez

`apply_mistake_results` (el motor actual) no es idempotente: cada llamada suma. Por eso los errores de cursos no la llaman directo:
- el navegador guarda cada respuesta en una cola persistente (`leo_academia_cola_v1:<cuenta>:<curso>`, sobrevive a cerrar el navegador y a quedarse sin conexión);
- antes de enviar, la cola se "sella" en lotes con un identificador; el servidor (`academia_apply_mistakes`) recuerda los lotes ya aplicados (`academia_mistake_batches`), así que reintentar, perder la respuesta de la red o abrir dos pestañas no cuenta doble;
- si el motor falla (en una lección o en el examen), la nota se entrega igual, el lote queda `pending` con el error escrito y se reintenta solo al abrir la academia (`academia_retry_pending`).
Ver qué falló: `select * from academia_mistake_batches where status = 'pending';`
Las sesiones de lección van por la misma cola y usan la regla ya existente de `progress_sessions` (índice único usuario + inicio + skill): reintentar no duplica. Repetir una lección a propósito sí es una práctica nueva.

## Cuentas gratuitas y miembros

- Gratis: ven la academia, hacen las 5 lecciones y la práctica sin límite, guardan avance y errores en su cuenta. Las sesiones de lección pasan por los límites que ya tiene `progress_sessions` para cuentas gratis (el servidor marca `tier = free`).
- Miembros de pago: además la evaluación oficial con insignia (`members_only = true`, lo decide el servidor mirando `profiles.is_member`).
- El contenido de las lecciones es público (el sitio es estático), así que "gratis" aquí es una decisión de producto, no una barrera técnica. Lo que sí se protege en el servidor es el examen y la insignia.

## Apagado rápido

1. Inmediato, sin publicar nada: `update public.academia_courses set enabled = false where course_id = 'to-be';` La base deja de aceptar guardados, examen y errores de academia; el navegador sigue con el piloto local. Para volver: `enabled = true`.
2. Si hace falta quitarlo del sitio: `git revert` del merge en main (GitHub Pages republica en ~1 minuto) o dejar `CLOUD_ON` y `ACADEMIA_MOTOR.enabled` en `false`.
3. Deshacer la base: `supabase/rollback/academia_integracion_rollback.sql` (nada lo corre solo).

## Verificado contra producción (solo lectura, 2026-10-25)

PostgreSQL 17.6. `mistake_stats` con `unique (user_id, item_id)` y sin CHECK sobre `kind`/`status` (admite `kind = 'academia'`); `apply_mistake_results(jsonb)` con el mismo cuerpo que `supabase_schema.sql` (security invoker, `search_path=public`); `progress_sessions` con `tier`, índice único `(user_id, started_at, skill)` y trigger de límites; `profiles.is_member`; RLS activo en las tres. No existe ningún objeto `academia*` (sin colisiones). La migración tiene una comprobación previa que se detiene sin crear nada si falta una pieza.
No verificado: el cuerpo de `progress_sessions_guard` línea por línea, ni los permisos de columnas de `profiles`.

## Lanzamiento (cada paso lo autoriza Leo; ninguno está hecho)

1. Backup/punto de control de Supabase.
2. SQL Editor: correr `supabase/migrations/20261026120000_academia_integracion.sql` (con `enabled = false` no cambia nada visible).
3. SQL Editor: correr el banco del examen `private/seed-academia-examen-to-be.sql` (fuera de git).
4. Comprobar con una cuenta de prueba (gratis y miembro) en una rama de vista previa con `?nube=1` solo en localhost, o con `enabled` aún en false: `select count(*) from academia_exam_items;` debe dar 30.
5. Publicar el sitio con `CLOUD_ON = true` y `ACADEMIA_MOTOR.enabled = true`, y `academia-motor.js` añadido a las páginas con `app.js` (progreso, plan, errores). Merge a main.
6. `update public.academia_courses set enabled = true where course_id = 'to-be';` (esto es lo que enciende todo).
7. Vigilar: `academia_mistake_batches` con `status = 'pending'`, errores de consola, `mistake_stats` con `item_id like 'ac:%'`.
8. Más adelante: decidir cuándo reemplaza al modo Aprender.

## Pruebas

| Archivo | Qué prueba |
|---|---|
| `tools/tests/academia-piloto.test.js` | Contenido, audio, estructura (13) |
| `tools/tests/academia-sql.test.js` | La migración real en Postgres embebido: permisos, versiones, examen, insignia, errores al motor, idempotencia |
| `tools/tests/academia-integracion.test.js` | Apagado por defecto, fusión de dispositivos, cliente contra la base, motor adaptativo con `app.js` real |
| `tools/tests/academia-robustez.test.js` | Campos del progreso, errores exactamente una vez, motor roto en el examen, cola sin conexión y cierre del navegador, dos pestañas, sesiones sin duplicar, cuentas gratis, apagado rápido, migración con comprobación previa (23) |
| `tools/tests/academia-e2e-nube.js` | Navegador real (Chromium) con dos dispositivos, sin red, refuerzo y volver, examen oficial e insignia |

Las de base necesitan `npm i --no-save @electric-sql/pglite` (como las otras pruebas SQL del proyecto).

## Lo que NO se pudo comprobar

- Postgres real de Supabase (RLS con roles reales, `auth.uid()`): se probó con Postgres embebido y roles equivalentes; el esquema de producción se leyó pero no se ejecutó nada allí.
- Dispositivos reales: solo Chromium emulado.
- Calidad auditiva del audio.
