-- ============================================================
-- Riso · fase 1: métricas agregadas (PENDIENTE, no aplicada en producción).
-- Qué capa respondió (código, biblioteca, FAQ, caché, IA, filtro, conversación, aviso), intención, tema, tiempo,
-- tokens, neuronas, aciertos de caché y valoraciones negativas.
-- PRIVACIDAD: solo contadores por día. Nunca se guarda el texto de la pregunta ni de la respuesta, ni ids de alumno,
-- ni datos personales. El «tema» solo acepta identificadores cortos del propio sitio (ficha, glosario, herramienta,
-- tema de ejercicio); cualquier otra cosa se guarda como 'otro'.
-- Quién escribe:
--   riso_metricas_lote(lote)   el navegador, con sesión y solo cuentas habilitadas para Riso: respuestas locales (sin IA).
--   riso_metrica_ia(...)       solo el servidor (service_role): respuestas de Gemma con tokens y neuronas reales.
--   riso_valorar(...)          el navegador, con sesión: «No me ayudó».
--   riso_metricas_resumen(...) solo el servidor/administración: informe agregado.
-- Depende de 20261128_riso_chat_piloto.sql (riso_chat_status).
-- ============================================================

create table if not exists public.riso_metricas_diarias (
  day date not null,
  capa text not null check (capa in ('codigo', 'biblioteca', 'faq', 'cache', 'ia', 'filtro', 'conversacion', 'aviso')),
  intencion text not null check (intencion in ('traduccion', 'significado', 'pronunciacion', 'conjugacion', 'explicacion', 'correccion', 'seguimiento', 'ejercicio', 'otra')),
  tema text not null check (tema ~ '^[a-z0-9][a-z0-9:-]{0,59}$'),
  n int not null default 0 check (n >= 0),
  ms_total bigint not null default 0 check (ms_total >= 0),
  ms_hasta_1s int not null default 0,
  ms_1_a_3s int not null default 0,
  ms_3_a_6s int not null default 0,
  ms_mas_6s int not null default 0,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  neuronas numeric not null default 0,
  cache_hits int not null default 0,
  fallos int not null default 0,
  votos_neg int not null default 0,
  primary key (day, capa, intencion, tema)
);
alter table public.riso_metricas_diarias enable row level security;
revoke all on public.riso_metricas_diarias from anon, authenticated;

-- Normalización interna: valores desconocidos nunca se guardan tal cual.
create or replace function public.riso_metricas_norm_intencion(p text) returns text language sql immutable as $$
  select case when p in ('traduccion', 'significado', 'pronunciacion', 'conjugacion', 'explicacion', 'correccion', 'seguimiento', 'ejercicio', 'otra') then p else 'otra' end;
$$;
create or replace function public.riso_metricas_norm_tema(p text) returns text language sql immutable as $$
  select case when p ~ '^[a-z0-9][a-z0-9:-]{0,59}$' then p else 'otro' end;
$$;

