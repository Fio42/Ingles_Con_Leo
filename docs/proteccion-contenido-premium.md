# Protección del contenido premium de la Academia

Rama: `proteccion/contenido-premium` (sin merge, sin publicar, sin migraciones aplicadas en producción).

## 1. Qué encontré (auditoría)

Corrección importante: el sitio NO está en Cloudflare Pages. Se sirve desde GitHub Pages (rama `main`, dominio `inglesconleo.com`); Cloudflare solo se usa para Leo AI. Y el repositorio `Fio42/ingles_con_leo` es PÚBLICO.

| Contenido | Dónde está hoy (TO BE y Pronombres) | ¿Lo baja alguien sin cuenta? |
|---|---|---|
| Explicaciones, ejemplos, traducciones | `academia-data.js` (74 KB, texto plano) | Sí, abriendo la URL o el repositorio |
| Ejercicios, opciones, respuestas correctas y explicaciones de las lecciones | `academia-data.js` | Sí |
| Práctica general | `academia-data.js` (`exam.bank`) | Sí |
| Audios MP3 (TO BE 95, Pronombres 56) | carpeta `audio/academia/...` + `academia-audio.js` (lista texto a archivo) | Sí, enlace permanente |
| Rutas directas y caché del navegador | todo lo anterior queda en caché del dispositivo | Sí |
| Banco de examen oficial (3 bancos) | tabla `academia_exam_items` en Supabase; solo lo califica el servidor | No (ya protegido) |
| Progreso, insignias, errores, sesiones, límites de demostración | Supabase, funciones con `anon` bloqueado | No (ya protegido) |
| `academia-motor.js` y `academia-cursos.js` | solo mapas de ids, sin texto | Sin riesgo |

Conclusión: lo único ya protegido por servidor es el examen oficial, el progreso y las insignias. Todo el material de estudio de TO BE y Pronombres es descargable sin iniciar sesión, y también está en la historia de Git.

Para el Curso 3 (rama `curso/articulos-plurales`, ya subida a GitHub): su contenido y sus 134 audios están en esa rama pública. Aunque no se haya hecho merge, cualquiera que mire las ramas del repositorio puede leerlo.

## 2. Solución implementada (solo Curso 3, en rama aparte)

Un solo mecanismo compartido, sin segundo motor educativo:

1. Un curso marcado `protected:true` en `academia-data.js` trae solo su esqueleto público: título, temas, títulos y resúmenes de lecciones, ids de ejercicios. Es lo que ve la cuenta gratis (temario comercial).
2. Lecciones, ejercicios, práctica y mapa de audio viven en la tabla `academia_content` y se entregan con la función `academia_get_content(curso)`. El servidor comprueba sesión, curso encendido y membresía vigente (`academia_is_member`, la misma fuente de verdad del examen). El navegador no envía ningún dato de membresía.
3. Los audios están en un bucket privado `academia-audio` de Supabase Storage. La política de Storage usa la misma regla (miembro vigente y curso encendido). El navegador recibe URLs temporales de 6 horas con un solo pedido por curso y las usa como un MP3 normal: sin pasos extra para el alumno y compatible con el móvil (el `play()` sigue ocurriendo en el toque).
4. Cancelada pero vigente: sigue como miembro hasta que el webhook la marca vencida. Vencida: pierde contenido y permiso de audio al instante.
5. TO BE y Pronombres no son `protected`: siguen el camino de siempre, sin ninguna llamada nueva.

Archivos tocados: `academia.js` (hidratar al entrar, `audioFor` con URLs firmadas), `academia-nube.js` (`content`, `signAudio`), `academia.html` y `academia-boot.js` (versión), `academia-data.js` (esqueleto del Curso 3), `academia-audio.js` (sin cambios frente a main), `tools/generar_academia_motor.js`, `tools/generar_audios_academia.py`, nuevas `tools/academia_fuente.js`, `tools/academia_extraer_contenido.js`, `tools/academia_seed_contenido.js`, migración `20261028180000_academia_contenido_protegido.sql`.

Material privado (ignorado por Git, nunca en el despliegue): `private/contenido/articulos.json`, `private/contenido/articulos.audio.json`, `private/audio/articulos/` (137 mp3), `private/seed-academia-contenido-articulos.sql`.

