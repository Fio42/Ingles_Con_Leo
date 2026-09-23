/* ============================================================
   Inglés con Leo — Motor de práctica TOEIC (solo miembros)
   Mismo enfoque que toefl.js / ielts.js: reutiliza los helpers
   de app.js (shuffleOptions, renderFeedback, showRetryOrNextButtons,
   playAudioFile, recordSession, renderSessionSummary,
   wireSummaryButtons, load/save/clearInflightSession). El
   contenido vive en toeic-data.js.

   Secciones (formato oficial TOEIC):
   - Listening: Parte 2 (pregunta-respuesta), Parte 3
     (conversaciones), Parte 4 (charlas y anuncios).
   - Reading: Parte 5 (oraciones incompletas), Parte 6 (completar
     textos) y Parte 7 (comprensión, incluye pasaje doble).
   - Speaking: leer en voz alta, responder preguntas, responder con
     información y dar tu opinión, con los tiempos reales de
     preparación y respuesta del examen.
   - Writing: oración con palabras dadas, responder un correo y
     ensayo de opinión, con contador de palabras.
   Cada sección guarda el avance ("continuar donde te quedaste").
   ============================================================ */

const TOEIC_SECTIONS = [
  { key:'listening', label:'Listening', desc:'Preguntas y respuestas, conversaciones y anuncios con acentos de Estados Unidos, Reino Unido, Canadá y Australia.',
    icon:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 13v-1a8 8 0 0116 0v1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="2.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="17.5" y="13" width="4" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>' },
  { key:'reading', label:'Reading', desc:'Oraciones incompletas, textos para completar y comprensión de correos, anuncios y chats.',
    icon:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 014 18.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5v-13z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
  { key:'speaking', label:'Speaking', desc:'Habla con cronómetro, igual que en el examen: lee en voz alta, responde preguntas y da tu opinión.',
    icon:'<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' },
  { key:'writing', label:'Writing', desc:'Escribe oraciones con palabras dadas, responde correos de trabajo y redacta un ensayo de opinión.',
    icon:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 7l3 3" stroke="currentColor" stroke-width="1.8"/></svg>' }
];

function toeicEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function toeicNl(s){ return toeicEsc(s).replace(/\n/g,'<br>'); }

/* ---------- Pools (cada pregunta es un elemento, para poder reanudar exacto) ---------- */
function buildToeicPool(section){
  const pool = [];
  if(section === 'listening'){
    TOEIC_LISTENING.questionResponse.forEach(it => pool.push(Object.assign({ kind:'p2' }, it)));
    TOEIC_LISTENING.conversations.forEach((c, ci) => c.questions.forEach((q, qi) => pool.push(Object.assign({ kind:'p3', id:c.id+'-q'+(qi+1), audioFile:c.audioFile, transcript:c.transcript, groupNum:ci+1, qNum:qi+1, qTotal:c.questions.length }, q))));
    TOEIC_LISTENING.talks.forEach((t, ti) => t.questions.forEach((q, qi) => pool.push(Object.assign({ kind:'p4', id:t.id+'-q'+(qi+1), audioFile:t.audioFile, transcript:t.transcript, talkKind:t.kind, groupNum:ti+1, qNum:qi+1, qTotal:t.questions.length }, q))));
  } else if(section === 'reading'){
    TOEIC_READING.incompleteSentences.forEach(it => pool.push(Object.assign({ kind:'p5' }, it)));
    TOEIC_READING.textCompletion.forEach(t => t.blanks.forEach((b, bi) => pool.push(Object.assign({ kind:'p6', id:t.id+'-b'+(bi+1), title:t.title, text:t.text, blankNum:bi+1, blankTotal:t.blanks.length }, b))));
    TOEIC_READING.comprehension.forEach(t => t.questions.forEach((q, qi) => pool.push(Object.assign({ kind:'p7', id:t.id+'-q'+(qi+1), title:t.title, docKind:t.kind, text:t.text, qNum:qi+1, qTotal:t.questions.length }, q))));
  } else if(section === 'speaking'){
    TOEIC_SPEAKING.readAloud.forEach(it => pool.push(Object.assign({ kind:'ra' }, it)));
    TOEIC_SPEAKING.respondQuestions.forEach(s => s.questions.forEach((q, qi) => pool.push(Object.assign({ kind:'rq', id:s.id+'-q'+(qi+1), intro:s.intro, qNum:qi+1, qTotal:s.questions.length }, q))));
    TOEIC_SPEAKING.respondInfo.forEach(s => s.questions.forEach((q, qi) => pool.push(Object.assign({ kind:'ri', id:s.id+'-q'+(qi+1), title:s.title, info:s.info, qNum:qi+1, qTotal:s.questions.length }, q))));
    TOEIC_SPEAKING.opinion.forEach(it => pool.push(Object.assign({ kind:'op' }, it)));
  } else if(section === 'writing'){
    TOEIC_WRITING.sentence.forEach(it => pool.push(Object.assign({ kind:'ws' }, it)));
    TOEIC_WRITING.email.forEach(it => pool.push(Object.assign({ kind:'we' }, it)));
    TOEIC_WRITING.essay.forEach(it => pool.push(Object.assign({ kind:'wo' }, it)));
  }
  return pool;
}
function toeicSectionCount(section){ return buildToeicPool(section).length; }

const TOEIC_PART_LABEL = {
  p2:'Part 2 · Question-Response', p3:'Part 3 · Conversations', p4:'Part 4 · Talks',
  p5:'Part 5 · Incomplete Sentences', p6:'Part 6 · Text Completion', p7:'Part 7 · Reading Comprehension',
  ra:'Read a Text Aloud', rq:'Respond to Questions', ri:'Respond to Questions Using Information', op:'Express an Opinion',
  ws:'Write a Sentence', we:'Respond to a Written Request', wo:'Write an Opinion Essay'
};

/* ---------- Landing ---------- */
function renderToeicLanding(container, onSelect){
  container.innerHTML = `
    <div class="toefl-landing-intro">
      <h2>Prepárate para el TOEIC</h2>
      <p>El TOEIC es el examen de inglés que más piden las empresas. Aquí practicas las cuatro habilidades con el mismo tipo de preguntas del examen real: Listening y Reading (se califican de 10 a 990 puntos) y Speaking y Writing (de 0 a 200 cada uno). Elige una sección para empezar.</p>
    </div>
    <div class="toefl-landing-grid">
      ${TOEIC_SECTIONS.map(s => `
        <div class="toefl-landing-card">
          <span class="toefl-landing-icon toeic-icon">${s.icon}</span>
          <h3>${s.label}</h3>
          <p>${s.desc}</p>
          <span class="toefl-landing-count">${toeicSectionCount(s.key)} ejercicios</span>
          <button type="button" class="btn btn-primary btn-sm" data-toeic-section="${s.key}">Empezar →</button>
        </div>`).join('')}
    </div>`;
  container.querySelectorAll('[data-toeic-section]').forEach(btn=>{
    btn.addEventListener('click', ()=> onSelect(btn.dataset.toeicSection));
  });
}

/* ---------- Shell ---------- */
function toeicShell(container, sectionLabel, current, total){
  if(typeof container._toeicCleanup === 'function'){ container._toeicCleanup(); container._toeicCleanup = null; }
  stopActiveAudioFile();
  const pct = Math.round((current/total)*100);
  container.innerHTML = `
    <div>
      <a href="#" class="toefl-back-link" data-toeic-back>← Volver a TOEIC</a>
      <div class="session-head">
        <span class="practice-level-tag toeic-tag">TOEIC · ${sectionLabel}</span>
        <span class="session-count">Pregunta ${current} de ${total}</span>
      </div>
      <div class="session-progress"><div class="session-progress-fill" style="width:${pct}%;"></div></div>
      <div class="session-card"></div>
    </div>`;
  container.querySelector('[data-toeic-back]').addEventListener('click', function(e){
    e.preventDefault();
    if(typeof container._toeicCleanup === 'function'){ container._toeicCleanup(); container._toeicCleanup = null; }
    stopActiveAudioFile();
    if(typeof container._toeicOnExit === 'function') container._toeicOnExit();
  });
  return container.querySelector('.session-card');
}

/* Opción múltiple genérica (opciones barajadas con shuffleOptions). */
function toeicMultipleChoice(card, item, onAnswered){
  const list = card.querySelector('#optList');
  const { options: opts, correct: correctIdx } = shuffleOptions(item.options, item.correct);
  opts.forEach((opt, i)=>{
    const b = document.createElement('button');
    b.className = 'option';
    b.innerHTML = `<span class="dot"></span><span>${toeicEsc(opt)}</span>`;
    b.addEventListener('click', ()=>{
      const isCorrect = i === correctIdx;
      [...list.children].forEach((el, j)=>{
        el.disabled = true;
        if(j === correctIdx) el.classList.add('correct');
        if(j === i && !isCorrect) el.classList.add('incorrect');
      });
      onAnswered(isCorrect);
    });
    list.appendChild(b);
  });
}

function toeicTranscriptBlock(text){
  return `<div class="examples-block"><div class="examples-label">Transcripción</div><div class="example-pair"><div class="example-en">${toeicNl(text)}</div></div></div>`;
}

/* ---------- Motor de sesión común ---------- */
function runToeicSession({ container, onExit, section }){
  container._toeicOnExit = onExit;
  const meta = TOEIC_SECTIONS.find(s => s.key === section);
  const skill = 'toeic-' + section;
  const pool = buildToeicPool(section);
  const total = pool.length;
  const saved = loadInflightSession(skill, 'toeic');
  const resumable = saved && saved.idx < total;
  const startedAt = resumable ? saved.startedAt : Date.now();
  const results = resumable ? saved.results.slice() : [];
  let idx = resumable ? saved.idx : 0;

  function next(){
    idx++;
    if(idx < total) renderItem(); else finish();
  }
  function nextLabel(){ return idx+1 < total ? 'Siguiente →' : 'Ver resultado →'; }

  function renderItem(){
    const item = pool[idx];
    saveInflightSession(skill, 'toeic', { total, idx, results, startedAt });
    const card = toeicShell(container, meta.label, idx+1, total);
    const ctx = { container, card, item, results, next, nextLabel: nextLabel(), retry: ()=>{ results.pop(); renderItem(); } };
    if(section === 'listening') renderToeicListeningItem(ctx);
    else if(section === 'reading') renderToeicReadingItem(ctx);
    else if(section === 'speaking') renderToeicSpeakingItem(ctx);
    else renderToeicWritingItem(ctx);
  }

  function finish(){
    if(typeof container._toeicCleanup === 'function'){ container._toeicCleanup(); container._toeicCleanup = null; }
    clearInflightSession(skill, 'toeic');
    recordSession({ skill, level:'toeic', topics:['TOEIC ' + meta.label], results, startedAt });
    const graded = results.filter(r => r.isCorrect === true || r.isCorrect === false);
    const correct = graded.filter(r => r.isCorrect).length;
    let score;
    if(section === 'listening' || section === 'reading'){
      score = `${correct} / ${graded.length} correctas`;
    } else if(section === 'writing'){
      score = `Completaste ${total} ejercicios de escritura (${correct} de ${graded.length} oraciones con las palabras pedidas)`;
    } else {
      score = `Practicaste ${total} respuestas en voz alta`;
    }
    container.innerHTML = renderSessionSummary({ title:'¡Sección completada!', score, topics:['TOEIC ' + meta.label] });
    if((section === 'listening' || section === 'reading') && graded.length){
      // Estimación orientativa en la escala de la sección (5 a 495).
      const est = Math.max(5, Math.min(495, 5 + Math.round((correct / graded.length) * 490 / 5) * 5));
      const note = document.createElement('p');
      note.className = 'toeic-estimate';
      note.innerHTML = `Estimación orientativa: alrededor de <strong>${est} de 495</strong> puntos en ${meta.label}. Es solo una referencia basada en tus respuestas, no un puntaje oficial.`;
      const scoreEl = container.querySelector('.summary-score');
      if(scoreEl) scoreEl.insertAdjacentElement('afterend', note);
    }
    wireSummaryButtons(container, ()=>runToeicSession({ container, onExit, section }));
    const backBtn = document.createElement('a');
    backBtn.href = '#'; backBtn.className = 'toefl-back-link'; backBtn.textContent = '← Volver a TOEIC';
    backBtn.addEventListener('click', (e)=>{ e.preventDefault(); onExit(); });
    container.prepend(backBtn);
  }
  renderItem();
}

/* ---------- LISTENING ---------- */
function renderToeicListeningItem({ card, item, results, next, nextLabel, retry }){
  const examNote = '<p class="toeic-note">En el examen real escuchas cada audio una sola vez. Aquí puedes repetirlo para practicar.</p>';
  if(item.kind === 'p2'){
    card.innerHTML = `
      <div class="practice-instruction">${TOEIC_PART_LABEL.p2}</div>
      <div class="practice-prompt">Escucha una pregunta y tres respuestas. Elige la respuesta que mejor contesta la pregunta.</div>
      <div class="listen-row"><button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} Reproducir</button></div>
      ${examNote}
      <div class="option-list toeic-letters" id="optList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    card.querySelector('#playBtn').addEventListener('click', function(){ playAudioFile(item.audioFile, card, this); });
    // Las letras quedan en el orden grabado en el audio: no se barajan.
    const list = card.querySelector('#optList');
    ['A','B','C'].forEach((letter, i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="dot"></span><span>(${letter})</span>`;
      b.addEventListener('click', ()=>{
        const isCorrect = i === item.correct;
        [...list.children].forEach((el, j)=>{
          el.disabled = true;
          el.querySelector('span:last-child').textContent = `(${'ABC'[j]}) ${item.responses[j]}`;
          if(j === item.correct) el.classList.add('correct');
          if(j === i && !isCorrect) el.classList.add('incorrect');
        });
        renderFeedback(card, isCorrect, item.explain);
        card.querySelector('#fb').insertAdjacentHTML('beforeend', toeicTranscriptBlock(item.transcript));
        results.push({ itemId:item.id, isCorrect });
        showRetryOrNextButtons(card, isCorrect, retry, next, nextLabel);
      });
      list.appendChild(b);
    });
    return;
  }
  const groupLabel = item.kind === 'p3' ? `Conversación ${item.groupNum}` : `${item.talkKind} ${item.groupNum}`;
  card.innerHTML = `
    <div class="practice-instruction">${TOEIC_PART_LABEL[item.kind]}</div>
    <div class="toeic-group-label">${groupLabel} · pregunta ${item.qNum} de ${item.qTotal}</div>
    <div class="listen-row"><button class="btn btn-primary btn-sm" id="playBtn">${PLAY_ICON} ${item.qNum === 1 ? 'Reproducir' : 'Volver a escuchar'}</button></div>
    ${item.qNum === 1 ? examNote : ''}
    <div class="practice-prompt" style="font-size:1.05rem;">${toeicEsc(item.q)}</div>
    <div class="option-list" id="optList"></div>
    <div class="feedback" id="fb"></div>
    <div class="next-row" id="nextRow"></div>`;
  card.querySelector('#playBtn').addEventListener('click', function(){ playAudioFile(item.audioFile, card, this); });
  toeicMultipleChoice(card, item, (isCorrect)=>{
    renderFeedback(card, isCorrect, toeicEsc(item.explain));
    card.querySelector('#fb').insertAdjacentHTML('beforeend', toeicTranscriptBlock(item.transcript));
    results.push({ itemId:item.id, isCorrect });
    showRetryOrNextButtons(card, isCorrect, retry, next, nextLabel);
  });
}

/* ---------- READING ---------- */
function renderToeicReadingItem({ card, item, results, next, nextLabel, retry }){
  let body = '';
  if(item.kind === 'p5'){
    body = `<div class="practice-prompt">${toeicEsc(item.sentence)}</div>`;
  } else if(item.kind === 'p6'){
    const text = toeicNl(item.text).replace(/\{(\d)\}/g, (m, n)=> Number(n) === item.blankNum
      ? `<span class="toeic-blank active">(${n}) ______</span>` : `<span class="toeic-blank">(${n})</span>`);
    body = `
      <div class="toeic-group-label">${toeicEsc(item.title)} · espacio ${item.blankNum} de ${item.blankTotal}</div>
      <div class="reading-passage toeic-doc"><p>${text}</p></div>
      <div class="practice-prompt" style="margin-top:14px;">${item.isSentence ? `Elige la oración que mejor completa el espacio (${item.blankNum}).` : `Elige la palabra o frase para el espacio (${item.blankNum}).`}</div>`;
  } else {
    body = `
      <div class="toeic-group-label">${toeicEsc(item.docKind)} · pregunta ${item.qNum} de ${item.qTotal}</div>
      <div class="reading-passage toeic-doc"><p>${toeicNl(item.text)}</p></div>
      <div class="practice-prompt" style="margin-top:14px;">${toeicEsc(item.q)}</div>`;
  }
  card.innerHTML = `
    <div class="practice-instruction">${TOEIC_PART_LABEL[item.kind]}</div>
    ${body}
    <div class="option-list" id="optList"></div>
    <div class="feedback" id="fb"></div>
    <div class="next-row" id="nextRow"></div>`;
  toeicMultipleChoice(card, item, (isCorrect)=>{
    renderFeedback(card, isCorrect, toeicEsc(item.explain));
    results.push({ itemId:item.id, isCorrect });
    showRetryOrNextButtons(card, isCorrect, retry, next, nextLabel);
  });
}

/* ---------- SPEAKING (con cronómetro real del examen) ---------- */
function renderToeicSpeakingItem(ctx){
  const { container, card, item, results, next, nextLabel } = ctx;
  let steps; // readSec (leer información), audio, prepSec, speakSec
  let top = '', after = '';
  if(item.kind === 'ra'){
    steps = { readSec:0, audio:null, prepSec:45, speakSec:45 };
    top = `<div class="practice-prompt">Lee el texto en voz alta. Tienes 45 segundos para prepararte y 45 segundos para leerlo.</div>
      <div class="speak-sentence toeic-read-text">${toeicEsc(item.text)}</div>`;
    after = `<div class="feedback show ok"><div class="fb-head">${OK_ICON}<span>Consejos de pronunciación</span></div>
      <ul class="checklist">${item.tips.map(t=>`<li>${toeicEsc(t)}</li>`).join('')}</ul>
      <div class="speak-actions" style="margin-top:12px;"><button class="btn btn-ghost btn-sm" data-model>${PLAY_ICON} Escuchar el modelo</button></div></div>`;
  } else if(item.kind === 'rq'){
    steps = { readSec:0, audio:item.audioFile, prepSec:3, speakSec:item.speakSec };
    top = `<div class="toeic-group-label">Pregunta ${item.qNum} de ${item.qTotal}</div>
      <div class="reading-passage"><p>${toeicEsc(item.intro)}</p></div>
      <div class="practice-prompt" style="margin-top:14px;">${toeicEsc(item.q)}</div>
      <p class="toeic-note">Escucharás la pregunta, tendrás 3 segundos para prepararte y ${item.speakSec} segundos para responder.</p>`;
    after = `<div class="feedback show ok"><div class="fb-head">${OK_ICON}<span>Ejemplo de respuesta</span></div><p class="fb-explain">${toeicEsc(item.sample)}</p></div>`;
  } else if(item.kind === 'ri'){
    steps = { readSec: item.qNum === 1 ? 45 : 0, audio:item.audioFile, prepSec:3, speakSec:item.speakSec };
    top = `<div class="toeic-group-label">Pregunta ${item.qNum} de ${item.qTotal}</div>
      <div class="toeic-info"><div class="toeic-info-title">${toeicEsc(item.title)}</div>
        <table>${item.info.map(r=>`<tr><th>${toeicEsc(r[0])}</th><td>${toeicEsc(r[1])}</td></tr>`).join('')}</table></div>
      <p class="toeic-note">${item.qNum === 1 ? 'Tendrás 45 segundos para leer la información. ' : ''}Luego escucharás una pregunta (no aparece escrita, igual que en el examen), tendrás 3 segundos para prepararte y ${item.speakSec} segundos para responder usando la información.</p>`;
    after = `<div class="feedback show ok"><div class="fb-head">${OK_ICON}<span>La pregunta era</span></div><p class="fb-explain">${toeicEsc(item.q)}</p>
      <div class="examples-block"><div class="examples-label">Ejemplo de respuesta</div><div class="example-pair"><div class="example-en">${toeicEsc(item.sample)}</div></div></div></div>`;
  } else {
    steps = { readSec:0, audio:item.audioFile, prepSec:45, speakSec:60 };
    top = `<div class="practice-prompt">${toeicEsc(item.q)}</div>
      <p class="toeic-note">Escucharás la pregunta, tendrás 45 segundos para prepararte y 60 segundos para dar tu opinión con razones y ejemplos.</p>`;
    after = `<div class="feedback show ok"><div class="fb-head">${OK_ICON}<span>Ejemplo de respuesta</span></div><p class="fb-explain">${toeicEsc(item.sample)}</p>
      <ul class="checklist"><li>Diste tu opinión clara al principio.</li><li>Diste al menos dos razones.</li><li>Incluiste un ejemplo concreto.</li><li>Cerraste repitiendo tu opinión.</li></ul></div>`;
  }

  card.innerHTML = `
    <div class="practice-instruction">${TOEIC_PART_LABEL[item.kind]}</div>
    ${top}
    <div class="toeic-timer" id="tmr" aria-live="polite"><span class="toeic-timer-label" id="tmrLabel">Cuando estés listo, empieza.</span><span class="toeic-timer-num" id="tmrNum"></span></div>
    <div class="speak-actions" id="stageActions">
      <button class="btn btn-primary btn-sm" id="startBtn">${MIC_ICON} Empezar</button>
    </div>
    <div id="compareRow" class="compare-row"></div>
    <div id="afterBox" hidden>${after}</div>
    <div class="next-row" id="nextRow">
      <button class="btn btn-ghost btn-sm" id="redoBtn" style="display:none;">↺ Repetir esta tarea</button>
      <button class="btn btn-primary btn-sm" id="skipNextBtn">${nextLabel}</button>
    </div>`;

  const tmrLabel = card.querySelector('#tmrLabel');
  const tmrNum = card.querySelector('#tmrNum');
  const tmr = card.querySelector('#tmr');
  const stageActions = card.querySelector('#stageActions');
  const compareRow = card.querySelector('#compareRow');
  const afterBox = card.querySelector('#afterBox');
  let timer = null, audio = null, stream = null, recorder = null, chunks = [], cancelled = false, stageDone = null;

  function cleanup(){
    cancelled = true;
    if(timer){ clearInterval(timer); timer = null; }
    if(audio){ try{ audio.pause(); }catch(e){} audio = null; }
    if(recorder && recorder.state === 'recording'){ try{ recorder.stop(); }catch(e){} }
    if(stream){ stream.getTracks().forEach(t=>t.stop()); stream = null; }
  }
  container._toeicCleanup = cleanup;

  function countdown(seconds, label, cls, extraBtnHtml){
    return new Promise(resolve=>{
      if(cancelled) return;
      let left = seconds;
      tmr.className = 'toeic-timer ' + cls;
      tmrLabel.textContent = label;
      tmrNum.textContent = left + ' s';
      stageActions.innerHTML = extraBtnHtml || '';
      stageDone = ()=>{ if(timer){ clearInterval(timer); timer = null; } stageDone = null; resolve(); };
      const early = stageActions.querySelector('[data-early]');
      if(early) early.addEventListener('click', ()=>{ if(stageDone) stageDone(); });
      timer = setInterval(()=>{
        left--;
        tmrNum.textContent = left + ' s';
        if(left <= 0 && stageDone) stageDone();
      }, 1000);
    });
  }
  function playPrompt(src){
    return new Promise(resolve=>{
      if(cancelled || !src) return resolve();
      tmr.className = 'toeic-timer listen';
      tmrLabel.textContent = 'Escucha la pregunta...';
      tmrNum.textContent = '';
      stageActions.innerHTML = '';
      audio = new Audio(src);
      let done = false;
      const end = ()=>{ if(done) return; done = true; resolve(); };
      audio.addEventListener('ended', end, { once:true });
      audio.addEventListener('error', ()=>{ compareRow.innerHTML = '<p class="audio-missing-note">No se pudo reproducir el audio de la pregunta. Léela en pantalla y continúa.</p>'; end(); }, { once:true });
      const p = audio.play();
      if(p && p.catch) p.catch(()=>{ compareRow.innerHTML = '<p class="audio-missing-note">No se pudo reproducir el audio de la pregunta. Léela en pantalla y continúa.</p>'; end(); });
    });
  }

  async function run(){
    cancelled = false;
    compareRow.innerHTML = '';
    afterBox.hidden = true;
    card.querySelector('#redoBtn').style.display = 'none';
    // Pedimos el micrófono al principio, para no interrumpir con el permiso a la mitad.
    const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    if(canRecord && !stream){
      try{ stream = await navigator.mediaDevices.getUserMedia({ audio:true }); }catch(e){ stream = null; }
    }
    if(steps.readSec) await countdown(steps.readSec, 'Lee la información', 'prep', '<button class="btn btn-ghost btn-sm" data-early>Ya terminé de leer</button>');
    if(cancelled) return;
    await playPrompt(steps.audio);
    if(cancelled) return;
    await countdown(steps.prepSec, 'Preparación', 'prep', steps.prepSec > 5 ? '<button class="btn btn-ghost btn-sm" data-early>Estoy listo</button>' : '');
    if(cancelled) return;
    if(stream){
      chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = ()=>{
        if(!chunks.length) return;
        const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        compareRow.innerHTML = `<div class="compare-col"><div class="compare-label">Tu respuesta</div><audio controls src="${url}"></audio></div>`;
      };
      recorder.start();
    }
    await countdown(steps.speakSec, stream ? 'Habla ahora ● Grabando' : 'Habla ahora', 'speak', '<button class="btn btn-ghost btn-sm" data-early>Terminé</button>');
    if(cancelled) return;
    if(recorder && recorder.state === 'recording') recorder.stop();
    if(!stream) compareRow.innerHTML = '<p class="audio-missing-note">No pudimos usar el micrófono, pero puedes practicar en voz alta igual. Revisa los permisos del navegador si quieres escuchar tu grabación.</p>';
    tmr.className = 'toeic-timer done';
    tmrLabel.textContent = 'Tiempo terminado. Escucha tu respuesta y compárala con el ejemplo.';
    tmrNum.textContent = '';
    stageActions.innerHTML = '';
    afterBox.hidden = false;
    const model = afterBox.querySelector('[data-model]');
    if(model) model.onclick = function(){ playAudioFile(item.audioFile, card, this); };
    card.querySelector('#redoBtn').style.display = 'inline-flex';
  }

  card.querySelector('#startBtn').addEventListener('click', run);
  card.querySelector('#redoBtn').addEventListener('click', ()=>{ cleanup(); cancelled = false; run(); });
  card.querySelector('#skipNextBtn').addEventListener('click', ()=>{
    cleanup();
    results.push({ itemId:item.id, isCorrect:null });
    next();
  });
}

/* ---------- WRITING ---------- */
function toeicDraftKey(id){ return 'leo_toeic_draft_' + id; }
function toeicWordCount(s){ return (s.trim().match(/[A-Za-z0-9'’-]+/g) || []).length; }

function renderToeicWritingItem({ card, item, results, next, nextLabel, retry }){
  if(item.kind === 'ws'){
    card.innerHTML = `
      <div class="practice-instruction">${TOEIC_PART_LABEL.ws}</div>
      <div class="practice-prompt">Escribe UNA oración en inglés sobre esta escena. Debes usar las dos palabras o frases de abajo (puedes cambiar su forma, por ejemplo load → loading).</div>
      <div class="reading-passage"><p>${toeicEsc(item.scene)}</p></div>
      <div class="toeic-words">${item.words.map(w=>`<span class="word-chip">${toeicEsc(w)}</span>`).join('')}</div>
      <textarea id="writingInput" rows="2" class="writing-area" placeholder="Escribe tu oración aquí..."></textarea>
      <div class="next-row" style="justify-content:flex-start;"><button class="btn btn-primary btn-sm" id="checkBtn">Revisar</button></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const input = card.querySelector('#writingInput');
    try{ input.value = localStorage.getItem(toeicDraftKey(item.id)) || ''; }catch(e){}
    input.addEventListener('input', ()=>{ try{ localStorage.setItem(toeicDraftKey(item.id), input.value); }catch(e){} });
    card.querySelector('#checkBtn').addEventListener('click', function(){
      const text = input.value.trim();
      if(!text){ input.focus(); return; }
      const lower = ' ' + text.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ') + ' ';
      const checks = item.words.map(w=>{
        const wl = w.toLowerCase();
        const found = wl.indexOf(' ') !== -1 ? lower.indexOf(' ' + wl + ' ') !== -1 : new RegExp('\\b' + wl.replace(/[^a-z]/g,'') + '[a-z]*\\b').test(lower);
        return { w, found };
      });
      const enoughWords = toeicWordCount(text) >= 5;
      const isCorrect = checks.every(c=>c.found) && enoughWords;
      this.disabled = true;
      input.readOnly = true;
      const fb = card.querySelector('#fb');
      fb.classList.add('show');
      fb.classList.toggle('ok', isCorrect);
      fb.classList.toggle('bad', !isCorrect);
      fb.innerHTML = `
        <div class="fb-head">${isCorrect ? OK_ICON : BAD_ICON}<span>${isCorrect ? 'Usaste las dos palabras' : 'Revisa tu oración'}</span></div>
        <ul class="checklist">
          ${checks.map(c=>`<li>${c.found ? '✓' : '✗'} Usaste <strong>${toeicEsc(c.w)}</strong></li>`).join('')}
          <li>${enoughWords ? '✓' : '✗'} Escribiste una oración completa (al menos 5 palabras)</li>
          <li>Revisa tú mismo: ¿la oración describe la escena y la gramática es correcta?</li>
        </ul>
        <div class="examples-block"><div class="examples-label">Ejemplo</div><div class="example-pair"><div class="example-en">${toeicEsc(item.example)}</div></div></div>`;
      results.push({ itemId:item.id, isCorrect });
      showRetryOrNextButtons(card, isCorrect, ()=>{ try{ localStorage.removeItem(toeicDraftKey(item.id)); }catch(e){} retry(); }, next, nextLabel);
    });
    return;
  }

  const isEmail = item.kind === 'we';
  const goal = isEmail ? 'Tiempo sugerido: 10 minutos · Extensión sugerida: 80 a 150 palabras' : 'Tiempo sugerido: 30 minutos · Extensión sugerida: al menos 300 palabras';
  card.innerHTML = `
    <div class="practice-instruction">${TOEIC_PART_LABEL[item.kind]}</div>
    ${isEmail ? `
      <div class="toeic-email">
        <div><strong>From:</strong> ${toeicEsc(item.sender)}</div>
        <div><strong>Subject:</strong> ${toeicEsc(item.subject)}</div>
        <div class="toeic-email-body">${toeicNl(item.body)}</div>
      </div>
      <div class="practice-prompt" style="margin-top:14px;">${toeicEsc(item.task)}</div>` : `
      <div class="practice-prompt">${toeicEsc(item.q)}</div>`}
    <p class="toeic-note">${goal}</p>
    <textarea id="writingInput" rows="${isEmail ? 8 : 14}" class="writing-area" placeholder="Escribe tu respuesta en inglés aquí..."></textarea>
    <div class="toeic-writing-meta"><span id="wordCount">0 palabras</span><span id="writeTimer"></span></div>
    <div class="next-row" style="justify-content:flex-start;"><button class="btn btn-primary btn-sm" id="reviewBtn">Ver ejemplo y checklist</button></div>
    <div class="feedback" id="fb"></div>
    <div class="next-row" id="nextRow"></div>`;
  const input = card.querySelector('#writingInput');
  const wc = card.querySelector('#wordCount');
  const wt = card.querySelector('#writeTimer');
  try{ input.value = localStorage.getItem(toeicDraftKey(item.id)) || ''; }catch(e){}
  const updateCount = ()=>{ wc.textContent = toeicWordCount(input.value) + ' palabras'; };
  updateCount();
  let startTs = null, tick = null;
  input.addEventListener('input', ()=>{
    updateCount();
    try{ localStorage.setItem(toeicDraftKey(item.id), input.value); }catch(e){}
    if(!startTs){
      startTs = Date.now();
      tick = setInterval(()=>{
        if(!document.body.contains(wt)){ clearInterval(tick); return; }
        const s = Math.floor((Date.now() - startTs) / 1000);
        wt.textContent = 'Tiempo: ' + Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
      }, 1000);
    }
  });
  card.querySelector('#reviewBtn').addEventListener('click', function(){
    this.disabled = true;
    if(tick) clearInterval(tick);
    const fb = card.querySelector('#fb');
    fb.classList.add('show','ok');
    fb.innerHTML = `
      <div class="fb-head">${OK_ICON}<span>Compara tu respuesta con este ejemplo</span></div>
      <div class="examples-block"><div class="examples-label">Ejemplo</div><div class="example-pair"><div class="example-en" style="white-space:pre-line;">${toeicEsc(item.example)}</div></div></div>
      <ul class="checklist">${item.checklist.map(c=>`<li>${toeicEsc(c)}</li>`).join('')}</ul>`;
    results.push({ itemId:item.id, isCorrect:null });
    showNextButton(card, nextLabel, ()=>{ try{ localStorage.removeItem(toeicDraftKey(item.id)); }catch(e){} next(); });
  });
}

function startToeicSection(key, container, onExit){
  runToeicSession({ container, onExit, section:key });
}
