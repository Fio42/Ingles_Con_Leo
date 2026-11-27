/* =========================================================
   Inglés con Leo 2.0 · Bloque C · Identidad visual: familia de iconos propia y llama de la racha
   - Una sola gramática visual: rejilla de 32, trazo redondo de 2.2, relleno suave (duotono) con el mismo color.
     El color lo pone quien lo usa (currentColor): dentro de una baldosa teñida se ve en dos tonos del mismo color.
   - NAV_ICO: los 5 iconos de la barra (siguen funcionando en dos estados: línea / relleno activo).
   - I4: iconos de función (habilidades, Método Leo, reto, plan, logros, meta, sonido, ajustes...).
   - flame(estado): la llama con 4 estados (activa, pendiente hoy, en cero, nuevo día). Solo dibuja: las reglas
     de la racha siguen en app.js (computeStreak) y no cambian.
   Se carga justo después de v3-art.js y amplía window.K_ART (mismo objeto que usa v2-kit.js como K.ART).
   ========================================================= */
(function(){
  var A = window.K_ART; if(!A) return;
  var G = function(fill, line){ return '<svg class="ico v2-i4" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (fill ? '<g class="v2-i4f" fill="currentColor" stroke="none">' + fill + '</g>' : '') + line + '</svg>'; };

  var I4 = {
    /* navegación (formas grandes y reconocibles) */
    inicio: G('<path d="M6.5 14.8 16 7l9.5 7.8V25a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2Z"/>', '<path d="M4.5 15.5 16 6l11.5 9.5"/><path d="M7 14v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V14"/><path d="M13 27v-5.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V27"/>'),
    academia: G('<path d="M3.5 12.5 16 6.5l12.5 6-12.5 6z"/>', '<path d="M3.5 12.5 16 6.5l12.5 6-12.5 6z"/><path d="M8.5 15.5v5.2c0 1.9 3.4 3.8 7.5 3.8s7.5-1.9 7.5-3.8v-5.2"/><path d="M28.5 12.5v7"/>'),
    practicar: G('<path d="M21 5.6a2.2 2.2 0 0 1 3.1 0l2.3 2.3a2.2 2.2 0 0 1 0 3.1L13 24.4l-6.2 1.5 1.5-6.2z"/>', '<path d="M21 5.6a2.2 2.2 0 0 1 3.1 0l2.3 2.3a2.2 2.2 0 0 1 0 3.1L13 24.4l-6.2 1.5 1.5-6.2z"/><path d="m18.6 8 5.4 5.4"/><path d="M5 28h9"/>'),
    progreso: G('<rect x="5" y="17" width="5.5" height="10" rx="1.8"/><rect x="13.25" y="11.5" width="5.5" height="15.5" rx="1.8"/><rect x="21.5" y="6" width="5.5" height="21" rx="1.8"/>', '<rect x="5" y="17" width="5.5" height="10" rx="1.8"/><rect x="13.25" y="11.5" width="5.5" height="15.5" rx="1.8"/><rect x="21.5" y="6" width="5.5" height="21" rx="1.8"/>'),
    perfil: G('<circle cx="16" cy="11" r="5.5"/>', '<circle cx="16" cy="11" r="5.5"/><path d="M5.5 27c1.4-5 5.4-7.5 10.5-7.5s9.1 2.5 10.5 7.5"/>'),
    /* habilidades */
    grammar: G('<rect x="3.5" y="6" width="25" height="20" rx="5"/>', '<path d="m6.5 22.5 5-13h1l5 13"/><path d="M8.3 18h7.4"/><path d="M25.5 14.5v8"/><path d="M25.5 18.6c0 2.3-1.4 3.9-3.2 3.9s-3.1-1.6-3.1-3.9 1.4-4 3.1-4 3.2 1.6 3.2 4"/>'),
    vocab: G('<rect x="4" y="6.5" width="24" height="19" rx="4"/>', '<rect x="4" y="6.5" width="24" height="19" rx="4"/><path d="M9 13h9M9 18.5h14"/><path d="M22.5 6.5v6l1.7-1.3 1.8 1.3v-6"/>'),
    listen: G('<rect x="4.5" y="17" width="5.5" height="9" rx="2.4"/><rect x="22" y="17" width="5.5" height="9" rx="2.4"/>', '<path d="M5.5 20v-3.5a10.5 10.5 0 0 1 21 0V20"/><rect x="4.5" y="17" width="5.5" height="9" rx="2.4"/><rect x="22" y="17" width="5.5" height="9" rx="2.4"/>'),
    speak: G('<rect x="11.5" y="4" width="9" height="15" rx="4.5"/>', '<rect x="11.5" y="4" width="9" height="15" rx="4.5"/><path d="M7.5 14.5a8.5 8.5 0 0 0 17 0"/><path d="M16 23v4.5M12 27.5h8"/>'),
    write: G('<path d="M20.4 6.2a2.4 2.4 0 0 1 3.4 3.4L11.5 21.9l-4.6 1.2 1.2-4.6z"/>', '<path d="M20.4 6.2a2.4 2.4 0 0 1 3.4 3.4L11.5 21.9l-4.6 1.2 1.2-4.6z"/><path d="M5 27.5h22"/>'),
    read: G('<path d="M16 9.5c-3-2.3-7-2.8-11-1.8v16.6c4-1 8-.5 11 1.8 3-2.3 7-2.8 11-1.8V7.7c-4-1-8-.5-11 1.8z"/>', '<path d="M16 9.5c-3-2.3-7-2.8-11-1.8v16.6c4-1 8-.5 11 1.8 3-2.3 7-2.8 11-1.8V7.7c-4-1-8-.5-11 1.8z"/><path d="M16 9.5v16.6"/>'),
    mix: G('<rect x="4.5" y="4.5" width="10" height="10" rx="3"/><rect x="17.5" y="17.5" width="10" height="10" rx="3"/>', '<rect x="4.5" y="4.5" width="10" height="10" rx="3"/><rect x="17.5" y="4.5" width="10" height="10" rx="3"/><rect x="4.5" y="17.5" width="10" height="10" rx="3"/><rect x="17.5" y="17.5" width="10" height="10" rx="3"/>'),
    /* sistema */
    mend: G('<circle cx="16" cy="16" r="10"/>', '<path d="M26 16a10 10 0 1 1-3.2-7.3"/><path d="M24.5 4.5v5h-5"/><path d="m11.5 16.5 3.3 3.3 6.2-6.6"/>'),
    reto: G('<rect x="4.5" y="7" width="23" height="20.5" rx="4"/>', '<rect x="4.5" y="7" width="23" height="20.5" rx="4"/><path d="M4.5 12.5h23M10.5 4.5v5M21.5 4.5v5"/><path d="m17.2 15.2-3.7 5h3.6l-1 4.3 4.3-5.6h-3.6z" fill="currentColor"/>'),
    plan: G('<rect x="6.5" y="6" width="19" height="22" rx="3.5"/>', '<rect x="6.5" y="6" width="19" height="22" rx="3.5"/><rect x="12" y="3.5" width="8" height="5" rx="2"/><path d="m10.8 15.5 1.8 1.8 3.2-3.3M10.8 22.5l1.8 1.8 3.2-3.3M19 16h2.5M19 23h2.5"/>'),
    goal: G('<circle cx="16" cy="16" r="11"/>', '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="1.6" fill="currentColor"/>'),
    time: G('<circle cx="16" cy="16.5" r="11"/>', '<circle cx="16" cy="16.5" r="11"/><path d="M16 10.5v6l4 2.5"/>'),
    trophy: G('<path d="M10 5.5h12v7.5a6 6 0 0 1-12 0z"/>', '<path d="M10 5.5h12v7.5a6 6 0 0 1-12 0z"/><path d="M10 8.5H6.5a3.5 3.5 0 0 0 4 4.6M22 8.5h3.5a3.5 3.5 0 0 1-4 4.6"/><path d="M16 19v4M11 27.5h10M12.5 27.5c0-2.5 1.5-4.5 3.5-4.5s3.5 2 3.5 4.5"/>'),
    lesson: null,
    rush: G('<circle cx="16" cy="16" r="11.5"/>', '<circle cx="16" cy="16" r="11.5"/><path d="m17.5 8.5-6 9h5l-1.5 6.5 6.5-9h-5z" fill="currentColor"/>'),
    clases: G('<path d="M4.5 8.5a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6l-5 4v-4a3 3 0 0 1-3-3z"/>', '<path d="M4.5 8.5a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6l-5 4v-4a3 3 0 0 1-3-3z"/><path d="M24.5 12.5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3v3.5l-4.5-3.5h-3.5"/>'),
    bulb: G('<path d="M16 4.5a8 8 0 0 0-4.8 14.4c.8.6 1.3 1.6 1.3 2.6V23h7v-1.5c0-1 .5-2 1.3-2.6A8 8 0 0 0 16 4.5z"/>', '<path d="M16 4.5a8 8 0 0 0-4.8 14.4c.8.6 1.3 1.6 1.3 2.6V23h7v-1.5c0-1 .5-2 1.3-2.6A8 8 0 0 0 16 4.5z"/><path d="M13 27.5h6"/>'),
    exam: G('<circle cx="16" cy="12.5" r="7.5"/>', '<circle cx="16" cy="12.5" r="7.5"/><path d="m11.5 18.5-2 9 6.5-3 6.5 3-2-9"/><path d="m13 12.5 2 2 4-4"/>'),
    level: G('<rect x="5" y="19" width="6" height="8" rx="1.8"/>', '<rect x="5" y="19" width="6" height="8" rx="1.8"/><rect x="13" y="13" width="6" height="14" rx="1.8"/><rect x="21" y="6" width="6" height="21" rx="1.8"/>'),
    sound: G('<path d="M5 12.5h4.5L16 7v18l-6.5-5.5H5z"/>', '<path d="M5 12.5h4.5L16 7v18l-6.5-5.5H5z"/><path d="M20.5 12c1.5 2.2 1.5 5.8 0 8M24.5 8.5c3.3 4 3.3 11 0 15"/>'),
    soundOff: G('<path d="M5 12.5h4.5L16 7v18l-6.5-5.5H5z"/>', '<path d="M5 12.5h4.5L16 7v18l-6.5-5.5H5z"/><path d="m20.5 12.5 7 7M27.5 12.5l-7 7"/>'),
    gear: G('<circle cx="16" cy="16" r="9"/>', '<path d="M13.6 4.5h4.8l.7 3.2 2.3 1.3 3.1-1 2.4 4.2-2.4 2.2v2.6l2.4 2.2-2.4 4.2-3.1-1-2.3 1.3-.7 3.2h-4.8l-.7-3.2-2.3-1.3-3.1 1-2.4-4.2 2.4-2.2v-2.6L5.1 12.2l2.4-4.2 3.1 1 2.3-1.3z"/><circle cx="16" cy="16" r="3.8"/>'),
    help: G('<circle cx="16" cy="16" r="11.5"/>', '<circle cx="16" cy="16" r="11.5"/><path d="M12.6 12.6a3.5 3.5 0 0 1 6.8 1.1c0 2.3-3.4 2.9-3.4 5"/><path d="M16 22.6h.01" stroke-width="3"/>'),
    ai: G('<path d="M16 4c.9 5.5 3.5 8.1 9 9-5.5.9-8.1 3.5-9 9-.9-5.5-3.5-8.1-9-9 5.5-.9 8.1-3.5 9-9z"/>', '<path d="M16 4c.9 5.5 3.5 8.1 9 9-5.5.9-8.1 3.5-9 9-.9-5.5-3.5-8.1-9-9 5.5-.9 8.1-3.5 9-9z"/><path d="M25 21.5c.4 2.1 1.4 3.1 3.5 3.5-2.1.4-3.1 1.4-3.5 3.5-.4-2.1-1.4-3.1-3.5-3.5 2.1-.4 3.1-1.4 3.5-3.5z"/>'),
    badge: G('<path d="M16 3.5 26 9.2v11.6L16 26.5 6 20.8V9.2z"/>', '<path d="M16 3.5 26 9.2v11.6L16 26.5 6 20.8V9.2z"/><path d="m11.5 15.2 3.2 3.2 6-6.4"/>')
  };
  I4.lesson = I4.academia;

  /* ---- Barra de navegación: mismas formas, en dos estados (la hoja de estilos de la barra rellena el activo) ---- */
  var N = function(body, detail){ return '<svg class="ico nav-ico v2-i4nav" viewBox="0 0 32 32" aria-hidden="true"><g class="nav-ico__body" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round">' + body + '</g><g class="nav-ico__detail" fill="none" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + (detail || '') + '</g></svg>'; };
  var NAV = {
    inicio: N('<path d="M6.5 14.8 16 7l9.5 7.8V25a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2Z"/>', '<path d="M13 27v-5.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V27"/>'),
    academia: N('<path d="M3.5 12.5 16 6.5l12.5 6-12.5 6z"/><path d="M8.5 15.5v5.2c0 1.9 3.4 3.8 7.5 3.8s7.5-1.9 7.5-3.8v-5.2"/>', '<path d="M28.5 12.5v7"/>'),
    practicar: N('<path d="M21 5.6a2.2 2.2 0 0 1 3.1 0l2.3 2.3a2.2 2.2 0 0 1 0 3.1L13 24.4l-6.2 1.5 1.5-6.2z"/>', '<path d="m18.6 8 5.4 5.4"/>'),
    progreso: N('<rect x="5" y="17" width="5.5" height="10" rx="1.8"/><rect x="13.25" y="11.5" width="5.5" height="15.5" rx="1.8"/><rect x="21.5" y="6" width="5.5" height="21" rx="1.8"/>', ''),
    perfil: N('<circle cx="16" cy="11" r="5.5"/><path d="M5.5 27c1.4-5 5.4-7.5 10.5-7.5s9.1 2.5 10.5 7.5z"/>', '')
  };
  Object.keys(NAV).forEach(function(k){ A.NAV_ICO[k] = NAV[k]; });

  /* ---- La llama ----
     estados: 'on' (practicó hoy: viva), 'pending' (tiene racha y aún no practica hoy: tenue, respira),
              'off' (racha en cero: apagada), 'new' (acaba de sumar el día: se enciende una vez). */
  function flame(state){
    state = state || 'on';
    return '<svg class="ico v2-flame v2-fl--' + state + '" viewBox="7 2 34 40" aria-hidden="true">' +
      '<ellipse class="v2-fl-glow" cx="24" cy="29" rx="12" ry="11"/>' +
      '<g class="v2-fl-body">' +
        '<path class="v2-fl-outer" d="M24 4.5c1.6 6.4 9.5 10.2 11.6 17.4 2.2 7.7-2.3 17.6-11.6 17.6S10.2 31.7 12.4 24c1-3.6 3.4-6 5.8-8.1.2 3.3 1.2 5.4 3.2 6.6-.6-6.8 0-12.6 2.6-18z"/>' +
        '<path class="v2-fl-mid" d="M24.4 19c2.6 4 7 6.6 6.9 12.4-.1 4.4-3.3 7.6-7.3 7.6s-7.3-3.2-7.2-7.4c.1-3.3 2.2-5.4 4-7 .5 2 1.4 3.2 2.6 3.8-.4-3.8.1-6.8 1-9.4z"/>' +
        '<path class="v2-fl-core" d="M24 28.5c1.7 1.8 3.4 3.2 3.3 5.9a3.3 3.3 0 0 1-6.6 0c0-2.3 1.7-3.8 3.3-5.9z"/>' +
        '<path class="v2-fl-shine" d="M19.2 26.5c-.9 1.8-1.1 3.6-.6 5.3"/>' +
      '</g>' +
      /* Pendiente hoy: un reloj pequeño dice "aún estás a tiempo" (la racha no se perdió) */
      '<g class="v2-fl-clock"><circle cx="34.5" cy="34.5" r="6.2"/><path d="M34.5 31.6v3.1l2.1 1.4"/></g>' +
      '<g class="v2-fl-sparks"><circle cx="15" cy="20" r="1.6"/><circle cx="33" cy="17" r="1.3"/><circle cx="29" cy="9" r="1.1"/><circle cx="18" cy="11" r="1"/></g>' +
      '</svg>';
  }
  /* El brillo del botón principal cruza UNA vez por página: se da por visto cuando termina (si la pantalla se
     redibuja antes de terminar, vuelve a intentarlo; después ya no) */
  document.addEventListener('animationend', function(e){ if(e.animationName === 'v2-shine-once') window.__v2Shone = 1; }, true);
  A.I4 = I4;
  A.flame = flame;
  /* Los dibujos existentes de la llama pasan a la nueva (misma llamada, nuevo arte) */
  A.STK.flame = flame('on');
  A.STK.flameOff = flame('off');
})();
