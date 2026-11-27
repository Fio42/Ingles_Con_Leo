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
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var APP = { 'miembros.html':'inicio', 'academia.html':'academia', 'practica-miembros.html':'practicar', 'plan-estudio.html':'practicar',
              'errores.html':'practicar', 'progreso.html':'progreso',
              'gramatica.html':'practicar', 'vocabulario.html':'practicar', 'listening.html':'practicar', 'speaking.html':'practicar', 'writing.html':'practicar',
              'mixto.html':'practicar', 'lectura.html':'practicar', 'clases.html':'mas', 'examenes.html':'mas', 'toefl.html':'mas', 'ielts.html':'mas',
              'toeic.html':'mas', 'cambridge.html':'mas', 'aprender.html':'mas', 'juego.html':'mas' };
  var current = APP[page];
  if(!current) return;

  var MAS = '<svg class="ico nav-ico" viewBox="0 0 32 32" aria-hidden="true"><g class="nav-ico__body" stroke-width="2.4" stroke-linejoin="round"><rect x="4.5" y="4.5" width="9.5" height="9.5" rx="3"/><rect x="18" y="4.5" width="9.5" height="9.5" rx="3"/><rect x="4.5" y="18" width="9.5" height="9.5" rx="3"/><rect x="18" y="18" width="9.5" height="9.5" rx="3"/></g><g class="nav-ico__detail"></g></svg>';
  /* C8: la barra se adapta a los accesos de la cuenta. Sin membresía activa (cuenta gratis o vencida) Practicar lleva
     a la práctica gratis y Progreso (exclusivo de miembros) no aparece. Solo cambia la navegación: los permisos los sigue
     decidiendo la página real (guardMember) y el servidor. La pista leo_member_hint la escribe backend.js al verificar. */
  var nonMember = (function(){ try{ return !localStorage.getItem('leo_member_hint'); }catch(e){ return false; } })();
  function items(){ return nonMember ? [
    { k:'inicio', t:'Inicio', h:'miembros.html' }, { k:'academia', t:'Academia', h:'academia.html' },
    { k:'practicar', t:'Practicar', h:'practica.html' }, { k:'mas', t:'Más' }
  ] : [
    { k:'inicio', t:'Inicio', h:'miembros.html' }, { k:'academia', t:'Academia', h:'academia.html' },
    { k:'practicar', t:'Practicar', h:'practica-miembros.html' }, { k:'progreso', t:'Progreso', h:'progreso.html' }, { k:'mas', t:'Más' }
  ]; }

  function build(){
    if(d.querySelector('.v2-shell')) return;
    html.classList.add('v2-app');
    var shell = K.h('<div class="v2-shell">' +
      '<header class="topbar" id="v2Top"><span class="v2-slot" data-slot="cuenta"></span><span class="topbar__spacer"></span>' +
        '<a class="stat stat--streak is-off" id="v2Streak" href="progreso.html" aria-label="Racha"></a>' +
        '<button type="button" class="icon-btn" id="v2Sound"></button>' +
        '<button type="button" class="icon-btn" id="v2Theme"></button>' +
        '<span class="v2-slot" data-slot="avisos"></span></header>' +
      '<nav class="nav" aria-label="Principal"><a class="nav__brand" href="index.html" aria-label="Inglés con Leo: página principal"><span class="avatar avatar--leo"><img src="logo.png" alt=""></span><span class="wordmark">Inglés con <b>Leo</b></span></a>' +
        items().map(function(it){
          var ico = it.k === 'mas' ? MAS : (A.NAV_ICO || {})[it.k] || '';
          var inner = '<span class="nav__ico">' + ico + '<span class="nav__badge" hidden></span></span><span class="nav__label">' + it.t + '</span>';
          return it.h ? '<a class="nav__item" data-nav="' + it.k + '" href="' + it.h + '"' + (it.k === current ? ' aria-current="page"' : '') + '>' + inner + '</a>'
                      : '<button type="button" class="nav__item" data-nav="' + it.k + '" aria-haspopup="dialog"' + (it.k === current ? ' aria-current="page"' : '') + '>' + inner + '</button>';
        }).join('') + '</nav></div>');
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

    shell.querySelector('[data-nav="mas"]').addEventListener('click', openMore);
    shell.querySelector('.k-nav').addEventListener('click', function(e){ if(e.target.closest('.k-nav__item')) SND.play('tap'); });
    d.getElementById('v2Sound').addEventListener('click', function(){ SND.play('tap'); K.soundSheet(); });
    window.addEventListener('v2:sound', paintTop);
    d.getElementById('v2Theme').addEventListener('click', function(){ SND.play('tap'); setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
    addEventListener('scroll', function(){ d.getElementById('v2Top').classList.toggle('k-is-scrolled', scrollY > 4); }, { passive: true });

    /* Academia: sus pestañas pasan arriba del contenido (selector segmentado) */
    var acTabs = d.getElementById('acTabs'), main = d.querySelector('main');
    if(acTabs && main) main.insertBefore(acTabs, main.firstChild);

    paintTop();
    addEventListener('leo-progress-synced', paintTop);
    setTimeout(paintTop, 1500); setTimeout(paintTop, 5000);
    window.dispatchEvent(new Event('v2:shell'));
  }

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
    /* La racha la calcula app.js; en páginas sin app.js (Academia) la ficha no se muestra para no enseñar un 0 falso */
    st.hidden = typeof window.computeStreak !== 'function';
    try{ if(window.V2D){ var p = V2D.practice(); n = p.streak; today = p.practicedToday; } }catch(e){}
    st.innerHTML = K.px(A.STK.flame + '<span id="v2StreakN">' + n + '</span>');
    st.classList.toggle('k-is-off', !today);
    st.setAttribute('aria-label', 'Racha: ' + n + (n === 1 ? ' día' : ' días') + (today ? '' : ', practica hoy para sumar'));
    var snd = d.getElementById('v2Sound');
    snd.innerHTML = K.px(SND.enabled ? A.UI.speaker : A.UI.soundOff);
    snd.setAttribute('aria-label', SND.enabled ? 'Sonidos de efectos activados. Ajustar' : 'Sonidos de efectos en silencio. Ajustar');
    snd.setAttribute('aria-pressed', String(!!SND.enabled));
    var dark = html.getAttribute('data-theme') === 'dark', th = d.getElementById('v2Theme');
    th.innerHTML = K.px(dark ? A.UI.sun : A.UI.moon);
    th.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  function openMore(){
    SND.play('open');
    var pref = window.ICL_V2.theme(), goal = window.V2D ? V2D.goal() : 10, U = A.UI;
    var row = function(href, ico, t, sub){ return '<a class="more__row" href="' + href + '"><span class="more__ic">' + ico + '</span><span><b>' + t + '</b><small>' + sub + '</small></span>' + U.chevron + '</a>'; };
    var m = K.sheet({ label: 'Más', cls: 'modal--sheet v2-more', html:
      '<h3>Más</h3>' +
      '<div class="more">' +
        row('plan-estudio.html', A.ICO.days, 'Plan de estudio', 'Lo que te toca hoy según tus errores') +
        row('errores.html', A.ICO.mend, 'Mis errores', 'Método Leo: recupera y domina') +
        row('juego.html', A.ICO.rush, 'English Rush', 'Preguntas rápidas, modo juego') +
        row('clases.html', A.ICO.listen, 'Clases interactivas', 'Situaciones reales con audio') +
        row('examenes.html', A.ICO.level, 'Exámenes', 'TOEFL, IELTS, TOEIC y Cambridge') +
        row('aprender.html', A.ICO.lesson, 'Modo aprender', 'Microlecciones de 3 minutos para mirar y escuchar') +
        row('articulos.html', A.ICO.read, 'Aprende inglés', 'Guías y artículos gratis') +
      '</div>' +
      '<div class="card list v2-settings">' +
        '<div class="row">' + U.sun + '<span class="row__label">Tema</span><div class="seg" role="group" aria-label="Tema">' +
          ['light', 'dark', 'auto'].map(function(t){ return '<button type="button" data-t="' + t + '" aria-pressed="' + (pref === t) + '">' + U[t === 'light' ? 'sun' : t === 'dark' ? 'moon' : 'auto'] + ({ light:'Claro', dark:'Oscuro', auto:'Auto' })[t] + '</button>'; }).join('') + '</div></div>' +
        '<div class="row">' + U.speaker + '<span class="row__label">Sonidos<small>Efectos al responder y celebrar, y su volumen</small></span><button type="button" class="btn btn--sm btn--secondary" data-sndsheet>Ajustar</button></div>' +
        '<div class="row">' + U.clockLine + '<span class="row__label">Meta diaria<small>Minutos de práctica al día</small></span><div class="seg" role="group" aria-label="Meta diaria">' +
          [5, 10, 15, 20].map(function(g){ return '<button type="button" data-goal="' + g + '" aria-pressed="' + (goal === g) + '">' + g + '</button>'; }).join('') + '</div></div>' +
      '</div>' +
      /* C22: la versión clásica es un mecanismo de recuperación, no una opción del día a día: queda en Ajustes avanzados */
      '<details class="v2-details v2-advanced"><summary>Ajustes avanzados</summary><div class="card list">' +
        '<div class="row">' + U.refresh + '<span class="row__label">Versión clásica<small>Solo si algo no se ve bien: vuelve al diseño anterior en este dispositivo. Al final de cada página tendrás un enlace para regresar</small></span><button type="button" class="btn btn--sm btn--secondary" data-classic>Usar clásica</button></div>' +
      '</div></details>' +
      '<p class="v2-legal"><a href="index.html">Página principal</a> · <a href="privacidad.html">Privacidad</a> · <a href="terminos.html">Términos</a> · <a href="index.html#contacto">Contacto</a></p>' });
    m.box.addEventListener('click', function(e){
      var t = e.target.closest('[data-t]');
      if(t){ SND.play('select'); setTheme(t.getAttribute('data-t')); K.$$('[data-t]', m.box).forEach(function(b){ b.setAttribute('aria-pressed', String(b === t)); }); return; }
      var g = e.target.closest('[data-goal]');
      if(g){ SND.play('select'); V2D.setGoal(+g.getAttribute('data-goal')); K.$$('[data-goal]', m.box).forEach(function(b){ b.setAttribute('aria-pressed', String(b === g)); }); window.dispatchEvent(new Event('v2:goal')); return; }
      if(e.target.closest('[data-sndsheet]')){ m.close(true); setTimeout(K.soundSheet, 260); return; }
      if(e.target.closest('[data-classic]')){ try{ localStorage.setItem('icl.ui', 'classic'); }catch(_){} location.reload(); }
    });
  }

  window.V2SHELL = { paintTop: paintTop, current: current };

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
