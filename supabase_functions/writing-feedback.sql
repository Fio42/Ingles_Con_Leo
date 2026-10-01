-- ============================================================
-- Inglés con Leo: tabla para Writing con IA (writing-feedback.ts)
--
-- ESTADO: NO APLICADA. Se creó y luego se eliminó el 2026-10-01 a
-- pedido de Leo, porque no sirve de nada mientras Gemini esté apagado.
-- Correr este archivo en Supabase -> SQL Editor SOLO al activar Gemini
-- (paso 2 de la lista en writing-feedback.ts). Si la función se
-- despliega sin esta tabla, no llama a Gemini (falla cerrada).
--
-- Qué guarda: por cada persona y día (en UTC), cuántas correcciones con
-- IA pidió. Nada más: ni frases, ni respuestas de Gemini.
-- Seguridad: RLS activado y SIN políticas (nadie la lee ni escribe desde
-- el navegador); la función bump_ai_usage solo la puede ejecutar la
-- service_role key (la de la Edge Function), no anon ni authenticated.
-- Si se borra una cuenta, sus filas se borran solas (on delete cascade).
-- ============================================================
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;

-- Suma 1 al uso de hoy y dice si todavía está dentro del límite.
-- Atómico (un solo upsert), así dos pestañas a la vez no se saltan el tope.
create or replace function public.bump_ai_usage(p_user uuid, p_day date, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.ai_usage (user_id, day, count)
  values (p_user, p_day, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into new_count;
  return new_count <= p_limit;
end;
$$;

revoke all on function public.bump_ai_usage(uuid, date, int) from public, anon, authenticated;
grant execute on function public.bump_ai_usage(uuid, date, int) to service_role;