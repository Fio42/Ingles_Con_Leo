/* ============================================================
   LEOBOT — asistente flotante 100% precodeado.
   - Sin IA externa, sin backend, sin tokens, sin costo.
   - El usuario NUNCA escribe texto libre: todo es selección
     múltiple (botones). Esto hace que sea 100% predecible.
   - El "cerebro" es un árbol de nodos (NODES). Cada nodo tiene
     un texto y una lista de opciones. Cada opción o bien lleva
     a OTRO nodo (to) o navega a una página real del sitio (href).
   - Para agregar contenido nuevo en el futuro: agrega un nodo
     nuevo a NODES y enlázalo desde alguna opción existente.
     No hace falta tocar el motor de render.
   ============================================================ */
(function(){
  'use strict';

  var HIDDEN_KEY = 'leobot_hidden_v1';
  var AUTO_OPEN_KEY = 'leobot_auto_opened_v1';

  function currentPage(){
    var path = location.pathname.split('/').pop();
    return path || 'index.html';
  }

  function isMember(){
    try{
      return typeof window.isMemberUnlocked === 'function' && window.isMemberUnlocked();
    }catch(e){ return false; }
  }

  function membersCta(){
    return isMember()
      ? { label:'Ir a mi panel →', href:'miembros.html' }
      : { label:'Ir a miembros →', href:'miembros.html' };
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
      { label:'¿Cómo funciona mi progreso?', to:'progress' }
    ],
    'miembros.html': [
      { label:'¿Cómo continúo mi sesión?', to:'continueSession' }
    ],
    'articulos.html': [
      { label:'Quiero ver videos', to:'videos' },
      { label:'Redes sociales', to:'social' }
    ],
    'practica.html': [
      { label:'¿Qué nivel elijo?', to:'level' }
    ]
  };

  function rootOptions(){
    var extra = PAGE_EXTRA_ROOT[currentPage()] || [];
    var combined = extra.concat(BASE_ROOT_OPTIONS);
    var seen = {};
    var out = [];
    for(var i=0;i<combined.length;i++){
      var o = combined[i];
      if(seen[o.label]) continue;
      seen[o.label] = true;
      out.push(o);
      if(out.length >= 6) break;
    }
    return out;
  }

  var NODES = {
    root: {
      text:'¡Hola! 👋 ¿Tienes alguna duda?<br>Puedo ayudarte con Inglés con Leo.',
      options: rootOptions
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
      text:'Depende de tu experiencia actual:<br><br>🟢 <strong>Fácil (A1–A2)</strong> — para quien está empezando o todavía usa frases sencillas.<br>🟠 <strong>Medio (B1–B2)</strong> — para quien ya entiende bastante y quiere expresarse mejor.<br>🔴 <strong>Avanzado (C1+)</strong> — para trabajar matices, precisión y estructuras más complejas.<br><br>Puedes cambiar de nivel cuando quieras.',
      options:[
        { label:'Ver práctica →', href:'practica.html' }
      ]
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
      text:'Tu progreso se guarda automáticamente en este navegador (no necesitas cuenta ni contraseña). Ahí ves cuánto has cubierto de cada habilidad, tu precisión reciente y tus últimas sesiones.',
      options:[
        { label:'Ver mi progreso →', href:'progreso.html' }
      ]
    },

    members: {
      text: function(){
        return isMember()
          ? 'Ya entraste al área de miembros en este navegador. Ahí tienes las 5 habilidades completas y tu progreso guardado.'
          : 'El área de miembros tiene ejercicios completos de Gramática, Vocabulario, Listening, Writing y Speaking, además de tu progreso guardado. Necesitas el código de acceso para entrar.';
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

    if(localStorage.getItem(HIDDEN_KEY) === '1'){
      renderReopenPill();
      return;
    }

    var root = document.createElement('div');
    root.id = 'leobotRoot';

    root.innerHTML =
      '<button type="button" class="leobot-fab" id="leobotFab" aria-label="Abrir asistente LeoBot" aria-haspopup="dialog" aria-expanded="false">' +
        '<div class="leobot-avatar" id="leobotFabAvatar"></div>' +
      '</button>' +
      '<div class="leobot-panel" id="leobotPanel" role="dialog" aria-modal="false" aria-label="Asistente LeoBot">' +
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
    var panel = document.getElementById('leobotPanel');
    var body = document.getElementById('leobotBody');
    var optionsEl = document.getElementById('leobotOptions');
    var closeBtn = document.getElementById('leobotCloseBtn');
    var restartBtn = document.getElementById('leobotRestartBtn');
    var hideBtn = document.getElementById('leobotHideBtn');
    var fabAvatar = document.getElementById('leobotFabAvatar');
    var headerAvatar = document.getElementById('leobotHeaderAvatar');

    var isOpen = false;
    var hasOpenedOnce = false;
    var history = []; // pila de nodos visitados en esta sesión de chat (para "Volver")

    function open(isAutomatic){
      isOpen = true;
      panel.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
      if(!hasOpenedOnce){
        hasOpenedOnce = true;
        setAvatarState(fabAvatar, 'wink', 900);
        setAvatarState(headerAvatar, 'wink', 900);
        goTo('root', false);
      }
      window.setTimeout(function(){
        if(isAutomatic) return;
        var firstBtn = optionsEl.querySelector('.leobot-opt-btn');
        if(firstBtn) firstBtn.focus();
      }, 220);
    }

    function close(){
      isOpen = false;
      panel.classList.remove('open');
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
        menuBtn.textContent = '🏠 Menú principal';
        menuBtn.addEventListener('click', function(){ goTo('root', true); });
        optionsEl.appendChild(menuBtn);
      }
    }

    function goTo(nodeId, showTyping){
      var node = NODES[nodeId];
      if(!node) return;
      history.push(nodeId);

      function render(){
        var text = typeof node.text === 'function' ? node.text() : node.text;
        addBotBubble(text);
        setAvatarState(headerAvatar, 'happy', 700);
        renderOptions(nodeId, resolveOptions(node));
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
          window.location.href = opt.href;
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

    hideBtn.addEventListener('click', function(){
      localStorage.setItem(HIDDEN_KEY, '1');
      root.remove();
      renderReopenPill();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && isOpen) close();
    });

    /* Una sola bienvenida por navegador: no reaparece al navegar entre páginas. */
    if(localStorage.getItem(AUTO_OPEN_KEY) !== '1'){
      window.setTimeout(function(){
        if(localStorage.getItem(HIDDEN_KEY) === '1' || isOpen) return;
        localStorage.setItem(AUTO_OPEN_KEY, '1');
        open(true);
      }, 900);
    }
  }

  function renderReopenPill(){
    if(document.getElementById('leobotReopen')) return;
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.id = 'leobotReopen';
    pill.className = 'leobot-reopen';
    pill.textContent = '🤖 Asistente';
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
