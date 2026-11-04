-- Academia Ingles con Leo: curso 11, IN / ON / AT: lugar y tiempo.
-- NO APLICADA EN PRODUCCION AL ESCRIBIR ESTO. El curso nace APAGADO (enabled=false) y NO se enciende sin autorizacion de Leo.
-- SOLO agrega una fila (curso APAGADO) a academia_courses. No crea tablas ni funciones, no toca otros cursos ni datos de alumnos.
-- Despues hay que cargar el banco del examen (private/seed-academia-examen-in-on-at.sql) y el contenido (private/seed-academia-contenido-in-on-at.sql), no estan en git.
-- Solo cuando Leo lo autorice: update public.academia_courses set enabled = true where course_id = 'in-on-at';
insert into public.academia_courses (course_id, title, enabled, engine_topic, demo_items)
values ('in-on-at', 'IN / ON / AT: lugar y tiempo', false, 'In / On / At', '{}')
on conflict (course_id) do nothing;
