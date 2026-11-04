-- Academia Ingles con Leo: curso 10, Presente continuo: lo que pasa ahora.
-- NO APLICADA EN PRODUCCION AL ESCRIBIR ESTO. El curso nace APAGADO (enabled=false) y NO se enciende sin autorizacion de Leo.
-- SOLO agrega una fila (curso APAGADO) a academia_courses. No crea tablas ni funciones, no toca otros cursos ni datos de alumnos.
-- Despues hay que cargar el banco del examen (private/seed-academia-examen-presente-continuo.sql) y el contenido (private/seed-academia-contenido-presente-continuo.sql), no estan en git.
-- Solo cuando Leo lo autorice: update public.academia_courses set enabled = true where course_id = 'presente-continuo';
insert into public.academia_courses (course_id, title, enabled, engine_topic, demo_items)
values ('presente-continuo', 'Presente continuo: lo que pasa ahora', false, 'Presente continuo (I am ___ing)', '{}')
on conflict (course_id) do nothing;
