/* ============================================================
   Inglés con Leo — Contenido de Preparación TOEIC (solo miembros)
   Generado a partir del contenido revisado del examen TOEIC:
   Listening (Partes 2, 3 y 4), Reading (Partes 5, 6 y 7),
   Speaking (leer en voz alta, responder preguntas, responder con
   información, dar tu opinión) y Writing (oraciones con palabras
   dadas, responder un correo y ensayo de opinión).
   En los datos la respuesta correcta suele estar en la posición 0:
   toeic.js baraja las opciones al mostrarlas con shuffleOptions().
   Excepción: en Listening Parte 2 las opciones (A)(B)(C) están
   grabadas en el audio en ese orden, así que no se barajan y la
   letra correcta ya está repartida entre A, B y C.
   Los audios se generan con tools/generar_toeic_audios.py.
   ============================================================ */

const TOEIC_LISTENING = {
 "questionResponse": [
  {
   "id": "toeic-l2-01",
   "audioFile": "audio/toeic/l-p2-01.mp3",
   "question": "Where should I leave these boxes?",
   "responses": [
    "Yes, I left early.",
    "Next to the supply closet, please.",
    "They're very heavy."
   ],
   "correct": 1,
   "transcript": "Where should I leave these boxes?\n(A) Yes, I left early.\n(B) Next to the supply closet, please.\n(C) They're very heavy.",
   "explain": "La pregunta es Where (dónde). Solo la B dice un lugar. La C habla de las cajas, pero no dice dónde dejarlas."
  },
  {
   "id": "toeic-l2-02",
   "audioFile": "audio/toeic/l-p2-02.mp3",
   "question": "When does the quarterly budget meeting start?",
   "responses": [
    "At ten thirty in Room 4.",
    "The budget was approved.",
    "In the conference hall downtown."
   ],
   "correct": 0,
   "transcript": "When does the quarterly budget meeting start?\n(A) At ten thirty in Room 4.\n(B) The budget was approved.\n(C) In the conference hall downtown.",
   "explain": "When pide un momento: at ten thirty. La C responde dónde, no cuándo, una trampa muy común."
  },
  {
   "id": "toeic-l2-03",
   "audioFile": "audio/toeic/l-p2-03.mp3",
   "question": "Who's in charge of ordering office supplies?",
   "responses": [
    "I ordered the chicken.",
    "About twenty dollars.",
    "Ms. Patel handles that now."
   ],
   "correct": 2,
   "transcript": "Who's in charge of ordering office supplies?\n(A) I ordered the chicken.\n(B) About twenty dollars.\n(C) Ms. Patel handles that now.",
   "explain": "Who pide una persona. La A repite la palabra order para confundirte, pero habla de comida."
  },
  {
   "id": "toeic-l2-04",
   "audioFile": "audio/toeic/l-p2-04.mp3",
   "question": "Why was the delivery delayed?",
   "responses": [
    "Because of a problem at the warehouse.",
    "By express mail.",
    "No, I didn't deliver it."
   ],
   "correct": 0,
   "transcript": "Why was the delivery delayed?\n(A) Because of a problem at the warehouse.\n(B) By express mail.\n(C) No, I didn't deliver it.",
   "explain": "Why pide una razón y la A empieza con because. Las preguntas con Why casi nunca se responden con yes o no."
  },
  {
   "id": "toeic-l2-05",
   "audioFile": "audio/toeic/l-p2-05.mp3",
   "question": "Would you like me to print the agenda for you?",
   "responses": [
    "The printer is on the second floor.",
    "That would be great, thanks.",
    "I printed my name."
   ],
   "correct": 1,
   "transcript": "Would you like me to print the agenda for you?\n(A) The printer is on the second floor.\n(B) That would be great, thanks.\n(C) I printed my name.",
   "explain": "Es un ofrecimiento (Would you like me to...?). La respuesta natural es aceptarlo o rechazarlo con amabilidad."
  },
  {
   "id": "toeic-l2-06",
   "audioFile": "audio/toeic/l-p2-06.mp3",
   "question": "Haven't you finished the sales report yet?",
   "responses": [
    "The sales team is on the third floor.",
    "Almost, I just need to add the charts.",
    "I'll take the red one."
   ],
   "correct": 1,
   "transcript": "Haven't you finished the sales report yet?\n(A) The sales team is on the third floor.\n(B) Almost, I just need to add the charts.\n(C) I'll take the red one.",
   "explain": "Es una pregunta negativa sobre si ya terminó. Almost responde directamente, aunque no diga yes o no."
  },
  {
   "id": "toeic-l2-07",
   "audioFile": "audio/toeic/l-p2-07.mp3",
   "question": "How often do you travel for work?",
   "responses": [
    "About twice a month.",
    "By train, usually.",
    "It was a long trip."
   ],
   "correct": 0,
   "transcript": "How often do you travel for work?\n(A) About twice a month.\n(B) By train, usually.\n(C) It was a long trip.",
   "explain": "How often pregunta la frecuencia. By train respondería How, no How often."
  },
  {
   "id": "toeic-l2-08",
   "audioFile": "audio/toeic/l-p2-08.mp3",
   "question": "Should we hire a caterer or order from the café downstairs?",
   "responses": [
    "Yes, we should.",
    "Lunch was delicious.",
    "The café is cheaper, so let's go with that."
   ],
   "correct": 2,
   "transcript": "Should we hire a caterer or order from the café downstairs?\n(A) Yes, we should.\n(B) Lunch was delicious.\n(C) The café is cheaper, so let's go with that.",
   "explain": "En preguntas de elección (A or B) casi nunca se contesta con yes. Lo correcto es elegir una opción."
  },
  {
   "id": "toeic-l2-09",
   "audioFile": "audio/toeic/l-p2-09.mp3",
   "question": "The new software is much faster, isn't it?",
   "responses": [
    "I haven't had a chance to try it yet.",
    "It's on sale.",
    "Faster than the bus."
   ],
   "correct": 0,
   "transcript": "The new software is much faster, isn't it?\n(A) I haven't had a chance to try it yet.\n(B) It's on sale.\n(C) Faster than the bus.",
   "explain": "Es una pregunta de confirmación (isn't it?). Decir que todavía no lo has probado es una respuesta natural e indirecta."
  },
  {
   "id": "toeic-l2-10",
   "audioFile": "audio/toeic/l-p2-10.mp3",
   "question": "Can you cover my shift on Friday?",
   "responses": [
    "It's covered in the manual.",
    "Sorry, I already have plans that day.",
    "The shift starts at nine."
   ],
   "correct": 1,
   "transcript": "Can you cover my shift on Friday?\n(A) It's covered in the manual.\n(B) Sorry, I already have plans that day.\n(C) The shift starts at nine.",
   "explain": "Es una petición. La A usa covered con otro significado para confundirte."
  },
  {
   "id": "toeic-l2-11",
   "audioFile": "audio/toeic/l-p2-11.mp3",
   "question": "Where can I find the updated price list?",
   "responses": [
    "The prices went up.",
    "I found it very useful.",
    "It's been posted on the company intranet."
   ],
   "correct": 2,
   "transcript": "Where can I find the updated price list?\n(A) The prices went up.\n(B) I found it very useful.\n(C) It's been posted on the company intranet.",
   "explain": "Where pide un lugar: on the company intranet. La B repite find para distraerte."
  },
  {
   "id": "toeic-l2-12",
   "audioFile": "audio/toeic/l-p2-12.mp3",
   "question": "Why don't we move the meeting to Thursday?",
   "responses": [
    "Because I was busy.",
    "I moved to a new apartment.",
    "Good idea, most of the team is free then."
   ],
   "correct": 2,
   "transcript": "Why don't we move the meeting to Thursday?\n(A) Because I was busy.\n(B) I moved to a new apartment.\n(C) Good idea, most of the team is free then.",
   "explain": "Why don't we...? no pide una razón: es una sugerencia. Por eso Because es una trampa."
  }
 ],
 "conversations": [
  {
   "id": "toeic-l3-01",
   "audioFile": "audio/toeic/l-p3-01.mp3",
   "transcript": "Woman: Hi Daniel, the printer paper we ordered last week still hasn't arrived. Do you know what happened?\nMan: I called the supplier this morning. They said the order was sent to our old address on Pine Street.\nWoman: That's frustrating. We have a big client presentation on Wednesday, and we need to print the handouts.\nMan: Don't worry. They promised to deliver a new box by tomorrow afternoon, at no extra charge.",
   "questions": [
    {
     "q": "What problem does the woman mention?",
     "options": [
      "An order has not arrived.",
      "A printer is broken.",
      "A client canceled a meeting.",
      "A presentation was moved."
     ],
     "correct": 0,
     "explain": "Dice que el papel que pidieron still hasn't arrived."
    },
    {
     "q": "Why was the order delayed?",
     "options": [
      "It was sent to an old address.",
      "The supplier ran out of paper.",
      "The payment was not accepted.",
      "A delivery truck broke down."
     ],
     "correct": 0,
     "explain": "El hombre explica que lo enviaron a su dirección anterior en Pine Street."
    },
    {
     "q": "What does the man say the supplier will do?",
     "options": [
      "Deliver a replacement for free",
      "Give a discount on the next order",
      "Call the client directly",
      "Send a new invoice"
     ],
     "correct": 0,
     "explain": "Deliver a new box... at no extra charge significa sin costo extra."
    }
   ]
  },
  {
   "id": "toeic-l3-02",
   "audioFile": "audio/toeic/l-p3-02.mp3",
   "transcript": "Man: Good morning, this is Kevin from Brightline Logistics. We'd like to invite you for an interview for the customer service position. Are you available next Tuesday at eleven?\nWoman: Thank you so much for calling. Tuesday morning is difficult because I'm finishing a training course. Would Wednesday work instead?\nMan: Wednesday at two is open. Please bring a copy of your ID and two references.\nWoman: Perfect, I'll be there. Should I go to the main office on Harbor Avenue?\nMan: Yes, and check in at the front desk on the first floor.",
   "questions": [
    {
     "q": "Why is the man calling?",
     "options": [
      "To schedule a job interview",
      "To confirm a delivery",
      "To offer a training course",
      "To ask for a reference"
     ],
     "correct": 0,
     "explain": "Invita a la mujer a una entrevista para un puesto de servicio al cliente."
    },
    {
     "q": "Why can't the woman come on Tuesday?",
     "options": [
      "She is completing a course.",
      "She is traveling for work.",
      "She has another interview.",
      "She is not feeling well."
     ],
     "correct": 0,
     "explain": "Dice que está terminando un curso de capacitación (training course)."
    },
    {
     "q": "What should the woman bring?",
     "options": [
      "Identification and references",
      "A laptop",
      "Her university diploma",
      "A cover letter"
     ],
     "correct": 0,
     "explain": "El hombre pide a copy of your ID and two references."
    }
   ]
  },
  {
   "id": "toeic-l3-03",
   "audioFile": "audio/toeic/l-p3-03.mp3",
   "transcript": "Woman: Excuse me, I booked the Maple Room for a training session at three, but the projector isn't working.\nMan: I'm sorry about that. Our technician is at lunch until two thirty.\nWoman: The session starts in forty minutes, and I have twenty people coming.\nMan: In that case, you can use the Oak Room across the hall. It has a projector, and it's free all afternoon.",
   "questions": [
    {
     "q": "Where most likely does the conversation take place?",
     "options": [
      "At a conference center",
      "At a restaurant",
      "At a train station",
      "At a clothing store"
     ],
     "correct": 0,
     "explain": "Hablan de reservar salas (rooms) para una sesión de capacitación."
    },
    {
     "q": "What is the woman's problem?",
     "options": [
      "Some equipment is not working.",
      "Her room is too small.",
      "She lost her keys.",
      "Her guests are late."
     ],
     "correct": 0,
     "explain": "El proyector no funciona (the projector isn't working)."
    },
    {
     "q": "What does the man suggest?",
     "options": [
      "Using a different room",
      "Postponing the session",
      "Calling another technician",
      "Buying a new projector"
     ],
     "correct": 0,
     "explain": "Le ofrece la Oak Room, que está al otro lado del pasillo."
    }
   ]
  },
  {
   "id": "toeic-l3-04",
   "audioFile": "audio/toeic/l-p3-04.mp3",
   "transcript": "Man: Linda, have you seen the new policy about working from home?\nWoman: Yes, starting next month we can work remotely two days a week, right?\nMan: That's right, but we need to get approval from our team leader first.\nWoman: I'll send my request today. I'd like to work from home on Mondays and Fridays.",
   "questions": [
    {
     "q": "What are the speakers mainly discussing?",
     "options": [
      "A new company policy",
      "A sales report",
      "A team lunch",
      "An office move"
     ],
     "correct": 0,
     "explain": "Toda la conversación es sobre la nueva política de trabajo desde casa."
    },
    {
     "q": "What must employees do first?",
     "options": [
      "Get approval from a team leader",
      "Complete an online training",
      "Buy new equipment",
      "Sign a new contract"
     ],
     "correct": 0,
     "explain": "We need to get approval from our team leader first."
    },
    {
     "q": "What will the woman probably do today?",
     "options": [
      "Submit a request",
      "Leave work early",
      "Call a client",
      "Update a team schedule"
     ],
     "correct": 0,
     "explain": "Dice I'll send my request today."
    }
   ]
  },
  {
   "id": "toeic-l3-05",
   "audioFile": "audio/toeic/l-p3-05.mp3",
   "transcript": "Woman: Hi, I need to change my flight to Chicago. I was booked on the eight a.m. flight tomorrow.\nMan: Let me check. The next available flight leaves at one fifteen in the afternoon. There's a fifty-dollar change fee.\nWoman: That's fine. My meeting was moved to the evening anyway.\nMan: All right, I've updated your ticket. You'll get a new confirmation by e-mail.",
   "questions": [
    {
     "q": "Who most likely is the man?",
     "options": [
      "An airline agent",
      "A hotel manager",
      "A taxi driver",
      "A tour guide"
     ],
     "correct": 0,
     "explain": "Cambia un vuelo y menciona una tarifa por cambio: trabaja para la aerolínea."
    },
    {
     "q": "Why does the woman want to change her flight?",
     "options": [
      "Her meeting was rescheduled.",
      "Her flight was canceled.",
      "She missed her flight.",
      "She lost her ticket."
     ],
     "correct": 0,
     "explain": "My meeting was moved to the evening: su reunión cambió de hora."
    },
    {
     "q": "What will the woman receive?",
     "options": [
      "A confirmation by e-mail",
      "A full refund",
      "A free upgrade",
      "A printed ticket"
     ],
     "correct": 0,
     "explain": "You'll get a new confirmation by e-mail."
    }
   ]
  },
  {
   "id": "toeic-l3-06",
   "audioFile": "audio/toeic/l-p3-06.mp3",
   "transcript": "Man: Did you hear that we're opening a second branch in Monterrey next spring?\nWoman: Yes! Management said they'll need around fifteen new employees there.\nMan: I'm thinking of applying for the branch manager position. I grew up there, so I know the area well.\nWoman: You'd be great for it. Internal applications close on the twentieth, so don't wait too long.",
   "questions": [
    {
     "q": "What plan does the man mention?",
     "options": [
      "Open a new location",
      "Close an office",
      "Launch a new product",
      "Reduce its staff"
     ],
     "correct": 0,
     "explain": "Van a abrir una segunda sucursal (branch) en Monterrey."
    },
    {
     "q": "Why does the man think he is a good candidate?",
     "options": [
      "He knows the area.",
      "He has a business degree.",
      "He speaks three languages.",
      "He designed the new office."
     ],
     "correct": 0,
     "explain": "Dice I grew up there, so I know the area well."
    },
    {
     "q": "What does the woman remind the man about?",
     "options": [
      "A deadline",
      "A meeting",
      "A salary increase",
      "A training program"
     ],
     "correct": 0,
     "explain": "Las solicitudes cierran el día veinte: es una fecha límite (deadline)."
    }
   ]
  }
 ],
 "talks": [
  {
   "id": "toeic-l4-01",
   "audioFile": "audio/toeic/l-p4-01.mp3",
   "kind": "Voicemail",
   "transcript": "Hello, this is a message for Mr. Alan Brooks from Summit Office Furniture. The desks you ordered are ready, but the chairs will arrive a week later than planned because of high demand. We can deliver the desks this Thursday, or we can wait and deliver everything together next week. Please call me back at 555-0148 to let me know which option you prefer. Thank you.",
   "questions": [
    {
     "q": "Why is the speaker calling?",
     "options": [
      "To report a delay in part of an order",
      "To cancel an order",
      "To request a payment",
      "To offer a discount"
     ],
     "correct": 0,
     "explain": "Las sillas llegarán una semana tarde: parte del pedido se retrasa."
    },
    {
     "q": "Why will the chairs arrive late?",
     "options": [
      "There is high demand.",
      "There was a shipping error.",
      "The weather was bad.",
      "A factory closed."
     ],
     "correct": 0,
     "explain": "Dice because of high demand."
    },
    {
     "q": "What is the listener asked to do?",
     "options": [
      "Choose a delivery option",
      "Pay a late fee",
      "Visit the store",
      "Confirm his address"
     ],
     "correct": 0,
     "explain": "Le pide llamar para decir qué opción de entrega prefiere."
    }
   ]
  },
  {
   "id": "toeic-l4-02",
   "audioFile": "audio/toeic/l-p4-02.mp3",
   "kind": "Announcement",
   "transcript": "Attention, passengers on the eleven forty train to Boston. Because of maintenance work on the tracks, this train will depart from platform seven instead of platform three. The departure time has not changed. Passengers who need assistance with luggage can ask any staff member in a blue vest. We thank you for your patience.",
   "questions": [
    {
     "q": "Where is the announcement being made?",
     "options": [
      "At a train station",
      "At an airport",
      "On a bus",
      "At a hotel"
     ],
     "correct": 0,
     "explain": "Habla de un tren, andenes (platforms) y vías."
    },
    {
     "q": "What has changed?",
     "options": [
      "The platform",
      "The departure time",
      "The destination",
      "The ticket price"
     ],
     "correct": 0,
     "explain": "Sale del andén siete en lugar del tres. La hora no cambió."
    },
    {
     "q": "Who can help passengers with their luggage?",
     "options": [
      "Staff members in blue vests",
      "The train driver",
      "The ticket office",
      "Security guards"
     ],
     "correct": 0,
     "explain": "Any staff member in a blue vest."
    }
   ]
  },
  {
   "id": "toeic-l4-03",
   "audioFile": "audio/toeic/l-p4-03.mp3",
   "kind": "Talk",
   "transcript": "Good morning, everyone. Before we start, I'd like to share some good news. Our customer satisfaction scores went up twelve percent this quarter, mostly thanks to the new online chat service. To keep improving, we'll be offering a short workshop on handling difficult customers next Friday. Please sign up with Maria in Human Resources by Wednesday, because space is limited to twenty people.",
   "questions": [
    {
     "q": "What is the main purpose of the talk?",
     "options": [
      "To share results and announce a workshop",
      "To introduce a new manager",
      "To explain budget cuts",
      "To present a new product"
     ],
     "correct": 0,
     "explain": "Comparte buenos resultados y anuncia un taller."
    },
    {
     "q": "According to the speaker, what caused the improvement?",
     "options": [
      "A new online chat service",
      "Longer store hours",
      "Lower prices",
      "A new website design"
     ],
     "correct": 0,
     "explain": "Mostly thanks to the new online chat service."
    },
    {
     "q": "Why should listeners sign up early?",
     "options": [
      "Space is limited.",
      "The workshop is expensive.",
      "The location is far away.",
      "It starts very early."
     ],
     "correct": 0,
     "explain": "Space is limited to twenty people."
    }
   ]
  },
  {
   "id": "toeic-l4-04",
   "audioFile": "audio/toeic/l-p4-04.mp3",
   "kind": "Advertisement",
   "transcript": "Are you tired of spending hours on your company's accounting? Clearbooks is a simple online tool that tracks your expenses, sends invoices automatically, and prepares reports in minutes. More than ten thousand small businesses already use it. Try Clearbooks free for thirty days, with no credit card required. Visit clearbooks dot com today.",
   "questions": [
    {
     "q": "What is being advertised?",
     "options": [
      "Accounting software",
      "A bank account",
      "A training course",
      "An office space"
     ],
     "correct": 0,
     "explain": "Es una herramienta en línea para la contabilidad (accounting)."
    },
    {
     "q": "How many businesses use the product?",
     "options": [
      "More than ten thousand",
      "About one thousand",
      "Five hundred",
      "Thirty"
     ],
     "correct": 0,
     "explain": "More than ten thousand small businesses already use it."
    },
    {
     "q": "What can listeners do for thirty days?",
     "options": [
      "Try the product for free",
      "Get a free credit card",
      "Receive a consultation",
      "Borrow a laptop"
     ],
     "correct": 0,
     "explain": "Try Clearbooks free for thirty days."
    }
   ]
  }
 ]
};

