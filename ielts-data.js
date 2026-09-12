// ============================================================
// Inglés con Leo — Contenido de práctica para IELTS
//
// IMPORTANTE (léelo antes de agregar más contenido):
// A diferencia del TOEFL (que cambió de formato en enero de 2026), el
// IELTS mantiene su formato clásico confirmado en ielts.org / ielts.international
// (revisado en 2026): Listening 4 secciones/40 preguntas/30 min, Reading
// 3 secciones/40 preguntas/60 min, Writing 2 tareas/60 min, Speaking 3
// partes/11-14 min con examinador. Lo único que cambió a mediados de 2026
// es la modalidad de entrega (se retira el examen en papel, todo pasa a
// computadora), NO el contenido ni los tipos de pregunta.
//
// IELTS Academic vs General Training: Listening y Speaking son IGUALES
// en ambas versiones. Reading y Writing cambian:
//   - Academic: textos y Task 1 más académicos (describir una gráfica/tabla)
//   - General Training: textos y Task 1 más cotidianos (escribir una carta)
// Este contenido practica ambos sabores donde aplica, y lo indica.
//
// Escala de bandas: 0 a 9 por habilidad, promedio redondeado a la mitad
// más cercana para la banda global. No es aprobado/reprobado.
//
// Estructura por sección:
//   IELTS_READING.trueFalseNotGiven / .matchingHeadings / .multipleChoice / .sentenceCompletion
//   IELTS_LISTENING.section1 / .section2 / .section3 / .section4
//   IELTS_SPEAKING.part1 / .part2 / .part3
//   IELTS_WRITING.task1Letter / .task1Chart / .task2Essay
// ============================================================

