/* ============================================================
   Inglés con Leo — Motor de práctica IELTS
   Reutiliza los helpers generales de app.js (shuffleOptions,
   renderFeedback, showNextButton, showRetryOrNextButtons,
   playAudioFile, iconos, recordSession, renderSessionSummary,
   wireSummaryButtons). El contenido vive en ielts-data.js.
   No hay niveles (A1-C1) aquí: es un solo nivel de práctica
   enfocado en los tipos de tarea reales del examen IELTS
   (formato confirmado vigente en 2026, Academic + General Training).
   ============================================================ */

const IELTS_SECTIONS = [
  {
    key: 'reading', label: 'Reading',
    desc: 'True/False/Not Given, encontrar la idea principal, opción múltiple y completar frases.',
    count: 16,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  },
  {
    key: 'listening', label: 'Listening',
    desc: 'Las 4 secciones reales: conversación cotidiana, monólogo, discusión académica y conferencia.',
    count: 16,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="2.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="17.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>'
  },
  {
    key: 'speaking', label: 'Speaking',
    desc: 'Las 3 partes reales: entrevista, cue card (turno largo) y discusión.',
    count: 15,
    icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  },
  {
    key: 'writing', label: 'Writing',
    desc: 'Task 1 (carta o gráfica) y Task 2 (ensayo de opinión), como en el examen real.',
    count: 12,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="1.8"/></svg>'
  }
];

function ieltsSessionHeaderHtml(label, current, total){
  const pct = Math.round((current/total)*100);
  return `
    <a href="#" id="ieltsBackLink" class="toefl-back-link">← Volver a IELTS</a>
    <div class="session-head">
      <span class="practice-level-tag">IELTS · ${label}</span>
      <span class="session-count">Pregunta ${current} de ${total}</span>
    </div>
    <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>`;
}

function renderIeltsSessionShell(container, headerHtml){
  const wrap = document.createElement('div');
  wrap.innerHTML = headerHtml;
  const card = document.createElement('div');
  card.className = 'session-card';
  wrap.appendChild(card);
  container.innerHTML = '';
  container.appendChild(wrap);
  const back = wrap.querySelector('#ieltsBackLink');
  if(back){
    back.addEventListener('click', function(e){
      e.preventDefault();
      if(typeof container._ieltsOnExit === 'function') container._ieltsOnExit();
    });
  }
  return card;
}

function renderIeltsBackLink(container, onExit){
  const backBtn = document.createElement('a');
  backBtn.href = '#'; backBtn.className = 'toefl-back-link'; backBtn.textContent = '← Volver a IELTS';
  backBtn.addEventListener('click', (e)=>{ e.preventDefault(); onExit(); });
  container.prepend(backBtn);
}

function renderIeltsLanding(container, onSelect){
  container.innerHTML = `
    <div class="toefl-landing-intro">
      <h2>Prepárate para el IELTS</h2>
      <p>Practica los 4 tipos de tarea reales del examen (Listening, Reading, Writing y Speaking), con el mismo formato vigente en 2026. Elige una sección para empezar.</p>
      <p style="color:var(--ink-faint);font-size:0.85rem;margin-top:8px;">IELTS Academic y General Training comparten Listening y Speaking; Reading y Writing aquí incluyen ejemplos de ambos estilos.</p>
    </div>
    <div class="toefl-landing-grid">
      ${IELTS_SECTIONS.map(s => `
        <div class="toefl-landing-card">
          <span class="toefl-landing-icon">${s.icon}</span>
          <h3>${s.label}</h3>
          <p>${s.desc}</p>
          <span class="toefl-landing-count">${s.count} ejercicios</span>
          <button type="button" class="btn btn-primary btn-sm" data-ielts-section="${s.key}">Empezar →</button>
        </div>`).join('')}
    </div>`;
  container.querySelectorAll('[data-ielts-section]').forEach(btn=>{
    btn.addEventListener('click', ()=> onSelect(btn.dataset.ieltsSection));
  });
}

