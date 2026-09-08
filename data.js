/* ============================================================
   Inglés con Leo — data.js
   Todo el contenido de ejercicios vive aquí, organizado por
   habilidad → nivel → variante → tema → ítems. Para agregar
   contenido nuevo (preguntas, palabras, listenings) solo hay que
   añadir objetos a estos arrays; la interfaz (app.js) no cambia.

   Cada BANK[level] ahora es un arreglo de variantes:
   BANK[level] = [ variante0, variante1, variante2 ]
   La variante 0 es el contenido original; 1 y 2 son sesiones
   nuevas con contenido distinto, para evitar repetición al
   hacer "Otra sesión". app.js elige una variante al azar sin
   repetir inmediatamente la última usada (ver pickVariantIndex).
   ============================================================ */

const LEVELS = ['facil', 'medio', 'avanzado'];
const LEVEL_META = {
  facil:    { label: 'Fácil',    range: 'A1–A2', audioFolder: 'a1', desc: 'Palabras y frases del día a día.' },
  medio:    { label: 'Medio',    range: 'B1–B2', audioFolder: 'b1', desc: 'Conversaciones más largas y matices.' },
  avanzado: { label: 'Avanzado', range: 'C1+',   audioFolder: 'c1', desc: 'Matices y precisión de nativo.' }
};

