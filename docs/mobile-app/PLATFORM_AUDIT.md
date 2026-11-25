# Auditoria consolidada de la plataforma

| Campo | Valor |
|---|---|
| Fecha | 2026-11-25 |
| Commit de referencia | 41d4d8e |
| Estado | Documento de planificacion, la app NO esta construida |
| Alcance | Consolidacion de 4 informes: backend (B-), pagos (H-), frontend (F-), IA/correos/privacidad (AI-) |

Etiquetas: [V] verificado, [R] recomendacion, [S] supuesto, [P] pendiente de verificar (produccion). En la columna "Verif." de las tablas: `V*` = linea citada releida en el codigo el 2026-11-25 al consolidar; `V` = verificado por el informe original, no releido; `P` = depende de produccion o de un proveedor, no comprobable desde el repo.

Prioridades: P0 = corregir antes de cualquier trabajo de app (Fase 0 del roadmap); P1 = corregir antes del lanzamiento publico; P2 = planificado, no bloquea; P3 = higiene u oportunidad. Gravedad es la del informe original (Alta, Media, Baja, Info); esta auditoria no uso "Critica".

Importante: todo esto se documenta, no se ejecuta. No se toco codigo, base de datos ni configuracion. Datos personales de clientes: existen en `DEVLOG.txt` (lineas indicadas en AI-02), no se reproducen aqui.

## 1. Resumen

- 89 IDs originales (20 B, 25 H, 20 F, 24 AI, algunos informativos) se reducen a unas 72 entradas unicas tras deduplicar (seccion 8). AI-24 es solo positivo y esta en la seccion 7.
- Bloqueadores P0 para publicar app: contenido premium publico, pagos sin guardas (doble cobro, 200 ante fallos, reembolsos), cancelacion y borrado de cuenta ausentes, registro sin confirmar, backend y datos de clientes publicos, consentimiento y privacidad.
- Lo que esta bien: seccion 7.

## 2. Pagos y membresia (H-, mas B-07, B-16)

