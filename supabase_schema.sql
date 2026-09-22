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

-- ============================================================
-- Actualización 2026-09-19 — "última vez visto" (last_seen_at)
-- en profiles, para saber quién sigue entrando a su cuenta sin
-- depender del "abierto" de los correos (poco confiable: Gmail y
-- Apple Mail precargan la imagen del pixel de tracking aunque la
-- persona nunca lea el correo).
--
-- Se actualiza sola cada vez que alguien con sesión abierta carga
-- una página de miembros (como máximo una vez cada 15 minutos por
-- dispositivo, para no llenar la tabla de escrituras).
--
-- Ojo de seguridad (por eso no es un simple "alter table" + listo):
-- esta tabla a propósito NO tiene una política de "actualizar" para
-- cualquier columna (se quitó antes porque dejaba que cualquiera se
-- marcara is_member=true desde el navegador sin pagar). Así que acá
-- se le da permiso de actualizar SOLO la columna last_seen_at, no
-- el resto de la fila.
--
-- Corre esto en Supabase -> tu proyecto -> SQL Editor -> New query.
-- ============================================================

alter table public.profiles add column if not exists last_seen_at timestamptz;

drop policy if exists "profiles: update own last_seen" on public.profiles;
create policy "profiles: update own last_seen" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (last_seen_at) on public.profiles to authenticated;

-- ============================================================
-- Actualización 2026-09-20 — pausar racha 1 día + correo de
-- "tu racha está a punto de romperse".
--
-- La racha en sí (cuántos días llevas seguidos) se calcula en el
-- navegador (ver computeActiveStreakDates/getFrozenStreakDate en
-- app.js), no en Supabase: ahora tolera UN día salteado sin romperse
-- (como el "streak freeze" de Chess.com/Duolingo), calculado a partir
-- de las filas normales de progress_sessions, sin tocar la tabla.
--
-- Lo único que sí necesita Supabase es la columna de abajo, para que
-- la Edge Function "streak-reminder-email" (ver
-- supabase_functions/streak-reminder-email.ts) sepa a quién ya le
-- mandó el correo hoy y no se lo repita. Corre esto en Supabase ->
-- tu proyecto -> SQL Editor -> New query.
-- ============================================================

alter table public.profiles add column if not exists streak_reminder_last_sent date;

