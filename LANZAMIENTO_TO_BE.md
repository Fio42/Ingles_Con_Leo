# Lanzamiento controlado de TO BE (academia + presentación comercial)

## Dos interruptores, un solo comportamiento
- `academia-lanzamiento.js` (`PUBLIC`): lo que ve el público. En `false` el sitio no anuncia la academia (portada, miembros, navegación, bienvenida, avisos de práctica, artículo de TO BE). El antiguo Modo aprender sigue funcionando y se oculta solo al encender.
- `academia-boot.js` (`CLOUD_ON`) + `ACADEMIA_MOTOR.enabled` + `academia_courses.enabled`: la parte en la nube.
- Cuenta de prueba: `localStorage.setItem('leo_academia_canary','1')` en su navegador activa AMBAS cosas solo para ella, en el dominio real. Se quita con `removeItem`.
- Al encender para todos, `PUBLIC=true` y `CLOUD_ON=true` van en el mismo commit.
- Verificaciones de solo lectura en Supabase real: `supabase/verify/academia_verificacion.sql`.

Nada de esto está ejecutado. Cada paso lo autoriza Leo. Precio en toda la academia: **$2 USD al mes**.

## 0. Antes de tocar nada (solo lectura)
1. Supabase, Project Settings, Database, Backups: confirmar que hay un respaldo de hoy (o crear uno con "Create backup" si el plan lo permite) y anotar su hora. Sin respaldo verificado no se sigue.
2. SQL Editor (solo SELECT): `select count(*) from profiles; select count(*) from progress_sessions; select count(*) from mistake_stats;` Guardar los 3 números.
3. Precio: abrir en Stripe el producto/precio de `STRIPE_PRICE_ID` (y el anual), en PayPal el plan `PAYPAL_PLAN_ID`, y confirmar $2/mes y $20/año. Mercado Pago cobra 40 MXN fijos (`create-checkout.ts`). Claude no puede ver esos paneles.

## 1. Migración (con la academia APAGADA)
1. SQL Editor: pegar `supabase/migrations/20261026120000_academia_integracion.sql` y ejecutar. Tiene comprobación previa: si falta algo, se detiene sin crear nada. Solo crea objetos `academia_*`; no modifica datos ni tablas existentes. Deja `enabled=false`.
2. Cargar el banco: pegar `private/seed-academia-examen-to-be.sql` (archivo local, NO está en git) y ejecutar. Verificar: `select count(*) from academia_exam_items;` (30).
3. Permisos (solo SELECT, deben salir 0 filas):
   `select routine_name from information_schema.routine_privileges where grantee='anon' and routine_name like 'academia%';`
   `select table_name, privilege_type from information_schema.table_privileges where grantee in ('anon','authenticated') and table_name in ('academia_exam_items','academia_mistake_batches');`
4. Repetir los 3 conteos del paso 0.2: deben ser iguales.

## 2. Código con la academia apagada
Merge de `academia/piloto-to-be` a main (lo autoriza Leo). `CLOUD_ON=false` y `ACADEMIA_MOTOR.enabled=false`: el sitio se ve igual que hoy.

## 3. Prueba previa con cuentas de prueba (nadie más la ve)
1. SQL: `update academia_courses set enabled=true where course_id='to-be';` Los visitantes siguen sin cargar la parte en la nube (CLOUD_ON=false).
2. En el navegador de la cuenta de prueba, consola: `localStorage.setItem('leo_academia_canary','1')` y abrir la portada (se ve la versión de lanzamiento completa) y academia.html. Recorrido: portada, Explorar la academia, crear cuenta, demostración, invitación, `miembros.html?pagar=1` (sin pagar), y con una cuenta miembro el curso completo. Pago real de prueba solo con tu autorización.
3. Con una cuenta GRATIS: ve la presentación, hace la prueba UNA vez, ve la invitación; recargar y repetir no deja; las rutas de lecciones/evaluación muestran la presentación.
4. Con una cuenta MIEMBRO: lección completa, error que aparece en Progreso, evaluación y una sola insignia, y en Supabase `profiles.last_practice_at` actualizado.
5. Si algo falla: apagar (sección 5).

## 4. Activación para todos
1. `academia-lanzamiento.js`: `PUBLIC=true` y `academia-boot.js`: `CLOUD_ON=true`; `academia-motor.js` se regenera con `enabled=true` (cambiar `enabled` en `tools/generar_academia_motor.js`). Publicar.
2. Vigilar 48 horas: errores (error-monitor), `select * from academia_mistake_batches where status='pending'` (debe quedar vacío), sesiones nuevas en `progress_sessions`, pagos. Sin tocar la lógica de pagos.

## 5. Apagado si algo falla (no borra nada)
- Inmediato, en Supabase: `update academia_courses set enabled=false where course_id='to-be';` Se bloquea toda operación nueva (guardado, errores, sesiones, evaluación, prueba) y todo lo aprendido, insignias y progreso se conserva.
- Después, en el código: `CLOUD_ON=false` y publicar. La práctica, Leo AI, pagos y correos no se ven afectados.
- `supabase/rollback/academia_integracion_rollback.sql` BORRA tablas de alumnos: solo en un caso excepcional, con autorización de Leo y un respaldo verificado.
