-- ============================================================
-- Inglés con Leo: registro central de errores (Fase 1)
--
-- Qué guarda: UNA fila por error distinto (fingerprint) con contador,
-- primera y última aparición. Nunca respuestas de alumnos, Writing,
-- audio, correos, user_id, tokens ni IP. Los textos se limpian aquí
-- OTRA VEZ (app_error_clean) aunque ya vengan limpios del navegador y
-- de la Edge Function report-error.
--
--   app_errors         una fila por fingerprint (estado: open/resolved/ignored)
--   app_error_hourly   conteo por hora (para el resumen de 24 h)
--   app_error_rate     contadores de límites (IP hasheada, global, correos)
--
-- Seguridad: RLS activado y SIN políticas; nadie lee ni escribe desde el
-- navegador. Las funciones solo las ejecuta service_role (las Edge
-- Functions). Mismo patrón que leo_ai_*.
--
-- Flujo: navegador -> report-error -> log_app_error() -> (si toca avisar)
-- pg_net -> error-alert -> Resend. Las Edge Functions de servidor llaman
-- a log_app_error() directo con service_role.
--
-- Correos (decide log_app_error, de forma atómica):
--   * error NUEVO de severidad warning o más       -> aviso inmediato
--   * un error 'resolved' que vuelve              -> aviso (regresión)
--   * critical que sigue pasando                  -> como mucho 1 cada 2 h
--   * repetido (warning o más)                    -> solo al llegar a 10, 100,
--                                                    1000, 10000 y con >6 h desde el último
--   * info                                        -> nunca individual (solo resumen)
--   * status = 'ignored'                          -> cuenta, nunca avisa
--   * topes: 10 correos/hora y 40/día; el exceso va al resumen diario.
-- Resumen diario: 9:00 America/Cancun (= 14:00 UTC, Cancún no tiene cambio
-- de horario), solo si hubo algo.
--
-- Topes contra abuso: 600 eventos/hora por origen (client/server), 30
-- fingerprints NUEVOS/hora, 5000 filas máximo (lo que pase se agrupa en la
-- fila 'overflow'). El límite por IP (30/hora) lo aplica report-error.
--
-- MANEJO (Supabase -> SQL Editor):
--   Ver lo abierto:   select id, severity, kind, section, message, count, last_seen
--                       from app_errors where status = 'open' order by last_seen desc;
--   Marcar resuelto:  update app_errors set status = 'resolved' where id = 123;
--   Silenciar:        update app_errors set status = 'ignored' where id = 123;
--
-- APLICADA en Supabase el 2026-10-03. Es seguro volver a correrla.
-- ============================================================

create table if not exists public.app_errors (
  id bigint generated always as identity primary key,
  fingerprint text not null unique,
  kind text not null check (kind in (
    'js_error','promise','resource','network','leo_ai','audio','auth','exercise',
    'membership','payment','edge_function','email','webhook','other')),
  source text not null check (source in ('client','server')),
  severity text not null check (severity in ('info','warning','error','critical')),
  section text not null default '',
  message text not null default '',
  error_name text,
  stack_top text,
  code text,
  browsers jsonb not null default '{}'::jsonb,
  platforms jsonb not null default '{}'::jsonb,
  sample jsonb,
  first_release text,
  last_release text,
  count int not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','resolved','ignored')),
  last_emailed_at timestamptz,
  emailed_count int not null default 0,
  count_at_last_email int not null default 0
);
create index if not exists app_errors_last_seen_idx on public.app_errors (last_seen desc);
create index if not exists app_errors_first_seen_idx on public.app_errors (first_seen desc);

create table if not exists public.app_error_hourly (
  error_id bigint not null references public.app_errors(id) on delete cascade,
  hour timestamptz not null,
  n int not null default 0,
  primary key (error_id, hour)
);
create index if not exists app_error_hourly_hour_idx on public.app_error_hourly (hour);

create table if not exists public.app_error_rate (
  bucket text primary key,
  window_start timestamptz not null,
  n int not null default 0
);

alter table public.app_errors enable row level security;
alter table public.app_error_hourly enable row level security;
alter table public.app_error_rate enable row level security;
revoke all on table public.app_errors, public.app_error_hourly, public.app_error_rate from public, anon, authenticated;