| ID | Descripcion | Archivo:linea | Gravedad | Impacto (web y movil) | Prio. | Verif. |
|---|---|---|---|---|---|---|
| H-01 | Los checkouts no comprueban membresia activa: Stripe, Mercado Pago y PayPal mensual permiten pagar otra suscripcion. Solo PayPal anual rechaza (409) | `create-checkout.ts` (sin `is_member`), `stripe-checkout.ts:169-172` (solo en `action:mark`), `paypal-checkout.ts:128-130,221` | Alta | Doble cobro hoy; con IAP habria hasta 4 fuentes de cobro | P0 | V* |
| H-02 | Stripe usa `customer_email` y crea cliente nuevo por compra; la suscripcion anterior queda huerfana. MP apaga `is_member` por cualquier preapproval cancelado/pausado del usuario | `stripe-checkout.ts:207`, `stripe-webhook.ts:533`, `mp-webhook.ts:290-303` | Alta | El modelo "1 usuario = 1 flag" no soporta varias fuentes | P0 | V* |
| H-03 | Webhooks responden 200 ante excepciones o fallo de BD tras un cobro: el proveedor no reintenta y el pagador queda sin acceso | `stripe-webhook.ts:536-539,576-582`, `mp-webhook.ts:266-269,308-314`, `paypal-webhook.ts:309-312,400-406` | Alta | Pago real sin acceso, solo alerta `critical` | P0 | V* (Stripe), V (MP, PayPal) |
| H-04 | Sin manejo de reembolsos, disputas, `invoice.payment_failed`, pagos MP ni `PAYMENT.FAILED` de PayPal. Un reembolso no quita acceso | grep `refund|dispute|chargeback` en `supabase_functions/` = 0 | Alta | Apple y Google revocan por REFUND/REVOKE: se necesita revocacion en servidor | P0 | V* |
| H-05 | `mp-webhook` no verifica firma `x-signature` ni `res.ok`; mitigado porque re-consulta la API de MP | `mp-webhook.ts:181-205` | Alta (mitigada) | Abuso de llamadas, reaplicar estados | P1 | V |
| H-06 | Los terminos prometen acceso hasta fin del periodo pagado, pero MP y PayPal mensual cortan al instante al cancelar | `terminos.html:82` vs `mp-webhook.ts:290-303`, `paypal-webhook.ts:358-369` | Alta (legal) | Las tiendas exigen acceso hasta `expiresDate` | P0 | V* (MP y terminos), V (PayPal) |
| H-07 | Cancelacion solo por correo, sin Customer Portal ni gestion in-app | `miembros.html:248,309,366`, `terminos.html:81-86` | Alta | Apple 3.1.2 y Play exigen gestion de suscripcion; proteccion al consumidor | P0 | V |
| H-08 | Limites gratis (3 y 6/dia) en navegador; `free_daily_count/date` escribibles por la cuenta; `academia_free_count` acepta contador del cliente | `app.js:4132-4133`, `supabase_schema.sql:504,554`, `20261026120000_academia_integracion.sql:117-123` | Alta | Fuga de conversion; en movil la cuota debe estar en servidor | P1 | V* |
| H-10 / B-07 | Firma Stripe sin tolerancia de tiempo, comparacion `===`, un solo `v1`; `checkout.session.completed` no escribe `stripe_event_at` | `stripe-webhook.ts:590-615` | Media | Replay de eventos firmados | P1 | V* |
| H-11 | Gracia de 72 h solo Stripe; el barrido excluye cuentas con `paypal_subscription_id` o `mp_preapproval_id` (nunca se limpian), la gracia no vence para ellas | `supabase/migrations/20261020160000_payment_grace.sql:40` | Media | Miembro con pago fallido conserva acceso semanas | P1 | V* (linea 40) |
| H-12 / B-08 | Dos arboles de funciones; `stripe-checkout` diverge (172 vs 238 lineas) y la copia de `supabase/functions` pierde el guard de renovacion pendiente | `supabase/functions/stripe-checkout/index.ts`, `supabase_functions/stripe-checkout.ts:59-109` | Media | Redeploy desde la carpeta equivocada revierte la proteccion. Ver correccion en seccion 9 (otras copias identicas) | P0 | V* |
| H-13 | `mp_preapproval_id` y `mp_preapproval_status` no estan definidas en ningun SQL del repo, solo usadas | solo aparece `supabase/migrations/20261020160000_payment_grace.sql:40` | Media | Un entorno nuevo o una restauracion fallaria | P1 | V* |
| H-14 | Trial de Leo AI por cuenta, no por persona | `20261016001253_leo_ai_trial.sql` | Media | Abuso de costo acotado | P2 | V |
| H-15 | Precios y monedas duplicados en HTML, funciones y paneles | `miembros.html`, `terminos.html:76-78`, `create-checkout.ts:39`, `paypal-webhook.ts:71-72` | Media | Los precios de tienda son otros; riesgo de incoherencia | P2 | V |
| H-16 / B-16 | Cron `inglesconleo-payment-recovery` solo comentado en la migracion | `20261116120000_payment_recovery.sql:85-93` | Media | Sin correos de cobro fallido si no se activo | P1 | V* codigo; P produccion |
| H-17 | `checkout.session.completed` activa sin validar `payment_status`, Price ni monto | `stripe-webhook.ts:487-567` | Media | Un Payment Link con `client_reference_id` activaria | P2 | V |
| H-18 / AI-05 | Sin borrado de cuenta ni exportacion | grep `deleteUser|eliminar mi cuenta` = 0 en js/ts/html | Media | Apple 5.1.1(v) y Play lo exigen: rechazo de tienda | P0 | V* |
| H-19 | Se devuelve el cuerpo de error del proveedor al navegador | `create-checkout.ts:171`, `stripe-checkout.ts:223`, `paypal-checkout.ts:253` | Baja | Fuga de detalle | P3 | V |
| H-20 | Token Meta CAPI en la query de la URL | `stripe-webhook.ts:152` | Baja | Puede quedar en logs | P3 | V |
| H-21 / AI-17 | Token de baja firmado con la `service_role` key; `mail-relay` usa `RESEND_API_KEY` como bearer; un solo flag de baja para todos los canales | `email-unsubscribe.ts:32-42`, `mail-relay.ts:49-52` | Baja (informe AI: Media) | Rotar la llave rompe enlaces; sin granularidad por canal antes de agregar push | P2 | V |
| H-22 / B-17 | CORS `*` en checkouts y otras 8 funciones | varias (`leo-ai.ts:126`, `create-checkout.ts:94`, `paypal-checkout.ts:148`...) | Baja | Limitar a web y app | P3 | V |
| H-23 | Cada vista de `miembros.html` precarga una sesion de Checkout Stripe | `miembros.html:~1090` | Baja | Ruido y consultas extra | P3 | V |
| H-24 | Slugs desplegados distintos del archivo (`super-service`, `rapid-service`, `clever-responder`) y `quick-endpoint` sin copia en repo | `backend.js:138,576`; DEVLOG | Baja | Contrato de URLs no obvio para la app | P2 | V |
| H-25 | `getMemberProfile` hace `select('*')` y trae columnas internas de su propia fila | `backend.js:242` | Baja | La app debe pedir columnas explicitas | P3 | V |

