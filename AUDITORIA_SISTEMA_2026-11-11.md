AUDITORIA DEL SISTEMA, INGLES CON LEO (11 nov 2026)
Mapa de como funciona todo, para no gastar tokens reinvestigando. Generado por 10 agentes de solo lectura en paralelo mas la seccion del libro. Los datos son una foto de este dia: ante duda, verificar en el codigo.

Indice
- 01. Leo AI
- 02. Pagos y membresia
- 03. Base de datos Supabase
- 04. Motor de practica
- 05. Academia
- 06. Examenes (TOEFL, IELTS, TOEIC, Cambridge)
- 07. Contenido y SEO
- 08. Audios
- 09. Frontend, despliegue y medicion
- 10. Historial y estado del proyecto
- 11. Riesgos y seguridad
- 12. Libro 100 errores comunes


======================================================================
# Auditoria 01: Leo AI (tutor de IA / "EOIA")

Alcance: solo lectura. Repo: `inglesconLeo`. Fecha de la auditoria: 2026-11-11.

## 1. Resumen ejecutivo

- Leo AI NO es un chat libre. Es un boton "Explicame" que aparece bajo ejercicios ya calificados y en tarjetas de analisis (sesion, errores, progreso). La IA nunca califica: la nota la pone `app.js`.
- Backend: una sola Edge Function de Supabase, `leo-ai`, que llama a Cloudflare Workers AI (modelo Gemma 4 26B, `@cf/google/gemma-4-26b-a4b-it`) con salida JSON forzada por esquema.
- Miembros: Leo AI completo (modos explain, writing, insight, diagnosis). Cuentas gratis con correo verificado: solo 5 explicaciones de bienvenida ("prueba"), solo modo explain y solo si fallaron el ejercicio.
- Costo objetivo $0: topes en la tabla `leo_ai_config` (por alumno, global y presupuesto de neurons de Cloudflare). En Workers Free, al agotarse la cuota Cloudflare bloquea, no cobra.
- `chatbot.js` (LeoBot) es OTRA cosa: asistente de navegacion por botones, sin IA. Solo tiene un nodo que explica Leo AI.
- `leo-voz.js` tampoco es IA: reproduce MP3 pregrabados de Leo.

## 2. Mapa de archivos

| Ruta | Que es |
|---|---|
| `supabase/functions/leo-ai/index.ts` (844 lineas) | Edge Function desplegable (carpeta que usa Supabase CLI) |
| `supabase_functions/leo-ai.ts` (844 lineas) | Copia identica (el `diff` no mostro diferencias). Es la que citan los comentarios y `tools/leo-ai-eval` |
| `supabase_functions/leo-ai.sql` (263 lineas) | Tablas `leo_ai_config`, `leo_ai_testers`, `ai_usage`, `ai_usage_daily`, `leo_ai_requests` y RPCs |
| `supabase/migrations/20261016001253_leo_ai_trial.sql` | Prueba gratis: `leo_ai_trial`, columnas `trial_*`, reemplaza `leo_ai_reserve`, `leo_ai_begin`, `leo_ai_finish`, agrega `leo_ai_trial_status` y `leo_ai_trial_report` |
| `backend.js` (lineas 672 a 716, export en 977) | Cliente: `askLeoAI`, `askLeoAIOnce`, `getLeoAiTrial` |
| `app.js` (lineas ~2860 a 3430, 8201 a 8412) | UI y payloads: `isLeoAiEnabled`, `buildLeoAiPayload`, `leoAiAttach`, `leoAiAttachFree`, `leoAiAttachTrial`, `leoAiAttachGuestTeaser`, `leoAiMemory`, cache de insights |
| `chatbot.js` / `chatbot.css` (1204 / 415 lineas) | Widget LeoBot (sin IA) |
| `leo-voz.js` (133 lineas) | Audio "Profe Leo te acompana" (MP3 en `audio/leo/<id>.mp3`) |
| `tools/leo-ai-eval/` | Evaluacion de calidad offline y contra el modelo real |

## 3. Flujo de punta a punta

### 3.1 Cliente (navegador)

1. El alumno falla (o acierta) un ejercicio. `app.js` llama `leoAiAttach(host, ctx)` desde grammar (lineas ~2424, 2467, 2532), vocab (~2595), listening (~2688), reading (~2779), writing (~3543, 3874), repaso/mixto (~3798, 3841) y analisis `kind:'insight'` (sesion ~8301, errores ~8394, progreso ~7772).
2. `leoAiAttach` revisa `isLeoAiEnabled()` (constantes `LEO_AI_ENABLED = true` y `LEO_AI_PUBLIC = true`, y la membresia). Si no es miembro, deriva a `leoAiAttachFree` (solo ejercicios fallados de grammar, vocab, listening, reading) o a `leoAiAttachGuestTeaser` para invitados.
3. Al tocar el boton, `buildLeoAiPayload(ctx)` arma el pedido recortado con `leoAiText(v, max)` (quita HTML y limita largo). Nunca envia nombre, correo ni historial; solo una linea de "memoria" (`leoAiMemory`: cuantos fallos recurrentes en el tema).
4. `LeoBackend.askLeoAI(payload)` genera un `request_id` (UUID) por pulsacion, y hace hasta 3 intentos con el mismo id. Reintenta solo si el motivo esta en `LEO_AI_RETRY_REASONS` o es `http_5xx`, y no si la respuesta trae `final:true`.
5. `askLeoAIOnce` exige sesion (`getSession`), hace `POST SUPABASE_URL/functions/v1/leo-ai` con `Authorization: Bearer <access_token>` y timeout de 18 s (AbortController).
6. Respuestas: `{ok:true, answer, trial?}` o `{ok:false, reason, final?, trial?}`. Los textos de error visibles estan en `LEO_AI_FAIL_TEXT` (app.js ~3004).
7. Cache: `_leoAiCache` (Map en memoria) y, para insights, `localStorage` clave `leo_ai_insight_cache_v1` con TTL de 7 dias.

### 3.2 Servidor (`Deno.serve` en `leo-ai/index.ts`)

1. `OPTIONS` responde CORS; otro metodo distinto de `POST` da 405. Si el secreto `LEO_AI_ENABLED` vale `false`, responde `{ok:false, reason:'disabled'}` (apagado de emergencia).
2. Autenticacion: `userIdFromVerifiedToken(token)` usa `supabase.auth.getClaims()` (valida firma ES256 por JWKS, `role === 'authenticated'` y `exp`). Sin sesion valida: 401 `no_session`. Luego lee `profiles.is_member`; si no hay perfil: 403 `not_member`.
3. Modo `trial_status`: devuelve cuantos creditos le quedan a una cuenta gratis, sin IA y sin costo.
4. Validacion de entrada: `MODES = explain, writing, diagnosis, insight`. En writing se exigen al menos 2 palabras reales (`realWords`) antes de reservar cupo. `buildPrompt(mode, body)` solo toma campos conocidos y recortados; si faltan datos devuelve null y la respuesta es 400 `bad_input`.
5. Cuenta gratis: solo `explain` con `isCorrect === false` y `request_id` valido (`/^[A-Za-z0-9_-]{8,64}$/`). Si no, 403 `members_only`.
6. Cupo atomico en base: con `request_id` se llama `leo_ai_begin` (idempotencia: `go`, `processing`, `completed`, `failed_final`, o puertas `disabled`, `not_allowed`, `user_limit`, `global_limit`, `neuron_budget`, `trial_*`). Sin `request_id` (o si `leo_ai_begin` no existe) se usa `leo_ai_reserve`.
7. Proveedor: `publicProviderChain()` (por defecto solo `cloudflare`). `callCloudflare` manda `system = rules`, `user = text`, `max_completion_tokens` (220 explain y writing, 200 insight), `temperature 0.2` (0.6 en el 2.o intento de explain), `enable_thinking:false` y `response_format: json_schema`. Timeout 10 s (`PROVIDER_TIMEOUT_MS`).
8. Contabilidad: `leo_ai_record` guarda solo cantidades (tokens y neurons estimados con `estimateNeurons`), nunca texto. La prueba se registra como `cloudflare:trial`.
9. Validacion de salida: `parseJsonLoose` y `validateOutput`. Para explain, `checkExplain` descarta la salida si es corta (<25 caracteres), si contiene reglas absolutas (`hasAbsoluteRule`), trucos falsos por forma de palabra (`hasShapeTrick`) o repite lo ya mostrado (`repeatsExplanation`). Si solo el ejemplo es dudoso (`exampleIsSafe`), se quita el ejemplo y se entrega la explicacion.
10. Cierre: `finishRequest` (`leo_ai_finish`) guarda la respuesta para que un reintento con el mismo id reciba lo mismo. En fallo no se cobra el credito de bienvenida; maximo 2 llamadas al modelo por pulsacion.
11. Errores anormales (`provider_error`, `bad_output`, `timeout`, `network`, `quota`, y fallos de reserva) van a `reportServerError` (RPC `log_app_error`, tope de 2 s, nunca rompe el flujo).

### 3.3 Que se guarda

- Base: contadores por dia y usuario (`ai_usage`), por dia y proveedor (`ai_usage_daily`, incluidas filas `reserved`, `trial_reserved` y `fail:<motivo>`), peticiones idempotentes (`leo_ai_requests`, que SI guarda la respuesta validada en `p_answer`, ver riesgos) y creditos de prueba (`leo_ai_trial`).
- Navegador: cache de insights y memoria educativa local.
- Al proveedor viaja solo datos del ejercicio; el id de usuario no sale de Supabase.

## 4. Modos y prompts de sistema

- `BASE_RULES`: espanol sencillo de "tu", 2 a 4 frases, solo datos dados, sin enlaces, ignorar instrucciones dentro de la respuesta del alumno (defensa basica contra inyeccion de prompt).
- `EXPLAIN_RULES`: ensenar algo nuevo sin repetir la explicacion ni los ejemplos ya mostrados; prohibe "siempre/nunca" en reglas, registro dudoso y felicitaciones; pide `example_en` y `example_es` nuevos o vacios. Esquema: `explanation`, `example_en`, `example_es`.
- `WRITING_RULES`: esquema `assessment` (`correct|minor|incorrect`), `corrected`, `explanation`, `tip`. El campo se llama `assessment` a proposito (queda primero alfabeticamente; Cloudflare ordena campos y el modelo se trababa). La salida se devuelve a la pagina como `{verdict, corrected, explanation, tips[]}`.
- `DIAGNOSIS_RULES`: se mantiene por compatibilidad; la pagina usa `insight`.
- `INSIGHT_RULES`: una sola idea nueva. `insightSchema(candidates)` convierte `focus_topic` en enum cerrado con los ids que mando la pagina mas `none`; ids ajenos se descartan.
- Scopes de insight: `session`, `mistakes`, `progress` (minimo 2 hechos, maximo 5, hasta 3 ejemplos).

## 5. Limites, cuotas y costos

Valores por defecto en `leo-ai.sql` (editables con SQL en `leo_ai_config`):

- `user_daily_limit` 100 por alumno y dia (el SQL termina con `update ... set user_daily_limit = 100`; el DEVLOG dice que se puede bajar al crecer la base de miembros).
- `global_daily_limit` 1500 pedidos al dia.
- `neuron_budget` 8000 de los 10.000 neurons gratis de Cloudflare. El dia es UTC.
- Prueba gratis: `trial_enabled` (default false, hoy se asume encendido por el codigo cliente), `trial_credits` 5 (por cuenta, de por vida), `trial_daily_pool` 400 pedidos al dia, `trial_neuron_budget` 2500. Exige `auth.users.email_confirmed_at`.
- Precio usado para estimar: `CF_NEURONS_PER_M = {input: 9091, output: 27273}`. Estimacion propia, no lectura real de Cloudflare.
- Tokens de salida medidos: 64 a 102 por respuesta valida.

## 6. Secretos y configuracion

Secretos de Edge Functions en Supabase:

- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (obligatorios), `CLOUDFLARE_AI_MODEL` (opcional).
- `LEO_AI_ENABLED=false` apagado de emergencia sin tocar la base.
- `LEO_AI_PROVIDERS` lista publica (default `cloudflare`). `GROQ_API_KEY` y `GROQ_MODEL` opcionales, Groq esta APAGADO.
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL`, `LEO_AI_ADMIN_KEY` (min 24 caracteres). Solo pruebas del admin con cabecera `x-leo-ai-admin` y `provider:'gemini'` en el cuerpo; nunca para alumnos.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` ya vienen del entorno. El cliente de la funcion usa la service role (ignora RLS).

CORS: `Access-Control-Allow-Origin: *`, headers `authorization, x-client-info, apikey, content-type`, metodos `POST, OPTIONS`. Es abierto, pero la funcion exige JWT valido, asi que el riesgo es bajo.

## 7. Como se desactiva o ajusta

Orden de menor a mayor impacto:

1. Solo la prueba gratis: `update leo_ai_config set trial_enabled = false;`
2. Reducir uso: `update leo_ai_config set user_daily_limit = N, global_daily_limit = N, neuron_budget = N;`
3. Solo probadores: `update leo_ai_config set public = false;` y agregar ids a `leo_ai_testers`. En `app.js`, `LEO_AI_PUBLIC` debe coincidir (si no, el boton solo aparece con `?ia=1`).
4. Apagado general en base: `update leo_ai_config set enabled = false;`
5. Apagado de emergencia: secreto `LEO_AI_ENABLED=false` (efecto inmediato, sin deploy de la pagina).
6. Ocultar la UI: `LEO_AI_ENABLED = false` en `app.js` (requiere publicar; con eso no aparece ningun boton).
7. Cambiar modelo: secreto `CLOUDFLARE_AI_MODEL`. Ojo: `CF_NEURONS_PER_M` esta fijo para Gemma 4; otro modelo distorsiona la estimacion de neurons.

## 8. Chatbot (LeoBot) y leo-voz

