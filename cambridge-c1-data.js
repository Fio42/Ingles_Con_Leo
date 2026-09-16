// ============================================================
// Inglés con Leo — Contenido de práctica para Cambridge English
// C1 ADVANCED (CAE)
//
// Mismo criterio que cambridge-data.js (B2 First), pero al nivel
// C1 Advanced: vocabulario más avanzado, gramática más compleja
// (inversión, oraciones hendidas, condicionales mixtos, verbos de
// reporte avanzados, colocaciones menos frecuentes) y temas más
// abstractos. Formato vigente en 2026 según cambridgeenglish.org:
//
//   Reading & Use of English   8 partes, 56 preguntas, 1h30, 40% de la nota
//   Writing                    2 partes (ensayo obligatorio + 1 a elegir
//                              entre carta/email, informe, reseña o
//                              propuesta), 1h30, 20%
//   Listening                  4 partes, 30 preguntas, ~40 min
//   Speaking                   4 partes, ~15 min, en pareja con 2 examinadores
//
// Escala de puntuación (Cambridge English Scale): 200-210 = Grade A
// (equivalente a C2), 193-199 = Grade B, 180-192 = Grade C (aprobado,
// certificado C1), 160-179 = certificado B2. El puntaje mínimo para
// aprobar C1 Advanced es 180.
//
// Contenido representativo escrito para este sitio (no es una copia
// de un examen real de Cambridge). Reutiliza el mismo motor de
// cambridge.js que B2 First; la diferencia es solo el contenido y la
// dificultad.
//
// Estructura por sección (igual que B2, mismos nombres de subtipo):
//   CAMBRIDGE_C1_READING.multipleChoiceCloze / .openCloze / .wordFormation /
//                        .keyWordTransformation / .readingComprehension /
//                        .multipleMatching
//   CAMBRIDGE_C1_LISTENING.shortExtract / .sentenceCompletion /
//                          .multipleMatching / .longInterview
//   CAMBRIDGE_C1_WRITING.essay / .report / .review / .proposal
//   CAMBRIDGE_C1_SPEAKING.interview / .longTurn / .collaborativeTask /
//                         .furtherDiscussion
// ============================================================

