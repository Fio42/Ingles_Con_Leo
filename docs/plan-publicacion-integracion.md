# Plan de publicación: rediseño del panel + embudo de la demo (rama `integracion/embudo-y-rediseno`)

Nada de esto se ha ejecutado en producción. Cada paso necesita la autorización de Leo.

## Qué se publica
- Frontend: nuevo Inicio, Practicar, Mi progreso, navegación unificada, Academia con progreso del servidor, invitación a TO BE en el aviso del límite, eventos nuevos.
- SQL: `supabase/migrations/20261027180000_academia_demo_independiente.sql` (reemplaza solo `academia_access` y `academia_demo_start`; mismas firmas y permisos).

## Orden y compatibilidad
SQL primero, frontend después.
- Frontend viejo + SQL nuevo: funciona. Solo cambia el texto viejo "usa 3 de tus 6 ejercicios", que deja de ser cierto durante unos minutos. `demoStart` ya tolera que no llegue `daily`.
- Frontend nuevo + SQL viejo (si se publica al revés): sin daño. La invitación solo aparece si el servidor dice "disponible", y con el SQL viejo no lo dice al llegar al límite. Los 3 ejercicios se seguirían cobrando.

## 1. Antes de empezar (verificado en solo lectura el 27 oct 2026)
**Respaldo.** El proyecto de Supabase es plan Free: NO tiene copias automáticas ni recuperación a un punto en el tiempo. Por eso el respaldo es este, y es suficiente porque la migración solo reemplaza dos funciones y no escribe datos:
- **Funciones actuales de producción = `supabase/rollback/academia_demo_independiente_rollback.sql`.** Se comprobó que las huellas md5 de las 7 funciones de Academia en producción son idénticas a las de la migración original, y que el rollback las reproduce byte por byte (`academia_demo_start` 07a6e34a55, `academia_access` 605e714538).
- **Huella de datos antes del cambio** (para comparar después; no contiene datos personales):
  - `academia_progress`: 3 filas, 1 demo iniciada, 1 terminada, md5 af9b8b5cbb
  - `academia_courses`: md5 6c2def2002 (to-be habilitado con 3 ejercicios de demo, pronombres habilitado sin demo)
  - `profiles`: 135 cuentas, 15 miembros (los contadores cambian a diario: solo comparar cuentas y miembros)
  - `mistake_stats` 302, `progress_sessions` 393, `academia_badges` 1, `academia_exam_attempts` 1 (solo pueden crecer)
- Antes de aplicar, repetir la consulta de huellas (archivo `supabase/verify/academia_demo_independiente_huellas.sql`) y comprobar que sigue igual.
- Línea base de analítica (informe de 24 h).

## 2. Aplicar la migración (SQL Editor, una sola ejecución)
Pegar `20261027180000_academia_demo_independiente.sql`. Es `create or replace` de dos funciones: no toca tablas ni datos. Quedará como las anteriores (aplicadas a mano, sin registro en el historial de migraciones).

## 3. Verificar las funciones
1. Huellas esperadas después de aplicar (`md5(pg_get_functiondef(...))`, primeros 10 caracteres): `academia_demo_start` = b326e1a3e9, `academia_access` = c6df7efa56. Las otras 5 funciones no deben cambiar (329db34855, edc3a0cc4a, ce015d3892, 7c808ffaef, 1fe6f83bfb).
2. Permisos: `proacl` de ambas debe ser `{postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}` (anon sin permiso), como ahora.
3. Prueba controlada con tu cuenta de prueba: correr `supabase/verify/academia_demo_independiente_prueba.sql` (cambiando el correo). No guarda nada: todo se deshace; debe mostrar 11 pasos en `true`.
4. Prueba real en pantalla con tu cuenta de prueba (ver `docs/prueba-controlada-supabase.md`).

## 4. Publicar el frontend
Merge de `integracion/embudo-y-rediseno` a `main` (sin force) y esperar a GitHub Pages. Los HTML ya traen versiones nuevas (`app.js`, `backend.js`, `style.css`, `academia.js` = `20261027c`), así que no hay caché vieja.

## 5. Pruebas inmediatas (15 min)
- Cuenta gratis de prueba: Inicio, Practicar, Mi progreso, Academia; llegar al límite y ver la invitación; hacer la demo; volver al aviso y comprobar que ya no se ofrece.
- Cuenta de miembro: sin invitación, acceso completo, progreso intacto.
- Visitante: aviso de crear cuenta, sin invitación.
- Móvil (390 px) y escritorio. Consola sin errores.

## 6. Monitoreo (primeras 24 a 48 h)
- Errores: tabla/alertas de `error-monitor` y el informe diario.
- GA4: `academia_demo_oferta_vista`, `academia_demo_clic`, `academia_demo_iniciada`, `academia_demo_completada`, `academia_cta_membresia`, `membership_cta_clicked`. Esperar que `free_daily_limit_reached` baje (ahora cuenta una vez por pestaña y día): no es una caída real.
- SQL: `select count(*) filter (where demo_started_at is not null), count(*) filter (where demo_done_at is not null) from public.academia_progress;` y comprobar que `free_daily_count` no sube por demos.
- Pagos: contrastar siempre con Stripe, PayPal y Mercado Pago, no con GA4.

## 7. Recuperación
- **Frontend:** `git revert -m 1 <merge>` y push (GitHub Pages republica solo). El frontend anterior funciona con el SQL nuevo.
- **SQL:** ejecutar `supabase/rollback/academia_demo_independiente_rollback.sql`. Restaura las dos funciones anteriores (la demo vuelve a cobrar 3 ejercicios). No borra ni cambia datos: `academia_progress` y `profiles` quedan igual. Quien ya hizo su demo sigue marcado como usada.
- **Apagado rápido de la Academia:** `update public.academia_courses set enabled = false where course_id = 'to-be';` (reversible, no borra nada).
- Nunca usar el rollback completo de `academia_integracion_rollback.sql` (borra tablas con progreso).
