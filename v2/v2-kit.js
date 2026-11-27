/* =========================================================
   Inglés con Leo 2.0 · Kit visual (bloque 2)
   Piezas del prototipo v3 (hojas, modales, avisos, confeti, anillos,
   gráficas, puntos del Método Leo) adaptadas al sitio real.
   Todo el HTML pasa por K.h(): cada clase "x" se escribe "k-x" para que
   el CSS del prototipo (v3-ui.css) nunca choque con style.css.
   Solo presentación: no guarda datos de aprendizaje ni llama a Supabase.
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled) return;
  var A = window.K_ART || {}, SND = window.K_SOUND || { play: function(){}, haptic: function(){}, enabled: false, set: function(){} };
  var reduced = function(){ return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); };
  /* class="a b" -> class="k-a k-b" (salvo las que ya empiezan con k- o v2-) */
  var pfx = function(html){
    return html.replace(/class="([^"]*)"/g, function(_, c){
      return 'class="' + c.split(/\s+/).filter(Boolean).map(function(x){ return /^(k-|v2-)/.test(x) ? x : 'k-' + x; }).join(' ') + '"';
    });
  };
  function h(html){ var t = document.createElement('template'); t.innerHTML = pfx(String(html).trim()); return t.content.firstElementChild; }
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var fmt = function(n){ return Math.round(n).toLocaleString('es-CO'); };

  /* Portal para hojas, modales y avisos (fuera del contenido, dentro del alcance visual) */
  var portal = null;
  function root(){
    if(portal && portal.isConnected) return portal;
    portal = document.createElement('div'); portal.className = 'k-scope k-portal';
    portal.innerHTML = '<div class="k-toast-root" aria-live="polite"></div><div class="k-modal-root"></div>';
    document.body.appendChild(portal); return portal;
  }

  function countTo(el, from, to, dur){
    if(!el) return; dur = dur || 700;
    if(reduced() || from === to){ el.textContent = fmt(to); return; }
    var t0 = performance.now();
    (function step(t){ var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if(k < 1) requestAnimationFrame(step); })(t0);
  }
  function bump(el){ if(!el) return; el.classList.remove('k-is-bump'); void el.offsetWidth; el.classList.add('k-is-bump'); }
  function toast(icon, title, sub, ms){
    var art = icon && icon.charAt(0) === '<' ? icon : ((A.STK || {})[icon] || '');
    var t = h('<div class="toast" role="status">' + art + '<div>' + esc(title) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div></div>');
    $('.k-toast-root', root()).appendChild(t);
    setTimeout(function(){ t.classList.add('k-is-out'); setTimeout(function(){ t.remove(); }, 300); }, ms || 2600);
  }
  function sheet(o){
    var prev = document.activeElement, closed = false;
    var sc = h('<div class="scrim" role="dialog" aria-modal="true" aria-label="' + esc(o.label || '') + '"><div class="modal ' + (o.cls || '') + '"><div class="modal__grab"></div><button type="button" class="icon-btn modal__x" aria-label="Cerrar">' + (A.UI ? A.UI.close : '×') + '</button>' + (o.html || '') + '</div></div>');
    var box = $('.k-modal', sc);
    function close(silent){
      if(closed) return; closed = true;
      sc.classList.remove('k-is-open'); document.removeEventListener('keydown', onKey);
      setTimeout(function(){ sc.remove(); if(!$('.k-scrim')) document.body.classList.remove('k-is-locked'); if(prev && prev.focus) prev.focus({ preventScroll: true }); }, 240);
      if(!silent && o.onClose) o.onClose();
    }
    function onKey(e){ if(e.key === 'Escape') close(); }
    sc.addEventListener('click', function(e){ if(e.target === sc || e.target.closest('.k-modal__x')){ SND.play('tap'); close(); } });
    document.addEventListener('keydown', onKey);
    $('.k-modal-root', root()).appendChild(sc); document.body.classList.add('k-is-locked');
    requestAnimationFrame(function(){ sc.classList.add('k-is-open'); var f = $('.k-modal .k-btn, .k-modal a, .k-modal button:not(.k-modal__x)', sc); if(f) f.focus({ preventScroll: true }); });
    return { el: sc, box: box, close: close };
  }
  function modal(o){
    var m = sheet({ label: o.label || o.title, onClose: o.onClose, html: (o.art || '') + '<h3>' + esc(o.title) + '</h3>' + (o.text ? '<p>' + o.text + '</p>' : '') + '<div class="modal__actions"></div>' });
    var box = $('.k-modal__actions', m.box);
    (o.actions && o.actions.length ? o.actions : [{ label: 'Entendido' }]).forEach(function(a){
      var b = a.href ? h('<a class="btn btn--block ' + (a.cls || '') + '" href="' + esc(a.href) + '">' + esc(a.label) + '</a>') : h('<button type="button" class="btn btn--block ' + (a.cls || '') + '">' + esc(a.label) + '</button>');
      b.addEventListener('click', function(){ SND.play('tap'); if(!a.href) m.close(true); if(a.onClick) a.onClick(); });
      box.appendChild(b);
    });
    return m;
  }
  function confetti(power){
    if(reduced()) return; power = power || 1;
    var c = document.createElement('canvas'); c.className = 'k-confetti'; c.setAttribute('aria-hidden', 'true');
    root().appendChild(c);
    var dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; var x = c.getContext('2d'); x.scale(dpr, dpr);
    var cs = getComputedStyle(portal);
    var cols = ['--k-brand', '--k-xp', '--k-ok', '--k-bad', '--k-award', '--k-mend', '--k-streak'].map(function(v){ return cs.getPropertyValue(v).trim() || '#2D4BF0'; });
    var P = []; for(var i = 0; i < Math.round(110 * power); i++) P.push({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .42, vx: (Math.random() - .5) * 14, vy: -Math.random() * 15 - 6, r: 5 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - .5) * .35, c: cols[i % cols.length], s: i % 3 });
    var t0 = performance.now();
    (function frame(t){
      var k = (t - t0) / 1000; x.clearRect(0, 0, W, H);
      P.forEach(function(p){ p.vy += .42; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        x.save(); x.globalAlpha = Math.max(0, 1 - Math.max(0, k - 1.4) / .6); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c;
        if(p.s === 0) x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); else if(p.s === 1){ x.beginPath(); x.arc(0, 0, p.r / 2.4, 0, 7); x.fill(); }
        else { x.beginPath(); x.moveTo(0, -p.r / 2); x.lineTo(p.r / 2, p.r / 2); x.lineTo(-p.r / 2, p.r / 2); x.fill(); }
        x.restore(); });
      if(k < 2) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  function ring(k, r, sw, cls, id){
    r = r || 30; sw = sw || 8; var C = 2 * Math.PI * r;
    return '<svg viewBox="0 0 72 72" class="' + (cls || '') + '"><circle class="ring__track" cx="36" cy="36" r="' + r + '" fill="none" stroke-width="' + sw + '"/><circle class="ring__fill"' + (id ? ' id="' + id + '"' : '') + ' cx="36" cy="36" r="' + r + '" fill="none" stroke-width="' + sw + '" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - Math.max(0, Math.min(1, k)))) + '"/></svg>';
  }
  /* Método Leo REAL (apply_mistake_results): 2 aciertos seguidos = recuperado; 4 = dominado. Un fallo vuelve a 0. */
  var MEND = { recover: 2, master: 4 };
  function steps(streak, cls){
    streak = Math.max(0, Math.min(MEND.master, streak | 0));
    var lbl = streak >= MEND.master ? 'Dominado' : streak >= MEND.recover ? 'Recuperado: ' + streak + ' de 4 aciertos seguidos para dominarlo' : streak + ' de 2 aciertos seguidos para recuperarlo';
    var dots = ''; for(var i = 0; i < MEND.master; i++) dots += '<i class="' + (i < streak ? 'is-on' : '') + (i === 1 ? ' v2-gate' : '') + '"></i>';
    return '<span class="steps v2-steps4 ' + (cls || '') + '" role="img" aria-label="' + lbl + '">' + dots + '</span>';
  }
  function barChart(vals, labels, today, unit){
    var W = 320, H = 130, pad = 22, max = Math.max.apply(null, [15].concat(vals)), bw = 26, step = (W - 8) / vals.length;
    return '<div class="chart" data-chart><svg viewBox="0 0 ' + W + ' ' + (H + pad) + '" role="img" aria-label="' + unit + ' por día esta semana">' +
      [0, .5, 1].map(function(f){ return '<line class="grid" x1="0" x2="' + W + '" y1="' + (H - f * H * .85) + '" y2="' + (H - f * H * .85) + '"/>'; }).join('') +
      vals.map(function(v, i){ var hh = Math.max(4, v / max * H * .85), x = 4 + i * step + (step - bw) / 2;
        return '<rect class="hit" x="' + (4 + i * step) + '" y="0" width="' + step + '" height="' + H + '" data-tip="' + labels[i] + ': ' + v + ' ' + unit + '" tabindex="0"/><path class="bar-mark ' + (v ? '' : 'is-zero') + ' ' + (i === today ? 'is-today' : '') + '" d="M' + x + ' ' + H + 'V' + (H - hh + 4) + 'a4 4 0 0 1 4-4h' + (bw - 8) + 'a4 4 0 0 1 4 4V' + H + 'Z"/>' +
          (v ? '<text class="val" x="' + (x + bw / 2) + '" y="' + (H - hh - 6) + '" text-anchor="middle">' + v + '</text>' : '') +
          '<text class="axis ' + (i === today ? 'is-today' : '') + '" x="' + (x + bw / 2) + '" y="' + (H + 16) + '" text-anchor="middle">' + labels[i] + '</text>'; }).join('') +
      '</svg><div class="chart-tip"></div></div>';
  }
  function lineChart(o){
    var W = 320, H = 120, pad = 22, n = o.labels.length, min = o.min || 0, max = o.max;
    var x = function(i){ return n === 1 ? W / 2 : 14 + i * (W - 28) / (n - 1); }, y = function(v){ return H - (v - min) / (max - min || 1) * H * .88; };
    var line = function(arr){ return arr.map(function(v, i){ return (i ? 'L' : 'M') + x(i) + ' ' + y(v); }).join(''); };
    return '<div class="chart" data-chart><svg viewBox="0 0 ' + W + ' ' + (H + pad) + '" role="img" aria-label="' + esc(o.aria) + '">' +
      [min, (min + max) / 2, max].map(function(v){ return '<line class="grid" x1="0" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="axis" x="' + W + '" y="' + (y(v) - 4) + '" text-anchor="end">' + Math.round(v) + '</text>'; }).join('') +
      o.series.map(function(s){ return (s.area ? '<path class="area" fill="' + s.c + '" d="' + line(s.v) + 'L' + x(n - 1) + ' ' + H + 'L' + x(0) + ' ' + H + 'Z"/>' : '') + '<path class="line" stroke="' + s.c + '" ' + (s.dash ? 'stroke-dasharray="5 4"' : '') + ' d="' + line(s.v) + '"/>'; }).join('') +
      o.labels.map(function(l, i){ return o.series.map(function(s){ return '<circle class="dot" r="' + (i === n - 1 ? 5.5 : 4) + '" cx="' + x(i) + '" cy="' + y(s.v[i]) + '" fill="' + s.c + '"/>'; }).join('') +
        '<rect class="hit" x="' + (x(i) - 16) + '" y="0" width="32" height="' + H + '" tabindex="0" data-tip="' + esc(o.tip(i)) + '"/><text class="axis" x="' + x(i) + '" y="' + (H + 16) + '" text-anchor="middle">' + l + '</text>'; }).join('') +
      (o.last != null ? '<text class="val" x="' + (x(n - 1) - 10) + '" y="' + (y(o.series[0].v[n - 1]) - 10) + '" text-anchor="end">' + o.last + '</text>' : '') +
      '</svg><div class="chart-tip"></div></div>';
  }
  function wireCharts(r){
    $$('.k-chart', r).forEach(function(c){
      var tip = $('.k-chart-tip', c);
      var show = function(e){ var t = e.target.closest('.k-hit'); if(!t) return; var a = t.getBoundingClientRect(), b = c.getBoundingClientRect(); tip.textContent = t.getAttribute('data-tip'); tip.style.left = Math.min(b.width - 70, Math.max(70, a.left - b.left + a.width / 2)) + 'px'; tip.style.top = Math.max(18, a.top - b.top + 20) + 'px'; tip.classList.add('k-is-on'); };
      c.addEventListener('pointerover', show); c.addEventListener('focusin', show); c.addEventListener('click', show);
      c.addEventListener('pointerleave', function(){ tip.classList.remove('k-is-on'); }); c.addEventListener('focusout', function(){ tip.classList.remove('k-is-on'); });
    });
  }
  /* Sonidos: solo los EFECTOS (aciertos, combos, celebraciones). Los audios educativos no se tocan. */
  function soundSheet(){
    var U = A.UI || {};
    var m = sheet({ label: 'Sonidos', cls: 'modal--sheet v2-sound-sheet', html:
      '<h3>Sonidos</h3><p>Efectos de aciertos, combos y celebraciones. Los audios de las lecciones siguen igual.</p>' +
      '<div class="card list"><div class="row">' + (U.speaker || '') + '<span class="row__label">Efectos de sonido</span><button type="button" class="switch" role="switch" data-snd aria-checked="' + !!SND.enabled + '" aria-label="Efectos de sonido"></button></div>' +
      '<div class="row v2-vol-row">' + (U.soundOff || '') + '<input type="range" class="v2-vol" min="0" max="100" step="5" value="' + Math.round((SND.volume == null ? .8 : SND.volume) * 100) + '" aria-label="Volumen de los efectos">' + (U.speaker || '') + '</div></div>' +
      '<button type="button" class="btn btn--block" data-ok>Listo</button>' });
    var sw = m.box.querySelector('[data-snd]'), vol = m.box.querySelector('.v2-vol');
    var sync = function(){ vol.disabled = !SND.enabled; window.dispatchEvent(new Event('v2:sound')); };
    sw.addEventListener('click', function(){ SND.set(!SND.enabled); sw.setAttribute('aria-checked', String(!!SND.enabled)); sync(); });
    vol.addEventListener('input', function(){ if(SND.setVolume) SND.setVolume(vol.value / 100); });
    vol.addEventListener('change', function(){ SND.play('correct'); });
    m.box.querySelector('[data-ok]').addEventListener('click', function(){ m.close(true); });
    sync();
    return m;
  }
  function greeting(){ var hr = new Date().getHours(); return hr < 12 ? 'Buenos días' : hr < 19 ? 'Buenas tardes' : 'Buenas noches'; }
  /* Etapas visuales de la ruta: solo agrupan los cursos reales para el mapa (no cambian el orden ni la lógica) */
  var STAGES = [
    { n: 'Etapa 1', t: 'Primeros pasos', c: 'var(--k-ok)', from: 0, to: 4, shape: 'circle', goal: 'Presentarte y hablar de ti' },
    { n: 'Etapa 2', t: 'Tu día a día', c: 'var(--k-info)', from: 4, to: 8, shape: 'hex', goal: 'Contar tu rutina y hacer preguntas' },
    { n: 'Etapa 3', t: 'Conversaciones reales', c: 'var(--k-award)', from: 8, to: 11, shape: 'shield', goal: 'Sostener una conversación sencilla' }
  ];
  function emblem(id, o){ try{ return (A.COURSE_ART && A.COURSE_ART[id]) ? A.emblem(id, o || {}) : A.STK.book; }catch(e){ return ''; } }

  window.K = { h: h, px: pfx, $: $, $$: $$, esc: esc, fmt: fmt, root: root, countTo: countTo, bump: bump, toast: toast, sheet: sheet, modal: modal, confetti: confetti,
    ring: ring, steps: steps, MEND: MEND, barChart: barChart, lineChart: lineChart, wireCharts: wireCharts, greeting: greeting, STAGES: STAGES, emblem: emblem,
    ART: A, SND: SND, reduced: reduced, soundSheet: soundSheet };
})();
