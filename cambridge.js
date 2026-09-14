/* ============================================================
   Inglés con Leo — Motor de práctica Cambridge English (B2 First)
   Reutiliza los helpers generales de app.js (shuffleOptions,
   renderFeedback, showNextButton, showRetryOrNextButtons,
   playAudioFile, iconos, recordSession, renderSessionSummary,
   wireSummaryButtons). El contenido vive en cambridge-data.js.
   Un solo nivel de práctica enfocado en los tipos de tarea reales
   del examen B2 First (FCE), el examen de Cambridge English más
   solicitado (formato vigente en 2026: Reading & Use of English,
   Writing, Listening y Speaking).
   ============================================================ */

const CAMBRIDGE_SECTIONS = [
  {
    key: 'reading', label: 'Reading & Use of English',
    desc: 'Cloze de vocabulario y gramática, word formation, transformaciones y comprensión de lectura.',
    count: 24,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  },
  {
    key: 'listening', label: 'Listening',
    desc: 'Extractos cortos, monólogos, multiple matching y una entrevista larga.',
    count: 16,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="2.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="17.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>'
  },
  {
    key: 'writing', label: 'Writing',
    desc: 'Ensayo obligatorio, artículo, correo y reseña, como en la Parte 1 y 2 reales.',
    count: 12,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="1.8"/></svg>'
  },
  {
    key: 'speaking', label: 'Speaking',
    desc: 'Entrevista, turno largo comparando fotos, tarea colaborativa y discusión final.',
    count: 14,
    icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  }
];

function cambridgeSessionHeaderHtml(label, current, total){
  const pct = Math.round((current/total)*100);
  return `
    <a href="#" id="cambridgeBackLink" class="toefl-back-link">← Volver a Cambridge English</a>
    <div class="session-head">
      <span class="practice-level-tag">B2 First · ${label}</span>
      <span class="session-count">Pregunta ${current} de ${total}</span>
    </div>
    <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>`;
}

function renderCambridgeSessionShell(container, headerHtml){
  const wrap = document.createElement('div');
  wrap.innerHTML = headerHtml;
  const card = document.createElement('div');
  card.className = 'session-card';
  wrap.appendChild(card);
  container.innerHTML = '';
  container.appendChild(wrap);
  const back = wrap.querySelector('#cambridgeBackLink');
  if(back){
    back.addEventListener('click', function(e){
      e.preventDefault();
      if(typeof container._cambridgeOnExit === 'function') container._cambridgeOnExit();
    });
  }
  return card;
}

function renderCambridgeBackLink(container, onExit){
  const backBtn = document.createElement('a');
  backBtn.href = '#'; backBtn.className = 'toefl-back-link'; backBtn.textContent = '← Volver a Cambridge English';
  backBtn.addEventListener('click', (e)=>{ e.preventDefault(); onExit(); });
  container.prepend(backBtn);
}

function renderCambridgeLanding(container, onSelect){
  container.innerHTML = `
    <div class="toefl-landing-intro">
      <h2>Prepárate para el Cambridge English (B2 First)</h2>
      <p>Practica los 4 tipos de tarea reales del examen B2 First / FCE, el certificado de Cambridge English más solicitado en trabajos, universidades y trámites. Si dominas estos tipos de tarea, el formato del examen real no te tomará por sorpresa.</p>
      <p style="color:var(--ink-faint);font-size:0.85rem;margin-top:8px;">Formato vigente en 2026 según cambridgeenglish.org. El puntaje mínimo para aprobar es 160 en la Cambridge English Scale.</p>
    </div>
    <div class="toefl-landing-grid">
      ${CAMBRIDGE_SECTIONS.map(s => `
        <div class="toefl-landing-card">
          <span class="toefl-landing-icon">${s.icon}</span>
          <h3>${s.label}</h3>
          <p>${s.desc}</p>
          <span class="toefl-landing-count">${s.count} ejercicios</span>
          <button type="button" class="btn btn-primary btn-sm" data-cambridge-section="${s.key}">Empezar →</button>
        </div>`).join('')}
    </div>`;
  container.querySelectorAll('[data-cambridge-section]').forEach(btn=>{
    btn.addEventListener('click', ()=> onSelect(btn.dataset.cambridgeSection));
  });
}

