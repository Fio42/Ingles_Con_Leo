-- Gracia de 72 horas por cobro fallido de Stripe (2026-10-20).
-- Aditiva: 4 columnas nuevas (todas NULL por defecto) y una tarea programada.
-- No toca is_member de nadie al aplicarse. APLICAR ESTE SQL ANTES de desplegar el
-- nuevo stripe-webhook (si se despliega primero, la funcion vuelve sola al
-- comportamiento anterior y avisa en el registro de errores, pero sin gracia).
--
--   payment_failed_at                 fecha del PRIMER fallo de renovacion en curso
--   payment_failed_email_sent_at      el aviso "tu pago no paso" ya salio (1 por episodio)
--   payment_failed_email_claimed_at   reserva corta para no mandar el aviso dos veces
--   stripe_event_at                   fecha del ultimo aviso de Stripe aplicado (orden de avisos)
-- Las escribe SOLO stripe-webhook con la llave de servicio. authenticated solo puede
-- actualizar las columnas que se le dieron una por una, asi que estas quedan fuera.
alter table public.profiles add column if not exists payment_failed_at timestamptz;
alter table public.profiles add column if not exists payment_failed_email_sent_at timestamptz;
alter table public.profiles add column if not exists payment_failed_email_claimed_at timestamptz;
alter table public.profiles add column if not exists stripe_event_at timestamptz;

-- Suspende a quien lleva mas de p_hours horas con el cobro fallido sin recuperarse.
-- Solo toca a miembros con payment_failed_at puesto (lo pone unicamente el flujo de
-- Stripe 'past_due'). NO borra payment_failed_at: asi la persona sigue excluida de las
-- campanas de "hazte miembro" mientras la suscripcion siga por cobrar. Si paga, el
-- webhook la reactiva y limpia la fecha; si Stripe cancela, el webhook tambien la limpia.
create or replace function public.suspend_expired_payment_grace(p_hours integer default 72)
returns integer
language plpgsql
set search_path = public
as $$
declare
  n integer;
begin
  update public.profiles
     set is_member = false
   where is_member = true
     and payment_failed_at is not null
     and payment_failed_at <= now() - make_interval(hours => p_hours)
     -- Solo cuentas cuyo unico medio de pago es Stripe: si la persona tambien tiene
     -- PayPal o Mercado Pago, esta tarea no decide por ellos (lo deciden esos webhooks).
     -- Si Stripe cancela la suscripcion despues, el webhook la suspende igual.
     and paypal_subscription_id is null
     and mp_preapproval_id is null;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke execute on function public.suspend_expired_payment_grace(integer) from public, anon, authenticated;

-- Cada 15 minutos (pg_cron ya esta activo en el proyecto).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'inglesconleo-payment-grace-sweep';
    perform cron.schedule(
      'inglesconleo-payment-grace-sweep',
      '*/15 * * * *',
      $cmd$ select public.suspend_expired_payment_grace(72); $cmd$
    );
  end if;
end $$;

-- REVERSION (solo si algo fallara):
--   select cron.unschedule('inglesconleo-payment-grace-sweep');
--   drop function public.suspend_expired_payment_grace(integer);
--   (las columnas pueden quedarse: estan vacias y nada mas las lee)
