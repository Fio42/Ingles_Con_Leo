-- Auditoria de conversion Ingles con Leo. SOLO LECTURA (un unico SELECT, un resultado JSON). Se corre en Supabase -> SQL Editor.
-- Cuenta PERSONAS (cuentas), no eventos. Excluye las dos cuentas de prueba del lanzamiento de la Academia.
-- Una cuenta "practica" si tiene free_first_exercise_at o al menos una fila en progress_sessions. Los dias se miden por fecha UTC del registro.
with p as (
  select array['f8c0bf1f-57c9-462a-addf-17559aeab69f','8a1dea64-bbdd-4cd1-ab1d-8bb698061fbb']::uuid[] as prueba, now() as ahora
),
c as (
  select x.id, x.created_at, x.is_member, x.member_since, x.checkout_started_at, x.free_first_exercise_at, x.free_daily_limit_reached_at, x.last_seen_at,
         (x.created_at at time zone 'utc')::date as d0
  from public.profiles x, p where x.id <> all(p.prueba)
),
s as (  -- sesiones terminadas por cuenta
  select ps.user_id, count(*) as n, min(ps.created_at) as primera, array_agg(distinct ps.date) as dias
  from public.progress_sessions ps group by ps.user_id
),
f as (
  select c.*, coalesce(s.n,0) as sesiones, s.primera, s.dias,
         (c.free_first_exercise_at is not null or coalesce(s.n,0) > 0) as practico,
         (coalesce(s.n,0) > 0) as completo_sesion,
         (c.d0 + 1) = any(coalesce(s.dias, '{}')) as d1,
         exists (select 1 from unnest(coalesce(s.dias,'{}')) d where d >= c.d0 + 2 and d <= c.d0 + 7) as dias_2_a_7,
         (c.d0 + 7) = any(coalesce(s.dias, '{}')) as d7,
         (c.is_member or c.member_since is not null) as pago
  from c left join s on s.user_id = c.id
)
select jsonb_build_object(
  'generado', (select ahora from p),
  'rango_registros', (select jsonb_build_object('primero', min(created_at), 'ultimo', max(created_at)) from f),
  'embudo_todas_las_cuentas', jsonb_build_object(
     'registradas', count(*),
     'practicaron', count(*) filter (where practico),
     'completaron_una_sesion', count(*) filter (where completo_sesion),
     'alcanzaron_limite_gratis', count(*) filter (where free_daily_limit_reached_at is not null),
     'iniciaron_checkout', count(*) filter (where checkout_started_at is not null),
     'pagaron_alguna_vez', count(*) filter (where pago)),
  'retorno_cohorte_elegible', jsonb_build_object(
     'nota', 'D1 solo cuentas con >=2 dias; D7 solo cuentas con >=8 dias. Mide dias con una sesion TERMINADA registrada, no visitas.',
     'elegibles_d1', count(*) filter (where created_at <= (select ahora from p) - interval '2 days'),
     'practicaron_d1_elegibles', count(*) filter (where created_at <= (select ahora from p) - interval '2 days' and practico),
     'volvieron_dia_siguiente', count(*) filter (where created_at <= (select ahora from p) - interval '2 days' and d1),
     'elegibles_d7', count(*) filter (where created_at <= (select ahora from p) - interval '8 days'),
     'volvieron_dias_2_a_7', count(*) filter (where created_at <= (select ahora from p) - interval '8 days' and dias_2_a_7),
     'volvieron_dia_7', count(*) filter (where created_at <= (select ahora from p) - interval '8 days' and d7)),
  'gratis_sin_pagar', jsonb_build_object(
     'cuentas', count(*) filter (where not pago),
     'practicaron', count(*) filter (where not pago and practico),
     'limite_gratis', count(*) filter (where not pago and free_daily_limit_reached_at is not null),
     'checkout_sin_pagar', count(*) filter (where not pago and checkout_started_at is not null),
     'vistos_ultimos_7d', count(*) filter (where not pago and last_seen_at >= (select ahora from p) - interval '7 days')),
  'por_semana_de_registro', (select coalesce(jsonb_agg(w order by w->>'semana'), '[]'::jsonb) from (
      select jsonb_build_object('semana', to_char(date_trunc('week', created_at),'YYYY-MM-DD'), 'registros', count(*),
        'practicaron', count(*) filter (where practico), 'limite', count(*) filter (where free_daily_limit_reached_at is not null),
        'checkout', count(*) filter (where checkout_started_at is not null), 'pagaron', count(*) filter (where pago)) as w
      from f group by date_trunc('week', created_at)) t),
  'pagadores', (select coalesce(jsonb_agg(jsonb_build_object(
        'dias_registro_a_pago', round(extract(epoch from (coalesce(member_since, created_at) - created_at))/86400.0, 1),
        'practico_antes', practico, 'sesiones_totales', sesiones, 'llego_al_limite', free_daily_limit_reached_at is not null,
        'inicio_checkout', checkout_started_at is not null,
        'checkout_a_pago_horas', case when checkout_started_at is not null and member_since is not null then round(extract(epoch from (member_since - checkout_started_at))/3600.0, 1) end,
        'registro', to_char(created_at,'YYYY-MM-DD')) order by member_since), '[]'::jsonb) from f where pago),
  'pagadores_activos_ahora', (select count(*) from f where is_member)
) as informe
from f;
