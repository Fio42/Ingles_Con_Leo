-- PayPal anual: al cancelar, el acceso dura hasta la fecha ya pagada (2026-11-19).
-- Aditiva: 2 columnas nuevas (NULL por defecto) y una tarea programada. No cambia is_member de nadie al aplicarse.
-- APLICAR ESTE SQL ANTES de desplegar el nuevo paypal-webhook. Si no estuviera aplicado, el webhook vuelve a la regla
-- de siempre (quita el acceso al cancelar) y lo avisa en el registro de errores.
--   paypal_access_until   hasta cuando esta pagado el anual cancelado (el next_renewal_at guardado al confirmar el cobro)
--   paypal_access_sub     id de la suscripcion anual a la que pertenece esa fecha
-- Solo las escribe paypal-webhook con la llave de servicio (authenticated no tiene permiso sobre columnas nuevas).
alter table public.profiles add column if not exists paypal_access_until timestamptz;
alter table public.profiles add column if not exists paypal_access_sub text;

-- Quita el acceso a quien cancelo el anual y ya paso su fecha pagada. Solo si la cuenta sigue ligada a ESA suscripcion:
-- si despues contrato otra (por ejemplo una mensual), no se le toca. Los rastros viejos se limpian.
create or replace function public.suspend_expired_paypal_annual()
returns integer
language plpgsql
set search_path = public
as $$
declare
  n integer;
begin
  update public.profiles
     set is_member = false, paypal_access_until = null, paypal_access_sub = null
   where is_member = true
     and paypal_access_until is not null
     and paypal_access_until <= now()
     and paypal_access_sub is not null
     and paypal_access_sub = paypal_subscription_id;
  get diagnostics n = row_count;
  update public.profiles
     set paypal_access_until = null, paypal_access_sub = null
   where paypal_access_until is not null
     and paypal_access_until <= now()
     and paypal_access_sub is distinct from paypal_subscription_id;
  return n;
end;
$$;
revoke execute on function public.suspend_expired_paypal_annual() from public, anon, authenticated;

-- Cada 15 minutos (pg_cron ya esta activo en el proyecto).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'inglesconleo-paypal-annual-expiry';
    perform cron.schedule('inglesconleo-paypal-annual-expiry', '*/15 * * * *', $cmd$ select public.suspend_expired_paypal_annual(); $cmd$);
  end if;
end $$;

-- REVERSION (solo si algo fallara):
--   select cron.unschedule('inglesconleo-paypal-annual-expiry');
--   drop function public.suspend_expired_paypal_annual();
--   (las columnas pueden quedarse)
