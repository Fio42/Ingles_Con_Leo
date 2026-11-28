/* Riso, el asistente de Inglés con Leo · motor (cliente). Prototipo local: no llama a ningún servicio real.
   Orden de resolución (la primera que responde gana):
     0 intención   : traducción, significado, pronunciación, conjugación, explicación, corrección, seguimiento u otra.
     1 filtro      : vacío, largo, datos personales, temas sensibles, manipulación, insultos, fuera de alcance,
                     saludos, cuenta y pagos (solo consultas administrativas reales), identidad.
     2 herramientas: números (enteros, decimales, negativos, miles, millones, formatos ambiguos), fechas válidas,
                     horas, conjugación (to be, irregulares, regulares verificados, variantes UK/US),
                     significado y pronunciación del glosario.
     3 FAQ revisada: SOLO para pedidos de explicación; nunca para traducir, pronunciar, conjugar o corregir.
     4 guía        : en modo ejercicio, la del tema del ejercicio; en modo libre, solo si la coincidencia es clara.
     5 generativa  : opts.generar (aquí simulado). Mejor una llamada barata que una respuesta fija incorrecta.
   Privacidad: hay DOS historiales. El visual (lo que ve el alumno) y el enviable (lo único que puede ir al modelo).
   Un mensaje bloqueado nunca entra al enviable, ni a la caché, ni a las métricas con su texto. */
