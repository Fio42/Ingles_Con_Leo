/* ============================================================
   Inglés con Leo — Motor de práctica TOEFL
   Reutiliza los helpers generales de app.js (shuffleOptions,
   renderFeedback, showNextButton, showRetryOrNextButtons,
   playAudioFile, iconos, recordSession, renderSessionSummary,
   wireSummaryButtons). El contenido vive en toefl-data.js.
   No hay niveles (A1-C1) aquí: es un solo nivel de práctica
   enfocado en los tipos de pregunta reales del TOEFL iBT
   (formato vigente desde enero de 2026).
   ============================================================ */

const TOEFL_SECTIONS = [
  {
    key: 'reading', label: 'Reading',
    desc: 'Completa palabras y responde sobre textos cortos y académicos.',
    count: 14,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  },
  {
    key: 'listening', label: 'Listening',
    desc: 'Escucha conversaciones, anuncios y mini-conferencias.',
    count: 16,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="2.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="17.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>'
  },
  {
    key: 'speaking', label: 'Speaking',
    desc: 'Repite frases y responde preguntas de entrevista en voz alta.',
    count: 10,
    icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  },
  {
    key: 'writing', label: 'Writing',
    desc: 'Arma oraciones, escribe un correo y participa en una discusión.',
    count: 12,
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="1.8"/></svg>'
  }
];

function toeflSessionHeaderHtml(label, current, total){
  const pct = Math.round((current/total)*100);
  return `
    <a href="#" id="toeflBackLink" class="toefl-back-link">← Volver a TOEFL</a>
    <div class="session-head">
      <span class="practice-level-tag">TOEFL · ${label}</span>
      <span class="session-count">Pregunta ${current} de ${total}</span>
    </div>
    <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>`;
}

function renderToeflSessionShell(container, headerHtml){
  const wrap = document.createElement('div');
  wrap.innerHTML = headerHtml;
  const card = document.createElement('div');
  card.className = 'session-card';
  wrap.appendChild(card);
  container.innerHTML = '';
  container.appendChild(wrap);
  const back = wrap.querySelector('#toeflBackLink');
  if(back){
    back.addEventListener('click', function(e){
      e.preventDefault();
      if(typeof container._toeflOnExit === 'function') container._toeflOnExit();
    });
  }
  return card;
}

function renderToeflLanding(container, onSelect){
  container.innerHTML = `
    <div class="toefl-landing-intro">
      <h2>Prepárate para el TOEFL</h2>
      <p>Practica los 4 tipos de tarea del examen actual (formato TOEFL iBT vigente desde enero de 2026). Elige una sección para empezar.</p>
    </div>
    <div class="toefl-landing-grid">
      ${TOEFL_SECTIONS.map(s => `
        <div class="toefl-landing-card">
          <span class="toefl-landing-icon">${s.icon}</span>
          <h3>${s.label}</h3>
          <p>${s.desc}</p>
          <span class="toefl-landing-count">${s.count} ejercicios</span>
          <button type="button" class="btn btn-primary btn-sm" data-toefl-section="${s.key}">Empezar →</button>
        </div>`).join('')}
    </div>`;
  container.querySelectorAll('[data-toefl-section]').forEach(btn=>{
    btn.addEventListener('click', ()=> onSelect(btn.dataset.toeflSection));
  });
}

/* ---------- READING ---------- */
function buildToeflReadingPool(){
  const pool = [];
  TOEFL_READING.completeWords.forEach(it => pool.push(Object.assign({ kind:'completeWords' }, it)));
  TOEFL_READING.dailyLife.forEach(it => pool.push(Object.assign({ kind:'dailyLife' }, it)));
  TOEFL_READING.academic.forEach(it => pool.push(Object.assign({ kind:'academic' }, it)));
  return pool;
}
const TOEFL_READING_KIND_LABEL = { completeWords:'Complete the Words', dailyLife:'Read in Daily Life', academic:'Read an Academic Passage' };

