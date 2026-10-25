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
-- Errores de los cursos: NO hay tabla nueva. Se usa el motor actual (mistake_stats via
-- apply_mistake_results) con item_id 'ac:<curso>:<actividad>' y kind 'academia'.
-- ============================================================

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
  created_at timestamptz not null default now()
);
alter table public.academia_courses enable row level security;
drop policy if exists "academia_courses: read" on public.academia_courses;
create policy "academia_courses: read" on public.academia_courses for select to authenticated using (true);

insert into public.academia_courses (course_id, title, enabled, engine_topic)
values ('to-be', 'Domina el verbo TO BE', false, 'Verbo "to be": am / is / are')
on conflict (course_id) do nothing;

-- ---------- Progreso ----------
create table if not exists public.academia_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.academia_courses(course_id),
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 60000),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table public.academia_progress enable row level security;
drop policy if exists "academia_progress: select own" on public.academia_progress;
create policy "academia_progress: select own" on public.academia_progress for select to authenticated using (auth.uid() = user_id);
revoke all on public.academia_progress from anon;
revoke insert, update, delete, truncate, references, trigger on public.academia_progress from authenticated;
grant select on public.academia_progress to authenticated;

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
  allowed text[] := array['v','lessons','resume','last','missed','exam','goal','days','completions','snooze','returnTo'];
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into c from public.academia_courses where course_id = p_course and enabled;
  if not found then return jsonb_build_object('ok', false, 'error', 'course'); end if;
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
  select coalesce(is_member, false) into mem from public.profiles where id = uid;
  return jsonb_build_object('ok', true, 'pass_pct', c.pass_pct, 'exam_size', c.exam_size,
    'attempts_left', greatest(0, c.max_attempts_day - n), 'badge', case when b.user_id is null then null else jsonb_build_object('awarded_at', b.awarded_at, 'score_pct', b.score_pct) end,
    'best_pct', best, 'can_take', (not c.members_only) or coalesce(mem, false), 'members_only', c.members_only);
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
  select coalesce(is_member, false) into mem from public.profiles where id = uid;
  if c.members_only and not coalesce(mem, false) then return jsonb_build_object('ok', false, 'error', 'members'); end if;

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
  k text; acc text; src text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  select * into a from public.academia_exam_attempts where id = p_attempt and user_id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'attempt'); end if;
  if a.submitted_at is not null then return jsonb_build_object('ok', false, 'error', 'already_submitted'); end if;
  if a.started_at < now() - interval '3 hours' then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
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
  -- Los errores del examen alimentan el MISMO motor de errores (no hay tabla paralela).
  begin
    perform public.apply_mistake_results(mist);
  exception when others then null;   -- el motor de errores nunca debe impedir entregar la nota
  end;
  return jsonb_build_object('ok', true, 'score_pct', pct, 'correct', good, 'total', total, 'passed', v_passed,
    'pass_pct', c.pass_pct, 'per_topic', per, 'review', review, 'badge', v_passed);
end;
$$;
revoke all on function public.academia_exam_submit(uuid, jsonb) from public, anon;
grant execute on function public.academia_exam_submit(uuid, jsonb) to authenticated;
