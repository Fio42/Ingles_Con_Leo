/* ============================================================
   LEOBOT — asistente contextual del sitio.
   - Sin IA externa: todo sigue siendo selección múltiple (botones)
     más 2 formularios simples (reportar problema / contactar). El
     usuario nunca tiene un campo de "chat libre".
   - El "cerebro" sigue siendo un árbol de nodos (NODES), igual que
     antes. Lo nuevo:
       1. "Explícame esta página" (PAGE_CONTEXT): explicación corta y
          fija por página, más el contexto REAL de práctica si existe
          (leído del propio DOM que ya se muestra en pantalla, nunca
          inventado — ver readPracticeContext()).
       2. El menú de siempre ("¿Por dónde empiezo?", "¿Qué nivel
          elijo?", etc.) ahora vive bajo "Tengo una duda", mostrando
          como mucho 4 opciones + "Más opciones" en vez de una lista
          larga de una vez.
       3. "Reportar un problema" y "Contactar / Otra duda" ahora son
          formularios reales (un solo campo de texto) que guardan en
          Supabase (tabla leobot_reports) y le avisan a Leo por
          correo (Edge Function leobot-notify), en vez de solo abrir
          WhatsApp.
   - Para agregar contenido nuevo en el futuro: agrega un nodo nuevo a
     NODES y enlázalo desde alguna opción existente, o agrega una
     entrada a PAGE_CONTEXT para una página nueva. No hace falta tocar
     el motor de render.
   ============================================================ */
