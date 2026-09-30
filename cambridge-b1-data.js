// ============================================================
// Inglés con Leo — Contenido de práctica para Cambridge English
// B1 PRELIMINARY (PET)
//
// Mismo motor que B2 First y C1 Advanced (cambridge.js); cambia solo
// el contenido y la dificultad. Formato vigente según
// cambridgeenglish.org (B1 Preliminary, versión 2020 en adelante):
//
//   Reading                 6 partes, 32 preguntas, ~45 min
//   Writing                 2 partes (correo obligatorio + artículo o
//                           historia), ~45 min
//   Listening               4 partes, 25 preguntas, ~30 min
//   Speaking                4 partes, 10-12 min, en pareja
//
// Escala: 140-159 = Level B1 (aprobado), 120-139 = Level A2,
// 160-170 = nivel B2 (Grade A). El mínimo para aprobar es 140.
//
// Contenido representativo escrito para este sitio (no es copia de
// un examen real). Lo ya escrito en B2/C1 no se reutiliza.
//
// Estructura por sección:
//   CAMBRIDGE_B1_READING.shortText / .multipleMatching /
//        .readingComprehension / .gappedText / .multipleChoiceCloze / .openCloze
//   CAMBRIDGE_B1_LISTENING.shortExtract / .longInterview /
//        .sentenceCompletion / .multipleMatching
//   CAMBRIDGE_B1_WRITING.email / .story / .article
//   CAMBRIDGE_B1_SPEAKING.interview / .collaborativeTask /
//        .longTurn / .furtherDiscussion
// ============================================================

