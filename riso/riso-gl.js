/* Riso · animación mejorada con WebGL (gratis, sin librerías). PROTOTIPO: no reemplaza todavía a riso.js.
   Misma identidad: usa EXACTAMENTE las mismas ilustraciones por capas de riso/img; no dibuja nada nuevo sobre el personaje.
   En vez de mover la imagen entera, deforma zonas con un campo de desplazamiento en la tarjeta gráfica:
     - llamas: lengüetas que suben y se mecen más en las puntas (solo donde la máscara de llamas lo permite);
     - respiración: el pecho sube y se ensancha apenas; los pies no se mueven;
     - parpadeo: el párpado baja y sube (no aparece de golpe);
     - saludo y pulgar: la mano gira desde la muñeca con anticipación y rebote;
     - concentración: la cabeza se inclina despacio desde el cuello y las llamas se calman;
     - celebración: se agacha, se estira desde los pies, rebota y las llamas se avivan, con chispas alrededor.
   Una sola pasada de dibujo por cuadro, 30 cuadros por segundo como máximo, se pausa fuera de pantalla o con la
   pestaña oculta, y con «reducir movimiento» queda quieto. Sin WebGL usa riso.js (la versión actual).
   Uso: RisoGL.montar(elemento, { estado: 'neutro' | 'bienvenida' | 'celebracion' | 'pensando', alto: 120 }) */
