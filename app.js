/* ============================================================
   Inglés con Leo — app.js
   Lógica compartida por todas las páginas: perfil/onboarding,
   acceso de miembros, progreso (real, calculado desde
   localStorage) y los "motores" de sesión de cada habilidad.
   El contenido de los ejercicios vive en data.js.
   No hay backend: todo se guarda en el navegador del usuario.
   ============================================================ */

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
  { label:'Tu progreso', href:'progreso.html' },
  { label:'Panel de miembros', href:'miembros.html' },
  { label:'Artículos', href:'articulos.html' },
  { label:'Practicar gratis (sin cuenta)', href:'practica.html' }
];

function closeAllNavPops(){
  document.querySelectorAll('.nav-pop.open').forEach(el=> el.classList.remove('open'));
}

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
  const today = new Date().toISOString().slice(0,10);
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
      window.alert('Tu membresía es de $2 USD / mes (≈$40 MXN) vía Mercado Pago.\n\nPara cambiar tu método de pago o cancelarla, entra a tu cuenta de Mercado Pago → Actividad → Suscripciones.');
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
      <h2>¡Bienvenido a Inglés con Leo!</h2>
      <p>Cuéntanos un poco de ti para personalizar tu práctica. Esto queda guardado solo en tu navegador, no usamos servidores.</p>
      <div class="onb-field">
        <label for="onbName">¿Cómo te llamas?</label>
        <input type="text" id="onbName" placeholder="Tu nombre" maxlength="30" autocomplete="off">
      </div>
      <div class="onb-field">
        <label>¿Cuál es tu nivel de inglés?</label>
        <div class="onb-levels" id="onbLevels">
          <label class="onb-level-opt">
            <input type="radio" name="onbLevel" value="facil" checked>
            <span>Fácil (A1–A2) — estoy empezando</span>
          </label>
          <label class="onb-level-opt">
            <input type="radio" name="onbLevel" value="medio">
            <span>Medio (B1–B2) — me defiendo</span>
          </label>
          <label class="onb-level-opt">
            <input type="radio" name="onbLevel" value="avanzado">
            <span>Avanzado (C1+) — quiero perfeccionar</span>
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
const MIN_SESSIONS_FOR_STATS = 1;

