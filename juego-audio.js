/* ============================================================
   Inglés con Leo — juego-audio.js (English Rush)
   Sonido del juego: efectos cortos (acierto, error, subir de nivel,
   fin de partida) + una música de fondo suave tipo "8-bit", todo
   generado en el momento con Web Audio API. No usa archivos MP3,
   así que no depende de que Leo genere audios para esto.

   Se puede apagar en cualquier momento con el botón de sonido
   (altavoz) que aparece en la tarjeta del juego. La preferencia
   queda guardada en este navegador (localStorage), así que si un
   jugador lo apaga, se lo va a encontrar apagado la próxima vez.

   Cómo ajustar:
   - Volumen general: MUSIC_VOLUME / SFX_VOLUME abajo.
   - Notas de la música de fondo: BASS_PATTERN / BASS_FREQS abajo.
   - Si algún sonido molesta o quieres quitarlo, comenta la línea
     donde se llama (por ejemplo RushAudio.playWrong()) en juego.js.
   ============================================================ */

const RushAudio = (function(){
  const STORAGE_KEY = 'leo_rush_sound';
  const MUSIC_VOLUME = 0.05;
  const SFX_VOLUME = 0.16;

  let audioCtx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let supported = true;
  let enabled = loadEnabled();

  let musicPlaying = false;
  let musicTimerId = null;
  let nextNoteTime = 0;
  let stepIndex = 0;

  // Bajo suave tipo videojuego retro, escala pentatónica (C menor).
  const BASS_FREQS = [130.81, 155.56, 174.61, 196.00, 233.08]; // C3 Eb3 F3 G3 Bb3
  const BASS_PATTERN = [0, 0, 2, 0, 3, 2, 1, 0];
  const STEP_SECONDS = 0.24;
  const SCHEDULE_AHEAD = 0.12;
  const LOOKAHEAD_MS = 40;

  function loadEnabled(){
    try{
      const v = localStorage.getItem(STORAGE_KEY);
      return v !== 'off';
    }catch(e){
      return true;
    }
  }

  function saveEnabled(v){
    try{ localStorage.setItem(STORAGE_KEY, v ? 'on' : 'off'); }catch(e){}
  }

  function ensureCtx(){
    if(audioCtx || !supported) return;
    try{
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if(!Ctor){ supported = false; return; }
      audioCtx = new Ctor();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(audioCtx.destination);
      musicGain = audioCtx.createGain();
      musicGain.gain.value = MUSIC_VOLUME;
      musicGain.connect(masterGain);
      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = SFX_VOLUME;
      sfxGain.connect(masterGain);
    }catch(e){
      supported = false;
    }
  }

  function unlock(){
    if(!enabled) return;
    ensureCtx();
    if(audioCtx && audioCtx.state === 'suspended'){
      audioCtx.resume().catch(()=>{});
    }
  }

  function playTone(freq, startTime, duration, type, dest, peakVol, glideTo){
    if(!audioCtx || !dest) return;
    try{
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      if(glideTo){
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, glideTo), startTime + duration);
      }
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakVol, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.03);
    }catch(e){ /* ignora fallos puntuales de audio */ }
  }

  function playSfxSequence(notes, type, peakVol){
    if(!enabled || !supported) return;
    ensureCtx();
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    const now = audioCtx.currentTime;
    notes.forEach(n => {
      playTone(n.freq, now + n.at, n.dur, type, sfxGain, peakVol, n.glideTo);
    });
  }

  /* ---------- Música de fondo (loop suave) ---------- */
  function scheduler(){
    if(!audioCtx) return;
    while(nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD){
      const freq = BASS_FREQS[BASS_PATTERN[stepIndex % BASS_PATTERN.length]];
      playTone(freq, nextNoteTime, STEP_SECONDS * 0.85, 'triangle', musicGain, MUSIC_VOLUME);
      nextNoteTime += STEP_SECONDS;
      stepIndex++;
    }
    musicTimerId = setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function startMusic(){
    if(!enabled || !supported || musicPlaying) return;
    ensureCtx();
    if(!audioCtx) return;
    if(audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    musicPlaying = true;
    stepIndex = 0;
    nextNoteTime = audioCtx.currentTime + 0.05;
    scheduler();
  }

  function stopMusic(){
    musicPlaying = false;
    if(musicTimerId){ clearTimeout(musicTimerId); musicTimerId = null; }
  }

  /* ---------- Efectos ---------- */
  function playCorrect(){
    playSfxSequence([
      { freq: 523.25, at: 0, dur: 0.09 },   // C5
      { freq: 659.25, at: 0.07, dur: 0.14 } // E5
    ], 'triangle', SFX_VOLUME);
  }

  function playWrong(){
    playSfxSequence([
      { freq: 180, at: 0, dur: 0.22, glideTo: 90 }
    ], 'square', SFX_VOLUME * 0.85);
  }

  function playLevelUp(){
    playSfxSequence([
      { freq: 523.25, at: 0, dur: 0.09 },    // C5
      { freq: 659.25, at: 0.08, dur: 0.09 }, // E5
      { freq: 783.99, at: 0.16, dur: 0.09 }, // G5
      { freq: 1046.5, at: 0.24, dur: 0.20 }  // C6
    ], 'triangle', SFX_VOLUME);
  }

  function playGameOver(){
    playSfxSequence([
      { freq: 392.00, at: 0,    dur: 0.16 }, // G4
      { freq: 329.63, at: 0.15, dur: 0.16 }, // E4
      { freq: 261.63, at: 0.30, dur: 0.30 }  // C4
    ], 'triangle', SFX_VOLUME * 0.9);
  }

  function playClick(){
    playSfxSequence([
      { freq: 440, at: 0, dur: 0.05 }
    ], 'triangle', SFX_VOLUME * 0.6);
  }

  return {
    isEnabled(){ return enabled && supported; },
    isSupported(){ return supported; },
    setEnabled(v){
      enabled = !!v;
      saveEnabled(enabled);
      if(!enabled) stopMusic();
    },
    unlock,
    startMusic,
    stopMusic,
    playCorrect,
    playWrong,
    playLevelUp,
    playGameOver,
    playClick
  };
})();
