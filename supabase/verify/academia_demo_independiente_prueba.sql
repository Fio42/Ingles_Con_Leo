-- PRUEBA CONTROLADA de la demostracion independiente, con UNA cuenta de prueba tuya. NO deja ningun cambio en la base:
-- todo ocurre dentro de un bloque que termina con un error a proposito ("RESULTADO ..."), asi que Postgres deshace todo.
-- Se corre en el SQL Editor de Supabase DESPUES de aplicar 20261027180000_academia_demo_independiente.sql.
-- Antes de correrla cambia TU_CORREO_DE_PRUEBA@example.com por el correo de TU cuenta de prueba (nunca una cuenta de cliente).
-- Lo que debes ver (copiado del mensaje de error): todos los pasos con "ok":true en la columna esperada.
do $$
declare
  uid uuid := (select id from auth.users where email = 'TU_CORREO_DE_PRUEBA@example.com');
  out jsonb := '[]'::jsonb; r jsonb;
begin
  if uid is null then raise exception 'RESULTADO: no existe esa cuenta de prueba'; end if;
  -- Estado de partida (se deshace al final): cuenta gratis, sin demostracion previa, 6 de 6 ejercicios usados hoy.
  update public.profiles set is_member = false, free_daily_count = 6, free_daily_date = current_date, free_daily_limit_reached_at = now() where id = uid;
  delete from public.academia_progress where user_id = uid and course_id = 'to-be';
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  r := public.academia_access('to-be', null, 0);
  out := out || jsonb_build_object('1_limite_6_de_6_demo_disponible', (r->'demo'->>'available')::boolean and (r->'daily'->>'remaining')::int = 0 and not (r->>'member')::boolean, 'detalle', r->'demo');
  r := public.academia_demo_start('to-be', null, 0);
  out := out || jsonb_build_object('2_demo_empieza_con_limite_agotado', (r->>'ok')::boolean and not (r->>'resumed')::boolean and (r->>'cost')::int = 3);
  r := public.academia_demo_start('to-be', null, 0);
  out := out || jsonb_build_object('3_reanudar_no_cobra', (r->>'ok')::boolean and (r->>'resumed')::boolean);
  r := public.academia_access('to-be', '2001-01-01', 99);
  out := out || jsonb_build_object('4_contador_falso_del_navegador_no_cambia_la_demo', (r->'demo'->>'resumable')::boolean and (r->'demo'->>'used')::boolean);
  perform public.academia_demo_finish('to-be');
  r := public.academia_demo_start('to-be', null, 0);
  out := out || jsonb_build_object('5_demo_usada_se_bloquea', not (r->>'ok')::boolean and r->>'error' = 'demo_used');
  r := public.academia_access('to-be', null, 0);
  out := out || jsonb_build_object('6_estado_final_usada_hecha_no_disponible', (r->'demo'->>'used')::boolean and (r->'demo'->>'done')::boolean and not (r->'demo'->>'available')::boolean);
  r := public.academia_demo_start('pronombres', null, 0);
  out := out || jsonb_build_object('7_curso_sin_demo_cerrado', not (r->>'ok')::boolean and r->>'error' = 'demo_off');
  r := public.academia_demo_start('curso-inexistente', null, 0);
  out := out || jsonb_build_object('8_curso_inexistente_cerrado', not (r->>'ok')::boolean and r->>'error' = 'course');
  execute 'reset role';
  out := out || jsonb_build_object('9_contador_diario_sigue_en_6', (select free_daily_count = 6 from public.profiles where id = uid));
  -- Miembro: no gasta demostracion
  update public.profiles set is_member = true where id = uid;
  delete from public.academia_progress where user_id = uid and course_id = 'to-be';
  execute 'set local role authenticated';
  r := public.academia_demo_start('to-be', null, 0);
  execute 'reset role';
  out := out || jsonb_build_object('10_miembro_acceso_sin_gastar_demo', (r->>'ok')::boolean and (r->>'member')::boolean and not exists (select 1 from public.academia_progress where user_id = uid));
  -- Visitante (anon) no puede llamar
  begin
    execute 'set local role anon'; perform public.academia_access('to-be', null, 0); execute 'reset role';
    out := out || jsonb_build_object('11_anon_bloqueado', false);
  exception when insufficient_privilege then execute 'reset role'; out := out || jsonb_build_object('11_anon_bloqueado', true);
  end;
  raise exception 'RESULTADO (nada se guardo): %', out::text;
end $$;
