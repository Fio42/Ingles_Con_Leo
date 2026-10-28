/* ============================================================
   ACADEMIA INGLES CON LEO: contenido del curso piloto "Domina el verbo TO BE".

   Esto es una PLANTILLA para los demas cursos. Para crear otro curso se copia el
   objeto del curso, se cambian lecciones y banco, y se agrega a ACADEMIA.courses.

   PILOTO: el avance se guarda solo en este navegador (leo_academia_piloto_v1).
   No se conecta con recordSession, leo_micro_stats_v1, mistake_stats ni Supabase.
   La evaluacion es de PRACTICA y no da insignias ni certificados.

   Tipos de actividad (todas se corrigen en el navegador solo en el piloto):
     choice     elegir una opcion         { q, options:[...], answer:<indice>, why }
     type       escribir una respuesta    { q, source?, accepted:[...], show, why }
     order      ordenar palabras          { q, tokens:[...en orden correcto], why }
     match      relacionar parejas        { q, pairs:[[izq, der],...], why }
     error      encontrar el error        { q, options:[...], wrong:<indice>, fix, why }
     write      escritura guiada          { q, example, checks:[{re, flags?, msg}], why }

   Pantalla de explicacion:
     title, text (string o lista de parrafos), chips, table, compare, items, big, note
     audio  mp3 de la voz de Leo para esa pantalla (si no hay, no se muestra boton)
     items[].audio  mp3 de una frase de ejemplo ya publicada en el articulo del verbo To be

   Reglas de contenido (las del sitio): sin rayas largas, sin negritas sueltas, una idea por pantalla.
   ============================================================ */
var ACADEMIA_CONFIG = {
  passPct: 80,        // porcentaje para superar la evaluacion (configurable)
  examSize: 15,       // preguntas por intento
  examPerTopic: 3,    // cuantas preguntas de cada tema entran en cada intento
  weeklyGoals: [2, 3, 5]
};

/* Instrucciones guiadas: cada actividad dice QUE HACER y muestra un EJEMPLO corto.
   item.how y item.ex (opcionales) reemplazan estos valores por defecto. */
var ACADEMIA_HOWTO = {
  choice: { t: 'Toca la opción correcta y luego toca Comprobar.', ex: 'She ___ happy.  →  is' },
  error:  { t: 'Una de las tres frases está mal. Toca la que tiene el error.', ex: 'I am tired. / He are here. (error) / We are ready.' },
  type:   { t: 'Escribe la respuesta en inglés y toca Comprobar.', ex: 'He ___ happy.  →  is' },
  order:  { t: 'Toca las palabras en orden para formar la frase.', ex: 'am, I, happy.  →  I am happy.' },
  match:  { t: 'Une cada palabra con su pareja.', ex: 'I  →  am' },
  write:  { t: 'Escribe tu respuesta en inglés. Puedes usar el ejemplo como guía.', ex: null }
};