-- Suma interna (no se expone a nadie).
create or replace function public.riso_metricas_sumar(p_capa text, p_intencion text, p_tema text, p_ms int, p_in int, p_out int, p_neur numeric, p_cache boolean, p_fallo boolean, p_neg boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ms int := least(greatest(coalesce(p_ms, 0), 0), 60000);
  v_cuenta int := case when p_neg then 0 else 1 end;
begin
  insert into public.riso_metricas_diarias as m (day, capa, intencion, tema, n, ms_total, ms_hasta_1s, ms_1_a_3s, ms_3_a_6s, ms_mas_6s, tokens_in, tokens_out, neuronas, cache_hits, fallos, votos_neg)
  values ((now() at time zone 'utc')::date, p_capa, public.riso_metricas_norm_intencion(p_intencion), public.riso_metricas_norm_tema(p_tema),
    v_cuenta, case when p_neg then 0 else v_ms end,
    case when not p_neg and v_ms <= 1000 then 1 else 0 end, case when not p_neg and v_ms > 1000 and v_ms <= 3000 then 1 else 0 end,
    case when not p_neg and v_ms > 3000 and v_ms <= 6000 then 1 else 0 end, case when not p_neg and v_ms > 6000 then 1 else 0 end,
    greatest(coalesce(p_in, 0), 0), greatest(coalesce(p_out, 0), 0), greatest(coalesce(p_neur, 0), 0),
    case when p_cache then 1 else 0 end, case when p_fallo then 1 else 0 end, case when p_neg then 1 else 0 end)
  on conflict (day, capa, intencion, tema) do update set
    n = m.n + excluded.n, ms_total = m.ms_total + excluded.ms_total,
    ms_hasta_1s = m.ms_hasta_1s + excluded.ms_hasta_1s, ms_1_a_3s = m.ms_1_a_3s + excluded.ms_1_a_3s,
    ms_3_a_6s = m.ms_3_a_6s + excluded.ms_3_a_6s, ms_mas_6s = m.ms_mas_6s + excluded.ms_mas_6s,
    tokens_in = m.tokens_in + excluded.tokens_in, tokens_out = m.tokens_out + excluded.tokens_out, neuronas = m.neuronas + excluded.neuronas,
    cache_hits = m.cache_hits + excluded.cache_hits, fallos = m.fallos + excluded.fallos, votos_neg = m.votos_neg + excluded.votos_neg;
end;
$$;

-- Navegador: lote de respuestas resueltas SIN IA (máximo 50 por llamada), incluidas las repetidas que salen de su caché
-- de sesión (costo cero). Las respuestas nuevas de Gemma solo las cuenta el servidor, con tokens y neuronas reales.
create or replace function public.riso_metricas_lote(p_lote jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  e jsonb; v_ok int := 0;
begin
  if v_user is null then return 0; end if;
  if coalesce((public.riso_chat_status(v_user)->>'enabled')::boolean, false) is not true then return 0; end if;
  if p_lote is null or jsonb_typeof(p_lote) <> 'array' then return 0; end if;
  for e in select value from jsonb_array_elements(p_lote) limit 50 loop
    if jsonb_typeof(e) = 'object' and (e->>'c') in ('codigo', 'biblioteca', 'faq', 'cache', 'filtro', 'conversacion', 'aviso') then
      perform public.riso_metricas_sumar(e->>'c', e->>'i', e->>'t',
        case when (e->>'ms') ~ '^\d{1,6}$' then (e->>'ms')::int else 0 end, 0, 0, 0, (e->>'c') = 'cache', false, false);
      v_ok := v_ok + 1;
    end if;
  end loop;
  return v_ok;
end;
$$;

-- Servidor: una respuesta de Gemma (o de la caché, cuando exista) con tokens y neuronas reales.
create or replace function public.riso_metrica_ia(p_intencion text, p_tema text, p_ms int, p_in int, p_out int, p_neur numeric, p_ok boolean, p_cache boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.riso_metricas_sumar(case when p_cache then 'cache' else 'ia' end, p_intencion, p_tema, p_ms,
    least(greatest(coalesce(p_in, 0), 0), 100000), least(greatest(coalesce(p_out, 0), 0), 100000), least(greatest(coalesce(p_neur, 0), 0), 1000),
    p_cache, not coalesce(p_ok, false), false);
end;
$$;

-- Navegador: «No me ayudó» sobre una respuesta (sin texto ni alumno; solo suma un voto negativo a esa capa, intención y tema).
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

-- Informe agregado (servidor y administración): totales por capa, latencia, costo y lo más preguntado.
create or replace function public.riso_metricas_resumen(p_desde date default ((now() at time zone 'utc')::date - 6), p_hasta date default (now() at time zone 'utc')::date)
returns jsonb language sql stable security definer set search_path = public as $$
  with base as (select * from public.riso_metricas_diarias where day between p_desde and p_hasta),
  tot as (select coalesce(sum(n), 0) n from base),
  por_capa as (
    select capa, sum(n) n, sum(ms_total) ms, sum(ms_hasta_1s) a, sum(ms_1_a_3s) b, sum(ms_3_a_6s) c, sum(ms_mas_6s) d,
      sum(tokens_in) tin, sum(tokens_out) tout, sum(neuronas) neur, sum(cache_hits) ch, sum(fallos) fa, sum(votos_neg) neg
    from base group by capa)
  select jsonb_build_object(
    'desde', p_desde, 'hasta', p_hasta, 'preguntas', (select n from tot),
    'capas', coalesce((select jsonb_object_agg(capa, jsonb_build_object(
        'n', n, 'pct', case when (select n from tot) > 0 then round(n * 100.0 / (select n from tot), 1) else 0 end,
        'ms_promedio', case when n > 0 then round(ms::numeric / n) else 0 end,
        'ms', jsonb_build_object('hasta_1s', a, '1_a_3s', b, '3_a_6s', c, 'mas_6s', d),
        'tokens_in', tin, 'tokens_out', tout, 'neuronas', round(neur, 2),
        'neuronas_por_respuesta', case when n > 0 then round(neur / n, 2) else 0 end,
        'usd_si_se_pagara', round(neur * 0.011 / 1000, 4), 'cache_hits', ch, 'fallos', fa, 'votos_neg', neg)) from por_capa), '{}'::jsonb),
    'temas_frecuentes', coalesce((select jsonb_agg(x) from (select jsonb_build_object('capa', capa, 'intencion', intencion, 'tema', tema, 'n', sum(n), 'votos_neg', sum(votos_neg)) x
        from base group by capa, intencion, tema order by sum(n) desc limit 20) t), '[]'::jsonb),
    'revisar', coalesce((select jsonb_agg(x) from (select jsonb_build_object('capa', capa, 'intencion', intencion, 'tema', tema, 'votos_neg', sum(votos_neg), 'n', sum(n)) x
        from base group by capa, intencion, tema having sum(votos_neg) > 0 order by sum(votos_neg) desc limit 20) t), '[]'::jsonb));
$$;

revoke all on function public.riso_metricas_norm_intencion(text) from public, anon, authenticated;
revoke all on function public.riso_metricas_norm_tema(text) from public, anon, authenticated;
revoke all on function public.riso_metricas_sumar(text, text, text, int, int, int, numeric, boolean, boolean, boolean) from public, anon, authenticated;
revoke all on function public.riso_metricas_lote(jsonb) from public, anon;
revoke all on function public.riso_metrica_ia(text, text, int, int, int, numeric, boolean, boolean) from public, anon, authenticated;
revoke all on function public.riso_valorar(text, text, text) from public, anon;
revoke all on function public.riso_metricas_resumen(date, date) from public, anon, authenticated;
grant execute on function public.riso_metricas_lote(jsonb) to authenticated;
grant execute on function public.riso_valorar(text, text, text) to authenticated;
grant execute on function public.riso_metrica_ia(text, text, int, int, int, numeric, boolean, boolean) to service_role;
grant execute on function public.riso_metricas_resumen(date, date) to service_role;
