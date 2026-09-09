/* ============================================================
   CLASES INTERACTIVAS — motor de mini-clases situacionales
   Reutiliza playAudioFile, MIC_ICON/PLAY_ICON/OK_ICON/BAD_ICON,
   sessionHeaderHtml, showNextButton, recordSession() de app.js.
   ============================================================ */

/* Lee una frase en voz alta usando la sintesis de voz del navegador
   (no necesita ningun mp3 grabado, funciona al instante). Si el
   navegador no soporta esto, el boton simplemente no hace nada. */
function speakPhrase(text){
  if(!('speechSynthesis' in window)) return;
  try{
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  }catch(e){}
}

/* showRetryOrNextButtons() ahora vive en app.js (se comparte con
   Gramática/Vocabulario/Listening/Mixto) — app.js siempre se carga
   antes que este archivo en clases.html. */

function saveClaseProgress(state){
  try{
    localStorage.setItem('leo_clase_inflight', JSON.stringify({
      classId: state.data.id,
      stepIndex: state.stepIndex,
      results: state.results,
      challengePath: state.challengePath,
      startedAt: state.startedAt
    }));
  }catch(e){}
}
function loadClaseProgress(classId){
  try{
    const raw = localStorage.getItem('leo_clase_inflight');
    if(!raw) return null;
    const saved = JSON.parse(raw);
    return (saved && saved.classId === classId) ? saved : null;
  }catch(e){ return null; }
}
function clearClaseProgress(){
  try{ localStorage.removeItem('leo_clase_inflight'); }catch(e){}
}

function renderClassList(container){
  if(!container) return;
  const byCategory = {};
  CLASS_CATALOG.forEach(c=>{
    if(!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  });
  container.innerHTML = Object.keys(byCategory).map(cat=>`
    <div class="clases-category">
      <h3 class="clases-category-title">${cat}</h3>
      <div class="clases-grid">
        ${byCategory[cat].map(c=>`
          <div class="clase-card ${c.available ? '' : 'soon'}" data-id="${c.id}">
            <div class="clase-card-top">
              <span class="clase-card-title">${c.title}</span>
              ${c.available ? '' : '<span class="clase-soon-tag">Próximamente</span>'}
            </div>
            <p class="clase-card-desc">${c.available ? c.desc : 'Estamos preparando esta clase.'}</p>
            ${c.available ? `<div class="clase-card-meta">${c.minutes} min · 8 pasos</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`).join('');

  container.querySelectorAll('.clase-card:not(.soon)').forEach(card=>{
    card.addEventListener('click', ()=> startClass(card.dataset.id, container));
  });
}

function startClass(classId, rootContainer){
  const data = CLASSES_BANK[classId];
  if(!data) return;
  const saved = loadClaseProgress(classId);
  const state = saved ? {
    data,
    startedAt: saved.startedAt,
    results: saved.results || [],
    stepIndex: saved.stepIndex || 0,
    challengePath: saved.challengePath || []
  } : {
    data,
    startedAt: Date.now(),
    results: [],
    stepIndex: 0,
    challengePath: []
  };
  const steps = [
    renderStepSituation,
    renderStepPhrases,
    renderStepListening,
    renderStepChoose,
    renderStepBuild,
    renderStepSpeak,
    renderStepChallenge,
    renderStepSummary
  ];
  const STEP_LABELS = ['Situación','Frases clave','Escucha','Elige','Construye','Habla','Reto final','Resumen'];

  function goTo(i){
    state.stepIndex = i;
    saveClaseProgress(state);
    rootContainer.innerHTML = `
      <div class="clase-shell">
        <div class="clase-stepper">
          <button class="clase-back-btn" id="claseBackBtn">← Clases</button>
          <div class="clase-stepper-track">
            ${STEP_LABELS.map((label,idx)=>`
              <span class="clase-step-dot ${idx < i ? 'done' : ''} ${idx === i ? 'active' : ''}"></span>
            `).join('')}
          </div>
          <span class="clase-step-label">${STEP_LABELS[i]}</span>
        </div>
        <div class="clase-body" id="claseBody"></div>
      </div>`;
    rootContainer.querySelector('#claseBackBtn').addEventListener('click', ()=> renderClassList(rootContainer));
    const body = rootContainer.querySelector('#claseBody');
    steps[i](body, state, ()=> goTo(i+1));
  }
  goTo(state.stepIndex);
}

function renderStepSituation(body, state, next){
  const { situation, title } = state.data;
  body.innerHTML = `
    <div class="clase-situation-card">
      <div class="clase-eyebrow">Situación</div>
      <h2>${title}</h2>
      <p class="clase-situation-en">${situation.en}</p>
      <p class="clase-situation-es">${situation.es}</p>
      <button class="btn btn-primary" id="claseNext">Empezar →</button>
    </div>`;
  body.querySelector('#claseNext').addEventListener('click', next);
}

function renderStepPhrases(body, state, next){
  const { phrases } = state.data;
  body.innerHTML = `
    <div class="clase-eyebrow">Frases clave</div>
    <p class="clase-step-intro">Escucha y repite estas frases — las vas a necesitar en la clase.</p>
    <div class="clase-phrase-list">
      ${phrases.map((p,idx)=>`
        <div class="clase-phrase-row">
          <div>
            <div class="clase-phrase-en">${p.en}</div>
            <div class="clase-phrase-es">${p.es}</div>
          </div>
          <button type="button" class="clase-phrase-listen-btn" data-idx="${idx}" aria-label="Escuchar esta frase">${PLAY_ICON}</button>
        </div>`).join('')}
    </div>
    <div class="next-row"><button class="btn btn-primary btn-sm" id="claseNext">Continuar →</button></div>`;
  body.querySelectorAll('.clase-phrase-listen-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = parseInt(btn.dataset.idx, 10);
      speakPhrase(phrases[idx].en);
    });
  });
  body.querySelector('#claseNext').addEventListener('click', next);
}