var ACADEMIA = {
  route: {
    id: 'fundamentos',
    title: 'Fundamentos del inglés',
    courses: [
      { id: 'pronombres', title: 'Pronombres personales', soon: false, blurb: 'I, you, he, she, it, we, they.' },
      { id: 'to-be', title: 'TO BE completo', pilot: true },
      { id: 'articulos', title: 'Artículos y plurales', soon: true, blurb: 'A, an, the y cómo formar plurales.' },
      { id: 'posesivos', title: 'Posesivos y demostrativos', soon: true, blurb: 'My, your, this, that.' },
      { id: 'there-is-are', title: 'THERE IS / THERE ARE', soon: true, blurb: 'Decir qué hay y dónde.' },
      { id: 'can', title: "CAN / CAN'T", soon: true, blurb: 'Habilidades y permisos.' },
      { id: 'presente-simple', title: 'Presente simple', soon: true, blurb: 'Rutinas y hábitos.' },
      { id: 'do-does', title: 'DO / DOES', soon: true, blurb: 'Preguntas y negaciones en presente.' }
    ]
  },

  courses: {
    'to-be': {
      id: 'to-be',
      title: 'Domina el verbo TO BE',
      name: 'TO BE',
      short: 'Am, is y are',
      tagline: 'Aprende a decir quién eres, cómo estás y dónde estás.',
      goal: 'Al terminar podrás presentarte, hablar de otras personas y hacer y contestar preguntas con am, is y are.',
      topics: {
        forma: 'Elegir am, is o are',
        afirm: 'Frases afirmativas y formas cortas',
        neg: 'Negaciones',
        preg: 'Preguntas y respuestas cortas',
        vida: 'To be en situaciones reales'
      },

      lessons: [
        /* ------------------------------------------------------------ 1 */
        {
          id: 'am-is-are', n: 1, minutes: 5, topic: 'forma',
          title: 'Am, is y are',
          summary: 'Qué palabra usar con cada persona.',
          canSay: ['I am from Colombia.', 'She is my friend.', 'We are at home.'],
          screens: [
            {
              title: 'Am, is y are: ser o estar',
              text: 'En inglés, ser y estar se dicen igual: to be. Solo cambia según quién habla.',
              chips: [
                { a: 'I', b: 'am' },
                { a: 'he · she · it', b: 'is' },
                { a: 'you · we · they', b: 'are' }
              ],
              audio: 'audio/aprender/to-be/exp-01.mp3'
            },
            {
              title: 'Escucha tres ejemplos',
              text: 'La misma palabra sirve para ser y para estar.',
              items: [
                { en: 'I am from Mexico.', es: 'Soy de México.' },
                { en: 'She is tired today.', es: 'Ella está cansada hoy.' },
                { en: 'They are at school.', es: 'Ellos están en la escuela.' }
              ],
              audio: 'audio/aprender/to-be/exp-02.mp3'
            },
            {
              title: 'También sirve para preguntar',
              text: 'Para hacer una pregunta, pasa is al inicio de la frase. Lo veremos con calma en la lección 4.',
              change: { a: { label: 'Afirmación', text: 'She is a nurse.', es: 'Ella es enfermera.' }, b: { label: 'Pregunta', text: 'Is she a nurse?', es: '¿Ella es enfermera?' } },
              listen: ['She is a nurse.', 'Is she a nurse?'],
              items: [
                { en: 'He is my brother.', es: 'Él es mi hermano.' },
                { en: 'We are ready.', es: 'Estamos listos.' }
              ],
              audio: 'audio/aprender/to-be/exp-03.mp3'
            },
            {
              title: 'Truco para recordarlo',
              big: 'I → am',
              text: 'Solo I va con am. Una persona o una cosa (he, she, it) va con is. Varias personas, o tú, van con are.',
              note: "Al hablar se acorta: I'm, she's, they're. Las formas cortas completas están en la lección 2.",
              items: [
                { en: "I'm not sure.", es: 'No estoy seguro.' }
              ],
              audio: 'audio/aprender/to-be/exp-04.mp3'
            }
          ],
          activities: [
            { id: 'l1-a1', type: 'choice', topic: 'forma', q: 'I ___ from Colombia.', options: ['am', 'is', 'are'], answer: 0,
              why: 'Con I siempre usamos am: I am.' },
            { id: 'l1-a2', type: 'choice', topic: 'forma', q: 'She ___ a teacher.', options: ['am', 'is', 'are'], answer: 1,
              why: 'She es una sola persona, así que va con is.' },
            { id: 'l1-a3', type: 'choice', topic: 'forma', q: 'My brothers ___ at home.', options: ['is', 'am', 'are'], answer: 2,
              why: 'My brothers son varias personas, equivale a they. Con they usamos are.' },
            { id: 'l1-a4', type: 'match', topic: 'forma', q: 'Relaciona cada persona con su palabra.',
              pairs: [['I', 'am'], ['she', 'is'], ['they', 'are']],
              why: 'I va con am; he, she e it van con is; you, we y they van con are.' },
            { id: 'l1-a5', type: 'type', topic: 'forma', q: 'Escribe la palabra que falta.', ex: "He ___ happy.  →  is", source: 'You ___ my friend.',
              accepted: ['are'], show: 'are', why: 'Con you siempre usamos are, aunque hables con una sola persona.' },
            { id: 'l1-a6', type: 'error', topic: 'forma', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['We are in Lima.', 'She are a doctor.', 'It is cold.'], wrong: 1, fix: 'She is a doctor.',
              why: 'She va con is, no con are.' },
            { id: 'l1-a7', type: 'order', topic: 'forma', q: 'Ordena las palabras para formar una frase.',
              tokens: ['My', 'mother', 'is', 'at', 'home.'],
              why: 'Primero quién (my mother), luego is, luego dónde (at home).' },
            { id: 'l1-a8', type: 'choice', topic: 'forma', q: '¿Cómo se dice "Ella es mi amiga"?',
              options: ['She are my friend.', 'She is my friend.', 'She am my friend.'], answer: 1,
              why: 'She es una persona: she is.' }
          ]
        },

        /* ------------------------------------------------------------ 2 */
        {
          id: 'afirmaciones', n: 2, minutes: 6, topic: 'afirm',
          title: 'Afirmaciones',
          summary: 'Frases completas y formas cortas como I\'m y she\'s.',
          canSay: ["I'm hungry.", "She's twenty-five.", "They're from Peru."],
          screens: [
            {
              title: 'Una frase afirmativa',
              listen: ['I am Ana.', 'She is happy.', 'We are at home.', 'They are from Peru.'],
              text: 'Después de am, is o are va la información: quién eres, cómo estás, dónde estás o de dónde eres.',
              table: {
                head: ['Para decir', 'Ejemplo'],
                rows: [
                  ['Quién eres', 'I am Ana.'],
                  ['Cómo estás', 'She is happy.'],
                  ['Dónde estás', 'We are at home.'],
                  ['De dónde eres', 'They are from Peru.']
                ]
              }
            },
            {
              title: 'Con nombres y cosas',
              text: 'Piensa en el pronombre que reemplaza al nombre. Una sola persona o cosa va con is. Varias van con are.',
              note: 'La palabra you sirve para una persona (tú) o varias (ustedes) y siempre va con are.',
              table: {
                head: ['Dices', 'Piensas', 'Usas'],
                rows: [
                  ['Carlos', 'he', 'is'],
                  ['my phone', 'it', 'is'],
                  ['Ana and I', 'we', 'are'],
                  ['my shoes', 'they', 'are']
                ]
              },
              items: [
                { en: 'My phone is new.', es: 'Mi teléfono es nuevo.' },
                { en: 'My shoes are new.', es: 'Mis zapatos son nuevos.' }
              ]
            },
            {
              title: 'Las formas cortas',
              listen: ["I'm Ana.", "You're kind.", "He's tall.", "She's happy.", "It's cold.", "We're ready.", "They're at home."],
              text: "Al hablar usamos la forma corta. El apóstrofe (') ocupa el lugar de las letras que faltan.",
              table: {
                head: ['Completa', 'Corta'],
                rows: [
                  ['I am', "I'm"],
                  ['you are', "you're"],
                  ['he is', "he's"],
                  ['she is', "she's"],
                  ['it is', "it's"],
                  ['we are', "we're"],
                  ['they are', "they're"]
                ]
              },
              note: "Se escribe junto: I'm. La forma completa también es correcta, sobre todo al escribir con cuidado.",
              items: [
                { en: 'You are very kind.', es: 'Eres muy amable.' }
              ]
            },
            {
              title: 'Con hambre, frío o años: usa to be',
              listen: ['I am hungry.', 'I am cold.', 'I am afraid.', 'I am 25 years old.'],
              text: 'En español muchas veces decimos tener. En inglés estas ideas llevan to be.',
              compare: { wrong: 'I have hungry.', right: 'I am hungry.' },
              table: {
                head: ['Español', 'Inglés'],
                rows: [
                  ['Tengo hambre', 'I am hungry'],
                  ['Tengo frío', 'I am cold'],
                  ['Tengo miedo', 'I am afraid'],
                  ['Tengo 25 años', 'I am 25 (years old)']
                ]
              }
            }
          ],
          activities: [
            { id: 'l2-a1', type: 'choice', topic: 'afirm', q: 'My parents ___ at work.', options: ['is', 'are', 'am'], answer: 1,
              why: 'My parents son varias personas (they), así que usamos are.' },
            { id: 'l2-a2', type: 'choice', topic: 'afirm', q: 'The book ___ on the table.', options: ['are', 'am', 'is'], answer: 2,
              why: 'The book es una sola cosa (it), así que usamos is.' },
            { id: 'l2-a3', type: 'type', topic: 'afirm', q: 'Escribe la forma corta.', ex: "I am  →  I'm", source: 'she is →',
              accepted: ["she's"], show: "she's", why: "She is se acorta como she's: la i de is se reemplaza por el apóstrofe." },
            { id: 'l2-a4', type: 'type', topic: 'afirm', q: 'Escribe la forma corta.', ex: "I am  →  I'm", source: 'we are →',
              accepted: ["we're"], show: "we're", why: "We are se acorta como we're: la a de are se reemplaza por el apóstrofe." },
            { id: 'l2-a5', type: 'choice', topic: 'afirm', q: '¿Cómo se dice "Tengo hambre"?',
              options: ['I have hungry.', 'I am hungry.', 'I has hungry.'], answer: 1,
              why: 'Hambre, frío y miedo se dicen con to be: I am hungry.' },
            { id: 'l2-a6', type: 'order', topic: 'afirm', q: 'Ordena las palabras para formar una frase.',
              tokens: ['She', 'is', '25', 'years', 'old.'],
              why: 'La edad también se dice con to be: she is 25 years old.' },
            { id: 'l2-a7', type: 'error', topic: 'afirm', q: 'Una de estas frases tiene un error. Tócala.',
              options: ["He's a doctor.", "They's at home.", "It's cold."], wrong: 1, fix: "They're at home.",
              why: "They va con are, así que la forma corta es they're." },
            { id: 'l2-a8', type: 'write', topic: 'afirm', q: "Escribe una frase sobre ti con I am o I'm. Puedes decir tu nombre, de dónde eres o cómo estás.",
              example: "I'm Leo. I'm from Colombia.",
              checks: [
                { re: "\\b(i am|i'm)\\s+\\S+", flags: 'i', msg: "Usa I am o I'm y sigue con tu nombre, tu país o cómo estás. Por ejemplo: I'm Ana." },
                { re: "\\b(i am|i'm)\\b(?!\\s+not)", flags: 'i', msg: 'Escribe una frase afirmativa, sin not.' }
              ],
              why: 'Con I usamos am. Después puedes decir quién eres, de dónde eres o cómo estás.' }
          ]
        },

        /* ------------------------------------------------------------ 3 */
        {
          id: 'negaciones', n: 3, minutes: 5, topic: 'neg',
          title: 'Negaciones',
          summary: 'Cómo decir que no con not.',
          canSay: ["I'm not tired.", "She isn't here.", "We aren't late."],
          screens: [
            {
              title: 'Para decir que no, agrega not',
              listen: ['I am not tired.', 'She is not here.', 'They are not ready.'],
              text: 'Pon not justo después de am, is o are. No cambia nada más en la frase.',
              table: {
                head: ['Persona', 'Negación'],
                rows: [
                  ['I', 'I am not tired.'],
                  ['he · she · it', 'She is not here.'],
                  ['you · we · they', 'They are not ready.']
                ]
              }
            },
            {
              title: 'Las formas cortas de la negación',
              listen: ["I'm not tired.", "She isn't here.", "She's not here.", "They aren't ready.", "We're not ready."],
              text: 'Al hablar usamos formas cortas. Mira cuál va con cada persona.',
              table: {
                head: ['Persona', 'Forma corta'],
                rows: [
                  ['I', "I'm not"],
                  ['he · she · it', "isn't  (también: she's not)"],
                  ['you · we · they', "aren't  (también: we're not)"]
                ]
              },
              note: "Con I solo se dice I'm not. Nunca amn't."
            },
            {
              title: 'Cuidado con el español',
              text: 'En español el no va antes del verbo. En inglés not va después de am, is o are.',
              compare: { wrong: 'I no am ready.', right: 'I am not ready.' },
              items: [
                { en: "My brother isn't at home.", es: 'Mi hermano no está en casa.' },
                { en: "The shops aren't open.", es: 'Las tiendas no están abiertas.' }
              ]
            }
          ],
          activities: [
            { id: 'l3-a1', type: 'choice', topic: 'neg', q: 'He ___ at work today. (negativo)', options: ["aren't", "isn't", "doesn't"], answer: 1,
              wrongWhy: {"aren't": "Aren't va con you, we y they. He va con is.", "doesn't": "Doesn't no se usa con to be. Con to be solo cambia is por isn't."}, why: "He va con is, y en negativo es isn't. Doesn't no se usa con to be." },
            { id: 'l3-a2', type: 'choice', topic: 'neg', q: 'Quiero decir "No tengo hambre": I ___ hungry.', options: ['not am', 'am not', 'no am'], answer: 1,
              wrongWhy: {"not am": "Not va después del verbo, no antes.", "no am": "En inglés no usamos no antes del verbo. Usamos not después de am."}, why: 'Not va después del verbo: I am not hungry.' },
            { id: 'l3-a3', type: 'type', topic: 'neg', q: 'Escríbela en negativo.', ex: "He is tall.  →  He isn't tall.", source: 'They are ready.',
              accepted: ["they aren't ready", "they're not ready", "they are not ready"],
              show: "They aren't ready.", why: "Con they sirven they are not, they aren't y they're not. Todas están bien." },
            { id: 'l3-a4', type: 'type', topic: 'neg', q: 'Escríbela en negativo.', ex: "He is tall.  →  He isn't tall.", source: 'She is a nurse.',
              accepted: ["she isn't a nurse", "she is not a nurse", "she's not a nurse"],
              show: "She isn't a nurse.", why: "Agrega not después de is. Sirven she is not, she isn't y she's not." },
            { id: 'l3-a5', type: 'error', topic: 'neg', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['I no am tired.', "She isn't here.", "We aren't late."], wrong: 0, fix: 'I am not tired.',
              why: 'En inglés not va después de am.' },
            { id: 'l3-a6', type: 'order', topic: 'neg', q: 'Ordena las palabras para formar una frase.',
              tokens: ['We', 'are', 'not', 'in', 'the', 'office.'],
              why: 'Sujeto, are, not y luego el lugar.' },
            { id: 'l3-a7', type: 'choice', topic: 'neg', q: '¿Cómo se dice "Mi hermano no está en casa"?',
              options: ['My brother no is at home.', "My brother aren't at home.", "My brother isn't at home."], answer: 2,
              wrongWhy: {"My brother no is at home.": "En inglés not va después de is, no antes.", "My brother aren't at home.": "My brother es una persona (he). Aren't se usa con you, we y they."}, why: "My brother es una persona (he), así que usamos isn't." },
            { id: 'l3-a8', type: 'type', topic: 'neg', q: 'Escribe la forma corta de I am not.', ex: "she is not  →  she isn't", source: 'I am not →',
              accepted: ["i'm not"], show: "I'm not", why: "Con I solo existe I'm not. Amn't no existe." }
          ]
        },

        /* ------------------------------------------------------------ 4 */
        {
          id: 'preguntas', n: 4, minutes: 6, topic: 'preg',
          title: 'Preguntas',
          summary: 'Preguntar y responder en corto.',
          canSay: ['Are you ready?', 'Where are you from?', 'Yes, I am.'],
          screens: [
            {
              title: 'Para preguntar, cambia el orden',
              listen: ['You are ready.', 'Are you ready?', 'She is tired.', 'Is she tired?', 'I am late.', 'Am I late?'],
              text: 'Am, is o are pasa al inicio y el sujeto va después.',
              table: {
                head: ['Afirmación', 'Pregunta'],
                rows: [
                  ['You are ready.', 'Are you ready?'],
                  ['She is tired.', 'Is she tired?'],
                  ['I am late.', 'Am I late?']
                ]
              },
              note: 'En inglés el signo de pregunta va solo al final.'
            },
            {
              title: 'Respuestas cortas',
              listen: ["Are you ready?", "Yes, I am.", "No, I'm not.", "Is she a doctor?", "Yes, she is.", "No, she isn't.", "Are they here?", "Yes, they are.", "No, they aren't."],
              text: 'Contesta con yes o no y repite el verbo. En el sí no se usa la forma corta.',
              table: {
                head: ['Pregunta', 'Sí', 'No'],
                rows: [
                  ['Are you ready?', 'Yes, I am.', "No, I'm not."],
                  ['Is she a doctor?', 'Yes, she is.', "No, she isn't."],
                  ['Are they here?', 'Yes, they are.', "No, they aren't."]
                ]
              },
              note: "Se dice Yes, I am. Nunca Yes, I'm."
            },
            {
              title: 'Preguntas con what, where, who y how',
              listen: ['What is your name?', 'Where are you from?', 'Who is she?', 'How are you?'],
              text: 'Primero la palabra de pregunta, luego is o are, luego el sujeto.',
              table: {
                head: ['Palabra', 'Ejemplo'],
                rows: [
                  ['what (qué)', 'What is your name?'],
                  ['where (dónde)', 'Where are you from?'],
                  ['who (quién)', 'Who is she?'],
                  ['how (cómo)', 'How are you?']
                ]
              },
              note: "Con is se acorta mucho: What's your name? Where's the bank? Con are casi no se acorta al escribir."
            },
            {
              title: 'Responde con el mismo verbo',
              listen: ['Are you ready?', 'How old is your sister?', 'Am I late?'],
              text: 'Si te preguntan con are, contestas con are. Si te preguntan con is, contestas con is.',
              compare: { wrong: 'Is you ready?', right: 'Are you ready?' },
              note: 'You siempre va con are, también en preguntas. Por eso es Are you, nunca Is you.',
              items: [
                { en: 'How old is your sister?', es: '¿Cuántos años tiene tu hermana?' },
                { en: 'Am I late?', es: '¿Voy tarde?' }
              ]
            }
          ],
          activities: [
            { id: 'l4-a1', type: 'choice', topic: 'preg', q: '___ you from Chile?', options: ['Is', 'Are', 'Am'], answer: 1,
              why: 'Con you usamos are, también al preguntar.' },
            { id: 'l4-a2', type: 'order', topic: 'preg', q: 'Ordena las palabras para formar una pregunta.',
              tokens: ['Is', 'your', 'brother', 'at', 'home?'],
              why: 'Is va primero, luego el sujeto.' },
            { id: 'l4-a3', type: 'type', topic: 'preg', q: 'Conviértela en pregunta.', ex: "He is happy.  →  Is he happy?", source: 'They are tired.',
              accepted: ['are they tired', 'are they tired?'], show: 'Are they tired?',
              why: 'Pasa are al inicio: Are they tired?' },
            { id: 'l4-a4', type: 'choice', topic: 'preg', q: 'Is she a doctor? Yes, ___.', options: ["she's", 'she am', 'she is'], answer: 2,
              wrongWhy: {"she's": "En una respuesta corta afirmativa no se acorta. Se dice Yes, she is.", "she am": "Am solo va con I. Con she usamos is."}, why: "En una respuesta corta afirmativa no se usa la forma corta: Yes, she is." },
            { id: 'l4-a5', type: 'choice', topic: 'preg', q: 'Are they at school? No, ___.', options: ["they aren't", 'they not', "they don't"], answer: 0,
              wrongWhy: {"they not": "No basta con not. Repite el verbo: aren't.", "they don't": "Don't no se usa con to be. Repite el verbo de la pregunta: aren't."}, why: "En el no, repites el verbo con n't: No, they aren't." },
            { id: 'l4-a6', type: 'choice', topic: 'preg', q: 'Where ___ your keys?', options: ['is', 'are', 'am'], answer: 1,
              why: 'Your keys son varias cosas (they), así que usamos are.' },
            { id: 'l4-a7', type: 'type', topic: 'preg', q: 'Completa la pregunta.', ex: "___ you happy?  →  Are", source: 'How old ___ you?',
              accepted: ['are'], show: 'are', why: 'Con you se usa are: How old are you?' },
            { id: 'l4-a8', type: 'match', topic: 'preg', q: 'Relaciona cada palabra de pregunta con su significado.',
              pairs: [['what', 'qué'], ['where', 'dónde'], ['who', 'quién'], ['how', 'cómo']],
              why: 'What, where, who y how van al inicio de la pregunta.' },
            { id: 'l4-a9', type: 'error', topic: 'preg', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['Is you ready?', 'Are they here?', 'Am I late?'], wrong: 0, fix: 'Are you ready?',
              why: 'You siempre va con are.' }
          ]
        },

        /* ------------------------------------------------------------ 5 */
        {
          id: 'vida-real', n: 5, minutes: 6, topic: 'vida',
          title: 'To be en la vida real',
          summary: 'Presentarte, preguntar y responder en una conversación.',
          canSay: ["Hi! I'm Sofia.", "Where's the bathroom?", "I'm not a student, I'm an engineer."],
          screens: [
            {
              title: 'Una presentación completa',
              listen: [{"t": "Hi! I'm Sofia. What's your name?", "v": "f"}, {"t": "I'm Daniel. Nice to meet you.", "v": "m"}, {"t": "Where are you from?", "v": "f"}, {"t": "I'm from Peru. And you?", "v": "m"}, {"t": "I'm from Chile. Are you a student?", "v": "f"}, {"t": "No, I'm not. I'm an engineer.", "v": "m"}],
              text: 'Mira cómo dos personas usan to be en una conversación real.',
              table: {
                head: ['Frase', 'Significado'],
                rows: [
                  ["Hi! I'm Sofia. What's your name?", '¡Hola! Soy Sofía. ¿Cómo te llamas?'],
                  ["I'm Daniel. Nice to meet you.", 'Soy Daniel. Mucho gusto.'],
                  ['Where are you from?', '¿De dónde eres?'],
                  ["I'm from Peru. And you?", 'Soy de Perú. ¿Y tú?'],
                  ["I'm from Chile. Are you a student?", 'Soy de Chile. ¿Eres estudiante?'],
                  ["No, I'm not. I'm an engineer.", 'No. Soy ingeniero.']
                ]
              },
              note: "Fíjate: las preguntas usan is y are. Cuando hablas de ti, respondes con I'm."
            },
            {
              title: 'Frases que usarás cada día',
              listen: ["How are you?", "I'm fine, thanks.", "She's a teacher.", "We're Colombian.", "I'm tired.", "Where's the bathroom?"],
              text: 'Con to be puedes hablar de casi todo lo básico.',
              table: {
                head: ['Para...', 'Di...'],
                rows: [
                  ['Saludar', "How are you? I'm fine, thanks."],
                  ['Decir tu trabajo', "She's a teacher."],
                  ['Decir tu nacionalidad', "We're Colombian."],
                  ['Decir cómo te sientes', "I'm tired."],
                  ['Preguntar por un lugar', "Where's the bathroom?"]
                ]
              }
            },
            {
              title: 'Resumen del curso',
              text: 'Estas son las tres formas que ya dominas.',
              table: {
                head: ['Persona', 'Afirmar', 'Negar', 'Preguntar'],
                rows: [
                  ['I', 'I am', "I'm not", 'Am I...?'],
                  ['he · she · it', 'is', "isn't", 'Is...?'],
                  ['you · we · they', 'are', "aren't", 'Are...?']
                ]
              },
              note: 'Si dudas, piensa primero en el pronombre y después elige am, is o are.'
            }
          ],
          activities: [
            { id: 'l5-a1', type: 'choice', topic: 'vida', q: 'A: Where are you from? B: ___ from Spain.', options: ["I'm", "He's", 'Is'], answer: 0,
              why: "Respondes sobre ti, así que usas I'm." },
            { id: 'l5-a2', type: 'choice', topic: 'vida', q: 'A: Is Ana at home? B: No, ___. She is at work.', options: ["she isn't", "she aren't", "she's not is"], answer: 0,
              wrongWhy: {"she aren't": "Ana es she, así que no va con aren't. Va con isn't.", "she's not is": "Esa forma mezcla dos veces el verbo. Con she sirve isn't."}, why: "Ana es she. Respuesta corta negativa: No, she isn't." },
            { id: 'l5-a3', type: 'order', topic: 'vida', q: 'Ordena las palabras para formar una pregunta.',
              tokens: ['Where', 'is', 'the', 'bathroom?'],
              why: 'Palabra de pregunta, is, y luego el sujeto.' },
            { id: 'l5-a4', type: 'type', topic: 'vida', q: 'Completa con am, is o are.', ex: "He ___ happy.  →  is", source: 'My neighbors ___ very friendly.',
              accepted: ['are'], show: 'are', why: 'My neighbors son varias personas (they), así que usamos are.' },
            { id: 'l5-a5', type: 'error', topic: 'vida', q: 'Una de estas frases tiene un error. Tócala.',
              options: ["She's from Italy.", "I'm not a teacher.", 'Where is you from?'], wrong: 2, fix: 'Where are you from?',
              why: 'Con you se usa are: Where are you from?' },
            { id: 'l5-a6', type: 'type', topic: 'vida', q: 'Escribe la pregunta.', ex: "He is happy.  →  Is he happy?", source: 'He is your boss.',
              accepted: ['is he your boss', 'is he your boss?'], show: 'Is he your boss?',
              why: 'Pasa is al inicio: Is he your boss?' },
            { id: 'l5-a7', type: 'choice', topic: 'vida', q: "It's very hot today. I ___ thirsty.", options: ['have', 'am', 'is'], answer: 1,
              why: 'Sed se dice con to be: I am thirsty.' },
            { id: 'l5-a8', type: 'write', topic: 'vida', q: 'Escribe dos frases sobre ti: una afirmativa y una negativa.',
              example: "I'm a student. I'm not tired.",
              checks: [
                { re: "\\b(i am|i'm)\\s+(?!not\\b)\\w+", flags: 'i', msg: "Falta una frase afirmativa con I am o I'm. Por ejemplo: I'm a student." },
                { re: "\\b(i am not|i'm not)\\b", flags: 'i', msg: "Falta una frase negativa con I'm not. Por ejemplo: I'm not tired." }
              ],
              why: "Una afirmativa usa I'm y una negativa usa I'm not." }
          ]
        }
      ],

      /* ---------------------------------------------------------- Evaluación */
      exam: {
        id: 'to-be-final', n: 6,
        title: 'Evaluación final (práctica)',
        bank: [
          /* forma */
          { id: 'x-f1', type: 'choice', topic: 'forma', q: 'My cousin ___ a pilot.', options: ['are', 'is', 'am'], answer: 1, why: 'My cousin es una persona (he): is.' },
          { id: 'x-f2', type: 'choice', topic: 'forma', q: 'You and I ___ neighbors.', options: ['are', 'is', 'am'], answer: 0, why: 'You and I equivale a we: are.' },
          { id: 'x-f3', type: 'choice', topic: 'forma', q: 'I ___ a little nervous.', options: ['is', 'am', 'are'], answer: 1, why: 'Con I siempre usamos am.' },
          { id: 'x-f4', type: 'choice', topic: 'forma', q: 'The windows ___ open.', options: ['is', 'am', 'are'], answer: 2, why: 'The windows son varias cosas (they): are.' },
          { id: 'x-f5', type: 'error', topic: 'forma', q: 'Una de estas frases tiene un error. Tócala.', options: ['Mario is Italian.', 'My friends is here.', 'I am ready.'], wrong: 1, fix: 'My friends are here.', why: 'My friends son varias personas: are.' },
          { id: 'x-f6', type: 'type', topic: 'forma', q: 'Completa con am, is o are.', ex: "He ___ happy.  →  is", source: 'It ___ a beautiful day.', accepted: ['is'], show: 'is', why: 'It va con is.' },
          /* afirm */
          { id: 'x-a1', type: 'type', topic: 'afirm', q: 'Escribe la forma corta.', ex: "I am  →  I'm", source: 'you are →', accepted: ["you're"], show: "you're", why: "You are se acorta como you're." },
          { id: 'x-a2', type: 'choice', topic: 'afirm', q: '¿Cómo se dice "Tengo sed"?', options: ['I have thirsty.', 'I am thirsty.', 'I has thirst.'], answer: 1, why: 'Sed se dice con to be: I am thirsty.' },
          { id: 'x-a3', type: 'choice', topic: 'afirm', q: '¿Qué pronombre reemplaza a "the children"?', options: ['he', 'it', 'they'], answer: 2, why: 'The children son varias personas: they.' },
          { id: 'x-a4', type: 'order', topic: 'afirm', q: 'Ordena las palabras para formar una frase.', tokens: ['My', 'keys', 'are', 'on', 'the', 'table.'], why: 'My keys son varias cosas, así que usamos are.' },
          { id: 'x-a5', type: 'error', topic: 'afirm', q: 'Una de estas frases tiene un error. Tócala.', options: ["He's 40 years old.", "She's tired.", "We's late."], wrong: 2, fix: "We're late.", why: "We are se acorta como we're." },
          { id: 'x-a6', type: 'choice', topic: 'afirm', q: '¿Cómo se dice "Tengo 18 años"?', options: ['I have 18.', 'I am have 18.', 'I am 18.'], answer: 2, why: 'La edad se dice con to be: I am 18.' },
          /* neg */
          { id: 'x-n1', type: 'choice', topic: 'neg', q: 'We ___ late. (negativo)', options: ["isn't", "aren't", "amn't"], answer: 1, wrongWhy: {"isn't": "Isn't va con he, she e it. We va con aren't.", "amn't": "Amn't no existe en inglés estándar."}, why: "We va con are: aren't." },
          { id: 'x-n2', type: 'type', topic: 'neg', q: 'Escríbela en negativo.', ex: "He is tall.  →  He isn't tall.", source: 'It is open.', accepted: ["it isn't open", "it is not open", "it's not open"], show: "It isn't open.", why: "Agrega not después de is." },
          { id: 'x-n3', type: 'error', topic: 'neg', q: 'Una de estas frases tiene un error. Tócala.', options: ['She not is here.', "He isn't ready.", "I'm not hungry."], wrong: 0, fix: 'She is not here.', why: 'Not va después de is.' },
          { id: 'x-n4', type: 'type', topic: 'neg', q: 'Escribe la forma corta negativa.', ex: "she is not  →  she isn't", source: 'you are not →', accepted: ["you aren't", "you're not", "you are not"], show: "you aren't", why: "Con you sirven you aren't y you're not." },
          { id: 'x-n5', type: 'order', topic: 'neg', q: 'Ordena las palabras para formar una frase.', tokens: ['They', 'are', 'not', 'from', 'Brazil.'], why: 'Sujeto, are, not y luego el origen.' },
          { id: 'x-n6', type: 'choice', topic: 'neg', q: '¿Cómo se dice "No estoy cansado"?', options: ["I amn't tired.", "I'm not tired.", 'I no tired.'], answer: 1, wrongWhy: {"I amn't tired.": "Amn't no existe en inglés estándar. Con I se dice I'm not.", "I no tired.": "Falta el verbo. En inglés se dice I'm not tired."}, why: "Con I la negación es I'm not." },
          /* preg */
          { id: 'x-p1', type: 'type', topic: 'preg', q: 'Conviértela en pregunta.', ex: "He is happy.  →  Is he happy?", source: 'She is your teacher.', accepted: ['is she your teacher', 'is she your teacher?'], show: 'Is she your teacher?', why: 'Pasa is al inicio.' },
          { id: 'x-p2', type: 'choice', topic: 'preg', q: 'Is Tom at work? No, ___.', options: ["he isn't", 'he not', "he don't"], answer: 0, wrongWhy: {"he not": "No basta con not. Repite el verbo: isn't.", "he don't": "Don't no se usa con to be. Repite el verbo de la pregunta: isn't."}, why: "Respuesta corta negativa: No, he isn't." },
          { id: 'x-p3', type: 'choice', topic: 'preg', q: '___ old are you?', options: ['What', 'How', 'Who'], answer: 1, why: 'How old are you? es la pregunta por la edad.' },
          { id: 'x-p4', type: 'order', topic: 'preg', q: 'Ordena las palabras para formar una pregunta.', tokens: ['Am', 'I', 'late?'], why: 'Am va primero en la pregunta.' },
          { id: 'x-p5', type: 'error', topic: 'preg', q: 'Una de estas frases tiene un error. Tócala.', options: ['Are you tired?', 'Is your parents at home?', 'Where is she?'], wrong: 1, fix: 'Are your parents at home?', why: 'Your parents son varias personas: are.' },
          { id: 'x-p6', type: 'choice', topic: 'preg', q: 'Are you a student? Yes, ___.', options: ["I'm", 'I am', 'I is'], answer: 1, wrongWhy: {"I'm": "En una respuesta corta afirmativa no se acorta. Se dice Yes, I am.", "I is": "Is no va con I. Con I usamos am."}, why: "En una respuesta corta afirmativa no se acorta: Yes, I am." },
          /* vida */
          { id: 'x-v1', type: 'choice', topic: 'vida', q: 'Nice to meet you. ___ Carla.', options: ["I'm", "He's", "You're"], answer: 0, why: "Hablas de ti: I'm Carla." },
          { id: 'x-v2', type: 'choice', topic: 'vida', q: 'How ___ you today?', options: ['is', 'am', 'are'], answer: 2, why: 'How are you? Con you usamos are.' },
          { id: 'x-v3', type: 'type', topic: 'vida', q: 'Completa con am, is o are.', ex: "He ___ happy.  →  is", source: 'Where ___ the keys?', accepted: ['are'], show: 'are', why: 'The keys son varias cosas: are.' },
          { id: 'x-v4', type: 'error', topic: 'vida', q: 'Una de estas frases tiene un error. Tócala.', options: ["She's a nurse.", "They're from Japan.", "I'm have a car."], wrong: 2, fix: 'I have a car.', why: "Con have no se usa to be: I have a car." },
          { id: 'x-v5', type: 'type', topic: 'vida', q: 'Escribe la pregunta.', ex: "He is happy.  →  Is he happy?", source: 'You are ready.', accepted: ['are you ready', 'are you ready?'], show: 'Are you ready?', why: 'Pasa are al inicio.' },
          { id: 'x-v6', type: 'choice', topic: 'vida', q: 'A: Is he your brother? B: ___ He is my cousin.', options: ["No, he isn't.", 'Yes, he is.', "No, he aren't."], answer: 0, wrongWhy: {"No, he aren't.": "He es una persona. Aren't se usa con you, we y they.", "Yes, he is.": "Es tu primo, no tu hermano. La respuesta es no."}, why: 'Es tu primo, así que la respuesta es No, he isn\'t.' }
        ]
      },

      /* ---------------------------------------------------------- Demostración gratuita
         Una sola vez por cuenta. Cuesta 3 ejercicios del limite diario gratis (el servidor lo cobra).
         Las frases ya tienen audio publicado; los ids d1..d3 deben coincidir con academia_courses.demo_items. */
      demo: {
        title: 'Prueba TO BE gratis',
        intro: 'Una prueba corta: una explicación y tres ejercicios.',
        screen: {
          title: 'Am, is y are: ser o estar',
          text: 'En inglés, ser y estar se dicen igual: to be. Solo cambia según quién habla.',
          chips: [
            { a: 'I', b: 'am' },
            { a: 'he · she · it', b: 'is' },
            { a: 'you · we · they', b: 'are' }
          ],
          audio: 'audio/aprender/to-be/exp-01.mp3'
        },
        activities: [
          { id: 'd1', type: 'choice', topic: 'forma', q: 'I ___ Ana.', options: ['am', 'is', 'are'], answer: 0,
            why: 'Con I siempre usamos am: I am.' },
          { id: 'd2', type: 'choice', topic: 'forma', q: 'She ___ happy.', options: ['am', 'is', 'are'], answer: 1,
            why: 'She es una sola persona, así que va con is.' },
          { id: 'd3', type: 'choice', topic: 'forma', q: 'They ___ from Peru.', options: ['is', 'am', 'are'], answer: 2,
            why: 'They son varias personas, así que va con are.' }
        ]
      }
    },

    'pronombres': {
      id: 'pronombres',
      title: 'Pronombres personales',
      name: 'Pronombres personales',
      short: 'I, you, he, she, it, we, they',
      tagline: 'Aprende a decir quién eres tú, quién es otra persona y quiénes son varios.',
      goal: 'Al terminar podrás elegir el pronombre correcto, cambiar nombres por pronombres y armar frases básicas sobre ti y sobre otras personas.',
      topics: {
        yotu: 'I y you',
        hesheit: 'He, she e it',
        plural: 'We, they y you en plural',
        sustituir: 'Cambiar nombres por pronombres',
        vida: 'Pronombres en situaciones reales'
      },

      lessons: [
        /* ------------------------------------------------------------ 1 */
        {
          id: 'i-you', n: 1, minutes: 5, topic: 'yotu',
          title: 'I y you',
          summary: 'Hablar de ti y hablar con otra persona.',
          canSay: ['I am Ana.', 'You are my friend.', 'I am at home.'],
          screens: [
            {
              title: 'Los siete pronombres',
              text: 'Un pronombre personal reemplaza a la persona o la cosa que hace algo. En inglés hay siete. Aquí vemos los que van al inicio de la frase.',
              chips: [
                { a: 'yo', b: 'I' },
                { a: 'tú · usted', b: 'you' },
                { a: 'él', b: 'he' },
                { a: 'ella', b: 'she' },
                { a: 'cosa · clima', b: 'it' },
                { a: 'nosotros', b: 'we' },
                { a: 'ellos · ellas', b: 'they' }
              ],
              listen: ['I', 'you', 'he', 'she', 'it', 'we', 'they']
            },
            {
              title: 'I: yo',
              text: 'I significa yo y siempre se escribe con mayúscula. En español puedes decir solo "Soy Ana". En inglés casi siempre se dice el pronombre.',
              compare: { wrong: 'Am Ana.', right: 'I am Ana.' },
              items: [
                { en: 'I am Ana.', es: 'Yo soy Ana.' },
                { en: 'I am at home.', es: 'Estoy en casa.' },
                { en: 'I am tired.', es: 'Estoy cansado.' }
              ]
            },
            {
              title: 'You: tú o usted',
              text: 'You significa tú y también usted. En inglés no hay una palabra distinta para hablar con más respeto: you sirve para las dos.',
              items: [
                { en: 'You are my friend.', es: 'Tú eres mi amigo.' },
                { en: 'You are very kind.', es: 'Usted es muy amable.' }
              ]
            },
            {
              title: 'I habla de mí, you habla contigo',
              text: 'Para cambiar de persona, solo cambia el pronombre. Lo demás se queda igual.',
              change: { a: { label: 'Hablo de mí', text: 'I am tired.', es: 'Estoy cansado.' }, b: { label: 'Hablo con otra persona', text: 'You are tired.', es: 'Estás cansado.' } },
              listen: ['I am tired.', 'You are tired.'],
              note: 'En la lección 3 verás que you también sirve para hablar con varias personas.'
            }
          ],
          activities: [
            { id: 'l1-a1', type: 'choice', topic: 'yotu', q: '___ am Ana.', options: ['I', 'You', 'He'], answer: 0,
              why: 'Hablas de ti, así que usas I (yo): I am Ana.' },
            { id: 'l1-a2', type: 'choice', say: 'You are kind.', topic: 'yotu', q: 'Le hablas a tu amigo: ___ are kind.', options: ['I', 'You', 'She'], answer: 1,
              why: 'Hablas con tu amigo, así que usas you: You are kind.' },
            { id: 'l1-a3', type: 'choice', topic: 'yotu', q: '¿Cómo se dice "Yo estoy cansado"?',
              options: ['I am tired.', 'You am tired.', 'Am tired.'], answer: 0,
              wrongWhy: { 'You am tired.': 'You significa tú. Para decir yo se usa I.', 'Am tired.': 'Falta el pronombre. En inglés se dice I am tired.' },
              why: 'Yo se dice I, y no se omite: I am tired.' },
            { id: 'l1-a4', type: 'match', topic: 'yotu', q: 'Relaciona cada frase con su traducción.',
              pairs: [['Yo soy Ana.', 'I am Ana.'], ['Tú eres Ana.', 'You are Ana.'], ['Yo estoy en casa.', 'I am at home.']],
              why: 'Yo se dice I y tú se dice you.' },
            { id: 'l1-a5', type: 'type', topic: 'yotu', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: '___ are my friend.',
              accepted: ['you'], show: 'you', why: 'Hablas con tu amigo, así que usas you.' },
            { id: 'l1-a6', type: 'error', topic: 'yotu', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['I am a teacher.', 'You are very kind.', 'Am at home.'], wrong: 2, fix: 'I am at home.',
              why: 'Falta el pronombre. En inglés no se dice "Am at home", se dice I am at home.' },
            { id: 'l1-a7', type: 'order', topic: 'yotu', q: 'Ordena las palabras para formar una frase.',
              tokens: ['I', 'am', 'at', 'home.'],
              why: 'Primero el pronombre I, luego am y luego dónde estás.' },
            { id: 'l1-a8', type: 'write', topic: 'yotu', q: 'Escribe una frase sobre ti que empiece con I. Puedes decir tu nombre o cómo estás.',
              example: 'I am Ana. I am happy.',
              checks: [
                { re: '(^|[.!?]\\s*)(I\\s+\\S+|I.m\\s+\\S+)', msg: 'Empieza con I, con mayúscula, y sigue con am o con lo que quieras decir. Por ejemplo: I am Ana.' }
              ],
              why: 'Para hablar de ti empiezas con I, siempre con mayúscula.' }
          ]
        },

        /* ------------------------------------------------------------ 2 */
        {
          id: 'he-she-it', n: 2, minutes: 5, topic: 'hesheit',
          title: 'He, she e it',
          summary: 'Hablar de un hombre, una mujer o una cosa.',
          canSay: ['He is my brother.', 'She is a nurse.', 'It is cold today.'],
          screens: [
            {
              title: 'He y she: una persona',
              text: 'He es él y she es ella. Los dos se usan para una sola persona. Elige según sea hombre o mujer.',
              chips: [
                { a: 'él', b: 'he' },
                { a: 'ella', b: 'she' }
              ],
              items: [
                { en: 'He is my brother.', es: 'Él es mi hermano.' },
                { en: 'She is my sister.', es: 'Ella es mi hermana.' }
              ]
            },
            {
              title: 'It: una cosa, el clima o la hora',
              text: 'It se usa para una cosa, para el clima, para la hora y para hablar de una situación. Para una persona que conoces, usa he o she.',
              table: {
                head: ['Hablo de', 'Digo'],
                rows: [
                  ['Una cosa: the phone', 'It is new.'],
                  ['El clima', 'It is cold.'],
                  ['La hora', "It is 5 o'clock."]
                ]
              },
              items: [
                { en: 'It is new.', es: 'Es nuevo.' },
                { en: 'It is cold.', es: 'Hace frío.' },
                { en: "It is 5 o'clock.", es: 'Son las cinco.' }
              ],
              note: 'Con los animales también se usa it. Si es tu mascota y sabes si es macho o hembra, muchas personas dicen he o she.'
            },
            {
              title: 'Elige: he, she o it',
              text: 'Piensa en quién o qué es, no en cómo suena la palabra.',
              table: {
                head: ['Dices', 'Usas'],
                rows: [
                  ['Carlos', 'he'],
                  ['Ana', 'she'],
                  ['my mother', 'she'],
                  ['the table', 'it'],
                  ['the weather', 'it']
                ]
              }
            },
            {
              title: 'En inglés no se omite el sujeto',
              text: 'En español dices "Hace frío" sin decir quién. En inglés necesitas it.',
              compare: { wrong: 'Is cold.', right: 'It is cold.' },
              items: [
                { en: 'It is cold today.', es: 'Hoy hace frío.' },
                { en: 'She is tired.', es: 'Ella está cansada.' }
              ]
            }
          ],
          activities: [
            { id: 'l2-a1', type: 'choice', topic: 'hesheit', q: 'My brother is tall. ___ is 18.', options: ['He', 'She', 'It'], answer: 0,
              why: 'My brother es un hombre, así que usamos he.' },
            { id: 'l2-a2', type: 'choice', topic: 'hesheit', q: 'Ana is my friend. ___ is kind.', options: ['He', 'She', 'It'], answer: 1,
              why: 'Ana es una mujer, así que usamos she.' },
            { id: 'l2-a3', type: 'choice', topic: 'hesheit', q: 'The phone is new. ___ is blue.', options: ['He', 'She', 'It'], answer: 2,
              why: 'The phone es una cosa, así que usamos it.' },
            { id: 'l2-a4', type: 'choice', say: 'It is sunny.', topic: 'hesheit', q: 'Hablas del clima: ___ is sunny.', options: ['She', 'It', 'He'], answer: 1,
              why: 'Para hablar del clima usamos it: It is sunny.' },
            { id: 'l2-a5', type: 'match', topic: 'hesheit', q: 'Relaciona cada palabra con su pronombre.',
              pairs: [['Mi padre', 'he'], ['Mi hermana', 'she'], ['La mesa', 'it']],
              why: 'Un hombre es he, una mujer es she y una cosa es it.' },
            { id: 'l2-a6', type: 'type', topic: 'hesheit', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: 'Carlos is my friend. ___ is from Peru.',
              accepted: ['he'], show: 'he', why: 'Carlos es un hombre, así que usamos he.' },
            { id: 'l2-a7', type: 'error', topic: 'hesheit', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['She is my sister.', 'Is very cold.', 'He is my teacher.'], wrong: 1, fix: 'It is very cold.',
              why: 'Falta el pronombre. Para el clima se dice It is very cold.' },
            { id: 'l2-a8', type: 'order', topic: 'hesheit', q: 'Ordena las palabras para formar una frase.',
              tokens: ['It', 'is', 'very', 'cold', 'today.'],
              why: 'Primero it, luego is y luego la información.' }
          ]
        },

        /* ------------------------------------------------------------ 3 */
        {
          id: 'we-they-you', n: 3, minutes: 5, topic: 'plural',
          title: 'We, they y you en plural',
          summary: 'Hablar de varias personas o cosas.',
          canSay: ['We are friends.', 'They are my parents.', 'You are my friends.'],
          screens: [
            {
              title: 'We: nosotros',
              text: 'We significa nosotros o nosotras. Lo usas cuando tú estás dentro del grupo.',
              table: {
                head: ['Dices', 'Usas'],
                rows: [
                  ['Ana and I', 'we'],
                  ['My friend and I', 'we'],
                  ['You and I', 'we']
                ]
              },
              items: [
                { en: 'We are friends.', es: 'Somos amigos.' },
                { en: 'We are at school.', es: 'Estamos en la escuela.' }
              ]
            },
            {
              title: 'They: ellos o ellas',
              text: 'They sirve para varias personas o varias cosas. No distingue entre ellos y ellas.',
              table: {
                head: ['Dices', 'Usas'],
                rows: [
                  ['Carlos and Ana', 'they'],
                  ['my shoes', 'they'],
                  ['the keys', 'they']
                ]
              },
              items: [
                { en: 'They are my parents.', es: 'Ellos son mis padres.' },
                { en: 'They are new.', es: 'Son nuevos.' }
              ]
            },
            {
              title: 'You también es plural',
              text: 'You significa tú, usted y también ustedes. Si hablas con varias personas, sigue siendo you.',
              items: [
                { en: 'You are my friend.', es: 'Tú eres mi amigo.' },
                { en: 'You are my friends.', es: 'Ustedes son mis amigos.' }
              ],
              note: 'En inglés no hay una palabra especial para ustedes. Se entiende por el contexto.'
            },
            {
              title: 'El mapa completo',
              text: 'A la izquierda, una persona o cosa. A la derecha, varias. Fíjate en que you no cambia.',
              table: {
                head: ['Una', 'Varias'],
                rows: [
                  ['I', 'we'],
                  ['you', 'you'],
                  ['he · she · it', 'they']
                ]
              }
            }
          ],
          activities: [
            { id: 'l3-a1', type: 'choice', topic: 'plural', q: 'My friend and I are students. ___ are in class.', options: ['We', 'They', 'It'], answer: 0,
              why: 'My friend and I incluye a quien habla, así que usamos we.' },
            { id: 'l3-a2', type: 'choice', topic: 'plural', q: 'Carlos and Ana are my cousins. ___ are tall.', options: ['We', 'They', 'He'], answer: 1,
              why: 'Carlos and Ana son varias personas, así que usamos they.' },
            { id: 'l3-a3', type: 'choice', topic: 'plural', q: 'My keys are on the table. ___ are small.', options: ['It', 'He', 'They'], answer: 2,
              why: 'My keys son varias cosas, así que usamos they.' },
            { id: 'l3-a4', type: 'choice', topic: 'plural', q: '¿Cómo se dice "Ustedes son mis amigos"?',
              options: ['You are my friends.', 'They are my friends.', 'Ustedes are my friends.'], answer: 0,
              wrongWhy: { 'They are my friends.': 'They significa ellos. Si hablas con ellos, se usa you.', 'Ustedes are my friends.': 'Ustedes no existe en inglés. Se usa you.' },
              why: 'Para hablar con varias personas se usa you.' },
            { id: 'l3-a5', type: 'match', topic: 'plural', q: 'Relaciona cada palabra con su pronombre.',
              pairs: [['nosotros', 'we'], ['ellos o ellas', 'they'], ['tú, usted o ustedes', 'you']],
              why: 'Nosotros es we, ellos o ellas es they y you sirve para tú, usted y ustedes.' },
            { id: 'l3-a6', type: 'type', topic: 'plural', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: 'Tom and I are neighbors. ___ are friends.',
              accepted: ['we'], show: 'we', why: 'Tom and I incluye a quien habla, así que usamos we.' },
            { id: 'l3-a7', type: 'error', topic: 'plural', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['They are my parents.', 'We are at home.', 'It are my shoes.'], wrong: 2, fix: 'They are my shoes.',
              why: 'My shoes son varias cosas, así que usamos they, no it.' },
            { id: 'l3-a8', type: 'order', topic: 'plural', q: 'Ordena las palabras para formar una frase.',
              tokens: ['They', 'are', 'my', 'cousins.'],
              why: 'Primero they, luego are y luego quiénes son.' }
          ]
        },

        /* ------------------------------------------------------------ 4 */
        {
          id: 'cambiar-nombres', n: 4, minutes: 6, topic: 'sustituir',
          title: 'Cambiar nombres por pronombres',
          summary: 'Elegir el pronombre y armar frases completas.',
          canSay: ['She is a doctor.', 'We are at school.', 'They are new.'],
          screens: [
            {
              title: 'Para no repetir el nombre',
              text: 'Un pronombre evita repetir el nombre una y otra vez. Compara.',
              change: { a: { label: 'Repite el nombre', text: 'Ana is tired. Ana is hungry.', es: 'Ana está cansada. Ana tiene hambre.' }, b: { label: 'Con pronombre', text: 'Ana is tired. She is hungry.', es: 'Ana está cansada. Ella tiene hambre.' } },
              listen: ['Ana is tired. Ana is hungry.', 'Ana is tired. She is hungry.']
            },
            {
              title: 'Cómo elegir el pronombre',
              text: 'Primero pregunta: ¿es una persona o son varias? Si es una sola, pregunta: ¿es un hombre, una mujer o una cosa?',
              table: {
                head: ['Hablo de', 'Uso'],
                rows: [
                  ['Un hombre', 'he'],
                  ['Una mujer', 'she'],
                  ['Una cosa, el clima o la hora', 'it'],
                  ['Yo y otras personas', 'we'],
                  ['Varias personas o cosas', 'they']
                ]
              }
            },
            {
              title: 'Cambia el nombre',
              text: 'Solo se reemplaza el sujeto, que es lo que va antes del verbo. El resto de la frase se queda igual.',
              table: {
                head: ['Dices', 'Usas'],
                rows: [
                  ['Mr. Smith', 'he'],
                  ['Ms. Brown', 'she'],
                  ['the car', 'it'],
                  ['Tom and Ana', 'they'],
                  ['my sister and I', 'we']
                ]
              },
              items: [
                { en: 'My sister is at work. She is tired.', es: 'Mi hermana está en el trabajo. Está cansada.' },
                { en: 'The car is new. It is red.', es: 'El carro es nuevo. Es rojo.' }
              ]
            },
            {
              title: 'Una frase básica',
              text: 'Primero quién, luego am, is o are, y al final la información. Estos verbos los practicas en el curso TO BE.',
              table: {
                head: ['Pronombre', 'Verbo', 'Información'],
                rows: [
                  ['I', 'am', 'ready.'],
                  ['She', 'is', 'a doctor.'],
                  ['It', 'is', 'cold.'],
                  ['We', 'are', 'at school.']
                ]
              },
              listen: ['I am ready.', 'She is a doctor.', 'It is cold.', 'We are at school.']
            }
          ],
          activities: [
            { id: 'l4-a1', type: 'choice', topic: 'sustituir', q: 'Mr. Smith is my teacher. ___ is kind.', options: ['He', 'She', 'They'], answer: 0,
              why: 'Mr. Smith es un hombre, así que usamos he.' },
            { id: 'l4-a2', type: 'choice', topic: 'sustituir', q: 'My sister and I are at the park. ___ are happy.', options: ['They', 'We', 'She'], answer: 1,
              why: 'My sister and I incluye a quien habla, así que usamos we.' },
            { id: 'l4-a3', type: 'choice', topic: 'sustituir', q: '¿Qué pronombre reemplaza a "the windows"?', options: ['it', 'they', 'we'], answer: 1,
              why: 'The windows son varias cosas, así que usamos they.' },
            { id: 'l4-a4', type: 'choice', topic: 'sustituir', q: '¿Qué pronombre reemplaza a "Tom and Ana"?', options: ['they', 'we', 'she'], answer: 0,
              why: 'Tom and Ana son dos personas, así que usamos they.' },
            { id: 'l4-a5', type: 'type', topic: 'sustituir', q: 'Cambia el nombre por un pronombre.', ex: 'Ana is tired.  →  She is tired.', source: 'My father is a doctor.',
              accepted: ['he is a doctor', "he's a doctor"], show: 'He is a doctor.', why: 'My father es un hombre, así que va he.' },
            { id: 'l4-a6', type: 'type', topic: 'sustituir', q: 'Cambia el nombre por un pronombre.', ex: 'Ana is tired.  →  She is tired.', source: 'The books are new.',
              accepted: ['they are new', "they're new"], show: 'They are new.', why: 'The books son varias cosas, así que va they.' },
            { id: 'l4-a7', type: 'error', topic: 'sustituir', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['They are my friends.', 'He is my sister.', 'It is very cold.'], wrong: 1, fix: 'She is my sister.',
              why: 'My sister es una mujer, así que usamos she, no he.' },
            { id: 'l4-a8', type: 'write', topic: 'sustituir', q: 'Escribe dos frases: una sobre ti con I y otra sobre un amigo o familiar con he o she.',
              example: 'I am happy. She is my sister.',
              checks: [
                { re: '(^|[.!?]\\s*)(I\\s+\\S+|I.m\\s+\\S+)', msg: 'Falta una frase sobre ti que empiece con I. Por ejemplo: I am happy.' },
                { re: "\\b(he|she)(\\s+is|.s)\\s+\\S+", flags: 'i', msg: 'Falta una frase con he o she. Por ejemplo: She is my sister.' }
              ],
              why: 'Para ti usas I y para otra persona usas he o she.' }
          ]
        },

        /* ------------------------------------------------------------ 5 */
        {
          id: 'vida-real', n: 5, minutes: 6, topic: 'vida',
          title: 'Pronombres en la vida real',
          summary: 'Presentarte, hablar de tu familia y de las cosas.',
          canSay: ['I am Ana.', 'She is my mother.', 'They are my grandparents.'],
          screens: [
            {
              title: 'Preséntate y presenta a otros',
              text: 'Cuando hablas de ti usas I. Cuando presentas a otra persona usas he o she.',
              items: [
                { en: 'I am Ana. I am from Lima.', es: 'Soy Ana. Soy de Lima.' },
                { en: 'He is my brother. He is 20.', es: 'Él es mi hermano. Tiene 20 años.' },
                { en: 'She is my friend. She is from Chile.', es: 'Ella es mi amiga. Es de Chile.' }
              ]
            },
            {
              title: 'En la foto familiar',
              text: 'El pronombre cambia según de quién hablas.',
              table: {
                head: ['Hablo de', 'Digo'],
                rows: [
                  ['Tu mamá', 'She is my mother.'],
                  ['Tu papá', 'He is my father.'],
                  ['Tus abuelos', 'They are my grandparents.'],
                  ['Tú y tu hermano', 'We are brothers.']
                ]
              },
              listen: ['She is my mother.', 'He is my father.', 'They are my grandparents.', 'We are brothers.']
            },
            {
              title: 'Cosas, clima y hora',
              text: 'It y they también sirven para cosas, para el clima y para la hora.',
              items: [
                { en: 'It is a good phone.', es: 'Es un buen teléfono.' },
                { en: 'It is hot today.', es: 'Hoy hace calor.' },
                { en: "It is 8 o'clock.", es: 'Son las ocho.' },
                { en: 'They are very big.', es: 'Son muy grandes.' }
              ]
            },
            {
              title: 'Repaso antes de practicar',
              text: 'Estos son los siete pronombres y cuándo usarlos.',
              table: {
                head: ['Pronombre', 'Lo uso para'],
                rows: [
                  ['I', 'yo'],
                  ['you', 'tú, usted o ustedes'],
                  ['he', 'un hombre'],
                  ['she', 'una mujer'],
                  ['it', 'una cosa, el clima o la hora'],
                  ['we', 'nosotros'],
                  ['they', 'varias personas o cosas']
                ]
              },
              note: 'Si dudas, piensa de quién hablas y si es uno o son varios.'
            }
          ],
          activities: [
            { id: 'l5-a1', type: 'choice', topic: 'vida', q: 'Hablas con tus compañeros de clase: ___ are ready.', options: ['You', 'We', 'They'], answer: 0,
              why: 'Hablas con ellos, así que usas you, aunque sean varias personas.' },
            { id: 'l5-a2', type: 'choice', topic: 'vida', q: 'My grandparents are at home. ___ are happy.', options: ['He', 'They', 'We'], answer: 1,
              why: 'My grandparents son varias personas, así que usamos they.' },
            { id: 'l5-a3', type: 'choice', say: 'It is 8 o\'clock.', topic: 'vida', q: 'Hablas de la hora: ___ is 8 o\'clock.', options: ['She', 'It', 'They'], answer: 1,
              why: 'Para hablar de la hora usamos it: It is 8 o\'clock.' },
            { id: 'l5-a4', type: 'choice', topic: 'vida', q: '¿Cómo se dice "Ella es mi mamá"?',
              options: ['She is my mother.', 'He is my mother.', 'It is my mother.'], answer: 0,
              wrongWhy: { 'He is my mother.': 'He se usa para un hombre. Tu mamá es una mujer: she.', 'It is my mother.': 'It se usa para cosas. Para una persona usa he o she.' },
              why: 'Tu mamá es una mujer: She is my mother.' },
            { id: 'l5-a5', type: 'type', topic: 'vida', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: 'Ana and Sofia are sisters. ___ are tall.',
              accepted: ['they'], show: 'they', why: 'Ana and Sofia son dos personas, así que usamos they.' },
            { id: 'l5-a6', type: 'error', topic: 'vida', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['She is my uncle.', 'We are friends.', 'They are at home.'], wrong: 0, fix: 'He is my uncle.',
              why: 'My uncle es un hombre, así que usamos he.' },
            { id: 'l5-a7', type: 'order', topic: 'vida', q: 'Ordena las palabras para formar una frase.',
              tokens: ['They', 'are', 'my', 'grandparents.'],
              why: 'Primero they, luego are y luego quiénes son.' },
            { id: 'l5-a8', type: 'write', topic: 'vida', q: 'Escribe una frase sobre una persona de tu familia. Usa he o she.',
              example: 'She is my sister. She is 20.',
              checks: [
                { re: "\\b(he|she)(\\s+is|.s)\\s+\\S+", flags: 'i', msg: 'Usa he o she y sigue con is. Por ejemplo: She is my sister.' }
              ],
              why: 'Para una persona de tu familia usas he si es hombre y she si es mujer.' }
          ]
        }
      ],

      /* ---------------------------------------------------------- Evaluación (práctica, en el navegador) */
      exam: {
        id: 'pronombres-final', n: 6,
        title: 'Evaluación final (práctica)',
        bank: [
          /* yotu */
          { id: 'x-y1', type: 'choice', topic: 'yotu', q: '___ am a student.', options: ['You', 'I', 'She'], answer: 1, why: 'Hablas de ti: I am a student.' },
          { id: 'x-y2', type: 'choice', say: 'You are very kind.', topic: 'yotu', q: 'Hablas con tu profesor: ___ are very kind.', options: ['You', 'I', 'We'], answer: 0, why: 'Hablas con tu profesor, así que usas you. Sirve para tú y para usted.' },
          { id: 'x-y3', type: 'choice', topic: 'yotu', q: '¿Cómo se dice "Estoy en casa"?', options: ['Am at home.', 'I am at home.', 'You am at home.'], answer: 1,
            wrongWhy: { 'Am at home.': 'Falta el pronombre. En inglés se dice I am at home.', 'You am at home.': 'You significa tú. Para decir yo usa I.' }, why: 'Estoy en casa se dice I am at home.' },
          { id: 'x-y4', type: 'error', topic: 'yotu', q: 'Una de estas frases tiene un error. Tócala.', options: ['You are my friend.', 'Am very happy.', 'I am from Peru.'], wrong: 1, fix: 'I am very happy.', why: 'Falta el pronombre: I am very happy.' },
          { id: 'x-y5', type: 'type', topic: 'yotu', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: '___ am hungry.', accepted: ['i'], show: 'I', why: 'Hablas de ti: I am hungry.' },
          { id: 'x-y6', type: 'order', topic: 'yotu', q: 'Ordena las palabras para formar una frase.', tokens: ['You', 'are', 'very', 'kind.'], why: 'Primero you, luego are y luego la información.' },
          /* hesheit */
          { id: 'x-h1', type: 'choice', topic: 'hesheit', q: 'My uncle is a pilot. ___ is tall.', options: ['She', 'He', 'It'], answer: 1, why: 'My uncle es un hombre: he.' },
          { id: 'x-h2', type: 'choice', topic: 'hesheit', q: 'My mother is at work. ___ is tired.', options: ['She', 'He', 'It'], answer: 0, why: 'My mother es una mujer: she.' },
          { id: 'x-h3', type: 'choice', topic: 'hesheit', q: 'The car is old. ___ is red.', options: ['He', 'She', 'It'], answer: 2, why: 'The car es una cosa: it.' },
          { id: 'x-h4', type: 'type', topic: 'hesheit', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: 'Look outside. ___ is rainy.', accepted: ['it'], show: 'it', why: 'Para el clima usamos it.' },
          { id: 'x-h5', type: 'error', topic: 'hesheit', q: 'Una de estas frases tiene un error. Tócala.', options: ['She is a doctor.', 'He is my cousin.', 'Is very late.'], wrong: 2, fix: 'It is very late.', why: 'Falta el pronombre: It is very late.' },
          { id: 'x-h6', type: 'order', topic: 'hesheit', q: 'Ordena las palabras para formar una frase.', tokens: ['She', 'is', 'my', 'teacher.'], why: 'Primero she, luego is y luego quién es.' },
          /* plural */
          { id: 'x-p1', type: 'choice', topic: 'plural', q: 'My brother and I are at home. ___ are tired.', options: ['They', 'We', 'You'], answer: 1, why: 'My brother and I incluye a quien habla: we.' },
          { id: 'x-p2', type: 'choice', topic: 'plural', q: 'Pablo and Marta are students. ___ are in class.', options: ['They', 'We', 'He'], answer: 0, why: 'Pablo and Marta son dos personas: they.' },
          { id: 'x-p3', type: 'choice', say: 'You are great.', topic: 'plural', q: 'Hablas con tres amigos: ___ are great.', options: ['They', 'We', 'You'], answer: 2, why: 'Hablas con ellos, así que usas you.' },
          { id: 'x-p4', type: 'type', topic: 'plural', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: 'The apples are red. ___ are sweet.', accepted: ['they'], show: 'they', why: 'The apples son varias cosas: they.' },
          { id: 'x-p5', type: 'error', topic: 'plural', q: 'Una de estas frases tiene un error. Tócala.', options: ['We are friends.', 'It are my books.', 'They are at home.'], wrong: 1, fix: 'They are my books.', why: 'My books son varias cosas: they, no it.' },
          { id: 'x-p6', type: 'order', topic: 'plural', q: 'Ordena las palabras para formar una frase.', tokens: ['We', 'are', 'at', 'school.'], why: 'Primero we, luego are y luego dónde estamos.' },
          /* sustituir */
          { id: 'x-s1', type: 'choice', topic: 'sustituir', q: '¿Qué pronombre reemplaza a "Ms. Lee"?', options: ['he', 'she', 'it'], answer: 1, why: 'Ms. Lee es una mujer: she.' },
          { id: 'x-s2', type: 'choice', topic: 'sustituir', q: '¿Qué pronombre reemplaza a "the dishes"?', options: ['it', 'we', 'they'], answer: 2, why: 'The dishes son varias cosas: they.' },
          { id: 'x-s3', type: 'choice', topic: 'sustituir', q: '¿Qué pronombre reemplaza a "my friend and I"?', options: ['we', 'they', 'you'], answer: 0, why: 'My friend and I incluye a quien habla: we.' },
          { id: 'x-s4', type: 'type', topic: 'sustituir', q: 'Cambia el nombre por un pronombre.', ex: 'Ana is tired.  →  She is tired.', source: 'My mother is a nurse.', accepted: ['she is a nurse', "she's a nurse"], show: 'She is a nurse.', why: 'My mother es una mujer: she.' },
          { id: 'x-s5', type: 'error', topic: 'sustituir', q: 'Una de estas frases tiene un error. Tócala.', options: ['It is my phone.', 'They are my parents.', 'He is my aunt.'], wrong: 2, fix: 'She is my aunt.', why: 'My aunt es una mujer: she.' },
          { id: 'x-s6', type: 'order', topic: 'sustituir', q: 'Ordena las palabras para formar una frase.', tokens: ['He', 'is', 'a', 'doctor.'], why: 'Primero he, luego is y luego la información.' },
          /* vida */
          { id: 'x-v1', type: 'choice', say: 'I am Pablo.', topic: 'vida', q: 'Te presentas: ___ am Pablo.', options: ['He', 'I', 'It'], answer: 1, why: 'Hablas de ti: I am Pablo.' },
          { id: 'x-v2', type: 'choice', say: 'She is Laura.', topic: 'vida', q: 'Presentas a tu hermana: ___ is Laura.', options: ['She', 'He', 'They'], answer: 0, why: 'Tu hermana es una mujer: she.' },
          { id: 'x-v3', type: 'choice', say: 'It is 9 o\'clock.', topic: 'vida', q: 'Hablas de la hora: ___ is 9 o\'clock.', options: ['She', 'We', 'It'], answer: 2, why: 'Para la hora usamos it.' },
          { id: 'x-v4', type: 'type', topic: 'vida', q: 'Escribe el pronombre que falta.', ex: '___ is happy.  →  she', source: 'My parents are at home. ___ are happy.', accepted: ['they'], show: 'they', why: 'My parents son varias personas: they.' },
          { id: 'x-v5', type: 'error', topic: 'vida', q: 'Una de estas frases tiene un error. Tócala.', options: ['I am from Chile.', 'She is my brother.', 'We are neighbors.'], wrong: 1, fix: 'He is my brother.', why: 'My brother es un hombre: he, no she.' },
          { id: 'x-v6', type: 'order', topic: 'vida', q: 'Ordena las palabras para formar una frase.', tokens: ['He', 'is', 'my', 'brother.'], why: 'Primero he, luego is y luego quién es.' }
        ]
      }
    },

    'articulos': {
      id: 'articulos',
      title: 'Artículos y plurales',
      name: 'Artículos y plurales',
      short: 'A, an, the y plurales',
      tagline: 'Aprende cuándo usar a, an, the o ningún artículo, y cómo formar el plural.',
      goal: 'Al terminar podrás elegir entre a, an, the o ningún artículo, y formar plurales regulares e irregulares con seguridad.',
      topics: {
        aan: 'A y an',
        the: 'The',
        general: 'A, an, the o ningún artículo',
        plurales: 'Plurales regulares',
        irregulares: 'Plurales irregulares'
      },

      lessons: [
        /* ------------------------------------------------------------ 1 */
        {
          id: 'a-an', n: 1, minutes: 6, topic: 'aan',
          title: 'A y an',
          summary: 'Decir "un" o "una" y elegir entre a y an.',
          canSay: ['I have a book.', 'She eats an apple.', 'He is a university student.'],
          screens: [
            {
              title: 'A y an: un y una',
              text: 'A y an significan un o una. Se usan antes de un nombre en singular que puedes contar, cuando hablas de uno cualquiera. En inglés no cambian por género: a book es un libro, a house es una casa.',
              items: [
                { en: 'a book', es: 'un libro' },
                { en: 'a house', es: 'una casa' },
                { en: 'an apple', es: 'una manzana' }
              ],
              listen: ['A book', 'A house', 'An apple']
            },
            {
              title: 'A o an: depende del sonido',
              text: 'Usa a antes de un sonido de consonante. Usa an antes de un sonido de vocal. La decisión se toma al escuchar la palabra que sigue, no al mirar cómo se escribe.',
              table: {
                head: ['Sonido', 'Artículo', 'Ejemplo'],
                rows: [
                  ['Consonante', 'a', 'a book'],
                  ['Vocal', 'an', 'an apple'],
                  ['Vocal', 'an', 'an egg']
                ]
              },
              listen: ['A book', 'An apple', 'An egg']
            },
            {
              title: 'Cuenta el sonido, no la letra',
              text: 'Algunas palabras empiezan con una vocal escrita, pero suenan como consonante: university suena "yuniversiti", así que va con a. Otras empiezan con h, pero la h no se pronuncia: hour suena "auer", así que va con an.',
              items: [
                { en: 'a university', es: 'una universidad' },
                { en: 'a uniform', es: 'un uniforme' },
                { en: 'an hour', es: 'una hora' },
                { en: 'an honest person', es: 'una persona honesta' }
              ],
              listen: ['A university', 'A uniform', 'An hour', 'An honest person'],
              note: 'La mayoría de las palabras con h sí se pronuncian: a house, a hat, a horse.'
            },
            {
              title: 'Manda la palabra que sigue',
              text: 'Si pones un adjetivo entre el artículo y el nombre, el artículo se decide por el adjetivo, porque es la palabra que viene justo después.',
              items: [
                { en: 'an old car', es: 'un coche viejo' },
                { en: 'a new car', es: 'un coche nuevo' },
                { en: 'an easy test', es: 'una prueba fácil' },
                { en: 'a difficult test', es: 'una prueba difícil' }
              ],
              listen: ['An old car', 'A new car', 'An easy test', 'A difficult test']
            },
            {
              title: 'A y an solo van con uno',
              text: 'A y an significan uno, así que no se usan con plurales. Con varios, no se pone a ni an.',
              compare: { wrong: 'a books', right: 'a book' },
              items: [
                { en: 'a book', es: 'un libro' },
                { en: 'books', es: 'libros' }
              ],
              listen: ['A book', 'Books']
            }
          ],
          activities: [
            { id: 'l1-a1', type: 'choice', topic: 'aan', q: 'I eat ___ apple.', options: ['a', 'an'], answer: 1,
              wrongWhy: { 'a': 'Apple empieza con sonido de vocal, así que no lleva a.' },
              why: 'Apple empieza con sonido de vocal, así que lleva an: I eat an apple.' },
            { id: 'l1-a2', type: 'choice', topic: 'aan', q: 'She has ___ book.', options: ['a', 'an'], answer: 0,
              wrongWhy: { 'an': 'Book empieza con sonido de consonante, así que no lleva an.' },
              why: 'Book empieza con sonido de consonante, así que lleva a: She has a book.' },
            { id: 'l1-a3', type: 'choice', topic: 'aan', q: 'He is ___ university student.', options: ['a', 'an'], answer: 0,
              wrongWhy: { 'an': 'University se escribe con u, pero suena "yuniversiti", con sonido de consonante. No lleva an.' },
              why: 'University suena como "yuniversiti", con sonido de consonante, así que lleva a: He is a university student.' },
            { id: 'l1-a4', type: 'choice', topic: 'aan', q: 'We wait for ___ hour.', options: ['a', 'an'], answer: 1,
              wrongWhy: { 'a': 'Hour se escribe con h, pero la h no suena: se dice "auer". Empieza con sonido de vocal, así que no lleva a.' },
              why: 'En hour la h no suena, así que la palabra empieza con sonido de vocal y lleva an: We wait for an hour.' },
            { id: 'l1-a5', type: 'match', topic: 'aan', q: 'Relaciona cada palabra en español con su frase en inglés.',
              pairs: [['una manzana', 'an apple'], ['una universidad', 'a university'], ['una hora', 'an hour']],
              why: 'Apple y hour empiezan con sonido de vocal y llevan an. University empieza con sonido de consonante y lleva a.' },
            { id: 'l1-a6', type: 'type', topic: 'aan', q: 'Escribe a o an.', ex: 'I have ___ pen.  →  a', source: 'I need ___ umbrella. Do you have one?',
              accepted: ['an'], show: 'an', why: 'Umbrella empieza con sonido de vocal, así que lleva an.' },
            { id: 'l1-a7', type: 'error', topic: 'aan', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['I have a orange.', 'She is a teacher.', 'He has a dog.'], wrong: 0, fix: 'I have an orange.',
              why: 'Orange empieza con sonido de vocal, así que lleva an: I have an orange.' },
            { id: 'l1-a8', type: 'order', topic: 'aan', q: 'Ordena las palabras para formar una frase.',
              tokens: ['She', 'has', 'an', 'umbrella.'],
              why: 'Primero quién, luego has, luego an y luego lo que tiene.' }
          ]
        },

        /* ------------------------------------------------------------ 2 */
        {
          id: 'the', n: 2, minutes: 6, topic: 'the',
          title: 'The',
          summary: 'Hablar de algo concreto: el, la, los y las.',
          canSay: ['The sun is hot.', 'I have a cat. The cat is black.', 'Please open the door.'],
          screens: [
            {
              title: 'The: el, la, los, las',
              text: 'The significa el, la, los o las. Es la misma palabra para singular y plural, y para masculino y femenino. Se usa cuando hablas de algo concreto, que tú y la otra persona ya pueden identificar.',
              items: [
                { en: 'the book', es: 'el libro' },
                { en: 'the books', es: 'los libros' },
                { en: 'the house', es: 'la casa' },
                { en: 'the houses', es: 'las casas' }
              ],
              listen: ['The book', 'The books', 'The house', 'The houses']
            },
            {
              title: 'Cuándo usas the',
              text: 'Hay tres situaciones muy comunes. La primera, cuando ya lo mencionaste: primero dices a y luego the. La segunda, cuando los dos saben cuál es. La tercera, cuando solo hay uno.',
              items: [
                { en: 'I have a cat. The cat is black.', es: 'Tengo un gato. El gato es negro.' },
                { en: 'Please close the door.', es: 'Por favor, cierra la puerta.' },
                { en: 'The sun is hot.', es: 'El sol está muy fuerte.' },
                { en: 'Look at the moon.', es: 'Mira la luna.' }
              ],
              listen: ['I have a cat. The cat is black.', 'Please close the door.', 'The sun is hot.', 'Look at the moon.'],
              note: 'En Please close the door, los dos están en el mismo lugar y saben qué puerta es.'
            },
            {
              title: 'A es uno cualquiera, the es uno concreto',
              text: 'Si no importa cuál, usa a o an. Si es uno en particular, usa the.',
              change: { a: { label: 'Uno cualquiera', text: 'I need a pen.', es: 'Necesito un bolígrafo (cualquiera).' }, b: { label: 'Uno concreto', text: 'I need the pen.', es: 'Necesito el bolígrafo (uno que ya conocemos).' } },
              listen: ['I need a pen.', 'I need the pen.']
            },
            {
              title: 'The no es solo para lo ya mencionado',
              text: 'Mencionar algo antes es solo una razón. También usas the cuando es obvio cuál es o cuando es único en su tipo.',
              items: [
                { en: 'The teacher is here.', es: 'El profesor está aquí (el de nuestra clase).' },
                { en: 'The Earth is round.', es: 'La Tierra es redonda.' },
                { en: 'The president is in Paris.', es: 'El presidente está en París.' }
              ],
              listen: ['The teacher is here.', 'The Earth is round.', 'The president is in Paris.']
            },
            {
              title: 'Cómo suena the',
              text: 'Antes de un sonido de consonante, the suena parecido a "de": the book. Antes de un sonido de vocal, suena parecido a "di": the apple, the hour. Es un detalle de pronunciación: se escribe igual.',
              items: [
                { en: 'the book', es: 'el libro' },
                { en: 'the apple', es: 'la manzana' },
                { en: 'the hour', es: 'la hora' }
              ],
              listen: ['The book', 'The apple', 'The hour']
            }
          ],
          activities: [
            { id: 'l2-a1', type: 'choice', topic: 'the', q: 'I have a cat. ___ cat is black.', options: ['a', 'the'], answer: 1,
              wrongWhy: { 'a': 'Ya dijiste a cat. Ahora hablas de ese mismo gato, así que usas the.' },
              why: 'Ya mencionaste el gato en la primera frase. Ahora es un gato concreto: The cat is black.' },
            { id: 'l2-a2', type: 'choice', topic: 'the', q: '___ sun is hot today.', options: ['A', 'The'], answer: 1,
              wrongWhy: { 'A': 'Solo hay un sol. Al ser único, lleva the.' },
              why: 'Solo hay un sol, así que lleva the: The sun is hot today.' },
            { id: 'l2-a3', type: 'choice', topic: 'the', q: 'Look at ___ moon! It is big tonight.', options: ['a', 'the'], answer: 1,
              wrongWhy: { 'a': 'Solo hay una luna. Al ser única, lleva the.' },
              why: 'Solo hay una luna, así que lleva the: Look at the moon!' },
            { id: 'l2-a4', type: 'choice', topic: 'the', q: 'I need ___ pen. Do you have one?', options: ['a', 'the'], answer: 0,
              wrongWhy: { 'the': 'No hablas de un bolígrafo en particular. Pides uno cualquiera, así que usas a.' },
              why: 'Pides uno cualquiera, no uno en particular, así que usas a: I need a pen.' },
            { id: 'l2-a5', type: 'match', topic: 'the', q: 'Relaciona cada palabra en español con su frase en inglés.',
              pairs: [['el sol', 'the sun'], ['los libros', 'the books'], ['la luna', 'the moon']],
              why: 'The sirve para el, la, los y las.' },
            { id: 'l2-a6', type: 'type', topic: 'the', q: 'Escribe a, an o the.', ex: 'I have ___ pen.  →  a', source: 'I have an apple. ___ apple is red.',
              accepted: ['the'], show: 'the', why: 'Ya mencionaste la manzana en la primera frase, así que usas the.' },
            { id: 'l2-a7', type: 'error', topic: 'the', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['I have a car. A car is blue.', 'The moon is white.', 'She is a nurse.'], wrong: 0, fix: 'I have a car. The car is blue.',
              why: 'En la segunda frase hablas del mismo coche que ya mencionaste, así que lleva the.' },
            { id: 'l2-a8', type: 'order', topic: 'the', q: 'Ordena las palabras para formar una frase.',
              tokens: ['The', 'sun', 'is', 'hot.'],
              why: 'Primero the sun, luego is y luego cómo es.' }
          ]
        },

        /* ------------------------------------------------------------ 3 */
        {
          id: 'a-an-the-nada', n: 3, minutes: 7, topic: 'general',
          title: 'A, an, the o ningún artículo',
          summary: 'Elegir bien entre las tres opciones, incluida la de no poner artículo.',
          canSay: ['She is a nurse.', 'I like dogs.', 'I speak English.'],
          screens: [
            {
              title: 'Tres decisiones',
              text: 'Antes de un nombre, piensa en qué quieres decir. Si es uno cualquiera y está en singular, usa a o an. Si es uno concreto, usa the. Si hablas de varios o de algo en general, no pongas artículo.',
              table: {
                head: ['Quieres decir', 'Usas', 'Ejemplo'],
                rows: [
                  ['Uno cualquiera', 'a / an', 'I have a dog.'],
                  ['Uno concreto', 'the', 'The dog is black.'],
                  ['Varios, en general', 'ningún artículo', 'Dogs are friendly.']
                ]
              },
              listen: ['I have a dog.', 'The dog is black.', 'Dogs are friendly.']
            },
            {
              title: 'Cuándo no se pone artículo',
              text: 'No uses artículo cuando hablas en general de varias cosas (plural), de cosas que no cuentas (music, water, rice), de idiomas y de deportes.',
              items: [
                { en: 'I like apples.', es: 'Me gustan las manzanas.' },
                { en: 'I like music.', es: 'Me gusta la música.' },
                { en: 'I speak Spanish.', es: 'Hablo español.' },
                { en: 'We play soccer.', es: 'Jugamos fútbol.' }
              ],
              listen: ['I like apples.', 'I like music.', 'I speak Spanish.', 'We play soccer.'],
              note: 'Cuidado con el español: aquí decimos "la música" y "los perros", pero en inglés, al hablar en general, no se pone the.'
            },
            {
              title: 'Cosas que no se cuentan',
              text: 'Algunas palabras nombran cosas que no se cuentan de una en una, como water, music o rice. Normalmente no llevan a ni an, y no se usan en plural.',
              compare: { wrong: 'I like musics.', right: 'I like music.' },
              items: [
                { en: 'I drink water.', es: 'Bebo agua.' },
                { en: 'She likes rice.', es: 'A ella le gusta el arroz.' }
              ],
              listen: ['I drink water.', 'She likes rice.']
            },
            {
              title: 'La profesión lleva a o an',
              text: 'En español decimos "Soy enfermera", sin artículo. En inglés, al decir qué profesión tienes, sí se usa a o an.',
              compare: { wrong: 'She is nurse.', right: 'She is a nurse.' },
              items: [
                { en: 'He is a doctor.', es: 'Él es médico.' },
                { en: 'I am an engineer.', es: 'Soy ingeniero.' }
              ],
              listen: ['She is a nurse.', 'He is a doctor.', 'I am an engineer.']
            },
            {
              title: 'Errores frecuentes',
              text: 'Hay tres errores muy comunes. No pongas the con un idioma. No pongas a con un plural. No dejes sin artículo una profesión en singular.',
              items: [
                { en: 'I speak English.', es: 'Hablo inglés. (no: the English)' },
                { en: 'I have dogs.', es: 'Tengo perros. (no: a dogs)' },
                { en: 'He is a teacher.', es: 'Es profesor. (no: He is teacher)' }
              ],
              listen: ['I speak English.', 'I have dogs.', 'He is a teacher.']
            }
          ],
          activities: [
            { id: 'l3-a1', type: 'choice', topic: 'general', say: 'She is a nurse.', q: 'She is ___ nurse.', options: ['a', 'an', 'sin artículo'], answer: 0,
              wrongWhy: { 'an': 'Nurse empieza con sonido de consonante, así que no lleva an.', 'sin artículo': 'La profesión en singular lleva a o an en inglés: She is a nurse.' },
              why: 'Nurse empieza con sonido de consonante y la profesión lleva artículo: She is a nurse.' },
            { id: 'l3-a2', type: 'choice', topic: 'general', say: 'I like music.', q: 'Me gusta la música, en general: I like ___ music.', options: ['a', 'the', 'sin artículo'], answer: 2,
              wrongWhy: { 'a': 'A va con un nombre que puedes contar en singular. Music no se cuenta.', 'the': 'Hablas de la música en general, no de una canción o un disco en concreto. Sin artículo.' },
              why: 'Hablas de la música en general, así que no se pone artículo: I like music.' },
            { id: 'l3-a3', type: 'choice', topic: 'general', say: 'My sister speaks French.', q: 'My sister speaks ___ French.', options: ['a', 'the', 'sin artículo'], answer: 2,
              wrongWhy: { 'a': 'French es un idioma, no se pone a.', 'the': 'Con los idiomas no se usa the.' },
              why: 'Con los idiomas no se pone artículo: My sister speaks French.' },
            { id: 'l3-a4', type: 'choice', topic: 'general', q: 'I have a dog. ___ dog is brown.', options: ['a', 'the', 'sin artículo'], answer: 1,
              wrongWhy: { 'a': 'Ya dijiste a dog. Ahora hablas de ese mismo perro, así que usas the.', 'sin artículo': 'Dog está en singular y es un perro concreto, así que necesita artículo: the.' },
              why: 'Hablas del mismo perro que ya mencionaste: The dog is brown.' },
            { id: 'l3-a5', type: 'match', topic: 'general', q: 'Relaciona cada frase en español con su frase en inglés.',
              pairs: [['Soy enfermera.', 'I am a nurse.'], ['Hablo inglés.', 'I speak English.'], ['Me gustan los perros.', 'I like dogs.']],
              why: 'La profesión en singular lleva a o an, y los idiomas y las cosas en general no llevan artículo.' },
            { id: 'l3-a6', type: 'type', topic: 'general', q: 'Escribe a o an.', ex: 'I have ___ pen.  →  a', source: 'Look! There is ___ elephant.',
              accepted: ['an'], show: 'an', why: 'Elephant empieza con sonido de vocal y es uno cualquiera, así que lleva an.' },
            { id: 'l3-a7', type: 'error', topic: 'general', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['I like dogs.', 'She is teacher.', 'We play soccer.'], wrong: 1, fix: 'She is a teacher.',
              why: 'La profesión en singular necesita a o an: She is a teacher.' },
            { id: 'l3-a8', type: 'write', topic: 'general', q: 'Escribe una frase que empiece con I like y diga algo que te gusta, en plural y sin artículo.',
              example: 'I like apples.',
              checks: [
                { re: '^\\s*I like\\s+(?!(a|an|the)\\b)[a-z]+', flags: 'i', msg: 'Empieza con I like y sigue directo con lo que te gusta, sin a, an ni the. Por ejemplo: I like apples.' }
              ],
              why: 'Cuando hablas en general de varias cosas, no pones artículo: I like apples.' }
          ]
        },

        /* ------------------------------------------------------------ 4 */
        {
          id: 'plurales-regulares', n: 4, minutes: 7, topic: 'plurales',
          title: 'Plurales regulares',
          summary: 'Formar el plural con -s, -es y -ies, y los casos con -o y -f.',
          canSay: ['I have two boxes.', 'She has three babies.', 'We have four cars.'],
          screens: [
            {
              title: 'Lo normal: añade -s',
              text: 'La mayoría de los nombres forman el plural añadiendo -s al final. Con varios ya no se usa a ni an.',
              items: [
                { en: 'a book → two books', es: 'un libro → dos libros' },
                { en: 'a car → three cars', es: 'un coche → tres coches' },
                { en: 'a dog → four dogs', es: 'un perro → cuatro perros' }
              ],
              listen: ['Two books', 'Three cars', 'Four dogs']
            },
            {
              title: 'Si termina en s, x, ch o sh: añade -es',
              text: 'Cuando la palabra termina en un sonido de silbido, añadir solo -s sería difícil de pronunciar. Por eso se añade -es.',
              table: {
                head: ['Singular', 'Plural'],
                rows: [
                  ['bus', 'buses'],
                  ['box', 'boxes'],
                  ['watch', 'watches'],
                  ['dish', 'dishes']
                ]
              },
              listen: ['Two buses', 'Two boxes', 'Two watches', 'Two dishes']
            },
            {
              title: 'Consonante + y: la y cambia a -ies',
              text: 'Si antes de la y hay una consonante, quitas la y y pones -ies. Si antes hay una vocal (a, e, o, u), solo añades -s.',
              table: {
                head: ['Singular', 'Plural', 'Por qué'],
                rows: [
                  ['baby', 'babies', 'b + y'],
                  ['city', 'cities', 't + y'],
                  ['day', 'days', 'a + y'],
                  ['key', 'keys', 'e + y']
                ]
              },
              listen: ['Two babies', 'Two cities', 'Two days', 'Two keys']
            },
            {
              title: 'Palabras con -o, -f y -fe: aprende cada una',
              text: 'No hay una regla segura. Algunas palabras con -o toman -es y otras solo -s. Algunas con -f o -fe cambian a -ves y otras solo toman -s. Lo mejor es aprender cada palabra.',
              table: {
                head: ['Singular', 'Plural'],
                rows: [
                  ['potato', 'potatoes'],
                  ['photo', 'photos'],
                  ['knife', 'knives'],
                  ['leaf', 'leaves'],
                  ['roof', 'roofs']
                ]
              },
              listen: ['Two potatoes', 'Two photos', 'Two knives', 'Two leaves', 'Two roofs'],
              note: 'Otros ejemplos: tomato, tomatoes; piano, pianos; wife, wives; chef, chefs.'
            },
            {
              title: 'Con varios, el nombre va en plural',
              text: 'Cuando hay más de uno, el nombre también va en plural. En español pasa lo mismo: dos libros, no dos libro.',
              compare: { wrong: 'two book', right: 'two books' },
              items: [
                { en: 'I have two boxes.', es: 'Tengo dos cajas.' },
                { en: 'She has three babies.', es: 'Ella tiene tres bebés.' }
              ],
              listen: ['I have two boxes.', 'She has three babies.']
            }
          ],
          activities: [
            { id: 'l4-a1', type: 'choice', topic: 'plurales', q: 'El plural de "box" es:', options: ['boxs', 'boxes', 'boxies'], answer: 1,
              wrongWhy: { 'boxs': 'Box termina en x, así que se añade -es para poder pronunciarlo.', 'boxies': 'Box no termina en y. Con -x se añade -es.' },
              why: 'Las palabras que terminan en x toman -es: boxes.' },
            { id: 'l4-a2', type: 'choice', topic: 'plurales', q: 'El plural de "baby" es:', options: ['babys', 'babies', 'babyes'], answer: 1,
              wrongWhy: { 'babys': 'Antes de la y hay una consonante (b), así que la y cambia a -ies.', 'babyes': 'Con consonante + y, se quita la y y se pone -ies, no -yes.' },
              why: 'Baby termina en consonante + y, así que la y cambia a -ies: babies.' },
            { id: 'l4-a3', type: 'choice', topic: 'plurales', q: 'El plural de "day" es:', options: ['days', 'daies', 'dayes'], answer: 0,
              wrongWhy: { 'daies': 'Antes de la y hay una vocal (a), así que la y no cambia.', 'dayes': 'Con vocal + y solo se añade -s.' },
              why: 'Day termina en vocal + y, así que solo se añade -s: days.' },
            { id: 'l4-a4', type: 'choice', topic: 'plurales', q: 'El plural de "potato" es:', options: ['potatos', 'potatoes', 'potatoies'], answer: 1,
              wrongWhy: { 'potatos': 'Potato es una de las palabras con -o que toman -es.', 'potatoies': 'La -o no cambia a -ies. Se añade -es.' },
              why: 'Potato es una de las palabras con -o que toman -es: potatoes.' },
            { id: 'l4-a5', type: 'match', topic: 'plurales', q: 'Relaciona cada palabra con su plural.',
              pairs: [['dish', 'dishes'], ['city', 'cities'], ['watch', 'watches']],
              why: 'Sh y ch toman -es y consonante + y cambia a -ies.' },
            { id: 'l4-a6', type: 'type', topic: 'plurales', q: 'Escribe el plural.', ex: 'one dog, two ___  →  dogs', source: 'One bus, two ___.',
              accepted: ['buses'], show: 'buses', why: 'Bus termina en s, así que toma -es: buses.' },
            { id: 'l4-a7', type: 'error', topic: 'plurales', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['I have two boxes.', 'She has three babys.', 'We have four cars.'], wrong: 1, fix: 'She has three babies.',
              why: 'Baby termina en consonante + y, así que su plural es babies.' },
            { id: 'l4-a8', type: 'order', topic: 'plurales', q: 'Ordena las palabras para formar una frase.',
              tokens: ['We', 'have', 'three', 'boxes.'],
              why: 'Primero quién, luego have, luego la cantidad y por último el nombre en plural.' }
          ]
        },

        /* ------------------------------------------------------------ 5 */
        {
          id: 'plurales-irregulares', n: 5, minutes: 7, topic: 'irregulares',
          title: 'Plurales irregulares y repaso',
          summary: 'Los plurales que cambian de forma y un repaso de todo el curso.',
          canSay: ['The children are happy.', 'Two women are here.', 'The people are kind.'],
          screens: [
            {
              title: 'Plurales irregulares',
              text: 'Algunas palabras muy comunes no forman el plural con -s. Cambian por dentro o son totalmente distintas. Hay que aprenderlas.',
              table: {
                head: ['Singular', 'Plural'],
                rows: [
                  ['man', 'men'],
                  ['woman', 'women'],
                  ['child', 'children'],
                  ['person', 'people']
                ]
              },
              listen: ['Man', 'Men', 'Woman', 'Women', 'Child', 'Children', 'Person', 'People'],
              note: 'Women se escribe con e, y suena distinto de woman: "wimin".'
            },
            {
              title: 'Foot, tooth y mouse',
              text: 'Estas tres palabras también cambian de forma.',
              items: [
                { en: 'one foot, two feet', es: 'un pie, dos pies' },
                { en: 'one tooth, two teeth', es: 'un diente, dos dientes' },
                { en: 'one mouse, two mice', es: 'un ratón, dos ratones' }
              ],
              listen: ['One foot, two feet', 'One tooth, two teeth', 'One mouse, two mice']
            },
            {
              title: 'Sheep, deer y fish no cambian',
              text: 'Estas palabras tienen la misma forma en singular y en plural. Sabes si es uno o varios por el resto de la frase.',
              items: [
                { en: 'one sheep, two sheep', es: 'una oveja, dos ovejas' },
                { en: 'one deer, two deer', es: 'un ciervo, dos ciervos' },
                { en: 'one fish, two fish', es: 'un pez, dos peces' }
              ],
              listen: ['One sheep, two sheep', 'One deer, two deer', 'One fish, two fish']
            },
            {
              title: 'People ya es plural',
              text: 'People significa personas y ya es un plural. No le añadas -s ni uses a. Va con are, no con is.',
              compare: { wrong: 'The peoples are kind.', right: 'The people are kind.' },
              items: [
                { en: 'Many people are here.', es: 'Hay mucha gente aquí.' },
                { en: 'A person is here.', es: 'Una persona está aquí.' }
              ],
              listen: ['The people are kind.', 'Many people are here.', 'A person is here.']
            },
            {
              title: 'Repaso: cómo elegir',
              text: 'Primero decide si hablas de uno o de varios, y de algo concreto o general.',
              table: {
                head: ['Quieres decir', 'Cómo lo dices'],
                rows: [
                  ['Uno cualquiera', 'a book, an apple'],
                  ['Uno concreto', 'the book'],
                  ['Varios', 'books, boxes, babies'],
                  ['Varios irregulares', 'men, women, children'],
                  ['En general', 'I like music.']
                ]
              },
              listen: ['A book, an apple', 'The book', 'Books, boxes, babies', 'Men, women, children', 'I like music.']
            }
          ],
          activities: [
            { id: 'l5-a1', type: 'choice', topic: 'irregulares', q: 'El plural de "woman" es:', options: ['womans', 'womens', 'women'], answer: 2,
              wrongWhy: { 'womans': 'Woman es irregular: no se forma con -s.', 'womens': 'Women ya es el plural. No se le añade otra -s.' },
              why: 'Woman es irregular: su plural es women.' },
            { id: 'l5-a2', type: 'choice', topic: 'irregulares', q: 'El plural de "child" es:', options: ['childs', 'children', 'childrens'], answer: 1,
              wrongWhy: { 'childs': 'Child es irregular: no se forma con -s.', 'childrens': 'Children ya es el plural. No se le añade otra -s.' },
              why: 'Child es irregular: su plural es children.' },
            { id: 'l5-a3', type: 'choice', topic: 'irregulares', q: 'I see two ___ in the field.', options: ['sheeps', 'sheep', 'sheepes'], answer: 1,
              wrongWhy: { 'sheeps': 'No se le añade -s: sheep es igual en singular y en plural.', 'sheepes': 'No se le añade -es: sheep es igual en singular y en plural.' },
              why: 'Sheep tiene la misma forma en singular y en plural: two sheep.' },
            { id: 'l5-a4', type: 'choice', topic: 'irregulares', q: 'Many ___ are at the park.', options: ['person', 'peoples', 'people'], answer: 2,
              wrongWhy: { 'person': 'Person es singular y Many pide un plural.', 'peoples': 'People ya es un plural, no se le añade -s.' },
              why: 'People es el plural de person: Many people are at the park.' },
            { id: 'l5-a5', type: 'match', topic: 'irregulares', q: 'Relaciona cada palabra con su plural.',
              pairs: [['man', 'men'], ['mouse', 'mice'], ['foot', 'feet']],
              why: 'Son plurales irregulares: hay que aprenderlos.' },
            { id: 'l5-a6', type: 'type', topic: 'irregulares', q: 'Escribe el plural.', ex: 'one dog, two ___  →  dogs', source: 'One mouse, two ___.',
              accepted: ['mice'], show: 'mice', why: 'Mouse es irregular: su plural es mice.' },
            { id: 'l5-a7', type: 'error', topic: 'irregulares', q: 'Una de estas frases tiene un error. Tócala.',
              options: ['The men are tall.', 'My childs are happy.', 'Two women are here.'], wrong: 1, fix: 'My children are happy.',
              why: 'El plural de child es children, no childs.' },
            { id: 'l5-a8', type: 'write', topic: 'irregulares', q: 'Escribe una frase con un plural irregular: men, women, children, people, feet, teeth o mice.',
              example: 'The children are happy.',
              checks: [
                { re: '\\b(men|women|children|people|feet|teeth|mice)\\b', flags: 'i', msg: 'Usa uno de estos plurales: men, women, children, people, feet, teeth o mice. Por ejemplo: The children are happy.' }
              ],
              why: 'Men, women, children, people, feet, teeth y mice son plurales irregulares.' }
          ]
        }
      ],

      /* ---------------------------------------------------------- Evaluación (práctica, en el navegador) */
      exam: {
        id: 'articulos-final', n: 6,
        title: 'Evaluación final (práctica)',
        bank: [
          /* aan */
          { id: 'x-a1', type: 'choice', topic: 'aan', q: 'She has ___ egg.', options: ['a', 'an'], answer: 1, why: 'Egg empieza con sonido de vocal: an egg.' },
          { id: 'x-a2', type: 'choice', topic: 'aan', q: 'She has ___ uniform for work.', options: ['a', 'an'], answer: 0, why: 'Uniform suena "yuniform", con sonido de consonante: a uniform.' },
          { id: 'x-a3', type: 'choice', topic: 'aan', q: 'She is ___ honest woman.', options: ['a', 'an'], answer: 1, why: 'En honest la h no suena: se dice "onest". Empieza con sonido de vocal: an honest woman.' },
          { id: 'x-a4', type: 'type', topic: 'aan', q: 'Escribe a o an.', ex: 'I have ___ pen.  →  a', source: 'He wants ___ orange. Do you have one?', accepted: ['an'], show: 'an', why: 'Orange empieza con sonido de vocal: an orange.' },
          { id: 'x-a5', type: 'error', topic: 'aan', q: 'Una de estas frases tiene un error. Tócala.', options: ['I see a elephant.', 'She has a cat.', 'He is a student.'], wrong: 0, fix: 'I see an elephant.', why: 'Elephant empieza con sonido de vocal: an elephant.' },
          { id: 'x-a6', type: 'order', topic: 'aan', q: 'Ordena las palabras para formar una frase.', tokens: ['I', 'have', 'a', 'new', 'phone.'], why: 'Primero quién, luego have, luego a new y por último el nombre.' },
          /* the */
          { id: 'x-t1', type: 'choice', topic: 'the', q: 'I have a bike. ___ bike is red.', options: ['a', 'the'], answer: 1, why: 'Ya mencionaste la bicicleta: The bike is red.' },
          { id: 'x-t2', type: 'choice', topic: 'the', q: '___ Earth is round.', options: ['A', 'The'], answer: 1, why: 'Solo hay una Tierra: The Earth is round.' },
          { id: 'x-t3', type: 'choice', topic: 'the', q: 'I need ___ pencil. Do you have one?', options: ['a', 'the'], answer: 0, why: 'Pides un lápiz cualquiera: a pencil.' },
          { id: 'x-t4', type: 'type', topic: 'the', q: 'Escribe a, an o the.', ex: 'I have ___ pen.  →  a', source: 'She has a son. ___ son is five.', accepted: ['the'], show: 'the', why: 'Ya mencionaste al hijo: the son.' },
          { id: 'x-t5', type: 'error', topic: 'the', q: 'Una de estas frases tiene un error. Tócala.', options: ['I have a cat.', 'A sun is hot today.', 'She is a nurse.'], wrong: 1, fix: 'The sun is hot today.', why: 'Solo hay un sol, así que lleva the.' },
          { id: 'x-t6', type: 'order', topic: 'the', q: 'Ordena las palabras para formar una frase.', tokens: ['The', 'teacher', 'is', 'here.'], why: 'Primero the teacher, luego is y luego dónde.' },
          /* general */
          { id: 'x-g1', type: 'choice', topic: 'general', say: 'My brother is a doctor.', q: 'My brother is ___ doctor.', options: ['a', 'an', 'sin artículo'], answer: 0, why: 'La profesión en singular lleva artículo y doctor empieza con consonante: a doctor.' },
          { id: 'x-g2', type: 'choice', topic: 'general', say: 'I like coffee.', q: 'Me gusta el café, en general: I like ___ coffee.', options: ['a', 'the', 'sin artículo'], answer: 2, why: 'Hablas del café en general: I like coffee.' },
          { id: 'x-g3', type: 'choice', topic: 'general', say: 'We play soccer on Sundays.', q: 'We play ___ soccer on Sundays.', options: ['a', 'the', 'sin artículo'], answer: 2, why: 'Con los deportes no se pone artículo: We play soccer.' },
          { id: 'x-g4', type: 'type', topic: 'general', q: 'Escribe a, an o the.', ex: 'I have ___ pen.  →  a', source: 'I need ___ eraser. Do you have one?', accepted: ['an'], show: 'an', why: 'Eraser empieza con sonido de vocal y pides uno cualquiera: an eraser.' },
          { id: 'x-g5', type: 'error', topic: 'general', q: 'Una de estas frases tiene un error. Tócala.', options: ['We speak English.', 'He is engineer.', 'I like cats.'], wrong: 1, fix: 'He is an engineer.', why: 'La profesión en singular lleva a o an.' },
          { id: 'x-g6', type: 'order', topic: 'general', q: 'Ordena las palabras para formar una frase.', tokens: ['They', 'play', 'soccer', 'at', 'school.'], why: 'Primero quién, luego play, luego soccer sin artículo y por último dónde.' },
          /* plurales */
          { id: 'x-p1', type: 'choice', topic: 'plurales', q: 'El plural de "bus" es:', options: ['buss', 'buses', 'busies'], answer: 1, why: 'Las palabras que terminan en s toman -es: buses.' },
          { id: 'x-p2', type: 'choice', topic: 'plurales', q: 'El plural de "city" es:', options: ['citys', 'cities', 'cityes'], answer: 1, why: 'City termina en consonante + y: cities.' },
          { id: 'x-p3', type: 'choice', topic: 'plurales', q: 'El plural de "key" es:', options: ['keys', 'kies', 'keies'], answer: 0, why: 'Key termina en vocal + y, así que solo se añade -s: keys.' },
          { id: 'x-p4', type: 'type', topic: 'plurales', q: 'Escribe el plural.', ex: 'one dog, two ___  →  dogs', source: 'One watch, two ___.', accepted: ['watches'], show: 'watches', why: 'Watch termina en ch, así que toma -es: watches.' },
          { id: 'x-p5', type: 'error', topic: 'plurales', q: 'Una de estas frases tiene un error. Tócala.', options: ['I have two dogs.', 'She has three boxs.', 'He has four pens.'], wrong: 1, fix: 'She has three boxes.', why: 'Box termina en x, así que su plural es boxes.' },
          { id: 'x-p6', type: 'order', topic: 'plurales', q: 'Ordena las palabras para formar una frase.', tokens: ['We', 'have', 'two', 'dishes.'], why: 'Primero quién, luego have, luego la cantidad y por último el plural.' },
          /* irregulares */
          { id: 'x-i1', type: 'choice', topic: 'irregulares', q: 'El plural de "man" es:', options: ['mans', 'men', 'mens'], answer: 1, why: 'Man es irregular: men.' },
          { id: 'x-i2', type: 'choice', topic: 'irregulares', q: 'Four ___ are in the room.', options: ['woman', 'womans', 'women'], answer: 2, why: 'Four pide un plural, y el plural de woman es women.' },
          { id: 'x-i3', type: 'choice', topic: 'irregulares', q: 'The ___ are in the park.', options: ['child', 'childs', 'children'], answer: 2, why: 'Are pide un plural, y el plural de child es children.' },
          { id: 'x-i4', type: 'type', topic: 'irregulares', q: 'Escribe el plural.', ex: 'one dog, two ___  →  dogs', source: 'One tooth, two ___.', accepted: ['teeth'], show: 'teeth', why: 'Tooth es irregular: teeth.' },
          { id: 'x-i5', type: 'error', topic: 'irregulares', q: 'Una de estas frases tiene un error. Tócala.', options: ['The people are kind.', 'Two mouses are here.', 'My feet are cold.'], wrong: 1, fix: 'Two mice are here.', why: 'El plural de mouse es mice.' },
          { id: 'x-i6', type: 'order', topic: 'irregulares', q: 'Ordena las palabras para formar una frase.', tokens: ['The', 'children', 'are', 'happy.'], why: 'Primero the children, luego are y luego cómo están.' }
        ]
      }
    }
  }
};


