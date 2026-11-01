-- Academia Ingles con Leo: septimo curso, PRESENTE SIMPLE (rutinas, verbo sin cambios, la s de he / she / it, reglas s / es / ies, frecuencia).
-- NO APLICADA EN PRODUCCION AL ESCRIBIR ESTO. El curso nace APAGADO (enabled=false) y NO se enciende sin autorizacion de Leo.
-- SOLO agrega una fila (curso APAGADO) a academia_courses. No crea tablas ni funciones, no toca otros cursos ni datos de alumnos.
-- Todo lo demas (progreso, errores, evaluacion, insignias, membresia) ya es multicurso y se reutiliza tal cual.
--   * demo_items vacio: las cuentas gratis NO tienen demostracion de este curso (la demostracion sigue siendo la de TO BE).
--   * El examen oficial y las insignias son solo para miembros (lo exige el servidor, no el navegador).
--   * engine_topic es la etiqueta EXACTA de GRAMMAR_BANK/temas.js ('Presente simple: la -s de he / she / it'): los errores del curso entran al diagnostico de la practica libre.
-- Despues de esta migracion hay que cargar el banco del examen (private/seed-academia-examen-presente-simple.sql, no esta en git)
-- y el contenido (private/seed-academia-contenido-presente-simple.sql, no esta en git). Solo cuando Leo lo autorice, encender el curso:
--   update public.academia_courses set enabled = true where course_id = 'presente-simple';
insert into public.academia_courses (course_id, title, enabled, engine_topic, demo_items)
values ('presente-simple', 'Presente simple', false, 'Presente simple: la -s de he / she / it', '{}')
on conflict (course_id) do nothing;
