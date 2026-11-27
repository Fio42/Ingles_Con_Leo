-- ============================================================
-- Riso · chat del tutor: piloto restringido. PENDIENTE, NO EJECUTADA.
-- Vive fuera de supabase/migrations a propósito. Para aplicarla (solo con autorización de Leo):
--   copiarla a supabase/migrations/<fecha>_riso_chat_piloto.sql y ejecutarla.
-- Probada localmente contra un Postgres embebido (PGlite) con el esquema real de leo_ai_*:
--   node tools/tests/riso-chat-sql.test.js
--
-- Qué hace (sin cambiar NINGÚN límite actual de Leo AI):
--   1. Interruptores nuevos, todos apagados o restrictivos por defecto:
--      chat_enabled = false, chat_pilot_only = true, allow_paid = false.
--   2. Lista de autorización del piloto (riso_pilot_testers), comprobada en el servidor.
--   3. Reserva ATÓMICA por pedido (riso_chat_reserve): sesión, membresía o correo confirmado, lista del piloto,
--      cuota por alumno, tope diario y total del piloto, presupuesto de neuronas propio de Riso y techo
--      compartido con Leo AI dentro de las 10.000 neuronas gratis de Cloudflare. Cuenta lo que está en curso
--      (neuronas estimadas antes de llamar) para que dos pedidos simultáneos no pasen el límite.
--   4. Idempotencia por request_id: un reintento con el mismo id no vuelve a descontar ni a llamar al modelo.
--   5. Cierre (riso_chat_finish): registra tokens y neuronas reales, libera la reserva si falló.
--   6. Alertas al 70 %, 90 % y 95 % de las neuronas gratis del día (Leo AI + Riso), una vez por día y umbral,
--      por el registro de errores que ya existe (log_app_error): 70 % aviso, 90 % error, 95 % crítico (correo inmediato).
--   7. Día y hora SIEMPRE del servidor, en UTC (Cloudflare renueva las neuronas gratis a las 00:00 UTC).
--   8. Funciones ejecutables solo por service_role (la Edge Function); nada para anon ni authenticated.
--   9. No guarda el texto de las preguntas. Las respuestas quedan como máximo 15 minutos, solo para reintentos.
-- ============================================================

alter table public.leo_ai_config
  add column if not exists chat_enabled boolean not null default false,
  add column if not exists chat_pilot_only boolean not null default true,
  add column if not exists chat_member_daily int not null default 30 check (chat_member_daily between 0 and 200),
  add column if not exists chat_free_daily int not null default 3 check (chat_free_daily between 0 and 20),
  add column if not exists chat_global_daily int not null default 100 check (chat_global_daily between 0 and 100000),
  add column if not exists chat_pilot_total int not null default 100 check (chat_pilot_total between 0 and 100000),
  add column if not exists riso_neuron_budget numeric not null default 1500 check (riso_neuron_budget between 0 and 10000),
  add column if not exists free_neurons_daily numeric not null default 10000 check (free_neurons_daily between 0 and 100000),
  add column if not exists riso_ceiling_pct int not null default 60 check (riso_ceiling_pct between 0 and 95),
  add column if not exists allow_paid boolean not null default false,
  add column if not exists paid_daily_neurons numeric not null default 0 check (paid_daily_neurons between 0 and 1000000),
  add column if not exists alert_pcts int[] not null default '{70,90,95}';

create table if not exists public.riso_pilot_testers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists public.riso_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

create table if not exists public.riso_chat_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null check (request_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  day date not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  est_neurons numeric not null default 0,
  answer jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
create index if not exists riso_chat_requests_day_idx on public.riso_chat_requests (day, status);

create table if not exists public.ai_budget_alerts (
  day date not null,
  pct int not null,
  neurons numeric not null,
  created_at timestamptz not null default now(),
  primary key (day, pct)
);

alter table public.riso_pilot_testers enable row level security;
alter table public.riso_chat_usage enable row level security;
alter table public.riso_chat_requests enable row level security;
alter table public.ai_budget_alerts enable row level security;
revoke all on public.riso_pilot_testers, public.riso_chat_usage, public.riso_chat_requests, public.ai_budget_alerts from anon, authenticated;

-- Neuronas reales del día (Leo AI + Riso): solo filas de proveedores, nunca contadores de reserva ni fallos.
create or replace function public.ai_neurons_today(p_day date)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(neurons), 0) from public.ai_usage_daily
  where day = p_day and provider not in ('reserved', 'trial_reserved', 'riso_reserved') and provider not like 'fail:%';