// Ayudante compartido: pinta una lista de opciones y llama a onDone(isCorrect)
// al elegir una. Se usa en varios subtipos de Reading y Listening.
function wireCambridgeOptions(card, options, correctIndex, explain, onDone){
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
function cambridgeShuffleArray(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// Ayudante compartido: arma una fila con huecos (___) y un banco de
// palabras arrastrables/clicables. Se usa en openCloze y en varios
// subtipos de Listening.
function wireCambridgeWordBank(card, sentenceParts, bank, correct, onDone){
  const row = card.querySelector('#sentenceRow');
  sentenceParts.forEach(w=>{
    const span = document.createElement('span');
    if(w === '___'){ span.className = 'blank-slot'; span.id = 'blankSlot'; }
    else { span.style.fontWeight = '600'; span.style.fontSize = '1.02rem'; span.textContent = w; }
    row.appendChild(span);
  });
  const bankEl = card.querySelector('#bank');
  const shuffledBank = cambridgeShuffleArray(bank);
  shuffledBank.forEach(word=>{
    const chip = document.createElement('button');
    chip.className = 'word-chip';
    chip.textContent = word;
    chip.addEventListener('click', ()=>{
      if(chip.classList.contains('used')) return;
      [...bankEl.children].forEach(c=>c.classList.remove('used'));
      chip.classList.add('used');
      const slot = card.querySelector('#blankSlot');
      slot.textContent = word;
      slot.classList.add('filled');
      const isCorrect = word === correct;
      slot.style.borderColor = isCorrect ? '#1FA463' : '#EF5A45';
      slot.style.background = isCorrect ? '#E7F7EE' : '#FDEBE8';
      onDone(isCorrect);
    });
    bankEl.appendChild(chip);
  });
}

/* ---------- READING & USE OF ENGLISH ---------- */
function buildCambridgeReadingPool(){
  const pool = [];
  CAMBRIDGE_READING.multipleChoiceCloze.forEach(it => pool.push(Object.assign({ kind:'multipleChoiceCloze' }, it)));
  CAMBRIDGE_READING.openCloze.forEach(it => pool.push(Object.assign({ kind:'openCloze' }, it)));
  CAMBRIDGE_READING.wordFormation.forEach(it => pool.push(Object.assign({ kind:'wordFormation' }, it)));
  CAMBRIDGE_READING.keyWordTransformation.forEach(it => pool.push(Object.assign({ kind:'keyWordTransformation' }, it)));
  CAMBRIDGE_READING.readingComprehension.forEach(it => pool.push(Object.assign({ kind:'readingComprehension' }, it)));
  CAMBRIDGE_READING.multipleMatching.forEach(it => pool.push(Object.assign({ kind:'multipleMatching' }, it)));
  return pool;
}
const CAMBRIDGE_READING_KIND_LABEL = {
  multipleChoiceCloze: 'Parte 1 · Multiple-choice cloze',
  openCloze: 'Parte 2 · Open cloze',
  wordFormation: 'Parte 3 · Word formation',
  keyWordTransformation: 'Parte 4 · Key word transformation',
  readingComprehension: 'Parte 5 · Reading comprehension',
  multipleMatching: 'Parte 7 · Multiple matching'
};

function runCambridgeReadingSession({ container, onExit }){
  container._cambridgeOnExit = onExit;
  const pool = buildCambridgeReadingPool();
  const total = pool.length;
  const saved = loadInflightSession('cambridge-reading', 'cambridge');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('cambridge-reading', 'cambridge', { total, idx, results, startedAt });
    const card = renderCambridgeSessionShell(container, cambridgeSessionHeaderHtml('Reading & Use of English', idx+1, total));

    if(item.kind === 'multipleChoiceCloze'){
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_READING_KIND_LABEL[item.kind]}</div>
        <div class="practice-prompt">${item.sentence}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireCambridgeOptions(card, item.options, item.correct, item.explain, (isCorrect)=>afterAnswer(isCorrect));
    } else if(item.kind === 'openCloze'){
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_READING_KIND_LABEL[item.kind]}</div>
        <div class="blank-row" id="sentenceRow"></div>
        <div class="word-bank" id="bank"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireCambridgeWordBank(card, item.sentence, item.bank, item.correct, (isCorrect)=>{
        renderFeedback(card, isCorrect, item.explain);
        afterAnswer(isCorrect);
      });
    } else if(item.kind === 'wordFormation'){
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_READING_KIND_LABEL[item.kind]}</div>
        <div class="practice-prompt">${item.sentence}</div>
        <div class="practice-instruction">Palabra base: <strong>${item.rootWord}</strong></div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireCambridgeOptions(card, item.options, item.correct, item.explain, (isCorrect)=>afterAnswer(isCorrect));
    } else if(item.kind === 'keyWordTransformation'){
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_READING_KIND_LABEL[item.kind]}</div>
        <div class="practice-prompt">${item.original}</div>
        <div class="practice-instruction">Completa usando: <strong>${item.keyword}</strong> (no cambies esta palabra)</div>
        <div class="practice-prompt">${item.sentence}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireCambridgeOptions(card, item.options, item.correct, item.explain, (isCorrect)=>afterAnswer(isCorrect));
    } else if(item.kind === 'readingComprehension'){
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_READING_KIND_LABEL[item.kind]}</div>
        <div class="reading-passage"><h4>${item.title}</h4><p>${item.text}</p></div>
        <div class="practice-prompt" style="margin-top:16px;">${item.question}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireCambridgeOptions(card, item.options, item.correct, item.explain, (isCorrect)=>afterAnswer(isCorrect));
    } else if(item.kind === 'multipleMatching'){
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_READING_KIND_LABEL[item.kind]}</div>
        <div class="reading-passage"><p>${item.paragraph}</p></div>
        <div class="practice-prompt" style="margin-top:16px;">${item.question}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireCambridgeOptions(card, item.options, item.correct, item.explain, (isCorrect)=>afterAnswer(isCorrect));
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
    clearInflightSession('cambridge-reading', 'cambridge');
    recordSession({ skill:'cambridge-reading', level:'cambridge', topics:['Cambridge Reading & Use of English'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`${correct} / ${total} correctas`, topics:['Cambridge Reading & Use of English'] });
    wireSummaryButtons(container, ()=>runCambridgeReadingSession({ container, onExit }));
    renderCambridgeBackLink(container, onExit);
  }
  renderItem();
}

