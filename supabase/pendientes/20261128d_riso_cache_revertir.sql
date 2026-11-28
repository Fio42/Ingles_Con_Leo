-- Reversión de 20261128d_riso_cache.sql: quita la caché compartida y deja riso_valorar como en 20261128030634_riso_metricas.sql.
drop function if exists public.riso_cache_retirar(text);
drop function if exists public.riso_cache_aprobar(text);
drop function if exists public.riso_cache_revisar(text, int);
drop function if exists public.riso_cache_guardar(text, text, text, text, text, text);
drop function if exists public.riso_cache_buscar(text);
drop table if exists public.riso_cache;
alter table public.leo_ai_config drop column if exists riso_cache_max;
alter table public.leo_ai_config drop column if exists riso_cache;
create or replace function public.riso_valorar(p_capa text, p_intencion text, p_tema text)
returns text language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then return 'no_session'; end if;
  if coalesce((public.riso_chat_status(v_user)->>'enabled')::boolean, false) is not true then return 'not_allowed'; end if;
  if p_capa not in ('codigo', 'biblioteca', 'faq', 'cache', 'ia') then return 'bad_capa'; end if;
  perform public.riso_metricas_sumar(p_capa, p_intencion, p_tema, 0, 0, 0, 0, false, false, true);
  return 'ok';
end;
$$;
revoke all on function public.riso_valorar(text, text, text) from public, anon;
grant execute on function public.riso_valorar(text, text, text) to authenticated;
