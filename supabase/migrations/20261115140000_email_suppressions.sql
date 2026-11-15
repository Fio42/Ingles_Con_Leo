-- Bloqueo por DIRECCION de correo (2026-11-15). Reemplaza la pausa de 14 dias por cuenta.
-- email_suppressions: una fila por correo (minusculas). El webhook de Resend la llena.
--   transient_bounce  -> pausa sin vencimiento de marketing/reactivacion/racha/encuestas/seguimientos
--   permanent_bounce / complaint / suppressed -> ademas marca email_invalid en las cuentas con ese correo
-- Los flujos criticos (confirmacion, recuperacion, pagos, libro) NO miran la pausa.
-- Reversible: delete from public.email_suppressions where email = 'a@b.com';
create table if not exists public.email_suppressions (
  email text primary key check (email = lower(btrim(email))),
  reason text not null check (reason in ('transient_bounce','permanent_bounce','complaint','suppressed')),
  event_id text,
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
revoke all on public.email_suppressions from anon, authenticated;

-- Sincroniza las cuentas existentes cuando cambia la tabla. "Sin vencimiento" = 9999-12-31.
create or replace function public.email_suppressions_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.reason = 'transient_bounce' then
      update public.profiles set email_paused_until = null
       where lower(btrim(email)) = old.email and email_paused_until = timestamptz '9999-12-31 00:00:00+00';
    end if;
    return old;
  end if;
  if new.reason = 'transient_bounce' then
    update public.profiles set email_paused_until = timestamptz '9999-12-31 00:00:00+00'
     where lower(btrim(email)) = new.email;
  else
    update public.profiles set email_invalid = true, email_invalid_at = coalesce(email_invalid_at, now())
     where lower(btrim(email)) = new.email and email_invalid = false;
  end if;
  return new;
end $$;
drop trigger if exists email_suppressions_sync on public.email_suppressions;
create trigger email_suppressions_sync after insert or update or delete on public.email_suppressions
  for each row execute function public.email_suppressions_sync();

-- El bloqueo sigue al correo: una cuenta nueva o que cambia a ese correo nace bloqueada.
-- Nunca rompe el registro: cualquier error se ignora.
create or replace function public.profiles_apply_email_suppression() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  begin
    if new.email is not null and (tg_op = 'INSERT' or new.email is distinct from old.email) then
      select reason into r from public.email_suppressions where email = lower(btrim(new.email));
      if r = 'transient_bounce' then
        new.email_paused_until := timestamptz '9999-12-31 00:00:00+00';
      elsif r is not null then
        new.email_invalid := true;
        new.email_invalid_at := coalesce(new.email_invalid_at, now());
      elsif tg_op = 'UPDATE' and old.email_paused_until = timestamptz '9999-12-31 00:00:00+00' then
        new.email_paused_until := null;
      end if;
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;
drop trigger if exists profiles_apply_email_suppression on public.profiles;
create trigger profiles_apply_email_suppression before insert or update of email on public.profiles
  for each row execute function public.profiles_apply_email_suppression();
