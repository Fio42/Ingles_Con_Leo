-- PROPUESTA, NO EJECUTADA. Vive fuera de supabase/migrations a propósito para que nadie la aplique por error.
-- Para aplicarla: revisarla, copiarla a supabase/migrations/<fecha>_riso_chat.sql y ejecutarla con autorización de Leo.
-- Reversión: ver el bloque "REVERTIR" al final.
--
-- Qué hace: agrega el modo "chat" (Pregúntale a Riso) a Leo AI SIN tocar el modo "explain" que ya funciona.
--  - Interruptor propio apagado por defecto (chat_enabled = false): publicar el código no enciende nada.
--  - Cuota diaria SEPARADA de la de "explain": chatear no le quita explicaciones de ejercicios al alumno.
--  - Usa los mismos topes globales (global_daily_limit y neuron_budget) que ya protegen el gasto.
--  - No guarda el texto de las preguntas. Solo conteos por día.

alter table public.leo_ai_config
  add column if not exists chat_enabled boolean not null default false,
  add column if not exists chat_member_daily int not null default 30 check (chat_member_daily between 0 and 200),
  add column if not exists chat_free_daily int not null default 3 check (chat_free_daily between 0 and 20),
  add column if not exists chat_global_daily int not null default 1000 check (chat_global_daily between 0 and 1000000);

create table if not exists public.riso_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.riso_chat_usage enable row level security;
-- Sin políticas para anon/authenticated: solo la Edge Function (service role) lee y escribe.
revoke all on public.riso_chat_usage from anon, authenticated;

-- Reserva una pregunta abierta. Devuelve 'ok' o el motivo del rechazo.
create or replace function public.riso_chat_reserve(p_user uuid, p_day date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.leo_ai_config%rowtype;
  v_member boolean;
  reserved int;
  chat_total int;
  used_neurons numeric;
  mine int;
  cupo int;
begin
  select * into cfg from public.leo_ai_config where id;
  if not found or not cfg.enabled or not cfg.chat_enabled then return 'disabled'; end if;
  select coalesce(is_member, false) into v_member from public.profiles where id = p_user;
  if not found then return 'not_allowed'; end if;
  if not v_member and not exists (select 1 from auth.users u where u.id = p_user and u.email_confirmed_at is not null) then
    return 'unverified';
  end if;

  -- mismo candado global que leo_ai_reserve
  insert into public.ai_usage_daily (day, provider) values (p_day, 'reserved') on conflict do nothing;
  select requests into reserved from public.ai_usage_daily where day = p_day and provider = 'reserved' for update;
  if reserved >= cfg.global_daily_limit then return 'global_limit'; end if;
  select coalesce(sum(neurons), 0) into used_neurons from public.ai_usage_daily where day = p_day and provider not in ('reserved', 'chat_reserved', 'trial_reserved');
  if used_neurons >= cfg.neuron_budget then return 'neuron_budget'; end if;

  insert into public.ai_usage_daily (day, provider) values (p_day, 'chat_reserved') on conflict do nothing;
  select requests into chat_total from public.ai_usage_daily where day = p_day and provider = 'chat_reserved';
  if chat_total >= cfg.chat_global_daily then return 'chat_global_limit'; end if;

  cupo := case when v_member then cfg.chat_member_daily else cfg.chat_free_daily end;
  select count into mine from public.riso_chat_usage where user_id = p_user and day = p_day;
  if coalesce(mine, 0) >= cupo then return 'chat_user_limit'; end if;

  insert into public.riso_chat_usage (user_id, day, count) values (p_user, p_day, 1)
    on conflict (user_id, day) do update set count = public.riso_chat_usage.count + 1;
  update public.ai_usage_daily set requests = requests + 1 where day = p_day and provider in ('reserved', 'chat_reserved');
  return 'ok';
end;
$$;
revoke all on function public.riso_chat_reserve(uuid, date) from public, anon, authenticated;

-- Limpieza: conteos de más de 60 días no sirven para nada.
-- (Programar con el cron que ya limpia leo_ai_requests, o ejecutar a mano.)
-- delete from public.riso_chat_usage where day < current_date - 60;

-- ============ REVERTIR ============
-- update public.leo_ai_config set chat_enabled = false;          -- apaga al instante sin borrar nada
-- drop function if exists public.riso_chat_reserve(uuid, date);
-- drop table if exists public.riso_chat_usage;
-- alter table public.leo_ai_config drop column if exists chat_enabled, drop column if exists chat_member_daily,
--   drop column if exists chat_free_daily, drop column if exists chat_global_daily;
