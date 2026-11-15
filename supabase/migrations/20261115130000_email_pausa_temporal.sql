-- Pausa temporal de correos automaticos por rebote no permanente (2026-11-15).
-- Columna nueva, opcional y aditiva: no cambia ni borra nada existente.
-- null = sin pausa. Mientras email_paused_until > now() las automatizaciones de marketing,
-- reactivacion, racha y encuesta no le escriben a esa cuenta. NO afecta el acceso a la academia
-- (is_member), la recuperacion de contrasena ni el aviso de cobro fallido.
-- Reversible: update public.profiles set email_paused_until = null where id = '<id>';
-- Los usuarios no pueden editarla: profiles solo permite a "authenticated" actualizar columnas concretas.
alter table public.profiles add column if not exists email_paused_until timestamptz;
comment on column public.profiles.email_paused_until is 'Pausa temporal de correos automaticos (la pone resend-webhook 14 dias tras un rebote no permanente). null = sin pausa.';