const CAMBRIDGE_B1_READING = {
  // Parte 1 real: textos cortos (avisos, mensajes, correos) con una
  // pregunta de opción múltiple.
  shortText: [
    {
      id: 'b1-st-1',
      title: 'Notice at a swimming pool',
      text: "Pool closed on Monday for cleaning. It will open again on Tuesday at 7 a.m. Members can use the pool at the sports centre across the road for free until then. Please show your card at the desk.",
      question: "What should members do if they want to swim on Monday?",
      options: ['Go to another pool nearby and show their card', 'Come back to this pool on Tuesday only', 'Pay extra at the sports centre', 'Ask for a new card at the desk'],
      correct: 0,
      explain: 'El aviso dice que los socios pueden usar la alberca del centro deportivo de enfrente gratis, mostrando su tarjeta.'
    },
    {
      id: 'b1-st-2',
      title: 'Message from Clara to Jon',
      text: "Hi Jon! I'm running late because my bus broke down. Can you start the film without me? I'll be there by 8:15 at the latest. Save me a seat next to the door and I'll bring the popcorn!",
      question: "Why is Clara writing to Jon?",
      options: ['To explain she will arrive after the film starts', 'To ask him to buy the tickets', 'To say she can no longer come', 'To ask him to bring some food'],
      correct: 0,
      explain: 'Clara llegará tarde (a más tardar 8:15) y le pide a Jon que empiece la película sin ella.'
    },
    {
      id: 'b1-st-3',
      title: 'Email from a language school',
      text: "Dear students, the Friday conversation class will start one hour earlier this week because our teacher has a doctor's appointment in the afternoon. The class will now be at 4 p.m. instead of 5 p.m. The room is the same. See you on Friday!",
      question: "What has changed about the Friday class?",
      options: ['The time', 'The room', 'The teacher', 'The day'],
      correct: 0,
      explain: 'La clase pasa de las 5 p.m. a las 4 p.m.; el salón y el día siguen igual.'
    },
    {
      id: 'b1-st-4',
      title: 'Sign in a library',
      text: "Please keep your voice down. Group work is allowed only on the second floor. Food is not permitted, but you can bring bottled water. Books must be returned within three weeks.",
      question: "What is allowed in the library?",
      options: ['Drinking bottled water', 'Eating a sandwich', 'Talking loudly on the first floor', 'Keeping books for a month'],
      correct: 0,
      explain: 'El letrero prohíbe la comida pero permite llevar agua embotellada.'
    },
    {
      id: 'b1-st-5',
      title: 'Text message from Dad',
      text: "I'm going to the supermarket after work. We have no milk or eggs, and I think we need bread too. Text me if you want anything else. I'll be home around 6.",
      question: "What is Dad going to do?",
      options: ['Buy food on his way home', 'Cook dinner at 6 o\'clock', 'Ask his child to go shopping', 'Leave work early'],
      correct: 0,
      explain: 'Papá irá al supermercado después del trabajo y llegará a casa hacia las 6.'
    },
    {
      id: 'b1-st-6',
      title: 'Advert for a bicycle',
      text: "For sale: mountain bike, two years old, in very good condition. New tyres and a light for night riding. I'm selling it because I'm moving abroad. Price: 150 euros. Call Marta after 6 p.m.",
      question: "Why is Marta selling her bike?",
      options: ['She is going to live in another country', 'She has bought a newer model', 'It needs new tyres', 'She does not like riding at night'],
      correct: 0,
      explain: '"Moving abroad" significa mudarse a otro país; esa es la razón de la venta.'
    }
  ],

  // Parte 2 real: matching. Se describen varias personas y hay que
  // identificar a quién corresponde una afirmación.
  multipleMatching: [
    {
      id: 'b1-mm-1',
      paragraph: "Four teenagers talk about the free time they enjoy most. Nora loves drawing comics and spends hours in her room with her pencils. Diego plays football with his cousins every afternoon, even when it rains. Ivy is learning the guitar and hopes to play in a band one day. Tom likes cooking and often makes dinner for his family on Sundays.",
      question: "Who wants to perform for an audience in the future?",
      options: ['Nora', 'Diego', 'Ivy', 'Tom'],
      correct: 2,
      explain: 'Ivy está aprendiendo guitarra y quiere tocar en una banda algún día.'
    },
    {
      id: 'b1-mm-2',
      paragraph: "Four people describe how they travel to work. Helen cycles because she wants to stay fit and save money. Omar takes the underground, which lets him read for forty minutes every morning. Jess drives, since her office is far from any train station. Paul walks, as he lives only ten minutes from his shop.",
      question: "Who uses the journey to relax with a book?",
      options: ['Helen', 'Omar', 'Jess', 'Paul'],
      correct: 1,
      explain: 'Omar viaja en el metro y aprovecha los cuarenta minutos para leer.'
    },
    {
      id: 'b1-mm-3',
      paragraph: "Four friends are choosing a present for a colleague's birthday. Lena thinks a plant would be nice because it lasts a long time. Ben would prefer a gift card so the colleague can choose something. Sara wants to buy a box of chocolates from the new bakery. Kai suggests a mug with a funny message, since the colleague drinks tea all day.",
      question: "Who wants to give something the colleague can pick for themselves?",
      options: ['Lena', 'Ben', 'Sara', 'Kai'],
      correct: 1,
      explain: 'Ben prefiere una tarjeta de regalo para que el colega elija lo que quiera.'
    },
    {
      id: 'b1-mm-4',
      paragraph: "Four students talk about their holidays. Amir went camping by a lake and says the nights were freezing cold. Beth stayed with her grandparents on a farm and helped to feed the animals. Carlos visited a big city and spent most of his time in art galleries. Dana didn't travel at all; she worked in a cafe to earn money for a new laptop.",
      question: "Who spent the holiday earning money?",
      options: ['Amir', 'Beth', 'Carlos', 'Dana'],
      correct: 3,
      explain: 'Dana no viajó: trabajó en una cafetería para ganar dinero para una laptop nueva.'
    }
  ],

  // Parte 3 real: texto más largo con una pregunta de opción múltiple.
  readingComprehension: [
    {
      id: 'b1-rc-1',
      title: 'A Different Kind of Summer Job',
      text: "Last summer, seventeen-year-old Mia worked as a guide at a small museum in her town. At first she was nervous about speaking to groups of strangers, but the manager gave her a short script and let her practise with the other staff. After two weeks she felt much more confident. What surprised her most was how many visitors asked questions she couldn't answer. Instead of pretending, she wrote them down and looked up the answers in the evening. By the end of the summer, some regular visitors were asking for her tours by name.",
      question: "What did Mia do when visitors asked something she did not know?",
      options: ['She noted the question and found the answer later', 'She asked the manager to reply', 'She changed the subject', 'She told them to read the script'],
      correct: 0,
      explain: 'El texto dice que anotaba las preguntas y buscaba las respuestas por la noche.'
    },
    {
      id: 'b1-rc-2',
      title: 'The Tiny Library on the Corner',
      text: "In many neighbourhoods you can now find small wooden boxes filled with books. Anyone can take a book and leave another one in its place. The idea began in the United States, but it has spread to dozens of countries. Some boxes are painted in bright colours, and a few even look like tiny houses. People say they like them because there are no cards, no fees and no deadlines. However, the boxes need someone to look after them, as they can quickly fill up with old magazines nobody wants.",
      question: "What problem does the writer mention about the book boxes?",
      options: ['They can fill up with things people do not want', 'They cost too much to build', 'Nobody knows how to use them', 'They are only found in the United States'],
      correct: 0,
      explain: 'El texto advierte que necesitan cuidado porque se llenan de revistas viejas que nadie quiere.'
    },
    {
      id: 'b1-rc-3',
      title: 'Learning to Cook at Fifteen',
      text: "When Ravi's parents began working late, he decided it was time to learn to cook. His first attempt at pasta was a disaster: the water boiled over and the sauce was far too salty. Instead of giving up, he asked his grandmother to teach him her recipes over video calls. Now, every Wednesday, he makes dinner for the whole family. His favourite dish is a spicy vegetable curry, although his little sister says it is too hot for her. Ravi is thinking of starting a cooking blog to share what he has learnt.",
      question: "Why did Ravi start to cook?",
      options: ['His parents were busy in the evenings', 'His grandmother asked him to', 'He wanted to open a restaurant', 'His sister disliked the food at home'],
      correct: 0,
      explain: 'Ravi empezó a cocinar cuando sus padres comenzaron a trabajar hasta tarde.'
    },
    {
      id: 'b1-rc-4',
      title: 'Why Cities Are Planting More Trees',
      text: "Many city councils are now planting thousands of trees along busy streets. Trees give shade in hot summers, which can lower the temperature by several degrees. They also clean the air and make people feel calmer. One study found that patients who could see trees from their hospital window went home a little sooner. The main difficulty is space: roots can damage roads and pipes, so planners must choose the right kind of tree for each place. Some cities also ask neighbours to water young trees during dry weeks.",
      question: "What is the main difficulty for planners, according to the text?",
      options: ['Finding suitable trees for each location', 'Persuading hospitals to help', 'Making the air cleaner', 'Lowering the summer temperature'],
      correct: 0,
      explain: 'Las raíces pueden dañar calles y tuberías, así que hay que elegir el tipo de árbol adecuado para cada lugar.'
    }
  ],

  // Parte 4 real: texto con una frase eliminada; hay que elegir la
  // frase que encaja en el hueco.
  gappedText: [
    {
      id: 'b1-gt-1',
      title: 'My First Day at a New School',
      text: "I was very nervous when I arrived at my new school. I didn't know anybody and I couldn't find my classroom. [ ___ ] She took me to the right room and introduced me to the teacher. By lunchtime I had three new friends.",
      question: "Which sentence fits the gap?",
      options: ['Luckily, an older girl noticed I was lost and offered to help.', 'The school building was built almost a hundred years ago.', 'My old school was much bigger than this one.', 'Lunch is served in the hall at half past twelve.'],
      correct: 0,
      explain: 'La frase siguiente dice "She took me..." así que el hueco debe presentar a una chica que ayudó.'
    },
    {
      id: 'b1-gt-2',
      title: 'A Rainy Weekend',
      text: "We had planned a picnic in the park on Saturday, but the weather forecast was terrible. [ ___ ] We put a blanket on the living-room floor and ate sandwiches while we watched a film. It turned out to be one of the best weekends we've had in months.",
      question: "Which sentence fits the gap?",
      options: ['So we decided to have our picnic indoors instead.', 'The park closes at nine o\'clock every evening.', 'Sandwiches are the cheapest picnic food.', 'Nobody in my family likes films very much.'],
      correct: 0,
      explain: 'Lo que sigue (manta en la sala, sándwiches, película) muestra que hicieron el picnic dentro de casa.'
    },
    {
      id: 'b1-gt-3',
      title: 'Learning to Ride a Bike',
      text: "My dad promised to teach me to ride a bike when I turned eight. [ ___ ] I fell off about ten times and my knees were sore. But when I finally rode to the end of the street without help, I felt incredibly proud.",
      question: "Which sentence fits the gap?",
      options: ['The first lesson, however, was much harder than I had imagined.', 'Bikes are a good way to protect the environment.', 'My birthday is in the middle of the summer.', 'My dad works as a taxi driver in the city.'],
      correct: 0,
      explain: 'El texto siguiente habla de caídas y dolor; el hueco introduce que la primera clase fue difícil.'
    },
    {
      id: 'b1-gt-4',
      title: 'A Surprise at the Airport',
      text: "I went to the airport to collect my aunt, who was arriving from Canada. I waited for an hour but she never came through the gate. [ ___ ] It turned out she had taken an earlier flight and had been waiting for me at home the whole time.",
      question: "Which sentence fits the gap?",
      options: ['Just as I was starting to worry, my phone rang.', 'Airports are always crowded in the summer holidays.', 'Canada is the second biggest country in the world.', 'I love travelling by plane whenever I can.'],
      correct: 0,
      explain: 'La frase después explica la situación; el hueco introduce la llamada telefónica que aclara todo.'
    }
  ],

  // Parte 5 real: multiple-choice cloze (vocabulario y gramática).
  multipleChoiceCloze: [
    {
      id: 'b1-mc-1',
      sentence: "We went to the beach ___ it was raining, and we had a great time.",
      options: ['although', 'because', 'so', 'or'],
      correct: 0,
      explain: '"Although" introduce un contraste: fuimos a la playa a pesar de la lluvia.'
    },
    {
      id: 'b1-mc-2',
      sentence: "My brother is ___ than me, so he can reach the top shelf.",
      options: ['taller', 'tallest', 'more tall', 'the taller'],
      correct: 0,
      explain: 'Comparativo de adjetivo corto: tall, taller than.'
    },
    {
      id: 'b1-mc-3',
      sentence: "If it ___ tomorrow, we'll stay at home and play cards.",
      options: ['rains', 'will rain', 'rained', 'is raining'],
      correct: 0,
      explain: 'En el primer condicional, la parte con "if" va en presente simple: "If it rains".'
    },
    {
      id: 'b1-mc-4',
      sentence: "She has lived in Madrid ___ she was twelve years old.",
      options: ['since', 'for', 'during', 'while'],
      correct: 0,
      explain: '"Since" se usa con un punto de partida en el tiempo (desde que tenía doce años).'
    },
    {
      id: 'b1-mc-5',
      sentence: "Could you ___ me the way to the train station, please?",
      options: ['tell', 'say', 'speak', 'talk'],
      correct: 0,
      explain: 'Se dice "tell someone the way", no "say/speak/talk" con ese significado.'
    },
    {
      id: 'b1-mc-6',
      sentence: "I'm looking forward ___ you at the weekend.",
      options: ['to seeing', 'to see', 'for seeing', 'at seeing'],
      correct: 0,
      explain: '"Look forward to" va seguido de un verbo en -ing: "looking forward to seeing".'
    },
    {
      id: 'b1-mc-7',
      sentence: "The film was so boring that we ___ asleep before the end.",
      options: ['fell', 'felt', 'became', 'went'],
      correct: 0,
      explain: 'La expresión fija es "fall asleep" (quedarse dormido), en pasado "fell asleep".'
    },
    {
      id: 'b1-mc-8',
      sentence: "You ___ wear a helmet when you ride a motorbike. It's the law.",
      options: ['must', 'mustn\'t', 'needn\'t', 'might'],
      correct: 0,
      explain: '"Must" expresa una obligación legal: es obligatorio usar casco.'
    }
  ],

  // Parte 6 real: open cloze (una palabra en cada hueco). Aquí se
  // elige la palabra de un banco.
  openCloze: [
    {
      id: 'b1-oc-1',
      sentence: ["I", "have", "been", "waiting", "for", "you", "___", "an", "hour."],
      bank: ['for', 'since', 'from', 'during'],
      correct: 'for',
      explain: '"For" se usa con la duración: "for an hour" (durante una hora).'
    },
    {
      id: 'b1-oc-2',
      sentence: ["There", "isn't", "___", "milk", "left", "in", "the", "fridge."],
      bank: ['any', 'some', 'many', 'a'],
      correct: 'any',
      explain: 'En oraciones negativas se usa "any" con sustantivos incontables: "isn\'t any milk".'
    },
    {
      id: 'b1-oc-3',
      sentence: ["My", "sister", "is", "good", "___", "singing."],
      bank: ['at', 'in', 'on', 'with'],
      correct: 'at',
      explain: 'La preposición fija es "good at" (buena para): "good at singing".'
    },
    {
      id: 'b1-oc-4',
      sentence: ["The", "book", "___", "I", "bought", "yesterday", "is", "very", "funny."],
      bank: ['that', 'who', 'where', 'whose'],
      correct: 'that',
      explain: '"That" es el pronombre relativo para una cosa (el libro).'
    },
    {
      id: 'b1-oc-5',
      sentence: ["He", "asked", "me", "___", "I", "wanted", "a", "cup", "of", "tea."],
      bank: ['if', 'what', 'when', 'who'],
      correct: 'if',
      explain: 'En el estilo indirecto de una pregunta de sí/no se usa "if": "asked me if I wanted...".'
    },
    {
      id: 'b1-oc-6',
      sentence: ["We", "were", "late", "for", "school", "because", "the", "bus", "___", "very", "slow."],
      bank: ['was', 'were', 'is', 'has'],
      correct: 'was',
      explain: '"Bus" es singular y la oración está en pasado, por eso "was".'
    }
  ]
};

