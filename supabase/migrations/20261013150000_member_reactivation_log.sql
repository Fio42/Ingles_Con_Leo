-- Bitácora auditable de la reactivación de miembros de pago (secuencia 14/35/56).
-- Solo la usa la Edge Function con la llave de servicio: RLS activado, sin políticas
-- y sin permisos para anon/authenticated. Aditiva: no toca pagos, auth ni progreso.
create table if not exists public.member_reactivation_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event text not null check (event in ('sent', 'skipped', 'cancelled_returned', 'clicked')),
  step smallint,
  kind text,
  reason text,
  detail jsonb not null default '{}'::jsonb,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index if not exists member_reactivation_log_event_created_idx
  on public.member_reactivation_log (event, created_at desc);
alter table public.member_reactivation_log enable row level security;
revoke all on table public.member_reactivation_log from anon, authenticated;

-- Resultados simples: enviado, primer clic y regreso real a practicar (una
-- sesión nueva en progress_sessions DESPUÉS del envío). Abrir el correo no
-- cuenta como regreso.
create or replace view public.member_reactivation_results
with (security_invoker = true) as
select
  l.user_id,
  l.step,
  l.kind,
  l.created_at as sent_at,
  (select min(c.created_at) from public.member_reactivation_log c
     where c.user_id = l.user_id and c.event = 'clicked' and c.step = l.step and c.created_at >= l.created_at) as first_click_at,
  (select min(s.created_at) from public.progress_sessions s
     where s.user_id = l.user_id and s.created_at > l.created_at) as returned_at
from public.member_reactivation_log l
where l.event = 'sent';
revoke all on table public.member_reactivation_results from anon, authenticated;