function renderStepListening(body, state, next){
  const { listening } = state.data;
  let answered = false;
  body.innerHTML = `
    <div class="clase-eyebrow">Escucha</div>
    <p class="clase-step-intro">Escucha el diálogo con atención — todavía no puedes leerlo.</p>
    <div class="clase-audio-row">
      <button class="btn btn-primary btn-sm" id="claseHear">${PLAY_ICON} Escuchar diálogo</button>
    </div>
    <div class="clase-question-card">
      <p class="clase-question-text">${listening.question.text}</p>
      <div class="clase-options" id="claseOptions">
        ${listening.question.options.map((opt,idx)=>`
          <button class="clase-option-btn" data-idx="${idx}">${opt}</button>`).join('')}
      </div>
      <div id="claseFeedback"></div>
    </div>
    <div class="next-row" id="nextRow"></div>`;

  body.querySelector('#claseHear').addEventListener('click', ()=> playAudioFile(listening.audio, body));

  function wireOptions(){
    answered = false;
    body.querySelectorAll('.clase-option-btn').forEach(btn=>{
      btn.classList.remove('correct','incorrect');
      btn.disabled = false;
      btn.addEventListener('click', onOptionClick);
    });
    body.querySelector('#claseFeedback').innerHTML = '';
    const row = body.querySelector('#nextRow');
    if(row) row.innerHTML = '';
  }

  function onOptionClick(){
    if(answered) return;
    answered = true;
    const btn = this;
    const idx = parseInt(btn.dataset.idx,10);
    const correct = idx === listening.question.correctIndex;
    state.results.push({ itemId:'listening', isCorrect:correct });
    btn.classList.add(correct ? 'correct' : 'incorrect');
    body.querySelectorAll('.clase-option-btn').forEach(b=>{ b.disabled = true; });
    if(!correct){
      const rightBtn = body.querySelector(`.clase-option-btn[data-idx="${listening.question.correctIndex}"]`);
      if(rightBtn) rightBtn.classList.add('correct');
    }
    const transcriptHtml = `
      <div class="clase-dialogue" style="margin-top:14px;">
        ${listening.dialogue.map(d=>`
          <div class="clase-dialogue-line">
            <span class="clase-dialogue-speaker">${d.speaker}:</span>
            <span class="clase-dialogue-text">${d.en}</span>
          </div>`).join('')}
      </div>`;
    body.querySelector('#claseFeedback').innerHTML = (correct
      ? `<p class="clase-fb-ok">${OK_ICON} ¡Correcto!</p>`
      : `<p class="clase-fb-bad">${BAD_ICON} Casi — aquí tienes la transcripción.</p>`) + transcriptHtml;
    showRetryOrNextButtons(body, correct, wireOptions, next);
  }

  wireOptions();
}