const CAMBRIDGE_B1_LISTENING = {
  // Parte 1 real: extractos cortos de dos personas, con una pregunta.
  shortExtract: [
    {
      id: 'b1-se-1',
      audioFile: 'audio/cambridge-b1/b1-se-1.mp3',
      transcript: "— Excuse me, what time does the next train to Bristol leave?\n— Let me check. There's one at ten past four, but it's running fifteen minutes late.\n— So it will leave at twenty-five past four?\n— That's right. It'll go from platform six.",
      question: "What time will the train to Bristol leave?",
      options: ['4:10', '4:25', '4:15', '6:25'],
      correct: 1,
      explain: 'El tren sale a las 4:10 pero lleva quince minutos de retraso, así que sale a las 4:25 (twenty-five past four).'
    },
    {
      id: 'b1-se-2',
      audioFile: 'audio/cambridge-b1/b1-se-2.mp3',
      transcript: "— Hi Tom, are you still coming to my party on Saturday?\n— I'd love to, but I have football practice until six. Can I come a bit later?\n— Of course! It starts at seven, so you'll have plenty of time to go home and change.\n— Great, thanks. Shall I bring something to drink?",
      question: "Why will Tom arrive late to the party?",
      options: ['He has a sports practice', 'He has to do homework', 'He is visiting his grandmother', 'He is buying drinks'],
      correct: 0,
      explain: 'Tom tiene entrenamiento de fútbol hasta las seis.'
    },
    {
      id: 'b1-se-3',
      audioFile: 'audio/cambridge-b1/b1-se-3.mp3',
      transcript: "— I'd like to buy this jacket, but it's a little too big for me.\n— We have a smaller size in blue, if you don't mind a different colour.\n— Blue is fine. Do you have it here in the shop?\n— Yes, I'll go and bring it from the storeroom.",
      question: "What does the customer decide to do?",
      options: ['Try the same jacket in a different colour', 'Leave the shop', 'Ask for her money back', 'Buy the bigger jacket'],
      correct: 0,
      explain: 'La clienta acepta la chamarra en azul, en una talla más pequeña.'
    },
    {
      id: 'b1-se-4',
      audioFile: 'audio/cambridge-b1/b1-se-4.mp3',
      transcript: "— You look tired, Jake. Did you sleep badly?\n— Yes, my neighbours had a loud party until three in the morning.\n— That's awful. Did you call anyone?\n— No, but I'm going to speak to them this evening. I just want a quiet night.",
      question: "What is Jake going to do this evening?",
      options: ['Talk to his neighbours', 'Go to a party', 'Call the police', 'Sleep at a friend\'s house'],
      correct: 0,
      explain: 'Jake dice "I\'m going to speak to them this evening": hablará con sus vecinos.'
    },
    {
      id: 'b1-se-5',
      audioFile: 'audio/cambridge-b1/b1-se-5.mp3',
      transcript: "— Are you enjoying your new job at the bank?\n— Mostly, yes. The people are friendly, though I don't like getting up so early.\n— What time do you have to start?\n— At half past seven, which means I leave home before the sun comes up.",
      question: "What does the man dislike about his job?",
      options: ['Starting work very early', 'The people he works with', 'The long journey home', 'Working at weekends'],
      correct: 0,
      explain: 'Le gusta la gente, pero no le gusta levantarse tan temprano: empieza a las 7:30.'
    },
    {
      id: 'b1-se-6',
      audioFile: 'audio/cambridge-b1/b1-se-6.mp3',
      transcript: "— Mum, can I borrow your camera for the school trip?\n— Of course, but be careful with it. It was a present from your grandfather.\n— I promise. I'll keep it in my bag whenever I'm not using it.\n— Good. And don't forget to charge the battery tonight.",
      question: "What does the mother remind the boy to do?",
      options: ['Charge the battery', 'Buy a new camera', 'Call his grandfather', 'Pack a bigger bag'],
      correct: 0,
      explain: 'La mamá termina diciendo "don\'t forget to charge the battery tonight".'
    }
  ],

  // Parte 2 real: conversación más larga con preguntas de opción
  // múltiple (dos voces).
  longInterview: [
    {
      id: 'b1-li-1',
      audioFile: 'audio/cambridge-b1/b1-li-1.mp3',
      transcript: "— Welcome to the programme, Emma. You're only sixteen and you already have your own small business. How did it start?\n— It began as a hobby, really. I made bracelets for my friends, and then some of them asked if they could buy more for their families.\n— And how do you sell them now?\n— Mainly on a website my brother helped me build, and at a market once a month.\n— Do you ever find it hard to combine the business with school?\n— Sometimes. During exams I stop taking new orders for two weeks, and my customers understand that.",
      question: "What does Emma do during her exam weeks?",
      options: ['She stops accepting new orders', 'She sells more at the market', 'She asks her brother to run the business', 'She closes the website for a month'],
      correct: 0,
      explain: 'Emma dice que en época de exámenes deja de tomar pedidos nuevos durante dos semanas.'
    },
    {
      id: 'b1-li-2',
      audioFile: 'audio/cambridge-b1/b1-li-2.mp3',
      transcript: "— Hello, Sam. I hear you have just come back from a walking holiday in Scotland.\n— That's right. We walked for seven days, about twenty kilometres every day.\n— Was the weather good?\n— It was mixed. We had two days of heavy rain, but it was sunny for the last three, and the views were fantastic.\n— Would you recommend it to beginners?\n— Yes, but they should buy proper boots first. One of our group had cheap shoes and got terrible blisters by the third day.",
      question: "What advice does Sam give to people who want to try a walking holiday?",
      options: ['Buy good boots', 'Avoid the rainy season', 'Walk only ten kilometres a day', 'Travel with a large group'],
      correct: 0,
      explain: 'Sam recomienda comprar botas adecuadas antes, porque alguien con zapatos baratos tuvo ampollas.'
    },
    {
      id: 'b1-li-3',
      audioFile: 'audio/cambridge-b1/b1-li-3.mp3',
      transcript: "— Mr Hall, why did you decide to become a teacher after working as an engineer?\n— I enjoyed engineering, but I kept finding that the part of my job I liked best was explaining things to new colleagues.\n— Was the change difficult?\n— The salary is lower, and at first the noise of thirty teenagers was a shock. But the students make every day different.\n— Any regrets?\n— None at all. I only wish I had made the change ten years earlier.",
      question: "How does Mr Hall feel about his career change?",
      options: ['He is happy, but wishes he had done it sooner', 'He misses his old salary a lot', 'He is thinking of going back to engineering', 'He finds teenagers too noisy'],
      correct: 0,
      explain: 'No se arrepiente, pero le gustaría haberlo hecho diez años antes.'
    },
    {
      id: 'b1-li-4',
      audioFile: 'audio/cambridge-b1/b1-li-4.mp3',
      transcript: "— Lucy, your school has started a new recycling project. Can you tell us about it?\n— Yes. Every class now has three bins: one for paper, one for plastic and one for food waste. A group of students checks them every Friday.\n— Has it made a difference?\n— Definitely. In the first month we reduced the rubbish we send away by almost half.\n— And what are your plans for next term?\n— We'd like to sell the compost from the food waste to local gardeners and use the money for a school trip.",
      question: "What does Lucy's group want to do next term?",
      options: ['Sell compost to raise money', 'Add a fourth bin in every class', 'Start recycling glass', 'Hold a meeting every Friday'],
      correct: 0,
      explain: 'Quieren vender la composta a jardineros locales y usar el dinero para un viaje escolar.'
    }
  ],

  // Parte 3 real: sentence completion sobre un monólogo.
  sentenceCompletion: [
    {
      id: 'b1-sc-1',
      audioFile: 'audio/cambridge-b1/b1-sc-1.mp3',
      transcript: "Hello, everyone, and welcome to Riverside Adventure Park. Our zip line opens at ten o'clock every morning, and you must be at least one metre forty tall to use it. Please leave your bags in the lockers near the entrance, and remember that the park closes at six.",
      translation: "Hola a todos, bienvenidos al parque Riverside Adventure. La tirolesa abre a las diez de la mañana todos los días, y hay que medir al menos un metro cuarenta para usarla. Dejen sus bolsas en los casilleros cerca de la entrada y recuerden que el parque cierra a las seis.",
      sentence: ["Visitors must leave their bags in the", "___", "near the entrance."],
      bank: ['lockers', 'café', 'car park', 'office'],
      correct: 'lockers',
      explain: 'El locutor dice que las bolsas se dejan en "the lockers near the entrance".'
    },
    {
      id: 'b1-sc-2',
      audioFile: 'audio/cambridge-b1/b1-sc-2.mp3',
      transcript: "This is a message for anyone who signed up for the cooking course. The first lesson will be on Thursday at seven in the evening, not on Wednesday as we said before. Please bring an apron and a small box to take home what you make.",
      translation: "Este es un mensaje para quienes se inscribieron al curso de cocina. La primera clase será el jueves a las siete de la tarde, no el miércoles como dijimos antes. Por favor traigan un delantal y una cajita para llevarse a casa lo que preparen.",
      sentence: ["The first cooking lesson will take place on", "___", "."],
      bank: ['Thursday', 'Wednesday', 'Saturday', 'Monday'],
      correct: 'Thursday',
      explain: 'La clase será el jueves, no el miércoles como se había dicho antes.'
    },
    {
      id: 'b1-sc-3',
      audioFile: 'audio/cambridge-b1/b1-sc-3.mp3',
      transcript: "Good afternoon, this is Beth from the Sunshine Hotel. I'm calling about your booking for next weekend. Unfortunately our swimming pool will be closed for repairs, but we can offer you a free breakfast for two instead. Please call me back on 555 0148 if that is acceptable.",
      translation: "Buenas tardes, le habla Beth del hotel Sunshine. Llamo por su reserva del próximo fin de semana. Por desgracia nuestra alberca estará cerrada por reparaciones, pero podemos ofrecerles un desayuno gratis para dos personas a cambio. Por favor llámeme al 555 0148 si le parece bien.",
      sentence: ["The hotel offers a free", "___", "because of the closed pool."],
      bank: ['breakfast', 'dinner', 'taxi', 'room'],
      correct: 'breakfast',
      explain: 'Como la alberca está cerrada, el hotel ofrece un desayuno gratis para dos.'
    },
    {
      id: 'b1-sc-4',
      audioFile: 'audio/cambridge-b1/b1-sc-4.mp3',
      transcript: "Thanks for coming to the school science fair. Our winning project this year is about solar energy. Two students built a small car that runs only on sunlight, and it travelled more than fifty metres without stopping. The prize is a visit to the science museum in the capital.",
      translation: "Gracias por venir a la feria de ciencias de la escuela. Nuestro proyecto ganador de este año trata sobre energía solar. Dos estudiantes construyeron un carrito que funciona solo con luz del sol y recorrió más de cincuenta metros sin detenerse. El premio es una visita al museo de ciencias de la capital.",
      sentence: ["The winning project used energy from the", "___", "."],
      bank: ['sun', 'wind', 'water', 'battery'],
      correct: 'sun',
      explain: 'El carrito funciona solo con luz solar ("sunlight").'
    },
    {
      id: 'b1-sc-5',
      audioFile: 'audio/cambridge-b1/b1-sc-5.mp3',
      transcript: "Welcome aboard the City Boat Tour. In a moment we will pass under the old iron bridge, which was finished in eighteen ninety. After that, on your right, you'll see the tallest building in the town. Please stay seated until the boat has stopped at the harbour.",
      translation: "Bienvenidos a bordo del recorrido en barco por la ciudad. En un momento pasaremos bajo el viejo puente de hierro, que se terminó en mil ochocientos noventa. Después, a su derecha, verán el edificio más alto del pueblo. Permanezcan sentados hasta que el barco se detenga en el puerto.",
      sentence: ["After the bridge, passengers will see the tallest building on their", "___", "."],
      bank: ['right', 'left', 'back', 'front'],
      correct: 'right',
      explain: 'La guía dice "on your right", es decir, a la derecha.'
    }
  ],

  // Parte 4 real: comprensión de idea principal. Aquí, monólogos
  // cortos con una pregunta de tema.
  multipleMatching: [
    {
      id: 'b1-mm-l1',
      audioFile: 'audio/cambridge-b1/b1-mm-1.mp3',
      transcript: "When I was small, I was afraid of dogs. Then my neighbours got a puppy and asked me to look after it during the holidays. I was frightened at first, but the puppy was so friendly that after a week I couldn't imagine life without it. Now I want to work with animals when I finish school.",
      translation: "Cuando era pequeño, les tenía miedo a los perros. Luego mis vecinos consiguieron un cachorro y me pidieron que lo cuidara durante las vacaciones. Al principio me asustaba, pero el cachorro era tan amistoso que a la semana no podía imaginar la vida sin él. Ahora quiero trabajar con animales cuando termine la escuela.",
      question: "What is the speaker mainly talking about?",
      options: ['How a fear turned into a career plan', 'Buying a puppy for a neighbour', 'A holiday with his family', 'Why dogs make good pets'],
      correct: 0,
      explain: 'Habla de cómo pasó de tenerle miedo a los perros a querer trabajar con animales.'
    },
    {
      id: 'b1-mm-l2',
      audioFile: 'audio/cambridge-b1/b1-mm-2.mp3',
      transcript: "I used to spend every evening on my phone, and I never had time for anything else. Last month I decided to leave it in a drawer after eight o'clock. At first it felt strange, but now I read, draw and even go to bed earlier. I feel much more relaxed in the mornings.",
      translation: "Antes pasaba todas las tardes en el celular y nunca tenía tiempo para nada más. El mes pasado decidí dejarlo en un cajón después de las ocho. Al principio se sentía raro, pero ahora leo, dibujo e incluso me acuesto más temprano. Me siento mucho más tranquila en las mañanas.",
      question: "What is the speaker mainly talking about?",
      options: ['A change that improved her evenings', 'A new phone she bought', 'A problem with her sleep', 'A drawing competition'],
      correct: 0,
      explain: 'Cuenta cómo dejar el teléfono después de las ocho mejoró sus noches y mañanas.'
    },
    {
      id: 'b1-mm-l3',
      audioFile: 'audio/cambridge-b1/b1-mm-3.mp3',
      transcript: "Our team had lost every match this season, so nobody expected much on Saturday. But our coach told us to forget the score and just enjoy the game. We played better than ever and won by two goals. I've never seen my teammates so happy.",
      translation: "Nuestro equipo había perdido todos los partidos de la temporada, así que nadie esperaba mucho el sábado. Pero el entrenador nos dijo que olvidáramos el marcador y disfrutáramos el juego. Jugamos mejor que nunca y ganamos por dos goles. Nunca había visto a mis compañeros tan felices.",
      question: "What is the speaker mainly talking about?",
      options: ['An unexpected win after a bad season', 'Changing to a new football team', 'Arguing with the coach', 'Losing an important match'],
      correct: 0,
      explain: 'Describe una victoria inesperada después de una temporada de derrotas.'
    },
    {
      id: 'b1-mm-l4',
      audioFile: 'audio/cambridge-b1/b1-mm-4.mp3',
      transcript: "My family moved to a new country when I was ten. I didn't speak a word of the language, and I was scared of going to school. My teacher put me next to a girl who spoke a little of my language, and she became my best friend. Within a year I could speak fluently.",
      translation: "Mi familia se mudó a otro país cuando yo tenía diez años. No hablaba ni una palabra del idioma y me daba miedo ir a la escuela. Mi maestra me sentó junto a una niña que hablaba un poco de mi idioma y se convirtió en mi mejor amiga. En un año ya hablaba con fluidez.",
      question: "What is the speaker mainly talking about?",
      options: ['Settling into a new country and school', 'Teaching a friend a language', 'Choosing a new school', 'Travelling with her family'],
      correct: 0,
      explain: 'Cuenta cómo se adaptó a un nuevo país, escuela e idioma gracias a una amiga.'
    }
  ]
};

