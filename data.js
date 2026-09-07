/* ============================================================
   Inglés con Leo — data.js
   Todo el contenido de ejercicios vive aquí, organizado por
   habilidad → nivel → tema → ítems. Para agregar contenido
   nuevo (preguntas, palabras, listenings) solo hay que añadir
   objetos a estos arrays; la interfaz (app.js) no cambia.
   ============================================================ */

const LEVELS = ['facil', 'medio', 'avanzado'];
const LEVEL_META = {
  facil:    { label: 'Fácil',    range: 'A1–A2', audioFolder: 'a1', desc: 'Palabras y frases del día a día.' },
  medio:    { label: 'Medio',    range: 'B1–B2', audioFolder: 'b1', desc: 'Conversaciones más largas y matices.' },
  avanzado: { label: 'Avanzado', range: 'C1+',   audioFolder: 'c1', desc: 'Matices y precisión de nativo.' }
};

/* ---------------------------------------------------------
   GRAMÁTICA — por nivel, por tema, por ítem.
   type: 'choice' | 'fill' | 'error'
   examples: siempre en+es, para reforzar con contexto real.
--------------------------------------------------------- */
const GRAMMAR_BANK = {
  facil: [
    {
      topic: 'Presente simple y "to be"',
      items: [
        { id:'g-facil-tobe-1', type:'choice', prompt:"What time is it?",
          options:["It nine o'clock.","It is nine o'clock.","It are nine o'clock."], correct:1,
          explain:"Usamos “it is” (o “it's”) para hablar de la hora.",
          examples:[
            {en:"It is nine o'clock.", es:"Son las nueve."},
            {en:"It is Monday today.", es:"Hoy es lunes."}
          ]},
        { id:'g-facil-tobe-2', type:'fill', sentence:["The","cat","___","on","the","table","."], blankIndex:2,
          bank:["is","are","am"], correct:"is",
          explain:"“Cat” es singular, así que va con “is”.",
          examples:[
            {en:"The dog is in the garden.", es:"El perro está en el jardín."},
            {en:"My parents are at home.", es:"Mis padres están en casa."}
          ]},
        { id:'g-facil-tobe-3', type:'choice', prompt:"She ___ a teacher.",
          options:["is","are","am"], correct:0,
          explain:"Con “she” (ella) siempre usamos “is”.",
          examples:[
            {en:"He is a doctor.", es:"Él es doctor."},
            {en:"They are students.", es:"Ellos son estudiantes."}
          ]},
        { id:'g-facil-tobe-4', type:'error', wrong:"The keys are on my bag.", wrongWord:"on",
          right:"The keys are in my bag.", rightWord:"in",
          explain:"Usamos “in” para cosas que están dentro de algo, como una mochila.",
          examples:[
            {en:"The book is in my backpack.", es:"El libro está en mi mochila."},
            {en:"She put the phone in her pocket.", es:"Ella puso el teléfono en su bolsillo."}
          ]}
      ]
    },
    {
      topic: 'There / Their / They\'re',
      items: [
        { id:'g-facil-there-1', type:'choice', prompt:"___ is a cat on the roof.",
          options:["Their","There","They're"], correct:1,
          explain:"“There is / there are” se usa para decir que algo existe.",
          examples:[
            {en:"There is a book on the table.", es:"Hay un libro en la mesa."},
            {en:"There are two cars outside.", es:"Hay dos carros afuera."}
          ]},
        { id:'g-facil-there-2', type:'choice', prompt:"___ house is very big.",
          options:["There","Their","They're"], correct:1,
          explain:"“Their” indica posesión: de ellos.",
          examples:[
            {en:"Their dog is friendly.", es:"El perro de ellos es amigable."},
            {en:"That is their car.", es:"Ese es el carro de ellos."}
          ]},
        { id:'g-facil-there-3', type:'choice', prompt:"___ going to the beach tomorrow.",
          options:["There","Their","They're"], correct:2,
          explain:"“They're” es la contracción de “they are”.",
          examples:[
            {en:"They're my best friends.", es:"Ellos son mis mejores amigos."},
            {en:"They're studying English.", es:"Ellos están estudiando inglés."}
          ]},
        { id:'g-facil-there-4', type:'fill', sentence:["___","are","many","people","here","."], blankIndex:0,
          bank:["There","Their","They're"], correct:"There",
          explain:"Para decir que “hay” algo, usamos “there”.",
          examples:[
            {en:"There are many people here.", es:"Hay mucha gente aquí."},
            {en:"There is no time to waste.", es:"No hay tiempo que perder."}
          ]}
      ]
    }
  ],
  medio: [
    {
      topic: 'Past Perfect',
      items: [
        { id:'g-medio-pp-1', type:'choice', prompt:"By the time we arrived, the movie ___.",
          options:["already started","had already started","has already started"], correct:1,
          explain:"El pasado perfecto (“had started”) muestra que algo pasó antes de otro momento pasado.",
          examples:[
            {en:"She had left before I called.", es:"Ella se había ido antes de que yo llamara."},
            {en:"They had already eaten when we arrived.", es:"Ellos ya habían comido cuando llegamos."}
          ]},
        { id:'g-medio-pp-2', type:'fill', sentence:["She","___","already","eaten","when","I","called","."], blankIndex:1,
          bank:["has","have","had"], correct:"had",
          explain:"“Had eaten” = ya había comido antes de que yo llamara.",
          examples:[
            {en:"He had finished dinner by eight.", es:"Él ya había terminado de cenar a las ocho."},
            {en:"We had never met before that day.", es:"Nunca nos habíamos conocido antes de ese día."}
          ]},
        { id:'g-medio-pp-3', type:'choice', prompt:"I had never seen snow before I ___ to Canada.",
          options:["went","had gone","go"], correct:0,
          explain:"La segunda acción (más reciente) va en pasado simple; la más antigua, en pasado perfecto.",
          examples:[
            {en:"She had never traveled before she moved abroad.", es:"Nunca había viajado antes de mudarse al extranjero."},
            {en:"He had already left when I arrived.", es:"Él ya se había ido cuando yo llegué."}
          ]},
        { id:'g-medio-pp-4', type:'error', wrong:"When I arrive, she already left.", wrongWord:"arrive",
          right:"When I arrived, she had already left.", rightWord:"arrived",
          explain:"Necesitamos pasado simple (“arrived”) y pasado perfecto (“had left”) para mostrar el orden de los hechos.",
          examples:[
            {en:"When I arrived, she had already left.", es:"Cuando llegué, ella ya se había ido."},
            {en:"When he called, we had already gone out.", es:"Cuando él llamó, ya habíamos salido."}
          ]}
      ]
    },
    {
      topic: '"Used to"',
      items: [
        { id:'g-medio-used-1', type:'error', wrong:"I'm used to work late.", wrongWord:"work",
          right:"I'm used to working late.", rightWord:"working",
          explain:"Después de “used to” (con este significado) usamos verbo + -ing, no infinitivo.",
          examples:[
            {en:"I'm used to working late.", es:"Estoy acostumbrado a trabajar hasta tarde."},
            {en:"She's used to living alone.", es:"Ella está acostumbrada a vivir sola."}
          ]},
        { id:'g-medio-used-2', type:'choice', prompt:"___ you use to live in Cali?",
          options:["Did","Was","Have"], correct:0,
          explain:"La pregunta con “used to” (hábito pasado) se forma con “did” + sujeto + “use to”.",
          examples:[
            {en:"Did you use to play piano?", es:"¿Solías tocar piano?"},
            {en:"I didn't use to like coffee.", es:"Antes no me gustaba el café."}
          ]},
        { id:'g-medio-used-3', type:'fill', sentence:["She","___","to","smoke,","but","she","quit","."], blankIndex:1,
          bank:["used","use","using"], correct:"used",
          explain:"“Used to” + verbo base habla de un hábito que ya no ocurre.",
          examples:[
            {en:"We used to live in a small town.", es:"Antes vivíamos en un pueblo pequeño."},
            {en:"He used to play soccer every weekend.", es:"Él jugaba fútbol todos los fines de semana."}
          ]},
        { id:'g-medio-used-4', type:'choice', prompt:"We ___ to walk to school every day.",
          options:["used","use","using"], correct:0,
          explain:"“Used to” describe un hábito pasado que ya terminó.",
          examples:[
            {en:"We used to walk to school every day.", es:"Antes caminábamos a la escuela todos los días."},
            {en:"They used to visit us every summer.", es:"Ellos solían visitarnos cada verano."}
          ]}
      ]
    }
  ],
  avanzado: [
    {
      topic: 'Condicional tipo 3',
      items: [
        { id:'g-avz-c3-1', type:'choice', prompt:"Had I known, I ___ differently.",
          options:["would act","would have acted","will act"], correct:1,
          explain:"Condicional tipo 3: “had I known” (pasado hipotético) pide “would have + participio”.",
          examples:[
            {en:"If I had studied more, I would have passed the exam.", es:"Si hubiera estudiado más, habría aprobado el examen."},
            {en:"She would have called if she had known.", es:"Ella habría llamado si hubiera sabido."}
          ]},
        { id:'g-avz-c3-2', type:'choice', prompt:"If she ___ earlier, she wouldn't have missed the flight.",
          options:["left","had left","leaves"], correct:1,
          explain:"Condicional 3: “if” + pasado perfecto, “would have” + participio en la otra parte.",
          examples:[
            {en:"If we had left earlier, we wouldn't have missed the flight.", es:"Si hubiéramos salido antes, no habríamos perdido el vuelo."},
            {en:"He would have won if he had trained harder.", es:"Él habría ganado si hubiera entrenado más duro."}
          ]},
        { id:'g-avz-c3-3', type:'fill', sentence:["If","I","___","known","about","the","delay,","I","would","have","left","earlier","."], blankIndex:2,
          bank:["had","have","has"], correct:"had",
          explain:"La parte con “if” lleva “had” + participio en el condicional tipo 3.",
          examples:[
            {en:"If I had known, I would have told you.", es:"Si lo hubiera sabido, te habría dicho."},
            {en:"She would have helped if she had known.", es:"Ella habría ayudado si hubiera sabido."}
          ]},
        { id:'g-avz-c3-4', type:'error', wrong:"Despite of the rain, we went out.", wrongWord:"of",
          right:"Despite the rain, we went out.", rightWord:"",
          explain:"“Despite” nunca lleva “of” después; “in spite of” sí lo lleva.",
          examples:[
            {en:"Despite the rain, we went out.", es:"A pesar de la lluvia, salimos."},
            {en:"In spite of the traffic, we arrived on time.", es:"A pesar del tráfico, llegamos a tiempo."}
          ]}
      ]
    },
    {
      topic: 'Inversiones enfáticas',
      items: [
        { id:'g-avz-inv-1', type:'fill', sentence:["No","sooner","___","she","arrived","than","it","started","raining","."], blankIndex:2,
          bank:["had","did","has"], correct:"had",
          explain:"“No sooner had she arrived...” es una inversión enfática con pasado perfecto.",
          examples:[
            {en:"No sooner had we left than it began to snow.", es:"Apenas habíamos salido cuando empezó a nevar."},
            {en:"Not only did she arrive late, but she also forgot the documents.", es:"No solo llegó tarde, sino que también olvidó los documentos."}
          ]},
        { id:'g-avz-inv-2', type:'choice', prompt:"Not only ___ late, but she also forgot the documents.",
          options:["did she arrive","she arrived","she did arrive"], correct:0,
          explain:"Después de “Not only” al inicio de la frase, el orden se invierte como en una pregunta.",
          examples:[
            {en:"Not only did she arrive late, but she also forgot the documents.", es:"No solo llegó tarde, sino que también olvidó los documentos."},
            {en:"Not only is he smart, but he's also kind.", es:"No solo es inteligente, sino también amable."}
          ]},
        { id:'g-avz-inv-3', type:'choice', prompt:"Rarely ___ such dedication.",
          options:["we have seen","have we seen","we saw"], correct:1,
          explain:"“Rarely” al inicio también provoca inversión: auxiliar + sujeto.",
          examples:[
            {en:"Rarely have I seen such talent.", es:"Rara vez he visto tanto talento."},
            {en:"Seldom does he complain.", es:"Rara vez se queja."}
          ]},
        { id:'g-avz-inv-4', type:'error', wrong:"Only after she left, I understood the situation.", wrongWord:"I understood",
          right:"Only after she left did I understand the situation.", rightWord:"did I understand",
          explain:"Después de “only after...” al inicio, se invierte con “did” + sujeto + verbo base.",
          examples:[
            {en:"Only after she left did I understand the situation.", es:"Solo después de que ella se fue entendí la situación."},
            {en:"Only then did he realize his mistake.", es:"Solo entonces se dio cuenta de su error."}
          ]}
      ]
    }
  ]
};

