/* Riso · fase 1: migración PENDIENTE de métricas (supabase/migrations/20261128030634_riso_metricas.sql) contra un PostgreSQL REAL
   con los roles de Supabase (anon, authenticated, service_role) y sesiones simuladas (auth.uid()).
   Entorno aislado: crea una base temporal y nunca toca producción.
   Uso: RISO_PG="postgres://postgres@127.0.0.1:5499/postgres" NODE_PATH=/tmp/pgl/node_modules node tools/tests/riso-cache-pg.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createRequire } = require('module');
const ROOT = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let pg; for (const d of [process.env.LEO_PG_DIR, '/tmp/pgl', ROOT].filter(Boolean)) { try { pg = createRequire(path.join(d, 'x.js'))('pg'); break; } catch (e) { /* sigue */ } }
const URL0 = process.env.RISO_PG;
if (!pg || !URL0) { console.log('  (omitida: define RISO_PG y ten el paquete pg)'); process.exit(0); }
if (/supabase\.co|pooler\.supabase/.test(URL0)) { console.log('Nunca contra producción.'); process.exit(1); }
const U = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const PILOTO = U(1), FUERA = U(2);

(async () => {
  let p = 0, f = 0;
  async function test(n, fn) { try { await fn(); p++; console.log('  ok   ' + n); } catch (e) { f++; console.log('  FAIL ' + n + '\n       ' + String(e && e.stack || e).split('\n').slice(0, 3).join('\n       ')); } }
  const admin = new pg.Client({ connectionString: URL0 }); await admin.connect();
  const nombre = 'riso_cache_' + Date.now(); await admin.query('create database ' + nombre);
  const url = URL0.replace(/\/postgres(\?|$)/, '/' + nombre + '$1');
  const c = new pg.Client({ connectionString: url }); await c.connect();
  try {
    await c.query(`
      do $$ begin
        if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select from pg_roles where rolname = 'service_role') then create role service_role; end if;
      end $$;
      create schema auth;
      create table auth.users (id uuid primary key, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
      create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false, member_since timestamptz);
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
      grant usage on schema public to anon, authenticated, service_role;
      create table public.log_calls (fp text, severity text, message text);
      create function public.log_app_error(p_fp text, p_kind text, p_source text, p_severity text, p_section text, p_message text, p_error_name text,
        p_stack_top text, p_code text, p_release text, p_browser text, p_platform text, p_sample jsonb) returns jsonb language plpgsql as $$
        begin insert into public.log_calls values (p_fp, p_severity, p_message); return '{"logged":true}'; end $$;
    `);
    await c.query(read('supabase_functions/leo-ai.sql'));
    await c.query(read('supabase/migrations/20261016001253_leo_ai_trial.sql'));
    for (const [id, m] of [[PILOTO, true], [FUERA, true]]) { await c.query('insert into auth.users values ($1, now())', [id]); await c.query('insert into public.profiles (id, is_member) values ($1, $2)', [id, m]); }
    await c.query(`insert into public.leo_ai_config (id, enabled, public) values (true, true, true) on conflict (id) do update set enabled = true, public = true`);
    await c.query(read('supabase/pendientes/20261128_riso_chat_piloto.sql'));
    await c.query(`update public.leo_ai_config set chat_enabled = true; insert into public.riso_pilot_testers (user_id) values ('${PILOTO}')`);
    await c.query(read('supabase/migrations/20261128030634_riso_metricas.sql'));
    await c.query(read('supabase/pendientes/20261128d_riso_cache.sql'));

    const como = async (rol, uid, sql, params) => {
      await c.query('begin'); try {
        if (uid) await c.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
        await c.query('set local role ' + rol);
        return (await c.query(sql, params)).rows[0];
      } finally { await c.query('commit'); }
    };
    const filas = async () => (await c.query('select * from public.riso_metricas_diarias order by capa, intencion, tema')).rows;


    const K = 'a1b2c3d4e5f60718', K2 = 'ffffeeeeddddcccc';
    const srv = (sql, params) => como('service_role', null, sql, params);
    await test('al aplicarla queda APAGADA: no guarda ni responde nada', async () => {
      assert.strictEqual((await c.query('select riso_cache from public.leo_ai_config')).rows[0].riso_cache, false);
      assert.strictEqual((await srv('select public.riso_cache_guardar($1,$2,$3,$4,$5,$6) r', [K, 'traduccion', 'como se dice sobremesa en ingles', 'Se dice after-dinner conversation.', 'We had a long after-dinner conversation.', 'Tuvimos una larga sobremesa.'])).r, 'off');
      assert.strictEqual((await srv('select public.riso_cache_buscar($1) r', [K])).r, null);
    });
    await test('encendida: guarda una vez, responde y cuenta usos; no reemplaza una respuesta existente', async () => {
      await c.query('update public.leo_ai_config set riso_cache = true');
      assert.strictEqual((await srv('select public.riso_cache_guardar($1,$2,$3,$4,$5,$6) r', [K, 'traduccion', 'como se dice sobremesa en ingles', 'Se dice after-dinner conversation.', 'We had a long after-dinner conversation.', 'Tuvimos una larga sobremesa.'])).r, 'ok');
      await srv('select public.riso_cache_guardar($1,$2,$3,$4,$5,$6) r', [K, 'traduccion', 'como se dice sobremesa en ingles', 'Otra respuesta distinta.', '', '']);
      const r = (await srv('select public.riso_cache_buscar($1) r', [K])).r;
      assert.strictEqual(r.texto, 'Se dice after-dinner conversation.'); await srv('select public.riso_cache_buscar($1) r', [K]);
      assert.strictEqual((await c.query('select usos from public.riso_cache where clave = $1', [K])).rows[0].usos, 2);
    });
    await test('la tabla no guarda alumnos y nadie la lee desde el navegador', async () => {
      const cols = (await c.query("select column_name from information_schema.columns where table_name = 'riso_cache'")).rows.map(r => r.column_name);
      assert.ok(!cols.some(x => /user|alumno|email/.test(x)), cols.join());
      for (const rol of ['anon', 'authenticated']) {
        assert.strictEqual((await c.query("select has_table_privilege($1, 'public.riso_cache', 'select') ok", [rol])).rows[0].ok, false);
        for (const f of ['riso_cache_buscar(text)', 'riso_cache_guardar(text,text,text,text,text,text)', 'riso_cache_revisar(text,integer)', 'riso_cache_aprobar(text)', 'riso_cache_retirar(text)'])
          assert.strictEqual((await c.query('select has_function_privilege($1, $2, \'execute\') ok', [rol, 'public.' + f])).rows[0].ok, false, rol + ' ' + f);
      }
      await assert.rejects(como('authenticated', PILOTO, 'select public.riso_cache_buscar($1) r', [K]));
    });
    await test('«No me ayudó» sobre una respuesta de la caché la retira; ya no se sirve', async () => {
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_valorar($1,$2,$3) r', ['cache', 'traduccion', 'cache:' + K])).r, 'ok');
      const f = (await c.query('select estado, votos_neg from public.riso_cache where clave = $1', [K])).rows[0];
      assert.strictEqual(f.estado, 'retirada'); assert.strictEqual(f.votos_neg, 1);
      assert.strictEqual((await srv('select public.riso_cache_buscar($1) r', [K])).r, null);
      assert.strictEqual((await como('authenticated', FUERA, 'select public.riso_valorar($1,$2,$3) r', ['cache', 'traduccion', 'cache:' + K])).r, 'not_allowed');
    });
    await test('Leo revisa, aprueba (un voto ya no la retira) y retira', async () => {
      await srv('select public.riso_cache_guardar($1,$2,$3,$4,$5,$6) r', [K2, 'explicacion', 'cuando uso used to', 'Used to es para hábitos del pasado.', 'I used to play soccer.', 'Antes jugaba fútbol.']);
      const lista = (await srv('select public.riso_cache_revisar() r')).r; assert.strictEqual(lista.length, 2); assert.strictEqual(lista[0].votos_neg, 1);
      assert.strictEqual((await srv('select public.riso_cache_aprobar($1) r', [K2])).r, 'ok');
      await como('authenticated', PILOTO, 'select public.riso_valorar($1,$2,$3) r', ['cache', 'explicacion', 'cache:' + K2]);
      assert.strictEqual((await srv('select public.riso_cache_buscar($1) r', [K2])).r.estado, 'aprobada');
      assert.strictEqual((await srv('select public.riso_cache_retirar($1) r', [K2])).r, 'ok');
      assert.strictEqual((await srv('select public.riso_cache_buscar($1) r', [K2])).r, null);
    });
    await test('tope de filas: con la caché llena no guarda más', async () => {
      await c.query('update public.leo_ai_config set riso_cache_max = 2');
      assert.strictEqual((await srv('select public.riso_cache_guardar($1,$2,$3,$4,$5,$6) r', ['0000000000000001', 'traduccion', 'x x x x', 'Respuesta de prueba.', '', ''])).r, 'full');
    });
    await test('reversión: quita la caché y riso_valorar sigue funcionando como antes', async () => {
      await c.query(read('supabase/pendientes/20261128d_riso_cache_revertir.sql'));
      assert.strictEqual((await c.query("select count(*)::int n from information_schema.tables where table_name = 'riso_cache'")).rows[0].n, 0);
      assert.strictEqual((await c.query("select count(*)::int n from information_schema.columns where table_name = 'leo_ai_config' and column_name like 'riso_cache%'")).rows[0].n, 0);
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_valorar($1,$2,$3) r', ['faq', 'explicacion', 'make-do'])).r, 'ok');
      await c.query(read('supabase/pendientes/20261128d_riso_cache.sql'));
    });
  } finally {
    await c.end(); await admin.query('drop database ' + nombre); await admin.end();
  }
  console.log('\n' + p + ' ok, ' + f + ' fallos'); process.exit(f ? 1 : 0);
})();
