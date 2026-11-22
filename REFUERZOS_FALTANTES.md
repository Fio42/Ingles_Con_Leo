# Refuerzos que faltan

Generado por `node tools/conexiones/faltantes.js --write`. No editar a mano.

Cuando un alumno se equivoca, el sitio solo le recomienda recursos que existen y que resuelven ese tema: la clase o ficha del tema, su practica propia y su curso publicado. Si falta el recurso exacto, esa recomendacion se omite (no se manda a una pagina general). Esta lista dice que habria que crear para que ese error tenga refuerzo.

Secciones 1 a 3 y 5: gramatica. La seccion 4 cubre vocabulario y listening (ver `INVENTARIO_TEMAS.csv`).

## 1. Falta una explicacion (ni clase ni ficha del glosario)

Hoy el error de estos temas no ofrece "Ver la clase". Recurso a crear: una ficha corta en `/glosario/<tema>/` (no hace falta una clase completa) y enlazarla en `temas.js` (`glossary`).

| Tema | Ejercicios | Ejemplo de un ejercicio | Recurso a crear |
|---|---|---|---|

Ninguno: todos los temas con ejercicios tienen clase o ficha.

## 2. Falta practica gratis del tema (todo es solo de Miembros)

Resumen de los 16 temas: 16 tienen practica EXCLUSIVA para Miembros (hay ejercicios y el Plan abre una practica enfocada en el tema, verificado) y 0 carecen de practica propia tambien para Miembros. Ninguno esta sin ejercicios: lo que falta es la version gratis.

A visitantes y cuentas gratis el resumen les ofrece la explicacion, pero no "Practicar este tema". Recurso a crear: una muestra fija de 6 ejercicios abiertos (como ya existe para Do/Does). Es una decision de monetizacion de Leo.

| Tema | Ejercicios de Miembros (nivel) | Practica de Miembros | Practica gratis | Ejemplo de un ejercicio | Recurso a crear |
|---|---|---|---|---|---|
| `your-vs-youre` | 4 (facil) | Exclusiva: Plan enfocado en el tema | Ninguna | `Your my best friend.` (opcion equivocada) / `You're my best friend.` (correcta) | Muestra gratis de 6 ejercicios |
| `to-too-two` | 6 (facil) | Exclusiva: Plan enfocado en el tema | Ninguna | `I am going too the store.` (opcion equivocada) / `I am going to the store.` (correcta) | Muestra gratis de 6 ejercicios |
| `lose-vs-loose` | 4 (avanzado) | Exclusiva: Plan enfocado en el tema | Ninguna | `Please don't loose your passport again.` (opcion equivocada) / `Please don't lose your passport again.` (correcta) | Muestra gratis de 6 ejercicios |
| `say-vs-tell` | 4 (medio) | Exclusiva: Plan enfocado en el tema | Ninguna | `Please say me the truth.` (opcion equivocada) / `Please tell me the truth.` (correcta) | Muestra gratis de 6 ejercicios |
| `actually-currently` | 5 (medio) | Exclusiva: Plan enfocado en el tema | Ninguna | `How do you say en realidad, no estoy de acuerdo?` (opcion equivocada) / `How do you say en realidad, no estoy de acuerdo?` (correcta) | Muestra gratis de 6 ejercicios |
| `pasado-continuo` | 8 (facil) | Exclusiva: Plan enfocado en el tema | Ninguna | `I were studying when the phone rang.` (opcion equivocada) / `I was studying when the phone rang.` (correcta) | Muestra gratis de 6 ejercicios |
| `fewer-vs-less` | 6 (medio) | Exclusiva: Plan enfocado en el tema | Ninguna | `I have less books than you.` (opcion equivocada) / `I have fewer books than you.` (correcta) | Muestra gratis de 6 ejercicios |
| `contables-incontables` | 4 (facil) | Exclusiva: Plan enfocado en el tema | Ninguna | `How many water do you need?` (opcion equivocada) / `How much water do you need?` (correcta) | Muestra gratis de 6 ejercicios |
| `modales-posibilidad` | 5 (medio) | Exclusiva: Plan enfocado en el tema | Ninguna | `How do you express that it might possibly rain?` (opcion equivocada) / `How do you express that it might possibly rain?` (correcta) | Muestra gratis de 6 ejercicios |
| `pasado-regulares` | 5 (facil) | Exclusiva: Plan enfocado en el tema | Ninguna | `How do you say "trabajé" (yesterday) in English?` (opcion equivocada) / `How do you say "trabajé" (yesterday) in English?` (correcta) | Muestra gratis de 6 ejercicios |
| `verbos-irregulares` | 6 (facil) | Exclusiva: Plan enfocado en el tema | Ninguna | `Yesterday I go to the park.` (opcion equivocada) / `Yesterday I went to the park.` (correcta) | Muestra gratis de 6 ejercicios |
| `causativos` | 3 (medio) | Exclusiva: Plan enfocado en el tema | Ninguna | `I'm going to have my car repair tomorrow.` (opcion equivocada) / `I'm going to have my car repaired tomorrow.` (correcta) | Muestra gratis de 6 ejercicios |
| `preposiciones-movimiento` | 4 (principiante) | Exclusiva: Plan enfocado en el tema | Ninguna | `I walk from school every morning.` (opcion equivocada) / `I walk to school every morning.` (correcta) | Muestra gratis de 6 ejercicios |
| `pronombres` | 9 (principiante facil) | Exclusiva: Plan enfocado en el tema | Ninguna | `(Talking about a boy) She is my friend.` (opcion equivocada) / `(Talking about a boy) He is my friend.` (correcta) | Muestra gratis de 6 ejercicios |
| `there-is-are` | 8 (principiante) | Exclusiva: Plan enfocado en el tema | Ninguna | `There are a book on the table.` (opcion equivocada) / `There is a book on the table.` (correcta) | Muestra gratis de 6 ejercicios |
| `question-tags` | 6 (medio) | Exclusiva: Plan enfocado en el tema | Ninguna | `You like coffee, doesn't you?` (opcion equivocada) / `You like coffee, don't you?` (correcta) | Muestra gratis de 6 ejercicios |

