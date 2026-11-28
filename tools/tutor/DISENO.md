# Riso, el asistente inteligente de Inglés con Leo: diseño y prototipo local

Identidad (regla permanente): Profe Leo es el profesor, el creador del método y la figura principal de Inglés con Leo. Riso es la mascota y el asistente inteligente de la academia: simpático, cercano, con personalidad propia, conversa, explica, bromea con moderación y acompaña al alumno, pero nunca se atribuye el papel de profesor, tutor ni maestro. Inglés con Leo es la academia y el método.

Estado: prototipo local completo y probado. Nada está en producción. No se usó ninguna IA de pago.

## 1. Qué hay hoy (infraestructura revisada)

- Edge Function `leo-ai` (Supabase) con modos `explain`, `writing`, `diagnosis`, `insight` y `trial_status`.
- Proveedor principal: Cloudflare Workers AI, modelo Gemma 4 26B A4B (`@cf/google/gemma-4-26b-a4b-it`, sin "thinking").
  Groq apagado; Gemini solo para administración.
- Controles que ya existen y se reutilizan: interruptor `enabled`/`public`, límite diario por alumno (100),
  límite global diario (1500), presupuesto diario de neuronas (8000), créditos de prueba para cuentas gratis (5),
  idempotencia por `request_id` (reintentos sin cobrar dos veces), respuestas limitadas a 220 tokens,
  solo se envían datos del ejercicio (nunca nombre ni correo), uso guardado solo como conteos.
- Las respuestas se guardan 24 h en `leo_ai_requests` solo para idempotencia y se borran solas.

Conclusión: no hace falta un segundo backend. Riso se agrega como un modo nuevo `chat` dentro de `leo-ai`.

## 2. Cómo responde Riso (sistema por capas)

| Capa | Qué resuelve | Cuesta | Dónde corre |
|---|---|---|---|
| 1 Filtro | vacío, muy largo, datos personales, abuso, intentos de cambiar reglas, temas sensibles, saludos, cuenta y pagos (→ Soporte), "¿eres Profe Leo?" | 0 | navegador (y se repite en el servidor) |
| 2 Herramientas exactas | números, años, ordinales, horas, fechas, 72 verbos irregulares, conjugación de verbos regulares comunes, 353 términos del glosario | 0 | navegador |
| 3 Preguntas frecuentes revisadas | 30 respuestas escritas a mano con variantes (do/does, much/many, in/on/at, presente perfecto...) | 0 | navegador |
| 4 Búsqueda | encuentra la guía del sitio más cercana (68 guías) y la adjunta a la respuesta | 0 | navegador |
| 5 Generativa | todo lo demás: frases concretas del alumno, situaciones reales, seguimientos | ~US$0,000114 por respuesta | Edge Function `leo-ai`, modo `chat` |

- La base de conocimiento (`riso/tutor/conocimiento.js`, 38 KB comprimido) se genera desde contenido público
  que ya existe (`node tools/tutor/generar_conocimiento.js`). No incluye contenido de cursos de miembros.
- pgvector y embeddings: NO hacen falta por ahora. Con 68 guías, 353 términos y 30 preguntas, la búsqueda por
  palabras es suficiente y gratis. Revisar cuando haya miles de piezas o cuando la tasa de "no encontré guía" supere
  el 40 % en métricas reales. Si llega ese día, `@cf/google/embeddinggemma-2` cuesta US$0,0017 por millón de tokens.
- Respuestas de la capa 5 llevan el aviso "Respuesta generada con IA. Puede tener errores." Las de capas 2 y 3 no,
  porque son exactas o revisadas por una persona.

## 3. Modos de acceso

- **Pregunta libre**: "Pregúntale a Riso" desde Inicio o Practicar, en su propio panel (nunca flota sobre el ejercicio).
- **Sobre el ejercicio**: botón dentro de la corrección de un ejercicio fallado. Envía solo tema, enunciado,
  respuesta del alumno y respuesta correcta. El botón "Explícame por qué" que ya existe se mantiene igual.
- Separación clara: **Profe Leo** crea las lecciones (persona real); **Riso** responde dudas (IA, lo dice cuando se le pregunta);
  **Soporte** resuelve cuenta y pagos (Riso deriva, nunca responde sobre cobros).

## 4. Controles de costo y abuso

Cliente (prototipo, `riso/tutor/riso-tutor.js`): máximo 400 caracteres; una pregunta abierta cada 1,5 s y 6 por minuto;
cuota diaria (miembro 30, gratis 3, visitante 0 abiertas; capas 1 a 4 ilimitadas); historial de 6 turnos;
deduplicación dentro de la sesión; caché solo de respuestas exactas o revisadas; presupuesto; reintento sin gastar cuota.

