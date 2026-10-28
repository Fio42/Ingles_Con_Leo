# Lanzamiento del curso ARTÍCULOS Y PLURALES (guía final)

Estado: terminado, probado y protegido en la rama `curso/articulos-protegido`. NO está publicado, NO se aplicó ningún SQL y el curso sigue oculto
(`soon:true` en `academia-data.js`, `open:false` en `tools/generar_academia_motor.js`, `enabled=false` al crearse en la base). Solo para miembros, sin prueba gratis.
Guía independiente de `LANZAMIENTO_TO_BE.md`, que no se modificó. TO BE y Pronombres no cambian.

## 0. Cómo queda protegido (resumen)
- En el sitio público solo viaja el esqueleto del curso (títulos y resúmenes: lo que ve la cuenta gratis). Lecciones, ejercicios, práctica y el mapa de audio salen de Supabase con `academia_get_content`, solo a miembros vigentes y con el curso encendido.
- Los 137 audios están en el bucket privado `academia-audio`; el navegador recibe enlaces de 15 minutos que se renuevan solos. Un enlace ya emitido puede seguir sirviendo hasta que caduque (máximo 15 minutos) aunque la membresía venza o el curso se apague.
- El examen oficial (50 preguntas y respuestas), progreso, insignias y errores ya eran del servidor.
- Detalle y auditoría: `docs/proteccion-contenido-premium.md`.

## 1. Material privado (nunca en GitHub) y respaldo
- Carpeta `private/` (ignorada por Git): `contenido/articulos.json`, `contenido/articulos.audio.json`, `audio/articulos/` (137 mp3), `seed-academia-contenido-articulos.sql`, los 3 bancos `academia-examen-*.json` y sus `seed-academia-examen-*.sql`.
- Respaldo definitivo cifrado AES-256 (7z), dos copias con su huella SHA-256 y verificadas por extracción: `C:\Users\fiocc\WebProjects\Respaldos-Privados\InglesConLeo\` y `C:\Users\fiocc\OneDrive\Documents\Respaldos-Privados\InglesConLeo\`. Huella del paquete: ver el `.sha256` de esa carpeta. La contraseña vive solo en tu gestor de contraseñas.
- Para recuperar: abrir con 7-Zip y copiar `InglesConLeo-privado\*` dentro de `private\` del repositorio.
- Después de cargar todo en Supabase, la base y el bucket son otra copia, pero el plan gratis no hace copias automáticas.

## 2. Validación real previa (proyecto de PRUEBA, no toca producción)
Guía: `docs/validacion-supabase-real-curso3.md`. Un solo comando en tu computador (`tools/probar_curso3_en_supabase_de_prueba.js`) deja el proyecto de prueba listo, crea 4 cuentas de prueba (gratis, activo, cancelado vigente, vencido), sube los 137 audios, corre las etapas "apagado" y "encendido" y guarda los datos para la prueba del teléfono. Resultado esperado: 13 ok (apagado) y 16 ok (encendido). Después, la prueba de audio en teléfono físico con `tools/prueba-movil-curso3.html`.

## 3. Pasos de producción (cada uno se verifica antes de seguir; solo con tu autorización)
1. Merge de `curso/articulos-protegido` a `main` y publicación del sitio. El curso sigue oculto para todos. Comprobar: Inicio, Academia, Practicar y Mi progreso se ven igual; `https://inglesconleo.com/academia.html#/curso/articulos` te devuelve al inicio; en `https://inglesconleo.com/academia-data.js` no hay textos del curso.
2. SQL Editor de producción, en este orden (cada archivo es repetible):
   a. `supabase/migrations/20261028120000_academia_curso_articulos.sql` (inserta una fila apagada).
   b. `supabase/migrations/20261028180000_academia_contenido_protegido.sql` (tabla, función, bucket privado y política).
   c. `private/seed-academia-examen-articulos.sql` (50 preguntas).
   d. `private/seed-academia-contenido-articulos.sql` (contenido del curso).
   Verificación (solo lee): `supabase/verify/academia_articulos_verificacion.sql`, y además
   `select course_id, enabled from public.academia_courses where course_id='articulos';` (false),
   `select course_id, version, octet_length(content::text) from public.academia_content;` (1 fila),
   `select public from storage.buckets where id='academia-audio';` (false).
3. Storage > `academia-audio`: subir la carpeta `articulos` con los 137 mp3 (arrastrar `private\audio\articulos`; deben quedar como `articulos/<nombre>.mp3`).
   Verificación: `select count(*) from storage.objects where bucket_id='academia-audio';` = 137.
4. Prueba privada en producción con cuentas TUYAS de prueba (miembro y gratis; nunca de alumnos): `update public.academia_courses set enabled = true where course_id = 'articulos';` y en el navegador de esa cuenta `localStorage.setItem('leo_academia_canary','1')`. Recorrer las 5 lecciones con audio, práctica y evaluación en teléfono y escritorio; la cuenta gratis solo ve temario y botón de membresía. Quitar el canario al terminar. Solo quien tiene el canario ve el curso; el público no.
5. Abrir para todos (con tu autorización): `soon:false` en `articulos` de `route.courses` (`academia-data.js`), `open:true` en `tools/generar_academia_motor.js`, regenerar con `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_motor.js` y `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_cursos.js` (sin esa variable el Inicio se rompe), subir las versiones de los scripts, correr todas las pruebas y publicar. Páginas de presentación y sitemap, solo si lo decides.
6. Apagado de emergencia, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'articulos';` (el contenido y el audio dejan de entregarse al instante). Nunca correr `supabase/rollback/`.

## 4. Qué NO cambia
Precios, pagos, límite gratis, la prueba gratis de TO BE (sigue siendo la única), el avance de TO BE y Pronombres, el motor adaptativo, el panel del alumno, Leo AI y el SEO.