/* ---------- READING ---------- */
function buildIeltsReadingPool(){
  const pool = [];
  IELTS_READING.trueFalseNotGiven.forEach(it => pool.push(Object.assign({ kind:'trueFalseNotGiven' }, it)));
  IELTS_READING.matchingHeadings.forEach(it => pool.push(Object.assign({ kind:'matchingHeadings' }, it)));
  IELTS_READING.multipleChoice.forEach(it => pool.push(Object.assign({ kind:'multipleChoice' }, it)));
  IELTS_READING.sentenceCompletion.forEach(it => pool.push(Object.assign({ kind:'sentenceCompletion' }, it)));
  return pool;
}
const IELTS_READING_KIND_LABEL = {
  trueFalseNotGiven: 'True / False / Not Given',
  matchingHeadings: '¿Cuál es el mejor título para este párrafo?',
  multipleChoice: 'Lee y responde',
  sentenceCompletion: 'Completa la frase (usa palabras del texto)'
};

function runIeltsReadingSession({ container, onExit }){
  container._ieltsOnExit = onExit;
  const pool = buildIeltsReadingPool();
  const total = pool.length;
  const saved = loadInflightSession('ielts-reading', 'ielts');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('ielts-reading', 'ielts', { total, idx, results, startedAt });
    const card = renderIeltsSessionShell(container, ieltsSessionHeaderHtml('Reading', idx+1, total));

    if(item.kind === 'trueFalseNotGiven'){
      card.innerHTML = `
        <div class="practice-instruction">${IELTS_READING_KIND_LABEL[item.kind]}</div>
        <div class="reading-passage"><h4>${item.title}</h4><p>${item.text}</p></div>
        <div class="practice-prompt" style="margin-top:16px;">${item.statement}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireIeltsOptions(card, ['True','False','Not Given'], item.correct, item.explain, ()=>afterAnswer());
    } else if(item.kind === 'matchingHeadings'){
      card.innerHTML = `
        <div class="practice-instruction">${IELTS_READING_KIND_LABEL[item.kind]}</div>
        <div class="reading-passage"><p>${item.paragraph}</p></div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireIeltsOptions(card, item.options, item.correct, item.explain, ()=>afterAnswer());
    } else if(item.kind === 'multipleChoice'){
      card.innerHTML = `
        <div class="practice-instruction">${IELTS_READING_KIND_LABEL[item.kind]} <span class="practice-level-tag" style="margin-left:8px;">${item.style}</span></div>
        <div class="reading-passage"><h4>${item.title}</h4><p>${item.text}</p></div>
        <div class="practice-prompt" style="margin-top:16px;">${item.question}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireIeltsOptions(card, item.options, item.correct, item.explain, ()=>afterAnswer());
    } else if(item.kind === 'sentenceCompletion'){
      card.innerHTML = `
        <div class="practice-instruction">${IELTS_READING_KIND_LABEL[item.kind]}</div>
        <div class="reading-passage"><p>${item.text}</p></div>
        <div class="blank-row" id="sentenceRow"></div>
        <div class="word-bank" id="bank"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      const row = card.querySelector('#sentenceRow');
      item.sentence.forEach(w=>{
        const span = document.createElement('span');
        if(w === '___'){ span.className = 'blank-slot'; span.id = 'blankSlot'; }
        else { span.style.fontWeight = '600'; span.style.fontSize = '1.02rem'; span.textContent = w; }
        row.appendChild(span);
      });
      const bank = card.querySelector('#bank');
      const shuffledBank = shuffleArray(item.bank);
      shuffledBank.forEach(word=>{
        const chip = document.createElement('button');
        chip.className = 'word-chip';
        chip.textContent = word;
        chip.addEventListener('click', ()=>{
          if(chip.classList.contains('used')) return;
          [...bank.children].forEach(c=>c.classList.remove('used'));
          chip.classList.add('used');
          const slot = card.querySelector('#blankSlot');
          slot.textContent = word;
          slot.classList.add('filled');
          const isCorrect = word === item.correct;
          slot.style.borderColor = isCorrect ? '#1FA463' : '#EF5A45';
          slot.style.background = isCorrect ? '#E7F7EE' : '#FDEBE8';
          renderFeedback(card, isCorrect, item.explain);
          afterAnswer(isCorrect);
        });
        bank.appendChild(chip);
      });
    }

    function afterAnswer(isCorrect){
      results.push({ itemId:item.id, isCorrect });
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
    }
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    clearInflightSession('ielts-reading', 'ielts');
    recordSession({ skill:'ielts-reading', level:'ielts', topics:['IELTS Reading'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`${correct} / ${total} correctas`, topics:['IELTS Reading'] });
    wireSummaryButtons(container, ()=>runIeltsReadingSession({ container, onExit }));
    renderIeltsBackLink(container, onExit);
  }
  renderItem();
}