function runToeflReadingSession({ container, onExit }){
  container._toeflOnExit = onExit;
  const pool = buildToeflReadingPool();
  const total = pool.length;
  const saved = loadInflightSession('toefl-reading', 'toefl');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('toefl-reading', 'toefl', { total, idx, results, startedAt });
    const card = renderToeflSessionShell(container, toeflSessionHeaderHtml('Reading', idx+1, total));
    if(item.kind === 'completeWords'){
      card.innerHTML = `
        <div class="practice-instruction">${TOEFL_READING_KIND_LABEL[item.kind]}</div>
        <div class="practice-prompt">${item.sentence}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
    } else {
      card.innerHTML = `
        <div class="practice-instruction">${TOEFL_READING_KIND_LABEL[item.kind]}</div>
        <div class="reading-passage"><h4>${item.title}</h4><p>${item.text}</p></div>
        <div class="practice-prompt" style="margin-top:16px;">${item.question}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
    }
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
        renderFeedback(card, isCorrect, item.explain);
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
    clearInflightSession('toefl-reading', 'toefl');
    recordSession({ skill:'toefl-reading', level:'toefl', topics:['TOEFL Reading'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`${correct} / ${total} correctas`, topics:['TOEFL Reading'] });
    wireSummaryButtons(container, ()=>runToeflReadingSession({ container, onExit }));
    const backBtn = document.createElement('a');
    backBtn.href = '#'; backBtn.className = 'toefl-back-link'; backBtn.textContent = '← Volver a TOEFL';
    backBtn.addEventListener('click', (e)=>{ e.preventDefault(); onExit(); });
    container.prepend(backBtn);
  }
  renderItem();
}

/* ---------- LISTENING ---------- */
function buildToeflListeningPool(){
  const pool = [];
  TOEFL_LISTENING.chooseResponse.forEach(it => pool.push(Object.assign({ kind:'chooseResponse' }, it)));
  TOEFL_LISTENING.conversation.forEach(it => pool.push(Object.assign({ kind:'conversation' }, it)));
  TOEFL_LISTENING.announcement.forEach(it => pool.push(Object.assign({ kind:'announcement' }, it)));
  TOEFL_LISTENING.academicTalk.forEach(it => pool.push(Object.assign({ kind:'academicTalk' }, it)));
  return pool;
}
const TOEFL_LISTENING_KIND_LABEL = { chooseResponse:'Listen and Choose a Response', conversation:'Listen to a Conversation', announcement:'Listen to an Announcement', academicTalk:'Listen to an Academic Talk' };

function runToeflListeningSession({ container, onExit }){
  container._toeflOnExit = onExit;
  const pool = buildToeflListeningPool();
  const total = pool.length;
  const saved = loadInflightSession('toefl-listening', 'toefl');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('toefl-listening', 'toefl', { total, idx, results, startedAt });
    const card = renderToeflSessionShell(container, toeflSessionHeaderHtml('Listening', idx+1, total));
    card.innerHTML = `
      <div class="practice-instruction">${TOEFL_LISTENING_KIND_LABEL[item.kind]}</div>
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
    clearInflightSession('toefl-listening', 'toefl');
    recordSession({ skill:'toefl-listening', level:'toefl', topics:['TOEFL Listening'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`${correct} / ${total} correctas`, topics:['TOEFL Listening'] });
    wireSummaryButtons(container, ()=>runToeflListeningSession({ container, onExit }));
    const backBtn = document.createElement('a');
    backBtn.href = '#'; backBtn.className = 'toefl-back-link'; backBtn.textContent = '← Volver a TOEFL';
    backBtn.addEventListener('click', (e)=>{ e.preventDefault(); onExit(); });
    container.prepend(backBtn);
  }
  renderItem();
}

/* ---------- SPEAKING ---------- */
function buildToeflSpeakingPool(){
  const pool = [];
  TOEFL_SPEAKING.listenRepeat.forEach(it => pool.push(Object.assign({ kind:'listenRepeat' }, it)));
  TOEFL_SPEAKING.interview.forEach(it => pool.push(Object.assign({ kind:'interview' }, it)));
  return pool;
}

function runToeflSpeakingSession({ container, onExit }){
  container._toeflOnExit = onExit;
  const pool = buildToeflSpeakingPool();
  const total = pool.length;
  const saved = loadInflightSession('toefl-speaking', 'toefl');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('toefl-speaking', 'toefl', { total, idx, results, startedAt });
    const card = renderToeflSessionShell(container, toeflSessionHeaderHtml('Speaking', idx+1, total));
    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

    if(item.kind === 'listenRepeat'){
      card.innerHTML = `
        <div class="practice-instruction">Listen and Repeat</div>
        <div class="speak-sentence">${item.sentence}</div>
        <p class="speak-tip">${item.translation}</p>
        <div class="speak-actions"><button class="btn btn-ghost btn-sm" id="hearBtn">${PLAY_ICON} Escuchar</button></div>
        <div class="practice-prompt" style="margin-top:22px;">Ahora tú: repite la frase en voz alta</div>
        <div class="speak-actions">
          ${canRecord
            ? `<button class="btn btn-primary btn-sm" id="recordBtn">${MIC_ICON} Grabar mi voz</button><span class="recording-indicator" id="recIndicator" hidden>● Grabando...</span>`
            : `<p class="audio-missing-note">Tu navegador no permite grabar audio aquí. Puedes practicar en voz alta igual y avanzar.</p>`}
        </div>
        <div id="compareRow" class="compare-row"></div>
        <div class="next-row" id="nextRow">
          <button class="btn btn-ghost btn-sm" id="retryBtn" style="display:none;">Intentar otra vez</button>
          <button class="btn btn-primary btn-sm" id="nextSpeakBtn">${idx+1 < total ? 'Siguiente →' : 'Ver resultado →'}</button>
        </div>`;
    } else {
      card.innerHTML = `
        <div class="practice-instruction">Take an Interview</div>
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
    }

    const hearBtn = card.querySelector('#hearBtn');
    if(hearBtn) hearBtn.addEventListener('click', function(){ playAudioFile(item.audioFile, card, this); });
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
      const recordLabel = item.kind === 'listenRepeat' ? 'Grabar mi voz' : 'Grabar mi respuesta';

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
  function finish(){
    clearInflightSession('toefl-speaking', 'toefl');
    recordSession({ skill:'toefl-speaking', level:'toefl', topics:['TOEFL Speaking'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:`Practicaste ${total} respuestas en voz alta`, topics:['TOEFL Speaking'] });
    wireSummaryButtons(container, ()=>runToeflSpeakingSession({ container, onExit }));
    const backBtn = document.createElement('a');
    backBtn.href = '#'; backBtn.className = 'toefl-back-link'; backBtn.textContent = '← Volver a TOEFL';
    backBtn.addEventListener('click', (e)=>{ e.preventDefault(); onExit(); });
    container.prepend(backBtn);
  }
  renderItem();
}