const TOEIC_READING = {
 "incompleteSentences": [
  {
   "id": "toeic-r5-01",
   "sentence": "All employees are required to ___ their ID badges at all times.",
   "options": [
    "wear",
    "wearing",
    "worn",
    "wears"
   ],
   "correct": 0,
   "explain": "Después de be required to va el verbo en forma base: wear."
  },
  {
   "id": "toeic-r5-02",
   "sentence": "The marketing team met the deadline ___ the heavy workload.",
   "options": [
    "despite",
    "although",
    "because",
    "even"
   ],
   "correct": 0,
   "explain": "Despite va seguido de un sustantivo (the heavy workload). Although necesitaría una oración completa."
  },
  {
   "id": "toeic-r5-03",
   "sentence": "Ms. Chen will be ___ for the new product launch in Asia.",
   "options": [
    "responsible",
    "responsibility",
    "responsibly",
    "respond"
   ],
   "correct": 0,
   "explain": "Después de will be se necesita un adjetivo: responsible for."
  },
  {
   "id": "toeic-r5-04",
   "sentence": "Please submit your expense reports ___ Friday at 5 p.m.",
   "options": [
    "by",
    "until",
    "since",
    "during"
   ],
   "correct": 0,
   "explain": "By indica una fecha límite: a más tardar el viernes."
  },
  {
   "id": "toeic-r5-05",
   "sentence": "The conference room on the fifth floor is ___ being renovated.",
   "options": [
    "currently",
    "lately",
    "recently",
    "finally"
   ],
   "correct": 0,
   "explain": "Currently significa en este momento y combina con is being renovated."
  },
  {
   "id": "toeic-r5-06",
   "sentence": "Mr. Ruiz asked his assistant to ___ the meeting with the suppliers.",
   "options": [
    "reschedule",
    "rescheduling",
    "rescheduled",
    "to reschedule"
   ],
   "correct": 0,
   "explain": "Después de asked someone to va el verbo base. To ya está en la oración."
  },
  {
   "id": "toeic-r5-07",
   "sentence": "Neither the manager ___ the director was available to sign the contract.",
   "options": [
    "nor",
    "or",
    "and",
    "but"
   ],
   "correct": 0,
   "explain": "Neither siempre va con nor."
  },
  {
   "id": "toeic-r5-08",
   "sentence": "The company's profits have increased ___ since the new CEO was appointed.",
   "options": [
    "significantly",
    "significant",
    "significance",
    "signify"
   ],
   "correct": 0,
   "explain": "Para modificar al verbo increased se necesita un adverbio: significantly."
  },
  {
   "id": "toeic-r5-09",
   "sentence": "Customers who ___ online before March 1 will receive a 10% discount.",
   "options": [
    "register",
    "registers",
    "registering",
    "registration"
   ],
   "correct": 0,
   "explain": "Customers es plural, así que después de who va register sin -s."
  },
  {
   "id": "toeic-r5-10",
   "sentence": "The shipment ___ yesterday, but it has not been inspected yet.",
   "options": [
    "arrived",
    "has arrived",
    "arrives",
    "arriving"
   ],
   "correct": 0,
   "explain": "Yesterday marca un momento terminado del pasado: pasado simple."
  },
  {
   "id": "toeic-r5-11",
   "sentence": "Our new office is ___ located near the central train station.",
   "options": [
    "conveniently",
    "convenient",
    "convenience",
    "convene"
   ],
   "correct": 0,
   "explain": "Antes del participio located va un adverbio: conveniently located."
  },
  {
   "id": "toeic-r5-12",
   "sentence": "Applicants must have at least three years of ___ in sales.",
   "options": [
    "experience",
    "experienced",
    "experiencing",
    "experiment"
   ],
   "correct": 0,
   "explain": "Después de years of va un sustantivo: experience."
  },
  {
   "id": "toeic-r5-13",
   "sentence": "The CEO thanked the staff for ___ hard work during the merger.",
   "options": [
    "their",
    "them",
    "they",
    "theirs"
   ],
   "correct": 0,
   "explain": "Antes de un sustantivo (hard work) va un posesivo: their."
  },
  {
   "id": "toeic-r5-14",
   "sentence": "If the printer ___ again, please contact the IT department.",
   "options": [
    "breaks down",
    "will break down",
    "broke down",
    "breaking down"
   ],
   "correct": 0,
   "explain": "En la parte con if del primer condicional se usa presente simple."
  },
  {
   "id": "toeic-r5-15",
   "sentence": "The training session was so ___ that many employees asked for a second one.",
   "options": [
    "informative",
    "inform",
    "information",
    "informed"
   ],
   "correct": 0,
   "explain": "Después de was so se necesita un adjetivo que describa la sesión: informative."
  },
  {
   "id": "toeic-r5-16",
   "sentence": "Please ___ from using your mobile phone during the presentation.",
   "options": [
    "refrain",
    "avoid",
    "prevent",
    "stop"
   ],
   "correct": 0,
   "explain": "El único verbo que va con from en este sentido es refrain from (abstenerse de)."
  },
  {
   "id": "toeic-r5-17",
   "sentence": "The budget proposal must be approved ___ it can be implemented.",
   "options": [
    "before",
    "while",
    "unless",
    "whether"
   ],
   "correct": 0,
   "explain": "Primero se aprueba y después se aplica: before."
  },
  {
   "id": "toeic-r5-18",
   "sentence": "Mr. Tanaka has worked at the firm ___ fifteen years.",
   "options": [
    "for",
    "since",
    "during",
    "ago"
   ],
   "correct": 0,
   "explain": "For va con una cantidad de tiempo. Since va con un punto de inicio (since 2010)."
  },
  {
   "id": "toeic-r5-19",
   "sentence": "The new policy applies to all employees, ___ their position.",
   "options": [
    "regardless of",
    "in spite",
    "even though",
    "in order to"
   ],
   "correct": 0,
   "explain": "Regardless of significa sin importar, y va seguido de un sustantivo."
  },
  {
   "id": "toeic-r5-20",
   "sentence": "Ms. Okafor was ___ to regional manager last month.",
   "options": [
    "promoted",
    "promotion",
    "promoting",
    "promote"
   ],
   "correct": 0,
   "explain": "Voz pasiva: was promoted (fue ascendida)."
  }
 ],
 "textCompletion": [
  {
   "id": "toeic-r6-01",
   "title": "E-mail: Office renovation",
   "text": "To: All staff\nFrom: Facilities Department\nSubject: Office renovation\n\nStarting on Monday, June 3, the third floor will be closed for renovation. During this time, employees from the third floor will {1} to temporary desks on the fifth floor. {2} The renovation is expected to last about three weeks. We apologize for any inconvenience and thank you for your {3}. If you have any questions, please contact Paula Grant, {4} is coordinating the project.",
   "blanks": [
    {
     "options": [
      "be moved",
      "moving",
      "have moved",
      "move"
     ],
     "correct": 0,
     "explain": "Los empleados no se mueven solos: los mueven. Voz pasiva en futuro: will be moved.",
     "isSentence": false
    },
    {
     "options": [
      "Boxes for packing your personal items will be available on Friday.",
      "The cafeteria menu will include new vegetarian options.",
      "Our sales grew by ten percent last year.",
      "Please remember to submit your vacation requests."
     ],
     "correct": 0,
     "explain": "La oración tiene que seguir el tema de la mudanza de escritorios: las cajas para empacar.",
     "isSentence": true
    },
    {
     "options": [
      "patience",
      "patient",
      "patiently",
      "patients"
     ],
     "correct": 0,
     "explain": "Después de your va un sustantivo: patience (paciencia). Patients son pacientes de un hospital.",
     "isSentence": false
    },
    {
     "options": [
      "who",
      "which",
      "whom",
      "whose"
     ],
     "correct": 0,
     "explain": "Paula Grant es una persona y es el sujeto de is coordinating: who.",
     "isSentence": false
    }
   ]
  },
  {
   "id": "toeic-r6-02",
   "title": "Advertisement: Greenway Bank",
   "text": "Greenway Bank is pleased to announce the opening of our new branch on Lake Street. To celebrate, we are offering free checking accounts to all new customers {1} open an account before the end of the month. The branch will be open from 8 a.m. to 6 p.m., Monday through Saturday, {2} longer hours than any other bank in the area. {3} In addition, our friendly staff will be happy to help you set up online banking, which allows you to manage your money {4} from your phone.",
   "blanks": [
    {
     "options": [
      "who",
      "which",
      "whose",
      "what"
     ],
     "correct": 0,
     "explain": "Customers son personas y son el sujeto de open: who.",
     "isSentence": false
    },
    {
     "options": [
      "offering",
      "offer",
      "offered",
      "offers"
     ],
     "correct": 0,
     "explain": "Después de la coma, offering agrega información sobre el horario (que ofrece más horas).",
     "isSentence": false
    },
    {
     "options": [
      "Customers can also visit on Sundays by appointment.",
      "The bank was founded in a small village.",
      "Many employees prefer to work from home.",
      "The weather in the region is usually mild."
     ],
     "correct": 0,
     "explain": "Viene justo después del horario, así que la oración lógica también habla de cuándo visitar el banco.",
     "isSentence": true
    },
    {
     "options": [
      "easily",
      "easy",
      "ease",
      "easier"
     ],
     "correct": 0,
     "explain": "Para modificar al verbo manage se necesita un adverbio: easily.",
     "isSentence": false
    }
   ]
  },
  {
   "id": "toeic-r6-03",
   "title": "Memo: New expense system",
   "text": "To: All employees\nFrom: Finance Department\n\nPlease note that, {1} July 1, all travel expenses must be submitted through the new online system. Paper forms will no longer be accepted. Employees should upload their receipts within ten days of {2} from a business trip. {3} Managers will review each request and approve it within five business days. This change will help us process reimbursements more {4}.",
   "blanks": [
    {
     "options": [
      "effective",
      "effect",
      "affecting",
      "effectively"
     ],
     "correct": 0,
     "explain": "Effective July 1 es una expresión fija: a partir del 1 de julio.",
     "isSentence": false
    },
    {
     "options": [
      "returning",
      "return",
      "returned",
      "to return"
     ],
     "correct": 0,
     "explain": "Después de la preposición of, el verbo va con -ing: returning.",
     "isSentence": false
    },
    {
     "options": [
      "A short video explaining how to use the system is available on the intranet.",
      "Our company picnic will take place in August.",
      "The new printers were installed last week.",
      "Several clients have praised our customer service."
     ],
     "correct": 0,
     "explain": "El memo explica el sistema nuevo, así que tiene sentido ofrecer un video de cómo usarlo.",
     "isSentence": true
    },
    {
     "options": [
      "quickly",
      "quick",
      "quicker",
      "quickness"
     ],
     "correct": 0,
     "explain": "Process... more ___ necesita un adverbio: more quickly.",
     "isSentence": false
    }
   ]
  }
 ],
 "comprehension": [
  {
   "id": "toeic-r7-01",
   "title": "Notice",
   "kind": "Notice",
   "text": "NOTICE TO TENANTS\nHarbor View Business Center\n\nThe main elevators will be out of service on Saturday, October 12, from 7 a.m. to 3 p.m. for scheduled maintenance. During this time, tenants may use the freight elevator located at the rear of the building. Deliveries planned for that day should be rescheduled. For questions, please contact building management at extension 204.",
   "questions": [
    {
     "q": "What is the purpose of the notice?",
     "options": [
      "To inform tenants about maintenance work",
      "To announce a new tenant",
      "To advertise office space",
      "To explain a rent increase"
     ],
     "correct": 0,
     "explain": "Avisa que los elevadores estarán fuera de servicio por mantenimiento."
    },
    {
     "q": "What are tenants advised to do?",
     "options": [
      "Reschedule deliveries",
      "Work from home",
      "Use only the stairs",
      "Call a technician"
     ],
     "correct": 0,
     "explain": "Deliveries planned for that day should be rescheduled."
    },
    {
     "q": "Where is the freight elevator?",
     "options": [
      "At the back of the building",
      "Next to the main entrance",
      "On the roof",
      "In the parking garage"
     ],
     "correct": 0,
     "explain": "At the rear of the building: rear significa la parte de atrás."
    }
   ]
  },
  {
   "id": "toeic-r7-02",
   "title": "E-mail",
   "kind": "E-mail",
   "text": "From: Rachel Moore, Human Resources, Novatech Solutions\nTo: Carlos Mendoza\nSubject: Job offer\n\nDear Mr. Mendoza,\n\nThank you for interviewing with us last week. We are pleased to offer you the position of Junior Data Analyst, starting on November 4. Your starting salary will be $3,200 per month, and you will be eligible for health insurance after a three-month trial period.\n\nPlease confirm your acceptance by replying to this e-mail no later than October 25. On your first day, please report to the reception desk at 8:30 a.m., where your supervisor, Mr. Hill, will meet you.\n\nWe look forward to working with you.\nRachel Moore",
   "questions": [
    {
     "q": "Why was the e-mail sent?",
     "options": [
      "To offer a job",
      "To schedule an interview",
      "To reject an application",
      "To request documents"
     ],
     "correct": 0,
     "explain": "We are pleased to offer you the position."
    },
    {
     "q": "When will Mr. Mendoza be eligible for health insurance?",
     "options": [
      "After three months",
      "Immediately",
      "After one year",
      "On October 25"
     ],
     "correct": 0,
     "explain": "After a three-month trial period."
    },
    {
     "q": "What is Mr. Mendoza asked to do by October 25?",
     "options": [
      "Confirm that he accepts the offer",
      "Send his resume",
      "Meet Mr. Hill",
      "Complete a trial period"
     ],
     "correct": 0,
     "explain": "Please confirm your acceptance... no later than October 25."
    }
   ]
  },
  {
   "id": "toeic-r7-03",
   "title": "Text message chain",
   "kind": "Text messages",
   "text": "Sofia Ruiz (9:12 a.m.): Hi Mark, the client from Delta Foods just called. They want to move our meeting from 2 p.m. to 11 a.m.\nMark Evans (9:14 a.m.): 11 works for me. Is the conference room free?\nSofia Ruiz (9:15 a.m.): I'll check. If not, we can use my office.\nMark Evans (9:16 a.m.): Great. I'll bring the updated contract.",
   "questions": [
    {
     "q": "What does Ms. Ruiz tell Mr. Evans?",
     "options": [
      "A meeting time has changed.",
      "A client canceled a meeting.",
      "A contract was signed.",
      "A room is being cleaned."
     ],
     "correct": 0,
     "explain": "El cliente quiere mover la reunión de las 2 p.m. a las 11 a.m."
    },
    {
     "q": "At 9:15 a.m., what does Ms. Ruiz most likely mean when she writes, \"I'll check\"?",
     "options": [
      "She will see if a room is available.",
      "She will call the client again.",
      "She will review the contract.",
      "She will check her e-mail."
     ],
     "correct": 0,
     "explain": "Responde a la pregunta de si la sala de juntas está libre."
    },
    {
     "q": "What will Mr. Evans bring?",
     "options": [
      "An updated contract",
      "Lunch for the client",
      "A projector",
      "Product samples"
     ],
     "correct": 0,
     "explain": "I'll bring the updated contract."
    }
   ]
  },
  {
   "id": "toeic-r7-04",
   "title": "Advertisement and e-mail",
   "kind": "Double passage",
   "text": "RIVERSIDE CATERING\nBusiness lunches delivered to your office\n\nSandwich platter (serves 10): $85\nHot lunch buffet (serves 10): $140\nDessert tray (serves 10): $45\n\nFree delivery for orders over $150. Orders must be placed at least 48 hours in advance.\n\n---\n\nTo: orders@riversidecatering.com\nFrom: Megan Price\nSubject: Order for Thursday\n\nHello,\nI would like to order one hot lunch buffet and one dessert tray for a training session this Thursday at 12:30 p.m. at our office at 55 Grand Avenue. There will be ten people. Could you also include some vegetarian options? Please let me know if this is possible.\n\nThank you,\nMegan Price",
   "questions": [
    {
     "q": "What is suggested about Ms. Price's order?",
     "options": [
      "It qualifies for free delivery.",
      "It is for twenty people.",
      "It must be paid in cash.",
      "It will arrive on Friday."
     ],
     "correct": 0,
     "explain": "140 + 45 = 185 dólares. Es más de 150, así que el envío es gratis. Hay que combinar los dos textos."
    },
    {
     "q": "What does Ms. Price ask about?",
     "options": [
      "Vegetarian options",
      "A discount",
      "A later delivery time",
      "Payment methods"
     ],
     "correct": 0,
     "explain": "Could you also include some vegetarian options?"
    },
    {
     "q": "Why is Ms. Price ordering food?",
     "options": [
      "For a training session",
      "For a birthday party",
      "For a client dinner",
      "For a conference abroad"
     ],
     "correct": 0,
     "explain": "For a training session this Thursday."
    },
    {
     "q": "What is the total cost of the food Ms. Price wants to order?",
     "options": [
      "$185",
      "$140",
      "$225",
      "$85"
     ],
     "correct": 0,
     "explain": "Buffet caliente ($140) más bandeja de postres ($45) = $185."
    }
   ]
  }
 ]
};