## 3. Autenticacion, base de datos y seguridad (B-)

| ID | Descripcion | Archivo:linea | Gravedad | Impacto | Prio. | Verif. |
|---|---|---|---|---|---|---|
| B-01 / AI-06 | Confirm email apagado: cuentas con correo ajeno, bienvenidas a terceros, la verificacion de la prueba de Leo AI no verifica nada, sin CAPTCHA | `backend.js:88-92` (devuelve sesion sin confirmar), `20261016001253_leo_ai_trial.sql:18-19,83` | Alta | Spam desde el dominio, abuso de la bolsa de prueba; la app heredaria el registro | P0 | V* codigo; P estado del panel |
| B-03 | Sesion unica: login hace `signOut({scope:'others'})`; choca con telefono y web | `backend.js:117` | Alta (movil) | Telefono y web se cierran mutuamente | P0 (decidir politica) | V* |
| B-04 | `send-password-reset` sin auth ni rate limit, CORS `*`, `redirectTo` del cliente | `send-password-reset.ts:51-76`, `backend.js:138-147` | Media | Email bombing; la app necesita deep link | P1 | V |
| B-05 | `notify-new-comment` sin auth ni dedupe; `articleLabel` sin escapar en el HTML del correo | `notify-new-comment.ts:69,84,88` | Media | Correos a Leo en bucle, HTML inyectable | P2 | V |
| B-06 | Escrituras abiertas sin cuota: `article_comments` anon, `leobot_reports` (tope global), `mistake_stats` sin limite de filas ni tamano, `display_name` sin CHECK | `supabase_schema.sql:442-474,645-674` | Media | Spam e inflado de la BD Free (500 MB) | P2 | V |
| B-08 (resto) | `quick-endpoint` desplegada sin copia en repo; sin `supabase/config.toml` (verify_jwt no versionado); migraciones de prod sin archivo | `supabase/config.toml` no existe | Media | Paridad repo y produccion no demostrable | P0 | V* config.toml ausente; P resto |
| B-09 | Respaldos manuales; plan Free sin backups ni PITR; `private/` solo local | `tools/respaldo_supabase.sh` | Media | Perdida de pagos o del banco de examen | P1 | V; P fecha del ultimo |
| B-10 | Ver H-08 (cuota gratis en cliente) | `app.js:4132-4133` | Media | Idem | P1 | V* |
| B-11 / AI-11 | Monitor de errores y `report-error` solo aceptan origen inglesconleo.com; `libro-download` solo web; `redirectTo` con `window.location.origin` no sirve en WebView; sin config de origenes nativos | `report-error.ts:30,146-157`, `error-monitor.js:33,46`, `backend.js:146,199` | Media (movil) | La app no reportaria errores ni autenticaria por deep link | P1 | V* |
| B-12 | `ACCESS_CODE = "LEO2026"` en archivo publico; `initAccessGate` definida y nunca invocada | `app.js:655,702-714` | Baja | Codigo muerto con clave legacy | P3 | V* (grep en app.js y HTML) |
| B-13 | `apply_mistake_results` conserva EXECUTE para PUBLIC y anon | `supabase_schema.sql:735` | Baja | Superficie, sin efecto | P3 | V |
| B-14 | Policy de respuestas con subconsulta tautologica (`parent.article_slug = article_slug`) | `supabase_schema.sql:470` | Baja | Solo admin | P3 | V |
| B-15 / AI-12 | `ip_hash = md5('leobot:'+ip)` sin sal; sin retencion en `leobot_reports`, `survey_responses`, `lifecycle_emails`; capturas sin caducidad | `20261121120000_leobot_capturas.sql:54-58` | Baja (AI: Media) | Dato personal derivado reversible | P2 | V |
| B-18 | Correos del dueno y UUID admin como valores por defecto y en RLS del repo publico | `supabase_schema.sql:465,478`, funciones | Baja | Phishing dirigido | P2 | V |
| B-19 | `libro-download` acepta `session_id` de Stripe reutilizable, sin rate limit | `libro-download/index.ts:62-111` | Baja | Abuso y costo de consultas a Stripe | P3 | V |
| B-20 | Documentos desactualizados | ver [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) seccion 12 | Info | Confusion para agentes | P2 | V |