(function (root) {
  'use strict';
  var CONFIG = {
    nombre: 'Riso',
    presentacion: 'El asistente inteligente de Inglés con Leo',
    saludo: '¡Hola! Soy Riso, el asistente de la academia Inglés con Leo 👋 Estoy aquí para ayudarte con tus dudas de inglés, explicarte tus errores y acompañarte mientras practicas. ¿Qué necesitas?', // identidad permanente: Profe Leo es el profesor y creador del método; Riso, la mascota y el asistente inteligente de la academia
    maxCaracteres: 400,
    maxHistorial: 6,                 // mensajes (no turnos) enviables al modelo
    maxCampoContexto: 200,
    rateMs: 1500,
    rafaga: { n: 6, ventanaMs: 60000 },
    cuotaDiaria: { miembro: 30, gratis: 3, visitante: 0 }, // HIPÓTESIS del piloto, no decisión de lanzamiento
    cache: 200,
    umbralGuia: 0.67
  };

  // ---------- utilidades ----------
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(\d):(\d)/g, '$1\u0001$2').replace(/(\d)\.(\d)/g, '$1\u0002$2').replace(/(\d),(\d)/g, '$1\u0003$2')
      .replace(/[¿?¡!.,;:"“”«»()\[\]]/g, ' ').replace(/\u0001/g, ':').replace(/\u0002/g, '.').replace(/\u0003/g, ',')
      .replace(/['’`]/g, "'").replace(/\s+/g, ' ').trim();
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
  function resp(capa, texto, extra) { var r = { capa: capa, texto: texto }; for (var k in extra || {}) r[k] = extra[k]; return r; }
  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  // ---------- datos personales ----------
  var RE_EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
  var RE_TARJETA = /\b(?:\d[ -]?){13,19}\b/;
  var RE_TEL = /(?:\+?\d[\d\s().-]{7,}\d)/g;
  var RE_CLAVE = /\b(contrasena|password|clave|cvv|pin|token|api key)\b\s*(es|:|=|seria)/;
  var RE_DOC = /\b(cedula|pasaporte|dni|curp|rut|ssn)\b\s*(es|:|n|numero)?\s*\d{5,}/;
  function tienePII(texto) {
    var t = String(texto || ''), n = norm(t);
    if (RE_EMAIL.test(t) || RE_CLAVE.test(n) || RE_DOC.test(n)) return true;
    if (RE_TARJETA.test(t) && t.replace(/\D/g, '').length >= 13) return true;
    var tel = t.match(RE_TEL) || [];
    return tel.some(function (x) { return x.replace(/\D/g, '').length >= 9; });
  }
  function limpiarPII(texto) {
    return String(texto || '').replace(RE_EMAIL, '[dato oculto]').replace(RE_TEL, function (x) { return x.replace(/\D/g, '').length >= 9 ? '[dato oculto]' : x; });
  }

  // ---------- intención ----------
  /* Devuelve { tipo, objeto }. objeto = lo que se quiere traducir, pronunciar, conjugar o explicar. */
  function intencion(n, hayHistorial) {
    var m;
    if (hayHistorial && /^(y|e|entonces|pero|otro|otra|dame otro|dame otra|y si|y con|y en|y por|y cuando|mas|tambien)\b/.test(n) && n.split(' ').length <= 7) return { tipo: 'seguimiento' };
    if (hayHistorial && /\b(eso|esa|ese ejemplo|lo anterior|lo que dijiste|tu respuesta)\b/.test(n)) return { tipo: 'seguimiento' };
    if ((m = n.match(/\b(?:como se pronuncia|como pronuncio|como se lee|pronunciacion de|how do you pronounce)\s+(?:la palabra\s+)?['"]?(.+?)['"]?(?:\s+en ingles)?$/))) return { tipo: 'pronunciacion', objeto: m[1].trim() };
    if ((m = n.match(/\b(?:conjuga(?:me)?|conjugacion de|conjugar|formas de|forms of)\s+(?:el verbo\s+)?(?:to\s+)?([a-z]+)\b/))) return { tipo: 'conjugacion', objeto: m[1], pide: 'todo' };
    if ((m = n.match(/\b(pasado|past|participio|participle|preterito|gerundio|tercera persona)\b(?:\s+(?:simple|perfecto|pasado))?\s+(?:de|del verbo|of)?\s*(?:to\s+)?([a-z]+)\b/))) return { tipo: 'conjugacion', objeto: m[2], pide: m[1] };
    if ((m = n.match(/^([a-z]+)\s+(?:en|in)\s+(pasado|participio|past)$/))) return { tipo: 'conjugacion', objeto: m[1], pide: m[2] };
    if (/\b(esta bien|es correcto|es correcta|esta correcto|esta correcta|corrige|corrigeme|revisa|se dice asi|is it correct|is this correct)\b/.test(n)) return { tipo: 'correccion' };
    if ((m = n.match(/\b(?:que significa|que quiere decir|significado de|meaning of|what does)\s+(?:la palabra\s+)?['"]?([a-z' -]{1,40}?)['"]?(?:\s+mean)?(?:\s+en (?:ingles|espanol))?$/))) return { tipo: 'significado', objeto: m[1].trim() };
    if ((m = n.match(/\b(?:como se dice|como digo|como le digo|como decir|como se escribe|como escribo|traduce|traduceme|traduccion de|how do you say)\s+(.+?)(?:\s+en ingles|\s+in english)?$/))) return { tipo: 'traduccion', objeto: m[1].trim() };
    if (/^-?\d[\d.,]*(\s*(mil|millon|millones))?(\s+en ingles)?$/.test(n) || /^\d{1,2}:\d{2}$/.test(n)) return { tipo: 'traduccion', objeto: n.replace(/\s+en ingles$/, '') };
    if (/\b(cuando uso|cuando se usa|diferencia|explicame|explica|que es|para que sirve|por que se usa|por que no se usa|por que se dice|por que no se dice|como se usa|como funciona|regla|vs|versus)\b/.test(n)) return { tipo: 'explicacion' };
    return { tipo: 'otra' };
  }

  // ---------- capa 1: filtro ----------
  var INSULTOS = /\b(idiota|estupido|imbecil|pendejo|mierda|puta|fuck|stupid|bitch|cabron|marica)\b/;
  var INYECCION = /(ignora|olvida|ignore|forget)\b.{0,30}\b(instrucciones|reglas|instructions|rules|anterior|previous)|system prompt|prompt del sistema|modo desarrollador|developer mode|jailbreak|actua como si no tuvieras/;
  var SENSIBLE = /\b(suicid|matarme|quitarme la vida|hacerme dano|autolesion|me quiero morir)/;
  // Solo consultas administrativas reales (primera persona o acción sobre la cuenta), nunca traducciones.
  var SOPORTE = /\b(me cobraron|me cobran|cobro doble|doble cobro|reembolso|devolucion de mi|devuelvan mi|cancelar mi|cancelar la (membresia|suscripcion)|no puedo (entrar|iniciar sesion|pagar|acceder)|olvide mi contrasena|cambiar mi (correo|contrasena)|mi cuenta|mi pago|mi membresia|mi suscripcion|mi factura|no me llego|renovacion|como pago la membresia|cuanto cuesta la membresia|precio de la membresia)\b/;
  var PROFE = /\b(profe leo|eres leo|eres humano|eres una persona|quien eres|que eres|eres un robot|eres una ia|eres real|eres (mi |un |el )?(profesor|profe|tutor|maestro))\b/;
  var SALUDO = /^(hola|hello|hi|hey|buenas|buenos dias|buenas tardes|buenas noches|que tal)( riso)?$/;
  var GRACIAS = /^(gracias|muchas gracias|thanks|thank you|ok gracias|genial gracias|listo)( riso)?$/;
  var FUERA = [
    /\b(quien (ganara|gano|va a ganar)|resultado del partido|marcador del|pronostico|apuesta|apostar|loteria|quiniela)\b/,
    /\b(noticias de|que paso hoy en|clima (de|en|hoy|para)|va a llover|precio del dolar|bitcoin|criptomoneda|acciones de)\b/,
    /\b(por quien votar|que opinas del presidente|elecciones de|partido politico)\b/,
    /\b(me duele|sintomas de|que medicamento|dosis de|diagnostico|abogado|demanda legal|debo invertir|invertir en)\b/,
    /\b(ensayo|haz mi tarea|hazme la tarea|hazme el trabajo|\d[\d.,]* palabras sobre|historia de roma|historia universal)\b/,
    /\b(fotosintesis|ecuacion|derivada|integral de|tabla periodica|resuelve (este|esta|el|la)|calcula (el|la)|capital de|programar en|codigo en (python|java))\b/
  ];
  function capaFiltro(q, n, it) {
    if (!n) return resp(1, 'Escribe tu pregunta sobre inglés y te ayudo.', { tipo: 'vacio' });
    if (String(q).length > CONFIG.maxCaracteres) return resp(1, 'Tu mensaje es muy largo. Escríbelo en menos de ' + CONFIG.maxCaracteres + ' caracteres, o divídelo en dos preguntas.', { tipo: 'largo' });
    if (tienePII(q)) return resp(1, 'Parece que tu mensaje incluye un dato personal (correo, teléfono, tarjeta, documento o contraseña). Por tu seguridad no lo envié ni lo guardé. Escribe la pregunta sin ese dato.', { tipo: 'dato_personal', bloqueado: true, privado: true });
    if (SENSIBLE.test(n)) return resp(1, 'Siento mucho que estés pasando por esto. No estás solo. Por favor habla ahora con alguien de confianza o con una línea de ayuda de tu país. Si estás en peligro inmediato, llama al número de emergencias local.', { tipo: 'sensible', bloqueado: true, privado: true });
    if (INYECCION.test(n)) return resp(1, 'Solo puedo ayudarte con inglés. ¿Qué duda tienes?', { tipo: 'inyeccion', bloqueado: true, privado: true });
    if (INSULTOS.test(n)) return resp(1, 'Estoy aquí para ayudarte con tu inglés. Si algo te frustró, cuéntame qué ejercicio fue y lo vemos juntos.', { tipo: 'abuso', privado: true });
    if (SALUDO.test(n)) return resp(1, CONFIG.saludo, { tipo: 'saludo' }); // natural y sencillo: no explica quién es Profe Leo si nadie lo pregunta
    if (GRACIAS.test(n)) return resp(1, '¡Con gusto! Sigue practicando, vas muy bien.', { tipo: 'gracias' });
    var esLengua = it.tipo === 'traduccion' || it.tipo === 'significado' || it.tipo === 'pronunciacion' || it.tipo === 'conjugacion' || it.tipo === 'correccion';
    if (!esLengua && FUERA.some(function (re) { return re.test(n); })) return resp(1, 'Solo puedo ayudarte con inglés. Si quieres, te ayudo a decir eso en inglés: escríbeme «¿Cómo se dice… en inglés?» con la palabra o la frase que necesites.', { tipo: 'fuera_de_alcance' });
    if (!esLengua && SOPORTE.test(n)) return resp(1, 'Eso lo resuelve el equipo de Soporte, no yo. Escríbenos desde la página de contacto y te ayudamos con tu cuenta o tu pago.', { tipo: 'soporte', enlace: 'index.html#contacto' });
    if (!esLengua && PROFE.test(n)) return resp(1, 'Soy ' + CONFIG.nombre + ', la mascota y el asistente inteligente de Inglés con Leo. Profe Leo es el profesor y el creador del método; yo atiendo tus dudas, te doy ejemplos y te acompaño mientras practicas. Uso inteligencia artificial, así que a veces me equivoco: lo importante, revísalo también en las guías.', { tipo: 'identidad' });
    return null;
  }

  // ---------- capa 2a: números ----------
  var U = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var D = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function menor100(n) { return n < 20 ? U[n] : D[Math.floor(n / 10)] + (n % 10 ? '-' + U[n % 10] : ''); }
  function menor1000(n) { var c = Math.floor(n / 100), r = n % 100; return (c ? U[c] + ' hundred' + (r ? ' ' : '') : '') + (r || !c ? menor100(r) : ''); }
  function numeroEn(n) {
    if (n === 0) return 'zero';
    var partes = [], escalas = ['', ' thousand', ' million', ' billion'], i = 0;
    while (n > 0 && i < escalas.length) { var g = n % 1000; if (g) partes.unshift(menor1000(g) + escalas[i]); n = Math.floor(n / 1000); i++; }
    return partes.join(' ');
  }
  function decimalEn(entero, dec) { return numeroEn(entero) + ' point ' + dec.split('').map(function (d) { return U[+d]; }).join(' '); }
  function anioEn(y) {
    if (y >= 2000 && y < 2010) return numeroEn(y);
    if (y % 100 === 0) return menor100(y / 100) + ' hundred';
    var a = Math.floor(y / 100), b = y % 100;
    return menor100(a) + ' ' + (b < 10 ? 'oh ' + U[b] : menor100(b));
  }
  var ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
  function ordinalEn(n) { var p = numeroEn(n).split(/([ -])/), last = p.pop(); return p.join('') + (ORD[last] || (/y$/.test(last) ? last.slice(0, -1) + 'ieth' : last + 'th')); }
  function sufijo(n) { var r = n % 100; if (r >= 11 && r <= 13) return 'th'; return ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th'; }
  function fmtEn(n) { return n.toLocaleString('en-US'); }
  var MAX_NUM = 999999999999;

  /* Interpreta un número escrito por un hispanohablante. Devuelve null si no es un número limpio.
     { negativo, lecturas: [{ valor, decimales?, etiqueta? }] }  (dos lecturas = formato ambiguo) */
  function parseNumero(txt) {
    var m = String(txt).trim().match(/^(-|menos\s+)?(\d[\d.,]*)(?:\s+(mil millones|millones|millon|mil))?$/);
    if (!m) return null;
    var neg = !!m[1], s = m[2], mult = { 'mil': 1e3, 'millon': 1e6, 'millones': 1e6, 'mil millones': 1e9 }[m[3]] || 1;
    var lecturas = [];
    function entero(t) { return /^\d+$/.test(t) ? +t : NaN; }
    var puntos = (s.match(/\./g) || []).length, comas = (s.match(/,/g) || []).length;
    if (!puntos && !comas) lecturas.push({ valor: entero(s) * mult });
    else if (puntos && comas) {
      var ultimo = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',', otro = ultimo === '.' ? ',' : '.';
      var partes = s.split(ultimo); if (partes.length !== 2) return null;
      var ent = partes[0].split(otro);
      if (!ent.slice(1).every(function (g) { return g.length === 3; })) return null;
      lecturas.push({ valor: entero(ent.join('')) * mult, decimales: partes[1] });
    } else {
      var sep = puntos ? '.' : ',', grupos = s.split(sep);
      if (grupos.length > 2) { if (!grupos.slice(1).every(function (g) { return g.length === 3; })) return null; lecturas.push({ valor: entero(grupos.join('')) * mult }); }
      else if (grupos[1].length === 3 && mult === 1) {
        lecturas.push({ valor: entero(grupos.join('')), etiqueta: 'si es una cantidad (miles)' });
        lecturas.push({ valor: entero(grupos[0]), decimales: grupos[1].replace(/0+$/, '') || '0', etiqueta: 'si es un decimal' });
      } else lecturas.push({ valor: entero(grupos[0]) * mult, decimales: mult === 1 ? grupos[1] : null, multDec: mult !== 1 ? grupos[1] : null, mult: mult });
    }
    if (lecturas.some(function (l) { return isNaN(l.valor) || l.valor > MAX_NUM; })) return null;
    return { negativo: neg, lecturas: lecturas, mult: mult };
  }
  function leerLectura(l, neg) {
    var w, cifra;
    if (l.multDec) { // 1,5 millones
      var escala = l.mult === 1e3 ? 'thousand' : l.mult === 1e6 ? 'million' : 'billion';
      var base = Math.round(l.valor / l.mult);
      w = decimalEn(base, l.multDec) + ' ' + escala; cifra = fmtEn(base * l.mult + Math.round(+('0.' + l.multDec) * l.mult));
    } else if (l.decimales) { w = decimalEn(l.valor, l.decimales); cifra = fmtEn(l.valor) + '.' + l.decimales; }
    else { w = numeroEn(l.valor); cifra = fmtEn(l.valor); }
    if (neg) { w = 'minus ' + w; cifra = '-' + cifra; }
    return { w: w, cifra: cifra };
  }
  function herramientaNumero(obj) {
    var p = parseNumero(obj);
    if (!p) return null;
    if (p.lecturas.length === 2) {
      var a = leerLectura(p.lecturas[0], p.negativo), b = leerLectura(p.lecturas[1], p.negativo);
      return resp(2, 'Ese número se puede leer de dos formas. Si es una cantidad en miles: «' + a.w + '» (en inglés se escribe ' + a.cifra + '). Si es un decimal: «' + b.w + '» (en inglés se escribe ' + b.cifra + '). En inglés los miles se separan con coma y los decimales con punto.', { tipo: 'numero', ref: 'articulo-numeros-en-ingles.html' });
    }
    var l = leerLectura(p.lecturas[0], p.negativo), extra = '';
    if (l.w.indexOf('hundred ') >= 0 && !p.lecturas[0].decimales && !p.lecturas[0].multDec) { var uk = l.w.replace(/hundred (?!thousand|million|billion)(?=[a-z])/g, 'hundred and '); if (uk !== l.w) extra += ' En inglés británico se agrega «and» antes de las decenas: «' + uk + '».'; }
    if (p.lecturas[0].decimales || p.lecturas[0].multDec) extra += ' En inglés el decimal se marca con punto (point) y los dígitos después del punto se dicen uno por uno.';
    else if (p.lecturas[0].valor >= 1000) extra += ' En inglés los miles se separan con coma: ' + l.cifra + '.';
    if (p.negativo) extra += ' También se oye «negative» en matemáticas, y «minus» con temperaturas.';
    return resp(2, l.cifra + ' se dice «' + l.w + '».' + extra, { tipo: 'numero', ref: 'articulo-numeros-en-ingles.html' });
  }

  // ---------- capa 2b: horas y fechas ----------
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function bisiesto(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function diasMes(m, y) { return [31, (y == null ? 29 : bisiesto(y) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m]; }
  function horaEn(h, m) {
    var h12 = h % 12 || 12, sig = (h12 % 12) + 1;
    var base = numeroEn(h12) + (m === 0 ? " o'clock" : ' ' + (m < 10 ? 'oh ' + U[m] : menor100(m)));
    var alt = null;
    if (m === 15) alt = 'quarter past ' + numeroEn(h12);
    else if (m === 30) alt = 'half past ' + numeroEn(h12);
    else if (m === 45) alt = 'quarter to ' + numeroEn(sig);
    else if (m > 0 && m < 30) alt = menor100(m) + ' past ' + numeroEn(h12);
    else if (m > 30) alt = menor100(60 - m) + ' to ' + numeroEn(sig);
    return { base: base, alt: alt };
  }
  function herramientaHora(obj) {
    var m = obj.match(/^(?:las |la )?(\d{1,2}):(\d{2})(?:\s+(?:de la|del|en la)\s+(manana|tarde|noche|madrugada|mediodia))?$/) ||
            obj.match(/^(?:las |la )?(\d{1,2})(?: y (media|cuarto)| menos (cuarto))?(?:\s+(?:de la|del|en la)\s+(manana|tarde|noche|madrugada))?$/);
    if (!m) return null;
    var h = +m[1], mi, franja;
    if (/:/.test(obj)) { mi = +m[2]; franja = m[3]; }
    else {
      if (!m[2] && !m[3] && !m[4]) return null; // "las 7" sin más: podría ser un número, no una hora
      mi = m[2] === 'media' ? 30 : m[2] === 'cuarto' ? 15 : m[3] ? 45 : 0; franja = m[4];
      if (m[3]) h = h - 1;
    }
    if (h > 23 || mi > 59 || h < 0) return resp(2, 'Esa hora no existe: el reloj de 24 horas va de 0:00 a 23:59. Revisa la hora y pregúntame de nuevo.', { tipo: 'hora_invalida' });
    if (franja && h > 12) return resp(2, 'Esa combinación no cuadra: las ' + h + ' ya indica la tarde o la noche en formato de 24 horas. Escríbela como ' + (h - 12) + ' de la ' + (h < 19 ? 'tarde' : 'noche') + ' o como ' + h + ':' + String(mi).padStart(2, '0') + '.', { tipo: 'hora_ambigua' });
    if (franja === 'tarde' || franja === 'noche') { if (h < 12) h += 12; }
    var r = horaEn(h, mi), txt;
    var hh = h + ':' + String(mi).padStart(2, '0');
    txt = 'Se dice «' + r.base + '»' + (r.alt ? ', o también «' + r.alt + '»' : '') + '.';
    if (h === 0) txt += ' Es medianoche o madrugada: «a.m.».';
    else if (h === 12 && mi === 0) txt += ' Si es mediodía también puedes decir «noon».';
    else if (!franja && h >= 1 && h <= 12) txt += ' Si no queda claro por el contexto, agrega «a.m.» (de la mañana) o «p.m.» (de la tarde o noche).';
    else txt += h < 12 ? ' Es de la mañana (a.m.).' : ' Es de la tarde o la noche (p.m.).';
    return resp(2, txt, { tipo: 'hora', ej: [["It's " + r.base + '.', 'Son las ' + hh + '.']], ref: 'articulo-hora-en-ingles.html' });
  }
  function herramientaFecha(obj) {
    var m = obj.match(new RegExp('^(?:el )?([0-3]?\\d) de (' + MESES.join('|') + ')(?: (?:de|del) (\\d{4}))?$'));
    if (!m) return null;
    var d = +m[1], mes = MESES.indexOf(m[2]), y = m[3] ? +m[3] : null;
    if (d < 1 || d > diasMes(mes, y)) {
      var txt = 'Esa fecha no existe: ' + m[2] + ' tiene ' + (mes === 1 && !y ? 28 : diasMes(mes, y)) + ' días' + (mes === 1 ? (y ? ' en ' + y + (bisiesto(y) ? ' (año bisiesto)' : ' (no es bisiesto)') : ' (29 en años bisiestos)') : '') + '. Revisa la fecha y pregúntame de nuevo.';
      return resp(2, txt, { tipo: 'fecha_invalida' });
    }
    var esc = MONTHS[mes] + ' ' + d + sufijo(d) + (y ? ', ' + y : '');
    var dicho = MONTHS[mes] + ' ' + ordinalEn(d) + (y ? ', ' + anioEn(y) : '');
    return resp(2, 'Se escribe «' + esc + '» y se dice «' + dicho + '». En inglés británico también se dice «the ' + ordinalEn(d) + ' of ' + MONTHS[mes] + '». Los meses siempre llevan mayúscula.', { tipo: 'fecha', ej: [['My birthday is on ' + MONTHS[mes] + ' ' + d + sufijo(d) + '.', 'Mi cumpleaños es el ' + d + ' de ' + m[2] + '.']], ref: 'articulo-dias-meses-fechas-ingles.html' });
  }
  function herramientaAnio(obj) {
    var m = obj.match(/^(?:el )?(?:ano|anio|year) (\d{4})$/);
    if (!m) return null;
    var y = +m[1]; if (y < 1000) return null;
    return resp(2, 'El año ' + y + ' se dice «' + anioEn(y) + '». Los años se leen normalmente en dos bloques de dos cifras.', { tipo: 'anio', ej: [['I was born in ' + y + '.', 'Nací en ' + y + '.']], ref: 'articulo-numeros-en-ingles.html' });
  }
  function herramientaOrdinal(n) {
    var m = n.match(/^(?:como se dice )?(?:el )?(\d{1,4}) en ordinal$|^(?:el )?ordinal de (\d{1,4})$/);
    if (!m) return null; var o = +(m[1] || m[2]); if (!o) return null;
    return resp(2, 'El ordinal de ' + o + ' es «' + ordinalEn(o) + '» y se abrevia ' + o + sufijo(o) + '.', { tipo: 'ordinal', ref: 'articulo-numeros-en-ingles.html' });
  }

  // ---------- capa 2c: verbos ----------
  var MODALES = { can: 'could', will: 'would', may: 'might', shall: 'should', must: null, should: null, could: null, would: null, might: null };
  function contarSilabas(v) { return (v.replace(/e$/, '').match(/[aeiouy]+/g) || []).length || 1; }
  function dobla(v, K, variante) {
    if ((K.doblanSiempre || []).indexOf(v) >= 0) return true;
    if (variante === 'uk' && (K.doblanSoloUK || []).indexOf(v) >= 0) return true;
    return contarSilabas(v) === 1 && /[^aeiou][aeiou][bcdfgklmnprstvz]$/.test(v) && !/^(qu)/.test(v.slice(-3));
  }
  function terceraPersona(v) {
    if (v === 'have') return 'has'; if (v === 'be') return 'is'; if (v === 'do') return 'does'; if (v === 'go') return 'goes';
    if (/(s|sh|ch|x|z|o)$/.test(v)) return v + 'es';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
    return v + 's';
  }
  function pasadoRegular(v, K, variante) {
    if (/e$/.test(v)) return v + 'd';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
    if (/ic$/.test(v)) return v + 'ked';
    if (dobla(v, K || {}, variante)) return v + v.slice(-1) + 'ed';
    return v + 'ed';
  }
  function gerundio(v, K, variante) {
    if (v === 'be') return 'being';
    if (/ie$/.test(v)) return v.slice(0, -2) + 'ying';
    if (/(ee|oe|ye)$/.test(v)) return v + 'ing';
    if (/e$/.test(v) && v.length > 2) return v.slice(0, -1) + 'ing';
    if (/ic$/.test(v)) return v + 'king';
    if (dobla(v, K || {}, variante)) return v + v.slice(-1) + 'ing';
    return v + 'ing';
  }
  function buscarVerbo(K, v) {
    for (var i = 0; i < K.verbos.length; i++) if (K.verbos[i][0] === v) return { f: K.verbos[i], esBase: true };
    for (i = 0; i < K.verbos.length; i++) { var f = K.verbos[i]; if (f[1].split(' / ').indexOf(v) >= 0 || f[2].split(' / ').indexOf(v) >= 0) return { f: f, esBase: false }; }
    return null;
  }
  function herramientaVerbo(it, K) {
    var v = (it.objeto || '').toLowerCase(), pide = it.pide || 'todo';
    if (!/^[a-z]{2,15}$/.test(v)) return null;
    var ref = 'articulo-verbos-irregulares.html';
    if (v === 'be') {
      var t = { todo: 'El verbo to be es irregular. Presente: I am, he/she/it is, you/we/they are. Pasado: I/he/she/it was, you/we/they were. Participio: been. Con -ing: being.',
        pasado: 'El pasado de to be tiene dos formas: was (I, he, she, it) y were (you, we, they). En preguntas y negaciones no se usa did: Were you there? I wasn\'t ready.',
        past: null, participio: 'El participio de to be es «been» (I have been there).', gerundio: 'La forma con -ing de to be es «being».', 'tercera persona': 'Con he, she e it, to be es «is».' };
      return resp(2, t[pide] || t[pide === 'past' ? 'pasado' : pide === 'participle' ? 'participio' : 'todo'] || t.todo, { tipo: 'verbo', ref: 'articulo-verbo-to-be.html' });
    }
    if (v in MODALES) {
      return resp(2, '«' + v + '» es un verbo modal: no lleva -s con he, she ni it, no usa do/does y va seguido del verbo en forma base (She ' + v + ' go).' + (MODALES[v] ? ' Su forma de pasado o condicional es «' + MODALES[v] + '».' : ' No tiene participio ni forma con -ing.'), { tipo: 'verbo', ref: 'articulo-verbos-modales.html' });
    }
    var enc = buscarVerbo(K, v);
    if (enc && !enc.esBase) {
      var f0 = enc.f;
      return resp(2, '«' + v + '» es una forma de «' + f0[0] + '» (' + f0[3] + '): ' + f0[0] + ' → ' + f0[1] + ' → ' + f0[2] + '.' + (f0[4] ? ' ' + f0[4] : ''), { tipo: 'verbo', ref: ref });
    }
    var regular = !enc && (K.regulares || []).indexOf(v) >= 0;
    if (!enc && !regular) return null; // no sabemos: mejor la capa 5 que inventar
    var f = enc ? enc.f : null;
    var pas = f ? f[1] : pasadoRegular(v, K, 'us'), part = f ? f[2] : pas;
    var pasUK = f ? null : pasadoRegular(v, K, 'uk');
    var ger = gerundio(v, K, 'us'), gerUK = gerundio(v, K, 'uk');
    var variantes = (pasUK && pasUK !== pas) ? ' En inglés británico se escribe «' + pasUK + '» y «' + gerUK + '».' : '';
    var nota = f && f[4] ? ' ' + f[4] : '';
    var tipoTxt = f ? (/ \/ /.test(f[1] + f[2]) && /ed\b/.test(f[1]) ? 'con dos formas' : 'irregular') : 'regular';
    var txt;
    if (/conjug|todo|formas|forms/.test(pide)) {
      txt = 'Formas de «' + v + '» (' + (f ? f[3] + ', ' : '') + tipoTxt + '): ' + v + ' → ' + pas + ' → ' + part + '. Presente: I/you/we/they ' + v + ', he/she/it ' + terceraPersona(v) + '. Con -ing: ' + ger + '.';
    } else if (/particip/.test(pide)) {
      txt = 'El participio de «' + v + '» es «' + part + '» (verbo ' + tipoTxt + ': ' + v + ' → ' + pas + ' → ' + part + '). Se usa con have/has y en voz pasiva.';
    } else if (/gerundio/.test(pide)) {
      txt = 'La forma con -ing de «' + v + '» es «' + ger + '».';
    } else if (/tercera/.test(pide)) {
      txt = 'Con he, she e it, «' + v + '» en presente simple es «' + terceraPersona(v) + '».';
    } else {
      txt = 'El pasado de «' + v + '» es «' + pas + '» (verbo ' + tipoTxt + (f ? ': ' + v + ' → ' + pas + ' → ' + part : ': agrega -ed') + ').';
    }
    return resp(2, txt + variantes + nota, { tipo: 'verbo', ref: ref });
  }

  // ---------- capa 2d: glosario (significado y pronunciación) ----------
  function buscarGlosario(K, obj) {
    var c = norm(obj).replace(/^(to |the |a |an )/, '');
    for (var j = 0; j < K.glosario.length; j++) { var g = K.glosario[j]; if (norm(g.t) === c || g.s === c.replace(/[ ']+/g, '-')) return g; }
    return null;
  }
  function herramientaGlosario(it, n, K) {
    if (it.tipo === 'significado') { var g = buscarGlosario(K, it.objeto); return g ? resp(2, g.r, { tipo: 'glosario', ej: g.ej ? [g.ej] : [], ref: 'glosario/' + g.s + '/', termino: g.t }) : null; }
    if (it.tipo === 'pronunciacion') {
      var p = buscarGlosario(K, it.objeto);
      if (!p || !p.p) return null;
      var txtP = p.pt === 'ipa'
        ? 'La pronunciación de «' + p.t + '» en el alfabeto fonético internacional (IPA) es ' + p.p + '.'
        : '«' + p.t + '» se pronuncia aproximadamente ' + p.p + '. Es una aproximación para hispanohablantes: la parte en mayúsculas es la sílaba fuerte' + (/ə/.test(p.p) ? ' y la ə es una vocal débil, como una e muy corta' : '') + '.';
      if (p.a) txtP += ' En la ficha del glosario puedes escuchar el audio.';
      return resp(2, txtP, { tipo: 'pronunciacion', ref: 'glosario/' + p.s + '/' });
    }
    if (it.tipo === 'explicacion') {
      var pal = n.replace(/'/g, "'").split(' ');
      for (var k = 0; k < pal.length; k++) {
        if (!/^(vs|versus|o|y)$/.test(pal[k])) continue;
        for (var a = 1; a <= 3; a++) for (var b = 1; b <= 3; b++) {
          if (k - a < 0 || k + b >= pal.length) continue;
          var izq = pal.slice(k - a, k).join(' '), der = pal.slice(k + 1, k + 1 + b).join(' ');
          var cands = [izq + ' vs ' + der, der + ' vs ' + izq];
          for (var i = 0; i < cands.length; i++) { var h = buscarGlosario(K, cands[i]); if (h) return resp(2, h.r, { tipo: 'glosario', ej: h.ej ? [h.ej] : [], ref: 'glosario/' + h.s + '/', termino: h.t }); }
        }
      }
    }
    return null;
  }

  // ---------- capa 3: FAQ revisada (solo explicaciones) ----------
  // Palabras de la pregunta que no aportan tema (cómo se pregunta, no qué se pregunta).
  var GENERICAS = ('que cual cuales cuando como donde por porque para quien es son esta estan hay uso usa usan usar usamos se dice '
    + 'decir significa significado quiere diferencia diferencias entre explicame explica explicar ensename sirve funciona forma '
    + 'formar regla reglas ingles en el la los las un una de del y o a al con mi me te tu lo le no si mas menos muy bien mal '
    + 'correcto correcta va van lleva llevan debo puedo puede pueden hacer hace existe vez otra otro favor algo eso esto '
    + 'pregunta duda ayuda ayudame entiendo entender saber quisiera quiero gustaria dime dame tipo tipos cosa cosas caso casos '
    + 'mejor manera modo palabra palabras frase frases verbo vs versus ejemplo ejemplos facil sencillo poco').split(' ');
  function vocabFaq(f) {
    if (f._vocab) return f._vocab;
    var v = {}; var add = function (t) { claves(t).forEach(function (w) { v[w] = 1; }); };
    add(f.id.replace(/-/g, ' ')); f.temas.forEach(function (g) { g.forEach(add); }); f.variantes.forEach(add); (f.cubre || []).forEach(add);
    f._vocab = v; return v;
  }
  // Pregunta compuesta: dos preguntas en una («¿Qué es X? ¿Y cómo se usa Y?», «qué es X y cuándo se usa Y»).
  function esCompuesta(q, n) {
    if ((String(q).match(/\?/g) || []).length > 1) return true;
    return /\b(y (como|cuando|por que|que|donde|cual|para que)|y tambien|y ademas|ademas de)\b/.test(n) && n.split(' ').length > 6;
  }
  // Faltas de ortografía frecuentes al escribir rápido: no cambian el tema de la pregunta.
  var ORTOGRAFIA = { kuando: 'cuando', cuado: 'cuando', kual: 'cual', ke: 'que', q: 'que', k: 'que', xq: 'porque', pq: 'porq', i: 'y', komo: 'como', aser: 'hacer', ase: 'hace', diferensia: 'diferencia', expilcame: 'explicame' };
  function cubreTodo(q, f) {
    var v = vocabFaq(f);
    return claves(q).every(function (w) { var c = ORTOGRAFIA[w] || w; return v[w] || v[c] || GENERICAS.indexOf(c) >= 0 || c === 'porq' || /^\d+$/.test(w); });
  }
  function capaFaq(q, K, minVariante) {
    var n = ' ' + norm(q).replace(/'/g, ' ') + ' ', toks = claves(q), mejor = null, mejorS = 0;
    K.faq.forEach(function (f) {
      var tema = f.temas.some(function (grupo) { return grupo.every(function (w) { return n.indexOf(' ' + norm(w).replace(/'/g, ' ') + ' ') >= 0; }); });
      if (!tema) return;
      var s = 0.5 + Math.max.apply(null, f.variantes.map(function (v) { return jaccard(toks, claves(v)); }));
      if (s > mejorS) { mejorS = s; mejor = f; }
    });
    if (!mejor) return null;
    // Solo si la ficha resuelve toda la consulta: si pide otro uso, otra parte u otro tema, responde la IA.
    if (!cubreTodo(q, mejor)) return null;
    if (esCompuesta(q, norm(q)) && mejorS < 1.2) return null;
    if (toks.length > 9 && mejorS < 0.7) return null;
    if (minVariante && mejorS - 0.5 < minVariante) return null;
    return resp(3, mejor.r, { tipo: 'faq', id: mejor.id, ej: mejor.ej, ref: mejor.ref, puntaje: +mejorS.toFixed(2) });
  }

  // ---------- capa 4: guía ----------
  function guiaDelTema(tema, K) {
    if (!tema) return null;
    var t = norm(tema).replace(/ /g, '-');
    var f = K.faq.filter(function (x) { return x.id === t; })[0];
    if (f) return { u: f.ref, t: (K.guias.filter(function (g) { return g.u === f.ref; })[0] || {}).t || null };
    var g = K.guias.filter(function (x) { return x.u.indexOf(t) >= 0 || x.u.indexOf(t.replace(/-/g, '-vs-')) >= 0; })[0];
    return g ? { u: g.u, t: g.t } : null;
  }
  function capaBusqueda(q, K) {
    var toks = claves(q).filter(function (t) { return t.length > 2; });
    if (toks.length < 2) return null;
    var mejor = null, mejorS = 0, mejorN = 0;
    K.guias.forEach(function (g) {
      var bolsa = ' ' + norm(g.t + ' ' + g.u.replace(/[-.]/g, ' ')) + ' ', s = 0;
      toks.forEach(function (t) { if (bolsa.indexOf(' ' + t + ' ') >= 0) s += 1; });
      var r = s / toks.length;
      if (s > mejorN || (s === mejorN && r > mejorS)) { mejorS = r; mejor = g; mejorN = s; }
    });
    return (mejorS >= CONFIG.umbralGuia && mejorN >= 2) || mejorN >= 3 ? { u: mejor.u, t: mejor.t, puntaje: +mejorS.toFixed(2) } : null;
  }

  // Los cupos se renuevan a las 00:00 UTC (el mismo día que usan la base y Cloudflare). Se muestra en la hora del alumno.
  function renovacion(ms) {
    try {
      var d = new Date(ms), sig = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
      var hora = new Date(sig).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
      var mismoDia = new Date(sig).toDateString() === d.toDateString();
      return 'Se renueva ' + (mismoDia ? 'hoy' : 'mañana') + ' a las ' + hora + ' (tu hora).';
    } catch (e) { return 'Se renueva cada día a las 00:00 UTC.'; }
  }
  // Capa, intención y tema de una respuesta, con identificadores cortos del sitio (nunca texto del alumno).
  var CODIGO = { numero: 1, hora: 1, hora_invalida: 1, hora_ambigua: 1, fecha: 1, fecha_invalida: 1, anio: 1, ordinal: 1, verbo: 1 };
  function temaSeguro(t) { t = String(t || '').toLowerCase().replace(/_/g, '-'); return /^[a-z0-9][a-z0-9:-]{0,59}$/.test(t) ? t : 'otro'; }
  // Mismo identificador que usa el servidor (temaMetrica en riso-chat.mjs), para que votos y respuestas coincidan.
  function temaEjercicio(ctx) {
    if (!ctx || !ctx.tema) return 'libre';
    var s = String(ctx.tema).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
    return s ? 'ejercicio:' + s : 'ejercicio';
  }
  function metricaDe(r, intencionTipo, ctx) {
    if (!r) return null;
    var i = intencionTipo || 'otra', slug = r.ref && /^glosario\/([^/]+)\//.exec(r.ref);
    if (r.capa === 5) return { c: r.repetida ? 'cache' : 'ia', i: i, t: r.metrica && r.metrica.t || temaEjercicio(ctx) };
    if (r.capa === 3) return { c: 'faq', i: i, t: temaSeguro(r.id) };
    if (r.capa === 2) return CODIGO[r.tipo] ? { c: 'codigo', i: i, t: temaSeguro(r.tipo) } : { c: 'biblioteca', i: i, t: temaSeguro(slug ? 'glosario:' + slug[1] : r.tipo) };
    if (r.capa === 1) { var cat = categoriaFiltro(r.tipo); return { c: cat === 'conversacion' ? 'conversacion' : cat === 'aviso' ? 'aviso' : 'filtro', i: i, t: temaSeguro(r.tipo) }; }
    return { c: 'aviso', i: i, t: temaSeguro(r.tipo) };
  }
  function categoriaFiltro(tipo) {
    if (tipo === 'saludo' || tipo === 'gracias' || tipo === 'identidad') return 'conversacion';
    if (tipo === 'vacio' || tipo === 'largo') return 'aviso';
    return 'filtro';
  }
  function categoria(r) {
    if (!r) return 'aviso';
    if (r.capa === 1) return categoriaFiltro(r.tipo);
    if (r.capa === 2 || r.capa === 3) return 'educativa_sin_ia';
    if (r.capa === 5) return 'ia';
    return 'aviso';
  }

  // Fichas pendientes de la aprobación de Leo: solo con opts.fichasPendientes (pruebas y vista previa). Nunca por defecto.
  function conFichas(K, pendientes) {
    if (!pendientes || !K || !K.faqPendientes || !K.faqPendientes.length) return K;
    var ids = {}; K.faqPendientes.forEach(function (f) { ids[f.id] = 1; });
    return Object.assign({}, K, { faq: K.faq.filter(function (f) { return !ids[f.id]; }).concat(K.faqPendientes) });
  }

  // ---------- motor ----------
  function crear(opts) {
    opts = opts || {};
    var K = conFichas(opts.conocimiento || root.RISO_CONOCIMIENTO, opts.fichasPendientes === true);
    var ahora = opts.ahora || function () { return Date.now(); };
    var plan = opts.plan || 'visitante';
    var presupuesto = opts.presupuesto || { disponible: function () { return true; } };
    var estado = {
      visual: [],     // lo que ve el alumno (puede incluir mensajes bloqueados, solo en su pantalla)
      enviable: [],   // lo único que puede ir al modelo: sin mensajes bloqueados ni datos personales
      tiempos: [], usadasHoy: opts.usadasHoy || 0, reservadas: 0, enCurso: false,
      dedupe: {}, cache: {}, cacheOrden: [],
      // educativaSinIA: preguntas de inglés resueltas sin IA (herramientas, glosario, FAQ). filtro: consultas rechazadas o
      // derivadas (datos personales, temas sensibles, manipulación, insultos, fuera de alcance, Soporte). conversacion:
      // saludos, gracias e identidad. Nunca se suman entre sí como «resueltas sin IA».
      metricas: { capa1: 0, capa2: 0, capa3: 0, capa5: 0, bloqueadas: 0, cache: 0, limite: 0, errores: 0, fuera: 0, educativaSinIA: 0, filtro: 0, conversacion: 0 }
    };
    function limiteFrecuencia() {
      var t = ahora();
      estado.tiempos = estado.tiempos.filter(function (x) { return t - x < CONFIG.rafaga.ventanaMs; });
      var ult = estado.tiempos[estado.tiempos.length - 1];
      if (ult && t - ult < CONFIG.rateMs) return 'Espera un momento antes de enviar otra pregunta.';
      if (estado.tiempos.length >= CONFIG.rafaga.n) return 'Has enviado muchas preguntas seguidas. Espera un minuto y seguimos.';
      estado.tiempos.push(t); return null;
    }
    function guardarCache(clave, r) {
      if (r.capa !== 2 && r.capa !== 3) return;
      estado.cache[clave] = r; estado.cacheOrden.push(clave);
      if (estado.cacheOrden.length > CONFIG.cache) delete estado.cache[estado.cacheOrden.shift()];
    }
    function registrar(q, r) {
      estado.visual.push({ rol: 'alumno', texto: q }, { rol: 'riso', texto: r.texto });
      if (r.privado || r.bloqueado) return; // nunca al historial enviable
      if (r.capa === 0) return;              // avisos de límite o error: no aportan contexto
      var mostrado = r.texto + ((r.ej || []).filter(function (e) { return e && e[0]; }).map(function (e) { return ' Ejemplo mostrado: ' + e[0]; }).join(''));
      estado.enviable.push({ rol: 'alumno', texto: limpiarPII(q) }, { rol: 'riso', texto: limpiarPII(mostrado) });
      if (estado.enviable.length > CONFIG.maxHistorial) estado.enviable = estado.enviable.slice(-CONFIG.maxHistorial);
    }
    function contextoSeguro(ctx) {
      if (!ctx) return null;
      var c = {}, campos = ['itemId', 'fuente', 'tema', 'enunciado', 'respuestaAlumno', 'respuestaCorrecta'];
      campos.forEach(function (k) { if (ctx[k] != null) { var v = String(ctx[k]).slice(0, CONFIG.maxCampoContexto); if (!tienePII(v)) c[k] = v; } });
      return c;
    }

    function preguntar0(q, ctx) {
      if (estado.enCurso) return Promise.resolve(resp(0, 'Espera a que termine la respuesta anterior.', { tipo: 'ocupado' }));
      var n = norm(q), it = intencion(n, estado.enviable.length > 0);
      var f = capaFiltro(q, n, it);
      if (f) {
        estado.metricas.capa1++; if (f.bloqueado) estado.metricas.bloqueadas++; if (f.tipo === 'fuera_de_alcance') estado.metricas.fuera++;
        f.categoria = categoriaFiltro(f.tipo); if (f.categoria === 'filtro') estado.metricas.filtro++; else if (f.categoria === 'conversacion') estado.metricas.conversacion++;
        if (f.tipo !== 'vacio' && f.tipo !== 'largo') registrar(q, f);
        return Promise.resolve(f);
      }
      var c = contextoSeguro(ctx);
      // Capas 2 y 3: solo sin contexto de ejercicio, sin seguimiento (su respuesta no depende de la conversación) y si la
      // pregunta no es compuesta: una respuesta fija respondería solo una parte, así que las dos partes las responde la IA.
      if (!c && it.tipo !== 'seguimiento' && it.tipo !== 'correccion' && !esCompuesta(q, n)) {
        var claveC = it.tipo + '|' + n;
        if (estado.cache[claveC]) { estado.metricas.cache++; var rc = Object.assign({}, estado.cache[claveC], { desdeCache: true }); registrar(q, rc); return Promise.resolve(rc); }
        var t = null;
        if (it.tipo === 'traduccion') t = herramientaHora(it.objeto) || herramientaFecha(it.objeto) || herramientaAnio(it.objeto) || herramientaOrdinal(n) || herramientaNumero(it.objeto);
        else if (it.tipo === 'conjugacion') t = herramientaVerbo(it, K);
        else if (it.tipo === 'significado' || it.tipo === 'pronunciacion') t = herramientaGlosario(it, n, K);
        else if (it.tipo === 'explicacion') t = capaFaq(q, K) || herramientaGlosario(it, n, K);
        if (!t && it.tipo === 'otra') t = herramientaOrdinal(n) || herramientaGlosario({ tipo: 'explicacion' }, n, K);
        if (t) { if (t.capa === 3) estado.metricas.capa3++; else estado.metricas.capa2++; estado.metricas.educativaSinIA++; guardarCache(claveC, t); registrar(q, t); return Promise.resolve(t); }
        // La FAQ responde explicaciones. Para traducir o pronunciar solo si la pregunta es casi idéntica a una variante revisada.
        var fq = null;
        if (it.tipo === 'explicacion' || it.tipo === 'otra') fq = capaFaq(q, K);
        else if (it.tipo === 'traduccion' || it.tipo === 'pronunciacion') fq = capaFaq(q, K, 0.8);
        {
          if (fq) { estado.metricas.capa3++; estado.metricas.educativaSinIA++; guardarCache(claveC, fq); registrar(q, fq); return Promise.resolve(fq); }
        }
      }
      // Capa 5. La deduplicación depende del texto, del contexto del ejercicio y de la conversación reciente.
      var prev = estado.enviable.slice(-2);
      if (prev.length === 2 && norm(prev[0].texto) === norm(limpiarPII(q))) prev = estado.enviable.slice(-4, -2); // repetir la misma pregunta
      var claveD = hash(n + '|' + JSON.stringify(c) + '|' + JSON.stringify(prev));
      if (estado.dedupe[claveD]) { estado.metricas.cache++; var rd = Object.assign({}, estado.dedupe[claveD], { repetida: true }); return Promise.resolve(rd); }
      var cuota = CONFIG.cuotaDiaria[plan] || 0;
      if (estado.usadasHoy + estado.reservadas >= cuota) {
        estado.metricas.limite++;
        var txt = plan === 'visitante' ? 'Para preguntarme cosas nuevas necesitas una cuenta gratis. Mientras, puedo responder números, horas, fechas, verbos y palabras del glosario.'
          : plan === 'gratis' ? 'Usaste tus ' + cuota + ' respuestas con IA de hoy. Con la membresía tienes más. Las respuestas revisadas (números, verbos, glosario y dudas frecuentes) siguen disponibles.'
          : 'Llegaste a tu límite de respuestas con IA de hoy. ' + renovacion(ahora()) + ' Las respuestas revisadas (números, verbos, glosario y dudas frecuentes) siguen disponibles.';
        return Promise.resolve(resp(0, txt, { tipo: 'cuota', plan: plan }));
      }
      var lim = limiteFrecuencia();
      if (lim) { estado.metricas.limite++; return Promise.resolve(resp(0, lim, { tipo: 'frecuencia' })); }
      if (!presupuesto.disponible()) { estado.metricas.limite++; return Promise.resolve(resp(0, 'Riso está descansando un rato. Vuelve a intentarlo más tarde; mientras, las guías del sitio tienen la respuesta a casi todo.', { tipo: 'presupuesto' })); }
      var guia = c ? guiaDelTema(c.tema, K) : capaBusqueda(q, K);
      var payload = { pregunta: limpiarPII(String(q).slice(0, CONFIG.maxCaracteres)), intencion: it.tipo, historial: estado.enviable.slice(-CONFIG.maxHistorial), contexto: c, guia: guia && guia.u };
      var generar = opts.generar || function () { return Promise.reject(new Error('sin_modelo')); };
      estado.enCurso = true; estado.reservadas++;
      return Promise.resolve().then(function () { return generar(payload); }).then(function (g) {
        var texto = limpiarPII(String(g && g.texto || '').replace(/\s+/g, ' ').trim()).slice(0, 700);
        if (!texto) throw new Error('vacia');
        estado.reservadas--; estado.usadasHoy++; estado.metricas.capa5++; estado.enCurso = false;
        var r = resp(5, texto, { tipo: 'generativa', ej: g.ej || [], ref: guia ? guia.u : null, refTitulo: guia ? guia.t : null, aviso: 'Generada con IA. Puede tener errores.', metrica: g.metrica || { c: 'ia', i: ctx ? 'ejercicio' : it.tipo, t: temaEjercicio(ctx) } });
        estado.dedupe[claveD] = r;
        registrar(q, r);
        return r;
      }).catch(function (err) {
        estado.reservadas--; estado.enCurso = false; estado.metricas.errores++;
        var motivo = err && err.message;
        var FINAL = { daily_limit: 'Llegaste a tu límite de respuestas con IA de hoy. ' + renovacion(ahora()) + ' Las respuestas revisadas (números, verbos, glosario y dudas frecuentes) siguen disponibles.',
          busy: 'Riso está descansando un rato. Vuelve a intentarlo más tarde; mientras, las guías del sitio tienen la respuesta a casi todo.',
          not_allowed: 'Riso todavía no está disponible para tu cuenta.', disabled: 'Riso todavía no está disponible.', unverified: 'Confirma tu correo para poder preguntarle a Riso.' };
        if (FINAL[motivo]) return resp(0, FINAL[motivo], { tipo: 'limite_servidor', motivo: motivo });
        return resp(0, 'No pude responder ahora. Toca «Reintentar» en unos segundos.', { tipo: 'error', reintentar: true });
      });
    }
    // Medición (fase 1): cada respuesta resuelta SIN IA se anota como { c: capa, i: intención, t: tema, ms } y se entrega a
    // opts.medir (la página la envía en lotes a riso_metricas_lote). Nunca incluye el texto de la pregunta ni de la respuesta.
    // Las respuestas de Gemma las cuenta el servidor (con tokens y neuronas reales), así que aquí no se duplican.
    function preguntar(q, ctx) {
      var t0 = Date.now(), it0 = intencion(norm(q), estado.enviable.length > 0);
      return preguntar0(q, ctx).then(function (r) {
        try {
          if (r.capa === 5 && !r.repetida) return r; // respuesta nueva de IA: la cuenta el servidor con tokens y neuronas reales
          var m = metricaDe(r, ctx ? 'ejercicio' : it0.tipo, ctx);
          if (m) { r.metrica = { c: m.c, i: m.i, t: m.t }; if (typeof opts.medir === 'function') { m.ms = Math.max(0, Date.now() - t0); opts.medir(m); } }
        } catch (e) { /* medir nunca rompe una respuesta */ }
        return r;
      });
    }
    return {
      preguntar: preguntar,
      metricas: function () { return Object.assign({}, estado.metricas, { usadasHoy: estado.usadasHoy }); },
      historial: function () { return estado.visual.slice(); },
      historialEnviable: function () { return estado.enviable.slice(); },
      config: CONFIG
    };
  }

  var api = { crear: crear, CONFIG: CONFIG, categoria: categoria, metricaDe: metricaDe, _int: { conFichas: conFichas, cubreTodo: cubreTodo, esCompuesta: esCompuesta, herramientaGlosario: herramientaGlosario, norm: norm, intencion: intencion, capaFiltro: capaFiltro, tienePII: tienePII, limpiarPII: limpiarPII, numeroEn: numeroEn, anioEn: anioEn, ordinalEn: ordinalEn, horaEn: horaEn, parseNumero: parseNumero, herramientaNumero: herramientaNumero, herramientaHora: herramientaHora, herramientaFecha: herramientaFecha, terceraPersona: terceraPersona, pasadoRegular: pasadoRegular, gerundio: gerundio, capaFaq: capaFaq, capaBusqueda: capaBusqueda, guiaDelTema: guiaDelTema, diasMes: diasMes } };
  root.RisoTutor = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
