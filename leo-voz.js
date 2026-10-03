/* "Profe Leo te acompaña": audio real del Profe Leo, siempre con un toque del alumno (nunca autoplay).
   Uso: <div class="leo-voz" data-leo-voz="bienvenida" hidden></div>
   Busca audio/leo/<id>.mp3. Si no existe, el bloque sigue oculto y la pagina funciona igual.
   - Solo suena un audio de Leo a la vez (al empezar uno se detiene el anterior).
   - Volumen propio de estos audios (no toca el volumen del navegador), guardado en localStorage.
   - data-leo-voz-avatar="none" oculta el avatar (p. ej. donde ya sale la foto de Leo).
   data-leo-voz-label cambia el titulo; la clase is-compact da la version de una fila (hero). */
(function(){
  var DEFAULT_VOL = 0.7;          // volumen inicial si el alumno nunca lo toco
  var KEY = 'leo_voz_vol';
  var existsCache = {};
  var current = null;             // { audio, el }
  var instances = [];             // para sincronizar sliders

  function loadPref(){
    try{
      var p = JSON.parse(localStorage.getItem(KEY));
      if(p && typeof p.v === 'number') return { v: Math.min(1, Math.max(0, p.v)), m: !!p.m };
    }catch(e){}
    return { v: DEFAULT_VOL, m: false };
  }
  function savePref(){ try{ localStorage.setItem(KEY, JSON.stringify(pref)); }catch(e){} }
  var pref = loadPref();

  function exists(url){
    if(!existsCache[url]) existsCache[url] = fetch(url, { method:'HEAD' }).then(function(r){
      var t = r.headers.get('content-type') || '';
      return r.ok && t.indexOf('text/html') === -1;
    }).catch(function(){ return false; });
    return existsCache[url];
  }

  function applyVolume(audio){ audio.volume = pref.m ? 0 : pref.v; audio.muted = pref.m; }
  function syncAll(){
    instances.forEach(function(i){
      i.range.value = pref.m ? 0 : Math.round(pref.v * 100);
      i.mute.setAttribute('aria-pressed', pref.m ? 'true' : 'false');
      i.mute.setAttribute('aria-label', pref.m ? 'Activar sonido' : 'Silenciar');
      i.mute.innerHTML = pref.m || pref.v === 0 ? ICON_OFF : ICON_ON;
      if(i.audio) applyVolume(i.audio);
    });
  }

  var ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 010 6M17.8 6.5a7.5 7.5 0 010 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function setState(inst, playing){
    inst.el.classList.toggle('is-speaking', playing);
    inst.btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    inst.btnIcon.textContent = playing ? '❚❚' : '▶';
    inst.btnText.textContent = playing ? 'Pausar' : 'Escuchar al Profe Leo';
  }
  function stopCurrent(){
    if(!current) return;
    var c = current; current = null;
    try{ c.audio.pause(); c.audio.currentTime = 0; }catch(e){}
    setState(c.inst, false);
  }

  function mount(el, id){
    if(!el || el.getAttribute('data-leo-voz-mounted')) return;
    id = id || el.getAttribute('data-leo-voz');
    if(!id) return;
    el.setAttribute('data-leo-voz-mounted', '1');
    var url = 'audio/leo/' + id + '.mp3';
    exists(url).then(function(ok){
      if(!ok) return;
      var noAvatar = el.getAttribute('data-leo-voz-avatar') === 'none';
      el.innerHTML =
        (noAvatar ? '' : '<span class="leo-voz-avatar" aria-hidden="true"><img src="leo-front.png" alt="" width="40" height="74" loading="lazy" decoding="async"></span>') +
        '<span class="leo-voz-body">' +
          '<span class="leo-voz-label"></span>' +
          '<span class="leo-voz-row">' +
            '<button type="button" class="leo-voz-btn" aria-pressed="false"><span class="leo-voz-btn-icon" aria-hidden="true">▶</span> <span class="leo-voz-btn-text">Escuchar al Profe Leo</span></button>' +
            '<span class="leo-voz-vol">' +
              '<button type="button" class="leo-voz-mute" aria-pressed="false" aria-label="Silenciar"></button>' +
              '<input type="range" class="leo-voz-range" min="0" max="100" step="5" aria-label="Volumen del Profe Leo">' +
            '</span>' +
          '</span>' +
        '</span>';
      el.querySelector('.leo-voz-label').textContent = el.getAttribute('data-leo-voz-label') || 'Profe Leo te acompaña';
      el.hidden = false;
      var inst = {
        el: el, audio: null,
        btn: el.querySelector('.leo-voz-btn'),
        btnIcon: el.querySelector('.leo-voz-btn-icon'),
        btnText: el.querySelector('.leo-voz-btn-text'),
        mute: el.querySelector('.leo-voz-mute'),
        range: el.querySelector('.leo-voz-range')
      };
      instances.push(inst);
      syncAll();

      inst.btn.addEventListener('click', function(){
        if(inst.audio && !inst.audio.paused){ inst.audio.pause(); setState(inst, false); return; }
        if(current && current.inst !== inst) stopCurrent();
        if(!inst.audio){
          inst.audio = new Audio(url);
          inst.audio.preload = 'auto';
          inst.audio.addEventListener('ended', function(){ if(current && current.inst === inst) current = null; setState(inst, false); });
          inst.audio.addEventListener('error', function(){ if(current && current.inst === inst) current = null; el.hidden = true; });
        }
        applyVolume(inst.audio);
        current = { audio: inst.audio, inst: inst };
        var pr = inst.audio.play();
        setState(inst, true);
        if(pr && pr.catch) pr.catch(function(){ if(current && current.inst === inst) current = null; setState(inst, false); });
        try{ if(typeof trackLeoEvent === 'function') trackLeoEvent('leo_voz_played', { id: id }); }catch(e){}
      });
      inst.mute.addEventListener('click', function(){
        if(pref.m || pref.v === 0){ pref.m = false; if(pref.v === 0) pref.v = DEFAULT_VOL; }
        else pref.m = true;
        savePref(); syncAll();
      });
      inst.range.addEventListener('input', function(){
        pref.v = Number(inst.range.value) / 100;
        pref.m = pref.v === 0;
        savePref(); syncAll();
      });
    });
  }

  window.mountLeoVoz = mount;
  window.stopLeoVoz = stopCurrent;
  window.__leoVozState = function(){ return { pref: pref, playing: !!current }; };
  function init(){
    var els = document.querySelectorAll('[data-leo-voz]:not([data-leo-voz-mounted])');
    for(var i = 0; i < els.length; i++) mount(els[i]);
  }
  addEventListener('pagehide', stopCurrent);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
