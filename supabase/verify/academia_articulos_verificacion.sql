-- Artículos y plurales: VERIFICACIÓN de solo lectura (solo SELECT). Se puede correr en cualquier momento, antes o después de cada paso.
-- Resultado esperado en cada paso: ver docs/lanzamiento-articulos-y-plurales.md

-- 1) La fila del curso: antes de encender enabled = false; demo_items debe ser siempre []; engine_topic = 'A / An'.
select course_id, enabled, engine_topic, demo_items, exam_size, per_topic, pass_pct
from public.academia_courses
where course_id in ('articulos', 'pronombres', 'to-be')
order by course_id;

-- 2) El banco privado: 5 filas (aan, general, irregulares, plurales, the) con 10 preguntas cada una; total 50, todas activas.
select topic, count(*) as preguntas, count(*) filter (where active) as activas
from public.academia_exam_items
where course_id = 'articulos'
group by topic
order by topic;
select count(*) as total_articulos from public.academia_exam_items where course_id = 'articulos';

-- 3) Los bancos de TO BE y Pronombres no cambian con este lanzamiento (anota los números antes y compáralos después).
select course_id, count(*) as preguntas from public.academia_exam_items group by course_id order by course_id;

-- 4) Permisos: el navegador NO puede leer el banco ni tocar tablas del curso. Los cuatro valores deben ser false.
select has_table_privilege('anon', 'public.academia_exam_items', 'select') as anon_lee_banco,
       has_table_privilege('authenticated', 'public.academia_exam_items', 'select') as logueado_lee_banco,
       has_table_privilege('authenticated', 'public.academia_courses', 'update') as logueado_edita_cursos,
       has_table_privilege('authenticated', 'public.academia_badges', 'insert') as logueado_crea_insignias;

-- 5) Nada del curso en las cuentas antes de encenderlo (debe dar 0 y 0 mientras enabled = false).
select (select count(*) from public.academia_progress where course_id = 'articulos') as progreso_articulos,
       (select count(*) from public.academia_exam_attempts where course_id = 'articulos') as intentos_articulos;
