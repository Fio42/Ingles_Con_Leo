-- Señal fiable para los correos de práctica gratis.
-- La policy existente ya limita la actualización a la propia fila; este grant
-- limita la nueva columna a usuarios autenticados. Los invitados no tienen
-- sesión y no pueden escribir profiles.
alter table public.profiles add column if not exists free_last_practice_at timestamptz;

grant update (free_last_practice_at) on public.profiles to authenticated;
