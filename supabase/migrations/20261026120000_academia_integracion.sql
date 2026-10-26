-- ============================================================
-- ACADEMIA: progreso en la nube, evaluación oficial protegida e insignias.
-- ESTADO: PREPARADA, NO APLICADA EN PRODUCCIÓN. Requiere aprobación de Leo.
-- Aditiva: no modifica profiles, progress_sessions ni mistake_stats.
-- Es idempotente (se puede correr dos veces sin error).
-- Pruebas: tools/tests/academia-sql.test.js (Postgres embebido, sin tocar Supabase).
--
-- Qué hace
--   academia_courses        configuración por curso (umbral, tamaño del examen, si está habilitado).
--   academia_progress       un documento de avance por cuenta y curso. Solo se escribe con
--                           academia_save_progress (versión optimista: dos dispositivos no se pisan).
--   academia_exam_items     banco REAL del examen. Nadie lo lee desde el navegador (sin policies,
--                           sin grants). El repositorio es público, por eso el contenido NO vive en el
--                           repo: se carga aparte con tools/academia_seed_examen.js desde private/.
--   academia_exam_attempts  intentos oficiales (solo lectura de los propios).
--   academia_badges         insignias. Solo las crea academia_exam_submit al aprobar en el servidor.
--
-- Modelo comercial (decidido por Leo): la academia es beneficio de la MEMBRESIA de pago (profiles.is_member, validado aqui,
-- en el servidor, en cada llamada). Una cuenta gratuita solo puede hacer UNA demostracion de TO BE (3 ejercicios) que
-- el servidor registra de forma persistente y descuenta del limite diario existente (profiles.free_daily_count, 6/dia).
-- Evaluaciones oficiales, insignias, progreso en la nube y sesiones de lecciones: solo miembros. Lo ya ganado
-- (progreso, insignias, intentos) se conserva y se puede LEER aunque la membresia venza.
--
-- Errores de los cursos: NO hay tabla nueva. Se usa el motor actual (mistake_stats via
-- apply_mistake_results) con item_id 'ac:<curso>:<actividad>' y kind 'academia'.
-- ============================================================

-- ---------- Comprobación previa (si algo base falta, se detiene ANTES de crear nada) ----------
-- Verificado contra producción el 2026-10-25 (solo lectura): PostgreSQL 17.6; mistake_stats con unique (user_id, item_id)
-- y sin CHECK de kind/status; apply_mistake_results(jsonb) con el mismo cuerpo que supabase_schema.sql;
-- progress_sessions con tier, índice único (user_id, started_at, skill) y trigger de límites; profiles.is_member.
do $$
begin
  if to_regclass('auth.users') is null or to_regclass('public.profiles') is null
     or to_regclass('public.mistake_stats') is null or to_regprocedure('public.apply_mistake_results(jsonb)') is null then
    raise exception 'academia: faltan objetos base (auth.users, profiles, mistake_stats o apply_mistake_results). No se aplica nada.';
  end if;
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'mistake_stats'
        and column_name in ('user_id','item_id','kind','topic','fail_count','correct_streak','status')) <> 7
     or (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'profiles'
           and column_name in ('is_member','last_practice_at','free_daily_count','free_daily_date','free_first_exercise_at','free_daily_limit_reached_at','free_last_practice_at')) <> 7
     or (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'progress_sessions'
           and column_name in ('user_id','skill','level','topics','date','started_at','duration_ms','results','tier')) <> 9
     or not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'progress_sessions' and indexname = 'progress_sessions_user_started_skill_uidx') then
    raise exception 'academia: mistake_stats, profiles o progress_sessions no tienen las columnas o el indice esperados. No se aplica nada.';
  end if;
end
$$;

create table if not exists public.academia_courses (
  course_id text primary key check (course_id ~ '^[a-z0-9-]{2,40}$'),
  title text not null,
  enabled boolean not null default false,
  members_only boolean not null default true,
  pass_pct int not null default 80 check (pass_pct between 50 and 100),
  exam_size int not null default 15 check (exam_size between 5 and 60),
  per_topic int not null default 3 check (per_topic between 1 and 20),
  max_attempts_day int not null default 3 check (max_attempts_day between 1 and 20),
  -- etiqueta EXACTA de GRAMMAR_BANK/temas.js con la que los errores del curso entran al diagnóstico actual
  engine_topic text,
  -- ejercicios de la demostracion gratuita (ids de actividad, sin el prefijo 'ac:<curso>:')
  demo_items text[] not null default '{}',
  -- nivel con el que sus lecciones se guardan en progress_sessions (el servidor lo decide, no el navegador)
  session_level text not null default 'facil' check (session_level in ('facil','medio','dificil')),
  created_at timestamptz not null default now()
);
alter table public.academia_courses enable row level security;
drop policy if exists "academia_courses: read" on public.academia_courses;
create policy "academia_courses: read" on public.academia_courses for select to authenticated using (true);

