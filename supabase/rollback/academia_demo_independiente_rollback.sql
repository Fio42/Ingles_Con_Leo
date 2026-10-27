-- Reversion de 20261027180000_academia_demo_independiente.sql: vuelve a la demo que descuenta 3 del limite diario.
-- NO borra ni modifica datos de alumnos (academia_progress, profiles, sesiones). Solo reemplaza dos funciones.
-- Aplicar manualmente, SOLO con autorizacion de Leo. Efecto: la demo vuelve a exigir 3 ejercicios libres hoy y a cobrarlos.

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