const CAMBRIDGE_C1_READING = {
  // Parte 1 real: multiple-choice cloze de vocabulario avanzado
  // (colocaciones, phrasal verbs, matices de significado).
  multipleChoiceCloze: [
    {
      id: 'c1-mc-1',
      sentence: "The negotiations broke ___ after both sides refused to compromise on the final terms.",
      options: ['down', 'off', 'up', 'out'],
      correct: 0,
      explain: '"Break down" significa fracasar o colapsar (usado para negociaciones, maquinaria, salud mental). "Break off" implica interrumpir abruptamente, no encaja con "after refusing to compromise" como causa gradual.'
    },
    {
      id: 'c1-mc-2',
      sentence: "Her argument was so ___ that even her harshest critics struggled to find a flaw in it.",
      options: ['compelling', 'compelled', 'compelling to', 'compellingly'],
      correct: 0,
      explain: 'Se necesita un adjetivo después de "so" para modificar "argument": "compelling" (convincente).'
    },
    {
      id: 'c1-mc-3',
      sentence: "Despite the setback, the team remained ___ to deliver the project on time.",
      options: ['determined', 'determining', 'determination', 'determine'],
      correct: 0,
      explain: '"Remain + adjetivo" requiere la forma adjetival: "determined" (decidido, resuelto).'
    },
    {
      id: 'c1-mc-4',
      sentence: "The committee's decision to cut funding was met with ___ opposition from local residents.",
      options: ['fierce', 'firm', 'stiff', 'strong'],
      correct: 0,
      explain: '"Fierce opposition" es la colocación más natural para describir oposición intensa y apasionada; "stiff opposition" también existe pero es menos común con "met with".'
    }
  ],

  // Parte 2 real: open cloze de gramática avanzada (nexos, partículas,
  // determinantes, verbos auxiliares).
  openCloze: [
    {
      id: 'c1-oc-1',
      sentence: ["No", "sooner", "___", "the announcement been made", "than", "shares", "in", "the", "company", "plummeted."],
      bank: ['had', 'has', 'did', 'was'],
      correct: 'had',
      explain: 'Estructura de inversión "No sooner had + sujeto + participio... than": "No sooner had the announcement been made than..."'
    },
    {
      id: 'c1-oc-2',
      sentence: ["___", "as", "the", "plan", "sounded,", "nobody", "was", "willing", "to", "take", "the", "risk."],
      bank: ['Appealing', 'Appeal', 'Appealed', 'Appeals'],
      correct: 'Appealing',
      explain: 'Estructura concesiva "Adjetivo + as + cláusula": "Appealing as the plan sounded..." (Por muy atractivo que sonara el plan...).'
    },
    {
      id: 'c1-oc-3',
      sentence: ["It", "was", "not", "___", "she", "explained", "the", "context", "that", "the", "decision", "made", "sense."],
      bank: ['until', 'when', 'since', 'while'],
      correct: 'until',
      explain: 'Oración hendida ("cleft sentence") con "It was not until... that...": "It was not until she explained the context that..."'
    },
    {
      id: 'c1-oc-4',
      sentence: ["Had", "I", "known", "about", "the", "delay,", "I", "___", "have", "rescheduled", "the", "meeting."],
      bank: ['would', 'will', 'should', 'must'],
      correct: 'would',
      explain: 'Tercera condicional con inversión ("Had I known... I would have..."), en vez de "If I had known...".'
    }
  ],

  // Parte 3 real: word formation con prefijos y sufijos menos comunes.
  wordFormation: [
    {
      id: 'c1-wf-1',
      sentence: "The report was criticized for its ___ analysis of the economic data.",
      rootWord: 'SIMPLE',
      options: ['oversimplified', 'simplistic', 'unsimple', 'simplified'],
      correct: 1,
      explain: '"Simplistic" (simplista) es el adjetivo que critica un análisis por ser demasiado simple de forma negativa; "oversimplified" también podría aplicar a un texto, pero como adjetivo autónomo "simplistic" es el más natural aquí.'
    },
    {
      id: 'c1-wf-2',
      sentence: "His ___ of the situation completely changed how the board viewed the merger.",
      rootWord: 'INTERPRET',
      options: ['interpretation', 'interpreting', 'interpretive', 'misinterpret'],
      correct: 0,
      explain: 'Se necesita un sustantivo: "interpretation" (interpretación).'
    },
    {
      id: 'c1-wf-3',
      sentence: "The scandal left the minister's reputation ___ beyond repair.",
      rootWord: 'TARNISH',
      options: ['tarnished', 'tarnishing', 'untarnished', 'tarnishable'],
      correct: 0,
      explain: 'Se necesita el participio pasado usado como adjetivo después de "left...reputation": "tarnished" (empañada, dañada).'
    },
    {
      id: 'c1-wf-4',
      sentence: "Her ___ approach to problem-solving impressed everyone on the panel.",
      rootWord: 'INNOVATE',
      options: ['innovative', 'innovation', 'innovatively', 'innovator'],
      correct: 0,
      explain: 'Se necesita un adjetivo antes de "approach": "innovative" (innovador).'
    }
  ],

  // Parte 4 real: key word transformation con estructuras avanzadas
  // (inversión, verbos de reporte, colocaciones fijas).
  keyWordTransformation: [
    {
      id: 'c1-kt-1',
      original: "I regret not having accepted the job offer when I had the chance.",
      keyword: 'WISH',
      sentence: "I ___ the job offer when I had the chance.",
      options: ["wish I had accepted", "wish I accepted", "wish I would accept", "wish I have accepted"],
      correct: 0,
      explain: '"Wish + pasado perfecto" expresa arrepentimiento sobre el pasado: "I wish I had accepted..."'
    },
    {
      id: 'c1-kt-2',
      original: "Only after the results were published did the team realize their mistake.",
      keyword: 'UNTIL',
      sentence: "The team ___ their mistake until the results were published.",
      options: ["did not realize", "had not realized", "have not realized", "was not realizing"],
      correct: 0,
      explain: 'Reescritura sin inversión: "The team did not realize their mistake until the results were published", manteniendo el mismo significado.'
    },
    {
      id: 'c1-kt-3',
      original: "It is widely believed that the policy will fail.",
      keyword: 'EXPECTED',
      sentence: "The policy ___ fail.",
      options: ["is widely expected to", "is widely expecting to", "widely expects to", "is widely expected that"],
      correct: 0,
      explain: 'Voz pasiva con verbo de reporte + infinitivo: "is widely expected to fail", estructura típica de C1.'
    },
    {
      id: 'c1-kt-4',
      original: "She only found out the truth by accident.",
      keyword: 'HAD',
      sentence: "___ it not been for an accident, she would never have found out the truth.",
      options: ["Had", "If", "Was", "Did"],
      correct: 0,
      explain: 'Condicional con inversión sin "if": "Had it not been for..." equivale a "If it had not been for...".'
    }
  ],

  // Parte 5 real: reading comprehension con textos más largos y
  // preguntas que requieren inferencia, no solo localizar datos.
  readingComprehension: [
    {
      id: 'c1-rc-1',
      title: 'The Paradox of Choice',
      text: "It has become something of a cultural truism that more options lead to greater satisfaction, yet a growing body of research suggests the opposite may be true. When confronted with an overwhelming array of choices, consumers often experience heightened anxiety about making the 'wrong' decision, and are more likely to feel regret afterward, even when the outcome is objectively favorable. This is not to suggest that choice itself is undesirable; rather, it appears that beyond a certain threshold, additional options yield diminishing, and eventually negative, returns on wellbeing. Some retailers have begun to act on this insight, deliberately curating smaller selections, a strategy that runs counter to decades of conventional wisdom in marketing.",
      question: "What does the writer suggest about retailers who curate smaller selections?",
      options: ['They are challenging long-standing assumptions in their industry', 'They are responding to a decline in consumer spending', 'They are copying a strategy used mainly abroad', 'They are ignoring what research actually shows'],
      correct: 0,
      explain: 'El texto dice que esta estrategia "va en contra de décadas de sabiduría convencional en marketing", es decir, desafía suposiciones arraigadas de la industria.'
    },
    {
      id: 'c1-rc-2',
      title: 'Rethinking Failure in Innovation',
      text: "Silicon Valley has long celebrated a particular narrative around failure: that it is an inevitable, even necessary, precursor to eventual success. This framing, however, risks obscuring an important distinction between productive failure, which generates transferable insight, and failure that simply results from inadequate preparation or flawed reasoning. Treating all failure as equally instructive can lead organizations to tolerate recklessness under the guise of innovation, while genuinely valuable lessons go unexamined amid the rush to 'move fast'. A more discerning approach would involve systematically distinguishing between the two, rather than celebrating failure indiscriminately.",
      question: "What criticism does the writer make of how failure is often viewed?",
      options: ['It fails to distinguish between useful and merely careless failure', 'It discourages companies from taking any risks at all', 'It is a concept unique to the technology industry', 'It has been proven statistically incorrect'],
      correct: 0,
      explain: 'El autor critica que tratar todo fracaso como igualmente instructivo "no distingue" entre el fracaso productivo y el que resulta de mala preparación.'
    },
    {
      id: 'c1-rc-3',
      title: 'The Attention Economy',
      text: "Attention, once considered an abundant and largely unmanaged resource, is now widely recognized as one of the scarcest commodities of the digital age. Platforms compete not merely for market share in a traditional sense but for the finite hours of human consciousness available each day, a competition that has reshaped the design of nearly every digital product in circulation. Critics argue that this dynamic incentivizes design choices optimized for engagement rather than user wellbeing, a tension that regulators have only recently begun to address, and largely without the technical expertise required to do so effectively.",
      question: "According to the passage, what problem do regulators face?",
      options: ['They generally lack the technical knowledge needed to address the issue properly', 'They have chosen to ignore the issue entirely', 'They agree completely with how platforms are designed', 'They have already solved the problem effectively'],
      correct: 0,
      explain: 'El texto dice que los reguladores han empezado a abordar esta tensión "en gran medida sin la experiencia técnica necesaria para hacerlo eficazmente".'
    },
    {
      id: 'c1-rc-4',
      title: 'The Myth of Multitasking',
      text: "Despite persistent claims of proficiency, cognitive research consistently demonstrates that what is colloquially termed multitasking is, in most cases, rapid task-switching rather than simultaneous processing. Each switch incurs a measurable cognitive cost, often imperceptible to the individual but cumulatively significant, resulting in slower completion times and a higher error rate than sequential, single-task engagement. Paradoxically, individuals who self-report as effective multitaskers frequently perform worse on controlled tests of task-switching ability than those who claim no particular skill in this area, suggesting a marked disconnect between perceived and actual competence.",
      question: "What does the research mentioned in the passage reveal about self-reported 'good multitaskers'?",
      options: ['Their actual performance often contradicts their own self-assessment', 'They consistently outperform others in controlled tests', 'They tend to underestimate their own abilities', 'They are more accurate at judging their own skill than others'],
      correct: 0,
      explain: 'El texto señala una "marcada desconexión entre competencia percibida y real": quienes se creen buenos multitasking suelen rendir peor en pruebas controladas.'
    }
  ],

  // Parte 7 real: cross-text multiple matching. Aquí, identificar en
  // qué fragmento de opinión aparece una idea determinada.
  multipleMatching: [
    {
      id: 'c1-mm-1',
      paragraph: "Four columnists debate the impact of automation on employment. Writer A argues that historical precedent shows new technologies ultimately create more jobs than they destroy, pointing to the industrial revolution as evidence. Writer B counters that today's automation is qualitatively different, since it threatens cognitive as well as manual labor simultaneously. Writer C focuses on the transition period, arguing that even if new jobs eventually emerge, the human cost of displacement in the interim is often underestimated by economists. Writer D suggests that the real issue is not job loss but the concentration of the resulting wealth among a small number of technology owners.",
      question: "Which writer raises a concern about who benefits financially from automation, rather than about job numbers?",
      options: ['Writer A', 'Writer B', 'Writer C', 'Writer D'],
      correct: 3,
      explain: 'Writer D plantea que el verdadero problema "no es la pérdida de empleos sino la concentración de la riqueza resultante" entre pocos dueños de tecnología.'
    },
    {
      id: 'c1-mm-2',
      paragraph: "Four critics review a controversial new architecture project in the city center. Critic A praises its bold departure from the surrounding neoclassical buildings, calling it a necessary provocation. Critic B objects that the design ignores the human scale of the neighboring streets, making the area feel less welcoming. Critic C is largely indifferent to its aesthetics but raises concerns about the project's environmental footprint during construction. Critic D argues that regardless of its merits, the lack of public consultation before approval sets a troubling precedent.",
      question: "Which critic is primarily concerned with the decision-making process rather than the building itself?",
      options: ['Critic A', 'Critic B', 'Critic C', 'Critic D'],
      correct: 3,
      explain: 'Critic D se enfoca en "la falta de consulta pública antes de la aprobación", es decir, en el proceso de decisión, no en el edificio en sí.'
    },
    {
      id: 'c1-mm-3',
      paragraph: "Four academics discuss the value of standardized testing in education. Academic A maintains that standardized tests offer the only objective, comparable measure of student achievement across diverse schools. Academic B argues that such tests systematically disadvantage students from under-resourced backgrounds, undermining the very fairness they claim to provide. Academic C is less concerned with fairness than with the narrowing effect testing has on curricula, as teachers increasingly 'teach to the test'. Academic D proposes that the debate is somewhat moot, since alternative assessment methods have not yet proven scalable at a national level.",
      question: "Which academic is mainly concerned about the effect of testing on what is actually taught in schools?",
      options: ['Academic A', 'Academic B', 'Academic C', 'Academic D'],
      correct: 2,
      explain: 'Academic C se enfoca en "el efecto reductor que la evaluación tiene en los planes de estudio", ya que los maestros terminan enseñando para el examen.'
    },
    {
      id: 'c1-mm-4',
      paragraph: "Four scientists comment on the ethics of gene-editing research. Scientist A believes the potential to eliminate hereditary diseases outweighs any theoretical risks. Scientist B warns that once germline editing becomes normalized for medical reasons, the line between treatment and enhancement will inevitably blur. Scientist C argues the more pressing issue is unequal global access, which could entrench existing inequalities rather than reduce suffering broadly. Scientist D contends that public understanding of the science remains too limited for meaningful democratic oversight of the field.",
      question: "Which scientist is most concerned that gene-editing could worsen existing inequality rather than reduce it?",
      options: ['Scientist A', 'Scientist B', 'Scientist C', 'Scientist D'],
      correct: 2,
      explain: 'Scientist C argumenta que el problema más urgente es "el acceso global desigual, que podría profundizar las desigualdades existentes en vez de reducir el sufrimiento".'
    }
  ]
};

