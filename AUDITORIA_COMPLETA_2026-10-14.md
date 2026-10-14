# AUDITORIA COMPLETA DE INGLES CON LEO (2026-10-14)

Documento de referencia para cualquier agente (o persona) que vaya a modificar el proyecto. Objetivo: que NO haga falta investigar nada antes de actuar. Se hizo con 5 auditorias de solo lectura en paralelo (miembros, correos, SEO, base de datos, herramientas) y se contrasto con el repo y con Supabase el 2026-10-14. No contiene claves, correos ni datos personales (solo agregados y nombres de variables).

Como usarlo: lee las secciones 1 y 2 siempre; despues salta a la seccion del area que vas a tocar. Las "reglas de oro" de la seccion 2 aplican a TODO cambio.

Indice
1. Resumen ejecutivo y pendientes priorizados
2. Reglas de oro y mapa "tocar / NO tocar"
3. Repo, despliegue y flujo de trabajo
4. Zona de miembros y motor de practica
5. Correos y comunicaciones automaticas
6. Base de datos, seguridad y backend (Supabase)
7. SEO y contenido publico
8. Tests, audio (Kokoro) y herramientas
9. Checklists reutilizables
10. Consultas SQL y comandos utiles
11. Correcciones de datos conocidas (cosas desactualizadas en otros documentos)

---

## 1. Resumen ejecutivo y pendientes priorizados

Que es el proyecto: sitio estatico de aprendizaje de ingles para hispanohablantes, dominio inglesconleo.com (GitHub Pages desde la rama main, repo Fio42/Ingles_Con_Leo), con backend en Supabase (proyecto iviksyhzhiygkuaojply, Postgres 17). El dueño, Leo, no es tecnico y escribe en español. Meta de negocio: 1 millon de usuarios.

Cifras al 2026-10-14:
- 86 HTML en la raiz (59 articulos `articulo-*.html`), 336 fichas de glosario, sitemap con 405 URLs.
- 94 cuentas: 13 miembros de pago y 81 gratis. 227 sesiones guardadas (44 de cuentas gratis; las de cuentas gratis solo se guardan desde 2026-10-07).
- Google (Search Console, 14-sep a 11-oct): 3.044 impresiones, 83 clics, posicion media 15,4. 19 de 20 URLs de seguimiento indexadas el 14-oct.
- 33 tests Node (`tools/tests/*.test.js`) + 2 SQL + e2e; todos en verde al cierre del dia.

### Pendientes priorizados (ninguno esta hecho salvo que lo diga)

Requieren aprobacion de Leo (cambian produccion, correos, negocio o seguridad):
1. Seguridad: `anon` tiene INSERT/UPDATE de columna sobre TODO `profiles` (incluye `is_member`). Hoy lo frena solo la RLS. Revocarlo es una migracion pequeña y reversible, pero hay que probar registro/login despues.
2. Seguridad: `handle_new_user()` (SECURITY DEFINER) es invocable por RPC por anon y authenticated; revocar EXECUTE es seguro (el trigger no lo necesita) pero se prueba con un registro real.
3. Seguridad: activar "contraseñas filtradas" en Auth (panel, sin codigo).
4. Migraciones: paridad rota entre Supabase y `supabase/migrations/` (seccion 6.3). Falta el archivo de `revoke_truncate_anon_authenticated` (aplicada en prod el 2026-10-14, sin archivo en el repo).
5. Correos: la reactivacion V2 casi nunca puede enviar (10 de 13 miembros frenados por el freno de 14 dias; claves viejas `member_reactivation_3d/10d` aun cuentan para el freno). Decision de negocio, ver 5.5.
6. Correos: activar el evento `email.clicked` en el panel de Resend (hoy 0 clics medibles).
7. Mensajes personales a miembros (Mireya, EduDrives, Martha): preparados, NO enviados.
8. Decisiones de producto: el limite gratis corta a mitad de sesion; practica de otro nivel no cuenta para sugerencias de nivel.
9. Resolver los 12 pares duplicados del glosario (necesita Search Console).

Se pueden hacer sin aprobacion (bajo riesgo, siguiendo las reglas):
10. Poner `?v=` a `app.js` en `articulo-hora-en-ingles.html`, `articulo-ingles-aeropuerto.html`, `articulo-ingles-restaurante.html` y a `clases.js` en `clases.html` (hoy cargan sin version y pueden quedar con cache vieja).
11. Rellenar los marcadores `PON_AQUI_LA_URL_DE_INSTAGRAM/TIKTOK/FACEBOOK` en `articulos.html` (7 apariciones; el JS en ~linea 847 oculta esos botones mientras sean marcadores, asi que no hay enlaces rotos hacia fuera; falta que Leo de las URLs reales).
12. Acortar titulos de articulos >60 caracteres (23 articulos) y descripciones fuera de rango, solo en paginas sin experimento.
13. Sincronizar `dateModified` de las fichas even-though, mustnt y though con su `lastmod` del sitemap (hoy desfasados).
14. Archivos sueltos que NO deben subirse a git: `audio/articulos/this-that-these-those/dialogo-zapateria.mp3.tmp0.mp3` (0 bytes), `tools/site-health/DEVLOG.txt`, `tools/site-health/reports/`.
15. Mas enlaces desde articulos a fichas escritas a mano (quedan 195 fichas con enlace solo desde el indice del glosario).

---

## 2. Reglas de oro y mapa "tocar / NO tocar"

### Reglas de oro (aplican siempre)
1. El agente NUNCA ejecuta git sobre el repo de Leo. Leo hace `git add/commit/push`. El agente entrega un bloque corto de comandos (si el push es rechazado por el bot de Site Health: `git pull --rebase` y luego `git push`).
2. NUNCA enviar correos, ni escribir en Supabase (INSERT/UPDATE/DELETE/DDL/migraciones) ni tocar pagos/usuarios/progreso sin autorizacion expresa de Leo. Para investigar usa SELECT.
3. Subir codigo a GitHub Pages NO ejecuta migraciones ni despliega Edge Functions. Cada una es un paso aparte.
4. Texto visible: sin rayas largas (—) salvo como marcador de turno en dialogos; negrita con moderacion; no repetir oraciones entre ejercicios; las respuestas correctas de opciones multiples se aleatorizan (`shuffleOptions`).
5. Cache-busting: si cambias un `.js` o `.css`, sube su `?v=` en TODOS los HTML que lo cargan y verifica que queda un solo valor.
6. Antes de crear contenido SEO: comprobar que ninguna pagina existente cubre la misma intencion (evitar canibalizacion). No inflar `lastmod`. No usar FAQPage en articulos nuevos (decision del 7-oct).
7. Explicar a Leo, en lenguaje humano, que se decidio y por que; avisar de cualquier riesgo; terminar con "TL;DR en humano". Documentar en DEVLOG.txt cada cambio grande (formato `AAAA-MM-DD | resumen`, con pruebas y lo que NO se toco).
8. Verificar en movil (320, 360, 375 px) y escritorio (1280) sin desbordes; correr los tests antes de entregar.

### NO tocar sin autorizacion expresa
- Pagos y membresia: `startCheckout/startStripeCheckout/startPaypalCheckout` en `backend.js`, flujos de `miembros.html` (~lineas 822-1130), `*-checkout.ts`, `*-webhook.ts`, y las columnas `is_member`, `member_since`, `next_renewal_at`, IDs de proveedor.
- Esquema, RLS, trigger `progress_sessions_guard`, RPC `apply_mistake_results`, cron jobs, secreto interno en Vault.
- Correos automaticos: `last_marketing_email_at`, reclamos atomicos, `REACT.GLOBAL_GAP_DAYS`, `RENEWAL_SILENCE_DAYS`, `MEMBER_REACTIVATION_V2`, `ACTIVE_FREE_PITCH_ENABLED`, `List-Unsubscribe`, exclusiones `email_opt_out_at/email_invalid`.
- Limites gratis (`GUEST_EXERCISE_LIMIT`, `FREE_USER_DAILY_LIMIT`): cambiarlos exige tocar 3 sitios (ver 4.2).
- IDs de microtemas y de ejercicios con historial (`tools/tests/micro-ids.lock.json`).
- Eventos que alimentan a Meta (`META_PIXEL_EVENT_MAP`) y los IDs de GA/Pixel.
- `tools/generar_glosario.js`: NO ejecutar en el repo (pisa fichas editadas a mano).
- `SITE_HEALTH_REPORT.md`, `tools/site-health/history.json`, `lighthouse-history.json` (los reescribe un bot).
- Llave IndexNow, `CNAME`, y URLs/titulos/canonicals de paginas ya posicionadas sin evidencia.

### Paginas con experimento SEO en seguimiento (no editar ni enlazar mas hacia ellas)
| Pagina | Motivo | Hasta |
|---|---|---|
| glosario/mustnt | Reescrita 12-oct; linea base 252 imp, pos 10,0 | Medir desde 26-oct |
| glosario/principal-vs-principle | Piloto; ningun articulo ni ficha enlaza a proposito | Sin fecha |
| glosario/bored-vs-boring, glosario/desert-vs-dessert | Grupo de control: siguen con plantilla pura | Con el piloto |
| glosario/although | Reescrita 14-oct (288 a 669 palabras). Solo la enlaza el hub de conectores | Medir en 3-4 semanas |
| articulo-correo-formal-en-ingles | 504 imp, 1 clic, pos 10,2; sin datos de consulta que justifiquen cambio | Sin fecha |
| articulo-verbo-to-be | Titulo y descripcion cambiados el 7-oct | Esperar datos nuevos |
| articulo-entrevista-servicio-cliente-ingles | CTR 2,4% a pos 7,8 es normal | Sin fecha |
| Los 12 pares duplicados del glosario | Sin canonica decidida (than/then, borrow/lend, bring/take, hear/listen, say/tell, farther/further, rob/steal, lose/miss, job/work, wait/expect, complement/compliment, awake/wake-up) | Hasta tener GSC |