const IELTS_READING = {
  // "True / False / Not Given": clásico de IELTS Reading. Not Given
  // significa que el texto simplemente no dice nada sobre eso (no es
  // ni verdadero ni falso). Es el error más común de los estudiantes:
  // confundir "no lo dice" con "es falso".
  trueFalseNotGiven: [
    {
      id: 'ir-tfng-1',
      title: 'Urban Beekeeping',
      text: "In the last decade, keeping beehives on city rooftops has become increasingly popular in many major cities. Supporters argue that urban bees help pollinate parks and gardens, and that hives are often easier to monitor in cities than in remote rural areas. Some city councils now offer free training courses for residents who want to start their own rooftop hive.",
      statement: "City councils never charge for beekeeping training courses.",
      correct: 1,
      explain: 'El texto dice "algunos ayuntamientos ofrecen cursos gratis", pero eso no significa que NINGUNO cobre. Es una generalización que el texto no apoya del todo, así que es Falso (el texto sí menciona cursos gratis específicamente en "algunos", no en todos, y la afirmación dice "nunca cobran" lo cual contradice que solo "algunos" son gratis).'
    },
    {
      id: 'ir-tfng-2',
      title: 'Urban Beekeeping',
      text: "In the last decade, keeping beehives on city rooftops has become increasingly popular in many major cities. Supporters argue that urban bees help pollinate parks and gardens, and that hives are often easier to monitor in cities than in remote rural areas. Some city councils now offer free training courses for residents who want to start their own rooftop hive.",
      statement: "Urban beekeeping has existed for more than a hundred years.",
      correct: 2,
      explain: 'El texto no menciona cuántos años lleva existiendo esta práctica en general, solo dice que "en la última década se volvió más popular". No hay información suficiente, así que es Not Given.'
    },
    {
      id: 'ir-tfng-3',
      title: 'Renting an Apartment',
      text: "Tenants signing a rental agreement should check whether utilities such as water and electricity are included in the monthly rent. Most standard contracts require a security deposit equivalent to one month's rent, refundable at the end of the tenancy provided there is no damage to the property. Some landlords also request proof of income before approving an application.",
      statement: "A security deposit is always returned in full, no matter the condition of the apartment.",
      correct: 1,
      explain: 'El texto dice que el depósito se devuelve "siempre que no haya daños a la propiedad". La afirmación dice que se devuelve "sin importar la condición", lo cual contradice directamente al texto. Es Falso.'
    },
    {
      id: 'ir-tfng-4',
      title: 'Renting an Apartment',
      text: "Tenants signing a rental agreement should check whether utilities such as water and electricity are included in the monthly rent. Most standard contracts require a security deposit equivalent to one month's rent, refundable at the end of the tenancy provided there is no damage to the property. Some landlords also request proof of income before approving an application.",
      statement: "Landlords always require two months of rent as a security deposit.",
      correct: 1,
      explain: 'El texto dice "equivalente a un mes de renta", no dos. Es Falso, no Not Given, porque el texto sí da esa información específica y la afirmación la contradice.'
    }
  ],

  // "Matching Headings" simplificado: en el examen real arrastras un
  // título a cada párrafo de una lista de 6-8 opciones. Aquí practicamos
  // la misma habilidad (identificar la idea principal de un párrafo)
  // con opción múltiple, que es más fácil de hacer desde el celular.
  matchingHeadings: [
    {
      id: 'ir-mh-1',
      paragraph: "Many companies now allow employees to choose their own working hours, as long as they complete their required hours each week. Supporters say this flexibility reduces stress and allows people to work when they are most productive, whether that's early morning or late evening.",
      options: ['The benefits of flexible working hours', 'The history of the eight-hour workday', 'Why some employees prefer to work from home', 'How companies measure employee productivity'],
      correct: 0,
      explain: 'El párrafo se enfoca en las ventajas de elegir tu propio horario (menos estrés, trabajar cuando eres más productivo), así que el mejor título es sobre los beneficios del horario flexible.'
    },
    {
      id: 'ir-mh-2',
      paragraph: "Despite its benefits, flexible scheduling can create challenges for team communication. When colleagues work at different times, scheduling meetings becomes more difficult, and some employees report feeling disconnected from their teams.",
      options: ['The benefits of flexible working hours', 'The challenges of coordinating a flexible team', 'How to schedule an effective meeting', 'Why remote work is more popular than ever'],
      correct: 1,
      explain: 'Este párrafo cambia de tema: ahora habla de las dificultades de coordinar un equipo cuando cada quien trabaja a horas distintas. El título correcto menciona los retos, no los beneficios.'
    },
    {
      id: 'ir-mh-3',
      paragraph: "Coastal erosion affects thousands of kilometers of shoreline every year, as waves gradually wear away rock and sand. In some regions, the process has accelerated due to rising sea levels, forcing communities to relocate buildings further inland.",
      options: ['How ocean currents form', 'The causes and effects of coastal erosion', 'Why some beaches have more sand than others', 'The economic cost of building seawalls'],
      correct: 1,
      explain: 'El párrafo explica qué causa la erosión costera (las olas, el aumento del nivel del mar) y su efecto (comunidades que se mudan tierra adentro), así que el título debe mencionar tanto las causas como los efectos.'
    },
    {
      id: 'ir-mh-4',
      paragraph: "To slow the damage, engineers have proposed several solutions, including building artificial reefs that reduce wave energy before it reaches the shore, and planting vegetation with root systems that hold sand in place.",
      options: ['The causes and effects of coastal erosion', 'Proposed solutions to reduce coastal erosion', 'Why artificial reefs harm marine life', 'The cost of relocating coastal communities'],
      correct: 1,
      explain: 'Aquí el párrafo se enfoca en soluciones propuestas por ingenieros (arrecifes artificiales, plantas), así que el título debe hablar de soluciones, no de causas ni efectos.'
    }
  ],

  // Opción múltiple sobre un pasaje. Mezcla estilo Academic (pasajes más
  // formales/informativos) y General Training (avisos, situaciones
  // cotidianas), como en el examen real.
  multipleChoice: [
    {
      id: 'ir-mc-1',
      style: 'Academic',
      title: 'The Domestication of Rice',
      text: "Archaeological evidence suggests that rice was independently domesticated in at least two separate regions of Asia thousands of years ago. Early farmers selected plants whose seeds stayed attached to the stalk rather than scattering naturally, since these were easier to harvest. Over many generations, this selection process produced rice varieties dramatically different from their wild ancestors.",
      question: "Why did early farmers prefer rice plants whose seeds stayed attached to the stalk?",
      options: ['They were easier to harvest', 'They tasted better than other varieties', 'They grew faster than wild rice', 'They required less water to grow'],
      correct: 0,
      explain: 'El texto dice directamente que esas plantas "eran más fáciles de cosechar", por eso los agricultores las preferían.'
    },
    {
      id: 'ir-mc-2',
      style: 'Academic',
      title: 'Deep Ocean Exploration',
      text: "Less than a quarter of the ocean floor has been mapped in detail, despite covering more of the Earth's surface than all continents combined. New sonar technology is making exploration faster and cheaper, but the extreme pressure and darkness of the deep ocean still make it one of the most difficult environments on the planet to study directly.",
      question: "According to the passage, what is currently making ocean exploration easier?",
      options: ['New sonar technology', 'Lower water pressure at greater depths', 'International funding agreements', 'A reduction in ocean darkness'],
      correct: 0,
      explain: 'El texto menciona que la nueva tecnología de sonar está haciendo la exploración "más rápida y barata", es decir, más fácil.'
    },
    {
      id: 'ir-mc-3',
      style: 'General Training',
      title: 'Gym Membership Notice',
      text: "Members are reminded that guest passes are limited to two visits per month and must be used by the member accompanying their guest at all times. Guests under 16 years old are not permitted in the weights area under any circumstances. Please present your membership card at the front desk before each visit.",
      question: "What must a member do when bringing a guest?",
      options: ['Stay with the guest during the entire visit', 'Pay an extra fee for the guest pass', 'Register the guest one week in advance', 'Provide the guest with a temporary membership card'],
      correct: 0,
      explain: 'El aviso dice que el pase de invitado "debe ser usado por el miembro que acompaña a su invitado en todo momento", es decir, debe quedarse con él.'
    },
    {
      id: 'ir-mc-4',
      style: 'General Training',
      title: 'Parking Garage Notice',
      text: "Monthly parking permits must be renewed by the 25th of each month to avoid a late fee. Vehicles without a valid permit displayed on the dashboard will be towed at the owner's expense. Lost permit cards can be replaced at the management office for a small administrative charge.",
      question: "What happens if a monthly permit is not renewed by the 25th?",
      options: ['A late fee is charged', 'The vehicle is towed immediately', 'The parking spot is given away', 'The permit is automatically cancelled'],
      correct: 0,
      explain: 'El aviso dice claramente que si no renuevas para el día 25, se cobra un "recargo por retraso" (late fee).'
    }
  ],

  // "Sentence Completion": en el examen real casi siempre te piden usar
  // palabras EXACTAS del texto, con un límite de palabras (ej. "no more
  // than two words"). Aquí lo practicamos con un banco de palabras.
  sentenceCompletion: [
    {
      id: 'ir-sc-1',
      text: "The museum's new exhibit will open to the public on March 3rd and will remain available for viewing until the end of May. Tickets can be purchased online in advance or at the entrance, though online buyers receive priority entry during the first two weeks.",
      sentence: ["The exhibit will be open until the end of", "___", "."],
      bank: ['May', 'March', 'June', 'April'],
      correct: 'May',
      explain: 'El texto dice que la exhibición "permanecerá disponible hasta finales de mayo".'
    },
    {
      id: 'ir-sc-2',
      text: "The museum's new exhibit will open to the public on March 3rd and will remain available for viewing until the end of May. Tickets can be purchased online in advance or at the entrance, though online buyers receive priority entry during the first two weeks.",
      sentence: ["Buyers who purchase tickets", "___", "get priority entry for the first two weeks."],
      bank: ['online', 'in advance', 'at the entrance', 'in person'],
      correct: 'online',
      explain: 'El texto dice que "los compradores en línea reciben entrada prioritaria durante las primeras dos semanas".'
    },
    {
      id: 'ir-sc-3',
      text: "Applicants for the scholarship must submit their academic transcripts, two letters of recommendation, and a personal statement of no more than 500 words. Incomplete applications will not be considered, and the deadline for submission is strictly enforced with no exceptions.",
      sentence: ["The personal statement must be no longer than", "___", "words."],
      bank: ['500', '250', '1000', '750'],
      correct: '500',
      explain: 'El texto especifica claramente "de no más de 500 palabras".'
    },
    {
      id: 'ir-sc-4',
      text: "Applicants for the scholarship must submit their academic transcripts, two letters of recommendation, and a personal statement of no more than 500 words. Incomplete applications will not be considered, and the deadline for submission is strictly enforced with no exceptions.",
      sentence: ["Applicants need", "___", "letters of recommendation."],
      bank: ['two', 'three', 'one', 'four'],
      correct: 'two',
      explain: 'El texto pide específicamente "dos cartas de recomendación".'
    }
  ]
};

