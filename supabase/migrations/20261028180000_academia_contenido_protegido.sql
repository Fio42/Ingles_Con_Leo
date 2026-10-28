-- Contenido premium de la Academia entregado solo a miembros (lecciones, ejercicios, practica y audio).
-- NO se aplica en produccion hasta que Leo lo autorice. No toca pagos, progreso, examenes, insignias ni demostraciones.
-- Solo afecta a cursos con fila en academia_content (hoy: ninguno; Curso 3 'articulos' al lanzarlo). TO BE y Pronombres siguen igual.

do $$
begin
  if to_regclass('public.academia_courses') is null or to_regprocedure('public.academia_is_member(uuid)') is null then
    raise exception 'academia_contenido: falta la integracion de la Academia (academia_courses / academia_is_member). No se aplica nada.';
  end if;
end
$$;

-- ---------- Contenido (solo lo lee la funcion de abajo; el navegador no tiene acceso directo) ----------
create table if not exists public.academia_content (
  course_id text primary key references public.academia_courses(course_id),
  version int not null default 1,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.academia_content enable row level security;
drop policy if exists "academia_content: sin acceso directo" on public.academia_content;
revoke all on public.academia_content from anon, authenticated;

-- ---------- Entrega ----------
-- Devuelve el contenido solo si: hay sesion, el curso existe y esta habilitado, y la membresia esta vigente en el servidor.
-- Nunca lee datos de membresia del navegador. Cancelada pero vigente = is_member sigue en true hasta que vence.
create or replace function public.academia_get_content(p_course text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r public.academia_content%rowtype;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'auth'); end if;
  if not exists (select 1 from public.academia_courses where course_id = p_course and enabled) then
    return jsonb_build_object('ok', false, 'error', 'course');
  end if;
  if not public.academia_is_member(uid) then return jsonb_build_object('ok', false, 'error', 'members'); end if;
  select * into r from public.academia_content where course_id = p_course;
  if not found then return jsonb_build_object('ok', false, 'error', 'none'); end if;
  return jsonb_build_object('ok', true, 'version', r.version, 'content', r.content);
end;
$$;
revoke all on function public.academia_get_content(text) from public, anon;
grant execute on function public.academia_get_content(text) to authenticated;

-- ---------- Audio privado ----------
-- Regla unica de acceso a un archivo del bucket: la carpeta es el curso ('<curso>/<hash>.mp3').
create or replace function public.academia_audio_allowed(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and public.academia_is_member(auth.uid())
     and exists (select 1 from public.academia_content k
                   join public.academia_courses c on c.course_id = k.course_id and c.enabled
                  where k.course_id = split_part(p_name, '/', 1))
$$;
revoke all on function public.academia_audio_allowed(text) from public, anon;
grant execute on function public.academia_audio_allowed(text) to authenticated;

-- El bucket y su politica solo existen en Supabase real (no en la base de pruebas local).
do $$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('academia-audio', 'academia-audio', false, 2097152, array['audio/mpeg'])
    on conflict (id) do update set public = false;
    execute 'drop policy if exists "academia_audio: miembros" on storage.objects';
    execute $p$create policy "academia_audio: miembros" on storage.objects for select to authenticated
      using (bucket_id = 'academia-audio' and public.academia_audio_allowed(name))$p$;
  end if;
end
$$;
