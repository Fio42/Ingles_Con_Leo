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
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Por si ya tenías la tabla creada de antes (sin esta columna, de
-- cuando solo existía Mercado Pago): la agrega sin borrar nada.
-- La usa el webhook de Stripe para identificar de quién es una
-- suscripción en avisos que ya no traen el id de usuario.
alter table public.profiles add column if not exists stripe_customer_id text;
create unique index if not exists profiles_stripe_customer_id_idx on public.profiles(stripe_customer_id) where stripe_customer_id is not null;

-- Lo mismo pero para PayPal: la usa el webhook de PayPal para
-- identificar de quién es una suscripción cuando se cancela o
-- se suspende (esos avisos ya no traen el id de usuario).
alter table public.profiles add column if not exists paypal_subscription_id text;
create unique index if not exists profiles_paypal_subscription_id_idx on public.profiles(paypal_subscription_id) where paypal_subscription_id is not null;

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

-- NOTA: aquí NO hay una política de "update own" a propósito.
-- Se quitó porque permitía que cualquier usuario logueado se
-- marcara a sí mismo como is_member=true desde el navegador, sin
-- pagar. Ni Mercado Pago ni Stripe la necesitan: sus webhooks usan
-- la service_role key, que se salta RLS por diseño.

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

-- ============================================================
-- Actualización 2026-09-16 — conversión de cuentas que no pagan
-- (emails automáticos "recuerda activar tu membresía" + analítica).
-- Corre esto en Supabase -> tu proyecto -> SQL Editor -> New query.
-- Es seguro correrlo aunque ya hayas corrido el resto de este
-- archivo antes: no borra, no renombra y no toca ninguna fila que
-- ya exista. Antes de correrlo, lee la nota de la Service Role Key
-- más abajo (hay que reemplazar un valor a mano).
-- ============================================================

-- 3 columnas nuevas en profiles, las 3 opcionales (empiezan en NULL,
-- que quiere decir "todavía no pasó"). No se toca ninguna columna
-- existente.
alter table public.profiles add column if not exists checkout_started_at timestamptz;
alter table public.profiles add column if not exists upgrade_email_1_sent_at timestamptz;
alter table public.profiles add column if not exists upgrade_email_2_sent_at timestamptz;

