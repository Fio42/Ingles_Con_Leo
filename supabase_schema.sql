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

-- ============================================================
-- Actualización 2026-09-22 (2) — sistema completo de correos
-- automáticos del ciclo de vida de una cuenta gratis (bienvenida,
-- recordatorios de práctica, descubrir funciones, y solo al final
-- la membresía). Reemplaza la lógica de la Edge Function
-- "upgrade-nudge-emails" (mismo nombre y mismo Cron de cada 30
-- minutos que ya tenías: no hace falta crear nada nuevo en
-- Supabase, solo pegar el código nuevo de
-- supabase_functions/upgrade-nudge-emails.ts encima del actual).
--
-- 4 columnas nuevas en profiles, las 4 opcionales (empiezan en NULL
-- o {} / vacío, que quiere decir "todavía no pasó"). No se toca ni
-- se borra ninguna columna existente (las 3 de upgrade_email_1/2/3
-- se quedan ahí sin usarse, por si acaso).
--
--  - lifecycle_emails: registro de qué correo de este sistema se le
--    mandó a cada quien y cuándo (una sola columna sirve para todos
--    los tipos de correo, para no tener que agregar una columna
--    nueva cada vez que se agregue un correo más adelante).
--  - last_marketing_email_at: cuándo fue el último correo de
--    cualquier tipo de este sistema (para el freno de "como mucho
--    uno cada 24 horas").
--  - free_first_exercise_at: la primera vez que una cuenta gratis
--    (is_member=false) contestó un ejercicio. Lo pone app.js/
--    backend.js solo. Sirve para detectar "creó cuenta y nunca
--    practicó".
--  - free_daily_limit_reached_at: el momento exacto en que una
--    cuenta gratis llegó a su límite diario de ejercicios hoy. Lo
--    pone app.js/backend.js solo, en el momento en que ocurre. Sirve
--    para el correo de "ya completaste tu práctica gratis", que se
--    manda algunas horas después (no al instante).
--
-- Igual que last_seen_at: como esto lo escribe el propio navegador
-- de cada quien (no un webhook de pago), se le da permiso de
-- escribir SOLO estas 4 columnas de su PROPIA fila, nunca is_member
-- ni el resto (misma idea de seguridad que ya usabas).
-- ============================================================

alter table public.profiles add column if not exists lifecycle_emails jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists last_marketing_email_at timestamptz;
alter table public.profiles add column if not exists free_first_exercise_at timestamptz;
alter table public.profiles add column if not exists free_daily_limit_reached_at timestamptz;

grant update (free_first_exercise_at, free_daily_limit_reached_at) on public.profiles to authenticated;

-- (lifecycle_emails y last_marketing_email_at NO se agregan a ese
-- GRANT: nada más los toca la Edge Function con la service_role key,
-- que se salta RLS por diseño. El navegador nunca necesita
-- escribirlas directamente.)

-- ============================================================
-- Actualización 2026-09-22 — próxima renovación de miembros
-- (next_renewal_at), para la nueva automatización de "recordatorio
-- de práctica a miembros inactivos" (ver upgrade-nudge-emails.ts).
--
-- 1 columna nueva en profiles, opcional (NULL = "no se conoce la
-- fecha todavía"). No se toca ni se borra ninguna columna existente.
--
--  - next_renewal_at: la próxima fecha de cobro/renovación de la
--    membresía, SOLO cuando el proveedor de pago la entrega de forma
--    confiable (ver el chat para el detalle exacto por proveedor:
--    Stripe y Mercado Pago la escriben en cada aviso relevante;
--    PayPal se consulta aparte porque su aviso de activación y el de
--    cada cobro no siempre la traen incluida). Se usa ÚNICAMENTE
--    para no mandarle a un miembro un correo de "vuelve a practicar"
--    justo antes/después de que se le cobre. Si queda en NULL, esa
--    cuenta simplemente no tiene la zona de silencio aplicada (sigue
--    recibiendo los recordatorios normalmente).
--
-- La escriben ÚNICAMENTE los webhooks de pago (stripe-webhook.ts,
-- paypal-webhook.ts, mp-webhook.ts) con la service_role key, igual
-- que is_member: el navegador nunca la toca, así que no hace falta
-- ningún GRANT UPDATE nuevo para "authenticated".
-- ============================================================

alter table public.profiles add column if not exists next_renewal_at timestamptz;


-- ============================================================
-- Baja de correos automáticos (2026-09-23)
-- Cuando alguien da clic en "Ya no quiero recibir estos correos" (o
-- en el botón "Cancelar suscripción" de Gmail), la función
-- email-unsubscribe guarda aquí la fecha. upgrade-nudge-emails y
-- streak-reminder-email ya no le mandan nada mientras tenga fecha.
-- NO afecta correos de la cuenta (recuperar contraseña, pagos).
-- ============================================================
alter table public.profiles add column if not exists email_opt_out_at timestamptz;


-- ============================================================
-- Nombre de la persona para los correos (2026-09-24)
-- display_name: el nombre que escribe en la bienvenida (onboarding)
-- o el primer nombre de su cuenta de Google. Los correos automáticos
-- lo usan para saludar ("¡Hola, Ana!"). Si está vacío, el correo sale
-- igual que antes, sin nombre.
-- ============================================================
alter table public.profiles add column if not exists display_name text;
grant update (display_name) on public.profiles to authenticated;

-- Cuentas nuevas con Google: se guarda su primer nombre al crearse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(split_part(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), ' ', 1), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Cuentas que ya existen y entraron con Google: se rellena su primer
-- nombre una sola vez (no toca a quien ya tiene display_name).
update public.profiles p
set display_name = nullif(split_part(trim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), ' ', 1), '')
from auth.users u
where u.id = p.id
  and p.display_name is null
  and coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') <> '';

-- ============================================================
-- 2026-09-24: Repaso personal 2.0 (activo / recuperado / dominado)
-- Tabla NUEVA y aditiva: no modifica profiles ni progress_sessions.
-- Cada fila es UN ejercicio que la persona falló alguna vez. Nunca
-- se crea una fila solo por acertar (si nunca lo falló, no hay nada
-- que "recuperar"). Reemplaza tener que descargar y recalcular todo
-- el historial de progress_sessions en el navegador cada vez.
-- ============================================================
create table if not exists public.mistake_stats (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  kind text not null,
  topic text,
  fail_count int not null default 0,
  correct_streak int not null default 0,
  status text not null default 'active', -- 'active' | 'recovered' | 'mastered'
  last_correct boolean,
  recovered_at timestamptz,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);
create index if not exists mistake_stats_user_status_idx on public.mistake_stats(user_id, status);

alter table public.mistake_stats enable row level security;

drop policy if exists "mistake_stats: select own" on public.mistake_stats;
create policy "mistake_stats: select own" on public.mistake_stats
  for select using (auth.uid() = user_id);

drop policy if exists "mistake_stats: insert own" on public.mistake_stats;
create policy "mistake_stats: insert own" on public.mistake_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists "mistake_stats: update own" on public.mistake_stats;
create policy "mistake_stats: update own" on public.mistake_stats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Aplica TODOS los resultados de una sesión (activa/reactiva/recupera/
-- domina) en una sola llamada, para no hacer una consulta por ejercicio.
-- security invoker: corre con los permisos de quien llama (respeta las
-- policies de arriba, auth.uid() = user_id siempre).
-- Umbrales (deben coincidir con MISTAKE_PRIORITY en app.js):
--   2 aciertos seguidos tras un fallo -> "recovered"
--   4 aciertos seguidos tras un fallo -> "mastered"
--   un fallo, en cualquier estado, siempre reactiva a "active"
create or replace function public.apply_mistake_results(p_items jsonb)
returns void
language plpgsql
security invoker
as $$
declare
  rec record;
  uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  for rec in
    select * from jsonb_to_recordset(p_items) as x(item_id text, kind text, topic text, is_correct boolean)
  loop
    if rec.item_id is null or rec.kind is null or rec.is_correct is null then
      continue;
    end if;
    if rec.is_correct then
      update public.mistake_stats m
      set correct_streak = m.correct_streak + 1,
          last_correct = true,
          last_seen_at = now(),
          updated_at = now(),
          recovered_at = case
            when m.status = 'active' and m.correct_streak + 1 >= 2 then now()
            else m.recovered_at
          end,
          status = case
            when m.correct_streak + 1 >= 4 then 'mastered'
            when m.correct_streak + 1 >= 2 then 'recovered'
            else m.status
          end
      where m.user_id = uid and m.item_id = rec.item_id;
      -- Si no existe fila, nunca falló este ejercicio: no hay nada que "recuperar".
    else
      insert into public.mistake_stats (user_id, item_id, kind, topic, fail_count, correct_streak, status, last_correct, recovered_at, last_seen_at, updated_at)
      values (uid, rec.item_id, rec.kind, rec.topic, 1, 0, 'active', false, null, now(), now())
      on conflict (user_id, item_id) do update
        set fail_count = mistake_stats.fail_count + 1,
            correct_streak = 0,
            status = 'active',
            last_correct = false,
            recovered_at = null,
            kind = excluded.kind,
            topic = coalesce(excluded.topic, mistake_stats.topic),
            last_seen_at = now(),
            updated_at = now();
    end if;
  end loop;
end;
$$;

grant execute on function public.apply_mistake_results(jsonb) to authenticated;

-- ============================================================
-- LeoBot: reportes de bugs y mensajes de soporte/contacto.
-- Corre esto en Supabase -> tu proyecto -> SQL Editor -> New query.
--
-- Los llena el propio LeoBot (chatbot.js -> backend.js,
-- LeoBackend.submitLeobotReport) cuando alguien usa "Reportar un
-- problema" (type='bug') o "Contactar / Otra duda" (type='support').
-- Funciona con o sin sesión iniciada (invitados también pueden
-- reportar). Al insertar, el navegador avisa a la Edge Function
-- leobot-notify, que le manda a Leo un correo con el detalle (igual
-- que notify-new-comment ya hace para los comentarios de artículos).
--
-- Seguridad: cualquiera puede INSERTAR su propio reporte (con
-- límites de tamaño para evitar spam/textos gigantes), pero A
-- PROPÓSITO no hay ninguna política de SELECT/UPDATE/DELETE para
-- usuarios normales: nadie puede leer reportes, ni siquiera los
-- suyos propios, desde el navegador. Solo se pueden leer desde
-- Supabase -> Table Editor -> leobot_reports (como tú, el dueño del
-- proyecto) o desde una Edge Function con la service_role key (como
-- hace leobot-notify). "context" es un jsonb con datos técnicos NO
-- sensibles (nivel, habilidad, tipo de sesión, viewport, etc.):
-- backend.js nunca mete ahí contraseñas, tokens ni datos de pago.
--
-- El id es un uuid que genera el propio navegador (no la base de
-- datos) antes de insertar: como no hay política de SELECT, pedirle
-- a Supabase que "devuelva" el id recién insertado (RETURNING) queda
-- bloqueado por RLS igual que cualquier otra lectura, aunque el
-- INSERT en sí sea válido. Generándolo en el navegador, backend.js ya
-- sabe el id sin necesidad de leer nada de vuelta.
-- ============================================================

create table if not exists public.leobot_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null check (type in ('bug', 'support')),
  message text not null,
  page_url text,
  page_name text,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  browser text,
  device text,
  context jsonb,
  status text not null default 'new'
);

