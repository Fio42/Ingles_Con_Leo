// Prueba de la migracion 20261115140000 en un Postgres real en memoria. Uso: copiar este archivo a una carpeta con @electric-sql/pglite instalado y ejecutar: node email-suppressions.pglite.mjs <ruta-del-repo>
import { PGlite } from '@electric-sql/pglite'; import fs from 'fs'; import assert from 'assert'
const db = new PGlite()
await db.exec(`create role anon; create role authenticated;
create table public.profiles (id int generated always as identity primary key, email text, email_invalid boolean not null default false, email_invalid_at timestamptz, email_paused_until timestamptz);`)
await db.exec(fs.readFileSync((process.argv[2] || process.cwd()) + '/supabase/migrations/20261115140000_email_suppressions.sql','utf8'))
const q = async (s,p)=> (await db.query(s,p)).rows
const NEVER='9999-12-31T00:00:00.000Z'
await db.exec(`insert into public.profiles(email) values ('Ana@X.com'),('ana@x.com '),('otra@x.com')`)
await q(`insert into public.email_suppressions(email,reason) values ('ana@x.com','transient_bounce')`)
let r = await q(`select email,email_invalid,email_paused_until from public.profiles order by id`)
assert.strictEqual(r[0].email_paused_until?.toISOString(),NEVER); assert.strictEqual(r[1].email_paused_until?.toISOString(),NEVER); assert.strictEqual(r[2].email_paused_until,null); assert(r.every(x=>x.email_invalid===false))
// cuenta nueva con ese correo nace pausada; con otro correo no
await db.exec(`insert into public.profiles(email) values ('ANA@x.com'),('limpio@x.com')`)
r = await q(`select email,email_paused_until from public.profiles order by id`)
assert.strictEqual(r[3].email_paused_until?.toISOString(),NEVER); assert.strictEqual(r[4].email_paused_until,null)
// cambio de correo hacia/desde la direccion
await db.exec(`update public.profiles set email='nuevo@x.com' where id=4`); await db.exec(`update public.profiles set email='ana@x.com' where id=3`)
r = await q(`select id,email_paused_until from public.profiles order by id`)
assert.strictEqual(r[3].email_paused_until,null); assert.strictEqual(r[2].email_paused_until?.toISOString(),NEVER)
// endurecer a permanente: marca email_invalid
await q(`update public.email_suppressions set reason='permanent_bounce' where email='ana@x.com'`)
r = await q(`select id,email_invalid from public.profiles where lower(btrim(email))='ana@x.com' order by id`); assert(r.every(x=>x.email_invalid))
// permanente directo en una direccion nueva y cuenta futura
await q(`insert into public.email_suppressions(email,reason) values ('dura@x.com','complaint')`); await db.exec(`insert into public.profiles(email) values ('dura@x.com')`)
r = await q(`select email_invalid from public.profiles where email='dura@x.com'`); assert.strictEqual(r[0].email_invalid,true)
// reversion: borrar la fila libera SOLO la pausa de esa direccion
await q(`insert into public.email_suppressions(email,reason) values ('pausa@x.com','transient_bounce')`); await db.exec(`insert into public.profiles(email) values ('pausa@x.com')`)
await q(`delete from public.email_suppressions where email='pausa@x.com'`)
r = await q(`select email_paused_until from public.profiles where email='pausa@x.com'`); assert.strictEqual(r[0].email_paused_until,null)
// check de minusculas
await assert.rejects(()=>q(`insert into public.email_suppressions(email,reason) values ('MAY@x.com','transient_bounce')`))
// un fallo dentro del trigger de profiles no rompe el alta
await db.exec(`drop table public.email_suppressions cascade`) // trigger queda apuntando a tabla inexistente
await db.exec(`insert into public.profiles(email) values ('sigue@x.com')`) 
console.log('MIGRACION OK (11 comprobaciones)')