---

## 3. Repo, despliegue y flujo de trabajo

### 3.1 Mapa del repo
| Ruta | Rol |
|---|---|
| Raiz: 86 `.html` | Paginas publicas y de miembros |
| `app.js` (~480 KB, ~8900 lineas) | Cerebro: sesiones, panel, diagnostico, Plan, practica gratis, Leo AI cliente |
| `backend.js` (~41 KB) | Cliente Supabase (`LeoBackend`, `guardMemberPage`) |
| `data.js` (~1 MB) | Bancos de ejercicios |
| `temas.js` (~39 KB) | Registro de temas, familias, microtemas, ruta inicial |
| `style.css` (~173 KB) | Hoja unica |
| `article-quiz.js`, `error-monitor.js`, `meta-pixel.js`, `chatbot.js/css`, `clases.js`, `juego*.js`, `survey.js`, `leo-voz.js`, `mini-lecciones.js` (generado) | Modulos menores |
| `toefl*`, `toeic*`, `ielts*`, `cambridge*` | Examenes (un `*-data.js` y un `*.js` cada uno) |
| `audio/` (41 MB) | mp3 (`articulos/<slug>/`, `glosario/`, `a0/a1/b1/c1`, `miembros100-400`, etc.) |
| `glosario-ingles/index.html` | Indice del glosario (414 KB, 681 enlaces) |
| `glosario/<slug>/index.html` | 336 fichas |
| `fb/ ig/ tt/ yt/` | Redirecciones a redes (noindex) |
| `supabase/migrations/`, `supabase/functions/` | SQL y 2 Edge Functions (`resend-webhook`, `upgrade-nudge-emails`) |
| `supabase_functions/` | Copias `.ts` del resto de Edge Functions y SQL base |
| `supabase_schema.sql` | Esquema base (profiles, progress_sessions, mistake_stats, etc.) |
| `tools/` | Generadores, tests, e2e, site-health, audio |
| `.github/workflows/` | `indexnow.yml`, `site-health.yml` |
| `DEVLOG.txt` | Bitacora (1500+ lineas; busca por palabras clave) |
| `_to_delete/` | Basura temporal (ignorada) |

### 3.2 Despliegue
- GitHub Pages desde `main`; un push publica en 1-2 min. `CNAME` = `inglesconleo.com` (sin www).
- Versiones `?v=AAAAMMDDx` por archivo. Estado al 2026-10-14: `app.js` 20261014a (78 HTML), `style.css` 20261014a (68 paginas; 337 paginas de glosario siguen en 20261005b, consistente por grupo), `backend.js` 20261008b, `data.js` y `temas.js` 20261012a, `article-quiz.js` 20261007a, `error-monitor.js` 20261007e, `chatbot.*` 20261002a. `meta-pixel.js` y `clases.js` sin version.
- Subir un `?v=`: `sed -i 's/app\.js?v=[0-9a-z]*/app.js?v=NUEVO/g' *.html` y comprobar `grep -oh "app.js?v=[0-9a-z]*" *.html | sort | uniq -c` (debe quedar un unico valor).
- Workflows:
  - `indexnow.yml`: en cada push a main que toque `**.html` avisa a Bing/Yandex de las paginas nuevas o cambiadas de todo el push (compara con `github.event.before`); espera 60 s; manual = manda las 405 URLs. 200/202 = exito. Bing/api.indexnow.org devuelven 403 `UserForbiddedToAccessSite` con la llave real (Bing reconoce el sitio y lo rechaza; probable causa: sitio sin verificar en Bing Webmaster Tools; no esta verificado). Yandex (202) y Seznam (200) aceptan. No duplicar la integracion. Google no usa IndexNow.
  - `site-health.yml`: diario 12:00 UTC; Lighthouse y auditoria contra el sitio en vivo; commit del bot (`site-health-bot`) a `SITE_HEALTH_REPORT.md`, `tools/site-health/history.json`, `lighthouse-history.json`. Por esto los push de Leo pueden ser rechazados ("fetch first").

### 3.3 Flujo de trabajo con Leo
Respuestas cortas, humanas, "TL;DR en humano" al final; decidir con criterio y explicar despues; preguntar antes solo si es irreversible, de negocio o toca datos reales. Bloque git al final. El acceso al repo desde la nube es por `mcp__remote-devices__device_bash` (repo en `$HOME/mnt/inglesconLeo`); los archivos para Playwright/vista previa se pasan con `device_stage_files`. Respaldos de trabajo fuera del repo en `$HOME` del dispositivo.

---

## 4. Zona de miembros y motor de practica

### 4.1 Paginas
- Publicas: `practica.html` (practica gratis con limite diario; si el perfil es miembro redirige a `practica-miembros.html`), `juego.html`, `test-de-nivel-de-ingles.html`, `clases-particulares.html`, articulos, glosario, `baja.html`, `encuesta.html`.
- `miembros.html` (86 KB) hace de puerta, venta y panel: estados Loading, Gate (login/registro/recuperar/checkout), `#memberPreview` (cuenta gratis con tarjetas bloqueadas) y `#memberContent` (panel de miembro; `unlock()` ~l.954, `startDashboard()` ~l.911).
- Paginas de miembro (todas con `guardMemberPage(fn)` en `backend.js` ~l.875: exige sesion e `is_member`, si no redirige a `miembros.html`): `gramatica` (`runGrammarSession`), `vocabulario`, `listening`, `lectura`, `writing`, `speaking`, `mixto`, `practica-miembros` (`initMemberPractice`), `plan-estudio` (`renderPlanIntro`; lee `?foco= ?tema= ?habilidad= ?empezar=1`), `errores` (`runMistakesSession`, `renderMistakePatterns`), `progreso` (`renderProgressPage`), `clases` (+`clases.js`), y examenes `toefl`, `toeic`, `ielts`, `cambridge` (usan `recordSession`, `saveInflightSession`, `playAudioFile`, `renderSessionSummary` de `app.js`). Todas las paginas de miembro son `noindex` y estan fuera del sitemap.

### 4.2 Niveles de acceso (tiers)
Tres reales (no existe un valor `'member'` en `_leoAccessTier`):
1. Invitado (`'guest'`, por defecto): `GUEST_EXERCISE_LIMIT = 5` por dia (`app.js` ~l.3434).
2. Cuenta gratis (`'free'`): `FREE_USER_DAILY_LIMIT = 10` (~l.3435).
3. Miembro (`is_member=true`): sin limite.
- `practica.html` (~l.345-420) llama `LeoBackend.getMemberProfile()` y luego `initLeoAccessTier('free'|'guest', perfil)` (`app.js` ~l.3446).
- Contador unico por navegador y dia en localStorage `leoLocalDailyCount:<fecha>`; para cuenta gratis `getFreeAcctExerciseCount` toma el MAYOR entre el local y `profiles.free_daily_count/free_daily_date` (nunca los suma). Punto de entrada unico: `freeDailyLimitReached()` y `bumpFreeDailyExerciseCount()` (~l.3551). Bloque al llegar al limite: `renderFreeDailyLimitReachedBlock` (~l.3677) con pitch de membresia (2 USD/mes, 37 MXN).
- Cambiar el limite exige 3 sitios: las dos constantes de `app.js`, `FREE_USER_DAILY_LIMIT` en `supabase_functions/upgrade-nudge-emails.ts` (~l.280, advertencia "tiene que ser el mismo numero"; hay que redesplegar la funcion a mano) y los textos que lo mencionan. No hay test que ate estos numeros.
- El limite no es a prueba de trampas (localStorage) y el CONTENIDO no esta protegido (`data.js` es publico): decision aceptada por Leo.
- Membresia desbloquea: practica ilimitada con progreso guardado, diagnostico, Plan, Mis errores, Leo AI (`LEO_AI_PUBLIC=true`, ~l.2632), clases, examenes, panel con racha y variantes solo-miembro (`MEMBERS_ONLY_VARIANT_INDEX` ~l.1317; excluidas del mixto gratis y del reto diario gratis).
- `authenticated` solo puede hacer UPDATE en estas columnas de `profiles`: `display_name`, `free_daily_count`, `free_daily_date`, `free_daily_limit_reached_at`, `free_first_exercise_at`, `free_last_practice_at`, `last_practice_at`, `last_seen_at`, `level`, `level_source`, `onboarded_at`. `is_member` solo lo escriben los webhooks (service role).
- Trigger `progress_sessions_guard`: fija `tier` en servidor (`'free'` o NULL segun `is_member`), reescribe `created_at`, rechaza sesiones gratis con >60 resultados y limita a 40 sesiones/24 h (gratis) y 300 (miembro).

