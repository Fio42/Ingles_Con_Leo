-- SOLO PARA UN PROYECTO SUPABASE DE PRUEBA VACIO. NUNCA en produccion.
-- Crea el minimo que necesita la migracion 20261028180000_academia_contenido_protegido.sql para probar
-- autenticacion real + Storage real + las politicas reales del Curso 3. No incluye pagos, progreso ni examenes.
-- Orden: 1) este archivo, 2) la migracion 20261028180000, 3) private/seed-academia-contenido-articulos.sql,
--        4) subir private/audio/articulos/ al bucket academia-audio, 5) tools/validar_curso3_supabase.js
do $$
begin
  if to_regclass('public.progress_sessions') is not null or to_regclass('public.academia_progress') is not null or to_regclass('public.mistake_stats') is not null then
    raise exception 'Este proyecto parece ser el de produccion (tiene tablas del sitio). No se aplica nada.';
  end if;
end
$$;

create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, is_member boolean not null default false);
alter table public.profiles enable row level security;
create table if not exists public.academia_courses (course_id text primary key, title text not null, enabled boolean not null default false);
alter table public.academia_courses enable row level security;
create or replace function public.academia_is_member(p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_member from public.profiles where id = p_uid), false)
$$;
revoke all on function public.academia_is_member(uuid) from public, anon, authenticated;
insert into public.academia_courses (course_id, title, enabled) values ('articulos', 'Artículos y plurales', false) on conflict do nothing;

-- Cuentas de prueba: crealas en Authentication > Users (Add user, con "Auto confirm"). Luego, con SUS correos:
--   insert into public.profiles (id, is_member) select id, true  from auth.users where email = 'activo@ejemplo.test';
--   insert into public.profiles (id, is_member) select id, false from auth.users where email = 'gratis@ejemplo.test';
--   insert into public.profiles (id, is_member) select id, false from auth.users where email = 'vencido@ejemplo.test';
-- Encender / apagar el curso para las dos etapas de la prueba:
--   update public.academia_courses set enabled = true  where course_id = 'articulos';
--   update public.academia_courses set enabled = false where course_id = 'articulos';
