-- Riso · corrección PENDIENTE (no aplicada): fija el search_path de las dos funciones internas de normalización de
-- métricas, como pide el aviso «function_search_path_mutable» de Supabase. Solo comparan texto con valores fijos y no
-- leen tablas, así que con search_path vacío se comportan igual. No cambia permisos ni datos.
alter function public.riso_metricas_norm_intencion(text) set search_path = '';
alter function public.riso_metricas_norm_tema(text) set search_path = '';
