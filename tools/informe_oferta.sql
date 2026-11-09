-- Comparacion ANTES / DESPUES de la invitacion tras la primera sesion gratis. SOLO LECTURA (un SELECT, resultado JSON). Supabase -> SQL Editor.
-- Cambia "corte" por la fecha/hora (UTC) en que se publico el cambio. Cohortes por fecha de REGISTRO de cuentas gratuitas nuevas.
-- LIMITACIONES: no es una prueba causal (no hay grupo de control simultaneo; cambian la temporada, el trafico y otros cambios del sitio);
-- las cohortes son pequenas, asi que una diferencia de unos pocos pagos entra en el ruido; la cohorte "despues" necesita al menos 7 dias
-- para poder haber pagado "en 7 dias". Pago CONFIRMADO = id de Stripe o PayPal (lo escribe el webhook), no el evento del navegador.
with p as (
  select timestamptz '2026-11-09 17:08:16+00' as corte, now() as ahora,
         array['f8c0bf1f-57c9-462a-addf-17559aeab69f','8a1dea64-bbdd-4cd1-ab1d-8bb698061fbb']::uuid[] as prueba
),
c as (
  select x.id, x.created_at, (x.created_at >= p.corte) as despues, x.free_first_exercise_at, x.free_daily_limit_reached_at, x.checkout_started_at, x.member_since,
         (x.stripe_customer_id is not null or x.paypal_subscription_id is not null) as pago_confirmado,
         (select count(*) from public.progress_sessions ps where ps.user_id = x.id) as sesiones, p.ahora, p.corte
  from public.profiles x, p
  where x.id <> all(p.prueba) and x.created_at >= p.corte - interval '28 days'
),
f as (
  select c.*, (free_first_exercise_at is not null or sesiones > 0) as practico,
    (checkout_started_at is not null) as checkout,
    (pago_confirmado and member_since is not null and member_since <= created_at + interval '7 days') as pago_7d,
    (pago_confirmado and member_since is not null and member_since::date = created_at::date) as pago_mismo_dia,
    (created_at + interval '7 days' <= ahora) as ventana_7d_completa
  from c
)
select jsonb_build_object(
  'corte', (select corte from p),
  'cohortes', (select jsonb_agg(r order by r->>'cohorte') from (
    select jsonb_build_object('cohorte', case when despues then 'despues' else 'antes' end,
       'registros', count(*), 'practicaron', count(*) filter (where practico), 'llegaron_al_limite', count(*) filter (where free_daily_limit_reached_at is not null),
       'iniciaron_checkout', count(*) filter (where checkout), 'pagos_confirmados_mismo_dia', count(*) filter (where pago_mismo_dia),
       'registros_con_7_dias_cumplidos', count(*) filter (where ventana_7d_completa),
       'pagos_confirmados_en_7_dias_entre_esos', count(*) filter (where ventana_7d_completa and pago_7d),
       'dias_de_la_cohorte', round(extract(epoch from (max(created_at) - min(created_at)))/86400.0, 1)) as r
    from f group by despues) t)
) as informe;
