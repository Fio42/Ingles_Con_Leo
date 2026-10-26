/* INTERRUPTOR DE LANZAMIENTO de la Academia Inglés con Leo (comercial). Un solo valor para todo el sitio.
   PUBLIC=false: el sitio se ve y funciona como siempre (lo que anuncia la academia está oculto).
   PUBLIC=true:  la portada, miembros, navegación, bienvenida y avisos de la práctica presentan la academia.
   Prueba previa: una cuenta de prueba ve la versión de lanzamiento solo en su navegador con
   localStorage.setItem('leo_academia_canary','1') (la misma bandera que carga la parte en la nube de la academia).
   Esto solo cambia lo que se MUESTRA; el acceso a lo premium lo decide siempre el servidor. */
(function(){
  var PUBLIC = true;       // Leo/Claude lo ponen en true al lanzar, junto con CLOUD_ON en academia-boot.js
  var live = PUBLIC;
  try{ if(localStorage.getItem('leo_academia_canary') === '1') live = true; }catch(e){}
  window.ACADEMIA_LIVE = live;
  if(live) document.documentElement.className += ' ac-live';
})();
