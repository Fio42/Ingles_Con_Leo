/* Fichas del glosario editadas a mano para SEO (12-14 oct 2026).
   Antes vivían solo en el HTML publicado y regenerar el glosario las borraba; ahora son parte de la fuente.
   Cada clave es el slug; sus campos se combinan con la ficha base (terminos.js o confusiones-200.js)
   y pisan los de la base. Campos propios de esta capa:
   - secciones: sustituye Cómo se usa / Ejemplos / Error común / Truco (formato en seccionesHtml del generador).
   - rel: lista "Mira también" (slugs).
   - etiqueta: texto con el que otras fichas enlazan a esta en "Mira también".
   - h1, titulo, descripcion, descripcionSocial, descripcionEsquema, respuesta: cabecera y respuesta propias
     cuando difieren de lo que genera la plantilla. */
module.exports = {
'accept-vs-except': {
  "rel": [
    "affect-vs-effect",
    "advice-vs-advise",
    "effective-vs-efficient"
  ],
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Accept es un verbo: significa aceptar, recibir algo de buena gana. Except significa excepto, salvo o menos. Se escriben casi igual y suenan parecido, por eso se confunden. La primera sílaba ayuda: accept empieza con \"ak\" y except con \"ik\".",
        [
          "Accept + algo o alguien: I accept your invitation.",
          "Except + lo que se deja fuera: Everyone came except Tom.",
          "Except for al inicio de la frase: Except for the price, the hotel is perfect.",
          "Except that + oración: I like it, except that it is too big."
        ]
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "I accept your apology, except for one thing.",
            "Acepto tus disculpas, excepto por una cosa."
          ]
        },
        {
          "ej": [
            "They accepted the job offer.",
            "Aceptaron la oferta de trabajo."
          ]
        },
        {
          "ej": [
            "We are open every day except Sunday.",
            "Abrimos todos los días excepto el domingo."
          ]
        },
        {
          "ej": [
            "She accepts credit cards.",
            "Ella acepta tarjetas de crédito."
          ]
        },
        {
          "ej": [
            "Everyone except Ana was ready.",
            "Todos estaban listos menos Ana."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "I except your offer.",
            "I accept your offer."
          ]
        },
        "Para decir aceptar necesitas el verbo accept.",
        {
          "mal": [
            "Everyone accept Tom came.",
            "Everyone except Tom came."
          ]
        },
        "Para decir menos o salvo se usa except."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Except contiene la x de \"excluir\": deja a alguien fuera. Accept empieza con a, como \"aceptar\"."
      ]
    }
  ]
},
'advice-vs-advise': {
  "rel": [
    "accept-vs-except",
    "affect-vs-effect",
    "effective-vs-efficient"
  ],
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Advice es un sustantivo: el consejo. Advise es un verbo: aconsejar. Se parecen en la escritura y también en el sonido, pero la última consonante cambia: advice termina en s (ad-VÁIS) y advise termina en z (ad-VÁIZ).",
        [
          "Advice (sustantivo): She gave me good advice.",
          "Advice es incontable: no se dice an advice ni advices. Para una sola, usa a piece of advice.",
          "Advise (verbo) + persona + to + verbo: He advised me to wait.",
          "Advise + -ing: I advise taking the bus."
        ]
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "She gave me advice and advised me to wait.",
            "Ella me dio un consejo y me aconsejó esperar."
          ]
        },
        {
          "ej": [
            "Can I ask you for some advice?",
            "¿Puedo pedirte un consejo?"
          ]
        },
        {
          "ej": [
            "The doctor advised him to rest.",
            "El doctor le aconsejó descansar."
          ]
        },
        {
          "ej": [
            "That is good advice.",
            "Es un buen consejo."
          ]
        },
        {
          "ej": [
            "I would advise you to read the contract.",
            "Te aconsejo leer el contrato."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "She gave me some advices.",
            "She gave me some advice."
          ]
        },
        "Advice es incontable y no lleva s.",
        {
          "mal": [
            "He advice me to stay.",
            "He advised me to stay."
          ]
        },
        "Para el verbo se escribe advise, y en pasado advised."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Si puedes poner a, some o good antes de la palabra (some advice, good advice), es advice. Si después puedes poner a una persona y to (advise someone to), es advise."
      ]
    }
  ]
},
'although': {
  "h1": "Although: significado, traducción y cómo usarlo",
  "titulo": "Although: significado, traducción y cómo usarlo",
  "descripcion": "Although significa “aunque” o “a pesar de que”. Aprende cómo usarlo, su estructura, pronunciación, ejemplos y el error más común.",
  "descripcionSocial": "Although significa “aunque” o “a pesar de que”. Aprende su estructura y úsalo con ejemplos sencillos.",
  "descripcionEsquema": "Although significa “aunque” o “a pesar de que” y conecta ideas que contrastan.",
  "respuesta": "**Although** significa normalmente **“aunque”** o **“a pesar de que”**. Se usa para conectar dos ideas que contrastan: _Although it was cold, we went out._",
  "rel": [
    "despite-vs-although",
    "even-though",
    "though",
    "however",
    "instead-of"
  ],
  "secciones": [
    {
      "h2": "Qué significa although",
      "b": [
        "Although es una conjunción y significa \"aunque\", \"a pesar de que\" o \"si bien\". Sirve para unir dos ideas que chocan: la segunda es una sorpresa respecto a la primera. Se pronuncia ol-DÓU: la gh no se pronuncia y la th suena suave, como en _this_."
      ]
    },
    {
      "h2": "Cómo se usa although",
      "b": [
        "Después de although siempre va una oración completa, con sujeto y verbo. Puede ir al inicio de la frase o en medio, y el significado es el mismo:",
        [
          "Al inicio, con coma en medio: _Although it was raining, we played soccer._",
          "En medio, normalmente sin coma: _We played soccer although it was raining._"
        ],
        "Al inicio, el contraste se nota más. En medio suena más natural cuando hablas."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "Although it was cold, we went to the beach.",
            "Aunque hacía frío, fuimos a la playa."
          ]
        },
        {
          "ej": [
            "I like him, although he talks a lot.",
            "Me cae bien, aunque habla mucho."
          ]
        },
        {
          "ej": [
            "Although she studied, she failed the test.",
            "Aunque estudió, reprobó el examen."
          ]
        },
        {
          "ej": [
            "The hotel was cheap, although it was very clean.",
            "El hotel era barato, aunque estaba muy limpio."
          ]
        },
        {
          "ej": [
            "Although he was tired, he kept working.",
            "Aunque estaba cansado, siguió trabajando."
          ]
        },
        {
          "ej": [
            "My sister speaks English well although she has never lived abroad.",
            "Mi hermana habla bien inglés, aunque nunca ha vivido en el extranjero."
          ]
        }
      ]
    },
    {
      "h2": "Although, though y even though",
      "b": [
        "Las tres significan \"aunque\", pero no se usan igual:",
        [
          "Although: la forma estándar. Va al inicio o en medio, nunca al final de la frase.",
          "[Though](/glosario/though/): significa lo mismo y es más informal. Es la única que puede ir al final: _The phone is expensive. I love it, though._",
          "[Even though](/glosario/even-though/): \"aunque\" con más fuerza, para algo real que sorprende: _Even though it was late, she called me._"
        ]
      ]
    },
    {
      "h2": "Although vs despite",
      "b": [
        "Although va con una oración completa. [Despite](/glosario/despite-vs-although/) (o _in spite of_) va con un sustantivo o con un verbo en -ing. Mismo significado, estructura distinta:",
        {
          "ej": [
            "Although it rained, the game continued.",
            "Aunque llovió, el partido continuó."
          ]
        },
        {
          "ej": [
            "Despite the rain, the game continued.",
            "A pesar de la lluvia, el partido continuó."
          ]
        }
      ]
    },
    {
      "h2": "Although, but y however",
      "b": [
        "Although ya expresa el contraste, así que no se combina con _but_. _But_ une dos ideas dentro de una misma oración. [However](/glosario/however/) empieza una oración nueva y lleva coma después.",
        {
          "ej": [
            "Although he was sick, he went to work.",
            "Aunque estaba enfermo, fue a trabajar."
          ]
        },
        {
          "ej": [
            "He was sick, but he went to work.",
            "Estaba enfermo, pero fue a trabajar."
          ]
        },
        {
          "ej": [
            "He was sick. However, he went to work.",
            "Estaba enfermo. Sin embargo, fue a trabajar."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "Although it was late, but I called her.",
            "Although it was late, I called her."
          ]
        },
        "Con although no se usa but en la misma oración.",
        {
          "mal": [
            "Although the traffic, we arrived on time.",
            "Although there was traffic, we arrived on time."
          ]
        },
        "Después de although va sujeto y verbo. Si solo tienes un sustantivo, usa despite: _Despite the traffic, we arrived on time._",
        {
          "mal": [
            "The food was good. The service was slow, although.",
            "The food was good. The service was slow, though."
          ]
        },
        "Although no va al final de la frase. Para eso se usa though."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Piensa en \"aunque\". Si ya dijiste aunque, no necesitas decir \"pero\" otra vez."
      ]
    }
  ]
},
'any-vs-some': {
  "rel": [
    "much-vs-many",
    "little-vs-a-little",
    "fewer-vs-less"
  ],
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Some y any significan \"algo de\", \"unos\" o \"algunos\". El significado es casi el mismo; lo que cambia es el tipo de frase. Los dos funcionan con sustantivos incontables (some water) y con plurales (some apples).",
        [
          "Frases afirmativas: some. I have some friends in Miami.",
          "Frases negativas: any. I don't have any friends in Miami.",
          "Preguntas: normalmente any. Do you have any questions?",
          "Ofrecimientos y peticiones: some, porque esperas un sí. Would you like some coffee? Can I have some water?"
        ],
        "Any también puede ir en una frase afirmativa, pero entonces significa \"cualquiera\": You can choose any book.",
        "Si quieres repasar qué sustantivos son contables e incontables, mira la [clase de sustantivos contables e incontables](/articulo-sustantivos-contables-incontables.html#some-any)."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "Would you like some coffee? I do not have any milk.",
            "¿Quieres café? No tengo leche."
          ]
        },
        {
          "ej": [
            "She bought some bread.",
            "Ella compró pan."
          ]
        },
        {
          "ej": [
            "There isn't any bread left.",
            "No queda pan."
          ]
        },
        {
          "ej": [
            "Do you have any brothers or sisters?",
            "¿Tienes hermanos?"
          ]
        },
        {
          "ej": [
            "You can ask me any question.",
            "Puedes hacerme cualquier pregunta."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "I don't have some money.",
            "I don't have any money."
          ]
        },
        "Con una negación se usa any.",
        {
          "mal": [
            "I have any questions.",
            "I have some questions."
          ]
        },
        "En una frase afirmativa normal se usa some."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Piensa en el sí y el no. Si la frase es un sí (afirmación, oferta, petición), usa some. Si hay un no (negación) o una duda (pregunta), usa any."
      ]
    }
  ]
},
'despite-vs-although': {
  "rel": [
    "although",
    "even-though",
    "however"
  ],
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Las dos palabras expresan contraste: significan “a pesar de” o “aunque”. Lo que cambia es lo que va después. Despite va seguido de un sustantivo o de un verbo con -ing. Although va seguido de una oración completa, con sujeto y verbo.",
        [
          "Despite + sustantivo: Despite the rain, we went out.",
          "Despite + -ing: Despite being tired, she finished the report.",
          "Although + sujeto + verbo: Although it was raining, we went out.",
          "Despite the fact that + oración: Despite the fact that it was raining, we went out."
        ],
        "In spite of funciona igual que despite, pero lleva of: In spite of the rain, we went out."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "Despite the rain, we went out.",
            "A pesar de la lluvia, salimos."
          ]
        },
        {
          "ej": [
            "Although it was raining, we went out.",
            "Aunque llovía, salimos."
          ]
        },
        {
          "ej": [
            "Despite being tired, she finished the report.",
            "A pesar de estar cansada, terminó el informe."
          ]
        },
        {
          "ej": [
            "Although she was tired, she finished the report.",
            "Aunque estaba cansada, terminó el informe."
          ]
        },
        {
          "ej": [
            "Despite the rain, we left although it was wet.",
            "A pesar de la lluvia, salimos aunque estaba mojado."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "Despite of the rain, we stayed home.",
            "Despite the rain, we stayed home."
          ]
        },
        "Despite no lleva of. Solo in spite of lleva of.",
        {
          "mal": [
            "Despite it was raining, we went out.",
            "Although it was raining, we went out."
          ]
        },
        "Después de despite no puede ir una oración con sujeto y verbo. Usa although, o escribe despite the fact that.",
        {
          "mal": [
            "Although the rain, we went out.",
            "Despite the rain, we went out."
          ]
        },
        "Después de although necesitas sujeto y verbo. Con un sustantivo solo, usa despite."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Mira lo que viene después. Si hay sujeto y verbo (it was raining, she was tired), usa although. Si hay un sustantivo (the rain) o un verbo con -ing (being tired), usa despite. En ninguno de los dos casos añadas but en la misma frase."
      ]
    }
  ]
},
'effective-vs-efficient': {
  "rel": [
    "accept-vs-except",
    "advice-vs-advise",
    "affect-vs-effect"
  ],
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Effective significa eficaz: algo que consigue el resultado que se quería. Efficient significa eficiente: algo que consigue el resultado sin desperdiciar tiempo, dinero ni esfuerzo. En español las dos palabras también se confunden, y en inglés ocurre lo mismo.",
        [
          "Effective: funciona, cumple su objetivo. This medicine is effective.",
          "Efficient: funciona bien y gasta poco. This engine is efficient: it uses little fuel.",
          "Algo puede ser effective sin ser efficient: funciona, pero tarda o cuesta mucho.",
          "Con personas: an efficient worker no pierde tiempo; an effective leader consigue resultados."
        ]
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "The treatment is effective and the process is efficient.",
            "El tratamiento es eficaz y el proceso es eficiente."
          ]
        },
        {
          "ej": [
            "This app is effective: it really helps me learn.",
            "Esta app es eficaz: de verdad me ayuda a aprender."
          ]
        },
        {
          "ej": [
            "The new printer is efficient because it uses less ink.",
            "La impresora nueva es eficiente porque usa menos tinta."
          ]
        },
        {
          "ej": [
            "She is an efficient assistant. She answers emails fast.",
            "Ella es una asistente eficiente. Responde los correos rápido."
          ]
        },
        {
          "ej": [
            "An effective teacher helps students understand.",
            "Un buen maestro logra que los estudiantes entiendan."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "This medicine is very efficient against headaches.",
            "This medicine is very effective against headaches."
          ]
        },
        "Un medicamento se evalúa por el resultado, así que se usa effective.",
        {
          "mal": [
            "She is an effective worker because she wastes no time.",
            "She is an efficient worker because she wastes no time."
          ]
        },
        "Aprovechar bien el tiempo es efficient."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Pregunta primero: ¿funciona? Eso es effective. Luego pregunta: ¿funciona sin desperdiciar nada? Eso es efficient."
      ]
    }
  ]
},
'little-vs-a-little': {
  "rel": [
    "much-vs-many",
    "any-vs-some",
    "fewer-vs-less"
  ],
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Little y a little se usan con sustantivos incontables (time, money, water). Con sustantivos contables en plural se usan few y a few. La pequeña palabra a cambia el sentido de la frase.",
        [
          "A little + incontable: algo, un poco, lo suficiente. I have a little time. Let's talk.",
          "Little + incontable: casi nada, muy poco. I have little time. I can't help you.",
          "A few + contable en plural: algunos. I have a few friends here.",
          "Few + contable en plural: casi ninguno. I have few friends here."
        ],
        "Con a, la frase suena positiva: hay algo. Sin a, suena negativa: casi no hay. También existe a little como \"un poco\" delante de un adjetivo: _I'm a little tired_. No lo confundas con el adjetivo _little_ que significa \"pequeño\": _a little dog_.",
        "Para ver también much, many y a lot of, mira la [clase de sustantivos contables e incontables](/articulo-sustantivos-contables-incontables.html#much-many-few-little)."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "We have little time, but a little hope.",
            "Tenemos poco tiempo, pero un poco de esperanza."
          ]
        },
        {
          "ej": [
            "I have a little money, so I can buy a coffee.",
            "Tengo un poco de dinero, así que puedo comprar un café."
          ]
        },
        {
          "ej": [
            "He has little money, so he cannot travel.",
            "Tiene muy poco dinero, así que no puede viajar."
          ]
        },
        {
          "ej": [
            "We have a few apples. Do you want one?",
            "Tenemos algunas manzanas. ¿Quieres una?"
          ]
        },
        {
          "ej": [
            "Few people know the answer.",
            "Muy poca gente sabe la respuesta."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "I have a little friends in Boston.",
            "I have a few friends in Boston."
          ]
        },
        "Friends se puede contar, así que usa a few.",
        {
          "mal": [
            "I have few time.",
            "I have little time."
          ]
        },
        "Time es incontable, así que usa little."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Haz dos preguntas. Primera: ¿puedo contarlo? Si sí (friends, apples), usa few o a few. Si no (time, water, money), usa little o a little. Segunda: ¿hay algo o casi nada? Con a hay algo; sin a, casi nada."
      ]
    }
  ]
},
'look-forward-to': {
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Look forward to significa tener ganas de algo que va a pasar, esperarlo con ilusión. En español sería \"tengo ganas de\", \"espero con ganas\" o, en un correo formal, \"quedo a la espera de\". Aquí to es una preposición, así que después va un sustantivo o un verbo con -ing, nunca el verbo base.",
        [
          "Look forward to + sustantivo: I look forward to the weekend.",
          "Look forward to + -ing: We look forward to seeing you.",
          "Es muy común en el presente continuo: I'm looking forward to my trip.",
          "En negativo dice que no tienes ganas: I'm not looking forward to the exam.",
          "En correos formales cierra con un siguiente paso: I look forward to hearing from you."
        ]
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "I'm looking forward to the weekend.",
            "Tengo muchas ganas de que llegue el fin de semana."
          ]
        },
        {
          "ej": [
            "We look forward to seeing you.",
            "Esperamos verte pronto."
          ]
        },
        {
          "ej": [
            "She is looking forward to her trip.",
            "Ella espera su viaje con ilusión."
          ]
        },
        {
          "ej": [
            "I look forward to hearing from you.",
            "Quedo a la espera de tu respuesta."
          ]
        },
        {
          "ej": [
            "I'm not looking forward to the exam.",
            "No tengo ganas de que llegue el examen."
          ]
        },
        {
          "ej": [
            "They are looking forward to meeting you.",
            "Tienen muchas ganas de conocerte."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "I look forward to see you.",
            "I look forward to seeing you."
          ]
        },
        "Después de forward to va -ing.",
        {
          "mal": [
            "I look forward your answer.",
            "I look forward to your answer."
          ]
        },
        "Falta la preposición to: look forward to + algo."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Después de look forward to, piensa en -ing. Ese to funciona como en _be used to_ (estar acostumbrado a) o _in addition to_: es una preposición y por eso pide un sustantivo o -ing."
      ]
    }
  ]
},
'mustnt': {
  "rel": [
    "mustnt-vs-dont-have-to",
    "must-vs-have-to",
    "shouldnt",
    "cant",
    "wont"
  ],
  "secciones": [
    {
      "h2": "Qué significa mustn't",
      "b": [
        "Mustn't es la contracción de _must not_ y significa \"no debes\" o \"está prohibido\". Expresa una prohibición fuerte: una regla, una norma o algo que no se permite. Se pronuncia MÁS-nt: la primera t casi no se oye."
      ]
    },
    {
      "h2": "Cómo se usa",
      "b": [
        "La estructura es sujeto + mustn't + verbo en forma base. Es igual para todas las personas (_I mustn't, you mustn't, she mustn't_) y no lleva _to_ ni -s en el verbo. Si quieres ver todos los modales de obligación juntos, lee la [clase de verbos modales](/articulo-verbos-modales.html#obligacion-must)."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "You mustn't use your phone in class.",
            "No debes usar el teléfono en clase."
          ]
        },
        {
          "ej": [
            "You mustn't tell anyone.",
            "No debes decírselo a nadie."
          ]
        },
        {
          "ej": [
            "Visitors mustn't feed the animals.",
            "Los visitantes no deben darles de comer a los animales."
          ]
        },
        {
          "ej": [
            "We mustn't be late for the interview.",
            "No debemos llegar tarde a la entrevista."
          ]
        },
        {
          "ej": [
            "You mustn't forget your passport.",
            "No debes olvidar tu pasaporte."
          ]
        }
      ]
    },
    {
      "h2": "Mustn't no es \"no tienes que\"",
      "b": [
        "En español \"no debes\" y \"no tienes que\" se parecen, pero en inglés son cosas distintas. Mustn't prohíbe. _Don't have to_ dice que algo no es necesario, aunque se puede hacer.",
        {
          "ej": [
            "You mustn't open that door. (Está prohibido.)",
            "No debes abrir esa puerta."
          ]
        },
        {
          "ej": [
            "You don't have to open the door. (No hace falta.)",
            "No tienes que abrir la puerta."
          ]
        },
        "Tienes la comparación completa en [mustn't vs don't have to](/glosario/mustnt-vs-dont-have-to/)."
      ]
    },
    {
      "h2": "Mustn't, can't y shouldn't",
      "b": [
        [
          "Mustn't: la regla o la razón lo prohíbe. You mustn't touch the machine.",
          "[Can't](/glosario/cant/): no puedes, no tienes permiso o no es posible. You can't park here.",
          "[Shouldn't](/glosario/shouldnt/): no es buena idea, es un consejo. You shouldn't eat so much sugar."
        ],
        "Mustn't se oye más en inglés británico y en reglas escritas. En inglés estadounidense suele aparecer como _must not_ en carteles, y en la conversación es más común oír _can't_ o _shouldn't_. Las tres formas son correctas."
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "You mustn't to smoke here.",
            "You mustn't smoke here."
          ]
        },
        "Después de mustn't va el verbo sin to.",
        {
          "mal": [
            "You mustnt run in the hall.",
            "You mustn't run in the hall."
          ]
        },
        "Escríbelo siempre con apóstrofe (mustn't): reemplaza la o de not. Sin el apóstrofe verás mustnt o musnt, pero no es la forma correcta."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Mustn't = está prohibido. Don't have to = no es necesario. Si en la frase hay una regla que lo impide, usa mustn't."
      ]
    }
  ]
},
'mustnt-vs-dont-have-to': {
  "etiqueta": "mustn't vs don't have to",
  "rel": [
    "mustnt",
    "must-vs-have-to",
    "should",
    "shouldnt"
  ],
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "En español \"no debes\" y \"no tienes que\" suenan parecido, pero en inglés dicen cosas muy distintas. Must not (mustn't) prohíbe: no hay opción. Do not have to (don't have to) dice que no es necesario, pero puedes hacerlo si quieres.",
        [
          "Mustn't = prohibido. You mustn't park here.",
          "Don't have to = no hace falta. You don't have to park here.",
          "Con he, she o it se usa doesn't have to: She doesn't have to work on Sundays.",
          "Después de los dos va el verbo en forma base, sin to ni -s."
        ],
        "Don't have to es la negación de _have to_, no de _must_. Por eso cambia el significado: _must_ obliga, _mustn't_ prohíbe y _don't have to_ deja la decisión a la persona."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "You must not smoke, but you do not have to stay.",
            "No debes fumar, pero no tienes que quedarte."
          ]
        },
        {
          "ej": [
            "You mustn't touch that wire. It's dangerous.",
            "No debes tocar ese cable. Es peligroso."
          ]
        },
        {
          "ej": [
            "You don't have to wear a tie, but you can.",
            "No tienes que usar corbata, pero puedes."
          ]
        },
        {
          "ej": [
            "Students mustn't use phones during the exam.",
            "Los estudiantes no deben usar el celular durante el examen."
          ]
        },
        {
          "ej": [
            "We don't have to hurry. We have plenty of time.",
            "No tenemos que apurarnos. Tenemos mucho tiempo."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "You don't have to smoke here. (si quieres decir que está prohibido)",
            "You mustn't smoke here."
          ]
        },
        "Don't have to no prohíbe: solo dice que no es obligatorio.",
        {
          "mal": [
            "You mustn't come if you don't want to. (si quieres decir que no es obligatorio)",
            "You don't have to come if you don't want to."
          ]
        },
        "Mustn't suena como una prohibición, no como una opción.",
        {
          "mal": [
            "She don't have to work today.",
            "She doesn't have to work today."
          ]
        },
        "Con he, she e it usa doesn't."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Pregúntate: ¿hay una regla que lo impide o solo no hace falta? Si está prohibido, mustn't. Si es opcional, don't have to. En español, \"no debes\" suele ser mustn't y \"no tienes que\" suele ser don't have to."
      ]
    }
  ]
},
'then-vs-than': {
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Then y than se parecen en la escritura, pero no significan lo mismo y no suenan igual: then se pronuncia DEN y than se pronuncia DAN.",
        [
          "Then = luego, entonces, en ese momento. Habla de tiempo, de orden o de consecuencia: First we ate, then we left.",
          "Then también aparece en condicionales: If you're tired, then rest.",
          "Back then = en aquel entonces: Back then, we lived in a small town.",
          "Than = que. Va después de un comparativo: taller than, more than, better than.",
          "Than también aparece en I'd rather walk than drive (prefiero caminar a manejar)."
        ],
        "Si quieres repasar los comparativos completos, lee la [clase de comparativos y superlativos](/articulo-comparativos-y-superlativos.html)."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "She is taller than me.",
            "Ella es más alta que yo."
          ]
        },
        {
          "ej": [
            "Finish your homework, then you can play.",
            "Termina tu tarea, luego puedes jugar."
          ]
        },
        {
          "ej": [
            "If you're tired, then rest.",
            "Si estás cansado, entonces descansa."
          ]
        },
        {
          "ej": [
            "This phone is better than that one.",
            "Este celular es mejor que ese."
          ]
        },
        {
          "ej": [
            "First open the file, then click Save.",
            "Primero abre el archivo y luego haz clic en Guardar."
          ]
        },
        {
          "ej": [
            "I'd rather walk than drive.",
            "Prefiero caminar a manejar."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "She is older then me.",
            "She is older than me."
          ]
        },
        "Para comparar se usa than.",
        {
          "mal": [
            "Finish your homework than you can play.",
            "Finish your homework, then you can play."
          ]
        },
        "Para decir luego o después se usa then."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Then rima con when: los dos hablan de tiempo. Than lleva la a de comparar."
      ]
    }
  ]
},
'was-vs-were': {
  "secciones": [
    {
      "h2": "Cómo se usa",
      "b": [
        "Was y were son el pasado del verbo _to be_. Significan \"era\", \"estaba\", \"fue\" o \"estuvo\", según el contexto. Cuál usar depende del sujeto.",
        [
          "Was va con I, he, she e it: I was tired. She was at work. It was cold.",
          "Were va con you, we y they: You were right. We were friends. They were late.",
          "Con you siempre se usa were, aunque hables con una sola persona.",
          "Negativo: wasn't y weren't. I wasn't ready. They weren't home.",
          "Pregunta: Was she at school? Were you okay?"
        ],
        "Hay un caso especial: en frases como _If I were you_ se usa were incluso con I, he o she. Lo explicamos en la [clase de condicionales 1 y 2](/articulo-condicionales-1-y-2.html)."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "I was at home yesterday.",
            "Ayer estuve en casa."
          ]
        },
        {
          "ej": [
            "They were very tired.",
            "Ellos estaban muy cansados."
          ]
        },
        {
          "ej": [
            "Were you at the party?",
            "¿Estuviste en la fiesta?"
          ]
        },
        {
          "ej": [
            "Where were you last night?",
            "¿Dónde estabas anoche?"
          ]
        },
        {
          "ej": [
            "The movie was great.",
            "La película estuvo genial."
          ]
        },
        {
          "ej": [
            "We weren't at school on Monday.",
            "No estuvimos en la escuela el lunes."
          ]
        },
        {
          "ej": [
            "If I were you, I would call her.",
            "Si yo fuera tú, la llamaría."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "You was late.",
            "You were late."
          ]
        },
        "You siempre lleva were.",
        {
          "mal": [
            "They was very tired.",
            "They were very tired."
          ]
        },
        "Con they, we y you se usa were.",
        {
          "mal": [
            "I were at home yesterday.",
            "I was at home yesterday."
          ]
        },
        "Con I en un pasado normal se usa was. Were con I solo aparece en frases como If I were you."
      ]
    },
    {
      "h2": "Truco para recordarlo",
      "b": [
        "Was va solo con una persona o cosa: I, he, she, it. Todo lo demás usa were. Y you, siempre were."
      ]
    }
  ]
},
'even-though': {
  "rel": [
    "although",
    "despite-vs-although",
    "however"
  ]
},
'though': {
  "rel": [
    "although",
    "despite-vs-although",
    "even-though",
    "thought"
  ]
},
'ive': {
  "secciones": [
    {
      "h2": "Qué significa I've",
      "b": [
        "I've es la contracción de _I have_. Tiene dos significados según lo que viene después. Con un participio (_seen_, _finished_, _been_) significa \"he\": _I've finished_ es \"he terminado\". Con _got_ significa \"tengo\": _I've got a question_ es \"tengo una pregunta\". Se pronuncia ÁIV, en una sola sílaba."
      ]
    },
    {
      "h2": "Cómo se usa",
      "b": [
        "Con un participio forma el presente perfecto: _I've lived here for years_. Con _got_ expresa posesión: _I've got two sisters_. Lo mismo pasa con _you've_, _we've_ y _they've_. Con he, she e it se usa _has_: _she's finished_.",
        [
          "I've + participio: I've finished my homework.",
          "I've got + sustantivo: I've got your message.",
          "En inglés estadounidense casi nunca se dice _I've a car_. Para poseer algo usa _I have a car_ o _I've got a car_."
        ],
        "Si dudas entre las dos formas de tener, mira [have vs have got](/glosario/have-vs-have-got/)."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "I've lived here for years.",
            "He vivido aquí durante años."
          ]
        },
        {
          "ej": [
            "I've got your message.",
            "Tengo tu mensaje."
          ]
        },
        {
          "ej": [
            "I've never tried sushi.",
            "Nunca he probado el sushi."
          ]
        },
        {
          "ej": [
            "I've already eaten.",
            "Ya comí."
          ]
        },
        {
          "ej": [
            "I've got to go.",
            "Tengo que irme."
          ]
        }
      ]
    },
    {
      "h2": "No se contrae en una respuesta corta",
      "b": [
        "Cuando respondes solo con el auxiliar, se dice completo: _Have you finished? Yes, I have_. No se dice _Yes, I've_.",
        {
          "ej": [
            "Have you seen this movie? Yes, I have.",
            "¿Has visto esta película? Sí."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "I've seen him yesterday.",
            "I saw him yesterday."
          ]
        },
        "Con ayer, la semana pasada o hace dos años usa el pasado simple. El presente perfecto es para algo sin fecha concreta o que sigue importando ahora. Lo explicamos en la clase de [presente perfecto](/articulo-presente-perfecto.html).",
        {
          "mal": [
            "I've went to the store.",
            "I've gone to the store."
          ]
        },
        "Después de I've va el participio, no el pasado: _gone_, no _went_."
      ]
    },
    {
      "h2": "I've, I'd e I'll",
      "b": [
        "No los mezcles: [I'll](/glosario/ill-contraction/) es _I will_ (futuro) e [I'd](/glosario/id-contraction/) es _I would_ o _I had_. Tienes todas las contracciones juntas en la [guía de contracciones en inglés](/articulo-contracciones-ingles.html)."
      ]
    }
  ]
},
'ill-contraction': {
  "secciones": [
    {
      "h2": "Qué significa I'll",
      "b": [
        "I'll es la contracción de _I will_. Significa \"yo haré\", \"voy a\" o \"yo te ayudo\", según la situación. Se pronuncia ÁIL y suena igual que _aisle_ (pasillo) e _isle_ (isla)."
      ]
    },
    {
      "h2": "Cómo se usa",
      "b": [
        "La estructura es sujeto + 'll + verbo en forma base, sin _to_. Funciona igual con you'll, he'll, she'll, we'll y they'll. Se usa en tres situaciones:",
        [
          "Una decisión que tomas en el momento: The phone is ringing. I'll answer it.",
          "Una promesa: I'll call you tonight.",
          "Un ofrecimiento: I'll carry that for you."
        ]
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "I'll send it tonight.",
            "Lo enviaré esta noche."
          ]
        },
        {
          "ej": [
            "I'll help you with that.",
            "Te ayudaré con eso."
          ]
        },
        {
          "ej": [
            "I'll have the soup, please.",
            "Voy a pedir la sopa, por favor."
          ]
        },
        {
          "ej": [
            "I'll be there at eight.",
            "Estaré allí a las ocho."
          ]
        },
        {
          "ej": [
            "Don't worry, I'll fix it.",
            "No te preocupes, yo lo arreglo."
          ]
        }
      ]
    },
    {
      "h2": "I'll o I'm going to",
      "b": [
        "En español \"voy a\" sirve para todo. En inglés cambia según cuándo decidiste. Si lo decides justo ahora o lo prometes, usa _I'll_. Si ya lo habías planeado antes de hablar, usa _I'm going to_. La comparación completa está en [will vs going to](/articulo-will-vs-going-to.html).",
        {
          "ej": [
            "I'm tired. I'll go to bed early.",
            "Estoy cansado. Me voy a acostar temprano."
          ]
        },
        {
          "ej": [
            "I'm going to study medicine next year.",
            "Voy a estudiar medicina el año que viene."
          ]
        }
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "I'll to call you.",
            "I'll call you."
          ]
        },
        "Después de I'll va el verbo en forma base, sin _to_.",
        {
          "mal": [
            "If I'll see him, I'll tell him.",
            "If I see him, I'll tell him."
          ]
        },
        "Después de _if_ no se usa will: se usa el presente. Solo la parte del resultado lleva I'll.",
        "Para negar, no existe _I'llnt_. Usa [won't](/glosario/wont/): _I won't be late_."
      ]
    },
    {
      "h2": "No lo confundas con ill",
      "b": [
        "Sin apóstrofe, _ill_ es un adjetivo: enfermo. _I'm ill_ significa \"estoy enfermo\". Con apóstrofe, _I'll_ es _I will_. Mira también [I've](/glosario/ive/) e [I'd](/glosario/id-contraction/), que se parecen pero significan otra cosa."
      ]
    }
  ]
},
'were-contraction': {
  "secciones": [
    {
      "h2": "Qué significa we're",
      "b": [
        "We're es la contracción de _we are_. Significa \"nosotros somos\" o \"nosotros estamos\". Se pronuncia UÍR."
      ]
    },
    {
      "h2": "Cómo se usa",
      "b": [
        "Va con we y después puede llevar un adjetivo, un lugar, un verbo en -ing o un sustantivo:",
        [
          "Un estado: We're tired.",
          "Un lugar: We're in Bogotá.",
          "Una acción en curso: We're leaving now.",
          "Una identidad: We're students."
        ],
        "No se contrae en una respuesta corta: _Are you ready? Yes, we are_."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "We're going home now.",
            "Nos vamos a casa ahora."
          ]
        },
        {
          "ej": [
            "We're happy to help.",
            "Estamos felices de ayudar."
          ]
        },
        {
          "ej": [
            "We're from Colombia.",
            "Somos de Colombia."
          ]
        },
        {
          "ej": [
            "We're having dinner at eight.",
            "Cenamos a las ocho."
          ]
        },
        {
          "ej": [
            "We're not ready yet.",
            "Todavía no estamos listos."
          ]
        }
      ]
    },
    {
      "h2": "We're, were y where",
      "b": [
        "Tres palabras que se parecen y significan cosas distintas:",
        [
          "We're = we are: We're here. (Estamos aquí.)",
          "[Were](/glosario/were/) es el pasado de are: We were here yesterday. (Estuvimos aquí ayer.)",
          "Where significa dónde: Where are you? (¿Dónde estás?)"
        ],
        "We're y were suenan casi igual al hablar rápido. Lo que las distingue es el tiempo: si habla del presente, es _we're_; si habla del pasado, es _were_. Para elegir entre was y were, mira [was vs were](/glosario/was-vs-were/)."
      ]
    },
    {
      "h2": "Negativo: we're not o we aren't",
      "b": [
        "Las dos formas son correctas y significan lo mismo: _We're not ready_ y _We aren't ready_. La primera es muy común al hablar. Mira también [aren't](/glosario/arent/)."
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "Were going to the beach.",
            "We're going to the beach."
          ]
        },
        "Sin el apóstrofe, _were_ es pasado y la frase pierde sentido.",
        {
          "mal": [
            "We're agree with you.",
            "We agree with you."
          ]
        },
        "_Agree_ es un verbo, no un adjetivo. En español decimos \"estamos de acuerdo\", pero en inglés no se usa to be con agree."
      ]
    },
    {
      "h2": "Mira también",
      "b": [
        "El mismo patrón existe con otros pronombres: [you're](/glosario/youre/) y [they're](/glosario/theyre/). Todas las contracciones están en la [guía de contracciones en inglés](/articulo-contracciones-ingles.html)."
      ]
    }
  ]
},
'isnt': {
  "secciones": [
    {
      "h2": "Qué significa isn't",
      "b": [
        "Isn't es la contracción de _is not_. Significa \"no es\" o \"no está\". Se pronuncia Í-znt. Se usa con he, she, it y con sustantivos en singular."
      ]
    },
    {
      "h2": "Cómo se usa",
      "b": [
        "Va con el verbo to be y puede llevar un adjetivo, un lugar, un verbo en -ing o un sustantivo:",
        [
          "Un adjetivo: It isn't expensive.",
          "Un lugar: She isn't at home.",
          "Una acción en curso: He isn't working today.",
          "Un sustantivo: This isn't my bag."
        ],
        "Es igual decir _It isn't_ que _It's not_. Las dos son correctas."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "This isn't my bag.",
            "Esta no es mi bolsa."
          ]
        },
        {
          "ej": [
            "He isn't ready yet.",
            "Él todavía no está listo."
          ]
        },
        {
          "ej": [
            "The store isn't open on Sundays.",
            "La tienda no abre los domingos."
          ]
        },
        {
          "ej": [
            "My phone isn't working.",
            "Mi teléfono no funciona."
          ]
        },
        {
          "ej": [
            "That isn't true.",
            "Eso no es verdad."
          ]
        }
      ]
    },
    {
      "h2": "Isn't al final: ¿verdad?",
      "b": [
        "Al final de una frase, _isn't it?_ equivale a \"¿verdad?\" o \"¿no?\". Si la frase es afirmativa, la pregunta es negativa. Si la frase es negativa, la pregunta es positiva.",
        {
          "ej": [
            "It's cold today, isn't it?",
            "Hace frío hoy, ¿verdad?"
          ]
        },
        {
          "ej": [
            "That isn't right, is it?",
            "Eso no está bien, ¿o sí?"
          ]
        },
        "También se usa para preguntar con sorpresa: _Isn't she your sister?_ (¿No es tu hermana?)."
      ]
    },
    {
      "h2": "Isn't, aren't y doesn't",
      "b": [
        "En español siempre decimos \"no\". En inglés la forma cambia según el verbo:",
        [
          "Con to be y he, she, it: isn't (He isn't tired).",
          "Con to be y you, we, they: [aren't](/glosario/arent/) (They aren't tired).",
          "Con otros verbos: [doesn't](/glosario/doesnt/) (He doesn't work here).",
          "Para hablar del pasado: [wasn't](/glosario/wasnt/) (He wasn't tired)."
        ]
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "He isn't work here.",
            "He doesn't work here."
          ]
        },
        "Isn't solo va con to be. Con un verbo como work, usa doesn't.",
        {
          "mal": [
            "They isn't ready.",
            "They aren't ready."
          ]
        },
        "Con they, we y you, la forma es aren't.",
        "En mensajes informales verás _isnt_ sin apóstrofe. En una escritura correcta siempre lleva apóstrofe: _isn't_."
      ]
    }
  ]
},
'thought': {
  "secciones": [
    {
      "h2": "Qué significa thought",
      "b": [
        "Thought tiene tres usos. Es el pasado de _think_: \"pensé\", \"pensaba\" o \"creía\". Es el participio de think: _I have thought about it_. Y es un sustantivo: \"un pensamiento\" o \"una idea\". Se pronuncia /θɔːt/ y rima con _caught_ y _bought_."
      ]
    },
    {
      "h2": "Cómo se usa",
      "b": [
        [
          "Pasado de think: I thought about it all night.",
          "Con that, para algo que creías: I thought that you were at work.",
          "Participio: Have you thought about it?",
          "Sustantivo: Any thoughts? (¿Alguna idea?)",
          "Expresión: I thought so (ya me parecía)."
        ],
        "_Think_ es irregular: no se dice _thinked_. Si quieres ver el verbo en presente, mira [think](/glosario/think/)."
      ]
    },
    {
      "h2": "Ejemplos",
      "b": [
        {
          "ej": [
            "I thought you were at work.",
            "Pensé que estabas en el trabajo."
          ]
        },
        {
          "ej": [
            "That thought made me smile.",
            "Ese pensamiento me hizo sonreír."
          ]
        },
        {
          "ej": [
            "I thought about it all weekend.",
            "Lo pensé todo el fin de semana."
          ]
        },
        {
          "ej": [
            "Have you thought about moving?",
            "¿Has pensado en mudarte?"
          ]
        },
        {
          "ej": [
            "Just a thought: we could leave earlier.",
            "Solo una idea: podríamos salir más temprano."
          ]
        }
      ]
    },
    {
      "h2": "Cómo se pronuncia",
      "b": [
        "Empieza con el sonido TH sordo, /θ/: pon la punta de la lengua apenas entre los dientes y deja salir el aire, sin hacer vibrar la voz. No es S, ni Z, ni T. Después va una O abierta y larga, y termina en una T suave.",
        "No la confundas con _taught_ (enseñó, de teach), que empieza con T y suena casi igual al oído."
      ]
    },
    {
      "h2": "Thought, though, through y tough",
      "b": [
        "Se escriben parecido y suenan muy distinto:",
        [
          "thought /θɔːt/: pensé o pensamiento.",
          "[though](/glosario/though/) /ðoʊ/: aunque.",
          "[through](/glosario/through/) /θruː/: a través de.",
          "[tough](/glosario/tough/) /tʌf/: difícil o duro."
        ]
      ]
    },
    {
      "h2": "Errores comunes",
      "b": [
        {
          "mal": [
            "I thinked about it.",
            "I thought about it."
          ]
        },
        {
          "mal": [
            "I have thinked a lot.",
            "I have thought a lot."
          ]
        },
        "Think es un verbo irregular: el pasado y el participio son iguales, _thought_."
      ]
    }
  ]
},
};