const TOEIC_SPEAKING = {
 "readAloud": [
  {
   "id": "toeic-s-ra-1",
   "text": "Welcome to Green Valley Market, your neighborhood store for fresh produce, bakery items, and household goods. This week, we're offering special discounts on fruits, vegetables, and cleaning supplies. Don't forget to sign up for our rewards program at the customer service desk. Thank you for shopping with us.",
   "audioFile": "audio/toeic/s-ra-1.mp3",
   "tips": [
    "En las listas (fresh produce, bakery items, and household goods) sube un poco la voz en cada elemento y bájala en el último.",
    "Haz una pausa corta en cada coma y una más larga en cada punto.",
    "Pronuncia bien la -s final de items, goods, discounts y supplies."
   ]
  },
  {
   "id": "toeic-s-ra-2",
   "text": "Thank you for calling Horizon Travel. All of our agents are currently assisting other customers. Please stay on the line, and your call will be answered in the order it was received. You can also book flights, hotels, and car rentals on our website, available twenty-four hours a day.",
   "audioFile": "audio/toeic/s-ra-2.mp3",
   "tips": [
    "No leas palabra por palabra: agrupa frases como stay on the line o in the order it was received.",
    "La -ed de received suena como una d suave, no como una sílaba extra.",
    "Lee a un ritmo tranquilo: la claridad cuenta más que la velocidad."
   ]
  },
  {
   "id": "toeic-s-ra-3",
   "text": "Good evening, and welcome to tonight's business news. Today, local manufacturers reported strong sales for the third quarter, while fuel prices continued to fall. Later in the program, we'll speak with a financial expert about what these changes mean for small businesses, consumers, and investors.",
   "audioFile": "audio/toeic/s-ra-3.mp3",
   "tips": [
    "Da énfasis a las palabras importantes: strong sales, third quarter, fuel prices.",
    "Cuidado con la pronunciación de manufacturers y financial.",
    "La lista final (small businesses, consumers, and investors) termina con la voz hacia abajo."
   ]
  }
 ],
 "respondQuestions": [
  {
   "id": "toeic-s-rq-1",
   "intro": "Imagine that a transportation company is doing research in your area. You have agreed to participate in a telephone interview about commuting.",
   "questions": [
    {
     "q": "How far is your workplace or school from your home, and how do you usually get there?",
     "audioFile": "audio/toeic/s-rq-1-1.mp3",
     "speakSec": 15,
     "sample": "My office is about ten kilometers from my home. I usually take the subway, and it takes me around thirty minutes."
    },
    {
     "q": "How much time do you spend commuting each day, and what do you do during that time?",
     "audioFile": "audio/toeic/s-rq-1-2.mp3",
     "speakSec": 15,
     "sample": "I spend about an hour a day commuting. I usually listen to podcasts or answer messages on my phone."
    },
    {
     "q": "If a new bus or train line opened near your home, would you use it instead of your current way of traveling? Why or why not?",
     "audioFile": "audio/toeic/s-rq-1-3.mp3",
     "speakSec": 30,
     "sample": "Yes, I would probably use it. Right now I drive to work, and traffic is terrible in the mornings. A train would be faster and cheaper, and I could read or relax instead of driving. The only thing I would check is how often it runs, because I need to arrive on time."
    }
   ]
  },
  {
   "id": "toeic-s-rq-2",
   "intro": "Imagine that a marketing firm is doing research about shopping habits. You have agreed to participate in a telephone interview about shopping online.",
   "questions": [
    {
     "q": "When was the last time you bought something online, and what did you buy?",
     "audioFile": "audio/toeic/s-rq-2-1.mp3",
     "speakSec": 15,
     "sample": "The last time was last week. I bought a pair of running shoes because they were cheaper online than in the store."
    },
    {
     "q": "Do you usually shop online or in physical stores? Why?",
     "audioFile": "audio/toeic/s-rq-2-2.mp3",
     "speakSec": 15,
     "sample": "I usually shop online because it saves time, and I can compare prices easily before I buy something."
    },
    {
     "q": "What are the advantages and disadvantages of buying clothes online?",
     "audioFile": "audio/toeic/s-rq-2-3.mp3",
     "speakSec": 30,
     "sample": "The main advantage is convenience: you can shop at any time and find more options than in a store. Also, there are often good discounts. The biggest disadvantage is that you can't try the clothes on, so sometimes the size is wrong and you have to return them, which takes time."
    }
   ]
  }
 ],
 "respondInfo": [
  {
   "id": "toeic-s-ri-1",
   "title": "Regional Sales Conference",
   "info": [
    [
     "Date and place",
     "Friday, May 16, Hotel Plaza, Guadalajara"
    ],
    [
     "9:00 - 9:30",
     "Registration and coffee"
    ],
    [
     "9:30 - 10:30",
     "Keynote: Trends in Online Sales (Laura Kim)"
    ],
    [
     "10:45 - 12:00",
     "Workshop: Building Customer Loyalty (David Ortiz)"
    ],
    [
     "12:00 - 1:00",
     "Lunch (included)"
    ],
    [
     "1:00 - 2:30",
     "Panel: Selling to Younger Customers (canceled)"
    ],
    [
     "2:45 - 4:00",
     "Workshop: Negotiation Skills (Laura Kim)"
    ]
   ],
   "intro": "Hi, I'm registered for the sales conference next week, but I lost my copy of the agenda. I was hoping you could answer a few questions.",
   "questions": [
    {
     "q": "What time does the conference start, and where is it being held?",
     "audioFile": "audio/toeic/s-ri-1-1.mp3",
     "speakSec": 15,
     "sample": "The conference starts at nine a.m. with registration and coffee, and it's being held at the Hotel Plaza in Guadalajara."
    },
    {
     "q": "I heard that this year lunch isn't included, so we need to bring our own. Is that right?",
     "audioFile": "audio/toeic/s-ri-1-2.mp3",
     "speakSec": 15,
     "sample": "Actually, that's not the case. Lunch is included, and it's from twelve to one."
    },
    {
     "q": "I'm especially interested in Laura Kim. Can you tell me about all the sessions she's leading?",
     "audioFile": "audio/toeic/s-ri-1-3.mp3",
     "speakSec": 30,
     "sample": "Sure. Laura Kim is leading two sessions. First, she's giving the keynote, Trends in Online Sales, from nine thirty to ten thirty. Then, in the afternoon, she's leading a workshop on negotiation skills from two forty-five to four."
    }
   ]
  },
  {
   "id": "toeic-s-ri-2",
   "title": "Interview Schedule: Assistant Store Manager",
   "info": [
    [
     "Date and place",
     "Tuesday, March 4, Room 201"
    ],
    [
     "10:00 a.m.",
     "Ana López, Cashier at Mega Mart (4 years)"
    ],
    [
     "11:00 a.m.",
     "James Carter, Shift Supervisor at City Foods (2 years)"
    ],
    [
     "1:30 p.m.",
     "Priya Singh, Store Manager at Fresh Corner (canceled)"
    ],
    [
     "2:30 p.m.",
     "Tom Walsh, Sales Associate at Home Plus (3 years)"
    ]
   ],
   "intro": "Hi, this is Robert. I'm interviewing candidates for the assistant store manager position tomorrow, but I don't have the schedule with me.",
   "questions": [
    {
     "q": "Which room are the interviews in, and who is my first interview with?",
     "audioFile": "audio/toeic/s-ri-2-1.mp3",
     "speakSec": 15,
     "sample": "The interviews are in Room 201, and your first interview is with Ana López at ten a.m."
    },
    {
     "q": "My first interview is at nine thirty, right?",
     "audioFile": "audio/toeic/s-ri-2-2.mp3",
     "speakSec": 15,
     "sample": "No, actually your first interview is at ten a.m., with Ana López."
    },
    {
     "q": "Can you tell me about the interviews scheduled for the afternoon?",
     "audioFile": "audio/toeic/s-ri-2-3.mp3",
     "speakSec": 30,
     "sample": "Sure. You had an interview with Priya Singh at one thirty, but it was canceled. Then, at two thirty, you're meeting Tom Walsh. He's currently a sales associate at Home Plus and has three years of experience."
    }
   ]
  }
 ],
 "opinion": [
  {
   "id": "toeic-s-op-1",
   "q": "Some people think employees are more productive when they work from home. Others think they work better in an office. Which opinion do you agree with? Give reasons and examples to support your opinion.",
   "audioFile": "audio/toeic/s-op-1.mp3",
   "sample": "In my opinion, most people are more productive when they work from home, at least part of the week. First, they don't waste time commuting, so they have more energy for their tasks. For example, my sister saves almost two hours a day since she started working remotely. Second, there are fewer interruptions at home, so it's easier to focus on difficult work. However, I think teams still need to meet in person sometimes to build relationships. So the best option is a mix of both."
  },
  {
   "id": "toeic-s-op-2",
   "q": "What is the most important quality for a good manager? Give specific reasons and examples to support your opinion.",
   "audioFile": "audio/toeic/s-op-2.mp3",
   "sample": "I believe the most important quality for a good manager is good communication. A manager needs to explain goals clearly, so everyone knows what to do and why it matters. For example, in my last job, my manager explained our monthly targets in a short meeting every Monday, and the whole team felt more motivated. Also, a good communicator listens to the team, which helps solve problems before they become serious. Without clear communication, even a very intelligent manager can fail."
  },
  {
   "id": "toeic-s-op-3",
   "q": "Do you agree or disagree with the following statement? Companies should pay for their employees to learn a foreign language. Give reasons and examples to support your opinion.",
   "audioFile": "audio/toeic/s-op-3.mp3",
   "sample": "I agree that companies should pay for their employees to learn a foreign language. First, it helps the company grow, because employees can talk to international clients and suppliers. For instance, a company that exports products needs people who can negotiate in English. Second, it's a good way to keep employees motivated, since they feel the company is investing in their future. In the long run, the cost of the classes is small compared to the benefits."
  }
 ]
};

