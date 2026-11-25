# Escalabilidad y costos de la app móvil

> Fecha: 2026-11-25 | Commit de referencia: 41d4d8e | Estado: Documento de planificación, la app NO está construida.
> Leyenda: [V] verificado en código o documentación oficial, [R] recomendación, [S] supuesto, [P] pendiente de verificar.
> Precios de tiendas y proveedores: consultados el 2026-11-25 segun las fuentes con URL de [ARCHITECTURE_DECISION.md](ARCHITECTURE_DECISION.md) seccion 11 y [PAYMENTS_AND_MEMBERSHIPS.md](PAYMENTS_AND_MEMBERSHIPS.md) seccion 13; la confianza (A alta, M media, B baja) se indica donde importa. Son volátiles: revisar antes de decidir.
> Documentos hermanos: [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md), [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md), [TESTING_AND_RELEASE.md](TESTING_AND_RELEASE.md).

## 1. Resumen para el dueño

- El sistema actual aguanta bien hasta unos 1.000 usuarios registrados. Con 10.000 aparece el primer techo real: la IA (unas 550 explicaciones al día en total, ver sección 6) [V, cálculo de AI-07].
- Con 100.000 usuarios los cuellos de botella son el candado global de `leo-ai`, el barrido completo de `profiles` por los correos y las lecturas sin paginar [V].
- El coste de infraestructura es bajo frente al ingreso estimado, siempre que el audio salga del servidor de la web y la IA tenga caché: a 1.000.000 de registrados, unos USD 3.200 al mes frente a USD 60.000 de ingreso bruto estimado (5 por ciento) [S].
- A 1.000 usuarios el ingreso estimado (USD 60 al mes) apenas cubre el coste (unos USD 34 al mes, 56 por ciento del ingreso): es una inversión, no un negocio, hasta unos 10.000 registrados [S].

## 2. Supuestos

Todos los supuestos son [S] y deben sustituirse por datos reales de GA4 y Supabase tras la beta. El precio del plan sale de `terminos.html` (USD 2 al mes) [V, H-15].

| Supuesto | Valor | Cómo se usa |
|---|---|---|
| MAU (activos al mes) | 35 por ciento de los registrados | Factura de Supabase por MAU, push, egress |
| DAU (activos al día) | 12 por ciento de los registrados | Consultas, IA, audio |
| Concurrentes en hora pico | 2 por ciento de los registrados | Consultas por segundo y conexiones |
| Llamadas a la API por DAU y día | 36 (6 al arrancar y 10 por sesión, 3 sesiones) | Consultas medias |
| Llamadas por segundo por usuario concurrente | 0,2 (una cada 5 s) | Consultas pico |
| Tamaño medio de respuesta de API | 3 KB | Egress de API |
| Sesiones guardadas | 3 KB por sesión, 3 sesiones por DAU, 20 días activos al mes por MAU | Almacenamiento de BD |
| Audio reproducido por DAU y día | 1 MB (30 mp3 de 35 KB, 57 MB entre 1642 archivos = 34,7 KB de media [V]) | Egress de audio |
| Miembros de pago | 3 por ciento de los registrados, USD 2 al mes | Ingreso bruto |
| Parte del ingreso por tiendas (MTR para RevenueCat) | 60 por ciento | Comisión de RevenueCat |
| Llamadas de IA por DAU y día | 1,0 (mezcla de miembros y prueba gratis) | Coste de IA |
| Invocaciones de Edge Functions por DAU y día | 3 (incluye `leo-ai`) | Cuota de Edge Functions |
| Usuarios con permiso de push | 50 por ciento del MAU, 0,7 avisos por día | Volumen de push |
| Correos | 4 por MAU al mes | Volumen de correo |

## 3. Escenarios de carga

Fórmulas: MAU = registrados x 0,35; DAU = registrados x 0,12; concurrentes = registrados x 0,02; consultas por segundo medias = DAU x 36 / 86.400; consultas por segundo pico = concurrentes x 0,2.