/* ---------- LISTENING ---------- */
function buildCambridgeListeningPool(){
  const pool = [];
  CAMBRIDGE_LISTENING.shortExtract.forEach(it => pool.push(Object.assign({ kind:'shortExtract' }, it)));
  CAMBRIDGE_LISTENING.sentenceCompletion.forEach(it => pool.push(Object.assign({ kind:'sentenceCompletion' }, it)));
  CAMBRIDGE_LISTENING.multipleMatching.forEach(it => pool.push(Object.assign({ kind:'multipleMatching' }, it)));
  CAMBRIDGE_LISTENING.longInterview.forEach(it => pool.push(Object.assign({ kind:'longInterview' }, it)));
  return pool;
}
const CAMBRIDGE_LISTENING_KIND_LABEL = {
  shortExtract: 'Parte 1 · Short extracts',
  sentenceCompletion: 'Parte 2 · Sentence completion',
  multipleMatching: 'Parte 3 · Multiple matching',
  longInterview: 'Parte 4 · Long interview'
};

function renderCambridgeListenTranscriptBlock(item){
  return `
    <div class="examples-block">
      <div class="examples-label">Transcripción</div>
      <div class="example-pair"><div class="example-en">${item.transcript.replace(/\n/g,'<br>')}</div>${item.translation ? `<div class="example-es">${item.translation}</div>` : ''}</div>
    </div>`;
}

function runCambridgeListeningSession({ container, onExit }){
  container._cambridgeOnExit = onExit;
  const pool = buildCambridgeListeningPool();
  const total = pool.length;
  const saved = loadInflightSession('cambridge-listening', 'cambridge');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('cambridge-listening', 'cambridge', { total, idx, results, startedAt });
    const card = renderCambridgeSessionShell(container, cambridgeSessionHeaderHtml('Listening', idx+1, total));

    if(item.kind === 'sentenceCompletion'){
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_LISTENING_KIND_LABEL[item.kind]}</div>
        <div class="listen-row"><button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} Reproducir</button></div>
        <div class="blank-row" id="sentenceRow"></div>
        <div class="word-bank" id="bank"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#playBtn').addEventListener('click', function(){ playAudioFile(item.audioFile, card, this); });
      wireCambridgeWordBank(card, item.sentence, item.bank, item.correct, (isCorrect)=>{
        const fb = card.querySelector('#fb');
        fb.classList.add('show');
        fb.classList.toggle('ok', isCorrect);
        fb.classList.toggle('bad', !isCorrect);
        fb.innerHTML = `
          <div class="fb-head">${isCorrect ? OK_ICON : BAD_ICON}<span>${isCorrect ? 'Correcto' : 'Casi.'}</span></div>
          <p class="fb-explain">${item.explain}</p>
          ${renderCambridgeListenTranscriptBlock(item)}`;
        afterAnswer(isCorrect);
      });
    } else {
      card.innerHTML = `
        <div class="practice-instruction">${CAMBRIDGE_LISTENING_KIND_LABEL[item.kind]}</div>
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
            ${renderCambridgeListenTranscriptBlock(item)}`;
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
    clearInflightSession('cambridge-listening', 'cambridge');
    recordSession({ skill:'cambridge-listening', level:'cambridge', topics:['Cambridge Listening'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`${correct} / ${total} correctas`, topics:['Cambridge Listening'] });
    wireSummaryButtons(container, ()=>runCambridgeListeningSession({ container, onExit }));
    renderCambridgeBackLink(container, onExit);
  }
  renderItem();
}

