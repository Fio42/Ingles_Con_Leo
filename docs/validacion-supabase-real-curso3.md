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
