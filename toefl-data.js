// ============================================================
// Inglés con Leo — Contenido de práctica para TOEFL
//
// IMPORTANTE (léelo antes de agregar más contenido):
// El examen TOEFL iBT cambió por completo a partir de enero de 2026
// (confirmado en la página oficial de ETS, ets.org/toefl). Ya NO es
// el formato clásico que mucha gente conoce (ensayos largos, lecturas
// de 700 palabras, 4 tareas de Speaking). El formato actual es:
//
//   Reading    50 preguntas cortas, adaptativo, ~30 min
//   Listening  47 preguntas cortas, adaptativo, ~29 min
//   Speaking   11 preguntas, ~8 min ("Listen and Repeat" + "Take an Interview")
//   Writing    12 preguntas, ~23 min ("Build a Sentence", "Write an Email",
//              "Write for an Academic Discussion")
//
// ETS no publica los detalles exactos de mecánica interna de cada
// tipo de pregunta (duración exacta de cada clip, número exacto de
// palabras por texto, etc.), así que este contenido practica los
// MISMOS TIPOS de tarea reales del examen actual, con ejemplos
// representativos, pero no es una copia exacta del examen real (nadie
// fuera de ETS tiene eso) ni usa el algoritmo adaptativo real.
//
// Estructura por sección (cada una es un objeto con "subtipos"):
//   TOEFL_READING.completeWords / .dailyLife / .academic
//   TOEFL_LISTENING.chooseResponse / .conversation / .announcement / .academicTalk
//   TOEFL_SPEAKING.listenRepeat / .interview
//   TOEFL_WRITING.buildSentence / .email / .discussion
// ============================================================

