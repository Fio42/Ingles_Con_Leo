# Cursos 9, 10 y 11: desarrollados y OCULTOS (4-nov-2026)

Curso 9 WH-QUESTIONS (id wh), Curso 10 Presente continuo (id presente-continuo), Curso 11 IN / ON / AT (id in-on-at). Mismo modelo que DO / DOES: 5 lecciones, 40 ejercicios, 30 de práctica, banco privado de 50 preguntas (15 por intento, 80 % para aprobar), insignia y audios Kokoro. Solo miembros, sin prueba gratis.

## Estado (actualizado 15-nov-2026)
- WH-QUESTIONS (curso 9): ya está publicado y encendido en Supabase (enabled=true, 50 preguntas, contenido v1, 101 audios).
- PRESENTE CONTINUO e IN / ON / AT: filas creadas en academia_courses con enabled=false, 50 preguntas de examen y contenido v1 cargados, PERO con versiones viejas: el examen tiene el texto anterior de 3 preguntas (e-i3 de presente-continuo, e-q7 y e-l7 de in-on-at) y el contenido no trae el mapa de audios. Storage no tiene ningún mp3 de estos dos cursos.
- En el código (commit de lanzamiento, aún sin push): `soon` quitado de la ruta, `open:true` en tools/generar_academia_motor.js, motor y cursos regenerados, temas.js con los dos temas en ACADEMIA_COURSE_BY_TEMA, landing de 11 cursos, sitemap, versiones ?v=20261115a.
- Con el código que hoy está en GitHub (soon:true) los dos cursos solo los ve quien tenga localStorage.leo_academia_canary='1'. Por eso la prueba privada no necesita deploy.
- Material privado (no está en Git, copia en C:\ICL-Privado): contenido, examen, seeds, audio y autoría. Copiar ahí las versiones nuevas de academia-examen-<id>.json y de los seeds de examen y contenido de los dos cursos.
Huellas SHA-256 (12 primeros): wh: contenido c3bae24bda56, examen 44783e550b90, audios=101;presente-continuo: contenido fcd537f61a62, examen 6885df934b4f, audios=209;in-on-at: contenido 88a1d5098c94, examen 8b7cd51b3ade, audios=141;

## Orden para publicar (presente-continuo e in-on-at)
1. Supabase, SQL Editor, por curso: private/seed-academia-examen-<id>.sql y luego private/seed-academia-contenido-<id>.sql. Son upserts: no tocan enabled ni el progreso de nadie. Las migraciones 20261104143000 y 20261104143100 ya están aplicadas, no repetir (si se repiten no cambian nada: on conflict do nothing).
2. Storage, bucket academia-audio: subir los mp3 de private/audio/presente-continuo (209) y private/audio/in-on-at (141) a academia-audio/<id>/ sin copias "(1)".
3. Prueba privada (con el código actual de GitHub): update public.academia_courses set enabled=true where course_id='<id>'; y en el navegador localStorage.setItem('leo_academia_canary','1'). Probar con cuenta miembro y con cuenta gratis: lección, audio, retomar, examen e insignia.
4. Lanzar: git push del commit de lanzamiento. Con enabled=true ya puesto, el sitio muestra los dos cursos, el conteo de 11 y las tarjetas.
Apagado de emergencia: update public.academia_courses set enabled=false where course_id='<id>';
Importante: no hacer el push con enabled=false, porque temas.js y la práctica enlazarían a un curso que el servidor oculta.

## Pruebas
Node: tools/tests/academia-wh.test.js, academia-presente-continuo.test.js, academia-in-on-at.test.js, academia-cursos-nuevos.test.js y conexion-educativa.test.js.
Navegador (Playwright + PGlite): tools/tests/academia-presente-continuo.e2e.js y academia-in-on-at.e2e.js, 15 pruebas cada uno (abrir, lecciones, audio, retomar en otro dispositivo, examen, insignia, gratis vs miembro, anchos 320 a 1440, TO BE intacto, curso apagado en el servidor). Corren también con el código anterior más canario. Comando: NODE_PATH=$(npm root -g) node tools/tests/academia-in-on-at.e2e.js
Audio: se comprobó que "read" suena /riːd/ y "live" /lɪv/ regenerando cada frase y comparando la onda con el mp3 (correlación 0,996 a 0,9999).
