# Validación real del Curso 3 (Supabase de prueba y teléfono físico)

Objetivo: comprobar con autenticación real, Storage real y un teléfono real lo que en el equipo solo se probó con réplicas. NO se toca producción (`iviksyhzhiygkuaojply`); los scripts se niegan a correr contra ese proyecto.

## Lo que haces tú (unos 15 minutos)
1. En supabase.com crea un proyecto NUEVO y vacío llamado `ingles-prueba` (el plan gratis permite dos). Guarda la contraseña de la base donde quieras; no la necesitamos.
2. Reúne 4 datos del proyecto de prueba (Settings > API y tu cuenta): URL del proyecto, clave `anon`, clave `service_role` (secreta, solo de este proyecto de prueba) y un token personal (supabase.com/dashboard/account/tokens, nómbralo `prueba-curso3`).
3. En tu computador, en una ventana de PowerShell dentro de la carpeta del repositorio (con `private\` restaurado del paquete cifrado), define los datos SIN pegarlos en el chat:
   `$env:SB_URL="https://xxxx.supabase.co"; $env:SB_ANON="..."; $env:SB_SERVICE="..."; $env:SB_PAT="..."`
   y ejecuta: `node tools\probar_curso3_en_supabase_de_prueba.js`
   Resultado esperado: etapa apagado 13 ok, etapa encendido 16 ok, "RESULTADO: TODO OK". Copia al chat solo esas líneas (no contienen claves).
4. Teléfono físico (Android y, si puedes, iPhone): en el computador, `python -m http.server 8000` desde la carpeta del repositorio; en el teléfono (misma wifi) abre `http://<IP del computador>:8000/tools/prueba-movil-curso3.html`; los datos de acceso están en `private\prueba-telefono.txt`. Pulsa 1 (entrar), 2 (un audio), 3 (tres seguidos); deja 15 minutos, pulsa 4 (renovar) y vuelve a tocar un audio. Dime qué pasó en cada paso.
5. Al terminar: borra `private\prueba-telefono.txt` y el proyecto de prueba.

## Qué cubre
Visitante, cuenta gratuita, miembro activo, cancelado vigente (misma condición del servidor que un activo), vencido y curso oculto; bucket privado; tabla sin lectura directa; firma de 137 enlaces; descarga real de un MP3; vencimiento de 15 minutos; enlace sin token rechazado.

## Qué no cubre
La página `academia.html` completa en teléfono se valida en el paso 4 de producción de la guía de lanzamiento (curso encendido pero oculto al público, con el canario). Un enlace ya emitido puede seguir sirviendo hasta 15 minutos tras vencer la membresía.

## Resultado de la validación real (27-oct-2026, proyecto de prueba `ingles-prueba`, ref distinto de producción)
Ejecutada por Claude desde el navegador integrado, contra Supabase Auth, PostgREST y Storage reales (no simulados). No se tocó producción.
- Cuentas reales de prueba (cargador, gratis, miembro, vencido) con inicio de sesión real por contraseña (Auth devolvió token a las 4).
- Curso APAGADO: visitante 401, gratis, miembro y vencido reciben `course`; firma, descarga directa, URL pública y tabla: todo bloqueado.
- Curso ENCENDIDO: visitante 401; gratis y vencido reciben `members`; miembro recibe 5 lecciones y 30 de práctica idénticas al origen, firmó y descargó los 137 audios (0 fallos, audio/mpeg). Tabla `academia_content` sin lectura directa (403). URL pública 400.
- Enlace de 2 s: 200 antes de expirar, 400 después; renovación con sesión: 200.
- Miembro pasa a vencido: RPC `members`, firma nueva rechazada; un enlace emitido antes sigue vivo hasta su caducidad (diseño de 15 min).
- Permisos: bucket privado, RLS activo, `anon` sin permisos sobre tablas ni funciones, `authenticated` solo ejecuta `academia_get_content` y `academia_audio_allowed`, 137 objetos, política temporal de carga eliminada (solo queda `academia_audio: miembros`).
- Hallazgos: la subida con `x-upsert` es denegada para cuentas sin política de escritura (comportamiento correcto). El registro por correo en el proyecto de prueba quedó limitado por el envío de confirmaciones, así que las cuentas se crearon directo en su base.
- Pendiente: prueba en teléfono físico (Leo).

### Ampliación: recorrido completo de academia.html (27-oct-2026, mismo proyecto de prueba)
Se aplicaron en el proyecto de prueba las migraciones reales (integración de la Academia, demo independiente, curso Artículos, contenido protegido) y se cargaron contenido (con mapa de 137 audios), banco de 50 preguntas del examen y los 137 audios. La página se cargó en el navegador integrado apuntando a ese proyecto.
- Miembro: inició sesión con el código del sitio (`LeoBackend.signInWithPassword`), abrió el curso, resolvió las 5 lecciones por la interfaz (la 1 con un error a propósito: repaso guardado, 7 de 8 a la primera; las demás 8 de 8). El servidor guardó progreso (documento versionado), una fila de errores y una sesión por lección.
- Progreso recuperado: con la copia local borrada, la página mostró 5 de 5 lecciones (100%) desde la nube.
- Práctica sin nota: 87% con desglose por tema y recomendaciones. No da insignia.
- Examen oficial: intento 1 con 6 errores marcados = 60% (el servidor devolvió exactamente 9 de 15), sin insignia; intento 2 = 100%, insignia guardada (`academia_badges`), quedan 1 intento ese día. El banco no se puede leer desde el navegador (permission denied).
- Audio dentro de la página: un audio suelto y tres seguidos sonaron (loadedmetadata, playing, ended) con enlaces firmados; a los 9 minutos simulados la página renovó los enlaces sola (1 petición) y siguió sonando.
- Gratis: ve el temario y "Este curso es para miembros", sin demostración; contenido, examen y audio devueltos como `members`/bloqueados. Vencido: igual. Cancelado con acceso vigente (mismo estado de servidor que un activo): entra, resuelve, firma audio, tiene examen. Al vencer ambos: contenido, examen y firmas nuevas bloqueados; progreso e insignia siguen legibles.
- Hallazgos: (1) corregido, rótulos de evaluación e insignia decían TO BE en otros cursos; (2) en el proyecto de prueba el registro de cuentas por correo está limitado por el envío de confirmaciones, por eso las cuentas se crearon en su base y el teléfono entra con un código de un solo uso.
- No probado de verdad: el reintento tras un enlace de audio vencido dentro de la página (cubierto solo por las pruebas automáticas); iPhone; el límite diario del examen (3 intentos) más allá del conteo mostrado; el pago real y la renovación de membresía.
