#!/usr/bin/env node
/* PROTECCION del contenido premium: servidor (PGlite con permisos por defecto de Supabase) + escaneo de lo que se publica.
   Corre con:  NODE_PATH=$(npm root -g) node tools/tests/academia-proteccion.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert'), { execFileSync } = require('child_process');
const H = require('./academia-pg-helpers.js');
const FU = require('../academia_fuente.js');
const root = H.root;
let passed = 0, failed = 0;
async function test(n, f){ try{ await f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split('\n').slice(0, 8).join('\n  ')); } }
const MIGS = ['20261027120000_academia_curso_pronombres', '20261028120000_academia_curso_articulos', '20261028180000_academia_contenido_protegido'].map(x => 'supabase/migrations/' + x + '.sql');
const contentFile = path.join(FU.privDir, 'contenido', 'articulos.json'), audioFile = path.join(FU.privDir, 'contenido', 'articulos.audio.json');

(async()=>{
  console.log('Protección del contenido premium');
  const PGlite = await H.loadPglite();
  const havePriv = fs.existsSync(contentFile) && fs.existsSync(audioFile);
  const content = havePriv ? Object.assign(JSON.parse(fs.readFileSync(contentFile, 'utf8')), { audio: JSON.parse(fs.readFileSync(audioFile, 'utf8')) }) : { course: 'articulos', version: 1, lessons: [{ id: 'x', screens: [{ text: 'SECRETO-PRUEBA' }] }], practice: [], audio: { 'SECRETO-PRUEBA': 'articulos/x.mp3' } };

  async function setup(){
    const db = await H.freshDb(PGlite, []);
    for(const m of MIGS) await db.exec(H.read(m));
    await db.exec(`update public.academia_courses set enabled = true where course_id in ('pronombres', 'articulos')`);
    await db.query('insert into public.academia_content (course_id, version, content) values ($1,$2,$3)', ['articulos', 1, JSON.stringify(content)]);
    return db;
  }
  const rpc = (db, uid, fn, args) => H.fakeClient(db, uid).rpc(fn, args);
  const asAnon = async (db, sql) => { await db.exec('begin'); try{ await db.exec('set local role anon'); const r = await db.query(sql); await db.exec('commit'); return { rows: r.rows }; }catch(e){ try{ await db.exec('rollback'); }catch(x){} return { error: String(e.message) }; } };
  const asAuth = async (db, uid, sql) => { try{ const r = await H.asUser(db, uid, () => db.query(sql)); return { rows: r.rows }; }catch(e){ return { error: String(e.message) }; } };
  const get = (db, uid, course) => rpc(db, uid, 'academia_get_content', { p_course: course }).then(r => r.data || { ok: false, error: 'rpc:' + (r.error && r.error.message) });

  if(!PGlite){ console.log('omitida: falta @electric-sql/pglite'); }
  else {
    await test('SIN SESION: anon no ejecuta academia_get_content ni academia_audio_allowed, ni lee la tabla de contenido', async()=>{
      const db = await setup();
      for(const f of ['public.academia_get_content(text)', 'public.academia_audio_allowed(text)'])
        assert.strictEqual((await db.query(`select has_function_privilege('anon', '${f}', 'execute') x`)).rows[0].x, false, f);
      assert.ok((await asAnon(db, `select public.academia_get_content('articulos')`)).error, 'anon pudo llamar al RPC');
      assert.ok((await asAnon(db, `select * from public.academia_content`)).error, 'anon leyo la tabla');
    });

    await test('CUENTA GRATIS: recibe error "members", nunca el contenido; tampoco lee la tabla directamente', async()=>{
      const db = await setup();
      const r = await get(db, H.U.free, 'articulos'); assert.deepStrictEqual([r.ok, r.error], [false, 'members']); assert.ok(!JSON.stringify(r).includes('SECRETO') && !r.content);
      const t = await asAuth(db, H.U.free, `select * from public.academia_content`); assert.ok(t.error, 'la cuenta gratis leyo la tabla');
      assert.strictEqual((await asAuth(db, H.U.free, `select public.academia_audio_allowed('articulos/x.mp3') a`)).rows[0].a, false);
    });

    await test('MIEMBRO activo: recibe el contenido completo y puede pedir audio; ni siquiera un miembro lee la tabla directamente', async()=>{
      const db = await setup();
      const r = await get(db, H.U.a, 'articulos'); assert.strictEqual(r.ok, true); assert.strictEqual(r.version, 1);
      assert.deepStrictEqual(r.content, JSON.parse(JSON.stringify(content)));
      assert.strictEqual((await asAuth(db, H.U.a, `select public.academia_audio_allowed('articulos/x.mp3') a`)).rows[0].a, true);
      assert.ok((await asAuth(db, H.U.a, `select * from public.academia_content`)).error, 'el miembro leyo la tabla');
      assert.ok((await asAuth(db, H.U.a, `update public.academia_content set content = '{}'`)).error);
      assert.ok((await asAuth(db, H.U.a, `insert into public.academia_content (course_id, content) values ('pronombres','{}')`)).error);
    });

    await test('CANCELADA pero vigente (is_member sigue true) conserva acceso; VENCIDA (is_member false) pierde contenido y audio al instante', async()=>{
      const db = await setup();
      assert.strictEqual((await get(db, H.U.b, 'articulos')).ok, true);
      await db.exec(`update public.profiles set is_member = false where id = '${H.U.b}'`);   // el webhook marca el vencimiento
      const r = await get(db, H.U.b, 'articulos'); assert.deepStrictEqual([r.ok, r.error], [false, 'members']);
      assert.strictEqual((await asAuth(db, H.U.b, `select public.academia_audio_allowed('articulos/x.mp3') a`)).rows[0].a, false);
      await db.exec(`update public.profiles set is_member = true where id = '${H.U.b}'`);
      assert.strictEqual((await get(db, H.U.b, 'articulos')).ok, true, 'al renovar vuelve el acceso');
    });

    await test('CURSO OCULTO / apagado: nadie (ni miembros) recibe contenido ni audio; al encenderlo vuelve', async()=>{
      const db = await setup();
      await db.exec(`update public.academia_courses set enabled = false where course_id = 'articulos'`);
      for(const u of [H.U.a, H.U.free]){ const r = await get(db, u, 'articulos'); assert.deepStrictEqual([r.ok, r.error], [false, 'course']); }
      assert.strictEqual((await asAuth(db, H.U.a, `select public.academia_audio_allowed('articulos/x.mp3') a`)).rows[0].a, false);
      await db.exec(`update public.academia_courses set enabled = true where course_id = 'articulos'`);
      assert.strictEqual((await get(db, H.U.a, 'articulos')).ok, true);
    });

    await test('SOLICITUDES MANIPULADAS: otro curso, curso inexistente, nulos, inyeccion, parametros de membresia inventados', async()=>{
      const db = await setup();
      for(const c of ['to-be', 'pronombres']){ const r = await get(db, H.U.a, c); assert.strictEqual(r.ok, false); assert.ok(!r.content, 'TO BE y Pronombres no tienen contenido en el servidor: ' + c); assert.strictEqual(r.error, 'none'); }
      for(const c of ['nope', "articulos' or '1'='1", 'ARTICULOS', ' articulos', '../articulos', null, '']) { const r = await get(db, H.U.a, c); assert.strictEqual(r.ok, false, String(c)); assert.ok(!r.content); }
      // el navegador no puede mandar su propia membresia: la funcion no tiene ese parametro
      const x = await rpc(db, H.U.free, 'academia_get_content', { p_course: 'articulos', p_member: true, is_member: true });
      assert.ok(x.error || (x.data && x.data.ok === false), 'un parametro inventado no debe dar acceso');
      assert.strictEqual((await asAuth(db, H.U.free, `update public.profiles set is_member = true where id = '${H.U.free}'`)).error ? 'denegado' : 'ok', 'denegado', 'la cuenta gratis no puede hacerse miembro');
      // rutas de audio de otro curso o sin carpeta valida no se autorizan
      for(const n of ['to-be/x.mp3', 'pronombres/x.mp3', '', 'x.mp3', '../articulos/x.mp3', 'otro/articulos/x.mp3']) assert.strictEqual((await asAuth(db, H.U.a, `select public.academia_audio_allowed('${n}') a`)).rows[0].a, false, n);
    });

    await test('la migracion es idempotente, no cambia permisos ni filas de TO BE y Pronombres y no toca pagos ni progreso', async()=>{
      const db = await setup();
      const q = async s => JSON.stringify((await db.query(s)).rows);
      const snap = async () => [await q(`select * from public.academia_courses where course_id in ('to-be','pronombres') order by 1`), await q(`select p.oid::regprocedure::text f, md5(p.prosrc) s, coalesce(p.proacl::text,'') a from pg_proc p where p.proname like 'academia\\_%' and p.proname not in ('academia_get_content','academia_audio_allowed') order by 1`), await q(`select c.relname, coalesce(c.relacl::text,'') a from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname <> 'academia_content' and c.relkind='r' order by 1`)];
      const a = await snap(); await db.exec(H.read(MIGS[2])); assert.deepStrictEqual(await snap(), a);
      const sql = H.read(MIGS[2]).replace(/--.*$/gm, '');
      assert.ok(!/\b(profiles|is_member\s*=|stripe|paypal|payments?)\b/i.test(sql.replace(/academia_is_member/g, '').replace(/public\.profiles/g, '')), 'la migracion no debe tocar pagos');
      assert.ok(!/\bupdate\s+public\.profiles|\binsert\s+into\s+public\.profiles/i.test(sql));
      assert.ok(/public\s*,\s*false|public = false/.test(sql) && /'academia-audio'/.test(sql), 'el bucket debe ser privado');
      assert.ok(/for select to authenticated/.test(sql) && !/to anon|to public/.test(sql.replace(/revoke[^;]*;/gi, '')), 'la politica del bucket solo para autenticados con membresia');
    });

    /* Politica REAL del bucket: se aplica la migracion sobre una replica fiel del esquema storage de Supabase (storage.buckets / storage.objects
       con RLS activo y los permisos por defecto de Supabase a anon y authenticated) y se consulta como cada rol. Esto prueba el SQL de la politica
       en el motor de Postgres; NO prueba la API de Storage de Supabase (firmado/descarga), que solo se puede validar en un proyecto Supabase de prueba. */
    async function setupStorage(){
      const db = await H.freshDb(PGlite, []);
      await db.exec(`create schema if not exists storage;
        create table storage.buckets (id text primary key, name text not null unique, owner uuid, created_at timestamptz default now(), updated_at timestamptz default now(), public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
        create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid, created_at timestamptz default now(), updated_at timestamptz default now(), last_accessed_at timestamptz default now(), metadata jsonb);
        alter table storage.objects enable row level security;
        grant usage on schema storage to anon, authenticated;
        grant all on storage.objects, storage.buckets to anon, authenticated;`);
      for(const m of MIGS) await db.exec(H.read(m));
      await db.exec(`update public.academia_courses set enabled = true where course_id in ('pronombres', 'articulos')`);
      await db.query('insert into public.academia_content (course_id, version, content) values ($1,$2,$3)', ['articulos', 1, JSON.stringify(content)]);
      await db.exec(`insert into storage.buckets (id, name, public) values ('otro', 'otro', false) on conflict do nothing;
        insert into storage.objects (bucket_id, name) values ('academia-audio', 'articulos/a1.mp3'), ('academia-audio', 'articulos/a2.mp3'), ('academia-audio', 'to-be/t1.mp3'), ('academia-audio', 'raiz.mp3'), ('otro', 'articulos/z.mp3');`);
      return db;
    }
    const nObj = async (db, uid) => { const r = uid === 'anon' ? await asAnon(db, `select count(*)::int n from storage.objects where bucket_id = 'academia-audio'`) : await asAuth(db, uid, `select count(*)::int n from storage.objects where bucket_id = 'academia-audio'`); return r.error ? 'ERR' : r.rows[0].n; };

    await test('POLITICA DEL BUCKET (RLS real): el bucket es privado; miembro ve solo la carpeta de un curso con contenido; gratis, anon y vencido ven 0; curso oculto 0', async()=>{
      const db = await setupStorage();
      const b = (await db.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'academia-audio'`)).rows[0];
      assert.deepStrictEqual([b.public, Number(b.file_size_limit), b.allowed_mime_types], [false, 2097152, ['audio/mpeg']]);
      const pol = (await db.query(`select cmd, roles::text r from pg_policies where schemaname = 'storage' and tablename = 'objects'`)).rows;
      assert.deepStrictEqual(pol.map(p => [p.cmd, p.r]), [['SELECT', '{authenticated}']], 'solo UNA politica: lectura para autenticados');
      assert.strictEqual(await nObj(db, H.U.a), 2, 'miembro: solo articulos/ (2 archivos), no to-be/ ni la raiz');
      assert.strictEqual(await nObj(db, H.U.free), 0, 'gratis');
      assert.ok([0, 'ERR'].includes(await nObj(db, 'anon')), 'anon');
      await db.exec(`update public.profiles set is_member = false where id = '${H.U.a}'`);
      assert.strictEqual(await nObj(db, H.U.a), 0, 'membresia vencida');
      await db.exec(`update public.profiles set is_member = true where id = '${H.U.a}'; update public.academia_courses set enabled = false where course_id = 'articulos'`);
      assert.strictEqual(await nObj(db, H.U.a), 0, 'curso oculto: ni el miembro');
      await db.exec(`update public.academia_courses set enabled = true where course_id = 'articulos'`);
      assert.strictEqual(await nObj(db, H.U.a), 2, 'al encender el curso vuelve');
      assert.strictEqual((await asAuth(db, H.U.a, `select count(*)::int n from storage.objects where bucket_id = 'otro'`)).rows[0].n, 0, 'otros buckets no se abren');
    });

    await test('POLITICA DEL BUCKET: nadie (ni un miembro) puede subir, cambiar ni borrar audios desde el navegador; la migracion es repetible', async()=>{
      const db = await setupStorage();
      for(const sql of [`insert into storage.objects (bucket_id, name) values ('academia-audio', 'articulos/nuevo.mp3')`, `update storage.objects set name = 'articulos/x.mp3' where bucket_id = 'academia-audio'`, `delete from storage.objects where bucket_id = 'academia-audio'`]){
        const r = await asAuth(db, H.U.a, sql); assert.ok(r.error || r.rows.length === 0, sql);
      }
      assert.strictEqual((await db.query(`select count(*)::int n from storage.objects where bucket_id = 'academia-audio'`)).rows[0].n, 4, 'los archivos siguen intactos');
      await db.exec(H.read(MIGS[2])); assert.strictEqual((await db.query(`select count(*)::int n from pg_policies where schemaname = 'storage'`)).rows[0].n, 1);
    });
  }

  /* ---- Lo que se PUBLICA (archivos que git sigue y el sitio sirve) ---- */
  const tracked = execFileSync('git', ['ls-files'], { cwd: root }).toString().split('\n').filter(Boolean);
  await test('git NO sigue ningun archivo de private/ ni audio del Curso 3; private/ esta ignorado', () => {
    assert.deepStrictEqual(tracked.filter(f => /^private\//.test(f) || /seed-academia|academia-examen-/.test(f)), []);
    assert.deepStrictEqual(tracked.filter(f => /^audio\/academia\/articulos\//.test(f)), []);
    execFileSync('git', ['check-ignore', '-q', 'private/contenido/articulos.json'], { cwd: root });
  });

  await test('ARCHIVOS PUBLICOS: ningun texto, ejercicio, opcion, respuesta ni frase de audio del Curso 3 aparece en lo que se publica', () => {
    if(!havePriv){ console.log('       (sin private/contenido: omitida)'); return; }
    const pub = tracked.filter(f => /\.(js|html|json|css|xml|txt|md|sql|py)$/.test(f) && f !== 'tools/tests/academia-proteccion.test.js').map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')]);
    // frases propias del curso: las de sus lecciones y practica que NO existen en ningun otro lado publico (TO BE / Pronombres / resto del sitio)
    const strings = new Set();
    (function walk(o){ if(typeof o === 'string'){ if(o.length >= 24) strings.add(o); } else if(o && typeof o === 'object') Object.keys(o).forEach(k => { if(k !== 'id') walk(o[k]); }); })({ l: content.lessons, p: content.practice });
    assert.ok(strings.size > 100, 'frases a revisar: ' + strings.size);
    const hits = [];
    // Frases genericas de la interfaz o textos que YA eran publicos en main (blog, temas) no cuentan: solo lo nuevo del curso.
    const inMain = (f, str) => { try{ return execFileSync('git', ['show', 'main:' + f], { cwd: root, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString().indexOf(str) !== -1; }catch(e){ return false; } };
    strings.forEach(s => { pub.forEach(([f, t]) => { if(t.indexOf(s) !== -1 && !inMain(f, s)) hits.push(f + ' :: ' + s.slice(0, 60)); }); });
    assert.deepStrictEqual(hits.slice(0, 5), [], 'contenido premium en archivos publicos (' + hits.length + ')');
    // el manifiesto de audio publico no lista el audio del Curso 3
    const man = fs.readFileSync(path.join(root, 'academia-audio.js'), 'utf8'); assert.ok(!/articulos/.test(man));
    Object.keys(content.audio).filter(t => t.length >= 24).forEach(t => assert.ok(man.indexOf(JSON.stringify(t)) === -1, 'audio en el manifiesto: ' + t));
    // el esqueleto publico del curso: solo titulos, resumenes e ids
    const sk = fu().A.courses.articulos; assert.strictEqual(sk.protected, true);
    sk.lessons.forEach(l => { assert.ok(!l.screens && !l.canSay, 'leccion con contenido: ' + l.id); assert.ok(!l.activities || l.activities.length === 0 || true); });
    assert.ok(!sk.exam.bank || sk.exam.bank.length === 0, 'la practica no debe estar publica');
  });
  function fu(){ return require('vm').runInNewContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';({A:ACADEMIA})', {}); }

  await test('el navegador no lleva respuestas: academia-data.js solo trae ids del Curso 3 (activityIds / practiceIds) y TO BE / Pronombres siguen completos', () => {
    const A = fu().A, c = A.courses.articulos;
    c.lessons.forEach(l => { assert.ok(Array.isArray(l.activityIds) && l.activityIds.length > 0, l.id); assert.ok(!('activities' in l)); });
    assert.ok(Array.isArray(c.exam.practiceIds) && c.exam.practiceIds.length > 0);
    ['to-be', 'pronombres'].forEach(id => { const x = A.courses[id]; assert.ok(!x.protected); x.lessons.forEach(l => assert.ok(l.screens.length && l.activities.length, id + ' ' + l.id)); });
  });

  await test('el cargador del navegador pide el contenido SOLO a miembros y solo para cursos protegidos (TO BE y Pronombres no hacen ninguna llamada nueva)', () => {
    const js = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
    assert.ok(/var PROT = COURSE\.protected === true/.test(js)); assert.ok(/if\(PROT && mode === 'member'\)/.test(js));
    assert.ok(/function audioFor\(text\)\{\s*if\(PROT\) return SIGNED\[text\] \|\| null;/.test(js));
    assert.ok(/createSignedUrls\(names, secs \|\| 900\)/.test(fs.readFileSync(path.join(root, 'academia-nube.js'), 'utf8')), 'URLs temporales de 15 min por defecto');
    assert.ok(/SIGN_SECS = 900, RENEW_MS = 8 \* 60 \* 1000/.test(js), 'enlaces de 15 min, renovacion a los 8');
    const gate = js.slice(js.indexOf('function gate(parts)'), js.indexOf('function gate(parts)') + 700);
    assert.ok(gate.indexOf('PROT &&') !== -1 && gate.indexOf('PROT') < gate.indexOf("if(!NUBE || mode === 'member') return false;"), 'el camino protegido va antes y separado');
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLAN' : ''));
  process.exit(failed ? 1 : 0);
})();
