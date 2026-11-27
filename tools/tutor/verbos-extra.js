/* Riso · datos verificados a mano que complementan el artículo de verbos irregulares.
   irregulares: [base, pasado, participio, significado, nota opcional]. Las formas con " / " son variantes válidas.
   regulares: verbos regulares comunes que Riso puede conjugar con reglas (si un verbo no está en ninguna
   lista, Riso NO inventa la forma: la pregunta pasa a la IA).
   doblanSiempre: verbos de 2 o más sílabas que doblan la consonante final en inglés británico y estadounidense.
   doblanSoloUK: verbos que doblan la l solo en inglés británico (travelled UK, traveled US). */
module.exports = {
  irregulares: [
    ['ring', 'rang', 'rung', 'sonar (un timbre, un teléfono)'],
    ['ride', 'rode', 'ridden', 'montar, andar en'],
    ['freeze', 'froze', 'frozen', 'congelar'],
    ['forgive', 'forgave', 'forgiven', 'perdonar'],
    ['shake', 'shook', 'shaken', 'sacudir, agitar'],
    ['bite', 'bit', 'bitten', 'morder'],
    ['blow', 'blew', 'blown', 'soplar'],
    ['feed', 'fed', 'fed', 'alimentar'],
    ['hang', 'hung', 'hung', 'colgar', 'Con el sentido de ahorcar es regular: hanged.'],
    ['lay', 'laid', 'laid', 'poner, colocar'],
    ['lie', 'lay', 'lain', 'recostarse, estar acostado', 'Con el sentido de mentir es regular: lie, lied, lied.'],
    ['light', 'lit / lighted', 'lit / lighted', 'encender'],
    ['seek', 'sought', 'sought', 'buscar'],
    ['shine', 'shone / shined', 'shone / shined', 'brillar', 'Shined es más común en inglés estadounidense, sobre todo con el sentido de lustrar.'],
    ['shoot', 'shot', 'shot', 'disparar, filmar'],
    ['show', 'showed', 'shown / showed', 'mostrar'],
    ['sink', 'sank', 'sunk', 'hundirse'],
    ['slide', 'slid', 'slid', 'deslizarse'],
    ['spin', 'spun', 'spun', 'girar'],
    ['split', 'split', 'split', 'dividir'],
    ['spread', 'spread', 'spread', 'extender, untar'],
    ['stick', 'stuck', 'stuck', 'pegar'],
    ['sting', 'stung', 'stung', 'picar (un insecto)'],
    ['strike', 'struck', 'struck', 'golpear'],
    ['swear', 'swore', 'sworn', 'jurar'],
    ['sweep', 'swept', 'swept', 'barrer'],
    ['swing', 'swung', 'swung', 'balancearse, columpiarse'],
    ['tear', 'tore', 'torn', 'rasgar, romper'],
    ['weep', 'wept', 'wept', 'llorar'],
    ['wind', 'wound', 'wound', 'enrollar, dar cuerda'],
    ['bend', 'bent', 'bent', 'doblar'],
    ['bet', 'bet', 'bet', 'apostar'],
    ['bleed', 'bled', 'bled', 'sangrar'],
    ['burst', 'burst', 'burst', 'reventar'],
    ['dig', 'dug', 'dug', 'cavar'],
    ['dive', 'dived / dove', 'dived', 'bucear, zambullirse', 'Dove es frecuente en inglés estadounidense.'],
    ['flee', 'fled', 'fled', 'huir'],
    ['forbid', 'forbade', 'forbidden', 'prohibir'],
    ['kneel', 'knelt / kneeled', 'knelt / kneeled', 'arrodillarse'],
    ['leap', 'leapt / leaped', 'leapt / leaped', 'saltar'],
    ['mislead', 'misled', 'misled', 'engañar, confundir'],
    ['overcome', 'overcame', 'overcome', 'superar'],
    ['sew', 'sewed', 'sewn / sewed', 'coser'],
    ['shrink', 'shrank', 'shrunk', 'encoger'],
    ['upset', 'upset', 'upset', 'molestar'],
    ['withdraw', 'withdrew', 'withdrawn', 'retirar'],
    ['prove', 'proved', 'proved / proven', 'probar, demostrar', 'Proven es más común en inglés estadounidense.'],
    ['learn', 'learned / learnt', 'learned / learnt', 'aprender', 'Learnt es más británico; en Estados Unidos se usa learned.'],
    ['dream', 'dreamed / dreamt', 'dreamed / dreamt', 'soñar', 'Dreamt es más británico.'],
    ['burn', 'burned / burnt', 'burned / burnt', 'quemar', 'Burnt es más británico como verbo.'],
    ['spell', 'spelled / spelt', 'spelled / spelt', 'deletrear', 'Spelt es británico.'],
    ['smell', 'smelled / smelt', 'smelled / smelt', 'oler', 'Smelt es británico.'],
    ['spill', 'spilled / spilt', 'spilled / spilt', 'derramar', 'Spilt es más británico.'],
    ['spoil', 'spoiled / spoilt', 'spoiled / spoilt', 'arruinar, malcriar', 'Spoilt es más británico.']
  ],
  regulares: ('want look use work call try ask need seem help talk turn start play move like live believe happen provide include ' +
    'continue change watch follow stop create allow add open walk offer remember love consider appear wait serve die expect stay ' +
    'reach kill remain suggest raise pass require report decide pull visit cook clean dance listen travel finish close study answer ' +
    'plan arrive enjoy hope prefer cry carry worry marry apply reply admit commit control occur refer permit cancel label shop drop ' +
    'chat jog hug beg rob fix mix relax miss wish push wash touch kiss guess print paint point rent order agree tie hate share smile ' +
    'laugh jump climb borrow return explain improve practice practise check fill join kick lift lock mark name pick post pray rain ' +
    'rest save shout sign taste thank train trust type use vote warn wonder worry yell complain describe discuss imagine invite ' +
    'manage prepare promise receive repeat replace solve suppose deliver fail follow happen hurry iron knock last mention need notice ' +
    'own pack pause pour prefer produce protect realize realise record reduce refuse relax rely remove rescue reserve scream search ' +
    'serve settle smoke snow sound start stay stop study succeed support surprise switch talk tidy try turn use visit walk wander').split(' '),
  doblanSiempre: 'begin forget admit commit control occur refer permit prefer regret omit equip patrol transfer submit'.split(' '),
  doblanSoloUK: 'travel cancel label model quarrel signal marvel fuel level'.split(' ')
};
