#!/usr/bin/env bash
# Respaldo COMPLETO (esquema + datos) de Supabase y verificacion de que se puede restaurar. Solo LEE la base.
# Uso:   SUPABASE_DB_URL='postgresql://postgres.<ref>:<CONTRASENA>@aws-0-<region>.pooler.supabase.com:5432/postgres' bash tools/respaldo_supabase.sh
# La URL (Supabase > Connect > Session pooler) lleva la contrasena de la base: NO se guarda en ningun archivo ni se imprime.
# El respaldo queda FUERA del repositorio: ~/respaldos-supabase/<fecha>/  (contiene datos personales: no subir a ningun lado).
# Necesita pg_dump/pg_restore/psql de PostgreSQL 17 (Supabase usa 17) o Docker (se usa la imagen postgres:17).
set -euo pipefail
: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL (ver instrucciones arriba)}"
OUT="${RESPALDO_DIR:-$HOME/respaldos-supabase}/$(date +%Y%m%d-%H%M%S)"; mkdir -p "$OUT"; chmod 700 "$OUT"
run(){ # run <comando> ...  usa el cliente local si es v17+, si no Docker
  local c="$1"; shift
  if command -v "$c" >/dev/null && [ "$("$c" --version | grep -oE '[0-9]+' | head -1)" -ge 17 ]; then "$c" "$@"
  elif command -v docker >/dev/null; then docker run --rm -i --network host -v "$OUT:$OUT" -e PGOPTIONS postgres:17 "$c" "$@"
  else echo "Necesito $c version 17 o Docker" >&2; return 1; fi; }
echo "1/4 Esquema (public, auth, storage, extensiones) ..."
run pg_dump --no-owner --no-privileges --schema-only --schema=public --schema=auth --schema=storage -f "$OUT/esquema.sql" "$SUPABASE_DB_URL"
echo "2/4 Datos completos (formato comprimido, restaurable) ..."
run pg_dump --no-owner --no-privileges -Fc --schema=public --schema=auth --schema=storage -f "$OUT/datos.dump" "$SUPABASE_DB_URL"
echo "3/4 Conteos de las tablas clave en la base real ..."
for t in public.profiles public.progress_sessions public.mistake_stats auth.users; do
  n=$(run psql -At -c "select count(*) from $t" "$SUPABASE_DB_URL"); echo "$t=$n" >> "$OUT/conteos_originales.txt"; done
cat "$OUT/conteos_originales.txt"
echo "4/4 Verificando que el respaldo es legible y completo ..."
run pg_restore --list "$OUT/datos.dump" > "$OUT/contenido.txt"
for t in profiles progress_sessions mistake_stats; do grep -q "TABLE DATA public $t " "$OUT/contenido.txt" || { echo "FALTA la tabla $t en el respaldo" >&2; exit 1; }; done
# Restauracion de prueba en una base temporal LOCAL (si hay Docker): compara conteos con la original
if command -v docker >/dev/null; then
  NAME="verif-respaldo-$$"; docker run -d --rm --name "$NAME" -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:17 >/dev/null
  trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT
  until docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done; sleep 2
  docker exec "$NAME" psql -U postgres -qc "create role anon; create role authenticated; create role service_role; create role authenticator; create role supabase_admin; create role supabase_auth_admin; create role supabase_storage_admin; create role dashboard_user;" >/dev/null 2>&1 || true
  docker exec -i "$NAME" pg_restore -U postgres -d postgres --no-owner --no-privileges --exit-on-error < "$OUT/datos.dump" 2>"$OUT/restauracion_errores.txt" || echo "(avisos de restauracion en restauracion_errores.txt)"
  ok=1; while IFS== read -r t n; do m=$(docker exec "$NAME" psql -U postgres -At -c "select count(*) from $t"); [ "$m" = "$n" ] && echo "  igual  $t = $m" || { echo "  DISTINTO $t original=$n restaurado=$m"; ok=0; }; done < "$OUT/conteos_originales.txt"
  [ $ok = 1 ] && echo "RESPALDO VERIFICADO: se restauro en una base temporal y los conteos coinciden." || { echo "RESPALDO NO VERIFICADO" >&2; exit 1; }
else
  echo "Sin Docker no se hizo la restauracion de prueba: respaldo legible, pero NO verificado por restauracion."
fi
echo "Respaldo guardado en: $OUT"; ls -la "$OUT" | awk '{print $5, $9}'
