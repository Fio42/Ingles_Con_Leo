/* =========================================================
   Inglés con Leo 2.0 · Experiencia 2.0 en la práctica pública (Práctica gratis y English Rush)
   La práctica gratis usa EL MISMO motor que miembros (app.js). Este archivo solo permite cargar
   las piezas de presentación de miembros (v2-kit y v2-fx: sonidos, combos, Profe Leo en el error,
   resultados) sin encender el shell del área de miembros.
   REGLAS: no cambia límites, accesos, respuestas ni guarda progreso. Rollback: ICL_V2_ENABLED de
   v2/v2-init.js no aplica aquí; para apagarlo basta con quitar estos scripts de practica.html.
   ========================================================= */
(function(){
  var d = document;
  /* Bandera mínima que piden v2-kit y v2-fx. NO activa html.v2 (el shell de miembros sigue apagado aquí). */
  window.ICL_V2 = window.ICL_V2 || { enabled: true, active: function(){ return false; } };
  window.ICL_V2_PUBLIC = true;

  /* Control de sonido visible en la práctica (abre la misma hoja de sonido y volumen que miembros) */
  function mountSound(){
    var host = d.querySelector('#practicaMain .skill-section');
    if(!host || !window.K || host.querySelector('.v2-snd-btn')) return;
    var SND = window.K.SND, A = window.K.ART;
    var b = d.createElement('button'); b.type = 'button'; b.className = 'v2-snd-btn v2-snd-free';
    var paint = function(){ b.innerHTML = window.K.px(SND.enabled ? A.UI.speaker : A.UI.soundOff); b.setAttribute('aria-label', SND.enabled ? 'Sonidos activados. Ajustar' : 'Sonidos en silencio. Ajustar'); };
    paint(); window.addEventListener('v2:sound', paint);
    b.addEventListener('click', function(){ window.K.soundSheet(); });
    host.appendChild(b);
  }
  if(d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function(){ setTimeout(mountSound, 0); });
  else setTimeout(mountSound, 0);
  window.addEventListener('load', mountSound);
})();
