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

const LEVELS = ['principiante', 'facil', 'medio', 'avanzado'];
const LEVEL_META = {
  principiante: { label: 'Principiante', range: 'A0',    audioFolder: 'a0', desc: 'Lo más básico: saludos, números, colores y palabras simples.' },
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
  principiante: [
    [
      {
        topic: 'Los números (1-10)',
        items: [
          { id:'g-principiante-num-1', translation:"¿Cómo se dice \"3\" en inglés?", type:'choice', prompt:"How do you say \"3\" in English?",
            options:["Three","Seven","Nine"], correct:0,
            explain:"“Three” es el número 3.",
            examples:[
              {en:"I have three brothers.", es:"Tengo tres hermanos."},
              {en:"She has three cats.", es:"Ella tiene tres gatos."}
            ]},
          { id:'g-principiante-num-2', translation:"Tengo dos manzanas.", type:'fill', sentence:["I","have","___","apples","."], blankIndex:2,
            bank:["two","twenty","second"], correct:"two",
            explain:"“Two” es el número 2.",
            examples:[
              {en:"I have two dogs.", es:"Tengo dos perros."},
              {en:"She has two books.", es:"Ella tiene dos libros."}
            ]},
          { id:'g-principiante-num-3', translation:"Ella tiene cinco libros. ¿Cuántos libros tiene ella?", type:'choice', prompt:"She has five books. How many books does she have?",
            options:["Five","Four","Nine"], correct:0,
            explain:"“Five” es el número 5.",
            examples:[
              {en:"He has five pencils.", es:"Él tiene cinco lapices."},
              {en:"We have five chairs.", es:"Tenemos cinco sillas."}
            ]},
          { id:'g-principiante-num-4', translation:"Tengo tres gatos.", type:'error', wrong:"I have three cat.", wrongWord:"cat",
            right:"I have three cats.", rightWord:"cats",
            explain:"Cuando hay más de uno, la palabra lleva “-s” al final.",
            examples:[
              {en:"I have three cats.", es:"Tengo tres gatos."},
              {en:"She has two dogs.", es:"Ella tiene dos perros."}
            ]}
        ]
      },
      {
        topic: 'Plural: agregar "-s"',
        items: [
          { id:'g-principiante-plural-1', translation:"Un perro, dos perros.", type:'choice', prompt:"One dog, two ___.",
            options:["dogs","dog","doges"], correct:0,
            explain:"Para más de uno, agregamos “-s” a la palabra.",
            examples:[
              {en:"I have two dogs.", es:"Tengo dos perros."},
              {en:"They have three cats.", es:"Ellos tienen tres gatos."}
            ]},
          { id:'g-principiante-plural-2', translation:"Tengo dos gatos.", type:'fill', sentence:["I","have","two","___","."], blankIndex:3,
            bank:["cats","cat","cates"], correct:"cats",
            explain:"“Cats” es el plural de “cat” (gato).",
            examples:[
              {en:"I have two cats.", es:"Tengo dos gatos."},
              {en:"She has two books.", es:"Ella tiene dos libros."}
            ]},
          { id:'g-principiante-plural-3', translation:"¿Cómo se dice más de un \"libro\"?", type:'choice', prompt:"How do you say more than one \"book\"?",
            options:["Books","Bookes","Boo"], correct:0,
            explain:"El plural de “book” es “books”, solo se agrega “-s”.",
            examples:[
              {en:"I have five books.", es:"Tengo cinco libros."},
              {en:"The books are on the table.", es:"Los libros están en la mesa."}
            ]},
          { id:'g-principiante-plural-4', translation:"Ella tiene tres hermanas.", type:'error', wrong:"She has three sister.", wrongWord:"sister",
            right:"She has three sisters.", rightWord:"sisters",
            explain:"Con más de una persona o cosa, agregamos “-s”.",
            examples:[
              {en:"She has three sisters.", es:"Ella tiene tres hermanas."},
              {en:"I have two brothers.", es:"Tengo dos hermanos."}
            ]}
        ]
      },
      {
        topic: '"This is..." (esto es...)',
        items: [
          { id:'g-principiante-this-1', translation:"(Estás señalando una manzana) Esto es una manzana.", type:'choice', prompt:"(You are pointing at one apple) ___ is an apple.",
            options:["This","These","They"], correct:0,
            explain:"Usamos “this” para senalar UNA sola cosa cerca de ti.",
            examples:[
              {en:"This is an apple.", es:"Esto es una manzana."},
              {en:"This is my book.", es:"Este es mi libro."}
            ]},
          { id:'g-principiante-this-2', translation:"Este es mi libro.", type:'fill', sentence:["___","is","my","book","."], blankIndex:0,
            bank:["This","These","They"], correct:"This",
            explain:"“This” se usa para una sola cosa cerca de ti.",
            examples:[
              {en:"This is my house.", es:"Esta es mi casa."},
              {en:"This is my friend.", es:"Este es mi amigo."}
            ]},
          { id:'g-principiante-this-3', translation:"¿Qué dices cuando muestras UNA cosa?", type:'choice', prompt:"What do you say when you show ONE thing?",
            options:["This is...","These are...","They is..."], correct:0,
            explain:"“This is...” se usa para presentar una sola cosa o persona.",
            examples:[
              {en:"This is my mother.", es:"Esta es mi mama."},
              {en:"This is a cat.", es:"Esto es un gato."}
            ]},
          { id:'g-principiante-this-4', translation:"Estas son mis llaves.", type:'error', wrong:"This is my keys.", wrongWord:"This",
            right:"These are my keys.", rightWord:"These",
            explain:"Usamos “these” cuando hablamos de más de una cosa (las llaves son varias).",
            examples:[
              {en:"These are my keys.", es:"Estas son mis llaves."},
              {en:"These are my books.", es:"Estos son mis libros."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Los colores',
        items: [
          { id:'g-principiante2-color-1', translation:"¿De qué color es el cielo?", type:'choice', prompt:"What color is the sky?",
            options:["Blue","Red","Green"], correct:0,
            explain:"El cielo normalmente es “blue” (azul).",
            examples:[
              {en:"The sky is blue.", es:"El cielo es azul."},
              {en:"My shirt is blue.", es:"Mi camisa es azul."}
            ]},
          { id:'g-principiante2-color-2', translation:"La manzana es roja.", type:'fill', sentence:["The","apple","is","___","."], blankIndex:3,
            bank:["red","seven","house"], correct:"red",
            explain:"Las manzanas normalmente son “red” (rojas).",
            examples:[
              {en:"The apple is red.", es:"La manzana es roja."},
              {en:"Her dress is red.", es:"Su vestido es rojo."}
            ]},
          { id:'g-principiante2-color-3', translation:"¿Cómo se dice \"amarillo\" en inglés?", type:'choice', prompt:"How do you say \"amarillo\" in English?",
            options:["Yellow","Purple","Brown"], correct:0,
            explain:"“Yellow” significa amarillo.",
            examples:[
              {en:"The banana is yellow.", es:"El plátano es amarillo."},
              {en:"I like your yellow hat.", es:"Me gusta tu sombrero amarillo."}
            ]},
          { id:'g-principiante2-color-4', translation:"El pasto es verde.", type:'error', wrong:"The grass is blue.", wrongWord:"blue",
            right:"The grass is green.", rightWord:"green",
            explain:"El pasto normalmente es “green” (verde), no azul.",
            examples:[
              {en:"The grass is green.", es:"El pasto es verde."},
              {en:"The leaves are green.", es:"Las hojas son verdes."}
            ]}
        ]
      },
      {
        topic: 'Preguntas simples: "What is this?"',
        items: [
          { id:'g-principiante2-what-1', translation:"Alguien señala un libro y pregunta \"¿Qué es esto?\" ¿Qué respondes?", type:'choice', prompt:"Someone points at a book and asks \"What is this?\" What do you answer?",
            options:["It's a book.","It's a books.","It is book."], correct:0,
            explain:"La respuesta correcta es “It's a ___” con una sola cosa.",
            examples:[
              {en:"It's a book.", es:"Es un libro."},
              {en:"It's a cat.", es:"Es un gato."}
            ]},
          { id:'g-principiante2-what-2', translation:"¿Qué es esto?", type:'fill', sentence:["What","is","___","?"], blankIndex:2,
            bank:["this","these","they"], correct:"this",
            explain:"Para preguntar por UNA cosa cerca de ti, usamos “this”.",
            examples:[
              {en:"What is this?", es:"¿Qué es esto?"},
              {en:"This is a pen.", es:"Esto es un lapicero."}
            ]},
          { id:'g-principiante2-what-3', translation:"¿Cómo preguntas sobre UN objeto frente a ti?", type:'choice', prompt:"How do you ask about ONE object in front of you?",
            options:["What is this?","What is these?","What is they?"], correct:0,
            explain:"“What is this?” se usa para preguntar por una sola cosa.",
            examples:[
              {en:"What is this?", es:"¿Qué es esto?"},
              {en:"It's a table.", es:"Es una mesa."}
            ]},
          { id:'g-principiante2-what-4', translation:"¿Qué es esto?", type:'error', wrong:"What is these?", wrongWord:"these",
            right:"What is this?", rightWord:"this",
            explain:"Para una sola cosa usamos “this”, no “these”.",
            examples:[
              {en:"What is this?", es:"¿Qué es esto?"},
              {en:"This is my phone.", es:"Este es mi telefono."}
            ]}
        ]
      },
      {
        topic: 'Yes / No básico',
        items: [
          { id:'g-principiante2-yn-1', translation:"¿Es esto un gato? Respuesta: Sí, lo es.", type:'choice', prompt:"Is this a cat? Answer: ___, it is.",
            options:["Yes","No","Not"], correct:0,
            explain:"“Yes, it is” se usa para responder que si.",
            examples:[
              {en:"Yes, it is.", es:"Si, lo es."},
              {en:"Is this a dog? Yes, it is.", es:"¿Es esto un perro? Si, lo es."}
            ]},
          { id:'g-principiante2-yn-2', translation:"Sí, lo es.", type:'fill', sentence:["Yes",",","it","___","."], blankIndex:3,
            bank:["is","isn't","are"], correct:"is",
            explain:"Para responder “si” a una pregunta con “is”, contestamos “it is”.",
            examples:[
              {en:"Is this a book? Yes, it is.", es:"¿Es esto un libro? Si, lo es."},
              {en:"Is this your bag? Yes, it is.", es:"¿Es esta tu bolsa? Si, lo es."}
            ]},
          { id:'g-principiante2-yn-3', translation:"¿Es esto un perro? (No, es un gato) Respuesta: No, no lo es.", type:'choice', prompt:"Is this a dog? (No, it's a cat) Answer: ___",
            options:["No, it isn't.","Yes, it is.","No, it is."], correct:0,
            explain:"“No, it isn't” se usa para responder que no.",
            examples:[
              {en:"No, it isn't.", es:"No, no lo es."},
              {en:"Is this a cat? No, it isn't.", es:"¿Es esto un gato? No, no lo es."}
            ]},
          { id:'g-principiante2-yn-4', translation:"Sí, lo es.", type:'error', wrong:"Yes, it not.", wrongWord:"not",
            right:"Yes, it is.", rightWord:"is",
            explain:"Para responder “si”, decimos “it is”, no “it not”.",
            examples:[
              {en:"Yes, it is.", es:"Si, lo es."},
              {en:"Is this a pen? Yes, it is.", es:"¿Es esto un lapicero? Si, lo es."}
            ]}
        ]
      }
    ]
  ,

    [
      {
        topic: 'Los días de la semana',
        items: [
          { id:'g-principiante3-days-1', translation:"¿Cómo se dice \"lunes\" en inglés?", type:'choice', prompt:"How do you say \"lunes\" in English?",
            options:["Monday","Sunday","Friday"], correct:0,
            explain:"“Monday” es lunes.",
            examples:[
              {en:"I go to school on Monday.", es:"Voy a la escuela el lunes."},
              {en:"Monday is the first day of the week.", es:"El lunes es el primer día de la semana."}
            ]},
          { id:'g-principiante3-days-2', translation:"Hoy es sábado.", type:'fill', sentence:["Today","is","___","."], blankIndex:2,
            bank:["Saturday","Sunday","Monday"], correct:"Saturday",
            explain:"“Saturday” es sábado.",
            examples:[
              {en:"Today is Saturday.", es:"Hoy es sábado."},
              {en:"We rest on Saturday.", es:"Descansamos el sábado."}
            ]},
          { id:'g-principiante3-days-3', translation:"¿Qué día es después del viernes?", type:'choice', prompt:"What day comes after Friday?",
            options:["Saturday","Sunday","Thursday"], correct:0,
            explain:"Después de “Friday” viene “Saturday”.",
            examples:[
              {en:"Saturday comes after Friday.", es:"El sábado viene después del viernes."},
              {en:"We have no school on Saturday.", es:"No hay escuela el sábado."}
            ]},
          { id:'g-principiante3-days-4', translation:"Hoy es domingo.", type:'error', wrong:"Today am Sunday.", wrongWord:"am",
            right:"Today is Sunday.", rightWord:"is",
            explain:"Con “today” usamos “is”, no “am”.",
            examples:[
              {en:"Today is Sunday.", es:"Hoy es domingo."},
              {en:"On Sunday, I visit my grandma.", es:"El domingo, visito a mi abuela."}
            ]}
        ]
      },
      {
        topic: 'Adjetivos posesivos simples (my / your)',
        items: [
          { id:'g-principiante3-poss-1', translation:"¿Cómo dices \"mi\" en inglés?", type:'choice', prompt:"How do you say \"mi\" (possessive) in English?",
            options:["My","Me","Mine"], correct:0,
            explain:"“My” se usa antes de un sustantivo: “my book”.",
            examples:[
              {en:"This is my book.", es:"Este es mi libro."},
              {en:"My dog is small.", es:"Mi perro es pequeño."}
            ]},
          { id:'g-principiante3-poss-2', translation:"¿Es este tu lápiz?", type:'fill', sentence:["Is","this","___","pencil","?"], blankIndex:2,
            bank:["your","you","yours"], correct:"your",
            explain:"“Your” va antes del sustantivo: “your pencil”.",
            examples:[
              {en:"Is this your pencil?", es:"¿Es este tu lápiz?"},
              {en:"Your bag is red.", es:"Tu bolsa es roja."}
            ]},
          { id:'g-principiante3-poss-3', translation:"Ana señala su propia casa y dice...", type:'choice', prompt:"Ana points at her own house and says ___",
            options:["This is my house.","This is your house.","This is his house."], correct:0,
            explain:"Cuando hablas de algo tuyo, usas “my”.",
            examples:[
              {en:"This is my house.", es:"Esta es mi casa."},
              {en:"My house is small.", es:"Mi casa es pequeña."}
            ]},
          { id:'g-principiante3-poss-4', translation:"Tu perro es grande.", type:'error', wrong:"You dog is big.", wrongWord:"You",
            right:"Your dog is big.", rightWord:"Your",
            explain:"Antes de un sustantivo usamos “your”, no “you”.",
            examples:[
              {en:"Your dog is big.", es:"Tu perro es grande."},
              {en:"Is your dog friendly?", es:"¿Tu perro es amigable?"}
            ]}
        ]
      }
    ]
  ,
  [
 {
  "topic": "Borrow vs Lend (prestar)",
  "items": [
   {
    "id": "g-principiante4-borrowlend-1",
    "translation": "¿Cómo se dice \"pedir prestado\" en inglés?",
    "type": "choice",
    "prompt": "How do you say \"pedir algo prestado\" in English?",
    "options": [
     "Borrow",
     "Lend",
     "Buy"
    ],
    "correct": 0,
    "explain": "“Borrow” es pedir prestado (yo lo recibo). “Lend” es prestar (yo lo doy).",
    "examples": [
     {
      "en": "Can I borrow your pen?",
      "es": "¿Me prestas tu lápiz? (yo lo pido)"
     },
     {
      "en": "I will lend you my book.",
      "es": "Te prestaré mi libro. (yo lo doy)"
     }
    ]
   },
   {
    "id": "g-principiante4-borrowlend-2",
    "translation": "Ella me prestó su bicicleta.",
    "type": "fill",
    "sentence": [
     "She",
     "___",
     "me",
     "her",
     "bike",
     "."
    ],
    "blankIndex": 1,
    "bank": [
     "lent",
     "borrowed",
     "bought"
    ],
    "correct": "lent",
    "explain": "“Lend” (dar prestado) en pasado es “lent”. Ella me lo dio a mí.",
    "examples": [
     {
      "en": "She lent me her bike.",
      "es": "Ella me prestó su bicicleta."
     },
     {
      "en": "I lent him five dollars.",
      "es": "Le presté cinco dólares."
     }
    ]
   },
   {
    "id": "g-principiante4-borrowlend-3",
    "translation": "¿Puedo pedirte prestado tu paraguas?",
    "type": "choice",
    "prompt": "Can I ___ your umbrella?",
    "options": [
     "borrow",
     "lend",
     "sell"
    ],
    "correct": 0,
    "explain": "Cuando yo pido algo para usarlo, uso “borrow”.",
    "examples": [
     {
      "en": "Can I borrow your umbrella?",
      "es": "¿Me prestas tu paraguas?"
     },
     {
      "en": "He borrowed my jacket.",
      "es": "Él me pidió prestada mi chaqueta."
     }
    ]
   },
   {
    "id": "g-principiante4-borrowlend-4",
    "translation": "Yo le presto dinero a mi hermano.",
    "type": "error",
    "wrong": "I borrow money to my brother.",
    "wrongWord": "borrow",
    "right": "I lend money to my brother.",
    "rightWord": "lend",
    "explain": "Cuando YO doy algo a otra persona, es “lend”, no “borrow”.",
    "examples": [
     {
      "en": "I lend money to my brother.",
      "es": "Yo le presto dinero a mi hermano."
     },
     {
      "en": "Banks lend money to people.",
      "es": "Los bancos prestan dinero a las personas."
     }
    ]
   }
  ]
 },
 {
  "topic": "Good vs Well",
  "items": [
   {
    "id": "g-principiante4-goodwell-1",
    "translation": "Ella canta bien.",
    "type": "choice",
    "prompt": "She sings ___.",
    "options": [
     "well",
     "good",
     "goods"
    ],
    "correct": 0,
    "explain": "“Well” describe cómo se hace una acción (verbo + well). “Good” describe una cosa o persona.",
    "examples": [
     {
      "en": "She sings well.",
      "es": "Ella canta bien."
     },
     {
      "en": "She is a good singer.",
      "es": "Ella es una buena cantante."
     }
    ]
   },
   {
    "id": "g-principiante4-goodwell-2",
    "translation": "Es un buen libro.",
    "type": "fill",
    "sentence": [
     "It",
     "is",
     "a",
     "___",
     "book",
     "."
    ],
    "blankIndex": 3,
    "bank": [
     "good",
     "well",
     "goods"
    ],
    "correct": "good",
    "explain": "“Good” va antes de un sustantivo como “book”.",
    "examples": [
     {
      "en": "It is a good book.",
      "es": "Es un buen libro."
     },
     {
      "en": "This is a good idea.",
      "es": "Esta es una buena idea."
     }
    ]
   },
   {
    "id": "g-principiante4-goodwell-3",
    "translation": "¿Cómo estás? Estoy bien, gracias.",
    "type": "choice",
    "prompt": "How are you? I am ___, thanks.",
    "options": [
     "well",
     "good",
     "the good"
    ],
    "correct": 0,
    "explain": "Para hablar de salud o estado, se usa “well” (I am well).",
    "examples": [
     {
      "en": "I am well, thanks.",
      "es": "Estoy bien, gracias."
     },
     {
      "en": "He is not feeling well.",
      "es": "Él no se siente bien."
     }
    ]
   },
   {
    "id": "g-principiante4-goodwell-4",
    "translation": "Él juega bien al fútbol.",
    "type": "error",
    "wrong": "He plays soccer good.",
    "wrongWord": "good",
    "right": "He plays soccer well.",
    "rightWord": "well",
    "explain": "Con un verbo como “plays” se necesita el adverbio “well”, no el adjetivo “good”.",
    "examples": [
     {
      "en": "He plays soccer well.",
      "es": "Él juega bien al fútbol."
     },
     {
      "en": "They work well together.",
      "es": "Ellos trabajan bien juntos."
     }
    ]
   }
  ]
 }
],
    [
      {
        topic: "He / She / It (pronombres)",
        items: [
          { id:'g-principiante6-1',
            translation:"(Hablando de un niño) Él es mi amigo.",
            type:'choice',
            prompt:"(Talking about a boy) ___ is my friend.",
            options:["He","She","It"],
            correct:0,
            explain:"Usamos “he” para hablar de un hombre o niño.",
              examples:[
              {en:"He is my friend.", es:"Él es mi amigo."},
              {en:"He is tall.", es:"Él es alto."}
            ]},
          { id:'g-principiante6-2',
            translation:"(Hablando de una niña) Ella es mi hermana.",
            type:'choice',
            prompt:"(Talking about a girl) ___ is my sister.",
            options:["She","He","It"],
            correct:0,
            explain:"Usamos “she” para hablar de una mujer o niña.",
              examples:[
              {en:"She is my sister.", es:"Ella es mi hermana."},
              {en:"She is happy.", es:"Ella está feliz."}
            ]},
          { id:'g-principiante6-3',
            translation:"(Hablando de un perro) Es grande.",
            type:'choice',
            prompt:"(Talking about a dog) ___ is big.",
            options:["It","He","She"],
            correct:0,
            explain:"Usamos “it” para hablar de animales o cosas.",
              examples:[
              {en:"It is big.", es:"Es grande."},
              {en:"It is my book.", es:"Es mi libro."}
            ]},
          { id:'g-principiante6-4',
            translation:"Ese es mi papá. Él es alto.",
            type:'error',
            wrong:"That is my dad. She is tall.",
            wrongWord:"She",
            right:"That is my dad. He is tall.",
            rightWord:"He",
            explain:"Para un hombre, se usa “he”, no “she”.",
              examples:[
              {en:"That is my dad. He is tall.", es:"Ese es mi papá. Él es alto."},
              {en:"He works with my mom.", es:"Él trabaja con mi mamá."}
            ]}
        ]
      },
      {
        topic: "Is / Are (singular y plural)",
        items: [
          { id:'g-principiante6-5',
            translation:"Ella es mi hermana.",
            type:'choice',
            prompt:"She ___ my sister.",
            options:["is","are","am"],
            correct:0,
            explain:"Usamos “is” con “he/she/it” (una sola persona o cosa).",
              examples:[
              {en:"He is my friend.", es:"Él es mi amigo."},
              {en:"It is a cat.", es:"Es un gato."}
            ]},
          { id:'g-principiante6-6',
            translation:"Ellos están felices.",
            type:'fill',
            sentence:["They","___","happy","."],
            blankIndex:1,
            bank:["are","is","am"],
            correct:"are",
            explain:"Usamos “are” con “they/we/you” (más de una persona).",
              examples:[
              {en:"We are happy.", es:"Estamos felices."},
              {en:"You are kind.", es:"Tú eres amable."}
            ]},
          { id:'g-principiante6-7',
            translation:"Yo soy estudiante.",
            type:'choice',
            prompt:"I ___ a student.",
            options:["am","is","are"],
            correct:0,
            explain:"Con “I” siempre usamos “am”.",
              examples:[
              {en:"I am a teacher.", es:"Soy profesor."},
              {en:"I am happy.", es:"Estoy feliz."}
            ]},
          { id:'g-principiante6-8',
            translation:"Ella es mi mamá.",
            type:'error',
            wrong:"She are my mom.",
            wrongWord:"are",
            right:"She is my mom.",
            rightWord:"is",
            explain:"Con “she” usamos “is”, no “are”.",
              examples:[
              {en:"She is my mom.", es:"Ella es mi mamá."},
              {en:"He is my dad.", es:"Él es mi papá."}
            ]}
        ]
      },
      {
        topic: "His / Her (posesivos simples)",
        items: [
          { id:'g-principiante6-9',
            translation:"(Hablando de un niño) Ese es su libro (de él).",
            type:'choice',
            prompt:"(Talking about a boy) That is ___ book.",
            options:["his","her","its"],
            correct:0,
            explain:"“His” se usa para cosas de un hombre o niño.",
              examples:[
              {en:"That is his book.", es:"Ese es su libro (de él)."},
              {en:"His name is Tom.", es:"Su nombre es Tom."}
            ]},
          { id:'g-principiante6-10',
            translation:"(Hablando de una niña) Esa es su bolsa (de ella).",
            type:'choice',
            prompt:"(Talking about a girl) That is ___ bag.",
            options:["her","his","their"],
            correct:0,
            explain:"“Her” se usa para cosas de una mujer o niña.",
              examples:[
              {en:"That is her bag.", es:"Esa es su bolsa (de ella)."},
              {en:"Her name is Ana.", es:"Su nombre es Ana."}
            ]}
        ]
      }
    ]
  ],
  facil: [
    [
      {
        topic: 'Presente simple y "to be"',
        items: [
          { id:'g-facil-tobe-1', translation:"¿Qué hora es?", type:'choice', prompt:"What time is it?",
            options:["It nine o'clock.","It is nine o'clock.","It are nine o'clock."], correct:1,
            explain:"Usamos “it is” (o “it's”) para hablar de la hora.",
            examples:[
              {en:"It is nine o'clock.", es:"Son las nueve."},
              {en:"It is Monday today.", es:"Hoy es lunes."}
            ]},
          { id:'g-facil-tobe-2', translation:"El gato está sobre la mesa.", type:'fill', sentence:["The","cat","___","on","the","table","."], blankIndex:2,
            bank:["is","are","am"], correct:"is",
            explain:"“Cat” es singular, así que va con “is”.",
            examples:[
              {en:"The dog is in the garden.", es:"El perro está en el jardín."},
              {en:"My parents are at home.", es:"Mis padres están en casa."}
            ]},
          { id:'g-facil-tobe-3', translation:"Ella es maestra.", type:'choice', prompt:"She ___ a teacher.",
            options:["is","are","am"], correct:0,
            explain:"Con “she” (ella) siempre usamos “is”.",
            examples:[
              {en:"He is a doctor.", es:"Él es doctor."},
              {en:"They are students.", es:"Ellos son estudiantes."}
            ]},
          { id:'g-facil-tobe-4', translation:"Las llaves están en mi bolso.", type:'error', wrong:"The keys are on my bag.", wrongWord:"on",
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
          { id:'g-facil-there-1', translation:"Hay un gato en el techo.", type:'choice', prompt:"___ is a cat on the roof.",
            options:["Their","There","They're"], correct:1,
            explain:"“There is / there are” se usa para decir que algo existe.",
            examples:[
              {en:"There is a book on the table.", es:"Hay un libro en la mesa."},
              {en:"There are two cars outside.", es:"Hay dos carros afuera."}
            ]},
          { id:'g-facil-there-2', translation:"Su casa es muy grande.", type:'choice', prompt:"___ house is very big.",
            options:["There","Their","They're"], correct:1,
            explain:"“Their” indica posesión: de ellos.",
            examples:[
              {en:"Their dog is friendly.", es:"El perro de ellos es amigable."},
              {en:"That is their car.", es:"Ese es el carro de ellos."}
            ]},
          { id:'g-facil-there-3', translation:"Ellos van a ir a la playa mañana.", type:'choice', prompt:"___ going to the beach tomorrow.",
            options:["There","Their","They're"], correct:2,
            explain:"“They're” es la contracción de “they are”.",
            examples:[
              {en:"They're my best friends.", es:"Ellos son mis mejores amigos."},
              {en:"They're studying English.", es:"Ellos están estudiando inglés."}
            ]},
          { id:'g-facil-there-4', translation:"Hay mucha gente aquí.", type:'fill', sentence:["___","are","many","people","here","."], blankIndex:0,
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
          { id:'g-facil-art-1', translation:"Vi un elefante en el zoológico.", type:'choice', prompt:"I saw ___ elephant at the zoo.",
            options:["a","an","some"], correct:1,
            explain:"Usamos “an” antes de sonido de vocal, como “elephant”.",
            examples:[
              {en:"I saw an elephant.", es:"Vi un elefante."},
              {en:"She has a dog.", es:"Ella tiene un perro."}
            ]},
          { id:'g-facil-art-2', translation:"Ella es enfermera.", type:'fill', sentence:["She","is","___","nurse","."], blankIndex:2,
            bank:["a","an","some"], correct:"a",
            explain:"“Nurse” empieza con sonido de consonante, así que usamos “a”.",
            examples:[
              {en:"He is a teacher.", es:"Él es maestro."},
              {en:"It's an apple.", es:"Es una manzana."}
            ]},
          { id:'g-facil-art-3', translation:"Eso es un paraguas.", type:'choice', prompt:"That is ___ umbrella.",
            options:["a","an","the"], correct:1,
            explain:"“Umbrella” empieza con sonido de vocal, entonces usamos “an”.",
            examples:[
              {en:"That is an umbrella.", es:"Esa es una sombrilla."},
              {en:"This is a book.", es:"Este es un libro."}
            ]},
          { id:'g-facil-art-4', translation:"Necesito una hora para terminar.", type:'error', wrong:"I need a hour to finish.", wrongWord:"a",
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
          { id:'g-facil-prep-1', translation:"Las llaves están sobre la mesa.", type:'choice', prompt:"The keys are ___ the table.",
            options:["in","on","at"], correct:1,
            explain:"Usamos “on” para superficies, como una mesa.",
            examples:[
              {en:"The keys are on the table.", es:"Las llaves están en la mesa."},
              {en:"There's a picture on the wall.", es:"Hay un cuadro en la pared."}
            ]},
          { id:'g-facil-prep-2', translation:"Vivo en Bogotá.", type:'fill', sentence:["I","live","___","Bogotá","."], blankIndex:2,
            bank:["in","on","at"], correct:"in",
            explain:"Usamos “in” para ciudades y países.",
            examples:[
              {en:"I live in Bogotá.", es:"Vivo en Bogotá."},
              {en:"She was born in Peru.", es:"Ella nació en Perú."}
            ]},
          { id:'g-facil-prep-3', translation:"Nos encontraremos a las 5.", type:'choice', prompt:"We'll meet ___ 5 o'clock.",
            options:["in","on","at"], correct:2,
            explain:"Usamos “at” para horas exactas.",
            examples:[
              {en:"We'll meet at 5 o'clock.", es:"Nos veremos a las cinco."},
              {en:"The class starts at nine.", es:"La clase empieza a las nueve."}
            ]},
          { id:'g-facil-prep-4', translation:"Mi cumpleaños es el lunes.", type:'error', wrong:"My birthday is in Monday.", wrongWord:"in",
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
          { id:'g-facil-some-1', translation:"No tengo nada de dinero.", type:'choice', prompt:"I don't have ___ money.",
            options:["some","any","much"], correct:1,
            explain:"En negaciones usamos “any”, no “some”.",
            examples:[
              {en:"I don't have any money.", es:"No tengo nada de dinero."},
              {en:"There isn't any milk.", es:"No hay nada de leche."}
            ]},
          { id:'g-facil-some-2', translation:"¿Me puedes dar un poco de agua?", type:'fill', sentence:["Can","I","have","___","water","?"], blankIndex:3,
            bank:["some","any","many"], correct:"some",
            explain:"En ofrecimientos y peticiones usamos “some”, aunque sea una pregunta.",
            examples:[
              {en:"Can I have some water?", es:"¿Me das un poco de agua?"},
              {en:"Would you like some coffee?", es:"¿Quieres café?"}
            ]},
          { id:'g-facil-some-3', translation:"¿Tienes alguna pregunta?", type:'choice', prompt:"Do you have ___ questions?",
            options:["some","any","much"], correct:1,
            explain:"En preguntas normales usamos “any”.",
            examples:[
              {en:"Do you have any questions?", es:"¿Tienes alguna pregunta?"},
              {en:"Is there any bread left?", es:"¿Queda algo de pan?"}
            ]},
          { id:'g-facil-some-4', translation:"No queda nada de azúcar.", type:'error', wrong:"There isn't some sugar left.", wrongWord:"some",
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
          { id:'g-facil-this-1', translation:"Estos zapatos son nuevos (están aquí).", type:'choice', prompt:"___ shoes are new (they're right here).",
            options:["This","These","That"], correct:1,
            explain:"Para plural + cerca usamos “these”.",
            examples:[
              {en:"These shoes are new.", es:"Estos zapatos son nuevos."},
              {en:"This book is mine.", es:"Este libro es mío."}
            ]},
          { id:'g-facil-this-2', translation:"Esa casa de allá es grande.", type:'fill', sentence:["___","house","over","there","is","big","."], blankIndex:0,
            bank:["This","That","These"], correct:"That",
            explain:"Para singular + lejos usamos “that”.",
            examples:[
              {en:"That house over there is big.", es:"Esa casa de allá es grande."},
              {en:"Those cars are expensive.", es:"Esos carros son caros."}
            ]},
          { id:'g-facil-this-3', translation:"Mira esos pájaros allá arriba (lejos).", type:'choice', prompt:"Look at ___ birds up there (far away).",
            options:["this","these","those"], correct:2,
            explain:"Para plural + lejos usamos “those”.",
            examples:[
              {en:"Look at those birds.", es:"Mira esos pájaros."},
              {en:"These flowers smell nice.", es:"Estas flores huelen bien."}
            ]},
          { id:'g-facil-this-4', translation:"Estos zapatos son muy pequeños.", type:'error', wrong:"This shoes are too small.", wrongWord:"This",
            right:"These shoes are too small.", rightWord:"These",
            explain:"“Shoes” es plural, entonces necesitamos “these”, no “this”.",
            examples:[
              {en:"These shoes are too small.", es:"Estos zapatos son muy pequeños."},
              {en:"This shirt is too big.", es:"Esta camisa es muy grande."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Question words (What / Where / When / Who)',
        items: [
          { id:'g-facil4-qw-1', translation:"¿Cómo te llamas?", type:'choice', prompt:"___ is your name?",
            options:["What","Where","Who"], correct:0,
            explain:"Usamos “what” para preguntar por una cosa o información, como el nombre.",
            examples:[
              {en:"What is your name?", es:"¿Cuál es tu nombre?"},
              {en:"What is your favorite color?", es:"¿Cuál es tu color favorito?"}
            ]},
          { id:'g-facil4-qw-2', translation:"¿Dónde vives?", type:'fill', sentence:["___","do","you","live","?"], blankIndex:0,
            bank:["Where","What","Who"], correct:"Where",
            explain:"“Where” se usa para preguntar por un lugar.",
            examples:[
              {en:"Where do you live?", es:"¿Dónde vives?"},
              {en:"Where is the bathroom?", es:"¿Dónde está el baño?"}
            ]},
          { id:'g-facil4-qw-3', translation:"¿Cuándo es tu cumpleaños?", type:'choice', prompt:"___ is your birthday?",
            options:["When","Who","What"], correct:0,
            explain:"“When” se usa para preguntar por el momento o la fecha.",
            examples:[
              {en:"When is your birthday?", es:"¿Cuándo es tu cumpleaños?"},
              {en:"When does the movie start?", es:"¿Cuándo empieza la película?"}
            ]},
          { id:'g-facil4-qw-4', translation:"¿Dónde está el baño?", type:'error', wrong:"Were is the bathroom?", wrongWord:"Were",
            right:"Where is the bathroom?", rightWord:"Where",
            explain:"“Were” (pasado de “to be”) y “where” (dónde) suenan parecido pero significan cosas distintas.",
            examples:[
              {en:"Where is the bathroom?", es:"¿Dónde está el baño?"},
              {en:"They were at home yesterday.", es:"Ellos estaban en casa ayer."}
            ]}
        ]
      },
      {
        topic: 'Adverbios de frecuencia (always / usually / sometimes / never)',
        items: [
          { id:'g-facil4-freq-1', translation:"Siempre tomo café en la mañana.", type:'choice', prompt:"I ___ drink coffee in the morning.",
            options:["always","never","yesterday"], correct:0,
            explain:"Los adverbios de frecuencia como “always” van antes del verbo principal.",
            examples:[
              {en:"I always drink coffee in the morning.", es:"Siempre tomo café en la mañana."},
              {en:"She always arrives on time.", es:"Ella siempre llega a tiempo."}
            ]},
          { id:'g-facil4-freq-2', translation:"Ella siempre llega tarde.", type:'fill', sentence:["She","is","___","late","."], blankIndex:2,
            bank:["always","yesterday","tomorrow"], correct:"always",
            explain:"Con el verbo “to be”, el adverbio de frecuencia va después: “is always”.",
            examples:[
              {en:"She is always late.", es:"Ella siempre llega tarde."},
              {en:"He is never hungry in the morning.", es:"Él nunca tiene hambre en la mañana."}
            ]},
          { id:'g-facil4-freq-3', translation:"Normalmente vamos a la playa en verano.", type:'choice', prompt:"We ___ go to the beach in summer.",
            options:["usually","yesterday","tomorrow"], correct:0,
            explain:"“Usually” describe algo habitual; “yesterday” y “tomorrow” son momentos específicos, no frecuencia.",
            examples:[
              {en:"We usually go to the beach in summer.", es:"Normalmente vamos a la playa en verano."},
              {en:"They usually eat dinner at eight.", es:"Ellos normalmente cenan a las ocho."}
            ]},
          { id:'g-facil4-freq-4', translation:"Ella nunca llega tarde.", type:'error', wrong:"She never is late.", wrongWord:"never is",
            right:"She is never late.", rightWord:"is never",
            explain:"Con “to be”, el orden correcto es verbo + adverbio: “is never”, no “never is”.",
            examples:[
              {en:"She is never late.", es:"Ella nunca llega tarde."},
              {en:"He is sometimes tired after work.", es:"Él a veces está cansado después del trabajo."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Can / Can\'t (habilidad)',
        items: [
          { id:'g-facil5-can-1', translation:"¿Sabes nadar?", type:'choice', prompt:"___ you swim?",
            options:["Can","Do","Are"], correct:0,
            explain:"Usamos “can” para preguntar sobre habilidad, no “do” ni “are”.",
            examples:[
              {en:"Can you swim?", es:"¿Sabes nadar?"},
              {en:"I can ride a bike.", es:"Sé andar en bicicleta."}
            ]},
          { id:'g-facil5-can-2', translation:"Ella sabe tocar el piano.", type:'fill', sentence:["She","___","play","the","piano","."], blankIndex:1,
            bank:["can","cans","canning"], correct:"can",
            explain:"“Can” no cambia con la persona: siempre “can”, nunca “cans”.",
            examples:[
              {en:"She can play the piano.", es:"Ella sabe tocar el piano."},
              {en:"They can speak French.", es:"Ellos saben hablar francés."}
            ]},
          { id:'g-facil5-can-3', translation:"Él todavía no puede manejar, solo tiene 15 años.", type:'choice', prompt:"He ___ drive yet, he's only 15.",
            options:["can't","doesn't can","not can"], correct:0,
            explain:"La forma negativa de “can” es “can't” (o “cannot”), no “doesn't can”.",
            examples:[
              {en:"He can't drive yet.", es:"Él todavía no sabe manejar."},
              {en:"We can't come tonight.", es:"No podemos ir esta noche."}
            ]},
          { id:'g-facil5-can-4', translation:"Ella canta muy bien.", type:'error', wrong:"She can to sing very well.", wrongWord:"to",
            right:"She can sing very well.", rightWord:"",
            explain:"Después de “can” va el verbo base sin “to”: sobra la palabra “to”.",
            examples:[
              {en:"She can sing very well.", es:"Ella canta muy bien."},
              {en:"He can cook Italian food.", es:"Él sabe cocinar comida italiana."}
            ]}
        ]
      },
      {
        topic: 'Posesivos (my / your / his / her / our / their)',
        items: [
          { id:'g-facil5-poss-1', translation:"Esta es Ana. Su carro es rojo.", type:'choice', prompt:"This is Ana. ___ car is red.",
            options:["Her","His","Their"], correct:0,
            explain:"Ana es mujer, así que usamos “her”.",
            examples:[
              {en:"This is Ana. Her car is red.", es:"Esta es Ana. Su carro es rojo."},
              {en:"Her house is near the park.", es:"Su casa está cerca del parque."}
            ]},
          { id:'g-facil5-poss-2', translation:"Nos encanta nuestra casa nueva.", type:'fill', sentence:["We","love","___","new","house","."], blankIndex:2,
            bank:["our","us","we"], correct:"our",
            explain:"“Our” es el posesivo de “we”.",
            examples:[
              {en:"We love our new house.", es:"Amamos nuestra casa nueva."},
              {en:"Our team won the game.", es:"Nuestro equipo ganó el juego."}
            ]},
          { id:'g-facil5-poss-3', translation:"Ese es el perro de Tom y Lisa. Es su perro.", type:'choice', prompt:"That is Tom and Lisa's dog. It's ___ dog.",
            options:["their","his","your"], correct:0,
            explain:"Tom y Lisa son varias personas, así que usamos “their”.",
            examples:[
              {en:"It's their dog.", es:"Es el perro de ellos."},
              {en:"Their kids go to my school.", es:"Sus hijos van a mi escuela."}
            ]},
          { id:'g-facil5-poss-4', translation:"A él le encanta su trabajo.", type:'error', wrong:"He loves he's job.", wrongWord:"he's",
            right:"He loves his job.", rightWord:"his",
            explain:"“His” es el posesivo; “he's” significa “he is” o “he has”.",
            examples:[
              {en:"He loves his job.", es:"A él le encanta su trabajo."},
              {en:"His car is new.", es:"Su carro es nuevo."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Presente continuo (I am ___ing)',
        items: [
          { id:'g-facil6-cont-1', translation:"¡Mira! Está lloviendo afuera.", type:'choice', prompt:"Look! It ___ outside.",
            options:["is raining","rains","rain"], correct:0,
            explain:"Para acciones que pasan ahora mismo usamos presente continuo: “is raining”.",
            examples:[
              {en:"Look! It is raining outside.", es:"¡Mira! Está lloviendo afuera."},
              {en:"She is watching TV right now.", es:"Ella está viendo tele ahora mismo."}
            ]},
          { id:'g-facil6-cont-2', translation:"Ellos están cocinando la cena en este momento.", type:'fill', sentence:["They","___","dinner","right","now","."], blankIndex:1,
            bank:["are cooking","cooks","cook"], correct:"are cooking",
            explain:"“They” + “are” + verbo-ing para acción en progreso.",
            examples:[
              {en:"They are cooking dinner right now.", es:"Están cocinando la cena ahora mismo."},
              {en:"We are waiting for the bus.", es:"Estamos esperando el autobús."}
            ]},
          { id:'g-facil6-cont-3', translation:"Estoy leyendo un libro en este momento.", type:'choice', prompt:"I ___ a book at the moment.",
            options:["am reading","read","reads"], correct:0,
            explain:"“At the moment” indica que la acción ocurre ahora: presente continuo.",
            examples:[
              {en:"I am reading a book at the moment.", es:"Estoy leyendo un libro en este momento."},
              {en:"He is working at the moment.", es:"Él está trabajando en este momento."}
            ]},
          { id:'g-facil6-cont-4', translation:"Ella está estudiando inglés ahora.", type:'error', wrong:"She is study English now.", wrongWord:"study",
            right:"She is studying English now.", rightWord:"studying",
            explain:"Después de “is/am/are” el verbo lleva “-ing”.",
            examples:[
              {en:"She is studying English now.", es:"Ella está estudiando inglés ahora."},
              {en:"We are learning to cook.", es:"Estamos aprendiendo a cocinar."}
            ]}
        ]
      },
      {
        topic: 'Comparativos (-er / more ... than)',
        items: [
          { id:'g-facil6-comp-1', translation:"Este libro es más interesante que ese.", type:'choice', prompt:"This book is ___ than that one.",
            options:["interesting","more interesting","most interesting"], correct:1,
            explain:"Con adjetivos largos usamos “more + adjetivo” para comparar.",
            examples:[
              {en:"This book is more interesting than that one.", es:"Este libro es más interesante que ese."},
              {en:"This movie is more exciting than the last one.", es:"Esta película es más emocionante que la anterior."}
            ]},
          { id:'g-facil6-comp-2', translation:"Mi hermano es más alto que yo.", type:'fill', sentence:["My","brother","is","___","than","me","."], blankIndex:3,
            bank:["taller","tall","tallest"], correct:"taller",
            explain:"Con adjetivos cortos agregamos “-er” para comparar: tall → taller.",
            examples:[
              {en:"My brother is taller than me.", es:"Mi hermano es más alto que yo."},
              {en:"This road is shorter than that one.", es:"Este camino es más corto que ese."}
            ]},
          { id:'g-facil6-comp-3', translation:"Este ejercicio es más fácil que el anterior.", type:'choice', prompt:"This exercise is ___ than the last one.",
            options:["easyer","more easy","easier"], correct:2,
            explain:"“Easy” cambia la “y” por “i” y agrega “-er”: easier.",
            examples:[
              {en:"This exercise is easier than the last one.", es:"Este ejercicio es más fácil que el anterior."},
              {en:"This test was easier than I expected.", es:"Este examen fue más fácil de lo que esperaba."}
            ]},
          { id:'g-facil6-comp-4', translation:"Este carro es más rápido que el mío.", type:'error', wrong:"This car is more fast than mine.", wrongWord:"more fast",
            right:"This car is faster than mine.", rightWord:"faster",
            explain:"“Fast” es una palabra corta, así que usa “-er” (faster), no “more fast”.",
            examples:[
              {en:"This car is faster than mine.", es:"Este carro es más rápido que el mío."},
              {en:"She runs faster than her brother.", es:"Ella corre más rápido que su hermano."}
            ]}
        ]
      }
    ]
  ,

    [
      {
        topic: 'Pasado simple con verbos regulares (-ed)',
        items: [
          { id:'g-facil7-ed-1', translation:"¿Cómo se dice \"trabajé\" (ayer) en inglés?", type:'choice', prompt:"How do you say \"trabajé\" (yesterday) in English?",
            options:["Worked","Work","Working"], correct:0,
            explain:"El pasado simple regular se forma agregando “-ed”: work → worked.",
            examples:[
              {en:"I worked yesterday.", es:"Trabajé ayer."},
              {en:"She worked last week.", es:"Ella trabajó la semana pasada."}
            ]},
          { id:'g-facil7-ed-2', translation:"Ella limpió la cocina anoche.", type:'fill', sentence:["She","___","the","kitchen","last","night","."], blankIndex:1,
            bank:["cleaned","cleans","clean"], correct:"cleaned",
            explain:"“Clean” en pasado regular es “cleaned”.",
            examples:[
              {en:"She cleaned the kitchen last night.", es:"Ella limpió la cocina anoche."},
              {en:"We cleaned the house on Sunday.", es:"Limpiamos la casa el domingo."}
            ]},
          { id:'g-facil7-ed-3', translation:"¿Cuál oración está en pasado correctamente?", type:'choice', prompt:"Which sentence is correctly in the past tense?",
            options:["We watched a movie last night.","We watch a movie last night.","We watching a movie last night."], correct:0,
            explain:"“Watched” es el pasado regular de “watch”.",
            examples:[
              {en:"We watched a movie last night.", es:"Vimos una película anoche."},
              {en:"They watched TV all afternoon.", es:"Vieron televisión toda la tarde."}
            ]},
          { id:'g-facil7-ed-4', translation:"Ella llamó a su mamá ayer.", type:'error', wrong:"She call her mom yesterday.", wrongWord:"call",
            right:"She called her mom yesterday.", rightWord:"called",
            explain:"En pasado simple regular, “call” se convierte en “called”.",
            examples:[
              {en:"She called her mom yesterday.", es:"Ella llamó a su mamá ayer."},
              {en:"I called my friend this morning.", es:"Llamé a mi amigo esta mañana."}
            ]}
        ]
      },
      {
        topic: 'Preguntas con Do/Does en presente simple',
        items: [
          { id:'g-facil7-dodoes-1', translation:"¿Cómo preguntas \"¿Te gusta el café?\" en inglés?", type:'choice', prompt:"How do you ask \"¿Te gusta el café?\" in English?",
            options:["Do you like coffee?","Does you like coffee?","Are you like coffee?"], correct:0,
            explain:"Con “you” usamos “Do”: “Do you like...?”",
            examples:[
              {en:"Do you like coffee?", es:"¿Te gusta el café?"},
              {en:"Do you like tea?", es:"¿Te gusta el té?"}
            ]},
          { id:'g-facil7-dodoes-2', translation:"¿Ella trabaja los sábados?", type:'fill', sentence:["___","she","work","on","Saturdays","?"], blankIndex:0,
            bank:["Does","Do","Is"], correct:"Does",
            explain:"Con “she/he/it” usamos “Does”.",
            examples:[
              {en:"Does she work on Saturdays?", es:"¿Ella trabaja los sábados?"},
              {en:"Does he live near here?", es:"¿Él vive cerca de aquí?"}
            ]},
          { id:'g-facil7-dodoes-3', translation:"¿Cuál pregunta es correcta sobre tu hermano?", type:'choice', prompt:"Which question about your brother is correct?",
            options:["Does he play soccer?","Do he play soccer?","Is he plays soccer?"], correct:0,
            explain:"Con “he” usamos “Does”, no “Do”.",
            examples:[
              {en:"Does he play soccer?", es:"¿Él juega fútbol?"},
              {en:"Does he play every weekend?", es:"¿Él juega cada fin de semana?"}
            ]},
          { id:'g-facil7-dodoes-4', translation:"¿Ellos viven en Bogotá?", type:'error', wrong:"Does they live in Bogotá?", wrongWord:"Does",
            right:"Do they live in Bogotá?", rightWord:"Do",
            explain:"Con “they” usamos “Do”, no “Does”.",
            examples:[
              {en:"Do they live in Bogotá?", es:"¿Ellos viven en Bogotá?"},
              {en:"Do they speak English?", es:"¿Ellos hablan inglés?"}
            ]}
        ]
      }
    ]
  ,
  [
 {
  "topic": "Its vs It's",
  "items": [
   {
    "id": "g-facil8-itsits-1",
    "translation": "El perro movió su cola.",
    "type": "choice",
    "prompt": "The dog wagged ___ tail.",
    "options": [
     "its",
     "it's",
     "its'"
    ],
    "correct": 0,
    "explain": "“Its” (sin apóstrofe) es posesivo: de él/ella (una cosa o animal).",
    "examples": [
     {
      "en": "The dog wagged its tail.",
      "es": "El perro movió su cola."
     },
     {
      "en": "The cat licked its paw.",
      "es": "El gato se lamió la pata."
     }
    ]
   },
   {
    "id": "g-facil8-itsits-2",
    "translation": "Está lloviendo hoy.",
    "type": "fill",
    "sentence": [
     "___",
     "raining",
     "today",
     "."
    ],
    "blankIndex": 0,
    "bank": [
     "It's",
     "Its",
     "Is"
    ],
    "correct": "It's",
    "explain": "“It's” con apóstrofe es la contracción de “it is” o “it has”.",
    "examples": [
     {
      "en": "It's raining today.",
      "es": "Está lloviendo hoy."
     },
     {
      "en": "It's been a long day.",
      "es": "Ha sido un día largo."
     }
    ]
   },
   {
    "id": "g-facil8-itsits-3",
    "translation": "El libro perdió su portada.",
    "type": "choice",
    "prompt": "The book lost ___ cover.",
    "options": [
     "its",
     "it's",
     "it is"
    ],
    "correct": 0,
    "explain": "“Its cover” significa la portada de ÉL (del libro), por eso es posesivo sin apóstrofe.",
    "examples": [
     {
      "en": "The book lost its cover.",
      "es": "El libro perdió su portada."
     },
     {
      "en": "Every rule has its exception.",
      "es": "Cada regla tiene su excepción."
     }
    ]
   },
   {
    "id": "g-facil8-itsits-4",
    "translation": "Es un día hermoso.",
    "type": "error",
    "wrong": "Its a beautiful day.",
    "wrongWord": "Its",
    "right": "It's a beautiful day.",
    "rightWord": "It's",
    "explain": "Aquí significa “it is”, así que necesita el apóstrofe: “It's”.",
    "examples": [
     {
      "en": "It's a beautiful day.",
      "es": "Es un día hermoso."
     },
     {
      "en": "It's my favorite song.",
      "es": "Es mi canción favorita."
     }
    ]
   }
  ]
 },
 {
  "topic": "Then vs Than",
  "items": [
   {
    "id": "g-facil8-thenthan-1",
    "translation": "Ella es más alta que su hermano.",
    "type": "choice",
    "prompt": "She is taller ___ her brother.",
    "options": [
     "than",
     "then",
     "that"
    ],
    "correct": 0,
    "explain": "“Than” se usa para comparar (taller than, faster than).",
    "examples": [
     {
      "en": "She is taller than her brother.",
      "es": "Ella es más alta que su hermano."
     },
     {
      "en": "This is better than that.",
      "es": "Esto es mejor que eso."
     }
    ]
   },
   {
    "id": "g-facil8-thenthan-2",
    "translation": "Primero comimos, luego dormimos.",
    "type": "fill",
    "sentence": [
     "We",
     "ate",
     ",",
     "___",
     "we",
     "slept",
     "."
    ],
    "blankIndex": 3,
    "bank": [
     "then",
     "than",
     "when"
    ],
    "correct": "then",
    "explain": "“Then” indica el siguiente paso en el tiempo (después, luego).",
    "examples": [
     {
      "en": "We ate, then we slept.",
      "es": "Comimos, luego dormimos."
     },
     {
      "en": "First think, then act.",
      "es": "Primero piensa, luego actúa."
     }
    ]
   },
   {
    "id": "g-facil8-thenthan-3",
    "translation": "Prefiero café más que té.",
    "type": "choice",
    "prompt": "I prefer coffee more ___ tea.",
    "options": [
     "than",
     "then",
     "so"
    ],
    "correct": 0,
    "explain": "Al comparar dos cosas, usamos “than”.",
    "examples": [
     {
      "en": "I prefer coffee more than tea.",
      "es": "Prefiero café más que té."
     },
     {
      "en": "He runs faster than me.",
      "es": "Él corre más rápido que yo."
     }
    ]
   },
   {
    "id": "g-facil8-thenthan-4",
    "translation": "Terminamos la tarea, luego jugamos.",
    "type": "error",
    "wrong": "We finished the homework, than we played.",
    "wrongWord": "than",
    "right": "We finished the homework, then we played.",
    "rightWord": "then",
    "explain": "Aquí se habla de una secuencia de tiempo, no de una comparación, así que es “then”.",
    "examples": [
     {
      "en": "We finished the homework, then we played.",
      "es": "Terminamos la tarea, luego jugamos."
     },
     {
      "en": "Open the door, then turn on the light.",
      "es": "Abre la puerta, luego prende la luz."
     }
    ]
   }
  ]
 }
],
    [
      {
        topic: "\"Your\" vs \"You're\"",
        items: [
          { id:'g-facil10-1',
            translation:"Tú eres mi mejor amigo.",
            type:'choice',
            prompt:"___ my best friend.",
            options:["You're","Your","Yours"],
            correct:0,
            explain:"“You’re” es la forma corta de “you are”.",
              examples:[
              {en:"You're my best friend.", es:"Tú eres mi mejor amigo."},
              {en:"You're very smart.", es:"Eres muy inteligente."}
            ]},
          { id:'g-facil10-2',
            translation:"¿Es este tu carro?",
            type:'fill',
            sentence:["Is","this","___","car","?"],
            blankIndex:2,
            bank:["your","you're","yours"],
            correct:"your",
            explain:"“Your” muestra posesión (de ti).",
              examples:[
              {en:"Is this your car?", es:"¿Es este tu carro?"},
              {en:"I like your shoes.", es:"Me gustan tus zapatos."}
            ]},
          { id:'g-facil10-3',
            translation:"Te va a encantar esta película.",
            type:'choice',
            prompt:"___ going to love this movie.",
            options:["You're","Your"],
            correct:0,
            explain:"Antes de un verbo con “-ing” usamos “you’re” (you are).",
              examples:[
              {en:"You're going to love it.", es:"Te va a encantar."},
              {en:"You're doing great.", es:"Lo estás haciendo genial."}
            ]},
          { id:'g-facil10-4',
            translation:"Llegas tarde otra vez.",
            type:'error',
            wrong:"Your late again.",
            wrongWord:"Your",
            right:"You're late again.",
            rightWord:"You're",
            explain:"“You’re” = “you are”. Aquí se necesita el verbo “are”, no el posesivo “your”.",
              examples:[
              {en:"You're late again.", es:"Llegas tarde otra vez."},
              {en:"You're right.", es:"Tienes razón."}
            ]}
        ]
      },
      {
        topic: "\"To\" vs \"Too\" vs \"Two\"",
        items: [
          { id:'g-facil10-5',
            translation:"Voy a la tienda.",
            type:'choice',
            prompt:"I am going ___ the store.",
            options:["to","too","two"],
            correct:0,
            explain:"“To” se usa para indicar dirección o destino.",
              examples:[
              {en:"I am going to the store.", es:"Voy a la tienda."},
              {en:"She went to school.", es:"Ella fue a la escuela."}
            ]},
          { id:'g-facil10-6',
            translation:"Esta sopa está demasiado caliente para comer.",
            type:'choice',
            prompt:"This soup is ___ hot to eat.",
            options:["too","to","two"],
            correct:0,
            explain:"“Too” significa “demasiado”.",
              examples:[
              {en:"This soup is too hot.", es:"Esta sopa está demasiado caliente."},
              {en:"It's too late to call.", es:"Es demasiado tarde para llamar."}
            ]},
          { id:'g-facil10-7',
            translation:"Tengo dos hermanas.",
            type:'choice',
            prompt:"I have ___ sisters.",
            options:["two","to","too"],
            correct:0,
            explain:"“Two” es el número 2.",
              examples:[
              {en:"I have two sisters.", es:"Tengo dos hermanas."},
              {en:"She bought two shirts.", es:"Ella compró dos camisas."}
            ]},
          { id:'g-facil10-8',
            translation:"Yo también quiero ir.",
            type:'fill',
            sentence:["I","want","to","go","___","."],
            blankIndex:4,
            bank:["too","to","two"],
            correct:"too",
            explain:"“Too” al final de una frase significa “también”.",
              examples:[
              {en:"I want to go too.", es:"Yo también quiero ir."},
              {en:"She likes coffee too.", es:"A ella también le gusta el café."}
            ]},
          { id:'g-facil10-9',
            translation:"Ella va a la fiesta.",
            type:'error',
            wrong:"She is going too the party.",
            wrongWord:"too",
            right:"She is going to the party.",
            rightWord:"to",
            explain:"Antes de un lugar o destino, se usa “to”, no “too”.",
              examples:[
              {en:"She is going to the party.", es:"Ella va a la fiesta."},
              {en:"He is going to work.", es:"Él va al trabajo."}
            ]},
          { id:'g-facil10-10',
            translation:"Esta bolsa está demasiado pesada.",
            type:'error',
            wrong:"This bag is to heavy.",
            wrongWord:"to",
            right:"This bag is too heavy.",
            rightWord:"too",
            explain:"Antes de un adjetivo con el sentido de “demasiado”, se usa “too”, no “to”.",
              examples:[
              {en:"This bag is too heavy.", es:"Esta bolsa está demasiado pesada."},
              {en:"He is too tired to drive.", es:"Él está demasiado cansado para manejar."}
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
    ],
    [
      {
        topic: 'Voz pasiva (presente y pasado simple)',
        items: [
          { id:'g-medio4-pass-1', type:'choice', prompt:"This bridge ___ in 1990.",
            options:["built","was built","is built"], correct:1,
            explain:"Voz pasiva en pasado: “was/were” + participio. La acción ocurrió en el pasado.",
            examples:[
              {en:"This bridge was built in 1990.", es:"Este puente fue construido en 1990."},
              {en:"The letter was written yesterday.", es:"La carta fue escrita ayer."}
            ]},
          { id:'g-medio4-pass-2', type:'fill', sentence:["English","___","spoken","all","over","the","world","."], blankIndex:1,
            bank:["is","was","are"], correct:"is",
            explain:"Voz pasiva en presente con sujeto singular: “is” + participio.",
            examples:[
              {en:"English is spoken all over the world.", es:"El inglés se habla en todo el mundo."},
              {en:"This product is made in Mexico.", es:"Este producto se hace en México."}
            ]},
          { id:'g-medio4-pass-3', type:'choice', prompt:"The letters ___ every day.",
            options:["deliver","are delivered","delivered"], correct:1,
            explain:"Con sujeto plural en presente, la voz pasiva usa “are” + participio.",
            examples:[
              {en:"The letters are delivered every day.", es:"Las cartas se entregan todos los días."},
              {en:"These cars are made in Japan.", es:"Estos carros se fabrican en Japón."}
            ]},
          { id:'g-medio4-pass-4', type:'error', wrong:"The cake was make by my mom.", wrongWord:"make",
            right:"The cake was made by my mom.", rightWord:"made",
            explain:"Después de “was/were” en voz pasiva necesitamos el participio: “made”, no la forma base “make”.",
            examples:[
              {en:"The cake was made by my mom.", es:"El pastel fue hecho por mi mamá."},
              {en:"The house was built by my grandfather.", es:"La casa fue construida por mi abuelo."}
            ]}
        ]
      },
      {
        topic: 'Verbos modales de obligación (must / have to / should)',
        items: [
          { id:'g-medio4-mod-1', type:'choice', prompt:"You ___ wear a seatbelt, it's the law.",
            options:["must","should","could"], correct:0,
            explain:"“Must” expresa una obligación fuerte, como una regla o ley.",
            examples:[
              {en:"You must wear a seatbelt.", es:"Debes usar cinturón de seguridad (es obligatorio)."},
              {en:"Employees must wash their hands.", es:"Los empleados deben lavarse las manos."}
            ]},
          { id:'g-medio4-mod-2', type:'choice', prompt:"You ___ see a doctor if you feel sick. It's a good idea.",
            options:["should","must","can"], correct:0,
            explain:"“Should” es un consejo, no una obligación estricta como “must”.",
            examples:[
              {en:"You should see a doctor.", es:"Deberías ver a un doctor (es un consejo)."},
              {en:"You should drink more water.", es:"Deberías tomar más agua."}
            ]},
          { id:'g-medio4-mod-3', type:'fill', sentence:["I","___","go","to","work","tomorrow,","it's","a","holiday","."], blankIndex:1,
            bank:["don't have to","must","should"], correct:"don't have to",
            explain:"“Don't have to” significa que no hay obligación, es diferente de “mustn't” (prohibido).",
            examples:[
              {en:"I don't have to go to work tomorrow.", es:"No tengo que ir a trabajar mañana."},
              {en:"You don't have to bring anything, we have everything.", es:"No tienes que traer nada, ya tenemos de todo."}
            ]},
          { id:'g-medio4-mod-4', type:'error', wrong:"You must to be careful.", wrongWord:"to",
            right:"You must be careful.", rightWord:"",
            explain:"Después de un verbo modal como “must” va el verbo base directo, sin “to”: sobra la palabra “to”.",
            examples:[
              {en:"You must be careful.", es:"Debes tener cuidado."},
              {en:"She must finish the report today.", es:"Ella debe terminar el informe hoy."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Will vs Going to (futuro)',
        items: [
          { id:'g-medio5-fut-1', type:'choice', prompt:"I've already decided that I ___ start my own business next year.",
            options:["will","am going to","would"], correct:1,
            explain:"Usamos “going to” para planes ya decididos, no “will” (más para decisiones espontáneas).",
            examples:[
              {en:"I am going to start my own business next year.", es:"Voy a empezar mi propio negocio el próximo año."},
              {en:"We are going to move to a new city.", es:"Nos vamos a mudar a una nueva ciudad."}
            ]},
          { id:'g-medio5-fut-2', type:'fill', sentence:["Look","at","those","clouds","It","___","rain","soon","."], blankIndex:5,
            bank:["is going to","will","would"], correct:"is going to",
            explain:"Cuando hay evidencia visible de que algo va a pasar, usamos “going to”, no “will”.",
            examples:[
              {en:"Look at those clouds. It is going to rain soon.", es:"Mira esas nubes. Va a llover pronto."},
              {en:"She is going to fall, look at her feet!", es:"Ella se va a caer, ¡mira sus pies!"}
            ]},
          { id:'g-medio5-fut-3', type:'choice', prompt:"A: \"The phone is ringing.\" B: \"I ___ get it!\"",
            options:["am going to","will","was going to"], correct:1,
            explain:"Para decisiones espontáneas, tomadas en el momento, usamos “will”.",
            examples:[
              {en:"I will get it!", es:"¡Yo contesto!"},
              {en:"I will help you with that.", es:"Te ayudaré con eso."}
            ]},
          { id:'g-medio5-fut-4', type:'error', wrong:"I think it will to rain tomorrow.", wrongWord:"to",
            right:"I think it will rain tomorrow.", rightWord:"",
            explain:"Después de “will” va el verbo base sin “to”: sobra la palabra “to”.",
            examples:[
              {en:"I think it will rain tomorrow.", es:"Creo que va a llover mañana."},
              {en:"She will call you later.", es:"Ella te llamará más tarde."}
            ]}
        ]
      },
      {
        topic: 'Gerundios vs infinitivos (like doing / want to do)',
        items: [
          { id:'g-medio5-ger-1', type:'choice', prompt:"She enjoys ___ new recipes.",
            options:["cook","to cook","cooking"], correct:2,
            explain:"“Enjoy” siempre va seguido de gerundio (-ing), nunca de infinitivo.",
            examples:[
              {en:"She enjoys cooking new recipes.", es:"A ella le gusta cocinar recetas nuevas."},
              {en:"I enjoy reading before bed.", es:"Me gusta leer antes de dormir."}
            ]},
          { id:'g-medio5-ger-2', type:'fill', sentence:["I","want","___","the","truth","."], blankIndex:2,
            bank:["to know","knowing","know"], correct:"to know",
            explain:"“Want” va seguido de infinitivo con “to”.",
            examples:[
              {en:"I want to know the truth.", es:"Quiero saber la verdad."},
              {en:"They want to travel next year.", es:"Ellos quieren viajar el próximo año."}
            ]},
          { id:'g-medio5-ger-3', type:'choice', prompt:"He decided ___ a new job.",
            options:["looking for","to look for","look for"], correct:1,
            explain:"“Decide” va seguido de infinitivo con “to”.",
            examples:[
              {en:"He decided to look for a new job.", es:"Él decidió buscar un nuevo trabajo."},
              {en:"We decided to leave early.", es:"Decidimos salir temprano."}
            ]},
          { id:'g-medio5-ger-4', type:'error', wrong:"I finished to read the book.", wrongWord:"to read",
            right:"I finished reading the book.", rightWord:"reading",
            explain:"“Finish” siempre va seguido de gerundio (-ing), no de infinitivo.",
            examples:[
              {en:"I finished reading the book.", es:"Terminé de leer el libro."},
              {en:"She finished writing her essay.", es:"Ella terminó de escribir su ensayo."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Cláusulas relativas (who / which / that)',
        items: [
          { id:'g-medio6-rel-1', type:'choice', prompt:"The woman ___ lives next door is a doctor.",
            options:["which","who","whose"], correct:1,
            explain:"Para personas usamos “who”, no “which”.",
            examples:[
              {en:"The woman who lives next door is a doctor.", es:"La mujer que vive al lado es doctora."},
              {en:"The man who called you is my uncle.", es:"El hombre que te llamó es mi tío."}
            ]},
          { id:'g-medio6-rel-2', type:'fill', sentence:["This","is","the","book","___","I","told","you","about","."], blankIndex:4,
            bank:["that","who","whose"], correct:"that",
            explain:"“That” puede referirse a cosas; aquí se refiere a “the book”.",
            examples:[
              {en:"This is the book that I told you about.", es:"Este es el libro del que te hablé."},
              {en:"That's the movie that won the award.", es:"Esa es la película que ganó el premio."}
            ]},
          { id:'g-medio6-rel-3', type:'choice', prompt:"That's the man ___ car was stolen.",
            options:["who","whose","which"], correct:1,
            explain:"“Whose” muestra posesión: el carro de ese hombre.",
            examples:[
              {en:"That's the man whose car was stolen.", es:"Ese es el hombre cuyo carro fue robado."},
              {en:"She's the teacher whose class I love.", es:"Ella es la maestra cuya clase amo."}
            ]},
          { id:'g-medio6-rel-4', type:'error', wrong:"The house which I grew up was sold.", wrongWord:"which",
            right:"The house where I grew up was sold.", rightWord:"where",
            explain:"Para lugares usamos “where”, no “which”, cuando no hay preposición extra.",
            examples:[
              {en:"The house where I grew up was sold.", es:"La casa donde crecí fue vendida."},
              {en:"This is the town where she was born.", es:"Este es el pueblo donde ella nació."}
            ]}
        ]
      },
      {
        topic: 'Phrasal verbs comunes (look for / give up / find out)',
        items: [
          { id:'g-medio6-phr-1', type:'choice', prompt:"I'm ___ my keys. Have you seen them?",
            options:["looking for","looking at","looking after"], correct:0,
            explain:"“Look for” significa buscar algo.",
            examples:[
              {en:"I'm looking for my keys.", es:"Estoy buscando mis llaves."},
              {en:"She's looking for a new apartment.", es:"Ella está buscando un nuevo apartamento."}
            ]},
          { id:'g-medio6-phr-2', type:'fill', sentence:["Don't","___","now","you're","almost","done","!"], blankIndex:1,
            bank:["give up","give in","give away"], correct:"give up",
            explain:"“Give up” significa rendirse o dejar de intentar.",
            examples:[
              {en:"Don't give up now, you're almost done!", es:"¡No te rindas ahora, ya casi terminas!"},
              {en:"He never gives up on his goals.", es:"Él nunca se rinde con sus metas."}
            ]},
          { id:'g-medio6-phr-3', type:'choice', prompt:"I need to ___ what time the train leaves.",
            options:["find out","find up","find for"], correct:0,
            explain:"“Find out” significa averiguar o descubrir información.",
            examples:[
              {en:"I need to find out what time the train leaves.", es:"Necesito averiguar a qué hora sale el tren."},
              {en:"We found out the news yesterday.", es:"Nos enteramos de la noticia ayer."}
            ]},
          { id:'g-medio6-phr-4', type:'error', wrong:"I will find out this problem tomorrow.", wrongWord:"find out",
            right:"I will look into this problem tomorrow.", rightWord:"look into",
            explain:"“Find out” es para descubrir información puntual; para investigar un problema se usa “look into”.",
            examples:[
              {en:"I will look into this problem tomorrow.", es:"Investigaré este problema mañana."},
              {en:"The manager is looking into the complaint.", es:"El gerente está investigando la queja."}
            ]}
        ]
      }
    ]
  ,

    [
      {
        topic: 'Verbos modales de posibilidad (may / might / could)',
        items: [
          { id:'g-medio7-modal-1', translation:"¿Cómo expresas que posiblemente llueva?", type:'choice', prompt:"How do you express that it might possibly rain?",
            options:["It might rain.","It must rain.","It rains might."], correct:0,
            explain:"“Might” expresa una posibilidad, no una certeza.",
            examples:[
              {en:"It might rain later.", es:"Podría llover más tarde."},
              {en:"She might come to the party.", es:"Ella podría venir a la fiesta."}
            ]},
          { id:'g-medio7-modal-2', translation:"Él podría estar en una reunión ahora.", type:'fill', sentence:["He","___","be","in","a","meeting","right","now","."], blankIndex:1,
            bank:["could","must","is"], correct:"could",
            explain:"“Could” también expresa posibilidad.",
            examples:[
              {en:"He could be in a meeting right now.", es:"Él podría estar en una reunión ahora."},
              {en:"She could be at home.", es:"Ella podría estar en casa."}
            ]},
          { id:'g-medio7-modal-3', translation:"¿Cuál oración expresa una posibilidad, no una obligación?", type:'choice', prompt:"Which sentence expresses a possibility, not an obligation?",
            options:["We may travel next year.","We must travel next year.","We travel next year must."], correct:0,
            explain:"“May” indica posibilidad; “must” indica obligación.",
            examples:[
              {en:"We may travel next year.", es:"Podríamos viajar el próximo año."},
              {en:"They may change the plan.", es:"Podrían cambiar el plan."}
            ]},
          { id:'g-medio7-modal-4', translation:"Podría ser tarde para llamarla.", type:'error', wrong:"It might to be late to call her.", wrongWord:"to",
            right:"It might be late to call her.", rightWord:"",
            explain:"Después de “might” no se usa “to”: sobra la palabra “to”.",
            examples:[
              {en:"It might be late to call her.", es:"Podría ser tarde para llamarla."},
              {en:"It might be a good idea.", es:"Podría ser una buena idea."}
            ]}
        ]
      },
      {
        topic: 'Cuantificadores (a lot of / much / many / few / little)',
        items: [
          { id:'g-medio7-quant-1', translation:"¿Cómo dices \"mucho tráfico\" en inglés?", type:'choice', prompt:"How do you say \"mucho tráfico\" in English?",
            options:["A lot of traffic","Many traffic","Few traffic"], correct:0,
            explain:"“Traffic” es incontable, así que usamos “a lot of” o “much”, no “many”.",
            examples:[
              {en:"There is a lot of traffic today.", es:"Hay mucho tráfico hoy."},
              {en:"We don't have much traffic here.", es:"No tenemos mucho tráfico aquí."}
            ]},
          { id:'g-medio7-quant-2', translation:"No tenemos muchos amigos en esta ciudad.", type:'fill', sentence:["We","don't","have","___","friends","in","this","city","."], blankIndex:3,
            bank:["many","much","little"], correct:"many",
            explain:"“Friends” es contable, así que usamos “many”.",
            examples:[
              {en:"We don't have many friends in this city.", es:"No tenemos muchos amigos en esta ciudad."},
              {en:"He has many hobbies.", es:"Él tiene muchos pasatiempos."}
            ]},
          { id:'g-medio7-quant-3', translation:"¿Cuál oración usa correctamente \"a few\"?", type:'choice', prompt:"Which sentence correctly uses \"a few\"?",
            options:["I have a few questions.","I have a few money.","I have a few water."], correct:0,
            explain:"“A few” se usa con sustantivos contables como “questions”.",
            examples:[
              {en:"I have a few questions.", es:"Tengo unas cuantas preguntas."},
              {en:"She has a few close friends.", es:"Ella tiene unos pocos amigos cercanos."}
            ]},
          { id:'g-medio7-quant-4', translation:"Tenemos poco tiempo.", type:'error', wrong:"We have few time.", wrongWord:"few",
            right:"We have little time.", rightWord:"little",
            explain:"“Time” es incontable, así que usamos “little”, no “few”.",
            examples:[
              {en:"We have little time.", es:"Tenemos poco tiempo."},
              {en:"There is little hope left.", es:"Queda poca esperanza."}
            ]}
        ]
      }
    ]
  ,
  [
 {
  "topic": "Who vs Whom",
  "items": [
   {
    "id": "g-medio8-whowhom-1",
    "translation": "¿Quién llamó a la puerta?",
    "type": "choice",
    "prompt": "___ knocked on the door?",
    "options": [
     "Who",
     "Whom",
     "Which"
    ],
    "correct": 0,
    "explain": "“Who” es el sujeto de la oración (el que hace la acción).",
    "examples": [
     {
      "en": "Who knocked on the door?",
      "es": "¿Quién llamó a la puerta?"
     },
     {
      "en": "Who is coming to the party?",
      "es": "¿Quién viene a la fiesta?"
     }
    ]
   },
   {
    "id": "g-medio8-whowhom-2",
    "translation": "¿A quién viste en la tienda?",
    "type": "fill",
    "sentence": [
     "___",
     "did",
     "you",
     "see",
     "at",
     "the",
     "store",
     "?"
    ],
    "blankIndex": 0,
    "bank": [
     "Whom",
     "Who",
     "Whose"
    ],
    "correct": "Whom",
    "explain": "“Whom” es el objeto de la oración (recibe la acción). Aquí “you” ve a alguien, ese alguien es “whom”.",
    "examples": [
     {
      "en": "Whom did you see at the store?",
      "es": "¿A quién viste en la tienda?"
     },
     {
      "en": "To whom should I send this?",
      "es": "¿A quién debo enviar esto?"
     }
    ]
   },
   {
    "id": "g-medio8-whowhom-3",
    "translation": "Ese es el hombre a quien conocí ayer.",
    "type": "choice",
    "prompt": "That is the man ___ I met yesterday.",
    "options": [
     "whom",
     "who",
     "which"
    ],
    "correct": 0,
    "explain": "“I met whom” (yo conocí a quien), es objeto de “met”, por eso es “whom”.",
    "examples": [
     {
      "en": "That is the man whom I met yesterday.",
      "es": "Ese es el hombre a quien conocí ayer."
     },
     {
      "en": "She is the teacher whom we admire.",
      "es": "Ella es la profesora a quien admiramos."
     }
    ]
   },
   {
    "id": "g-medio8-whowhom-4",
    "translation": "¿Quién es responsable de esto?",
    "type": "error",
    "wrong": "Whom is responsible for this?",
    "wrongWord": "Whom",
    "right": "Who is responsible for this?",
    "rightWord": "Who",
    "explain": "“Is responsible” necesita un sujeto, y el sujeto es “who”, no “whom”.",
    "examples": [
     {
      "en": "Who is responsible for this?",
      "es": "¿Quién es responsable de esto?"
     },
     {
      "en": "Who wrote this letter?",
      "es": "¿Quién escribió esta carta?"
     }
    ]
   }
  ]
 },
 {
  "topic": "Affect vs Effect",
  "items": [
   {
    "id": "g-medio8-affecteffect-1",
    "translation": "El clima afecta nuestro estado de ánimo.",
    "type": "choice",
    "prompt": "The weather ___ our mood.",
    "options": [
     "affects",
     "effects",
     "effect"
    ],
    "correct": 0,
    "explain": "“Affect” es un verbo: influir en algo.",
    "examples": [
     {
      "en": "The weather affects our mood.",
      "es": "El clima afecta nuestro estado de ánimo."
     },
     {
      "en": "Stress can affect your health.",
      "es": "El estrés puede afectar tu salud."
     }
    ]
   },
   {
    "id": "g-medio8-affecteffect-2",
    "translation": "El efecto del medicamento fue rápido.",
    "type": "fill",
    "sentence": [
     "The",
     "___",
     "of",
     "the",
     "medicine",
     "was",
     "fast",
     "."
    ],
    "blankIndex": 1,
    "bank": [
     "effect",
     "affect",
     "effected"
    ],
    "correct": "effect",
    "explain": "“Effect” es un sustantivo: el resultado de algo.",
    "examples": [
     {
      "en": "The effect of the medicine was fast.",
      "es": "El efecto del medicamento fue rápido."
     },
     {
      "en": "This has a positive effect.",
      "es": "Esto tiene un efecto positivo."
     }
    ]
   },
   {
    "id": "g-medio8-affecteffect-3",
    "translation": "El nuevo cambio tendrá efecto la próxima semana.",
    "type": "choice",
    "prompt": "The new change will take ___ next week.",
    "options": [
     "effect",
     "affect",
     "affects"
    ],
    "correct": 0,
    "explain": "La expresión fija es “take effect” (entrar en vigencia).",
    "examples": [
     {
      "en": "The new change will take effect next week.",
      "es": "El nuevo cambio tendrá efecto la próxima semana."
     },
     {
      "en": "The law takes effect in June.",
      "es": "La ley entra en vigencia en junio."
     }
    ]
   },
   {
    "id": "g-medio8-affecteffect-4",
    "translation": "El ruido afectó su concentración.",
    "type": "error",
    "wrong": "The noise effected her concentration.",
    "wrongWord": "effected",
    "right": "The noise affected her concentration.",
    "rightWord": "affected",
    "explain": "Como es una acción (influir), se necesita el verbo “affect”, no el sustantivo “effect”.",
    "examples": [
     {
      "en": "The noise affected her concentration.",
      "es": "El ruido afectó su concentración."
     },
     {
      "en": "The heat affected the crops.",
      "es": "El calor afectó las cosechas."
     }
    ]
   }
  ]
 }
],
    [
      {
        topic: "\"Say\" vs \"Tell\"",
        items: [
          { id:'g-medio10-1',
            translation:"Por favor dime la verdad.",
            type:'choice',
            prompt:"Please ___ me the truth.",
            options:["tell","say"],
            correct:0,
            explain:"“Tell” va seguido de la persona directamente (tell me).",
              examples:[
              {en:"Please tell me the truth.", es:"Por favor dime la verdad."},
              {en:"He told me a secret.", es:"Él me contó un secreto."}
            ]},
          { id:'g-medio10-2',
            translation:"Ella no dijo nada durante la reunión.",
            type:'choice',
            prompt:"She didn't ___ anything during the meeting.",
            options:["say","tell"],
            correct:0,
            explain:"“Say” no necesita una persona después (say something).",
              examples:[
              {en:"She didn't say anything.", es:"Ella no dijo nada."},
              {en:"He said hello.", es:"Él dijo hola."}
            ]},
          { id:'g-medio10-3',
            translation:"¿Puedes contarme una historia?",
            type:'fill',
            sentence:["Can","you","___","me","a","story","?"],
            blankIndex:2,
            bank:["tell","say"],
            correct:"tell",
            explain:"“Tell” se usa con una persona como objeto directo.",
              examples:[
              {en:"Can you tell me a story?", es:"¿Puedes contarme una historia?"},
              {en:"She told us the news.", es:"Ella nos contó la noticia."}
            ]},
          { id:'g-medio10-4',
            translation:"Él me dijo que estaba ocupado.",
            type:'error',
            wrong:"He said me he was busy.",
            wrongWord:"said",
            right:"He told me he was busy.",
            rightWord:"told",
            explain:"Antes de una persona (me), se usa “tell/told”, no “say/said”.",
              examples:[
              {en:"He told me he was busy.", es:"Él me dijo que estaba ocupado."},
              {en:"She told him the truth.", es:"Ella le dijo la verdad."}
            ]}
        ]
      },
      {
        topic: "\"Fewer\" vs \"Less\"",
        items: [
          { id:'g-medio10-5',
            translation:"Tengo menos libros que tú.",
            type:'choice',
            prompt:"I have ___ books than you.",
            options:["fewer","less"],
            correct:0,
            explain:"“Fewer” se usa con cosas contables (books).",
              examples:[
              {en:"I have fewer books than you.", es:"Tengo menos libros que tú."},
              {en:"There are fewer students this year.", es:"Hay menos estudiantes este año."}
            ]},
          { id:'g-medio10-6',
            translation:"Deberíamos comer menos azúcar.",
            type:'choice',
            prompt:"We should eat ___ sugar.",
            options:["less","fewer"],
            correct:0,
            explain:"“Less” se usa con cosas incontables (sugar).",
              examples:[
              {en:"We should eat less sugar.", es:"Deberíamos comer menos azúcar."},
              {en:"I have less time now.", es:"Tengo menos tiempo ahora."}
            ]},
          { id:'g-medio10-7',
            translation:"Hay menos personas que el año pasado.",
            type:'error',
            wrong:"There are less people than last year.",
            wrongWord:"less",
            right:"There are fewer people than last year.",
            rightWord:"fewer",
            explain:"“People” es contable, por eso se usa “fewer”, no “less”.",
              examples:[
              {en:"There are fewer people this year.", es:"Hay menos personas este año."},
              {en:"She has fewer problems now.", es:"Ella tiene menos problemas ahora."}
            ]}
        ]
      },
      {
        topic: "\"Advice\" vs \"Advise\"",
        items: [
          { id:'g-medio10-8',
            translation:"¿Puedes darme un consejo?",
            type:'choice',
            prompt:"Can you give me some ___?",
            options:["advice","advise"],
            correct:0,
            explain:"“Advice” es un sustantivo (el consejo).",
              examples:[
              {en:"Can you give me some advice?", es:"¿Puedes darme un consejo?"},
              {en:"Her advice was very helpful.", es:"Su consejo fue muy útil."}
            ]},
          { id:'g-medio10-9',
            translation:"Te aconsejaría ver a un doctor.",
            type:'choice',
            prompt:"I would ___ you to see a doctor.",
            options:["advise","advice"],
            correct:0,
            explain:"“Advise” es un verbo (aconsejar).",
              examples:[
              {en:"I would advise you to rest.", es:"Te aconsejaría descansar."},
              {en:"The lawyer advised him carefully.", es:"El abogado lo aconsejó con cuidado."}
            ]},
          { id:'g-medio10-10',
            translation:"Ella me dio un buen consejo.",
            type:'error',
            wrong:"She gave me a good advise.",
            wrongWord:"advise",
            right:"She gave me good advice.",
            rightWord:"advice",
            explain:"Después de “gave me”, se necesita el sustantivo “advice”, no el verbo “advise”.",
              examples:[
              {en:"She gave me good advice.", es:"Ella me dio un buen consejo."},
              {en:"He always gives useful advice.", es:"Él siempre da consejos útiles."}
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
    ],
    [
      {
        topic: 'Wish / If only',
        items: [
          { id:'g-avz4-wish-1', type:'choice', prompt:"I wish I ___ more time to travel.",
            options:["have","had","will have"], correct:1,
            explain:"“Wish” + pasado simple expresa un deseo sobre algo que no es cierto ahora.",
            examples:[
              {en:"I wish I had more time to travel.", es:"Ojalá tuviera más tiempo para viajar."},
              {en:"She wishes she lived closer to her family.", es:"Ella desearía vivir más cerca de su familia."}
            ]},
          { id:'g-avz4-wish-2', type:'choice', prompt:"If only she ___ arrived earlier!",
            options:["had","has","have"], correct:0,
            explain:"“If only” + pasado perfecto expresa un lamento sobre el pasado.",
            examples:[
              {en:"If only she had arrived earlier!", es:"¡Ojalá hubiera llegado más temprano!"},
              {en:"If only I had known about the meeting.", es:"Ojalá hubiera sabido sobre la reunión."}
            ]},
          { id:'g-avz4-wish-3', type:'fill', sentence:["I","wish","I","___","how","to","swim","."], blankIndex:3,
            bank:["knew","know","will know"], correct:"knew",
            explain:"“Wish” + pasado simple para un deseo sobre el presente.",
            examples:[
              {en:"I wish I knew how to swim.", es:"Ojalá supiera nadar."},
              {en:"He wishes he spoke French.", es:"Él desearía hablar francés."}
            ]},
          { id:'g-avz4-wish-4', type:'error', wrong:"I wish I am taller.", wrongWord:"am",
            right:"I wish I were taller.", rightWord:"were",
            explain:"Después de “wish”, usamos “were” (no “am/is/was”) para todas las personas en deseos hipotéticos.",
            examples:[
              {en:"I wish I were taller.", es:"Ojalá fuera más alto."},
              {en:"She wishes she were more patient.", es:"Ella desearía ser más paciente."}
            ]}
        ]
      },
      {
        topic: 'Condicionales mixtos',
        items: [
          { id:'g-avz4-mix-1', type:'choice', prompt:"If I had studied medicine, I ___ a doctor now.",
            options:["would be","would have been","will be"], correct:0,
            explain:"Condicional mixto: condición en el pasado (“had studied”) con resultado en el presente (“would be”).",
            examples:[
              {en:"If I had studied medicine, I would be a doctor now.", es:"Si hubiera estudiado medicina, ahora sería doctor."},
              {en:"If she had taken that job, she would live in Madrid now.", es:"Si hubiera tomado ese trabajo, ahora viviría en Madrid."}
            ]},
          { id:'g-avz4-mix-2', type:'choice', prompt:"If she weren't so busy, she ___ to the party last night.",
            options:["would have gone","would go","will go"], correct:0,
            explain:"Condicional mixto: condición en el presente (“weren't busy”) con resultado en el pasado (“would have gone”).",
            examples:[
              {en:"If she weren't so busy, she would have gone to the party last night.", es:"Si no estuviera tan ocupada, habría ido a la fiesta anoche."},
              {en:"If he weren't so shy, he would have said something.", es:"Si no fuera tan tímido, habría dicho algo."}
            ]},
          { id:'g-avz4-mix-3', type:'fill', sentence:["If","I","were","you,","I","___","have","accepted","the","offer","."], blankIndex:5,
            bank:["would","will","had"], correct:"would",
            explain:"“Would have” + participio expresa el resultado hipotético en el pasado.",
            examples:[
              {en:"If I were you, I would have accepted the offer.", es:"Si yo fuera tú, habría aceptado la oferta."},
              {en:"If I were rich, I would have bought that house.", es:"Si fuera rico, habría comprado esa casa."}
            ]},
          { id:'g-avz4-mix-4', type:'error', wrong:"If I was rich, I would have bought that house years ago.", wrongWord:"was",
            right:"If I were rich, I would have bought that house years ago.", rightWord:"were",
            explain:"En condicionales hipotéticos, usamos “were” (no “was”) con “I/he/she”, especialmente en registro formal.",
            examples:[
              {en:"If I were rich, I would have bought that house years ago.", es:"Si fuera rico, habría comprado esa casa hace años."},
              {en:"If he were more careful, he wouldn't have made that mistake.", es:"Si él fuera más cuidadoso, no habría cometido ese error."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Subjuntivo formal (It is essential that...)',
        items: [
          { id:'g-avz5-subj-1', type:'choice', prompt:"It is essential that she ___ present at the meeting.",
            options:["is","be","was"], correct:1,
            explain:"En subjuntivo formal después de “it is essential that”, el verbo va en forma base: “be”, no “is”.",
            examples:[
              {en:"It is essential that she be present at the meeting.", es:"Es esencial que ella esté presente en la reunión."},
              {en:"It is essential that everyone be informed.", es:"Es esencial que todos estén informados."}
            ]},
          { id:'g-avz5-subj-2', type:'fill', sentence:["The","committee","recommended","that","he","___","the","proposal","."], blankIndex:5,
            bank:["reconsider","reconsiders","reconsidered"], correct:"reconsider",
            explain:"Después de verbos como “recommend that”, el subjuntivo usa la forma base del verbo.",
            examples:[
              {en:"The committee recommended that he reconsider the proposal.", es:"El comité recomendó que él reconsiderara la propuesta."},
              {en:"They insisted that she attend the ceremony.", es:"Insistieron en que ella asistiera a la ceremonia."}
            ]},
          { id:'g-avz5-subj-3', type:'choice', prompt:"It's important that everyone ___ on time.",
            options:["arrives","arrive","arrived"], correct:1,
            explain:"El subjuntivo formal no lleva “-s” en tercera persona: “arrive”, no “arrives”.",
            examples:[
              {en:"It's important that everyone arrive on time.", es:"Es importante que todos lleguen a tiempo."},
              {en:"It's vital that he understand the risks.", es:"Es vital que él entienda los riesgos."}
            ]},
          { id:'g-avz5-subj-4', type:'error', wrong:"It is vital that he attends the ceremony tomorrow.", wrongWord:"attends",
            right:"It is vital that he attend the ceremony tomorrow.", rightWord:"attend",
            explain:"En registro formal, tras “it is vital that”, se espera la forma base “attend”, no “attends”.",
            examples:[
              {en:"It is vital that he attend the ceremony tomorrow.", es:"Es vital que él asista a la ceremonia mañana."},
              {en:"It is crucial that she be told immediately.", es:"Es crucial que se le diga inmediatamente."}
            ]}
        ]
      },
      {
        topic: 'Colocaciones avanzadas (make vs do)',
        items: [
          { id:'g-avz5-coll-1', type:'choice', prompt:"I need to ___ a decision by Friday.",
            options:["do","make","have"], correct:1,
            explain:"“Make a decision” es la colocación correcta; “do” no se usa con “decision”.",
            examples:[
              {en:"I need to make a decision by Friday.", es:"Necesito tomar una decisión para el viernes."},
              {en:"We made the right decision.", es:"Tomamos la decisión correcta."}
            ]},
          { id:'g-avz5-coll-2', type:'fill', sentence:["She","always","___","her","homework","before","dinner","."], blankIndex:2,
            bank:["does","makes","has"], correct:"does",
            explain:"“Do homework” es la colocación fija en inglés, aunque en español digamos “hacer la tarea”.",
            examples:[
              {en:"She always does her homework before dinner.", es:"Ella siempre hace su tarea antes de cenar."},
              {en:"He does the dishes every night.", es:"Él lava los platos cada noche."}
            ]},
          { id:'g-avz5-coll-3', type:'choice', prompt:"They ___ a huge mistake by ignoring the warning.",
            options:["did","made","had"], correct:1,
            explain:"“Make a mistake” es la colocación correcta, no “do a mistake”.",
            examples:[
              {en:"They made a huge mistake by ignoring the warning.", es:"Cometieron un gran error al ignorar la advertencia."},
              {en:"I made a mistake in my report.", es:"Cometí un error en mi informe."}
            ]},
          { id:'g-avz5-coll-4', type:'error', wrong:"He does a lot of progress in his English.", wrongWord:"does",
            right:"He makes a lot of progress in his English.", rightWord:"makes",
            explain:"“Make progress” es la colocación fija; “do progress” no es natural en inglés.",
            examples:[
              {en:"He makes a lot of progress in his English.", es:"Él progresa mucho en su inglés."},
              {en:"We are making good progress on the project.", es:"Estamos progresando bien en el proyecto."}
            ]}
        ]
      }
    ],
    [
      {
        topic: 'Discurso indirecto con matices',
        items: [
          { id:'g-avz6-rep-1', type:'choice', prompt:"She said she ___ tired the day before.",
            options:["was","is","has been"], correct:0,
            explain:"En discurso indirecto, el presente simple del original (“I am tired”) retrocede a pasado simple: “was”.",
            examples:[
              {en:"She said she was tired the day before.", es:"Ella dijo que había estado cansada el día anterior."},
              {en:"He said he was busy that week.", es:"Él dijo que estaba ocupado esa semana."}
            ]},
          { id:'g-avz6-rep-2', type:'fill', sentence:["He","told","me","he","___","finished","the","project","already","."], blankIndex:4,
            bank:["had","has","have"], correct:"had",
            explain:"El presente perfecto original (“I have finished”) retrocede a pasado perfecto (“had finished”) en discurso indirecto.",
            examples:[
              {en:"He told me he had finished the project already.", es:"Él me dijo que ya había terminado el proyecto."},
              {en:"She said she had never seen that movie.", es:"Ella dijo que nunca había visto esa película."}
            ]},
          { id:'g-avz6-rep-3', type:'choice', prompt:"She asked me if I ___ come to the party the following week.",
            options:["would","will","can"], correct:0,
            explain:"“Will” retrocede a “would” cuando reportamos lo que alguien dijo en el pasado.",
            examples:[
              {en:"She asked me if I would come to the party.", es:"Ella me preguntó si yo iría a la fiesta."},
              {en:"He asked if she would help him.", es:"Él preguntó si ella lo ayudaría."}
            ]},
          { id:'g-avz6-rep-4', type:'error', wrong:"He said that he will call me later that day.", wrongWord:"will",
            right:"He said that he would call me later that day.", rightWord:"would",
            explain:"En discurso indirecto pasado, “will” cambia a “would”.",
            examples:[
              {en:"He said that he would call me later that day.", es:"Él dijo que me llamaría más tarde ese día."},
              {en:"They said they would arrive by noon.", es:"Ellos dijeron que llegarían al mediodía."}
            ]}
        ]
      },
      {
        topic: 'Enfatizadores y hedging (arguably, tend to, likely)',
        items: [
          { id:'g-avz6-hedge-1', type:'choice', prompt:"This is ___ the best decision the company has ever made.",
            options:["arguably","argue","argument"], correct:0,
            explain:"“Arguably” es un adverbio que suaviza una afirmación fuerte: “se podría argumentar que”.",
            examples:[
              {en:"This is arguably the best decision the company has ever made.", es:"Este es posiblemente el mejor decisión que la empresa ha tomado."},
              {en:"She is arguably the most talented player on the team.", es:"Ella es posiblemente la jugadora más talentosa del equipo."}
            ]},
          { id:'g-avz6-hedge-2', type:'fill', sentence:["Prices","___","to","rise","during","the","holiday","season","."], blankIndex:1,
            bank:["tend","tends","tended"], correct:"tend",
            explain:"“Prices” es plural, así que el verbo va sin “-s”: “tend”.",
            examples:[
              {en:"Prices tend to rise during the holiday season.", es:"Los precios tienden a subir durante la temporada navideña."},
              {en:"Sales tend to slow down in summer.", es:"Las ventas tienden a bajar en verano."}
            ]},
          { id:'g-avz6-hedge-3', type:'choice', prompt:"Given the current trend, the market ___ recover soon.",
            options:["is likely to","is like to","likely is"], correct:0,
            explain:"“Be likely to” es la estructura correcta para expresar probabilidad.",
            examples:[
              {en:"The market is likely to recover soon.", es:"Es probable que el mercado se recupere pronto."},
              {en:"It is likely to rain later.", es:"Es probable que llueva más tarde."}
            ]},
          { id:'g-avz6-hedge-4', type:'error', wrong:"It's arguable the best restaurant in town.", wrongWord:"arguable",
            right:"It's arguably the best restaurant in town.", rightWord:"arguably",
            explain:"Antes de un superlativo necesitamos el adverbio “arguably”, no el adjetivo “arguable”.",
            examples:[
              {en:"It's arguably the best restaurant in town.", es:"Es posiblemente el mejor restaurante de la ciudad."},
              {en:"He's arguably the greatest player of all time.", es:"Él es posiblemente el mejor jugador de todos los tiempos."}
            ]}
        ]
      }
    ]
  ,

    [
      {
        topic: 'Participios como adjetivos (-ed vs -ing)',
        items: [
          { id:'g-avanzado7-edng-1', translation:"¿Cómo describes una película que no tiene nada interesante?", type:'choice', prompt:"How do you describe a movie that has nothing interesting?",
            options:["The movie is boring.","The movie is bored.","The movie is bore."], correct:0,
            explain:"“Boring” describe algo que causa aburrimiento; “bored” describe a la persona que lo siente.",
            examples:[
              {en:"The movie is boring.", es:"La película es aburrida."},
              {en:"I am bored during boring movies.", es:"Me aburro durante las películas aburridas."}
            ]},
          { id:'g-avanzado7-edng-2', translation:"Estoy muy interesado en este tema.", type:'fill', sentence:["I","am","very","___","in","this","topic","."], blankIndex:3,
            bank:["interested","interesting","interest"], correct:"interested",
            explain:"Para describir cómo se siente una persona, usamos “-ed”: “interested”.",
            examples:[
              {en:"I am very interested in this topic.", es:"Estoy muy interesado en este tema."},
              {en:"She is interested in art.", es:"Ella está interesada en el arte."}
            ]},
          { id:'g-avanzado7-edng-3', translation:"¿Cuál oración describe correctamente una noticia que sorprende a la gente?", type:'choice', prompt:"Which sentence correctly describes news that surprises people?",
            options:["The news is surprising.","The news is surprised.","The news surprise."], correct:0,
            explain:"“Surprising” describe algo que causa sorpresa.",
            examples:[
              {en:"The news is surprising.", es:"La noticia es sorprendente."},
              {en:"Everyone was surprised by the news.", es:"Todos quedaron sorprendidos por la noticia."}
            ]},
          { id:'g-avanzado7-edng-4', translation:"Estoy cansado después de un día agotador.", type:'error', wrong:"I am tiring after an exhausting day.", wrongWord:"tiring",
            right:"I am tired after an exhausting day.", rightWord:"tired",
            explain:"La persona se siente “tired” (cansada); el día es “exhausting” (agotador, causa cansancio).",
            examples:[
              {en:"I am tired after an exhausting day.", es:"Estoy cansado después de un día agotador."},
              {en:"This job is exhausting.", es:"Este trabajo es agotador."}
            ]}
        ]
      },
      {
        topic: 'Oraciones enfáticas con "It is... that" (cleft sentences)',
        items: [
          { id:'g-avanzado7-cleft-1', translation:"¿Cómo enfatizas que fue Ana quien resolvió el problema?", type:'choice', prompt:"How do you emphasize that it was Ana who solved the problem?",
            options:["It was Ana who solved the problem.","Ana was who solved the problem.","It Ana solved the problem."], correct:0,
            explain:"La estructura enfática es “It was ___ who/that ___”.",
            examples:[
              {en:"It was Ana who solved the problem.", es:"Fue Ana quien resolvió el problema."},
              {en:"It was the manager who called the meeting.", es:"Fue el gerente quien convocó la reunión."}
            ]},
          { id:'g-avanzado7-cleft-2', translation:"Es la falta de tiempo lo que causa el problema.", type:'fill', sentence:["It","is","the","lack","of","time","___","causes","the","problem","."], blankIndex:6,
            bank:["that","which","what"], correct:"that",
            explain:"En esta estructura enfática usamos “that” para introducir la cláusula.",
            examples:[
              {en:"It is the lack of time that causes the problem.", es:"Es la falta de tiempo lo que causa el problema."},
              {en:"It is honesty that matters most.", es:"Es la honestidad lo que más importa."}
            ]},
          { id:'g-avanzado7-cleft-3', translation:"¿Cuál oración enfatiza correctamente el lugar donde ocurrió algo?", type:'choice', prompt:"Which sentence correctly emphasizes where something happened?",
            options:["It was in Paris that they met.","It was Paris where they met that.","In Paris it was that they met."], correct:0,
            explain:"La estructura correcta es “It was in Paris that they met.”",
            examples:[
              {en:"It was in Paris that they met.", es:"Fue en París donde se conocieron."},
              {en:"It was on Monday that the decision was made.", es:"Fue el lunes cuando se tomó la decisión."}
            ]},
          { id:'g-avanzado7-cleft-4', translation:"Fue el cliente quien se quejó, no el equipo.", type:'error', wrong:"It was the client which complained, not the team.", wrongWord:"which",
            right:"It was the client who complained, not the team.", rightWord:"who",
            explain:"Para personas usamos “who”, no “which”.",
            examples:[
              {en:"It was the client who complained, not the team.", es:"Fue el cliente quien se quejó, no el equipo."},
              {en:"It was the teacher who noticed the mistake.", es:"Fue el maestro quien notó el error."}
            ]}
        ]
      }
    ]
  ,
  [
 {
  "topic": "Quiet vs Quite vs Quit",
  "items": [
   {
    "id": "g-avanzado8-quietquite-1",
    "translation": "Por favor, guarda silencio en la biblioteca.",
    "type": "choice",
    "prompt": "Please be ___ in the library.",
    "options": [
     "quiet",
     "quite",
     "quit"
    ],
    "correct": 0,
    "explain": "“Quiet” significa silencioso, tranquilo.",
    "examples": [
     {
      "en": "Please be quiet in the library.",
      "es": "Por favor, guarda silencio en la biblioteca."
     },
     {
      "en": "The room was very quiet.",
      "es": "La habitación estaba muy silenciosa."
     }
    ]
   },
   {
    "id": "g-avanzado8-quietquite-2",
    "translation": "Estoy bastante cansado hoy.",
    "type": "fill",
    "sentence": [
     "I",
     "am",
     "___",
     "tired",
     "today",
     "."
    ],
    "blankIndex": 2,
    "bank": [
     "quite",
     "quiet",
     "quit"
    ],
    "correct": "quite",
    "explain": "“Quite” significa bastante, un adverbio de grado.",
    "examples": [
     {
      "en": "I am quite tired today.",
      "es": "Estoy bastante cansado hoy."
     },
     {
      "en": "It's quite cold outside.",
      "es": "Hace bastante frío afuera."
     }
    ]
   },
   {
    "id": "g-avanzado8-quietquite-3",
    "translation": "Él renunció a su trabajo el mes pasado.",
    "type": "choice",
    "prompt": "He ___ his job last month.",
    "options": [
     "quit",
     "quiet",
     "quite"
    ],
    "correct": 0,
    "explain": "“Quit” es el verbo dejar/renunciar (pasado y presente tienen la misma forma).",
    "examples": [
     {
      "en": "He quit his job last month.",
      "es": "Él renunció a su trabajo el mes pasado."
     },
     {
      "en": "She wants to quit smoking.",
      "es": "Ella quiere dejar de fumar."
     }
    ]
   },
   {
    "id": "g-avanzado8-quietquite-4",
    "translation": "La calle estaba bastante tranquila esta noche.",
    "type": "error",
    "wrong": "The street was quit quiet tonight.",
    "wrongWord": "quit",
    "right": "The street was quite quiet tonight.",
    "rightWord": "quite",
    "explain": "Se necesita “quite” (bastante) para modificar el adjetivo “quiet” (tranquila), no “quit” (renunciar).",
    "examples": [
     {
      "en": "The street was quite quiet tonight.",
      "es": "La calle estaba bastante tranquila esta noche."
     },
     {
      "en": "She was quite quiet during the meeting.",
      "es": "Ella estuvo bastante callada durante la reunión."
     }
    ]
   }
  ]
 },
 {
  "topic": "Farther vs Further",
  "items": [
   {
    "id": "g-avanzado8-fartherfurther-1",
    "translation": "El pueblo está más lejos que la ciudad.",
    "type": "choice",
    "prompt": "The village is ___ than the city.",
    "options": [
     "farther",
     "further",
     "father"
    ],
    "correct": 0,
    "explain": "“Farther” se usa para distancia física.",
    "examples": [
     {
      "en": "The village is farther than the city.",
      "es": "El pueblo está más lejos que la ciudad."
     },
     {
      "en": "We walked farther than planned.",
      "es": "Caminamos más lejos de lo planeado."
     }
    ]
   },
   {
    "id": "g-avanzado8-fartherfurther-2",
    "translation": "Necesitamos más información antes de decidir.",
    "type": "fill",
    "sentence": [
     "We",
     "need",
     "___",
     "information",
     "before",
     "deciding",
     "."
    ],
    "blankIndex": 2,
    "bank": [
     "further",
     "farther",
     "father"
    ],
    "correct": "further",
    "explain": "“Further” se usa para ideas abstractas, como más información.",
    "examples": [
     {
      "en": "We need further information before deciding.",
      "es": "Necesitamos más información antes de decidir."
     },
     {
      "en": "Let's discuss this further.",
      "es": "Discutamos esto más a fondo."
     }
    ]
   },
   {
    "id": "g-avanzado8-fartherfurther-3",
    "translation": "No podemos avanzar más lejos sin un mapa.",
    "type": "choice",
    "prompt": "We cannot go any ___ without a map.",
    "options": [
     "farther",
     "further",
     "farthest"
    ],
    "correct": 0,
    "explain": "Cuando se habla de distancia real (avanzar en el camino), se prefiere “farther”.",
    "examples": [
     {
      "en": "We cannot go any farther without a map.",
      "es": "No podemos avanzar más lejos sin un mapa."
     },
     {
      "en": "How much farther is the beach?",
      "es": "¿Qué tan lejos está la playa?"
     }
    ]
   },
   {
    "id": "g-avanzado8-fartherfurther-4",
    "translation": "El proyecto necesita más desarrollo.",
    "type": "error",
    "wrong": "The project needs farther development.",
    "wrongWord": "farther",
    "right": "The project needs further development.",
    "rightWord": "further",
    "explain": "“Development” es una idea abstracta, no una distancia física, así que se usa “further”.",
    "examples": [
     {
      "en": "The project needs further development.",
      "es": "El proyecto necesita más desarrollo."
     },
     {
      "en": "No further questions, thank you.",
      "es": "No más preguntas, gracias."
     }
    ]
   }
  ]
 }
],
    [
      {
        topic: "\"Lose\" vs \"Loose\"",
        items: [
          { id:'g-avanzado10-1',
            translation:"Por favor no pierdas tu pasaporte otra vez.",
            type:'choice',
            prompt:"Please don't ___ your passport again.",
            options:["lose","loose"],
            correct:0,
            explain:"“Lose” es un verbo: perder algo.",
              examples:[
              {en:"Don't lose your passport.", es:"No pierdas tu pasaporte."},
              {en:"He hates to lose.", es:"Él odia perder."}
            ]},
          { id:'g-avanzado10-2',
            translation:"Mis zapatos se sienten sueltos hoy.",
            type:'choice',
            prompt:"These pants are too ___ for me.",
            options:["loose","lose"],
            correct:0,
            explain:"“Loose” es un adjetivo: suelto, flojo.",
              examples:[
              {en:"My shoes feel loose today.", es:"Mis zapatos se sienten sueltos hoy."},
              {en:"The screw is loose.", es:"El tornillo está flojo."}
            ]},
          { id:'g-avanzado10-3',
            translation:"No quiero perder el juego.",
            type:'fill',
            sentence:["I","don't","want","to","___","the","game","."],
            blankIndex:4,
            bank:["lose","loose"],
            correct:"lose",
            explain:"“Lose” es el verbo perder.",
              examples:[
              {en:"I don't want to lose the game.", es:"No quiero perder el juego."},
              {en:"We can't afford to lose this client.", es:"No podemos darnos el lujo de perder a este cliente."}
            ]},
          { id:'g-avanzado10-4',
            translation:"Siempre pierdo mis llaves.",
            type:'error',
            wrong:"I always loose my keys.",
            wrongWord:"loose",
            right:"I always lose my keys.",
            rightWord:"lose",
            explain:"Aquí se necesita el verbo “lose” (perder), no el adjetivo “loose”.",
              examples:[
              {en:"I always lose my keys.", es:"Siempre pierdo mis llaves."},
              {en:"She never loses her temper.", es:"Ella nunca pierde la calma."}
            ]}
        ]
      },
      {
        topic: "\"Beside\" vs \"Besides\"",
        items: [
          { id:'g-avanzado10-5',
            translation:"Ella se sentó junto a mí durante el vuelo.",
            type:'choice',
            prompt:"She sat ___ me during the flight.",
            options:["beside","besides"],
            correct:0,
            explain:"“Beside” significa “al lado de”.",
              examples:[
              {en:"She sat beside me.", es:"Ella se sentó a mi lado."},
              {en:"The dog sleeps beside the bed.", es:"El perro duerme al lado de la cama."}
            ]},
          { id:'g-avanzado10-6',
            translation:"Además del costo, el proyecto también genera preocupaciones de seguridad.",
            type:'choice',
            prompt:"___ the cost, the project also raises safety concerns.",
            options:["Besides","Beside"],
            correct:0,
            explain:"“Besides” significa “además de”.",
              examples:[
              {en:"Besides the cost, timing is an issue.", es:"Además del costo, el tiempo es un problema."},
              {en:"Besides English, she speaks French.", es:"Además del inglés, ella habla francés."}
            ]},
          { id:'g-avanzado10-7',
            translation:"Además de ser caro, el hotel también estaba lejos.",
            type:'error',
            wrong:"Beside being expensive, the hotel was also far away.",
            wrongWord:"Beside",
            right:"Besides being expensive, the hotel was also far away.",
            rightWord:"Besides",
            explain:"Para agregar una idea (además de), se usa “besides”, no “beside”.",
              examples:[
              {en:"Besides being expensive, it was far away.", es:"Además de ser caro, estaba lejos."},
              {en:"Besides working, she studies at night.", es:"Además de trabajar, ella estudia de noche."}
            ]}
        ]
      },
      {
        topic: "\"Lay\" vs \"Lie\"",
        items: [
          { id:'g-avanzado10-8',
            translation:"Necesito recostarme un rato.",
            type:'choice',
            prompt:"I need to ___ down for a while.",
            options:["lie","lay"],
            correct:0,
            explain:"“Lie” (lie/lay/lain) significa recostarse uno mismo.",
              examples:[
              {en:"I need to lie down.", es:"Necesito recostarme."},
              {en:"He lay down and rested.", es:"Él se recostó y descansó."}
            ]},
          { id:'g-avanzado10-9',
            translation:"Por favor pon los papeles en el escritorio.",
            type:'choice',
            prompt:"Please ___ the papers on the desk.",
            options:["lay","lie"],
            correct:0,
            explain:"“Lay” (lay/laid/laid) significa poner algo en un lugar; necesita un objeto.",
              examples:[
              {en:"Please lay the papers there.", es:"Por favor pon los papeles ahí."},
              {en:"She laid the baby in the crib.", es:"Ella acostó al bebé en la cuna."}
            ]},
          { id:'g-avanzado10-10',
            translation:"Voy a recostarme para una siesta.",
            type:'error',
            wrong:"I am going to lay down for a nap.",
            wrongWord:"lay",
            right:"I am going to lie down for a nap.",
            rightWord:"lie",
            explain:"Para recostarse uno mismo (sin objeto), se usa “lie”, no “lay”.",
              examples:[
              {en:"I'm going to lie down.", es:"Voy a recostarme."},
              {en:"He lies on the couch every afternoon.", es:"Él se recuesta en el sofá cada tarde."}
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
  principiante: [
    [
      { id:'v-principiante-1', word:'Cat', translation:'Gato · animal doméstico que dice miau',
        examples:[{en:"I have a cat.", es:"Tengo un gato."},{en:"The cat is sleeping.", es:"El gato está durmiendo."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"animal doméstico que dice miau\"?", options:["cat","dog","bird"], correct:0, explain:"“Cat” es gato." } },
      { id:'v-principiante-2', word:'Dog', translation:'Perro · animal doméstico que dice guau',
        examples:[{en:"I have a dog.", es:"Tengo un perro."},{en:"The dog is big.", es:"El perro es grande."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"animal doméstico que dice guau\"?", options:["dog","cat","fish"], correct:0, explain:"“Dog” es perro." } },
      { id:'v-principiante-3', word:'House', translation:'Casa · donde vives',
        examples:[{en:"My house is big.", es:"Mi casa es grande."},{en:"This is my house.", es:"Esta es mi casa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"donde vives\"?", options:["house","school","car"], correct:0, explain:"“House” es casa." } },
      { id:'v-principiante-4', word:'Water', translation:'Agua · lo que tomas cuando tienes sed',
        examples:[{en:"I drink water every day.", es:"Tomo agua todos los días."},{en:"The water is cold.", es:"El agua está fría."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que tomas cuando tienes sed\"?", options:["water","milk","bread"], correct:0, explain:"“Water” es agua." } },
      { id:'v-principiante-5', word:'Book', translation:'Libro · lo que lees',
        examples:[{en:"I have two books.", es:"Tengo dos libros."},{en:"This book is good.", es:"Este libro es bueno."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que lees\"?", options:["book","pen","table"], correct:0, explain:"“Book” es libro." } },
      { id:'v-principiante-6', word:'Table', translation:'Mesa · mueble donde comes o escribes',
        examples:[{en:"The book is on the table.", es:"El libro está en la mesa."},{en:"We eat at the table.", es:"Comemos en la mesa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"mueble donde comes o escribes\"?", options:["table","chair","door"], correct:0, explain:"“Table” es mesa." } },
      { id:'v-principiante-7', word:'Chair', translation:'Silla · mueble donde te sientas',
        examples:[{en:"Sit on the chair.", es:"Siéntate en la silla."},{en:"The chair is red.", es:"La silla es roja."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"mueble donde te sientas\"?", options:["chair","table","window"], correct:0, explain:"“Chair” es silla." } },
      { id:'v-principiante-8', word:'Hello', translation:'Hola · lo que dices para saludar',
        examples:[{en:"Hello! My name is Ana.", es:"¡Hola! Me llamo Ana."},{en:"Hello, how are you?", es:"Hola, ¿cómo estás?"}],
        quiz:{ prompt:"¿Qué palabra usas para saludar?", options:["Hello","Goodbye","Please"], correct:0, explain:"“Hello” es el saludo básico." } }
    ],
    [
      { id:'v-principiante2-1', word:'Family', translation:'Familia · tus padres, hermanos, etc.',
        examples:[{en:"I love my family.", es:"Amo a mi familia."},{en:"My family is big.", es:"Mi familia es grande."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"tus padres, hermanos, etc.\"?", options:["family","friend","school"], correct:0, explain:"“Family” es familia." } },
      { id:'v-principiante2-2', word:'Mother', translation:'Madre · tu mamá',
        examples:[{en:"This is my mother.", es:"Esta es mi mamá."},{en:"My mother is kind.", es:"Mi mamá es amable."}],
        quiz:{ prompt:"¿Qué palabra significa \"mamá\"?", options:["Mother","Father","Sister"], correct:0, explain:"“Mother” es mamá." } },
      { id:'v-principiante2-3', word:'Father', translation:'Padre · tu papá',
        examples:[{en:"This is my father.", es:"Este es mi papá."},{en:"My father works a lot.", es:"Mi papá trabaja mucho."}],
        quiz:{ prompt:"¿Qué palabra significa \"papa\"?", options:["Father","Mother","Brother"], correct:0, explain:"“Father” es papá." } },
      { id:'v-principiante2-4', word:'Red', translation:'Rojo · color de una manzana o un tomate',
        examples:[{en:"The apple is red.", es:"La manzana es roja."},{en:"I like the red car.", es:"Me gusta el carro rojo."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"color de una manzana o un tomate\"?", options:["red","blue","yellow"], correct:0, explain:"“Red” es rojo." } },
      { id:'v-principiante2-5', word:'Blue', translation:'Azul · color del cielo',
        examples:[{en:"The sky is blue.", es:"El cielo es azul."},{en:"My shirt is blue.", es:"Mi camisa es azul."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"color del cielo\"?", options:["blue","green","red"], correct:0, explain:"“Blue” es azul." } },
      { id:'v-principiante2-6', word:'One', translation:'Uno · el número 1',
        examples:[{en:"I have one dog.", es:"Tengo un perro."},{en:"One, two, three.", es:"Uno, dos, tres."}],
        quiz:{ prompt:"¿Qué palabra es el número 1?", options:["One","Two","Ten"], correct:0, explain:"“One” es uno." } },
      { id:'v-principiante2-7', word:'Two', translation:'Dos · el número 2',
        examples:[{en:"I have two cats.", es:"Tengo dos gatos."},{en:"Two plus two is four.", es:"Dos más dos es cuatro."}],
        quiz:{ prompt:"¿Qué palabra es el número 2?", options:["Two","Three","One"], correct:0, explain:"“Two” es dos." } },
      { id:'v-principiante2-8', word:'School', translation:'Escuela · donde estudias',
        examples:[{en:"I go to school every day.", es:"Voy a la escuela todos los días."},{en:"My school is big.", es:"Mi escuela es grande."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"donde estudias\"?", options:["school","house","store"], correct:0, explain:"“School” es escuela." } }
    ]
  ,

    [
      { id:'v-principiante3-1', word:'Sun', translation:'Sol · la estrella que da luz de día',
        examples:[{en:"The sun is very bright.", es:"El sol es muy brillante."},{en:"We see the sun during the day.", es:"Vemos el sol durante el día."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"la estrella que da luz de día\"?", options:["sun","moon","star"], correct:0, explain:"“Sun” es el sol." } },
      { id:'v-principiante3-2', word:'Moon', translation:'Luna · lo que vemos en el cielo de noche',
        examples:[{en:"The moon is beautiful tonight.", es:"La luna está hermosa esta noche."},{en:"We can see the moon at night.", es:"Podemos ver la luna de noche."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que vemos en el cielo de noche\"?", options:["moon","sun","cloud"], correct:0, explain:"“Moon” es la luna." } },
      { id:'v-principiante3-3', word:'Bird', translation:'Pájaro · animal que vuela y canta',
        examples:[{en:"The bird is singing.", es:"El pájaro está cantando."},{en:"I see a small bird.", es:"Veo un pájaro pequeño."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"animal que vuela y canta\"?", options:["bird","fish","cat"], correct:0, explain:"“Bird” es pájaro." } },
      { id:'v-principiante3-4', word:'Milk', translation:'Leche · lo que tomas en el desayuno, blanco',
        examples:[{en:"I drink milk every morning.", es:"Tomo leche todas las mañanas."},{en:"The milk is cold.", es:"La leche está fría."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que tomas en el desayuno, blanco\"?", options:["milk","water","juice"], correct:0, explain:"“Milk” es leche." } },
      { id:'v-principiante3-5', word:'Bread', translation:'Pan · lo que comes con mantequilla',
        examples:[{en:"I eat bread for breakfast.", es:"Como pan en el desayuno."},{en:"The bread is fresh.", es:"El pan está fresco."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que comes con mantequilla\"?", options:["bread","cheese","rice"], correct:0, explain:"“Bread” es pan." } },
      { id:'v-principiante3-6', word:'Big', translation:'Grande · lo opuesto de pequeño',
        examples:[{en:"The house is big.", es:"La casa es grande."},{en:"My dog is big.", es:"Mi perro es grande."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo opuesto de pequeño\"?", options:["big","small","tall"], correct:0, explain:"“Big” es grande." } },
      { id:'v-principiante3-7', word:'Small', translation:'Pequeño · lo opuesto de grande',
        examples:[{en:"The cat is small.", es:"El gato es pequeño."},{en:"I have a small house.", es:"Tengo una casa pequeña."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo opuesto de grande\"?", options:["small","big","long"], correct:0, explain:"“Small” es pequeño." } },
      { id:'v-principiante3-8', word:'Happy', translation:'Feliz · te sientes bien y contento',
        examples:[{en:"She is happy today.", es:"Ella está feliz hoy."},{en:"I feel happy.", es:"Me siento feliz."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"te sientes bien y contento\"?", options:["happy","sad","tired"], correct:0, explain:"“Happy” es feliz." } }
    ]
  ,
  [
 {
  "id": "v-principiante4-1",
  "word": "Buy",
  "translation": "Comprar · dar dinero para obtener algo",
  "examples": [
   {
    "en": "I want to buy a book.",
    "es": "Quiero comprar un libro."
   },
   {
    "en": "She buys milk every day.",
    "es": "Ella compra leche todos los días."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"dar dinero para obtener algo\"?",
   "options": [
    "buy",
    "by",
    "sell"
   ],
   "correct": 0,
   "explain": "“Buy” es comprar."
  }
 },
 {
  "id": "v-principiante4-2",
  "word": "By",
  "translation": "Por / cerca de · una palabra pequeña que indica cercanía o medio",
  "examples": [
   {
    "en": "The book is by the window.",
    "es": "El libro está cerca de la ventana."
   },
   {
    "en": "I go to school by bus.",
    "es": "Voy a la escuela en bus."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"cerca de\" o \"por medio de\"?",
   "options": [
    "by",
    "buy",
    "bye"
   ],
   "correct": 0,
   "explain": "“By” significa por o cerca de."
  }
 },
 {
  "id": "v-principiante4-3",
  "word": "Sea",
  "translation": "Mar · agua grande y salada",
  "examples": [
   {
    "en": "We swim in the sea.",
    "es": "Nadamos en el mar."
   },
   {
    "en": "The sea is blue.",
    "es": "El mar es azul."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"agua grande y salada\"?",
   "options": [
    "sea",
    "see",
    "lake"
   ],
   "correct": 0,
   "explain": "“Sea” es el mar."
  }
 },
 {
  "id": "v-principiante4-4",
  "word": "See",
  "translation": "Ver · usar los ojos para mirar algo",
  "examples": [
   {
    "en": "I can see the moon.",
    "es": "Puedo ver la luna."
   },
   {
    "en": "Do you see the bird?",
    "es": "¿Ves al pájaro?"
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"usar los ojos para mirar algo\"?",
   "options": [
    "see",
    "sea",
    "look"
   ],
   "correct": 0,
   "explain": "“See” es ver."
  }
 },
 {
  "id": "v-principiante4-5",
  "word": "Rain",
  "translation": "Lluvia · agua que cae del cielo",
  "examples": [
   {
    "en": "I like the rain.",
    "es": "Me gusta la lluvia."
   },
   {
    "en": "It will rain today.",
    "es": "Va a llover hoy."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"agua que cae del cielo\"?",
   "options": [
    "rain",
    "snow",
    "sun"
   ],
   "correct": 0,
   "explain": "“Rain” es lluvia."
  }
 },
 {
  "id": "v-principiante4-6",
  "word": "Snow",
  "translation": "Nieve · agua blanca y fría que cae en invierno",
  "examples": [
   {
    "en": "The snow is white.",
    "es": "La nieve es blanca."
   },
   {
    "en": "We play in the snow.",
    "es": "Jugamos en la nieve."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"agua blanca y fría que cae en invierno\"?",
   "options": [
    "snow",
    "rain",
    "cloud"
   ],
   "correct": 0,
   "explain": "“Snow” es nieve."
  }
 },
 {
  "id": "v-principiante4-7",
  "word": "Cold",
  "translation": "Frío · temperatura baja",
  "examples": [
   {
    "en": "The water is cold.",
    "es": "El agua está fría."
   },
   {
    "en": "It is cold today.",
    "es": "Hoy hace frío."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"temperatura baja\"?",
   "options": [
    "cold",
    "hot",
    "warm"
   ],
   "correct": 0,
   "explain": "“Cold” es frío."
  }
 },
 {
  "id": "v-principiante4-8",
  "word": "Hot",
  "translation": "Caliente · temperatura alta",
  "examples": [
   {
    "en": "The soup is hot.",
    "es": "La sopa está caliente."
   },
   {
    "en": "Summer days are hot.",
    "es": "Los días de verano son calientes."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"temperatura alta\"?",
   "options": [
    "hot",
    "cold",
    "cool"
   ],
   "correct": 0,
   "explain": "“Hot” es caliente."
  }
 }
],
    [
      { id:'v-principiante6-1', word:'Egg', translation:'Huevo · lo que pone una gallina',
        examples:[{en:"I eat an egg for breakfast.", es:"Como un huevo en el desayuno."},{en:"The egg is white.", es:"El huevo es blanco."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que pone una gallina\"?", options:["egg","milk","bread"], correct:0, explain:"“Egg” es huevo." } },
      { id:'v-principiante6-2', word:'Shoe', translation:'Zapato · lo que usas en los pies',
        examples:[{en:"I need new shoes.", es:"Necesito zapatos nuevos."},{en:"Her shoe is red.", es:"Su zapato es rojo."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que usas en los pies\"?", options:["shoe","shirt","hat"], correct:0, explain:"“Shoe” es zapato." } },
      { id:'v-principiante6-3', word:'Shirt', translation:'Camisa · ropa para el torso',
        examples:[{en:"He is wearing a blue shirt.", es:"Él lleva una camisa azul."},{en:"My shirt is clean.", es:"Mi camisa está limpia."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"ropa para el torso\"?", options:["shirt","shoe","pants"], correct:0, explain:"“Shirt” es camisa." } },
      { id:'v-principiante6-4', word:'Rain', translation:'Lluvia · agua que cae del cielo',
        examples:[{en:"I hear the rain outside.", es:"Escucho la lluvia afuera."},{en:"It's going to rain today.", es:"Va a llover hoy."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"agua que cae del cielo\"?", options:["rain","snow","wind"], correct:0, explain:"“Rain” es lluvia." } },
      { id:'v-principiante6-5', word:'Door', translation:'Puerta · por donde entras a un lugar',
        examples:[{en:"Close the door, please.", es:"Cierra la puerta, por favor."},{en:"The door is open.", es:"La puerta está abierta."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"por donde entras a un lugar\"?", options:["door","window","wall"], correct:0, explain:"“Door” es puerta." } },
      { id:'v-principiante6-6', word:'Window', translation:'Ventana · por donde entra la luz',
        examples:[{en:"Open the window.", es:"Abre la ventana."},{en:"The window is big.", es:"La ventana es grande."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"por donde entra la luz\"?", options:["window","door","roof"], correct:0, explain:"“Window” es ventana." } },
      { id:'v-principiante6-7', word:'Apple', translation:'Manzana · fruta roja o verde',
        examples:[{en:"She eats an apple after lunch.", es:"Ella come una manzana después del almuerzo."},{en:"The apple is sweet.", es:"La manzana es dulce."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"fruta roja o verde\"?", options:["apple","orange","banana"], correct:0, explain:"“Apple” es manzana." } },
      { id:'v-principiante6-8', word:'Orange', translation:'Naranja · fruta cítrica',
        examples:[{en:"I like orange juice.", es:"Me gusta el jugo de naranja."},{en:"The orange is on the table.", es:"La naranja está en la mesa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"fruta cítrica\"?", options:["orange","apple","lemon"], correct:0, explain:"“Orange” es naranja." } },
      { id:'v-principiante6-9', word:'Banana', translation:'Plátano · fruta amarilla',
        examples:[{en:"The monkey eats a banana.", es:"El mono come un plátano."},{en:"I want a banana.", es:"Quiero un plátano."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"fruta amarilla\"?", options:["banana","apple","grape"], correct:0, explain:"“Banana” es plátano." } },
      { id:'v-principiante6-10', word:'Fish', translation:'Pescado o pez · animal que vive en el agua',
        examples:[{en:"The fish is in the water.", es:"El pez está en el agua."},{en:"I eat fish on Fridays.", es:"Como pescado los viernes."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"animal que vive en el agua\"?", options:["fish","bird","cat"], correct:0, explain:"“Fish” es pescado o pez." } }
    ]
  ],
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
    ],
    [
      { id:'v-facil4-1', word:'Receipt', translation:'Receipt · papel que prueba que compraste algo',
        examples:[{en:"Can I have the receipt, please?", es:"¿Me puede dar el recibo, por favor?"},{en:"I lost my receipt from the store.", es:"Perdí mi recibo de la tienda."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"papel que prueba que compraste algo\"?", options:["receipt","discount","change"], correct:0, explain:"“Receipt” es el recibo de compra." } },
      { id:'v-facil4-2', word:'Discount', translation:'Discount · rebaja en el precio',
        examples:[{en:"I got a 20% discount on these shoes.", es:"Me dieron un 20% de descuento en estos zapatos."},{en:"Is there a discount for students?", es:"¿Hay descuento para estudiantes?"}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"rebaja en el precio\"?", options:["discount","refund","size"], correct:0, explain:"“Discount” es una rebaja en el precio." } },
      { id:'v-facil4-3', word:'Refund', translation:'Refund · devolución del dinero pagado',
        examples:[{en:"I want a refund for this shirt.", es:"Quiero que me devuelvan el dinero por esta camisa."},{en:"They gave me a full refund.", es:"Me devolvieron todo el dinero."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"devolución del dinero pagado\"?", options:["refund","receipt","cash"], correct:0, explain:"“Refund” es cuando te devuelven el dinero." } },
      { id:'v-facil4-4', word:'Cash', translation:'Cash · dinero en efectivo',
        examples:[{en:"Do you accept cash?", es:"¿Aceptan efectivo?"},{en:"I only have cash, no card.", es:"Solo tengo efectivo, no tarjeta."}],
        quiz:{ prompt:"¿Cuál oración usa \"cash\" correctamente?", options:["Do you accept cash?","Do you accept cash of?","Do you cash accept?"], correct:0, explain:"“Cash” va después del verbo “accept”: “accept cash”." } },
      { id:'v-facil4-5', word:'Change', translation:'Change · el dinero que te devuelven al pagar',
        examples:[{en:"Here's your change.", es:"Aquí está tu cambio."},{en:"Keep the change.", es:"Quédate con el cambio."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"el dinero que te devuelven al pagar\"?", options:["change","discount","refund"], correct:0, explain:"“Change” es el cambio o vuelto que te dan." } },
      { id:'v-facil4-6', word:'Size', translation:'Size · talla o tamaño',
        examples:[{en:"What size do you wear?", es:"¿Qué talla usas?"},{en:"This shirt is the wrong size.", es:"Esta camisa es la talla equivocada."}],
        quiz:{ prompt:"¿Qué significa \"size\"?", options:["Color","Talla o tamaño","Precio"], correct:1, explain:"“Size” significa talla o tamaño." } },
      { id:'v-facil4-7', word:'Try on', translation:'Try on · probarse ropa antes de comprarla',
        examples:[{en:"Can I try on these pants?", es:"¿Puedo probarme estos pantalones?"},{en:"She tried on three dresses.", es:"Ella se probó tres vestidos."}],
        quiz:{ prompt:"¿Cuál oración usa \"try on\" correctamente?", options:["Can I try on this jacket?","Can I try this on of jacket?","Can I try on of this jacket?"], correct:0, explain:"“Try on” es una frase verbal: “try on + prenda”." } },
      { id:'v-facil4-8', word:'Checkout', translation:'Checkout · caja donde pagas en una tienda',
        examples:[{en:"The line at the checkout was long.", es:"La fila en la caja estaba larga."},{en:"Please pay at the checkout.", es:"Por favor pague en la caja."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"caja donde pagas en una tienda\"?", options:["checkout","receipt","wallet"], correct:0, explain:"“Checkout” es la caja o mostrador donde pagas." } }
    ],
    [
      { id:'v-facil5-1', word:'Thirsty', translation:'Sediento · con ganas de tomar agua',
        examples:[{en:"I'm so thirsty, can I have some water?", es:"Tengo mucha sed, ¿me das agua?"},{en:"Running makes me thirsty.", es:"Correr me da sed."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"con ganas de tomar agua\"?", options:["thirsty","hungry","tired"], correct:0, explain:"“Thirsty” es tener sed, distinto de “hungry” (hambre)." } },
      { id:'v-facil5-2', word:'Sleepy', translation:'Somnoliento · con ganas de dormir',
        examples:[{en:"I feel sleepy after lunch.", es:"Me da sueño después de almorzar."},{en:"The baby looks sleepy.", es:"El bebé se ve con sueño."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"con ganas de dormir\"?", options:["sleepy","angry","bored"], correct:0, explain:"“Sleepy” describe tener sueño o ganas de dormir." } },
      { id:'v-facil5-3', word:'Umbrella', translation:'Paraguas · objeto para protegerte de la lluvia',
        examples:[{en:"Don't forget your umbrella, it's raining.", es:"No olvides tu paraguas, está lloviendo."},{en:"I left my umbrella at the office.", es:"Dejé mi paraguas en la oficina."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"objeto para protegerte de la lluvia\"?", options:["umbrella","jacket","boots"], correct:0, explain:"“Umbrella” es el paraguas, no la ropa que usas." } },
      { id:'v-facil5-4', word:'Appointment', translation:'Cita · hora reservada para algo, como con el doctor',
        examples:[{en:"I have a doctor's appointment at three.", es:"Tengo una cita con el doctor a las tres."},{en:"Can I reschedule my appointment?", es:"¿Puedo cambiar la hora de mi cita?"}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"hora reservada con el doctor\"?", options:["appointment","invitation","reservation"], correct:0, explain:"“Appointment” es una cita reservada, como con un doctor o dentista." } },
      { id:'v-facil5-5', word:'Roommate', translation:'Compañero de cuarto · persona con quien compartes casa',
        examples:[{en:"My roommate is very quiet.", es:"Mi compañero de cuarto es muy callado."},{en:"We split the rent with our roommates.", es:"Dividimos la renta con nuestros compañeros de cuarto."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"persona con quien compartes casa\"?", options:["roommate","neighbor","stranger"], correct:0, explain:"“Roommate” vive contigo; “neighbor” vive cerca pero en otra casa." } },
      { id:'v-facil5-6', word:'Lazy', translation:'Flojo · que no quiere hacer esfuerzo',
        examples:[{en:"Don't be lazy, help me clean up.", es:"No seas flojo, ayúdame a limpiar."},{en:"It's a lazy Sunday afternoon.", es:"Es una tarde de domingo tranquila y perezosa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que no quiere hacer esfuerzo\"?", options:["lazy","busy","polite"], correct:0, explain:"“Lazy” describe a alguien sin ganas de esforzarse." } },
      { id:'v-facil5-7', word:'Excited', translation:'Emocionado · con mucho entusiasmo por algo',
        examples:[{en:"I'm so excited for the trip!", es:"¡Estoy muy emocionado por el viaje!"},{en:"She was excited about her new job.", es:"Ella estaba emocionada por su nuevo trabajo."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"con mucho entusiasmo por algo\"?", options:["excited","nervous","tired"], correct:0, explain:"“Excited” es sentir entusiasmo o emoción positiva." } },
      { id:'v-facil5-8', word:'Grocery store', translation:'Tienda de abarrotes · lugar para comprar comida',
        examples:[{en:"I need to go to the grocery store.", es:"Necesito ir a la tienda de abarrotes."},{en:"The grocery store closes at nine.", es:"La tienda de abarrotes cierra a las nueve."}],
        quiz:{ prompt:"¿Qué frase significa esto: \"lugar para comprar comida\"?", options:["grocery store","library","pharmacy"], correct:0, explain:"“Grocery store” es donde compras comida y productos del hogar." } }
    ],
    [
      { id:'v-facil6-1', word:'Blanket', translation:'Cobija · tela para taparte y no tener frío',
        examples:[{en:"I need another blanket, I'm cold.", es:"Necesito otra cobija, tengo frío."},{en:"The dog is sleeping under the blanket.", es:"El perro está durmiendo bajo la cobija."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"tela para taparte y no tener frío\"?", options:["blanket","towel","pillow"], correct:0, explain:"“Blanket” es una cobija, distinta de “towel” (toalla)." } },
      { id:'v-facil6-2', word:'Landlord', translation:'Casero · persona dueña de la casa que rentas',
        examples:[{en:"I need to call my landlord about the leak.", es:"Necesito llamar a mi casero por la fuga."},{en:"The landlord raised the rent.", es:"El casero subió la renta."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"dueño de la casa que rentas\"?", options:["landlord","roommate","neighbor"], correct:0, explain:"“Landlord” es el dueño de la propiedad que alquilas." } },
      { id:'v-facil6-3', word:'Leftovers', translation:'Sobras · comida que quedó de otra comida',
        examples:[{en:"We had leftovers for dinner.", es:"Cenamos las sobras."},{en:"Put the leftovers in the fridge.", es:"Pon las sobras en el refrigerador."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"comida que quedó de otra comida\"?", options:["leftovers","dessert","snack"], correct:0, explain:"“Leftovers” es la comida que sobra después de comer." } },
      { id:'v-facil6-4', word:'Chores', translation:'Quehaceres · tareas de la casa como limpiar',
        examples:[{en:"I have to do my chores before I go out.", es:"Tengo que hacer mis quehaceres antes de salir."},{en:"Washing dishes is one of my chores.", es:"Lavar los platos es uno de mis quehaceres."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"tareas de la casa como limpiar\"?", options:["chores","homework","errands"], correct:0, explain:"“Chores” son tareas domésticas, distintas de “homework” (tarea escolar)." } },
      { id:'v-facil6-5', word:'Alarm clock', translation:'Despertador · aparato que suena para despertarte',
        examples:[{en:"My alarm clock didn't go off this morning.", es:"Mi despertador no sonó esta mañana."},{en:"I set my alarm clock for six.", es:"Puse mi despertador a las seis."}],
        quiz:{ prompt:"¿Qué frase significa esto: \"aparato que suena para despertarte\"?", options:["alarm clock","phone","watch"], correct:0, explain:"“Alarm clock” es el aparato específico para despertarte." } },
      { id:'v-facil6-6', word:'Traffic jam', translation:'Embotellamiento · muchos carros parados en la calle',
        examples:[{en:"We were stuck in a traffic jam for an hour.", es:"Estuvimos atascados en un embotellamiento por una hora."},{en:"There's always a traffic jam at rush hour.", es:"Siempre hay embotellamiento en la hora pico."}],
        quiz:{ prompt:"¿Qué frase significa esto: \"muchos carros parados en la calle\"?", options:["traffic jam","parking lot","highway"], correct:0, explain:"“Traffic jam” describe el tráfico detenido o muy lento." } },
      { id:'v-facil6-7', word:'Babysit', translation:'Cuidar niños · quedarte a cargo de un niño por un rato',
        examples:[{en:"Can you babysit my kids tonight?", es:"¿Puedes cuidar a mis hijos esta noche?"},{en:"She babysits her neighbor's children.", es:"Ella cuida a los niños de su vecina."}],
        quiz:{ prompt:"¿Qué verbo significa esto: \"quedarte a cargo de un niño por un rato\"?", options:["babysit","adopt","teach"], correct:0, explain:"“Babysit” es cuidar niños temporalmente, no adoptarlos." } },
      { id:'v-facil6-8', word:'Errand', translation:'Mandado · pequeña tarea fuera de casa, como ir al banco',
        examples:[{en:"I have a few errands to run today.", es:"Tengo unos mandados que hacer hoy."},{en:"She's out running errands.", es:"Ella salió a hacer mandados."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"pequeña tarea fuera de casa\"?", options:["errand","chore","hobby"], correct:0, explain:"“Errand” es una tarea corta fuera de casa, como ir al banco o al correo." } }
    ]
  ,

    [
      { id:'v-facil7-1', word:'Journey', translation:'Viaje · trayecto largo de un lugar a otro',
        examples:[{en:"The journey took five hours.", es:"El viaje tomó cinco horas."},{en:"We enjoyed the journey.", es:"Disfrutamos el viaje."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"trayecto largo de un lugar a otro\"?", options:["journey","kitchen","habit"], correct:0, explain:"“Journey” es un viaje largo." } },
      { id:'v-facil7-2', word:'Punctual', translation:'Puntual · que llega a tiempo',
        examples:[{en:"He is always punctual.", es:"Él siempre es puntual."},{en:"Being punctual is important.", es:"Ser puntual es importante."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que llega a tiempo\"?", options:["punctual","late","lazy"], correct:0, explain:"“Punctual” significa puntual." } },
      { id:'v-facil7-3', word:'Reminder', translation:'Recordatorio · algo que te ayuda a no olvidar',
        examples:[{en:"I set a reminder for the meeting.", es:"Puse un recordatorio para la reunión."},{en:"Thanks for the reminder.", es:"Gracias por el recordatorio."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"algo que te ayuda a no olvidar\"?", options:["reminder","receipt","warranty"], correct:0, explain:"“Reminder” es un recordatorio." } },
      { id:'v-facil7-4', word:'Reschedule', translation:'Reprogramar · cambiar la fecha u hora de algo',
        examples:[{en:"We need to reschedule the appointment.", es:"Necesitamos reprogramar la cita."},{en:"She rescheduled the meeting.", es:"Ella reprogramó la reunión."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cambiar la fecha u hora de algo\"?", options:["reschedule","cancel","forget"], correct:0, explain:"“Reschedule” es reprogramar." } },
      { id:'v-facil7-5', word:'Voucher', translation:'Cupón / vale · papel que puedes cambiar por un descuento o producto',
        examples:[{en:"I have a voucher for this store.", es:"Tengo un cupón para esta tienda."},{en:"The voucher expires tomorrow.", es:"El cupón vence mañana."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"papel que puedes cambiar por un descuento o producto\"?", options:["voucher","receipt","wallet"], correct:0, explain:"“Voucher” es un cupón o vale." } },
      { id:'v-facil7-6', word:'Overdue', translation:'Vencido / atrasado · que ya pasó la fecha límite',
        examples:[{en:"My library book is overdue.", es:"Mi libro de la biblioteca está vencido."},{en:"The payment is overdue.", es:"El pago está atrasado."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que ya pasó la fecha límite\"?", options:["overdue","early","punctual"], correct:0, explain:"“Overdue” significa vencido o atrasado." } },
      { id:'v-facil7-7', word:'Warranty', translation:'Garantía · promesa de reparación si algo se daña',
        examples:[{en:"This phone has a two-year warranty.", es:"Este teléfono tiene garantía de dos años."},{en:"Keep the warranty in a safe place.", es:"Guarda la garantía en un lugar seguro."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"promesa de reparación si algo se daña\"?", options:["warranty","voucher","discount"], correct:0, explain:"“Warranty” es la garantía." } },
      { id:'v-facil7-8', word:'Refill', translation:'Recarga / rellenar · volver a llenar algo',
        examples:[{en:"Can I get a refill of coffee?", es:"¿Puedo tener una recarga de café?"},{en:"I need to refill my water bottle.", es:"Necesito rellenar mi botella de agua."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"volver a llenar algo\"?", options:["refill","empty","spill"], correct:0, explain:"“Refill” significa rellenar o recargar." } }
    ]
  ,
  [
 {
  "id": "v-facil8-1",
  "word": "Lend",
  "translation": "Prestar · dar algo a alguien por un tiempo",
  "examples": [
   {
    "en": "I will lend you my pen.",
    "es": "Te prestaré mi lápiz."
   },
   {
    "en": "Banks lend money.",
    "es": "Los bancos prestan dinero."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"dar algo a alguien por un tiempo\"?",
   "options": [
    "lend",
    "borrow",
    "give"
   ],
   "correct": 0,
   "explain": "“Lend” es prestar (yo lo doy)."
  }
 },
 {
  "id": "v-facil8-2",
  "word": "Then",
  "translation": "Luego / entonces · palabra que indica el siguiente momento",
  "examples": [
   {
    "en": "First eat, then sleep.",
    "es": "Primero come, luego duerme."
   },
   {
    "en": "We will go then.",
    "es": "Iremos entonces."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"luego\" o \"entonces\"?",
   "options": [
    "then",
    "than",
    "when"
   ],
   "correct": 0,
   "explain": "“Then” es luego/entonces."
  }
 },
 {
  "id": "v-facil8-3",
  "word": "Than",
  "translation": "Que · palabra usada para comparar dos cosas",
  "examples": [
   {
    "en": "She is faster than him.",
    "es": "Ella es más rápida que él."
   },
   {
    "en": "This is better than that.",
    "es": "Esto es mejor que eso."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"que\" (para comparar)?",
   "options": [
    "than",
    "then",
    "as"
   ],
   "correct": 0,
   "explain": "“Than” se usa para comparar."
  }
 },
 {
  "id": "v-facil8-4",
  "word": "Accept",
  "translation": "Aceptar · decir sí a algo",
  "examples": [
   {
    "en": "I accept your offer.",
    "es": "Acepto tu oferta."
   },
   {
    "en": "She accepted the gift.",
    "es": "Ella aceptó el regalo."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"decir sí a algo\"?",
   "options": [
    "accept",
    "except",
    "reject"
   ],
   "correct": 0,
   "explain": "“Accept” es aceptar."
  }
 },
 {
  "id": "v-facil8-5",
  "word": "Except",
  "translation": "Excepto · todo menos una cosa",
  "examples": [
   {
    "en": "Everyone came except John.",
    "es": "Todos vinieron excepto Juan."
   },
   {
    "en": "I like all fruits except bananas.",
    "es": "Me gustan todas las frutas excepto las bananas."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"todo menos una cosa\"?",
   "options": [
    "except",
    "accept",
    "expect"
   ],
   "correct": 0,
   "explain": "“Except” significa excepto."
  }
 },
 {
  "id": "v-facil8-6",
  "word": "Suggest",
  "translation": "Sugerir · dar una idea o consejo",
  "examples": [
   {
    "en": "I suggest you rest.",
    "es": "Sugiero que descanses."
   },
   {
    "en": "She suggested a new plan.",
    "es": "Ella sugirió un nuevo plan."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"dar una idea o consejo\"?",
   "options": [
    "suggest",
    "suppose",
    "explain"
   ],
   "correct": 0,
   "explain": "“Suggest” es sugerir."
  }
 },
 {
  "id": "v-facil8-7",
  "word": "Improve",
  "translation": "Mejorar · hacer algo mejor",
  "examples": [
   {
    "en": "I want to improve my English.",
    "es": "Quiero mejorar mi inglés."
   },
   {
    "en": "Practice will improve your skills.",
    "es": "La práctica mejorará tus habilidades."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"hacer algo mejor\"?",
   "options": [
    "improve",
    "impress",
    "prove"
   ],
   "correct": 0,
   "explain": "“Improve” es mejorar."
  }
 },
 {
  "id": "v-facil8-8",
  "word": "Explain",
  "translation": "Explicar · hacer que algo se entienda",
  "examples": [
   {
    "en": "Can you explain this word?",
    "es": "¿Puedes explicar esta palabra?"
   },
   {
    "en": "The teacher explained the lesson.",
    "es": "El profesor explicó la lección."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"hacer que algo se entienda\"?",
   "options": [
    "explain",
    "explore",
    "expect"
   ],
   "correct": 0,
   "explain": "“Explain” es explicar."
  }
 }
],
    [
      { id:'v-facil10-1', word:'Weather', translation:'Clima · cómo está el día (sol, lluvia, frío)',
        examples:[{en:"The weather changed suddenly.", es:"El clima cambió de repente."},{en:"What's the weather like?", es:"¿Cómo está el clima?"}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cómo está el día\"?", options:["weather","season","sky"], correct:0, explain:"“Weather” es el clima." } },
      { id:'v-facil10-2', word:'Bedroom', translation:'Habitación · cuarto donde duermes',
        examples:[{en:"My bedroom is upstairs.", es:"Mi habitación está arriba."},{en:"She cleaned her bedroom.", es:"Ella limpió su habitación."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cuarto donde duermes\"?", options:["bedroom","kitchen","bathroom"], correct:0, explain:"“Bedroom” es habitación/dormitorio." } },
      { id:'v-facil10-3', word:'Restaurant', translation:'Restaurante · lugar donde comes fuera de casa',
        examples:[{en:"We ate at a nice restaurant.", es:"Comimos en un restaurante agradable."},{en:"The restaurant is full.", es:"El restaurante está lleno."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lugar donde comes fuera de casa\"?", options:["restaurant","hotel","store"], correct:0, explain:"“Restaurant” es restaurante." } },
      { id:'v-facil10-4', word:'Vacation', translation:'Vacaciones · tiempo libre para descansar o viajar',
        examples:[{en:"We are on vacation.", es:"Estamos de vacaciones."},{en:"I need a vacation.", es:"Necesito unas vacaciones."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"tiempo libre para descansar o viajar\"?", options:["vacation","weekend","holiday season"], correct:0, explain:"“Vacation” son vacaciones." } },
      { id:'v-facil10-5', word:'Supermarket', translation:'Supermercado · tienda grande de comida',
        examples:[{en:"I buy food at the supermarket.", es:"Compro comida en el supermercado."},{en:"The supermarket is close to my house.", es:"El supermercado está cerca de mi casa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"tienda grande de comida\"?", options:["supermarket","restaurant","pharmacy"], correct:0, explain:"“Supermarket” es supermercado." } },
      { id:'v-facil10-6', word:'Medicine', translation:'Medicina · lo que tomas cuando estás enfermo',
        examples:[{en:"Take this medicine twice a day.", es:"Toma esta medicina dos veces al día."},{en:"The medicine helped my headache.", es:"La medicina ayudó con mi dolor de cabeza."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"lo que tomas cuando estás enfermo\"?", options:["medicine","food","water"], correct:0, explain:"“Medicine” es medicina." } },
      { id:'v-facil10-7', word:'Passport', translation:'Pasaporte · documento para viajar a otro país',
        examples:[{en:"Don't forget your passport.", es:"No olvides tu pasaporte."},{en:"My passport is in my bag.", es:"Mi pasaporte está en mi bolsa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"documento para viajar a otro país\"?", options:["passport","ticket","suitcase"], correct:0, explain:"“Passport” es pasaporte." } },
      { id:'v-facil10-8', word:'Schedule', translation:'Horario · plan de las cosas que vas a hacer',
        examples:[{en:"What's your schedule today?", es:"¿Cuál es tu horario hoy?"},{en:"My schedule is busy this week.", es:"Mi horario está ocupado esta semana."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"plan de las cosas que vas a hacer\"?", options:["schedule","calendar","clock"], correct:0, explain:"“Schedule” es horario." } },
      { id:'v-facil10-9', word:'Interview', translation:'Entrevista · conversación para conseguir trabajo',
        examples:[{en:"I have a job interview tomorrow.", es:"Tengo una entrevista de trabajo mañana."},{en:"The interview went well.", es:"La entrevista salió bien."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"conversación para conseguir trabajo\"?", options:["interview","meeting","conversation"], correct:0, explain:"“Interview” es entrevista." } },
      { id:'v-facil10-10', word:'Furniture', translation:'Muebles · mesas, sillas, camas, etc.',
        examples:[{en:"We bought new furniture.", es:"Compramos muebles nuevos."},{en:"The furniture is very old.", es:"Los muebles son muy viejos."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"mesas, sillas, camas, etc.\"?", options:["furniture","furniture store","house"], correct:0, explain:"“Furniture” son los muebles." } }
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
    ],
    [
      { id:'v-medio4-1', word:'Itinerary', translation:'Itinerary · plan detallado de un viaje',
        examples:[{en:"Our itinerary includes three cities.", es:"Nuestro itinerario incluye tres ciudades."},{en:"Can you send me the trip itinerary?", es:"¿Me puedes enviar el itinerario del viaje?"}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"plan detallado de un viaje\"?", options:["itinerary","luggage","departure"], correct:0, explain:"“Itinerary” es el plan del viaje." } },
      { id:'v-medio4-2', word:'Luggage', translation:'Luggage · maletas y bolsos que llevas al viajar',
        examples:[{en:"My luggage didn't arrive at the airport.", es:"Mi equipaje no llegó al aeropuerto."},{en:"We packed light luggage for the trip.", es:"Empacamos equipaje ligero para el viaje."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"maletas y bolsos que llevas al viajar\"?", options:["luggage","itinerary","souvenir"], correct:0, explain:"“Luggage” es el equipaje." } },
      { id:'v-medio4-3', word:'Layover', translation:'Layover · escala entre dos vuelos',
        examples:[{en:"We have a two-hour layover in Miami.", es:"Tenemos una escala de dos horas en Miami."},{en:"I hate long layovers.", es:"Odio las escalas largas."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"escala entre dos vuelos\"?", options:["layover","departure","currency exchange"], correct:0, explain:"“Layover” es la escala entre vuelos." } },
      { id:'v-medio4-4', word:'Accommodation', translation:'Accommodation · lugar donde te hospedas',
        examples:[{en:"We booked our accommodation online.", es:"Reservamos nuestro alojamiento en línea."},{en:"The accommodation was close to the beach.", es:"El alojamiento estaba cerca de la playa."}],
        quiz:{ prompt:"¿Cuál oración usa \"accommodation\" correctamente?", options:["We booked our accommodation online.","We booked our accommodation of online.","We accommodation booked online."], correct:0, explain:"“Accommodation” es un sustantivo incontable en inglés (sin “s”)." } },
      { id:'v-medio4-5', word:'Departure', translation:'Departure · el momento de salir o partir',
        examples:[{en:"Our departure time is 6 a.m.", es:"Nuestra hora de salida es las 6 a.m."},{en:"Check the departure board for your gate.", es:"Revisa el tablero de salidas para tu puerta."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"el momento de salir o partir\"?", options:["departure","arrival","layover"], correct:0, explain:"“Departure” es la salida; lo opuesto es “arrival”." } },
      { id:'v-medio4-6', word:'Currency exchange', translation:'Currency exchange · lugar o proceso para cambiar dinero de un país a otro',
        examples:[{en:"There's a currency exchange at the airport.", es:"Hay una casa de cambio en el aeropuerto."},{en:"I need to do a currency exchange before the trip.", es:"Necesito cambiar dinero antes del viaje."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cambiar dinero de un país a otro\"?", options:["currency exchange","refund","discount"], correct:0, explain:"“Currency exchange” es cambio de moneda." } },
      { id:'v-medio4-7', word:'Souvenir', translation:'Souvenir · recuerdo que compras en un viaje',
        examples:[{en:"I bought a souvenir for my sister.", es:"Le compré un recuerdo a mi hermana."},{en:"These souvenirs are too expensive.", es:"Estos recuerdos son muy caros."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"recuerdo que compras en un viaje\"?", options:["souvenir","luggage","itinerary"], correct:0, explain:"“Souvenir” es un recuerdo de viaje." } },
      { id:'v-medio4-8', word:'Delayed', translation:'Delayed · retrasado, que no llega a tiempo',
        examples:[{en:"Our flight was delayed by two hours.", es:"Nuestro vuelo se retrasó dos horas."},{en:"The train is delayed again.", es:"El tren está retrasado otra vez."}],
        quiz:{ prompt:"¿Cuál oración usa \"delayed\" correctamente?", options:["Our flight was delayed.","Our flight was delayed of.","Our flight delayed was."], correct:0, explain:"“Delayed” funciona como adjetivo después de “was/were”." } }
    ],
    [
      { id:'v-medio5-1', word:'Perseverance', translation:'Perseverancia · seguir intentando a pesar de las dificultades',
        examples:[{en:"Her perseverance finally paid off.", es:"Su perseverancia finalmente dio frutos."},{en:"Success requires perseverance.", es:"El éxito requiere perseverancia."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"seguir intentando a pesar de las dificultades\"?", options:["perseverance","laziness","luck"], correct:0, explain:"“Perseverance” es la capacidad de persistir ante los obstáculos." } },
      { id:'v-medio5-2', word:'Skeptical', translation:'Escéptico · que duda de algo',
        examples:[{en:"I'm skeptical about that claim.", es:"Soy escéptico sobre esa afirmación."},{en:"She remained skeptical of his excuse.", es:"Ella siguió dudando de su excusa."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que duda de algo\"?", options:["skeptical","confident","curious"], correct:0, explain:"“Skeptical” es tener dudas o no creer fácilmente." } },
      { id:'v-medio5-3', word:'Compromise', translation:'Compromiso/acuerdo · ceder algo para llegar a un acuerdo',
        examples:[{en:"We reached a compromise after hours of talking.", es:"Llegamos a un acuerdo después de horas de hablar."},{en:"Marriage requires compromise.", es:"El matrimonio requiere ceder cosas."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"ceder algo para llegar a un acuerdo\"?", options:["compromise","conflict","victory"], correct:0, explain:"“Compromise” es cuando ambas partes ceden algo para llegar a un acuerdo." } },
      { id:'v-medio5-4', word:'Coincidence', translation:'Coincidencia · cuando dos cosas pasan al mismo tiempo sin planearlo',
        examples:[{en:"What a coincidence seeing you here!", es:"¡Qué coincidencia verte aquí!"},{en:"It was just a coincidence.", es:"Fue solo una coincidencia."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cuando dos cosas pasan sin planearlo\"?", options:["coincidence","tradition","routine"], correct:0, explain:"“Coincidence” es un evento casual, no planeado." } },
      { id:'v-medio5-5', word:'Overreact', translation:'Reaccionar exageradamente · responder de forma más fuerte de lo necesario',
        examples:[{en:"Don't overreact, it's not a big deal.", es:"No reacciones exageradamente, no es gran cosa."},{en:"He tends to overreact to criticism.", es:"Él tiende a reaccionar exageradamente a las críticas."}],
        quiz:{ prompt:"¿Qué verbo significa esto: \"responder de forma más fuerte de lo necesario\"?", options:["overreact","relax","ignore"], correct:0, explain:"“Overreact” es reaccionar de manera exagerada." } },
      { id:'v-medio5-6', word:'Empathy', translation:'Empatía · entender y compartir lo que siente otra persona',
        examples:[{en:"She showed a lot of empathy toward the patient.", es:"Ella mostró mucha empatía hacia el paciente."},{en:"Empathy is key in customer service.", es:"La empatía es clave en el servicio al cliente."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"entender y compartir lo que siente otro\"?", options:["empathy","jealousy","pride"], correct:0, explain:"“Empathy” es ponerte en el lugar del otro y sentir lo que siente." } },
      { id:'v-medio5-7', word:'Procrastinate', translation:'Postergar · dejar algo para después sin necesidad',
        examples:[{en:"I always procrastinate before exams.", es:"Siempre postergo las cosas antes de los exámenes."},{en:"Stop procrastinating and start working.", es:"Deja de postergar y ponte a trabajar."}],
        quiz:{ prompt:"¿Qué verbo significa esto: \"dejar algo para después sin necesidad\"?", options:["procrastinate","hurry","finish"], correct:0, explain:"“Procrastinate” es posponer tareas innecesariamente." } },
      { id:'v-medio5-8', word:'Reassure', translation:'Tranquilizar · decirle a alguien que todo estará bien',
        examples:[{en:"She reassured me that everything would be fine.", es:"Ella me tranquilizó diciendo que todo estaría bien."},{en:"He reassured the team about the deadline.", es:"Él tranquilizó al equipo sobre la fecha límite."}],
        quiz:{ prompt:"¿Qué verbo significa esto: \"decirle a alguien que todo estará bien\"?", options:["reassure","worry","confuse"], correct:0, explain:"“Reassure” es dar confianza o calmar la preocupación de alguien." } }
    ],
    [
      { id:'v-medio6-1', word:'Colleague', translation:'Colega · compañero de trabajo',
        examples:[{en:"I had lunch with a colleague.", es:"Almorcé con un colega."},{en:"My colleagues are very supportive.", es:"Mis colegas son muy solidarios."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"compañero de trabajo\"?", options:["colleague","boss","client"], correct:0, explain:"“Colleague” es un compañero de trabajo, no tu jefe ni tu cliente." } },
      { id:'v-medio6-2', word:'Promotion', translation:'Ascenso · subir de puesto en el trabajo',
        examples:[{en:"She got a promotion last month.", es:"Ella tuvo un ascenso el mes pasado."},{en:"He's hoping for a promotion this year.", es:"Él espera un ascenso este año."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"subir de puesto en el trabajo\"?", options:["promotion","salary","interview"], correct:0, explain:"“Promotion” es un ascenso de puesto, no el salario." } },
      { id:'v-medio6-3', word:'Feedback', translation:'Retroalimentación · comentarios sobre cómo hiciste algo',
        examples:[{en:"Thanks for your feedback on my report.", es:"Gracias por tu retroalimentación sobre mi informe."},{en:"We welcome customer feedback.", es:"Recibimos con gusto la retroalimentación de los clientes."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"comentarios sobre cómo hiciste algo\"?", options:["feedback","gossip","instructions"], correct:0, explain:"“Feedback” son comentarios evaluativos, no chismes ni instrucciones." } },
      { id:'v-medio6-4', word:'Multitask', translation:'Multitarea · hacer varias cosas al mismo tiempo',
        examples:[{en:"I can't multitask when I'm tired.", es:"No puedo hacer varias cosas a la vez cuando estoy cansado."},{en:"She's great at multitasking.", es:"Ella es excelente haciendo varias cosas a la vez."}],
        quiz:{ prompt:"¿Qué verbo significa esto: \"hacer varias cosas al mismo tiempo\"?", options:["multitask","relax","delegate"], correct:0, explain:"“Multitask” es realizar varias tareas simultáneamente." } },
      { id:'v-medio6-5', word:'Networking', translation:'Networking · hacer contactos profesionales',
        examples:[{en:"Networking helped her find a new job.", es:"El networking la ayudó a encontrar un nuevo trabajo."},{en:"He attended the event for networking purposes.", es:"Él fue al evento para hacer contactos."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"hacer contactos profesionales\"?", options:["networking","training","recruiting"], correct:0, explain:"“Networking” es construir relaciones profesionales útiles." } },
      { id:'v-medio6-6', word:'Workload', translation:'Carga de trabajo · cantidad de trabajo que tienes',
        examples:[{en:"My workload has increased this month.", es:"Mi carga de trabajo aumentó este mes."},{en:"The team's workload is too heavy.", es:"La carga de trabajo del equipo es demasiado pesada."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cantidad de trabajo que tienes\"?", options:["workload","salary","schedule"], correct:0, explain:"“Workload” se refiere a cuánto trabajo tienes que hacer." } },
      { id:'v-medio6-7', word:'Onboarding', translation:'Inducción · proceso de integrar a un nuevo empleado',
        examples:[{en:"The onboarding process took two weeks.", es:"El proceso de inducción tomó dos semanas."},{en:"New employees go through onboarding.", es:"Los nuevos empleados pasan por la inducción."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"proceso de integrar a un nuevo empleado\"?", options:["onboarding","interview","resignation"], correct:0, explain:"“Onboarding” es el proceso inicial de integración de un empleado." } },
      { id:'v-medio6-8', word:'Freelance', translation:'Independiente · trabajar por proyectos, sin un jefe fijo',
        examples:[{en:"She works as a freelance designer.", es:"Ella trabaja como diseñadora independiente."},{en:"I do freelance writing on the side.", es:"Hago redacción independiente como trabajo extra."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"trabajar por proyectos, sin jefe fijo\"?", options:["freelance","permanent","unemployed"], correct:0, explain:"“Freelance” describe trabajo independiente por proyectos." } }
    ]
  ,

    [
      { id:'v-medio7-1', word:'Versatile', translation:'Versátil · que se adapta a muchos usos o situaciones',
        examples:[{en:"She is a versatile employee.", es:"Ella es una empleada versátil."},{en:"This tool is very versatile.", es:"Esta herramienta es muy versátil."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que se adapta a muchos usos o situaciones\"?", options:["versatile","rigid","boring"], correct:0, explain:"“Versatile” significa versátil, adaptable." } },
      { id:'v-medio7-2', word:'Persistent', translation:'Persistente · que sigue intentando sin rendirse',
        examples:[{en:"He was persistent and finally succeeded.", es:"Él fue persistente y finalmente tuvo éxito."},{en:"Being persistent pays off.", es:"Ser persistente vale la pena."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que sigue intentando sin rendirse\"?", options:["persistent","lazy","reluctant"], correct:0, explain:"“Persistent” significa persistente." } },
      { id:'v-medio7-3', word:'Contradict', translation:'Contradecir · decir lo opuesto de algo',
        examples:[{en:"Don't contradict yourself.", es:"No te contradigas."},{en:"His actions contradict his words.", es:"Sus acciones contradicen sus palabras."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"decir lo opuesto de algo\"?", options:["contradict","agree","confirm"], correct:0, explain:"“Contradict” significa contradecir." } },
      { id:'v-medio7-4', word:'Justify', translation:'Justificar · dar una razón válida para algo',
        examples:[{en:"Can you justify this decision?", es:"¿Puedes justificar esta decisión?"},{en:"He justified his absence.", es:"Él justificó su ausencia."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"dar una razón válida para algo\"?", options:["justify","deny","ignore"], correct:0, explain:"“Justify” significa justificar." } },
      { id:'v-medio7-5', word:'Foreseeable', translation:'Previsible · que se puede anticipar o esperar',
        examples:[{en:"There are no changes in the foreseeable future.", es:"No hay cambios en el futuro previsible."},{en:"This problem was foreseeable.", es:"Este problema era previsible."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que se puede anticipar o esperar\"?", options:["foreseeable","unexpected","random"], correct:0, explain:"“Foreseeable” significa previsible." } },
      { id:'v-medio7-6', word:'Undermine', translation:'Debilitar / socavar · dañar algo poco a poco desde dentro',
        examples:[{en:"Constant criticism can undermine confidence.", es:"La crítica constante puede debilitar la confianza."},{en:"He undermined her authority.", es:"Él socavó su autoridad."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"dañar algo poco a poco desde dentro\"?", options:["undermine","reinforce","support"], correct:0, explain:"“Undermine” significa debilitar o socavar." } },
      { id:'v-medio7-7', word:'Reinforce', translation:'Reforzar · hacer algo más fuerte',
        examples:[{en:"Practice reinforces what you learn.", es:"La práctica refuerza lo que aprendes."},{en:"They reinforced the bridge.", es:"Reforzaron el puente."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"hacer algo más fuerte\"?", options:["reinforce","weaken","undermine"], correct:0, explain:"“Reinforce” significa reforzar." } },
      { id:'v-medio7-8', word:'Alleviate', translation:'Aliviar · reducir el dolor o un problema',
        examples:[{en:"This medicine will alleviate the pain.", es:"Esta medicina aliviará el dolor."},{en:"The plan alleviates traffic problems.", es:"El plan alivia los problemas de tráfico."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"reducir el dolor o un problema\"?", options:["alleviate","worsen","ignore"], correct:0, explain:"“Alleviate” significa aliviar." } }
    ]
  ,
  [
 {
  "id": "v-medio8-1",
  "word": "Affect",
  "translation": "Afectar (verbo) · influir en algo",
  "examples": [
   {
    "en": "The rain affected the game.",
    "es": "La lluvia afectó el juego."
   },
   {
    "en": "Sleep affects your mood.",
    "es": "El sueño afecta tu estado de ánimo."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"influir en algo\" (verbo)?",
   "options": [
    "affect",
    "effect",
    "impact"
   ],
   "correct": 0,
   "explain": "“Affect” es el verbo influir."
  }
 },
 {
  "id": "v-medio8-2",
  "word": "Effect",
  "translation": "Efecto (sustantivo) · el resultado de algo",
  "examples": [
   {
    "en": "The medicine had a good effect.",
    "es": "El medicamento tuvo un buen efecto."
   },
   {
    "en": "Every action has an effect.",
    "es": "Cada acción tiene un efecto."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"el resultado de algo\" (sustantivo)?",
   "options": [
    "effect",
    "affect",
    "cause"
   ],
   "correct": 0,
   "explain": "“Effect” es el sustantivo resultado."
  }
 },
 {
  "id": "v-medio8-3",
  "word": "Loose",
  "translation": "Suelto · que no está ajustado o apretado",
  "examples": [
   {
    "en": "These pants are loose.",
    "es": "Estos pantalones están sueltos."
   },
   {
    "en": "The dog got loose.",
    "es": "El perro se soltó."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"que no está ajustado\"?",
   "options": [
    "loose",
    "lose",
    "close"
   ],
   "correct": 0,
   "explain": "“Loose” es suelto."
  }
 },
 {
  "id": "v-medio8-4",
  "word": "Lose",
  "translation": "Perder · no tener algo más, o perder un juego",
  "examples": [
   {
    "en": "Don't lose your keys.",
    "es": "No pierdas tus llaves."
   },
   {
    "en": "We don't want to lose the game.",
    "es": "No queremos perder el juego."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"no tener algo más\"?",
   "options": [
    "lose",
    "loose",
    "miss"
   ],
   "correct": 0,
   "explain": "“Lose” es perder."
  }
 },
 {
  "id": "v-medio8-5",
  "word": "Weather",
  "translation": "Clima · condición del cielo (lluvia, sol, frío)",
  "examples": [
   {
    "en": "The weather is nice today.",
    "es": "El clima está agradable hoy."
   },
   {
    "en": "I check the weather every morning.",
    "es": "Reviso el clima cada mañana."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"condición del cielo\"?",
   "options": [
    "weather",
    "whether",
    "climate"
   ],
   "correct": 0,
   "explain": "“Weather” es el clima."
  }
 },
 {
  "id": "v-medio8-6",
  "word": "Whether",
  "translation": "Si (o no) · palabra para presentar dos opciones",
  "examples": [
   {
    "en": "I don't know whether he is coming.",
    "es": "No sé si él viene."
   },
   {
    "en": "Decide whether to stay or go.",
    "es": "Decide si quedarte o irte."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"si\" (para presentar opciones)?",
   "options": [
    "whether",
    "weather",
    "if only"
   ],
   "correct": 0,
   "explain": "“Whether” significa si (entre opciones)."
  }
 },
 {
  "id": "v-medio8-7",
  "word": "Complement",
  "translation": "Complemento · algo que combina bien y completa otra cosa",
  "examples": [
   {
    "en": "The wine is a nice complement to the meal.",
    "es": "El vino es un buen complemento para la comida."
   },
   {
    "en": "These colors complement each other.",
    "es": "Estos colores se complementan."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"algo que completa otra cosa\"?",
   "options": [
    "complement",
    "compliment",
    "supplement"
   ],
   "correct": 0,
   "explain": "“Complement” es complemento (completar)."
  }
 },
 {
  "id": "v-medio8-8",
  "word": "Compliment",
  "translation": "Cumplido · una frase amable sobre alguien",
  "examples": [
   {
    "en": "She gave me a nice compliment.",
    "es": "Ella me hizo un lindo cumplido."
   },
   {
    "en": "He complimented my English.",
    "es": "Él elogió mi inglés."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"una frase amable sobre alguien\"?",
   "options": [
    "compliment",
    "complement",
    "praise only"
   ],
   "correct": 0,
   "explain": "“Compliment” es un cumplido o elogio."
  }
 }
],
    [
      { id:'v-medio10-1', word:'Budget', translation:'Presupuesto · plan de cuánto dinero puedes gastar',
        examples:[{en:"We need to stick to the budget.", es:"Necesitamos apegarnos al presupuesto."},{en:"The project is over budget.", es:"El proyecto se pasó del presupuesto."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"plan de cuánto dinero puedes gastar\"?", options:["budget","salary","invoice"], correct:0, explain:"“Budget” es presupuesto." } },
      { id:'v-medio10-2', word:'Opportunity', translation:'Oportunidad · momento bueno para hacer algo',
        examples:[{en:"This job is a great opportunity.", es:"Este trabajo es una gran oportunidad."},{en:"Don't miss this opportunity.", es:"No pierdas esta oportunidad."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"momento bueno para hacer algo\"?", options:["opportunity","problem","decision"], correct:0, explain:"“Opportunity” es oportunidad." } },
      { id:'v-medio10-3', word:'Achievement', translation:'Logro · algo que lograste con esfuerzo',
        examples:[{en:"Graduating was a big achievement.", es:"Graduarme fue un gran logro."},{en:"She is proud of her achievements.", es:"Ella está orgullosa de sus logros."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"algo que lograste con esfuerzo\"?", options:["achievement","attempt","mistake"], correct:0, explain:"“Achievement” es logro." } },
      { id:'v-medio10-4', word:'Routine', translation:'Rutina · cosas que haces siempre de la misma forma',
        examples:[{en:"I have a morning routine.", es:"Tengo una rutina matutina."},{en:"Exercise is part of my routine.", es:"Hacer ejercicio es parte de mi rutina."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cosas que haces siempre de la misma forma\"?", options:["routine","schedule change","habit change"], correct:0, explain:"“Routine” es rutina." } },
      { id:'v-medio10-5', word:'Confidence', translation:'Confianza · creer en ti mismo',
        examples:[{en:"She spoke with confidence.", es:"Ella habló con confianza."},{en:"Practice builds confidence.", es:"La práctica genera confianza."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"creer en ti mismo\"?", options:["confidence","fear","doubt"], correct:0, explain:"“Confidence” es confianza (en uno mismo)." } },
      { id:'v-medio10-6', word:'Patience', translation:'Paciencia · esperar sin molestarte',
        examples:[{en:"Teaching requires patience.", es:"Enseñar requiere paciencia."},{en:"He lost his patience.", es:"Él perdió la paciencia."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"esperar sin molestarte\"?", options:["patience","anger","anxiety"], correct:0, explain:"“Patience” es paciencia." } },
      { id:'v-medio10-7', word:'Improvement', translation:'Mejora · cuando algo se pone mejor',
        examples:[{en:"Your English shows real improvement.", es:"Tu inglés muestra una mejora real."},{en:"We need improvement in this area.", es:"Necesitamos mejora en esta área."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cuando algo se pone mejor\"?", options:["improvement","decline","result"], correct:0, explain:"“Improvement” es mejora." } },
      { id:'v-medio10-8', word:'Flexibility', translation:'Flexibilidad · poder adaptarse a cambios',
        examples:[{en:"This job offers a lot of flexibility.", es:"Este trabajo ofrece mucha flexibilidad."},{en:"We need more flexibility in the schedule.", es:"Necesitamos más flexibilidad en el horario."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"poder adaptarse a cambios\"?", options:["flexibility","rigidity","stability"], correct:0, explain:"“Flexibility” es flexibilidad." } },
      { id:'v-medio10-9', word:'Motivation', translation:'Motivación · ganas de hacer algo',
        examples:[{en:"I lost my motivation to study.", es:"Perdí la motivación para estudiar."},{en:"Money is not his only motivation.", es:"El dinero no es su única motivación."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"ganas de hacer algo\"?", options:["motivation","laziness","tiredness"], correct:0, explain:"“Motivation” es motivación." } },
      { id:'v-medio10-10', word:'Responsibility', translation:'Responsabilidad · algo que debes cuidar o hacer',
        examples:[{en:"This is a big responsibility.", es:"Esta es una gran responsabilidad."},{en:"She takes responsibility for her actions.", es:"Ella asume la responsabilidad de sus actos."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"algo que debes cuidar o hacer\"?", options:["responsibility","excuse","complaint"], correct:0, explain:"“Responsibility” es responsabilidad." } }
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
    ],
    [
      { id:'v-avz4-1', word:'Negotiate', translation:'Negotiate · llegar a un acuerdo discutiendo términos',
        examples:[{en:"We need to negotiate a better price.", es:"Necesitamos negociar un mejor precio."},{en:"She negotiated her salary before accepting the job.", es:"Ella negoció su salario antes de aceptar el trabajo."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"llegar a un acuerdo discutiendo términos\"?", options:["negotiate","outsource","leverage"], correct:0, explain:"“Negotiate” es negociar un acuerdo." } },
      { id:'v-avz4-2', word:'Deadline', translation:'Deadline · fecha límite para entregar algo',
        examples:[{en:"The deadline for the project is Friday.", es:"La fecha límite del proyecto es el viernes."},{en:"We missed the deadline.", es:"No cumplimos con la fecha límite."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"fecha límite para entregar algo\"?", options:["deadline","revenue","merger"], correct:0, explain:"“Deadline” es la fecha límite." } },
      { id:'v-avz4-3', word:'Stakeholder', translation:'Stakeholder · persona o grupo con interés en un proyecto o empresa',
        examples:[{en:"We presented the plan to all stakeholders.", es:"Presentamos el plan a todas las partes interesadas."},{en:"Every stakeholder has different priorities.", es:"Cada parte interesada tiene prioridades distintas."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"persona o grupo con interés en un proyecto o empresa\"?", options:["stakeholder","deadline","overhead"], correct:0, explain:"“Stakeholder” es una parte interesada en el negocio." } },
      { id:'v-avz4-4', word:'Revenue', translation:'Revenue · dinero que gana una empresa por sus ventas',
        examples:[{en:"The company's revenue grew by 15% this year.", es:"Los ingresos de la empresa crecieron un 15% este año."},{en:"Revenue was lower than expected.", es:"Los ingresos fueron menores de lo esperado."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"dinero que gana una empresa por sus ventas\"?", options:["revenue","overhead","merger"], correct:0, explain:"“Revenue” son los ingresos de una empresa." } },
      { id:'v-avz4-5', word:'Merger', translation:'Merger · unión de dos empresas en una sola',
        examples:[{en:"The merger created the largest company in the industry.", es:"La fusión creó la empresa más grande de la industria."},{en:"Employees were nervous about the merger.", es:"Los empleados estaban nerviosos por la fusión."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"unión de dos empresas en una sola\"?", options:["merger","stakeholder","leverage"], correct:0, explain:"“Merger” es la fusión de dos empresas." } },
      { id:'v-avz4-6', word:'Outsource', translation:'Outsource · contratar a otra empresa para hacer una tarea',
        examples:[{en:"We outsource our customer service to another company.", es:"Subcontratamos nuestro servicio al cliente a otra empresa."},{en:"Many companies outsource software development.", es:"Muchas empresas subcontratan el desarrollo de software."}],
        quiz:{ prompt:"¿Cuál oración usa \"outsource\" correctamente?", options:["We outsource our customer service.","We outsource of our customer service.","We outsource to our customer service to."], correct:0, explain:"“Outsource” va seguido directamente del objeto, sin preposición extra." } },
      { id:'v-avz4-7', word:'Overhead', translation:'Overhead · gastos generales de operar un negocio',
        examples:[{en:"We need to reduce our overhead costs.", es:"Necesitamos reducir nuestros gastos generales."},{en:"Rent is a big part of our overhead.", es:"El alquiler es una parte grande de nuestros gastos generales."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"gastos generales de operar un negocio\"?", options:["overhead","revenue","deadline"], correct:0, explain:"“Overhead” son los gastos generales de un negocio." } },
      { id:'v-avz4-8', word:'Leverage', translation:'Leverage · usar algo a tu favor para lograr una ventaja',
        examples:[{en:"They leveraged their experience to win the contract.", es:"Aprovecharon su experiencia para ganar el contrato."},{en:"We should leverage our existing network.", es:"Deberíamos aprovechar nuestra red de contactos existente."}],
        quiz:{ prompt:"¿Qué significa \"leverage\"?", options:["Ignorar algo","Aprovechar algo a tu favor","Rechazar una oferta"], correct:1, explain:"“Leverage” significa usar algo a tu favor para obtener ventaja." } }
    ],
    [
      { id:'v-avz5-1', word:'Cognizant', translation:'Consciente · plenamente al tanto de algo',
        examples:[{en:"We are cognizant of the risks involved.", es:"Somos conscientes de los riesgos involucrados."},{en:"She is cognizant of her limitations.", es:"Ella es consciente de sus limitaciones."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"plenamente al tanto de algo\"?", options:["cognizant","oblivious","careless"], correct:0, explain:"“Cognizant” significa estar consciente o al tanto, lo opuesto de “oblivious”." } },
      { id:'v-avz5-2', word:'Formidable', translation:'Formidable · impresionante, a veces intimidante',
        examples:[{en:"She's a formidable opponent in debates.", es:"Ella es una oponente formidable en los debates."},{en:"The challenge ahead is formidable.", es:"El desafío por delante es formidable."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"impresionante y a veces intimidante\"?", options:["formidable","mediocre","trivial"], correct:0, explain:"“Formidable” describe algo que impone respeto por su fuerza o capacidad." } },
      { id:'v-avz5-3', word:'Innocuous', translation:'Inofensivo · que no causa daño',
        examples:[{en:"It seemed like an innocuous comment.", es:"Parecía un comentario inofensivo."},{en:"The chemical is innocuous in small amounts.", es:"El químico es inofensivo en pequeñas cantidades."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que no causa daño\"?", options:["innocuous","harmful","toxic"], correct:0, explain:"“Innocuous” es lo opuesto de dañino: inofensivo." } },
      { id:'v-avz5-4', word:'Paradigm', translation:'Paradigma · modelo o forma de pensar ampliamente aceptada',
        examples:[{en:"This discovery shifted the scientific paradigm.", es:"Este descubrimiento cambió el paradigma científico."},{en:"We need a new paradigm for education.", es:"Necesitamos un nuevo paradigma para la educación."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"modelo o forma de pensar ampliamente aceptada\"?", options:["paradigm","exception","mistake"], correct:0, explain:"“Paradigm” es un marco o modelo de pensamiento dominante." } },
      { id:'v-avz5-5', word:'Vicarious', translation:'Vicario · experimentado a través de otra persona',
        examples:[{en:"He gets vicarious pleasure from his kids' success.", es:"Él siente placer vicario por el éxito de sus hijos."},{en:"Reading gives us vicarious experiences.", es:"Leer nos da experiencias vicarias."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"experimentado a través de otra persona\"?", options:["vicarious","direct","personal"], correct:0, explain:"“Vicarious” describe una experiencia sentida indirectamente, a través de otro." } },
      { id:'v-avz5-6', word:'Anomaly', translation:'Anomalía · algo que se desvía de lo normal',
        examples:[{en:"The data showed an unusual anomaly.", es:"Los datos mostraron una anomalía inusual."},{en:"This result is an anomaly, not the norm.", es:"Este resultado es una anomalía, no la norma."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"algo que se desvía de lo normal\"?", options:["anomaly","pattern","routine"], correct:0, explain:"“Anomaly” es una desviación de lo esperado o normal." } },
      { id:'v-avz5-7', word:'Corroborate', translation:'Corroborar · confirmar algo con evidencia adicional',
        examples:[{en:"The witness corroborated her story.", es:"El testigo corroboró su historia."},{en:"New evidence corroborates the theory.", es:"Nueva evidencia corrobora la teoría."}],
        quiz:{ prompt:"¿Qué verbo significa esto: \"confirmar algo con evidencia adicional\"?", options:["corroborate","deny","invent"], correct:0, explain:"“Corroborate” es respaldar o confirmar algo con más pruebas." } },
      { id:'v-avz5-8', word:'Exacerbate', translation:'Exacerbar · empeorar una situación',
        examples:[{en:"The delay exacerbated the crisis.", es:"El retraso exacerbó la crisis."},{en:"Stress can exacerbate health problems.", es:"El estrés puede empeorar los problemas de salud."}],
        quiz:{ prompt:"¿Qué verbo significa esto: \"empeorar una situación\"?", options:["exacerbate","improve","solve"], correct:0, explain:"“Exacerbate” significa hacer que algo malo empeore." } }
    ],
    [
      { id:'v-avz6-1', word:'Synergy', translation:'Sinergia · cuando trabajar juntos produce mejores resultados',
        examples:[{en:"The merger created strong synergy between the teams.", es:"La fusión creó una fuerte sinergia entre los equipos."},{en:"There's real synergy in this partnership.", es:"Hay una verdadera sinergia en esta asociación."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"trabajar juntos produce mejores resultados\"?", options:["synergy","conflict","isolation"], correct:0, explain:"“Synergy” es cuando la colaboración produce más que la suma de las partes." } },
      { id:'v-avz6-2', word:'Contingency', translation:'Contingencia · plan alternativo para un imprevisto',
        examples:[{en:"We need a contingency plan in case it fails.", es:"Necesitamos un plan de contingencia en caso de que falle."},{en:"Always have a contingency for emergencies.", es:"Siempre ten una contingencia para emergencias."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"plan alternativo para un imprevisto\"?", options:["contingency","guarantee","routine"], correct:0, explain:"“Contingency” es un plan de respaldo ante lo inesperado." } },
      { id:'v-avz6-3', word:'Proprietary', translation:'Propietario/exclusivo · información o tecnología de propiedad privada',
        examples:[{en:"This is proprietary software, not open source.", es:"Este es software propietario, no de código abierto."},{en:"They protect their proprietary technology.", es:"Ellos protegen su tecnología propietaria."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"de propiedad privada y protegida\"?", options:["proprietary","public","shared"], correct:0, explain:"“Proprietary” describe algo de propiedad exclusiva de una empresa." } },
      { id:'v-avz6-4', word:'Diligence', translation:'Diligencia · cuidado y esfuerzo constante en el trabajo',
        examples:[{en:"She completed the audit with great diligence.", es:"Ella completó la auditoría con gran diligencia."},{en:"Due diligence is required before the deal.", es:"Se requiere una debida diligencia antes del trato."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cuidado y esfuerzo constante en el trabajo\"?", options:["diligence","laziness","carelessness"], correct:0, explain:"“Diligence” es trabajar con cuidado y constancia." } },
      { id:'v-avz6-5', word:'Arbitrary', translation:'Arbitrario · decidido sin razón clara o justa',
        examples:[{en:"The decision seemed completely arbitrary.", es:"La decisión pareció completamente arbitraria."},{en:"They chose the date arbitrarily.", es:"Eligieron la fecha arbitrariamente."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"decidido sin razón clara o justa\"?", options:["arbitrary","logical","fair"], correct:0, explain:"“Arbitrary” describe decisiones sin base lógica clara." } },
      { id:'v-avz6-6', word:'Inadvertently', translation:'Inadvertidamente · sin querer, por accidente',
        examples:[{en:"I inadvertently deleted the file.", es:"Borré el archivo sin querer."},{en:"She inadvertently revealed the surprise.", es:"Ella reveló la sorpresa sin querer."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"sin querer, por accidente\"?", options:["inadvertently","deliberately","carefully"], correct:0, explain:"“Inadvertently” es hacer algo sin intención." } },
      { id:'v-avz6-7', word:'Aggregate', translation:'Agregado/total · la suma o combinación de varias cosas',
        examples:[{en:"The aggregate cost was higher than expected.", es:"El costo agregado fue más alto de lo esperado."},{en:"In aggregate, sales improved this year.", es:"En conjunto, las ventas mejoraron este año."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"la suma o combinación de varias cosas\"?", options:["aggregate","fraction","individual"], correct:0, explain:"“Aggregate” se refiere al total combinado de varias partes." } },
      { id:'v-avz6-8', word:'Benchmark', translation:'Referencia/punto de comparación · estándar usado para medir algo',
        examples:[{en:"This report sets a new benchmark for quality.", es:"Este informe establece un nuevo referente de calidad."},{en:"We use last year's sales as a benchmark.", es:"Usamos las ventas del año pasado como referencia."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"estándar usado para medir algo\"?", options:["benchmark","exception","mistake"], correct:0, explain:"“Benchmark” es un punto de referencia para comparar resultados." } }
    ]
  ,

    [
      { id:'v-avanzado7-1', word:'Presumptuous', translation:'Presuntuoso · que asume algo sin permiso, de forma atrevida',
        examples:[{en:"It would be presumptuous to assume he'll agree.", es:"Sería presuntuoso asumir que él estará de acuerdo."},{en:"Her presumptuous comment surprised everyone.", es:"Su comentario presuntuoso sorprendió a todos."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que asume algo sin permiso, de forma atrevida\"?", options:["presumptuous","humble","cautious"], correct:0, explain:"“Presumptuous” significa presuntuoso, atrevido." } },
      { id:'v-avanzado7-2', word:'Convoluted', translation:'Enrevesado · complicado de entender por su estructura',
        examples:[{en:"The instructions were too convoluted.", es:"Las instrucciones eran demasiado enrevesadas."},{en:"His explanation was convoluted.", es:"Su explicación fue enrevesada."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"complicado de entender por su estructura\"?", options:["convoluted","simple","clear"], correct:0, explain:"“Convoluted” significa enrevesado, complicado." } },
      { id:'v-avanzado7-3', word:'Intricate', translation:'Intrincado / complejo · con muchos detalles pequeños',
        examples:[{en:"The design is very intricate.", es:"El diseño es muy intrincado."},{en:"She explained the intricate details of the plan.", es:"Ella explicó los detalles intrincados del plan."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"con muchos detalles pequeños\"?", options:["intricate","plain","basic"], correct:0, explain:"“Intricate” significa intrincado o complejo." } },
      { id:'v-avanzado7-4', word:'Plummet', translation:'Caer en picada · bajar de forma rápida y drástica',
        examples:[{en:"Sales plummeted last quarter.", es:"Las ventas cayeron en picada el último trimestre."},{en:"Prices plummeted overnight.", es:"Los precios cayeron en picada de la noche a la mañana."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"bajar de forma rápida y drástica\"?", options:["plummet","rise","stabilize"], correct:0, explain:"“Plummet” significa caer en picada." } },
      { id:'v-avanzado7-5', word:'Resilient', translation:'Resiliente · que se recupera rápido de las dificultades',
        examples:[{en:"She is a resilient person.", es:"Ella es una persona resiliente."},{en:"The economy proved resilient.", es:"La economía resultó ser resiliente."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que se recupera rápido de las dificultades\"?", options:["resilient","fragile","stubborn"], correct:0, explain:"“Resilient” significa resiliente." } },
      { id:'v-avanzado7-6', word:'Discretion', translation:'Discreción · cuidado al manejar información sensible',
        examples:[{en:"Please handle this with discretion.", es:"Por favor maneja esto con discreción."},{en:"He used his discretion to decide.", es:"Él usó su discreción para decidir."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"cuidado al manejar información sensible\"?", options:["discretion","gossip","carelessness"], correct:0, explain:"“Discretion” significa discreción." } },
      { id:'v-avanzado7-7', word:'Inherent', translation:'Inherente · que es parte natural de algo, desde siempre',
        examples:[{en:"There are inherent risks in this business.", es:"Hay riesgos inherentes en este negocio."},{en:"Curiosity is inherent in children.", es:"La curiosidad es inherente en los niños."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que es parte natural de algo, desde siempre\"?", options:["inherent","external","optional"], correct:0, explain:"“Inherent” significa inherente." } },
      { id:'v-avanzado7-8', word:'Scrutinize', translation:'Examinar minuciosamente · revisar algo con mucho cuidado',
        examples:[{en:"The auditors scrutinized every transaction.", es:"Los auditores examinaron minuciosamente cada transacción."},{en:"She scrutinized the contract before signing.", es:"Ella examinó minuciosamente el contrato antes de firmar."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"revisar algo con mucho cuidado\"?", options:["scrutinize","ignore","skim"], correct:0, explain:"“Scrutinize” significa examinar minuciosamente." } }
    ]
  ,
  [
 {
  "id": "v-avanzado8-1",
  "word": "Principal",
  "translation": "Principal (adjetivo) / director(a) · el más importante, o jefe de escuela",
  "examples": [
   {
    "en": "The principal reason is cost.",
    "es": "La razón principal es el costo."
   },
   {
    "en": "She is the school principal.",
    "es": "Ella es la directora de la escuela."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"el más importante\" o \"director de escuela\"?",
   "options": [
    "principal",
    "principle",
    "primary only"
   ],
   "correct": 0,
   "explain": "“Principal” es principal o director."
  }
 },
 {
  "id": "v-avanzado8-2",
  "word": "Principle",
  "translation": "Principio · una regla o creencia fundamental",
  "examples": [
   {
    "en": "Honesty is his main principle.",
    "es": "La honestidad es su principio principal."
   },
   {
    "en": "We follow the same principles.",
    "es": "Seguimos los mismos principios."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"una regla o creencia fundamental\"?",
   "options": [
    "principle",
    "principal",
    "rule only"
   ],
   "correct": 0,
   "explain": "“Principle” es un principio (regla, creencia)."
  }
 },
 {
  "id": "v-avanzado8-3",
  "word": "Farther",
  "translation": "Más lejos (distancia física) · más lejos en el espacio",
  "examples": [
   {
    "en": "The store is farther than I thought.",
    "es": "La tienda está más lejos de lo que pensé."
   },
   {
    "en": "We drove farther north.",
    "es": "Manejamos más lejos hacia el norte."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"más lejos\" en distancia física?",
   "options": [
    "farther",
    "further",
    "father"
   ],
   "correct": 0,
   "explain": "“Farther” es distancia física."
  }
 },
 {
  "id": "v-avanzado8-4",
  "word": "Further",
  "translation": "Más (idea abstracta) · más allá, adicional",
  "examples": [
   {
    "en": "We need further discussion.",
    "es": "Necesitamos más discusión."
   },
   {
    "en": "Further details will follow.",
    "es": "Más detalles vendrán después."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"más\" en un sentido abstracto?",
   "options": [
    "further",
    "farther",
    "additional only"
   ],
   "correct": 0,
   "explain": "“Further” es para ideas abstractas."
  }
 },
 {
  "id": "v-avanzado8-5",
  "word": "Stationary",
  "translation": "Estacionario · que no se mueve, fijo en un lugar",
  "examples": [
   {
    "en": "The car remained stationary.",
    "es": "El carro permaneció estacionario."
   },
   {
    "en": "Ride a stationary bike at the gym.",
    "es": "Monta una bicicleta estacionaria en el gimnasio."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"que no se mueve\"?",
   "options": [
    "stationary",
    "stationery",
    "moving"
   ],
   "correct": 0,
   "explain": "“Stationary” significa fijo, sin movimiento."
  }
 },
 {
  "id": "v-avanzado8-6",
  "word": "Stationery",
  "translation": "Papelería · papel, lápices y artículos de escritorio",
  "examples": [
   {
    "en": "I bought new stationery for the office.",
    "es": "Compré papelería nueva para la oficina."
   },
   {
    "en": "The stationery store sells notebooks.",
    "es": "La papelería vende cuadernos."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"papel y artículos de escritorio\"?",
   "options": [
    "stationery",
    "stationary",
    "paperwork only"
   ],
   "correct": 0,
   "explain": "“Stationery” es papelería (con E, como Envelope)."
  }
 },
 {
  "id": "v-avanzado8-7",
  "word": "Elicit",
  "translation": "Provocar / obtener · sacar una reacción o respuesta de alguien",
  "examples": [
   {
    "en": "The question elicited a strong reaction.",
    "es": "La pregunta provocó una fuerte reacción."
   },
   {
    "en": "Try to elicit her opinion.",
    "es": "Intenta obtener su opinión."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"sacar una reacción de alguien\"?",
   "options": [
    "elicit",
    "illicit",
    "solicit only"
   ],
   "correct": 0,
   "explain": "“Elicit” es provocar u obtener (una reacción)."
  }
 },
 {
  "id": "v-avanzado8-8",
  "word": "Illicit",
  "translation": "Ilícito · que no es legal o permitido",
  "examples": [
   {
    "en": "They were involved in illicit activities.",
    "es": "Estaban involucrados en actividades ilícitas."
   },
   {
    "en": "The illicit trade was stopped.",
    "es": "El comercio ilícito fue detenido."
   }
  ],
  "quiz": {
   "prompt": "¿Qué palabra significa esto: \"que no es legal\"?",
   "options": [
    "illicit",
    "elicit",
    "illegal only"
   ],
   "correct": 0,
   "explain": "“Illicit” significa ilícito, ilegal."
  }
 }
],
    [
      { id:'v-avanzado10-1', word:'Thrive', translation:'Prosperar/florecer · crecer y tener éxito',
        examples:[{en:"The company continues to thrive.", es:"La empresa sigue prosperando."},{en:"Some plants thrive in the shade.", es:"Algunas plantas prosperan en la sombra."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"crecer y tener éxito\"?", options:["thrive","struggle","fail"], correct:0, explain:"“Thrive” es prosperar o crecer con éxito." } },
      { id:'v-avanzado10-2', word:'Assertive', translation:'Asertivo · defender tu opinión con seguridad y respeto',
        examples:[{en:"You need to be more assertive in meetings.", es:"Necesitas ser más asertivo en las reuniones."},{en:"She gave an assertive response.", es:"Ella dio una respuesta asertiva."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"defender tu opinión con seguridad y respeto\"?", options:["assertive","shy","aggressive"], correct:0, explain:"“Assertive” es asertivo, con seguridad y respeto." } },
      { id:'v-avanzado10-3', word:'Relentless', translation:'Implacable/incansable · que no se detiene',
        examples:[{en:"He is relentless in pursuing his goals.", es:"Él es incansable persiguiendo sus metas."},{en:"The rain was relentless all week.", es:"La lluvia fue implacable toda la semana."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que no se detiene\"?", options:["relentless","occasional","gentle"], correct:0, explain:"“Relentless” es implacable, incansable." } },
      { id:'v-avanzado10-4', word:'Candor', translation:'Franqueza · decir la verdad de forma directa',
        examples:[{en:"I appreciate your candor.", es:"Aprecio tu franqueza."},{en:"She spoke with surprising candor.", es:"Ella habló con una franqueza sorprendente."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"decir la verdad de forma directa\"?", options:["candor","deception","silence"], correct:0, explain:"“Candor” es franqueza, sinceridad directa." } },
      { id:'v-avanzado10-5', word:'Tenacious', translation:'Tenaz · que no se rinde fácilmente',
        examples:[{en:"She is a tenacious negotiator.", es:"Ella es una negociadora tenaz."},{en:"His tenacious attitude paid off.", es:"Su actitud tenaz dio resultado."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que no se rinde fácilmente\"?", options:["tenacious","careless","indifferent"], correct:0, explain:"“Tenacious” es tenaz, persistente." } },
      { id:'v-avanzado10-6', word:'Volatile', translation:'Volátil · que cambia rápido e impredeciblemente',
        examples:[{en:"The stock market is volatile right now.", es:"El mercado de valores está volátil ahora."},{en:"His mood can be volatile.", es:"Su estado de ánimo puede ser volátil."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que cambia rápido e impredeciblemente\"?", options:["volatile","stable","predictable"], correct:0, explain:"“Volatile” es volátil, inestable o cambiante." } },
      { id:'v-avanzado10-7', word:'Resourceful', translation:'Ingenioso/recursivo · que encuentra soluciones con lo que tiene',
        examples:[{en:"She is very resourceful when problems arise.", es:"Ella es muy ingeniosa cuando surgen problemas."},{en:"Being resourceful helped him survive.", es:"Ser ingenioso lo ayudó a sobrevivir."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que encuentra soluciones con lo que tiene\"?", options:["resourceful","helpless","wasteful"], correct:0, explain:"“Resourceful” es ingenioso, capaz de resolver con lo que tiene." } },
      { id:'v-avanzado10-8', word:'Indispensable', translation:'Indispensable · tan necesario que no se puede prescindir de ello',
        examples:[{en:"Her experience is indispensable to the team.", es:"Su experiencia es indispensable para el equipo."},{en:"Water is indispensable for life.", es:"El agua es indispensable para la vida."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"tan necesario que no se puede prescindir de ello\"?", options:["indispensable","optional","useless"], correct:0, explain:"“Indispensable” es algo absolutamente necesario." } },
      { id:'v-avanzado10-9', word:'Diligent', translation:'Diligente · que trabaja con cuidado y esfuerzo constante',
        examples:[{en:"He is a diligent student.", es:"Él es un estudiante diligente."},{en:"Her diligent work paid off.", es:"Su trabajo diligente dio frutos."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"que trabaja con cuidado y esfuerzo constante\"?", options:["diligent","lazy","careless"], correct:0, explain:"“Diligent” es diligente, cuidadoso y constante." } },
      { id:'v-avanzado10-10', word:'Adaptability', translation:'Adaptabilidad · capacidad de ajustarse a cambios',
        examples:[{en:"Adaptability is key in a new job.", es:"La adaptabilidad es clave en un trabajo nuevo."},{en:"His adaptability impressed the team.", es:"Su adaptabilidad impresionó al equipo."}],
        quiz:{ prompt:"¿Qué palabra significa esto: \"capacidad de ajustarse a cambios\"?", options:["adaptability","rigidity","resistance"], correct:0, explain:"“Adaptability” es la capacidad de adaptarse." } }
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
  principiante: [
    [
      { id:'l-principiante-1', audioFile:'audio/a0/a0listening-001.mp3',
        transcript:"I have a cat.", translation:"Tengo un gato.",
        question:"What animal does the speaker have?", options:["A cat","A dog","A bird"], correct:0,
        explain:"\u201cCat\u201d significa gato." },
      { id:'l-principiante-2', audioFile:'audio/a0/a0listening-002.mp3',
        transcript:"My house is big.", translation:"Mi casa es grande.",
        question:"What is big?", options:["The house","The car","The dog"], correct:0,
        explain:"\u201cHouse\u201d es la palabra para casa." },
      { id:'l-principiante-3', audioFile:'audio/a0/a0listening-003.mp3',
        transcript:"I have two books.", translation:"Tengo dos libros.",
        question:"How many books does the speaker have?", options:["Two","Three","One"], correct:0,
        explain:"\u201cTwo\u201d es el n\u00famero 2." }
    ],
    [
      { id:'l-principiante2-1', audioFile:'audio/a0/a0listening-004.mp3',
        transcript:"The apple is red.", translation:"La manzana es roja.",
        question:"What color is the apple?", options:["Red","Blue","Green"], correct:0,
        explain:"\u201cRed\u201d significa rojo." },
      { id:'l-principiante2-2', audioFile:'audio/a0/a0listening-005.mp3',
        transcript:"This is my mother.", translation:"Esta es mi mam\u00e1.",
        question:"Who is this?", options:["Mother","Father","Friend"], correct:0,
        explain:"\u201cMother\u201d significa mam\u00e1." }
    ],
    [
      { id:"l-principiante3-1", audioFile:"audio/a0/a0listening-006.mp3",
        transcript:"I like ice cream.", translation:"Me gusta el helado.",
        question:"What does the speaker like?", options:["Pizza","Ice cream","Cake"], correct:1,
        explain:"“Ice cream” significa helado." },
      { id:"l-principiante3-2", audioFile:"audio/a0/a0listening-007.mp3",
        transcript:"The ball is yellow.", translation:"La pelota es amarilla.",
        question:"What color is the ball?", options:["Blue","Yellow","Red"], correct:1,
        explain:"“Yellow” significa amarillo." },
      { id:"l-principiante3-3", audioFile:"audio/a0/a0listening-008.mp3",
        transcript:"She has one brother.", translation:"Ella tiene un hermano.",
        question:"How many brothers does she have?", options:["Two","One","Three"], correct:1,
        explain:"“One brother” indica que tiene un hermano." }
    ],
    [
      { id:"l-principiante4-1", audioFile:"audio/a0/a0listening-009.mp3",
        transcript:"My dog is small.", translation:"Mi perro es pequeño.",
        question:"What size is the dog?", options:["Big","Medium","Small"], correct:2,
        explain:"“Small” significa pequeño." },
      { id:"l-principiante4-2", audioFile:"audio/a0/a0listening-010.mp3",
        transcript:"We have four chairs.", translation:"Tenemos cuatro sillas.",
        question:"How many chairs do they have?", options:["Five","Four","Three"], correct:1,
        explain:"“Four” es el número 4." },
      { id:"l-principiante4-3", audioFile:"audio/a0/a0listening-011.mp3",
        transcript:"This is my sister.", translation:"Esta es mi hermana.",
        question:"Who is this?", options:["Brother","Friend","Sister"], correct:2,
        explain:"“Sister” significa hermana." }
    ],
    [
      { id:"l-principiante5-1", audioFile:"audio/a0/a0listening-012.mp3",
        transcript:"The bird is black.", translation:"El pájaro es negro.",
        question:"What color is the bird?", options:["White","Black","Brown"], correct:1,
        explain:"“Black” significa negro." },
      { id:"l-principiante5-2", audioFile:"audio/a0/a0listening-013.mp3",
        transcript:"I have a pencil.", translation:"Tengo un lápiz.",
        question:"What does the speaker have?", options:["A pen","A pencil","A book"], correct:1,
        explain:"“A pencil” significa un lápiz." }
    ]
  ,

    [
      { id:"l-principiante6-1", audioFile:"audio/a0/a0listening-014.mp3",
        transcript:"Today is Monday.", translation:"Hoy es lunes.",
        question:"What day is it?", options:["Monday","Sunday","Friday"], correct:0,
        explain:"“Monday” significa lunes." },
      { id:"l-principiante6-2", audioFile:"audio/a0/a0listening-015.mp3",
        transcript:"I am seven years old.", translation:"Tengo siete años.",
        question:"How old is the speaker?", options:["Seven","Seventeen","Eight"], correct:0,
        explain:"“Seven” es el número 7." },
      { id:"l-principiante6-3", audioFile:"audio/a0/a0listening-016.mp3",
        transcript:"This is my book.", translation:"Este es mi libro.",
        question:"What is this?", options:["A book","A pen","A chair"], correct:0,
        explain:"“Book” significa libro." }
    ]
  ,
  [
 {
  "id": "l-principiante7-1",
  "audioFile": "audio/a0/a0listening-017.mp3",
  "transcript": "Can I borrow your pen?",
  "translation": "¿Me prestas tu lápiz?",
  "question": "What does the speaker want?",
  "options": [
   "To borrow a pen",
   "To buy a pen",
   "To sell a pen"
  ],
  "correct": 0,
  "explain": "“Borrow” significa pedir prestado."
 },
 {
  "id": "l-principiante7-2",
  "audioFile": "audio/a0/a0listening-018.mp3",
  "transcript": "She sings very well.",
  "translation": "Ella canta muy bien.",
  "question": "How does she sing?",
  "options": [
   "Very well",
   "Very badly",
   "Very loud"
  ],
  "correct": 0,
  "explain": "“Well” significa bien."
 },
 {
  "id": "l-principiante7-3",
  "audioFile": "audio/a0/a0listening-019.mp3",
  "transcript": "It is cold today.",
  "translation": "Hoy hace frío.",
  "question": "How is the weather?",
  "options": [
   "Cold",
   "Hot",
   "Sunny"
  ],
  "correct": 0,
  "explain": "“Cold” significa frío."
 }
],
    [
      { id:'l-principiante9-1', audioFile:'audio/a0/a0listening-024.mp3',
        transcript:"The wall is white.", translation:"La pared es blanca.",
        question:"What color is the wall?", options:["White","Black","Brown"], correct:0,
        explain:"“White” significa blanco." },
      { id:'l-principiante9-2', audioFile:'audio/a0/a0listening-025.mp3',
        transcript:"He has a yellow shirt.", translation:"Él tiene una camisa amarilla.",
        question:"What color is his shirt?", options:["Yellow","Blue","Black"], correct:0,
        explain:"“Yellow” significa amarillo." },
      { id:'l-principiante9-3', audioFile:'audio/a0/a0listening-026.mp3',
        transcript:"We have six windows.", translation:"Tenemos seis ventanas.",
        question:"How many windows do they have?", options:["Six","Five","Seven"], correct:0,
        explain:"“Six” es el número 6." }
    ]
  ],
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
      { id:'l-facil2-2', audioFile:'audio/a1/a1listening-006.mp3',
        transcript:"There isn't any coffee left.", translation:"No queda nada de café.",
        question:"What is missing?", options:["Coffee","Tea","Sugar"], correct:0,
        explain:"“Any” en negaciones indica que no queda nada de eso: café." }
    ],
    [
      { id:'l-facil3-1', audioFile:'audio/a1/a1listening-005.mp3',
        transcript:"This bag is bigger than that one.", translation:"Esta bolsa es más grande que esa.",
        question:"Which bag is bigger?", options:["This one","That one","They are the same"], correct:0,
        explain:"“Bigger than” indica cuál de las dos es más grande." },
      { id:'l-facil3-2', audioFile:'audio/a1/a1listening-007.mp3',
        transcript:"Those shoes over there are too expensive for me.", translation:"Esos zapatos de allá son demasiado caros para mí.",
        question:"What does the speaker think about the shoes?", options:["They are too expensive","They are too cheap","They are comfortable"], correct:0,
        explain:"“Too expensive” dice que el precio le parece demasiado alto." }
    ],
    [
      { id:'l-facil4-1', audioFile:'audio/a1/a1listening-008.mp3',
        transcript:"The bus leaves in ten minutes.", translation:"El autobús sale en diez minutos.",
        question:"When does the bus leave?", options:["In ten minutes","In ten hours","In ten days"], correct:0,
        explain:"“Minutes” es la unidad de tiempo que se menciona, no “hours” ni “days”." },
      { id:'l-facil4-2', audioFile:'audio/a1/a1listening-009.mp3',
        transcript:"I need to buy new shoes for the party.", translation:"Necesito comprar zapatos nuevos para la fiesta.",
        question:"What does the speaker need to buy?", options:["Shoes","A dress","A gift"], correct:0,
        explain:"“Buy new shoes” indica claramente qué necesita comprar." },
      { id:'l-facil4-3', audioFile:'audio/a1/a1listening-010.mp3',
        transcript:"He always forgets his umbrella.", translation:"Él siempre olvida su paraguas.",
        question:"What does he always forget?", options:["His umbrella","His keys","His phone"], correct:0,
        explain:"“Umbrella” es el objeto que menciona la frase." },
      { id:'l-facil4-4', audioFile:'audio/a1/a1listening-011.mp3',
        transcript:"We are going to the park this afternoon.", translation:"Vamos al parque esta tarde.",
        question:"Where are they going?", options:["To the park","To the store","To school"], correct:0,
        explain:"“Going to the park” dice el lugar al que van." }
    ],
    [
      { id:'l-facil5-1', audioFile:'audio/a1/a1listening-012.mp3',
        transcript:"I usually take the bus to work, but today I'm walking.", translation:"Normalmente tomo el autobús para ir al trabajo, pero hoy voy caminando.",
        question:"How is the speaker going to work today?", options:["Walking","By bus","By car"], correct:0,
        explain:"“Today I'm walking” dice claramente el medio de transporte de hoy." },
      { id:'l-facil5-2', audioFile:'audio/a1/a1listening-013.mp3',
        transcript:"Can you close the window? It's a bit cold in here.", translation:"¿Puedes cerrar la ventana? Hace un poco de frío aquí.",
        question:"What does the speaker want?", options:["To close the window","To open the door","To turn on the heater"], correct:0,
        explain:"“Can you close the window?” es una petición directa." },
      { id:'l-facil5-3', audioFile:'audio/a1/a1listening-014.mp3',
        transcript:"My sister is younger than me, but she is taller.", translation:"Mi hermana es menor que yo, pero es más alta.",
        question:"Who is taller?", options:["The sister","The speaker","They are the same height"], correct:0,
        explain:"“She is taller” se refiere a la hermana, aunque sea menor en edad." }
    ],
    [
      { id:'l-facil6-1', audioFile:'audio/a1/a1listening-015.mp3',
        transcript:"The kids are playing in the garden.", translation:"Los ni\u00f1os est\u00e1n jugando en el jard\u00edn.",
        question:"Where are the kids playing?", options:["In the garden","In the kitchen","At school"], correct:0,
        explain:"“In the garden” indica el lugar donde juegan los ni\u00f1os." },
      { id:'l-facil6-2', audioFile:'audio/a1/a1listening-016.mp3',
        transcript:"I don't like spicy food.", translation:"No me gusta la comida picante.",
        question:"What does the speaker not like?", options:["Sweet food","Cold food","Spicy food"], correct:2,
        explain:"“Don't like” + comida indica lo que no le gusta: comida picante." },
      { id:'l-facil6-3', audioFile:'audio/a1/a1listening-017.mp3',
        transcript:"We have lunch at noon every day.", translation:"Almorzamos al mediod\u00eda todos los d\u00edas.",
        question:"When do they have lunch?", options:["At night","At noon","In the morning"], correct:1,
        explain:"“At noon” es la hora que se menciona para el almuerzo." },
      { id:'l-facil6-4', audioFile:'audio/a1/a1listening-018.mp3',
        transcript:"She is wearing a red jacket today.", translation:"Ella lleva puesta una chaqueta roja hoy.",
        question:"What is she wearing?", options:["A red jacket","A blue dress","A black coat"], correct:0,
        explain:"“Wearing” describe la ropa que lleva puesta en este momento." }
    ],
    [
      { id:'l-facil7-1', audioFile:'audio/a1/a1listening-019.mp3',
        transcript:"The train arrives at half past six.", translation:"El tren llega a las seis y media.",
        question:"What time does the train arrive?", options:["Six o'clock","Six fifteen","Half past six"], correct:2,
        explain:"“Half past six” significa las seis y media." },
      { id:'l-facil7-2', audioFile:'audio/a1/a1listening-020.mp3',
        transcript:"He never eats breakfast before work.", translation:"\u00c9l nunca desayuna antes de ir al trabajo.",
        question:"What does he never do before work?", options:["Drink coffee","Eat breakfast","Take a shower"], correct:1,
        explain:"“Never” indica que nunca hace esa acci\u00f3n antes del trabajo." },
      { id:'l-facil7-3', audioFile:'audio/a1/a1listening-021.mp3',
        transcript:"There are three chairs around the table.", translation:"Hay tres sillas alrededor de la mesa.",
        question:"How many chairs are there?", options:["Three","Two","Four"], correct:0,
        explain:"“Three chairs” es el n\u00famero que se menciona en la frase." }
    ],
    [
      { id:'l-facil8-1', audioFile:'audio/a1/a1listening-022.mp3',
        transcript:"My brother is taller than my father.", translation:"Mi hermano es m\u00e1s alto que mi pap\u00e1.",
        question:"Who is taller?", options:["The father","They are the same height","The brother"], correct:2,
        explain:"“Taller than” compara la estatura entre el hermano y el padre." },
      { id:'l-facil8-2', audioFile:'audio/a1/a1listening-023.mp3',
        transcript:"I am going to visit my grandparents this weekend.", translation:"Voy a visitar a mis abuelos este fin de semana.",
        question:"What is the speaker going to do this weekend?", options:["Go to work","Visit grandparents","Clean the house"], correct:1,
        explain:"“Going to visit” indica un plan futuro para el fin de semana." },
      { id:'l-facil8-3', audioFile:'audio/a1/a1listening-024.mp3',
        transcript:"The weather is cold so wear a coat.", translation:"El clima est\u00e1 fr\u00edo, as\u00ed que usa un abrigo.",
        question:"What should you do because it's cold?", options:["Wear a coat","Open the window","Drink cold water"], correct:0,
        explain:"“So wear a coat” es la recomendaci\u00f3n que sigue por el fr\u00edo." }
    ],
    [
      { id:"l-facil9-1", audioFile:"audio/a1/a1listening-025.mp3",
        transcript:"The museum opens at ten in the morning.", translation:"El museo abre a las diez de la mañana.",
        question:"When does the museum open?", options:["At eleven","At ten","At nine"], correct:1,
        explain:"“At ten” es la hora que se menciona para abrir el museo." },
      { id:"l-facil9-2", audioFile:"audio/a1/a1listening-026.mp3",
        transcript:"I forgot my umbrella at home.", translation:"Olvidé mi paraguas en casa.",
        question:"What did the speaker forget?", options:["Keys","Umbrella","Phone"], correct:1,
        explain:"“Forgot my umbrella” indica qué olvidó el hablante." },
      { id:"l-facil9-3", audioFile:"audio/a1/a1listening-027.mp3",
        transcript:"The soup is too hot to eat.", translation:"La sopa está demasiado caliente para comer.",
        question:"What is wrong with the soup?", options:["Too cold","Too hot","Too salty"], correct:1,
        explain:"“Too hot” describe el problema con la sopa." },
      { id:"l-facil9-4", audioFile:"audio/a1/a1listening-028.mp3",
        transcript:"My father works in a hospital.", translation:"Mi papá trabaja en un hospital.",
        question:"Where does the father work?", options:["School","Hospital","Store"], correct:1,
        explain:"“Hospital” es el lugar donde trabaja el papá." }
    ],
    [
      { id:"l-facil10-1", audioFile:"audio/a1/a1listening-029.mp3",
        transcript:"She always arrives early to class.", translation:"Ella siempre llega temprano a clase.",
        question:"What does she always do?", options:["Arrive late","Miss class","Arrive early"], correct:2,
        explain:"“Always arrives early” describe su hábito." },
      { id:"l-facil10-2", audioFile:"audio/a1/a1listening-030.mp3",
        transcript:"The library is next to the park.", translation:"La biblioteca está junto al parque.",
        question:"Where is the library?", options:["Behind the school","In front of the store","Next to the park"], correct:2,
        explain:"“Next to the park” indica dónde está la biblioteca." },
      { id:"l-facil10-3", audioFile:"audio/a1/a1listening-031.mp3",
        transcript:"I need to charge my phone.", translation:"Necesito cargar mi teléfono.",
        question:"What does the speaker need to do?", options:["Buy a phone","Charge the phone","Fix the phone"], correct:1,
        explain:"“Charge my phone” es lo que necesita hacer." },
      { id:"l-facil10-4", audioFile:"audio/a1/a1listening-032.mp3",
        transcript:"This coffee is stronger than that one.", translation:"Este café es más fuerte que ese.",
        question:"Which coffee is stronger?", options:["That one","They are the same","This one"], correct:2,
        explain:"“Stronger than” compara los dos cafés." }
    ]
  ,

    [
      { id:"l-facil11-1", audioFile:"audio/a1/a1listening-033.mp3",
        transcript:"I worked at the office yesterday.", translation:"Trabajé en la oficina ayer.",
        question:"When did the speaker work?", options:["Yesterday","Today","Tomorrow"], correct:0,
        explain:"“Yesterday” es la palabra clave para saber cuándo trabajó." },
      { id:"l-facil11-2", audioFile:"audio/a1/a1listening-034.mp3",
        transcript:"She doesn't like spicy food.", translation:"A ella no le gusta la comida picante.",
        question:"What doesn't she like?", options:["Spicy food","Sweet food","Cold food"], correct:0,
        explain:"“Spicy food” es lo que no le gusta." },
      { id:"l-facil11-3", audioFile:"audio/a1/a1listening-035.mp3",
        transcript:"This road is faster than the other one.", translation:"Este camino es más rápido que el otro.",
        question:"Which road is faster?", options:["This one","The other one","Neither"], correct:0,
        explain:"“This road is faster” indica cuál es más rápido." }
    ]
  ,
  [
 {
  "id": "l-facil12-1",
  "audioFile": "audio/a1/a1listening-036.mp3",
  "transcript": "First we ate, then we slept.",
  "translation": "Primero comimos, luego dormimos.",
  "question": "What happened after eating?",
  "options": [
   "They slept",
   "They walked",
   "They cooked"
  ],
  "correct": 0,
  "explain": "“Then” indica lo que pasó después."
 },
 {
  "id": "l-facil12-2",
  "audioFile": "audio/a1/a1listening-037.mp3",
  "transcript": "Coffee is stronger than tea.",
  "translation": "El café es más fuerte que el té.",
  "question": "What is being compared to tea?",
  "options": [
   "Coffee",
   "Water",
   "Juice"
  ],
  "correct": 0,
  "explain": "“Than” se usa para comparar coffee y tea."
 },
 {
  "id": "l-facil12-3",
  "audioFile": "audio/a1/a1listening-038.mp3",
  "transcript": "Everyone came except Maria.",
  "translation": "Todos vinieron excepto María.",
  "question": "Who did not come?",
  "options": [
   "Maria",
   "Everyone",
   "The teacher"
  ],
  "correct": 0,
  "explain": "“Except” significa que Maria fue la única que no vino."
 }
],
    [
      { id:'l-facil14-1', audioFile:'audio/a1/a1listening-043.mp3',
        transcript:"I usually walk to the office.", translation:"Normalmente camino a la oficina.",
        question:"How does the speaker usually get to the office?", options:["On foot","By bus","By car"], correct:0,
        explain:"“Walk” significa caminar." },
      { id:'l-facil14-2', audioFile:'audio/a1/a1listening-044.mp3',
        transcript:"She forgot her umbrella at home.", translation:"Ella olvidó su paraguas en casa.",
        question:"What did she forget?", options:["Her umbrella","Her phone","Her keys"], correct:0,
        explain:"“Umbrella” significa paraguas." },
      { id:'l-facil14-3', audioFile:'audio/a1/a1listening-045.mp3',
        transcript:"The meeting starts at nine in the morning.", translation:"La reunión empieza a las nueve de la mañana.",
        question:"What time does the meeting start?", options:["Nine in the morning","Nine at night","Ten in the morning"], correct:0,
        explain:"“Nine in the morning” es las nueve de la mañana." }
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
      { id:'l-medio2-2', audioFile:'audio/b1/b1listening-006.mp3',
        transcript:"I have already finished my homework.", translation:"Ya terminé mi tarea.",
        question:"Did the speaker finish the homework?", options:["Yes","No","Not yet"], correct:0,
        explain:"“Already finished” indica que la acción ya se completó." }
    ],
    [
      { id:'l-medio3-1', audioFile:'audio/b1/b1listening-005.mp3',
        transcript:"If it rains tomorrow, we will stay home.", translation:"Si llueve mañana, nos quedaremos en casa.",
        question:"What will they do if it rains?", options:["Stay home","Go out","Cancel the trip"], correct:0,
        explain:"Condicional tipo 1: consecuencia real y probable." },
      { id:'l-medio3-2', audioFile:'audio/b1/b1listening-007.mp3',
        transcript:"Even though he was busy, he helped his friend.", translation:"Aunque estaba ocupado, ayudó a su amigo.",
        question:"Did he help his friend?", options:["Yes","No","He couldn't"], correct:0,
        explain:"“Even though” introduce un contraste, pero la acción sí ocurrió." }
    ],
    [
      { id:'l-medio4-1', audioFile:'audio/b1/b1listening-008.mp3',
        transcript:"Although the flight was delayed, we still made it to the meeting.", translation:"Aunque el vuelo se retrasó, aún así llegamos a la reunión.",
        question:"Did they make it to the meeting?", options:["Yes","No","They cancelled it"], correct:0,
        explain:"“We still made it” confirma que sí llegaron, a pesar del retraso." },
      { id:'l-medio4-2', audioFile:'audio/b1/b1listening-009.mp3',
        transcript:"She has been working on this project for three months.", translation:"Ella ha estado trabajando en este proyecto durante tres meses.",
        question:"How long has she been working on the project?", options:["Three months","Three weeks","Three days"], correct:0,
        explain:"“For three months” indica la duración de la acción." },
      { id:'l-medio4-3', audioFile:'audio/b1/b1listening-010.mp3',
        transcript:"If I had more time, I would learn to play the guitar.", translation:"Si tuviera más tiempo, aprendería a tocar la guitarra.",
        question:"What would the speaker do with more time?", options:["Learn to play the guitar","Travel more","Read more books"], correct:0,
        explain:"Condicional tipo 2 describe algo hipotético: aprender guitarra." },
      { id:'l-medio4-4', audioFile:'audio/b1/b1listening-011.mp3',
        transcript:"The company is planning to open a new office next year.", translation:"La empresa está planeando abrir una nueva oficina el próximo año.",
        question:"What is the company planning to do?", options:["Open a new office","Close an office","Hire more people"], correct:0,
        explain:"“Planning to open a new office” dice específicamente el plan." }
    ],
    [
      { id:'l-medio5-1', audioFile:'audio/b1/b1listening-012.mp3',
        transcript:"I would have joined you, but I had already made other plans.", translation:"Me habría unido a ustedes, pero ya había hecho otros planes.",
        question:"Why didn't the speaker join?", options:["They had other plans","They forgot","They were sick"], correct:0,
        explain:"Condicional 3: “I would have joined” + explica que ya tenía otros planes." },
      { id:'l-medio5-2', audioFile:'audio/b1/b1listening-013.mp3',
        transcript:"The manager recommended that we reconsider the budget before Friday.", translation:"El gerente recomendó que reconsideráramos el presupuesto antes del viernes.",
        question:"What did the manager recommend?", options:["Reconsidering the budget","Cancelling the meeting","Hiring more staff"], correct:0,
        explain:"“Recommended that we reconsider the budget” dice específicamente qué se recomendó." },
      { id:'l-medio5-3', audioFile:'audio/b1/b1listening-014.mp3',
        transcript:"She's looking for a new apartment closer to her office.", translation:"Ella está buscando un nuevo apartamento más cerca de su oficina.",
        question:"What is she looking for?", options:["A new apartment","A new job","A new car"], correct:0,
        explain:"“Looking for a new apartment” indica exactamente lo que busca." }
    ],
    [
      { id:"l-medio6-1", audioFile:"audio/b1/b1listening-015.mp3",
        transcript:"I have never seen such a beautiful sunset.", translation:"Nunca he visto un atardecer tan hermoso.",
        question:"What has the speaker never seen?", options:["A beautiful sunrise","Such a beautiful sunset","A big city"], correct:1,
        explain:"“Have never seen” es presente perfecto para experiencias de vida." },
      { id:"l-medio6-2", audioFile:"audio/b1/b1listening-016.mp3",
        transcript:"The report needs to be finished by Friday.", translation:"El informe debe estar terminado para el viernes.",
        question:"When does the report need to be finished?", options:["By Monday","By next week","By Friday"], correct:2,
        explain:"“By Friday” indica la fecha límite." },
      { id:"l-medio6-3", audioFile:"audio/b1/b1listening-017.mp3",
        transcript:"If she had more money, she would travel more.", translation:"Si ella tuviera más dinero, viajaría más.",
        question:"What would she do with more money?", options:["Save it all","Travel more","Buy a house"], correct:1,
        explain:"Segundo condicional: situación hipotética con “would”." },
      { id:"l-medio6-4", audioFile:"audio/b1/b1listening-018.mp3",
        transcript:"He apologized for being late to the meeting.", translation:"Él se disculpó por llegar tarde a la reunión.",
        question:"What did he apologize for?", options:["Missing the meeting","Being late","Forgetting his notes"], correct:1,
        explain:"“Apologized for” + gerundio indica el motivo de la disculpa." }
    ],
    [
      { id:"l-medio7-1", audioFile:"audio/b1/b1listening-019.mp3",
        transcript:"The bridge was built over a hundred years ago.", translation:"El puente fue construido hace más de cien años.",
        question:"When was the bridge built?", options:["Fifty years ago","Last year","Over a hundred years ago"], correct:2,
        explain:"Voz pasiva: “was built” describe cuándo se construyó." },
      { id:"l-medio7-2", audioFile:"audio/b1/b1listening-020.mp3",
        transcript:"She must be tired after such a long trip.", translation:"Ella debe estar cansada después de un viaje tan largo.",
        question:"What does the speaker think about her?", options:["She must be happy","She must be angry","She must be tired"], correct:2,
        explain:"“Must be” expresa una deducción lógica." },
      { id:"l-medio7-3", audioFile:"audio/b1/b1listening-021.mp3",
        transcript:"Despite the rain, the game continued.", translation:"A pesar de la lluvia, el partido continuó.",
        question:"Did the game continue?", options:["No","It was cancelled","Yes"], correct:2,
        explain:"“Despite” introduce un contraste, pero la acción sí ocurrió." }
    ]
  ,

    [
      { id:"l-medio8-1", audioFile:"audio/b1/b1listening-022.mp3",
        transcript:"I might travel next month if I save enough money.", translation:"Podría viajar el próximo mes si ahorro suficiente dinero.",
        question:"What might the speaker do?", options:["Travel","Move","Quit his job"], correct:0,
        explain:"“I might travel” indica una posibilidad de viajar." },
      { id:"l-medio8-2", audioFile:"audio/b1/b1listening-023.mp3",
        transcript:"There isn't much time left before the deadline.", translation:"No queda mucho tiempo antes de la fecha límite.",
        question:"What is running out?", options:["Time","Money","Patience"], correct:0,
        explain:"“Isn't much time left” significa que se está quedando sin tiempo." },
      { id:"l-medio8-3", audioFile:"audio/b1/b1listening-024.mp3",
        transcript:"The report was reviewed by the whole team.", translation:"El informe fue revisado por todo el equipo.",
        question:"Who reviewed the report?", options:["The whole team","Only the manager","No one"], correct:0,
        explain:"“By the whole team” indica quién revisó el informe." }
    ]
  ,
  [
 {
  "id": "l-medio9-1",
  "audioFile": "audio/b1/b1listening-025.mp3",
  "transcript": "Stress can affect your sleep.",
  "translation": "El estrés puede afectar tu sueño.",
  "question": "What can stress affect?",
  "options": [
   "Your sleep",
   "Your money",
   "Your car"
  ],
  "correct": 0,
  "explain": "“Affect” es el verbo influir en algo."
 },
 {
  "id": "l-medio9-2",
  "audioFile": "audio/b1/b1listening-026.mp3",
  "transcript": "I don't know whether it will rain.",
  "translation": "No sé si va a llover.",
  "question": "What is the speaker unsure about?",
  "options": [
   "Whether it will rain",
   "Whether it is cold",
   "Whether to sleep"
  ],
  "correct": 0,
  "explain": "“Whether” presenta dos opciones (lloverá o no)."
 },
 {
  "id": "l-medio9-3",
  "audioFile": "audio/b1/b1listening-027.mp3",
  "transcript": "She gave me a nice compliment.",
  "translation": "Ella me hizo un lindo cumplido.",
  "question": "What did she give?",
  "options": [
   "A compliment",
   "A complaint",
   "A complement"
  ],
  "correct": 0,
  "explain": "“Compliment” significa un cumplido o elogio."
 }
],
    [
      { id:'l-medio11-1', audioFile:'audio/b1/b1listening-032.mp3',
        transcript:"Although he was tired, he finished the report.", translation:"Aunque estaba cansado, terminó el informe.",
        question:"What did he do despite being tired?", options:["He finished the report","He went to sleep","He canceled the meeting"], correct:0,
        explain:"“Although” introduce un contraste." },
      { id:'l-medio11-2', audioFile:'audio/b1/b1listening-033.mp3',
        transcript:"The company decided to postpone the launch until next month.", translation:"La empresa decidió posponer el lanzamiento hasta el próximo mes.",
        question:"What did the company decide to do?", options:["Postpone the launch","Cancel the launch","Speed up the launch"], correct:0,
        explain:"“Postpone” significa posponer." },
      { id:'l-medio11-3', audioFile:'audio/b1/b1listening-034.mp3',
        transcript:"If I had known about the traffic, I would have left earlier.", translation:"Si hubiera sabido sobre el tráfico, habría salido más temprano.",
        question:"What does the speaker regret?", options:["Not leaving earlier","Not taking the bus","Not calling ahead"], correct:0,
        explain:"Esta es una oración condicional sobre algo que no pasó." }
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
      { id:'l-avz2-2', audioFile:'audio/c1/c1listening-006.mp3',
        transcript:"She's married to a lawyer.", translation:"Ella está casada con un abogado.",
        question:"What is her husband's profession?", options:["Lawyer","Doctor","Teacher"], correct:0,
        explain:"“Married to” conecta con la profesión mencionada: abogado." }
    ],
    [
      { id:'l-avz3-1', audioFile:'audio/c1/c1listening-005.mp3',
        transcript:"The report written by the team was well received.", translation:"El informe escrito por el equipo fue bien recibido.",
        question:"Who wrote the report?", options:["The team","The manager","A client"], correct:0,
        explain:"“Written by the team” es una cláusula relativa reducida." },
      { id:'l-avz3-2', audioFile:'audio/c1/c1listening-007.mp3',
        transcript:"Rarely have I seen such dedication.", translation:"Rara vez he visto tanta dedicación.",
        question:"What does this sentence suggest?", options:["The speaker rarely sees this level of dedication","The speaker sees it often","The speaker has never seen dedication"], correct:0,
        explain:"“Rarely” + inversión enfatiza que ocurre pocas veces, no nunca." }
    ],
    [
      { id:'l-avz4-1', audioFile:'audio/c1/c1listening-008.mp3',
        transcript:"Not only did the negotiations fail, but the deal was also cancelled.", translation:"No solo fracasaron las negociaciones, sino que además se canceló el trato.",
        question:"What happened to the deal?", options:["It was cancelled","It was signed","It was postponed"], correct:0,
        explain:"“But the deal was also cancelled” confirma el resultado final." },
      { id:'l-avz4-2', audioFile:'audio/c1/c1listening-009.mp3',
        transcript:"It is believed that the new policy will reduce costs significantly.", translation:"Se cree que la nueva política reducirá los costos significativamente.",
        question:"What is the new policy expected to do?", options:["Reduce costs","Increase costs","Have no effect"], correct:0,
        explain:"“Reduce costs significantly” es lo que se espera de la política." },
      { id:'l-avz4-3', audioFile:'audio/c1/c1listening-010.mp3',
        transcript:"Had the team communicated better, the project would have finished on time.", translation:"Si el equipo se hubiera comunicado mejor, el proyecto habría terminado a tiempo.",
        question:"Did the project finish on time?", options:["No","Yes","It's unclear"], correct:0,
        explain:"Condicional tipo 3 implica que en realidad NO terminó a tiempo." },
      { id:'l-avz4-4', audioFile:'audio/c1/c1listening-011.mp3',
        transcript:"Rarely does a company achieve such rapid growth without external investment.", translation:"Rara vez una empresa logra un crecimiento tan rápido sin inversión externa.",
        question:"What does this sentence suggest about rapid growth without external investment?", options:["It's rare","It's common","It's impossible"], correct:0,
        explain:"“Rarely” + inversión enfatiza que es poco común, no imposible." }
    ],
    [
      { id:'l-avz5-1', audioFile:'audio/c1/c1listening-012.mp3',
        transcript:"It is widely believed that the new regulation will curb inflation.", translation:"Se cree ampliamente que la nueva regulación frenará la inflación.",
        question:"What effect is the regulation expected to have?", options:["Curb inflation","Increase inflation","Have no effect"], correct:0,
        explain:"“Curb inflation” es el efecto esperado según la frase." },
      { id:'l-avz5-2', audioFile:'audio/c1/c1listening-013.mp3',
        transcript:"Had the board been more transparent, shareholders wouldn't have lost confidence.", translation:"Si la junta hubiera sido más transparente, los accionistas no habrían perdido la confianza.",
        question:"What actually happened, according to this sentence?", options:["Shareholders lost confidence","Shareholders gained confidence","The board was transparent"], correct:0,
        explain:"Condicional 3 implica que en realidad la junta NO fue transparente y sí se perdió la confianza." },
      { id:'l-avz5-3', audioFile:'audio/c1/c1listening-014.mp3',
        transcript:"Arguably, this has been the company's most challenging quarter to date.", translation:"Posiblemente, este ha sido el trimestre más desafiante de la empresa hasta la fecha.",
        question:"What does the speaker suggest about this quarter?", options:["It was the most challenging one","It was an easy quarter","It was average"], correct:0,
        explain:"“Most challenging quarter to date” indica que fue el más difícil hasta ahora." }
    ],
    [
      { id:"l-avz6-1", audioFile:"audio/c1/c1listening-015.mp3",
        transcript:"Seldom do we encounter such dedication in this industry.", translation:"Rara vez encontramos tanta dedicación en esta industria.",
        question:"What does this suggest?", options:["It's common","It's rare","It's expected"], correct:1,
        explain:"Inversión con “seldom” enfatiza que es poco frecuente." },
      { id:"l-avz6-2", audioFile:"audio/c1/c1listening-016.mp3",
        transcript:"The proposal, once rejected, was later approved unanimously.", translation:"La propuesta, una vez rechazada, fue aprobada después por unanimidad.",
        question:"What eventually happened to the proposal?", options:["It stayed rejected","It was withdrawn","It was approved"], correct:2,
        explain:"Cláusula reducida “once rejected” = después de ser rechazada." },
      { id:"l-avz6-3", audioFile:"audio/c1/c1listening-017.mp3",
        transcript:"Were it not for her guidance, the project would have failed.", translation:"Si no fuera por su guía, el proyecto habría fracasado.",
        question:"What does this imply about her guidance?", options:["It was unnecessary","It was essential to success","It caused the failure"], correct:1,
        explain:"“Were it not for” es una forma formal de condicional tipo 3 sin “if”." },
      { id:"l-avz6-4", audioFile:"audio/c1/c1listening-018.mp3",
        transcript:"The findings, though preliminary, suggest a significant shift in the market.", translation:"Los hallazgos, aunque preliminares, sugieren un cambio significativo en el mercado.",
        question:"What do the findings suggest?", options:["No change at all","A significant market shift","A minor error"], correct:1,
        explain:"“Though preliminary” introduce un contraste concesivo." }
    ],
    [
      { id:"l-avz7-1", audioFile:"audio/c1/c1listening-019.mp3",
        transcript:"Not until the deadline passed did they realize the mistake.", translation:"No fue sino hasta que pasó la fecha límite que se dieron cuenta del error.",
        question:"When did they realize the mistake?", options:["Before the deadline","During the meeting","After the deadline passed"], correct:2,
        explain:"Inversión con “not until” enfatiza el momento exacto." },
      { id:"l-avz7-2", audioFile:"audio/c1/c1listening-020.mp3",
        transcript:"It was the CEO who ultimately made the final decision.", translation:"Fue el director ejecutivo quien finalmente tomó la decisión final.",
        question:"Who made the final decision?", options:["The board","The manager","The CEO"], correct:2,
        explain:"Oración hendida (“it was... who...”) enfatiza quién tomó la decisión." },
      { id:"l-avz7-3", audioFile:"audio/c1/c1listening-021.mp3",
        transcript:"Should the negotiations collapse, both parties will suffer losses.", translation:"Si las negociaciones fracasan, ambas partes sufrirán pérdidas.",
        question:"What will happen if negotiations collapse?", options:["Only one side will lose","Nothing will change","Both parties will suffer losses"], correct:2,
        explain:"“Should” + infinitivo es una forma formal de condicional tipo 1." }
    ]
  ,

    [
      { id:"l-avanzado8-1", audioFile:"audio/c1/c1listening-022.mp3",
        transcript:"The lecture was so boring that half the students left early.", translation:"La conferencia fue tan aburrida que la mitad de los estudiantes se fue temprano.",
        question:"What happened during the lecture?", options:["Half the students left early","Everyone stayed until the end","The lecture was canceled"], correct:0,
        explain:"“Half the students left early” describe lo que pasó." },
      { id:"l-avanzado8-2", audioFile:"audio/c1/c1listening-023.mp3",
        transcript:"It is essential that the report be submitted by Friday.", translation:"Es esencial que el informe se entregue antes del viernes.",
        question:"When must the report be submitted?", options:["By Friday","By Monday","There's no deadline"], correct:0,
        explain:"“By Friday” es la fecha límite mencionada." },
      { id:"l-avanzado8-3", audioFile:"audio/c1/c1listening-024.mp3",
        transcript:"The proposal is, arguably, the most ambitious one we've seen.", translation:"La propuesta es, podría decirse, la más ambiciosa que hemos visto.",
        question:"How is the proposal described?", options:["As the most ambitious one","As the weakest one","As unrealistic"], correct:0,
        explain:"“The most ambitious one” describe la propuesta." }
    ]
  ,
  [
 {
  "id": "l-avanzado9-1",
  "audioFile": "audio/c1/c1listening-025.mp3",
  "transcript": "We need further information before deciding.",
  "translation": "Necesitamos más información antes de decidir.",
  "question": "What do they need?",
  "options": [
   "Further information",
   "Less time",
   "A new plan"
  ],
  "correct": 0,
  "explain": "“Further” significa más, en un sentido abstracto."
 },
 {
  "id": "l-avanzado9-2",
  "audioFile": "audio/c1/c1listening-026.mp3",
  "transcript": "The car remained stationary for hours.",
  "translation": "El carro permaneció estacionario por horas.",
  "question": "What did the car do?",
  "options": [
   "It stayed still",
   "It moved fast",
   "It broke down"
  ],
  "correct": 0,
  "explain": "“Stationary” significa que no se mueve."
 },
 {
  "id": "l-avanzado9-3",
  "audioFile": "audio/c1/c1listening-027.mp3",
  "transcript": "The illicit trade was stopped by the police.",
  "translation": "El comercio ilícito fue detenido por la policía.",
  "question": "What kind of trade was it?",
  "options": [
   "Illicit (illegal)",
   "Legal",
   "International"
  ],
  "correct": 0,
  "explain": "“Illicit” significa ilegal, no permitido."
 }
],
    [
      { id:'l-avanzado11-1', audioFile:'audio/c1/c1listening-032.mp3',
        transcript:"The negotiations were far more complex than anyone had anticipated.", translation:"Las negociaciones fueron mucho más complejas de lo que nadie había anticipado.",
        question:"How were the negotiations, compared to expectations?", options:["More complex than expected","Simpler than expected","Exactly as expected"], correct:0,
        explain:"“Far more complex than anticipated” significa mucho más complejas de lo esperado." },
      { id:'l-avanzado11-2', audioFile:'audio/c1/c1listening-033.mp3',
        transcript:"Despite the setbacks, the team remained remarkably resilient.", translation:"A pesar de los contratiempos, el equipo se mantuvo notablemente resiliente.",
        question:"How did the team react to the setbacks?", options:["They stayed resilient","They gave up","They got angry"], correct:0,
        explain:"“Resilient” significa resiliente, que se recupera bien." },
      { id:'l-avanzado11-3', audioFile:'audio/c1/c1listening-034.mp3',
        transcript:"She tends to downplay her achievements, even when they are significant.", translation:"Ella tiende a minimizar sus logros, incluso cuando son importantes.",
        question:"What does she do with her achievements?", options:["She downplays them","She exaggerates them","She ignores them completely"], correct:0,
        explain:"“Downplay” significa minimizar o quitarle importancia." }
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
  principiante: [
    [
      { id:'s-principiante-1', sentence:"I have a dog.", translation:"Tengo un perro.", audioFile:'audio/a0/a0speaking-001.mp3' },
      { id:'s-principiante-2', sentence:"The chair is blue.", translation:"La silla es azul.", audioFile:'audio/a0/a0speaking-002.mp3' },
      { id:'s-principiante-3', sentence:"This is my father.", translation:"Este es mi pap\u00e1.", audioFile:'audio/a0/a0speaking-003.mp3' }
    ],
    [
      { id:'s-principiante2-1', sentence:"I drink water.", translation:"Tomo agua.", audioFile:'audio/a0/a0speaking-004.mp3' },
      { id:'s-principiante2-2', sentence:"Hello, my name is Ana.", translation:"Hola, me llamo Ana.", audioFile:'audio/a0/a0speaking-005.mp3' }
    ],
    [
      { id:"s-principiante3-1", sentence:"I have a red ball.", translation:"Tengo una pelota roja.", audioFile:"audio/a0/a0speaking-006.mp3" },
      { id:"s-principiante3-2", sentence:"My mother is nice.", translation:"Mi mamá es amable.", audioFile:"audio/a0/a0speaking-007.mp3" },
      { id:"s-principiante3-3", sentence:"I like my school.", translation:"Me gusta mi escuela.", audioFile:"audio/a0/a0speaking-008.mp3" }
    ],
    [
      { id:"s-principiante4-1", sentence:"The dog is big.", translation:"El perro es grande.", audioFile:"audio/a0/a0speaking-009.mp3" },
      { id:"s-principiante4-2", sentence:"She has blue eyes.", translation:"Ella tiene ojos azules.", audioFile:"audio/a0/a0speaking-010.mp3" },
      { id:"s-principiante4-3", sentence:"We have a new car.", translation:"Tenemos un carro nuevo.", audioFile:"audio/a0/a0speaking-011.mp3" }
    ],
    [
      { id:"s-principiante5-1", sentence:"I eat an apple every day.", translation:"Como una manzana todos los días.", audioFile:"audio/a0/a0speaking-012.mp3" },
      { id:"s-principiante5-2", sentence:"This is my friend.", translation:"Este es mi amigo.", audioFile:"audio/a0/a0speaking-013.mp3" }
    ]
  ,

    [
      { id:"s-principiante6-1", sentence:"It is Tuesday today.", translation:"Hoy es martes.", audioFile:"audio/a0/a0speaking-014.mp3" },
      { id:"s-principiante6-2", sentence:"This is your pencil.", translation:"Este es tu lápiz.", audioFile:"audio/a0/a0speaking-015.mp3" },
      { id:"s-principiante6-3", sentence:"I am ten years old.", translation:"Tengo diez años.", audioFile:"audio/a0/a0speaking-016.mp3" }
    ]
  ,
  [
 {
  "id": "s-principiante7-1",
  "sentence": "Can you lend me your umbrella?",
  "translation": "¿Me prestas tu paraguas?",
  "audioFile": "audio/a0/a0speaking-017.mp3"
 },
 {
  "id": "s-principiante7-2",
  "sentence": "He plays soccer well.",
  "translation": "Él juega bien al fútbol.",
  "audioFile": "audio/a0/a0speaking-018.mp3"
 },
 {
  "id": "s-principiante7-3",
  "sentence": "I want to buy a book.",
  "translation": "Quiero comprar un libro.",
  "audioFile": "audio/a0/a0speaking-019.mp3"
 }
],
    [
      { id:'s-principiante8-1', sentence:"I have a green backpack.", translation:"Tengo una mochila verde.", audioFile:'audio/a0/a0speaking-020.mp3' },
      { id:'s-principiante8-2', sentence:"My brother is tall.", translation:"Mi hermano es alto.", audioFile:'audio/a0/a0speaking-021.mp3' },
      { id:'s-principiante8-3', sentence:"We eat breakfast at seven.", translation:"Desayunamos a las siete.", audioFile:'audio/a0/a0speaking-022.mp3' }
    ]
  ],
  facil: [
    [
      { id:'s-facil-1', sentence:"What time is it?", translation:"¿Qué hora es?", audioFile:'audio/a1/a1speaking-001.mp3' },
      { id:'s-facil-2', sentence:"My name is Veronica and I am from Colombia.", translation:"Me llamo Veronica y soy de Colombia.", audioFile:'audio/a1/a1speaking-002.mp3' },
      { id:'s-facil-3', sentence:"I usually have breakfast at eight.", translation:"Normalmente desayuno a las ocho.", audioFile:'audio/a1/a1speaking-003.mp3' }
    ],
    [
      { id:'s-facil2-1', sentence:"My keys are in my bag.", translation:"Mis llaves están en mi bolso.", audioFile:'audio/a1/a1speaking-004.mp3' },
      { id:'s-facil2-2', sentence:"He can cook well, but he can't bake.", translation:"Él cocina bien, pero no sabe hornear.", audioFile:'audio/a1/a1speaking-006.mp3' }
    ],
    [
      { id:'s-facil3-1', sentence:"My backpack is lighter than his.", translation:"Mi mochila es más liviana que la de él.", audioFile:'audio/a1/a1speaking-005.mp3' },
      { id:'s-facil3-2', sentence:"There are too many people here.", translation:"Hay demasiada gente aquí.", audioFile:'audio/a1/a1speaking-007.mp3' }
    ],
    [
      { id:'s-facil5-1', sentence:"I usually take the bus to work.", translation:"Normalmente tomo el autobús para ir al trabajo.", audioFile:'audio/a1/a1speaking-008.mp3' },
      { id:'s-facil5-2', sentence:"Can you close the window, please?", translation:"¿Puedes cerrar la ventana, por favor?", audioFile:'audio/a1/a1speaking-009.mp3' },
      { id:'s-facil5-3', sentence:"My brother is older than me, but he is shorter.", translation:"Mi hermano es mayor que yo, pero es más bajo.", audioFile:'audio/a1/a1speaking-010.mp3' }
    ],
    [
      { id:"s-facil6-1", sentence:"I forgot my keys at home.", translation:"Olvidé mis llaves en casa.", audioFile:"audio/a1/a1speaking-011.mp3" },
      { id:"s-facil6-2", sentence:"The soup is too salty for me.", translation:"La sopa está muy salada para mí.", audioFile:"audio/a1/a1speaking-012.mp3" },
      { id:"s-facil6-3", sentence:"My mother works in a school.", translation:"Mi mamá trabaja en una escuela.", audioFile:"audio/a1/a1speaking-013.mp3" },
      { id:"s-facil6-4", sentence:"He always arrives late to work.", translation:"Él siempre llega tarde al trabajo.", audioFile:"audio/a1/a1speaking-014.mp3" }
    ],
    [
      { id:"s-facil7-1", sentence:"The park is next to my house.", translation:"El parque está junto a mi casa.", audioFile:"audio/a1/a1speaking-015.mp3" },
      { id:"s-facil7-2", sentence:"I need to buy a new phone.", translation:"Necesito comprar un teléfono nuevo.", audioFile:"audio/a1/a1speaking-016.mp3" },
      { id:"s-facil7-3", sentence:"This tea is weaker than that one.", translation:"Este té es más débil que ese.", audioFile:"audio/a1/a1speaking-017.mp3" },
      { id:"s-facil7-4", sentence:"The museum closes at six in the evening.", translation:"El museo cierra a las seis de la tarde.", audioFile:"audio/a1/a1speaking-018.mp3" }
    ]
  ,

    [
      { id:"s-facil8-1", sentence:"I worked yesterday.", translation:"Trabajé ayer.", audioFile:"audio/a1/a1speaking-019.mp3" },
      { id:"s-facil8-2", sentence:"Do you like coffee?", translation:"¿Te gusta el café?", audioFile:"audio/a1/a1speaking-020.mp3" },
      { id:"s-facil8-3", sentence:"This car is faster than mine.", translation:"Este carro es más rápido que el mío.", audioFile:"audio/a1/a1speaking-021.mp3" }
    ]
  ,
  [
 {
  "id": "s-facil9-1",
  "sentence": "First I study, then I rest.",
  "translation": "Primero estudio, luego descanso.",
  "audioFile": "audio/a1/a1speaking-022.mp3"
 },
 {
  "id": "s-facil9-2",
  "sentence": "This is better than that.",
  "translation": "Esto es mejor que eso.",
  "audioFile": "audio/a1/a1speaking-023.mp3"
 },
 {
  "id": "s-facil9-3",
  "sentence": "I suggest you rest a little.",
  "translation": "Sugiero que descanses un poco.",
  "audioFile": "audio/a1/a1speaking-024.mp3"
 }
],
    [
      { id:'s-facil10-1', sentence:"I need to buy groceries after work.", translation:"Necesito comprar víveres después del trabajo.", audioFile:'audio/a1/a1speaking-025.mp3' },
      { id:'s-facil10-2', sentence:"Can you turn off the lights, please?", translation:"¿Puedes apagar las luces, por favor?", audioFile:'audio/a1/a1speaking-026.mp3' },
      { id:'s-facil10-3', sentence:"The bus was late this morning.", translation:"El bus llegó tarde esta mañana.", audioFile:'audio/a1/a1speaking-027.mp3' }
    ]
  ],
  medio: [
    [
      { id:'s-medio-1', sentence:"By the time I finished cooking, everyone had already left.", translation:"Para cuando terminé de cocinar, todos ya se habían ido.", audioFile:'audio/b1/b1speaking-001.mp3' },
      { id:'s-medio-2', sentence:"I'm used to working late.", translation:"Estoy acostumbrado a trabajar hasta tarde.", audioFile:'audio/b1/b1speaking-002.mp3' },
      { id:'s-medio-3', sentence:"Nevertheless, we decided to continue.", translation:"Sin embargo, decidimos continuar.", audioFile:'audio/b1/b1speaking-003.mp3' }
    ],
    [
      { id:'s-medio2-1', sentence:"He said that he needed more time.", translation:"Él dijo que necesitaba más tiempo.", audioFile:'audio/b1/b1speaking-004.mp3' },
      { id:'s-medio2-2', sentence:"She enjoys reading before bed.", translation:"A ella le gusta leer antes de dormir.", audioFile:'audio/b1/b1speaking-006.mp3' }
    ],
    [
      { id:'s-medio3-1', sentence:"If she studies hard, she will pass the exam.", translation:"Si ella estudia duro, aprobará el examen.", audioFile:'audio/b1/b1speaking-005.mp3' },
      { id:'s-medio3-2', sentence:"The book that I read was fantastic.", translation:"El libro que leí fue fantástico.", audioFile:'audio/b1/b1speaking-007.mp3' }
    ],
    [
      { id:'s-medio5-1', sentence:"I would have joined you, but I had other plans.", translation:"Me habría unido a ustedes, pero tenía otros planes.", audioFile:'audio/b1/b1speaking-008.mp3' },
      { id:'s-medio5-2', sentence:"He's looking for a job with better hours.", translation:"Él está buscando un trabajo con mejor horario.", audioFile:'audio/b1/b1speaking-009.mp3' },
      { id:'s-medio5-3', sentence:"The teacher suggested that we practice more.", translation:"La maestra sugirió que practicáramos más.", audioFile:'audio/b1/b1speaking-010.mp3' }
    ],
    [
      { id:"s-medio6-1", sentence:"I have never tried sushi before.", translation:"Nunca he probado el sushi.", audioFile:"audio/b1/b1speaking-011.mp3" },
      { id:"s-medio6-2", sentence:"The project needs to be ready by Monday.", translation:"El proyecto debe estar listo para el lunes.", audioFile:"audio/b1/b1speaking-012.mp3" },
      { id:"s-medio6-3", sentence:"If I had more free time, I would read more.", translation:"Si tuviera más tiempo libre, leería más.", audioFile:"audio/b1/b1speaking-013.mp3" },
      { id:"s-medio6-4", sentence:"She apologized for forgetting the appointment.", translation:"Ella se disculpó por olvidar la cita.", audioFile:"audio/b1/b1speaking-014.mp3" }
    ],
    [
      { id:"s-medio7-1", sentence:"The house was built fifty years ago.", translation:"La casa fue construida hace cincuenta años.", audioFile:"audio/b1/b1speaking-015.mp3" },
      { id:"s-medio7-2", sentence:"He must be exhausted after the exam.", translation:"Él debe estar agotado después del examen.", audioFile:"audio/b1/b1speaking-016.mp3" },
      { id:"s-medio7-3", sentence:"Despite the traffic, we arrived on time.", translation:"A pesar del tráfico, llegamos a tiempo.", audioFile:"audio/b1/b1speaking-017.mp3" }
    ]
  ,

    [
      { id:"s-medio8-1", sentence:"I might travel next month.", translation:"Podría viajar el próximo mes.", audioFile:"audio/b1/b1speaking-018.mp3" },
      { id:"s-medio8-2", sentence:"There is a lot of traffic today.", translation:"Hay mucho tráfico hoy.", audioFile:"audio/b1/b1speaking-019.mp3" },
      { id:"s-medio8-3", sentence:"The report was finished on time.", translation:"El informe se terminó a tiempo.", audioFile:"audio/b1/b1speaking-020.mp3" }
    ]
  ,
  [
 {
  "id": "s-medio9-1",
  "sentence": "The rain affected the game.",
  "translation": "La lluvia afectó el juego.",
  "audioFile": "audio/b1/b1speaking-021.mp3"
 },
 {
  "id": "s-medio9-2",
  "sentence": "Don't lose your keys again.",
  "translation": "No pierdas tus llaves otra vez.",
  "audioFile": "audio/b1/b1speaking-022.mp3"
 },
 {
  "id": "s-medio9-3",
  "sentence": "These colors complement each other.",
  "translation": "Estos colores se complementan.",
  "audioFile": "audio/b1/b1speaking-023.mp3"
 }
],
    [
      { id:'s-medio10-1', sentence:"I've been trying to improve my pronunciation lately.", translation:"He estado tratando de mejorar mi pronunciación últimamente.", audioFile:'audio/b1/b1speaking-024.mp3' },
      { id:'s-medio10-2', sentence:"We should have booked the tickets earlier.", translation:"Deberíamos haber reservado los boletos antes.", audioFile:'audio/b1/b1speaking-025.mp3' }
    ]
  ],
  avanzado: [
    [
      { id:'s-avz-1', sentence:"Had we left earlier, we wouldn't have missed the flight.", translation:"Si hubiéramos salido más temprano, no habríamos perdido el vuelo.", audioFile:'audio/c1/c1speaking-001.mp3' },
      { id:'s-avz-2', sentence:"No sooner had he sat down than the phone rang.", translation:"Apenas se había sentado cuando sonó el teléfono.", audioFile:'audio/c1/c1speaking-002.mp3' },
      { id:'s-avz-3', sentence:"Despite the setbacks, morale remains high.", translation:"A pesar de los contratiempos, la moral se mantiene alta.", audioFile:'audio/c1/c1speaking-003.mp3' }
    ],
    [
      { id:'s-avz2-1', sentence:"Nevertheless, the team kept working.", translation:"Sin embargo, el equipo siguió trabajando.", audioFile:'audio/c1/c1speaking-004.mp3' },
      { id:'s-avz2-2', sentence:"He must have forgotten the meeting.", translation:"Debe haberse olvidado de la reunión.", audioFile:'audio/c1/c1speaking-006.mp3' }
    ],
    [
      { id:'s-avz3-1', sentence:"The proposal submitted by the client was rejected.", translation:"La propuesta presentada por el cliente fue rechazada.", audioFile:'audio/c1/c1speaking-005.mp3' },
      { id:'s-avz3-2', sentence:"Should you need anything, just ask.", translation:"Si necesitas algo, solo pregunta.", audioFile:'audio/c1/c1speaking-007.mp3' }
    ],
    [
      { id:'s-avz5-1', sentence:"Despite the setbacks, the team managed to launch the product on schedule.", translation:"A pesar de los contratiempos, el equipo logró lanzar el producto a tiempo.", audioFile:'audio/c1/c1speaking-008.mp3' },
      { id:'s-avz5-2', sentence:"The committee is expected to announce its decision sometime next week.", translation:"Se espera que el comité anuncie su decisión en algún momento de la próxima semana.", audioFile:'audio/c1/c1speaking-009.mp3' },
      { id:'s-avz5-3', sentence:"Few people anticipated how quickly the market would recover.", translation:"Pocas personas anticiparon qué tan rápido se recuperaría el mercado.", audioFile:'audio/c1/c1speaking-010.mp3' }
    ],
    [
      { id:"s-avz6-1", sentence:"Seldom have I witnessed such professionalism.", translation:"Rara vez he presenciado tanto profesionalismo.", audioFile:"audio/c1/c1speaking-011.mp3" },
      { id:"s-avz6-2", sentence:"The plan, once dismissed, was eventually reconsidered.", translation:"El plan, una vez descartado, fue reconsiderado con el tiempo.", audioFile:"audio/c1/c1speaking-012.mp3" },
      { id:"s-avz6-3", sentence:"Were it not for his support, we would have given up.", translation:"Si no fuera por su apoyo, habríamos desistido.", audioFile:"audio/c1/c1speaking-013.mp3" },
      { id:"s-avz6-4", sentence:"The data, though incomplete, points to a clear trend.", translation:"Los datos, aunque incompletos, apuntan a una tendencia clara.", audioFile:"audio/c1/c1speaking-014.mp3" }
    ],
    [
      { id:"s-avz7-1", sentence:"Not until she called did we learn the truth.", translation:"No fue sino hasta que ella llamó que supimos la verdad.", audioFile:"audio/c1/c1speaking-015.mp3" },
      { id:"s-avz7-2", sentence:"It was the manager who approved the final budget.", translation:"Fue el gerente quien aprobó el presupuesto final.", audioFile:"audio/c1/c1speaking-016.mp3" },
      { id:"s-avz7-3", sentence:"Should the deal fall through, we will look elsewhere.", translation:"Si el trato no se concreta, buscaremos en otro lugar.", audioFile:"audio/c1/c1speaking-017.mp3" }
    ]
  ,

    [
      { id:"s-avanzado7-1", sentence:"The movie was boring, and I felt bored.", translation:"La película fue aburrida, y me sentí aburrido.", audioFile:"audio/c1/c1speaking-018.mp3" },
      { id:"s-avanzado7-2", sentence:"It is important that you arrive early.", translation:"Es importante que llegues temprano.", audioFile:"audio/c1/c1speaking-019.mp3" },
      { id:"s-avanzado7-3", sentence:"The plan is, arguably, too ambitious.", translation:"El plan es, podría decirse, demasiado ambicioso.", audioFile:"audio/c1/c1speaking-020.mp3" }
    ]
  ,
  [
 {
  "id": "s-avanzado8-1",
  "sentence": "Honesty is his main principle.",
  "translation": "La honestidad es su principio principal.",
  "audioFile": "audio/c1/c1speaking-021.mp3"
 },
 {
  "id": "s-avanzado8-2",
  "sentence": "We drove farther north than planned.",
  "translation": "Manejamos más al norte de lo planeado.",
  "audioFile": "audio/c1/c1speaking-022.mp3"
 },
 {
  "id": "s-avanzado8-3",
  "sentence": "The question elicited a strong reaction.",
  "translation": "La pregunta provocó una fuerte reacción.",
  "audioFile": "audio/c1/c1speaking-023.mp3"
 }
],
    [
      { id:'s-avanzado9-1', sentence:"The proposal was rejected due to budget constraints.", translation:"La propuesta fue rechazada debido a restricciones de presupuesto.", audioFile:'audio/c1/c1speaking-024.mp3' },
      { id:'s-avanzado9-2', sentence:"He's known for being remarkably meticulous about details.", translation:"Es conocido por ser notablemente meticuloso con los detalles.", audioFile:'audio/c1/c1speaking-025.mp3' }
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
  principiante: [
    [
      { id:'w-principiante-1', prompt:"Escribe una frase diciendo qu\u00e9 animal tienes (usa \u201cI have a ___\u201d).", target:"I have a [animal]",
        checkPattern:"i have (a|an) [a-z]+", hint:"Estructura esperada: \u201cI have a ___.\u201d",
        example:{en:"I have a cat.", es:"Tengo un gato."},
        checklist:["\u00bfEmpezaste con \u201cI have\u201d?","\u00bfUsaste \u201ca\u201d antes del animal?","\u00bfEscribiste el nombre del animal en ingl\u00e9s?"] },
      { id:'w-principiante-2', prompt:"Escribe una frase con un color (usa \u201cThe ___ is ___\u201d).", target:"the [object] is [color]",
        checkPattern:"the [a-z]+ is (red|blue|green|yellow|black|white|brown|purple|orange|pink)", hint:"Estructura esperada: \u201cThe ___ is ___.\u201d",
        example:{en:"The car is blue.", es:"El carro es azul."},
        checklist:["\u00bfEmpezaste con \u201cThe\u201d?","\u00bfUsaste \u201cis\u201d antes del color?","\u00bfEl color est\u00e1 en ingl\u00e9s?"] },
      { id:'w-principiante-3', prompt:"Escribe cu\u00e1ntos hermanos o mascotas tienes (usa un n\u00famero).", target:"I have [number] ...",
        checkPattern:"i have (one|two|three|four|five|six|seven|eight|nine|ten) [a-z]+", hint:"Estructura esperada: \u201cI have ___ ___.\u201d",
        example:{en:"I have two brothers.", es:"Tengo dos hermanos."},
        checklist:["\u00bfEmpezaste con \u201cI have\u201d?","\u00bfUsaste un n\u00famero en ingl\u00e9s?","\u00bfLa palabra despu\u00e9s del n\u00famero tiene sentido?"] },
      { id:'w-principiante-4', prompt:"Pres\u00e9ntate con un saludo simple (usa \u201cHello, my name is ___\u201d).", target:"hello / my name is",
        checkPattern:"hello.*my name is [a-z]+", hint:"Estructura esperada: \u201cHello, my name is ___.\u201d",
        example:{en:"Hello, my name is Carlos.", es:"Hola, me llamo Carlos."},
        checklist:["\u00bfEmpezaste con \u201cHello\u201d?","\u00bfUsaste \u201cmy name is\u201d?","\u00bfEscribiste tu nombre?"] }
    ],
    [
      { id:'w-principiante2-1', prompt:"Describe tu casa con un adjetivo simple (usa \u201cMy house is ___\u201d).", target:"my house is [adj]",
        checkPattern:"my house is [a-z]+", hint:"Estructura esperada: \u201cMy house is ___.\u201d",
        example:{en:"My house is big.", es:"Mi casa es grande."},
        checklist:["\u00bfEmpezaste con \u201cMy house is\u201d?","\u00bfUsaste un adjetivo en ingl\u00e9s?","\u00bfLa frase tiene sentido?"] },
      { id:'w-principiante2-2', prompt:"Escribe cu\u00e1ntos libros tienes (usa \u201cI have ___ books\u201d).", target:"I have [number] books",
        checkPattern:"i have (one|two|three|four|five|six|seven|eight|nine|ten) books?", hint:"Estructura esperada: \u201cI have ___ books.\u201d",
        example:{en:"I have three books.", es:"Tengo tres libros."},
        checklist:["\u00bfUsaste \u201cI have\u201d?","\u00bfUsaste un n\u00famero en ingl\u00e9s?","\u00bfEscribiste \u201cbooks\u201d al final?"] },
      { id:'w-principiante2-3', prompt:"Escribe el nombre de un familiar (usa \u201cThis is my ___\u201d).", target:"this is my [family member]",
        checkPattern:"this is my [a-z]+", hint:"Estructura esperada: \u201cThis is my ___.\u201d",
        example:{en:"This is my mother.", es:"Esta es mi mam\u00e1."},
        checklist:["\u00bfEmpezaste con \u201cThis is my\u201d?","\u00bfEscribiste un familiar en ingl\u00e9s (mother, father, brother, sister)?","\u00bfLa frase tiene sentido?"] },
      { id:'w-principiante2-4', prompt:"Responde \u201cno\u201d a esta pregunta: \u201cIs this a dog?\u201d (usa \u201cNo, it isn't.\u201d)", target:"no, it isn't",
        checkPattern:"no,? ?it isn.?t", hint:"Estructura esperada: \u201cNo, it isn't.\u201d",
        example:{en:"No, it isn't.", es:"No, no lo es."},
        checklist:["\u00bfEmpezaste con \u201cNo\u201d?","\u00bfUsaste \u201cit isn't\u201d?","\u00bfEscribiste la frase completa?"] }
    ]
  ,

    [
      { id:'w-principiante3-1', prompt:"Escribe qué día es hoy (usa \"Today is ___\").", target:"today is [day]",
        checkPattern:"today is (monday|tuesday|wednesday|thursday|friday|saturday|sunday)", hint:"Estructura esperada: “Today is ___.”",
        example:{en:"Today is Monday.", es:"Hoy es lunes."},
        checklist:["¿Empezaste con “Today is”?","¿Usaste el nombre de un día en inglés?","¿La frase tiene sentido?"] },
      { id:'w-principiante3-2', prompt:"Escribe una frase con \"I can\" diciendo algo que sabes hacer.", target:"I can [verb]",
        checkPattern:"i can [a-z]+", hint:"Estructura esperada: “I can ___.”",
        example:{en:"I can swim.", es:"Yo sé nadar."},
        checklist:["¿Empezaste con “I can”?","¿Usaste un verbo en inglés?","¿La frase tiene sentido?"] },
      { id:'w-principiante3-3', prompt:"Escribe una frase con un adjetivo posesivo (usa \"This is my ___\").", target:"this is my [thing]",
        checkPattern:"this is my [a-z]+", hint:"Estructura esperada: “This is my ___.”",
        example:{en:"This is my pencil.", es:"Este es mi lápiz."},
        checklist:["¿Empezaste con “This is my”?","¿Escribiste un objeto en inglés?","¿La frase tiene sentido?"] },
      { id:'w-principiante3-4', prompt:"Escribe cuántos años tienes (usa \"I am ___ years old\").", target:"I am [number] years old",
        checkPattern:"i am (one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|\\d+) years old", hint:"Estructura esperada: “I am ___ years old.”",
        example:{en:"I am ten years old.", es:"Tengo diez años."},
        checklist:["¿Empezaste con “I am”?","¿Usaste un número antes de “years old”?","¿Terminaste con “years old”?"] }
    ]
  ,
  [
 {
  "id": "w-principiante4-1",
  "prompt": "Escribe una frase pidiendo algo prestado (usa \"Can I borrow ___?\").",
  "target": "Can I borrow [thing]",
  "checkPattern": "can i borrow [a-z]+",
  "hint": "Estructura esperada: “Can I borrow ___?”",
  "example": {
   "en": "Can I borrow your pen?",
   "es": "¿Me prestas tu lápiz?"
  },
  "checklist": [
   "¿Empezaste con “Can I borrow”?",
   "¿Escribiste un objeto en inglés?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-principiante4-2",
  "prompt": "Escribe una frase diciendo que alguien hace algo bien (usa \"He/She plays ___ well\").",
  "target": "He plays [sport] well",
  "checkPattern": "(he|she) (plays|sings|cooks) [a-z]+ well",
  "hint": "Estructura esperada: “He/She plays ___ well.”",
  "example": {
   "en": "She plays soccer well.",
   "es": "Ella juega bien al fútbol."
  },
  "checklist": [
   "¿Usaste “He” o “She”?",
   "¿Terminaste la frase con “well”?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-principiante4-3",
  "prompt": "Escribe una frase sobre el clima (usa \"It is ___\" con hot, cold, rainy, etc.).",
  "target": "It is [weather word]",
  "checkPattern": "it is (hot|cold|rainy|sunny|cloudy|windy|snowy)",
  "hint": "Estructura esperada: “It is ___.”",
  "example": {
   "en": "It is cold today.",
   "es": "Hoy hace frío."
  },
  "checklist": [
   "¿Empezaste con “It is”?",
   "¿Usaste una palabra de clima?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-principiante4-4",
  "prompt": "Escribe una frase sobre comprar algo (usa \"I want to buy ___\").",
  "target": "I want to buy [thing]",
  "checkPattern": "i want to buy [a-z]+",
  "hint": "Estructura esperada: “I want to buy ___.”",
  "example": {
   "en": "I want to buy a book.",
   "es": "Quiero comprar un libro."
  },
  "checklist": [
   "¿Empezaste con “I want to buy”?",
   "¿Escribiste un objeto en inglés?",
   "¿La frase tiene sentido?"
  ]
 }
],
    [
      { id:'w-principiante6-1', prompt:"Escribe qué color te gusta (usa “I like the color ___”).", target:"i like the color [color]",
        checkPattern:"i like the color (red|blue|green|yellow|black|white|brown|purple|orange|pink)", hint:"Estructura esperada: “I like the color ___.”",
        example:{en:"I like the color blue.", es:"Me gusta el color azul."},
        checklist:["¿Empezaste con “I like the color”?","¿El color está en inglés?","¿La frase tiene sentido?"] },
      { id:'w-principiante6-2', prompt:"Escribe qué día es hoy (usa “Today is ___”).", target:"today is [day]",
        checkPattern:"today is (monday|tuesday|wednesday|thursday|friday|saturday|sunday)", hint:"Estructura esperada: “Today is ___.”",
        example:{en:"Today is Friday.", es:"Hoy es viernes."},
        checklist:["¿Empezaste con “Today is”?","¿Escribiste un día de la semana en inglés?","¿Está bien escrito el día?"] },
      { id:'w-principiante6-3', prompt:"Di dónde vives (usa “I live in ___”).", target:"i live in [place]",
        checkPattern:"i live in [a-z]+", hint:"Estructura esperada: “I live in ___.”",
        example:{en:"I live in Bogota.", es:"Vivo en Bogotá."},
        checklist:["¿Empezaste con “I live in”?","¿Escribiste el nombre de un lugar?","¿La frase tiene sentido?"] },
      { id:'w-principiante6-4', prompt:"Describe el clima de hoy (usa “It is ___ today”).", target:"it is [adj] today",
        checkPattern:"it is (sunny|rainy|cold|hot|windy|cloudy) today", hint:"Estructura esperada: “It is ___ today.”",
        example:{en:"It is windy today.", es:"Hoy está ventoso."},
        checklist:["¿Empezaste con “It is”?","¿Usaste una palabra de clima en inglés?","¿Terminaste con “today”?"] },
      { id:'w-principiante6-5', prompt:"Escribe qué hora es aproximadamente (usa “It is ___ o'clock”).", target:"it is [number] o'clock",
        checkPattern:"it is (one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve) o'clock", hint:"Estructura esperada: “It is ___ o'clock.”",
        example:{en:"It is seven o'clock.", es:"Son las siete."},
        checklist:["¿Empezaste con “It is”?","¿Usaste un número en inglés?","¿Terminaste con “o'clock”?"] },
      { id:'w-principiante6-6', prompt:"Di qué comida te gusta (usa “I like ___”).", target:"i like [food]",
        checkPattern:"i like [a-z]+", hint:"Estructura esperada: “I like ___.”",
        example:{en:"I like pizza.", es:"Me gusta la pizza."},
        checklist:["¿Empezaste con “I like”?","¿Escribiste una comida en inglés?","¿La frase tiene sentido?"] },
      { id:'w-principiante6-7', prompt:"Escribe tu edad (usa “I am ___ years old”).", target:"i am [number] years old",
        checkPattern:"i am [a-z0-9]+ years old", hint:"Estructura esperada: “I am ___ years old.”",
        example:{en:"I am twenty years old.", es:"Tengo veinte años."},
        checklist:["¿Empezaste con “I am”?","¿Escribiste un número en inglés?","¿Terminaste con “years old”?"] },
      { id:'w-principiante6-8', prompt:"Describe cómo te sientes hoy (usa “I feel ___”).", target:"i feel [adj]",
        checkPattern:"i feel (happy|sad|tired|excited|hungry|thirsty|sleepy|nervous)", hint:"Estructura esperada: “I feel ___.”",
        example:{en:"I feel excited.", es:"Me siento emocionado."},
        checklist:["¿Empezaste con “I feel”?","¿Usaste una palabra de sentimiento en inglés?","¿La frase tiene sentido?"] }
    ]
  ],
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
    ],
    [
      { id:'w-facil4-1', prompt:"Escribe una frase usando “have to” sobre algo que debes hacer.", target:"have to",
        checkPattern:"\\b(have to|has to)\\b [a-z]+", hint:"Estructura esperada: “I have to + verbo base.”",
        example:{en:"I have to finish my homework tonight.", es:"Tengo que terminar mi tarea esta noche."},
        checklist:["¿Usaste “have to” o “has to”?","¿Le sigue un verbo base?","¿La frase describe una obligación?"] },
      { id:'w-facil4-2', prompt:"Escribe una pregunta con “Where is” o “Where are”.", target:"where is / where are",
        checkPattern:"^where (is|are) ", hint:"Estructura esperada: “Where is/are ___?”",
        example:{en:"Where is the nearest bank?", es:"¿Dónde está el banco más cercano?"},
        checklist:["¿Empezaste con “Where is” o “Where are”?","¿Es una pregunta completa?","¿Usaste el verbo correcto según singular/plural?"] },
      { id:'w-facil4-3', prompt:"Escribe una frase sobre tu comida o actividad favorita usando “favorite”.", target:"favorite",
        checkPattern:"\\bfavorite\\b", hint:"Estructura esperada: “My favorite ___ is ___.”",
        example:{en:"My favorite food is pizza.", es:"Mi comida favorita es la pizza."},
        checklist:["¿Usaste la palabra “favorite”?","¿Mencionaste algo específico (comida, color, etc.)?","¿La frase tiene sentido?"] },
      { id:'w-facil4-4', prompt:"Escribe una pregunta con “How many” sobre una cantidad.", target:"how many",
        checkPattern:"^how many [a-z]+", hint:"Estructura esperada: “How many ___ do you have?”",
        example:{en:"How many books do you have?", es:"¿Cuántos libros tienes?"},
        checklist:["¿Empezaste con “How many”?","¿Usaste un sustantivo contable en plural?","¿Es una pregunta completa?"] }
    ],
    [
      { id:'w-facil5-1', prompt:"Escribe una frase con “can't” sobre algo que no sabes hacer.", target:"can't",
        checkPattern:"i can.?t [a-z]+", hint:"Estructura esperada: “I can't ___.”",
        example:{en:"I can't swim very well.", es:"No sé nadar muy bien."},
        checklist:["¿Usaste “can't”?","¿Después va el verbo base?","¿La frase tiene sentido?"] },
      { id:'w-facil5-2', prompt:"Escribe una frase sobre lo que estás haciendo ahora mismo (presente continuo).", target:"presente continuo",
        checkPattern:"(i am|i'm|he is|she is|they are|we are|he's|she's).*ing", hint:"Estructura esperada: “I am ___ing right now.”",
        example:{en:"I am writing an email right now.", es:"Estoy escribiendo un correo ahora mismo."},
        checklist:["¿Usaste “am/is/are” + verbo-ing?","¿La frase describe algo que pasa ahora?","¿Tiene sentido completo?"] },
      { id:'w-facil5-3', prompt:"Escribe una frase usando un posesivo (my/your/his/her/our/their).", target:"posesivos",
        checkPattern:"\\b(my|your|his|her|our|their)\\b [a-z]+", hint:"Usa un posesivo antes de un sustantivo.",
        example:{en:"Her car is blue.", es:"Su carro es azul."},
        checklist:["¿Usaste un posesivo (my/your/his/her/our/their)?","¿Va antes de un sustantivo?","¿La frase tiene sentido?"] },
      { id:'w-facil5-4', prompt:"Escribe una pregunta con “What time”.", target:"what time",
        checkPattern:"what time (is|do|does|are)", hint:"Estructura esperada: “What time is/do...?”",
        example:{en:"What time does the store open?", es:"¿A qué hora abre la tienda?"},
        checklist:["¿Empezaste con “What time”?","¿Es una pregunta completa?","¿Tiene el signo de interrogación?"] }
    ],
    [
      { id:'w-facil6-1', prompt:"Escribe una frase usando un comparativo con “-er” (ej. bigger, faster).", target:"comparativo -er",
        checkPattern:"[a-z]+er than", hint:"Estructura esperada: “___er than ___.”",
        example:{en:"This bag is bigger than that one.", es:"Esta bolsa es más grande que esa."},
        checklist:["¿Usaste un adjetivo con “-er”?","¿Usaste “than”?","¿La comparación tiene sentido?"] },
      { id:'w-facil6-2', prompt:"Escribe una frase con “There was” o “There were” sobre el pasado.", target:"there was/were",
        checkPattern:"there (was|were) [a-z]+", hint:"Estructura esperada: “There was/were ___.”",
        example:{en:"There were many people at the party.", es:"Había mucha gente en la fiesta."},
        checklist:["¿Usaste “there was” o “there were”?","¿Es correcto según singular o plural?","¿La frase tiene sentido?"] },
      { id:'w-facil6-3', prompt:"Escribe una frase usando “some” o “any”.", target:"some / any",
        checkPattern:"\\b(some|any)\\b [a-z]+", hint:"Estructura esperada: “some” en afirmaciones, “any” en negativas o preguntas.",
        example:{en:"I don't have any money.", es:"No tengo nada de dinero."},
        checklist:["¿Usaste “some” o “any”?","¿Lo usaste en el contexto correcto (afirmativo/negativo)?","¿La frase tiene sentido?"] },
      { id:'w-facil6-4', prompt:"Escribe una frase con “going to” sobre un plan para el fin de semana.", target:"going to",
        checkPattern:"(am|is|are|'m|'s|'re) going to [a-z]+", hint:"Estructura esperada: “I am going to ___ this weekend.”",
        example:{en:"I am going to visit my parents this weekend.", es:"Voy a visitar a mis padres este fin de semana."},
        checklist:["¿Usaste “going to” + verbo?","¿Menciona un plan futuro?","¿Tiene sentido completo?"] }
    ]
  ,

    [
      { id:'w-facil7-1', prompt:"Escribe qué hiciste ayer (usa un verbo regular en pasado, ej. \"worked\", \"cleaned\").", target:"I [verb]ed yesterday",
        checkPattern:"i [a-z]+ed .*yesterday|yesterday.*i [a-z]+ed", hint:"Estructura esperada: “I ___ed yesterday.”",
        example:{en:"I worked yesterday.", es:"Trabajé ayer."},
        checklist:["¿Usaste un verbo terminado en “-ed”?","¿Mencionaste “yesterday”?","¿La frase tiene sentido?"] },
      { id:'w-facil7-2', prompt:"Escribe una pregunta con \"Do you...\" sobre un hábito.", target:"Do you...?",
        checkPattern:"do you [a-z]+", hint:"Estructura esperada: “Do you ___?”",
        example:{en:"Do you drink coffee every day?", es:"¿Tomas café todos los días?"},
        checklist:["¿Empezaste con “Do you”?","¿Terminaste con signo de pregunta?","¿La pregunta tiene sentido?"] },
      { id:'w-facil7-3', prompt:"Escribe una frase sobre tus planes para el próximo fin de semana (usa \"going to\" o \"will\").", target:"I am going to...",
        checkPattern:"(i am going to|i'm going to|i will) [a-z]+", hint:"Estructura esperada: “I am going to ___” o “I will ___.”",
        example:{en:"I am going to visit my parents.", es:"Voy a visitar a mis padres."},
        checklist:["¿Usaste “going to” o “will”?","¿Mencionaste una actividad?","¿La frase tiene sentido?"] },
      { id:'w-facil7-4', prompt:"Escribe una frase comparando dos cosas (usa \"bigger\", \"smaller\" o \"faster than\").", target:"[thing] is [comparative] than [thing]",
        checkPattern:"[a-z]+ is (bigger|smaller|faster|slower|taller|shorter) than [a-z]+", hint:"Estructura esperada: “___ is ___er than ___.”",
        example:{en:"My car is faster than his car.", es:"Mi carro es más rápido que el suyo."},
        checklist:["¿Usaste una palabra comparativa terminada en “-er”?","¿Usaste “than”?","¿La frase tiene sentido?"] }
    ]
  ,
  [
 {
  "id": "w-facil8-1",
  "prompt": "Escribe una frase usando \"then\" para mostrar un orden de acciones.",
  "target": "First [action], then [action]",
  "checkPattern": "first [a-z ]+, ?then [a-z ]+",
  "hint": "Estructura esperada: “First ___, then ___.”",
  "example": {
   "en": "First I eat, then I study.",
   "es": "Primero como, luego estudio."
  },
  "checklist": [
   "¿Usaste “First” y “then”?",
   "¿Escribiste dos acciones?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-facil8-2",
  "prompt": "Escribe una comparación usando \"than\" (usa \"___ is more ___ than ___\").",
  "target": "[thing] is more [adjective] than [thing]",
  "checkPattern": "[a-z ]+ is (more )?[a-z]+ than [a-z ]+",
  "hint": "Estructura esperada: “___ is ___ than ___.”",
  "example": {
   "en": "Coffee is stronger than tea.",
   "es": "El café es más fuerte que el té."
  },
  "checklist": [
   "¿Usaste la palabra “than”?",
   "¿Comparaste dos cosas?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-facil8-3",
  "prompt": "Escribe una frase pidiendo prestado algo a un amigo (usa \"lend\" o \"borrow\").",
  "target": "sentence with lend or borrow",
  "checkPattern": "(lend|borrow|lent|borrowed)",
  "hint": "Usa la palabra “lend” (prestar) o “borrow” (pedir prestado).",
  "example": {
   "en": "Can you lend me your umbrella?",
   "es": "¿Me prestas tu paraguas?"
  },
  "checklist": [
   "¿Usaste “lend” o “borrow”?",
   "¿La frase está en inglés?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-facil8-4",
  "prompt": "Escribe una frase con \"except\" diciendo que todos hicieron algo menos una persona.",
  "target": "Everyone [verb] except [name]",
  "checkPattern": "everyone [a-z]+ except [a-z]+",
  "hint": "Estructura esperada: “Everyone ___ except ___.”",
  "example": {
   "en": "Everyone came except Maria.",
   "es": "Todos vinieron excepto María."
  },
  "checklist": [
   "¿Empezaste con “Everyone”?",
   "¿Usaste la palabra “except”?",
   "¿La frase tiene sentido?"
  ]
 }
],
    [
      { id:'w-facil10-1', prompt:"Escribe sobre tu rutina matutina (usa “Every morning I ___”).", target:"every morning i [verb]",
        checkPattern:"every morning i [a-z]+", hint:"Estructura esperada: “Every morning I ___.”",
        example:{en:"Every morning I drink coffee.", es:"Cada mañana tomo café."},
        checklist:["¿Empezaste con “Every morning I”?","¿Usaste un verbo en inglés?","¿La frase tiene sentido?"] },
      { id:'w-facil10-2', prompt:"Escribe un plan para el fin de semana (usa “This weekend I am going to ___”).", target:"this weekend i am going to [verb]",
        checkPattern:"this weekend i am going to [a-z]+", hint:"Estructura esperada: “This weekend I am going to ___.”",
        example:{en:"This weekend I am going to rest.", es:"Este fin de semana voy a descansar."},
        checklist:["¿Empezaste con “This weekend I am going to”?","¿Usaste un verbo en inglés?","¿La frase tiene sentido?"] },
      { id:'w-facil10-3', prompt:"Compara dos cosas usando “more...than” (usa “___ is more ___ than ___”).", target:"[x] is more [adj] than [y]",
        checkPattern:"[a-z]+ is more [a-z]+ than [a-z]+", hint:"Estructura esperada: “___ is more ___ than ___.”",
        example:{en:"This book is more interesting than that movie.", es:"Este libro es más interesante que esa película."},
        checklist:["¿Usaste “is more ___ than”?","¿Comparaste dos cosas diferentes?","¿La frase tiene sentido?"] },
      { id:'w-facil10-4', prompt:"Escribe sobre algo que hiciste ayer (usa “Yesterday I ___”).", target:"yesterday i [verb in past]",
        checkPattern:"yesterday i [a-z]+", hint:"Estructura esperada: “Yesterday I ___.” (usa el verbo en pasado)",
        example:{en:"Yesterday I visited my grandmother.", es:"Ayer visité a mi abuela."},
        checklist:["¿Empezaste con “Yesterday I”?","¿Usaste el verbo en pasado?","¿La frase tiene sentido?"] },
      { id:'w-facil10-5', prompt:"Da una recomendación usando “should” (usa “You should ___”).", target:"you should [verb]",
        checkPattern:"you should [a-z]+", hint:"Estructura esperada: “You should ___.”",
        example:{en:"You should get more sleep.", es:"Deberías dormir más."},
        checklist:["¿Empezaste con “You should”?","¿Usaste un verbo en inglés?","¿La frase da un consejo?"] },
      { id:'w-facil10-6', prompt:"Escribe sobre tus planes futuros (usa “In the future, I want to ___”).", target:"in the future i want to [verb]",
        checkPattern:"in the future,? i want to [a-z]+", hint:"Estructura esperada: “In the future, I want to ___.”",
        example:{en:"In the future, I want to travel more.", es:"En el futuro, quiero viajar más."},
        checklist:["¿Empezaste con “In the future”?","¿Usaste “I want to” más un verbo?","¿La frase tiene sentido?"] },
      { id:'w-facil10-7', prompt:"Describe tu trabajo o estudio (usa “I work as a ___” o “I study ___”).", target:"i work as a [job] / i study [subject]",
        checkPattern:"i (work as a|study) [a-z]+", hint:"Estructura esperada: “I work as a ___.” o “I study ___.”",
        example:{en:"I work as a teacher.", es:"Trabajo como profesor."},
        checklist:["¿Usaste “I work as a” o “I study”?","¿Escribiste el trabajo o materia en inglés?","¿La frase tiene sentido?"] },
      { id:'w-facil10-8', prompt:"Pide algo cortésmente en un restaurante (usa “Could I have ___, please?”).", target:"could i have [food], please?",
        checkPattern:"could i have [a-z ]+,? please", hint:"Estructura esperada: “Could I have ___, please?”",
        example:{en:"Could I have the menu, please?", es:"¿Podría darme el menú, por favor?"},
        checklist:["¿Empezaste con “Could I have”?","¿Terminaste con “please”?","¿La frase suena cortés?"] }
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
    ],
    [
      { id:'w-medio4-1', prompt:"Escribe una predicción sobre el futuro usando “will”.", target:"will (predicción)",
        checkPattern:"\\bwill\\b [a-z]+", hint:"Estructura esperada: “I think ___ will ___.”",
        example:{en:"I think it will rain tomorrow.", es:"Creo que va a llover mañana."},
        checklist:["¿Usaste “will” + verbo base?","¿Es una predicción, no un plan fijo?","¿La frase tiene sentido?"] },
      { id:'w-medio4-2', prompt:"Escribe una frase dando un consejo con “should”.", target:"should (consejo)",
        checkPattern:"\\bshould\\b [a-z]+", hint:"Estructura esperada: “You should + verbo base.”",
        example:{en:"You should talk to your manager about it.", es:"Deberías hablar con tu jefe sobre eso."},
        checklist:["¿Usaste “should” + verbo base?","¿Es un consejo, no una orden?","¿La frase tiene sentido?"] },
      { id:'w-medio4-3', prompt:"Escribe una frase comparando dos cosas iguales con “as... as”.", target:"as...as",
        checkPattern:"\\bas \\w+ as\\b", hint:"Estructura esperada: “___ is as ___ as ___.”",
        example:{en:"This test is as difficult as the last one.", es:"Este examen es tan difícil como el anterior."},
        checklist:["¿Usaste “as ___ as”?","¿Compara dos cosas que son iguales en algo?","¿La frase tiene sentido?"] },
      { id:'w-medio4-4', prompt:"Escribe una frase con un gerundio después de una preposición (ej. “before leaving”).", target:"gerundio tras preposición",
        checkPattern:"\\b(before|after|without|by|for)\\b [a-z]+ing", hint:"Estructura esperada: “before/after/without + verbo-ing.”",
        example:{en:"She checked her email before leaving the office.", es:"Ella revisó su correo antes de salir de la oficina."},
        checklist:["¿Usaste una preposición (before/after/without/by/for)?","¿El verbo después termina en “-ing”?","¿La frase tiene sentido?"] }
    ],
    [
      { id:'w-medio5-1', prompt:"Escribe una frase usando “will” o “going to” según corresponda.", target:"will vs going to",
        checkPattern:"\\b(will|going to)\\b", hint:"Usa “will” para decisiones espontáneas o “going to” para planes ya decididos.",
        example:{en:"I am going to start a new project next month.", es:"Voy a empezar un nuevo proyecto el próximo mes."},
        checklist:["¿Elegiste correctamente “will” o “going to”?","¿La frase habla del futuro?","¿Tiene sentido completo?"] },
      { id:'w-medio5-2', prompt:"Escribe una frase usando un gerundio después de un verbo (ej. “enjoy doing”).", target:"gerundio",
        checkPattern:"\\b(enjoy|like|love|hate|finish)(s|es)?\\b.*ing", hint:"Estructura esperada: verbo + gerundio (-ing).",
        example:{en:"She enjoys cooking on weekends.", es:"A ella le gusta cocinar los fines de semana."},
        checklist:["¿Usaste un verbo seguido de gerundio (-ing)?","¿La combinación es correcta (ej. “enjoy doing”)?","¿Tiene sentido?"] },
      { id:'w-medio5-3', prompt:"Escribe una frase con una cláusula relativa usando “who” o “whose”.", target:"cláusula relativa",
        checkPattern:"\\b(who|whose)\\b", hint:"Estructura esperada: sustantivo + who/whose + información adicional.",
        example:{en:"The man who called me is my neighbor.", es:"El hombre que me llamó es mi vecino."},
        checklist:["¿Usaste “who” o “whose” correctamente?","¿Da información adicional sobre una persona?","¿La frase tiene sentido?"] },
      { id:'w-medio5-4', prompt:"Escribe una frase usando un phrasal verb (ej. “look for”, “give up”, “find out”).", target:"phrasal verb",
        checkPattern:"\\b(look for|give up|find out|look into)\\b", hint:"Usa uno de estos phrasal verbs en tu frase.",
        example:{en:"I need to find out the schedule.", es:"Necesito averiguar el horario."},
        checklist:["¿Usaste un phrasal verb correctamente?","¿El significado tiene sentido en el contexto?","¿La frase está completa?"] }
    ],
    [
      { id:'w-medio6-1', prompt:"Escribe una frase dando un consejo con “should”.", target:"should",
        checkPattern:"\\b(should|shouldn't)\\b [a-z]+", hint:"Estructura esperada: “You should/shouldn't ___.”",
        example:{en:"You should talk to your boss about it.", es:"Deberías hablar con tu jefe sobre eso."},
        checklist:["¿Usaste “should” o “shouldn't”?","¿Es un consejo claro?","¿La frase tiene sentido?"] },
      { id:'w-medio6-2', prompt:"Escribe una frase usando “as... as” para comparar dos cosas iguales.", target:"as...as",
        checkPattern:"as [a-z]+ as", hint:"Estructura esperada: “as + adjetivo + as”.",
        example:{en:"This test is as difficult as the last one.", es:"Este examen es tan difícil como el anterior."},
        checklist:["¿Usaste “as ___ as”?","¿Compara dos cosas iguales?","¿La frase tiene sentido?"] },
      { id:'w-medio6-3', prompt:"Escribe una frase usando “still” o “yet” correctamente.", target:"still / yet",
        checkPattern:"\\b(still|yet)\\b", hint:"“Still” en afirmativas, “yet” en negativas y preguntas.",
        example:{en:"I haven't finished my homework yet.", es:"Todavía no he terminado mi tarea."},
        checklist:["¿Usaste “still” o “yet”?","¿Lo usaste en el contexto correcto?","¿La frase tiene sentido?"] },
      { id:'w-medio6-4', prompt:"Escribe una frase reportando lo que alguien dijo (“said that...”).", target:"reported speech",
        checkPattern:"said (that )?[a-z]+", hint:"Estructura esperada: “He/She said (that) ___.”",
        example:{en:"She said that she was busy.", es:"Ella dijo que estaba ocupada."},
        checklist:["¿Usaste “said that”?","¿Cambiaste el tiempo verbal correctamente?","¿La frase tiene sentido?"] }
    ]
  ,

    [
      { id:'w-medio7-1', prompt:"Escribe una frase usando \"might\" para algo que posiblemente harás.", target:"I might...",
        checkPattern:"i might [a-z]+", hint:"Estructura esperada: “I might ___.”",
        example:{en:"I might travel next month.", es:"Podría viajar el próximo mes."},
        checklist:["¿Usaste “might”?","¿Mencionaste una acción posible?","¿La frase tiene sentido?"] },
      { id:'w-medio7-2', prompt:"Escribe una frase usando \"a lot of\", \"many\" o \"much\" correctamente.", target:"There is/are a lot of...",
        checkPattern:"(a lot of|many|much) [a-z]+", hint:"Estructura esperada: usa “a lot of”, “many” o “much” antes de un sustantivo.",
        example:{en:"There is a lot of traffic today.", es:"Hay mucho tráfico hoy."},
        checklist:["¿Usaste “a lot of”, “many” o “much”?","¿El sustantivo que sigue tiene sentido con esa palabra?","¿La frase tiene sentido?"] },
      { id:'w-medio7-3', prompt:"Escribe una frase en voz pasiva sobre algo que se hizo en tu trabajo o casa.", target:"[thing] was [verb]ed by...",
        checkPattern:"(was|were) [a-z]+ed", hint:"Estructura esperada: “___ was ___ed (by ___).”",
        example:{en:"The report was finished by the team.", es:"El informe fue terminado por el equipo."},
        checklist:["¿Usaste “was” o “were”?","¿Usaste un verbo en participio?","¿La frase tiene sentido?"] },
      { id:'w-medio7-4', prompt:"Escribe una frase con un phrasal verb (\"look for\", \"give up\" o \"find out\").", target:"I [phrasal verb]...",
        checkPattern:"(look for|looking for|give up|giving up|find out|found out)", hint:"Estructura esperada: usa uno de estos phrasal verbs en una frase completa.",
        example:{en:"I need to find out the truth.", es:"Necesito averiguar la verdad."},
        checklist:["¿Usaste uno de los phrasal verbs?","¿La frase tiene sujeto y verbo completo?","¿La frase tiene sentido?"] }
    ]
  ,
  [
 {
  "id": "w-medio8-1",
  "prompt": "Escribe una frase sobre cómo algo afecta a otra cosa (usa el verbo \"affect\").",
  "target": "[thing] affects [thing]",
  "checkPattern": "[a-z ]+ affects? [a-z ]+",
  "hint": "Estructura esperada: “___ affects ___.”",
  "example": {
   "en": "Stress affects your sleep.",
   "es": "El estrés afecta tu sueño."
  },
  "checklist": [
   "¿Usaste el verbo “affect” o “affects”?",
   "¿La frase está completa?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-medio8-2",
  "prompt": "Escribe una frase sobre el efecto de algo (usa el sustantivo \"effect\").",
  "target": "The effect of [thing] was [adjective]",
  "checkPattern": "the effect of [a-z ]+ (was|is) [a-z]+",
  "hint": "Estructura esperada: “The effect of ___ was ___.”",
  "example": {
   "en": "The effect of the rain was positive.",
   "es": "El efecto de la lluvia fue positivo."
  },
  "checklist": [
   "¿Usaste la palabra “effect”?",
   "¿La frase describe un resultado?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-medio8-3",
  "prompt": "Escribe una frase preguntando si algo va a pasar (usa \"whether\").",
  "target": "I don't know whether [clause]",
  "checkPattern": "i (don't|do not) know whether [a-z ]+",
  "hint": "Estructura esperada: “I don't know whether ___.”",
  "example": {
   "en": "I don't know whether it will rain.",
   "es": "No sé si va a llover."
  },
  "checklist": [
   "¿Empezaste con “I don't know whether”?",
   "¿Escribiste una idea completa?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-medio8-4",
  "prompt": "Escribe una frase con un cumplido para alguien (usa \"compliment\").",
  "target": "sentence with compliment",
  "checkPattern": "compliment",
  "hint": "Usa la palabra “compliment” (cumplido, elogio).",
  "example": {
   "en": "She gave me a nice compliment.",
   "es": "Ella me hizo un lindo cumplido."
  },
  "checklist": [
   "¿Usaste la palabra “compliment”?",
   "¿La frase está en inglés?",
   "¿La frase tiene sentido?"
  ]
 }
],
    [
      { id:'w-medio10-1', prompt:"Da tu opinión sobre un tema usando “In my opinion, ___”.", target:"in my opinion, [sentence]",
        checkPattern:"in my opinion,? [a-z]+", hint:"Estructura esperada: “In my opinion, ___.”",
        example:{en:"In my opinion, remote work is more productive.", es:"En mi opinión, el trabajo remoto es más productivo."},
        checklist:["¿Empezaste con “In my opinion”?","¿Diste una opinión clara?","¿La frase tiene sentido?"] },
      { id:'w-medio10-2', prompt:"Escribe una condición usando “If...then” (usa “If I had more time, I would ___”).", target:"if i had more time, i would [verb]",
        checkPattern:"if i had more time,? i would [a-z]+", hint:"Estructura esperada: “If I had more time, I would ___.”",
        example:{en:"If I had more time, I would learn to paint.", es:"Si tuviera más tiempo, aprendería a pintar."},
        checklist:["¿Usaste “If I had more time, I would”?","¿Completaste con un verbo?","¿La frase tiene sentido?"] },
      { id:'w-medio10-3', prompt:"Describe un logro usando el presente perfecto (usa “I have ___”).", target:"i have [past participle]",
        checkPattern:"i have [a-z]+", hint:"Estructura esperada: “I have ___.” (usa participio pasado)",
        example:{en:"I have finished my project.", es:"He terminado mi proyecto."},
        checklist:["¿Empezaste con “I have”?","¿Usaste el participio pasado del verbo?","¿La frase tiene sentido?"] },
      { id:'w-medio10-4', prompt:"Explica una razón usando “because” (usa “I decided to ___ because ___”).", target:"i decided to [verb] because [reason]",
        checkPattern:"i decided to [a-z ]+ because [a-z ]+", hint:"Estructura esperada: “I decided to ___ because ___.”",
        example:{en:"I decided to study English because I want a better job.", es:"Decidí estudiar inglés porque quiero un mejor trabajo."},
        checklist:["¿Usaste “I decided to ___ because ___”?","¿Diste una razón clara?","¿La frase tiene sentido?"] },
      { id:'w-medio10-5', prompt:"Escribe sobre un cambio usando “used to” (usa “I used to ___, but now I ___”).", target:"i used to [verb], but now i [verb]",
        checkPattern:"i used to [a-z ]+,? but now i [a-z ]+", hint:"Estructura esperada: “I used to ___, but now I ___.”",
        example:{en:"I used to live in Medellin, but now I live in Bogota.", es:"Antes vivía en Medellín, pero ahora vivo en Bogotá."},
        checklist:["¿Usaste “I used to” para el pasado?","¿Usaste “but now I” para el presente?","¿La frase tiene sentido?"] },
      { id:'w-medio10-6', prompt:"Da un consejo formal usando “should” en negativo (usa “You shouldn't ___”).", target:"you shouldn't [verb]",
        checkPattern:"you shouldn'?t [a-z]+", hint:"Estructura esperada: “You shouldn't ___.”",
        example:{en:"You shouldn't skip breakfast.", es:"No deberías saltarte el desayuno."},
        checklist:["¿Empezaste con “You shouldn't”?","¿Usaste un verbo en inglés?","¿La frase da un consejo?"] },
      { id:'w-medio10-7', prompt:"Escribe sobre una meta usando “by the end of” (usa “By the end of the year, I will ___”).", target:"by the end of the year, i will [verb]",
        checkPattern:"by the end of the year,? i will [a-z]+", hint:"Estructura esperada: “By the end of the year, I will ___.”",
        example:{en:"By the end of the year, I will speak English fluently.", es:"Para fin de año, hablaré inglés con fluidez."},
        checklist:["¿Usaste “By the end of the year, I will”?","¿Completaste con un verbo?","¿La frase tiene sentido?"] }
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
    ],
    [
      { id:'w-avz4-1', prompt:"Escribe una frase enfática tipo “What... is/was...” (cleft sentence).", target:"cleft sentence",
        checkPattern:"^what [a-z].*\\b(is|was)\\b", hint:"Estructura esperada: “What ___ is/was ___.”",
        example:{en:"What surprised me most was her honesty.", es:"Lo que más me sorprendió fue su honestidad."},
        checklist:["¿Empezaste con “What”?","¿Usaste “is/was” para enfatizar la parte final?","¿La frase suena natural en inglés?"] },
      { id:'w-avz4-2', prompt:"Escribe una frase usando lenguaje de matización (“hedging”) como “tend to” o “it seems that”.", target:"hedging language",
        checkPattern:"\\b(tend to|it seems that|it appears that|may|might)\\b", hint:"Estructura esperada: usar “tend to”, “it seems that”, “may” o “might” para suavizar una afirmación.",
        example:{en:"It seems that the results are inconclusive.", es:"Parece que los resultados no son concluyentes."},
        checklist:["¿Usaste una expresión de matización?","¿La afirmación suena menos categórica?","¿Es apropiado para un registro formal o académico?"] },
      { id:'w-avz4-3', prompt:"Escribe una frase en voz pasiva de registro académico (ej. “It is believed that…”).", target:"voz pasiva académica",
        checkPattern:"it (is|was) (believed|argued|suggested|considered|assumed) that", hint:"Estructura esperada: “It is/was believed/argued/suggested that ___.”",
        example:{en:"It is believed that the policy will reduce costs.", es:"Se cree que la política reducirá los costos."},
        checklist:["¿Usaste la estructura “It is/was + participio + that”?","¿Evitaste decir quién lo cree o afirma?","¿Suena a un registro académico o formal?"] },
      { id:'w-avz4-4', prompt:"Escribe una frase usando “not only… but also”.", target:"not only...but also",
        checkPattern:"not only.*but also", hint:"Estructura esperada: “Not only ___, but also ___.”",
        example:{en:"Not only did she finish the project, but she also improved it.", es:"No solo terminó el proyecto, sino que también lo mejoró."},
        checklist:["¿Usaste “not only” y “but also”?","¿Si empiezas la frase con “Not only”, invertiste el orden verbo–sujeto?","¿La frase tiene sentido?"] }
    ],
    [
      { id:'w-avz5-1', prompt:"Escribe una frase usando el subjuntivo formal (“it is essential that...”).", target:"subjuntivo formal",
        checkPattern:"it is (essential|vital|important) that", hint:"Estructura esperada: “It is essential/vital that + sujeto + verbo base.”",
        example:{en:"It is essential that everyone be informed.", es:"Es esencial que todos estén informados."},
        checklist:["¿Usaste “it is essential/vital/important that”?","¿El verbo va en forma base (sin -s)?","¿Suena formal?"] },
      { id:'w-avz5-2', prompt:"Escribe una frase usando una colocación con “make” (ej. make a decision, make progress).", target:"colocación con make",
        checkPattern:"make (a |an )?(decision|mistake|progress|effort)", hint:"Usa “make” con una de estas palabras: decision, mistake, progress, effort.",
        example:{en:"We need to make a decision soon.", es:"Necesitamos tomar una decisión pronto."},
        checklist:["¿Usaste “make” con la palabra correcta?","¿Evitaste usar “do” en su lugar?","¿La frase tiene sentido?"] },
      { id:'w-avz5-3', prompt:"Escribe una frase con discurso indirecto usando “had” (pasado perfecto reportado).", target:"reported speech avanzado",
        checkPattern:"(said|told).*had ([a-z]+ )?[a-z]+ed", hint:"Estructura esperada: “He/She said/told me (that) + sujeto + had + participio.”",
        example:{en:"She told me she had already finished the project.", es:"Ella me dijo que ya había terminado el proyecto."},
        checklist:["¿Usaste “had” + participio dentro del reporte?","¿Reportaste correctamente lo que se dijo?","¿La frase tiene sentido?"] },
      { id:'w-avz5-4', prompt:"Escribe una frase usando lenguaje de probabilidad con “likely”.", target:"likely",
        checkPattern:"(is|are) likely to", hint:"Estructura esperada: “+ subject + is/are likely to + verbo.”",
        example:{en:"The market is likely to recover soon.", es:"Es probable que el mercado se recupere pronto."},
        checklist:["¿Usaste “is/are likely to”?","¿Expresa probabilidad, no certeza?","¿La frase tiene sentido?"] }
    ],
    [
      { id:'w-avz6-1', prompt:"Escribe una frase usando un adverbio de matización como “arguably”.", target:"arguably",
        checkPattern:"arguably", hint:"Estructura esperada: “___ is arguably the best/most ___.”",
        example:{en:"This is arguably her best performance yet.", es:"Esta es posiblemente su mejor actuación hasta ahora."},
        checklist:["¿Usaste “arguably”?","¿Suaviza una afirmación fuerte?","¿La frase tiene sentido?"] },
      { id:'w-avz6-2', prompt:"Escribe una frase usando “tend to” para describir una tendencia general.", target:"tend to",
        checkPattern:"tend(s)? to [a-z]+", hint:"Estructura esperada: “+ subject + tend(s) to + verbo.”",
        example:{en:"Prices tend to rise during the holidays.", es:"Los precios tienden a subir durante las fiestas."},
        checklist:["¿Usaste “tend to” o “tends to”?","¿Concuerda con el sujeto (singular/plural)?","¿Describe una tendencia general?"] },
      { id:'w-avz6-3', prompt:"Escribe una frase en discurso indirecto usando “would” (reportando una promesa futura).", target:"reported speech con would",
        checkPattern:"(said|told).*would [a-z]+", hint:"Estructura esperada: “He/She said (that) + sujeto + would + verbo.”",
        example:{en:"He said that he would call me later.", es:"Él dijo que me llamaría más tarde."},
        checklist:["¿Usaste “would” dentro del reporte?","¿Cambiaste “will” a “would” correctamente?","¿La frase tiene sentido?"] },
      { id:'w-avz6-4', prompt:"Escribe una frase formal usando “it is believed that” o similar.", target:"voz pasiva académica",
        checkPattern:"it (is|was) (believed|argued|suggested|considered) that", hint:"Estructura esperada: “It is/was believed/argued/suggested that ___.”",
        example:{en:"It is argued that the policy needs revision.", es:"Se argumenta que la política necesita revisión."},
        checklist:["¿Usaste la estructura “it is/was + participio + that”?","¿Evitaste mencionar quién lo afirma?","¿Suena formal o académico?"] }
    ]
  ,

    [
      { id:'w-avanzado7-1', prompt:"Escribe una frase usando correctamente un adjetivo terminado en \"-ed\" o \"-ing\" (como \"bored/boring\").", target:"...",
        checkPattern:"(bored|boring|interested|interesting|tired|tiring|excited|exciting)", hint:"Estructura esperada: usa el adjetivo correcto según si describes a una persona (-ed) o la causa (-ing).",
        example:{en:"The lecture was boring, so I felt bored.", es:"La conferencia fue aburrida, así que me sentí aburrido."},
        checklist:["¿Usaste un adjetivo terminado en “-ed” o “-ing”?","¿Lo usaste en el contexto correcto?","¿La frase tiene sentido?"] },
      { id:'w-avanzado7-2', prompt:"Escribe una oración enfática usando \"It is... that\" (cleft sentence).", target:"It is/was ... that ...",
        checkPattern:"it (is|was) .* (that|who)", hint:"Estructura esperada: “It is/was ___ that/who ___.”",
        example:{en:"It was the manager who solved the problem.", es:"Fue el gerente quien resolvió el problema."},
        checklist:["¿Empezaste con “It is” o “It was”?","¿Usaste “that” o “who” después?","¿La frase tiene sentido?"] },
      { id:'w-avanzado7-3', prompt:"Escribe una frase usando un conector avanzado (\"however\", \"therefore\" o \"nevertheless\").", target:"...",
        checkPattern:"(however|therefore|nevertheless)", hint:"Estructura esperada: usa uno de estos conectores para unir dos ideas.",
        example:{en:"The plan was risky; however, it worked.", es:"El plan era riesgoso; sin embargo, funcionó."},
        checklist:["¿Usaste “however”, “therefore” o “nevertheless”?","¿Conecta dos ideas relacionadas?","¿La frase tiene sentido?"] },
      { id:'w-avanzado7-4', prompt:"Escribe una frase usando lenguaje formal o de matiz (\"arguably\" o \"tend to\").", target:"...",
        checkPattern:"(arguably|tend to|tends to)", hint:"Estructura esperada: usa “arguably” o “tend to/tends to” para suavizar una afirmación.",
        example:{en:"This is arguably the best solution.", es:"Esta es, podría decirse, la mejor solución."},
        checklist:["¿Usaste “arguably” o “tend to/tends to”?","¿La frase suena natural y formal?","¿La frase tiene sentido?"] }
    ]
  ,
  [
 {
  "id": "w-avanzado8-1",
  "prompt": "Escribe una frase usando \"principle\" para hablar de una creencia importante.",
  "target": "sentence with principle",
  "checkPattern": "principle",
  "hint": "Usa la palabra “principle” (principio, creencia fundamental).",
  "example": {
   "en": "Honesty is an important principle for me.",
   "es": "La honestidad es un principio importante para mí."
  },
  "checklist": [
   "¿Usaste la palabra “principle”?",
   "¿La frase expresa una idea o creencia?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-avanzado8-2",
  "prompt": "Escribe una frase usando \"further\" para pedir más información.",
  "target": "sentence with further",
  "checkPattern": "further",
  "hint": "Usa la palabra “further” (adicional, más allá).",
  "example": {
   "en": "We need further information before deciding.",
   "es": "Necesitamos más información antes de decidir."
  },
  "checklist": [
   "¿Usaste la palabra “further”?",
   "¿La frase pide o menciona algo adicional?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-avanzado8-3",
  "prompt": "Escribe una frase usando \"stationary\" o \"stationery\" correctamente.",
  "target": "sentence with stationary or stationery",
  "checkPattern": "(stationary|stationery)",
  "hint": "“Stationary” = fijo, sin movimiento. “Stationery” = papelería.",
  "example": {
   "en": "I bought new stationery for school.",
   "es": "Compré papelería nueva para la escuela."
  },
  "checklist": [
   "¿Usaste “stationary” o “stationery”?",
   "¿La usaste con el significado correcto?",
   "¿La frase tiene sentido?"
  ]
 },
 {
  "id": "w-avanzado8-4",
  "prompt": "Escribe una frase usando \"illicit\" para describir algo ilegal.",
  "target": "sentence with illicit",
  "checkPattern": "illicit",
  "hint": "Usa la palabra “illicit” (ilícito, ilegal).",
  "example": {
   "en": "The illicit trade was stopped by police.",
   "es": "El comercio ilícito fue detenido por la policía."
  },
  "checklist": [
   "¿Usaste la palabra “illicit”?",
   "¿La frase describe algo ilegal?",
   "¿La frase tiene sentido?"
  ]
 }
],
    [
      { id:'w-avanzado10-1', prompt:"Escribe una oración con una cláusula condicional mixta (usa “If I had studied medicine, I would ___ now”).", target:"if i had studied medicine, i would [verb] now",
        checkPattern:"if i had studied medicine,? i would [a-z ]+ now", hint:"Estructura esperada: “If I had studied medicine, I would ___ now.”",
        example:{en:"If I had studied medicine, I would work at a hospital now.", es:"Si hubiera estudiado medicina, trabajaría en un hospital ahora."},
        checklist:["¿Usaste la estructura del condicional mixto?","¿Completaste con un verbo lógico?","¿La frase tiene sentido?"] },
      { id:'w-avanzado10-2', prompt:"Expresa un contraste usando “although” (usa “Although ___, I ___”).", target:"although [clause], i [clause]",
        checkPattern:"although [a-z ,]+ i [a-z]+", hint:"Estructura esperada: “Although ___, I ___.”",
        example:{en:"Although it was raining, I went for a run.", es:"Aunque estaba lloviendo, salí a correr."},
        checklist:["¿Empezaste con “Although”?","¿Hay un contraste claro?","¿La frase tiene sentido?"] },
      { id:'w-avanzado10-3', prompt:"Usa voz pasiva para describir algo (usa “The ___ was ___ by ___”).", target:"the [thing] was [past participle] by [agent]",
        checkPattern:"the [a-z]+ was [a-z]+ by [a-z]+", hint:"Estructura esperada: “The ___ was ___ by ___.” (voz pasiva)",
        example:{en:"The bridge was designed by a famous engineer.", es:"El puente fue diseñado por un ingeniero famoso."},
        checklist:["¿Usaste la estructura de voz pasiva “was + participio + by”?","¿Tiene sentido la oración?","¿Está en pasado?"] },
      { id:'w-avanzado10-4', prompt:"Da una opinión matizada usando “not necessarily” (usa “That is not necessarily true because ___”).", target:"that is not necessarily true because [reason]",
        checkPattern:"that is not necessarily true because [a-z]+", hint:"Estructura esperada: “That is not necessarily true because ___.”",
        example:{en:"That is not necessarily true because everyone learns differently.", es:"Eso no es necesariamente cierto porque cada quien aprende diferente."},
        checklist:["¿Usaste “That is not necessarily true because”?","¿Diste una razón coherente?","¿La frase suena natural?"] },
      { id:'w-avanzado10-5', prompt:"Escribe una oración usando “despite” + sustantivo (usa “Despite ___, ___”).", target:"despite [noun], [clause]",
        checkPattern:"despite [a-z ]+, [a-z]+", hint:"Estructura esperada: “Despite ___, ___.”",
        example:{en:"Despite the challenges, the team succeeded.", es:"A pesar de los desafíos, el equipo tuvo éxito."},
        checklist:["¿Empezaste con “Despite”?","¿Usaste un sustantivo después de “despite”?","¿La segunda parte tiene sentido?"] },
      { id:'w-avanzado10-6', prompt:"Haz una suposición usando “must have” (usa “She must have ___”).", target:"she must have [past participle]",
        checkPattern:"(she|he) must have [a-z]+", hint:"Estructura esperada: “She must have ___.” (suposición sobre el pasado)",
        example:{en:"She must have forgotten the meeting.", es:"Ella debe haber olvidado la reunión."},
        checklist:["¿Usaste “must have” más participio?","¿Es una suposición lógica sobre el pasado?","¿La frase tiene sentido?"] },
      { id:'w-avanzado10-7', prompt:"Escribe una recomendación formal usando “It would be advisable to” (usa “It would be advisable to ___”).", target:"it would be advisable to [verb]",
        checkPattern:"it would be advisable to [a-z]+", hint:"Estructura esperada: “It would be advisable to ___.”",
        example:{en:"It would be advisable to review the contract first.", es:"Sería recomendable revisar el contrato primero."},
        checklist:["¿Usaste “It would be advisable to”?","¿Completaste con un verbo?","¿Suena formal?"] }
    ]
  ]
};

// ============================================================
// CLASES INTERACTIVAS — mini-clases situacionales (8 pasos)
// ============================================================
const CLASS_CATALOG = [
  { id:'airport', title:'En el aeropuerto', category:'Viajes', desc:'Aprende a moverte en el aeropuerto: check-in, seguridad y abordaje.', minutes:6, available:true },
  { id:'hotel', title:'En el hotel', category:'Viajes', desc:'Aprende a hacer el check-in, pedir servicios y resolver problemas en un hotel.', minutes:6, available:true },
  { id:'restaurant', title:'En un restaurante', category:'Viajes', desc:'Aprende a pedir el menú, ordenar tu comida y pagar la cuenta.', minutes:6, available:true },
  { id:'coffee', title:'Pedir un café', category:'Vida diaria', desc:'Aprende a pedir tu café como te gusta y platicar un poco con el barista.', minutes:5, available:true },
  { id:'shopping', title:'Ir de compras', category:'Vida diaria', desc:'Aprende a buscar tu talla, probarte ropa y preguntar el precio en una tienda.', minutes:5, available:true },
  { id:'meeting-someone', title:'Conocer a alguien', category:'Vida diaria', desc:'Aprende a presentarte, hacer plática y conocer gente nueva en inglés.', minutes:5, available:true },
  { id:'pharmacy', title:'En la farmacia', category:'Vida diaria', desc:'Aprende a explicar cómo te sientes, pedir un medicamento y entender cómo tomarlo.', minutes:6, available:true },
  { id:'gym', title:'En el gimnasio', category:'Vida diaria', desc:'Aprende a registrarte, preguntar por una clase y hablar de tu rutina en el gimnasio.', minutes:6, available:true },
  { id:'numbers-symbols', title:'Números, teléfonos y símbolos', category:'Vida diaria', desc:'Aprende a decir un número de teléfono, el + de WhatsApp y caracteres como @, punto, guion, _ y /.', minutes:6, available:true },
  { id:'job-interview', title:'Entrevista de trabajo', category:'Trabajo', desc:'Aprende a hablar de tu experiencia y tus fortalezas en una entrevista de trabajo.', minutes:7, available:true },
  { id:'phone-calls', title:'Llamadas', category:'Trabajo', desc:'Aprende a hacer una llamada, agendar una cita y manejar malentendidos por teléfono.', minutes:6, available:true },
  { id:'meetings', title:'Reuniones', category:'Trabajo', desc:'Aprende a dar una actualización, hacer preguntas y participar en una reunión de trabajo.', minutes:6, available:true }
];

const CLASSES_BANK = {
  airport: {
    id:'airport',
    title:'En el aeropuerto',
    situation:{
      en:"You're at the airport, checking in for your flight to New York. You need to check your bag and ask about your gate.",
      es:'Estás en el aeropuerto, haciendo el check-in para tu vuelo a Nueva York. Necesitas facturar tu maleta y preguntar por tu puerta de embarque.'
    },
    phrases:[
      { en:'Could I have your passport, please?', es:'¿Me da su pasaporte, por favor?' },
      { en:"I'd like to check this bag.", es:'Quisiera facturar esta maleta.' },
      { en:'What time does boarding start?', es:'¿A qué hora empieza el abordaje?' },
      { en:'Which gate is my flight?', es:'¿Cuál es la puerta de mi vuelo?' },
      { en:'Is this flight on time?', es:'¿Este vuelo va a tiempo?' }
    ],
    listening:{
      audio:'audio/clases/aeropuerto-listening.mp3',
      dialogue:[
        { speaker:'Agente', en:'Good morning! Passport, please.' },
        { speaker:'Tú', en:"Here you go. I'd like to check this bag too." },
        { speaker:'Agente', en:'Sure. Your gate is B12, and boarding starts at 5:40.' }
      ],
      question:{
        text:'¿Cuál es la puerta de embarque?',
        options:['B12','B40','A12'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Agente', en:'Would you like a window or aisle seat?' },
      options:[
        { en:"Window seat, please.", correct:true, feedback:'¡Bien! Es una respuesta natural y directa.' },
        { en:"Yes, I have a passport.", correct:false, feedback:'Esa respuesta no tiene sentido aquí: te preguntaron por el asiento, no por el pasaporte.' },
        { en:"The flight is at 5:40.", correct:false, feedback:'Estás respondiendo con información de vuelo, pero te preguntaron por el tipo de asiento.' }
      ]
    },
    buildSentence:{
      es:'¿A qué hora empieza el abordaje?',
      words:['does','time','boarding','What','start?'],
      correctOrder:['What','time','does','boarding','start?']
    },
    speaking:{
      audio:'audio/clases/aeropuerto-speaking.mp3',
      prompt:"I'd like to check this bag, please.",
      es:'Practica diciendo: "Quisiera facturar esta maleta, por favor."'
    },
    miniChallenge:{
      start:'security',
      nodes:{
        security:{
          en:'A security officer says: "Please remove your laptop and place it in the tray."',
          es:'Un oficial de seguridad dice: "Por favor, saque su laptop y colóquela en la bandeja."',
          options:[
            { en:'Okay, one moment.', next:'gate', correct:true },
            { en:'No, I prefer not to.', next:'security-fail', correct:false }
          ]
        },
        'security-fail':{
          en:'The officer insists: "I need you to remove it, it\'s the rule."',
          es:'El oficial insiste: "Necesito que la saque, es la regla."',
          options:[
            { en:'Okay, sorry. Here it is.', next:'gate', correct:true }
          ]
        },
        gate:{
          en:'At the gate, staff announce: "Flight 220 is now boarding at gate B12."',
          es:'En la puerta, el personal anuncia: "El vuelo 220 ahora está abordando en la puerta B12."',
          options:[
            { en:'That\'s my flight, thank you!', next:'end', correct:true },
            { en:'I think I\'ll wait for the next one.', next:'gate-miss', correct:false }
          ]
        },
        'gate-miss':{
          en:'Staff clarifies: "This is the final boarding call for flight 220."',
          es:'El personal aclara: "Esta es la última llamada de abordaje para el vuelo 220."',
          options:[
            { en:'Oh, I\'m on that flight! I\'m coming!', next:'end', correct:true }
          ]
        },
        end:{ en:'You board the plane just in time. ¡Buen viaje!', es:'Abordas el avión justo a tiempo. ¡Buen viaje!', options:[] }
      }
    },
    summary:{
      keyPhrases:['Could I have your passport, please?', "I'd like to check this bag.", 'What time does boarding start?', 'Which gate is my flight?'],
      tip:'Hoy practicaste el vocabulario esencial para moverte en un aeropuerto en inglés: check-in, seguridad y embarque.'
    }
  },
  hotel: {
    id:'hotel',
    title:'En el hotel',
    situation:{
      en:"You're checking in at a hotel after a long trip. You need to give your name, get your room key, and ask about breakfast.",
      es:'Estás haciendo el check-in en un hotel después de un viaje largo. Necesitas dar tu nombre, recibir la llave de tu habitación y preguntar por el desayuno.'
    },
    phrases:[
      { en:'I have a reservation under the name Martinez.', es:'Tengo una reservación a nombre de Martínez.' },
      { en:'Could I get a room with a view?', es:'¿Podría tener una habitación con vista?' },
      { en:'What time is breakfast served?', es:'¿A qué hora se sirve el desayuno?' },
      { en:'Is there Wi-Fi in the room?', es:'¿Hay wifi en la habitación?' },
      { en:'What time is check-out?', es:'¿A qué hora es el check-out?' }
    ],
    listening:{
      audio:'audio/clases/hotel-listening.mp3',
      dialogue:[
        { speaker:'Recepcionista', en:'Good afternoon! Welcome. Do you have a reservation?' },
        { speaker:'Tú', en:'Yes, under the name Martinez. Two nights.' },
        { speaker:'Recepcionista', en:"Perfect, here's your key. Breakfast is served from 7 to 10 in the lobby." }
      ],
      question:{
        text:'¿A qué hora empieza el desayuno?',
        options:['A las 7','A las 10','A las 9'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Recepcionista', en:'Would you like a wake-up call tomorrow morning?' },
      options:[
        { en:'Yes, at seven, please.', correct:true, feedback:'¡Bien! Es una respuesta directa y natural.' },
        { en:"No, I don't have a reservation.", correct:false, feedback:'Esa respuesta no encaja: te preguntaron por una llamada para despertarte, no por la reservación.' },
        { en:'The room is on the third floor.', correct:false, feedback:'Estás dando información del cuarto, pero te preguntaron si quieres una llamada para despertar.' }
      ]
    },
    buildSentence:{
      es:'¿A qué hora se sirve el desayuno?',
      words:['is','breakfast','served?','What','time'],
      correctOrder:['What','time','is','breakfast','served?']
    },
    speaking:{
      audio:'audio/clases/hotel-speaking.mp3',
      prompt:'Could I get a room with a view, please?',
      es:'Practica diciendo: "¿Podría tener una habitación con vista, por favor?"'
    },
    miniChallenge:{
      start:'noise',
      nodes:{
        noise:{
          en:'At night, you call the front desk: "Excuse me, the room next door is very noisy."',
          es:'En la noche, llamas a recepción: "Disculpe, la habitación de al lado hace mucho ruido."',
          options:[
            { en:'Could you please ask them to be quieter?', next:'towel', correct:true },
            { en:'I would like to order pizza.', next:'noise-fail', correct:false }
          ]
        },
        'noise-fail':{
          en:'The staff asks: "Sorry, what do you need exactly?"',
          es:'El personal pregunta: "Disculpe, ¿qué necesita exactamente?"',
          options:[
            { en:'Sorry, I meant the noise next door is a problem.', next:'towel', correct:true }
          ]
        },
        towel:{
          en:'The next morning, housekeeping asks: "Do you need extra towels?"',
          es:'A la mañana siguiente, la mucama pregunta: "¿Necesita toallas extra?"',
          options:[
            { en:'Yes, two more please.', next:'end', correct:true },
            { en:'The breakfast was delicious.', next:'towel-fail', correct:false }
          ]
        },
        'towel-fail':{
          en:"She clarifies: \"I'm asking about towels for your room.\"",
          es:'Ella aclara: "Le pregunto por toallas para su habitación."',
          options:[
            { en:'Oh sorry, yes, two towels please.', next:'end', correct:true }
          ]
        },
        end:{ en:'Everything is sorted and you enjoy the rest of your stay. ¡Buena estadía!', es:'Todo se resuelve y disfrutas el resto de tu estadía. ¡Buena estadía!', options:[] }
      }
    },
    summary:{
      keyPhrases:['I have a reservation under the name Martinez.', 'Could I get a room with a view?', 'What time is breakfast served?', 'What time is check-out?'],
      tip:'Hoy practicaste el vocabulario esencial para hacer check-in en un hotel en inglés: reservación, habitación y servicios.'
    }
  },
  restaurant: {
    id:'restaurant',
    title:'En un restaurante',
    situation:{
      en:"You're at a restaurant ready to order dinner. You need to ask about the menu, order your food, and ask for the check.",
      es:'Estás en un restaurante listo para pedir la cena. Necesitas preguntar por el menú, ordenar tu comida y pedir la cuenta.'
    },
    phrases:[
      { en:'Could I see the menu, please?', es:'¿Podría ver el menú, por favor?' },
      { en:"I'll have the grilled chicken.", es:'Voy a pedir el pollo a la parrilla.' },
      { en:'Is this dish spicy?', es:'¿Este plato es picante?' },
      { en:'Could we get the check, please?', es:'¿Nos trae la cuenta, por favor?' },
      { en:'Do you accept credit cards?', es:'¿Aceptan tarjetas de crédito?' }
    ],
    listening:{
      audio:'audio/clases/restaurante-listening.mp3',
      dialogue:[
        { speaker:'Mesero', en:'Good evening! Are you ready to order?' },
        { speaker:'Tú', en:"Yes, I'll have the grilled chicken, please." },
        { speaker:'Mesero', en:'Great choice. Would you like anything to drink? We also have a soup of the day.' }
      ],
      question:{
        text:'¿Qué pidió la persona para comer?',
        options:['Pollo a la parrilla','Sopa del día','Pescado'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Mesero', en:'Would you like anything to drink?' },
      options:[
        { en:'Just water, please.', correct:true, feedback:'¡Bien! Es una respuesta simple y natural.' },
        { en:"I'll have the grilled chicken.", correct:false, feedback:'Esa respuesta ya la diste antes; ahora te preguntan por la bebida.' },
        { en:'The check, please.', correct:false, feedback:'Todavía es muy pronto para pedir la cuenta, apenas te preguntaron por la bebida.' }
      ]
    },
    buildSentence:{
      es:'¿Nos trae la cuenta, por favor?',
      words:['check,','the','bring','Could','you','please?'],
      correctOrder:['Could','you','bring','the','check,','please?']
    },
    speaking:{
      audio:'audio/clases/restaurante-speaking.mp3',
      prompt:'Could I see the menu, please?',
      es:'Practica diciendo: "¿Podría ver el menú, por favor?"'
    },
    miniChallenge:{
      start:'allergy',
      nodes:{
        allergy:{
          en:'The waiter asks: "Do you have any food allergies?"',
          es:'El mesero pregunta: "¿Tiene alguna alergia alimentaria?"',
          options:[
            { en:"No, I don't have any allergies.", next:'order', correct:true },
            { en:'Yes, please.', next:'allergy-fail', correct:false }
          ]
        },
        'allergy-fail':{
          en:'The waiter asks again: "Sorry, could you tell me which foods you are allergic to?"',
          es:'El mesero pregunta de nuevo: "Disculpe, ¿podría decirme a qué alimentos es alérgico?"',
          options:[
            { en:"Actually, I don't have any allergies.", next:'order', correct:true }
          ]
        },
        order:{
          en:'The waiter says: "Your food will be ready in about fifteen minutes."',
          es:'El mesero dice: "Su comida estará lista en unos quince minutos."',
          options:[
            { en:'Perfect, thank you!', next:'end', correct:true },
            { en:'Could I see the menu, please?', next:'order-fail', correct:false }
          ]
        },
        'order-fail':{
          en:'The waiter reminds you: "You already ordered, remember?"',
          es:'El mesero te recuerda: "Ya ordenó, ¿recuerda?"',
          options:[
            { en:'Oh, right! Thank you.', next:'end', correct:true }
          ]
        },
        end:{ en:'Your food arrives and it looks delicious. ¡Buen provecho!', es:'Tu comida llega y se ve deliciosa. ¡Buen provecho!', options:[] }
      }
    },
    summary:{
      keyPhrases:['Could I see the menu, please?', "I'll have the grilled chicken.", 'Could we get the check, please?', 'Do you accept credit cards?'],
      tip:'Hoy practicaste el vocabulario esencial para pedir comida en un restaurante en inglés: ordenar, preguntar por el menú y pedir la cuenta.'
    }
  },
  coffee: {
    id:'coffee',
    title:'Pedir un café',
    situation:{
      en:"You're at a coffee shop and want to order a coffee to go, just the way you like it.",
      es:'Estás en una cafetería y quieres pedir un café para llevar, justo como te gusta.'
    },
    phrases:[
      { en:'Can I get a medium latte, please?', es:'¿Me da un latte mediano, por favor?' },
      { en:'Could you make that with oat milk?', es:'¿Podría hacerlo con leche de avena?' },
      { en:'Can I have that to go?', es:'¿Me lo da para llevar?' },
      { en:'Do you have Wi-Fi here?', es:'¿Tienen wifi aquí?' },
      { en:"How much do I owe you?", es:'¿Cuánto le debo?' }
    ],
    listening:{
      audio:'audio/clases/cafe-listening.mp3',
      dialogue:[
        { speaker:'Barista', en:'Hi! What can I get started for you today?' },
        { speaker:'Tú', en:"I'd like a medium latte with oat milk, please." },
        { speaker:'Barista', en:"Sure thing. Is that for here or to go? It'll be six dollars." }
      ],
      question:{
        text:'¿Qué pidió la persona?',
        options:['Un latte mediano con leche de avena','Un té helado','Un café negro'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Barista', en:'Is that for here or to go?' },
      options:[
        { en:'To go, please.', correct:true, feedback:'¡Bien! Es una respuesta directa y natural.' },
        { en:'A medium latte, please.', correct:false, feedback:'Esa ya la pediste; ahora te preguntan cómo lo quieres.' },
        { en:'Do you have Wi-Fi?', correct:false, feedback:'Esa pregunta no responde si es para aquí o para llevar.' }
      ]
    },
    buildSentence:{
      es:'¿Podría hacerlo con leche de avena?',
      words:['with','Could','oat','milk?','make','you','that'],
      correctOrder:['Could','you','make','that','with','oat','milk?']
    },
    speaking:{
      audio:'audio/clases/cafe-speaking.mp3',
      prompt:'Can I get a medium latte, please?',
      es:'Practica diciendo: "¿Me da un latte mediano, por favor?"'
    },
    miniChallenge:{
      start:'order',
      nodes:{
        order:{
          en:'The barista asks: "What size would you like?"',
          es:'La barista pregunta: "¿Qué tamaño le gustaría?"',
          options:[
            { en:'Medium, please.', next:'milk', correct:true },
            { en:'To go, please.', next:'order-fail', correct:false }
          ]
        },
        'order-fail':{
          en:'The barista clarifies: "Sorry, I meant what size cup would you like?"',
          es:'La barista aclara: "Disculpe, me refiero a qué tamaño de vaso le gustaría."',
          options:[
            { en:'Oh, sorry! Medium, please.', next:'milk', correct:true }
          ]
        },
        milk:{
          en:'The barista asks: "Would you like regular milk or a plant-based option?"',
          es:'La barista pregunta: "¿Quiere leche regular o una opción vegetal?"',
          options:[
            { en:'Oat milk, please.', next:'end', correct:true },
            { en:'No, thank you.', next:'milk-fail', correct:false }
          ]
        },
        'milk-fail':{
          en:'The barista asks again: "So, regular milk then?"',
          es:'La barista pregunta de nuevo: "¿Entonces leche regular?"',
          options:[
            { en:'Actually, oat milk, please.', next:'end', correct:true }
          ]
        },
        end:{ en:'Your latte is ready and smells amazing. ¡Disfruta tu café!', es:'Tu latte está listo y huele delicioso. ¡Disfruta tu café!', options:[] }
      }
    },
    summary:{
      keyPhrases:['Can I get a medium latte, please?', 'Could you make that with oat milk?', 'Can I have that to go?', 'Do you have Wi-Fi here?'],
      tip:'Hoy practicaste cómo pedir un café exactamente como te gusta y pedirlo para llevar en inglés.'
    }
  },
  shopping: {
    id:'shopping',
    title:'Ir de compras',
    situation:{
      en:"You're at a clothing store looking for a jacket in your size.",
      es:'Estás en una tienda de ropa buscando una chaqueta en tu talla.'
    },
    phrases:[
      { en:'Do you have this in a medium?', es:'¿Tienen esto en talla mediana?' },
      { en:'Can I try this on?', es:'¿Puedo probarme esto?' },
      { en:'Where are the fitting rooms?', es:'¿Dónde están los probadores?' },
      { en:'Do you have this in another color?', es:'¿Tienen esto en otro color?' },
      { en:'How much does this cost?', es:'¿Cuánto cuesta esto?' }
    ],
    listening:{
      audio:'audio/clases/compras-listening.mp3',
      dialogue:[
        { speaker:'Vendedora', en:'Hi, welcome! Are you looking for anything in particular?' },
        { speaker:'Tú', en:"Yes, I'm looking for a jacket in a medium." },
        { speaker:'Vendedora', en:'We have a few options. The fitting rooms are right over there.' }
      ],
      question:{
        text:'¿Qué está buscando la persona?',
        options:['Una chaqueta talla mediana','Unos zapatos','Un vestido'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Vendedora', en:'Would you like to try it on?' },
      options:[
        { en:'Yes, please. Where are the fitting rooms?', correct:true, feedback:'¡Perfecto! Aceptas y preguntas dónde probarte la ropa.' },
        { en:'How much does this cost?', correct:false, feedback:'Todavía no te preguntaron el precio; te preguntaron si quieres probártela.' },
        { en:'Do you have this in blue?', correct:false, feedback:'Esa pregunta es sobre el color, no responde si quieres probártela.' }
      ]
    },
    buildSentence:{
      es:'¿Tienen esto en otro color?',
      words:['this','Do','have','another','you','color?','in'],
      correctOrder:['Do','you','have','this','in','another','color?']
    },
    speaking:{
      audio:'audio/clases/compras-speaking.mp3',
      prompt:'Can I try this on?',
      es:'Practica diciendo: "¿Puedo probarme esto?"'
    },
    miniChallenge:{
      start:'size',
      nodes:{
        size:{
          en:'The clerk asks: "What size are you looking for?"',
          es:'La vendedora pregunta: "¿Qué talla está buscando?"',
          options:[
            { en:'A medium, please.', next:'fit', correct:true },
            { en:'A blue one, please.', next:'size-fail', correct:false }
          ]
        },
        'size-fail':{
          en:'The clerk clarifies: "Sorry, I meant what size, small, medium, or large?"',
          es:'La vendedora aclara: "Disculpe, me refiero a qué talla: chica, mediana o grande."',
          options:[
            { en:'Oh, sorry! A medium, please.', next:'fit', correct:true }
          ]
        },
        fit:{
          en:'The clerk says: "Great, here you go. Would you like to try it on?"',
          es:'La vendedora dice: "Perfecto, aquí tiene. ¿Quiere probárselo?"',
          options:[
            { en:'Yes, please.', next:'end', correct:true },
            { en:'How much does it cost?', next:'fit-fail', correct:false }
          ]
        },
        'fit-fail':{
          en:"The clerk says: \"Sure, but let's make sure it fits first.\"",
          es:'La vendedora dice: "Claro, pero primero asegurémonos de que le quede."',
          options:[
            { en:"You're right, let me try it on.", next:'end', correct:true }
          ]
        },
        end:{ en:'The jacket fits perfectly. ¡Buena compra!', es:'La chaqueta te queda perfecta. ¡Buena compra!', options:[] }
      }
    },
    summary:{
      keyPhrases:['Do you have this in a medium?', 'Can I try this on?', 'Where are the fitting rooms?', 'How much does this cost?'],
      tip:'Hoy practicaste cómo buscar tu talla, probarte ropa y preguntar el precio en una tienda en inglés.'
    }
  },
  'meeting-someone': {
    id:'meeting-someone',
    title:'Conocer a alguien',
    situation:{
      en:"You're at a party and meet someone new. You want to introduce yourself and make a bit of small talk.",
      es:'Estás en una fiesta y conoces a alguien nuevo. Quieres presentarte y platicar un poco.'
    },
    phrases:[
      { en:"Hi, I'm Alex. Nice to meet you.", es:'Hola, soy Alex. Mucho gusto.' },
      { en:'What do you do for a living?', es:'¿A qué te dedicas?' },
      { en:'How do you know the host?', es:'¿Cómo conoces al anfitrión?' },
      { en:'Where are you from?', es:'¿De dónde eres?' },
      { en:'It was great talking to you.', es:'Fue un gusto hablar contigo.' }
    ],
    listening:{
      audio:'audio/clases/conocer-listening.mp3',
      dialogue:[
        { speaker:'Persona', en:"Hi! I don't think we've met before. I'm Sam." },
        { speaker:'Tú', en:"Hi Sam, nice to meet you. I'm Alex." },
        { speaker:'Persona', en:'Nice to meet you too, Alex! So, how do you know Maria?' }
      ],
      question:{
        text:'¿Qué le preguntó Sam a Alex?',
        options:['Cómo conoce a Maria','De dónde es','A qué se dedica'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Persona', en:'So, how do you know Maria?' },
      options:[
        { en:'We used to work together.', correct:true, feedback:'¡Bien! Respondes directamente cómo la conoces.' },
        { en:'Nice to meet you too.', correct:false, feedback:'Eso ya lo dijiste; ahora te preguntan cómo conoces a Maria.' },
        { en:"I'm from Mexico.", correct:false, feedback:'Esa respuesta es sobre de dónde eres, no sobre cómo conoces a Maria.' }
      ]
    },
    buildSentence:{
      es:'¿A qué te dedicas?',
      words:['do','for','What','you','a','do','living?'],
      correctOrder:['What','do','you','do','for','a','living?']
    },
    speaking:{
      audio:'audio/clases/conocer-speaking.mp3',
      prompt:"Hi, I'm Alex. Nice to meet you.",
      es:'Practica diciendo: "Hola, soy Alex. Mucho gusto."'
    },
    miniChallenge:{
      start:'intro',
      nodes:{
        intro:{
          en:"Someone new walks up and says: \"Hi, I don't think we've met. I'm Jordan.\"",
          es:'Alguien nuevo se acerca y dice: "Hola, no creo que nos conozcamos. Soy Jordan."',
          options:[
            { en:"Hi Jordan, I'm Alex. Nice to meet you.", next:'job', correct:true },
            { en:'How do you know the host?', next:'intro-fail', correct:false }
          ]
        },
        'intro-fail':{
          en:"Jordan says: \"Sorry, I didn't catch your name.\"",
          es:'Jordan dice: "Disculpa, no escuché tu nombre."',
          options:[
            { en:"Oh sorry, I'm Alex!", next:'job', correct:true }
          ]
        },
        job:{
          en:'Jordan asks: "So, what do you do for a living?"',
          es:'Jordan pregunta: "¿A qué te dedicas?"',
          options:[
            { en:"I'm a teacher. And you?", next:'end', correct:true },
            { en:"I'm from Mexico.", next:'job-fail', correct:false }
          ]
        },
        'job-fail':{
          en:"Jordan laughs and says: \"That's cool, but I actually asked about your job.\"",
          es:'Jordan se ríe y dice: "Qué bien, pero en realidad te pregunté por tu trabajo."',
          options:[
            { en:"Oh, sorry! I'm a teacher.", next:'end', correct:true }
          ]
        },
        end:{ en:'You and Jordan keep chatting and exchange contact info. ¡Nuevo amigo!', es:'Tú y Jordan siguen platicando e intercambian contacto. ¡Nuevo amigo!', options:[] }
      }
    },
    summary:{
      keyPhrases:["Hi, I'm Alex. Nice to meet you.", 'What do you do for a living?', 'Where are you from?', 'It was great talking to you.'],
      tip:'Hoy practicaste cómo presentarte y hacer plática con alguien nuevo en inglés.'
    }
  },
  'job-interview': {
    id:'job-interview',
    title:'Entrevista de trabajo',
    situation:{
      en:"You're in a job interview and need to talk about your experience and your strengths.",
      es:'Estás en una entrevista de trabajo y necesitas hablar de tu experiencia y tus fortalezas.'
    },
    phrases:[
      { en:'I have three years of experience in customer service.', es:'Tengo tres años de experiencia en servicio al cliente.' },
      { en:'My biggest strength is problem-solving.', es:'Mi mayor fortaleza es resolver problemas.' },
      { en:'What are the next steps in the process?', es:'¿Cuáles son los siguientes pasos en el proceso?' },
      { en:"I'm a fast learner.", es:'Aprendo rápido.' },
      { en:'Thank you for the opportunity.', es:'Gracias por la oportunidad.' }
    ],
    listening:{
      audio:'audio/clases/entrevista-listening.mp3',
      dialogue:[
        { speaker:'Entrevistador', en:'So, tell me a little about your work experience.' },
        { speaker:'Tú', en:'I have three years of experience in customer service.' },
        { speaker:'Entrevistador', en:"That's great. What would you say is your biggest strength?" }
      ],
      question:{
        text:'¿De qué habló la persona primero?',
        options:['Su experiencia laboral','Su salario esperado','Sus estudios'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Entrevistador', en:'What would you say is your biggest strength?' },
      options:[
        { en:'My biggest strength is problem-solving.', correct:true, feedback:'¡Bien! Respondes directamente lo que te preguntan.' },
        { en:'I have three years of experience.', correct:false, feedback:'Eso ya lo dijiste; ahora te preguntan por tu fortaleza.' },
        { en:'What are the next steps?', correct:false, feedback:'Esa es una pregunta, no responde cuál es tu fortaleza.' }
      ]
    },
    buildSentence:{
      es:'Aprendo rápido.',
      words:['fast','learner.',"I'm",'a'],
      correctOrder:["I'm",'a','fast','learner.']
    },
    speaking:{
      audio:'audio/clases/entrevista-speaking.mp3',
      prompt:'My biggest strength is problem-solving.',
      es:'Practica diciendo: "Mi mayor fortaleza es resolver problemas."'
    },
    miniChallenge:{
      start:'experience',
      nodes:{
        experience:{
          en:'The interviewer asks: "Why should we hire you?"',
          es:'El entrevistador pregunta: "¿Por qué deberíamos contratarte?"',
          options:[
            { en:"Because I'm a fast learner and I work well in a team.", next:'salary', correct:true },
            { en:'Thank you for the opportunity.', next:'experience-fail', correct:false }
          ]
        },
        'experience-fail':{
          en:"The interviewer says: \"That's kind, but I asked why we should hire you.\"",
          es:'El entrevistador dice: "Qué amable, pero te pregunté por qué deberíamos contratarte."',
          options:[
            { en:"Sorry! Because I'm a fast learner.", next:'salary', correct:true }
          ]
        },
        salary:{
          en:'The interviewer asks: "What are your salary expectations?"',
          es:'El entrevistador pregunta: "¿Cuáles son tus expectativas salariales?"',
          options:[
            { en:"I'm open to discussing that.", next:'end', correct:true },
            { en:"I'm a fast learner.", next:'salary-fail', correct:false }
          ]
        },
        'salary-fail':{
          en:'The interviewer says: "I see, but I actually asked about salary."',
          es:'El entrevistador dice: "Ya veo, pero en realidad pregunté por el salario."',
          options:[
            { en:"Sorry, I'm open to discussing that.", next:'end', correct:true }
          ]
        },
        end:{ en:'The interviewer smiles and says: "We\'ll be in touch soon."', es:'El entrevistador sonríe y dice: "Nos pondremos en contacto pronto."', options:[] }
      }
    },
    summary:{
      keyPhrases:['I have three years of experience in customer service.', 'My biggest strength is problem-solving.', "I'm a fast learner.", 'Thank you for the opportunity.'],
      tip:'Hoy practicaste cómo hablar de tu experiencia y tus fortalezas en una entrevista de trabajo en inglés.'
    }
  },
  'phone-calls': {
    id:'phone-calls',
    title:'Llamadas',
    situation:{
      en:"You're making a phone call to schedule an appointment.",
      es:'Estás haciendo una llamada para agendar una cita.'
    },
    phrases:[
      { en:"Hi, I'd like to make an appointment.", es:'Hola, quisiera hacer una cita.' },
      { en:'Could you repeat that, please?', es:'¿Podría repetir eso, por favor?' },
      { en:'Can I call you back later?', es:'¿Puedo llamarte más tarde?' },
      { en:'Sorry, I have the wrong number.', es:'Disculpe, marqué el número equivocado.' },
      { en:'Thanks for your help. Bye!', es:'Gracias por su ayuda. ¡Adiós!' }
    ],
    listening:{
      audio:'audio/clases/llamadas-listening.mp3',
      dialogue:[
        { speaker:'Recepcionista', en:"Good morning, Dr. Lee's office. How can I help you?" },
        { speaker:'Tú', en:"Hi, I'd like to make an appointment for next week." },
        { speaker:'Recepcionista', en:'Sure, does Tuesday at 3 PM work for you?' }
      ],
      question:{
        text:'¿Para qué llamó la persona?',
        options:['Para hacer una cita','Para cancelar una cita','Para pedir un producto'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Recepcionista', en:'Does Tuesday at 3 PM work for you?' },
      options:[
        { en:'Yes, that works great.', correct:true, feedback:'¡Bien! Confirmas el horario de forma natural.' },
        { en:'Could you repeat that, please?', correct:false, feedback:'Eso se usa cuando no entendiste algo, no para confirmar el horario.' },
        { en:"I'd like to make an appointment.", correct:false, feedback:'Eso ya lo dijiste; ahora solo confirman el horario.' }
      ]
    },
    buildSentence:{
      es:'¿Podría repetir eso, por favor?',
      words:['repeat','Could','please?','that,','you'],
      correctOrder:['Could','you','repeat','that,','please?']
    },
    speaking:{
      audio:'audio/clases/llamadas-speaking.mp3',
      prompt:"Hi, I'd like to make an appointment.",
      es:'Practica diciendo: "Hola, quisiera hacer una cita."'
    },
    miniChallenge:{
      start:'connect',
      nodes:{
        connect:{
          en:'The phone rings and someone says: "Hello, thank you for calling. How can I help you?"',
          es:'El teléfono suena y alguien dice: "Hola, gracias por llamar. ¿Cómo puedo ayudarle?"',
          options:[
            { en:"Hi, I'd like to make an appointment.", next:'time', correct:true },
            { en:'Sorry, wrong number.', next:'connect-fail', correct:false }
          ]
        },
        'connect-fail':{
          en:'The person asks: "Is there something else I can help you with?"',
          es:'La persona pregunta: "¿Hay algo más en lo que pueda ayudarle?"',
          options:[
            { en:"Actually, I'd like to make an appointment.", next:'time', correct:true }
          ]
        },
        time:{
          en:'The person asks: "What day works best for you?"',
          es:'La persona pregunta: "¿Qué día le queda mejor?"',
          options:[
            { en:'Tuesday would be great.', next:'end', correct:true },
            { en:'Thanks for your help. Bye!', next:'time-fail', correct:false }
          ]
        },
        'time-fail':{
          en:'The person says: "Wait, we still need to pick a day."',
          es:'La persona dice: "Espere, todavía necesitamos elegir un día."',
          options:[
            { en:'Oh, sorry! Tuesday works.', next:'end', correct:true }
          ]
        },
        end:{ en:'The appointment is confirmed for Tuesday. ¡Todo listo!', es:'La cita quedó confirmada para el martes. ¡Todo listo!', options:[] }
      }
    },
    summary:{
      keyPhrases:["Hi, I'd like to make an appointment.", 'Could you repeat that, please?', 'Can I call you back later?', 'Thanks for your help. Bye!'],
      tip:'Hoy practicaste cómo hacer una llamada, agendar una cita y manejar malentendidos por teléfono en inglés.'
    }
  },
  meetings: {
    id:'meetings',
    title:'Reuniones',
    situation:{
      en:"You're in a work meeting and need to share an update and ask a question.",
      es:'Estás en una reunión de trabajo y necesitas dar una actualización y hacer una pregunta.'
    },
    phrases:[
      { en:'Can everyone hear me okay?', es:'¿Todos me escuchan bien?' },
      { en:"I'd like to give a quick update.", es:'Quisiera dar una actualización rápida.' },
      { en:'Could you clarify that point?', es:'¿Podría aclarar ese punto?' },
      { en:'I agree with that.', es:'Estoy de acuerdo con eso.' },
      { en:"Let's follow up on this next week.", es:'Sigamos con esto la próxima semana.' }
    ],
    listening:{
      audio:'audio/clases/reuniones-listening.mp3',
      dialogue:[
        { speaker:'Jefe', en:"Okay, let's start. Can you give us a quick update on the project?" },
        { speaker:'Tú', en:"Sure, we're on track to finish by Friday." },
        { speaker:'Jefe', en:'Great. Does anyone have questions about that?' }
      ],
      question:{
        text:'¿Qué dijo la persona sobre el proyecto?',
        options:['Que van a terminar el viernes','Que hay un retraso','Que necesitan más dinero'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Jefe', en:'Does anyone have questions about that?' },
      options:[
        { en:'Could you clarify the deadline?', correct:true, feedback:'¡Bien! Haces una pregunta clara relacionada con el tema.' },
        { en:"I'd like to give a quick update.", correct:false, feedback:'Eso ya lo hiciste; ahora están pidiendo preguntas.' },
        { en:"Let's follow up next week.", correct:false, feedback:'Eso no es una pregunta; te están preguntando si tienes dudas.' }
      ]
    },
    buildSentence:{
      es:'Sigamos con esto la próxima semana.',
      words:['on','week.',"Let's",'next','this','follow','up'],
      correctOrder:["Let's",'follow','up','on','this','next','week.']
    },
    speaking:{
      audio:'audio/clases/reuniones-speaking.mp3',
      prompt:"I'd like to give a quick update.",
      es:'Practica diciendo: "Quisiera dar una actualización rápida."'
    },
    miniChallenge:{
      start:'start',
      nodes:{
        start:{
          en:'The meeting begins and someone says: "Can everyone hear me okay?"',
          es:'La reunión empieza y alguien dice: "¿Todos me escuchan bien?"',
          options:[
            { en:'Yes, loud and clear.', next:'update', correct:true },
            { en:'I agree with that.', next:'start-fail', correct:false }
          ]
        },
        'start-fail':{
          en:'The person asks again: "Sorry, can everyone hear me?"',
          es:'La persona pregunta de nuevo: "Disculpen, ¿todos me escuchan?"',
          options:[
            { en:'Yes, we can hear you.', next:'update', correct:true }
          ]
        },
        update:{
          en:'Your manager asks: "Can you give us a quick update?"',
          es:'Tu jefe pregunta: "¿Nos puedes dar una actualización rápida?"',
          options:[
            { en:"Sure, we're on track to finish by Friday.", next:'end', correct:true },
            { en:'Could you clarify that point?', next:'update-fail', correct:false }
          ]
        },
        'update-fail':{
          en:'Your manager says: "I asked for an update, not a question."',
          es:'Tu jefe dice: "Pedí una actualización, no una pregunta."',
          options:[
            { en:"Sorry! We're on track to finish by Friday.", next:'end', correct:true }
          ]
        },
        end:{ en:'The team nods and moves to the next topic. ¡Buena actualización!', es:'El equipo asiente y pasa al siguiente tema. ¡Buena actualización!', options:[] }
      }
    },
    summary:{
      keyPhrases:['Can everyone hear me okay?', "I'd like to give a quick update.", 'Could you clarify that point?', "Let's follow up on this next week."],
      tip:'Hoy practicaste cómo dar una actualización, hacer preguntas y participar en una reunión de trabajo en inglés.'
    }
  },
  pharmacy: {
    id:'pharmacy',
    title:'En la farmacia',
    situation:{
      en:"You're at a pharmacy because you have a headache. You need to ask for medicine and understand how to take it.",
      es:'Estás en una farmacia porque te duele la cabeza. Necesitas pedir un medicamento y entender cómo tomarlo.'
    },
    phrases:[
      { en:'I have a headache.', es:'Me duele la cabeza.' },
      { en:'Do you have something for it?', es:'¿Tiene algo para eso?' },
      { en:'How often should I take it?', es:'¿Cada cuánto debo tomarlo?' },
      { en:'Take one every six hours.', es:'Tome una cada seis horas.' },
      { en:'Are there any side effects?', es:'¿Tiene efectos secundarios?' }
    ],
    listening:{
      audio:'audio/clases/farmacia-listening.mp3',
      dialogue:[
        { speaker:'Farmacéutica', en:'Hi, how can I help you today?' },
        { speaker:'Tú', en:'I have a headache. Do you have something for it?' },
        { speaker:'Farmacéutica', en:'Yes. These tablets should help. Take one every six hours.' }
      ],
      question:{
        text:'¿Cada cuánto debe tomar la persona una tableta?',
        options:['Cada seis horas','Una vez al día','Cada dos horas'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Farmacéutica', en:'Do you have any allergies?' },
      options:[
        { en:"No, I don't have any allergies.", correct:true, feedback:'¡Bien! Respondes directamente a una pregunta importante antes de tomar un medicamento.' },
        { en:'I have a headache.', correct:false, feedback:'Eso explica por qué vienes, pero te preguntaron si tienes alergias.' },
        { en:'Take one every six hours.', correct:false, feedback:'Esa es la instrucción de la farmacéutica, no una respuesta sobre tus alergias.' }
      ]
    },
    buildSentence:{
      es:'¿Cada cuánto debo tomarlo?',
      words:['take','should','it?','How','often','I'],
      correctOrder:['How','often','should','I','take','it?']
    },
    speaking:{
      audio:'audio/clases/farmacia-speaking.mp3',
      prompt:'I have a headache. Do you have something for it?',
      es:'Practica diciendo: "Me duele la cabeza. ¿Tiene algo para eso?"'
    },
    miniChallenge:{
      start:'symptom',
      nodes:{
        symptom:{
          en:'The pharmacist asks: "What seems to be the problem?"',
          es:'La farmacéutica pregunta: "¿Cuál parece ser el problema?"',
          options:[
            { en:'I have a headache.', next:'instructions', correct:true },
            { en:'Take one every six hours.', next:'symptom-fail', correct:false }
          ]
        },
        'symptom-fail':{
          en:'The pharmacist says: "I understand, but what symptom do you have?"',
          es:'La farmacéutica dice: "Entiendo, pero ¿qué síntoma tienes?"',
          options:[
            { en:'I have a headache.', next:'instructions', correct:true }
          ]
        },
        instructions:{
          en:'The pharmacist gives you the medicine and says: "Take one every six hours."',
          es:'La farmacéutica te da el medicamento y dice: "Tome una cada seis horas."',
          options:[
            { en:'Thank you. Are there any side effects?', next:'end', correct:true },
            { en:'I have a headache.', next:'instructions-fail', correct:false }
          ]
        },
        'instructions-fail':{
          en:'The pharmacist says: "Yes, I know. Do you have a question about the medicine?"',
          es:'La farmacéutica dice: "Sí, lo sé. ¿Tienes alguna pregunta sobre el medicamento?"',
          options:[
            { en:'Are there any side effects?', next:'end', correct:true }
          ]
        },
        end:{ en:'The pharmacist explains the side effects, and you leave feeling prepared. ¡Cuídate!', es:'La farmacéutica te explica los efectos secundarios y sales preparado. ¡Cuídate!', options:[] }
      }
    },
    summary:{
      keyPhrases:['I have a headache.', 'Do you have something for it?', 'How often should I take it?', 'Are there any side effects?'],
      tip:'Hoy practicaste cómo explicar un síntoma, pedir un medicamento y entender cómo tomarlo en una farmacia.'
    }
  },
  gym: {
    id:'gym',
    title:'En el gimnasio',
    situation:{
      en:"You're at a gym for the first time. You want to ask about a class and find out where the lockers are.",
      es:'Estás en un gimnasio por primera vez. Quieres preguntar por una clase y saber dónde están los casilleros.'
    },
    phrases:[
      { en:"I'd like to sign up for a class.", es:'Quisiera inscribirme a una clase.' },
      { en:'What time does the yoga class start?', es:'¿A qué hora empieza la clase de yoga?' },
      { en:'Where are the lockers?', es:'¿Dónde están los casilleros?' },
      { en:'Do I need to bring a towel?', es:'¿Necesito traer una toalla?' },
      { en:"I'm new here.", es:'Soy nuevo aquí.' }
    ],
    listening:{
      audio:'audio/clases/gimnasio-listening.mp3',
      dialogue:[
        { speaker:'Recepcionista', en:'Hi! Welcome. Is this your first time here?' },
        { speaker:'Tú', en:"Yes, I'm new here. I'd like to sign up for a yoga class." },
        { speaker:'Recepcionista', en:'Great! The next class starts at six. The lockers are next to the changing rooms.' }
      ],
      question:{
        text:'¿A qué hora empieza la próxima clase?',
        options:['A las seis','A las cinco','A las siete'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Recepcionista', en:'Do you need a towel for your workout?' },
      options:[
        { en:'Yes, please. Do I need to bring my own?', correct:true, feedback:'¡Bien! Respondes y haces una pregunta útil de forma natural.' },
        { en:"I'm new here.", correct:false, feedback:'Eso sirve al presentarte, pero no responde la pregunta sobre la toalla.' },
        { en:'The yoga class starts at six.', correct:false, feedback:'Eso habla del horario, pero te preguntaron si necesitas una toalla.' }
      ]
    },
    buildSentence:{
      es:'¿A qué hora empieza la clase de yoga?',
      words:['does','time','yoga','What','class','start?','the'],
      correctOrder:['What','time','does','the','yoga','class','start?']
    },
    speaking:{
      audio:'audio/clases/gimnasio-speaking.mp3',
      prompt:"I'm new here. I'd like to sign up for a yoga class.",
      es:'Practica diciendo: "Soy nuevo aquí. Quisiera inscribirme a una clase de yoga."'
    },
    miniChallenge:{
      start:'arrival',
      nodes:{
        arrival:{
          en:'At the front desk, the receptionist asks: "How can I help you today?"',
          es:'En recepción, la persona pregunta: "¿Cómo puedo ayudarte hoy?"',
          options:[
            { en:"I'd like to sign up for a class.", next:'locker', correct:true },
            { en:'Where are the lockers?', next:'arrival-fail', correct:false }
          ]
        },
        'arrival-fail':{
          en:'The receptionist says: "They are nearby, but would you like to join a class first?"',
          es:'La persona dice: "Están cerca, pero ¿te gustaría inscribirte primero a una clase?"',
          options:[
            { en:"Yes, I'd like to sign up for a yoga class.", next:'locker', correct:true }
          ]
        },
        locker:{
          en:'The receptionist says: "You are all set. Do you know where the lockers are?"',
          es:'La persona dice: "Todo está listo. ¿Sabes dónde están los casilleros?"',
          options:[
            { en:'Not yet. Where are the lockers?', next:'end', correct:true },
            { en:'The class starts at six.', next:'locker-fail', correct:false }
          ]
        },
        'locker-fail':{
          en:'The receptionist says: "That is right. Now, do you need help finding the lockers?"',
          es:'La persona dice: "Así es. Ahora, ¿necesitas ayuda para encontrar los casilleros?"',
          options:[
            { en:'Yes, where are the lockers?', next:'end', correct:true }
          ]
        },
        end:{ en:'The receptionist points you in the right direction. Enjoy your class!', es:'La persona te señala la dirección correcta. ¡Disfruta tu clase!', options:[] }
      }
    },
    summary:{
      keyPhrases:["I'd like to sign up for a class.", 'What time does the yoga class start?', 'Where are the lockers?', "I'm new here."],
      tip:'Hoy practicaste cómo registrarte, preguntar por una clase y orientarte en un gimnasio en inglés.'
    }
  },
  'numbers-symbols': {
    id:'numbers-symbols',
    title:'Números, teléfonos y símbolos',
    situation:{
      en:"You're sharing your WhatsApp number and email address with someone. You need to say the country code, numbers, and symbols clearly.",
      es:'Vas a compartir tu número de WhatsApp y tu correo con alguien. Necesitas decir con claridad el código de país, los números y los símbolos.'
    },
    phrases:[
      { en:'My phone number is ...', es:'Mi número de teléfono es ...' },
      { en:'The plus sign is +.', es:'El signo más es +.' },
      { en:'At is the symbol @ in an email address.', es:'At es el símbolo @ en una dirección de correo.' },
      { en:'Dot is the symbol .', es:'Dot es el símbolo punto (.).' },
      { en:'Hyphen, or dash, is the symbol -.', es:'Hyphen, o dash, es el símbolo guion (-).' },
      { en:'Underscore is the symbol _.', es:'Underscore es el símbolo _.' },
      { en:'Slash is the symbol /.', es:'Slash es el símbolo /.' },
      { en:'Hash is the symbol #.', es:'Hash es el símbolo #.' }
    ],
    listening:{
      audio:'audio/clases/numeros-simbolos-listening.mp3',
      dialogue:[
        { speaker:'Persona', en:'Could you give me your WhatsApp number and email address, please?' },
        { speaker:'Tú', en:'Sure. My number is plus fifty-seven, three hundred twelve, five hundred sixty, twenty-four, eighteen. My email is ana dot lopez at gmail dot com.' },
        { speaker:'Persona', en:'Perfect. I have your number and email address.' }
      ],
      question:{
        text:'¿Cuál es el código de país que escuchaste?',
        options:['57','312','24'],
        correctIndex:0
      }
    },
    chooseResponse:{
      prompt:{ speaker:'Persona', en:'How do you say @ in an email address?' },
      options:[
        { en:'At.', correct:true, feedback:'¡Exacto! En un correo, @ se dice “at”.' },
        { en:'Dot.', correct:false, feedback:'“Dot” es el punto (.), no el símbolo @.' },
        { en:'Plus.', correct:false, feedback:'“Plus” es el signo +, no el símbolo @.' }
      ]
    },
    buildSentence:{
      es:'Mi correo es ana.lopez@gmail.com.',
      words:['gmail','dot','My','is','lopez','email','ana','at','dot','com.'],
      correctOrder:['My','email','is','ana','dot','lopez','at','gmail','dot','com.']
    },
    speaking:{
      audio:'audio/clases/numeros-simbolos-speaking.mp3',
      prompt:'My WhatsApp number is plus fifty-seven, three hundred twelve, five hundred sixty, twenty-four, eighteen.',
      es:'Practica diciendo: “Mi número de WhatsApp es +57 312 560 2418.”'
    },
    miniChallenge:{
      start:'email',
      nodes:{
        email:{
          en:'Someone asks: “What is your email address?”',
          es:'Alguien pregunta: “¿Cuál es tu dirección de correo?”',
          options:[
            { en:'It is ana dot lopez at gmail dot com.', next:'whatsapp', correct:true },
            { en:'My name is Leo.', next:'email-fail', correct:false }
          ]
        },
        'email-fail':{
          en:'They say: “Thanks, but I need your email address.”',
          es:'La persona dice: “Gracias, pero necesito tu dirección de correo.”',
          options:[
            { en:'It is ana dot lopez at gmail dot com.', next:'whatsapp', correct:true }
          ]
        },
        whatsapp:{
          en:'They ask: “And what is your WhatsApp number?”',
          es:'La persona pregunta: “¿Y cuál es tu número de WhatsApp?”',
          options:[
            { en:'It is plus fifty-seven, three hundred twelve, five hundred sixty, twenty-four, eighteen.', next:'end', correct:true },
            { en:'It is ana dot lopez at gmail dot com.', next:'whatsapp-fail', correct:false }
          ]
        },
        'whatsapp-fail':{
          en:'They say: “That is your email. I need the phone number.”',
          es:'La persona dice: “Ese es tu correo. Necesito el número de teléfono.”',
          options:[
            { en:'It is plus fifty-seven, three hundred twelve, five hundred sixty, twenty-four, eighteen.', next:'end', correct:true }
          ]
        },
        end:{ en:'Great. They save your contact details correctly.', es:'Perfecto. La persona guarda correctamente tus datos de contacto.', options:[] }
      }
    },
    summary:{
      keyPhrases:['My phone number is ...', 'The plus sign is +.', 'At is the symbol @.', 'Dot is the symbol .'],
      tip:'Hoy practicaste cómo decir números de teléfono, el código + de WhatsApp y los símbolos más usados en un correo.'
    }
  }
};

/* ============================================================
   CONTENIDO EXTRA PARA MIEMBROS (100 ejercicios nuevos)
   ------------------------------------------------------------
   Un batch de gramática, vocabulario, listening y writing sobre
   puntos que suelen confundir a quien aprende inglés (this/these,
   do/does, some/any, actually/currently, despite/although,
   who/whom, etc.), con explicaciones sencillas en español. Se
   agrega como una variante NUEVA y exclusiva de Miembros en cada
   nivel (nunca se modifica contenido existente), y se registra en
   MEMBERS_ONLY_VARIANT_INDEX (ver app.js) para que Practica Gratis
   nunca la toque. La dificultad respeta cada nivel: principiante
   son confusiones muy básicas, fácil un poco más, medio ya usa
   distinciones más finas, y avanzado tiene comprensión y preguntas
   más exigentes.
   ============================================================ */

GRAMMAR_BANK.principiante.push([
  {
    topic: "This / These",
    items: [
      {
        id: "g-principiante5-thisthese-1",
        translation: "Este es mi libro.",
        type: "choice",
        prompt: "How do you say this for ONE thing close to you?",
        options: ["This is my book.", "These is my book.", "This are my book."],
        correct: 0,
        explain: "“This” se usa para UNA sola cosa cerca de ti. Para varias cosas se usa “these”.",
        examples: [
          { en: "This is my book.", es: "Este es mi libro." },
          { en: "These are my books.", es: "Estos son mis libros." }
        ]
      },
      {
        id: "g-principiante5-thisthese-2",
        translation: "Estos son mis zapatos.",
        type: "fill",
        sentence: ["___", "are", "my", "shoes", "."],
        blankIndex: 0,
        bank: ["These", "This", "That"],
        correct: "These",
        explain: "“Shoes” es plural (varios zapatos), así que usamos “these”, no “this”.",
        examples: [
          { en: "These are my shoes.", es: "Estos son mis zapatos." },
          { en: "This is my shoe.", es: "Este es mi zapato." }
        ]
      },
      {
        id: "g-principiante5-thisthese-3",
        translation: "¿Cuál oración es correcta para varios lápices cerca de ti?",
        type: "choice",
        prompt: "Which sentence is correct for many pencils near you?",
        options: ["These are my pencils.", "This are my pencils.", "These is my pencils."],
        correct: 0,
        explain: "Con varias cosas cerca, el verbo también va en plural: “these are”.",
        examples: [
          { en: "These are my pencils.", es: "Estos son mis lápices." },
          { en: "This is my pencil.", es: "Este es mi lápiz." }
        ]
      },
      {
        id: "g-principiante5-thisthese-4",
        translation: "Estos son mis zapatos.",
        type: "error",
        wrong: "This are my shoes.",
        wrongWord: "This",
        right: "These are my shoes.",
        rightWord: "These",
        explain: "“Shoes” es plural, así que necesita “these”, no “this”.",
        examples: [
          { en: "These are my shoes.", es: "Estos son mis zapatos." },
          { en: "This is my shoe.", es: "Este es mi zapato." }
        ]
      }
    ]
  },
  {
    topic: "Do / Does",
    items: [
      {
        id: "g-principiante5-dodoes-1",
        translation: "¿Le gusta el café a ella?",
        type: "choice",
        prompt: "How do you ask a question with she?",
        options: ["Does she like coffee?", "Do she like coffee?", "Does she likes coffee?"],
        correct: 0,
        explain: "Con “he/she/it” usamos “does”, y el verbo principal se queda sin “s”: “does she like”.",
        examples: [
          { en: "Does she like coffee?", es: "¿Le gusta el café a ella?" },
          { en: "Do you like coffee?", es: "¿Te gusta el café a ti?" }
        ]
      },
      {
        id: "g-principiante5-dodoes-2",
        translation: "¿Te gusta el té?",
        type: "fill",
        sentence: ["___", "you", "like", "tea", "?"],
        blankIndex: 0,
        bank: ["Do", "Does", "Is"],
        correct: "Do",
        explain: "Con “you” siempre usamos “do”, nunca “does”.",
        examples: [
          { en: "Do you like tea?", es: "¿Te gusta el té?" },
          { en: "Does he like tea?", es: "¿Le gusta el té a él?" }
        ]
      },
      {
        id: "g-principiante5-dodoes-3",
        translation: "¿Cuál es correcta para “he”?",
        type: "choice",
        prompt: "Which is correct for he?",
        options: ["Does he play soccer?", "Do he play soccer?", "Does he plays soccer?"],
        correct: 0,
        explain: "Con “he” usamos “does”, y “play” se queda sin “s” porque el “s” ya está en “does”.",
        examples: [
          { en: "Does he play soccer?", es: "¿Juega fútbol él?" },
          { en: "Do they play soccer?", es: "¿Juegan fútbol ellos?" }
        ]
      },
      {
        id: "g-principiante5-dodoes-4",
        translation: "¿Te gusta la pizza?",
        type: "error",
        wrong: "Does you like pizza?",
        wrongWord: "Does",
        right: "Do you like pizza?",
        rightWord: "Do",
        explain: "Con “you” se usa “do”, no “does”.",
        examples: [
          { en: "Do you like pizza?", es: "¿Te gusta la pizza?" },
          { en: "Does she like pizza?", es: "¿Le gusta la pizza a ella?" }
        ]
      }
    ]
  }
]);

GRAMMAR_BANK.facil.push([
  {
    topic: "Some / Any",
    items: [
      {
        id: "g-facil9-someany-1",
        translation: "Tengo algo de dinero.",
        type: "choice",
        prompt: "Which is correct in a positive sentence?",
        options: ["I have some money.", "I have any money.", "I have a some money."],
        correct: 0,
        explain: "En frases afirmativas usamos “some”.",
        examples: [
          { en: "I have some money.", es: "Tengo algo de dinero." },
          { en: "Do you have any money?", es: "¿Tienes algo de dinero?" }
        ]
      },
      {
        id: "g-facil9-someany-2",
        translation: "¿Tienes alguna pregunta?",
        type: "fill",
        sentence: ["Do", "you", "have", "___", "questions", "?"],
        blankIndex: 3,
        bank: ["any", "some", "much"],
        correct: "any",
        explain: "En preguntas normalmente usamos “any”.",
        examples: [
          { en: "Do you have any questions?", es: "¿Tienes alguna pregunta?" },
          { en: "I have some questions.", es: "Tengo algunas preguntas." }
        ]
      },
      {
        id: "g-facil9-someany-3",
        translation: "No tengo nada de tiempo.",
        type: "choice",
        prompt: "Which is correct in a negative sentence?",
        options: ["I don't have any time.", "I don't have some time.", "I have no any time."],
        correct: 0,
        explain: "En frases negativas usamos “any”.",
        examples: [
          { en: "I don't have any time.", es: "No tengo nada de tiempo." },
          { en: "I have some time.", es: "Tengo algo de tiempo." }
        ]
      },
      {
        id: "g-facil9-someany-4",
        translation: "Tengo algunas manzanas.",
        type: "error",
        wrong: "I have any apples.",
        wrongWord: "any",
        right: "I have some apples.",
        rightWord: "some",
        explain: "En una frase afirmativa se usa “some”, no “any”.",
        examples: [
          { en: "I have some apples.", es: "Tengo algunas manzanas." },
          { en: "I don't have any apples.", es: "No tengo manzanas." }
        ]
      }
    ]
  },
  {
    topic: "Much / Many",
    items: [
      {
        id: "g-facil9-muchmany-1",
        translation: "Tengo muchos libros.",
        type: "choice",
        prompt: "Which is correct with a countable noun (books)?",
        options: ["I have many books.", "I have much books.", "I have a much books."],
        correct: 0,
        explain: "“Many” se usa con cosas que se pueden contar (books, friends).",
        examples: [
          { en: "I have many books.", es: "Tengo muchos libros." },
          { en: "I don't have much time.", es: "No tengo mucho tiempo." }
        ]
      },
      {
        id: "g-facil9-muchmany-2",
        translation: "No tengo mucho tiempo.",
        type: "fill",
        sentence: ["I", "don't", "have", "___", "time", "."],
        blankIndex: 3,
        bank: ["much", "many", "a"],
        correct: "much",
        explain: "“Time” no se puede contar uno por uno, así que usamos “much”.",
        examples: [
          { en: "I don't have much time.", es: "No tengo mucho tiempo." },
          { en: "I have many friends.", es: "Tengo muchos amigos." }
        ]
      },
      {
        id: "g-facil9-muchmany-3",
        translation: "¿Cuál funciona con cosas que se pueden contar y también con las que no?",
        type: "choice",
        prompt: "Which expression works with both countable and uncountable nouns?",
        options: ["a lot of", "much", "many"],
        correct: 0,
        explain: "“a lot of” funciona con las dos: “a lot of friends” y “a lot of money”.",
        examples: [
          { en: "I have a lot of friends.", es: "Tengo muchos amigos." },
          { en: "I have a lot of money.", es: "Tengo mucho dinero." }
        ]
      },
      {
        id: "g-facil9-muchmany-4",
        translation: "Ella tiene muchos amigos.",
        type: "error",
        wrong: "She has much friends.",
        wrongWord: "much",
        right: "She has many friends.",
        rightWord: "many",
        explain: "“Friends” se puede contar uno por uno, así que va con “many”.",
        examples: [
          { en: "She has many friends.", es: "Ella tiene muchos amigos." },
          { en: "She doesn't have much time.", es: "Ella no tiene mucho tiempo." }
        ]
      }
    ]
  }
]);

GRAMMAR_BANK.medio.push([
  {
    topic: "Actually / Currently",
    items: [
      {
        id: "g-medio9-actcurr-1",
        translation: "En realidad, no estoy de acuerdo.",
        type: "choice",
        prompt: "How do you say en realidad, no estoy de acuerdo?",
        options: ["Actually, I disagree.", "Currently, I disagree.", "Actual, I disagree."],
        correct: 0,
        explain: "“Actually” significa “en realidad”, no “actualmente”. Es una trampa clásica para hispanohablantes.",
        examples: [
          { en: "Actually, I disagree.", es: "En realidad, no estoy de acuerdo." },
          { en: "I currently live in Spain.", es: "Actualmente vivo en España." }
        ]
      },
      {
        id: "g-medio9-actcurr-2",
        translation: "Actualmente vivo en España.",
        type: "fill",
        sentence: ["I", "___", "live", "in", "Spain", "."],
        blankIndex: 1,
        bank: ["currently", "actually", "actual"],
        correct: "currently",
        explain: "Para decir “actualmente / en este momento” se usa “currently”.",
        examples: [
          { en: "I currently live in Spain.", es: "Actualmente vivo en España." },
          { en: "Actually, I disagree.", es: "En realidad, no estoy de acuerdo." }
        ]
      },
      {
        id: "g-medio9-actcurr-3",
        translation: "¿Cuál oración usa correctamente “en este momento”?",
        type: "choice",
        prompt: "Which sentence correctly says she is living in Spain right now?",
        options: ["She is currently living in Spain.", "She is actually living in Spain.", "She is actual living in Spain."],
        correct: 0,
        explain: "“Currently” es para “en este momento”; “actually” significa “en realidad”.",
        examples: [
          { en: "She is currently living in Spain.", es: "Ella actualmente vive en España." },
          { en: "Actually, she lives in Madrid.", es: "En realidad, ella vive en Madrid." }
        ]
      },
      {
        id: "g-medio9-actcurr-4",
        translation: "Actualmente, ella vive en Madrid ahora mismo.",
        type: "error",
        wrong: "Actually, she lives in Madrid right now.",
        wrongWord: "Actually",
        right: "Currently, she lives in Madrid right now.",
        rightWord: "Currently",
        explain: "Para hablar de “ahora mismo / en este momento” se usa “currently”, no “actually”.",
        examples: [
          { en: "Currently, she lives in Madrid right now.", es: "Actualmente, ella vive en Madrid ahora mismo." },
          { en: "Actually, I think you're right.", es: "En realidad, creo que tienes razón." }
        ]
      }
    ]
  },
  {
    topic: "Despite / Although / Instead of",
    items: [
      {
        id: "g-medio9-despalth-1",
        translation: "A pesar de la lluvia, salimos.",
        type: "choice",
        prompt: "Which is correct? Despite is followed by a noun or -ing, not a full sentence.",
        options: ["Despite the rain, we went out.", "Although the rain, we went out.", "Despite it rained, we went out."],
        correct: 0,
        explain: "“Despite” va seguido de un sustantivo o un verbo en “-ing”, nunca de una oración completa con sujeto y verbo.",
        examples: [
          { en: "Despite the rain, we went out.", es: "A pesar de la lluvia, salimos." },
          { en: "Although it was raining, we went out.", es: "Aunque llovía, salimos." }
        ]
      },
      {
        id: "g-medio9-despalth-2",
        translation: "A pesar de estar cansada, terminó la carrera.",
        type: "fill",
        sentence: ["___", "being", "tired", ",", "she", "finished", "the", "race", "."],
        blankIndex: 0,
        bank: ["Despite", "Although", "Instead"],
        correct: "Despite",
        explain: "“Despite” + verbo en “-ing” (being) es la forma correcta aquí.",
        examples: [
          { en: "Despite being tired, she finished the race.", es: "A pesar de estar cansada, terminó la carrera." },
          { en: "Although she was tired, she finished the race.", es: "Aunque estaba cansada, terminó la carrera." }
        ]
      },
      {
        id: "g-medio9-despalth-3",
        translation: "En vez de caminar, tomamos el bus.",
        type: "choice",
        prompt: "Which correctly says en vez de caminar, tomamos el bus?",
        options: ["Instead of walking, we took the bus.", "Instead walking, we took the bus.", "Despite walking, we took the bus."],
        correct: 0,
        explain: "“Instead of” + verbo en “-ing” significa “en vez de”.",
        examples: [
          { en: "Instead of walking, we took the bus.", es: "En vez de caminar, tomamos el bus." },
          { en: "Despite the distance, we walked.", es: "A pesar de la distancia, caminamos." }
        ]
      },
      {
        id: "g-medio9-despalth-4",
        translation: "Aunque llovía, jugamos.",
        type: "error",
        wrong: "Despite it was raining, we played.",
        wrongWord: "Despite",
        right: "Although it was raining, we played.",
        rightWord: "Although",
        explain: "“Despite” no puede ir seguido de una oración completa (sujeto + verbo); para eso se usa “although”.",
        examples: [
          { en: "Although it was raining, we played.", es: "Aunque llovía, jugamos." },
          { en: "Despite the rain, we played.", es: "A pesar de la lluvia, jugamos." }
        ]
      }
    ]
  }
]);

GRAMMAR_BANK.avanzado.push([
  {
    topic: "Who / Whom",
    items: [
      {
        id: "g-avanzado9-whowhom-1",
        translation: "¿A quién invitaste?",
        type: "choice",
        prompt: "Which is the traditionally correct form when asking about the OBJECT of a verb (formal English)?",
        options: ["Whom did you invite?", "Who did you invite?", "Whom invited you?"],
        correct: 0,
        explain: "“Whom” se usa cuando es el OBJETO del verbo (en este caso, a quién invitaste). En inglés hablado, mucha gente usa “who” igual, pero “whom” es la forma formal correcta.",
        examples: [
          { en: "Whom did you invite?", es: "¿A quién invitaste?" },
          { en: "Who invited you?", es: "¿Quién te invitó?" }
        ]
      },
      {
        id: "g-avanzado9-whowhom-2",
        translation: "¿A quién le diste la carta?",
        type: "fill",
        sentence: ["To", "___", "did", "you", "give", "the", "letter", "?"],
        blankIndex: 1,
        bank: ["whom", "who", "which"],
        correct: "whom",
        explain: "Después de una preposición (“to”) siempre se usa “whom”, nunca “who”.",
        examples: [
          { en: "To whom did you give the letter?", es: "¿A quién le diste la carta?" },
          { en: "Who gave you the letter?", es: "¿Quién te dio la carta?" }
        ]
      },
      {
        id: "g-avanzado9-whowhom-3",
        translation: "¿Cuál oración usa correctamente “who” como sujeto?",
        type: "choice",
        prompt: "Which sentence uses who correctly as the SUBJECT?",
        options: ["Who called you last night?", "Whom called you last night?", "Whom calls you last night?"],
        correct: 0,
        explain: "“Who” es correcto cuando es el SUJETO de la oración (quien hace la acción de llamar).",
        examples: [
          { en: "Who called you last night?", es: "¿Quién te llamó anoche?" },
          { en: "Whom did you call last night?", es: "¿A quién llamaste anoche?" }
        ]
      },
      {
        id: "g-avanzado9-whowhom-4",
        translation: "¿Quién viene a la fiesta?",
        type: "error",
        wrong: "Whom is coming to the party?",
        wrongWord: "Whom",
        right: "Who is coming to the party?",
        rightWord: "Who",
        explain: "“Who” es el sujeto de “is coming” (quien viene); “whom” solo se usa como objeto del verbo.",
        examples: [
          { en: "Who is coming to the party?", es: "¿Quién viene a la fiesta?" },
          { en: "Whom did you invite to the party?", es: "¿A quién invitaste a la fiesta?" }
        ]
      }
    ]
  },
  {
    topic: "Despite vs In spite of vs Even though",
    items: [
      {
        id: "g-avanzado9-despiteeventhough-1",
        translation: "A pesar del tráfico, llegamos a tiempo.",
        type: "choice",
        prompt: "Which pair means exactly the same and both take a noun or -ing (not a full clause)?",
        options: ["Despite / In spite of the traffic, we arrived on time.", "Despite / Even though the traffic, we arrived.", "In spite / Even though the traffic, we arrived."],
        correct: 0,
        explain: "“Despite” e “in spite of” significan lo mismo y siempre van con sustantivo o “-ing”, nunca con una oración completa.",
        examples: [
          { en: "Despite the traffic, we arrived on time.", es: "A pesar del tráfico, llegamos a tiempo." },
          { en: "Even though there was traffic, we arrived on time.", es: "Aunque había tráfico, llegamos a tiempo." }
        ]
      },
      {
        id: "g-avanzado9-despiteeventhough-2",
        translation: "Aunque estaba nerviosa, dio un gran discurso.",
        type: "fill",
        sentence: ["___", "she", "was", "nervous", ",", "she", "gave", "a", "great", "speech", "."],
        blankIndex: 0,
        bank: ["Even though", "Despite", "In spite of"],
        correct: "Even though",
        explain: "Como sigue una oración completa (“she was nervous”, con sujeto y verbo), se necesita “even though”, no “despite” ni “in spite of”.",
        examples: [
          { en: "Even though she was nervous, she gave a great speech.", es: "Aunque estaba nerviosa, dio un gran discurso." },
          { en: "Despite her nerves, she gave a great speech.", es: "A pesar de sus nervios, dio un gran discurso." }
        ]
      },
      {
        id: "g-avanzado9-despiteeventhough-3",
        translation: "A pesar de sentirse nerviosa, actuó muy bien.",
        type: "choice",
        prompt: "Which is correct with a plain -ing form (no subject of its own)?",
        options: ["Despite feeling nervous, she performed well.", "Even though feeling nervous, she performed well.", "Even feeling nervous, she performed well."],
        correct: 0,
        explain: "Con un simple “-ing” (sin sujeto propio) se usa “despite”, no “even though”.",
        examples: [
          { en: "Despite feeling nervous, she performed well.", es: "A pesar de sentirse nerviosa, actuó muy bien." },
          { en: "Even though she felt nervous, she performed well.", es: "Aunque se sentía nerviosa, actuó muy bien." }
        ]
      },
      {
        id: "g-avanzado9-despiteeventhough-4",
        translation: "A pesar de la fuerte lluvia, el partido continuó.",
        type: "error",
        wrong: "Even though the heavy rain, the match continued.",
        wrongWord: "Even though",
        right: "Despite the heavy rain, the match continued.",
        rightWord: "Despite",
        explain: "“Even though” necesita una oración completa con sujeto y verbo. Aquí solo hay un sustantivo (“the heavy rain”), así que corresponde “despite”.",
        examples: [
          { en: "Despite the heavy rain, the match continued.", es: "A pesar de la fuerte lluvia, el partido continuó." },
          { en: "Even though it was raining heavily, the match continued.", es: "Aunque llovía fuerte, el partido continuó." }
        ]
      }
    ]
  }
]);

VOCAB_BANK.principiante.push([
  {
    id: "v-principiante5-1",
    word: "Borrow",
    translation: "Pedir prestado (recibir algo) · no confundir con \"lend\" (prestar, dar)",
    examples: [
      { en: "Can I borrow your pen?", es: "¿Me prestas tu pluma?" },
      { en: "She borrowed my book last week.", es: "Ella pidió prestado mi libro la semana pasada." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa esto: \"pedir prestado, recibir algo para usarlo y devolverlo\"?",
      options: ["borrow", "lend", "buy"],
      correct: 0,
      explain: "\"Borrow\" es pedir prestado (tú recibes). \"Lend\" es prestar (tú das)."
    }
  },
  {
    id: "v-principiante5-2",
    word: "Lend",
    translation: "Prestar (dar algo) · lo opuesto de \"borrow\"",
    examples: [
      { en: "Can you lend me your pen?", es: "¿Me prestas tu pluma? (tú me la das)" },
      { en: "I lent her my book.", es: "Le presté mi libro." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa esto: \"dar algo prestado a alguien\"?",
      options: ["lend", "borrow", "keep"],
      correct: 0,
      explain: "\"Lend\" es dar algo prestado. Es lo opuesto de \"borrow\" (recibir prestado)."
    }
  },
  {
    id: "v-principiante5-3",
    word: "Say",
    translation: "Decir algo (sin mencionar a quién se le dice) · no confundir con \"tell\"",
    examples: [
      { en: "She said hello.", es: "Ella dijo hola." },
      { en: "He told me the news.", es: "Él me contó la noticia." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas cuando NO mencionas a quién le hablas? (ej. \"She ___ hello.\")",
      options: ["say", "tell", "speak"],
      correct: 0,
      explain: "\"Say\" no necesita a quién. \"Tell\" siempre lleva a la persona: \"tell me\", \"tell him\"."
    }
  },
  {
    id: "v-principiante5-4",
    word: "Tell",
    translation: "Decir/contar algo a alguien · siempre menciona a quién",
    examples: [
      { en: "Tell me your name.", es: "Dime tu nombre." },
      { en: "She said her name.", es: "Ella dijo su nombre." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas cuando SÍ mencionas a quién le hablas? (ej. \"___ me your name.\")",
      options: ["tell", "say", "talk"],
      correct: 0,
      explain: "\"Tell\" siempre va con la persona: \"tell me\", \"tell her\". \"Say\" no la necesita."
    }
  },
  {
    id: "v-principiante5-5",
    word: "Bring",
    translation: "Traer (hacia donde está el hablante) · no confundir con \"take\"",
    examples: [
      { en: "Please bring your book to school.", es: "Por favor trae tu libro a la escuela." },
      { en: "Take your umbrella with you.", es: "Lleva tu paraguas contigo." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa esto: \"traer algo hacia aquí\"?",
      options: ["bring", "take", "carry"],
      correct: 0,
      explain: "\"Bring\" es traer hacia el lugar donde estás. \"Take\" es llevar lejos de ahí."
    }
  },
  {
    id: "v-principiante5-6",
    word: "Take",
    translation: "Llevar (lejos de donde está el hablante) · opuesto de \"bring\"",
    examples: [
      { en: "Take this to your teacher.", es: "Lleva esto a tu maestro." },
      { en: "Bring me some water, please.", es: "Tráeme agua, por favor." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa esto: \"llevar algo lejos de aquí\"?",
      options: ["take", "bring", "carry"],
      correct: 0,
      explain: "\"Take\" es llevar algo a otro lugar. \"Bring\" es traerlo hacia aquí."
    }
  },
  {
    id: "v-principiante5-7",
    word: "Listen",
    translation: "Escuchar con atención (a propósito) · no confundir con \"hear\"",
    examples: [
      { en: "Listen to this song.", es: "Escucha esta canción." },
      { en: "I can hear music next door.", es: "Puedo oír música en la casa de al lado." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas cuando pones atención a propósito?",
      options: ["listen", "hear", "look"],
      correct: 0,
      explain: "\"Listen\" es escuchar con atención, a propósito. \"Hear\" es oír sin esfuerzo."
    }
  },
  {
    id: "v-principiante5-8",
    word: "Hear",
    translation: "Oír (sin esfuerzo, sin buscarlo) · no confundir con \"listen\"",
    examples: [
      { en: "I hear a noise.", es: "Oigo un ruido." },
      { en: "Listen carefully to the instructions.", es: "Escucha con atención las instrucciones." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas cuando un sonido simplemente llega a tus oídos, sin esfuerzo?",
      options: ["hear", "listen", "sound"],
      correct: 0,
      explain: "\"Hear\" pasa sin esfuerzo. \"Listen\" es poner atención a propósito."
    }
  }
]);

VOCAB_BANK.facil.push([
  {
    id: "v-facil9-1",
    word: "Do",
    translation: "Hacer una actividad o tarea (en general) · no confundir con \"make\" (crear/producir)",
    examples: [
      { en: "I need to do my homework.", es: "Necesito hacer mi tarea." },
      { en: "She made a cake.", es: "Ella hizo (preparó) un pastel." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas para una actividad en general, como \"my homework\"?",
      options: ["do", "make", "work"],
      correct: 0,
      explain: "\"Do\" se usa para actividades y tareas. \"Make\" se usa para crear o producir algo."
    }
  },
  {
    id: "v-facil9-2",
    word: "Make",
    translation: "Hacer/crear algo (producir) · no confundir con \"do\"",
    examples: [
      { en: "She made a beautiful cake.", es: "Ella hizo un pastel hermoso." },
      { en: "I did my homework.", es: "Hice mi tarea." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas cuando CREAS o produces algo, como un pastel?",
      options: ["make", "do", "cook"],
      correct: 0,
      explain: "\"Make\" es crear o producir algo nuevo, como \"make a cake\"."
    }
  },
  {
    id: "v-facil9-3",
    word: "See",
    translation: "Ver algo sin esfuerzo (pasa por tus ojos) · no confundir con \"watch\"",
    examples: [
      { en: "I can see the mountains from here.", es: "Puedo ver las montañas desde aquí." },
      { en: "We watched a movie.", es: "Vimos una película (con atención)." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas cuando algo simplemente está frente a tus ojos, sin esfuerzo?",
      options: ["see", "watch", "look"],
      correct: 0,
      explain: "\"See\" pasa sin esfuerzo. \"Watch\" es prestar atención a algo que se mueve (TV, partido)."
    }
  },
  {
    id: "v-facil9-4",
    word: "Watch",
    translation: "Ver con atención algo que se mueve (TV, partido) · no confundir con \"see\"",
    examples: [
      { en: "We watched a movie at home.", es: "Vimos una película en casa." },
      { en: "I saw a bird in the garden.", es: "Vi un pájaro en el jardín." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas para ver la televisión o un partido con atención?",
      options: ["watch", "see", "hear"],
      correct: 0,
      explain: "\"Watch\" es para algo que se mueve y le pones atención, como la TV o un partido."
    }
  },
  {
    id: "v-facil9-5",
    word: "Travel",
    translation: "Viajar (verbo, la acción) · no confundir con \"trip\" (el viaje, sustantivo)",
    examples: [
      { en: "I love to travel.", es: "Me encanta viajar." },
      { en: "Our trip to Mexico was amazing.", es: "Nuestro viaje a México fue increíble." }
    ],
    quiz: {
      prompt: "¿Qué palabra es un VERBO (la acción de viajar)?",
      options: ["travel", "trip", "vacation"],
      correct: 0,
      explain: "\"Travel\" es el verbo (viajar). \"Trip\" es el sustantivo (el viaje en sí)."
    }
  },
  {
    id: "v-facil9-6",
    word: "Trip",
    translation: "Viaje (sustantivo, el viaje en sí) · no confundir con \"travel\" (el verbo)",
    examples: [
      { en: "We had a great trip.", es: "Tuvimos un gran viaje." },
      { en: "I like to travel alone.", es: "Me gusta viajar solo." }
    ],
    quiz: {
      prompt: "¿Qué palabra es un SUSTANTIVO (el viaje en sí, no la acción)?",
      options: ["trip", "travel", "journey verb"],
      correct: 0,
      explain: "\"Trip\" es el sustantivo. \"Travel\" es normalmente el verbo."
    }
  },
  {
    id: "v-facil9-7",
    word: "Job",
    translation: "Trabajo/empleo (una posición específica) · no confundir con \"work\" (en general)",
    examples: [
      { en: "I got a new job.", es: "Conseguí un nuevo trabajo (empleo)." },
      { en: "I have a lot of work today.", es: "Tengo mucho trabajo (tareas) hoy." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"un empleo\", una posición específica?",
      options: ["job", "work", "office"],
      correct: 0,
      explain: "\"Job\" es un empleo específico (por ejemplo, \"a job as a teacher\")."
    }
  },
  {
    id: "v-facil9-8",
    word: "Work",
    translation: "Trabajo/trabajar (en general) · no confundir con \"job\" (empleo específico)",
    examples: [
      { en: "I have a lot of work today.", es: "Tengo mucho trabajo hoy." },
      { en: "She got a new job.", es: "Ella consiguió un nuevo empleo." }
    ],
    quiz: {
      prompt: "¿Qué palabra usas para hablar de trabajo/tareas en general, no un empleo específico?",
      options: ["work", "job", "office"],
      correct: 0,
      explain: "\"Work\" es más general (actividad de trabajar). \"Job\" es un puesto específico."
    }
  }
]);

VOCAB_BANK.medio.push([
  {
    id: "v-medio9-1",
    word: "Actually",
    translation: "En realidad, la verdad es que · NO significa \"actualmente\"",
    examples: [
      { en: "Actually, I disagree with you.", es: "En realidad, no estoy de acuerdo contigo." },
      { en: "I currently work from home.", es: "Actualmente trabajo desde casa." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"en realidad\", NO \"actualmente\"?",
      options: ["actually", "currently", "actual"],
      correct: 0,
      explain: "\"Actually\" es una trampa clásica: significa \"en realidad\", no \"actualmente\"."
    }
  },
  {
    id: "v-medio9-2",
    word: "Currently",
    translation: "Actualmente, en este momento · es la traducción real de \"actualmente\"",
    examples: [
      { en: "She is currently traveling.", es: "Ella actualmente está viajando." },
      { en: "Actually, that's not correct.", es: "En realidad, eso no es correcto." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"actualmente / en este momento\"?",
      options: ["currently", "actually", "actual"],
      correct: 0,
      explain: "\"Currently\" es la palabra correcta para \"actualmente\"."
    }
  },
  {
    id: "v-medio9-3",
    word: "Sensible",
    translation: "Sensato, razonable · NO significa \"sensible\" (emocional), eso es \"sensitive\"",
    examples: [
      { en: "That's a sensible decision.", es: "Esa es una decisión sensata." },
      { en: "He's very sensitive about criticism.", es: "Él es muy sensible a las críticas." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"sensato, razonable\"?",
      options: ["sensible", "sensitive", "sensible emotional"],
      correct: 0,
      explain: "\"Sensible\" en inglés significa sensato, no emocional. Para eso está \"sensitive\"."
    }
  },
  {
    id: "v-medio9-4",
    word: "Sensitive",
    translation: "Sensible (emocional, delicado) · no confundir con \"sensible\" (sensato)",
    examples: [
      { en: "She's a very sensitive person.", es: "Ella es una persona muy sensible." },
      { en: "That was a sensible choice.", es: "Esa fue una elección sensata." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"sensible\" en el sentido emocional?",
      options: ["sensitive", "sensible", "reasonable"],
      correct: 0,
      explain: "\"Sensitive\" es lo emocional/delicado; \"sensible\" en inglés es sensato."
    }
  },
  {
    id: "v-medio9-5",
    word: "Embarrassed",
    translation: "Avergonzado/a (cómo se siente una persona) · no confundir con \"embarrassing\"",
    examples: [
      { en: "I felt embarrassed when I forgot her name.", es: "Me sentí avergonzado cuando olvidé su nombre." },
      { en: "That was an embarrassing situation.", es: "Esa fue una situación vergonzosa." }
    ],
    quiz: {
      prompt: "¿Qué palabra describe CÓMO SE SIENTE una persona (avergonzada)?",
      options: ["embarrassed", "embarrassing", "ashamed only"],
      correct: 0,
      explain: "\"Embarrassed\" describe a la persona que siente vergüenza."
    }
  },
  {
    id: "v-medio9-6",
    word: "Embarrassing",
    translation: "Vergonzoso, que causa pena · describe la situación, no a la persona",
    examples: [
      { en: "That was an embarrassing mistake.", es: "Ese fue un error vergonzoso." },
      { en: "I felt embarrassed about it.", es: "Me sentí avergonzado por eso." }
    ],
    quiz: {
      prompt: "¿Qué palabra describe una SITUACIÓN que causa vergüenza?",
      options: ["embarrassing", "embarrassed", "shy"],
      correct: 0,
      explain: "\"Embarrassing\" describe la situación o cosa que causa vergüenza."
    }
  },
  {
    id: "v-medio9-7",
    word: "Assist",
    translation: "Ayudar, asistir a alguien · no significa \"atender\" un evento, eso es \"attend\"",
    examples: [
      { en: "Can you assist me with this box?", es: "¿Me puedes ayudar con esta caja?" },
      { en: "I will attend the meeting.", es: "Voy a asistir a la reunión." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"ayudar\" a alguien?",
      options: ["assist", "attend", "help only"],
      correct: 0,
      explain: "\"Assist\" es ayudar. \"Attend\" es ir/asistir a un evento."
    }
  },
  {
    id: "v-medio9-8",
    word: "Attend",
    translation: "Asistir a un evento (ir) · no confundir con \"assist\" (ayudar)",
    examples: [
      { en: "I will attend the conference.", es: "Voy a asistir a la conferencia." },
      { en: "Can you assist me?", es: "¿Me puedes ayudar?" }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"ir/asistir\" a un evento?",
      options: ["attend", "assist", "go only"],
      correct: 0,
      explain: "\"Attend\" es asistir a un evento. \"Assist\" es ayudar a alguien."
    }
  }
]);

VOCAB_BANK.avanzado.push([
  {
    id: "v-avanzado9-1",
    word: "Despite",
    translation: "A pesar de · va seguido de sustantivo o \"-ing\", nunca de una oración completa",
    examples: [
      { en: "Despite the rain, they went out.", es: "A pesar de la lluvia, salieron." },
      { en: "Although it was raining, they went out.", es: "Aunque llovía, salieron." }
    ],
    quiz: {
      prompt: "¿Qué palabra va seguida de un SUSTANTIVO o \"-ing\" (no una oración completa)?",
      options: ["despite", "although", "because"],
      correct: 0,
      explain: "\"Despite\" + sustantivo/-ing. \"Although\" necesita una oración completa."
    }
  },
  {
    id: "v-avanzado9-2",
    word: "Although",
    translation: "Aunque · va seguido de una oración completa (sujeto + verbo)",
    examples: [
      { en: "Although she was tired, she kept working.", es: "Aunque estaba cansada, siguió trabajando." },
      { en: "Despite her tiredness, she kept working.", es: "A pesar de su cansancio, siguió trabajando." }
    ],
    quiz: {
      prompt: "¿Qué palabra necesita una ORACIÓN COMPLETA después (sujeto + verbo)?",
      options: ["although", "despite", "instead of"],
      correct: 0,
      explain: "\"Although\" siempre va con una oración completa."
    }
  },
  {
    id: "v-avanzado9-3",
    word: "Whereas",
    translation: "Mientras que (contraste formal) · no indica tiempo, indica contraste",
    examples: [
      { en: "John likes mornings, whereas his sister likes evenings.", es: "A John le gustan las mañanas, mientras que a su hermana le gustan las noches." },
      { en: "I was reading while she was cooking.", es: "Yo leía mientras ella cocinaba." }
    ],
    quiz: {
      prompt: "¿Qué palabra se usa para mostrar un CONTRASTE formal entre dos cosas?",
      options: ["whereas", "while", "since"],
      correct: 0,
      explain: "\"Whereas\" marca un contraste (formal), no simultaneidad en el tiempo."
    }
  },
  {
    id: "v-avanzado9-4",
    word: "While",
    translation: "Mientras (tiempo simultáneo), o también contraste informal · más flexible que \"whereas\"",
    examples: [
      { en: "I was cooking while she was cleaning.", es: "Yo cocinaba mientras ella limpiaba." },
      { en: "He prefers tea, whereas I prefer coffee.", es: "Él prefiere té, mientras que yo prefiero café." }
    ],
    quiz: {
      prompt: "¿Qué palabra se usa normalmente para dos acciones que pasan AL MISMO TIEMPO?",
      options: ["while", "whereas", "despite"],
      correct: 0,
      explain: "\"While\" es para simultaneidad en el tiempo (o contraste informal)."
    }
  },
  {
    id: "v-avanzado9-5",
    word: "Presume",
    translation: "Presumir/suponer (creer algo sin prueba) · no significa \"presumir\" de algo (fanfarronear), eso es \"boast\"",
    examples: [
      { en: "I presume you've read the report.", es: "Supongo que has leído el reporte." },
      { en: "He likes to boast about his car.", es: "A él le gusta presumir de su carro." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"suponer algo sin prueba\"?",
      options: ["presume", "boast", "assume wrong meaning"],
      correct: 0,
      explain: "\"Presume\" es suponer. \"Presumir\" (fanfarronear) en inglés es \"boast\", una trampa clásica."
    }
  },
  {
    id: "v-avanzado9-6",
    word: "Assume",
    translation: "Asumir/dar por hecho · muy parecido a \"presume\" pero más común en el uso diario",
    examples: [
      { en: "I assumed you already knew.", es: "Asumí que ya lo sabías." },
      { en: "I presume you've read the report.", es: "Supongo que has leído el reporte." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"dar algo por hecho, asumir\"?",
      options: ["assume", "boast", "presume wrong"],
      correct: 0,
      explain: "\"Assume\" es asumir/dar por hecho, muy similar a \"presume\"."
    }
  },
  {
    id: "v-avanzado9-7",
    word: "Discreet",
    translation: "Discreto/a (cuidadoso, prudente) · no confundir con \"discrete\" (separado, distinto)",
    examples: [
      { en: "She was very discreet about her plans.", es: "Ella fue muy discreta sobre sus planes." },
      { en: "These are two discrete categories.", es: "Estas son dos categorías separadas." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"discreto/a, prudente\"?",
      options: ["discreet", "discrete", "quiet only"],
      correct: 0,
      explain: "\"Discreet\" es discreto/prudente. \"Discrete\" (sin la segunda \"e\" junta) significa separado."
    }
  },
  {
    id: "v-avanzado9-8",
    word: "Discrete",
    translation: "Separado, distinto, individual · no confundir con \"discreet\" (discreto/prudente)",
    examples: [
      { en: "The data is divided into discrete groups.", es: "Los datos están divididos en grupos separados." },
      { en: "He was very discreet about it.", es: "Él fue muy discreto al respecto." }
    ],
    quiz: {
      prompt: "¿Qué palabra significa \"separado, distinto\"?",
      options: ["discrete", "discreet", "hidden"],
      correct: 0,
      explain: "\"Discrete\" es separado/distinto. Se escribe casi igual que \"discreet\" pero significa otra cosa."
    }
  }
]);

WRITING_BANK.principiante.push([
  {
    id: "w-principiante5-1",
    prompt: "Escribe una frase usando \"This\" o \"These\" correctamente.",
    target: "...",
    checkPattern: "\\b(this|these)\\b",
    hint: "Usa \"this\" para una sola cosa cerca de ti, o \"these\" para varias cosas.",
    example: { en: "This is my book.", es: "Este es mi libro." },
    checklist: ["¿Usaste \"this\" o \"these\"?", "¿Coincide con singular (this) o plural (these)?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-principiante5-2",
    prompt: "Escribe una pregunta usando \"Do\" o \"Does\".",
    target: "...",
    checkPattern: "\\b(do|does)\\b",
    hint: "Usa \"do\" con I/you/we/they, y \"does\" con he/she/it.",
    example: { en: "Does she like coffee?", es: "¿Le gusta el café a ella?" },
    checklist: ["¿Usaste \"do\" o \"does\"?", "¿Coincide con el sujeto (he/she/it usa does)?", "¿Termina con signo de pregunta?"]
  },
  {
    id: "w-principiante5-3",
    prompt: "Escribe una frase usando \"borrow\" (pedir prestado).",
    target: "...",
    checkPattern: "borrow",
    hint: "\"Borrow\" es cuando TÚ recibes algo prestado.",
    example: { en: "Can I borrow your pen?", es: "¿Me prestas tu pluma?" },
    checklist: ["¿Usaste la palabra \"borrow\"?", "¿Queda claro que alguien recibe algo prestado?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-principiante5-4",
    prompt: "Escribe una frase usando \"bring\" o \"take\" correctamente.",
    target: "...",
    checkPattern: "\\b(bring|take)\\b",
    hint: "\"Bring\" es traer hacia aquí; \"take\" es llevar lejos de aquí.",
    example: { en: "Please bring your book to school.", es: "Por favor trae tu libro a la escuela." },
    checklist: ["¿Usaste \"bring\" o \"take\"?", "¿La dirección tiene sentido (hacia aquí o hacia allá)?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-principiante5-5",
    prompt: "Escribe una frase usando \"listen\" o \"hear\" correctamente.",
    target: "...",
    checkPattern: "\\b(listen|hear)\\b",
    hint: "\"Listen\" es escuchar con atención; \"hear\" es oír sin esfuerzo.",
    example: { en: "I can hear music next door.", es: "Puedo oír música en la casa de al lado." },
    checklist: ["¿Usaste \"listen\" o \"hear\"?", "¿Corresponde al significado correcto?", "¿La frase tiene sentido?"]
  }
]);

WRITING_BANK.facil.push([
  {
    id: "w-facil9-1",
    prompt: "Escribe una frase usando \"some\" o \"any\" correctamente.",
    target: "...",
    checkPattern: "\\b(some|any)\\b",
    hint: "\"Some\" en frases afirmativas, \"any\" en negativas y preguntas.",
    example: { en: "I have some money.", es: "Tengo algo de dinero." },
    checklist: ["¿Usaste \"some\" o \"any\"?", "¿Corresponde al tipo de frase (afirmativa/negativa/pregunta)?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-facil9-2",
    prompt: "Escribe una frase usando \"much\" o \"many\" correctamente.",
    target: "...",
    checkPattern: "\\b(much|many)\\b",
    hint: "\"Many\" con cosas contables (books), \"much\" con cosas no contables (time, money).",
    example: { en: "I have many books.", es: "Tengo muchos libros." },
    checklist: ["¿Usaste \"much\" o \"many\"?", "¿El sustantivo es contable (many) o no contable (much)?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-facil9-3",
    prompt: "Escribe una frase usando \"do\" o \"make\" correctamente (hacer una tarea vs. crear algo).",
    target: "...",
    checkPattern: "\\b(do|does|did|make|makes|made)\\b",
    hint: "\"Do\" es para actividades/tareas; \"make\" es para crear o producir algo.",
    example: { en: "I need to do my homework.", es: "Necesito hacer mi tarea." },
    checklist: ["¿Usaste alguna forma de \"do\" o \"make\"?", "¿Corresponde al significado (tarea vs. crear)?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-facil9-4",
    prompt: "Escribe una frase usando \"see\" o \"watch\" correctamente.",
    target: "...",
    checkPattern: "\\b(see|saw|watch|watched)\\b",
    hint: "\"See\" es ver sin esfuerzo; \"watch\" es ver con atención algo que se mueve.",
    example: { en: "We watched a movie at home.", es: "Vimos una película en casa." },
    checklist: ["¿Usaste alguna forma de \"see\" o \"watch\"?", "¿Corresponde al significado correcto?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-facil9-5",
    prompt: "Escribe una frase usando \"job\" o \"work\" correctamente.",
    target: "...",
    checkPattern: "\\b(job|work)\\b",
    hint: "\"Job\" es un empleo específico; \"work\" es trabajo/actividad en general.",
    example: { en: "I got a new job.", es: "Conseguí un nuevo trabajo." },
    checklist: ["¿Usaste \"job\" o \"work\"?", "¿Corresponde al significado (empleo específico vs. general)?", "¿La frase tiene sentido?"]
  }
]);

WRITING_BANK.medio.push([
  {
    id: "w-medio9-1",
    prompt: "Escribe una frase usando \"actually\" o \"currently\" correctamente.",
    target: "...",
    checkPattern: "\\b(actually|currently)\\b",
    hint: "\"Actually\" es \"en realidad\"; \"currently\" es \"actualmente/en este momento\".",
    example: { en: "Actually, I disagree with you.", es: "En realidad, no estoy de acuerdo contigo." },
    checklist: ["¿Usaste \"actually\" o \"currently\"?", "¿Corresponde al significado correcto?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-medio9-2",
    prompt: "Escribe una frase usando \"despite\" o \"although\" correctamente.",
    target: "...",
    checkPattern: "\\b(despite|although)\\b",
    hint: "\"Despite\" + sustantivo/-ing; \"although\" + oración completa (sujeto + verbo).",
    example: { en: "Despite the rain, we went out.", es: "A pesar de la lluvia, salimos." },
    checklist: ["¿Usaste \"despite\" o \"although\"?", "¿Le sigue la estructura correcta (sustantivo/-ing o una oración completa)?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-medio9-3",
    prompt: "Escribe una frase usando \"sensible\" o \"sensitive\" correctamente.",
    target: "...",
    checkPattern: "\\b(sensible|sensitive)\\b",
    hint: "\"Sensible\" en inglés es sensato/razonable; \"sensitive\" es sensible en lo emocional.",
    example: { en: "That's a sensible decision.", es: "Esa es una decisión sensata." },
    checklist: ["¿Usaste \"sensible\" o \"sensitive\"?", "¿Corresponde al significado correcto?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-medio9-4",
    prompt: "Escribe una frase usando \"embarrassed\" o \"embarrassing\" correctamente.",
    target: "...",
    checkPattern: "\\b(embarrassed|embarrassing)\\b",
    hint: "\"Embarrassed\" describe a la persona; \"embarrassing\" describe la situación.",
    example: { en: "That was an embarrassing mistake.", es: "Ese fue un error vergonzoso." },
    checklist: ["¿Usaste \"embarrassed\" o \"embarrassing\"?", "¿Corresponde al significado (persona vs. situación)?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-medio9-5",
    prompt: "Escribe una frase usando \"assist\" o \"attend\" correctamente.",
    target: "...",
    checkPattern: "\\b(assist|attend)\\b",
    hint: "\"Assist\" es ayudar; \"attend\" es asistir/ir a un evento.",
    example: { en: "Can you assist me with this box?", es: "¿Me puedes ayudar con esta caja?" },
    checklist: ["¿Usaste \"assist\" o \"attend\"?", "¿Corresponde al significado correcto?", "¿La frase tiene sentido?"]
  }
]);

WRITING_BANK.avanzado.push([
  {
    id: "w-avanzado9-1",
    prompt: "Escribe una pregunta usando \"who\" o \"whom\" correctamente.",
    target: "...",
    checkPattern: "\\b(who|whom)\\b",
    hint: "\"Who\" es sujeto; \"whom\" es objeto (y siempre después de una preposición como \"to\").",
    example: { en: "To whom did you give the letter?", es: "¿A quién le diste la carta?" },
    checklist: ["¿Usaste \"who\" o \"whom\"?", "¿Corresponde a sujeto (who) u objeto (whom)?", "¿Termina con signo de pregunta?"]
  },
  {
    id: "w-avanzado9-2",
    prompt: "Escribe una frase usando \"despite\", \"although\" o \"even though\" correctamente.",
    target: "...",
    checkPattern: "\\b(despite|although|even though)\\b",
    hint: "\"Despite\" + sustantivo/-ing. \"Although\"/\"even though\" + oración completa.",
    example: { en: "Despite the heavy rain, the match continued.", es: "A pesar de la fuerte lluvia, el partido continuó." },
    checklist: ["¿Usaste \"despite\", \"although\" o \"even though\"?", "¿Le sigue la estructura correcta?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-avanzado9-3",
    prompt: "Escribe una frase usando \"whereas\" o \"while\" para mostrar un contraste.",
    target: "...",
    checkPattern: "\\b(whereas|while)\\b",
    hint: "\"Whereas\" es más formal para contraste; \"while\" también sirve, y además indica simultaneidad.",
    example: { en: "John likes mornings, whereas his sister likes evenings.", es: "A John le gustan las mañanas, mientras que a su hermana le gustan las noches." },
    checklist: ["¿Usaste \"whereas\" o \"while\"?", "¿Muestra un contraste claro entre dos cosas?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-avanzado9-4",
    prompt: "Escribe una frase usando \"presume\" o \"assume\" correctamente.",
    target: "...",
    checkPattern: "\\b(presume|assume|presumed|assumed)\\b",
    hint: "Ambas significan suponer/dar por hecho algo sin prueba directa.",
    example: { en: "I presume you've read the report.", es: "Supongo que has leído el reporte." },
    checklist: ["¿Usaste \"presume\" o \"assume\" (o su forma pasada)?", "¿Queda claro que se supone algo sin prueba?", "¿La frase tiene sentido?"]
  },
  {
    id: "w-avanzado9-5",
    prompt: "Escribe una frase usando \"discreet\" o \"discrete\" correctamente.",
    target: "...",
    checkPattern: "\\b(discreet|discrete)\\b",
    hint: "\"Discreet\" es discreto/prudente; \"discrete\" es separado/distinto.",
    example: { en: "She was very discreet about her plans.", es: "Ella fue muy discreta sobre sus planes." },
    checklist: ["¿Usaste \"discreet\" o \"discrete\"?", "¿Corresponde al significado correcto?", "¿La frase tiene sentido?"]
  }
]);

LISTENING_BANK.principiante.push([
  {
    id: "l-principiante8-1",
    audioFile: "audio/a0/a0listening-020.mp3",
    transcript: "Can I borrow your pen, please?",
    translation: "¿Me prestas tu pluma, por favor?",
    question: "What does the speaker want to do?",
    options: ["Borrow the pen and give it back later", "Keep the pen forever", "Buy a new pen"],
    correct: 0,
    explain: "\"Borrow\" significa pedir prestado algo que después se devuelve."
  },
  {
    id: "l-principiante8-2",
    audioFile: "audio/a0/a0listening-021.mp3",
    transcript: "Please bring your book to school tomorrow.",
    translation: "Por favor trae tu libro a la escuela mañana.",
    question: "What should the listener do?",
    options: ["Bring the book to school", "Leave the book at home", "Buy a new book"],
    correct: 0,
    explain: "\"Bring\" es traer algo hacia el lugar donde estará el hablante (la escuela)."
  },
  {
    id: "l-principiante8-3",
    audioFile: "audio/a0/a0listening-022.mp3",
    transcript: "Does she work on Saturdays?",
    translation: "¿Ella trabaja los sábados?",
    question: "What is being asked?",
    options: ["If she works on Saturdays", "If she likes Saturdays", "If Saturday is a holiday"],
    correct: 0,
    explain: "La pregunta usa \"does\" con \"she\" para preguntar si trabaja los sábados."
  },
  {
    id: "l-principiante8-4",
    audioFile: "audio/a0/a0listening-023.mp3",
    transcript: "I can hear music, but I am not really listening to it.",
    translation: "Puedo oír música, pero en realidad no la estoy escuchando con atención.",
    question: "What is true about the speaker?",
    options: ["They notice the music without paying close attention", "They are listening very carefully", "They can't hear anything"],
    correct: 0,
    explain: "\"Hear\" es oír sin esfuerzo; \"listen\" es poner atención, y aquí dice que NO está haciendo eso."
  }
]);

LISTENING_BANK.facil.push([
  {
    id: "l-facil13-1",
    audioFile: "audio/a1/a1listening-039.mp3",
    transcript: "She made a beautiful cake for the party.",
    translation: "Ella hizo un pastel hermoso para la fiesta.",
    question: "What did she do?",
    options: ["She made a cake", "She bought a cake", "She ate a cake"],
    correct: 0,
    explain: "\"Made\" (de \"make\") significa que ella creó/preparó el pastel."
  },
  {
    id: "l-facil13-2",
    audioFile: "audio/a1/a1listening-040.mp3",
    transcript: "We watched a movie at home last night.",
    translation: "Vimos una película en casa anoche.",
    question: "What did they do last night?",
    options: ["Watched a movie", "Went to the cinema", "Read a book"],
    correct: 0,
    explain: "\"Watched\" (de \"watch\") es ver con atención algo como una película."
  },
  {
    id: "l-facil13-3",
    audioFile: "audio/a1/a1listening-041.mp3",
    transcript: "I have a new job at a hospital.",
    translation: "Tengo un nuevo trabajo en un hospital.",
    question: "What is true about the speaker?",
    options: ["They have a new job", "They are sick", "They are visiting a friend"],
    correct: 0,
    explain: "\"Job\" aquí significa un empleo específico, en un hospital."
  },
  {
    id: "l-facil13-4",
    audioFile: "audio/a1/a1listening-042.mp3",
    transcript: "He doesn't have much time this week.",
    translation: "Él no tiene mucho tiempo esta semana.",
    question: "What does he have?",
    options: ["Very little time", "A lot of time", "No job"],
    correct: 0,
    explain: "\"Doesn't have much time\" significa que tiene poco tiempo disponible."
  }
]);

LISTENING_BANK.medio.push([
  {
    id: "l-medio10-1",
    audioFile: "audio/b1/b1listening-028.mp3",
    transcript: "Actually, I don't agree with that plan.",
    translation: "En realidad, no estoy de acuerdo con ese plan.",
    question: "What is the speaker really doing?",
    options: ["Disagreeing with the plan", "Agreeing with the plan", "Asking about the plan"],
    correct: 0,
    explain: "\"Actually\" introduce que la persona no está de acuerdo, en realidad."
  },
  {
    id: "l-medio10-2",
    audioFile: "audio/b1/b1listening-029.mp3",
    transcript: "Despite the traffic, we arrived on time.",
    translation: "A pesar del tráfico, llegamos a tiempo.",
    question: "What happened even though there was traffic?",
    options: ["They arrived on time", "They arrived late", "They cancelled the trip"],
    correct: 0,
    explain: "\"Despite the traffic\" indica que a pesar del tráfico, sí llegaron a tiempo."
  },
  {
    id: "l-medio10-3",
    audioFile: "audio/b1/b1listening-030.mp3",
    transcript: "I felt so embarrassed when I forgot her name.",
    translation: "Me sentí tan avergonzado cuando olvidé su nombre.",
    question: "How did the speaker feel?",
    options: ["Embarrassed", "Excited", "Angry"],
    correct: 0,
    explain: "\"Embarrassed\" describe cómo se sintió la persona: avergonzada."
  },
  {
    id: "l-medio10-4",
    audioFile: "audio/b1/b1listening-031.mp3",
    transcript: "Can you assist me with this heavy box?",
    translation: "¿Me puedes ayudar con esta caja pesada?",
    question: "What is the speaker asking for?",
    options: ["Help carrying the box", "Permission to leave", "Directions"],
    correct: 0,
    explain: "\"Assist\" significa ayudar; están pidiendo ayuda con la caja."
  }
]);

LISTENING_BANK.avanzado.push([
  {
    id: "l-avanzado10-1",
    audioFile: "audio/c1/c1listening-028.mp3",
    transcript: "Whom did they choose for the position?",
    translation: "¿A quién eligieron para el puesto?",
    question: "What is being asked?",
    options: ["Who was chosen for the job", "Who is asking the question", "When the job starts"],
    correct: 0,
    explain: "\"Whom\" aquí es el objeto de \"choose\": preguntan a quién eligieron."
  },
  {
    id: "l-avanzado10-2",
    audioFile: "audio/c1/c1listening-029.mp3",
    transcript: "Whereas John prefers mornings, his sister prefers evenings.",
    translation: "Mientras que a John le gustan las mañanas, a su hermana le gustan las noches.",
    question: "What does whereas show here?",
    options: ["A contrast between John and his sister", "That John and his sister agree", "A reason for something"],
    correct: 0,
    explain: "\"Whereas\" marca un contraste entre las preferencias de John y su hermana."
  },
  {
    id: "l-avanzado10-3",
    audioFile: "audio/c1/c1listening-030.mp3",
    transcript: "I assume you have already read the report.",
    translation: "Supongo que ya has leído el reporte.",
    question: "What is the speaker doing?",
    options: ["Taking something for granted without proof", "Stating a fact they confirmed", "Asking a direct question"],
    correct: 0,
    explain: "\"Assume\" es suponer algo sin tener prueba directa de ello."
  },
  {
    id: "l-avanzado10-4",
    audioFile: "audio/c1/c1listening-031.mp3",
    transcript: "She was very discreet about her plans.",
    translation: "Ella fue muy discreta sobre sus planes.",
    question: "How did she behave?",
    options: ["Careful and quiet about her plans", "Loud and open about her plans", "Confused about her plans"],
    correct: 0,
    explain: "\"Discreet\" significa discreta, prudente, cuidadosa al no revelar información."
  }
]);
