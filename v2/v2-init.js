/* =========================================================
   Inglés con Leo 2.0 · arranque (se carga en <head>, sin defer)
   - Interruptor general (rollback interno): ICL_V2_ENABLED.
     false = nadie ve 2.0; la página queda exactamente como la clásica.
   - Preferencia cosmética "clásica" (localStorage 'icl.ui' = 'classic').
     Es solo apariencia: nunca decide permisos ni acceso.
   - Tema: 'light' | 'dark' | 'auto' (localStorage 'icl.theme'), aplicado
     antes de pintar para que no haya parpadeo.
   No llama a Supabase, no toca progreso, pagos ni analítica.
   ========================================================= */
(function(){
  var ICL_V2_ENABLED = true;           // <- ROLLBACK: poner false y publicar
  var root = document.documentElement;
  var get = function(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } };
  var ui = get('icl.ui');
  var force = /[?&]v2=(1|0)\b/.exec(location.search);  // ?v2=0 / ?v2=1 solo para pruebas
  var on = ICL_V2_ENABLED && ui !== 'classic';
  if(force) on = force[1] === '1';
  window.ICL_V2 = { enabled: on, switchEnabled: ICL_V2_ENABLED };
  if(!on) return;
  /* miembros.html es pública e indexada: allí 2.0 se enciende SOLO cuando la página ya
     mostró el área de miembro (v2-home.js llama a ICL_V2.activate()). Visitantes, Google,
     login y pagos se quedan exactamente como están. */
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var deferred = page === 'miembros.html';
  /* Oscuro por defecto. Si el alumno ya eligió Claro, Oscuro o Auto, se respeta (solo se guarda cuando él elige). */
  var pref = get('icl.theme') || 'dark';
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  var apply = function(){
    var t = pref === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : pref;
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', t === 'dark' ? '#0B0F1A' : '#F7F3EC');
  };
  /* Sin destello blanco: el fondo oscuro se pinta antes que cualquier contenido */
  var preStyle = null;
  function preDark(on){
    if(on && !preStyle){ preStyle = document.createElement('style'); preStyle.textContent = 'html.v2-pre,html.v2-pre body{background:#0B0F1A!important;color-scheme:dark}html.v2-pre #gateLoading{color:#AAB1C4}'; document.head.appendChild(preStyle); root.classList.add('v2-pre'); }
    if(!on && preStyle){ root.classList.remove('v2-pre'); preStyle.remove(); preStyle = null; }
  }
  var resolved = function(){ return pref === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : pref; };
  var active = false;
  window.ICL_V2.activate = function(){
    if(active) return; active = true;
    root.classList.add('v2');
    apply();
    if(resolved() === 'dark') preDark(true);
    var off = function(){ preDark(false); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(off, 0); }); else setTimeout(off, 0);
    if(mq && mq.addEventListener) mq.addEventListener('change', function(){ if(pref === 'auto') apply(); });
  };
  window.ICL_V2.active = function(){ return active; };
  if(!deferred){ window.ICL_V2.activate(); return; }

  /* miembros.html con sesión guardada y tema oscuro: fondo oscuro mientras la página decide (sin destello).
     Si resulta que no es miembro (login, área gratis), se quita y la página clásica queda igual. */
  var hasSession = false;
  try{ for(var i = 0; i < localStorage.length; i++){ if(/^sb-.*-auth-token$/.test(localStorage.key(i))){ hasSession = true; break; } } }catch(e){}
  if(hasSession && resolved() === 'dark') preDark(true);

  /* miembros.html: nada de 2.0 se descarga para visitantes ni buscadores. Solo cuando la página
     muestra el área de miembro se cargan los estilos y scripts (en orden) y se enciende. */
  var V = '20261127c';
  var CSS = ['v2-tokens.css', 'v2-base.css', 'v2-dark-auto.css', 'v3-ui.css', 'v2-screens.css', 'v2-lecciones.css', 'v2-paginas.css'];
  var JS = ['v3-art.js', 'v3-sound.js', 'v2-kit.js', 'v2-data.js', 'v2-shell.js', 'v2-home.js'];
  var loading = false;
  function loadAll(){
    if(loading) return; loading = true;
    var head = document.head, left = CSS.length;
    var next = function(i){ if(i >= JS.length) return; var sc = document.createElement('script'); sc.src = 'v2/' + JS[i] + '?v=' + V; sc.onload = sc.onerror = function(){ next(i + 1); }; document.body.appendChild(sc); };
    CSS.forEach(function(f){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'v2/' + f + '?v=' + V;
      l.onload = l.onerror = function(){ if(--left === 0){ window.ICL_V2.activate(); preDark(false); next(0); } }; head.appendChild(l); });
  }
  function watch(){
    var mc = document.getElementById('memberContent'); if(!mc) return;
    var shown = function(id){ var e = document.getElementById(id); return !!(e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'); };
    var check = function(){
      if(shown('memberContent')){ obs.disconnect(); loadAll(); return; }
      if(shown('gate') || shown('memberPreview')) preDark(false);
    };
    var obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });
    check();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  window.ICL_V2.setTheme = function(t){
    pref = t; try{ localStorage.setItem('icl.theme', t); }catch(e){}
    if(active) apply();
  };
  window.ICL_V2.theme = function(){ return pref; };
})();
