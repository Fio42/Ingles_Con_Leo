#!/usr/bin/env node
/* Prueba REAL completa del Curso 3 en un proyecto Supabase de PRUEBA, con un solo comando. Corre en TU computador.
   Hace: aplica el SQL minimo + la migracion + la semilla del contenido, crea 4 cuentas de prueba (gratis, activo, cancelado vigente,
   vencido) con contrasenas aleatorias, sube los 137 audios al bucket privado, corre las etapas "apagado" y "encendido" y deja el curso apagado.
   Nunca imprime claves ni contrasenas. Se niega a correr contra produccion.
   Datos (en variables de entorno, NO en el chat): SB_URL, SB_ANON, SB_SERVICE (service_role del proyecto de PRUEBA), SB_PAT (token personal de Supabase)
   Uso:  node tools/probar_curso3_en_supabase_de_prueba.js            (usa private/ del repositorio)  */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { spawnSync } = require('child_process');
const root = path.join(__dirname, '..'), priv = process.env.LEO_PRIVATE_DIR || path.join(root, 'private');
const { SB_URL, SB_ANON, SB_SERVICE, SB_PAT } = process.env, API = process.env.SB_API_BASE || 'https://api.supabase.com';
if(!SB_URL || !SB_ANON || !SB_SERVICE || !SB_PAT){ console.error('Faltan SB_URL, SB_ANON, SB_SERVICE o SB_PAT.'); process.exit(2); }
const ref = (/^https:\/\/([a-z0-9]+)\.supabase\.co/.exec(SB_URL) || [])[1] || process.env.SB_REF;
if(ref === 'iviksyhzhiygkuaojply' || /iviksyhzhiygkuaojply/.test(SB_URL)){ console.error('Ese es PRODUCCION. Esta prueba solo corre en un proyecto de prueba.'); process.exit(2); }
if(!ref){ console.error('No se pudo leer la referencia del proyecto.'); process.exit(2); }
const need = ['contenido/articulos.json', 'contenido/articulos.audio.json', 'seed-academia-contenido-articulos.sql'].map(f => path.join(priv, f));
need.forEach(f => { if(!fs.existsSync(f)){ console.error('Falta ' + f); process.exit(2); } });
const step = m => console.log('\n> ' + m);
async function sql(q){
  const r = await fetch(API + '/v1/projects/' + ref + '/database/query', { method: 'POST', headers: { Authorization: 'Bearer ' + SB_PAT, 'content-type': 'application/json' }, body: JSON.stringify({ query: q }) });
  const t = await r.text(); if(!r.ok) throw new Error('SQL fallo (' + r.status + '): ' + t.slice(0, 300)); try{ return JSON.parse(t); }catch(e){ return t; }
}
const pw = () => crypto.randomBytes(18).toString('base64url');
async function mkUser(label, member){
  const email = 'prueba-' + Date.now().toString(36) + '-' + label + '@example.com', password = pw();
  const r = await fetch(SB_URL + '/auth/v1/admin/users', { method: 'POST', headers: { apikey: SB_SERVICE, Authorization: 'Bearer ' + SB_SERVICE, 'content-type': 'application/json' }, body: JSON.stringify({ email, password, email_confirm: true }) });
  if(!r.ok) throw new Error('no se pudo crear la cuenta ' + label + ' (' + r.status + ')');
  await sql(`insert into public.profiles (id, is_member) select id, ${member} from auth.users where email = '${email}' on conflict (id) do update set is_member = ${member}`);
  return { email, password, spec: email + '|' + password };
}
function stage(name, accts){
  const env = Object.assign({}, process.env, { T_GRATIS: accts.gratis.spec, T_ACTIVO: accts.activo.spec, T_CANCELADO: accts.cancelado.spec, T_VENCIDO: accts.vencido.spec });
  const r = spawnSync(process.execPath, [path.join(__dirname, 'validar_curso3_supabase.js'), name], { env, encoding: 'utf8' });
  process.stdout.write(r.stdout || ''); if(r.stderr) process.stderr.write(r.stderr); return r.status === 0;
}
(async()=>{
  step('1/6 SQL: entorno minimo, migracion y contenido (en el proyecto de PRUEBA ' + ref + ')');
  await sql(fs.readFileSync(path.join(root, 'supabase/verify/prueba_real_curso3_entorno_minimo.sql'), 'utf8'));
  await sql(fs.readFileSync(path.join(root, 'supabase/migrations/20261028180000_academia_contenido_protegido.sql'), 'utf8'));
  await sql(fs.readFileSync(need[2], 'utf8'));
  step('2/6 Cuentas de prueba (contrasenas aleatorias, no se muestran)');
  const acc = { gratis: await mkUser('gratis', false), activo: await mkUser('activo', true), cancelado: await mkUser('cancelado', true), vencido: await mkUser('vencido', false) };
  step('3/6 Subiendo los audios al bucket privado academia-audio');
  const names = [...new Set(Object.values(JSON.parse(fs.readFileSync(need[1], 'utf8'))))]; let up = 0;
  for(const n of names){
    const f = path.join(priv, 'audio', n); if(!fs.existsSync(f)) throw new Error('falta el audio ' + n);
    const r = await fetch(SB_URL + '/storage/v1/object/academia-audio/' + n, { method: 'POST', headers: { apikey: SB_SERVICE, Authorization: 'Bearer ' + SB_SERVICE, 'content-type': 'audio/mpeg', 'x-upsert': 'true' }, body: fs.readFileSync(f) });
    if(!r.ok) throw new Error('fallo al subir ' + n + ' (' + r.status + ')'); up++;
  }
  console.log('  subidos ' + up + ' audios');
  step('4/6 Etapa APAGADO (el curso nace oculto)');
  await sql(`update public.academia_courses set enabled = false where course_id = 'articulos'`);
  const a = stage('apagado', acc);
  step('5/6 Etapa ENCENDIDO (solo en el proyecto de prueba)');
  await sql(`update public.academia_courses set enabled = true where course_id = 'articulos'`);
  const b = stage('encendido', acc);
  step('6/6 Guardando la cuenta para la prueba del telefono (el curso queda ENCENDIDO solo en el proyecto de prueba)');
  const keep = !process.argv.includes('--apagar-al-final');
  if(!keep) await sql(`update public.academia_courses set enabled = false where course_id = 'articulos'`);
  const out = path.join(priv, 'prueba-telefono.txt');
  fs.writeFileSync(out, 'Solo para la prueba del telefono (proyecto de PRUEBA). Borrar despues.\nURL: ' + SB_URL + '\nanon: ' + SB_ANON + '\ncorreo: ' + acc.activo.email + '\ncontrasena: ' + acc.activo.password + '\n', { mode: 0o600 });
  console.log('  datos para el telefono en ' + out + ' (el curso queda ' + (keep ? 'ENCENDIDO en el proyecto de prueba' : 'apagado') + ')');
  console.log('\nRESULTADO: ' + (a && b ? 'TODO OK' : 'HAY FALLAS (ver arriba)'));
  process.exit(a && b ? 0 : 1);
})().catch(e => { console.error('Error:', e.message); process.exit(2); });
