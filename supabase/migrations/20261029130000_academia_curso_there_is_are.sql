-- Academia Ingles con Leo: quinto curso, THERE IS / THERE ARE (there is, there are, there isn't, there aren't, is there, are there).
-- NO APLICADA. El curso nace APAGADO (enabled=false) y NO se enciende sin autorizacion de Leo. Se prepara y se prueba fuera de produccion; Leo debe autorizarla.
-- SOLO agrega una fila (curso APAGADO) a academia_courses. No crea tablas ni funciones, no toca otros cursos ni datos de alumnos.
-- Todo lo demas (progreso, errores, evaluacion, insignias, membresia) ya es multicurso y se reutiliza tal cual.
--   * demo_items vacio: las cuentas gratis NO tienen demostracion de este curso (la demostracion sigue siendo la de TO BE).
--   * El examen oficial y las insignias son solo para miembros (lo exige el servidor, no el navegador).
--   * engine_topic es la etiqueta EXACTA de GRAMMAR_BANK/temas.js ('There is / are (hay)'): los errores del curso entran al diagnostico de la practica libre.
-- Despues de esta migracion hay que cargar el banco del examen (private/seed-academia-examen-there-is-are.sql, no esta en git)
-- y, solo cuando Leo lo autorice, encender el curso: update public.academia_courses set enabled = true where course_id = 'there-is-are';
insert into public.academia_courses (course_id, title, enabled, engine_topic, demo_items)
values ('there-is-are', 'THERE IS / THERE ARE', false, 'There is / are (hay)', '{}')
on conflict (course_id) do nothing;