(function(){
  'use strict';

  var HIDDEN_KEY = 'leobot_hidden_v1';
  /* Usa sessionStorage: se resetea cada vez que se abre una pestaña/sesión
     nueva, así el saludo aparece "cuando alguien entra a la página" en cada
     visita, sin repetirse varias veces dentro de la misma sesión. */
  var GREET_SESSION_KEY = 'leobot_greeted_session_v1';

  function currentPage(){
    var path = location.pathname.split('/').pop();
    return path || 'index.html';
  }

  function escapeHtmlLite(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* El estado real de membresía vive en Supabase (LeoBackend), y consultarlo
     es async. Lo cacheamos en esta variable apenas carga el bot para que
     isMember() se pueda usar de forma síncrona en el resto del árbol de
     nodos; refreshMemberStatus() la actualiza en segundo plano. En páginas
     públicas (sin backend.js cargado, como index.html) simplemente no hay
     nada que consultar y se asume que no es miembro. */
  var memberStatusCache = false;
  function isMember(){
    return memberStatusCache;
  }
  function refreshMemberStatus(){
    try{
      if(typeof LeoBackend === 'undefined' || !LeoBackend.isConfigured()) return;
      LeoBackend.getMemberProfile().then(function(profile){
        memberStatusCache = !!(profile && profile.is_member);
      }).catch(function(){});
    }catch(e){}
  }

  function membersCta(){
    return isMember()
      ? { label:'Ir a mi panel →', href:'miembros.html' }
      : { label:'Ir a miembros →', href:'miembros.html' };
  }

  /* Nombre local del usuario (mismo perfil que usa el saludo del
     dashboard, ver app.js/getProfile). Personalización ligera nada
     más: si no hay nombre, texto neutral, sin exagerar. */
  function localName(){
    try{
      if(typeof getProfile !== 'function') return null;
      var p = getProfile();
      return (p && p.name) ? p.name : null;
    }catch(e){ return null; }
  }

  /* ============================================================
     CONTEXTO DE PRÁCTICA — lee SOLO lo que ya está de verdad en el
     DOM (el mismo texto que la persona ya ve en pantalla mientras
     practica: sessionHeaderHtml() en app.js pinta exactamente
     ".practice-level-tag" con "Habilidad · Nivel" y ".session-count"
     con "Pregunta X de Y"). Nunca inventa nada: si esos elementos no
     existen en la página actual, devuelve null y LeoBot simplemente
     no menciona ningún contexto de práctica.
     ============================================================ */
  function readPracticeContext(){
    var tag = document.querySelector('.practice-level-tag');
    var count = document.querySelector('.session-count');
    var inSession = !!document.querySelector('.session-card');
    if(!tag && !inSession) return null;
    return {
      levelSkillText: tag ? tag.textContent.trim() : null,
      progressText: count ? count.textContent.trim() : null,
      inSession: inSession
    };
  }

  /* ============================================================
     CONTEXTO DE PÁGINA — explicación corta y fija por página para
     "Explícame esta página". No es IA: son textos precodeados, uno
     por página (o por grupo de páginas), igual de "de verdad
     predecibles" que el resto del árbol de nodos.
     ============================================================ */
  var PAGE_CONTEXT = {
    'index.html': { explain:'Esta es la página de inicio: desde aquí puedes empezar a practicar gratis, ver artículos para aprender inglés, o conocer la membresía.', cta:{ label:'Practicar gratis →', href:'practica.html' } },
    'articulos.html': { explain:'Aquí están todos los artículos y videos para aprender inglés, organizados por tema. Puedes filtrar por categoría o buscar uno en particular.', cta:null },
    'practica.html': { explain:'Esta es la práctica gratis: eliges una habilidad y tu nivel, y haces una sesión corta sin necesidad de cuenta. Tu progreso se guarda en este navegador.', cta:{ label:'¿Qué practicar?', to:'practice' } },
    'practica-miembros.html': { explain:'Desde aquí eliges qué habilidad practicar dentro de tu cuenta: Gramática, Vocabulario, Listening, Writing, Speaking, Lectura o Mixto.', cta:null },
    'miembros.html': { explain:'Aquí tienes tu panel: racha, nivel, meta semanal, tu plan de estudio recomendado, accesos rápidos a cada habilidad, tus errores frecuentes y el reto diario.', cta:null },
    'progreso.html': { explain:'Esta página resume tu actividad: ejercicios de la semana, tu precisión reciente, tu racha, y cuánto has cubierto de cada habilidad. Te sirve para ver dónde tienes más margen y volver directo a practicar eso.', cta:{ label:'Ver mi progreso →', href:'progreso.html' } },
    'plan-estudio.html': { explain:'Tu plan de estudio arma automáticamente una práctica corta combinando tu nivel, tu progreso y tus errores recientes, para que no tengas que decidir qué hacer cada día.', cta:null },
    'gramatica.html': { explain:'Estás en Gramática: eliges o completas la respuesta correcta y siempre te explico por qué, con ejemplos reales.', cta:null },
    'vocabulario.html': { explain:'Estás en Vocabulario: cada palabra viene con su traducción y ejemplos reales de uso, no solo la definición.', cta:null },
    'listening.html': { explain:'Estás en Listening: escuchas un audio corto y respondes sobre lo que entendiste. Después puedes comparar con la transcripción.', cta:null },
    'writing.html': { explain:'Estás en Writing: escribes una frase y la revisas tú mismo con la guía que te doy, sin corrección automática de IA.', cta:null },
    'speaking.html': { explain:'Estás en Speaking: escuchas la pronunciación correcta, te grabas diciendo lo mismo, y comparas ambos audios tú mismo.', cta:null },
    'lectura.html': { explain:'Estás en Lectura: lees un texto corto y respondes preguntas sobre lo que entendiste.', cta:null },
    'mixto.html': { explain:'Mixto combina varias habilidades en una sola sesión, para practicar de forma más parecida a usar inglés de verdad.', cta:null },
    'errores.html': { explain:'Aquí están los ejercicios que más se te han dificultado. Repasarlos de vez en cuando ayuda más que solo avanzar con contenido nuevo.', cta:null },
    'juego.html': { explain:'English Rush es un juego rápido para practicar inglés jugando, sin necesidad de cuenta.', cta:null },
    'clases.html': { explain:'Las clases interactivas son lecciones guiadas paso a paso sobre situaciones reales (entrevistas, viajes, trabajo, etc.), no solo ejercicios sueltos.', cta:null },
    'test-de-nivel-de-ingles.html': { explain:'Este test corto te ayuda a saber en qué nivel estás (de A1 a C1) para que practiques con el nivel correcto.', cta:null },
    'toefl.html': { explain:'Aquí practicas específicamente para el examen TOEFL: Listening, Reading, Speaking con cronómetro y Writing.', cta:null },
    'ielts.html': { explain:'Aquí practicas específicamente para el examen IELTS.', cta:null },
    'toeic.html': { explain:'Aquí practicas específicamente para el examen TOEIC, el que más piden las empresas.', cta:null },
    'cambridge.html': { explain:'Aquí practicas para los exámenes de Cambridge (B1 Preliminary, B2 First y C1 Advanced).', cta:null },
    'sobre-leo.html': { explain:'Esta página cuenta quién es Leo y por qué existe Inglés con Leo.', cta:null },
    'privacidad.html': { explain:'Aquí está la política de privacidad del sitio: qué datos se guardan y cómo se usan.', cta:null },
    'baja.html': { explain:'Aquí puedes administrar qué correos automáticos de Inglés con Leo quieres seguir recibiendo.', cta:null },
    'encuesta.html': { explain:'Es una encuesta corta para contarnos tu experiencia con Inglés con Leo.', cta:null }
  };

  function articleExplain(){
    var h1 = document.querySelector('h1');
    var topic = h1 ? h1.textContent.trim() : document.title;
    return 'Este artículo trata sobre "' + escapeHtmlLite(topic) + '". Puedes leerlo completo, y si quieres practicar lo que aprendiste, busca el enlace de práctica relacionado que aparece en la página.';
  }

  function pageContextFor(page){
    if(PAGE_CONTEXT[page]) return PAGE_CONTEXT[page];
    if(/^articulo-/.test(page)) return { explain: articleExplain(), cta:null };
    return null;
  }

  function buildExplainText(){
    var ctx = pageContextFor(currentPage());
    var text = ctx ? ctx.explain : 'Puedo ayudarte a orientarte en esta página. Si tienes una duda específica, usa "Tengo una duda" abajo.';
    var practice = readPracticeContext();
    if(practice && practice.levelSkillText){
      text += '<br><br>Ahora mismo estás en: <strong>' + escapeHtmlLite(practice.levelSkillText) + '</strong>' + (practice.progressText ? ' (' + escapeHtmlLite(practice.progressText) + ')' : '') + '.';
    }
    return text;
  }

  /* ============================================================
     REPORTES (bug / soporte) — guarda en Supabase (tabla
     leobot_reports, ver supabase_schema.sql) y avisa a Leo por
     correo (Edge Function leobot-notify). Recoge automáticamente
     contexto técnico NO sensible: URL, nombre de página, nivel,
     si es miembro, qué se estaba practicando (si algo), navegador,
     dispositivo y tamaño de pantalla. Nunca contraseñas, tokens ni
     datos de pago. Si esta página no tiene LeoBackend configurado
     (no debería pasar: se agregó a todas), el envío simplemente
     falla de forma controlada y se avisa al usuario. */
  function detectDevice(){
    var ua = navigator.userAgent || '';
    return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'Móvil' : 'Escritorio';
  }
  function detectBrowser(){
    var ua = navigator.userAgent || '';
    if(/Edg\//.test(ua)) return 'Edge';
    if(/OPR\//.test(ua)) return 'Opera';
    if(/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
    if(/Firefox\//.test(ua)) return 'Firefox';
    if(/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    return ua.slice(0, 120);
  }

  function sendLeobotReport(type, message){
    return new Promise(function(resolve){
      (async function(){
        try{
          if(typeof LeoBackend === 'undefined' || !LeoBackend.isConfigured()){
            resolve(false);
            return;
          }
          var practice = readPracticeContext();
          var level = null;
          try{ level = (typeof getUserLevel === 'function') ? getUserLevel() : null; }catch(e){}
          var session = null, memberProfile = null;
          try{ session = await LeoBackend.getSession(); }catch(e){}
          if(session){
            try{ memberProfile = await LeoBackend.getMemberProfile(); }catch(e){}
          }
          var context = {
            page: currentPage(),
            level: level,
            is_member: !!(memberProfile && memberProfile.is_member),
            in_session: !!(practice && practice.inSession),
            practice_tag: practice ? practice.levelSkillText : null,
            practice_progress: practice ? practice.progressText : null,
            viewport: window.innerWidth + 'x' + window.innerHeight
          };
          var res = await LeoBackend.submitLeobotReport({
            type: type,
            message: message,
            pageUrl: window.location.href,
            pageName: document.title,
            userId: (session && session.user) ? session.user.id : null,
            email: (session && session.user) ? session.user.email : null,
            browser: detectBrowser(),
            device: detectDevice(),
            context: context
          });
          resolve(!!(res && res.ok));
        }catch(e){
          resolve(false);
        }
      })();
    });
  }

  /* ============================================================
     CONTENIDO — árbol de nodos
     ============================================================ */
  var BASE_ROOT_OPTIONS = [
    { label:'¿Por dónde empiezo?', to:'start' },
    { label:'¿Qué nivel elijo?', to:'level' },
    { label:'¿Qué puedo practicar?', to:'practice' },
    { label:'¿Qué incluye Miembros?', to:'members' },
    { label:'¿Cómo funciona mi progreso?', to:'progress' },
    { label:'Ver artículos y videos', to:'articles' }
  ];

  var PAGE_EXTRA_ROOT = {
    'speaking.html': [
      { label:'¿Cómo funciona Speaking?', to:'practice_speaking' },
      { label:'No escucho el audio', to:'audioIssue' }
    ],
    'listening.html': [
      { label:'¿Cómo funciona Listening?', to:'practice_listening' },
      { label:'No escucho el audio', to:'audioIssue' }
    ],
    'writing.html': [
      { label:'¿Cómo funciona Writing?', to:'practice_writing' }
    ],
    'gramatica.html': [
      { label:'¿Cómo funciona Gramática?', to:'practice_grammar' }
    ],
    'vocabulario.html': [
      { label:'¿Cómo funciona Vocabulario?', to:'practice_vocab' }
    ],
    'progreso.html': [
      { label:'¿Cómo funciona mi progreso?', to:'progress' },
      { label:'¿Cómo funciona la racha?', to:'streakInfo' }
    ],
    'miembros.html': [
      { label:'¿Cómo continúo mi sesión?', to:'continueSession' },
      { label:'¿Cómo cambio de nivel?', to:'changeLevel' }
    ],
    'plan-estudio.html': [
      { label:'¿Cómo funciona mi plan?', to:'planInfo' }
    ],
    'articulos.html': [
      { label:'Quiero ver videos', to:'videos' },
      { label:'Redes sociales', to:'social' }
    ],
    'practica.html': [
      { label:'¿Qué nivel elijo?', to:'level' }
    ]
  };

  /* Todas las opciones de FAQ posibles para esta página (sin límite),
     ya combinadas con las genéricas y sin duplicados. faq/faqMore de
     abajo son quienes deciden cuántas mostrar de una vez. */
  function faqOptionsAll(){
    var extra = PAGE_EXTRA_ROOT[currentPage()] || [];
    var combined = extra.concat(BASE_ROOT_OPTIONS);
    var seen = {};
    var out = [];
    for(var i=0;i<combined.length;i++){
      var o = combined[i];
      if(seen[o.label]) continue;
      seen[o.label] = true;
      out.push(o);
    }
    return out;
  }
  var FAQ_PRIMARY_COUNT = 4;

  var NODES = {
    root: {
      text: function(){
        var name = localName();
        return name
          ? ('¡Hola, ' + escapeHtmlLite(name) + '! 👋 ¿En qué te ayudo?')
          : '¡Hola! 👋 ¿En qué te ayudo?';
      },
      options: function(){
        var opts = [
          { label:'Explícame esta página', to:'explainPage' },
          { label:'Tengo una duda', to:'faq' },
          { label:'Reportar un problema', to:'reportBug' }
        ];
        opts.push({ label:'Contactar / Otra duda', to:'contact' });
        return opts;
      }
    },

    explainPage: {
      text: buildExplainText,
      options: function(){
        var ctx = pageContextFor(currentPage());
        var opts = [];
        if(ctx && ctx.cta) opts.push(ctx.cta);
        return opts;
      }
    },

    faq: {
      text:'¿Qué duda tienes?',
      options: function(){
        var all = faqOptionsAll();
        var primary = all.slice(0, FAQ_PRIMARY_COUNT);
        if(all.length > FAQ_PRIMARY_COUNT) primary.push({ label:'Más opciones', to:'faqMore' });
        return primary;
      }
    },
    faqMore: {
      text:'Más temas:',
      options: function(){ return faqOptionsAll().slice(FAQ_PRIMARY_COUNT); }
    },

    start: {
      text:'Te recomiendo dos pasos: primero elige tu nivel, y luego haz una sesión corta de Gramática o Vocabulario para agarrar el ritmo. No necesitas registrarte para probar.',
      options:[
        { label:'Practicar gratis →', href:'practica.html' },
        { label:'¿Qué nivel elijo?', to:'level' },
        { label:'¿Cómo estudio mejor?', to:'studyTips' }
      ]
    },

    level: {
      text:'Depende de tu experiencia actual:<br><br><strong style="color:var(--green)">Fácil (A1–A2)</strong> — para quien está empezando o todavía usa frases sencillas.<br><strong style="color:var(--amber)">Medio (B1–B2)</strong> — para quien ya entiende bastante y quiere expresarse mejor.<br><strong style="color:var(--coral)">Avanzado (C1+)</strong> — para trabajar matices, precisión y estructuras más complejas.<br><br>Puedes cambiar de nivel cuando quieras, tanto en práctica gratis como en tu cuenta de miembro.',
      options:[
        { label:'Ver práctica →', href:'practica.html' }
      ]
    },

    changeLevel: {
      text:'Dentro de tu panel de Miembros, en la tarjeta "Nivel actual" hay un botón "Ajustar nivel" que te deja cambiarlo cuando quieras.',
      options: function(){ return [membersCta()]; }
    },

    practice: {
      text:'¿Qué quieres practicar?',
      options:[
        { label:'Gramática', to:'practice_grammar' },
        { label:'Vocabulario', to:'practice_vocab' },
        { label:'Listening', to:'practice_listening' },
        { label:'Writing', to:'practice_writing' },
        { label:'Speaking', to:'practice_speaking' },
        { label:'Tu progreso', to:'progress' }
      ]
    },

    practice_grammar: {
      text:'Gramática son ejercicios cortos: eliges o completas una respuesta y te explico por qué es correcta, siempre con ejemplos reales — no es solo "bien" o "mal".',
      options:[
        { label:'Practicar Gramática →', href:'gramatica.html' }
      ]
    },

    practice_vocab: {
      text:'En Vocabulario ves cada palabra con su traducción y dos ejemplos de uso real, no solo "palabra = traducción". Así entiendes cómo se usa, no solo qué significa.',
      options:[
        { label:'Practicar Vocabulario →', href:'vocabulario.html' }
      ]
    },

    practice_listening: {
      text:'Escuchas un audio corto y respondes una pregunta sobre lo que entendiste. Después te muestro la transcripción y la traducción para que compares.',
      options:[
        { label:'Practicar Listening →', href:'listening.html' }
      ]
    },

    practice_writing: {
      text:'Escribes una frase en inglés y la revisas tú mismo con el botón "Revisar mi frase". Te digo si vas bien encaminado o qué ajustar, con un ejemplo — no es corrección automática de IA, es honesto sobre sus límites.',
      options:[
        { label:'Practicar Writing →', href:'writing.html' }
      ]
    },

    practice_speaking: {
      text:'Escuchas la pronunciación correcta, te grabas diciendo la misma frase y comparas ambos audios. No inventamos un puntaje de pronunciación — la idea es que te escuches y compares tú mismo.',
      options:[
        { label:'Practicar Speaking →', href:'speaking.html' }
      ]
    },

    progress: {
      text: function(){
        return isMember()
          ? 'Como ya iniciaste sesión, tu progreso se guarda en tu cuenta: cuánto has cubierto de cada habilidad, tu precisión reciente y tus últimas sesiones. Puedes verlo desde cualquier dispositivo en el que inicies sesión.'
          : 'Mientras practicas gratis, tu progreso se guarda en este navegador. Si creas una cuenta de miembro, pasa a guardarse en la nube y lo puedes ver desde cualquier dispositivo.';
      },
      options: function(){
        var opts = [{ label:'Ver mi progreso →', href:'progreso.html' }];
        if(!isMember()) opts.push(membersCta());
        return opts;
      }
    },

    streakInfo: {
      text:'Tu racha cuenta días seguidos practicando. Si un día se te pasa, tienes un "freeze" automático que perdona UN día sin cortar la racha (se marca con ❄️); si se te pasa un segundo día seguido, ahí sí se corta.',
      options: function(){ return [{ label:'Ver mi progreso →', href:'progreso.html' }]; }
    },

    planInfo: {
      text:'El Plan de estudio elige por ti una práctica corta cada día, combinando tu nivel, tu progreso y tus errores recientes. Tú solo eliges cuánto tiempo tienes (5 a 25 min).',
      options:[
        { label:'Ir a mi plan →', href:'plan-estudio.html' }
      ]
    },

    members: {
      text: function(){
        return isMember()
          ? 'Ya iniciaste sesión como miembro. Tienes práctica ilimitada de las 5 habilidades (Gramática, Vocabulario, Listening, Writing y Speaking), además de Lectura, Mixto, clases interactivas, preparación para TOEFL/IELTS/Cambridge, el juego English Rush, un reto diario, repaso automático de tus errores y tu progreso guardado en la nube.'
          : 'El área de miembros tiene práctica ilimitada de las 5 habilidades (Gramática, Vocabulario, Listening, Writing y Speaking), además de Lectura, Mixto, clases interactivas paso a paso, preparación para TOEFL, IELTS y Cambridge (B1 Preliminary, B2 First y C1 Advanced), el juego English Rush, un reto diario, repaso automático de tus errores y tu progreso guardado en la nube. Para entrar, creas una cuenta con tu correo y activas la membresía ($2 USD/mes, vía Stripe, PayPal o Mercado Pago).';
      },
      options: function(){
        var opts = [membersCta()];
        if(!isMember()) opts.push({ label:'Practicar gratis primero', href:'practica.html' });
        return opts;
      }
    },

    articles: {
      text:'Tenemos artículos cortos y prácticos sobre inglés real, con ejemplos, y videos con explicaciones rápidas.',
      options:[
        { label:'Ver artículos →', href:'articulos.html' },
        { label:'Ver videos →', href:'articulos.html#videos' }
      ]
    },

    videos: {
      text:'Los videos cortos de Inglés con Leo están en la sección de Artículos.',
      options:[
        { label:'Ver videos →', href:'articulos.html#videos' }
      ]
    },

    social: {
      text:'Puedes encontrar los enlaces a redes sociales de Inglés con Leo al final de la sección de Artículos.',
      options:[
        { label:'Ver enlaces →', href:'articulos.html#videos' }
      ]
    },

    audioIssue: {
      text:'Si un audio dice "Audio próximamente.", es porque ese archivo todavía no está disponible — lo estamos agregando de a poco. No es un error tuyo ni de tu navegador.',
      options:[
        { label:'Practicar Listening →', href:'listening.html' },
        { label:'Practicar Speaking →', href:'speaking.html' }
      ]
    },

    studyTips: {
      text:'Algunos tips que funcionan bien: practica poco pero seguido (5–10 min al día), repite en voz alta lo que leas, y no te saltes los ejemplos — ahí está la explicación real de por qué algo es correcto.',
      options:[
        { label:'Practicar ahora →', href:'practica.html' }
      ]
    },

    continueSession: {
      text:'Cuando entras a Miembros, la tarjeta de arriba de todo te muestra exactamente dónde quedaste y te lleva ahí con un clic.',
      options: function(){ return [membersCta()]; }
    },

    reportBug: {
      text:'¿Algo no funcionó como esperabas? Cuéntame qué pasó y lo reviso. Se manda junto con información técnica de esta página (URL, navegador, qué estabas practicando si aplica) para poder ayudarte más rápido — nunca datos sensibles.',
      form: {
        placeholder:'¿Qué pasó? (ej: "el audio no se reproduce", "no puedo completar el ejercicio")',
        submitLabel:'Enviar reporte',
        successText:'Gracias. Ya recibí tu reporte y lo voy a revisar. 🙏',
        errorText:'No se pudo enviar el reporte. Intenta de nuevo en un momento, o escríbenos por WhatsApp.',
        errorExtra:[{ label:'Escribir por WhatsApp →', href:'https://wa.me/529994996520?text=' + encodeURIComponent('Hola, encontré un problema en Inglés con Leo: '), external:true }],
        onSubmit: function(message){ return sendLeobotReport('bug', message); }
      }
    },

    contact: {
      text:'¿Tienes una duda que no alcancé a resolver arriba, o algo que no es exactamente un problema técnico? Cuéntamelo y te respondemos.',
      form: {
        placeholder:'Escribe tu mensaje...',
        submitLabel:'Enviar mensaje',
        successText:'Mensaje enviado. Te responderé en cuanto pueda. 😊',
        errorText:'No se pudo enviar tu mensaje. Intenta de nuevo en un momento, o escríbenos por WhatsApp.',
        errorExtra:[{ label:'Escribir por WhatsApp →', href:'https://wa.me/529994996520?text=' + encodeURIComponent('Hola, tengo una duda sobre Inglés con Leo: '), external:true }],
        onSubmit: function(message){ return sendLeobotReport('support', message); }
      }
    }
  };

  function buildAvatarHtml(){
    return '<img src="leobot.png" alt="LeoBot" draggable="false">';
  }

  function setAvatarState(avatarEl, state, duration){
    if(!avatarEl) return;
    avatarEl.setAttribute('data-state', state);
    if(duration){
      window.setTimeout(function(){
        avatarEl.setAttribute('data-state', 'normal');
      }, duration);
    }
  }

  /* ============================================================
     Motor del widget
     ============================================================ */
  function initLeoBot(){
    if(document.getElementById('leobotFab')) return; // ya inicializado

    refreshMemberStatus();

    if(localStorage.getItem(HIDDEN_KEY) === '1'){
      renderReopenPill();
      return;
    }

    var root = document.createElement('div');
    root.id = 'leobotRoot';

    root.innerHTML =
      '<div class="leobot-backdrop" id="leobotBackdrop"></div>' +
      '<div class="leobot-greet" id="leobotGreet" role="status">' +
        '<button type="button" class="leobot-greet-close" id="leobotGreetClose" aria-label="Cerrar aviso">' +
          '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<span id="leobotGreetText">¿Necesitas ayuda? 👋</span>' +
      '</div>' +
      '<button type="button" class="leobot-fab" id="leobotFab" aria-label="Abrir asistente LeoBot" aria-haspopup="dialog" aria-expanded="false">' +
        '<div class="leobot-avatar" id="leobotFabAvatar"></div>' +
        '<span class="leobot-fab-dot" id="leobotFabDot" hidden></span>' +
      '</button>' +
      '<div class="leobot-panel" id="leobotPanel" role="dialog" aria-modal="false" aria-label="Asistente LeoBot">' +
        '<div class="leobot-sheet-handle" aria-hidden="true"></div>' +
        '<div class="leobot-header">' +
          '<div class="leobot-avatar" id="leobotHeaderAvatar"></div>' +
          '<div class="leobot-header-text">' +
            '<div class="leobot-header-name">LeoBot</div>' +
            '<div class="leobot-header-sub">Ayuda de Inglés con Leo</div>' +
          '</div>' +
          '<div class="leobot-header-actions">' +
            '<button type="button" class="leobot-icon-btn" id="leobotRestartBtn" aria-label="Reiniciar conversación" title="Reiniciar conversación">' +
              '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 3 6.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 17v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            '<button type="button" class="leobot-icon-btn" id="leobotCloseBtn" aria-label="Cerrar asistente" title="Cerrar">' +
              '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="leobot-body" id="leobotBody"></div>' +
        '<div class="leobot-options" id="leobotOptions"></div>' +
        '<div class="leobot-footer">' +
          '<button type="button" class="leobot-hide-link" id="leobotHideBtn">Ocultar este asistente</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);

    document.getElementById('leobotFabAvatar').innerHTML = buildAvatarHtml();
    document.getElementById('leobotHeaderAvatar').innerHTML = buildAvatarHtml();

    var fab = document.getElementById('leobotFab');
    var greet = document.getElementById('leobotGreet');
    var greetClose = document.getElementById('leobotGreetClose');
    var panel = document.getElementById('leobotPanel');
    var backdrop = document.getElementById('leobotBackdrop');
    var body = document.getElementById('leobotBody');
    var optionsEl = document.getElementById('leobotOptions');
    var closeBtn = document.getElementById('leobotCloseBtn');
    var restartBtn = document.getElementById('leobotRestartBtn');
    var hideBtn = document.getElementById('leobotHideBtn');
    var fabAvatar = document.getElementById('leobotFabAvatar');
    var headerAvatar = document.getElementById('leobotHeaderAvatar');
    var fabDot = document.getElementById('leobotFabDot');
    var greetTextEl = document.getElementById('leobotGreetText');
    var greetPendingNode = null;

    var isOpen = false;
    var hasOpenedOnce = false;
    var history = []; // pila de nodos visitados en esta sesión de chat (para "Volver")
    var sessionGreeted = false;
    try{ sessionGreeted = sessionStorage.getItem(GREET_SESSION_KEY) === '1'; }catch(e){}

    function hideGreet(){
      if(greet) greet.classList.remove('show');
      if(fabDot) fabDot.hidden = true;
    }

    function open(isAutomatic, startNode){
      isOpen = true;
      hideGreet();
      panel.classList.add('open');
      if(backdrop) backdrop.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
      if(!hasOpenedOnce){
        hasOpenedOnce = true;
        setAvatarState(fabAvatar, 'wink', 900);
        setAvatarState(headerAvatar, 'wink', 900);
        goTo(startNode || 'root', false);
      } else if(startNode){
        goTo(startNode, true);
      }
      window.setTimeout(function(){
        if(isAutomatic) return;
        var firstBtn = optionsEl.querySelector('.leobot-opt-btn, .leobot-textarea');
        if(firstBtn) firstBtn.focus();
      }, 220);
    }

    function close(){
      isOpen = false;
      panel.classList.remove('open');
      if(backdrop) backdrop.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
      fab.focus();
    }

    function toggle(){
      if(isOpen) close(); else open();
    }

    function scrollToBottom(){
      body.scrollTop = body.scrollHeight;
    }

    function addBotBubble(html){
      var row = document.createElement('div');
      row.className = 'leobot-msg bot';
      row.innerHTML = '<div class="leobot-avatar"></div><div class="leobot-bubble">' + html + '</div>';
      body.appendChild(row);
      row.querySelector('.leobot-avatar').innerHTML = buildAvatarHtml();
      scrollToBottom();
    }

    function addUserBubble(label){
      var row = document.createElement('div');
      row.className = 'leobot-msg user';
      row.innerHTML = '<div class="leobot-bubble"></div>';
      row.querySelector('.leobot-bubble').textContent = label;
      body.appendChild(row);
      scrollToBottom();
    }

    function addTypingIndicator(){
      var row = document.createElement('div');
      row.className = 'leobot-typing';
      row.id = 'leobotTyping';
      row.innerHTML = '<div class="leobot-avatar"></div><div class="leobot-typing-dots"><span></span><span></span><span></span></div>';
      body.appendChild(row);
      row.querySelector('.leobot-avatar').innerHTML = buildAvatarHtml();
      setAvatarState(row.querySelector('.leobot-avatar'), 'thinking');
      scrollToBottom();
      return row;
    }

    function resolveOptions(node){
      var opts = typeof node.options === 'function' ? node.options() : (node.options || []);
      return opts.slice();
    }

    function renderOptions(nodeId, opts){
      optionsEl.innerHTML = '';
      opts.forEach(function(opt){
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'leobot-opt-btn' + (opt.href ? ' link' : '');
        btn.innerHTML = '<span>' + opt.label + '</span>' + (opt.href ? '<span class="arrow">→</span>' : '');
        btn.addEventListener('click', function(){ handleChoice(opt); });
        optionsEl.appendChild(btn);
      });
      if(nodeId !== 'root'){
        var menuBtn = document.createElement('button');
        menuBtn.type = 'button';
        menuBtn.className = 'leobot-opt-btn ghost';
        menuBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Menú principal</span>';
        menuBtn.addEventListener('click', function(){ goTo('root', true); });
        optionsEl.appendChild(menuBtn);
      }
    }

    /* Formulario de un solo campo (reportar problema / contactar).
       Evita doble envío deshabilitando el botón mientras está en
       curso, y siempre termina mostrando una confirmación breve más
       el botón de volver al menú (nunca deja el chat "colgado"). */
    function renderForm(nodeId, formSpec){
      optionsEl.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'leobot-form';
      var textarea = document.createElement('textarea');
      textarea.className = 'leobot-textarea';
      textarea.maxLength = 2000;
      textarea.rows = 3;
      textarea.placeholder = formSpec.placeholder;
      textarea.setAttribute('aria-label', formSpec.placeholder);
      var actions = document.createElement('div');
      actions.className = 'leobot-form-actions';
      var sendBtn = document.createElement('button');
      sendBtn.type = 'button';
      sendBtn.className = 'btn btn-primary leobot-form-send';
      sendBtn.textContent = formSpec.submitLabel;
      actions.appendChild(sendBtn);
      wrap.appendChild(textarea);
      wrap.appendChild(actions);
      optionsEl.appendChild(wrap);

      var sending = false;
      function trySend(){
        if(sending) return;
        var msg = (textarea.value || '').trim();
        if(!msg){ textarea.focus(); return; }
        sending = true;
        sendBtn.disabled = true;
        var originalLabel = sendBtn.textContent;
        sendBtn.textContent = 'Enviando…';
        formSpec.onSubmit(msg).then(function(ok){
          sending = false;
          sendBtn.disabled = false;
          sendBtn.textContent = originalLabel;
          var shown = msg.length > 140 ? msg.slice(0, 140) + '…' : msg;
          addUserBubble(shown);
          addTypingIndicator();
          window.setTimeout(function(){
            var t = document.getElementById('leobotTyping');
            if(t) t.remove();
            addBotBubble(ok ? formSpec.successText : formSpec.errorText);
            renderOptions(nodeId, (!ok && formSpec.errorExtra) ? formSpec.errorExtra : []);
          }, 380);
        });
      }
      sendBtn.addEventListener('click', trySend);
      textarea.addEventListener('keydown', function(e){
        if(e.key === 'Enter' && (e.metaKey || e.ctrlKey)) trySend();
      });

      var menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'leobot-opt-btn ghost';
      menuBtn.style.marginTop = '8px';
      menuBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Menú principal</span>';
      menuBtn.addEventListener('click', function(){ goTo('root', true); });
      optionsEl.appendChild(menuBtn);
    }

    function goTo(nodeId, showTyping){
      var node = NODES[nodeId];
      if(!node) return;
      history.push(nodeId);

      function render(){
        var text = typeof node.text === 'function' ? node.text() : node.text;
        addBotBubble(text);
        setAvatarState(headerAvatar, 'happy', 700);
        if(node.form){
          renderForm(nodeId, node.form);
        } else {
          renderOptions(nodeId, resolveOptions(node));
        }
      }

      if(showTyping){
        addTypingIndicator();
        window.setTimeout(function(){
          var t = document.getElementById('leobotTyping');
          if(t) t.remove();
          render();
        }, 420);
      } else {
        render();
      }
    }

    function handleChoice(opt){
      addUserBubble(opt.label.replace(/→/g,'').trim());
      optionsEl.innerHTML = '';
      if(opt.href){
        addTypingIndicator();
        window.setTimeout(function(){
          if(opt.external){
            // No navega fuera del sitio (se abre en pestaña nueva), así
            // que hay que quitar el "escribiendo..." y dejar los mismos
            // botones disponibles otra vez, en vez de dejar el chat
            // colgado esperando una navegación que no va a pasar.
            window.open(opt.href, '_blank', 'noopener');
            var t = document.getElementById('leobotTyping');
            if(t) t.remove();
            var currentNodeId = history[history.length - 1];
            var currentNode = NODES[currentNodeId];
            if(currentNode) renderOptions(currentNodeId, resolveOptions(currentNode));
          } else {
            window.location.href = opt.href;
          }
        }, 280);
        return;
      }
      if(opt.to){
        goTo(opt.to, true);
      }
    }

    function restart(){
      body.innerHTML = '';
      history = [];
      goTo('root', true);
    }

    fab.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);
    restartBtn.addEventListener('click', restart);
    if(backdrop) backdrop.addEventListener('click', close);

    hideBtn.addEventListener('click', function(){
      localStorage.setItem(HIDDEN_KEY, '1');
      root.remove();
      renderReopenPill();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && isOpen) close();
    });

    /* Una sola bienvenida por navegador: no reaparece al navegar entre páginas.
       Si el modal de onboarding (.onb-overlay) está abierto, esperamos a que
       el usuario lo cierre (Empezar o Saltar) y damos ~2.5s de aire antes de
       abrir LeoBot, para que nunca compitan por la atención al mismo tiempo. */
    if(greetClose){
      greetClose.addEventListener('click', function(e){
        e.stopPropagation();
        hideGreet();
        try{ sessionStorage.setItem(GREET_SESSION_KEY, '1'); }catch(e){}
      });
    }
    if(greet){
      greet.addEventListener('click', function(){
        var target = greetPendingNode;
        greetPendingNode = null;
        if(!isOpen) open(false, target);
        else if(target) goTo(target, true);
      });
    }

    /* Muestra la burbuja del asistente con un texto y, opcionalmente, la
       lleva directo a un nodo concreto al hacer click (en vez del menú
       principal). La usan tanto el saludo normal como el aviso de error
       de más abajo, para no duplicar la lógica de mostrar/ocultar. */
    function promptGreet(text, nodeId, duration){
      if(isOpen) return;
      if(localStorage.getItem(HIDDEN_KEY) === '1') return;
      if(greetTextEl) greetTextEl.textContent = text;
      greetPendingNode = nodeId || null;
      if(greet){
        greet.classList.add('show');
        if(fabDot) fabDot.hidden = false;
        setAvatarState(fabAvatar, 'wink', 900);
        window.setTimeout(hideGreet, duration || 8000);
      }
    }

    function afterWelcomeGap(cb, gapIfOnboarding, gapDefault){
      var onbOverlay = document.querySelector('.onb-overlay');
      if(onbOverlay){
        var onbObserver = new MutationObserver(function(){
          if(!document.body.contains(onbOverlay)){
            onbObserver.disconnect();
            window.setTimeout(cb, gapIfOnboarding);
          }
        });
        onbObserver.observe(document.body, { childList:true });
      } else {
        window.setTimeout(cb, gapDefault);
      }
    }

    /* Texto de la mini-burbuja proactiva: varía un poco según la página,
       para que se sienta "acompañamiento contextual" y no un aviso
       genérico repetido en todo el sitio. Sigue siendo como mucho UNA
       sugerencia por sesión de navegador (ver sessionGreeted arriba). */
    var CONTEXTUAL_GREETS = {
      'progreso.html': '¿Quieres que te explique tu progreso? 👋',
      'practica.html': '¿Necesitas ayuda con esta práctica? 👋',
      'practica-miembros.html': '¿No sabes qué practicar hoy? 👋',
      'miembros.html': '¿Necesitas ayuda con tu panel? 👋',
      'plan-estudio.html': 'Puedo explicarte tu plan. 👋'
    };
    function defaultGreetText(){
      return CONTEXTUAL_GREETS[currentPage()] || '¿Necesitas ayuda? 👋';
    }

    /* Cada vez que alguien entra al sitio (una vez por sesión de navegador,
       no en cada página que visite dentro de esa sesión): una burbuja
       pequeña junto al ícono invita a pedir ayuda, sin abrir el panel
       completo — nunca competimos por la atención con el onboarding. */
    if(!sessionGreeted){
      afterWelcomeGap(function(){
        if(localStorage.getItem(HIDDEN_KEY) === '1' || isOpen) return;
        try{ sessionStorage.setItem(GREET_SESSION_KEY, '1'); }catch(e){}
        promptGreet(defaultGreetText(), null, 7000);
      }, 1600, 1300);
    }

    /* Si algo se rompe en la página (un error real de JavaScript, no un
       problema de conexión del usuario), avisamos con la misma burbuja
       pero apuntando directo a "Reportar un problema" en vez del menú
       principal — así el reporte llega en el momento en que el bug
       realmente pasó, no depende de que alguien encuentre el ícono solo.
       Como mucho una vez por sesión de pestaña, para no ser invasivos.
       Si justo en ese momento hay una pregunta de práctica activa en
       pantalla (body.leobot-away, ver initLeobotAutoHide en app.js), el
       flotante está escondido a propósito para no tapar los botones del
       ejercicio: esperamos calladitos a que esa sesión termine (o a que
       cierren el modal de bienvenida) para recién ahí mostrar el aviso,
       en vez de perderlo. Y por supuesto, si la persona ya ocultó el
       asistente del todo ("Ocultar este asistente"), esto tampoco
       aparece — promptGreet ya respeta HIDDEN_KEY. */
    var ERROR_PROMPT_KEY = 'leobot_error_prompt_session_v1';
    var errorPromptQueued = false;
    window.addEventListener('error', function(){
      try{
        if(sessionStorage.getItem(ERROR_PROMPT_KEY) === '1') return;
      }catch(e){}
      if(errorPromptQueued) return;
      errorPromptQueued = true;

      function showErrorPrompt(){
        try{ sessionStorage.setItem(ERROR_PROMPT_KEY, '1'); }catch(e){}
        promptGreet('¿Algo se vio raro? Cuéntanos 👀', 'reportBug', 9000);
      }

      if(document.body.classList.contains('leobot-away')){
        var awayObserver = new MutationObserver(function(){
          if(!document.body.classList.contains('leobot-away')){
            awayObserver.disconnect();
            showErrorPrompt();
          }
        });
        awayObserver.observe(document.body, { attributes:true, attributeFilter:['class'] });
      } else {
        showErrorPrompt();
      }
    });
  }

  function renderReopenPill(){
    if(document.getElementById('leobotReopen')) return;
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.id = 'leobotReopen';
    pill.className = 'leobot-reopen';
    pill.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M4 5h16v11H9l-4 4v-4H4V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Asistente</span>';
    pill.setAttribute('aria-label', 'Reactivar asistente LeoBot');
    pill.addEventListener('click', function(){
      localStorage.removeItem(HIDDEN_KEY);
      pill.remove();
      var existingRoot = document.getElementById('leobotRoot');
      if(existingRoot) existingRoot.remove();
      initLeoBot();
      var fab = document.getElementById('leobotFab');
      if(fab) fab.click();
    });
    document.body.appendChild(pill);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initLeoBot);
  } else {
    initLeoBot();
  }
})();