create index if not exists leobot_reports_created_idx on public.leobot_reports(created_at desc);

alter table public.leobot_reports enable row level security;

-- Cualquiera puede insertar su propio reporte (invitado o con
-- sesión), con límites básicos de tamaño y sin poder hacerse pasar
-- por el user_id de otra persona logueada.
drop policy if exists "leobot_reports: insert" on public.leobot_reports;
create policy "leobot_reports: insert" on public.leobot_reports
  for insert with check (
    char_length(message) > 0 and char_length(message) <= 2000
    and (page_url is null or char_length(page_url) <= 500)
    and (email is null or char_length(email) <= 200)
    and (user_id is null or auth.uid() = user_id)
  );

-- A propósito NO hay política de "select", "update" ni "delete": ni
-- siquiera quien mandó el reporte puede volver a leerlo desde el
-- navegador. Se revisan a mano desde Supabase -> Table Editor, o se
-- les cambia el "status" ahí mismo (new/reviewed/resuelto, etc.).

-- ============================================================
-- profiles.last_practice_at — última vez que un MIEMBRO terminó una
-- sesión de práctica REAL (gramática, vocabulario, listening,
-- writing, speaking, mixto, plan de estudio). Se agregó porque
-- last_seen_at se actualiza con CUALQUIER visita estando logueado
-- (abrir progreso.html, un artículo, etc.), no solo al practicar, así
-- que no sirve para decidir cuándo mandar un correo de reactivación
-- ("dejaste de practicar") sin mandarlo de más a quien solo entra a
-- mirar. La escribe backend.js (LeoBackend.pushSession(), el único
-- punto donde se guarda una sesión de Miembros) cada vez que termina
-- una sesión real, con el mismo patrón de "solo puede tocar esta
-- columna" que ya usan last_seen_at/free_daily_count.
--
-- Cuentas gratis NO usan esta columna (pushSession() nunca se llama
-- para práctica gratis, ver la nota en app.js sobre
-- "PRÁCTICA GRATIS"): para cuentas gratis la señal equivalente ya
-- existe y es profiles.free_daily_date (última fecha con un
-- ejercicio gratis real, se actualiza en cada ejercicio, no solo el
-- primero del día).
--
-- Corre esto UNA VEZ en Supabase -> SQL Editor. Es seguro volver a
-- correrlo (agregar la columna es "if not exists", y el backfill de
-- abajo solo AVANZA la fecha, nunca la retrocede ni la borra).
alter table public.profiles add column if not exists last_practice_at timestamptz;