/* ============================================================
   AUDIO: todas las frases en ingles que se pueden escuchar salen de aqui.
   Lo usan la pagina (para saber que boton mostrar), tools/generar_audios_academia.py (para crear los mp3)
   y la prueba (para comprobar que cada texto mostrado tiene su audio). Una sola fuente = el audio siempre
   corresponde al texto.
   Voces (Kokoro, local y gratis): f = af_heart (todas las frases), m = am_michael (solo el segundo hablante de un dialogo).
   Las grabaciones de Leo (screen.audio) se usan donde existan y se rotulan "Escuchar a Leo".
   ============================================================ */
function academiaSentence(item){
  if(item.say) return item.say;
  var clean = function(s){
    s = s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    return s.replace(/(^|[.!?]\s+)([a-z])/g, function(m, a, b){ return a + b.toUpperCase(); });   // una frase empieza con mayuscula
  };
  var isEn = function(s){ return /^[A-Za-z0-9'.,?!: _-]+$/.test(s) && !/^[A-B]: /.test(s); };
  if(item.type === 'choice'){
    if(item.q.indexOf('___') !== -1){ var f = clean(item.q.replace('___', item.options[item.answer])); return isEn(f) ? f : null; }
    var o = item.options[item.answer]; return isEn(o) && /[.?!]$/.test(o) ? o : null;
  }
  if(item.type === 'type'){
    if(item.source && item.source.indexOf('___') !== -1){ var g = clean(item.source.replace('___', item.show)); return isEn(g) ? g : null; }
    return item.source && /[.?!]$/.test(item.source) && /[.?!]$/.test(item.show) ? item.show : null;
  }
  if(item.type === 'order') return item.tokens.join(' ');
  if(item.type === 'error') return item.fix;
  return null;
}
function academiaAudioTexts(course){
  var out = {}, add = function(t, v){ if(t && !out[t]) out[t] = v || 'f'; };
  course.lessons.forEach(function(l){
    l.screens.forEach(function(s){
      (s.listen || []).forEach(function(x){ if(typeof x === 'string') add(x, 'f'); else add(x.t, x.v); });
      (s.items || []).forEach(function(i){ add(i.en, 'f'); });
    });
    l.canSay.forEach(function(t){ add(t, 'f'); });
    l.activities.forEach(function(a){ add(academiaSentence(a), 'f'); });
  });
  return Object.keys(out).map(function(t){ return { t: t, v: out[t] }; });
}
