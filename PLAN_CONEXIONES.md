# Plan de Conexiones

Auditoría del 14 de noviembre de 2026. Complementa `MAPA_CONEXIONES.md` (qué hay y cómo se conecta) y los dos inventarios CSV. Es un plan: no se implementó ningún cambio funcional. Cada fase es pequeña, tiene pruebas y se puede revertir con un solo `git revert`.

## 1. Resumen

El sitio tiene mucho más contenido conectado de lo que parece: el registro de temas (`temas.js`) ya une clases, fichas, cursos, quizzes y práctica de miembros, y 0 de los enlaces HTML están rotos. El problema no es de enlaces rotos, es de promesas. El botón "Practicar este tema" aparece en varios lugares y solo funciona bien para miembros que están en el nivel correcto. Para visitantes y cuentas gratis, que son la mayoría de quienes llegan, el destino es la práctica general o una página de miembros que los devuelve al inicio de sesión sin explicación.

Lo mejor que ya existe y conviene reutilizar, no reescribir:

- `contentForTema()` en `app.js`: decide el destino de práctica de un tema para miembros.
- `freeMemoryBoost()` en `app.js`: ya enfoca la sesión gratis en un tema respetando el largo de sesión y el límite diario.
- `practiceLabel()` en `aprender.js`: ya aplica la regla de honestidad (dice "este tema" solo si es cierto).
- El registro `temas.js` con sus pruebas (`temas.test.js`, `conexion-recursos.test.js`).

<!-- GENERADO:cifras -->
- Temas de temas.js: 79. Con ejercicios gratis: 0. Solo con ejercicios de Miembros: 14. Sin ejercicios: 1.
- Temas cuya practica de miembros existe solo en algunos niveles (en los demas el Plan usa el nivel mas cercano y lo avisa, sin cambiar el nivel guardado): 74 de 79.
- Tarjetas del inicio (mini-lecciones.js): 95. Con ejercicios gratis del mismo tema (nivel tema): 82; del mismo tema exacto (mismo nombre de la tarjeta): 64. Sin ningun ejercicio gratis del tema exacto: 31.
- Que abre el boton de cada tarjeta del inicio: tema 76, clase 19 (tema = practica gratis de ese tema; clase = su explicacion; general = practica de gramatica en general, y el texto del boton lo dice).
- Enlaces HTML con destino o ancla inexistente: 0. Enlaces HTML que prometen un tema y abren la practica general: 0. Paginas publicas que enlazan a paginas de miembros sin explicarlo: 0.
- Temas con 6 ejercicios gratis o menos (una sesion gratis normal es de 6 a 8): 34. Temas con ejercicios gratis en un solo nivel: 39.
- Temas sin clase ni ficha del glosario (no hay explicacion que ofrecer): 8. Temas con clase: 32. Con ficha: 43.
<!-- /GENERADO:cifras -->

## 2. Una solución mejor que arreglar enlaces uno por uno

Hay unos 1.350 enlaces a `practica.html` solo en el glosario, y los textos y destinos se construyen en al menos cinco lugares distintos del JavaScript. Arreglarlos a mano no escala ni se mantiene. La propuesta es un resolver único de práctica por tema:

`practiceLinkFor(temaId, usuario)` devuelve siempre `{ href, texto, tipo, nota }`, donde `tipo` es uno de:

| tipo | cuándo | texto del botón |
|---|---|---|
| tema | el usuario puede practicar ese tema ahora (miembro con ejercicios en su nivel, o cuenta gratis/visitante con ejercicios gratis del tema) | "Practicar este tema" |
| habilidad | solo se puede ofrecer la práctica general de la habilidad | "Practicar gratis" o "Practicar [habilidad]" |
| explicacion | no hay práctica disponible para su tipo de usuario pero sí clase o ficha | "Leer la explicación" |
| miembros | existe, pero es de miembros: se dice claramente | "Esto se practica con membresía" |

Todas las superficies (tarjeta del inicio, quiz de artículo, glosario, resumen de sesión, Academia, Leo AI) llaman a esa función. La regla de honestidad queda en un solo lugar y se prueba con una sola prueba automática: el texto "este tema" solo sale cuando `tipo` es `tema`. Es lo que `aprender.js` ya hace en pequeño. Se construye encima de `contentForTema()` sin reemplazarla.

