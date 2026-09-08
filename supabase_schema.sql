-- ============================================================
-- Inglés con Leo — esquema de Supabase
-- Copia y pega TODO este archivo en:
--   Supabase -> tu proyecto -> SQL Editor -> New query -> Run
-- Se puede correr una sola vez. Si algo falla porque ya existe,
-- es seguro ignorar ese error puntual.
-- ============================================================

-- Tabla de perfiles de miembros. Se crea automáticamente una fila
-- por cada persona que inicia sesión (ver el trigger más abajo).
-- is_member empieza en false: tú lo activas a mano cuando ves que
-- pagó (Supabase -> Table Editor -> profiles -> editar la fila),
-- hasta que automaticemos esto con Mercado Pago.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_member boolean not null default false,
  member_since timestamptz,
  created_at timestamptz not null default now()
);

-- Sesiones de práctica de cada miembro (una fila por sesión
-- terminada: gramática, vocabulario, listening, writing, speaking,
-- mixto). Esto es lo que permite que el progreso se vea igual en
-- cualquier dispositivo.
create table if not exists public.progress_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  level text not null,
  topics jsonb not null default '[]'::jsonb,
  date date not null,
  started_at bigint,
  duration_ms bigint,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists progress_sessions_user_id_idx on public.progress_sessions(user_id);

-- Seguridad: cada quien solo puede leer/escribir SUS propias filas.
alter table public.profiles enable row level security;
alter table public.progress_sessions enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "progress_sessions: select own" on public.progress_sessions;
create policy "progress_sessions: select own" on public.progress_sessions
  for select using (auth.uid() = user_id);

drop policy if exists "progress_sessions: insert own" on public.progress_sessions;
create policy "progress_sessions: insert own" on public.progress_sessions
  for insert with check (auth.uid() = user_id);

-- Crea automáticamente una fila en profiles cada vez que alguien
-- inicia sesión por primera vez (con el enlace mágico por correo).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Listo. Para activar a un miembro manualmente:
-- Table Editor -> profiles -> busca su email -> is_member = true
-- (y opcionalmente member_since = la fecha de hoy).
