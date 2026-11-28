-- Reversión completa del piloto de Riso (PENDIENTE: solo con autorización). Deja Leo AI exactamente como antes.
update public.leo_ai_config set chat_enabled = false;                 -- apaga al instante, sin borrar nada
drop trigger if exists ai_budget_alert_trg on public.ai_usage_daily;
drop function if exists public.ai_budget_alert_check();
drop function if exists public.riso_chat_finish(uuid, text, boolean, int, int, numeric, jsonb);
drop function if exists public.riso_chat_reserve(uuid, text, numeric);
drop function if exists public.ai_neurons_today(date);
drop function if exists public.riso_registrar_intento(text, text);
drop function if exists public.riso_chat_status(uuid);
drop function if exists public.riso_intento_valido(uuid, text, text);
drop table if exists public.riso_intentos, public.riso_items;
drop table if exists public.ai_budget_alerts, public.riso_chat_requests, public.riso_chat_usage, public.riso_pilot_testers;
alter table public.leo_ai_config drop column if exists chat_enabled, drop column if exists chat_pilot_only,
  drop column if exists chat_member_daily, drop column if exists chat_free_daily, drop column if exists chat_global_daily,
  drop column if exists chat_pilot_total, drop column if exists riso_neuron_budget, drop column if exists free_neurons_daily,
  drop column if exists riso_ceiling_pct, drop column if exists allow_paid, drop column if exists paid_daily_neurons,
  drop column if exists alert_pcts;
delete from public.ai_usage_daily where provider = 'riso_reserved';  -- las neuronas reales de Riso (cloudflare:riso) se conservan como historial