function renderStepChoose(body, state, next){
  const { chooseResponse } = state.data;
  let answered = false;
  body.innerHTML = `
    <div class="clase-eyebrow">Elige tu respuesta</div>
    <div class="clase-dialogue">
      <div class="clase-dialogue-line">
        <span class="clase-dialogue-speaker">${chooseResponse.prompt.speaker}:</span>
        <span class="clase-dialogue-text">${chooseResponse.prompt.en}</span>
      </div>
    </div>
    <div class="clase-options" id="claseOptions">
      ${chooseResponse.options.map((opt,idx)=>`
        <button class="clase-option-btn" data-idx="${idx}">${opt.en}</button>`).join('')}
    </div>
    <div id="claseFeedback"></div>
    <div class="next-row" id="nextRow"></div>`;

  function wireOptions(){
    answered = false;
    body.querySelectorAll('.clase-option-btn').forEach(btn=>{
      btn.classList.remove('correct','incorrect');
      btn.disabled = false;
      btn.addEventListener('click', onOptionClick);
    });
    body.querySelector('#claseFeedback').innerHTML = '';
    const row = body.querySelector('#nextRow');
    if(row) row.innerHTML = '';
  }

  function onOptionClick(){
    if(answered) return;
    answered = true;
    const btn = this;
    const idx = parseInt(btn.dataset.idx,10);
    const opt = chooseResponse.options[idx];
    state.results.push({ itemId:'chooseResponse', isCorrect:opt.correct });
    btn.classList.add(opt.correct ? 'correct' : 'incorrect');
    body.querySelectorAll('.clase-option-btn').forEach(b=>{ b.disabled = true; });
    body.querySelector('#claseFeedback').innerHTML = `<p class="${opt.correct ? 'clase-fb-ok' : 'clase-fb-bad'}">${opt.correct ? OK_ICON : BAD_ICON} ${opt.feedback}</p>`;
    showRetryOrNextButtons(body, opt.correct, wireOptions, next);
  }

  wireOptions();
}

function renderStepBuild(body, state, next){
  const { buildSentence } = state.data;
  const shuffled = [...buildSentence.words].sort(()=> Math.random()-0.5);
  let chosen = [];

  body.innerHTML = `
    <div class="clase-eyebrow">Construye la frase</div>
    <p class="clase-step-intro">${buildSentence.es}</p>
    <div class="clase-build-target" id="claseBuildTarget"></div>
    <div class="clase-build-bank" id="claseBuildBank"></div>
    <div id="claseFeedback"></div>
    <div class="next-row" id="nextRow">
      <button class="btn btn-ghost btn-sm" id="claseResetBtn">Reiniciar</button>
      <button class="btn btn-primary btn-sm" id="claseCheckBtn">Comprobar</button>
    </div>`;

  function renderChips(){
    body.querySelector('#claseBuildTarget').innerHTML = chosen.length
      ? chosen.map((w,i)=>`<button class="clase-chip chosen" data-i="${i}">${w}</button>`).join('')
      : `<span class="clase-build-placeholder">Toca las palabras en orden...</span>`;
    body.querySelector('#claseBuildBank').innerHTML = shuffled.map((w,i)=>`
      <button class="clase-chip" data-i="${i}" ${chosen.includes(w) ? 'disabled' : ''}>${w}</button>`).join('');

    body.querySelectorAll('#claseBuildBank .clase-chip').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(btn.disabled) return;
        chosen.push(shuffled[parseInt(btn.dataset.i,10)]);
        renderChips();
      });
    });
    body.querySelectorAll('#claseBuildTarget .clase-chip').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        chosen.splice(parseInt(btn.dataset.i,10),1);
        renderChips();
      });
    });
  }
  renderChips();

  body.querySelector('#claseResetBtn').addEventListener('click', ()=>{ chosen = []; renderChips(); });
  body.querySelector('#claseCheckBtn').addEventListener('click', ()=>{
    const correct = chosen.join(' ') === buildSentence.correctOrder.join(' ');
    state.results.push({ itemId:'buildSentence', isCorrect:correct });
    body.querySelector('#claseFeedback').innerHTML = correct
      ? `<p class="clase-fb-ok">${OK_ICON} ¡Perfecto: "${buildSentence.correctOrder.join(' ')}"</p>`
      : `<p class="clase-fb-bad">${BAD_ICON} Casi. La frase correcta es: "${buildSentence.correctOrder.join(' ')}"</p>`;
    showNextButton(body, 'Continuar →', next);
  });
}

