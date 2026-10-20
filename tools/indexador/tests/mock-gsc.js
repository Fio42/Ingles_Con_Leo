'use strict';
// Replica minima de Search Console para probar el robot sin tocar Google.
// Imita: buscador de URLs, veredicto, boton Solicitar indexacion, dialogo de prueba/exito/cuota/rechazo,
// pagina de captcha (/sorry/), pantalla de inicio de sesion y propiedad sin acceso.
const http = require('http');

function crear() {
  const est = {
    indexadas: new Set(),          // URLs que Google ya tiene
    limiteSolicitudes: Infinity,   // a partir de la N-esima solicitud responde "cuota"
    rechazar: new Set(),           // URLs que Google rechaza
    sinBoton: new Set(),
    captchaEnInspeccion: null,     // numero de inspeccion en la que aparece el captcha
    sesionCaducada: false,
    propiedadesSinAcceso: new Set(),
    sitemap: [],
    inspecciones: 0, solicitudes: [], aceptadas: [], idioma: 'es'
  };
  const T = {
    es: { placeholder: 'Inspecciona cualquier URL de «inglesconleo.com»', no: 'La URL no está en Google', si: 'La URL está en Google', boton: 'Solicitar indexación', probando: 'Probando si la URL se puede indexar', ok: 'Se ha solicitado la indexación', cuota: 'Has superado la cuota diaria de solicitudes de indexación. Inténtalo mañana.', rech: 'No se pudo solicitar la indexación: la URL no se puede indexar', ent: 'Entendido' },
    en: { placeholder: 'Inspect any URL in "inglesconleo.com"', no: 'URL is not on Google', si: 'URL is on Google', boton: 'Request indexing', probando: 'Testing if live URL can be indexed', ok: 'Indexing requested', cuota: 'Quota exceeded. You have exceeded your daily quota for indexing requests.', rech: 'Indexing request rejected', ent: 'Got it' }
  };
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const t = T[est.idioma];
    const html = (b, code = 200) => { res.writeHead(code, { 'content-type': 'text/html; charset=utf-8' }); res.end(b); };
    if (u.pathname === '/__cfg' && req.method === 'POST') {
      let b = ''; req.on('data', d => b += d); req.on('end', () => {
        const c = JSON.parse(b || '{}');
        for (const k of Object.keys(c)) { if (['indexadas', 'rechazar', 'sinBoton', 'propiedadesSinAcceso'].includes(k)) est[k] = new Set(c[k]); else est[k] = c[k] === 'Infinity' ? Infinity : c[k]; }
        res.end('ok');
      }); return;
    }
    if (u.pathname === '/__stats') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ inspecciones: est.inspecciones, solicitudes: est.solicitudes, aceptadas: est.aceptadas })); return; }
    if (u.pathname === '/sitemap.xml') { res.writeHead(200, { 'content-type': 'application/xml' }); res.end('<?xml version="1.0"?><urlset>' + est.sitemap.map(x => `<url><loc>${x.replace(/&/g, '&amp;')}</loc></url>`).join('') + '</urlset>'); return; }
    if (u.pathname.startsWith('/sorry')) return html('<h1>Nuestros sistemas han detectado tráfico inusual</h1><iframe src="/recaptcha/api2/anchor"></iframe><p>No soy un robot</p>');
    if (u.pathname.startsWith('/recaptcha')) return html('<p>captcha frame</p>');
    if (u.pathname.startsWith('/accounts/signin')) return html('<h1>Iniciar sesión</h1><p>Usa tu cuenta de Google</p>');
    if (u.pathname === '/__api/inspect') {
      const url = u.searchParams.get('u'); est.inspecciones++;
      if (est.captchaEnInspeccion && est.inspecciones >= est.captchaEnInspeccion) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ captcha: true })); return; }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ indexada: est.indexadas.has(url), sinBoton: est.sinBoton.has(url) })); return;
    }
    if (u.pathname === '/__api/request') {
      const url = u.searchParams.get('u'); est.solicitudes.push(url);
      let r = 'ok';
      if (est.solicitudes.length > est.limiteSolicitudes) r = 'cuota'; else if (est.rechazar.has(url)) r = 'rechazo'; else est.aceptadas.push(url);
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ r })); return;
    }
    if (u.pathname === '/search-console') {
      const prop = u.searchParams.get('resource_id');
      if (est.sesionCaducada) { res.writeHead(302, { location: '/accounts/signin/v2/identifier' }); return res.end(); }
      if (est.propiedadesSinAcceso.has(prop)) return html('<h1>No tienes acceso a esta propiedad</h1>');
      return html(`<!doctype html><meta charset=utf-8><body><iframe src="/recaptcha/api2/anchor" style="position:fixed;right:0;bottom:0;width:256px;height:60px"></iframe><div style="visibility:hidden;position:absolute"><iframe src="/recaptcha/api2/bframe"></iframe></div><header><input type="text" aria-label="${t.placeholder}" placeholder="${t.placeholder}" id="q"></header><main id="panel"></main>
<script>
const T=${JSON.stringify(t)};
const q=document.getElementById('q'),panel=document.getElementById('panel');
q.addEventListener('keydown',async e=>{ if(e.key!=='Enter')return; const url=q.value;
  panel.innerHTML='<p>Inspeccionando la URL en Google...</p>';
  const r=await (await fetch('/__api/inspect?u='+encodeURIComponent(url))).json();
  if(r.captcha){location.href='/sorry/index';return;}
  setTimeout(()=>{
    if(r.indexada){panel.innerHTML='<h2>'+T.si+'</h2><p>Indexada</p>';return;}
    panel.innerHTML='<h2>'+T.no+'</h2><p>Detectada: actualmente sin indexar</p>'+(r.sinBoton?'':'<div role="button" id="req" style="text-transform:uppercase">'+T.boton+'</div>');
    const b=document.getElementById('req'); if(!b)return;
    b.onclick=async()=>{
      const d=document.createElement('div');d.setAttribute('role','dialog');d.innerHTML='<p>'+T.probando+'...</p>';document.body.appendChild(d);
      const rr=await (await fetch('/__api/request?u='+encodeURIComponent(url))).json();
      setTimeout(()=>{ const m=rr.r==='ok'?T.ok:rr.r==='cuota'?T.cuota:T.rech;
        d.innerHTML='<p>'+m+'</p><div role="button" id="cl">'+T.ent+'</div>'; document.getElementById('cl').onclick=()=>d.remove(); },700);
    };
  },500);
});
</script></body>`);
    }
    html('<p>404</p>', 404);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok({ server, est, base: 'http://127.0.0.1:' + server.address().port })));
}
module.exports = { crear };