-- Programa que "streak-reminder-email" corra sola una vez al día
-- (13:00 UTC = 7am hora de México, ver el comentario sobre zonas
-- horarias arriba de esa función). Ella revisa progress_sessions y
-- decide sola a quién avisarle: quien practicó ayer pero todavía no
-- hoy, y no se le haya mandado ya el aviso de hoy.
--
-- *** ANTES DE CORRER ESTO ***: reemplaza TU_SECRET_KEY_AQUI por tu
-- Secret Key real (Supabase -> Project Settings -> API Keys ->
-- "Secret keys"), igual que hiciste para el Cron de upgrade-nudge-emails
-- más arriba. Es secreta: no la pegues en ningún archivo del
-- repositorio, solo aquí, directo en el SQL Editor. Y no olvides
-- apagar "Verify JWT" en la configuración de esta función nueva en
-- Supabase (igual que con las demás funciones automáticas).
select cron.schedule(
  'inglesconleo-streak-reminder-email',
  '0 13 * * *',
  $$
  select net.http_post(
    url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/streak-reminder-email',
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
--   select cron.unschedule('inglesconleo-streak-reminder-email');

-- ============================================================
-- Comentarios en los articulos (articulo-*.html).
-- Corre esto en Supabase -> tu proyecto -> SQL Editor -> New query.
--
-- Cualquiera puede comentar, con o sin cuenta:
--   - user_id queda null para invitados (is_member = false), y con
--     el id real de la persona cuando SI es miembro pagado
--     (is_member = true, igual que profiles.is_member).
--   - display_name es el nombre que se ve en el comentario: el de
--     su cuenta si es miembro, o uno generado al azar (tipo
--     "TigreCurioso482") si es invitado. Eso lo decide app.js, no
--     esta tabla.
--   - Se publican de inmediato (sin aprobación previa). A Leo le
--     llega un correo por cada comentario nuevo (ver la Edge
--     Function notify-new-comment), así puede borrar uno desde
--     Supabase -> Table Editor -> article_comments si hace falta.
-- ============================================================

create table if not exists public.article_comments (
  id bigint generated always as identity primary key,
  article_slug text not null,
  article_title text,
  user_id uuid references auth.users(id) on delete set null,
  is_member boolean not null default false,
  display_name text not null,
  comment_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists article_comments_slug_idx on public.article_comments(article_slug, created_at desc);

alter table public.article_comments enable row level security;

-- Cualquiera puede LEER los comentarios (se muestran en la página
-- pública del artículo, sin necesidad de sesión).
drop policy if exists "article_comments: select all" on public.article_comments;
create policy "article_comments: select all" on public.article_comments
  for select using (true);

-- Cualquiera puede ESCRIBIR un comentario, con límites básicos de
-- tamaño para evitar textos vacíos o gigantes, y para que nadie
-- pueda hacerse pasar por el user_id de otra persona logueada.
drop policy if exists "article_comments: insert all" on public.article_comments;
create policy "article_comments: insert all" on public.article_comments
  for insert with check (
    char_length(comment_text) > 0 and char_length(comment_text) <= 1000
    and char_length(display_name) > 0 and char_length(display_name) <= 60
    and (user_id is null or auth.uid() = user_id)
  );

-- A propósito NO hay política de "update" ni "delete" desde el
-- navegador: si un comentario hay que borrarlo (spam, algo
-- inapropiado), se hace a mano desde Supabase -> Table Editor ->
-- article_comments -> borrar la fila.

-- ============================================================
-- Comentarios: respuestas del admin + borrado seguro.
-- Corre esto DESPUÉS del bloque de "Comentarios en los articulos"
-- de arriba. Funciona sin importar si ya lo habías corrido antes o
-- si la tabla article_comments se acaba de crear en este mismo
-- momento (no borra ninguna fila ni comentario existente).
--
-- Qué agrega:
--   - parent_comment_id: cuando no es null, esta fila es una
--     respuesta al comentario con ese id. Al borrar el comentario
--     original, su respuesta se borra sola (ON DELETE CASCADE), sin
--     dejar respuestas huérfanas. Un índice único evita que se
--     pueda insertar más de una respuesta por comentario, y la
--     política de abajo evita responder a una respuesta (solo una
--     capa).
--   - La política de INSERT queda más estricta: ya no basta con
--     mandar is_member=true o parent_comment_id apuntando a algo
--     desde el navegador. is_member=true solo se acepta si esa
--     cuenta (auth.uid()) de verdad tiene profiles.is_member=true, y
--     una respuesta (parent_comment_id) solo se acepta si quien la
--     manda es tu cuenta admin (el UUID de abajo).
--   - Política nueva de DELETE: solo tu cuenta admin puede borrar
--     comentarios o respuestas. Nadie más, ni siquiera para borrar
--     los suyos propios.
--
-- El UUID f8c0bf1f-57c9-462a-addf-17559aeab69f es tu usuario de
-- Supabase Auth (fiocchettaleandro@gmail.com). No es secreto (sin
-- tu sesión real no sirve para nada), pero es el único que estas
-- políticas van a aceptar como admin.
-- ============================================================

alter table public.article_comments
  add column if not exists parent_comment_id bigint references public.article_comments(id) on delete cascade;

create index if not exists article_comments_parent_idx on public.article_comments(parent_comment_id);

-- Como mucho una respuesta por comentario (si se necesita corregir
-- una respuesta, se borra y se vuelve a publicar).
create unique index if not exists article_comments_one_reply_idx
  on public.article_comments(parent_comment_id) where parent_comment_id is not null;

drop policy if exists "article_comments: insert all" on public.article_comments;
drop policy if exists "article_comments: insert" on public.article_comments;
create policy "article_comments: insert" on public.article_comments
  for insert with check (
    char_length(comment_text) > 0 and char_length(comment_text) <= 1000
    and char_length(display_name) > 0 and char_length(display_name) <= 60
    and (user_id is null or auth.uid() = user_id)
    -- is_member=true solo se acepta si esa cuenta de verdad es
    -- miembro pagado ahora mismo (no un valor mandado a mano).
    and (
      is_member = false
      or (
        auth.uid() = user_id
        and exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_member = true
        )
      )
    )
    -- Una respuesta (parent_comment_id no nulo) solo la puede
    -- publicar tu cuenta admin, y solo respondiendo a un comentario
    -- de primer nivel del mismo artículo (nunca a otra respuesta).
    and (
      parent_comment_id is null
      or (
        auth.uid() = 'f8c0bf1f-57c9-462a-addf-17559aeab69f'::uuid
        and exists (
          select 1 from public.article_comments parent
          where parent.id = parent_comment_id
            and parent.parent_comment_id is null
            and parent.article_slug = article_slug
        )
      )
    )
  );

drop policy if exists "article_comments: delete admin" on public.article_comments;
create policy "article_comments: delete admin" on public.article_comments
  for delete using (auth.uid() = 'f8c0bf1f-57c9-462a-addf-17559aeab69f'::uuid);

-- ============================================================
-- Actualización 2026-09-22 — 3 niveles de acceso (visitante /
-- cuenta gratis / miembro) y límite diario de ejercicios ligado
-- a la cuenta para quienes tienen cuenta gratis (is_member=false).
--
-- Antes, el límite de ejercicios gratis vivía SOLO en localStorage
-- del navegador (ver FREE_DAILY_EXERCISE_LIMIT, ahora reemplazado
-- por GUEST_EXERCISE_LIMIT / FREE_USER_DAILY_LIMIT en app.js). Esto
-- añade dos columnas a profiles para que, una vez que alguien crea
-- su cuenta gratis, su conteo diario de ejercicios viaje con la
-- cuenta (no solo con ese navegador/dispositivo).
--
-- No es una columna sensible como is_member (no controla pagos ni
-- membresía): solo cuenta ejercicios para el aviso de "ya hiciste
-- tu práctica de hoy". Se le da el mismo tipo de permiso ya usado
-- para last_seen_at (el usuario solo puede escribir estas dos
-- columnas de SU PROPIA fila, nunca is_member ni el resto).
--
-- Corre esto en Supabase -> tu proyecto -> SQL Editor -> New query.
-- ============================================================

alter table public.profiles add column if not exists free_daily_count integer not null default 0;
alter table public.profiles add column if not exists free_daily_date date;

grant update (free_daily_count, free_daily_date) on public.profiles to authenticated;
