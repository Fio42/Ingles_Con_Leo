-- ============================================================
-- LeoBot: capturas de pantalla en los reportes + topes contra abuso (2026-11-21)
--
-- Todo es aditivo: no toca ninguna fila existente y se puede volver a correr sin problema.
--
-- 1. Bucket PRIVADO "leobot-reports" (max 4 MB, solo jpeg/png/webp). Nadie puede LEER, LISTAR, ACTUALIZAR
--    ni BORRAR sus archivos desde el navegador: solo se ven con la Edge Function leobot-notify (link
--    firmado de 14 dias en el correo a Leo) o desde Supabase -> Storage.
-- 2. SUBIR una captura solo se permite a la ruta <id-del-reporte>/captura.jpg y solo si ese reporte
--    existe en leobot_reports, se creo hace menos de 10 minutos y es de esta misma persona (si el
--    reporte tiene user_id, tiene que ser la sesion que lo creo). Como la ruta es fija y no hay
--    politica de actualizacion, cada reporte admite UNA sola imagen. El id es un uuid que solo conoce
--    quien creo el reporte (nadie puede leer reportes desde el navegador).
-- 3. Tope contra abuso en el INSERT del reporte (que es la puerta de todo: sin reporte no hay subida
--    ni correo): maximo 8 reportes por hora por IP, 8 por hora por usuario y 200 por hora en total.
--    Se guarda solo un hash de la IP (ip_hash), nunca la IP.
-- 4. leobot-notify avisa UNA sola vez por reporte (notified_at) y solo de reportes recientes.
-- 5. Tope de tamano al "context" (datos tecnicos de la sesion).
--
-- Si esto aun no se corrio, el sitio sigue funcionando: el reporte llega igual, solo sin la captura.
--
-- Rollback manual (si hiciera falta):
--   drop policy if exists "leobot_capturas: subir" on storage.objects;
--   drop function if exists public.leobot_can_attach(text);
--   drop trigger if exists leobot_reports_limit on public.leobot_reports;
--   drop function if exists public.leobot_reports_limit();
--   delete from storage.objects where bucket_id = 'leobot-reports';  delete from storage.buckets where id = 'leobot-reports';
-- ============================================================

alter table public.leobot_reports add column if not exists ip_hash text;
alter table public.leobot_reports add column if not exists notified_at timestamptz;
create index if not exists leobot_reports_ip_idx on public.leobot_reports (ip_hash, created_at desc);
create index if not exists leobot_reports_user_idx on public.leobot_reports (user_id, created_at desc) where user_id is not null;

-- ---- Tope por IP / usuario / total en cada reporte nuevo ----
-- SECURITY DEFINER para poder CONTAR filas aunque quien inserta (anon) no pueda leer la tabla.
create or replace function public.leobot_reports_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  hdrs json;
  ip text;
begin
  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then
    hdrs := null;
  end;
  -- cf-connecting-ip lo pone Cloudflare (no se puede falsificar desde el navegador); x-forwarded-for solo es respaldo.
  ip := trim(coalesce(hdrs ->> 'cf-connecting-ip', split_part(coalesce(hdrs ->> 'x-forwarded-for', ''), ',', 1), ''));
  new.ip_hash := case when ip <> '' then md5('leobot:' || ip) else null end;
  new.notified_at := null;   -- solo la Edge Function (service_role) marca el aviso

  if (select count(*) from public.leobot_reports where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'leobot_rate_limited' using errcode = 'P0001';
  end if;
  if new.ip_hash is not null
     and (select count(*) from public.leobot_reports where ip_hash = new.ip_hash and created_at > now() - interval '1 hour') >= 8 then
    raise exception 'leobot_rate_limited' using errcode = 'P0001';
  end if;
  if new.user_id is not null
     and (select count(*) from public.leobot_reports where user_id = new.user_id and created_at > now() - interval '1 hour') >= 8 then
    raise exception 'leobot_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end
$$;
revoke all on function public.leobot_reports_limit() from public, anon, authenticated;

drop trigger if exists leobot_reports_limit on public.leobot_reports;
create trigger leobot_reports_limit
  before insert on public.leobot_reports
  for each row execute function public.leobot_reports_limit();

-- ---- Quien puede adjuntar una imagen a un reporte ----
create or replace function public.leobot_can_attach(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.leobot_reports r
     where r.id::text = split_part(p_name, '/', 1)
       and r.created_at > now() - interval '10 minutes'
       and (r.user_id is null or r.user_id = auth.uid())
  )
$$;
revoke all on function public.leobot_can_attach(text) from public;
grant execute on function public.leobot_can_attach(text) to anon, authenticated;

-- El bucket y su politica solo existen en Supabase real (no en la base de pruebas local).
do $$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('leobot-reports', 'leobot-reports', false, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do update
      set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

    execute 'drop policy if exists "leobot_capturas: subir" on storage.objects';
    execute $p$create policy "leobot_capturas: subir" on storage.objects for insert to anon, authenticated
      with check (
        bucket_id = 'leobot-reports'
        and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/captura\.jpg$'
        and public.leobot_can_attach(name)
      )$p$;
    -- A proposito NO hay politica de select, update ni delete para usuarios normales.
  end if;
end
$$;

-- Misma politica de insercion de siempre, mas un tope al tamano del "context".
drop policy if exists "leobot_reports: insert" on public.leobot_reports;
create policy "leobot_reports: insert" on public.leobot_reports
  for insert with check (
    char_length(message) > 0 and char_length(message) <= 2000
    and (page_url is null or char_length(page_url) <= 500)
    and (email is null or char_length(email) <= 200)
    and (user_id is null or auth.uid() = user_id)
    and (context is null or pg_column_size(context) <= 20000)
  );
