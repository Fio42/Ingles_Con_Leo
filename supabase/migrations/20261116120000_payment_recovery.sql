-- Recuperacion de cobros fallidos de Stripe (2026-11-16).
-- Aditiva: una tabla nueva, 2 funciones y una tarea programada. NO toca is_member de nadie.
--
-- Que hace: cuando una renovacion de Stripe falla por primera vez, stripe-webhook abre un
-- "episodio" aqui (payment_recovery_open). La funcion payment-recovery-emails (cada hora) lee
-- los episodios abiertos y manda, una sola vez cada uno:
--   reminder   ~48 h despues del primer fallo, si todavia tiene acceso (le quedan menos de 24 h)
--   suspended  cuando ya se le quito el acceso por falta de pago
--   winback1   ~30 dias despues del primer fallo, si sigue sin ser miembro
--   winback2   ~60 dias despues, si sigue sin ser miembro (ultimo correo)
-- Si la persona vuelve a pagar (stripe-webhook) o aparece como miembro, el episodio se cierra.
--
-- Por que una tabla aparte y no profiles.payment_failed_at: ese campo se borra cuando Stripe
-- cancela la suscripcion, y justo ahi empieza la parte de "volver". Esta tabla no se borra sola.
-- Solo la escribe la llave de servicio (RLS activa y sin politicas: anon y authenticated no ven nada).

create table if not exists public.payment_recovery (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  started_at         timestamptz not null,          -- primer fallo del episodio
  claimed_at         timestamptz,                   -- reserva corta (15 min) para no mandar dos veces
  reminder_at        timestamptz, reminder_result  text,   -- result: 'sent' | 'skipped'
  suspended_at       timestamptz, suspended_result text,
  winback1_at        timestamptz, winback1_result  text,
  winback2_at        timestamptz, winback2_result  text,
  closed_at          timestamptz,
  closed_reason      text,                          -- 'paid' | 'member_again'
  created_at         timestamptz not null default now()
);
alter table public.payment_recovery enable row level security;
revoke all on public.payment_recovery from public, anon, authenticated;
grant all on public.payment_recovery to service_role;
create index if not exists payment_recovery_open_idx on public.payment_recovery (started_at) where closed_at is null;

-- Abre el episodio (o lo reabre si el anterior ya estaba cerrado: un fallo nuevo tiene sus propios correos).
create or replace function public.payment_recovery_open(p_customer text, p_started timestamptz)
returns integer
language plpgsql
set search_path = public
as $$
declare n integer;
begin
  insert into public.payment_recovery (user_id, stripe_customer_id, started_at)
  select id, stripe_customer_id, p_started from public.profiles where stripe_customer_id = p_customer
  on conflict (user_id) do update
    set started_at = excluded.started_at, stripe_customer_id = excluded.stripe_customer_id,
        claimed_at = null, closed_at = null, closed_reason = null,
        reminder_at = null, reminder_result = null, suspended_at = null, suspended_result = null,
        winback1_at = null, winback1_result = null, winback2_at = null, winback2_result = null
    where public.payment_recovery.closed_at is not null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Cierra el episodio abierto de ese cliente de Stripe (volvio a pagar).
create or replace function public.payment_recovery_close(p_customer text, p_reason text default 'paid')
returns integer
language plpgsql
set search_path = public
as $$
declare n integer;
begin
  update public.payment_recovery set closed_at = now(), closed_reason = p_reason
   where stripe_customer_id = p_customer and closed_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.payment_recovery_open(text, timestamptz) from public, anon, authenticated;
revoke execute on function public.payment_recovery_close(text, text) from public, anon, authenticated;
grant execute on function public.payment_recovery_open(text, timestamptz) to service_role;
grant execute on function public.payment_recovery_close(text, text) to service_role;

-- Episodios que ya estan en curso al aplicar esto (p. ej. un cobro que fallo antes de desplegar):
-- se abren con su fecha real de primer fallo. Solo cuentas con cliente de Stripe y fallo registrado.
insert into public.payment_recovery (user_id, stripe_customer_id, started_at)
select id, stripe_customer_id, payment_failed_at from public.profiles
 where payment_failed_at is not null and stripe_customer_id is not null
on conflict (user_id) do nothing;

-- NO se programa la tarea aqui a proposito: primero se despliega la funcion y se prueba con
-- {"dry_run": true} (no envia ni escribe nada). Cuando todo se vea bien, se ejecuta esto:
--
-- select cron.schedule('inglesconleo-payment-recovery', '7 * * * *', $cmd$
--   select net.http_post(
--     url := 'https://iviksyhzhiygkuaojply.supabase.co/functions/v1/payment-recovery-emails',
--     headers := jsonb_build_object('Content-Type', 'application/json',
--       'x-internal-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_functions_secret')),
--     body := '{}'::jsonb, timeout_milliseconds := 60000);
-- $cmd$);
--
-- REVERSION (solo si algo fallara):
--   select cron.unschedule('inglesconleo-payment-recovery');
--   drop function public.payment_recovery_open(text, timestamptz);
--   drop function public.payment_recovery_close(text, text);
--   drop table public.payment_recovery;