(function (root) {
  'use strict';
  var W = 380, H = 460;
  var BASE = (function () { try { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/riso-gl\.js(\?.*)?$/, '') : 'riso/'; } catch (e) { return 'riso/'; } })();
  var POSES = {
    neutro:   { cuerpo: 'riso-neutro.webp', parpados: 'riso-neutro-parpados.webp', ojos: [169, 236], llamas: 'riso-neutro-llamas.png' },
    saludo:   { cuerpo: 'riso-saludo-cuerpo.webp', mano: 'riso-saludo-mano.webp', pivote: [285, 318], parpados: 'riso-saludo-parpados.webp', ojos: [180, 255], llamas: 'riso-saludo-llamas.png' },
    guino:    { cuerpo: 'riso-guino-cuerpo.webp', mano: 'riso-guino-mano.webp', pivote: [300, 332], llamas: 'riso-guino-llamas.png' },
    pensando: { cuerpo: 'riso-pensando.webp', parpados: 'riso-pensando-parpados.webp', ojos: [168, 243], llamas: 'riso-pensando-llamas.png' }
  };
  var ESTADO_POSE = { neutro: 'neutro', bienvenida: 'saludo', celebracion: 'guino', pensando: 'pensando' };
  var CUELLO = 292 / H, PECHO = 330 / H, PIES = 452 / H;

  var VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision mediump float;varying vec2 uv;',
    'uniform sampler2D uCuerpo,uParpados,uMano,uLlamas;',
    'uniform float uT,uRespira,uParpado,uManoAng,uLlama,uVel,uCabeza,uEstira,uAncho;',
    'uniform vec2 uOjos,uPivote;uniform float uHayParpados,uHayMano;',
    'const vec2 ASP=vec2(' + W + '.,' + H + '.);',
    'vec2 rot(vec2 q,vec2 c,float a){vec2 d=(q-c)*ASP;float s=sin(a),k=cos(a);return c+vec2(k*d.x-s*d.y,s*d.x+k*d.y)/ASP;}',
    'void main(){',
    '  vec2 q=uv;',
    // estirar y aplastar desde los pies (celebración)
    '  q.y=' + PIES + '+(q.y-' + PIES + ')/(1.+uEstira);',
    '  q.x=.5+(q.x-.5)/(1.-uEstira*.5);',
    // respiración: sube el pecho y lo de arriba; los pies quedan fijos; el pecho se ensancha apenas
    '  float r=clamp((' + PIES + '-q.y)/(' + PIES + '-' + PECHO + '),0.,1.);',
    '  q.y+=uRespira*.010*r;',
    '  float bz=(q.y-' + PECHO + ')/.07;float banda=exp(-bz*bz);',
    '  q.x=.5+(q.x-.5)*(1.-uRespira*.012*banda);',
    // cabeza: gira desde el cuello, con transición suave
    '  float wc=smoothstep(' + CUELLO + '+.03,' + CUELLO + '-.05,q.y);',
    '  q=mix(q,rot(q,vec2(.5,' + CUELLO + '),-uCabeza),wc);',
    // llamas: solo donde la máscara lo permite, más fuerte en las puntas
    '  float m=texture2D(uLlamas,q).r;',
    '  float punta=.45+.9*smoothstep(.45,.02,q.y);',
    '  float t=uT*uVel;',
    '  float n1=sin(q.y*34.-t*6.3+sin(q.x*11.+t*1.7)*1.6);',
    '  float n2=sin(q.y*17.+q.x*9.-t*4.1);',
    '  q.x+=m*uLlama*.011*punta*(.6*n1+.4*n2);',
    '  q.y+=m*uLlama*.009*punta*(.55+.45*sin(q.x*23.+t*5.2+q.y*9.));',
    '  vec4 c=texture2D(uCuerpo,q);',
    '  if(uHayParpados>.5&&uParpado>.001){vec4 l=texture2D(uParpados,q);float v=(q.y-uOjos.x)/(uOjos.y-uOjos.x);float vis=1.-smoothstep(uParpado-.08,uParpado,v);c=l*vis+c*(1.-l.a*vis);}',
    '  if(uHayMano>.5){vec2 h=rot(q,uPivote,-uManoAng);vec4 hm=texture2D(uMano,h);c=hm+c*(1.-hm.a);}',
    '  gl_FragColor=c;',
    '}'
  ].join('\n');

  function compilar(gl, tipo, src) { var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  var cacheImg = {};
  function cargar(src) {
    if (cacheImg[src]) return cacheImg[src];
    return (cacheImg[src] = new Promise(function (ok, mal) { var i = new Image(); i.decoding = 'async'; i.onload = function () { ok(i); }; i.onerror = mal; i.src = BASE + 'img/' + src; }));
  }
  function textura(gl, img) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    if (img) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE); });
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }
  function easeOutBack(x) { var c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function resorte(t, f, d) { return Math.exp(-d * t) * Math.cos(f * t); } // 1 → 0 con rebote

  function montar(el, opts) {
    opts = opts || {};
    var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)');
    var canvas = document.createElement('canvas');
    var gl = null;
    try { gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return root.Riso ? root.Riso.montar(el, opts) : null; // sin WebGL: la versión actual

    var alto = opts.alto || 120, ancho = Math.round(alto * W / H);
    var envol = document.createElement('div');
    envol.className = 'risogl'; envol.setAttribute('role', 'img'); envol.setAttribute('aria-label', opts.etiqueta != null ? opts.etiqueta : 'Riso');
    envol.style.cssText = 'position:relative;display:inline-block;width:' + ancho + 'px;height:' + alto + 'px';
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    canvas.width = Math.round(ancho * dpr); canvas.height = Math.round(alto * dpr);
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    envol.appendChild(canvas);
    var capaFx = document.createElement('div'); capaFx.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:visible';
    envol.appendChild(capaFx);
    el.innerHTML = ''; el.appendChild(envol);

    var prog = gl.createProgram();
    gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ['uCuerpo', 'uParpados', 'uMano', 'uLlamas', 'uT', 'uRespira', 'uParpado', 'uManoAng', 'uLlama', 'uVel', 'uCabeza', 'uEstira', 'uAncho', 'uOjos', 'uPivote', 'uHayParpados', 'uHayMano'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1i(U.uCuerpo, 0); gl.uniform1i(U.uParpados, 1); gl.uniform1i(U.uMano, 2); gl.uniform1i(U.uLlamas, 3);
    var vacia = textura(gl, null);
    var tex = {}; // pose -> { cuerpo, parpados, mano, llamas }

    function prepararPose(nombre) {
      var P = POSES[nombre];
      if (tex[nombre]) return Promise.resolve(tex[nombre]);
      return Promise.all([cargar(P.cuerpo), P.parpados ? cargar(P.parpados) : null, P.mano ? cargar(P.mano) : null, cargar(P.llamas)]).then(function (a) {
        return (tex[nombre] = { cuerpo: textura(gl, a[0]), parpados: a[1] ? textura(gl, a[1]) : vacia, mano: a[2] ? textura(gl, a[2]) : vacia, llamas: textura(gl, a[3]) });
      });
    }

    var estado = opts.estado || 'neutro', pose = ESTADO_POSE[estado] || 'neutro', t0 = performance.now(), tEstado = 0;
    var parpadeo = { prox: 2 + Math.random() * 2, ini: -1 }, quieto = false, visible = true, raf = 0, ult = 0, listo = false;

    function chispas() {
      if (reduce && reduce.matches) return;
      capaFx.innerHTML = '';
      for (var i = 0; i < 7; i++) {
        var s = document.createElement('span'), ang = (-150 + i * 20) * Math.PI / 180, dist = 0.55 + Math.random() * 0.2;
        s.style.cssText = 'position:absolute;left:50%;top:42%;width:8%;aspect-ratio:1;background:radial-gradient(circle,#fff6c2 0 30%,#ffb400 31% 55%,transparent 56%);border-radius:50%;opacity:0;transform:translate(-50%,-50%)';
        s.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.4)' }, { opacity: 1, offset: .25 },
          { opacity: 0, transform: 'translate(calc(-50% + ' + (Math.cos(ang) * dist * ancho) + 'px),calc(-50% + ' + (Math.sin(ang) * dist * alto) + 'px)) scale(1)' }],
          { duration: 900 + i * 40, delay: 180, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
        capaFx.appendChild(s);
      }
    }
    function burbuja(on) {
      var b = envol.querySelector('.risogl__burbuja');
      if (!on) { if (b) b.remove(); return; }
      if (b) return;
      b = document.createElement('div'); b.className = 'risogl__burbuja';
      b.style.cssText = 'position:absolute;right:-30%;top:-10%;width:46%;pointer-events:none';
      b.innerHTML = '<svg viewBox="0 0 120 84" aria-hidden="true"><circle cx="10" cy="76" r="6" fill="#fff" stroke="#B9A8F0" stroke-width="2.5"/><circle cx="24" cy="62" r="9" fill="#fff" stroke="#B9A8F0" stroke-width="2.5"/><rect x="30" y="16" width="84" height="44" rx="22" fill="#fff" stroke="#B9A8F0" stroke-width="2.5"/><circle class="p" cx="56" cy="38" r="5" fill="#6D5BD0"/><circle class="p" cx="72" cy="38" r="5" fill="#6D5BD0"/><circle class="p" cx="88" cy="38" r="5" fill="#6D5BD0"/></svg>';
      envol.appendChild(b);
      if (!(reduce && reduce.matches)) b.querySelectorAll('.p').forEach(function (p, i) { p.animate([{ opacity: .3, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(-3px)' }, { opacity: .3, transform: 'translateY(0)' }], { duration: 1100, delay: i * 160, iterations: Infinity }); });
    }

    function valores(t) {
      var e = t - tEstado, v = { respira: 0, parpado: 0, mano: 0, llama: 1, vel: 1, cabeza: 0, estira: 0 };
      v.respira = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 3.6);
      // parpadeo natural: baja en 90 ms, sube en 140 ms, cada 2,5 a 5,5 s (a veces doble)
      if (parpadeo.ini < 0 && t > parpadeo.prox) parpadeo.ini = t;
      if (parpadeo.ini >= 0) {
        var b = t - parpadeo.ini;
        v.parpado = b < 0.09 ? b / 0.09 : b < 0.23 ? 1 - (b - 0.09) / 0.14 : 0;
        if (b >= 0.23) { parpadeo.ini = -1; parpadeo.prox = t + (Math.random() < 0.15 ? 0.25 : 2.5 + Math.random() * 3); }
      }
      if (estado === 'neutro') { v.cabeza = Math.sin(t * 0.7) * 0.012; }
      if (estado === 'bienvenida') {
        var ciclo = e < 2.2 ? e : (e - 2.2) % 5;            // saluda al entrar y luego cada 5 s
        var seq = [0, -0.21, 0.17, -0.17, 0.12, -0.05, 0];   // radianes: anticipación, vaivén y reposo
        if (ciclo < 1.5) { var x = ciclo / 1.5 * (seq.length - 1), i = Math.floor(x), f = x - i; f = f * f * (3 - 2 * f); v.mano = seq[i] + (seq[Math.min(i + 1, seq.length - 1)] - seq[i]) * f; }
        v.cabeza = -0.035 * Math.min(1, e / 0.6) + Math.sin(t * 0.8) * 0.008;
      }
      if (estado === 'pensando') { v.cabeza = 0.05 * Math.sin(t * 0.9) + 0.03; v.llama = 0.75; v.vel = 0.6; v.respira *= 0.7; }
      if (estado === 'celebracion') {
        if (e < 0.18) v.estira = -0.035 * (e / 0.18);                            // se agacha
        else v.estira = 0.06 * resorte(e - 0.18, 14, 4.5);                       // se estira y rebota
        var ciclo2 = (e % 3.2);
        v.mano = ciclo2 < 0.6 ? -0.16 * Math.sin(ciclo2 / 0.6 * Math.PI) : 0;    // pulgar arriba
        v.llama = 1 + 0.9 * Math.exp(-e * 1.4); v.vel = 1.25;
      }
      return v;
    }
    function dibujar(now) {
      var T = tex[pose]; if (!T) return;
      var t = (now - t0) / 1000, v = (quieto || (reduce && reduce.matches)) ? { respira: 0.5, parpado: 0, mano: 0, llama: 0, vel: 0, cabeza: 0, estira: 0 } : valores(t);
      var P = POSES[pose];
      gl.viewport(0, 0, canvas.width, canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      [[0, T.cuerpo], [1, T.parpados], [2, T.mano], [3, T.llamas]].forEach(function (x) { gl.activeTexture(gl.TEXTURE0 + x[0]); gl.bindTexture(gl.TEXTURE_2D, x[1]); });
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uRespira, v.respira); gl.uniform1f(U.uParpado, v.parpado); gl.uniform1f(U.uManoAng, v.mano);
      gl.uniform1f(U.uLlama, v.llama); gl.uniform1f(U.uVel, v.vel); gl.uniform1f(U.uCabeza, v.cabeza); gl.uniform1f(U.uEstira, v.estira);
      gl.uniform2f(U.uOjos, (P.ojos ? P.ojos[0] : 0) / H, (P.ojos ? P.ojos[1] : 1) / H);
      gl.uniform2f(U.uPivote, (P.pivote ? P.pivote[0] : 0) / W, (P.pivote ? P.pivote[1] : 0) / H);
      gl.uniform1f(U.uHayParpados, P.parpados ? 1 : 0); gl.uniform1f(U.uHayMano, P.mano ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function bucle(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - ult >= 33) { ult = now; dibujar(now); } // 30 cuadros por segundo como máximo
      if (!(quieto || (reduce && reduce.matches))) raf = requestAnimationFrame(bucle);
    }
    function arrancar() { if (!raf && listo) raf = requestAnimationFrame(bucle); }
    function ponerEstado(e) {
      estado = ESTADO_POSE[e] ? e : 'neutro'; pose = ESTADO_POSE[estado];
      tEstado = (performance.now() - t0) / 1000;
      burbuja(estado === 'pensando');
      if (estado === 'celebracion') chispas();
      return prepararPose(pose).then(function () { listo = true; dibujar(performance.now()); arrancar(); });
    }
    var io = 'IntersectionObserver' in root ? new IntersectionObserver(function (es) { es.forEach(function (x) { visible = x.isIntersecting; if (visible) arrancar(); }); }) : null;
    if (io) io.observe(envol);
    var alVisibilidad = function () { if (!document.hidden) arrancar(); };
    document.addEventListener('visibilitychange', alVisibilidad);
    if (reduce && reduce.addEventListener) reduce.addEventListener('change', function () { dibujar(performance.now()); arrancar(); });
    ponerEstado(estado);
    // las otras poses se precargan en segundo plano (cambios de estado sin parpadeo)
    setTimeout(function () { Object.keys(POSES).forEach(function (k) { prepararPose(k).catch(function () {}); }); }, 1500);

    var api = {
      estado: function (e) { ponerEstado(e); return api; },
      quieto: function (v) { quieto = !!v; dibujar(performance.now()); arrancar(); return api; },
      destruir: function () { if (raf) cancelAnimationFrame(raf); if (io) io.disconnect(); document.removeEventListener('visibilitychange', alVisibilidad); el.innerHTML = ''; },
      tipo: 'webgl'
    };
    return api;
  }
  root.RisoGL = { montar: montar, POSES: POSES };
})(typeof window !== 'undefined' ? window : globalThis);