grant update (last_practice_at) on public.profiles to authenticated;

-- Backfill para miembros que ya tenían sesiones guardadas ANTES de
-- que existiera esta columna: sin esto, todo miembro veterano
-- aparecería con last_practice_at NULL y el sistema lo trataría como
-- "nunca practicó", disparándole por error el correo de activación
-- de miembro nuevo (member_activation) o los de reactivación antes de
-- tiempo. Se usa progress_sessions.started_at (el timestamp exacto en
-- milisegundos de cuando empezó cada sesión, columna bigint) y, para
-- las pocas filas viejas donde started_at pudiera faltar, se cae a
-- progress_sessions.date (columna date, siempre presente). Es
-- idempotente y aditivo: no toca progress_sessions, no toca rachas ni
-- progreso, y el "where" de abajo evita pisar un last_practice_at que
-- ya esté más adelantado (por ejemplo si ya practicó de nuevo después
-- de correr esto una primera vez).
update public.profiles p
set last_practice_at = sub.last_practice
from (
  select
    user_id,
    max(coalesce(to_timestamp(started_at / 1000.0), date::timestamptz)) as last_practice
  from public.progress_sessions
  group by user_id
) sub
where sub.user_id = p.id
  and (p.last_practice_at is null or p.last_practice_at < sub.last_practice);