## 4. Contenido y acceso

| ID | Descripcion | Archivo:linea | Gravedad | Impacto | Prio. | Verif. |
|---|---|---|---|---|---|---|
| B-02 / F-06 / H-09 | Contenido "de miembros" protegido solo por interfaz: `data.js` (1589 items con respuestas), bancos TOEFL/IELTS/TOEIC/Cambridge, `juego-data.js` y los 1642 mp3 se sirven publicos desde un repo publico. Solo examen oficial, progreso, Leo AI y los 9 cursos `protected:true` estan en servidor | `backend.js:773-794` (`requireMemberAsync` solo redirige), archivos `*-data.js`, `audio/` | Alta | Una app que empaquete estos archivos regala el premium; las tiendas no validan contenido | P0 | V* |

## 5. Frontend, progreso y repositorio (F-)

| ID | Descripcion | Archivo:linea | Gravedad | Impacto | Prio. | Verif. |
|---|---|---|---|---|---|---|
| F-01 / AI-18 | `syncProgressFromCloud` (orden ascendente) y `getMistakeStats` sin paginar; con el tope por defecto de PostgREST los registros recientes de sesiones se perderian | `backend.js:401-403`, `:540-543` | Alta (escala) | Progreso truncado en usuarios intensivos; tope exacto depende de la config [P] | P1 | V* codigo; P tope |
| F-02 | `pushSession` de miembros es fire-and-forget sin cola ni idempotency key | `app.js:1313`, `backend.js:458-491` | Media | Sesion sin red nunca se sube; en movil es frecuente | P1 | V |
| F-03 | Sesion a medias solo en localStorage, 3 dias, no cruza dispositivos | `app.js:2252-2262,8817-8845` | Media | Incoherente con academia, que si sincroniza | P1 | V |
| F-04 | `ACADEMIA_INTEGRACION.md` dice "todo apagado", pero `CLOUD_ON`, `ACADEMIA_MOTOR.enabled` y `PUBLIC` estan en true | `academia-boot.js:6`, `academia-motor.js:1914`, `academia-lanzamiento.js:8` | Media (doc) | Agentes se guiarian por informacion falsa | P2 | V* |
| F-05 | MAPA_CONEXIONES cuenta 460 paginas; hay 476 HTML | `MAPA_CONEXIONES.md` | Baja | Cifras que no coinciden | P3 | V |
| F-07 / AI-03 | GA4 y Meta Pixel cargan en todas las paginas sin consentimiento (102 HTML en raiz, 456 en el sitio) | `index.html:70-105`, `meta-pixel.js:30-34` | Media (informe F) / Alta (informe AI) | RGPD/ePrivacy; ATT y Data Safety en tiendas | P0 | V* (conteo) |
| F-08 | `supabase-js@2` por CDN sin version exacta ni SRI en 78 paginas | `<script>` en 78 HTML | Media | Cadena de suministro; no empaquetable | P1 | V |
| F-09 | `academia-boot.js` carga scripts con `document.write` | `academia-boot.js` | Baja | Bloquea parser; dificulta empaquetar | P3 | V |
| F-10 | Sin `package.json`; las 120 pruebas no corren en CI; 2 suites rojas por entorno | raiz, `.github/workflows` | Media | Sin red de seguridad para refactor de agentes | P1 | V |
| F-11 | `app.js` 602 KB y `data.js` 1,06 MB sin minificar en cada pagina de practica | `app.js`, `data.js` | Media | Arranque lento en 3G (no medido [P]) | P2 | V |
| F-12 | `site.webmanifest` minimo, sin service worker, `theme_color` no coincide con la paleta | `site.webmanifest` | Baja | No instalable ni offline | P3 | V |
| F-13 | Audio de cursos protegidos con URL firmada de 15 min renovada solo con la pagina visible | `academia.js:298-325` | Media (movil) | Sin offline ni segundo plano sin rehacer la renovacion | P2 | V |
| F-14 | Speaking usa Web Speech API (solo Chrome/Edge escritorio) | `app.js:2033-2080` | Media (movil) | Reconocimiento de voz nativo desde cero | P2 | V |
| F-15 | Sin modo oscuro | `style.css` | Baja | UX movil | P3 | V |
| F-16 | Una peticion HEAD por bloque de voz | `leo-voz.js:~30` | Baja | Trafico extra en movil | P3 | V |
| F-17 / AI-22 | Artefactos sin versionar y sin `.gitignore` (`_push.patch`, `_video_index/`, `h`, `revision-videos.diff`, `tools/sandbox/`, mp3 nuevos); objetos temporales huerfanos en `.git` | `git status` | Baja | Riesgo de publicar material interno con un `git add .` | P1 | V* (status inicial) |
| F-18 | `academia-motor.js` y `academia-cursos.js` son generados pero versionados | `tools/generar_academia_*.js` | Baja | Disciplina de regeneracion | P3 | V |
| F-19 | `private/` (examenes y seeds) ignorado por git, un solo disco local | `.gitignore:51` | Info | Correcto, pero sin respaldo versionado | P2 | V; P respaldo |
| F-20 | Writing validado por regex en cliente | `data.js` `checkPattern` | Baja | Evadible; hay evaluacion IA no auditada | P3 | V |