/* ---------------------------------------------------------
   GRAMÁTICA — por nivel, por variante, por tema, por ítem.
   type: 'choice' | 'fill' | 'error'
   examples: siempre en+es, para reforzar con contexto real.
--------------------------------------------------------- */
const GRAMMAR_BANK = {
  facil: [
    [
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
    [
      {
        topic: 'A / An',
        items: [
          { id:'g-facil-art-1', type:'choice', prompt:"I saw ___ elephant at the zoo.",
            options:["a","an","some"], correct:1,
            explain:"Usamos “an” antes de sonido de vocal, como “elephant”.",
            examples:[
              {en:"I saw an elephant.", es:"Vi un elefante."},
              {en:"She has a dog.", es:"Ella tiene un perro."}
            ]},
          { id:'g-facil-art-2', type:'fill', sentence:["She","is","___","nurse","."], blankIndex:2,
            bank:["a","an","some"], correct:"a",
            explain:"“Nurse” empieza con sonido de consonante, así que usamos “a”.",
            examples:[
              {en:"He is a teacher.", es:"Él es maestro."},
              {en:"It's an apple.", es:"Es una manzana."}
            ]},
          { id:'g-facil-art-3', type:'choice', prompt:"That is ___ umbrella.",
            options:["a","an","the"], correct:1,
            explain:"“Umbrella” empieza con sonido de vocal, entonces usamos “an”.",
            examples:[
              {en:"That is an umbrella.", es:"Esa es una sombrilla."},
              {en:"This is a book.", es:"Este es un libro."}
            ]},
          { id:'g-facil-art-4', type:'error', wrong:"I need a hour to finish.", wrongWord:"a",
            right:"I need an hour to finish.", rightWord:"an",
            explain:"“Hour” suena como si empezara con vocal (la “h” es muda), así que usamos “an”.",
            examples:[
              {en:"I need an hour to finish.", es:"Necesito una hora para terminar."},
              {en:"She waited an hour.", es:"Ella esperó una hora."}
            ]}
        ]
      },
      {
        topic: 'In / On / At',
        items: [
          { id:'g-facil-prep-1', type:'choice', prompt:"The keys are ___ the table.",
            options:["in","on","at"], correct:1,
            explain:"Usamos “on” para superficies, como una mesa.",
            examples:[
              {en:"The keys are on the table.", es:"Las llaves están en la mesa."},
              {en:"There's a picture on the wall.", es:"Hay un cuadro en la pared."}
            ]},
          { id:'g-facil-prep-2', type:'fill', sentence:["I","live","___","Bogotá","."], blankIndex:2,
            bank:["in","on","at"], correct:"in",
            explain:"Usamos “in” para ciudades y países.",
            examples:[
              {en:"I live in Bogotá.", es:"Vivo en Bogotá."},
              {en:"She was born in Peru.", es:"Ella nació en Perú."}
            ]},
          { id:'g-facil-prep-3', type:'choice', prompt:"We'll meet ___ 5 o'clock.",
            options:["in","on","at"], correct:2,
            explain:"Usamos “at” para horas exactas.",
            examples:[
              {en:"We'll meet at 5 o'clock.", es:"Nos veremos a las cinco."},
              {en:"The class starts at nine.", es:"La clase empieza a las nueve."}
            ]},
          { id:'g-facil-prep-4', type:'error', wrong:"My birthday is in Monday.", wrongWord:"in",
            right:"My birthday is on Monday.", rightWord:"on",
            explain:"Usamos “on” para días específicos, como “Monday”.",
            examples:[
              {en:"My birthday is on Monday.", es:"Mi cumpleaños es el lunes."},
              {en:"We have class on Fridays.", es:"Tenemos clase los viernes."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Some / Any',
        items: [
          { id:'g-facil-some-1', type:'choice', prompt:"I don't have ___ money.",
            options:["some","any","much"], correct:1,
            explain:"En negaciones usamos “any”, no “some”.",
            examples:[
              {en:"I don't have any money.", es:"No tengo nada de dinero."},
              {en:"There isn't any milk.", es:"No hay nada de leche."}
            ]},
          { id:'g-facil-some-2', type:'fill', sentence:["Can","I","have","___","water","?"], blankIndex:3,
            bank:["some","any","many"], correct:"some",
            explain:"En ofrecimientos y peticiones usamos “some”, aunque sea una pregunta.",
            examples:[
              {en:"Can I have some water?", es:"¿Me das un poco de agua?"},
              {en:"Would you like some coffee?", es:"¿Quieres café?"}
            ]},
          { id:'g-facil-some-3', type:'choice', prompt:"Do you have ___ questions?",
            options:["some","any","much"], correct:1,
            explain:"En preguntas normales usamos “any”.",
            examples:[
              {en:"Do you have any questions?", es:"¿Tienes alguna pregunta?"},
              {en:"Is there any bread left?", es:"¿Queda algo de pan?"}
            ]},
          { id:'g-facil-some-4', type:'error', wrong:"There isn't some sugar left.", wrongWord:"some",
            right:"There isn't any sugar left.", rightWord:"any",
            explain:"Con negaciones usamos “any”, no “some”.",
            examples:[
              {en:"There isn't any sugar left.", es:"No queda nada de azúcar."},
              {en:"I don't need any help.", es:"No necesito ninguna ayuda."}
            ]}
        ]
      },
      {
        topic: 'This / That / These / Those',
        items: [
          { id:'g-facil-this-1', type:'choice', prompt:"___ shoes are new (they're right here).",
            options:["This","These","That"], correct:1,
            explain:"Para plural + cerca usamos “these”.",
            examples:[
              {en:"These shoes are new.", es:"Estos zapatos son nuevos."},
              {en:"This book is mine.", es:"Este libro es mío."}
            ]},
          { id:'g-facil-this-2', type:'fill', sentence:["___","house","over","there","is","big","."], blankIndex:0,
            bank:["This","That","These"], correct:"That",
            explain:"Para singular + lejos usamos “that”.",
            examples:[
              {en:"That house over there is big.", es:"Esa casa de allá es grande."},
              {en:"Those cars are expensive.", es:"Esos carros son caros."}
            ]},
          { id:'g-facil-this-3', type:'choice', prompt:"Look at ___ birds up there (far away).",
            options:["this","these","those"], correct:2,
            explain:"Para plural + lejos usamos “those”.",
            examples:[
              {en:"Look at those birds.", es:"Mira esos pájaros."},
              {en:"These flowers smell nice.", es:"Estas flores huelen bien."}
            ]},
          { id:'g-facil-this-4', type:'error', wrong:"This shoes are too small.", wrongWord:"This",
            right:"These shoes are too small.", rightWord:"These",
            explain:"“Shoes” es plural, entonces necesitamos “these”, no “this”.",
            examples:[
              {en:"These shoes are too small.", es:"Estos zapatos son muy pequeños."},
              {en:"This shirt is too big.", es:"Esta camisa es muy grande."}
            ]}
        ]
      }
    ]
  ],
  medio: [
    [
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
    [
      {
        topic: 'Present Perfect vs Past Simple',
        items: [
          { id:'g-medio-pps-1', type:'choice', prompt:"I ___ to Paris last year.",
            options:["have gone","went","have been"], correct:1,
            explain:"Con una fecha específica pasada (“last year”) usamos pasado simple, no presente perfecto.",
            examples:[
              {en:"I went to Paris last year.", es:"Fui a París el año pasado."},
              {en:"She has visited Paris twice.", es:"Ella ha visitado París dos veces."}
            ]},
          { id:'g-medio-pps-2', type:'fill', sentence:["I","___","never","tried","sushi","before","."], blankIndex:1,
            bank:["have","did","was"], correct:"have",
            explain:"Sin fecha específica, hablando de experiencia de vida, usamos presente perfecto.",
            examples:[
              {en:"I have never tried sushi before.", es:"Nunca he probado sushi."},
              {en:"She has already seen that movie.", es:"Ella ya vio esa película."}
            ]},
          { id:'g-medio-pps-3', type:'choice', prompt:"___ you finish the report yet?",
            options:["Did","Have","Was"], correct:1,
            explain:"“Yet” en preguntas normalmente va con presente perfecto.",
            examples:[
              {en:"Have you finished the report yet?", es:"¿Ya terminaste el informe?"},
              {en:"Did you finish it yesterday?", es:"¿Lo terminaste ayer?"}
            ]},
          { id:'g-medio-pps-4', type:'error', wrong:"I have seen that movie yesterday.", wrongWord:"have seen",
            right:"I saw that movie yesterday.", rightWord:"saw",
            explain:"“Yesterday” es una fecha específica, así que necesitamos pasado simple, no presente perfecto.",
            examples:[
              {en:"I saw that movie yesterday.", es:"Vi esa película ayer."},
              {en:"I have seen that movie before.", es:"He visto esa película antes."}
            ]}
        ]
      },
      {
        topic: 'Since / For',
        items: [
          { id:'g-medio-sf-1', type:'choice', prompt:"I have lived here ___ 2015.",
            options:["since","for","from"], correct:0,
            explain:"Usamos “since” con un punto en el tiempo (un año, una fecha).",
            examples:[
              {en:"I have lived here since 2015.", es:"Vivo aquí desde 2015."},
              {en:"She has worked here for five years.", es:"Ella trabaja aquí desde hace cinco años."}
            ]},
          { id:'g-medio-sf-2', type:'fill', sentence:["She","has","studied","English","___","three","years","."], blankIndex:4,
            bank:["for","since","ago"], correct:"for",
            explain:"Usamos “for” con una duración (una cantidad de tiempo).",
            examples:[
              {en:"She has studied English for three years.", es:"Ella estudia inglés desde hace tres años."},
              {en:"He has known her since childhood.", es:"Él la conoce desde la infancia."}
            ]},
          { id:'g-medio-sf-3', type:'choice', prompt:"We haven't talked ___ Monday.",
            options:["for","since","during"], correct:1,
            explain:"“Monday” es un punto en el tiempo, así que usamos “since”.",
            examples:[
              {en:"We haven't talked since Monday.", es:"No hemos hablado desde el lunes."},
              {en:"I haven't seen him for two weeks.", es:"No lo he visto en dos semanas."}
            ]},
          { id:'g-medio-sf-4', type:'error', wrong:"I've known him since five years.", wrongWord:"since",
            right:"I've known him for five years.", rightWord:"for",
            explain:"“Five years” es una duración, entonces va con “for”, no “since”.",
            examples:[
              {en:"I've known him for five years.", es:"Lo conozco desde hace cinco años."},
              {en:"I've known him since 2019.", es:"Lo conozco desde 2019."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Conditionals (tipo 1 y 2)',
        items: [
          { id:'g-medio-cond12-1', type:'choice', prompt:"If it rains, we ___ home.",
            options:["stay","will stay","would stay"], correct:1,
            explain:"Condicional tipo 1: “if” + presente, “will” + verbo base, para algo probable.",
            examples:[
              {en:"If it rains, we will stay home.", es:"Si llueve, nos quedaremos en casa."},
              {en:"If I have time, I will call you.", es:"Si tengo tiempo, te llamaré."}
            ]},
          { id:'g-medio-cond12-2', type:'fill', sentence:["If","I","won","the","lottery,","I","___","travel","the","world","."], blankIndex:6,
            bank:["would","will","had"], correct:"would",
            explain:"Condicional tipo 2: “if” + pasado, “would” + verbo base, para algo imaginario o poco probable.",
            examples:[
              {en:"If I won the lottery, I would travel the world.", es:"Si ganara la lotería, viajaría por el mundo."},
              {en:"If I were you, I would apologize.", es:"Si yo fuera tú, me disculparía."}
            ]},
          { id:'g-medio-cond12-3', type:'choice', prompt:"If I ___ you, I would apologize.",
            options:["am","was","were"], correct:2,
            explain:"En condicional tipo 2, con “I/he/she/it” usamos “were” en vez de “was” (más correcto).",
            examples:[
              {en:"If I were you, I would apologize.", es:"Si yo fuera tú, me disculparía."},
              {en:"If she were here, she would help.", es:"Si ella estuviera aquí, ayudaría."}
            ]},
          { id:'g-medio-cond12-4', type:'error', wrong:"If I have more time, I would travel more.", wrongWord:"have",
            right:"If I had more time, I would travel more.", rightWord:"had",
            explain:"Condicional tipo 2 necesita pasado (“had”) en la parte del “if”, no presente.",
            examples:[
              {en:"If I had more time, I would travel more.", es:"Si tuviera más tiempo, viajaría más."},
              {en:"If I have more time, I will travel more.", es:"Si tengo más tiempo, viajaré más."}
            ]}
        ]
      },
      {
        topic: 'Reported Speech',
        items: [
          { id:'g-medio-rep-1', type:'choice', prompt:"She said (that) she ___ tired.",
            options:["is","was","be"], correct:1,
            explain:"En estilo indirecto, el presente (“is”) cambia a pasado (“was”).",
            examples:[
              {en:"She said she was tired.", es:"Ella dijo que estaba cansada."},
              {en:"He said he liked pizza.", es:"Él dijo que le gustaba la pizza."}
            ]},
          { id:'g-medio-rep-2', type:'fill', sentence:["He","told","me","he","___","come","to","the","party","."], blankIndex:4,
            bank:["would","will","can"], correct:"would",
            explain:"“Will” cambia a “would” en estilo indirecto.",
            examples:[
              {en:"He told me he would come to the party.", es:"Él me dijo que vendría a la fiesta."},
              {en:"She said she would call later.", es:"Ella dijo que llamaría después."}
            ]},
          { id:'g-medio-rep-3', type:'choice', prompt:"She asked me where I ___.",
            options:["live","lived","living"], correct:1,
            explain:"En preguntas indirectas también cambiamos el tiempo verbal a pasado.",
            examples:[
              {en:"She asked me where I lived.", es:"Ella me preguntó dónde vivía."},
              {en:"He asked if I was ready.", es:"Él preguntó si yo estaba lista."}
            ]},
          { id:'g-medio-rep-4', type:'error', wrong:"He said that he is busy yesterday.", wrongWord:"is",
            right:"He said that he was busy yesterday.", rightWord:"was",
            explain:"En estilo indirecto el presente cambia a pasado: “is” → “was”.",
            examples:[
              {en:"He said that he was busy yesterday.", es:"Él dijo que estaba ocupado ayer."},
              {en:"She said she was happy.", es:"Ella dijo que estaba feliz."}
            ]}
        ]
      }
    ]
  ],
  avanzado: [
    [
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
    ],
    [
      {
        topic: 'Conectores avanzados',
        items: [
          { id:'g-avz-conn-1', type:'choice', prompt:"The results were poor; ___, the team kept working.",
            options:["therefore","nevertheless","because"], correct:1,
            explain:"“Nevertheless” conecta dos ideas en contraste (sin embargo).",
            examples:[
              {en:"The results were poor; nevertheless, the team kept working.", es:"Los resultados fueron pobres; sin embargo, el equipo siguió trabajando."},
              {en:"It was expensive; nevertheless, we bought it.", es:"Era caro; sin embargo, lo compramos."}
            ]},
          { id:'g-avz-conn-2', type:'fill', sentence:["He","was","tired;","___","he","finished","the","project","."], blankIndex:3,
            bank:["nonetheless","because","and"], correct:"nonetheless",
            explain:"“Nonetheless” (similar a “nevertheless”) muestra contraste a pesar de algo.",
            examples:[
              {en:"He was tired; nonetheless, he finished the project.", es:"Estaba cansado; no obstante, terminó el proyecto."},
              {en:"She disagreed; nonetheless, she helped.", es:"No estaba de acuerdo; sin embargo, ayudó."}
            ]},
          { id:'g-avz-conn-3', type:'choice', prompt:"___ the delay, the event was a success.",
            options:["Despite","Although","Because"], correct:0,
            explain:"“Despite” va seguido de un sustantivo o gerundio, no de una oración completa con verbo conjugado.",
            examples:[
              {en:"Despite the delay, the event was a success.", es:"A pesar del retraso, el evento fue un éxito."},
              {en:"Although it was delayed, the event was a success.", es:"Aunque se retrasó, el evento fue un éxito."}
            ]},
          { id:'g-avz-conn-4', type:'error', wrong:"Despite it was raining, we went out.", wrongWord:"Despite",
            right:"Although it was raining, we went out.", rightWord:"Although",
            explain:"“Despite” no puede ir seguido de una oración con sujeto y verbo; para eso se usa “although”.",
            examples:[
              {en:"Although it was raining, we went out.", es:"Aunque estaba lloviendo, salimos."},
              {en:"Despite the rain, we went out.", es:"A pesar de la lluvia, salimos."}
            ]}
        ]
      },
      {
        topic: 'Preposiciones sutiles',
        items: [
          { id:'g-avz-prep2-1', type:'choice', prompt:"She is responsible ___ the entire project.",
            options:["of","for","to"], correct:1,
            explain:"“Responsible for” es la combinación correcta: responsable de algo.",
            examples:[
              {en:"She is responsible for the entire project.", es:"Ella es responsable de todo el proyecto."},
              {en:"He is in charge of the budget.", es:"Él está a cargo del presupuesto."}
            ]},
          { id:'g-avz-prep2-2', type:'fill', sentence:["This","policy","is","different","___","the","previous","one","."], blankIndex:4,
            bank:["from","of","than"], correct:"from",
            explain:"“Different from” es la forma más neutral y aceptada; “than” es más informal y “of” es incorrecto.",
            examples:[
              {en:"This policy is different from the previous one.", es:"Esta política es diferente a la anterior."},
              {en:"Her approach is different from mine.", es:"Su enfoque es diferente al mío."}
            ]},
          { id:'g-avz-prep2-3', type:'choice', prompt:"He is married ___ a doctor.",
            options:["with","to","for"], correct:1,
            explain:"“Married to” es la combinación fija; “married with” es un error común.",
            examples:[
              {en:"He is married to a doctor.", es:"Él está casado con una doctora."},
              {en:"She got engaged to her partner.", es:"Ella se comprometió con su pareja."}
            ]},
          { id:'g-avz-prep2-4', type:'error', wrong:"I'm interested on this topic.", wrongWord:"on",
            right:"I'm interested in this topic.", rightWord:"in",
            explain:"“Interested in” es la preposición correcta; “interested on” no existe en inglés.",
            examples:[
              {en:"I'm interested in this topic.", es:"Estoy interesado en este tema."},
              {en:"She's interested in art history.", es:"Ella está interesada en historia del arte."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Cláusulas relativas reducidas',
        items: [
          { id:'g-avz-redrel-1', type:'choice', prompt:"The man ___ over there is my uncle.",
            options:["who standing","standing","stood"], correct:1,
            explain:"Una cláusula relativa reducida usa el gerundio (“standing”) en vez de “who is standing”.",
            examples:[
              {en:"The man standing over there is my uncle.", es:"El hombre que está parado allá es mi tío."},
              {en:"The woman speaking now is the director.", es:"La mujer que está hablando ahora es la directora."}
            ]},
          { id:'g-avz-redrel-2', type:'fill', sentence:["The","report","___","by","the","team","was","well","received","."], blankIndex:2,
            bank:["written","wrote","writes"], correct:"written",
            explain:"Cláusula relativa reducida con voz pasiva: “written by” en vez de “which was written by”.",
            examples:[
              {en:"The report written by the team was well received.", es:"El informe escrito por el equipo fue bien recibido."},
              {en:"The house built in 1990 is still standing.", es:"La casa construida en 1990 sigue en pie."}
            ]},
          { id:'g-avz-redrel-3', type:'choice', prompt:"Anyone ___ has questions can email me.",
            options:["who","which","whom"], correct:0,
            explain:"Para personas usamos “who”, no “which” (que es para cosas).",
            examples:[
              {en:"Anyone who has questions can email me.", es:"Cualquiera que tenga preguntas puede escribirme."},
              {en:"The book which I read was great.", es:"El libro que leí fue genial."}
            ]},
          { id:'g-avz-redrel-4', type:'error', wrong:"The person which called you is my boss.", wrongWord:"which",
            right:"The person who called you is my boss.", rightWord:"who",
            explain:"Para personas se usa “who”, no “which”.",
            examples:[
              {en:"The person who called you is my boss.", es:"La persona que te llamó es mi jefe."},
              {en:"The car which I bought is red.", es:"El carro que compré es rojo."}
            ]}
        ]
      },
      {
        topic: 'Formal vs natural / matices',
        items: [
          { id:'g-avz-formal-1', type:'choice', prompt:"¿Cuál suena más natural en una conversación casual?",
            options:["Should you require assistance, contact us.","If you need help, just let us know.","Were you to require assistance..."], correct:1,
            explain:"En conversación casual, las formas simples con “if” suenan más naturales que las inversiones formales.",
            examples:[
              {en:"If you need help, just let us know.", es:"Si necesitas ayuda, avísanos."},
              {en:"Should you require assistance, please contact us.", es:"Si necesita ayuda, por favor contáctenos (formal)."}
            ]},
          { id:'g-avz-formal-2', type:'fill', sentence:["The","new","policy","___","significant","changes","to","the","process","."], blankIndex:3,
            bank:["entails","has","gets"], correct:"entails",
            explain:"“Entails” (implica) es más preciso y formal que “has” en este contexto; “gets” es demasiado informal.",
            examples:[
              {en:"The new policy entails significant changes.", es:"La nueva política implica cambios significativos."},
              {en:"This decision entails some risk.", es:"Esta decisión implica algo de riesgo."}
            ]},
          { id:'g-avz-formal-3', type:'choice', prompt:"¿Cuál es gramaticalmente posible pero suena poco natural para un nativo?",
            options:["It is raining.","Raining it is.","It's raining."], correct:1,
            explain:"“Raining it is” es gramaticalmente extraña y nadie la diría; el orden natural en inglés es sujeto + verbo.",
            examples:[
              {en:"It is raining.", es:"Está lloviendo."},
              {en:"It's raining.", es:"Está lloviendo (forma natural, contraída)."}
            ]},
          { id:'g-avz-formal-4', type:'error', wrong:"I look forward to see you.", wrongWord:"see",
            right:"I look forward to seeing you.", rightWord:"seeing",
            explain:"Después de “look forward to”, “to” funciona como preposición, así que va seguido de gerundio (“seeing”), no infinitivo.",
            examples:[
              {en:"I look forward to seeing you.", es:"Espero con ganas verte."},
              {en:"She looks forward to starting her new job.", es:"Ella espera con ganas empezar su nuevo trabajo."}
            ]}
        ]
      }
    ]
  ]
};

/* ---------------------------------------------------------
   VOCABULARIO — siempre con contexto (2 ejemplos + mini quiz).
   BANK[level] = [ variante0, variante1, variante2 ], cada una
   con 8 palabras.
--------------------------------------------------------- */
const VOCAB_BANK = {
  facil: [
    [
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
    [
      { id:'v-facil2-1', word:'Library', translation:'Library · lugar con muchos libros para leer o pedir prestados',
        examples:[{en:"I borrowed this book from the library.", es:"Pedí prestado este libro de la biblioteca."},{en:"The library closes at six.", es:"La biblioteca cierra a las seis."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lugar con muchos libros para leer o pedir prestados\"?", options:["library","kitchen","airport"], correct:0, explain:"“Library” es la biblioteca." } },
      { id:'v-facil2-2', word:'Expensive', translation:'Expensive · que cuesta mucho dinero',
        examples:[{en:"This restaurant is too expensive.", es:"Este restaurante es muy caro."},{en:"That car is very expensive.", es:"Ese carro es muy caro."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que cuesta mucho dinero\"?", options:["expensive","cheap","free"], correct:0, explain:"“Expensive” significa caro." } },
      { id:'v-facil2-3', word:'Hungry', translation:'Hungry · con ganas de comer',
        examples:[{en:"I'm hungry, let's eat.", es:"Tengo hambre, comamos."},{en:"The kids are always hungry after school.", es:"Los niños siempre tienen hambre después de la escuela."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"con ganas de comer\"?", options:["hungry","tired","thirsty"], correct:0, explain:"“Hungry” es tener hambre; “thirsty” es tener sed." } },
      { id:'v-facil2-4', word:'Homework', translation:'Homework · tarea de la escuela',
        examples:[{en:"I have a lot of homework tonight.", es:"Tengo mucha tarea esta noche."},{en:"Did you finish your homework?", es:"¿Terminaste tu tarea?"}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"tarea de la escuela\"?", options:["homework","holiday","housework"], correct:0, explain:"“Homework” es la tarea escolar." } },
      { id:'v-facil2-5', word:'Airport', translation:'Airport · lugar donde salen y llegan los aviones',
        examples:[{en:"We arrived at the airport early.", es:"Llegamos temprano al aeropuerto."},{en:"The airport is far from downtown.", es:"El aeropuerto está lejos del centro."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lugar donde salen y llegan los aviones\"?", options:["airport","station","library"], correct:0, explain:"“Airport” es el aeropuerto." } },
      { id:'v-facil2-6', word:'Delicious', translation:'Delicious · que sabe muy bien',
        examples:[{en:"This soup is delicious.", es:"Esta sopa está deliciosa."},{en:"She made a delicious cake.", es:"Ella hizo un pastel delicioso."}],
        quiz:{ prompt:"¿Qué significa \"delicious\"?", options:["Que sabe mal","Que sabe muy bien","Que no tiene sabor"], correct:1, explain:"“Delicious” describe algo que sabe muy bien." } },
      { id:'v-facil2-7', word:'Crowded', translation:'Crowded · lleno de gente',
        examples:[{en:"The bus was very crowded this morning.", es:"El bus estaba muy lleno esta mañana."},{en:"The beach gets crowded in summer.", es:"La playa se llena de gente en el verano."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lleno de gente\"?", options:["crowded","empty","quiet"], correct:0, explain:"“Crowded” significa lleno de gente." } },
      { id:'v-facil2-8', word:'Nervous', translation:'Nervous · con miedo o inquietud antes de algo',
        examples:[{en:"I'm nervous about the exam.", es:"Estoy nervioso por el examen."},{en:"She felt nervous before the interview.", es:"Ella se sintió nerviosa antes de la entrevista."}],
        quiz:{ prompt:"¿Cuál oración usa \"nervous\" correctamente?", options:["I'm nervous about the exam.","I'm nervous of the exam for.","I nervous about the exam."], correct:0, explain:"“Nervous” funciona como adjetivo: “I'm nervous about...”." } }
    ],
    [
      { id:'v-facil3-1', word:'Suitcase', translation:'Suitcase · maleta para viajar',
        examples:[{en:"I packed my suitcase last night.", es:"Empaqué mi maleta anoche."},{en:"Her suitcase is very heavy.", es:"Su maleta es muy pesada."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"maleta para viajar\"?", options:["suitcase","backpack","wallet"], correct:0, explain:"“Suitcase” es la maleta de viaje." } },
      { id:'v-facil3-2', word:'Boring', translation:'Boring · que no es interesante',
        examples:[{en:"The movie was so boring.", es:"La película fue muy aburrida."},{en:"He thinks math class is boring.", es:"Él piensa que la clase de matemáticas es aburrida."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que no es interesante\"?", options:["boring","exciting","delicious"], correct:0, explain:"“Boring” significa aburrido." } },
      { id:'v-facil3-3', word:'Comfortable', translation:'Comfortable · que se siente bien, sin molestias',
        examples:[{en:"This chair is very comfortable.", es:"Esta silla es muy cómoda."},{en:"I feel comfortable in these shoes.", es:"Me siento cómodo con estos zapatos."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que se siente bien, sin molestias\"?", options:["comfortable","crowded","nervous"], correct:0, explain:"“Comfortable” significa cómodo." } },
      { id:'v-facil3-4', word:'Habit', translation:'Habit · algo que haces muy seguido, casi sin pensar',
        examples:[{en:"Reading before bed is a good habit.", es:"Leer antes de dormir es un buen hábito."},{en:"He has a habit of checking his phone constantly.", es:"Él tiene el hábito de revisar su teléfono constantemente."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"algo que haces muy seguido, casi sin pensar\"?", options:["habit","holiday","guess"], correct:0, explain:"“Habit” es un hábito o costumbre." } },
      { id:'v-facil3-5', word:'Wallet', translation:'Wallet · donde guardas el dinero y las tarjetas',
        examples:[{en:"I left my wallet at home.", es:"Dejé mi billetera en casa."},{en:"His wallet was in his back pocket.", es:"Su billetera estaba en el bolsillo trasero."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"donde guardas el dinero y las tarjetas\"?", options:["wallet","suitcase","kitchen"], correct:0, explain:"“Wallet” es la billetera." } },
      { id:'v-facil3-6', word:'Polite', translation:'Polite · que trata bien a los demás, con buenos modales',
        examples:[{en:"She's always polite to strangers.", es:"Ella siempre es amable con los desconocidos."},{en:"It's polite to say thank you.", es:"Es de buena educación decir gracias."}],
        quiz:{ prompt:"¿Qué significa \"polite\"?", options:["Grosero","Con buenos modales","Nervioso"], correct:1, explain:"“Polite” significa educado, con buenos modales." } },
      { id:'v-facil3-7', word:'Shy', translation:'Shy · que le da pena hablar o socializar',
        examples:[{en:"He's too shy to talk to new people.", es:"Él es muy tímido para hablar con gente nueva."},{en:"She was shy as a child.", es:"Ella era tímida de niña."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que le da pena hablar o socializar\"?", options:["shy","polite","boring"], correct:0, explain:"“Shy” significa tímido." } },
      { id:'v-facil3-8', word:'Guess', translation:'Guess · decir algo sin estar seguro',
        examples:[{en:"I don't know, but I'll guess.", es:"No sé, pero adivinaré."},{en:"Can you guess how old I am?", es:"¿Puedes adivinar cuántos años tengo?"}],
        quiz:{ prompt:"¿Cuál oración usa \"guess\" correctamente?", options:["Can you guess my age?","Can you guess of my age?","Can you guessing my age?"], correct:0, explain:"“Guess” es un verbo simple: “guess + objeto”, sin preposición extra." } }
    ]
  ],
  medio: [
    [
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
    [
      { id:'v-medio2-1', word:'Frustrated', translation:'Frustrated · molesto porque algo no sale como quieres',
        examples:[{en:"I felt frustrated when the internet stopped working.", es:"Me sentí frustrado cuando internet dejó de funcionar."},{en:"She was frustrated with the slow progress.", es:"Ella estaba frustrada con el progreso lento."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"molesto porque algo no sale como quieres\"?", options:["frustrated","grateful","polite"], correct:0, explain:"“Frustrated” es sentirse frustrado." } },
      { id:'v-medio2-2', word:'Convince', translation:'Convince · lograr que alguien crea o haga algo',
        examples:[{en:"I couldn't convince him to come.", es:"No pude convencerlo de venir."},{en:"She convinced her boss to give her more time.", es:"Ella convenció a su jefe de darle más tiempo."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lograr que alguien crea o haga algo\"?", options:["convince","guess","overcome"], correct:0, explain:"“Convince” es convencer." } },
      { id:'v-medio2-3', word:'Awkward', translation:'Awkward · incómodo o extraño en una situación social',
        examples:[{en:"There was an awkward silence.", es:"Hubo un silencio incómodo."},{en:"It felt awkward to ask for money.", es:"Se sintió incómodo pedir dinero."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"incómodo o extraño en una situación social\"?", options:["awkward","comfortable","reliable"], correct:0, explain:"“Awkward” describe una situación incómoda." } },
      { id:'v-medio2-4', word:'Struggle', translation:'Struggle · esforzarte mucho para lograr algo difícil',
        examples:[{en:"She struggled to finish the marathon.", es:"Ella luchó para terminar el maratón."},{en:"Many families struggle to pay rent.", es:"Muchas familias luchan para pagar la renta."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"esforzarte mucho para lograr algo difícil\"?", options:["struggle","achieve","postpone"], correct:0, explain:"“Struggle” es luchar o esforzarse contra una dificultad." } },
      { id:'v-medio2-5', word:'Worthwhile', translation:'Worthwhile · que vale la pena el esfuerzo',
        examples:[{en:"The trip was worthwhile despite the cost.", es:"El viaje valió la pena a pesar del costo."},{en:"It's worthwhile to learn a new language.", es:"Vale la pena aprender un nuevo idioma."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que vale la pena el esfuerzo\"?", options:["worthwhile","boring","awkward"], correct:0, explain:"“Worthwhile” significa que vale la pena." } },
      { id:'v-medio2-6', word:'Grateful', translation:'Grateful · agradecido por algo',
        examples:[{en:"I'm grateful for your help.", es:"Estoy agradecido por tu ayuda."},{en:"She's grateful to have a supportive family.", es:"Ella está agradecida de tener una familia que la apoya."}],
        quiz:{ prompt:"¿Qué significa \"grateful\"?", options:["Agradecido","Frustrado","Confundido"], correct:0, explain:"“Grateful” significa agradecido." } },
      { id:'v-medio2-7', word:'Insight', translation:'Insight · comprensión profunda de algo',
        examples:[{en:"The book gave me new insight into the topic.", es:"El libro me dio una nueva comprensión del tema."},{en:"Her insight helped us solve the problem.", es:"Su perspectiva nos ayudó a resolver el problema."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"comprensión profunda de algo\"?", options:["insight","assumption","discrepancy"], correct:0, explain:"“Insight” es una comprensión o perspectiva profunda." } },
      { id:'v-medio2-8', word:'Overcome', translation:'Overcome · superar una dificultad',
        examples:[{en:"She overcame her fear of flying.", es:"Ella superó su miedo a volar."},{en:"He worked hard to overcome the obstacles.", es:"Él trabajó duro para superar los obstáculos."}],
        quiz:{ prompt:"¿Cuál oración usa \"overcome\" correctamente?", options:["She overcame her fear.","She overcame of her fear.","She overcame to fear."], correct:0, explain:"“Overcome” es un verbo transitivo: “overcome + objeto”, sin preposición." } }
    ],
    [
      { id:'v-medio3-1', word:'Ambiguous', translation:'Ambiguous · que se puede entender de más de una manera',
        examples:[{en:"His answer was ambiguous.", es:"Su respuesta fue ambigua."},{en:"The instructions were ambiguous and confusing.", es:"Las instrucciones eran ambiguas y confusas."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que se puede entender de más de una manera\"?", options:["ambiguous","genuine","thorough"], correct:0, explain:"“Ambiguous” es algo confuso, con más de una interpretación." } },
      { id:'v-medio3-2', word:'Commitment', translation:'Commitment · compromiso con algo o alguien',
        examples:[{en:"Marriage requires real commitment.", es:"El matrimonio requiere un compromiso real."},{en:"She showed great commitment to the project.", es:"Ella mostró gran compromiso con el proyecto."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"compromiso con algo o alguien\"?", options:["commitment","habit","insight"], correct:0, explain:"“Commitment” es un compromiso." } },
      { id:'v-medio3-3', word:'Underestimate', translation:'Underestimate · pensar que algo vale o pesa menos de lo real',
        examples:[{en:"Don't underestimate the difficulty of the exam.", es:"No subestimes la dificultad del examen."},{en:"They underestimated how long it would take.", es:"Subestimaron cuánto tiempo tomaría."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"pensar que algo vale o pesa menos de lo real\"?", options:["underestimate","overcome","convince"], correct:0, explain:"“Underestimate” es subestimar." } },
      { id:'v-medio3-4', word:'Adapt', translation:'Adapt · cambiar para ajustarte a una nueva situación',
        examples:[{en:"It took time to adapt to the new schedule.", es:"Tomó tiempo adaptarse al nuevo horario."},{en:"Animals adapt to their environment.", es:"Los animales se adaptan a su entorno."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cambiar para ajustarte a una nueva situación\"?", options:["adapt","struggle","resent"], correct:0, explain:"“Adapt” es adaptarse." } },
      { id:'v-medio3-5', word:'Genuine', translation:'Genuine · verdadero, sin fingir',
        examples:[{en:"Her smile was genuine.", es:"Su sonrisa era genuina."},{en:"He gave a genuine apology.", es:"Él dio una disculpa genuina."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"verdadero, sin fingir\"?", options:["genuine","ambiguous","awkward"], correct:0, explain:"“Genuine” significa auténtico, real." } },
      { id:'v-medio3-6', word:'Hesitate', translation:'Hesitate · dudar antes de hacer algo',
        examples:[{en:"Don't hesitate to ask for help.", es:"No dudes en pedir ayuda."},{en:"She hesitated before answering.", es:"Ella dudó antes de responder."}],
        quiz:{ prompt:"¿Qué significa \"hesitate\"?", options:["Dudar","Convencer","Agradecer"], correct:0, explain:"“Hesitate” significa dudar o titubear." } },
      { id:'v-medio3-7', word:'Thorough', translation:'Thorough · hecho con mucho cuidado y detalle',
        examples:[{en:"She did a thorough review of the document.", es:"Ella hizo una revisión minuciosa del documento."},{en:"He gave a thorough explanation.", es:"Él dio una explicación minuciosa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"hecho con mucho cuidado y detalle\"?", options:["thorough","boring","frustrated"], correct:0, explain:"“Thorough” es minucioso, detallado." } },
      { id:'v-medio3-8', word:'Resent', translation:'Resent · sentir molestia o rencor por algo',
        examples:[{en:"She resented having to work on weekends.", es:"Ella sentía rencor por tener que trabajar los fines de semana."},{en:"He resents being told what to do.", es:"Él se molesta de que le digan qué hacer."}],
        quiz:{ prompt:"¿Cuál oración usa \"resent\" correctamente?", options:["She resents working on weekends.","She resents of working on weekends.","She resents to work on weekends."], correct:0, explain:"“Resent” va seguido de gerundio directo, sin preposición: “resent working”." } }
    ]
  ],
  avanzado: [
    [
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
    ],
    [
      { id:'v-avz2-1', word:'Discern', translation:'Discern · percibir o distinguir algo que no es obvio',
        examples:[{en:"It's hard to discern the difference between the two versions.", es:"Es difícil distinguir la diferencia entre las dos versiones."},{en:"She could discern a hint of sadness in his voice.", es:"Ella pudo percibir un toque de tristeza en su voz."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"percibir o distinguir algo que no es obvio\"?", options:["discern","resent","adapt"], correct:0, explain:"“Discern” es percibir algo sutil." } },
      { id:'v-avz2-2', word:'Candid', translation:'Candid · honesto y directo, sin filtros',
        examples:[{en:"He was candid about his mistakes.", es:"Él fue franco sobre sus errores."},{en:"I appreciate your candid feedback.", es:"Aprecio tu retroalimentación franca."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"honesto y directo, sin filtros\"?", options:["candid","elusive","tenuous"], correct:0, explain:"“Candid” significa franco, honesto." } },
      { id:'v-avz2-3', word:'Elusive', translation:'Elusive · difícil de encontrar, atrapar o definir',
        examples:[{en:"A real solution remained elusive.", es:"Una solución real seguía siendo difícil de alcanzar."},{en:"The answer to that question is elusive.", es:"La respuesta a esa pregunta es esquiva."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"difícil de encontrar, atrapar o definir\"?", options:["elusive","candid","astute"], correct:0, explain:"“Elusive” describe algo esquivo o difícil de alcanzar." } },
      { id:'v-avz2-4', word:'Vindicate', translation:'Vindicate · demostrar que alguien tenía razón',
        examples:[{en:"The results vindicated her decision.", es:"Los resultados demostraron que su decisión era correcta."},{en:"He felt vindicated when the truth came out.", es:"Él se sintió reivindicado cuando salió la verdad."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"demostrar que alguien tenía razón\"?", options:["vindicate","discern","underestimate"], correct:0, explain:"“Vindicate” es reivindicar, probar que alguien tenía razón." } },
      { id:'v-avz2-5', word:'Prolific', translation:'Prolific · que produce mucho (obras, resultados)',
        examples:[{en:"She's a prolific writer.", es:"Ella es una escritora prolífica."},{en:"He was remarkably prolific in his early career.", es:"Él fue notablemente prolífico al inicio de su carrera."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que produce mucho (obras, resultados)\"?", options:["prolific","tenuous","candid"], correct:0, explain:"“Prolific” describe a alguien muy productivo." } },
      { id:'v-avz2-6', word:'Tenuous', translation:'Tenuous · débil, poco sólido (una conexión o argumento)',
        examples:[{en:"The connection between the two events is tenuous.", es:"La conexión entre los dos eventos es débil."},{en:"His argument was tenuous at best.", es:"Su argumento era débil, en el mejor de los casos."}],
        quiz:{ prompt:"¿Qué significa \"tenuous\"?", options:["Muy sólido","Débil, poco convincente","Extremadamente claro"], correct:1, explain:"“Tenuous” significa débil o poco sólido, especialmente un argumento." } },
      { id:'v-avz2-7', word:'Astute', translation:'Astute · perspicaz, que juzga bien las situaciones',
        examples:[{en:"She made an astute observation.", es:"Ella hizo una observación perspicaz."},{en:"He's an astute businessman.", es:"Él es un hombre de negocios perspicaz."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"perspicaz, que juzga bien las situaciones\"?", options:["astute","elusive","prolific"], correct:0, explain:"“Astute” significa perspicaz, inteligente para juzgar situaciones." } },
      { id:'v-avz2-8', word:'Deference', translation:'Deference · respeto que muestras hacia la opinión de otro',
        examples:[{en:"He spoke with deference to his mentor.", es:"Él habló con deferencia hacia su mentor."},{en:"She showed deference to the committee's decision.", es:"Ella mostró deferencia a la decisión del comité."}],
        quiz:{ prompt:"¿Cuál oración usa \"deference\" correctamente?", options:["He treated her with deference.","He treated her with deference of.","He deference treated her."], correct:0, explain:"“Deference” es un sustantivo: “with deference”, sin preposición adicional." } }
    ],
    [
      { id:'v-avz3-1', word:'Conducive', translation:'Conducive · que favorece o facilita algo',
        examples:[{en:"A quiet room is conducive to studying.", es:"Un cuarto tranquilo favorece el estudio."},{en:"The environment wasn't conducive to creativity.", es:"El ambiente no favorecía la creatividad."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que favorece o facilita algo\"?", options:["conducive","precarious","elusive"], correct:0, explain:"“Conducive” significa que favorece algo (siempre con “to”)." } },
      { id:'v-avz3-2', word:'Disparage', translation:'Disparage · hablar mal de algo o alguien para desprestigiarlo',
        examples:[{en:"He tends to disparage other people's work.", es:"Él tiende a menospreciar el trabajo de otros."},{en:"She never disparages her competitors.", es:"Ella nunca desprestigia a sus competidores."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"hablar mal de algo o alguien para desprestigiarlo\"?", options:["disparage","vindicate","substantiate"], correct:0, explain:"“Disparage” es desprestigiar o menospreciar." } },
      { id:'v-avz3-3', word:'Plausible', translation:'Plausible · que parece creíble o razonable',
        examples:[{en:"That's a plausible explanation.", es:"Esa es una explicación creíble."},{en:"His excuse sounded plausible.", es:"Su excusa sonaba creíble."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que parece creíble o razonable\"?", options:["plausible","tenuous","candid"], correct:0, explain:"“Plausible” significa creíble o razonable." } },
      { id:'v-avz3-4', word:'Circumvent', translation:'Circumvent · evitar un obstáculo o regla de forma astuta',
        examples:[{en:"They found a way to circumvent the restriction.", es:"Encontraron una manera de evitar la restricción."},{en:"He tried to circumvent the rules.", es:"Él trató de evadir las reglas."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"evitar un obstáculo o regla de forma astuta\"?", options:["circumvent","discern","adapt"], correct:0, explain:"“Circumvent” es evadir o sortear algo, usualmente una regla." } },
      { id:'v-avz3-5', word:'Innate', translation:'Innate · que se tiene desde que naces, no aprendido',
        examples:[{en:"She has an innate talent for music.", es:"Ella tiene un talento innato para la música."},{en:"Curiosity seems innate in children.", es:"La curiosidad parece innata en los niños."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que se tiene desde que naces, no aprendido\"?", options:["innate","prolific","astute"], correct:0, explain:"“Innate” significa innato, de nacimiento." } },
      { id:'v-avz3-6', word:'Precarious', translation:'Precarious · inestable, en riesgo de fallar o caer',
        examples:[{en:"The company is in a precarious financial position.", es:"La empresa está en una posición financiera precaria."},{en:"He balanced on a precarious ladder.", es:"Él se balanceó en una escalera inestable."}],
        quiz:{ prompt:"¿Qué significa \"precarious\"?", options:["Muy estable","Inestable, en riesgo","Extremadamente seguro"], correct:1, explain:"“Precarious” significa inestable o arriesgado." } },
      { id:'v-avz3-7', word:'Substantiate', translation:'Substantiate · dar pruebas o evidencia de algo',
        examples:[{en:"She couldn't substantiate her claims.", es:"Ella no pudo sustentar sus afirmaciones."},{en:"The report substantiates our concerns.", es:"El informe sustenta nuestras preocupaciones."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"dar pruebas o evidencia de algo\"?", options:["substantiate","disparage","circumvent"], correct:0, explain:"“Substantiate” significa sustentar o probar algo con evidencia." } },
      { id:'v-avz3-8', word:'Unassuming', translation:'Unassuming · modesto, que no busca llamar la atención',
        examples:[{en:"He's a brilliant but unassuming scientist.", es:"Él es un científico brillante pero modesto."},{en:"She has an unassuming manner.", es:"Ella tiene una manera modesta de ser."}],
        quiz:{ prompt:"¿Cuál oración usa \"unassuming\" correctamente?", options:["He is a brilliant, unassuming scientist.","He is a brilliant, unassuming of scientist.","He unassuming is a scientist."], correct:0, explain:"“Unassuming” es un adjetivo simple antes del sustantivo: “an unassuming scientist”." } }
    ]
  ]
};

/* ---------------------------------------------------------
   LISTENING — el audio es un archivo MP3 real (todavía por
   producir). Si el archivo no existe, la interfaz lo avisa
   discretamente y sigue funcionando con el resto del ejercicio.
   BANK[level] = [ variante0 (3 ítems), variante1 (2 ítems),
   variante2 (2 ítems) ]. Los MP3 nuevos continúan la numeración.
--------------------------------------------------------- */
const LISTENING_BANK = {
  facil: [
    [
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
    [
      { id:'l-facil2-1', audioFile:'audio/a1/a1listening-004.mp3',
        transcript:"My keys are in my bag, not on the table.", translation:"Mis llaves están en mi bolso, no en la mesa.",
        question:"Where are the keys?", options:["On the table","In the bag","Under the chair"], correct:1,
        explain:"“In my bag” indica que están dentro del bolso, no en la mesa." },
      { id:'l-facil2-2', audioFile:'audio/a1/a1listening-005.mp3',
        transcript:"We are going to the beach this weekend.", translation:"Vamos a ir a la playa este fin de semana.",
        question:"What are they going to do?", options:["Go to the beach","Stay home","Go to school"], correct:0,
        explain:"“Going to the beach” describe un plan futuro." }
    ],
    [
      { id:'l-facil3-1', audioFile:'audio/a1/a1listening-006.mp3',
        transcript:"This bag is bigger than that one.", translation:"Esta bolsa es más grande que esa.",
        question:"Which bag is bigger?", options:["This one","That one","They are the same"], correct:0,
        explain:"“Bigger than” indica cuál de las dos es más grande." },
      { id:'l-facil3-2', audioFile:'audio/a1/a1listening-007.mp3',
        transcript:"I can swim, but I can't ski.", translation:"Puedo nadar, pero no puedo esquiar.",
        question:"What can't the speaker do?", options:["Swim","Ski","Run"], correct:1,
        explain:"“Can't ski” dice qué NO puede hacer la persona." }
    ]
  ],
  medio: [
    [
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
    [
      { id:'l-medio2-1', audioFile:'audio/b1/b1listening-004.mp3',
        transcript:"She said that she was tired.", translation:"Ella dijo que estaba cansada.",
        question:"What did she say?", options:["That she was tired","That she was hungry","That she was late"], correct:0,
        explain:"“Said that she was tired” reporta lo que ella dijo." },
      { id:'l-medio2-2', audioFile:'audio/b1/b1listening-005.mp3',
        transcript:"I have lived here since 2019.", translation:"He vivido aquí desde 2019.",
        question:"How long has she lived here?", options:["Since 2019","For 2019 years","Until 2019"], correct:0,
        explain:"“Since 2019” marca el punto exacto en que empezó." }
    ],
    [
      { id:'l-medio3-1', audioFile:'audio/b1/b1listening-006.mp3',
        transcript:"If it rains tomorrow, we will stay home.", translation:"Si llueve mañana, nos quedaremos en casa.",
        question:"What will they do if it rains?", options:["Stay home","Go out","Cancel the trip"], correct:0,
        explain:"Condicional tipo 1: consecuencia real y probable." },
      { id:'l-medio3-2', audioFile:'audio/b1/b1listening-007.mp3',
        transcript:"Although it was expensive, she bought the dress.", translation:"Aunque era caro, ella compró el vestido.",
        question:"Did she buy the dress?", options:["Yes","No","She's not sure"], correct:0,
        explain:"“Although” introduce un contraste, pero la acción sí ocurrió." }
    ]
  ],
  avanzado: [
    [
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
    ],
    [
      { id:'l-avz2-1', audioFile:'audio/c1/c1listening-004.mp3',
        transcript:"The results were disappointing; nevertheless, the team kept working.", translation:"Los resultados fueron decepcionantes; sin embargo, el equipo siguió trabajando.",
        question:"What does \"nevertheless\" show here?", options:["A contrast","A reason","A result"], correct:0,
        explain:"“Nevertheless” conecta dos ideas contrastantes." },
      { id:'l-avz2-2', audioFile:'audio/c1/c1listening-005.mp3',
        transcript:"She is responsible for the project, not accountable to it.", translation:"Ella es responsable del proyecto, no responsable ante él.",
        question:"What preposition follows \"responsible\" here?", options:["for","to","of"], correct:0,
        explain:"“Responsible for” indica estar a cargo de algo." }
    ],
    [
      { id:'l-avz3-1', audioFile:'audio/c1/c1listening-006.mp3',
        transcript:"The report written by the team was well received.", translation:"El informe escrito por el equipo fue bien recibido.",
        question:"Who wrote the report?", options:["The team","The manager","A client"], correct:0,
        explain:"“Written by the team” es una cláusula relativa reducida." },
      { id:'l-avz3-2', audioFile:'audio/c1/c1listening-007.mp3',
        transcript:"Should you need assistance, please contact us.", translation:"Si necesita ayuda, por favor contáctenos.",
        question:"What does this sentence mean?", options:["If you need help, contact us","You must contact us now","You already contacted us"], correct:0,
        explain:"“Should you need” es una forma formal de decir “if you need”." }
    ]
  ]
};

/* ---------------------------------------------------------
   SPEAKING — el audio de referencia también es un MP3 real
   (mismo criterio que listening). No se inventa puntuación
   de pronunciación: solo se compara escuchando ambos audios.
   BANK[level] = [ variante0 (3 ítems), variante1 (2 ítems),
   variante2 (2 ítems) ]. Los MP3 nuevos continúan la numeración.
--------------------------------------------------------- */
const SPEAKING_BANK = {
  facil: [
    [
      { id:'s-facil-1', sentence:"What time is it?", translation:"¿Qué hora es?", audioFile:'audio/a1/a1speaking-001.mp3' },
      { id:'s-facil-2', sentence:"My name is Veronica and I am from Colombia.", translation:"Me llamo Veronica y soy de Colombia.", audioFile:'audio/a1/a1speaking-002.mp3' },
      { id:'s-facil-3', sentence:"I usually have breakfast at eight.", translation:"Normalmente desayuno a las ocho.", audioFile:'audio/a1/a1speaking-003.mp3' }
    ],
    [
      { id:'s-facil2-1', sentence:"My keys are in my bag.", translation:"Mis llaves están en mi bolso.", audioFile:'audio/a1/a1speaking-004.mp3' },
      { id:'s-facil2-2', sentence:"We are going to the beach this weekend.", translation:"Vamos a ir a la playa este fin de semana.", audioFile:'audio/a1/a1speaking-005.mp3' }
    ],
    [
      { id:'s-facil3-1', sentence:"This bag is bigger than that one.", translation:"Esta bolsa es más grande que esa.", audioFile:'audio/a1/a1speaking-006.mp3' },
      { id:'s-facil3-2', sentence:"I can swim, but I can't ski.", translation:"Puedo nadar, pero no puedo esquiar.", audioFile:'audio/a1/a1speaking-007.mp3' }
    ]
  ],
  medio: [
    [
      { id:'s-medio-1', sentence:"By the time we arrived, the movie had already started.", translation:"Para cuando llegamos, la película ya había empezado.", audioFile:'audio/b1/b1speaking-001.mp3' },
      { id:'s-medio-2', sentence:"I'm used to working late.", translation:"Estoy acostumbrado a trabajar hasta tarde.", audioFile:'audio/b1/b1speaking-002.mp3' },
      { id:'s-medio-3', sentence:"Nevertheless, we decided to continue.", translation:"Sin embargo, decidimos continuar.", audioFile:'audio/b1/b1speaking-003.mp3' }
    ],
    [
      { id:'s-medio2-1', sentence:"She said that she was tired.", translation:"Ella dijo que estaba cansada.", audioFile:'audio/b1/b1speaking-004.mp3' },
      { id:'s-medio2-2', sentence:"I have lived here since 2019.", translation:"He vivido aquí desde 2019.", audioFile:'audio/b1/b1speaking-005.mp3' }
    ],
    [
      { id:'s-medio3-1', sentence:"If it rains tomorrow, we will stay home.", translation:"Si llueve mañana, nos quedaremos en casa.", audioFile:'audio/b1/b1speaking-006.mp3' },
      { id:'s-medio3-2', sentence:"Although it was expensive, she bought the dress.", translation:"Aunque era caro, ella compró el vestido.", audioFile:'audio/b1/b1speaking-007.mp3' }
    ]
  ],
  avanzado: [
    [
      { id:'s-avz-1', sentence:"Had I known about the delay, I would have acted differently.", translation:"Si hubiera sabido sobre el retraso, habría actuado diferente.", audioFile:'audio/c1/c1speaking-001.mp3' },
      { id:'s-avz-2', sentence:"No sooner had she arrived than it started raining.", translation:"Apenas había llegado cuando empezó a llover.", audioFile:'audio/c1/c1speaking-002.mp3' },
      { id:'s-avz-3', sentence:"Despite the criticism, the policy remains ubiquitous.", translation:"A pesar de las críticas, la política sigue siendo omnipresente.", audioFile:'audio/c1/c1speaking-003.mp3' }
    ],
    [
      { id:'s-avz2-1', sentence:"Nevertheless, the team kept working.", translation:"Sin embargo, el equipo siguió trabajando.", audioFile:'audio/c1/c1speaking-004.mp3' },
      { id:'s-avz2-2', sentence:"She is responsible for the project.", translation:"Ella es responsable del proyecto.", audioFile:'audio/c1/c1speaking-005.mp3' }
    ],
    [
      { id:'s-avz3-1', sentence:"The report written by the team was well received.", translation:"El informe escrito por el equipo fue bien recibido.", audioFile:'audio/c1/c1speaking-006.mp3' },
      { id:'s-avz3-2', sentence:"Should you need assistance, please contact us.", translation:"Si necesita ayuda, por favor contáctenos.", audioFile:'audio/c1/c1speaking-007.mp3' }
    ]
  ]
};

/* ---------------------------------------------------------
   WRITING — sin corrección automática "inteligente" (no hay
   backend ni IA). Se ofrece ejemplo + checklist de autorrevisión.
   BANK[level] = [ variante0 (4 ítems), variante1 (4 ítems),
   variante2 (4 ítems) ].
--------------------------------------------------------- */
const WRITING_BANK = {
  facil: [
    [
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
    [
      { id:'w-facil2-1', prompt:"Escribe una frase sobre algo que vas a hacer mañana (“going to”).", target:"going to",
        checkPattern:"(am|is|are|'m|'s|'re) going to [a-z]+", hint:"Estructura esperada: “I am going to ___.”",
        example:{en:"I am going to visit my grandmother tomorrow.", es:"Voy a visitar a mi abuela mañana."},
        checklist:["¿Usaste “going to” + verbo?","¿La frase habla de un plan futuro?","¿Tiene sentido completo?"] },
      { id:'w-facil2-2', prompt:"Escribe una frase sobre algo que te gusta o no te gusta hacer.", target:"like / don't like",
        checkPattern:"\\b(i|he|she|we|they)\\b.*(like|likes|don't like|doesn't like|love|loves)", hint:"Estructura esperada: “I like / don't like + actividad.”",
        example:{en:"I like reading before bed.", es:"Me gusta leer antes de dormir."},
        checklist:["¿Usaste “like” o “don't like”?","¿Mencionaste una actividad?","¿La frase suena natural?"] },
      { id:'w-facil2-3', prompt:"Describe a un miembro de tu familia usando “has”.", target:"has",
        checkPattern:"\\bhas\\b [a-z]+", hint:"Estructura esperada: “My ___ has ___.”",
        example:{en:"My sister has brown eyes.", es:"Mi hermana tiene ojos cafés."},
        checklist:["¿Usaste “has”?","¿Describiste a alguien de tu familia?","¿La frase tiene sentido?"] },
      { id:'w-facil2-4', prompt:"Escribe una frase con “can” sobre algo que sabes hacer.", target:"can",
        checkPattern:"\\bcan\\b [a-z]+", hint:"Estructura esperada: “I can + verbo base.”",
        example:{en:"I can cook pasta very well.", es:"Sé cocinar pasta muy bien."},
        checklist:["¿Usaste “can” + verbo base?","¿Describiste una habilidad real?","¿La frase tiene sentido?"] }
    ],
    [
      { id:'w-facil3-1', prompt:"Escribe una frase con “there is” o “there are” describiendo tu casa.", target:"there is / there are",
        checkPattern:"there (is|are) ", hint:"Estructura esperada: “There is/are ___ in my house.”",
        example:{en:"There are three bedrooms in my house.", es:"Hay tres habitaciones en mi casa."},
        checklist:["¿Usaste “there is” o “there are”?","¿Describiste algo de tu casa?","¿Concuerda singular/plural?"] },
      { id:'w-facil3-2', prompt:"Escribe una frase comparando dos cosas (“more... than” o “-er than”).", target:"comparativo",
        checkPattern:"\\b\\w+er\\b than|more \\w+ than", hint:"Estructura esperada: “___ + er/more ___ than ___.”",
        example:{en:"My city is bigger than his.", es:"Mi ciudad es más grande que la suya."},
        checklist:["¿Usaste un comparativo (“-er” o “more”)?","¿Incluiste “than”?","¿La frase compara dos cosas?"] },
      { id:'w-facil3-3', prompt:"Escribe una pregunta empezando con “Do you…?”", target:"do you",
        checkPattern:"^do you [a-z]+", hint:"Estructura esperada: “Do you ___?”",
        example:{en:"Do you like coffee?", es:"¿Te gusta el café?"},
        checklist:["¿Empezaste con “Do you”?","¿Es una pregunta completa?","¿Usaste un verbo base después?"] },
      { id:'w-facil3-4', prompt:"Escribe una frase usando el posesivo con ‘s (ej. “Ana's book”).", target:"posesivo 's",
        checkPattern:"[a-z]+'s [a-z]+", hint:"Estructura esperada: “Nombre's + cosa.”",
        example:{en:"Ana's book is on the table.", es:"El libro de Ana está en la mesa."},
        checklist:["¿Usaste ‘s para mostrar posesión?","¿Se entiende de quién es la cosa?","¿La frase tiene sentido?"] }
    ]
  ],
  medio: [
    [
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
    [
      { id:'w-medio2-1', prompt:"Escribe una frase con presente perfecto sobre algo que ya hiciste en tu vida.", target:"presente perfecto",
        checkPattern:"\\b(have|has)\\b (been|done|gone|seen|written|finished|eaten|taken|made|left|visited|tried|lived|worked)", hint:"Estructura esperada: “I have + participio ___.”",
        example:{en:"I have visited three countries.", es:"He visitado tres países."},
        checklist:["¿Usaste “have/has” + participio?","¿Describiste una experiencia de vida?","¿No usaste una fecha específica?"] },
      { id:'w-medio2-2', prompt:"Escribe una frase usando “since” o “for” con presente perfecto.", target:"since / for",
        checkPattern:"\\b(have|has)\\b.*\\b(since|for)\\b", hint:"Estructura esperada: “I have + participio ... since/for ___.”",
        example:{en:"I have worked here for two years.", es:"Trabajo aquí desde hace dos años."},
        checklist:["¿Usaste “have/has”?","¿Usaste “since” o “for” correctamente?","¿La frase tiene sentido de duración?"] },
      { id:'w-medio2-3', prompt:"Escribe una frase con un verbo + gerundio (ej. “enjoy doing”).", target:"verbo + -ing",
        checkPattern:"\\b(enjoy|love|hate|finish|avoid|suggest|keep|mind)\\b [a-z]+ing", hint:"Estructura esperada: “I enjoy/love/hate + verbo-ing.”",
        example:{en:"I enjoy reading on weekends.", es:"Disfruto leer los fines de semana."},
        checklist:["¿Usaste un verbo como “enjoy” o “hate”?","¿El siguiente verbo termina en “-ing”?","¿La frase tiene sentido?"] },
      { id:'w-medio2-4', prompt:"Escribe una frase reportando lo que alguien dijo (“said that…”).", target:"reported speech",
        checkPattern:"said (that )?", hint:"Estructura esperada: “She/He said (that) ___.”",
        example:{en:"She said that she was busy.", es:"Ella dijo que estaba ocupada."},
        checklist:["¿Usaste “said” (that)?","¿Cambiaste el tiempo verbal al pasado?","¿La frase tiene sentido?"] }
    ],
    [
      { id:'w-medio3-1', prompt:"Escribe una frase condicional tipo 1 (“If + presente, will + verbo”).", target:"condicional 1",
        checkPattern:"if [a-z].*will ", hint:"Estructura esperada: “If ___, I will ___.”",
        example:{en:"If I have time, I will call you.", es:"Si tengo tiempo, te llamaré."},
        checklist:["¿Empezaste con “if” + presente?","¿Usaste “will” en la otra parte?","¿Describe algo probable?"] },
      { id:'w-medio3-2', prompt:"Escribe una frase con una cláusula relativa usando “who” o “which”.", target:"cláusula relativa",
        checkPattern:"\\b(who|which|that)\\b [a-z]+", hint:"Estructura esperada: “The person/thing who/which ___.”",
        example:{en:"The woman who called me is my teacher.", es:"La mujer que me llamó es mi maestra."},
        checklist:["¿Usaste “who” o “which” correctamente?","¿“who” es para personas y “which” para cosas?","¿La frase tiene sentido?"] },
      { id:'w-medio3-3', prompt:"Escribe una frase usando “still” o “yet” correctamente.", target:"still / yet",
        checkPattern:"\\b(still|yet)\\b", hint:"Estructura esperada: “I still ___” o “I haven't ___ yet.”",
        example:{en:"I haven't finished the report yet.", es:"Todavía no he terminado el informe."},
        checklist:["¿Usaste “still” o “yet”?","¿La posición en la frase es correcta?","¿Tiene sentido el significado?"] },
      { id:'w-medio3-4', prompt:"Escribe una frase usando “been” o “gone” con presente perfecto.", target:"been / gone",
        checkPattern:"\\b(have|has)\\b (been|gone)\\b", hint:"Estructura esperada: “She has been/gone to ___.”",
        example:{en:"She has gone to the store.", es:"Ella se fue a la tienda (todavía no ha vuelto)."},
        checklist:["¿Usaste “has been” o “has gone”?","¿El significado corresponde (ida y vuelta vs. todavía fuera)?","¿La frase tiene sentido?"] }
    ]
  ],
  avanzado: [
    [
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
    ],
    [
      { id:'w-avz2-1', prompt:"Escribe una frase con un condicional mixto (“If + had + participio, ... would + verbo base”).", target:"condicional mixto",
        checkPattern:"if.*\\bhad\\b.*would (?!have)[a-z]+", hint:"Estructura esperada: “If I had ___, I would ___ (now).”",
        example:{en:"If I had studied medicine, I would be a doctor now.", es:"Si hubiera estudiado medicina, ahora sería doctor."},
        checklist:["¿Usaste “if + had + participio”?","¿Usaste “would” + verbo base (sin “have”)?","¿Conecta un pasado hipotético con un presente?"] },
      { id:'w-avz2-2', prompt:"Escribe una frase usando un conector formal como “nevertheless” o “furthermore”.", target:"conector formal",
        checkPattern:"\\b(nevertheless|furthermore|moreover|consequently)\\b", hint:"Estructura esperada: “..., nevertheless/furthermore, ...”",
        example:{en:"The plan was risky; nevertheless, we approved it.", es:"El plan era arriesgado; sin embargo, lo aprobamos."},
        checklist:["¿Usaste un conector formal?","¿Conecta dos ideas de forma lógica?","¿Suena natural y no forzado?"] },
      { id:'w-avz2-3', prompt:"Escribe una frase con una cláusula relativa reducida usando un participio pasado (ej. “written by”).", target:"cláusula relativa reducida",
        checkPattern:"(written|made|given|sent|built|found|used|created|designed) by", hint:"Estructura esperada: “The ___ + participio + by ___.”",
        example:{en:"The bridge built by the company collapsed.", es:"El puente construido por la empresa colapsó."},
        checklist:["¿Usaste un participio pasado (ej. “written”, “made”)?","¿Evitaste “which was”?","¿La frase tiene sentido?"] },
      { id:'w-avz2-4', prompt:"Escribe una frase usando “despite the fact that”.", target:"despite the fact that",
        checkPattern:"despite the fact that", hint:"Estructura esperada: “Despite the fact that + sujeto + verbo, ...”",
        example:{en:"Despite the fact that it was late, they kept working.", es:"A pesar de que era tarde, siguieron trabajando."},
        checklist:["¿Usaste “despite the fact that”?","¿Le sigue una oración completa?","¿La frase suena formal y natural?"] }
    ],
    [
      { id:'w-avz3-1', prompt:"Escribe una frase con inversión enfática usando “Rarely” o “Seldom”.", target:"inversión con Rarely/Seldom",
        checkPattern:"^(rarely|seldom) (have|has|do|does|did|is|are|was|were)", hint:"Estructura esperada: “Rarely/Seldom + auxiliar + sujeto + verbo.”",
        example:{en:"Rarely have I seen such dedication.", es:"Rara vez he visto tanta dedicación."},
        checklist:["¿Empezaste con “Rarely” o “Seldom”?","¿Invertiste auxiliar y sujeto?","¿Suena como una inversión formal correcta?"] },
      { id:'w-avz3-2', prompt:"Escribe una frase formal usando “Should you” en vez de “If you should”.", target:"inversión con Should",
        checkPattern:"^should you [a-z]+", hint:"Estructura esperada: “Should you ___, ...”",
        example:{en:"Should you need help, contact support.", es:"Si necesita ayuda, contacte a soporte."},
        checklist:["¿Empezaste con “Should you”?","¿Es un registro formal?","¿La frase tiene sentido?"] },
      { id:'w-avz3-3', prompt:"Escribe una frase usando “as though” o “as if”.", target:"as though / as if",
        checkPattern:"as (though|if)", hint:"Estructura esperada: “... as though/as if ___.”",
        example:{en:"She acted as if nothing had happened.", es:"Ella actuó como si nada hubiera pasado."},
        checklist:["¿Usaste “as though” o “as if”?","¿El significado sugiere una comparación hipotética?","¿La frase tiene sentido?"] },
      { id:'w-avz3-4', prompt:"Escribe una frase usando un modal de deducción sobre el pasado (“must have”, “can't have”).", target:"modal de deducción",
        checkPattern:"\\b(must have|can't have|couldn't have|might have)\\b", hint:"Estructura esperada: “She/He must have/can't have + participio.”",
        example:{en:"He must have forgotten the meeting.", es:"Debe haberse olvidado de la reunión."},
        checklist:["¿Usaste “must have”, “can't have” o similar?","¿Le sigue un participio pasado?","¿La frase expresa una deducción lógica?"] }
    ]
  ]
};
