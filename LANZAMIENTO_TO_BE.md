# Lanzamiento controlado de TO BE (academia + presentación comercial)

## Dos interruptores, un solo comportamiento
- `academia-lanzamiento.js` (`PUBLIC`): lo que ve el público. En `false` el sitio no anuncia la academia (portada, miembros, navegación, bienvenida, avisos de práctica, artículo de TO BE). El antiguo Modo aprender sigue funcionando y se oculta solo al encender.
- `academia-boot.js` (`CLOUD_ON`) + `ACADEMIA_MOTOR.enabled` + `academia_courses.enabled`: la parte en la nube.
- Cuenta de prueba: `localStorage.setItem('leo_academia_canary','1')` en su navegador activa AMBAS cosas solo para ella, en el dominio real. Se quita con `removeItem`.
- Al encender para todos, `PUBLIC=true` y `CLOUD_ON=true` van en el mismo commit.
- Verificaciones de solo lectura en Supabase real: `supabase/verify/academia_verificacion.sql`.

Nada de esto está ejecutado. Cada paso lo autoriza Leo. Precio en toda la academia: **$2 USD al mes**.

## 0. Antes de tocar nada (solo lectura)
Estado comprobado el 2026-10-25 (solo lectura, desde el navegador de Claude):
- Supabase (InglesconLeo): el panel Database > Backups dice "Free Plan does not include project backups". NO hay respaldo recuperable automático.
- Stripe: la sesión abierta es la cuenta "Spanish by Leo" (producto "Spanish by Leo Membership", 2 precios), no una cuenta de Inglés con Leo. Falta ver la cuenta que usa inglesconleo.com.
- PayPal: sin sesión iniciada; no se pudo ver el plan.

1. Supabase, Project Settings, Database, Backups: confirmar que hay un respaldo de hoy (o crear uno con "Create backup" si el plan lo permite) y anotar su hora. Sin respaldo verificado no se sigue.
2. SQL Editor (solo SELECT): `select count(*) from profiles; select count(*) from progress_sessions; select count(*) from mistake_stats;` Guardar los 3 números.
3. Precio: abrir en Stripe el producto/precio de `STRIPE_PRICE_ID` (y el anual), en PayPal el plan `PAYPAL_PLAN_ID`, y confirmar $2/mes y $20/año. Mercado Pago cobra 40 MXN fijos (`create-checkout.ts`). Claude no puede ver esos paneles.

## 0b. Respaldo (obligatorio, antes de la migración)
Supabase Free no trae respaldos. Desde un computador con Docker (o PostgreSQL 17): en Supabase > Connect copia la URL "Session pooler" (lleva la contraseña de la base; si no la recuerdas, Database > Settings > Reset password) y corre
`SUPABASE_DB_URL='<url>' bash tools/respaldo_supabase.sh`
Genera esquema + datos fuera del repositorio (`~/respaldos-supabase/`), lo restaura en una base temporal y compara conteos. Solo si termina con "RESPALDO VERIFICADO" se sigue. El script no guarda ni imprime la contraseña ni los datos.

## 1. Migración (con la academia APAGADA)
1. SQL Editor: pegar `supabase/migrations/20261026120000_academia_integracion.sql` y ejecutar. Tiene comprobación previa: si falta algo, se detiene sin crear nada. Solo crea objetos `academia_*`; no modifica datos ni tablas existentes. Deja `enabled=false`.
2. Cargar el banco: pegar `private/seed-academia-examen-to-be.sql` (archivo local, NO está en git) y ejecutar. Verificar: `select count(*) from academia_exam_items;` (30).
3. Permisos (solo SELECT, deben salir 0 filas):
   `select routine_name from information_schema.routine_privileges where grantee='anon' and routine_name like 'academia%';`
   `select table_name, privilege_type from information_schema.table_privileges where grantee in ('anon','authenticated') and table_name in ('academia_exam_items','academia_mistake_batches');`
4. Repetir los 3 conteos del paso 0.2: deben ser iguales.