## 6. IA, correos, privacidad y escala (AI-)

| ID | Descripcion | Archivo:linea | Gravedad | Impacto | Prio. | Verif. |
|---|---|---|---|---|---|---|
| AI-01 | Todo el backend es publico: `supabase_functions/leo-ai.ts`, `DEVLOG.txt`, `supabase/RESPALDO_CORREO.md`, `AUDITORIA_*.md` y migraciones devuelven HTTP 200; no hay `.nojekyll` ni carpeta privada | `robots.txt` abierto; archivos rastreados por git | Alta | Revela prompts, topes, esquema y mecanismos de seguridad | P0 | V* (HTTP 200 comprobado hoy en 3 rutas) |
| AI-02 | Datos personales y financieros de clientes en `DEVLOG.txt` (lineas 4064 y 4070), tambien en historial git; correos del dueno en documentos | `DEVLOG.txt:4064,4070` (contenido no reproducido) | Alta | Fuga de datos; requiere limpiar historial antes de publicar app | P0 | V (lineas existentes, contenido no releido a proposito) |
| AI-04 | Sin edad ni salvaguardas para menores; marketing y eventos a Meta/Google a cualquier edad | `privacidad.html:104-105` | Alta | COPPA, GDPR-K, categorias de tienda | P1 | V |
| AI-05 | Politica de privacidad omite Cloudflare (IA), Brevo y base legal; sin borrado de cuenta in-app | `privacidad.html:84-98` | Alta | Apple 5.1.1(v), RGPD art. 13/17 | P0 | V |
| AI-07 | Topes de Leo AI con CHECK maximo (8000 neurons, 10000 como techo): del orden de 550 explicaciones/dia en todo el sitio | `supabase_functions/leo-ai.sql:39-41` (CHECK de topes), `leo-ai.ts:550-553` | Alta (escala) | Con muchos usuarios la IA quedaria apagada casi todo el dia | P1 | V; costos [S] |
| AI-08 | Sin cache servidor entre usuarios para el mismo ejercicio y respuesta | `app.js:3159-3170`, `leo-ai.sql:153-166` | Media | Palanca principal de costo | P1 | V |
| AI-09 | `leo_ai_reserve` serializa con `FOR UPDATE` sobre una fila y `leo_ai_begin` borra en cada llamada | `leo-ai.sql:94-98,186` | Media | Cola de bloqueos a miles de peticiones | P2 | V |
| AI-10 | Pocas cuentas agotan la IA de todos; texto libre en `question`, `studentAnswer`, `context` | `leo-ai.ts:276-376` | Media | Enviar `itemId` y reconstruir el prompt en servidor | P2 | V |
| AI-13 | Sin push: sin service worker, sin tabla de dispositivos, sin FCM/APNs | `site.webmanifest`; busqueda de `serviceWorker` = 0 | Media | Construir de cero | P1 | V |
| AI-14 | Recordatorio de racha a 13:00 UTC para todos, serial, 100 s de presupuesto | `streak-reminder-email.ts:89-90,258-318` | Media | No escala; sin zona horaria | P2 | V |
| AI-15 | `upgrade-nudge-emails` barre todo `profiles` cada 30 min; tope ~14 400 correos/dia | `upgrade-nudge-emails.ts:450,584-629,682` | Media | Inviable a gran escala | P2 | V |
| AI-16 | `FREE_USER_DAILY_LIMIT = 6` duplicado a mano en cliente y en la funcion | `upgrade-nudge-emails.ts:276-280` | Media | Ver H-08 | P2 | V |
| AI-19 | Motor adaptativo 100 % en cliente; umbrales duplicados en comentarios | `app.js:7213-7226,7451-7475` | Baja | Un nucleo compartido evita reescribirlo | P2 | V |
| AI-20 | Conversion medida solo en el cliente (`Purchase` desde `miembros.html:818`), sin Conversions API | `app.js:4162-4177`, `miembros.html:818,938` | Baja | Bloqueadores y iOS ATT subestiman | P3 | V |
| AI-21 | LeoBot: bien protegido; el trigger confia en `cf-connecting-ip` | `leobot-notify.ts:59-132` | Baja | La app debe adjuntar version y SO | P3 | V |
| AI-23 | SEO tecnico sano; sin `assetlinks.json` ni `apple-app-site-association` | `sitemap.xml` (436 URLs), `robots.txt` | Baja | Faltan universal links | P2 | V |

