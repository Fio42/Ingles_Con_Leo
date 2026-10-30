-- THERE IS / THERE ARE: COMPROBACIONES REALES de solo lectura (solo SELECT). No cambia nada.
-- Se corre en el SQL Editor de Supabase en tres momentos: ANTES de encender (despues de cargar migracion, semillas y audios),
-- DESPUES de encender para tu prueba privada y a las 24 horas del lanzamiento. Cada bloque dice que resultado es el correcto.
-- Para otro curso protegido: reemplazar 'there-is-are' por su id (buscar y reemplazar todo) y ajustar los numeros esperados.

-- A) CURSO: una fila. Antes de encender enabled = false. demo_items = []. engine_topic = 'There is / are (hay)'.
select course_id, enabled, engine_topic, demo_items, exam_size, per_topic, pass_pct
from public.academia_courses where course_id = 'there-is-are';

-- B) EXAMEN: 5 temas con 10 preguntas activas cada uno (total 50). Los demas cursos NO deben cambiar.
select topic, count(*) as preguntas, count(*) filter (where active) as activas
from public.academia_exam_items where course_id = 'there-is-are' group by topic order by topic;
select course_id, count(*) as preguntas from public.academia_exam_items group by course_id order by course_id;   -- to-be 30, los demas 50

-- C) CONTENIDO cargado: lecciones = 5, actividades = 40, practica = 30, claves de audio = 72, actividades con say = 16 (10 de origen y 6 de la correccion de audio del 30-oct).
select c.version,
       jsonb_array_length(c.content->'lessons') as lecciones,
       (select sum(jsonb_array_length(l->'activities')) from jsonb_array_elements(c.content->'lessons') l) as actividades,
       jsonb_array_length(c.content->'practice') as practica,
       (select count(*) from jsonb_object_keys(c.content->'audio')) as claves_audio,
       (select count(*) from jsonb_array_elements(c.content->'lessons') l, jsonb_array_elements(l->'activities') a where a ? 'say') as con_say
from public.academia_content c where c.course_id = 'there-is-are';

-- D) AUDIOS en el almacenamiento: total = 72, ninguno repetido con " (1)", y NINGUN archivo del contenido falta (faltantes = 0).
select count(*) as objetos_there_is_are,
       count(*) filter (where name like '%(%)%') as copias_con_parentesis
from storage.objects where bucket_id = 'academia-audio' and name like 'there-is-are/%' and name not like '%.emptyFolderPlaceholder';
select count(*) as faltantes
from public.academia_content c, jsonb_each_text(c.content->'audio') a
left join storage.objects o on o.bucket_id = 'academia-audio' and o.name = a.value
where c.course_id = 'there-is-are' and o.name is null;
select id, public as bucket_publico from storage.buckets where id = 'academia-audio';                            -- bucket_publico = false
select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'academia_audio%';

-- E) PERMISOS: todo lo de la lista debe dar false, salvo get_content y audio_allowed para authenticated (true).
select has_table_privilege('anon', 'public.academia_exam_items', 'select') as anon_lee_banco,
       has_table_privilege('authenticated', 'public.academia_exam_items', 'select') as logueado_lee_banco,
       has_table_privilege('anon', 'public.academia_content', 'select') as anon_lee_contenido,
       has_table_privilege('authenticated', 'public.academia_content', 'select') as logueado_lee_contenido,
       has_table_privilege('authenticated', 'public.academia_courses', 'update') as logueado_edita_cursos,
       has_table_privilege('authenticated', 'public.academia_badges', 'insert') as logueado_crea_insignias,
       has_function_privilege('anon', 'public.academia_get_content(text)', 'execute') as anon_ejecuta_get_content,
       has_function_privilege('authenticated', 'public.academia_get_content(text)', 'execute') as logueado_ejecuta_get_content;   -- ultimo = true

-- F) PROGRESO, EXAMEN E INSIGNIA del curso. Antes de tu prueba: 0, 0, 0 y 0. Con tu cuenta de prueba aprobando el examen: progreso 1,
-- intentos 1 o mas, insignias 1. Cuentas de alumnos reales: no deben aparecer mientras el curso este apagado.
select (select count(*) from public.academia_progress where course_id = 'there-is-are') as progreso,
       (select count(*) from public.academia_exam_attempts where course_id = 'there-is-are') as intentos,
       (select count(*) from public.academia_badges where course_id = 'there-is-are') as insignias,
       (select count(distinct user_id) from public.academia_progress where course_id = 'there-is-are') as cuentas_con_progreso;

-- G) LOS OTROS CURSOS siguen encendidos y sin cambios (to-be, pronombres, articulos y posesivos: enabled = true).
select course_id, enabled from public.academia_courses order by course_id;

-- H) TU CUENTA DE PRUEBA (reemplaza el correo). Despues de estudiar y aprobar el examen debe verse: avance de 5 lecciones, un intento
-- calificado y UNA insignia. Una cuenta gratis de prueba debe devolver cero filas en las tres consultas.
select u.email, p.state->'lessons' is not null as tiene_avance, p.version, p.updated_at
from auth.users u join public.academia_progress p on p.user_id = u.id
where p.course_id = 'there-is-are' and u.email = 'TU-CORREO-DE-PRUEBA@ejemplo.com';
select u.email, a.started_at, a.submitted_at, a.score_pct, a.passed
from auth.users u join public.academia_exam_attempts a on a.user_id = u.id
where a.course_id = 'there-is-are' and u.email = 'TU-CORREO-DE-PRUEBA@ejemplo.com' order by a.started_at;
select u.email, b.awarded_at, b.score_pct
from auth.users u join public.academia_badges b on b.user_id = u.id
where b.course_id = 'there-is-are' and u.email = 'TU-CORREO-DE-PRUEBA@ejemplo.com';