| Concepto | 1.000 | 10.000 | 100.000 | 1.000.000 |
|---|---|---|---|---|
| MAU [S] | 350 | 3.500 | 35.000 | 350.000 |
| DAU [S] | 120 | 1.200 | 12.000 | 120.000 |
| Concurrentes pico [S] | 20 | 200 | 2.000 | 20.000 |
| Consultas por segundo, media | 0,05 | 0,5 | 5 | 50 |
| Consultas por segundo, pico | 4 | 40 | 400 | 4.000 |
| BD, crecimiento por año (GB) = MAU x 0,18 MB x 12 | 0,8 | 7,6 | 75,6 | 756 |
| Egress de API al mes (GB) = DAU x 30 x 108 KB | 0,4 | 3,9 | 38,9 | 388,8 |
| Egress de audio al mes sin caché de dispositivo (GB) = DAU x 30 x 1 MB | 4 | 36 | 360 | 3.600 |
| Edge Functions al mes = DAU x 3 x 30 | 10.800 | 108.000 | 1.080.000 | 10.800.000 |
| Miembros de pago | 30 | 300 | 3.000 | 30.000 |
| Ingreso bruto al mes (USD) = miembros x 2 | 60 | 600 | 6.000 | 60.000 |
| Llamadas de IA al mes = DAU x 30 | 3.600 | 36.000 | 360.000 | 3.600.000 |
| Avisos push al mes = MAU x 0,5 x 0,7 x 30 | 3.675 | 36.750 | 367.500 | 3.675.000 |
| Correos al mes = MAU x 4 | 1.400 | 14.000 | 140.000 | 1.400.000 |

Lectura: incluso a 1.000.000 de registrados, 50 consultas por segundo de media y 4.000 de pico son manejables con un compute grande de Postgres y conexiones agrupadas. Lo que rompe antes son los diseños en serie (sección 8), no el volumen bruto.

## 4. Arquitectura actual y su techo

| Componente | Estado actual [V] | Techo práctico |
|---|---|---|
| Web | GitHub Pages, repo público; `audio/` 57 MB, `data.js` 1,06 MB, `app.js` 602 KB sin minificar | Soporta lectura, pero el audio y los bancos pesados deben salir hacia CDN o Storage con caché [R]. El límite blando de tamaño y ancho de banda de Pages no se verificó [P] |
| Auth y Postgres | Supabase (plan por confirmar; el Free no tiene backups) | Free hasta 50.000 MAU; recomendado Pro desde el primer pago real (backups) [R] |
| Edge Functions | Deno, 24 funciones | 2 M de invocaciones incluidas en Pro [V, informe] |
| IA | Edge Function `supabase_functions/leo-ai.ts` sobre Cloudflare Workers AI (modelo Gemma indicado por la auditoría), 220 tokens de salida máximo, topes en `leo_ai_config` | Unas 550 explicaciones al día en total (sección 6) |
| Correo | Resend directo; Brevo solo reserva (`mail-relay`) | Nudges: techo de 14.400 correos al día por diseño (AI-15) |
| Push | No existe (0 resultados de `serviceWorker`, `fcm` en código, AI-13) | Construir desde cero |
| Tiendas | No existe | Cuentas Apple y Google |

LeoBot no es IA: es un árbol de botones que solo escribe en `leobot_reports` [V]; no genera coste de modelos.

## 5. Supabase por tier

Precios de https://supabase.com/pricing consultados 2026-11-25 (confianza A) [V, informe]:

| Concepto | Free | Pro | Team |
|---|---|---|---|
| Precio | USD 0 | desde USD 25 al mes | desde USD 599 al mes |
| MAU incluidos | 50.000 | 100.000 (extra USD 0,00325 por MAU) | 100.000 (igual) |
| Base de datos | 500 MB | 8 GB (USD 0,125 por GB extra) | igual |
| Egress | 5 GB | 250 GB (USD 0,09 por GB extra) | igual |
| Edge Functions | 500.000 invocaciones | 2 M (USD 2 por M extra) | igual |
| Storage | 1 GB | 100 GB (USD 0,0213 por GB extra) | igual |
| Realtime | 2 M mensajes, 200 conexiones | 5 M mensajes, 500 conexiones | igual |

Compute adicional al mes: Micro USD 10 (incluido en Pro con crédito), Small 15, Medium 60, Large 110, XL 210, 2XL 410, 4XL 960. Conexiones (directas / Supavisor): Micro 60/200, Small 90/400, Medium 120/600, Large 160/800, XL 240/1.000, 2XL 380/1.500, 4XL 480/3.000 (confianza A) [V, informe].

Tier recomendado por escenario [R]:

| Escenario | Tier | Compute [S] | Justificación |
|---|---|---|---|
| 1.000 | Pro | Micro (incluido) | Backups diarios obligatorios si hay pagos (B-09); el Free alcanzaría en MAU pero no en seguridad |
| 10.000 | Pro | Small | 40 consultas por segundo de pico; sobra margen |
| 100.000 | Pro | Large | 400 consultas por segundo de pico y 2.000 concurrentes; conexiones por Supavisor hasta 800 |
| 1.000.000 | Pro con compute 4XL, réplica de lectura y pruebas de carga; evaluar Team por soporte y SLA [P] | 4XL | 4.000 consultas por segundo de pico; la capacidad real debe medirse, no suponerse |

Los compute son hipótesis [S]; la decisión se toma con una prueba de carga (ver [TESTING_AND_RELEASE.md](TESTING_AND_RELEASE.md)), subiendo compute por CPU y conexiones, no por MAU.

## 6. Inteligencia artificial

### 6.1 Arquitectura actual: Cloudflare Workers AI

Hechos [V, PLATFORM_AUDIT.md, seccion 6, AI-07]:

- `leo-ai.ts` llama a Cloudflare Workers AI con un modelo Gemma, máximo 220 tokens de salida (200 en insight), temperatura 0,2, timeout de 10 s y esquema JSON cerrado.
- Coste de neurons deducido del código: 9.091 neurons por millón de tokens de entrada y 27.273 por millón de salida (`leo-ai.ts:550`), unos 12 a 17 neurons por llamada. Uso 14,5 neurons como media.
- Topes en `leo_ai_config`: `user_daily_limit` 100, `global_daily_limit` 1.500, `neuron_budget` 8.000, prueba gratis 5 créditos, bolsa diaria de prueba 400 y 2.500 neurons. Los CHECK impiden subir `neuron_budget` y `global_daily_limit` por encima de 10.000 (AI-07).
- Techo real: 8.000 / 14,5 = unas 552 explicaciones al día en todo el sitio (el tope de 1.500 nunca se alcanza). La prueba gratis tiene techo de unas 170 al día.
- Conclusión: a 10.000 registrados, la demanda estimada es 1.200 llamadas al día, el doble del techo [S contra V]. Con 1.000.000 la IA estaría apagada casi todo el día.

Costo mensual con tarifa de Cloudflare de USD 0,011 por 1.000 neurons [P: tarifa vigente no verificada]. Fórmula: llamadas x 14,5 / 1.000 x 0,011.

| | 1.000 | 10.000 | 100.000 | 1.000.000 |
|---|---|---|---|---|
| Llamadas al mes | 3.600 | 36.000 | 360.000 | 3.600.000 |
| Neurons al mes | 52.200 | 522.000 | 5.220.000 | 52.200.000 |
| Costo USD al mes | 0,6 | 5,7 | 57 | 574 |

Cambios necesarios para escalar [R]: presupuesto en USD en lugar de neurons, retirar los CHECK de 10.000, caché compartida por hash de ejercicio y respuesta (AI-08), contadores sin fila caliente (AI-09), enviar `itemId` y reconstruir el prompt en servidor (AI-10).

### 6.2 Escenario alternativo: modelos Claude (NO es la realidad actual)

Decisión pendiente: cualquier cambio de proveedor de IA no está tomado. Precios de https://platform.claude.com/docs/en/about-claude/pricing consultados 2026-11-25 (confianza A) [V, informe]: Haiku 5.5 USD 0,10 por millón de tokens de entrada y 0,50 de salida; Sonnet 5.5 USD 2 y 10. Los modelos 4.7 o posteriores producen cerca de 30 por ciento más tokens por el mismo texto; no incluido aquí.

Supuesto [S] del informe: 1.500 tokens de entrada y 300 de salida por llamada. Fórmula por llamada: Haiku 5.5 = 0,0015 x 0,10 + 0,0003 x 0,50 = USD 0,0003; Sonnet 5.5 = 0,0015 x 2 + 0,0003 x 10 = USD 0,006.

| Costo USD al mes | 1.000 | 10.000 | 100.000 | 1.000.000 |
|---|---|---|---|---|
| Cloudflare (actual) | 0,6 | 5,7 | 57 | 574 |
| Haiku 5.5 | 1 | 11 | 108 | 1.080 |
| Sonnet 5.5 | 22 | 216 | 2.160 | 21.600 |
| Haiku 5.5 con caché que evita el 80 % [S, AI-08] | 0,2 | 2 | 22 | 216 |

Lectura: Haiku cuesta del orden de dos veces el modelo actual, y Sonnet unas 38 veces. Si se cambia de proveedor, el criterio es la calidad pedagógica verificada, no solo el precio; Sonnet solo para correcciones complejas y con tope por usuario [R].