## 2. Código con la academia apagada
Antes: `node tools/prelanzamiento.js --off` (debe decir "Todo en orden"; revisa interruptores, que el banco de examen no esté en git y que ningún workflow aplique migraciones).
Merge de `academia/piloto-to-be` a main (lo autoriza Leo). `CLOUD_ON=false` y `ACADEMIA_MOTOR.enabled=false`: el sitio se ve igual que hoy.

## 3. Prueba previa con cuentas de prueba (nadie más la ve)
1. SQL: `update academia_courses set enabled=true where course_id='to-be';` Los visitantes siguen sin cargar la parte en la nube (CLOUD_ON=false).
2. En el navegador de la cuenta de prueba, consola: `localStorage.setItem('leo_academia_canary','1')` y abrir la portada (se ve la versión de lanzamiento completa) y academia.html. Recorrido: portada, Explorar la academia, crear cuenta, demostración, invitación, `miembros.html?pagar=1` (sin pagar), y con una cuenta miembro el curso completo. Pago real de prueba solo con tu autorización.
3. Con una cuenta GRATIS: ve la presentación, hace la prueba UNA vez, ve la invitación; recargar y repetir no deja; las rutas de lecciones/evaluación muestran la presentación.
4. Con una cuenta MIEMBRO: lección completa, error que aparece en Progreso, evaluación y una sola insignia, y en Supabase `profiles.last_practice_at` actualizado.
5. Si algo falla: apagar (sección 5).

## 4. Activación para todos
1. `academia-lanzamiento.js`: `PUBLIC=true` y `academia-boot.js`: `CLOUD_ON=true`; `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_motor.js` regenera `academia-motor.js` con `enabled=true`. Comprobar con `node tools/prelanzamiento.js --on`. Publicar.
2. Vigilar 48 horas: errores (error-monitor), `select * from academia_mistake_batches where status='pending'` (debe quedar vacío), sesiones nuevas en `progress_sessions`, pagos. Sin tocar la lógica de pagos.

## 5. Apagado si algo falla (no borra nada)
- Inmediato, en Supabase: `update academia_courses set enabled=false where course_id='to-be';` Se bloquea toda operación nueva (guardado, errores, sesiones, evaluación, prueba) y todo lo aprendido, insignias y progreso se conserva.
- Después, en el código: `CLOUD_ON=false` y publicar. La práctica, Leo AI, pagos y correos no se ven afectados.
- `supabase/rollback/academia_integracion_rollback.sql` BORRA tablas de alumnos: solo en un caso excepcional, con autorización de Leo y un respaldo verificado.

## Estado de ejecución (2026-10-26)
- Respaldo completo (esquema + datos, 19 tablas + auth) descargado a la computadora de Leo, fuera del repo; conteos verificados contra la base y prueba de restauración sin fallas.
- Migración de la academia aplicada en Supabase real; banco de examen (30 preguntas) cargado; curso `to-be` con enabled=false.
- Verificación: RLS activo, sin escrituras directas, conteos de profiles/sesiones/errores intactos (129/377/297). Única nota: `academia_norm` (función pura de texto) es ejecutable por anon; sin riesgo.
- Código publicado en main con todos los interruptores apagados (comprobado en el dominio real).
- Pendiente: prueba privada con la señal canary y cuentas de prueba (requiere iniciar sesión), luego activación pública.

## Lanzamiento publico (2026-10-26)
- Interruptores en true: PUBLIC, CLOUD_ON, ACADEMIA_MOTOR.enabled, y academia_courses.enabled (Supabase).
- Pruebas en el dominio real con cuentas de Leo: gratis (demo una vez, 3 de 6 del limite, premium bloqueado), miembro (5 lecciones, progreso en la nube que vuelve al borrar el navegador, error registrado una vez, evaluacion 15/15, una insignia, escrituras directas 403), audios 4/4, movil 390 px sin desbordes.
- APAGADO DE EMERGENCIA (rapido, sin tocar datos): en Supabase SQL Editor `update public.academia_courses set enabled=false where course_id='to-be';` y, si hace falta ocultar tambien la presentacion, revertir el commit de lanzamiento. NO usar supabase/rollback/ (destructivo).
- Siguiente respaldo: incluir las tablas academia_* (ya con datos de alumnos).