/* ---------------------------------------------------------
   VOCABULARIO — siempre con contexto (2 ejemplos + mini quiz).
--------------------------------------------------------- */
const VOCAB_BANK = {
  facil: [
    { id:'v-facil-1', word:'Breakfast', translation:'Desayuno · comida de la mañana',
      examples:[{en:"I have breakfast at seven.", es:"Desayuno a las siete."},{en:"Breakfast is the most important meal.", es:"El desayuno es la comida más importante."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"comida de la mañana\"?", options:["breakfast","dinner","lunch"], correct:0, explain:"“Breakfast” es la comida de la mañana." } },
    { id:'v-facil-2', word:'Neighbor', translation:'Vecino · alguien que vive cerca',
      examples:[{en:"My neighbor is very friendly.", es:"Mi vecino es muy amigable."},{en:"We waved at our neighbors.", es:"Saludamos a nuestros vecinos."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"alguien que vive cerca\"?", options:["neighbor","brother","teacher"], correct:0, explain:"“Neighbor” es la persona que vive cerca, no necesariamente un familiar." } },
    { id:'v-facil-3', word:'Tired', translation:'Cansado · sin energía',
      examples:[{en:"I'm tired after work.", es:"Estoy cansado después del trabajo."},{en:"She felt tired all day.", es:"Ella se sintió cansada todo el día."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"sin energía\"?", options:["tired","happy","young"], correct:0, explain:"“Tired” describe falta de energía." } },
    { id:'v-facil-4', word:'Kitchen', translation:'Cocina · donde cocinas',
      examples:[{en:"She is cooking in the kitchen.", es:"Ella está cocinando en la cocina."},{en:"The kitchen smells amazing.", es:"La cocina huele increíble."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"donde cocinas\"?", options:["kitchen","garden","office"], correct:0, explain:"Cocinar ocurre en la “kitchen”." } },
    { id:'v-facil-5', word:'Weekend', translation:'Fin de semana · sábado y domingo',
      examples:[{en:"We go hiking every weekend.", es:"Vamos de caminata cada fin de semana."},{en:"See you this weekend!", es:"¡Nos vemos este fin de semana!"}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"sábado y domingo\"?", options:["weekend","Monday","minute"], correct:0, explain:"“Weekend” = sábado y domingo." } },
    { id:'v-facil-6', word:'Friend', translation:'Amigo · alguien cercano a ti',
      examples:[{en:"He is my best friend.", es:"Él es mi mejor amigo."},{en:"I made new friends at school.", es:"Hice nuevos amigos en la escuela."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"alguien cercano a ti\"?", options:["friend","stranger","teacher"], correct:0, explain:"“Friend” es alguien cercano, no un desconocido." } },
    { id:'v-facil-7', word:'Early', translation:'Temprano · antes de la hora usual',
      examples:[{en:"I woke up early today.", es:"Hoy me desperté temprano."},{en:"She arrived early for the meeting.", es:"Ella llegó temprano a la reunión."}],
      quiz:{ prompt:"¿Qué significa \"early\"?", options:["Tarde","Temprano","Nunca"], correct:1, explain:"“Early” significa antes de la hora esperada; lo opuesto es “late”." } },
    { id:'v-facil-8', word:'Borrow', translation:'Pedir prestado · tomar algo para devolverlo',
      examples:[{en:"Can I borrow your pen?", es:"¿Puedo pedirte prestado tu lapicero?"},{en:"He borrowed some money from his friend.", es:"Él pidió prestado algo de dinero a su amigo."}],
      quiz:{ prompt:"¿Cuál oración usa \"borrow\" correctamente?", options:["Can I borrow your pen?","Can I lend your pen, please lend?","Can I borrow to the store?"], correct:0, explain:"“Borrow” = pedir prestado (tú recibes algo); “lend” es prestar (tú das algo)." } }
  ],
  medio: [
    { id:'v-medio-1', word:'Reluctant', translation:'Reacio · con poca disposición',
      examples:[{en:"I was reluctant to accept the offer.", es:"No estaba muy convencido de aceptar la oferta."},{en:"She seemed reluctant to speak.", es:"Parecía poco dispuesta a hablar."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"con poca disposición\"?", options:["reluctant","excited","fast"], correct:0, explain:"“Reluctant” = con poca disposición o duda." } },
    { id:'v-medio-2', word:'Overwhelmed', translation:'Abrumado · con demasiado encima',
      examples:[{en:"She felt overwhelmed with work.", es:"Ella se sintió abrumada con el trabajo."},{en:"I'm overwhelmed by all these messages.", es:"Estoy abrumado con todos estos mensajes."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"con demasiado encima\"?", options:["overwhelmed","bored","proud"], correct:0, explain:"“Overwhelmed” describe sentirse con demasiado encima." } },
    { id:'v-medio-3', word:'Assumption', translation:'Suposición · algo que se da por hecho',
      examples:[{en:"That's just an assumption, not a fact.", es:"Eso es solo una suposición, no un hecho."},{en:"We made the wrong assumption.", es:"Hicimos la suposición equivocada."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"algo que se da por hecho\"?", options:["assumptions","breakfast","neighbors"], correct:0, explain:"“Assumption” es algo que se supone sin confirmar." } },
    { id:'v-medio-4', word:'Consequently', translation:'En consecuencia · como resultado',
      examples:[{en:"He didn't study; consequently, he failed.", es:"No estudió; en consecuencia, reprobó."},{en:"It rained a lot; consequently, the game was cancelled.", es:"Llovió mucho; en consecuencia, se canceló el juego."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"como resultado\"?", options:["consequently","yesterday","friendly"], correct:0, explain:"“Consequently” conecta una causa con su resultado." } },
    { id:'v-medio-5', word:'Nevertheless', translation:'Sin embargo · a pesar de eso',
      examples:[{en:"It was raining; nevertheless, we went out.", es:"Estaba lloviendo; sin embargo, salimos."},{en:"The task was hard; nevertheless, she finished it.", es:"La tarea era difícil; sin embargo, la terminó."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"a pesar de eso\"?", options:["nevertheless","breakfast","kitchen"], correct:0, explain:"“Nevertheless” muestra un contraste." } },
    { id:'v-medio-6', word:'Achieve', translation:'Lograr · alcanzar una meta',
      examples:[{en:"She worked hard to achieve her goals.", es:"Ella trabajó duro para lograr sus metas."},{en:"He finally achieved success.", es:"Él finalmente logró el éxito."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"alcanzar una meta\"?", options:["achieve","waste","forget"], correct:0, explain:"“Achieve” significa lograr algo." } },
    { id:'v-medio-7', word:'Postpone', translation:'Posponer · dejar para después',
      examples:[{en:"We had to postpone the meeting.", es:"Tuvimos que posponer la reunión."},{en:"The trip was postponed until next month.", es:"El viaje se pospuso hasta el próximo mes."}],
      quiz:{ prompt:"¿Qué significa \"postpone\"?", options:["Cancelar para siempre","Dejar para después","Empezar antes de tiempo"], correct:1, explain:"“Postpone” = mover algo a una fecha posterior, no cancelarlo." } },
    { id:'v-medio-8', word:'Reliable', translation:'Confiable · en quien se puede confiar',
      examples:[{en:"She's a reliable coworker.", es:"Ella es una compañera de trabajo confiable."},{en:"This car is old but reliable.", es:"Este carro es viejo pero confiable."}],
      quiz:{ prompt:"¿Cuál oración usa \"reliable\" correctamente?", options:["He is very reliable at work.","He is very reliable of work.","He reliable works hard."], correct:0, explain:"“Reliable” funciona como adjetivo: “is reliable”, sin preposición extra." } }
  ],
  avanzado: [
    { id:'v-avz-1', word:'Ubiquitous', translation:'Omnipresente · que está en todas partes',
      examples:[{en:"Smartphones are ubiquitous nowadays.", es:"Los celulares están en todas partes hoy en día."},{en:"The brand's logo is ubiquitous in the city.", es:"El logo de la marca está en todas partes de la ciudad."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"que está en todas partes\"?", options:["ubiquitous","reluctant","tired"], correct:0, explain:"“Ubiquitous” = presente en todas partes." } },
    { id:'v-avz-2', word:'Nuance', translation:'Matiz · diferencia sutil de significado',
      examples:[{en:"There's a subtle nuance between these two words.", es:"Hay un matiz sutil entre estas dos palabras."},{en:"A good translator understands every nuance.", es:"Un buen traductor entiende cada matiz."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"diferencia sutil de significado\"?", options:["nuance","kitchen","weekend"], correct:0, explain:"“Nuance” es una diferencia sutil de significado." } },
    { id:'v-avz-3', word:'Contentious', translation:'Polémico · que genera desacuerdo',
      examples:[{en:"It's a contentious topic in politics.", es:"Es un tema polémico en política."},{en:"The meeting became quite contentious.", es:"La reunión se volvió bastante polémica."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"que genera desacuerdo\"?", options:["contentious","tired","ubiquitous"], correct:0, explain:"“Contentious” describe algo que genera desacuerdo." } },
    { id:'v-avz-4', word:'Ambivalent', translation:'Ambivalente · con sentimientos encontrados',
      examples:[{en:"I feel ambivalent about the new policy.", es:"Tengo sentimientos encontrados sobre la nueva política."},{en:"She's ambivalent about moving abroad.", es:"Ella tiene dudas encontradas sobre mudarse al extranjero."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"con sentimientos encontrados\"?", options:["ambivalent","overwhelmed","achieve"], correct:0, explain:"“Ambivalent” = con sentimientos encontrados, ni a favor ni en contra del todo." } },
    { id:'v-avz-5', word:'Pragmatic', translation:'Pragmático · práctico y realista',
      examples:[{en:"We need a pragmatic solution.", es:"Necesitamos una solución práctica."},{en:"She's very pragmatic about money.", es:"Ella es muy práctica con el dinero."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"práctico y realista\"?", options:["pragmatic","contentious","nuance"], correct:0, explain:"“Pragmatic” significa práctico y realista." } },
    { id:'v-avz-6', word:'Meticulous', translation:'Meticuloso · muy cuidadoso con los detalles',
      examples:[{en:"She's meticulous about her work.", es:"Ella es meticulosa con su trabajo."},{en:"He kept meticulous records.", es:"Él llevaba registros meticulosos."}],
      quiz:{ prompt:"¿Qué palabra significa esto: \"muy cuidadoso con los detalles\"?", options:["meticulous","reluctant","ubiquitous"], correct:0, explain:"“Meticulous” describe mucho cuidado con los detalles." } },
    { id:'v-avz-7', word:'Redundant', translation:'Redundante · innecesario por repetido',
      examples:[{en:"That sentence is redundant; you already said it.", es:"Esa frase es redundante; ya lo dijiste."},{en:"Some of these rules are redundant now.", es:"Algunas de estas reglas ahora son redundantes."}],
      quiz:{ prompt:"¿Qué significa \"redundant\"?", options:["Muy importante","Innecesario por repetido","Difícil de entender"], correct:1, explain:"“Redundant” describe algo repetitivo o innecesario." } },
    { id:'v-avz-8', word:'Discrepancy', translation:'Discrepancia · diferencia entre dos cosas que deberían coincidir',
      examples:[{en:"There's a discrepancy between the two reports.", es:"Hay una discrepancia entre los dos informes."},{en:"We need to explain this discrepancy in the numbers.", es:"Necesitamos explicar esta discrepancia en los números."}],
      quiz:{ prompt:"¿Cuál oración usa \"discrepancy\" correctamente?", options:["There's a discrepancy between the reports.","She felt discrepancy about the job.","He is a discrepancy person."], correct:0, explain:"“Discrepancy” es un sustantivo: una diferencia entre datos o versiones, no un sentimiento ni un adjetivo." } }
  ]
};

/* ---------------------------------------------------------
   LISTENING — el audio es un archivo MP3 real (todavía por
   producir). Si el archivo no existe, la interfaz lo avisa
   discretamente y sigue funcionando con el resto del ejercicio.
--------------------------------------------------------- */
const LISTENING_BANK = {
  facil: [
    { id:'l-facil-1', audioFile:'audio/a1/a1listening-001.mp3',
      transcript:"I wake up at seven every morning.", translation:"Me despierto a las siete todas las mañanas.",
      question:"What time does the speaker wake up?", options:["At seven","At seventeen","At eleven"], correct:0,
      explain:"“Seven” suena distinto a “seventeen” o “eleven”; la sílaba final es la clave." },
    { id:'l-facil-2', audioFile:'audio/a1/a1listening-002.mp3',
      transcript:"She usually drinks coffee, not tea.", translation:"Ella normalmente toma café, no té.",
      question:"What does she drink?", options:["Tea","Coffee","Juice"], correct:1,
      explain:"“Not tea” nos dice qué NO toma; “coffee” es la respuesta." },
    { id:'l-facil-3', audioFile:'audio/a1/a1listening-003.mp3',
      transcript:"The store closes at nine tonight.", translation:"La tienda cierra a las nueve esta noche.",
      question:"When does the store close?", options:["At nine","At five","At noon"], correct:0,
      explain:"“Nine” es la hora que se menciona en la frase." }
  ],
  medio: [
    { id:'l-medio-1', audioFile:'audio/b1/b1listening-001.mp3',
      transcript:"By the time we arrived, the movie had already started.", translation:"Para cuando llegamos, la película ya había empezado.",
      question:"What had happened before they arrived?", options:["The movie started","The movie ended","The movie was cancelled"], correct:0,
      explain:"“Had already started” = ya había comenzado antes de llegar." },
    { id:'l-medio-2', audioFile:'audio/b1/b1listening-002.mp3',
      transcript:"I'm used to working late, so it doesn't bother me.", translation:"Estoy acostumbrado a trabajar hasta tarde, así que no me molesta.",
      question:"How does the speaker feel about working late?", options:["It bothers them","They are used to it","They refuse to do it"], correct:1,
      explain:"“Used to working” significa que está acostumbrado." },
    { id:'l-medio-3', audioFile:'audio/b1/b1listening-003.mp3',
      transcript:"She would have called if she had known about the meeting.", translation:"Ella habría llamado si hubiera sabido sobre la reunión.",
      question:"Why didn't she call?", options:["She forgot her phone","She didn't know about the meeting","She was busy"], correct:1,
      explain:"Condicional 3: no sabía de la reunión, por eso no llamó." }
  ],
  avanzado: [
    { id:'l-avz-1', audioFile:'audio/c1/c1listening-001.mp3',
      transcript:"Had I known about the delay, I would have acted differently.", translation:"Si hubiera sabido sobre el retraso, habría actuado diferente.",
      question:"What is implied?", options:["He knew about the delay","He did not know about the delay","He caused the delay"], correct:1,
      explain:"El condicional tipo 3 implica que NO lo sabía." },
    { id:'l-avz-2', audioFile:'audio/c1/c1listening-002.mp3',
      transcript:"No sooner had she arrived than it started raining.", translation:"Apenas había llegado cuando empezó a llover.",
      question:"What happened right after she arrived?", options:["It started raining","She left again","The sun came out"], correct:0,
      explain:"“No sooner... than” indica que algo pasó inmediatamente después." },
    { id:'l-avz-3', audioFile:'audio/c1/c1listening-003.mp3',
      transcript:"Despite the criticism, the policy remains ubiquitous.", translation:"A pesar de las críticas, la política sigue siendo omnipresente.",
      question:"What does \"ubiquitous\" suggest about the policy?", options:["It is rare","It is everywhere","It is illegal"], correct:1,
      explain:"“Ubiquitous” significa presente en todas partes." }
  ]
};

/* ---------------------------------------------------------
   SPEAKING — el audio de referencia también es un MP3 real
   (mismo criterio que listening). No se inventa puntuación
   de pronunciación: solo se compara escuchando ambos audios.
--------------------------------------------------------- */
const SPEAKING_BANK = {
  facil: [
    { id:'s-facil-1', sentence:"What time is it?", translation:"¿Qué hora es?", audioFile:'audio/a1/a1speaking-001.mp3' },
    { id:'s-facil-2', sentence:"My name is Veronica and I am from Colombia.", translation:"Me llamo Veronica y soy de Colombia.", audioFile:'audio/a1/a1speaking-002.mp3' },
    { id:'s-facil-3', sentence:"I usually have breakfast at eight.", translation:"Normalmente desayuno a las ocho.", audioFile:'audio/a1/a1speaking-003.mp3' }
  ],
  medio: [
    { id:'s-medio-1', sentence:"By the time we arrived, the movie had already started.", translation:"Para cuando llegamos, la película ya había empezado.", audioFile:'audio/b1/b1speaking-001.mp3' },
    { id:'s-medio-2', sentence:"I'm used to working late.", translation:"Estoy acostumbrado a trabajar hasta tarde.", audioFile:'audio/b1/b1speaking-002.mp3' },
    { id:'s-medio-3', sentence:"Nevertheless, we decided to continue.", translation:"Sin embargo, decidimos continuar.", audioFile:'audio/b1/b1speaking-003.mp3' }
  ],
  avanzado: [
    { id:'s-avz-1', sentence:"Had I known about the delay, I would have acted differently.", translation:"Si hubiera sabido sobre el retraso, habría actuado diferente.", audioFile:'audio/c1/c1speaking-001.mp3' },
    { id:'s-avz-2', sentence:"No sooner had she arrived than it started raining.", translation:"Apenas había llegado cuando empezó a llover.", audioFile:'audio/c1/c1speaking-002.mp3' },
    { id:'s-avz-3', sentence:"Despite the criticism, the policy remains ubiquitous.", translation:"A pesar de las críticas, la política sigue siendo omnipresente.", audioFile:'audio/c1/c1speaking-003.mp3' }
  ]
};

/* ---------------------------------------------------------
   WRITING — sin corrección automática "inteligente" (no hay
   backend ni IA). Se ofrece ejemplo + checklist de autorrevisión.
--------------------------------------------------------- */
const WRITING_BANK = {
  facil: [
    { id:'w-facil-1', prompt:"Escribe una frase presentándote (tu nombre y de dónde eres).", target:"my name / from",
      checkPattern:"my name is [a-z]+.*(i am|i'm) from [a-z]+", hint:"Estructura esperada: “My name is ___ and I am from ___.”",
      example:{en:"My name is Ana and I am from Bogotá.", es:"Me llamo Ana y soy de Bogotá."},
      checklist:["¿Usaste “My name is...”?","¿Dijiste de dónde eres con “I am from...”?","¿La frase tiene sentido completo?"] },
    { id:'w-facil-2', prompt:"Describe qué hora es ahora, en inglés.", target:"it is ... o'clock",
      checkPattern:"it('s| is) .*o.?clock", hint:"Estructura esperada: “It is ___ o'clock.”",
      example:{en:"It is three o'clock.", es:"Son las tres."},
      checklist:["¿Empezaste con “It is...”?","¿Incluiste la hora?","¿Usaste el formato correcto (o'clock)?"] },
    { id:'w-facil-3', prompt:"Escribe una frase sobre tu desayuno de hoy.", target:"breakfast",
      checkPattern:"\\b(had|ate|have|eat)\\b.*breakfast|breakfast.*\\b(had|ate|have|eat)\\b", hint:"Estructura esperada: un verbo (had/ate) + “breakfast”.",
      example:{en:"I had eggs for breakfast.", es:"Comí huevos en el desayuno."},
      checklist:["¿Usaste la palabra “breakfast”?","¿Usaste un verbo en pasado si ya desayunaste?","¿La frase tiene sentido?"] },
    { id:'w-facil-4', prompt:"Escribe una frase describiendo el clima de hoy.", target:"weather description",
      checkPattern:"\\b(it('s| is))\\b.*\\b(sunny|rainy|cold|hot|cloudy|windy)\\b", hint:"Estructura esperada: “It is ___” + una palabra de clima (sunny, rainy, cold, hot, cloudy, windy).",
      example:{en:"It is sunny today.", es:"Hoy está soleado."},
      checklist:["¿Empezaste con “It is...”?","¿Usaste una palabra de clima?","¿La frase tiene sentido?"] }
  ],
  medio: [
    { id:'w-medio-1', prompt:"Escribe una frase usando “used to” para un hábito pasado.", target:"used to",
      checkPattern:"used to [a-z]+", hint:"Estructura esperada: “... used to + verbo base ...”",
      example:{en:"I used to live in Medellín.", es:"Yo vivía en Medellín (antes)."},
      checklist:["¿Usaste “used to”?","¿Hay un verbo base después?","¿La frase describe un hábito pasado?"] },
    { id:'w-medio-2', prompt:"Escribe una frase con pasado perfecto (“had” + participio).", target:"had + participio",
      checkPattern:"\\bhad\\b [a-z]+ed\\b|\\bhad\\b (been|done|gone|seen|written|finished|eaten|taken|made|left)", hint:"Estructura esperada: “had” + verbo en participio (ej. “had finished”).",
      example:{en:"She had finished her homework before dinner.", es:"Ella había terminado la tarea antes de la cena."},
      checklist:["¿Usaste “had” + participio?","¿Se entiende qué pasó primero?","¿La frase tiene sentido estructural?"] },
    { id:'w-medio-3', prompt:"Escribe una frase con “although” o “even though”.", target:"although / even though",
      checkPattern:"although|even though", hint:"Estructura esperada: “Although ...,” o “Even though ...,” conectando dos ideas.",
      example:{en:"Although it was raining, we went out.", es:"Aunque estaba lloviendo, salimos."},
      checklist:["¿Usaste “although” o “even though”?","¿Conecta dos ideas contrastantes?","¿La frase tiene sentido?"] },
    { id:'w-medio-4', prompt:"Escribe una frase usando un comparativo (“more... than” o “-er than”).", target:"comparativo",
      checkPattern:"\\b\\w+er\\b than|more \\w+ than", hint:"Estructura esperada: “___ + er/more ___ than ___.”",
      example:{en:"This city is more expensive than mine.", es:"Esta ciudad es más cara que la mía."},
      checklist:["¿Usaste un comparativo (“-er” o “more”)?","¿Incluiste “than”?","¿La frase compara dos cosas?"] }
  ],
  avanzado: [
    { id:'w-avz-1', prompt:"Escribe una frase con condicional tipo 3 (“had” + participio, “would have” + participio).", target:"condicional tipo 3",
      checkPattern:"if.*\\bhad\\b.*would have", hint:"Estructura esperada: “If + had + participio, ... would have + participio.”",
      example:{en:"If I had studied more, I would have passed the exam.", es:"Si hubiera estudiado más, habría aprobado el examen."},
      checklist:["¿Usaste “if + had + participio”?","¿Usaste “would have + participio”?","¿La frase es hipotética sobre el pasado?"] },
    { id:'w-avz-2', prompt:"Escribe una frase usando “despite” o “in spite of”.", target:"despite / in spite of",
      checkPattern:"despite (?!of)|in spite of", hint:"Estructura esperada: “Despite ___,” (sin “of”) o “In spite of ___,”.",
      example:{en:"Despite the rain, we went out.", es:"A pesar de la lluvia, salimos."},
      checklist:["¿Usaste “despite” o “in spite of”?","¿Evitaste poner “of” después de “despite”?","¿La frase tiene sentido?"] },
    { id:'w-avz-3', prompt:"Escribe una frase con una inversión enfática (“No sooner...”, “Not only...”).", target:"inversión enfática",
      checkPattern:"^(not only|no sooner)", hint:"Estructura esperada: empezar la frase con “Not only” o “No sooner”, seguido de inversión verbo–sujeto.",
      example:{en:"Not only did she arrive late, but she also forgot the documents.", es:"No solo llegó tarde, sino que también olvidó los documentos."},
      checklist:["¿Empezaste con “Not only” o “No sooner”?","¿Invertiste el orden verbo–sujeto después?","¿La frase suena natural?"] },
    { id:'w-avz-4', prompt:"Escribe una frase con voz pasiva (“is/was” + participio).", target:"voz pasiva",
      checkPattern:"\\b(is|are|was|were|been)\\b [a-z]+ed\\b|\\b(is|are|was|were|been)\\b (done|made|written|seen|taken|given|built|sent)", hint:"Estructura esperada: “sujeto + is/was/were” + verbo en participio.",
      example:{en:"The report was written by the team.", es:"El informe fue escrito por el equipo."},
      checklist:["¿Usaste “is/was/were” + participio?","¿El sujeto recibe la acción en vez de hacerla?","¿La frase tiene sentido?"] }
  ]
};
