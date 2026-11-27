/* =========================================================
   Inglés con Leo 2.0 · Shell de la app (bloque 2: estética v3)
   Barra superior y navegación del prototipo v3 sobre las páginas reales:
     - móvil: barra inferior; tablet: riel de iconos; escritorio: riel con texto
     - arriba: tu cuenta (el menú REAL del sitio, con suscripción y cerrar sesión),
       racha real, sonidos, tema y notificaciones (las reales)
     - hoja "Más": resto de secciones, tema, sonidos, meta diaria y versión clásica
   miembros.html (pública e indexada): solo se enciende cuando la página ya
   mostró el área de miembro. Visitantes, Google, login y pagos no cambian.
   Solo presentación: no llama a Supabase, no decide permisos.
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled || !window.K) return;
  var d = document, html = d.documentElement, K = window.K, A = K.ART, SND = K.SND;
  var I4 = A.I4 || {};   /* Bloque C: familia de iconos propia (v4-icons.js); si faltara, se usan los de antes */
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var APP = { 'miembros.html':'inicio', 'academia.html':'academia', 'practica-miembros.html':'practicar', 'plan-estudio.html':'practicar',
              'errores.html':'practicar', 'progreso.html':'progreso',
              'gramatica.html':'practicar', 'vocabulario.html':'practicar', 'listening.html':'practicar', 'speaking.html':'practicar', 'writing.html':'practicar',
              'mixto.html':'practicar', 'lectura.html':'practicar', 'clases.html':'practicar', 'examenes.html':'practicar', 'toefl.html':'practicar', 'ielts.html':'practicar',
              'toeic.html':'practicar', 'cambridge.html':'practicar', 'aprender.html':'practicar', 'juego.html':'practicar' };
  var current = APP[page];
  if(!current) return;

  var MAS = '<svg class="ico nav-ico" viewBox="0 0 32 32" aria-hidden="true"><g class="nav-ico__body" stroke-width="2.4" stroke-linejoin="round"><rect x="4.5" y="4.5" width="9.5" height="9.5" rx="3"/><rect x="18" y="4.5" width="9.5" height="9.5" rx="3"/><rect x="4.5" y="18" width="9.5" height="9.5" rx="3"/><rect x="18" y="18" width="9.5" height="9.5" rx="3"/></g><g class="nav-ico__detail"></g></svg>';
  /* C8: la barra se adapta a los accesos de la cuenta. Sin membresía activa (cuenta gratis o vencida) Practicar lleva
     a la práctica gratis y Progreso (exclusivo de miembros) no aparece. Solo cambia la navegación: los permisos los sigue
     decidiendo la página real (guardMember) y el servidor. La pista leo_member_hint la escribe backend.js al verificar. */
  var nonMember = (function(){ try{ return !localStorage.getItem('leo_member_hint'); }catch(e){ return false; } })();
  function items(){ return nonMember ? [
    { k:'inicio', t:'Inicio', h:'miembros.html' }, { k:'academia', t:'Academia', h:'academia.html' },
    { k:'practicar', t:'Practicar', h:'practica.html' }, { k:'perfil', t:'Perfil' }
  ] : [
    { k:'inicio', t:'Inicio', h:'miembros.html' }, { k:'academia', t:'Academia', h:'academia.html' },
    { k:'practicar', t:'Practicar', h:'practica-miembros.html' }, { k:'progreso', t:'Progreso', h:'progreso.html' }, { k:'perfil', t:'Perfil' }
  ]; }

  function navHTML(){
    return items().map(function(it){
          var ico = it.k === 'perfil' ? '<span class="v2-nav-av" aria-hidden="true">' + K.esc(acctInitial() || '·') + '</span>' : (A.NAV_ICO || {})[it.k] || '';
          var inner = '<span class="nav__ico">' + ico + '<span class="nav__badge" hidden></span></span><span class="nav__label">' + it.t + '</span>';
          return it.h ? '<a class="nav__item" data-nav="' + it.k + '" href="' + it.h + '"' + (it.k === current ? ' aria-current="page"' : '') + '>' + inner + '</a>'
                      : '<button type="button" class="nav__item" data-nav="' + it.k + '" aria-haspopup="dialog"' + (it.k === current ? ' aria-current="page"' : '') + '>' + inner + '</button>';
        }).join('');
  }
  function build(){
    if(d.querySelector('.v2-shell')) return;
    html.classList.add('v2-app');
    var shell = K.h('<div class="v2-shell">' +
      '<header class="topbar" id="v2Top"><span class="v2-slot" data-slot="cuenta"></span><span class="topbar__spacer"></span>' +
        '<a class="stat stat--streak is-off" id="v2Streak" href="progreso.html" aria-label="Racha"></a>' +
        '<button type="button" class="icon-btn" id="v2Help" aria-label="Ayuda: abrir LeoBot" title="Ayuda"></button>' +
        '<button type="button" class="icon-btn" id="v2Sound"></button>' +
        '<button type="button" class="icon-btn" id="v2Theme"></button>' +
        '<span class="v2-slot" data-slot="avisos"></span></header>' +
      '<nav class="nav" aria-label="Principal"><a class="nav__brand" href="index.html" aria-label="Inglés con Leo: página principal"><span class="avatar avatar--leo"><img src="logo.png" alt=""></span><span class="wordmark">Inglés con <b>Leo</b></span></a>' +
        navHTML() + '</nav></div>');
    shell.classList.add('k-scope');
    /* Progreso es exclusivo de miembros: sin membresía activa, la racha lleva a practicar (C8) */
    if(nonMember){ var stk = shell.querySelector('#v2Streak'); if(stk) stk.setAttribute('href', 'practica.html'); }
    d.body.insertBefore(shell, d.body.firstChild);

    /* Cuenta y avisos: se MUEVEN los controles reales (conservan sus funciones: nombre, suscripción, cerrar sesión) */
    var prof = d.querySelector('header .nav-profile-wrap'), bell = d.querySelector('header .nav-bell-wrap');
    if(prof) shell.querySelector('[data-slot="cuenta"]').appendChild(prof);
    if(bell) shell.querySelector('[data-slot="avisos"]').appendChild(bell);
    var block = d.getElementById('navUserBlock'); if(block && prof) block.setAttribute('data-v2-moved', '1');
    /* Avatar consistente en toda el área del alumno (C2): la inicial se pinta al instante con el nombre guardado
       y luego la confirma initMemberHeader (app.js). Páginas sin menú de cuenta propio (Academia) reciben uno
       que lleva al Inicio, donde está el menú completo (nombre, suscripción, cerrar sesión). */
    var ini = acctInitial();
    if(!prof){
      var acct = d.createElement('a'); acct.className = 'nav-profile-btn v2-acct'; acct.href = 'miembros.html'; acct.setAttribute('aria-label', 'Tu cuenta');
      var av = d.createElement('span'); av.className = 'nav-avatar'; av.id = 'navAvatar'; av.textContent = ini || '·'; acct.appendChild(av);
      shell.querySelector('[data-slot="cuenta"]').appendChild(acct);
    } else if(ini){
      [].forEach.call(d.querySelectorAll('.nav-avatar'), function(a){ if(a.textContent.trim() === '?') a.textContent = ini; });
    }
    if(typeof window.initMemberHeader === 'function'){ try{ window.initMemberHeader(); }catch(e){} }

    shell.querySelector('.k-nav').addEventListener('click', function(e){
      if(e.target.closest('[data-nav="perfil"]')){ openMore(); return; }
      if(e.target.closest('.k-nav__item')) SND.play('tap'); });
    /* La pista de membresía puede llegar después (primer ingreso en este navegador, o membresía que vence):
       la barra se ajusta sola cuando backend.js confirma la cuenta (C8). En la vista previa de miembros.html manda la página. */
    addEventListener('leo-member-hint', function(){
      if(html.classList.contains('v2-preview')) return;
      var nm = (function(){ try{ return !localStorage.getItem('leo_member_hint'); }catch(e){ return nonMember; } })();
      if(nm === nonMember) return; nonMember = nm;
      var nav = shell.querySelector('.k-nav'); [].slice.call(nav.querySelectorAll('.k-nav__item')).forEach(function(x){ x.remove(); });
      nav.insertAdjacentHTML('beforeend', K.px(navHTML()));
      var stk = d.getElementById('v2Streak'); if(stk) stk.setAttribute('href', nonMember ? 'practica.html' : 'progreso.html');
    });
    /* Sin pista guardada (navegador nuevo, o páginas como la Academia que no consultan el perfil): se confirma una vez */
    if(nonMember && !html.classList.contains('v2-preview')){
      var tries = 0;
      (function ask(){
        if(typeof LeoBackend !== 'undefined' && LeoBackend.getMemberProfile){
          try{ Promise.resolve(LeoBackend.getMemberProfile()).then(function(pr){ if(!pr && ++tries < 6) setTimeout(ask, 1200); }, function(){}); }catch(e){}
          return;
        }
        if(++tries < 30) setTimeout(ask, 300);
      })();
    }
    d.getElementById('v2Sound').addEventListener('click', function(){ SND.play('tap'); K.soundSheet(); });
    /* C9: LeoBot vive en la barra superior (zona segura): el robot flotante ya no tapa contenido en ningún tamaño */
    var hb = d.getElementById('v2Help'); hb.innerHTML = K.px(A.UI.chat); html.classList.add('v2-help-docked');
    hb.addEventListener('click', function(){ SND.play('tap'); openLeoBot(); });
    window.addEventListener('v2:sound', paintTop);
    d.getElementById('v2Theme').addEventListener('click', function(){ SND.play('tap'); setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
    addEventListener('scroll', function(){ d.getElementById('v2Top').classList.toggle('k-is-scrolled', scrollY > 4); }, { passive: true });

    /* Academia: sus pestañas pasan arriba del contenido (selector segmentado) */
    var acTabs = d.getElementById('acTabs'), main = d.querySelector('main');
    if(acTabs && main) main.insertBefore(acTabs, main.firstChild);

    paintTop();
    addEventListener('leo-progress-synced', paintTop);
    setTimeout(paintTop, 1500); setTimeout(paintTop, 5000);
    compactSetup();
    window.dispatchEvent(new Event('v2:shell'));
  }

  /* Cuenta de la sesión guardada (para no mezclar la racha de dos cuentas en el mismo navegador) */
  function acctId(){
    try{ for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(!/^sb-.*-auth-token$/.test(k)) continue;
      var v = JSON.parse(localStorage.getItem(k)), u = v && (v.user || (v.currentSession && v.currentSession.user)); if(u && u.id) return u.id; } }catch(e){}
    return '';
  }
  /* Academia: al terminar una lección la racha puede haber cambiado y esta página no la calcula: la ficha se oculta
     hasta la próxima página que la calcule (mejor nada que un dato viejo) */
  function staleStreak(){ if(typeof window.computeStreak === 'function') return; paintTop.stale = true; var st = d.getElementById('v2Streak'); if(st) st.hidden = true; }
  /* Inicial del alumno sin depender de app.js (la Academia no lo carga): nombre guardado de ESTA cuenta o, si no hay, el correo */
  function acctInitial(){
    var n = '';
    try{ n = (window.V2D && V2D.name()) || ''; }catch(e){}
    if(!n){ try{
      for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(!/^sb-.*-auth-token$/.test(k)) continue;
        var v = JSON.parse(localStorage.getItem(k)), u = v && (v.user || (v.currentSession && v.currentSession.user));
        if(u && u.id){ var p = JSON.parse(localStorage.getItem('leo_profile@@u:' + u.id) || 'null'); n = (p && p.name) || (u.email ? u.email.split('@')[0] : ''); }
        break; }
    }catch(e){} }
    return (String(n).trim().charAt(0) || '').toUpperCase();
  }
  function setTheme(t){ window.ICL_V2.setTheme(t); paintTop(); window.dispatchEvent(new Event('v2:theme')); }
  function paintTop(){
    var st = d.getElementById('v2Streak'); if(!st) return;
    var n = 0, today = false;
    /* La racha la calcula app.js. Bloque C: cada página que la calcula deja el resultado (de esta cuenta y de hoy) en el
       navegador; la Academia, que no carga app.js, muestra ese mismo resultado sin calcular nada ni consultar la red.
       Si no hay un resultado de hoy de esta cuenta, la ficha no se muestra (nunca un 0 falso). */
    var KEY = 'icl.racha.estado', uid = acctId(), ymd = (window.V2D && V2D.ymd) ? V2D.ymd(new Date()) : '';
    if(typeof window.computeStreak === 'function'){
      st.hidden = false;
      try{ if(window.V2D){ var p = V2D.practice(); n = p.streak; today = p.practicedToday; } }catch(e){}
      try{ if(uid && ymd) localStorage.setItem(KEY, JSON.stringify({ u: uid, d: ymd, n: n, t: today })); }catch(e){}
    } else {
      var c = null; try{ c = JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){}
      var hoy = (function(){ var x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })();
      if(c && uid && c.u === uid && c.d === hoy && !paintTop.stale){ n = c.n; today = !!c.t; st.hidden = false; }
      else { st.hidden = true; }
    }
    /* Bloque C: la llama dice el estado de un vistazo (activa, pendiente hoy, en cero). Solo dibujo: la racha la
       calcula app.js y sus reglas no cambian. */
    var state = !n ? 'off' : today ? 'on' : 'pending';
    st.innerHTML = K.px((A.flame ? A.flame(state) : A.STK.flame) + '<span id="v2StreakN">' + n + '</span>');
    st.classList.toggle('k-is-off', !today);
    st.classList.toggle('v2-stk-pending', state === 'pending');
    st.setAttribute('aria-label', 'Racha: ' + n + (n === 1 ? ' día' : ' días') + (today ? '' : ', practica hoy para sumar'));
    var snd = d.getElementById('v2Sound');
    snd.innerHTML = K.px(SND.enabled ? A.UI.speaker : A.UI.soundOff);
    snd.setAttribute('aria-label', SND.enabled ? 'Sonidos de efectos activados. Ajustar' : 'Sonidos de efectos en silencio. Ajustar');
    snd.setAttribute('aria-pressed', String(!!SND.enabled));
    var dark = html.getAttribute('data-theme') === 'dark', th = d.getElementById('v2Theme');
    th.innerHTML = K.px(dark ? A.UI.sun : A.UI.moon);
    th.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  /* Bloque B (UX): Perfil sustituye a "Más". Reúne cuenta (nombre, suscripción, cerrar sesión: los botones REALES
     del menú de cuenta, que siguen haciendo lo mismo), preferencias (tema, sonidos, meta), ayuda (LeoBot), avisos,
     el resto de secciones y la versión clásica. Nada se pierde: solo cambia de lugar. */
  function openMore(){
    SND.play('open');
    var pref = window.ICL_V2.theme(), goal = window.V2D ? V2D.goal() : 10, U = A.UI;
    var row = function(href, ico, t, sub){ return '<a class="more__row" href="' + href + '"><span class="more__ic">' + ico + '</span><span><b>' + t + '</b><small>' + sub + '</small></span>' + U.chevron + '</a>'; };
    var act = function(key, ico, t, sub, cls){ return '<button type="button" class="more__row ' + (cls || '') + '" data-act="' + key + '"><span class="more__ic">' + ico + '</span><span><b>' + t + '</b><small>' + sub + '</small></span>' + U.chevron + '</button>'; };
    var real = function(id){ var b = d.getElementById(id); return b && b.style.display !== 'none' ? b : null; };
    var txt = function(id){ var e = d.getElementById(id); return e ? e.textContent.trim() : ''; };
    var name = txt('navProfilePopName'), mail = txt('navProfilePopEmail'), ini = acctInitial() || '·';
    if(!name || name === 'Cuenta'){ try{ name = (window.V2D && V2D.name()) || ''; }catch(e){} }
    var bell = txt('navBellContent');
    var outBtn = real('navLogoutBtn') || d.getElementById('previewLogoutBtn'), hasMenu = !!real('navLogoutBtn');
    var m = K.sheet({ label: 'Perfil', cls: 'modal--sheet v2-more v2-perfil', html:
      '<div class="v2-perfil__head"><span class="v2-perfil__av" aria-hidden="true">' + K.esc(ini) + '</span><div><h3>' + K.esc(name || 'Tu perfil') + '</h3>' + (mail ? '<p>' + K.esc(mail) + '</p>' : '') + '</div></div>' +
      (bell ? '<p class="v2-perfil__bell">' + U.info + '<span>' + K.esc(bell) + '</span></p>' : '') +
      '<h4 class="v2-perfil__h">Tu cuenta</h4><div class="more">' +
        (real('navEditNameBtn') ? act('name', I4.perfil || A.ICO.level, 'Editar tu nombre', 'Cómo te llamamos en la academia') : '') +
        (nonMember ? row('practica.html?personalizar=1', I4.goal || A.ICO.target, 'Personalizar mi práctica', 'Tu nombre y tu nivel') : '') +
        (nonMember ? row('miembros.html?pagar=1', I4.trophy || A.STK.trophy, 'Hazte miembro', 'Cursos completos, repaso de errores y Leo AI') : '') +
        (!nonMember && real('navManageSubBtn') ? act('sub', I4.badge || A.ICO.days, 'Suscripción', 'Tu membresía y cómo cambiarla o cancelarla') : '') +
        (hasMenu || outBtn ? '' : row('miembros.html', I4.perfil || A.ICO.days, 'Cuenta y suscripción', 'En Inicio: nombre, suscripción y cerrar sesión')) +
      '</div>' +
      '<h4 class="v2-perfil__h">Preferencias</h4>' +
      '<div class="card list v2-settings">' +
        '<div class="row">' + U.sun + '<span class="row__label">Tema</span><div class="seg" role="group" aria-label="Tema">' +
          ['light', 'dark', 'auto'].map(function(t){ return '<button type="button" data-t="' + t + '" aria-pressed="' + (pref === t) + '">' + U[t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'auto'] + ({ light:'Claro', dark:'Oscuro', auto:'Auto' })[t] + '</button>'; }).join('') + '</div></div>' +
        '<div class="row">' + U.speaker + '<span class="row__label">Sonidos<small>Efectos al responder y celebrar, y su volumen</small></span><button type="button" class="btn btn--sm btn--secondary" data-sndsheet>Ajustar</button></div>' +
        (nonMember ? '' : '<div class="row">' + U.clockLine + '<span class="row__label">Meta diaria<small>Minutos de práctica al día</small></span><div class="seg" role="group" aria-label="Meta diaria">' +
          [5, 10, 15, 20].map(function(g){ return '<button type="button" data-goal="' + g + '" aria-pressed="' + (goal === g) + '">' + g + '</button>'; }).join('') + '</div></div>') +
      '</div>' +
      '<h4 class="v2-perfil__h">Ayuda</h4><div class="more">' + act('bot', U.chat, 'LeoBot', 'Preguntas sobre la academia, pagos o cómo usarla') + '</div>' +
      '<details class="v2-details v2-advanced"><summary>Más secciones</summary><div class="more">' +
        (nonMember ? '' : row('plan-estudio.html', I4.plan || A.ICO.days, 'Plan de estudio', 'Lo que te toca hoy según tus errores') + row('errores.html', I4.mend || A.ICO.mend, 'Mis errores', 'Método Leo: recupera y domina')) +
        row('juego.html', I4.rush || A.ICO.rush, 'English Rush', 'Preguntas rápidas, modo juego') +
        row('clases.html', I4.clases || A.ICO.listen, 'Clases interactivas', 'Situaciones reales con audio') +
        row('examenes.html', I4.exam || A.ICO.level, 'Exámenes', 'TOEFL, IELTS, TOEIC y Cambridge') +
        row('aprender.html', I4.bulb || A.ICO.lesson, 'Modo aprender', 'Microlecciones de 3 minutos para mirar y escuchar') +
        row('articulos.html', I4.read || A.ICO.read, 'Aprende inglés', 'Guías y artículos gratis') +
      '</div></details>' +
      /* C22: la versión clásica es un mecanismo de recuperación, no una opción del día a día: queda en Ajustes avanzados */
      '<details class="v2-details v2-advanced"><summary>Ajustes avanzados</summary><div class="card list">' +
        '<div class="row">' + U.refresh + '<span class="row__label">Versión clásica<small>Solo si algo no se ve bien: vuelve al diseño anterior en este dispositivo. Al final de cada página tendrás un enlace para regresar</small></span><button type="button" class="btn btn--sm btn--secondary" data-classic>Usar clásica</button></div>' +
      '</div></details>' +
      (outBtn ? '<button type="button" class="btn btn--block btn--secondary v2-perfil__out" data-act="out">Cerrar sesión</button>' : '') +
      '<p class="v2-legal"><a href="index.html">Página principal</a> · <a href="privacidad.html">Privacidad</a> · <a href="terminos.html">Términos</a> · <a href="index.html#contacto">Contacto</a></p>' });
    m.box.addEventListener('click', function(e){
      var t = e.target.closest('[data-t]');
      if(t){ SND.play('select'); setTheme(t.getAttribute('data-t')); K.$$('[data-t]', m.box).forEach(function(b){ b.setAttribute('aria-pressed', String(b === t)); }); return; }
      var g = e.target.closest('[data-goal]');
      if(g){ SND.play('select'); V2D.setGoal(+g.getAttribute('data-goal')); K.$$('[data-goal]', m.box).forEach(function(b){ b.setAttribute('aria-pressed', String(b === g)); }); window.dispatchEvent(new Event('v2:goal')); return; }
      if(e.target.closest('[data-sndsheet]')){ m.close(true); setTimeout(K.soundSheet, 260); return; }
      if(e.target.closest('[data-classic]')){ try{ localStorage.setItem('icl.ui', 'classic'); }catch(_){} location.reload(); return; }
      var a = e.target.closest('[data-act]'); if(!a) return;
      var k = a.getAttribute('data-act');
      m.close(true);
      /* Los botones reales del menú de cuenta hacen el trabajo (mismo código de siempre) */
      setTimeout(function(){
        if(k === 'name'){ var b1 = real('navEditNameBtn'); if(b1) b1.click(); }
        else if(k === 'sub'){ var b2 = real('navManageSubBtn'); if(b2) b2.click(); }
        else if(k === 'out'){ if(outBtn) outBtn.click(); }
        else if(k === 'bot') openLeoBot();
      }, 260);
    });
  }

  /* C21: en las páginas de cada habilidad el ejercicio va primero. Nivel y duración (los selectores reales, que la
     sesión sigue usando igual) quedan en un resumen plegable: "Fácil A1–A2 · Media (~9 ejercicios) · Cambiar". */
  function compactSetup(){
    /* Mis errores: el ejercicio primero; los patrones (con sus botones reales) quedan justo debajo */
    var pat = d.getElementById('mistakePatterns'), sa = d.getElementById('sessionArea');
    if(pat && sa && pat.nextElementSibling === sa){ sa.parentNode.insertBefore(pat, sa.nextSibling); pat.classList.add('v2-after-session'); }
    var lv = d.getElementById('levelSelector'), ln = d.getElementById('lengthSelector'), area = d.getElementById('sessionArea');
    if(!lv || !area || lv.closest('.v2-setup')) return;
    var det = d.createElement('details'); det.className = 'v2-setup';
    var sum = d.createElement('summary'); det.appendChild(sum);
    var box = d.createElement('div'); box.className = 'v2-setup__body'; det.appendChild(box);
    lv.parentNode.insertBefore(det, lv); box.appendChild(lv); if(ln) box.appendChild(ln);
    var txt = function(sel, a, b){ var x = sel && sel.querySelector('[aria-pressed="true"]'); if(!x) return ''; var n = x.querySelector(a), r = x.querySelector(b);
      return (n ? n.textContent.trim() : '') + (r && r.textContent.trim() ? ' ' + r.textContent.trim().replace(/^~/, '(~') + (/^~/.test(r.textContent.trim()) ? ')' : '') : ''); };
    var paint = function(){
      var a = txt(lv, '.level-name', '.level-range'), b = txt(ln, '.length-name', '.length-sub');
      sum.innerHTML = '<span class="v2-setup__k">' + (a || b ? 'Nivel' : 'Elige nivel y duración') + '</span><b>' + K.esc([a, b].filter(Boolean).join(' · ')) + '</b><span class="v2-setup__go">Cambiar</span>';
    };
    paint();
    /* Si tras cargar la página no hay nivel elegido, se muestra abierto para elegirlo */
    setTimeout(function(){ if(!lv.querySelector('[aria-pressed="true"]')) det.open = true; }, 1500);
    var mo = new MutationObserver(paint); mo.observe(box, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed'] });
    /* Al elegir otro nivel o duración la sesión se reinicia: se pliega para volver al ejercicio */
    box.addEventListener('click', function(e){ if(e.target.closest('[data-level],[data-length]')) setTimeout(function(){ det.open = false; }, 120); });
  }

  /* Abre el asistente real (chatbot.js). Si aún no cargó (carga diferida), el primer toque lo descarga y se espera */
  function openLeoBot(){
    var tries = 0;
    (function go(){
      var fab = d.getElementById('leobotFab'), pill = d.getElementById('leobotReopen');
      if(fab){ fab.click(); return; }
      if(pill){ pill.click(); return; }
      if(++tries < 40) setTimeout(go, 100);
    })();
  }
  window.ICL_openLeoBot = openLeoBot;

  /* Nuevo día de racha conseguido (primera práctica de hoy): la llama de la barra se enciende una vez */
  function igniteStreak(){
    var st = d.getElementById('v2Streak'); if(!st || !A.flame) return;
    paintTop();
    var svg = st.querySelector('.v2-flame'); if(svg){ svg.setAttribute('class', svg.getAttribute('class').replace(/v2-fl--\w+/, 'v2-fl--new')); }
    st.classList.remove('v2-stk-new'); void st.offsetWidth; st.classList.add('v2-stk-new');
  }
  window.V2SHELL = { paintTop: paintTop, current: current, igniteStreak: igniteStreak, staleStreak: staleStreak };

  /* Volver a 2.0 desde la clásica: ?v2=1 borra la preferencia */
  if(/[?&]v2=1\b/.test(location.search)){ try{ localStorage.removeItem('icl.ui'); }catch(_){} }

  if(page === 'miembros.html'){
    /* Solo con el área de miembro visible (la decide la página real tras verificar la cuenta) */
    var mc = d.getElementById('memberContent'), pv = d.getElementById('memberPreview');
    if(!mc) return;
    var vis = function(e){ return !!(e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'); };
    var go = function(){
      if(vis(mc)){ obs.disconnect(); window.ICL_V2.activate(); build(); return; }
      /* C8: cuenta gratis o vencida con sesión: misma barra 2.0 (sin Progreso, con la práctica gratis) */
      if(vis(pv)){ obs.disconnect(); nonMember = true; window.ICL_V2.activate(); html.classList.add('v2-preview'); build(); }
    };
    var obs = new MutationObserver(go);
    obs.observe(mc, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    if(pv) obs.observe(pv, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    go();
  } else if((page === 'academia.html' || page === 'juego.html' || page === 'aprender.html') && !hasSession()){
    /* Visitantes en la Academia, English Rush o Modo aprender: su página pública de siempre, sin la barra de la app */
  } else {
    build();
  }
  function hasSession(){ try{ for(var i = 0; i < localStorage.length; i++){ if(/^sb-.*-auth-token$/.test(localStorage.key(i))) return true; } }catch(e){} return false; }
})();
