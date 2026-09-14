// ============================================================
// Inglés con Leo — Contenido de práctica para Cambridge English
//
// IMPORTANTE (léelo antes de agregar más contenido):
// Cambridge English no es un solo examen: es una familia de exámenes
// por nivel (A2 Key, B1 Preliminary, B2 First, C1 Advanced, C2
// Proficiency), cada uno con su propio formato. Esta sección practica
// específicamente **B2 First (FCE)**, el más solicitado por escuelas,
// trabajos y trámites migratorios, con el formato vigente confirmado
// en cambridgeenglish.org en 2026:
//
//   Reading & Use of English   7 partes, 52 preguntas, 1h15, 40% de la nota
//   Writing                    2 partes, 140-190 palabras c/u, 1h20, 20%
//   Listening                  4 partes, 30 preguntas, ~40 min, cada audio se
//                              escucha DOS veces en el examen real
//   Speaking                   4 partes, ~14 min, en pareja con 2 examinadores
//
// Escala de puntuación (Cambridge English Scale): 180-190 = Grade A
// (equivalente a C1), 173-179 = Grade B, 160-172 = Grade C (aprobado,
// certificado B2), 140-159 = certificado B1. El puntaje mínimo para
// aprobar B2 First es 160.
//
// Este contenido practica los MISMOS TIPOS de tarea reales de cada
// parte, con ejemplos representativos escritos para este sitio (no es
// una copia de un examen real de Cambridge, cuyos exámenes son
// material protegido). La idea es que si dominas estos tipos de
// tarea, el formato del examen real no te tome por sorpresa.
//
// Estructura por sección (cada una es un objeto con "subtipos"):
//   CAMBRIDGE_READING.multipleChoiceCloze / .openCloze / .wordFormation /
//                     .keyWordTransformation / .readingComprehension /
//                     .multipleMatching
//   CAMBRIDGE_LISTENING.shortExtract / .sentenceCompletion /
//                       .multipleMatching / .longInterview
//   CAMBRIDGE_WRITING.essay / .article / .email / .review
//   CAMBRIDGE_SPEAKING.interview / .longTurn / .collaborativeTask /
//                      .furtherDiscussion
// ============================================================

