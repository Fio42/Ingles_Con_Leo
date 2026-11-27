/* =========================================================
   Riso · componente del personaje (por capas, sin dependencias).
   Uso:
     const r = Riso.montar(contenedor, { estado: 'neutro', alto: 160, etiqueta: 'Riso' });
     r.estado('celebracion');   // neutro | bienvenida | celebracion | pensando
     r.quieto(true);            // detiene el movimiento (también respeta "reducir movimiento")
     r.destruir();
   El nombre visible sale de RISO_CONFIG.nombre (una sola constante si cambia la ortografía).
   Las llamas ondulan con un filtro SVG que solo afecta la zona de llamas (máscara por pose);
   cuerpo, mano y párpados son capas separadas animadas con CSS (ligero en el teléfono).
   ========================================================= */
(function(root){
  var CFG = root.RISO_CONFIG = root.RISO_CONFIG || {};
  if(!CFG.nombre) CFG.nombre = 'Riso';
  if(!CFG.base) CFG.base = (function(){ try{ var s = document.currentScript && document.currentScript.src; return s ? s.replace(/riso\.js(\?.*)?$/, '') : 'riso/'; }catch(e){ return 'riso/'; } })();
  var POSES = {
    neutro:   { capas: ['riso-neutro.webp'], parpados: 'riso-neutro-parpados.webp', llamas: 'riso-neutro-llamas.png' },
    saludo:   { capas: ['riso-saludo-cuerpo.webp'], mano: 'riso-saludo-mano.webp', parpados: 'riso-saludo-parpados.webp', llamas: 'riso-saludo-llamas.png' },
    guino:    { capas: ['riso-guino-cuerpo.webp'], mano: 'riso-guino-mano.webp', llamas: 'riso-guino-llamas.png' },
    pensando: { capas: ['riso-pensando.webp'], parpados: 'riso-pensando-parpados.webp', llamas: 'riso-pensando-llamas.png' }
  };
  var ESTADO_POSE = { neutro: 'neutro', bienvenida: 'saludo', celebracion: 'guino', pensando: 'pensando' };
  var n = 0;
  var reduce = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function img(src, cls){ var i = document.createElement('img'); i.src = CFG.base + 'img/' + src; i.alt = ''; i.decoding = 'async'; i.draggable = false; if(cls) i.className = cls; return i; }

  /* Filtro de llamas: ruido que sube despacio, multiplicado por la máscara de la pose.
     mapa = 0,5 + (ruido - 0,5) * máscara  ->  fuera de las llamas el desplazamiento es 0. */
  function filtro(id, mascara, w, h){
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="' + id + '" x="-5%" y="-5%" width="110%" height="110%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.028 0.055" numOctaves="2" seed="7" result="r0"><animate attributeName="baseFrequency" values="0.028 0.055;0.033 0.064;0.026 0.05;0.028 0.055" dur="3.4s" repeatCount="indefinite"/></feTurbulence>' +
      '<feColorMatrix in="r0" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" result="r"/>' +
      '<feImage href="' + CFG.base + 'img/' + mascara + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="m"/>' +
      '<feComposite in="r" in2="m" operator="arithmetic" k1="1" k2="0" k3="-0.5" k4="0.5" result="mapa"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="mapa" scale="' + (h * 0.026).toFixed(1) + '" xChannelSelector="R" yChannelSelector="G"/></filter>';
    return svg;
  }

  function burbuja(){
    var d = document.createElement('div');
    d.innerHTML = '<svg class="riso__burbuja" viewBox="0 0 120 84" aria-hidden="true"><circle cx="10" cy="76" r="6" fill="#fff" stroke="#B9A8F0" stroke-width="2.5"/>' +
      '<path d="M30 58c-12 0-18-9-14-18 2-6 8-9 14-8 2-10 12-16 22-13 6-9 20-11 28-3 9-3 20 3 21 13 9 2 14 11 10 19-3 7-10 10-17 9-3 6-11 9-18 6-6 5-16 5-22 0-6 3-15 2-19-3-2 0-4-1-5-2z" fill="#fff" stroke="#B9A8F0" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle class="p" cx="46" cy="38" r="5" fill="#6D5BD0"/><circle class="p" cx="62" cy="38" r="5" fill="#6D5BD0"/><circle class="p" cx="78" cy="38" r="5" fill="#6D5BD0"/></svg>';
    return d.firstChild;
  }

  function montar(el, opts){
    opts = opts || {};
    var alto = opts.alto || 160, ancho = Math.round(alto * 380 / 460);
    var raiz = document.createElement('div'); raiz.className = 'riso'; raiz.style.setProperty('--riso-h', alto + 'px');
    raiz.setAttribute('role', 'img'); raiz.setAttribute('aria-label', opts.etiqueta || CFG.nombre);
    var poses = {};
    Object.keys(POSES).forEach(function(p){
      var P = POSES[p], id = 'risoLlamas' + (++n);
      var pose = document.createElement('div'); pose.className = 'riso__pose'; pose.dataset.p = p;
      var cuerpo = document.createElement('div'); cuerpo.className = 'riso__cuerpo';
      var capa = document.createElement('div'); capa.className = 'riso__llamas'; capa.style.position = 'absolute'; capa.style.inset = '0';
      capa.style.setProperty('--riso-filtro', 'url(#' + id + ')');
      P.capas.forEach(function(s){ capa.appendChild(img(s)); });
      if(P.mano) capa.appendChild(img(P.mano, 'riso__mano'));
      if(P.parpados) capa.appendChild(img(P.parpados, 'riso__parpados'));
      cuerpo.appendChild(capa); pose.appendChild(cuerpo); pose.appendChild(filtro(id, P.llamas, ancho, alto));
      raiz.appendChild(pose); poses[p] = pose;
    });
    raiz.appendChild(burbuja());
    el.appendChild(raiz);
    var api = {
      el: raiz,
      estado: function(e){
        if(!ESTADO_POSE[e]) e = 'neutro';
        raiz.dataset.estado = e; var pz = ESTADO_POSE[e];
        Object.keys(poses).forEach(function(p){ poses[p].classList.toggle('is-on', p === pz); });
        // reinicia la entrada / el festejo cada vez que se pide ese estado
        var on = poses[pz]; on.style.animation = 'none'; void on.offsetWidth; on.style.animation = '';
        return api;
      },
      quieto: function(v){ raiz.classList.toggle('is-quieto', !!v); return api; },
      destruir: function(){ if(io) io.disconnect(); raiz.remove(); }
    };
    // fuera de pantalla no se anima (ahorra batería)
    var io = ('IntersectionObserver' in root) ? new IntersectionObserver(function(es){ es.forEach(function(x){ raiz.classList.toggle('is-quieto', !x.isIntersecting || reduce.matches); }); }) : null;
    if(io) io.observe(raiz);
    api.estado(opts.estado || 'neutro');
    return api;
  }
  root.Riso = { montar: montar, estados: Object.keys(ESTADO_POSE) };
})(typeof window !== 'undefined' ? window : this);
