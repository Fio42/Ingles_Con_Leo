/* Entradas del glosario SIN pagina propia: temas que ya tienen una clase
   completa (articulo). El glosario da la respuesta corta y enlaza al
   articulo, para no competir con el en Google. */
module.exports = [
{ slug:'present-simple', t:'presente simple (present simple)', tipo:'gramatica',
  resp:`Tiempo verbal para rutinas, hábitos y hechos. En tercera persona (he, she, it) el verbo lleva -s: _She works here._`,
  ej:[`She works here.`,`Ella trabaja aquí.`], art:'presente-simple', prac:'grammar' },
{ slug:'do-vs-does', t:'do vs does', tipo:'gramatica',
  resp:`Does va con he, she, it. Do va con I, you, we, they. Sirven para preguntas y negaciones en presente simple.`,
  ej:[`Does she work here?`,`¿Ella trabaja aquí?`], art:'do-vs-does', prac:'grammar' },
{ slug:'in-on-at', t:'in, on, at', tipo:'gramatica',
  resp:`At para puntos exactos (at 5 pm), on para días y superficies (on Monday), in para meses, años y espacios (in July, in the room).`,
  ej:[`The class is on Monday at five.`,`La clase es el lunes a las cinco.`], art:'in-on-at', prac:'grammar' },
{ slug:'past-simple', t:'pasado simple (past simple)', tipo:'gramatica',
  resp:`Tiempo verbal para acciones terminadas en el pasado. Los verbos regulares terminan en -ed: _I worked yesterday._`,
  ej:[`I worked yesterday.`,`Ayer trabajé.`], art:'pasado-simple', prac:'grammar' },
{ slug:'present-perfect', t:'presente perfecto (present perfect)', tipo:'gramatica',
  resp:`Have/has + participio. Une el pasado con el presente: experiencias, cosas que siguen hoy y resultados actuales.`,
  ej:[`I have lived here for five years.`,`Vivo aquí desde hace cinco años.`], art:'presente-perfecto', prac:'grammar' },
{ slug:'verb-to-be', t:'verbo to be (am, is, are)', tipo:'gramatica',
  resp:`Ser o estar. Se conjuga: I am, you are, he/she/it is, we are, they are.`,
  ej:[`I am a student.`,`Soy estudiante.`], art:'verbo-to-be', prac:'grammar' },
{ slug:'phrasal-verbs-lista', t:'phrasal verbs', tipo:'phrasal',
  resp:`Verbos con una partícula (up, out, off...) que cambian de significado: _give up_ (rendirse), _look for_ (buscar).`,
  ej:[`Don't give up.`,`No te rindas.`], art:'phrasal-verbs', prac:'vocabulary' },
{ slug:'irregular-verbs', t:'verbos irregulares (irregular verbs)', tipo:'gramatica',
  resp:`Verbos que no forman el pasado con -ed: go, went, gone; eat, ate, eaten.`,
  ej:[`I went to the market yesterday.`,`Ayer fui al mercado.`], art:'verbos-irregulares', prac:'grammar' },
{ slug:'numbers', t:'números en inglés (numbers)', tipo:'gramatica',
  resp:`Cómo decir y escribir los números en inglés, desde 1 hasta los miles.`,
  ej:[`My number is five five five, one two three four.`,`Mi número es cinco cinco cinco, uno dos tres cuatro.`], art:'numeros-en-ingles', prac:'listening' }
];