insert into public.academia_courses (course_id, title, enabled, engine_topic, demo_items)
values ('to-be', 'Domina el verbo TO BE', false, 'Verbo "to be": am / is / are', array['d1','d2','d3'])
on conflict (course_id) do nothing;

-- ---------- Progreso ----------
create table if not exists public.academia_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.academia_courses(course_id),
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 60000),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  -- demostracion gratuita: solo las escribe el servidor (academia_demo_start / _finish / academia_record_session)
  demo_started_at timestamptz,
  demo_done_at timestamptz,
  demo_session_at timestamptz,
  primary key (user_id, course_id)
);
alter table public.academia_progress enable row level security;
drop policy if exists "academia_progress: select own" on public.academia_progress;
create policy "academia_progress: select own" on public.academia_progress for select to authenticated using (auth.uid() = user_id);
revoke all on public.academia_progress from anon;
revoke insert, update, delete, truncate, references, trigger on public.academia_progress from authenticated;
grant select on public.academia_progress to authenticated;


-- ---------- Piezas internas (sin permisos para el navegador) ----------
-- Debe coincidir con FREE_USER_DAILY_LIMIT de app.js (una prueba compara ambos numeros).
create or replace function public.academia_free_daily_limit() returns int language sql immutable as $$ select 6 $$;
revoke all on function public.academia_free_daily_limit() from public, anon, authenticated;

-- Membresia vigente, leida del servidor en cada llamada (el webhook de pago pone is_member true/false).
create or replace function public.academia_is_member(p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_member from public.profiles where id = p_uid), false)
$$;
revoke all on function public.academia_is_member(uuid) from public, anon, authenticated;

-- La fecha "de hoy" de la cuenta la manda el navegador (igual que hoy en el limite gratis); se acepta si esta a +-1 dia del servidor.
create or replace function public.academia_today(p_today date) returns date language sql stable as $$
  select case when p_today is null or abs(p_today - current_date) > 1 then current_date else p_today end
$$;
revoke all on function public.academia_today(date) from public, anon, authenticated;

-- Ejercicios gratis que lleva la cuenta hoy: el MAYOR entre lo guardado en profiles y lo que el navegador sabe (igual que app.js).
create or replace function public.academia_free_count(p_uid uuid, p_today date, p_local int) returns int
language sql stable security definer set search_path = public as $$
  select greatest(
    coalesce((select case when free_daily_date = public.academia_today(p_today) then free_daily_count else 0 end from public.profiles where id = p_uid), 0),
    least(greatest(coalesce(p_local, 0), 0), public.academia_free_daily_limit()))
$$;
revoke all on function public.academia_free_count(uuid, date, int) from public, anon, authenticated;