-- Prende las 2 extensiones de Postgres que necesita el Cron de
-- Supabase: pg_cron para programar, pg_net para que ese programa
-- pueda llamar a la Edge Function por HTTP. Están disponibles en
-- el plan gratis de Supabase, no hace falta pagar nada nuevo.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Programa que la función de Supabase "upgrade-nudge-emails" (ver
-- supabase_functions/upgrade-nudge-emails.ts) corra sola cada 30
-- minutos. Ella decide cada vez, revisando profiles, a quién le
-- toca el correo 1, a quién el correo 2, y a quién no le toca nada
-- (ya es miembro, ya se le mandó, o todavía no le toca por tiempo).
--
-- *** ANTES DE CORRER ESTO ***: reemplaza TU_SECRET_KEY_AQUI por tu
-- Secret Key real (Supabase -> Project Settings -> API Keys ->
-- "Secret keys" -> ojo/copiar). Es secreta: no la pegues en ningún
-- archivo de este repositorio, solo aquí, directo en el SQL Editor,
-- al momento de correrlo.
--
-- Ojo técnico (para que no se rompa): las claves nuevas de Supabase
-- (sb_secret_..., sb_publishable_...) NO son JWT, así que van en el
-- header "apikey", nunca en "Authorization: Bearer" (eso solo es
-- para JWT). Por eso este llamado usa el header "apikey" en vez de
-- "Authorization". Además, hay que apagar "Verify JWT" en la
-- configuración de esta función específica (paso 3 del chat) para
-- que Supabase no le exija un JWT que esta clave nueva no es.
select cron.schedule(
  'inglesconleo-upgrade-nudge-emails',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/upgrade-nudge-emails',
    headers := jsonb_build_object(
      'apikey', 'TU_SECRET_KEY_AQUI',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para revisar que el Cron quedó programado:
--   select jobid, schedule, jobname, active from cron.job;
-- Para pausarlo o borrarlo más adelante si hiciera falta:
--   select cron.unschedule('inglesconleo-upgrade-nudge-emails');

-- ------------------------------------------------------------
-- Consulta de analítica (SOLO LECTURA, no cambia nada). Pégala
-- en el SQL Editor cuando quieras ver: cuentas creadas, cuentas
-- sin pagar, cuántas iniciaron checkout, cuántas pagaron, y la
-- conversión aproximada. Puedes correrla las veces que quieras.
-- ------------------------------------------------------------
-- select
--   count(*) as cuentas_creadas,
--   count(*) filter (where is_member) as cuentas_pagando,
--   count(*) filter (where not is_member) as cuentas_sin_pagar,
--   count(*) filter (where checkout_started_at is not null) as iniciaron_checkout,
--   round(
--     100.0 * count(*) filter (where is_member) / nullif(count(*), 0), 1
--   ) as conversion_pct_de_cuentas_creadas,
--   round(
--     100.0 * count(*) filter (where is_member) / nullif(count(*) filter (where checkout_started_at is not null), 0), 1
--   ) as conversion_pct_de_los_que_iniciaron_checkout
-- from public.profiles;

-- ============================================================
-- Actualización 2026-09-17 — Encuesta a los 15 días de membresía.
-- Corre esto en Supabase -> tu proyecto -> SQL Editor -> New query.
-- Igual que la actualización anterior: no borra ni toca ninguna
-- fila que ya exista.
-- ============================================================

-- 2 columnas nuevas en profiles: cuándo se le mandó la encuesta a
-- cada quien (para no mandarla dos veces) y un "token" secreto y
-- único para identificar de quién es cada respuesta sin pedirle que
-- inicie sesión (el link de la encuesta lo trae en la URL).
alter table public.profiles add column if not exists survey_15d_sent_at timestamptz;
alter table public.profiles add column if not exists survey_15d_token text;
create unique index if not exists profiles_survey_15d_token_idx on public.profiles(survey_15d_token) where survey_15d_token is not null;

-- Tabla donde se guardan las respuestas de la encuesta. La revisas
-- igual que revisas "profiles": Supabase -> Table Editor -> survey_responses.
create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  q1_satisfaccion text,
  q2_mas_usado text,
  q3_mejorar text,
  q4_comentario text,
  created_at timestamptz not null default now()
);
create unique index if not exists survey_responses_user_id_idx on public.survey_responses(user_id);

-- Seguridad: nadie puede leer ni escribir esta tabla directamente
-- desde el navegador (ni con sesión ni sin ella). Solo la toca la
-- Edge Function "submit-survey" con la service_role key, que se
-- salta RLS por diseño. Por eso NO hay políticas de select/insert
-- aquí a propósito, a diferencia de "profiles"/"progress_sessions".
alter table public.survey_responses enable row level security;

-- Programa que la función "survey-15d-email" (ver
-- supabase_functions/survey-15d-email.ts) corra sola cada hora.
-- Ella decide, revisando profiles, a quién le toca la encuesta
-- (miembro activo, entre 15 y 22 días de membresía, todavía no se
-- le mandó) y a quién no le toca nada.
--
-- *** ANTES DE CORRER ESTO ***: reemplaza TU_SECRET_KEY_AQUI por tu
-- Secret Key real, igual que hiciste con el Cron de arriba. Y
-- recuerda apagar "Verify JWT" para esta función nueva también
-- (Supabase -> Edge Functions -> survey-15d-email -> Settings).
select cron.schedule(
  'inglesconleo-survey-15d-email',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/survey-15d-email',
    headers := jsonb_build_object(
      'apikey', 'TU_SECRET_KEY_AQUI',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para revisar que el Cron quedó programado:
--   select jobid, schedule, jobname, active from cron.job;
-- Para pausarlo o borrarlo más adelante si hiciera falta:
--   select cron.unschedule('inglesconleo-survey-15d-email');

-- ============================================================
-- Actualización 2026-09-18 — tercer correo de "recuerda activar tu
-- membresía" (antes eran 2, ahora son 3).
-- Corre esto en Supabase -> tu proyecto -> SQL Editor -> New query.
-- No hace falta tocar el Cron: ya está programado (cada 30 minutos)
-- y la misma función revisa sola a quién le toca el correo 3.
-- ============================================================

alter table public.profiles add column if not exists upgrade_email_3_sent_at timestamptz;
