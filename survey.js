/* ============================================================
   Inglés con Leo — survey.js (encuesta.html)
   Encuesta corta que llega por correo a los 15 días de membresía
   (ver supabase_functions/survey-15d-email.ts). El link trae un
   token en la URL (?t=...) que identifica a la persona sin que
   tenga que iniciar sesión; lo valida el edge function
   submit-survey.ts al mandar la respuesta.

   Vanilla JS, sin dependencias. No usa LeoBackend porque esta
   página no necesita sesión iniciada.
   ============================================================ */

const SURVEY_SUPABASE_URL = 'https://iviksyhzhiygkuaojply.supabase.co';
const SURVEY_ANON_KEY = 'sb_publishable_97pvm28aLA7UCqTNV6WRUg_Bca5Y4XN';

const SURVEY_Q1_OPTIONS = [
  { value: 'muy_util', label: 'Muy útil' },
  { value: 'util', label: 'Útil' },
  { value: 'mas_o_menos', label: 'Más o menos' },
  { value: 'poco_util', label: 'Poco útil' }
];
const SURVEY_Q2_OPTIONS = [
  { value: 'practica', label: 'Práctica de ejercicios' },
  { value: 'clases', label: 'Clases interactivas' },
  { value: 'listening', label: 'Listening' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'writing', label: 'Writing' },
  { value: 'progreso', label: 'Progreso / racha' },
  { value: 'otra', label: 'Otra cosa' }
];
const SURVEY_Q3_OPTIONS = [
  { value: 'mas_ejercicios', label: 'Más ejercicios' },
  { value: 'mas_clases', label: 'Más clases interactivas' },
  { value: 'mas_listening', label: 'Más listening' },
  { value: 'mas_speaking', label: 'Más speaking' },
  { value: 'mas_juegos', label: 'Más juegos' },
  { value: 'mejor_progreso', label: 'Mejor seguimiento de progreso' },
  { value: 'conforme', label: 'Estoy conforme por ahora' }
];

(function(){
  const root = document.getElementById('surveyRoot');
  if(!root) return;

  const params = new URLSearchParams(window.location.search);
  const token = (params.get('t') || '').trim();

  if(!token){
    renderInvalid();
    return;
  }

  renderForm();

  function optionGroup(name, options){
    return options.map((opt, i) => `
      <label class="onb-level-opt survey-opt">
        <input type="radio" name="${name}" value="${opt.value}" ${i===0 ? '' : ''}>
        <span>${opt.label}</span>
      </label>`).join('');
  }

  function renderForm(){
    root.innerHTML = `
      <form class="survey-card" id="surveyForm">
        <div class="onb-field">
          <label>¿Qué tan útil te ha parecido la membresía hasta ahora?</label>
          <div class="survey-opt-list">${optionGroup('q1', SURVEY_Q1_OPTIONS)}</div>
        </div>
        <div class="onb-field">
          <label>¿Qué es lo que más has usado?</label>
          <div class="survey-opt-list">${optionGroup('q2', SURVEY_Q2_OPTIONS)}</div>
        </div>
        <div class="onb-field">
          <label>¿Qué te gustaría que mejorara o agregara primero?</label>
          <div class="survey-opt-list">${optionGroup('q3', SURVEY_Q3_OPTIONS)}</div>
        </div>
        <div class="form-field">
          <label for="surveyQ4">¿Algo que te haya gustado, molestado, o que te gustaría ver? (opcional)</label>
          <textarea id="surveyQ4" maxlength="2000" placeholder="Escribe aquí lo que quieras contarnos..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="surveySubmitBtn">Enviar mis respuestas</button>
        <p class="form-status" id="surveyStatus"></p>
      </form>`;

    root.querySelectorAll('.survey-opt').forEach(opt=>{
      const input = opt.querySelector('input');
      opt.addEventListener('click', ()=>{
        const group = root.querySelectorAll(`input[name="${input.name}"]`);
        group.forEach(i => i.closest('.survey-opt').classList.remove('checked'));
        input.checked = true;
        opt.classList.add('checked');
      });
    });

    document.getElementById('surveyForm').addEventListener('submit', onSubmit);
  }

  async function onSubmit(e){
    e.preventDefault();
    const statusEl = document.getElementById('surveyStatus');
    const btn = document.getElementById('surveySubmitBtn');
    const q1 = root.querySelector('input[name="q1"]:checked');
    const q2 = root.querySelector('input[name="q2"]:checked');
    const q3 = root.querySelector('input[name="q3"]:checked');

    if(!q1 || !q2 || !q3){
      statusEl.textContent = 'Por favor responde las 3 preguntas de arriba.';
      statusEl.className = 'form-status error';
      return;
    }

    btn.disabled = true;
    statusEl.textContent = 'Enviando...';
    statusEl.className = 'form-status';

    const q4 = document.getElementById('surveyQ4').value.trim();

    try{
      const res = await fetch(SURVEY_SUPABASE_URL + '/functions/v1/submit-survey', {
        method: 'POST',
        headers: {
          'apikey': SURVEY_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, q1: q1.value, q2: q2.value, q3: q3.value, q4 })
      });
      const data = await res.json().catch(()=> ({}));
      if(!res.ok || !data.ok){
        if(data && data.error === 'invalid_token'){
          renderInvalid();
          return;
        }
        statusEl.textContent = 'Hubo un problema al enviar. Intenta de nuevo en un momento.';
        statusEl.className = 'form-status error';
        btn.disabled = false;
        return;
      }
      renderThanks();
    }catch(err){
      statusEl.textContent = 'Hubo un problema al enviar. Intenta de nuevo en un momento.';
      statusEl.className = 'form-status error';
      btn.disabled = false;
    }
  }

  function renderThanks(){
    root.innerHTML = `
      <div class="survey-card survey-thanks">
        <h2>¡Gracias por tu tiempo! 🙌</h2>
        <p>Ya recibimos tus respuestas. Nos ayudan muchísimo a decidir qué mejorar primero en Inglés con Leo.</p>
        <a href="miembros.html" class="btn btn-primary">Volver a mi cuenta →</a>
      </div>`;
  }

  function renderInvalid(){
    root.innerHTML = `
      <div class="survey-card survey-thanks">
        <h2>Este link ya no es válido</h2>
        <p>Puede que ya hayas respondido esta encuesta, o que el link esté incompleto. Si crees que es un error, escríbenos.</p>
        <a href="index.html" class="btn btn-primary">Ir al inicio →</a>
      </div>`;
  }
})();
