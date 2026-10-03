/* ============================================================
   REGISTRO CENTRAL DE TEMAS DE GRAMATICA (Fase 1)
   Una sola fuente para responder "que recurso corresponde a este tema".

   - topics:   las etiquetas EXACTAS de GRAMMAR_BANK (data.js). La tabla
               etiqueta -> tema es explicita (sin regex). Todo topic nuevo en
               data.js debe agregarse aqui: tools/tests/temas.test.js lo exige.
   - family:   id de DIAG_GRAMMAR_FAMILIES (app.js), el nivel superior del
               diagnostico. null = el tema todavia no pertenece a ninguna
               familia (no entra al diagnostico, igual que hoy).
   - article:  clase completa (archivo .html en la raiz) o null.
   - glossary: slug de /glosario/<slug>/ (explicacion rapida) o null.
   - prereq:   (opcional) ids de temas que conviene dominar antes. Leo AI solo
               puede sugerir un tema de esta lista o de los que el sitio ya
               detecto como flojos; nunca escribe enlaces.
   Si un tema no tiene article, no se muestra "Ver clase". Si no tiene
   tampoco glossary, no se muestra ningun enlace. Nunca se aproxima.
   ============================================================ */
const TEMAS = [
  /* ---- bases ---- */
  { id:'numeros-basicos', label:'Los números en inglés', family:'bases', article:'articulo-numeros-en-ingles.html', glossary:null,
    topics:[`Los números (1-10)`, `Números parecidos que confunden (13 vs 30, 14 vs 40...)`] },
  { id:'basicos-ingles', label:'Plural, colores, días y respuestas básicas', family:'bases', article:null, glossary:null,
    topics:[`Los colores`, `Los días de la semana`, `Plural: agregar "-s"`, `Yes / No básico`, `Preguntas simples: "What is this?"`] },
  { id:'question-words', label:'Palabras de pregunta (what, where, when, who)', family:'bases', article:null, glossary:null,
    topics:[`Question words (What / Where / When / Who)`] },
  /* ---- comparativos ---- */
  { id:'comparativos', label:'Comparativos', family:'comparativos', article:null, glossary:null,
    topics:[`Comparativos (-er / more ... than)`, `Comparativos de igualdad (as...as)`] },
  /* ---- condicionales ---- */
  { id:'condicionales', prereq:['will-going-to'], label:'Condicionales', family:'condicionales', article:null, glossary:null,
    topics:[`Conditionals (tipo 1 y 2)`, `Condicional tipo 3`, `Condicionales mixtos`, `Condicionales, comparativos y presente perfecto`] },
  { id:'wish', prereq:['condicionales'], label:'Wish e if only', family:'condicionales', article:null, glossary:null,
    topics:[`Wish / If only`, `Wish, estilo indirecto y pasado perfecto`] },
  /* ---- conectores ---- */
  { id:'conectores-contraste', label:'Although, despite y even though', family:'conectores', article:null, glossary:'although',
    topics:[`Despite / Although / Instead of`, `Despite vs In spite of vs Even though`] },
  { id:'secuenciadores', label:'Secuenciadores (first, then, finally)', family:'conectores', article:null, glossary:null,
    topics:[`Secuenciadores (first, then, after that, finally)`] },
  { id:'conectores-avanzados', label:'Conectores avanzados', family:'conectores', article:null, glossary:'however',
    topics:[`Conectores avanzados`] },
  /* ---- palabras que se confunden ---- */
  { id:'its-vs-its', label:`Its vs it's`, family:'confusiones', article:null, glossary:'its-vs-it-s', topics:[`Its vs It's`] },
  { id:'then-vs-than', label:'Then vs than', family:'confusiones', article:null, glossary:'then-vs-than', topics:[`Then vs Than`] },
  { id:'your-vs-youre', label:`Your vs you're`, family:'confusiones', article:null, glossary:'your-vs-youre', topics:[`"Your" vs "You're"`] },
  { id:'there-their-theyre', label:`There, their y they're`, family:'confusiones', article:null, glossary:'their-there-theyre', topics:[`There / Their / They're`] },
  { id:'to-too-two', label:'To, too y two', family:'confusiones', article:null, glossary:null, topics:[`"To" vs "Too" vs "Two"`] },
  { id:'lose-vs-loose', label:'Lose vs loose', family:'confusiones', article:null, glossary:'lose-vs-loose', topics:[`"Lose" vs "Loose"`] },
  { id:'good-vs-well', label:'Good vs well', family:'confusiones', article:null, glossary:'good-vs-well', topics:[`Good vs Well`] },
  { id:'say-vs-tell', label:'Say vs tell', family:'confusiones', article:null, glossary:'say-vs-tell', topics:[`"Say" vs "Tell"`] },
  { id:'borrow-vs-lend', label:'Borrow vs lend', family:'confusiones', article:null, glossary:'borrow-vs-lend', topics:[`Borrow vs Lend (prestar)`] },
  { id:'bring-vs-take', label:'Bring vs take', family:'confusiones', article:null, glossary:'bring-vs-take', topics:[`Bring vs Take`] },
  { id:'affect-vs-effect', label:'Affect vs effect', family:'confusiones', article:null, glossary:'affect-vs-effect', topics:[`Affect vs Effect`] },
  { id:'as-vs-like', label:'As vs like', family:'confusiones', article:null, glossary:'as-vs-like', topics:[`As vs Like`] },
  { id:'actually-currently', label:'Actually y currently', family:'confusiones', article:null, glossary:'actually', topics:[`Actually / Currently`] },
  { id:'palabras-parecidas', label:'Palabras que se parecen (advice, lay, further, quiet)', family:'confusiones', article:null, glossary:null,
    topics:[`"Advice" vs "Advise"`, `"Lay" vs "Lie"`, `Farther vs Further`, `Quiet vs Quite vs Quit`] },
  { id:'matices-formales', label:'Matices: formal, natural y -ed vs -ing', family:'confusiones', article:null, glossary:null,
    topics:[`Formal vs natural / matices`, `Participios como adjetivos (-ed vs -ing)`] },
  /* ---- presente continuo ---- */
  { id:'presente-continuo', prereq:['to-be-presente'], label:'Presente continuo', family:'continuo', article:null, glossary:null, topics:[`Presente continuo (I am ___ing)`] },
  /* ---- cuantificadores ---- */
  { id:'much-many', prereq:['contables-incontables'], label:'Much y many', family:'cuantificadores', article:null, glossary:'much-vs-many',
    topics:[`Much / Many`, `Cuantificadores (a lot of / much / many / few / little)`] },
  { id:'fewer-vs-less', prereq:['contables-incontables'], label:'Fewer vs less', family:'cuantificadores', article:null, glossary:'fewer-vs-less', topics:[`"Fewer" vs "Less"`] },
  { id:'little-few', prereq:['contables-incontables'], label:'A little, little, a few y few', family:'cuantificadores', article:null, glossary:null, topics:[`A little / Little / A few / Few`] },
  { id:'some-any', label:'Some y any', family:'cuantificadores', article:null, glossary:null, topics:[`Some / Any`] },
  { id:'contables-incontables', label:'Sustantivos contables e incontables', family:'cuantificadores', article:null, glossary:null, topics:[`Sustantivos contables e incontables`] },
  /* ---- demostrativos ---- */
  { id:'a-an', label:'A y an', family:'demostrativos', article:null, glossary:'a-vs-an', topics:[`A / An`] },
  { id:'this-that', label:'This, that, these y those', family:'demostrativos', article:null, glossary:null,
    topics:[`"This is..." (esto es...)`, `This / These`, `This / That / These / Those`] },
  /* ---- futuro / indirecto ---- */
  { id:'will-going-to', prereq:['presente-simple'], label:'Will y going to', family:'futuro', article:null, glossary:null, topics:[`Will vs Going to (futuro)`] },
  { id:'estilo-indirecto', prereq:['pasado-regulares'], label:'Estilo indirecto (reported speech)', family:'indirecto', article:null, glossary:null,
    topics:[`Reported Speech`, `Discurso indirecto con matices`] },
  /* ---- modales ---- */
  { id:'can-cant', label:'Can y can\'t', family:'modales', article:null, glossary:null, topics:[`Can / Can't (habilidad)`] },
  { id:'modales-obligacion', label:'Must, have to y should', family:'modales', article:null, glossary:null,
    topics:[`Verbos modales de obligación (must / have to / should)`] },
  { id:'modales-posibilidad', label:'May, might y could', family:'modales', article:null, glossary:null,
    topics:[`Verbos modales de posibilidad (may / might / could)`] },
  { id:'modales-perfectos', prereq:['modales-obligacion'], label:'Should have y must have', family:'modales', article:null, glossary:'should-have',
    topics:[`Modales perfectos (must have been / should have gone)`] },
  /* ---- pasado ---- */
  { id:'pasado-regulares', prereq:['presente-simple'], label:'Pasado simple (verbos regulares)', family:'pasado', article:'articulo-pasado-simple.html', glossary:null,
    topics:[`Pasado simple con verbos regulares (-ed)`] },
  { id:'verbos-irregulares', prereq:['pasado-regulares'], label:'Verbos irregulares en pasado', family:'pasado', article:'articulo-verbos-irregulares.html', glossary:null,
    topics:[`Pasado simple con verbos irregulares`] },
  { id:'used-to', prereq:['pasado-regulares'], label:'Used to', family:'pasado', article:null, glossary:'used-to', topics:[`"Used to"`] },
  /* ---- pasiva ---- */
  { id:'voz-pasiva', prereq:['verbos-irregulares'], label:'Voz pasiva', family:'pasiva', article:null, glossary:null,
    topics:[`Voz pasiva (presente y pasado simple)`, `Voz pasiva con modales (should be / must have been)`] },
  { id:'causativos', label:'Verbos causativos (have something done)', family:'pasiva', article:null, glossary:null, topics:[`Verbos causativos (have something done)`] },
  /* ---- perfecto ---- */
  { id:'present-perfect-vs-past', prereq:['verbos-irregulares'], label:'Presente perfecto vs pasado simple', family:'perfecto', article:'articulo-presente-perfecto.html', glossary:null,
    topics:[`Present Perfect vs Past Simple`] },
  { id:'since-for', prereq:['present-perfect-vs-past'], label:'Since y for', family:'perfecto', article:'articulo-presente-perfecto.html', glossary:'since-vs-for', topics:[`Since / For`] },
  { id:'past-perfect', prereq:['present-perfect-vs-past'], label:'Pasado perfecto (past perfect)', family:'perfecto', article:null, glossary:null, topics:[`Past Perfect`] },
  /* ---- preposiciones ---- */
  { id:'in-on-at', label:'In, on y at', family:'preposiciones', article:'articulo-in-on-at.html', glossary:null, topics:[`In / On / At`] },
  { id:'by-until', label:'By y until', family:'preposiciones', article:null, glossary:null, topics:[`By vs Until`, `By vs Until (en el trabajo)`] },
  { id:'preposiciones-movimiento', label:'Preposiciones de movimiento (to, into, from)', family:'preposiciones', article:null, glossary:null,
    topics:[`Preposiciones de movimiento (to / into / from)`] },
  { id:'preposiciones-sutiles', label:'Preposiciones sutiles (beside, besides...)', family:'preposiciones', article:null, glossary:null,
    topics:[`Preposiciones sutiles`, `"Beside" vs "Besides"`] },
  /* ---- presente simple ---- */
  { id:'presente-simple', prereq:['to-be-presente'], label:'Presente simple', family:'presente-simple', article:'articulo-presente-simple.html', glossary:null,
    topics:[`Presente simple y "to be"`, `Adverbios de frecuencia (always / usually / sometimes / never)`] },
  { id:'do-does', prereq:['presente-simple'], label:'Do y does', family:'presente-simple', article:'articulo-do-vs-does.html', glossary:null,
    topics:[`Do / Does`, `Preguntas con Do/Does en presente simple`] },
  /* ---- pronombres ---- */
  { id:'pronombres', label:'Pronombres (sujeto y objeto)', family:'pronombres', article:null, glossary:null,
    topics:[`He / She / It (pronombres)`, `Pronombres objeto (me / you / him / her / it / us / them)`] },
  { id:'posesivos', label:'Posesivos (my, your, his, her...)', family:'pronombres', article:null, glossary:null,
    topics:[`Adjetivos posesivos simples (my / your)`, `His / Her (posesivos simples)`, `Posesivos (my / your / his / her / our / their)`] },
  /* ---- relativas ---- */
  { id:'relativas', prereq:['pronombres'], label:'Cláusulas relativas', family:'relativas', article:null, glossary:null,
    topics:[`Cláusulas relativas (who / which / that)`, `Cláusulas relativas reducidas`] },
  { id:'who-whom', prereq:['relativas'], label:'Who y whom', family:'relativas', article:null, glossary:null, topics:[`Who vs Whom`, `Who / Whom`] },
  /* ---- to be ---- */
  { id:'to-be-presente', label:'Verbo to be (am, is, are)', family:'to-be', article:'articulo-verbo-to-be.html', glossary:null,
    topics:[`Is / Are (singular y plural)`, `Verbo "to be": am / is / are`, `Verbo to be, have y there is/are`] },
  { id:'was-were', prereq:['to-be-presente'], label:'Was y were', family:'to-be', article:'articulo-verbo-to-be.html', glossary:'was-vs-were', topics:[`"To be" en pasado: was / were`] },
  /* ---- verbos ---- */
  { id:'phrasal-verbs', label:'Phrasal verbs', family:'verbos', article:'articulo-phrasal-verbs.html', glossary:'look-for',
    topics:[`Phrasal verbs comunes (look for / give up / find out)`] },
  { id:'gerundios-infinitivos', label:'Gerundios e infinitivos', family:'verbos', article:null, glossary:null,
    topics:[`Gerundios vs infinitivos (like doing / want to do)`] },
  { id:'verbo-have', label:'Verbo have', family:'verbos', article:null, glossary:null, topics:[`Verbo "have" (tengo / tienes / tiene)`] },
  { id:'colocaciones', label:'Make y do (colocaciones)', family:'verbos', article:null, glossary:'make-vs-do', topics:[`Colocaciones avanzadas (make vs do)`] },
  /* ---- temas que todavia no pertenecen a ninguna familia (no entran al diagnostico) ---- */
  { id:'question-tags', label:'Question tags', family:null, article:null, glossary:null, topics:[`Question tags (¿verdad? / ¿no es así?)`] },
  { id:'inversion-enfasis', label:'Inversión y oraciones enfáticas', family:null, article:null, glossary:'would-rather',
    topics:[`Inversiones enfáticas`, `Inversión, would rather y it's high time`, `Oraciones enfáticas con "It is... that" (cleft sentences)`] },
  { id:'subjuntivo-formal', label:'Subjuntivo formal', family:null, article:null, glossary:null, topics:[`Subjuntivo formal (It is essential that...)`] },
  { id:'hedging', label:'Enfatizadores y hedging', family:null, article:null, glossary:null, topics:[`Enfatizadores y hedging (arguably, tend to, likely)`] },

  /* ---- VOCABULARIO (skill:'vocabulary') ----
     VOCAB_BANK no trae etiquetas por palabra, pero cada grupo de palabras tiene un
     prefijo de id estable ("v-medio4-1", "v-facil-numeros-3" -> grupo "medio4",
     "facil-numeros"). Un tema de vocabulario es una lista EXPLICITA de grupos cuyas
     palabras comparten un tema real (se ve en las propias palabras y explicaciones).
     Los grupos de palabras generales sin tema común van en VOCAB_GRUPOS_SIN_TEMA:
     siguen contando para "Vocabulario", pero no para un tema. tools/tests/temas.test.js
     exige que todo grupo nuevo de data.js se clasifique en uno u otro. */
  { id:'vocab-confusas', skill:'vocabulary', label:'Palabras que se confunden', family:null, article:null, glossary:null, topics:[],
    groups:['principiante5', 'facil9', 'medio8', 'medio9', 'avanzado8', 'avanzado9'] },
  { id:'vocab-numeros', skill:'vocabulary', label:'Números, precios y datos personales', family:null, article:'articulo-numeros-en-ingles.html', glossary:null, topics:[],
    groups:['principiante-numeros', 'facil-numeros', 'medio-numeros'] },
  { id:'vocab-trabajo', skill:'vocabulary', label:'Trabajo y negocios', family:null, article:null, glossary:null, topics:[],
    groups:['medio6', 'medio-m300', 'avz4', 'avz6'] },
  { id:'vocab-viajes', skill:'vocabulary', label:'Viajes', family:null, article:null, glossary:null, topics:[], groups:['medio4'] },
  { id:'vocab-compras', skill:'vocabulary', label:'Compras y pagos', family:null, article:null, glossary:null, topics:[], groups:['facil4'] },
  { id:'vocab-vida-diaria', skill:'vocabulary', label:'Vida diaria y casa', family:null, article:null, glossary:null, topics:[], groups:['facil', 'facil5', 'facil6'] },

  /* ---- LISTENING (skill:'listening') ----
     Cada ejercicio de Listening es UNA frase (o un mini diálogo) + una pregunta, sin
     etiquetas. Los temas son patrones auditivos que se distinguen de forma fiable por
     datos que ya tiene el ejercicio (la pregunta, el transcript), y la lista de abajo
     es EXPLICITA (ids sin el prefijo "l-"). Criterio de cada tema, por prioridad:
       1. listening-numeros          la pregunta pide un dato numérico (How many/much, What time,
                                     How old/long, What year, el número/dirección/código...) o el
                                     grupo es "*-numeros"
       2. listening-conversaciones   el transcript es un diálogo (turnos con "—")
       3. listening-condicionales    if / unless / would have, o empieza con Had / Were it / Should
       4. listening-contraste        not / never / n't / but / except / although / though / despite /
                                     nevertheless / whereas / however / instead, o "Not only/until"
     Todo ejercicio que no cumple ninguno queda SIN TEMA a propósito (lo general).
     tools/tests/temas.test.js aplica estos mismos criterios y falla si un ejercicio nuevo
     cumple uno y falta en la lista (o si algún id ya no existe). */
  { id:'listening-numeros', skill:'listening', label:'Números, horas y precios', family:null, article:'articulo-numeros-en-ingles.html', glossary:null, topics:[],
    items:[
    'principiante-3', 'principiante3-3', 'principiante4-2', 'principiante6-2', 'principiante9-3', 'principiante-m300-5', 'principiante-m200-4',
    'principiante-numeros-1', 'principiante-numeros-2', 'principiante-numeros-3', 'principiante-m400-1', 'principiante-m400-3', 'facil-1',
    'facil7-1', 'facil7-3', 'facil14-3', 'facil-m200-4', 'facil-numeros-1', 'facil-numeros-2', 'facil-numeros-3', 'medio4-2', 'medio-numeros-1',
    'medio-numeros-2', 'medio-numeros-3', 'avanzado-numeros-1', 'avanzado-numeros-2', 'avanzado-numeros-3'
    ] },
  { id:'listening-conversaciones', skill:'listening', label:'Conversaciones entre dos personas', family:null, article:null, glossary:null, topics:[],
    items:[
    'principiante-m400-4', 'facil-m300-5', 'facil-m400-4', 'facil-m400-5', 'medio-m300-3', 'medio-m400-4', 'medio-m400-5', 'avanzado-m300-2',
    'avanzado-m400-4', 'avanzado-m400-5'
    ] },
  { id:'listening-condicionales', skill:'listening', label:'Condicionales y frases con "would have"', family:null, article:null, glossary:null, topics:[],
    items:[
    'facil-m200-2', 'medio-3', 'medio3-1', 'medio4-3', 'medio5-1', 'medio6-3', 'medio8-1', 'medio11-3', 'medio-m200-3', 'medio-m400-2', 'avz-1',
    'avz4-3', 'avz5-2', 'avz6-3', 'avz7-3', 'avanzado-m200-2', 'avanzado-m400-1'
    ] },
  { id:'listening-contraste', skill:'listening', label:'Negaciones y contrastes (not, but, although)', family:null, article:null, glossary:'although', topics:[],
    items:[
    'principiante8-4', 'facil-2', 'facil2-1', 'facil5-1', 'facil5-3', 'facil7-2', 'facil12-3', 'facil-m200-3', 'medio3-2', 'medio4-1', 'medio6-1',
    'medio7-3', 'medio11-1', 'medio10-2', 'medio-m200-1', 'medio-m400-3', 'avz-3', 'avz2-1', 'avz4-1', 'avz6-4', 'avz7-1', 'avanzado11-2',
    'avanzado10-2', 'avanzado-m100-4', 'avanzado-m200-1', 'avanzado-m400-3'
    ] }
];

