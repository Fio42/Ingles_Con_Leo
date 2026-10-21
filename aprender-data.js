/* ============================================================
   MODO APRENDER: contenido de las microlecciones.

   Para agregar una lección nueva basta con añadir un objeto a APRENDER_LESSONS.
   No hay que tocar aprender.js ni aprender.html.

   Cada lección:
     id        estable y unico (kebab-case). Lo guarda el progreso del alumno: no se renombra.
     title     como lo ve el alumno.
     short     una frase para la lista.
     free      true = la única lección que ven las cuentas gratis (el resto es solo para miembros).
     level     A0 | A1 | A2 | B1 ... (solo informativo)
     micros    ids de microtemas de temas.js que esta lección explica (el plan adaptativo los usa
               para recomendarla cuando el alumno falla ahí).
     temas     ids de temas de temas.js (segunda opción de recomendación).
     families  ids de familias del diagnóstico (tercera opción).
     article   clase completa del sitio que amplía la lección (opcional).
     screens   4 pantallas de contenido. La quinta (practicar) la agrega el reproductor.

   Pantalla:
     type      'rule' | 'example' | 'visual' | 'trick'
     title     titulo corto de la pantalla
     text      explicacion breve en español (se muestra)
     say       lo que se lee en voz alta. Las palabras en inglés van entre {{ }} para que la voz del
               navegador las pronuncie en inglés. Sin llaves es el texto del audio mp3 de esa pantalla.
     chips     [{ a, b }]       parejas "palabra → significado/uso"
     table     { head:[...], rows:[[...]] }
     compare   { wrong, right }  error y forma correcta
     items     [{ en, es, audio? }]  ejemplos en inglés con traducción. audio = mp3 existente.
               Si no tiene audio, es audio/aprender/<id>/ej-NN.mp3 (se genera con tools/generar_audios.py).
     note      una línea extra (opcional)

   Reglas de contenido (las mismas del resto del sitio):
     - Sin rayas largas en el texto. Sin negritas sueltas. Una idea por pantalla.
     - Ninguna frase en inglés se repite entre lecciones.
   ============================================================ */
