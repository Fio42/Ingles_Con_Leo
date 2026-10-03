/* "Leo te acompaña": boton de audio real de Leo, solo si el archivo existe.
   Uso: <div class="leo-voz" data-leo-voz="bienvenida" hidden></div>
   Busca audio/leo/<id>.mp3. Si no existe (404), el bloque sigue oculto y
   la pagina funciona igual. Tambien: window.mountLeoVoz(el, id). */
(function(){
  var cache = {};
  function exists(url){
    if(!cache[url]) cache[url] = fetch(url, { method:'HEAD' }).then(function(r){
      var t = r.headers.get('content-type') || '';
      return r.ok && t.indexOf('text/html') === -1;
    }).catch(function(){ return false; });
    return cache[url];
  }
  function mount(el, id){
    if(!el || !id) return;
    var url = 'audio/leo/' + id + '.mp3';
    exists(url).then(function(ok){
      if(!ok) return;
      el.innerHTML = '<span class="leo-voz-label">Leo te acompaña</span>' +
        '<button type="button" class="leo-voz-btn"><span aria-hidden="true">▶</span> Escuchar a Leo</button>';
      el.hidden = false;
      var audio = null, btn = el.querySelector('button');
      btn.addEventListener('click', function(){
        if(!audio){
          audio = new Audio(url);
          audio.addEventListener('ended', function(){ btn.firstChild.textContent = '▶'; });
        }
        if(audio.paused){ audio.play(); btn.firstChild.textContent = '❚❚'; }
        else { audio.pause(); btn.firstChild.textContent = '▶'; }
      });
    });
  }
  window.mountLeoVoz = mount;
  function init(){
    var els = document.querySelectorAll('[data-leo-voz]');
    for(var i = 0; i < els.length; i++) mount(els[i], els[i].getAttribute('data-leo-voz'));
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
