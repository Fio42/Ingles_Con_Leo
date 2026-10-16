-- ============================================================
-- Prueba gratis de Leo AI para cuentas gratis (no miembros).
-- 5 explicaciones de bienvenida POR CUENTA (no por dia), solo modo "explain"
-- y solo cuando el alumno fallo el ejercicio. Writing y los analisis
-- (insight / diagnosis) siguen siendo solo de miembros. Invitados: nada.
--
-- Todo el control esta en el SERVIDOR (esta base + la Edge Function leo-ai):
--   * Los creditos viven en leo_ai_trial (solo cantidades). Un credito se
--     gasta cuando la explicacion se ENTREGA bien (leo_ai_finish), no al
--     reservar: un timeout o una mala salida del modelo no le quita nada.
--   * Contra el abuso (varias pestañas a la vez): se cuentan los pedidos en
--     curso de la misma cuenta ANTES de reservar, dentro del mismo candado
--     global que ya usa leo_ai_reserve. Nunca se entregan mas de los creditos.
--   * Presupuesto aparte: la prueba tiene su propia bolsa diaria (pedidos y
--     neurons) dentro de los topes globales, asi que NUNCA puede dejar sin
--     Leo AI a un miembro de pago. Con los valores por defecto: 400 pedidos y
--     2.500 neurons de los 8.000 del presupuesto global.
--   * Cuenta con correo confirmado (auth.users.email_confirmed_at). Hoy las 99
--     cuentas lo tienen; con autoconfirm tambien se rellena solo.
--   * INTERRUPTOR: leo_ai_config.trial_enabled (por defecto FALSE = no cambia
--     nada para nadie hasta encenderlo).
--       Encender:  update leo_ai_config set trial_enabled = true;
--       Apagar:    update leo_ai_config set trial_enabled = false;
--       Ajustar:   update leo_ai_config set trial_credits = 5, trial_daily_pool = 400, trial_neuron_budget = 2500;
--   * Medicion: select public.leo_ai_trial_report();   (ver mas abajo)
--
-- Reemplaza (create or replace, misma firma) leo_ai_reserve / leo_ai_begin /
-- leo_ai_finish definidas en supabase_functions/leo-ai.sql. Para miembros el
-- comportamiento es exactamente el de antes.
-- ============================================================

alter table public.leo_ai_config
  add column if not exists trial_enabled boolean not null default false,
  add column if not exists trial_credits int not null default 5 check (trial_credits between 0 and 20),
  add column if not exists trial_daily_pool int not null default 400 check (trial_daily_pool between 0 and 5000),
  add column if not exists trial_neuron_budget numeric not null default 2500 check (trial_neuron_budget between 0 and 10000);

alter table public.leo_ai_requests add column if not exists trial boolean not null default false;

-- Cuanto uso cada cuenta su prueba. Solo cantidades y fechas.
create table if not exists public.leo_ai_trial (
  user_id uuid primary key references auth.users(id) on delete cascade,
  used int not null default 0,
  first_used_at timestamptz,
  last_used_at timestamptz,
  exhausted_at timestamptz
);
alter table public.leo_ai_trial enable row level security;
revoke all on public.leo_ai_trial from anon, authenticated;

-- ------------------------------------------------------------
-- Reserva (tope global + miembro o prueba). Devuelve:
--   'ok' | 'disabled' | 'not_allowed' | 'user_limit' | 'global_limit' | 'neuron_budget'
--   y solo para la prueba: 'trial_disabled' | 'trial_unverified' | 'trial_exhausted'
--   | 'trial_busy' | 'trial_pool'
-- ------------------------------------------------------------
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
  v_member boolean;
  t_used int;
  t_inflight int;
  t_pool int;
  t_neurons numeric;