Servidor (propuesta, sin ejecutar): `tools/tutor/propuesta-migracion-riso-chat.sql` agrega `chat_enabled` (apagado),
cuotas propias del chat separadas de las explicaciones, tope global del chat y reutiliza el tope de neuronas.
El cliente nunca decide la cuota real: la decide el servidor.

## 5. Seguridad y privacidad

- Nunca se envían nombre, correo, progreso ni identificadores al modelo. Solo la pregunta, 6 turnos y, en modo ejercicio, los datos del ejercicio.
- Si el mensaje parece tener correo, teléfono, tarjeta o contraseña, NO se envía y se avisa.
- Las respuestas generadas para un alumno no se reutilizan para otro (probado). Solo se comparten respuestas de las capas 2 y 3.
- No se guarda el texto de las conversaciones en la base de datos. Las métricas son conteos por capa, sin texto.
  Nada de esto va a Analytics ni a Meta Pixel.
- Instrucciones del sistema (servidor): responder en español, 2 a 4 frases, con un ejemplo en inglés; si el tema no es inglés pero es educativo,
  responder breve y conectarlo con el inglés; nunca dar consejos médicos, legales o financieros; nunca hablar de precios ni de cuentas.
- Temas sensibles (autolesión): respuesta fija de apoyo sin modelo.

## 6. Costos (precios verificados el 27 nov 2026)

Workers AI: US$0,011 por 1.000 neuronas y 10.000 neuronas gratis al día. Gemma 4: US$0,10 por millón de tokens de entrada y US$0,30 de salida.
Respaldo Gemini 3.1 Flash-Lite: US$0,25 y US$1,50. Supuesto por respuesta: 600 tokens de entrada y 180 de salida
(≈10,4 neuronas, ≈964 respuestas gratis al día). Escenario base 40 preguntas por miembro al mes; alto 120.
Por capas, la IA responde el 45 % (pesimista 60 %). Cálculo reproducible: `node tools/tutor/costos.js`.

| Miembros | Por capas (base) | Por capas (alto) | Todo con IA (base) | Todo con IA (alto) | Todo con Flash-Lite (base) |
|---|---|---|---|---|---|
| 100 | US$0 | US$0 | US$0 | US$0 | US$1,68 |
| 1.000 | US$0 | US$2,86 | US$1,26 | US$10,38 | US$16,80 |
| 10.000 | US$17,22 | US$58,26 | US$42,30 | US$133,50 | US$168 |
| 100.000 | US$201,90 | US$612,30 | US$452,70 | US$1.364,70 | US$1.680 |
| 1.000.000 | US$2.048,70 | US$6.152,70 | US$4.556,70 | US$13.676,70 | US$16.800 |

Por miembro al mes: entre US$0,002 y US$0,006 con el sistema por capas. Son estimaciones con supuestos; los
porcentajes reales por capa se miden en el piloto. Ojo: con el tope actual de 8.000 neuronas al día, la IA se
corta a ~770 respuestas diarias; habría que subir `neuron_budget` y `global_daily_limit` a medida que crezcan los miembros.
No incluye el costo de invocaciones de Edge Functions de Supabase (incluidas en el plan hasta cierto volumen; verificar en el panel antes de escalar).

Por capas vs todo generativo: por capas cuesta 55 % menos, responde al instante lo frecuente (sin esperar al modelo),
da respuestas exactas en números, horas y verbos (donde un modelo pequeño se equivoca a veces) y sigue funcionando si la IA se cae.
Todo generativo es más simple de construir pero más caro, más lento y menos fiable en datos exactos.

## 7. Archivos

- `riso/tutor/riso-tutor.js`: motor por capas (cliente).
- `riso/tutor/conocimiento.js`: base pública generada.
- `tools/tutor/faq.js`: preguntas frecuentes revisadas (editar aquí y regenerar).
- `tools/tutor/generar_conocimiento.js`, `tools/tutor/costos.js`.
- `tools/tutor/propuesta-migracion-riso-chat.sql`: migración propuesta, no ejecutada.
- `tools/tutor-demo/index.html`: prototipo navegable (todo simulado).
- `tools/tests/riso-tutor.test.js`: 64 pruebas.

## 8. Pendiente para producción (requiere autorización)

1. Modo `chat` en `leo-ai` (instrucciones, filtro repetido en servidor, `riso_chat_reserve`).
2. Ejecutar la migración propuesta.
3. Presupuesto de IA aprobado por Leo y prueba con tráfico real de su cuenta de pruebas.
4. Integrar el panel en Inicio/Practicar detrás de un interruptor, primero para su cuenta de pruebas.
5. Repasar las 30 respuestas de la FAQ (las escribió Claude; Leo debe aprobarlas).