La práctica gratis por tema sería un parámetro opcional `practica.html?tema=<id>`. Si falta, es inválido o el tema no tiene ejercicios gratis, la página funciona exactamente como hoy. Si es válido, la sesión usa la misma mecánica de `freeMemoryBoost()`: pone primero los ejercicios de ese tema y completa con lo normal, con el mismo largo de sesión y el mismo conteo del límite diario.

## 3. Problemas encontrados y prioridades

Escala: impacto en alumnos y retención, dificultad y riesgo (alto, medio, bajo). Los identificadores D y R son del inventario.

| # | Problema | Quién lo sufre | Impacto | Dificultad | Riesgo | Depende de |
|---|---|---|---|---|---|---|
| P1 | La tarjeta del inicio (D01) promete un tema y abre la práctica general. Además 36 de 101 tarjetas son de temas sin ejercicios gratis del tema exacto. | visitantes, cuentas gratis, miembros | alto: es la primera impresión y lo vio Leo | baja (filtrar tarjetas) y media (enfocar de verdad) | bajo | resolver (P4), `?tema=` gratis (P5) |
| P2 | Los quizzes de artículos (D02) ofrecen "Practicar este tema" a todos, y para visitantes y cuentas gratis termina en `miembros.html` sin explicación (R02). | visitantes, cuentas gratis | alto: ocurre justo cuando el alumno falló y quería reforzar | baja | bajo | ninguna (arreglo mínimo), resolver para el arreglo completo |
| P3 | Para miembros, D03, D04 y D06 con otro nivel: el Plan no avisa que no puede enfocar el tema. 70 de 79 temas tienen práctica de miembros en solo algunos niveles. | miembros | medio-alto: retención de quien paga | media | medio (toca la lógica del Plan; mejor solo avisar, no cambiar la selección) | resolver |
| P4 | Los destinos de práctica se construyen en al menos 5 lugares con reglas distintas. | todos (mantenimiento) | alto a largo plazo | media | medio | ninguna |
| P5 | No hay práctica gratis por tema: 65 temas tienen ejercicios gratis y ningún botón llega a ellos. | visitantes y cuentas gratis | alto: es el embudo hacia la membresía | media-alta | medio (toca el motor gratis y el límite) | resolver, pruebas del piloto |
| P6 | Academia demo (D10): "Practicar con otros ejercicios" abre la práctica general. | cuentas gratis en la demo de TO BE | bajo | baja | bajo | ninguna |
| P7 | El curso `wh` (Palabras de pregunta) está abierto en el código y, según el DEVLOG, cerrado en Supabase. Los errores de ese tema ofrecen un curso que podría estar cerrado. | miembros y gratis | medio | baja (comprobar y alinear) | bajo | decisión de Leo |
| P8 | 4 temas de gramática con ejercicios sin familia en `temas.js`: el Plan no los enfoca. | miembros | bajo-medio | baja | bajo | ninguna |
| P9 | 21 temas sin clase ni ficha: no hay explicación que ofrecer en el resumen de errores. | todos | medio | alta (contenido) | bajo | decisión de prioridades |
| P10 | `there-is-are` tiene curso, clase y quiz, pero todos sus ejercicios son de Miembros: la cuenta gratis no tiene nada que practicar de ese tema. | cuentas gratis | medio | decisión de negocio | bajo | decisión de Leo |

## 4. Contenidos por construir

Lista actualizada automáticamente:

<!-- GENERADO:faltantes -->
- Sin clase ni ficha (8): `cuantificadores`, `vocab-confusas`, `vocab-trabajo`, `vocab-viajes`, `vocab-compras`, `vocab-vida-diaria`, `listening-conversaciones`, `listening-condicionales`
- Sin ejercicios (1): `cuantificadores`
- Gramatica con ejercicios pero sin familia en temas.js, asi que el Plan no puede enfocarlos (0): 
- Solo con ejercicios de Miembros, nada gratis (14): `your-vs-youre`, `to-too-two`, `lose-vs-loose`, `say-vs-tell`, `actually-currently`, `pasado-continuo`, `fewer-vs-less`, `contables-incontables`, `modales-posibilidad`, `pasado-regulares`, `causativos`, `preposiciones-movimiento`, `pronombres`, `there-is-are`
- Con curso en el codigo pero cerrado: ninguno
<!-- /GENERADO:faltantes -->

Prioridad de una explicación para esos temas (generado; sin crear contenido innecesario):