begin
  select * into cfg from public.leo_ai_config where id;
  if not found or not cfg.enabled then return 'disabled'; end if;
  select coalesce(is_member, false) into v_member from public.profiles where id = p_user;
  if not found then return 'not_allowed'; end if;
  if not cfg.public and not exists (select 1 from public.leo_ai_testers t where t.user_id = p_user) then
    return 'not_allowed';
  end if;
  if not v_member then
    if not cfg.trial_enabled then return 'trial_disabled'; end if;
    if not exists (select 1 from auth.users u where u.id = p_user and u.email_confirmed_at is not null) then
      return 'trial_unverified';
    end if;
  end if;

  -- Candado global (serializa todas las reservas): lo que se cuente desde aqui ya ve lo que
  -- confirmaron las demas.
  insert into public.ai_usage_daily (day, provider) values (p_day, 'reserved') on conflict do nothing;
  select requests into reserved from public.ai_usage_daily where day = p_day and provider = 'reserved' for update;

  if not v_member then
    -- Creditos de la cuenta: gastados + pedidos en curso (incluido este, que begin ya inserto).
    t_used := coalesce((select used from public.leo_ai_trial where user_id = p_user), 0);
    if t_used >= cfg.trial_credits then return 'trial_exhausted'; end if;
    select count(*) into t_inflight from public.leo_ai_requests
      where user_id = p_user and trial and status = 'processing' and updated_at > now() - interval '45 seconds';
    if t_used + t_inflight > cfg.trial_credits then return 'trial_busy'; end if;
  end if;

  if reserved >= cfg.global_daily_limit then return 'global_limit'; end if;
  select coalesce(sum(neurons), 0) into used_neurons from public.ai_usage_daily where day = p_day and provider <> 'reserved';
  if used_neurons >= cfg.neuron_budget then return 'neuron_budget'; end if;

  if v_member then
    select count into user_count from public.ai_usage where user_id = p_user and day = p_day;
    if coalesce(user_count, 0) >= cfg.user_daily_limit then return 'user_limit'; end if;
    insert into public.ai_usage (user_id, day, count) values (p_user, p_day, 1)
      on conflict (user_id, day) do update set count = public.ai_usage.count + 1;
  else
    -- Bolsa diaria propia de la prueba (pedidos y neurons), siempre dentro de los topes globales.
    insert into public.ai_usage_daily (day, provider) values (p_day, 'trial_reserved') on conflict do nothing;
    select requests into t_pool from public.ai_usage_daily where day = p_day and provider = 'trial_reserved';
    if t_pool >= cfg.trial_daily_pool then return 'trial_pool'; end if;
    select coalesce(neurons, 0) into t_neurons from public.ai_usage_daily where day = p_day and provider = 'cloudflare:trial';
    if coalesce(t_neurons, 0) >= cfg.trial_neuron_budget then return 'trial_pool'; end if;
    update public.ai_usage_daily set requests = requests + 1 where day = p_day and provider = 'trial_reserved';
  end if;

  update public.ai_usage_daily set requests = requests + 1 where day = p_day and provider = 'reserved';
  return 'ok';
end;
$$;

-- ------------------------------------------------------------
-- Idempotencia por request_id (igual que antes) + marca de prueba.
-- Devuelve jsonb { status, day, trial, attempt?, answer?, reason? }.
-- ------------------------------------------------------------
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
  v_member boolean;
  v_trial boolean;
begin
  delete from public.leo_ai_requests where created_at < now() - interval '24 hours';

  select coalesce(is_member, false) into v_member from public.profiles where id = p_user;
  if not found then return jsonb_build_object('status', 'not_allowed', 'day', v_day, 'trial', false); end if;
  v_trial := not v_member;

  insert into public.leo_ai_requests (user_id, request_id, day, status, provider_attempts, trial)
    values (p_user, p_request, v_day, 'processing', 0, v_trial)
    on conflict (user_id, request_id) do nothing;
  get diagnostics claimed = row_count;

  if claimed = 1 then
    gate := public.leo_ai_reserve(p_user, v_day);
    if gate <> 'ok' then
      delete from public.leo_ai_requests where user_id = p_user and request_id = p_request;
      return jsonb_build_object('status', gate, 'day', v_day, 'trial', v_trial);
    end if;
    update public.leo_ai_requests set provider_attempts = 1, updated_at = now()
      where user_id = p_user and request_id = p_request;
    return jsonb_build_object('status', 'go', 'attempt', 1, 'day', v_day, 'trial', v_trial);
  end if;

  select * into r from public.leo_ai_requests where user_id = p_user and request_id = p_request for update;
  if not found then
    return jsonb_build_object('status', 'processing', 'day', v_day, 'trial', v_trial);
  end if;

  if r.status = 'completed' then
    return jsonb_build_object('status', 'completed', 'answer', r.answer, 'day', r.day, 'trial', r.trial);
  end if;

  if r.status = 'processing' and r.updated_at > now() - interval '45 seconds' then
    return jsonb_build_object('status', 'processing', 'day', r.day, 'trial', r.trial);
  end if;

  if r.provider_attempts >= 2 then
    if r.status = 'processing' then
      update public.leo_ai_requests set status = 'failed', reason = coalesce(reason, 'error'), updated_at = now()
        where user_id = p_user and request_id = p_request;
    end if;
    return jsonb_build_object('status', 'failed_final', 'reason', coalesce(r.reason, 'error'), 'day', r.day, 'trial', r.trial);
  end if;

  update public.leo_ai_requests set status = 'processing', provider_attempts = provider_attempts + 1, updated_at = now()
    where user_id = p_user and request_id = p_request;
  return jsonb_build_object('status', 'go', 'attempt', r.provider_attempts + 1, 'day', r.day, 'trial', r.trial);
end;
$$;

