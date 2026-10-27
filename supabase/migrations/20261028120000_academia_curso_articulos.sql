-- Academia Ingles con Leo: tercer curso, ARTICULOS Y PLURALES (A, AN, THE, sin articulo y plurales).
-- NO APLICADA. Se prepara y se prueba fuera de produccion; Leo debe autorizarla.
-- SOLO agrega una fila (curso APAGADO) a academia_courses. No crea tablas ni funciones, no toca otros cursos ni datos de alumnos.
-- Todo lo demas (progreso, errores, evaluacion, insignias, membresia) ya es multicurso y se reutiliza tal cual.
--   * demo_items vacio: las cuentas gratis NO tienen demostracion de este curso (la demostracion sigue siendo la de TO BE).
--   * El examen oficial y las insignias son solo para miembros (lo exige el servidor, no el navegador).
--   * engine_topic es la etiqueta EXACTA de GRAMMAR_BANK/temas.js ('A / An'): los errores del curso entran al diagnostico de la practica libre.
-- Despues de esta migracion hay que cargar el banco del examen (private/seed-academia-examen-articulos.sql, no esta en git)
-- y, solo cuando Leo lo autorice, encender el curso: update public.academia_courses set enabled = true where course_id = 'articulos';
insert into public.academia_courses (course_id, title, enabled, engine_topic, demo_items)
values ('articulos', 'Artículos y plurales', false, 'A / An', '{}')
on conflict (course_id) do nothing;