const TOEFL_READING = {
  completeWords: [
    {
      id: 'tr-cw-1',
      sentence: "Scientists are still trying to ___ how the ancient structure was built.",
      options: ['determine', 'determined', 'determining', 'determination'],
      correct: 0,
      explain: 'Después de "to" va el verbo en su forma base: "to determine".'
    },
    {
      id: 'tr-cw-2',
      sentence: "The new policy will affect employees ___ across all departments.",
      options: ['equally', 'equal', 'equality', 'equals'],
      correct: 0,
      explain: 'Se necesita un adverbio para modificar el verbo "affect": "equally".'
    },
    {
      id: 'tr-cw-3',
      sentence: "Despite the heavy rain, the outdoor concert was not ___.",
      options: ['cancelled', 'cancel', 'cancelling', 'cancels'],
      correct: 0,
      explain: 'Después de "was not" va el participio pasado: "cancelled".'
    },
    {
      id: 'tr-cw-4',
      sentence: "The professor asked students to submit their essays ___ Friday.",
      options: ['by', 'until', 'since', 'for'],
      correct: 0,
      explain: '"By Friday" significa "para el viernes" (fecha límite). "Until" se usa para acciones continuas, no para límites.'
    },
    {
      id: 'tr-cw-5',
      sentence: "The company's profits have ___ significantly over the past year.",
      options: ['increased', 'increase', 'increasing', 'increases'],
      correct: 0,
      explain: 'Después de "have" va el participio pasado: "have increased".'
    },
    {
      id: 'tr-cw-6',
      sentence: "It is essential ___ all safety procedures before entering the lab.",
      options: ['to follow', 'follow', 'following', 'followed'],
      correct: 0,
      explain: '"It is essential to + verbo" es una estructura fija en inglés.'
    }
  ],

  dailyLife: [
    {
      id: 'tr-dl-1',
      title: 'Library Notice',
      text: "The downtown library will be closed on Monday, October 12th, for annual maintenance. All borrowed items due that day may be returned by Wednesday without a late fee. The book drop outside the main entrance remains open 24 hours.",
      question: "What can visitors do if their books are due on October 12th?",
      options: ['Return them by Wednesday with no penalty', 'Renew them online only', 'Pay a fee to keep them longer', 'Return them to a different branch'],
      correct: 0,
      explain: 'El aviso dice que los libros que vencen ese día se pueden devolver hasta el miércoles sin recargo.'
    },
    {
      id: 'tr-dl-2',
      title: 'Gym Class Schedule Change',
      text: "Please note that the 6:00 PM yoga class has been moved to Room 204 starting next week. The 7:30 PM spin class remains in its usual location. Members who signed up for yoga will receive a reminder email.",
      question: "What is staying the same next week?",
      options: ['The location of the spin class', 'The location of the yoga class', 'The time of the yoga class', 'The number of classes offered'],
      correct: 0,
      explain: 'El aviso dice que el spin class se mantiene en su lugar habitual; lo que cambia es el salón del yoga.'
    },
    {
      id: 'tr-dl-3',
      title: 'Package Delivery Note',
      text: "We attempted to deliver your package today, but no one was available to receive it. It has been left with your building's front desk. Please pick it up within five business days, or it will be returned to the sender.",
      question: "What should the customer do?",
      options: ['Pick up the package at the front desk within five days', 'Wait for a second delivery attempt', 'Contact the sender directly', 'Nothing, it will be redelivered automatically'],
      correct: 0,
      explain: 'La nota indica que el paquete quedó en la recepción del edificio y hay que recogerlo en cinco días hábiles.'
    },
    {
      id: 'tr-dl-4',
      title: "Restaurant Hours Update",
      text: "Starting this weekend, we will be open for breakfast from 8:00 to 11:00 AM on Saturdays and Sundays. Lunch and dinner hours remain unchanged. Reservations for breakfast are not required.",
      question: "What is new about the restaurant's schedule?",
      options: ['Weekend breakfast service', 'Weekday breakfast service', 'Longer dinner hours', 'A reservation requirement'],
      correct: 0,
      explain: 'El texto anuncia el nuevo horario de desayuno los fines de semana; el resto de los horarios no cambia.'
    }
  ],

  academic: [
    {
      id: 'tr-ac-1',
      title: 'Coral Reefs',
      text: "Coral reefs, though they occupy less than one percent of the ocean floor, support roughly a quarter of all known marine species. This disproportionate biodiversity arises largely from the physical complexity of reef structures, which provide countless small habitats for fish, mollusks, and other organisms. However, rising ocean temperatures have made corals increasingly vulnerable to bleaching, a process in which corals expel the algae that give them both color and nutrients.",
      question: "According to the passage, why do coral reefs support so many species despite their small size?",
      options: ['Their complex physical structure creates many small habitats', 'They are located mainly in warm tropical waters', 'They grow faster than most other ocean structures', 'They contain more algae than other ocean environments'],
      correct: 0,
      explain: 'El texto dice que la biodiversidad viene principalmente de la complejidad física de los arrecifes, que crea muchos hábitats pequeños.'
    },
    {
      id: 'tr-ac-2',
      title: 'Urban Heat Islands',
      text: "Cities tend to be noticeably warmer than surrounding rural areas, a phenomenon known as the urban heat island effect. Concrete, asphalt, and other building materials absorb and retain heat throughout the day, releasing it slowly after sunset. Rural areas, by contrast, are covered largely by vegetation and soil, which reflect more sunlight and retain less heat. City planners have begun addressing this issue by increasing green spaces and using lighter-colored building materials that reflect more sunlight.",
      question: "What is one solution mentioned for reducing the urban heat island effect?",
      options: ['Using lighter-colored building materials', 'Removing all vegetation from cities', 'Building taller structures downtown', 'Increasing the use of asphalt roads'],
      correct: 0,
      explain: 'El texto menciona que los planificadores urbanos están usando materiales de colores claros que reflejan más luz solar.'
    },
    {
      id: 'tr-ac-3',
      title: 'Migratory Birds',
      text: "Many bird species undertake long migrations each year, traveling thousands of kilometers between breeding and wintering grounds. Researchers have found that migratory birds rely on multiple navigational cues, including the position of the sun, the pattern of stars at night, and even the Earth's magnetic field. Young birds making their first migration often travel with more experienced adults, though some species migrate successfully even without ever having made the journey before.",
      question: "What does the passage suggest about some young migratory birds?",
      options: ['They can complete their first migration without adult guidance', 'They always travel with experienced adults', 'They rely only on the position of the sun', 'They cannot migrate until they are fully grown'],
      correct: 0,
      explain: 'El texto dice que algunas especies migran exitosamente incluso sin haber hecho el viaje antes ni ir acompañadas de adultos.'
    },
    {
      id: 'tr-ac-4',
      title: 'The Printing Press',
      text: "The invention of the movable-type printing press in the fifteenth century dramatically changed how information spread across Europe. Before its invention, books were copied by hand, a slow and expensive process that limited literacy to a small elite. Once printed books became widely available, literacy rates rose, and ideas that had once circulated only among scholars began reaching a much broader public, contributing to major intellectual and religious movements.",
      question: "According to the passage, what was one effect of the printing press?",
      options: ['It made literacy accessible to more people', 'It slowed the spread of scholarly ideas', 'It made books more expensive to produce', 'It reduced the number of books available'],
      correct: 0,
      explain: 'El texto dice que al haber libros impresos disponibles, la alfabetización aumentó y las ideas llegaron a un público más amplio.'
    }
  ]
};

