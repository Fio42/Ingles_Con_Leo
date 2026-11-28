-- Reversión de 20261128b_riso_metricas.sql: quita las métricas de Riso sin tocar el chat ni Leo AI.
drop function if exists public.riso_metricas_resumen(date, date);
drop function if exists public.riso_valorar(text, text, text);
drop function if exists public.riso_metrica_ia(text, text, int, int, int, numeric, boolean, boolean);
drop function if exists public.riso_metricas_lote(jsonb);
drop function if exists public.riso_metricas_sumar(text, text, text, int, int, int, numeric, boolean, boolean, boolean);
drop function if exists public.riso_metricas_norm_tema(text);
drop function if exists public.riso_metricas_norm_intencion(text);
drop table if exists public.riso_metricas_diarias;
