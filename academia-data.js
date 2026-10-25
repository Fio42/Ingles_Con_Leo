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
      { id: 'pronombres', title: 'Pronombres personales', soon: true, blurb: 'I, you, he, she, it, we, they.' },
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
  var clean = function(s){ return s.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(); };
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
