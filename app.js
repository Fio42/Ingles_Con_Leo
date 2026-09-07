/* ============ Shared practice data ============ */
const PRACTICE_DATA = {
  facil: {
    choice: {
      prompt: "What time is it?",
      options: ["It nine o'clock.", "It is nine o'clock.", "It are nine o'clock."],
      correct: 1,
      explain: "Usamos “it is” (o “it's”) para hablar de la hora."
    },
    fill: {
      sentence: ["The", "cat", "___", "on", "the", "table", "."],
      blankIndex: 2,
      bank: ["is", "are", "am"],
      correct: "is",
      explain: "“Cat” es singular, así que va con “is”."
    },
    error: {
      wrong: "The keys are on my bag.",
      wrongWord: "on",
      right: "The keys are in my bag.",
      rightWord: "in",
      explain: "Usamos “in” para cosas que están dentro de algo, como una mochila."
    },
    vocab: [
      { word:"Breakfast", sub:"Desayuno · comida de la mañana", color:'#F5A524' },
      { word:"Neighbor", sub:"Vecino · alguien que vive cerca", color:'#3554F0' },
      { word:"Tired", sub:"Cansado · sin energía", color:'#EF5A45' }
    ]
  },
  medio: {
    choice: {
      prompt: "By the time we arrived, the movie ___.",
      options: ["already started", "had already started", "has already started"],
      correct: 1,
      explain: "El pasado perfecto (“had started”) muestra que algo pasó antes de otro momento pasado."
    },
    fill: {
      sentence: ["She", "___", "already", "eaten", "when", "I", "called", "."],
      blankIndex: 1,
      bank: ["has", "have", "had"],
      correct: "had",
      explain: "“Had eaten” = ya había comido antes de que yo llamara (pasado perfecto)."
    },
    error: {
      wrong: "I'm used to work late.",
      wrongWord: "work",
      right: "I'm used to working late.",
      rightWord: "working",
      explain: "Después de “used to” (con este significado) usamos verbo + -ing, no infinitivo."
    },
    vocab: [
      { word:"Reluctant", sub:"Reacio · con poca disposición", color:'#F5A524' },
      { word:"Overwhelmed", sub:"Abrumado · con demasiado encima", color:'#3554F0' },
      { word:"Assumption", sub:"Suposición · algo que se da por hecho", color:'#EF5A45' }
    ]
  },
  avanzado: {
    choice: {
      prompt: "Had I known, I ___ differently.",
      options: ["would act", "would have acted", "will act"],
      correct: 1,
      explain: "Condicional tipo 3: “had I known” (pasado hipotético) pide “would have + participio”."
    },
    fill: {
      sentence: ["No", "sooner", "___", "she", "arrived", "than", "it", "started", "raining", "."],
      blankIndex: 2,
      bank: ["had", "did", "has"],
      correct: "had",
      explain: "“No sooner had she arrived...” es una inversión enfática con pasado perfecto."
    },
    error: {
      wrong: "Despite of the rain, we went out.",
      wrongWord: "of",
      right: "Despite the rain, we went out.",
      rightWord: "",
      explain: "“Despite” nunca lleva “of” después; “in spite of” sí lo lleva."
    },
    vocab: [
      { word:"Ubiquitous", sub:"Omnipresente · que está en todas partes", color:'#F5A524' },
      { word:"Nuance", sub:"Matiz · diferencia sutil de significado", color:'#3554F0' },
      { word:"Contentious", sub:"Polémico · que genera desacuerdo", color:'#EF5A45' }
    ]
  }
};

const LEVEL_LABEL = { facil:'Fácil · A1–A2', medio:'Medio · B1–B2', avanzado:'Avanzado · C1+' };
const ACTIVITY_LABEL = { choice:'Seleccionar respuesta', fill:'Completar frase', error:'Elegir palabra correcta', vocab:'Vocabulario' };

const LOCK_SVG = '<svg class="mini-lock" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" stroke-width="2"/></svg>';

