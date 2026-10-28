/* Interruptor de la parte "en la nube" de la academia. APAGADO por defecto.
   Mientras CLOUD_ON sea false (o la migracion de Supabase no este aplicada), la pagina no carga Supabase ni backend.js y
   funciona como el piloto: avance solo en este navegador. Para probar en un equipo local: localhost + ?nube=1.
   Se carga ANTES de academia-audio.js / academia-data.js / academia.js (document.write mantiene el orden). */
(function(){
  var CLOUD_ON = true;    // Leo/Claude lo ponen en true al lanzar, junto con ACADEMIA_MOTOR.enabled y academia_courses.enabled
  var local = false;
  try{ local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && /[?&]nube=1(&|$)/.test(location.search); }catch(e){}
  /* Prueba previa al lanzamiento: una cuenta de prueba activa la parte en la nube SOLO en su navegador
     (localStorage.leo_academia_canary = '1'). El servidor sigue decidiendo todo; esto solo carga el cliente. */
  var canary = false;
  try{ canary = localStorage.getItem('leo_academia_canary') === '1'; }catch(e){}
  if(!CLOUD_ON && !local && !canary) return;
  window.ACADEMIA_CLOUD = true;
  var v = '?v=20261028f';
  document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"><\/script>');
  document.write('<script src="backend.js' + v + '"><\/script>');
  document.write('<script src="academia-motor.js' + v + '"><\/script>');
  document.write('<script src="academia-nube.js' + v + '"><\/script>');
})();
