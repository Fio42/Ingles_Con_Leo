/* Riso · fase 1: migración PENDIENTE de métricas (supabase/migrations/20261128030634_riso_metricas.sql) contra un PostgreSQL REAL
   con los roles de Supabase (anon, authenticated, service_role) y sesiones simuladas (auth.uid()).
   Entorno aislado: crea una base temporal y nunca toca producción.
   Uso: RISO_PG="postgres://postgres@127.0.0.1:5499/postgres" NODE_PATH=/tmp/pgl/node_modules node tools/tests/riso-metricas-pg.test.js */
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
  const nombre = 'riso_metricas_' + Date.now(); await admin.query('create database ' + nombre);
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

    const como = async (rol, uid, sql, params) => {
      await c.query('begin'); try {
        if (uid) await c.query("select set_config('request.jwt.claim.sub', $1, true)", [uid]);
        await c.query('set local role ' + rol);
        return (await c.query(sql, params)).rows[0];
      } finally { await c.query('commit'); }
    };
    const filas = async () => (await c.query('select * from public.riso_metricas_diarias order by capa, intencion, tema')).rows;

    await test('la tabla no guarda texto ni ids de alumno: solo columnas agregadas', async () => {
      const cols = (await c.query("select column_name, data_type from information_schema.columns where table_name = 'riso_metricas_diarias'")).rows.map(r => r.column_name);
      assert.deepStrictEqual(cols.sort(), ['cache_hits', 'capa', 'day', 'fallos', 'intencion', 'ms_1_a_3s', 'ms_3_a_6s', 'ms_hasta_1s', 'ms_mas_6s', 'ms_total', 'n', 'neuronas', 'tema', 'tokens_in', 'tokens_out', 'votos_neg'].sort());
      assert.ok(!cols.some(x => /user|alumno|pregunta|texto|email|ip/.test(x)));
    });
    await test('permisos: nadie lee la tabla; el navegador solo envía lotes y valoraciones; la IA y el resumen solo el servidor', async () => {
      const priv = async (rol, obj, tipo) => (await c.query(`select has_${tipo}_privilege($1, $2, '${tipo === 'table' ? 'select' : 'execute'}') ok`, [rol, obj])).rows[0].ok;
      for (const rol of ['anon', 'authenticated']) assert.strictEqual(await priv(rol, 'public.riso_metricas_diarias', 'table'), false, rol);
      assert.strictEqual(await priv('authenticated', 'public.riso_metricas_lote(jsonb)', 'function'), true);
      assert.strictEqual(await priv('anon', 'public.riso_metricas_lote(jsonb)', 'function'), false);
      assert.strictEqual(await priv('authenticated', 'public.riso_valorar(text,text,text)', 'function'), true);
      assert.strictEqual(await priv('authenticated', 'public.riso_metrica_ia(text,text,integer,integer,integer,numeric,boolean,boolean)', 'function'), false);
      assert.strictEqual(await priv('service_role', 'public.riso_metrica_ia(text,text,integer,integer,integer,numeric,boolean,boolean)', 'function'), true);
      assert.strictEqual(await priv('authenticated', 'public.riso_metricas_resumen(date,date)', 'function'), false);
      assert.strictEqual(await priv('authenticated', 'public.riso_metricas_sumar(text,text,text,integer,integer,integer,numeric,boolean,boolean,boolean)', 'function'), false);
      const rls = (await c.query("select relrowsecurity from pg_class where relname = 'riso_metricas_diarias'")).rows[0].relrowsecurity; assert.strictEqual(rls, true);
    });
    await test('lote del navegador: cuenta del piloto suma por capa, intención y tema con tiempos por tramo', async () => {
      const lote = [{ c: 'faq', i: 'explicacion', t: 'make-do', ms: 3 }, { c: 'faq', i: 'explicacion', t: 'make-do', ms: 1500 }, { c: 'codigo', i: 'traduccion', t: 'numero', ms: 1 },
        { c: 'biblioteca', i: 'pronunciacion', t: 'glosario:thought', ms: 2 }, { c: 'filtro', i: 'otra', t: 'fuera-de-alcance', ms: 0 }];
      const r = await como('authenticated', PILOTO, 'select public.riso_metricas_lote($1) n', [JSON.stringify(lote)]);
      assert.strictEqual(r.n, 5);
      const md = (await filas()).find(x => x.tema === 'make-do');
      assert.strictEqual(md.n, 2); assert.strictEqual(Number(md.ms_total), 1503); assert.strictEqual(md.ms_hasta_1s, 1); assert.strictEqual(md.ms_1_a_3s, 1);
    });
    await test('lote: sin sesión, cuenta fuera del piloto o anon no guardan nada', async () => {
      const antes = (await filas()).length;
      assert.strictEqual((await como('authenticated', null, 'select public.riso_metricas_lote($1) n', ['[{"c":"faq","i":"otra","t":"x","ms":1}]'])).n, 0);
      assert.strictEqual((await como('authenticated', FUERA, 'select public.riso_metricas_lote($1) n', ['[{"c":"faq","i":"otra","t":"x","ms":1}]'])).n, 0);
      await assert.rejects(como('anon', null, 'select public.riso_metricas_lote($1) n', ['[]']));
      assert.strictEqual((await filas()).length, antes);
    });
    await test('lote: el navegador no puede declarar respuestas de IA ni capas inventadas, ni texto libre como tema; máximo 50 por llamada', async () => {
      const malo = [{ c: 'ia', i: 'otra', t: 'x', ms: 1 }, { c: 'gemma', i: 'otra', t: 'x', ms: 1 }, { c: 'faq', i: 'hackeo', t: '¿Cómo se dice mi correo ana@x.com?', ms: 999999999 }];
      const r = await como('authenticated', PILOTO, 'select public.riso_metricas_lote($1) n', [JSON.stringify(malo)]);
      assert.strictEqual(r.n, 1, 'solo la de faq, normalizada');
      const fila = (await filas()).find(x => x.capa === 'faq' && x.tema === 'otro');
      assert.ok(fila && fila.intencion === 'otra' && Number(fila.ms_total) === 0, 'tema libre → otro; intención desconocida → otra; tiempo inválido → 0');
      assert.ok(!(await filas()).some(x => /@|¿/.test(x.tema)));
      const muchos = Array.from({ length: 80 }, () => ({ c: 'codigo', i: 'traduccion', t: 'hora', ms: 1 }));
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_metricas_lote($1) n', [JSON.stringify(muchos)])).n, 50);
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_metricas_lote($1) n', ['{"no":"es una lista"}'])).n, 0);
    });
    await test('lote: una respuesta repetida de la caché de sesión suma como acierto de caché sin tokens ni neuronas', async () => {
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_metricas_lote($1) n', ['[{"c":"cache","i":"traduccion","t":"libre","ms":2}]'])).n, 1);
      const ca = (await filas()).find(x => x.capa === 'cache' && x.intencion === 'traduccion'); assert.strictEqual(ca.cache_hits, 1); assert.strictEqual(Number(ca.neuronas), 0);
    });
    await test('servidor: respuesta de Gemma con tokens y neuronas reales; un fallo suma en «fallos»', async () => {
      await como('service_role', null, 'select public.riso_metrica_ia($1,$2,$3,$4,$5,$6,$7)', ['traduccion', 'libre', 2600, 470, 95, 6.86, true]);
      await como('service_role', null, 'select public.riso_metrica_ia($1,$2,$3,$4,$5,$6,$7)', ['traduccion', 'libre', 20000, 0, 0, 13.2, false]);
      const ia = (await filas()).find(x => x.capa === 'ia' && x.tema === 'libre');
      assert.strictEqual(ia.n, 2); assert.strictEqual(Number(ia.tokens_in), 470); assert.strictEqual(Number(ia.neuronas), 20.06); assert.strictEqual(ia.fallos, 1); assert.strictEqual(ia.ms_mas_6s, 1);
      await como('service_role', null, 'select public.riso_metrica_ia($1,$2,$3,$4,$5,$6,$7,$8)', ['explicacion', 'libre', 40, 0, 0, 0, true, true]);
      const ca = (await filas()).find(x => x.capa === 'cache' && x.intencion === 'explicacion'); assert.strictEqual(ca.cache_hits, 1, 'preparada para la caché compartida');
    });
    await test('valoración negativa: suma un voto sin contar como pregunta; solo cuentas del piloto', async () => {
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_valorar($1,$2,$3) r', ['faq', 'explicacion', 'make-do'])).r, 'ok');
      assert.strictEqual((await como('authenticated', FUERA, 'select public.riso_valorar($1,$2,$3) r', ['faq', 'explicacion', 'make-do'])).r, 'not_allowed');
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_valorar($1,$2,$3) r', ['filtro', 'otra', 'x'])).r, 'bad_capa');
      const md = (await filas()).find(x => x.tema === 'make-do'); assert.strictEqual(md.votos_neg, 1); assert.strictEqual(md.n, 2);
    });
    await test('resumen: porcentajes por capa, latencia, neuronas, lo más preguntado y lo que hay que revisar', async () => {
      const r = (await como('service_role', null, 'select public.riso_metricas_resumen() r')).r;
      assert.strictEqual(r.preguntas, 5 + 1 + 50 + 1 + 3);
      assert.ok(r.capas.ia && r.capas.ia.neuronas_por_respuesta === 10.03, JSON.stringify(r.capas.ia));
      assert.ok(r.capas.faq.pct > 0 && r.temas_frecuentes[0].tema === 'hora');
      assert.strictEqual(r.revisar[0].tema, 'make-do');
      await assert.rejects(como('authenticated', PILOTO, 'select public.riso_metricas_resumen() r'));
    });
    await test('corrección pendiente de search_path: fija la ruta y las métricas siguen sumando igual', async () => {
      await c.query(read('supabase/pendientes/20261128c_riso_metricas_search_path.sql'));
      const cfg = (await c.query("select proname, proconfig from pg_proc where proname in ('riso_metricas_norm_intencion','riso_metricas_norm_tema') order by proname")).rows;
      assert.ok(cfg.length === 2 && cfg.every(r => (r.proconfig || []).includes('search_path=""')), JSON.stringify(cfg));
      const antes = (await c.query("select coalesce(sum(n),0)::int n from public.riso_metricas_diarias")).rows[0].n;
      assert.strictEqual((await como('authenticated', PILOTO, 'select public.riso_metricas_lote($1) n', ['[{"c":"faq","i":"explicacion","t":"make-do","ms":5},{"c":"faq","i":"rara","t":"Texto Libre","ms":5}]'])).n, 2);
      assert.strictEqual((await c.query("select coalesce(sum(n),0)::int n from public.riso_metricas_diarias")).rows[0].n, antes + 2);
      assert.ok((await filas()).some(x => x.intencion === 'otra' && x.tema === 'otro'));
      await c.query(read('supabase/pendientes/20261128c_riso_metricas_search_path_revertir.sql'));
      assert.ok((await c.query("select proconfig from pg_proc where proname = 'riso_metricas_norm_tema'")).rows[0].proconfig === null);
      await c.query(read('supabase/pendientes/20261128c_riso_metricas_search_path.sql'));
    });
    await test('reversión: deja la base sin rastro de las métricas y el chat del piloto intacto', async () => {
      await c.query(read('supabase/pendientes/20261128b_riso_metricas_revertir.sql'));
      assert.strictEqual((await c.query("select count(*)::int n from information_schema.tables where table_name = 'riso_metricas_diarias'")).rows[0].n, 0);
      assert.strictEqual((await c.query("select count(*)::int n from pg_proc where proname like 'riso_metric%' or proname = 'riso_valorar'")).rows[0].n, 0);
      assert.strictEqual((await c.query('select public.riso_chat_status($1) s', [PILOTO])).rows[0].s.enabled, true);
      await c.query(read('supabase/migrations/20261128030634_riso_metricas.sql')); // se puede volver a aplicar
    });
  } finally {
    await c.end(); await admin.query('drop database ' + nombre); await admin.end();
  }
  console.log('\n' + p + ' ok, ' + f + ' fallos'); process.exit(f ? 1 : 0);
})();