-- ------------------------------------------------------------
-- Limpieza de texto (última defensa). Mismo orden y mismas reglas que
-- cleanText() de error-monitor.js y de report-error.ts.
-- ------------------------------------------------------------
create or replace function public.app_error_clean(t text, n int default 300)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if t is null then return ''; end if;
  t := regexp_replace(t, '"[^"\n]{41,}"', '"[text]"', 'g');
  t := regexp_replace(t, '''[^''\n]{41,}''', '''[text]''', 'g');
  t := regexp_replace(t, '[?#][^\s"'')\]]+', '', 'g');
  t := regexp_replace(t, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '[id]', 'gi');
  t := regexp_replace(t, '(?:\d[ -]?){13,19}', '[num]', 'g');
  t := regexp_replace(t, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email]', 'g');
  t := regexp_replace(t, 'eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}(?:\.[A-Za-z0-9_-]*)?', '[jwt]', 'g');
  t := regexp_replace(t, 'Bearer\s+\S+', 'Bearer [token]', 'gi');
  t := regexp_replace(t, '(apikey|api_key|access_token|refresh_token|token|password|passwd|secret|authorization)(["'']?\s*[=:]\s*)["'']?[^\s&"'',;)]+', '\1\2[redacted]', 'gi');
  t := regexp_replace(t, '(?:sb_(?:publishable|secret)|sk_(?:live|test)|pk_(?:live|test)|rk_(?:live|test)|whsec)_[A-Za-z0-9]+', '[key]', 'g');
  t := regexp_replace(t, '\d{6,}', '[num]', 'g');
  t := regexp_replace(t, '[A-Za-z0-9_-]{32,}', '[token]', 'g');
  t := btrim(regexp_replace(t, '\s+', ' ', 'g'));
  return left(t, n);
end;
$$;

-- Suma 1 a un contador dentro de un jsonb, con máximo 8 claves distintas.
create or replace function public.app_error_bump(j jsonb, k text)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
begin
  if k is null or k = '' then return j; end if;
  if j ? k then
    return jsonb_set(j, array[k], to_jsonb(coalesce((j ->> k)::int, 0) + 1));
  end if;
  if (select count(*) from jsonb_object_keys(j)) < 8 then
    return j || jsonb_build_object(k, 1);
  end if;
  return j;
end;
$$;

create or replace function public.app_error_rank(s text)
returns int
language sql
immutable
set search_path = ''
as $$ select case s when 'info' then 1 when 'warning' then 2 when 'error' then 3 when 'critical' then 4 else 3 end; $$;

