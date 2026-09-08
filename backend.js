/* ============================================================
   Inglés con Leo — backend.js
   Conexión con Supabase para la zona de miembros:
   - Login por enlace mágico (sin contraseña).
   - Progreso guardado de verdad en la nube (además del
     localStorage que ya usa app.js), para que se vea igual
     si el usuario cambia de dispositivo.
   - Lo gratis (artículos, práctica de muestra) NO usa nada de
     este archivo y sigue funcionando exactamente igual que antes.

   ------------------------------------------------------------
   CONFIGURACIÓN — pega aquí tus datos de Supabase.
   Los encuentras en tu proyecto de Supabase en:
   Project Settings -> API -> "Project URL" y "anon public" key.
   Ninguno de los dos es secreto: están hechos para vivir en el
   navegador del usuario. Mientras no los pegues, la web sigue
   funcionando normal (sin login de miembros).
   ------------------------------------------------------------ */
const SUPABASE_URL = 'https://iviksyhzhiygkuaojply.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_97pvm28aLA7UCqTNV6WRUg_Bca5Y4XN';

const LeoBackend = (function(){
  let client = null;

  function isConfigured(){
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY &&
      SUPABASE_URL.indexOf('PEGA_AQUI') === -1 &&
      SUPABASE_ANON_KEY.indexOf('PEGA_AQUI') === -1;
  }

  function getClient(){
    if(!isConfigured()) return null;
    if(!client && window.supabase && window.supabase.createClient){
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return client;
  }

  async function getSession(){
    const sb = getClient();
    if(!sb) return null;
    try{
      const { data } = await sb.auth.getSession();
      return data ? data.session : null;
    }catch(e){ return null; }
  }

  /* Envía el enlace mágico al correo. El usuario vuelve a esta
     misma página (miembros.html) ya con sesión iniciada. */
  async function sendMagicLink(email){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      const { error } = await sb.auth.signInWithOtp({
        email: email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname }
      });
      if(error) return { ok:false, error: error.message };
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  async function signOut(){
    const sb = getClient();
    if(sb){ try{ await sb.auth.signOut(); }catch(e){} }
  }

  /* Fila de la tabla profiles del usuario logueado (o null si no
     hay sesión). Incluye is_member: true/false. */
  async function getMemberProfile(){
    const sb = getClient();
    if(!sb) return null;
    const session = await getSession();
    if(!session) return null;
    try{
      const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
      if(error) return null;
      return data;
    }catch(e){ return null; }
  }

  /* Trae las sesiones de práctica guardadas en la nube y las
     mezcla (sin duplicar) con las que ya hay en localStorage,
     para que el progreso se vea igual en cualquier dispositivo.
     Depende de loadProgress()/saveProgressRaw() de app.js. */
  async function syncProgressFromCloud(){
    const sb = getClient();
    if(!sb) return;
    const session = await getSession();
    if(!session) return;
    try{
      const { data, error } = await sb.from('progress_sessions')
        .select('*').eq('user_id', session.user.id)
        .order('started_at', { ascending:true });
      if(error || !data) return;
      const local = loadProgress();
      const seenCloudIds = new Set(local.sessions.map(s => s.cloudId).filter(Boolean));
      data.forEach(row => {
        if(seenCloudIds.has(row.id)) return;
        local.sessions.push({
          cloudId: row.id,
          skill: row.skill,
          level: row.level,
          topics: row.topics || [],
          date: row.date,
          startedAt: row.started_at,
          durationMs: row.duration_ms,
          results: row.results || []
        });
      });
      local.sessions.sort((a,b)=> (a.startedAt||0) - (b.startedAt||0));
      if(local.sessions.length){
        const last = local.sessions[local.sessions.length-1];
        local.lastActivity = { skill:last.skill, level:last.level, topic:(last.topics&&last.topics[0])||null, date:last.date };
      }
      saveProgressRaw(local);
    }catch(e){}
  }

  /* Guarda en la nube una sesión que recordSession() ya guardó en
     localStorage. Es "fire and forget": si falla (sin internet,
     backend sin configurar, etc.) el progreso local no se pierde,
     solo no queda respaldado en la nube todavía. */
  async function pushSession(session){
    const sb = getClient();
    if(!sb) return;
    const session_ = await getSession();
    if(!session_) return;
    try{
      await sb.from('progress_sessions').insert({
        user_id: session_.user.id,
        skill: session.skill,
        level: session.level,
        topics: session.topics || [],
        date: session.date,
        started_at: session.startedAt,
        duration_ms: session.durationMs,
        results: session.results || []
      });
    }catch(e){}
  }

  /* Verifica que haya una sesión iniciada Y que is_member sea
     true. Si no, redirige a miembros.html. Úsala desde las
     páginas de miembros vía guardMemberPage() (más abajo). */
  async function requireMemberAsync(){
    if(!isConfigured()){
      window.location.href = 'miembros.html';
      return false;
    }
    const profile = await getMemberProfile();
    if(profile && profile.is_member){
      await syncProgressFromCloud();
      return true;
    }
    window.location.href = 'miembros.html';
    return false;
  }

  return {
    isConfigured, getClient, getSession, sendMagicLink, signOut,
    getMemberProfile, syncProgressFromCloud, pushSession, requireMemberAsync
  };
})();

/* Punto de entrada único para las 7 páginas de miembros
   (gramatica.html, vocabulario.html, listening.html, writing.html,
   speaking.html, mixto.html, progreso.html).
   Uso: guardMemberPage(function(){ ...arrancar la página... }); */
function guardMemberPage(startFn){
  LeoBackend.requireMemberAsync().then(function(ok){
    if(ok) startFn();
  });
}