const IELTS_LISTENING = {
  // Sección 1 (real): conversación cotidiana, formulario/registro. Aquí
  // practicamos completar información específica (nombre, fecha, número)
  // igual que en el examen real.
  section1: [
    { id: 'il-s1-1', audioFile: 'audio/ielts/il-s1-1.mp3', transcript: "Good morning, I'd like to book a room for the weekend of the 14th. Two nights, please, for two guests.", translation: "Buenos días, quisiera reservar una habitación para el fin de semana del 14. Dos noches, por favor, para dos huéspedes.", sentence: ["The guest wants to book the room for", "___", "nights."], bank: ['two', 'three', 'one', 'four'], correct: 'two', explain: 'El huésped dice claramente "dos noches" (two nights).' },
    { id: 'il-s1-2', audioFile: 'audio/ielts/il-s1-2.mp3', transcript: "My last name is spelled H-E-N-D-E-R-S-O-N, and my phone number is 555-0142.", translation: "Mi apellido se escribe H-E-N-D-E-R-S-O-N, y mi número de teléfono es 555-0142.", sentence: ["The caller's last name is", "___", "."], bank: ['Henderson', 'Anderson', 'Harrison', 'Henley'], correct: 'Henderson', explain: 'El hablante deletrea su apellido letra por letra: H-E-N-D-E-R-S-O-N, que forma "Henderson".' },
    { id: 'il-s1-3', audioFile: 'audio/ielts/il-s1-3.mp3', transcript: "The gym membership includes access to the pool, but classes like yoga and spinning cost an extra fifteen dollars per month.", translation: "La membresía del gimnasio incluye acceso a la alberca, pero clases como yoga y spinning cuestan quince dólares extra al mes.", sentence: ["Extra classes cost", "___", "dollars per month."], bank: ['fifteen', 'fifty', 'five', 'twenty'], correct: 'fifteen', explain: 'El hablante dice que las clases extra cuestan "fifteen dollars per month" (quince dólares al mes).' },
    { id: 'il-s1-4', audioFile: 'audio/ielts/il-s1-4.mp3', transcript: "You can pick up your parcel at the front desk any time before 8 PM. After that, it will be held until tomorrow morning.", translation: "Puedes recoger tu paquete en recepción a cualquier hora antes de las 8 PM. Después de eso, se guardará hasta mañana en la mañana.", sentence: ["Parcels must be picked up before", "___", "PM."], bank: ['8', '6', '9', '7'], correct: '8', explain: 'El hablante dice "any time before 8 PM" (antes de las 8 PM).' }
  ],

  // Sección 2 (real): monólogo cotidiano (guía turística, información de
  // instalaciones). Pregunta de opción múltiple.
  section2: [
    { id: 'il-s2-1', audioFile: 'audio/ielts/il-s2-1.mp3', transcript: "Welcome to the community center. The swimming pool is on the ground floor, the gym is on the first floor, and the café is on the second floor, right next to the rooftop terrace.", question: "Where is the café located?", options: ['On the second floor', 'On the ground floor', 'On the first floor', 'In the basement'], correct: 0, explain: 'El guía dice que el café está "en el segundo piso, justo al lado de la terraza en la azotea".' },
    { id: 'il-s2-2', audioFile: 'audio/ielts/il-s2-2.mp3', transcript: "The library is open from 9 AM to 9 PM on weekdays, but closes at 5 PM on Saturdays and remains closed all day Sunday.", question: "What time does the library close on Saturdays?", options: ['5 PM', '9 PM', '6 PM', 'It is closed on Saturdays'], correct: 0, explain: 'El hablante dice que los sábados la biblioteca "cierra a las 5 PM".' },
    { id: 'il-s2-3', audioFile: 'audio/ielts/il-s2-3.mp3', transcript: "Before we begin the tour, please note that photography is allowed in every room except the archive room, where flash photography could damage the historical documents.", question: "Where is photography not allowed?", options: ['In the archive room', 'In every room', 'Nowhere, it is allowed everywhere', 'Only outside the building'], correct: 0, explain: 'El guía dice que la fotografía está permitida en todos lados excepto "en el cuarto de archivo".' },
    { id: 'il-s2-4', audioFile: 'audio/ielts/il-s2-4.mp3', transcript: "The farmers' market runs every Saturday from 8 AM until 1 PM in the main square, rain or shine, though a few stalls may close early if they sell out.", question: "What day does the farmers' market take place?", options: ['Saturday', 'Sunday', 'Friday', 'Every day'], correct: 0, explain: 'El hablante especifica que el mercado es "cada sábado" (every Saturday).' }
  ],

  // Sección 3 (real): discusión académica entre 2-3 personas (ej.
  // estudiantes hablando de una tarea). Opción múltiple.
  section3: [
    { id: 'il-s3-1', audioFile: 'audio/ielts/il-s3-1.mp3', transcript: "— Have you decided on a topic for the group project yet?\n— I was thinking about renewable energy, but Sarah suggested urban transportation instead.\n— Actually, I think we should combine both, since they're related.\n— That could work, as long as we narrow the focus so it's not too broad.", question: "What do the speakers eventually agree might work?", options: ['Combining both topics with a narrower focus', 'Choosing renewable energy only', 'Choosing urban transportation only', 'Asking the professor to assign a topic'], correct: 0, explain: 'El último hablante dice "eso podría funcionar, siempre que reduzcamos el enfoque", aceptando la idea de combinar ambos temas.' },
    { id: 'il-s3-2', audioFile: 'audio/ielts/il-s3-2.mp3', transcript: "— I'm struggling to find enough sources for the essay.\n— Have you tried the university database instead of just searching online?\n— Not yet, actually. Is it hard to use?\n— Not really, and the librarian offers a short workshop on it every Tuesday.", question: "What does the second speaker recommend?", options: ['Using the university database', 'Asking the professor for sources', 'Extending the essay deadline', 'Working with a study group'], correct: 0, explain: 'El segundo hablante recomienda directamente "¿ya intentaste la base de datos de la universidad?".' },
    { id: 'il-s3-3', audioFile: 'audio/ielts/il-s3-3.mp3', transcript: "— I think our survey results are biased because we only asked students on campus.\n— That's a fair point. Maybe we should also survey people online.\n— Good idea, that would give us a more diverse sample.\n— Let's send the online version out this week then.", question: "What problem do the speakers identify with their survey?", options: ['It only included students on campus', 'It had too many questions', 'It was conducted too quickly', 'It was not anonymous'], correct: 0, explain: 'El primer hablante señala que los resultados están sesgados "porque solo preguntamos a estudiantes del campus".' },
    { id: 'il-s3-4', audioFile: 'audio/ielts/il-s3-4.mp3', transcript: "— Did you get feedback on your draft from the professor?\n— Yes, she said the introduction was strong but the conclusion needed more detail.\n— That's useful. Mine was the opposite, apparently my conclusion was fine but the introduction was weak.\n— Maybe we could swap drafts and help each other fix those sections.", question: "What do the speakers decide to do?", options: ['Swap drafts to help each other', 'Rewrite their essays completely', 'Ask for an extension', 'Submit their drafts as they are'], correct: 0, explain: 'El último hablante propone "intercambiar borradores y ayudarnos a arreglar esas secciones".' }
  ],

  // Sección 4 (real): mini-conferencia académica de un solo hablante,
  // temas distintos a los que ya usamos en TOEFL/data.js para no repetir.
  section4: [
    { id: 'il-s4-1', audioFile: 'audio/ielts/il-s4-1.mp3', transcript: "Today I'll explain how bats use echolocation to navigate in complete darkness. Bats emit high-frequency sound waves that bounce off nearby objects and return as echoes. By analyzing the timing and direction of these echoes, a bat can build a detailed mental map of its surroundings, detecting obstacles and prey with remarkable precision.", question: "According to the lecture, how do bats build a mental map of their surroundings?", options: ['By analyzing the timing and direction of returning echoes', 'By using their eyes in low light conditions', 'By following scent trails left by other bats', 'By memorizing routes during daylight hours'], correct: 0, explain: 'La conferencia explica que el murciélago analiza "el tiempo y la dirección de los ecos que regresan" para construir su mapa mental.' },
    { id: 'il-s4-2', audioFile: 'audio/ielts/il-s4-2.mp3', transcript: "The magnetic compass was one of the earliest navigational tools, originally developed in China over a thousand years ago. Early versions used a piece of naturally magnetized iron ore called lodestone, which sailors discovered would always align itself in a north-south direction when allowed to float freely.", question: "According to the lecture, what did early compasses use to detect direction?", options: ['A naturally magnetized piece of iron ore', 'The position of the stars at night', 'A rotating metal needle powered by a spring', 'Reflections of sunlight on water'], correct: 0, explain: 'La conferencia dice que las primeras versiones usaban "un trozo de mineral de hierro magnetizado naturalmente llamado magnetita".' },
    { id: 'il-s4-3', audioFile: 'audio/ielts/il-s4-3.mp3', transcript: "Leaves change color in autumn because shorter days and cooler temperatures cause trees to stop producing chlorophyll, the pigment responsible for their green color. As chlorophyll breaks down, other pigments that were present all along, such as yellow and orange carotenoids, finally become visible.", question: "According to the lecture, why do other colors become visible in autumn leaves?", options: ['The green chlorophyll pigment breaks down', 'New pigments are produced only in autumn', 'Cooler temperatures create new colors chemically', 'Leaves absorb more sunlight in autumn'], correct: 0, explain: 'La conferencia dice que al descomponerse la clorofila, "otros pigmentos que ya estaban presentes... finalmente se vuelven visibles".' },
    { id: 'il-s4-4', audioFile: 'audio/ielts/il-s4-4.mp3', transcript: "Vaccines work by training the immune system to recognize a specific pathogen without causing the actual disease. They typically contain a weakened or inactive form of the pathogen, or a harmless piece of it, which prompts the body to produce antibodies. If the real pathogen is encountered later, the immune system can respond much faster.", question: "According to the lecture, what happens if the body encounters the real pathogen after vaccination?", options: ['The immune system responds much faster', 'The vaccine loses its effectiveness immediately', 'The body needs a completely new set of antibodies', 'The pathogen becomes harmless permanently'], correct: 0, explain: 'La conferencia explica que si el cuerpo encuentra el patógeno real después, "el sistema inmune puede responder mucho más rápido".' }
  ]
};

