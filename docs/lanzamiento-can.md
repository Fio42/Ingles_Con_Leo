# Lanzamiento del curso CAN / CAN'T (Curso 6, guía final)

Estado (28-oct-2026): terminado, probado y protegido en la rama `curso/can-protegido`. NO está publicado, NO se aplicó ningún SQL en producción, NO se subió ningún audio y el curso sigue oculto
(`soon:true` en `academia-data.js`, `open:false` en `tools/generar_academia_motor.js`, y la fila nace con `enabled=false` en la base). Solo para miembros, sin prueba gratis.
Misma arquitectura protegida de los Cursos 3, 4 y 5. TO BE, Pronombres, Artículos y plurales y Posesivos y There is / There are no cambian.

## 0. Qué incluye
- 5 lecciones: Can (puedo, sé) / Can't y errores frecuentes / Can en preguntas y respuestas cortas / Can para pedir permiso (habilidad frente a permiso) / Todo con can (repaso, con but).
- 40 ejercicios (8 por lección, con los 6 tipos), 30 preguntas de práctica (6 por tema), banco privado de 50 preguntas de examen (10 por tema; cada intento saca 15, 3 por tema, aprueba con 80 %).
- 70 audios (voz Kokoro, igual que los otros cursos).
- Cada pregunta trae la pista en español que decide la respuesta (sí o no, pregunta o frase, a quién se contesta), para que haya una sola respuesta correcta.

## 1. Cómo queda protegido
- En el sitio público solo viaja el esqueleto (títulos y resúmenes). Lecciones, ejercicios, práctica y mapa de audio salen de Supabase con `academia_get_content`, solo a miembros vigentes y con el curso encendido.
- Los audios van al bucket privado `academia-audio`, carpeta `can/`, con enlaces de 15 minutos.
- El examen (50 preguntas con respuestas), el progreso, las insignias y los errores son del servidor.
- Nada de esto está en GitHub: `private/` está ignorado y una prueba automática lo comprueba (`tools/tests/academia-can.test.js`).

## 2. Material privado (no está en Git)
`private/contenido/can.json`, `private/contenido/can.audio.json`, `private/audio/can/` (70 mp3), `private/academia-examen-can.json`, `private/seed-academia-examen-can.sql`, `private/seed-academia-contenido-can.sql`.
Van incluidos en el respaldo cifrado.

## 3. Pasos de producción (solo con tu autorización; cada paso se verifica antes de seguir)
1. Merge de `curso/can-protegido` a `main` y publicación. El curso sigue oculto: nada cambia a la vista y `#/curso/can` devuelve al inicio.
2. SQL Editor de producción, en este orden (cada archivo es repetible):
   a. `supabase/migrations/20261029130000_academia_curso_can.sql` (inserta una fila apagada).
   b. `private/seed-academia-examen-can.sql` (50 preguntas).
   c. `private/seed-academia-contenido-can.sql` (contenido).
   Verificación (solo lee): `supabase/verify/academia_can_verificacion.sql`.
3. Storage > `academia-audio`: subir la carpeta `can` con los 70 mp3 (como `can/<nombre>.mp3`). Subir los archivos una sola vez para no crear copias "(1)".
4. Prueba privada con cuentas TUYAS (miembro y gratis): `update public.academia_courses set enabled = true where course_id = 'can';` y en el navegador `localStorage.setItem('leo_academia_canary','1')`.
5. Abrir para todos (con tu autorización): quitar `soon:true` de `can` en `route.courses` (`academia-data.js`), poner `open:true` en `tools/generar_academia_motor.js`, regenerar con `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_motor.js` y `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_cursos.js`, subir la versión de los scripts en `academia.html` y `academia-boot.js`, y actualizar la prueba de "curso oculto".
6. Apagado de emergencia, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'can';`. Nunca correr `supabase/rollback/`.

## 4. Pruebas que se corrieron
- `tools/tests/academia-can.test.js` (24 pruebas): gramática con oráculos independientes del contenido (quién + can / can't + verbo sin cambios, Can al principio en preguntas, respuestas cortas por persona, sí o no según la pista, well y no good), una sola respuesta correcta en cada hueco, en cada frase completa y en cada "escribe", sin duplicados, alcance (sin there is/are, do/does ni presente simple), audio de cada frase y duración, botones de audio en tablas, curso oculto, migración, banco de 50, servidor (PGlite).
- `tools/tests/academia-can-seguridad.test.js` (7 pruebas): permisos y membresía en el servidor, sin respuestas al navegador, SQL de verificación de solo lectura.
- `tools/tests/academia-can.e2e.js`: recorrido en el navegador (Playwright) a varios anchos de pantalla.
NO probado: teléfono físico, reproducción de audio con una sesión de miembro real en producción, pagos.

## 5. Qué NO cambia
Precios, pagos, límite gratis, la prueba gratis de TO BE, el avance de los otros cursos, el motor adaptativo, el panel del alumno, Leo AI y el SEO.