const CAMBRIDGE_B1_WRITING = {
  // Parte 1 real: correo obligatorio respondiendo a un mensaje (unas
  // 100 palabras), cubriendo los puntos indicados.
  email: [
    {
      id: 'b1-em-1',
      prompt: "Read this email from your English friend Alex. \"Hi! I'm going to visit your town for a weekend next month. What places should I see? Also, what kind of clothes should I bring? Can you meet me at the station? Thanks, Alex.\" Write an email to Alex answering the questions. Write 100 words.",
      example: "Hi Alex,\n\nGreat news that you're coming! There are so many things to see here. You should definitely visit the old castle on the hill and the market in the main square, where you can try our local cheese.\n\nAt the weekend it can be chilly at night, so bring a warm jacket and comfortable shoes for walking.\n\nOf course I can meet you at the station. Just tell me what time your train arrives and I'll be waiting on the platform.\n\nI can't wait to see you!\nBest wishes,\nAna",
      checklist: ['Responde a las tres preguntas (lugares, ropa, estación)', 'Usa un saludo y una despedida informales', 'Escribe unas 100 palabras', 'Cuida los tiempos verbales (will, should, can)']
    },
    {
      id: 'b1-em-2',
      prompt: "Read this email from your friend Sam. \"I'm thinking of joining a gym. Do you go to one? Which do you think is better, a gym or running outside? Would you like to come with me on Saturday? Sam.\" Write an email to Sam answering the questions. Write 100 words.",
      example: "Hi Sam,\n\nThanks for your email! I go to a small gym near my house twice a week, and I really like it because the trainers are friendly.\n\nPersonally, I think a gym is better in winter, but running outside is great when the weather is nice and it's free.\n\nI'd love to come with you on Saturday. How about meeting at ten in front of the entrance? Afterwards we could have a juice at the café next door.\n\nSee you soon,\nLuis",
      checklist: ['Responde a las tres preguntas (gimnasio, preferencia, sábado)', 'Da una razón para tu opinión', 'Propone una hora o lugar', 'Usa conectores simples (because, but, afterwards)']
    },
    {
      id: 'b1-em-3',
      prompt: "Read this email from your friend Kate. \"My birthday is next Friday and I'm going to have a small party. Can you help me choose the food? Also, do you know a good place for a photo booth? And can you stay until the end? Kate.\" Write an email to Kate answering the questions. Write 100 words.",
      example: "Dear Kate,\n\nHappy early birthday! I'd be happy to help with the food. I think pizza and a big salad are easy and everyone likes them, and I can make a chocolate cake if you want.\n\nAbout the photo booth, I know a shop in the city centre that rents them for a good price. I'll send you the address tonight.\n\nI'm afraid I have to leave at ten because I have an early class on Saturday, but I'll stay for the cake and the presents.\n\nLots of love,\nMaria",
      checklist: ['Contesta a las tres preguntas', 'Ofrece ayuda de forma amable', 'Explica una razón si no puedes hacer algo', 'Usa una despedida cálida']
    }
  ],

  // Parte 2 real, opción "story": historia que empieza con una frase dada.
  story: [
    {
      id: 'b1-sy-1',
      prompt: "Your English teacher has asked you to write a story. Your story must begin with this sentence: \"When Ben opened the door, he could not believe what he saw.\" Write your story in about 100 words.",
      example: "When Ben opened the door, he could not believe what he saw. His whole family was standing in the living room with balloons and a big cake. He had completely forgotten that it was his eighteenth birthday.\n\nHis little sister ran to him and gave him a card she had made herself. Ben laughed and felt a little embarrassed, because he was still wearing his old work clothes.\n\nAfter dinner, they all sang together. It was the best evening he could remember, and he promised himself never to forget his own birthday again.",
      checklist: ['Empieza con la frase indicada', 'Usa el pasado simple y pasado continuo', 'Tiene principio, desarrollo y final', 'Incluye al menos un sentimiento o detalle']
    },
    {
      id: 'b1-sy-2',
      prompt: "Your English teacher has asked you to write a story. Your story must end with this sentence: \"That was the last time I ever went camping alone.\" Write your story in about 100 words.",
      example: "Last summer I decided to camp in the forest near my village. It was a beautiful afternoon, so I put up my tent and cooked some soup on a small fire.\n\nAt night, I heard strange noises outside. My heart was beating fast. I looked out and saw two bright eyes looking at me. It was only a fox searching for food, but I did not sleep at all.\n\nIn the morning I packed my things quickly and walked home. That was the last time I ever went camping alone.",
      checklist: ['Termina con la frase indicada', 'Describe el lugar y la situación', 'Usa conectores de tiempo (at night, in the morning)', 'Mantiene el mismo hilo en toda la historia']
    }
  ],

  // Parte 2 real, opción "article": artículo corto para una revista.
  article: [
    {
      id: 'b1-ar-1',
      prompt: "You see this announcement in an English-language magazine. \"Articles wanted: My favourite place to relax. Tell us where you go to relax, why you like it and who you go with.\" Write your article in about 100 words.",
      example: "My Favourite Place to Relax\n\nMy favourite place to relax is a small park near my house. It has a lake with ducks, and there are many old trees that give shade in the summer.\n\nI usually go there on Sunday afternoons with my best friend. We sit on the grass, listen to music and talk about our week. Sometimes we bring some fruit and share it.\n\nI love this place because it is quiet, and I forget my homework for a while. If you ever visit my town, you should definitely go there.",
      checklist: ['Responde a las tres preguntas (dónde, por qué, con quién)', 'Título claro para el lector', 'Usa el presente simple para hábitos', 'Termina con una invitación o recomendación']
    },
    {
      id: 'b1-ar-2',
      prompt: "You see this announcement in an English-language magazine. \"Articles wanted: A person I admire. Write about someone you admire, what they do and why they are special to you.\" Write your article in about 100 words.",
      example: "A Person I Admire\n\nThe person I admire most is my aunt Carmen. She is a nurse in a big hospital, and she works long hours, often at night.\n\nWhat I admire most is her patience. Even when she is tired, she always has a smile for her patients and their families. She also finds time to teach me how to cook on her days off.\n\nShe is special to me because she showed me that helping others is one of the best jobs in the world. One day, I hope to be as kind as she is.",
      checklist: ['Presenta quién es la persona y qué hace', 'Explica por qué la admiras con un ejemplo', 'Usa adjetivos variados (patient, kind, hardworking)', 'Cierra con un deseo o conclusión personal']
    }
  ]
};

