/* Video -> explicacion -> ejercicios. Une los videos cortos de Leo con su tema.
   Un solo mapa (VIDEOS) alimenta dos lugares, sin tocar el motor de practica ni los limites:
   1) practica.html?tema=<id>: una tarjeta compacta "Mira el video de este tema" (el video solo carga si la persona lo toca).
   2) articulos.html (galeria "Aprende tambien en video"): cada tarjeta suma "Practicar gratis" y "Ver la explicacion" dentro del sitio.
   Regla de honestidad: solo se enlaza lo que existe. "Practicar gratis" solo aparece en temas con ejercicios gratis (tema + free:true).
   Para agregar un video: una linea mas en VIDEOS (id de YouTube, titulo y, si existen, tema / guia / ficha del glosario). */
(function(){
  'use strict';
  var VIDEOS = [
    { id:'qYfRn_KUcyE', title:'In, On y At',        tema:'in-on-at',           free:true, guide:'articulo-in-on-at.html' },
    { id:'VjH45nwgf38', title:'Then vs Than',       tema:'then-vs-than',       free:true, ficha:'then-vs-than' },
    { id:'Wv4rEL4wYnE', title:'A vs An',            tema:'a-an',               free:true, guide:'articulo-articulos-a-an-the.html', ficha:'a-vs-an' },
    { id:'HBq0uVtB4VA', title:'am, is, are',        tema:'to-be-presente',     free:true, guide:'articulo-verbo-to-be.html' },
    { id:'JPq1KBBsbtI', title:'Quiet vs Quite',     tema:'palabras-parecidas', free:true, ficha:'advice-lay-further-quiet' },
    { id:'xaA3y6ipUNE', title:'Advice vs Advise',   tema:'palabras-parecidas', free:true, ficha:'advice-vs-advise' },
    { id:'gf9T2K-zWcQ', title:'To vs Too',          tema:'to-too-two',                     ficha:'to-vs-too-vs-two' },
    { id:'fhbmGfsFAwY', title:'Remember vs Remind',                                        ficha:'remember-vs-remind' },
    { id:'E2IFaTqUsT0', title:'Rise vs Raise',                                             ficha:'raise-vs-rise' },
    { id:'IyPbbyuz1ho', title:'Wrote vs Written',                                          guide:'articulo-verbos-irregulares.html' }
  ];
  var BY_ID = {}; VIDEOS.forEach(function(v){ BY_ID[v.id] = v; });

  function track(name, v, place){
    var p = { video_id: v.id, tema: v.tema || '', placement: place };
    try{ if(typeof trackLeoEvent === 'function') trackLeoEvent(name, p); else if(typeof gtag === 'function') gtag('event', name, p); }catch(e){}
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function explainHref(v){ return v.guide || (v.ficha ? 'glosario/' + v.ficha + '/' : ''); }
  function practiceHref(v){ return v.tema && v.free ? 'practica.html?skill=grammar&tema=' + encodeURIComponent(v.tema) : ''; }

  var css = document.createElement('style');
  css.textContent =
    '.vt-card{margin:14px 0 0;padding:12px;border:1px solid var(--line,#E7E2D6);border-radius:14px;background:var(--paper-dim,#faf7f0);}' +
    '.vt-row+.vt-row{margin-top:12px;padding-top:12px;border-top:1px solid var(--line,#E7E2D6);}' +
    '.vt-head{display:flex;gap:12px;align-items:center;}' +
    '.vt-thumb{position:relative;flex:0 0 64px;width:64px;height:64px;border:0;padding:0;border-radius:10px;overflow:hidden;background:#000;cursor:pointer;}' +
    '.vt-thumb img{width:100%;height:100%;object-fit:cover;display:block;opacity:.85;}' +
    '.vt-thumb span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;text-shadow:0 1px 4px rgba(0,0,0,.6);}' +
    '.vt-txt{min-width:0;flex:1;}' +
    '.vt-txt b{display:block;font-size:.98rem;line-height:1.3;}' +
    '.vt-txt small{display:block;color:var(--ink-soft,#5B6472);font-size:.85rem;line-height:1.35;margin-top:2px;}' +
    '.vt-play{max-width:300px;margin:12px auto 0;aspect-ratio:9/16;border-radius:14px;overflow:hidden;background:#000;}' +
    '.vt-play iframe{width:100%;height:100%;border:0;display:block;}' +
    '.vt-links{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:10px;font-size:.92rem;}' +
    '.vt-links a{color:var(--blue,#3554F0);font-weight:600;text-decoration:underline;}' +
    '.vt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}' +
    '.vt-actions .btn{max-width:100%;white-space:normal;text-align:center;padding:9px 14px;font-size:.9rem;}';
  document.head.appendChild(css);

  /* Carga el reproductor solo al tocar (la pagina de practica no paga el peso del video si nadie lo ve). */
  function play(box, v, place){
    if(box.dataset.on) return; box.dataset.on = '1';
    var w = document.createElement('div'); w.className = 'vt-play';
    w.innerHTML = '<iframe src="https://www.youtube.com/embed/' + v.id + '?rel=0&autoplay=1" title="' + esc(v.title) + '" allow="autoplay; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    box.appendChild(w); track('video_tema_play', v, place);
  }
  function rowHtml(v){
    var ex = explainHref(v);
    return '<div class="vt-row" data-vt="' + v.id + '"><div class="vt-head">' +
      '<button type="button" class="vt-thumb" aria-label="Ver el video: ' + esc(v.title) + '"><img loading="lazy" alt="" src="https://img.youtube.com/vi/' + v.id + '/hqdefault.jpg"><span>▶</span></button>' +
      '<div class="vt-txt"><b>' + esc(v.title) + '</b><small>Video de 1 minuto con ejemplos</small></div></div>' +
      (ex ? '<div class="vt-links"><a data-vt-ex href="' + ex + '">Leer la explicación</a></div>' : '') + '</div>';
  }

  /* 1) Practica gratis con ?tema= */
  function initPractice(){
    var q; try{ q = new URLSearchParams(window.location.search); }catch(e){ return; }
    var tema = q.get('tema'), skill = q.get('skill');
    if(!tema || (skill && skill !== 'grammar')) return;
    var list = VIDEOS.filter(function(v){ return v.tema === tema; }).slice(0, 2);
    var anchor = document.querySelector('.skill-section');
    if(!list.length || !anchor || document.querySelector('.vt-card')) return;
    var card = document.createElement('div'); card.className = 'vt-card';
    card.innerHTML = '<div style="font-size:.8rem;font-weight:700;color:var(--ink-soft,#5B6472);margin-bottom:8px;">Antes de practicar, si quieres</div>' + list.map(rowHtml).join('');
    anchor.parentNode.insertBefore(card, anchor);
    list.forEach(function(v){
      var row = card.querySelector('[data-vt="' + v.id + '"]');
      row.querySelector('.vt-thumb').addEventListener('click', function(){ play(row, v, 'practica'); });
      var ex = row.querySelector('[data-vt-ex]'); if(ex) ex.addEventListener('click', function(){ track('video_tema_explicacion_click', v, 'practica'); });
    });
    track('video_tema_shown', list[0], 'practica');
  }

  /* 2) Galeria de articulos.html: botones internos en cada tarjeta, junto a los de las redes */
  function initGallery(){
    var cards = document.querySelectorAll('[data-video-featured],[data-video-card]');
    if(!cards.length) return;
    cards.forEach(function(card){
      var inner = card.querySelector('[data-youtube-url]');
      var url = card.getAttribute('data-youtube-url') || (inner ? inner.getAttribute('data-youtube-url') : '') || '';
      var m = /shorts\/([\w-]{11})/.exec(url); var v = m && BY_ID[m[1]];
      if(!v || card.querySelector('.vt-actions')) return;
      var ex = explainHref(v), pr = practiceHref(v);
      if(!ex && !pr) return;
      var box = document.createElement('div'); box.className = 'vt-actions';
      if(pr) box.innerHTML += '<a class="btn btn-primary" data-vt-pr href="' + pr + '">Practicar gratis</a>';
      if(ex) box.innerHTML += '<a class="btn btn-ghost" data-vt-ex href="' + ex + '">Ver la explicación</a>';
      var row = card.querySelector('.video-platform-row');
      (row && row.parentNode ? row.parentNode : card).insertBefore(box, row || null);
      var a = box.querySelector('[data-vt-pr]'); if(a) a.addEventListener('click', function(){ track('video_tema_practicar_click', v, 'galeria'); });
      a = box.querySelector('[data-vt-ex]'); if(a) a.addEventListener('click', function(){ track('video_tema_explicacion_click', v, 'galeria'); });
    });
  }

  function start(){ try{ initPractice(); initGallery(); }catch(e){} }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.LEO_VIDEO_TEMAS = VIDEOS;
})();
