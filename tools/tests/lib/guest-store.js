/* Almacén de pruebas para páginas de INVITADO. Desde el aislamiento por cuenta, el progreso y el perfil de un invitado viven en
   claves "clave@@g". Las pruebas más antiguas escriben y leen las claves de siempre ('leo_progress_v2', 'leo_profile'...):
   este Proxy las traduce, así comprueban lo mismo sin cambiar. Las claves que no se aíslan a propósito (límites, banderas,
   sesión de Supabase) pasan tal cual. */
const OPEN = /^(sb-|leoLocalDailyCount|leo_ai_trial|leo_ai_beta|leo_ai_teaser_day|leo_member_hint|leo_last_seen|leo_comment_guest|leo_ev_|leo_scope|leo_vault|leo_cambridge|leo_rush|leo_academia_canary|leo_academia_cola)/;
const mapKey = k => (typeof k !== 'string' || k.indexOf('@@') >= 0 || OPEN.test(k)) ? k : k + '@@g';
module.exports = function guestStore(){
  return new Proxy({}, {
    get: (t, p) => (typeof p === 'string' ? t[mapKey(p)] : t[p]),
    set: (t, p, v) => { t[typeof p === 'string' ? mapKey(p) : p] = v; return true; },
    has: (t, p) => (typeof p === 'string' ? mapKey(p) in t : p in t),
    deleteProperty: (t, p) => { delete t[typeof p === 'string' ? mapKey(p) : p]; return true; }
  });
};
