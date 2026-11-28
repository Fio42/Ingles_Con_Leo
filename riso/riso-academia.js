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
  var d = document, V = '20261128d';
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
      acerto: ctx.isCorrect === true, explicacion: texto(pl.baseExplanation).slice(0, 400), palabraIdx: typeof ctx.pickedIdx === 'number' ? ctx.pickedIdx : null,
      clave: claveDe(error, it, texto(pl.correctAnswer), texto(error ? ctx.userAnswer : pl.studentAnswer))
    };
  }
  // Lo que el alumno querrá pronunciar: la palabra correcta del ejercicio (en «encuentra el error», la corregida; si la
  // opción correcta es una frase, las palabras que la distinguen de la que eligió). Sale de los datos, no se inventa.
  function claveDe(error, it, correcta, elegida) {
    var limpia = function (t) { return String(t || '').replace(/[.,!?;:"“”«»()]/g, ' ').replace(/\s+/g, ' ').trim(); };
    if (error) return limpia(it.rightWord || '');
    var c = limpia(correcta), e = limpia(elegida);
    if (!c) return '';
    if (c.split(' ').length <= 3) return c;
    var ee = e.toLowerCase().split(' '), dif = c.split(' ').filter(function (w) { return ee.indexOf(w.toLowerCase()) < 0; });
    return dif.length && dif.length <= 3 ? dif.join(' ') : '';
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
    ULTIMO = { ejercicio: c, payload: payload, ctx: ctx, host: host };   // la corrección que el alumno tiene en pantalla
    var box = el('div', 'leo-ai rsa-preg');
    var b = el('button', 'leo-ai-btn rsa-preg__btn'); b.type = 'button';
    b.appendChild(avatar('rsa-preg__av', 'neutro')); b.appendChild(el('span', null, 'Pregúntale a Riso'));
    b.addEventListener('click', function () { abrir({ ejercicio: c, payload: payload, ctx: ctx }); });
    box.appendChild(b); host.appendChild(box);
    return box;
  }

  // ---------- 3. La conversación (un solo panel para toda la academia) ----------
  var ULTIMO = null; // última corrección mostrada { ejercicio, payload, ctx, host }
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
    var insistir = !!(P && P.insistir);
    if (P) P.ultimoBreve = false;
    function pedir(pregunta, contexto) {
      var b = { mode: 'chat', pregunta: pregunta, historial: p.historial, contexto: contexto };
      if (insistir) b.insistencia = true;
      return LeoBackend.askLeoAI(b);
    }
    var primero = conCtx ? pedir(p.pregunta, conCtx) : pedir(((c ? prefijo(c) : '') + p.pregunta).slice(0, 400), null);
    return primero.then(function (r) {
      if (r && !r.ok && r.reason === 'bad_context' && c) return pedir((prefijo(c) + p.pregunta).slice(0, 400), null);
      return r;
    }).then(function (r) {
      if (!r || !r.ok || !r.answer || typeof r.answer.texto !== 'string') throw new Error((r && r.reason) || 'error');
      var a = r.answer;
      if (P) P.ultimoBreve = a.breve === true;
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
      ctx: raiz.querySelector('.rsa__ctx'), ctxTxt: raiz.querySelector('.rsa__ctx-t'), tutor: null, ejercicio: null, payload: null, ctxApp: null, explicados: {}, pasosVistos: {}, ocupado: false, lote: [], ultimo: null };
    raiz.addEventListener('click', function (e) { if (e.target && e.target.hasAttribute('data-cerrar')) cerrar(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !raiz.hidden) cerrar(); });
    raiz.querySelector('.rsa__ctx-q').addEventListener('click', function () { nuevoTutor(); ponerEjercicio(null, null); ULTIMO = null; });
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
    if (r.pasos) {
      // Los pasos siguientes de siempre (leoAiNextSteps en app.js): mismos textos y destinos; Riso solo los presenta.
      if (r.pasos.intro) m.appendChild(el('div', 'rsa-pasos__intro', r.pasos.intro));
      r.pasos.links.forEach(function (l) { var a = el('a', 'rsa-ref rsa-paso', l.text); a.href = l.href; if (l.key) a.setAttribute('data-ai-next', l.key); m.appendChild(a); });
      if (r.pasos.note) m.appendChild(el('div', 'rsa-aviso', r.pasos.note));
      m.addEventListener('click', function (ev) { var a = ev.target && ev.target.closest && ev.target.closest('[data-ai-next]'); if (a) { try { trackLeoEvent('leo_ai_next_clicked', { tipo: a.getAttribute('data-ai-next') }); } catch (e) {} } });
    }
    var mt = r.metrica;
    if (mt && /^(codigo|biblioteca|faq|cache|ia)$/.test(mt.c)) {
      var v = el('button', 'rsa-voto', 'No me ayudó'); v.type = 'button';
      v.onclick = function () { v.disabled = true; v.textContent = 'Gracias, lo revisaremos.'; if (r.kq && P.porqueDado) P.porqueDado[r.kq] = 'no_ayudo'; try { LeoBackend.getClient().rpc('riso_valorar', { p_capa: mt.c, p_intencion: mt.i, p_tema: mt.t }).then(function () {}, function () {}); } catch (e) {} };
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
  function ponerEjercicio(c, payload, ctxApp) {
    P.ejercicio = c; P.payload = payload; P.ctxApp = ctxApp || null;
    P.ctx.hidden = !c;
    if (c) P.ctxTxt.textContent = 'Hablando del ejercicio: «' + c.enunciado + '»' + (c.respuestaAlumno ? ' · tu respuesta: «' + c.respuestaAlumno + '»' : '');
    chips();
  }

  // «¿Por qué?» de un ejercicio: la explicación de Leo AI de siempre (no repite lo que ya leyó, calidad revisada). Una vez por ejercicio.
  var PORQUE = /^\s*¿?\s*(y\s+)?por\s*qu[eé](?![a-záéíóúñ]).{0,40}$/i; // sin \b: en JavaScript la «é» no cuenta como letra
  function explicarPorQue(q) {
    var c = P.ejercicio, clave = c && (c.itemId + '|' + c.respuestaAlumno);
    // Ejercicio que el servidor puede verificar (práctica de gramática): Riso responde con la explicación ya vista como
    // referencia y la orden de complementarla. Los demás (vocabulario, listening, lectura) usan Leo AI, que recibe el texto.
    if (c && c.respuestaServidor) return null;
    if (!c || !P.payload || P.explicados[clave] || !PORQUE.test(q)) return null;
    P.explicados[clave] = 1;
    return Promise.resolve().then(function () { return LeoBackend.askLeoAI(P.payload); }).catch(function () { return { ok: false }; }).then(function (res) {
      var a = res && res.ok && res.answer;
      if (!a || typeof a.explanation !== 'string') { delete P.explicados[clave]; return { capa: 0, tipo: 'error', reintentar: true, texto: 'No pude responder ahora. Toca «Reintentar» en unos segundos. La explicación del ejercicio sigue siendo válida.' }; }
      return { capa: 5, tipo: 'explicacion', texto: a.explanation, ej: a.example_en ? [[a.example_en, a.example_es || '']] : [], aviso: 'Generada con IA. Puede tener errores.', metrica: { c: 'ia', i: 'ejercicio', t: 'explicar' } };
    });
  }
  // La clase del tema del ejercicio: el MISMO enlace «Ver la clase» que muestra la corrección (sin IA, sin otro motor).
  function pasosClase() {
    try {
      var a = ULTIMO && ULTIMO.host && ULTIMO.ejercicio === P.ejercicio ? ULTIMO.host.querySelector('a[href*="via=rec"], a[href*="articulo-"], a[href*="/glosario/"]') : null;
      return a ? { intro: '', links: [{ href: a.getAttribute('href'), text: a.textContent.replace(/\s*↗\s*$/, '').trim() }], note: '' } : null;
    } catch (e) { return null; }
  }
  function pasosSiguientes() {
    var c = P.ejercicio, k = c && (c.itemId + '|' + c.respuestaAlumno);
    if (!c || !P.ctxApp || P.pasosVistos[k]) return null;
    try {
      var ns = typeof root.leoAiNextSteps === 'function' ? root.leoAiNextSteps(P.ctxApp) : null;
      if (ns && ns.links && ns.links.length) {
        P.pasosVistos[k] = 1;
        try { trackLeoEvent('leo_ai_next_shown', { tier: root.__leoMemberVerified === true ? 'member' : 'free', links: ns.links.length }); } catch (e) {}
        return { intro: ns.intro, links: ns.links, note: ns.note || '' };
      }
      var rp = typeof root.leoAiRepeatPractice === 'function' ? root.leoAiRepeatPractice(P.ctxApp) : null;
      if (rp) { P.pasosVistos[k] = 1; return { intro: '', links: [{ href: rp.href, text: rp.text }], note: '' }; }
    } catch (e) {}
    return null;
  }

  // «¿Cómo se pronuncia?» en un ejercicio: la palabra clave del ejercicio. Primero la pronunciación verificada del glosario
  // (con su ficha y su audio); si la expresión no está, prueba sus palabras; si ninguna está, Riso la explica sin inventar audios.
  function verificada(w) {
    var R = root.RisoTutor && root.RisoTutor._int, K = root.RISO_CONOCIMIENTO;
    if (!R || !K || !w) return false;
    try { return !!R.herramientaGlosario({ tipo: 'pronunciacion', objeto: w }, R.norm(w), K); } catch (e) { return false; }
  }
  function palabraParaPronunciar(c) {
    var w = c && c.clave;
    if (!w) return '';
    if (verificada(w)) return w;
    var partes = w.split(' ').filter(function (x) { return x.length > 1; }).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < partes.length; i++) if (verificada(partes[i])) return partes[i];
    return w;
  }
  var MAS_FACIL = /^¿?\s*expl[ií]camelo m[aá]s f[aá]cil\s*\??$/i;
  function concretar(q) {
    var c = P.ejercicio;
    if (c && /^¿?\s*c[oó]mo se pronuncia\s*\??$/i.test(q.trim())) {
      var w = palabraParaPronunciar(c);
      if (w) return { texto: '¿Cómo se pronuncia «' + w + '»?', sinContexto: true };
    }
    if (c && MAS_FACIL.test(q.trim())) return { texto: 'Explícamelo más fácil, con palabras sencillas pero sin perder exactitud.', sinContexto: false };
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
    // «¿Por qué?» otra vez sobre el mismo ejercicio. Estado de la explicación anterior:
    //   'util'     Riso ya dio una explicación real y el alumno no dijo «No me ayudó»: se lo recuerda, sin IA.
    //   'breve'    solo hubo la respuesta corta de respaldo, o 'no_ayudo': el alumno marcó «No me ayudó».
    //              En esos dos casos Riso vuelve a explicar, de otra forma (insistencia).
    //   'agotado'  ni insistiendo hubo una explicación nueva: Riso lo dice con honestidad y ofrece la clase, sin IA.
    var kq = P.ejercicio && PORQUE.test(t) ? P.ejercicio.itemId + '|' + P.ejercicio.respuestaAlumno : null;
    var antes = kq && P.porqueDado ? P.porqueDado[kq] : null;
    P.insistir = antes === 'breve' || antes === 'no_ayudo';
    if (antes === 'util' || antes === 'agotado') {
      clearTimeout(timer);
      msgRiso({ capa: 1, texto: antes === 'util' ? 'Te lo expliqué justo arriba. Si quieres, te doy otro ejemplo, te lo explico más fácil o vemos la pronunciación.'
        : 'No tengo otra forma de explicarlo sin repetir la corrección. Te puede ayudar la clase del tema, o te doy otro ejemplo.', pasos: antes === 'agotado' ? pasosClase() : null });
      P.ocupado = false; ajustar(); return Promise.resolve();
    }
    // Al insistir, la pregunta que viaja dice que la anterior no sirvió (y no puede tomarse por la misma pregunta repetida).
    var conc = P.insistir ? { texto: '¿Por qué? Explícamelo de otra forma.', sinContexto: false } : concretar(t);
    var porque = P.insistir ? null : explicarPorQue(t);
    var tarea = porque || P.tutor.preguntar(conc.texto, conc.sinContexto || !P.ejercicio ? null : { itemId: P.ejercicio.itemId, fuente: 'academia', tema: P.ejercicio.tema, enunciado: P.ejercicio.enunciado, respuestaAlumno: P.ejercicio.respuestaAlumno, respuestaCorrecta: P.ejercicio.respuestaCorrecta });
    return Promise.resolve(tarea).then(function (r) {
      clearTimeout(timer); pensando.remove();
      if (porque && r.capa === 5 && P.tutor.anotar) P.tutor.anotar(t, r.texto + (r.ej && r.ej[0] ? ' Ejemplo mostrado: ' + r.ej[0][0] : ''));
      if (kq && r.capa === 5) { P.porqueDado = P.porqueDado || {}; P.porqueDado[kq] = (!porque && P.ultimoBreve) ? (P.insistir ? 'agotado' : 'breve') : 'util'; r = Object.assign({}, r, { kq: kq }); }
      if (P.ejercicio && PORQUE.test(t) && r.capa === 5) { var ps = pasosSiguientes(); if (ps) r = Object.assign({}, r, { pasos: ps }); }
      msgRiso(r);
    }).catch(function () { clearTimeout(timer); pensando.remove(); msgRiso({ capa: 0, tipo: 'error', reintentar: true, texto: 'No pude responder ahora. Toca «Reintentar» en unos segundos.' }); })
      .then(function () { P.ocupado = false; P.insistir = false; ajustar(); });
  }

  // Un motor por conversación: el historial que viaja al modelo y las respuestas ya dadas pertenecen a UN ejercicio (o a la
  // conversación libre). El uso del día se conserva.
  function nuevoTutor() {
    var plan = ESTADO.member ? 'miembro' : 'gratis', usadas = P.tutor ? P.tutor.metricas().usadasHoy : (ESTADO.usadas || 0);
    root.RisoTutor.CONFIG.cuotaDiaria[plan] = ESTADO.cupo || 0;
    P.porqueDado = {};
    P.tutor = root.RisoTutor.crear({ plan: plan, usadasHoy: usadas, generar: generar,
      medir: function (m) { P.lote.push(m); if (P.lote.length >= 20) enviarLote(); } });
  }
  var foco = null;
  function abrir(opts) {
    opts = opts || {};
    if (!ESTADO) return;
    if (!P) crearPanel();
    foco = d.activeElement;
    P.raiz.hidden = false; d.documentElement.classList.add('rsa-abierto');
    return motorListo().then(function () {
      if (!P.tutor) { nuevoTutor(); msgRiso({ capa: 1, texto: root.RisoTutor.CONFIG.saludo }); }
      // Desde la barra superior o Inicio: si en pantalla sigue la corrección de un ejercicio, la conversación es sobre ese
      // ejercicio; si no (pasó al siguiente, o no hay ejercicio), es una conversación libre. Nunca la del ejercicio anterior.
      if (!opts.ejercicio && ULTIMO && ULTIMO.host && ULTIMO.host.isConnected) opts = { ejercicio: ULTIMO.ejercicio, payload: ULTIMO.payload, ctx: ULTIMO.ctx };
      if (opts.ejercicio) {
        var nuevo = !P.ejercicio || P.ejercicio !== opts.ejercicio;
        if (nuevo) nuevoTutor();   // otro ejercicio: conversación nueva para el modelo (la pantalla conserva lo anterior)
        ponerEjercicio(opts.ejercicio, opts.payload, opts.ctx);
        if (nuevo) msgRiso({ capa: 1, texto: opts.ejercicio.acerto ? '¡Bien hecho! Ya viste la explicación del ejercicio. Si quieres, te doy otro ejemplo, un truco para recordarlo o lo que necesites.' : 'Ya viste la corrección. ¿Qué parte no te quedó clara? Puedo explicarte por qué, darte otro ejemplo o ayudarte con la pronunciación.' });
      } else if (P.ejercicio || !P.chips.childNodes.length) {
        if (P.ejercicio) nuevoTutor();
        ponerEjercicio(null, null);
      }
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
  // ---------- 5. Riso presenta las recomendaciones automáticas de la plataforma ----------
  // No hay otro motor ni IA: los diagnósticos, textos, enlaces y destinos son los que ya calcula app.js con los resultados
  // reales del alumno (sessionInsight, «Para reforzar», «Hoy te conviene», patrones de error, el porqué de la sesión
  // recomendada). Riso solo firma el bloque, una vez. Cero llamadas a Gemma, cero neuronas.
  var RECOMENDACIONES = [
    ['.session-summary .sess-insight', 'Lo que noté en tu sesión'],
    ['.diag-today-card', 'Según tus resultados'],
    ['.mistake-patterns', 'Lo que noté en tus errores']
  ];
  function firma(caption) {
    var f = el('div', 'rsa-rec'); f.appendChild(avatar('rsa-rec__av', 'neutro')); f.appendChild(el('b', null, 'Riso'));
    if (caption) f.appendChild(el('span', null, caption));
    return f;
  }
  function firmarRecomendaciones() {
    RECOMENDACIONES.forEach(function (r) {
      d.querySelectorAll(r[0]).forEach(function (b) {
        if (b.closest('.rsa') || b.querySelector(':scope > .rsa-rec') || b.parentElement.closest('.rsa-firmado')) return;
        b.classList.add('rsa-firmado'); b.insertBefore(firma(r[1]), b.firstChild);
      });
    });
    // «Lo que vemos en tus respuestas» (diagnóstico del progreso): la tarjeta que contiene la lista de hallazgos.
    d.querySelectorAll('.diag-card > .diag-insights').forEach(function (l) {
      var b = l.parentElement; if (b.closest('.rsa-firmado') || b.querySelector(':scope > .rsa-rec')) return;
      b.classList.add('rsa-firmado'); b.insertBefore(firma('Lo que noté en tus respuestas'), b.firstChild);
    });
    // Botones de análisis creados antes de que Riso se activara («Analizar mi sesión con Leo AI»): mismo botón, con su nombre.
    d.querySelectorAll('.leo-ai-btn span').forEach(function (t) { if (/ con Leo AI$/.test(t.textContent)) t.textContent = t.textContent.replace(/ con Leo AI$/, ' con Riso'); });
    // El porqué de la recomendación principal (Inicio y Practicar): la misma línea, con Riso al lado.
    d.querySelectorAll('.v2-next__why').forEach(function (w) {
      if (w.querySelector('.rsa-why__av')) return;
      w.classList.add('rsa-why'); w.insertBefore(avatar('rsa-why__av', 'neutro'), w.firstChild);
    });
  }
  function vigilar() {
    var pendiente = false;
    new MutationObserver(function () { if (pendiente) return; pendiente = true; requestAnimationFrame(function () { pendiente = false; botonBarra(); tarjetaInicio(); firmarRecomendaciones(); }); })
      .observe(d.body, { childList: true, subtree: true });
    botonBarra(); tarjetaInicio(); firmarRecomendaciones();
  }

  function activar(st) {
    ESTADO = st; root.__risoActivo = true; d.documentElement.classList.add('riso-on');
    var css = el('link'); css.rel = 'stylesheet'; css.href = BASE + 'riso-academia.css?v=' + V; d.head.appendChild(css);
    vigilar();
    try { root.dispatchEvent(new CustomEvent('riso:activo')); } catch (e) {}
    if (/[?&#]riso=1\b/.test(location.search + location.hash)) abrir();
  }

  root.RisoAcademia = { botonEjercicio: botonEjercicio, decorar: decorar, abrir: abrir, cerrar: cerrar, _int: { contextoDe: contextoDe, prefijo: prefijo, PORQUE: PORQUE, claveDe: claveDe, firmarRecomendaciones: firmarRecomendaciones } };
  consultarEstado().then(function (st) { if (st && st.enabled === true) activar(st); });
})(typeof window !== 'undefined' ? window : this);
