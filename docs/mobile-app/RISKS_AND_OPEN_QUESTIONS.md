# Riesgos, preguntas abiertas y supuestos: app movil de Ingles con Leo

- Fecha: 2026-11-25
- Commit de referencia: 41d4d8e
- Estado: Documento de planificacion, la app NO esta construida.
- Etiquetas: [V] verificado en codigo o documento oficial, [R] recomendacion, [S] supuesto, [P] pendiente de verificar.
- Documentos hermanos: [AI_HANDOFF.md](AI_HANDOFF.md), [DEVLOG.md](DEVLOG.md).
- IDs de hallazgos (B, H, F, AI) vienen de las auditorias de backend, pagos, frontend e IA del 2026-11-25; D1 a D11 son las decisiones del arquitecto (ver [AI_HANDOFF.md](AI_HANDOFF.md#4-decisiones-tomadas-y-por-que-d1-d11)).

Escala: probabilidad (Alta, Media, Baja) e impacto (Alto, Medio, Bajo) son juicios [R] del autor, no mediciones. Responsable: Dueno (Leo), Agente (agente de IA) o Ambos.

---

## 1. Registro de riesgos

### 1.1 Cumplimiento y tiendas

| ID | Riesgo | Prob. | Impacto | Mitigacion | Resp. | Disparador |
|---|---|---|---|---|---|---|
| R01 | Apple rechaza la app por 4.2 (sitio web reempaquetado) | Media | Alto | Shell nativo propio y funciones reales (push, Sign in with Apple, IAP, audio offline, notificaciones de racha). Spike con puerta de decision; si falla, D2 (Expo). Texto de 4.2 verificado [V]; nivel de riesgo es juicio. | Agente | Primer envio a TestFlight review o rechazo en revision |
| R02 | Rechazo por pago externo dentro de la app (3.1.1) o por no ofrecer IAP (3.1.3(b)) | Media | Alto | IAP en iOS y Android via RevenueCat; sin botones ni enlaces a Stripe, PayPal o Mercado Pago en la app fuera de EEUU [V]. | Ambos | Cualquier pantalla de pago que enlace a la web |
| R03 | Rechazo por falta de borrado de cuenta in-app (Apple 5.1.1(v), Google Play) | Alta si no se hace | Alto | Funcion de borrado (RPC o Edge Function con service_role, cancelacion de suscripciones externas). Hoy no existe (H-18, AI-05). | Agente | Antes de Fase 3 |
| R04 | Rechazo por Sign in with Apple ausente si hay login con Google (4.8) | Media | Medio | Anadir Sign in with Apple nativo (`signInWithIdToken`). | Agente | Envio a revision con Google visible |
| R05 | Politica de privacidad incompleta (no menciona Cloudflare ni Brevo; sin base legal ni retencion) y etiquetas de privacidad mal declaradas | Alta | Alto | Reescribir `privacidad.html`, completar Privacy Nutrition Labels y Data safety (AI-05) [V]. | Ambos | Antes de enviar a tiendas |
| R06 | Trafico de menores sin salvaguardas (COPPA, GDPR-K, Kids Category) | Media | Alto | No entrar a Kids; categoria Education; age-gate y tracking apagado para menores (AI-04). Requiere decision legal del dueno (Q7). | Dueno | Primer reclamo o revision de edad de tienda |
| R07 | Tracking sin consentimiento (GA4 y Pixel cargan siempre; ATT, Data safety) | Alta | Alto | Banner y Consent Mode en web; en app SDK con consentimiento y sin ATT si no hay tracking entre apps (F-07, AI-03) [V]. | Agente | Antes de campanas de pago o publico UE |
| R08 | Cambio de reglas o comisiones de las tiendas (Epic v. Apple, certiorari, tasa final) | Media | Medio | No basar el modelo en el 0% de enlace externo en EEUU; revalidar politicas (ver seccion de revalidacion en [AI_HANDOFF.md](AI_HANDOFF.md#14-revalidacion-de-politicas-de-tiendas)) antes de cada envio. Confianza M-B en fuentes de prensa [V]. | Ambos | Fallo judicial 2027 o actualizacion de guidelines |
| R09 | Google Play: cuenta personal nueva exige 12 testers durante 14 dias seguidos; retraso del lanzamiento Android | Alta | Medio | Reclutar testers desde Fase 1; considerar cuenta de organizacion (requiere D-U-N-S) [V]. | Dueno | Abrir la cuenta de Play |
| R10 | Requisitos de SDK de tienda cambian (Xcode 26, API 36, Play Billing v8/v9) y bloquean envios | Media | Medio | Fijar versiones actuales; revisar calendarios de deprecacion [V: fechas vencidas de v7 y extension de target API]. | Agente | Aviso de Play Console o Apple |

### 1.2 Pagos, acceso y datos

| ID | Riesgo | Prob. | Impacto | Mitigacion | Resp. | Disparador |
|---|---|---|---|---|---|---|
| R11 | Doble cobro entre canales (web y tienda) o dentro del mismo proveedor (H-01, H-02) | Alta [V: ningun checkout lo impide] | Alto | Bloqueo en servidor por `entitlements`; reutilizar customer de Stripe y preapproval de MP. | Agente | Antes de ofrecer IAP |
| R12 | Pagador sin acceso por webhook que responde 200 ante error (H-03) | Media | Alto | Devolver 5xx para reintento, tabla `webhook_events` con id unico. | Agente | Resumen diario de `error-alert` con `critical` |
| R13 | Reembolsos y contracargos no revocan acceso (H-04); Apple y Google revocan por `REFUND` y `REVOKE` | Media | Medio | Procesar eventos de reembolso en todas las fuentes y reflejarlo en `entitlements`. | Agente | Primer reembolso o disputa |
| R14 | Terminos prometen acceso hasta fin de periodo pero MP y PayPal mensual cortan al instante (H-06); cancelacion solo por correo (H-07) | Alta | Medio (legal y soporte) | `access_until` comun, Customer Portal y deep links de gestion. | Ambos | Queja de cliente o requisito de tienda |
| R15 | Contenido premium regalado: el paquete de la app o el repo publico lo expone (B-02, F-06, H-09) | Alta [V] | Alto | Mover bancos de miembros a RPC o Storage con URL firmada antes de empaquetar; o aceptar que el valor premium es el servicio (Q2). | Ambos | Antes de Fase 2 |
| R16 | Datos de clientes publicados en `DEVLOG.txt` (lineas 4064-4066 y 4070) y en el historial git (AI-02) | Alta [V] | Alto (legal) | Retirar archivo del sitio publico y limpiar historial; evaluar obligacion de notificacion con asesor legal (Q1). No copiar esos datos a ningun documento. | Dueno | Inmediato, antes de cualquier lanzamiento |
| R17 | Backend, migraciones, prompts y auditorias publicos (AI-01); facilita ataques y copia | Alta [V] | Medio | Repo privado o publicar solo la carpeta del sitio (Q1). | Dueno | Decision de Q1 |
| R18 | Registro sin confirmar correo: cuentas falsas, spam a terceros desde tu dominio, abuso de la prueba de Leo AI (B-01, AI-06) | Alta | Medio | Activar Confirm email o OTP, CAPTCHA, login social. | Ambos | Subida de registros sospechosos o rebotes en Resend |
| R19 | Sesion unica expulsa al telefono cuando se entra en la web y viceversa (B-03) | Alta [V] | Medio (UX, soporte) | Permitir multidispositivo con limite razonable. Decision Q5. | Dueno | Primer uso en dos dispositivos |
| R20 | Cuota gratis manipulable (contadores en cliente y columnas escribibles; B-10, H-08) | Alta | Bajo-Medio (conversion) | Mover a RPC servidor. | Agente | Caida de conversion o cuentas con contadores inusuales |
| R21 | Deriva repo y produccion: slugs `super-service`, `clever-responder`, `rapid-service`, `quick-endpoint` sin copia, dos arboles de funciones, sin `config.toml`, migraciones sin paridad (B-08, H-12, H-13) | Alta [V] | Alto | Versionar todo, un solo arbol, `config.toml`, migracion de paridad antes de tocar nada. | Agente | Antes de la primera migracion de Fase 0 |
| R22 | Reaplicar `leo-ai.sql` o el bloque cron antiguo de `supabase_schema.sql` rompe la funcion vigente | Media | Medio | Marcar esos archivos como historicos o moverlos; aplicar solo migraciones. | Agente | Cualquier aplicacion manual de SQL |

### 1.3 Escala, costos y operacion

| ID | Riesgo | Prob. | Impacto | Mitigacion | Resp. | Disparador |
|---|---|---|---|---|---|---|
| R23 | Plan Free de Supabase sin backups ni PITR; perdida de datos y de `private/` (B-09) | Media | Alto | Pasar a Pro con backups, restauracion de prueba, copia de `private/` fuera del disco local. | Dueno | Inmediato (antes de usuarios nuevos) |
| R24 | Leo AI no escala: techo de unas 550 explicaciones al dia por CHECKs y presupuesto de neurons (AI-07); fila caliente (AI-09) | Alta si crece | Medio | Presupuesto en USD, cache por hash (AI-08), ejercicios por id en servidor (AI-10), kill switches; proveedor de pago. | Ambos | Mas de 1k usuarios activos o mensajes "Leo AI no disponible" |
| R25 | Costo de IA se dispara si se cambia de proveedor sin topes (escenario Claude es solo alternativo, D6) | Baja | Alto | Topes por plan, Haiku por defecto en ese escenario, presupuesto diario. Estimaciones [S]. | Dueno | Decision de cambio de proveedor (Q6) |
| R26 | Correos y recordatorios por barrido completo no escalan (AI-14, AI-15); push sin infraestructura (AI-13) | Alta si crece | Medio | Cola de envios, tabla de dispositivos, zona horaria por usuario. | Agente | Mas de 10k perfiles |
| R27 | Egress de audio (57 MB hoy, 1642 mp3) y de `data.js` (1,06 MB) en cada pagina | Media | Medio | Audio en CDN o Storage con cache; bancos por habilidad; empaquetar offline en app. | Agente | Factura de ancho de banda o lentitud en 3G |
| R28 | Cuello de botella de conexiones y compute en Supabase al crecer; MAU 2.925 USD/mes a 1M solo por MAU [V: tarifa; supuesto de compute en [S]] | Media | Medio | Prueba de carga antes de cada escalon; subir compute por conexiones y CPU, no por MAU. | Agente | CPU sostenida alta o saturacion de Supavisor |
| R29 | `getMistakeStats` y `syncProgressFromCloud` sin paginar truncan silenciosamente (F-01) | Media | Medio | Paginacion con `range`, cola de reintento de `pushSession` (F-02). | Agente | Usuario con mas de 1000 sesiones o errores |
| R30 | Observabilidad nula en la app (`error-monitor.js` y `report-error` solo aceptan `inglesconleo.com`; B-11) | Alta [V] | Medio | Ampliar origenes y usar clave de app o attestation (App Attest, Play Integrity). | Agente | Primera build interna |
| R31 | `app.js` de 10 756 lineas globales hace costoso el refactor y puede romper el sitio | Media | Alto | Extraer modulos puros con las pruebas de `tools/e2e` como red; web sigue usando la version actual hasta migrar. | Agente | Inicio de Fase 1 |
| R32 | Pruebas fuera de CI y sin `package.json`: regresiones sin deteccion (F-10) | Alta | Medio | Anadir `package.json` y job de pruebas en GitHub Actions. | Agente | Antes de refactorizar |
| R33 | Dependencia de un solo desarrollador-agente y de un dueno no tecnico: perdida de contexto entre chats | Media | Medio | Mantener [AI_HANDOFF.md](AI_HANDOFF.md) y [DEVLOG.md](DEVLOG.md); correr la lista de comprobaciones al retomar. | Ambos | Cada chat nuevo |
| R34 | Archivos sin rastrear (`_push.patch`, `_video_index/`, `h`, `revision-videos.diff`, `tools/sandbox/`) se publican por `git add .` (AI-22, F-17) | Media | Medio | `.gitignore` y `git add` con rutas explicitas. | Agente | Cada commit |
| R35 | El SEO y la app compiten o se rompen al reorganizar rutas (355 fichas y articulos conviven con la app) | Baja | Alto | No tocar URLs indexadas; universal links solo para rutas nuevas; verificar sitemap tras cambios. | Agente | Cambios en estructura de carpetas |
| R36 | Speaking depende de Web Speech API, no portable (F-14) | Alta [V] | Medio | Reconocimiento nativo o servicio externo; tratar como funcion de Fase posterior. | Agente | Pruebas de speaking en el spike |
| R37 | Audio de cursos protegidos con URL firmada de 15 minutos impide offline y segundo plano (F-13) | Media | Medio | Descarga con licencia por dispositivo y renovacion nativa; o audio publico para cursos abiertos. | Agente | Funcion offline de Fase 2 o 3 |

## 2. Preguntas abiertas y decisiones del dueno

Cada una con opciones y recomendacion [R]. Texto pensado para decidirse sin conocimientos tecnicos.

**Q1. Que hacer con el repositorio publico (codigo, bitacora, auditorias, datos de clientes).**
- Opcion A: pasar el repo a privado y publicar el sitio desde otro mecanismo (hoy GitHub Pages en plan gratuito exige repo publico [P: confirmar plan]).
- Opcion B: mantener publico pero retirar de la publicacion `supabase_functions/`, `supabase/`, `DEVLOG.txt`, `AUDITORIA_*.md` y docs internos, y limpiar el historial de los datos de clientes.
- Opcion C: no hacer nada (no recomendada).
- Recomendacion [R]: B como minimo inmediato, mas limpieza del historial; evaluar A con un hosting estatico alternativo cuando se defina el plan de la app. Consultar a un asesor legal sobre notificacion por los datos de clientes (AI-02). Bloquea: R16, R17.

**Q2. Politica de contenido premium (que sale del navegador y que no).**
- Opcion A: mover todos los bancos de miembros (examenes, `data.js` de miembros) a servidor con URL firmada; mayor trabajo, protege el valor.
- Opcion B: aceptar que el contenido es publico y que el valor pagado es el servicio (examen oficial en servidor, Leo AI, seguimiento, academia protegida).
- Opcion C: mixto: proteger examenes y cursos 3 a 11 (ya protegidos) y dejar el resto publico como gancho.
- Recomendacion [R]: C para el lanzamiento y A para examenes completos; decidir con datos de conversion. Bloquea: R15 y el diseno del paquete de la app.

**Q3. Confirmar correo en el registro.**
- Opcion A: activar Confirm email de Supabase (mas friccion, resuelve B-01 y AI-06).
- Opcion B: OTP o codigo por correo mas CAPTCHA.
- Opcion C: solo login social (Google y Apple) mas correo con CAPTCHA.
- Recomendacion [R]: B o C; probar el impacto en la tasa de registro con un grupo pequeno. Requiere verificar la config actual (ver seccion 4).

**Q4. Modelo de cobro movil: precio y regalias.**
- Opcion A: mismo precio (USD 2 al mes, USD 20 al ano) en tiendas; Apple y Google se quedan 15% a 30% segun programa y region [V: tarifas, sujetas a revalidacion]; margen menor.
- Opcion B: precio mayor en las tiendas para compensar comision, igual en web.
- Opcion C: la app solo permite entrar con la cuenta y la compra solo en la web (viable solo si Apple lo permite, 3.1.3(b) exige tambien IAP, por lo que no es estrategia segura).
- Recomendacion [R]: A al inicio con inscripcion en Small Business Program (15% bajo 1M USD de ingresos [V: A]); revisar precio con datos. Mantener Stripe, PayPal y Mercado Pago en web. Pendiente del dueno: aprobar.

**Q5. Sesion unica o multidispositivo (B-03).**
- Opcion A: mantener un solo dispositivo (decision previa "a proposito").
- Opcion B: permitir telefono y web a la vez, con limite (por ejemplo 3 dispositivos).
- Opcion C: sin limite.
- Recomendacion [R]: B. El conflicto telefono y web hace inviable A en una app. Bloquea: R19.

**Q6. Proveedor de Leo AI a escala (D6).**
- Opcion A: mantener Cloudflare Workers AI (Gemma) con plan de pago y presupuesto en USD.
- Opcion B: modelo de pago gestionado con acuerdo de datos (incluye Claude u otro).
- Opcion C: IA solo para miembros, con cache compartido.
- Recomendacion [R]: A mas C con cache por hash (AI-08); evaluar B solo si la calidad lo justifica con prueba A/B. Cualquier cambio es decision del dueno.

**Q7. Edad minima y menores.**
- Opcion A: 13 o mas con age-gate y tracking apagado para menores.
- Opcion B: 16 o mas en UE.
- Opcion C: producto familiar con consentimiento parental (mucho mas trabajo y reglas de Kids).
- Recomendacion [R]: A con textos claros; confirmar con asesor legal. Apple Kids Category queda descartada.

**Q8. Cuenta de desarrollador: personal u organizacion.**
- Opcion A: personal (rapido; el nombre legal aparece como vendedor; Play pide 12 testers y 14 dias).
- Opcion B: organizacion (D-U-N-S, sitio y correo de dominio; evita el requisito de testers segun la politica vigente [P]).
- Recomendacion [R]: B si existe entidad legal; si no, A y empezar los 14 dias cuanto antes.

**Q9. Que hacer con la prueba gratis de Leo AI (trial_enabled) y con los miembros manuales (sin proveedor, nunca expiran).**
- Opciones: mantener, migrar a `entitlements` con fuente `manual` y fecha, o limpiar.
- Recomendacion [R]: migrarlos a `entitlements` como `manual` con fecha explicita; contar cuantos hay antes (ver seccion 4).

**Q10. Orden de plataformas.**
- Opcion A: iOS y Android a la vez; B: Android primero (mercado hispanohablante con mayoria Android [S]); C: iOS primero.
- Recomendacion [R]: B si se prioriza alcance y costo, con iOS tras el spike; decidir con la distribucion real de dispositivos de GA4 [P: no consultada].

## 3. Supuestos por verificar

| ID | Supuesto | Etiqueta | Como verificarlo |
|---|---|---|---|
| S1 | MAU 30-40% y DAU 10-15% del total de registrados | [S] | Medir en GA4 y `profiles.last_seen_at` |
| S2 | Concurrentes en hora pico 1-3% de los registrados | [S] | Prueba de carga y metricas de Supabase |
| S3 | Compute probable de 2XL a 4XL a 1M MAU (410 a 960 USD al mes) | [S] | Prueba de carga; conexiones Supavisor |
| S4 | Total de 3.500 a 5.000 USD al mes a 1M MAU sin push ni IA (informe de tiendas; el calculo propio da 3.188 USD/mes con IA, ver SCALABILITY_AND_COSTS.md) | [S] | Recalcular con tarifas vigentes |
| S5 | OneSignal costaria unos 12.000 USD al mes a 1M MAU moviles; conviene FCM y APNs directos | [S] | Cotizar; tarifa por MAU movil de la pagina oficial |
| S6 | Leo AI cuesta unos 12-17 neurons por llamada (0,00013 a 0,00019 USD) | [S] | Tarifa vigente de Cloudflare y consumo real en `ai_usage` |
| S7 | El cache por hash reduce 70-90% el gasto de IA | [S] | Medir tasa de acierto con un piloto |
| S8 | Leo no encaja como app "reader" (3.1.3(a)); por tanto IAP obligatorio | [S] | Preguntar a App Review o leer de nuevo la guia |
| S9 | Un shell Capacitor con funciones nativas pasa el 4.2 | [S] | Spike y primer envio a TestFlight |
| S10 | PostgREST corta en 1000 filas por defecto | [S] | Ver configuracion de API del proyecto (F-01) |
| S11 | RevenueCat no soporta PayPal ni Mercado Pago de forma nativa | [S] | Documentacion de RevenueCat (URL de Stripe dio 404 en la investigacion) |
| S12 | Para LatAm no hay reglas especiales de Apple o Google distintas de la estandar | [S] | Releer politicas por pais (Brasil y Corea no verificados) |
| S13 | Apple y Google actuan como comerciante de registro (impuestos) en IAP | [S] | Documentacion fiscal de cada tienda |
| S14 | Hay mayoria de usuarios Android en el publico objetivo | [S] | GA4 por sistema operativo |
| S15 | Estimaciones de horas con agente de IA y costos de cuentas del roadmap (D9) | [S] | Ajustar al cierre de cada fase |

## 4. Lo NO verificable desde el repo, y como verificarlo

Todo esto depende de produccion o de paneles de proveedores. Se debe comprobar antes de actuar; anotar el resultado en [DEVLOG.md](DEVLOG.md).

| Tema | Por que no es verificable en el repo | Como verificarlo |
|---|---|---|
| Plan de Supabase (Free o Pro), backups y PITR | Es configuracion de la cuenta | Panel de Supabase, Settings, Billing y Database, Backups |
| `verify_jwt` real por funcion y contenido de `quick-endpoint` | No hay `supabase/config.toml` | Panel de Edge Functions (columna de verificacion JWT); o `supabase functions list` con la CLI; leer el codigo desplegado de `quick-endpoint` |
| Versiones desplegadas de `stripe-checkout`, `stripe-webhook`, `paypal-checkout`, `paypal-webhook`, `create-checkout` (`super-service`), `payment-recovery-emails` | Despliegue manual sin CI | Panel de cada funcion (fecha de despliegue y codigo) y comparar con `supabase_functions/` |
| Crons programados (`inglesconleo-payment-recovery`, `brevo-check`, payment-grace, paypal-annual) | El de recuperacion esta comentado en la migracion | En SQL Editor: `select jobname, schedule, active from cron.job;` (solo lectura) |
| Redirect URLs y Site URL de Auth, proteccion de contrasenas filtradas, limites de Auth | Configuracion del panel | Panel, Authentication, URL Configuration y Providers |
| Confirm email apagado hoy | Declarado en DEVLOG.txt:4020, no en codigo | Panel, Authentication, Providers, Email |
| Valores de `leo_ai_config` (`enabled`, `public`, `trial_enabled`) y `academia_courses.enabled` | Datos de produccion | Consulta de solo lectura en SQL Editor |
| Existencia de columnas `mp_preapproval_*`, `stripe_event_at`, `paypal_access_*` y tabla `payment_recovery` | Sin migracion en repo para algunas (H-13) | Consulta a `information_schema.columns` |
| Cantidad de miembros manuales | Datos de produccion | Consulta a `profiles` sin proveedor (solo conteo, sin identificar personas) |
| Eventos suscritos en los webhooks de Stripe, notificaciones y firma de MP, `PAYPAL_WEBHOOK_ID` | Paneles de proveedores | Paneles de Stripe, Mercado Pago y PayPal |
| Politicas reales de Storage (`academia-audio`, `leobot-reports`, `libros`) | No probadas en un Supabase real | Prueba con una cuenta no miembro en entorno de pruebas |
| Fecha del ultimo respaldo real de BD | No consta en el repo | Revisar la carpeta de respaldos del dueno y ejecutar una restauracion de prueba |
| Secretos cargados en funciones (solo nombres) | Valores no se leen | Panel, Edge Functions, Secrets (ver nombres, nunca valores) |
| Comportamiento de vinculacion de identidades Google y correo (pre-hijacking, B-01) | Depende de Auth | Prueba controlada en proyecto de pruebas |
| Estado de Epic v. Apple y Epic v. Google | Externo y cambiante | Docket judicial y paginas oficiales de las tiendas |
| Reglas de Brasil y Corea; RTDN y Play Developer API; formato V2 de App Store Server Notifications | No investigado o solo parcial | Documentacion oficial correspondiente |
| Tarifa vigente de Cloudflare Workers AI | Externa | Pagina oficial de precios |
| Distribucion de dispositivos y sistemas operativos del publico | Datos de GA4 | Panel de GA4 |
| Pruebas: estado actual de la suite | No se ejecuto al redactar | `node tools/e2e/run-all.js` |