-- ---------- Acceso: que puede hacer esta cuenta ahora ----------
create or replace function public.academia_access(p_course text, p_today date default null, p_local_count int default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.academia_courses%rowtype;
  pr public.academia_progress%rowtype;
  mem boolean; cnt int; lim int := public.academia_free_daily_limit(); cost int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.academia_courses where course_id = p_course and enabled;
  if not found then return jsonb_build_object('ok', false, 'error', 'course'); end if;
  mem := public.academia_is_member(uid);
  select * into pr from public.academia_progress where user_id = uid and course_id = p_course;
  cnt := public.academia_free_count(uid, p_today, p_local_count);
  cost := coalesce(array_length(c.demo_items, 1), 0);
  return jsonb_build_object('ok', true, 'member', mem,
    'demo', jsonb_build_object('cost', cost,
      'used', pr.demo_started_at is not null,
      'done', pr.demo_done_at is not null,
      'resumable', pr.demo_started_at is not null and pr.demo_done_at is null and pr.demo_started_at > now() - interval '24 hours',
      'available', (not mem) and cost > 0 and pr.demo_started_at is null and (lim - cnt) >= cost),
    'daily', jsonb_build_object('count', cnt, 'limit', lim, 'remaining', greatest(0, lim - cnt)));
end;
$$;
revoke all on function public.academia_access(text, date, int) from public, anon;
grant execute on function public.academia_access(text, date, int) to authenticated;

-- ---------- Demostracion gratuita (una sola vez por cuenta) ----------
-- Descuenta TODOS sus ejercicios del limite diario existente en el mismo momento de empezar (cerrar la pestana,
-- borrar localStorage o cambiar de dispositivo no la reinicia ni regala ejercicios). Si hoy no alcanzan los ejercicios
-- libres, NO se gasta la demostracion: se avisa y se puede hacer otro dia.
create or replace function public.academia_demo_start(p_course text, p_today date default null, p_local_count int default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.academia_courses%rowtype;
  pr public.academia_progress%rowtype;
  cnt int; lim int := public.academia_free_daily_limit(); cost int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.academia_courses where course_id = p_course and enabled;
  if not found then return jsonb_build_object('ok', false, 'error', 'course'); end if;
  if public.academia_is_member(uid) then return jsonb_build_object('ok', true, 'member', true); end if;
  cost := coalesce(array_length(c.demo_items, 1), 0);
  if cost = 0 then return jsonb_build_object('ok', false, 'error', 'demo_off'); end if;
  insert into public.academia_progress (user_id, course_id) values (uid, p_course) on conflict do nothing;
  select * into pr from public.academia_progress where user_id = uid and course_id = p_course for update;
  if pr.demo_started_at is not null then
    if pr.demo_done_at is null and pr.demo_started_at > now() - interval '24 hours' then
      return jsonb_build_object('ok', true, 'member', false, 'resumed', true, 'cost', cost);
    end if;
    return jsonb_build_object('ok', false, 'error', 'demo_used');
  end if;
  cnt := public.academia_free_count(uid, p_today, p_local_count);
  if lim - cnt < cost then return jsonb_build_object('ok', false, 'error', 'limit', 'remaining', greatest(0, lim - cnt)); end if;
  update public.profiles set
      free_daily_count = cnt + cost,
      free_daily_date = public.academia_today(p_today),
      free_last_practice_at = now(),
      free_first_exercise_at = coalesce(free_first_exercise_at, now()),
      free_daily_limit_reached_at = case when cnt < lim and cnt + cost >= lim then now() else free_daily_limit_reached_at end
    where id = uid;
  update public.academia_progress set demo_started_at = now() where user_id = uid and course_id = p_course;
  return jsonb_build_object('ok', true, 'member', false, 'resumed', false, 'cost', cost,
    'daily', jsonb_build_object('count', cnt + cost, 'limit', lim));
end;
$$;
revoke all on function public.academia_demo_start(text, date, int) from public, anon;
grant execute on function public.academia_demo_start(text, date, int) to authenticated;

create or replace function public.academia_demo_finish(p_course text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  update public.academia_progress set demo_done_at = coalesce(demo_done_at, now())
   where user_id = uid and course_id = p_course and demo_started_at is not null;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.academia_demo_finish(text) from public, anon;
grant execute on function public.academia_demo_finish(text) to authenticated;

create or replace function public.academia_save_progress(p_course text, p_state jsonb, p_base_version int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.academia_courses%rowtype;
  clean jsonb := '{}'::jsonb;
  k text;
  cur public.academia_progress%rowtype;
  allowed text[] := array['v','lessons','resume','last','missed','cleared','exam','goal','goalAt','days','completions','snooze','returnTo'];
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.academia_courses where course_id = p_course and enabled;
  if not found then return jsonb_build_object('ok', false, 'error', 'course'); end if;
  -- Guardar avance en la cuenta es de la membresia (el historial ya guardado se conserva y se sigue pudiendo leer).
  if not public.academia_is_member(uid) then return jsonb_build_object('ok', false, 'error', 'members'); end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 60000 then
    return jsonb_build_object('ok', false, 'error', 'state');
  end if;
  foreach k in array allowed loop
    if p_state ? k then clean := clean || jsonb_build_object(k, p_state -> k); end if;
  end loop;

  select * into cur from public.academia_progress where user_id = uid and course_id = p_course for update;
  if not found then
    if coalesce(p_base_version, 0) <> 0 then
      return jsonb_build_object('ok', false, 'conflict', true, 'version', 0, 'state', null);
    end if;
    begin
      insert into public.academia_progress (user_id, course_id, state, version) values (uid, p_course, clean, 1);
    exception when unique_violation then
      select * into cur from public.academia_progress where user_id = uid and course_id = p_course;
      return jsonb_build_object('ok', false, 'conflict', true, 'version', cur.version, 'state', cur.state);
    end;
    return jsonb_build_object('ok', true, 'version', 1);
  end if;
  if cur.version <> coalesce(p_base_version, -1) then
    return jsonb_build_object('ok', false, 'conflict', true, 'version', cur.version, 'state', cur.state);
  end if;
  update public.academia_progress set state = clean, version = cur.version + 1, updated_at = now()
   where user_id = uid and course_id = p_course;
  return jsonb_build_object('ok', true, 'version', cur.version + 1);
end;
$$;
revoke all on function public.academia_save_progress(text, jsonb, int) from public, anon;
grant execute on function public.academia_save_progress(text, jsonb, int) to authenticated;

-- ---------- Errores de cursos hacia el motor actual: exactamente una vez ----------
-- apply_mistake_results NO es idempotente (cada llamada suma fallos y aciertos seguidos), así que
-- repetir un envío (corte de red tras confirmar, dos pestañas, reintento del navegador) contaría doble.
-- Cada envío lleva un identificador (batch_id) y esta tabla recuerda cuáles ya se aplicaron.
-- Si el motor falla, el envío queda 'pending' con el error a la vista y se reintenta solo
-- (academia_retry_pending). Nada se pierde ni se silencia: select * from academia_mistake_batches where status = 'pending'.
create table if not exists public.academia_mistake_batches (
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null,
  source text not null default 'lesson' check (source in ('lesson', 'exam')),
  status text not null default 'pending' check (status in ('pending', 'applied')),
  n int not null default 0,
  items jsonb,                       -- solo mientras está pendiente
  error text,
  tries int not null default 0,
  created_at timestamptz not null default now(),
  last_try_at timestamptz,
  applied_at timestamptz,
  primary key (user_id, batch_id)
);
create index if not exists academia_mistake_batches_pending_idx on public.academia_mistake_batches (status, created_at) where status = 'pending';
alter table public.academia_mistake_batches enable row level security;
revoke all on public.academia_mistake_batches from anon, authenticated;

-- Interna (sin permisos para el navegador). Devuelve 'applied' | 'duplicate' | 'pending'.
create or replace function public.academia_apply_batch(p_uid uuid, p_batch uuid, p_source text, p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.academia_mistake_batches%rowtype;
  err text;
begin
  insert into public.academia_mistake_batches (user_id, batch_id, source, n, items)
  values (p_uid, p_batch, p_source, jsonb_array_length(p_items), p_items)
  on conflict (user_id, batch_id) do nothing;
  select * into b from public.academia_mistake_batches where user_id = p_uid and batch_id = p_batch for update;
  if b.status = 'applied' then return 'duplicate'; end if;
  begin
    perform public.apply_mistake_results(b.items);
    update public.academia_mistake_batches
       set status = 'applied', items = null, error = null, tries = b.tries + 1, last_try_at = now(), applied_at = now()
     where user_id = p_uid and batch_id = p_batch;
    return 'applied';
  exception when others then
    err := left(sqlstate || ': ' || sqlerrm, 300);
  end;
  -- el bloque anterior se deshizo por completo (nada a medias); se deja constancia del fallo
  update public.academia_mistake_batches set error = err, tries = b.tries + 1, last_try_at = now()
   where user_id = p_uid and batch_id = p_batch;
  return 'pending';
end;
$$;
revoke all on function public.academia_apply_batch(uuid, uuid, text, jsonb) from public, anon, authenticated;

-- Para el navegador: solo ejercicios de cursos ('ac:<curso>:<actividad>'); el tema sale del curso, no del cliente.
create or replace function public.academia_apply_mistakes(p_batch uuid, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clean jsonb;
  r text; mem boolean; started boolean;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if p_batch is null or p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 200 then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  -- Curso apagado (interruptor): NO es un rechazo definitivo; el navegador conserva el envio y lo reintenta al reactivar.
  if not exists (select 1 from public.academia_courses where enabled) then return jsonb_build_object('ok', false, 'error', 'course'); end if;
  mem := public.academia_is_member(uid);
  select coalesce(jsonb_agg(jsonb_build_object('item_id', x.item_id, 'kind', 'academia', 'topic', c.engine_topic, 'is_correct', x.is_correct)), '[]'::jsonb)
    into clean
    from jsonb_to_recordset(p_items) as x(item_id text, is_correct boolean)
    join public.academia_courses c on c.course_id = split_part(x.item_id, ':', 2) and c.enabled
   where x.item_id ~ '^ac:[a-z0-9-]{2,40}:[a-z0-9_-]{1,40}$' and x.is_correct is not null
     and (mem or split_part(x.item_id, ':', 3) = any(c.demo_items));   -- sin membresia: solo la demostracion
  if jsonb_array_length(clean) = 0 then
    return jsonb_build_object('ok', false, 'error', case when mem then 'bad' else 'members' end);
  end if;
  if not mem then
    select demo_started_at is not null into started from public.academia_progress where user_id = uid limit 1;
    if not coalesce(started, false) then return jsonb_build_object('ok', false, 'error', 'members'); end if;
    if (select count(*) from public.academia_mistake_batches where user_id = uid) >= 6
       and not exists (select 1 from public.academia_mistake_batches where user_id = uid and batch_id = p_batch) then
      return jsonb_build_object('ok', false, 'error', 'members');
    end if;
  end if;
  r := public.academia_apply_batch(uid, p_batch, 'lesson', clean);
  if r = 'pending' then return jsonb_build_object('ok', false, 'error', 'engine', 'queued', true); end if;
  return jsonb_build_object('ok', true, 'duplicate', r = 'duplicate');
end;
$$;
revoke all on function public.academia_apply_mistakes(uuid, jsonb) from public, anon;
grant execute on function public.academia_apply_mistakes(uuid, jsonb) to authenticated;

-- Reintenta los envíos pendientes de la cuenta (el navegador la llama al abrir la academia).
create or replace function public.academia_retry_pending()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  b record; applied int := 0; still int := 0; r text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  for b in select batch_id, source, items from public.academia_mistake_batches
            where user_id = uid and status = 'pending' and tries < 20 order by created_at limit 20 loop
    r := public.academia_apply_batch(uid, b.batch_id, b.source, b.items);
    if r = 'pending' then still := still + 1; else applied := applied + 1; end if;
  end loop;
  return jsonb_build_object('ok', true, 'applied', applied, 'pending', still);
end;
$$;
revoke all on function public.academia_retry_pending() from public, anon;
grant execute on function public.academia_retry_pending() to authenticated;


-- ---------- Sesion de una leccion: UNA fila en progress_sessions + actividad real del miembro ----------
-- El servidor valida, inserta (la regla unica usuario+inicio+skill impide duplicados al reintentar) y, solo cuando la fila
-- es NUEVA y es un estudio real (>= 3 ejercicios distintos), marca profiles.last_practice_at: lo que leen los correos de
-- reactivacion y de "activacion de miembro". Abrir la pagina o repetir el mismo envio no cuenta.
create or replace function public.academia_record_session(p_course text, p_session jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.academia_courses%rowtype;
  pr public.academia_progress%rowtype;
  mem boolean; res jsonb; clean jsonb; nd int; n int;
  st bigint; dur bigint; d date; dtxt text; ins int := 0; now_ms bigint := floor(extract(epoch from now()) * 1000);
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.academia_courses where course_id = p_course and enabled;
  if not found then return jsonb_build_object('ok', false, 'error', 'course'); end if;
  if p_session is null or jsonb_typeof(p_session) <> 'object' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  res := p_session -> 'results';
  if res is null or jsonb_typeof(res) <> 'array' or jsonb_array_length(res) not between 3 and 60 then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  begin
    st := (p_session ->> 'startedAt')::bigint;
    dur := least(greatest(coalesce((p_session ->> 'durationMs')::bigint, 0), 0), 10800000);
  exception when others then return jsonb_build_object('ok', false, 'error', 'bad');
  end;
  if st is null or st < 1700000000000 or st > now_ms + 600000 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  select jsonb_agg(jsonb_build_object('itemId', x."itemId", 'isCorrect', x."isCorrect")), count(distinct x."itemId")
    into clean, nd
    from jsonb_to_recordset(res) as x("itemId" text, "isCorrect" boolean)
   where x."itemId" ~ '^ac:[a-z0-9-]{2,40}:[a-z0-9_-]{1,40}$' and split_part(x."itemId", ':', 2) = p_course and x."isCorrect" is not null;
  if clean is null or jsonb_array_length(clean) <> jsonb_array_length(res) or nd < 3 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  -- fecha: la del navegador si es coherente con la hora de inicio (+-1 dia), si no la del inicio
  d := (to_timestamp(st / 1000.0) at time zone 'utc')::date;
  dtxt := p_session ->> 'date';
  begin
    if dtxt is not null and abs(dtxt::date - d) <= 1 then d := dtxt::date; end if;
  exception when others then null;
  end;

  mem := public.academia_is_member(uid);
  if not mem then
    -- sin membresia: solo la sesion de la demostracion, una vez
    select * into pr from public.academia_progress where user_id = uid and course_id = p_course for update;
    if not found or pr.demo_started_at is null then return jsonb_build_object('ok', false, 'error', 'members'); end if;
    if exists (select 1 from jsonb_array_elements(clean) e where split_part(e ->> 'itemId', ':', 3) <> all(c.demo_items)) then
      return jsonb_build_object('ok', false, 'error', 'members');
    end if;
    if pr.demo_session_at is not null then return jsonb_build_object('ok', true, 'inserted', false, 'duplicate', true); end if;
  end if;

  begin
    insert into public.progress_sessions (user_id, skill, level, topics, date, started_at, duration_ms, results)
    values (uid, 'gramatica', c.session_level, jsonb_build_array(c.engine_topic), d, st, dur, clean)
    on conflict (user_id, started_at, skill) where started_at is not null do nothing;
    get diagnostics ins = row_count;
  exception
    when sqlstate 'P0001' then return jsonb_build_object('ok', false, 'error', 'limit');   -- limite diario de sesiones de la base
    when check_violation then return jsonb_build_object('ok', false, 'error', 'bad');
  end;

  if ins = 1 then
    if mem then update public.profiles set last_practice_at = now() where id = uid;
    else update public.academia_progress set demo_session_at = now() where user_id = uid and course_id = p_course; end if;
  end if;
  return jsonb_build_object('ok', true, 'inserted', ins = 1, 'duplicate', ins = 0);
end;
$$;
revoke all on function public.academia_record_session(text, jsonb) from public, anon;
grant execute on function public.academia_record_session(text, jsonb) to authenticated;

-- ---------- Examen oficial (banco privado) ----------
create table if not exists public.academia_exam_items (
  course_id text not null references public.academia_courses(course_id),
  id text not null,
  topic text not null,
  type text not null check (type in ('choice','type','order','error')),
  public jsonb not null,   -- lo que ve el alumno: q, source, options, tokens...
  answer jsonb not null,   -- SOLO servidor: correct | accepted | order, why
  active boolean not null default true,
  primary key (course_id, id)
);
alter table public.academia_exam_items enable row level security;
revoke all on public.academia_exam_items from anon, authenticated;

create table if not exists public.academia_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.academia_courses(course_id),
  item_ids text[] not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score_pct int,
  passed boolean,
  per_topic jsonb
);
create index if not exists academia_exam_attempts_user_idx on public.academia_exam_attempts (user_id, course_id, started_at desc);
alter table public.academia_exam_attempts enable row level security;
drop policy if exists "academia_exam_attempts: select own" on public.academia_exam_attempts;
create policy "academia_exam_attempts: select own" on public.academia_exam_attempts for select to authenticated using (auth.uid() = user_id);
revoke all on public.academia_exam_attempts from anon;
revoke insert, update, delete, truncate, references, trigger on public.academia_exam_attempts from authenticated;
grant select (id, course_id, started_at, submitted_at, score_pct, passed, per_topic) on public.academia_exam_attempts to authenticated;

create table if not exists public.academia_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.academia_courses(course_id),
  awarded_at timestamptz not null default now(),
  score_pct int not null,
  attempt_id uuid references public.academia_exam_attempts(id),
  primary key (user_id, course_id)
);
alter table public.academia_badges enable row level security;
drop policy if exists "academia_badges: select own" on public.academia_badges;
create policy "academia_badges: select own" on public.academia_badges for select to authenticated using (auth.uid() = user_id);
revoke all on public.academia_badges from anon;
revoke insert, update, delete, truncate, references, trigger on public.academia_badges from authenticated;
grant select on public.academia_badges to authenticated;

-- Misma normalización que academia.js (norm): comillas, minúsculas, espacios, puntuación final.
create or replace function public.academia_norm(t text)
returns text language sql immutable as $$
  select btrim(regexp_replace(regexp_replace(lower(regexp_replace(coalesce(t, ''), '[‘’´`]', '''', 'g')), '\s+', ' ', 'g'), '[.!?]+\s*$', ''))
$$;

-- Lo que ve el alumno de una pregunta. Las fichas de "ordenar" se entregan MEZCLADAS: si no, el orden correcto viajaría en la respuesta.
create or replace function public.academia_item_public(i public.academia_exam_items)
returns jsonb
language sql
volatile
set search_path = public
as $$
  select jsonb_build_object('id', i.id, 'topic', i.topic, 'type', i.type) ||
    case when i.type = 'order' and jsonb_typeof(i.public -> 'tokens') = 'array'
      then jsonb_set(i.public, '{tokens}', (select coalesce(jsonb_agg(x order by random()), '[]'::jsonb) from jsonb_array_elements(i.public -> 'tokens') x))
      else i.public end
$$;
revoke all on function public.academia_item_public(public.academia_exam_items) from public, anon, authenticated;

create or replace function public.academia_exam_status(p_course text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.academia_courses%rowtype;
  n int; b public.academia_badges%rowtype; best int; mem boolean;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.academia_courses where course_id = p_course and enabled;
  if not found then return jsonb_build_object('ok', false, 'error', 'course'); end if;
  select count(*) into n from public.academia_exam_attempts where user_id = uid and course_id = p_course and started_at > now() - interval '24 hours';
  select * into b from public.academia_badges where user_id = uid and course_id = p_course;
  select max(score_pct) into best from public.academia_exam_attempts where user_id = uid and course_id = p_course and submitted_at is not null;
  mem := public.academia_is_member(uid);
  return jsonb_build_object('ok', true, 'pass_pct', c.pass_pct, 'exam_size', c.exam_size,
    'attempts_left', greatest(0, c.max_attempts_day - n), 'badge', case when b.user_id is null then null else jsonb_build_object('awarded_at', b.awarded_at, 'score_pct', b.score_pct) end,
    'best_pct', best, 'can_take', mem, 'members_only', true);
end;
$$;
revoke all on function public.academia_exam_status(text) from public, anon;
grant execute on function public.academia_exam_status(text) to authenticated;

create or replace function public.academia_exam_start(p_course text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.academia_courses%rowtype;
  mem boolean; n int; open_a public.academia_exam_attempts%rowtype; last_ids text[];
  picked text[] := '{}'; t text; ids text[]; att uuid; pub jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.academia_courses where course_id = p_course and enabled;
  if not found then return jsonb_build_object('ok', false, 'error', 'course'); end if;
  mem := public.academia_is_member(uid);
  -- Evaluacion oficial e insignias: SIEMPRE solo miembros (decision comercial; academia_courses.members_only queda sin efecto).
  if not mem then return jsonb_build_object('ok', false, 'error', 'members'); end if;

  -- Un intento abierto (menos de 3 horas) se retoma: recargar la página no regala un sorteo nuevo.
  select * into open_a from public.academia_exam_attempts
   where user_id = uid and course_id = p_course and submitted_at is null and started_at > now() - interval '3 hours'
   order by started_at desc limit 1;
  if found then
    select coalesce(jsonb_agg(public.academia_item_public(i) order by array_position(open_a.item_ids, i.id)), '[]'::jsonb)
      into pub from public.academia_exam_items i where i.course_id = p_course and i.id = any(open_a.item_ids);
    return jsonb_build_object('ok', true, 'attempt_id', open_a.id, 'pass_pct', c.pass_pct, 'items', pub, 'resumed', true);
  end if;

  select count(*) into n from public.academia_exam_attempts where user_id = uid and course_id = p_course and started_at > now() - interval '24 hours';
  if n >= c.max_attempts_day then return jsonb_build_object('ok', false, 'error', 'limit'); end if;

  select item_ids into last_ids from public.academia_exam_attempts
   where user_id = uid and course_id = p_course and submitted_at is not null order by started_at desc limit 1;
  last_ids := coalesce(last_ids, '{}');

  for t in select distinct topic from public.academia_exam_items where course_id = p_course and active order by 1 loop
    -- primero preguntas que no salieron en el intento anterior; si faltan, se completa con las repetidas
    select coalesce(array_agg(x.id), '{}') into ids from (
      select i.id from public.academia_exam_items i
       where i.course_id = p_course and i.active and i.topic = t
       order by (i.id = any(last_ids)), random() limit c.per_topic) x;
    picked := picked || ids;
  end loop;
  if coalesce(array_length(picked, 1), 0) = 0 then return jsonb_build_object('ok', false, 'error', 'empty'); end if;
  select coalesce(array_agg(x order by random()), '{}') into picked from unnest(picked) x;
  if array_length(picked, 1) > c.exam_size then picked := picked[1:c.exam_size]; end if;

  insert into public.academia_exam_attempts (user_id, course_id, item_ids) values (uid, p_course, picked) returning id into att;
  select coalesce(jsonb_agg(public.academia_item_public(i) order by array_position(picked, i.id)), '[]'::jsonb)
    into pub from public.academia_exam_items i where i.course_id = p_course and i.id = any(picked);
  return jsonb_build_object('ok', true, 'attempt_id', att, 'pass_pct', c.pass_pct, 'items', pub, 'resumed', false);
end;
$$;
revoke all on function public.academia_exam_start(text) from public, anon;
grant execute on function public.academia_exam_start(text) to authenticated;

create or replace function public.academia_exam_submit(p_attempt uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  a public.academia_exam_attempts%rowtype;
  c public.academia_courses%rowtype;
  it public.academia_exam_items%rowtype;
  given jsonb; given_t text; ok boolean; right_t text;
  total int := 0; good int := 0; pct int; v_passed boolean;
  per jsonb := '{}'::jsonb; review jsonb := '[]'::jsonb; mist jsonb := '[]'::jsonb;
  k text; acc text; src text; engine_ok boolean;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into a from public.academia_exam_attempts where id = p_attempt and user_id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'attempt'); end if;
  if a.submitted_at is not null then return jsonb_build_object('ok', false, 'error', 'already_submitted'); end if;
  if a.started_at < now() - interval '3 hours' then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  -- La membresia se vuelve a comprobar al entregar: si vencio a mitad de intento no se califica ni se da insignia.
  if not public.academia_is_member(uid) then return jsonb_build_object('ok', false, 'error', 'members'); end if;
  select * into c from public.academia_courses where course_id = a.course_id;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then p_answers := '{}'::jsonb; end if;

  foreach k in array a.item_ids loop
    select * into it from public.academia_exam_items where course_id = a.course_id and id = k;
    if not found then continue; end if;
    total := total + 1;
    given := p_answers -> k;
    ok := false;
    if it.type in ('choice', 'error') then
      given_t := case when jsonb_typeof(given) = 'string' then given #>> '{}' else null end;
      ok := given_t is not null and given_t = (it.answer ->> 'correct');
      right_t := coalesce(it.answer ->> 'fix', it.answer ->> 'correct');
    elsif it.type = 'type' then
      given_t := case when jsonb_typeof(given) = 'string' then given #>> '{}' else null end;
      src := it.public ->> 'source';
      if given_t is not null then
        for acc in select jsonb_array_elements_text(it.answer -> 'accepted') loop
          if public.academia_norm(given_t) = public.academia_norm(acc)
             or (src is not null and position('___' in src) > 0 and public.academia_norm(given_t) = public.academia_norm(replace(src, '___', acc))) then
            ok := true; exit;
          end if;
        end loop;
      end if;
      right_t := it.answer -> 'accepted' ->> 0;
    elsif it.type = 'order' then
      ok := jsonb_typeof(given) = 'array' and given = (it.answer -> 'order');
      right_t := (select string_agg(x, ' ' order by ord) from jsonb_array_elements_text(it.answer -> 'order') with ordinality as t(x, ord));
    end if;
    if ok then good := good + 1; end if;
    per := jsonb_set(per, array[it.topic], jsonb_build_object(
      'ok', coalesce((per -> it.topic ->> 'ok')::int, 0) + case when ok then 1 else 0 end,
      'n', coalesce((per -> it.topic ->> 'n')::int, 0) + 1));
    if not ok then
      review := review || jsonb_build_array(jsonb_build_object('id', it.id, 'topic', it.topic, 'right', right_t, 'why', it.answer ->> 'why'));
    end if;
    mist := mist || jsonb_build_array(jsonb_build_object('item_id', 'ac:' || a.course_id || ':' || it.id, 'kind', 'academia', 'topic', c.engine_topic, 'is_correct', ok));
  end loop;
  if total = 0 then return jsonb_build_object('ok', false, 'error', 'empty'); end if;
  pct := round(good * 100.0 / total);
  v_passed := pct >= c.pass_pct;
  update public.academia_exam_attempts set submitted_at = now(), score_pct = pct, passed = v_passed, per_topic = per where id = a.id;
  if v_passed then
    insert into public.academia_badges (user_id, course_id, score_pct, attempt_id) values (uid, a.course_id, pct, a.id)
    on conflict (user_id, course_id) do update set score_pct = greatest(public.academia_badges.score_pct, excluded.score_pct);
  end if;
  -- Los errores del examen alimentan el MISMO motor de errores (no hay tabla paralela). Si el motor falla,
  -- la nota se entrega igual y el envío queda 'pending' con su error en academia_mistake_batches (se reintenta).
  engine_ok := true;
  if jsonb_array_length(mist) > 0 then
    engine_ok := public.academia_apply_batch(uid, a.id, 'exam', mist) <> 'pending';
  end if;
  return jsonb_build_object('ok', true, 'score_pct', pct, 'correct', good, 'total', total, 'passed', v_passed,
    'pass_pct', c.pass_pct, 'per_topic', per, 'review', review, 'badge', v_passed, 'engine_ok', engine_ok);
end;
$$;
revoke all on function public.academia_exam_submit(uuid, jsonb) from public, anon;
grant execute on function public.academia_exam_submit(uuid, jsonb) to authenticated;