<!-- GENERADO:prioridad -->
| Tema | Tarjetas del inicio que lo prometen | Ejercicios | Prioridad de una explicacion |
|---|---|---|---|
| `vocab-confusas` | 0 | 68 | Baja (su propia seccion ya practica el tema) |
| `vocab-vida-diaria` | 0 | 24 | Baja (su propia seccion ya practica el tema) |
| `vocab-trabajo` | 0 | 20 | Baja (su propia seccion ya practica el tema) |
| `listening-condicionales` | 0 | 17 | Baja (su propia seccion ya practica el tema) |
| `listening-conversaciones` | 0 | 10 | Baja (su propia seccion ya practica el tema) |
| `vocab-viajes` | 0 | 8 | Baja (su propia seccion ya practica el tema) |
| `vocab-compras` | 0 | 8 | Baja (su propia seccion ya practica el tema) |
| `cuantificadores` | 0 | 0 | Ninguna (primero faltan ejercicios) |

Criterio: primero los temas de gramatica que una tarjeta del inicio ya promete y que tienen ejercicios; el tamano recomendado es una ficha corta del glosario, no una clase completa. Vocabulario y listening tienen su propia seccion.
<!-- /GENERADO:prioridad -->

## 5. Plan por fases

Todas las fases son independientes salvo donde se indica. Cada una se puede publicar sola y revertir sola.

Fase 0: este documento. Hecha. Auditoría, mapa, inventario y escáner. Sin cambios en el sitio.

Fase 1: promesas honestas, sin motor nuevo. Impacto alto, dificultad baja, riesgo bajo.

- D02: a visitantes y cuentas gratis, el bloque de quiz muestra una práctica gratis honesta ("Practicar gratis") o la explicación, nunca una página de miembros. Un miembro no ve ningún cambio.
- D01: el generador de `mini-lecciones.js` agrega a cada tarjeta el id del tema y si tiene ejercicios gratis. Para visitantes y cuentas gratis solo rotan las tarjetas con práctica gratis disponible. El texto del botón pasa a "Practicar gratis" hasta que exista P5.
- D10: el texto de la demo gratis pasa a "Practicar gramática gratis".
- Pruebas: una por cada texto (nunca "este tema" cuando el destino es general) con los tres tipos de usuario, más la pasada de móvil.
- Reversión: un commit.

Fase 2: resolver único de práctica por tema (`practiceLinkFor`). Dificultad media, riesgo medio.

- Se construye sobre `contentForTema()` sin cambiar lo que hace para miembros. Se migra una superficie por vez, empezando por el quiz de artículo y el resumen de sesión.
- Para miembros con un tema sin ejercicios en su nivel, la superficie muestra honestamente "Practicar [familia]" o la explicación, en vez de prometer el tema.
- Pruebas: la matriz tema por tipo de usuario (visitante, cuenta gratis, miembro) con las 6 muestras del piloto.

Fase 3: práctica gratis por tema (`practica.html?tema=<id>`). Dificultad media-alta, riesgo medio. Depende de la fase 2 y de las decisiones de la sección 8.

- Reutiliza `freeMemoryBoost()`. Solo variantes abiertas a cuentas gratis y la muestra fija de Do/Does. Mismo largo de sesión, mismo conteo del límite (3 invitado, 6 cuenta). No cambia el límite ni el contador.
- 39 de los 65 temas con ejercicios gratis los tienen en un solo nivel, y 34 tienen 6 o menos. Por eso la sesión usa primero los del tema, completa con el nivel normal y dice cuántos ejercicios del tema hay, en vez de prometer una sesión entera del tema.
- Si el tema vive en otro nivel que el del usuario, se pregunta con un aviso ("Este tema está en nivel X") en vez de cambiarlo en silencio.
- Pruebas: `free-sessions`, `memoria-gratis`, `oferta-primera-sesion`, el e2e `free-cap` a 320, 360 y 375 px y una prueba nueva por tema.

Fase 4: extender a las plantillas grandes. Dificultad media, riesgo bajo si la fase 3 está probada.

- Glosario (339 fichas) y artículos: el enlace pasa de `?skill=` a `?tema=` donde el tema tiene ejercicios gratis. Se hace en el generador del glosario y en el script de la plantilla de artículos, no ficha por ficha.
- Aviso previo: el generador del glosario está protegido por `glossary-sync.test.js`; hay que correrlo en copia aislada primero.

Fase 5: contenido y medición.

