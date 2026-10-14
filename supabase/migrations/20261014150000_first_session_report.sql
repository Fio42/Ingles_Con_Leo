-- Primera SESION completada por cohorte de registro (solo lectura). Complementa activation_followup_report, que mide el
-- primer EJERCICIO (free_first_exercise_at). Aqui "sesion" = una fila de progress_sessions.
-- Una fila por semana de registro, solo con cuentas que ya cumplieron cada ventana (mismo tiempo de seguimiento):
--   elegibles_24h / sesion_24h / pct_24h : cuentas con >= 24 h de vida y cuantas guardaron su primera sesion en sus primeras 24 h.
--   elegibles_7d  / sesion_7d  / pct_7d  : lo mismo con 7 dias.
-- AVISO: las sesiones de cuentas GRATIS solo se guardan desde 2026-10-07 (antes solo existia el contador). Las cohortes
-- anteriores a esa fecha estan subcontadas y NO se deben comparar con las nuevas; por eso hay una columna `desde_7oct`.
-- Los miembros de pago siempre guardaron sesiones. Aditiva: no toca pagos, auth ni progreso.
create or replace view public.first_session_report
with (security_invoker = true) as
with first_s as (
  select user_id, min(created_at) as first_at from public.progress_sessions group by 1
), base as (
  select p.id, p.created_at, f.first_at
  from public.profiles p left join first_s f on f.user_id = p.id
)
select date_trunc('week', created_at)::date as semana,
       (date_trunc('week', created_at) >= timestamptz '2026-10-05 00:00:00+00') as desde_7oct,
       count(*) as registros,
       count(*) filter (where created_at <= now() - interval '24 hours') as elegibles_24h,
       count(*) filter (where created_at <= now() - interval '24 hours' and first_at is not null and first_at <= created_at + interval '24 hours') as sesion_24h,
       round(100.0 * count(*) filter (where created_at <= now() - interval '24 hours' and first_at is not null and first_at <= created_at + interval '24 hours')
             / nullif(count(*) filter (where created_at <= now() - interval '24 hours'), 0)) as pct_24h,
       count(*) filter (where created_at <= now() - interval '7 days') as elegibles_7d,
       count(*) filter (where created_at <= now() - interval '7 days' and first_at is not null and first_at <= created_at + interval '7 days') as sesion_7d,
       round(100.0 * count(*) filter (where created_at <= now() - interval '7 days' and first_at is not null and first_at <= created_at + interval '7 days')
             / nullif(count(*) filter (where created_at <= now() - interval '7 days'), 0)) as pct_7d
from base
group by 1, 2
order by 1 desc;
revoke all on table public.first_session_report from anon, authenticated;
