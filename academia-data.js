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
      { id: 'articulos', title: 'Artículos y plurales', blurb: 'A, an, the y cómo formar plurales.' },
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

    // CURSO PROTEGIDO: aqui solo el esqueleto publico (temario comercial). El contenido se entrega desde el servidor a miembros.
    'articulos': {
      "id": "articulos",
      "title": "Artículos y plurales",
      "name": "Artículos y plurales",
      "short": "A, an, the y plurales",
      "tagline": "Aprende cuándo usar a, an, the o ningún artículo, y cómo formar el plural.",
      "goal": "Al terminar podrás elegir entre a, an, the o ningún artículo, y formar plurales regulares e irregulares con seguridad.",
      "protected": true,
      "topics": {
        "aan": "A y an",
        "the": "The",
        "general": "A, an, the o ningún artículo",
        "plurales": "Plurales regulares",
        "irregulares": "Plurales irregulares"
      },
      "lessons": [
        {
          "id": "a-an",
          "n": 1,
          "minutes": 6,
          "topic": "aan",
          "title": "A y an",
          "summary": "Decir \"un\" o \"una\" y elegir entre a y an.",
          "activityIds": [
            "l1-a1",
            "l1-a2",
            "l1-a3",
            "l1-a4",
            "l1-a5",
            "l1-a6",
            "l1-a7",
            "l1-a8"
          ]
        },
        {
          "id": "the",
          "n": 2,
          "minutes": 6,
          "topic": "the",
          "title": "The",
          "summary": "Hablar de algo concreto: el, la, los y las.",
          "activityIds": [
            "l2-a1",
            "l2-a2",
            "l2-a3",
            "l2-a4",
            "l2-a5",
            "l2-a6",
            "l2-a7",
            "l2-a8"
          ]
        },
        {
          "id": "a-an-the-nada",
          "n": 3,
          "minutes": 7,
          "topic": "general",
          "title": "A, an, the o ningún artículo",
          "summary": "Elegir bien entre las tres opciones, incluida la de no poner artículo.",
          "activityIds": [
            "l3-a1",
            "l3-a2",
            "l3-a3",
            "l3-a4",
            "l3-a5",
            "l3-a6",
            "l3-a7",
            "l3-a8"
          ]
        },
        {
          "id": "plurales-regulares",
          "n": 4,
          "minutes": 7,
          "topic": "plurales",
          "title": "Plurales regulares",
          "summary": "Formar el plural con -s, -es y -ies, y los casos con -o y -f.",
          "activityIds": [
            "l4-a1",
            "l4-a2",
            "l4-a3",
            "l4-a4",
            "l4-a5",
            "l4-a6",
            "l4-a7",
            "l4-a8"
          ]
        },
        {
          "id": "plurales-irregulares",
          "n": 5,
          "minutes": 7,
          "topic": "irregulares",
          "title": "Plurales irregulares y repaso",
          "summary": "Los plurales que cambian de forma y un repaso de todo el curso.",
          "activityIds": [
            "l5-a1",
            "l5-a2",
            "l5-a3",
            "l5-a4",
            "l5-a5",
            "l5-a6",
            "l5-a7",
            "l5-a8"
          ]
        }
      ],
      "exam": {
        "id": "articulos-final",
        "n": 6,
        "title": "Evaluación final (práctica)",
        "bank": [],
        "practiceIds": [
          {
            "id": "x-a1",
            "topic": "aan"
          },
          {
            "id": "x-a2",
            "topic": "aan"
          },
          {
            "id": "x-a3",
            "topic": "aan"
          },
          {
            "id": "x-a4",
            "topic": "aan"
          },
          {
            "id": "x-a5",
            "topic": "aan"
          },
          {
            "id": "x-a6",
            "topic": "aan"
          },
          {
            "id": "x-t1",
            "topic": "the"
          },
          {
            "id": "x-t2",
            "topic": "the"
          },
          {
            "id": "x-t3",
            "topic": "the"
          },
          {
            "id": "x-t4",
            "topic": "the"
          },
          {
            "id": "x-t5",
            "topic": "the"
          },
          {
            "id": "x-t6",
            "topic": "the"
          },
          {
            "id": "x-g1",
            "topic": "general"
          },
          {
            "id": "x-g2",
            "topic": "general"
          },
          {
            "id": "x-g3",
            "topic": "general"
          },
          {
            "id": "x-g4",
            "topic": "general"
          },
          {
            "id": "x-g5",
            "topic": "general"
          },
          {
            "id": "x-g6",
            "topic": "general"
          },
          {
            "id": "x-p1",
            "topic": "plurales"
          },
          {
            "id": "x-p2",
            "topic": "plurales"
          },
          {
            "id": "x-p3",
            "topic": "plurales"
          },
          {
            "id": "x-p4",
            "topic": "plurales"
          },
          {
            "id": "x-p5",
            "topic": "plurales"
          },
          {
            "id": "x-p6",
            "topic": "plurales"
          },
          {
            "id": "x-i1",
            "topic": "irregulares"
          },
          {
            "id": "x-i2",
            "topic": "irregulares"
          },
          {
            "id": "x-i3",
            "topic": "irregulares"
          },
          {
            "id": "x-i4",
            "topic": "irregulares"
          },
          {
            "id": "x-i5",
            "topic": "irregulares"
          },
          {
            "id": "x-i6",
            "topic": "irregulares"
          }
        ]
      }
    },

    // CURSO PROTEGIDO (Curso 4, OCULTO hasta que Leo lo autorice): solo esqueleto publico.
    'posesivos': {
      "id": "posesivos",
      "title": "Posesivos y demostrativos",
      "name": "Posesivos y demostrativos",
      "short": "My, your, this, that",
      "tagline": "Di de quién es algo y señala lo que está cerca o lejos: my, your, this, that, these y those.",
      "goal": "Al terminar podrás usar my, your, his, her, its, our y their, y señalar cosas con this, that, these y those en frases completas.",
      "protected": true,
      "topics": {
        "my": "My, your, his, her",
        "our": "Its, our, their",
        "this": "This y that",
        "plural": "These y those",
        "juntos": "Posesivos y demostrativos juntos"
      },
      "lessons": [
        {
          "id": "my-your-his-her",
          "n": 1,
          "minutes": 6,
          "topic": "my",
          "title": "My, your, his, her",
          "summary": "Decir de quién es algo: mi, tu, su de él y su de ella.",
          "activityIds": [
            "l1-a1",
            "l1-a2",
            "l1-a3",
            "l1-a4",
            "l1-a5",
            "l1-a6",
            "l1-a7",
            "l1-a8"
          ]
        },
        {
          "id": "its-our-their",
          "n": 2,
          "minutes": 6,
          "topic": "our",
          "title": "Its, our, their",
          "summary": "Hablar de cosas nuestras, de ellos y de animales, y no confundir its con it's.",
          "activityIds": [
            "l2-a1",
            "l2-a2",
            "l2-a3",
            "l2-a4",
            "l2-a5",
            "l2-a6",
            "l2-a7",
            "l2-a8"
          ]
        },
        {
          "id": "this-that",
          "n": 3,
          "minutes": 6,
          "topic": "this",
          "title": "This y that",
          "summary": "Señalar una cosa cerca (this) o lejos (that).",
          "activityIds": [
            "l3-a1",
            "l3-a2",
            "l3-a3",
            "l3-a4",
            "l3-a5",
            "l3-a6",
            "l3-a7",
            "l3-a8"
          ]
        },
        {
          "id": "these-those",
          "n": 4,
          "minutes": 6,
          "topic": "plural",
          "title": "These y those",
          "summary": "Señalar varias cosas cerca (these) o lejos (those), con are.",
          "activityIds": [
            "l4-a1",
            "l4-a2",
            "l4-a3",
            "l4-a4",
            "l4-a5",
            "l4-a6",
            "l4-a7",
            "l4-a8"
          ]
        },
        {
          "id": "posesivos-y-demostrativos",
          "n": 5,
          "minutes": 7,
          "topic": "juntos",
          "title": "Posesivos y demostrativos juntos",
          "summary": "Armar frases completas como This is my book y Those are their bags.",
          "activityIds": [
            "l5-a1",
            "l5-a2",
            "l5-a3",
            "l5-a4",
            "l5-a5",
            "l5-a6",
            "l5-a7",
            "l5-a8"
          ]
        }
      ],
      "exam": {
        "id": "posesivos-final",
        "n": 6,
        "title": "Evaluación final (práctica)",
        "bank": [],
        "practiceIds": [
          {
            "id": "x-m1",
            "topic": "my"
          },
          {
            "id": "x-m2",
            "topic": "my"
          },
          {
            "id": "x-m3",
            "topic": "my"
          },
          {
            "id": "x-m4",
            "topic": "my"
          },
          {
            "id": "x-m5",
            "topic": "my"
          },
          {
            "id": "x-m6",
            "topic": "my"
          },
          {
            "id": "x-o1",
            "topic": "our"
          },
          {
            "id": "x-o2",
            "topic": "our"
          },
          {
            "id": "x-o3",
            "topic": "our"
          },
          {
            "id": "x-o4",
            "topic": "our"
          },
          {
            "id": "x-o5",
            "topic": "our"
          },
          {
            "id": "x-o6",
            "topic": "our"
          },
          {
            "id": "x-t1",
            "topic": "this"
          },
          {
            "id": "x-t2",
            "topic": "this"
          },
          {
            "id": "x-t3",
            "topic": "this"
          },
          {
            "id": "x-t4",
            "topic": "this"
          },
          {
            "id": "x-t5",
            "topic": "this"
          },
          {
            "id": "x-t6",
            "topic": "this"
          },
          {
            "id": "x-p1",
            "topic": "plural"
          },
          {
            "id": "x-p2",
            "topic": "plural"
          },
          {
            "id": "x-p3",
            "topic": "plural"
          },
          {
            "id": "x-p4",
            "topic": "plural"
          },
          {
            "id": "x-p5",
            "topic": "plural"
          },
          {
            "id": "x-p6",
            "topic": "plural"
          },
          {
            "id": "x-j1",
            "topic": "juntos"
          },
          {
            "id": "x-j2",
            "topic": "juntos"
          },
          {
            "id": "x-j3",
            "topic": "juntos"
          },
          {
            "id": "x-j4",
            "topic": "juntos"
          },
          {
            "id": "x-j5",
            "topic": "juntos"
          },
          {
            "id": "x-j6",
            "topic": "juntos"
          }
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
    if(!l.screens) return;      // curso protegido sin hidratar: solo esqueleto
    l.screens.forEach(function(s){
      (s.listen || []).forEach(function(x){ if(typeof x === 'string') add(x, 'f'); else add(x.t, x.v); });
      (s.items || []).forEach(function(i){ add(i.en, 'f'); });
    });
    l.canSay.forEach(function(t){ add(t, 'f'); });
    l.activities.forEach(function(a){ add(academiaSentence(a), 'f'); });
  });
  return Object.keys(out).map(function(t){ return { t: t, v: out[t] }; });
}
