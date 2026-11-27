/* =========================================================
   Inglés con Leo 2.0 · Practicar (practica-miembros.html)
   Pantalla "Practicar" del prototipo v3 sobre los motores reales:
     1. Recomendado por Leo: refuerza tus errores (Método Leo real)
     2. Reto diario: la tarjeta REAL (se mueve aquí, sigue funcionando igual)
     3. Por habilidad: 6 fichas con tus aciertos reales de 30 días; al tocar
        una se abre la pestaña real de esa habilidad (sus sesiones de siempre)
     4. English Rush y más formas de aprender
   Las sesiones siguen corriendo en los motores de app.js, sin cambios.
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled || !window.K || !window.V2D) return;
  if((location.pathname.split('/').pop() || '').toLowerCase() !== 'practica-miembros.html') return;
  var d = document, K = window.K, A = K.ART, SND = K.SND, esc = K.esc;
  var screen = null;
  var SK = [
    { k: 'gramatica', n: 'Gramática', ic: 'grammar', c: 'brand' }, { k: 'vocabulario', n: 'Vocabulario', ic: 'vocab', c: 'ok' },
    { k: 'listening', n: 'Listening', ic: 'listen', c: 'info' }, { k: 'speaking', n: 'Speaking', ic: 'speak', c: 'streak' },
    { k: 'writing', n: 'Writing', ic: 'write', c: 'award' }, { k: 'lectura', n: 'Lectura', ic: 'read', c: 'xp', href: 'lectura.html' }
  ];
  function acc30(){
    var out = {}, cut = Date.now() - 30 * 86400000;
    try{ loadProgress().sessions.forEach(function(s){ if(!s.date || new Date(s.date + 'T12:00:00').getTime() < cut) return; var o = out[s.skill] || (out[s.skill] = { n: 0, ok: 0, s: 0 }); o.s++;
      (s.results || []).forEach(function(r){ if(r && (r.isCorrect === true || r.isCorrect === false)){ o.n++; if(r.isCorrect) o.ok++; } }); }); }catch(e){}
    return out;
  }
  function render(mis){
    var acc = acc30(), act = mis ? mis.active : [];
    var html = '<div class="v2-screen v2-practicar">' +
      '<header class="page-head"><h1>Practicar</h1><p>Elige qué entrenar. Te recomendamos empezar por tus refuerzos.</p></header>' +
      (act.length ? '<section class="rec"><div class="leo rec__leo"><img src="v2/leo/leo-thinking-bust.png" alt="Profe Leo" draggable="false"></div>' +
        '<span class="method__eyebrow">' + A.STK.mend + 'Recomendado por Leo</span>' +
        '<h2>Refuerza ' + act.length + ' ' + (act.length === 1 ? 'error' : 'errores') + '</h2>' +
        '<ul class="rec__list">' + act.slice(0, 3).map(function(e){ return '<li><b>' + esc(e.label || e.topic) + '</b>' + K.steps(e.streak) + '</li>'; }).join('') + '</ul>' +
        '<div class="rec__foot"><a class="btn btn--mend" href="errores.html?modo=rapido">Reforzar ahora</a><a class="link" href="errores.html">Ver todos</a></div></section>' : '') +
      '<section class="v2-reto-box" id="reto"><div class="v2-slot-real" data-real="reto"></div></section>' +
      '<a class="v2-plan" href="plan-estudio.html">' + A.ICO.days + '<span><span class="t-eyebrow">Plan de estudio</span><b>Tu práctica recomendada de hoy</b><small>Según tu nivel, tu progreso y tus errores. De 5 a 25 minutos.</small></span>' + A.UI.chevron + '</a>' +
      '<div class="block__head"><h2>Por habilidad</h2><span class="t-muted small">Aciertos · 30 días</span></div>' +
      '<div class="skills-grid">' + SK.map(function(s){ var a = acc[s.k], pct = a && a.n ? Math.round(a.ok / a.n * 100) : null;
        return '<button type="button" class="skt skt--' + s.c + '" data-skill="' + s.k + '"' + (s.href ? ' data-href="' + s.href + '"' : '') + '><span class="skt__ic">' + A.ICO[s.ic] + '</span>' +
          '<span class="skt__name">' + s.n + '</span><span class="skt__note">' + (a ? a.s + (a.s === 1 ? ' sesión' : ' sesiones') : 'Sin sesiones aún') + '</span>' +
          '<span class="skt__meta">' + (pct == null ? '<span class="skt__na">Sin datos aún</span>' : '<span class="skt__bar"><i style="width:' + pct + '%"></i></span><b>' + pct + '%</b>') + '</span></button>'; }).join('') + '</div>' +
      '<a class="rush" href="juego.html"><span class="rush__art">' + A.STK.rush + '</span><span class="rush__copy"><span class="t-eyebrow">Modo juego</span><b>English Rush</b><span class="rush__meta"><span>Preguntas rápidas con dificultad progresiva</span></span></span><span class="rush__play">' + A.UI.play + '</span></a>' +
      '<h2 class="v2-engine-h" id="v2Engine">Tu sesión por habilidad</h2>' +
      '</div>';
    var el = K.h(html); el.classList.add('k-scope');
    return el;
  }
  function mount(){
    var main = d.querySelector('main'); if(!main) return;
    V2D.mistakes().then(function(mis){
      var fresh = render(mis);
      if(screen){ var old = screen.querySelector('#dailyChallengeCard'); if(old) fresh.querySelector('[data-real="reto"]').appendChild(old); }
      var reto = d.getElementById('dailyChallengeCard'), slot = fresh.querySelector('[data-real="reto"]');
      if(reto && slot) slot.appendChild(reto);
      if(screen) screen.replaceWith(fresh); else main.insertBefore(fresh, main.firstChild);
      screen = fresh;
      main.classList.add('v2-has-practice');
      /* El motor real (nivel + pestañas + sesión) queda justo debajo, con su encabezado */
      fresh.addEventListener('click', function(e){
        var t = e.target.closest('[data-skill]'); if(!t) return;
        SND.play('open');
        if(t.getAttribute('data-href')){ location.href = t.getAttribute('data-href'); return; }
        var tab = d.querySelector('#skillTabs .skill-tab-btn[data-skill="' + t.getAttribute('data-skill') + '"]');
        if(tab) tab.click();
        var target = d.getElementById('porHabilidad') || d.getElementById('skillTabs');
        if(target) target.scrollIntoView({ behavior: K.reduced() ? 'auto' : 'smooth', block: 'start' });
      });
      if(location.hash === '#reto'){ var r = d.getElementById('reto'); if(r) r.scrollIntoView(); }
      d.title = 'Practicar - Inglés con Leo';
    });
  }
  window.addEventListener('v2:shell', mount);
  /* Las sesiones de otro dispositivo llegan después: se vuelve a pintar con los datos completos */
  window.addEventListener('leo-progress-synced', function(){ if(screen) mount(); });
  if(d.querySelector('.v2-shell')) mount();
})();
