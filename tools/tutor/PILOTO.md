# Riso · piloto real restringido (preparado, sin ejecutar)

Nada de esto está activo. Para encenderlo hacen falta las autorizaciones de la sección 5.

## 1. Estado medido (lectura agregada, 27 nov 2026)

| Dato | Valor |
| --- | --- |
| Supabase | Plan gratuito: 500.000 invocaciones de Edge Functions al mes y 500 MB de base de datos. Base actual: 24 MB |
| Leo AI hoy | 25 miembros, 268 perfiles. Promedio 73 neuronas al día (30 días); máximo 719 (4 nov). Una explicación ≈ 1.000 tokens de entrada + 85 de salida ≈ 11,5 neuronas |
| Topes actuales de Leo AI (sin cambios) | 100 por alumno al día, 1.500 pedidos al día, 8.000 neuronas al día, prueba gratis 5 créditos |
| Cloudflare | Plan y uso real: **pendiente**, no hay conexión a Cloudflare desde aquí. Leo indica que usa las 10.000 neuronas gratis diarias y que su máximo histórico fue ~200 al día (en Supabase consta un día de 719, el 4 nov) |

## 2. Cómo se mantiene en US$0

1. Lo frecuente lo resuelven las capas 1 a 4 sin IA.
2. Riso solo usa la IA mientras **Riso + Leo AI** estén por debajo del 60 % de las 10.000 neuronas gratis del día (`riso_ceiling_pct`). Así Leo AI conserva al menos 2.000 neuronas antes de su propio tope de 8.000.
3. Riso tiene además su propio presupuesto diario (`riso_neuron_budget`, 1.500 en el piloto) y un total de 100 respuestas generativas para todo el piloto (`chat_pilot_total`).
4. Antes de llamar al modelo se reserva una estimación de neuronas; dos pedidos simultáneos no pueden pasar el límite.
5. El pago está apagado (`allow_paid = false`): sin esa autorización, Riso nunca pasa del techo gratis. Para el futuro existe `paid_daily_neurons`, en 0.
6. Alertas al 70 %, 90 % y 95 % de las neuronas gratis del día (Leo AI + Riso), una vez por día, por el registro de errores que ya existe; la del 95 % es crítica y llega por correo al momento.
7. El día es el de Cloudflare (UTC): se renueva a las 7:00 p. m. de Bogotá.

Costo del piloto: 100 respuestas × ~12 neuronas = ~1.200 neuronas en total, el 12 % de un solo día gratis.

¿Hasta dónde alcanza el gratis? (`node tools/tutor/costos-piloto.js`): con Riso y Leo AI juntos y 90 % del gratis como límite, unos 718 miembros en el escenario base y 456 en el pesimista. Con el techo de Riso del 60 %, 478 y 304. Pasado ese punto, Riso respondería "descansando" en vez de gastar, salvo que Leo apruebe un presupuesto pago.

## 3. Piezas preparadas

| Pieza | Archivo | Estado |
| --- | --- | --- |
| Migración del piloto | `supabase/pendientes/20261128_riso_chat_piloto.sql` | Escrita y probada en Postgres embebido (16 pruebas). No ejecutada |
| Modo chat del servidor | `supabase/functions/leo-ai/riso-chat.mjs` + 12 líneas en `index.ts` | Probado con base y modelo simulados (17 pruebas) y en Deno; `deno check index.ts` sin errores. No desplegado |
| Índice de ejercicios del servidor | `supabase/functions/leo-ai/riso-ejercicios.json` (505 ejercicios) | Generado con `tools/tutor/generar_indice_ejercicios.js` |
| Adaptador del navegador | `riso/tutor/riso-cliente.js` | Listo; no conectado al sitio |

Seguridad en el servidor: sesión verificada (como Leo AI), membresía o correo confirmado, lista del piloto en la base, filtro repetido en el servidor, contexto del ejercicio resuelto con el índice del servidor (el navegador solo manda el id y la respuesta elegida; las evaluaciones de la Academia no están en el índice), funciones ejecutables solo por la función (service_role), día del servidor, idempotencia por request_id, liberación de reservas colgadas a los 60 s, registros técnicos sin texto.

## 4. Qué se mide en el piloto

| Medida | Cómo |
| --- | --- |
| Tokens reales de entrada y salida, neuronas | `ai_usage_daily`, proveedor `cloudflare:riso` |
| Latencia, errores, motivo de fallo | Registro de la función (`ev: riso_chat`, sin texto) |
| % resuelto sin IA | Métricas por capa del navegador (conteos) |
| Exactitud educativa, calidad de traducciones y explicaciones, seguimientos, fuera de alcance | Batería fija de 60 preguntas (`tools/tutor/piloto-preguntas.md`) que Leo responde con su cuenta de pruebas y califica 1 a 3 en una hoja: correcta, clara, breve |

## 5. Autorizaciones necesarias, en orden

1. Ejecutar la migración (todo queda apagado).
2. Agregar la cuenta de pruebas de Leo a `riso_pilot_testers`.
3. Desplegar `leo-ai` con el modo chat.
4. `update leo_ai_config set chat_enabled = true` (sigue restringido al piloto).
5. Apagar en cualquier momento: `update leo_ai_config set chat_enabled = false`.
