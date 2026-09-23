/* ============================================================
   Inglés con Leo — Meta Pixel (Facebook/Instagram Ads)
   ------------------------------------------------------------
   Este es el código estándar que da Meta para poder medir qué
   pasa con la gente que llega desde tus anuncios de Facebook/
   Instagram (si se registra, si paga, etc.), en vez de que
   Facebook solo sepa que "hizo clic".

   Se carga en TODAS las páginas del sitio (una sola línea nueva
   en cada <head>, justo debajo de Google Analytics) para que sin
   importar en qué página aterrice alguien desde un anuncio,
   Facebook la pueda contar como visita.

   ID del Pixel: 2182739922655837 (creado el 23 sep 2026 en
   Meta Business Suite → Administrador de eventos, cuenta
   "InglesconLeo"). Si algún día hay que cambiarlo, solo se toca
   esta única línea y con eso queda actualizado en las 41 páginas
   del sitio, sin tocar nada más.

   Los eventos "estándar" que Facebook ya entiende (CompleteRegistration,
   InitiateCheckout, Purchase) se disparan automáticamente desde
   app.js/miembros.html a través de trackLeoEvent() — no hace falta
   tocar este archivo de nuevo para eso.
   ============================================================ */
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2182739922655837');
fbq('track', 'PageView');