- `chatbot.js`: IIFE sin IA. Arbol de nodos `NODES`, `PAGE_CONTEXT` por pagina ("Explicame esta pagina"), `readPracticeContext()` lee el DOM visible. Solo botones y 2 formularios (reportar problema, contactar) que guardan en la tabla `leobot_reports` via `sendLeobotReport` / `LeoBackend.submitLeobotReport` y avisan por correo con la funcion `leobot-notify`. Estado local: `leobot_hidden_v1` (localStorage), `leobot_greeted_session_v1` (sessionStorage). Se carga dinamicamente con `chatbot.js?v=20261031a` (cache-busting manual).
- Menciona Leo AI en el nodo `leoAi` y en `leoAiExerciseNote()`, con enlace a `miembros.html#leo-ai`. No llama a `leo-ai`.
- `leo-voz.js`: comprueba con `HEAD` que exista el MP3; si no, el bloque queda oculto. Volumen en `localStorage` clave `leo_voz_vol`. Solo se usa en `index.html` y `practica.html`.
- Paginas con Leo AI (cargan `app.js`): gramatica, vocabulario, listening, lectura, writing, mixto, errores, plan-estudio, progreso, practica, practica-miembros, miembros, examenes y otras. `miembros.html` (#leo-ai) tiene la seccion de venta.

## 9. Evaluacion (`tools/leo-ai-eval`)

- `cases.js`: 32 errores reales del banco (ids de `data.js`) con etiqueta `clear`, `plausible` o `multi`.
- `lib.js`: `loadApp()` carga `data.js` y `app.js` reales en un contexto `vm`; `loadServer(file)` transpila un `leo-ai.ts` con TypeScript (requiere `node_modules/typescript` en la raiz) y expone sus funciones exportadas.
- `prepare.js`: arma pedidos ANTES (`baseline/leo-ai.before-2026-10-15.ts`) y DESPUES (`supabase_functions/leo-ai.ts`) y mide cuanto crece el pedido. No llama a IA. Escribe `out/cases.json`.
- `make-eval-fn.js [--off]`: genera `out/eval-fn.ts`, una Edge Function TEMPORAL con llave aleatoria que ejecuta los casos contra Cloudflare real. `--off` genera `eval-fn-off.ts` (responde 410) para redesplegarla apagada.
- `audit-examples.js`, `ex-check.js`, `verify-data-diff.js`, `apply-fixes.js` + `fixes/part*.json`: auditoria de los bloques "Mira otros ejemplos" de `data.js` y aplicacion de correcciones.
- `out/` esta en `.gitignore` y contiene `eval-key.txt` y versiones viejas del codigo.
- No hay `package.json` ni runner de pruebas automatico en la raiz; las pruebas `leo-ai-server.test.*.js` solo existen en `out/` (no versionadas).

## 10. Como probar

1. Funcion: con un token de miembro, `POST /functions/v1/leo-ai` con `{"mode":"explain",...,"request_id":"abc12345"}`. Repetir el mismo `request_id` debe devolver la misma respuesta sin gastar cupo.
2. `{"mode":"trial_status"}` con cuenta gratis: no gasta nada.
3. Limites: bajar `user_daily_limit` a 1 y verificar `daily_limit` con `final:true`.
4. Calidad: `node tools/leo-ai-eval/prepare.js`, luego `make-eval-fn.js`, desplegar, correr casos y redesplegar con `--off`.
5. Navegador: `?ia=1` activa el boton en modo beta si `LEO_AI_PUBLIC` fuera false; `?ia=0` lo quita.
6. Revisar en consola el aviso `[Leo AI] fallo:` y en Supabase la tabla `ai_usage_daily` (filas `fail:<motivo>`).

## Como modificar sin romper

- Cambiar prompts: editar `EXPLAIN_RULES`, `WRITING_RULES` o `INSIGHT_RULES`. Cada palabra se paga en cada pedido; correr `prepare.js` para medir el aumento. No quitar las reglas de seguridad de `BASE_RULES`.
- Mantener las DOS copias sincronizadas (`supabase/functions/leo-ai/index.ts` y `supabase_functions/leo-ai.ts`). Hoy son identicas; `tools/leo-ai-eval` lee la segunda y el deploy usa la primera.
- No cambiar nombres de campos del esquema (`assessment`, etc.) sin ajustar `validateOutput` y el render en `app.js` (~3421 en adelante).
- Cambios en `buildPrompt` deben ir junto a `buildLeoAiPayload` (app.js): los limites de largo son paralelos (400, 300, 1500, 140, etc.).
- Cambiar `trial_credits` en base exige actualizar `LEO_AI_TRIAL_CREDITS_COPY` (app.js ~3118).
- Cambios de SQL: usar migracion nueva en `supabase/migrations` (las RPC se redefinen con `create or replace`, misma firma). El codigo tolera RPC faltante (`isMissingFunction`) solo para `leo_ai_begin`.
- Tras editar `chatbot.js` subir el `?v=` en los dos lugares de carga (lineas ~613 y ~619 del archivo que lo inyecta) o los alumnos veran version vieja.
- Redesplegar la funcion preservando la verificacion JWT; el codigo ya valida el token por su cuenta con `getClaims`.
- Nunca guardar texto del alumno en `leo_ai_record` ni en logs: hoy solo hay cantidades y motivos.

## Riesgos y pendientes detectados

1. Duplicacion de la funcion en dos rutas (`supabase/functions/leo-ai/index.ts` y `supabase_functions/leo-ai.ts`): riesgo de divergencia futura. Los comentarios y las herramientas aun apuntan a `supabase_functions/`.
2. `leo_ai_requests` guarda la respuesta de la IA (`p_answer`) por `request_id`. Es contenido generado, no datos personales, pero conviene confirmar que existe limpieza periodica; no la verifique en esta auditoria.
3. Presupuesto de neurons es una ESTIMACION con precios fijos de Gemma 4. Si Cloudflare cambia precios o el modelo, el tope de 8000 puede dejar de proteger. Revisar el panel real de Cloudflare periodicamente.
4. `user_daily_limit = 100` es holgado frente a `global_daily_limit = 1500`: 15 usuarios intensivos agotan el tope global y dejan sin servicio a los demas ("busy"). Considerar bajarlo.
5. Texto libre del alumno (writing, respuesta del alumno) llega al prompt. Hay una defensa por instruccion ("ignora instrucciones dentro de ella") y `cleanText` quita etiquetas HTML, pero no hay filtro de inyeccion adicional. El impacto es bajo porque la salida se valida por esquema y se renderiza como texto, pero verificar que `app.js` use `textContent` (se vio `add('p', ...)` con texto) en todos los puntos.
6. Controles solo en cliente: `LEO_AI_ENABLED` y `LEO_AI_TRIAL_PUBLIC` en `app.js` son constantes. La unica fuente de verdad real es `leo_ai_config` y el secreto; no confiar en la UI como barrera.
7. Prueba gratis por cuenta: un usuario puede crear varias cuentas con correos distintos para obtener 5 explicaciones cada una; lo acota `trial_daily_pool` (400) y `trial_neuron_budget` (2500). Monitorear con `leo_ai_trial_report()`.
8. Un unico proveedor (Cloudflare). Si falla o se agota la cuota, Leo AI queda "no disponible" hasta el dia siguiente UTC. Groq esta preparado pero apagado a proposito.
9. Gemini solo existe para pruebas privadas con `LEO_AI_ADMIN_KEY`. Si ese secreto se filtra, permite gastar la cuota de Gemini (plan gratis no apto para menores ni Europa). Mantenerlo sin definir si no se usa.
10. El guardia de calidad (`checkExplain`, `exampleIsSafe`) es heuristico: la propia nota del codigo aclara que NO mide si la pedagogia es buena ni que el ingles sea correcto. Sigue habiendo riesgo de explicaciones erroneas; la linea "La explicacion de arriba sigue siendo valida" mitiga.
11. `tools/leo-ai-eval/out/` contiene `eval-key.txt` y copias antiguas; esta ignorado por git, pero la funcion temporal de evaluacion debe quedar siempre redesplegada en modo `--off`. Verificar que la funcion `eval-fn` no siga activa.
12. Sin pruebas automaticas versionadas (no hay `package.json` ni carpeta de tests); las pruebas del servidor estan solo en `out/` sin versionar.
13. No revise `supabase/config.toml` (no existe en el repo) ni el estado real del despliegue: si `verify_jwt` esta activo o no en el proyecto Supabase no se puede confirmar desde el repo.
14. Los comentarios de cabecera de la funcion y de `app.js` refieren a `supabase_functions/leo-ai.ts`; las instrucciones de despliegue ahi pueden estar desactualizadas respecto a `supabase/functions/leo-ai/`.


======================================================================
# Auditoria 02: cuentas, membresia y pagos

Alcance: lectura del repo `inglesconLeo` (GitHub Pages + Supabase + Stripe). Nada se modifico. Solo se citan NOMBRES de secretos, nunca valores.

## 1. Idea central: quien es miembro

- Fuente unica de verdad: columna `profiles.is_member` (boolean) en Supabase. Definida en `supabase_schema.sql`.
- `profiles` se crea sola al registrarse (trigger en `supabase_schema.sql`, inserta `id` y `email`). RLS: cada usuario solo lee su propia fila (`profiles: select own`).
- El navegador NUNCA escribe `is_member`. Solo lo escriben los webhooks con la llave `SUPABASE_SERVICE_ROLE_KEY`.
- Columnas relevantes de `profiles`:
  - `is_member`, `member_since`, `member_welcome_sent_at`, `member_welcome_claimed_at`
  - `stripe_customer_id` (indice unico), `paypal_subscription_id` (indice unico), `mp_preapproval_id`
  - `next_renewal_at` (la usa la "zona de silencio" de correos de reactivacion)
  - `checkout_started_at` (analitica de intento de compra)
  - `payment_failed_at`, `payment_failed_email_sent_at`, `payment_failed_email_claimed_at`, `stripe_event_at` (migracion `supabase/migrations/20261020160000_payment_grace.sql`)
  - `email_invalid`, `email_invalid_at` (rebotes de Resend)
  - `upgrade_email_1_sent_at`, `upgrade_email_2_sent_at`, `survey_15d_sent_at` (correos)
- No existe un "trial" de pago. La palabra "trial" en `backend.js` es el periodo de prueba de Leo AI (creditos de bienvenida, funcion `getLeoAiTrial`, migracion `20261016001253_leo_ai_trial.sql`). Stripe `trialing` se trata como activo por si algun dia se usa.

## 2. Frontend: sesion y acceso (`backend.js`, 994 lineas)

- Cliente Supabase via `getClient()`; `isConfigured()` revisa que haya URL y clave publica.
- Auth: `signUp`, `signInWithPassword`, `signInWithGoogle` (OAuth), `signInWithGoogleIdToken`, `sendPasswordReset`, `updatePassword`, `onPasswordRecovery`. El correo de reset lo manda la funcion `supabase_functions/send-password-reset.ts`.
- `getMemberProfile()` lee `profiles` y guarda una pista local `leo_member_hint` en localStorage (`setMemberHint`), solo para pintar la UI rapido. No es seguridad.
- `requireMemberAsync()` / `guardMemberPage()`: si no hay perfil con `is_member=true`, redirige a `miembros.html`. Es una barrera de UI en un sitio estatico: el contenido de paginas de miembros esta en el repo publico, asi que la barrera real solo protege lo que vive en Supabase (progreso, Leo AI, academia con contenido protegido segun `20261028180000_academia_contenido_protegido.sql`).
- Cuenta gratis: limite diario de ejercicios guardado por cuenta (ver funcion cerca de la linea 344 de `backend.js`).

## 3. Planes y precios (lo que ve el usuario)

- `index.html` seccion `#planes` (linea ~450): Gratis ($0) y Miembro ($2 USD/mes, o $20 USD/año, "2 meses gratis").
- `miembros.html`: pantalla de login, selector de plan mensual/anual, formulario Stripe incrustado, boton PayPal, opcion Mercado Pago ($40 MXN/mes). Precio Stripe se ajusta por pais (en Mexico $37 MXN/mes, $370 MXN/año).
- Textos con precio duplicados en: meta description de `miembros.html`, `index.html`, y los selectores de plan. Cambiar precio exige tocar todos.
- Retorno de pago: `?stripe=success`, `?paypal=success`, `?mp=success`. `miembros.html` entra en modo "confirmando" y vuelve a consultar el perfil hasta que el webhook active `is_member`; si tarda, muestra `paypalDelayed` con boton "Revisar de nuevo". El evento de compra de Analytics/Pixel se dispara solo cuando `is_member` y `member_since` ya estan puestos.

## 4. Flujo Stripe, de punta a punta (suscripcion)

1. Usuario logueado abre `miembros.html`. Se precarga el endpoint con un `OPTIONS` a `.../functions/v1/stripe-checkout`.
2. El navegador llama a `stripe-checkout` con su token de sesion. Cuerpo opcional: `plan` (`monthly` o `annual`), `track` (false = no registrar intento), `action` ('mark' = solo registrar intento).
3. `supabase/functions/stripe-checkout/index.ts` valida el token con `supabase.auth.getUser`. Sin token: 401 `no_token`; token malo: 401 `invalid_session`.
4. Registra `profiles.checkout_started_at` (antirrebote de 10 min, solo si existe la service role; si falla se ignora).
5. Crea sesion Checkout de Stripe: `mode=subscription`, `ui_mode=embedded_page`, `client_reference_id = user.id`, `customer_email`, `subscription_data[metadata][plan]`, `return_url = https://inglesconleo.com/miembros.html?stripe=success`. Devuelve `client_secret`.
6. El formulario de tarjeta se monta dentro de `miembros.html` (Stripe.js desde `js.stripe.com`).
7. Stripe cobra y envia webhook a `supabase_functions/stripe-webhook.ts` (verifica firma HMAC `Stripe-Signature` con `STRIPE_WEBHOOK_SECRET`; firma mala: 400 y se registra `bad_signature`).
8. `checkout.session.completed` con `mode=subscription` y `client_reference_id`:
   - Lee si ya era miembro. Si no, hace update condicionado a `is_member=false` (anti carrera), pone `is_member=true`, `member_since`, limpia banderas de bienvenida.
   - `upsert` en `profiles` con `stripe_customer_id` (crea la fila si faltaba).
   - `ensureMemberWelcome`: correo de bienvenida por Resend, una sola vez (reserva `member_welcome_claimed_at`, luego `member_welcome_sent_at`).
   - Si es nuevo: evento "Subscribe" a Meta Conversions API (`fireMetaSubscribeInBackground`, id de evento `stripe_subscribe_<session id>`).
9. Eventos posteriores se identifican por `stripe_customer_id` (ya no traen el id de usuario).

## 5. Eventos de Stripe manejados

Solo tres (todo lo demas se ignora con 200):
- `checkout.session.completed`: activa (ver arriba).
- `customer.subscription.updated`: segun `status`:
  - `active` o `trialing`: `is_member=true`, limpia fallos de pago, guarda `next_renewal_at` (lee `items.data[0].current_period_end`, con respaldo al campo viejo).
  - `past_due`: gracia (seccion 6), `is_member` NO cambia.
  - Cualquier otro (`unpaid`, `incomplete`, `paused`, etc.): `is_member=false`. Si `unpaid`, marca `payment_failed_at` para excluirlo de campañas.
- `customer.subscription.deleted`: `is_member=false`, limpia banderas de fallo.
- Orden de eventos: `updateByCustomer` solo aplica si `stripe_event_at` es nulo o menor/igual al `created` del evento (evita que un aviso viejo pise uno nuevo).
- NO se manejan: `invoice.payment_failed`, `invoice.paid`, `charge.refunded`, `charge.dispute.created`, ni reembolsos. La logica se apoya solo en el estado de la suscripcion.

## 6. Cobro fallido (gracia de 72 horas)

- Constante `PAYMENT_GRACE_HOURS = 72` en `stripe-webhook.ts`.
- Primer `past_due`: se guarda `payment_failed_at` una sola vez; reintentos no la reinician; `is_member` sigue en true.
- `ensurePaymentFailedEmail` manda un correo amable con `hosted_invoice_url` de la factura abierta (valida que sea del mismo cliente y de `https://invoice.stripe.com/`). Una vez por episodio.
- Cron pg_cron `inglesconleo-payment-grace-sweep` cada 15 min ejecuta `suspend_expired_payment_grace(72)`: pone `is_member=false` a quien lleva mas de 72 h fallando, solo si NO tiene `paypal_subscription_id` ni `mp_preapproval_id`. Revocada para anon/authenticated.
- Recuperacion: al llegar `active`, se limpian las 3 banderas y se reactiva.
- Si falta la migracion (columna inexistente, error 42703/PGRST204): cae al comportamiento viejo, quita acceso de inmediato y reporta error `critical`.

## 7. Que pasa cuando algo falla

- Firma invalida: 400, se registra `reportServerError('webhook', ...)`.
- Excepcion en el webhook: responde 200 para que Stripe no reintente sin parar, registra error `critical` (RPC `log_app_error`, ver `supabase_functions/error-monitoring.sql`). Riesgo: un fallo real queda sin reintento automatico (ver seccion 13).
- Fallo del correo de bienvenida: `is_member` ya quedo activo; el correo se reintenta en el siguiente evento por `ensureMemberWelcome`.
- `stripe-checkout` falla en Stripe: 500 `stripe_error` con `detail`. Plan anual sin `STRIPE_PRICE_ID_ANNUAL`: 400 `annual_not_configured` (no cobra el mensual).
- Webhook llega despues del regreso a `miembros.html`: la pagina reintenta y ofrece "Revisar de nuevo".
- Soporte manual: Supabase Table Editor, editar `profiles.is_member` a mano (documentado en `supabase_schema.sql`).

## 8. Otros procesadores (existen en paralelo)

- Mercado Pago: `supabase_functions/create-checkout.ts` crea la preaprobacion; `mp-webhook.ts` consulta la API real con `MP_ACCESS_TOKEN` (no confia en el cuerpo del aviso), `authorized` activa, `cancelled` o `paused` desactiva. Usa `external_reference` = id de usuario.
- PayPal: `paypal-checkout.ts` y `paypal-webhook.ts`. Verifica firma llamando a la API de PayPal (`PAYPAL_WEBHOOK_ID`). Eventos: `BILLING.SUBSCRIPTION.ACTIVATED`, `RE-ACTIVATED`, `CANCELLED`, `SUSPENDED`, `EXPIRED`, `PAYMENT.SALE.COMPLETED`. Usa `custom_id` = id de usuario.
- Los tres procesadores escriben el mismo `is_member`. Una persona con dos suscripciones activas puede ser desactivada por uno aunque otro siga cobrando (la gracia de 72 h ya lo evita solo para Stripe).

## 9. Libro de $4 (pago unico)

- Venta: boton en `libro-100-errores-comunes-ingles.html` (linea ~357) hacia un Payment Link de Stripe (`buy.stripe.com/...`). No requiere cuenta.
- Tras el pago Stripe redirige a `libro-gracias.html?session_id={CHECKOUT_SESSION_ID}` (configurado en Stripe, no en el repo).
- `libro-gracias.html` hace POST a `.../functions/v1/libro-download` con `session_id`.
- `supabase/functions/libro-download/index.ts`:
  1. Valida formato `cs_(live|test)_...`.
  2. Consulta Stripe `checkout/sessions/<id>?expand[]=line_items`.
  3. Exige `mode=payment`, `payment_status=paid` y un line item con `price.id == LIBRO_PRICE_ID`; si no, 402 `not_paid`.
  4. Pide a Supabase Storage URL firmada de 10 min del bucket PRIVADO `libros`, archivo `Ingles_con_Leo_100_errores_comunes.pdf`. Devuelve `{url}`.
- Se despliega con `--no-verify-jwt` (comprador sin cuenta). CORS limitado a `https://inglesconleo.com`.
- No hay registro de la compra en `profiles` ni correo con el libro. Si la persona cierra la pagina, depende del recibo de Stripe o de volver al enlace con el mismo `session_id`. El `session_id` compartido permite re-descargas (riesgo aceptado en el comentario del archivo).
- Errores: `not_configured` 500 (faltan variables), `bad_session` 400, `session_not_found` 404, `sign_failed` 500.

## 10. Correos transaccionales y de ciclo de vida

- Proveedor: Resend. Remitente `Inglés con Leo <hola@inglesconleo.com>`, reply-to a un Gmail personal (constante `REPLY_TO_EMAIL`).
- Bienvenida de miembro: `stripe-webhook.ts` (tambien `mp-webhook.ts` y `paypal-webhook.ts`).
- Cobro fallido: `ensurePaymentFailedEmail` en `stripe-webhook.ts`.
- Ciclo de vida de cuenta gratis: `supabase/functions/upgrade-nudge-emails/index.ts` (2634 lineas). Cron `inglesconleo-upgrade-nudge-emails` cada 30 min (`supabase_schema.sql` linea ~147), usa header `apikey` y Verify JWT apagado. Correos: welcome (tras 10 min), day1, day3, membership_intro (dia 7), reactivation_day14, final_onboarding (dia 30), long_term (cada 21 dias). Cada uno revisa `is_member` justo antes de enviar. Registro en tabla `lifecycle_emails`.
- Reactivacion de ex miembros: `supabase_functions/member-reactivation-core.mjs`, interruptor `MEMBER_REACTIVATION_V2='on'`; tabla `member_reactivation_log`. Apagado por defecto no envia nada.
- Otros: `streak-reminder-email.ts`, `survey-15d-email.ts`, `send-password-reset.ts`, `notify-new-comment.ts`, `leobot-notify.ts`, `error-alert.ts`.
- Rebotes: `supabase/functions/resend-webhook/index.ts` verifica firma Svix con `RESEND_WEBHOOK_SECRET`. En `email.bounced` o `email.complained` pone `profiles.email_invalid=true` y registra en `member_reactivation_log`. Los correos automaticos saltan a quien tenga `email_invalid`.
- Baja: `baja.html` llama a `email-unsubscribe` (acciones `unsubscribe` y `resubscribe`). Es baja de correos, NO cancelacion de membresia.

## 11. Cancelacion de membresia

- No hay boton de cancelar dentro del sitio ni portal de cliente de Stripe (no se encontro `billing_portal` en `miembros.html`; el codigo del webhook lo descarta a proposito por enlaces que caducan).
- El texto del sitio dice "Cancela cuando quieras". La cancelacion ocurre en el procesador (Stripe via correo/recibo, PayPal, Mercado Pago) y llega por webhook (`customer.subscription.deleted` o equivalente), que baja `is_member`.
- Sin reembolso automatico; los reembolsos no se reflejan en `is_member`.

## 12. Secretos y variables (solo nombres)

Edge Functions (Supabase -> Secrets):
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_ANNUAL`, `LIBRO_PRICE_ID`
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Resend: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESET_EMAIL_FROM`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MODE`, `PAYPAL_PLAN_ID`
- Mercado Pago: `MP_ACCESS_TOKEN`
- Meta CAPI: `META_CAPI_ACCESS_TOKEN`, `META_CAPI_TEST_EVENT_CODE`
- Interruptores y avisos: `MEMBER_REACTIVATION_V2`, `ACADEMIA_ANNOUNCE`, `LEOBOT_NOTIFY_EMAIL`, `COMMENT_NOTIFY_EMAIL`
- En el navegador solo viven la URL de Supabase y la clave publica (en `backend.js`). La URL del proyecto aparece en varios HTML.

## 13. Duplicados de codigo (dos carpetas)

- `supabase_functions/*.ts` (fuente historica, 21 archivos) y `supabase/functions/*/index.ts` (5 funciones desplegables con CLI).
- Iguales: `upgrade-nudge-emails` y `resend-webhook` (0 diferencias).
- DIFERENTE: `stripe-checkout`. La copia de `supabase_functions/stripe-checkout.ts` es mas nueva: en `action='mark'` consulta `is_member` y no registra intento de compra si ya es miembro. La de `supabase/functions/stripe-checkout/index.ts` no lo tiene. Hay que confirmar cual esta desplegada.
- `stripe-webhook`, `mp-webhook`, `paypal-webhook`, `create-checkout`, `paypal-checkout`, `email-unsubscribe` solo existen en `supabase_functions/` (se despliegan manualmente, probablemente pegando en el panel).

## Como modificar sin romper

- Cambiar precio: crear un Price nuevo en Stripe, actualizar `STRIPE_PRICE_ID` o `STRIPE_PRICE_ID_ANNUAL` en Secrets, y cambiar textos en `index.html` (#planes y meta), `miembros.html` (meta, selector, `value` de analytics lineas ~1010), `LANZAMIENTO_TO_BE.md` si aplica. Los clientes viejos conservan su precio.
- Cambiar logica de acceso: tocar solo `is_member` desde webhooks. Nunca darle a `authenticated` permiso de update sobre `is_member` o columnas de pago (hay migraciones de endurecimiento: `20261014182848_harden_profiles_anon_and_function_grants.sql`).
- Antes de tocar `stripe-webhook.ts`: aplicar migraciones de columnas primero (como indica `payment_grace.sql`) y probar con Stripe CLI en modo prueba. Mantener la respuesta 200 en errores y la verificacion de firma.
- No cambiar `client_reference_id` ni `external_reference` / `custom_id`: es el unico vinculo pago a usuario.
- Mantener sincronizadas ambas carpetas de funciones; decidir una sola fuente.
- Despliegue de `libro-download`: siempre con `--no-verify-jwt`; no hacer publico el bucket `libros`.
- Tras cualquier cambio en `miembros.html`: probar mensual, anual, regreso `?stripe=success` y webhook lento, en movil.
- Las funciones con cron (`upgrade-nudge-emails`) usan `apikey` y Verify JWT apagado; un redeploy con JWT activo las rompe en silencio.

## Riesgos y pendientes detectados

1. Version desplegada de `stripe-checkout` incierta (ver seccion 13); el codigo del repo difiere entre carpetas.
2. Webhook devuelve 200 aun en excepciones: un fallo al activar a un cliente que ya pago no se reintenta. Solo queda el registro de errores y el resumen diario (`inglesconleo-error-digest`). Conviene devolver 500 en fallos de base de datos al activar, o una tarea de conciliacion contra Stripe.
3. Sin manejo de `invoice.payment_failed`, reembolsos ni disputas: un reembolso o contracargo no quita la membresia.
4. Sin boton de cancelar ni portal de cliente: carga de soporte y riesgo de contracargos por no encontrar como cancelar.
5. Conflicto multi procesador: un webhook de MP o PayPal puede poner `is_member=false` a quien aun paga por Stripe (y viceversa); solo la barrida de gracia lo considera.
6. Barrera de acceso en el cliente: paginas de miembros son archivos publicos; solo esta protegido lo que sirve Supabase. Verificar que las politicas RLS cubran todo contenido premium.
7. `stripe-checkout` tiene CORS `*` y confia en el token del usuario; correcto, pero no hay limite de frecuencia por usuario (solo antirrebote de 10 min en analitica).
8. Libro: sin registro de compradores, sin correo con el enlace, y `session_id` reutilizable. Considerar correo automatico o guardar compras.
9. Reply-to de todos los correos apunta a un Gmail personal; si deja de revisarse, se pierden respuestas de clientes con problemas de pago.
10. Correo de cobro fallido y de bienvenida duplican logica en tres webhooks; un cambio de marca debe hacerse en cada uno.
11. `webhook` de Stripe: si `RESEND_API_KEY` o `STRIPE_WEBHOOK_SECRET` faltan, `!` no falla al arrancar; la funcion rechaza todo con firma invalida (para el webhook) o no manda correos. Revisar secretos tras cada migracion de proyecto.
12. Archivos de trabajo en la raiz (`_push.patch`, `_to_delete`, `41c1350951c5e79e95e8a4d0b5c84112.txt`) no pertenecen al flujo de pagos pero conviene revisar que no contengan datos sensibles.


======================================================================
# Auditoria 03: Base de datos Supabase

Alcance: lectura de `supabase_schema.sql` (1113 lineas), `supabase/migrations`, `supabase/rollback`, `supabase/verify`, `supabase_functions/*.sql`, `tools/respaldo_supabase.sh`, `tools/informe_*.sql` y el uso desde JS/TS. No se consulto la base real, solo el repo. Lo que dependa del estado vivo se marca como "por confirmar".

## Donde vive cada cosa
- `supabase_schema.sql`: esquema base acumulado (profiles, progress_sessions, survey_responses, article_comments, mistake_stats, leobot_reports, member_reactivation_log, triggers, guards). Es un archivo historico con bloques "Actualizacion fecha" agregados al final; no es la fuente unica de verdad.
- `supabase/migrations/` (23 archivos, prefijo `AAAAMMDDHHMMSS_`): cambios posteriores. Se corren A MANO en Supabase > SQL Editor (lo dice el DEVLOG y `ACADEMIA_INTEGRACION.md`). No hay `supabase db push` en el flujo.
- `supabase_functions/*.sql`: `leo-ai.sql` (leo_ai_config, leo_ai_testers, ai_usage, ai_usage_daily, leo_ai_requests) y `error-monitoring.sql` (app_errors, app_error_hourly, app_error_rate, log_app_error). Aqui viven tablas que NO estan en `supabase_schema.sql`.
- `supabase_functions/*.ts`: copias historicas de Edge Functions (stripe-webhook, paypal-webhook, mp-webhook, submit-survey, etc.). `supabase/functions/` solo trae 5 funciones (leo-ai, libro-download, resend-webhook, stripe-checkout, upgrade-nudge-emails). Hay dos carpetas con funciones, ver riesgos.
- `supabase/rollback/`: `academia_integracion_rollback.sql`, `academia_demo_independiente_rollback.sql` (solo la Academia).
- `supabase/verify/`: 11 SQL de verificacion y prueba de cursos Academia (por curso, mas `academia_verificacion.sql` y `prueba_real_curso3_entorno_minimo.sql`).
- `tools/tests/`: pruebas en Postgres embebido (`academia-sql.test.js`, `progress-sessions-guard.test.sql`, etc.).

## Mapa de tablas (campos clave, quien lee/escribe)
Notacion: L = lee, E = escribe. RLS siempre activada salvo indicacion.

### Cuenta y progreso
- `profiles` (id = auth.users.id, on delete cascade)
  - Campos: `email`, `is_member`, `member_since`, `stripe_customer_id` (unico), `paypal_subscription_id` (unico), `level` (principiante|facil|medio|avanzado), `level_source` (self|skipped|suggested|history|test), `onboarded_at`, `display_name`, `last_seen_at`, `last_practice_at`, `free_daily_count`, `free_daily_date`, `free_first_exercise_at`, `free_daily_limit_reached_at`, `free_last_practice_at`, `checkout_started_at`, `next_renewal_at`, `email_opt_out_at`, `lifecycle_emails` (jsonb), `upgrade_email_1/2/3_sent_at`, `survey_15d_*`, `streak_reminder_*`, `welcome_*`, `member_welcome_*`, `payment_failed_at`, `payment_failed_email_sent_at`, `payment_failed_email_claimed_at`, `stripe_event_at`.
  - Navegador (backend.js): L `getMemberProfile` (l.237, select *), E `saveProfileToCloud` (l.276), `saveDisplayName` (l.318), ping `last_seen_at` (l.339), `bumpFreeDailyCount` (l.365/381), `last_practice_at` (l.484). Solo columnas con `grant update (...)` a authenticated (level, onboarded_at, level_source, free_last_practice_at, display_name, etc.). `is_member` NO es escribible por el navegador.
  - Servidor: stripe-checkout (L, l.115), upgrade-nudge-emails (L/E, muchas), resend-webhook, leo-ai (L, l.726), webhooks de pago (E is_member, member_since, payment_failed_*).
- `progress_sessions` (una fila por sesion terminada)
  - Campos: `user_id`, `skill`, `level`, `topics` jsonb, `date`, `started_at` bigint, `duration_ms`, `results` jsonb, `tier` ('free' o NULL), `created_at`.
  - Indice unico `(user_id, started_at, skill)` evita duplicados por reintento. Constraints: max 500 respuestas y 100 KB por fila, topics 4 KB, skill 1 a 40 y level 1 a 20 caracteres.
  - Trigger `progress_sessions_guard` (security definer): fija `tier` segun `is_member` (nunca el navegador), fija `created_at = now()`, limita gratis a 60 respuestas por fila y 40 filas/24 h; miembros 300/24 h. service_role no se limita.
  - Navegador: E `pushSession` (backend.js l.462) y `pushFreeSession` (l.501); L `syncProgressFromCloud` (l.396), `getLatestSessionLevel` (l.298). authenticated solo SELECT e INSERT; sin UPDATE/DELETE. Tambien la lee upgrade-nudge-emails (l.2360).
- `mistake_stats` (errores por ejercicio)
  - Campos: `user_id`, `item_id`, `kind`, `topic`, `fail_count`, `correct_streak`, `status` (active|recovered|mastered), `last_correct`, `recovered_at`, `last_seen_at`. Unico `(user_id, item_id)`. Admite `kind='academia'`.
  - Navegador: L `getMistakeStats` (l.535), E solo via RPC `apply_mistake_results(p_items jsonb)` (l.553). Tambien la lee upgrade-nudge-emails (l.2379).

### Contenido y comunidad
- `article_comments`: comentarios de articulos (select all, insert con politica, delete solo admin). backend.js l.807/834/863.
- `survey_responses`: encuesta de 15 dias (`q1..q4`, unico por `user_id`). Sin acceso directo; escribe `submit-survey` (service key).
- `leobot_reports`: reportes del chatbot (`type` bug|support, `message`, `page_url`, `context`, `status`). Insert abierto con limites de tamano. backend.js l.905 (`submitLeobotReport`).
- `member_feedback`, `member_feedback_state`: encuesta de satisfaccion a miembros. Via RPC `member_feedback_status`, `submit_member_feedback`, `dismiss_member_feedback` (backend.js l.931 a 967). SELECT propio.

### Correo y operacion (solo service key)
- `member_reactivation_log`: bitacora de reactivacion (event sent|skipped|cancelled_returned|clicked, `dedupe_key` unico por usuario). Escriben upgrade-nudge-emails y resend-webhook. Vista `member_reactivation_results` (security_invoker).
- Vistas de informe: `weekly_activation_report`, `activation_followup_report`, `first_session_report` (migraciones 20261013 y 20261014), solo lectura, `security_invoker`.
- `app_errors`, `app_error_hourly`, `app_error_rate`: monitoreo de errores. Flujo: navegador > report-error > `log_app_error()` > correo. Resolver: `update app_errors set status='resolved'`.
- IA de Leo: `leo_ai_config`, `leo_ai_testers`, `leo_ai_requests`, `ai_usage`, `ai_usage_daily` (supabase_functions/leo-ai.sql) y `leo_ai_trial` (migracion 20261016001253). RPC `leo_ai_reserve`, `leo_ai_begin`, `leo_ai_finish`, `leo_ai_record`, `leo_ai_trial_status`, `leo_ai_trial_report`. Las llama la funcion `leo-ai`.

### Academia (migracion 20261026120000 y siguientes)
- `academia_courses` (`course_id`, `enabled`, `members_only`, `pass_pct`, `exam_size`, `engine_topic`, `demo_items`, `session_level`): lectura para authenticated, sin escritura. Cada curso nuevo se da de alta con su migracion `academia_curso_*`.
- `academia_progress` (PK `user_id, course_id`; `state` jsonb max 60 KB, `version`, `demo_started_at`, `demo_done_at`, `demo_session_at`). Escribe solo la RPC `academia_save_progress(p_course, p_state, p_base_version)` con control de version; en conflicto devuelve `conflict` y el cliente fusiona y reintenta (academia-nube.js l.138 a 150). Lee tambien `inicio-alumno.js` l.53.
- `academia_mistake_batches`: idempotencia de errores enviados al motor (`academia_apply_batch`, `academia_apply_mistakes`, `academia_retry_pending`).
- `academia_exam_items`, `academia_exam_attempts`, `academia_badges`: examen y insignia. RPC `academia_exam_status/start/submit`. `academia-nube.js` l.334 lee badges.
- `academia_content` y RPC `academia_get_content(p_course)`: contenido protegido solo para miembros vigentes (migracion 20261028180000).
- RPC de acceso y demo: `academia_access`, `academia_demo_start`, `academia_demo_finish`, `academia_record_session` (guarda en `progress_sessions` con nivel decidido por el servidor), `academia_free_daily_limit()` (devuelve 6; debe coincidir con `FREE_USER_DAILY_LIMIT` de app.js, hay una prueba que lo compara).
- Pago: `suspend_expired_payment_grace(p_hours default 72)` con tarea programada (migracion 20261020160000); `internal_secret_ok(p_secret)` para llamadas internas de cron.

## Storage (buckets)
- `libros` (PRIVADO): guarda `Ingles_con_Leo_100_errores_comunes.pdf`. La funcion `libro-download` verifica en Stripe que la sesion este pagada (`mode=payment`, producto `LIBRO_PRICE_ID`) y devuelve un enlace firmado de 10 minutos con la service key. Se despliega con `--no-verify-jwt` (el comprador no tiene cuenta). El bucket NO se crea en ninguna migracion del repo: se creo a mano en el panel (por confirmar que no tiene politicas publicas).
- `academia-audio` (privado): lo crea la migracion 20261028180000 solo si existe `storage.buckets`. Politica `"academia_audio: miembros"` (select, authenticated) con `academia_audio_allowed(name)`; la carpeta es el curso (`<curso>/<hash>.mp3`). El cliente pide URLs firmadas de 15 min (`createSignedUrls`, academia-nube.js l.322).

## Politicas RLS (resumen)
- `profiles`: select propio y update propio limitado por columnas (la politica "update own" que permitia autoproclamarse miembro fue eliminada; revisar que `supabase_schema.sql` no la vuelva a crear). `anon` sin escritura.
- `progress_sessions`, `mistake_stats`: select e insert propios (mistake_stats ademas update propio y RPC).
- `article_comments`: select abierto, insert con politica, delete admin.
- `leobot_reports`: solo insert (sin select).
- `survey_responses`, `member_reactivation_log`, vistas, `leo_ai_*`: sin politicas ni permisos para anon/authenticated (solo service_role).
- Endurecimiento del 2026-10-14: sin TRUNCATE para anon/authenticated y funciones `security definer` con `revoke all ... from public, anon, authenticated`.

## Sincronizacion de progreso
- Fuente local: localStorage (`LS_P`). La nube es la fuente entre dispositivos.
- Entrada: `syncProgressFromCloud()` (backend.js l.390) hace select de todas las `progress_sessions` del usuario ordenadas por `started_at` y las fusiona con el progreso local (`loadProgress`). Se omite sin sesion o si `ownerOk(session)` falla (evita mezclar datos de otra cuenta en el mismo navegador).
- Salida: `pushSession` (miembros) y `pushFreeSession` (cuentas gratis, con `expectedUserId`). El unico `(user_id, started_at, skill)` hace idempotentes los reintentos.
- "inflight": NO es una tabla. Es una sesion a medias guardada solo en localStorage con clave `leo_inflight_<skill>_<level>` (app.js l.2180 a 2191: `saveInflightSession`, `loadInflightSession`, `clearInflightSession`; usado en gramatica y vocabulario). No se sincroniza entre dispositivos; si se cambia de navegador, se pierde la sesion en curso.
- Errores: `apply_mistake_results` actualiza `mistake_stats` con la RPC; la Academia usa cola sin conexion y `academia_retry_pending`.
- Academia: `academia_progress` con `version`; conflicto = fusion en cliente. Sesiones de lecciones entran a `progress_sessions` via `academia_record_session`.

## Respaldo (`tools/respaldo_supabase.sh`)
- Uso: `SUPABASE_DB_URL='postgresql://postgres.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:5432/postgres' bash tools/respaldo_supabase.sh`.
- Hace: 1) `pg_dump --schema-only` de public, auth y storage; 2) dump completo `-Fc` (`datos.dump`); 3) conteos de profiles, progress_sessions, mistake_stats y auth.users; 4) `pg_restore --list` y comprueba que existan las 3 tablas; si hay Docker, restaura en un Postgres 17 temporal (puerto 55432) y compara conteos.
- Salida en `~/respaldos-supabase/<fecha>/` (fuera del repo, con datos personales: no subir a ningun lado). Requiere pg 17 o Docker.
- No respalda: objetos de los buckets (PDF del libro, audios de la Academia), secretos de Edge Functions, ni la configuracion de Auth/cron. Solo el esquema `storage` (metadatos), no los archivos.

## Como se aplica una migracion (flujo real)
1. Respaldo verificado (`respaldo_supabase.sh`).
2. Revisar dependencias en solo lectura (las migraciones de Academia abortan con excepcion si faltan columnas esperadas en profiles, progress_sessions, mistake_stats).
3. Probar en Postgres embebido (`tools/tests/*.test.js`).
4. Pegar el archivo de `supabase/migrations/` en SQL Editor. Casi todas son aditivas e idempotentes (`if not exists`, `on conflict do nothing`, `create or replace`).
5. Correr el archivo de `supabase/verify/` correspondiente.
6. Orden critico cuando hay Edge Function: aplicar el SQL ANTES de desplegar la funcion (ejemplo `payment_grace`).
7. Deploy de funciones: `npx supabase functions deploy <nombre> [--no-verify-jwt] --use-api`.
8. Rollback solo existe para Academia (`supabase/rollback/`).

## Informes (`tools/*.sql`)
- `informe_conversion.sql`, `informe_oferta.sql`, `informe_academia_24h.sql`: un unico SELECT que devuelve JSON, se corren en SQL Editor, solo lectura. Excluyen 2 cuentas de prueba por UUID fijo. `informe_oferta.sql` tiene fecha de corte `2026-11-09 17:08:16+00` y se edita a mano. `informe_academia_24h.sql` usa `desde/hasta` del lanzamiento.

## Como modificar sin romper
- Siempre agregar un archivo nuevo en `supabase/migrations/` con timestamp mayor al ultimo (hoy 20261104143100). Nunca editar uno ya aplicado.
- Hacerlo aditivo e idempotente. Para columnas nuevas de `profiles` que el navegador escriba, agregar el `grant update (columna)` puntual; no dar update de tabla completa (abriria `is_member`).
- Toda funcion `security definer`: `set search_path = public` y `revoke all ... from public, anon, authenticated`; dar `grant execute` solo a `authenticated` si es RPC del navegador.
- Tabla nueva: `enable row level security`, `revoke all from anon`, politicas explicitas; si es solo del servidor, sin politicas.
- No cambiar el limite gratis (6) en un solo lado: `academia_free_daily_limit()` y `FREE_USER_DAILY_LIMIT` en app.js deben coincidir.
- No tocar el indice unico de `progress_sessions` ni los CHECK de tamano: el cliente depende de ellos para reintentos.
- Orden: SQL primero, luego Edge Function, luego JS que lo use.
- Antes de cualquier cambio: correr `tools/respaldo_supabase.sh` y despues el verify del area.
- Mantener `supabase_schema.sql` solo como referencia; no correrlo completo sobre produccion sin revisar.

## Riesgos y pendientes detectados
- Duplicidad de fuentes de verdad: tablas en tres lugares (`supabase_schema.sql`, `supabase/migrations/`, `supabase_functions/*.sql`) y funciones en dos carpetas (`supabase_functions/` y `supabase/functions/`). Alto riesgo de que un archivo quede desactualizado respecto a la base real (el DEVLOG ya reporto una politica peligrosa que seguia en el archivo).
- Las migraciones se aplican a mano; no hay tabla de historial en el repo que garantice cual esta aplicada. Dos migraciones (20261014163304 y 20261014182848) indican "aplicada en Supabase, archivo creado despues", prueba de que repo y base pueden divergir.
- Sin rollback para migraciones fuera de la Academia.
- El bucket `libros` no esta definido como codigo: si se pierde, hay que recrearlo a mano y resubir el PDF. Tampoco esta cubierto por el respaldo (solo metadatos).
- El respaldo es manual; no hay programacion ni copia fuera del equipo. Confirmar si Supabase tiene backups diarios activos (depende del plan; por confirmar).
- La sesion "inflight" vive solo en localStorage: se pierde al cambiar de dispositivo o limpiar el navegador.
- `libro-download` con `--no-verify-jwt`: cualquiera con un `session_id` valido puede redescargar; riesgo aceptado en el comentario del archivo.
- Informes con UUIDs de prueba y fechas fijas: hay que editarlos a mano en cada uso.
- Mantenimiento: `supabase/functions/upgrade-nudge-emails/index.ts` supera 2600 lineas con muchas consultas directas a `profiles`; cualquier cambio de columnas de `profiles` puede romperlo en silencio.
- Pendiente de verificar contra la base viva: que no existan politicas de update amplias en `profiles`, que `libros` no sea publico y que las tareas programadas (`suspend_expired_payment_grace`, correos) sigan activas.


======================================================================
# Auditoria 04: motor de practica gratis y de miembros

Alcance: app.js (564 KB, ~405 funciones de nivel raiz), data.js (1 MB), paginas de practica, temas.js, mini-lecciones.js, inicio-alumno.js, survey.js, error-monitor.js. Solo lectura. Las cifras de los bancos se midieron ejecutando data.js en node (sin modificar nada).

## Resumen
- Todo es JS del navegador. El contenido vive en data.js y la logica en app.js; Supabase solo guarda progreso, perfil y contadores.
- Hay DOS motores paralelos que no comparten codigo de sesion: gratis (`runFree*Session`) y miembros (`run*Session`).
- Gratis vs miembro difiere en contenido (variantes bloqueadas), limite diario y guardado (miembro: progreso local y nube completo; cuenta gratis: una fila por sesion; invitado: nada).
- Los 6 bancos suman 1581 ejercicios, 0 ids duplicados, 0 `correct` fuera de rango, 0 audios faltantes.
- El gating real de miembros es `guardMemberPage()` (backend.js) contra `profiles.is_member`. Existe codigo heredado con codigo de acceso fijo (ver riesgos).
- Hay muchas pruebas en `tools/tests/` (node) que protegen buena parte de esto.

## Mapa de app.js por secciones (lineas aproximadas)
- 12-24: `localDateStr()`, fecha local, nunca UTC.
- 26-183: `LeoScope`, almacen por cuenta. `LS_P` (linea 116) es el localStorage de la cuenta; clave real `<clave>@@u:<id Supabase>`.
- 184-347: perfil, onboarding y nivel en la nube.
- 348-653: header de miembros, menu movil, LeoBot.
- 654-724: acceso heredado (`ACCESS_CODE`, `isMemberUnlocked`, `requireMember`, `personalizeNav` en 672, `initAccessGate`).
- 725-1474: progreso (`PROGRESS_KEY='leo_progress_v2'`, `loadProgress` 850, `saveProgressRaw` 861), instrumentacion de respuestas, microtemas, `recordSession` (1290), `bankSizeFor`, `MIX_NOMINAL_SIZE=8` (1462).
- 1475-1510: `MEMBERS_ONLY_VARIANT_INDEX` (1489), `pickVariantIndex`.
- 1511-1625: `SESSION_LENGTHS` (1516), selector de duracion.
- 1626-1711: `flattenVariant`, `shuffleArray`, `buildSessionPool` (1670), `rebuildPoolFromVariantIdxs` (1699).
- 1712-1887: mazo barajado de miembros: `memberBankItems`, `computeCycleState`, `pickCycleItems`, `pickCycleItemsByTopic`, `resolveMemberPool` (1868).
- 2160-2330: `saveInflightSession` (2181), `loadInflightSession` (2184), `clearInflightSession` (2190), `shuffleOptions` (2310).
- 2257, 2543, 2624, 2720, 3466, 3589: `runGrammarSession`, `runVocabSession`, `runListeningSession`, `runReadingSession`, `runWritingSession`, `runSpeakingSession` (miembros).
- 3955-4153: limites gratis (`GUEST_EXERCISE_LIMIT`, `FREE_USER_DAILY_LIMIT`, `initLeoAccessTier`, contadores, `freeDailyLimitReached`, `bumpFreeDailyExerciseCount`).
- 4154-4300: subida de sesiones de cuenta gratis (`freeSessionBegin/Answer/End/Resume`, `flushFreeSessions`, `FREE_PENDING_KEY`).
- 4301-4636: memoria de aprendizaje gratis (`freeMemoryBoost`, `freeSampleApply`, `freeSessionCap`), `runMixSessionCore` (4569), `runMixSession`, `runFreeMixSession`.
- 5029-5311: Plan de estudio (`runPlanSessionCore` 5256). 5692: mapa debilidad a contenido. 5712: temas de gramatica.
- 6036-6240: Mis errores (`runMistakesSessionCore`), reto diario (`runDailyChallengeSession` 6239).
- 6359 resumen de sesion; 6587 dashboard v2; 7397 refuerzo; 8116 "Practicar este tema" desde clases.
- 9263-9732: sesiones gratis `runFreeGrammarSession` (9264), Vocab (9322), Listening (9398), Writing (9490), Speaking (9601).
- 9733 `initFreePractice`. 9889 `initMemberPractice`. 9963 `renderDailyMiniLesson`.

## data.js: estructura de los bancos
- `LEVELS = ['principiante','facil','medio','avanzado']`; `LEVEL_META` trae label, rango (A0, A1-A2, B1-B2, C1+) y `audioFolder` (a0, a1, b1, c1).
- Cada banco es `BANK[nivel] = [variante, variante, ...]`. Una variante es un bloque fijo de ejercicios.
- `GRAMMAR_BANK` (linea 29): variante = lista de temas `{ topic, items:[...] }`. Item: `id`, `type` ('choice' | 'fill' | 'error'), `prompt`, `options`, `correct`, `translation`, ejemplos y opcional `micro`.
- `VOCAB_BANK` (3381): `{ id, word, translation, examples[], quiz:{prompt, options, correct, explain} }`.
- `LISTENING_BANK` (5007): `{ id, audioFile, transcript, translation, question, options, correct, explain }`.
- `READING_BANK` (5810): `{ id, passageId, title, passage, translation, question, options, correct, explain }`. Varias preguntas comparten pasaje.
- `SPEAKING_BANK` (6280): `{ id, sentence, translation, audioFile }`.
- `WRITING_BANK` (6558): `{ id, prompt, target, checkPattern (regex), hint, example, checklist[] }`.
- Tambien `GRAMMAR_CHECK_BANK` (3374, hoy vacio), `CLASS_CATALOG` (7480), `CLASSES_BANK` (7510).
- Ids: `g-<nivel>-<tema>-<n>`, `v-<nivel>-<n>`, `l-`, `s-`, `w-`, `r-`. Los lotes grandes usan sufijos `-m400-` o `-m200-`. El nivel avanzado mezcla `avz` y `avanzado`.

Tamano medido (variantes / ejercicios), de principiante a avanzado:
- Gramatica: 11/96, 14/145, 14/160, 14/96.
- Vocabulario: 11/84, 15/110, 15/106, 14/96.
- Listening: 14/51, 19/68, 16/53, 16/51.
- Lectura: 5/24 en cada nivel.
- Speaking: 12/40, 13/43, 13/37, 13/35.
- Writing: 9/46, 13/60, 13/55, 13/53.

## Una sesion de Miembros, punta a punta (ejemplo gramatica)
1. `gramatica.html` carga data.js, temas.js, app.js, backend.js y llama `guardMemberPage(fn)`. `requireMemberAsync()` verifica sesion Supabase e `is_member`; si falla, redirige. Si pasa, arranca `runGrammarSession({container, level})`.
2. `runGrammarSession` lee `loadInflightSession('gramatica', level)` (clave `leo_inflight_<skill>_<nivel>` en `LS_P`). Si hay una a medias con `idx < total`, se retoma siempre, aunque la duracion haya cambiado.
3. `resolveMemberPool`:
   - Con `saved.itemIds`: reconstruye por id; si el banco cambio y el conteo no coincide, arma sesion nueva.
   - Con `saved.variantIdxs` (formato viejo): `rebuildPoolFromVariantIdxs`.
   - Sesion nueva: tamano `SESSION_LENGTHS[getSessionLength()].items` (corta 5, media 9 por defecto, larga 15). `computeCycleState(loadProgress(), ids, tailSize)` reconstruye del historial que ejercicios ya salieron en el ciclo actual; `pickCycleItems` (o `pickCycleItemsByTopic` en gramatica, que arma con temas completos) elige los que faltan, barajados.
   - No hay estado de mazo guardado aparte: el ciclo se deriva de `progress.sessions[].results[].itemId`. Los ejercicios nuevos del banco entran solos.
4. `renderItem` guarda el inflight en cada pregunta `{variantIdxs, itemIds, total, idx, results, startedAt}`, dibuja el item (`renderGrammarItemInto`) y al responder hace `results.push({itemId, isCorrect})`. `showRetryOrNextButtons` permite "Volver a intentar" (`popRetried` reemplaza el fallo).
5. `finish`: `clearInflightSession`, luego `recordSession({skill, level, topics, results, startedAt})` y `renderSessionSummary`.
6. `shuffleOptions(options, correctIndex)` baraja las opciones al dibujar para que la correcta no caiga siempre en A. No muta el item original.

## Como se guardan los resultados (`recordSession`, linea 1290)
- `ensureDerived()` pone al dia las cachés con lo que llego de la nube.
- Arma `session = {skill, level, topics, date (local), startedAt, durationMs, results}`. `instrumentResults` agrega marcas por respuesta (`m` micro, `p` opcion elegida, `t` intento, `w` primer error, `f` primera vez).
- Efectos: `markChecksConsumed`, `updateMicroStats`, `p.sessions.push`, `p.lastActivity`, `saveProgressRaw` (localStorage por cuenta, `leo_progress_v2`), `stampDerived`.
- Nube: `LeoBackend.pushSession(session)` (tabla `progress_sessions`) si el backend esta configurado. Luego `updateMistakeStatsFromResults`.
- Primera sesion de la cuenta: `trackFirstSessionOnce('member')`.
- `loadProgress` migra fechas y deduplica sesiones al leer.

## Una sesion gratis, punta a punta
1. `practica.html` primero consulta `LeoBackend.getMemberProfile()`. Si `is_member`, redirige a `practica-miembros.html` conservando `?skill=` y `?level=`.
2. Si hay cuenta gratis: `initLeoAccessTier('free', profile)`. Si no, queda 'guest' (el limite mas chico es el default seguro).
3. `initFreePractice` llama `freeSessionResume()` (sube lo que haya quedado), lee `?skill=` (grammar, vocabulary, listening, speaking, writing, mix) y `?level=`, y usa `RUNNERS` = `runFree*Session`. La cuenta gratis arranca en su nivel; el invitado en Facil.
4. `runFreeGrammarSession`: `freeSessionBegin`; `pickVariantIndex(skill, level, n, MEMBERS_ONLY_VARIANT_INDEX[...])` elige UNA variante abierta (evita la ultima usada y las bloqueadas). Despues `freeSampleApply` (cambia 2 ejercicios por una muestra de contenido de miembros), `freeMemoryBoost` (refuerza temas flojos de la cuenta) y `freeSessionCap` (recorta al cupo que queda del dia).
5. En cada "Siguiente": `bumpFreeDailyExerciseCount()` y `freeSessionAnswer(...)`. Antes de dibujar cada item se revisa `freeDailyLimitReached()`; si se alcanzo, muestra `renderFreeDailyLimitReachedBlock`.
6. `finish`: `freeSessionEnd` y `renderFreeSessionSummary`. NO llama `recordSession`: la sesion gratis no toca `leo_progress`, ni mistake_stats, ni microtemas.

## Gratis vs miembro
- Invitado: 3 ejercicios por dia (`GUEST_EXERCISE_LIMIT`), no guarda nada en la nube.
- Cuenta gratis: 6 por dia en total (`FREE_USER_DAILY_LIMIT`). Hay UN contador por navegador y dia (`leoLocalDailyCount:<fecha>`); para cuenta gratis se toma el MAYOR entre el local y `profiles.free_daily_count` (nunca se suman). Sube una fila por sesion via `LeoBackend.pushFreeSession` (borrador en `leo_free_pending_v1`, max 8, 14 dias, 5 intentos; la base rechaza duplicados).
- Miembro: sin limite, todas las variantes, ciclo barajado, sesion retomable, progreso completo, Plan de estudio, Mis errores, Leo AI.
- Contenido bloqueado: `MEMBERS_ONLY_VARIANT_INDEX`, por indice fijo de variante (ej. gramatica facil `[6,8,9,10]`, listening facil `[10,12,13,14]`, speaking principiante `[5,7,8]`). No incluye lectura (no hay version gratis de Lectura).
- El limite del cliente no es candado de seguridad (localStorage); el propio codigo lo reconoce.
- Si cambian los limites: tocar las 2 constantes, el correo `supabase_functions/upgrade-nudge-emails.ts` (copy fijo) y redesplegar.

## Paginas
- `practica.html` (466 lineas): gratis; no tiene `noindex` (indexable). Es la unica que carga `toefl-data.js`.
- `practica-miembros.html`: `initMemberPractice` (9889), mismas pestañas con runners reales, `noindex`.
- `mixto.html`, `gramatica.html`, `lectura.html`, `errores.html`, `plan-estudio.html`, `progreso.html`, `listening.html`, `speaking.html`: `noindex` y con `guardMemberPage`. Llaman `runMixSession`, `runGrammarSession`, `runReadingSession`, `runMistakesSession`, plan y dashboard, etc.
- `speaking.html` y `lectura.html` NO cargan temas.js; app.js lo tolera con chequeos `typeof TEMA_BY_ID`.
- `progreso.html` carga ademas `academia-cursos.js` e `inicio-alumno.js` (tarjeta Academia: solo lee; el avance sale de `academia_progress`).
- Cada script lleva `?v=` manual (data 20261108a, temas 20261109b, app 20261109h, backend 20261109a).

## Otros archivos
- `temas.js` (45 KB): registro central `TEMAS` (id, family, article, glossary, prereq, micros). Define `TEMA_BY_ID`, `TEMA_BY_TOPIC`, `temaForTopic`, `canonicalTemaId`, `MICROS`, `vocabGroupOf` (deriva el grupo del id `v-<grupo>-<n>`), `WRITING_TEMA_BY_ITEM`, `GUIDE_BY_SKILL_LEVEL`. Todo `topic` de GRAMMAR_BANK debe estar aqui (lo exige `tools/tests/temas.test.js`).
- `mini-lecciones.js`: GENERADO por `tools/generar_mini_lecciones.js`; no editar a mano. Solo lo carga `index.html`; `renderDailyMiniLesson` elige una al azar (decorativo).
- `survey.js` + `encuesta.html`: encuesta de 15 dias de membresia; link con `?t=<token>`; POST a la Edge Function `submit-survey` con la anon key publica (normal). `noindex, nofollow`.
- `error-monitor.js`: primer script de cada pagina; captura errores JS, promesas, recursos rotos y 5xx de Supabase, limpia datos personales, topes 10 por pagina, 30 por pestaña, cola 5; envia a la Edge Function `report-error`. Solo en inglesconleo.com, todo en try/catch.
- `inicio-alumno.js`: tarjeta "Continuar curso" de la Academia en miembros.html; regla documentada en su cabecera.

## Como agregar contenido nuevo de forma segura
1. Escribir el ejercicio en la variante y nivel correctos de data.js con id UNICO y el patron del lote (`-mNNN-`). Nunca reutilizar ni renombrar ids existentes: el historial (`itemId`) los usa para ciclo, errores y microtemas.
2. Solo-miembros: agregar una variante NUEVA al final del arreglo del nivel y sumar su indice a `MEMBERS_ONLY_VARIANT_INDEX` (app.js 1489). Gratis: agregarla sin tocar esa lista. Nunca insertar variantes en medio (los indices son fijos).
3. Gramatica: usar un `topic` que exista en temas.js, o agregarlo a `TEMAS.topics` en la misma entrega. Opcional `micro:'<id>'`; los ids de micros no se renombran (`micro-ids.lock.json`).
4. Vocabulario: el id debe seguir `v-<grupo>-<n>`; el grupo se mapea a un tema en `TEMA_BY_VOCAB_GROUP`.
5. Audios: crear el mp3 con los scripts de `tools/` y verificar que `audioFile` exista (hoy 0 faltantes).
6. Writing: probar el `checkPattern` (regex en minusculas) con respuestas buenas y malas.
7. Correr desde la carpeta del sitio: `node tools/tests/data-quality.test.js`, `temas.test.js`, `micros.test.js`, `session-cycle.test.js`, `free-sessions.test.js`.
8. Subir el `?v=` de data.js en TODAS las paginas que lo cargan (si no, cache vieja y mezcla de versiones con app.js).
9. Probar en el telefono una sesion gratis y una de miembros, y anotar en DEVLOG.txt.

## Como modificar sin romper
- No cambiar ids de ejercicios, `PROGRESS_KEY` ni la forma `{itemId, isCorrect, ...}` de los results: rompe ciclo, errores, microtemas y la nube.
- No tocar `LS_P`/`LeoScope` ni leer localStorage directo para datos personales (aislamiento entre cuentas; test `aislamiento-cuentas.test.js`).
- Limites gratis: solo `GUEST_EXERCISE_LIMIT` y `FREE_USER_DAILY_LIMIT`; usar `freeDailyLimitReached` y `bumpFreeDailyExerciseCount`, nunca los contadores a mano.
- Largo de sesion: `SESSION_LENGTHS` (items y `sub`) y los textos fijos "8 preguntas..." de `SKILL_DESC` en ambos orquestadores.
- Los motores `runFree*` y `run*` estan duplicados a proposito: un arreglo de logica de sesion casi siempre hay que replicarlo en ambos.
- Fechas: siempre `localDateStr()`, nunca `toISOString().slice(0,10)`.
- Todo cambio en app.js o data.js exige subir `?v=` en las paginas que los cargan; app.js es enorme, editar por rangos y correr los tests.
- `mini-lecciones.js` se regenera con su script; editar la fuente, no el resultado.

## Riesgos y pendientes detectados
1. Codigo de acceso heredado en el cliente: `ACCESS_CODE = "LEO2026"` (app.js 655) es visible a cualquiera. Ninguna pagina de miembros revisada usa `initAccessGate`/`requireMember` (el gate real es `guardMemberPage`), asi que parece codigo muerto, pero `isMemberUnlocked()` (sessionStorage) aun cambia el CTA de `personalizeNav` a "Mi panel". Confirmar que miembros.html no lo usa como acceso y retirarlo.
2. Gating de miembros del lado cliente: data.js completo (incluido el contenido bloqueado) se sirve a cualquiera; `guardMemberPage` solo redirige. Limitacion normal de un sitio estatico; lo realmente protegido esta en Supabase.
3. El limite diario gratis es evadible (localStorage, incognito, otro navegador); aceptado y documentado en el codigo.
4. Seis entradas de `MINI_LESSONS` tienen explicacion vacia ("Will: decisiones en el momento", "Condicional 2: algo imaginario", "Going to: planes ya decididos", "Going to: lo que se ve venir", "Condicional 1: algo probable", "Will + verbo base") y dejan el texto en blanco en el inicio.
5. Ids del nivel avanzado mezclan `avz` y `avanzado`: funcional hoy, fragil si algun codigo infiere el nivel del id.
6. `MEMBERS_ONLY_VARIANT_INDEX` no cubre `lectura`; si se crea version gratis de Lectura hay que definirlo.
7. Lectura tiene solo 5 variantes y 24 items por nivel con pasajes repetidos por pregunta: el ciclo se agota rapido.
8. app.js tiene 208 usos de `innerHTML`; el contenido propio es de confianza, pero todo dato de usuario (comentarios, nombres) debe escaparse. Revisar en la auditoria de seguridad.
9. Versionado manual de `?v=`: olvidarlo en una pagina desincroniza app.js y data.js. Conviene un script en `tools/` que compare versiones entre HTML.
10. `speaking.html` y `lectura.html` no cargan temas.js: hoy se tolera, pero una funcion nueva que use `temaForTopic` sin `typeof` fallaria alli.
11. `initFreePractice` e `initMemberPractice` duplican `SKILL_DESC`, `SKILL_URL_TO_KEY` y la lectura de parametros; riesgo de divergencia.
12. Fuera de mi area: `_push.patch`, `_to_delete` y `Claude outputs` estan en la raiz del repo publico; conviene revisarlos.


======================================================================
# Auditoria 05: Academia (cursos para miembros)

Solo lectura. Repo: `inglesconLeo`, rama `main`. Fecha de lectura: 2026-11-11.

## Que es
- Cursos guiados de gramatica para hispanohablantes, de 5 lecciones cada uno, con practica y evaluacion oficial con insignia.
- Es el beneficio principal de la membresia ($2 USD al mes, $20 al año).
- Frontend estatico (GitHub Pages) + Supabase para progreso, examen, contenido protegido y audios.

## Archivos del area
- `academia-de-ingles.html`: pagina publica y SEO (canonical, schema Course x9, FAQ). Describe los 9 cursos publicados.
- `academia.html`: la app (lleva `noindex`). Carga en orden `academia-lanzamiento.js`, `academia-boot.js`, `academia-audio.js`, `temas.js`, `academia-data.js`, `academia.js`.
- `academia.js` (1903 lineas): interfaz, lecciones, actividades, repaso, examen, audio.
- `academia-data.js` (3230 lineas): fuente unica de contenido. Trae `ACADEMIA_CONFIG`, `ACADEMIA_HOWTO` y `ACADEMIA.route` / `ACADEMIA.courses`.
- `academia-audio.js`: mapa generado texto a mp3 (solo TO BE y Pronombres, en `audio/academia/<curso>/`).
- `academia-motor.js`: GENERADO. Puente chico con el motor adaptativo de `app.js` (mapas de ids, sin texto de lecciones).
- `academia-cursos.js`: GENERADO desde el motor. Lista minima de cursos abiertos para el Inicio del alumno.
- `academia-nube.js` (348 lineas): sincronizacion con Supabase.
- `academia-boot.js`: interruptor `CLOUD_ON` y carga de Supabase, `backend.js`, motor y nube.
- `academia-lanzamiento.js`: interruptor `PUBLIC` (lo que se anuncia en el sitio).
- `academia.css`: estilos.
- Docs: `ACADEMIA_INTEGRACION.md`, `LANZAMIENTO_TO_BE.md`, y `docs/lanzamiento-*.md` por curso, `docs/proteccion-contenido-premium.md`.
- SQL: `supabase/migrations/2026*_academia_*.sql` (una por curso mas la base), `supabase/verify/academia_*verificacion.sql`.

## Cursos y estado
Ruta "Fundamentos del inglés" (`ACADEMIA.route.courses`), 11 cursos. Estado segun codigo (`tools/generar_academia_motor.js`, `academia-cursos.js`) y DEVLOG:

| Orden | id | Titulo | Estado |
|---|---|---|---|
| 1 | `pronombres` | Pronombres personales | Publicado (abierto) |
| 2 | `to-be` | TO BE completo / Domina el verbo TO BE | Publicado, piloto original. Unico con prueba gratis (`pilot:true`) |
| 3 | `articulos` | Artículos y plurales | Publicado |
| 4 | `posesivos` | Posesivos y demostrativos | Publicado (28-oct) |
| 5 | `there-is-are` | THERE IS / THERE ARE | Publicado |
| 6 | `can` | CAN / CAN'T | Publicado |
| 7 | `presente-simple` | Presente simple | Publicado (1-nov) |
| 8 | `do-does` | DO / DOES | Publicado (4-nov) |
| 9 | `wh` | WH-QUESTIONS | Abierto en codigo (8-nov). Ver pendiente de `enabled` abajo |
| 10 | `presente-continuo` | PRESENTE CONTINUO | Por lanzar: `soon:true`, `open:false`, oculto |
| 11 | `in-on-at` | IN / ON / AT | Por lanzar: `soon:true`, `open:false`, oculto |

- Los cursos 10 y 11 ya tienen contenido en `private/contenido/`, banco de examen en `private/academia-examen-*.json`, audios en `private/audio/` y migracion SQL (`20261104143000_...presente_continuo.sql`, `20261104143100_...in_on_at.sql`).
- "Piloto" hoy solo describe a TO BE como primer curso y plantilla; el flujo de lanzamiento original esta en `LANZAMIENTO_TO_BE.md`.
- La rama `academia/pronombres` mencionada en `LANZAMIENTO_TO_BE.md` ya esta superada: Pronombres figura publicado.

## Como se estructura un curso
Objeto en `ACADEMIA.courses[id]`:
- Metadatos: `id`, `title`, `name`, `short`, `tagline`, `goal`, `topics` (mapa clave a nombre, cada clave empieza con letra distinta).
- `lessons[]` (5): `id`, `n`, `minutes`, `topic`, `title`, `summary`, `screens[]` (explicacion con `title`, `text`, `chips`, `table`, `compare`, `items`, `audio`), `activities[]`, `canSay`.
- Tipos de actividad: `choice`, `type`, `order`, `match`, `error`, `write`. Ids tipo `l3-a2`.
- `exam`: `bank` de practica general (ids tipo `x-v5`) y examen oficial aparte.
- `demo` (solo TO BE): explicacion + 3 ejercicios `d1..d3`, que deben coincidir con `academia_courses.demo_items`.
- Config global: `passPct 80`, `examSize 15`, `examPerTopic 3`, `weeklyGoals [2,3,5]`.

### Dos formas de guardar el contenido
- Cursos publicos (`to-be`, `pronombres`): contenido completo dentro de `academia-data.js` (descargable por cualquiera).
- Cursos protegidos (los otros 9, marcados `"protected": true`): en `academia-data.js` solo el esqueleto (titulos, resumenes, `activityIds`). El contenido real vive en la tabla `academia_content` y llega por `academia_get_content(curso)` solo a miembros vigentes.
- Audios protegidos: bucket privado `academia-audio` de Supabase Storage, con URLs firmadas de 15 minutos (`signAudio` en `academia.js` y `academia-nube.js`).
- Examen oficial: tabla `academia_exam_items` (30 preguntas en TO BE, 50 en Pronombres). `academia_exam_start` entrega preguntas sin respuestas; `academia_exam_submit` califica en servidor.

## Como se generan
Todo es manual con herramientas Node/Python en `tools/`:
- `tools/academia_extraer_contenido.js <curso>`: saca el contenido de `academia-data.js` a `private/contenido/<curso>.json` y deja el esqueleto con `protected:true`. Una sola vez por curso.
- `tools/academia_fuente.js`: une esqueleto + privado para herramientas y pruebas (`LEO_PRIVATE_DIR` opcional).
- `tools/academia_seed_contenido.js <curso>`: genera `private/seed-academia-contenido-<curso>.sql` (incluye mapa de audios).
- `tools/academia_seed_examen.js <curso>`: genera `private/seed-academia-examen-<curso>.sql` desde `private/academia-examen-<curso>.json`.
- `tools/generar_audios_academia.py`: audios por frase (voz de Leo/TTS) a `audio/academia/` o `private/audio/<curso>/`; genera `academia-audio.js`.
- `tools/generar_academia_motor.js [--check]`: regenera `academia-motor.js` desde `academia-data.js` y el diccionario `COURSES` (tema, `engineTopic`, `open`). `ACADEMIA_MOTOR_ENABLED=1` lo enciende; sin variable sigue a `PUBLIC`.
- `tools/generar_academia_cursos.js [--check]`: regenera `academia-cursos.js` desde el motor.
- `tools/prelanzamiento.js --off|--on`: solo lee y valida interruptores y que el banco del examen no este en git.
- `tools/informe_academia_24h.sql`: un SELECT de solo lectura con metricas de las primeras 24 h (periodo y cuentas de prueba escritas a mano).
- `tools/probar_curso3_en_supabase_de_prueba.js` y `tools/validar_curso3_supabase.js`: prueba real del curso 3 en un proyecto Supabase de PRUEBA (se niegan a correr contra produccion; piden `SB_URL`, `SB_ANON`, `SB_SERVICE`, `SB_PAT`).
- `tools/prueba-movil-curso3.html`: pagina de revision movil del curso 3.
- Pruebas en `tools/tests/academia-*.test.js` y `*.e2e.js` (unas 40; SQL con `@electric-sql/pglite`, e2e con Chromium).

## Sincronizacion de progreso (`academia-nube.js`)
Factory `create(env)` por curso. Interruptores: `CLOUD_ON` en `academia-boot.js`, o canario `localStorage.leo_academia_canary='1'`, o localhost con `?nube=1`.

- Progreso: tabla `academia_progress` (un documento `state` por cuenta y curso, con `version`).
  - Lectura al iniciar (`boot`), fusion con el estado local (`mergeStates`, une listas y toma maximos).
  - Guardado con `rpc('academia_save_progress', {p_course, p_state, p_base_version})`. Si la version no coincide, el servidor devuelve la suya y se fusiona.
- Errores al motor adaptativo: cada respuesta se anota en una cola persistente en localStorage `leo_academia_cola_v1:<cuenta>:<curso>`.
  - La cola se sella en lotes con id y va a `academia_apply_mistakes`; el servidor guarda lotes aplicados (`academia_mistake_batches`) para no contar doble.
  - Se escribe en `mistake_stats` con `item_id = ac:<curso>:<actividad>`, `kind = academia`.
  - Lotes fallidos quedan `pending` y se reintentan con `academia_retry_pending` al abrir la academia.
- Sesiones: `academia_record_session` inserta una fila en `progress_sessions` (skill `gramatica`) y actualiza `last_practice_at`.
- Otras RPC: `academia_get_content`, `academia_exam_status`, `academia_exam_start`, `academia_exam_submit`, `academia_demo_start` / `academia_demo_finish`, y la lectura de insignias (`academia_badges`).
- Solo RPC `security definer`: las tablas no aceptan escritura directa del navegador.
- Sin nube o sin sesion: sigue como piloto local (`leo_academia_piloto_v1`).

## Gratis vs miembro
- Visitante: informacion, temario e invitacion a crear cuenta.
- Cuenta gratis: presentacion, temario, "Proximamente" y UNA prueba de TO BE (explicacion + 3 ejercicios). Cuesta 3 del limite diario de 6; se registra en `academia_progress.demo_*`, no se repite al recargar ni cambiar de dispositivo.
- Miembro (`profiles.is_member`, leido en cada llamada): contenido completo de los cursos protegidos, audios, guardado de progreso, errores a Progreso/Plan, sesiones, evaluacion oficial (80 % para aprobar, 3 intentos al dia) e insignia (`academia_badges`).
- Al vencer la membresia se bloquea al instante; insignias y progreso se conservan y se leen.
- Nota: TO BE y Pronombres siguen con texto y audio en archivos publicos; ocultarlos es barrera comercial, no tecnica.

## Interruptores (todos deben alinearse)
1. `academia_courses.enabled` por curso (Supabase). Sin esto el servidor no hace nada.
2. `CLOUD_ON` en `academia-boot.js` (hoy `true`).
3. `ACADEMIA_MOTOR.enabled` en `academia-motor.js` (hoy `true`).
4. `PUBLIC` en `academia-lanzamiento.js` (hoy `true`).
5. Por curso en codigo: `soon` en `academia-data.js` (ruta) y `open` en `tools/generar_academia_motor.js`.

## Como lanzar un curso nuevo (paso a paso)
Resumen de `docs/lanzamiento-*.md` y `LANZAMIENTO_TO_BE.md`. Cada paso lo autoriza Leo.
1. Escribir el curso en `academia-data.js` (copiar estructura de otro), ids de actividad unicos, temas con inicial distinta.
2. Redactar el banco de examen en `private/academia-examen-<curso>.json` (nunca al repo).
3. Extraer contenido: `node tools/academia_extraer_contenido.js <curso>` (deja `protected:true`).
4. Generar audios con `tools/generar_audios_academia.py` a `private/audio/<curso>/`.
5. Registrar el curso en `COURSES` de `tools/generar_academia_motor.js` con `open:false`; añadir enlace de tema en `ACADEMIA_COURSE_BY_TEMA` (`temas.js`) si aplica; regenerar motor y cursos.
6. Crear migracion `supabase/migrations/<fecha>_academia_curso_<id>.sql` (inserta fila `academia_courses` con `enabled=false`).
7. Respaldo verificado de Supabase (Free no incluye respaldos; ver `tools/respaldo_supabase.sh`).
8. En SQL Editor: migracion, luego `private/seed-academia-examen-<curso>.sql`, luego `private/seed-academia-contenido-<curso>.sql` (regenerar con `academia_seed_contenido.js`, que incluye audios). Verificar conteos y `supabase/verify/`.
9. Subir los mp3 al bucket `academia-audio/<curso>/` y verificar que el conteo coincida (N de N).
10. Merge y publicacion con el curso oculto (`soon:true`, `open:false`). El sitio no cambia.
11. Prueba privada: `update academia_courses set enabled=true where course_id='<curso>';` y canario en el navegador de prueba. Probar con cuenta miembro y con cuenta gratis.
12. Abrir: quitar `soon`, `open:true`, regenerar con `ACADEMIA_MOTOR_ENABLED=1 node tools/generar_academia_motor.js`, subir `?v=`, correr `node tools/prelanzamiento.js --on`, publicar.
13. Vigilar 48 h: `academia_mistake_batches where status='pending'`, errores de consola, `mistake_stats like 'ac:%'`, `informe_academia_24h.sql`.
14. Apagado de emergencia: `update public.academia_courses set enabled=false where course_id='<curso>';`. Nunca correr `supabase/rollback/` (borra datos).

## Como modificar sin romper
- Editar siempre `academia-data.js` y regenerar `academia-motor.js` y `academia-cursos.js` con los generadores; nunca a mano. Correr `--check`.
- Para cursos protegidos, el texto real esta en `private/contenido/*.json` y en Supabase, no en `academia-data.js`: cambiar solo el esqueleto no cambia lo que ve el miembro. Hay que regenerar y recargar el seed SQL.
- Los ids de actividad (`ac:<curso>:<id>`) alimentan `mistake_stats`; renombrarlos deja errores huerfanos.
- Los ids `d1..d3` de la demo deben coincidir con `academia_courses.demo_items`.
- Cambiar un audio exige mantener el nombre del mp3 o actualizar el mapa; no dejar copias "(1)" en Storage.
- Subir el parametro `?v=` de los scripts en `academia.html`, `academia-boot.js`, `miembros.html` y `progreso.html` al publicar cambios.
- Mantener alineados `soon`, `open` y `academia_courses.enabled`; un desajuste muestra cursos que no abren.
- Correr las pruebas `tools/tests/academia-*.test.js` antes de publicar; las de SQL necesitan `pglite`.
- No tocar logica de pagos ni `profiles.is_member` desde este area.
- Reglas de contenido: sin rayas largas, sin negritas sueltas, una idea por pantalla.

## Riesgos y pendientes detectados
1. WH-QUESTIONS: ultima entrada del DEVLOG (9-nov) dice que `academia_courses.enabled` sigue en `false` mientras el codigo ya lo abre. Resultado: panel con 8 cursos, tarjeta "9 cursos" y enlaces de errores de Question words hacia un curso cerrado. No pude verificar el estado actual en Supabase (solo lectura de archivos). Confirmar con `update ... where course_id='wh'` o quitar `question-words` de `ACADEMIA_COURSE_BY_TEMA`.
2. Respaldo del contenido: `private/contenido/` local solo tiene `do-does`, `in-on-at`, `presente-continuo`, `presente-simple`, `wh`. No hay JSON local de `articulos`, `posesivos`, `there-is-are`, `can`; su texto original existe en Supabase y en el historial de Git (rama publica), pero sin copia privada ordenada. Conviene respaldar `academia_content` y `private/`, que esta fuera de git.
3. `private/` esta ignorado por git: un solo disco local contiene los bancos de examen y los seeds. Perdida del equipo equivale a perder el examen oficial.
4. Contenido de TO BE y Pronombres, y sus audios, siguen publicos (`audio/academia/to-be`, `pronombres`). Es una decision documentada; el examen y la insignia si estan protegidos.
5. Limite de 6 ejercicios al dia para cuentas gratis lo aplica el navegador (`profiles.free_*` es escribible por la cuenta). Solo la demo es autoritativa en servidor.
6. Riesgo conocido del examen: se muestran respuestas correctas de lo fallado; con muchas cuentas se podria reconstruir el banco. Mitigado con limite de 3 intentos diarios y banco ampliable.
7. Respaldos Supabase: plan Free sin respaldos automaticos; depende de `tools/respaldo_supabase.sh` manual. La documentacion pide incluir tablas `academia_*` en el siguiente respaldo.
8. Documentacion desactualizada: `ACADEMIA_INTEGRACION.md` dice "nada aplicado en produccion, todo apagado", y `LANZAMIENTO_TO_BE.md` mantiene la seccion de pronombres como "NO publicado". Ambas contradicen el estado actual. `LANZAMIENTO_TO_BE.md` tambien fija 3 interruptores en `false` en pasos que hoy son `true`.
9. Inconsistencias menores anotadas en DEVLOG: encabezado de miembros dice "8 preguntas" y la sesion trae 9; 98 vs 96 errores pendientes entre panel y progreso; frase repetida en diagnostico de Condicionales.
10. Audios de `live` (verbo) corregidos el 4-nov; DEVLOG pedia que Leo los escuchara, sin confirmacion registrada.
11. Seeds de contenido de `presente-continuo` e `in-on-at` no traen el mapa de audios (aviso del DEVLOG del 8-nov): regenerar con `academia_seed_contenido.js` antes de cargarlos, o los botones de audio no funcionaran.
12. `tools/informe_academia_24h.sql` tiene fechas y ids de cuentas de prueba escritos a mano (26-27 oct); hay que editarlos para reutilizarlo.
13. Repo local con archivos sin seguimiento (`_push.patch`, audios `audio/dialogo-*.mp3`, `SEO_EXPERIMENTO_CLICS_2026-10-31.md`): ajenos a la academia, pero conviene no incluirlos por accidente en un commit de academia.
14. `academia.html` es `noindex` y `academia-de-ingles.html` es la pagina SEO: al abrir los cursos 10 y 11, actualizar el schema Course y el FAQ de `academia-de-ingles.html` (que hoy lista 9).


======================================================================
# 06. Preparacion de examenes (TOEFL, IELTS, TOEIC, Cambridge)

Auditoria de solo lectura. Repo: `$HOME/mnt/inglesconLeo`.

## Vision general

- Entrada: `examenes.html` (badge "Miembros"), con 4 tarjetas a `toefl.html`, `ielts.html`, `toeic.html`, `cambridge.html`.
- Cada examen = 1 HTML + 1 motor JS + 1 o mas archivos de datos. Todos son estaticos, sin llamadas propias a Supabase.
- Todas las paginas de examen son SOLO PARA MIEMBROS: el arranque va envuelto en `guardMemberPage(function(){...})` (definido en `backend.js`, llama `LeoBackend.requireMemberAsync()`; si no es miembro, no arranca).
- Scripts que cargan (orden): supabase-js (CDN), `data.js`, `app.js`, `backend.js`, `<examen>-data.js`, `<examen>.js`.
- Helpers compartidos viven en `app.js`: `shuffleOptions`, `renderFeedback`, `showNextButton`, `showRetryOrNextButtons`, `playAudioFile`, `stopActiveAudioFile`, `recordSession`, `renderSessionSummary`, `wireSummaryButtons`, `loadInflightSession`, `saveInflightSession`, `clearInflightSession`, `inflightKey`.
- Ninguna pagina de examen usa TTS del navegador (speechSynthesis): todo el audio es MP3 pregrabado.

## Patron comun de datos

- Cada archivo de datos declara constantes globales por seccion: `<EXAMEN>_READING`, `_LISTENING`, `_SPEAKING`, `_WRITING`.
- Dentro, un objeto con subtipos, cada uno un arreglo de items con `id` unico.
- Items de opcion multiple: `options` (arreglo), `correct` (indice), `explain` (texto en espanol). El motor baraja con `shuffleOptions`.
- Items de audio: `audioFile` (ruta `audio/<examen>/<id>.mp3`), `transcript`, a veces `translation`.
- El motor arma un "pool" con `build<X>Pool()` concatenando subtipos en orden fijo (no aleatorio entre subtipos).

## Resumen de sesion (inflight, "continuar donde quedaste")

- Clave de localStorage: `leo_inflight_<skill>_<level>` (funcion `inflightKey`, app.js linea ~2180).
- Guarda `{ total, idx, results, startedAt }` en cada `renderItem()`; al abrir la seccion, si `saved.idx < total` se reanuda con los `results` previos.
- Al terminar: `clearInflightSession` + `recordSession({ skill, level, topics, results, startedAt })` (alimenta progreso y la tarjeta "continuar" de `app.js` ~6503-6526).
- Pares skill/level usados:
  - TOEFL: `toefl-reading|listening|speaking|writing`, level `toefl`
  - IELTS: `ielts-*`, level `ielts`
  - TOEIC: `toeic-*`, level `toeic` (una sola funcion `runToeicSession` con `skill` dinamico)
  - Cambridge: `cambridge-*`, level `cambridge` (B2), `cambridge-b1`, `cambridge-c1`
- Etiquetas, colores y pagina destino por skill estan en `app.js` ~1455-1457 (`DISPLAY_SKILL_LABELS/COLORS/PAGE`). Un skill nuevo debe darse de alta ahi.
- Borrador de Writing TOEIC aparte: `leo_toeic_draft_<id>` (`toeicDraftKey`).
- Nivel de Cambridge elegido: `leo_cambridge_level` (`getCambridgeLevel`/`setCambridgeLevel`, default b2).

## TOEFL (`toefl.html`, `toefl.js` 533 lineas, `toefl-data.js` 423 lineas)

Formato iBT vigente desde enero 2026 (documentado en cabecera de `toefl-data.js`). 52 items, 26 audios en `audio/toefl/` (todos referenciados, ninguno faltante).

Secciones (`TOEFL_SECTIONS`, con `count`):
- Reading (14): `TOEFL_READING.completeWords` (6), `.dailyLife` (4), `.academic` (4). Ids `tr-cw-N`, etc. Corrige por indice; reintento con `showRetryOrNextButtons`.
- Listening (16): `TOEFL_LISTENING.chooseResponse` (5), `.conversation` (3), `.announcement` (4), `.academicTalk` (4). Audios `tl-*.mp3`.
- Speaking (10): `TOEFL_SPEAKING.listenRepeat` (6, audio `ts-lr-N.mp3`, frase + traduccion) e `.interview`. Sin correccion: graba con MediaRecorder, reproduce y compara; en entrevista muestra `sampleAnswer` como "Ideas para tu respuesta".
- Writing (12): `TOEFL_WRITING.buildSentence` (toca palabras en orden, `words`, comprueba, unico con `isCorrect` true/false), `.email` (textarea + ejemplo + `checklist`), `.discussion` (`professorPrompt`, `classmatePosts`). Email y discussion guardan `isCorrect:null` (autoevaluacion, no puntuan).
- Resumen final: "X / N correctas" (reading/listening), "Practicaste N respuestas" (speaking), "X oraciones correctas" o "Completaste N ejercicios" (writing).

Teaser gratis (`toefl-teaser.js`, 106 lineas):
- Define `renderToeflTeaser(container)`: 5 preguntas fijas (completeWords[0], chooseResponse[0], dailyLife[0], conversation[0], academic[0]), sin guardar progreso, sin inflight; al final muestra gancho a `miembros.html` ("$2 USD/mes").
- Reutiliza `TOEFL_READING/LISTENING` y audios existentes; necesita `toefl-data.js` cargado y los helpers de `app.js`.
- ESTADO ACTUAL: ya NO esta enlazado. Solo lo referencia `_to_delete/antes-limites/practica.html` (lineas 301 y 417). `practica.html` vigente solo carga `toefl-data.js` (linea 331), sin teaser ni `toeflTeaserArea`.

## IELTS (`ielts.html`, `ielts.js` 640, `ielts-data.js` 381)

Cabecera de datos: bandas 0 a 9, promedio redondeado a media banda; no hay aprobado/reprobado. 59 items, 28 audios en `audio/ielts/` (`il-s1-N`, `il-s2-N`...).

- Reading (16): `IELTS_READING.trueFalseNotGiven`, `.matchingHeadings`, `.multipleChoice`, `.sentenceCompletion`.
- Listening (16): `IELTS_LISTENING`; items con `audioFile`+`transcript`; unos con `sentence`+`bank`+`correct` (completar con banco de palabras), otros con `options`.
- Speaking (15): `IELTS_SPEAKING` (partes 1 a 3), graba y compara (`wireIeltsSpeakingAudio`), sin nota.
- Writing (12): `IELTS_WRITING` (Task 1 y 2), autoevaluacion con ejemplo.
- Helpers propios: `wireIeltsOptions`, `shuffleArray`, `renderIeltsBackLink`.
- Correccion: indice en opcion multiple; palabra en banco (`word === item.correct`) con colores en el hueco.

## TOEIC (`toeic.html`, `toeic.js` 541, `toeic-data.js` 1480)

El mas grande y con estructura distinta (grupos con preguntas anidadas). 40 audios referenciados en `audio/toeic/` (+2 de muestra).

- `TOEIC_LISTENING`: `questionResponse` (P2, A/B/C sin barajar porque las letras estan grabadas), `conversations` (P3, cada una con `audioFile`, `transcript`, `questions[]`), `talks` (P4, igual, con `kind`).
- `TOEIC_READING`: `incompleteSentences` (P5), `textCompletion` (P6, `blanks[]`), `comprehension` (P7, `kind` de documento, `questions[]`).
- `TOEIC_SPEAKING`: `readAloud`, `respondQuestions`, `respondInfo`, `opinion`. Con cronometro; graba y compara.
- `TOEIC_WRITING`: `sentence`, `email`, `essay`. Contador de palabras (`toeicWordCount`), borrador guardado, boton "Ver ejemplo y checklist".
- `buildToeicPool(section)` aplana los grupos y genera ids `<grupo>-qN` / `-bN`. En datos la respuesta correcta suele ir en posicion 0 (se baraja al mostrar), salvo Parte 2.
- Un solo `runToeicSession({container,onExit,section})` sirve las 4 secciones; `toeicEsc/toeicNl` escapan HTML.
- Audios se generan con `tools/generar_toeic_audios.py`.
- GRATIS: `articulo-examen-toeic.html` incluye minipracticas publicas con `audio/toeic/l-p2-muestra.mp3` y `l-p3-muestra.mp3` (botones `.toeic-mini-play`, resultado `.toeic-mini-result`, logica en `app.js` ~5586). Son los unicos audios sin referencia en `toeic-data.js`, pero estan en uso.

## Cambridge (`cambridge.html`, `cambridge.js` 756; datos en 3 archivos)

Tres niveles, selector en landing, config en `CAMBRIDGE_LEVELS` (`b1`, `b2`, `c1`) con `examLabel`, `inflightLevel`, `recordLevel` y `data()`.

- `cambridge-data.js` (B2 First, 586 lineas): `CAMBRIDGE_READING` (multipleChoiceCloze, openCloze, wordFormation, keyWordTransformation, readingComprehension, multipleMatching), `CAMBRIDGE_LISTENING` (shortExtract, sentenceCompletion, multipleMatching, longInterview), `CAMBRIDGE_WRITING` (essay, article, email, review), `CAMBRIDGE_SPEAKING` (interview, longTurn, collaborativeTask, furtherDiscussion).
- `cambridge-b1-data.js` (B1 Preliminary): prefijo `CAMBRIDGE_B1_*`; Reading: shortText, multipleMatching, readingComprehension, gappedText, multipleChoiceCloze, openCloze; Writing: email, story, article.
- `cambridge-c1-data.js` (C1 Advanced): prefijo `CAMBRIDGE_C1_*`; Writing: essay, report, review, proposal.
- Orden de subtipos: `CAMBRIDGE_READING_ORDER`, `_LISTENING_ORDER`, `_SPEAKING_ORDER`, con `readingOrder` opcional por nivel (B1 lo sobreescribe).
- Conteos por seccion (`CAMBRIDGE_SECTIONS`, valores por defecto): Reading 24, Listening 16, Writing 12, Speaking 14; `cambridgeSectionCount(level,key,dflt)` puede ajustarlos por nivel.
- Correccion: opciones con indice (`wireCambridgeOptions`), huecos con banco de palabras (`wireCambridgeWordBank`); Writing y Speaking son autoevaluados con ejemplo.
- Audios: `audio/cambridge/` (B2, `cb-*`, 24), `audio/cambridge-b1/` (28), `audio/cambridge-c1/` (24); todos referenciados. Generadores: `tools/generar_cambridge_b1_audios.py`, `generar_cambridge_c1_audios.py`.
- Carga de datos en `cambridge.html` lineas 171 a 174.

## Articulos y ejercicios (publicos, SEO)

- `articulo-examen-toefl.html`, `-ielts.html`, `-toeic.html`: articulos gratis indexados en `sitemap.xml` (lastmod 2026-09-23). CTA a `miembros.html` ("Prepararme para el TOEFL"). Solo TOEIC trae minipractica con audio.
- `ejercicios-ingles-a1.html`, `ejercicios-presente-simple-ingles.html`: no tienen relacion con examenes (sin menciones a TOEFL/IELTS); son ejercicios A1 publicos.

## Que es gratis y que es de miembros

- Miembros: las 4 paginas de examen completas, `examenes.html`, todo el contenido de `*-data.js`, audios, grabacion, progreso e inflight.
- Gratis: los 3 articulos, minipractica TOEIC en el articulo, y (retirado hoy de `practica.html`) el teaser TOEFL.
- Nota: el gate es del lado del cliente. Los `*-data.js` y los MP3 son publicos por URL directa (inherente a GitHub Pages).

## Como agregar contenido

1. Elegir archivo de datos y subtipo; agregar un objeto con `id` NUEVO y unico (convencion `tr-cw-7`, `il-s1-9`, etc.), mismos campos que sus vecinos (`options`, `correct`, `explain`).
2. Si lleva audio: generar el MP3 con el script de `tools/` correspondiente, guardarlo en `audio/<examen>/<id>.mp3` y poner `audioFile` con esa ruta exacta.
3. Actualizar `count` de la seccion en `*_SECTIONS` (TOEFL, IELTS, Cambridge lo tienen hardcodeado; TOEIC lo calcula con `toeicSectionCount`).
4. Subir el `?v=` del `<script>` en el HTML del examen (ej. `toefl-data.js?v=20261016a`) para romper cache.
5. Nueva seccion o subtipo: tocar `build<X>Pool`, el `*_KIND_LABEL` y el render del motor.
6. Nuevo skill de progreso: alta en `DISPLAY_SKILL_LABELS/COLORS/PAGE` de `app.js`.

## Como modificar sin romper

- No cambiar `id` existentes ni el par skill/level: rompe sesiones guardadas (`leo_inflight_*`) y el historial.
- Si cambias el tamano del pool, las sesiones guardadas con `idx` viejo siguen validas solo si `idx < total`; el `total` guardado se ignora (se recalcula), pero `results` previos pueden desalinearse al insertar items EN MEDIO. Agrega al final del subtipo.
- Mantener `correct` como indice valido dentro de `options` (TOEIC: posicion 0 por convencion, salvo Parte 2).
- No renombrar constantes globales (`TOEFL_READING`, etc.); `toefl-teaser.js` y `app.js` las leen.
- Cualquier edicion a `app.js` (compartido por todas las paginas) requiere subir su `?v=` en todos los HTML.
- No usar em dash ni emojis en textos nuevos; explicaciones en espanol, oraciones de examen en ingles.
- Probar en celular: grabacion (MediaRecorder) y audio no funcionan igual en navegadores internos de TikTok/Instagram.
- Antes de reactivar el teaser, cargar `toefl-teaser.js` DESPUES de `toefl-data.js` y `app.js`, y agregar de nuevo un contenedor `toeflTeaserArea`.

## Riesgos y pendientes detectados

- `toefl-teaser.js` esta huerfano (solo referenciado desde `_to_delete/antes-limites/`). Decidir: borrar o conservar para reuso; mientras tanto no hace dano.
- `practica.html` aun carga `toefl-data.js` (linea 331) sin usar su contenido para el teaser; si ya no hace falta, es peso extra para visitantes sin cuenta (revisar si otro codigo lo usa antes de quitarlo).
- Metadatos de `practica.html` lineas ~189 siguen prometiendo "preparacion TOEFL e IELTS" como beneficio de miembros: coherente, pero confirmar que ya no queda ninguna promesa de "ejemplo gratis".
- Versiones de cache desparejas: `toefl.js?v=20260910` es antigua frente a `toefl-data.js?v=20261016a`; verificar que ningun cambio reciente a `toefl.js` quedo sin bump.
- Contenido pequeno: TOEFL 52 items y IELTS 59 contra pools que se repiten al reintentar; los `count` hardcodeados (TOEFL 14/16/10/12, IELTS 16/16/15/12, Cambridge 24/16/12/14) pueden desincronizarse si se agregan items sin actualizarlos.
- Writing (TOEFL email/discussion, IELTS, Cambridge, TOEIC) y Speaking no tienen puntuacion real: son autoevaluacion con ejemplo/checklist. El resumen muestra "Completaste N" y se registra `isCorrect:null`; no mezclar con promedios.
- Gate solo cliente: datos y audios descargables sin login (aceptado en sitio estatico, pero el contenido de pago es copiable).
- `ejercicios-*.html` no pertenecen a esta area; no se encontraron enlaces cruzados a examenes ahi (oportunidad de enlazado interno SEO).
- No se verifico en ejecucion (navegador) ni en movil; la auditoria fue por lectura de codigo.


======================================================================
# 07. Contenido y SEO (Ingles con Leo)

Auditoria de solo lectura. Repo: `inglesconLeo` (sitio estatico en GitHub Pages, dominio `inglesconleo.com`, archivo `CNAME`). Fecha de la revision: 2026-11-11. Fuentes: los documentos `SEO_*.md`, `AUDITORIA_COMPLETA_2026-10-14.md`, `SITE_HEALTH_REPORT.md` (2026-11-10) y el codigo real.

## 1. Inventario real (contado en el repo)

- Articulos: 64 archivos `articulo-*.html` (la auditoria del 14-oct contaba 59; desde entonces se sumaron did-was-were, this-that-these-those, adjetivos-posesivos, etc.).
- Paginas de ejercicios: `ejercicios-ingles-a1.html` y `ejercicios-presente-simple-ingles.html` (experimento del 31-oct, rama `seo-organic-clicks-experiment`).
- Glosario: 340 carpetas `glosario/<slug>/index.html` mas `glosario-ingles/index.html` (indice, 414 KB, unos 681 enlaces).
- `sitemap.xml`: 417 `<loc>` (339 de glosario). `robots.txt` permite todo y apunta al sitemap. `CNAME` = `inglesconleo.com`. Hay un archivo de llave IndexNow en la raiz (`41c1350951c5e79e95e8a4d0b5c84112.txt`).
- Comprobado hoy: todos los `articulo-*.html` y `ejercicios-*.html` estan en el sitemap y tienen tarjeta en `articulos.html`. Ningun articulo contiene em dash. Todos tienen JSON-LD.
- 32 articulos llevan FAQPage; los creados desde el 7-oct no (decision tomada).
- 23 articulos no tienen quiz propio. 3 articulos no tienen la seccion `article-comments`.

## 2. Estrategia SEO vigente

- Sin cambiar URLs ni canonicals ya posicionados sin evidencia de Search Console (GSC).
- Mejorar con calidad real, no forzar indexacion masiva: priorizar 5 a 10 fichas manuales con contenido propio en lugar de las 324 "descubiertas, sin indexar".
- Palanca barata: enlazado interno desde articulos con trafico hacia fichas (272 de 336 fichas no tenian enlace desde articulos al 20-oct; 49 ya tenian al 14-oct).
- Seguir la serie de gramatica que Copilot ya cita (pasado simple, verbos irregulares, numeros), ampliando el articulo existente en vez de crear uno que compita.
- Experimentos de uno en uno, midiendo 14 a 28 dias, con paginas control sin tocar (`articulo-in-on-at`, `articulo-adjetivos-posesivos-ingles` para A1; `bored-vs-boring`, `desert-vs-dessert` en glosario).
- Separar intencion teoria (articulo) e intencion practica (paginas `ejercicios-*`), vigilando canibalizacion con `articulo-presente-simple.html`.
- Visibilidad en IA: contenido publico indexable, Article JSON-LD, sitemap enviado a Bing, IndexNow. No se hizo llms.txt ni schema extra porque no esta demostrado que ayude.
- Medicion manual mensual con 12 consultas fijas en ChatGPT, Gemini, Copilot, Perplexity y Claude (lista en `SEO_CRECIMIENTO_2026-10-25.md`, seccion F).

## 3. Numeros de Search Console y Bing que aparecen en los documentos

Linea base (`SEO_LINEA_BASE_2026-10-20.md`, 28 dias):
- Clics 93 (antes 25), impresiones 6.480 (antes 318), CTR 1,4 %, posicion media 12,1 (antes 32,9).
- Indexacion: 70 indexadas, 333 sin indexar (323 descubiertas, 8 rastreadas sin indexar, 2 alternativas con canonical correcta).
- Pagina por pagina: mustnt 1.017 imp; verbo-to-be 730; although 651; correo-formal 563; pronombres-personales 496.

Periodo 7 sep a 23 oct (`SEO_SEGUIMIENTO_2026-10-25.md`):
- 13.073 impresiones, 137 clics, CTR 1,05 %, posicion 11,7.
- 73 indexadas y 334 sin indexar (324 descubiertas, 8 rastreadas).
- GA4: 3.077 sesiones, 432 Organic Search (google 251, bing 139), 115 registros gratis, 57 clics CTA membresia, 2 compras sin conciliar, 2 sesiones de asistentes IA.
- Bing AI Performance (15 a 23 oct): unas 2.500 citas de Copilot en 11 paginas de media. Mas citadas: pasado-simple 752, verbo-to-be 668, verbos-irregulares 414, numeros-en-ingles 217, presente-simple 94, do-vs-does 66.

Experimento del 31-oct (`SEO_EXPERIMENTO_CLICS_2026-10-31.md`):
- 111 clics contra 49 y 392 sesiones organicas contra 113. La portada aporta 68 de 111 clics (concentracion).
- Oportunidades: pronombres 2.187 imp, 2 clics, pos 10,05; verbo-to-be 1.328 imp, 4 clics, pos 8,45.
- GSC en vivo no se pudo consultar (conexion con `payment_required`); las cifras son la linea base entregada.

Fichas de glosario con oportunidad (posicion 4 a 18): mustnt 1.840 imp (pos 8,9), although 1.177 (12,3), principal-vs-principle 315, yet 151, little-vs-a-little 128, money-vs-cash 95 (pos 4,8 y 0 clics, revisar titulo). Solo 39 de ~336 fichas reciben impresiones.

Nota: no hay acceso a GSC desde el repo. Los datos llegan con 2 a 3 dias de retraso y GSC oculta consultas por privacidad (no sumar por pagina para reconstruir totales).

## 4. Hallazgos clave de los documentos

- Calidad de fichas (20-oct): 277 con menos de 150 palabras, 192 con texto de plantilla ("Esta duda aparece con frecuencia"), 8 pares espejo. Cuello de botella: programacion de rastreo de Google en dominio nuevo, no un error tecnico.
- Pares espejo (`SEO_DUPLICADOS_2026-10-20.md`): borrow-vs-lend / lend-vs-borrow, complement-vs-compliment, expect-vs-wait, farther-vs-further, job-vs-work, lose-vs-miss, rob-vs-steal, than-vs-then / then-vs-than. Seis son duplicados reales (similitud 0,69 a 0,77). Estado: SOLO DOCUMENTADO, sin decision de Leo. La auditoria de octubre lista 12 pares (suma bring/take, hear/listen, say/tell, awake/wake-up).
- Recomendacion documentada: elegir una URL principal por par, la otra con `rel="canonical"` hacia ella y fuera del sitemap, sin borrar ni redirigir (GitHub Pages no admite 301 de servidor). En than/then pasar antes el contenido de `then-vs-than` a `than-vs-then`.
- Atribucion GA4: "facebook / pagado" (582 sesiones) cae en Organic Social porque `utm_medium=pagado` no es reconocido. Solucion limpia: usar `paid_social` en Meta Ads.
- IndexNow envia tambien paginas con noindex (ruido, Bing las respeta). Mejora pendiente: filtrarlas en `.github/workflows/indexnow.yml`.
- Paginas con experimento en seguimiento (no editar ni enlazar mas): glosario/mustnt, principal-vs-principle, bored-vs-boring, desert-vs-dessert, glosario/although, articulo-correo-formal-en-ingles, articulo-verbo-to-be, articulo-entrevista-servicio-cliente-ingles.
- Articulo nuevo `articulo-did-was-were.html` (25-oct): linea base 0; revisar hacia el 24-nov (criterios: bueno mas de 20 impresiones, fuerte mas de 100).

## 5. Reporte de salud (`SITE_HEALTH_REPORT.md`, 2026-11-10)

- 0 criticos, 1 importante, 0 mejoras; 75 de 76 paginas sin problemas.
- Unico pendiente: `miembros.html` con Best Practices 77 (cookies de terceros de Stripe/Google, source maps). Performance 82, CLS 0,076.
- Articulos clave: Performance 89 a 92, SEO 100, accesibilidad 100; LCP entre 1,1 y 2,0 s.
- Las puntuaciones de Performance oscilan mucho entre corridas (rango 46 a 98): ruido de medicion.
- El archivo lo genera `tools/site-health/audit.js` (workflow `.github/workflows/site-health.yml`). NO editar a mano; se sobreescribe, igual que `history.json` y `lighthouse-history.json`.
- Herramientas relacionadas: `tools/site-health/glossary-audit.js`, `glossary-common.js`, `gsc-glossary-inspect.js`, `gsc-optional.js`.

## 6. Plantilla comun de articulo

Los articulos se escriben a mano (sin generador). Se copia uno reciente (el documento recomienda `articulo-conectores-ingles.html`). Estructura observada en `articulo-did-was-were.html`:
- `<head>`: favicons, manifest, `meta description`, `<title>`, `canonical` absoluto, `og:title/description/type/url/image` (`og-logo.png`), twitter, `academia-lanzamiento.js?v=`, `style.css?v=`, `chatbot.css?v=`, `error-monitor.js?v=`, GA y `meta-pixel.js`.
- JSON-LD `@graph` con Article (Person Leo, Organization, `datePublished`, `dateModified`).
- `<main><article class="article-body">`: badge, un solo H1, `.article-meta`, "Respuesta rapida" (`.article-toc` con `.article-example` en/es), H2 con tablas en `.article-table-wrap`, errores comunes, quiz, bloque `.article-cta` hacia `practica.html`, y `<section class="article-comments" id="article-comments">`.
- Pie: `personalizeNav(); initArticleComments();`.
- Quiz: `article-quiz.js` inicializa los ids `#grammarQuiz, #comparisonQuiz, #thereQuiz, #articlesQuiz, #countableQuiz, #questionsQuiz` (clase `.toeic-mini-opts`, `data-correct`, `data-explain`) y emite los eventos `leo-article-quiz` y `leo-article-quiz-done`. Si usas otro id, hay que agregarlo en la ultima linea del archivo.
- Catalogo de preguntas: `tools/gen-article-quiz-catalog.js` rellena `ARTICLE_QUIZ_CATALOG` en `temas.js` (`--check` solo verifica). Excluye articulos reclamados por 2 o mas temas y quizzes de comprension.

## 7. `articulos.html`

- Tarjetas `a.article-card` con `data-article-category` (valores: gramatica, aprender-ingles, entrevistas, vocabulario, guias, examenes, niveles, listening, pronunciacion; se permiten dos separadas por espacio) y `data-search-keywords`.
- Filtros visibles: Todos, Aprender ingles, Niveles, Entrevistas, Gramatica, Vocabulario, Examenes, Guias (`data-article-filter`). Existe tambien una tarjeta destacada y una de "primeros articulos".
- Nuevas tarjetas se agregan arriba de la lista filtrable (las mas recientes ya van primero: pronombres, adjetivos posesivos, ejercicios A1, ejercicios presente simple, did-was-were...).
- Hay carrusel de videos con marcadores `PON_AQUI_LA_URL_DE_*` que un script oculta mientras no haya URL real.

## 8. Glosario

- Fuentes: `tools/glosario/terminos.js`, `extras.js`, `confusiones-200.js`, `data.js` (VOCAB_BANK), `temas.js`.
- Generador `tools/generar_glosario.js`: escribe `glosario-ingles/index.html`, todas las `glosario/<slug>/index.html`, las lineas `/glosario` del `sitemap.xml`, `audio_manifest.json` e `indexnow_urls.json`.
- Peligro documentado: NO ejecutarlo en el repo. Esta desactualizado (`CSS_V`, `GL_V` viejos frente al sitio) y el 12-oct reescribio 118 paginas (hubo que restaurar de git). 47 fichas difieren de su salida, 15 reescritas a mano.
- Para fichas manuales: editar el HTML directo y sincronizar a mano `lastmod` del sitemap y `dateModified` del JSON-LD (hubo desfases en even-though, mustnt, though).
- Audio de ficha: solo se muestra si existe `audio/glosario/<slug>.mp3` (`tools/generar_audio_glosario.py`).
- Pruebas: `node tools/tests/glossary.test.js` (campos, duplicados, relaciones, sitemap, manifiesto).
- Busqueda del glosario normaliza mayusculas, acentos y apostrofes (mustn't = mustnt).

## 9. Indexador (`tools/indexador`)

- Robot Playwright que lee el sitemap, inspecciona URLs en GSC con la sesion de Google de Leo y pulsa "Solicitar indexacion". Corre cada 6 horas en una tarea programada de Windows.
- Estado y cola fuera del repo (`%LOCALAPPDATA%\InglesConLeo\indexador`). Ajustes en `config.json` (prioritarias y exclusiones) y `config.local.json` (ignorado por git).
- Si hay CAPTCHA o sesion vencida se detiene y avisa; nunca lo salta. No usarlo en GitHub Actions.
- Pruebas: `npm test` dentro de la carpeta (replica local de GSC).
- Lista manual de URLs a solicitar: `SEO_URLS_INDEXACION_2026-10-20.md` (no solicitar las ya indexadas ni los pares espejo).

## 10. Reglas de contenido

- Sin rayas largas (em dash) en texto visible, salvo como marcador de turno en dialogos.
- Negrita con moderacion.
- No repetir oraciones entre ejercicios; las respuestas correctas de opcion multiple se aleatorizan (`shuffleOptions`).
- Explicar a Leo en lenguaje humano, avisar de riesgos y cerrar con "TL;DR en humano". Documentar cambios grandes en `DEVLOG.txt` (`AAAA-MM-DD | resumen`).
- Verificar en movil (320, 360, 375 px) y escritorio (1280 px) sin desbordes.
- Audio TTS para contenido nuevo (scripts `tools/generar_audios*.py`, `generar_articulo_callcenter_audios.py`).
- Cache-busting: si cambias `.js` o `.css`, subir `?v=` en TODOS los HTML que lo cargan y verificar que queda un solo valor.
- `lastmod` solo con cambios reales de contenido, no por formato ni enlaces masivos (una frase de enlace anadida a un articulo si lo justifica).
- No usar FAQPage en articulos nuevos (decision del 7-oct).

## 11. Como agregar un articulo nuevo, paso a paso

1. Verificar intencion: buscar en el repo que ningun articulo, ejercicio o ficha ya cubra la misma consulta. Si existe, ampliar ese en vez de crear otro.
2. Definir slug estable `articulo-<tema>-ingles.html` (minusculas, sin acentos). No se cambiara despues.
3. Copiar un articulo reciente y cambiar: `<title>` (idealmente 60 caracteres o menos), `meta description` (70 a 160), `canonical` absoluto, `og:title/description/url`, twitter, H1 unico.
4. Actualizar JSON-LD Article: `headline`, `description`, `datePublished` y `dateModified` con la fecha real. Sin FAQPage.
5. Escribir el contenido: respuesta rapida, tabla, ejemplos en/es, errores comunes, quiz (usar uno de los ids que `article-quiz.js` reconoce), `.article-cta` a `practica.html` y seccion de comentarios.
6. Revisar texto: cero em dash, negrita moderada, sin oraciones repetidas dentro del articulo ni respecto a ejercicios.
7. Enlaces internos: desde el articulo hacia 2 a 4 paginas relacionadas (teoria, practica, fichas de glosario, test de nivel). Y hacia el nuevo: una frase natural desde 1 o 2 articulos relacionados con anchor distinto cada vez (esto justifica actualizar su `lastmod`). Evitar enlazar a paginas en experimento.
8. `articulos.html`: agregar `a.article-card` con `data-article-category` y `data-search-keywords` ricos.
9. `sitemap.xml`: agregar `<url><loc>https://inglesconleo.com/articulo-...html</loc><lastmod>AAAA-MM-DD</lastmod></url>`.
10. Audio y quiz: generar audios si hay dialogo (`tools/generar_audios_articulos_lote2.py` como modelo) y agregar fila al CSV `tools/lista_audios.csv`. Si el tema esta en `temas.js`, correr `node tools/gen-article-quiz-catalog.js --check`.
11. Pruebas: abrir en movil y escritorio, consola sin errores, quiz funcionando, `node tools/tests/...` pertinentes.
12. Anotar en `DEVLOG.txt`. Leo hace `git add/commit/push` (el agente no ejecuta git). Si el bot de Site Health rechaza el push: `git pull --rebase` y `git push`.
13. Despues: IndexNow se dispara solo con el push; la solicitud manual en GSC se hace tras el push y solo para URLs nuevas. Medir a los 14 a 30 dias.

## 12. Que evitar

- Canibalizacion: no crear una pagina nueva para una consulta que ya cubre otra (ej. pasado simple, presente simple). Ampliar la existente o separar claramente la intencion (teoria frente a ejercicios) y enlazarlas.
- Cambiar URLs, titulos o canonicals de paginas ya indexadas o con impresiones sin evidencia. No hay redirecciones 301 en GitHub Pages.
- Correr `tools/generar_glosario.js` sobre el repo.
- Inflar `lastmod`.
- Forzar indexacion masiva de fichas de plantilla; desindexar o borrar fichas sin decision.
- Editar `SITE_HEALTH_REPORT.md`, `history.json`, `lighthouse-history.json`, la llave IndexNow, `CNAME`.
- Reescribir paginas del experimento en seguimiento antes de que termine la medicion.
- Anadir `noindex` a paginas publicas por error: las 18 privadas ya lo tienen y estan fuera del sitemap.

## Como modificar sin romper

- Antes de tocar cualquier pagina publica, revisar su estado en la tabla de experimentos (seccion 4) y en `DEVLOG.txt`.
- Cambios de texto en articulo: mantener URL, canonical y `<title>` si ya posiciona; actualizar `dateModified` y `lastmod` solo si el contenido cambia de verdad.
- Si modificas `article-quiz.js`, `style.css` o `chatbot.css`: subir `?v=` en todos los HTML (hay 64 articulos mas paginas) y comprobar que queda un unico valor.
- Fichas de glosario: editar a mano, nunca regenerar en bloque; luego ejecutar `node tools/tests/glossary.test.js`.
- Ids de microtemas y ejercicios: no cambiar (`tools/tests/micro-ids.lock.json`).
- Tras cualquier cambio: validar el sitemap como XML, comprobar que cada URL nueva devuelve 200 y tiene canonical propio, y probar en movil.
- Hacer commits pequenos para relacionar cambio y metrica (regla del seguimiento).

## Riesgos y pendientes detectados

- 324 fichas "descubiertas, sin indexar" con texto corto o de plantilla: riesgo de calidad para el dominio; sin plan de refuerzo ejecutado.
- 8 pares espejo (12 segun la auditoria de octubre) sin decision de canonical; hasta decidir, siguen diluyendo senales y ocupando sitemap.
- 8 articulos "rastreados, sin indexar" detectados el 20-oct (adjetivos-posesivos, adverbios-de-frecuencia, why-should-we-hire-you, problemas-hotel, preguntas-migracion, in-on-at, rutina-diaria, hora-en-ingles): verificar si ya se indexaron.
- Generador del glosario desactualizado: riesgo de pisar trabajo manual si alguien lo ejecuta.
- Medicion de conversion poco fiable: compras GA4 sin conciliar con Stripe/PayPal, `utm_medium=pagado` mal clasificado, referencias stripe/paypal sin excluir.
- Tarjetas de ejercicios A1 y presente simple en `articulos.html` y sus URLs en el sitemap dependen de que la rama del experimento se haya publicado; comprobar que no haya URLs en sitemap sin desplegar (hoy estan presentes en el repo local).
- Dos pruebas de regresion fallan en `origin/main` (`tools/e2e/regresiones.js` y `tools/tests/academia-integracion.test.js`), no atribuidas al SEO pero conviene corregirlas.
- Concentracion de clics en la portada (68 de 111) y poco clic en paginas posicion 6 a 12.
- Metadatos: 23 articulos con titulo de mas de 60 caracteres y 3 con descripcion mayor a 160 (dato del 14-oct; recortar solo si no estan posicionados).
- Cobertura desigual: 23 articulos sin quiz y 3 sin seccion de comentarios.
- `miembros.html` con Best Practices 77 por terceros (Stripe, Google, Meta Pixel); mejora limitada sin quitar esos servicios.
- IndexNow notifica URLs con noindex; filtrar en el workflow.
- Enlace al test de nivel en los 5 o 6 articulos mas citados por Copilot: experimento propuesto, confirmar si ya se publico.
- Fecha de revision pendiente: `articulo-did-was-were.html` hacia el 24-nov y fichas reescritas (mustnt, although) tras el 26-oct.


======================================================================
# Auditoria 08: Audios

Alcance: solo lectura. Repo `inglesconLeo`. No se abrieron mp3; se uso ls/find/wc, lectura de scripts y CSV, y un ffprobe de prueba.

## Resumen
- 1588 mp3 en `audio/` (54 MB), mas `audio/leo/LEEME.txt`.
- 814 estan cubiertos por una fila de CSV (603 en `tools/lista_audios.csv`, 211 en `tools/lista_audios_kokoro.csv`). El resto (unos 774) los generaron otros scripts (academia, glosario, clases, cambridge, toeic, miembros, etc.) con su propia fuente de datos.
- Ninguna ruta de los dos CSV apunta a un mp3 inexistente. Sin duplicados ni filas con menos de 3 columnas.
- Todo el audio se sirve como archivo estatico desde GitHub Pages.

## Estructura de audio/ (mp3 por carpeta)
- `a0` 48, `a1` 72, `b1` 59, `c1` 59 (listening por nivel, `a1listening-001.mp3`)
- `academia` 151 (subcarpetas `to-be`, `pronombres`; nombres hash `4a70bbf45f.mp3`)
- `aprender` 45 (`to-be`, `do-does`, `in-on-at`, `can-could-should`, `presente-simple-vs-continuo`)
- `articulos` 295 (una subcarpeta por articulo: `contracciones-ingles/palabra-im.mp3`, `dialogo-*.mp3`)
- `clases` 192 (`aeropuerto-listening.mp3`, `aeropuerto-speaking.mp3`, `frases/`)
- `glosario` 338 (`<termino>.mp3`, ej. `a-vs-an.mp3`)
- `cambridge` 24, `cambridge-b1` 28, `cambridge-c1` 24, `ielts` 28, `toefl` 26, `toeic` 42
- `miembros100` 40, `miembros200` 28, `miembros300` 28, `miembros400` 32 (`l-avanzado-m100-1.mp3`)
- `numeros` 12, `test-nivel` 5, `leo` 7 mp3 + LEEME.txt
- En la raiz de `audio/`: 4 dialogos sueltos (`dialogo-cafeteria-dos-voces.mp3`, `dialogo-cita-dental-dos-voces.mp3`, `dialogo-cita-dental-daniel-smith.mp3`, `dialogo-plan-sabado-dos-voces.mp3`, `dialogo-trabajo-rutina-dos-voces.mp3`)

## Convenciones de nombres
- Siempre minusculas, guiones, `.mp3`, ruta relativa a la raiz (`audio/...`).
- Listening por nivel: `<nivel>listening-NNN.mp3` (3 digitos).
- Clases: `<tema>-listening.mp3` / `<tema>-speaking.mp3`.
- Articulos: `audio/articulos/<slug-del-articulo>/<palabra-x|dialogo-x>.mp3`.
- Academia: hash corto del texto, mapeado en `academia-audio.js`.
- Dialogos de dos voces suelen llevar `dialogo-` o `-dos-voces`.

## Motores y scripts
Dos motores, independientes:
1. Edge TTS (Microsoft, requiere internet): `tools/generar_audios.py` + `tools/lista_audios.csv`.
2. Kokoro TTS (local, sin internet, onnx): `tools/generar_audios_kokoro.py` + `tools/lista_audios_kokoro.csv`.

Scripts en `tools/` (cada uno con su lote o fuente):
- `generar_audios.py` (181 lineas, el principal Edge TTS)
- `generar_audios_kokoro.py`, `generar_dialogo_kokoro.py` (dialogo desde lista_audios.csv, voz 1 `af_heart` Maria, voz 2 `am_michael` Tom, pausa 0.35 s)
- `generar_audios_academia.py` (Kokoro, fuente `academiaAudioTexts()` de `academia-data.js`, escribe `academia-audio.js`; `--force` regenera; limpia los que ya no se usan)
- `generar_audios_aprender.py`, `generar_audio_glosario.py` (Edge, usa `tools/glosario/audio_manifest.json`; `--all`, `--term`, `--list`, `--force`)
- `generar_dialogos.py`, `generar_clases_nuevas.py`, `generar_clases_nuevas_2.py`
- `generar_cambridge_b1_audios.py`, `generar_cambridge_c1_audios.py`, `generar_toeic_audios.py`
- `generar_miembros200_audios.py`, `generar_miembros300_audios.py`
- `generar_articulo_callcenter_audios.py`, `generar_audios_articulos_lote2.py`
- `preparar_audios_leo.py`: convierte WAV de Leo a mp3 (mono, 64 kbps, -18 LUFS, techo -2 dBTP, loudnorm 2 pasadas) a `audio/leo/`. Usa `imageio_ffmpeg`. Nombres fijos: bienvenida, vas-mejorando, sigue-tema, buen-trabajo, puedes-mejorar, casi-dominas, repasa-antes.
- En la raiz: `generar_audios_miembros.py`, `generar_audios_seo_lote_3.py`, `generar_audios_seo_lote_4.py` (lotes puntuales).
- `tools/silencio_600ms.mp3` (3888 bytes): solo lo usa `generar_toeic_audios.py` para pausas; si falta, genera sin pausas.

## Formato de los CSV
Columnas: `archivo,texto,voz` (con encabezado).
- `lista_audios.csv`: 603 filas de datos. Voz vacia = `VOZ_POR_DEFECTO` = `en-US-JennyNeural`.
  - Voces vistas: AvaMultilingual (228), vacia (198 por lineas), `Ava|Andrew` (76), Jenny (65), `Andrew|Ava` (6), Andrew (6), BrianMultilingual (4), `en-CA-LiamNeural` (3).
  - Dialogo de dos voces: voz = `VozA|VozB`, texto multilinea (entre comillas) con una linea por turno, cada una iniciando con em dash `—`. El script quita el `—`, alterna voces por linea (par/impar), genera `ruta.tmpN.mp3` por turno, concatena binariamente y borra los temporales. 96 filas tienen `|` en la voz.
  - Otras voces documentadas: GuyNeural, en-GB-SoniaNeural, en-GB-RyanNeural.
- `lista_audios_kokoro.csv`: 211 filas, voces `af_heart` (178) y `am_michael` (33). En el texto, `|` separa partes con pausa de 0.35 s (verbos irregulares base|pasado|participio). Velocidad 0.95. No hay dialogos aqui.
- Uso de argumentos: ruta exacta o carpeta terminada en `/` (ej. `audio/clases/frases/`).

## Flujo para agregar audio nuevo (Edge TTS)
1. El usuario lo hace en su Windows (el sandbox no tiene red hacia el servicio TTS de Microsoft). Requisitos una vez: Python con PATH y `pip install -U edge-tts`.
2. Agregar fila al final de `tools/lista_audios.csv`: `audio/<carpeta>/<nombre>.mp3,Texto en ingles,` (voz vacia = Jenny).
   - Dialogo: texto con lineas `— Hola` / `— Hi` y voz `en-US-AvaMultilingualNeural|en-US-AndrewMultilingualNeural`.
3. Guardar el CSV en UTF-8 (importante para el em dash).
4. Desde `tools`: `python generar_audios.py audio/<carpeta>/<nombre>.mp3` (solo esa fila). Sin argumentos regenera TODO el CSV y sobrescribe.
5. Verificar: el mp3 existe y no pesa 0 bytes; `ffprobe -v error -show_entries format=duration -of csv=p=0 archivo.mp3` debe devolver una duracion; escuchar una vez.
6. Referenciar el audio en el HTML o JS que corresponda y probar en celular. Subir (commit/push) lo hace el usuario.

## Flujo Kokoro
- Una vez: `pip install kokoro-onnx lameenc`; modelos `kokoro-v1.0.onnx` y `voices-v1.0.bin` en `tools/.kokoro-models` o variable `KOKORO_DIR` (carpeta gitignored; existe tambien `tools/.kokoro-env`).
- Agregar fila a `lista_audios_kokoro.csv` (voz `af_heart` por defecto, `am_michael` para hombre).
- `python generar_audios_kokoro.py` crea solo los que faltan; `--force <ruta>` regenera.
- Academia: desde la raiz, `python tools/generar_audios_academia.py` (requiere Node).

## Voces por defecto
- Edge: Jenny (default del script), Ava (femenina natural, glosario y dialogos), Andrew (masculina natural, segunda voz).
- Kokoro: `af_heart` (mujer), `am_michael` (hombre).
- Los mp3 ya existentes no cambian al cambiar el default.

## Audio en el navegador (JS)
- `leo-voz.js` (133 lineas): bloque "Profe Leo te acompana". `<div class="leo-voz" data-leo-voz="bienvenida" hidden>` busca `audio/leo/<id>.mp3` con HEAD; si no existe, queda oculto. Nunca autoplay, un solo audio a la vez, volumen en localStorage `leo_voz_vol`. Detecta 404 que devuelven HTML por content-type.
- `academia-audio.js` (607 lineas): GENERADO por `generar_audios_academia.py`, no editar a mano. Mapa `ACADEMIA_AUDIO` texto a archivo (`f`, `m`, `v`); decide que botones mostrar.
- `juego-audio.js` (198 lineas, `RushAudio`): efectos y musica 8-bit con Web Audio API, sin mp3. Preferencia en `leo_rush_sound`.

## Como modificar sin romper
- No renombrar ni mover mp3 sin buscar su ruta en html, js, csv y manifests (`grep -rn nombre`).
- No editar `academia-audio.js` a mano; regenerarlo con el script.
- Nunca correr `generar_audios.py` sin argumentos salvo que se quiera regenerar los 603 y cambiar voces/ritmo de audios ya publicados.
- Para dialogos, mantener el em dash al inicio de cada turno y la columna de voz con `|`.
- Mantener el CSV en UTF-8 y con comillas en textos multilinea o con comas.
- Los nombres de `audio/leo/` son fijos; si falta uno el boton simplemente desaparece.
- Tras generar: ffprobe de cada archivo nuevo y prueba en celular.
- Anadir siempre el audio nuevo al CSV correcto para poder regenerarlo luego.

## Riesgos y pendientes detectados
- `audio/a0/a0listening-019.mp3` pesa 0 bytes (ffprobe falla). Esta en el CSV ("It is cold today."); regenerar con `python generar_audios.py audio/a0/a0listening-019.mp3`. Probablemente da error o silencio en la pagina.
- Temporal huerfano 0 bytes: `audio/articulos/this-that-these-those/dialogo-zapateria.mp3.tmp0.mp3` (dialogo interrumpido el 14 oct). Borrar a mano; ademas el mp3 final existe (360 KB) pero conviene revisarlo. No esta en .gitignore y puede estar subido.
- Ningun script valida salida: tras un fallo de red puede quedar un mp3 de 0 bytes. Falta un chequeo automatico (por ejemplo un script ffprobe sobre todo `audio/`).
- `generar_audios.py` no salta existentes (a diferencia de Kokoro y glosario): riesgo de sobrescribir si se corre sin argumentos.
- Dos motores con voces distintas (Edge y Kokoro) en la misma carpeta de articulos: posibles diferencias de calidad y volumen entre audios vecinos.
- Unos 774 mp3 no estan en ningun CSV de `tools/`; su regeneracion depende de scripts por lote (`generar_miembros*`, `generar_toeic_audios.py`, etc.) cuyo estado no se verifico uno por uno.
- Scripts por lote duplicados y dispersos (`tools/` y raiz); conviene documentar cual sigue vigente.
- El sandbox no tiene red hacia TTS: toda generacion nueva depende de que Leo la corra en su Windows; `preparar_audios_leo.py` ademas necesita `imageio_ffmpeg` y los WAV originales de Leo, que no estan en el repo.
- 54 MB de audio en el repo: crece el repo y el tiempo de clone; vigilar el limite de Pages.


======================================================================
# 09. Frontend, despliegue y medicion

Auditoria de solo lectura. Repo: `inglesconLeo` (sitio estatico, GitHub Pages, dominio `inglesconleo.com`).

## Resumen
- Sin build ni bundler: HTML, CSS y JS a mano en la raiz. Lo que esta en `main` es lo que se publica.
- 99 archivos `.html` en la raiz (unos 60 son `articulo-*.html`), 96 llevan GA4.
- Fuera de la raiz, `tools/` contiene generadores, pruebas y auditorias. No se publican como parte del sitio pero SI estan en el repo (que es publico).

## Despliegue
- Rama de despliegue: `main` (rama actual verificada). GitHub Pages sirve la raiz.
- `CNAME` contiene `inglesconleo.com`. No existe `404.html`.
- Flujo real: editar, probar, `git add`, `git commit`, `git push origin main`. Pages publica en 1 a 2 minutos.
- `.github/workflows/indexnow.yml`: en cada push que toque `**.html` avisa a Bing/Yandex (espera 60 s). Usa la clave `41c1350951c5e79e95e8a4d0b5c84112.txt` de la raiz. Un 403 de Bing es warning amarillo, no rojo.
- `.github/workflows/site-health.yml`: diario a las 12:00 UTC. Escribe `SITE_HEALTH_REPORT.md` y `tools/site-health/history.json` DENTRO del repo (permiso `contents: write`). Consecuencia: puede haber commits automaticos en `main`, hacer `git pull` antes de empujar.
- `sitemap.xml` y `robots.txt` en raiz, se mantienen a mano.

## Estructura de la raiz
- Paginas: `index.html`, `sobre-leo.html`, `clases-particulares.html`, `clases.html`, `aprender.html`, `juego.html`, `academia.html`, `academia-de-ingles.html`, `miembros.html`, `practica.html`, `practica-miembros.html`, `ielts.html`, `toefl.html`, `toeic.html`, `cambridge.html`, `libro-100-errores-comunes-ingles.html`, `libro-gracias.html`, `privacidad.html`, `baja.html`, `encuesta.html`, entre otras.
- JS principales: `app.js` (564 KB, motor central), `backend.js` (Supabase), `data.js`, `temas.js`, `chatbot.js`, `leo-voz.js`, `mini-lecciones.js`, `survey.js`, `inicio-alumno.js`.
- Academia: `academia.js`, `academia-data.js` (128 KB), `academia-motor.js`, `academia-nube.js`, `academia-audio.js`, `academia-cursos.js`, `academia-boot.js`, `academia-lanzamiento.js`, `academia.css`.
- Examenes: `ielts*.js`, `toefl*.js`, `toeic*.js`, `cambridge*.js` (con `-data.js`).
- Otros: `article-quiz.js`, `error-monitor.js`, `meta-pixel.js`.
- Documentos sueltos en raiz: `AUDITORIA_COMPLETA_2026-10-14.md`, varios `SEO_*.md`, `ACADEMIA_INTEGRACION.md`, `LANZAMIENTO_TO_BE.md`, `SITE_HEALTH_REPORT.md`, `DEVLOG.txt` (478 KB, bitacora de cambios).

## style.css (180 KB, un solo archivo)
- Variables en `:root` (linea 6): `--paper #FBF8F2`, `--paper-dim`, `--ink #1B2333`, `--ink-soft`, `--ink-faint`, `--blue #3554F0`, `--blue-deep`, `--blue-tint`, `--amber`, `--coral`, `--green`, `--violet`, `--teal`, `--gold` (cada color con `-tint` y varios con `-deep`), `--line`, `--radius-lg 28px`, `--radius-md 18px`, `--radius-sm 12px`, `--shadow`.
- Fuente: Inter con fallbacks `Inter Fallback`.
- `body` tiene `padding-bottom:74px` para dejar sitio a la nav movil inferior.
- Nav movil: `.mobile-nav` (linea 415), `position:fixed; bottom:0`, respeta `env(safe-area-inset-bottom)`, se oculta con `@media(min-width:900px)`. Items `.mnav-item` (ajuste en linea 2403). La barra la define cada HTML al final (`<nav class="mobile-nav">`, en `index.html` linea 659), no un script.
- Breakpoints mas usados: `min-width:900px` (7), `max-width:640px` (7), `min-width:700px` (4), `760/759px`, `820px`, `1150px`, `480px`, `560px`. Hay bloques para `prefers-reduced-motion` y `(hover:hover) and (pointer:fine)`.
- Componentes por prefijo: `hero-v2`, `how-v2`, `home-*` (home-two-ways, home-trust, home-skills, home-levels, home-guides, home-book, home-testimonials, home-plans, home-social, home-contact), `video-carousel-*`, `leo-voz-*`.
- Hojas adicionales: `aprender.css`, `academia.css`, `chatbot.css`.

## index.html: secciones en orden
1. `<nav class="nav-links">` (cabecera)
2. `hero-v2`
3. `how-v2`
4. `home-two-ways`
5. `home-trust` (id `metodo-leo`)
6. `home-skills`
7. `home-levels`
8. `home-guides`
9. `home-book` (promo libro 100 errores)
10. `home-testimonials`
11. `home-plans` (id `planes`)
12. `home-social`
13. `home-contact` (id `contacto`)
14. `<footer>` y `<nav class="mobile-nav">`

Orden de scripts en home: `academia-lanzamiento.js`, `error-monitor.js` (debe ir primero, atrapa errores tempranos y envuelve fetch), `app.js`, `mini-lecciones.js`, supabase-js (CDN jsdelivr `@2`, sin version fija), `backend.js`, `leo-voz.js`.

## Otras paginas pedidas
- `sobre-leo.html` y `clases-particulares.html`: paginas estaticas con el mismo head (GA4, pixel, manifest) y `style.css`.
- `clases.html` + `clases.js` (736 lineas): mini-clases situacionales. Reutiliza funciones de `app.js` (`playAudioFile`, `recordSession`, iconos). Audios en `audio/clases/frases/<id>-<n>.mp3`. Si cambia una firma en `app.js`, se rompe `clases.js`.
- `aprender.html` + `aprender.js` (683) + `aprender.css` + `aprender-data.js`: rutas de lecciones con eventos `aprender_*`.
- `juego.html` + `juego.js` (474) + `juego-data.js` + `juego-audio.js`: English Rush, seccion gratuita "hasta donde puedes llegar".
- `fb/index.html` e `ig/index.html` (4 KB cada una): paginas de aterrizaje cortas para redes.
- `docs/`: 11 notas `.md` de lanzamientos y pruebas (Supabase, proteccion de contenido premium). No son parte del sitio.
- `assets/`: `libro/` (portada) y `testimonials/` (fotos anonimas). 304 KB.

## PWA y favicons
- `site.webmanifest`: `name` "Ingles con Leo", `short_name` "Leo", `display standalone`, `start_url /index.html`, `theme_color #030b1a`, `background_color #ffffff`, iconos 192 y 512.
- Archivos: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`, `og-logo.png` (imagen OG).
- No hay service worker (nada que invalide cache salvo el `?v=`).

## Versionado de cache (?v=)
- Cada `<script>` y `<link>` local lleva `?v=AAAAMMDDx` (fecha mas letra). GitHub Pages cachea y el navegador tambien, asi que sin cambiar el `?v=` el movil sigue viendo la version vieja.
- Cuando subirlo: cada vez que cambia el contenido de ese archivo. Se cambia en TODAS las paginas que lo cargan (no hay include comun).
- Estado actual medido:
  - `style.css?v=20261109c` en las 99 paginas (consistente).
  - `backend.js?v=20261109a` en 76 paginas.
  - `app.js?v=20261109h` en 88 paginas y `app.js?v=20261109i` en 4. Hay 4 paginas con version distinta, probable cambio a medias (ver riesgos).
  - `app.js` y `aprender.html` tienen fecha de modificacion Nov 11 14:02, posterior a las versiones `?v=` (09 nov). Verificar que el cambio de `app.js` de ese dia llevo subida de version.
- `error-monitor.js` reporta la version del sitio leyendo el `?v=` de `app.js`: si el `?v=` queda viejo, los reportes salen con version equivocada.
- Receta segura: buscar la cadena vieja con `grep -l "app.js?v=20261109h" *.html` y reemplazar en todos los resultados; luego contar que no quede ninguna con la vieja.

## Medicion
- GA4: `G-0DRL810MYR`, snippet `gtag('config', ...)` en cada pagina (96 de 99; las 3 restantes revisar si es intencional).
- Eventos `gtag` encontrados: `book_promo_click` (home y articulos, 7 usos), `book_checkout_click`, `book_spei_view`, `book_purchase_completed`, `search`, y una familia dinamica `academia_*`.
- Eventos propios via `track('...')` (se envian a GA4 y a la nube desde `app.js`/`aprender.js`/`academia.js`): `aprender_opened`, `aprender_lesson_started`, `aprender_lesson_resumed`, `aprender_lesson_completed`, `aprender_practice_clicked`, `aprender_upsell_clicked`, `aprender_signup_clicked`, `aprender_locked_clicked`, `aprender_return`, `demo_iniciada`, `demo_completada`, `demo_bloqueada`, `demo_clic`, `demo_cta_desbloquear`, `leccion_iniciada`, `leccion_completada`, `repaso_iniciado`, `refuerzo_clic`, `meta_semanal`, `evaluacion_practica_iniciada`, `evaluacion_practica_terminada`, `evaluacion_oficial_iniciada`, `evaluacion_oficial_terminada`, `evaluacion_oficial_aprobada`, `curso_lecciones_completas`, `cta_membresia`.
- `meta-pixel.js`: Meta Pixel `2182739922655837`, se carga en todas las paginas. Eventos: `PageView` y `Purchase` (libro). Cambiar el ID se hace en un solo archivo.
- `error-monitor.js`: manda errores JS, promesas rechazadas, recursos rotos y 5xx de Supabase a la Edge Function `report-error`. Limpia correos, tokens, UUID y URLs con query. Solo activo en `inglesconleo.com`. Es fail-safe (todo en try/catch).
- Las consultas SQL de informes estan en `tools/informe_conversion.sql`, `informe_oferta.sql`, `informe_academia_24h.sql`.

## Pruebas y herramientas
- `tools/e2e/`: QA sin red ni dependencias. Ejecuta el `app.js`, `backend.js`, `data.js`, `temas.js` reales contra una nube simulada. Comandos: `node tools/e2e/run-all.js` (informe completo), `node tools/e2e/regresiones.js`, `node tools/e2e/test-microtema.js <id>` o `--all-active`. Los archivos `*.browser.js` son para navegador real. Sesion de prueba en `tools/e2e/.auth/` (ignorada por git).
- `tools/tests/` (90 archivos): `*.test.js` unitarias y `*.e2e.js` de academia (articulos, can, comercial, cursos nuevos, seguridad). Se corren con `node`.
- `tools/site-health/`: `audit.js` (crawler SEO), `run-lighthouse.js`, `glossary-audit.js`, `gsc-*.js`; tiene su propio `package.json` y `node_modules`. Historial en `history.json` y `lighthouse-history.json`. Credencial GSC solo como secret `GSC_SERVICE_ACCOUNT_JSON`, nunca archivo.
- Otros en `tools/`: `indexador/`, `glosario/`, `leo-ai-eval/`, generadores de audio (`generar_audios*.py`, Kokoro/Edge TTS), generadores de academia (`generar_academia_*.js`), `respaldo_supabase.sh`, `prelanzamiento.js`.
- `tools/` pesa 635 MB (audios, modelos, node_modules propios). `tools/.kokoro-models/` esta ignorado.
- `node_modules/` en raiz (23 MB): solo contiene `typescript`, sin `package.json` en raiz. Esta en `.gitignore`. Sirve de apoyo local para chequeos de tipos, no lo usa el sitio.

## Carpetas raras
- `private/` (17 MB): copia del banco REAL del examen y de los JS de contenido. Ignorada por git (`.gitignore` linea 51), correcto porque el repo es publico. No mover ni borrar sin respaldo, es la unica copia fuera del servidor.
- `_to_delete/` (65 MB): basura que Claude deja para que Leo borre a mano (`.bak`, `.tgz`, scripts `edit_*.py`). Ignorada por git. Se puede vaciar cuando Leo lo decida.
- `Claude outputs/` (560 KB): `PLAN_SPANISHBYLEO.md`, capturas `desktop.png`/`mobile.png`, mp3 de muestra. NO esta ignorada: esta rastreada en git y por tanto publica en GitHub Pages.
- `_push.patch` (327 KB, 26 oct): parche viejo. Aparece como no rastreado (`??`) y no esta ignorado, riesgo de subirlo por accidente con `git add .`.
- `.claude/` ignorado. `__pycache__/` ignorado.

## Como probar en movil
1. Servir local: `python -m http.server 8000` en la raiz y abrir desde el telefono por IP de la red (`http://IP:8000`), o usar Chrome DevTools con modo dispositivo a 375 px.
2. Revisar siempre 375 px (iPhone SE/estandar), 360 px (Android) y 390 px. Probar la nav inferior: que no tape botones (hay 74 px de padding) y que respete la zona segura.
3. Tras publicar, abrir en el telefono con recarga forzada o pestana privada; si se ve vieja, falta subir `?v=`.
4. Probar audio (autoplay bloqueado en iOS hasta un toque), login Supabase y flujo de pago del libro (Stripe, PayPal, OXXO, SPEI).
5. Correr `node tools/e2e/run-all.js` antes de empujar si se tocaron `app.js`, `backend.js`, `data.js` o `temas.js`.

## Trampas de CRLF y OneDrive en Windows
- Archivos mixtos: `app.js` tiene 10297 lineas CRLF; `index.html`, `style.css` y `aprender.js` son LF. No existe `.gitattributes`, asi que git no normaliza y los diffs pueden salir enormes si un editor reescribe los finales de linea.
- Al editar con scripts (sed, python) conservar el estilo de linea del archivo; un `replace` multilinea con `\n` no encuentra texto en un archivo CRLF.
- OneDrive: sincroniza la carpeta, puede bloquear archivos (`index.lock`, ver los `index.lock.bak*` en `_to_delete/`), dejar `.git` en estado raro y mostrar archivos "solo en la nube". Recomendado: pausar OneDrive al hacer commits o sacar el repo de OneDrive.
- Rutas con acentos y espacios (`Claude outputs`) rompen scripts mal citados.
- Un `git status` lento o con muchos cambios fantasma suele ser CRLF o fechas de OneDrive, no cambios reales.

## Como modificar sin romper
- Despues de editar `app.js`, `backend.js`, `style.css` u otro asset, subir `?v=` en TODAS las paginas que lo cargan y confirmar con grep que no quedan dos versiones.
- Mantener `error-monitor.js` como primer script y GA4/pixel en el `<head>` de cada pagina nueva (copiar de una pagina existente).
- Pagina nueva: agregarla a `sitemap.xml`, poner canonical, og, manifest, favicons y `mobile-nav`.
- No cambiar nombres de funciones de `app.js` usadas por `clases.js`, `aprender.js`, `juego.js`, `academia*.js`.
- Respetar CRLF/LF del archivo editado.
- Nunca subir `private/`, `.env`, claves, ni el banco real del examen (repo publico).
- Antes de `git push`: `git pull` (el workflow Site Health escribe en `main`), correr e2e si aplica, probar a 375 px.
- Colores y radios por variables `:root`, no valores sueltos.

## Riesgos y pendientes detectados
- `app.js?v=` inconsistente: 88 paginas en `...h` y 4 en `...i`. Unificar y confirmar cual es la ultima.
- `app.js` modificado el 11 nov 14:02 con `?v=` del 09 nov: posible cache vieja en movil si hubo cambio de codigo.
- `Claude outputs/` rastreada en git (incluye capturas y mp3), publica en el dominio. Valorar quitarla del repo o ignorarla.
- `_push.patch` sin rastrear ni ignorado: agregar a `.gitignore` o borrar.
- Hay audios sin rastrear en `audio/` y `SEO_EXPERIMENTO_CLICS_2026-10-31.md` pendientes de commit.
- Sin `.gitattributes`: finales de linea mixtos, diffs ruidosos.
- Repo publico con `.md` internos (`AUDITORIA_COMPLETA`, `SEO_*`, `docs/`) y `DEVLOG.txt` de 478 KB accesibles por URL.
- 3 paginas sin GA4 (96 de 99): confirmar si es intencional (por ejemplo paginas de gracias o baja).
- supabase-js cargado desde CDN con `@2` sin fijar version ni SRI: un cambio upstream puede romper el sitio.
- No hay `404.html` propia.
- Peso: `app.js` 564 KB y `style.css` 180 KB sin minificar ni division, impacto en movil lento.
- `tools/` 635 MB y `_to_delete/` 65 MB dentro de OneDrive: sincronizacion lenta y riesgo de bloqueos.
- Sin CI que corra las pruebas en cada push (solo IndexNow y Site Health).


======================================================================
# Auditoria 10: historial y estado del proyecto

Fuente: DEVLOG.txt (2035 lineas, 478 KB, 290 entradas con fecha) y `git` de solo lectura. Corte: 2026-11-11. Repo: `inglesconLeo`, rama actual `main` = `origin/main` = eefe10c.

## Estructura del DEVLOG
- Cabecera de 2 lineas: "Registro breve de cambios grandes... sin gastar muchas lineas". En la practica las entradas son largas (cientos de caracteres por vineta), contradiciendo esa consigna.
- Formatos mezclados: `2026-10-08 - Titulo`, `2026-10-07 | ...`, `=== 2026-11-04 · ... ===`, y entradas numeradas `(12)` a `(29c)` sin fecha en el encabezado.
- Orden NO cronologico: arranca con 3 entradas del 2026-10-08, sigue con 2026-10-04, luego 2026-09-07, y despues avanza de forma irregular. Las entradas nuevas se insertan arriba a veces y abajo otras.
- Numeracion rota: tras `(27)` salta a `(29c)`. Faltan `(28)`, `(29)`, `(29a)`, `(29b)` (probablemente las entradas del libro, la rama `fix/cierre-miembro` y el cierre de WH).
- Dias con mas entradas: 09-10 (22), 09-09 (20), 10-03 (19), 10-13 (16), 09-14 y 10-12 (14/15), 11-08 (12 entradas).

## Hitos en orden cronologico
- 2026-09-07: arranque con home v2, LeoBot v2, practica gratis por pestanas, audio MP3 real en Listening y Speaking, canonical a GitHub Pages.
- 2026-09-09/10: pico de trabajo (42 entradas): SEO de los primeros articulos, correos de bienvenida, Stripe vs Mercado Pago en "Administrar suscripcion".
- 2026-09-14: limpieza de textos ("Membresia" fuera de badges), 15 entradas.
- 2026-09-17: encuesta a los 15 dias de membresia.
- 2026-10-02: Glosario de ingles (SEO) con indice y 36 paginas iniciales.
- 2026-10-04: glosario sube a 100 fichas de pronunciacion y 138 pistas de audio (100 pendientes de generar).
- 2026-10-08: tarjeta de feedback para miembros, checkout abandonado con 2 correos y freno global de 24 h, sugerencia de nivel.
- 2026-10-12/13: sprint SEO glosario con datos de Search Console, articulo de migracion, Plan con variedad y micro-temas.
- 2026-10-14: auditoria SEO de 405 URLs del sitemap y enlaces internos articulos a glosario (existe `AUDITORIA_COMPLETA_2026-10-14.md`).
- 2026-10-15: prueba gratis de Leo AI activada (`trial_enabled=true`, 5 explicaciones por cuenta).
- 2026-10-20: PayPal con cobro mensual; informes SEO (linea base, duplicados, URLs).
- 2026-10-21: Modo aprender (microlecciones con audio, funcion de membresia).
- 2026-10-25: reserva de clases particulares por TidyCal; articulo did/was/were; Academia fase 2, curso piloto TO BE (rama `academia/piloto-to-be`).
- 2026-10-26: modelo comercial de Academia en servidor; Apple Pay, Google Pay y formulario Stripe embebido directo.
- 2026-10-28: cursos 3 (articulos y plurales) y 4 (posesivos) publicados, contenido y audio protegidos en servidor.
- 2026-10-30: recuperacion del proyecto (la carpeta OneDrive iba 29 commits atras); cursos 5 y 6 cargados apagados y luego publicados; correccion de audio del curso 4; insignias en tarjetas; texto "Lecciones completadas: X de Y".
- 2026-10-31: LeoBot pide correo o telefono en "Contactar"; experimento SEO de clics (`SEO_EXPERIMENTO_CLICS_2026-10-31.md`).
- 2026-11-01: curso 7 Presente simple cerrado, probado con audios reales y publicado el mismo dia con autorizacion de Leo; nuevas tarjetas de ejercicios en articulos.
- 2026-11-04: Leo AI v19 desplegado (errores tecnicos 2 a 0, sin ejemplo duplicado); curso 8 DO/DOES preparado y abierto; correccion de pronunciacion de "live"; cursos 9, 10 y 11 desarrollados y ocultos.
- 2026-11-08: curso 9 WH preparado, probado en produccion y abierto en codigo; limpieza de datos personales en archivos publicos; aislamiento de datos entre cuentas (LeoScope); fases educativas 1 a 3 (error a clase, refuerzo distinto, memoria para cuentas gratis, Practicar con Academia y viceversa); precio visible solo $2 USD; `academia-de-ingles.html` actualizada a 9 cursos.
- 2026-11-09: Leo AI con memoria educativa; medicion de compras en GA4; tarjeta tras la primera sesion gratis; modelo "3 + 3" (3 invitado, 6 cuenta); publicado en origin/main 5330328; corte de medicion 2026-11-09 17:08:16 UTC; prueba como miembro en produccion.
- 2026-11-11: libro "100 errores comunes" (venta con Stripe, PayPal, OXXO y transferencia), promo en home, 5 articulos y practica gratis (commits 8e39cfe, 1208573, eefe10c en main).

## Decisiones del dueno que aparecen
- Precios: precio visible solo "$2 USD" al mes y "$20 USD" anual; se retiraron 37/40 MXN del cuadro de membresia, avisos y correo de nudges. Siguen en la pantalla de pago (tarjeta y Mercado Pago), funciones y webhooks.
- Modelo freemium "3 + 3": invitado 3 ejercicios al dia, cuenta gratis 6; recargar o abrir otra pestana no regala ejercicios; la invitacion a membresia sale solo al llegar al limite o en la tarjeta de primera sesion, no tras cada sesion.
- Leo AI para cuentas gratis: 5 explicaciones por cuenta, solo de ejercicios fallados; limites `user_daily_limit` 100, global 1500 (verificados el 11-04).
- Cursos: cada apertura necesita autorizacion explicita de Leo ("autorizado por Leo" en 7, 8 y 9). Orden fijo: carga apagada, subir audios, prueba privada con canario, apertura en codigo, `enabled=true`.
- Insignia: depende del examen calificado en servidor, no de terminar lecciones (decision conservada el 10-30).
- Espanol neutro latinoamericano ("carro", no "coche"; "soccer"; "manejar") en cursos 5 y 6; el curso 4 publicado aun usa "coche" 22 veces, pendiente de autorizar.
- Audio de cursos 4 a 6 solo en ingles (campo `say`); herramienta Kokoro aceptada por prueba de paridad.
- Seguridad: contenido premium y examenes solo por servidor; material privado en `C:\ICL-Privado` y respaldo cifrado v4 (2026-10-30).
- Privacidad: se limpiaron correos y rutas privadas del DEVLOG y otros docs; el historial de Git no se toco ("plan aparte").
- Medios de pago activos: Stripe (tarjeta, Link, Apple Pay, Google Pay), PayPal mensual, Mercado Pago, mas OXXO y transferencia para el libro.

## Estado de las ramas
Recuento contra `main` (commits propios de la rama que main no tiene, por patch-id):

- `main` (eefe10c, 2026-11-11): igual a `origin/main`, limpia salvo archivos sin seguimiento.
  - Sin rastrear: `SEO_EXPERIMENTO_CLICS_2026-10-31.md`, `_push.patch`, 5 mp3 `audio/dialogo-*`.
- `fix/cierre-miembro` (7345b02, local): 4 commits propios que NO estan en main por contenido:
  - 9de396c "Cierre: encabezado de miembros con el total real, sin texto repetido; WH habilitado (DEVLOG)" (2026-11-09).
  - 8d1e983, c967f79, 7345b02: tres iteraciones del libro. Main ya tiene su version final reescrita como 8e39cfe (mismo asunto que 7345b02), asi que probablemente 3 de 4 estan superados.
  - Diff contra main: 95 archivos, 440 lineas mas y 2074 menos (por quedar atras, no por borrar). Inspeccionar antes de fusionar; no usar merge ciego.
  - `origin/fix/cierre-miembro` apunta a c967f79, 1 commit detras de la local (7345b02 sin subir).
- `dev/curso-6-ajustes` (9946967, 2026-10-30): 0 commits propios; ya contenida en main (curso 6 publicado). Obsoleta.
- `dev/cursos-5-6` (8a4ef28, 2026-10-30): 1 commit propio, el DEVLOG "estado real de los 8 cursos". El contenido textual ya esta en DEVLOG de main por la fusion del 10-30; obsoleta.
- `lanzamiento/curso-5` (a0bbaf1, 2026-10-30): 0 propios; contenida en main. Obsoleta.
- `seo-organic-clicks-experiment` (43d3064, 2026-10-31): 0 propios (ya fusionada con main); 59 commits detras. Atencion: el experimento SEO de clics sigue documentado solo como `.md` sin rastrear en main.
- Otras: `backup-antes-de-github`, `backup/pre-seo-experiment-20261031` (61 detras de origin/main). Remotas viejas: `academia/piloto-to-be`, `academia/pronombres(-publicar)`, `curso/*`, `proteccion/contenido-premium`, `embudo/demo-academia`, `integracion/embudo-y-rediseno`, `rediseno/inicio-alumno`, `seo/enlace-test-nivel-articulos-citados`.
- 2 stashes antiguos en main: "Leo AI v16..." (sobre 7193938) y "sitehealth-local". Probablemente descartables, pero revisar antes.

### Sin publicar (segun git)
- Casi nada de codigo local pendiente en main. Lo no publicado es: el commit 9de396c (WH habilitado y encabezado de miembros) en `fix/cierre-miembro`, el commit 7345b02 sin subir, `SEO_EXPERIMENTO_CLICS_2026-10-31.md` y los 5 mp3 de dialogos sin rastrear.
- Los cursos 10 (presente continuo) y 11 (in/on/at) estan desarrollados y ocultos, con migracion apagada, sin cargar en produccion segun la ultima entrada.

## Pendientes abiertos que se desprenden del DEVLOG
1. Desplegar `upgrade-nudge-emails` (el correo aun dice $37 MXN en produccion; entrada 14 del 11-08).
2. Desplegar `leo-ai` (sin eso la IA ignora `history`; entrada 17); el codigo esta duplicado en `supabase/functions/leo-ai/index.ts` y debe mantenerse identico.
3. Desplegar las 6 funciones del 10-08: `upgrade-nudge-emails`, `streak-reminder-email`, `survey-15d-email`, `stripe-checkout`, `paypal-checkout`, `super-service`; no hay registro de que se hicieran.
4. Aplicar la migracion `20261008190000_member_feedback.sql` a mano si no se hizo; no hay confirmacion.
5. Confirmar `enabled=true` del curso WH en `academia_courses` (ver contradicciones).
6. Subir los 5 mp3 corregidos de "live" a Storage (reemplazar) para do-does y presente-simple; sin confirmacion.
7. Curso 4: decidir si se recarga el examen (e-t6 difiere entre SQL publicado y JSON privado) y cambiar "coche" por "carro" (22 usos).
8. Cursos 10 y 11: regenerar seeds con `academia_seed_contenido.js` antes de cargar (no traen mapa de audios); subir audios (209 y 141), prueba privada y autorizacion.
9. Limpiar Storage: 42 copias "(1)" en `academia-audio/posesivos/` y 4 audios viejos; borrar copias sin cifrar y zips en el equipo de Leo; guardar la clave del respaldo en su gestor.
10. Ramas viejas a retirar: `curso/articulos-plurales`, `proteccion/contenido-premium` y las ahora obsoletas locales (`dev/*`, `lanzamiento/curso-5`).
11. Fase 1 (error a clase), aislamiento de cuentas v1/v2 y fases 2 y 3: el DEVLOG dice "SIN publicar" hasta el 11-09; solo se confirma publicacion en la entrada 26 (5330328). Verificar que aislamiento de cuentas y conexion error a clase entraron en esa version.
12. Medicion: observar `first_session_offer_viewed/clicked` y `checkout_started` en GA4 tras el corte; no probado con cuenta gratis real en produccion.
13. Observaciones menores de la entrada 27: encabezado de miembros "8 preguntas" frente a 9 reales (posible arreglado en 9de396c), panel 98 frente a progreso 96 errores, texto repetido en "Condicionales".
14. Glosario: audio de 100 fichas nuevas y de 3 fichas nuevas (who-vs-whom, by-vs-until, past-perfect) pendiente; `tools/generar_glosario.js` regenera unas 75 fichas con contenido distinto al publicado (no usar sin revisar). Revisar `phrasal-verbs` a `look-for` (ficha de un solo verbo).
15. Privacidad: plan aparte para el historial de Git (correos y rutas ya salieron del arbol, no del historial).
16. Libro: la entrada (29c) dice "Pendiente de publicar hasta autori...", pero main ya contiene la promo (1208573, eefe10c). Confirmar autorizacion y cerrar la entrada.
17. Pruebas conocidas con fallos: `error-monitor.test.js` espera 60 paginas HTML (hay 90 o mas), `session-cycle.test.js` intermitente, tres fallos previos de la bateria (11-08), y pruebas del curso 3 no corren en el entorno de desarrollo (contenido solo en el respaldo).
18. Overflow de ~11 px en el header/nav en todas las paginas (reportado el 09-07, sin entrada de cierre).
19. Dos archivos locales de limpieza: carpeta `_to_delete` y `_push.patch` sin rastrear.

## Contradicciones y entradas desactualizadas
- WH habilitado: la entrada 11-08 (3) dice "falta subir a GitHub y enabled=true"; la 27 (11-09) dice que sigue en `false` y que Academia muestra 8 cursos mientras la tarjeta promete 9. El commit 9de396c dice "WH habilitado", pero esta solo en `fix/cierre-miembro`, no en main. Ningun registro confirma que se ejecuto el `update`. Estado real: indeterminado, verificar en Supabase.
- Precio: el DEVLOG del 10-26 y el de 11-08 hablan de $2 USD / $20 USD, pero 37/40 MXN siguen en pagos y correos hasta desplegar; el encabezado de la cabecera ("solo $2") puede no coincidir con lo que ve el cliente mexicano.
- Cursos en la ruta: la entrada del 10-30 lista "7 Presente simple: pendiente" y "8 DO/DOES: pendiente" (obsoleta desde el 11-01 y 11-04). Su tabla "ESTADO REAL DE LOS 8 CURSOS" no se actualizo con los publicados 5 a 9.
- Cursos 5 y 6: la misma entrada afirma "TERMINADO y OCULTO" y cinco entradas despues "PUBLICADOS" (ok cronologicamente), pero las listas de pendientes de la primera (ramas, copias) se repiten sin marca de cierre.
- Audios: curso 5 aparece con 77, 72 audios segun la entrada; curso 6 con 70, 68 y 67 (el 67 es el valor publicado). Valores intermedios no marcados como superados.
- "Registro breve": la propia cabecera pide brevedad; el archivo pesa 478 KB.
- "SIN COMMIT" y "SIN publicar" del 11-08 (4) a (11): no hay entrada que diga cuales commits las publicaron (solo el rango de la 26). Parte de ellas se publico el 11-09.
- Entradas faltantes (28) a (29b); y (29c) cita "11 nov 2026" cuando el patron es ISO.
- La entrada del 11-08 de aislamiento de cuentas (6) dice "91 HTML", la (5) "90 paginas", y error-monitor espera 60: conteo de paginas inconsistente.
- Contador de cursos: la home y la tarjeta dicen "9 cursos", pero los cursos 10 y 11 (ocultos) tambien estan en el codigo; la prueba `ACADEMIA_COURSE_BY_TEMA` los vigila.
- Memoria del proyecto: la carpeta local ya habia quedado 29 commits atras de GitHub el 10-30 (OneDrive); riesgo recurrente. La rama local `fix/cierre-miembro` y `_push.patch` muestran divergencia semejante.

## Acciones sugeridas
- Verificar en Supabase `select course_id, enabled from academia_courses;` y reconciliar WH y 9de396c.
- Decidir el destino de `fix/cierre-miembro`: comparar con main y fusionar solo 9de396c si hace falta.
- Normalizar el DEVLOG: orden cronologico, numeracion y un resumen "estado actual" al inicio, archivando lo anterior al 10-25.
- Actualizar la tabla "estado real de los cursos" con los cursos 1 a 9 publicados y 10 y 11 ocultos.


======================================================================
# Auditoria 11: riesgos transversales y seguridad

Sitio: Ingles con Leo (GitHub Pages publico + Supabase + Stripe). Auditoria de solo lectura, sin modificar nada. No se reproduce ningun valor de secreto.

## Resumen

- No se encontro ninguna clave secreta real en el repo rastreado (sin sk_live reales, sin service_role pegadas, sin whsec_, sin JWT de servicio).
- Lo mas grave es de nivel medio: CORS abierto (`*`) en dos funciones Edge de pago/IA, y archivos que no deberian estar publicos.
- Hay cosas de higiene: placeholders rotos en articulos.html, version de app.js inconsistente en 5 paginas, sin SRI en scripts externos.

## Alto

Ninguno confirmado. Puntos a vigilar (sin evidencia de fuga):

- `_push.patch` (320 KB, raiz) esta SIN rastrear y NO ignorado: un `git add .` lo subiria al repo publico. Contiene codigo de funciones y una mencion a `pk_live` (publicable) mas un comentario sobre `sk_live_...`. No encontre secretos en el, pero es un parche de trabajo que no tiene motivo de ser publico. Anadirlo a `.gitignore` o borrarlo.
- Tambien sin rastrear: `SEO_EXPERIMENTO_CLICS_2026-10-31.md` y varios `audio/dialogo-*.mp3` (normal, solo pendientes de commit).

## Medio

### M1. CORS abierto en funciones que reciben tokens de usuario
- `supabase/functions/leo-ai/index.ts` linea 126: `Access-Control-Allow-Origin: *`.
- `supabase/functions/stripe-checkout/index.ts` linea 60: `*`.
- Mitigacion existente: ambas validan `Authorization` con `auth.getUser` (leo-ai linea 722, stripe-checkout linea 80), asi que no es explotable sin un JWT valido. Aun asi conviene restringir a `https://inglesconleo.com` (y `www`) como ya hace `libro-download` (linea 44). Riesgo real: otra web podria invocar la funcion de IA con un token robado y gastar cuota.
- Revisar tambien las copias en `supabase_functions/*.ts` (carpeta duplicada, ver M4).

### M2. Sin `supabase/config.toml` ni `verify_jwt` declarado
- `supabase/` solo tiene functions, migrations, rollback y verify. No existe config.toml, asi que `verify_jwt` depende de como se despliega cada funcion (por defecto activo).
- Funciones que DEBEN ir sin verify_jwt: `resend-webhook` (firma svix, verificada en linea 54, bien), webhooks de Stripe/PayPal/MP, `report-error`, `libro-download` (publica por diseno, la protege el pago).
- Recomendacion: agregar config.toml con `[functions.X] verify_jwt` explicito por funcion para que el despliegue sea reproducible y auditable.

### M3. `libro-download` sin limite de intentos
- `supabase/functions/libro-download/index.ts`: acepta `session_id`, valida formato y consulta Stripe; da un enlace firmado de 10 minutos. Es correcto (comprueba `paid` y el price id), pero no hay rate limit: cualquiera que obtenga un `cs_live_` pagado obtiene el PDF (esperado), y es un oraculo para probar ids. Riesgo bajo-medio; se resuelve con rate limit en el borde o dejando CORS restringido (ya lo esta).

### M4. Carpetas duplicadas de funciones
- `supabase/functions/` (5 funciones) y `supabase_functions/` (unos 20 .ts, mas .sql). Riesgo de desplegar la version vieja. Los 20 .ts contienen comentarios que explican `service_role` y variables de entorno: son documentacion, no claves.
- `supabase_schema.sql`, `supabase_functions/*.sql` y `tools/leo-ai-eval/out/*` (versiones antiguas de leo-ai) estan publicos: revelan la logica de IA, limites y estructura de tablas. No son secretos, pero facilitan ingenieria inversa (prompts, trial, limites).

### M5. Dato bancario y nombre completo en HTML publico
- `libro-100-errores-comunes-ingles.html` linea 371: variable `D` con un JSON en base64 (ofuscado, se decodifica con `atob`). Contiene nombre del titular, banco y una CLABE de 18 digitos de la cuenta de Mexico para transferencias. La CLABE es un dato que se comparte para recibir pagos y no permite retirar dinero, pero asocia nombre completo + cuenta y es raspable. La ofuscacion no protege. Decision de Leo: mantenerlo, o entregarlo solo tras iniciar compra.

## Bajo

### B1. RLS
- 7 `create table` en `supabase_schema.sql`, 7 `enable row level security`; ninguna tabla de migraciones queda sin RLS (script de cruce).
- Politicas permisivas intencionales: `article_comments: select all` (`using (true)`, comentarios publicos) y `academia_courses: read` (solo `authenticated`). Aceptable; comprobar que la politica de insert de comentarios tiene limites (el comentario del SQL dice que si).
- Hardening previo presente: migraciones `revoke_truncate_anon_authenticated` y `harden_profiles_anon_and_function_grants`.
- No pude ejecutar pruebas contra la base real (solo lectura del repo). Falta verificar en el panel que lo desplegado coincide con las migraciones.

### B2. Claves publicas expuestas (correcto)
- `sb_publishable_...` de Supabase en `backend.js`, `baja.html`, `libro-gracias.html`, `survey.js`: clave publicable, esperada en el cliente. Su seguridad depende de RLS (B1).
- `pk_live_...` de Stripe en `miembros.html`: publicable, correcto.
- `sk_live_abc...` en `tools/tests/error-monitor.test.js` linea 400 (y copia en `_to_delete/_tmp_em.test.js`): es una cadena de prueba corta para verificar que el monitor de errores censura claves; no es una clave real.
- `41c1350951c5e79e95e8a4d0b5c84112.txt` (32 bytes): archivo de clave de IndexNow, publico por diseno (lo dice el workflow indexnow.yml). No es riesgo.
- `.gitignore` cubre `.env`, `*.key`, `*.pem`, `secrets.json`, `.claude/`, service account de GSC, `_to_delete/` y `private/`. `private/` y `_to_delete/` NO estan rastreados (verificado con `git ls-files`).

### B3. noindex
- Con noindex: `baja`, `encuesta`, `libro-gracias`, `progreso`, `practica-miembros`, `mixto`, `plan-estudio`, `academia`.
- Sin noindex: `miembros.html` (esta en sitemap.xml, linea 69: parece intencional como landing de venta), `practica.html`, `juego.html`, `privacidad.html` (publicas, normal).
- Ninguna pagina del sitemap tiene noindex (sin conflictos).
- Revisar solo `academia-de-ingles.html` (sin noindex mientras `academia.html` si lo tiene): confirmar que es la landing publica a posicionar.

### B4. Archivos que sobran en un repo publico
- `Claude outputs/` (560 KB, rastreado): PLAN_SPANISHBYLEO.md, capturas desktop.png y mobile.png, 4 mp3 de muestra. Es material de trabajo; ademas el plan es de otro proyecto (SpanishByLeo).
- Documentos internos rastreados: `AUDITORIA_COMPLETA_2026-10-14.md` (71 KB), `SITE_HEALTH_REPORT.md`, `SEO_*.md`, `LANZAMIENTO_TO_BE.md`, `ACADEMIA_INTEGRACION.md`, `DEVLOG.txt` (478 KB), `docs/*.md`, `docs/validacion-supabase-real-curso3.md`. Revelan estrategia, hallazgos de seguridad anteriores y arquitectura. `AUDITORIA_COMPLETA...` y `DEVLOG.txt` mencionan `service_role`/`sk_` en prosa (sin valores); confirmar con una busqueda manual que ningun pasaje pega una clave.
- `.git` pesa 212 MB y `audio/` 54 MB: no es riesgo, pero ralentiza el clonado y GitHub Pages tiene limite de 1 GB.
- `supabase/verify/*.sql` y `supabase/rollback/*.sql` publicos: utiles para el equipo, no secretos.

### B5. Dependencias
- Solo hay `package.json` en `tools/indexador` (`playwright-core ^1.56`) y `tools/site-health` (`cheerio ^1.0`, `googleapis ^144`), ambos de uso local o CI y con lockfile. No hay `node_modules` rastreado (ignorado). Sin dependencias en el sitio publicado.
- En el navegador: `@supabase/supabase-js@2` por jsDelivr (76 paginas) sin fijar version menor ni SRI; Google Tag Manager en 94 paginas y Stripe js. Un compromiso de jsDelivr afectaria todas las paginas. Fijar `@2.x.y` y agregar `integrity`.
- 171 etiquetas `<script src="https://...">` sin `integrity` (esperable para GTM y Stripe, que no admiten SRI; si para jsDelivr).
- Ninguna pagina define Content-Security-Policy (0 de todas). GitHub Pages no permite cabeceras, pero se puede usar meta CSP.
- Todos los `target="_blank"` llevan `noopener` (0 fallos).

### B6. Enlaces rotos y consistencia (script sobre los .html de la raiz)
- Enlaces internos rotos: solo 3 unicos, todos en `articulos.html` (lineas 643 a 701): placeholders `PON_AQUI_LA_URL_DE_INSTAGRAM`, `..._TIKTOK`, `..._FACEBOOK`. La linea 833 tiene un script que los oculta por prefijo `PON_AQUI_LA_URL_DE_`, asi que probablemente el visitante no los ve, pero el HTML los contiene (SEO y bots). Poner las URL reales o quitar los bloques.
- Ids duplicados: 0 en todos los .html de la raiz.
- `?v=` inconsistente:
  - `app.js`: 88 paginas con `20261109h` y 5 con `20261109i` (`articulo-errores-comunes`, `articulos`, `libro-100-errores-comunes-ingles`, `libro-gracias`, `practica`). Las demas servirian app.js cacheado con otra version: unificar a la mas reciente.
  - `leo-voz.js`: `20261003e` en una pagina y `20261003d` en otra.
  - `meta-pixel.js`: 93 paginas lo cargan sin `?v=` (riesgo de cache vieja, y un script de seguimiento sin control de version).
- Nota de privacidad: meta-pixel y GTM en 93 y 94 paginas; confirmar que el aviso de cookies/consentimiento bloquea el pixel antes de aceptar (fuera de este alcance tecnico).

## Funciones Edge: autenticacion por funcion

- `leo-ai`: valida el token del usuario con `auth.getUser` (no depende solo de verify_jwt, segun comentario linea 644). Bien.
- `stripe-checkout`: `auth.getUser(token)`. Bien. El webhook de Stripe y los de PayPal/MP viven en `supabase_functions/`: verificar que comprueban firma (no auditado a fondo aqui).
- `resend-webhook`: firma svix verificada (HMAC), rechaza si faltan cabeceras. Bien.
- `upgrade-nudge-emails`: exige `x-internal-secret` contra Vault via `internal_secret_ok` (solo service_role). Bien.
- `libro-download`: sin auth por diseno, protegida por pago en Stripe.

## Acciones sugeridas por prioridad

1. Restringir CORS de `leo-ai` y `stripe-checkout` a `https://inglesconleo.com`.
2. Agregar `_push.patch` y `Claude outputs/` a `.gitignore` (y sacar `Claude outputs/` del indice con `git rm --cached` cuando Leo lo decida).
3. Crear `supabase/config.toml` con `verify_jwt` explicito.
4. Fijar la version de supabase-js en jsDelivr y agregar SRI.
5. Unificar `?v=` de `app.js`, `leo-voz.js` y `meta-pixel.js`.
6. Reemplazar placeholders de redes en `articulos.html`.
7. Decidir si la CLABE ofuscada del libro debe estar en el HTML.
8. Consolidar `supabase_functions/` y `supabase/functions/` en una sola carpeta.

## Limites de esta auditoria

- Solo lectura del repo local; no se consulto Supabase, Stripe ni el sitio en vivo.
- La busqueda de secretos fue por patrones (sk_live, sk_test, whsec_, service_role, JWT `eyJ...`, claves privadas); un secreto con otro formato podria pasar. Falta revisar el historial de git (`git log -S`) por claves que se hayan subido y borrado despues, dado que `.git` pesa 212 MB.


======================================================================
LIBRO "100 ERRORES COMUNES EN INGLES" (estado al 11 nov 2026)

Producto: PDF de 45 paginas, 540x864 pt, $4 USD pago unico (MXN 74 en Mexico via Stripe). Portada y pagina final llevan el avatar real de Leo (leo_p*.png); el resto usa el icono de la estrella con palomita. Pagina 45: avatar a la IZQUIERDA para que sus manos apunten al cuadro de texto (no voltear la imagen, la camiseta se lee al reves).

Pipeline de construccion (vive en el contenedor de Claude, NO en el repo): /home/claude/build/
- content.py: contenido (errores, REAL = minidialogos, lineas "es" de las paginas estrella, lista CH de capitulos).
- build.py: genera book.html (45 paginas HTML+CSS). render.py check = revisa desbordes; render.py pdf = PDF con Playwright/Chrome. finalize.py = limpia marcadores, metadatos y escribe Ingles_con_Leo_100_errores_comunes.pdf.
- Si el contenedor se reinicia, el PDF final esta en /mnt/user-data/outputs/ y en el bucket de Supabase; el codigo fuente del libro se perderia (pedir a Claude reconstruirlo o guardar una copia de /home/claude/build en el repo privado).

Entrega y pagos
- Pagina de venta: libro-100-errores-comunes-ingles.html. Botones [data-buy] apuntan a CHECKOUT_URL (Payment Link de Stripe aFa4gyejycUoc3S4ZNbsc00). PayPal: PAYPAL_URL (ncp/payment/RVBMVC5LN9BLY). Mercado Pago: MP_URL vacio, boton oculto (requiere declaracion jurada de actividad comercial; el dueno prefirio omitirlo). Transferencia: boton "Ver datos para transferencia", datos codificados en base64 dentro del JS (no en el HTML). Tarjeta Nu NO se publica.
- Stripe: producto prod_VbofPjHf4zE5JV, precio price_1Uab2AA7RWb74UAA0kRevZCR, Payment Link plink_1Uab2uA7RWb74UAAxXllPRsy. Redirige a libro-gracias.html?session_id={CHECKOUT_SESSION_ID}. OXXO habilitado (pago diferido: la descarga no es instantanea; el comprador vuelve a la misma URL de sesion cuando paga o escribe a hola@inglesconleo.com).
- Descarga segura: libro-gracias.html POSTea {session_id} a la Edge Function libro-download (Supabase). Verifica con Stripe que la sesion es mode=payment, payment_status=paid y que el price coincide con el secreto LIBRO_PRICE_ID; luego devuelve una URL firmada de 600 s del archivo en el bucket PRIVADO "libros" (Ingles_con_Leo_100_errores_comunes.pdf). Verify JWT esta APAGADO en esa funcion. Prueba hecha: con un session_id falso responde 400 bad_session (funcion viva). El tramo final con pago real NO esta probado.
- PayPal y transferencia: entrega MANUAL (el comprador escribe a hola@inglesconleo.com con comprobante).
- El stripe-webhook existente ignora pagos unicos sin client_reference_id, asi que no se mezcla con la membresia. La configuracion de metodos de pago de Stripe (pmc_1UE9ELA7RWb74UAAAGYqql8B) es compartida con la membresia.

Promocion en el sitio (todo con evento gtag book_promo_click y placement)
- articulos.html: tarjeta glossary-promo. articulo-errores-comunes.html: bloque article-cta.
- index.html: seccion .home-book entre "Guias para empezar" y testimonios (CSS inline).
- Nota .book-note en articulo-do-vs-does, in-on-at, presente-simple, verbo-to-be, como-hacer-preguntas-en-ingles.
- practica.html: se quito el ejemplo gratis de TOEFL (toefl-teaser.js) y se puso la promo .pr-book con portada y pagina de ejemplo.
- Eventos de embudo: book_checkout_click (en cada boton de compra), book_purchase_completed (libro-gracias, deduplicado por sesion), book_spei_view, book_promo_click.
- Imagenes: assets/libro/libro-{portada,ejemplo-error,cierre-capitulo,respuestas}.webp.

Reglas del proyecto aplicadas: sin em dashes en prosa, negrita con moderacion, respuestas aleatorizadas, no repetir oraciones, verificar a 320/360/375 px, no usar la palabra "hispanohablantes" en el libro (el titulo de articulo-errores-comunes.html aun la contiene; es URL indexada, no se cambio).

Pendientes
- Probar una compra real (un amigo compra y se reembolsa) para validar la entrega completa.
- Decidir si se agrega un Payment Link solo en USD (hoy Stripe muestra MXN en Mexico).
- Mercado Pago (opcional, via API con el token existente).
- Audios del libro: no tiene; seria una version 2 (decision de precio del dueno).
- Verificar en produccion el commit 1208573 (promo home y articulos) y el cambio de practica.html: requieren git push del dueno (el entorno de Claude no tiene credenciales de GitHub).
