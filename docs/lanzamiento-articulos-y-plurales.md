# Lanzamiento del curso ARTÍCULOS Y PLURALES (guía propia)

Estado: construido y probado en la rama `curso/articulos-plurales`. NO está publicado, NO se aplicó ningún SQL y el curso sigue oculto
(`soon:true` en `academia-data.js`, `open:false` en `tools/generar_academia_motor.js`, `enabled=false` en la base). Solo para miembros de pago, sin prueba gratis.
Esta guía es independiente de `LANZAMIENTO_TO_BE.md`, que no se modificó.

## 0. Lo que debes saber antes de decidir cuándo hacer el merge
- El texto de las lecciones y de las 30 preguntas de práctica, y los audios, viajan como archivos estáticos del sitio (igual que TO BE y Pronombres). Si se hace merge a `main`, esos archivos quedan descargables por cualquiera que conozca la dirección, aunque el curso esté oculto en pantalla.
- Lo que sí protege el servidor: el progreso, la evaluación oficial (las 50 preguntas y sus respuestas), las insignias, los errores y las sesiones. Una cuenta gratis no puede leerlos ni escribirlos ni llamando a las funciones directamente (prueba `academia-articulos-seguridad.test.js`).
- Recomendación: hacer el merge el mismo día del lanzamiento (pasos 1 a 6 seguidos), no antes. Así el contenido no está publicado de antemano. Si algún día se quiere proteger también las lecciones, hay que entregarlas desde el servidor solo a miembros (proyecto aparte; no se hizo).

## 1. Dónde está el banco privado del examen y cómo no perderlo
- Son 50 preguntas (10 por tema) en `private/academia-examen-articulos.json` (fuente) y `private/seed-academia-examen-articulos.sql` (se regenera con `node tools/academia_seed_examen.js articulos`). La carpeta `private/` está en `.gitignore` y no se sube nunca a GitHub.
- Copias hoy: (a) el espacio de trabajo de Claude, que es temporal; (b) tu computador, en `OneDrive\Desktop\inglesconLeo\private\` (copiado y verificado con huella SHA-256; ahí también están los bancos de TO BE y Pronombres, que antes solo existían en el espacio temporal).
- Huellas del archivo fuente (para comprobar que no cambió): ver `private/` en tu computador con `certutil -hashfile private\academia-examen-articulos.json SHA256`. Huella al cierre de esta revisión: `94a1c15320e7197454e31d29a54487ae6b3a13e82a5c7055803ff46b345fc387`.
- Después de cargar el banco en Supabase (paso 3), esa tabla pasa a ser la copia de producción. Como el plan gratis no tiene copias de seguridad, haz una copia aparte de `private/` en un lugar tuyo que no sea público (por ejemplo un USB o tu gestor de contraseñas) y no la pegues en chats ni la subas a un repositorio.
- Si el seed se pierde pero la tabla existe: en Supabase SQL Editor `select * from public.academia_exam_items where course_id='articulos';` y exporta el resultado a CSV.

## 2. Antes del lanzamiento (ya hecho, solo repasar)
`node tools/tests/academia-articulos.test.js`, `node tools/tests/academia-articulos-seguridad.test.js` y `NODE_PATH=$(npm root -g) node tools/tests/academia-articulos.e2e.js`, más todas las suites que ya existían (deben seguir como en `main`: solo fallan las 4 de `error-monitor` y `checkout-abandonado`).

## 3. Pasos (cada uno se verifica antes de seguir; solo con tu autorización)
Para verificar: pega `supabase/verify/academia_articulos_verificacion.sql` en el SQL Editor (solo lee).
1. Merge de la rama a `main` y publicación del sitio. El curso sigue oculto para todos. Comprobar: el Inicio, la Academia, Practicar y Mi progreso se ven igual; `https://inglesconleo.com/academia.html#/curso/articulos` te devuelve al inicio.
2. Aplicar `supabase/migrations/20261028120000_academia_curso_articulos.sql`. Solo inserta una fila apagada; no cambia permisos, funciones, políticas ni los cursos TO BE y Pronombres. Verificación (consulta 1): `articulos | false | A / An | []`.
3. Cargar el banco: pegar `private/seed-academia-examen-articulos.sql` y ejecutar. Solo inserta 50 filas de `articulos` y se puede repetir sin duplicar. Verificación (consultas 2 y 3): 5 temas con 10 cada uno, total 50, y los números de TO BE y Pronombres iguales que antes. Consulta 4: los cuatro valores en `false`.
4. Prueba privada con una cuenta MIEMBRO tuya: `update public.academia_courses set enabled = true where course_id = 'articulos';` y en el navegador de esa cuenta `localStorage.setItem('leo_academia_canary','1')`. Recorrer las 5 lecciones (audio incluido), la práctica y la evaluación (en teléfono y en escritorio). Con una cuenta GRATIS (también con el canario): ve el temario y el botón de membresía, no puede entrar a lecciones, práctica ni examen, y no hay prueba gratis. Quitar el canario al terminar.
5. Abrir para todos (con tu autorización): `soon:false` en la entrada `articulos` de `route.courses` (`academia-data.js`), `open:true` en `articulos` de `tools/generar_academia_motor.js`, regenerar con `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_motor.js` y `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_cursos.js` (sin esa variable el Inicio se rompe), subir las versiones de los scripts, correr todas las pruebas y publicar. Páginas de presentación y sitemap, solo si lo decides.
6. Apagado de emergencia en cualquier momento, sin borrar nada: `update public.academia_courses set enabled = false where course_id = 'articulos';`. Nunca correr `supabase/rollback/`.

## 4. Qué NO cambia este lanzamiento
Precios, pagos, límite gratis, la prueba gratis de TO BE (sigue siendo la única), el avance de TO BE y Pronombres, el motor adaptativo, el panel del alumno, Leo AI y el SEO.

## Contenido protegido (rama `proteccion/contenido-premium`)

Si se aprueba la protección, el Curso 3 NO se publica con su contenido en archivos del sitio. Pasos adicionales antes de encenderlo (ninguno se ha hecho):
1. Aplicar `supabase/migrations/20261028180000_academia_contenido_protegido.sql` (crea `academia_content`, `academia_get_content`, el bucket privado `academia-audio` y su política).
2. Cargar el contenido: ejecutar `private/seed-academia-contenido-articulos.sql` (se regenera con `node tools/academia_seed_contenido.js articulos`).
3. Subir el contenido de `private/audio/articulos/` al bucket `academia-audio`, carpeta `articulos/`.
4. Verificar con cuentas de prueba: miembro ve las lecciones y oye el audio; cuenta gratis ve solo el temario; cuenta sin membresía recibe "solo para miembros"; con el curso apagado nadie entra.
5. Respaldo: `private/contenido/` y `private/audio/` se suman a lo que hay que guardar fuera del repositorio (junto a los bancos de examen).
Detalle completo: `docs/proteccion-contenido-premium.md`.

Pruebas obligatorias en Supabase antes de abrir (con cuentas de prueba, nunca de clientes), en un proyecto de prueba o en producción con el curso aún apagado:
- Con el curso apagado: un miembro NO recibe contenido y `createSignedUrls` no devuelve enlaces.
- Encender el curso: miembro ve y oye; cuenta gratis solo temario; cuenta vencida no recibe nada.
- En un teléfono real (Android e iPhone): tocar un audio, avanzar varias pantallas, dejar la lección abierta más de 15 minutos y volver a tocar un audio.
- Confirmar en el panel de Storage que el bucket `academia-audio` aparece como privado.