- Fichas cortas para los temas sin explicación (sección 4), primero los más ejercitados.
- Eventos de analítica por tipo de destino (ya hay `reinforce_shown`, `leo_ai_next_clicked`, `academia_refuerzo_clic`) para medir cuál enlace lleva realmente a una sesión de ese tema.

## 6. Piloto propuesto antes de implementar

Seis temas representativos cubren todos los casos; se prueban con tres usuarios: visitante, cuenta gratis y miembro.

| Tema | Por qué |
|---|---|
| `by-until` | La tarjeta que vio Leo. Gratis en dos niveles, con ficha de glosario y sin clase. |
| `do-does` | Tiene de todo: clase, quiz de 10 preguntas, curso abierto, muestra gratis fija y variantes de miembros. |
| `in-on-at` | Clase, quiz de 20 preguntas y práctica en un solo nivel. Su curso existe pero está cerrado en el código. |
| `there-is-are` | Todos los ejercicios son de Miembros y tiene curso: el caso en que la interfaz debe explicar sin generar falsa expectativa. |
| `question-tags` | Gramática con ejercicios y sin familia: el Plan no puede enfocarla. |
| `vocab-viajes` | Vocabulario, sin explicación ni tarjeta en el inicio. |

Recorridos que se prueban por tema (tarjeta del inicio, ficha del glosario, quiz del artículo, resumen de sesión, enlace desde la Academia donde aplique):

- Visitante: nunca una página de miembros sin explicación; nunca "este tema" si abre la práctica general; el límite de 3 se respeta.
- Cuenta gratis: igual que visitante, con el límite de 6 y su memoria; el curso aparece como "con membresía" o como demo.
- Miembro: destino por tema solo si hay ejercicios en su nivel; si no, texto honesto. La guardia y la redirección de `practica.html` no cambian.

Cómo se prueba: la matriz en Node con el `app.js` real (como `conexion-recursos.test.js`), el e2e en Chromium móvil a 320, 360 y 375 px con la nube simulada (como `free-cap.browser.js`), y una última pasada en el sitio real con cuentas de prueba (para esto hace falta una cuenta gratis y una de miembro; el navegador integrado hoy tiene la sesión de Leo, que no se toca).

### Estado del piloto (rama `piloto-conexiones`, sin publicar)

Temas probados en el piloto: `by-until`, `presente-simple`, `your-vs-youre`, `cuantificadores`, `question-tags` y `vocab-confusas` (cubren: gratis en dos niveles, gratis en uno, solo miembros, sin ejercicios en ningún nivel, sin familia y vocabulario).

Hecho:

- Miembros (P3): el Plan usa el nivel más cercano que tenga ejercicios del tema (empate: el más fácil) cuando el nivel guardado no los tiene. Cada ejercicio queda marcado con su nivel real (`cl`), no cuenta para la sugerencia de nivel, el nivel guardado no cambia y la sesión lo avisa. Si el tema se agota, el relleno de su familia queda marcado y avisado. Sin ejercicios en ningún nivel o sin familia, el texto del botón deja de nombrar el tema.
- Tarjeta del inicio (P1): el botón dice lo que abre (`tema`, `clase` o `general`), decidido al generar `mini-lecciones.js`. Se descubrió que 6 tarjetas no tenían microexplicación y salían con el texto vacío; ya no salen.
- Práctica gratis por tema (P5): `practica.html?skill=grammar&tema=<id>`, mismos bancos, mismos límites; un miembro es llevado a su Plan de ese tema. Sin ejercicios gratis del tema, lo dice.
- Quizzes de artículos (P2), solo gramática: el enlace pasa por `practica.html?tema=`.

- Volver al tema tras crear cuenta o entrar (P11, limitación que ya existía en `main`): `?volver=` ahora conserva `skill`, `tema` y `level` con validación estricta (ver Mapa, sección 3). Cambios: `app.js` (`leoSafeVolver`, `leoVolverActual` y los enlaces), `miembros.html` (consumo tras registro, entrada y Google) y `practica.html` (no borra el tema al quitar `?cuenta=nueva`). No se tocó `backend.js`, ni autenticación, ni pagos, ni membresías.
- Residuo conocido, documentado y sin cambiar: los errores de otro nivel (`xt`) entran al repaso de errores del Plan general (hasta ~30% de la sesión, como cualquier error de "Mis errores"), sin marca `xt` ni `cl`, así que al responderlos de nuevo sí cuentan para el porcentaje por habilidad. Efecto acotado (hasta 3 de 9 ejercicios de una sesión). Si algún día se quiere cerrar: que `buildMistakePool` marque `xt` cuando el ejercicio sea de otro nivel que el guardado.

