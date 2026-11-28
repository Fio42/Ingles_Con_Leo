-- ============================================================
-- Riso · caché compartida de respuestas genéricas (PENDIENTE, no aplicada en producción). APAGADA al aplicarla:
-- leo_ai_config.riso_cache = false hasta que Leo la encienda.
-- Qué guarda: solo preguntas sueltas de inglés (traducción, significado, pronunciación, explicación) SIN ejercicio, SIN
-- conversación previa y SIN datos personales (el servidor lo comprueba antes de llamar aquí), con la pregunta
-- NORMALIZADA (minúsculas, sin tildes ni signos) y la respuesta ya validada. Nunca el id del alumno.
-- Para qué: si otro alumno pregunta lo mismo, la respuesta sale de aquí (0 neuronas, al instante).
-- No es la biblioteca oficial: Leo revisa (riso_cache_revisar), aprueba (riso_cache_aprobar) o retira
-- (riso_cache_retirar). Un «No me ayudó» sobre una respuesta de la caché la retira sola, salvo que Leo la haya aprobado.
-- Solo el servidor (service_role) lee y escribe. Depende de 20261128030634_riso_metricas.sql (reemplaza riso_valorar).
-- ============================================================

alter table public.leo_ai_config add column if not exists riso_cache boolean not null default false;
alter table public.leo_ai_config add column if not exists riso_cache_max int not null default 20000;

create table if not exists public.riso_cache (
  clave text primary key check (clave ~ '^[0-9a-f]{16}$'),
  intencion text not null check (intencion in ('traduccion', 'significado', 'pronunciacion', 'explicacion')),
  pregunta text not null check (char_length(pregunta) between 1 and 200),
  texto text not null check (char_length(texto) between 8 and 700),
  ejemplo_en text not null default '' check (char_length(ejemplo_en) <= 200),
  ejemplo_es text not null default '' check (char_length(ejemplo_es) <= 200),
  estado text not null default 'activa' check (estado in ('activa', 'aprobada', 'retirada')),
  usos int not null default 0,
  votos_neg int not null default 0,
  creada timestamptz not null default now(),
  ultima_vez timestamptz
);
alter table public.riso_cache enable row level security;
revoke all on public.riso_cache from anon, authenticated;

-- Servidor: busca una respuesta para esta clave (solo si la caché está encendida y la respuesta no fue retirada).
create or replace function public.riso_cache_buscar(p_clave text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.riso_cache;
begin
  if not coalesce((select riso_cache from public.leo_ai_config where id), false) then return null; end if;
  update public.riso_cache set usos = usos + 1, ultima_vez = now()
    where clave = p_clave and estado in ('activa', 'aprobada') returning * into r;
  if not found then return null; end if;
  return jsonb_build_object('texto', r.texto, 'ejemplo_en', r.ejemplo_en, 'ejemplo_es', r.ejemplo_es, 'estado', r.estado);
end;
$$;

-- Servidor: guarda una respuesta nueva (no reemplaza una existente; respeta el tope de filas).
create or replace function public.riso_cache_guardar(p_clave text, p_intencion text, p_pregunta text, p_texto text, p_ejemplo_en text, p_ejemplo_es text)
returns text language plpgsql security definer set search_path = public as $$
declare v_max int;
begin
  select case when riso_cache then riso_cache_max else 0 end into v_max from public.leo_ai_config where id;
  if coalesce(v_max, 0) <= 0 then return 'off'; end if;
  if (select count(*) from public.riso_cache) >= v_max then return 'full'; end if;
  insert into public.riso_cache (clave, intencion, pregunta, texto, ejemplo_en, ejemplo_es)
    values (p_clave, p_intencion, left(p_pregunta, 200), left(p_texto, 700), left(coalesce(p_ejemplo_en, ''), 200), left(coalesce(p_ejemplo_es, ''), 200))
    on conflict (clave) do nothing;
  return 'ok';
end;
$$;

-- Leo (administración): lo más usado y lo que recibió votos negativos, para revisar, aprobar o retirar.
create or replace function public.riso_cache_revisar(p_estado text default null, p_limite int default 100)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('clave', clave, 'intencion', intencion, 'pregunta', pregunta, 'texto', texto,
    'ejemplo_en', ejemplo_en, 'ejemplo_es', ejemplo_es, 'estado', estado, 'usos', usos, 'votos_neg', votos_neg, 'creada', creada) order by votos_neg desc, usos desc), '[]'::jsonb)
  from (select * from public.riso_cache where p_estado is null or estado = p_estado order by votos_neg desc, usos desc limit least(greatest(coalesce(p_limite, 100), 1), 500)) t;
$$;
create or replace function public.riso_cache_aprobar(p_clave text)
returns text language sql security definer set search_path = public as $$
  update public.riso_cache set estado = 'aprobada' where clave = p_clave returning 'ok';
$$;
create or replace function public.riso_cache_retirar(p_clave text)
returns text language sql security definer set search_path = public as $$
  update public.riso_cache set estado = 'retirada' where clave = p_clave returning 'ok';
$$;

-- «No me ayudó»: igual que antes y, si el voto es sobre una respuesta de la caché, la retira (salvo aprobada por Leo).
create or replace function public.riso_valorar(p_capa text, p_intencion text, p_tema text)
returns text language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then return 'no_session'; end if;
  if coalesce((public.riso_chat_status(v_user)->>'enabled')::boolean, false) is not true then return 'not_allowed'; end if;
  if p_capa not in ('codigo', 'biblioteca', 'faq', 'cache', 'ia') then return 'bad_capa'; end if;
  perform public.riso_metricas_sumar(p_capa, p_intencion, p_tema, 0, 0, 0, 0, false, false, true);
  if p_capa = 'cache' and p_tema ~ '^cache:[0-9a-f]{16}$' then
    update public.riso_cache set votos_neg = votos_neg + 1, estado = case when estado = 'aprobada' then estado else 'retirada' end
      where clave = substr(p_tema, 7);
  end if;
  return 'ok';
end;
$$;

revoke all on function public.riso_cache_buscar(text) from public, anon, authenticated;
revoke all on function public.riso_cache_guardar(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.riso_cache_revisar(text, int) from public, anon, authenticated;
revoke all on function public.riso_cache_aprobar(text) from public, anon, authenticated;
revoke all on function public.riso_cache_retirar(text) from public, anon, authenticated;
revoke all on function public.riso_valorar(text, text, text) from public, anon;
grant execute on function public.riso_cache_buscar(text) to service_role;
grant execute on function public.riso_cache_guardar(text, text, text, text, text, text) to service_role;
grant execute on function public.riso_cache_revisar(text, int) to service_role;
grant execute on function public.riso_cache_aprobar(text) to service_role;
grant execute on function public.riso_cache_retirar(text) to service_role;
grant execute on function public.riso_valorar(text, text, text) to authenticated;
