-- Aplicada en Supabase el 2026-10-14 (version registrada 20261014163304). Archivo creado despues para paridad con el repo.
-- TRUNCATE no lo necesita ningun codigo del sitio para anon ni authenticated; service_role lo conserva.
revoke truncate on public.profiles, public.ai_usage, public.ai_usage_daily, public.article_comments,
  public.leo_ai_config, public.leo_ai_requests, public.leo_ai_testers, public.leobot_reports,
  public.mistake_stats, public.survey_responses from anon, authenticated;
