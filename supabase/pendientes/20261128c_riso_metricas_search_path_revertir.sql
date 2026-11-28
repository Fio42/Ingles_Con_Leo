-- Reversión de 20261128c_riso_metricas_search_path.sql: vuelve al estado anterior (sin search_path fijo).
alter function public.riso_metricas_norm_intencion(text) reset search_path;
alter function public.riso_metricas_norm_tema(text) reset search_path;