## 3. Practica de Miembros sin familia (el Plan no puede enfocar el tema)

Estos temas tienen ejercicios, pero no pertenecen a ninguna familia del diagnostico, asi que el Plan no puede abrir una practica solo de ese tema y el resumen no ofrece "Practicar". Recurso a crear: asignar una familia en `temas.js` (toca el diagnostico: se prueba aparte).

Ninguno: question-tags (familia `preguntas`) e inversion-enfasis, subjuntivo-formal y hedging (familia `formal`) ya tienen familia, asi que el Plan y el resumen abren su practica exacta.

## 4. Vocabulario y listening: practica gratis por tema

Hecho: `practica.html?skill=vocabulary&tema=<id>` y `practica.html?skill=listening&tema=<id>` abren solo las palabras o audios gratis de ESE tema (mismos bancos, mismos limites; si el nivel pedido no tiene, usa el mas cercano y lo avisa). El resumen de errores ofrece "Practicar este tema" con esa ruta.

- `vocab-confusas` (vocabulary): 28 ejercicios gratis, ruta activa
- `vocab-numeros` (vocabulary): 20 ejercicios gratis, ruta activa
- `vocab-trabajo` (vocabulary): 16 ejercicios gratis, ruta activa
- `vocab-viajes` (vocabulary): 8 ejercicios gratis, ruta activa
- `vocab-compras` (vocabulary): 8 ejercicios gratis, ruta activa
- `vocab-vida-diaria` (vocabulary): 24 ejercicios gratis, ruta activa
- `listening-numeros` (listening): 23 ejercicios gratis, ruta activa
- `listening-conversaciones` (listening): 7 ejercicios gratis, ruta activa
- `listening-condicionales` (listening): 15 ejercicios gratis, ruta activa
- `listening-contraste` (listening): 19 ejercicios gratis, ruta activa

Ninguno queda sin ejercicios gratis: los 10 temas tienen ruta.

## 5. Sin ejercicios en ningun nivel

Ninguno. (`cuantificadores` es un tema paraguas: sus ejercicios viven en much-many, some-any, little-few, fewer-vs-less y contables-incontables, y en sus microtemas a-lot-of y some-any-pregunta-oferta, ya activos.)
