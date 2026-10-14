-- Aplicada en Supabase el 2026-10-14 (version registrada 20261014182848). Archivo creado para paridad con el repo.
-- 1) El rol anonimo no necesita escribir en profiles (la RLS ya lo bloqueaba; ahora tambien los permisos).
revoke insert, update, delete, references, trigger on public.profiles from anon;
do $$
declare r record;
begin
  for r in
    select distinct column_name from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'profiles' and grantee = 'anon'
      and privilege_type in ('INSERT','UPDATE','REFERENCES')
  loop
    execute format('revoke insert(%1$I), update(%1$I), references(%1$I) on public.profiles from anon', r.column_name);
  end loop;
end $$;

-- 2) handle_new_user() es una funcion de trigger (SECURITY DEFINER): no debe ser invocable por RPC.
--    El trigger on_auth_user_created sigue funcionando (EXECUTE solo se comprueba al crear el trigger;
--    se probo en una transaccion con rollback el 2026-10-14).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3) Fijar search_path en apply_mistake_results (no es SECURITY DEFINER; solo endurecimiento).
alter function public.apply_mistake_results(jsonb) set search_path = public;

-- REVERSION (solo si algo fallara; no se espera):
--   grant insert, update, delete, references, trigger on public.profiles to anon;   -- y SELECT ya estaba
--   grant execute on function public.handle_new_user() to anon, authenticated, public;
--   alter function public.apply_mistake_results(jsonb) reset search_path;