-- ============================================================
-- Auditoría de correos 2026-09-30: reservas con "lease" para que los
-- correos no se dupliquen NI se pierdan (ver streak-reminder-email.ts,
-- survey-15d-email.ts, los webhooks de pago y upgrade-nudge-emails.ts).
-- CORRER ESTO EN EL SQL EDITOR DE SUPABASE *ANTES* DE DESPLEGAR LAS
-- FUNCIONES. Es seguro correrlo más de una vez.
-- ============================================================
alter table public.profiles add column if not exists streak_reminder_claimed_at timestamptz;
alter table public.profiles add column if not exists survey_15d_claimed_at timestamptz;
alter table public.profiles add column if not exists member_welcome_claimed_at timestamptz;
alter table public.profiles add column if not exists member_welcome_sent_at timestamptz;
-- Los miembros que ya existen NO deben recibir una "bienvenida" nueva:
update public.profiles
   set member_welcome_sent_at = coalesce(member_since, now())
 where is_member = true and member_welcome_sent_at is null;

-- ============================================================
-- 2026-10-01: llave interna + bienvenida de cuenta gratis AL INSTANTE.
-- (Ya aplicado en Supabase.) La llave se genera dentro de Vault y no
-- aparece en ningún archivo. El Cron y el trigger la mandan en el
-- header x-internal-secret; upgrade-nudge-emails rechaza (401) lo demás.
-- ============================================================
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'internal_functions_secret', 'Llave para Cron/triggers -> Edge Functions')
where not exists (select 1 from vault.secrets where name = 'internal_functions_secret');