const CAMBRIDGE_C1_LISTENING = {
  // Parte 1 real: extractos cortos con dos hablantes, preguntas de
  // opción múltiple que suelen requerir inferir actitud u opinión.
  shortExtract: [
    {
      id: 'c1l-se-1',
      audioFile: 'audio/cambridge-c1/c1-se-1.mp3',
      transcript: "— Honestly, I was skeptical about switching to the new system, but I have to admit the transition went far more smoothly than I expected.\n— I felt the same way at first. I think the extra training sessions they added really made the difference this time.\n— Fair point. Last time they just handed us a manual and hoped for the best.\n— Exactly, and look how that turned out.",
      question: "What do both speakers agree was the reason this transition went well?",
      options: ['The additional training provided', 'The clarity of the written manual', 'The shorter timeline for the switch', 'The involvement of outside consultants'],
      correct: 0,
      explain: 'Ambos coinciden en que "las sesiones de entrenamiento extra hicieron la diferencia", a diferencia de la vez anterior en que solo dieron un manual.'
    },
    {
      id: 'c1l-se-2',
      audioFile: 'audio/cambridge-c1/c1-se-2.mp3',
      transcript: "— I know the proposal looks impressive on paper, but something about the timeline still doesn't sit right with me.\n— I had the same nagging feeling, actually. It's not that the numbers are wrong, it's more that they seem to assume nothing will ever go wrong.\n— Right, there's zero contingency built in.\n— Which, given our track record, feels almost naive.",
      question: "What concern do the speakers share about the proposal?",
      options: ['It does not allow for anything unexpected happening', 'The financial figures appear to be inaccurate', 'It has not been reviewed by senior management', 'The deadline is too far in the future'],
      correct: 0,
      explain: 'El segundo hablante dice que la propuesta "asume que nada saldrá mal" y que "no hay margen de contingencia", es decir, no contempla imprevistos.'
    },
    {
      id: 'c1l-se-3',
      audioFile: 'audio/cambridge-c1/c1-se-3.mp3',
      transcript: "— You seem to have really taken to the new role. I half expected you to be overwhelmed by now.\n— To be fair, there were a couple of rough weeks early on where I genuinely doubted myself.\n— You hid it well, then.\n— Barely. What got me through it was realizing nobody expected perfection from day one, just steady progress.",
      question: "What does the second speaker say helped them cope with the difficult early weeks?",
      options: ['Realizing that steady progress, not perfection, was expected', 'Getting extra support from a mentor', 'Reducing their workload temporarily', 'Receiving positive feedback from a manager'],
      correct: 0,
      explain: 'El hablante dice que lo que le ayudó fue "darse cuenta de que nadie esperaba perfección desde el primer día, solo progreso constante".'
    },
    {
      id: 'c1l-se-4',
      audioFile: 'audio/cambridge-c1/c1-se-4.mp3',
      transcript: "— I'll admit, when they first announced the merger, I assumed it would be a disaster for company culture.\n— And now?\n— Now I'm cautiously optimistic. They've clearly gone out of their way to preserve what made each team distinct, rather than forcing everyone into one mould.\n— That's rarer than it should be, in my experience.",
      question: "What has changed the first speaker's opinion about the merger?",
      options: ['The effort made to preserve each team’s distinct identity', 'A reduction in the number of layoffs announced', 'Positive comments from other employees', 'A delay in the merger timeline'],
      correct: 0,
      explain: 'El primer hablante dice que la empresa "se ha esforzado por preservar lo que hacía distinto a cada equipo, en vez de forzar a todos al mismo molde".'
    }
  ],

  // Parte 2 real: sentence completion sobre un monólogo más denso,
  // con información específica que hay que captar con precisión.
  sentenceCompletion: [
    {
      id: 'c1l-sc-1',
      audioFile: 'audio/cambridge-c1/c1-sc-1.mp3',
      transcript: "Welcome to today's segment on urban planning. One aspect that's often overlooked is what planners call the 'fifteen-minute city' concept, the idea that residents should be able to access most daily necessities, whether that's groceries, healthcare, or schools, within a short walk or bike ride from home, rather than relying on cars for every errand.",
      translation: "Bienvenidos al segmento de hoy sobre planificación urbana. Un aspecto que a menudo se pasa por alto es lo que los planificadores llaman el concepto de 'ciudad de quince minutos', la idea de que los residentes deberían poder acceder a la mayoría de las necesidades diarias, ya sea comestibles, atención médica o escuelas, en una caminata corta o paseo en bicicleta desde su casa, en vez de depender del auto para cada mandado.",
      sentence: ["The 'fifteen-minute city' concept aims to reduce residents' reliance on", "___", "for daily errands."],
      bank: ['cars', 'bicycles', 'buses', 'trains'],
      correct: 'cars',
      explain: 'El locutor explica que la idea es no depender "del auto para cada mandado", es decir, reducir la dependencia de los autos.'
    },
    {
      id: 'c1l-sc-2',
      audioFile: 'audio/cambridge-c1/c1-sc-2.mp3',
      transcript: "Now, turning to the history of this building, construction actually began in 1891, though it wasn't completed until nearly two decades later due to a combination of funding shortfalls and, rather unusually, a dispute over which architect had final authority over the design.",
      translation: "Ahora, pasando a la historia de este edificio, la construcción en realidad comenzó en 1891, aunque no se completó hasta casi dos décadas después debido a una combinación de falta de fondos y, de manera poco usual, una disputa sobre qué arquitecto tenía la autoridad final sobre el diseño.",
      sentence: ["Besides funding shortfalls, the building's completion was delayed by a dispute over", "___", "."],
      bank: ['who had final authority over the design', 'where the building should be located', 'how tall the building should be', 'which materials to use'],
      correct: 'who had final authority over the design',
      explain: 'El locutor menciona una "disputa sobre qué arquitecto tenía la autoridad final sobre el diseño" como la segunda causa del retraso.'
    },
    {
      id: 'c1l-sc-3',
      audioFile: 'audio/cambridge-c1/c1-sc-3.mp3',
      transcript: "Before we move on to the practical exercise, I want to flag one common mistake: many beginners assume that a stronger espresso shot simply means using more coffee grounds, when in fact the more critical variable is grind consistency, since uneven particles extract at wildly different rates.",
      translation: "Antes de pasar al ejercicio práctico, quiero señalar un error común: muchos principiantes asumen que un espresso más fuerte simplemente significa usar más café molido, cuando en realidad la variable más importante es la consistencia de la molienda, ya que partículas desiguales se extraen a ritmos muy diferentes.",
      sentence: ["According to the speaker, the most critical variable for espresso strength is", "___", "."],
      bank: ['grind consistency', 'the amount of coffee used', 'water temperature', 'the type of coffee bean'],
      correct: 'grind consistency',
      explain: 'El presentador aclara que "la variable más crítica es la consistencia de la molienda", no la cantidad de café.'
    },
    {
      id: 'c1l-sc-4',
      audioFile: 'audio/cambridge-c1/c1-sc-4.mp3',
      transcript: "One finding from our latest survey stood out in particular: employees who took short, frequent breaks throughout the day reported significantly higher end-of-day energy levels than those who worked in long, uninterrupted blocks, even though total hours worked were nearly identical between the two groups.",
      translation: "Un hallazgo de nuestra última encuesta destacó en particular: los empleados que tomaban descansos cortos y frecuentes a lo largo del día reportaron niveles de energía significativamente más altos al final del día que quienes trabajaban en bloques largos ininterrumpidos, aunque el total de horas trabajadas era casi idéntico entre los dos grupos.",
      sentence: ["Employees who took short, frequent breaks reported higher end-of-day", "___", "than those who did not."],
      bank: ['energy levels', 'salaries', 'working hours', 'job satisfaction'],
      correct: 'energy levels',
      explain: 'El hallazgo indica que estos empleados reportaron "niveles de energía significativamente más altos" al final del día.'
    }
  ],

  // Parte 3 real: multiple matching sobre monólogos cortos, aquí
  // identificando la actitud o postura de cada hablante.
  multipleMatching: [
    {
      id: 'c1l-mm-1',
      audioFile: 'audio/cambridge-c1/c1-mm-1.mp3',
      transcript: "When I first proposed working four days a week, I braced myself for pushback, but what actually surprised me was how quickly productivity metrics improved. It wasn't that people crammed five days of work into four out of desperation, they genuinely seemed to work more deliberately, knowing their time was more limited.",
      question: "What is the speaker's main point?",
      options: ['A shorter working week led to more deliberate, focused work', 'Employees were initially against the four-day week', 'Productivity metrics are unreliable indicators', 'The change was eventually reversed'],
      correct: 0,
      explain: 'El hablante dice que las personas "trabajaron de forma más deliberada" sabiendo que su tiempo era limitado, no que trabajaron por desesperación.'
    },
    {
      id: 'c1l-mm-2',
      audioFile: 'audio/cambridge-c1/c1-mm-2.mp3',
      transcript: "People often assume that being a translator is simply a matter of knowing two languages fluently, but the reality is far more demanding. You're constantly making judgment calls about tone, cultural nuance, and intention that a dictionary simply cannot resolve for you.",
      question: "What is the speaker's main point?",
      options: ['Translation requires far more than bilingual fluency', 'Dictionaries have made translation obsolete', 'Most people overestimate how difficult translation is', 'Cultural nuance is less important than grammar'],
      correct: 0,
      explain: 'El hablante explica que la traducción "va mucho más allá de solo saber dos idiomas", requiere juicios sobre tono, matices culturales e intención.'
    },
    {
      id: 'c1l-mm-3',
      audioFile: 'audio/cambridge-c1/c1-mm-3.mp3',
      transcript: "I used to think that taking a career break would set me back irreparably, that I'd return to find everyone else miles ahead. In hindsight, the perspective I gained during that year turned out to be more valuable professionally than another year of doing the same job would have been.",
      question: "What is the speaker's main point?",
      options: ['A career break turned out to be more valuable than expected', 'Career breaks are generally a mistake', 'Returning to work after a break is always difficult', 'Employers penalize candidates who take breaks'],
      correct: 0,
      explain: 'El hablante concluye que la perspectiva ganada durante su año de pausa "resultó ser más valiosa profesionalmente" de lo que temía.'
    },
    {
      id: 'c1l-mm-4',
      audioFile: 'audio/cambridge-c1/c1-mm-4.mp3',
      transcript: "There's a persistent myth that creativity strikes suddenly, in a flash of inspiration. In my experience, and in most of the research I've read, it's almost always the product of unglamorous, repetitive effort, showing up and doing the work even when inspiration is nowhere to be found.",
      question: "What is the speaker's main point?",
      options: ['Creativity is mostly the result of consistent effort, not sudden inspiration', 'Inspiration is essential for any creative work', 'Research on creativity is generally unreliable', 'Only a few people are naturally creative'],
      correct: 0,
      explain: 'El hablante argumenta contra el mito de la inspiración repentina, afirmando que la creatividad "casi siempre es producto de un esfuerzo repetitivo y poco glamoroso".'
    }
  ],

  // Parte 4 real: entrevista larga, con preguntas que requieren
  // entender matices de opinión, no solo hechos explícitos.
  longInterview: [
    {
      id: 'c1l-li-1',
      audioFile: 'audio/cambridge-c1/c1-li-1.mp3',
      transcript: "— You've spent the last decade studying decision-making under uncertainty. What's the most counterintuitive thing you've learned?\n— Probably that having more information doesn't necessarily lead to better decisions, and can sometimes make them worse. People often mistake volume of data for quality of insight, and end up more confident in flawed conclusions simply because they feel well-informed.\n— That does sound like it goes against common sense.\n— It does, and that's precisely why it's so persistent. We're wired to associate effort with reliability, even when the two have nothing to do with each other.",
      question: "According to the speaker, why is the misconception about information and decision-making so persistent?",
      options: ['People associate effort spent gathering information with reliability', 'Most people are simply unaware of the research', 'Organizations actively discourage questioning the idea', 'It is taught incorrectly in most schools'],
      correct: 0,
      explain: 'El experto dice que "estamos programados para asociar esfuerzo con fiabilidad", aunque no tengan relación, lo cual explica que el mito persista.'
    },
    {
      id: 'c1l-li-2',
      audioFile: 'audio/cambridge-c1/c1-li-2.mp3',
      transcript: "— Your latest exhibition moves away from the abstract style you're known for. What prompted that shift?\n— Honestly, a kind of restlessness. I'd reached a point where I could predict my own next move before I'd even started a piece, and that predictability started to feel less like mastery and more like stagnation.\n— Was it difficult to abandon a style that had brought you so much recognition?\n— Terrifying, if I'm being completely honest. But staying somewhere comfortable purely because it's recognized felt like a slower kind of creative death.",
      question: "Why did the artist decide to change their style, according to the interview?",
      options: ['Their previous style had become too predictable to feel meaningful', 'Critics had stopped responding positively to their work', 'They wanted to attract a younger audience', 'A gallery specifically requested a new style'],
      correct: 0,
      explain: 'El artista dice que podía predecir su propio siguiente movimiento, y esa previsibilidad "empezó a sentirse menos como maestría y más como estancamiento".'
    },
    {
      id: 'c1l-li-3',
      audioFile: 'audio/cambridge-c1/c1-li-3.mp3',
      transcript: "— Your foundation focuses on rural healthcare access. What's the biggest obstacle you've encountered that people wouldn't expect?\n— People assume it's purely a funding issue, and money certainly helps, but the harder problem is retention. We can build a clinic, but convincing qualified staff to stay somewhere remote long-term, rather than treating it as a stepping stone, is a much thornier challenge.\n— Have you found anything that actually works?\n— Partnering with local training programs, so the staff have roots in the community from the start, rather than being parachuted in from elsewhere.",
      question: "What does the speaker identify as the harder problem beyond funding?",
      options: ['Retaining qualified staff in remote locations long-term', 'Obtaining medical equipment', 'Convincing local governments to cooperate', 'Transporting patients to clinics'],
      correct: 0,
      explain: 'La hablante dice que el problema más difícil es "convencer a personal calificado de quedarse a largo plazo" en un lugar remoto, no solo el financiamiento.'
    },
    {
      id: 'c1l-li-4',
      audioFile: 'audio/cambridge-c1/c1-li-4.mp3',
      transcript: "— After three Olympic cycles, what's changed most about how you approach competition?\n— Early on, I measured everything against winning. Now I measure it against whether I executed the process I'd trained for, regardless of outcome, because outcome depends on so many factors beyond my control anyway.\n— Does that make losing easier to accept?\n— Not easier exactly, but fairer to myself. I can be disappointed by a result without concluding that I failed, which used to be the same thing in my head.",
      question: "How has the athlete's definition of success changed over time?",
      options: ['It now focuses on executing the trained process rather than only the outcome', 'It now depends entirely on public recognition', 'It has become less important to them overall', 'It is now based solely on beating personal records'],
      correct: 0,
      explain: 'El atleta dice que ahora mide el éxito "contra si ejecutó el proceso para el que entrenó, sin importar el resultado", a diferencia de antes.'
    }
  ]
};

