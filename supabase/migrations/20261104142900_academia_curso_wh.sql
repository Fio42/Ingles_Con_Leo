-- Academia Ingles con Leo: curso 9, WH-QUESTIONS: What, Where, When, Who, Why, How.
-- NO APLICADA EN PRODUCCION AL ESCRIBIR ESTO. El curso nace APAGADO (enabled=false) y NO se enciende sin autorizacion de Leo.
-- SOLO agrega una fila (curso APAGADO) a academia_courses. No crea tablas ni funciones, no toca otros cursos ni datos de alumnos.
-- Despues hay que cargar el banco del examen (private/seed-academia-examen-wh.sql) y el contenido (private/seed-academia-contenido-wh.sql), no estan en git.
-- Solo cuando Leo lo autorice: update public.academia_courses set enabled = true where course_id = 'wh';
insert into public.academia_courses (course_id, title, enabled, engine_topic, demo_items)
values ('wh', 'WH-QUESTIONS: What, Where, When, Who, Why, How', false, 'Question words (What / Where / When / Who)', '{}')
on conflict (course_id) do nothing;