function renderStepSpeak(body, state, next){
  const { speaking } = state.data;
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  body.innerHTML = `
    <div class="clase-eyebrow">Habla</div>
    <p class="clase-step-intro">${speaking.es}</p>
    <div class="speak-sentence">${speaking.prompt}</div>
    <div class="speak-actions">
      <button class="btn btn-ghost btn-sm" id="claseHearSpeak">${PLAY_ICON} Escuchar pronunciación</button>
    </div>
    <div class="speak-actions" style="margin-top:14px;">
      ${canRecord
        ? `<button class="btn btn-primary btn-sm" id="claseRecordBtn">${MIC_ICON} Grabar mi voz</button><span class="recording-indicator" id="claseRecIndicator" hidden>● Grabando...</span>`
        : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
    </div>
    <div id="claseCompareRow" class="compare-row"></div>
    <div class="next-row" id="nextRow">
      <button class="btn btn-ghost btn-sm" id="claseRetryBtn" style="display:none;">Intentar otra vez</button>
      <button class="btn btn-primary btn-sm" id="claseSpeakNext">Continuar →</button>
    </div>`;

  body.querySelector('#claseHearSpeak').addEventListener('click', ()=> playAudioFile(speaking.audio, body));
  body.querySelector('#claseSpeakNext').addEventListener('click', ()=>{
    state.results.push({ itemId:'speaking', isCorrect:null });
    next();
  });

  if(canRecord){
    let stream = null, recorder = null, chunks = [];
    const recordBtn = body.querySelector('#claseRecordBtn');
    const compareRow = body.querySelector('#claseCompareRow');
    const retryBtn = body.querySelector('#claseRetryBtn');
    const recIndicator = body.querySelector('#claseRecIndicator');

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
            <button class="btn btn-ghost btn-sm" id="claseOrigBtn">${PLAY_ICON} Escuchar</button>
          </div>
          <div class="compare-col">
            <div class="compare-label">Tu grabación</div>
            <audio controls src="${url}"></audio>
          </div>`;
        compareRow.querySelector('#claseOrigBtn').addEventListener('click', ()=> playAudioFile(speaking.audio, body));
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

function renderStepChallenge(body, state, next){
  const { miniChallenge } = state.data;
  const scoredNodes = new Set();
  let correctCount = 0, attemptCount = 0;

  function renderNode(nodeId){
    const node = miniChallenge.nodes[nodeId];
    const isEnd = !node.options || node.options.length === 0;
    const progressHtml = attemptCount > 0
      ? `<div class="clase-challenge-progress">Reto: ${correctCount} de ${attemptCount} correctas hasta ahora</div>`
      : `<div class="clase-challenge-progress">Objetivo: responde correctamente en cada paso para completar el reto</div>`;
    body.innerHTML = `
      <div class="clase-eyebrow">Mini reto final</div>
      ${progressHtml}
      <div class="clase-dialogue">
        <div class="clase-dialogue-line">
          <span class="clase-dialogue-text">${node.en}</span>
        </div>
      </div>
      <p class="clase-situation-es" style="margin-top:6px;">${node.es}</p>
      ${isEnd ? '' : `<div class="clase-options" id="claseOptions">
        ${node.options.map((opt,idx)=>`<button class="clase-option-btn" data-idx="${idx}">${opt.en}</button>`).join('')}
      </div>`}
      <div id="claseFeedback"></div>
      <div class="next-row" id="nextRow"></div>`;

    if(isEnd){
      const pct = attemptCount > 0 ? Math.round((correctCount/attemptCount)*100) : 100;
      const badge = pct === 100
        ? '🏆 ¡Reto completado a la perfección!'
        : (pct >= 50 ? '👍 ¡Reto completado!' : '💪 ¡Reto completado! Sigue practicando para mejorar tu puntaje.');
      body.querySelector('#claseFeedback').innerHTML = `<p class="clase-fb-ok">${OK_ICON} ${badge}</p>` +
        (attemptCount > 0 ? `<p class="clase-challenge-final-score">Acertaste ${correctCount} de ${attemptCount} decisiones.</p>` : '');
      body.querySelector('#nextRow').innerHTML = '<button class="btn btn-primary btn-sm" id="claseChallengeNext">Ver resumen →</button>';
      body.querySelector('#claseChallengeNext').addEventListener('click', next);
      return;
    }

    let answered = false;
    function wireOptions(){
      answered = false;
      body.querySelectorAll('.clase-option-btn').forEach(btn=>{
        btn.classList.remove('correct','incorrect');
        btn.disabled = false;
        btn.addEventListener('click', onOptionClick);
      });
      body.querySelector('#claseFeedback').innerHTML = '';
      const row = body.querySelector('#nextRow');
      if(row) row.innerHTML = '';
    }

    function onOptionClick(){
      if(answered) return;
      answered = true;
      const btn = this;
      const idx = parseInt(btn.dataset.idx,10);
      const opt = node.options[idx];
      if(!scoredNodes.has(nodeId)){
        scoredNodes.add(nodeId);
        attemptCount++;
        if(opt.correct) correctCount++;
      }
      state.results.push({ itemId:'miniChallenge:'+nodeId, isCorrect:opt.correct });
      state.challengePath.push(nodeId);
      btn.classList.add(opt.correct ? 'correct' : 'incorrect');
      body.querySelectorAll('.clase-option-btn').forEach(b=>{ b.disabled = true; });
      body.querySelector('#claseFeedback').innerHTML = opt.correct
        ? `<p class="clase-fb-ok">${OK_ICON} ¡Bien hecho!</p>`
        : `<p class="clase-fb-bad">${BAD_ICON} Vamos a intentarlo de otra forma.</p>`;
      showRetryOrNextButtons(body, opt.correct, wireOptions, ()=> renderNode(opt.next));
    }

    wireOptions();
  }
  renderNode(miniChallenge.start);
}

function renderStepSummary(body, state){
  const { summary, title } = state.data;
  clearClaseProgress();
  recordSession({ skill:'clases', level:'facil', topics:[title], results: state.results, startedAt: state.startedAt });
  body.innerHTML = `
    <div class="session-summary">
      <h2>¡Hoy aprendiste: ${title}!</h2>
      <p class="summary-score">${summary.tip}</p>
      <div class="summary-topics">
        <div class="examples-label">Frases importantes:</div>
        <ul>${summary.keyPhrases.map(p=>`<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="summary-actions">
        <button class="btn btn-primary" id="claseAgainBtn">Practicar otra vez</button>
        <a href="clases.html" class="btn btn-ghost" id="claseListBtn">Ver todas las clases</a>
      </div>
    </div>`;
  const rootContainer = body.closest('.clase-shell') ? body.closest('.clase-shell').parentElement : body.parentElement;
  body.querySelector('#claseAgainBtn').addEventListener('click', ()=> startClass(state.data.id, rootContainer));
}