## 7. Push, correo, tiendas

### 7.1 Push

FCM no declara precio en su documentación; cuota por proyecto de 600.000 mensajes por minuto, límites por dispositivo Android de 240 por minuto y 5.000 por hora (confianza A). APNs no tiene cuota pública verificada (confianza B) [V, informe]. Expo Push: 600 notificaciones por segundo por proyecto, sin SLA, precio no indicado. OneSignal: gratis hasta 1.000 MAU móviles; desde USD 19 al mes más USD 0,012 por MAU móvil.

| | 1.000 | 10.000 | 100.000 | 1.000.000 |
|---|---|---|---|---|
| Avisos al mes (sección 3) | 3.675 | 36.750 | 367.500 | 3.675.000 |
| FCM y APNs directos desde Edge Functions con cola, USD | 0 más invocaciones | 0 | 0 | 0 (más compute de la cola) [S] |
| OneSignal, USD = MAU x 0,012 | 0 (gratis) | 42 | 420 | 4.200 |

El informe estima 12.000 USD al mes a 1.000.000 de MAU móviles [V, cálculo del informe]; con 350.000 MAU el cálculo es USD 4.200. A escala conviene FCM y APNs directos con cola propia [R]. Un aviso masivo de 3,7 millones de mensajes al mes equivale a 120.000 diarios: la cola debe enviar por lotes y por zona horaria del usuario (AI-14).

### 7.2 Correo

Precios de Resend o Brevo no verificados [P]: el coste es `correos x tarifa`, que queda como incógnita en las tablas. Volumen estimado: 1.400, 14.000, 140.000 y 1.400.000 correos al mes. Hoy el diseño tiene techo de 14.400 correos diarios (AI-15) y el recordatorio de racha envía solo cientos por corrida (AI-14) [V]. Con push como canal principal de recordatorios, el correo baja a transaccional y de bienvenida [R].

### 7.3 Tiendas y comisiones

| Concepto | Valor | Confianza |
|---|---|---|
| Cuenta Apple Developer | USD 99 al año (8,25 al mes) | A |
| Cuenta Google Play | USD 25 pago único | A |
| Apple, comisión | 30 por ciento el primer año de suscriptor, 15 desde el segundo; 15 por ciento con Small Business Program si ingresos de tienda no superan USD 1 M | A |
| Google, suscripciones | 15 por ciento, y 10 por ciento más 5 por ciento de facturación en EEUU, Reino Unido y EEE desde 2026-06-30 | M |
| RevenueCat | Gratis hasta USD 2.500 de MTR al mes; luego 1 por ciento del MTR | A |
| Adapty (alternativa) | Gratis hasta USD 5.000 de MTR; luego 1 por ciento | A |

Cálculo de comisión de tienda por escenario con 60 por ciento del ingreso por tiendas [S] y 15 por ciento [R]: 1.000 = USD 5,4; 10.000 = 54; 100.000 = 540; 1.000.000 = 5.400. Esta comisión reduce el ingreso pero no es coste de infraestructura. RevenueCat: MTR = ingreso x 0,6; con la lectura conservadora de 1 por ciento sobre todo el MTR cuando supera USD 2.500, el costo es 0, 0, 36 y 360 USD al mes (si el 1 por ciento aplica solo al exceso, es menor) [P: aclarar con el contrato].

Las tarifas de EEUU por enlace externo y las reglas por país son inestables (litigio Epic, informe de tiendas): no basar el modelo de negocio en un 0 por ciento permanente [V, informe].

## 8. Costo mensual estimado por escenario

Todas las cifras en USD, [S] salvo precios de lista. Excluye correo (tarifa no verificada) y la comisión de tiendas (sección 7.3). Fórmulas:

- Supabase base = 25 (Pro)
- Compute = lista de la sección 5
- MAU extra = max(0, MAU - 100.000) x 0,00325
- Egress extra = max(0, egress API + egress audio - 250) x 0,09 (si el audio se sirve desde Supabase)
- BD extra = max(0, GB de BD acumulados en el primer año - 8) x 0,125
- Edge extra = max(0, invocaciones - 2.000.000) / 1.000.000 x 2
- IA = sección 6.1
- RevenueCat = sección 7.3
- Apple = 8,25