const CAMBRIDGE_READING = {
  // Parte 1 real: multiple-choice cloze (vocabulario). Un texto con 8
  // huecos y 4 opciones por hueco. Aquí cada item practica un hueco.
  multipleChoiceCloze: [
    {
      id: 'cr-mc-1',
      sentence: "The company has decided to ___ its marketing budget for next year.",
      options: ['increase', 'increased', 'increasing', 'increases'],
      correct: 0,
      explain: 'Después de "decided to" va el verbo en su forma base: "to increase".'
    },
    {
      id: 'cr-mc-2',
      sentence: "She apologized ___ arriving late to the meeting.",
      options: ['for', 'of', 'about', 'to'],
      correct: 0,
      explain: 'La expresión correcta es "apologize for something": "apologized for arriving late".'
    },
    {
      id: 'cr-mc-3',
      sentence: "By the time we arrived, the film had already ___.",
      options: ['started', 'start', 'starting', 'starts'],
      correct: 0,
      explain: 'Con el pasado perfecto ("had already") va el participio pasado: "had already started".'
    },
    {
      id: 'cr-mc-4',
      sentence: "It's important to ___ attention to detail in this job.",
      options: ['pay', 'make', 'do', 'take'],
      correct: 0,
      explain: 'La colocación correcta en inglés es "pay attention", no "make/do/take attention".'
    }
  ],

  // Parte 2 real: open cloze (gramática). Huecos sin opciones, pero
  // aquí usamos un banco de palabras para que sea interactivo.
  openCloze: [
    {
      id: 'cr-oc-1',
      sentence: ["I've", "lived", "in", "this", "city", "___", "five", "years."],
      bank: ['for', 'since', 'during', 'while'],
      correct: 'for',
      explain: '"For" se usa con una duración de tiempo ("for five years"); "since" se usaría con un punto de partida ("since 2021").'
    },
    {
      id: 'cr-oc-2',
      sentence: ["She's", "the", "person", "___", "helped", "me", "move", "last", "weekend."],
      bank: ['who', 'which', 'whose', 'whom'],
      correct: 'who',
      explain: '"Who" es el pronombre relativo correcto para referirse a una persona como sujeto de la oración.'
    },
    {
      id: 'cr-oc-3',
      sentence: ["___", "of", "the", "students", "passed", "the", "final", "exam."],
      bank: ['Most', 'Much', 'Every', 'Few'],
      correct: 'Most',
      explain: '"Most of the students" (la mayoría de los estudiantes) es correcto con sustantivos plurales contables.'
    },
    {
      id: 'cr-oc-4',
      sentence: ["He", "would", "have", "called", "you", "___", "he", "had", "known", "your", "number."],
      bank: ['if', 'unless', 'although', 'because'],
      correct: 'if',
      explain: 'Esta es una tercera condicional ("would have called... if... had known"): "if" introduce la condición no cumplida.'
    }
  ],

  // Parte 3 real: word formation. Se da una palabra raíz y hay que
  // transformarla a la forma correcta (sustantivo, adjetivo, etc.).
  wordFormation: [
    {
      id: 'cr-wf-1',
      sentence: "Her sudden ___ surprised everyone at the party.",
      rootWord: 'APPEAR',
      options: ['appearance', 'appearing', 'appeared', 'disappear'],
      correct: 0,
      explain: 'Se necesita un sustantivo después de "sudden": "appearance" (aparición).'
    },
    {
      id: 'cr-wf-2',
      sentence: "Making that ___ wasn't easy for him.",
      rootWord: 'DECIDE',
      options: ['decision', 'decisive', 'deciding', 'undecided'],
      correct: 0,
      explain: 'Se necesita el sustantivo "decision" (decisión), objeto del verbo "making".'
    },
    {
      id: 'cr-wf-3',
      sentence: "She spoke about her childhood with real ___.",
      rootWord: 'HAPPY',
      options: ['happiness', 'happily', 'unhappy', 'happier'],
      correct: 0,
      explain: 'Después de "real" se necesita un sustantivo: "happiness" (felicidad).'
    },
    {
      id: 'cr-wf-4',
      sentence: "The project encouraged ___ among the students.",
      rootWord: 'CREATE',
      options: ['creativity', 'creative', 'creation', 'recreate'],
      correct: 0,
      explain: '"Creativity" (creatividad) es el sustantivo abstracto correcto aquí; "creation" se refiere a algo creado, no a la cualidad.'
    }
  ],

  // Parte 4 real: key word transformation. Se da una oración, una
  // "palabra clave" que no se puede cambiar, y hay que completar una
  // segunda oración con el mismo significado.
  keyWordTransformation: [
    {
      id: 'cr-kt-1',
      original: "I haven't seen my cousin for three years.",
      keyword: 'SINCE',
      sentence: "It ___ my cousin.",
      options: ["'s three years since I saw", "was three years I saw", "has three years since seeing", "is three years I have seen"],
      correct: 0,
      explain: '"It\'s + [tiempo] + since + [pasado simple]" es la estructura correcta: "It\'s three years since I saw my cousin."'
    },
    {
      id: 'cr-kt-2',
      original: "It's not necessary for you to attend the meeting.",
      keyword: 'HAVE',
      sentence: "You ___ the meeting.",
      options: ["don't have to attend", "haven't to attend", "mustn't attend", "don't have attend"],
      correct: 0,
      explain: '"Don\'t have to" expresa que algo no es necesario, justo el significado de la oración original. "Mustn\'t" significaría prohibición, no lo mismo.'
    },
    {
      id: 'cr-kt-3',
      original: "She started working here five years ago.",
      keyword: 'FOR',
      sentence: "She ___ here for five years.",
      options: ['has worked', 'is working', 'worked', 'had worked'],
      correct: 0,
      explain: 'Una acción que empezó en el pasado y continúa hasta ahora se expresa con presente perfecto: "has worked".'
    },
    {
      id: 'cr-kt-4',
      original: "\"Don't touch that,\" the teacher said to the boy.",
      keyword: 'TOLD',
      sentence: "The teacher ___ that.",
      options: ['told the boy not to touch', 'told the boy to not touching', 'told to the boy don\'t touch', 'told the boy didn\'t touch'],
      correct: 0,
      explain: 'El estilo indirecto de una orden negativa usa "told someone not to + verbo base": "told the boy not to touch".'
    }
  ],

  // Parte 5 real: multiple choice reading comprehension sobre un
  // texto más largo.
  readingComprehension: [
    {
      id: 'cr-rc-1',
      title: 'The Rise of Remote Work',
      text: "In the past few years, many companies have shifted toward hybrid or fully remote working arrangements. While some employees appreciate the flexibility of working from home, others report feeling isolated without the daily social contact of an office. Employers have had to rethink how they measure productivity, often focusing on results rather than hours spent at a desk. Some businesses now offer occasional in-person gatherings specifically to rebuild the sense of team connection that remote work can weaken.",
      question: "According to the passage, why have some employers started organizing in-person gatherings?",
      options: ['To rebuild a sense of team connection', 'To measure how many hours employees work', 'To replace remote work completely', 'To reduce office costs'],
      correct: 0,
      explain: 'El texto dice que estas reuniones buscan específicamente "reconstruir el sentido de conexión de equipo" que el trabajo remoto puede debilitar.'
    },
    {
      id: 'cr-rc-2',
      title: 'Urban Beekeeping',
      text: "Keeping bees on city rooftops has become increasingly popular in recent years, driven partly by growing awareness of declining bee populations worldwide. Urban environments can actually offer bees a surprising variety of flowering plants across parks, gardens, and balconies, sometimes with fewer pesticides than in some agricultural areas. However, city beekeepers must follow strict local regulations, since hives placed too close to walkways can pose a risk to passersby who are allergic to stings.",
      question: "What does the passage suggest is an advantage of keeping bees in cities?",
      options: ['Urban areas can have a wide variety of flowers with fewer pesticides', 'Cities have fewer regulations than farms', 'Bees in cities never risk stinging people', 'Rooftop hives require no maintenance'],
      correct: 0,
      explain: 'El texto menciona que los ambientes urbanos pueden ofrecer "una variedad sorprendente de plantas con flores... a veces con menos pesticidas".'
    },
    {
      id: 'cr-rc-3',
      title: 'The Podcast Boom',
      text: "Podcasts have grown from a niche hobby into a mainstream form of entertainment and information, with shows covering everything from true crime to personal finance. Part of their appeal lies in convenience: listeners can tune in while commuting, exercising, or doing household chores, unlike television or reading, which usually demand full attention. Advertisers have taken notice too, and many podcasts now generate significant revenue through sponsorships, something that was rare in the medium's early years.",
      question: "According to the passage, what makes podcasts particularly convenient compared to other media?",
      options: ['People can listen while doing other activities', 'They are always shorter than TV shows', 'They require no internet connection', 'They never include advertising'],
      correct: 0,
      explain: 'El texto explica que los oyentes pueden escuchar "mientras van al trabajo, hacen ejercicio o quehaceres", a diferencia de otros medios que requieren atención completa.'
    },
    {
      id: 'cr-rc-4',
      title: 'Minimalism as a Lifestyle',
      text: "Minimalism, the practice of deliberately owning fewer possessions, has attracted a growing following among people seeking to reduce stress and simplify their daily routines. Advocates argue that constantly acquiring new items can create a cycle of dissatisfaction, since the initial excitement of a purchase quickly fades. Critics, however, point out that minimalism is easier to adopt for people who already have financial security, since it assumes a level of comfort that not everyone can afford to walk away from.",
      question: "What criticism of minimalism does the passage mention?",
      options: ['It is easier to adopt for people who are already financially secure', 'It requires spending large amounts of money', 'It makes people more stressed than before', 'It has no long-term benefits at all'],
      correct: 0,
      explain: 'El texto dice que los críticos señalan que el minimalismo "es más fácil de adoptar para personas que ya tienen seguridad financiera".'
    }
  ],

  // Parte 7 real: multiple matching. Un texto breve describe a varias
  // personas y hay que identificar a quién corresponde una afirmación.
  multipleMatching: [
    {
      id: 'cr-mm-1',
      paragraph: "Four friends talk about their ideal vacation. Ana says she needs total silence and a beach with no crowds to really relax. Marco prefers cities full of museums and history, even if that means long lines and busy streets. Sofia can't imagine a trip without hiking a mountain trail every single day. Luis just wants to try as many local foods as possible, wherever he goes.",
      question: "Who would probably enjoy a trip built entirely around visiting local restaurants and street food markets?",
      options: ['Ana', 'Marco', 'Sofia', 'Luis'],
      correct: 3,
      explain: 'Luis dice que solo quiere "probar tantas comidas locales como sea posible", así que un viaje enfocado en comida sería ideal para él.'
    },
    {
      id: 'cr-mm-2',
      paragraph: "Four coworkers share their views on work-life balance. Diego believes checking email after hours is fine as long as it's occasional. Carla refuses to open any work messages once she leaves the office. Priya thinks the real problem isn't hours worked but how meetings are scheduled. Tomas says he actually prefers working late because mornings are unproductive for him.",
      question: "Who thinks that the timing of meetings, not the number of hours worked, is the real issue?",
      options: ['Diego', 'Carla', 'Priya', 'Tomas'],
      correct: 2,
      explain: 'Priya opina que "el verdadero problema no son las horas trabajadas sino cómo se programan las juntas".'
    },
    {
      id: 'cr-mm-3',
      paragraph: "Four students describe how they study for exams. Beatriz reviews her notes every single night, a little at a time, rather than all at once before a test. Hugo prefers studying in groups so he can explain concepts out loud to others. Elena needs total silence and a clean desk before she can focus on anything. Rafael records himself reading his notes and listens back while commuting.",
      question: "Who studies mainly by listening to recordings rather than reading?",
      options: ['Beatriz', 'Hugo', 'Elena', 'Rafael'],
      correct: 3,
      explain: 'Rafael se graba a sí mismo leyendo sus apuntes y escucha esas grabaciones, en vez de leer directamente.'
    },
    {
      id: 'cr-mm-4',
      paragraph: "Four people discuss social media. Valentina says she only uses it to keep in touch with family who live abroad. Mateo admits he checks it constantly out of habit, even when there's nothing new to see. Camila deleted every app a year ago and says she doesn't miss it at all. Andres uses it exclusively to promote his small business.",
      question: "Who removed social media from their life completely and has no regrets about it?",
      options: ['Valentina', 'Mateo', 'Camila', 'Andres'],
      correct: 2,
      explain: 'Camila eliminó todas las aplicaciones hace un año y dice que "no la extraña para nada".'
    }
  ]
};