## 7. Puntos fuertes (verificados)

- `is_member` y columnas de pago no son escribibles por el cliente (grants por columna); funciones privilegiadas con EXECUTE revocado a public, anon y authenticated. [V]
- Activacion atomica anti-duplicado (`UPDATE ... WHERE is_member=false`), bienvenida con arrendamiento, eventos Meta con `event_id` fijo. [V informe]
- Firma de PayPal por la API oficial, firma Svix en Resend, `internal_secret_ok` con Vault y falla cerrado. [V informe]
- Academia: RPC con `auth.uid()` y miembro validados en servidor, examen y banco de preguntas solo en servidor, merge con version en `academia-nube.js`. [V informe]
- Leo AI: JWT verificado con `auth.getClaims` aunque cambie `verify_jwt` (`leo-ai.ts:639-648`), idempotencia, kill switch triple, no guarda texto del alumno. [V*]
- Monitor de errores con limpieza de PII, severidad de servidor y retencion de 60 dias. [V informe]
- Sin secretos en el repo (solo nombres de variables y claves publicas por diseno). [V informe]
- Modelo de datos de progreso (`progress_sessions`, `mistake_stats`) ya multi-dispositivo, con trigger de topes en servidor. [V informe]

## 8. Deduplicacion entre informes

| Tema | IDs agrupados | Entrada canonica |
|---|---|---|
| Contenido premium publico | B-02, F-06, H-09 | B-02 |
| Cuota gratis en cliente | B-10, H-08, AI-16 | H-08 |
| Registro sin confirmar | B-01, AI-06 | B-01 |
| Firma Stripe | B-07, H-10 | H-10 |
| Deriva repo y desplegado, nombres de funciones | B-08, H-12, H-24 | B-08 |
| Cron de recuperacion no programado | B-16, H-16 | H-16 |
| Observabilidad y CORS en nativo | B-11, AI-11 | B-11 |
| Borrado de cuenta y privacidad | H-18, AI-05 | H-18 |
| Paginacion de lecturas | F-01, AI-18 | F-01 |
| Consentimiento de analitica | F-07, AI-03 | AI-03 |
| Higiene de repo | F-17, AI-22, B-18 (parcial) | F-17 |
| Hash de IP y retencion | B-15, AI-12 | AI-12 |
| Claves de baja y relay | H-21, AI-17 | AI-17 |
| CORS abierto | B-17, H-22 | B-17 |
| Trial de Leo AI | H-14, B-01(b), AI-06(a) | H-14 |

## 9. Contradicciones entre informes y resolucion

