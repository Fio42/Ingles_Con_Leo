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
  let heroCardVisible = false;

  function apply(){
    document.body.classList.toggle('leobot-away', overlayOrSession || heroCardVisible);
  }
  function syncOverlay(){
    overlayOrSession = !!document.querySelector('.onb-overlay, .session-card');
    apply();
  }
  syncOverlay();
  const observer = new MutationObserver(syncOverlay);
  observer.observe(document.body, { childList:true, subtree:true });

  /* En el inicio, la tarjeta "Mini lección" (junto a la mano de Leo)
     también puede quedar debajo del flotante en mobile. La escondemos
     mientras esa tarjeta esté visible en pantalla. */
  const heroCard = document.querySelector('.hero-v2-card');
  if(heroCard && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      heroCardVisible = entries.some(entry => entry.isIntersecting);
      apply();
    }, { threshold: 0.1 });
    io.observe(heroCard);
  }
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
      if(name !== null){ setProfileName(name.trim()); location.reload(); }
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
  if(p.sessions.length){
    const last = p.sessions[p.sessions.length - 1];
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
  if(changed && p.sessions && p.sessions.length){
    const last = p.sessions[p.sessions.length - 1];
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

/* Llamado por cada motor de sesión al terminar una sesión. */
function recordSession({ skill, level, topics, results, startedAt }){
  const p = loadProgress();
  const now = Date.now();
  const session = {
    skill, level,
    topics: topics || [],
    date: localDateStr(new Date(now)),
    startedAt: startedAt || now,
    durationMs: Math.max(0, now - (startedAt || now)),
    results: results || []
  };
  p.sessions.push(session);
  p.lastActivity = { skill, level, topic: (topics && topics[0]) || null, date: session.date };
  saveProgressRaw(p);
  if(typeof LeoBackend !== 'undefined' && LeoBackend.isConfigured()){
    LeoBackend.pushSession(session);
  }
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
  week.forEach(s => (s.results||[]).forEach(r=>{ if(r.isCorrect === true || r.isCorrect === false) graded.push(r); }));
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
// computeTotalStats y renderSkillsPanel), pero SÍ necesita su propia
// etiqueta/color/página para mostrarse bien en "Continúa donde te
// quedaste" y "Tu actividad reciente". Por eso viven en objetos aparte
// en vez de agregarse a SKILL_LABELS (que también se usa para listar
// las 5 habilidades principales con Object.keys()).
const DISPLAY_SKILL_LABELS = Object.assign({ plan:'Plan de estudio', clases:'Clases interactivas', errores:'Repaso de errores', 'reto-diario':'Reto diario', juego:'English Rush', 'cambridge-reading':'Cambridge Reading', 'cambridge-listening':'Cambridge Listening', 'cambridge-writing':'Cambridge Writing', 'cambridge-speaking':'Cambridge Speaking', 'toefl-reading':'TOEFL Reading', 'toefl-listening':'TOEFL Listening', 'toefl-speaking':'TOEFL Speaking', 'toefl-writing':'TOEFL Writing', 'ielts-reading':'IELTS Reading', 'ielts-listening':'IELTS Listening', 'ielts-speaking':'IELTS Speaking', 'ielts-writing':'IELTS Writing', 'toeic-listening':'TOEIC Listening', 'toeic-reading':'TOEIC Reading', 'toeic-speaking':'TOEIC Speaking', 'toeic-writing':'TOEIC Writing' }, SKILL_LABELS);
const DISPLAY_SKILL_COLORS = Object.assign({ plan:'#253ECC', clases:'#253ECC', errores:'#DC2626', 'reto-diario':'#F5A524', juego:'#DB2777', 'cambridge-reading':'#B45309', 'cambridge-listening':'#B45309', 'cambridge-writing':'#B45309', 'cambridge-speaking':'#B45309', 'toefl-reading':'#6D28D9', 'toefl-listening':'#6D28D9', 'toefl-speaking':'#6D28D9', 'toefl-writing':'#6D28D9', 'ielts-reading':'#0F766E', 'ielts-listening':'#0F766E', 'ielts-speaking':'#0F766E', 'ielts-writing':'#0F766E', 'toeic-listening':'#253ECC', 'toeic-reading':'#253ECC', 'toeic-speaking':'#253ECC', 'toeic-writing':'#253ECC' }, SKILL_COLORS);
const DISPLAY_SKILL_PAGE = Object.assign({ clases:'clases.html', errores:'errores.html', 'reto-diario':'miembros.html', juego:'juego.html', 'cambridge-reading':'cambridge.html', 'cambridge-listening':'cambridge.html', 'cambridge-writing':'cambridge.html', 'cambridge-speaking':'cambridge.html', 'toefl-reading':'toefl.html', 'toefl-listening':'toefl.html', 'toefl-speaking':'toefl.html', 'toefl-writing':'toefl.html', 'ielts-reading':'ielts.html', 'ielts-listening':'ielts.html', 'ielts-speaking':'ielts.html', 'ielts-writing':'ielts.html', 'toeic-listening':'toeic.html', 'toeic-reading':'toeic.html', 'toeic-speaking':'toeic.html', 'toeic-writing':'toeic.html' }, SKILL_PAGE);

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
// Pinta el resultado del análisis en un contenedor vacío que ya exista
// en la tarjeta (reutiliza las mismas clases de feedback que el resto
// del sitio, para que se vea igual que una respuesta de gramática/
// listening en vez de inventar un estilo nuevo).
function renderSpeechScoreBlock(el, targetText, saidText){
  if(!el) return;
  if(saidText === null){
    el.innerHTML = `<p class="audio-missing-note">Tu navegador no puede analizar la pronunciación automáticamente aquí (funciona mejor en Chrome). Puedes seguir escuchando tu grabación y practicando igual.</p>`;
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
    row.querySelector('.retry-btn').addEventListener('click', ()=>{ stopActiveAudioFile(); onRetry(); });
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
  let pool, topics, usedVariantIdxs;
  if(canResume){
    usedVariantIdxs = saved.variantIdxs;
    ({ pool, topics } = rebuildPoolFromVariantIdxs({ skill:'gramatica', bankLevel:GRAMMAR_BANK[level], variantIdxs:usedVariantIdxs, targetCount:saved.total }));
  } else {
    ({ pool, usedVariantIdxs, topics } = buildSessionPool({ skill:'gramatica', level, bankLevel:GRAMMAR_BANK[level], targetCount:SESSION_LENGTHS[getSessionLength()].items }));
  }
  const total = pool.length;
  const startedAt = canResume ? saved.startedAt : Date.now();
  const results = canResume ? saved.results.slice() : [];
  let idx = canResume ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('gramatica', level, { variantIdxs:usedVariantIdxs, total, idx, results, startedAt });
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

function renderGrammarItemInto(container, item, onAnswered){
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
  let pool, usedVariantIdxs;
  if(canResume){
    usedVariantIdxs = saved.variantIdxs;
    ({ pool } = rebuildPoolFromVariantIdxs({ skill:'vocabulario', bankLevel:VOCAB_BANK[level], variantIdxs:usedVariantIdxs, targetCount:saved.total }));
  } else {
    ({ pool, usedVariantIdxs } = buildSessionPool({ skill:'vocabulario', level, bankLevel:VOCAB_BANK[level], targetCount:SESSION_LENGTHS[getSessionLength()].items }));
  }
  const total = pool.length;
  const startedAt = canResume ? saved.startedAt : Date.now();
  const results = canResume ? saved.results.slice() : [];
  let idx = canResume ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('vocabulario', level, { variantIdxs:usedVariantIdxs, total, idx, results, startedAt });
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
  let pool, usedVariantIdxs;
  if(canResume){
    usedVariantIdxs = saved.variantIdxs;
    ({ pool } = rebuildPoolFromVariantIdxs({ skill:'listening', bankLevel:LISTENING_BANK[level], variantIdxs:usedVariantIdxs, targetCount:saved.total }));
  } else {
    ({ pool, usedVariantIdxs } = buildSessionPool({ skill:'listening', level, bankLevel:LISTENING_BANK[level], targetCount:SESSION_LENGTHS[getSessionLength()].items }));
  }
  const total = pool.length;
  const startedAt = canResume ? saved.startedAt : Date.now();
  const results = canResume ? saved.results.slice() : [];
  let idx = canResume ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('listening', level, { variantIdxs:usedVariantIdxs, total, idx, results, startedAt });
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
  let pool, usedVariantIdxs;
  if(canResume){
    usedVariantIdxs = saved.variantIdxs;
    ({ pool } = rebuildPoolFromVariantIdxs({ skill:'lectura', bankLevel:READING_BANK[level], variantIdxs:usedVariantIdxs, targetCount:saved.total }));
  } else {
    ({ pool, usedVariantIdxs } = buildSessionPool({ skill:'lectura', level, bankLevel:READING_BANK[level], targetCount:SESSION_LENGTHS[getSessionLength()].items }));
  }
  const total = pool.length;
  const startedAt = canResume ? saved.startedAt : Date.now();
  const results = canResume ? saved.results.slice() : [];
  let idx = canResume ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('lectura', level, { variantIdxs:usedVariantIdxs, total, idx, results, startedAt });
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

function evaluateWritingAnswer(text, item){
  const clean = (text || '').trim().toLowerCase();
  if(clean.length < 3) return { isOk:false, hint:item.hint };
  let patternOk = false;
  try{ patternOk = new RegExp(item.checkPattern, 'i').test(clean); }catch(e){ patternOk = false; }
  if(!patternOk) return { isOk:false, hint:item.hint };
  const modalHint = findModalVerbFormError(clean);
  if(modalHint) return { isOk:false, hint:modalHint };
  return { isOk:true, hint:null };
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
  let pool, usedVariantIdxs;
  if(canResume){
    usedVariantIdxs = saved.variantIdxs;
    ({ pool } = rebuildPoolFromVariantIdxs({ skill:'writing', bankLevel:WRITING_BANK[level], variantIdxs:usedVariantIdxs, targetCount:saved.total }));
  } else {
    ({ pool, usedVariantIdxs } = buildSessionPool({ skill:'writing', level, bankLevel:WRITING_BANK[level], targetCount:SESSION_LENGTHS[getSessionLength()].items }));
  }
  const total = pool.length;
  const startedAt = canResume ? saved.startedAt : Date.now();
  const results = canResume ? saved.results.slice() : [];
  let idx = canResume ? saved.idx : 0;

  // Validación estructural honesta: no es IA, es una comprobación de patrón
  // (¿aparece la estructura objetivo en el texto?). No mide "buen inglés"
  // en general, solo si la estructura pedida está presente.
  function checkWriting(text, item){
    return evaluateWritingAnswer(text, item).isOk;
  }

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('writing', level, { variantIdxs:usedVariantIdxs, total, idx, results, startedAt });
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
      results.push({ itemId:item.id, isCorrect:isOk });
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
  let pool, usedVariantIdxs;
  if(canResume){
    usedVariantIdxs = saved.variantIdxs;
    ({ pool } = rebuildPoolFromVariantIdxs({ skill:'speaking', bankLevel:SPEAKING_BANK[level], variantIdxs:usedVariantIdxs, targetCount:saved.total }));
  } else {
    ({ pool, usedVariantIdxs } = buildSessionPool({ skill:'speaking', level, bankLevel:SPEAKING_BANK[level], targetCount:SESSION_LENGTHS[getSessionLength()].items }));
  }
  const total = pool.length;
  const startedAt = canResume ? saved.startedAt : Date.now();
  const results = canResume ? saved.results.slice() : [];
  let idx = canResume ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('speaking', level, { variantIdxs:usedVariantIdxs, total, idx, results, startedAt });
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
          stream = await navigator.mediaDevices.getUserMedia({ audio:true });
        }catch(err){
          compareRow.innerHTML = `<p class="audio-missing-note">No pudimos acceder al micrófono. Revisa los permisos del navegador.</p>`;
          return;
        }
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = ()=>{
          const blob = new Blob(chunks, { type:'audio/webm' });
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
  if(entry.kind === 'grammar'){
    renderGrammarItemInto(card, item, onAnswered);
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
      onAnswered(isOk);
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
          stream = await navigator.mediaDevices.getUserMedia({ audio:true });
        }catch(err){
          compareRow.innerHTML = `<p class="audio-missing-note">No pudimos acceder al micrófono. Revisa los permisos del navegador.</p>`;
          return;
        }
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = ()=>{
          const blob = new Blob(chunks, { type:'audio/webm' });
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

     - Visitante sin cuenta: prueba GUEST_EXERCISE_LIMIT ejercicios y
       ya. No se reinicia por día a propósito (es una prueba única
       antes de pedirle cuenta, no una cuota diaria).
     - Cuenta gratis (is_member=false): FREE_USER_DAILY_LIMIT
       ejercicios POR DÍA, ligados a la cuenta (no solo al navegador).
     - Miembro (is_member=true): sin límite. Esto no cambió: las
       páginas de miembros nunca llaman a freeDailyLimitReached().

   Para cambiar los números basta con tocar estas dos constantes.
   Nada más en el sitio necesita tocarse.

   Ninguno de estos límites es "a prueba de trampas" (localStorage se
   puede borrar, y el conteo de cuenta gratis se manda desde el
   navegador): son para frenar el uso normal y guiar hacia crear
   cuenta / hacerse miembro, no un candado de seguridad. Es la misma
   idea que ya existía antes con FREE_DAILY_EXERCISE_LIMIT, solo que
   ahora se reparte en dos niveles en vez de uno. */
var GUEST_EXERCISE_LIMIT = 10;
var FREE_USER_DAILY_LIMIT = 20;

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
  try{ if(typeof fbq === 'function') fireMetaPixelEvent(name); }catch(e){}
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
function fireMetaPixelEvent(name){
  var metaName = META_PIXEL_EVENT_MAP[name];
  if(!metaName) return;
  if(metaName === 'Purchase'){
    fbq('track', 'Purchase', { value: 2, currency: 'USD' });
  } else {
    fbq('track', metaName);
  }
}

function todayStr(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

/* ---- Visitante sin cuenta: contador único (no diario) en
   localStorage. Igual que el sistema anterior: abrir una ventana de
   incógnito o borrar los datos del sitio lo reinicia, y es un riesgo
   aceptado (no es la barrera real; la barrera real es pedir cuenta). */
function getGuestExerciseCount(){
  try{ return parseInt(localStorage.getItem('leoGuestExerciseCount'), 10) || 0; }catch(e){ return 0; }
}
function bumpGuestExerciseCount(){
  try{ localStorage.setItem('leoGuestExerciseCount', String(getGuestExerciseCount() + 1)); }catch(e){}
}

/* ---- Cuenta gratis: contador diario ligado al id de la cuenta.
   localStorage es la copia rápida de "hoy" (para no depender de la
   red en cada clic); Supabase (profiles.free_daily_count /
   free_daily_date, ver supabase_schema.sql) es la copia que viaja
   con la cuenta entre dispositivos. Si Supabase no responde o esas
   columnas todavía no existen, sigue funcionando solo con
   localStorage (se degrada, no se rompe). */
function freeAcctLocalKey(userId){
  return `leoFreeAcctCount:${userId}:${todayStr()}`;
}
function getFreeAcctExerciseCount(){
  const userId = _leoAccessProfile && _leoAccessProfile.id;
  if(!userId) return 0;
  try{ return parseInt(localStorage.getItem(freeAcctLocalKey(userId)), 10) || 0; }catch(e){ return 0; }
}
function bumpFreeAcctExerciseCount(){
  const userId = _leoAccessProfile && _leoAccessProfile.id;
  if(!userId) return;
  const next = getFreeAcctExerciseCount() + 1;
  try{ localStorage.setItem(freeAcctLocalKey(userId), String(next)); }catch(e){}
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
  }
}

/* ---- Punto único que usan las 5 sesiones gratis + runMixSessionCore.
   Nadie más en el sitio debe leer/escribir estos contadores a mano:
   siempre a través de estas tres funciones. */
function freeDailyLimitReached(){
  if(_leoAccessTier === 'free') return getFreeAcctExerciseCount() >= FREE_USER_DAILY_LIMIT;
  return getGuestExerciseCount() >= GUEST_EXERCISE_LIMIT;
}
function bumpFreeDailyExerciseCount(){
  if(_leoAccessTier === 'free') bumpFreeAcctExerciseCount();
  else bumpGuestExerciseCount();
}
function renderFreeDailyLimitReachedBlock(){
  if(_leoAccessTier === 'free'){
    trackLeoEvent('free_daily_limit_reached');
    return `
      <div class="session-summary upgrade-block">
        <h2>¡Completaste tus ${FREE_USER_DAILY_LIMIT} ejercicios gratis de hoy!</h2>
        <p class="summary-score">Vas muy bien. Si quieres seguir ahora mismo, como miembro practicas sin límite:</p>
        <ul class="upgrade-benefits">
          <li>Práctica ilimitada de gramática, vocabulario, listening, speaking y writing</li>
          <li>Preparación para TOEIC, TOEFL, IELTS y Cambridge</li>
          <li>Clases interactivas y repaso automático de tus errores</li>
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
    renderMixItemInto(card, entry, (isCorrect)=>{
      results.push({ itemId: entry.item.id, isCorrect });
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
      container.innerHTML = renderFreeSessionSummary({
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
function computePlanSelection(level, targetCount){
  const p = loadProgress();

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
  const skills = DASH_SKILLS.slice();
  const weights = {};
  skills.forEach(sk=>{
    const acc = computeSkillAccuracy(p, sk);
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

  return { mistakeCount, bySkill };
}

// Arma los ejercicios de verdad a partir de una seleccion ya decidida
// (ver computePlanSelection). Aqui SI se usa buildSessionPool de las
// paginas normales (con su misma memoria de "no repetir variante"), asi
// que esta funcion debe llamarse una sola vez por sesion real, no en
// cada repintado de la vista previa.
function buildPlanPool(level, selection){
  const entries = (selection.mistakeCount > 0 ? buildMistakePool(selection.mistakeCount) : [])
    .map(e => Object.assign({ reviewOrigin:true }, e));
  DASH_SKILLS.forEach(sk=>{
    const count = selection.bySkill[sk] || 0;
    if(!count) return;
    const { pool } = buildSessionPool({ skill: sk, level, bankLevel: PLAN_BANK_BY_SKILL[sk][level], targetCount: count });
    pool.forEach(item => entries.push({ kind: PLAN_SKILL_TO_KIND[sk], item }));
  });
  return shuffleArray(entries);
}

// Agrupa una seleccion para la vista previa ("Tu sesion de hoy"): solo
// muestra las categorias que de verdad va a usar la sesion (nunca un
// "0 ejercicios").
function summarizePlanSelection(selection){
  const groups = [];
  if(selection.mistakeCount > 0) groups.push({ label:'Repaso de errores', count: selection.mistakeCount });
  DASH_SKILLS.forEach(sk=>{
    const count = selection.bySkill[sk] || 0;
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
function renderPlanIntro(container){
  if(!container) return;
  const level = getUserLevel();
  let currentLen = getPlanLength();
  let currentDiff = getPlanDifficulty();
  let currentSelection = computePlanSelection(level, PLAN_LENGTHS[currentLen].items);
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
        <ul class="plan-preview-list">
          ${groups.length ? groups.map(g=>`<li><span>${g.label}</span><b>${g.count} ${g.count===1?'ejercicio':'ejercicios'}</b></li>`).join('') : '<li><span>Sesión equilibrada para tu nivel</span></li>'}
        </ul>
        <button class="btn btn-primary btn-block" id="planStartBtn">Empezar mi sesión →</button>
      </div>`;
    renderPlanLengthSelector(document.getElementById('planLengthSelector'), currentLen, (newLen)=>{
      currentLen = newLen;
      setPlanLength(newLen);
      currentSelection = computePlanSelection(level, PLAN_LENGTHS[newLen].items);
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
    container.querySelector('#planStartBtn').addEventListener('click', ()=>{
      const contentLevel = resolvePlanContentLevel(level, currentDiff);
      const pool = buildPlanPool(contentLevel, currentSelection);
      runPlanSessionCore({ container, level, pool, onAnother: ()=> renderPlanIntro(container) });
    });
  }
  paint();
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
    renderMixItemInto(card, entry, (isCorrect)=>{
      results.push({ itemId: entry.item.id, isCorrect, skill: PLAN_KIND_TO_SKILL[entry.kind] });
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
    recordSession({ skill:'plan', level, topics, results, startedAt });
    container.innerHTML = renderPlanSessionSummary({ correct, graded: graded.length, total, topics });
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
      variant.forEach(topic=> topic.items.forEach(item=> index.set(item.id, { kind:'grammar', item })));
    });
    VOCAB_BANK[level].forEach(variant=> variant.forEach(item=> index.set(item.id, { kind:'vocab', item })));
    LISTENING_BANK[level].forEach(variant=> variant.forEach(item=> index.set(item.id, { kind:'listening', item })));
    WRITING_BANK[level].forEach(variant=> variant.forEach(item=> index.set(item.id, { kind:'writing', item })));
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

// Banner "Tus errores frecuentes" del panel de miembros. Si no hay
// errores pendientes, se oculta la sección entera (no se inventa
// un mensaje de "0 errores", simplemente no aparece). chipsEl es
// opcional: si se pasa, se llena con el desglose real por habilidad
// (solo las que sí tienen errores pendientes, nunca un "0").
function renderMistakesBanner(sectionEl, textEl, chipsEl){
  if(!sectionEl) return;
  const count = computeMistakeIds().length;
  if(!count){ sectionEl.style.display = 'none'; return; }
  sectionEl.style.display = '';
  if(textEl){
    textEl.innerHTML = count === 1
      ? 'Tienes <span class="mistakes-count">1 ejercicio</span> pendiente de repasar.'
      : `Tienes <span class="mistakes-count">${count} ejercicios</span> pendientes de repasar.`;
  }
  if(chipsEl){
    const counts = computeMistakeCountsByKind();
    chipsEl.innerHTML = ['grammar','vocab','listening','writing']
      .filter(kind => counts[kind] > 0)
      .map(kind => `<span class="mistakes-chip">${MIX_KIND_LABEL[kind]} <b>${counts[kind]}</b></span>`)
      .join('');
  }
}

function runMistakesSessionCore({ container }){
  stopActiveAudioFile(); // corta cualquier audio que haya quedado sonando de otra sección/nivel.
  const saved = loadInflightSession('errores', 'todos');
  const useSaved = !!(saved && Array.isArray(saved.pool) && typeof saved.idx === 'number' && saved.idx < saved.pool.length);
  const pool = useSaved ? saved.pool : buildMistakePool();
  const total = pool.length;

  if(!total){
    clearInflightSession('errores', 'todos');
    container.innerHTML = `
      <div class="session-summary">
        <h2>¡Vas muy bien!</h2>
        <p class="summary-score">No tienes errores pendientes por repasar ahora mismo.</p>
        <div class="summary-actions">
          <a href="miembros.html" class="btn btn-primary">Volver a tu panel</a>
        </div>
      </div>`;
    return;
  }

  const startedAt = useSaved ? saved.startedAt : Date.now();
  const results = useSaved ? saved.results.slice() : [];
  let idx = useSaved ? saved.idx : 0;

  function renderItem(){
    const entry = pool[idx];
    saveInflightSession('errores', 'todos', { pool, idx, results, startedAt });
    const pct = Math.round(((idx+1)/total)*100);
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="session-head">
        <span class="practice-level-tag">Mis errores · ${MIX_KIND_LABEL[entry.kind]}</span>
        <span class="session-count">Ejercicio ${idx+1} de ${total}</span>
      </div>
      <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>`;
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderMixItemInto(card, entry, (isCorrect)=>{
      results.push({ itemId: entry.item.id, isCorrect });
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    });
  }

  function finish(){
    clearInflightSession('errores', 'todos');
    recordSession({ skill:'errores', level:'todos', topics:['Repaso de errores'], results, startedAt });
    const graded = results.filter(r=> r.isCorrect === true || r.isCorrect === false);
    const correct = graded.filter(r=>r.isCorrect).length;
    const score = graded.length ? `${correct} / ${graded.length} correctas` : `${total} ejercicios completados`;
    container.innerHTML = renderSessionSummary({ title:'¡Listo!', score, topics: ['Repaso de errores'] });
    wireSummaryButtons(container, ()=> runMistakesSessionCore({ container }));
  }

  renderItem();
}
function runMistakesSession({ container }){
  runMistakesSessionCore({ container });
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
    renderMixItemInto(card, entry, (isCorrect)=>{
      results.push({ itemId: entry.item.id, isCorrect });
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
    // Cambridge (B2 First / C1 Advanced) tampoco usa niveles A1-C1 del
    // sistema normal (usa 'cambridge'/'cambridge-c1' como level), así que
    // necesita su propia rama aquí, igual que TOEFL/IELTS abajo (si no,
    // el bloque genérico truena buscando LEVEL_META['cambridge']).
    const examLevelLabel = (last.level === 'cambridge-c1') ? 'C1 Advanced' : 'B2 First';
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

/* Frase corta de animo en la parte superior del panel de miembros
   (junto al saludo). Se elige una de una lista chica segun el dia
   del ano, asi cambia de un dia a otro sin depender de nada externo
   ni de que el usuario haga algo. Puramente decorativo, no guarda
   nada ni afecta ninguna otra logica. */
const DASH_QUOTES = [
  { es: 'Pequeños pasos, grandes resultados.', en: 'Keep going.' },
  { es: 'Cada ejercicio cuenta.', en: 'You are doing great.' },
  { es: 'La práctica constante vence al talento.', en: 'Do not stop now.' },
  { es: 'Hoy puedes aprender algo nuevo.', en: 'Let us go further.' },
  { es: 'Tu inglés mejora cada día que practicas.', en: 'Keep it up.' },
  { es: 'Un poco cada día suma muchísimo.', en: 'Small steps count.' },
];
function renderDashQuote(container){
  if(!container) return;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  const q = DASH_QUOTES[dayOfYear % DASH_QUOTES.length];
  container.innerHTML = `
    <span class="dash-quote-icon">
      <svg viewBox="0 0 24 24" fill="none"><path d="M9.5 7.5c-2.2 0-4 1.8-4 4v5h5v-5h-2.6c0-1.4 1.1-2.5 2.5-2.5V7.5zm9 0c-2.2 0-4 1.8-4 4v5h5v-5h-2.6c0-1.4 1.1-2.5 2.5-2.5V7.5z" fill="currentColor"/></svg>
    </span>
    <span>
      <span class="dash-quote-es">${q.es}</span>
      <span class="dash-quote-en">${q.en}</span>
    </span>`;
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
    list.forEach(s => (s.results||[]).forEach(r=>{ if(r.isCorrect === true || r.isCorrect === false) graded.push(r); }));
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

function renderProgressStatCards(container, stats, streak, level, practicedCount){
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
        <div class="stat-card-delta ${practicedCount>0 ? 'up' : 'flat'}">${practicedCount>0 ? '¡Sigue así!' : 'Practica hoy para empezar'}</div>
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

/* Habilidades reales que se muestran en "Tu avance por habilidad".
   "Mixto" no se incluye aquí a propósito: es una mezcla de las otras
   5, no una habilidad aparte (ver nota en renderProgressPage/DEVLOG). */
const PROGRESS_SKILLS_DISPLAY = ['gramatica','vocabulario','listening','writing','speaking'];

function renderSkillsPanel(container, p){
  if(!container) return;
  container.innerHTML = PROGRESS_SKILLS_DISPLAY.map(skill=>{
    const pct = computeSkillCoverage(p, skill);
    const color = SKILL_COLORS[skill];
    return `
      <a href="${SKILL_PAGE[skill]}" class="skill-row-link">
        <span class="skill-row-label">${SKILL_LABELS[skill]}</span>
        <span class="skill-row-track"><span class="skill-row-fill" style="width:${pct}%;background:${color};"></span></span>
        <span class="skill-row-pct">${pct}%</span>
        <span class="skill-row-practice">Practicar →</span>
      </a>`;
  }).join('');
}

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
  const weekDays = computeWeeklyBarData();
  const practicedCount = weekDays.filter(d=>d.count>0).length;

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

  root.innerHTML = `
    <div class="section-head">
      <h2>Tu progreso</h2>
      <p>Aquí puedes ver tu avance y seguir practicando. ¡Vas muy bien!</p>
    </div>

    <div class="stat-cards" id="progressStatCards"></div>

    <div class="section-head" style="margin-top:44px;">
      <h2 style="font-size:1.5rem;">Tu avance por habilidad</h2>
      <p>Mira qué tanto has practicado en cada área.</p>
    </div>
    <div class="skills-panel" id="skillsPanel"></div>

    <div class="section-head" style="margin-top:44px;">
      <h2 style="font-size:1.5rem;">Tu actividad</h2>
    </div>
    <div class="bottom-grid" id="progressBottomGrid">
      <div class="activity-card" id="progressRecent"></div>
      <div class="weekly-chart-card" id="progressWeekly"></div>
      <div class="tip-card" id="progressTip"></div>
    </div>

    <div class="section-head" style="margin-top:44px;">
      <h2 style="font-size:1.5rem;">Continúa aprendiendo</h2>
    </div>
    <div class="continue-card">
      <div>
        <div class="continue-eyebrow">Recomendado para ti</div>
        <div class="continue-title">${SKILL_LABELS[recommendation.skill]}</div>
        <div class="continue-sub">${recommendation.reason}</div>
      </div>
      <a href="${SKILL_PAGE[recommendation.skill]}" class="btn btn-primary">Practicar →</a>
    </div>`;

  renderProgressStatCards(document.getElementById('progressStatCards'), stats, streak, level, practicedCount);
  renderSkillsPanel(document.getElementById('skillsPanel'), p);
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

/* ---------- Resumen de sesión gratis (independiente del de Miembros) ---------- */
function renderFreeSessionSummary({ title, score, topics }){
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
      <div class="summary-unlock">
        <p class="summary-unlock-label">¿Quieres llevar tu práctica más lejos?</p>
        <p class="summary-unlock-copy">Guarda tu progreso, repasa tus errores, completa retos diarios, prepárate para el TOEFL, practica con clases de situaciones reales y más.</p>
        <a href="miembros.html" class="btn btn-primary btn-block">Conocer la membresía por $2/mes</a>
      </div>
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
    container.innerHTML = renderFreeSessionSummary({
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
    container.innerHTML = renderFreeSessionSummary({
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
    container.innerHTML = renderFreeSessionSummary({
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
    container.innerHTML = renderFreeSessionSummary({
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
          stream = await navigator.mediaDevices.getUserMedia({ audio:true });
        }catch(err){
          compareRow.innerHTML = `<p class="audio-missing-note">No pudimos acceder al micrófono. Revisa los permisos del navegador.</p>`;
          return;
        }
        chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = ()=>{
          const blob = new Blob(chunks, { type:'audio/webm' });
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
    container.innerHTML = renderFreeSessionSummary({
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

/* ---------- Mini lección del día (home) ----------
   Elige un ejemplo al azar de GRAMMAR_BANK cada vez que se carga la
   página, para que se sienta distinta en cada visita/refresh en vez
   de repetir siempre la misma. No requiere backend: todo pasa en el
   navegador. */
function pickDailyGrammarExample(){
  if(typeof GRAMMAR_BANK === 'undefined') return null;
  const pool = [];
  Object.keys(GRAMMAR_BANK).forEach(level=>{
    GRAMMAR_BANK[level].forEach(variant=>{
      variant.forEach(topic=>{
        topic.items.forEach(item=>{
          if(item.examples && item.examples.length){
            pool.push({ en: item.examples[0].en, es: item.examples[0].es, explain: item.explain });
          }
        });
      });
    });
  });
  if(!pool.length) return null;
  /* La tarjeta del inicio es compacta (en mobile queda junto a la mano
     del personaje), así que preferimos ejemplos cortos para que quepan
     bien. Si por algún motivo no hay ninguno corto, usamos el pool
     completo como respaldo (nunca se queda sin mini lección). */
  const shortPool = pool.filter(p => p.en.length <= 45 && p.explain.length <= 90);
  const finalPool = shortPool.length ? shortPool : pool;
  const randomIndex = Math.floor(Math.random() * finalPool.length);
  return finalPool[randomIndex];
}
function renderDailyMiniLesson(){
  const lesson = pickDailyGrammarExample();
  if(!lesson) return;
  const enEl = document.querySelector('.hero-v2-card-en');
  const esEl = document.querySelector('.hero-v2-card-es');
  const explainEl = document.querySelector('.hero-v2-card-explain');
  if(enEl) enEl.textContent = lesson.en;
  if(esEl) esEl.textContent = lesson.es;
  if(explainEl) explainEl.textContent = lesson.explain;
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

async function initArticleComments(){
  const root = document.getElementById('article-comments');
  if(!root) return;

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
