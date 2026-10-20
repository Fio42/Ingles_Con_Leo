# Indexador de inglesconleo.com

Robot con Playwright que lee el sitemap, inspecciona cada URL en Google Search Console con tu sesion de Google y,
si no esta indexada, pulsa el boton real "Solicitar indexacion". Solo marca una URL como enviada cuando Google
muestra su confirmacion. No usa APIs ni envia el sitemap.

## Puesta en marcha (una sola vez, desde la carpeta tools\indexador)
1. `instalar.bat`
2. `login.bat`: se abre un Chrome normal; inicia sesion en Google con la cuenta propietaria de inglesconleo.com, mira que se ve Search Console y cierra esa ventana.
3. `probar.bat`: inspecciona 1 URL sin pulsar nada.
4. `instalar-tarea.bat`: programa la ejecucion cada 6 horas.

## Dia a dia
- `estado.bat`: resumen de la cola. El historial (fecha, URL, resultado) esta en `%LOCALAPPDATA%\InglesConLeo\indexador\registro.csv`.
- Si aparece CAPTCHA, verificacion de seguridad o la sesion caduca, el robot se detiene, te avisa (notificacion de Windows y `ALERTA.txt`, y opcionalmente ntfy) y no hace nada mas hasta que ejecutes `login.bat` y resuelvas la pantalla tu mismo. Nunca intenta saltarla.
- Si Google muestra el limite de solicitudes, suspende los envios 12 horas y vuelve a comprobar en la siguiente ejecucion.

## Que se guarda y donde
Todo lo que cambia (perfil de Chrome con la sesion, cola, registro, capturas) esta en `%LOCALAPPDATA%\InglesConLeo\indexador`, fuera del repositorio y fuera de OneDrive. En el repositorio no hay contrasenas, cookies ni credenciales.

## Ajustes
`config.json`: limites por ejecucion, URLs prioritarias y exclusiones (con fecha opcional). Ajustes solo tuyos en `config.local.json` (ignorado por git), por ejemplo `{ "avisos": { "ntfyTema": "un-nombre-largo-y-secreto" } }` para recibir el aviso en el movil con la app gratuita ntfy.

## GitHub Actions
No se recomienda: exigiria subir las cookies de Google como secreto y Google cierra o pide verificacion a sesiones que cambian de equipo e IP, asi que se caeria a menudo.

## Pruebas
`npm test` (usa una replica local de Search Console, no toca Google).
