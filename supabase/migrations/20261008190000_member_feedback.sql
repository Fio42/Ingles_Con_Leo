-- Tarjeta de feedback para Miembros (2026-10-08).
-- Dos tablas nuevas + 3 funciones que el navegador puede llamar. Las tablas NO aceptan
-- escrituras directas desde el navegador (solo lectura de lo propio); todo pasa por las funciones,
-- que validan en la base: miembro, puntuacion 1-10, comentario de texto plano (max 600),
-- una respuesta cada 90 dias y el calendario de "Ahora no" (7 / 30 / 90 dias).

create table if not exists public.member_feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  score smallint not null check (score between 1 and 10),
  comment text check (comment is null or char_length(comment) <= 600),
  -- Para analisis: puntuaciones 6 o menos quedan marcadas (sin correos individuales).
  low_score boolean generated always as (score <= 6) stored,
  -- Contexto minimo, calculado en la base (no lo manda el navegador):
  days_as_member integer,
  sessions_count integer,
  level text,
  created_at timestamptz not null default now()
);
create index if not exists member_feedback_user_created_idx on public.member_feedback (user_id, created_at desc);
create index if not exists member_feedback_low_idx on public.member_feedback (created_at desc) where low_score;

create table if not exists public.member_feedback_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_answered_at timestamptz,
  last_dismissed_at timestamptz,
  dismiss_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.member_feedback enable row level security;
alter table public.member_feedback_state enable row level security;

drop policy if exists "member_feedback: select own" on public.member_feedback;
create policy "member_feedback: select own" on public.member_feedback for select using (auth.uid() = user_id);
drop policy if exists "member_feedback_state: select own" on public.member_feedback_state;
create policy "member_feedback_state: select own" on public.member_feedback_state for select using (auth.uid() = user_id);

revoke all on public.member_feedback from anon, authenticated;
revoke all on public.member_feedback_state from anon, authenticated;
grant select on public.member_feedback to authenticated;
grant select on public.member_feedback_state to authenticated;

-- Interna (el navegador NO puede llamarla): decide si toca mostrar la tarjeta.
create or replace function public._member_feedback_status(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_member boolean;
  v_since timestamptz;
  v_sessions integer;
  v_next timestamptz;
  v_answered timestamptz;
  v_dismissed timestamptz;
  v_dismiss_count integer;
  v_survey timestamptz;
begin
  select is_member, member_since into v_member, v_since from public.profiles where id = p_uid;
  if not coalesce(v_member, false) or v_since is null then
    return jsonb_build_object('show', false, 'next_check_at', now() + interval '1 day');
  end if;

  v_next := v_since + interval '5 days';

  select count(*) into v_sessions from (select 1 from public.progress_sessions where user_id = p_uid limit 3) s;
  if v_sessions < 3 then
    v_next := greatest(v_next, now() + interval '1 day');
  end if;

  select last_answered_at, last_dismissed_at, dismiss_count
    into v_answered, v_dismissed, v_dismiss_count
    from public.member_feedback_state where user_id = p_uid;
  if v_answered is not null then
    v_next := greatest(v_next, v_answered + interval '90 days');
  end if;
  if v_dismissed is not null then
    v_next := greatest(v_next, v_dismissed + case
      when v_dismiss_count <= 1 then interval '7 days'
      when v_dismiss_count = 2 then interval '30 days'
      else interval '90 days' end);
  end if;

  -- No pedir lo mismo justo despues de la encuesta de 15 dias.
  select max(created_at) into v_survey from public.survey_responses where user_id = p_uid;
  if v_survey is not null then
    v_next := greatest(v_next, v_survey + interval '14 days');
  end if;

  if now() >= v_next then
    return jsonb_build_object('show', true, 'next_check_at', null);
  end if;
  return jsonb_build_object('show', false, 'next_check_at', v_next);
end;
$$;

create or replace function public.member_feedback_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('show', false, 'next_check_at', now() + interval '1 day');
  end if;
  return public._member_feedback_status(v_uid);
end;
$$;

create or replace function public.dismiss_member_feedback()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('member_feedback:' || v_uid::text, 0));
  -- Solo cuenta si la tarjeta realmente tocaba: un doble clic o una llamada repetida no sube el contador.
  if not coalesce((public._member_feedback_status(v_uid) ->> 'show')::boolean, false) then return; end if;
  insert into public.member_feedback_state as s (user_id, last_dismissed_at, dismiss_count, updated_at)
  values (v_uid, now(), 1, now())
  on conflict (user_id) do update
    set dismiss_count = s.dismiss_count + 1, last_dismissed_at = now(), updated_at = now();
end;
$$;

create or replace function public.submit_member_feedback(p_score integer, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_member boolean;
  v_since timestamptz;
  v_level text;
  v_comment text;
  v_sessions integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_score is null or p_score < 1 or p_score > 10 then
    raise exception 'invalid_score' using errcode = '22023';
  end if;
  -- Texto plano: se quitan caracteres de control; el limite se valida despues de limpiar.
  v_comment := nullif(btrim(regexp_replace(coalesce(p_comment, ''), '[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g')), '');
  if v_comment is not null and char_length(v_comment) > 600 then
    raise exception 'comment_too_long' using errcode = '22001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('member_feedback:' || v_uid::text, 0));

  select is_member, member_since, level into v_member, v_since, v_level from public.profiles where id = v_uid;
  if not coalesce(v_member, false) then raise exception 'not_member' using errcode = '42501'; end if;

  -- Misma regla que la tarjeta, validada tambien aqui para no depender de la pagina: 5+ dias desde
  -- member_since y 3+ sesiones totales (cuenta toda la practica, tambien la anterior a ser miembro).
  if v_since is null or v_since > now() - interval '5 days' then
    raise exception 'feedback_not_eligible' using errcode = '42501';
  end if;
  select count(*) into v_sessions from (select 1 from public.progress_sessions where user_id = v_uid limit 3) s;
  if v_sessions < 3 then
    raise exception 'feedback_not_eligible' using errcode = '42501';
  end if;

  -- Una respuesta maximo cada 90 dias, aunque lo intenten desde otro dispositivo o saltandose la pagina.
  if exists (select 1 from public.member_feedback where user_id = v_uid and created_at > now() - interval '90 days') then
    raise exception 'feedback_too_soon' using errcode = 'P0001';
  end if;

  insert into public.member_feedback (user_id, score, comment, days_as_member, sessions_count, level)
  values (
    v_uid, p_score::smallint, v_comment,
    case when v_since is null then null else floor(extract(epoch from (now() - v_since)) / 86400)::integer end,
    (select count(*)::integer from public.progress_sessions where user_id = v_uid),
    v_level
  );

  insert into public.member_feedback_state as s (user_id, last_answered_at, dismiss_count, updated_at)
  values (v_uid, now(), 0, now())
  on conflict (user_id) do update set last_answered_at = now(), dismiss_count = 0, updated_at = now();
end;
$$;

revoke all on function public._member_feedback_status(uuid) from public, anon, authenticated;
revoke all on function public.member_feedback_status() from public, anon, authenticated;
revoke all on function public.dismiss_member_feedback() from public, anon, authenticated;
revoke all on function public.submit_member_feedback(integer, text) from public, anon, authenticated;
grant execute on function public.member_feedback_status() to authenticated;
grant execute on function public.dismiss_member_feedback() to authenticated;
grant execute on function public.submit_member_feedback(integer, text) to authenticated;

-- Para analisis (correr a mano en el SQL Editor):
--   select created_at, score, comment, days_as_member, sessions_count, level
--   from public.member_feedback where low_score order by created_at desc;