const IELTS_SPEAKING = {
  // Part 1: preguntas personales cortas (introducción/entrevista).
  part1: [
    { id: 'is-p1-1', audioFile: 'audio/ielts/is-p1-1.mp3', question: "Do you work or are you a student?", sampleAnswer: "Puedes decir a qué te dedicas o qué estudias, y agregar un pequeño detalle extra (dónde, hace cuánto, qué te gusta de eso)." },
    { id: 'is-p1-2', audioFile: 'audio/ielts/is-p1-2.mp3', question: "What do you usually do in the evenings?", sampleAnswer: "Describe una o dos actividades típicas de tu rutina, usando presente simple ('I usually...')." },
    { id: 'is-p1-3', audioFile: 'audio/ielts/is-p1-3.mp3', question: "How often do you use social media?", sampleAnswer: "Menciona la frecuencia (todos los días, algunas veces por semana) y para qué lo usas principalmente." },
    { id: 'is-p1-4', audioFile: 'audio/ielts/is-p1-4.mp3', question: "What's your favorite type of weather?", sampleAnswer: "Nombra el clima que prefieres y da una razón breve, por ejemplo qué actividad disfrutas cuando hace ese clima." },
    { id: 'is-p1-5', audioFile: 'audio/ielts/is-p1-5.mp3', question: "Do you prefer reading books or watching movies?", sampleAnswer: "Elige una opción y da al menos una razón concreta de por qué la prefieres sobre la otra." },
    { id: 'is-p1-6', audioFile: 'audio/ielts/is-p1-6.mp3', question: "What kind of music do you like?", sampleAnswer: "Nombra uno o dos géneros o artistas, y explica brevemente qué te gusta de ese tipo de música." }
  ],

  // Part 2: "cue card" (turno largo). En el examen real tienes 1 minuto
  // para prepararte con una tarjeta con puntos guía, y luego hablas
  // entre 1 y 2 minutos sin interrupción. Aquí simulamos la tarjeta.
  part2: [
    {
      id: 'is-p2-1',
      topic: 'Describe a person who has influenced you.',
      points: ['Who this person is', 'How you know them', 'What they have done that influenced you', 'And explain why this influence has been important to you'],
      sampleAnswer: "Estructura tu minuto de preparación así: primero anota quién es la persona (1 palabra), luego 2-3 palabras clave por cada punto de la tarjeta. Al hablar, sigue el orden de los puntos, no te preocupes por ser perfecto, y usa conectores como 'what really influenced me was...' para pasar de un punto a otro."
    },
    {
      id: 'is-p2-2',
      topic: 'Describe a memorable trip you took.',
      points: ['Where you went', 'Who you went with', 'What you did there', 'And explain why this trip was memorable for you'],
      sampleAnswer: "No necesitas contar todo el viaje, elige 2-3 momentos concretos. Usa pasado simple para narrar ('we visited...', 'I remember...') y termina explicando claramente por qué se te quedó grabado ese viaje en particular."
    },
    {
      id: 'is-p2-3',
      topic: 'Describe a skill you would like to learn.',
      points: ['What the skill is', 'Why you want to learn it', 'How you would learn it', 'And explain how this skill would help you in the future'],
      sampleAnswer: "Usa futuro y condicional para hablar de planes ('I would probably start by...', 'this would help me to...'). Conecta la habilidad con un beneficio real y personal, eso hace tu respuesta más natural y menos memorizada."
    }
  ],

  // Part 3: discusión más abstracta relacionada con el tema de la
  // cue card. Preguntas más generales, se espera una respuesta más
  // desarrollada que en Part 1.
  part3: [
    { id: 'is-p3-1', audioFile: 'audio/ielts/is-p3-1.mp3', relatedTo: 'is-p2-1', question: "Why do people need role models?", sampleAnswer: "Puedes hablar de cómo los modelos a seguir dan dirección o motivación, especialmente en la niñez, y dar un ejemplo general (no personal) para apoyar tu idea." },
    { id: 'is-p3-2', audioFile: 'audio/ielts/is-p3-2.mp3', relatedTo: 'is-p2-1', question: "Do you think teachers have less influence on young people today than in the past?", sampleAnswer: "Puedes comparar el pasado y el presente, mencionando el papel de la tecnología o las redes sociales como otras fuentes de influencia hoy en día." },
    { id: 'is-p3-3', audioFile: 'audio/ielts/is-p3-3.mp3', relatedTo: 'is-p2-2', question: "Why do you think traveling has become so popular?", sampleAnswer: "Menciona factores como vuelos más baratos, redes sociales que muestran lugares nuevos, o más tiempo libre disponible para algunas personas." },
    { id: 'is-p3-4', audioFile: 'audio/ielts/is-p3-4.mp3', relatedTo: 'is-p2-2', question: "What are the disadvantages of tourism for local communities?", sampleAnswer: "Puedes mencionar el aumento de precios, la pérdida de tradiciones locales, o la presión sobre los recursos naturales de la zona." },
    { id: 'is-p3-5', audioFile: 'audio/ielts/is-p3-5.mp3', relatedTo: 'is-p2-3', question: "Why do some adults find it difficult to learn new skills?", sampleAnswer: "Puedes hablar de la falta de tiempo, el miedo a fallar, o la comodidad de quedarse con lo que ya se sabe hacer bien." },
    { id: 'is-p3-6', audioFile: 'audio/ielts/is-p3-6.mp3', relatedTo: 'is-p2-3', question: "Do you think schools should teach more practical skills?", sampleAnswer: "Da tu opinión clara primero, y luego un ejemplo de una habilidad práctica específica (finanzas personales, cocina, primeros auxilios) que crees que sería útil enseñar." }
  ]
};

