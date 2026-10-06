/* ============================================================
   Inglés con Leo — app.js
   Lógica compartida por todas las páginas: perfil/onboarding,
   acceso de miembros, progreso (real, calculado desde
   localStorage) y los "motores" de sesión de cada habilidad.
   El contenido de los ejercicios vive en data.js.
   No hay backend: todo se guarda en el navegador del usuario.
   ============================================================ */

/* Fecha de calendario LOCAL (no UTC) como "YYYY-MM-DD". Todo el sitio
   debe usar esta función (nunca Date#toISOString().slice(0,10) directo)
   para decidir "a qué día pertenece" una sesión, la racha, o el
   resumen semanal. toISOString() siempre da la fecha en UTC: para
   alguien en México (UTC-6), cualquier práctica hecha después de las
   6pm ya cae en el día siguiente según UTC, aunque para la persona
   siga siendo el mismo día. Eso causaba rachas que bajaban solas y
   días de la semana con datos en el día equivocado (o "saltados"). */
function localDateStr(d){
  d = d || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

/* ---------- Perfil / onboarding ---------- */
const PROFILE_KEY = 'leo_profile';

function getProfile(){
  try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; }
  catch(e){ return null; }
}
function saveProfile(p){
  try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }catch(e){}
}
function getUserLevel(){
  const p = getProfile();
  return (p && LEVELS.includes(p.level)) ? p.level : 'facil';
}
function setUserLevel(level){
  const p = getProfile() || { name:'', createdAt: Date.now() };
  p.level = level;
  saveProfile(p);
}

function setProfileName(name){
  const p = getProfile() || { level:'facil', createdAt: Date.now() };
  p.name = name;
  saveProfile(p);
  return saveNameToCloud(name);
}

/* Guarda el nombre también en Supabase (profiles.display_name), para
   que los correos automáticos puedan saludar a la persona por su
   nombre. Solo funciona si hay sesión iniciada; si no, no hace nada.
   Nunca bloquea: si falla, el nombre local sigue funcionando igual. */
function saveNameToCloud(name){
  try{
    if(name && typeof LeoBackend !== 'undefined' && LeoBackend.saveDisplayName){
      return LeoBackend.saveDisplayName(name);
    }
  }catch(e){}
  return Promise.resolve();
}

/* ---------- Header de miembros: buscador rapido, notificaciones y cuenta ----------
   Se usa en las 7 paginas de miembros + el panel. No inventa datos: el
   "aviso" reusa la racha/practica de hoy que ya calculamos, y el buscador
   solo filtra los enlaces reales del sitio (no hay indice de ejercicios). */
const QUICK_NAV_LINKS = [
  { label:'Gramática', href:'gramatica.html' },
  { label:'Vocabulario', href:'vocabulario.html' },
  { label:'Listening', href:'listening.html' },
  { label:'Writing', href:'writing.html' },
  { label:'Speaking', href:'speaking.html' },
  { label:'Mixto', href:'mixto.html' },
  { label:'Clases interactivas', href:'clases.html' },
  { label:'Mis errores', href:'errores.html' },
  { label:'Tu progreso', href:'progreso.html' },
  { label:'Panel de miembros', href:'miembros.html' },
  { label:'Artículos', href:'articulos.html' },
  { label:'Practicar gratis (sin cuenta)', href:'practica.html' }
];

function closeAllNavPops(){
  document.querySelectorAll('.nav-pop.open').forEach(el=> el.classList.remove('open'));
}

/* ---------- Menú móvil (hamburguesa) ----------
   El botón .nav-burger existe en el header de todas las páginas.
   En mobile (<900px) despliega los mismos enlaces de .nav-links
   como un panel debajo del header; en desktop no se usa (los
   enlaces ya están visibles). */
function initMobileNavToggle(){
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if(!burger || !links) return;

  function closeMenu(){
    links.classList.remove('mnav-open');
    burger.setAttribute('aria-expanded','false');
  }
  function openMenu(){
    links.classList.add('mnav-open');
    burger.setAttribute('aria-expanded','true');
  }

  burger.setAttribute('aria-expanded','false');
  burger.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = links.classList.contains('mnav-open');
    if(isOpen) closeMenu(); else openMenu();
  });
  links.addEventListener('click', (e)=>{
    if(e.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', (e)=>{
    if(!links.classList.contains('mnav-open')) return;
    if(e.target.closest('.nav-links') || e.target.closest('.nav-burger')) return;
    closeMenu();
  });
  window.addEventListener('resize', ()=>{
    if(window.innerWidth >= 900) closeMenu();
  });
}
initMobileNavToggle();

/* ---------- LeoBot: no tapar contenido importante ----------
   El botón flotante de LeoBot es fijo (position:fixed) y puede
   quedar encima de botones reales: el modal de bienvenida, las
   opciones de una pregunta, el botón "Siguiente", etc. En vez de
   perseguir cada caso a mano, ocultamos el flotante por completo
   mientras exista un modal de onboarding o una sesión de práctica
   activa en la página (ver chatbot.css: body.leobot-away). */
function initLeobotAutoHide(){
  let overlayOrSession = false;

  function apply(){
    document.body.classList.toggle('leobot-away', overlayOrSession);
  }
  function syncOverlay(){
    overlayOrSession = !!document.querySelector('.onb-overlay, .session-card');
    apply();
  }
  syncOverlay();
  const observer = new MutationObserver(syncOverlay);
  observer.observe(document.body, { childList:true, subtree:true });

}
initLeobotAutoHide();

async function initMemberHeader(){
  const block = document.getElementById('navUserBlock');
  if(!block) return;
  if(typeof LeoBackend === 'undefined' || !LeoBackend.isConfigured()) return;

  const profile = getProfile();
  let memberProfile = null;
  try{ memberProfile = await LeoBackend.getMemberProfile(); }catch(e){}
  const email = memberProfile ? memberProfile.email : '';
  const displayName = (profile && profile.name) ? profile.name : (email ? email.split('@')[0] : 'Cuenta');
  const initial = (displayName.trim().charAt(0) || 'L').toUpperCase();

  block.querySelectorAll('.nav-avatar').forEach(el=> el.textContent = initial);
  const nameEl = document.getElementById('navProfileName');
  if(nameEl) nameEl.textContent = displayName;
  const popNameEl = document.getElementById('navProfilePopName');
  if(popNameEl) popNameEl.textContent = displayName;
  const popEmailEl = document.getElementById('navProfilePopEmail');
  if(popEmailEl) popEmailEl.textContent = email;

  const p = loadProgress();
  const today = localDateStr();
  const practicedToday = p.sessions.some(s=> s.date === today);
  const streak = computeStreak();
  const bellContent = document.getElementById('navBellContent');
  const bellDot = document.getElementById('navBellDot');
  let msg, showDot;
  if(practicedToday){
    msg = 'Ya practicaste hoy. ¡Buen trabajo!';
    showDot = false;
  } else if(streak > 0){
    msg = `Llevas ${streak} ${streak===1?'día':'días'} de racha. Practica hoy para no perderla.`;
    showDot = true;
  } else {
    msg = 'Aún no tienes práctica registrada esta racha. ¡Empieza hoy!';
    showDot = true;
  }
  if(bellContent) bellContent.innerHTML = `<p class="nav-pop-msg">${msg}</p>`;
  if(bellDot) bellDot.style.display = showDot ? 'block' : 'none';

  const searchInput = document.getElementById('navSearchInput');
  const searchResults = document.getElementById('navSearchResults');
  function renderSearchResults(query){
    if(!searchResults) return;
    const q = (query||'').trim().toLowerCase();
    const matches = QUICK_NAV_LINKS.filter(l=> !q || l.label.toLowerCase().includes(q));
    searchResults.innerHTML = matches.length
      ? matches.map(l=> `<a href="${l.href}" class="nav-pop-item">${l.label}</a>`).join('')
      : `<p class="nav-pop-msg">Sin resultados.</p>`;
  }
  if(searchInput){
    renderSearchResults('');
    searchInput.addEventListener('input', ()=> renderSearchResults(searchInput.value));
  }

  function wireToggle(btnId, popId){
    const btn = document.getElementById(btnId);
    const pop = document.getElementById(popId);
    if(!btn || !pop) return;
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const willOpen = !pop.classList.contains('open');
      closeAllNavPops();
      if(willOpen){ pop.classList.add('open'); if(popId === 'navSearchPop' && searchInput) searchInput.focus(); }
    });
    pop.addEventListener('click', e=> e.stopPropagation());
  }
  wireToggle('navSearchBtn','navSearchPop');
  wireToggle('navBellBtn','navBellPop');
  wireToggle('navProfileBtn','navProfilePop');
  document.addEventListener('click', closeAllNavPops);

  // Para alguien que ya es miembro, la palabra "gratis" en el link de
  // "Practicar gratis" del menú ya no aplica (esa página es la de
  // práctica sin guardar progreso, pero el usuario ya está pagando su
  // membresía). Se deja como "Practicar" solo para miembros logeados;
  // para cualquier otra persona el link sigue diciendo "Practicar gratis".
  document.querySelectorAll('.nav-links a[href="practica.html"]').forEach(a=>{
    // Para un miembro logeado, "Practicar gratis" no debe ni existir: se
    // cambia el texto Y el destino, así el clic va directo a
    // practica-miembros.html (mismo selector de nivel + pestañas de
    // habilidad que la versión gratis, pero con las sesiones reales que
    // sí guardan progreso). Nunca pasa por la página gratis. Antes solo
    // se cambiaba el texto y practica.html hacía un redireccionamiento
    // después, lo que se alcanzaba a ver como un parpadeo de un segundo.
    a.textContent = 'Practicar';
    a.href = 'practica-miembros.html';
  });

  // Mismo ajuste para el botón "Practicar" de la barra inferior en
  // móvil (usa onclick en vez de href, así que se sobreescribe distinto).
  document.querySelectorAll('.mobile-nav .mnav-item').forEach(btn=>{
    if(btn.getAttribute('onclick') === "location.href='practica.html'"){
      btn.onclick = function(){ location.href = 'practica-miembros.html'; };
    }
  });

  const editBtn = document.getElementById('navEditNameBtn');
  if(editBtn){
    editBtn.addEventListener('click', ()=>{
      const current = (getProfile() && getProfile().name) || '';
      const name = window.prompt('¿Cómo te llamas?', current);
      if(name !== null){
        Promise.resolve(setProfileName(name.trim())).finally(()=> location.reload());
      }
    });
  }

  const subBtn = document.getElementById('navManageSubBtn');
  if(subBtn){
    subBtn.addEventListener('click', ()=>{
      // Ahora hay tres formas de pago posibles (Mercado Pago,
      // Stripe o PayPal), así que el mensaje depende de con cuál
      // pagó esta persona. Lo sabemos por qué columna quedó llena
      // en su fila de profiles (mp_preapproval_id la pone
      // create-checkout/mp-webhook, stripe_customer_id la pone
      // stripe-webhook, paypal_subscription_id la pone
      // paypal-webhook).
      if(memberProfile && memberProfile.stripe_customer_id){
        window.alert('Tu membresía es de $2 USD / mes vía tarjeta internacional (Stripe).\n\nPara cambiar tu método de pago o cancelarla, escríbenos a hola@inglesconleo.com y con gusto te ayudamos.');
      } else if(memberProfile && memberProfile.mp_preapproval_id){
        window.alert('Tu membresía es de $2 USD / mes (≈$40 MXN) vía Mercado Pago.\n\nPara cambiar tu método de pago o cancelarla, entra a tu cuenta de Mercado Pago → Actividad → Suscripciones.');
      } else if(memberProfile && memberProfile.paypal_subscription_id){
        window.alert('Tu membresía es de $2 USD / mes vía PayPal.\n\nPara cambiar tu método de pago o cancelarla, entra a tu cuenta de PayPal → Configuración → Pagos → Pagos automáticos.');
      } else {
        window.alert('Tu membresía es de $2 USD / mes (≈$40 MXN).\n\nPara cambiar tu método de pago o cancelarla, escríbenos a hola@inglesconleo.com y con gusto te ayudamos.');
      }
    });
  }

  const logoutBtn = document.getElementById('navLogoutBtn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      await LeoBackend.signOut();
      location.href = 'miembros.html';
    });
  }

  block.style.display = 'flex';
}

function initOnboarding(onSaved){
  if(getProfile()) return;

  const overlay = document.createElement('div');
  overlay.className = 'onb-overlay';
  overlay.innerHTML = `
    <div class="onb-card">
      <h2>¡Bienvenido(a) a Inglés con Leo!</h2>
      <p>Cuéntanos un poco de ti para personalizar tu práctica.</p>
      <div class="onb-field">
        <label for="onbName">¿Cómo te llamas?</label>
        <input type="text" id="onbName" placeholder="Tu nombre" maxlength="30" autocomplete="off">
      </div>
      <div class="onb-field">
        <label>¿Cuál es tu nivel de inglés?</label>
        <div class="onb-levels" id="onbLevels">
          <label class="onb-level-opt">
            <input type="radio" name="onbLevel" value="principiante">
            <span>Principiante (A0): nunca he estudiado inglés</span>
          </label>
          <label class="onb-level-opt">
            <input type="radio" name="onbLevel" value="facil" checked>
            <span>Fácil (A1–A2): estoy empezando</span>
          </label>
          <label class="onb-level-opt">
            <input type="radio" name="onbLevel" value="medio">
            <span>Medio (B1–B2): me defiendo</span>
          </label>
          <label class="onb-level-opt">
            <input type="radio" name="onbLevel" value="avanzado">
            <span>Avanzado (C1+): quiero perfeccionar</span>
          </label>
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="onbSubmit">Empezar</button>
      <p class="gate-hint" style="margin-top:14px;"><a href="#" id="onbSkip" style="color:var(--ink-faint);font-weight:600;">Saltar por ahora</a></p>
    </div>`;
  document.body.appendChild(overlay);

  const opts = overlay.querySelectorAll('.onb-level-opt');
  function syncChecked(){ opts.forEach(o=> o.classList.toggle('checked', o.querySelector('input').checked)); }
  syncChecked();
  overlay.querySelectorAll('input[name=onbLevel]').forEach(r=> r.addEventListener('change', syncChecked));

  function finish(profile){
    saveProfile(profile);
    if(profile.name) saveNameToCloud(profile.name);
    overlay.remove();
    if(typeof onSaved === 'function') onSaved(profile);
  }
  overlay.querySelector('#onbSubmit').addEventListener('click', ()=>{
    const name = overlay.querySelector('#onbName').value.trim();
    const levelInput = overlay.querySelector('input[name=onbLevel]:checked');
    finish({ name: name || '', level: levelInput ? levelInput.value : 'facil', createdAt: Date.now() });
  });
  overlay.querySelector('#onbSkip').addEventListener('click', (e)=>{
    e.preventDefault();
    finish({ name:'', level:'facil', skipped:true, createdAt: Date.now() });
  });
}

/* ---------- Acceso de miembros (código + localStorage) ---------- */
const ACCESS_CODE = "LEO2026"; // <-- cambia este código cuando quieras

function isMemberUnlocked(){
  return sessionStorage.getItem('leo_member_unlocked') === '1';
}
/* Debe llamarse al inicio de cada página privada. Si el usuario no
   ha desbloqueado el área de miembros, lo regresa a miembros.html. */
function requireMember(){
  if(!isMemberUnlocked()){
    window.location.href = 'miembros.html';
    return false;
  }
  return true;
}
/* Si el usuario ya desbloqueó el área de miembros en esta sesión de
   navegador, cambia el CTA del navbar público para no repetirle
   "Entrar a miembros" cuando ya está adentro. */
function personalizeNav(){
  const cta = document.querySelector('.nav-cta');
  if(cta && isMemberUnlocked()){
    cta.textContent = 'Mi panel';
    cta.href = 'miembros.html';
  }
}

/* Animación sutil al hacer scroll: las secciones marcadas con
   .reveal (o .reveal-stagger, para que sus hijos aparezcan uno a uno)
   aparecen con un fade + leve desplazamiento cuando entran en pantalla.
   Respeta prefers-reduced-motion y no bloquea nada si el navegador
   no soporta IntersectionObserver. */
function initScrollReveal(){
  const els = document.querySelectorAll('.reveal, .reveal-stagger');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){
    els.forEach(el=> el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el=> io.observe(el));
}
function initAccessGate({ gateEl, contentEl, inputEl, btnEl, errorEl }){
  function unlock(){
    gateEl.style.display = 'none';
    contentEl.style.display = 'block';
    sessionStorage.setItem('leo_member_unlocked', '1');
  }
  if(isMemberUnlocked()){
    unlock();
    return true;
  }
  btnEl.addEventListener('click', ()=>{
    const val = inputEl.value.trim().toUpperCase();
    if(val === ACCESS_CODE){
      errorEl.classList.remove('show');
      unlock();
    } else {
      errorEl.classList.add('show');
    }
  });
  inputEl.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') btnEl.click(); });
  return false;
}

/* ============================================================
   PROGRESO — cómo se calcula (todo real, nada decorativo)
   ------------------------------------------------------------
   Guardamos un registro por cada sesión terminada:
     { skill, level, topics:[...], date:'YYYY-MM-DD', startedAt,
       durationMs, results:[{itemId, isCorrect}] }
   isCorrect es true/false para habilidades evaluables
   (gramática, vocabulario, listening) y null para actividades
   sin calificación automática (writing, speaking) — ahí solo
   contamos que se practicó, nunca inventamos un puntaje.

   A partir de esas sesiones calculamos, siempre al momento de
   mostrar la pantalla (nunca se guardan números "ya calculados"):

   - Ejercicios completados (semana) = suma de resultados de
     sesiones de los últimos 7 días.
   - Precisión (semana) = correctas / evaluadas de los últimos
     7 días (se ignoran los resultados null). Si no hay
     resultados evaluados, se muestra el aviso de falta de datos.
   - Días practicados (semana) = número de fechas distintas con
     al menos una sesión en los últimos 7 días.
   - Tiempo aproximado (semana) = suma de duración real de las
     sesiones (medida con Date.now() al empezar y terminar).
   - % de cada habilidad = (número de ítems distintos de esa
     habilidad que el usuario ya practicó al menos una vez) /
     (número total de ítems de esa habilidad en el banco de
     contenido) × 100. Es un % de cobertura, no una nota
     inventada, y funciona igual para habilidades evaluables y
     no evaluables.
   - Nivel actual = el nivel elegido por el usuario en su perfil
     (no un "nivel alcanzado" inferido, porque no existe una
     lógica de evaluación de nivel real detrás).
   ============================================================ */
const PROGRESS_KEY = 'leo_progress_v2';
const PROGRESS_DATE_MIGRATION_KEY = 'leo_progress_localdate_migrated_v1';
const MIN_SESSIONS_FOR_STATS = 1;

/* Identidad estable de una sesión. La fecha se deja fuera a propósito:
   versiones anteriores podían guardar la fecha en UTC y luego corregirla
   localmente, pero startedAt, actividad, temas y respuestas sí describen
   la misma sesión en el navegador y en Supabase. Sigue funcionando igual
   con sesiones de Plan de estudio: results ya trae su propia skill por
   ejercicio y JSON.stringify(s.results) la incluye tal cual, así que dos
   copias de la misma sesión (local y la que vuelve de la nube) generan
   la misma identidad sin ningún cambio aquí.

   NOTA (encontrado en auditoría del 2026-09-20): esta función y
   dedupeProgressSessions() se agregaron en el commit "Corregir
   sincronización de progreso duplicado" (2d50966, 2026-09-12 13:14) pero
   se borraron por accidente 20 minutos después en el commit "Agregar
   1000 ejercicios..." (87c7f2d, 2026-09-12 13:34), que sin querer
   sobreescribió loadProgress() con una versión más vieja. Desde entonces,
   syncProgressFromCloud() (backend.js) llamaba a una función que ya no
   existía; como esa llamada es la primera línea dentro de su try/catch,
   el error se comía en silencio y NINGUNA sesión de la nube se llegaba a
   fusionar con el progreso local (afectaba sobre todo abrir la cuenta en
   un dispositivo nuevo: el progreso de otros dispositivos no aparecía).
   Se restauran tal cual estaban, sin ningún cambio de diseño. */
function progressSessionIdentity(s){
  if(!s) return '';
  return [
    s.startedAt || '', s.skill || '', s.level || '',
    JSON.stringify(s.topics || []), JSON.stringify(s.results || [])
  ].join('|');
}

/* Las versiones anteriores podían conservar la sesión local y añadir la
   misma sesión al volver de la nube. Solo quitamos copias con la misma
   identidad exacta; si una de ellas tiene cloudId, se conserva esa porque
   ya está vinculada a su fila real de Supabase. Nunca toca datos remotos. */
function dedupeProgressSessions(p){
  if(!p || !Array.isArray(p.sessions)) return false;
  const unique = new Map();
  let changed = false;
  p.sessions.forEach(s=>{
    const key = progressSessionIdentity(s);
    const previous = unique.get(key);
    if(!previous){
      unique.set(key, s);
    } else {
      changed = true;
      if(!previous.cloudId && s.cloudId) unique.set(key, s);
    }
  });
  if(!changed) return false;
  p.sessions = Array.from(unique.values()).sort((a,b)=> (a.startedAt||0) - (b.startedAt||0));
  const lastReal = p.sessions.filter(x => x.skill !== 'check').pop();
  if(lastReal){
    const last = lastReal;
    p.lastActivity = { skill:last.skill, level:last.level, topic:(last.topics&&last.topics[0])||null, date:last.date };
  }
  return true;
}

/* Migracion de una sola vez: antes de que existiera localDateStr(), el
   campo "date" de cada sesion se calculaba con Date#toISOString(), que
   siempre da la fecha en UTC. Para alguien en Mexico (UTC-6), cualquier
   sesion hecha despues de las 6pm hora local quedaba guardada con la
   fecha del dia SIGUIENTE. El campo "startedAt" (timestamp en
   milisegundos) nunca tuvo ese problema, asi que aqui se usa para
   recalcular la fecha correcta de cada sesion ya guardada, una sola vez
   por navegador. Despues de correr, no se vuelve a tocar. */
function migrateProgressDatesIfNeeded(p){
  try{
    if(localStorage.getItem(PROGRESS_DATE_MIGRATION_KEY)) return p;
  }catch(e){ return p; }
  let changed = false;
  (p.sessions || []).forEach(s=>{
    if(!s || !s.startedAt) return;
    const correctDate = localDateStr(new Date(s.startedAt));
    if(s.date !== correctDate){
      s.date = correctDate;
      changed = true;
    }
  });
  const lastReal2 = (p.sessions || []).filter(x => x.skill !== 'check').pop();
  if(changed && lastReal2){
    const last = lastReal2;
    p.lastActivity = { skill: last.skill, level: last.level, topic: (last.topics && last.topics[0]) || null, date: last.date };
  }
  if(changed) saveProgressRaw(p);
  try{ localStorage.setItem(PROGRESS_DATE_MIGRATION_KEY, '1'); }catch(e){}
  return p;
}

function loadProgress(){
  try{
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if(p && Array.isArray(p.sessions)){
      migrateProgressDatesIfNeeded(p);
      if(dedupeProgressSessions(p)) saveProgressRaw(p);
      return p;
    }
  }catch(e){}
  return { sessions: [], lastActivity: null };
}
function saveProgressRaw(p){
  try{ localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }catch(e){}
}

/* ------------------------------------------------------------
   REGISTRO DE LA CONFUSIÓN (aditivo, privado, sin tablas nuevas)
   Además de {itemId, isCorrect}, cada respuesta CALIFICADA de gramática guarda
   (solo si se conoce; nada se inventa) para poder saber no solo QUÉ falló sino
   QUÉ confusión concreta lo produjo y si la recomendación sirvió:
     m  microId del ejercicio (item.micro), cuando ya lo tiene
     p  la opción que eligió (texto del propio ejercicio, máx. 40 caracteres)
     t  nº de intento al responder (solo si > 1: "Volver a intentar")
     w  la PRIMERA opción equivocada cuando hubo reintento (el reintento
        reemplaza el fallo en results, así que sin esto la confusión se perdía)
     f  1 = primera vez que esta cuenta/navegador ve ese ejercicio
     o  origen de la práctica: rec (?via=rec), tema, foco o hoy (?empezar=1)
   Los campos que ya leían todos los cálculos (itemId, isCorrect) no cambian, así que
   el diagnóstico, el repaso y el resumen siguen igual. Solo viajan datos del
   ejercicio: ninguna escritura libre del alumno ni dato personal.
   ------------------------------------------------------------ */
const ANSWER_LOG = new Map();   // itemId -> { pick, t, w, ok } de lo respondido en esta página
const ANSWER_PICK_MAX = 40;
let RETRY_ITEM_ID = null;       // ejercicio que se está reintentando justo ahora

function noteGrammarAnswer(container, item, isCorrect, pick){
  try{
    if(!item || !item.id) return;
    const retry = RETRY_ITEM_ID === item.id;
    RETRY_ITEM_ID = null;
    const prev = retry ? ANSWER_LOG.get(item.id) : null;
    const entry = { pick: String(pick == null ? '' : pick).slice(0, ANSWER_PICK_MAX), t: prev ? prev.t + 1 : 1, ok: isCorrect === true };
    if(prev){
      const wrong = prev.w || (prev.ok === false ? prev.pick : '');
      if(wrong) entry.w = wrong;
    }
    ANSWER_LOG.set(item.id, entry);
    if(container && container.dataset) container.dataset.answeredItem = item.id;
  }catch(e){}
}
// Se llama al pulsar "Volver a intentar": la próxima respuesta a ese ejercicio es un reintento.
function markGrammarRetry(container){
  RETRY_ITEM_ID = (container && container.dataset && container.dataset.answeredItem) || null;
}
function practiceOrigin(){
  try{
    const q = new URLSearchParams(location.search);
    if(q.get('micro')) return 'micro';
    if(q.get('via') === 'rec') return 'rec';
    if(q.get('tema')) return 'tema';
    if(q.get('foco')) return 'foco';
    if(q.get('empezar')) return 'hoy';
  }catch(e){}
  return null;
}
// La página del Plan lee la dirección y la LIMPIA antes de armar la sesión. Esto guarda, una sola vez al cargar app.js,
// lo que traía (micro / comprobar / origen) y se entrega UNA vez, para que "Hacer otra sesión" sea una sesión normal.
const PAGE_PLAN_PARAMS = (function(){
  const out = { micro:null, comprobar:null, origin:null };
  try{ const q = new URLSearchParams(location.search); out.micro = q.get('micro') || null; out.comprobar = q.get('comprobar') || null; out.origin = practiceOrigin(); }catch(e){}
  return out;
})();
function takePagePlanParams(){ const p = { micro:PAGE_PLAN_PARAMS.micro, comprobar:PAGE_PLAN_PARAMS.comprobar }; PAGE_PLAN_PARAMS.micro = null; PAGE_PLAN_PARAMS.comprobar = null; return p; }
function takePageOrigin(){ const o = PAGE_PLAN_PARAMS.origin; PAGE_PLAN_PARAMS.origin = null; return o; }
// Devuelve results con los campos extra (copias; los originales no se tocan).
function instrumentResults(results, seenBefore){
  if(!Array.isArray(results) || !results.length) return results || [];
  const origin = takePageOrigin() || practiceOrigin();
  let index = null;
  try{ index = getMistakesItemIndex(); }catch(e){}
  const seen = new Set(seenBefore || []);
  const out = results.map(r=>{
    const log = r && ANSWER_LOG.get(r.itemId);
    const first = r && r.itemId && !seen.has(r.itemId);
    if(r && r.itemId) seen.add(r.itemId);
    const graded = !!r && (r.isCorrect === true || r.isCorrect === false);
    const micro = graded ? microOfItem(r.itemId, index) : null;   // sale del ejercicio, no depende de la página
    if(!log || !graded || log.ok !== r.isCorrect) return (micro && !r.m) ? Object.assign({}, r, { m: micro }) : r;
    const extra = {};
    if(micro) extra.m = micro;
    if(log.pick) extra.p = log.pick;
    if(log.t > 1) extra.t = log.t;
    if(log.w) extra.w = log.w;
    if(first) extra.f = 1;
    if(origin) extra.o = origin;
    return Object.assign({}, r, extra);
  });
  results.forEach(r=>{ if(r && r.itemId) ANSWER_LOG.delete(r.itemId); });
  return out;
}

/* ------------------------------------------------------------
   MICROTEMAS: práctica vs comprobación, y señales agregadas por microtema
   Práctica = GRAMMAR_BANK (ejercicios con `micro`). Comprobación = GRAMMAR_CHECK_BANK,
   un banco APARTE que ningún motor de sesión lee: así un ejercicio de comprobación no puede
   salir antes de tiempo como práctica normal. pickCheckItems() solo entrega los que ese
   alumno no ha visto como comprobación. Para saberlo NO se recorre el historial: se lleva
   un conjunto pequeño (leo_check_seen_v1) que crece solo con ejercicios de comprobación.
   Las señales por microtema (leo_micro_stats_v1) se actualizan al guardar cada sesión
   (cuesta lo que pesa la sesión, no el historial) y decidir una recomendación es leer UN
   objeto por microtema. Nada de esto toca mistake_stats, el diagnóstico ni "dominado".
   ------------------------------------------------------------ */
const CHECK_SEEN_KEY = 'leo_check_seen_v1';
const MICRO_STATS_KEY = 'leo_micro_stats_v1';
const MICRO_STATS_MAX_ITEMS = 24;   // ejercicios distintos que se recuerdan por microtema
const MICRO_STATS_MAX_DAYS = 8;     // días con fallos que se recuerdan por microtema
let _checkIndex = null;
function checkIndex(){
  if(_checkIndex) return _checkIndex;
  const byId = new Map(), byMicro = new Map();
  const practice = (typeof getMistakesItemIndex === 'function') ? getMistakesItemIndex() : new Map();
  (typeof GRAMMAR_CHECK_BANK !== 'undefined' ? GRAMMAR_CHECK_BANK : []).forEach(it=>{
    if(!it || !it.id || !it.micro || practice.has(it.id)) return;   // si un id ya es práctica, JAMÁS se sirve como comprobación
    byId.set(it.id, it);
    if(!byMicro.has(it.micro)) byMicro.set(it.micro, []);
    byMicro.get(it.micro).push(it);
  });
  _checkIndex = { byId, byMicro };
  return _checkIndex;
}
function isCheckItem(itemId){ return checkIndex().byId.has(itemId); }
function microOfItem(itemId, index){
  const found = index && index.get(itemId);
  if(found && found.kind === 'grammar' && found.item && found.item.micro) return found.item.micro;
  const ck = checkIndex().byId.get(itemId);
  return ck ? ck.micro : null;
}
function readJsonKey(key, fallback){
  try{ const v = JSON.parse(localStorage.getItem(key)); return (v && typeof v === 'object') ? v : fallback; }catch(e){ return fallback; }
}
// Ejercicios de comprobación ya vistos por este alumno. Si el conjunto no existe (otro
// dispositivo), se reconstruye UNA vez solo con las sesiones de comprobación (skill 'check').
function checkSeenSet(){
  const saved = readJsonKey(CHECK_SEEN_KEY, null);
  if(saved) return saved;
  const seen = {};
  try{ loadProgress().sessions.forEach(s => { if(s && s.skill === 'check') (s.results || []).forEach(r => { if(r && r.itemId) seen[r.itemId] = 1; }); }); }catch(e){}
  try{ localStorage.setItem(CHECK_SEEN_KEY, JSON.stringify(seen)); }catch(e){}
  return seen;
}
function markChecksConsumed(results){
  try{
    const ids = (results || []).filter(r => r && r.itemId && isCheckItem(r.itemId)).map(r => r.itemId);
    if(!ids.length) return;
    const seen = checkSeenSet();
    ids.forEach(id => { seen[id] = 1; });
    localStorage.setItem(CHECK_SEEN_KEY, JSON.stringify(seen));
  }catch(e){}
}
// n ejercicios de comprobación NUEVOS para este alumno, o null si no hay suficientes
// (en ese caso no se debe afirmar nada: mejor no comprobar que repetir un ejercicio visto).
function pickCheckItems(microId, n){
  const items = checkIndex().byMicro.get(microId) || [];
  const seen = checkSeenSet();
  const fresh = items.filter(it => !seen[it.id]);
  if(!n || fresh.length < n) return null;
  for(let i = fresh.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const t = fresh[i]; fresh[i] = fresh[j]; fresh[j] = t; }
  return fresh.slice(0, n);
}
// Señales por microtema (todas LOCALES por dispositivo):
//   a, w, wi, wd, last   práctica: intentos, fallos del primer intento, ejercicios y días con fallos
//   wk                   fecha en que se detectó la debilidad (null = sin alerta)
//   pr, pc               respuestas de práctica DESDE wk, y cuántas salieron bien al primer intento
//   ck                   comprobación: respuestas y aciertos acumulados
//   lc                   última comprobación completa { d: fecha, n, ok }
// "Fallo" = el primer intento salió mal (también cuando acertó al reintentar: results.w).
//
// REGLAS DEL FLUJO (deterministas; la debilidad reutiliza microWeakness, no hay otro criterio):
//   DÉBIL           >=3 ejercicios distintos con fallo, o >=2 distintos en días distintos. Repetir el mismo
//                   ejercicio no cuenta. Al detectarla se guarda wk.
//   PRÁCTICA        con wk y el microtema ACTIVO se recomienda reforzarlo: Plan con foco en ese microtema y su
//                   sección de la clase. Desaparece cuando la alerta se cierra (ver abajo).
//   COMPROBACIÓN    se ofrece con wk, pr >= CHECK_AFTER_PRACTICE, sin comprobación desde wk y con CHECK_SIZE
//                   ejercicios inéditos. Es un enlace ("Hoy te conviene" y fin de sesión), nunca una ventana.
//   RESULTADO       3/3 recuperado: se cierra la alerta y se borra la evidencia. 2/3 mejora parcial: se cierra
//                   la alerta SIN marcarlo recuperado. 0-1/3: sigue débil (la alerta continúa).
//   DEJA DE OFRECERSE  la comprobación, al responderla o si no quedan inéditas. El refuerzo, al cerrarse la
//                   alerta o, si no hay comprobación posible (o ya se hizo), tras AUTOCLEAR_MIN respuestas con
//                   >=AUTOCLEAR_ACC% de aciertos al primer intento.
// Nada de esto toca mistake_stats, el diagnóstico global ni "dominado".
const MICRO_FLOW = { CHECK_SIZE: 3, CHECK_AFTER_PRACTICE: 5, AUTOCLEAR_MIN: 6, AUTOCLEAR_ACC: 80 };
function newMicroStat(){ return { a:0, w:0, wi:{}, wd:[], last:null, ck:{ a:0, ok:0 }, wk:null, pr:0, pc:0, lc:null }; }
// ¿Quedan CHECK_SIZE comprobaciones que este alumno no ha visto? (sin barajar: solo cuenta)
function checkAvailable(microId){
  const items = checkIndex().byMicro.get(microId) || [];
  const seen = checkSeenSet();
  return items.filter(it => !seen[it.id]).length >= MICRO_FLOW.CHECK_SIZE;
}
function microCheckedSinceWeak(s){ return !!(s && s.wk && s.lc && s.lc.d >= s.wk); }
function clearMicroWeakness(s){ s.wk = null; s.wi = {}; s.wd = []; s.pr = 0; s.pc = 0; }
function applyCheckOutcome(s, t, date){
  s.lc = { d: date, n: t.n, ok: t.ok };
  if(t.ok >= t.n - 1){ clearMicroWeakness(s); return; }   // 3/3 recuperado; 2/3 mejora parcial
  if(!s.wk) s.wk = date;                                   // 0-1/3: sigue débil aunque no hubiera evidencia previa
  s.pr = 0; s.pc = 0;
}
function microAutoClear(s, microId){
  if(!s.wk || s.pr < MICRO_FLOW.AUTOCLEAR_MIN || s.pc * 100 < MICRO_FLOW.AUTOCLEAR_ACC * s.pr) return false;
  return microCheckedSinceWeak(s) || !checkAvailable(microId);
}
function updateMicroStats(results, date){
  try{
    const touched = (results || []).filter(r => r && r.m && (r.isCorrect === true || r.isCorrect === false));
    if(!touched.length) return;
    const all = readJsonKey(MICRO_STATS_KEY, {});
    const hadWeak = {}, checkTally = {};
    touched.forEach(r=>{
      const s = all[r.m] || (all[r.m] = newMicroStat());
      if(s.wk === undefined){ s.wk = null; s.pr = 0; s.pc = 0; s.lc = null; }   // señales guardadas antes del flujo
      if(!(r.m in hadWeak)) hadWeak[r.m] = !!s.wk;
      s.last = date;
      if(isCheckItem(r.itemId)){                                                  // la comprobación se lleva aparte
        s.ck.a++; if(r.isCorrect) s.ck.ok++;
        const t = checkTally[r.m] || (checkTally[r.m] = { n:0, ok:0 });
        t.n++; if(r.isCorrect) t.ok++;
        return;
      }
      s.a++;
      const firstFail = r.isCorrect === false || !!r.w;
      if(firstFail){
        s.w++;
        if(s.wi[r.itemId] || Object.keys(s.wi).length < MICRO_STATS_MAX_ITEMS) s.wi[r.itemId] = (s.wi[r.itemId] || 0) + 1;
        if(s.wd.indexOf(date) === -1) s.wd = s.wd.concat(date).slice(-MICRO_STATS_MAX_DAYS);
      }
      if(hadWeak[r.m]){ s.pr++; if(!firstFail) s.pc++; }
    });
    Object.keys(hadWeak).forEach(m=>{
      const s = all[m], t = checkTally[m];
      if(t && t.n >= MICRO_FLOW.CHECK_SIZE) applyCheckOutcome(s, t, date);
      else if(!hadWeak[m] && !s.wk && microWeakness(s).weak){ s.wk = date; s.pr = 0; s.pc = 0; }
      else if(hadWeak[m] && microAutoClear(s, m)) clearMicroWeakness(s);
    });
    localStorage.setItem(MICRO_STATS_KEY, JSON.stringify(all));
  }catch(e){}
}
// Regla de debilidad: errores en ejercicios DISTINTOS (>=3, o >=2 en días distintos). Repetir el
// mismo ejercicio no es debilidad del microtema: es un ejercicio mal entendido o mal leído.
function microWeakness(stat){
  const ids = stat && stat.wi ? Object.keys(stat.wi) : [];
  const days = stat && stat.wd ? stat.wd.length : 0;
  if(ids.length >= 3 || (ids.length >= 2 && days >= 2)) return { weak:true, reason:'varios-ejercicios' };
  if(ids.length === 1 && stat.wi[ids[0]] >= 2) return { weak:false, reason:'mismo-ejercicio' };
  return { weak:false, reason:null };
}

// Estado de un microtema para decidir qué ofrecer: sin-datos | sin-alerta | recuperado | mejorando |
// debil | listo-comprobar | debil-comprobado.
function microFlowState(microId, s){
  if(!s) return { state:'sin-datos' };
  if(!s.wk){
    if(s.lc && s.lc.ok >= s.lc.n) return { state:'recuperado' };
    if(s.lc && s.lc.ok === s.lc.n - 1) return { state:'mejorando' };
    return { state:'sin-alerta' };
  }
  if(!microCheckedSinceWeak(s) && s.pr >= MICRO_FLOW.CHECK_AFTER_PRACTICE && checkAvailable(microId)) return { state:'listo-comprobar' };
  return { state: microCheckedSinceWeak(s) ? 'debil-comprobado' : 'debil' };
}
// Solo los microtemas declarados `active:true` en temas.js generan recomendaciones. Los demás se comportan como siempre.
function microIsActive(microId){ return typeof MICRO_BY_ID !== 'undefined' && !!MICRO_BY_ID[microId] && MICRO_BY_ID[microId].active === true; }
let _microLevelIndex = null;
function microHasItemsAt(microId, level){
  if(!_microLevelIndex){
    _microLevelIndex = {};
    LEVELS.forEach(lv => {
      const set = new Set();
      (GRAMMAR_BANK[lv] || []).forEach(v => v.forEach(b => b.items.forEach(i => { if(i.micro) set.add(i.micro); })));
      _microLevelIndex[lv] = set;
    });
  }
  return !!(_microLevelIndex[level] && _microLevelIndex[level].has(microId));
}
// Enlace a la sección EXACTA de la clase para ese microtema (o null si no tiene clase).
function microLessonHref(m){
  const res = (typeof microResources === 'function') ? microResources(m.id) : null;
  if(!res || !res.lesson || !res.lesson.article) return null;
  return res.lesson.article + '?tema=' + encodeURIComponent(m.tema) + '&via=rec' + (res.lesson.anchor ? '#' + res.lesson.anchor : '');
}
function microPracticeHref(m, start){
  const tema = (typeof TEMA_BY_ID !== 'undefined' && TEMA_BY_ID[m.tema]) || {};
  return planFocusHref(tema.family, !!start, m.tema) + '&micro=' + encodeURIComponent(m.id);
}
// Acción lista para "Hoy te conviene" y el fin de sesión; nombra el concepto exacto, no la familia.
function microAction(m, s, state){
  const nWrong = s && s.wi ? Object.keys(s.wi).length : 0;
  const lesson = microLessonHref(m);
  const base = { micro: m.id, tema: m.tema, microState: state, evidence: nWrong, article: lesson, articleLabel: lesson ? 'Ver la clase' : undefined };
  if(state === 'listo-comprobar'){
    return Object.assign(base, { title: `Comprobar: ${m.label}`, reason: `Ya practicaste esto. Son ${MICRO_FLOW.CHECK_SIZE} ejercicios nuevos para ver si ya lo dominas.`,
      href: 'plan-estudio.html?comprobar=' + encodeURIComponent(m.id), cta: 'Comprobar', voice: 'casi-dominas' });
  }
  const checked = microCheckedSinceWeak(s);
  return Object.assign(base, { title: `Reforzar ${m.label}`,
    reason: checked ? `En la comprobación acertaste ${s.lc.ok} de ${s.lc.n}. Repasa la explicación y sigue practicando este punto.`
      : nWrong >= 3 ? `Fallaste ${nWrong} ejercicios distintos de este punto.` : 'Fallaste ejercicios distintos de este punto en días diferentes.',
    href: microPracticeHref(m, false), cta: 'Reforzar ahora', voice: 'sigue-tema' });
}
// Recomendaciones por microtema (solo ACTIVOS, con ejercicios en el nivel del alumno). Primero la comprobación lista,
// luego la que acumula más ejercicios distintos con fallo. `only` (Set de ids) limita a los tocados en una sesión.
function microDiagActions(level, only){
  if(typeof MICROS === 'undefined') return [];
  const all = readJsonKey(MICRO_STATS_KEY, {});
  const out = [];
  MICROS.forEach(m=>{
    if(!m.active || (only && !only.has(m.id)) || !microHasItemsAt(m.id, level)) return;
    const s = all[m.id], st = microFlowState(m.id, s);
    if(st.state !== 'listo-comprobar' && st.state !== 'debil' && st.state !== 'debil-comprobado') return;
    out.push(microAction(m, s, st.state));
  });
  const rank = a => a.microState === 'listo-comprobar' ? 0 : 1;
  return out.sort((a, b) => (rank(a) - rank(b)) || (b.evidence - a.evidence));
}

/* Llamado por cada motor de sesión al terminar una sesión. */
function recordSession({ skill, level, topics, results, startedAt }){
  const p = loadProgress();
  const now = Date.now();
  const seenBefore = new Set();
  p.sessions.forEach(s => (s.results || []).forEach(r => { if(r && r.itemId) seenBefore.add(r.itemId); }));
  const session = {
    skill, level,
    topics: topics || [],
    date: localDateStr(new Date(now)),
    startedAt: startedAt || now,
    durationMs: Math.max(0, now - (startedAt || now)),
    results: instrumentResults(results, seenBefore)
  };
  markChecksConsumed(session.results);
  updateMicroStats(session.results, session.date);
  p.sessions.push(session);
  if(skill !== 'check') p.lastActivity = { skill, level, topic: (topics && topics[0]) || null, date: session.date };
  saveProgressRaw(p);
  if(typeof LeoBackend !== 'undefined' && LeoBackend.isConfigured()){
    LeoBackend.pushSession(session);
  }
  updateMistakeStatsFromResults(session.results);
  return p;
}

function sessionsInLastDays(p, days){
  const cutoff = Date.now() - days*86400000;
  return p.sessions.filter(s => (s.startedAt || 0) >= cutoff);
}

function bankSizeFor(skill){
  if(skill === 'gramatica'){
    return LEVELS.reduce((sum,l)=> sum + GRAMMAR_BANK[l].reduce((vs,variant)=> vs + variant.reduce((s,t)=> s + t.items.length, 0), 0), 0);
  }
  if(skill === 'vocabulario') return LEVELS.reduce((sum,l)=> sum + VOCAB_BANK[l].reduce((vs,variant)=> vs + variant.length, 0), 0);
  if(skill === 'listening') return LEVELS.reduce((sum,l)=> sum + LISTENING_BANK[l].reduce((vs,variant)=> vs + variant.length, 0), 0);
  if(skill === 'lectura') return LEVELS.reduce((sum,l)=> sum + READING_BANK[l].reduce((vs,variant)=> vs + variant.length, 0), 0);
  if(skill === 'writing') return LEVELS.reduce((sum,l)=> sum + WRITING_BANK[l].reduce((vs,variant)=> vs + variant.length, 0), 0);
  if(skill === 'speaking') return LEVELS.reduce((sum,l)=> sum + SPEAKING_BANK[l].reduce((vs,variant)=> vs + variant.length, 0), 0);
  if(skill === 'mixto') return LEVELS.length * MIX_NOMINAL_SIZE;
  return 0;
}

function attemptedItemIdsFor(p, skill){
  const ids = new Set();
  // Normalmente un resultado pertenece a la habilidad de su sesion
  // (s.skill), pero "Plan de estudio" guarda UNA sola sesion mezclando
  // varias habilidades reales, y cada resultado individual trae su
  // propia r.skill para saber a cual pertenece de verdad (ver
  // runPlanSessionCore). Si un resultado no trae r.skill (todas las
  // sesiones de antes de Plan de estudio), se usa s.skill como siempre,
  // asi que el comportamiento previo no cambia en nada.
  p.sessions.forEach(s=>{
    (s.results||[]).forEach(r=>{
      if((r.skill || s.skill) === skill) ids.add(r.itemId);
    });
  });
  return ids;
}

function computeSkillCoverage(p, skill){
  const total = bankSizeFor(skill);
  if(!total) return 0;
  const attempted = attemptedItemIdsFor(p, skill).size;
  return Math.round(Math.min(attempted, total) / total * 100);
}

function computeWeeklyStats(){
  const p = loadProgress();
  const week = sessionsInLastDays(p, 7);
  const exercises = week.reduce((n,s)=> n + (s.results ? s.results.length : 0), 0);
  const graded = [];
  week.forEach(s => { if(s.skill === 'check') return; (s.results||[]).forEach(r=>{ if(r.isCorrect === true || r.isCorrect === false) graded.push(r); }); });
  const correct = graded.filter(r=>r.isCorrect).length;
  const accuracy = graded.length ? Math.round(correct / graded.length * 100) : null;
  const days = new Set(week.map(s=>s.date)).size;
  const minutes = Math.round(week.reduce((n,s)=> n + (s.durationMs||0), 0) / 60000);
  return { exercises, accuracy, days, minutes, hasData: week.length >= MIN_SESSIONS_FOR_STATS };
}

/* Fechas (YYYY-MM-DD) que forman parte de la racha ACTIVA actual, del día
   más reciente hacia atrás. Igual que antes, si hay DOS días seguidos sin
   práctica la racha se corta ahí (por diseño: si se pierde, se pierde, no
   sigue contando ni mostrándose). La diferencia es que ahora se tolera UN
   solo día salteado dentro de ese recorrido sin romper la racha (estilo
   "streak freeze" de Chess.com/Duolingo): ese día se salta calladito y se
   sigue contando hacia atrás, pero ese día en particular NO se agrega a
   streakDates (no cuenta como practicado), así que el número de racha no
   crece ese día, aunque tampoco se resetea a 0. getFrozenStreakDate() de
   abajo dice cuál fue ese día salteado, para poder pintarlo distinto
   (❄️) en vez de vacío en los puntitos de racha. */
function computeActiveStreakDates(){
  const p = loadProgress();
  const practicedSet = new Set(p.sessions.map(s=>s.date));
  if(!practicedSet.size) return [];

  const streakDates = [];
  let freezeAvailable = true;
  let cursor = new Date();
  // Si hoy todavía no se practicó, no cuenta como "hueco" todavía (el día
  // no ha terminado): arrancamos el recorrido desde ayer.
  if(!practicedSet.has(localDateStr(cursor))){
    cursor.setDate(cursor.getDate()-1);
  }

  while(true){
    const cursorStr = localDateStr(cursor);
    if(practicedSet.has(cursorStr)){
      streakDates.push(cursorStr);
    } else if(freezeAvailable){
      freezeAvailable = false;
    } else {
      break;
    }
    cursor.setDate(cursor.getDate()-1);
  }
  return streakDates;
}

/* La fecha (YYYY-MM-DD) del único día que se saltó "congelado" dentro de
   la racha activa actual, o null si no hay ninguno (porque no hubo huecos,
   o porque no hay racha). La usan renderStreakCard() y renderStatCards()
   para pintar ese día con el ícono de pausa en vez de vacío. */
function getFrozenStreakDate(){
  const p = loadProgress();
  const practicedSet = new Set(p.sessions.map(s=>s.date));
  if(!practicedSet.size) return null;

  let freezeAvailable = true;
  let cursor = new Date();
  if(!practicedSet.has(localDateStr(cursor))){
    cursor.setDate(cursor.getDate()-1);
  }
  while(true){
    const cursorStr = localDateStr(cursor);
    if(practicedSet.has(cursorStr)){
      cursor.setDate(cursor.getDate()-1);
      continue;
    }
    if(freezeAvailable){
      return cursorStr;
    }
    return null;
  }
}

function computeStreak(){
  return computeActiveStreakDates().length;
}

const SKILL_LABELS = { gramatica:'Gramática', vocabulario:'Vocabulario', listening:'Listening', lectura:'Lectura', writing:'Writing', speaking:'Speaking', mixto:'Mixto' };
const SKILL_COLORS = { gramatica:'#EF5A45', vocabulario:'#1FA463', listening:'#3554F0', lectura:'#0D9488', writing:'#F5A524', speaking:'#8B5CF6', mixto:'#0EA5A0' };
const SKILL_PAGE = { gramatica:'gramatica.html', vocabulario:'vocabulario.html', listening:'listening.html', lectura:'lectura.html', writing:'writing.html', speaking:'speaking.html', mixto:'mixto.html' };

// "Clases interactivas" es una actividad aparte de las 5 habilidades de
// arriba (no debe sumarse a sus anillos/porcentajes de cobertura, ver
// computeTotalStats y la lista "Tus habilidades"), pero SÍ necesita su propia
// etiqueta/color/página para mostrarse bien en "Continúa donde te
// quedaste" y "Tu actividad reciente". Por eso viven en objetos aparte
// en vez de agregarse a SKILL_LABELS (que también se usa para listar
// las 5 habilidades principales con Object.keys()).
const DISPLAY_SKILL_LABELS = Object.assign({ check:'Comprobación', plan:'Plan de estudio', clases:'Clases interactivas', errores:'Repaso de errores', 'reto-diario':'Reto diario', juego:'English Rush', 'cambridge-reading':'Cambridge Reading', 'cambridge-listening':'Cambridge Listening', 'cambridge-writing':'Cambridge Writing', 'cambridge-speaking':'Cambridge Speaking', 'toefl-reading':'TOEFL Reading', 'toefl-listening':'TOEFL Listening', 'toefl-speaking':'TOEFL Speaking', 'toefl-writing':'TOEFL Writing', 'ielts-reading':'IELTS Reading', 'ielts-listening':'IELTS Listening', 'ielts-speaking':'IELTS Speaking', 'ielts-writing':'IELTS Writing', 'toeic-listening':'TOEIC Listening', 'toeic-reading':'TOEIC Reading', 'toeic-speaking':'TOEIC Speaking', 'toeic-writing':'TOEIC Writing' }, SKILL_LABELS);
const DISPLAY_SKILL_COLORS = Object.assign({ check:'#253ECC', plan:'#253ECC', clases:'#253ECC', errores:'#DC2626', 'reto-diario':'#F5A524', juego:'#DB2777', 'cambridge-reading':'#B45309', 'cambridge-listening':'#B45309', 'cambridge-writing':'#B45309', 'cambridge-speaking':'#B45309', 'toefl-reading':'#6D28D9', 'toefl-listening':'#6D28D9', 'toefl-speaking':'#6D28D9', 'toefl-writing':'#6D28D9', 'ielts-reading':'#0F766E', 'ielts-listening':'#0F766E', 'ielts-speaking':'#0F766E', 'ielts-writing':'#0F766E', 'toeic-listening':'#253ECC', 'toeic-reading':'#253ECC', 'toeic-speaking':'#253ECC', 'toeic-writing':'#253ECC' }, SKILL_COLORS);
const DISPLAY_SKILL_PAGE = Object.assign({ check:'plan-estudio.html', clases:'clases.html', errores:'errores.html', 'reto-diario':'miembros.html', juego:'juego.html', 'cambridge-reading':'cambridge.html', 'cambridge-listening':'cambridge.html', 'cambridge-writing':'cambridge.html', 'cambridge-speaking':'cambridge.html', 'toefl-reading':'toefl.html', 'toefl-listening':'toefl.html', 'toefl-speaking':'toefl.html', 'toefl-writing':'toefl.html', 'ielts-reading':'ielts.html', 'ielts-listening':'ielts.html', 'ielts-speaking':'ielts.html', 'ielts-writing':'ielts.html', 'toeic-listening':'toeic.html', 'toeic-reading':'toeic.html', 'toeic-speaking':'toeic.html', 'toeic-writing':'toeic.html' }, SKILL_PAGE);

// Mixto no tiene su propio banco: combina ítems reales de los otros 5.
// Usamos un tamaño nominal (8 ítems por sesión, igual a MIX_COUNTS) solo
// para que la barra de cobertura en Progreso tenga un total razonable.
const MIX_NOMINAL_SIZE = 8;

function bankSizeForLevel(skill, level){
  if(skill === 'gramatica') return GRAMMAR_BANK[level].reduce((vs,variant)=> vs + variant.reduce((s,t)=> s+t.items.length, 0), 0);
  if(skill === 'vocabulario') return VOCAB_BANK[level].reduce((vs,variant)=> vs + variant.length, 0);
  if(skill === 'listening') return LISTENING_BANK[level].reduce((vs,variant)=> vs + variant.length, 0);
  if(skill === 'lectura') return READING_BANK[level].reduce((vs,variant)=> vs + variant.length, 0);
  if(skill === 'writing') return WRITING_BANK[level].reduce((vs,variant)=> vs + variant.length, 0);
  if(skill === 'speaking') return SPEAKING_BANK[level].reduce((vs,variant)=> vs + variant.length, 0);
  if(skill === 'mixto') return MIX_NOMINAL_SIZE;
  return 0;
}

/* ---------- Selección de variante de sesión (evita repetir contenido) ---------- */
const LAST_VARIANT_KEY = 'leo_last_variant';
function getLastVariantMap(){
  try{ return JSON.parse(localStorage.getItem(LAST_VARIANT_KEY)) || {}; }
  catch(e){ return {}; }
}
function saveLastVariantMap(map){
  try{ localStorage.setItem(LAST_VARIANT_KEY, JSON.stringify(map)); }
  catch(e){ /* localStorage no disponible: simplemente no recordamos la última variante */ }
}
/* Indice exacto (dentro de cada BANK[skill][level]) de la variante que se
   agrego pensada solo para Miembros (ver DEVLOG). Se guarda por indice fijo,
   no por posicion relativa, para que agregar mas contenido despues (para
   todos o solo miembros) nunca desordene cual variante sigue bloqueada. */
const MEMBERS_ONLY_VARIANT_INDEX = {
  gramatica:   { principiante:[2,4,5,6], facil:[6,8,9,10], medio:[6,8,9,10], avanzado:[6,8,9,10] },
  vocabulario: { principiante:[2,4,5,6], facil:[6,8,9,10], medio:[6,8,9,10], avanzado:[6,8,9,10] },
  listening:   { principiante:[5,7,8,9], facil:[10,12,13,14], medio:[7,9,10,11], avanzado:[7,9,10,11] },
  writing:     { principiante:[2,4,5,6], facil:[6,8,9,10], medio:[6,8,9,10], avanzado:[6,8,9,10] },
  speaking:    { principiante:[5,7,8], facil:[6,8,9], medio:[6,8,9], avanzado:[6,8,9] }
};
function pickVariantIndex(skill, level, variantCount, excludeIndex){
  if(!variantCount || variantCount <= 1) return 0;
  const map = getLastVariantMap();
  const key = skill + '_' + level;
  const last = map[key];
  const excludeSet = Array.isArray(excludeIndex) ? excludeIndex : (excludeIndex === undefined ? [] : [excludeIndex]);
  const choices = [];
  for(let i=0; i<variantCount; i++){ if(i !== last && excludeSet.indexOf(i) === -1) choices.push(i); }
  const pool = choices.length ? choices : [0];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  map[key] = pick;
  saveLastVariantMap(map);
  return pick;
}

/* ---------- Largo de sesión (corta/media/larga) ----------
   Preferencia global (como el nivel): se guarda una sola vez y se
   respeta al cambiar de habilidad. La cantidad de ejercicios es la
   misma sin importar la habilidad, para que "corta" se sienta igual
   de corta en listening que en vocabulario. */
const SESSION_LENGTHS = {
  corta: { label:'Corta', sub:'~5 ejercicios', items:5 },
  media: { label:'Media', sub:'~9 ejercicios', items:9 },
  larga: { label:'Larga', sub:'~15 ejercicios', items:15 }
};
const SESSION_LENGTH_KEY = 'leo_session_length';
function getSessionLength(){
  try{
    const v = localStorage.getItem(SESSION_LENGTH_KEY);
    return SESSION_LENGTHS[v] ? v : 'media';
  }catch(e){ return 'media'; }
}
function setSessionLength(len){
  try{ if(SESSION_LENGTHS[len]) localStorage.setItem(SESSION_LENGTH_KEY, len); }catch(e){}
}
/* Componente "tonto": solo dibuja las 3 tarjetas de duración y avisa con
   onChange(len) cuando se elige una distinta a la actual. NO guarda nada
   ni actualiza aria-pressed por sí solo — eso lo maneja quien lo llama
   (ver wireSessionLengthSelector), porque cambiar la duración a veces
   necesita confirmar antes con el usuario (ver esa función). */
function renderSessionLengthSelector(container, selected, onChange){
  if(!container) return;
  container.innerHTML = Object.keys(SESSION_LENGTHS).map(key => `
    <button type="button" class="length-card" data-length="${key}" aria-pressed="${key===selected}">
      <span class="length-name">${SESSION_LENGTHS[key].label}</span>
      <span class="length-sub">${SESSION_LENGTHS[key].sub}</span>
    </button>`).join('');
  container.querySelectorAll('.length-card').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const len = btn.dataset.length;
      if(len === selected) return; // ya esta seleccionada, no hay nada que hacer
      onChange(len);
    });
  });
}

/* Envuelve renderSessionLengthSelector para las 6 páginas de habilidad con
   niveles + duración (Gramática, Vocabulario, Listening, Lectura, Writing,
   Speaking). Antes de este arreglo, cambiar la duración mientras había una
   sesión a medias no hacía nada visible: runXSession siempre prioriza
   resumir la sesión guardada (con su cantidad de ejercicios original), así
   que la nueva duración elegida se ignoraba en silencio hasta la próxima
   sesión. Ahora: si no hay ejercicios respondidos que perder, se aplica
   directo; si sí los hay, se avisa antes de reiniciar esa sesión (el
   progreso general del usuario no se toca, solo esta sesión a medias). */
function wireSessionLengthSelector(container, skill, onApply){
  function render(){
    const level = getUserLevel();
    const saved = loadInflightSession(skill, level);
    // Si ya hay una sesion de ESTA habilidad a medias (por ejemplo la
    // dejaste en "Larga" y luego cambiaste la preferencia general a
    // "Corta" desde otra pagina), la tarjeta marcada aqui debe mostrar
    // la duracion de la sesion que en realidad se va a retomar, no la
    // preferencia general, que ya no aplica hasta que termines o
    // reinicies esta sesion. Evita el caso donde se veia "Corta"
    // seleccionada pero la sesion en curso tenia 15 preguntas (ver
    // DEVLOG). Si no hay sesion a medias, se muestra la preferencia
    // general normal.
    const resumableSession = (saved && saved.idx < saved.total) ? saved : null;
    let displayedSelected = getSessionLength();
    if(resumableSession){
      const matchingKey = Object.keys(SESSION_LENGTHS).find(k => SESSION_LENGTHS[k].items === resumableSession.total);
      if(matchingKey) displayedSelected = matchingKey;
    }
    renderSessionLengthSelector(container, displayedSelected, (newLen)=>{
      const inProgress = !!(resumableSession && resumableSession.idx > 0);
      function apply(){
        setSessionLength(newLen);
        clearInflightSession(skill, level);
        render();
        onApply(newLen);
      }
      if(!inProgress){ apply(); return; }
      showConfirmOverlay({
        title: 'Cambiar la duración',
        message: `Tienes una sesión de ${SKILL_LABELS[skill] || 'esta habilidad'} a medias. Si cambias la duración, esta sesión se reinicia (tu progreso general no se pierde, solo tendrías que volver a responder estos ejercicios).`,
        confirmLabel: 'Sí, cambiar duración',
        cancelLabel: 'Seguir con esta sesión',
        onConfirm: apply
      });
    });
  }
  render();
}

/* Overlay de confirmación genérico, mismo estilo visual que el onboarding
   y "Cambiar tu nivel" (.onb-overlay/.onb-card). Uso: showConfirmOverlay({
   title, message, confirmLabel, cancelLabel, onConfirm, onCancel }).
   onCancel se llama tanto al pulsar "cancelar" como al cerrar haciendo
   clic fuera de la tarjeta. */
function showConfirmOverlay({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }){
  const overlay = document.createElement('div');
  overlay.className = 'onb-overlay';
  overlay.innerHTML = `
    <div class="onb-card">
      <h2>${title || '¿Estás seguro?'}</h2>
      <p>${message || ''}</p>
      <button type="button" class="btn btn-primary btn-block" id="confirmOverlayYes" style="margin-bottom:10px;">${confirmLabel || 'Sí, continuar'}</button>
      <button type="button" class="btn btn-ghost btn-block" id="confirmOverlayNo">${cancelLabel || 'Cancelar'}</button>
    </div>`;
  document.body.appendChild(overlay);
  function close(cb){
    overlay.remove();
    if(typeof cb === 'function') cb();
  }
  overlay.querySelector('#confirmOverlayYes').addEventListener('click', ()=> close(onConfirm));
  overlay.querySelector('#confirmOverlayNo').addEventListener('click', ()=> close(onCancel));
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(onCancel); });
}

/* ---------- Armado de sesión combinando variantes ----------
   Cada "variante" del banco trae una cantidad fija de ejercicios (8 en
   gramática/vocabulario, 2 a 4 en listening/speaking/writing). Para que
   "corta/media/larga" tengan un tamaño parecido sin importar la
   habilidad, juntamos variantes completas (nunca repetidas dentro de la
   misma sesión) hasta llegar a la cantidad pedida, y recortamos el
   sobrante de la última. Usa su propia "memoria" de última variante
   (separada de pickVariantIndex) porque ahora es un conjunto, no un
   único índice. */
const LAST_VARIANT_SET_KEY = 'leo_last_variant_set';
function getLastVariantSetMap(){
  try{ return JSON.parse(localStorage.getItem(LAST_VARIANT_SET_KEY)) || {}; }
  catch(e){ return {}; }
}
function saveLastVariantSetMap(map){
  try{ localStorage.setItem(LAST_VARIANT_SET_KEY, JSON.stringify(map)); }
  catch(e){ /* sin localStorage, simplemente no recordamos */ }
}
function flattenVariant(skill, variant){
  if(skill === 'gramatica'){
    const items = [];
    const maxLen = Math.max(...variant.map(t=>t.items.length));
    for(let i=0;i<maxLen;i++){
      variant.forEach(t=>{ if(t.items[i]) items.push(Object.assign({ topic:t.topic }, t.items[i])); });
    }
    return items;
  }
  return variant.slice();
}
function variantTopicLabels(skill, variant){
  return skill === 'gramatica' ? variant.map(t=>t.topic) : null;
}
function shuffleArray(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Arma el pool de una sesion nueva: elige el orden de variantes (evitando
// las usadas la ultima vez que se pueda) y va concatenando hasta juntar
// targetCount ejercicios. freeExcluded son indices reservados para
// miembros que hay que saltarse (solo aplica en practica.html).
function buildSessionPool({ skill, level, bankLevel, targetCount, freeExcluded }){
  const totalVariants = bankLevel.length;
  const map = getLastVariantSetMap();
  const key = skill + '_' + level;
  const lastSet = Array.isArray(map[key]) ? map[key] : [];
  const available = [];
  for(let i=0;i<totalVariants;i++){ if(!freeExcluded || freeExcluded.indexOf(i) === -1) available.push(i); }
  const fresh = shuffleArray(available.filter(i => lastSet.indexOf(i) === -1));
  const rest = shuffleArray(available.filter(i => lastSet.indexOf(i) !== -1));
  const order = fresh.concat(rest);

  const usedVariantIdxs = [];
  let pool = [];
  let topics = [];
  for(const vIdx of order){
    if(pool.length >= targetCount) break;
    usedVariantIdxs.push(vIdx);
    const variant = bankLevel[vIdx];
    pool = pool.concat(flattenVariant(skill, variant));
    const t = variantTopicLabels(skill, variant);
    if(t) topics = topics.concat(t);
  }
  if(pool.length > targetCount) pool = pool.slice(0, targetCount);
  map[key] = usedVariantIdxs;
  saveLastVariantSetMap(map);
  return { pool, usedVariantIdxs, topics: [...new Set(topics)] };
}
// Reconstruye el mismo pool de una sesion que quedo a medias (guardamos
// que variantes se usaron y cuantos ejercicios tenia en total).
function rebuildPoolFromVariantIdxs({ skill, bankLevel, variantIdxs, targetCount }){
  let pool = [];
  let topics = [];
  for(const vIdx of variantIdxs){
    const variant = bankLevel[vIdx];
    pool = pool.concat(flattenVariant(skill, variant));
    const t = variantTopicLabels(skill, variant);
    if(t) topics = topics.concat(t);
  }
  if(pool.length > targetCount) pool = pool.slice(0, targetCount);
  return { pool, topics: [...new Set(topics)] };
}

/* ---------- Mazo barajado por usuario/nivel/habilidad (sesiones de Miembros) ----------
   Antes, cada sesion juntaba "variantes" completas (bloques fijos de
   ejercicios) y solo evitaba las de la sesion anterior, recordadas en
   localStorage. Con pocas variantes por nivel eso repetia bloques enteros
   enseguida, el recorte de la ultima variante dejaba ejercicios que casi
   nunca salian, y el orden dentro del bloque era siempre el mismo.
   Ahora funciona como un mazo barajado: se baraja TODO el banco del
   nivel, cada ejercicio terminado sale del mazo, y solo cuando se agota
   el banco se baraja de nuevo (evitando abrir el ciclo nuevo con los
   ultimos que se vieron).
   No se guarda un estado aparte: el ciclo se RECONSTRUYE del historial
   (progress.sessions: results[].itemId), que ya es por usuario, ya vive
   en Supabase (progress_sessions) y se mezcla en localStorage al entrar
   desde otro dispositivo. Asi no hay tabla nueva ni nada que pueda
   quedar desfasado del progreso real, y los ejercicios nuevos del banco
   entran solos al ciclo en curso (no estan en "vistos"). El repaso
   intencional (Mis errores, Plan de estudio) no pasa por aqui y sigue
   igual. */
/* CYCLE-START */
function memberBankItems(skill, bankLevel){
  let all = [];
  bankLevel.forEach(variant => { all = all.concat(flattenVariant(skill, variant)); });
  return all;
}
// Reproduce el historial en orden y devuelve que ejercicios del banco ya
// se vieron en el ciclo actual y cuales fueron los ultimos del ciclo
// anterior (tailSize). Un id repetido dentro del mismo ciclo (repaso
// deliberado) se ignora; ids que ya no estan en el banco tambien.
function computeCycleState(progress, bankIds, tailSize){
  const inBank = new Set(bankIds);
  const sessions = ((progress && progress.sessions) || []).slice()
    .sort((a,b)=> (a.startedAt||0) - (b.startedAt||0));
  let seen = new Set();
  let order = [];
  let lastTail = [];
  let cycles = 0;
  sessions.forEach(s => {
    (s.results || []).forEach(r => {
      const id = r && r.itemId;
      if(!inBank.has(id) || seen.has(id)) return;
      seen.add(id);
      order.push(id);
      if(seen.size >= inBank.size){
        lastTail = order.slice(-tailSize);
        seen = new Set();
        order = [];
        cycles++;
      }
    });
  });
  return { seen, lastTail, cycles };
}
// Elige los ejercicios de la sesion nueva. Devuelve ids en el orden en que
// se van a jugar. Primero los que faltan del ciclo actual (barajados); si
// no alcanzan, se completa con un ciclo nuevo barajado que no repite los
// que acaban de tocar en esta misma sesion.
function pickCycleItems(items, state, targetCount){
  const total = items.length;
  const target = Math.min(targetCount, total);
  const tail = new Set(state.lastTail);
  // Ciclo recien reiniciado (nada visto todavia): los ultimos que se vieron
  // del ciclo anterior se barajan aparte y van al final, para no abrir con ellos.
  const freshStart = state.seen.size === 0 && tail.size > 0;
  let remaining = items.filter(i => !state.seen.has(i.id));
  remaining = freshStart
    ? shuffleArray(remaining.filter(i => !tail.has(i.id))).concat(shuffleArray(remaining.filter(i => tail.has(i.id))))
    : shuffleArray(remaining);
  if(remaining.length >= target) return remaining.slice(0, target);
  // Faltan menos de los que pide la sesion: se termina el ciclo con lo que
  // queda y se completa con un ciclo nuevo barajado, sin repetir lo que
  // acaba de tocar en esta misma sesion.
  const pickedIds = new Set(remaining.map(i => i.id));
  const fresh = shuffleArray(items.filter(i => !pickedIds.has(i.id)));
  return remaining.concat(fresh).slice(0, target);
}
// Variante de pickCycleItems solo para Gramatica: cada tema (topic) es una
// unidad pedagogica de ~4 ejercicios sobre un mismo concepto, asi que la
// sesion se arma con pocos temas completos (no con ejercicios sueltos de
// muchos temas). Primero se terminan los temas que ya quedaron empezados,
// luego temas nuevos al azar; dentro de la sesion los ejercicios de los
// temas elegidos se intercalan como antes. Si el ciclo se acaba a mitad de
// sesion, lo que falta del ciclo va primero y el ciclo nuevo despues (asi
// el orden de resultados coincide con el ciclo que reconstruye
// computeCycleState).
function pickCycleItemsByTopic(items, state, targetCount){
  const target = Math.min(targetCount, items.length);
  const tail = new Set(state.lastTail);
  const sizeByTopic = new Map();
  items.forEach(i => sizeByTopic.set(i.topic, (sizeByTopic.get(i.topic) || 0) + 1));
  function groupByTopic(list){
    const m = new Map();
    list.forEach(i => { if(!m.has(i.topic)) m.set(i.topic, []); m.get(i.topic).push(i); });
    return [...m.values()];
  }
  function take(groups, need){
    const chosen = [];
    let left = need;
    for(const g of groups){
      if(left <= 0) break;
      const part = shuffleArray(g).slice(0, left);
      chosen.push(part);
      left -= part.length;
    }
    return chosen;
  }
  function interleave(groups){
    const out = [];
    const max = Math.max(0, ...groups.map(g => g.length));
    for(let k = 0; k < max; k++) groups.forEach(g => { if(g[k]) out.push(g[k]); });
    return out;
  }
  const freshStart = state.seen.size === 0 && tail.size > 0;
  const groups = groupByTopic(items.filter(i => !state.seen.has(i.id)));
  const started = groups.filter(g => g.length < sizeByTopic.get(g[0].topic));
  const whole = groups.filter(g => g.length === sizeByTopic.get(g[0].topic));
  const wholeOrdered = freshStart
    ? shuffleArray(whole.filter(g => !g.some(i => tail.has(i.id)))).concat(shuffleArray(whole.filter(g => g.some(i => tail.has(i.id)))))
    : shuffleArray(whole);
  const partA = interleave(take(shuffleArray(started).concat(wholeOrdered), target));
  if(partA.length >= target) return partA;
  const pickedIds = new Set(partA.map(i => i.id));
  const rest = groupByTopic(items.filter(i => !pickedIds.has(i.id)));
  return partA.concat(interleave(take(shuffleArray(rest), target - partA.length)));
}
/* CYCLE-END */
function topicsOfPool(skill, pool){
  return skill === 'gramatica' ? [...new Set(pool.map(i => i.topic).filter(Boolean))] : [];
}
// Punto unico que usan las 6 sesiones de Miembros para armar su pool:
// retoma la sesion a medias (por ids nuevos o, si quedo guardada con la
// version anterior, por variantes) o arma una nueva con el mazo barajado.
// Devuelve { pool, topics, itemIds, variantIdxs, resumed } (resumed=false
// si se armo una sesion nueva, aunque hubiera una guardada que ya no cuadra).
function resolveMemberPool({ skill, level, bankLevel, saved }){
  if(saved && Array.isArray(saved.itemIds)){
    const byId = new Map(memberBankItems(skill, bankLevel).map(i => [i.id, i]));
    const pool = saved.itemIds.map(id => byId.get(id)).filter(Boolean);
    if(pool.length === saved.total && pool.length){
      return { pool, topics: topicsOfPool(skill, pool), itemIds: saved.itemIds.slice(), variantIdxs: [], resumed: true };
    }
    // el banco cambio y ya no coincide: se arma una sesion nueva (abajo)
  } else if(saved && Array.isArray(saved.variantIdxs) && saved.variantIdxs.length){
    const r = rebuildPoolFromVariantIdxs({ skill, bankLevel, variantIdxs:saved.variantIdxs, targetCount:saved.total });
    return { pool:r.pool, topics:r.topics, itemIds: r.pool.map(i => i.id), variantIdxs:saved.variantIdxs, resumed: true };
  }
  const items = memberBankItems(skill, bankLevel);
  const target = SESSION_LENGTHS[getSessionLength()].items;
  const tailSize = Math.min(target, Math.floor(items.length / 3));
  const state = computeCycleState(loadProgress(), items.map(i => i.id), tailSize);
  const pool = skill === 'gramatica' ? pickCycleItemsByTopic(items, state, target) : pickCycleItems(items, state, target);
  return { pool, topics: topicsOfPool(skill, pool), itemIds: pool.map(i => i.id), variantIdxs: [], resumed: false };
}

/* ---------- UI: tarjetas de nivel reutilizables ---------- */
function renderLevelSelector(container, selected, onChange){
  container.innerHTML = LEVELS.map(lvl => `
    <button class="level-card lvl-${lvl}" data-level="${lvl}" aria-pressed="${lvl===selected}">
      <div class="level-top">
        <div>
          <div class="level-name">${LEVEL_META[lvl].label}</div>
          <div class="level-range">${LEVEL_META[lvl].range}</div>
        </div>
      </div>
      <div class="tone-bar"></div>
      <p class="level-desc">${LEVEL_META[lvl].desc}</p>
    </button>`).join('');
  container.querySelectorAll('.level-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      container.querySelectorAll('.level-card').forEach(c=>c.setAttribute('aria-pressed','false'));
      card.setAttribute('aria-pressed','true');
      onChange(card.dataset.level);
    });
  });
}

/* Envuelve renderLevelSelector para las 7 páginas con sesión por nivel
   (Gramática, Vocabulario, Listening, Lectura, Writing, Speaking, Mixto):
   si hay ejercicios respondidos sin terminar en la dificultad actual,
   avisa antes de cambiar de dificultad (esa sesión queda guardada, pero
   cambiar ahora empieza una sesión nueva en la otra dificultad). Si no
   hay nada respondido todavía, cambia directo sin preguntar. No toca
   renderLevelSelector en sí, que también usan openLevelSwitcher y la
   práctica gratis con otra lógica (ahí no aplica esta advertencia). */
function wireLevelSelector(container, skill, onApply){
  function render(){
    renderLevelSelector(container, getUserLevel(), (newLevel)=>{
      const level = getUserLevel();
      if(newLevel === level) return;
      const saved = loadInflightSession(skill, level);
      const inProgress = !!(saved && saved.idx > 0 && saved.idx < saved.total);
      function apply(){
        setUserLevel(newLevel);
        render();
        onApply(newLevel);
      }
      if(!inProgress){ apply(); return; }
      render(); // revierte la tarjeta que renderLevelSelector ya marcó, por si se cancela
      showConfirmOverlay({
        title: 'Cambiar de dificultad',
        message: `Tienes una sesión de ${SKILL_LABELS[skill] || 'esta habilidad'} a medias en ${LEVEL_META[level].label}. Ese progreso queda guardado y puedes volver a él después, pero si cambias a ${LEVEL_META[newLevel].label} ahora vas a empezar una sesión nueva en esa dificultad. ¿Quieres cambiar?`,
        confirmLabel: `Sí, cambiar a ${LEVEL_META[newLevel].label}`,
        cancelLabel: 'Seguir con esta sesión',
        onConfirm: apply
      });
    });
  }
  render();
}

/* ---------- UI: feedback con explicación + ejemplos ---------- */
const OK_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#1FA463"/><path d="M6 10l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BAD_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#EF5A45"/><path d="M7 7l6 6M13 7l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
const PLAY_ICON = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="currentColor"/></svg>';
const MIC_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

/* ---------- Análisis de pronunciación en Speaking (gratis, sin costo) ----------
   Usa el reconocimiento de voz del navegador (Web Speech API) mientras
   la persona se graba, y compara por palabras lo que el navegador
   entendió contra la frase que debía decir. IMPORTANTE: esto NO es un
   análisis real de pronunciación/acento como el de apps de pago (que
   analizan sonido por sonido con modelos entrenados para eso). Aquí
   solo se compara texto reconocido vs. texto esperado, así que puede
   ser injustamente estricto con acentos fuertes o con ruido de fondo,
   y no detecta si un sonido específico está mal pronunciado dentro de
   una palabra que igual se reconoció bien. Por eso el resultado
   siempre se muestra con una aclaración. Además, solo funciona en
   navegadores con SpeechRecognition (Chrome y Edge de escritorio y
   Android); en Safari, Firefox y el navegador de iPhone no hay
   análisis automático, y se avisa de eso en vez de fallar en silencio. */
function getSpeechRecognitionCtor(){
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
function normalizeForSpeechCompare(text){
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
// Distancia de edición (Levenshtein) a nivel de PALABRA entre lo que
// se dijo y la frase objetivo, convertida a un puntaje de 0 a 100.
// Tolera que falte o sobre alguna palabra suelta sin desplomar el
// puntaje entero, a diferencia de compararlo carácter por carácter.
function wordListSimilarity(saidWords, targetWords){
  const n = saidWords.length, m = targetWords.length;
  if(!m) return 0;
  const dp = Array.from({ length:n+1 }, ()=> new Array(m+1).fill(0));
  for(let i=0;i<=n;i++) dp[i][0] = i;
  for(let j=0;j<=m;j++) dp[0][j] = j;
  for(let i=1;i<=n;i++){
    for(let j=1;j<=m;j++){
      if(saidWords[i-1] === targetWords[j-1]) dp[i][j] = dp[i-1][j-1];
      else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  const dist = dp[n][m];
  return Math.round(Math.max(0, 1 - dist / m) * 100);
}
function scoreSpokenText(saidText, targetText){
  return wordListSimilarity(normalizeForSpeechCompare(saidText), normalizeForSpeechCompare(targetText));
}
function speechScoreFeedback(pct){
  if(pct >= 100) return { ok:true, label:'¡Perfecto!', msg:'Se entendió exactamente igual a la frase original.' };
  if(pct >= 85) return { ok:true, label:'¡Muy bien!', msg:'Se entendió casi igual a la frase original.' };
  if(pct >= 60) return { ok:false, label:'Casi', msg:'Se entendieron varias palabras, pero no todas. Escucha de nuevo e inténtalo otra vez.' };
  return { ok:false, label:'Sigue practicando', msg:'El reconocimiento de voz no logró entender la frase completa. Puede ser el micrófono, el ruido de fondo o la pronunciación: inténtalo de nuevo.' };
}
// Arranca el reconocimiento de voz (si el navegador lo soporta) y
// entrega el texto reconocido a onDone cuando termina. onDone se llama
// UNA sola vez, con null si no hay soporte o algo falla, para que el
// resto del flujo de grabación nunca se rompa por esto. Devuelve el
// objeto de reconocimiento (o null) para poder detenerlo manualmente.
function startSpeechRecognitionCapture(onDone){
  const Ctor = getSpeechRecognitionCtor();
  if(!Ctor){ onDone(null); return null; }
  let finished = false;
  const finishOnce = (text)=>{ if(finished) return; finished = true; onDone(text); };
  let recognition;
  try{ recognition = new Ctor(); }catch(e){ onDone(null); return null; }
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  let bestTranscript = '';
  recognition.onresult = (event)=>{
    let text = '';
    for(let i=0;i<event.results.length;i++){ text += event.results[i][0].transcript + ' '; }
    bestTranscript = text.trim();
  };
  recognition.onerror = ()=> finishOnce(bestTranscript || null);
  recognition.onend = ()=> finishOnce(bestTranscript || null);
  try{ recognition.start(); }catch(e){ onDone(null); return null; }
  return recognition;
}
// Pide el micrófono para una nueva grabación. En el móvil el micrófono
// puede seguir ocupado un instante por la grabación/reconocimiento
// anterior, y getUserMedia falla justo en el segundo intento. Se corta el
// reconocimiento previo y se reintenta una vez tras una breve espera.
async function acquireMicStream(prevRecognition){
  if(prevRecognition){ try{ prevRecognition.abort(); }catch(e){} }
  try{
    return await navigator.mediaDevices.getUserMedia({ audio:true });
  }catch(err){
    await new Promise(r=> setTimeout(r, 500));
    return await navigator.mediaDevices.getUserMedia({ audio:true });
  }
}
// La grabación se arma con el formato que de verdad produjo el navegador
// (Chrome/Android: webm; Safari/iPhone: mp4). Declararla siempre como webm
// hacía que el reproductor de iPhone mostrara "Error". Orden: el tipo del
// grabador, el del primer fragmento y, solo si ambos vienen vacíos, webm.
function recordedAudioType(chunks, recorder){
  const fromRecorder = recorder && recorder.mimeType;
  const fromChunk = chunks && chunks[0] && chunks[0].type;
  return fromRecorder || fromChunk || 'audio/webm';
}
function recordedAudioBlob(chunks, recorder){
  return new Blob(chunks, { type: recordedAudioType(chunks, recorder) });
}
// Los webm de MediaRecorder no traen la duración en el archivo y el
// reproductor muestra valores absurdos (ej. 3:32:48 para 2 segundos).
// Se decodifica la grabación y se reemplaza por un WAV, que sí lleva la
// duración correcta en cualquier navegador. Si algo falla, se deja la
// grabación original tal cual.
function audioBufferToWavBlob(buf){
  const ch = Math.min(buf.numberOfChannels, 2), len = buf.length, rate = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + len*ch*2));
  const str = (o,t)=>{ for(let i=0;i<t.length;i++) out.setUint8(o+i, t.charCodeAt(i)); };
  str(0,'RIFF'); out.setUint32(4, 36+len*ch*2, true); str(8,'WAVE'); str(12,'fmt ');
  out.setUint32(16,16,true); out.setUint16(20,1,true); out.setUint16(22,ch,true);
  out.setUint32(24,rate,true); out.setUint32(28,rate*ch*2,true); out.setUint16(32,ch*2,true); out.setUint16(34,16,true);
  str(36,'data'); out.setUint32(40, len*ch*2, true);
  const data = []; for(let c=0;c<ch;c++) data.push(buf.getChannelData(c));
  let o = 44;
  for(let i=0;i<len;i++) for(let c=0;c<ch;c++){
    const v = Math.max(-1, Math.min(1, data[c][i]));
    out.setInt16(o, v<0 ? v*0x8000 : v*0x7FFF, true); o += 2;
  }
  return new Blob([out], { type:'audio/wav' });
}
async function fixRecordedAudioDuration(audio, blob){
  if(!audio || !blob) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return;
  let ctx;
  try{
    ctx = new AC();
    const ab = await blob.arrayBuffer();
    const buf = await new Promise((res, rej)=>{
      const p = ctx.decodeAudioData(ab, res, rej);
      if(p && p.catch) p.catch(rej);
    });
    if(!buf || !buf.length || !audio.isConnected) return;
    audio.src = URL.createObjectURL(audioBufferToWavBlob(buf));
  }catch(e){
    // Si el reproductor ya marcó error (ej. iPhone) y no hubo conversión,
    // se avisa en vez de dejar un reproductor roto.
    if(audio.isConnected && audio.error){
      audio.insertAdjacentHTML('afterend', '<p class="audio-missing-note">No se pudo reproducir esta grabación en tu dispositivo. Inténtalo otra vez.</p>');
    }
  }
  finally{ if(ctx && ctx.close) ctx.close().catch(()=>{}); }
}
// Cualquier navegador de iPhone/iPad usa el motor de Safari (WebKit), también "Chrome".
function isIosDevice(){
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
}
// Pinta el resultado del análisis en un contenedor vacío que ya exista
// en la tarjeta (reutiliza las mismas clases de feedback que el resto
// del sitio, para que se vea igual que una respuesta de gramática/
// listening en vez de inventar un estilo nuevo).
function renderSpeechScoreBlock(el, targetText, saidText){
  if(!el) return;
  if(saidText === null){
    el.innerHTML = isIosDevice()
      ? `<p class="audio-missing-note">El iPhone no permite analizar la pronunciación automáticamente en ningún navegador (ni Safari ni Chrome). Puedes seguir escuchando tu grabación y practicando igual.</p>`
      : `<p class="audio-missing-note">Tu navegador no puede analizar la pronunciación automáticamente aquí (funciona mejor en Chrome). Puedes seguir escuchando tu grabación y practicando igual.</p>`;
    return;
  }
  const pct = scoreSpokenText(saidText, targetText);
  const fb = speechScoreFeedback(pct);
  el.classList.add('feedback', 'show');
  el.classList.toggle('ok', fb.ok);
  el.classList.toggle('bad', !fb.ok);
  el.innerHTML = `
    <div class="fb-head">${fb.ok ? OK_ICON : BAD_ICON}<span>${fb.label} · ${pct}%</span></div>
    <p class="fb-explain">${fb.msg}</p>
    <div class="examples-block">
      <div class="examples-label">Se entendió</div>
      <div class="example-pair"><div class="example-en">"${saidText || '(no se entendió nada)'}"</div></div>
    </div>`;
}

function renderExamplesBlock(examples){
  if(!examples || !examples.length) return '';
  return `<div class="examples-block">
    <div class="examples-label">Mira otros ejemplos</div>
    ${examples.map(ex=>`<div class="example-pair"><div class="example-en">${ex.en}</div><div class="example-es">${ex.es}</div></div>`).join('')}
  </div>`;
}
function renderFeedback(container, isCorrect, explainText, examples){
  const fb = container.querySelector('#fb');
  if(!fb) return;
  fb.classList.add('show');
  fb.classList.toggle('ok', isCorrect);
  fb.classList.toggle('bad', !isCorrect);
  fb.innerHTML = `
    <div class="fb-head">${isCorrect ? OK_ICON : BAD_ICON}<span>${isCorrect ? 'Correcto' : 'Casi.'}</span></div>
    <p class="fb-explain">${explainText}</p>
    ${renderExamplesBlock(examples)}`;
}
function showNextButton(container, label, cb){
  const row = container.querySelector('#nextRow');
  if(!row) return;
  row.innerHTML = `<button class="btn btn-primary btn-sm next-btn">${label}</button>`;
  row.querySelector('.next-btn').addEventListener('click', ()=>{ stopActiveAudioFile(); cb(); });
}
// Igual que showNextButton, pero si la respuesta fue incorrecta (isCorrect
// === false) deja ADEMÁS un botón "Volver a intentar" que vuelve a mostrar
// la misma pregunta desde cero, en vez de forzar avanzar tras un solo
// intento. Si isCorrect es true (o null, ej. Speaking que no se califica),
// se comporta igual que showNextButton. Se usa en Gramática, Vocabulario,
// Listening y Mixto (Miembros y Gratis).
function showRetryOrNextButtons(container, isCorrect, onRetry, onNext, nextLabel){
  const row = container.querySelector('#nextRow');
  if(!row) return;
  const label = nextLabel || 'Continuar →';
  if(isCorrect === false){
    row.innerHTML = `
      <button class="btn btn-ghost btn-sm retry-btn">↺ Volver a intentar</button>
      <button class="btn btn-primary btn-sm next-btn">${label}</button>`;
    row.querySelector('.retry-btn').addEventListener('click', ()=>{ stopActiveAudioFile(); markGrammarRetry(container); onRetry(); });
    row.querySelector('.next-btn').addEventListener('click', ()=>{ stopActiveAudioFile(); onNext(); });
  } else {
    row.innerHTML = `<button class="btn btn-primary btn-sm next-btn">${label}</button>`;
    row.querySelector('.next-btn').addEventListener('click', ()=>{ stopActiveAudioFile(); onNext(); });
  }
}

// Guarda/recupera una sesión de Miembros a medio terminar (localStorage),
// para que si se refresca la página o se pierde la conexión a medio
// ejercicio, al volver a entrar continúe donde se quedó en vez de
// reiniciar desde cero. Solo se usa en sesiones de Miembros (no Gratis).
// Se borra automáticamente al terminar la sesión completa.
function inflightKey(skill, level){ return 'leo_inflight_' + skill + '_' + level; }
function saveInflightSession(skill, level, data){
  try{ localStorage.setItem(inflightKey(skill, level), JSON.stringify(data)); }catch(e){}
}
function loadInflightSession(skill, level){
  try{
    const raw = localStorage.getItem(inflightKey(skill, level));
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function clearInflightSession(skill, level){
  try{ localStorage.removeItem(inflightKey(skill, level)); }catch(e){}
}
function sessionHeaderHtml(skillLabel, level, current, total){
  const pct = Math.round((current/total)*100);
  return `
    <div class="session-head">
      <span class="practice-level-tag">${skillLabel} · ${LEVEL_META[level].label} ${LEVEL_META[level].range}</span>
      <span class="session-count">Pregunta ${current} de ${total}</span>
    </div>
    <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>`;
}
function showAudioMissingNote(container){
  if(!container) return;
  const existing = container.querySelector('.audio-missing-note');
  if(existing) return; // ya se está mostrando, no duplicar
  const note = document.createElement('p');
  note.className = 'audio-missing-note';
  note.textContent = 'Audio próximamente.';
  container.appendChild(note);
}
let activeAudioFile = null;
let activeAudioTrigger = null;
function clearActiveAudioFile(){
  if(activeAudioTrigger){
    activeAudioTrigger.disabled = false;
    activeAudioTrigger.removeAttribute('aria-busy');
  }
  activeAudioFile = null;
  activeAudioTrigger = null;
}
function stopActiveAudioFile(){
  if(activeAudioFile){
    try{ activeAudioFile.pause(); activeAudioFile.currentTime = 0; }catch(e){}
  }
  clearActiveAudioFile();
}
function playAudioFile(path, container, trigger){
  // Una sola pista a la vez: evita que dos clics rápidos creen voces
  // superpuestas. Al terminar, el mismo botón vuelve a estar disponible.
  if(activeAudioFile) return;
  let audio;
  try{
    audio = new Audio(path);
  }catch(e){
    showAudioMissingNote(container);
    return;
  }
  activeAudioFile = audio;
  activeAudioTrigger = trigger || null;
  if(activeAudioTrigger){
    activeAudioTrigger.disabled = true;
    activeAudioTrigger.setAttribute('aria-busy','true');
  }
  const finish = ()=> clearActiveAudioFile();
  audio.addEventListener('ended', finish, { once:true });
  audio.addEventListener('error', ()=>{ showAudioMissingNote(container); finish(); }, { once:true });
  const p = audio.play();
  if(p && typeof p.catch === 'function'){
    p.catch(()=>{ showAudioMissingNote(container); finish(); });
  }
}

/* ============================================================
   SESIÓN DE GRAMÁTICA
   Una sesión = todos los ítems del nivel (mezcla de sus 2 temas).
   ============================================================ */
function runGrammarSession({ container, level, onExit }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const saved = loadInflightSession('gramatica', level);
  // Siempre se retoma la sesion guardada si tiene ejercicios sin terminar,
  // sin importar si la duracion (corta/media/larga) cambio despues desde
  // otra pagina: el progreso de Leo nunca se descarta solo. El selector
  // de duracion (wireSessionLengthSelector) es quien se encarga de MOSTRAR
  // la duracion real de esta sesion en curso, para que no se vea una
  // duracion distinta a la que en realidad esta corriendo (ver DEVLOG).
  const canResume = !!(saved && Array.isArray(saved.variantIdxs) && saved.idx < saved.total);
  const { pool, topics, itemIds, variantIdxs:usedVariantIdxs, resumed } = resolveMemberPool({ skill:'gramatica', level, bankLevel:GRAMMAR_BANK[level], saved: canResume ? saved : null });
  const total = pool.length;
  const startedAt = resumed ? saved.startedAt : Date.now();
  const results = resumed ? saved.results.slice() : [];
  let idx = resumed ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('gramatica', level, { variantIdxs:usedVariantIdxs, itemIds, total, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Gramática', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderGrammarItemInto(card, item, (isCorrect)=>{
      results.push({ itemId:item.id, isCorrect });
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    });
  }

  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    clearInflightSession('gramatica', level);
    recordSession({ skill:'gramatica', level, topics, results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`${correct} / ${total} correctas`,
      topics, currentHref:'gramatica.html'
    });
    wireSummaryButtons(container, ()=>runGrammarSession({ container, level, onExit }));
    appendSessionInsight(container, results, startedAt, 'gramatica');
  }

  renderItem();
}

// Baraja las opciones de una pregunta de opción múltiple para que la
// respuesta correcta no caiga siempre en la misma posición (ej. siempre "A").
// No modifica el item original, solo devuelve una copia reordenada.
function shuffleOptions(options, correctIndex){
  const order = options.map((_,i)=>i);
  for(let i = order.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const shuffled = order.map(i=>options[i]);
  const newCorrect = order.indexOf(correctIndex);
  return { options: shuffled, correct: newCorrect };
}

function renderGrammarItemInto(container, item, onAnswered, aiOpts){
  if(item.type === 'choice'){
    container.innerHTML = `
      <div class="practice-instruction">Elige la opción correcta</div>
      <div class="practice-prompt">${item.prompt}</div>
      ${item.translation ? `<div class="practice-translation">${item.translation}</div>` : ''}
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const list = container.querySelector('#optList');
    const { options: shuffledOptions, correct: shuffledCorrect } = shuffleOptions(item.options, item.correct);
    shuffledOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        renderFeedback(container, isCorrect, item.explain, item.examples);
        leoAiAttach(container.querySelector('#fb'), Object.assign({ kind:'grammar', item, isCorrect, userAnswer:opt }, aiOpts));
        noteGrammarAnswer(container, item, isCorrect, opt);
        onAnswered(isCorrect);
      });
      list.appendChild(b);
    });
  } else if(item.type === 'fill'){
    container.innerHTML = `
      <div class="practice-instruction">Completa la frase</div>
      <div class="blank-row" id="sentenceRow"></div>
      ${item.translation ? `<div class="practice-translation">${item.translation}</div>` : ''}
      <div class="word-bank" id="bank"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const row = container.querySelector('#sentenceRow');
    item.sentence.forEach((w,i)=>{
      const span = document.createElement('span');
      if(i === item.blankIndex){ span.className = 'blank-slot'; span.id = 'blankSlot'; }
      else { span.style.fontWeight = '600'; span.style.fontSize = '1.05rem'; span.textContent = w; }
      row.appendChild(span);
    });
    const bank = container.querySelector('#bank');
    const shuffledBank = [...item.bank];
    for(let i = shuffledBank.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledBank[i], shuffledBank[j]] = [shuffledBank[j], shuffledBank[i]];
    }
    shuffledBank.forEach(word=>{
      const chip = document.createElement('button');
      chip.className = 'word-chip';
      chip.textContent = word;
      chip.addEventListener('click', ()=>{
        if(chip.classList.contains('used')) return;
        [...bank.children].forEach(c=>c.classList.remove('used'));
        chip.classList.add('used');
        const slot = container.querySelector('#blankSlot');
        slot.textContent = word;
        slot.classList.add('filled');
        const isCorrect = word === item.correct;
        slot.style.borderColor = isCorrect ? '#1FA463' : '#EF5A45';
        slot.style.background = isCorrect ? '#E7F7EE' : '#FDEBE8';
        renderFeedback(container, isCorrect, item.explain, item.examples);
        leoAiAttach(container.querySelector('#fb'), Object.assign({ kind:'grammar', item, isCorrect, userAnswer:word }, aiOpts));
        noteGrammarAnswer(container, item, isCorrect, word);
        onAnswered(isCorrect);
      });
      bank.appendChild(chip);
    });
  } else if(item.type === 'error'){
    const tokens = item.wrong.split(' ');
    const cleanTokens = tokens.map(w => w.replace(/[.,?!]/g,''));
    const wrongTokens = item.wrongWord ? item.wrongWord.split(' ') : [];
    let wrongStart = -1;
    if(wrongTokens.length){
      for(let i=0;i<=cleanTokens.length-wrongTokens.length;i++){
        if(cleanTokens.slice(i,i+wrongTokens.length).join(' ') === item.wrongWord){ wrongStart = i; break; }
      }
    }
    const wrongEnd = wrongStart + wrongTokens.length - 1;
    const isAnswerIdx = (idx) => wrongStart>=0 && idx>=wrongStart && idx<=wrongEnd;

    const wordsHtml = tokens.map((w,idx)=>
      `<button type="button" class="error-word" data-idx="${idx}">${w}</button>`
    ).join(' ');

    container.innerHTML = `
      <div class="practice-instruction">Encuentra el error, toca la palabra incorrecta</div>
      <div class="error-sentence">${wordsHtml}</div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;

    const wordBtns = Array.from(container.querySelectorAll('.error-word'));
    wordBtns.forEach(btn=>{
      btn.addEventListener('click', function(){
        const pickedIdx = Number(this.dataset.idx);
        const isCorrect = isAnswerIdx(pickedIdx);
        wordBtns.forEach(b=>{ b.disabled = true; });
        if(isCorrect){
          this.classList.add('is-answer');
        } else {
          this.classList.add('is-wrong-pick');
          wordBtns.forEach(b=>{ if(isAnswerIdx(Number(b.dataset.idx))) b.classList.add('is-answer'); });
        }

        const rightTokens = item.right.split(' ');
        const rightClean = rightTokens.map(w => w.replace(/[.,?!]/g,''));
        const rightWordTokens = item.rightWord ? item.rightWord.split(' ') : [];
        let rightStart = -1;
        if(rightWordTokens.length){
          for(let i=0;i<=rightClean.length-rightWordTokens.length;i++){
            if(rightClean.slice(i,i+rightWordTokens.length).join(' ') === item.rightWord){ rightStart = i; break; }
          }
        }
        const rightEnd = rightStart + rightWordTokens.length - 1;
        const rightHtml = rightTokens.map((w,i)=>
          (rightStart>=0 && i>=rightStart && i<=rightEnd) ? `<span style="background:#E7F7EE;color:#116B41;padding:2px 6px;border-radius:6px;">${w}</span>` : w
        ).join(' ');

        const box = document.createElement('div');
        box.className = 'error-correct-box';
        box.innerHTML = `
          <div>${rightHtml}</div>
          ${item.translation ? `<div class="error-correct-translation">${item.translation}</div>` : ''}`;
        container.querySelector('.error-sentence').after(box);

        renderFeedback(container, isCorrect, item.explain, item.examples);
        leoAiAttach(container.querySelector('#fb'), Object.assign({ kind:'grammar', item, isCorrect, userAnswer:cleanTokens[pickedIdx] }, aiOpts));
        noteGrammarAnswer(container, item, isCorrect, cleanTokens[pickedIdx]);
        onAnswered(isCorrect);
      });
    });
  }
}

/* ============================================================
   SESIÓN DE VOCABULARIO
   ============================================================ */
function runVocabSession({ container, level, onExit }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const saved = loadInflightSession('vocabulario', level);
  // Siempre se retoma la sesion guardada si tiene ejercicios sin terminar,
  // sin importar si la duracion (corta/media/larga) cambio despues desde
  // otra pagina: el progreso de Leo nunca se descarta solo. El selector
  // de duracion (wireSessionLengthSelector) es quien se encarga de MOSTRAR
  // la duracion real de esta sesion en curso, para que no se vea una
  // duracion distinta a la que en realidad esta corriendo (ver DEVLOG).
  const canResume = !!(saved && Array.isArray(saved.variantIdxs) && saved.idx < saved.total);
  const { pool, itemIds, variantIdxs:usedVariantIdxs, resumed } = resolveMemberPool({ skill:'vocabulario', level, bankLevel:VOCAB_BANK[level], saved: canResume ? saved : null });
  const total = pool.length;
  const startedAt = resumed ? saved.startedAt : Date.now();
  const results = resumed ? saved.results.slice() : [];
  let idx = resumed ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('vocabulario', level, { variantIdxs:usedVariantIdxs, itemIds, total, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Vocabulario', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    card.innerHTML = `
      <div class="practice-prompt" style="font-size:1.05rem;">${item.quiz.prompt}</div>
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const list = card.querySelector('#optList');
    const { options: shuffledQuizOptions, correct: shuffledQuizCorrect } = shuffleOptions(item.quiz.options, item.quiz.correct);
    shuffledQuizOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledQuizCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledQuizCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        const reveal = document.createElement('div');
        reveal.className = 'vocab-card';
        reveal.style.marginTop = '16px';
        reveal.innerHTML = `<div class="vocab-word">${item.word}</div><div class="vocab-sub">${item.translation}</div>`;
        list.after(reveal);
        renderFeedback(card, isCorrect, item.quiz.explain, item.examples);
        leoAiAttach(card.querySelector('#fb'), { kind:'vocab', item, isCorrect, userAnswer:opt });
        results.push({ itemId:item.id, isCorrect });
        showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        }, idx+1 < total ? 'Siguiente palabra →' : 'Ver resultado →');
      });
      list.appendChild(b);
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    clearInflightSession('vocabulario', level);
    recordSession({ skill:'vocabulario', level, topics:['Vocabulario general'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`Repasaste ${total} palabras · ${correct}/${total} en el mini quiz`,
      topics: ['Vocabulario general'], currentHref:'vocabulario.html'
    });
    wireSummaryButtons(container, ()=>runVocabSession({ container, level, onExit }));
    appendSessionInsight(container, results, startedAt, 'vocabulario');
  }
  renderItem();
}

/* ============================================================
   SESIÓN DE LISTENING
   El audio es un <audio> real apuntando a un MP3. Si el archivo
   no existe todavía, se avisa sin romper el ejercicio.
   ============================================================ */
function runListeningSession({ container, level, onExit }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const saved = loadInflightSession('listening', level);
  // Siempre se retoma la sesion guardada si tiene ejercicios sin terminar,
  // sin importar si la duracion (corta/media/larga) cambio despues desde
  // otra pagina: el progreso de Leo nunca se descarta solo. El selector
  // de duracion (wireSessionLengthSelector) es quien se encarga de MOSTRAR
  // la duracion real de esta sesion en curso, para que no se vea una
  // duracion distinta a la que en realidad esta corriendo (ver DEVLOG).
  const canResume = !!(saved && Array.isArray(saved.variantIdxs) && saved.idx < saved.total);
  const { pool, itemIds, variantIdxs:usedVariantIdxs, resumed } = resolveMemberPool({ skill:'listening', level, bankLevel:LISTENING_BANK[level], saved: canResume ? saved : null });
  const total = pool.length;
  const startedAt = resumed ? saved.startedAt : Date.now();
  const results = resumed ? saved.results.slice() : [];
  let idx = resumed ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('listening', level, { variantIdxs:usedVariantIdxs, itemIds, total, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Listening', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    card.innerHTML = `
      <div class="practice-prompt">Escucha</div>
      <div class="listen-row">
        <button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} Reproducir</button>
      </div>
      <div class="practice-prompt" style="font-size:1.05rem;">${item.question}</div>
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    card.querySelector('#playBtn').addEventListener('click', function(){
      playAudioFile(item.audioFile, card);
    });
    const list = card.querySelector('#optList');
    const { options: shuffledListenOptions, correct: shuffledListenCorrect } = shuffleOptions(item.options, item.correct);
    shuffledListenOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledListenCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledListenCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        const fb = card.querySelector('#fb');
        fb.classList.add('show');
        fb.classList.toggle('ok', isCorrect);
        fb.classList.toggle('bad', !isCorrect);
        fb.innerHTML = `
          <div class="fb-head">${isCorrect ? OK_ICON : BAD_ICON}<span>${isCorrect ? 'Correcto' : 'Casi.'}</span></div>
          <p class="fb-explain">${item.explain}</p>
          <div class="examples-block">
            <div class="examples-label">Transcripción</div>
            <div class="example-pair"><div class="example-en">${item.transcript}</div><div class="example-es">${item.translation}</div></div>
          </div>`;
        leoAiAttach(fb, { kind:'listening', item, isCorrect, userAnswer:opt });
        results.push({ itemId:item.id, isCorrect });
        showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        }, idx+1 < total ? 'Siguiente audio →' : 'Ver resultado →');
      });
      list.appendChild(b);
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    clearInflightSession('listening', level);
    recordSession({ skill:'listening', level, topics:['Comprensión auditiva'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`${correct} / ${total} correctas`,
      topics: ['Comprensión auditiva'], currentHref:'listening.html'
    });
    wireSummaryButtons(container, ()=>runListeningSession({ container, level, onExit }));
    appendSessionInsight(container, results, startedAt, 'listening');
  }
  renderItem();
}

/* ============================================================
   SESIÓN DE LECTURA — comprensión de lectura general (no examen).
   Mismo motor que Listening (buildSessionPool/rebuildPoolFromVariantIdxs,
   resumible con inflight session), pero mostrando el pasaje de texto
   en vez de un botón de audio. Cada ítem trae su propio passage +
   translation aunque varios ítems seguidos compartan el mismo texto
   (misma idea que IELTS Reading en ielts.js).
   ============================================================ */
function runReadingSession({ container, level, onExit }){
  stopActiveAudioFile();
  const saved = loadInflightSession('lectura', level);
  // Siempre se retoma la sesion guardada si tiene ejercicios sin terminar,
  // sin importar si la duracion (corta/media/larga) cambio despues desde
  // otra pagina: el progreso de Leo nunca se descarta solo. El selector
  // de duracion (wireSessionLengthSelector) es quien se encarga de MOSTRAR
  // la duracion real de esta sesion en curso, para que no se vea una
  // duracion distinta a la que en realidad esta corriendo (ver DEVLOG).
  const canResume = !!(saved && Array.isArray(saved.variantIdxs) && saved.idx < saved.total);
  const { pool, itemIds, variantIdxs:usedVariantIdxs, resumed } = resolveMemberPool({ skill:'lectura', level, bankLevel:READING_BANK[level], saved: canResume ? saved : null });
  const total = pool.length;
  const startedAt = resumed ? saved.startedAt : Date.now();
  const results = resumed ? saved.results.slice() : [];
  let idx = resumed ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('lectura', level, { variantIdxs:usedVariantIdxs, itemIds, total, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Lectura', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    card.innerHTML = `
      <div class="practice-instruction">Lee</div>
      <div class="reading-passage"><h4>${item.title}</h4><p>${item.passage}</p></div>
      <div class="practice-prompt" style="font-size:1.05rem;margin-top:16px;">${item.question}</div>
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const list = card.querySelector('#optList');
    const { options: shuffledReadOptions, correct: shuffledReadCorrect } = shuffleOptions(item.options, item.correct);
    shuffledReadOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledReadCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledReadCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        const fb = card.querySelector('#fb');
        fb.classList.add('show');
        fb.classList.toggle('ok', isCorrect);
        fb.classList.toggle('bad', !isCorrect);
        fb.innerHTML = `
          <div class="fb-head">${isCorrect ? OK_ICON : BAD_ICON}<span>${isCorrect ? 'Correcto' : 'Casi.'}</span></div>
          <p class="fb-explain">${item.explain}</p>
          <div class="examples-block">
            <div class="examples-label">Traducción</div>
            <div class="example-pair"><div class="example-en">${item.passage}</div><div class="example-es">${item.translation}</div></div>
          </div>`;
        leoAiAttach(fb, { kind:'reading', item, isCorrect, userAnswer:opt });
        results.push({ itemId:item.id, isCorrect });
        showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
      });
      list.appendChild(b);
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    clearInflightSession('lectura', level);
    recordSession({ skill:'lectura', level, topics:['Comprensión de lectura'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`${correct} / ${total} correctas`,
      topics: ['Comprensión de lectura'], currentHref:'lectura.html'
    });
    wireSummaryButtons(container, ()=>runReadingSession({ container, level, onExit }));
    appendSessionInsight(container, results, startedAt, 'lectura');
  }
  renderItem();
}

/* ============================================================
   SESIÓN DE WRITING — sin corrección automática "inteligente".
   Ofrecemos ejemplo + checklist de autorrevisión, honesto.

   evaluateWritingAnswer() es la única lógica de validación para los
   3 lugares donde se revisan frases de Writing (sesión de miembros,
   sesión mixta, y práctica gratis). Sigue siendo una comprobación de
   patrón, no IA: primero confirma que aparece la estructura objetivo
   (item.checkPattern), y además revisa un error muy común que ese
   patrón por sí solo no detecta: usar el verbo mal formado justo
   después de un modal (can, should, must, will, going to, have to,
   used to...), por ejemplo "I can eats" en vez de "I can eat". No
   evalúa si la frase "tiene sentido" ni corrige nada más allá de eso.
   ============================================================ */
const MODAL_BASE_FORM_RE = /\b(can'?t|cannot|can|could|should|shouldn'?t|must|mustn'?t|might|will|won'?t|would|wouldn'?t|has to|have to|had to|going to|used to)\s+([a-z]+)\b/i;

function findModalVerbFormError(text){
  const m = MODAL_BASE_FORM_RE.exec(text);
  if(!m) return null;
  const modal = m[1];
  const verb = m[2];
  const isGerund = /ing$/.test(verb);
  const isPast = /ed$/.test(verb) && !/eed$/.test(verb);
  // "eats"/"goes" (tercera persona) sí es un error aquí; "miss"/"pass"
  // (verbos base que terminan en doble "s") no lo es.
  const isThirdPerson = /[^s]s$/.test(verb);
  if(isGerund || isPast || isThirdPerson){
    return `Después de "${modal}", el verbo va en su forma base (ejemplo: play, no ${verb}).`;
  }
  return null;
}

// Normaliza variantes de apostrofe (comilla curva, acento agudo suelto,
// comilla tipografica, etc.) a un apostrofe recto simple ('), que es lo
// unico que usan los checkPattern de data.js. Algunos teclados en
// espanol (Windows/Mac, layout Latinoamerica) tienen el apostrofe como
// tecla muerta: si se escribe seguido de una letra que no forma un
// acento valido, el navegador a veces inserta un acento agudo suelto
// (´, U+00B4) en vez de un apostrofe, y "don´t" no matcheaba nunca el
// patron "don't" aunque la frase fuera correcta.
function normalizeApostrophes(text){
  return (text || '').replace(/[‘’ʼʻ´`＇]/g, "'");
}

function evaluateWritingAnswer(text, item){
  const clean = normalizeApostrophes((text || '').trim().toLowerCase());
  // Una sola palabra no es una frase: se pide un poco más (nunca cuenta como correcta).
  if(clean.split(/\s+/).filter(Boolean).length < 2) return { isOk:false, hint:'Escribe una frase completa, no solo una palabra. ' + item.hint };
  if(clean.length < 3) return { isOk:false, hint:item.hint };
  let patternOk = false;
  try{ patternOk = new RegExp(item.checkPattern, 'i').test(clean); }catch(e){ patternOk = false; }
  if(!patternOk) return { isOk:false, hint:item.hint };
  const modalHint = findModalVerbFormError(clean);
  if(modalHint) return { isOk:false, hint:modalHint };
  return { isOk:true, hint:null };
}

/* ============================================================
   LEO AI — ayuda con IA bajo demanda (proveedor principal: Cloudflare
   Workers AI con Gemma 4, plan gratis; ver supabase_functions/leo-ai.ts)
   ------------------------------------------------------------
   Un botón pequeño ("Explícame por qué", "Explícame este error",
   "Revisar mi frase con Leo AI", "¿Por qué es mi punto débil?") que
   aparece debajo de la corrección normal. Solo cuando el alumno lo toca
   se llama a la Edge Function leo-ai (LeoBackend.askLeoAI). Reglas:
     - La IA NUNCA califica: no toca isCorrect, results, progreso,
       Mis errores ni el diagnóstico. Todo eso pasa antes y sin ella.
     - Nunca bloquea: si falla, tarda o llegó al límite, sale un aviso
       corto y el ejercicio sigue igual.
     - Un toque = como mucho una llamada (botón bloqueado mientras
       espera) y la misma pregunta no se vuelve a pedir en la página
       (caché en memoria, por ejemplo al "Volver a intentar").
     - Solo se envían datos del ejercicio (buildLeoAiPayload), nada
       personal.
   Interruptores:
     LEO_AI_ENABLED = false  -> todo apagado: no aparece ningún botón ni
                                se llama al servidor, ni con ?ia=1.
     LEO_AI_ENABLED = true   -> solo en el navegador donde se abrió una
                                página de miembros con ?ia=1 (?ia=0 apaga).
     LEO_AI_PUBLIC  = true   -> para todos los miembros.
   Además, el botón solo aparece cuando el sitio ya confirmó que la
   persona es miembro (guardMemberPage / unlock de miembros.html marcan
   window.__leoMemberVerified). La práctica gratis nunca lo muestra.
   Pasos para activar: ver el encabezado de supabase_functions/leo-ai.ts.
   ============================================================ */
const LEO_AI_ENABLED = true;  // servidor desplegado; quién lo usa lo decide leo_ai_config/leo_ai_testers en Supabase
const LEO_AI_PUBLIC = true;   // abierto a todos los miembros (2026-10-01); el servidor también lo exige (leo_ai_config.public)
const LEO_AI_BETA_KEY = 'leo_ai_beta';
(function(){
  try{
    const flag = new URLSearchParams(location.search).get('ia');
    if(flag === '1') localStorage.setItem(LEO_AI_BETA_KEY, '1');
    if(flag === '0') localStorage.removeItem(LEO_AI_BETA_KEY);
  }catch(e){}
})();
function isLeoAiEnabled(){
  if(!LEO_AI_ENABLED) return false;
  if(typeof LeoBackend === 'undefined' || typeof LeoBackend.askLeoAI !== 'function') return false;
  if(window.__leoMemberVerified !== true) return false;
  if(LEO_AI_PUBLIC) return true;
  try{ return localStorage.getItem(LEO_AI_BETA_KEY) === '1'; }catch(e){ return false; }
}

function stripHtmlForAi(html){
  const d = document.createElement('div');
  d.innerHTML = String(html == null ? '' : html);
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}
function leoAiText(v, max){ return stripHtmlForAi(v).slice(0, max || 400); }

/* Arma lo ÚNICO que viaja al servidor (y de ahí al proveedor de IA): datos del
   ejercicio. Nunca ids de usuario, nombre, correo, token ni historial.
   Devuelve null si no hay datos suficientes (entonces no hay botón). */
function buildLeoAiPayload(ctx){
  if(!ctx) return null;
  const level = (typeof getUserLevel === 'function') ? getUserLevel() : '';
  const it = ctx.item || {};
  const opts = arr => (Array.isArray(arr) ? arr : []).slice(0, 6).map(o => leoAiText(o, 120));
  if(ctx.kind === 'diagnosis'){
    const u = ctx.unit;
    if(!u || typeof u.current !== 'number') return null;
    return { mode:'diagnosis', level, unit:{
      label: leoAiText(u.label, 80), current: u.current, answered: u.n,
      previous: u.trend ? u.prevAcc : null, recent: u.trend ? u.recentAcc : null,
      trend: u.trend || 'none', pendingMistakes: u.activeMistakes || 0, repeatedMistakes: u.repeatedMistakes || 0
    } };
  }
  if(ctx.kind === 'insight'){
    // Resumen YA calculado por nuestro motor (sesión, errores o progreso):
    // frases cortas con números y, como mucho, 4 ejercicios de ejemplo.
    // Nunca el historial ni las respuestas una por una.
    const scopes = ['session','mistakes','progress'];
    const facts = (Array.isArray(ctx.facts) ? ctx.facts : []).map(f => leoAiText(f, 140)).filter(Boolean).slice(0, 5);
    if(scopes.indexOf(ctx.scope) === -1 || facts.length < 2) return null;
    // Lo ya mostrado en la página (no se repite) y los únicos temas que Leo AI
    // puede sugerir (ids del registro con su nombre; nunca URLs).
    const cands = [];
    (Array.isArray(ctx.candidates) ? ctx.candidates : []).forEach(id=>{
      const label = (typeof temaLabelOf === 'function') ? temaLabelOf(id) : '';
      if(label && cands.length < 3 && !cands.some(c => c.id === id)) cands.push({ id: String(id), label: leoAiText(label, 60) });
    });
    return { mode:'insight', scope: ctx.scope, level, facts: facts.slice(0, 5),
      examples: (Array.isArray(ctx.examples) ? ctx.examples : []).map(e => leoAiText(e, 200)).filter(Boolean).slice(0, 3),
      shown: (Array.isArray(ctx.shown) ? ctx.shown : []).map(x => leoAiText(x, 80)).filter(Boolean).slice(0, 3),
      candidates: cands };
  }
  if(ctx.kind === 'writing'){
    // Vacío o una sola palabra: la página ya lo resuelve ("Escribe una frase completa")
    // y no hace falta gastar IA. El botón es solo para frases reales de 2+ palabras.
    const answer = leoAiText(ctx.userAnswer, 400);
    if(answer.split(' ').filter(Boolean).length < 2) return null;
    return { mode:'writing', skill:'writing', level, question: leoAiText(it.prompt, 400),
      target: leoAiText(it.target, 160), example: it.example ? leoAiText(it.example.en, 200) : '', studentAnswer: answer,
      pageOk: ctx.isOk === true, topic: (typeof temaLabelOf === 'function' && writingTemaIdForItem(it.id)) ? leoAiText(temaLabelOf(writingTemaIdForItem(it.id)), 60) : '' };
  }
  const base = { mode:'explain', level, isCorrect: ctx.isCorrect === true, studentAnswer: leoAiText(ctx.userAnswer, 400) };
  if(ctx.kind === 'grammar'){
    let topic = '';
    try{ const f = getMistakesItemIndex().get(it.id); topic = f && f.topic ? f.topic : ''; }catch(e){}
    Object.assign(base, { skill:'grammar', topic: leoAiText(topic, 120), baseExplanation: leoAiText(it.explain, 500) });
    if(it.type === 'choice'){
      Object.assign(base, { exerciseType:'Elegir la opción correcta', question: leoAiText(it.prompt), options: opts(it.options), correctAnswer: leoAiText(it.options[it.correct], 200) });
    } else if(it.type === 'fill'){
      const sentence = (it.sentence || []).map((w, i) => i === it.blankIndex ? '___' : w).join(' ');
      Object.assign(base, { exerciseType:'Completar la frase', question: leoAiText(sentence), options: opts(it.bank), correctAnswer: leoAiText(it.correct, 200) });
    } else if(it.type === 'error'){
      Object.assign(base, { exerciseType:'Encontrar la palabra incorrecta en la frase', question: leoAiText(it.wrong),
        correctAnswer: leoAiText(`La palabra incorrecta es "${it.wrongWord}". Frase correcta: ${it.right}`, 300),
        studentAnswer: leoAiText(`Tocó la palabra "${ctx.userAnswer}"`, 200) });
    } else return null;
  } else if(ctx.kind === 'vocab'){
    const q = it.quiz || {};
    Object.assign(base, { skill:'vocab', topic: leoAiText('Palabra: ' + (it.word || ''), 120), exerciseType:'Significado de una palabra',
      question: leoAiText(q.prompt), options: opts(q.options), correctAnswer: leoAiText((q.options || [])[q.correct], 200),
      baseExplanation: leoAiText(`${it.word} = ${it.translation}. ${q.explain || ''}`, 500) });
  } else if(ctx.kind === 'listening'){
    Object.assign(base, { skill:'listening', exerciseType:'Comprensión auditiva', question: leoAiText(it.question), options: opts(it.options),
      correctAnswer: leoAiText((it.options || [])[it.correct], 200), baseExplanation: leoAiText(it.explain, 500), context: leoAiText(it.transcript, 1500) });
  } else if(ctx.kind === 'reading'){
    Object.assign(base, { skill:'reading', exerciseType:'Comprensión de lectura', question: leoAiText(it.question), options: opts(it.options),
      correctAnswer: leoAiText((it.options || [])[it.correct], 200), baseExplanation: leoAiText(it.explain, 500), context: leoAiText(it.passage, 1500) });
  } else return null;
  return (base.question && base.correctAnswer && base.studentAnswer) ? base : null;
}

function leoAiDefaultLabel(ctx){
  if(ctx.kind === 'writing') return 'Revisar mi frase con Leo AI';
  if(ctx.kind === 'diagnosis') return '¿Por qué es mi punto débil?';
  if(ctx.kind === 'insight') return 'Analizar con Leo AI';
  if(ctx.isCorrect === true) return '¿Por qué es correcta?';
  return ctx.reviewMode ? 'Explícame este error' : 'Explícame por qué';
}

const LEO_AI_ICON = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" fill="currentColor"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="currentColor"/></svg>';
const LEO_AI_WRITING_VERDICT = { correct:'Tu frase está bien escrita', minor:'Casi perfecta: un detalle por pulir', incorrect:'Hay algo que corregir' };
const LEO_AI_FAIL_TEXT = {
  daily_limit: 'Ya usaste tus explicaciones de Leo AI de hoy. Mañana tendrás más.',
  default: 'Leo AI no pudo responder ahora. Revisa tu conexión e inténtalo de nuevo en un momento. La explicación de arriba sigue siendo válida.'
};
const _leoAiCache = new Map();
// Los análisis (modo "insight") se guardan también en el navegador: si el
// alumno vuelve a abrir su progreso o sus errores y los datos no
// cambiaron, se muestra la respuesta guardada sin gastar otra llamada.
// La clave es el resumen exacto que se mandaría: si cambia un número,
// es otra clave. Máximo 12 respuestas, 7 días.
const LEO_AI_INSIGHT_CACHE_KEY = 'leo_ai_insight_cache_v1';
const LEO_AI_INSIGHT_TTL = 7*86400000;
function leoAiHash(str){
  let h = 5381;
  for(let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + '_' + str.length;
}
function leoAiInsightCacheGet(key){
  try{
    const all = JSON.parse(localStorage.getItem(LEO_AI_INSIGHT_CACHE_KEY) || '{}');
    const hit = all[leoAiHash(key)];
    return hit && Date.now() - hit.t < LEO_AI_INSIGHT_TTL ? hit.res : null;
  }catch(e){ return null; }
}
function leoAiInsightCacheSet(key, res){
  try{
    const all = JSON.parse(localStorage.getItem(LEO_AI_INSIGHT_CACHE_KEY) || '{}');
    all[leoAiHash(key)] = { t: Date.now(), res };
    const keys = Object.keys(all).sort((a,b)=> all[b].t - all[a].t);
    keys.slice(12).forEach(k => delete all[k]);
    localStorage.setItem(LEO_AI_INSIGHT_CACHE_KEY, JSON.stringify(all));
  }catch(e){}
}

/* Pone el botón de Leo AI dentro de "host" (normalmente el #fb de la
   corrección). No hace nada si Leo AI está apagado o si no hay datos
   suficientes. Nunca lanza errores hacia el ejercicio. */
function leoAiAttach(host, ctx){
  try{
    if(!host || !isLeoAiEnabled()) return null;
    const payload = buildLeoAiPayload(ctx);
    if(!payload) return null;
    const box = document.createElement('div');
    box.className = 'leo-ai';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'leo-ai-btn';
    btn.innerHTML = LEO_AI_ICON + '<span></span>';
    btn.querySelector('span').textContent = ctx.label || leoAiDefaultLabel(ctx);
    box.appendChild(btn);
    host.appendChild(box);
    const key = JSON.stringify(payload);
    const isInsight = payload.mode === 'insight';
    if(isInsight){
      box.classList.add('is-insight');
      // Ya lo había pedido con estos mismos datos: se muestra sin llamar.
      const saved = leoAiInsightCacheGet(key);
      if(saved){
        btn.remove();
        const out = document.createElement('div');
        out.className = 'leo-ai-answer';
        box.appendChild(out);
        renderLeoAiAnswer(out, payload, saved);
        return box;
      }
    }
    let busy = false;
    btn.addEventListener('click', ()=>{
      if(busy) return;            // doble toque: se ignora
      busy = true;
      btn.disabled = true;
      const out = document.createElement('div');
      out.className = 'leo-ai-answer';
      out.setAttribute('aria-live', 'polite');
      out.innerHTML = '<p class="leo-ai-loading">Leo AI está pensando…</p>';
      box.appendChild(out);
      const request = _leoAiCache.has(key)
        ? Promise.resolve(_leoAiCache.get(key))
        : Promise.resolve().then(()=> LeoBackend.askLeoAI(payload)).catch(()=> ({ ok:false, reason:'network' }));
      request.then(res=>{
        if(!box.isConnected) return; // el alumno ya pasó a otro ejercicio
        if(res && res.ok){ _leoAiCache.set(key, res); if(isInsight) leoAiInsightCacheSet(key, res); }
        btn.remove();
        renderLeoAiAnswer(out, payload, res);
      });
    });
    return box;
  }catch(e){
    return null;
  }
}

/* El tema extra que sugiere Leo AI solo cuenta si es uno de los ids que la
   página le ofreció y existe en el registro. El enlace sale SIEMPRE del
   registro (contentForTema), nunca del modelo. Si coincide con lo que la página
   ya muestra, o no hay recurso, no se muestra nada. */
function leoAiFocusLink(payload, a){
  try{
    const id = a && a.focus_topic;
    if(!id || id === 'none') return null;
    const offered = (payload.candidates || []).some(c => c.id === id);
    const c = offered ? contentForTema(id) : null;
    if(!c) return null;
    if((payload.shown || []).indexOf(c.label) !== -1) return null;
    if(a.focus_action === 'lesson' && c.article) return { href: c.article, text: `${c.articleLabel}: ${c.label}` };
    return { href: c.practiceHref, text: `Practicar ${c.label}` };
  }catch(e){ return null; }
}

function renderLeoAiAnswer(out, payload, res){
  out.innerHTML = '';
  const add = (tag, cls, text)=>{ const el = document.createElement(tag); el.className = cls; el.textContent = text; out.appendChild(el); return el; };
  const head = add('div', 'leo-ai-head', 'Leo AI');
  if(!LEO_AI_PUBLIC){ const beta = document.createElement('span'); beta.className = 'leo-ai-beta'; beta.textContent = 'Beta'; head.appendChild(beta); }
  const a = res && res.ok && res.answer;
  if(!a || typeof a.explanation !== 'string'){
    out.classList.add('is-error');
    add('p', 'leo-ai-text', LEO_AI_FAIL_TEXT[res && res.reason] || LEO_AI_FAIL_TEXT.default);
    return;
  }
  if(payload.mode === 'writing'){
    // La página ya dijo si la estructura está bien: no se repite "está bien escrita".
    if(a.verdict !== 'correct') add('div', 'leo-ai-verdict', LEO_AI_WRITING_VERDICT[a.verdict] || '');
    const norm = t => String(t || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
    if(a.corrected && norm(a.corrected) !== norm(payload.studentAnswer)){
      add('div', 'leo-ai-fixed', (a.verdict === 'correct' ? 'Más natural: ' : '') + a.corrected);
    }
    add('p', 'leo-ai-text', a.explanation);
    (Array.isArray(a.tips) ? a.tips : []).slice(0, 2).forEach(t => add('p', 'leo-ai-tip', t));
  } else if(payload.mode === 'diagnosis' || payload.mode === 'insight'){
    add('p', 'leo-ai-text', a.explanation);
    if(a.tip) add('p', 'leo-ai-tip', a.tip);
    const f = leoAiFocusLink(payload, a);
    if(f){ const link = add('a', 'leo-ai-focus', f.text); link.href = f.href; }
  } else {
    add('p', 'leo-ai-text', a.explanation);
    if(a.example_en){
      const ex = document.createElement('div');
      ex.className = 'leo-ai-example';
      const en = document.createElement('div'); en.className = 'example-en'; en.textContent = a.example_en; ex.appendChild(en);
      if(a.example_es){ const es = document.createElement('div'); es.className = 'example-es'; es.textContent = a.example_es; ex.appendChild(es); }
      out.appendChild(ex);
    }
  }
  add('p', 'leo-ai-note', payload.mode === 'insight'
    ? 'Análisis automático de tus resultados. No cambia tu progreso.'
    : payload.mode === 'diagnosis'
    ? 'Explicación automática de los números de tu diagnóstico.'
    : 'Explicación automática. La calificación del ejercicio no cambia.');
}

function runWritingSession({ container, level, onExit }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const saved = loadInflightSession('writing', level);
  // Siempre se retoma la sesion guardada si tiene ejercicios sin terminar,
  // sin importar si la duracion (corta/media/larga) cambio despues desde
  // otra pagina: el progreso de Leo nunca se descarta solo. El selector
  // de duracion (wireSessionLengthSelector) es quien se encarga de MOSTRAR
  // la duracion real de esta sesion en curso, para que no se vea una
  // duracion distinta a la que en realidad esta corriendo (ver DEVLOG).
  const canResume = !!(saved && Array.isArray(saved.variantIdxs) && saved.idx < saved.total);
  const { pool, itemIds, variantIdxs:usedVariantIdxs, resumed } = resolveMemberPool({ skill:'writing', level, bankLevel:WRITING_BANK[level], saved: canResume ? saved : null });
  const total = pool.length;
  const startedAt = resumed ? saved.startedAt : Date.now();
  const results = resumed ? saved.results.slice() : [];
  let idx = resumed ? saved.idx : 0;

  // Validación estructural honesta: no es IA, es una comprobación de patrón
  // (¿aparece la estructura objetivo en el texto?). No mide "buen inglés"
  // en general, solo si la estructura pedida está presente.
  function checkWriting(text, item){
    return evaluateWritingAnswer(text, item).isOk;
  }

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('writing', level, { variantIdxs:usedVariantIdxs, itemIds, total, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Writing', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    card.innerHTML = `
      <div class="practice-prompt">${item.prompt}</div>
      <textarea id="writingInput" rows="3" class="writing-area" placeholder="Escribe tu frase en inglés aquí..."></textarea>
      <div class="next-row" style="justify-content:flex-start;">
        <button class="btn btn-primary btn-sm" id="reviewBtn">Revisar mi frase</button>
      </div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;

    const input = card.querySelector('#writingInput');
    const fb = card.querySelector('#fb');
    const nextRow = card.querySelector('#nextRow');
    let reviewed = false;

    function doReview(){
      const text = input.value;
      const evalResult = evaluateWritingAnswer(text, item);
      const isOk = evalResult.isOk;
      reviewed = true;
      fb.classList.add('show');
      fb.classList.toggle('ok', isOk);
      fb.classList.toggle('bad', !isOk);
      if(isOk){
        fb.innerHTML = `
          <div class="fb-head">${OK_ICON}<span>Estructura correcta</span></div>
          <p class="fb-explain">Tu frase incluye la estructura que buscábamos.</p>
          <div class="examples-block">
            <div class="examples-label">Ejemplo</div>
            <div class="example-pair"><div class="example-en">${item.example.en}</div><div class="example-es">${item.example.es}</div></div>
          </div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
      } else {
        fb.innerHTML = `
          <div class="fb-head">${BAD_ICON}<span>Revisa la estructura</span></div>
          <p class="fb-explain">${evalResult.hint || item.hint}</p>
          <div class="examples-block">
            <div class="examples-label">Ejemplo</div>
            <div class="example-pair"><div class="example-en">${item.example.en}</div><div class="example-es">${item.example.es}</div></div>
          </div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
      }
      results.push(writingLowEffort(text) ? { itemId:item.id, isCorrect:isOk, lowEffort:true } : { itemId:item.id, isCorrect:isOk });
      leoAiAttach(fb, { kind:'writing', item, userAnswer:text, isOk });
      nextRow.innerHTML = '';
      if(!isOk){
        const retryBtn = document.createElement('button');
        retryBtn.className = 'btn btn-ghost btn-sm';
        retryBtn.textContent = 'Intentar de nuevo';
        retryBtn.addEventListener('click', ()=>{
          results.pop(); // no contar el intento fallido dos veces
          reviewed = false;
          fb.classList.remove('show','ok','bad');
          fb.innerHTML = '';
          nextRow.innerHTML = '';
          input.focus();
        });
        nextRow.appendChild(retryBtn);
      }
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary btn-sm';
      nextBtn.textContent = idx+1 < total ? 'Siguiente frase →' : 'Ver resultado →';
      nextBtn.addEventListener('click', ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      });
      nextRow.appendChild(nextBtn);
    }

    card.querySelector('#reviewBtn').addEventListener('click', doReview);
  }
  function finish(){
    const okCount = results.filter(r=>r.isCorrect).length;
    clearInflightSession('writing', level);
    recordSession({ skill:'writing', level, topics:['Escritura guiada'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`${okCount} / ${total} frases bien encaminadas`,
      topics: ['Escritura guiada'], currentHref:'writing.html'
    });
    wireSummaryButtons(container, ()=>runWritingSession({ container, level, onExit }));
    appendSessionInsight(container, results, startedAt, 'writing');
  }
  renderItem();
}

/* ============================================================
   SESIÓN DE SPEAKING — sin puntuación de pronunciación inventada.
   Solo comparar: pronunciación original vs. tu grabación.
   ============================================================ */
function runSpeakingSession({ container, level, onExit }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const saved = loadInflightSession('speaking', level);
  // Siempre se retoma la sesion guardada si tiene ejercicios sin terminar,
  // sin importar si la duracion (corta/media/larga) cambio despues desde
  // otra pagina: el progreso de Leo nunca se descarta solo. El selector
  // de duracion (wireSessionLengthSelector) es quien se encarga de MOSTRAR
  // la duracion real de esta sesion en curso, para que no se vea una
  // duracion distinta a la que en realidad esta corriendo (ver DEVLOG).
  const canResume = !!(saved && Array.isArray(saved.variantIdxs) && saved.idx < saved.total);
  const { pool, itemIds, variantIdxs:usedVariantIdxs, resumed } = resolveMemberPool({ skill:'speaking', level, bankLevel:SPEAKING_BANK[level], saved: canResume ? saved : null });
  const total = pool.length;
  const startedAt = resumed ? saved.startedAt : Date.now();
  const results = resumed ? saved.results.slice() : [];
  let idx = resumed ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('speaking', level, { variantIdxs:usedVariantIdxs, itemIds, total, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Speaking', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

    card.innerHTML = `
      <div class="practice-prompt">Escucha</div>
      <div class="speak-sentence">${item.sentence}</div>
      <p class="speak-tip">${item.translation}</p>
      <div class="speak-actions">
        <button class="btn btn-ghost btn-sm" id="hearBtn">${PLAY_ICON} Escuchar pronunciación</button>
      </div>
      <div class="practice-prompt" style="margin-top:22px;">Ahora tú</div>
      <div class="speak-actions">
        ${canRecord
          ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi voz</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
          : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
      </div>
      <div id="compareRow" class="compare-row"></div>
      <div id="speechScoreBlock" style="margin-top:14px;"></div>
      <div class="next-row" id="nextRow">
        <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Intentar otra vez</button>
        <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente frase →' : 'Ver resultado →'}</button>
      </div>`;

    card.querySelector('#hearBtn').addEventListener('click', ()=> playAudioFile(item.audioFile, card));
    card.querySelector('#nextSpeakBtn').addEventListener('click', ()=>{
      results.push({ itemId:item.id, isCorrect:null });
      idx++;
      if(idx < total) renderItem(); else finish();
    });

    if(canRecord){
      let stream = null, recorder = null, chunks = [], recognition = null;
      const recordBtn = card.querySelector('#recordBtn');
      const compareRow = card.querySelector('#compareRow');
      const retryBtn = card.querySelector('#retryBtn');
      const scoreBlock = card.querySelector('#speechScoreBlock');

      const recIndicator = card.querySelector('#recIndicator');
      recordBtn.addEventListener('click', async ()=>{
        if(recorder && recorder.state === 'recording'){
          recorder.stop();
          return;
        }
        compareRow.innerHTML = ''; // evitar mensajes/errores previos duplicados
        scoreBlock.innerHTML = '';
        scoreBlock.classList.remove('feedback','show','ok','bad');
        try{
          stream = await acquireMicStream(recognition);
        }catch(err){
          compareRow.innerHTML = `<p class="audio-missing-note">No pudimos acceder al micrófono. Revisa los permisos del navegador.</p>`;
          return;
        }
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = ()=>{
          const blob = recordedAudioBlob(chunks, recorder);
          const url = URL.createObjectURL(blob);
          compareRow.innerHTML = `
            <div class="compare-col">
              <div class="compare-label">Pronunciación original</div>
              <button class="btn btn-ghost btn-sm" id="origBtn">${PLAY_ICON} Escuchar</button>
            </div>
            <div class="compare-col">
              <div class="compare-label">Tu grabación</div>
              <audio controls src="${url}"></audio>
            </div>`;
          compareRow.querySelector('#origBtn').addEventListener('click', ()=> playAudioFile(item.audioFile, card));
          fixRecordedAudioDuration(compareRow.querySelector('audio'), blob);
          retryBtn.style.display = 'inline-flex';
          stream.getTracks().forEach(t=>t.stop());
          recordBtn.innerHTML = `${MIC_ICON} Grabar de nuevo`;
          if(recIndicator) recIndicator.hidden = true;
          scoreBlock.innerHTML = `<p class="audio-missing-note">Analizando pronunciación...</p>`;
          if(recognition) recognition.stop();
          else renderSpeechScoreBlock(scoreBlock, item.sentence, null);
        };
        recorder.start();
        recognition = startSpeechRecognitionCapture((saidText)=>{
          renderSpeechScoreBlock(scoreBlock, item.sentence, saidText);
        });
        recordBtn.textContent = 'Detener grabación';
        if(recIndicator) recIndicator.hidden = false;
      });
      retryBtn.addEventListener('click', ()=>{
        compareRow.innerHTML = '';
        scoreBlock.innerHTML = '';
        scoreBlock.classList.remove('feedback','show','ok','bad');
        retryBtn.style.display = 'none';
        recordBtn.innerHTML = `${MIC_ICON} Grabar mi voz`;
        if(recIndicator) recIndicator.hidden = true;
      });
    }
  }
  function finish(){
    clearInflightSession('speaking', level);
    recordSession({ skill:'speaking', level, topics:['Pronunciación guiada'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`Practicaste ${total} frases en voz alta`,
      topics: ['Pronunciación guiada'], currentHref:'speaking.html'
    });
    wireSummaryButtons(container, ()=>runSpeakingSession({ container, level, onExit }));
  }
  renderItem();
}

/* ============================================================
   SESIÓN MIXTA — combina ítems reales de las 5 habilidades en
   una sola sesión corta, usando el contenido que ya existe
   (mismas variantes/rotación que las sesiones individuales).
   No se crea contenido nuevo para esta habilidad.
   ============================================================ */
function pickMixItems(level, isFree){
  function sample(arr, n){
    const copy = arr.slice();
    for(let i=copy.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
    return copy.slice(0, Math.min(n, copy.length));
  }

  const gVariantIdx = pickVariantIndex('gramatica', level, GRAMMAR_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.gramatica[level] : undefined);
  const gTopics = GRAMMAR_BANK[level][gVariantIdx];
  const gPool = [];
  gTopics.forEach(t=> t.items.forEach(it=> gPool.push(it)));
  const grammarPicks = sample(gPool, 2).map(item=>({ kind:'grammar', item }));

  const vVariantIdx = pickVariantIndex('vocabulario', level, VOCAB_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.vocabulario[level] : undefined);
  const vPool = VOCAB_BANK[level][vVariantIdx];
  const vocabPicks = sample(vPool, 2).map(item=>({ kind:'vocab', item }));

  const lVariantIdx = pickVariantIndex('listening', level, LISTENING_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.listening[level] : undefined);
  const lPool = LISTENING_BANK[level][lVariantIdx];
  const listeningPicks = sample(lPool, 1).map(item=>({ kind:'listening', item }));

  const sVariantIdx = pickVariantIndex('speaking', level, SPEAKING_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.speaking[level] : undefined);
  const sPool = SPEAKING_BANK[level][sVariantIdx];
  const speakingPicks = sample(sPool, 1).map(item=>({ kind:'speaking', item }));

  const wVariantIdx = pickVariantIndex('writing', level, WRITING_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.writing[level] : undefined);
  const wPool = WRITING_BANK[level][wVariantIdx];
  const writingPicks = sample(wPool, 2).map(item=>({ kind:'writing', item }));

  const all = [...grammarPicks, ...vocabPicks, ...listeningPicks, ...speakingPicks, ...writingPicks];
  for(let i=all.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [all[i],all[j]]=[all[j],all[i]]; }
  return all;
}

const MIX_KIND_LABEL = { grammar:'Gramática', vocab:'Vocabulario', listening:'Listening', speaking:'Speaking', writing:'Writing' };

function renderMixItemInto(card, entry, onAnswered){
  const item = entry.item;
  // En "Mis errores" y en el repaso de errores del Plan, el botón de Leo AI
  // dice "Explícame este error".
  const aiReview = { reviewMode: !!entry.reviewOrigin || /errores(\.html)?$/.test(location.pathname) };
  if(entry.kind === 'grammar'){
    renderGrammarItemInto(card, item, onAnswered, aiReview);
    return;
  }
  if(entry.kind === 'vocab'){
    card.innerHTML = `
      <div class="practice-prompt" style="font-size:1.05rem;">${item.quiz.prompt}</div>
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const list = card.querySelector('#optList');
    const { options: shuffledQuizOptions, correct: shuffledQuizCorrect } = shuffleOptions(item.quiz.options, item.quiz.correct);
    shuffledQuizOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledQuizCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledQuizCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        const reveal = document.createElement('div');
        reveal.className = 'vocab-card';
        reveal.style.marginTop = '16px';
        reveal.innerHTML = `<div class="vocab-word">${item.word}</div><div class="vocab-sub">${item.translation}</div>`;
        list.after(reveal);
        renderFeedback(card, isCorrect, item.quiz.explain, item.examples);
        leoAiAttach(card.querySelector('#fb'), Object.assign({ kind:'vocab', item, isCorrect, userAnswer:opt }, aiReview));
        onAnswered(isCorrect);
      });
      list.appendChild(b);
    });
    return;
  }
  if(entry.kind === 'listening'){
    card.innerHTML = `
      <div class="practice-prompt">Escucha</div>
      <div class="listen-row">
        <button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} Reproducir</button>
      </div>
      <div class="practice-prompt" style="font-size:1.05rem;">${item.question}</div>
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    card.querySelector('#playBtn').addEventListener('click', function(){ playAudioFile(item.audioFile, card); });
    const list = card.querySelector('#optList');
    const { options: shuffledListenOptions, correct: shuffledListenCorrect } = shuffleOptions(item.options, item.correct);
    shuffledListenOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledListenCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledListenCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        const fb = card.querySelector('#fb');
        fb.classList.add('show');
        fb.classList.toggle('ok', isCorrect);
        fb.classList.toggle('bad', !isCorrect);
        fb.innerHTML = `
          <div class="fb-head">${isCorrect ? OK_ICON : BAD_ICON}<span>${isCorrect ? 'Correcto' : 'Casi.'}</span></div>
          <p class="fb-explain">${item.explain}</p>
          <div class="examples-block">
            <div class="examples-label">Transcripción</div>
            <div class="example-pair"><div class="example-en">${item.transcript}</div><div class="example-es">${item.translation}</div></div>
          </div>`;
        leoAiAttach(fb, Object.assign({ kind:'listening', item, isCorrect, userAnswer:opt }, aiReview));
        onAnswered(isCorrect);
      });
      list.appendChild(b);
    });
    return;
  }
  if(entry.kind === 'writing'){
    card.innerHTML = `
      <div class="practice-prompt">${item.prompt}</div>
      <textarea id="writingInput" rows="3" class="writing-area" placeholder="Escribe tu frase en inglés aquí..."></textarea>
      <div class="next-row" style="justify-content:flex-start;">
        <button class="btn btn-primary btn-sm" id="reviewBtn">Revisar mi frase</button>
      </div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const input = card.querySelector('#writingInput');
    const fb = card.querySelector('#fb');
    card.querySelector('#reviewBtn').addEventListener('click', ()=>{
      const evalResult = evaluateWritingAnswer(input.value, item);
      const isOk = evalResult.isOk;
      fb.classList.add('show');
      fb.classList.toggle('ok', isOk);
      fb.classList.toggle('bad', !isOk);
      fb.innerHTML = `
        <div class="fb-head">${isOk ? OK_ICON : BAD_ICON}<span>${isOk ? 'Estructura correcta' : 'Revisa la estructura'}</span></div>
        <p class="fb-explain">${isOk ? 'Tu frase incluye la estructura que buscábamos.' : (evalResult.hint || item.hint)}</p>
        <div class="examples-block">
          <div class="examples-label">Ejemplo</div>
          <div class="example-pair"><div class="example-en">${item.example.en}</div><div class="example-es">${item.example.es}</div></div>
        </div>
        <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
      leoAiAttach(fb, { kind:'writing', item, userAnswer:input.value, isOk });
      onAnswered(isOk, writingLowEffort(input.value) ? { lowEffort:true } : null);
    });
    return;
  }
  if(entry.kind === 'speaking'){
    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    card.innerHTML = `
      <div class="practice-prompt">Escucha</div>
      <div class="speak-sentence">${item.sentence}</div>
      <p class="speak-tip">${item.translation}</p>
      <div class="speak-actions">
        <button class="btn btn-ghost btn-sm" id="hearBtn">${PLAY_ICON} Escuchar pronunciación</button>
      </div>
      <div class="practice-prompt" style="margin-top:22px;">Ahora tú</div>
      <div class="speak-actions">
        ${canRecord
          ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi voz</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
          : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
      </div>
      <div id="compareRow" class="compare-row"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    card.querySelector('#hearBtn').addEventListener('click', ()=> playAudioFile(item.audioFile, card));
    if(canRecord){
      let stream = null, recorder = null, chunks = [], recognition = null;
      const recordBtn = card.querySelector('#recordBtn');
      const compareRow = card.querySelector('#compareRow');
      const recIndicator = card.querySelector('#recIndicator');
      const scoreBlock = card.querySelector('#fb');
      recordBtn.addEventListener('click', async ()=>{
        if(recorder && recorder.state === 'recording'){ recorder.stop(); return; }
        compareRow.innerHTML = '';
        scoreBlock.innerHTML = '';
        scoreBlock.classList.remove('feedback','show','ok','bad');
        try{
          stream = await acquireMicStream(recognition);
        }catch(err){
          compareRow.innerHTML = `<p class="audio-missing-note">No pudimos acceder al micrófono. Revisa los permisos del navegador.</p>`;
          return;
        }
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = ()=>{
          const blob = recordedAudioBlob(chunks, recorder);
          const url = URL.createObjectURL(blob);
          compareRow.innerHTML = `
            <div class="compare-col">
              <div class="compare-label">Pronunciación original</div>
              <button class="btn btn-ghost btn-sm" id="origBtn">${PLAY_ICON} Escuchar</button>
            </div>
            <div class="compare-col">
              <div class="compare-label">Tu grabación</div>
              <audio controls src="${url}"></audio>
            </div>`;
          compareRow.querySelector('#origBtn').addEventListener('click', ()=> playAudioFile(item.audioFile, card));
          fixRecordedAudioDuration(compareRow.querySelector('audio'), blob);
          stream.getTracks().forEach(t=>t.stop());
          recordBtn.innerHTML = `${MIC_ICON} Grabar de nuevo`;
          if(recIndicator) recIndicator.hidden = true;
          scoreBlock.innerHTML = `<p class="audio-missing-note">Analizando pronunciación...</p>`;
          if(recognition) recognition.stop();
          else renderSpeechScoreBlock(scoreBlock, item.sentence, null);
        };
        recorder.start();
        recognition = startSpeechRecognitionCapture((saidText)=>{
          renderSpeechScoreBlock(scoreBlock, item.sentence, saidText);
        });
        recordBtn.textContent = 'Detener grabación';
        if(recIndicator) recIndicator.hidden = false;
      });
    }
    // Speaking no se califica con correcto/incorrecto: se avisa que
    // quedó lista para continuar (el análisis de pronunciación de
    // arriba es informativo, no cambia results.isCorrect).
    onAnswered(null);
    return;
  }
}

/* ---------- Niveles de acceso y límites de ejercicios gratis ----------
   ÚNICA fuente de verdad para "cuántos ejercicios puede hacer cada
   quien" en practica.html. Tres niveles:

     - Visitante sin cuenta: GUEST_EXERCISE_LIMIT ejercicios POR DÍA.
     - Cuenta gratis (is_member=false): FREE_USER_DAILY_LIMIT
       ejercicios POR DÍA EN TOTAL, no adicionales a los del
       visitante.
     - Miembro (is_member=true): sin límite. Esto no cambió: las
       páginas de miembros nunca llaman a freeDailyLimitReached().

   Para cambiar los números basta con tocar estas dos constantes.
   Nada más en el sitio necesita tocarse (salvo el copy fijo del correo
   "limit_reached" en supabase_functions/upgrade-nudge-emails.ts, que
   no puede leer esta constante de JS por vivir en otro lado: si
   cambian estos números, ese correo también hay que actualizarlo a
   mano, y volver a desplegar esa función en Supabase).

   CÓMO SE CUENTA (importante, léase antes de tocar esto): hay UN SOLO
   contador por navegador y por día (getLocalDailyCount/
   bumpLocalDailyCount, guardado en localStorage con la fecha de hoy
   en la llave), y NO se reinicia ni se duplica al iniciar/cerrar
   sesión ni al crear una cuenta. Antes existían dos contadores
   separados (uno de "visitante" y otro de "cuenta gratis", ligado al
   id de la cuenta) que se intentaban reconciliar con un "traspaso" al
   registrarse; eso dejaba un hueco real: si alguien ya tenía
   ejercicios hechos como cuenta gratis y CERRABA SESIÓN para volver a
   practicar como visitante, el contador de visitante empezaba de 0 y
   ese traspaso solo corría una vez por día, así que esos ejercicios
   de más quedaban invisibles y la persona podía terminar haciendo más
   de FREE_USER_DAILY_LIMIT ejercicios reales en el mismo navegador.
   Con un solo contador compartido entre modo visitante y modo cuenta
   gratis, cerrar sesión ya no "resetea" nada: sea cual sea el modo en
   el que se esté, freeDailyLimitReached() siempre compara contra el
   mismo total de hoy en este navegador.

   Para cuenta gratis, además se compara ese total local contra
   profiles.free_daily_count de Supabase (ver getFreeAcctExerciseCount)
   por si esa misma cuenta ya practicó desde OTRO dispositivo hoy: se
   usa el mayor de los dos, nunca se suman. Importante limitación
   aceptada a propósito (no se resuelve con infraestructura nueva):
   los ejercicios hechos como VISITANTE en un dispositivo/navegador
   distinto no pueden conocerse desde otro, porque el modo visitante
   no manda nada a Supabase (no hay cuenta con la que asociarlos
   todavía). Eso sí podría, en teoría, dejar pasar hasta
   GUEST_EXERCISE_LIMIT ejercicios extra si alguien practica como
   visitante en dos navegadores/dispositivos distintos el mismo día
   antes de tener cuenta. Es el mismo tipo de límite "no a prueba de
   trampas" que ya existía (ver nota más abajo), y evitarlo del todo
   requeriría identificar visitantes de alguna forma (huella de
   dispositivo, cookie server-side, etc.), que es justo la complejidad
   que se decidió NO construir.

   Ninguno de estos límites es "a prueba de trampas" (localStorage se
   puede borrar, y el conteo de cuenta gratis se manda desde el
   navegador): son para frenar el uso normal y guiar hacia crear
   cuenta / hacerse miembro, no un candado de seguridad. */
var GUEST_EXERCISE_LIMIT = 5;
var FREE_USER_DAILY_LIMIT = 10;

/* Estado del nivel de acceso para esta carga de página. practica.html
   llama a initLeoAccessTier() una sola vez, justo después de revisar
   si hay sesión iniciada y si is_member, ANTES de arrancar
   initFreePractice(). Si nunca se llama (por ejemplo una pestaña
   vieja en caché), se sigue tratando como visitante: es el límite
   más chico, así que es el default más seguro. */
var _leoAccessTier = 'guest'; // 'guest' | 'free'
var _leoAccessProfile = null; // fila de profiles, solo cuando hay cuenta gratis

function initLeoAccessTier(tier, profile){
  _leoAccessTier = (tier === 'free') ? 'free' : 'guest';
  _leoAccessProfile = (tier === 'free') ? (profile || null) : null;
}

function trackLeoEvent(name, params){
  try{ if(typeof gtag === 'function') gtag('event', name, params || {}); }catch(e){}
  try{ if(typeof fbq === 'function') fireMetaPixelEvent(name, params); }catch(e){}
}

/* Traduce nuestros eventos internos a los eventos "estandar" que ya
   entiende el Pixel de Meta (Facebook/Instagram Ads), para que los
   anuncios se puedan optimizar hacia gente que de verdad se
   registra o paga, no solo hacia quien hace clic. Los eventos que
   no estan en este mapa no se le mandan a Meta a proposito (no
   tiene caso llenarle el Pixel con cada micro-evento interno). */
var META_PIXEL_EVENT_MAP = {
  'free_signup_completed': 'CompleteRegistration',
  'membership_cta_clicked': 'InitiateCheckout',
  'membership_purchase_completed': 'Purchase',
};
function fireMetaPixelEvent(name, params){
  var metaName = META_PIXEL_EVENT_MAP[name];
  if(!metaName) return;
  if(metaName === 'Purchase'){
    // Plan anual = 20 USD; mensual (default) = 2 USD.
    var value = (params && params.value) ? params.value : 2;
    fbq('track', 'Purchase', { value: value, currency: 'USD' });
  } else {
    fbq('track', metaName);
  }
}

function todayStr(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

/* ---- Contador único por navegador y por día, compartido entre modo
   visitante y modo cuenta gratis (ver nota grande de arriba: esto es
   lo que cierra el hueco de "cerrar sesión para resetear el
   contador"). La fecha de hoy va en la llave, así que se reinicia
   solo cada día. Abrir una ventana de incógnito o borrar los datos
   del sitio lo reinicia antes de tiempo, y es un riesgo aceptado (no
   es la barrera real; la barrera real es pedir cuenta / membresía). */
function localDailyCountKey(){
  return `leoLocalDailyCount:${todayStr()}`;
}
function getLocalDailyCount(){
  try{ return parseInt(localStorage.getItem(localDailyCountKey()), 10) || 0; }catch(e){ return 0; }
}
function bumpLocalDailyCount(){
  const next = getLocalDailyCount() + 1;
  try{ localStorage.setItem(localDailyCountKey(), String(next)); }catch(e){}
  return next;
}

/* ---- Cuenta gratis: el conteo real del día es el MAYOR entre lo que
   este navegador ya sabe (getLocalDailyCount, incluye lo hecho como
   visitante antes de iniciar sesión hoy mismo, y lo hecho como cuenta
   gratis después) y lo que trae Supabase de esta cuenta para hoy
   (profiles.free_daily_count/free_daily_date, ver supabase_schema.sql,
   por si esa misma cuenta ya practicó desde otro dispositivo). Nunca
   se suman, siempre se toma el mayor. Si Supabase no responde o esas
   columnas todavía no existen, sigue funcionando solo con
   localStorage (se degrada, no se rompe). */
function getFreeAcctExerciseCount(){
  const local = getLocalDailyCount();
  const remoteToday = (_leoAccessProfile && _leoAccessProfile.free_daily_date === todayStr() && typeof _leoAccessProfile.free_daily_count === 'number')
    ? _leoAccessProfile.free_daily_count : 0;
  return Math.max(local, remoteToday);
}
function bumpFreeAcctExerciseCount(){
  const userId = _leoAccessProfile && _leoAccessProfile.id;
  if(!userId) return;
  const next = getFreeAcctExerciseCount() + 1;
  try{ localStorage.setItem(localDailyCountKey(), String(next)); }catch(e){}
  if(typeof LeoBackend !== 'undefined' && LeoBackend.isConfigured() && LeoBackend.bumpFreeDailyCount){
    // Estas dos banderas solo se mandan la primera vez que aplican
    // (se guardan en Supabase, así que después de la primera vez
    // _leoAccessProfile ya las trae puestas y no se vuelven a mandar).
    // Las usan los correos automáticos (ver upgrade-nudge-emails.ts):
    // isFirstEver = "esta cuenta gratis ya practicó alguna vez" (para
    // no mandarle el recordatorio de "creaste cuenta y no practicaste").
    // justReachedLimit = el momento exacto en que topó su límite diario
    // de hoy (para el correo de "ya completaste tu práctica gratis",
    // que se manda algunas horas después, no al instante).
    const isFirstEver = !_leoAccessProfile.free_first_exercise_at;
    const justReachedLimit = next === FREE_USER_DAILY_LIMIT;
    LeoBackend.bumpFreeDailyCount(next, todayStr(), { isFirstEver, justReachedLimit }).catch(function(){});
    if(isFirstEver) _leoAccessProfile.free_first_exercise_at = new Date().toISOString();
    if(justReachedLimit) _leoAccessProfile.free_daily_limit_reached_at = new Date().toISOString();
    // Mantiene el perfil en memoria al día: si se vuelve a llamar a
    // getFreeAcctExerciseCount() en esta misma carga de página (por
    // ejemplo, justo después, para pintar el bloque de límite), ya
    // refleja el valor real sin depender de que localStorage y este
    // objeto coincidan por casualidad.
    _leoAccessProfile.free_daily_count = next;
    _leoAccessProfile.free_daily_date = todayStr();
  }
}

/* ---- Punto único que usan las 5 sesiones gratis + runMixSessionCore.
   Nadie más en el sitio debe leer/escribir estos contadores a mano:
   siempre a través de estas tres funciones. */
function freeDailyLimitReached(){
  if(_leoAccessTier === 'free') return getFreeAcctExerciseCount() >= FREE_USER_DAILY_LIMIT;
  return getLocalDailyCount() >= GUEST_EXERCISE_LIMIT;
}
function bumpFreeDailyExerciseCount(){
  if(_leoAccessTier === 'free') bumpFreeAcctExerciseCount();
  else bumpLocalDailyCount();
}
function renderFreeDailyLimitReachedBlock(){
  if(_leoAccessTier === 'free'){
    trackLeoEvent('free_daily_limit_reached');
    return `
      <div class="session-summary upgrade-block">
        <h2>¡Completaste tus ${FREE_USER_DAILY_LIMIT} ejercicios gratis de hoy!</h2>
        <p class="summary-score">Vas muy bien. Si quieres seguir ahora mismo, como miembro practicas sin límite:</p>
        <ul class="upgrade-benefits">
          <li>Un sistema que recuerda tus errores y te dice qué practicar después</li>
          <li><strong>Leo AI</strong> cuando necesitas una explicación extra</li>
          <li>Práctica ilimitada de gramática, vocabulario, listening, speaking y writing</li>
          <li>Preparación para TOEIC, TOEFL, IELTS y Cambridge</li>
          <li>Clases interactivas del método del Profe Leo y repaso automático de tus errores</li>
          <li>Tu progreso y tu racha guardados en cualquier dispositivo</li>
        </ul>
        <p class="upgrade-price"><strong>$2 USD al mes</strong> (en México, $37 MXN). Cancela cuando quieras.</p>
        <div class="summary-actions">
          <a href="miembros.html" class="btn btn-primary" onclick="trackLeoEvent('membership_cta_clicked')">Seguir practicando sin límite</a>
          <a href="index.html" class="btn btn-ghost">Volver mañana</a>
        </div>
        <p class="upgrade-note">Tus ${FREE_USER_DAILY_LIMIT} ejercicios gratis se renuevan mañana.</p>
      </div>`;
  }
  trackLeoEvent('guest_exercise_limit_reached');
  trackLeoEvent('signup_prompt_shown');
  // Al crear la cuenta, miembros.html regresa a la persona a esta
  // misma pagina (?volver=...) para que siga practicando sin perder
  // el hilo, en vez de dejarla en la pantalla de pago.
  var volverPage = (window.location.pathname.split('/').pop() || '');
  if(!/^[a-z0-9-]+\.html$/.test(volverPage)) volverPage = 'practica.html';
  return `
    <div class="session-summary">
      <h2>¡Buen trabajo! Ya completaste tus ejercicios de prueba.</h2>
      <p class="summary-score">Crea tu cuenta gratis y sigue ahora mismo: ${FREE_USER_DAILY_LIMIT} ejercicios cada día, con tu racha y tu progreso guardados. No pide tarjeta.</p>
      <div class="summary-actions">
        <a href="miembros.html?modo=registro&volver=${volverPage}" class="btn btn-primary">Crear cuenta gratis</a>
        <a href="miembros.html" class="btn btn-ghost">Ya tengo cuenta</a>
      </div>
    </div>`;
}


function runMixSessionCore({ container, level, onExit, onOtherSkill, isFree }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const saved = !isFree ? loadInflightSession('mixto', level) : null;
  const useSaved = !!(saved && Array.isArray(saved.pool) && typeof saved.idx === 'number' && saved.idx < saved.pool.length);
  const pool = useSaved ? saved.pool : pickMixItems(level, isFree);
  const total = pool.length;
  const startedAt = useSaved ? saved.startedAt : Date.now();
  const results = useSaved ? saved.results.slice() : [];
  let idx = useSaved ? saved.idx : 0;

  function renderItem(){
    if(isFree && freeDailyLimitReached()){
      container.innerHTML = renderFreeDailyLimitReachedBlock();
      return;
    }
    const entry = pool[idx];
    if(!isFree) saveInflightSession('mixto', level, { pool, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Mixto · ' + MIX_KIND_LABEL[entry.kind], level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderMixItemInto(card, entry, (isCorrect, extra)=>{
      results.push(Object.assign({ itemId: entry.item.id, isCorrect }, extra || null));
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        if(isFree) bumpFreeDailyExerciseCount();
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    });
  }

  function finish(){
    if(!isFree) clearInflightSession('mixto', level);
    const graded = results.filter(r=> r.isCorrect === true || r.isCorrect === false);
    const correct = graded.filter(r=>r.isCorrect).length;
    const score = graded.length ? `${correct} / ${graded.length} correctas · ${total} ejercicios en total` : `${total} ejercicios completados`;
    if(isFree){
      container.innerHTML = renderFreeSessionSummary({ results: (typeof results !== 'undefined' ? results : null),
        title:'¡Listo!', score, topics: ['Mezcla de habilidades']
      });
      wireFreeSummaryButtons(container, {
        onAgain: ()=>runMixSessionCore({ container, level, onExit, onOtherSkill, isFree }),
        onOtherSkill
      });
    } else {
      recordSession({ skill:'mixto', level, topics:['Mezcla de habilidades'], results, startedAt });
      container.innerHTML = renderSessionSummary({
        title:'¡Listo!', score, topics: ['Mezcla de habilidades']
      });
      wireSummaryButtons(container, ()=>runMixSessionCore({ container, level, onExit, onOtherSkill, isFree }));
      appendSessionInsight(container, results, startedAt, 'mixto');
    }
  }

  renderItem();
}
function runMixSession({ container, level, onExit }){
  runMixSessionCore({ container, level, onExit, isFree:false });
}
function runFreeMixSession({ container, level, onOtherSkill }){
  runMixSessionCore({ container, level, onOtherSkill, isFree:true });
}

/* ============================================================
   PLAN DE ESTUDIO — sesion diaria personalizada (solo Miembros)
   ------------------------------------------------------------
   No es "Mixto con otro nombre": arma la sesion combinando, en este
   orden de prioridad, (1) errores pendientes (reutiliza el mismo
   buildMistakePool() de "Mis errores"), (2) habilidades donde el
   usuario tiene menos % de aciertos, (3) habilidades que lleva mas
   tiempo sin practicar, (4) siempre dentro de su nivel actual, y
   (5) un poco de variedad para no repetir la misma combinacion.
   No usa IA ni genera ejercicios nuevos: solo elige items del mismo
   banco (data.js) con las mismas funciones que ya arman las sesiones
   de Gramatica/Vocabulario/etc (buildSessionPool) y de Mis errores
   (buildMistakePool), y los reproduce con el mismo motor de Mixto
   (renderMixItemInto). Un usuario sin historial (accuracy/ultima vez
   nulos para todo) simplemente recibe pesos parejos entre las 5
   habilidades, osea una sesion equilibrada por nivel, sin caso
   especial aparte.

   Registro de progreso (importante): una sesion de Plan de estudio
   sigue siendo UNA sola sesion (una sola llamada a recordSession, un
   solo renglon en "actividad reciente", no infla ningun contador de
   sesiones ni la racha), pero cada resultado individual guarda su
   propia habilidad real (result.skill) para que el aro de progreso de
   Gramatica/Listening/etc, la cobertura del banco y "Mis errores"
   sigan funcionando exactamente igual que si esos ejercicios se
   hubieran hecho desde la pagina de esa habilidad. No se guarda
   ninguna skill nueva tipo "mistakes"/"review": un error de Gramatica
   sigue contando como Gramatica.
   ============================================================ */

// Mapas de ida y vuelta entre la "skill" real (como se guarda el
// progreso: gramatica/vocabulario/listening/writing/speaking) y el
// "kind" que ya usa el motor de Mixto para dibujar cada tipo de
// ejercicio (grammar/vocab/listening/writing/speaking). Son los mismos
// 5 que ya cubre Mixto (ver DASH_SKILLS); Plan de estudio no agrega
// Lectura ni Cambridge/TOEFL/IELTS.
const PLAN_SKILL_TO_KIND = { gramatica:'grammar', vocabulario:'vocab', listening:'listening', writing:'writing', speaking:'speaking' };
const PLAN_KIND_TO_SKILL = { grammar:'gramatica', vocab:'vocabulario', listening:'listening', writing:'writing', speaking:'speaking' };
// Guardado con typeof: esta linea se ejecuta apenas carga app.js
// (no dentro de una funcion), y varias paginas -como los articulos-
// cargan app.js SIN data.js (que es quien define GRAMMAR_BANK y los
// demas bancos). Sin este guardado, con eso rompia con un
// ReferenceError apenas cargaba app.js en esas paginas, y como es
// una sola linea de <script>, tumbaba TODO lo que viene despues en
// el archivo (incluyendo initArticleComments). Plan de estudio, que
// es quien de verdad usa PLAN_BANK_BY_SKILL, siempre carga data.js,
// asi que no pierde nada con este guardado.
const PLAN_BANK_BY_SKILL = (typeof GRAMMAR_BANK !== 'undefined')
  ? { gramatica:GRAMMAR_BANK, vocabulario:VOCAB_BANK, listening:LISTENING_BANK, writing:WRITING_BANK, speaking:SPEAKING_BANK }
  : {};

// % de aciertos de una habilidad (0-100) usando el mismo historial de
// siempre (p.sessions[].results), o null si nunca se calificó nada en
// esa habilidad todavía. No existía una funcion para esto: hasta ahora
// solo teniamos "% del banco ya visto" (computeSkillCoverage), no
// "% de aciertos". Igual que el arreglo de attemptedItemIdsFor de
// arriba, mira result.skill primero y cae a session.skill si el
// resultado no trae su propia skill (sesiones de antes de Plan de
// estudio, o de cualquier habilidad normal).
function computeSkillAccuracy(p, skill){
  let correct = 0, graded = 0;
  p.sessions.forEach(s=>{
    (s.results||[]).forEach(r=>{
      if((r.skill || s.skill) !== skill) return;
      if(r.isCorrect !== true && r.isCorrect !== false) return; // speaking no calificado, se ignora
      graded++;
      if(r.isCorrect) correct++;
    });
  });
  return graded ? Math.round(correct/graded*100) : null;
}

// Fecha (YYYY-MM-DD) de la ultima vez que el usuario practico esa
// habilidad, o null si nunca. Misma logica de result.skill/session.skill
// que las funciones de arriba.
function lastPracticedDateFor(p, skill){
  let last = null;
  p.sessions.forEach(s=>{
    const touchesSkill = (s.results||[]).some(r => (r.skill || s.skill) === skill);
    if(touchesSkill && (!last || s.date > last)) last = s.date;
  });
  return last;
}

// Dias completos desde una fecha YYYY-MM-DD hasta hoy (hora local),
// o null si no hay fecha.
function daysSinceDateStr(dateStr){
  if(!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(localDateStr() + 'T00:00:00');
  return Math.max(0, Math.round((today - d) / 86400000));
}

/* Decide CUANTOS ejercicios de repaso de errores y de cada habilidad
   real va a tener la sesion (sin armar los items todavia: eso lo hace
   buildPlanPool). Se separa en dos pasos para poder mostrar la vista
   previa sin "gastar" la memoria de variedad de buildSessionPool cada
   vez que el usuario solo esta mirando/cambiando la duracion: esta
   funcion no guarda nada en localStorage, se puede llamar las veces
   que haga falta. */
function computePlanSelection(level, targetCount, opts){
  const p = loadProgress();
  // ?micro=<id>: el foco es ese microtema (solo si está activo y tiene ejercicios en este nivel); implica su tema y familia.
  const microFocus = (opts && opts.focusMicro && microIsActive(opts.focusMicro) && microHasItemsAt(opts.focusMicro, level)) ? MICRO_BY_ID[opts.focusMicro] : null;
  if(microFocus){ const mt = TEMA_BY_ID[microFocus.tema] || {}; opts = Object.assign({}, opts, { focusTema: microFocus.tema, focusFamily: mt.family }); }
  // Foco elegido desde un enlace ("Practicar Preposiciones", "Reforzar en
  // mi Plan"): usa el mismo refuerzo de abajo con otra familia y más cupos.
  const urlTema = (opts && opts.focusTema && typeof TEMA_BY_ID !== 'undefined') ? TEMA_BY_ID[opts.focusTema] : null;
  // Tema de vocabulario (?tema=vocab-...): se usa si tiene palabras en este nivel; si no, el Plan normal.
  // ?habilidad=writing&tema=<cualquier tema>: consignas de Writing de ese tema (no toca Gramática).
  const forcedWriting = (opts && opts.focusSkill === 'writing' && urlTema && temaHasItemsAt(urlTema.id, level, 'writing')) ? urlTema : null;
  const forcedVocab = (!forcedWriting && !(opts && opts.focusSkill) && urlTema && TEMA_SKILL_KEY[urlTema.skill] && temaHasItemsAt(urlTema.id, level)) ? urlTema : null;   // vocabulario o listening
  const famId = (forcedWriting || (opts && opts.focusSkill)) ? null : ((opts && opts.focusFamily) || (urlTema && urlTema.family) || null);
  const forcedFamily = (famId && DIAG_FAMILY_BY_ID[famId] && familyHasItemsAt(famId, level))
    ? DIAG_FAMILY_BY_ID[famId] : null;
  // El tema solo vale si pertenece a esa familia y tiene ejercicios en este nivel.
  const forcedTema = (urlTema && forcedFamily && urlTema.family === forcedFamily.id && temaHasItemsAt(urlTema.id, level)) ? urlTema : null;

  // Prioridad 1: errores recientes. Hasta ~30% de la sesion (dejando
  // siempre al menos 2 lugares para el resto), reutilizando tal cual
  // buildMistakePool() de "Mis errores" (no filtra por nivel, igual
  // que esa pantalla ya hace hoy: repasa el error tal como se dio).
  const errorBudget = Math.max(0, Math.min(targetCount - 2, Math.round(targetCount * 0.3)));
  const mistakeCandidates = errorBudget > 0 ? buildMistakePool(errorBudget) : [];
  const mistakeCount = mistakeCandidates.length;
  const remaining = Math.max(0, targetCount - mistakeCount);

  // Prioridades 2 y 3: mas peso a habilidades con % de aciertos bajo
  // y a las que lleva mas tiempo sin practicar. Prioridad 4 (nivel) se
  // cumple sola porque buildPlanPool siempre toma el banco del nivel
  // actual. Un poco de variedad (prioridad 5) con un jitter chico que
  // no ignora el progreso, solo evita que el reparto sea identico dia
  // a dia si las metricas no cambiaron.
  // El % de cada habilidad sale del diagnóstico (mismo número que ve el
  // alumno en "Tu diagnóstico": cómo va AHORA, con la habilidad real de
  // cada ejercicio aunque venga de Mixto o del Plan). Si todavía no hay
  // datos suficientes, se usa el % histórico de siempre.
  let diag = null;
  try{ diag = computeDiagnosis(p); }catch(e){ diag = null; } // el diagnóstico nunca debe impedir armar el plan
  const skills = DASH_SKILLS.slice();
  const weights = {};
  skills.forEach(sk=>{
    const acc = planSkillAccuracy(p, sk, diag);
    const idleDays = daysSinceDateStr(lastPracticedDateFor(p, sk));
    let w = 1;
    if(acc !== null) w += Math.max(0, 70 - acc) / 20;      // hasta +3.5 si acc=0%
    if(idleDays !== null) w += Math.min(idleDays, 14) / 7; // hasta +2 a los 14+ dias
    else w += 1.5;                                          // nunca practicada: peso parejo, no extremo
    w *= 0.85 + Math.random() * 0.3;                         // variedad, sin ignorar lo anterior
    weights[sk] = w;
  });
  const totalWeight = skills.reduce((sum, sk)=> sum + weights[sk], 0) || 1;

  // Reparto proporcional a los pesos, redondeando con "mayor resto"
  // para que la suma de cupos por habilidad sea exactamente "remaining".
  const raw = skills.map(sk => ({ sk, val: (weights[sk] / totalWeight) * remaining }));
  const bySkill = {};
  let assigned = 0;
  raw.forEach(r=>{ bySkill[r.sk] = Math.floor(r.val); assigned += bySkill[r.sk]; });
  let leftover = remaining - assigned;
  raw.sort((a,b)=> (b.val - Math.floor(b.val)) - (a.val - Math.floor(a.val)));
  for(let i=0; leftover>0 && i<raw.length; i++, leftover--){ bySkill[raw[i].sk]++; }

  // Entrenamiento recomendado: si el diagnóstico encontró un punto débil
  // concreto de gramática (ej. Preposiciones), parte de los ejercicios de
  // Gramática de hoy salen de ese tema. Se asegura un mínimo de cupos de
  // Gramática quitándolos de la habilidad con más cupos, así el total de
  // la sesión no cambia. Si no hay diagnóstico todavía, todo sigue igual.
  let focus = null;
  try{
    let focusSkill = 'gramatica';
    let target;
    if(forcedWriting){
      focusSkill = 'writing';
      target = { id: null, label: forcedWriting.label, temaId: forcedWriting.id, temaLabel: forcedWriting.label };
    } else if(forcedVocab){
      focusSkill = TEMA_SKILL_KEY[forcedVocab.skill];
      target = { id: null, label: forcedVocab.label, temaId: forcedVocab.id, temaLabel: forcedVocab.label };
    } else {
      target = forcedFamily
        ? { id: forcedFamily.id, label: forcedFamily.label, temaId: forcedTema ? forcedTema.id : null, temaLabel: forcedTema ? forcedTema.label : null }
        : (diag && diag.ready && diag.weak && diag.weak.type === 'family' ? { id: diag.weak.id, label: diag.weak.label } : null);
      // Sin foco en la URL, el Plan sigue al tema más flojo que ya detectó el diagnóstico.
      if(target && !forcedFamily && diag.weak.focusTema && temaHasItemsAt(diag.weak.focusTema.id, level)){
        target.temaId = diag.weak.focusTema.id; target.temaLabel = diag.weak.focusTema.label;
      }
      // Vocabulario débil con un tema claro (y sin foco de gramática pedido): el refuerzo es ese tema.
      if(!target && !(opts && opts.focusFamily) && diag && diag.ready && diag.weak && diag.weak.type === 'skill' && (diag.weak.id === 'vocabulario' || diag.weak.id === 'listening' || diag.weak.id === 'writing')
        && diag.weak.focusTema && temaHasItemsAt(diag.weak.focusTema.id, level, diag.weak.id === 'writing' ? 'writing' : undefined)){
        focusSkill = diag.weak.id;
        target = { id: null, label: diag.weak.focusTema.label, temaId: diag.weak.focusTema.id, temaLabel: diag.weak.focusTema.label };
      }
    }
    if(target && (remaining >= 4 || (microFocus && remaining >= 3))){
      const forced = !!(forcedFamily || forcedVocab || forcedWriting);
      const want = forced
        ? Math.min(6, Math.max(3, Math.round(remaining * 0.5)))
        : Math.min(3, Math.max(2, Math.round(remaining * 0.25)));
      while((bySkill[focusSkill] || 0) < want){
        const donor = skills.filter(sk => sk !== focusSkill).sort((a,b)=> (bySkill[b]||0) - (bySkill[a]||0))[0];
        if(!donor || !bySkill[donor]) break;
        bySkill[donor]--; bySkill[focusSkill] = (bySkill[focusSkill] || 0) + 1;
      }
      const count = Math.min(want, bySkill[focusSkill] || 0);
      if(count > 0) focus = { skill: focusSkill, familyId: target.id, label: (microFocus && focusSkill === 'gramatica') ? microFocus.label : (target.temaLabel || target.label), temaId: target.temaId || null, microId: (microFocus && focusSkill === 'gramatica') ? microFocus.id : null, count, chosen: forced };
    }
  }catch(e){ focus = null; }

  return { mistakeCount, bySkill, focus };
}

// % de aciertos que usa el Plan para repartir cupos: el "ahora" del
// diagnóstico si esa habilidad ya tiene datos suficientes; si no, el %
// histórico (computeSkillAccuracy), como siempre.
function planSkillAccuracy(p, skill, diag){
  if(diag && diag.ready){
    const u = diag.units.find(x => x.key === 'skill:' + skill && x.state);
    if(u) return u.current;
  }
  return computeSkillAccuracy(p, skill);
}

// Arma los ejercicios de verdad a partir de una seleccion ya decidida
// (ver computePlanSelection). Aqui SI se usa buildSessionPool de las
// paginas normales (con su misma memoria de "no repetir variante"), asi
// que esta funcion debe llamarse una sola vez por sesion real, no en
// cada repintado de la vista previa.
function buildPlanPool(level, selection){
  const entries = (selection.mistakeCount > 0 ? buildMistakePool(selection.mistakeCount) : [])
    .map(e => Object.assign({ reviewOrigin:true }, e));
  const alreadyIn = new Set(entries.map(e => e.item.id));
  const focusSkill = (selection.focus && selection.focus.skill) || 'gramatica';
  const focusEntries = !selection.focus ? []
    : focusSkill !== 'gramatica' ? pickSkillFocusItems(focusSkill, level, selection.focus.temaId, selection.focus.count, alreadyIn)
    : pickDiagFocusItems(level, selection.focus.familyId, selection.focus.count, alreadyIn, selection.focus.temaId, selection.focus.microId);
  focusEntries.forEach(e=>{ e.focusLabel = selection.focus.label; e.focusTema = selection.focus.temaId || null; entries.push(e); alreadyIn.add(e.item.id); });
  DASH_SKILLS.forEach(sk=>{
    let count = selection.bySkill[sk] || 0;
    if(sk === focusSkill) count -= focusEntries.length;
    if(count <= 0) return;
    // Se piden unos pocos de más para poder saltar los que ya vienen en
    // la sesión (repaso de errores o refuerzo) y no repetir un ejercicio.
    // Si el banco es tan chico que no alcanza, se completa como antes,
    // para que la sesión siempre tenga la duración elegida.
    const extra = Math.min(5, alreadyIn.size);
    const { pool } = buildSessionPool({ skill: sk, level, bankLevel: PLAN_BANK_BY_SKILL[sk][level], targetCount: count + extra });
    const picked = pool.filter(item => !alreadyIn.has(item.id)).slice(0, count);
    if(picked.length < count) picked.push(...pool.filter(item => picked.indexOf(item) === -1).slice(0, count - picked.length));
    picked.forEach(item=>{ alreadyIn.add(item.id); entries.push({ kind: PLAN_SKILL_TO_KIND[sk], item }); });
  });
  return shuffleArray(entries);
}

// Agrupa una seleccion para la vista previa ("Tu sesion de hoy"): solo
// muestra las categorias que de verdad va a usar la sesion (nunca un
// "0 ejercicios").
function summarizePlanSelection(selection){
  const groups = [];
  if(selection.mistakeCount > 0) groups.push({ label:'Repaso de errores', count: selection.mistakeCount });
  if(selection.focus) groups.push({ label: 'Refuerzo: ' + selection.focus.label, count: selection.focus.count });
  DASH_SKILLS.forEach(sk=>{
    let count = selection.bySkill[sk] || 0;
    if(selection.focus && sk === (selection.focus.skill || 'gramatica')) count -= selection.focus.count;
    if(count > 0) groups.push({ label: SKILL_LABELS[sk], count });
  });
  return groups;
}

/* ---------- Duracion de Plan de estudio (preferencia propia, separada
   de leo_session_length para no afectar la duracion de Gramatica,
   Vocabulario, etc). Normal queda seleccionada por defecto. ---------- */
const PLAN_LENGTHS = {
  rapida:   { label:'Rápida',   sub:'5 min',                 items:5 },
  normal:   { label:'Normal',   sub:'10–15 min · Recomendada', items:9 },
  completa: { label:'Completa', sub:'20–25 min',             items:15 }
};
const PLAN_LENGTH_KEY = 'leo_plan_length';
function getPlanLength(){
  try{
    const v = localStorage.getItem(PLAN_LENGTH_KEY);
    return PLAN_LENGTHS[v] ? v : 'normal';
  }catch(e){ return 'normal'; }
}
function setPlanLength(len){
  try{ if(PLAN_LENGTHS[len]) localStorage.setItem(PLAN_LENGTH_KEY, len); }catch(e){}
}
function renderPlanLengthSelector(container, selected, onChange){
  if(!container) return;
  container.innerHTML = Object.keys(PLAN_LENGTHS).map(key=>{
    const l = PLAN_LENGTHS[key];
    return `<button type="button" class="length-card" data-len="${key}" aria-pressed="${key===selected}">
      <span class="length-name">${l.label}</span>
      <span class="length-sub">${l.sub}</span>
    </button>`;
  }).join('');
  container.querySelectorAll('.length-card').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const len = btn.dataset.len;
      if(len === selected) return;
      onChange(len);
    });
  });
}

/* ---------- Dificultad de Plan de estudio ----------
   No existe informacion de dificultad por ejercicio en el banco (solo
   el nivel general LEVELS = ['principiante','facil','medio','avanzado']).
   Por eso "dificultad" no inventa una escala nueva: simplemente mueve
   UN paso dentro de la misma escalera de niveles que ya existe, nunca
   mas, y nunca por debajo/encima de los limites reales. 'A tu nivel'
   (recomendado, y el valor por defecto siempre) no mueve nada.
   Esto solo afecta que banco de nivel usa buildPlanPool() para la
   porcion "fresca" de la sesion; NO cambia cuantos ejercicios de cada
   habilidad se eligen (eso lo decide computePlanSelection, que no
   recibe la dificultad), asi que el orden de prioridad ya existente
   (errores > habilidades debiles > olvidadas > nivel > variedad) queda
   intacto y la dificultad se aplica al final, sobre los ejercicios
   concretos. Los items de repaso de errores (buildMistakePool) tampoco
   cambian de nivel: se revisa el item exacto que se fallo, no una
   version re-nivelada. */
const PLAN_DIFFICULTIES = {
  facil:        { label:'Fácil',      sub:'Un paso más sencillo' },
  recommended:  { label:'A tu nivel', sub:'Recomendada' },
  dificil:      { label:'Difícil',    sub:'Un paso más exigente' }
};
const PLAN_DIFFICULTY_KEY = 'leo_plan_difficulty';
function getPlanDifficulty(){
  try{
    const v = localStorage.getItem(PLAN_DIFFICULTY_KEY);
    return PLAN_DIFFICULTIES[v] ? v : 'recommended';
  }catch(e){ return 'recommended'; }
}
function setPlanDifficulty(diff){
  try{ if(PLAN_DIFFICULTIES[diff]) localStorage.setItem(PLAN_DIFFICULTY_KEY, diff); }catch(e){}
}
function resolvePlanContentLevel(userLevel, difficulty){
  const idx = LEVELS.indexOf(userLevel);
  if(idx === -1) return userLevel;
  if(difficulty === 'facil') return LEVELS[Math.max(0, idx - 1)];
  if(difficulty === 'dificil') return LEVELS[Math.min(LEVELS.length - 1, idx + 1)];
  return userLevel;
}
function renderPlanDifficultySelector(container, selected, onChange){
  if(!container) return;
  container.innerHTML = Object.keys(PLAN_DIFFICULTIES).map(key=>{
    const d = PLAN_DIFFICULTIES[key];
    return `<button type="button" class="length-card" data-diff="${key}" aria-pressed="${key===selected}">
      <span class="length-name">${d.label}</span>
      <span class="length-sub">${d.sub}</span>
    </button>`;
  }).join('');
  container.querySelectorAll('.length-card').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const diff = btn.dataset.diff;
      if(diff === selected) return;
      onChange(diff);
    });
  });
}

/* Pantalla inicial de Plan de estudio: duracion + vista previa. La
   seleccion (cuantos de cada cosa) se calcula una vez por duracion
   elegida y se reutiliza tal cual al presionar "Empezar mi sesion",
   para que la sesion real sea identica a lo que se previsualizo. */
// opts (opcional, viene de la URL de plan-estudio.html):
//   focusFamily  familia de gramática a reforzar (?foco=preposiciones)
//   focusTema    tema concreto dentro de la familia (?tema=verbos-irregulares)
//   autoStart    empezar sin pasar por la vista previa (?empezar=1)
function renderPlanIntro(container, opts){
  if(!container) return;
  opts = Object.assign({}, opts);
  const pageParams = takePagePlanParams();
  if(pageParams.comprobar && microIsActive(pageParams.comprobar)){ renderMicroCheck(container, pageParams.comprobar); return; }
  if(!opts.focusMicro && pageParams.micro) opts.focusMicro = pageParams.micro;
  const level = getUserLevel();
  let currentLen = getPlanLength();
  let currentDiff = getPlanDifficulty();
  const selOpts = { focusFamily: opts.focusFamily, focusTema: opts.focusTema, focusSkill: opts.focusSkill, focusMicro: opts.focusMicro };
  let currentSelection = computePlanSelection(level, PLAN_LENGTHS[currentLen].items, selOpts);
  let diffPanelOpen = false;

  function paint(){
    const groups = summarizePlanSelection(currentSelection);
    const diffMeta = PLAN_DIFFICULTIES[currentDiff];
    container.innerHTML = `
      <div class="session-shell">
        <p class="plan-intro-hint">Elige cuánto tiempo quieres practicar. Nosotros elegimos qué te conviene trabajar hoy.</p>
        <div class="examples-label">Duración</div>
        <div class="lengths" id="planLengthSelector" style="margin-bottom:24px;"></div>
        <div class="plan-difficulty-row">
          <div>
            <div class="examples-label">Dificultad ${currentDiff==='recommended' ? 'recomendada' : ''}</div>
            <div class="plan-difficulty-current">${diffMeta.label}${currentDiff==='recommended' ? ' <span class="plan-difficulty-note">· Basada en tu progreso.</span>' : ''}</div>
          </div>
          <button type="button" class="plan-difficulty-toggle" id="planDiffToggle">Cambiar dificultad ${diffPanelOpen ? '▴' : '▾'}</button>
        </div>
        <div class="lengths" id="planDifficultySelector" style="margin:${diffPanelOpen ? '12px 0 24px' : '0'};${diffPanelOpen ? '' : 'display:none;'}"></div>
        <div class="examples-label">Tu sesión de hoy</div>
        ${currentSelection.focus ? (currentSelection.focus.chosen
          ? `<p class="plan-focus-note">Hoy tu sesión se enfoca en <b>${currentSelection.focus.label}</b>, junto con tus errores pendientes.</p>`
          : `<p class="plan-focus-note">Incluye refuerzo de <b>${currentSelection.focus.label}</b>, tu punto a reforzar según <a href="progreso.html#diagnostico">tu diagnóstico</a>.</p>`) : ''}
        <ul class="plan-preview-list">
          ${groups.length ? groups.map(g=>`<li><span>${g.label}</span><b>${g.count} ${g.count===1?'ejercicio':'ejercicios'}</b></li>`).join('') : '<li><span>Sesión equilibrada para tu nivel</span></li>'}
        </ul>
        ${currentSelection.focus ? leoVozHtml('sigue-tema') : ''}
        <button class="btn btn-primary btn-block" id="planStartBtn">Empezar mi sesión →</button>
      </div>`;
    if(currentSelection.focus) leoVozActivate();
    renderPlanLengthSelector(document.getElementById('planLengthSelector'), currentLen, (newLen)=>{
      currentLen = newLen;
      setPlanLength(newLen);
      currentSelection = computePlanSelection(level, PLAN_LENGTHS[newLen].items, selOpts);
      paint();
    });
    renderPlanDifficultySelector(document.getElementById('planDifficultySelector'), currentDiff, (newDiff)=>{
      currentDiff = newDiff;
      setPlanDifficulty(newDiff);
      paint();
    });
    container.querySelector('#planDiffToggle').addEventListener('click', ()=>{
      diffPanelOpen = !diffPanelOpen;
      paint();
    });
    container.querySelector('#planStartBtn').addEventListener('click', start);
  }
  function start(){
    const contentLevel = resolvePlanContentLevel(level, currentDiff);
    const pool = buildPlanPool(contentLevel, currentSelection);
    runPlanSessionCore({ container, level, pool, onAnother: ()=> renderPlanIntro(container) });
  }
  // Con ?empezar=1 se arranca directo (o se retoma la sesión a medias,
  // como siempre hace runPlanSessionCore).
  if(opts.autoStart) start(); else paint();
}

/* Pantalla final de Plan de estudio: mismas clases visuales que
   renderSessionSummary (session-summary/summary-score/summary-topics),
   pero con el texto propio que pidió Leo para esta funcion. */
function renderPlanSessionSummary({ correct, graded, total, topics }){
  const scoreText = graded
    ? `${correct} / ${graded} correctas · ${total} ejercicios completados · ${Math.round(correct/graded*100)}% de aciertos`
    : `${total} ejercicios completados`;
  return `
    <div class="session-summary">
      <h2>¡Sesión completada!</h2>
      ${topics.length ? `
        <div class="summary-topics">
          <div class="examples-label">Hoy reforzaste:</div>
          <ul>${topics.map(t=>`<li>${t}</li>`).join('')}</ul>
        </div>` : ''}
      <p class="summary-score">${scoreText}</p>
      <div class="summary-actions">
        <button type="button" class="btn btn-primary" id="planAnotherBtn">Hacer otra sesión</button>
        <a href="miembros.html" class="btn btn-ghost">Volver al dashboard</a>
      </div>
      <p style="color:var(--ink-faint);font-size:0.85rem;margin-top:14px;">Mañana tendrás una nueva recomendación basada en tu progreso.</p>
    </div>`;
}

/* Motor de la sesion: reutiliza renderMixItemInto (el mismo que dibuja
   cada ejercicio en Mixto) y el mismo patron de guardado "a medias"
   (saveInflightSession/loadInflightSession/clearInflightSession) que ya
   usan Mixto/Gramatica/Mis errores, con su propia llave 'plan' para no
   pisar una sesion de Mixto a medias ni viceversa.

   Al terminar: UNA sola llamada a recordSession (una sola sesion real,
   no infla ningun contador ni la racha), pero cada resultado guarda su
   propia skill real (ver PLAN_KIND_TO_SKILL) para que el progreso por
   habilidad, la cobertura del banco y "Mis errores" se actualicen
   exactamente igual que si esos ejercicios se hubieran hecho desde la
   pagina de esa habilidad. */
function runPlanSessionCore({ container, level, pool, onExit, onAnother }){
  stopActiveAudioFile();
  const saved = loadInflightSession('plan', level);
  const useSaved = !!(saved && Array.isArray(saved.pool) && typeof saved.idx === 'number' && saved.idx < saved.pool.length);
  const activePool = useSaved ? saved.pool : pool;
  const total = activePool.length;
  const startedAt = useSaved ? saved.startedAt : Date.now();
  const results = useSaved ? saved.results.slice() : [];
  let idx = useSaved ? saved.idx : 0;

  function renderItem(){
    const entry = activePool[idx];
    saveInflightSession('plan', level, { pool: activePool, idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Plan de estudio · ' + MIX_KIND_LABEL[entry.kind], level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderMixItemInto(card, entry, (isCorrect, extra)=>{
      results.push(Object.assign({ itemId: entry.item.id, isCorrect, skill: PLAN_KIND_TO_SKILL[entry.kind] }, extra || null));
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    });
  }

  function finish(){
    clearInflightSession('plan', level);
    const graded = results.filter(r=> r.isCorrect === true || r.isCorrect === false);
    const correct = graded.filter(r=>r.isCorrect).length;
    const realSkillsUsed = [...new Set(results.map(r=>r.skill))];
    const topics = realSkillsUsed.map(sk => SKILL_LABELS[sk] || sk);
    const focusEntry = activePool.find(e => e.focus && e.focusLabel);
    if(focusEntry) topics.unshift(focusEntry.focusLabel);
    recordSession({ skill:'plan', level, topics, results, startedAt });
    container.innerHTML = renderPlanSessionSummary({ correct, graded: graded.length, total, topics });
    {
      const fe = activePool.find(e => e.focus && e.focusTema) || {};
      appendSessionInsight(container, results, startedAt, 'plan', { focusTema: fe.focusTema || null, focusSkill: fe.kind === 'writing' ? 'writing' : null });
    }
    const anotherBtn = container.querySelector('#planAnotherBtn');
    if(anotherBtn){
      anotherBtn.addEventListener('click', ()=>{
        if(typeof onAnother === 'function') onAnother();
      });
    }
    if(typeof onExit === 'function') onExit();
  }

  renderItem();
}

/* ============================================================
   COMPROBACIÓN DE UN MICROTEMA (solo Miembros, dentro de la página del Plan)
   ------------------------------------------------------------
   Se llega con plan-estudio.html?comprobar=<microtema> (enlace de "Hoy te conviene" y del fin de sesión,
   cuando microDiagActions decide que toca). Es un flujo APARTE de la práctica: no usa corta/media/larga,
   sirve solo ejercicios de GRAMMAR_CHECK_BANK que el alumno no ha visto, no admite "Volver a intentar"
   (mide si generaliza) y se guarda como una sesión skill:'check'. Esa sesión no entra a "Mis errores" ni a
   mistake_stats, no cambia "Continúa donde te quedaste" ni la precisión semanal, y solo mueve la señal del
   microtema (ver applyCheckOutcome). Se puede retomar a medias (leo_inflight_check_<microtema>).
   ============================================================ */
// Prepara la comprobación: la retoma si quedó a medias; si no, elige CHECK_SIZE ejercicios inéditos.
// items = null cuando no se puede: inactivo, sin suficientes inéditos, o todavía no toca (reason 'no-toca').
function microCheckStart(microId){
  const saved = loadInflightSession('check', microId);
  if(saved && Array.isArray(saved.itemIds) && typeof saved.idx === 'number' && saved.idx < saved.itemIds.length){
    const items = saved.itemIds.map(id => checkIndex().byId.get(id)).filter(Boolean);
    if(items.length === saved.itemIds.length) return { items, resumed:true, idx:saved.idx, results:saved.results || [], startedAt:saved.startedAt || Date.now() };
  }
  if(!microIsActive(microId)) return { items:null, reason:'inactivo' };
  if(!checkAvailable(microId)) return { items:null, reason:'sin-ineditos' };
  // Solo se puede EMPEZAR una comprobación cuando el flujo la ofrece (listo-comprobar). Un enlace escrito a mano o
  // viejo no la salta: no se sirve nada, no se marca nada como visto y no se toca la señal del microtema.
  const stat = readJsonKey(MICRO_STATS_KEY, {})[microId];
  if(microFlowState(microId, stat).state !== 'listo-comprobar') return { items:null, reason:'no-toca' };
  const items = pickCheckItems(microId, MICRO_FLOW.CHECK_SIZE);
  if(!items) return { items:null, reason:'sin-ineditos' };
  return { items, resumed:false, idx:0, results:[], startedAt:Date.now() };
}
// Guarda la comprobación terminada (una sesión skill:'check') y devuelve el resultado.
function microCheckFinish(microId, results, startedAt){
  const m = MICRO_BY_ID[microId];
  recordSession({ skill:'check', level:getUserLevel(), topics:[m.label], results, startedAt });
  clearInflightSession('check', microId);
  const ok = results.filter(r => r.isCorrect === true).length, n = results.length;
  return { ok, n, outcome: ok >= n ? 'recuperado' : (ok === n - 1 ? 'mejorando' : 'sigue-debil') };
}
function microCheckLinksHtml(links){
  return `<div class="sess-next">${links.map(a=>`<a href="${a.href}" class="sess-next-link${a.main ? ' is-main' : ''}"><span>${a.title}</span><span aria-hidden="true">→</span></a>`).join('')}</div>`;
}
function renderMicroCheckSummary(m, res){
  const lesson = microLessonHref(m);
  const head = { recuperado:'¡Lo dominas!', mejorando:'Vas mejorando', 'sigue-debil':'Todavía cuesta' }[res.outcome];
  const msg = {
    recuperado: `Acertaste ${res.ok} de ${res.n}. Ya tienes claro <b>${m.label}</b>.`,
    mejorando: `Acertaste ${res.ok} de ${res.n}. Mejoraste, pero todavía no lo damos por dominado. Repasa la explicación y practica un poco más.`,
    'sigue-debil': `Acertaste ${res.ok} de ${res.n}. Este punto todavía no está firme. Lee la explicación y sigue practicándolo.`
  }[res.outcome];
  const links = [];
  if(res.outcome === 'recuperado'){
    links.push({ title:'Volver a mi plan', href:'plan-estudio.html', main:true });
  } else {
    if(lesson) links.push({ title:`Ver la clase: ${m.label}`, href:lesson, main: res.outcome === 'sigue-debil' });
    links.push({ title:`Seguir practicando ${m.label}`, href:microPracticeHref(m, true), main: res.outcome === 'mejorando' || !lesson });
  }
  return `
    <div class="session-summary">
      <div class="examples-label">Comprobación: ${m.label}</div>
      <h2>${head}</h2>
      <p class="summary-score">${msg}</p>
      <p style="color:var(--ink-faint);font-size:0.85rem;">Esta comprobación no cuenta como práctica normal ni como error.</p>
      <div class="sess-insight">${microCheckLinksHtml(links)}</div>
      <div class="summary-actions"><a href="miembros.html" class="btn btn-ghost">Volver al dashboard</a></div>
    </div>`;
}
function renderMicroCheckUnavailable(container, m, reason){
  const lesson = m ? microLessonHref(m) : null;
  const links = [];
  if(m && lesson) links.push({ title:`Ver la clase: ${m.label}`, href:lesson });
  links.push({ title: m ? `Seguir practicando ${m.label}` : 'Ir a mi plan', href: m && microIsActive(m.id) ? microPracticeHref(m, true) : 'plan-estudio.html', main:true });
  container.innerHTML = `
    <div class="session-shell">
      <div class="session-summary">
        <h2>Por ahora no hay comprobación nueva</h2>
        <p class="summary-score">${!m ? 'Esa comprobación no está disponible.' : reason === 'no-toca' ? `Todavía no toca comprobar <b>${m.label}</b>.` : `Ya viste las comprobaciones disponibles de <b>${m.label}</b>.`} Sigue practicando y te avisamos cuando haya algo nuevo.</p>
        <div class="sess-insight">${microCheckLinksHtml(links)}</div>
      </div>
    </div>`;
}
function renderMicroCheck(container, microId){
  if(!container) return;
  stopActiveAudioFile();
  const m = (typeof MICRO_BY_ID !== 'undefined') ? MICRO_BY_ID[microId] : null;
  const start = m ? microCheckStart(microId) : { items:null };
  if(!start.items){ renderMicroCheckUnavailable(container, m, start.reason); return; }
  const level = getUserLevel();
  const items = start.items, total = items.length, startedAt = start.startedAt;
  const results = start.results.slice();
  let idx = start.idx;

  function renderItem(){
    const item = items[idx];
    saveInflightSession('check', microId, { itemIds: items.map(i => i.id), idx, results, startedAt });
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Comprobación', level, idx + 1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderGrammarItemInto(card, item, (isCorrect)=>{
      markChecksConsumed([{ itemId:item.id }]);                  // visto: no vuelve a salir aunque no la termine
      results.push({ itemId:item.id, isCorrect });
      showNextButton(card, idx + 1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      });
    });
  }
  function finish(){
    const res = microCheckFinish(microId, results, startedAt);
    container.innerHTML = renderMicroCheckSummary(m, res);
  }
  if(start.resumed){ renderItem(); return; }
  container.innerHTML = `
    <div class="session-shell">
      <div class="session-summary">
        <div class="examples-label">Comprobación corta</div>
        <h2>¿Ya dominas ${m.label}?</h2>
        <p class="summary-score">Son ${total} ejercicios nuevos, distintos de los que practicaste. Sin repetir intentos: sirve para ver si de verdad lo entendiste.</p>
        <p style="color:var(--ink-faint);font-size:0.85rem;">No cuenta como práctica normal ni como error.</p>
        <div class="summary-actions">
          <button type="button" class="btn btn-primary" id="microCheckStart">Empezar comprobación →</button>
          <a href="plan-estudio.html" class="btn btn-ghost">Ahora no</a>
        </div>
      </div>
    </div>`;
  container.querySelector('#microCheckStart').addEventListener('click', renderItem);
}

/* ============================================================
   MIS ERRORES — repasar lo que se ha fallado (solo Miembros)
   ------------------------------------------------------------
   No se creó ninguna tabla ni columna nueva para esto: se
   reutiliza el historial de sesiones que ya se guarda para el
   progreso (cada resultado es { itemId, isCorrect }). Se recorre
   ese historial en orden y se guarda el ÚLTIMO resultado de cada
   ejercicio que el usuario ya intentó alguna vez. Si ese último
   resultado fue incorrecto, es un "error pendiente". En cuanto lo
   vuelve a responder bien (aquí, en "Practicar mis errores"), ese
   intento nuevo queda como el más reciente y el ejercicio sale de
   la lista solo, sin tener que "borrar" nada aparte.
   Speaking no entra aquí porque nunca se califica automático
   (isCorrect siempre es null en esa habilidad).
   ============================================================ */

// Índice id -> { kind, item } de TODO el contenido calificable
// (gramática, vocabulario, listening, writing) de los 4 niveles.
// Se arma una sola vez y se reutiliza (data.js no cambia mientras
// la página está abierta). Los ids son únicos en todo el archivo,
// así que un solo índice sirve para buscar sin importar el nivel
// o la habilidad con la que se guardó la sesión original.
let _mistakesItemIndexCache = null;
function getMistakesItemIndex(){
  if(_mistakesItemIndexCache) return _mistakesItemIndexCache;
  const index = new Map();
  LEVELS.forEach(level=>{
    GRAMMAR_BANK[level].forEach(variant=>{
      // Gramática sí trae "topic" por grupo de items (ej. "Preguntas con
      // Do/Does en presente simple"). Se guarda en el índice para poder
      // detectar patrones y sugerir un artículo real (ver articleForTopic).
      variant.forEach(topicGroup=> topicGroup.items.forEach(item=> index.set(item.id, { kind:'grammar', item, topic: topicGroup.topic || null })));
    });
    // Vocabulario/listening/writing no traen un "topic" individual hoy.
    // No se inventa: topic queda null para estos.
    VOCAB_BANK[level].forEach(variant=> variant.forEach(item=> index.set(item.id, { kind:'vocab', item, topic:null })));
    LISTENING_BANK[level].forEach(variant=> variant.forEach(item=> index.set(item.id, { kind:'listening', item, topic:null })));
    WRITING_BANK[level].forEach(variant=> variant.forEach(item=> index.set(item.id, { kind:'writing', item, topic:null })));
  });
  _mistakesItemIndexCache = index;
  return index;
}

// ids de ejercicios cuyo intento más reciente fue incorrecto, del
// más reciente al más antiguo (para repasar primero lo más fresco).
function computeMistakeIds(){
  const p = loadProgress();
  const latest = new Map(); // itemId -> { isCorrect, when }
  p.sessions.forEach(s=>{
    (s.results || []).forEach(r=>{
      if(r.isCorrect !== true && r.isCorrect !== false) return; // sin calificar, se ignora
      if(isCheckItem(r.itemId)) return;   // la comprobación nunca entra a "Mis errores"
      latest.set(r.itemId, { isCorrect: r.isCorrect, when: s.startedAt || 0 });
    });
  });
  const wrong = [];
  latest.forEach((v, id)=>{ if(v.isCorrect === false) wrong.push({ id, when: v.when }); });
  wrong.sort((a,b)=> b.when - a.when);
  return wrong.map(w=>w.id);
}

function buildMistakePool(maxItems){
  maxItems = maxItems || 20;
  const index = getMistakesItemIndex();
  const ids = computeMistakeIds();
  const pool = [];
  for(let i=0; i<ids.length && pool.length<maxItems; i++){
    const found = index.get(ids[i]);
    if(found) pool.push({ kind: found.kind, item: found.item }); // mismo formato que pickMixItems
  }
  return pool;
}

// Cuenta, por habilidad, cuántos errores pendientes hay ahora mismo
// (grammar/vocab/listening/writing; Speaking nunca aparece aquí porque
// nunca se califica automático). Son conteos reales, no inventados:
// mismo origen de datos que buildMistakePool().
function computeMistakeCountsByKind(){
  const index = getMistakesItemIndex();
  const counts = { grammar:0, vocab:0, listening:0, writing:0 };
  computeMistakeIds().forEach(id=>{
    const found = index.get(id);
    if(found && counts.hasOwnProperty(found.kind)) counts[found.kind]++;
  });
  return counts;
}

/* ============================================================
   REPASO PERSONAL 2.0 — activo / recuperado / dominado
   ------------------------------------------------------------
   Capa nueva sobre lo de arriba. Antes, "error" era solo "el
   último intento de este ejercicio salió mal", recalculado
   siempre desde cero recorriendo TODO el historial. Ahora se usa
   la tabla mistake_stats (Supabase, aditiva, ver supabase_schema.sql)
   que guarda por ejercicio fallado: cuántas veces se falló, cuántos
   aciertos seguidos lleva, y su estado. Un fallo SIEMPRE reactiva a
   "active" sin importar el estado anterior; el historial nunca se
   borra, solo se actualiza.

   Si Supabase no está disponible (sin backend, sin sesión, o un
   error temporal de red), todo cae de vuelta al método viejo
   (computeMistakeIds/buildMistakePool) para que la sección nunca
   se rompa ni muestre "0 errores" por una falla de conexión.
   ============================================================ */

// Pesos y umbrales centralizados (nada de números sueltos por el código).
// El estado activo/recuperado/dominado (2 y 4 aciertos seguidos) lo decide
// únicamente apply_mistake_results() en supabase_schema.sql: esa es la
// única fuente de verdad para esos umbrales, nada acá los usa ni los repite.
const MISTAKE_PRIORITY = {
  QUICK_REVIEW_SIZE: 10,
  MAX_IDLE_DAYS: 14,
  WEIGHT_FAIL_COUNT: 2,
  WEIGHT_IDLE_DAY: 1,
  WEIGHT_CORRECT_STREAK_PENALTY: 1.5
};

// Concepto (topic real de GRAMMAR_BANK) -> artículo real que ya existe en
// el sitio. Curado a mano, solo con topics que sí existen tal cual en
// data.js y artículos que sí existen. No se inventan URLs ni se agregan
// temas nuevos: si un concepto no está aquí, simplemente no se sugiere
// artículo (mejor no sugerir que sugerir mal).
// Artículo (clase) real de una etiqueta de ejercicio: SIEMPRE desde el registro
// de temas (temas.js). Sin registro o sin clase, null: mejor no sugerir que sugerir mal.
function articleForTopic(topic){
  if(typeof temaForTopic !== 'function') return null;
  const t = temaForTopic(topic);
  return t && t.article ? t.article : null;
}
const ARTICLE_TITLE_BY_HREF = {
  'articulo-do-vs-does.html': 'Do vs Does',
  'articulo-presente-simple.html': 'Presente simple',
  'articulo-verbo-to-be.html': 'Verbo to be',
  'articulo-pasado-simple.html': 'Pasado simple',
  'articulo-presente-perfecto.html': 'Presente perfecto',
  'articulo-phrasal-verbs.html': 'Phrasal verbs',
  'articulo-numeros-en-ingles.html': 'Números en inglés',
  'articulo-in-on-at.html': 'In, on, at',
  'articulo-verbos-irregulares.html': 'Verbos irregulares',
  'articulo-vocabulario-basico.html': 'Vocabulario básico'
};

/* ---------- Mapa de contenido: debilidad -> contenido real ----------
   Un solo lugar para saber a dónde llevar al alumno según lo que le
   cuesta. Solo usa contenido que existe hoy: los artículos de cada
   familia (DIAG_GRAMMAR_FAMILIES[].article), las páginas de cada
   habilidad (SKILL_PAGE) y el Plan de estudio con foco en una familia
   (?foco=, ver renderPlanIntro). Si algo no tiene artículo, no se
   sugiere ninguno. */
const SKILL_ARTICLE = { vocabulario:'articulo-vocabulario-basico.html' };
function planFocusHref(familyId, start, temaId){
  return 'plan-estudio.html?foco=' + encodeURIComponent(familyId) + (temaId ? '&tema=' + encodeURIComponent(temaId) : '') + (start ? '&empezar=1' : '');
}
// ¿Hay ejercicios de esa familia en ese nivel? (para no mandar a un
// "refuerzo" vacío).
function familyHasItemsAt(familyId, level){
  if(typeof GRAMMAR_BANK === 'undefined' || !GRAMMAR_BANK[level]) return false;
  return GRAMMAR_BANK[level].some(variant => variant.some(group=>{
    const fam = diagFamilyForTopic(group.topic);
    return fam && fam.id === familyId && group.items.length > 0;
  }));
}
/* ---------- Temas de gramática (registro central: temas.js) ----------
   Un tema es más fino que una familia (ej. "Verbos irregulares" dentro de
   "Pasado simple"). Si temas.js no está cargado en la página, todo lo de
   abajo se apaga y el sitio sigue funcionando por familias, como antes. */
// Tema de vocabulario de una palabra (por el grupo de su id) y tema de cualquier ejercicio del índice.
function vocabTemaIdForItem(itemId){
  if(typeof temaForVocabItem !== 'function') return null;
  const t = temaForVocabItem(itemId);
  return t ? t.id : null;
}
function listeningTemaIdForItem(itemId){
  if(typeof temaForListeningItem !== 'function') return null;
  const t = temaForListeningItem(itemId);
  return t ? t.id : null;
}
function writingTemaIdForItem(itemId){
  if(typeof temaForWritingItem !== 'function') return null;
  const t = temaForWritingItem(itemId);
  return t ? t.id : null;
}
// Una respuesta de una palabra o vacía no dice nada del tema (la página ya pide "una frase completa").
const writingLowEffort = text => String(text || '').trim().split(/\s+/).filter(Boolean).length < 2;
function diagTemaIdForFound(found){
  if(!found) return null;
  if(found.kind === 'writing') return writingTemaIdForItem(found.item && found.item.id);
  if(found.kind === 'vocab') return vocabTemaIdForItem(found.item && found.item.id);
  if(found.kind === 'listening') return listeningTemaIdForItem(found.item && found.item.id);
  return diagTemaIdForTopic(found.topic);
}
// Habilidades (no gramática) que ya tienen temas propios en temas.js.
const TEMA_SKILL_KEY = { vocabulary:'vocabulario', listening:'listening' };
function diagTemaIdForTopic(topic){
  if(typeof temaForTopic !== 'function') return null;
  const t = temaForTopic(topic);
  return t ? t.id : null;
}
// ¿Hay ejercicios de ese tema en ese nivel? (para no mandar a un refuerzo vacío).
function temaHasItemsAt(temaId, level, skill){
  if(skill === 'writing'){
    if(typeof WRITING_BANK === 'undefined' || !WRITING_BANK[level]) return false;
    return WRITING_BANK[level].some(variant => variant.some(it => writingTemaIdForItem(it.id) === temaId));
  }
  const tt = (typeof TEMA_BY_ID !== 'undefined') ? TEMA_BY_ID[temaId] : null;
  if(tt && TEMA_SKILL_KEY[tt.skill]){
    const isVocab = tt.skill === 'vocabulary';
    const bank = isVocab ? (typeof VOCAB_BANK === 'undefined' ? null : VOCAB_BANK) : (typeof LISTENING_BANK === 'undefined' ? null : LISTENING_BANK);
    if(!bank || !bank[level]) return false;
    const idOf = isVocab ? vocabTemaIdForItem : listeningTemaIdForItem;
    return bank[level].some(variant => variant.some(it => idOf(it.id) === temaId));
  }
  if(typeof GRAMMAR_BANK === 'undefined' || !GRAMMAR_BANK[level] || typeof temaForTopic !== 'function') return false;
  return GRAMMAR_BANK[level].some(variant => variant.some(group=>{
    const t = temaForTopic(group.topic);
    return !!t && t.id === temaId && group.items.length > 0;
  }));
}
// Un solo recurso real por tema para la acción secundaria: la clase completa
// si existe; si no, la explicación rápida del glosario; si no, nada.
// { id, label, family, practiceHref, practiceLabel, lesson, quick, article,
//   articleTitle, articleLabel } o null.
// Práctica enfocada en un tema desde el Plan: gramática = ?foco=<familia>&tema=; vocabulario = ?tema=.
function temaPlanHref(t, start, skill){
  if(skill === 'writing') return 'plan-estudio.html?habilidad=writing&tema=' + encodeURIComponent(t.id) + (start ? '&empezar=1' : '');
  return TEMA_SKILL_KEY[t.skill] ? 'plan-estudio.html?tema=' + encodeURIComponent(t.id) + (start ? '&empezar=1' : '') : planFocusHref(t.family, start, t.id);
}
function contentForTema(id, onlySkill){
  if(typeof TEMA_BY_ID === 'undefined') return null;
  const t = TEMA_BY_ID[id];
  if(!t) return null;
  const level = getUserLevel();
  // Práctica de ESTE tema pero en Writing (mismo topic_id, otra habilidad).
  const asWriting = onlySkill === 'writing';
  const skillKey = asWriting ? 'writing' : (TEMA_SKILL_KEY[t.skill] || null);      // 'vocabulario' | 'listening' | 'writing' | null (gramática)
  const practiceHref = asWriting ? (temaHasItemsAt(id, level, 'writing') ? temaPlanHref(t, true, 'writing') : SKILL_PAGE.writing)
    : skillKey ? (temaHasItemsAt(id, level) ? temaPlanHref(t, true) : SKILL_PAGE[skillKey])
    : !t.family ? 'gramatica.html'
    : temaHasItemsAt(id, level) ? planFocusHref(t.family, true, id)
    : familyHasItemsAt(t.family, level) ? planFocusHref(t.family, true)
    : 'gramatica.html';
  // ?tema=&via=rec: la clase o el glosario saben que el sistema lo recomendó (y para qué tema).
  const via = '?tema=' + encodeURIComponent(t.id) + '&via=rec';
  const lesson = t.article ? { href: t.article + via, title: ARTICLE_TITLE_BY_HREF[t.article] || t.label } : null;
  const quick = (!lesson && t.glossary) ? { href: '/glosario/' + t.glossary + '/' + via, title: t.label } : null;
  return {
    id: t.id, label: t.label, family: t.family, skill: skillKey || 'gramatica',
    unitKey: skillKey ? 'skill:' + skillKey : (t.family ? 'family:' + t.family : null),
    practiceHref, practiceLabel: `Practicar ${t.label}`,
    lesson, quick,
    article: lesson ? lesson.href : (quick ? quick.href : null),
    articleTitle: lesson ? lesson.title : (quick ? quick.title : null),
    articleLabel: lesson ? 'Ver la clase' : (quick ? 'Ver explicación rápida' : null)
  };
}

// Las dos únicas acciones que se muestran de un tema: practicar + (clase o,
// si no hay clase, explicación rápida). Texto de la segunda: "Ver la clase" /
// "Ver explicación rápida". Todo sale de contentForTema (registro).
function temaLinksHtml(c, practiceText){
  if(!c) return '';
  return `<a href="${c.practiceHref}">${practiceText || 'Practicar'}</a>` + (c.article ? `<a href="${c.article}">${c.articleLabel}</a>` : '');
}
// Tema con más errores dentro de una lista de { tema, failCount }.
function dominantTema(list){
  const by = new Map();
  list.forEach(m=>{ if(!m.tema) return; const e = by.get(m.tema) || { id:m.tema, count:0, repeated:0 }; e.count++; if(m.failCount >= 2) e.repeated++; by.set(m.tema, e); });
  return Array.from(by.values()).sort((a,b)=> (b.count - a.count) || (b.repeated - a.repeated))[0] || null;
}

// { label, practiceHref, practiceLabel, article, articleTitle } o null.
// type: 'family' (familia de gramática) | 'skill' (gramatica, listening...).
function contentForUnit(type, id){
  if(type === 'family'){
    const fam = DIAG_FAMILY_BY_ID[id];
    if(!fam) return null;
    const hasPractice = familyHasItemsAt(id, getUserLevel());
    return {
      label: fam.label,
      practiceHref: hasPractice ? planFocusHref(id, true) : 'gramatica.html',
      practiceLabel: `Practicar ${fam.label}`,
      article: fam.article || null,
      articleTitle: fam.article ? (ARTICLE_TITLE_BY_HREF[fam.article] || fam.label) : null
    };
  }
  if(!SKILL_PAGE[id]) return null;
  const article = SKILL_ARTICLE[id] || null;
  return {
    label: SKILL_LABELS[id],
    practiceHref: SKILL_PAGE[id],
    practiceLabel: `Practicar ${SKILL_LABELS[id]}`,
    article,
    articleTitle: article ? ARTICLE_TITLE_BY_HREF[article] : null
  };
}

// _mistakeStatsCache: undefined = todavía no se intentó cargar,
// null = se intentó y falló (usar respaldo viejo), Map = cargado bien.
let _mistakeStatsCache;
async function loadMistakeStatsMap(forceReload){
  if(forceReload) _mistakeStatsCache = undefined;
  if(_mistakeStatsCache !== undefined) return _mistakeStatsCache;
  if(typeof LeoBackend === 'undefined' || !LeoBackend.isConfigured()){ _mistakeStatsCache = null; return null; }
  try{
    const rows = await LeoBackend.getMistakeStats();
    if(rows === null){ _mistakeStatsCache = null; return null; } // fallo real: usar respaldo viejo
    const map = new Map();
    rows.forEach(r => map.set(r.item_id, r));
    _mistakeStatsCache = map;
  }catch(e){ _mistakeStatsCache = null; }
  return _mistakeStatsCache;
}

// Migración de una sola vez por navegador: la primera vez que alguien
// con errores viejos (calculados con el método anterior) abre el panel
// después de este cambio, se siembra mistake_stats con esos errores como
// "active" (fail_count:1), para no perder de vista lo que ya tenía
// pendiente. No borra ni inventa nada: usa exactamente lo que
// computeMistakeIds() ya sabía. Si falla (sin red), se reintenta en la
// próxima visita, no se marca como hecho.
const MISTAKE_BACKFILL_KEY = 'leo_mistake_backfill_v1_done';
async function backfillMistakeStatsIfNeeded(){
  try{ if(localStorage.getItem(MISTAKE_BACKFILL_KEY)) return; }catch(e){ return; }
  const statsMap = await loadMistakeStatsMap();
  if(statsMap === null) return; // sin backend o falla de red: se reintenta despues
  if(statsMap.size > 0){ try{ localStorage.setItem(MISTAKE_BACKFILL_KEY, '1'); }catch(e){} return; }
  const legacyIds = computeMistakeIds();
  if(!legacyIds.length){ try{ localStorage.setItem(MISTAKE_BACKFILL_KEY, '1'); }catch(e){} return; }
  const index = getMistakesItemIndex();
  const items = [];
  legacyIds.forEach(id=>{
    const found = index.get(id);
    if(found) items.push({ item_id:id, kind:found.kind, topic:found.topic || null, is_correct:false });
  });
  if(items.length){
    if(typeof LeoBackend === 'undefined') return;
    let result;
    try{ result = await LeoBackend.applyMistakeResults(items); }catch(e){ return; }
    if(!result || !result.ok) return; // fallo real: no marcar como hecho, reintentar en la próxima visita
  }
  try{ localStorage.setItem(MISTAKE_BACKFILL_KEY, '1'); }catch(e){}
  await loadMistakeStatsMap(true); // recargar con lo recien sembrado
}

// Se llama desde recordSession() cada vez que termina cualquier sesión
// calificable. Una sola llamada agrupada por sesión (nunca una por
// ejercicio), con los kind/topic ya resueltos localmente.
function updateMistakeStatsFromResults(results){
  if(!results || !results.length) return;
  if(typeof LeoBackend === 'undefined' || !LeoBackend.isConfigured()) return;
  const index = getMistakesItemIndex();
  const items = [];
  results.forEach(r=>{
    if(r.isCorrect !== true && r.isCorrect !== false) return; // sin calificar (ej. speaking): se ignora
    const found = index.get(r.itemId);
    if(!found) return; // no indexado
    items.push({ item_id:r.itemId, kind:found.kind, topic:found.topic || null, is_correct:r.isCorrect });
  });
  if(!items.length) return;
  LeoBackend.applyMistakeResults(items).then(()=>{ _mistakeStatsCache = undefined; }).catch(()=>{});
}

function computeActiveMistakesFromStats(statsMap){
  const out = [];
  statsMap.forEach(s => { if(s.status === 'active') out.push(s); });
  return out;
}

function mistakeScore(stat){
  const idleDays = Math.min(MISTAKE_PRIORITY.MAX_IDLE_DAYS, daysSinceDateStr(localDateStr(new Date(stat.last_seen_at))) || 0);
  return (stat.fail_count || 0) * MISTAKE_PRIORITY.WEIGHT_FAIL_COUNT
       + idleDays * MISTAKE_PRIORITY.WEIGHT_IDLE_DAY
       - (stat.correct_streak || 0) * MISTAKE_PRIORITY.WEIGHT_CORRECT_STREAK_PENALTY;
}

// Cuántos errores se recuperaron/dominaron en los últimos 7 días, para
// la señal positiva de la tarjeta ("Esta semana recuperaste N errores").
function countRecoveredLast7Days(statsMap){
  const cutoff = Date.now() - 7*86400000;
  let n = 0;
  statsMap.forEach(s=>{ if(s.recovered_at && new Date(s.recovered_at).getTime() >= cutoff) n++; });
  return n;
}

// Construye el pool de una sesión de repaso.
//   mode: 'rapido' (hasta 10, priorizados) | undefined (hasta 20, más reciente primero)
//   skillFilter: 'grammar'|'vocab'|'listening'|'writing' (opcional)
// Devuelve { pool, topStat, usedFallback } — topStat es la entrada de
// mayor prioridad (para la sugerencia de artículo), null si no aplica.
async function buildMistakeReviewPool({ mode, skillFilter } = {}){
  await backfillMistakeStatsIfNeeded();
  const statsMap = await loadMistakeStatsMap();
  const index = getMistakesItemIndex();
  const maxItems = mode === 'rapido' ? MISTAKE_PRIORITY.QUICK_REVIEW_SIZE : 20;

  if(statsMap === null){
    // Respaldo: método viejo, sigue siendo correcto, solo no tiene
    // fail_count/estado. No se le puede aplicar skillFilter por kind
    // real sin el índice, así que sí se puede (el índice ya trae kind).
    const ids = computeMistakeIds();
    const pool = [];
    for(let i=0; i<ids.length && pool.length<maxItems; i++){
      const found = index.get(ids[i]);
      if(found && (!skillFilter || found.kind === skillFilter)) pool.push({ kind:found.kind, item:found.item });
    }
    return { pool, topStat:null, usedFallback:true };
  }

  let actives = computeActiveMistakesFromStats(statsMap);
  if(skillFilter) actives = actives.filter(s => s.kind === skillFilter);
  actives = mode === 'rapido'
    ? actives.slice().sort((a,b) => mistakeScore(b) - mistakeScore(a))
    : actives.slice().sort((a,b) => new Date(b.last_seen_at) - new Date(a.last_seen_at));
  const top = actives.slice(0, maxItems);
  const pool = [];
  top.forEach(s=>{
    const found = index.get(s.item_id);
    if(found) pool.push({ kind:found.kind, item:found.item });
  });
  return { pool, topStat: top[0] || null, usedFallback:false };
}

// Banner "Tus errores frecuentes" del panel de miembros. Si no hay
// errores activos, se oculta la sección entera (no se inventa un
// mensaje de "0 errores"). chipsEl (opcional) son ahora links directos
// a repasar esa habilidad. noteEl (opcional) muestra la señal positiva
// semanal de errores recuperados.
async function renderMistakesBanner(sectionEl, textEl, chipsEl, noteEl){
  if(!sectionEl) return;
  const topGrid = sectionEl.closest('.dash-top-grid');
  // Importante: el sembrado de errores viejos tiene que intentarse SIEMPRE
  // antes de leer, no solo cuando la tabla nueva falla. La primera vez que
  // alguien con errores viejos abre el panel, mistake_stats existe pero
  // está vacía (0 filas, sin error) — hay que sembrarla, no solo caer al
  // método viejo.
  await backfillMistakeStatsIfNeeded();
  const statsMap = await loadMistakeStatsMap();
  let count, countsByKind, recoveredCount = 0;
  if(statsMap === null){
    count = computeMistakeIds().length;
    countsByKind = computeMistakeCountsByKind();
  } else {
    const actives = computeActiveMistakesFromStats(statsMap);
    count = actives.length;
    countsByKind = { grammar:0, vocab:0, listening:0, writing:0 };
    actives.forEach(s => { if(countsByKind.hasOwnProperty(s.kind)) countsByKind[s.kind]++; });
    recoveredCount = countRecoveredLast7Days(statsMap);
  }
  if(!count){
    sectionEl.style.display = 'none';
    if(topGrid) topGrid.classList.add('no-mistakes');
    return;
  }
  sectionEl.style.display = '';
  if(topGrid) topGrid.classList.remove('no-mistakes');
  if(textEl){
    textEl.innerHTML = count === 1
      ? '<span class="mistakes-count">1 ejercicio</span> para reforzar.'
      : `<span class="mistakes-count">${count} ejercicios</span> para reforzar.`;
  }
  if(chipsEl){
    chipsEl.innerHTML = ['grammar','vocab','listening','writing']
      .filter(kind => countsByKind[kind] > 0)
      .map(kind => `<a href="errores.html?skill=${kind}" class="mistakes-chip">${MIX_KIND_LABEL[kind]} <b>${countsByKind[kind]}</b></a>`)
      .join('');
  }
  if(noteEl){
    if(recoveredCount > 0){
      noteEl.textContent = recoveredCount === 1
        ? 'Esta semana recuperaste 1 error.'
        : `Esta semana recuperaste ${recoveredCount} errores.`;
      noteEl.style.display = '';
    } else {
      noteEl.style.display = 'none';
    }
  }
}

async function runMistakesSessionCore({ container, mode, skillFilter }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const sessionLevel = skillFilter ? ('skill-' + skillFilter) : (mode === 'rapido' ? 'rapido' : 'todos');
  const sessionLabel = skillFilter ? `Repaso: ${MIX_KIND_LABEL[skillFilter]}` : (mode === 'rapido' ? 'Repaso rápido' : 'Repaso de errores');
  const saved = loadInflightSession('errores', sessionLevel);
  const useSaved = !!(saved && Array.isArray(saved.pool) && typeof saved.idx === 'number' && saved.idx < saved.pool.length);

  let pool, topStat = null;
  if(useSaved){
    pool = saved.pool;
  } else {
    const built = await buildMistakeReviewPool({ mode, skillFilter });
    pool = built.pool;
    topStat = built.topStat;
  }
  const total = pool.length;

  if(!total){
    clearInflightSession('errores', sessionLevel);
    container.innerHTML = `
      <div class="session-summary">
        <h2>¡Vas muy bien!</h2>
        <p class="summary-score">No tienes errores pendientes por repasar ahora mismo.</p>
        <div class="summary-actions">
          <a href="miembros.html" class="btn btn-primary">Volver a tu panel</a>
          <a href="plan-estudio.html" class="btn btn-ghost">Hacer tu plan de estudio</a>
        </div>
      </div>`;
    return;
  }

  const startedAt = useSaved ? saved.startedAt : Date.now();
  const results = useSaved ? saved.results.slice() : [];
  let idx = useSaved ? saved.idx : 0;

  // Sugerencia de artículo: solo al empezar una sesión nueva (no al
  // reanudar), solo gramática, y solo si ese error ya se repitió más
  // de una vez (no se sugiere un artículo por un fallo aislado).
  const articleHref = (!useSaved && topStat && topStat.kind === 'grammar' && topStat.fail_count >= 2 && topStat.topic)
    ? articleForTopic(topStat.topic) : null;
  const articleBanner = articleHref
    ? `<div class="mistakes-article-hint">Tu prioridad: <b>${ARTICLE_TITLE_BY_HREF[articleHref] || topStat.topic}</b>. <a href="${articleHref}">¿Quieres repasarlo primero? →</a></div>`
    : '';

  function renderItem(){
    const entry = pool[idx];
    saveInflightSession('errores', sessionLevel, { pool, idx, results, startedAt });
    const pct = Math.round(((idx+1)/total)*100);
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      ${idx === 0 ? articleBanner : ''}
      <div class="session-head">
        <span class="practice-level-tag">${sessionLabel} · ${MIX_KIND_LABEL[entry.kind]}</span>
        <span class="session-count">Ejercicio ${idx+1} de ${total}</span>
      </div>
      <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>`;
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderMixItemInto(card, entry, (isCorrect, extra)=>{
      results.push(Object.assign({ itemId: entry.item.id, isCorrect }, extra || null));
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    });
  }

  function finish(){
    clearInflightSession('errores', sessionLevel);
    recordSession({ skill:'errores', level:'todos', topics:[sessionLabel], results, startedAt });
    const graded = results.filter(r=> r.isCorrect === true || r.isCorrect === false);
    const correct = graded.filter(r=>r.isCorrect).length;
    const wrongAgain = graded.length - correct;
    const score = graded.length ? `${correct} / ${graded.length} correctas` : `${total} ejercicios completados`;
    container.innerHTML = renderSessionSummary({ title:'¡Listo!', score, topics: [sessionLabel] });
    if(graded.length){
      const scoreEl = container.querySelector('.summary-score');
      if(scoreEl){
        const extra = document.createElement('p');
        extra.className = 'summary-extra';
        extra.textContent = `${correct} correcto${correct===1?'':'s'}${wrongAgain ? `, ${wrongAgain} necesita${wrongAgain===1?'':'n'} más práctica` : ''}.`;
        scoreEl.insertAdjacentElement('afterend', extra);
      }
    }
    wireSummaryButtons(container, ()=> runMistakesSessionCore({ container, mode, skillFilter }));
    appendSessionInsight(container, results, startedAt, 'errores');
  }

  renderItem();
}
function runMistakesSession({ container, mode, skillFilter }){
  runMistakesSessionCore({ container, mode, skillFilter });
}

/* ============================================================
   RETO DIARIO — 5 ejercicios mezclados para tener una razón
   concreta de volver cada día.
   ------------------------------------------------------------
   - Practicar gratis (sin cuenta): 1 reto al día, guardado en el
     navegador de esa persona (no hay cuenta con la que guardarlo
     en la nube). Al terminarlo, queda bloqueado hasta el día
     siguiente (con una invitación a hacerse miembro para
     repetirlo).
   - Miembros: sin límite de repeticiones al día, cada vez con una
     mezcla nueva de 5 ejercicios. Usa el mismo guardado de "no
     perder el progreso al refrescar" que ya usan Mixto y Mis
     errores (loadInflightSession / saveInflightSession), y cada
     reto terminado se registra como una sesión normal (cuenta
     para la racha y las estadísticas ya existentes).
   ============================================================ */
const DAILY_CHALLENGE_FREE_KEY = 'leo_daily_challenge_free';

function todayStr(){ return localDateStr(); }

function getDailyChallengeFreeStatus(){
  try{
    const raw = localStorage.getItem(DAILY_CHALLENGE_FREE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return (saved && saved.date === todayStr()) ? saved : null;
  }catch(e){ return null; }
}
function markDailyChallengeFreeDone(score){
  try{ localStorage.setItem(DAILY_CHALLENGE_FREE_KEY, JSON.stringify({ date: todayStr(), done:true, score })); }catch(e){}
}

// Arma los 5 ejercicios del reto: uno de Gramática, uno de
// Vocabulario, uno de Listening, uno de Writing, y un quinto extra
// de Gramática o Vocabulario (los bancos con más contenido). Reusa
// pickVariantIndex igual que Mixto, así que en el modo gratis nunca
// puede tocar una variante exclusiva de Miembros.
function pickDailyChallengeItems(level, isFree){
  function sample(arr, n){
    const copy = arr.slice();
    for(let i=copy.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
    return copy.slice(0, Math.min(n, copy.length));
  }

  const gVariantIdx = pickVariantIndex('gramatica', level, GRAMMAR_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.gramatica[level] : undefined);
  const gPool = [];
  GRAMMAR_BANK[level][gVariantIdx].forEach(t=> t.items.forEach(it=> gPool.push(it)));

  const vVariantIdx = pickVariantIndex('vocabulario', level, VOCAB_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.vocabulario[level] : undefined);
  const vPool = VOCAB_BANK[level][vVariantIdx];

  const lVariantIdx = pickVariantIndex('listening', level, LISTENING_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.listening[level] : undefined);
  const lPool = LISTENING_BANK[level][lVariantIdx];

  const wVariantIdx = pickVariantIndex('writing', level, WRITING_BANK[level].length, isFree ? MEMBERS_ONLY_VARIANT_INDEX.writing[level] : undefined);
  const wPool = WRITING_BANK[level][wVariantIdx];

  const picks = [
    { kind:'grammar', item: sample(gPool,1)[0] },
    { kind:'vocab', item: sample(vPool,1)[0] },
    { kind:'listening', item: sample(lPool,1)[0] },
    { kind:'writing', item: sample(wPool,1)[0] }
  ];
  const extraPool = gPool.filter(it=> it.id !== picks[0].item.id).map(it=>({ kind:'grammar', item:it }))
    .concat(vPool.filter(it=> it.id !== picks[1].item.id).map(it=>({ kind:'vocab', item:it })));
  picks.push(sample(extraPool,1)[0]);

  for(let i=picks.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [picks[i],picks[j]]=[picks[j],picks[i]]; }
  return picks;
}

function renderDailyChallengeIntro(container, { isFree, doneState, inProgress, onStart }){
  if(doneState){
    const scoreTxt = doneState.score ? `${doneState.score.correct} / ${doneState.score.total} correctas` : '';
    container.innerHTML = `
      <p class="daily-done-msg">${OK_ICON} Ya hiciste tu reto de hoy${scoreTxt ? ' · ' + scoreTxt : ''}.</p>
      <p class="daily-sub">Vuelve mañana para el siguiente, o hazte miembro para repetirlo las veces que quieras.</p>
      <a href="miembros.html" class="daily-btn">Hazte miembro →</a>`;
    return;
  }
  // Si ya había un reto a medias (guardado con saveInflightSession),
  // antes esta tarjeta saltaba directo al ejercicio a medio terminar
  // en cuanto se cargaba el panel. Leo pidió que el panel nunca
  // muestre el ejercicio de una vez: siempre se ve esta tarjeta
  // compacta primero, y el ejercicio (nuevo o retomado) solo aparece
  // al darle clic al botón.
  if(inProgress){
    container.innerHTML = `
      <p class="daily-sub">Tienes un reto a medias. Sigue justo donde te quedaste.</p>
      <button type="button" class="daily-btn" id="dailyStartBtn">Continuar reto diario →</button>`;
    const btn = container.querySelector('#dailyStartBtn');
    if(btn) btn.addEventListener('click', onStart);
    return;
  }
  container.innerHTML = `
    <p class="daily-sub">Gramática, vocabulario, listening y writing.</p>
    <button type="button" class="daily-btn" id="dailyStartBtn">Empezar reto diario →</button>`;
  const btn = container.querySelector('#dailyStartBtn');
  if(btn) btn.addEventListener('click', onStart);
}

function runDailyChallengeSession({ container, isFree, level }){
  level = level || getUserLevel();
  const saved = !isFree ? loadInflightSession('reto-diario', level) : null;
  const useSaved = !!(saved && Array.isArray(saved.pool) && typeof saved.idx === 'number' && saved.idx < saved.pool.length);
  const pool = useSaved ? saved.pool : pickDailyChallengeItems(level, isFree);
  const total = pool.length;
  const startedAt = useSaved ? saved.startedAt : Date.now();
  const results = useSaved ? saved.results.slice() : [];
  let idx = useSaved ? saved.idx : 0;

  function renderItem(){
    const entry = pool[idx];
    if(!isFree) saveInflightSession('reto-diario', level, { pool, idx, results, startedAt });
    const pct = Math.round(((idx+1)/total)*100);
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="session-head">
        <span class="practice-level-tag">Reto diario · ${MIX_KIND_LABEL[entry.kind]}</span>
        <span class="session-count">Ejercicio ${idx+1} de ${total}</span>
      </div>
      <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>`;
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderMixItemInto(card, entry, (isCorrect, extra)=>{
      results.push(Object.assign({ itemId: entry.item.id, isCorrect }, extra || null));
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    });
  }

  function finish(){
    const graded = results.filter(r=> r.isCorrect === true || r.isCorrect === false);
    const correct = graded.filter(r=>r.isCorrect).length;
    const score = { correct, total: graded.length };
    if(isFree){
      markDailyChallengeFreeDone(score);
      container.innerHTML = `
        <div class="session-summary" style="padding:0;">
          <h2>¡Reto completado!</h2>
          <p class="summary-score">${correct} / ${graded.length} correctas</p>
          <p class="daily-sub" style="margin-top:10px;">Vuelve mañana para el siguiente reto, o hazte miembro para repetirlo las veces que quieras hoy mismo.</p>
          <div class="summary-actions">
            <a href="miembros.html" class="btn btn-primary">Hazte miembro →</a>
          </div>
        </div>`;
    } else {
      clearInflightSession('reto-diario', level);
      recordSession({ skill:'reto-diario', level, topics:['Reto diario'], results, startedAt });
      container.innerHTML = `
        <div class="session-summary" style="padding:0;">
          <h2>¡Reto completado!</h2>
          <p class="summary-score">${correct} / ${graded.length} correctas</p>
          <div class="summary-actions">
            <button type="button" class="btn btn-primary" id="dailyAgainBtn">Hacer otro reto →</button>
          </div>
        </div>`;
      const again = container.querySelector('#dailyAgainBtn');
      if(again) again.addEventListener('click', ()=> runDailyChallengeSession({ container, isFree:false, level }));
    }
  }

  renderItem();
}

// Punto de entrada único para ambas páginas (practica.html y
// miembros.html): decide solo si mostrar la intro, el aviso de "ya
// lo hiciste hoy" (solo gratis) o retomar un reto a medias (solo
// Miembros), y arranca la sesión cuando corresponda.
function setDailyChallengeCardAction(card, onStart){
  if(!card) return;
  card._dailyChallengeOnStart = onStart || null;
  card.classList.toggle('daily-card--clickable', !!onStart);

  if(onStart){
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Empezar reto diario');
  } else {
    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-label');
  }

  if(card._dailyChallengeCardWired) return;
  card._dailyChallengeCardWired = true;
  const startFromCard = (event)=>{
    // Los controles dentro de la tarjeta mantienen su comportamiento
    // propio y evitan disparar el inicio dos veces.
    if(event.target.closest('button, a, input, select, textarea, label')) return;
    if(card._dailyChallengeOnStart) card._dailyChallengeOnStart();
  };
  card.addEventListener('click', startFromCard);
  card.addEventListener('keydown', (event)=>{
    if(event.key !== 'Enter' && event.key !== ' ') return;
    if(event.target !== card || !card._dailyChallengeOnStart) return;
    event.preventDefault();
    card._dailyChallengeOnStart();
  });
}

function initDailyChallenge(container, { isFree, card }){
  if(!container) return;
  if(isFree){
    const status = getDailyChallengeFreeStatus();
    if(status && status.done){
      setDailyChallengeCardAction(card, null);
      renderDailyChallengeIntro(container, { isFree:true, doneState: status });
      return;
    }
    const startChallenge = ()=>{
      setDailyChallengeCardAction(card, null);
      runDailyChallengeSession({ container, isFree:true });
    };
    setDailyChallengeCardAction(card, startChallenge);
    renderDailyChallengeIntro(container, { isFree:true, doneState:null, onStart: startChallenge });
    return;
  }
  const level = getUserLevel();
  const saved = loadInflightSession('reto-diario', level);
  const inProgress = !!(saved && Array.isArray(saved.pool) && typeof saved.idx === 'number' && saved.idx < saved.pool.length);
  renderDailyChallengeIntro(container, { isFree:false, doneState:null, inProgress, onStart: ()=> runDailyChallengeSession({ container, isFree:false, level }) });
}

/* ---------- Resumen de sesión (compartido) ---------- */
// Paginas de las 5 habilidades principales, para el atajo "practica otra
// habilidad" al terminar una sesion. currentHref (opcional) oculta la
// habilidad que se acaba de practicar, para no mostrar un enlace a la
// misma pagina en la que ya estas.
const SESSION_SWITCH_SKILLS = [
  { label:'Gramática', href:'gramatica.html' },
  { label:'Vocabulario', href:'vocabulario.html' },
  { label:'Listening', href:'listening.html' },
  { label:'Writing', href:'writing.html' },
  { label:'Speaking', href:'speaking.html' }
];
function renderSessionSummary({ title, score, topics, currentHref }){
  const switchLinks = SESSION_SWITCH_SKILLS.filter(s => s.href !== currentHref);
  return `
    <div class="session-summary">
      <h2>${title}</h2>
      <p class="summary-score">${score}</p>
      ${topics && topics.length ? `
        <div class="summary-topics">
          <div class="examples-label">Practicaste:</div>
          <ul>${topics.map(t=>`<li>${t}</li>`).join('')}</ul>
        </div>` : ''}
      <div class="summary-actions">
        <button class="btn btn-primary" id="againBtn">Hacer otra sesión</button>
        <a href="miembros.html" class="btn btn-ghost">Volver a miembros</a>
      </div>
      <div class="summary-switch">
        <div class="examples-label">¿Prefieres practicar otra cosa?</div>
        <div class="summary-switch-links">
          ${switchLinks.map(s=>`<a href="${s.href}" class="summary-switch-pill">${s.label}</a>`).join('')}
        </div>
      </div>
    </div>`;
}
function wireSummaryButtons(container, onAgain){
  const btn = container.querySelector('#againBtn');
  if(btn) btn.addEventListener('click', onAgain);
}

/* ============================================================
   DASHBOARD (miembros.html)
   ============================================================ */
function renderContinueCard(container){
  const p = loadProgress();
  const last = p.lastActivity;
  if(!last){
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Empieza aquí</div>
          <div class="continue-title">Tu primera sesión de Gramática</div>
          <div class="continue-sub">8 ejercicios cortos, con ejemplos y explicaciones.</div>
        </div>
        <a href="gramatica.html" class="btn btn-primary">Empezar →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  if(last.skill === 'clases'){
    // Las clases interactivas no se miden en "X de Y ejercicios" como las
    // otras habilidades (no vienen de un banco con tamaño fijo), así que
    // mostramos la última clase practicada en su lugar.
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Continúa donde te quedaste</div>
          <div class="continue-title">Clases interactivas${last.topic ? ' · ' + last.topic : ''}</div>
          <div class="continue-sub">Practica otra situación real en inglés.</div>
        </div>
        <a href="clases.html" class="btn btn-primary">Continuar →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  if(last.skill === 'errores'){
    // "Mis errores" mezcla ejercicios de varios niveles y habilidades a
    // la vez, así que tampoco encaja en el "X de Y ejercicios de tal
    // nivel" del bloque genérico de abajo (que además reventaría al
    // buscar LEVEL_META de un nivel que no existe, como 'todos').
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Continúa donde te quedaste</div>
          <div class="continue-title">Repaso de errores</div>
          <div class="continue-sub">Sigue repasando lo que se te ha complicado.</div>
        </div>
        <a href="errores.html" class="btn btn-primary">Continuar →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  if(last.skill === 'plan'){
    // Plan de estudio mezcla varias habilidades reales en una sola
    // sesion (ver runPlanSessionCore), asi que tampoco encaja en el
    // "X de Y ejercicios de tal nivel" del bloque generico de abajo:
    // SKILL_LABELS['plan']/SKILL_PAGE['plan'] no existen (a proposito,
    // 'plan' no es una habilidad real), asi que sin esta rama esta
    // tarjeta mostraria "undefined" y un boton roto.
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Continúa donde te quedaste</div>
          <div class="continue-title">Plan de estudio${last.topic ? ' · ' + last.topic : ''}</div>
          <div class="continue-sub">Tu próxima sesión, según tu progreso.</div>
        </div>
        <a href="plan-estudio.html" class="btn btn-primary">Continuar →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  if(last.skill === 'reto-diario'){
    // El reto diario vive como tarjeta dentro del panel (no tiene una
    // página propia), así que el botón manda de vuelta a miembros.html
    // en vez de a una página de habilidad como gramatica.html/etc.
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Continúa donde te quedaste</div>
          <div class="continue-title">Reto diario</div>
          <div class="continue-sub">Un reto rápido de 5 ejercicios y sigues con tu racha.</div>
        </div>
        <a href="miembros.html" class="btn btn-primary">Ir al panel →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  if(last.skill === 'juego'){
    // English Rush tampoco usa niveles A1-C1 ni un banco de tamaño fijo
    // (usa niveles numéricos 1..N propios del juego), así que necesita su
    // propia rama aquí, igual que 'clases'/'errores' arriba (si no, el
    // bloque genérico de abajo truena buscando LEVEL_META['todos']).
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Continúa donde te quedaste</div>
          <div class="continue-title">English Rush${last.topic ? ' · ' + last.topic : ''}</div>
          <div class="continue-sub">¿Hasta dónde puedes llegar hoy?</div>
        </div>
        <a href="juego.html" class="btn btn-primary">Jugar →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  if(last.skill && last.skill.indexOf('cambridge-') === 0){
    // Cambridge (B1 Preliminary / B2 First / C1 Advanced) tampoco usa niveles A1-C1 del
    // sistema normal (usa 'cambridge'/'cambridge-c1' como level), así que
    // necesita su propia rama aquí, igual que TOEFL/IELTS abajo (si no,
    // el bloque genérico truena buscando LEVEL_META['cambridge']).
    const examLevelLabel = (last.level === 'cambridge-c1') ? 'C1 Advanced' : (last.level === 'cambridge-b1') ? 'B1 Preliminary' : 'B2 First';
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Continúa donde te quedaste</div>
          <div class="continue-title">${DISPLAY_SKILL_LABELS[last.skill] || 'Cambridge'} · ${examLevelLabel}</div>
          <div class="continue-sub">Sigue practicando el formato del examen.</div>
        </div>
        <a href="cambridge.html" class="btn btn-primary">Continuar →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  if(last.skill && (last.skill.indexOf('toefl-') === 0 || last.skill.indexOf('ielts-') === 0 || last.skill.indexOf('toeic-') === 0)){
    // Las secciones TOEFL/IELTS no usan niveles (A1-C1) ni un
    // bankSizeForLevel normal, así que necesitan su propia rama aquí (si
    // no, el bloque genérico de abajo truena buscando LEVEL_META[last.level]).
    const examPage = last.skill.indexOf('ielts-') === 0 ? 'ielts.html' : (last.skill.indexOf('toeic-') === 0 ? 'toeic.html' : 'toefl.html');
    const examLabel = last.skill.indexOf('ielts-') === 0 ? 'IELTS' : (last.skill.indexOf('toeic-') === 0 ? 'TOEIC' : 'TOEFL');
    container.innerHTML = `
      <div class="continue-card">
        <div>
          <div class="continue-eyebrow">Continúa donde te quedaste</div>
          <div class="continue-title">${DISPLAY_SKILL_LABELS[last.skill] || examLabel}</div>
          <div class="continue-sub">Sigue practicando el formato del examen.</div>
        </div>
        <a href="${examPage}" class="btn btn-primary">Continuar →</a>
        <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
      </div>`;
    return;
  }
  const total = bankSizeForLevel(last.skill, last.level);
  const attempted = Math.min(attemptedItemIdsFor(p, last.skill).size, total);
  const continuePct = total ? Math.round((attempted / total) * 100) : 0;
  container.innerHTML = `
    <div class="continue-card">
      <div>
        <div class="continue-eyebrow">Continúa donde te quedaste</div>
        <div class="continue-title">${SKILL_LABELS[last.skill]} · ${LEVEL_META[last.level].label} ${LEVEL_META[last.level].range}</div>
        <div class="continue-sub">${attempted} de ${total} ejercicios practicados</div>
        <div class="continue-progress-bar"><div class="continue-progress-fill" style="width:${continuePct}%;"></div></div>
      </div>
      <a href="${SKILL_PAGE[last.skill]}" class="btn btn-primary">Continuar →</a>
      <div class="continue-note">Un poco cada día te acerca a tus metas.</div>
    </div>`;
}
function applyDashboardGreeting(el){
  const profile = getProfile();
  el.textContent = (profile && profile.name) ? `Hola, ${profile.name} \uD83D\uDC4B` : 'Hola \uD83D\uDC4B';
}

/* ---------- Dashboard v2: stats, anillos de progreso, actividad ---------- */
const DASH_SKILLS = ['gramatica','vocabulario','listening','writing','speaking'];

function computeTotalStats(){
  const p = loadProgress();
  let attempted = 0, total = 0;
  DASH_SKILLS.concat(['mixto']).forEach(sk=>{
    attempted += Math.min(attemptedItemIdsFor(p, sk).size, bankSizeFor(sk));
    total += bankSizeFor(sk);
  });
  return { attempted, total };
}

/* Cuenta de ejercicios por día de ESTA semana (lunes a domingo). */
/* Últimos 7 días terminando hoy (no la semana calendario Lun-Dom), para que
   coincida con computeStreak() y con computeWeeklyStats(): una racha que
   empezó, por ejemplo, un sábado debe verse completa aquí aunque cruce a una
   semana calendario nueva el lunes siguiente. */
function computeWeeklyBarData(){
  const p = loadProgress();
  const now = new Date();
  const labels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const todayStr = localDateStr(now);
  const days = [];
  for(let i=6;i>=0;i--){
    const d = new Date(now);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - i);
    const dateStr = localDateStr(d);
    const jsDay = d.getDay(); // 0=domingo..6=sabado
    const labelIdx = jsDay === 0 ? 6 : jsDay - 1;
    days.push({ label: labels[labelIdx], date: dateStr, isToday: dateStr === todayStr, count: 0 });
  }
  const byDate = {};
  days.forEach(d=> byDate[d.date] = d);
  p.sessions.forEach(s=>{
    const bucket = byDate[s.date];
    if(bucket) bucket.count += (s.results ? s.results.length : 0);
  });
  return days;
}

function ringSvg(pct, color, size, strokeWidth){
  size = size || 72; strokeWidth = strokeWidth || 7;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clampedPct = Math.min(100, Math.max(0, pct));
  const offset = c * (1 - clampedPct / 100);
  const center = size / 2;
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Arranca en 0% (offset = circunferencia completa) y luego, ya insertado
  // en el DOM, se anima hasta el porcentaje real (ver renderSkillRings).
  // Si el usuario prefiere menos movimiento, se dibuja directo en su
  // valor final, sin animar.
  const startOffset = reduceMotion ? offset : c;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="var(--paper-dim)" stroke-width="${strokeWidth}"/>
      <circle class="ring-progress-arc" cx="${center}" cy="${center}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${startOffset}" data-final-offset="${offset}"
        transform="rotate(-90 ${center} ${center})"/>
      <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" class="ring-pct" font-size="${size*0.29}">${pct}%</text>
    </svg>`;
}

function renderStatCards(container){
  if(!container) return;
  const streak = computeStreak();
  const level = getUserLevel();
  const streakDates = new Set(computeActiveStreakDates());
  const weekDays = computeWeeklyBarData();
  weekDays.forEach(d => { d.inStreak = streakDates.has(d.date); });
  const practicedCount = weekDays.filter(d=>d.inStreak).length;
  const WEEKLY_GOAL_DAYS = 7;
  const weeklyPct = Math.round((practicedCount / WEEKLY_GOAL_DAYS) * 100);
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-icon stat-icon-streak" style="background:var(--coral-tint);color:var(--coral);">
        <svg viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" fill="currentColor"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Racha</div>
        <div class="stat-card-value">${streak} ${streak === 1 ? 'día' : 'días'}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon stat-icon-level" style="background:var(--blue-tint);color:var(--blue);">
        <svg viewBox="0 0 24 24" fill="none">
          <path class="stat-bar stat-bar-1" d="M4 20V10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <path class="stat-bar stat-bar-2" d="M11 20V4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <path class="stat-bar stat-bar-3" d="M18 20v-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <div class="stat-card-label">Nivel actual</div>
        <div class="stat-card-value">${LEVEL_META[level].label} ${LEVEL_META[level].range}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon stat-icon-exercises" style="background:var(--green-tint);color:var(--green);">
        <svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" stroke-width="2"/><path d="M3.5 9.5h17" stroke="currentColor" stroke-width="2"/><path d="M8 3v3M16 3v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Meta semanal</div>
        <div class="stat-card-value">${practicedCount} <span style="color:var(--ink-faint);font-weight:600;font-size:0.8rem;">de ${WEEKLY_GOAL_DAYS} días</span></div>
        <div class="stat-mini-bar"><div class="stat-mini-bar-fill" data-final-width="${weeklyPct}" style="width:0%;background:var(--green);"></div></div>
      </div>
    </div>`;
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const fill = container.querySelector('.stat-mini-bar-fill');
      if(fill) fill.style.width = fill.dataset.finalWidth + '%';
    });
  });
}

function renderSkillRings(container){
  if(!container) return;
  const p = loadProgress();
  container.innerHTML = DASH_SKILLS.map(sk=>{
    const pct = computeSkillCoverage(p, sk);
    return `
      <div class="ring-item">
        ${ringSvg(pct, SKILL_COLORS[sk], 120, 11)}
        <span class="ring-label">${SKILL_LABELS[sk]}</span>
      </div>`;
  }).join('');
  // Doble requestAnimationFrame: asegura que el navegador ya pinto el
  // estado inicial (0%) antes de moverlo al valor real, para que la
  // transicion CSS de stroke-dashoffset se vea (en vez de saltar directo).
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      container.querySelectorAll('.ring-progress-arc').forEach(arc=>{
        arc.setAttribute('stroke-dashoffset', arc.getAttribute('data-final-offset'));
      });
    });
  });
}

function renderWeeklyChart(container){
  if(!container) return;
  const days = computeWeeklyBarData();
  const max = Math.max(1, ...days.map(d=>d.count));
  container.innerHTML = `
    <div class="bottom-panel-title">Tu progreso esta semana</div>
    <div class="weekly-bars">
      ${days.map(d=>{
        const h = Math.round((d.count / max) * 100);
        return `
        <div class="weekly-bar-col">
          <div class="weekly-bar ${d.isToday ? 'today' : ''}" style="height:${d.count ? Math.max(h,6) : 4}%;">
            ${d.count ? `<span class="weekly-bar-count">${d.count}</span>` : ''}
          </div>
          <span class="weekly-bar-label ${d.isToday ? 'today' : ''}">${d.label}</span>
        </div>`;
      }).join('')}
    </div>`;
}

function renderRecentActivityV2(container){
  if(!container) return;
  const p = loadProgress();
  const recent = p.sessions.slice(-5).reverse();
  container.innerHTML = `<div class="bottom-panel-title">Tu actividad reciente</div>`;
  if(!recent.length){
    container.innerHTML += `<p class="progress-empty">Aún no tienes sesiones registradas. ¡Empieza tu primera práctica hoy!</p>`;
    return;
  }
  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now()-86400000));
  const rows = recent.map(s=>{
    const graded = (s.results||[]).filter(r=>r.isCorrect===true || r.isCorrect===false);
    const correct = graded.filter(r=>r.isCorrect).length;
    const scoreText = graded.length ? `${correct}/${graded.length} correctas` : `${s.results.length} completados`;
    const dateLabel = s.date === today ? 'Hoy' : (s.date === yesterday ? 'Ayer' : s.date);
    return `
      <div class="recent-row" style="border-left-color:${DISPLAY_SKILL_COLORS[s.skill] || 'var(--line)'};">
        <div>
          <div class="recent-skill">${DISPLAY_SKILL_LABELS[s.skill] || s.skill} · ${(s.topics && s.topics[0]) || ''}</div>
          <div class="recent-score">${scoreText}</div>
        </div>
        <div class="recent-date">${dateLabel}</div>
      </div>`;
  }).join('');
  container.innerHTML += `<div class="recent-list">${rows}</div>`;
}

function renderStreakCard(container){
  if(!container) return;
  const streakDates = new Set(computeActiveStreakDates());
  const streak = streakDates.size;
  const frozenDate = getFrozenStreakDate();
  /* Los puntos solo marcan días que son parte de la racha ACTIVA (sin
     huecos hasta hoy), no simple asistencia de la semana: si la racha se
     cortó, los días de antes del corte se ven vacíos aunque sí hayas
     practicado ese día. El día "congelado" (si hay uno, ver
     getFrozenStreakDate) se pinta aparte con ❄️: no cuenta como
     practicado, pero tampoco rompe la racha. */
  const days = computeWeeklyBarData();
  days.forEach(d => { d.inStreak = streakDates.has(d.date); d.frozen = d.date === frozenDate; });
  const practicedCount = days.filter(d=>d.inStreak).length;
  container.innerHTML = `
    <div class="streak-section streak-section-current">
      <div class="streak-flame">
        <svg viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" fill="currentColor"/></svg>
      </div>
      <div class="streak-number">${streak} ${streak === 1 ? 'día' : 'días'}</div>
      <div class="streak-caption">de racha seguida</div>
      ${(frozenDate && !streakDates.has(localDateStr(new Date()))) ? `<div class="streak-goal">Tu racha está en riesgo de perderse, practica hoy para mantenerla.</div>` : ''}
    </div>
    <div class="streak-section streak-section-week">
      <div class="streak-subhead">Esta semana</div>
      <div class="streak-dots">
        ${days.map(d=>`
          <div class="streak-dot">
            <div class="streak-dot-mark ${d.inStreak ? 'done' : ''} ${d.frozen ? 'frozen' : ''} ${d.isToday ? 'today-mark' : ''}">${d.frozen ? '❄️' : ''}</div>
            <span class="streak-dot-label">${d.label.slice(0,1)}</span>
          </div>`).join('')}
      </div>
      <div class="streak-caption" style="margin-top:14px;">${practicedCount} de 7 días</div>
      <div class="streak-goal streak-goal-week">${streakWeekMessage(practicedCount)}</div>
    </div>`;
}

/* Meta semanal simple (7 días, la semana completa contando sáb/dom):
   mensaje corto segun racha y dias practicados esta semana, con los mismos
   datos que ya calculamos arriba (racha activa, no semana calendario). */
function streakWeekMessage(practicedCount){
  const WEEKLY_GOAL = 7;
  if(practicedCount >= WEEKLY_GOAL) return '¡Semana completada!';
  const left = WEEKLY_GOAL - practicedCount;
  if(left === 1) return '¡1 día más para completar esta semana!';
  return `Te faltan ${left} días para completar esta semana.`;
}

/* ============================================================
   MINI TARJETA DE PROGRESO (dashboard de miembros)
   ------------------------------------------------------------
   Reemplaza al bloque grande "Mi rendimiento" (anillos por
   habilidad + gráfica semanal + racha) que antes vivía en
   miembros.html: ese detalle completo sigue existiendo tal cual
   en progreso.html (barras de "Tus habilidades", etc., sin tocar), esto es
   solo un resumen corto con un CTA hacia ahí. Reutiliza funciones
   ya existentes y probadas (computeWeeklyStats, computeStreak,
   computeSkillCoverage) en vez de inventar cálculos nuevos.
   ============================================================ */

// Frase corta y variable según los datos reales (no genérica): primero
// intenta algo positivo/notable (semana activa, buena precisión, una
// habilidad claramente más fuerte que las demás), y si no hay nada así
// de notable todavía, cae a una sugerencia concreta de dónde practicar
// (misma idea que pickProgressTip, pero en una sola frase corta para
// que quepa en una tarjeta chica).
function pickMiniProgressInsight(p, weekly, streak){
  if(weekly.exercises >= 20){
    return `Esta semana ya llevas ${weekly.exercises} ejercicios.`;
  }
  const started = PROGRESS_SKILLS_DISPLAY.filter(sk => attemptedItemIdsFor(p, sk).size > 0);
  if(started.length >= 2){
    let best = null, worst = null;
    started.forEach(sk=>{
      const cov = computeSkillCoverage(p, sk);
      if(!best || cov > best.cov) best = { sk, cov };
      if(!worst || cov < worst.cov) worst = { sk, cov };
    });
    if(best.cov >= 40 && best.cov - worst.cov >= 15){
      return `Vas más fuerte en ${SKILL_LABELS[best.sk]}.`;
    }
    if(worst.cov < 100){
      return `${SKILL_LABELS[worst.sk]} es tu área con más oportunidad.`;
    }
  }
  if(weekly.accuracy !== null && weekly.accuracy >= 80 && weekly.exercises >= 5){
    return `Tu precisión esta semana es de ${weekly.accuracy}%. Vas muy bien.`;
  }
  if(streak >= 3){
    return `Llevas ${streak} días seguidos practicando. Sigue así.`;
  }
  return 'Tu progreso va bien, sigue practicando para mantener tu ritmo.';
}

/* ============================================================
   TU DIAGNÓSTICO — análisis personal del progreso, SIN IA
   ------------------------------------------------------------
   Todo sale de datos que ya existen, sin tablas nuevas:
     - p.sessions[].results (loadProgress, sincronizado con
       progress_sessions en Supabase): cada intento calificado.
     - mistake_stats (loadMistakeStatsMap): errores activos,
       recuperados y dominados, con fail_count. Si no está
       disponible (sin red), se usa el historial local.
     - Los bancos de data.js (getMistakesItemIndex) para saber la
       habilidad real de cada ejercicio y el tema de gramática.

   Regla de oro: cada frase que se muestra sale de un número real.
   Si no hay suficientes intentos para opinar de algo, no se dice
   nada de eso (nunca se inventa una conclusión con 1 o 2 respuestas).

   Los temas de gramática de data.js son ~100 y cada uno tiene ~4
   ejercicios, así que por tema casi nunca hay datos suficientes.
   Por eso se agrupan en "familias" (Preposiciones, Pasado, etc.)
   con DIAG_GRAMMAR_FAMILIES: así sí se juntan intentos suficientes
   para decir algo con fundamento.
   ============================================================ */
const DIAG = {
  MIN_TOTAL: 15,        // intentos calificados en total para dar diagnóstico
  MIN_UNIT: 8,          // intentos mínimos para opinar de un tema o habilidad
  MIN_MASTERED: 12,     // intentos mínimos para decir "dominado"
  MIN_TREND_EACH: 6,    // intentos en cada periodo para hablar de tendencia
  TREND_DELTA: 10,      // puntos de % para decir que mejoró o bajó
  RECENT_DAYS: 7,       // "ahora": últimos 7 días
  PREV_DAYS: 35,        // "antes": del día 8 al 35
  FORGOTTEN_DAYS: 10,   // días sin practicar algo para sugerir repasarlo
  WEAK_BELOW: 75,       // % por debajo del cual algo puede ser punto débil
  MIN_TEMA: 4           // intentos mínimos para señalar un tema concreto dentro de una familia
};
const DIAG_SKILLS = ['gramatica','vocabulario','listening','lectura','writing'];
const DIAG_KIND_TO_SKILL = { grammar:'gramatica', vocab:'vocabulario', listening:'listening', writing:'writing', reading:'lectura' };

// El orden importa: gana la primera familia cuyo patrón coincide con el
// tema (por ejemplo "Present Perfect vs Past Simple" es de Presente
// perfecto, no de Pasado). Verificado contra los 99 temas reales de
// GRAMMAR_BANK; lo que no encaja en ninguna queda en "otros" y nunca se
// nombra como fortaleza ni como punto débil (sería un nombre vago).
const DIAG_GRAMMAR_FAMILIES = [
  { id:'preposiciones', label:'Preposiciones', re:/in \/ on \/ at|preposici|by vs until|beside/i, article:'articulo-in-on-at.html' },
  { id:'pasiva', label:'Voz pasiva', re:/pasiva|causativ/i },
  { id:'modales', label:'Verbos modales', re:/modal|can \/ can't/i },
  { id:'condicionales', label:'Condicionales', re:/condicional|conditional|wish|if only/i },
  { id:'perfecto', label:'Presente perfecto', re:/present perfect|presente perfecto|past perfect|since \/ for|pasado perfecto/i, article:'articulo-presente-perfecto.html' },
  { id:'indirecto', label:'Estilo indirecto', re:/reported|indirecto/i },
  { id:'presente-simple', label:'Presente simple', re:/presente simple|do \/ does|frecuencia/i, article:'articulo-presente-simple.html' },
  { id:'to-be', label:'Verbo to be', re:/to be|is \/ are/i, article:'articulo-verbo-to-be.html' },
  { id:'pasado', label:'Pasado simple', re:/pasado simple|used to/i, article:'articulo-pasado-simple.html' },
  { id:'continuo', label:'Presente continuo', re:/continuo/i },
  { id:'futuro', label:'Futuro (will y going to)', re:/futuro|going to/i },
  { id:'relativas', label:'Cláusulas relativas', re:/relativ|whom/i },
  { id:'cuantificadores', label:'Some, any, much y many', re:/some \/ any|much \/ many|little|few|cuantificador|contables|fewer/i },
  { id:'comparativos', label:'Comparativos', re:/comparativ/i },
  { id:'pronombres', label:'Pronombres y posesivos', re:/pronombre|posesiv/i },
  { id:'bases', label:'Números, días y preguntas básicas', re:/número|numero|colores|días|plural|yes \/ no|question words|preguntas simples/i, article:'articulo-numeros-en-ingles.html' },
  { id:'demostrativos', label:'A/an y this/that', re:/a \/ an|this|these/i },
  { id:'conectores', label:'Conectores', re:/conector|despite|although|secuenciador/i },
  { id:'verbos', label:'Verbos y phrasal verbs', re:/phrasal|gerundio|verbo "have"|colocacion/i, article:'articulo-phrasal-verbs.html' },
  { id:'confusiones', label:'Palabras que se confunden', re:/ vs |"to" vs|your|their|actually/i },
];
const DIAG_FAMILY_BY_ID = DIAG_GRAMMAR_FAMILIES.reduce((m,f)=>{ m[f.id] = f; return m; }, {});

function diagFamilyForTopic(topic){
  if(!topic) return null;
  for(let i=0; i<DIAG_GRAMMAR_FAMILIES.length; i++){
    if(DIAG_GRAMMAR_FAMILIES[i].re.test(topic)) return DIAG_GRAMMAR_FAMILIES[i];
  }
  return null;
}

// Índice id -> { kind, item, topic } igual al de "Mis errores", más
// Lectura (que "Mis errores" no usa). null si la página no cargó data.js.
let _diagItemIndexCache = null;
function getDiagItemIndex(){
  if(_diagItemIndexCache) return _diagItemIndexCache;
  if(typeof GRAMMAR_BANK === 'undefined' || typeof READING_BANK === 'undefined') return null;
  const index = new Map(getMistakesItemIndex());
  LEVELS.forEach(level=>{
    READING_BANK[level].forEach(variant=> variant.forEach(item=> index.set(item.id, { kind:'reading', item, topic:null })));
  });
  _diagItemIndexCache = index;
  return index;
}

// Todos los intentos calificados, en orden de tiempo, con su habilidad
// real y su familia de gramática. Speaking (sin calificar) y las
// secciones de examen (TOEFL, IELTS...) no entran: tienen bancos propios.
function collectDiagAttempts(p){
  const index = getDiagItemIndex();
  if(!index) return [];
  const out = [];
  (p.sessions || []).forEach(s=>{
    const when = s.startedAt || (s.date ? new Date(s.date + 'T12:00:00').getTime() : 0);
    (s.results || []).forEach(r=>{
      if(r.isCorrect !== true && r.isCorrect !== false) return;
      const found = index.get(r.itemId);
      const skill = r.skill || (found && DIAG_KIND_TO_SKILL[found.kind]) || s.skill;
      if(DIAG_SKILLS.indexOf(skill) === -1) return;
      const fam = (skill === 'gramatica' && found) ? diagFamilyForTopic(found.topic) : null;
      out.push({ itemId:r.itemId, ok:r.isCorrect, when, skill, family: fam ? fam.id : null,
        tema: (r.lowEffort ? null : ((skill === 'gramatica' || skill === 'vocabulario' || skill === 'listening' || skill === 'writing') ? diagTemaIdForFound(found) : null)) });
    });
  });
  out.sort((a,b)=> a.when - b.when);
  return out;
}

/* Tema más flojo DENTRO de una familia (para decir "refuerza verbos
   irregulares" y no solo "pasado simple"). Usa los mismos intentos y errores
   pendientes del diagnóstico, sin guardar nada nuevo. diagFocusTema devuelve
   null si ningún tema tiene muestra suficiente o todos van bien: entonces se
   recomienda la familia, como siempre. */
function diagTemaStats(list, activeOwn, now){
  const by = new Map();
  list.forEach(a=>{ if(!a.tema) return; if(!by.has(a.tema)) by.set(a.tema, []); by.get(a.tema).push(a); });
  const out = [];
  by.forEach((l, id)=>{
    if(l.length < DIAG.MIN_TEMA) return;
    const s = diagUnitStats(l, now);
    if(s.items < 2) return;       // el mismo ejercicio repetido no es evidencia de un tema
    const own = activeOwn.filter(m => m.tema === id);
    s.id = id;
    s.label = TEMA_BY_ID[id] ? TEMA_BY_ID[id].label : id;
    s.activeMistakes = own.length;
    s.repeatedMistakes = own.filter(m => m.failCount >= 2).length;
    s.dominated = s.n >= DIAG.MIN_MASTERED && s.acc >= 85 && s.last10Acc >= 80 && s.activeMistakes === 0 && s.trend !== 'down';
    s.score = (100 - s.current) + 3*Math.min(s.activeMistakes, 5) + 2*Math.min(s.repeatedMistakes, 5) + (s.trend === 'down' ? 8 : 0);
    out.push(s);
  });
  return out;
}
function diagFocusTema(temaStats){
  const cands = temaStats.filter(s => !s.dominated && (s.current < DIAG.WEAK_BELOW || s.activeMistakes >= 1));
  cands.sort((a,b)=> b.score - a.score);
  return cands[0] || null;
}

function diagPct(c, n){ return n ? Math.round(c / n * 100) : null; }

// Límite inferior de Wilson (z=1): un 90% con 10 intentos vale menos que
// un 88% con 60. Sirve para elegir la fortaleza sin premiar la suerte.
function diagWilsonLow(c, n){
  if(!n) return 0;
  const z = 1, ph = c / n;
  return (ph + z*z/(2*n) - z*Math.sqrt(ph*(1-ph)/n + z*z/(4*n*n))) / (1 + z*z/n);
}

function diagUnitStats(list, now){
  const recentCut = now - DIAG.RECENT_DAYS*86400000;
  const prevCut = now - DIAG.PREV_DAYS*86400000;
  let c = 0, rN = 0, rC = 0, pN = 0, pC = 0, lastWhen = 0;
  const items = new Set();
  list.forEach(a=>{
    if(a.ok) c++;
    items.add(a.itemId);
    if(a.when > lastWhen) lastWhen = a.when;
    if(a.when >= recentCut){ rN++; if(a.ok) rC++; }
    else if(a.when >= prevCut){ pN++; if(a.ok) pC++; }
  });
  const last = list.slice(-10);
  const lastC = last.filter(a=>a.ok).length;
  const u = {
    n: list.length, correct: c, acc: diagPct(c, list.length),
    last10Acc: diagPct(lastC, last.length),
    recentN: rN, recentAcc: diagPct(rC, rN),
    prevN: pN, prevAcc: diagPct(pC, pN),
    items: items.size, lastWhen,
    wilsonLow: diagWilsonLow(c, list.length),
    trend: null, delta: null
  };
  if(rN >= DIAG.MIN_TREND_EACH && pN >= DIAG.MIN_TREND_EACH){
    u.delta = u.recentAcc - u.prevAcc;
    u.trend = u.delta >= DIAG.TREND_DELTA ? 'up' : (u.delta <= -DIAG.TREND_DELTA ? 'down' : 'flat');
  }
  // "Cómo va ahora": la semana si hay datos, si no los últimos 10 intentos.
  u.current = rN >= DIAG.MIN_TREND_EACH ? u.recentAcc : u.last10Acc;
  return u;
}

const DIAG_STATE_LABELS = { dominado:'Dominado', mejorando:'Mejorando', bien:'Vas bien', practica:'En práctica', refuerzo:'Necesita refuerzo' };

function diagState(u){
  if(!u || u.n < DIAG.MIN_UNIT) return null;
  const tolerance = Math.max(1, Math.round(u.items * 0.1));
  if(u.n >= DIAG.MIN_MASTERED && u.acc >= 85 && u.last10Acc >= 80 && u.activeMistakes <= tolerance && u.trend !== 'down') return 'dominado';
  if(u.trend === 'up') return 'mejorando';
  if(u.current < 65 || (u.trend === 'down' && u.current < DIAG.WEAK_BELOW) || (u.activeMistakes >= 3 && u.current < DIAG.WEAK_BELOW)) return 'refuerzo';
  if(u.current >= DIAG.WEAK_BELOW) return 'bien';
  return 'practica';
}

// Errores activos / repetidos / recuperados por habilidad y familia.
// Con mistake_stats si está; si no, desde el historial local.
function diagMistakeSummary(attempts, statsMap, now){
  const index = getDiagItemIndex();
  const weekCut = now - 7*86400000;
  const active = [];   // { itemId, failCount, skill, family }
  let recoveredWeek = 0, masteredWeek = 0;
  function place(itemId){
    const found = index && index.get(itemId);
    if(!found) return null;
    const skill = DIAG_KIND_TO_SKILL[found.kind];
    const fam = skill === 'gramatica' ? diagFamilyForTopic(found.topic) : null;
    return { skill, family: fam ? fam.id : null, tema: (skill === 'gramatica' || skill === 'vocabulario' || skill === 'listening' || skill === 'writing') ? diagTemaIdForFound(found) : null };
  }
  if(statsMap instanceof Map){
    statsMap.forEach(s=>{
      if(s.status === 'active'){
        const where = place(s.item_id);
        if(where) active.push({ itemId:s.item_id, failCount:s.fail_count || 1, skill:where.skill, family:where.family, tema:where.tema });
      }
      if(s.recovered_at && new Date(s.recovered_at).getTime() >= weekCut) recoveredWeek++;
      if(s.status === 'mastered' && s.updated_at && new Date(s.updated_at).getTime() >= weekCut) masteredWeek++;
    });
  } else {
    // Respaldo sin red: los errores pendientes salen de computeMistakeIds(),
    // la misma regla que ya usan Mis errores y el Plan de estudio (último
    // intento incorrecto). "Recuperado" = falló alguna vez y sus 2 últimos
    // intentos fueron correctos, el último esta semana (igual que el umbral
    // de 2 aciertos seguidos de apply_mistake_results).
    const byItem = new Map();
    attempts.forEach(a=>{
      if(!byItem.has(a.itemId)) byItem.set(a.itemId, []);
      byItem.get(a.itemId).push(a);
    });
    computeMistakeIds().forEach(itemId=>{
      const where = place(itemId);
      if(!where) return;
      const list = byItem.get(itemId) || [];
      active.push({ itemId, failCount: Math.max(1, list.filter(a=>!a.ok).length), skill:where.skill, family:where.family, tema:where.tema });
    });
    byItem.forEach(list=>{
      const n = list.length;
      if(n >= 3 && list[n-1].ok && list[n-2].ok && list.slice(0, n-2).some(a=>!a.ok) && list[n-1].when >= weekCut) recoveredWeek++;
    });
  }
  return { active, recoveredWeek, masteredWeek };
}

/* Calcula el diagnóstico completo. statsMap es opcional (Map de
   mistake_stats); si no se pasa, se usa el que ya esté en caché. */
function computeDiagnosis(p, statsMap){
  p = p || loadProgress();
  if(statsMap === undefined) statsMap = (_mistakeStatsCache instanceof Map) ? _mistakeStatsCache : null;
  const now = Date.now();
  const attempts = collectDiagAttempts(p);
  const total = attempts.length;
  const diag = { ready: total >= DIAG.MIN_TOTAL, total, remaining: Math.max(0, DIAG.MIN_TOTAL - total), units: [], insights: [], actions: [] };
  const mistakes = diagMistakeSummary(attempts, statsMap, now);
  diag.activeMistakes = mistakes.active.length;
  diag.recoveredWeek = mistakes.recoveredWeek;
  diag.masteredWeek = mistakes.masteredWeek;
  if(!diag.ready) return diag;

  // Unidades: cada habilidad, y cada familia de gramática.
  const groups = new Map();
  attempts.forEach(a=>{
    const keys = ['skill:' + a.skill];
    if(a.family) keys.push('family:' + a.family);
    keys.forEach(k=>{ if(!groups.has(k)) groups.set(k, []); groups.get(k).push(a); });
  });
  groups.forEach((list, key)=>{
    const [type, id] = key.split(':');
    const u = diagUnitStats(list, now);
    u.key = key; u.type = type; u.id = id;
    u.label = type === 'skill' ? SKILL_LABELS[id] : DIAG_FAMILY_BY_ID[id].label;
    u.article = type === 'family' ? (DIAG_FAMILY_BY_ID[id].article || null) : null;
    // Familia: el Plan con foco en ella si hay ejercicios en su nivel; si
    // no, el Plan de siempre (nunca un "refuerzo" vacío).
    u.href = type === 'skill' ? SKILL_PAGE[id] : (familyHasItemsAt(id, getUserLevel()) ? planFocusHref(id) : 'plan-estudio.html');
    const own = mistakes.active.filter(m => type === 'skill' ? m.skill === id : m.family === id);
    u.activeMistakes = own.length;
    u.repeatedMistakes = own.filter(m => m.failCount >= 2).length;
    u.daysIdle = Math.floor((now - u.lastWhen) / 86400000);
    u.state = diagState(u);
    if(type === 'family' && typeof TEMAS !== 'undefined'){
      const ts = diagTemaStats(list.filter(a => a.family === id), mistakes.active.filter(m => m.family === id), now);
      u.temaStats = ts;
      u.focusTema = diagFocusTema(ts);
    } else if(type === 'skill' && (id === 'vocabulario' || id === 'listening' || id === 'writing') && typeof TEMAS !== 'undefined'){
      // Dentro de Vocabulario / Listening / Writing: temas reales explícitos de temas.js
      // (en Writing, el mismo topic_id que en Gramática pero con sus propias respuestas).
      
      const ts = diagTemaStats(list.filter(a => a.skill === id), mistakes.active.filter(m => m.skill === id), now);
      u.temaStats = ts;
      u.focusTema = diagFocusTema(ts);
    }
    diag.units.push(u);
  });
  const rated = diag.units.filter(u => u.state);
  const skills = rated.filter(u => u.type === 'skill');
  const families = rated.filter(u => u.type === 'family');

  // Fortaleza: la mejor habilidad con muestra suficiente (Wilson), y
  // solo si de verdad va bien (no se declara fortaleza un 60%).
  const strengthPool = skills.filter(u => u.n >= 15 && u.acc >= 70);
  diag.strength = strengthPool.sort((a,b)=> b.wilsonLow - a.wilsonLow)[0] || null;

  // Punto débil: se prefiere una familia de gramática (es más concreto y
  // accionable que "Gramática"). Cuenta el % de ahora, los errores
  // pendientes y si viene bajando.
  function weakScore(u){
    return (100 - u.current) + 3*Math.min(u.activeMistakes, 5) + 2*Math.min(u.repeatedMistakes, 5) + (u.trend === 'down' ? 8 : 0);
  }
  const weakCandidates = rated.filter(u => u.state !== 'dominado' && (u.current < DIAG.WEAK_BELOW || (u.activeMistakes >= 3 && u.current < 85)));
  const weakFamily = weakCandidates.filter(u => u.type === 'family').sort((a,b)=> weakScore(b) - weakScore(a))[0];
  const weakSkill = weakCandidates.filter(u => u.type === 'skill' && u.id !== 'gramatica').sort((a,b)=> weakScore(b) - weakScore(a))[0];
  diag.weak = (weakFamily && (!weakSkill || weakScore(weakFamily) >= weakScore(weakSkill) - 10)) ? weakFamily : (weakSkill || weakFamily || null);
  if(diag.strength && diag.weak && diag.strength.key === diag.weak.key) diag.strength = null;

  diag.improving = rated.filter(u => u.trend === 'up').sort((a,b)=> b.delta - a.delta);
  diag.declining = rated.filter(u => u.trend === 'down').sort((a,b)=> a.delta - b.delta);
  diag.mastered = families.filter(u => u.state === 'dominado').sort((a,b)=> b.acc - a.acc);
  diag.forgotten = rated
    .filter(u => u.daysIdle >= DIAG.FORGOTTEN_DAYS && u.state !== 'dominado' && (!diag.weak || u.key !== diag.weak.key))
    .sort((a,b)=> b.daysIdle - a.daysIdle);

  // Errores que se repiten: ejercicios fallados 2+ veces y todavía
  // pendientes, agrupados donde más se concentran.
  const repeatGroups = new Map();
  mistakes.active.filter(m => m.failCount >= 2).forEach(m=>{
    const key = m.family ? 'family:' + m.family : 'skill:' + m.skill;
    repeatGroups.set(key, (repeatGroups.get(key) || 0) + 1);
  });
  diag.repeated = Array.from(repeatGroups.entries())
    .map(([key, count])=>{
      const [type, id] = key.split(':');
      return { key, count, label: type === 'skill' ? SKILL_LABELS[id] : DIAG_FAMILY_BY_ID[id].label };
    })
    .sort((a,b)=> b.count - a.count);

  // Frases del diagnóstico, en orden de importancia.
  // Si mejoró un tema de gramática, no se repite además "mejoraste en Gramática".
  const improvingFamilies = diag.improving.filter(u => u.type === 'family');
  diag.improving
    .filter(u => !(u.type === 'skill' && u.id === 'gramatica' && improvingFamilies.length))
    .slice(0, 2).forEach(u=>{
    diag.insights.push({ tone:'up', text:`Mejoraste en ${u.label}: de ${u.prevAcc}% a ${u.recentAcc}% de aciertos.` });
  });
  if(diag.repeated.length){
    const r = diag.repeated[0];
    diag.insights.push({ tone:'warn', text: r.count === 1
      ? `Sigues fallando un ejercicio de ${r.label} que ya fallaste más de una vez.`
      : `Sigues fallando con ${r.label}: ${r.count} ejercicios que ya fallaste más de una vez.` });
  }
  diag.declining.slice(0, 1).forEach(u=>{
    diag.insights.push({ tone:'down', text:`Bajaste en ${u.label}: de ${u.prevAcc}% a ${u.recentAcc}%. Conviene repasarlo.` });
  });
  if(diag.recoveredWeek > 0){
    diag.insights.push({ tone:'up', text: diag.recoveredWeek === 1 ? 'Recuperaste 1 error esta semana.' : `Recuperaste ${diag.recoveredWeek} errores esta semana.` });
  }
  if(diag.strength){
    diag.insights.push({ tone:'good', text:`Tu mejor habilidad ahora es ${diag.strength.label}, con ${diag.strength.acc}% de aciertos.` });
  }
  if(diag.mastered.length){
    const names = diag.mastered.slice(0, 3).map(u=>u.label);
    diag.insights.push({ tone:'good', text:`Ya dominas: ${names.join(', ')}.` });
  }
  // Cerca de dominar: va bien (o mejorando) con muestra suficiente, pero
  // todavía no cumple "Dominado". Es lo que más rinde consolidar.
  diag.nearMastery = families
    .filter(u => (u.state === 'bien' || u.state === 'mejorando') && u.acc >= 75 && u.n >= DIAG.MIN_UNIT && (!diag.weak || u.key !== diag.weak.key))
    .sort((a,b)=> b.acc - a.acc);
  if(diag.nearMastery.length){
    const u = diag.nearMastery[0];
    diag.insights.push({ tone:'good', text:`Estás cerca de dominar ${u.label}: vas en ${u.acc}%.` });
  }

  // Qué practicar hoy (máximo 3 acciones, sin repetir destino). El orden
  // ES la prioridad de "Hoy te conviene" (diag.today = la primera):
  //   1. errores frecuentes, si están dispersos o acumulados (si se
  //      concentran en el punto débil, el refuerzo de abajo ya los cubre:
  //      el Plan con foco pone primero los ejercicios fallados);
  //   2. punto débil actual; 3. retroceso reciente; 4. consolidar lo que
  //   está cerca de dominar; 5. material olvidado; 6. el Plan de siempre.
  const seen = new Set();
  function push(a, key){
    if(diag.actions.length >= 3 || seen.has(key) || seen.has(a.href)) return;
    seen.add(key); seen.add(a.href);
    diag.actions.push(a);
  }
  const repeatedTotal = diag.repeated.reduce((n, r)=> n + r.count, 0);
  const mistakesAction = {
    title:'Repasar tus errores',
    reason: diag.activeMistakes > MISTAKE_PRIORITY.QUICK_REVIEW_SIZE
      ? `Tienes ${diag.activeMistakes} ejercicios pendientes de corregir. El repaso rápido toma los ${MISTAKE_PRIORITY.QUICK_REVIEW_SIZE} más importantes.`
      : `Tienes ${diag.activeMistakes} ejercicios pendientes de corregir.`,
    href:'errores.html?modo=rapido', cta:'Repaso rápido', voice:'repasa-antes'
  };
  if(diag.activeMistakes >= 10 || (repeatedTotal >= 3 && (!diag.weak || diag.repeated[0].key !== diag.weak.key))){
    push(mistakesAction, 'mistakes');
  }
  // Microtemas ACTIVOS con refuerzo o comprobación pendiente: la recomendación nombra el concepto exacto.
  const microCovered = new Set();
  try{ microDiagActions(getUserLevel()).slice(0, 2).forEach(a => { push(a, 'micro:' + a.micro); microCovered.add(a.tema); }); }catch(e){}
  if(diag.weak && !(diag.weak.focusTema && microCovered.has(diag.weak.focusTema.id))){
    // Si dentro de la familia hay un tema concreto que falla más, la
    // recomendación es ese tema (práctica y clase del tema). Si no, la familia.
    const ft = diag.weak.focusTema || null;       // familia de gramática o Vocabulario
    const wr = diag.weak.type === 'skill' && diag.weak.id === 'writing' ? 'writing' : undefined;
    const tc = ft ? contentForTema(ft.id, wr) : null;
    if(tc){
      // Señal cruzada (sin mezclar métricas): si el mismo tema también va mal en Gramática, se dice.
      let cross = '';
      if(wr){
        const gu = diag.units.find(x => x.key === 'family:' + (TEMA_BY_ID[ft.id] || {}).family);
        const gs = gu && (gu.temaStats || []).find(s => s.id === ft.id);
        if(gs && !gs.dominated && (gs.current < DIAG.WEAK_BELOW || gs.activeMistakes >= 1)) cross = ' También lo fallas en Gramática.';
      }
      push({
        title: wr ? `Reforzar ${tc.label} en Writing` : `Reforzar ${tc.label}`,
        reason: (ft.activeMistakes
          ? `Vas en ${ft.current}% y tienes ${ft.activeMistakes} ${ft.activeMistakes === 1 ? 'error pendiente' : 'errores pendientes'} en este tema.`
          : `Es el tema donde más fallas dentro de ${diag.weak.label}: ${ft.current}% de aciertos.`) + cross,
        href: temaHasItemsAt(ft.id, getUserLevel(), wr) ? temaPlanHref(TEMA_BY_ID[ft.id], false, wr) : diag.weak.href,
        cta: 'Reforzar ahora',
        article: tc.article, articleLabel: tc.articleLabel,
        tema: ft.id, temaSkill: tc.skill, voice:'sigue-tema'
      }, diag.weak.key);
    } else {
      push({
        title: diag.weak.type === 'family' ? `Reforzar ${diag.weak.label}` : `Practicar ${diag.weak.label}`,
        reason: diag.weak.activeMistakes
          ? `Vas en ${diag.weak.current}% y tienes ${diag.weak.activeMistakes} ${diag.weak.activeMistakes === 1 ? 'error pendiente' : 'errores pendientes'} aquí.`
          : `Es donde más fallas ahora: ${diag.weak.current}% de aciertos.`,
        href: diag.weak.href,
        cta: diag.weak.type === 'family' ? 'Reforzar ahora' : 'Practicar',
        article: diag.weak.article, voice:'sigue-tema'
      }, diag.weak.key);
    }
  }
  if(diag.activeMistakes >= 5) push(mistakesAction, 'mistakes');
  const drop = diag.declining.find(u => !diag.weak || u.key !== diag.weak.key);
  if(drop){
    push({
      title:`Recuperar ${drop.label}`,
      reason:`Bajó de ${drop.prevAcc}% a ${drop.recentAcc}% en los últimos días.`,
      href: drop.href, cta:'Practicar', article: drop.article, voice:'puedes-mejorar'
    }, drop.key);
  }
  if(diag.nearMastery.length){
    const u = diag.nearMastery[0];
    push({
      title:`Consolidar ${u.label}`,
      reason:`Vas en ${u.acc}%: un poco más de práctica y lo dominas.`,
      href: u.href, cta:'Practicar', article: u.article, voice:'casi-dominas'
    }, u.key);
  }
  if(diag.forgotten.length){
    const f = diag.forgotten[0];
    push({
      title:`Volver a ${f.label}`,
      reason:`Hace ${f.daysIdle} días que no lo practicas y vas en ${f.acc}%.`,
      href: f.href, cta:'Practicar'
    }, f.key);
  }
  if(!diag.actions.length){
    push({ title:'Hacer tu plan de hoy', reason:'Vas bien en todo: tu plan mezcla tus habilidades según tu nivel.', href:'plan-estudio.html', cta:'Empezar', voice:'buen-trabajo' }, 'plan');
  }
  diag.today = diag.actions[0];
  return diag;
}

/* Resumen de la semana (lunes a hoy no: últimos 7 días, igual que el
   resto del panel). Reutiliza computeWeeklyStatsWithDelta para los
   números base, así coincide con las tarjetas de arriba. */
function computeWeeklyReport(diag){
  const w = computeWeeklyStatsWithDelta();
  const p = loadProgress();
  const days = new Set(sessionsInLastDays(p, 7).map(s=>s.date)).size;
  let goal;
  if(days === 0 && (p.sessions || []).length){
    goal = 'Retomar tu ritmo: practicar al menos 3 días esta semana.';
  } else if(diag.ready && diag.weak){
    // Meta alcanzable en una semana: unos 20 puntos más, redondeado a 5.
    const target = Math.min(90, Math.ceil((diag.weak.current + 20) / 5) * 5);
    goal = `Subir ${diag.weak.label} de ${diag.weak.current}% a ${target}%.`;
  } else if(days < 4){
    goal = `Practicar al menos 4 días esta semana (llevas ${days}).`;
  } else if(w.current.accuracy !== null && w.current.accuracy >= 85){
    goal = 'Vas muy bien: prueba la dificultad "Difícil" en tu Plan de estudio.';
  } else {
    goal = 'Mantener tu ritmo y repasar tus errores pendientes.';
  }
  return {
    exercises: w.current.exercises,
    accuracy: w.current.accuracy,
    accDelta: w.accDelta,
    days,
    improved: diag.ready ? diag.improving.map(u=>u.label) : [],
    recovered: diag.recoveredWeek,
    mastered: diag.masteredWeek,
    focus: diag.ready && diag.weak ? diag.weak.label : null,
    goal
  };
}

/* Para Plan de estudio: si el punto débil es una familia de gramática,
   devuelve hasta n ejercicios de esa familia del nivel pedido. Primero
   los que la persona falló, luego los que no ha visto, y al final el
   resto; nunca los que respondió bien en los últimos 3 días, ni los que
   ya vienen en la misma sesión como repaso de errores (excludeIds). */
/* Ejercicios del tema elegido para el refuerzo del Plan (vocabulario o listening):
   primero los que falló, luego los que no ha visto; el resto del cupo lo completa
   la habilidad normal del nivel (igual que en gramática). */
function pickSkillFocusItems(skill, level, temaId, n, excludeIds){
  const bank = skill === 'vocabulario' ? (typeof VOCAB_BANK === 'undefined' ? null : VOCAB_BANK)
    : skill === 'listening' ? (typeof LISTENING_BANK === 'undefined' ? null : LISTENING_BANK)
    : skill === 'writing' ? (typeof WRITING_BANK === 'undefined' ? null : WRITING_BANK) : null;
  if(!temaId || !n || !bank || !bank[level]) return [];
  const idOf = skill === 'vocabulario' ? vocabTemaIdForItem : skill === 'listening' ? listeningTemaIdForItem : writingTemaIdForItem;
  const p = loadProgress();
  const recentOk = new Set(), everFailed = new Set(), seen = new Set();
  const cut = Date.now() - 3*86400000;
  (p.sessions || []).forEach(s=> (s.results || []).forEach(r=>{
    seen.add(r.itemId);
    if(r.isCorrect === false) everFailed.add(r.itemId);
    if(r.isCorrect === true && (s.startedAt || 0) >= cut) recentOk.add(r.itemId);
  }));
  const candidates = [];
  bank[level].forEach(variant=> variant.forEach(item=>{
    if(idOf(item.id) !== temaId) return;
    if(recentOk.has(item.id) || (excludeIds && excludeIds.has(item.id))) return;
    candidates.push(item);
  }));
  const rank = item => everFailed.has(item.id) ? 0 : (seen.has(item.id) ? 2 : 1);
  return shuffleArray(candidates).sort((a,b)=> rank(a) - rank(b)).slice(0, n).map(item => ({ kind: PLAN_SKILL_TO_KIND[skill], item, focus:true }));
}

function pickDiagFocusItems(level, familyId, n, excludeIds, temaId, microId){
  if(!familyId || !n || typeof GRAMMAR_BANK === 'undefined' || !GRAMMAR_BANK[level]) return [];
  const p = loadProgress();
  const recentOk = new Set(), everFailed = new Set(), seen = new Set();
  const cut = Date.now() - 3*86400000;
  (p.sessions || []).forEach(s=> (s.results || []).forEach(r=>{
    seen.add(r.itemId);
    if(r.isCorrect === false) everFailed.add(r.itemId);
    if(r.isCorrect === true && (s.startedAt || 0) >= cut) recentOk.add(r.itemId);
  }));
  const candidates = [];
  const temaItems = new Set();
  GRAMMAR_BANK[level].forEach(variant=> variant.forEach(group=>{
    const fam = diagFamilyForTopic(group.topic);
    if(!fam || fam.id !== familyId) return;
    const inTema = !!temaId && diagTemaIdForTopic(group.topic) === temaId;
    group.items.forEach(item=>{ if(!recentOk.has(item.id) && !(excludeIds && excludeIds.has(item.id))){ candidates.push(item); if(inTema) temaItems.add(item.id); } });
  }));
  // Primero los ejercicios del tema elegido; el resto de la familia solo completa el cupo.
  const rank = item => (microId && item.micro === microId ? -10 : 0) + (temaItems.has(item.id) ? 0 : 10) + (everFailed.has(item.id) ? 0 : (seen.has(item.id) ? 2 : 1));
  return shuffleArray(candidates)
    .sort((a,b)=> rank(a) - rank(b))
    .slice(0, n)
    .map(item => ({ kind:'grammar', item, focus:true }));
}


/* ---------- Tu diagnóstico: piezas visuales ---------- */
const DIAG_TONE_ICON = {
  up:   '<svg viewBox="0 0 24 24" fill="none"><path d="M5 15l6-6 4 4 4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 9l6 6 4-4 4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>',
  good: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function diagInsightsHtml(insights, max){
  return `<ul class="diag-insights">${insights.slice(0, max).map(i=>`<li class="diag-insight tone-${i.tone}"><span class="diag-insight-icon">${DIAG_TONE_ICON[i.tone]}</span><span>${i.text}</span></li>`).join('')}</ul>`;
}

function diagNotReadyText(diag){
  return diag.total === 0
    ? 'Completa tus primeros ejercicios y aquí verás qué estás mejorando y qué te conviene reforzar.'
    : `Todavía estamos conociendo tu progreso. Completa ${diag.remaining} ${diag.remaining === 1 ? 'ejercicio más' : 'ejercicios más'} y aquí verás qué estás mejorando y qué te conviene reforzar.`;
}

// Dibuja algo que depende de mistake_stats (Supabase): primero con lo
// que ya hay (sin esperar a la red) y, si llegan datos nuevos, se
// vuelve a dibujar una vez. Si la red falla, se queda lo local.
function diagRenderWithStats(paint){
  paint();
  if(_mistakeStatsCache instanceof Map) return;
  loadMistakeStatsMap().then(map=>{ if(map instanceof Map) paint(); }).catch(()=>{});
}

/* Tarjeta compacta del panel de miembros (miembros.html). Reemplaza el
   contenido de la antigua tarjeta "Así vas esta semana": mantiene sus
   3 números y cambia el mensaje genérico por el diagnóstico real. */
function renderProgressSummaryCard(container){
  if(!container) return;
  const ICON = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 19h16M7 19V10M12 19V5M17 19v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function paint(){
    const p = loadProgress();
    if(!p.sessions || !p.sessions.length){
      container.innerHTML = `
        <div class="progress-summary-head">
          <div class="progress-summary-icon">${ICON}</div>
          <div>
            <div class="progress-summary-eyebrow">Tu diagnóstico · con IA</div>
            <h2>Aún no tienes actividad</h2>
          </div>
        </div>
        <p class="progress-summary-insight">Completa tu primera sesión y aquí vas a ver cómo avanzas.</p>
        <a href="progreso.html" class="progress-summary-cta">Ver progreso completo →</a>`;
      return;
    }
    const weekly = computeWeeklyStats();
    const streak = computeStreak();
    const diag = computeDiagnosis(p);
    let body;
    if(!diag.ready){
      body = `<p class="progress-summary-insight">${diagNotReadyText(diag)}</p>`;
    } else if(diag.insights.length){
      body = diagInsightsHtml(diag.insights, 3);
    } else {
      body = `<p class="progress-summary-insight">${pickMiniProgressInsight(p, weekly, streak)}</p>`;
    }
    container.innerHTML = `
      <div class="progress-summary-head">
        <div class="progress-summary-icon">${ICON}</div>
        <div>
          <div class="progress-summary-eyebrow">Tu diagnóstico · con IA</div>
          <h2>Así vas esta semana</h2>
          <p class="progress-summary-sub">La IA analiza tu progreso y te dice qué conviene reforzar.</p>
        </div>
      </div>
      <div class="progress-summary-stats">
        <div class="progress-summary-stat">
          <span class="progress-summary-num">${weekly.exercises}</span>
          <span class="progress-summary-label">Ejercicios esta semana</span>
        </div>
        <div class="progress-summary-stat">
          <span class="progress-summary-num">${weekly.accuracy !== null ? weekly.accuracy + '%' : '—'}</span>
          <span class="progress-summary-label">Aciertos</span>
        </div>
        <div class="progress-summary-stat">
          <span class="progress-summary-num">${streak}</span>
          <span class="progress-summary-label">${streak === 1 ? 'Día de racha' : 'Días de racha'}</span>
        </div>
      </div>
      ${body}
      <a href="progreso.html#diagnostico" class="progress-summary-cta">${diag.ready ? 'Ver mi análisis con IA →' : 'Ver progreso completo →'}</a>`;
  }
  diagRenderWithStats(paint);
}

// El estado (chip) se decide con los aciertos recientes (u.current); si
// difieren del total se muestran ambos para que el chip no parezca
// contradecir el número.
function diagAccText(u){
  return u.current !== u.acc
    ? `Ahora ${u.current}% de aciertos (${u.acc}% en total)`
    : `${u.acc}% de aciertos en ${u.n} ejercicios`;
}

// Tema de Gramática que ya muestra "Hoy te conviene" (un tema de otra habilidad no cuenta: sus botones son otros).
function todayGrammarTema(diag){
  const t = diag && diag.today;
  return t && t.tema && (!t.temaSkill || t.temaSkill === 'gramatica') ? t.tema : null;
}
function diagUnitRowHtml(u, skipTemaId){
  // "Dentro de X, lo que más necesitas reforzar es Y": solo si hay datos
  // suficientes del tema; el enlace se omite si ya es el de "Hoy te conviene".
  let temaLine = '';
  const ft = u.focusTema;
  if(ft && u.state && (u.state === 'refuerzo' || u.state === 'practica')){
    const c = contentForTema(ft.id);
    if(c) temaLine = `<span class="diag-unit-tema">Dentro de ${u.label}, lo que más necesitas reforzar es <b>${c.label}</b>.</span>` +
      (ft.id === skipTemaId ? '' : `<span class="mistake-pattern-links">${temaLinksHtml(c, 'Practicar')}</span>`);
  }
  const detail = u.trend
    ? `Antes ${u.prevAcc}% · ahora ${u.recentAcc}%`
    : diagAccText(u);
  const arrow = u.trend === 'up' ? ' <span class="diag-arrow up">↑</span>' : (u.trend === 'down' ? ' <span class="diag-arrow down">↓</span>' : '');
  return `
    <li class="diag-unit">
      <div class="diag-unit-main">
        <span class="diag-unit-name">${u.label}</span>
        <span class="diag-unit-detail">${detail}${arrow}</span>
        ${temaLine}
      </div>
      <span class="diag-chip state-${u.state}">${DIAG_STATE_LABELS[u.state]}</span>
    </li>`;
}

const DIAG_STATE_ORDER = { refuerzo:0, practica:1, mejorando:2, bien:3, dominado:4 };

/* Sección completa en progreso.html (#diagnostico). Dibuja en varios
   contenedores para que la página siga el orden Resumen → Hoy te conviene
   → Diagnóstico → Habilidades → Temas → Semana. Los cálculos son los
   mismos de siempre; aquí solo cambia dónde y cuánto se muestra.
   els = { diag, today, skills, topics, topicsHead, week, fallbackToday, p } */
const DIAG_INSIGHTS_VISIBLE = 2;
const DIAG_TOPICS_VISIBLE = 3;

function diagMoreHtml(label, inner){
  return `<details class="diag-more"><summary>${label}</summary><div class="diag-more-body">${inner}</div></details>`;
}

function diagActionBodyHtml(a){
  return `
    <div>
      <div class="diag-action-title">${a.title}</div>
      <div class="diag-muted">${a.reason}</div>
      ${a.article ? `<a href="${a.article}" class="diag-action-article">${a.articleLabel || 'Leer la explicación'} →</a>` : ''}
    </div>`;
}

// "Hoy te conviene": la primera acción es la principal; las otras (máx. 2)
// quedan como opciones secundarias más discretas.
function diagTodayHtml(actions, voiceId){
  const [main, ...rest] = actions;
  return `
    <div class="diag-card diag-today-card">
      <h3 class="diag-h3">Hoy te conviene</h3>
      ${leoVozHtml(voiceId)}
      <div class="diag-action diag-action-main">
        ${diagActionBodyHtml(main)}
        <a href="${main.href}" class="btn btn-primary btn-sm">${main.cta}</a>
      </div>
      ${rest.length ? `
        <div class="diag-also-label">También te puede servir</div>
        <div class="diag-actions">
          ${rest.map(a=>`
            <div class="diag-action diag-action-alt">
              ${diagActionBodyHtml(a)}
              <a href="${a.href}" class="diag-action-link">${a.cta} →</a>
            </div>`).join('')}
        </div>` : ''}
    </div>`;
}

// Una sola lista de habilidades (antes eran dos secciones): la barra es
// cuánto del banco ya practicaste (computeSkillCoverage, igual que antes)
// y el estado viene del diagnóstico (aciertos), si ya hay datos.
function diagSkillsHtml(p, diag){
  const unitFor = skill => (diag && diag.ready) ? diag.units.find(u => u.key === 'skill:' + skill && u.state) : null;
  const skills = PROGRESS_SKILLS_DISPLAY.slice();
  // Lectura solo aparecía en el diagnóstico: se suma si ya tiene estado.
  if(unitFor('lectura')) skills.splice(skills.indexOf('listening') + 1, 0, 'lectura');
  return skills.map(skill=>{
    const pct = computeSkillCoverage(p, skill);
    const u = unitFor(skill);
    let detail = 'Practica un poco más para ver tu estado';
    if(u){
      const arrow = u.trend === 'up' ? ' <span class="diag-arrow up">↑</span>' : (u.trend === 'down' ? ' <span class="diag-arrow down">↓</span>' : '');
      detail = (u.trend ? `Aciertos: antes ${u.prevAcc}% · ahora ${u.recentAcc}%` : diagAccText(u)) + arrow;
      // Dentro de Vocabulario: el tema concreto (los botones están en "Hoy te conviene").
      if(u.focusTema && (u.state === 'refuerzo' || u.state === 'practica')){
        detail += `<span class="diag-unit-tema">Dentro de ${SKILL_LABELS[skill]}, lo que más necesitas reforzar es <b>${temaLabelOf(u.focusTema.id)}</b>.</span>`;
      }
    }
    return `
      <a href="${SKILL_PAGE[skill]}" class="skill-row-v2">
        <span class="skill-v2-top">
          <span class="skill-row-label">${SKILL_LABELS[skill]}</span>
          ${u ? `<span class="diag-chip state-${u.state}">${DIAG_STATE_LABELS[u.state]}</span>` : ''}
        </span>
        <span class="skill-v2-bar">
          <span class="skill-row-track"><span class="skill-row-fill" style="width:${pct}%;background:${SKILL_COLORS[skill]};"></span></span>
          <span class="skill-v2-pct">${pct}% practicado</span>
        </span>
        <span class="skill-v2-foot">
          <span class="skill-v2-detail">${detail}</span>
          <span class="skill-row-practice">Practicar →</span>
        </span>
      </a>`;
  }).join('');
}

function renderDiagnosisSection(els){
  if(!els || !els.diag) return;
  const container = els.diag;
  function paint(){
    const diag = computeDiagnosis();
    const week = computeWeeklyReport(diag);
    if(els.week) els.week.innerHTML = diagWeeklyHtml(week);
    if(els.skills) els.skills.innerHTML = diagSkillsHtml(els.p || loadProgress(), diag);
    if(!diag.ready){
      const pct = Math.round(Math.min(diag.total, DIAG.MIN_TOTAL) / DIAG.MIN_TOTAL * 100);
      if(els.today && els.fallbackToday) els.today.innerHTML = diagTodayHtml([els.fallbackToday]);
      container.innerHTML = `
        <div class="diag-card diag-wait">
          <p>${diagNotReadyText(diag)}</p>
          <div class="diag-wait-bar"><span style="width:${pct}%"></span></div>
          <p class="diag-muted">${diag.total} de ${DIAG.MIN_TOTAL} ejercicios calificados.</p>
        </div>`;
      if(els.topics) els.topics.innerHTML = '';
      if(els.topicsHead) els.topicsHead.hidden = true;
      return;
    }
    const s = diag.strength, w = diag.weak;
    const rated = diag.units.filter(u=>u.state).sort((a,b)=> (DIAG_STATE_ORDER[a.state] - DIAG_STATE_ORDER[b.state]) || (a.current - b.current));
    const familyRows = rated.filter(u=>u.type === 'family');

    // La acción principal empieza directo, igual que en el panel de
    // miembros (reemplaza a la vieja tarjeta "Continúa aprendiendo").
    if(els.today){
      const actions = diag.actions.slice();
      if(actions.length) actions[0] = Object.assign({}, actions[0], { href: todayStartHref(actions[0]), cta:'Empezar lo que me toca hoy' });
      // Progreso: si hay mejora real (diag.improving) y no urge repasar, Leo lo celebra;
      // si no, el mensaje de la acción principal.
      const v0 = actions.length ? actions[0].voice : null;
      const voiceId = v0 === 'repasa-antes' ? v0 : (diag.improving.length ? 'vas-mejorando' : v0);
      els.today.innerHTML = actions.length ? diagTodayHtml(actions, voiceId) : '';
      if(actions.length && voiceId) leoVozActivate();
    }

    const shown = diag.insights.slice(0, DIAG_INSIGHTS_VISIBLE);
    const hidden = diag.insights.slice(DIAG_INSIGHTS_VISIBLE, 6);
    container.innerHTML = `
      <div class="diag-highlights">
        <div class="diag-card diag-hl">
          <div class="diag-hl-label">Tu fortaleza</div>
          ${s ? `<div class="diag-hl-value">${s.label}</div><div class="diag-muted">${s.acc}% de aciertos en ${s.n} ejercicios</div>`
              : `<div class="diag-hl-value diag-hl-empty">Aún sin definir</div><div class="diag-muted">Necesitamos más ejercicios de una misma habilidad.</div>`}
        </div>
        <div class="diag-card diag-hl diag-hl-weak">
          <div class="diag-hl-label">Punto a reforzar</div>
          ${w ? `<div class="diag-hl-value">${w.label}</div><div class="diag-muted">${w.current}% de aciertos ahora${w.activeMistakes ? ` · ${w.activeMistakes} ${w.activeMistakes === 1 ? 'error pendiente' : 'errores pendientes'}` : ''}</div>`
              : `<div class="diag-hl-value diag-hl-empty">Nada urgente</div><div class="diag-muted">Todo lo que practicas va por encima de ${DIAG.WEAK_BELOW}%.</div>`}
        </div>
        <div class="diag-card diag-hl">
          <div class="diag-hl-label">Errores esta semana</div>
          <div class="diag-hl-value">${diag.recoveredWeek} ${diag.recoveredWeek === 1 ? 'recuperado' : 'recuperados'}</div>
          <div class="diag-muted">${diag.activeMistakes} ${diag.activeMistakes === 1 ? 'pendiente' : 'pendientes'} por repasar</div>
        </div>
      </div>

      ${shown.length ? `<div class="diag-card"><h3 class="diag-h3">Lo que vemos en tus respuestas</h3>${diagInsightsHtml(shown, DIAG_INSIGHTS_VISIBLE)}${hidden.length ? diagMoreHtml('Ver diagnóstico completo', diagInsightsHtml(hidden, hidden.length)) : ''}<div data-leo-ai-progress></div></div>` : '<div data-leo-ai-progress></div>'}`;

    if(els.topics){
      const top = familyRows.slice(0, DIAG_TOPICS_VISIBLE), rest = familyRows.slice(DIAG_TOPICS_VISIBLE);
      els.topics.innerHTML = familyRows.length ? `
        <div class="diag-card">
          <ul class="diag-units">${top.map(u => diagUnitRowHtml(u, todayGrammarTema(diag))).join('')}</ul>
          ${rest.length ? diagMoreHtml(`Ver todos los temas (${familyRows.length})`, `<ul class="diag-units">${rest.map(u => diagUnitRowHtml(u, todayGrammarTema(diag))).join('')}</ul>`) : ''}
          <p class="diag-muted diag-foot">Solo mostramos temas con al menos ${DIAG.MIN_UNIT} ejercicios respondidos, para no sacar conclusiones con muy pocos datos.</p>
        </div>` : '';
    }
    if(els.topicsHead) els.topicsHead.hidden = !familyRows.length;
    // Un solo botón de Leo AI para todo el progreso (antes había uno solo
    // para el punto débil): una llamada explica fortaleza, punto débil,
    // mejoras, errores repetidos y siguiente objetivo.
    const aiCtx = progressAiCtx(diag, week);
    if(aiCtx) leoAiAttach(container.querySelector('[data-leo-ai-progress]'), aiCtx);
  }
  diagRenderWithStats(paint);
}

// Compacto: ejercicios y % de aciertos de 7 días ya están en las tarjetas
// de arriba (van en una sola línea); "Errores" y "A reforzar" repiten el
// diagnóstico, así que quedan plegados en "Ver detalles".
function diagWeeklyHtml(week){
  // La variación de aciertos vs. la semana pasada ya está en la tarjeta de arriba.
  const main = [], extra = [];
  main.push(`<li><b>Practicaste:</b> ${week.days} ${week.days === 1 ? 'día' : 'días'} · ${week.exercises} ejercicios${week.accuracy !== null ? ` · ${week.accuracy}% de aciertos` : ''}</li>`);
  if(week.improved.length) main.push(`<li><b>Mejoraste en:</b> ${week.improved.join(', ')}</li>`);
  main.push(`<li><b>Siguiente objetivo:</b> ${week.goal}</li>`);
  if(week.recovered || week.mastered){
    const parts = [];
    if(week.recovered) parts.push(`${week.recovered} ${week.recovered === 1 ? 'recuperado' : 'recuperados'}`);
    if(week.mastered) parts.push(`${week.mastered} ${week.mastered === 1 ? 'dominado' : 'dominados'}`);
    extra.push(`<li><b>Errores:</b> ${parts.join(' y ')}</li>`);
  }
  if(week.focus) extra.push(`<li><b>A reforzar:</b> ${week.focus}</li>`);
  return `
    <div class="diag-card diag-week">
      <ul class="diag-week-list">${main.join('')}</ul>
      ${extra.length ? diagMoreHtml('Ver detalles', `<ul class="diag-week-list">${extra.join('')}</ul>`) : ''}
    </div>`;
}

/* ============================================================
   PERSONALIZACIÓN: "Qué pasó → Qué significa → Qué hacer ahora"
   ------------------------------------------------------------
   Todo se calcula aquí, con el mismo motor del diagnóstico
   (collectDiagAttempts, familias, mistake_stats) y SIN IA:
     - computeSessionInsight: análisis de la sesión que acaba de
       terminar (comparada con el historial anterior a esa sesión).
     - computeMistakePatterns: errores pendientes agrupados por
       familia/habilidad (para "Mis errores").
     - getTodayPick: la única recomendación principal del día
       (= diag.today, la primera acción del diagnóstico).
   Leo AI solo recibe un resumen corto de estos números (modo
   "insight") cuando el alumno toca el botón, y nunca decide qué
   contenido recomendar: los enlaces los pone siempre este código
   (contentForUnit), así nunca se recomienda algo que no existe.
   ============================================================ */
const SESSION_INSIGHT = {
  MIN_GRADED: 3,      // respuestas calificadas mínimas para opinar de una sesión
  UNIT_MIN_NOW: 3,    // respuestas de un tema HOY para compararlo
  UNIT_MIN_PREV: 6,   // respuestas de ese tema ANTES para compararlo
  DELTA: 15,          // puntos de % para decir "mejoraste"/"te costó más"
  PREV_DAYS: 35,      // "antes" = intentos de los últimos 35 días
  AI_MIN_GRADED: 5    // sesiones más cortas no ofrecen análisis con Leo AI
};

function unitLabelFromKey(key){
  const [type, id] = key.split(':');
  return type === 'family' ? DIAG_FAMILY_BY_ID[id].label : SKILL_LABELS[id];
}

// Enlace que empieza directo: el Plan con ?empezar=1; lo demás ya empieza solo.
function todayStartHref(action){
  if(!action || !action.href) return 'plan-estudio.html?empezar=1';
  if(/^plan-estudio\.html/.test(action.href) && action.href.indexOf('empezar=1') === -1){
    return action.href + (action.href.indexOf('?') === -1 ? '?' : '&') + 'empezar=1';
  }
  return action.href;
}

// La única recomendación principal ("Hoy te conviene"). Sin diagnóstico
// todavía, el Plan de estudio (que ya mezcla errores y nivel).
function getTodayPick(diag){
  if(diag && diag.ready && diag.today) return diag.today;
  return { title:'Tu plan de hoy', reason:'Una sesión armada según tu nivel y tus errores.', href:'plan-estudio.html', cta:'Empezar' };
}

/* Análisis de UNA sesión recién terminada. Se llama después de
   recordSession (el historial ya la incluye; se separa por startedAt).
   Devuelve null si no hay suficientes respuestas calificadas de los
   bancos de data.js (Speaking, exámenes, sesiones de 1-2 ejercicios). */
/* Cómo le fue en el tema que acaba de practicar y si todavía necesita refuerzo.
   Solo datos propios: respuestas de esta sesión + lo que ya calcula el
   diagnóstico por tema (diagTemaStats). Sin IA ni tablas nuevas. */
function temaSessionProgress(temaId, now, diag, onlySkill){
  if(typeof TEMA_BY_ID === 'undefined') return null;
  const index = getDiagItemIndex();
  const c = contentForTema(temaId, onlySkill);
  if(!index || !c) return null;
  // Solo cuentan ejercicios de la misma habilidad del tema (Gramática y Writing no se mezclan).
  const kindWanted = onlySkill === 'writing' ? 'writing' : ({ vocabulario:'vocab', listening:'listening' }[c.skill] || 'grammar');
  const mine = now.filter(a=>{ const f = index.get(a.itemId); return !a.lowEffort && !!f && f.kind === kindWanted && diagTemaIdForFound(f) === temaId; });
  if(mine.length < 2) return null;            // muy pocos para opinar del tema
  const ok = mine.filter(a=>a.ok).length;
  let stat = null;
  if(diag && diag.ready){
    const u = diag.units.find(x => x.key === c.unitKey);
    stat = (u && (u.temaStats || []).find(s => s.id === temaId)) || null;
  }
  // Con suficientes datos manda el mismo criterio del diagnóstico; si no, esta sesión.
  const needsMore = stat ? (!stat.dominated && (stat.current < DIAG.WEAK_BELOW || stat.activeMistakes >= 1)) : (ok / mine.length < 0.8);
  return { id: temaId, label: c.label, n: mine.length, ok, needsMore, content: c };
}

// Qué mensaje de voz de Leo acompaña esta sesión (null = ninguno). Solo usa
// lo que ya calcula computeSessionInsight y el diagnóstico (nearMastery).
function sessionVoiceId(ins, diag, touchedKeys){
  if(ins.n < SESSION_INSIGHT.MIN_GRADED) return null;
  const st = ins.struggle;
  if(ins.tema && ins.tema.needsMore && ins.acc >= 60) return 'sigue-tema';
  if(ins.acc < 70 && (ins.repeated >= 2 || (st && st.repeatedWrong >= 2))) return 'repasa-antes';
  if(ins.improved) return 'vas-mejorando';
  if(diag && diag.ready && ins.acc >= 80 && (diag.nearMastery || []).some(u => touchedKeys.has(u.key))) return 'casi-dominas';
  if(ins.acc >= 85) return 'buen-trabajo';
  if(ins.acc >= 60 && st) return 'sigue-tema';
  if(ins.acc < 60) return 'puedes-mejorar';
  return null;
}

function computeSessionInsight(results, startedAt, sessionSkill, opts){
  const index = getDiagItemIndex();
  if(!index || !Array.isArray(results)) return null;
  const now = [];
  results.forEach(r=>{
    if(r.isCorrect !== true && r.isCorrect !== false) return;
    const found = index.get(r.itemId);
    if(!found) return;
    const skill = r.skill || DIAG_KIND_TO_SKILL[found.kind];
    if(DIAG_SKILLS.indexOf(skill) === -1) return;
    const fam = skill === 'gramatica' ? diagFamilyForTopic(found.topic) : null;
    now.push({ itemId:r.itemId, ok:r.isCorrect, skill, family: fam ? fam.id : null, lowEffort: !!r.lowEffort });
  });
  if(now.length < SESSION_INSIGHT.MIN_GRADED) return null;

  const t0 = startedAt || Date.now();
  const prior = collectDiagAttempts(loadProgress()).filter(a => a.when < t0);
  const lastPrior = new Map(), everFailed = new Set();
  prior.forEach(a=>{ lastPrior.set(a.itemId, a.ok); if(!a.ok) everFailed.add(a.itemId); });

  const correct = now.filter(a=>a.ok).length;
  const ins = {
    n: now.length, correct, acc: diagPct(correct, now.length),
    recovered: now.filter(a => a.ok && lastPrior.get(a.itemId) === false).length,
    repeated: now.filter(a => !a.ok && everFailed.has(a.itemId)).length,
    lines: [], actions: [], struggle: null, improved: null, wrongIds: now.filter(a=>!a.ok).map(a=>a.itemId)
  };

  // Por tema (familia) y por habilidad: hoy vs. antes.
  const prevCut = t0 - SESSION_INSIGHT.PREV_DAYS*86400000;
  const units = new Map();
  function unit(key){
    if(!units.has(key)) units.set(key, { key, n:0, c:0, wrong:0, repeatedWrong:0, prevN:0, prevC:0 });
    return units.get(key);
  }
  now.forEach(a=>{
    ['skill:' + a.skill].concat(a.family ? ['family:' + a.family] : []).forEach(k=>{
      const u = unit(k); u.n++;
      if(a.ok) u.c++; else { u.wrong++; if(everFailed.has(a.itemId)) u.repeatedWrong++; }
    });
  });
  prior.forEach(a=>{
    if(a.when < prevCut) return;
    ['skill:' + a.skill].concat(a.family ? ['family:' + a.family] : []).forEach(k=>{
      if(!units.has(k)) return;
      const u = units.get(k); u.prevN++; if(a.ok) u.prevC++;
    });
  });
  const list = Array.from(units.values()).map(u => Object.assign(u, {
    acc: diagPct(u.c, u.n), prevAcc: diagPct(u.prevC, u.prevN), label: unitLabelFromKey(u.key)
  }));
  const comparable = list.filter(u => u.n >= SESSION_INSIGHT.UNIT_MIN_NOW && u.prevN >= SESSION_INSIGHT.UNIT_MIN_PREV);
  // Un tema concreto es más útil que "Gramática" en general.
  const famFirst = (a, b)=> (a.key.indexOf('family:') === 0 ? 0 : 1) - (b.key.indexOf('family:') === 0 ? 0 : 1);

  ins.improved = comparable.filter(u => u.acc - u.prevAcc >= SESSION_INSIGHT.DELTA)
    .sort((a,b)=> famFirst(a,b) || ((b.acc - b.prevAcc) - (a.acc - a.prevAcc)))[0] || null;
  const struggles = list.filter(u => u.wrong >= 2 || (u.wrong >= 1 && u.repeatedWrong >= 1));
  const hasFamilyStruggle = struggles.some(u => u.key.indexOf('family:') === 0);
  ins.struggle = struggles
    .filter(u => !(hasFamilyStruggle && u.key === 'skill:gramatica'))
    .sort((a,b)=> (b.wrong - a.wrong) || (b.repeatedWrong - a.repeatedWrong) || famFirst(a,b))[0] || null;
  if(ins.struggle && ins.improved && ins.struggle.key === ins.improved.key) ins.improved = null;
  // Si lo que más costó es una familia, ¿hay un tema concreto detrás de los fallos?
  ins.struggleTema = null;
  if(ins.struggle && (ins.struggle.key.indexOf('family:') === 0 || ins.struggle.key === 'skill:vocabulario' || ins.struggle.key === 'skill:listening' || ins.struggle.key === 'skill:writing') && typeof TEMAS !== 'undefined'){
    const fid = ins.struggle.key.slice(7);
    const inUnitNow = a => ins.struggle.key.indexOf('skill:') === 0 ? a.skill === ins.struggle.key.slice(6) : a.family === fid;
    const wrongHere = now.filter(a => !a.ok && inUnitNow(a)).map(a=>{
      const f = index.get(a.itemId);
      return { tema: diagTemaIdForFound(f), failCount: everFailed.has(a.itemId) ? 2 : 1 };
    });
    const top = dominantTema(wrongHere);
    if(top && (top.count >= 2 || top.count === wrongHere.length) && contentForTema(top.id, ins.struggle.key === 'skill:writing' ? 'writing' : undefined)) ins.struggleTema = top.id;
  }
  const dropped = ins.struggle && ins.struggle.prevN >= SESSION_INSIGHT.UNIT_MIN_PREV && ins.struggle.n >= SESSION_INSIGHT.UNIT_MIN_NOW
    && ins.struggle.prevAcc - ins.struggle.acc >= SESSION_INSIGHT.DELTA;

  let diag = null;
  try{ diag = computeDiagnosis(); }catch(e){ diag = null; }
  const weakKey = diag && diag.ready && diag.weak ? diag.weak.key : null;

  // Qué pasó (máximo 3 frases, cada una sale de un número real).
  if(correct === now.length){
    ins.lines.push({ tone:'good', text:`Sesión perfecta: ${correct} de ${now.length} correctas.` });
  }
  if(ins.improved){
    const u = ins.improved;
    ins.lines.push({ tone:'up', text: u.key.indexOf('skill:') === 0
      ? `Tu ${u.label} mejoró respecto a tus sesiones anteriores: ${u.acc}% hoy, ${u.prevAcc}% antes.`
      : `Hoy mejoraste en ${u.label}: ${u.acc}% de aciertos, antes ibas en ${u.prevAcc}%.` });
  }
  if(ins.struggle){
    const u = ins.struggle;
    let text;
    if(dropped) text = `Hoy te costó más ${u.label} que de costumbre: ${u.acc}% hoy, ${u.prevAcc}% antes.`;
    else if(u.repeatedWrong || u.key === weakKey) text = `Sigues fallando con ${u.label}: ${u.wrong} ${u.wrong === 1 ? 'error' : 'errores'} hoy.`;
    else text = `Hoy te costó ${u.label}: fallaste ${u.wrong} de ${u.n}.`;
    ins.lines.push({ tone: dropped ? 'down' : 'warn', text });
  }
  if(ins.recovered){
    ins.lines.push({ tone:'up', text: ins.recovered === 1
      ? 'Corregiste 1 ejercicio que antes habías fallado.'
      : `Corregiste ${ins.recovered} ejercicios que antes habías fallado.` });
  }
  if(ins.repeated >= 2 && !(ins.struggle && ins.struggle.repeatedWrong >= ins.repeated)){
    ins.lines.push({ tone:'warn', text:`Volviste a fallar ${ins.repeated} ejercicios que ya habías fallado antes.` });
  }
  if(!ins.struggle && ins.acc < 50 && now.length >= 6){
    ins.lines.push({ tone:'down', text:`Fue una sesión difícil: ${correct} de ${now.length} correctas. Repasar ahora ayuda a fijarlo.` });
  }
  if(!ins.lines.length){
    ins.lines.push({ tone:'good', text:`${correct} de ${now.length} correctas (${ins.acc}%).` });
  }
  // Práctica enfocada en un tema (Plan con ?tema=): cómo le fue en ESE tema.
  ins.tema = (opts && opts.focusTema) ? temaSessionProgress(opts.focusTema, now, diag, opts.focusSkill) : null;
  if(ins.tema){
    const tp = ins.tema;
    ins.lines.unshift({ tone: tp.needsMore ? 'warn' : 'good', text: tp.needsMore
      ? `En ${tp.label} acertaste ${tp.ok} de ${tp.n}. Todavía conviene reforzarlo.`
      : `En ${tp.label} acertaste ${tp.ok} de ${tp.n}. Ya vas bien en este tema.` });
  }
  // Microtemas ACTIVOS tocados en esta sesión con refuerzo o comprobación pendiente (la señal ya se guardó en recordSession).
  let microActs = [];
  try{
    const mIndex = getMistakesItemIndex(), touchedMicros = new Set();
    results.forEach(r => { const mm = r && microOfItem(r.itemId, mIndex); if(mm) touchedMicros.add(mm); });
    if(touchedMicros.size) microActs = microDiagActions(getUserLevel(), touchedMicros);
  }catch(e){ microActs = []; }
  if(microActs.length){
    const ma = microActs[0], mm = MICRO_BY_ID[ma.micro];
    ins.lines.unshift({ tone: ma.microState === 'listo-comprobar' ? 'good' : 'warn', text: ma.microState === 'listo-comprobar'
      ? `Ya practicaste ${mm.label}. Puedes comprobar si ya lo dominas.`
      : `En ${mm.label} fallaste ejercicios distintos: es un punto concreto para reforzar.` });
  }
  ins.lines = ins.lines.slice(0, 3);
  ins.voice = sessionVoiceId(ins, diag, new Set(list.map(u => u.key)));

  // Lo mejor para hacer ahora (máximo 3, sin repetir destino).
  const seen = new Set();
  const push = (title, href, main)=>{
    if(ins.actions.length >= 3 || !href || seen.has(href)) return;
    seen.add(href); ins.actions.push({ title, href, main: !!main });
  };
  const microTemaCovered = microActs.length ? microActs[0].tema : null;
  if(microActs.length){
    const ma = microActs[0];
    push(ma.title, ma.href, true);
    if(ma.article) push(`${ma.articleLabel}: ${MICRO_BY_ID[ma.micro].label}`, ma.article);
  }
  if(microTemaCovered && ((ins.tema && ins.tema.id === microTemaCovered) || ins.struggleTema === microTemaCovered)){
    // el tema ya está cubierto por la recomendación del microtema: no se repite en genérico
  } else if(ins.tema && ins.tema.needsMore){
    // Sigue débil: continuar con el tema y, si existe, su clase o explicación rápida.
    push(`Seguir practicando ${ins.tema.label}`, ins.tema.content.practiceHref, true);
    if(ins.tema.content.article) push(`${ins.tema.content.articleLabel}: ${ins.tema.label}`, ins.tema.content.article);
  } else if(ins.struggle){
    const [type, id] = ins.struggle.key.split(':');
    const tc = ins.struggleTema ? contentForTema(ins.struggleTema, ins.struggle.key === 'skill:writing' ? 'writing' : undefined) : null;
    const c = tc || contentForUnit(type, id);
    if(c){
      push(c.practiceLabel, c.practiceHref, true);
      if(tc){ if(tc.article) push(`${tc.articleLabel}: ${tc.label}`, tc.article); }
      else if(c.article) push(`Leer la explicación de ${c.articleTitle}`, c.article);
    }
  }
  if(ins.correct < ins.n && (ins.n - ins.correct >= 2 || ins.repeated)) push('Hacer un repaso rápido', 'errores.html?modo=rapido', !ins.actions.length);
  const today = getTodayPick(diag);
  const todayHref = todayStartHref(today);
  const sameTema = (ins.tema && today && today.tema === ins.tema.id && (today.temaSkill || 'gramatica') === ins.tema.content.skill)      // ya está arriba como "seguir practicando"
    || (today && today.micro && microActs.some(a => a.micro === today.micro));                                                                  // o como recomendación del microtema
  if(!sameTema && !(sessionSkill === 'plan' && /^plan-estudio\.html/.test(todayHref) && !/foco=/.test(todayHref))){
    push(today.title, todayHref, !ins.actions.length);
  }
  return ins;
}

// "Pregunta → respuesta correcta" de un ejercicio, corto, para que Leo AI
// pueda ver patrones (los resultados no guardan qué respondió el alumno).
function leoAiItemBrief(found){
  if(!found) return null;
  const it = found.item || {};
  let q = '', a = '';
  if(found.kind === 'grammar'){
    if(it.type === 'choice'){ q = it.prompt; a = (it.options || [])[it.correct]; }
    else if(it.type === 'fill'){ q = (it.sentence || []).map((w, i) => i === it.blankIndex ? '___' : w).join(' '); a = it.correct; }
    else if(it.type === 'error'){ q = it.wrong; a = it.right; }
  } else if(found.kind === 'vocab'){ q = (it.quiz || {}).prompt || it.word; a = `${it.word} = ${it.translation}`; }
  else if(found.kind === 'listening' || found.kind === 'reading'){ q = it.question; a = (it.options || [])[it.correct]; }
  else if(found.kind === 'writing'){ q = it.prompt; a = it.example && it.example.en; }
  q = leoAiText(q, 140); a = leoAiText(a, 100);
  if(!q || !a) return null;
  return (found.topic ? leoAiText(found.topic, 60) + ': ' : '') + q + ' → ' + a;
}
function leoAiExamples(ids, max){
  const index = getDiagItemIndex();
  const out = [];
  for(let i = 0; index && i < ids.length && out.length < max; i++){
    const b = leoAiItemBrief(index.get(ids[i]));
    if(b && out.indexOf(b) === -1) out.push(b);
  }
  return out;
}

/* Temas que Leo AI PUEDE sugerir además de lo que la página ya muestra:
   ids del registro (máx. 3): primero los prerrequisitos de los temas en foco
   y luego otros temas flojos del diagnóstico. Nunca incluye los ya mostrados. */
function leoAiTemaPool(mainIds, shownIds){
  if(typeof TEMAS === 'undefined') return [];
  const skip = new Set((shownIds || []).concat(mainIds || []));
  const out = [];
  const add = id => { if(id && !skip.has(id) && out.indexOf(id) === -1 && out.length < 3 && contentForTema(id)) out.push(id); };
  (mainIds || []).forEach(id => ((TEMA_BY_ID[id] && TEMA_BY_ID[id].prereq) || []).forEach(add));
  try{
    const diag = computeDiagnosis();
    if(diag && diag.ready){
      const all = [];
      diag.units.forEach(u => { if(u.key === 'skill:writing') return; (u.temaStats || []).forEach(s => { if(!s.dominated && (s.current < DIAG.WEAK_BELOW || s.activeMistakes >= 1)) all.push(s); }); });
      all.sort((a,b)=> b.score - a.score).forEach(s => add(s.id));
    }
  }catch(e){}
  return out;
}
const temaLabelOf = id => (typeof TEMA_BY_ID !== 'undefined' && TEMA_BY_ID[id]) ? TEMA_BY_ID[id].label : '';

/* ---------- Clases (artículos): "Practicar este tema →" para miembros ----------
   El tema sale de temas.js (el que tiene este archivo como clase). Si el sistema
   mandó al alumno aquí (?tema=&via=rec) se le recuerda por qué y se le ofrece
   volver a su Plan. Para quien no es miembro la clase queda exactamente igual. */
function temaPracticeHref(t){ return temaPlanHref(t, true); }
function pickArticleTema(candidates){
  if(candidates.length === 1) return candidates[0];
  try{
    if(typeof computeDiagnosis === 'function' && typeof GRAMMAR_BANK !== 'undefined'){
      const d = computeDiagnosis();
      if(d && d.ready){
        const all = [];
        d.units.forEach(u => (u.temaStats || []).forEach(s => { if(candidates.some(t => t.id === s.id) && !s.dominated) all.push(s); }));
        all.sort((a,b)=> b.score - a.score);
        if(all[0]) return candidates.find(t => t.id === all[0].id);
      }
    }
  }catch(e){}
  return candidates[0];
}
function renderArticleTema(file, params, body){
  const here = TEMAS.filter(t => t.article === file && (t.family || TEMA_SKILL_KEY[t.skill]));
  if(!here.length || !body || body.querySelector('.tema-cta')) return false;
  const asked = params.get('tema');
  const fromRec = here.find(t => t.id === asked) || null;
  const tema = fromRec || pickArticleTema(here);
  const viaRec = !!fromRec && params.get('via') === 'rec';
  const block = document.createElement('div');
  block.className = 'tema-cta';
  block.innerHTML = `<div class="tema-cta-title">¿Listo para practicarlo?</div>
    <p>Ejercicios de <b>${tema.label}</b> en tu Plan de estudio.</p>
    <div class="tema-cta-actions"><a class="btn btn-primary" href="${temaPracticeHref(tema)}">Practicar este tema →</a>${viaRec ? '<a class="tema-cta-back" href="plan-estudio.html">Volver a mi Plan</a>' : ''}</div>`;
  const free = body.querySelector('.article-cta');   // la invitación a "practicar gratis" no aplica a miembros
  if(free){ free.parentNode.insertBefore(block, free); free.hidden = true; free.style.display = 'none'; }
  else body.appendChild(block);
  if(viaRec){
    const ctx = document.createElement('p');
    ctx.className = 'tema-context';
    ctx.innerHTML = `Llegaste aquí para reforzar <b>${tema.label}</b>.`;
    const meta = body.querySelector('.article-meta');
    if(meta) meta.parentNode.insertBefore(ctx, meta.nextSibling); else body.insertBefore(ctx, body.firstChild);
  }
  return true;
}
// ¿Hay una sesión de cuenta guardada en este navegador? (solo para no hacer trabajo de más a los
// visitantes; la membresía real se verifica con LeoBackend.getMemberProfile).
function hasLocalAccountHint(){
  try{
    if(localStorage.getItem('leo_member_hint')) return true;
    for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i) || ''; if(/^sb-.*-auth-token$/.test(k)) return true; }
  }catch(e){}
  return false;
}
function initArticleTema(){
  try{
    if(typeof TEMAS === 'undefined' || typeof LeoBackend === 'undefined' || !hasLocalAccountHint() || !LeoBackend.isConfigured()) return;
    const file = location.pathname.split('/').pop() || '';
    if(!TEMAS.some(t => t.article === file && (t.family || TEMA_SKILL_KEY[t.skill]))) return;
    const body = document.querySelector('.article-body');
    if(!body) return;
    LeoBackend.getMemberProfile().then(profile=>{
      if(profile && profile.is_member) renderArticleTema(file, new URLSearchParams(location.search), body);
    }).catch(()=>{});
  }catch(e){}
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initArticleTema);
else initArticleTema();

function sessionInsightAiCtx(ins){
  if(ins.n < SESSION_INSIGHT.AI_MIN_GRADED || (ins.correct === ins.n && !ins.improved)) return null;
  const facts = [`Ejercicios: ${ins.n}, correctos: ${ins.correct} (${ins.acc}%)`].concat(ins.lines.map(l => l.text));
  if(ins.struggle) facts.push(`Principal dificultad: ${ins.struggle.label} (${ins.struggle.wrong} de ${ins.struggle.n} mal)`);
  // Ejemplos: primero los fallos del tema que más costó.
  let ids = ins.wrongIds;
  if(ins.struggle){
    const index = getDiagItemIndex();
    const [type, id] = ins.struggle.key.split(':');
    const inUnit = itemId => { const f = index.get(itemId); if(!f) return false;
      if(type === 'skill') return DIAG_KIND_TO_SKILL[f.kind] === id;
      const fam = diagFamilyForTopic(f.topic); return !!fam && fam.id === id; };
    ids = ids.filter(inUnit).concat(ids.filter(x => !inUnit(x)));
  }
  const mainTema = ins.tema ? ins.tema.id : ins.struggleTema;
  const main = mainTema ? [mainTema] : [];
  return { kind:'insight', scope:'session', facts, examples: leoAiExamples(ids, 3),
    shown: ins.tema ? [ins.tema.label] : (ins.struggle ? [ins.struggleTema ? temaLabelOf(ins.struggleTema) : ins.struggle.label] : []),
    candidates: leoAiTemaPool(main, main), label:'Analizar mi sesión con Leo AI' };
}

function sessionInsightHtml(ins){
  return `
    <div class="sess-insight">
      <div class="sess-insight-label">Qué pasó hoy</div>
      ${diagInsightsHtml(ins.lines, 3)}
      ${leoVozHtml(ins.voice)}
      ${ins.actions.length ? `
        <div class="sess-insight-label sess-insight-next">Lo mejor para hacer ahora</div>
        <div class="sess-next">
          ${ins.actions.map(a=>`<a href="${a.href}" class="sess-next-link${a.main ? ' is-main' : ''}"><span>${a.title}</span><span aria-hidden="true">→</span></a>`).join('')}
        </div>` : ''}
      <div data-leo-ai-session></div>
    </div>`;
}

/* Pone el análisis dentro de la pantalla final de la sesión (justo antes
   de los botones). Nunca rompe la pantalla final: si algo falla, no
   aparece nada y todo sigue igual que antes. */
function appendSessionInsight(container, results, startedAt, sessionSkill, opts){
  try{
    const summary = container && container.querySelector('.session-summary');
    if(!summary) return;
    const ins = computeSessionInsight(results, startedAt, sessionSkill, opts);
    if(!ins) return;
    const holder = document.createElement('div');
    holder.innerHTML = sessionInsightHtml(ins);
    const block = holder.firstElementChild;
    const anchor = summary.querySelector('.summary-actions');
    if(anchor) summary.insertBefore(block, anchor); else summary.appendChild(block);
    const ai = sessionInsightAiCtx(ins);
    if(ai) leoAiAttach(block.querySelector('[data-leo-ai-session]'), ai);
    if(ins.voice) leoVozActivate();
  }catch(e){ /* el resumen normal ya está en pantalla */ }
}

/* Errores pendientes agrupados por familia de gramática o habilidad.
   Mismo origen que el diagnóstico (mistake_stats o, sin red, la regla de
   Mis errores). null si no hay datos de los bancos. */
function computeMistakePatterns(statsMap){
  const index = getDiagItemIndex();
  if(!index) return null;
  const active = diagMistakeSummary(collectDiagAttempts(loadProgress()), statsMap, Date.now()).active;
  const groups = new Map();
  active.forEach(m=>{
    const key = m.family ? 'family:' + m.family : 'skill:' + m.skill;
    if(!groups.has(key)) groups.set(key, { key, label: unitLabelFromKey(key), count:0, repeated:0, items:[] });
    const g = groups.get(key);
    g.count++; if(m.failCount >= 2) g.repeated++;
    g.items.push(m);
  });
  const sorted = Array.from(groups.values()).sort((a,b)=> (b.count - a.count) || (b.repeated - a.repeated));
  sorted.forEach(g=>{
    g.items.sort((a,b)=> b.failCount - a.failCount);
    const [type, id] = g.key.split(':');
    g.content = contentForUnit(type, id);
    // Tema que más errores concentra dentro de la familia (registro de temas).
    const dt = (type === 'family' || g.key === 'skill:vocabulario' || g.key === 'skill:listening' || g.key === 'skill:writing') ? dominantTema(g.items) : null;
    g.temaContent = dt ? contentForTema(dt.id, g.key === 'skill:writing' ? 'writing' : undefined) : null;
    // En "Mis errores", repasar una habilidad sin familia = filtro por habilidad.
    const kind = Object.keys(DIAG_KIND_TO_SKILL).find(k => DIAG_KIND_TO_SKILL[k] === id);
    g.reviewHref = type === 'skill' && ['grammar','vocab','listening','writing'].indexOf(kind) !== -1 ? 'errores.html?skill=' + kind : null;
  });
  return {
    total: active.length,
    repeatedTotal: active.filter(m => m.failCount >= 2).length,
    groups: sorted.slice(0, 3),
    otherCount: sorted.slice(3).reduce((n, g)=> n + g.count, 0)
  };
}

function mistakePatternsAiCtx(pat){
  if(pat.total < 3) return null;
  const facts = [`Errores pendientes: ${pat.total}, fallados más de una vez: ${pat.repeatedTotal}`];
  pat.groups.forEach(g => facts.push(`${g.label}: ${g.count} ${g.count === 1 ? 'error' : 'errores'}${g.repeated ? `, ${g.repeated} repetidos` : ''}`));
  if(pat.otherCount) facts.push(`Otros temas: ${pat.otherCount} errores sueltos`);
  // Ejemplos: los más fallados de los grupos principales, alternando grupos.
  const ids = [];
  for(let i = 0; i < 3 && ids.length < 6; i++) pat.groups.forEach(g => { if(g.items[i]) ids.push(g.items[i].itemId); });
  const shownIds = pat.groups.map(g => g.temaContent ? g.temaContent.id : null).filter(Boolean);
  return { kind:'insight', scope:'mistakes', facts, examples: leoAiExamples(ids, 3),
    shown: pat.groups.map(g => g.temaContent ? g.temaContent.label : g.label),
    candidates: leoAiTemaPool(shownIds.slice(0, 1), shownIds), label:'Analizar mis errores con Leo AI' };
}

/* Tarjeta "Tus patrones de error" en errores.html (arriba del repaso). */
async function renderMistakePatterns(container){
  if(!container) return;
  try{
    await backfillMistakeStatsIfNeeded();
    const statsMap = await loadMistakeStatsMap();
    const pat = computeMistakePatterns(statsMap);
    if(!pat || pat.total < 3 || !pat.groups.length){ container.hidden = true; return; }
    const top = pat.groups[0];
    const share = Math.round(top.count / pat.total * 100);
    const lead = (top.count >= 2 && share >= 30)
      ? `${share}% de tus errores pendientes son de <b>${top.label}</b>.`
      : `Tus errores están repartidos entre varios temas.`;
    container.innerHTML = `
      <div class="diag-card mistake-patterns">
        <h2 class="diag-h3">Tus patrones de error</h2>
        <p class="diag-muted">${lead}${pat.repeatedTotal ? ` ${pat.repeatedTotal} ${pat.repeatedTotal === 1 ? 'ejercicio lo fallaste' : 'ejercicios los fallaste'} más de una vez.` : ''}</p>
        <ul class="diag-units">
          ${pat.groups.map(g=>`
            <li class="diag-unit mistake-pattern">
              <div class="diag-unit-main">
                <span class="diag-unit-name">${g.label}</span>
                <span class="diag-unit-detail">${g.count} ${g.count === 1 ? 'error' : 'errores'}${g.repeated ? ` · ${g.repeated} ${g.repeated === 1 ? 'repetido' : 'repetidos'}` : ''}</span>
                ${g.temaContent ? `<span class="diag-unit-tema">Sobre todo en <b>${g.temaContent.label}</b>.</span>` : ''}
                <span class="mistake-pattern-links">
                  ${g.temaContent
                    ? temaLinksHtml(g.temaContent, 'Reforzar en mi Plan')
                    : `${g.content ? `<a href="${g.key.indexOf('family:') === 0 ? g.content.practiceHref : (g.reviewHref || g.content.practiceHref)}">${g.key.indexOf('family:') === 0 ? 'Reforzar en mi Plan' : 'Repasar estos errores'}</a>` : ''}
                  ${g.content && g.content.article ? `<a href="${g.content.article}">Leer la explicación</a>` : ''}`}
                </span>
              </div>
            </li>`).join('')}
        </ul>
        ${pat.repeatedTotal >= 3 ? leoVozHtml('repasa-antes') : ''}
        <div data-leo-ai-mistakes></div>
      </div>`;
    container.hidden = false;
    if(pat.repeatedTotal >= 3) leoVozActivate();
    const ai = mistakePatternsAiCtx(pat);
    if(ai) leoAiAttach(container.querySelector('[data-leo-ai-mistakes]'), ai);
  }catch(e){ container.hidden = true; }
}

function progressAiCtx(diag, week){
  if(!diag || !diag.ready) return null;
  const facts = [`Esta semana: ${week.exercises} ejercicios en ${week.days} ${week.days === 1 ? 'día' : 'días'}${week.accuracy !== null ? `, ${week.accuracy}% de aciertos` : ''}`];
  if(diag.strength) facts.push(`Fortaleza: ${diag.strength.label} (${diag.strength.acc}% en ${diag.strength.n} ejercicios)`);
  if(diag.weak) facts.push(`Punto a reforzar: ${diag.weak.label} (${diag.weak.current}% ahora${diag.weak.activeMistakes ? `, ${diag.weak.activeMistakes} errores pendientes` : ''})`);
  diag.improving.slice(0, 2).forEach(u => facts.push(`Mejoró: ${u.label} (de ${u.prevAcc}% a ${u.recentAcc}%)`));
  diag.declining.slice(0, 1).forEach(u => facts.push(`Bajó: ${u.label} (de ${u.prevAcc}% a ${u.recentAcc}%)`));
  diag.repeated.slice(0, 2).forEach(r => facts.push(`Errores repetidos en ${r.label}: ${r.count}`));
  if(diag.nearMastery.length) facts.push(`Cerca de dominar: ${diag.nearMastery[0].label} (${diag.nearMastery[0].acc}%)`);
  if(diag.mastered.length) facts.push(`Ya domina: ${diag.mastered.slice(0, 3).map(u => u.label).join(', ')}`);
  if(diag.recoveredWeek) facts.push(`Errores recuperados esta semana: ${diag.recoveredWeek}`);
  facts.push(`Siguiente objetivo: ${week.goal}`);
  const mainTema = diag.today && diag.today.tema ? diag.today.tema : (diag.weak && diag.weak.focusTema ? diag.weak.focusTema.id : null);
  const main = mainTema ? [mainTema] : [];
  return { kind:'insight', scope:'progress', facts: facts.slice(0, 5), examples: [],
    shown: [mainTema ? temaLabelOf(mainTema) : (diag.today ? diag.today.title : '')].filter(Boolean),
    candidates: leoAiTemaPool(main, main), label:'Explícame mi progreso' };
}

/* Panel de miembros: la tarjeta principal "Recomendado" pasa a decir qué
   te toca hoy (misma acción que "Hoy te conviene" del diagnóstico) y
   empieza directo. Sin diagnóstico todavía queda la tarjeta del Plan
   tal cual está en el HTML. */
function renderTodayHero(el){
  if(!el) return;
  function paint(){
    let diag = null;
    try{ diag = computeDiagnosis(); }catch(e){ diag = null; }
    if(!diag || !diag.ready || !diag.today) return;
    const t = diag.today;
    const card = document.createElement('div');
    card.className = 'plan-feature-card plan-feature-hero today-hero';
    card.id = el.id || '';
    card.innerHTML = `
      <span class="plan-feature-badge">Recomendado</span>
      <div class="plan-feature-icon">
        <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l3 3 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>
      </div>
      <div class="today-hero-eyebrow">Hoy te conviene</div>
      <h2>${t.title}</h2>
      <p class="plan-feature-desc">${t.reason}</p>
      ${leoVozHtml(t.voice)}
      <a href="${todayStartHref(t)}" class="btn btn-primary btn-block">Empezar lo que me toca hoy →</a>
      <div class="today-hero-links">
        ${t.article ? `<a href="${t.article}">${t.articleLabel || 'Leer la explicación'}</a>` : ''}
        ${/^plan-estudio\.html$/.test(t.href) ? '' : '<a href="plan-estudio.html">Ver mi Plan de estudio</a>'}
      </div>`;
    el.replaceWith(card);
    el = card;
    if(t.voice) leoVozActivate();
  }
  diagRenderWithStats(paint);
}

/* ============================================================
   PÁGINA DE PROGRESO (progreso.html)
   ============================================================ */
/* ---------- Estadísticas semanales con comparación vs. la semana anterior ---------- */
function computeWeeklyStatsWithDelta(){
  const p = loadProgress();
  const now = Date.now();
  const thisWeek = p.sessions.filter(s => (s.startedAt||0) >= now - 7*86400000);
  const lastWeek = p.sessions.filter(s => (s.startedAt||0) >= now - 14*86400000 && (s.startedAt||0) < now - 7*86400000);

  function summarize(list){
    const exercises = list.reduce((n,s)=> n + (s.results ? s.results.length : 0), 0);
    const graded = [];
    list.forEach(s => { if(s.skill === 'check') return; (s.results||[]).forEach(r=>{ if(r.isCorrect === true || r.isCorrect === false) graded.push(r); }); });
    const correct = graded.filter(r=>r.isCorrect).length;
    const accuracy = graded.length ? Math.round(correct / graded.length * 100) : null;
    const minutes = Math.round(list.reduce((n,s)=> n + (s.durationMs||0), 0) / 60000);
    return { exercises, accuracy, minutes };
  }

  const current = summarize(thisWeek);
  const previous = summarize(lastWeek);
  return {
    current, previous,
    exDelta: current.exercises - previous.exercises,
    accDelta: (current.accuracy !== null && previous.accuracy !== null) ? current.accuracy - previous.accuracy : null,
    hasData: thisWeek.length >= MIN_SESSIONS_FOR_STATS
  };
}

function statDeltaHtml(delta, unit){
  if(delta === null || delta === undefined) return '';
  if(delta > 0) return `<div class="stat-card-delta up">↗ +${delta}${unit} que la semana pasada</div>`;
  if(delta < 0) return `<div class="stat-card-delta down">↘ ${delta}${unit} que la semana pasada</div>`;
  return `<div class="stat-card-delta flat">— Igual que la semana pasada</div>`;
}

/* ---------- Mensaje de progreso por habilidad (chip de color) ---------- */
function skillFeedback(pct, attempted){
  if(!attempted) return { text:'Aún no has empezado.', tone:'neutral' };
  if(pct >= 100) return { text:'¡Completaste esta habilidad!', tone:'good' };
  if(pct >= 60) return { text:'¡Vas muy bien! Sigue así.', tone:'good' };
  if(pct >= 25) return { text:'Buen comienzo. Sigue practicando.', tone:'mid' };
  return { text:'Aquí puedes mejorar. ¡Tú puedes!', tone:'low' };
}

/* ---------- Selector de nivel (modal ligero, reutiliza el estilo del onboarding) ---------- */
function openLevelSwitcher(onChanged){
  const overlay = document.createElement('div');
  overlay.className = 'onb-overlay';
  overlay.innerHTML = `
    <div class="onb-card">
      <h2>Cambiar tu nivel</h2>
      <p>Esto ajusta la dificultad de los ejercicios que ves en cada habilidad.</p>
      <div class="onb-field" id="lvlSwitchLevels" style="display:grid;gap:12px;"></div>
      <button class="btn btn-ghost btn-block" id="lvlSwitchCancel" style="margin-top:6px;">Cancelar</button>
    </div>`;
  document.body.appendChild(overlay);
  renderLevelSelector(document.getElementById('lvlSwitchLevels'), getUserLevel(), (lvl)=>{
    setUserLevel(lvl);
    overlay.remove();
    if(typeof onChanged === 'function') onChanged(lvl);
  });
  overlay.querySelector('#lvlSwitchCancel').addEventListener('click', ()=> overlay.remove());
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.remove(); });
}

/* Mini fila de días dentro de la tarjeta "Días de racha" (no una
   sección grande aparte: ver .streak-dots/renderStreakCard, que es la
   versión grande usada antes y que se dejó de mostrar). Reutiliza
   exactamente la misma fuente de verdad que renderStreakCard
   (computeActiveStreakDates + getFrozenStreakDate): un día se pinta
   "hecho" solo si es parte de la racha activa (sin huecos hasta hoy,
   no simple asistencia de la semana), "congelado" (❄) si es el día
   protegido por un freeze sin contar como practicado, y vacío si no
   hubo actividad — nunca se inventa un cuarto estado. */
function miniStreakDaysHtml(){
  const streakDates = new Set(computeActiveStreakDates());
  const frozenDate = getFrozenStreakDate();
  const days = computeWeeklyBarData();
  return days.map(d=>{
    const inStreak = streakDates.has(d.date);
    const frozen = d.date === frozenDate;
    const cls = ['mini-streak-dot'];
    if(inStreak) cls.push('done');
    if(frozen) cls.push('frozen');
    if(d.isToday) cls.push('today');
    return `<span class="${cls.join(' ')}" title="${d.label}">${frozen ? '❄' : ''}</span>`;
  }).join('');
}

function renderProgressStatCards(container, stats, streak, level){
  if(!container) return;
  const accText = stats.current.accuracy === null ? '—' : stats.current.accuracy + '%';
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--violet-tint);color:var(--violet);">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Ejercicios esta semana</div>
        <div class="stat-card-value">${stats.current.exercises}</div>
        ${statDeltaHtml(stats.exDelta, '')}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--green-tint);color:var(--green);">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Aciertos (7 días)</div>
        <div class="stat-card-value">${accText}</div>
        ${statDeltaHtml(stats.accDelta, '%')}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--coral-tint);color:var(--coral);">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1.5-1-2-1-2s2 1 2 4a5 5 0 01-10 0c0-5 4-6 4-9 0-1-.5-2-.5-2s2 0 2.5 0z" fill="currentColor"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Días de racha</div>
        <div class="stat-card-value">${streak}</div>
        <div class="mini-streak-row">${miniStreakDaysHtml()}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--blue-tint);color:var(--blue);">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4-8 4-8-4 8-4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Nivel actual</div>
        <div class="stat-card-value">${LEVEL_META[level].label}</div>
        <button type="button" class="stat-card-link" id="statChangeLevelBtn">Ajustar nivel →</button>
      </div>
    </div>`;
  const changeLevelBtn = document.getElementById('statChangeLevelBtn');
  if(changeLevelBtn){
    changeLevelBtn.addEventListener('click', ()=>{
      openLevelSwitcher(()=> location.reload());
    });
  }
}

/* Habilidades reales que se muestran en "Tus habilidades" (progreso.html).
   "Mixto" no se incluye aquí a propósito: es una mezcla de las otras
   5, no una habilidad aparte (ver nota en renderProgressPage/DEVLOG). */
const PROGRESS_SKILLS_DISPLAY = ['gramatica','vocabulario','listening','writing','speaking'];

/* Consejo específico según los datos reales del usuario (no una frase
   motivacional obvia tipo "practica todos los días"). Cada rama usa
   uno de estos 5 consejos concretos sobre cómo aprender mejor,
   eligiendo el que mejor encaja según la situación real del usuario. */
function pickProgressTip(p, streak){
  const skills = PROGRESS_SKILLS_DISPLAY;
  const started = skills.filter(sk => attemptedItemIdsFor(p, sk).size > 0);
  const untried = skills.filter(sk => attemptedItemIdsFor(p, sk).size === 0);

  if(streak === 0){
    return { skill: null, text: 'Intenta recordar la respuesta antes de verla: ese esfuerzo mejora la retención.' };
  }
  if(untried.length && started.length){
    const next = untried[0];
    return { skill: next, text: `Alternar habilidades ayuda a recordar mejor que practicar siempre lo mismo. Todavía no has probado ${SKILL_LABELS[next]}.` };
  }
  if(started.length){
    let lowest = null;
    started.forEach(sk=>{
      const cov = computeSkillCoverage(p, sk);
      if(!lowest || cov < lowest.cov) lowest = { sk, cov };
    });
    if(lowest && lowest.cov < 100){
      return { skill: lowest.sk, text: `${SKILL_LABELS[lowest.sk]} es donde tienes más margen ahora mismo. Practica frases completas, no solo palabras aisladas, para recordarlas en contexto.` };
    }
  }
  if(streak >= 3){
    return { skill: null, text: `Llevas ${streak} días seguidos. Vuelve a tus errores frecuentes hasta poder responder sin pensarlo demasiado.` };
  }
  return { skill: null, text: 'Repasar un error días después ayuda más que repetirlo muchas veces seguidas.' };
}

function renderProgressTipCard(container, p, streak){
  if(!container) return;
  const tip = pickProgressTip(p, streak);
  const href = tip.skill ? SKILL_PAGE[tip.skill] : 'miembros.html';
  container.innerHTML = `
    <div class="tip-card-icon">
      <svg viewBox="0 0 24 24" fill="none"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.4.3.6.8.6 1.3V16h5.8v-.8c0-.5.2-1 .6-1.3A6 6 0 0012 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="tip-card-eyebrow">Consejo para ti</div>
    <p class="tip-card-text">${tip.text}</p>
    <a href="${href}" class="btn btn-primary">Practicar ahora →</a>`;
}

function renderProgressPage(root){
  const p = loadProgress();

  if(!p.sessions || p.sessions.length === 0){
    root.innerHTML = `
      <div class="progress-empty-state">
        <img src="leo-thinking.png" alt="" class="progress-empty-img" width="130" height="222" loading="lazy">
        <h2>Tu progreso empieza con tu primera práctica.</h2>
        <p>Completa una sesión y aquí verás tus habilidades, precisión y actividad.</p>
        <a href="gramatica.html" class="btn btn-primary">Empezar una sesión</a>
      </div>`;
    return;
  }

  const stats = computeWeeklyStatsWithDelta();
  const streak = computeStreak();
  const level = getUserLevel();

  /* Recomendación: la habilidad con menor cobertura entre las ya
     empezadas; si nada se ha practicado, Gramática. */
  let recommendation = { skill:'gramatica', reason:'Es un buen punto de partida.' };
  const startedSkills = Object.keys(SKILL_LABELS).filter(sk => attemptedItemIdsFor(p, sk).size > 0);
  if(startedSkills.length){
    let lowest = null;
    startedSkills.forEach(sk=>{
      const cov = computeSkillCoverage(p, sk);
      if(!lowest || cov < lowest.cov) lowest = { sk, cov };
    });
    recommendation = { skill: lowest.sk, reason: 'Sigue teniendo margen para practicar más.' };
  }
  // Si el diagnóstico todavía no está listo, "Hoy te conviene" muestra
  // esta recomendación (la que antes iba en "Continúa aprendiendo").
  // Con diagnóstico listo, renderDiagnosisSection usa diag.actions.
  const fallbackToday = {
    title: SKILL_LABELS[recommendation.skill],
    reason: recommendation.reason,
    href: SKILL_PAGE[recommendation.skill],
    cta: 'Practicar'
  };

  root.innerHTML = `
    <div class="section-head">
      <h2>Tu progreso</h2>
      <p>Aquí puedes ver tu avance y seguir practicando. ¡Vas muy bien!</p>
    </div>

    <div class="stat-cards" id="progressStatCards"></div>

    <div id="progressToday" class="progress-today"></div>

    <div class="section-head progress-sec-head" id="diagnostico">
      <h2 style="font-size:1.5rem;">Tu diagnóstico</h2>
      <p>Calculado con tus respuestas reales. Se actualiza cada vez que practicas.</p>
    </div>
    <div id="diagnosisSection"></div>

    <div class="section-head progress-sec-head">
      <h2 style="font-size:1.5rem;">Tus habilidades</h2>
      <p>La barra muestra cuánto has practicado; la etiqueta, cómo vas en aciertos.</p>
    </div>
    <div class="skills-panel" id="skillsPanel"></div>

    <div class="section-head progress-sec-head" id="progressTopicsHead" hidden>
      <h2 style="font-size:1.5rem;">Temas a reforzar</h2>
      <p>Primero los que más te conviene repasar.</p>
    </div>
    <div id="progressTopics"></div>

    <div class="section-head progress-sec-head">
      <h2 style="font-size:1.5rem;">Tu resumen de la semana</h2>
    </div>
    <div id="progressWeekReport"></div>

    <div class="section-head progress-sec-head">
      <h2 style="font-size:1.5rem;">Tu actividad</h2>
    </div>
    <div class="bottom-grid" id="progressBottomGrid">
      <div class="activity-card" id="progressRecent"></div>
      <div class="weekly-chart-card" id="progressWeekly"></div>
      <div class="tip-card" id="progressTip"></div>
    </div>`;

  renderProgressStatCards(document.getElementById('progressStatCards'), stats, streak, level);
  renderDiagnosisSection({
    diag: document.getElementById('diagnosisSection'),
    today: document.getElementById('progressToday'),
    skills: document.getElementById('skillsPanel'),
    topics: document.getElementById('progressTopics'),
    topicsHead: document.getElementById('progressTopicsHead'),
    week: document.getElementById('progressWeekReport'),
    fallbackToday, p
  });
  if(location.hash === '#diagnostico' && !root._diagScrolled){
    root._diagScrolled = true;
    const target = document.getElementById('diagnostico');
    if(target) setTimeout(()=> target.scrollIntoView({ block:'start' }), 50);
  }
  renderRecentActivityV2(document.getElementById('progressRecent'));
  renderWeeklyChart(document.getElementById('progressWeekly'));
  renderProgressTipCard(document.getElementById('progressTip'), p, streak);
}

/* ============================================================
   PRÁCTICA GRATIS (practica.html) — mini sesiones reales, no un
   solo ítem de muestra. Comparten los mismos bancos de datos que
   Miembros y las mismas piezas de UI (tarjetas, feedback, audio),
   pero NO llaman a recordSession() (no tocan el progreso guardado
   de Miembros) y terminan en un resumen propio que invita —sin
   interrumpir la sesión— a entrar a Miembros para más práctica y
   seguimiento. Miembros conserva su propio motor (runGrammarSession,
   runVocabSession, runListeningSession, runSpeakingSession,
   runWritingSession) sin cambios.
   ============================================================ */

/* ---------- "Leo te acompaña": audios reales de Leo (sin IA, solo reglas) ----------
   leoVozHtml(id) devuelve un hueco oculto; leoVozActivate() carga leo-voz.js
   (una sola vez, solo si hace falta) y muestra el botón únicamente si existe
   audio/leo/<id>.mp3. Nunca autoplay. Máximo un mensaje por pantalla. */
function leoVozHtml(id){
  return id ? `<div class="leo-voz" data-leo-voz="${id}"${id === 'repasa-antes' ? ' data-leo-voz-avatar="photo"' : ''} hidden></div>` : '';
}
let _leoVozLoading = null;
function leoVozActivate(){
  setTimeout(() => {
    const pending = () => document.querySelectorAll('.leo-voz[data-leo-voz]:not([data-leo-voz-mounted])');
    if(!pending().length) return;
    const run = () => pending().forEach(el => window.mountLeoVoz(el));
    if(typeof window.mountLeoVoz === 'function') return run();
    if(!_leoVozLoading) _leoVozLoading = new Promise(res => {
      const sc = document.createElement('script');
      sc.src = 'leo-voz.js?v=20261003d'; sc.onload = res; sc.onerror = res;
      document.head.appendChild(sc);
    });
    _leoVozLoading.then(() => { if(typeof window.mountLeoVoz === 'function') run(); });
  }, 0);
}

/* ---------- Leo AI como gancho de la membresía (solo práctica gratis) ----------
   Para no cansar: el bloque grande de Leo AI NO sale en cada resumen.
   Sale (a) si la sesión tuvo 3 o más errores, o (b) una vez cada 5
   sesiones gratis terminadas; y nunca en dos resúmenes seguidos. En
   Writing gratis sale una sola vez por sesión, en la primera frase
   revisada. Nunca a miembros (window.__leoMemberVerified). El conteo
   vive en localStorage de este navegador (no se manda a ningún lado). */
const LEO_AI_PITCH_KEY = 'leo_ai_pitch_state';
function nextLeoAiPitchVariant(wrong){
  if(window.__leoMemberVerified === true) return null;
  let st = { sessions:0, lastShownAt:-99 };
  try{ st = Object.assign(st, JSON.parse(localStorage.getItem(LEO_AI_PITCH_KEY)) || {}); }catch(e){}
  st.sessions++;
  const sinceLast = st.sessions - st.lastShownAt;
  let variant = null;
  if(sinceLast >= 2 && wrong >= 3) variant = 'errors';
  else if(sinceLast >= 2 && st.sessions % 5 === 0) variant = 'progress';
  if(variant) st.lastShownAt = st.sessions;
  try{ localStorage.setItem(LEO_AI_PITCH_KEY, JSON.stringify(st)); }catch(e){}
  return variant;
}
const LEO_AI_PITCH_COPY = {
  errors: { h:'¿No sabes por qué sigues fallando esto?', p:'Como miembro, el sistema guarda tus errores y Leo AI te explica cada uno cuando necesitas ayuda extra, dentro del método del Profe Leo.', cta:'Ver qué incluye' },
  progress: { h:'Esto es una muestra del sistema.', p:'Como miembro, el sistema recuerda más de tu progreso, conecta tus errores y te dice qué estudiar después, con el método del Profe Leo.', cta:'Descubrir el sistema completo' },
  writing: { h:'¿Quieres que la IA revise tu respuesta?', p:'Los miembros pueden pedirle a Leo AI que revise su frase: te dice qué corregir y por qué, en español sencillo.', cta:'Ver qué incluye' }
};
function leoAiPitchHtml(variant){
  const c = LEO_AI_PITCH_COPY[variant];
  if(!c || window.__leoMemberVerified === true) return '';
  if(typeof trackLeoEvent === 'function') trackLeoEvent('leo_ai_pitch_shown', { variant });
  return `
    <div class="ai-pitch is-compact" style="margin-top:22px;">
      <span class="ai-pitch-badge">${LEO_AI_ICON}Leo AI · Apoyo para miembros</span>
      <h3>${c.h}</h3>
      <p>${c.p}</p>
      <a href="miembros.html#leo-ai" class="btn btn-primary" onclick="if(typeof trackLeoEvent==='function')trackLeoEvent('leo_ai_pitch_clicked',{variant:'${variant}'})">${c.cta} →</a>
      <p class="ai-pitch-note">Membresía de $2 USD al mes. Cancela cuando quieras.</p>
    </div>`;
}

/* ---------- Resumen de sesión gratis (independiente del de Miembros) ---------- */
function renderFreeSessionSummary({ title, score, topics, results }){
  const wrong = Array.isArray(results) ? results.filter(r => r && r.isCorrect === false).length : 0;
  const aiVariant = nextLeoAiPitchVariant(wrong);
  // Sin diagnóstico en la práctica gratis: solo el resultado de esta sesión.
  const graded = Array.isArray(results) ? results.filter(r => r && typeof r.isCorrect === 'boolean').length : 0;
  let vozId = null;
  if(graded >= 3){
    const pct = (graded - wrong) / graded;
    vozId = pct >= 0.8 ? 'buen-trabajo' : pct >= 0.5 ? 'sigue-tema' : 'puedes-mejorar';
  }
  if(vozId) leoVozActivate();
  return `
    <div class="session-summary">
      <h2>${title}</h2>
      <p class="summary-score">${score}</p>
      ${topics && topics.length ? `
        <div class="summary-topics">
          <div class="examples-label">Practicaste:</div>
          <ul>${topics.map(t=>`<li>${t}</li>`).join('')}</ul>
        </div>` : ''}
      <div class="summary-actions">
        <button class="btn btn-primary" id="freeAgainBtn">Hacer otra sesión</button>
        <button class="btn btn-ghost" id="freeOtherSkillBtn">Probar otra habilidad</button>
      </div>
      ${leoVozHtml(vozId)}
      ${aiVariant ? leoAiPitchHtml(aiVariant) : `
      <div class="summary-unlock">
        <p class="summary-unlock-label">Esto es una muestra del sistema.</p>
        <p class="summary-unlock-copy">Como miembro, el sistema recuerda tu progreso, conecta tus errores y te guía con el método del Profe Leo: qué practicar, clases interactivas y Leo AI cuando necesitas ayuda.</p>
        <a href="miembros.html" class="btn btn-primary btn-block">Descubrir el sistema completo</a>
      </div>`}
    </div>`;
}
function wireFreeSummaryButtons(container, { onAgain, onOtherSkill }){
  const againBtn = container.querySelector('#freeAgainBtn');
  if(againBtn) againBtn.addEventListener('click', onAgain);
  const otherBtn = container.querySelector('#freeOtherSkillBtn');
  if(otherBtn) otherBtn.addEventListener('click', onOtherSkill);
}

/* ---------- Gramática gratis: los 8 ítems del nivel (igual pool que Miembros) ---------- */
function runFreeGrammarSession({ container, level, onOtherSkill }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const variantIdx = pickVariantIndex('gramatica', level, GRAMMAR_BANK[level].length, MEMBERS_ONLY_VARIANT_INDEX.gramatica[level]);
  const topics = GRAMMAR_BANK[level][variantIdx];
  const pool = [];
  const maxLen = Math.max(...topics.map(t=>t.items.length));
  for(let i=0;i<maxLen;i++){
    topics.forEach(t=>{ if(t.items[i]) pool.push(Object.assign({ topic:t.topic }, t.items[i])); });
  }
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
    if(freeDailyLimitReached()){
      container.innerHTML = renderFreeDailyLimitReachedBlock();
      return;
    }
    const item = pool[idx];
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Gramática', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderGrammarItemInto(card, item, (isCorrect)=>{
      results.push({ itemId:item.id, isCorrect });
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        bumpFreeDailyExerciseCount();
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    container.innerHTML = renderFreeSessionSummary({ results: (typeof results !== 'undefined' ? results : null),
      title:'¡Listo!', score:`${correct} / ${total} correctas`,
      topics: topics.map(t=>t.topic)
    });
    wireFreeSummaryButtons(container, {
      onAgain: ()=>runFreeGrammarSession({ container, level, onOtherSkill }),
      onOtherSkill
    });
  }
  renderItem();
}

/* ---------- Vocabulario gratis: los 8 ítems del nivel ---------- */
function runFreeVocabSession({ container, level, onOtherSkill }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const variantIdx = pickVariantIndex('vocabulario', level, VOCAB_BANK[level].length, MEMBERS_ONLY_VARIANT_INDEX.vocabulario[level]);
  const pool = VOCAB_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
    if(freeDailyLimitReached()){
      container.innerHTML = renderFreeDailyLimitReachedBlock();
      return;
    }
    const item = pool[idx];
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Vocabulario', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    card.innerHTML = `
      <div class="practice-prompt" style="font-size:1.05rem;">${item.quiz.prompt}</div>
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const list = card.querySelector('#optList');
    const { options: shuffledQuizOptions, correct: shuffledQuizCorrect } = shuffleOptions(item.quiz.options, item.quiz.correct);
    shuffledQuizOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledQuizCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledQuizCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        const reveal = document.createElement('div');
        reveal.className = 'vocab-card';
        reveal.style.marginTop = '16px';
        reveal.innerHTML = `<div class="vocab-word">${item.word}</div><div class="vocab-sub">${item.translation}</div>`;
        list.after(reveal);
        renderFeedback(card, isCorrect, item.quiz.explain, item.examples);
        results.push({ itemId:item.id, isCorrect });
        showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
          bumpFreeDailyExerciseCount();
          idx++;
          if(idx < total) renderItem(); else finish();
        }, idx+1 < total ? 'Siguiente palabra →' : 'Ver resultado →');
      });
      list.appendChild(b);
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    container.innerHTML = renderFreeSessionSummary({ results: (typeof results !== 'undefined' ? results : null),
      title:'¡Listo!', score:`Repasaste ${total} palabras · ${correct}/${total} en el mini quiz`,
      topics: ['Vocabulario en contexto']
    });
    wireFreeSummaryButtons(container, {
      onAgain: ()=>runFreeVocabSession({ container, level, onOtherSkill }),
      onOtherSkill
    });
  }
  renderItem();
}

/* ---------- Listening gratis: los 3 MP3 existentes del nivel ---------- */
function runFreeListeningSession({ container, level, onOtherSkill }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const variantIdx = pickVariantIndex('listening', level, LISTENING_BANK[level].length, MEMBERS_ONLY_VARIANT_INDEX.listening[level]);
  const pool = LISTENING_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
    if(freeDailyLimitReached()){
      container.innerHTML = renderFreeDailyLimitReachedBlock();
      return;
    }
    const item = pool[idx];
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Listening', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    card.innerHTML = `
      <div class="practice-prompt">Escucha</div>
      <div class="listen-row">
        <button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} Reproducir</button>
      </div>
      <div class="practice-prompt" style="font-size:1.05rem;">${item.question}</div>
      <div class="option-list" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    card.querySelector('#playBtn').addEventListener('click', function(){
      playAudioFile(item.audioFile, card);
    });
    const list = card.querySelector('#optList');
    const { options: shuffledListenOptions, correct: shuffledListenCorrect } = shuffleOptions(item.options, item.correct);
    shuffledListenOptions.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === shuffledListenCorrect;
        [...list.children].forEach((el,j)=>{
          el.disabled = true;
          if(j === shuffledListenCorrect) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        const fb = card.querySelector('#fb');
        fb.classList.add('show');
        fb.classList.toggle('ok', isCorrect);
        fb.classList.toggle('bad', !isCorrect);
        fb.innerHTML = `
          <div class="fb-head">${isCorrect ? OK_ICON : BAD_ICON}<span>${isCorrect ? 'Correcto' : 'Casi.'}</span></div>
          <p class="fb-explain">${item.explain}</p>
          <div class="examples-block">
            <div class="examples-label">Transcripción</div>
            <div class="example-pair"><div class="example-en">${item.transcript}</div><div class="example-es">${item.translation}</div></div>
          </div>`;
        results.push({ itemId:item.id, isCorrect });
        showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
          bumpFreeDailyExerciseCount();
          idx++;
          if(idx < total) renderItem(); else finish();
        }, idx+1 < total ? 'Siguiente audio →' : 'Ver resultado →');
      });
      list.appendChild(b);
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    container.innerHTML = renderFreeSessionSummary({ results: (typeof results !== 'undefined' ? results : null),
      title:'¡Listo!', score:`${correct} / ${total} correctas`,
      topics: ['Comprensión auditiva']
    });
    wireFreeSummaryButtons(container, {
      onAgain: ()=>runFreeListeningSession({ container, level, onOtherSkill }),
      onOtherSkill
    });
  }
  renderItem();
}

/* ---------- Writing gratis: 4 ejercicios guiados por nivel.
   Misma validación honesta por patrón que Miembros (no es IA). ---------- */
function checkWritingAnswer(text, item){
  return evaluateWritingAnswer(text, item).isOk;
}
function runFreeWritingSession({ container, level, onOtherSkill }){
  let aiPitchShown = false; // Leo AI se ofrece una vez por sesión de Writing gratis
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const variantIdx = pickVariantIndex('writing', level, WRITING_BANK[level].length, MEMBERS_ONLY_VARIANT_INDEX.writing[level]);
  const pool = WRITING_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
    if(freeDailyLimitReached()){
      container.innerHTML = renderFreeDailyLimitReachedBlock();
      return;
    }
    const item = pool[idx];
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Writing', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    card.innerHTML = `
      <div class="practice-prompt">${item.prompt}</div>
      <textarea id="writingInput" rows="3" class="writing-area" placeholder="Escribe tu frase en inglés aquí..."></textarea>
      <div class="next-row" style="justify-content:flex-start;">
        <button class="btn btn-primary btn-sm" id="reviewBtn">Revisar mi frase</button>
      </div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;

    const input = card.querySelector('#writingInput');
    const fb = card.querySelector('#fb');
    const nextRow = card.querySelector('#nextRow');

    function doReview(){
      const text = input.value;
      const evalResult = evaluateWritingAnswer(text, item);
      const isOk = evalResult.isOk;
      fb.classList.add('show');
      fb.classList.toggle('ok', isOk);
      fb.classList.toggle('bad', !isOk);
      if(isOk){
        fb.innerHTML = `
          <div class="fb-head">${OK_ICON}<span>Estructura correcta</span></div>
          <p class="fb-explain">Tu frase incluye la estructura que buscábamos.</p>
          <div class="examples-block">
            <div class="examples-label">Ejemplo</div>
            <div class="example-pair"><div class="example-en">${item.example.en}</div><div class="example-es">${item.example.es}</div></div>
          </div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
      } else {
        fb.innerHTML = `
          <div class="fb-head">${BAD_ICON}<span>Revisa la estructura</span></div>
          <p class="fb-explain">${evalResult.hint || item.hint}</p>
          <div class="examples-block">
            <div class="examples-label">Ejemplo</div>
            <div class="example-pair"><div class="example-en">${item.example.en}</div><div class="example-es">${item.example.es}</div></div>
          </div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
      }
      results.push({ itemId:item.id, isCorrect:isOk });
      // Leo AI (solo miembros): se ofrece una sola vez por sesión, en la primera frase revisada.
      if(!aiPitchShown){ aiPitchShown = true; fb.insertAdjacentHTML('beforeend', leoAiPitchHtml('writing')); }
      nextRow.innerHTML = '';
      if(!isOk){
        const retryBtn = document.createElement('button');
        retryBtn.className = 'btn btn-ghost btn-sm';
        retryBtn.textContent = 'Intentar de nuevo';
        retryBtn.addEventListener('click', ()=>{
          results.pop();
          fb.classList.remove('show','ok','bad');
          fb.innerHTML = '';
          nextRow.innerHTML = '';
          input.focus();
        });
        nextRow.appendChild(retryBtn);
      }
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary btn-sm';
      nextBtn.textContent = idx+1 < total ? 'Siguiente frase →' : 'Ver resultado →';
      nextBtn.addEventListener('click', ()=>{
        bumpFreeDailyExerciseCount();
        idx++;
        if(idx < total) renderItem(); else finish();
      });
      nextRow.appendChild(nextBtn);
    }
    card.querySelector('#reviewBtn').addEventListener('click', doReview);
  }
  function finish(){
    const okCount = results.filter(r=>r.isCorrect).length;
    container.innerHTML = renderFreeSessionSummary({ results: (typeof results !== 'undefined' ? results : null),
      title:'¡Listo!', score:`${okCount} / ${total} frases bien encaminadas`,
      topics: ['Escritura guiada']
    });
    wireFreeSummaryButtons(container, {
      onAgain: ()=>runFreeWritingSession({ container, level, onOtherSkill }),
      onOtherSkill
    });
  }
  renderItem();
}

/* ---------- Speaking gratis: las 3 frases/audio existentes del nivel.
   Mismo sistema de grabación que Miembros, sin puntuación inventada. ---------- */
function runFreeSpeakingSession({ container, level, onOtherSkill }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const variantIdx = pickVariantIndex('speaking', level, SPEAKING_BANK[level].length, MEMBERS_ONLY_VARIANT_INDEX.speaking[level]);
  const pool = SPEAKING_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
    if(freeDailyLimitReached()){
      container.innerHTML = renderFreeDailyLimitReachedBlock();
      return;
    }
    const item = pool[idx];
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Speaking', level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);

    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

    card.innerHTML = `
      <div class="practice-prompt">Escucha</div>
      <div class="speak-sentence">${item.sentence}</div>
      <p class="speak-tip">${item.translation}</p>
      <div class="speak-actions">
        <button class="btn btn-ghost btn-sm" id="hearBtn">${PLAY_ICON} Escuchar pronunciación</button>
      </div>
      <div class="practice-prompt" style="margin-top:22px;">Ahora tú</div>
      <div class="speak-actions">
        ${canRecord
          ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi voz</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
          : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
      </div>
      <div id="compareRow" class="compare-row"></div>
      <div id="speechScoreBlock" style="margin-top:14px;"></div>
      <div class="next-row" id="nextRow">
        <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Intentar otra vez</button>
        <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente frase →' : 'Ver resultado →'}</button>
      </div>`;

    card.querySelector('#hearBtn').addEventListener('click', ()=> playAudioFile(item.audioFile, card));
    card.querySelector('#nextSpeakBtn').addEventListener('click', ()=>{
      bumpFreeDailyExerciseCount();
      results.push({ itemId:item.id, isCorrect:null });
      idx++;
      if(idx < total) renderItem(); else finish();
    });

    if(canRecord){
      let stream = null, recorder = null, chunks = [], recognition = null;
      const recordBtn = card.querySelector('#recordBtn');
      const compareRow = card.querySelector('#compareRow');
      const retryBtn = card.querySelector('#retryBtn');
      const recIndicator = card.querySelector('#recIndicator');
      const scoreBlock = card.querySelector('#speechScoreBlock');

      recordBtn.addEventListener('click', async ()=>{
        if(recorder && recorder.state === 'recording'){
          recorder.stop();
          return;
        }
        compareRow.innerHTML = '';
        scoreBlock.innerHTML = '';
        scoreBlock.classList.remove('feedback','show','ok','bad');
        try{
          stream = await acquireMicStream(recognition);
        }catch(err){
          compareRow.innerHTML = `<p class="audio-missing-note">No pudimos acceder al micrófono. Revisa los permisos del navegador.</p>`;
          return;
        }
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = ()=>{
          const blob = recordedAudioBlob(chunks, recorder);
          const url = URL.createObjectURL(blob);
          compareRow.innerHTML = `
            <div class="compare-col">
              <div class="compare-label">Pronunciación original</div>
              <button class="btn btn-ghost btn-sm" id="origBtn">${PLAY_ICON} Escuchar</button>
            </div>
            <div class="compare-col">
              <div class="compare-label">Tu grabación</div>
              <audio controls src="${url}"></audio>
            </div>`;
          compareRow.querySelector('#origBtn').addEventListener('click', ()=> playAudioFile(item.audioFile, card));
          fixRecordedAudioDuration(compareRow.querySelector('audio'), blob);
          retryBtn.style.display = 'inline-flex';
          stream.getTracks().forEach(t=>t.stop());
          recordBtn.innerHTML = `${MIC_ICON} Grabar de nuevo`;
          if(recIndicator) recIndicator.hidden = true;
          scoreBlock.innerHTML = `<p class="audio-missing-note">Analizando pronunciación...</p>`;
          if(recognition) recognition.stop();
          else renderSpeechScoreBlock(scoreBlock, item.sentence, null);
        };
        recorder.start();
        recognition = startSpeechRecognitionCapture((saidText)=>{
          renderSpeechScoreBlock(scoreBlock, item.sentence, saidText);
        });
        recordBtn.textContent = 'Detener grabación';
        if(recIndicator) recIndicator.hidden = false;
      });
      retryBtn.addEventListener('click', ()=>{
        compareRow.innerHTML = '';
        scoreBlock.innerHTML = '';
        scoreBlock.classList.remove('feedback','show','ok','bad');
        retryBtn.style.display = 'none';
        recordBtn.innerHTML = `${MIC_ICON} Grabar mi voz`;
        if(recIndicator) recIndicator.hidden = true;
      });
    }
  }
  function finish(){
    container.innerHTML = renderFreeSessionSummary({ results: (typeof results !== 'undefined' ? results : null),
      title:'¡Listo!', score:`Practicaste ${total} frases en voz alta`,
      topics: ['Pronunciación guiada']
    });
    wireFreeSummaryButtons(container, {
      onAgain: ()=>runFreeSpeakingSession({ container, level, onOtherSkill }),
      onOtherSkill
    });
  }
  renderItem();
}

/* ---------- Orquestador de practica.html: nivel + pestañas + una
   sola sesión visible a la vez. Lee ?skill= de la URL. ---------- */
function initFreePractice({ levelsEl, tabsEl, headEl, bodyEl }){
  const SKILL_ORDER = ['gramatica','vocabulario','listening','speaking','writing','mixto'];
  const SKILL_URL_TO_KEY = { grammar:'gramatica', vocabulary:'vocabulario', listening:'listening', speaking:'speaking', writing:'writing', mix:'mixto' };
  const SKILL_DESC = {
    gramatica: '8 preguntas cortas con explicación y ejemplos.',
    vocabulario: '8 palabras útiles en contexto, no solo la traducción.',
    listening: '3 audios reales: escucha y responde.',
    speaking: '3 frases: escucha, grábate y compara.',
    writing: '4 frases guiadas con revisión honesta.',
    mixto: 'Un poco de todo: gramática, vocabulario, listening, speaking y writing en una sola sesión.'
  };
  const RUNNERS = {
    gramatica: runFreeGrammarSession,
    vocabulario: runFreeVocabSession,
    listening: runFreeListeningSession,
    speaking: runFreeSpeakingSession,
    writing: runFreeWritingSession,
    mixto: runFreeMixSession
  };

  let currentLevel = 'facil';
  let currentSkill = 'gramatica';
  try{
    const params = new URLSearchParams(window.location.search);
    const skillParam = params.get('skill');
    if(skillParam && SKILL_URL_TO_KEY[skillParam]) currentSkill = SKILL_URL_TO_KEY[skillParam];
    // ?level=avanzado (desde las tarjetas "Practica a tu nivel" del inicio)
    const levelParam = params.get('level');
    if(levelParam && LEVELS.includes(levelParam)){
      currentLevel = levelParam;
      // Igual que cuando se toca un nivel a mano: bajamos hasta las
      // pestanas/ejercicio, para que no quede todo debajo del reto diario
      // y parezca que no paso nada.
      setTimeout(()=>{ if(tabsEl && tabsEl.scrollIntoView) tabsEl.scrollIntoView({ behavior:'smooth', block:'start' }); }, 300);
    }
  }catch(e){}

  function focusTabs(){
    if(tabsEl && tabsEl.scrollIntoView) tabsEl.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // "Probar otra habilidad" (botón del resumen de una sesión gratis):
  // antes solo hacía scroll hacia las pestañas de arriba y dejaba que
  // el usuario eligiera, pero el usuario reportó que en la práctica
  // sentía que lo empujaba hacia el botón de pago de más abajo en vez
  // de dejarlo probar algo gratis de verdad. Ahora este botón cambia
  // directamente a la SIGUIENTE habilidad de la lista (nunca a pagar,
  // nunca fuerza nada) y hace scroll hasta arriba para que se vea que
  // ya está en una habilidad distinta. El aviso de "¿Quieres seguir?"
  // con el botón de $2/mes al final del resumen no se tocó: sigue
  // apareciendo igual, solo que ya no es lo único a donde este botón
  // parece llevar.
  function tryAnotherSkill(){
    const currentIdx = SKILL_ORDER.indexOf(currentSkill);
    const nextIdx = (currentIdx + 1) % SKILL_ORDER.length;
    currentSkill = SKILL_ORDER[nextIdx];
    renderTabs();
    renderCurrent();
    focusTabs();
  }

  function renderHead(){
    headEl.innerHTML = `<h3>${SKILL_LABELS[currentSkill]}</h3><p>${SKILL_DESC[currentSkill]}</p>`;
  }
  function renderTabs(){
    tabsEl.innerHTML = SKILL_ORDER.map(sk => `
      <button type="button" class="skill-tab-btn" data-skill="${sk}" role="tab" aria-selected="${sk===currentSkill}" aria-pressed="${sk===currentSkill}">${SKILL_LABELS[sk]}</button>`).join('');
    tabsEl.querySelectorAll('.skill-tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(btn.dataset.skill === currentSkill) return;
        currentSkill = btn.dataset.skill;
        renderTabs();
        renderCurrent();
      });
    });
  }
  function renderCurrent(){
    renderHead();
    const run = RUNNERS[currentSkill] || runFreeGrammarSession;
    run({ container: bodyEl, level: currentLevel, onOtherSkill: tryAnotherSkill });
  }

  renderLevelSelector(levelsEl, currentLevel, (lvl)=>{ currentLevel = lvl; renderCurrent(); focusTabs(); });
  renderTabs();
  renderCurrent();
}

/* ---------- Orquestador de practica-miembros.html: mismo selector de
   nivel + pestañas de habilidad que practica.html (para que un miembro
   pueda elegir Listening, Speaking, etc. como quiera, no solo Mixto),
   pero corriendo las sesiones REALES de Miembros (con progreso
   guardado), no las gratis. A propósito NO comparte código con
   initFreePractice(): usa otros runners (runGrammarSession en vez de
   runFreeGrammarSession, etc.) y no tiene reto diario ni banner de
   membresía, porque el usuario que llega aquí ya es miembro. ---------- */
function initMemberPractice({ levelsEl, tabsEl, headEl, bodyEl }){
  const SKILL_ORDER = ['gramatica','vocabulario','listening','speaking','writing','mixto'];
  const SKILL_URL_TO_KEY = { grammar:'gramatica', vocabulary:'vocabulario', listening:'listening', speaking:'speaking', writing:'writing', mix:'mixto' };
  const SKILL_DESC = {
    gramatica: '8 preguntas cortas con explicación y ejemplos.',
    vocabulario: '8 palabras útiles en contexto, no solo la traducción.',
    listening: '3 audios reales: escucha y responde.',
    speaking: '3 frases: escucha, grábate y compara.',
    writing: '4 frases guiadas con revisión honesta.',
    mixto: 'Un poco de todo: gramática, vocabulario, listening, speaking y writing en una sola sesión.'
  };
  const RUNNERS = {
    gramatica: runGrammarSession,
    vocabulario: runVocabSession,
    listening: runListeningSession,
    speaking: runSpeakingSession,
    writing: runWritingSession,
    mixto: runMixSession
  };

  let currentLevel = getUserLevel();
  let currentSkill = 'gramatica';
  try{
    const params = new URLSearchParams(window.location.search);
    const skillParam = params.get('skill');
    if(skillParam && SKILL_URL_TO_KEY[skillParam]) currentSkill = SKILL_URL_TO_KEY[skillParam];
    // ?level=avanzado (desde las tarjetas "Practica a tu nivel" del inicio)
    const levelParam = params.get('level');
    if(levelParam && LEVELS.includes(levelParam)){
      currentLevel = levelParam;
      // Igual que cuando se toca un nivel a mano: bajamos hasta las
      // pestanas/ejercicio, para que no quede todo debajo del reto diario
      // y parezca que no paso nada.
      setTimeout(()=>{ if(tabsEl && tabsEl.scrollIntoView) tabsEl.scrollIntoView({ behavior:'smooth', block:'start' }); }, 300);
    }
  }catch(e){}

  function focusTabs(){
    if(tabsEl && tabsEl.scrollIntoView) tabsEl.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  function renderHead(){
    headEl.innerHTML = `<h3>${SKILL_LABELS[currentSkill]}</h3><p>${SKILL_DESC[currentSkill]}</p>`;
  }
  function renderTabs(){
    tabsEl.innerHTML = SKILL_ORDER.map(sk => `
      <button type="button" class="skill-tab-btn" data-skill="${sk}" role="tab" aria-selected="${sk===currentSkill}" aria-pressed="${sk===currentSkill}">${SKILL_LABELS[sk]}</button>`).join('');
    tabsEl.querySelectorAll('.skill-tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(btn.dataset.skill === currentSkill) return;
        currentSkill = btn.dataset.skill;
        renderTabs();
        renderCurrent();
      });
    });
  }
  function renderCurrent(){
    renderHead();
    const run = RUNNERS[currentSkill] || runGrammarSession;
    run({ container: bodyEl, level: currentLevel });
  }

  renderLevelSelector(levelsEl, currentLevel, (lvl)=>{ currentLevel = lvl; renderCurrent(); focusTabs(); });
  renderTabs();
  renderCurrent();
}

/* ---------- Tarjeta "Siguiente refuerzo" (home) ----------
   Demostración de cómo se adapta el sistema después de practicar: elige
   al azar uno de los temas reales de GRAMMAR_BANK (lista corta
   MINI_LESSONS = [etiqueta, microexplicación], generada con
   tools/generar_mini_lecciones.js) y lo pone como "Siguiente refuerzo"
   con su regla corta. No son datos del visitante. Si la lista no carga,
   se queda el tema que ya trae el HTML. */
function renderDailyMiniLesson(){
  if(typeof MINI_LESSONS === 'undefined' || !MINI_LESSONS.length) return;
  const enEl = document.querySelector('.hero-v2-card-en');
  const esEl = document.querySelector('.hero-v2-card-es');
  if(!enEl || !esEl) return;
  const lesson = MINI_LESSONS[Math.floor(Math.random() * MINI_LESSONS.length)];
  const strong = document.createElement('strong');
  strong.textContent = lesson[0];
  enEl.textContent = 'Siguiente refuerzo:';
  enEl.appendChild(document.createElement('br'));
  enEl.appendChild(strong);
  esEl.textContent = lesson[1];
}

/* ============================================================
   Comentarios en articulos (articulo-*.html)
   ------------------------------------------------------------
   Cualquiera puede comentar, sin necesidad de crear cuenta:
   - Si la persona tiene sesion iniciada Y es miembro pagado
     (profiles.is_member = true en Supabase), su comentario queda
     marcado "Miembro" y usa como nombre lo mismo que ya se usa en
     el menu de arriba (initMemberHeader): su nombre de perfil local
     si lo puso al hacer el onboarding, o si no, la parte del correo
     antes de la "@".
   - Si no (no tiene sesion, o tiene cuenta pero todavia no es
     miembro pagado), es "invitado": se le asigna un nombre al azar
     tipo "Panda482" (un animal de una lista fija + 3 numeros), sin
     nada ofensivo. Ese nombre se guarda en este navegador
     (localStorage) para que use el mismo en todos los comentarios
     que deje aqui, en todos los articulos, en vez de que le cambie
     cada vez.
   - La cuenta administradora (Leo, ver ADMIN_USER_ID) ve botones de
     "Responder" y "Borrar" debajo de cada comentario. Solo se
     muestran si su sesion coincide con ese id; pero lo que de
     verdad protege esto es Supabase (RLS en article_comments): esa
     comprobacion en el navegador es solo para no mostrar botones
     que igual no podrian usar. Una respuesta de Leo se guarda como
     un comentario mas, con parent_comment_id apuntando al original
     (una sola capa, no se puede responder a una respuesta) y se
     identifica en pantalla como "Inglés con Leo · Admin" siempre
     que su user_id sea el de Leo (nunca por un dato que mande el
     navegador).
   Los comentarios se guardan en Supabase (tabla article_comments,
   ver supabase_schema.sql) y se publican de inmediato. A Leo le
   llega un correo avisando cada comentario nuevo (menos sus propias
   respuestas), con el articulo y quien lo escribio (ver
   supabase_functions/notify-new-comment.ts), asi puede borrar algo
   inapropiado desde la propia pagina o desde Supabase.
   ============================================================ */

/* Id de usuario de Supabase Auth de Leo (no es secreto: un user id
   de Supabase no sirve para nada sin la sesion real de esa cuenta,
   igual que la URL/anon key del proyecto ya visibles en backend.js).
   Es el mismo valor que exige la policy de RLS en Supabase para
   dejar borrar o publicar una respuesta identificada como admin:
   aunque alguien cambie esto en el navegador, Supabase solo va a
   aceptar el borrado/respuesta si su sesion real es esta cuenta. */
const ADMIN_USER_ID = 'f8c0bf1f-57c9-462a-addf-17559aeab69f';

const COMMENT_GUEST_NAME_KEY = 'leo_comment_guest_name';
const COMMENT_GUEST_ANIMALS = ['Panda','Zorro','Koala','Lobo','Gato','Perro','Buho','Oso','Conejo','Delfin','Tucan','Pinguino','Mapache','Nutria','Leon','Tigre'];

function getOrCreateGuestCommentName(){
  try{
    const saved = localStorage.getItem(COMMENT_GUEST_NAME_KEY);
    if(saved) return saved;
  }catch(e){}
  const animal = COMMENT_GUEST_ANIMALS[Math.floor(Math.random() * COMMENT_GUEST_ANIMALS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  const name = `${animal}${num}`;
  try{ localStorage.setItem(COMMENT_GUEST_NAME_KEY, name); }catch(e){}
  return name;
}

function commentEscapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c];
  });
}

function formatCommentDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
  }catch(e){ return ''; }
}

function initArticleShare(articleTitle){
  const root = document.getElementById('article-comments');
  if(!root || document.getElementById('article-share')) return;

  const url = (document.querySelector('link[rel="canonical"]') || {}).href || location.href;
  const text = encodeURIComponent(articleTitle + ' - Inglés con Leo');
  const waHref = 'https://wa.me/?text=' + text + '%20' + encodeURIComponent(url);

  const bar = document.createElement('div');
  bar.id = 'article-share';
  bar.className = 'article-share';
  bar.innerHTML =
    '<span class="article-share-label">¿Te sirvió? Compártelo</span>' +
    '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">WhatsApp</a>' +
    '<button type="button" class="btn btn-ghost btn-sm" id="article-share-copy">Copiar enlace</button>';
  root.parentNode.insertBefore(bar, root);

  const copyBtn = document.getElementById('article-share-copy');
  copyBtn.addEventListener('click', function(){
    const original = copyBtn.textContent;
    function showResult(ok){
      copyBtn.textContent = ok ? '¡Copiado!' : 'No se pudo copiar';
      setTimeout(function(){ copyBtn.textContent = original; }, 2000);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){ showResult(true); }).catch(function(){
        copyFallback();
      });
    } else {
      copyFallback();
    }
    function copyFallback(){
      try{
        const temp = document.createElement('textarea');
        temp.value = url;
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(temp);
        showResult(ok);
      }catch(e){ showResult(false); }
    }
  });
}

async function initArticleComments(){
  const root = document.getElementById('article-comments');
  if(!root) return;

  const h1Early = document.querySelector('article h1') || document.querySelector('h1');
  initArticleShare(h1Early ? h1Early.textContent.trim() : document.title);

  if(typeof LeoBackend === 'undefined' || !LeoBackend.isConfigured()){
    root.style.display = 'none';
    return;
  }

  const slug = (location.pathname.split('/').pop() || 'articulo').replace(/\.html$/i, '');
  const h1 = document.querySelector('article h1') || document.querySelector('h1');
  const articleTitle = h1 ? h1.textContent.trim() : document.title;

  let session = null, memberProfile = null;
  try{ session = await LeoBackend.getSession(); }catch(e){}
  if(session){
    try{ memberProfile = await LeoBackend.getMemberProfile(); }catch(e){}
  }
  const isMember = !!(memberProfile && memberProfile.is_member);
  /* Esto solo decide que botones mostrar. Quien de verdad autoriza
     borrar o publicar una respuesta de admin es Supabase (RLS),
     comparando la sesion real contra ADMIN_USER_ID otra vez del
     lado del servidor. */
  const isAdmin = !!(session && session.user && session.user.id === ADMIN_USER_ID);
  let myName, myUserId = null;
  if(isAdmin){
    myName = 'Inglés con Leo';
    myUserId = session.user.id;
  } else if(isMember){
    const localProfile = getProfile();
    const email = memberProfile.email || '';
    myName = (localProfile && localProfile.name) ? localProfile.name : (email ? email.split('@')[0] : 'Miembro');
    myUserId = session.user.id;
  } else {
    myName = getOrCreateGuestCommentName();
  }

  root.innerHTML = `
    <h2>Comentarios</h2>
    <form class="comment-form" id="commentForm">
      <div class="comment-form-name">Vas a comentar como <strong>${commentEscapeHtml(myName)}</strong>${isMember && !isAdmin ? ' <span class="badge badge-members">Miembro</span>' : ''}</div>
      <textarea id="commentText" maxlength="1000" placeholder="Escribe tu comentario o tu pregunta..." required></textarea>
      <button type="submit" class="btn btn-primary" id="commentSubmitBtn">Publicar comentario</button>
      <p class="form-status" id="commentStatus"></p>
    </form>
    <div class="comment-list" id="commentList"><p class="comment-loading">Cargando comentarios...</p></div>
  `;

  const listEl = document.getElementById('commentList');
  const statusEl = document.getElementById('commentStatus');
  const formEl = document.getElementById('commentForm');
  const btn = document.getElementById('commentSubmitBtn');

  function commentActionsHtml(c){
    if(!isAdmin) return '';
    const canReply = !c.parent_comment_id && !c._hasReply;
    return `
        <div class="comment-actions">
          ${canReply ? `<button type="button" class="comment-action-btn" data-reply-id="${c.id}">Responder</button>` : ''}
          <button type="button" class="comment-action-btn danger" data-delete-id="${c.id}">Borrar</button>
        </div>`;
  }

  function commentItemHtml(c, isReply){
    const isCommentAdmin = c.user_id && c.user_id === ADMIN_USER_ID;
    const nameHtml = isCommentAdmin
      ? '<span class="comment-item-name comment-admin-label">Inglés con Leo · Admin</span>'
      : `<span class="comment-item-name">${commentEscapeHtml(c.display_name)}</span>${(c.is_member && !isCommentAdmin) ? ' <span class="badge badge-members">Miembro</span>' : ''}`;
    return `
      <div class="${isReply ? 'comment-item comment-reply' : 'comment-item'}" data-comment-id="${c.id}">
        <div class="comment-item-head">
          ${nameHtml}
          <span class="comment-item-date">${formatCommentDate(c.created_at)}</span>
        </div>
        <p class="comment-item-text">${commentEscapeHtml(c.comment_text)}</p>
        ${commentActionsHtml(c)}
        <div class="comment-reply-slot" id="replySlot-${c.id}"></div>
      </div>`;
  }

  function renderComments(comments){
    const topLevel = comments.filter(c => !c.parent_comment_id);
    const repliesByParent = {};
    comments.forEach(c => {
      if(c.parent_comment_id) repliesByParent[c.parent_comment_id] = c;
    });
    if(!topLevel.length){
      listEl.innerHTML = '<p class="comment-empty">Todavia no hay comentarios. Se el primero en escribir.</p>';
      return;
    }
    listEl.innerHTML = topLevel.map(function(c){
      const reply = repliesByParent[c.id];
      c._hasReply = !!reply;
      return commentItemHtml(c, false) + (reply ? commentItemHtml(reply, true) : '');
    }).join('');
    if(isAdmin) wireAdminButtons();
  }

  async function loadComments(){
    let comments = [];
    try{ comments = await LeoBackend.getArticleComments(slug); }catch(e){}
    renderComments(comments);
  }

  function wireAdminButtons(){
    listEl.querySelectorAll('[data-reply-id]').forEach(function(elBtn){
      elBtn.addEventListener('click', function(){
        openReplyForm(Number(elBtn.getAttribute('data-reply-id')));
      });
    });
    listEl.querySelectorAll('[data-delete-id]').forEach(function(elBtn){
      elBtn.addEventListener('click', function(){
        deleteComment(Number(elBtn.getAttribute('data-delete-id')));
      });
    });
  }

  function openReplyForm(parentId){
    const slot = document.getElementById('replySlot-' + parentId);
    if(!slot || slot.querySelector('form')) return;
    slot.innerHTML = `
      <form class="comment-reply-form" data-parent-id="${parentId}">
        <textarea maxlength="1000" placeholder="Escribe tu respuesta como Inglés con Leo..." required></textarea>
        <div class="comment-actions">
          <button type="submit" class="comment-action-btn">Publicar respuesta</button>
          <button type="button" class="comment-action-btn" data-cancel-reply="1">Cancelar</button>
        </div>
      </form>`;
    const formNode = slot.querySelector('form');
    formNode.querySelector('[data-cancel-reply]').addEventListener('click', function(){ slot.innerHTML = ''; });
    formNode.addEventListener('submit', async function(e){
      e.preventDefault();
      const textEl = formNode.querySelector('textarea');
      const text = textEl.value.trim();
      if(!text) return;
      const submitBtn = formNode.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      const res = await LeoBackend.postArticleComment({
        slug: slug, articleTitle: articleTitle, displayName: 'Inglés con Leo',
        commentText: text, isMember: false, userId: myUserId,
        parentCommentId: parentId, notify: false
      });
      if(!res.ok){
        submitBtn.disabled = false;
        alert('Hubo un problema al publicar la respuesta. Intenta de nuevo.');
        return;
      }
      loadComments();
    });
  }

  async function deleteComment(id){
    if(!confirm('¿Seguro que quieres borrar este comentario?')) return;
    const res = await LeoBackend.deleteArticleComment(id);
    if(!res.ok){
      alert('No se pudo borrar el comentario. Intenta de nuevo.');
      return;
    }
    loadComments();
  }

  formEl.addEventListener('submit', async function(e){
    e.preventDefault();
    const textEl = document.getElementById('commentText');
    const text = textEl.value.trim();
    if(!text){
      statusEl.textContent = 'Escribe algo antes de publicar.';
      statusEl.className = 'form-status error';
      return;
    }
    btn.disabled = true;
    statusEl.textContent = 'Publicando...';
    statusEl.className = 'form-status';
    const res = await LeoBackend.postArticleComment({
      slug: slug, articleTitle: articleTitle, displayName: myName,
      commentText: text, isMember: isMember, userId: myUserId
    });
    btn.disabled = false;
    if(!res.ok){
      statusEl.textContent = 'Hubo un problema al publicar. Intenta de nuevo en un momento.';
      statusEl.className = 'form-status error';
      return;
    }
    textEl.value = '';
    statusEl.textContent = 'Comentario publicado.';
    statusEl.className = 'form-status ok';
    loadComments();
  });

  loadComments();
}
