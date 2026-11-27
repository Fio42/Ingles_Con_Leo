/* Riso · motor del tutor (cliente). Prototipo local: no llama a ningún servicio real.
   Capas, en orden (la primera que responde gana):
     1 filtro      : vacío, demasiado largo, datos personales, abuso, intentos de cambiar las reglas,
                     temas sensibles, saludos, cuenta/pagos (→ Soporte), preguntas sobre Profe Leo.
     2 herramientas: números, años, horas, fechas, verbos irregulares, conjugación, glosario. Exactas, sin IA.
     3 FAQ revisada: respuestas escritas a mano (tools/tutor/faq.js → conocimiento.js).
     4 búsqueda    : sugiere la guía del sitio más cercana (se adjunta a la respuesta de la capa 5).
     5 generativa  : modelo barato. Aquí SIEMPRE simulado (opts.generar). En producción iría por la
                     Edge Function leo-ai (modo "chat"), con cuotas y presupuesto del servidor.
   Controles locales: longitud, frecuencia (rate limit), cuota diaria por cuenta, presupuesto simulado,
   historial limitado, deduplicación por sesión, caché SOLO de respuestas exactas o revisadas.
   Nunca se cachean ni comparten respuestas generadas para un alumno. */
(function (root) {
  'use strict';
  var CONFIG = {
    nombre: 'Riso',
    maxCaracteres: 400,
    maxHistorial: 6,            // turnos que se envían como contexto a la capa 5
    rateMs: 1500,               // una pregunta abierta cada 1,5 s
    rafaga: { n: 6, ventanaMs: 60000 }, // máximo 6 preguntas por minuto
    cuotaDiaria: { miembro: 30, gratis: 3, visitante: 0 }, // solo cuenta la capa 5
    cache: 200
  };

  // ---------- utilidades ----------
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(\d):(\d)/g, '$1\u0001$2').replace(/(\d)[.,](\d)/g, '$1\u0002$2')
      .replace(/[¿?¡!.,;:"“”()\[\]]/g, ' ').replace(/\u0001/g, ':').replace(/\u0002/g, '.').replace(/['’]/g, "'").replace(/\s+/g, ' ').trim();
  }
  function tokens(s) { return norm(s).replace(/'/g, ' ').split(' ').filter(Boolean); }
  var VACIAS = 'el la los las un una de del en y o que como cual cuando se es por para con mi me te lo le al a uso usar dice decir ingles explicame explica diferencia entre'.split(' ');
  function claves(s) { return tokens(s).filter(function (t) { return VACIAS.indexOf(t) < 0; }); }
  function jaccard(a, b) {
    var A = {}, n = 0, u = {};
    a.forEach(function (x) { A[x] = 1; u[x] = 1; });
    b.forEach(function (x) { if (A[x]) n++; u[x] = 1; });
    var tot = Object.keys(u).length;
    return tot ? n / tot : 0;
  }
  function resp(capa, texto, extra) {
    var r = { capa: capa, texto: texto };
    for (var k in extra || {}) r[k] = extra[k];
    return r;
  }

  // ---------- capa 1: filtro ----------
  var RE_EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
  var RE_TARJETA = /\b(?:\d[ -]?){13,19}\b/;
  var RE_TEL = /(?:\+?\d[\d\s-]{8,}\d)/;
  var RE_CLAVE = /\b(contrasena|password|clave|cvv|pin)\b\s*(es|:|=)/;
  var INSULTOS = /\b(idiota|estupido|imbecil|pendejo|mierda|puta|fuck|stupid|bitch|cabron|marica)\b/;
  var INYECCION = /(ignora|olvida|ignore|forget)\b.{0,30}\b(instrucciones|reglas|instructions|rules|anterior|previous)|system prompt|prompt del sistema|modo desarrollador|developer mode|jailbreak|actua como si no tuvieras/;
  var SENSIBLE = /\b(suicid|matarme|quitarme la vida|hacerme dano|autolesion|me quiero morir)/;
  var CUENTA = /\b(pago|pagar|cobro|cobraron|reembolso|devolucion|tarjeta|paypal|mercado pago|stripe|suscripcion|membresia|cancelar|factura|precio|cuesta la|contrasena|iniciar sesion|no puedo entrar|mi cuenta|correo de confirmacion)\b/;
  var PROFE = /\b(profe leo|eres leo|eres humano|eres una persona|quien eres|que eres|eres un robot|eres una ia|eres real)\b/;
  var SALUDO = /^(hola|hello|hi|hey|buenas|buenos dias|buenas tardes|buenas noches|que tal)( riso)?$/;
  var GRACIAS = /^(gracias|muchas gracias|thanks|thank you|ok gracias|genial gracias|listo)( riso)?$/;

  function capaFiltro(q) {
    var n = norm(q);
    if (!n) return resp(1, 'Escribe tu pregunta sobre inglés y te ayudo.', { tipo: 'vacio' });
    if (String(q).length > CONFIG.maxCaracteres) return resp(1, 'Tu mensaje es muy largo. Escríbelo en menos de ' + CONFIG.maxCaracteres + ' caracteres, o divídelo en dos preguntas.', { tipo: 'largo' });
    if (RE_EMAIL.test(q) || RE_TARJETA.test(q.replace(/\s/g, ' ')) || RE_CLAVE.test(n) || (RE_TEL.test(q) && /\d{9,}/.test(q.replace(/\D/g, '')))) {
      return resp(1, 'Parece que tu mensaje incluye un dato personal (correo, teléfono, tarjeta o contraseña). Por tu seguridad no lo envié. Escribe la pregunta sin ese dato.', { tipo: 'dato_personal', bloqueado: true });
    }
    if (SENSIBLE.test(n)) return resp(1, 'Siento mucho que estés pasando por esto. No estás solo. Por favor habla ahora con alguien de confianza o con una línea de ayuda de tu país. Si estás en peligro inmediato, llama al número de emergencias local.', { tipo: 'sensible', bloqueado: true });
    if (INYECCION.test(n)) return resp(1, 'Solo puedo ayudarte con inglés. ¿Qué duda tienes?', { tipo: 'inyeccion', bloqueado: true });
    if (INSULTOS.test(n)) return resp(1, 'Estoy aquí para ayudarte con tu inglés. Si algo te frustró, cuéntame qué ejercicio fue y lo vemos juntos.', { tipo: 'abuso' });
    if (SALUDO.test(n)) return resp(1, '¡Hola! Soy ' + CONFIG.nombre + '. Pregúntame lo que quieras de inglés: una palabra, una regla o cómo se dice algo.', { tipo: 'saludo' });
    if (GRACIAS.test(n)) return resp(1, '¡Con gusto! Sigue practicando, vas muy bien.', { tipo: 'gracias' });
    if (CUENTA.test(n)) return resp(1, 'Eso lo resuelve el equipo de Soporte, no yo. Escríbenos desde la página de contacto y te ayudamos con tu cuenta o tu pago.', { tipo: 'soporte', enlace: 'contacto.html' });
    if (PROFE.test(n)) return resp(1, 'Soy ' + CONFIG.nombre + ', el tutor de inglés con inteligencia artificial de Inglés con Leo. No soy Profe Leo: él crea las lecciones y yo te ayudo a resolver dudas mientras practicas. Puedo equivocarme, así que revisa lo importante con las guías.', { tipo: 'identidad' });
    return null;
  }

  // ---------- capa 2: herramientas exactas ----------
  var U = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var D = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function menor100(n) { return n < 20 ? U[n] : D[Math.floor(n / 10)] + (n % 10 ? '-' + U[n % 10] : ''); }
  function menor1000(n) {
    var c = Math.floor(n / 100), r = n % 100;
    return (c ? U[c] + ' hundred' + (r ? ' ' : '') : '') + (r || !c ? menor100(r) : '');
  }
  function numeroEn(n) {
    if (n === 0) return 'zero';
    var partes = [], escalas = ['', ' thousand', ' million', ' billion'], i = 0;
    while (n > 0 && i < escalas.length) {
      var g = n % 1000;
      if (g) partes.unshift(menor1000(g) + escalas[i]);
      n = Math.floor(n / 1000); i++;
    }
    return partes.join(' ');
  }
  function anioEn(y) {
    if (y >= 2000 && y < 2010) return numeroEn(y);
    if (y % 100 === 0) return menor100(y / 100) + ' hundred';
    var a = Math.floor(y / 100), b = y % 100;
    return menor100(a) + ' ' + (b < 10 ? 'oh ' + U[b] : menor100(b));
  }
  var ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
  function ordinalEn(n) {
    var w = numeroEn(n), p = w.split(/([ -])/), last = p.pop();
    var o = ORD[last] || (/y$/.test(last) ? last.slice(0, -1) + 'ieth' : last + 'th');
    return p.join('') + o;
  }
  function sufijo(n) { var r = n % 100; if (r >= 11 && r <= 13) return 'th'; return ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th'; }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function horaEn(h, m) {
    var h12 = h % 12 || 12, sig = (h12 % 12) + 1;
    var base = numeroEn(h12) + (m === 0 ? " o'clock" : ' ' + (m < 10 ? 'oh ' + U[m] : menor100(m)));
    var alt = null;
    if (m === 15) alt = 'quarter past ' + numeroEn(h12);
    else if (m === 30) alt = 'half past ' + numeroEn(h12);
    else if (m === 45) alt = 'quarter to ' + numeroEn(sig);
    else if (m > 0 && m < 30) alt = menor100(m) + ' past ' + numeroEn(h12);
    else if (m > 30) alt = menor100(60 - m) + ' to ' + numeroEn(sig);
    var franja = h < 12 ? 'in the morning (a. m.)' : h < 18 ? 'in the afternoon (p. m.)' : 'in the evening (p. m.)';
    return { base: base, alt: alt, franja: franja };
  }

  var RELLENO = /\b(como|se|dice|digo|decir|escribe|escribo|en|ingles|el|la|las|son|numero|year|ano|anio|how|do|you|say|que|hora|time|of|de|del|is|it|en ordinal|ordinal|por favor|riso)\b/g;
  function soloDato(n, dato) { return n.replace(dato, ' ').replace(RELLENO, ' ').replace(/\s+/g, '').length === 0; }
  function herramientaNumero(n) {
    var m;
    // horas: 7:30, 07:05, 19:45
    if ((m = n.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)) && soloDato(n, m[0])) {
      var h = +m[1], mi = +m[2], r = horaEn(h, mi);
      return resp(2, 'Las ' + m[1] + ':' + m[2] + ' se dice «' + r.base + '»' + (r.alt ? ', o también «' + r.alt + '»' : '') + '. Si necesitas aclarar la parte del día, agrega «' + r.franja + '».', { tipo: 'hora', ej: [['It\'s ' + r.base + '.', 'Son las ' + m[1] + ':' + m[2] + '.']], ref: 'articulo-hora-en-ingles.html' });
    }
    // fechas: 3 de mayo (de 2026)
    var reF = new RegExp('\\b([0-3]?\\d) de (' + MESES.join('|') + ')(?: de (\\d{4}))?');
    if ((m = n.match(reF)) && soloDato(n, m[0])) {
      var d = +m[1], mes = MESES.indexOf(m[2]);
      if (d >= 1 && d <= 31) {
        var esc = MONTHS[mes] + ' ' + d + sufijo(d) + (m[3] ? ', ' + m[3] : '');
        var dicho = MONTHS[mes] + ' ' + ordinalEn(d) + (m[3] ? ', ' + anioEn(+m[3]) : '');
        return resp(2, 'Se escribe «' + esc + '» y se dice «' + dicho + '». En inglés británico también se dice «the ' + ordinalEn(d) + ' of ' + MONTHS[mes] + '». Los meses siempre llevan mayúscula.', { tipo: 'fecha', ej: [['My birthday is on ' + MONTHS[mes] + ' ' + d + sufijo(d) + '.', 'Mi cumpleaños es el ' + d + ' de ' + m[2] + '.']], ref: 'articulo-dias-meses-fechas-ingles.html' });
      }
    }
    // años: "como se dice el año 1999", "año 2026"
    if ((m = n.match(/\b(?:ano|year|anio)\s+(1[1-9]\d\d|20\d\d)\b/)) || (m = n.match(/\b(19\d\d|20\d\d)\b/)) && /\b(ano|year|anio)\b/.test(n)) {
      if (!soloDato(n, m[1])) m = null;
    }
    if (m && m[1] && /^(1[1-9]\d\d|20\d\d)$/.test(m[1]) && /\b(ano|year|anio)\b/.test(n)) {
      var y = +m[1];
      return resp(2, 'El año ' + y + ' se dice «' + anioEn(y) + '». Los años se leen normalmente en dos bloques de dos cifras.', { tipo: 'anio', ej: [['I was born in ' + y + '.', 'Nací en ' + y + '.']], ref: 'articulo-numeros-en-ingles.html' });
    }
    // ordinales: "como se dice 21 en ordinal", "21st"
    if ((m = n.match(/\b(\d{1,4})\b.*\bordinal|\bordinal\b.*\b(\d{1,4})\b/)) && soloDato(n, m[1] || m[2])) {
      var o = +(m[1] || m[2]);
      return resp(2, 'El ordinal de ' + o + ' es «' + ordinalEn(o) + '» y se abrevia ' + o + sufijo(o) + '.', { tipo: 'ordinal', ref: 'articulo-numeros-en-ingles.html' });
    }
    // números: "como se dice 345 en ingles", "345 en ingles"
    if ((m = n.match(/\b(\d{1,3}(?:[ .]\d{3})*|\d{1,10})\b/)) && soloDato(n, m[1]) && /(se dice|como digo|en ingles|escribe|numero|how do you say|^\d)/.test(n)) {
      var num = +m[1].replace(/[ .]/g, '');
      if (num <= 999999999999) {
        var w = numeroEn(num);
        return resp(2, num.toLocaleString('es') + ' se dice «' + w + '».' + (/hundred \w/.test(w) ? ' En inglés británico se agrega «and» antes de las decenas: «' + w.replace(/hundred (?!and)/, 'hundred and ') + '».' : '') + (num >= 1000 ? ' Ojo: en inglés los miles se separan con coma (' + num.toLocaleString('en') + ').' : ''), { tipo: 'numero', ref: 'articulo-numeros-en-ingles.html' });
      }
    }
    return null;
  }

  var ESPECIALES = { be: ['was / were', 'been', 'ser, estar'], have: ['had', 'had', 'tener'], do: ['did', 'done', 'hacer'] };
  function buscarVerbo(K, v) {
    for (var i = 0; i < K.verbos.length; i++) if (K.verbos[i][0] === v) return K.verbos[i];
    for (i = 0; i < K.verbos.length; i++) { var f = K.verbos[i]; if (f[1].split(' / ').indexOf(v) >= 0 || f[2].split(' / ').indexOf(v) >= 0) return f; }
    return null;
  }
  function terceraPersona(v) {
    if (v === 'have') return 'has'; if (v === 'be') return 'is'; if (v === 'do') return 'does'; if (v === 'go') return 'goes';
    if (/(s|sh|ch|x|z|o)$/.test(v)) return v + 'es';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
    return v + 's';
  }
  var DOBLA = 'stop plan drop shop chat jog rob beg hug prefer admit commit refer occur control travel'.split(' ');
  function pasadoRegular(v) {
    if (/e$/.test(v)) return v + 'd';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
    if (DOBLA.indexOf(v) >= 0) return v + v.slice(-1) + 'ed';
    return v + 'ed';
  }
  function gerundio(v) {
    if (v === 'be') return 'being'; if (/ie$/.test(v)) return v.slice(0, -2) + 'ying';
    if (/[^e]e$/.test(v) && v !== 'see') return v.slice(0, -1) + 'ing';
    if (DOBLA.indexOf(v) >= 0 || 'run sit swim get put cut begin win'.split(' ').indexOf(v) >= 0) return v + v.slice(-1) + 'ing';
    return v + 'ing';
  }
  var COMUNES = 'work play live want need like love study watch talk walk call help start finish open close clean cook dance listen learn travel use ask answer try stay wait visit change move plan stop arrive decide enjoy hope prefer'.split(' ');

  function herramientaVerbo(n, K) {
    var m = n.match(/\b(pasado|past|participio|participle|preterito)\b(?:\s+(?:simple|perfecto))?\s+(?:de|del verbo|of)?\s*(?:to\s+)?([a-z]+)\b/) ||
            n.match(/\b(conjuga|conjugacion de|conjugar|conjugame|formas de|forms of)\s+(?:el verbo\s+)?(?:to\s+)?([a-z]+)\b/) ||
            n.match(/\b([a-z]+)\s+(en pasado|en participio)\b/);
    if (!m) return null;
    var pedido = m[1], v = m[2];
    if (/^en /.test(m[2])) { v = m[1]; pedido = m[2]; }
    if (VACIAS.indexOf(v) >= 0 || v.length < 2) return null;
    var irr = ESPECIALES[v] ? [v, ESPECIALES[v][0], ESPECIALES[v][1], ESPECIALES[v][2]] : buscarVerbo(K, v);
    if (irr && irr[0] !== v && !ESPECIALES[v]) {
      return resp(2, '«' + v + '» es una forma de «' + irr[0] + '» (' + irr[3] + '): ' + irr[0] + ' → ' + irr[1] + ' → ' + irr[2] + '.', { tipo: 'verbo', ref: 'articulo-verbos-irregulares.html' });
    }
    var base = irr ? irr[0] : v, pas = irr ? irr[1] : pasadoRegular(v), part = irr ? irr[2] : pas;
    var regular = !irr;
    if (regular && COMUNES.indexOf(v) < 0) return null; // no sabemos si es un verbo inglés regular: mejor la capa 5
    var lineas = base + ' → ' + pas + ' → ' + part;
    var texto;
    if (/conjug|formas|forms/.test(pedido)) {
      texto = 'Formas de «' + base + '»' + (irr ? ' (' + irr[3] + ', irregular)' : ' (regular)') + ': ' + lineas + '. Presente: I/you/we/they ' + base + ', he/she/it ' + terceraPersona(base) + '. Con -ing: ' + gerundio(base) + '.';
    } else if (/particip/.test(pedido)) {
      texto = 'El participio de «' + base + '» es «' + part + '»' + (irr ? ' (verbo irregular: ' + lineas + ').' : ' (verbo regular: agrega -ed).') + ' Se usa con have/has y en voz pasiva.';
    } else {
      texto = 'El pasado de «' + base + '» es «' + pas + '»' + (irr ? ' (verbo irregular: ' + lineas + ').' : ' (verbo regular: agrega -ed).');
    }
    return resp(2, texto, { tipo: 'verbo', ref: 'articulo-verbos-irregulares.html', seguro: !!irr || COMUNES.indexOf(v) >= 0 });
  }

  function herramientaGlosario(n, K) {
    var m = n.match(/\b(?:que significa|que quiere decir|significado de|que es|meaning of|traduccion de|como se usa|cuando uso|cuando se usa)\s+(?:la palabra\s+)?['"]?([a-z' -]{2,40}?)['"]?(?:\s+en ingles)?$/);
    var vs = n.match(/\b([a-z']+(?: [a-z']+)?)\s+(?:vs|versus|o|y)\s+([a-z']+(?: [a-z']+)?)\b/);
    var cand = [];
    if (vs) cand.push(vs[1] + ' vs ' + vs[2], vs[2] + ' vs ' + vs[1]);
    if (m) cand.push(m[1].trim());
    for (var i = 0; i < cand.length; i++) {
      for (var j = 0; j < K.glosario.length; j++) {
        var g = K.glosario[j];
        if (norm(g.t) === cand[i] || g.s === cand[i].replace(/[ ']+/g, '-')) {
          return resp(2, g.r, { tipo: 'glosario', ej: g.ej ? [g.ej] : [], ref: 'glosario/' + g.s + '/', termino: g.t });
        }
      }
    }
    return null;
  }

  // ---------- capa 3: FAQ revisada ----------
  function capaFaq(q, K) {
    var n = ' ' + norm(q).replace(/'/g, ' ') + ' ', toks = claves(q), mejor = null, mejorS = 0;
    K.faq.forEach(function (f) {
      var tema = f.temas.some(function (grupo) {
        return grupo.every(function (w) { return n.indexOf(' ' + norm(w).replace(/'/g, ' ') + ' ') >= 0; });
      });
      if (!tema) return;
      var s = 0.5 + Math.max.apply(null, f.variantes.map(function (v) { return jaccard(toks, claves(v)); }));
      if (s > mejorS) { mejorS = s; mejor = f; }
    });
    if (!mejor) return null;
    // Si la pregunta es larga y específica (una frase concreta del alumno), la FAQ general no basta.
    if (toks.length > 9 && mejorS < 0.7) return null;
    return resp(3, mejor.r, { tipo: 'faq', id: mejor.id, ej: mejor.ej, ref: mejor.ref, puntaje: +mejorS.toFixed(2) });
  }

  // ---------- capa 4: búsqueda de guía ----------
  function capaBusqueda(q, K) {
    var toks = claves(q).filter(function (t) { return t.length > 2; });
    if (!toks.length) return null;
    var mejor = null, mejorS = 0;
    K.guias.forEach(function (g) {
      var bolsa = ' ' + norm(g.t + ' ' + g.d + ' ' + g.u.replace(/[-.]/g, ' ')) + ' ';
      var s = 0;
      toks.forEach(function (t) { if (bolsa.indexOf(' ' + t + ' ') >= 0) s += 1; else if (t.length > 4 && bolsa.indexOf(t.slice(0, -1)) >= 0) s += 0.5; });
      s = s / toks.length;
      if (s > mejorS) { mejorS = s; mejor = g; }
    });
    return mejorS >= 0.5 ? { u: mejor.u, t: mejor.t, puntaje: +mejorS.toFixed(2) } : null;
  }

  // ---------- controles ----------
  function crear(opts) {
    opts = opts || {};
    var K = opts.conocimiento || root.RISO_CONOCIMIENTO;
    var ahora = opts.ahora || function () { return Date.now(); };
    var plan = opts.plan || 'visitante';
    var estado = { historial: [], tiempos: [], usadasHoy: opts.usadasHoy || 0, dedupe: {}, cache: {}, cacheOrden: [], metricas: { capa1: 0, capa2: 0, capa3: 0, capa5: 0, bloqueadas: 0, cache: 0, limite: 0, errores: 0 } };
    var presupuesto = opts.presupuesto || { disponible: function () { return true; } };

    function limiteFrecuencia() {
      var t = ahora();
      estado.tiempos = estado.tiempos.filter(function (x) { return t - x < CONFIG.rafaga.ventanaMs; });
      var ult = estado.tiempos[estado.tiempos.length - 1];
      if (ult && t - ult < CONFIG.rateMs) return 'Espera un momento antes de enviar otra pregunta.';
      if (estado.tiempos.length >= CONFIG.rafaga.n) return 'Has enviado muchas preguntas seguidas. Espera un minuto y seguimos.';
      estado.tiempos.push(t);
      return null;
    }
    function guardarCache(clave, r) {
      if (r.capa !== 2 && r.capa !== 3) return; // SOLO respuestas exactas o revisadas
      estado.cache[clave] = r; estado.cacheOrden.push(clave);
      if (estado.cacheOrden.length > CONFIG.cache) delete estado.cache[estado.cacheOrden.shift()];
    }
    function registrar(q, r) {
      estado.historial.push({ rol: 'alumno', texto: q }, { rol: 'riso', texto: r.texto });
      if (estado.historial.length > CONFIG.maxHistorial * 2) estado.historial = estado.historial.slice(-CONFIG.maxHistorial * 2);
    }

    /* preguntar(texto, contexto?) → Promise<respuesta>
       contexto (modo contextual, desde un ejercicio): { tema, enunciado, respuestaAlumno, respuestaCorrecta }
       Solo se envían datos del ejercicio: nunca nombre, correo ni progreso. */
    function preguntar(q, ctx) {
      var f = capaFiltro(q);
      if (f) { estado.metricas.capa1++; if (f.bloqueado) estado.metricas.bloqueadas++; if (f.tipo !== 'vacio' && f.tipo !== 'largo') registrar(q, f); return Promise.resolve(f); }
      var clave = norm(q) + (ctx ? '|' + norm(ctx.enunciado || '') : '');
      if (!ctx && estado.cache[clave]) { estado.metricas.cache++; var c = Object.assign({}, estado.cache[clave], { desdeCache: true }); registrar(q, c); return Promise.resolve(c); }
      if (estado.dedupe[clave]) { estado.metricas.cache++; return Promise.resolve(Object.assign({}, estado.dedupe[clave], { repetida: true })); }
      var n = norm(q);
      if (!ctx) {
        var t = herramientaNumero(n) || herramientaVerbo(n, K) || herramientaGlosario(n, K);
        if (t) { estado.metricas.capa2++; guardarCache(clave, t); registrar(q, t); return Promise.resolve(t); }
        var fq = capaFaq(q, K);
        if (fq) { estado.metricas.capa3++; guardarCache(clave, fq); registrar(q, fq); return Promise.resolve(fq); }
      }
      // capa 5
      var cuota = CONFIG.cuotaDiaria[plan] || 0;
      if (estado.usadasHoy >= cuota) {
        estado.metricas.limite++;
        var txt = plan === 'visitante' ? 'Para preguntarme cosas nuevas necesitas una cuenta gratis. Mientras, puedo responder números, horas, fechas, verbos irregulares y palabras del glosario.'
          : plan === 'gratis' ? 'Usaste tus ' + cuota + ' preguntas abiertas de hoy. Con la membresía tienes ' + CONFIG.cuotaDiaria.miembro + ' al día. Las preguntas de números, verbos y glosario siguen siendo ilimitadas.'
          : 'Llegaste a tu límite de preguntas abiertas de hoy. Mañana se renueva. Las preguntas de números, verbos y glosario siguen disponibles.';
        return Promise.resolve(resp(0, txt, { tipo: 'cuota', plan: plan }));
      }
      var lim = limiteFrecuencia(); // solo la capa 5 cuesta dinero: ahí se limita la frecuencia
      if (lim) { estado.metricas.limite++; return Promise.resolve(resp(0, lim, { tipo: 'frecuencia' })); }
      if (!presupuesto.disponible()) { estado.metricas.limite++; return Promise.resolve(resp(0, 'Riso está descansando un rato. Vuelve a intentarlo más tarde; mientras, las guías del sitio tienen la respuesta a casi todo.', { tipo: 'presupuesto' })); }
      var guia = capaBusqueda(q + (ctx && ctx.tema ? ' ' + ctx.tema : ''), K);
      var generar = opts.generar || function () { return Promise.reject(new Error('sin_modelo')); };
      var payload = { pregunta: String(q).slice(0, CONFIG.maxCaracteres), historial: estado.historial.slice(-CONFIG.maxHistorial * 2), contexto: ctx ? { tema: ctx.tema, enunciado: ctx.enunciado, respuestaAlumno: ctx.respuestaAlumno, respuestaCorrecta: ctx.respuestaCorrecta } : null, guia: guia && guia.u };
      var pend = generar(payload).then(function (g) {
        estado.usadasHoy++; estado.metricas.capa5++;
        var texto = String(g && g.texto || '').replace(/\s+/g, ' ').trim().slice(0, 700);
        if (!texto) throw new Error('vacia');
        var r = resp(5, texto, { tipo: 'generativa', ej: g.ej || [], ref: guia ? guia.u : null, refTitulo: guia ? guia.t : null, aviso: 'Respuesta generada con IA. Puede tener errores.' });
        estado.dedupe[clave] = r; // solo para esta sesión y esta persona, nunca compartida
        registrar(q, r);
        return r;
      }).catch(function () {
        estado.metricas.errores++;
        delete estado.dedupe[clave];
        return resp(0, 'No pude responder ahora. Toca «Reintentar» en unos segundos.', { tipo: 'error', reintentar: true });
      });
      return pend;
    }
    return { preguntar: preguntar, metricas: function () { return Object.assign({}, estado.metricas, { usadasHoy: estado.usadasHoy }); }, historial: function () { return estado.historial.slice(); }, config: CONFIG };
  }

  var api = { crear: crear, CONFIG: CONFIG, _int: { norm: norm, numeroEn: numeroEn, anioEn: anioEn, ordinalEn: ordinalEn, horaEn: horaEn, terceraPersona: terceraPersona, pasadoRegular: pasadoRegular, gerundio: gerundio, capaFiltro: capaFiltro, capaFaq: capaFaq, capaBusqueda: capaBusqueda } };
  root.RisoTutor = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
