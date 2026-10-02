// Genera mini-lecciones.js (los temas de la tarjeta "Siguiente refuerzo" del
// inicio) a partir de los temas reales de GRAMMAR_BANK en data.js. Asi
// index.html no tiene que descargar todo data.js (casi 900 KB) solo para
// mostrar un tema.
// Uso (desde la carpeta del proyecto):  node tools/generar_mini_lecciones.js
//
// Cada tema de data.js se muestra con una etiqueta corta (maximo ~17
// caracteres: en celular la tarjeta es angosta y una etiqueta mas larga
// la hace crecer y pisar la ficha de Leo AI). Si agregas un tema nuevo en
// data.js, el script avisa y lo incluye con su nombre sin parentesis.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n;this.GB = GRAMMAR_BANK;', ctx);

const LABELS = {
  'Los números (1-10)': 'Números 1-10',
  'Plural: agregar "-s"': 'Plural: -s',
  '"This is..." (esto es...)': 'This is...',
  'Los colores': 'Colores',
  'Preguntas simples: "What is this?"': 'What is this?',
  'Yes / No básico': 'Yes / No',
  'Los días de la semana': 'Días de la semana',
  'Adjetivos posesivos simples (my / your)': 'my / your',
  'Borrow vs Lend (prestar)': 'borrow / lend',
  'Good vs Well': 'good / well',
  'He / She / It (pronombres)': 'he / she / it',
  'Is / Are (singular y plural)': 'is / are',
  'His / Her (posesivos simples)': 'his / her',
  'Pronombres objeto (me / you / him / her / it / us / them)': 'me / him / them',
  'Preposiciones de movimiento (to / into / from)': 'to / into / from',
  'This / These': 'this / these',
  'Do / Does': 'do / does',
  'Verbo "have" (tengo / tienes / tiene)': 'have / has',
  'Verbo "to be": am / is / are': 'am / is / are',
  '"To be" en pasado: was / were': 'was / were',
  'Números parecidos que confunden (13 vs 30, 14 vs 40...)': '13 vs 30',
  'Verbo to be, have y there is/are': 'there is / are',
  'Presente simple y "to be"': 'Presente simple',
  'There / Their / They\'re': 'their / they\'re',
  'A / An': 'a / an',
  'In / On / At': 'in / on / at',
  'Some / Any': 'some / any',
  'This / That / These / Those': 'this / that',
  'Question words (What / Where / When / Who)': 'what / where',
  'Adverbios de frecuencia (always / usually / sometimes / never)': 'always / never',
  'Can / Can\'t (habilidad)': 'can / can\'t',
  'Posesivos (my / your / his / her / our / their)': 'our / their',
  'Presente continuo (I am ___ing)': 'I am ___ing',
  'Comparativos (-er / more ... than)': '-er / more than',
  'Pasado simple con verbos regulares (-ed)': 'Pasado en -ed',
  'Preguntas con Do/Does en presente simple': 'Preguntas con do',
  'Its vs It\'s': 'its / it\'s',
  'Then vs Than': 'then / than',
  '"Your" vs "You\'re"': 'your / you\'re',
  '"To" vs "Too" vs "Two"': 'to / too / two',
  'Sustantivos contables e incontables': 'Contables',
  'Secuenciadores (first, then, after that, finally)': 'first, then...',
  'Much / Many': 'much / many',
  'Pasado simple con verbos irregulares': 'Pasado irregular',
  'By vs Until': 'by / until',
  'A little / Little / A few / Few': 'little / few',
  'Condicionales, comparativos y presente perfecto': 'Presente perfecto',
  'Past Perfect': 'Past perfect',
  '"Used to"': 'used to',
  'Present Perfect vs Past Simple': 'Perfect vs Past',
  'Since / For': 'since / for',
  'Conditionals (tipo 1 y 2)': 'Condicionales',
  'Reported Speech': 'Reported speech',
  'Voz pasiva (presente y pasado simple)': 'Voz pasiva',
  'Verbos modales de obligación (must / have to / should)': 'must / should',
  'Will vs Going to (futuro)': 'will / going to',
  'Gerundios vs infinitivos (like doing / want to do)': 'doing / to do',
  'Cláusulas relativas (who / which / that)': 'who / which',
  'Phrasal verbs comunes (look for / give up / find out)': 'Phrasal verbs',
  'Verbos modales de posibilidad (may / might / could)': 'may / might',
  'Cuantificadores (a lot of / much / many / few / little)': 'a lot of',
  'Who vs Whom': 'who / whom',
  'Affect vs Effect': 'affect / effect',
  '"Say" vs "Tell"': 'say / tell',
  '"Fewer" vs "Less"': 'fewer / less',
  '"Advice" vs "Advise"': 'advice / advise',
  'Comparativos de igualdad (as...as)': 'as ... as',
  'Verbos causativos (have something done)': 'have it done',
  'Actually / Currently': 'actually / currently',
  'Despite / Although / Instead of': 'despite / although',
  'Question tags (¿verdad? / ¿no es así?)': 'Question tags',
  'As vs Like': 'as / like',
  'By vs Until (en el trabajo)': 'by / until',
  'Wish, estilo indirecto y pasado perfecto': 'I wish...',
  'Condicional tipo 3': 'Condicional 3',
  'Inversiones enfáticas': 'Inversiones',
  'Conectores avanzados': 'Conectores',
  'Preposiciones sutiles': 'Preposiciones',
  'Cláusulas relativas reducidas': 'Relativas cortas',
  'Formal vs natural / matices': 'Formal / natural',
  'Wish / If only': 'wish / if only',
  'Condicionales mixtos': 'Condicional mixto',
  'Subjuntivo formal (It is essential that...)': 'Subjuntivo formal',
  'Colocaciones avanzadas (make vs do)': 'make / do',
  'Discurso indirecto con matices': 'Estilo indirecto',
  'Enfatizadores y hedging (arguably, tend to, likely)': 'tend to / likely',
  'Participios como adjetivos (-ed vs -ing)': '-ed / -ing',
  'Oraciones enfáticas con "It is... that" (cleft sentences)': 'It is ... that',
  'Quiet vs Quite vs Quit': 'quiet / quite',
  'Farther vs Further': 'farther / further',
  '"Lose" vs "Loose"': 'lose / loose',
  '"Beside" vs "Besides"': 'beside / besides',
  '"Lay" vs "Lie"': 'lay / lie',
  'Modales perfectos (must have been / should have gone)': 'must have been',
  'Who / Whom': 'who / whom',
  'Despite vs In spite of vs Even though': 'in spite of',
  'Voz pasiva con modales (should be / must have been)': 'should be done',
  'Bring vs Take': 'bring / take',
  'Inversión, would rather y it\'s high time': 'would rather',
};

const topics = new Set();
Object.keys(ctx.GB).forEach(level => ctx.GB[level].forEach(variant => variant.forEach(t => topics.add(t.topic))));
const pool = new Set();
topics.forEach(t => {
  if(!LABELS[t]) console.warn('Tema sin etiqueta corta (usando nombre sin parentesis):', t);
  pool.add(LABELS[t] || t.replace(/\s*\(.*?\)/g, '').replace(/"/g, ''));
});
const list = Array.from(pool);
const out = '/* Archivo generado por tools/generar_mini_lecciones.js a partir de data.js.\n   No editar a mano: edita las etiquetas en ese script y vuelve a correrlo. */\n' +
  'const MINI_LESSONS = ' + JSON.stringify(list) + ';\n';
fs.writeFileSync(path.join(root, 'mini-lecciones.js'), out);
console.log('mini-lecciones.js:', list.length, 'temas,', out.length, 'bytes');