const CAMBRIDGE_LISTENING = {
  // Parte 1 real: extractos cortos, cada uno con una pregunta de
  // opción múltiple. Suele haber interacción entre dos personas.
  shortExtract: [
    {
      id: 'cl-se-1',
      audioFile: 'audio/cambridge/cb-se-1.mp3',
      transcript: "— Hi, I'd like to change my reservation for tonight from a table for two to a table for four, if that's possible.\n— Let me check... yes, we can do that, but it would have to be at 8:30 instead of 7:30, since we're fully booked at your original time.\n— That works for us, thank you.\n— Great, I've updated it. See you tonight.",
      question: "What does the restaurant need to change in order to accommodate the request?",
      options: ['The time of the reservation', 'The location of the table', 'The number of nights booked', 'The name on the reservation'],
      correct: 0,
      explain: 'Para aumentar la mesa de dos a cuatro personas, el restaurante solo puede ofrecerla a las 8:30 en vez de las 7:30; lo que cambia es la hora.'
    },
    {
      id: 'cl-se-2',
      audioFile: 'audio/cambridge/cb-se-2.mp3',
      transcript: "— The printer on the third floor is jammed again, and I have a report due in ten minutes.\n— Try the one in the marketing office, it's usually free this early.\n— Good idea, thanks. Do you know if it needs a code to use?\n— No, just walk in, nobody will mind.",
      question: "What does the second speaker suggest doing?",
      options: ['Using a different printer', 'Waiting for the jam to be fixed', 'Sending the report by email instead', 'Asking IT for help'],
      correct: 0,
      explain: 'El segundo hablante sugiere "intenta con la de la oficina de marketing", es decir, usar otra impresora.'
    },
    {
      id: 'cl-se-3',
      audioFile: 'audio/cambridge/cb-se-3.mp3',
      transcript: "— I'm thinking about canceling my gym membership, I barely go anymore.\n— Before you do that, have you checked if they offer a pause option? A friend of mine froze hers for two months instead of canceling.\n— Really? I didn't know that was possible. I'll ask at the front desk.\n— It's usually cheaper than starting a new membership later too.",
      question: "What does the second speaker recommend the first speaker do?",
      options: ['Ask about pausing the membership instead of canceling', 'Cancel the membership immediately', 'Switch to a cheaper gym', 'Start going more often before canceling'],
      correct: 0,
      explain: 'El segundo hablante sugiere preguntar por "la opción de pausar" en vez de cancelar por completo.'
    },
    {
      id: 'cl-se-4',
      audioFile: 'audio/cambridge/cb-se-4.mp3',
      transcript: "— I'd like to return these shoes, they don't fit properly.\n— No problem, do you have the receipt?\n— I do, but it's been about three weeks since I bought them, is that still okay?\n— Yes, our return policy is thirty days, so you're within the limit. Would you like a refund or store credit?",
      question: "Why does the customer ask about the timing of the return?",
      options: ['To make sure the return still qualifies under the store policy', 'To ask for a discount on a new pair', 'To find out when the store closes', 'To check if the shoes are still in stock'],
      correct: 0,
      explain: 'La clienta pregunta si todavía puede devolver el producto después de tres semanas, es decir, si sigue dentro del plazo permitido.'
    }
  ],

  // Parte 2 real: sentence completion sobre un monólogo (una sola voz).
  sentenceCompletion: [
    {
      id: 'cl-sc-1',
      audioFile: 'audio/cambridge/cb-sc-1.mp3',
      transcript: "Good morning, listeners. Today will start off cloudy with a chance of light rain in the early morning, but conditions should clear up by early afternoon, with sunny skies expected for the rest of the day.",
      translation: "Buenos días, oyentes. El día comenzará nublado con posibilidad de lluvia ligera en la mañana, pero debería despejar para la primera parte de la tarde, con cielos soleados el resto del día.",
      sentence: ["The weather is expected to clear up by", "___", "."],
      bank: ['early afternoon', 'late evening', 'midnight', 'early morning'],
      correct: 'early afternoon',
      explain: 'El locutor dice que las condiciones deberían despejar "by early afternoon" (para la primera parte de la tarde).'
    },
    {
      id: 'cl-sc-2',
      audioFile: 'audio/cambridge/cb-sc-2.mp3',
      transcript: "Welcome to the museum's audio guide. As you enter this room, you'll notice the collection is arranged chronologically, starting with pieces from the fourteenth century on your left and ending with contemporary work near the exit.",
      translation: "Bienvenido a la audioguía del museo. Al entrar a esta sala, notarás que la colección está organizada cronológicamente, empezando con piezas del siglo catorce a tu izquierda y terminando con obra contemporánea cerca de la salida.",
      sentence: ["The oldest pieces in the collection are located on the", "___", "."],
      bank: ['left', 'right', 'ceiling', 'floor'],
      correct: 'left',
      explain: 'La guía dice que las piezas más antiguas, del siglo catorce, están "a tu izquierda" al entrar.'
    },
    {
      id: 'cl-sc-3',
      audioFile: 'audio/cambridge/cb-sc-3.mp3',
      transcript: "Attention passengers, flight 482 to Chicago is now ready for boarding. Passengers seated in rows twenty and above, please proceed to gate fourteen first, followed by the remaining rows shortly after.",
      translation: "Atención pasajeros, el vuelo 482 a Chicago ya está listo para abordar. Los pasajeros en las filas veinte en adelante, por favor procedan a la puerta catorce primero, seguidos por el resto de las filas poco después.",
      sentence: ["Passengers should board through gate", "___", "."],
      bank: ['fourteen', 'twenty', 'four', 'forty'],
      correct: 'fourteen',
      explain: 'El anuncio indica claramente "proceed to gate fourteen" (procedan a la puerta catorce).'
    },
    {
      id: 'cl-sc-4',
      audioFile: 'audio/cambridge/cb-sc-4.mp3',
      transcript: "Before we begin today's lecture, I want to remind everyone that the midterm essay is due next Friday, not this Friday as originally stated on the syllabus, due to the schedule change we discussed last week.",
      translation: "Antes de empezar la clase de hoy, quiero recordarles que el ensayo de medio semestre se entrega el próximo viernes, no este viernes como decía originalmente el programa, debido al cambio de horario que comentamos la semana pasada.",
      sentence: ["The essay deadline was changed to", "___", "Friday."],
      bank: ['next', 'this', 'last', 'every'],
      correct: 'next',
      explain: 'El profesor aclara que la fecha correcta es "next Friday" (el próximo viernes), no la semana en curso.'
    }
  ],

  // Parte 3 real: multiple matching sobre monólogos cortos (aquí,
  // identificar el tema principal de cada uno).
  multipleMatching: [
    {
      id: 'cl-mm-1',
      audioFile: 'audio/cambridge/cb-mm-1.mp3',
      transcript: "I got into photography almost by accident, actually. My sister left an old camera at my place after a visit, and I just started taking pictures of random things around the house out of boredom. Within a few months I was spending every weekend outdoors looking for interesting light and shadows.",
      question: "What is the speaker mainly talking about?",
      options: ['How they discovered a new hobby', 'A trip they took with their sister', 'Buying a new camera', 'A photography class they took'],
      correct: 0,
      explain: 'El hablante describe cómo empezó a interesarse por la fotografía casi por accidente, es decir, cómo descubrió un nuevo pasatiempo.'
    },
    {
      id: 'cl-mm-2',
      audioFile: 'audio/cambridge/cb-mm-2.mp3',
      transcript: "We had planned every detail of the trip months in advance, but the moment we landed, our luggage was missing. Instead of panicking, we decided to just buy a few essentials and treat the first two days as an unplanned adventure, which ended up being the part of the trip we talk about the most.",
      question: "What is the speaker mainly talking about?",
      options: ['An unexpected problem during a trip', 'Planning a trip for the first time', 'A trip they had to cancel', 'Losing a passport at the airport'],
      correct: 0,
      explain: 'El hablante cuenta un problema inesperado (el equipaje perdido) durante un viaje que habían planeado con anticipación.'
    },
    {
      id: 'cl-mm-3',
      audioFile: 'audio/cambridge/cb-mm-3.mp3',
      transcript: "After eight years at the same company, I finally decided it was time for something different. It wasn't an easy decision, since I had a stable salary and knew exactly what was expected of me every day, but I felt like I had stopped learning anything new.",
      question: "What is the speaker mainly talking about?",
      options: ['Deciding to leave a long-held job', 'Getting a promotion at work', 'Starting their first job', 'Losing their job unexpectedly'],
      correct: 0,
      explain: 'El hablante explica por qué decidió dejar un trabajo que tuvo durante ocho años, aunque era una decisión difícil.'
    },
    {
      id: 'cl-mm-4',
      audioFile: 'audio/cambridge/cb-mm-4.mp3',
      transcript: "I never thought of myself as a morning person, but a friend convinced me to try running before work instead of after. The first week was miserable, honestly, but now I can't imagine starting my day any other way.",
      question: "What is the speaker mainly talking about?",
      options: ['Changing the time of day they exercise', 'Training for a marathon', 'Convincing a friend to exercise', 'Quitting a fitness routine'],
      correct: 0,
      explain: 'El hablante describe cómo cambió el horario en que sale a correr, de después del trabajo a antes, por sugerencia de un amigo.'
    }
  ],

  // Parte 4 real: entrevista o discusión más larga, con preguntas de
  // opción múltiple.
  longInterview: [
    {
      id: 'cl-li-1',
      audioFile: 'audio/cambridge/cb-li-1.mp3',
      transcript: "— So tell us, what made you finally decide to start your own business after working for other people for so long?\n— Honestly, it was a mix of things. I'd been saving for years, and I kept noticing the same gap in the market that nobody seemed to be filling. At some point I realized that if I didn't try it then, I probably never would.\n— And was the transition as difficult as people say it is?\n— Much harder than I expected, actually. The hardest part wasn't the money, it was learning to make every single decision myself, without a team to fall back on.",
      question: "According to the speaker, what was the hardest part of starting the business?",
      options: ['Having to make every decision alone', 'Not having enough money saved', 'Finding a gap in the market', 'Convincing others to invest'],
      correct: 0,
      explain: 'El hablante dice directamente que lo más difícil "no fue el dinero, fue aprender a tomar cada decisión yo mismo", sin un equipo de apoyo.'
    },
    {
      id: 'cl-li-2',
      audioFile: 'audio/cambridge/cb-li-2.mp3',
      transcript: "— Your new album sounds quite different from your earlier work. Was that intentional?\n— Very much so. I wanted to move away from the sound people expected from me, even though I knew some longtime fans might not love that at first.\n— Were you worried about how it would be received?\n— A little, but at some point you have to make the music that feels honest to you rather than the music you think people want to hear, or you'll never grow as an artist.",
      question: "Why did the musician decide to change their sound?",
      options: ['To make music that felt more honest to them', 'Because their record label required it', 'To please their longtime fans', 'Because their old sound was no longer popular'],
      correct: 0,
      explain: 'El músico dice que en algún momento hay que "hacer la música que se sienta honesta para ti", en vez de la que se cree que la gente quiere escuchar.'
    },
    {
      id: 'cl-li-3',
      audioFile: 'audio/cambridge/cb-li-3.mp3',
      transcript: "— Can you explain, in simple terms, what your research is actually trying to find out?\n— Sure. We're studying how certain plants respond to short periods of drought, to understand which ones recover fastest once water becomes available again. The goal is to help farmers choose crops that are more resilient as weather patterns become less predictable.\n— How long has this project been running?\n— About four years now, though we expect to keep collecting data for at least another two before we can draw solid conclusions.",
      question: "What is the main goal of the scientist's research?",
      options: ['To help farmers choose more drought-resilient crops', 'To create a new type of fertilizer', 'To measure rainfall patterns worldwide', 'To develop plants that need no water at all'],
      correct: 0,
      explain: 'La científica explica que el objetivo es "ayudar a los agricultores a elegir cultivos más resilientes" ante patrones de clima menos predecibles.'
    },
    {
      id: 'cl-li-4',
      audioFile: 'audio/cambridge/cb-li-4.mp3',
      transcript: "— What does a typical training day look like for you before a big competition?\n— It changes depending on how close we are to the event, but generally I train twice a day, with a long recovery session in between. Sleep is honestly just as important as the training itself.\n— Do you ever take full rest days that close to a competition?\n— Always, at least one a week, no matter what. Skipping rest to train more usually backfires, you end up more tired, not less.",
      question: "According to the athlete, what happens if they skip rest days to train more?",
      options: ['They usually end up more tired', 'They perform better in competitions', 'They recover faster overall', 'Nothing changes either way'],
      correct: 0,
      explain: 'El atleta dice que saltarse el descanso para entrenar más "usualmente sale contraproducente, terminas más cansado, no menos".'
    }
  ]
};

