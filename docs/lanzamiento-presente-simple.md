# Lanzamiento del curso PRESENTE SIMPLE (Curso 7, guía final)

Estado (1-nov-2026): terminado y probado, CERRADO. No está abierto para nadie: `soon:true` en `academia-data.js` (ruta), `open:false` en `tools/generar_academia_motor.js` y la fila nace con `enabled=false` en la base. Solo para miembros, sin prueba gratis. Misma arquitectura protegida de los Cursos 3 a 6. Los otros seis cursos no cambian.

## 0. Qué incluye
- 5 lecciones: Presente simple: lo que haces siempre / I, you, we y they / He, she, it: la s / Reglas de s, es e ies / Frecuencia y repaso.
- 40 ejercicios (8 por lección, con los 6 tipos), 30 preguntas de práctica (6 por tema), banco privado de 50 preguntas de examen (10 por tema; cada intento saca 15, 3 por tema, aprueba con 80 %).
- 116 audios en inglés (voz Kokoro, igual que los otros cursos). Todas las tablas, ejemplos y palabras en inglés tienen su botón.
- No incluye preguntas ni negativas con do / does: eso es del Curso 8.
- Cada pregunta trae la pista en español que decide la respuesta, para que haya una sola respuesta correcta.

## 1. Material privado (no está en Git)
En `C:\ICL-Privado`: `contenido\presente-simple.json`, `contenido\presente-simple.audio.json`, `audio\presente-simple\` (116 mp3), `academia-examen-presente-simple.json`, `seed-academia-examen-presente-simple.sql`, `seed-academia-contenido-presente-simple.sql`, y la autoría en `autor\presente_a.py`, `presente_b.py`, `presente_meta.json`. Una copia de trabajo vive en `private\` del repositorio (ignorada por git). Incluir en el próximo respaldo cifrado.
Huellas SHA-256: contenido `9ef2668b8c7f65cf9dab06a1870e9acfc3bd1e01dac8e8558e10583f29ae28ce`, examen `38ad738c4b3a035acac50023c2c8d823cd5dd456ae52e03aa9ee110b7ffa8fce`.

## 2. Pasos de producción (cada paso se verifica antes de seguir)
1. Publicar el código (ya es seguro: el curso sigue oculto): `academia-data.js` (esqueleto), `academia-motor.js`, `academia-cursos.js`, `academia.js` (lista de cursos), `academia-boot.js` y `academia.html` (versiones).
2. SQL Editor de producción, en este orden (cada archivo es repetible): `supabase/migrations/20261101200000_academia_curso_presente_simple.sql` (fila apagada), `seed-academia-examen-presente-simple.sql` (50 preguntas), `seed-academia-contenido-presente-simple.sql` (contenido). Verificación (solo lee): `supabase/verify/academia_presente_simple_verificacion.sql`.
3. Storage > `academia-audio`: subir la carpeta `presente-simple` con los 116 mp3 (como `presente-simple/<nombre>.mp3`), una sola vez para no crear copias "(1)".
4. Prueba privada con cuentas TUYAS (miembro y gratis): `update public.academia_courses set enabled = true where course_id = 'presente-simple';` y en el navegador `localStorage.setItem('leo_academia_canary','1')`.
5. Abrir para todos (con tu autorización): quitar `soon:true` de `presente-simple` en `route.courses` (`academia-data.js`), poner `open:true` en `tools/generar_academia_motor.js`, regenerar con `node tools/generar_academia_motor.js` y `node tools/generar_academia_cursos.js`, subir las versiones `?v=` y publicar.
6. Apagado de emergencia, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'presente-simple';`. Nunca correr `supabase/rollback/`.

## 3. Pruebas que se corrieron (1-nov-2026)
- `tools/tests/academia-presente-simple.test.js` (11): estructura, ids, sin rayas largas ni do/does, gramática con oráculos independientes (sujeto + verbo con s, es, ies, has; palabra de frecuencia antes del verbo), una sola respuesta correcta en cada pregunta, errores y órdenes sin ambigüedad, audio solo en inglés y con botón en cada ejemplo y celda de tabla, archivos mp3, curso oculto y SQL seguro.
- `tools/tests/academia-presente-simple-seguridad.test.js` (7, PGlite): permisos y membresía en el servidor, sin respuestas al navegador, SQL de verificación de solo lectura.
- `tools/tests/academia-presente-simple.e2e.js` (14, Playwright): oculto sin canario, 5 lecciones con progreso en la nube, errores al motor, examen, insignia, anchos 320 a 1440 sin desborde, audio (cada botón pide su mp3 con 200) y botones presentes en cada ejemplo y celda de tabla, cuenta gratis, TO BE intacto y apagado del curso.
NO probado: teléfono físico, escuchar las voces (revisar a oído algunos audios), reproducción con un miembro real en producción, pagos.

## 4. Qué NO cambia
Precios, pagos, límite gratis, la prueba gratis de TO BE, el avance de los otros cursos, el motor adaptativo, el panel del alumno, Leo AI y el SEO. El único cambio en código compartido es agregar `presente-simple` a la lista de cursos de `academia.js`.
