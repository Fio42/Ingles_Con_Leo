/* ============================================================
   Inglés con Leo — juego-data.js
   Banco de preguntas de English Rush (juego.html), la sección
   gratuita "hasta dónde puedes llegar" de inglés.

   Cada pregunta:
     id       identificador único (para no repetir)
     level    nivel interno del juego (1-10, sube la dificultad)
     cefr     nivel CEFR real (uso interno, no se muestra al jugador)
     type     'translate' | 'complete' | 'natural' | 'error' |
              'vocab' | 'meaning' | 'listen-repeat' | 'listen-answer'
     prompt   texto principal de la pregunta
     options  arreglo de opciones (en el orden en que se escribieron,
              el motor las mezcla con shuffleOptions() al mostrarlas,
              igual que el resto del sitio)
     correct  índice (dentro de "options", ANTES de mezclar) de la
              respuesta correcta
     explain  explicación breve en español, se muestra un instante
              tras responder
     audio    ruta a un mp3 ya existente en el sitio, o null

   Para agregar más preguntas: solo hay que añadir objetos nuevos a
   RUSH_QUESTIONS con un id que no se repita. No hace falta tocar
   juego.js para que aparezcan: el motor las toma automáticamente
   agrupándolas por "level".
   ============================================================ */

const RUSH_LEVELS = [
  { level: 1,  cefr: 'A1', label: 'Nivel 1'  },
  { level: 2,  cefr: 'A1', label: 'Nivel 2'  },
  { level: 3,  cefr: 'A2', label: 'Nivel 3'  },
  { level: 4,  cefr: 'A2', label: 'Nivel 4'  },
  { level: 5,  cefr: 'B1', label: 'Nivel 5'  },
  { level: 6,  cefr: 'B1', label: 'Nivel 6'  },
  { level: 7,  cefr: 'B2', label: 'Nivel 7'  },
  { level: 8,  cefr: 'B2', label: 'Nivel 8'  },
  { level: 9,  cefr: 'C1', label: 'Nivel 9'  },
  { level: 10, cefr: 'C1', label: 'Nivel 10' }
];

