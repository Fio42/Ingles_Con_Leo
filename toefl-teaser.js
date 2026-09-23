/* ============================================================
   Inglés con Leo — Muestra gratis de la preparación para el TOEFL
   (practica.html, visitantes sin cuenta). NO guarda progreso ni usa
   loadInflightSession/saveInflightSession (no es una sesión de
   Miembros, es solo un adelanto de 5 preguntas fijas seguido de una
   invitación a hacerse miembro). Reutiliza contenido y audio que YA
   existen en toefl-data.js/audio/toefl, así que no requiere generar
   ningún audio nuevo.
   ============================================================ */
function renderToeflTeaser(container){
  if(!container) return;
  if(typeof TOEFL_READING === 'undefined' || typeof TOEFL_LISTENING === 'undefined'){
    container.hidden = true;
    return;
  }

  // 5 preguntas fijas con variedad de tipo (3 de Reading, 2 de
  // Listening, una de ellas con conversación de 2 voces) para que se
  // note la variedad real de la preparación completa.
  const TEASER_ITEMS = [
    { kind:'reading', label:'Complete the Words', item: TOEFL_READING.completeWords[0] },
    { kind:'listening', label:'Choose the Best Response', item: TOEFL_LISTENING.chooseResponse[0] },
    { kind:'reading', label:'Read in Daily Life', item: TOEFL_READING.dailyLife[0] },
    { kind:'listening', label:'Listen to a Conversation', item: TOEFL_LISTENING.conversation[0] },
    { kind:'reading', label:'Read an Academic Passage', item: TOEFL_READING.academic[0] }
  ];
  let idx = 0;

  function renderStep(){
    const step = TEASER_ITEMS[idx];
    const item = step.item;
    const isLast = idx === TEASER_ITEMS.length - 1;
    const nextLabel = isLast ? 'Ver más →' : 'Siguiente pregunta →';

    if(step.kind === 'reading' && item.title){
      // dailyLife / academic: tienen título + texto + pregunta aparte.
      container.innerHTML = `
        <span class="practice-level-tag">Preparación TOEFL · Pregunta ${idx+1} de ${TEASER_ITEMS.length}</span>
        <div class="practice-instruction">${step.label}</div>
        <div class="reading-passage"><h4>${item.title}</h4><p>${item.text}</p></div>
        <div class="practice-prompt" style="margin-top:16px;">${item.question}</div>
        <div class="option-list" id="teaserOptList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireOptions(item.options, item.correct, item.explain, nextLabel);
    } else if(step.kind === 'reading'){
      // completeWords: una sola oración con hueco.
      container.innerHTML = `
        <span class="practice-level-tag">Preparación TOEFL · Pregunta ${idx+1} de ${TEASER_ITEMS.length}</span>
        <div class="practice-instruction">${step.label}</div>
        <div class="practice-prompt">${item.sentence}</div>
        <div class="option-list" id="teaserOptList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      wireOptions(item.options, item.correct, item.explain, nextLabel);
    } else {
      // listening: chooseResponse / conversation, ambas con audioFile + question + options.
      container.innerHTML = `
        <span class="practice-level-tag">Preparación TOEFL · Pregunta ${idx+1} de ${TEASER_ITEMS.length}</span>
        <div class="practice-instruction">${step.label}</div>
        <div class="listen-row"><button class="btn btn-primary btn-sm" id="teaserPlayBtn">${PLAY_ICON} Reproducir</button></div>
        <div class="practice-prompt" style="font-size:1.05rem;">${item.question}</div>
        <div class="option-list" id="teaserOptList"></div>
        <div class="feedback" id="fb"></div>
        <div class="next-row" id="nextRow"></div>`;
      container.querySelector('#teaserPlayBtn').addEventListener('click', function(){ playAudioFile(item.audioFile, container, this); });
      wireOptions(item.options, item.correct, item.explain, nextLabel);
    }

    function wireOptions(options, correct, explain, label){
      const list = container.querySelector('#teaserOptList');
      const { options: opts, correct: correctIdx } = shuffleOptions(options, correct);
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
          renderFeedback(container, isCorrect, explain);
          showNextButton(container, label, ()=>{
            idx++;
            if(idx < TEASER_ITEMS.length) renderStep(); else renderHook();
          });
        });
        list.appendChild(b);
      });
    }
  }

  function renderHook(){
    if(typeof stopActiveAudioFile === 'function') stopActiveAudioFile();
    container.innerHTML = `
      <span class="practice-level-tag">Preparación TOEFL</span>
      <h3 style="margin-top:4px;">¿Te gustaría practicarlo a fondo?</h3>
      <p style="color:var(--ink-soft);">Esto fue solo un adelanto. Como miembro tienes práctica completa de Reading, Listening, Speaking y Writing con el formato real del TOEFL, además de preparación para IELTS y Cambridge English (B2 First y C1 Advanced).</p>
      <a href="miembros.html" class="btn btn-primary" style="width:fit-content;margin-top:6px;">Hazte miembro por $2 USD/mes <span aria-hidden="true">→</span></a>
      <p class="practice-members-price">Cancela cuando quieras</p>`;
  }

  renderStep();
}