const APRENDER_LESSONS = [
  {
    id: 'to-be',
    free: true,   // la microlección de prueba para cuentas gratis (solo una lección debe tener free:true)
    title: 'To be: am, is, are',
    short: 'Ser o estar en inglés, con la palabra correcta para cada persona.',
    level: 'A0',
    micros: ['tobe-am-is-are'],
    temas: ['to-be-presente', 'there-is-are'],
    families: ['to-be'],
    article: 'articulo-verbo-to-be.html',
    screens: [
      {
        type: 'rule',
        title: 'Am, is y are: ser o estar',
        text: 'En inglés, ser y estar se dicen igual: to be. Solo cambia según quién habla.',
        chips: [
          { a: 'I', b: 'am' },
          { a: 'he · she · it', b: 'is' },
          { a: 'you · we · they', b: 'are' }
        ],
        say: 'El verbo {{to be}} significa ser o estar. Con {{I}} usamos {{am}}. Con {{he}}, {{she}} e {{it}} usamos {{is}}. Con {{you}}, {{we}} y {{they}} usamos {{are}}.'
      },
      {
        type: 'example',
        title: 'Escucha tres ejemplos',
        text: 'La misma palabra sirve para ser y para estar.',
        items: [
          { en: 'I am from Mexico.', es: 'Soy de México.', audio: 'audio/articulos/verbo-to-be/frase-01.mp3' },
          { en: 'She is tired today.', es: 'Ella está cansada hoy.', audio: 'audio/articulos/verbo-to-be/frase-04.mp3' },
          { en: 'They are at school.', es: 'Ellos están en la escuela.', audio: 'audio/articulos/verbo-to-be/frase-06.mp3' }
        ],
        say: 'Escucha cómo suena cada frase. Fíjate en que la misma palabra sirve para ser y para estar.'
      },
      {
        type: 'visual',
        title: 'También sirve para preguntar',
        text: 'Para hacer una pregunta, pasa is al inicio de la frase.',
        compare: { wrong: 'She is a nurse.', right: 'Is she a nurse?' },
        items: [
          { en: 'He is my brother.', es: 'Él es mi hermano.', audio: 'audio/articulos/verbo-to-be/frase-03.mp3' },
          { en: 'We are ready.', es: 'Estamos listos.', audio: 'audio/articulos/verbo-to-be/frase-05.mp3' },
          { en: 'Is she a nurse?', es: '¿Ella es enfermera?', audio: 'audio/articulos/verbo-to-be/frase-07.mp3' }
        ],
        say: 'Otro ejemplo. Para hacer una pregunta, pasa {{is}} al inicio de la frase. {{She is a nurse}} se convierte en {{Is she a nurse}}.'
      },
      {
        type: 'trick',
        title: 'Truco para recordarlo',
        big: 'I → am',
        text: 'Solo I va con am. Una persona o una cosa (he, she, it) va con is. Varias personas, o tú, van con are.',
        note: 'Al hablar se acorta: I\'m, she\'s, they\'re.',
        items: [
          { en: 'I\'m not sure.', es: 'No estoy seguro.', audio: 'audio/articulos/verbo-to-be/frase-08.mp3' }
        ],
        say: 'Un truco. Solo {{I}} va con {{am}}. Una persona o una cosa va con {{is}}. Varias personas, o tú, van con {{are}}. Al hablar casi siempre se acorta: {{I\'m}}, {{she\'s}}, {{they\'re}}.'
      }
    ]
  },
  {
    id: 'do-does',
    soon: true,   // 'Próximamente': no se puede abrir ni se recomienda hasta que tenga su audio (quitar esta línea para activarla)
    title: 'Do vs does',
    short: 'Cuándo usar do y cuándo does para preguntar y negar.',
    level: 'A1',
    micros: ['dodoes-elegir-sujeto'],
    temas: ['do-does'],
    families: ['presente-simple'],
    article: 'articulo-do-vs-does.html',
    screens: [
      {
        type: 'rule',
        title: 'Do o does: depende de quién',
        text: 'Se usan para preguntar y para negar en presente simple. No se usan en frases afirmativas normales.',
        chips: [
          { a: 'I · you · we · they', b: 'do' },
          { a: 'he · she · it', b: 'does' }
        ],
        say: 'Con {{I}}, {{you}}, {{we}} y {{they}} usamos {{do}}. Con {{he}}, {{she}} e {{it}} usamos {{does}}. Los dos sirven para preguntar y para negar en presente simple.'
      },
      {
        type: 'example',
        title: 'Escucha dos preguntas',
        text: 'Mira qué sujeto lleva cada una.',
        items: [
          { en: 'Do you speak English?', es: '¿Hablas inglés?', audio: 'audio/articulos/presente-simple/frase-04.mp3' },
          { en: 'Does she work on Sundays?', es: '¿Ella trabaja los domingos?', audio: 'audio/articulos/presente-simple/frase-07.mp3' },
          { en: 'Do they work on weekends?', es: '¿Ellos trabajan los fines de semana?' }
        ],
        say: 'Escucha cada pregunta y fíjate en el sujeto. {{You}} lleva {{do}}. {{She}} lleva {{does}}. {{They}} lleva {{do}}.'
      },
      {
        type: 'visual',
        title: 'Preguntas y negaciones',
        text: 'La negación se forma con don\'t o doesn\'t.',
        table: {
          head: ['Quién', 'Pregunta', 'Negación'],
          rows: [
            ['I · you · we · they', 'Do you like tea?', 'I don\'t like tea.'],
            ['he · she · it', 'Does he like tea?', 'She doesn\'t like tea.']
          ]
        },
        items: [
          { en: 'Do you like tea?', es: '¿Te gusta el té?' },
          { en: 'Does he like tea?', es: '¿A él le gusta el té?' },
          { en: 'She doesn\'t like tea.', es: 'A ella no le gusta el té.' }
        ],
        say: 'Con {{do}} la negación es {{don\'t}}. Con {{does}} la negación es {{doesn\'t}}. Escucha los ejemplos de la tabla.'
      },
      {
        type: 'trick',
        title: 'Truco: does ya lleva la s',
        big: 'does + verbo simple',
        text: 'Does ya tiene la -s de he, she, it. Por eso el verbo vuelve a su forma simple.',
        compare: { wrong: '❌ Does she works here?', right: '✅ Does she work here?' },
        items: [
          { en: 'Does she work here?', es: '¿Ella trabaja aquí?' },
          { en: 'He doesn\'t work on Sundays.', es: 'Él no trabaja los domingos.' }
        ],
        say: 'Un truco. {{Does}} ya lleva la ese de {{he}}, {{she}} e {{it}}. Por eso el verbo vuelve a su forma simple. Se dice {{Does she work here}}, y no {{Does she works here}}.'
      }
    ]
  },
  {
    id: 'can-could-should',
    soon: true,   // 'Próximamente': no se puede abrir ni se recomienda hasta que tenga su audio (quitar esta línea para activarla)
    title: 'Can, could y should',
    short: 'Poder, pedir con cortesía y dar consejos.',
    level: 'A2',
    micros: ['can-verbo-base', 'obligacion-vs-consejo'],
    temas: ['can-cant', 'modales-obligacion', 'modales-posibilidad'],
    families: ['modales'],
    article: 'articulo-verbos-modales.html',
    screens: [
      {
        type: 'rule',
        title: 'Can, could y should',
        text: 'Van antes de otro verbo y cambian el sentido de la frase.',
        chips: [
          { a: 'can', b: 'poder, saber hacer algo' },
          { a: 'could', b: 'podía, o pedir algo con cortesía' },
          { a: 'should', b: 'deberías, un consejo' }
        ],
        say: '{{Can}} dice que puedes o que sabes hacer algo. {{Could}} habla de lo que podías hacer antes, y también sirve para pedir algo con más cortesía. {{Should}} da un consejo.'
      },
      {
        type: 'example',
        title: 'Escucha tres ejemplos',
        text: 'Uno para cada palabra.',
        items: [
          { en: 'I can cook.', es: 'Sé cocinar.' },
          { en: 'Could you open the window?', es: '¿Podrías abrir la ventana?' },
          { en: 'You should rest.', es: 'Deberías descansar.' }
        ],
        say: 'Escucha tres ejemplos, uno para cada palabra. Con {{can}} hablas de una habilidad. Con {{could}} pides algo con cortesía. Con {{should}} das un consejo.'
      },
      {
        type: 'visual',
        title: 'El verbo que sigue no cambia',
        text: 'Después de un modal no hay to, ni -s, ni -ing.',
        compare: { wrong: '❌ She can swims.', right: '✅ She can swim.' },
        items: [
          { en: 'She can swim.', es: 'Ella sabe nadar.' },
          { en: 'When I was five, I could read.', es: 'Cuando tenía cinco años, podía leer.' },
          { en: 'You shouldn\'t drive when you are tired.', es: 'No deberías manejar cuando estás cansado.' }
        ],
        say: 'Después de un modal, el verbo no cambia. No lleva {{to}}, ni ese, ni {{ing}}. Se dice {{She can swim}}, y no {{She can swims}}.'
      },
      {
        type: 'trick',
        title: 'Truco para recordarlo',
        big: 'modal + verbo simple',
        text: 'El modal es el que manda. El verbo que viene después se queda quieto, sin cambios.',
        items: [
          { en: 'He should study more.', es: 'Él debería estudiar más.' },
          { en: 'Can I use your phone?', es: '¿Puedo usar tu teléfono?' }
        ],
        say: 'Un truco. El modal es el que manda, y el verbo que viene después se queda quieto. {{Can}}, {{could}} y {{should}}, más el verbo simple.'
      }
    ]
  },
  {
    id: 'in-on-at',
    soon: true,   // 'Próximamente': no se puede abrir ni se recomienda hasta que tenga su audio (quitar esta línea para activarla)
    title: 'In, on y at',
    short: 'Tres palabras para decir "en": cuándo usar cada una.',
    level: 'A1',
    micros: ['in-on-at-tiempo', 'in-on-at-lugar'],
    temas: ['in-on-at'],
    families: ['preposiciones'],
    article: 'articulo-in-on-at.html',
    screens: [
      {
        type: 'rule',
        title: 'In, on y at',
        text: 'Las tres se pueden traducir como "en". La elección depende de qué tan grande o preciso es el momento o el lugar.',
        chips: [
          { a: 'in', b: 'meses, años, ciudades, dentro de algo' },
          { a: 'on', b: 'días, calles y superficies' },
          { a: 'at', b: 'horas y puntos exactos' }
        ],
        say: '{{In}}, {{on}} y {{at}} se pueden traducir como en. {{In}} es para meses, años y ciudades. {{On}} es para días y superficies. {{At}} es para horas y puntos exactos.'
      },
      {
        type: 'example',
        title: 'Con el tiempo',
        text: 'Un ejemplo con día, otro con hora y otro con mes.',
        items: [
          { en: 'I\'m free on Monday.', es: 'Estoy libre el lunes.' },
          { en: 'The class starts at 8.', es: 'La clase empieza a las 8.' },
          { en: 'My birthday is in June.', es: 'Mi cumpleaños es en junio.' }
        ],
        say: 'Primero, el tiempo. Un día lleva {{on}}. Una hora lleva {{at}}. Un mes lleva {{in}}.'
      },
      {
        type: 'visual',
        title: 'Con lugares',
        text: 'Dentro, encima y en un punto exacto.',
        chips: [
          { a: 'in the bag', b: 'dentro de la bolsa' },
          { a: 'on the table', b: 'sobre la mesa' },
          { a: 'at the bus stop', b: 'en la parada' }
        ],
        items: [
          { en: 'The keys are in the bag.', es: 'Las llaves están en la bolsa.' },
          { en: 'The book is on the table.', es: 'El libro está sobre la mesa.' },
          { en: 'I\'m at the bus stop.', es: 'Estoy en la parada del bus.' }
        ],
        say: 'Ahora, los lugares. {{In}} es dentro de algo. {{On}} es encima de una superficie. {{At}} es en un punto exacto.'
      },
      {
        type: 'trick',
        title: 'El embudo',
        big: 'in → on → at',
        text: 'Imagina un embudo. In es lo más grande: año, mes, ciudad. On es lo del medio: día, calle, mesa. At es lo más preciso: hora, dirección, punto.',
        items: [
          { en: 'The meeting is on Friday at 3.', es: 'La reunión es el viernes a las 3.' }
        ],
        say: 'Un truco. Imagina un embudo. {{In}} es lo más grande, como un año o una ciudad. {{On}} es lo del medio, como un día o una calle. {{At}} es lo más preciso, como una hora o una dirección.'
      }
    ]
  },
  {
    id: 'presente-simple-vs-continuo',
    soon: true,   // 'Próximamente': no se puede abrir ni se recomienda hasta que tenga su audio (quitar esta línea para activarla)
    title: 'Presente simple vs presente continuo',
    short: 'Lo que haces cada día frente a lo que pasa ahora mismo.',
    level: 'A2',
    micros: ['ps-tercera-persona-s', 'ps-negativa-dont-doesnt', 'ps-adverbios-frecuencia'],
    temas: ['presente-simple', 'presente-continuo'],
    families: ['continuo', 'presente-simple'],
    article: 'articulo-presente-continuo.html',
    screens: [
      {
        type: 'rule',
        title: 'Rutina o ahora mismo',
        text: 'Rutina: verbo normal, como I work. Ahora mismo: am, is o are más el verbo con -ing, como I am working.',
        chips: [
          { a: 'Presente simple', b: 'lo que haces siempre' },
          { a: 'Presente continuo', b: 'lo que pasa ahora' }
        ],
        say: 'El presente simple habla de lo que haces siempre, como {{I work}}. El presente continuo habla de lo que pasa ahora mismo. Usa {{am}}, {{is}} o {{are}}, y el verbo con {{ing}}, como {{I am working}}.'
      },
      {
        type: 'example',
        title: 'Escucha la diferencia',
        text: 'Es la misma persona, pero dos momentos distintos.',
        items: [
          { en: 'She works every day.', es: 'Ella trabaja todos los días.', audio: 'audio/articulos/presente-simple/frase-02.mp3' },
          { en: 'She is working now.', es: 'Ella está trabajando ahora.' },
          { en: 'We usually eat breakfast at 7.', es: 'Normalmente desayunamos a las 7.', audio: 'audio/articulos/presente-simple/frase-06.mp3' }
        ],
        say: 'Escucha la diferencia. {{She works every day}} es una rutina. {{She is working now}} está pasando en este momento.'
      },
      {
        type: 'visual',
        title: 'Palabras que te ayudan',
        text: 'Ciertas palabras avisan cuál tiempo usar.',
        table: {
          head: ['Presente simple', 'Presente continuo'],
          rows: [
            ['every day · usually · always', 'now · today · at the moment']
          ]
        },
        items: [
          { en: 'I work from home.', es: 'Trabajo desde casa.', audio: 'audio/articulos/presente-simple/frase-01.mp3' },
          { en: 'I am working from home today.', es: 'Hoy estoy trabajando desde casa.' }
        ],
        say: 'Hay palabras que te avisan. {{Every day}}, {{usually}} y {{always}} piden presente simple. {{Now}}, {{today}} y {{at the moment}} piden presente continuo.'
      },
      {
        type: 'trick',
        title: 'Pregúntate: ¿cada día o ahora?',
        big: '¿Cada día o ahora?',
        text: 'Cada día: verbo normal, con -s en he, she, it. Ahora: am, is o are y el verbo con -ing.',
        compare: { wrong: '❌ I working now.', right: '✅ I am working now.' },
        items: [
          { en: 'He is playing soccer now.', es: 'Él está jugando fútbol ahora.' }
        ],
        say: 'Un truco. Pregúntate: ¿es cada día o es ahora? Si es cada día, usa el verbo normal. Si es ahora, usa {{am}}, {{is}} o {{are}} y el verbo con {{ing}}. Se dice {{I am working now}}, y no {{I working now}}.'
      }
    ]
  }
];

/* Ayudas compartidas (las usan aprender.js y las pruebas). */
function aprenderPlainSay(say){ return String(say || '').replace(/\{\{|\}\}/g, ''); }
function aprenderExplainAudio(lessonId, screenIndex){ return 'audio/aprender/' + lessonId + '/exp-' + String(screenIndex + 1).padStart(2, '0') + '.mp3'; }
/* Devuelve los ejemplos de una lección con su ruta de audio ya resuelta (ej-NN.mp3 numerados en toda la lección). */
function aprenderResolveItems(lesson){
  let n = 0;
  return lesson.screens.map(function(sc){
    return (sc.items || []).map(function(it){
      n++;
      return { en: it.en, es: it.es, audio: it.audio || ('audio/aprender/' + lesson.id + '/ej-' + String(n).padStart(2, '0') + '.mp3'), existing: !!it.audio };
    });
  });
}
if(typeof module !== 'undefined') module.exports = { APRENDER_LESSONS, aprenderPlainSay, aprenderExplainAudio, aprenderResolveItems };
