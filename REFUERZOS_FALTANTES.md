# Refuerzos que faltan

Generado por `node tools/conexiones/faltantes.js --write`. No editar a mano.

Cuando un alumno se equivoca, el sitio solo le recomienda recursos que existen y que resuelven ese tema: la clase o ficha del tema, su practica propia y su curso publicado. Si falta el recurso exacto, esa recomendacion se omite (no se manda a una pagina general). Esta lista dice que habria que crear para que ese error tenga refuerzo.

Alcance: solo gramatica. Vocabulario y listening tienen su propia seccion de practica y se explican con fichas del glosario por pareja de palabras (ver `INVENTARIO_TEMAS.csv`).

## 1. Falta una explicacion (ni clase ni ficha del glosario)

Hoy el error de estos temas no ofrece "Ver la clase". Recurso a crear: una ficha corta en `/glosario/<tema>/` (no hace falta una clase completa) y enlazarla en `temas.js` (`glossary`).

| Tema | Ejercicios | Ejemplo de un ejercicio | Recurso a crear |
|---|---|---|---|
| `basicos-ingles` | 23 | `One dog, two dog.` (opcion equivocada) / `One dog, two dogs.` (correcta) | Ficha de glosario "Plural, colores, días y respuestas básicas" |
| `condicionales` | 27 | `If it rains tomorrow, we stay at home.` (opcion equivocada) / `If it rains tomorrow, we will stay at home.` (correcta) | Ficha de glosario "Condicionales" |
| `wish` | 5 | `I wish I have more free time.` (opcion equivocada) / `I wish I had more free time.` (correcta) | Ficha de glosario "Wish e if only" |
| `palabras-parecidas` | 14 | `Can you give me some advise?` (opcion equivocada) / `Can you give me some advice?` (correcta) | Ficha de glosario "Palabras que se parecen (advice, lay, further, quiet)" |
| `matices-formales` | 9 | `¿Cuál suena más natural en una conversación casual?` (opcion equivocada) / `¿Cuál suena más natural en una conversación casual?` (correcta) | Ficha de glosario "Matices: formal, natural y -ed vs -ing" |
| `estilo-indirecto` | 13 | `She said (that) she is tired.` (opcion equivocada) / `She said (that) she was tired.` (correcta) | Ficha de glosario "Estilo indirecto (reported speech)" |
| `causativos` | 3 | `I'm going to have my car repair tomorrow.` (opcion equivocada) / `I'm going to have my car repaired tomorrow.` (correcta) | Ficha de glosario "Verbos causativos (have something done)" |
| `preposiciones-movimiento` | 4 | `I walk from school every morning.` (opcion equivocada) / `I walk to school every morning.` (correcta) | Ficha de glosario "Preposiciones de movimiento (to, into, from)" |
| `preposiciones-sutiles` | 7 | `She is responsible of the entire project.` (opcion equivocada) / `She is responsible for the entire project.` (correcta) | Ficha de glosario "Preposiciones sutiles (beside, besides...)" |
| `relativas` | 11 | `The woman which lives next door is a doctor.` (opcion equivocada) / `The woman who lives next door is a doctor.` (correcta) | Ficha de glosario "Cláusulas relativas" |
| `inversion-enfasis` | 19 | `No sooner did she arrived than it started raining.` (opcion equivocada) / `No sooner had she arrived than it started raining.` (correcta) | Ficha de glosario "Inversión y oraciones enfáticas" |
| `subjuntivo-formal` | 5 | `It is essential that she is present at the meeting.` (opcion equivocada) / `It is essential that she be present at the meeting.` (correcta) | Ficha de glosario "Subjuntivo formal" |
| `hedging` | 9 | `This is argue the best decision the company has ever made.` (opcion equivocada) / `This is arguably the best decision the company has ever made.` (correcta) | Ficha de glosario "Enfatizadores y hedging" |

## 2. Falta practica gratis del tema (todo es solo de Miembros)

Resumen de los 13 temas: 13 tienen practica EXCLUSIVA para Miembros (hay ejercicios y el Plan abre una practica enfocada en el tema, verificado) y 0 carecen de practica propia tambien para Miembros. Ninguno esta sin ejercicios: lo que falta es la version gratis.

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
| `causativos` | 3 (medio) | Exclusiva: Plan enfocado en el tema | Ninguna | `I'm going to have my car repair tomorrow.` (opcion equivocada) / `I'm going to have my car repaired tomorrow.` (correcta) | Muestra gratis de 6 ejercicios |
| `preposiciones-movimiento` | 4 (principiante) | Exclusiva: Plan enfocado en el tema | Ninguna | `I walk from school every morning.` (opcion equivocada) / `I walk to school every morning.` (correcta) | Muestra gratis de 6 ejercicios |
| `there-is-are` | 8 (principiante) | Exclusiva: Plan enfocado en el tema | Ninguna | `There are a book on the table.` (opcion equivocada) / `There is a book on the table.` (correcta) | Muestra gratis de 6 ejercicios |

## 3. Practica de Miembros sin familia (el Plan no puede enfocar el tema)

Estos temas tienen ejercicios, pero no pertenecen a ninguna familia del diagnostico, asi que el Plan no puede abrir una practica solo de ese tema y el resumen no ofrece "Practicar". Recurso a crear: asignar una familia en `temas.js` (toca el diagnostico: se prueba aparte).

| Tema | Ejercicios | Ejemplo de un ejercicio |
|---|---|---|
| `question-tags` | 6 | `You like coffee, doesn't you?` (opcion equivocada) / `You like coffee, don't you?` (correcta) |
| `inversion-enfasis` | 19 | `No sooner did she arrived than it started raining.` (opcion equivocada) / `No sooner had she arrived than it started raining.` (correcta) |
| `subjuntivo-formal` | 5 | `It is essential that she is present at the meeting.` (opcion equivocada) / `It is essential that she be present at the meeting.` (correcta) |
| `hedging` | 9 | `This is argue the best decision the company has ever made.` (opcion equivocada) / `This is arguably the best decision the company has ever made.` (correcta) |

## 4. Vocabulario y listening: ejercicios gratis sin ruta por tema

La practica gratis por tema (`practica.html?skill=grammar&tema=<id>`) solo existe en gramatica. Estos temas tienen ejercicios gratis, pero el resumen de errores no puede abrir una practica solo de ese tema: ofrece su explicacion (ficha por pareja de palabras) y no un boton de practica. Recurso a crear: la misma ruta `?skill=vocabulary&tema=<id>` y `?skill=listening&tema=<id>` en `initFreePractice` (app.js).

- `vocab-confusas` (vocabulary): 28 ejercicios gratis
- `vocab-numeros` (vocabulary): 20 ejercicios gratis
- `vocab-trabajo` (vocabulary): 16 ejercicios gratis
- `vocab-viajes` (vocabulary): 8 ejercicios gratis
- `vocab-compras` (vocabulary): 8 ejercicios gratis
- `vocab-vida-diaria` (vocabulary): 24 ejercicios gratis
- `listening-numeros` (listening): 23 ejercicios gratis
- `listening-conversaciones` (listening): 7 ejercicios gratis
- `listening-condicionales` (listening): 15 ejercicios gratis
- `listening-contraste` (listening): 20 ejercicios gratis

## 5. Sin ejercicios en ningun nivel

- `cuantificadores` (Cuantificadores): crear ejercicios antes que cualquier refuerzo.