/* ---------- WRITING ---------- */
function buildToeflWritingPool(){
  const pool = [];
  TOEFL_WRITING.buildSentence.forEach(it => pool.push(Object.assign({ kind:'buildSentence' }, it)));
  TOEFL_WRITING.email.forEach(it => pool.push(Object.assign({ kind:'email' }, it)));
  TOEFL_WRITING.discussion.forEach(it => pool.push(Object.assign({ kind:'discussion' }, it)));
  return pool;
}

function runToeflWritingSession({ container, onExit }){
  container._toeflOnExit = onExit;
  const pool = buildToeflWritingPool();
  const total = pool.length;
  const saved = loadInflightSession('toefl-writing', 'toefl');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function renderItem(){
    const item = pool[idx];
    saveInflightSession('toefl-writing', 'toefl', { total, idx, results, startedAt });
    const card = renderToeflSessionShell(container, toeflSessionHeaderHtml('Writing', idx+1, total));

    if(item.kind === 'buildSentence'){
      card.innerHTML = `
        <div class="practice-instruction">Build a Sentence</div>
        <div class="practice-prompt">Toca las palabras en el orden correcto para armar la oración.</div>
        <div class="assembled-row" id="assembled"></div>
        <div class="word-bank" id="bank"></div>
        <div class="next-row" style="justify-content:flex-start;">
          <button class="btn btn-ghost btn-sm" id="resetBtn">↺ Reiniciar</button>
          <button class="btn btn-primary btn-sm" id="checkBtn">Comprobar</button>
        </div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      const bank = card.querySelector('#bank');
      const assembled = card.querySelector('#assembled');
      const words = item.words;
      const shuffled = [...words];
      for(let i = shuffled.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      let order = [];
      function renderBank(){
        bank.innerHTML = '';
        shuffled.forEach((w,i)=>{
          if(order.includes(i)) return;
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'word-chip';
          chip.textContent = w;
          chip.addEventListener('click', ()=>{ order.push(i); renderAssembled(); renderBank(); });
          bank.appendChild(chip);
        });
      }
      function renderAssembled(){
        assembled.innerHTML = '';
        order.forEach(i=>{
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'word-chip filled';
          chip.textContent = shuffled[i];
          chip.addEventListener('click', ()=>{ order = order.filter(x=>x!==i); renderAssembled(); renderBank(); });
          assembled.appendChild(chip);
        });
      }
      renderBank();
      renderAssembled();
      card.querySelector('#resetBtn').addEventListener('click', ()=>{ order = []; renderAssembled(); renderBank(); });
      card.querySelector('#checkBtn').addEventListener('click', ()=>{
        const built = order.map(i=>shuffled[i]).join(' ');
        const isCorrect = built === words.join(' ');
        renderFeedback(card, isCorrect, isCorrect ? 'Bien armado.' : `El orden correcto es: "${words.join(' ')}"`);
        card.querySelector('#fb').innerHTML += `<div class="examples-block"><div class="examples-label">Traducción</div><div class="example-pair"><div class="example-es">${item.translation}</div></div></div>`;
        results.push({ itemId:item.id, isCorrect });
        showRetryOrNextButtons(card, isCorrect, ()=>{ results.pop(); order = []; renderItem(); }, ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        }, idx+1 < total ? 'Siguiente →' : 'Ver resultado →');
      });
    } else if(item.kind === 'email'){
      card.innerHTML = `
        <div class="practice-instruction">Write an Email</div>
        <div class="practice-prompt">${item.prompt}</div>
        <textarea id="writingInput" rows="6" class="writing-area" placeholder="Escribe tu correo en inglés aquí..."></textarea>
        <div class="next-row" style="justify-content:flex-start;">
          <button class="btn btn-primary btn-sm" id="reviewBtn">Ver ejemplo y checklist</button>
        </div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#reviewBtn').addEventListener('click', function(){
        this.disabled = true;
        const fb = card.querySelector('#fb');
        fb.classList.add('show','ok');
        fb.innerHTML = `
          <div class="fb-head">${OK_ICON}<span>Compara tu correo con este ejemplo</span></div>
          <div class="examples-block"><div class="examples-label">Ejemplo</div><div class="example-pair"><div class="example-en" style="white-space:pre-line;">${item.example}</div></div></div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
        results.push({ itemId:item.id, isCorrect:null });
        showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        });
      });
    } else {
      card.innerHTML = `
        <div class="practice-instruction">Write for an Academic Discussion</div>
        <div class="practice-prompt">${item.professorPrompt}</div>
        <div class="examples-block">
          <div class="examples-label">Tus compañeros ya escribieron:</div>
          ${item.classmatePosts.map(p=>`<div class="example-pair"><div class="example-en">${p}</div></div>`).join('')}
        </div>
        <textarea id="writingInput" rows="5" class="writing-area" placeholder="Escribe tu respuesta en inglés aquí..."></textarea>
        <div class="next-row" style="justify-content:flex-start;">
          <button class="btn btn-primary btn-sm" id="reviewBtn">Ver ejemplo y checklist</button>
        </div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      card.querySelector('#reviewBtn').addEventListener('click', function(){
        this.disabled = true;
        const fb = card.querySelector('#fb');
        fb.classList.add('show','ok');
        fb.innerHTML = `
          <div class="fb-head">${OK_ICON}<span>Compara tu respuesta con este ejemplo</span></div>
          <div class="examples-block"><div class="examples-label">Ejemplo</div><div class="example-pair"><div class="example-en">${item.example}</div></div></div>
          <ul class="checklist">${item.checklist.map(c=>`<li>${c}</li>`).join('')}</ul>`;
        results.push({ itemId:item.id, isCorrect:null });
        showNextButton(card, idx+1 < total ? 'Siguiente →' : 'Ver resultado →', ()=>{
          idx++;
          if(idx < total) renderItem(); else finish();
        });
      });
    }
  }
  function finish(){
    const graded = results.filter(r=>r.isCorrect===true || r.isCorrect===false);
    const correct = graded.filter(r=>r.isCorrect).length;
    const scoreText = graded.length ? `${correct} / ${graded.length} oraciones correctas` : `Completaste ${total} ejercicios de escritura`;
    clearInflightSession('toefl-writing', 'toefl');
    recordSession({ skill:'toefl-writing', level:'toefl', topics:['TOEFL Writing'], results, startedAt });
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score:scoreText, topics:['TOEFL Writing'] });
    wireSummaryButtons(container, ()=>runToeflWritingSession({ container, onExit }));
    const backBtn = document.createElement('a');
    backBtn.href = '#'; backBtn.className = 'toefl-back-link'; backBtn.textContent = '← Volver a TOEFL';
    backBtn.addEventListener('click', (e)=>{ e.preventDefault(); onExit(); });
    container.prepend(backBtn);
  }
  renderItem();
}

function startToeflSection(key, container, onExit){
  if(key === 'reading') runToeflReadingSession({ container, onExit });
  else if(key === 'listening') runToeflListeningSession({ container, onExit });
  else if(key === 'speaking') runToeflSpeakingSession({ container, onExit });
  else if(key === 'writing') runToeflWritingSession({ container, onExit });
}
