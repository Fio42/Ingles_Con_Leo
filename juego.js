/* ============================================================
   Inglés con Leo — juego.js (English Rush)
   Motor del juego de la sección gratuita "juego.html". Vanilla JS,
   sin dependencias. Reutiliza de app.js: shuffleOptions(), playAudioFile()/
   stopActiveAudioFile(), PLAY_ICON, personalizeNav(). Reutiliza de
   backend.js: LeoBackend (para saber si quien juega ya es miembro,
   igual que practica.html).

   Todas las preguntas viven en juego-data.js (RUSH_QUESTIONS,
   RUSH_LEVELS). Este archivo NO conoce el contenido de las preguntas:
   las agrupa por "level" y muestra lo que corresponda.

   Cómo ampliar / ajustar (ver también el mensaje del chat):
   - Agregar preguntas: juego-data.js, arreglo RUSH_QUESTIONS.
   - Cambiar cuánto dura cada nivel: RUSH_CORRECT_TO_LEVEL_UP abajo.
   - Cambiar puntos: scoreForCorrectAnswer() abajo.
   - Cambiar vidas: RUSH_LIVES_START abajo.
   - Cambiar el límite gratis: RUSH_CONFIG abajo.
   ============================================================ */

/* ---------- Configuración centralizada (free vs miembro) ---------- */
const RUSH_CONFIG = {
  FREE_RUNS_PER_DAY: 1,      // partidas completas gratis por día (null = sin límite)
  FREE_MAX_LEVEL: null,      // nivel máximo para gratis dentro de una partida (null = sin tope)
  FREE_MAX_QUESTIONS: null,  // preguntas máximas por partida para gratis (null = sin tope)
  MEMBER_UNLIMITED: true     // los miembros ignoran los límites de arriba
};

const RUSH_LIVES_START = 3;
const RUSH_CORRECT_TO_LEVEL_UP = 5;
const RUSH_MAX_CONFIGURED_LEVEL = 10;

function rushTimeForLevel(level){
  const table = { 1:16000, 2:14000, 3:13000, 4:12000, 5:11000, 6:10000, 7:9000, 8:8000, 9:7000, 10:6500 };
  if(level <= RUSH_MAX_CONFIGURED_LEVEL) return table[level] || 10000;
  const extra = level - RUSH_MAX_CONFIGURED_LEVEL;
  return Math.max(4000, 6500 - extra * 300);
}
function rushPoolForLevel(level){
  const effective = Math.min(level, RUSH_MAX_CONFIGURED_LEVEL);
  return RUSH_QUESTIONS.filter(q => q.level === effective);
}