-- Cuenta un golpe en un contador con ventana. Devuelve true si todavía está
-- dentro del límite.
create or replace function public.err_rate_hit(p_bucket text, p_limit int, p_window int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  insert into public.app_error_rate as r (bucket, window_start, n)
  values (left(coalesce(p_bucket, ''), 80), now(), 1)
  on conflict (bucket) do update set
    window_start = case when r.window_start < now() - make_interval(secs => p_window) then now() else r.window_start end,
    n = case when r.window_start < now() - make_interval(secs => p_window) then 1 else r.n + 1 end
  returning n into v_n;
  return v_n <= p_limit;
end;
$$;

-- ------------------------------------------------------------
-- Registro de un error. Devuelve jsonb { logged, alert, reason? }.
-- NUNCA lanza errores: cualquier fallo devuelve { logged:false }.
-- ------------------------------------------------------------
create or replace function public.log_app_error(
  p_fp text, p_kind text, p_source text, p_severity text, p_section text,
  p_message text, p_error_name text, p_stack_top text, p_code text,
  p_release text, p_browser text, p_platform text, p_sample jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fp text := p_fp;
  v_kind text := lower(left(coalesce(p_kind, ''), 20));
  v_sev text := lower(left(coalesce(p_severity, ''), 10));
  v_section text := regexp_replace(lower(left(coalesce(p_section, ''), 40)), '[^a-z0-9_-]', '', 'g');
  v_message text := public.app_error_clean(p_message, 300);
  v_name text := nullif(public.app_error_clean(p_error_name, 40), '');
  v_stack text := nullif(public.app_error_clean(p_stack_top, 400), '');
  v_code text := nullif(public.app_error_clean(p_code, 30), '');
  v_release text := nullif(left(regexp_replace(coalesce(p_release, ''), '[^A-Za-z0-9._-]', '', 'g'), 30), '');
  v_browser text := nullif(public.app_error_clean(p_browser, 40), '');
  v_platform text := nullif(public.app_error_clean(p_platform, 40), '');
  v_sample jsonb := null;
  r public.app_errors%rowtype;
  v_is_new boolean := false;
  v_regress boolean := false;
  v_reason text := null;
  v_exists boolean;
begin
  if p_source not in ('client', 'server') then return jsonb_build_object('logged', false, 'reason', 'source'); end if;
  if v_fp is null or v_fp !~ '^[0-9a-f]{16,64}$' then return jsonb_build_object('logged', false, 'reason', 'fingerprint'); end if;
  if v_kind not in ('js_error','promise','resource','network','leo_ai','audio','auth','exercise','membership','payment','edge_function','email','webhook','other') then
    v_kind := 'other';
  end if;
  if v_sev not in ('info', 'warning', 'error', 'critical') then v_sev := 'error'; end if;

  -- Solo valores simples y conocidos en "sample" (nunca texto libre).
  if p_sample is not null and jsonb_typeof(p_sample) = 'object' then
    v_sample := jsonb_strip_nulls(jsonb_build_object(
      'online', case when jsonb_typeof(p_sample -> 'online') = 'boolean' then p_sample -> 'online' end,
      'logged_in', case when jsonb_typeof(p_sample -> 'logged_in') = 'boolean' then p_sample -> 'logged_in' end,
      'member', case when jsonb_typeof(p_sample -> 'member') = 'boolean' then p_sample -> 'member' end,
      'status', case when jsonb_typeof(p_sample -> 'status') = 'number' and (p_sample ->> 'status') ~ '^[1-5][0-9][0-9]$' then p_sample -> 'status' end,
      'method', case when (p_sample ->> 'method') in ('GET','POST','PUT','PATCH','DELETE','HEAD') then p_sample -> 'method' end
    ));
    if v_sample = '{}'::jsonb then v_sample := null; end if;
  end if;

  -- Tope global de eventos por origen (por hora).
  if not public.err_rate_hit('global:' || p_source, 600, 3600) then
    return jsonb_build_object('logged', false, 'reason', 'rate');
  end if;

  -- Fingerprint nuevo: límite de nuevos por hora y tope de filas. Si se pasa,
  -- se agrupa en la fila 'overflow' (así nadie puede llenar la tabla).
  select exists (select 1 from public.app_errors where fingerprint = v_fp) into v_exists;
  if not v_exists then
    if (select count(*) from public.app_errors) >= 5000 or not public.err_rate_hit('newfp', 30, 3600) then
      v_fp := 'overflow';
      v_kind := 'other'; v_sev := 'warning'; v_section := ''; v_message := 'Demasiados errores distintos: agrupados aqui';
      v_name := null; v_stack := null; v_code := 'overflow'; v_sample := null;
    end if;
  end if;

  insert into public.app_errors as e (
    fingerprint, kind, source, severity, section, message, error_name, stack_top, code,
    browsers, platforms, sample, first_release, last_release)
  values (
    v_fp, v_kind, p_source, v_sev, v_section, v_message, v_name, v_stack, v_code,
    case when v_browser is null then '{}'::jsonb else jsonb_build_object(v_browser, 1) end,
    case when v_platform is null then '{}'::jsonb else jsonb_build_object(v_platform, 1) end,
    v_sample, v_release, v_release)
  on conflict (fingerprint) do nothing
  returning * into r;

  if found then
    v_is_new := true;
  else
    select * into r from public.app_errors where fingerprint = v_fp for update;
    v_regress := (r.status = 'resolved');
    update public.app_errors set
      count = count + 1,
      last_seen = now(),
      last_release = coalesce(v_release, last_release),
      severity = case when public.app_error_rank(v_sev) > public.app_error_rank(severity) then v_sev else severity end,
      status = case when status = 'resolved' then 'open' else status end,
      browsers = public.app_error_bump(browsers, v_browser),
      platforms = public.app_error_bump(platforms, v_platform),
      sample = coalesce(v_sample, sample)
    where id = r.id
    returning * into r;
  end if;

  insert into public.app_error_hourly (error_id, hour, n)
  values (r.id, date_trunc('hour', now()), 1)
  on conflict (error_id, hour) do update set n = public.app_error_hourly.n + 1;

  -- ¿Hay que avisar por correo? (r ya está bloqueada: decisión atómica)
  if r.status <> 'ignored' and public.app_error_rank(r.severity) >= 2 then
    if v_is_new then
      v_reason := 'new';
    elsif v_regress then
      v_reason := 'regression';
    elsif r.severity = 'critical' and (r.last_emailed_at is null or r.last_emailed_at < now() - interval '2 hours') then
      v_reason := 'critical_repeat';
    elsif r.count in (10, 100, 1000, 10000) and (r.last_emailed_at is null or r.last_emailed_at < now() - interval '6 hours') then
      v_reason := 'escalation';
    end if;
  end if;

  -- Topes globales de correo: 10 por hora y 40 por día. Lo que sobre va al resumen.
  if v_reason is not null then
    if public.err_rate_hit('mail_hour', 10, 3600) then
      if not public.err_rate_hit('mail_day', 40, 86400) then
        perform public.err_rate_hit('mail_suppressed', 1000000, 86400);
        v_reason := null;
      end if;
    else
      perform public.err_rate_hit('mail_suppressed', 1000000, 86400);
      v_reason := null;
    end if;
  end if;

  if v_reason is not null then
    update public.app_errors
       set last_emailed_at = now(), emailed_count = emailed_count + 1, count_at_last_email = count
     where id = r.id;
    begin
      perform net.http_post(
        url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/error-alert',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_functions_secret')
        ),
        body := jsonb_build_object('event', 'alert', 'error_id', r.id, 'reason', v_reason),
        timeout_milliseconds := 20000
      );
    exception when others then
      null; -- el aviso nunca bloquea el registro
    end;
  end if;

  return jsonb_build_object('logged', true, 'alert', v_reason is not null, 'reason', v_reason, 'id', r.id, 'new', v_is_new);
