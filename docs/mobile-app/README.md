# Proyecto app movil de Ingles con Leo: punto de entrada

| Campo | Valor |
|---|---|
| Fecha | 2026-11-25 |
| Commit de referencia | 41d4d8e |
| Estado | Documento de planificacion, la app NO esta construida |

Esta carpeta es la planificacion de una app movil (iOS y Android) para Ingles con Leo. No contiene codigo de la app. No se modifico codigo de produccion, base de datos, pagos ni configuracion. El `DEVLOG.txt` de la raiz es del sitio web; el `DEVLOG.md` de esta carpeta es solo del proyecto movil.

## Leyenda de etiquetas

| Etiqueta | Significado |
|---|---|
| [V] | Verificado en el codigo del repo o en documentacion oficial |
| [R] | Recomendacion de este proyecto, no un hecho |
| [S] | Supuesto o estimacion propia (costos, escalas, esfuerzo) |
| [P] | Pendiente de verificar (depende de produccion, de un proveedor o de una fecha futura) |

En las tablas de hallazgos, `V*` significa que la linea citada se releyo al consolidar.

## Indice de los 15 documentos

| # | Documento | Contenido en una linea |
|---|---|---|
| 1 | [README.md](README.md) | Este indice, leyenda, estado y resumen |
| 2 | [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) | Como esta construida la plataforma hoy, con diagramas y discrepancias con otros documentos |
| 3 | [PLATFORM_AUDIT.md](PLATFORM_AUDIT.md) | Todos los hallazgos B, H, F y AI por area, con prioridad P0-P3 y verificacion |
| 4 | [MOBILE_READINESS.md](MOBILE_READINESS.md) | Que se reutiliza, adapta, refactoriza o construye; veredicto y bloqueadores |
| 5 | [ARCHITECTURE_DECISION.md](ARCHITECTURE_DECISION.md) | Decision de arquitectura: Capacitor, alternativa Expo, opciones descartadas, plataforma unica |
| 6 | [MOBILE_PRODUCT_SPEC.md](MOBILE_PRODUCT_SPEC.md) | Especificacion funcional: pantallas, MVP frente a posterior, criterios de aceptacion |
| 7 | [DATA_AND_API_CONTRACTS.md](DATA_AND_API_CONTRACTS.md) | Tablas, RPC y API movil propuesta, sincronizacion y eventos |
| 8 | [PAYMENTS_AND_MEMBERSHIPS.md](PAYMENTS_AND_MEMBERSHIPS.md) | Stripe, PayPal, Mercado Pago, compras in-app, `entitlements`, politicas de tiendas |
| 9 | [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md) | Amenazas, controles, privacidad, consentimiento, borrado de cuenta |
| 10 | [SCALABILITY_AND_COSTS.md](SCALABILITY_AND_COSTS.md) | Escenarios de 1k a 1M usuarios, costos y cuellos de botella |
| 11 | [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) | Fases 0 a 6 con tareas, dependencias, riesgos, despliegue gradual y rollback |
| 12 | [TESTING_AND_RELEASE.md](TESTING_AND_RELEASE.md) | Estrategia de pruebas y publicacion en App Store y Google Play |
| 13 | [RISKS_AND_OPEN_QUESTIONS.md](RISKS_AND_OPEN_QUESTIONS.md) | Riesgos, preguntas abiertas, supuestos y lo no verificable |
| 14 | [AI_HANDOFF.md](AI_HANDOFF.md) | Traspaso para agentes de IA: contexto, prompt de arranque y comprobaciones |
| 15 | [DEVLOG.md](DEVLOG.md) | Bitacora del proyecto movil, separada del DEVLOG.txt del sitio |

## Estado

- Fase actual: planificacion; Fase 0 (prerrequisitos de plataforma) sin iniciar. [V]
- Veredicto: la plataforma NO esta lista para publicar app todavia; hay 8 bloqueadores. [V] Detalle en [MOBILE_READINESS.md](MOBILE_READINESS.md).
- Ninguna migracion se ha creado ni aplicado; la tabla `entitlements` es una recomendacion, no existe. [V]

## Como leer

1. Dueno no tecnico: este README, luego el veredicto y los bloqueadores de [MOBILE_READINESS.md](MOBILE_READINESS.md).
2. Quien decide prioridades: [PLATFORM_AUDIT.md](PLATFORM_AUDIT.md), columnas Gravedad y Prio.
3. Agente de IA que implementa: [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) (rutas reales) y luego el hallazgo concreto por ID en [PLATFORM_AUDIT.md](PLATFORM_AUDIT.md).
4. Los IDs (B-, H-, F-, AI-) se conservan de las auditorias originales y no cambian; las entradas deduplicadas estan en la seccion 8 de la auditoria.
5. Antes de ejecutar cualquier tarea: correr `git log 41d4d8e..HEAD` sobre `backend.js`, `app.js`, `supabase_functions/`, `supabase/migrations/` y `miembros.html` para detectar cambios desde 2026-11-25.

## Resumen en 10 lineas

1. Hoy: sitio estatico en GitHub Pages con Supabase; sin build, sin modulos, sin offline, sin push. [V]
2. Contenido: 1589 ejercicios, 11 cursos de 5 lecciones, 1642 audios; casi todo el premium es publico en un repo publico. [V]
3. Pagos: Stripe, PayPal y Mercado Pago sobre un unico boolean `is_member`; sin guardas contra doble cobro ni manejo de reembolsos. [V]
4. Cuenta: registro sin confirmar correo, sesion unica, sin borrado de cuenta, sin consentimiento de analitica. [V]
5. Leo AI: Cloudflare Workers AI con topes que no escalan; LeoBot no es IA. [V]
6. Recomendacion principal: Capacitor con interfaz movil propia y plugins nativos, tras refactorizar `app.js` a un nucleo compartido. [R]
7. Alternativa: Expo / React Native con paquete TypeScript compartido si el spike falla o Apple rechaza por 4.2. [R]
8. Backend unico Supabase con tabla `entitlements` multi-fuente; compras in-app con RevenueCat; la web sigue con sus pasarelas. [R]
9. Antes de construir: Fase 0 de plataforma (8 bloqueadores) y un spike de 1-2 semanas con puerta de decision. [R]
10. Reglas y precios de tiendas cambian: consultados el 2026-11-25; revisar al lanzar. [P]