const CAMBRIDGE_C1_WRITING = {
  // Parte 1 real: ensayo obligatorio a partir de dos textos breves con
  // puntos de vista contrastantes.
  essay: [
    {
      id: 'c1w-es-1',
      prompt: "Your class has watched a discussion about whether governments should regulate artificial intelligence more strictly. You have made the notes below. Write an essay discussing two of the points, giving your own opinion. Notes: innovation could slow down; public safety needs protecting; regulation is hard to enforce globally.",
      example: "The question of how strictly governments should regulate artificial intelligence has become one of the defining policy debates of this decade, and reasonable people disagree sharply on where the balance should lie.\n\nProponents of a lighter regulatory touch warn that overly cautious rules risk stifling innovation, pushing promising research and investment toward jurisdictions with fewer restrictions rather than eliminating the risks altogether. This is a legitimate concern, particularly given how quickly the field evolves; regulation drafted today may be obsolete, or actively counterproductive, within a few years.\n\nOn the other hand, the argument for protecting public safety carries considerable weight. Systems that influence hiring decisions, medical diagnoses, or judicial outcomes can cause tangible harm when deployed without adequate oversight, and market incentives alone have proven insufficient to guarantee responsible development.\n\nOn balance, I would argue that targeted, risk-based regulation, focused on high-stakes applications rather than blanket restrictions, offers the most sensible compromise between these competing priorities.",
      checklist: ['Discute exactamente dos de los tres puntos dados', 'Presenta ambos lados antes de dar tu opinión', 'Usa lenguaje formal e impersonal (it is argued that, proponents claim)', 'Cierra con una postura clara y matizada, no simplista']
    },
    {
      id: 'c1w-es-2',
      prompt: "Your class has watched a discussion about whether cities should prioritize public transport over private car use. You have made the notes below. Write an essay discussing two of the points, giving your own opinion. Notes: reduces pollution; public transport is often unreliable; cars offer more personal freedom.",
      example: "Urban transport policy sits at the intersection of environmental necessity and individual preference, making it a genuinely contentious issue in most major cities.\n\nThe environmental case for prioritizing public transport is difficult to dismiss. Private vehicles remain a substantial source of urban pollution, and shifting even a modest percentage of commuters toward buses and trains could yield measurable improvements in air quality, particularly in densely populated areas.\n\nHowever, this argument tends to overlook the practical shortcomings of existing public transport systems. In many cities, unreliable schedules and overcrowded services make cars, whatever their environmental cost, the more dependable choice for commuters with rigid time constraints, such as those dropping children at school before work.\n\nUltimately, I believe cities cannot reasonably ask residents to abandon cars until public transport is reliable enough to be a genuine alternative; investment in reliability should precede, not follow, restrictions on private vehicles.",
      checklist: ['Discute exactamente dos de los tres puntos dados', 'Reconoce la validez parcial de ambos argumentos', 'Usa conectores formales de contraste y consecuencia', 'Da una opinión final justificada, no solo repetida']
    },
    {
      id: 'c1w-es-3',
      prompt: "Your class has watched a discussion about whether universities should focus more on practical skills than academic theory. You have made the notes below. Write an essay discussing two of the points, giving your own opinion. Notes: graduates need to be job-ready; theory teaches critical thinking; employers can provide practical training themselves.",
      example: "Whether higher education should tilt further toward practical, job-ready skills or continue to emphasize theoretical grounding remains a persistent source of disagreement among educators, employers, and students alike.\n\nThose who favor a more practical curriculum point, not unreasonably, to graduates who leave university with strong theoretical knowledge but little sense of how to apply it in a professional context, leaving employers to bridge that gap at considerable cost.\n\nCritics of this approach, however, argue that a university's distinctive value lies precisely in cultivating critical thinking, the ability to analyze unfamiliar problems rather than execute familiar procedures, a skill that remains valuable long after any specific practical technique has become outdated.\n\nIn my view, the two goals are not mutually exclusive, but if forced to prioritize, I would side with preserving theoretical depth, since practical skills can be acquired relatively quickly on the job, whereas the capacity for rigorous, independent thought is harder to develop later.",
      checklist: ['Discute exactamente dos de los tres puntos dados', 'Usa vocabulario formal y académico consistente', 'Evita generalizaciones sin matizar (not unreasonably, however)', 'Cierra tomando postura de forma razonada, reconociendo la otra cara']
    }
  ],

  // Parte 2 real, opción "report": informe formal con recomendaciones,
  // normalmente dirigido a un superior o comité.
  report: [
    {
      id: 'c1w-rp-1',
      prompt: "You are a member of staff at a language school. The director has asked you to write a report on the school's current online learning resources, evaluating their effectiveness and recommending improvements. Write your report.",
      example: "Report on Online Learning Resources\n\nIntroduction\nThis report evaluates the school's current online learning resources and proposes improvements based on feedback gathered from students and teachers over the past term.\n\nCurrent Provision\nThe school currently offers a basic set of recorded video lessons and downloadable worksheets through its website. While these materials cover core grammar points adequately, they have not been updated in over two years and do not include any interactive or self-checking exercises.\n\nFindings\nFeedback from students consistently highlighted a desire for more interactive content, particularly listening exercises with immediate feedback. Teachers, meanwhile, noted that the lack of progress-tracking makes it difficult to identify which students are actually using the resources.\n\nRecommendations\nI would recommend investing in a simple learning platform that allows for automatic grading and progress tracking, alongside a review of existing materials to bring them in line with current syllabus requirements. A modest budget increase would likely yield a significant improvement in engagement.\n\nConclusion\nWhile the school's foundation is solid, targeted updates would considerably increase the practical value of these resources for both students and staff.",
      checklist: ['Usa encabezados claros (Introduction, Findings, Recommendations)', 'Es objetivo e impersonal, no una opinión personal casual', 'Incluye recomendaciones específicas y accionables', 'Cierra con una conclusión breve que resuma la evaluación']
    },
    {
      id: 'c1w-rp-2',
      prompt: "Your local council has asked residents to submit reports evaluating the town's recycling programme and suggesting how participation could be improved. Write your report.",
      example: "Report on the Town's Recycling Programme\n\nIntroduction\nThis report assesses the current state of the town's recycling programme and outlines recommendations to improve resident participation.\n\nCurrent Situation\nAlthough recycling bins are provided to every household, participation rates remain notably low in several neighbourhoods, particularly among renters in shared accommodation, who report confusion over what can and cannot be recycled.\n\nKey Issues\nThe most frequently cited barrier was a lack of clear, accessible information; the current guidelines are only available in a lengthy document on the council website, which few residents consult. A secondary issue is the infrequency of collection in densely populated areas, which discourages consistent use of recycling bins.\n\nRecommendations\nI would suggest producing a simplified, visual guide to be distributed directly to households, alongside increasing collection frequency in high-density areas. A modest publicity campaign highlighting the environmental impact of improved participation could further encourage engagement.\n\nConclusion\nWith relatively low-cost interventions focused on clarity and convenience, participation rates could improve substantially within a single year.",
      checklist: ['Usa encabezados y estructura formal de informe', 'Identifica causas específicas del problema, no solo el síntoma', 'Da recomendaciones realistas y de bajo costo', 'Tono objetivo, sin usar "I think" de forma casual']
    },
    {
      id: 'c1w-rp-3',
      prompt: "The manager of the company you work for has asked you to write a report on employee satisfaction with the current office layout, based on a recent survey, and to recommend any changes. Write your report.",
      example: "Report on Employee Satisfaction with Office Layout\n\nIntroduction\nThis report summarises the results of a recent survey on employee satisfaction with the current open-plan office layout and recommends possible improvements.\n\nSurvey Findings\nOverall satisfaction was moderate, with 58% of respondents rating the layout positively. However, a recurring complaint concerned noise levels, with many employees reporting difficulty concentrating during busy periods. A smaller but notable group also expressed a preference for more private spaces for confidential calls.\n\nAnalysis\nThe open-plan design appears to support collaboration effectively, which most employees valued, but has clearly not been paired with sufficient quiet zones to balance focused, individual work.\n\nRecommendations\nI would recommend introducing a small number of enclosed booths for calls and focused tasks, which need not require major structural changes. Additionally, designating certain hours as 'quiet hours' in specific zones could address noise concerns without eliminating the collaborative benefits of the current layout.\n\nConclusion\nWith targeted, low-cost adjustments rather than a full redesign, employee satisfaction could be meaningfully improved.",
      checklist: ['Resume los hallazgos de la encuesta de forma objetiva', 'Separa claramente hallazgos, análisis y recomendaciones', 'Sugiere cambios realistas, no una reestructuración total', 'Usa lenguaje de informe formal, no de correo o carta']
    }
  ],

  // Parte 2 real, opción "review": reseña más analítica que la de B2,
  // con evaluación crítica más matizada.
  review: [
    {
      id: 'c1w-rv-1',
      prompt: "An English-language magazine has asked readers to submit reviews of a piece of software or an app they use regularly, evaluating both its strengths and its limitations. Write your review.",
      example: "A Useful Tool, With Caveats\n\nAfter nearly two years of daily use, I have decidedly mixed feelings about this budgeting app, though on balance I would still recommend it.\n\nIts core strength lies in automatic transaction categorisation, which is genuinely more accurate than any competitor I have tried, saving considerable manual effort each month. The visual spending breakdowns are similarly well designed, making patterns immediately apparent in a way that raw numbers rarely achieve.\n\nThat said, the app's customer support has been consistently disappointing; a billing error I reported took nearly three weeks to resolve, despite repeated follow-ups. The subscription price has also crept upward twice in the past year without any corresponding improvement in features, which is difficult to justify.\n\nOn balance, the app's core functionality remains strong enough to outweigh these frustrations, though I would urge the developers to address support response times before the next price increase.",
      checklist: ['Evalúa fortalezas y debilidades de forma equilibrada', 'Da ejemplos concretos, no solo adjetivos vagos', 'Usa vocabulario evaluativo variado (decidedly, genuinely, difficult to justify)', 'Cierra con una recomendación matizada, no absoluta']
    },
    {
      id: 'c1w-rv-2',
      prompt: "A travel website has asked readers to review a city they have visited, discussing whether it lived up to its reputation and who it would suit. Write your review.",
      example: "Beyond the Postcards\n\nArriving with admittedly high expectations shaped by countless photographs, I was curious whether this city could possibly live up to its reputation. For the most part, remarkably, it did.\n\nThe historic centre is every bit as striking in person, and wandering its narrow streets without a fixed itinerary proved far more rewarding than ticking off a checklist of landmarks. Where the city fell somewhat short was in its handling of tourism itself; certain central areas felt overwhelmed, with queues and inflated prices that made genuine local experiences harder to find than expected.\n\nVenturing even slightly beyond the main tourist district, however, revealed a noticeably different, more authentic character, with excellent, unpretentious food at a fraction of the price.\n\nI would recommend this destination enthusiastically to travellers willing to explore beyond the obvious, but those seeking a relaxed, uncrowded trip might find the central areas frustrating during peak season.",
      checklist: ['Discute si el lugar cumplió las expectativas, con matices', 'Menciona para quién sería adecuado (o no)', 'Incluye detalles específicos, no descripciones genéricas', 'Usa vocabulario descriptivo variado y natural']
    },
    {
      id: 'c1w-rv-3',
      prompt: "An online magazine focusing on the arts has asked for reviews of a recent documentary, evaluating how effectively it handled its subject matter. Write your review.",
      example: "A Compelling Subject, Unevenly Handled\n\nThis documentary tackles a genuinely fascinating subject, the disappearance of a once-thriving industrial town, but its execution left me with mixed impressions.\n\nThe first half is genuinely gripping, weaving archival footage with present-day interviews in a way that builds a vivid sense of place and loss. The interview subjects are compelling, and the director wisely allows long silences to speak for themselves rather than over-explaining.\n\nUnfortunately, the second half loses momentum considerably, introducing several tangential subplots that dilute rather than deepen the central narrative. A tighter edit, focused squarely on the town's core story, would likely have made for a more powerful film overall.\n\nDespite this structural weakness, the documentary remains well worth watching for its first half alone, and for anyone interested in the human cost of deindustrialisation, it offers a perspective rarely given this much space.",
      checklist: ['Evalúa la ejecución, no solo el tema', 'Señala tanto fortalezas como debilidades estructurales', 'Usa vocabulario crítico específico (gripping, dilute, tangential)', 'Cierra con una recomendación clara y justificada']
    }
  ],

  // Parte 2 real, opción "proposal": propuesta formal con
  // justificación y recomendación, dirigida a quien toma la decisión.
  proposal: [
    {
      id: 'c1w-pr-1',
      prompt: "Your company is considering introducing a mentorship programme for new employees. Your manager has asked you to write a proposal outlining how the programme could work and why it would be worthwhile. Write your proposal.",
      example: "Proposal: Introducing a Mentorship Programme for New Employees\n\nPurpose\nThis proposal outlines a plan to introduce a structured mentorship programme aimed at improving retention and engagement among new employees during their first six months.\n\nRationale\nExit interviews over the past year indicate that new hires who leave within their first year frequently cite a lack of informal guidance and unclear expectations as contributing factors. A mentorship programme would directly address this gap.\n\nProposed Structure\nEach new employee would be paired with a mentor from a different team, encouraging cross-departmental relationships rather than reinforcing existing hierarchies. Pairs would meet biweekly for the first three months, tapering to monthly check-ins thereafter, with a simple online form to track engagement.\n\nAnticipated Benefits\nBeyond improved retention, this programme would likely strengthen cross-team collaboration and provide informal leadership experience for mentors, an added benefit that could support their own development.\n\nRecommendation\nGiven the relatively low cost of implementation, I would recommend piloting this programme with the next intake of new hires, with a formal review after six months.",
      checklist: ['Explica claramente el propósito y la justificación', 'Propone una estructura concreta y factible', 'Menciona beneficios más allá del objetivo principal', 'Termina con una recomendación clara para el lector']
    },
    {
      id: 'c1w-pr-2',
      prompt: "Your local community centre wants to attract more young people. The centre's director has asked you to write a proposal suggesting new activities or changes that could achieve this. Write your proposal.",
      example: "Proposal: Attracting More Young People to the Community Centre\n\nPurpose\nThis proposal suggests changes to the community centre's programming aimed at increasing engagement among residents aged 16 to 25, a demographic currently underrepresented among regular visitors.\n\nRationale\nA brief survey of local young people revealed that current activities are perceived as geared toward older residents, and that opening hours do not accommodate those in school or early employment.\n\nProposed Changes\nI would suggest introducing evening sessions twice a week, focused on activities identified as popular in the survey, including a shared workspace for studying and a low-cost creative workshop series. Partnering with a local college to promote these sessions directly to students could also improve visibility considerably.\n\nAnticipated Impact\nThese changes would require relatively modest investment, primarily in extended staffing hours, while potentially expanding the centre's user base significantly within its first year.\n\nRecommendation\nI recommend trialling the evening sessions for a three-month period, with attendance data reviewed at the end to determine whether the programme should continue or be adjusted.",
      checklist: ['Basa la propuesta en evidencia (encuesta, datos)', 'Propone cambios concretos y realistas de implementar', 'Explica el impacto esperado', 'Termina con una recomendación de acción clara']
    },
    {
      id: 'c1w-pr-3',
      prompt: "The university you attend is reviewing how it supports international students. You have been asked to write a proposal suggesting improvements. Write your proposal.",
      example: "Proposal: Improving Support for International Students\n\nPurpose\nThis proposal outlines recommendations for improving the university's support for international students, based on informal feedback gathered from students over the past semester.\n\nRationale\nSeveral international students reported feeling isolated during their first weeks, largely due to a lack of structured opportunities to meet peers outside their own nationality group, alongside confusion over administrative processes handled differently than in their home countries.\n\nProposed Changes\nI would recommend introducing a peer-buddy system pairing incoming international students with current students before arrival, alongside a simplified, single-page guide to essential administrative steps, available in the university's most common student languages.\n\nAnticipated Benefits\nThese changes would likely ease the transition considerably during the most difficult period of adjustment, while requiring minimal additional staffing, since the buddy system could be coordinated largely by student volunteers.\n\nRecommendation\nI recommend piloting the buddy system with the next intake of international students, alongside publishing the simplified guide before the start of term.",
      checklist: ['Identifica un problema específico basado en evidencia', 'Propone soluciones concretas y de bajo costo', 'Explica por qué la propuesta beneficiaría a la institución', 'Cierra con una recomendación de acción clara y factible']
    }
  ]
};

