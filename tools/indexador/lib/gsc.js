'use strict';
const fs = require('fs');
const path = require('path');
const { Alerta } = require('./alertas');
const { dormir, fechaLocal } = require('./util');

/* Textos de la interfaz de Search Console en espanol e ingles. */
const RE = {
  noIndexada: /la url no est[aá] en google|la url es desconocida para google|url is not on google|url is unknown to google/i,
  indexada: /la url est[aá] en google|url is on google/i,
  fueraPropiedad: /no pertenece a (esta|la) propiedad|not part of (this|the) property|no est[aá] en esta propiedad/i,
  sinAcceso: /no tienes acceso a (esta|la) propiedad|you don.t have access to this property|no ten[eé]s acceso|no tienes permiso para ver/i,
  captcha: /no soy un robot|i.m not a robot|tr[aá]fico inusual|unusual traffic|nuestros sistemas han detectado/i,
  verificacion: /verifica que eres t[uú]|verify it.s you|confirm it.s you|verificaci[oó]n en dos pasos|2-step verification|verificaci[oó]n de seguridad|comprobaci[oó]n de seguridad|security check/i,
  loginMarketing: /iniciar sesi[oó]n|sign in|empezar ahora|start now|comenzar ahora/i,
  botonSolicitar: /solicitar indexaci[oó]n|request indexing/i,
  exito: /se (ha )?solicitado la indexaci[oó]n|se envi[oó] la solicitud de indexaci[oó]n|solicitud de indexaci[oó]n (enviada|recibida|aceptada)|indexing requested|request received|indexing request (received|accepted)/i,
  cuota: /has superado la cuota|se ha superado la cuota|se super[oó] la cuota|cuota (diaria )?(excedida|agotada|superada)|has alcanzado (el )?l[ií]mite|l[ií]mite diario|quota exceeded|exceeded (your |the )?(daily )?quota|daily (quota|limit)/i,
  rechazo: /no se pudo solicitar|solicitud (de indexaci[oó]n )?rechazada|indexing request rejected|la url no se puede indexar|url (is )?not (available to google|indexable)|something went wrong|se produjo un error|no se puede solicitar/i,
  cerrar: /^(entendido|got it|dismiss|cerrar|close|aceptar|ok|listo|hecho|descartar|ignorar)$/i
};

function veredictoDeTexto(t) {
  const a = t.search(RE.noIndexada), b = t.search(RE.indexada);
  if (a < 0 && b < 0) return null;
  if (a >= 0 && (b < 0 || a <= b)) return 'no_indexada';
  return 'indexada';
}