const CAMBRIDGE_WRITING = {
  // Parte 1 real: ensayo obligatorio, con dos ideas dadas y una propia.
  essay: [
    {
      id: 'cw-es-1',
      prompt: "In your English class you have been talking about social media. Now your teacher has asked you to write an essay giving your opinion on the following statement: \"Social media does more harm than good.\" Write your essay using all the notes and give reasons for your point of view. Notes: mental health, staying connected with family.",
      example: "Nowadays, social media is a part of almost everyone's daily life, and opinions about its overall effect are sharply divided.\n\nOn one hand, there is growing evidence linking heavy social media use to anxiety and low self-esteem, especially among teenagers who compare their lives to carefully edited posts from others. This constant comparison can genuinely damage someone's mental health over time.\n\nOn the other hand, social media has made it easier than ever to stay connected with family members who live far away, allowing people to share important moments instantly regardless of distance.\n\nIn my opinion, the platforms themselves are neutral tools; the real issue is how mindfully we use them. With healthier habits, the benefits can outweigh the risks.",
      checklist: ['Menciona los dos puntos dados (salud mental, mantenerse en contacto)', 'Agrega tu propia idea u opinión', 'Usa conectores de contraste (on one hand / on the other hand)', 'Cierra con una conclusión clara de tu opinión']
    },
    {
      id: 'cw-es-2',
      prompt: "In your English class you have been talking about work. Now your teacher has asked you to write an essay giving your opinion on the following statement: \"Working from home is better than working in an office.\" Write your essay using all the notes and give reasons for your point of view. Notes: productivity, teamwork.",
      example: "The debate over remote versus office work has become increasingly relevant since the pandemic changed how many companies operate.\n\nSupporters of working from home often point to productivity: without office distractions and commuting time, many employees report getting more done in less time. There is also more flexibility to organize the day around personal responsibilities.\n\nHowever, teamwork can suffer without regular face-to-face contact. Spontaneous conversations that often lead to good ideas happen far less naturally over video calls, and new employees may find it harder to build relationships with colleagues.\n\nPersonally, I believe a hybrid model that combines both options captures the advantages of each, rather than choosing one extreme over the other.",
      checklist: ['Menciona productividad y trabajo en equipo', 'Agrega tu propia opinión, no solo repite los puntos', 'Usa lenguaje de opinión (in my opinion, personally, I believe)', 'Tiene introducción y conclusión claras']
    },
    {
      id: 'cw-es-3',
      prompt: "In your English class you have been talking about technology in schools. Now your teacher has asked you to write an essay giving your opinion on the following statement: \"Schools should allow students to use smartphones in class.\" Write your essay using all the notes and give reasons for your point of view. Notes: learning tools, distraction.",
      example: "Smartphones in the classroom is a topic that divides teachers, parents, and students alike.\n\nThose in favor argue that phones can serve as powerful learning tools, giving students instant access to dictionaries, research, and educational apps that were unavailable to previous generations.\n\nHowever, the risk of distraction cannot be ignored. Notifications from social media and messaging apps can pull attention away from the lesson within seconds, and some studies suggest that even having a phone visible on the desk reduces concentration.\n\nIn my view, phones could be allowed for specific, teacher-guided activities, but should otherwise remain put away during lessons to protect students' focus.",
      checklist: ['Menciona herramientas de aprendizaje y distracción', 'Da una opinión personal clara al final', 'Usa ejemplos concretos para apoyar cada idea', 'Longitud aproximada de 140-190 palabras en tu propio ensayo']
    }
  ],

  // Parte 2 real, opción "article": artículo para revista o blog.
  article: [
    {
      id: 'cw-ar-1',
      prompt: "You see this announcement in an English-language magazine: \"Articles wanted: Tell us about a place that changed the way you see the world. What made it special, and would you recommend it to others?\" Write your article.",
      example: "A Small Village That Changed My Perspective\n\nI never expected a tiny mountain village with no more than two hundred residents to change how I see the world, but that's exactly what happened during a trip three years ago.\n\nWhat struck me most wasn't the scenery, though it was beautiful, but the pace of life. Nobody seemed to be in a hurry, and neighbors genuinely knew and looked out for one another, something I had rarely experienced in the city.\n\nSpending a week there made me question how much unnecessary stress I had normalized in my own daily routine. I left with a much simpler idea of what actually makes people happy.\n\nWould I recommend it? Absolutely, especially to anyone who feels permanently rushed. Sometimes the most valuable trips aren't the ones with the most famous landmarks.",
      checklist: ['Tiene un título llamativo', 'Responde qué hizo especial al lugar', 'Termina recomendando (o no) el lugar a otros', 'Tono personal y ameno, como para una revista']
    },
    {
      id: 'cw-ar-2',
      prompt: "You see this announcement in an English-language magazine: \"Articles wanted: What's the best piece of advice you've ever received? Tell us who gave it to you and how it has helped you.\" Write your article.",
      example: "The Advice I Almost Ignored\n\nWhen I was about to quit my first real job after only two weeks, a mentor told me something I didn't want to hear: \"Every job feels impossible during the first month, that's not a sign you should quit.\"\n\nAt the time, I thought she just didn't understand how overwhelmed I felt. Looking back, though, she was completely right. I stayed, things eventually clicked into place, and that job ended up shaping my entire career path.\n\nWhat made her advice so useful wasn't that it made things easier immediately, but that it gave me a reason to keep going through the hardest part.\n\nNow, whenever I start something new and feel like giving up too soon, I remember her words, and they still help.",
      checklist: ['Nombra quién dio el consejo', 'Explica cómo ese consejo ayudó con el tiempo', 'Usa anécdotas concretas, no solo generalidades', 'Cierra conectando el pasado con el presente']
    },
    {
      id: 'cw-ar-3',
      prompt: "You see this announcement in an English-language magazine: \"Articles wanted: Tell us about a skill you taught yourself. How did you learn it, and what would you tell someone starting today?\" Write your article.",
      example: "Teaching Myself to Cook, One Disaster at a Time\n\nThree years ago, I could barely boil an egg without setting off the smoke alarm. Today, cooking is one of my favorite parts of the day, and I taught myself entirely through online videos and, honestly, a lot of failed attempts.\n\nThe turning point wasn't a fancy recipe, it was learning a handful of basic techniques really well instead of jumping between random dishes. Once I understood how to properly season food, everything else became easier to figure out.\n\nIf you're just starting today, my advice is simple: don't aim for perfection on your first ten tries. Cook the same three or four simple meals until they feel effortless, then slowly branch out from there.",
      checklist: ['Cuenta cómo aprendió la habilidad', 'Da un consejo concreto para quien empieza', 'Usa un tono cercano y personal', 'Tiene un título que atrae al lector']
    }
  ],

  // Parte 2 real, opción "email": correo semi-formal o formal.
  email: [
    {
      id: 'cw-em-1',
      prompt: "You recently attended an online course and had a problem with the video platform during the final exam. Write an email to the course coordinator. In your email: explain what happened, say how it affected you, and ask what can be done about it.",
      example: "Subject: Technical Issue During Final Exam\n\nDear Course Coordinator,\n\nI am writing to report a technical problem I experienced during the final exam for the Digital Marketing course on May 3rd.\n\nAbout twenty minutes into the exam, the video platform froze completely and disconnected me. It took nearly fifteen minutes to reconnect, during which I was unable to answer any questions, and I ultimately had to rush through the remaining sections.\n\nAs a result, I'm concerned my final score does not reflect my actual understanding of the material. Could you let me know whether it would be possible to retake the exam, or at least have this situation taken into account when grading?\n\nI appreciate your attention to this matter and look forward to your response.\n\nBest regards,\nDaniela Torres",
      checklist: ['Explica claramente qué pasó', 'Dice cómo le afectó', 'Pide una acción específica', 'Tono formal (Dear..., Best regards)']
    },
    {
      id: 'cw-em-2',
      prompt: "A friend from another country is planning to visit your city for the first time next month. Write an email to your friend. In your email: say you're excited about the visit, suggest two things to do together, and ask about their travel dates.",
      example: "Subject: So excited you're finally coming!\n\nHi Jorge,\n\nI honestly can't believe you're finally coming to visit, it's been way too long! I've already started thinking about everything we could do together.\n\nFirst, there's a food market downtown that I know you'll love, it has stalls from at least ten different countries. We could also spend a day at the botanical garden if you're up for something more relaxed, especially since the flowers should be in full bloom by then.\n\nBy the way, have you booked your flights yet? Let me know your exact dates as soon as you can so I can make sure I take those days off work.\n\nCan't wait to see you!\nCamila",
      checklist: ['Muestra entusiasmo por la visita', 'Sugiere dos actividades concretas', 'Pregunta por las fechas de viaje', 'Tono informal y amistoso, apropiado para un amigo']
    },
    {
      id: 'cw-em-3',
      prompt: "You ordered a product online and it arrived damaged. Write an email to the customer service department. In your email: describe the problem, explain what you would like them to do, and ask how long the process will take.",
      example: "Subject: Damaged Item Received - Order #48213\n\nDear Customer Service Team,\n\nI recently received my order (#48213), but unfortunately the lamp inside arrived with a large crack across the base, likely due to insufficient packaging.\n\nGiven the condition of the item, I would like to request a replacement rather than a repair, since the damage looks fairly severe. I have attached photos showing the crack clearly.\n\nCould you also let me know approximately how long the replacement process usually takes? I would like to plan accordingly.\n\nThank you for your help, and I look forward to hearing from you soon.\n\nKind regards,\nMiguel Fernandez",
      checklist: ['Describe el daño claramente', 'Pide una solución específica (reemplazo, reembolso, etc.)', 'Pregunta por el tiempo del proceso', 'Incluye un asunto (subject) y despedida formal']
    }
  ],

  // Parte 2 real, opción "review": reseña de libro, película, restaurante, etc.
  review: [
    {
      id: 'cw-rv-1',
      prompt: "You see this announcement on an English-language website: \"Reviews wanted: Tell us about a restaurant you visited recently. Was the food good? Would you go back?\" Write your review.",
      example: "A Cozy Find Worth Returning To\n\nI wasn't expecting much from a small restaurant tucked between two office buildings, but it turned out to be one of the best meals I've had this year.\n\nThe menu was small, which usually means the kitchen focuses on doing a few things really well, and that was exactly the case here. The grilled fish, in particular, was cooked perfectly, and the portion size was generous for the price.\n\nThe only downside was the noise level during the lunch rush, which made conversation a bit difficult. Still, that's a minor complaint compared to the quality of the food.\n\nWould I go back? Without a doubt. I'm already planning to bring friends next time, just maybe outside of the busiest hours.",
      checklist: ['Describe la comida específicamente', 'Menciona al menos un aspecto negativo', 'Responde si volvería o no', 'Título atractivo para el lector']
    },
    {
      id: 'cw-rv-2',
      prompt: "You see this announcement on an English-language website: \"Reviews wanted: Tell us about a book you've read recently. What did you like or dislike about it? Would you recommend it?\" Write your review.",
      example: "A Slow Start, But Worth the Patience\n\nI'll admit the first fifty pages of this novel almost made me give up. The pacing is unusually slow, and it takes a while before the main plot really takes shape.\n\nHowever, once the story picked up, I found it hard to put down. The author does an excellent job developing the main character's internal conflict, making choices that feel genuinely difficult rather than obviously right or wrong.\n\nThe ending, without giving anything away, ties everything together in a way that made the slow beginning feel worthwhile in hindsight.\n\nI would recommend this book, but only to readers willing to be patient during the opening chapters. If you push through, the payoff is real.",
      checklist: ['Da una opinión clara sobre el libro', 'Menciona algo positivo y algo negativo', 'Dice si lo recomendaría', 'No revela el final por completo (sin spoilers)']
    },
    {
      id: 'cw-rv-3',
      prompt: "You see this announcement on an English-language website: \"Reviews wanted: Tell us about a film you've seen recently. What was good or bad about it? Would you recommend it to others?\" Write your review.",
      example: "Visually Stunning, Emotionally Uneven\n\nFrom a purely visual standpoint, this film is one of the most impressive I've seen in years, with every scene looking like a carefully composed painting.\n\nUnfortunately, the story doesn't quite match the visuals. Several key emotional moments feel rushed, as if the director trusted the cinematography to carry feelings that the script never fully earned.\n\nThe lead actor's performance was genuinely strong, though, and almost single-handedly kept me engaged during the slower parts of the second act.\n\nWould I recommend it? Yes, but mainly to viewers who appreciate visual storytelling more than a tightly written plot. Just don't expect to be emotionally devastated by the ending.",
      checklist: ['Comenta tanto lo visual/técnico como la historia', 'Incluye una crítica específica, no solo elogios', 'Da una recomendación clara al final', 'Evita revelar el final de la película']
    }
  ]
};

