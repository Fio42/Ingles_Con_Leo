#!/usr/bin/env node
/* Validacion REAL del Curso 3 contra un proyecto Supabase de PRUEBA (auth real, RPC real, Storage real).
   No guarda ni imprime contrasenas ni tokens. Uso:
     SB_URL=https://xxxx.supabase.co SB_ANON=<anon key> \
     T_GRATIS="correo|clave" T_ACTIVO="correo|clave" T_VENCIDO="correo|clave" [T_CANCELADO="correo|clave"] \
     node tools/validar_curso3_supabase.js apagado|encendido
   Etapa "apagado": curso apagado (enabled=false). Etapa "encendido": enabled=true y los 137 audios subidos al bucket. */
const stage = process.argv[2];
const { SB_URL, SB_ANON } = process.env;
if(!/^(apagado|encendido)$/.test(stage || '') || !SB_URL || !SB_ANON){ console.error('Faltan datos: etapa (apagado|encendido), SB_URL y SB_ANON.'); process.exit(2); }
if(/iviksyhzhiygkuaojply/.test(SB_URL)){ console.error('Ese es el proyecto de PRODUCCION. Esta prueba solo corre en un proyecto de prueba.'); process.exit(2); }
const H = (tok) => ({ apikey: SB_ANON, Authorization: 'Bearer ' + (tok || SB_ANON), 'content-type': 'application/json' });
let pass = 0, fail = 0;
function check(name, ok, extra){ if(ok){ pass++; console.log('  ok  ' + name); } else { fail++; console.log('  FALLA ' + name + (extra ? ' :: ' + extra : '')); } }
async function login(spec){
  if(!spec) return null; const i = spec.indexOf('|'), email = spec.slice(0, i), password = spec.slice(i + 1);
  const r = await fetch(SB_URL + '/auth/v1/token?grant_type=password', { method: 'POST', headers: H(), body: JSON.stringify({ email, password }) });
  const j = await r.json(); return j.access_token || null;
}
const rpc = async (tok, fn, args) => { const r = await fetch(SB_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: H(tok), body: JSON.stringify(args || {}) }); let j = null; try{ j = await r.json(); }catch(e){} return { status: r.status, body: j }; };
let NAMES = null;
async function names(tok){ if(NAMES) return NAMES; const r = await rpc(tok, 'academia_get_content', { p_course: 'articulos' }); NAMES = r.body && r.body.ok ? Object.values(r.body.content.audio) : null; return NAMES; }
const sign = async (tok, paths) => { const r = await fetch(SB_URL + '/storage/v1/object/sign/academia-audio', { method: 'POST', headers: H(tok), body: JSON.stringify({ expiresIn: 900, paths }) }); let j = null; try{ j = await r.json(); }catch(e){} return { status: r.status, items: Array.isArray(j) ? j : [] }; };
const signedOk = it => it.filter(x => x && x.signedURL && !x.error);