| Partida | 1.000 | 10.000 | 100.000 | 1.000.000 |
|---|---|---|---|---|
| Supabase Pro | 25 | 25 | 25 | 25 |
| Compute | 0 | 15 | 110 | 960 |
| MAU extra | 0 | 0 | 0 | 812,5 |
| Egress extra (audio en Supabase) | 0 | 0 | 13,4 | 336,5 |
| BD extra | 0 | 0 | 8,4 | 93,5 |
| Edge extra | 0 | 0 | 0 | 17,6 |
| IA (Cloudflare) | 0,6 | 5,7 | 57,4 | 574,2 |
| RevenueCat | 0 | 0 | 36 | 360 |
| Cuenta Apple | 8,25 | 8,25 | 8,25 | 8,25 |
| Push con FCM y APNs directos | 0 | 0 | 0 | 0 |
| Total aproximado | 34 | 54 | 258 | 3.188 |
| Total con audio por CDN sin coste de egress de Supabase | 34 | 54 | 245 | 2.851 |
| Ingreso bruto estimado | 60 | 600 | 6.000 | 60.000 |
| Total como porcentaje del ingreso | 57 % | 9 % | 4,3 % | 5,3 % |

Sensibilidades a 1.000.000 de registrados:

| Variante | Efecto |
|---|---|
| Todos los registrados activos (MAU = 1.000.000, peor caso del informe) | MAU extra = (1.000.000 - 100.000) x 0,00325 = USD 2.925, total cercano a USD 5.300 |
| IA con Haiku 5.5 sin caché | +USD 506 sobre Cloudflare (1.080 frente a 574) |
| IA con Sonnet 5.5 sin caché | +USD 21.026 (21.600 frente a 574): inviable sin caché y topes |
| OneSignal en vez de FCM directo | +USD 4.200 (calculo con 350.000 MAU moviles, es decir 1M de registrados al 35 %; con 1M de MAU moviles serian unos USD 12.000, ver S5 en RISKS_AND_OPEN_QUESTIONS.md) |
| Audio con caché en el dispositivo (descarga única de 57 MB por instalación) | Egress de audio proporcional a instalaciones nuevas, no a DAU: por ejemplo, 100.000 instalaciones nuevas al año x 57 MB = 5,7 TB al año, unos 475 GB al mes |

El orden de magnitud del informe de tiendas para 1M MAU (USD 3.500 a 5.000 sin push ni IA) es coherente con el total anterior [V, informe; cálculo propio].

## 9. Cuellos de botella

| # | Cuello de botella | Evidencia [V] | Síntoma | Solución [R] | Umbral |
|---|---|---|---|---|---|
| 1 | Candado global de `leo-ai` | `leo_ai_reserve` hace `select ... for update` sobre una fila de `ai_usage_daily` (`supabase_functions/leo-ai.sql:95`) y `leo_ai_begin` borra filas de más de 24 h en cada llamada (AI-09) | Peticiones de IA en cola | Contadores por shard o Redis; limpieza por cron; caché por hash antes de reservar | Más de unas 5 a 10 llamadas de IA por segundo [S] |
| 2 | Techo de neurons y CHECK | `neuron_budget` máximo 10.000 (AI-07) | IA apagada por presupuesto | Presupuesto en USD, plan de pago | Más de unas 550 llamadas al día |
| 3 | Barrido de `profiles` | `upgrade-nudge-emails.ts` pagina todas las filas cada 30 minutos con `.range(page * 1000 ...)` (líneas 600, 682, 2640) y `MAX_PER_RUN = 300` (línea 450) | Lectura O(n) cada 30 min y correos atrasados | Disparadores por evento y cola con `email_send_log` (AI-15) | Más de unos 20.000 perfiles [S] |
| 4 | Recordatorio de racha en serie | `streak-reminder-email.ts` con `TIME_BUDGET_MS = 100_000`, una consulta por usuario, zona horaria fija (AI-14) | Solo cientos de correos por corrida | Cola de trabajos y hora local por usuario | Más de unos 1.000 candidatos diarios [S] |
| 5 | `getMistakeStats` y `syncProgressFromCloud` sin paginar | `backend.js:540-543` (`select(...).eq('user_id', ...)` sin `range`) y `backend.js:401-403`; PostgREST suele cortar en 1.000 filas [F-01, el valor depende de la configuración: P] | Errores o sesiones recientes ausentes en silencio | Paginar con `range`, cursor por fecha, sincronización incremental | Más de 1.000 filas por alumno |
| 6 | Audio estático | 57 MB, 1642 mp3 servidos desde GitHub Pages; una petición HEAD por bloque en `leo-voz.js` (F-16) | Ancho de banda y arranque lento en 3G | CDN o Storage con caché largo, manifiesto de audio, descarga offline por paquetes | Más de unos 10.000 DAU o 100 GB de tráfico al mes [S] |
| 7 | `app.js` y `data.js` sin minificar | 602 KB y 1,06 MB en cada página (F-11) | Carga lenta en el teléfono | Módulos, división por banco, minificación | Antes de la beta |
| 8 | Duplicación de funciones y despliegue manual | B-08, H-12 | Redeploy revierte protecciones | Un árbol, CI | Antes de tocar producción |
| 9 | Crecimiento de tablas | `progress_sessions` y `mistake_stats` crecen unos 0,18 MB por MAU y mes [S] | BD de cientos de GB a 1.000.000 | Archivo de `results` antiguos, particionado, compactación | Más de 100 GB [S] |
| 10 | Cuota diaria gratis en cliente | B-10, H-08 | Fuga de conversión | RPC servidor | Antes de monetizar en tiendas |