const CAMBRIDGE_C1_SPEAKING = {
  // Parte 1 real: entrevista personal breve, con preguntas que
  // requieren respuestas más desarrolladas que en B2.
  interview: [
    { id: 'c1s-p1-1', audioFile: 'audio/cambridge-c1/c1-p1-1.mp3', question: "How do you think the place where you grew up has shaped who you are today?", sampleAnswer: "Da un ejemplo específico y concreto (no una generalización), y conecta explícitamente ese ejemplo con un rasgo tuyo actual ('That's probably why I tend to...')." },
    { id: 'c1s-p1-2', audioFile: 'audio/cambridge-c1/c1-p1-2.mp3', question: "What's something you've changed your mind about in the last few years?", sampleAnswer: "Menciona una opinión específica, explica brevemente por qué pensabas así antes, y qué te hizo cambiar de opinión. Evita respuestas demasiado genéricas." },
    { id: 'c1s-p1-3', audioFile: 'audio/cambridge-c1/c1-p1-3.mp3', question: "Do you think it's important to step outside your comfort zone regularly? Why or why not?", sampleAnswer: "Da tu postura claramente y apóyala con un ejemplo personal breve, usando lenguaje de opinión matizado ('I'd say... to some extent...')." },
    { id: 'c1s-p1-4', audioFile: 'audio/cambridge-c1/c1-p1-4.mp3', question: "What kind of impact do you hope to have, professionally or personally, in the next ten years?", sampleAnswer: "Sé específico sobre un área (no 'ser exitoso' en general), y explica brevemente por qué te importa esa área en particular." }
  ],

  // Parte 2 real: turno individual largo, comparando tres fotografías
  // (más complejo que las dos de B2) con una pregunta específica.
  longTurn: [
    {
      id: 'c1s-lt-1',
      topic: 'Compare two of these three photographs: (1) a person giving a presentation to a large audience, (2) two colleagues having a quiet one-on-one conversation, (3) a team brainstorming around a whiteboard.',
      points: ['Why the people might have chosen to communicate this way', 'What might be challenging about each situation', 'And say which form of communication you find most effective, and why'],
      sampleAnswer: "Elige dos de las tres fotos y acláralo desde el inicio ('I'm going to compare the first and third photos...'). Especula sobre motivaciones con lenguaje apropiado ('they might have chosen this because...'), menciona un reto real de cada situación, y cierra con tu opinión personal justificada. Tienes aproximadamente 1 minuto."
    },
    {
      id: 'c1s-lt-2',
      topic: 'Compare two of these three photographs: (1) someone reading physical newspapers at a café, (2) someone scrolling news on a phone during a commute, (3) a group watching a televised news broadcast together at home.',
      points: ['How each way of getting news might affect how people understand current events', 'What might be lost or gained in each situation', 'And say which method you think leads to better-informed people, and why'],
      sampleAnswer: "Compara dos fotos usando lenguaje de especulación y contraste avanzado ('whereas', 'in contrast'), reflexiona sobre ventajas y desventajas de cada método para informarse, y da una opinión final con una razón sustancial, no superficial."
    },
    {
      id: 'c1s-lt-3',
      topic: 'Compare two of these three photographs: (1) a student studying alone in a library, (2) students in a group study session, (3) a student taking an online course from home.',
      points: ['What kind of learning is likely happening in each situation', 'What kind of person might prefer each approach', 'And say which approach you think suits most people best, and why'],
      sampleAnswer: "Describe qué tipo de aprendizaje ocurre en cada situación elegida, especula sobre qué tipo de persona preferiría cada una, y cierra con una opinión general razonada, reconociendo que depende de la persona."
    }
  ],

  // Parte 3 real: tarea colaborativa en dos fases (discutir todas las
  // opciones, luego llegar a una decisión conjunta), más exigente que
  // en B2.
  collaborativeTask: [
    {
      id: 'c1s-ct-1',
      prompt: "Here are some factors a city could consider when deciding where to build new affordable housing: proximity to public transport, distance from the city centre, availability of green space, and access to schools. First, talk to your partner about how important each factor is. Then decide together which two factors should be given the highest priority.",
      sampleAnswer: "Esta tarea tiene dos fases: primero discute CADA factor con tu compañero imaginario usando lenguaje de opinión matizado ('I'd say that's fairly important, but...'), luego negocia activamente para llegar a un acuerdo sobre los dos factores prioritarios ('Shall we agree that...?', 'I see your point, but I'd still argue...'). Practica ceder terreno en algún punto, no solo insistir en tu opinión inicial."
    },
    {
      id: 'c1s-ct-2',
      prompt: "Here are some ways a university could support students' mental health: offering free counselling, reducing academic workload during exam periods, creating peer support groups, and training staff to recognise warning signs. First, talk to your partner about the potential impact of each idea. Then decide together which one should be implemented first.",
      sampleAnswer: "Habla del impacto potencial de cada opción con razones específicas, no solo adjetivos vagos. Usa frases para construir sobre la idea del otro candidato ('Building on what you said...') y para llegar a una decisión final justificada entre ambos."
    },
    {
      id: 'c1s-ct-3',
      prompt: "Here are some approaches a company could take to reduce staff turnover: increasing salaries, offering more flexible working hours, providing clearer career progression paths, and improving workplace culture. First, talk to your partner about how effective each approach might be. Then decide together which two would have the most lasting impact.",
      sampleAnswer: "Evalúa la efectividad probable de cada opción con tu compañero imaginario, usando lenguaje de acuerdo parcial ('That's fair, though I'd add that...'), y termina la tarea llegando a una decisión conjunta sobre los dos enfoques de mayor impacto duradero."
    }
  ],

  // Parte 4 real: discusión más general y abstracta, relacionada con
  // el tema de la parte 3, con el examinador.
  furtherDiscussion: [
    { id: 'c1s-p4-1', audioFile: 'audio/cambridge-c1/c1-p4-1.mp3', relatedTo: 'c1s-ct-1', question: "To what extent do you think governments, rather than private developers, should be responsible for providing affordable housing?", sampleAnswer: "Toma una postura clara sobre el balance entre gobierno y sector privado, con un ejemplo o razón concreta, y reconoce matices en vez de una respuesta absoluta." },
    { id: 'c1s-p4-2', audioFile: 'audio/cambridge-c1/c1-p4-2.mp3', relatedTo: 'c1s-ct-1', question: "Do you think rapid urban growth generally does more harm than good to a city's quality of life?", sampleAnswer: "Da tu opinión con ejemplos de ambos lados (beneficios y perjuicios del crecimiento urbano) antes de concluir con tu postura personal." },
    { id: 'c1s-p4-3', audioFile: 'audio/cambridge-c1/c1-p4-3.mp3', relatedTo: 'c1s-ct-2', question: "Do you think universities today put too much pressure on students to succeed academically?", sampleAnswer: "Da tu opinión con un ejemplo específico de esa presión, y considera un contraargumento antes de concluir tu postura." },
    { id: 'c1s-p4-4', audioFile: 'audio/cambridge-c1/c1-p4-4.mp3', relatedTo: 'c1s-ct-3', question: "In your view, has remote and flexible work fundamentally changed people's relationship with their jobs?", sampleAnswer: "Compara cómo era antes y cómo es ahora con ejemplos concretos, y da una conclusión personal sobre si el cambio es fundamental o superficial." }
  ]
};