const CAMBRIDGE_B1_SPEAKING = {
  // Parte 1 real: preguntas personales del examinador.
  interview: [
    { id: 'b1-p1-1', audioFile: 'audio/cambridge-b1/b1-p1-1.mp3', question: "What is your name, and how do you spell your surname?", sampleAnswer: "Di tu nombre completo y deletrea tu apellido con el alfabeto inglés, despacio. Puedes agregar una frase corta ('I'm from...'), pero no te extiendas." },
    { id: 'b1-p1-2', audioFile: 'audio/cambridge-b1/b1-p1-2.mp3', question: "Tell me about your family. Who do you live with?", sampleAnswer: "Nombra a las personas con las que vives y da un dato de cada una ('My brother is fifteen and he loves football'). Usa presente simple." },
    { id: 'b1-p1-3', audioFile: 'audio/cambridge-b1/b1-p1-3.mp3', question: "What do you usually do after school or work?", sampleAnswer: "Habla de tu rutina con adverbios de frecuencia (usually, sometimes) y da dos actividades concretas, no una lista larga." },
    { id: 'b1-p1-4', audioFile: 'audio/cambridge-b1/b1-p1-4.mp3', question: "Which food do you like best? Can you cook it yourself?", sampleAnswer: "Nombra un plato, di por qué te gusta y si sabes prepararlo. Si no, di quién lo cocina en tu casa." },
    { id: 'b1-p1-5', audioFile: 'audio/cambridge-b1/b1-p1-5.mp3', question: "What did you do last weekend?", sampleAnswer: "Usa el pasado simple ('I went', 'I met', 'I watched') y da al menos dos actividades con un detalle cada una." }
  ],

  // Parte 2 real: situación simulada. Los candidatos hablan entre sí
  // para decidir algo (aquí se practica en solitario).
  collaborativeTask: [
    {
      id: 'b1-ct-1',
      prompt: "Imagine you and a friend are planning a birthday party for a classmate. Talk together about what you could do for the party (for example: a picnic, a cinema visit, a bowling evening, a dinner at home). Say which activity you think is best and why.",
      sampleAnswer: "En este examen hablas con otro candidato. Practica proponer ('Why don't we...?', 'How about...?'), reaccionar ('That's a good idea, but...') y decidir juntos ('So, shall we choose...?'). Da una razón breve para cada opción."
    },
    {
      id: 'b1-ct-2',
      prompt: "Imagine you and a friend want to raise money for a local animal shelter. Talk together about ways to do it (for example: a cake sale, a sponsored walk, a car wash, a talent show). Decide which idea would be most successful.",
      sampleAnswer: "Da una opinión sobre cada idea con una razón sencilla ('A cake sale is easy because everyone likes cakes'). Pregunta la opinión de tu compañero ('What do you think?') y cierra con un acuerdo ('Let's do the sponsored walk')."
    },
    {
      id: 'b1-ct-3',
      prompt: "Imagine you are going to give a present to your English teacher who is leaving the school. Talk together about what you could give (for example: a book, flowers, a photo album, a class card). Decide which present would be best.",
      sampleAnswer: "Compara las opciones con frases simples ('I think flowers are nice, but a photo album is more personal'). Usa conectores de contraste (but, however) y termina proponiendo una decisión."
    }
  ],

  // Parte 3 real: describir una fotografía durante un minuto.
  longTurn: [
    {
      id: 'b1-lt-1',
      topic: 'Describe this photograph: a family having a picnic in a park with a blanket, sandwiches and a football.',
      points: ['Where the people are', 'What they are doing', 'What the weather is like and how they feel'],
      sampleAnswer: "Empieza con 'In this photo I can see...' y usa el presente continuo ('they are eating', 'a boy is playing'). Menciona colores, ropa y ambiente, y usa 'It looks like...' para especular sobre los sentimientos. Habla aproximadamente 1 minuto."
    },
    {
      id: 'b1-lt-2',
      topic: 'Describe this photograph: two teenagers in a busy shopping street, carrying bags and laughing.',
      points: ['What the two people are wearing', 'What they might have bought', 'Why they look happy'],
      sampleAnswer: "Habla de la ropa y las bolsas con 'They are wearing...' y 'They are carrying...'. Usa 'maybe' o 'perhaps' para suponer qué compraron, y da una razón para su felicidad ('perhaps they found something on sale')."
    },
    {
      id: 'b1-lt-3',
      topic: 'Describe this photograph: a student studying alone at a desk with a laptop, books and a cup of tea.',
      points: ['What is on the desk', 'What the student is doing', 'How you think the student feels'],
      sampleAnswer: "Nombra los objetos de la mesa ('There is a laptop, some books and a cup of tea'), explica lo que hace con el presente continuo y termina con una opinión sobre cómo se siente ('I think she is tired but focused')."
    },
    {
      id: 'b1-lt-4',
      topic: 'Describe this photograph: a group of friends on a bus, looking at a map and talking, with suitcases at their feet.',
      points: ['Where the people are going', 'What they are looking at', 'How they are feeling'],
      sampleAnswer: "Usa 'They are probably going to...' para especular el destino, describe el mapa y las maletas, y termina con un adjetivo para las emociones ('excited', 'a little lost')."
    }
  ],

  // Parte 4 real: conversación general sobre el tema de la parte 3.
  furtherDiscussion: [
    { id: 'b1-p4-1', audioFile: 'audio/cambridge-b1/b1-p4-1.mp3', relatedTo: 'b1-lt-1', question: "Do you prefer to have a picnic or eat in a restaurant? Why?", sampleAnswer: "Da tu preferencia ('I prefer...') y una razón clara. Puedes agregar un ejemplo de la última vez que lo hiciste." },
    { id: 'b1-p4-2', audioFile: 'audio/cambridge-b1/b1-p4-2.mp3', relatedTo: 'b1-lt-2', question: "How often do you go shopping, and what do you like buying?", sampleAnswer: "Usa adverbios de frecuencia (once a month, rarely) y menciona un tipo de producto con una razón breve." },
    { id: 'b1-p4-3', audioFile: 'audio/cambridge-b1/b1-p4-3.mp3', relatedTo: 'b1-lt-3', question: "Where do you like to study, at home or somewhere else? Why?", sampleAnswer: "Elige un lugar (mi cuarto, una biblioteca) y explica qué te ayuda a concentrarte. Compara con otro lugar si puedes." },
    { id: 'b1-p4-4', audioFile: 'audio/cambridge-b1/b1-p4-4.mp3', relatedTo: 'b1-lt-4', question: "Tell me about a journey you remember well. Where did you go?", sampleAnswer: "Cuenta la historia en pasado simple: adónde fuiste, con quién y qué fue lo más memorable. Cierra con una frase sobre lo que sentiste." }
  ]
};