(async()=>{
  console.log('Validacion real del Curso 3, etapa: ' + stage);
  const tok = { gratis: await login(process.env.T_GRATIS), activo: await login(process.env.T_ACTIVO), vencido: await login(process.env.T_VENCIDO), cancelado: await login(process.env.T_CANCELADO) };   // cancelado = suscripcion cancelada pero aun vigente (is_member sigue en true)
  check('las 3 cuentas de prueba inician sesion (auth real)', !!(tok.gratis && tok.activo && tok.vencido));
  const probe = ['articulos/prueba-1.mp3', 'articulos/prueba-2.mp3'];
  // VISITANTE (solo clave publica, sin sesion)
  const v = await rpc(null, 'academia_get_content', { p_course: 'articulos' });
  check('VISITANTE: academia_get_content rechazada (sin permiso)', v.status >= 400 && !(v.body && v.body.content), 'status ' + v.status);
  const vs = await sign(null, probe); check('VISITANTE: no obtiene enlaces de audio', signedOk(vs.items).length === 0);
  const pub = await fetch(SB_URL + '/storage/v1/object/public/academia-audio/articulos/prueba-1.mp3'); check('VISITANTE: la URL publica del bucket no sirve archivos (bucket privado)', pub.status >= 400, 'status ' + pub.status);
  const tb = await fetch(SB_URL + '/rest/v1/academia_content?select=*', { headers: H(tok.activo) }); const tbj = await tb.json().catch(() => null);
  check('MIEMBRO: la tabla academia_content no se lee directamente', tb.status >= 400 || (Array.isArray(tbj) && tbj.length === 0), 'status ' + tb.status);

  if(stage === 'apagado'){
    for(const [k, t] of [['GRATIS', tok.gratis], ['ACTIVO', tok.activo], ['VENCIDO', tok.vencido], ['CANCELADO VIGENTE', tok.cancelado]].filter(x => x[1])){
      const r = await rpc(t, 'academia_get_content', { p_course: 'articulos' });
      check('CURSO OCULTO / ' + k + ': sin contenido (error "course")', r.body && r.body.ok === false && r.body.error === 'course' && !r.body.content, JSON.stringify(r.body).slice(0, 80));
      const s = await sign(t, probe); check('CURSO OCULTO / ' + k + ': ningun enlace de audio', signedOk(s.items).length === 0);
    }
  } else {
    const g = await rpc(tok.gratis, 'academia_get_content', { p_course: 'articulos' });
    check('CUENTA GRATIS: error "members", sin contenido', g.body && g.body.ok === false && g.body.error === 'members' && !g.body.content);
    const e = await rpc(tok.vencido, 'academia_get_content', { p_course: 'articulos' });
    check('MIEMBRO VENCIDO: error "members", sin contenido', e.body && e.body.ok === false && e.body.error === 'members' && !e.body.content);
    const a = await rpc(tok.activo, 'academia_get_content', { p_course: 'articulos' });
    const c = a.body && a.body.content; const all = await names(tok.activo);
    check('MIEMBRO ACTIVO: recibe 5 lecciones, 40 ejercicios, 30 de practica', !!c && c.lessons.length === 5 && c.lessons.reduce((n, l) => n + l.activities.length, 0) === 40 && c.practice.length === 30);
    check('MIEMBRO ACTIVO: el mapa trae 137 audios', !!all && new Set(all).size === 137);
    if(tok.cancelado){
      const cc = await rpc(tok.cancelado, 'academia_get_content', { p_course: 'articulos' }); const cl = all ? await sign(tok.cancelado, all.slice(0, 5)) : { items: [] };
      check('CANCELADO VIGENTE: conserva contenido y audio hasta vencer', !!(cc.body && cc.body.ok && cc.body.content.lessons.length === 5) && signedOk(cl.items).length === 5);
    }
    if(all){
      const s = await sign(tok.activo, all); const ok = signedOk(s.items);
      check('MIEMBRO ACTIVO: Storage firma los 137 audios', ok.length === 137, ok.length + ' de 137');
      if(ok[0]){
        const url = SB_URL + '/storage/v1' + ok[0].signedURL; const f = await fetch(url);
        const buf = Buffer.from(await f.arrayBuffer());
        check('MIEMBRO ACTIVO: el enlace firmado descarga un MP3 real', f.status === 200 && /audio|mpeg|octet/.test(f.headers.get('content-type') || '') && buf.length > 3000, f.status + ' ' + buf.length);
        const tkn = new URL(url).searchParams.get('token'); let life = null; try{ const p = JSON.parse(Buffer.from(tkn.split('.')[1], 'base64').toString()); life = p.exp - Math.floor(Date.now() / 1000); }catch(x){}
        check('MIEMBRO ACTIVO: el enlace vence en unos 15 minutos', life !== null && life > 600 && life <= 900, 'segundos restantes ' + life);
        const bare = await fetch(SB_URL + '/storage/v1' + ok[0].signedURL.split('?')[0]); check('el enlace SIN token no sirve el archivo', bare.status >= 400, 'status ' + bare.status);
      }
      const sg = await sign(tok.gratis, all.slice(0, 5)); check('CUENTA GRATIS: Storage no firma ningun audio', signedOk(sg.items).length === 0);
      const sv = await sign(tok.vencido, all.slice(0, 5)); check('MIEMBRO VENCIDO: Storage no firma ningun audio nuevo', signedOk(sv.items).length === 0);
    }
  }
  console.log('\n' + pass + ' ok, ' + fail + ' fallan');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('Error inesperado:', e.message); process.exit(2); });
