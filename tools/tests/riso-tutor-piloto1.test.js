/* Riso tutor · pruebas de las correcciones del primer piloto real (27 nov 2026).
   Cada caso sale de un fallo o una respuesta parcial de la batería de 60 preguntas, más variantes nuevas.
   Se cargan desde riso-tutor.test.js (sin red, modelo simulado). */
module.exports = function (test, H) {
  const { T, K, assert } = H;
  // Estas pruebas cubren las fichas nuevas y los cambios pendientes de la aprobación de Leo: se activan solo aquí.
  const tutor = o => H.tutor(Object.assign({ fichasPendientes: true }, o || {}));
  const capa = (q, o) => H.capa(q, Object.assign({ fichasPendientes: true }, o || {}));

  // ---- FAQ: coincidencias incorrectas ----
  test('piloto · 13: make vs do ya no responde there is (la palabra «hay» no basta)', async () => {
    const r = await capa('¿Qué diferencia hay entre «make» y «do»?');
    assert.notStrictEqual(r.id, 'there-is-are', r.texto); assert.ok(/make/i.test(r.texto) && /\bdo\b/i.test(r.texto), r.texto);
  });
  ['¿Hay alguna diferencia entre much y many?', '¿Hay diferencia entre since y for?', '¿Qué diferencia hay entre say y tell?'].forEach(q =>
    test('piloto · «hay» en la pregunta no activa there is: ' + q, async () => { const r = await capa(q); assert.notStrictEqual(r.id, 'there-is-are', r.texto); }));
  test('piloto · «¿Cómo se dice hay en inglés?» sí usa la ficha de there is', async () => {
    const r = await capa('¿Cómo se dice hay en inglés?'); assert.strictEqual(r.id, 'there-is-are', r.texto);
  });

  // ---- definición general frente a uso específico ----
  test('piloto · 19: presente continuo para el futuro responde el uso de futuro, no la definición general', async () => {
    const r = await capa('¿Cuándo se usa el presente continuo para el futuro?');
    assert.strictEqual(r.id, 'presente-continuo-futuro', r.texto); assert.ok(/planes/.test(r.texto));
  });
  test('piloto · «Explícame el presente continuo» sigue siendo la definición general', async () => {
    const r = await capa('Explícame el presente continuo'); assert.strictEqual(r.id, 'presente-continuo');
  });
  test('piloto · un uso específico que ninguna ficha cubre pasa a la IA', async () => {
    for (const q of ['¿Cuándo se usa el presente continuo con always para quejarse?', '¿Se usa el pasado simple en titulares de periódico?']) {
      const t = tutor(); const r = await t.preguntar(q); assert.strictEqual(r.capa, 5, q + ' → ' + r.texto);
    }
  });
  test('piloto · presente perfecto con periodos no terminados (today, this week) lo responde la ficha revisada', async () => {
    const r = await capa('¿Se puede usar el presente perfecto con this week?'); assert.strictEqual(r.id, 'presente-perfecto', r.texto); assert.ok(/this week/.test(r.texto));
  });

  // ---- preguntas compuestas ----
  test('piloto · 20: used to y be used to responde las dos partes', async () => {
    const r = await capa('¿Qué significa «used to» y en qué se diferencia de «be used to»?');
    assert.ok(/used to \+ verbo base/i.test(r.texto) || /used to habla/i.test(r.texto), r.texto); assert.ok(/be used to/i.test(r.texto), r.texto);
  });
  test('piloto · dos preguntas de temas distintos en un mensaje pasan a la IA', async () => {
    for (const q of ['¿Qué es el presente perfecto? ¿Y cuándo uso since?', '¿Cuándo uso do y does y cómo se forma el pasado de go?']) {
      const t = tutor(); const r = await t.preguntar(q); assert.strictEqual(r.capa, 5, q + ' → ' + r.texto);
    }
  });

  // ---- nuevas fichas revisadas (sin IA) ----
  const FICHAS = [['¿Cuándo uso «would» y cuándo «will»?', 'will-would', /no expresa|sin indicar/], ['¿Por qué «people» va con «are»?', 'people', /normalmente/],
    ['¿Cuándo uso «the»?', 'the', /concreto/], ['¿Qué es un phrasal verb?', 'phrasal-verbs', /look for/], ['¿Cuál es la diferencia entre «say» y «tell»?', 'say-tell', /tell me/],
    ['¿Por qué no se dice «more better»?', 'comparativos', /much better/], ['¿Cómo se pronuncia el sonido «th»?', 'sonido-th', /sordo.*sonoro/]];
  FICHAS.forEach(([q, id, re]) => test('piloto · ficha revisada ' + id, async () => { const r = await capa(q); assert.strictEqual(r.id, id, r.texto); assert.ok(re.test(r.texto), r.texto); assert.ok(!/—/.test(r.texto)); }));
  test('piloto · matices: will no expresa certeza, people «normalmente» plural, th sonoro y sordo', () => {
    const f = id => (K.faqPendientes.find(x => x.id === id) || K.faq.find(x => x.id === id)).r;
    assert.ok(!/certeza/.test(f('will-would')) || /sin indicar/.test(f('will-would')));
    assert.ok(/normalmente/.test(f('people')) && !/siempre/.test(f('people')));
    assert.ok(/sonoro/.test(f('sonido-th')) && /sordo/.test(f('sonido-th')) && !/vibrante/.test(f('sonido-th')));
  });

  // ---- pronunciación: IPA frente a aproximación, y audio solo si existe ----
  test('piloto · 32: «thought» se presenta como IPA, sin hablar de mayúsculas ni de letras del español', async () => {
    const r = await capa('¿Cómo se pronuncia «thought»?');
    assert.ok(/IPA/.test(r.texto) && /\/θɔːt\//.test(r.texto), r.texto); assert.ok(!/mayúsculas|letras del español/.test(r.texto), r.texto);
  });
  test('piloto · «although» es aproximación para hispanohablantes con sílaba fuerte', async () => {
    const r = await capa('¿Cómo se pronuncia although?'); assert.ok(/aproximación para hispanohablantes/.test(r.texto) && /mayúsculas/.test(r.texto), r.texto);
  });
  test('piloto · el audio solo se menciona si la ficha lo tiene', async () => {
    const con = K.glosario.find(g => g.a && g.p), sin = K.glosario.find(g => !g.a && g.p);
    const a = await capa('¿Cómo se pronuncia ' + con.t + '?'); assert.ok(/audio/.test(a.texto), a.texto);
    if (sin) { const b = await capa('¿Cómo se pronuncia ' + sin.t + '?'); if (b.capa === 2) assert.ok(!/audio/.test(b.texto), b.texto); }
  });

  // ---- «dame otro ejemplo»: el modelo recibe el ejemplo ya mostrado ----
  test('piloto · 41: el historial enviable incluye el ejemplo mostrado para que la IA no lo repita', async () => {
    const t = tutor(); await t.preguntar('Explícame el presente perfecto'); await t.preguntar('Dame otro ejemplo');
    const hist = t.llamadas[0].historial.map(m => m.texto).join(' ');
    assert.ok(/Ejemplo mostrado: I have visited Mexico twice\./.test(hist), hist);
  });

  // ---- métricas separadas ----
  test('piloto · métricas: educativa sin IA, filtro y conversación por separado', async () => {
    const t = tutor();
    for (const q of ['¿Cómo se dice 7:45?', 'Explícame el presente perfecto', '¿Quién ganará mañana el partido?', 'Mi correo es ana@ejemplo.com', 'Hola', '¿Cómo se dice «matar el tiempo»?']) await t.preguntar(q);
    const m = t.metricas();
    assert.strictEqual(m.educativaSinIA, 2); assert.strictEqual(m.filtro, 2); assert.strictEqual(m.conversacion, 1); assert.strictEqual(m.capa5, 1);
    assert.strictEqual(T.categoria({ capa: 1, tipo: 'soporte' }), 'filtro'); assert.strictEqual(T.categoria({ capa: 3 }), 'educativa_sin_ia');
  });

  // ---- aprobación de Leo: nada pendiente responde a alumnos por defecto ----
  test('aprobación · solo lo que está en APROBADAS_POR_LEO responde a alumnos', async () => {
    const faq = require(H.path.join(H.ROOT, 'tools/tutor/faq.js'));
    const aprob = new Set(faq.APROBADAS_POR_LEO);
    // Toda ficha nueva o cambio propuesto que NO esté aprobado debe seguir en faqPendientes; lo aprobado, activo.
    faq.filter(f => f.estado === 'pendiente' || f.propuesta).forEach(f => {
      const activa = K.faq.find(x => x.id === f.id), pend = K.faqPendientes.some(x => x.id === f.id);
      if (aprob.has(f.id)) { assert.ok(activa && !pend, f.id + ' aprobada debe estar activa'); if (f.propuesta) assert.strictEqual(activa.r, f.propuesta.r || f.r, f.id); }
      else { assert.ok(pend, f.id + ' sin aprobar debe quedar pendiente'); if (f.estado === 'pendiente') assert.ok(!activa, f.id); }
    });
    assert.strictEqual(K.faqPendientes.length, 0, 'Leo aprobó las 13 (27 nov 2026)');
    // Por defecto (sin fichasPendientes) responden porque están aprobadas.
    for (const [q, id] of [['¿Qué diferencia hay entre «make» y «do»?', 'make-do'], ['¿Cuándo uso «the»?', 'the'], ['¿Qué es un phrasal verb?', 'phrasal-verbs'], ['¿Cómo se pronuncia el sonido «th»?', 'sonido-th']]) {
      const r = await H.capa(q); assert.strictEqual(r.id, id, q + ' → ' + r.id);
    }
    assert.ok(/Would you help me\?/.test(K.faq.find(f => f.id === 'will-would').r), 'se mantiene «Would you help me?»');
  });
  // ---- correcciones de la auditoría educativa de las 9 fichas ----
  test('auditoría · correcciones de contenido de las fichas', () => {
    const P = id => (K.faqPendientes.find(f => f.id === id) || K.faq.find(f => f.id === id)).r;
    assert.ok(/turn it off, no turn off it/.test(P('phrasal-verbs')));
    assert.ok(/make the bed/.test(P('make-do')) && !/do exercise/.test(P('make-do')));
    assert.ok(/Did you use to/.test(P('be-used-to')) && /o que era así/.test(P('be-used-to')));
    assert.ok(/acciones repetidas del pasado/.test(P('will-would')));
    assert.ok(/también se puede usar going to/.test(P('presente-continuo-futuro')));
    assert.ok(/d suave/.test(P('sonido-th')) && /justo detrás/.test(P('sonido-th')));
    assert.ok(/persons/.test(P('people')) && /superlativos/.test(P('the')));
    K.faq.filter(f => ['make-do','say-tell','be-used-to','presente-continuo-futuro','will-would','people','the','phrasal-verbs','sonido-th'].includes(f.id)).forEach(f => { assert.ok(!/—/.test(f.r), f.id); assert.ok(!/\b(siempre|nunca)\b/i.test(f.r.replace(/«[^»]*»/g, '')), 'absoluto en ' + f.id); assert.ok(f.ej.length === 2, f.id); });
  });
};
