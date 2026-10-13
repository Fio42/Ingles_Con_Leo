-- Reporte semanal de activacion (solo lectura). Una fila por semana (lunes) con:
--   signups            cuentas creadas esa semana
--   practicaron        de esas cuentas, cuantas hicieron al menos un ejercicio alguna vez
--   practica_10min     de esas, cuantas lo hicieron en los primeros 10 minutos
--   nunca_practicaron  signups - practicaron
--   llegaron_limite    cuentas que tocaron el limite diario gratis
--   pagaron_cohorte    cuentas creadas esa semana que hoy son miembros
--   miembros_nuevos    pagos NUEVOS esa semana (por member_since), sin importar cuando se registraron
-- "Practico" = free_first_exercise_at, last_practice_at o alguna fila en progress_sessions.
-- Visitas: no existen en la base (viven en Google Analytics / Search Console); se anotan aparte.
-- Solo la lee el panel de administracion / la llave de servicio. Aditiva: no toca pagos, auth ni progreso.
create or replace view public.weekly_activation_report
with (security_invoker = true) as
with base as (
  select p.id, p.created_at, p.is_member, p.member_since, p.free_daily_limit_reached_at,
         (p.free_first_exercise_at is not null or p.last_practice_at is not null
          or exists (select 1 from public.progress_sessions s where s.user_id = p.id)) as practico,
         (p.free_first_exercise_at is not null and p.free_first_exercise_at <= p.created_at + interval '10 minutes') as practico_10min
  from public.profiles p
), cohort as (
  select date_trunc('week', created_at)::date as semana,
         count(*) as signups,
         count(*) filter (where practico) as practicaron,
         count(*) filter (where practico_10min) as practica_10min,
         count(*) filter (where not practico) as nunca_practicaron,
         count(*) filter (where free_daily_limit_reached_at is not null) as llegaron_limite,
         count(*) filter (where is_member) as pagaron_cohorte
  from base group by 1
), pagos as (
  select date_trunc('week', member_since)::date as semana, count(*) as miembros_nuevos
  from base where is_member and member_since is not null group by 1
)
select coalesce(c.semana, g.semana) as semana,
       coalesce(c.signups, 0) as signups,
       coalesce(c.practicaron, 0) as practicaron,
       case when coalesce(c.signups, 0) = 0 then null else round(100.0 * c.practicaron / c.signups) end as pct_practicaron,
       coalesce(c.practica_10min, 0) as practica_10min,
       coalesce(c.nunca_practicaron, 0) as nunca_practicaron,
       coalesce(c.llegaron_limite, 0) as llegaron_limite,
       coalesce(c.pagaron_cohorte, 0) as pagaron_cohorte,
       coalesce(g.miembros_nuevos, 0) as miembros_nuevos
from cohort c full join pagos g on g.semana = c.semana
order by 1 desc;
revoke all on table public.weekly_activation_report from anon, authenticated;
