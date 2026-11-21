#!/usr/bin/env node
/* LeoBot: seguridad de las capturas y topes contra abuso. Revisa por texto la migracion SQL, la Edge Function y el
   formulario. Corre con: node tools/tests/leobot-seguridad.test.js
   Es una red de seguridad contra cambios accidentales; la prueba real es correr el SQL en Supabase y mandar un reporte. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const sql = read('supabase/migrations/20261121120000_leobot_capturas.sql');
const fn = read('supabase_functions/leobot-notify.ts');
const bot = read('chatbot.js');
const code = sql.replace(/--.*$/gm, '');           // SQL sin comentarios
const flat = code.replace(/\s+/g, ' ');
let passed = 0;
const test = (name, f) => { try{ f(); passed++; console.log('  ok  ' + name); }catch(e){ console.error('FALLA ' + name + '\n  ' + e.message); process.exitCode = 1; } };

test('el bucket es privado, con tope de 4 MB y solo imagenes', () => {
  assert.ok(/'leobot-reports', 'leobot-reports', false, 4194304, array\['image\/jpeg', 'image\/png', 'image\/webp'\]/.test(flat));
  assert.ok(/set public = false/.test(flat));
});
test('solo existe UNA politica de storage para el navegador y es de insert (nada de select/update/delete)', () => {
  const pol = flat.match(/create policy "[^"]+" on storage\.objects for \w+/g) || [];
  assert.strictEqual(pol.length, 1);
  assert.ok(/for insert to anon, authenticated/.test(flat));
  assert.ok(!/on storage\.objects for (select|update|delete|all)/.test(flat));
});
test('subir exige: bucket, ruta <uuid>/captura.jpg y que el reporte exista, sea reciente y de la misma persona', () => {
  assert.ok(/bucket_id = 'leobot-reports'/.test(flat));
  assert.ok(flat.indexOf('captura\\.jpg$') !== -1 && flat.indexOf('^[0-9a-f]{8}-') !== -1);
  assert.ok(/public\.leobot_can_attach\(name\)/.test(flat));
  const i = flat.indexOf('create or replace function public.leobot_can_attach');
  const f = flat.slice(i, flat.indexOf('revoke all on function public.leobot_can_attach'));
  assert.ok(/r\.id::text = split_part\(p_name, '\/', 1\)/.test(f));
  assert.ok(/created_at > now\(\) - interval '10 minutes'/.test(f));
  assert.ok(/r\.user_id is null or r\.user_id = auth\.uid\(\)/.test(f));
  assert.ok(/security definer/.test(f));
});
test('hay tope por IP, por usuario y total en cada reporte nuevo, y la IP solo se guarda como hash', () => {
  assert.ok(/before insert on public\.leobot_reports/.test(flat));
  assert.ok(/ip_hash = new\.ip_hash and created_at > now\(\) - interval '1 hour'\) >= 8/.test(flat));
  assert.ok(/user_id = new\.user_id and created_at > now\(\) - interval '1 hour'\) >= 8/.test(flat));
  assert.ok(/interval '1 hour'\) >= 200/.test(flat));
  assert.ok(/md5\('leobot:' \|\| ip\)/.test(flat));
  assert.ok(/new\.notified_at := null/.test(flat));
  assert.ok(/cf-connecting-ip/.test(flat));
});
test('el context del reporte tiene tope de tamano', () => { assert.ok(/pg_column_size\(context\) <= 20000/.test(flat)); });
test('leobot-notify: valida el id, avisa una sola vez, solo de reportes recientes y reserva el aviso antes de enviar', () => {
  assert.ok(/UUID_RE\.test\(reportId\)/.test(fn));
  assert.ok(/if \(report\.notified_at\) return/.test(fn));
  assert.ok(/NOTIFY_WINDOW_MS/.test(fn));
  assert.ok(/\.is\('notified_at', null\)/.test(fn));
});
test('leobot-notify firma SOLO la captura de ESE reporte: la ruta sale del id, nunca del context ni del navegador', () => {
  assert.ok(fn.indexOf("createSignedUrl(reportId + '/captura.jpg'") !== -1);
  assert.ok(fn.indexOf('createSignedUrl(ctx.') === -1 && !/ctx\.captura\b/.test(fn));
  assert.ok(/\.list\(reportId/.test(fn));
  assert.strictEqual((fn.match(/createSignedUrl\(/g) || []).length, 1);
});
test('el check de datos de la sesion viene DESMARCADO y el historial solo se manda para problemas de ejercicio o curso', () => {
  assert.ok(/sessInput\.checked = false/.test(bot) && !/sessInput\.checked = true/.test(bot));
  assert.ok(/CATEGORIES_WITH_HISTORY = \[REPORT_CATEGORIES\[2\], REPORT_CATEGORIES\[3\]\]/.test(bot));
  assert.ok(/if\(withHistory\) put\('ultimas_sesiones'/.test(bot) && /if\(withHistory\) put\('sesiones_a_medias'/.test(bot));
  assert.ok(/put\('ejercicio'/.test(bot) && /put\('archivos'/.test(bot) && /put\('agente'/.test(bot));
  const snap = bot.slice(bot.indexOf('function collectSessionSnapshot'), bot.indexOf('function compressImage'));
  ['password', 'token', 'leo_profile', 'access_token'].forEach(w => assert.ok(snap.toLowerCase().indexOf(w) === -1, 'el snapshot menciona ' + w));
});
console.log('\n' + passed + ' pruebas correctas');