// Ayudante compartido: pinta una lista de opciones y llama a onDone(isCorrect)
// al elegir una. Usado por trueFalseNotGiven, matchingHeadings y multipleChoice
// (todas son, en el fondo, "elige la opción correcta" con distinta forma).
function wireIeltsOptions(card, options, correctIndex, explain, onDone){
  const list = card.querySelector('#optList');
  const { options: opts, correct: correctIdx } = shuffleOptions(options, correctIndex);
  opts.forEach((opt,i)=>{
    const b = document.createElement('button');
    b.className = 'option';
    b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
    b.addEventListener('click', ()=>{
      const isCorrect = i === correctIdx;
      [...list.children].forEach((el,j)=>{
        el.disabled = true;
        if(j === correctIdx) el.classList.add('correct');
        if(j === i && !isCorrect) el.classList.add('incorrect');
      });
      renderFeedback(card, isCorrect, explain);
      onDone(isCorrect);
    });
    list.appendChild(b);
  });
}
function shuffleArray(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- LISTENING ---------- */
function buildIeltsListeningPool(){
  const pool = [];
  IELTS_LISTENING.section1.forEach(it => pool.push(Object.assign({ kind:'section1' }, it)));
  IELTS_LISTENING.section2.forEach(it => pool.push(Object.assign({ kind:'section2' }, it)));
  IELTS_LISTENING.section3.forEach(it => pool.push(Object.assign({ kind:'section3' }, it)));
  IELTS_LISTENING.section4.forEach(it => pool.push(Object.assign({ kind:'section4' }, it)));
  return pool;
}
const IELTS_LISTENING_KIND_LABEL = {
  section1: 'Sección 1 · Conversación cotidiana (completa la frase)',
  section2: 'Sección 2 · Monólogo cotidiano',
  section3: 'Sección 3 · Discusión académica',
  section4: 'Sección 4 · Conferencia académica'
};

function runIeltsListeningSession({ container, onExit }){
  container._ieltsOnExit = onExit;
  const pool = buildIeltsListeningPool();
  const total = pool.length;
  const saved = loadInflightSession('ielts-listening', 'ielts');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('ielts-listening', 'ielts', { total, idx, results, startedAt });
    const card = renderIeltsSessionShell(container, ieltsSessionHeaderHtml('Listening', idx+1, total));

    if(item.kind === 'section1'){
      card.innerHTML = `
        <div class="practice-instruction">${IELTS_LISTENING_KIND_LABEL[item.kind]}</div>
        <div class="listen-row"><button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} Reproducir</button></div>
        <div class="blank-row" id="sentenceRow"></div>
        <div class="word-bank" id="bank"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#playBtn').addEventListener('click', function(){ playAudioFile(item.audioFile, card, this); });
      const row = card.querySelector('#sentenceRow');
      item.sentence.forEach(w=>{
        const span = document.createElement('span');
        if(w === '___'){ span.className = 'blank-slot'; span.id = 'blankSlot'; }
        else { span.style.fontWeight = '600'; span.style.fontSize = '1.02rem'; span.textContent = w; }
        row.appendChild(span);
      });
      const bank = card.querySelector('#bank');
      const shuffledBank = shuffleArray(item.bank);
      shuffledBank.forEach(word=>{
        const chip = document.createElement('button');
        chip.className = 'word-chip';
        chip.textContent = word;
        chip.addEventListener('click', ()=>{
          if(chip.classList.contains('used')) return;
          [...bank.children].forEach(c=>c.classList.remove('used'));
          chip.classList.add('used');
          const slot = card.querySelector('#blankSlot');
          slot.textContent = word;
          slot.classList.add('filled');
          const isCorrect = word === item.correct;
          slot.style.borderColor = isCorrect ? '#1FA463' : '#EF5A45';
          slot.style.background = isCorrect ? '#E7F7EE' : '#FDEBE8';
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
          afterAnswer(isCorrect);
        });
        bank.appendChild(chip);
      });
    } else {
      card.innerHTML = `
        <div class="practice-instruction">${IELTS_LISTENING_KIND_LABEL[item.kind]}</div>
        <div class="listen-row"><button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} Reproducir</button></div>
        <div class="practice-prompt" style="font-size:1.05rem;">${item.question}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#playBtn').addEventListener('click', function(){ playAudioFile(item.audioFile, card, this); });
      const list = card.querySelector('#optList');
      const { options: opts, correct: correctIdx } = shuffleOptions(item.options, item.correct);
      opts.forEach((opt,i)=>{
        const b = document.createElement('button');
        b.className = 'option';
        b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
        b.addEventListener('click', ()=>{
          const isCorrect = i === correctIdx;
          [...list.children].forEach((el,j)=>{
            el.disabled = true;
            if(j === correctIdx) el.classList.add('correct');
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
              <div class="example-pair"><div class="example-en">${item.transcript.replace(/\n/g,'<br>')}</div></div>
            </div>`;
          afterAnswer(isCorrect);
        });
        list.appendChild(b);
      });
    }

    function afterAnswer(isCorrect){
      results.push({ itemId:item.id, isCorrect });
      showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); renderItem(); }, ()=>{
        idx++;
        if(idx < total) renderItem(); else finish();
      }, idx+1 < total ? 'Siguiente audio →' : 'Ver resultado →');
    }
  }
  function finish(){
    const correct = results.filter(r=>r.isCorrect).length;
    clearInflightSession('ielts-listening', 'ielts');
    recordSession({ skill:'ielts-listening', level:'ielts', topics:['IELTS Listening'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`${correct} / ${total} correctas`, topics:['IELTS Listening'] });
    wireSummaryButtons(container, ()=>runIeltsListeningSession({ container, onExit }));
    renderIeltsBackLink(container, onExit);
  }
  renderItem();
}

/* ---------- SPEAKING ---------- */
function buildIeltsSpeakingPool(){
  const pool = [];
  IELTS_SPEAKING.part1.forEach(it => pool.push(Object.assign({ kind:'part1' }, it)));
  IELTS_SPEAKING.part2.forEach(it => pool.push(Object.assign({ kind:'part2' }, it)));
  IELTS_SPEAKING.part3.forEach(it => pool.push(Object.assign({ kind:'part3' }, it)));
  return pool;
}

function runIeltsSpeakingSession({ container, onExit }){
  container._ieltsOnExit = onExit;
  const pool = buildIeltsSpeakingPool();
  const total = pool.length;
  const saved = loadInflightSession('ielts-speaking', 'ielts');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('ielts-speaking', 'ielts', { total, idx, results, startedAt });
    const card = renderIeltsSessionShell(container, ieltsSessionHeaderHtml('Speaking', idx+1, total));
    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

    if(item.kind === 'part1'){
      card.innerHTML = `
        <div class="practice-instruction">Part 1 · Interview</div>
        <div class="speak-actions"><button class="btn btn-primary btn-sm" id="hearBtn">${PLAY_ICON} Escuchar la pregunta</button></div>
        <div class="practice-prompt" style="margin-top:14px;font-size:1.05rem;">${item.question}</div>
        <div class="practice-prompt" style="margin-top:22px;">Ahora tú: responde en voz alta</div>
        <div class="speak-actions">
          ${canRecord
            ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi respuesta</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
            : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
        </div>
        <div id="compareRow" class="compare-row"></div>
        <div class="feedback show ok" id="fb">
          <div class="fb-head">${OK_ICON}<span>Ideas para tu respuesta</span></div>
          <p class="fb-explain">${item.sampleAnswer}</p>
        </div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Grabar de nuevo</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
      wireIeltsSpeakingAudio(card, item, canRecord, 'Grabar mi respuesta');
    } else if(item.kind === 'part2'){
      card.innerHTML = `
        <div class="practice-instruction">Part 2 · Cue Card (turno largo)</div>
        <div class="ielts-cuecard">
          <div class="ielts-cuecard-topic">${item.topic}</div>
          <ul class="ielts-cuecard-points">${item.points.map(p=>`<li>${p}</li>`).join('')}</ul>
        </div>
        <p class="speak-tip">Tienes 1 minuto para pensar y hasta 2 minutos para hablar. Sigue los puntos de la tarjeta en orden.</p>
        <div class="speak-actions">
          ${canRecord
            ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi respuesta</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
            : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
        </div>
        <div id="compareRow" class="compare-row"></div>
        <div class="feedback show ok" id="fb">
          <div class="fb-head">${OK_ICON}<span>Cómo organizar tu respuesta</span></div>
          <p class="fb-explain">${item.sampleAnswer}</p>
        </div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Grabar de nuevo</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
      wireIeltsSpeakingAudio(card, item, canRecord, 'Grabar mi respuesta');
    } else {
      card.innerHTML = `
        <div class="practice-instruction">Part 3 · Discussion</div>
        <div class="speak-actions"><button class="btn btn-primary btn-sm" id="hearBtn">${PLAY_ICON} Escuchar la pregunta</button></div>
        <div class="practice-prompt" style="margin-top:14px;font-size:1.05rem;">${item.question}</div>
        <div class="practice-prompt" style="margin-top:22px;">Ahora tú: responde con una idea más desarrollada</div>
        <div class="speak-actions">
          ${canRecord
            ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi respuesta</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
            : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
        </div>
        <div id="compareRow" class="compare-row"></div>
        <div class="feedback show ok" id="fb">
          <div class="fb-head">${OK_ICON}<span>Ideas para tu respuesta</span></div>
          <p class="fb-explain">${item.sampleAnswer}</p>
        </div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Grabar de nuevo</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
      wireIeltsSpeakingAudio(card, item, canRecord, 'Grabar mi respuesta');
    }

    card.querySelector('#nextSpeakBtn').addEventListener('click', ()=>{
      results.push({ itemId:item.id, isCorrect:null });
      idx++;
      if(idx < total) renderItem(); else finish();
    });
  }
  function finish(){
    clearInflightSession('ielts-speaking', 'ielts');
    recordSession({ skill:'ielts-speaking', level:'ielts', topics:['IELTS Speaking'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`Practicaste ${total} respuestas en voz alta`, topics:['IELTS Speaking'] });
    wireSummaryButtons(container, ()=>runIeltsSpeakingSession({ container, onExit }));
    renderIeltsBackLink(container, onExit);
  }
  renderItem();
}

// Ayudante compartido para las 3 partes de Speaking: conecta el botón de
// escuchar (si el item tiene audio) y el de grabar/comparar.
function wireIeltsSpeakingAudio(card, item, canRecord, recordLabel){
  const hearBtn = card.querySelector('#hearBtn');
  if(hearBtn && item.audioFile) hearBtn.addEventListener('click', function(){ playAudioFile(item.audioFile, card, this); });

  if(canRecord){
    let stream = null, recorder = null, chunks = [];
    const recordBtn = card.querySelector('#recordBtn');
    const compareRow = card.querySelector('#compareRow');
    const retryBtn = card.querySelector('#retryBtn');
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
        compareRow.innerHTML = `<div class="compare-col"><div class="compare-label">Tu grabación</div><audio controls src="${url}"></audio></div>`;
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
      recordBtn.innerHTML = `${MIC_ICON} ${recordLabel}`;
      if(recIndicator) recIndicator.hidden = true;
    });
  }
}

/* ---------- WRITING ---------- */
function buildIeltsWritingPool(){
  const pool = [];
  IELTS_WRITING.task1Letter.forEach(it => pool.push(Object.assign({ kind:'task1Letter' }, it)));
  IELTS_WRITING.task1Chart.forEach(it => pool.push(Object.assign({ kind:'task1Chart' }, it)));
  IELTS_WRITING.task2Essay.forEach(it => pool.push(Object.assign({ kind:'task2Essay' }, it)));
  return pool;
}

function runIeltsWritingSession({ container, onExit }){
  container._ieltsOnExit = onExit;
  const pool = buildIeltsWritingPool();
  const total = pool.length;
  const saved = loadInflightSession('ielts-writing', 'ielts');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderReviewFeedback(card, exampleHtml, checklist){
    const fb = card.querySelector('#fb');
    fb.classList.add('show','ok');
    fb.innerHTML = `
      <div class="fb-head">${OK_ICON}<span>Compara tu texto con este ejemplo</span></div>
      <div class="examples-block"><div class="examples-label">Ejemplo</div><div class="example-pair"><div class="example-en" style="white-space:pre-line;">${exampleHtml}</div></div></div>
      <ul class="checklist">${checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
  }

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('ielts-writing', 'ielts', { total, idx, results, startedAt });
    const card = renderIeltsSessionShell(container, ieltsSessionHeaderHtml('Writing', idx+1, total));

    if(item.kind === 'task1Letter'){
      card.innerHTML = `
        <div class="practice-instruction">Task 1 · Letter (General Training) <span class="practice-level-tag" style="margin-left:8px;">${item.tone}</span></div>
        <div class="practice-prompt">${item.prompt}</div>
        <textarea id="writingInput" rows="6" class="writing-area" placeholder="Escribe tu carta en inglés aquí..."></textarea>
        <div class="next-row" style="justify-content:flex-start;">
          <button class="btn btn-primary btn-sm" id="reviewBtn">Ver ejemplo y checklist</button>
        </div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#reviewBtn').addEventListener('click', function(){
        this.disabled = true;
        renderReviewFeedback(card, item.example, item.checklist);
        results.push({ itemId:item.id, isCorrect:null });
        showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{ idx++; if(idx < total) renderItem(); else finish(); });
      });
    } else if(item.kind === 'task1Chart'){
      const tableHtml = `<table class="ielts-chart-table"><thead><tr>${item.chartData.columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${item.chartData.rows.map(r=>`<tr>${r.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      card.innerHTML = `
        <div class="practice-instruction">Task 1 · Chart (Academic)</div>
        <div class="practice-prompt">${item.prompt}</div>
        <div class="ielts-chart-wrap"><div class="ielts-chart-title">${item.chartTitle}</div>${tableHtml}</div>
        <textarea id="writingInput" rows="6" class="writing-area" placeholder="Describe los datos en inglés aquí..."></textarea>
        <div class="next-row" style="justify-content:flex-start;">
          <button class="btn btn-primary btn-sm" id="reviewBtn">Ver ejemplo y checklist</button>
        </div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#reviewBtn').addEventListener('click', function(){
        this.disabled = true;
        renderReviewFeedback(card, item.example, item.checklist);
        results.push({ itemId:item.id, isCorrect:null });
        showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{ idx++; if(idx < total) renderItem(); else finish(); });
      });
    } else {
      card.innerHTML = `
        <div class="practice-instruction">Task 2 · Essay <span class="practice-level-tag" style="margin-left:8px;">${item.essayType}</span></div>
        <div class="practice-prompt">${item.prompt}</div>
        <p class="speak-tip">Escribe al menos 250 palabras (aquí no contamos palabras automáticamente, pero practica escribir esa extensión).</p>
        <textarea id="writingInput" rows="8" class="writing-area" placeholder="Escribe tu ensayo en inglés aquí..."></textarea>
        <div class="next-row" style="justify-content:flex-start;">
          <button class="btn btn-primary btn-sm" id="reviewBtn">Ver ejemplo y checklist</button>
        </div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#reviewBtn').addEventListener('click', function(){
        this.disabled = true;
        renderReviewFeedback(card, item.example, item.checklist);
        results.push({ itemId:item.id, isCorrect:null });
        showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{ idx++; if(idx < total) renderItem(); else finish(); });
      });
    }
  }
  function finish(){
    clearInflightSession('ielts-writing', 'ielts');
    recordSession({ skill:'ielts-writing', level:'ielts', topics:['IELTS Writing'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`Completaste ${total} ejercicios de escritura`, topics:['IELTS Writing'] });
    wireSummaryButtons(container, ()=>runIeltsWritingSession({ container, onExit }));
    renderIeltsBackLink(container, onExit);
  }
  renderItem();
}

function startIeltsSection(key, container, onExit){
  if(key === 'reading') runIeltsReadingSession({ container, onExit });
  else if(key === 'listening') runIeltsListeningSession({ container, onExit });
  else if(key === 'speaking') runIeltsSpeakingSession({ container, onExit });
  else if(key === 'writing') runIeltsWritingSession({ container, onExit });
}
