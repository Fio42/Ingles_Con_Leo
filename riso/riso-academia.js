/* =========================================================
   Riso en la academia · la identidad visible de toda la ayuda educativa.
   - Profe Leo es el profesor y creador del método. Riso es la mascota y el asistente inteligente: presenta las
     correcciones que YA calcula la plataforma y está disponible cuando el alumno quiere más ayuda.
   - Solo se activa si el SERVIDOR dice que Riso está habilitado para esta cuenta (leo-ai, modo chat_status: sin IA,
     0 neuronas). Hoy eso es solo la cuenta del piloto. Para todos los demás la academia queda exactamente igual.
   - Corrección de ejercicios: la nota, la respuesta correcta y la explicación son las de siempre (app.js). Riso solo
     las presenta. Cero llamadas a Gemma por corregir.
   - «Pregúntale a Riso»: abre la conversación con el contexto del ejercicio (pregunta, respuesta, correcta, si
     acertó, explicación que ya vio, tema). «¿Por qué?» usa la explicación de Leo AI de siempre (no repite lo que el
     alumno ya leyó); lo demás lo responde Riso por capas (herramientas, glosario, fichas aprobadas, IA).
   - Privacidad: nada de esto guarda el texto del alumno. Las métricas son contadores sin texto (riso_metricas_lote).
   ========================================================= */