const IELTS_WRITING = {
  // Task 1 - General Training: carta formal o informal según la
  // situación. Esta es la tarea que MÁS cambia entre Academic y
  // General (en Academic, Task 1 es describir una gráfica, ver abajo).
  task1Letter: [
    {
      id: 'iw-t1l-1',
      prompt: "You recently moved into a new apartment and the heating system is not working properly. Write a letter to your landlord. In your letter: explain the problem, say how long it has been happening, and ask what action the landlord will take.",
      tone: 'Formal',
      example: "Dear Mr. Alvarez,\n\nI am writing to inform you that the heating system in my apartment has not been working properly since last Tuesday. The temperature barely rises even when the heater is on for several hours.\n\nAs the weather has been getting colder, this is becoming increasingly uncomfortable. Could you please arrange for a technician to inspect the system as soon as possible?\n\nI look forward to your response.\n\nYours sincerely,\nCarla Ruiz",
      checklist: ['Explica claramente el problema', 'Menciona cuánto tiempo lleva pasando', 'Pide una acción específica', 'Usa un tono formal (Dear Mr./Ms., Yours sincerely)']
    },
    {
      id: 'iw-t1l-2',
      prompt: "A close friend is celebrating a birthday next month. Write a letter to invite them to a celebration. In your letter: invite them, explain what kind of celebration it will be, and suggest what they could bring.",
      tone: 'Informal',
      example: "Hi Marco,\n\nI wanted to invite you to a little get-together for my birthday next month, on the 20th! It's going to be a casual barbecue at my place, nothing too fancy, just close friends and good food.\n\nIf you'd like to bring something, maybe a salad or some drinks would be great, but honestly just bring yourself!\n\nLet me know if you can make it.\n\nTake care,\nSofia",
      checklist: ['Invita claramente a la persona', 'Describe el tipo de celebración', 'Sugiere qué podrían llevar', 'Usa un tono informal y amigable']
    },
    {
      id: 'iw-t1l-3',
      prompt: "You worked with a colleague on a project two years ago and are now applying for a new job. Write a letter asking them to provide a reference. In your letter: remind them who you are, explain the situation, and ask if they would be willing to help.",
      tone: 'Formal',
      example: "Dear Ms. Chen,\n\nI hope this email finds you well. We worked together on the marketing campaign at Delta Corp back in 2024, and I have great memories of that project.\n\nI am currently applying for a new position and would be very grateful if you would be willing to provide a professional reference for me. Please let me know if you need any additional information.\n\nThank you very much for considering my request.\n\nBest regards,\nDaniel Reyes",
      checklist: ['Recuerda a la persona quién eres', 'Explica la situación con claridad', 'Pide amablemente si puede ayudar', 'Mantiene un tono profesional']
    },
    {
      id: 'iw-t1l-4',
      prompt: "You recently stayed at a hotel and experienced excessive noise during your stay that affected your sleep. Write a letter to the hotel manager. In your letter: describe the problem, explain how it affected your stay, and say what you would like the manager to do.",
      tone: 'Formal',
      example: "Dear Hotel Manager,\n\nI stayed at your hotel from March 3rd to March 5th and unfortunately experienced significant noise from the room next to mine on both nights, which made it very difficult to sleep.\n\nAs a result, I felt exhausted during an important business trip. I would appreciate either a partial refund or a discount on a future stay as compensation for this inconvenience.\n\nI hope to hear from you soon.\n\nYours faithfully,\nAndrea Solis",
      checklist: ['Describe el problema con claridad', 'Explica cómo afectó su estadía', 'Pide una solución específica', 'Usa un tono formal apropiado para una queja']
    }
  ],

  // Task 1 - Academic: describir datos de una gráfica/tabla. No podemos
  // dibujar una gráfica real aquí, así que mostramos los datos en una
  // tabla simple (misma habilidad: describir tendencias con datos).
  task1Chart: [
    {
      id: 'iw-t1c-1',
      prompt: "The table below shows average smartphone screen time (hours per day) in three age groups over three years. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      chartTitle: 'Average daily smartphone screen time (hours)',
      chartData: { columns: ['', '2022', '2023', '2024'], rows: [['Ages 13-17', '4.2', '4.8', '5.3'], ['Ages 18-34', '3.5', '3.9', '4.1'], ['Ages 35+', '2.1', '2.3', '2.4']] },
      example: "The table shows average daily smartphone screen time across three age groups from 2022 to 2024. Overall, screen time increased in all three groups, but teenagers consistently recorded the highest usage.\n\nAmong 13-17 year-olds, screen time rose from 4.2 hours in 2022 to 5.3 hours in 2024, the largest increase of the three groups. Adults aged 18-34 also saw a steady rise, from 3.5 to 4.1 hours. In contrast, those aged 35 and over showed only a slight increase, from 2.1 to 2.4 hours, remaining well below the other two groups throughout the period.",
      checklist: ['Da una visión general (overview) al inicio', 'Menciona los datos más importantes, no todos', 'Hace comparaciones entre grupos', 'No da opiniones personales (a diferencia de Task 2)']
    },
    {
      id: 'iw-t1c-2',
      prompt: "The table below shows the percentage of households using three different modes of transport to commute to work in a city, in 2010 and 2024. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      chartTitle: 'Main mode of transport to work (%)',
      chartData: { columns: ['', '2010', '2024'], rows: [['Private car', '58%', '39%'], ['Public transport', '30%', '46%'], ['Bicycle', '12%', '15%']] },
      example: "The table compares how households commuted to work in 2010 and 2024 using three different modes of transport. The most noticeable change is the shift away from private cars towards public transport.\n\nIn 2010, more than half of households (58%) relied on private cars, while only 30% used public transport. By 2024, this pattern had reversed considerably: public transport use rose to 46%, overtaking private car use, which fell to 39%. Bicycle use also increased slightly, from 12% to 15%, though it remained the least common option throughout.",
      checklist: ['Da una visión general al inicio', 'Compara los dos años claramente', 'Menciona el cambio más importante', 'Usa lenguaje de tendencias (rose, fell, overtook)']
    },
    {
      id: 'iw-t1c-3',
      prompt: "The table below shows the percentage breakdown of monthly household spending in a country, in three categories. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      chartTitle: 'Monthly household spending breakdown (%)',
      chartData: { columns: ['Category', 'Percentage'], rows: [['Housing', '35%'], ['Food', '25%'], ['Transport', '15%'], ['Other', '25%']] },
      example: "The table illustrates how households in this country divide their monthly spending across four categories. Housing represents the largest share of expenses by a clear margin.\n\nHousing accounts for 35% of monthly spending, followed by food at 25%. Transport makes up a smaller proportion, at 15%, while the remaining 25% is spent on other, unspecified categories. Overall, housing and food together represent 60% of total household spending, highlighting how much these two essentials dominate monthly budgets.",
      checklist: ['Da una visión general al inicio', 'Identifica la categoría más grande', 'Agrupa datos relacionados cuando tiene sentido', 'No inventa razones que la tabla no muestra']
    },
    {
      id: 'iw-t1c-4',
      prompt: "The table below compares three universities in terms of average class size and tuition cost per year. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
      chartTitle: 'University comparison',
      chartData: { columns: ['University', 'Average class size', 'Annual tuition'], rows: [['Northfield College', '15 students', '$18,000'], ['Central State University', '35 students', '$12,000'], ['Bayview University', '22 students', '$25,000'] ] },
      example: "The table compares three universities in terms of average class size and annual tuition cost. There is a clear relationship between smaller class sizes and higher cost at two of the three institutions.\n\nNorthfield College has the smallest average class size, at 15 students, with tuition of $18,000 per year. Bayview University has a mid-sized average class of 22 students but charges the highest tuition, at $25,000. Central State University stands out as the most affordable option, at $12,000 per year, but also has by far the largest classes, averaging 35 students.",
      checklist: ['Da una visión general al inicio', 'Compara al menos dos universidades directamente', 'Señala qué universidad destaca en cada categoría', 'Usa vocabulario de comparación (highest, smallest, most affordable)']
    }
  ],

  // Task 2: ensayo de opinión, 250 palabras, igual en Academic y
  // General Training. Es la tarea que más peso tiene en Writing.
  task2Essay: [
    {
      id: 'iw-t2-1',
      essayType: 'Opinion (agree/disagree)',
      prompt: "Some people think that technology has made life more complicated. To what extent do you agree or disagree?",
      example: "I disagree with the view that technology has made life more complicated overall, although I accept it has introduced new challenges.\n\nOn one hand, technology can create complications, such as the need to constantly update devices, manage passwords, or deal with information overload from social media. Older generations in particular sometimes struggle to adapt to rapidly changing tools.\n\nHowever, I believe the benefits outweigh these difficulties. Tasks that once took hours, such as banking, communicating with family abroad, or researching information, can now be done in minutes. Technology has also made healthcare, education, and work more accessible to people in remote areas.\n\nIn conclusion, while technology brings some new complications, it has simplified far more aspects of daily life than it has complicated, so I do not agree that it has made life more complicated overall.",
      checklist: ['Da tu postura claramente desde la introducción', 'Reconoce el otro lado del argumento (aunque no estés de acuerdo)', 'Da razones y ejemplos concretos', 'Termina con una conclusión clara que resume tu opinión']
    },
    {
      id: 'iw-t2-2',
      essayType: 'Discussion (discuss both views)',
      prompt: "Some people believe governments should invest more in public transport rather than building new roads. Others believe building more roads is a better use of public money. Discuss both views and give your own opinion.",
      example: "There is an ongoing debate about whether governments should prioritize public transport or road construction. This essay will discuss both views before giving my own opinion.\n\nThose who favor investing in public transport argue that it reduces traffic congestion and pollution, since buses and trains carry far more passengers per vehicle than private cars. It can also make cities more accessible for people who cannot afford a car.\n\nOn the other hand, supporters of road construction claim that better roads reduce travel time and support economic activity, particularly the transport of goods between cities. They argue that public transport alone cannot fully replace the flexibility that roads provide.\n\nIn my opinion, investing in public transport should be the priority in most cities, since it addresses both congestion and environmental concerns more directly, while a smaller portion of the budget can still maintain existing roads.",
      checklist: ['Presenta ambos puntos de vista de forma equilibrada', 'Da al menos una razón por cada postura', 'Da tu propia opinión claramente al final', 'Usa conectores para organizar el ensayo (on the other hand, in my opinion)']
    },
    {
      id: 'iw-t2-3',
      essayType: 'Advantages/Disadvantages',
      prompt: "In many countries, more people are choosing to work from home. What are the advantages and disadvantages of this trend?",
      example: "Working from home has become increasingly common in recent years, and this shift brings both advantages and disadvantages.\n\nOne major advantage is flexibility: employees can often organize their schedules around personal responsibilities, and they save time and money that would otherwise be spent commuting. Many workers also report feeling more productive without office distractions.\n\nHowever, working from home also has drawbacks. It can lead to feelings of isolation, since employees miss the informal social interaction that happens naturally in an office. It can also blur the line between work and personal life, making it harder for some people to switch off at the end of the day.\n\nOverall, while working from home offers real benefits in terms of flexibility and efficiency, companies and employees need to actively manage the risks of isolation and overwork for the trend to be sustainable long term.",
      checklist: ['Explica al menos una ventaja con detalle', 'Explica al menos una desventaja con detalle', 'Mantiene un balance entre ambos lados', 'Cierra con una conclusión general, no solo una lista']
    },
    {
      id: 'iw-t2-4',
      essayType: 'Problem/Solution',
      prompt: "Traffic congestion is a growing problem in many cities around the world. What problems does this cause, and what solutions can you suggest?",
      example: "Traffic congestion has become a serious problem in many growing cities, and it creates several negative effects while also allowing for a number of possible solutions.\n\nOne major problem caused by congestion is lost productivity, as workers spend hours each week stuck in traffic instead of working or spending time with family. Congestion also increases air pollution, since vehicles idling in traffic emit more harmful gases than those moving freely, which affects public health in the long run.\n\nSeveral solutions could help address this issue. Expanding and improving public transport would encourage more people to leave their cars at home, while congestion charges in city centers, already used successfully in some cities, discourage unnecessary car trips. Encouraging remote work where possible could also reduce the number of daily commuters significantly.\n\nIn conclusion, while traffic congestion causes real economic and health problems, a combination of better public transport, congestion pricing, and flexible work arrangements could substantially reduce it over time.",
      checklist: ['Explica al menos dos problemas causados por el tema', 'Propone al menos dos soluciones concretas', 'Conecta cada solución con el problema que resuelve', 'Termina con una conclusión que resume la idea principal']
    }
  ]
};
