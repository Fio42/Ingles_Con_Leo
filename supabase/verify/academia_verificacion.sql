-- VERIFICACION de la academia en Supabase REAL. Solo SELECT: no escribe nada. Ejecutar por partes en el SQL Editor.
-- A) ANTES de la migracion: guardar estos numeros (deben ser iguales despues).
select (select count(*) from public.profiles) profiles, (select count(*) from public.progress_sessions) sesiones,
       (select count(*) from public.mistake_stats) errores, (select count(*) from public.profiles where is_member) miembros;

-- B) DESPUES de la migracion (curso aun apagado): debe devolver 1 fila, enabled=false, demo_items {d1,d2,d3}.
select course_id, enabled, demo_items, pass_pct, exam_size from public.academia_courses;
-- Banco cargado: debe ser 30 (o el numero del archivo de semilla).
select count(*) bancos, count(distinct topic) temas from public.academia_exam_items;

-- C) Permisos. Cada consulta debe devolver 0 filas.
select routine_name, grantee from information_schema.routine_privileges
 where routine_schema='public' and routine_name like 'academia%' and grantee in ('anon','public');
select table_name, grantee, privilege_type from information_schema.table_privileges
 where table_schema='public' and table_name in ('academia_exam_items','academia_mistake_batches') and grantee in ('anon','authenticated');
select table_name, grantee, privilege_type from information_schema.table_privileges
 where table_schema='public' and table_name in ('academia_courses','academia_progress','academia_badges','academia_exam_attempts')
   and grantee in ('anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE');
-- RLS activo en todas (todas deben decir true):
select relname, relrowsecurity from pg_class where relname like 'academia%' and relkind='r';

-- D) Funciones internas no expuestas (0 filas):
select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('academia_apply_batch','academia_is_member','academia_free_count','academia_free_daily_limit','academia_today','academia_item_public')
   and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'));

-- E) Los datos existentes no cambiaron: repetir A.
-- F) Con las cuentas de prueba (despues de la prueba previa): una insignia por cuenta como maximo y sin lotes pendientes.
select user_id, count(*) from public.academia_badges group by 1 having count(*) > 1;
select count(*) pendientes from public.academia_mistake_batches where status = 'pending';

-- G) Curso PRONOMBRES (despues de su migracion y de cargar su banco, aun apagado):
-- 1 fila, enabled=false, demo_items vacio. Banco: 50 preguntas en 5 temas (10 por tema).
select course_id, enabled, demo_items, pass_pct, engine_topic from public.academia_courses where course_id = 'pronombres';
select topic, count(*) from public.academia_exam_items where course_id = 'pronombres' group by 1 order by 1;
-- TO BE no cambio: sigue con su banco y sus datos.
select course_id, count(*) from public.academia_exam_items group by 1;
