/* ============================================================
   Inglés con Leo — Muestra gratis de la preparación para el TOEFL
   (practica.html, visitantes sin cuenta). NO guarda progreso ni usa
   loadInflightSession/saveInflightSession (no es una sesión de
   Miembros, es solo una probadita de 2 preguntas fijas seguida de
   una invitación a hacerse miembro). Reutiliza contenido y audio que
   YA existen en toefl-data.js/audio/toefl, así que no requiere
   generar ningún audio nuevo.
   ============================================================ */
function renderToeflTeaser(container){
  if(!container) return;
  if(typeof TOEFL_READING === 'undefined' || typeof TOEFL_LISTENING === 'undefined'){
    container.hidden = true;
    return;
  }
  const readingItem = TOEFL_READING.completeWords[0];
  const listeningItem = TOEFL_LISTENING.conversation[0];

  function renderStep1(){
    container.innerHTML = `
      <span class="practice-level-tag">Muestra gratis · Preparación TOEFL</span>
      <div class="practice-instruction">Complete the Words</div>
      <div class="practice-prompt">${readingItem.sentence}</div>
      <div class="option-list" id="teaserOptList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    const list = container.querySelector('#teaserOptList');
    const { options: opts, correct: correctIdx } = shuffleOptions(readingItem.options, readingItem.correct);
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
        renderFeedback(container, isCorrect, readingItem.explain);
        showNextButton(container, 'Siguiente pregunta →', renderStep2);
      });
      list.appendChild(b);
    });
  }

  function renderStep2(){
    container.innerHTML = `
      <span class="practice-level-tag">Muestra gratis · Preparación TOEFL</span>
      <div class="practice-instruction">Listen to a Conversation</div>
      <div class="listen-row"><button class="btn btn-primary btn-sm" id="teaserPlayBtn">${PLAY_ICON} Reproducir</button></div>
      <div class="practice-prompt" style="font-size:1.05rem;">${listeningItem.question}</div>
      <div class="option-list" id="teaserOptList"></div>
      <div class="feedback" id="fb"></div>
      <div class="next-row" id="nextRow"></div>`;
    container.querySelector('#teaserPlayBtn').addEventListener('click', function(){ playAudioFile(listeningItem.audioFile, container, this); });
    const list = container.querySelector('#teaserOptList');
    const { options: opts, correct: correctIdx } = shuffleOptions(listeningItem.options, listeningItem.correct);
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
        renderFeedback(container, isCorrect, listeningItem.explain);
        showNextButton(container, 'Ver más →', renderHook);
      });
      list.appendChild(b);
    });
  }

  function renderHook(){
    if(typeof stopActiveAudioFile === 'function') stopActiveAudioFile();
    container.innerHTML = `
      <span class="practice-level-tag">Muestra gratis · Preparación TOEFL</span>
      <h3 style="margin-top:4px;">¿Te gustaría practicarlo a fondo?</h3>
      <p style="color:var(--ink-soft);">Esto fue solo una probadita. Como miembro tienes práctica completa de Reading, Listening, Speaking y Writing con el formato real del TOEFL, además de preparación para IELTS y Cambridge English (B2 First).</p>
      <a href="miembros.html" class="btn btn-primary" style="width:fit-content;margin-top:6px;">Hazte miembro por $2 USD/mes <span aria-hidden="true">→</span></a>
      <p class="practice-members-price" style="margin-top:6px;">Cancela cuando quieras</p>`;
  }

  renderStep1();
}