const TOEFL_LISTENING = {
  chooseResponse: [
    {
      id: 'tl-cr-1',
      audioFile: 'audio/toefl/tl-cr-1.mp3',
      transcript: "Do you want to grab lunch before the meeting?",
      question: "What is the best response?",
      options: ["Sure, I have about twenty minutes.", "I finished the report yesterday.", "The meeting room is on the third floor.", "She already left for the airport."],
      correct: 0,
      explain: 'La respuesta natural a una invitación ("Do you want to...?") es aceptar o rechazar, no cambiar de tema.'
    },
    {
      id: 'tl-cr-2',
      audioFile: 'audio/toefl/tl-cr-2.mp3',
      transcript: "I heard the flight got delayed by two hours.",
      question: "What is the best response?",
      options: ["That's frustrating, but at least we found out early.", "I already packed my suitcase.", "The airport has a new terminal.", "We should check in a week before."],
      correct: 0,
      explain: 'La mejor respuesta reacciona directamente a la noticia del retraso del vuelo.'
    },
    {
      id: 'tl-cr-3',
      audioFile: 'audio/toefl/tl-cr-3.mp3',
      transcript: "Could you send me the notes from today's lecture?",
      question: "What is the best response?",
      options: ["Of course, I'll email them to you tonight.", "The lecture starts at nine.", "I forgot my notebook at home.", "She teaches two classes a week."],
      correct: 0,
      explain: 'Es una petición directa; la respuesta natural confirma si se puede ayudar o no.'
    },
    {
      id: 'tl-cr-4',
      audioFile: 'audio/toefl/tl-cr-4.mp3',
      transcript: "This printer has been out of order all week.",
      question: "What is the best response?",
      options: ["Really? I'll ask IT to take a look at it.", "I printed twenty pages yesterday.", "The office closes at six.", "We bought a new printer last year."],
      correct: 0,
      explain: 'La respuesta más natural reacciona al problema mencionado y ofrece una solución.'
    },
    {
      id: 'tl-cr-5',
      audioFile: 'audio/toefl/tl-cr-5.mp3',
      transcript: "Would you mind switching seats with me?",
      question: "What is the best response?",
      options: ["Not at all, which seat would you like?", "The train leaves in ten minutes.", "I already have a ticket.", "This is my first time on this route."],
      correct: 0,
      explain: '"Would you mind...?" es una petición cortés; la respuesta natural acepta o rechaza esa petición.'
    }
  ],

  conversation: [
    {
      id: 'tl-cv-1',
      audioFile: 'audio/toefl/tl-cv-1.mp3',
      transcript: "— Hi, I was wondering if I could get an extension on the essay that's due tomorrow.\n— I see. What's the reason for the request?\n— I've been sick since Monday and I'm behind on the reading too.\n— That's fine, just email me before midnight and I'll extend it to Friday.",
      question: "What does the professor decide?",
      options: ["To give the student until Friday to submit the essay", "To lower the student's grade for being late", "To ask the student to submit the essay tomorrow anyway", "To cancel the assignment for the whole class"],
      correct: 0,
      explain: 'El profesor acepta extender la fecha de entrega hasta el viernes.'
    },
    {
      id: 'tl-cv-2',
      audioFile: 'audio/toefl/tl-cv-2.mp3',
      transcript: "— Excuse me, is this the line for the campus shuttle to the library?\n— Yes, but it's running about fifteen minutes late today because of traffic.\n— Oh, should I just walk instead? I have a class in twenty minutes.\n— If it's close, walking might actually be faster right now.",
      question: "What does the second speaker suggest?",
      options: ["That walking might be faster than waiting", "That the shuttle will arrive on time", "That the class has been cancelled", "That the library is closed today"],
      correct: 0,
      explain: 'La segunda persona sugiere que caminar podría ser más rápido que esperar el shuttle retrasado.'
    },
    {
      id: 'tl-cv-3',
      audioFile: 'audio/toefl/tl-cv-3.mp3',
      transcript: "— Did you finish the group project slides?\n— Almost. I still need to add the data from chapter four.\n— I can send you those numbers tonight if that helps.\n— That would be great, thanks. Then I can finish everything by tomorrow morning.",
      question: "What does the first speaker offer to do?",
      options: ["Send the data from chapter four tonight", "Finish the slides by tomorrow", "Present the project alone", "Ask for more time on the project"],
      correct: 0,
      explain: 'La primera persona se ofrece a mandar los datos del capítulo cuatro esa misma noche.'
    }
  ],

  announcement: [
    {
      id: 'tl-an-1',
      audioFile: 'audio/toefl/tl-an-1.mp3',
      transcript: "Attention passengers. The 3:15 train to Riverside has been delayed and will now depart from platform 6 instead of platform 4. We apologize for any inconvenience and appreciate your patience.",
      question: "What has changed about the 3:15 train?",
      options: ["Its departure platform", "Its final destination", "Its ticket price", "Its departure time"],
      correct: 0,
      explain: 'El anuncio dice que el tren saldrá de la plataforma 6 en vez de la 4; no menciona un cambio de hora.'
    },
    {
      id: 'tl-an-2',
      audioFile: 'audio/toefl/tl-an-2.mp3',
      transcript: "Good morning, everyone. Just a reminder that the annual staff picnic has been moved indoors due to the weather forecast. It will now take place in the main cafeteria starting at noon. Please bring your employee badge for entry.",
      question: "Why was the picnic moved indoors?",
      options: ["Because of the weather forecast", "Because the cafeteria was renovated", "Because too many people signed up", "Because it starts earlier than planned"],
      correct: 0,
      explain: 'El anuncio dice explícitamente que se movió por el pronóstico del clima.'
    },
    {
      id: 'tl-an-3',
      audioFile: 'audio/toefl/tl-an-3.mp3',
      transcript: "Attention shoppers. Our store will be closing in fifteen minutes. Please bring your final selections to the checkout area. We thank you for shopping with us today.",
      question: "What are shoppers being asked to do?",
      options: ["Bring their items to checkout soon", "Return items they don't want", "Wait for a special discount", "Sign up for a rewards card"],
      correct: 0,
      explain: 'El anuncio pide a los clientes llevar sus artículos a la caja porque la tienda va a cerrar.'
    },
    {
      id: 'tl-an-4',
      audioFile: 'audio/toefl/tl-an-4.mp3',
      transcript: "This is a reminder that the library will be closed this Friday for a staff training day. All materials due on Friday can be returned the following Monday without penalty.",
      question: "What can visitors do because of the closure?",
      options: ["Return Friday's due items on Monday without a fee", "Renew books for an extra month", "Pick up new books early", "Attend the staff training"],
      correct: 0,
      explain: 'El anuncio dice que los materiales que vencen el viernes se pueden devolver el lunes sin multa.'
    }
  ],

  academicTalk: [
    {
      id: 'tl-at-1',
      audioFile: 'audio/toefl/tl-at-1.mp3',
      transcript: "Today I want to talk about how plants respond to light, a process called phototropism. When light hits one side of a plant stem more than the other, a hormone called auxin accumulates on the shaded side. This causes the cells on that side to grow faster than the cells on the lit side, and as a result, the stem bends toward the light source.",
      question: "According to the lecture, why does a plant stem bend toward light?",
      options: ["Cells on the shaded side grow faster than cells on the lit side", "Light directly damages the cells on the lit side", "Auxin only exists on the side facing the light", "The stem grows equally on both sides"],
      correct: 0,
      explain: 'La conferencia explica que el auxina se acumula en el lado con sombra, haciendo que esas células crezcan más rápido, y por eso el tallo se dobla hacia la luz.'
    },
    {
      id: 'tl-at-2',
      audioFile: 'audio/toefl/tl-at-2.mp3',
      transcript: "Let's discuss supply and demand. When the supply of a product increases while demand stays the same, the price of that product typically falls. This happens because sellers have more of the product than buyers are willing to purchase at the original price, so sellers lower prices to attract more buyers.",
      question: "What happens when supply increases but demand stays the same?",
      options: ["Prices typically fall", "Prices typically rise", "Demand automatically increases", "Sellers stop producing the product"],
      correct: 0,
      explain: 'La conferencia dice que cuando la oferta sube y la demanda se mantiene igual, los precios normalmente bajan.'
    },
    {
      id: 'tl-at-3',
      audioFile: 'audio/toefl/tl-at-3.mp3',
      transcript: "One interesting feature of many ant species is division of labor. Rather than each ant performing every task, colonies divide work among different groups: some ants forage for food, others care for the young, and others defend the nest. This specialization allows the colony as a whole to function more efficiently than if every ant did a bit of everything.",
      question: "According to the lecture, what is one benefit of division of labor in ant colonies?",
      options: ["The colony functions more efficiently overall", "Every ant becomes able to do every task", "The colony needs fewer ants to survive", "Ants no longer need to defend the nest"],
      correct: 0,
      explain: 'La conferencia dice que dividir el trabajo permite que la colonia funcione de forma más eficiente en conjunto.'
    },
    {
      id: 'tl-at-4',
      audioFile: 'audio/toefl/tl-at-4.mp3',
      transcript: "Today's topic is memory consolidation during sleep. Research suggests that while we sleep, the brain replays and strengthens connections formed during the day, transferring information from short-term to long-term memory. This is one reason students who sleep well after studying tend to retain information better than those who stay up all night.",
      question: "According to the lecture, what happens to memories during sleep?",
      options: ["They are strengthened and transferred to long-term memory", "They are mostly forgotten by the brain", "They stay only in short-term memory", "They are replaced by new information"],
      correct: 0,
      explain: 'La conferencia explica que el cerebro fortalece y transfiere la información de la memoria de corto a largo plazo durante el sueño.'
    }
  ]
};