/* ---------- Récord y contador de partidas gratis (localStorage) ---------- */
function rushTodayStr(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function rushLoadRecord(){
  try{
    const raw = localStorage.getItem('leo_rush_record');
    return raw ? JSON.parse(raw) : { score:0, level:0, combo:0 };
  }catch(e){ return { score:0, level:0, combo:0 }; }
}
function rushSaveRecord(rec){
  try{ localStorage.setItem('leo_rush_record', JSON.stringify(rec)); }catch(e){}
}
function rushLoadRunsToday(){
  try{
    const raw = localStorage.getItem('leo_rush_runs');
    if(!raw) return 0;
    const data = JSON.parse(raw);
    if(data.date !== rushTodayStr()) return 0;
    return data.count || 0;
  }catch(e){ return 0; }
}
function rushIncrementRunsToday(){
  try{
    const count = rushLoadRunsToday() + 1;
    localStorage.setItem('leo_rush_runs', JSON.stringify({ date: rushTodayStr(), count }));
  }catch(e){}
}
function rushTrack(eventName, params){
  try{ if(typeof gtag === 'function') gtag('event', eventName, params || {}); }catch(e){}
}

/* ============================================================
   MOTOR DEL JUEGO — todo vive dentro de este closure para que
   render* pueda llamarse entre sí sin problemas de orden (las
   funciones declaradas con "function" dentro del mismo scope se
   "hoistean", así que el orden en que aparecen abajo no importa).
   ============================================================ */
function initRushGame(container){
  let isMember = false;
  let s = null;            // estado de la partida activa (null = sin partida)
  let timerHandle = null;
  let timerRafHandle = null;

  function clearTimers(){
    if(timerHandle){ clearTimeout(timerHandle); timerHandle = null; }
    if(timerRafHandle){ cancelAnimationFrame(timerRafHandle); timerRafHandle = null; }
  }

  function freeRunsLeftToday(){
    if(isMember && RUSH_CONFIG.MEMBER_UNLIMITED) return Infinity;
    if(RUSH_CONFIG.FREE_RUNS_PER_DAY == null) return Infinity;
    return Math.max(0, RUSH_CONFIG.FREE_RUNS_PER_DAY - rushLoadRunsToday());
  }

  function pickNextQuestion(){
    const pool = rushPoolForLevel(s.level);
    if(!pool.length) return null;
    const unused = pool.filter(q => !s.usedIds.has(q.id));
    const source = unused.length ? unused : pool;
    const q = source[Math.floor(Math.random() * source.length)];
    s.usedIds.add(q.id);
    return q;
  }

  function scoreForCorrectAnswer(){
    const base = 100;
    const levelBonus = (s.level - 1) * 20;
    const comboBonus = Math.min(s.combo, 10) * 10;
    return base + levelBonus + comboBonus;
  }

  /* ---------- Pantalla: inicio ---------- */
  function renderStart(){
    clearTimers();
    stopActiveAudioFile();
    const record = rushLoadRecord();
    const runsLeft = freeRunsLeftToday();
    const canPlay = runsLeft > 0;

    const recordHtml = record.score > 0
      ? `<div class="rush-record-chip">Tu récord: <strong>${record.score.toLocaleString('es-MX')} pts</strong> · Nivel ${record.level}</div>`
      : '';

    if(!canPlay){
      container.innerHTML = `
        <div class="rush-card rush-limit-card">
          <h2>¿Quieres seguir viendo hasta dónde puedes llegar?</h2>
          <p class="rush-limit-sub">Ya jugaste tu partida gratis de hoy. Como miembro tienes:</p>
          <ul class="rush-limit-list">
            <li>Partidas ilimitadas</li>
            <li>Niveles avanzados</li>
            <li>Práctica basada en tus errores</li>
            <li>Estadísticas completas</li>
          </ul>
          <div class="rush-limit-actions">
            <a href="miembros.html" class="btn btn-primary">Continuar como miembro <span aria-hidden="true">→</span></a>
            <button type="button" class="btn btn-ghost" id="rushComeBack">Volver mañana</button>
          </div>
          <p class="practice-members-price">$2 USD al mes · Cancela cuando quieras</p>
        </div>`;
      const backBtn = container.querySelector('#rushComeBack');
      if(backBtn) backBtn.addEventListener('click', ()=>{ window.location.href = 'index.html'; });
      rushTrack('free_limit_reached', {});
      return;
    }

    container.innerHTML = `
      <div class="rush-card rush-start-card">
        <h1 class="rush-title">English Rush</h1>
        <p class="rush-tagline">Preguntas rápidas de inglés. Empieza fácil, cada nivel se pone más interesante. ¿Hasta dónde puedes llegar?</p>
        ${recordHtml}
        <button type="button" class="btn btn-primary rush-start-btn" id="rushStartBtn">Jugar <span aria-hidden="true">→</span></button>
        <p class="rush-controls-hint">En computadora puedes responder con 1, 2 o 3.</p>
      </div>`;
    container.querySelector('#rushStartBtn').addEventListener('click', startGame);
  }

  function startGame(){
    stopActiveAudioFile();
    s = {
      level: 1,
      score: 0,
      combo: 0,
      bestCombo: 0,
      lives: RUSH_LIVES_START,
      correctInLevel: 0,
      correctTotal: 0,
      answeredTotal: 0,
      usedIds: new Set(),
      current: null,
      answered: false
    };
    rushTrack('game_start', {});
    nextQuestion();
  }

  function nextQuestion(){
    if(!s) return;
    const q = pickNextQuestion();
    if(!q){ endGame(); return; }
    s.current = q;
    s.answered = false;
    renderQuestion();
  }

  /* ---------- Pantalla: pregunta activa ---------- */
  function livesHtml(){
    let out = '';
    for(let i=0;i<RUSH_LIVES_START;i++){
      out += i < s.lives ? '<span class="rush-life rush-life-full">♥</span>' : '<span class="rush-life rush-life-empty">♥</span>';
    }
    return out;
  }

  function renderQuestion(){
    clearTimers();
    const q = s.current;
    const needed = RUSH_CORRECT_TO_LEVEL_UP;
    const progressPct = Math.round((s.correctInLevel / needed) * 100);
    const isListening = q.type === 'listen-repeat' || q.type === 'listen-answer';

    container.innerHTML = `
      <div class="rush-card rush-play-card">
        <div class="rush-hud">
          <div class="rush-hud-left">
            <span class="rush-level-tag">Nivel ${s.level}</span>
            <span class="rush-points">${s.score.toLocaleString('es-MX')} pts</span>
            ${s.combo > 1 ? `<span class="rush-combo">Combo x${s.combo}</span>` : ''}
          </div>
          <div class="rush-hud-right">${livesHtml()}</div>
        </div>
        <div class="rush-level-progress"><div class="rush-level-progress-fill" style="width:${progressPct}%;"></div></div>
        <div class="rush-timer-track"><div class="rush-timer-fill" id="rushTimerFill"></div></div>

        ${isListening ? `<button type="button" class="btn btn-primary btn-sm rush-play-btn" id="rushPlayBtn">${PLAY_ICON} Reproducir</button>` : ''}
        <div class="rush-prompt">${q.prompt}</div>
        <div class="option-list rush-option-list" id="rushOptList"></div>
      </div>`;

    const list = container.querySelector('#rushOptList');
    const { options: opts, correct: correctIdx } = shuffleOptions(q.options, q.correct);
    const letters = ['1','2','3','4'];
    opts.forEach((opt, i)=>{
      const b = document.createElement('button');
      b.className = 'option rush-option';
      b.innerHTML = `<span class="dot rush-option-key">${letters[i] || (i+1)}</span><span>${opt}</span>`;
      b.addEventListener('click', ()=> handleAnswer(i, correctIdx, b, list));
      list.appendChild(b);
    });

    if(isListening){
      const playBtn = container.querySelector('#rushPlayBtn');
      const audioTarget = container.querySelector('.rush-play-card') || container;
      const doPlay = ()=> playAudioFile(q.audio, audioTarget, playBtn);
      if(playBtn) playBtn.addEventListener('click', doPlay);
      // Autoplay: ya hubo un gesto del usuario (clic en "Jugar" o en una
      // opción anterior), así que el navegador normalmente lo permite.
      // Si lo bloquea, el botón "Reproducir" sigue disponible.
      setTimeout(()=>{ try{ doPlay(); }catch(e){} }, 250);
    }

    startTimer(rushTimeForLevel(s.level), () => handleTimeout(list));
  }

  function startTimer(duration, onExpire){
    const fill = container.querySelector('#rushTimerFill');
    const start = performance.now();
    function tick(now){
      const elapsed = now - start;
      const pct = Math.max(0, 1 - elapsed / duration);
      if(fill) fill.style.width = (pct * 100) + '%';
      if(elapsed < duration && s && !s.answered){
        timerRafHandle = requestAnimationFrame(tick);
      }
    }
    timerRafHandle = requestAnimationFrame(tick);
    timerHandle = setTimeout(()=>{ if(s && !s.answered) onExpire(); }, duration);
  }

  function handleTimeout(list){
    if(!s || s.answered) return;
    s.answered = true;
    clearTimers();
    if(list){
      [...list.children].forEach(el=> el.disabled = true);
    }
    registerWrong();
  }

  function handleAnswer(chosenIdx, correctIdx, btn, list){
    if(!s || s.answered) return; // evita doble click / doble tap
    s.answered = true;
    clearTimers();
    [...list.children].forEach((el,j)=>{
      el.disabled = true;
      if(j === correctIdx) el.classList.add('correct');
      if(j === chosenIdx && chosenIdx !== correctIdx) el.classList.add('incorrect');
    });
    if(chosenIdx === correctIdx){
      registerCorrect();
    } else {
      registerWrong();
    }
  }

  function registerCorrect(){
    s.combo += 1;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    s.score += scoreForCorrectAnswer();
    s.correctInLevel += 1;
    s.correctTotal += 1;
    s.answeredTotal += 1;
    const leveledUp = s.correctInLevel >= RUSH_CORRECT_TO_LEVEL_UP;
    if(leveledUp){
      s.level += 1;
      s.correctInLevel = 0;
      rushTrack('level_reached', { level: s.level });
    }
    setTimeout(()=>{
      if(!s) return;
      if(leveledUp) renderLevelUpToast(); else nextQuestion();
    }, 650);
  }

  function registerWrong(){
    s.combo = 0;
    s.lives -= 1;
    s.answeredTotal += 1;
    if(s.lives <= 0){
      setTimeout(()=> endGame(), 700);
    } else {
      setTimeout(()=> nextQuestion(), 900);
    }
  }

  function renderLevelUpToast(){
    const card = container.querySelector('.rush-play-card') || container.querySelector('.rush-card');
    const toast = document.createElement('div');
    toast.className = 'rush-levelup-toast';
    toast.innerHTML = `<span>NIVEL ${s.level}</span>`;
    container.appendChild(toast);
    setTimeout(()=>{ toast.remove(); nextQuestion(); }, 750);
  }

  /* ---------- Pantalla: fin de partida ---------- */
  function endGame(){
    clearTimers();
    stopActiveAudioFile();
    const record = rushLoadRecord();
    const isNewRecord = s.score > (record.score || 0);
    if(isNewRecord) rushSaveRecord({ score: s.score, level: s.level, combo: s.bestCombo });
    if(!isMember) rushIncrementRunsToday();
    rushTrack('game_over', { score: s.score, level: s.level });
    renderGameOver(isNewRecord);
  }

  function renderGameOver(isNewRecord){
    const accuracy = s.answeredTotal ? Math.round((s.correctTotal / s.answeredTotal) * 100) : 0;
    const runsLeft = freeRunsLeftToday();
    const canPlayAgain = runsLeft > 0;

    container.innerHTML = `
      <div class="rush-card rush-over-card">
        ${isNewRecord ? '<div class="rush-newrecord">¡NUEVO RÉCORD!</div>' : ''}
        <h2>Partida terminada</h2>
        <div class="rush-over-score">${s.score.toLocaleString('es-MX')} <span>pts</span></div>
        <div class="rush-over-stats">
          <div><strong>${s.level}</strong><span>Nivel alcanzado</span></div>
          <div><strong>${accuracy}%</strong><span>Precisión</span></div>
          <div><strong>x${s.bestCombo}</strong><span>Mejor combo</span></div>
          <div><strong>${s.correctTotal}</strong><span>Correctas</span></div>
        </div>
        ${canPlayAgain ? `
          <button type="button" class="btn btn-primary rush-start-btn" id="rushAgainBtn">Jugar otra vez</button>
        ` : `
          <p class="rush-limit-sub">¿Quieres seguir viendo hasta dónde puedes llegar?</p>
          <div class="rush-limit-actions">
            <a href="miembros.html" class="btn btn-primary">Continuar como miembro <span aria-hidden="true">→</span></a>
            <button type="button" class="btn btn-ghost" id="rushComeBack">Volver mañana</button>
          </div>
          <p class="practice-members-price">$2 USD al mes · Cancela cuando quieras</p>
        `}
      </div>`;

    const againBtn = container.querySelector('#rushAgainBtn');
    if(againBtn) againBtn.addEventListener('click', ()=>{ rushTrack('membership_cta_clicked', { from:'play_again' }); startGame(); });
    const backBtn = container.querySelector('#rushComeBack');
    if(backBtn) backBtn.addEventListener('click', ()=>{ window.location.href = 'index.html'; });
    const memberLink = container.querySelector('.rush-over-card a.btn-primary');
    if(memberLink) memberLink.addEventListener('click', ()=> rushTrack('membership_cta_clicked', { from:'game_over' }));
  }

  /* ---------- Teclado: 1/2/3(/4) y A/B/C(/D) ---------- */
  function onKeydown(e){
    if(!s || s.answered) return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if(tag === 'INPUT' || tag === 'TEXTAREA') return;
    const list = container.querySelector('#rushOptList');
    if(!list) return;
    const key = e.key.toUpperCase();
    const map = { '1':0, '2':1, '3':2, '4':3, 'A':0, 'B':1, 'C':2, 'D':3 };
    if(!(key in map)) return;
    const idx = map[key];
    const btn = list.children[idx];
    if(btn && !btn.disabled) btn.click();
  }
  document.addEventListener('keydown', onKeydown);

  /* ---------- API pública ---------- */
  return {
    setMember(v){ isMember = !!v; },
    renderStart
  };
}
