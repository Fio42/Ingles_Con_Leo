# Lanzamiento del curso THERE IS / THERE ARE (Curso 5, guía final)

Estado (28-oct-2026): terminado, probado y protegido en la rama `curso/there-is-are-protegido`. NO está publicado, NO se aplicó ningún SQL en producción, NO se subió ningún audio y el curso sigue oculto
(`soon:true` en `academia-data.js`, `open:false` en `tools/generar_academia_motor.js`, y la fila nace con `enabled=false` en la base). Solo para miembros, sin prueba gratis.
Misma arquitectura protegida de los Cursos 3 y 4. TO BE, Pronombres, Artículos y plurales y Posesivos no cambian.

## 0. Qué incluye
- 5 lecciones: There is / There are / There isn't y there aren't (con some y any) / Is there? Are there? (respuestas cortas y How many) / Hay y dónde está (in, on, under, next to, behind, in front of, y el contraste con it is y they are).
- 40 ejercicios (8 por lección, con los 6 tipos), 30 preguntas de práctica (6 por tema), banco privado de 50 preguntas de examen (10 por tema; cada intento saca 15, 3 por tema, aprueba con 80 %).
- 72 audios (voz Kokoro, igual que los otros cursos).
- Cada pregunta trae la pista en español que decide la respuesta (cuántas cosas, si es negativa, qué lugar), para que haya una sola respuesta correcta.

## 1. Cómo queda protegido
- En el sitio público solo viaja el esqueleto (títulos y resúmenes). Lecciones, ejercicios, práctica y mapa de audio salen de Supabase con `academia_get_content`, solo a miembros vigentes y con el curso encendido.
- Los audios van al bucket privado `academia-audio`, carpeta `there-is-are/`, con enlaces de 15 minutos.
- El examen (50 preguntas con respuestas), el progreso, las insignias y los errores son del servidor.
- Nada de esto está en GitHub: `private/` está ignorado y una prueba automática lo comprueba (`tools/tests/academia-there-is-are.test.js`).

## 2. Material privado (no está en Git)
`private/contenido/there-is-are.json`, `private/contenido/there-is-are.audio.json`, `private/audio/there-is-are/` (72 mp3), `private/academia-examen-there-is-are.json`, `private/seed-academia-examen-there-is-are.sql`, `private/seed-academia-contenido-there-is-are.sql`.
Van incluidos en el respaldo cifrado.

## 3. Pasos de producción (solo con tu autorización; cada paso se verifica antes de seguir)
1. Merge de `curso/there-is-are-protegido` a `main` y publicación. El curso sigue oculto: nada cambia a la vista y `#/curso/there-is-are` devuelve al inicio.
2. SQL Editor de producción, en este orden (cada archivo es repetible):
   a. `supabase/migrations/20261029130000_academia_curso_there_is_are.sql` (inserta una fila apagada).
   b. `private/seed-academia-examen-there-is-are.sql` (50 preguntas).
   c. `private/seed-academia-contenido-there-is-are.sql` (contenido).
   Verificación (solo lee): `supabase/verify/academia_there_is_are_verificacion.sql`.
