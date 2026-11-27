/* Inglés con Leo · tema (Claro / Oscuro / Auto). Se carga en <head>, sin defer, antes de pintar.
   Oscuro es el predeterminado (también sin JavaScript: lo pone style.css).
   Solo se guarda una preferencia cuando la persona elige (localStorage 'icl.theme', la misma de 2.0).
   No toca contenido, analítica ni sesión. */
(function(){
  var r = document.documentElement, pref = null;
  try{ pref = localStorage.getItem('icl.theme'); }catch(e){}
  if(pref !== 'light' && pref !== 'dark' && pref !== 'auto') pref = 'dark';
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function resolved(){ return pref === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : pref; }
  function apply(){
    var t = resolved();
    r.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', t === 'dark' ? '#0B0F1A' : '#FBF8F2');
    var b = document.getElementById('temaBtn'); if(b) paintBtn(b);
  }
  apply();
  if(mq && mq.addEventListener) mq.addEventListener('change', function(){ if(pref === 'auto') apply(); });
  window.ICL_TEMA = { get: function(){ return pref; }, set: function(t){ pref = t; try{ localStorage.setItem('icl.theme', t); }catch(e){} apply(); } };

  var SUN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
  function paintBtn(b){ var dark = r.getAttribute('data-theme') === 'dark'; b.innerHTML = dark ? MOON : SUN; b.setAttribute('aria-label', 'Tema: ' + ({ light: 'Claro', dark: 'Oscuro', auto: 'Automático' })[pref] + '. Cambiar'); }

  /* Selector en la cabecera pública (las páginas de la app 2.0 tienen el suyo) */
  function mount(){
    if(document.getElementById('temaBtn') || document.querySelector('.v2-shell')) return;
    var nav = document.querySelector('header .nav'); if(!nav) return;
    var wrap = document.createElement('div'); wrap.className = 'tema-wrap';
    wrap.innerHTML = '<button type="button" class="tema-btn" id="temaBtn" aria-haspopup="true" aria-expanded="false"></button>' +
      '<div class="tema-pop" role="menu" hidden>' + ['dark', 'light', 'auto'].map(function(t){ return '<button type="button" role="menuitemradio" data-tema="' + t + '">' + ({ dark: 'Oscuro', light: 'Claro', auto: 'Automático' })[t] + '</button>'; }).join('') + '</div>';
    var burger = nav.querySelector('.nav-burger'), actions = nav.querySelector('.nav-actions, .nav-cta');
    nav.insertBefore(wrap, actions || burger || null);
    var btn = wrap.querySelector('.tema-btn'), pop = wrap.querySelector('.tema-pop');
    paintBtn(btn);
    var sync = function(){ Array.prototype.forEach.call(pop.querySelectorAll('[data-tema]'), function(x){ x.setAttribute('aria-checked', String(x.getAttribute('data-tema') === pref)); }); };
    btn.addEventListener('click', function(e){ e.stopPropagation(); var open = pop.hidden; pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); sync(); });
    pop.addEventListener('click', function(e){ var t = e.target.closest('[data-tema]'); if(!t) return; window.ICL_TEMA.set(t.getAttribute('data-tema')); sync(); pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('click', function(){ pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
    /* C9: en la portada y la práctica gratis, LeoBot se abre desde la cabecera (zona segura) y el robot flotante
       no tapa el contenido en ningún tamaño. Los artículos y el glosario quedan como están. */
    var pg = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if(pg === 'index.html' || pg === 'practica.html'){
      var hb = document.createElement('button'); hb.type = 'button'; hb.className = 'tema-btn leobot-dock-btn'; hb.setAttribute('aria-label', 'Ayuda: abrir LeoBot'); hb.title = 'Ayuda';
      hb.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 12c0 4.1-3.8 7.3-8.5 7.3-1.3 0-2.5-.2-3.6-.7L3.5 20l1.3-3.7C4 15.1 3.5 13.6 3.5 12c0-4 3.8-7.3 8.5-7.3s8.5 3.3 8.5 7.3Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-linecap="round" stroke-width="2.6"/></svg>';
      nav.insertBefore(hb, wrap);
      r.classList.add('leobot-docked');
      hb.addEventListener('click', function(){ var n = 0; (function go(){ var f = document.getElementById('leobotFab'), pl = document.getElementById('leobotReopen'); if(f){ f.click(); return; } if(pl){ pl.click(); return; } if(++n < 40) setTimeout(go, 100); })(); });
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
