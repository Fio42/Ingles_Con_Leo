-- ============================================================
-- Inglés con Leo: configuración, probadores, consumo y topes de Leo AI
-- (supabase_functions/leo-ai.ts)
--
-- ESTADO: APLICADA en Supabase el 2026-10-01 (activación controlada:
-- encendido solo para probadores, NO abierto a todos los miembros).
--
-- Qué se guarda: SOLO cantidades. Nunca preguntas, respuestas ni textos.
--   leo_ai_config   una sola fila: encendido, abierto a todos, topes.
--   leo_ai_testers  quién puede usar Leo AI mientras no esté abierto.
--   ai_usage        por alumno y día (UTC): cuántos pedidos hizo.
--   ai_usage_daily  por día y proveedor: pedidos, tokens y neurons
--                   estimados. La fila provider='reserved' cuenta los
--                   pedidos aceptados por los topes.
-- Seguridad: RLS activado y SIN políticas en las 4 tablas (nadie lee ni
-- escribe desde el navegador). Las funciones solo las ejecuta la
-- service_role key (la de la Edge Function), no anon ni authenticated.
-- Si se borra una cuenta, sus filas se borran solas (on delete cascade).
--
-- MANEJO DIARIO (Supabase -> SQL Editor):
--   Apagar ya:          update leo_ai_config set enabled = false;
--   Abrir a todos:      update leo_ai_config set public = true;   (y en app.js LEO_AI_PUBLIC = true)
--   Cambiar topes:      update leo_ai_config set user_daily_limit = 50;
--   Ver consumo:        select * from ai_usage_daily order by day desc, provider;
--   Agregar probador:   insert into leo_ai_testers (user_id) values ('<id de profiles>');
-- ============================================================

create table if not exists public.leo_ai_config (
  id boolean primary key default true check (id),   -- una sola fila
  enabled boolean not null default false,
  public boolean not null default false,
  -- Leo AI: límite actual de 100 explicaciones por miembro/día porque la
  -- base de miembros de pago todavía es pequeña. Debe reducirse cuando
  -- aumente el número de miembros activos (ver DEVLOG.txt).
  user_daily_limit int not null default 100 check (user_daily_limit between 1 and 1000),
  global_daily_limit int not null default 1500 check (global_daily_limit between 1 and 10000),
  neuron_budget numeric not null default 8000 check (neuron_budget between 0 and 10000),
  updated_at timestamptz not null default now()
);
insert into public.leo_ai_config (id) values (true) on conflict do nothing;
alter table public.leo_ai_config enable row level security;

create table if not exists public.leo_ai_testers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.leo_ai_testers enable row level security;

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;

create table if not exists public.ai_usage_daily (
  day date not null,
  provider text not null,
  requests int not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  neurons numeric not null default 0,  -- estimado con el precio publicado de Workers AI
  primary key (day, provider)
);
alter table public.ai_usage_daily enable row level security;

