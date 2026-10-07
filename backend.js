/* ============================================================
   Inglés con Leo — backend.js
   Conexión con Supabase para la zona de miembros:
   - Login por correo + contraseña (crear cuenta / iniciar
     sesión no necesitan que llegue ningún correo).
   - "Olvidé mi contraseña" sí manda un correo, pero se usa poco.
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

/* Botón "Continuar con Google". Queda en false hasta que Google
   esté activado en Supabase (Authentication -> Sign In / Providers
   -> Google). Si se prende antes, el botón daría error al usarlo. */
const GOOGLE_LOGIN_ENABLED = true;

/* ID de cliente de Google (Google Cloud -> Google Auth Platform ->
   Clientes). No es secreto: está hecho para ir en la página. Con
   él, el botón usa la ventanita propia de Google que dice
   "inglesconleo.com" en vez de la dirección de Supabase. Si se deja
   vacío, se usa el método anterior (redirigir a Google). */
const GOOGLE_CLIENT_ID = '748213508340-kmp8012322g6c7vqk2c6h8okk4oie16u.apps.googleusercontent.com';

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

  /* Crea la cuenta con correo + contraseña. No manda ningún
     correo (la confirmación de email está apagada en Supabase),
     así que si no hay error queda logueado al instante. */
  async function signUp(email, password){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      const { data, error } = await sb.auth.signUp({ email, password });
      if(error) return { ok:false, error: error.message };
      if(!data.session) return { ok:false, error: 'no_session' };
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Inicia sesión con correo + contraseña de una cuenta ya
     creada. Tampoco necesita ningún correo.

     Una sola sesión activa a la vez: apenas el login es exitoso,
     le pedimos a Supabase que cierre cualquier OTRA sesión abierta
     con esta misma cuenta (scope:'others', deja la de este
     dispositivo intacta). Esto es para que compartir el usuario y
     contraseña no sirva de mucho: en cuanto alguien más entra, a
     los demás se les va a pedir volver a iniciar sesión la próxima
     vez que su sesión se refresque (dentro de una hora aprox, no
     es instantáneo). Ojo: esto también afecta a la misma persona
     si usa dos dispositivos propios (celular y computadora); es
     una decisión a propósito, no un descuido. */
  async function signInWithPassword(email, password){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if(error) return { ok:false, error: error.message };
      try{ await sb.auth.signOut({ scope: 'others' }); }catch(e){}
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* "Olvidé mi contraseña": manda un correo con un enlace que
     trae de vuelta a esta página en modo "elige tu nueva
     contraseña" (ver onAuthEvent más abajo).

     Ojo: esto YA NO deja que lo mande el propio Supabase (llegaba
     poco y decía "supabase" en vez de tu dominio). En vez de eso
     llama a la función "clever-responder" (a la función del
     archivo send-password-reset.ts, Supabase le puso ese nombre
     al crearla), que genera el enlace y lo manda por Resend,
     igual que el correo de bienvenida. */
  async function sendPasswordReset(email){
    if(!isConfigured()) return { ok:false, error:'not_configured' };
    try{
      const res = await fetch(SUPABASE_URL + '/functions/v1/clever-responder', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          redirectTo: window.location.origin + window.location.pathname
        })
      });
      if(!res.ok) return { ok:false, error:'reset_email_error' };
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Guarda la nueva contraseña luego de volver del enlace de
     "olvidé mi contraseña". */
  async function updatePassword(newPassword){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if(error) return { ok:false, error: error.message };
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Avisa cuando el usuario vuelve de un enlace de "olvidé mi
     contraseña" (evento PASSWORD_RECOVERY de Supabase), para
     mostrarle el formulario de nueva contraseña. */
  function onPasswordRecovery(cb){
    const sb = getClient();
    if(!sb) return;
    sb.auth.onAuthStateChange(function(event){
      if(event === 'PASSWORD_RECOVERY') cb();
    });
  }

  async function signOut(){
    try{ localStorage.removeItem('leo_member_hint'); }catch(e){}
    const sb = getClient();
    if(sb){ try{ await sb.auth.signOut(); }catch(e){} }
  }

  /* Fila de la tabla profiles del usuario logueado (o null si no
     hay sesión). Incluye is_member: true/false. */
  /* Inicia sesión (o crea la cuenta, si es la primera vez) con
     Google. Manda a la persona a Google y Google la regresa a
     miembros.html?oauth=google (más ?volver=... si venía de una
     página de práctica). Esa dirección tiene que estar permitida en
     Supabase -> Authentication -> URL Configuration -> Redirect URLs. */
  async function signInWithGoogle(volver){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    let redirectTo = window.location.origin + '/miembros.html?oauth=google';
    if(volver && /^[a-z0-9-]+\.html$/.test(volver)) redirectTo += '&volver=' + volver;
    try{
      const { error } = await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo } });
      if(error) return { ok:false, error: error.message };
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Inicia sesión con el "credencial" que entrega la ventanita de
     Google (Google Identity Services). El nonce es un número de un
     solo uso que evita que alguien reutilice un credencial robado. */
  async function signInWithGoogleIdToken(token, nonce){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      const { data, error } = await sb.auth.signInWithIdToken({ provider:'google', token, nonce });
      if(error) return { ok:false, error: error.message };
      if(!data || !data.session) return { ok:false, error:'no_session' };
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Pista local (no da acceso a nada: el servidor y las páginas de miembros
     siempre verifican). Sirve para que páginas ligeras, como el glosario,
     muestren "Practicar este tema" solo a quien ya es miembro, sin cargar todo. */
  function setMemberHint(isMember){
    try{
      if(isMember) localStorage.setItem('leo_member_hint', JSON.stringify({ m:1, t:Date.now() }));
      else localStorage.removeItem('leo_member_hint');
    }catch(e){}
  }
  async function getMemberProfile(){
    const sb = getClient();
    if(!sb) return null;
    const session = await getSession();
    if(!session){ setMemberHint(false); return null; }
    try{
      const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
      if(error) return null;
      setMemberHint(!!(data && data.is_member));
      touchLastSeen(sb, session.user.id);
      // Si la cuenta todavía no tiene nombre en Supabase pero en este
      // navegador sí lo escribió (onboarding o "cambiar nombre"), se
      // sube una vez para que los correos lo puedan usar.
      try{
        const local = (typeof getProfile === 'function' && getProfile()) || null;
        if(data && !data.display_name && local && local.name){
          saveDisplayName(local.name);
        }
      }catch(e){}
      // Nivel y onboarding: la nube es la fuente de verdad (profiles.level + onboarded_at) y
      // localStorage solo una caché. La lógica vive en app.js (reconcileProfileWithCloud).
      try{
        if(data && typeof reconcileProfileWithCloud === 'function') await reconcileProfileWithCloud(data);
      }catch(e){}
      return data;
    }catch(e){ return null; }
  }

  /* Escribe level y/u onboarded_at en SU fila de profiles (permiso solo de esas columnas, ver
     supabase_schema.sql). { onboarded_at } solo se escribe si la nube aún no lo tiene, así dos
     dispositivos nunca se pisan la fecha. Devuelve 'ok', 'skip' (sin sesión o sin nube) o 'fail'
     (red/permiso): quien llama decide qué hacer; aquí nunca lanza error. */
  async function saveProfileToCloud(fields){
    try{
      const sb = getClient();
      if(!sb) return 'skip';
      const session = await getSession();
      if(!session) return 'skip';
      const payload = {};
      if(fields && typeof fields.level === 'string') payload.level = fields.level;
      if(fields && fields.onboarded_at) payload.onboarded_at = fields.onboarded_at;
      if(!Object.keys(payload).length) return 'skip';
      let q = sb.from('profiles').update(payload).eq('id', session.user.id);
      if(payload.onboarded_at) q = q.is('onboarded_at', null);
      const { error } = await q;
      return error ? 'fail' : 'ok';
    }catch(e){ return 'fail'; }
  }

  /* Nivel de la última sesión de práctica de la cuenta (solo habilidades que guardan el nivel del alumno).
     Sirve para recuperar el nivel en un navegador nuevo cuando la nube aún no tiene profiles.level.
     Devuelve el nivel, null (sin historial / sin sesión) o 'fail' (red). Una sola fila, nunca todo el historial. */
  async function getLatestSessionLevel(){
    try{
      const sb = getClient();
      if(!sb) return null;
      const session = await getSession();
      if(!session) return null;
      const skills = (typeof PROFILE_HISTORY_SKILLS !== 'undefined') ? PROFILE_HISTORY_SKILLS : [];
      const levels = (typeof LEVELS !== 'undefined') ? LEVELS : [];
      if(!skills.length || !levels.length) return null;
      const { data, error } = await sb.from('progress_sessions').select('level')
        .eq('user_id', session.user.id).in('skill', skills).in('level', levels)
        .order('started_at', { ascending:false }).limit(1);
      if(error) return 'fail';
      return (data && data[0] && data[0].level) || null;
    }catch(e){ return 'fail'; }
  }

  /* Guarda el nombre de la persona en profiles.display_name (lo usan
     los correos automáticos para saludar por nombre). Permiso de
     escritura SOLO de esa columna: GRANT UPDATE (display_name), ver
     supabase_schema.sql. Nunca lanza error. */
  async function saveDisplayName(name){
    try{
      const clean = String(name || '').trim().slice(0, 40);
      if(!clean) return;
      const sb = getClient();
      if(!sb) return;
      const session = await getSession();
      if(!session) return;
      await sb.from('profiles').update({ display_name: clean }).eq('id', session.user.id);
    }catch(e){}
  }

  /* Marca "última vez visto" en profiles.last_seen_at, para saber
     quién sigue usando la cuenta sin depender del "abierto" de los
     correos (poco confiable: Gmail/Apple precargan la imagen del
     pixel aunque nadie lea el correo). No bloquea nada si falla o
     tarda (fire-and-forget) y solo escribe una vez cada 15 minutos
     por dispositivo, para no llenar la base de datos de escrituras
     en cada clic. El permiso para escribir SOLO esta columna (no
     el resto de profiles, como is_member) se da en Supabase con
     GRANT UPDATE (last_seen_at) — ver supabase_schema.sql. */
  const LAST_SEEN_THROTTLE_MS = 15 * 60 * 1000;
  function touchLastSeen(sb, userId){
    try{
      const key = 'leo_last_seen_touch';
      const last = Number(localStorage.getItem(key) || 0);
      const now = Date.now();
      if(now - last < LAST_SEEN_THROTTLE_MS) return;
      localStorage.setItem(key, String(now));
      sb.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', userId)
        .then(()=>{}, ()=>{});
    }catch(e){}
  }

  /* Guarda cuantos ejercicios lleva hoy una cuenta gratis (is_member
     false), para que el limite diario (ver FREE_USER_DAILY_LIMIT en
     app.js) viaje con la cuenta y no solo con el navegador.
     Fire-and-forget: si falla o tarda, el conteo local en
     localStorage sigue mandando esa misma sesion, asi que nadie se
     queda bloqueado por un error de red. Necesita las columnas
     profiles.free_daily_count / free_daily_date (ver
     supabase_schema.sql) y su GRANT UPDATE especifico, igual que
     last_seen_at. */
  async function bumpFreeDailyCount(count, dateStr, flags){
    const sb = getClient();
    if(!sb) return;
    const session = await getSession();
    if(!session) return;
    const payload = { free_daily_count: count, free_daily_date: dateStr };
    // Estas dos columnas son "solo se ponen una vez" (la primera vez
    // que aplican): las usan los correos automáticos para saber si ya
    // practicó alguna vez y en qué momento tocó su límite diario. Ver
    // supabase_functions/upgrade-nudge-emails.ts.
    if(flags && flags.isFirstEver) payload.free_first_exercise_at = new Date().toISOString();
    if(flags && flags.justReachedLimit) payload.free_daily_limit_reached_at = new Date().toISOString();
    try{
      await sb.from('profiles').update(payload).eq('id', session.user.id);
    }catch(e){}
  }

  /* Trae las sesiones de práctica guardadas en la nube y las
     mezcla (sin duplicar) con las que ya hay en localStorage,
     para que el progreso se vea igual en cualquier dispositivo.
     Depende de loadProgress()/saveProgressRaw() de app.js. */
  async function syncProgressFromCloud(){
    const sb = getClient();
    if(!sb) return 'skip';
    const session = await getSession();
    if(!session) return 'skip';
    try{
      const { data, error } = await sb.from('progress_sessions')
        .select('*').eq('user_id', session.user.id)
        .order('started_at', { ascending:true });
      if(error || !data) return 'fail';
      const local = loadProgress();
      const seenCloudIds = new Set(local.sessions.map(s => s.cloudId).filter(Boolean));
      const localByIdentity = new Map(local.sessions.map(s => [progressSessionIdentity(s), s]));
      let changed = false;
      data.forEach(row => {
        if(seenCloudIds.has(row.id)) return;
        const cloudSession = {
          cloudId: row.id,
          skill: row.skill,
          level: row.level,
          topics: row.topics || [],
          /* El timestamp es la fuente fiable para la fecha local. Así una
             fila creada antes del arreglo UTC no vuelve a desordenar la
             racha al descargarse en otro dispositivo. */
          date: row.started_at ? localDateStr(new Date(row.started_at)) : row.date,
          startedAt: row.started_at,
          durationMs: row.duration_ms,
          results: row.results || []
        };
        if(row.tier) cloudSession.tier = row.tier;   // 'free' = práctica gratis de la cuenta antes de ser miembro
        const sameLocalSession = localByIdentity.get(progressSessionIdentity(cloudSession));
        if(sameLocalSession){
          /* recordSession() guarda primero en el navegador. Cuando llegue
             su copia de Supabase, la vinculamos en vez de agregar otra. */
          if(!sameLocalSession.cloudId){
            sameLocalSession.cloudId = row.id;
            changed = true;
          }
          return;
        }
        local.sessions.push(cloudSession);
        localByIdentity.set(progressSessionIdentity(cloudSession), cloudSession);
        changed = true;
      });
      if(dedupeProgressSessions(local)) changed = true;
      local.sessions.sort((a,b)=> (a.startedAt||0) - (b.startedAt||0));
      if(local.sessions.length){
        const last = local.sessions[local.sessions.length-1];
        local.lastActivity = { skill:last.skill, level:last.level, topic:(last.topics&&last.topics[0])||null, date:last.date };
      }
      if(changed){
        saveProgressRaw(local);
        /* Las páginas protegidas arrancan sin esperar la red para no
           quedarse en blanco. Avisamos a las que muestran métricas para
           que, cuando lleguen sesiones de otro dispositivo, se redibujen
           con los datos ya sincronizados. */
        window.dispatchEvent(new Event('leo-progress-synced'));
      }
      return 'ok';
    }catch(e){ return 'fail'; }
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
      /* Marca "última práctica REAL" en profiles.last_practice_at,
         distinto de last_seen_at (que se actualiza con cualquier
         visita, no solo al practicar). La usan los correos de
         reactivación de Miembros (supabase_functions/upgrade-nudge-
         emails.ts) para no confundir "abrió una página" con "practicó
         de verdad". recordSession() SOLO llama a pushSession() desde
         los motores de sesión de Miembros (nunca desde práctica
         gratis), así que esta columna nunca se toca para cuentas
         gratis: ahí la señal equivalente ya es free_daily_date, ver
         supabase_schema.sql. Fire-and-forget, igual que touchLastSeen.
         Necesita GRANT UPDATE (last_practice_at) — ver
         supabase_schema.sql. */
      sb.from('profiles').update({ last_practice_at: new Date().toISOString() }).eq('id', session_.user.id)
        .then(()=>{}, ()=>{});
    }catch(e){}
  }

  /* Sesión de PRÁCTICA GRATIS de una cuenta que no es miembro (ver "Sesiones de PRÁCTICA GRATIS" en
     app.js). Misma tabla y misma forma que pushSession, pero: (1) no toca last_practice_at, que es la
     señal de "practicó como miembro" de los correos; (2) responde qué pasó, para que app.js sepa si
     puede borrar su copia: 'ok' guardada (o ya estaba: la base rechaza la repetida), 'drop' rechazada
     para siempre (límites de la base), 'fail' reintentar después, 'skip' no hay sesión de esa cuenta.
     El origen (tier 'free') lo pone la base al insertar; el navegador no lo manda. */
  async function pushFreeSession(session, expectedUserId){
    const sb = getClient();
    if(!sb || !session) return 'skip';
    const s = await getSession();
    if(!s || !s.user || !s.user.id || (expectedUserId && s.user.id !== expectedUserId)) return 'skip';
    try{
      const { error } = await sb.from('progress_sessions').insert({
        user_id: s.user.id,
        skill: session.skill,
        level: session.level,
        topics: session.topics || [],
        date: session.date,
        started_at: session.startedAt,
        duration_ms: session.durationMs,
        results: session.results || []
      });
      if(!error) return 'ok';
      if(error.code === '23505') return 'ok';
      if(error.code === 'P0001' || error.code === '23514') return 'drop';
      return 'fail';
    }catch(e){ return 'fail'; }
  }

  /* Trae las filas de mistake_stats del usuario (un ejercicio por
     fila, solo los que alguna vez falló). Se usa para "Repaso
     personal": activo/recuperado/dominado y prioridad.
     IMPORTANTE: devuelve null si algo falló de verdad (sin internet,
     sin sesión, o la tabla/función todavía no existe porque no se
     corrió el SQL nuevo en Supabase) para que quien llama use el
     método viejo de respaldo. Solo devuelve [] cuando la consulta
     funcionó bien y la persona de verdad no tiene ningún error
     guardado todavía. Nunca confundir "falló la consulta" con
     "no tiene errores": lo primero debe caer al método viejo, lo
     segundo sí debe ocultar la tarjeta. */
  async function getMistakeStats(){
    const sb = getClient();
    if(!sb) return null;
    const session = await getSession();
    if(!session) return null;
    try{
      const { data, error } = await sb.from('mistake_stats')
        .select('item_id,kind,topic,fail_count,correct_streak,status,recovered_at,last_seen_at')
        .eq('user_id', session.user.id);
      if(error) return null;
      return data || [];
    }catch(e){ return null; }
  }

  /* Aplica en una sola llamada los resultados de una sesión completa
     (evita una consulta por ejercicio). items: [{item_id, kind, topic, is_correct}].
     Fire-and-forget, igual que pushSession: si falla, no se pierde
     nada, la próxima sesión que se guarde vuelve a intentarlo. */
  async function applyMistakeResults(items){
    const sb = getClient();
    if(!sb || !items || !items.length) return { ok:false };
    const session = await getSession();
    if(!session) return { ok:false };
    try{
      const { error } = await sb.rpc('apply_mistake_results', { p_items: items });
      if(error) return { ok:false };
      return { ok:true };
    }catch(e){ return { ok:false }; }
  }

  /* Pide un link de pago de Mercado Pago personalizado para el
     usuario logueado (ligado a su id, no a un correo). Devuelve
     { ok:true, url } o { ok:false, error }. Depende de que la
     función de Supabase que hace de "create-checkout" esté
     desplegada. Nota: Supabase le puso el nombre "super-service"
     a esa función en vez de "create-checkout" al crearla, por eso
     la URL de abajo usa ese nombre — es la misma función. */
  async function startCheckout(mpEmail){
    if(!isConfigured()) return { ok:false, error:'not_configured' };
    const session = await getSession();
    if(!session) return { ok:false, error:'no_session' };
    try{
      const res = await fetch(SUPABASE_URL + '/functions/v1/super-service', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + session.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payer_email: mpEmail })
      });
      const data = await res.json();
      if(!res.ok || !data.init_point) return { ok:false, error: (data && data.error) || 'checkout_error' };
      return { ok:true, url: data.init_point };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Pide un client_secret de Stripe (checkout embebido) para el
     usuario logueado, ligado a su id. Es el equivalente de
     startCheckout() pero para Stripe: se usa cuando alguien paga
     desde fuera de México o con una tarjeta que Mercado Pago no
     acepta. A diferencia de antes, ya NO devuelve un link al que
     redirigir: devuelve un clientSecret que miembros.html usa para
     mostrar el formulario de tarjeta incrustado en la misma página
     (ver stripe.initEmbeddedCheckout en miembros.html). Devuelve
     { ok:true, clientSecret } o { ok:false, error }. Depende de que
     la función de Supabase "stripe-checkout" esté desplegada (ver
     supabase_functions/stripe-checkout.ts). */
  async function startStripeCheckout(plan){
    if(!isConfigured()) return { ok:false, error:'not_configured' };
    const session = await getSession();
    if(!session) return { ok:false, error:'no_session' };
    try{
      const res = await fetch(SUPABASE_URL + '/functions/v1/stripe-checkout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + session.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: plan === 'annual' ? 'annual' : 'monthly' })
      });
      const data = await res.json();
      if(!res.ok || !data.client_secret) return { ok:false, error: (data && data.error) || 'checkout_error' };
      return { ok:true, clientSecret: data.client_secret };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Leo AI (Edge Function leo-ai; el proveedor de IA lo elige el
     servidor: Cloudflare Workers AI con Gemma 4). Es solo un
     extra que el alumno pide con un botón: NUNCA lanza error ni bloquea
     el ejercicio. Siempre devuelve { ok:true, answer } o
     { ok:false, reason } (reason: 'daily_limit', 'disabled', 'timeout',
     'network', 'bad_output', etc.). Solo manda el payload que ya armó
     app.js (datos del ejercicio, sin nada personal); el token de sesión
     va únicamente a NUESTRO servidor para comprobar que es miembro. */
  /* Un fallo pasajero (señal del celular, arranque en frío del servidor,
     el modelo tarda o responde mal una vez) se reintenta UNA vez antes de
     rendirse. Los motivos definitivos (límite diario, sin sesión, etc.) no. */
  const LEO_AI_RETRY_REASONS = { timeout:1, network:1, provider_error:1, bad_output:1, error:1, in_progress:1 };
  async function askLeoAI(payload){
    // Misma request_id en todos los intentos de ESTA pulsación: el servidor la
    // trata como una sola explicación (no descuenta de nuevo, no repite la
    // llamada al modelo si ya terminó y limita los intentos reales a 2).
    let rid = '';
    try{ rid = (crypto.randomUUID && crypto.randomUUID()) || ''; }catch(e){}
    if(!rid) rid = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
    const body = Object.assign({}, payload || {}, { request_id: rid });
    let res = null;
    for(let i = 0; i < 3; i++){
      res = await askLeoAIOnce(body);
      if(!res || res.ok || res.final) break;
      if(!(LEO_AI_RETRY_REASONS[res.reason] || /^http_5/.test(res.reason || ''))) break;
      try{ console.warn('[Leo AI] fallo:', res.reason, i < 2 ? '(reintentando)' : ''); }catch(e){}
      if(i < 2) await new Promise(r => setTimeout(r, res.reason === 'in_progress' ? 1500 : 400));
    }
    if(res && !res.ok){ try{ console.warn('[Leo AI] fallo final:', res.reason); }catch(e){} }
    return res;
  }
  async function askLeoAIOnce(payload){
    if(!isConfigured()) return { ok:false, reason:'not_configured' };
    let session = null;
    try{ session = await getSession(); }catch(e){ session = null; }
    if(!session) return { ok:false, reason:'no_session' };
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(()=> ctrl.abort(), 18000) : null;
    try{
      const res = await fetch(SUPABASE_URL + '/functions/v1/leo-ai', {
        method: 'POST',
        signal: ctrl ? ctrl.signal : undefined,
        headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      let data = null;
      try{ data = await res.json(); }catch(e){ data = null; }
      if(data && data.ok && data.answer && typeof data.answer === 'object') return { ok:true, answer: data.answer };
      return { ok:false, reason: (data && typeof data.reason === 'string') ? data.reason : ('http_' + res.status), final: !!(data && data.final) };
    }catch(e){
      return { ok:false, reason: (e && e.name === 'AbortError') ? 'timeout' : 'network' };
    }finally{
      if(timer) clearTimeout(timer);
    }
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
      /* syncProgressFromCloud() ya NO se espera aqui (antes tenia
         "await"): eso hacia que la pantalla se quedara en blanco
         mientras se hacian DOS consultas a Supabase una detras de
         otra (primero el perfil, luego el progreso). Ahora la
         pantalla arranca en cuanto se confirma que es miembro, y el
         progreso de la nube se sincroniza en segundo plano (igual
         que pushSession(), que ya funcionaba asi). Si el progreso
         de otro dispositivo tarda medio segundo mas en aparecer,
         no pasa nada: la sesion no se pierde. */
      syncProgressFromCloud();
      return true;
    }
    window.location.href = 'miembros.html';
    return false;
  }

  /* Pide un link de pago de PayPal para el usuario logueado,
     ligado a su id. Es el equivalente de startCheckout()/
     startStripeCheckout() pero para PayPal. Devuelve
     { ok:true, url } o { ok:false, error }. Depende de que la
     función de Supabase "paypal-checkout" esté desplegada (ver
     supabase_functions/paypal-checkout.ts). */
  async function startPaypalCheckout(){
    if(!isConfigured()) return { ok:false, error:'not_configured' };
    const session = await getSession();
    if(!session) return { ok:false, error:'no_session' };
    try{
      const res = await fetch(SUPABASE_URL + '/functions/v1/paypal-checkout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + session.access_token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if(!res.ok || !data.init_point) return { ok:false, error: (data && data.error) || 'checkout_error' };
      return { ok:true, url: data.init_point };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Comentarios en los articulos (articulo-*.html). No requiere
     sesion iniciada: cualquiera puede comentar, con o sin cuenta.
     Ver supabase_schema.sql (tabla article_comments) y la funcion
     notify-new-comment (le avisa a Leo por correo cada comentario
     nuevo, con el articulo y quien escribio). */
  async function getArticleComments(slug){
    const sb = getClient();
    if(!sb) return [];
    try{
      const { data, error } = await sb.from('article_comments')
        .select('id, display_name, is_member, comment_text, created_at, user_id, parent_comment_id')
        .eq('article_slug', slug)
        .order('created_at', { ascending: false })
        .limit(200);
      if(error) return [];
      return data || [];
    }catch(e){ return []; }
  }

  /* parentCommentId: solo lo usa la respuesta del admin (ver
     app.js, openReplyForm). notify: en false evita mandarle a Leo
     el correo de aviso quien comenta es el mismo Leo respondiendo
     (sus propias respuestas no necesitan avisarle a el mismo). */
  async function postArticleComment({ slug, articleTitle, displayName, commentText, isMember, userId, parentCommentId, notify }){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      const row = {
        article_slug: slug,
        article_title: articleTitle || null,
        user_id: userId || null,
        is_member: !!isMember,
        display_name: displayName,
        comment_text: commentText
      };
      if(parentCommentId) row.parent_comment_id = parentCommentId;
      const { data, error } = await sb.from('article_comments').insert(row).select('id').single();
      if(error) return { ok:false, error: error.message };
      /* Aviso a Leo por correo. No bloquea ni rompe nada si falla
         (fire-and-forget): el comentario ya quedo guardado. */
      if(notify !== false){
        try{
          fetch(SUPABASE_URL + '/functions/v1/notify-new-comment', {
            method: 'POST',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment_id: data.id })
          });
        }catch(e){}
      }
      return { ok:true, id: data.id };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* Borrar un comentario (o una respuesta). Solo funciona de
     verdad si quien esta logueado es la cuenta admin: lo autoriza
     la policy de RLS "article_comments: delete admin" en Supabase,
     comparando la sesion real contra el id de Leo. Si alguien mas
     lo intenta, Supabase simplemente no borra nada (0 filas), asi
     que lo tratamos como error para que el navegador avise. */
  async function deleteArticleComment(id){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      const { data, error } = await sb.from('article_comments').delete().eq('id', id).select('id');
      if(error) return { ok:false, error: error.message };
      if(!data || !data.length) return { ok:false, error:'not_allowed' };
      return { ok:true };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  /* LeoBot: "Reportar un problema" / "Contactar" (ver chatbot.js,
     sendLeobotReport). Guarda en la tabla leobot_reports (ver
     supabase_schema.sql) y avisa a Leo por correo con la Edge
     Function leobot-notify, igual que postArticleComment ya hace con
     notify-new-comment. Funciona con o sin sesión iniciada: userId/
     email quedan null para invitados. */
  async function submitLeobotReport({ type, message, pageUrl, pageName, userId, email, browser, device, context }){
    const sb = getClient();
    if(!sb) return { ok:false, error:'not_configured' };
    try{
      /* El id lo genera el navegador (no Supabase): la tabla no tiene
         ninguna politica de SELECT a proposito (nadie puede leer
         reportes ajenos), y pedir de vuelta el id insertado (.select())
         necesitaria justo esa lectura que RLS bloquea. Generandolo acá
         evitamos necesitar leer nada de vuelta. */
      const id = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
            const r = Math.random()*16|0;
            return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
          });
      const row = {
        id,
        type,
        message,
        page_url: pageUrl || null,
        page_name: pageName || null,
        user_id: userId || null,
        email: email || null,
        browser: browser || null,
        device: device || null,
        context: context || null
      };
      const { error } = await sb.from('leobot_reports').insert(row);
      if(error) return { ok:false, error: error.message };
      /* Aviso a Leo por correo. No bloquea ni rompe nada si falla
         (fire-and-forget): el reporte ya quedo guardado. */
      try{
        fetch(SUPABASE_URL + '/functions/v1/leobot-notify', {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ report_id: id })
        });
      }catch(e){}
      return { ok:true, id: id };
    }catch(e){
      return { ok:false, error: String(e) };
    }
  }

  return {
    isConfigured, getClient, getSession, signOut,
    signUp, signInWithPassword, signInWithGoogle, signInWithGoogleIdToken, sendPasswordReset, updatePassword, onPasswordRecovery,
    getMemberProfile, saveProfileToCloud, getLatestSessionLevel, syncProgressFromCloud, pushSession, pushFreeSession, requireMemberAsync, startCheckout, startStripeCheckout, startPaypalCheckout,
    getArticleComments, postArticleComment, deleteArticleComment, bumpFreeDailyCount, saveDisplayName,
    getMistakeStats, applyMistakeResults, submitLeobotReport, askLeoAI
  };
})();

/* Punto de entrada único para las 7 páginas de miembros
   (gramatica.html, vocabulario.html, listening.html, writing.html,
   speaking.html, mixto.html, progreso.html).
   Uso: guardMemberPage(function(){ ...arrancar la página... }); */
function guardMemberPage(startFn){
  LeoBackend.requireMemberAsync().then(function(ok){
    if(ok){
      window.__leoMemberVerified = true; // lo usa Leo AI (app.js) para mostrarse solo a miembros
      startFn();
      if(typeof initMemberHeader === 'function') initMemberHeader();
    }
  });
}