## 3. Infraestructura que habría que tocar al lanzar (no hecho)

- Aplicar la migración en Supabase (crea la tabla, la función y el bucket privado; no toca pagos, perfiles ni progreso).
- Cargar el contenido: ejecutar `private/seed-academia-contenido-articulos.sql`.
- Subir los 137 mp3 de `private/audio/articulos/` al bucket `academia-audio` (carpeta `articulos/`).
- Probar con una cuenta de prueba de miembro, una gratis y una vencida (nunca cuentas de clientes).
- Pesos: contenido de texto unos 36 KB una vez por sesión; audios 137 archivos (unos pocos MB), descargados solo al escuchar. El plan gratis de Supabase tiene unos 5 GB de salida al mes, así que no hay presión con el volumen actual.

## 4. Riesgos y límites

- Lo que ya está en GitHub no se puede retirar: la historia del repositorio sigue mostrando TO BE, Pronombres y, mientras exista, la rama `curso/articulos-plurales`. Esta solución evita que el Curso 3 entre a `main` como texto público, pero no borra lo ya publicado. Si quieres que el Curso 3 sea realmente exclusivo, hay que reemplazar esa rama remota (te pido permiso antes).
- Una URL firmada de audio se puede compartir mientras dura (6 horas). Es el costo aceptado de no añadir pasos al alumno.
- El miembro puede copiar lo que ve en pantalla; ningún sistema evita eso. La protección es contra descarga directa y contra cuentas sin membresía.
- La política real de Storage no se puede probar en la base local de pruebas (solo se verifica su texto y la regla `academia_audio_allowed`). Debe validarse en Supabase con cuentas de prueba antes de abrir el curso.
- Si falla la red al cargar, el alumno ve "No pudimos cargar el curso" con botón Reintentar; no se rompe el resto de la Academia.

## 5. Cursos 1 y 2 (TO BE y Pronombres): no los toqué

Proteger sus lecciones y audios exige el mismo mecanismo, pero implica cambiar cursos ya publicados (con la demostración gratuita de TO BE que usa parte de ese contenido) y los alumnos actuales. Opciones:

- A. Dejarlos como están (son el gancho comercial público; el valor premium está en el examen, la práctica adaptativa y el seguimiento, que sí están protegidos).
- B. Migrarlos por etapas con el mismo mecanismo: primero Pronombres (sin demo), luego TO BE dejando fuera de la protección las 3 actividades de la demostración. Riesgo medio: toca el curso en vivo, requiere reconvertir audio y pruebas completas. La historia de Git seguiría pública.
- C. Hacer privado el repositorio y mover el hosting (por ejemplo Cloudflare Pages con repositorio privado). Cierra también la historia, pero cambia el despliegue del sitio completo y conviene hacerlo como proyecto aparte.

Recomendación: A ahora, B para Pronombres solo si quieres exclusividad real, y C como decisión de negocio más adelante.

## 6. Pruebas

- `academia-proteccion.test.js` (11): sin sesión, cuenta gratis, miembro, cancelada vigente, vencida, curso oculto, solicitudes manipuladas (otro curso, nulos, inyección, membresía inventada, rutas de audio ajenas), acceso directo a tabla, migración idempotente sin tocar pagos ni otros cursos, `git` sin archivos privados, escaneo de que ninguna frase del Curso 3 aparece en archivos públicos (comprobado que falla si se filtra), TO BE y Pronombres sin llamadas nuevas.
- `academia-articulos.test.js` (19) y `academia-articulos.e2e.js` (13) adaptados al contenido privado: lecciones cargan desde el servidor simulado, audios firmados, móvil 320/390/escritorio, examen e insignia.
- Regresión completa de la Academia (TO BE, Pronombres, integración, SQL, robustez, comercial): igual que antes. Las únicas fallas son las ya conocidas en `main` (`error-monitor` ×3 y `checkout-abandonado` ×1).

## 7. Bancos privados de examen

Los tres bancos y sus semillas están en `private/` (ignorado por Git, comprobado por prueba) y no están en ningún archivo de despliegue. La copia en tu computador (`OneDrive\Desktop\inglesconLeo\private\`) se hizo antes de tu nueva instrucción; no creé ninguna copia adicional. La guía de lanzamiento del Curso 3 documenta dónde está cada banco y su huella.