// Decide si la pantalla actual es un bloqueo de seguridad / sesion. Devuelve 'captcha' | 'verificacion' | 'sesion_caducada' | null
function clasificarBloqueo({ url, texto, tieneRecaptcha }) {
  let u; try { u = new URL(url); } catch (e) { u = { hostname: '', pathname: '' }; }
  if (/\/sorry\//i.test(u.pathname) || tieneRecaptcha || RE.captcha.test(texto)) return 'captcha';
  const enLogin = u.hostname === 'accounts.google.com' || /\/(signin|servicelogin)/i.test(u.pathname);
  if (enLogin) {
    if (/challenge|rejected/i.test(url) || RE.verificacion.test(texto)) return 'verificacion';
    return 'sesion_caducada';
  }
  if (RE.verificacion.test(texto)) return 'verificacion';
  return null;
}

// Fragmento corto alrededor de lo que coincidio, para el registro (no todo el texto de la pagina)
function fragmento(texto, re) {
  const m = re.exec(texto);
  if (!m) return texto.replace(/\s+/g, ' ').slice(0, 120);
  return texto.slice(m.index, m.index + 160).replace(/\s+/g, ' ').trim();
}

class Gsc {
  constructor({ ctx, cfg, datos, propiedadInicial }) {
    this.ctx = ctx; this.cfg = cfg; this.datos = datos;
    this.base = cfg.gscBase || 'https://search.google.com';
    this.props = cfg.propiedades || [];
    this.propiedad = propiedadInicial || null;
    this.page = null;
  }

  async iniciar() { this.page = this.ctx.pages()[0] || await this.ctx.newPage(); this.page.setDefaultTimeout(this.cfg.tiempos.cargaMs); }

  async texto() {
    try { return await this.page.locator('body').innerText({ timeout: 5000 }); } catch (e) { return ''; }
  }

  async revisarBloqueo() {
    const texto = await this.texto();
    // Search Console carga un reCAPTCHA INVISIBLE al pulsar botones: es normal. Solo cuenta como desafio
    // si el recuadro de preguntas (bframe) esta realmente visible en pantalla.
    let tieneRecaptcha = false;
    try { tieneRecaptcha = await this.page.locator('iframe[src*="recaptcha"][src*="bframe"]').first().isVisible(); } catch (e) {}
    const tipo = clasificarBloqueo({ url: this.page.url(), texto, tieneRecaptcha });
    if (tipo) {
      await this.diagnostico('bloqueo-' + tipo);
      throw new Alerta(tipo, `Pantalla de seguridad detectada en ${this.page.url()}`);
    }
    return texto;
  }

  async diagnostico(etiqueta) {
    try {
      const d = path.join(this.datos, 'diagnostico'); fs.mkdirSync(d, { recursive: true });
      const base = path.join(d, fechaLocal().replace(/[: ]/g, '-') + '-' + etiqueta.replace(/[^\w-]/g, '_'));
      await this.page.screenshot({ path: base + '.png', fullPage: false });
      fs.writeFileSync(base + '.txt', this.page.url() + '\n\n' + (await this.texto()).slice(0, 6000));
      const arch = fs.readdirSync(d).sort();
      while (arch.length > 80) fs.unlinkSync(path.join(d, arch.shift()));
    } catch (e) { /* diagnostico es opcional */ }
  }

  async capturaPrueba(url) {
    try {
      const d = path.join(this.datos, 'capturas'); fs.mkdirSync(d, { recursive: true });
      const nombre = fechaLocal().replace(/[: ]/g, '-') + '-' + url.replace(/^https?:\/\//, '').replace(/[^\w]+/g, '_').slice(0, 80) + '.png';
      await this.page.screenshot({ path: path.join(d, nombre) });
      const arch = fs.readdirSync(d).sort();
      while (arch.length > 60) fs.unlinkSync(path.join(d, arch.shift()));
    } catch (e) {}
  }

  campoBusqueda() {
    return this.page.locator('input[aria-label*="URL" i], input[placeholder*="URL" i], input[aria-label*="Inspec" i], input[type="search"]').first();
  }

  urlPropiedad(p) { return `${this.base}/search-console?resource_id=${encodeURIComponent(p)}`; }

  // Abre la propiedad (probando las candidatas) y confirma que hay sesion.
  async abrirPropiedad() {
    const candidatas = this.propiedad ? [this.propiedad, ...this.props.filter(p => p !== this.propiedad)] : this.props;
    let ultimo = '';
    for (const p of candidatas) {
      await this.page.goto(this.urlPropiedad(p), { waitUntil: 'domcontentloaded', timeout: this.cfg.tiempos.cargaMs });
      for (let i = 0; i < 20; i++) {
        const texto = await this.revisarBloqueo();
        if (RE.sinAcceso.test(texto)) { ultimo = `Sin acceso a la propiedad ${p}`; break; }
        if (await this.campoBusqueda().count() > 0) { this.propiedad = p; return p; }
        if (/\/search-console\/about/i.test(this.page.url()) || (i >= 6 && RE.loginMarketing.test(texto) && !(await this.campoBusqueda().count()))) {
          await this.diagnostico('sin-sesion');
          throw new Alerta('sesion_caducada', 'Search Console muestra la pagina de inicio de sesion');
        }
        await dormir(1500);
      }
      ultimo = ultimo || `No aparecio el buscador de URLs en ${p}`;
    }
    await this.diagnostico('propiedad');
    throw new Alerta('propiedad', ultimo || 'No se pudo abrir ninguna propiedad');
  }

  // Inspecciona una URL como lo haria una persona: escribe la URL en el buscador de arriba y pulsa Enter.
  async inspeccionar(url) {
    await this.abrirPropiedad();
    const campo = this.campoBusqueda();
    await campo.click();
    await campo.fill(url);
    await this.page.keyboard.press('Enter');
    const limite = Date.now() + this.cfg.tiempos.inspeccionMs;
    while (Date.now() < limite) {
      await dormir(1500);
      const texto = await this.revisarBloqueo();
      if (RE.fueraPropiedad.test(texto)) { await this.diagnostico('fuera-propiedad'); return { veredicto: 'desconocido', detalle: 'La URL no pertenece a la propiedad' }; }
      const v = veredictoDeTexto(texto);
      if (v) return { veredicto: v, detalle: v === 'indexada' ? 'La URL esta en Google' : 'La URL no esta en Google' };
    }
    await this.diagnostico('inspeccion-sin-resultado');
    return { veredicto: 'desconocido', detalle: 'La inspeccion no devolvio un resultado reconocible' };
  }

  botonSolicitar() {
    return this.page.getByRole('button', { name: RE.botonSolicitar }).first();
  }

  async hayBoton() {
    const b = this.botonSolicitar();
    if (await b.count() > 0) return b;
    const t = this.page.getByText(RE.botonSolicitar).first();
    if (await t.count() > 0) return t;
    return null;
  }

  async textoDialogo() {
    try {
      const d = this.page.locator('[role="dialog"], [role="alertdialog"]');
      const n = await d.count();
      let t = '';
      for (let i = 0; i < n; i++) t += '\n' + await d.nth(i).innerText({ timeout: 2000 });
      return t.trim();
    } catch (e) { return ''; }
  }

  async cerrarDialogo() {
    try {
      const b = this.page.getByRole('button', { name: RE.cerrar }).first();
      if (await b.count() > 0) await b.click({ timeout: 3000 });
      else await this.page.keyboard.press('Escape');
    } catch (e) {}
  }

  // Pulsa "Solicitar indexacion" y espera la confirmacion REAL de Google.
  // Devuelve { resultado: 'aceptada' | 'limite_cuota' | 'rechazada' | 'sin_boton' | 'sin_respuesta', detalle }
  async solicitar(url) {
    const boton = await this.hayBoton();
    if (!boton) { await this.diagnostico('sin-boton'); return { resultado: 'sin_boton', detalle: 'No aparece el boton Solicitar indexacion' }; }
    try {
      const desactivado = await boton.evaluate(el => el.disabled || el.getAttribute('aria-disabled') === 'true');
      if (desactivado) { await this.diagnostico('boton-desactivado'); return { resultado: 'sin_boton', detalle: 'El boton esta desactivado' }; }
    } catch (e) {}
    await boton.click();
    const limite = Date.now() + this.cfg.tiempos.solicitudMs;
    while (Date.now() < limite) {
      await dormir(2000);
      const texto = await this.revisarBloqueo();
      const dlg = await this.textoDialogo();
      const fuente = dlg || texto;
      if (RE.cuota.test(fuente)) { await this.diagnostico('limite-cuota'); await this.cerrarDialogo(); return { resultado: 'limite_cuota', detalle: fragmento(fuente, RE.cuota) }; }
      if (dlg && RE.exito.test(dlg)) { await this.capturaPrueba(url); await this.cerrarDialogo(); return { resultado: 'aceptada', detalle: 'Google confirmo: ' + fragmento(dlg, RE.exito) }; }
      if (dlg && RE.rechazo.test(dlg)) { await this.diagnostico('rechazada'); await this.cerrarDialogo(); return { resultado: 'rechazada', detalle: fragmento(dlg, RE.rechazo) }; }
      if (!dlg && RE.exito.test(texto) && !RE.botonSolicitar.test(texto)) { await this.capturaPrueba(url); return { resultado: 'aceptada', detalle: 'Google confirmo (sin dialogo)' }; }
    }
    await this.diagnostico('solicitud-sin-respuesta');
    return { resultado: 'sin_respuesta', detalle: 'Google no mostro confirmacion ni error a tiempo' };
  }
}

module.exports = { Gsc, RE, veredictoDeTexto, clasificarBloqueo };