const TOEIC_WRITING = {
 "sentence": [
  {
   "id": "toeic-w-s-1",
   "scene": "Una mujer está hablando por teléfono en su escritorio mientras mira la pantalla de su computadora.",
   "words": [
    "woman",
    "while"
   ],
   "example": "The woman is talking on the phone while she looks at her computer screen."
  },
  {
   "id": "toeic-w-s-2",
   "scene": "Varias personas esperan formadas frente a una cafetería por la mañana.",
   "words": [
    "line",
    "in front of"
   ],
   "example": "Several people are waiting in line in front of a coffee shop."
  },
  {
   "id": "toeic-w-s-3",
   "scene": "Un hombre sube cajas a un camión de reparto estacionado en la calle.",
   "words": [
    "load",
    "truck"
   ],
   "example": "A man is loading boxes into a delivery truck."
  },
  {
   "id": "toeic-w-s-4",
   "scene": "Dos compañeros revisan un documento en una sala de juntas antes de una reunión.",
   "words": [
    "review",
    "because"
   ],
   "example": "Two colleagues are reviewing a document because they have a meeting soon."
  },
  {
   "id": "toeic-w-s-5",
   "scene": "Una tienda de ropa tiene letreros de descuento pegados en el escaparate.",
   "words": [
    "sale",
    "so"
   ],
   "example": "The store is having a sale, so there are discount signs in the window."
  }
 ],
 "email": [
  {
   "id": "toeic-w-e-1",
   "sender": "Jennifer Wu, Office Manager",
   "subject": "Welcome lunch for new team members",
   "body": "Hello everyone,\n\nNext Friday we are organizing a lunch to welcome the five new members of our sales team. I would like this to be a relaxed event where everyone can get to know each other. If you have any ideas for the lunch, please let me know by Wednesday.\n\nThanks,\nJennifer",
   "task": "Responde al correo como si fueras parte del equipo. En tu respuesta, haz DOS preguntas y da UNA sugerencia.",
   "example": "Hi Jennifer,\n\nThank you for organizing the welcome lunch. It's a great idea. I have a couple of questions. First, will the lunch be in the office or at a restaurant? Second, should we bring anything, like a small gift for the new team members?\n\nAlso, I'd like to suggest a short activity where everyone shares one fun fact about themselves. It could help people feel more comfortable and start conversations.\n\nBest regards,\nAlex",
   "checklist": [
    "Incluiste un saludo y una despedida apropiados.",
    "Hiciste dos preguntas claras (con signo de interrogación).",
    "Diste una sugerencia concreta (I'd like to suggest..., How about...?).",
    "Tu tono es amable y profesional.",
    "Revisaste ortografía y mayúsculas."
   ]
  },
  {
   "id": "toeic-w-e-2",
   "sender": "Customer Service, UrbanGear Online Store",
   "subject": "Your recent order #48213",
   "body": "Dear Customer,\n\nThank you for your recent order. Unfortunately, the laptop bag you ordered is currently out of stock and will not be available for three weeks. We apologize for the inconvenience. Please reply to this e-mail to let us know how you would like to proceed.\n\nSincerely,\nUrbanGear Customer Service",
   "task": "Responde como el cliente. Explica UN problema que te causa el retraso y haz DOS peticiones.",
   "example": "Dear UrbanGear Customer Service,\n\nThank you for letting me know about the delay. Unfortunately, three weeks is too long for me, because I'm starting a new job next Monday and I need the bag to carry my laptop.\n\nCould you please tell me if you have a similar bag in stock that you could send this week? If not, I would like to cancel the order and receive a full refund to my credit card.\n\nI look forward to your reply.\n\nSincerely,\nMaria Gonzalez",
   "checklist": [
    "Explicaste un problema concreto que te causa el retraso.",
    "Hiciste dos peticiones claras (Could you please...?, I would like...).",
    "Usaste un tono formal pero amable.",
    "Tu correo tiene saludo, desarrollo y despedida.",
    "Revisaste ortografía y puntuación."
   ]
  }
 ],
 "essay": [
  {
   "id": "toeic-w-o-1",
   "q": "Is it better to work for a large company or a small company? Give reasons or examples to support your opinion.",
   "example": "Many people dream of working for a famous large company, but I believe that working for a small company is a better choice, especially at the beginning of a career.\n\nFirst, in a small company employees usually have more responsibilities. Because there are fewer people, you often participate in different projects and learn skills that go beyond your job description. For example, a friend of mine was hired as an accountant at a small travel agency, and in less than a year she also learned about marketing and customer service. In a large company, her tasks would probably have been limited to one area.\n\nSecond, it is easier to be noticed in a small company. Managers work closely with their teams, so good ideas and hard work are recognized quickly. This can lead to faster promotions and more confidence.\n\nOf course, large companies have some advantages, such as higher salaries, better benefits, and more stability. However, I think the experience and personal growth you get in a small company are more valuable in the long term.\n\nIn conclusion, although large companies offer security, small companies give employees more opportunities to learn and grow. For these reasons, I would prefer to work for a small company.",
   "checklist": [
    "Tu opinión aparece clara en la introducción.",
    "Tienes al menos dos razones, cada una en su propio párrafo.",
    "Diste al menos un ejemplo concreto.",
    "Mencionaste el otro punto de vista (Of course..., However...).",
    "Tienes una conclusión que repite tu opinión con otras palabras.",
    "Tu ensayo tiene alrededor de 300 palabras."
   ]
  },
  {
   "id": "toeic-w-o-2",
   "q": "Some people prefer to stay in the same job for many years. Others prefer to change jobs often. Which do you prefer and why? Give reasons or examples to support your opinion.",
   "example": "People have different ideas about the best way to build a career. Some prefer stability, while others like to change jobs every few years. Personally, I prefer to stay in the same job for a long time, as long as I can keep growing.\n\nThe first reason is that staying in one company allows you to build strong relationships. Over time, colleagues and managers learn to trust you, and that trust often leads to important projects and promotions. For instance, my uncle started as a sales assistant in a food company and, after twelve years, he became the regional director.\n\nThe second reason is stability. When you stay in the same job, you don't have to start from zero every time. You already know the systems, the clients, and the goals of the company, so you can focus on doing excellent work instead of adapting to a new environment.\n\nOn the other hand, changing jobs can help people increase their salary quickly and gain different experiences. However, changing too often can also look negative on a resume, because employers may think the person is not committed.\n\nIn conclusion, although changing jobs has some benefits, I believe that staying in the same company for many years offers more trust, stability, and long-term opportunities.",
   "checklist": [
    "Tu opinión aparece clara en la introducción.",
    "Tienes al menos dos razones bien desarrolladas.",
    "Usaste conectores (First, The second reason, On the other hand, In conclusion).",
    "Diste al menos un ejemplo personal o concreto.",
    "Tienes una conclusión clara.",
    "Tu ensayo tiene alrededor de 300 palabras."
   ]
  }
 ]
};

