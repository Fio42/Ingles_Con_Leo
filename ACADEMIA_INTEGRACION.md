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

## Qué requiere aprobación de Leo para producción (en este orden)

1. Aplicar `supabase/migrations/20261026120000_academia_integracion.sql` (aditiva, idempotente; no toca `profiles`, `progress_sessions` ni `mistake_stats`).
2. Correr el SQL del banco del examen (`node tools/academia_seed_examen.js to-be` → `private/seed-academia-examen-to-be.sql`).
3. Habilitar el curso: `update academia_courses set enabled = true where course_id = 'to-be'`.
4. Decidir si la evaluación oficial es solo para miembros (hoy: sí, `members_only`).
5. Cambiar `CLOUD_ON` y `ACADEMIA_MOTOR.enabled` a `true`, añadir `academia-motor.js` a las páginas con `app.js` (progreso, plan, errores) y publicar (merge a main).
6. Decidir cuándo reemplaza al modo Aprender.

## Pruebas

| Archivo | Qué prueba |
|---|---|
| `tools/tests/academia-piloto.test.js` | Contenido, audio, estructura (13) |
| `tools/tests/academia-sql.test.js` | La migración real en Postgres embebido: permisos, versiones, examen, insignia, errores al motor, idempotencia |
| `tools/tests/academia-integracion.test.js` | Apagado por defecto, fusión de dispositivos, cliente contra la base, motor adaptativo con `app.js` real |
| `tools/tests/academia-e2e-nube.js` | Navegador real (Chromium) con dos dispositivos, sin red, refuerzo y volver, examen oficial e insignia |

Las de base necesitan `npm i --no-save @electric-sql/pglite` (como las otras pruebas SQL del proyecto).

## Lo que NO se pudo comprobar

- El esquema vivo de Supabase: no hay acceso de solo lectura desde este entorno. Se usó `supabase_schema.sql` y `supabase/migrations/` como esquema de referencia. Antes de aplicar conviene confirmar que producción coincide (en especial `mistake_stats`, `apply_mistake_results` y `profiles.is_member`).
- Postgres real de Supabase (RLS con roles reales, `auth.uid()`): se probó con Postgres embebido y roles equivalentes.
- Dispositivos reales: solo Chromium emulado.
