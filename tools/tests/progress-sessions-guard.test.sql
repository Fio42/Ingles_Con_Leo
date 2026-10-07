-- Pruebas de la guardia de progress_sessions (migración progress_sessions_free_tier_guard, ver supabase_schema.sql).
-- Corren en Supabase -> SQL Editor. NO dejan nada: todo corre dentro de UNA transacción que termina con un error
-- a propósito (ROLLBACK). Resultado esperado: un error cuyo mensaje empieza con "TODO_OK".
-- Usa una cuenta gratis y una de miembro reales solo como dueñas de filas de prueba que nunca se guardan.
do $test$
declare
  u_free uuid; u_mem uuid; u_other uuid;
  n int; n0 int; i int; t text; ts timestamptz;
  passed int := 0;
  base bigint := 4000000000000;   -- "started_at" imposibles, para no chocar con sesiones reales
  ok boolean;
begin
  select id into u_free from public.profiles where not is_member order by created_at limit 1;
  select id into u_mem from public.profiles where is_member order by created_at limit 1;
  select id into u_other from public.profiles where id not in (u_free, u_mem) limit 1;
  if u_free is null or u_mem is null or u_other is null then raise exception 'FAIL faltan cuentas para probar'; end if;

  -- ===== como CUENTA GRATIS =====
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', u_free, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_free::text, true);
  select count(*) into n0 from public.progress_sessions where user_id = u_free and created_at > now() - interval '24 hours';

  -- 1) la base marca free y pone created_at aunque el navegador mande otra cosa
  insert into public.progress_sessions (user_id, skill, level, topics, date, started_at, duration_ms, results, tier, created_at)
  values (u_free, 'gramatica', 'facil', '["Some / Any"]', current_date, base + 1, 1000, '[{"itemId":"g-facil-some-1","isCorrect":true}]', null, '2000-01-01');
  select tier, created_at into t, ts from public.progress_sessions where user_id = u_free and started_at = base + 1;
  if t is distinct from 'free' then raise exception 'FAIL tier free: %', t; end if;
  if ts < now() - interval '1 minute' then raise exception 'FAIL created_at lo pone la base: %', ts; end if;
  passed := passed + 1;

  -- 2) la misma sesión no entra dos veces
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_free, 'gramatica', 'facil', current_date, base + 1, '[]');
  exception when unique_violation then ok := true; end;
  if not ok then raise exception 'FAIL repetida aceptada'; end if;
  passed := passed + 1;

  -- 3) no puede insertar a nombre de otra cuenta, ni leer filas ajenas
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_other, 'gramatica', 'facil', current_date, base + 2, '[]');
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FAIL insertó a nombre de otro'; end if;
  select count(*) into n from public.progress_sessions where user_id <> u_free;
  if n <> 0 then raise exception 'FAIL ve filas ajenas: %', n; end if;
  passed := passed + 1;

  -- 4) límites de forma y tamaño
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results)
    values (u_free, 'gramatica', 'facil', current_date, base + 3, (select jsonb_agg(jsonb_build_object('itemId', 'x' || g, 'isCorrect', true)) from generate_series(1, 61) g));
  exception when raise_exception then ok := true; end;
  if not ok then raise exception 'FAIL sesión gratis de 61 respuestas aceptada'; end if;
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_free, 'gramatica', 'facil', current_date, base + 4, '{"a":1}');
  exception when check_violation then ok := true; end;
  if not ok then raise exception 'FAIL results que no es lista'; end if;
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_free, repeat('x', 41), 'facil', current_date, base + 5, '[]');
  exception when check_violation then ok := true; end;
  if not ok then raise exception 'FAIL skill gigante'; end if;
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_free, 'gramatica', 'facil', current_date, base + 6, jsonb_build_array(repeat('x', 100001)));
  exception when check_violation then ok := true; end;
  if not ok then raise exception 'FAIL results de más de 100 KB'; end if;
  passed := passed + 1;

  -- 5) no puede modificar ni borrar sus filas
  ok := false;
  begin update public.progress_sessions set level = 'medio' where user_id = u_free and started_at = base + 1;
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FAIL pudo hacer update'; end if;
  ok := false;
  begin delete from public.progress_sessions where user_id = u_free and started_at = base + 1;
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FAIL pudo hacer delete'; end if;
  passed := passed + 1;

  -- 6) límite diario de una cuenta gratis: 40 filas en 24 h
  select count(*) into n from public.progress_sessions where user_id = u_free and created_at > now() - interval '24 hours';
  for i in 1..(40 - n) loop
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_free, 'vocabulario', 'facil', current_date, base + 100 + i, '[]');
  end loop;
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_free, 'vocabulario', 'facil', current_date, base + 999, '[]');
  exception when raise_exception then ok := true; end;
  if not ok then raise exception 'FAIL la fila 41 del día entró'; end if;
  passed := passed + 1;

  -- ===== como MIEMBRO: todo igual que antes, sin marca free aunque la pida =====
  perform set_config('request.jwt.claims', json_build_object('sub', u_mem, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_mem::text, true);
  insert into public.progress_sessions (user_id, skill, level, topics, date, started_at, duration_ms, results, tier)
  values (u_mem, 'plan', 'medio', '["Gramática"]', current_date, base + 1, 1000, '[{"itemId":"g-medio5-fut-1","isCorrect":false}]', 'free');
  select tier into t from public.progress_sessions where user_id = u_mem and started_at = base + 1;
  if t is not null then raise exception 'FAIL miembro marcado: %', t; end if;
  insert into public.progress_sessions (user_id, skill, level, date, started_at, results)
  values (u_mem, 'plan', 'medio', current_date, base + 2, (select jsonb_agg(jsonb_build_object('itemId', 'x' || g, 'isCorrect', true)) from generate_series(1, 61) g));
  passed := passed + 1;

  -- ===== sin sesión (anon): nada =====
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  ok := false;
  begin
    insert into public.progress_sessions (user_id, skill, level, date, started_at, results) values (u_free, 'gramatica', 'facil', current_date, base + 7, '[]');
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FAIL anon pudo insertar'; end if;
  ok := false;
  begin select count(*) into n from public.progress_sessions;
  exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'FAIL anon pudo leer'; end if;
  passed := passed + 1;

  execute 'reset role';
  raise exception 'TODO_OK: % grupos de pruebas correctos (no se guardó nada)', passed;
end
$test$;