Pendiente: P2 en vocabulario y listening, P6, P7 (curso WH, sin tocar Supabase), P8 (las cuatro familias, por tocar el diagnóstico), P9 (fichas) y P10 (decisión de negocio).

Actualizacion 2026-11-21 (el piloto ya esta en `main`; fase 4 parcial):

- Clase -> ejercicio: 20 clases (`articulo-*.html`) con 3 o mas ejercicios gratis de su tema enlazan su boton "Practicar gratis" a `practica.html?skill=grammar&tema=<id>`. Las mantiene `node tools/conexiones/enlazar-articulos.js` (sin argumentos comprueba, con `--write` aplica) y la prueba `refuerzo-exacto.test.js`.
- Error -> refuerzo (visitante y cuenta gratis): el "Para reforzar" abre la practica gratis de ESE tema (nunca la general). Vocabulario, listening o un tema sin ejercicios gratis: queda la explicacion o el curso, sin boton de practica. Sin nada exacto que ofrecer, la fila no sale.
- Error -> refuerzo (miembro): si el tema solo tendria la practica general (sin familia, o sin ejercicios en ningun nivel), no se muestra el boton Practicar hacia `gramatica.html`. Con 2 o mas errores de un tema, ese tema va primero (ya era asi).
- Lo que falta queda en `REFUERZOS_FALTANTES.md` (generado con `node tools/conexiones/faltantes.js --write`): tema, ejemplo de un ejercicio y recurso a crear.
- Sigue pendiente: P2 en vocabulario y listening (ruta gratis por tema), P6, P7, P8 (4 temas sin familia), P9 (fichas) y P10 (decision de Leo).

## 7. Cómo se mantiene actualizado

- `node tools/conexiones/auditar.js --write` regenera `INVENTARIO_CONEXIONES.csv`, `INVENTARIO_TEMAS.csv` y los bloques GENERADO de los dos documentos. `node tools/conexiones/auditar.js` solo comprueba y falla si algo está viejo o roto.
- `tools/tests/conexiones.test.js` ejecuta esa comprobación: si alguien cambia `data.js`, `temas.js` o una plantilla de enlaces y no regenera, la prueba falla.
- Lo que se verifica solo: destinos y anclas de todos los enlaces HTML, clase, ficha y curso de cada tema, ejercicios gratis y de miembros por tema y nivel, y que las funciones de los destinos dinámicos sigan existiendo.
- Lo manual: `destinos-dinamicos.json` (los destinos construidos por JavaScript). Cada entrada tiene un texto de búsqueda que la prueba comprueba, así que si el código cambia la entrada queda marcada como desactualizada en vez de mentir.
- Regla de trabajo (misma que `mini-lecciones.js`): quien cambie contenido, temas o enlaces corre `--write` en la misma tarea e incluye los archivos generados en el commit. Es trabajo de Claude, no de Leo.

## 8. Decisiones para Leo antes de la fase 3

1. Las 36 tarjetas del inicio de temas sin ejercicios gratis: ¿se ocultan a visitantes y cuentas gratis (recomendado, es lo más honesto) o se muestran con un texto distinto que lleve a la explicación?
2. Práctica gratis por tema: ¿cuenta en el límite diario como cualquier otra práctica (recomendado, no cambia el modelo 3 más 3)?
3. Curso `wh`: ¿se abre en Supabase (`update public.academia_courses set enabled = true where course_id = 'wh'`) o se retira `question-words` de `ACADEMIA_COURSE_BY_TEMA`? Es una decisión tuya.
4. `there-is-are` y otros 12 temas solo de Miembros: ¿se queda así (es una decisión de monetización) o se abre una muestra gratis fija, como ya se hizo con Do/Does?
5. Contenidos por construir: ¿qué temas primero?

## 9. Lo que no se toca (condiciones innegociables)

No se reescriben los motores existentes. No se altera el límite diario, las calificaciones, las insignias ni el progreso. No se cambian pagos. No se renombran ids de temas, artículos ni cursos. No se crean enlaces ficticios: toda ruta nueva se verifica con el sitio real y con las pruebas antes de publicarse.