const CAMBRIDGE_SPEAKING = {
  // Parte 1 real: entrevista personal breve con el examinador.
  interview: [
    { id: 'cs-p1-1', audioFile: 'audio/cambridge/cb-p1-1.mp3', question: "Where are you from, and what do you like most about it?", sampleAnswer: "Menciona tu ciudad o país y da una razón concreta (comida, gente, clima, algún lugar en particular), no solo 'me gusta todo'." },
    { id: 'cs-p1-2', audioFile: 'audio/cambridge/cb-p1-2.mp3', question: "What do you usually do at the weekend?", sampleAnswer: "Usa presente simple para rutinas ('I usually...', 'I often...') y menciona 1-2 actividades específicas, no una lista genérica." },
    { id: 'cs-p1-3', audioFile: 'audio/cambridge/cb-p1-3.mp3', question: "Do you prefer studying alone or with other people? Why?", sampleAnswer: "Da tu preferencia claramente y una razón real (te concentras mejor, te motiva más, etc.), con un ejemplo breve de tu experiencia." },
    { id: 'cs-p1-4', audioFile: 'audio/cambridge/cb-p1-4.mp3', question: "What kind of music do you enjoy listening to?", sampleAnswer: "Nombra un género o artista y explica brevemente por qué te gusta o en qué momentos lo escuchas." }
  ],

  // Parte 2 real: turno individual largo ("long turn"), normalmente
  // comparando dos fotografías. Aquí describimos ambas escenas en
  // texto ya que no usamos imágenes.
  longTurn: [
    {
      id: 'cs-lt-1',
      topic: 'Compare these two photographs: (1) a family cooking together in a small kitchen, laughing, (2) a person eating alone at a food truck on a busy street.',
      points: ['What is happening in each photo', 'How the people might be feeling', 'And say which situation you would prefer, and why'],
      sampleAnswer: "Describe primero cada foto en una o dos frases ('In the first photo... In the second photo...'), usa lenguaje de especulación para los sentimientos ('they might be feeling...', 'it looks like...'), y termina con tu preferencia personal justificada. Tienes aproximadamente 1 minuto para hablar."
    },
    {
      id: 'cs-lt-2',
      topic: 'Compare these two photographs: (1) a group of coworkers in a meeting room reviewing documents, (2) someone working alone from a laptop at a home office.',
      points: ['What kind of work each situation involves', 'What might be difficult about each one', 'And say which working style you would prefer, and why'],
      sampleAnswer: "Compara ambas situaciones usando conectores de contraste ('while... on the other hand...'), menciona una dificultad realista de cada una, y cierra con tu preferencia personal y una razón concreta."
    },
    {
      id: 'cs-lt-3',
      topic: 'Compare these two photographs: (1) a child reading a physical book in a library, (2) a child using a tablet to read a story at home.',
      points: ['What is similar and different about the two situations', 'What each child might be learning', 'And say which method you think is more effective for children, and why'],
      sampleAnswer: "Menciona primero una similitud (ambos están leyendo) y luego una diferencia clara, habla de posibles ventajas de cada método, y da tu opinión final apoyada en una razón, no solo una preferencia sin justificar."
    }
  ],

  // Parte 3 real: tarea colaborativa entre los dos candidatos, con un
  // diagrama o serie de opciones para discutir. Aquí se practica en
  // solitario, imaginando las respuestas del otro candidato.
  collaborativeTask: [
    {
      id: 'cs-ct-1',
      prompt: "Here are some ideas for how a company could reduce its environmental impact: using renewable energy, reducing packaging, allowing remote work, and encouraging public transport. Talk to your partner about the advantages of each idea. Then decide which two would have the biggest impact.",
      sampleAnswer: "En esta tarea normalmente hablas con otro candidato, así que practica dando tu opinión sobre CADA opción con una razón breve ('I think using renewable energy would help because...'), invita opiniones ('What do you think about...?'), y al final lleguen juntos a una decisión ('So shall we agree that...?'). Practica ambos lados: dar tu opinión y responder a la del otro."
    },
    {
      id: 'cs-ct-2',
      prompt: "Here are some ways a city could encourage more people to read: building more libraries, organizing free book fairs, offering discounts on books, and creating reading clubs in schools. Talk to your partner about the advantages of each idea. Then decide which one would be most effective.",
      sampleAnswer: "Comenta cada opción brevemente, usa frases para pedir la opinión del otro candidato ('What do you think?', 'Do you agree?') y para negociar una decisión final ('Maybe we should focus on...', 'I see your point, but...'). El objetivo no es tener razón, sino mantener una conversación fluida."
    },
    {
      id: 'cs-ct-3',
      prompt: "Here are some skills that could be useful for finding a job: public speaking, computer skills, teamwork, and a foreign language. Talk to your partner about how useful each skill might be. Then decide which two are the most important nowadays.",
      sampleAnswer: "Da una opinión sobre cada habilidad con un ejemplo concreto de por qué es útil, practica frases de acuerdo/desacuerdo parcial ('That's true, but I'd also say...') y termina proponiendo una conclusión conjunta con tu compañero imaginario."
    }
  ],

  // Parte 4 real: discusión más general relacionada con el tema de la
  // parte 3, con el examinador (no con el otro candidato).
  furtherDiscussion: [
    { id: 'cs-p4-1', audioFile: 'audio/cambridge/cb-p4-1.mp3', relatedTo: 'cs-ct-1', question: "Do you think individuals can do as much for the environment as companies can?", sampleAnswer: "Da tu opinión con un ejemplo concreto de acción individual y de acción empresarial, y compara su impacto de forma equilibrada." },
    { id: 'cs-p4-2', audioFile: 'audio/cambridge/cb-p4-2.mp3', relatedTo: 'cs-ct-1', question: "Should governments require companies to reduce pollution, or should it be voluntary?", sampleAnswer: "Toma una postura clara (obligatorio o voluntario) y defiéndela con una razón realista, mencionando posibles desventajas de la otra opción." },
    { id: 'cs-p4-3', audioFile: 'audio/cambridge/cb-p4-3.mp3', relatedTo: 'cs-ct-2', question: "Do you think people read less now than in the past? Why or why not?", sampleAnswer: "Da tu opinión y menciona un factor específico (redes sociales, videos cortos, falta de tiempo) que apoye tu punto de vista." },
    { id: 'cs-p4-4', audioFile: 'audio/cambridge/cb-p4-4.mp3', relatedTo: 'cs-ct-3', question: "Which do you think is more important for young people today: technical skills or soft skills like communication?", sampleAnswer: "Compara ambos tipos de habilidades con un ejemplo de cada una, y da una conclusión personal en vez de solo describir las dos opciones." }
  ]
};