const TOEFL_SPEAKING = {
  // "Listen and Repeat": escuchas una frase y la repites en voz alta.
  // Usa el mismo patrón que ya existe en Speaking del sitio (escuchar +
  // grabarte + comparar), solo que aquí las frases suben de dificultad.
  listenRepeat: [
    { id: 'ts-lr-1', audioFile: 'audio/toefl/ts-lr-1.mp3', sentence: "I need a glass of water.", translation: "Necesito un vaso de agua." },
    { id: 'ts-lr-2', audioFile: 'audio/toefl/ts-lr-2.mp3', sentence: "Could you tell me where the nearest bank is?", translation: "¿Podrías decirme dónde está el banco más cercano?" },
    { id: 'ts-lr-3', audioFile: 'audio/toefl/ts-lr-3.mp3', sentence: "I've been working on this project for almost three weeks.", translation: "He estado trabajando en este proyecto por casi tres semanas." },
    { id: 'ts-lr-4', audioFile: 'audio/toefl/ts-lr-4.mp3', sentence: "If I had known about the schedule change, I would have arrived earlier.", translation: "Si hubiera sabido del cambio de horario, habría llegado más temprano." },
    { id: 'ts-lr-5', audioFile: 'audio/toefl/ts-lr-5.mp3', sentence: "The committee is expected to announce its final decision by the end of the month.", translation: "Se espera que el comité anuncie su decisión final para fin de mes." },
    { id: 'ts-lr-6', audioFile: 'audio/toefl/ts-lr-6.mp3', sentence: "Despite the challenges we faced, the team managed to complete the report on time.", translation: "A pesar de los retos que enfrentamos, el equipo logró terminar el reporte a tiempo." }
  ],

  // "Take an Interview": una pregunta simulada de entrevista. Te grabas
  // respondiendo; no hay una "respuesta correcta" (es una tarea abierta,
  // igual de honesto que el resto de Speaking del sitio), solo ideas
  // guía de qué podría incluir una buena respuesta.
  interview: [
    {
      id: 'ts-iv-1',
      audioFile: 'audio/toefl/ts-iv-1.mp3',
      question: "Tell me a little about yourself and what you do.",
      sampleAnswer: "Puedes mencionar tu trabajo o tus estudios, de dónde eres, y algo que te guste hacer en tu tiempo libre."
    },
    {
      id: 'ts-iv-2',
      audioFile: 'audio/toefl/ts-iv-2.mp3',
      question: "What do you like to do on the weekends?",
      sampleAnswer: "Describe una o dos actividades, y explica brevemente por qué las disfrutas."
    },
    {
      id: 'ts-iv-3',
      audioFile: 'audio/toefl/ts-iv-3.mp3',
      question: "Describe a place you would like to visit someday and explain why.",
      sampleAnswer: "Nombra el lugar y da una o dos razones específicas por las que quieres ir."
    },
    {
      id: 'ts-iv-4',
      audioFile: 'audio/toefl/ts-iv-4.mp3',
      question: "What is one skill you would like to improve, and how would you go about it?",
      sampleAnswer: "Nombra una habilidad específica y describe un paso concreto que podrías tomar para mejorarla."
    }
  ]
};

