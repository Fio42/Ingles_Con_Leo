-- Comparacion justa de activacion (solo lectura): mismo tiempo de seguimiento para todos los grupos.
-- Una fila por semana de registro, con dos medidas que solo cuentan cuentas que ya cumplieron su ventana:
--   elegibles_24h / primer_ejercicio_24h / pct_24h : cuentas con al menos 24 h de vida y cuantas hicieron su primer
--       ejercicio dentro de sus primeras 24 h (free_first_exercise_at o primera fila de progress_sessions).
--   elegibles_7d / pagaron_7d / pct_pago_7d : cuentas con al menos 7 dias de vida y cuantas pagaron (member_since)
--       dentro de sus primeros 7 dias.
-- grupo: 'antes' = registradas antes del cambio del boton "Practicar gratis ahora" (2026-10-13 18:21 UTC), 'despues' = desde ahi.
-- Una semana que contiene el corte aparece dos veces (antes y despues). Pocas cuentas por grupo: no atribuir mejoras al boton sin mas semanas.
-- El uso del boton NO esta en la base (son eventos de Google Analytics: welcome_free_practice_clicked y preview_free_practice_clicked).
create or replace view public.activation_followup_report
with (security_invoker = true) as
with base as (
  select p.id, p.created_at, p.is_member, p.member_since,
         least(p.free_first_exercise_at, (select min(s.created_at) from public.progress_sessions s where s.user_id = p.id)) as first_ex_at
  from public.profiles p
), marked as (
  select *, case when created_at < timestamptz '2026-10-13 18:21:00+00' then 'antes' else 'despues' end as grupo
  from base
)
select date_trunc('week', created_at)::date as semana,
       grupo,
       count(*) as registros,
       count(*) filter (where created_at <= now() - interval '24 hours') as elegibles_24h,
       count(*) filter (where created_at <= now() - interval '24 hours' and first_ex_at is not null and first_ex_at <= created_at + interval '24 hours') as primer_ejercicio_24h,
       round(100.0 * count(*) filter (where created_at <= now() - interval '24 hours' and first_ex_at is not null and first_ex_at <= created_at + interval '24 hours')
             / nullif(count(*) filter (where created_at <= now() - interval '24 hours'), 0)) as pct_24h,
       count(*) filter (where created_at <= now() - interval '7 days') as elegibles_7d,
       count(*) filter (where created_at <= now() - interval '7 days' and is_member and member_since is not null and member_since <= created_at + interval '7 days') as pagaron_7d,
       round(100.0 * count(*) filter (where created_at <= now() - interval '7 days' and is_member and member_since is not null and member_since <= created_at + interval '7 days')
             / nullif(count(*) filter (where created_at <= now() - interval '7 days'), 0)) as pct_pago_7d
from marked
group by 1, 2
order by 1 desc, 2;
revoke all on table public.activation_followup_report from anon, authenticated;
