/* Glosario: menu movil, audio (sin autoplay), buscador, filtros y A-Z */
(function(){
  'use strict';

  /* Menu movil (mismo comportamiento que app.js) */
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.nav-links');
  if(burger && links){
    var close = function(){ links.classList.remove('mnav-open'); burger.setAttribute('aria-expanded','false'); };
    burger.setAttribute('aria-expanded','false');
    burger.addEventListener('click', function(e){
      e.stopPropagation();
      var open = links.classList.contains('mnav-open');
      if(open){ close(); } else { links.classList.add('mnav-open'); burger.setAttribute('aria-expanded','true'); }
    });
    links.addEventListener('click', function(e){ if(e.target.closest('a')) close(); });
    document.addEventListener('click', function(e){
      if(links.classList.contains('mnav-open') && !e.target.closest('.nav-links') && !e.target.closest('.nav-burger')) close();
    });
    window.addEventListener('resize', function(){ if(window.innerWidth >= 900) close(); });
  }

  /* Audio: una pista a la vez, solo al tocar */
  var current = null, currentBtn = null;
  function stop(){
    if(current){ current.pause(); current = null; }
    if(currentBtn){ currentBtn.disabled = false; currentBtn = null; }
  }
  document.querySelectorAll('.gl-play').forEach(function(btn){
    btn.addEventListener('click', function(){
      stop();
      var a = new Audio(btn.getAttribute('data-audio'));
      current = a; currentBtn = btn; btn.disabled = true;
      a.addEventListener('ended', stop, { once:true });
      a.addEventListener('error', function(){ stop(); btn.hidden = true; }, { once:true });
      var p = a.play();
      if(p && p.catch) p.catch(function(){ stop(); });
      if(typeof gtag === 'function') gtag('event', 'glosario_audio', { page: location.pathname });
    });
  });

  /* Miembros: "Practicar este tema". La pista la deja backend.js al verificar la cuenta
     (solo para mostrar; las paginas de miembros siempre verifican de verdad). */
  try{
    var hint = JSON.parse(localStorage.getItem('leo_member_hint') || 'null');
    if(hint && hint.m === 1 && Date.now() - hint.t < 7 * 86400000){
      var box = document.querySelector('.gl-tema');
      if(box){
        box.hidden = false;
        var free = document.querySelector('.article-cta');   // "practicar gratis" no aplica a miembros
        if(free) free.style.display = 'none';
        var qs = new URLSearchParams(location.search);
        if(qs.get('via') === 'rec' && qs.get('tema') === box.getAttribute('data-tema')){
          var ctx = box.querySelector('.gl-tema-context'); if(ctx) ctx.hidden = false;
        }
      }
    }
  }catch(e){}

  /* Buscador + filtros + A-Z (solo en el indice) */
  var list = document.getElementById('gl-list');
  if(!list) return;
  var input = document.getElementById('gl-q');
  var count = document.getElementById('gl-count');
  var none = document.getElementById('gl-none');
  var popular = document.querySelector('.gl-popular');
  var rows = Array.prototype.slice.call(list.querySelectorAll('.gl-row'));
  var sections = Array.prototype.slice.call(list.querySelectorAll('.gl-letter'));
  var letterLinks = Array.prototype.slice.call(document.querySelectorAll('.gl-az a'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var active = 'todo';
  var total = rows.length;

  /* La puntuacion no cambia la palabra buscada: mustn't, mustn’t y mustnt
     deben llevar a la misma entrada. Conservamos solo letras y numeros para
     que espacios, guiones y apostrofes no hagan la busqueda fragil. */
  function norm(s){
    return String(s).toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[\u2018\u2019\u02bc\uff07']/g,'')
      .replace(/[^a-z0-9]+/g,'');
  }

  function apply(){
    var q = norm(input.value.trim());
    var shown = 0;
    rows.forEach(function(r){
      var okType = active === 'todo' || (' ' + r.getAttribute('data-tipo') + ' ').indexOf(' ' + active + ' ') > -1;
      var okText = !q || r.getAttribute('data-q').indexOf(q) > -1;
      var ok = okType && okText;
      r.hidden = !ok;
      if(ok) shown++;
    });
    sections.forEach(function(s){
      var any = s.querySelector('.gl-row:not([hidden])');
      s.hidden = !any;
      var l = s.getAttribute('data-letter');
      letterLinks.forEach(function(a){ if(a.getAttribute('data-letter') === l) a.classList.toggle('off', !any); });
    });
    var filtering = !!q || active !== 'todo';
    if(popular) popular.hidden = filtering;
    none.hidden = shown !== 0;
    count.textContent = filtering ? (shown + (shown === 1 ? ' resultado' : ' resultados')) : (total + ' entradas');
  }

  input.addEventListener('input', apply);
  filters.forEach(function(b){
    b.addEventListener('click', function(){
      active = b.getAttribute('data-filter');
      filters.forEach(function(x){ var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      apply();
    });
  });
  try{
    var qs = new URLSearchParams(location.search).get('q');
    if(qs) input.value = qs;
  }catch(e){}
  apply();
})();