| Tema | Informe A | Informe B | Resolucion (verificada en codigo 2026-11-25) |
|---|---|---|---|
| Copias duplicadas de funciones | H-12: `upgrade-nudge-emails` y `member-reactivation-core.mjs` divergen | B-08: identicas salvo `stripe-checkout` | B-08 correcto: `upgrade-nudge-emails` (2700 lineas), `leo-ai`, `brevo-check` y `member-reactivation-core.mjs` son identicos; `resend-webhook` difiere solo en finales de linea (CRLF); `stripe-checkout` si diverge (172 vs 238 lineas). H-12 queda reducido a `stripe-checkout` |
| Paginas con GA4 | F-07: 100 HTML | AI-03: 454 paginas | Ambos correctos con distinto alcance: 102 HTML en raiz y 456 en todo el sitio |
| Paginas totales | MAPA: 460 | F: 476 HTML; sitemap 436 | 104 raiz, 476 en total, 436 URLs publicadas en el sitemap |
| Columnas `mp_*` de `profiles` | Backend las lista como columnas de `profiles` | H-13: no estan en ningun SQL | H-13 correcto: solo se usan en `payment_grace.sql:40`; el listado del informe backend se dedujo del codigo |
| Truncado por falta de paginacion | F-01: se pierden las mas recientes | AI-18: corte a 1000 filas | Matiz: solo `progress_sessions` va ordenado ascendente (pierde las recientes); `mistake_stats` no tiene `order` (corte sin orden definido). El tope exacto depende de la config [P] |
| Gravedad de F-07 y AI-17 | F: Media | AI: Alta / Media | Se conserva la mas alta cuando afecta a requisitos de tienda (AI-03: Alta, P0) |
| Autenticacion de `leobot-notify` | B: "Ninguna" | AI-11: `verify_jwt` true | No comprobable desde el repo (no hay `config.toml`) [P] |
| Estado de academia | `ACADEMIA_INTEGRACION.md`: apagada | Codigo: encendida | Codigo manda: tres interruptores en true (F-04) |

## 10. No verificable desde el repo [P]

- `verify_jwt` real por funcion; proposito y contenido de `quick-endpoint`; Redirect URLs de Auth; proteccion de contrasenas filtradas y rate limits de Auth; si "Confirm email" sigue apagado hoy.
- Valores vivos de `leo_ai_config` (`enabled`, `public`, `trial_enabled`) y `academia_courses.enabled`.
- Cron `payment-recovery` y `brevo-check` programados; politicas reales de Storage; fecha del ultimo respaldo; secretos realmente cargados.
- Version realmente desplegada de cada Edge Function (DEVLOG indica pendientes de desplegar: `stripe-webhook`, `stripe-checkout`, `paypal-checkout`, `create-checkout`, `payment-recovery-emails`); anual de PayPal no probado en sandbox.
- Configuracion en Stripe (eventos suscritos, Smart Retries, `cancel_at_period_end`), PayPal (`PAYPAL_WEBHOOK_ID`, planes) y Mercado Pago (notificaciones, firma).
- Existencia y cantidad de miembros manuales (sin proveedor).
- Tarifa vigente de Cloudflare Workers AI; todos los costos en USD de IA son estimaciones [S].
- Rendimiento real en red lenta (no medido); contraste y tamanos tactiles; ejecucion de la suite de 120 pruebas (no se ejecuto).
- Las 13 correcciones de `AUDITORIA_PLATAFORMA_2026-11-24.md` no se re-verificaron una a una.
- Hallazgos de `AUDITORIA_COMPLETA_2026-10-14.md` y `AUDITORIA_SISTEMA_2026-11-11.md`: no leidos en detalle; las referencias a ellos vienen de los informes.

## 11. Metodologia

1. Cuatro auditorias de solo lectura sobre el commit 41d4d8e (backend, pagos, frontend, IA y correos), sin acceso a produccion, proveedores ni secretos. Conteos de contenido ejecutando `data.js` y `academia-data.js` en un sandbox de Node.
2. Consolidacion el 2026-11-25: se conservaron los IDs originales, se deduplicaron hallazgos (seccion 8) y se asigno prioridad P0-P3 segun bloqueo para app, riesgo economico/legal y esfuerzo.
3. Verificacion en codigo de los hallazgos de mayor gravedad (marca `V*`): lectura de la linea citada, grep de ausencias (reembolsos, borrado de cuenta, `config.toml`), `diff` entre copias de funciones y peticiones HTTP a 3 rutas publicas del propio sitio.
4. Resolucion de contradicciones (seccion 9) por lectura directa.
5. Los costos y escalas son [S]; ver [SCALABILITY_AND_COSTS.md](SCALABILITY_AND_COSTS.md). Las reglas y precios de tiendas son volatiles, fecha de consulta 2026-11-25 (ver [MOBILE_READINESS.md](MOBILE_READINESS.md)).
