-- Informe de las primeras 24 horas de la Academia Ingles con Leo. SOLO LECTURA (un unico SELECT, un resultado JSON).
-- Se corre en Supabase -> SQL Editor. Para otro periodo, cambia "desde" (y "hasta").
-- Excluye las dos cuentas de prueba usadas en el lanzamiento (prueba).
-- Los visitantes y los clics vienen de GA4 (no de esta base). Aqui estan los datos de cuentas y de la academia.
with p as (
  select timestamptz '2026-10-26 16:30+00' as desde,
         timestamptz '2026-10-27 16:30+00' as hasta,
         array['f8c0bf1f-57c9-462a-addf-17559aeab69f','8a1dea64-bbdd-4cd1-ab1d-8bb698061fbb']::uuid[] as prueba
),
prog as (
  select ap.*, (select count(*) from jsonb_each(coalesce(ap.state->'lessons','{}'::jsonb)) l where (l.value->>'done')::boolean) as hechas
  from public.academia_progress ap, p
  where ap.user_id <> all(p.prueba)
)
select jsonb_build_object(
  'periodo', (select jsonb_build_object('desde', desde, 'hasta', hasta) from p),
  'cuentas', jsonb_build_object(
    'registros_nuevos', (select count(*) from public.profiles x, p where x.created_at >= p.desde and x.created_at < p.hasta and x.id <> all(p.prueba)),
    'miembros_nuevos', (select count(*) from public.profiles x, p where x.member_since >= p.desde and x.member_since < p.hasta and x.id <> all(p.prueba)),
    'checkouts_iniciados', (select count(*) from public.profiles x, p where x.checkout_started_at >= p.desde and x.checkout_started_at < p.hasta and x.id <> all(p.prueba)),
    'miembros_totales', (select count(*) from public.profiles where is_member)
  ),
  'demos', jsonb_build_object(
    'iniciadas', (select count(*) from public.academia_progress x, p where x.demo_started_at >= p.desde and x.demo_started_at < p.hasta and x.user_id <> all(p.prueba)),
    'completadas', (select count(*) from public.academia_progress x, p where x.demo_done_at >= p.desde and x.demo_done_at < p.hasta and x.user_id <> all(p.prueba))
  ),
  'to_be', jsonb_build_object(
    'alumnos_que_comenzaron', (select count(*) from prog, p where prog.updated_at >= p.desde and (prog.hechas > 0 or coalesce(prog.state->'resume','{}'::jsonb) <> '{}'::jsonb)),
    'alumnos_con_1_o_mas_lecciones', (select count(*) from prog where hechas >= 1),
    'alumnos_con_las_5_lecciones', (select count(*) from prog where hechas >= 5),
    'evaluaciones_enviadas', (select count(*) from public.academia_exam_attempts x, p where x.submitted_at >= p.desde and x.submitted_at < p.hasta and x.user_id <> all(p.prueba)),
    'evaluaciones_aprobadas', (select count(*) from public.academia_exam_attempts x, p where x.passed and x.submitted_at >= p.desde and x.submitted_at < p.hasta and x.user_id <> all(p.prueba)),
    'insignias', (select count(*) from public.academia_badges x, p where x.awarded_at >= p.desde and x.awarded_at < p.hasta and x.user_id <> all(p.prueba)),
    'sesiones_de_leccion', (select count(*) from public.progress_sessions x, p where x.created_at >= p.desde and x.created_at < p.hasta and x.user_id <> all(p.prueba) and x.results::text like '%ac:to-be%')
  ),
  'salud', jsonb_build_object(
    'lotes_de_errores_pendientes_o_fallidos', (select count(*) from public.academia_mistake_batches x, p where x.status <> 'applied' and x.user_id <> all(p.prueba)),
    'errores_tecnicos_nuevos_o_activos', (select count(*) from public.app_errors x, p where x.last_seen >= p.desde and x.last_seen < p.hasta),
    'top_errores_tecnicos', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select x.kind, x.severity, left(x.message, 110) as mensaje, x.count as veces, x.first_seen, x.last_seen
        from public.app_errors x, p where x.last_seen >= p.desde and x.last_seen < p.hasta
        order by x.count desc limit 10) t)
  )
) as informe_24h;