const RUSH_QUESTIONS = [
  /* ---------- NIVEL 1 (A1, muy fácil) ---------- */
  { id:'r001', level:1, cefr:'A1', type:'complete', prompt:"She ___ happy.", options:["is","are","am"], correct:0, explain:"Con “she” (una sola persona) se usa “is”." },
  { id:'r002', level:1, cefr:'A1', type:'complete', prompt:"They ___ students.", options:["are","is","am"], correct:0, explain:"Con “they” (varias personas) se usa “are”." },
  { id:'r003', level:1, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “gato” en inglés?", options:["Cat","Dog","Bird"], correct:0, explain:"“Cat” es gato." },
  { id:'r004', level:1, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “libro” en inglés?", options:["Book","Table","Chair"], correct:0, explain:"“Book” es libro." },
  { id:'r005', level:1, cefr:'A1', type:'complete', prompt:"I ___ from Mexico.", options:["am","is","are"], correct:0, explain:"Con “I” siempre se usa “am”." },
  { id:'r006', level:1, cefr:'A1', type:'vocab', prompt:"“Hungry” significa...", options:["Con hambre","Con sueño","Con frío"], correct:0, explain:"“Hungry” es tener hambre." },
  { id:'r007', level:1, cefr:'A1', type:'complete', prompt:"We ___ friends.", options:["are","is","am"], correct:0, explain:"Con “we” se usa “are”." },
  { id:'r008', level:1, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “agua” en inglés?", options:["Water","Milk","Juice"], correct:0, explain:"“Water” es agua." },
  { id:'r009', level:1, cefr:'A1', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["He is my brother.","He are my brother.","He am my brother."], correct:0, explain:"Con “he” se usa “is”, no “are” ni “am”." },
  { id:'r010', level:1, cefr:'A1', type:'vocab', prompt:"“Tired” significa...", options:["Cansado","Feliz","Enojado"], correct:0, explain:"“Tired” es cansado." },
  { id:'r011', level:1, cefr:'A1', type:'complete', prompt:"It ___ a big house.", options:["is","are","am"], correct:0, explain:"Con “it” se usa “is”." },
  { id:'r012', level:1, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “rojo” en inglés?", options:["Red","Blue","Green"], correct:0, explain:"“Red” es rojo." },

  /* ---------- NIVEL 2 (A1, sigue fácil, un poco más de contexto) ---------- */
  { id:'r013', level:2, cefr:'A1', type:'complete', prompt:"My parents ___ doctors.", options:["are","is","be"], correct:0, explain:"“My parents” es plural, se usa “are”." },
  { id:'r014', level:2, cefr:'A1', type:'natural', prompt:"¿Cuál pregunta suena natural?", options:["What is your name?","What your name is?","What name is your?"], correct:0, explain:"En preguntas con “be” el verbo va después de la palabra de pregunta: “What is...?”" },
  { id:'r015', level:2, cefr:'A1', type:'vocab', prompt:"“Spoon” es...", options:["Cuchara","Tenedor","Cuchillo"], correct:0, explain:"“Spoon” es cuchara." },
  { id:'r016', level:2, cefr:'A1', type:'complete', prompt:"This ___ my phone.", options:["is","are","am"], correct:0, explain:"“This” (singular) se usa con “is”." },
  { id:'r017', level:2, cefr:'A1', type:'complete', prompt:"Those ___ my shoes.", options:["are","is","am"], correct:0, explain:"“Those” (plural) se usa con “are”." },
  { id:'r018', level:2, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “ella tiene un perro”?", options:["She has a dog.","She have a dog.","She is a dog."], correct:0, explain:"Con “she” el verbo “have” cambia a “has”." },
  { id:'r019', level:2, cefr:'A1', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["I don't like coffee.","I no like coffee.","I not like coffee."], correct:0, explain:"El negativo de “like” en presente es “don't like”." },
  { id:'r020', level:2, cefr:'A1', type:'vocab', prompt:"“Plate” es...", options:["Plato","Vaso","Taza"], correct:0, explain:"“Plate” es plato." },
  { id:'r021', level:2, cefr:'A1', type:'complete', prompt:"Where ___ you from?", options:["are","is","am"], correct:0, explain:"Con “you” se usa “are”." },
  { id:'r022', level:2, cefr:'A1', type:'natural', prompt:"¿Cuál se usa para decir la hora?", options:["It's three o'clock.","It's three o'clock she.","Is three o'clock."], correct:0, explain:"Para la hora se usa “It's...”." },
  { id:'r023', level:2, cefr:'A1', type:'listen-repeat', audio:'audio/a0/a0listening-001.mp3', prompt:"Escucha. ¿Qué escuchaste?", options:["I have a cat.","I have a hat.","I have a map."], correct:0, explain:"El audio dice “I have a cat.”" },
  { id:'r024', level:2, cefr:'A1', type:'listen-repeat', audio:'audio/a0/a0listening-002.mp3', prompt:"Escucha. ¿Qué escuchaste?", options:["My house is big.","My mouse is big.","My house is bad."], correct:0, explain:"El audio dice “My house is big.”" },
  /* ---------- NIVEL 3 (A2) ---------- */
  { id:'r025', level:3, cefr:'A2', type:'complete', prompt:"I usually go to bed ___ 10 PM.", options:["at","in","on"], correct:0, explain:"Con horas exactas se usa “at”." },
  { id:'r026', level:3, cefr:'A2', type:'complete', prompt:"My birthday is ___ March.", options:["in","at","on"], correct:0, explain:"Con meses se usa “in”." },
  { id:'r027', level:3, cefr:'A2', type:'complete', prompt:"We're meeting ___ Monday.", options:["on","in","at"], correct:0, explain:"Con días de la semana se usa “on”." },
  { id:'r028', level:3, cefr:'A2', type:'complete', prompt:"Yesterday I ___ to the market.", options:["went","go","goes"], correct:0, explain:"“Go” en pasado es “went”." },
  { id:'r029', level:3, cefr:'A2', type:'complete', prompt:"She ___ TV when I called her.", options:["was watching","watched","watches"], correct:0, explain:"Una acción en progreso en el pasado usa “was/were + -ing”." },
  { id:'r030', level:3, cefr:'A2', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["Did you see that movie?","Did you saw that movie?","Do you saw that movie?"], correct:0, explain:"Con “did” el verbo va en forma base: “Did you see...?”" },
  { id:'r031', level:3, cefr:'A2', type:'vocab', prompt:"“Expensive” significa...", options:["Caro","Barato","Nuevo"], correct:0, explain:"“Expensive” es caro." },
  { id:'r032', level:3, cefr:'A2', type:'natural', prompt:"¿Cuál pregunta suena natural?", options:["How much does this cost?","How much this cost does?","How much cost this does?"], correct:0, explain:"El orden correcto es “How much does this cost?”" },
  { id:'r033', level:3, cefr:'A2', type:'complete', prompt:"There ___ a lot of people at the party.", options:["were","was","are"], correct:0, explain:"“A lot of people” es plural, en pasado se usa “were”." },
  { id:'r034', level:3, cefr:'A2', type:'vocab', prompt:"“Cheap” significa...", options:["Barato","Caro","Rápido"], correct:0, explain:"“Cheap” es barato." },
  { id:'r035', level:3, cefr:'A2', type:'complete', prompt:"He ___ eat meat. He's vegetarian.", options:["doesn't","don't","isn't"], correct:0, explain:"Con “he” el negativo es “doesn't”." },
  { id:'r036', level:3, cefr:'A2', type:'complete', prompt:"I need this report ___ Monday morning.", options:["by","until","since"], correct:0, explain:"“By” indica una fecha límite: a más tardar el lunes." },

  /* ---------- NIVEL 4 (A2, un poco más contexto) ---------- */
  { id:'r037', level:4, cefr:'A2', type:'complete', prompt:"I'll wait for you ___ 5 o'clock, so hurry up.", options:["until","by","for"], correct:0, explain:"“Until” indica hasta cuándo dura algo." },
  { id:'r038', level:4, cefr:'A2', type:'complete', prompt:"I have ___ money, so I can buy lunch today.", options:["a little","little","a few"], correct:0, explain:"“A little” significa “algo, suficiente” (positivo)." },
  { id:'r039', level:4, cefr:'A2', type:'complete', prompt:"I have ___ money, I can't buy anything.", options:["little","a little","many"], correct:0, explain:"“Little” (sin “a”) significa “casi nada” (negativo)." },
  { id:'r040', level:4, cefr:'A2', type:'natural', prompt:"¿Cuál frase suena más natural para pedir algo?", options:["Could you pass me the salt, please?","You pass me the salt?","Pass me salt, you could?"], correct:0, explain:"“Could you...?” es la forma cortés y natural de pedir algo." },
  { id:'r041', level:4, cefr:'A2', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["She is taller than her sister.","She is more tall than her sister.","She is tallest than her sister."], correct:0, explain:"“Tall” es corto, el comparativo es “taller”, no “more tall”." },
  { id:'r042', level:4, cefr:'A2', type:'vocab', prompt:"“To borrow” significa...", options:["Pedir prestado","Prestar","Comprar"], correct:0, explain:"“Borrow” es pedir prestado (tú recibes algo)." },
  { id:'r043', level:4, cefr:'A2', type:'vocab', prompt:"“To lend” significa...", options:["Prestar","Pedir prestado","Devolver"], correct:0, explain:"“Lend” es prestar (tú das algo)." },
  { id:'r044', level:4, cefr:'A2', type:'complete', prompt:"She works ___ a teacher.", options:["as","like","for"], correct:0, explain:"“As” se usa para decir la función o el trabajo de alguien." },
  { id:'r045', level:4, cefr:'A2', type:'complete', prompt:"He swims ___ a fish.", options:["like","as","for"], correct:0, explain:"“Like” se usa para comparar con algo (“como un pez”)." },
  { id:'r046', level:4, cefr:'A2', type:'meaning', prompt:"“I'm looking forward to it” significa que...", options:["Tengo muchas ganas de que pase","Estoy buscando algo","Ya lo olvidé"], correct:0, explain:"“Look forward to” es esperar algo con ganas." },
  { id:'r047', level:4, cefr:'A2', type:'listen-repeat', audio:'audio/a1/a1listening-001.mp3', prompt:"Escucha. ¿Qué escuchaste?", options:["I wake up at seven every morning.","I wake up at seven every evening.","I woke up at seven this morning."], correct:0, explain:"El audio dice “I wake up at seven every morning.”" },
  { id:'r048', level:4, cefr:'A2', type:'listen-repeat', audio:'audio/a1/a1listening-002.mp3', prompt:"Escucha. ¿Qué escuchaste?", options:["She usually drinks coffee, not tea.","She usually drinks tea, not coffee.","She never drinks coffee or tea."], correct:0, explain:"El audio dice “She usually drinks coffee, not tea.”" },
  /* ---------- NIVEL 5 (B1) ---------- */
  { id:'r049', level:5, cefr:'B1', type:'complete', prompt:"I've lived here ___ 2020.", options:["since","for","during"], correct:0, explain:"“Since” se usa con un punto de partida (un año, una fecha)." },
  { id:'r050', level:5, cefr:'B1', type:'complete', prompt:"I've lived here ___ six years.", options:["for","since","from"], correct:0, explain:"“For” se usa con una duración (seis años)." },
  { id:'r051', level:5, cefr:'B1', type:'complete', prompt:"She has already ___ that movie.", options:["seen","saw","see"], correct:0, explain:"Con “have/has” se usa el participio: “seen”." },
  { id:'r052', level:5, cefr:'B1', type:'meaning', prompt:"“I ran into an old friend” significa que...", options:["Me encontré por casualidad a un amigo","Choqué con un amigo","Le hablé a un amigo por teléfono"], correct:0, explain:"“Run into someone” es encontrarse a alguien sin planearlo." },
  { id:'r053', level:5, cefr:'B1', type:'meaning', prompt:"“She gave up smoking” significa que...", options:["Dejó de fumar","Empezó a fumar","Le regaló cigarros a alguien"], correct:0, explain:"“Give up” es dejar de hacer algo." },
  { id:'r054', level:5, cefr:'B1', type:'complete', prompt:"I wish I ___ more free time.", options:["had","have","having"], correct:0, explain:"Después de “I wish” se usa el pasado, aunque hable del presente." },
  { id:'r055', level:5, cefr:'B1', type:'natural', prompt:"¿Cuál frase suena más natural?", options:["I'm not really into horror movies.","I'm not really inside horror movies.","I don't am into horror movies."], correct:0, explain:"“Be into something” es una expresión natural para decir que algo te gusta." },
  { id:'r056', level:5, cefr:'B1', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["If it rains, we will stay home.","If it will rain, we stay home.","If it rains, we would stay home."], correct:0, explain:"En condicionales del tipo 1: “if + presente, will + verbo”." },
  { id:'r057', level:5, cefr:'B1', type:'complete', prompt:"Submit the proposal ___ end of day.", options:["by","until","in"], correct:0, explain:"“By end of day” es “antes de que termine el día”." },
  { id:'r058', level:5, cefr:'B1', type:'complete', prompt:"He will keep working ___ the project is finished.", options:["until","by","for"], correct:0, explain:"“Until” indica que la acción continúa hasta ese momento." },
  { id:'r059', level:5, cefr:'B1', type:'vocab', prompt:"“To figure out” significa...", options:["Entender / resolver algo","Olvidar algo","Dibujar algo"], correct:0, explain:"“Figure out” es descifrar o entender algo." },
  { id:'r060', level:5, cefr:'B1', type:'listen-repeat', audio:'audio/a1/a1listening-003.mp3', prompt:"Escucha. ¿Qué escuchaste?", options:["The store closes at nine tonight.","The store opens at nine tonight.","The store closed at nine last night."], correct:0, explain:"El audio dice “The store closes at nine tonight.”" },

  /* ---------- NIVEL 6 (B1, phrasal verbs y errores comunes) ---------- */
  { id:'r061', level:6, cefr:'B1', type:'meaning', prompt:"“Can you turn down the music?” significa...", options:["Bájale a la música","Súbele a la música","Apaga la música"], correct:0, explain:"“Turn down” es bajar el volumen." },
  { id:'r062', level:6, cefr:'B1', type:'meaning', prompt:"“I'm going to put off the meeting” significa...", options:["Voy a posponer la reunión","Voy a cancelar la reunión","Voy a empezar la reunión"], correct:0, explain:"“Put off” es posponer, dejar para después." },
  { id:'r063', level:6, cefr:'B1', type:'complete', prompt:"Not until the deadline passed ___ they respond.", options:["did","they did","do"], correct:0, explain:"Con “Not until” al inicio, el orden se invierte: “did they respond”." },
  { id:'r064', level:6, cefr:'B1', type:'natural', prompt:"¿Cuál suena más natural para rechazar una oferta?", options:["Thanks, but I'll pass this time.","Thanks, but I pass this one time.","Thank, but I will passing."], correct:0, explain:"“I'll pass” es una forma natural de decir “paso, no gracias”." },
  { id:'r065', level:6, cefr:'B1', type:'complete', prompt:"Despite ___ tired, she finished the race.", options:["being","be","was"], correct:0, explain:"Después de “despite” se usa un gerundio: “being tired”." },
  { id:'r066', level:6, cefr:'B1', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["I'm used to working late.","I'm used to work late.","I used to working late."], correct:0, explain:"“Be used to” va seguido de gerundio: “working”." },
  { id:'r067', level:6, cefr:'B1', type:'meaning', prompt:"“It goes without saying that quality comes first” significa...", options:["Es obvio que la calidad es lo primero","Nadie habla de la calidad","La calidad no importa"], correct:0, explain:"“It goes without saying” es “es obvio, ni hace falta decirlo”." },
  { id:'r068', level:6, cefr:'B1', type:'complete', prompt:"The project succeeded, ___ some setbacks.", options:["albeit with","despite","although"], correct:0, explain:"“Albeit with” significa “aunque con”, seguido de sustantivo." },
  { id:'r069', level:6, cefr:'B1', type:'vocab', prompt:"“Reluctant” significa...", options:["Poco dispuesto / renuente","Muy entusiasmado","Confundido"], correct:0, explain:"“Reluctant” es cuando no quieres hacer algo." },
  { id:'r070', level:6, cefr:'B1', type:'listen-repeat', audio:'audio/b1/b1listening-001.mp3', prompt:"Escucha. ¿Qué escuchaste?", options:["By the time we arrived, the movie had already started.","By the time we arrived, the movie hadn't started yet.","By the time we left, the movie had already started."], correct:0, explain:"El audio dice “By the time we arrived, the movie had already started.”" },
  { id:'r071', level:6, cefr:'B1', type:'listen-repeat', audio:'audio/b1/b1listening-002.mp3', prompt:"Escucha. ¿Qué escuchaste?", options:["I'm used to working late, so it doesn't bother me.","I'm not used to working late, so it bothers me.","I used to work late, but not anymore."], correct:0, explain:"El audio dice “I'm used to working late, so it doesn't bother me.”" },
  { id:'r072', level:6, cefr:'B1', type:'complete', prompt:"I can't stand ___ in traffic every morning.", options:["sitting","sit","to sitting"], correct:0, explain:"“Can't stand” va seguido de gerundio: “sitting”." },
  /* ---------- NIVEL 7 (B2) ---------- */
  { id:'r073', level:7, cefr:'B2', type:'complete', prompt:"If I'd known earlier, I ___ you.", options:["would've told","would tell","had told"], correct:0, explain:"Condicional mixto: pasado hipotético + “would've + participio”." },
  { id:'r074', level:7, cefr:'B2', type:'complete', prompt:"Whereas John prefers mornings, his sister prefers evenings.", options:["Whereas shows a contrast","Whereas shows a reason","Whereas shows agreement"], correct:0, explain:"“Whereas” marca un contraste entre dos cosas." },
  { id:'r075', level:7, cefr:'B2', type:'natural', prompt:"¿Cuál suena más natural para expresar una opinión con cuidado?", options:["I'm inclined to think it's a bad idea.","I inclined that it's a bad idea.","I'm inclining to think it's bad idea."], correct:0, explain:"“I'm inclined to think...” es una forma natural y algo formal de opinar." },
  { id:'r076', level:7, cefr:'B2', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["Had I known, I would have left earlier.","Had I know, I would have left earlier.","Have I known, I would left earlier."], correct:0, explain:"Inversión de “if I had known”: “Had I known...”, con el participio “known”." },
  { id:'r077', level:7, cefr:'B2', type:'meaning', prompt:"“She was very discreet about her plans” significa que...", options:["Fue cuidadosa y no reveló mucho","Habló de sus planes con todos","Cambió sus planes de repente"], correct:0, explain:"“Discreet” es discreta, prudente." },
  { id:'r078', level:7, cefr:'B2', type:'complete', prompt:"I assume you ___ already read the report.", options:["have","has","had"], correct:0, explain:"Con “you” el auxiliar del present perfect es “have”." },
  { id:'r079', level:7, cefr:'B2', type:'vocab', prompt:"“Thorough” significa...", options:["Minucioso, muy detallado","Rápido y descuidado","Confundido"], correct:0, explain:"“Thorough” es hacer algo con mucho cuidado y detalle." },
  { id:'r080', level:7, cefr:'B2', type:'complete', prompt:"Can you ___ your laptop when you come to my office?", options:["bring","take","carry"], correct:0, explain:"“Bring” es traer algo hacia donde está quien habla." },
  { id:'r081', level:7, cefr:'B2', type:'complete', prompt:"I need to ___ this package to the post office.", options:["take","bring","carry on"], correct:0, explain:"“Take” es llevar algo lejos de donde está quien habla." },
  { id:'r082', level:7, cefr:'B2', type:'meaning', prompt:"“We're on the same page” significa que...", options:["Estamos de acuerdo","Estamos leyendo lo mismo","Estamos confundidos"], correct:0, explain:"“Be on the same page” es estar de acuerdo o entender algo igual." },
  { id:'r083', level:7, cefr:'B2', type:'listen-answer', audio:'audio/toefl/tl-cr-1.mp3', prompt:"Escucha la pregunta. ¿Cuál es la mejor respuesta?", options:["Sure, I have about twenty minutes.","I finished the report yesterday.","The meeting room is on the third floor."], correct:0, explain:"Preguntan si quieres ir a comer; lo natural es aceptar o decir cuánto tiempo tienes." },
  { id:'r084', level:7, cefr:'B2', type:'listen-answer', audio:'audio/toefl/tl-cr-3.mp3', prompt:"Escucha la pregunta. ¿Cuál es la mejor respuesta?", options:["Of course, I'll email them to you tonight.","The lecture starts at nine.","I forgot my notebook at home."], correct:0, explain:"Te piden algo directamente; la respuesta natural dice si puedes ayudar." },

  /* ---------- NIVEL 8 (B2, distractores más parecidos) ---------- */
  { id:'r085', level:8, cefr:'B2', type:'complete', prompt:"By the time you arrive, we ___ dinner already.", options:["will have finished","will finish","finished"], correct:0, explain:"Future perfect: algo estará terminado antes de otro momento futuro." },
  { id:'r086', level:8, cefr:'B2', type:'natural', prompt:"¿Cuál suena más natural para dar una mala noticia con tacto?", options:["I'm afraid we won't be able to make it.","I afraid we won't can make it.","I'm afraid we can't to make it."], correct:0, explain:"“I'm afraid...” suaviza una mala noticia de forma natural." },
  { id:'r087', level:8, cefr:'B2', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["I'd rather you didn't tell him.","I'd rather you don't tell him.","I'd rather you not told him."], correct:0, explain:"“Would rather” + otra persona usa el pasado simple: “you didn't tell”." },
  { id:'r088', level:8, cefr:'B2', type:'meaning', prompt:"“He's a bit of a perfectionist” significa que...", options:["Es algo perfeccionista","Es totalmente perfecto","Odia hacer las cosas bien"], correct:0, explain:"“A bit of a...” suaviza una característica: “algo perfeccionista”." },
  { id:'r089', level:8, cefr:'B2', type:'complete', prompt:"No sooner ___ the office than the phone rang.", options:["had she left","she had left","she left"], correct:0, explain:"“No sooner” al inicio invierte el orden: “had she left”." },
  { id:'r090', level:8, cefr:'B2', type:'vocab', prompt:"“To overlook” significa...", options:["Pasar por alto, no notar","Vigilar de cerca","Aprobar oficialmente"], correct:0, explain:"“Overlook” es no darse cuenta de algo o dejarlo pasar." },
  { id:'r091', level:8, cefr:'B2', type:'complete', prompt:"She'd have called if she ___ your number.", options:["had had","has had","have had"], correct:0, explain:"Tercer condicional: “if + had + participio”." },
  { id:'r092', level:8, cefr:'B2', type:'natural', prompt:"¿Cuál suena más natural para pedir una aclaración?", options:["Sorry, could you run that by me again?","Sorry, could you run that on me again?","Sorry, could you running that by me?"], correct:0, explain:"“Run something by someone” es explicar algo de nuevo." },
  { id:'r093', level:8, cefr:'B2', type:'listen-answer', audio:'audio/toefl/tl-cr-4.mp3', prompt:"Escucha la pregunta. ¿Cuál es la mejor respuesta?", options:["Really? I'll ask IT to take a look at it.","I printed twenty pages yesterday.","The office closes at six."], correct:0, explain:"Mencionan un problema; la respuesta natural reacciona y ofrece una solución." },
  { id:'r094', level:8, cefr:'B2', type:'listen-answer', audio:'audio/toefl/tl-cr-5.mp3', prompt:"Escucha la pregunta. ¿Cuál es la mejor respuesta?", options:["Not at all, which seat would you like?","The train leaves in ten minutes.","I already have a ticket."], correct:0, explain:"“Would you mind...?” es una petición cortés que se acepta o rechaza." },
  /* ---------- NIVEL 9 (C1) ---------- */
  { id:'r095', level:9, cefr:'C1', type:'complete', prompt:"Rarely ___ such a compelling argument.", options:["have I heard","I have heard","I heard"], correct:0, explain:"“Rarely” al inicio invierte el orden: “have I heard”." },
  { id:'r096', level:9, cefr:'C1', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["Not only did she win, but she also broke the record.","Not only she did win, but she also broke the record.","Not only did she won, but she also broke the record."], correct:0, explain:"“Not only” al inicio invierte el orden y usa el verbo base: “did she win”." },
  { id:'r097', level:9, cefr:'C1', type:'meaning', prompt:"“Her argument was somewhat tenuous” significa que...", options:["Su argumento era débil, poco convincente","Su argumento era muy sólido","Su argumento era muy largo"], correct:0, explain:"“Tenuous” describe algo débil o poco sustentado." },
  { id:'r098', level:9, cefr:'C1', type:'complete', prompt:"Were it not for your help, I ___ have finished on time.", options:["wouldn't","won't","don't"], correct:0, explain:"“Were it not for” es una forma formal de “if it weren't for”, seguida de “would(n't) have”." },
  { id:'r099', level:9, cefr:'C1', type:'natural', prompt:"¿Cuál suena más natural para matizar una crítica?", options:["To some extent, I see your point, but I disagree.","In some extent, I see your point, but I disagree.","At some extent, I see your point, but I disagree."], correct:0, explain:"La expresión correcta es “to some extent”." },
  { id:'r100', level:9, cefr:'C1', type:'vocab', prompt:"“Ambivalent” significa...", options:["Con sentimientos encontrados","Muy seguro de algo","Completamente indiferente"], correct:0, explain:"“Ambivalent” es tener sentimientos mixtos o contradictorios sobre algo." },
  { id:'r101', level:9, cefr:'C1', type:'complete', prompt:"Little ___ that the deal would fall through.", options:["did they know","they knew","they did know"], correct:0, explain:"“Little” al inicio (con sentido negativo) invierte el orden: “did they know”." },
  { id:'r102', level:9, cefr:'C1', type:'meaning', prompt:"“The deadline is looming” significa que...", options:["La fecha límite se acerca de forma preocupante","La fecha límite ya pasó","La fecha límite se canceló"], correct:0, explain:"“Loom” sugiere que algo se acerca de forma amenazante o urgente." },

  /* ---------- NIVEL 10 (C1, el más difícil) ---------- */
  { id:'r103', level:10, cefr:'C1', type:'complete', prompt:"Had the board approved the merger, the company ___ significantly larger by now.", options:["would have been","would be","will be"], correct:0, explain:"Condicional mixto: causa en el pasado (had approved), resultado en el pasado también aquí (“would have been”) porque habla de un resultado que ya habría ocurrido." },
  { id:'r104', level:10, cefr:'C1', type:'error', prompt:"¿Cuál frase está bien escrita?", options:["So convincing was her speech that the board approved it unanimously.","So convincing her speech was that the board approved it unanimously.","So convincing was her speech, the board approved it unanimously that."], correct:0, explain:"“So + adjetivo” al inicio invierte el orden: “So convincing was her speech...”" },
  { id:'r105', level:10, cefr:'C1', type:'meaning', prompt:"“The negotiations reached an impasse” significa que...", options:["Las negociaciones se estancaron, sin avance posible","Las negociaciones terminaron con éxito","Las negociaciones apenas comenzaron"], correct:0, explain:"“Impasse” es un punto donde no se puede avanzar más." },
  { id:'r106', level:10, cefr:'C1', type:'natural', prompt:"¿Cuál suena más natural en un contexto formal para mostrar desacuerdo?", options:["With all due respect, I have to disagree.","With all due respect, I have to disagreeing.","With all the due respect, I disagree to."], correct:0, explain:"“With all due respect” es una forma formal y natural de introducir un desacuerdo." },
  { id:'r107', level:10, cefr:'C1', type:'vocab', prompt:"“To concede” significa...", options:["Admitir algo, aunque no quieras","Negar rotundamente","Celebrar un logro"], correct:0, explain:"“Concede” es admitir algo, a veces a regañadientes." },
  { id:'r108', level:10, cefr:'C1', type:'complete', prompt:"Seldom ___ a candidate so well prepared for the role.", options:["have we seen","we have seen","we saw"], correct:0, explain:"“Seldom” al inicio invierte el orden: “have we seen”." },
  { id:'r109', level:10, cefr:'C1', type:'meaning', prompt:"“His remarks were laced with irony” significa que...", options:["Sus comentarios tenían un tono irónico","Sus comentarios eran muy serios","Sus comentarios eran confusos"], correct:0, explain:"“Laced with irony” es que algo está impregnado de ironía." },
  { id:'r110', level:10, cefr:'C1', type:'complete', prompt:"The proposal, ___ ambitious, received unanimous support.", options:["albeit","despite","although it"], correct:0, explain:"“Albeit” + adjetivo es una forma concisa y formal de decir “aunque ambicioso”." },

  /* ---------- NÚMEROS: precios, teléfonos, direcciones, años (2026-09-16) ---------- */
  { id:'r111', level:1, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “15” en inglés?", options:["Fifteen","Fifty","Five"], correct:0, explain:"“Fifteen” es 15." },
  { id:'r112', level:1, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “12” en inglés?", options:["Twelve","Twenty","Two"], correct:0, explain:"“Twelve” es 12." },
  { id:'r113', level:2, cefr:'A1', type:'vocab', prompt:"¿Cuál es 50?", options:["Fifty","Fifteen","Five hundred"], correct:0, explain:"“Fifty” es 50." },
  { id:'r114', level:2, cefr:'A1', type:'translate', prompt:"¿Cómo se dice “80” en inglés?", options:["Eighty","Eighteen","Eight"], correct:0, explain:"“Eighty” es 80." },
  { id:'r115', level:3, cefr:'A2', type:'vocab', prompt:"¿Cuál es 1,300?", options:["One thousand three hundred","One hundred three","Thirteen thousand"], correct:0, explain:"1,300 se dice “one thousand three hundred”." },
  { id:'r116', level:3, cefr:'A2', type:'vocab', prompt:"¿Cuál es 10,000?", options:["Ten thousand","One thousand hundred","One hundred thousand"], correct:0, explain:"10,000 es “ten thousand”." },
  { id:'r117', level:3, cefr:'A2', type:'listen-repeat', audio:'audio/numeros/a0-numeros-2.mp3', prompt:"Escucha. ¿Cuánto es?", options:["$5","$50","$15"], correct:0, explain:"El audio dice “It's five dollars.”" },
  { id:'r118', level:4, cefr:'A2', type:'listen-repeat', audio:'audio/numeros/a1-numeros-1.mp3', prompt:"Escucha. ¿Cuánto es?", options:["$150","$115","$1,500"], correct:0, explain:"El audio dice “It's one hundred fifty dollars.”" },
  { id:'r119', level:4, cefr:'A2', type:'listen-repeat', audio:'audio/numeros/a1-numeros-2.mp3', prompt:"Escucha. ¿Cuál es el número?", options:["984-555-2100","948-555-2100","984-555-2010"], correct:0, explain:"El audio dice el teléfono número por número." },
  { id:'r120', level:5, cefr:'B1', type:'listen-repeat', audio:'audio/numeros/b1-numeros-2.mp3', prompt:"Escucha. ¿Cuál es la dirección?", options:["425 Oak Street","245 Oak Street","452 Oak Street"], correct:0, explain:"El audio dice “four two five Oak Street” = 425 Oak Street." },
  { id:'r121', level:5, cefr:'B1', type:'listen-repeat', audio:'audio/numeros/a1-numeros-3.mp3', prompt:"Escucha. ¿En qué año nació?", options:["1998","1988","1989"], correct:0, explain:"El audio dice “nineteen ninety-eight” = 1998." },
  { id:'r122', level:6, cefr:'B1', type:'listen-repeat', audio:'audio/numeros/b1-numeros-3.mp3', prompt:"Escucha. ¿Cuánto es?", options:["$1,500","$15,000","$150"], correct:0, explain:"“Fifteen hundred” = 1,500." }

];