### 4.3 Panel de miembros (`miembros.html` + `app.js`)
- Arranque (`initGate`, `miembros.html` ~l.1418): `getMemberProfile()` (+`reconcileProfileWithCloud`), si es miembro `await syncProgressFromCloud()` y `unlock()`; si no, `showMemberPreview()`. Tras un checkout (`cameFromCheckoutReturn`) hace `pollForMembershipAfterCheckout` (cada 3 s, 9 intentos).
- `startDashboard()` pinta en orden: `applyDashboardGreeting`, `renderStatCards`, `renderContinueCard`, `renderProgressSummaryCard`, `renderTodayHero`, `renderLevelSuggestion`, `renderFeedbackCard`, `renderRecentActivityV2`, `renderMistakesBanner`, `initDailyChallenge`. Escucha `leo-progress-synced` y `leo-profile-synced`.
- Hero de accion principal (`app.js` ~l.7311-7440), UNA tarjeta con prioridad: (1) `findResumableSession` (sesion a medias de <=3 dias, mismo nivel, `idx>=1` y `<total`, skills de `DASH_RESUME_SKILLS`) como "Sigue donde te quedaste"; (2) `diag.today` (si apunta a `errores.html` se presenta como "Refuerzo pendiente"); (3) cuenta sin historial: "Tu primera practica" (`plan-estudio.html?empezar=1`); (4) si no, la tarjeta del Plan del HTML (`#todayHero`). `pickDashHero` es pura y la cubre `tools/tests/panel-accion-principal.test.js` (18 pruebas). `syncContinueWithHero` oculta "Continuar" si repetiria la misma pagina. Evento `dash_hero_clicked {hero_state}` (solo GA).
- Diagnostico (`computeDiagnosis` ~l.6130; umbrales en `DIAG` ~l.5907: `MIN_TOTAL 15`, `MIN_UNIT 8`, `WEAK_BELOW 75`, `FORGOTTEN_DAYS 10`): agrupa por habilidad y familia (`DIAG_GRAMMAR_FAMILIES`, el orden importa); genera hasta 3 acciones. Prioridad: errores (>=10 activos o >=3 repetidos fuera del punto debil) > microtemas activos > punto debil > errores >=5 > retroceso > consolidar > olvidados > plan generico.
- Plan de estudio (`app.js` ~l.3789-4500): `computePlanSelection`, `buildPlanPool`, `runPlanSessionCore` (reanuda inflight `'plan'`); largos `PLAN_LENGTHS` (rapida 5, normal 9, completa 15); dificultad `PLAN_DIFFICULTIES`. Ruta inicial (arranque en frio): `START_ROUTE` en `temas.js` ~l.391, `startRouteState/startRouteYields/ensureStartRouteSync`; solo cuentas sin sesiones antes de `START_ROUTE_LAUNCH_MS` (2026-10-07 15:00 UTC); sale al ver los 6 temas o con 18 respuestas.
- Sugerencia de nivel (`computeLevelSuggestion` ~l.7496): solo sugiere, nunca cambia el nivel (`leo_level_suggest_v1`).
- Tarjeta de feedback: la decide la RPC `member_feedback_status`.

### 4.4 Motor adaptativo
Cadena: familia > tema > microtema > ejercicios > recurso > comprobacion.
- `temas.js`: `TEMAS` (id, label, family, `article` (clase .html o `null`), `glossary`, `topics` = etiquetas exactas de `GRAMMAR_BANK`, `prereq`, `micros`, `merges`). 27 microtemas activos; cada activo necesita >=6 ejercicios de practica, >=3 de comprobacion y un recurso (lo exige `micros.test.js`). Los temas `conectores-contraste`, `secuenciadores`, `conectores-avanzados` tienen `article:null` a proposito (cambiarlo = cambiar recomendaciones: no sin aprobacion).
- `data.js`: `GRAMMAR_BANK` (~l.29), `GRAMMAR_CHECK_BANK` (~l.3374; lo sirve solo `pickCheckItems` ~l.911, ningun motor de sesion lo lee), `VOCAB_BANK` (~l.3381), `LISTENING_BANK` (~l.5007), `READING_BANK` (~l.5810), `SPEAKING_BANK` (~l.6280), `WRITING_BANK` (~l.6558), `CLASSES_BANK` (~l.7480). Forma: `BANK[nivel] = [variante...]`, cada variante = lista de bloques `{topic, items}`; niveles `principiante|facil|medio|avanzado`. Item de gramatica: `id`, `type` (`choice|fill|error`), `explain`, `examples[{en,es}]`, `micro` opcional. Las etiquetas `topic:` no se renombran a la ligera (`TEMA_BY_TOPIC` es literal y el test las exige). Un tema nuevo se registra en `temas.js` y, si es gramatica, su familia debe existir en `DIAG_GRAMMAR_FAMILIES`.
- Sesiones de miembro: `resolveMemberPool` (~l.1696), `computeCycleState`, `pickCycleItemsByTopic` (~l.1625); `SESSION_LENGTHS` corta 5 / media 9 / larga 15 (`leo_session_length`).
- Sesiones en curso: `leo_inflight_<skill>_<level>` con `saveInflightSession/loadInflightSession/clearInflightSession` (~l.2008); se guarda al inicio de cada `renderItem`; solo miembros. Toda seccion nueva de miembros DEBE ser reanudable.
- Opciones: `shuffleOptions(options, correctIndex)` (~l.2138); cualquier render nuevo de opciones debe pasar por ahi.
- Señales por microtema: `leo_micro_stats_v1` (`applyMicroResults` ~l.987, reconstruido por `ensureDerived/rebuildDerived`, `DERIVED_VERSION=2`; subirlo fuerza reconstruccion global). Flujo `MICRO_FLOW`: `debil` > `listo-comprobar` (pr>=5, >=4 distintos, >=4/5 al primer intento, >=70%) > comprobacion de 3 items (3/3 recupera, 2/3 mejora parcial, 0-1/3 vuelve a refuerzo). `microWeakness`: >=3 ejercicios distintos fallados o >=2 en dias distintos. `leo_check_seen_v1` + `syncBeforeCheck` (espera max 8 s la nube).
- Errores: RPC `apply_mistake_results` es la UNICA fuente de los umbrales activo/recuperado/dominado (el JS no los repite). `updateMistakeStatsFromResults` desde `recordSession`; `loadMistakeStatsMap` devuelve `null` si falla (cae a `computeMistakeIds`).
- `instrumentResults` (~l.763) añade campos opcionales a cada resultado (`m`, `p`, `t`, `w`, `f`, `o`, `cl`).
- Leo AI nunca califica: solo se llama con un boton y no toca resultados ni progreso.

### 4.5 Progreso y sincronizacion
localStorage `leo_*`: `leo_profile` (cache), `leo_progress_v2` (`{sessions[], lastActivity}`, fuente de todo el progreso), `leo_micro_stats_v1`, `leo_check_seen_v1`, `leo_derived_meta_v1`, `leo_inflight_*`, `leo_session_length`, `leo_plan_length`, `leo_plan_difficulty`, `leo_last_variant*`, `leo_level_suggest_v1`, `leo_feedback_card_v1`, `leo_mistake_backfill_v1_done`, `leo_free_pending_v1` (cola de sesiones gratis), `leoLocalDailyCount:<fecha>`, `leo_daily_challenge_free`, `leo_member_hint`, `leo_last_seen_touch`, `leo_ai_*`.
- `recordSession` (~l.1120): `ensureDerived` > `instrumentResults` > `markChecksConsumed` > `updateMicroStats` > push a `leo_progress_v2` > `LeoBackend.pushSession` (INSERT `progress_sessions` + UPDATE `profiles.last_practice_at`, fire-and-forget) > `updateMistakeStatsFromResults`. Para miembros no hay cola de reintento (si falla la red queda solo en localStorage).
- Sesiones gratis de cuentas con sesion: `freeSessionBegin/Answer/End/Resume`, `flushFreeSessions` (~l.3592-3676), cola `leo_free_pending_v1`; resultados `ok|drop|fail|skip`, maximo 5 intentos y 14 dias. El invitado no sube nada.
- Multi-dispositivo: `syncProgressFromCloud` (`backend.js` ~l.362) descarga, deduplica y dispara `leo-progress-synced`; fechas con `localDateStr` (fecha local). `guardMemberPage` no espera la sincronizacion; `miembros.html` si.
- Nivel y onboarding: `profiles.level/onboarded_at/level_source (self|skipped|suggested|history|test)` son la verdad; `reconcileProfileWithCloud` (~l.117).

### 4.6 Registro y onboarding
- `miembros.html?modo=registro`; `?volver=<pagina>.html` devuelve con `?cuenta=nueva`. `afterAuthSuccess` (~l.964) dispara `free_signup_completed` (> Meta `CompleteRegistration`) y redirige.
- `initOnboarding` (`app.js` ~l.417): nombre + nivel o "Saltar"; guarda `src` y sube `level/onboarded_at/level_source`; no sale a invitados.
- `practica.html?cuenta=nueva`: banner de bienvenida; una cuenta con nivel arranca en ese nivel (`initFreePractice` devuelve `{syncLevel, focusPractice}`); invitados siempre en Facil.

### 4.7 Pagos y membresia (NO TOCAR)
Front: `miembros.html` ~822-1130 (`goToCheckout` Mercado Pago, `goToStripeCheckout`, `goToPaypalCheckout`, `setPlan` mensual 2 USD / anual 20 USD solo Stripe, `pollForMembershipAfterCheckout`). Backend: `create-checkout.ts` (desplegada como `super-service`), `stripe-checkout.ts`, `paypal-checkout.ts`, webhooks `mp-webhook.ts` (probable `rapid-service`), `stripe-webhook.ts`, `paypal-webhook.ts` (usan service role; ponen `member_since`, `next_renewal_at`, `*_status`; mandan bienvenida con reclamo atomico; reportan a Meta CAPI). La correspondencia nombre-de-archivo / nombre-desplegado de las funciones genericas (`super-service`, `rapid-service`, `quick-endpoint`, `clever-responder`) es una hipotesis: confirmarla antes de editar.