-- Decide si un pedido puede pasar y lo cuenta, ANTES de llamar al
-- proveedor. Devuelve: 'ok' | 'disabled' | 'not_allowed' | 'user_limit'
-- | 'global_limit' | 'neuron_budget'.
-- Seguro ante varias llamadas a la vez: bloquea la fila global del día
-- (FOR UPDATE), así los pedidos simultáneos se revisan uno detrás de otro.
create or replace function public.leo_ai_reserve(p_user uuid, p_day date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.leo_ai_config%rowtype;
  reserved int;
  used_neurons numeric;
  user_count int;
begin
  select * into cfg from public.leo_ai_config where id;
  if not found or not cfg.enabled then return 'disabled'; end if;
  if not cfg.public and not exists (select 1 from public.leo_ai_testers t where t.user_id = p_user) then
    return 'not_allowed';
  end if;
  insert into public.ai_usage_daily (day, provider) values (p_day, 'reserved') on conflict do nothing;
  select requests into reserved from public.ai_usage_daily where day = p_day and provider = 'reserved' for update;
  if reserved >= cfg.global_daily_limit then return 'global_limit'; end if;
  select coalesce(sum(neurons), 0) into used_neurons from public.ai_usage_daily where day = p_day and provider <> 'reserved';
  if used_neurons >= cfg.neuron_budget then return 'neuron_budget'; end if;
  select count into user_count from public.ai_usage where user_id = p_user and day = p_day;
  if coalesce(user_count, 0) >= cfg.user_daily_limit then return 'user_limit'; end if;
  insert into public.ai_usage (user_id, day, count) values (p_user, p_day, 1)
    on conflict (user_id, day) do update set count = public.ai_usage.count + 1;
  update public.ai_usage_daily set requests = requests + 1 where day = p_day and provider = 'reserved';
  return 'ok';
end;
$$;

-- Suma lo que de verdad gastó un pedido (solo números).
create or replace function public.leo_ai_record(p_day date, p_provider text, p_input int, p_output int, p_neurons numeric)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage_daily (day, provider, requests, input_tokens, output_tokens, neurons)
  values (p_day, left(p_provider, 20), 1, greatest(p_input, 0), greatest(p_output, 0), greatest(p_neurons, 0))
  on conflict (day, provider) do update set
    requests = public.ai_usage_daily.requests + 1,
    input_tokens = public.ai_usage_daily.input_tokens + excluded.input_tokens,
    output_tokens = public.ai_usage_daily.output_tokens + excluded.output_tokens,
    neurons = public.ai_usage_daily.neurons + excluded.neurons;
$$;

revoke all on function public.leo_ai_reserve(uuid, date) from public, anon, authenticated;
revoke all on function public.leo_ai_record(date, text, int, int, numeric) from public, anon, authenticated;
grant execute on function public.leo_ai_reserve(uuid, date) to service_role;
grant execute on function public.leo_ai_record(date, text, int, int, numeric) to service_role;

-- ------------------------------------------------------------
-- Idempotencia por request_id (2026-10-03). APLICAR en SQL Editor.
-- Un request_id = UNA pulsación = UNA explicación, sin importar cuántas veces
-- llegue (reintentos del celular, timeout del navegador, doble toque):
--   * el límite diario se descuenta UNA sola vez, al reclamar el id;
--   * el proveedor (Cloudflare) se llama como máximo 2 veces por id;
--   * si ya terminó bien, se devuelve la MISMA respuesta guardada, sin modelo;
--   * si otra llamada sigue en curso, no se llama de nuevo (la Edge Function
--     espera unos segundos y, si no termina, responde 'in_progress');
--   * un 'processing' sin latido por más de 45 s se considera abandonado
--     (función muerta) y se puede retomar, respetando el máximo de 2 intentos.
-- Reclamar el id y reservar el límite pasan en UNA transacción: la clave
-- única (user_id, request_id) + INSERT ... ON CONFLICT DO NOTHING hace que, con
-- dos pedidos simultáneos, solo uno gane y llame al modelo.
-- El día es SIEMPRE el de UTC calculado aquí (nunca el que mande el navegador),
-- alineado con el reinicio diario de Cloudflare.
-- Solo se guarda: ids, día, estado, la respuesta YA validada (explicación corta,
-- sin la pregunta ni la frase del alumno), motivo del fallo, contador y fechas.
-- Las filas se borran solas a las 24 horas.
-- Mientras este bloque no se aplique, la Edge Function sigue funcionando como
-- antes (sin protección de reintentos).
-- ------------------------------------------------------------
drop function if exists public.leo_ai_reserve(uuid, date, text); -- versión anterior, nunca usada en producción

create table if not exists public.leo_ai_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  day date not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  answer jsonb,
  reason text,
  provider_attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
create index if not exists leo_ai_requests_created_idx on public.leo_ai_requests (created_at);
alter table public.leo_ai_requests enable row level security;

-- Devuelve jsonb { status, day, attempt?, answer?, reason? } con status:
--   'go'           esta llamada debe llamar al proveedor (attempt = 1 o 2)
--   'completed'    respuesta ya guardada en "answer"
--   'processing'   otra llamada sigue en curso (no llamar al modelo)
--   'failed_final' ya se usaron los 2 intentos: "reason" trae el motivo
--   'disabled' | 'not_allowed' | 'user_limit' | 'global_limit' | 'neuron_budget'
create or replace function public.leo_ai_begin(p_user uuid, p_request text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
  r public.leo_ai_requests%rowtype;
  claimed int;
  gate text;
begin
  delete from public.leo_ai_requests where created_at < now() - interval '24 hours';

  insert into public.leo_ai_requests (user_id, request_id, day, status, provider_attempts)
    values (p_user, p_request, v_day, 'processing', 0)
    on conflict (user_id, request_id) do nothing;
  get diagnostics claimed = row_count;

  if claimed = 1 then
    -- Ganó el reclamo: reserva el límite diario (una sola vez por id).
    gate := public.leo_ai_reserve(p_user, v_day);
    if gate <> 'ok' then
      delete from public.leo_ai_requests where user_id = p_user and request_id = p_request;
      return jsonb_build_object('status', gate, 'day', v_day);
    end if;
    update public.leo_ai_requests set provider_attempts = 1, updated_at = now()
      where user_id = p_user and request_id = p_request;
    return jsonb_build_object('status', 'go', 'attempt', 1, 'day', v_day);
  end if;

  -- El id ya existía: se bloquea su fila para decidir de a uno.
  select * into r from public.leo_ai_requests where user_id = p_user and request_id = p_request for update;
  if not found then
    -- Se borró justo ahora (la ganadora no pasó los topes): que reintente.
    return jsonb_build_object('status', 'processing', 'day', v_day);
  end if;

  if r.status = 'completed' then
    return jsonb_build_object('status', 'completed', 'answer', r.answer, 'day', r.day);
  end if;

  if r.status = 'processing' and r.updated_at > now() - interval '45 seconds' then
    return jsonb_build_object('status', 'processing', 'day', r.day);
  end if;

  -- 'failed', o 'processing' abandonado: otro intento real solo si quedan.
  if r.provider_attempts >= 2 then
    if r.status = 'processing' then
      update public.leo_ai_requests set status = 'failed', reason = coalesce(reason, 'error'), updated_at = now()
        where user_id = p_user and request_id = p_request;
    end if;
    return jsonb_build_object('status', 'failed_final', 'reason', coalesce(r.reason, 'error'), 'day', r.day);
  end if;

  update public.leo_ai_requests set status = 'processing', provider_attempts = provider_attempts + 1, updated_at = now()
    where user_id = p_user and request_id = p_request;
  return jsonb_build_object('status', 'go', 'attempt', r.provider_attempts + 1, 'day', r.day);
end;
$$;

-- Cierra un intento: 'completed' guarda la respuesta ya validada; 'failed' el
-- motivo. Un fallo de un intento viejo no pisa a uno más nuevo (p_attempt), y
-- un 'completed' nunca se sobrescribe.
create or replace function public.leo_ai_finish(p_user uuid, p_request text, p_status text, p_answer jsonb, p_reason text, p_attempt int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.leo_ai_requests
    set status = p_status,
        answer = case when p_status = 'completed' then p_answer else null end,
        reason = case when p_status = 'failed' then left(p_reason, 30) else null end,
        updated_at = now()
    where user_id = p_user and request_id = p_request
      and status <> 'completed'
      and p_status in ('completed', 'failed')
      and (p_status = 'completed' or provider_attempts = p_attempt);
$$;

revoke all on function public.leo_ai_begin(uuid, text) from public, anon, authenticated;
revoke all on function public.leo_ai_finish(uuid, text, text, jsonb, text, int) from public, anon, authenticated;
grant execute on function public.leo_ai_begin(uuid, text) to service_role;
grant execute on function public.leo_ai_finish(uuid, text, text, jsonb, text, int) to service_role;

-- Límite por miembro/día: 100 (protección contra abuso, bots o errores; no
-- pretende limitar el estudio normal). Ya es el valor por defecto; esta línea
-- solo lo deja explícito. Para cambiarlo: update leo_ai_config set user_daily_limit = N;
update public.leo_ai_config set user_daily_limit = 100;