function loadProgress(){
  try{
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if(p && Array.isArray(p.sessions)) return p;
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
    date: new Date(now).toISOString().slice(0,10),
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
  if(skill === 'writing') return LEVELS.reduce((sum,l)=> sum + WRITING_BANK[l].reduce((vs,variant)=> vs + variant.length, 0), 0);
  if(skill === 'speaking') return LEVELS.reduce((sum,l)=> sum + SPEAKING_BANK[l].reduce((vs,variant)=> vs + variant.length, 0), 0);
  if(skill === 'mixto') return LEVELS.length * MIX_NOMINAL_SIZE;
  return 0;
}

function attemptedItemIdsFor(p, skill){
  const ids = new Set();
  p.sessions.filter(s=>s.skill===skill).forEach(s=>{
    (s.results||[]).forEach(r=> ids.add(r.itemId));
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

function computeStreak(){
  const p = loadProgress();
  const dates = Array.from(new Set(p.sessions.map(s=>s.date))).sort().reverse();
  if(!dates.length) return 0;
  let streak = 0;
  let cursor = new Date();
  for(let i=0;i<dates.length;i++){
    const cursorStr = cursor.toISOString().slice(0,10);
    if(dates[i] === cursorStr){
      streak++;
      cursor.setDate(cursor.getDate()-1);
    } else if(i===0 && dates[0] !== cursorStr){
      const yest = new Date(); yest.setDate(yest.getDate()-1);
      if(dates[0] === yest.toISOString().slice(0,10)){
        streak = 1;
        cursor = yest;
        cursor.setDate(cursor.getDate()-1);
      } else break;
    } else break;
  }
  return streak;
}

const SKILL_LABELS = { gramatica:'Gramática', vocabulario:'Vocabulario', listening:'Listening', writing:'Writing', speaking:'Speaking', mixto:'Mixto' };
const SKILL_COLORS = { gramatica:'#EF5A45', vocabulario:'#1FA463', listening:'#3554F0', writing:'#F5A524', speaking:'#8B5CF6', mixto:'#0EA5A0' };
const SKILL_PAGE = { gramatica:'gramatica.html', vocabulario:'vocabulario.html', listening:'listening.html', writing:'writing.html', speaking:'speaking.html', mixto:'mixto.html' };

// "Clases interactivas" es una actividad aparte de las 5 habilidades de
// arriba (no debe sumarse a sus anillos/porcentajes de cobertura, ver
// computeTotalStats y renderSkillsPanel), pero SÍ necesita su propia
// etiqueta/color/página para mostrarse bien en "Continúa donde te
// quedaste" y "Tu actividad reciente". Por eso viven en objetos aparte
// en vez de agregarse a SKILL_LABELS (que también se usa para listar
// las 5 habilidades principales con Object.keys()).
const DISPLAY_SKILL_LABELS = Object.assign({ clases:'Clases interactivas' }, SKILL_LABELS);
const DISPLAY_SKILL_COLORS = Object.assign({ clases:'#253ECC' }, SKILL_COLORS);
const DISPLAY_SKILL_PAGE = Object.assign({ clases:'clases.html' }, SKILL_PAGE);

// Mixto no tiene su propio banco: combina ítems reales de los otros 5.
// Usamos un tamaño nominal (8 ítems por sesión, igual a MIX_COUNTS) solo
// para que la barra de cobertura en Progreso tenga un total razonable.
const MIX_NOMINAL_SIZE = 8;

function bankSizeForLevel(skill, level){
  if(skill === 'gramatica') return GRAMMAR_BANK[level].reduce((vs,variant)=> vs + variant.reduce((s,t)=> s+t.items.length, 0), 0);
  if(skill === 'vocabulario') return VOCAB_BANK[level].reduce((vs,variant)=> vs + variant.length, 0);
  if(skill === 'listening') return LISTENING_BANK[level].reduce((vs,variant)=> vs + variant.length, 0);
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
function pickVariantIndex(skill, level, variantCount){
  if(!variantCount || variantCount <= 1) return 0;
  const map = getLastVariantMap();
  const key = skill + '_' + level;
  const last = map[key];
  const choices = [];
  for(let i=0; i<variantCount; i++){ if(i !== last) choices.push(i); }
  const pool = choices.length ? choices : [0];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  map[key] = pick;
  saveLastVariantMap(map);
  return pick;
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

/* ---------- UI: feedback con explicación + ejemplos ---------- */
const OK_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#1FA463"/><path d="M6 10l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BAD_ICON = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#EF5A45"/><path d="M7 7l6 6M13 7l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
const PLAY_ICON = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="currentColor"/></svg>';
const MIC_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

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
  row.querySelector('.next-btn').addEventListener('click', cb);
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
function playAudioFile(path, container){
  let audio;
  try{
    audio = new Audio(path);
  }catch(e){
    showAudioMissingNote(container);
    return;
  }
  audio.addEventListener('error', ()=> showAudioMissingNote(container));
  const p = audio.play();
  if(p && typeof p.catch === 'function'){
    p.catch(()=> showAudioMissingNote(container));
  }
}

/* ============================================================
   SESIÓN DE GRAMÁTICA
   Una sesión = todos los ítems del nivel (mezcla de sus 2 temas).
   ============================================================ */
function runGrammarSession({ container, level, onExit }){
  const variantIdx = pickVariantIndex('gramatica', level, GRAMMAR_BANK[level].length);
  const topics = GRAMMAR_BANK[level][variantIdx];
  const pool = [];
  const maxLen = Math.max(...topics.map(t=>t.items.length));
  for(let i=0;i<maxLen;i++){
    topics.forEach(t=>{ if(t.items[i]) pool.push(Object.assign({ topic:t.topic }, t.items[i])); });
  }
  const total = pool.length;
  const startedAt = Date.now();
  const results = [];
  let idx = 0;

  function renderItem(){
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
      showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      });
    });
  }

  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    recordSession({ skill:'gramatica', level, topics: topics.map(t=>t.topic), results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`${correct} / ${total} correctas`,
      topics: topics.map(t=>t.topic)
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
      <div class="practice-prompt">${item.prompt}</div>
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
      <div class="practice-prompt">Completa la frase</div>
      <div class="blank-row" id="sentenceRow"></div>
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
    const cleanTokens = tokens.map(w => w.replace(/[.,]/g,''));
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
      <div class="practice-prompt">Encuentra el error — toca la palabra incorrecta</div>
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
        const rightClean = rightTokens.map(w => w.replace(/[.,]/g,''));
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
        box.innerHTML = rightHtml;
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
  const variantIdx = pickVariantIndex('vocabulario', level, VOCAB_BANK[level].length);
  const pool = VOCAB_BANK[level][variantIdx];
  const total = pool.length;
  const startedAt = Date.now();
  const results = [];
  let idx = 0;

  function renderItem(){
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
        showNextButton(card, idx+1 < total ? 'Siguiente palabra →' : 'Ver resultado →', ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        });
      });
      list.appendChild(b);
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    recordSession({ skill:'vocabulario', level, topics:['Vocabulario general'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`Repasaste ${total} palabras · ${correct}/${total} en el mini quiz`,
      topics: ['Vocabulario general']
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
  const variantIdx = pickVariantIndex('listening', level, LISTENING_BANK[level].length);
  const pool = LISTENING_BANK[level][variantIdx];
  const total = pool.length;
  const startedAt = Date.now();
  const results = [];
  let idx = 0;

  function renderItem(){
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
        showNextButton(card, idx+1 < total ? 'Siguiente audio →' : 'Ver resultado →', ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        });
      });
      list.appendChild(b);
    });
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    recordSession({ skill:'listening', level, topics:['Comprensión auditiva'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`${correct} / ${total} correctas`,
      topics: ['Comprensión auditiva']
    });
    wireSummaryButtons(container, ()=>runListeningSession({ container, level, onExit }));
  }
  renderItem();
}

/* ============================================================
   SESIÓN DE WRITING — sin corrección automática "inteligente".
   Ofrecemos ejemplo + checklist de autorrevisión, honesto.
   ============================================================ */
function runWritingSession({ container, level, onExit }){
  const variantIdx = pickVariantIndex('writing', level, WRITING_BANK[level].length);
  const pool = WRITING_BANK[level][variantIdx];
  const total = pool.length;
  const startedAt = Date.now();
  const results = [];
  let idx = 0;

  // Validación estructural honesta: no es IA, es una comprobación de patrón
  // (¿aparece la estructura objetivo en el texto?). No mide "buen inglés"
  // en general, solo si la estructura pedida está presente.
  function checkWriting(text, item){
    const clean = (text || '').trim().toLowerCase();
    if(clean.length < 3) return false;
    try{
      const re = new RegExp(item.checkPattern, 'i');
      return re.test(clean);
    }catch(e){
      return false;
    }
  }

  function renderItem(){
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
    let reviewed = false;

    function doReview(){
      const text = input.value;
      const isOk = checkWriting(text, item);
      reviewed = true;
      fb.classList.add('show');
      fb.classList.toggle('ok', isOk);
      fb.classList.toggle('bad', !isOk);
      if(isOk){
        fb.innerHTML = `
          <div class="fb-head">${OK_ICON}<span>Bien encaminado ✓</span></div>
          <p class="fb-explain">Tu frase incluye la estructura que buscábamos.</p>
          <div class="examples-block">
            <div class="examples-label">Ejemplo</div>
            <div class="example-pair"><div class="example-en">${item.example.en}</div><div class="example-es">${item.example.es}</div></div>
          </div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
      } else {
        fb.innerHTML = `
          <div class="fb-head">${BAD_ICON}<span>Revisa esto</span></div>
          <p class="fb-explain">${item.hint}</p>
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
    recordSession({ skill:'writing', level, topics:['Escritura guiada'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`${okCount} / ${total} frases bien encaminadas`,
      topics: ['Escritura guiada']
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
  const variantIdx = pickVariantIndex('speaking', level, SPEAKING_BANK[level].length);
  const pool = SPEAKING_BANK[level][variantIdx];
  const total = pool.length;
  const startedAt = Date.now();
  const results = [];
  let idx = 0;

  function renderItem(){
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
      let stream = null, recorder = null, chunks = [];
      const recordBtn = card.querySelector('#recordBtn');
      const compareRow = card.querySelector('#compareRow');
      const retryBtn = card.querySelector('#retryBtn');

      const recIndicator = card.querySelector('#recIndicator');
      recordBtn.addEventListener('click', async ()=>{
        if(recorder && recorder.state === 'recording'){
          recorder.stop();
          return;
        }
        compareRow.innerHTML = ''; // evitar mensajes/errores previos duplicados
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
        };
        recorder.start();
        recordBtn.textContent = 'Detener grabación';
        if(recIndicator) recIndicator.hidden = false;
      });
      retryBtn.addEventListener('click', ()=>{
        compareRow.innerHTML = '';
        retryBtn.style.display = 'none';
        recordBtn.innerHTML = `${MIC_ICON} Grabar mi voz`;
        if(recIndicator) recIndicator.hidden = true;
      });
    }
  }
  function finish(){
    recordSession({ skill:'speaking', level, topics:['Pronunciación guiada'], results, startedAt });
    container.innerHTML = renderSessionSummary({
      title:'¡Listo!', score:`Practicaste ${total} frases en voz alta`,
      topics: ['Pronunciación guiada']
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
function pickMixItems(level){
  function sample(arr, n){
    const copy = arr.slice();
    for(let i=copy.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
    return copy.slice(0, Math.min(n, copy.length));
  }

  const gVariantIdx = pickVariantIndex('gramatica', level, GRAMMAR_BANK[level].length);
  const gTopics = GRAMMAR_BANK[level][gVariantIdx];
  const gPool = [];
  gTopics.forEach(t=> t.items.forEach(it=> gPool.push(it)));
  const grammarPicks = sample(gPool, 2).map(item=>({ kind:'grammar', item }));

  const vVariantIdx = pickVariantIndex('vocabulario', level, VOCAB_BANK[level].length);
  const vPool = VOCAB_BANK[level][vVariantIdx];
  const vocabPicks = sample(vPool, 2).map(item=>({ kind:'vocab', item }));

  const lVariantIdx = pickVariantIndex('listening', level, LISTENING_BANK[level].length);
  const lPool = LISTENING_BANK[level][lVariantIdx];
  const listeningPicks = sample(lPool, 1).map(item=>({ kind:'listening', item }));

  const sVariantIdx = pickVariantIndex('speaking', level, SPEAKING_BANK[level].length);
  const sPool = SPEAKING_BANK[level][sVariantIdx];
  const speakingPicks = sample(sPool, 1).map(item=>({ kind:'speaking', item }));

  const wVariantIdx = pickVariantIndex('writing', level, WRITING_BANK[level].length);
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
      const clean = (input.value || '').trim().toLowerCase();
      let isOk = false;
      if(clean.length >= 3){
        try{ isOk = new RegExp(item.checkPattern, 'i').test(clean); }catch(e){ isOk = false; }
      }
      fb.classList.add('show');
      fb.classList.toggle('ok', isOk);
      fb.classList.toggle('bad', !isOk);
      fb.innerHTML = `
        <div class="fb-head">${isOk ? OK_ICON : BAD_ICON}<span>${isOk ? 'Bien encaminado ✓' : 'Revisa esto'}</span></div>
        <p class="fb-explain">${isOk ? 'Tu frase incluye la estructura que buscábamos.' : item.hint}</p>
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
      let stream = null, recorder = null, chunks = [];
      const recordBtn = card.querySelector('#recordBtn');
      const compareRow = card.querySelector('#compareRow');
      const recIndicator = card.querySelector('#recIndicator');
      recordBtn.addEventListener('click', async ()=>{
        if(recorder && recorder.state === 'recording'){ recorder.stop(); return; }
        compareRow.innerHTML = '';
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
        };
        recorder.start();
        recordBtn.textContent = 'Detener grabación';
        if(recIndicator) recIndicator.hidden = false;
      });
    }
    // Speaking no se califica: se avisa que quedó lista para continuar.
    onAnswered(null);
    return;
  }
}

function runMixSessionCore({ container, level, onExit, onOtherSkill, isFree }){
  const pool = pickMixItems(level);
  const total = pool.length;
  const startedAt = Date.now();
  const results = [];
  let idx = 0;

  function renderItem(){
    const entry = pool[idx];
    const wrap = document.createElement('div');
    wrap.innerHTML = sessionHeaderHtml('Mixto · ' + MIX_KIND_LABEL[entry.kind], level, idx+1, total);
    const card = document.createElement('div');
    card.className = 'session-card';
    wrap.appendChild(card);
    container.innerHTML = '';
    container.appendChild(wrap);
    renderMixItemInto(card, entry, (isCorrect)=>{
      results.push({ itemId: entry.item.id, isCorrect });
      showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      });
    });
  }

  function finish(){
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

/* ---------- Resumen de sesión (compartido) ---------- */
function renderSessionSummary({ title, score, topics }){
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
  const total = bankSizeForLevel(last.skill, last.level);
  const attempted = Math.min(attemptedItemIdsFor(p, last.skill).size, total);
  container.innerHTML = `
    <div class="continue-card">
      <div>
        <div class="continue-eyebrow">Continúa donde te quedaste</div>
        <div class="continue-title">${SKILL_LABELS[last.skill]} · ${LEVEL_META[last.level].label} ${LEVEL_META[last.level].range}</div>
        <div class="continue-sub">${attempted} de ${total} ejercicios practicados</div>
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
function computeWeeklyBarData(){
  const p = loadProgress();
  const now = new Date();
  const jsDay = now.getDay(); // 0=domingo..6=sabado
  const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(now);
  monday.setHours(0,0,0,0);
  monday.setDate(monday.getDate() - mondayOffset);

  const labels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const todayStr = now.toISOString().slice(0,10);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(monday);
    d.setDate(monday.getDate()+i);
    const dateStr = d.toISOString().slice(0,10);
    days.push({ label: labels[i], date: dateStr, isToday: dateStr === todayStr, count: 0 });
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
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const center = size / 2;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="var(--paper-dim)" stroke-width="${strokeWidth}"/>
      <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${center} ${center})"/>
      <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" class="ring-pct" font-size="${size*0.29}">${pct}%</text>
    </svg>`;
}

function renderStatCards(container){
  if(!container) return;
  const streak = computeStreak();
  const level = getUserLevel();
  const totals = computeTotalStats();
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--green-tint);color:var(--green);">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l2.6 6.2L21 9l-5 4.4L17.4 20 12 16.6 6.6 20 8 13.4 3 9l6.4-.8L12 2z" fill="currentColor"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Miembro activo</div>
        <div class="stat-card-value">¡Gracias por ser parte!</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--coral-tint);color:var(--coral);">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1.5-1-2-1-2s2 1 2 4a5 5 0 01-10 0c0-5 4-6 4-9 0-1-.5-2-.5-2s2 0 2.5 0z" fill="currentColor"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Racha</div>
        <div class="stat-card-value">${streak} ${streak === 1 ? 'día' : 'días'}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--blue-tint);color:var(--blue);">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Nivel actual</div>
        <div class="stat-card-value">${LEVEL_META[level].label} ${LEVEL_META[level].range}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon" style="background:var(--violet-tint);color:var(--violet);">
        <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l3 3 8-8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>
      </div>
      <div>
        <div class="stat-card-label">Ejercicios completados</div>
        <div class="stat-card-value">${totals.attempted} <span style="color:var(--ink-faint);font-weight:600;font-size:0.8rem;">de ${totals.total}</span></div>
      </div>
    </div>`;
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
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
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
  const streak = computeStreak();
  const days = computeWeeklyBarData();
  const practicedCount = days.filter(d=>d.count>0).length;
  container.innerHTML = `
    <div class="streak-flame">
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1.5-1-2-1-2s2 1 2 4a5 5 0 01-10 0c0-5 4-6 4-9 0-1-.5-2-.5-2s2 0 2.5 0z" fill="currentColor"/></svg>
    </div>
    <div class="streak-number">${streak} ${streak === 1 ? 'día' : 'días'}</div>
    <div class="streak-caption">de racha seguida</div>
    <div class="streak-dots">
      ${days.map(d=>`
        <div class="streak-dot">
          <div class="streak-dot-mark ${d.count>0 ? 'done' : ''} ${d.isToday ? 'today-mark' : ''}"></div>
          <span class="streak-dot-label">${d.label.slice(0,1)}</span>
        </div>`).join('')}
    </div>
    <div class="streak-caption" style="margin-top:14px;">${practicedCount} de 7 días esta semana</div>
    <div class="streak-goal">${streakGoalMessage(streak, practicedCount)}</div>`;
}

/* Meta semanal simple (5 días): mensaje corto segun racha y dias practicados
   esta semana, con los mismos datos que ya calculamos arriba. */
function streakGoalMessage(streak, practicedCount){
  const WEEKLY_GOAL = 5;
  if(practicedCount >= WEEKLY_GOAL) return '¡Meta semanal cumplida!';
  if(streak === 0) return 'Empieza hoy y arranca tu racha.';
  const left = WEEKLY_GOAL - practicedCount;
  return `Te ${left === 1 ? 'falta' : 'faltan'} ${left} ${left === 1 ? 'día' : 'días'} para tu meta semanal.`;
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
        <div class="stat-card-label">Precisión (7 días)</div>
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
        <button type="button" class="stat-card-link" id="statChangeLevelBtn">Cambiar nivel →</button>
      </div>
    </div>`;
  const changeLevelBtn = document.getElementById('statChangeLevelBtn');
  if(changeLevelBtn){
    changeLevelBtn.addEventListener('click', ()=>{
      openLevelSwitcher(()=> location.reload());
    });
  }
}

function renderSkillsPanel(container, p){
  if(!container) return;
  container.innerHTML = Object.keys(SKILL_LABELS).map(skill=>{
    const pct = computeSkillCoverage(p, skill);
    const attempted = attemptedItemIdsFor(p, skill).size;
    const color = SKILL_COLORS[skill];
    const fb = skillFeedback(pct, attempted);
    return `
      <a href="${SKILL_PAGE[skill]}" class="skill-row-link">
        <span class="skill-row-label">${SKILL_LABELS[skill]}</span>
        <span class="skill-row-track"><span class="skill-row-fill" style="width:${pct}%;background:${color};"></span></span>
        <span class="skill-row-pct">${pct}%</span>
        <span class="skill-row-chip chip-${fb.tone}">${fb.text}</span>
        <svg class="skill-row-chevron" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>`;
  }).join('');
}

/* Consejo específico según los datos reales del usuario, no un genérico
   repetido siempre igual. */
function pickProgressTip(p, streak){
  const skills = Object.keys(SKILL_LABELS);
  const started = skills.filter(sk => attemptedItemIdsFor(p, sk).size > 0);
  const untried = skills.filter(sk => attemptedItemIdsFor(p, sk).size === 0);

  if(streak === 0){
    return { skill: null, text: 'Una sesión corta hoy vale más que una larga dentro de unos días: las sesiones cortas y seguidas ayudan más a fijar lo que aprendes.' };
  }
  if(untried.length && started.length){
    const next = untried[0];
    return { skill: next, text: `Todavía no has probado ${SKILL_LABELS[next]}. Practicar varias habilidades te da una base más completa que enfocarte solo en una.` };
  }
  if(started.length){
    let lowest = null;
    started.forEach(sk=>{
      const cov = computeSkillCoverage(p, sk);
      if(!lowest || cov < lowest.cov) lowest = { sk, cov };
    });
    if(lowest && lowest.cov < 100){
      return { skill: lowest.sk, text: `${SKILL_LABELS[lowest.sk]} es donde tienes más margen ahora mismo. Unos minutos hoy suman más de lo que parece.` };
    }
  }
  if(streak >= 3){
    return { skill: null, text: `Llevas ${streak} días seguidos. Volver a repasar algo que ya practicaste, después de un par de días, es lo que más ayuda a que se quede en la memoria.` };
  }
  return { skill: null, text: 'Repasar el material después de un par de días ayuda a que se quede en la memoria a largo plazo.' };
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
      <h2 style="font-size:1.5rem;">Tus habilidades</h2>
      <p>Cobertura del contenido disponible en cada habilidad.</p>
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
        <p class="summary-unlock-label">¿Quieres seguir?</p>
        <div class="summary-unlock-grid">
          <span>🔒 Más ejercicios</span>
          <span>🔒 Listening</span>
          <span>🔒 Speaking</span>
          <span>🔒 Tu progreso</span>
          <span>🔒 Todos los niveles</span>
        </div>
        <a href="miembros.html" class="btn btn-primary btn-block">Desbloquear por $2/mes</a>
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
  const variantIdx = pickVariantIndex('gramatica', level, GRAMMAR_BANK[level].length);
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
      showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      });
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
  const variantIdx = pickVariantIndex('vocabulario', level, VOCAB_BANK[level].length);
  const pool = VOCAB_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
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
        showNextButton(card, idx+1 < total ? 'Siguiente palabra →' : 'Ver resultado →', ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        });
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
  const variantIdx = pickVariantIndex('listening', level, LISTENING_BANK[level].length);
  const pool = LISTENING_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
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
        showNextButton(card, idx+1 < total ? 'Siguiente audio →' : 'Ver resultado →', ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        });
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
  const clean = (text || '').trim().toLowerCase();
  if(clean.length < 3) return false;
  try{
    const re = new RegExp(item.checkPattern, 'i');
    return re.test(clean);
  }catch(e){
    return false;
  }
}
function runFreeWritingSession({ container, level, onOtherSkill }){
  const variantIdx = pickVariantIndex('writing', level, WRITING_BANK[level].length);
  const pool = WRITING_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
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
      const isOk = checkWritingAnswer(text, item);
      fb.classList.add('show');
      fb.classList.toggle('ok', isOk);
      fb.classList.toggle('bad', !isOk);
      if(isOk){
        fb.innerHTML = `
          <div class="fb-head">${OK_ICON}<span>Bien encaminado ✓</span></div>
          <p class="fb-explain">Tu frase incluye la estructura que buscábamos.</p>
          <div class="examples-block">
            <div class="examples-label">Ejemplo</div>
            <div class="example-pair"><div class="example-en">${item.example.en}</div><div class="example-es">${item.example.es}</div></div>
          </div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
      } else {
        fb.innerHTML = `
          <div class="fb-head">${BAD_ICON}<span>Revisa esto</span></div>
          <p class="fb-explain">${item.hint}</p>
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
  const variantIdx = pickVariantIndex('speaking', level, SPEAKING_BANK[level].length);
  const pool = SPEAKING_BANK[level][variantIdx];
  const total = pool.length;
  const results = [];
  let idx = 0;

  function renderItem(){
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
      let stream = null, recorder = null, chunks = [];
      const recordBtn = card.querySelector('#recordBtn');
      const compareRow = card.querySelector('#compareRow');
      const retryBtn = card.querySelector('#retryBtn');
      const recIndicator = card.querySelector('#recIndicator');

      recordBtn.addEventListener('click', async ()=>{
        if(recorder && recorder.state === 'recording'){
          recorder.stop();
          return;
        }
        compareRow.innerHTML = '';
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
        };
        recorder.start();
        recordBtn.textContent = 'Detener grabación';
        if(recIndicator) recIndicator.hidden = false;
      });
      retryBtn.addEventListener('click', ()=>{
        compareRow.innerHTML = '';
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
    run({ container: bodyEl, level: currentLevel, onOtherSkill: focusTabs });
  }

  renderLevelSelector(levelsEl, currentLevel, (lvl)=>{ currentLevel = lvl; renderCurrent(); });
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
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
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