-- ------------------------------------------------------------
-- Cierra un intento. Si fue una explicacion de PRUEBA entregada ('completed'), gasta
-- un credito (una sola vez por request_id: un 'completed' nunca se sobrescribe).
-- ------------------------------------------------------------
create or replace function public.leo_ai_finish(p_user uuid, p_request text, p_status text, p_answer jsonb, p_reason text, p_attempt int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial boolean;
  v_credits int;
  v_used int;
begin
  update public.leo_ai_requests
    set status = p_status,
        answer = case when p_status = 'completed' then p_answer else null end,
        reason = case when p_status = 'failed' then left(p_reason, 30) else null end,
        updated_at = now()
    where user_id = p_user and request_id = p_request
      and status <> 'completed'
      and p_status in ('completed', 'failed')
      and (p_status = 'completed' or provider_attempts = p_attempt)
    returning trial into v_trial;

  if found and p_status = 'completed' and v_trial then
    select trial_credits into v_credits from public.leo_ai_config where id;
    insert into public.leo_ai_trial (user_id, used, first_used_at, last_used_at)
      values (p_user, 1, now(), now())
      on conflict (user_id) do update set used = public.leo_ai_trial.used + 1, last_used_at = now()
      returning used into v_used;
    if v_used >= coalesce(v_credits, 5) then
      update public.leo_ai_trial set exhausted_at = coalesce(exhausted_at, now()) where user_id = p_user;
    end if;
  end if;
end;
$$;

-- ------------------------------------------------------------
-- Estado de la prueba de una cuenta (sin llamar a la IA): lo que la pagina muestra
-- como "Te quedan N". enabled=false oculta el boton en la pagina.
-- ------------------------------------------------------------
create or replace function public.leo_ai_trial_status(p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.leo_ai_config%rowtype;
  v_member boolean;
  v_used int;
  v_ok boolean;
begin
  select * into cfg from public.leo_ai_config where id;
  select coalesce(is_member, false) into v_member from public.profiles where id = p_user;
  if not found or cfg.id is null then return jsonb_build_object('enabled', false, 'member', false); end if;
  v_used := coalesce((select used from public.leo_ai_trial where user_id = p_user), 0);
  v_ok := cfg.enabled and cfg.trial_enabled and not v_member
    and (cfg.public or exists (select 1 from public.leo_ai_testers t where t.user_id = p_user))
    and exists (select 1 from auth.users u where u.id = p_user and u.email_confirmed_at is not null);
  return jsonb_build_object(
    'enabled', v_ok,
    'member', v_member,
    'credits', cfg.trial_credits,
    'used', least(v_used, cfg.trial_credits),
    'remaining', greatest(cfg.trial_credits - v_used, 0)
  );
end;
$$;

-- ------------------------------------------------------------
-- Medicion de la prueba (solo la service_role y tu SQL Editor). Cuenta personas, nunca textos.
--   select public.leo_ai_trial_report();
-- Conversion = cuentas que pagaron (profiles.is_member con member_since) dentro de los 7 dias
-- siguientes a su primer uso, o a haber gastado sus 5. Los "_madurados" son las cuentas con
-- mas de 7 dias desde ese hecho: son el denominador justo (las demas aun estan en ventana).
-- ------------------------------------------------------------
create or replace function public.leo_ai_trial_report()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with t as (
    select x.user_id, x.used, x.first_used_at, x.exhausted_at, p.is_member, p.member_since
    from public.leo_ai_trial x join public.profiles p on p.id = x.user_id
  )
  select jsonb_build_object(
    'cuentas_que_probaron', count(*),
    'gastaron_los_5', count(*) filter (where exhausted_at is not null),
    'promedio_usadas', round(coalesce(avg(used), 0), 2),
    'hoy_son_miembros', count(*) filter (where is_member),
    'pagaron_en_7d_desde_primer_uso', count(*) filter (where is_member and member_since >= first_used_at and member_since < first_used_at + interval '7 days'),
    'pagaron_en_7d_desde_agotar', count(*) filter (where is_member and exhausted_at is not null and member_since >= exhausted_at and member_since < exhausted_at + interval '7 days'),
    'primer_uso_madurados_7d', count(*) filter (where first_used_at < now() - interval '7 days'),
    'agotaron_madurados_7d', count(*) filter (where exhausted_at < now() - interval '7 days'),
    'pedidos_prueba_hoy', coalesce((select requests from public.ai_usage_daily where day = (now() at time zone 'utc')::date and provider = 'trial_reserved'), 0),
    'neurons_prueba_hoy', coalesce((select round(neurons::numeric, 1) from public.ai_usage_daily where day = (now() at time zone 'utc')::date and provider = 'cloudflare:trial'), 0),
    'intentos_con_prueba_agotada_hoy', coalesce((select requests from public.ai_usage_daily where day = (now() at time zone 'utc')::date and provider = 'fail:trial_exhausted'), 0)
  ) from t;
$$;

revoke all on function public.leo_ai_trial_status(uuid) from public, anon, authenticated;
revoke all on function public.leo_ai_trial_report() from public, anon, authenticated;
grant execute on function public.leo_ai_trial_status(uuid) to service_role;
grant execute on function public.leo_ai_trial_report() to service_role;
-- Las tres funciones reemplazadas conservan sus permisos (solo service_role); se repite por claridad.
revoke all on function public.leo_ai_reserve(uuid, date) from public, anon, authenticated;
revoke all on function public.leo_ai_begin(uuid, text) from public, anon, authenticated;
revoke all on function public.leo_ai_finish(uuid, text, text, jsonb, text, int) from public, anon, authenticated;
grant execute on function public.leo_ai_reserve(uuid, date) to service_role;
grant execute on function public.leo_ai_begin(uuid, text) to service_role;
grant execute on function public.leo_ai_finish(uuid, text, text, jsonb, text, int) to service_role;
