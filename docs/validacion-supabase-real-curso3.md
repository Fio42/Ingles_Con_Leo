# Validación real del Curso 3 (Supabase de prueba y teléfono físico)

Objetivo: comprobar con autenticación real, Storage real y un teléfono real lo que en el equipo solo se probó con réplicas. NO se aplica nada en producción (`iviksyhzhiygkuaojply`); el script se niega a correr contra ese proyecto.

## Qué necesitas (lo haces tú, unos 20 minutos)
1. Un proyecto Supabase NUEVO y vacío (el plan gratis permite dos), por ejemplo `ingles-prueba`.
2. Tres cuentas de prueba (nunca de clientes): en Authentication > Users > Add user, con "Auto confirm": `gratis`, `activo`, `vencido`.

## Pasos
1. SQL Editor: ejecutar `supabase/verify/prueba_real_curso3_entorno_minimo.sql` (se niega a correr si detecta tablas de producción) y después `supabase/migrations/20261028180000_academia_contenido_protegido.sql`.
2. Marcar las cuentas con los tres `insert into public.profiles ...` que trae el SQL mínimo (activo = true; gratis y vencido = false).
3. Ejecutar la semilla `private/seed-academia-contenido-articulos.sql` (está en tu computador dentro del paquete cifrado; no está en GitHub).
4. Storage > bucket `academia-audio` (ya lo creó la migración, privado): subir la carpeta `articulos` con los 137 mp3 (arrastrar desde `private/audio/articulos`).
5. Etapa APAGADO (el curso nace apagado): `SB_URL=... SB_ANON=... T_GRATIS="correo|clave" T_ACTIVO="correo|clave" T_VENCIDO="correo|clave" node tools/validar_curso3_supabase.js apagado`. Esperado: 11 ok. Cubre visitante, gratis, activo y vencido con el curso oculto.
6. SQL: `update public.academia_courses set enabled = true where course_id = 'articulos';` y etapa ENCENDIDO: mismo comando con `encendido`. Esperado: 15 ok. Cubre visitante, gratis, miembro activo (5 lecciones, 40 ejercicios, 30 de práctica, 137 audios firmados, descarga real de un MP3, vencimiento de 15 min), miembro vencido, bucket privado y tabla sin lectura directa.
7. Teléfono físico: en tu computador, desde la carpeta del repositorio, `python -m http.server 8000`; en el teléfono (misma red wifi) abre `http://<IP de tu computador>:8000/tools/prueba-movil-curso3.html`, escribe URL y clave anon del proyecto de PRUEBA y una cuenta de prueba activa. Pulsa 1, 2, 3 y 4. Debe sonar el audio, sonar tres seguidos, y renovar enlaces. Repite en Android y en iPhone si tienes ambos; deja la página 15 minutos y vuelve a tocar el audio con el paso 4 antes.
8. Al terminar: borra el proyecto de prueba o sus cuentas.

## Qué demuestra y qué no
- Demuestra: políticas reales de Storage, firma de enlaces, vencimiento de 15 min, rechazo de visitante y de cuentas sin membresía, bucket privado, curso oculto.
- No demuestra el comportamiento de la página `academia.html` completa en el teléfono (esa se valida con el curso encendido en producción, con el curso aún oculto para el público y una cuenta de prueba con el acceso de pruebas).
- Un enlace ya emitido puede seguir funcionando hasta 15 minutos después de que venza la membresía o se apague el curso.