## 10. Decisiones tempranas y decisiones aplazables

Tempranas (cambiarlas después es muy caro) [R]:

| Decisión | Por qué ahora |
|---|---|
| Modelo de datos `entitlements` multi-fuente y tabla `webhook_events` | Toda la lógica de pago, soporte y restauración depende de ello |
| Contenido premium solo en servidor | Un paquete publicado ya no se retira de los dispositivos |
| Identificador de ejercicio estable (`itemId`) para IA y caché | Habilita caché compartida y evita proxy libre |
| Autenticación: Sign in with Apple, deep links, sesiones multidispositivo | Cambiar la identidad de los usuarios después duplica cuentas |
| Contrato de API versionado (nombres de funciones, `min_app_version`) | Las versiones antiguas de la app siguen vivas durante meses |
| Cola de notificaciones con zona horaria por usuario | Evita reescribir los correos y el push |
| Paginación y sincronización incremental | Los clientes viejos heredan el protocolo |
| Audio en Storage o CDN con manifiesto | Evita instalar 57 MB dentro del paquete |

Aplazables hasta tener datos [R]:

| Decisión | Se revisa cuando |
|---|---|
| Compute de Postgres, réplicas de lectura, plan Team | La prueba de carga o la CPU lo pidan |
| Proveedor de IA y modelo | Se mida calidad y costo reales con tráfico |
| Repetición espaciada, widgets, speaking nativo | Después del lanzamiento (Fase 6) |
| Particionado de tablas grandes | La BD supere 100 GB |
| Proveedor de push gestionado frente a FCM directo | MAU móviles superen 10.000 |
| Marketplace de precios por país | Datos de conversión por región |
| Cambio de framework (Expo) | Solo si el spike falla (decisión D2) |

## 11. Umbrales para escalar

| Señal | Umbral [S] | Acción |
|---|---|---|
| MAU de Supabase | Supera 80.000 | Presupuestar el cargo por MAU extra y revisar plan |
| CPU de Postgres sostenida | Más de 70 por ciento durante 15 minutos | Subir un escalón de compute |
| Conexiones Supavisor | Más de 70 por ciento del límite del tier | Subir compute o reducir clientes por consulta |
| Egress mensual | Más de 200 GB | Mover audio a CDN y caché |
| Llamadas de IA al día | Más de 400 con tope de 552 | Quitar CHECK, plan de pago, caché |
| Gasto de IA | Más de 5 por ciento del ingreso | Caché, modelo más barato, límites por plan |
| Cola de correos o push | Retraso medio de más de 1 hora | Más trabajadores por lotes, segmentación |
| Errores 5xx | Más de 1 por ciento de las peticiones | Revisar índices y consultas lentas |
| Tamaño de BD | Más de 6 GB en Pro | Archivo o plan de almacenamiento |
| Ingresos de tienda en Apple | Cerca de USD 1 M | Revisar Small Business Program (límite de 15 por ciento) |

## 12. Pendiente de verificar

Tarifa vigente de Workers AI y asignación gratuita, precios de correo (Resend y Brevo), límites blandos de GitHub Pages, aplicación exacta del 1 por ciento de RevenueCat, precio de PITR y de réplicas de lectura en Supabase, límite real de filas de PostgREST en el proyecto, plan actual de Supabase en producción, precios de CDN o R2 para audio, precio de TTS nuevo (el audio actual es pregenerado con `tools/generar_audios.py` y es el camino más barato [V, informe]), reglas de tiendas para Brasil y Corea.
