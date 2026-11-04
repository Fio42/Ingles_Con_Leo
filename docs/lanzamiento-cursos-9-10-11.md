# Cursos 9, 10 y 11: desarrollados y OCULTOS (4-nov-2026)

Curso 9 WH-QUESTIONS (id wh), Curso 10 Presente continuo (id presente-continuo), Curso 11 IN / ON / AT (id in-on-at). Mismo modelo que DO / DOES: 5 lecciones, 40 ejercicios, 30 de práctica, banco privado de 50 preguntas (15 por intento, 80 % para aprobar), insignia y audios Kokoro. Solo miembros, sin prueba gratis.

## Estado
- En el código (esta carga): esqueleto público protegido en `academia-data.js`, entrada `soon:true` en la ruta (aparecen como "Próximamente"), puente `open:false`, migración apagada por curso. Nada se enciende solo.
- En producción: NADA cargado todavía (ni filas, ni examen, ni contenido, ni audios). Falta tu autorización para cargarlos apagados.
- Material privado (no está en Git, copia en C:\ICL-Privado): contenido, examen, seeds, audio y autoría (autor\*_a.py, *_b.py, *_meta.json, integrar.py).
Huellas SHA-256 (12 primeros): wh: contenido c3bae24bda56, examen 44783e550b90, audios=101;presente-continuo: contenido fcd537f61a62, examen b20558b33439, audios=209;in-on-at: contenido 88a1d5098c94, examen 609abeff2a18, audios=141;

## Para cargarlos apagados (con tu autorización)
1. Migraciones: supabase/migrations/20261104142900_academia_curso_wh.sql, 20261104143000_academia_curso_presente_continuo.sql, 20261104143100_academia_curso_in_on_at.sql.
2. Seeds en este orden por curso: private/seed-academia-examen-<id>.sql y private/seed-academia-contenido-<id>.sql.
3. Subir los mp3 de C:\ICL-Privado\audio\<id>\ a Storage academia-audio/<id>/ sin crear copias "(1)".
4. Prueba privada: update public.academia_courses set enabled=true where course_id='<id>'; y localStorage.leo_academia_canary='1'.
5. Abrir: quitar soon de la ruta, open:true en tools/generar_academia_motor.js, regenerar motor y cursos, subir versiones.
Apagado de emergencia: update public.academia_courses set enabled=false where course_id='<id>';

## Pruebas
tools/tests/academia-wh.test.js (10), academia-presente-continuo.test.js (13), academia-in-on-at.test.js (11), academia-cursos-nuevos.test.js (12, integración oculta y audios). NO se hizo prueba de navegador por curso ni en teléfono ni se escucharon las voces. Corregida la pronunciación de live en el generador (aplica a estos cursos).
