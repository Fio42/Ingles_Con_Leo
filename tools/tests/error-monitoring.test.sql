-- Pruebas de la base del registro de errores (supabase_functions/error-monitoring.sql).
-- Corren en Supabase -> SQL Editor (o: npx supabase db query --linked -f tools/tests/error-monitoring.test.sql).
-- NO dejan nada: todo corre dentro de UNA transacción que termina con un error a propósito
-- (ROLLBACK), así que tampoco se manda ningún correo ni quedan filas ni contadores.
-- Resultado esperado: un error cuyo mensaje empieza con "TODO_OK".
do $test$
declare
  res jsonb;
  n int;
  q0 bigint;
  q1 bigint;
  r public.app_errors%rowtype;
  fp text;
  i int;
  passed int := 0;
begin
  select count(*) into q0 from net.http_request_queue;

  -- 1) Sanitización (mismos casos que tools/tests/error-monitor.test.js)
  if public.app_error_clean('Falla con ana.perez@gmail.com y bob@mail.co.uk', 300) <> 'Falla con [email] y [email]' then raise exception 'FAIL clean email: %', public.app_error_clean('Falla con ana.perez@gmail.com y bob@mail.co.uk', 300); end if;
  if public.app_error_clean('token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.firmaabc123 fin', 300) not like '%[jwt]%' then raise exception 'FAIL clean jwt'; end if;
  if public.app_error_clean('Authorization: Bearer abc.def-123', 300) like '%abc%' or public.app_error_clean('x Bearer abc.def-123', 300) <> 'x Bearer [token]' then raise exception 'FAIL clean bearer: %', public.app_error_clean('Authorization: Bearer abc.def-123', 300); end if;
  if public.app_error_clean('password=hunter2 y apikey: sb_publishable_97pvm28aLA7UCqTNV6WRUg', 300) like '%hunter2%' then raise exception 'FAIL clean password'; end if;
  if public.app_error_clean('sb_publishable_97pvm28aLA7UCqTNV6WRUg_Bca5Y4XN', 300) like '%97pvm%' then raise exception 'FAIL clean key'; end if;
  if public.app_error_clean('GET https://x.supabase.co/rest/v1/profiles?id=eq.123&token=abc#access_token=zzz fin', 300) <> 'GET https://x.supabase.co/rest/v1/profiles fin' then raise exception 'FAIL clean url: %', public.app_error_clean('GET https://x.supabase.co/rest/v1/profiles?id=eq.123&token=abc#access_token=zzz fin', 300); end if;
  if public.app_error_clean('user 123e4567-e89b-12d3-a456-426614174000 y tel 5512345678', 300) <> 'user [id] y tel [num]' then raise exception 'FAIL clean uuid/num: %', public.app_error_clean('user 123e4567-e89b-12d3-a456-426614174000 y tel 5512345678', 300); end if;
  if public.app_error_clean('tarjeta 4242 4242 4242 4242 ok', 300) like '%4242%' then raise exception 'FAIL clean card'; end if;
  if public.app_error_clean('Unexpected "' || repeat('mi respuesta secreta ', 5) || '" token', 300) like '%secreta%' then raise exception 'FAIL clean quoted'; end if;
  if length(public.app_error_clean(repeat('a b ', 200), 50)) > 50 then raise exception 'FAIL clean length'; end if;
  if public.app_error_clean('x is not a function (reading ''foo'')', 300) <> 'x is not a function (reading ''foo'')' then raise exception 'FAIL clean keeps normal text'; end if;
  passed := passed + 1;

  -- 2) Deduplicación: el mismo fingerprint 5 veces = 1 fila, contador 5, 5 en la hora
  fp := repeat('a', 32);
  for i in 1..5 loop
    res := public.log_app_error(fp, 'js_error', 'client', 'error', 'speaking', 'boom 1', 'TypeError', 'f (app.js:1:2)', null, 'v1', 'Chrome 120', 'Android 13 mobile', '{"online":true}');
    if (res ->> 'logged')::boolean is not true then raise exception 'FAIL dedupe logged: %', res; end if;
  end loop;
  select count(*) into n from public.app_errors where fingerprint = fp;
  if n <> 1 then raise exception 'FAIL dedupe filas: %', n; end if;
  select * into r from public.app_errors where fingerprint = fp;
  if r.count <> 5 then raise exception 'FAIL dedupe count: %', r.count; end if;
  if r.first_seen > r.last_seen then raise exception 'FAIL dedupe fechas'; end if;
  select sum(h.n) into n from public.app_error_hourly h where h.error_id = r.id;
  if n <> 5 then raise exception 'FAIL hourly: %', n; end if;
  if (r.browsers ->> 'Chrome 120')::int <> 5 then raise exception 'FAIL browsers: %', r.browsers; end if;
  passed := passed + 1;

  -- 3) Correo: nuevo = avisa UNA vez; los repetidos no
  fp := repeat('b', 32);
  res := public.log_app_error(fp, 'js_error', 'client', 'error', 'x', 'm', null, null, null, null, null, null, null);
  if res ->> 'reason' <> 'new' then raise exception 'FAIL alert new: %', res; end if;
  res := public.log_app_error(fp, 'js_error', 'client', 'error', 'x', 'm', null, null, null, null, null, null, null);
  if (res ->> 'alert')::boolean then raise exception 'FAIL alert repetido: %', res; end if;
  -- info nunca avisa
  res := public.log_app_error(repeat('c', 32), 'network', 'client', 'info', 'x', 'm', null, null, 'network', null, null, null, null);
  if (res ->> 'alert')::boolean then raise exception 'FAIL info avisa'; end if;
  passed := passed + 1;

  -- 4) Crítico: avisa al inicio; luego no hasta pasar 2 h
  fp := repeat('d', 32);
  res := public.log_app_error(fp, 'payment', 'server', 'critical', 'stripe-webhook', 'x', null, null, 'activate', null, null, null, null);
  if res ->> 'reason' <> 'new' then raise exception 'FAIL crit new: %', res; end if;
  res := public.log_app_error(fp, 'payment', 'server', 'critical', 'stripe-webhook', 'x', null, null, 'activate', null, null, null, null);
  if (res ->> 'alert')::boolean then raise exception 'FAIL crit repite: %', res; end if;
  update public.app_errors set last_emailed_at = now() - interval '3 hours' where fingerprint = fp;
  res := public.log_app_error(fp, 'payment', 'server', 'critical', 'stripe-webhook', 'x', null, null, 'activate', null, null, null, null);
  if res ->> 'reason' <> 'critical_repeat' then raise exception 'FAIL crit repeat: %', res; end if;
  passed := passed + 1;

  -- 5) Escalada: al llegar a 10 y con >6 h desde el último correo
  fp := repeat('e', 32);
  perform public.log_app_error(fp, 'resource', 'client', 'warning', 'x', 'm', null, null, null, null, null, null, null);
  update public.app_errors set count = 9, last_emailed_at = now() - interval '1 hour' where fingerprint = fp;
  res := public.log_app_error(fp, 'resource', 'client', 'warning', 'x', 'm', null, null, null, null, null, null, null);
  if (res ->> 'alert')::boolean then raise exception 'FAIL escalada reciente: %', res; end if;
  update public.app_errors set count = 9, last_emailed_at = now() - interval '7 hours' where fingerprint = fp;
  res := public.log_app_error(fp, 'resource', 'client', 'warning', 'x', 'm', null, null, null, null, null, null, null);
  if res ->> 'reason' <> 'escalation' then raise exception 'FAIL escalada: %', res; end if;
  passed := passed + 1;

  -- 6) Regresión: 'resolved' que vuelve avisa y se reabre. 'ignored' nunca avisa.
  fp := repeat('f', 32);
  perform public.log_app_error(fp, 'js_error', 'client', 'error', 'x', 'm', null, null, null, null, null, null, null);
  update public.app_errors set status = 'resolved' where fingerprint = fp;
  res := public.log_app_error(fp, 'js_error', 'client', 'error', 'x', 'm', null, null, null, null, null, null, null);
  if res ->> 'reason' <> 'regression' then raise exception 'FAIL regresion: %', res; end if;
  select * into r from public.app_errors where fingerprint = fp;
  if r.status <> 'open' then raise exception 'FAIL reabrir'; end if;
  update public.app_errors set status = 'ignored', count = 9, last_emailed_at = null where fingerprint = fp;
  res := public.log_app_error(fp, 'js_error', 'client', 'error', 'x', 'm', null, null, null, null, null, null, null);
  if (res ->> 'alert')::boolean then raise exception 'FAIL ignored avisa'; end if;
  select * into r from public.app_errors where fingerprint = fp;
  if r.status <> 'ignored' then raise exception 'FAIL ignored cambia estado'; end if;
  passed := passed + 1;

  -- 7) La severidad solo sube
  fp := repeat('1', 32);
  perform public.log_app_error(fp, 'network', 'client', 'info', 'x', 'm', null, null, 'network', null, null, null, null);
  perform public.log_app_error(fp, 'network', 'client', 'error', 'x', 'm', null, null, 'network', null, null, null, null);
  perform public.log_app_error(fp, 'network', 'client', 'info', 'x', 'm', null, null, 'network', null, null, null, null);
  select * into r from public.app_errors where fingerprint = fp;
  if r.severity <> 'error' then raise exception 'FAIL severidad: %', r.severity; end if;
  passed := passed + 1;

  -- 8) Datos privados no se guardan (mensaje, stack, sample con claves extra)
  fp := repeat('2', 32);
  perform public.log_app_error(fp, 'js_error', 'client', 'error', 'Mi Sección!!', 'falla ana@mail.com Bearer abc123 password=xx', 'TypeError', 'f (app.js:1:2) ?token=zzz', null, null, null, null,
    '{"online":true,"email":"ana@mail.com","answer":"mi respuesta","status":503,"method":"POST","member":"si"}');
  select * into r from public.app_errors where fingerprint = fp;
  if r.message like '%ana@%' or r.message like '%abc123%' or r.message like '%xx%' then raise exception 'FAIL privacidad mensaje: %', r.message; end if;
  if r.stack_top like '%zzz%' then raise exception 'FAIL privacidad stack'; end if;
  if r.section <> 'miseccin' then raise exception 'FAIL section: %', r.section; end if;
  if r.sample ? 'email' or r.sample ? 'answer' or r.sample ? 'member' then raise exception 'FAIL sample: %', r.sample; end if;
  if (r.sample ->> 'status')::int <> 503 then raise exception 'FAIL sample status'; end if;
  passed := passed + 1;

  -- 9) Entradas inválidas no se guardan
  res := public.log_app_error('zzz', 'js_error', 'client', 'error', 'x', 'm', null, null, null, null, null, null, null);
  if (res ->> 'logged')::boolean then raise exception 'FAIL fp invalido'; end if;
  res := public.log_app_error(repeat('3', 32), 'js_error', 'hacker', 'error', 'x', 'm', null, null, null, null, null, null, null);
  if (res ->> 'logged')::boolean then raise exception 'FAIL source invalido'; end if;
  res := public.log_app_error(repeat('4', 32), 'inventado', 'client', 'critico', 'x', 'm', null, null, null, null, null, null, null);
  select * into r from public.app_errors where fingerprint = repeat('4', 32);
  if r.kind <> 'other' or r.severity <> 'error' then raise exception 'FAIL normaliza kind/severity: % %', r.kind, r.severity; end if;
  passed := passed + 1;

  -- 10) Máximo 8 navegadores distintos por error
  fp := repeat('5', 32);
  for i in 1..12 loop
    perform public.log_app_error(fp, 'js_error', 'client', 'info', 'x', 'm', null, null, null, null, 'Browser ' || i, null, null);
  end loop;
  select * into r from public.app_errors where fingerprint = fp;
  if (select count(*) from jsonb_object_keys(r.browsers)) > 8 then raise exception 'FAIL browsers max'; end if;
  passed := passed + 1;

  -- 11) Cola de correos: solo hubo aviso donde dijimos (nuevos a, b, d, e, f, 2 y 4; crítico repetido d; escalada e; regresión f) = 10
  select count(*) into q1 from net.http_request_queue;
  if q1 - q0 <> 10 then raise exception 'FAIL cola de correos: % (esperado 10)', q1 - q0; end if;
  passed := passed + 1;

  -- 12) Tope de correos: 10 por hora (se reinician los contadores para probarlo limpio)
  delete from public.app_error_rate where bucket in ('mail_hour', 'mail_day', 'mail_suppressed', 'newfp');
  n := 0;
  for i in 1..15 loop
    res := public.log_app_error(lpad(to_hex(1000 + i), 32, '9'), 'js_error', 'client', 'error', 'x', 'm' || i, null, null, null, null, null, null, null);
    if (res ->> 'alert')::boolean then n := n + 1; end if;
  end loop;
  if n <> 10 then raise exception 'FAIL tope de correos por hora: % (esperado 10)', n; end if;
  select r2.n into n from public.app_error_rate r2 where bucket = 'mail_suppressed';
  if n <> 5 then raise exception 'FAIL suprimidos: %', n; end if;
  passed := passed + 1;

  -- 13) Fingerprints nuevos: máximo 30/hora; el resto se agrupa en 'overflow' y la tabla no crece
  delete from public.app_error_rate where bucket in ('mail_hour', 'mail_day', 'mail_suppressed', 'newfp');
  select count(*) into q0 from public.app_errors;
  for i in 1..40 loop
    perform public.log_app_error(lpad(to_hex(5000 + i), 32, '8'), 'js_error', 'client', 'info', 'x', 'n' || i, null, null, null, null, null, null, null);
  end loop;
  select count(*) into q1 from public.app_errors;
  if q1 - q0 > 31 then raise exception 'FAIL tope fingerprints nuevos: crecio % filas', q1 - q0; end if;
  if not exists (select 1 from public.app_errors where fingerprint = 'overflow' and count >= 10) then raise exception 'FAIL overflow'; end if;
  passed := passed + 1;

  -- 14) Tope global de eventos (600/hora por origen)
  update public.app_error_rate set n = 600, window_start = now() where bucket = 'global:client';
  if not found then insert into public.app_error_rate values ('global:client', now(), 600); end if;
  res := public.log_app_error(repeat('6', 32), 'js_error', 'client', 'error', 'x', 'm', null, null, null, null, null, null, null);
  if (res ->> 'logged')::boolean or res ->> 'reason' <> 'rate' then raise exception 'FAIL tope global: %', res; end if;
  -- el origen 'server' tiene su propio contador
  res := public.log_app_error(repeat('7', 32), 'payment', 'server', 'info', 'x', 'm', null, null, null, null, null, null, null);
  if (res ->> 'logged')::boolean is not true then raise exception 'FAIL tope global separado: %', res; end if;
  passed := passed + 1;

  -- 15) err_rate_hit: respeta el límite y reinicia al vencer la ventana
  if not public.err_rate_hit('t:x', 2, 60) or not public.err_rate_hit('t:x', 2, 60) or public.err_rate_hit('t:x', 2, 60) then raise exception 'FAIL err_rate_hit limite'; end if;
  update public.app_error_rate set window_start = now() - interval '2 minutes' where bucket = 't:x';
  if not public.err_rate_hit('t:x', 2, 60) then raise exception 'FAIL err_rate_hit ventana'; end if;
  passed := passed + 1;

  -- 16) Resumen de 24 h
  res := public.app_error_digest();
  if (res ->> 'events_24h')::int < 1 or jsonb_typeof(res -> 'top') <> 'array' then raise exception 'FAIL digest: %', res; end if;
  passed := passed + 1;

  raise exception 'TODO_OK: % grupos de pruebas pasaron (transaccion revertida, sin correos ni filas)', passed;
end
$test$;