create or replace function public.internal_secret_ok(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p_secret, '') <> '' and exists (
    select 1 from vault.decrypted_secrets
     where name = 'internal_functions_secret' and decrypted_secret = p_secret
  );
$$;
revoke all on function public.internal_secret_ok(text) from public, anon, authenticated;
grant execute on function public.internal_secret_ok(text) to service_role;

-- Reserva atómica de la bienvenida (lease de 15 min, ver upgrade-nudge-emails.ts).
alter table public.profiles add column if not exists welcome_claimed_at timestamptz;

-- Los 3 Cron mandan la llave de Vault (antes: 'TU_SECRET_KEY_AQUI').
select cron.alter_job(j.jobid, command := format($cmd$
  select net.http_post(
    url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/%s',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_functions_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$cmd$, f.slug))
from cron.job j
join (values ('inglesconleo-upgrade-nudge-emails','upgrade-nudge-emails'),
             ('inglesconleo-survey-15d-email','survey-15d-email'),
             ('inglesconleo-streak-reminder-email','streak-reminder-email')) f(jobname, slug)
  on f.jobname = j.jobname;

-- Trigger: al crearse el perfil, pide la bienvenida SOLO de esa cuenta.
-- net.http_post solo deja la petición en cola (no espera respuesta), y
-- cualquier error se ignora: nunca frena ni rompe el registro.
create or replace function public.send_welcome_on_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_member is not true and new.email is not null then
    perform net.http_post(
      url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/upgrade-nudge-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_functions_secret')
      ),
      body := jsonb_build_object('welcome_user_id', new.id),
      timeout_milliseconds := 30000
    );
  end if;
  return new;
exception when others then
  return new; -- nunca bloquear la creación de la cuenta
end;
$$;
revoke all on function public.send_welcome_on_profile_insert() from public, anon, authenticated;

drop trigger if exists profiles_send_welcome on public.profiles;
create trigger profiles_send_welcome
  after insert on public.profiles
  for each row execute function public.send_welcome_on_profile_insert();

-- ============================================================
-- Actualización 2026-10-06 — nivel y onboarding en la nube
-- profiles.level: el nivel del alumno (principiante|facil|medio|avanzado).
-- profiles.onboarded_at: cuándo completó o saltó la bienvenida. Con este valor
-- el sitio NO vuelve a mostrar el onboarding en otro navegador y el nivel de la
-- nube manda sobre el de localStorage (que queda como caché).
-- Aditivo: las cuentas actuales quedan en NULL y se inicializan solas la
-- siguiente vez que entran (desde su perfil local o, si no hay, desde su historial).
-- Seguridad: la policy "profiles: update own last_seen" (auth.uid() = id) ya limita
-- las FILAS; este grant limita las COLUMNAS. No se toca is_member ni nada más.
-- ============================================================
alter table public.profiles add column if not exists level text;
alter table public.profiles add column if not exists onboarded_at timestamptz;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_level_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_level_check
      check (level is null or level in ('principiante', 'facil', 'medio', 'avanzado'));
  end if;
end $$;
grant update (level, onboarded_at) on public.profiles to authenticated;

-- ============================================================
-- SESIONES DE PRÁCTICA GRATIS (cuentas que no son miembros) + límites de servidor en progress_sessions
-- Migración: progress_sessions_free_tier_guard (2026-10-07).
--
-- Desde esta fecha la práctica gratis de una CUENTA (nunca la de un invitado) también se guarda en
-- progress_sessions, con la misma forma que las sesiones de Miembros (ver "Sesiones de PRÁCTICA GRATIS"
-- en app.js y pushFreeSession en backend.js). Al hacerse miembro, la sincronización de siempre trae ese
-- historial: no se empieza de cero.
--
-- Aditivo: no cambia ni borra filas; las existentes quedan con tier NULL (miembro / anteriores).
-- Las policies NO cambian ("select own" e "insert own": cada cuenta solo lee e inserta SUS filas).
--   tier        'free' = la cuenta no era miembro al guardar. Lo pone la BASE (trigger), nunca el navegador.
--   límites     máx. 500 respuestas y 100 KB por fila; temas máx. 4 KB; skill y level con largo acotado.
--   repetidas   una misma sesión (cuenta + inicio + habilidad) no se guarda dos veces (reintentos).
--   por día     máx. 40 filas en 24 h por cuenta gratis (y 60 respuestas por fila) y 300 por miembro.
--   created_at  lo pone la base (no se puede fechar hacia atrás para saltarse el límite).
-- Pruebas: tools/tests/progress-sessions-guard.test.sql y tools/tests/free-sessions.test.js.
-- ============================================================
alter table public.progress_sessions add column if not exists tier text;
alter table public.progress_sessions drop constraint if exists progress_sessions_tier_chk;
alter table public.progress_sessions add constraint progress_sessions_tier_chk check (tier is null or tier = 'free');

alter table public.progress_sessions drop constraint if exists progress_sessions_results_chk;
alter table public.progress_sessions add constraint progress_sessions_results_chk check (
  case when jsonb_typeof(results) = 'array' then jsonb_array_length(results) <= 500 and octet_length(results::text) <= 100000 else false end);
alter table public.progress_sessions drop constraint if exists progress_sessions_topics_chk;
alter table public.progress_sessions add constraint progress_sessions_topics_chk check (jsonb_typeof(topics) = 'array' and octet_length(topics::text) <= 4000);
alter table public.progress_sessions drop constraint if exists progress_sessions_labels_chk;
alter table public.progress_sessions add constraint progress_sessions_labels_chk check (char_length(skill) between 1 and 40 and char_length(level) between 1 and 20);

create unique index if not exists progress_sessions_user_started_skill_uidx
  on public.progress_sessions (user_id, started_at, skill) where started_at is not null;
create index if not exists progress_sessions_user_created_idx on public.progress_sessions (user_id, created_at desc);

create or replace function public.progress_sessions_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member boolean;
  v_n int;
begin
  -- Sin usuario (service_role, SQL Editor): no se toca nada.
  if auth.uid() is null then return new; end if;
  -- Fila de otra cuenta: la rechaza la policy "insert own"; aquí no se mira nada.
  if new.user_id is distinct from auth.uid() then return new; end if;

  select p.is_member into v_member from public.profiles p where p.id = new.user_id;
  new.tier := case when coalesce(v_member, false) then null else 'free' end;
  new.created_at := now();

  if new.tier = 'free' and jsonb_typeof(new.results) = 'array' and jsonb_array_length(new.results) > 60 then
    raise exception 'progress_sessions: sesion gratis demasiado grande' using errcode = 'P0001';
  end if;

  select count(*) into v_n from public.progress_sessions s
   where s.user_id = new.user_id and s.created_at > now() - interval '24 hours';
  if v_n >= (case when new.tier = 'free' then 40 else 300 end) then
    raise exception 'progress_sessions: limite diario de sesiones' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function public.progress_sessions_guard() from public, anon, authenticated;

drop trigger if exists progress_sessions_guard_trg on public.progress_sessions;
create trigger progress_sessions_guard_trg before insert on public.progress_sessions
  for each row execute function public.progress_sessions_guard();

-- El navegador solo necesita leer e insertar SUS filas.
revoke all on public.progress_sessions from anon;
revoke update, delete, truncate, references, trigger on public.progress_sessions from authenticated;

-- ============================================================
-- ORIGEN DEL NIVEL: profiles.level_source
-- Migración: profiles_level_source (2026-10-07).
--
-- Cómo llegó la cuenta a su nivel (ver LEVEL_SOURCES en app.js):
--   self       lo eligió (onboarding o cambio de nivel)
--   skipped    pulsó "Saltar" en el onboarding: Fácil queda solo como nivel PROVISIONAL, no como elección
--   suggested  aceptó una sugerencia de nivel del sistema
--   history    recuperado del historial de práctica
--   test       resultado del test de nivel
--   NULL       cuenta anterior a esta columna: no se sabe (no se rellena ni se inventa)
-- Aditivo: una columna opcional, su lista de valores y permiso para que cada cuenta escriba SOLO esa columna
-- de SU fila (la policy de profiles no cambia: auth.uid() = id). No toca ninguna fila existente.
-- Pruebas: tools/tests/onboarding-nube.test.js.
-- ============================================================
alter table public.profiles add column if not exists level_source text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_level_source_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_level_source_check
      check (level_source is null or level_source in ('self', 'skipped', 'suggested', 'history', 'test'));
  end if;
end $$;
grant update (level_source) on public.profiles to authenticated;