const TOEFL_WRITING = {
  // "Build a Sentence": arma la frase en el orden correcto. "words" ya
  // está en el orden correcto (el motor lo revuelve al mostrarlo).
  buildSentence: [
    { id: 'tw-bs-1', words: ['She', 'always', 'drinks', 'coffee', 'in', 'the', 'morning.'], translation: "Ella siempre toma café en la mañana." },
    { id: 'tw-bs-2', words: ['We', 'have', 'been', 'waiting', 'for', 'an', 'hour.'], translation: "Hemos estado esperando por una hora." },
    { id: 'tw-bs-3', words: ['If', 'it', 'rains', 'tomorrow,', 'we', 'will', 'stay', 'home.'], translation: "Si llueve mañana, nos quedaremos en casa." },
    { id: 'tw-bs-4', words: ['The', 'report', 'must', 'be', 'finished', 'by', 'Friday.'], translation: "El reporte debe estar terminado para el viernes." },
    { id: 'tw-bs-5', words: ['Neither', 'John', 'nor', 'Mary', 'attended', 'the', 'meeting.'], translation: "Ni John ni Mary asistieron a la reunión." },
    { id: 'tw-bs-6', words: ['Students', 'who', 'study', 'regularly', 'tend', 'to', 'perform', 'better.'], translation: "Los estudiantes que estudian regularmente tienden a rendir mejor." }
  ],

  email: [
    {
      id: 'tw-em-1',
      prompt: "You are unable to attend a meeting scheduled for tomorrow. Write a short email to your supervisor explaining that you cannot attend and asking to reschedule.",
      example: "Subject: Unable to Attend Tomorrow's Meeting\n\nHi Mr. Diaz,\n\nI'm writing to let you know that I won't be able to attend tomorrow's meeting due to a scheduling conflict. Would it be possible to reschedule for later this week? I'm available Thursday afternoon or Friday morning.\n\nThank you for understanding.\n\nBest regards,\nAlex",
      checklist: ["Explica claramente por qué no puedes asistir", "Pide reprogramar la reunión", "Ofrece opciones de horario si puedes", "Usa un saludo y despedida apropiados para el trabajo"]
    },
    {
      id: 'tw-em-2',
      prompt: "You recently bought a product online, but it arrived damaged. Write a short email to customer service explaining the problem and asking for a replacement or refund.",
      example: "Subject: Damaged Item - Order #48213\n\nHello,\n\nI received my order today, but the item arrived with a large crack on one side. I'd like to request a replacement, or a refund if a replacement isn't available. I've attached a photo of the damage.\n\nPlease let me know how to proceed.\n\nThank you,\nJordan",
      checklist: ["Describe el problema con claridad", "Pide una solución específica (reemplazo o reembolso)", "Menciona información útil como el número de orden", "Mantiene un tono cortés y profesional"]
    },
    {
      id: 'tw-em-3',
      prompt: "You want to join a study group for an upcoming exam. Write a short email to a classmate proposing to form a study group and suggesting a time to meet.",
      example: "Subject: Study Group for the Exam?\n\nHi Sam,\n\nI was thinking of putting together a small study group before the exam next week. Would you be interested in joining? I was thinking we could meet Wednesday evening at the library, if that works for you.\n\nLet me know what you think!\n\nBest,\nTaylor",
      checklist: ["Propone claramente formar un grupo de estudio", "Sugiere un día y lugar específico", "Usa un tono amigable pero claro", "Termina pidiendo la opinión del destinatario"]
    }
  ],

  discussion: [
    {
      id: 'tw-disc-1',
      professorPrompt: "Some people believe that university students should be required to take courses outside their major (for example, an engineering student taking an art class). Others believe students should focus only on courses related to their major. What is your opinion?",
      classmatePosts: [
        "I think students should focus only on their major. Four years isn't enough time to become an expert, so every class should count toward that goal.",
        "I disagree. Some of my most useful skills, like public speaking, came from classes outside my major."
      ],
      example: "I agree with the second view. While specializing is important, courses outside your major can teach skills like communication and critical thinking that apply to almost any career. A well-rounded education often makes graduates more adaptable in the long run.",
      checklist: ["Da tu propia opinión claramente", "Menciona al menos una razón que la apoye", "Puedes referirte a lo que dijeron tus compañeros", "Usa entre 3 y 5 oraciones aproximadamente"]
    },
    {
      id: 'tw-disc-2',
      professorPrompt: "Some people prefer to work for a large company, while others prefer to work for a small company or start-up. Which do you think offers more advantages, and why?",
      classmatePosts: [
        "Large companies usually offer more job security and better benefits, which matters a lot to me.",
        "I'd rather work at a small company. You get to do more different types of work and your ideas matter more."
      ],
      example: "I lean toward small companies too. Even though large companies offer stability, smaller teams usually give employees more responsibility early on, which helps them grow faster professionally.",
      checklist: ["Da tu propia opinión claramente", "Menciona al menos una razón que la apoye", "Puedes referirte a lo que dijeron tus compañeros", "Usa entre 3 y 5 oraciones aproximadamente"]
    },
    {
      id: 'tw-disc-3',
      professorPrompt: "Some students prefer to study alone, while others prefer to study in groups. In your opinion, which is more effective for learning?",
      classmatePosts: [
        "Studying alone works better for me because I can focus without distractions and go at my own pace.",
        "I prefer groups. Explaining concepts to others actually helps me understand the material better."
      ],
      example: "I think it depends on the subject, but overall I agree that group study can be very effective, especially because explaining an idea to someone else often reveals gaps in your own understanding.",
      checklist: ["Da tu propia opinión claramente", "Menciona al menos una razón que la apoye", "Puedes referirte a lo que dijeron tus compañeros", "Usa entre 3 y 5 oraciones aproximadamente"]
    }
  ]
};