3. Storage > `academia-audio`: subir la carpeta `there-is-are` con los 72 mp3 (como `there-is-are/<nombre>.mp3`). Subir los archivos una sola vez para no crear copias "(1)".
4. Prueba privada con cuentas TUYAS (miembro y gratis): `update public.academia_courses set enabled = true where course_id = 'there-is-are';` y en el navegador `localStorage.setItem('leo_academia_canary','1')`.
5. Abrir para todos (con tu autorización): quitar `soon:true` de `there-is-are` en `route.courses` (`academia-data.js`), poner `open:true` en `tools/generar_academia_motor.js`, regenerar con `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_motor.js` y `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_cursos.js`, subir la versión de los scripts en `academia.html` y `academia-boot.js`, y actualizar la prueba de "curso oculto".
6. Apagado de emergencia, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'there-is-are';`. Nunca correr `supabase/rollback/`.

## 4. Pruebas que se corrieron
- `tools/tests/academia-there-is-are.test.js` (24 pruebas): gramática con oráculos independientes del contenido (there is con uno, there are con varios, a/an, some/any, Is there / Are there, respuestas cortas, lugares), una sola respuesta correcta en cada hueco, en cada frase completa y en cada "escribe", sin duplicados, alcance (sin can ni presente simple), audio de cada frase y duración, botones de audio en tablas, curso oculto, migración, banco de 50, servidor (PGlite).
- `tools/tests/academia-there-is-are-seguridad.test.js` (7 pruebas): permisos y membresía en el servidor, sin respuestas al navegador, SQL de verificación de solo lectura.
- `tools/tests/academia-there-is-are.e2e.js`: recorrido en el navegador (Playwright) a varios anchos de pantalla.
NO probado: teléfono físico, reproducción de audio con una sesión de miembro real en producción, pagos.

## 5. Qué NO cambia
Precios, pagos, límite gratis, la prueba gratis de TO BE, el avance de los otros cursos, el motor adaptativo, el panel del alumno, Leo AI y el SEO.

## 6. Revisión del 30-oct-2026 (antes de pedir autorización)
Sin publicar nada y sin tocar producción. Solo cambió material privado (no está en Git):
- Dos explicaciones en español de la lección 4 quedaron más claras (cuándo se usa any en preguntas y que en el sí no se usa la forma corta there's).
- "coche" pasó a "carro" en el español, como en el resto del sitio. El inglés no cambió.
- Seis actividades traían una pista en español que el audio leía con voz en inglés. Ahora cada una tiene su campo say con la frase en inglés. Los audios pasaron de 77 a 72 (se descartaron 6, se reutilizaron 5 ya existentes y se unió 1 nuevo: There are two cats in the box. They are black.).
- Control: el contenido y el examen que se cargan a Supabase coinciden exactamente con los JSON revisados (50 de 50 preguntas, mapa de 72 audios).
- Huellas SHA-256 de los archivos que se cargan (verifícalas antes de pegar en el editor SQL): `seed-academia-contenido-there-is-are.sql` 1b00aaf5aacda2588a213ae650bbf0bf467c05fa9014de7974dca801e271c05e y `seed-academia-examen-there-is-are.sql` 5c2d148c7db4d2f6a725fcd6d7e48ce43534b93a5b79aebf87cc2412e9c3f7c4.
- Si cambia cualquier texto o audio del curso hay que volver a generar estos archivos y sus huellas. Se usan los de la carpeta privada `_dev` del 30-oct, no los del respaldo del 28-oct.

## 7. Despliegue seguro y reversión (preparado, NO ejecutado)
Orden: Curso 5 primero y Curso 6 después (la rama del 6 contiene la del 5; una prueba de fusión sobre main dio 0 conflictos en el orden 5 y luego 6). Un solo curso por lanzamiento. Entre un paso y otro, esperar a que la verificación dé lo esperado.
1. Antes: respaldo cifrado verificado, anotar los conteos de la sección 3 de `supabase/verify/academia_there_is_are_verificacion.sql` y la huella de los dos SQL.
2. Fusionar la rama a main sin activar nada (curso oculto). Esperar el despliegue de GitHub Pages y comprobar que Inicio, Academia y los cuatro cursos abiertos se ven igual y que `#/curso/there-is-are` devuelve al inicio.
3. SQL en producción, en este orden (todo repetible): migración 20261029130000 (fila apagada), semilla del examen, semilla del contenido. Correr la verificación de solo lectura (`academia_there_is_are_verificacion.sql` y los bloques A, B, C, E, F y G de `academia_there_is_are_prelanzamiento.sql`): 50 preguntas, contenido con 5 lecciones, 40 actividades, 30 de práctica y 72 claves de audio, permisos en false, 0 progreso.
4. Subir los 72 mp3 a Storage `academia-audio/there-is-are/`. Correr el bloque D de `academia_there_is_are_prelanzamiento.sql`: 72 objetos, 0 con paréntesis, 0 faltantes y el bucket con bucket_publico = false.
5. Prueba privada: `update public.academia_courses set enabled = true where course_id = 'there-is-are';` y en el navegador `localStorage.setItem('leo_academia_canary','1')`. Con cuenta de miembro de prueba: 5 lecciones, audios, examen, insignia. Con cuenta gratis: solo temario. Sin sesión: nada. Escuchar al menos 10 audios en el teléfono. Después de aprobar el examen con la cuenta de miembro, correr el bloque H (cambiando el correo): avance, un intento aprobado y una insignia; la cuenta gratis debe dar cero filas.
6. Abrir para todos (commit aparte, igual que `8be0377` del Curso 4): quitar `soon:true` de `there-is-are`, `open:true` en `tools/generar_academia_motor.js`, regenerar motor y cursos, subir la versión de los scripts y adaptar las pruebas de "curso oculto".
7. Verificación después: repetir todos los bloques de `academia_there_is_are_prelanzamiento.sql`, revisar GA4 y `tools/informe_academia_24h.sql` a las 24 horas, y confirmar que TO BE, Pronombres, Artículos y Posesivos conservan sus conteos.
Reversión, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'there-is-are';` (el curso se oculta al instante y el progreso queda guardado). Si además hay que quitarlo de la vista: revertir el commit del paso 6 con `git revert` y subirlo. Nunca correr `supabase/rollback/`.
