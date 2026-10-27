-- Huellas de datos y funciones (solo lectura, sin datos personales). Correr antes y despues del despliegue.
select 'academia_progress n='||count(*)||' started='||count(demo_started_at)||' done='||count(demo_done_at)||' md5='||left(md5(string_agg(user_id::text||course_id||coalesce(demo_started_at::text,'')||coalesce(demo_done_at::text,'')||version::text, ',' order by user_id, course_id)),10) as r from public.academia_progress
union all select 'academia_courses md5='||left(md5(string_agg(course_id||enabled::text||coalesce(array_to_string(demo_items,'/'),''), ',' order by course_id)),10) from public.academia_courses
union all select 'profiles n='||count(*)||' members='||count(*) filter (where is_member) from public.profiles
union all select 'mistake_stats n='||count(*) from public.mistake_stats
union all select 'progress_sessions n='||count(*) from public.progress_sessions
union all select 'academia_badges n='||count(*)||' attempts='||(select count(*) from public.academia_exam_attempts) from public.academia_badges
union all select 'fn '||p.proname||' '||left(md5(pg_get_functiondef(p.oid)),10)||' '||coalesce(p.proacl::text,'-') from pg_proc p where p.pronamespace='public'::regnamespace and p.proname in ('academia_access','academia_demo_start','academia_demo_finish','academia_free_count','academia_today','academia_is_member','academia_free_daily_limit');