$$;

-- ------------------------------------------------------------
-- Reserva. Devuelve jsonb { status, day, answer? }.
-- status: ok | duplicate | in_progress | disabled | not_allowed | unverified | user_limit
--       | global_limit | pilot_total | riso_budget | shared_ceiling
-- ------------------------------------------------------------
create or replace function public.riso_chat_reserve(p_user uuid, p_request text, p_est_neurons numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.leo_ai_config%rowtype;
  v_day date := (now() at time zone 'utc')::date;
  v_member boolean;
  v_req public.riso_chat_requests%rowtype;
  v_mine int; v_cupo int; v_today int; v_total int;
  v_riso numeric; v_all numeric; v_inflight numeric; v_ceiling numeric;
  v_est numeric := greatest(coalesce(p_est_neurons, 0), 1);
begin
  if p_request is null or p_request !~ '^[A-Za-z0-9_-]{8,64}$' then return jsonb_build_object('status', 'bad_request'); end if;
  if v_est > 60 then return jsonb_build_object('status', 'too_long'); end if; -- ~3.000 tokens: nunca en una pregunta normal

  select * into cfg from public.leo_ai_config where id;
  if not found or not cfg.enabled or not cfg.chat_enabled then return jsonb_build_object('status', 'disabled'); end if;
  select coalesce(is_member, false) into v_member from public.profiles where id = p_user;
  if not found then return jsonb_build_object('status', 'not_allowed'); end if;
  if cfg.chat_pilot_only and not exists (select 1 from public.riso_pilot_testers t where t.user_id = p_user) then
    return jsonb_build_object('status', 'not_allowed');
  end if;
  if not v_member and not exists (select 1 from auth.users u where u.id = p_user and u.email_confirmed_at is not null) then
    return jsonb_build_object('status', 'unverified');
  end if;

  -- Candado propio de Riso: serializa las reservas del chat. Lo que se cuente desde aquí ve lo que confirmaron las demás.
  insert into public.ai_usage_daily (day, provider) values (v_day, 'riso_reserved') on conflict do nothing;
  perform 1 from public.ai_usage_daily where day = v_day and provider = 'riso_reserved' for update;

  -- Pedidos colgados más de 60 s: se liberan (no cuentan como gastados).
  update public.riso_chat_requests set status = 'failed', updated_at = now()
    where status = 'processing' and updated_at < now() - interval '60 seconds';
  delete from public.riso_chat_requests where updated_at < now() - interval '15 minutes'; -- sin texto viejo guardado

  -- Idempotencia
  select * into v_req from public.riso_chat_requests where user_id = p_user and request_id = p_request;
  if found then
    if v_req.status = 'completed' then return jsonb_build_object('status', 'duplicate', 'day', v_req.day, 'answer', v_req.answer); end if;
    if v_req.status = 'processing' then return jsonb_build_object('status', 'in_progress'); end if;
    delete from public.riso_chat_requests where user_id = p_user and request_id = p_request; -- falló antes: se puede reintentar
  end if;

  -- Cuota por alumno (completados + en curso)
  v_cupo := case when v_member then cfg.chat_member_daily else cfg.chat_free_daily end;
  select coalesce((select count from public.riso_chat_usage where user_id = p_user and day = v_day), 0)
       + (select count(*) from public.riso_chat_requests where user_id = p_user and day = v_day and status = 'processing')
    into v_mine;
  if v_mine >= v_cupo then return jsonb_build_object('status', 'user_limit'); end if;

  -- Tope diario y total del piloto
  select coalesce(sum(count), 0) into v_today from public.riso_chat_usage where day = v_day;
  select v_today + count(*) into v_today from public.riso_chat_requests where day = v_day and status = 'processing';
  if v_today >= cfg.chat_global_daily then return jsonb_build_object('status', 'global_limit'); end if;
  if cfg.chat_pilot_only then
    select coalesce(sum(count), 0) into v_total from public.riso_chat_usage;
    select v_total + count(*) into v_total from public.riso_chat_requests where status = 'processing';
    if v_total >= cfg.chat_pilot_total then return jsonb_build_object('status', 'pilot_total'); end if;
  end if;

  -- Presupuesto de neuronas: propio de Riso y techo compartido con Leo AI
  select coalesce(sum(est_neurons), 0) into v_inflight from public.riso_chat_requests where day = v_day and status = 'processing';
  select coalesce(sum(neurons), 0) into v_riso from public.ai_usage_daily where day = v_day and provider like '%:riso';
  if v_riso + v_inflight + v_est > cfg.riso_neuron_budget then return jsonb_build_object('status', 'riso_budget'); end if;
  v_all := public.ai_neurons_today(v_day);
  if cfg.allow_paid then
    v_ceiling := cfg.free_neurons_daily * cfg.riso_ceiling_pct / 100.0 + cfg.paid_daily_neurons;
  else
    v_ceiling := cfg.free_neurons_daily * cfg.riso_ceiling_pct / 100.0;  -- nunca por encima del gratis
  end if;
  if v_all + v_inflight + v_est > v_ceiling then return jsonb_build_object('status', 'shared_ceiling'); end if;

  insert into public.riso_chat_requests (user_id, request_id, day, est_neurons) values (p_user, p_request, v_day, v_est);
  update public.ai_usage_daily set requests = requests + 1 where day = v_day and provider = 'riso_reserved';
  return jsonb_build_object('status', 'ok', 'day', v_day);
end;
$$;

-- ------------------------------------------------------------
-- Cierre. p_ok = true: cuenta la pregunta, registra tokens y neuronas reales y guarda la respuesta 15 min.
-- p_ok = false: libera la reserva sin contar la pregunta. Si hubo tokens gastados igual se registran
-- (son neuronas reales de Cloudflare) aunque la respuesta no sirviera.
-- ------------------------------------------------------------
create or replace function public.riso_chat_finish(p_user uuid, p_request text, p_ok boolean, p_input int, p_output int, p_neurons numeric, p_answer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.riso_chat_requests%rowtype;
begin
  select * into v_req from public.riso_chat_requests where user_id = p_user and request_id = p_request for update;
  if not found or v_req.status <> 'processing' then return jsonb_build_object('status', 'not_found'); end if;
  if coalesce(p_neurons, 0) > 0 or coalesce(p_input, 0) > 0 then
    insert into public.ai_usage_daily (day, provider, requests, input_tokens, output_tokens, neurons)
      values (v_req.day, 'cloudflare:riso', 1, greatest(p_input, 0), greatest(p_output, 0), greatest(p_neurons, 0))
      on conflict (day, provider) do update set requests = public.ai_usage_daily.requests + 1,
        input_tokens = public.ai_usage_daily.input_tokens + excluded.input_tokens,
        output_tokens = public.ai_usage_daily.output_tokens + excluded.output_tokens,
        neurons = public.ai_usage_daily.neurons + excluded.neurons;
  end if;
  if p_ok then
    insert into public.riso_chat_usage (user_id, day, count) values (p_user, v_req.day, 1)
      on conflict (user_id, day) do update set count = public.riso_chat_usage.count + 1;
    update public.riso_chat_requests set status = 'completed', answer = p_answer, updated_at = now() where user_id = p_user and request_id = p_request;
  else
    update public.riso_chat_requests set status = 'failed', updated_at = now() where user_id = p_user and request_id = p_request;
  end if;
  return jsonb_build_object('status', 'ok');
end;
$$;

-- ------------------------------------------------------------
-- Alertas de presupuesto: se disparan con CUALQUIER consumo (Leo AI o Riso), una vez por día y umbral.
-- Usan el registro de errores existente; si algo falla, nunca bloquean el registro del consumo.
-- ------------------------------------------------------------
create or replace function public.ai_budget_alert_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.leo_ai_config%rowtype;
  v_all numeric; v_pct numeric; p int;
begin
  if new.provider in ('reserved', 'trial_reserved', 'riso_reserved') or new.provider like 'fail:%' then return new; end if;
  begin
    select * into cfg from public.leo_ai_config where id;
    if not found or cfg.free_neurons_daily <= 0 then return new; end if;
    v_all := public.ai_neurons_today(new.day);
    v_pct := v_all * 100.0 / cfg.free_neurons_daily;
    foreach p in array cfg.alert_pcts loop
      if v_pct >= p then
        insert into public.ai_budget_alerts (day, pct, neurons) values (new.day, p, v_all) on conflict do nothing;
        if found then
          perform public.log_app_error(
            'ai_budget_' || p || '_' || new.day, 'leo_ai', 'server',
            case when p >= 95 then 'critical' when p >= 90 then 'error' else 'warning' end,
            'ia_presupuesto',
            'Leo AI y Riso usaron ' || round(v_pct) || ' % de las neuronas gratis de hoy (' || round(v_all) || ' de ' || round(cfg.free_neurons_daily) || ').',
            null, null, 'budget_' || p, null, null, null, null);
        end if;
      end if;
    end loop;
  exception when others then
    return new; -- una alerta nunca debe impedir registrar el consumo
  end;
  return new;
end;
$$;

drop trigger if exists ai_budget_alert_trg on public.ai_usage_daily;
create trigger ai_budget_alert_trg after insert or update of neurons on public.ai_usage_daily
  for each row execute function public.ai_budget_alert_check();

revoke all on function public.ai_neurons_today(date) from public, anon, authenticated;
revoke all on function public.riso_chat_reserve(uuid, text, numeric) from public, anon, authenticated;
revoke all on function public.riso_chat_finish(uuid, text, boolean, int, int, numeric, jsonb) from public, anon, authenticated;
revoke all on function public.ai_budget_alert_check() from public, anon, authenticated;
grant execute on function public.ai_neurons_today(date) to service_role;
grant execute on function public.riso_chat_reserve(uuid, text, numeric) to service_role;
grant execute on function public.riso_chat_finish(uuid, text, boolean, int, int, numeric, jsonb) to service_role;

-- Para el piloto, después de aplicar y SOLO con autorización:
--   insert into public.riso_pilot_testers (user_id) values ('<id de la cuenta de pruebas de Leo>');
--   update public.leo_ai_config set chat_enabled = true;   -- sigue restringido por chat_pilot_only = true

-- ============ REVERTIR ============
-- update public.leo_ai_config set chat_enabled = false;                 -- apaga al instante, sin borrar nada
-- drop trigger if exists ai_budget_alert_trg on public.ai_usage_daily;
-- drop function if exists public.ai_budget_alert_check();
-- drop function if exists public.riso_chat_finish(uuid, text, boolean, int, int, numeric, jsonb);
-- drop function if exists public.riso_chat_reserve(uuid, text, numeric);
-- drop function if exists public.ai_neurons_today(date);
-- drop table if exists public.ai_budget_alerts, public.riso_chat_requests, public.riso_chat_usage, public.riso_pilot_testers;
-- alter table public.leo_ai_config drop column if exists chat_enabled, drop column if exists chat_pilot_only,
--   drop column if exists chat_member_daily, drop column if exists chat_free_daily, drop column if exists chat_global_daily,
--   drop column if exists chat_pilot_total, drop column if exists riso_neuron_budget, drop column if exists free_neurons_daily,
--   drop column if exists riso_ceiling_pct, drop column if exists allow_paid, drop column if exists paid_daily_neurons,
--   drop column if exists alert_pcts;
-- delete from public.ai_usage_daily where provider in ('riso_reserved', 'cloudflare:riso');
