#!/usr/bin/env node
/* ============================================================
   Inglés con Leo — Módulo OPCIONAL de Google Search Console
   ------------------------------------------------------------
   Esto NO se ejecuta todavía. audit.js no lo llama y el workflow
   de GitHub Actions tampoco. Queda preparado para cuando Leo
   quiera activarlo en el futuro, sin bloquear la primera versión
   del Site Health (que funciona sin ninguna credencial de Google).

   Qué haría si se activa: usar la API de Search Console para
   traer, de los últimos ~28 días:
     - clics, impresiones, CTR y posición media (totales y por página)
     - páginas que suben o bajan de posición vs el período anterior
     - queries que empiezan a ganar impresiones (posible oportunidad)
   y agregar esos datos como una sección más en SITE_HEALTH_REPORT.md.

   CÓMO ACTIVARLO (instrucciones para Leo, cuando lo pida):
     1. En Google Cloud Console, crear una "cuenta de servicio"
        (Service Account) y descargar su archivo JSON de credenciales.
     2. En Google Search Console (search.google.com/search-console),
        agregar el email de esa cuenta de servicio como usuario con
        permiso Full user sobre la propiedad inglesconleo.com. No usar
        Owner: este acceso de lectura no necesita privilegios administrativos.
     3. En GitHub, en el repo -> Settings -> Secrets and variables ->
        Actions, crear un secret llamado GSC_SERVICE_ACCOUNT_JSON con
        el contenido completo de ese archivo JSON (nunca subirlo al
        repo directamente).
     4. Instalar la librería oficial de Google
        (googleapis) dentro de tools/site-health, y completar la
        función fetchSearchConsoleData() de acá abajo.
     5. Descomentar la llamada a este módulo en audit.js y pasarle
        el JSON parseado desde process.env.GSC_SERVICE_ACCOUNT_JSON.

   Mientras el secret GSC_SERVICE_ACCOUNT_JSON no exista, esta función
   simplemente no hace nada (se puede llamar sin miedo a romper algo).
   ============================================================ */

async function fetchSearchConsoleData(/* serviceAccountJson */) {
  if (!process.env.GSC_SERVICE_ACCOUNT_JSON) {
    return null; // no configurado todavía: audit.js debe tratar esto como "sección no disponible"
  }
  // TODO (futuro): usar googleapis (google.webmasters / searchconsole v1)
  // con searchanalytics.query para traer clics/impresiones/CTR/posición
  // de los últimos 28 días, agrupado por página y por query, y comparar
  // contra el período anterior para detectar páginas/queries que suben
  // o bajan. No implementado todavía a propósito (ver instrucciones
  // arriba): se deja el contrato de la función lista para no tener que
  // rediseñar audit.js el día que se active.
  throw new Error('fetchSearchConsoleData: todavía no implementado, ver instrucciones en este archivo.');
}

module.exports = { fetchSearchConsoleData };