/* ============ Practice widget ============ */
function initPracticeWidget({ tabsEl, bodyEl, levelsEl, mode }){
  let currentLevel = 'facil';
  let currentActivity = 'choice';
  const unlockedActivities = mode === 'full' ? ['choice','fill','error','vocab'] : ['choice'];

  function showFeedback(isCorrect, text){
    const fb = document.getElementById('fb');
    if(!fb) return;
    fb.classList.add('show');
    fb.classList.toggle('ok', isCorrect);
    fb.classList.toggle('bad', !isCorrect);
    const icon = isCorrect
      ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#1FA463"/><path d="M6 10l3 3 5-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#EF5A45"/><path d="M7 7l6 6M13 7l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
    fb.innerHTML = `${icon}<span>${isCorrect ? '¡Correcto! ' : 'Casi. '}${text}</span>`;
  }

  function render(){
    const d = PRACTICE_DATA[currentLevel];
    const tagStyle = `background:var(--blue-tint);color:var(--blue-deep);`;

    if(!unlockedActivities.includes(currentActivity)){
      bodyEl.innerHTML = `
        <div class="locked-pane">
          <svg class="locked-icon" viewBox="0 0 56 56" fill="none">
            <rect x="12" y="26" width="32" height="22" rx="6" fill="#EEF1FE"/>
            <path d="M18 26v-8a10 10 0 0120 0v8" stroke="#3554F0" stroke-width="4" fill="none"/>
            <circle cx="28" cy="37" r="3.5" fill="#3554F0"/>
          </svg>
          <h3>Esta actividad es para miembros</h3>
          <p>“${ACTIVITY_LABEL[currentActivity]}” en los 3 niveles está dentro de la sección de miembros.</p>
          <a href="miembros.html" class="btn btn-primary">Entrar a miembros</a>
        </div>`;
      return;
    }

    if(currentActivity === 'choice'){
      const q = d.choice;
      bodyEl.innerHTML = `
        <span class="practice-level-tag" style="${tagStyle}">${LEVEL_LABEL[currentLevel]}</span>
        <div class="practice-prompt">${q.prompt}</div>
        <div class="option-list" id="optList"></div>
        <div class="feedback" id="fb"></div>`;
      const list = bodyEl.querySelector('#optList');
      q.options.forEach((opt,i)=>{
        const b = document.createElement('button');
        b.className='option';
        b.innerHTML = `<span class="dot"></span><span>${opt}</span>`;
        b.addEventListener('click', ()=>{
          const isCorrect = i === q.correct;
          [...list.children].forEach((el,j)=>{
            el.disabled = true;
            if(j===q.correct) el.classList.add('correct');
            if(j===i && !isCorrect) el.classList.add('incorrect');
          });
          showFeedback(isCorrect, q.explain);
        });
        list.appendChild(b);
      });
    }

    if(currentActivity === 'fill'){
      const f = d.fill;
      bodyEl.innerHTML = `
        <span class="practice-level-tag" style="${tagStyle}">${LEVEL_LABEL[currentLevel]}</span>
        <div class="practice-prompt">Completa la frase</div>
        <div class="blank-row" id="sentenceRow"></div>
        <div class="word-bank" id="bank"></div>
        <div class="feedback" id="fb"></div>`;
      const row = bodyEl.querySelector('#sentenceRow');
      f.sentence.forEach((w,i)=>{
        const span = document.createElement('span');
        if(i === f.blankIndex){
          span.className = 'blank-slot';
          span.id = 'blankSlot';
        } else {
          span.style.fontWeight = '600';
          span.style.fontSize = '1.05rem';
          span.textContent = w;
        }
        row.appendChild(span);
      });
      const bank = bodyEl.querySelector('#bank');
      f.bank.forEach(word=>{
        const chip = document.createElement('button');
        chip.className='word-chip';
        chip.textContent = word;
        chip.addEventListener('click', ()=>{
          if(chip.classList.contains('used')) return;
          [...bank.children].forEach(c=>c.classList.remove('used'));
          chip.classList.add('used');
          const slot = bodyEl.querySelector('#blankSlot');
          slot.textContent = word;
          slot.classList.add('filled');
          const isCorrect = word === f.correct;
          slot.style.borderColor = isCorrect ? '#1FA463' : '#EF5A45';
          slot.style.background = isCorrect ? '#E7F7EE' : '#FDEBE8';
          showFeedback(isCorrect, f.explain);
        });
        bank.appendChild(chip);
      });
    }

    if(currentActivity === 'error'){
      const e = d.error;
      const wrongHtml = e.wrong.split(' ').map(w=>{
        const clean = w.replace(/[.,]/g,'');
        return clean === e.wrongWord
          ? `<span style="background:#FDEBE8;color:#A32E1E;padding:2px 6px;border-radius:6px;">${w}</span>`
          : w;
      }).join(' ');
      bodyEl.innerHTML = `
        <span class="practice-level-tag" style="${tagStyle}">${LEVEL_LABEL[currentLevel]}</span>
        <div class="practice-prompt">Encuentra el error</div>
        <div style="border:2px solid var(--line);border-radius:14px;padding:16px;font-size:1.05rem;font-weight:500;">${wrongHtml}</div>
        <div style="text-align:center;margin:14px 0;color:var(--ink-faint);">↓</div>
        <button class="btn btn-primary btn-block" id="revealBtn">Ver corrección</button>
        <div class="feedback" id="fb"></div>`;
      bodyEl.querySelector('#revealBtn').addEventListener('click', function(){
        this.style.display='none';
        const rightHtml = e.right.split(' ').map(w=>{
          const clean = w.replace(/[.,]/g,'');
          return (e.rightWord && clean === e.rightWord)
            ? `<span style="background:#E7F7EE;color:#116B41;padding:2px 6px;border-radius:6px;">${w}</span>`
            : w;
        }).join(' ');
        const box = document.createElement('div');
        box.style.cssText = 'border:2px solid #1FA463;background:#E7F7EE;border-radius:14px;padding:16px;font-size:1.05rem;font-weight:500;margin-top:12px;';
        box.innerHTML = rightHtml;
        this.after(box);
        showFeedback(true, e.explain);
      });
    }

    if(currentActivity === 'vocab'){
      const v = d.vocab;
      bodyEl.innerHTML = `
        <span class="practice-level-tag" style="${tagStyle}">${LEVEL_LABEL[currentLevel]}</span>
        <div class="practice-prompt">Vocabulario del nivel</div>
        <div id="vocabList"></div>`;
      const list = bodyEl.querySelector('#vocabList');
      v.forEach(item=>{
        const card = document.createElement('div');
        card.className = 'vocab-card';
        card.innerHTML = `
          <svg class="vocab-icon" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" fill="${item.color}22"/>
            <circle cx="28" cy="28" r="10" fill="${item.color}"/>
          </svg>
          <div>
            <div class="vocab-word">${item.word}</div>
            <div class="vocab-sub">${item.sub}</div>
          </div>`;
        list.appendChild(card);
      });
    }
  }

  levelsEl.querySelectorAll('.level-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      levelsEl.querySelectorAll('.level-card').forEach(c=>c.setAttribute('aria-pressed','false'));
      card.setAttribute('aria-pressed','true');
      currentLevel = card.dataset.level;
      render();
    });
  });

  tabsEl.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabsEl.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentActivity = btn.dataset.activity;
      render();
    });
  });

  render();
}

/* ============ Access gate for members area ============ */
const ACCESS_CODE = "LEO2026"; // <-- cambia este código cuando quieras
function initAccessGate({ gateEl, contentEl, inputEl, btnEl, errorEl }){
  function unlock(){
    gateEl.style.display = 'none';
    contentEl.style.display = 'block';
    sessionStorage.setItem('leo_member_unlocked', '1');
  }
  if(sessionStorage.getItem('leo_member_unlocked') === '1'){
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
  inputEl.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') btnEl.click();
  });
  return false;
}