(function (root) {
  'use strict';
  if (root.RisoAcademia) return;
  var d = document, V = '20261128c';
  var BASE = (function () { try { var s = d.currentScript && d.currentScript.src; return s ? s.replace(/riso-academia\.js(\?.*)?$/, '') : 'riso/'; } catch (e) { return 'riso/'; } })();
  var IMG = { neutro: BASE + 'img/riso-neutro.webp', guino: BASE + 'img/riso-guino-cuerpo.webp' };
  var CLAVE = 'riso_estado_v1', VIDA_ON = 30 * 60e3, VIDA_OFF = 6 * 3600e3;
  var ESTADO = null;

  function el(tag, cls, txt) { var e = d.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function avatar(cls, tipo) { var i = el('img', cls); i.src = IMG[tipo] || IMG.neutro; i.alt = ''; i.decoding = 'async'; i.width = 40; i.height = 48; return i; }
  function texto(html) { var t = d.createElement('div'); t.innerHTML = String(html == null ? '' : html); return (t.textContent || '').replace(/\s+/g, ' ').trim(); }

  // ---------- 1. ¿Riso está habilitado para esta cuenta? (lo decide el servidor) ----------
  function leerCache(uid) {
    try { var j = JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); if (j && j.uid === uid && Date.now() - j.t < (j.st && j.st.enabled ? VIDA_ON : VIDA_OFF)) return j.st; } catch (e) {}
    return null;
  }
  function guardarCache(uid, st) { try { sessionStorage.setItem(CLAVE, JSON.stringify({ uid: uid, t: Date.now(), st: st })); } catch (e) {} }
  function consultarEstado() {
    if (typeof LeoBackend === 'undefined' || typeof LeoBackend.getSession !== 'function' || typeof SUPABASE_URL === 'undefined') return Promise.resolve(null);
    return Promise.resolve().then(function () { return LeoBackend.getSession(); }).then(function (s) {
      if (!s || !s.access_token) return null;
      var uid = (s.user && s.user.id) || 'x', c = leerCache(uid);
      if (c) return c;
      return fetch(SUPABASE_URL + '/functions/v1/leo-ai', { method: 'POST', headers: { 'Authorization': 'Bearer ' + s.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'chat_status' }) })
        .then(function (r) { return r.json(); }).then(function (j) { var st = j && j.riso ? j.riso : { enabled: false }; guardarCache(uid, st); return st; });
    }).catch(function () { return null; });
  }

  // ---------- 2. Riso presenta las correcciones de la plataforma ----------
  // La corrección (acierto o error, respuesta correcta, explicación) es la de siempre. Riso solo la presenta, en la misma
  // línea donde la academia mostraba quién explica (v2-fx.js pone ahí al Profe Leo en los errores): una sola firma.
  function decorar(host, ctx) {
    try {
      if (!host || !host.querySelector || !host.querySelector('.fb-head') || host.querySelector('.rsa-tip')) return;
      var ok = !!(ctx && (ctx.isCorrect === true || ctx.isOk === true));
      var tip = el('div', 'v2-leo-tip rsa-tip'); tip.appendChild(avatar('rsa-tip__av', ok ? 'guino' : 'neutro')); tip.appendChild(el('span', null, 'Riso'));
      host.insertBefore(tip, host.firstChild);
      host.classList.add('rsa-fb');
    } catch (e) {}
  }

  // Lo que la conversación necesita saber del ejercicio: el MISMO resumen con el que Leo AI explica (buildLeoAiPayload en
  // app.js: pregunta, opciones, respuesta, correcta, explicación que ya vio, tema). No se recalcula nada.
  function contextoDe(ctx, payload) {
    var it = ctx.item || {}, pl = payload || {};
    var error = ctx.kind === 'grammar' && it.type === 'error';
    return {
      itemId: it.id || '', tipo: ctx.kind, tipoItem: it.type || '', tema: texto(pl.topic || '').replace(/^Palabra: /, '').slice(0, 120),
      enunciado: texto(pl.question).slice(0, 200), respuestaAlumno: texto(error ? ctx.userAnswer : pl.studentAnswer).slice(0, 120),
      respuestaCorrecta: texto(error ? (it.wrongWord ? 'la palabra incorrecta es «' + it.wrongWord + '»; frase correcta: ' + (it.right || '') : pl.correctAnswer) : pl.correctAnswer).slice(0, 200),
      acerto: ctx.isCorrect === true, explicacion: texto(pl.baseExplanation).slice(0, 400), palabraIdx: typeof ctx.pickedIdx === 'number' ? ctx.pickedIdx : null
    };
  }

  // Intento del alumno, para que el servidor acepte el contexto (solo práctica de gramática, la que está en su índice).
  function registrarIntento(c) {
    if (c.tipo !== 'grammar' || !c.itemId) return null;
    var resp = c.tipoItem === 'error' ? (c.palabraIdx == null ? null : String(c.palabraIdx)) : c.respuestaAlumno;
    if (!resp) return null;
    try { LeoBackend.getClient().rpc('riso_registrar_intento', { p_item: c.itemId, p_respuesta: resp }).then(function () {}, function () {}); } catch (e) {}
    return resp;
  }

  function botonEjercicio(host, ctx, payload) {
    if (!ESTADO || !host) return null;
    decorar(host, ctx);
    var c = contextoDe(ctx, payload);
    c.respuestaServidor = registrarIntento(c);
    var box = el('div', 'leo-ai rsa-preg');
    var b = el('button', 'leo-ai-btn rsa-preg__btn'); b.type = 'button';
    b.appendChild(avatar('rsa-preg__av', 'neutro')); b.appendChild(el('span', null, 'Pregúntale a Riso'));
    b.addEventListener('click', function () { abrir({ ejercicio: c, payload: payload }); });
    box.appendChild(b); host.appendChild(box);
    return box;
  }

  // ---------- 3. La conversación (un solo panel para toda la academia) ----------
  var P = null; // { raiz, msgs, chips, q, ctxTxt, tutor, ejercicio, payload, explicado, ocupado, lote }
  function cargar(src) { return new Promise(function (ok, mal) { var s = d.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; d.body.appendChild(s); }); }
  function motorListo() {
    if (root.RisoTutor && root.RISO_CONOCIMIENTO) return Promise.resolve();
    return cargar(BASE + 'tutor/conocimiento.js?v=' + V).then(function () { return cargar(BASE + 'tutor/riso-tutor.js?v=' + V); });
  }

  function prefijo(c) {
    if (!c) return '';
    return ('Sobre el ejercicio «' + c.enunciado.slice(0, 110) + '» (' + (c.tipo === 'grammar' && c.tipoItem === 'error' ? 'toqué «' + c.respuestaAlumno + '»' : 'respondí «' + c.respuestaAlumno + '»') +
      ', ' + (c.tipoItem === 'error' ? c.respuestaCorrecta.slice(0, 90) : 'la respuesta correcta es «' + c.respuestaCorrecta.slice(0, 80) + '»') + ', ' + (c.acerto ? 'acerté' : 'fallé') + '): ');
  }
  // Capa 5 (IA): primero con el contexto verificado por el servidor; si el ejercicio no está en su índice, se describe en la pregunta.
  function generar(p) {
    // Solo si el motor mandó la pregunta CON el ejercicio (p.contexto); las que se entienden solas van sin él.
    var c = p.contexto && P ? P.ejercicio : null, conCtx = c && c.respuestaServidor ? { itemId: c.itemId, respuestaAlumno: c.respuestaServidor } : null;
    function pedir(pregunta, contexto) {
      return LeoBackend.askLeoAI({ mode: 'chat', pregunta: pregunta, historial: p.historial, contexto: contexto });
    }
    var primero = conCtx ? pedir(p.pregunta, conCtx) : pedir(((c ? prefijo(c) : '') + p.pregunta).slice(0, 400), null);
    return primero.then(function (r) {
      if (r && !r.ok && r.reason === 'bad_context' && c) return pedir((prefijo(c) + p.pregunta).slice(0, 400), null);
      return r;
    }).then(function (r) {
      if (!r || !r.ok || !r.answer || typeof r.answer.texto !== 'string') throw new Error((r && r.reason) || 'error');
      var a = r.answer;
      return { texto: a.texto, ej: a.ejemplo_en ? [[a.ejemplo_en, a.ejemplo_es || '']] : [], metrica: a.metrica || null };
    });
  }

  function enviarLote() {
    if (!P || !P.lote.length) return;
    var l = P.lote.splice(0, 50);
    try { LeoBackend.getClient().rpc('riso_metricas_lote', { p_lote: l }).then(function () {}, function () {}); } catch (e) {}
  }

  function crearPanel() {
    var raiz = el('div', 'rsa k-scope'); raiz.hidden = true; raiz.setAttribute('role', 'dialog'); raiz.setAttribute('aria-modal', 'true'); raiz.setAttribute('aria-labelledby', 'rsaT');
    raiz.innerHTML = '<div class="rsa__fondo" data-cerrar></div><div class="rsa__panel">' +
      '<div class="rsa__cab"><span class="rsa__cab-av"></span><div class="rsa__cab-t"><div class="rsa__titulo" id="rsaT">Riso</div><div class="rsa__sub">El asistente inteligente de Inglés con Leo</div></div>' +
      '<button type="button" class="rsa__cerrar" data-cerrar aria-label="Cerrar">×</button></div>' +
      '<div class="rsa__ctx" hidden><span class="rsa__ctx-t"></span><button type="button" class="rsa__ctx-q">Quitar</button></div>' +
      '<div class="rsa__msgs" aria-live="polite"></div><div class="rsa__chips"></div>' +
      '<form class="rsa__form" autocomplete="off"><textarea rows="1" maxlength="400" placeholder="Escribe tu duda de inglés" enterkeyhint="send" aria-label="Tu pregunta para Riso"></textarea>' +
      '<button type="submit" class="rsa__enviar" disabled>Enviar</button></form></div>';
    d.body.appendChild(raiz);
    raiz.querySelector('.rsa__cab-av').appendChild(avatar('rsa__av', 'neutro'));
    P = { raiz: raiz, msgs: raiz.querySelector('.rsa__msgs'), chips: raiz.querySelector('.rsa__chips'), q: raiz.querySelector('textarea'), env: raiz.querySelector('.rsa__enviar'),
      ctx: raiz.querySelector('.rsa__ctx'), ctxTxt: raiz.querySelector('.rsa__ctx-t'), tutor: null, ejercicio: null, payload: null, explicados: {}, ocupado: false, lote: [], ultimo: null };
    raiz.addEventListener('click', function (e) { if (e.target && e.target.hasAttribute('data-cerrar')) cerrar(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !raiz.hidden) cerrar(); });
    raiz.querySelector('.rsa__ctx-q').addEventListener('click', function () { ponerEjercicio(null, null); });
    raiz.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); enviar(P.q.value); });
    P.q.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(P.q.value); } });
    P.q.addEventListener('input', ajustar);
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') enviarLote(); });
    return P;
  }
  function ajustar() { var q = P.q; q.style.height = 'auto'; q.style.height = Math.min(q.scrollHeight, 120) + 'px'; P.env.disabled = P.ocupado || !q.value.trim(); }
  function bajar() { P.msgs.scrollTop = P.msgs.scrollHeight; }
  function msgAlumno(t) { P.msgs.appendChild(el('div', 'rsa-m rsa-m--al', t)); bajar(); }
  function msgRiso(r) {
    var m = el('div', 'rsa-m rsa-m--ri' + (r.tipo === 'error' ? ' is-error' : ''));
    m.appendChild(el('div', null, r.texto));
    (r.ej || []).slice(0, 2).forEach(function (e) { if (!e || !e[0]) return; var b = el('div', 'rsa-ej'); b.appendChild(el('div', 'example-en', e[0])); if (e[1]) b.appendChild(el('div', 'example-es', e[1])); m.appendChild(b); });
    if (r.ref) { var a = el('a', 'rsa-ref', 'Lee la guía' + (r.refTitulo ? ': ' + r.refTitulo.split('(')[0].split(':')[0].trim() : '')); a.href = r.ref; m.appendChild(a); }
    if (r.enlace) { var s = el('a', 'rsa-ref', 'Ir a Soporte'); s.href = r.enlace; m.appendChild(s); }
    if (r.aviso) m.appendChild(el('div', 'rsa-aviso', r.aviso));
    var mt = r.metrica;
    if (mt && /^(codigo|biblioteca|faq|cache|ia)$/.test(mt.c)) {
      var v = el('button', 'rsa-voto', 'No me ayudó'); v.type = 'button';
      v.onclick = function () { v.disabled = true; v.textContent = 'Gracias, lo revisaremos.'; try { LeoBackend.getClient().rpc('riso_valorar', { p_capa: mt.c, p_intencion: mt.i, p_tema: mt.t }).then(function () {}, function () {}); } catch (e) {} };
      m.appendChild(v);
    }
    if (r.reintentar) { var b2 = el('button', 'rsa-voto', 'Reintentar'); b2.type = 'button'; b2.onclick = function () { m.remove(); enviar(P.ultimo, true); }; m.appendChild(b2); }
    P.msgs.appendChild(m); bajar();
  }
  function chips() {
    var c = P.ejercicio, lista = c
      ? ['¿Por qué?', 'Dame otro ejemplo', 'Explícamelo más fácil', '¿Cómo se pronuncia?']
      : ['¿Cuándo uso do y does?', 'Pasado de go', '¿Cómo se dice 7:45?', '¿Cómo le digo a mi jefe que llegaré tarde?'];
    P.chips.innerHTML = '';
    lista.forEach(function (t) { var b = el('button', 'rsa-chip', t); b.type = 'button'; b.onclick = function () { enviar(t); }; P.chips.appendChild(b); });
  }
  function ponerEjercicio(c, payload) {
    P.ejercicio = c; P.payload = payload;
    P.ctx.hidden = !c;
    if (c) P.ctxTxt.textContent = 'Hablando del ejercicio: «' + c.enunciado + '»' + (c.respuestaAlumno ? ' · tu respuesta: «' + c.respuestaAlumno + '»' : '');
    chips();
  }

  // «¿Por qué?» de un ejercicio: la explicación de Leo AI de siempre (no repite lo que ya leyó, calidad revisada). Una vez por ejercicio.
  var PORQUE = /^\s*¿?\s*(y\s+)?por\s*qu[eé](?![a-záéíóúñ]).{0,40}$/i; // sin \b: en JavaScript la «é» no cuenta como letra
  function explicarPorQue(q) {
    var c = P.ejercicio, clave = c && (c.itemId + '|' + c.respuestaAlumno);
    if (!c || !P.payload || P.explicados[clave] || !PORQUE.test(q)) return null;
    P.explicados[clave] = 1;
    return Promise.resolve().then(function () { return LeoBackend.askLeoAI(P.payload); }).catch(function () { return { ok: false }; }).then(function (res) {
      var a = res && res.ok && res.answer;
      if (!a || typeof a.explanation !== 'string') { delete P.explicados[clave]; return { capa: 0, tipo: 'error', reintentar: true, texto: 'No pude responder ahora. Toca «Reintentar» en unos segundos. La explicación del ejercicio sigue siendo válida.' }; }
      return { capa: 5, tipo: 'explicacion', texto: a.explanation, ej: a.example_en ? [[a.example_en, a.example_es || '']] : [], aviso: 'Generada con IA. Puede tener errores.', metrica: { c: 'ia', i: 'ejercicio', t: 'explicar' } };
    });
  }
  // «¿Cómo se pronuncia?» en un ejercicio: de la respuesta correcta (si es una palabra o expresión corta).
  function concretar(q) {
    var c = P.ejercicio;
    if (c && /^¿?\s*c[oó]mo se pronuncia\s*\??$/i.test(q.trim())) {
      var w = (c.tipoItem === 'error' ? '' : c.respuestaCorrecta).replace(/[.!?]+$/, '');
      if (w && w.split(' ').length <= 3) return { texto: '¿Cómo se pronuncia «' + w + '»?', sinContexto: true };
    }
    // Traducir, conjugar, significado o pronunciación no dependen del ejercicio: primero las capas sin IA (herramientas,
    // glosario, fichas aprobadas). Solo si ninguna responde va a Gemma, y sin contexto, porque la pregunta se entiende sola.
    var R = root.RisoTutor && root.RisoTutor._int, tipo = R ? R.intencion(R.norm(q), false).tipo : '';
    return { texto: q, sinContexto: /^(traduccion|conjugacion|significado|pronunciacion)$/.test(tipo) };
  }

  function enviar(t, reintento) {
    t = String(t || '').trim(); if (!t || P.ocupado) return;
    P.ultimo = t; P.ocupado = true; ajustar();
    if (!reintento) msgAlumno(t);
    P.q.value = ''; ajustar();
    var pensando = el('div', 'rsa-pensando', 'Riso está pensando…'), timer = setTimeout(function () { P.msgs.appendChild(pensando); bajar(); }, 250);
    var conc = concretar(t);
    var porque = explicarPorQue(t);
    var tarea = porque || P.tutor.preguntar(conc.texto, conc.sinContexto || !P.ejercicio ? null : { itemId: P.ejercicio.itemId, fuente: 'academia', tema: P.ejercicio.tema, enunciado: P.ejercicio.enunciado, respuestaAlumno: P.ejercicio.respuestaAlumno, respuestaCorrecta: P.ejercicio.respuestaCorrecta });
    return Promise.resolve(tarea).then(function (r) {
      clearTimeout(timer); pensando.remove();
      if (porque && r.capa === 5 && P.tutor.anotar) P.tutor.anotar(t, r.texto + (r.ej && r.ej[0] ? ' Ejemplo mostrado: ' + r.ej[0][0] : ''));
      msgRiso(r);
    }).catch(function () { clearTimeout(timer); pensando.remove(); msgRiso({ capa: 0, tipo: 'error', reintentar: true, texto: 'No pude responder ahora. Toca «Reintentar» en unos segundos.' }); })
      .then(function () { P.ocupado = false; ajustar(); });
  }

  var foco = null;
  function abrir(opts) {
    opts = opts || {};
    if (!ESTADO) return;
    if (!P) crearPanel();
    foco = d.activeElement;
    P.raiz.hidden = false; d.documentElement.classList.add('rsa-abierto');
    return motorListo().then(function () {
      if (!P.tutor) {
        var plan = ESTADO.member ? 'miembro' : 'gratis';
        root.RisoTutor.CONFIG.cuotaDiaria[plan] = ESTADO.cupo || 0;
        P.tutor = root.RisoTutor.crear({ plan: plan, usadasHoy: ESTADO.usadas || 0, generar: generar,
          medir: function (m) { P.lote.push(m); if (P.lote.length >= 20) enviarLote(); } });
        msgRiso({ capa: 1, texto: root.RisoTutor.CONFIG.saludo });
      }
      if (opts.ejercicio) {
        var nuevo = !P.ejercicio || P.ejercicio.itemId !== opts.ejercicio.itemId || P.ejercicio.respuestaAlumno !== opts.ejercicio.respuestaAlumno;
        ponerEjercicio(opts.ejercicio, opts.payload);
        if (nuevo) msgRiso({ capa: 1, texto: opts.ejercicio.acerto ? '¡Bien hecho! Ya viste la explicación del ejercicio. Si quieres, te doy otro ejemplo, un truco para recordarlo o lo que necesites.' : 'Ya viste la corrección. ¿Qué parte no te quedó clara? Puedo explicarte por qué, darte otro ejemplo o ayudarte con la pronunciación.' });
      } else if (!P.chips.childNodes.length) ponerEjercicio(null, null);
      setTimeout(function () { try { P.q.focus({ preventScroll: true }); } catch (e) {} }, 60);
    }).catch(function () { msgRiso({ capa: 0, tipo: 'error', texto: 'No pude abrir a Riso. Revisa tu conexión e inténtalo de nuevo.' }); });
  }
  function cerrar() { if (!P) return; P.raiz.hidden = true; d.documentElement.classList.remove('rsa-abierto'); enviarLote(); try { if (foco && foco.focus) foco.focus({ preventScroll: true }); } catch (e) {} }

  // ---------- 4. Acceso desde toda la academia: barra superior e Inicio ----------
  function botonBarra() {
    if (d.getElementById('risoTop')) return;
    var help = d.getElementById('v2Help'); if (!help || !help.parentNode) return;
    var b = el('button', 'icon-btn rsa-top'); b.type = 'button'; b.id = 'risoTop'; b.setAttribute('aria-label', 'Pregúntale a Riso'); b.title = 'Pregúntale a Riso';
    b.appendChild(avatar('rsa-top__av', 'neutro'));
    b.addEventListener('click', function () { abrir(); });
    help.parentNode.insertBefore(b, help);
  }
  function tarjetaInicio() {
    var hoy = d.getElementById('v2HoyT'); if (!hoy) return;
    var cont = hoy.parentNode; if (!cont || cont.querySelector('.rsa-tarea')) return;
    var a = el('button', 'v2-task rsa-tarea'); a.type = 'button';
    var ic = el('span', 'v2-task__ic rsa-tarea__ic'); ic.appendChild(avatar('rsa-tarea__av', 'neutro')); a.appendChild(ic);
    var t = el('span'); t.appendChild(el('b', null, 'Pregúntale a Riso')); t.appendChild(el('small', null, 'Tus dudas de inglés, cuando las tengas')); a.appendChild(t);
    a.addEventListener('click', function () { abrir(); });
    var meta = d.getElementById('v2Goal');
    if (meta && meta.parentNode === cont) cont.insertBefore(a, meta); else cont.appendChild(a);
  }
  function vigilar() {
    var pendiente = false;
    new MutationObserver(function () { if (pendiente) return; pendiente = true; requestAnimationFrame(function () { pendiente = false; botonBarra(); tarjetaInicio(); }); })
      .observe(d.body, { childList: true, subtree: true });
    botonBarra(); tarjetaInicio();
  }

  function activar(st) {
    ESTADO = st; root.__risoActivo = true; d.documentElement.classList.add('riso-on');
    var css = el('link'); css.rel = 'stylesheet'; css.href = BASE + 'riso-academia.css?v=' + V; d.head.appendChild(css);
    vigilar();
    try { root.dispatchEvent(new CustomEvent('riso:activo')); } catch (e) {}
    if (/[?&#]riso=1\b/.test(location.search + location.hash)) abrir();
  }

  root.RisoAcademia = { botonEjercicio: botonEjercicio, decorar: decorar, abrir: abrir, cerrar: cerrar, _int: { contextoDe: contextoDe, prefijo: prefijo, PORQUE: PORQUE } };
  consultarEstado().then(function (st) { if (st && st.enabled === true) activar(st); });
})(typeof window !== 'undefined' ? window : this);
