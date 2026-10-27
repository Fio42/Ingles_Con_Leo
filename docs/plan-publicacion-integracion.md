# Plan de publicación: rediseño del panel + embudo de la demo (rama `integracion/embudo-y-rediseno`)

Nada de esto se ha ejecutado en producción. Cada paso necesita la autorización de Leo.

## Qué se publica
- Frontend: nuevo Inicio, Practicar, Mi progreso, navegación unificada, Academia con progreso del servidor, invitación a TO BE en el aviso del límite, eventos nuevos.
- SQL: `supabase/migrations/20261027180000_academia_demo_independiente.sql` (reemplaza solo `academia_access` y `academia_demo_start`; mismas firmas y permisos).

## Orden y compatibilidad
SQL primero, frontend después.
- Frontend viejo + SQL nuevo: funciona. Solo cambia el texto viejo "usa 3 de tus 6 ejercicios", que deja de ser cierto durante unos minutos. `demoStart` ya tolera que no llegue `daily`.
- Frontend nuevo + SQL viejo (si se publica al revés): sin daño. La invitación solo aparece si el servidor dice "disponible", y con el SQL viejo no lo dice al llegar al límite. Los 3 ejercicios se seguirían cobrando.

## 1. Antes de empezar
1. Confirmar `main` limpio y que la rama de integración pasa las pruebas (ver informe).
2. Copia de seguridad en Supabase (Database > Backups; si no hay plan con copias, exportar con `pg_dump` o desde el SQL Editor):
   - `select * from public.academia_progress;`
   - `select id, free_daily_count, free_daily_date, free_daily_limit_reached_at from public.profiles where free_daily_date >= current_date - 2;`
3. Guardar la definición actual de las dos funciones (para comparar y para revertir):
   `select pg_get_functiondef('public.academia_demo_start(text,date,int)'::regprocedure), pg_get_functiondef('public.academia_access(text,date,int)'::regprocedure);`
4. Línea base de analítica (informe de 24 h) para comparar después.

## 2. Aplicar la migración (SQL Editor, una sola ejecución)
Pegar el contenido de `20261027180000_academia_demo_independiente.sql`. Es `create or replace` de dos funciones: no toca tablas ni datos.

## 3. Verificar las funciones
1. Definiciones: `pg_get_functiondef` muestra que `academia_demo_start` ya no menciona `free_daily_count`.
2. Permisos: `select has_function_privilege('anon','public.academia_demo_start(text,date,int)','execute')` debe dar `false`; con `authenticated`, `true`.
3. Prueba funcional con una cuenta de prueba propia (no de clientes): con el contador en 6/6, `academia_access('to-be')` devuelve `demo.available = true`; después de la demo, el contador sigue en 6 y `used = true`.

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
