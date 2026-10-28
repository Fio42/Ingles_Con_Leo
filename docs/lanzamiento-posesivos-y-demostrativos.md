# Lanzamiento del curso POSESIVOS Y DEMOSTRATIVOS (Curso 4, guía final)

Estado (28-oct-2026): terminado, probado y protegido en la rama `curso/posesivos-protegido`. NO está publicado, NO se aplicó ningún SQL en producción, NO se subió ningún audio y el curso sigue oculto
(`soon:true` en `academia-data.js`, `open:false` en `tools/generar_academia_motor.js`, y la fila nace con `enabled=false` en la base). Solo para miembros, sin prueba gratis.
Misma arquitectura protegida del Curso 3. TO BE, Pronombres y Artículos y plurales no cambian.

## 0. Qué incluye
- 5 lecciones: My, your, his, her / Its, our, their (its y it's) / This y that / These y those / Posesivos y demostrativos juntos (con un aviso sobre my y mine, que no se pregunta).
- 40 ejercicios (8 por lección, con los 6 tipos), 30 preguntas de práctica (6 por tema), banco privado de 50 preguntas de examen (10 por tema; cada intento saca 15, 3 por tema, aprueba con 80 %).
- 98 audios (voz Kokoro, igual que el Curso 3).
- Cada pregunta con dueño (his/her/their...) trae su pista en español o un nombre propio, para que haya una sola respuesta correcta.

## 1. Cómo queda protegido
- En el sitio público solo viaja el esqueleto (títulos y resúmenes). Lecciones, ejercicios, práctica y mapa de audio salen de Supabase con `academia_get_content`, solo a miembros vigentes y con el curso encendido.
- Los 98 audios van al bucket privado `academia-audio`, carpeta `posesivos/`, con enlaces de 15 minutos.
- El examen (50 preguntas con respuestas), el progreso, las insignias y los errores son del servidor.
- Nada de esto está en GitHub: `private/` está ignorado y una prueba automática lo comprueba (`tools/tests/academia-posesivos.test.js`).

## 2. Material privado (no está en Git)
`private/contenido/posesivos.json`, `private/contenido/posesivos.audio.json`, `private/audio/posesivos/` (98 mp3), `private/academia-examen-posesivos.json`, `private/seed-academia-examen-posesivos.sql`, `private/seed-academia-contenido-posesivos.sql`.
Pendiente: incluir estos archivos en el respaldo cifrado (el respaldo actual solo tiene los Cursos 1 a 3).

## 3. Pasos de producción (solo con tu autorización; cada paso se verifica antes de seguir)
1. Merge de `curso/posesivos-protegido` a `main` y publicación. El curso sigue oculto: Inicio, Academia, Practicar y Mi progreso se ven igual y `#/curso/posesivos` devuelve al inicio.
2. SQL Editor de producción, en este orden (cada archivo es repetible):
   a. `supabase/migrations/20261029120000_academia_curso_posesivos.sql` (inserta una fila apagada).
   b. `private/seed-academia-examen-posesivos.sql` (50 preguntas).
   c. `private/seed-academia-contenido-posesivos.sql` (contenido).
   Verificación (solo lee): `supabase/verify/academia_posesivos_verificacion.sql`.
   No hace falta repetir la migración `20261028180000` (ya está aplicada con el Curso 3).
3. Storage > `academia-audio`: subir la carpeta `posesivos` con los 98 mp3 (como `posesivos/<nombre>.mp3`). Verificación: los objetos de la carpeta `posesivos/` deben ser 98.
4. Prueba privada con cuentas TUYAS (miembro y gratis): `update public.academia_courses set enabled = true where course_id = 'posesivos';` y en el navegador `localStorage.setItem('leo_academia_canary','1')`.
5. Abrir para todos (con tu autorización): quitar `soon:true` de `posesivos` en `route.courses` (`academia-data.js`), poner `open:true` en `tools/generar_academia_motor.js`, regenerar con `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_motor.js` y `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_cursos.js`, subir la versión de los scripts en `academia.html` y `academia-boot.js`, y adaptar `tools/tests/academia-posesivos.test.js` y `.e2e.js` al estado publicado (como se hizo con el Curso 3).
6. Apagado de emergencia, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'posesivos';`. Nunca correr `supabase/rollback/`.

## 4. Pruebas que se corrieron
Gramática (oráculos independientes del contenido: this/that con is, these/those con are, its frente a it's, dueño his/her/their/our, distancia cerca/lejos, frases completas con una sola opción válida), una sola respuesta correcta, sin duplicados, audio de cada frase y duración, botones de audio en todas las filas de las tablas, curso oculto, permisos y membresía en el servidor (PGlite), examen e insignia, navegador en 320/360/390/430/768/1440 px, regresión de TO BE, Pronombres y Artículos.
NO probado: teléfono físico, reproducción de audio con una sesión de miembro real en producción, pagos.

## 5. Qué NO cambia
Precios, pagos, límite gratis, la prueba gratis de TO BE, el avance de los otros cursos, el motor adaptativo, el panel del alumno, Leo AI y el SEO.
