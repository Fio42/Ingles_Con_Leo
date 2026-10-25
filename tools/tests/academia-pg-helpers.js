/* Ayudas compartidas para probar la academia contra un Postgres embebido (PGlite). No es una prueba por si sola. */
const fs = require('fs'), path = require('path');
const { createRequire } = require('module'), { pathToFileURL } = require('url');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(process.env.LEO_ROOT || root, f), 'utf8');

async function loadPglite(){
  const dirs = [process.env.LEO_PGLITE_DIR, process.cwd(), __dirname, root, '/tmp/claude-0/pg'].filter(Boolean);
  for(const d of dirs){
    try{
      const p = createRequire(path.join(d, 'x.js')).resolve('@electric-sql/pglite');
      const m = await import(pathToFileURL(p).href);
      return m.PGlite || (m.default && m.default.PGlite);
    }catch(e){ /* sigue */ }
  }
  return null;
}
const U = { a:'00000000-0000-4000-8000-0000000000a1', b:'00000000-0000-4000-8000-0000000000a2', free:'00000000-0000-4000-8000-0000000000f1' };

/* Base con el esquema minimo de Supabase + mistake_stats REAL + la migracion de academia REAL. */
async function freshDb(PGlite, bank){
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table public.profiles (id uuid primary key references auth.users(id), is_member boolean not null default false);
    grant usage on schema public to anon, authenticated;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    insert into auth.users values ('${U.a}'), ('${U.b}'), ('${U.free}');
    insert into public.profiles values ('${U.a}', true), ('${U.b}', true), ('${U.free}', false);
  `);
  const schema = read('supabase_schema.sql');
  const a0 = schema.indexOf('create table if not exists public.mistake_stats');
  const end = 'grant execute on function public.apply_mistake_results(jsonb) to authenticated;';
  await db.exec(schema.slice(a0, schema.indexOf(end) + end.length));
  // Supabase da estos permisos por defecto a las tablas de public; aqui se imitan solo para mistake_stats.
  await db.exec('grant select, insert, update on public.mistake_stats to authenticated; grant usage on all sequences in schema public to authenticated;');
  await db.exec(read('supabase/migrations/20261026120000_academia_integracion.sql'));
  await db.exec(`update public.academia_courses set enabled = true where course_id = 'to-be'`);
  for(const b of (bank || [])){
    await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)',
      ['to-be', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
  }
  return db;
}
async function asUser(db, uid, fn){
  await db.exec('begin');
  try{
    await db.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${uid}', true)`);
    const r = await fn();
    await db.exec('commit');
    return r;
  }catch(e){ try{ await db.exec('rollback'); }catch(x){} throw e; }
}
/* Cliente que imita @supabase/supabase-js lo justo (rpc, from().select().eq().maybeSingle()) sobre PGlite.
   latencyMs / failing permiten simular red lenta o caida. */
function fakeClient(db, uid, net){
  net = net || {};
  async function gate(){ if(net.down) throw new Error('network'); if(net.latency) await new Promise(r => setTimeout(r, net.latency)); }
  return {
    async rpc(fn, args){
      try{
        await gate();
        const keys = Object.keys(args || {});
        const sql = `select public.${fn}(${keys.map((k, i) => k + ' => $' + (i + 1)).join(', ')}) as r`;
        const vals = keys.map(k => (args[k] !== null && typeof args[k] === 'object') ? JSON.stringify(args[k]) : args[k]);
        const r = await asUser(db, uid, () => db.query(sql, vals));
        return { data: r.rows[0].r, error: null };
      }catch(e){ return { data: null, error: { message: String(e.message) } }; }
    },
    from(table){
      const st = { cols: '*', eq: {} };
      const b = {
        select(c){ st.cols = c || '*'; return b; },
        eq(k, v){ st.eq[k] = v; return b; },
        async maybeSingle(){
          try{
            await gate();
            const where = Object.keys(st.eq).map((k, i) => `${k} = $${i + 1}`).join(' and ');
            const r = await asUser(db, uid, () => db.query(`select ${st.cols} from public.${table}${where ? ' where ' + where : ''}`, Object.values(st.eq)));
            return { data: r.rows[0] || null, error: null };
          }catch(e){ return { data: null, error: { message: String(e.message) } }; }
        }
      };
      return b;
    }
  };
}
module.exports = { loadPglite, freshDb, asUser, fakeClient, U, read, root };