### 4.8 Analytics
GA4 `G-0DRL810MYR`; Meta Pixel en `meta-pixel.js`. `trackLeoEvent` (~l.3451) manda todo a GA; a Meta solo `free_signup_completed` (CompleteRegistration), `membership_cta_clicked` (InitiateCheckout) y `membership_purchase_completed` (Purchase, 2 o 20 USD, una vez por sesion de navegador). Otros eventos solo GA: `dash_hero_clicked`, `guest_exercise_limit_reached`, `free_daily_limit_reached`, `signup_prompt_shown`, `welcome_free_practice_clicked`, `preview_free_practice_clicked`, `leo_ai_pitch_*`, `article_quiz_completed`. `error-monitor.js` (primer script de cada pagina) envia a `report-error` > tabla `app_errors`; solo actua en el dominio de produccion.

### 4.9 Trampas y deuda
- Alta: contenido premium publico; sin reintento de sesiones de miembros; dos carpetas de funciones (`supabase/functions` vs `supabase_functions`) que pueden no coincidir con lo desplegado.
- Media: 3 articulos y `clases.js` sin `?v=`; `FREE_USER_DAILY_LIMIT` duplicado en el correo; skills de examenes fuera de `DASH_RESUME_SKILLS` (una sesion de examen a medias no aparece en el hero); `DERIVED_VERSION` sensible.
- Baja: codigo muerto (`ACCESS_CODE="LEO2026"`, `isMemberUnlocked`, `requireMember`, `initAccessGate`, `buildSessionPool` sin llamadores); `todayStr()` definida dos veces (~l.3479 y ~l.5191); `app.js` se carga en paginas sin `data.js` (usar guards `typeof` en constantes de nivel superior).

---

## 5. Correos y comunicaciones automaticas

Remitente `Inglés con Leo <hola@inglesconleo.com>` (reply-to: Gmail de Leo). Proveedor Resend. Todo correo de marketing lleva `List-Unsubscribe` de un clic (`email-unsubscribe`, token HMAC).

### 5.1 Cuentas gratis (`upgrade-nudge-emails`, cron cada 30 min)
Registro: `profiles.lifecycle_emails[clave]` (ISO) + `last_marketing_email_at`. Una clave caducada sin enviar se marca `skipped`.
| Clave | Cuando |
|---|---|
| `welcome` | Al crear la cuenta (trigger `profiles_send_welcome`; el cron reintenta a los 10 min). Fuera del freno de 24 h; reserva `welcome_claimed_at` (lease 15 min) |
| `abandoned_signup` | 24-72 h tras registrarse sin ejercicio (el comentario del codigo dice 30-180 min: manda la constante) |
| `day1` / `day3` / `day5` | Desde 20 h / dia 3 / dia 5 (caducan dia 4 / 7 / 9) |
| `membership_intro` | Desde el dia 7, no caduca |
| `reactivation_day14` | Dia 14, caduca dia 45 |
| `final_onboarding` | Dia 21, caduca dia 60 |
| `long_term` | Cada 14 dias tras `final_onboarding`; se detiene a los 180 dias sin entrar o al agotar `LONG_TERM_EMAILS` (rota, una vez cada uno; `long_term_count`) |
| `reactivation_3d` | Practico y lleva >=3 dias sin practicar; cooldown 10 dias; variantes rotativas |
| `limit_reached` | 0,5-1,5 h tras tocar el limite diario; cooldown 7 dias |
| `limit_reset` | 24-28 h tras el limite si no volvio |
| `checkout_abandoned` / `checkout_followup` | 2-30 h tras iniciar checkout / 24-48 h despues (solo el ultimo intento) |
| `active_free_pitch` | DESACTIVADO (`ACTIVE_FREE_PITCH_ENABLED=false`) |

### 5.2 Miembros de pago
- Bienvenida de pago: webhooks de pago + barrido `sweepMemberWelcomes`; `member_welcome_sent_at/claimed_at`.
- `member_activation`: 24-48 h tras `member_since` sin practica, una vez.
- Reactivacion V2 (`member_react_1/2/3`, nucleo `member-reactivation-core.mjs`): dias 14, 35 y 56 sin practicar, maximo 3 por ciclo; asuntos "¿Practicamos inglés cinco minutos?", "Hay más formas de practicar tu inglés", "Tu próximo paso puede ser muy sencillo"; variante `never_started`; UTM `member_react_N`. Activa (`MEMBER_REACTIVATION_V2='on'`); 1 correo enviado hasta hoy.
- Racha (`streak-reminder-email`): cron diario 13:00 UTC; miembros que practicaron ayer y no hoy (fecha Mexico UTC-6).
- Encuesta 15 dias (`survey-15d-email`): cron horario; miembros con 15-22 dias; una vez; token a `encuesta.html`; 7 enviadas, 1 respuesta (`submit-survey`).
- Flujos viejos 3d/10d: retirados 2026-10-13, pero sus claves `member_reactivation_3d` (11) y `_10d` (6) siguen contando para el freno de 14 dias.
- Transaccionales: `send-password-reset` (desplegada como `clever-responder`), `notify-new-comment`, `leobot-notify`, `error-alert` (resumen diario 14:00 UTC).

### 5.3 Reglas globales de frecuencia y exclusion
| Regla | Donde | Detalle |
|---|---|---|
| Freno 24 h | `MARKETING_EMAIL_MIN_GAP_HOURS` (`upgrade-nudge-emails/index.ts`; tambien racha y encuesta) | Se comprueba al decidir y al reservar el cupo. `welcome` no cuenta |
| Freno 14 dias (solo V2) | `REACT.GLOBAL_GAP_DAYS`, `lastNonTransactionalEmailMs` | Maximo entre `last_marketing_email_at`, `survey_15d_sent_at`, `upgrade_email_1/2/3_sent_at`, `streak_reminder_last_sent` y toda fecha ISO de `lifecycle_emails` (excluye `welcome` y `*_count`) |
| Silencio 5 dias antes del cobro (solo V2) | `renewalGate`, `RENEWAL_SILENCE_DAYS` | Renovacion pasada = `renewal_unconfirmed`; <=5 dias = `renewal_window` |
| Reclamo atomico | `UPDATE ... WHERE last_marketing_email_at IS NULL OR < corte RETURNING` | Si Resend falla se revierte con `eq(last_marketing_email_at, slotIso)` |
| Leases de 15 min | `welcome_claimed_at`, `member_welcome_claimed_at`, `streak_reminder_claimed_at`, `survey_15d_claimed_at` | Evitan doble envio |
| Dedupe en bitacora | `member_reactivation_log` `unique(user_id, dedupe_key)` | `sent:{paso}:{ts}`, `skipped:{motivo}:{dia Cancun}`, `cancelled_returned:{paso}:{ts}`, `clicked:{paso}:{email_id}` |
| Exclusiones duras | `email_opt_out_at`, `email_invalid` | Filtradas en la consulta y re-comprobadas antes de enviar |
| Ventanas horarias | Gratis: bloquea 01:00-07:59 Cancun (salvo `welcome`, `abandoned_signup`). V2: solo 08:00-20:59 Cancun | |
| Topes por corrida | `MAX_PER_RUN=300`, `MAX_REACTIVATION_PER_RUN=25`, encuesta 200 | |
| Prioridad gratis | `limit_reached`, `checkout_*`, `limit_reset`, `abandoned_signup`, `reactivation_3d`, `welcome`, `day1`... | Un correo por usuario por corrida; durante el seguimiento de checkout se suprimen nudges menores |