// Grupos de VOCAB_BANK sin un tema común (palabras generales o mezcladas).
const VOCAB_GRUPOS_SIN_TEMA = [
  'principiante', 'principiante2', 'principiante3', 'principiante4', 'principiante6', 'principiante-m100', 'principiante-m200', 'principiante-m300', 'principiante-m400',
  'facil2', 'facil3', 'facil7', 'facil8', 'facil10', 'facil-m100', 'facil-m200', 'facil-m300', 'facil-m400',
  'medio', 'medio2', 'medio3', 'medio5', 'medio7', 'medio10', 'medio-m100', 'medio-m200', 'medio-m400',
  'avz', 'avz2', 'avz3', 'avz5', 'avanzado7', 'avanzado10', 'avanzado-m100', 'avanzado-m200', 'avanzado-m300', 'avanzado-m400'
];

const TEMA_BY_ID = TEMAS.reduce((m, t)=>{ m[t.id] = t; return m; }, {});
const TEMA_BY_TOPIC = TEMAS.reduce((m, t)=>{ t.topics.forEach(topic=>{ m[topic] = t; }); return m; }, {});
// Tema de una etiqueta de data.js (o null si todavia no esta en el registro).
function temaForTopic(topic){ return (topic && TEMA_BY_TOPIC[topic]) || null; }

// Vocabulario: grupo de una palabra ("medio4-3" -> "medio4") y su tema (o null).
const TEMA_BY_VOCAB_GROUP = TEMAS.reduce((m, t)=>{ (t.groups || []).forEach(g=>{ m[g] = t; }); return m; }, {});
function vocabGroupOf(itemId){ return String(itemId || '').replace(/^v-/, '').replace(/-\d+$/, ''); }
function temaForVocabItem(itemId){ return TEMA_BY_VOCAB_GROUP[vocabGroupOf(itemId)] || null; }

// Listening: lista explícita de ids (guardados sin el prefijo "l-") -> tema (o null = general).
const TEMA_BY_LISTENING_ITEM = TEMAS.reduce((m, t)=>{ (t.items || []).forEach(i=>{ m[i] = t; }); return m; }, {});
function temaForListeningItem(itemId){ return TEMA_BY_LISTENING_ITEM[String(itemId || '').replace(/^l-/, '')] || null; }