/* ---------- WRITING ---------- */
function buildCambridgeWritingPool(){
  const pool = [];
  CAMBRIDGE_WRITING.essay.forEach(it => pool.push(Object.assign({ kind:'essay' }, it)));
  CAMBRIDGE_WRITING.article.forEach(it => pool.push(Object.assign({ kind:'article' }, it)));
  CAMBRIDGE_WRITING.email.forEach(it => pool.push(Object.assign({ kind:'email' }, it)));
  CAMBRIDGE_WRITING.review.forEach(it => pool.push(Object.assign({ kind:'review' }, it)));
  return pool;
}
const CAMBRIDGE_WRITING_KIND_LABEL = {
  essay: 'Parte 1 · Essay (obligatorio)',
  article: 'Parte 2 · Article',
  email: 'Parte 2 · Email',
  review: 'Parte 2 · Review'
};

function runCambridgeWritingSession({ container, onExit }){
  container._cambridgeOnExit = onExit;
  const pool = buildCambridgeWritingPool();
  const total = pool.length;
  const saved = loadInflightSession('cambridge-writing', 'cambridge');
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
    saveInflightSession('cambridge-writing', 'cambridge', { total, idx, results, startedAt });
    const card = renderCambridgeSessionShell(container, cambridgeSessionHeaderHtml('Writing', idx+1, total));
    card.innerHTML = `
      <div class="practice-instruction">${CAMBRIDGE_WRITING_KIND_LABEL[item.kind]}</div>
      <div class="practice-prompt">${item.prompt}</div>
      <textarea id="writingInput" rows="7" class="writing-area" placeholder="Escribe tu texto en inglés aquí (140-190 palabras)..."></textarea>
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
  function finish(){
    clearInflightSession('cambridge-writing', 'cambridge');
    recordSession({ skill:'cambridge-writing', level:'cambridge', topics:['Cambridge Writing'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`Completaste ${total} ejercicios de escritura`, topics:['Cambridge Writing'] });
    wireSummaryButtons(container, ()=>runCambridgeWritingSession({ container, onExit }));
    renderCambridgeBackLink(container, onExit);
  }
  renderItem();
}

/* ---------- SPEAKING ---------- */
function buildCambridgeSpeakingPool(){
  const pool = [];
  CAMBRIDGE_SPEAKING.interview.forEach(it => pool.push(Object.assign({ kind:'interview' }, it)));
  CAMBRIDGE_SPEAKING.longTurn.forEach(it => pool.push(Object.assign({ kind:'longTurn' }, it)));
  CAMBRIDGE_SPEAKING.collaborativeTask.forEach(it => pool.push(Object.assign({ kind:'collaborativeTask' }, it)));
  CAMBRIDGE_SPEAKING.furtherDiscussion.forEach(it => pool.push(Object.assign({ kind:'furtherDiscussion' }, it)));
  return pool;
}

// Ayudante compartido para Speaking: conecta el botón de escuchar (si
// el item tiene audio) y el de grabar/comparar la respuesta.
function wireCambridgeSpeakingAudio(card, item, canRecord){
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
      recordBtn.innerHTML = `${MIC_ICON} Grabar mi respuesta`;
      if(recIndicator) recIndicator.hidden = true;
    });
  }
}

function runCambridgeSpeakingSession({ container, onExit }){
  container._cambridgeOnExit = onExit;
  const pool = buildCambridgeSpeakingPool();
  const total = pool.length;
  const saved = loadInflightSession('cambridge-speaking', 'cambridge');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('cambridge-speaking', 'cambridge', { total, idx, results, startedAt });
    const card = renderCambridgeSessionShell(container, cambridgeSessionHeaderHtml('Speaking', idx+1, total));
    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    const recordBlock = canRecord
      ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi respuesta</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
      : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`;

    if(item.kind === 'interview'){
      card.innerHTML = `
        <div class="practice-instruction">Parte 1 · Interview</div>
        <div class="speak-actions"><button class="btn btn-primary btn-sm" id="hearBtn">${PLAY_ICON} Escuchar la pregunta</button></div>
        <div class="practice-prompt" style="margin-top:14px;font-size:1.05rem;">${item.question}</div>
        <div class="practice-prompt" style="margin-top:22px;">Ahora tú: responde en voz alta</div>
        <div class="speak-actions">${recordBlock}</div>
        <div id="compareRow" class="compare-row"></div>
        <div class="feedback show ok" id="fb">
          <div class="fb-head">${OK_ICON}<span>Ideas para tu respuesta</span></div>
          <p class="fb-explain">${item.sampleAnswer}</p>
        </div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Grabar de nuevo</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
      wireCambridgeSpeakingAudio(card, item, canRecord);
    } else if(item.kind === 'longTurn'){
      card.innerHTML = `
        <div class="practice-instruction">Parte 2 · Long Turn (comparando dos fotos)</div>
        <div class="ielts-cuecard">
          <div class="ielts-cuecard-topic">${item.topic}</div>
          <ul class="ielts-cuecard-points">${item.points.map(p=>`<li>${p}</li>`).join('')}</ul>
        </div>
        <p class="speak-tip">Tienes alrededor de 1 minuto para hablar sin interrupciones. Sigue los puntos en orden.</p>
        <div class="speak-actions">${recordBlock}</div>
        <div id="compareRow" class="compare-row"></div>
        <div class="feedback show ok" id="fb">
          <div class="fb-head">${OK_ICON}<span>Cómo organizar tu respuesta</span></div>
          <p class="fb-explain">${item.sampleAnswer}</p>
        </div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Grabar de nuevo</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
      wireCambridgeSpeakingAudio(card, item, canRecord);
    } else if(item.kind === 'collaborativeTask'){
      card.innerHTML = `
        <div class="practice-instruction">Parte 3 · Collaborative Task</div>
        <div class="practice-prompt">${item.prompt}</div>
        <p class="speak-tip">En el examen real esta parte es con otro candidato. Practica en voz alta como si estuvieras respondiendo y proponiendo ideas a un compañero.</p>
        <div class="speak-actions">${recordBlock}</div>
        <div id="compareRow" class="compare-row"></div>
        <div class="feedback show ok" id="fb">
          <div class="fb-head">${OK_ICON}<span>Ideas para tu parte de la conversación</span></div>
          <p class="fb-explain">${item.sampleAnswer}</p>
        </div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Grabar de nuevo</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
      wireCambridgeSpeakingAudio(card, item, canRecord);
    } else {
      card.innerHTML = `
        <div class="practice-instruction">Parte 4 · Further Discussion</div>
        <div class="speak-actions"><button class="btn btn-primary btn-sm" id="hearBtn">${PLAY_ICON} Escuchar la pregunta</button></div>
        <div class="practice-prompt" style="margin-top:14px;font-size:1.05rem;">${item.question}</div>
        <div class="practice-prompt" style="margin-top:22px;">Ahora tú: responde con una idea más desarrollada</div>
        <div class="speak-actions">${recordBlock}</div>
        <div id="compareRow" class="compare-row"></div>
        <div class="feedback show ok" id="fb">
          <div class="fb-head">${OK_ICON}<span>Ideas para tu respuesta</span></div>
          <p class="fb-explain">${item.sampleAnswer}</p>
        </div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Grabar de nuevo</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
      wireCambridgeSpeakingAudio(card, item, canRecord);
    }

    card.querySelector('#nextSpeakBtn').addEventListener('click', ()=>{
      results.push({ itemId:item.id, isCorrect:null });
      idx++;
      if(idx < total) renderItem(); else finish();
    });
  }
  function finish(){
    clearInflightSession('cambridge-speaking', 'cambridge');
    recordSession({ skill:'cambridge-speaking', level:'cambridge', topics:['Cambridge Speaking'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`Practicaste ${total} respuestas en voz alta`, topics:['Cambridge Speaking'] });
    wireSummaryButtons(container, ()=>runCambridgeSpeakingSession({ container, onExit }));
    renderCambridgeBackLink(container, onExit);
  }
  renderItem();
}

function startCambridgeSection(key, container, onExit){
  if(key === 'reading') runCambridgeReadingSession({ container, onExit });
  else if(key === 'listening') runCambridgeListeningSession({ container, onExit });
  else if(key === 'writing') runCambridgeWritingSession({ container, onExit });
  else if(key === 'speaking') runCambridgeSpeakingSession({ container, onExit });
}