### 5.4 Infraestructura
- `resend-webhook` (v5, `verify_jwt=false`, firma Svix): `email.bounced/complained` ponen `email_invalid=true`; `email.clicked` registra `clicked` solo para correos con tag `flow=member_reactivation`. PENDIENTE: activar `email.clicked` en Resend (hoy 0 clics medibles).
- Cron (pg_cron + pg_net, secreto leido de Vault `internal_functions_secret` con header `x-internal-secret`): `inglesconleo-upgrade-nudge-emails` `*/30 * * * *`; `inglesconleo-survey-15d-email` `0 * * * *`; `inglesconleo-streak-reminder-email` `0 13 * * *`; `inglesconleo-error-digest` `0 14 * * *`; `inglesconleo-error-cleanup` `30 8 * * 0`. Sin fallos en 7 dias.
- Edge Functions de correo: `upgrade-nudge-emails` v35, `survey-15d-email` v12, `streak-reminder-email` v12, `resend-webhook` v5, `email-unsubscribe` v5, `submit-survey` v7, `notify-new-comment` v6, `leobot-notify` v4 (verify_jwt true), `error-alert` v2. Las `verify_jwt=false` se protegen con `x-internal-secret` o firma de webhook.
- Secretos (solo nombres): `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `MEMBER_REACTIVATION_V2`, `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_ID/SECRET/MODE`, `MP_ACCESS_TOKEN`; en Vault `internal_functions_secret`.
- Archivos: `supabase/functions/upgrade-nudge-emails/index.ts` (2546 lineas: constantes l.280-450, `decideEmail` ~l.909, `decideMemberEmail` ~l.1123, `sendIfStillEligible` ~l.1195, contenidos ~l.1480-2120, V2 desde ~l.2155) y `member-reactivation-core.mjs`; `supabase_functions/*.ts` (racha, encuesta, baja, webhooks de pago...). Tests: `member-reactivation.test.js` (52), `member-reactivation-e2e.test.js` (24), `upgrade-nudge-emails.test.js`, `checkout-abandonado.test.js`.

### 5.5 Resultados reales (agregados, 2026-10-14)
94 cuentas, 13 miembros, 1 baja, 0 invalidos. 25 cuentas con correo en las ultimas 24 h; 89 en 14 dias. Enviados (`lifecycle_emails`): welcome 87, day1 65, day3 57, day5 48, membership_intro 60, abandoned_signup 27, reactivation_3d 33, reactivation_day14 26, limit_reached 20, limit_reset 7, final_onboarding 16, long_term 3, checkout_abandoned 5, checkout_followup 3, member_activation 1, V2 `member_react_1` 1. Bitacora V2 (12 filas): 1 enviado, 7 omitidos por `recent_email`, 4 por `activity_unreliable`; 0 clics. 10 de 13 miembros frenados por el freno de 14 dias; 4 miembros sin `next_renewal_at` y 3 sin proveedor de pago. m4 (renueva 17-oct) y m5 (renueva 23-oct) no recibiran la V2 antes de renovar; Leo decidio mensaje personal manual.

### 5.6 Probar sin enviar
- Simulacion V2: POST `{"reactivation_dry_run": true}` a `upgrade-nudge-emails` (con `x-internal-secret`): mismo codigo que el real, no escribe ni envia.
- `{"billing_sync": true, "apply": false}` solo informa (con `apply:true` escribe unicamente `next_renewal_at`).
- Tests automaticos (`tools/tests/*.test.js`) con dobles de DB/Resend/proveedores.
- NO usar `manual_emails` con usuarios reales (salta frenos y consume la secuencia), NO invocar las funciones sin cuerpo (ejecuta el modo automatico completo), NO tocar `MEMBER_REACTIVATION_V2` sin correr antes la simulacion, NO editar a mano `last_marketing_email_at` ni `lifecycle_emails`.

### 5.7 Riesgos y huecos (por gravedad)
1. Alta: no hay bitacora de envios para flujos gratis, racha y encuesta (solo marcas en `profiles`). Mejora: tabla comun `email_send_log` + tags de Resend.
2. Alta: clics sin medir (ver 5.4).
3. Alta: la V2 casi nunca puede enviar (ver 5.5). Decision de negocio: ignorar las claves muertas en el freno y regularizar miembros sin proveedor/`member_since`.
4. Media: racha y encuesta no respetan el silencio de 5 dias antes del cobro (solo la V2 lo hace).
5. Media: posible duplicado si Resend envia pero falla la escritura posterior en `profiles` (no se usa `Idempotency-Key`).
6. Media: 4 miembros `activity_unreliable` (sin `member_since` ni actividad) nunca recibiran V2.
7. Media: el webhook de rebotes busca el correo con `eq('email', ...)` sensible a mayusculas.
8. Media: dos copias de las funciones; lo desplegado puede diferir del repo.
9. Baja: monolito de 2546 lineas con comentarios desfasados (confiar en las constantes).

---

## 6. Base de datos, seguridad y backend (Supabase)

### 6.1 Esquema (public: 18 tablas y 4 vistas, RLS activada en todas)
| Tabla | Filas | Proposito |
|---|---|---|
| `profiles` | 94 | Una fila por cuenta: membresia, pagos, correos, nivel, actividad |
| `progress_sessions` | 227 | Sesiones (`user_id, skill, level, topics, date, started_at, duration_ms, results, created_at, tier`) |
| `mistake_stats` | 222 | Errores por ejercicio (`item_id, kind, topic, fail_count, correct_streak, status, recovered_at`) |
| `article_comments` | 2 | Comentarios de articulos (`parent_comment_id`) |
| `leobot_reports` | 3 | Reportes de bug/soporte del chatbot |
| `survey_responses` | 1 | Encuesta 15 dias (`q1..q4`) |
| `member_feedback`, `member_feedback_state` | 0, 0 | Nota 1-10 (`low_score` generada = score<=6) y estado del aviso |
| `member_reactivation_log` | 12 | Bitacora V2 (`event` sent/skipped/cancelled_returned/clicked; `dedupe_key`) |
| `leo_ai_config` (1), `leo_ai_testers` (1), `ai_usage` (20), `ai_usage_daily` (25), `leo_ai_requests` (13) | | Leo AI: interruptor/limites, testers, consumo, idempotencia |
| `app_errors` (45), `app_error_hourly` (81), `app_error_rate` (30) | | Monitor de errores |
- CHECK utiles: `profiles.level` en principiante|facil|medio|avanzado; `level_source` en self|skipped|suggested|history|test; `progress_sessions.tier` NULL o `free`; `results` array <=500 elementos y 100 KB; `topics` <=4 KB.
- Columnas de `profiles` clave: `is_member`, `member_since`, `next_renewal_at`, `mp_preapproval_id/status`, `stripe_customer_id`, `paypal_subscription_id`, `checkout_started_at`, `free_daily_count/date`, `free_first_exercise_at`, `free_last_practice_at`, `free_daily_limit_reached_at`, `last_practice_at`, `last_seen_at`, `level`, `level_source`, `onboarded_at`, `lifecycle_emails` (jsonb), claves de reclamo/envio de cada flujo, `email_opt_out_at`, `email_invalid`.
- Vistas (`security_invoker=true`, solo `service_role`): `weekly_activation_report` (cohortes semanales), `activation_followup_report` (primer ejercicio 24 h/7 d, antes/despues del 2026-10-13 18:21 UTC), `first_session_report` (primera SESION 24 h/7 d; la metrica mas fiable porque no depende de columnas escritas por el cliente), `member_reactivation_results` (clic y regreso por envio).
- Funciones relevantes: `handle_new_user()` (SD, trigger de auth.users), `submit_member_feedback/member_feedback_status/dismiss_member_feedback` (SD, authenticated), `apply_mistake_results(p_items jsonb)` (no SD, anon+authenticated, `search_path` sin fijar), `progress_sessions_guard()` (trigger BEFORE INSERT), `send_welcome_on_profile_insert()` (trigger AFTER INSERT), `internal_secret_ok`, `leo_ai_*`, `log_app_error/err_rate_hit/app_error_digest/app_error_cleanup`. Extensiones: `pg_cron`, `pg_net`, `supabase_vault`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`.

### 6.2 Seguridad
- Politicas: `profiles` SELECT/UPDATE solo la propia fila (sin INSERT/DELETE); `progress_sessions` SELECT/INSERT propios; `mistake_stats` SELECT/INSERT/UPDATE propios; `member_feedback*` SELECT propio (escribe la RPC); `article_comments` SELECT publico, INSERT con validaciones, DELETE solo administrador (UUID fijo dentro de la politica); `leobot_reports` solo INSERT; las demas tablas sin politicas (solo service_role, intencional).
- TRUNCATE revocado a anon y authenticated en 10 tablas (2026-10-14); solo service_role lo conserva. Verificado.
- Hallazgos: (media) anon con INSERT/UPDATE de columna sobre TODO `profiles` incl. `is_member` (defensa de una sola capa); (media) `handle_new_user()` invocable por RPC; (media) permisos heredados amplios (INSERT/UPDATE/DELETE de tabla a anon/authenticated en 10 tablas contenidos por RLS); (baja) `apply_mistake_results` sin `search_path`; (baja) proteccion de contraseñas filtradas desactivada; (baja) 12 politicas con `auth.uid()` sin `(select auth.uid())`, 4 indices sin uso, FKs sin indice en `article_comments.user_id` y `leobot_reports.user_id`; (baja) politica de respuestas de `article_comments` con alias ambiguo (`parent.id = parent.parent_comment_id`), revisar antes de abrir respuestas.
- Los campos que el cliente escribe (`free_daily_count`, `level`, `free_first_exercise_at`) son falseables: para activacion usa `first_session_report` (basada en `progress_sessions`, con `tier` y `created_at` fijados por el servidor).

### 6.3 Migraciones: Supabase vs repo
Las versiones registradas las asigna Supabase al aplicar. Estado (2026-10-14):
- Registradas SIN archivo en el repo: `ai_usage_writing_feedback`, `drop_ai_usage_until_gemini_activation`, `leo_ai_usage_limits_and_testers`, `internal_functions_secret_and_welcome_claim`, `cron_jobs_use_vault_secret`, `profiles_send_welcome_trigger`, `leo_ai_request_idempotency`, `profiles_level_onboarded_at`, `revoke_truncate_anon_authenticated` (version 20261014163304).
- Archivo en repo SIN registro (pero el cambio existe en prod, aplicado por otra via): `20261007130000_add_free_last_practice_at.sql`, `20261008190000_member_feedback.sql`.
- Existen en ambos con otra marca de tiempo: member_reactivation_log (archivo 20261013150000 / registrada 20261013143151), weekly_activation_report (20261013180000 / 20261013180741), activation_followup_report (20261013190000 / 20261013182229), first_session_report (20261014150000 / 20261014162700).
- Consecuencia: la base no se puede reconstruir solo con los archivos del repo; el esquema base vive en `supabase_schema.sql` y `supabase_functions/*.sql`.
- Mantener paridad: tras cada migracion, `select version, name from supabase_migrations.schema_migrations order by 1;` y guardar el archivo con esa version exacta como prefijo; crear ahora `20261014163304_revoke_truncate_anon_authenticated.sql` (REVOKE TRUNCATE de las 10 tablas); aplicar migraciones ANTES de subir el codigo que dependa de ellas.

### 6.4 Edge Functions desplegadas (19)
`leo-ai` v12 (jwt), `stripe-checkout` v30 (jwt), `paypal-checkout` v21 (jwt), `leobot-notify` v4 (jwt), `super-service` v37 (jwt; checkout Mercado Pago, hipotesis), `quick-endpoint` v27 (jwt; sin copia en el repo), `clever-responder` v26 (jwt; recuperacion de contraseña, hipotesis), `stripe-webhook` v32, `paypal-webhook` v24, `rapid-service` v38 (webhook Mercado Pago, hipotesis), `resend-webhook` v5, `upgrade-nudge-emails` v35, `survey-15d-email` v12, `streak-reminder-email` v12, `submit-survey` v7, `notify-new-comment` v6, `email-unsubscribe` v5, `report-error` v2, `error-alert` v2. `verify_jwt=false` no significa abierta: cron con `x-internal-secret`, webhooks con firma del proveedor. Importar al repo el codigo de las 4 funciones sin copia identificable.

### 6.5 Frontend (`backend.js`, 883 lineas)
Cliente `supabase.createClient` con la llave publica (anon; es lo esperado en un sitio estatico: la proteccion real es la RLS). Auth: correo/contraseña, Google, recuperar contraseña; tras login `signOut({scope:'others'})`. Llama directamente a `profiles`, `progress_sessions`, `mistake_stats`, `article_comments`, `leobot_reports`; RPC `apply_mistake_results`, `member_feedback_status`, `submit_member_feedback`, `dismiss_member_feedback`; funciones `clever-responder`, `super-service`, `stripe-checkout`, `paypal-checkout`, `leo-ai`, `notify-new-comment`, `leobot-notify`. Casi todo en try/catch devolviendo `'fail'`/`null`/`[]`: si el guard rechaza una escritura el usuario no lo ve (solo consola). Hasta que una migracion este aplicada, el frontend que dependa de ella falla en produccion.

### 6.6 Datos agregados (2026-10-14)
94 cuentas (primera 2026-09-08); 13 miembros / 81 gratis; proveedores de pago: Mercado Pago 2, Stripe 9, PayPal 3; 15 con checkout iniciado; 37 con nivel/onboarding; 43 con primer ejercicio gratis marcado; 36 activas en 7 dias; 227 sesiones (44 `tier='free'`, 183 con `tier` NULL = miembros + sesiones anteriores al 2026-10-07); 26 usuarios con sesiones (13 gratis); 11 de 13 miembros con alguna sesion. Lectura: solo 13 de 81 cuentas gratis tienen sesiones guardadas frente a 43 con primer ejercicio marcado (el segundo lo escribe el cliente).

---

## 7. SEO y contenido publico

### 7.1 Inventario y chequeos (405 URLs del sitemap)
59 articulos + 336 fichas + 1 indice (`glosario-ingles/`) + 9 otras (`/`, articulos, sobre-leo, clases-particulares, practica, test-de-nivel-de-ingles, juego, miembros, privacidad). 22 HTML fuera del sitemap a proposito: 18 con `noindex` (baja, encuesta, cambridge, clases, errores, gramatica, ielts, lectura, listening, mixto, plan-estudio, practica-miembros, progreso, speaking, toefl, toeic, vocabulario, writing) y 4 redirecciones a redes (`ig/ tt/ fb/ yt`). Verificado: 0 archivos faltantes, 0 duplicados, 0 `noindex`, canonical = URL, 1 H1 en todas; 0 titulos o descripciones duplicados. `robots.txt` = `Allow: /` + `Sitemap:`; no hay `404.html` propia; `site.webmanifest` minimo (sin `scope`). Llave IndexNow en la raiz (`41c1350951c5e79e95e8a4d0b5c84112.txt`).
Calidad: 23 articulos con titulo >60 caracteres, 6 fichas, 2 otras; 23 fichas con descripcion <70; 3 articulos y 5 otras con descripcion >160. Pesos: articulos 10-56 KB, fichas ~8 KB, `glosario-ingles/` 414 KB. Imagenes: solo `logo.png` en articulos (con alt, sin `loading`). Datos estructurados: Article en los 59 (33 tienen ademas FAQPage; los 26 creados desde el 7-oct no); 1 articulo con BreadcrumbList.

### 7.2 Como se construyen las paginas
- Articulo (HTML a mano, sin generador): copiar uno reciente (p. ej. `articulo-conectores-ingles.html`). Head (favicons, manifest, description, title, canonical, og/twitter, `style.css?v=`, `error-monitor.js`, GA, `meta-pixel.js`), JSON-LD Article (Person Leo, Organization, `datePublished/dateModified`), header con nav, `<main><article class="article-body">`, badge, un H1, `.article-meta`, "Respuesta rapida" (`.article-toc` con `.article-example` `.en/.es`), H2 con `.article-table-wrap > table.article-table`, `.article-wrong/.article-right`, quizzes `.toeic-mini` (`#questionsQuiz`, `#grammarQuiz`; `.option-list.toeic-mini-opts` con `data-correct` y `data-explain`), audio (`<div id=xAudio hidden><audio data-src="audio/articulos/<slug>/<file>.mp3">` + script con HEAD-check: muestra el reproductor solo si el mp3 existe, si no abre la transcripcion `<details>`), `.article-cta` (Practicar gratis / Hacer test de nivel), FAQ en `<details>`, footer y scripts (`backend.js`, `temas.js`, `app.js`, `article-quiz.js`, `personalizeNav();`). Enlaces internos RELATIVOS (`glosario/x/`, `articulo-y.html`): contar ambas formas al auditar.
- Ficha de glosario: generada por `tools/generar_glosario.js` desde `tools/glosario/terminos.js` (+`extras.js`, `confusiones-200.js`). El generador esta DESACTUALIZADO (`CSS_V='20261001g'`, `GL_V='20261002a'` vs sitio `20261005b`) y reescribio 118 paginas el 12-oct (hubo que restaurar de git). NO correrlo en el repo. 47 fichas difieren de la salida del generador: 15 reescritas a mano (although, despite-vs-although, mustnt, mustnt-vs-dont-have-to, any-vs-some, little-vs-a-little, accept-vs-except, advice-vs-advise, effective-vs-efficient, was-vs-were, then-vs-than, look-forward-to, principal-vs-principle, even-though, though) y 32 con solo el boton de practica cambiado a gramatica. Si algun dia se regenera: primero pasar esas ediciones a `terminos.js`. Para comparar sin riesgo, copiar `tools/glosario`, el generador, `temas.js`, `data.js`, `sitemap.xml`, `articulo-*.html` y `audio/glosario` a una carpeta temporal fuera del repo.
- 192 de 336 fichas aun llevan texto de plantilla ("Esta duda aparece con frecuencia"); 144 tienen texto propio (100 de pronunciacion de ~127-170 palabras y las editadas). Mediana 194 palabras.
- `articulos.html`: 66 `a.article-card` (60 con `data-article-category`, categorias dobles separadas por espacio: gramatica, aprender-ingles, entrevistas, vocabulario, guias, examenes, niveles, listening, pronunciacion), cada tarjeta con `data-search-keywords`. Seccion de video con carrusel y marcadores `PON_AQUI_LA_URL_DE_*`.
- `lastmod`: fecha real del cambio de contenido, no por cambios de formato (GA, pixel, enlaces masivos). Una frase de enlace añadida a un articulo SI justifica actualizarlo. Fichas: `lastmod` del sitemap y `dateModified` del JSON-LD sincronizados a mano (3 desfases: even-though, mustnt, though).

### 7.3 Glosario: enlaces entrantes (calculo real de `<a href>`, sin header/footer ni canonical)
0 fichas huerfanas (las 336 estan en el indice, que tiene 681 enlaces). 195 reciben enlace SOLO desde el indice; 92 solo desde otras fichas; 49 desde al menos un articulo (eran 42 antes de las 7 de hoy: instead-of, as-vs-like, fewer-vs-less, would-rather, accept-vs-except, effective-vs-efficient, lose-vs-loose). `plan-estudio.html` (noindex) recibe enlace desde 24 paginas. Articulos con pocos entrantes desde otros articulos (1): presente-continuo, pasado-continuo, preguntas-migracion-ingles, problemas-hotel-ingles, preguntas-respuestas-conversar-ingles, ingles-meseros-camareros, pronunciacion-ingles, ingles-recepcionistas-hotel, gerundio-e-infinitivo. Articulos finos (palabras): presente-continuo 321, ingles-aeropuerto 336, ingles-restaurante 350, pasado-continuo 469, listening-a1 505, hora-en-ingles 520, cuanto-tiempo-aprender-ingles 558, vocabulario-basico 581.
Criterio usado para enlazar fichas desde articulos: ficha escrita a mano (>150 palabras), 0 enlaces desde articulos, articulo anfitrion NO experimental donde el tema aparece de forma natural; una frase por enlace, texto distinto cada vez.

### 7.4 Datos de Search Console conocidos (no hay acceso a GSC desde el repo)
| Periodo | Dato |
|---|---|
| 14-sep a 11-oct | 3.044 imp, 83 clics, pos 15,4. Quincena 1: 327 imp / 34 clics. Quincena 2: 2.717 imp / 49 clics (la visibilidad crecio mas rapido que los clics: paginas nuevas en posiciones bajas) |
| Por pagina (28 dias, imp/clics/pos) | correo-formal 525/1/10,93; verbo-to-be 511/1/9,90; glosario/although 432/1/12,86; glosario/mustnt 301/0/10,05; principal-vs-principle 178/0/9,91; pasado-simple 126/0/40,40; como-aprender-desde-cero 122/1/36,03; entrevista-servicio-cliente 83/2/7,81; examen-toeic 83/1/38,65; bored-vs-boring 32/0/12,72 |
| Consultas | "principle" 151/0/10,01 (generica, relevancia baja); "mustn't" 85/0/8,73; "although significado" 81/0/10,70; "que significa although" 48/0/10,81; "aprender ingles desde cero" 40/0/42,68; "although" 25; "mustnt" 20; "que significa mustn't" 19; "como aprender inglés desde cero" 19/0/45,74; "que es although" 17; "significado de although" 13; "although significado y uso" 9/0/7,78; "como usar although" 6/0/8,67; "diferencia entre bored y boring" 6; "diferencia entre ielts academic y general" 7/0/21,00 |
| Indexacion | 5-oct: 17/337 fichas indexadas. 12-oct (muestra de 10): 4 indexadas, 4 descubiertas sin indexar, 2 desconocidas. 14-oct: 19 de 20 URLs de seguimiento indexadas. Sitemap en GSC: 397 URLs leidas (antes de articulos nuevos), 1 advertencia no identificable desde el repo |
Notas: GSC oculta consultas por privacidad; no sumar metricas por pagina para reconstruir el total; "indexed=0" de la API del sitemap NO significa cero indexadas. El cuello de botella detectado el 12-oct es la programacion de rastreo de Google (dominio nuevo, 336 URLs en 3 dias), no un error tecnico ni la cantidad de enlaces.

### 7.5 Acciones SEO de 2026-10-14 (para no repetir)
1. Sprint con datos GSC: sitemap limpio; `glosario/although/` reescrita a mano (288 a 669 palabras).
2. Auditoria de IndexNow (sin cambios de llave; se corrigio un fallo real del workflow: antes solo avisaba las paginas del ultimo commit del push).
3. Nuevo articulo hub `articulo-conectores-ingles.html` ("Conectores en inglés: and, but, so, because y however"): evidencia = ningun articulo cubria conectores, demanda visible en el cluster de fichas de although. Enlaza a las fichas although, though, even-though, however, despite-vs-although, since-vs-for, a rutina diaria y a condicionales. Tarjeta en `articulos.html`, sitemap, fila de audio en el CSV, enlace de una frase desde `articulo-rutina-diaria-ingles.html` y `articulo-como-aprender-ingles-desde-cero.html`. Audio `audio/articulos/conectores-ingles/dialogo-viaje-lago.mp3` generado con Kokoro (30,9 s, 363 KB; subir a git).
4. Enlaces internos articulos > fichas (7 enlaces, ver 7.3) en: gerundio-e-infinitivo, comparativos-y-superlativos, sustantivos-contables-incontables, verbos-modales, entrevista-trabajo-ingles (con frases nuevas para aceptar una oferta o pedir tiempo), ingles-reuniones-de-trabajo, verbos-irregulares. `lastmod` 2026-10-14 en esos 7.
5. Medicion pendiente: 14 y 28 dias tras el push (indexacion y posicion del hub, impresiones de las fichas enlazadas, "although significado" y "que significa although"); desde el 26-oct, mustnt contra su linea base.

### 7.6 Pendientes y oportunidades SEO (por potencial)
1. Medir y decidir tras el 26-oct los experimentos. 2. Obtener de GSC el informe de paginas indexadas actual, la advertencia del sitemap e impresiones por ficha; decidir canonica de los 12 pares. 3. Reescribir a mano las fichas de plantilla que GSC muestre con impresiones (y pasar el contenido a `terminos.js`). 4. Mas enlaces contextuales a fichas escritas a mano. 5. Reforzar articulos finos. 6. Acortar titulos largos (solo paginas sin experimento). 7. `404.html` propia y `scope` en el manifest (opcional). 8. Nuevos hubs para intenciones sin cubrir. 9. Conectar `conectores-contraste`/`secuenciadores`/`conectores-avanzados` en `temas.js` al nuevo articulo SOLO con aprobacion (cambia recomendaciones).

---

## 8. Tests, audio (Kokoro) y herramientas

### 8.1 Tests
Todo Node puro, sin red: `node tools/tests/<x>.test.js`; todo: `node tools/e2e/run-all.js`; bucle: `for f in tools/tests/*.test.js; do node "$f" || echo FALLA $f; done`. 33 `.test.js` + 2 `.test.sql` (`error-monitoring.test.sql`, `progress-sessions-guard.test.sql`, se corren a mano en Supabase).
| Test | Cubre |
|---|---|
| `temas.test.js` (107) | Registro de temas, enlaces reales, familias, foco del Plan, recomendaciones |
| `data-quality.test.js` | Cada bloque de `data.js` en un tema; IDs duplicados; calidad |
| `glossary.test.js` (8) | Sitemap = fichas, manifiesto de audio, un audio por ficha |
| `panel-accion-principal.test.js` (18) | Hero unico, sesion reanudable |
| `micros.test.js`, `micro-flujo.test.js`, `ruta-inicial/base`, `condicionales-piloto`, `futuro-piloto`, `ampliacion-5-temas`, `plan-variedad`, `session-cycle` (intermitente segun DEVLOG) | Microtemas, Plan, ciclo de sesiones |
| `diagnosis`, `personalization`, `level-suggest`, `answer-instrumentation`, `free-sessions`, `onboarding-nube`, `primera-sesion-gratis`, `multi-dispositivo`, `feedback-card`, `member-feedback-sql` (necesita `@electric-sql/pglite`, si falta se omite) | Diagnostico, nivel, practica gratis, nube |
| `leo-ai`, `leo-ai-server`, `writing-ai`, `error-monitor` (conteo de paginas desactualizado segun DEVLOG), `audio-mime`, `lh-detail` | IA, errores, audio, Lighthouse |
| `checkout-abandonado`, `member-reactivation` (52), `member-reactivation-e2e` (24), `upgrade-nudge-emails` | Correos y pagos con dobles |
e2e (`tools/e2e`): `run-all.js` (todo), `test-microtema.js <id>|--all-active`, `regresiones.js`, `simulate-flow.js`, `simulate-real.js`, `micros.config.json`, `ruta-inicial.browser.js`, `free-sessions.browser.js`, `README.md` (la cuenta QA no se resetea sin aprobacion). Un microtema nuevo con `active:true` lo recorren solo. No hay CI de tests (solo Site Health e IndexNow): hay que correrlos antes de cada push.

### 8.2 Audio
- `tools/lista_audios.csv` (formato `archivo,texto,voz`; los dialogos de dos voces son lineas que empiezan con `— `; la tercera columna fija el orden de voces: si empieza con "Andrew" se intercambian). Dialogos nuevos de articulos: voz `en-US-AvaMultilingualNeural|en-US-AndrewMultilingualNeural`; `generar_dialogo_kokoro.py` usa `af_heart` (voz 1) y `am_michael` (voz 2), 96 kbps mono 24 kHz, 0,35 s de pausa.
- `generar_audios.py` (Edge TTS) lo corre Leo en su PC pero devolvio HTTP 403 el 12 y 13-oct: hoy los dialogos nuevos se hacen con Kokoro.
- KOKORO SI SE PUEDE GENERAR DESDE LA SESION DEL AGENTE (ya hecho el 2026-10-14). Procedimiento verificado (en la shell del dispositivo, `device_bash`; los modelos van FUERA del repo):
  1. `pip install --break-system-packages kokoro-onnx lameenc`
  2. `mkdir -p $HOME/kk && cd $HOME/kk && B=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0 && curl -sL -o voices-v1.0.bin $B/voices-v1.0.bin && curl -sL -o kokoro-v1.0.onnx $B/kokoro-v1.0.onnx` (~325 MB + 28 MB; correr en segundo plano si pasa de 2 min por limite del comando). Hugging Face esta bloqueado; GitHub funciona.
  3. Copia del script con rutas ajustadas: `R=$HOME/mnt/inglesconLeo; sed -e "s#^AQUI = .*#AQUI = '$R/tools'#" -e "s#^MODELO = .*#MODELO = '$HOME/kk/kokoro-v1.0.onnx'#" -e "s#^VOCES = .*#VOCES = '$HOME/kk/voices-v1.0.bin'#" $R/tools/generar_dialogo_kokoro.py > $HOME/kk/gen.py`
  4. La fila debe existir en el CSV con la ruta exacta. Ejecutar: `cd $HOME/kk && python3 gen.py audio/articulos/<slug>/<nombre>.mp3` (escribe en el repo `audio/articulos/<slug>/`, ~1 min).
  5. Verificar: `ffmpeg -v error -i <mp3> -f null -` (sin salida = valido) y `ffprobe -v error -show_entries format=duration,bit_rate -of csv=p=0 <mp3>`.
  6. Avisar a Leo que suba el mp3 con git. El reproductor aparece solo cuando el mp3 existe (en el articulo, HEAD-check); si no existe queda oculto y la transcripcion se abre.
- Estructura: `audio/articulos/<slug>/dialogo-*.mp3` (slug sin prefijo `articulo-`, ~27 carpetas), `audio/glosario/`, `audio/a0..c1`, `miembros100-400`, `toefl/toeic/ielts/cambridge*`, `clases`, `test-nivel`, `numeros`, `leo`. Scripts de audio antiguos en raiz y `tools/` (`generar_audio_glosario.py`, `generar_dialogos.py`, `generar_clases_nuevas*.py`, `generar_cambridge_*`, `generar_toeic_audios.py`, `generar_miembros*_audios.py`, `preparar_audios_leo.py`).
- Archivo huerfano: `audio/articulos/this-that-these-those/dialogo-zapateria.mp3.tmp0.mp3` (0 bytes, de una generacion fallida). No subirlo; borrarlo a mano o moverlo a `_to_delete/`.

### 8.3 Utilidades `tools/`
`generar_glosario.js` (NO correr en el repo), `generar_mini_lecciones.js` (regenera `mini-lecciones.js` desde `data.js`), `micros-lib.js`, `micros-report.js [--json|--lock]` (huecos de cobertura, solo lectura), `site-health/` (`audit.js`, `run-lighthouse.js`, `lh-detail.js`, `glossary-audit.js`, `glossary-common.js`, `gsc-glossary-inspect.js`, `gsc-optional.js`; credencial `gsc-service-account.json` ignorada), `silencio_600ms.mp3`.
No debe subirse: `tools/site-health/DEVLOG.txt`, `tools/site-health/reports/` (ignorado salvo el baseline `.md`), `*.tmp*.mp3`, `_to_delete/`, `__pycache__/`, `node_modules/`, `lighthouse-raw/`, `tools/e2e/.auth/`, `*.storageState.json`, `.env*`, `tools/.kokoro-models/` (si existiera; 325 MB).

### 8.4 Riesgos de herramientas
1. `data.js` (1 MB) y `app.js` (480 KB) se cargan en 33 y 78 paginas: probable causa de los criticos de Lighthouse (practica llego a bajar de 87 a 53; parte es ruido del simulador). 2. `?v=` manual sin test que verifique un unico valor por archivo. 3. Sin CI de tests. 4. Edge TTS con 403. 5. El generador de glosario pisa ediciones a mano. 6. IndexNow/Bing 403 (del lado de Bing). 7. Dos copias de Edge Functions pueden divergir (y hubo CRLF/LF mezclados en `upgrade-nudge-emails.ts`). 8. Basura sin ignorar (`.tmp0.mp3`, `tools/site-health/DEVLOG.txt`). 9. Scripts de audio dispersos.

---

## 9. Checklists reutilizables

### 9.1 Articulo nuevo
1. Confirmar con evidencia que ninguna pagina cubre la misma intencion (articulos, fichas, GSC).
2. Crear `articulo-<slug>.html` clonando uno reciente; un solo H1; title <=60; description <=160; canonical, og, twitter, JSON-LD Article (sin FAQPage).
3. Contenido: respuesta rapida, tablas, errores comunes, dialogo de dos voces (con fila en `tools/lista_audios.csv`), quizzes con `data-correct` aleatorizado, resumen, CTA, FAQ. Sin rayas largas; negrita moderada.
4. Generar el mp3 con Kokoro (8.2) y verificarlo.
5. Tarjeta en `articulos.html` (`data-article-category`, `data-search-keywords`), entrada en `sitemap.xml` (lastmod = hoy) y enlaces de una frase desde 2-3 articulos NO experimentales, mas enlaces salientes utiles.
6. Entrada en `DEVLOG.txt`, tests, vista movil 320/360/375/1280, bloque git para Leo.
7. Tras el push: verificar en produccion (200, sitemap, tarjeta) con `?v=` para saltar cache; una sola solicitud de indexacion manual en Search Console; medir a 14 y 28 dias.

### 9.2 Cierre de cualquier cambio
Tests (`node tools/e2e/run-all.js`; para HTML/ejercicios/temas: `temas`, `data-quality`, `glossary`) > subir `?v=` si cambio `.js/.css` > enlaces internos sin rotos, 1 H1, canonical, sin `noindex` > si hay pagina nueva: tarjeta, sitemap, enlaces > si hay audio: CSV + mp3 verificado + sin `.tmp` > movil sin desbordes > texto sin rayas largas > DEVLOG > bloque git (`git pull --rebase`, `git add <archivos>`, `git commit -m "..."`, `git push`).

---

## 10. Consultas SQL y comandos utiles (solo lectura)

```sql
-- Totales de cuentas, miembros, gratis y activas en 7 dias
select count(*) total, count(*) filter (where is_member) miembros,
       count(*) filter (where not is_member) gratis,
       count(*) filter (where last_seen_at > now()-interval '7 days') activos_7d
from profiles;

-- Embudo de activacion (vistas, solo service_role)
select * from weekly_activation_report order by 1 desc limit 6;
select * from first_session_report order by 1 desc limit 6;
select * from activation_followup_report order by 1 desc, 2 limit 8;

-- Sesiones por tier y dia (14 dias)
select date, coalesce(tier,'miembro_o_previo') tier, count(*) n
from progress_sessions where date > current_date - 14 group by 1,2 order by 1 desc, 2;

-- Reactivacion V2: eventos y embudo
select event, step, kind, reason, count(*) n, max(created_at) ultimo
from member_reactivation_log group by 1,2,3,4 order by 1,2;
select step, count(*) enviados, count(first_click_at) con_clic, count(returned_at) regresaron
from member_reactivation_results group by 1 order by 1;

-- Envios por tipo de correo (fechas ISO validas)
select j.key, count(*) n, max(j.value::timestamptz)::date ultimo
from profiles p, jsonb_each_text(coalesce(p.lifecycle_emails,'{}')) j
where j.key not like '%\_count' and j.value ~ '^\d{4}-\d{2}-\d{2}T'
group by 1 order by n desc;

-- Frenos y salud de la lista
select count(*) filter (where is_member) miembros,
 count(*) filter (where is_member and last_marketing_email_at > now()-interval '14 days') frenados_14d,
 count(*) filter (where last_marketing_email_at > now()-interval '24 hours') frenados_24h,
 count(*) filter (where email_opt_out_at is not null) bajas,
 count(*) filter (where email_invalid) invalidos
from profiles;

-- Miembros sin fecha de renovacion o sin proveedor
select count(*) filter (where is_member and next_renewal_at is null) sin_fecha,
 count(*) filter (where is_member and stripe_customer_id is null
   and paypal_subscription_id is null and mp_preapproval_id is null) sin_proveedor
from profiles;

-- Cron: salud
select j.jobname, count(*) corridas, count(*) filter (where d.status<>'succeeded') fallidas, max(d.start_time) ultima
from cron.job_run_details d join cron.job j using(jobid)
where d.start_time > now()-interval '7 days' group by 1;

-- Errores abiertos
select kind, severity, section, left(message,80) msg, count, last_seen
from app_errors where status='open' order by severity desc, count desc limit 20;

-- Seguridad: TRUNCATE (debe quedar vacio) y tablas sin RLS (debe quedar vacio)
select table_name, grantee from information_schema.role_table_grants
where table_schema='public' and privilege_type='TRUNCATE' and grantee in ('anon','authenticated');
select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;

-- Migraciones registradas
select version, name from supabase_migrations.schema_migrations order by 1;
```

```bash
# Desde la raiz del repo (shell del dispositivo)
# Sitemap: archivos faltantes (debe salir vacio)
grep -o '<loc>[^<]*' sitemap.xml | sed 's#<loc>https://inglesconleo.com/##' | while read p; do f="$p"; [ -z "$f" -o "${f: -1}" = "/" ] && f="${f}index.html"; [ -f "$f" ] || echo "FALTA $f"; done
# Articulos sin tarjeta (debe salir vacio)
for f in articulo-*.html; do grep -q "href=\"$f\"" articulos.html || echo "SIN TARJETA $f"; done
# Version unica de app.js
grep -oh "app.js?v=[0-9a-z]*" *.html | sort | uniq -c
# H1 distinto de 1, noindex o canonical dudoso en el sitemap
node -e 'const fs=require("fs");const s=fs.readFileSync("sitemap.xml","utf8");for(const m of s.matchAll(/<loc>([^<]*)/g)){let p=m[1].replace("https://inglesconleo.com/","");if(!p||p.endsWith("/"))p+="index.html";const h=fs.readFileSync(p,"utf8");const n=(h.match(/<h1[\s>]/g)||[]).length;const c=(h.match(/rel="canonical" href="([^"]*)"/)||[])[1];if(n!==1||/noindex/i.test(h)||c!==m[1])console.log(p,n,c)}'
# Rayas largas en texto visible de articulos (debe salir 0)
node -e 'const fs=require("fs");let n=0;for(const f of fs.readdirSync(".").filter(f=>/^articulo-.*\.html$/.test(f))){const t=fs.readFileSync(f,"utf8").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g," ");if(t.includes("—"))n++,console.log(f)}console.log("con raya larga:",n)'
```

Nota para el grafo de enlaces: contar solo `<a href>` (no `<link rel=canonical>`), quitar `<header>` y `<footer>`, resolver rutas absolutas `https://inglesconleo.com/...` como raiz del sitio y rutas relativas respecto a la carpeta de la pagina; el indice del glosario es `glosario-ingles/index.html` (no `glosario/index.html`).

---

## 11. Correcciones de datos conocidas (otros documentos desactualizados)
- DEVLOG.txt (entrada del sprint de activacion, 2026-10-14) dice que la vista `first_session_report` esta "NO aplicada, pendiente de OK": YA esta aplicada (version 20261014162700).
- DEVLOG del 2026-10-12 dice que 323 fichas no tienen enlace desde articulos/portada y 211 solo el indice; el conteo corregido de hoy es 195 solo-indice, 92 solo-otras-fichas, 49 con articulo (la auditoria anterior contaba solo rutas absolutas; los articulos usan rutas relativas).
- Comentarios en `upgrade-nudge-emails/index.ts` desfasados (ventana de `abandoned_signup` 30-180 min vs constantes 24-72 h; `long_term` "21 dias" vs 14): confiar en las constantes.
- Documentos anteriores hablan de 36 pruebas / 35 tests: hoy son 33 `.test.js` + 2 `.test.sql`.
- El DEVLOG dice "3 articulos con cache vieja" nunca: el hallazgo es nuevo (3 articulos sin `?v=` en `app.js` y `clases.js` sin `?v=`).
- Kokoro: documentos previos decian que no se podia ejecutar desde la sesion del agente; SI se puede (8.2).
