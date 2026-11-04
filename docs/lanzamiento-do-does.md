# Lanzamiento del curso DO / DOES: preguntas y negaciones (Curso 8, guía final)

Estado (4-nov-2026): terminado y probado, CERRADO. No está abierto para nadie: `soon:true` en `academia-data.js` (ruta), `open:false` en `tools/generar_academia_motor.js` y la fila de la base tiene `enabled=false`. Solo para miembros, sin prueba gratis. Misma arquitectura protegida de los Cursos 3 a 7. Los otros siete cursos no cambian.

## 0. Qué incluye
- 5 lecciones: Qué son do y does / Preguntas con do / Preguntas con does / Don't y doesn't / Repaso y situaciones reales.
- 40 ejercicios (8 por lección), 30 preguntas de práctica (6 por tema), banco privado de 50 preguntas de examen (10 por tema; cada intento saca 15, 3 por tema, aprueba con 80 %).
- 145 audios en inglés (voz Kokoro). Las frases incorrectas (columna Incorrecto y comparaciones) NO tienen audio.
- Enseña solo estructuras correctas (Does she work, nunca Does she works). Sin preguntas con wh- (eso queda fuera del curso).
- El título del curso es "DO / DOES: preguntas y negaciones"; la tarjeta de la ruta sigue diciendo "DO / DOES" (no se cambió).

## 1. Estado en producción (4-nov-2026, con tu autorización, todo APAGADO)
- Fila en `academia_courses`: `do-does`, enabled=false, engine_topic "Do / Does". Hecho.
- Banco del examen: 50 preguntas (5 temas x 10) en `academia_exam_items`. Hecho y verificado.
- Contenido de lecciones y práctica en `academia_content`, con el mapa de 145 audios. Hecho y verificado (huella de textos igual a la local).
- PENDIENTE: subir los 145 mp3 a Storage > `academia-audio` (ver paso 3). Sin eso, al abrir el curso los botones de audio no funcionarían.

## 2. Material privado (no está en Git)
En `C:\ICL-Privado`: `contenido\do-does.json`, `contenido\do-does.audio.json`, `audio\do-does\` (145 mp3), `academia-examen-do-does.json`, `seed-academia-examen-do-does.sql`, `seed-academia-contenido-do-does.sql`, y la autoría en `autor\do_a.py`, `do_b.py`, `do_meta.json`. Copia de trabajo en `private\` del repositorio (ignorada por git). Incluir en el próximo respaldo cifrado.
Huellas SHA-256 (archivos locales): contenido `87a7575cda42d7fe3e04ece461e3b7792719ac2d5c2967b2b785d1266a27afd1`, examen `b1ad82d7617538a737467568d3ce19d2bc365cbba99496917a5456b1c977efeb`.

## 3. Pasos que faltan para publicar
1. Publicar el código (seguro: el curso sigue oculto): `academia-data.js`, `academia-motor.js`, `academia-cursos.js`, `academia.js`, `academia-boot.js`, `academia.html`, `miembros.html`, `progreso.html`, pruebas, migración, verificación y docs.
2. Storage > `academia-audio`: subir la carpeta `do-does` con los 145 mp3 (como `do-does/<nombre>.mp3`), una sola vez para no crear copias "(1)".
3. Verificación de solo lectura: `supabase/verify/academia_do_does_verificacion.sql`.
4. Prueba privada con cuentas TUYAS (miembro y gratis): `update public.academia_courses set enabled = true where course_id = 'do-does';` y en el navegador `localStorage.setItem('leo_academia_canary','1')`.
5. Abrir para todos (con tu autorización): quitar `soon:true` de `do-does` en `route.courses` (`academia-data.js`), poner `open:true` en `tools/generar_academia_motor.js`, regenerar con `node tools/generar_academia_motor.js` y `node tools/generar_academia_cursos.js`, subir las versiones `?v=` y publicar. Ojo: al abrirlo, `tools/tests/academia-integracion.test.js` y `academia-presente-simple.test.js` asumen que do-does sigue cerrado; actualizar esas dos líneas.
6. Apagado de emergencia, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'do-does';`. Nunca correr `supabase/rollback/`.

## 4. Pruebas que se corrieron (4-nov-2026)
- `tools/tests/academia-do-does.test.js` (14): estructura, ids, estilo, gramática con oráculos independientes (do / does / don't / doesn't / respuestas cortas / verbo sin s), una sola respuesta correcta en cada pregunta, respuestas cortas coherentes con la pregunta, sin frases repetidas, audio solo en inglés y sin frases incorrectas, archivos mp3, curso oculto y SQL seguro.
- `tools/tests/academia-do-does-seguridad.test.js` (7, PGlite): permisos y membresía en el servidor, sin respuestas al navegador.
- `tools/tests/academia-do-does.e2e.js` (14, Playwright, PGlite como servidor, sin tocar Supabase real): oculto sin canario, 5 lecciones con progreso, errores al motor, examen, insignia, anchos 320 a 1440 sin desborde, audio (cada botón pide su mp3), cuenta gratis, TO BE intacto y apagado del curso.
- Siguen en verde las pruebas academia-integracion, modelo, piloto, pronombres, proteccion, robustez, sql, presente-simple (y su seguridad), ruta-base, micros y data-quality. Algunas pruebas de cursos anteriores (articulos, can, posesivos, there-is-are) se omiten o fallan en esta copia de trabajo por falta de sus archivos privados, no por este curso.
NO probado: teléfono físico, escuchar las voces a oído, reproducción con un miembro real en producción, pagos.

## 5. Qué NO cambia
Precios, pagos, límite gratis, la prueba gratis de TO BE, el avance de los otros cursos, el motor adaptativo, el panel del alumno, Leo AI y el SEO. Cambios en código compartido: `do-does` en la lista de cursos de `academia.js` y una entrada cerrada en el puente.