exception when others then
  return jsonb_build_object('logged', false, 'reason', 'exception');
end;
$$;

-- ------------------------------------------------------------
-- Resumen de las últimas 24 h (lo usa error-alert en modo "digest").
-- ------------------------------------------------------------
create or replace function public.app_error_digest()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with h as (
    select error_id, sum(n)::int as n24
      from public.app_error_hourly
     where hour >= date_trunc('hour', now() - interval '24 hours')
     group by error_id
  ), top as (
    select e.id, e.severity, e.kind, e.section, e.message, e.status, e.count, e.first_seen, e.last_seen, h.n24
      from h join public.app_errors e on e.id = h.error_id
     order by (case e.severity when 'critical' then 4 when 'error' then 3 when 'warning' then 2 else 1 end) desc, h.n24 desc
     limit 15
  )
  select jsonb_build_object(
    'events_24h', coalesce((select sum(n24) from h), 0),
    'distinct_24h', (select count(*) from h),
    'new_24h', (select count(*) from public.app_errors where first_seen >= now() - interval '24 hours'),
    'open_total', (select count(*) from public.app_errors where status = 'open'),
    'suppressed_alerts', coalesce((select n from public.app_error_rate where bucket = 'mail_suppressed' and window_start > now() - interval '26 hours'), 0),
    'top', coalesce((select jsonb_agg(to_jsonb(top)) from top), '[]'::jsonb)
  );
$$;

-- Limpieza semanal: errores sin actividad 60 días, conteos por hora de más de
-- 14 días y contadores de límites vencidos (incluye las IP hasheadas).
create or replace function public.app_error_cleanup()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.app_errors where last_seen < now() - interval '60 days';
  delete from public.app_error_hourly where hour < now() - interval '14 days';
  delete from public.app_error_rate where window_start < now() - interval '2 days';
$$;

revoke all on function public.app_error_clean(text, int) from public, anon, authenticated;
revoke all on function public.app_error_bump(jsonb, text) from public, anon, authenticated;
revoke all on function public.app_error_rank(text) from public, anon, authenticated;
revoke all on function public.err_rate_hit(text, int, int) from public, anon, authenticated;
revoke all on function public.log_app_error(text, text, text, text, text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.app_error_digest() from public, anon, authenticated;
revoke all on function public.app_error_cleanup() from public, anon, authenticated;
grant execute on function public.app_error_clean(text, int) to service_role;
grant execute on function public.app_error_bump(jsonb, text) to service_role;
grant execute on function public.app_error_rank(text) to service_role;
grant execute on function public.err_rate_hit(text, int, int) to service_role;
grant execute on function public.log_app_error(text, text, text, text, text, text, text, text, text, text, text, text, jsonb) to service_role;
grant execute on function public.app_error_digest() to service_role;
grant execute on function public.app_error_cleanup() to service_role;

-- ------------------------------------------------------------
-- Cron: resumen diario 9:00 America/Cancun (14:00 UTC) y limpieza semanal.
-- ------------------------------------------------------------
select cron.schedule('inglesconleo-error-digest', '0 14 * * *', $cmd$
  select net.http_post(
    url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/error-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_functions_secret')
    ),
    body := '{"event":"digest"}'::jsonb,
    timeout_milliseconds := 60000
  );
$cmd$);

select cron.schedule('inglesconleo-error-cleanup', '30 8 * * 0', $cmd$ select public.app_error_cleanup(); $cmd$);
