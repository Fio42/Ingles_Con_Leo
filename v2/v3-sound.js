/* GENERADO por tools/v2/portar_v3.py (sonidos del prototipo v3). No editar a mano. */
/* =========================================================
   Inglés con Leo 2.0 · Sonidos sintetizados (Web Audio API)
   Originales, 0 KB de archivos, sin licencias.
   Identidad sonora: marimba cálida (seno + armónico suave) en Do mayor
   pentatónico. Acierto sube, error baja sin ser castigador.
   Se desbloquea con el primer gesto del usuario (política de autoplay).
   ========================================================= */
(function(){
let ctx = null, master = null;
let enabled = true;
let VOL = 0.8; try{ const v = parseFloat(localStorage.getItem('icl.soundVol')); if(v >= 0 && v <= 1) VOL = v; }catch(e){}
try{ enabled = localStorage.getItem('icl.sound') !== 'off'; }catch(e){}

function ensure(){
  if(!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = .55 * VOL;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
  }
  if(ctx.state === 'suspended') ctx.resume();
  return ctx;
}
['pointerdown','keydown','touchstart'].forEach(ev => window.addEventListener(ev, ensure, {once:true, passive:true}));

const N = n => 440 * Math.pow(2, (n - 69) / 12); // midi -> Hz

/* Una "nota marimba": seno + parcial 4x muy corto, ataque rápido, caída exponencial */
function tone(midi, t, {dur=.25, vol=.5, type='sine', bright=.25, glide=0}={}){
  const c = ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(N(midi), t);
  if(glide) o.frequency.exponentialRampToValueAtTime(N(midi + glide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
  if(bright){
    const o2 = c.createOscillator(), g2 = c.createGain();
    o2.type = 'sine'; o2.frequency.setValueAtTime(N(midi) * 4, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(vol * bright, t + .004);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + .07);
    o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + .1);
  }
}
function noise(t, dur=.05, vol=.12, freq=2500){
  const c = ctx, len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0); for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (1 - i/len);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2; g.gain.value = vol;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start(t);
}

const SFX = {
  tap(){ const t=ctx.currentTime; noise(t,.025,.08,3200); tone(84,t,{dur:.06,vol:.12,bright:0}); },
  select(){ const t=ctx.currentTime; tone(79,t,{dur:.12,vol:.28,bright:.3}); },
  check(){ const t=ctx.currentTime; noise(t,.03,.1,1800); tone(72,t,{dur:.08,vol:.18,bright:0}); },
  correct(){ const t=ctx.currentTime; tone(76,t,{dur:.22,vol:.42}); tone(84,t+.09,{dur:.45,vol:.45}); tone(88,t+.09,{dur:.4,vol:.18,bright:0}); },
  wrong(){ const t=ctx.currentTime; tone(64,t,{dur:.2,vol:.32,type:'triangle',bright:0}); tone(60,t+.12,{dur:.38,vol:.3,type:'triangle',bright:0,glide:-1}); },
  xp(){ const t=ctx.currentTime; [88,91,96].forEach((m,i)=>tone(m,t+i*.05,{dur:.14,vol:.16,bright:.4})); },
  combo(){ const t=ctx.currentTime; [72,76,79,84,88].forEach((m,i)=>tone(m,t+i*.055,{dur:.2,vol:.3})); },
  saved(){ const t=ctx.currentTime; tone(67,t,{dur:.12,vol:.2}); tone(74,t+.08,{dur:.2,vol:.2}); },
  recovered(){ const t=ctx.currentTime; [67,72,76,79].forEach((m,i)=>tone(m,t+i*.07,{dur:.3,vol:.3})); tone(84,t+.3,{dur:.6,vol:.32}); },
  challenge(){ const t=ctx.currentTime; [72,76,79].forEach((m,i)=>tone(m,t+i*.08,{dur:.18,vol:.3})); tone(84,t+.26,{dur:.5,vol:.36}); tone(88,t+.26,{dur:.5,vol:.2,bright:0}); noise(t+.26,.15,.05,6000); },
  achievement(){ const t=ctx.currentTime; [60,64,67,72,76,79,84].forEach((m,i)=>tone(m,t+i*.06,{dur:.25,vol:.26})); [84,88,91].forEach(m=>tone(m,t+.5,{dur:1.1,vol:.2})); noise(t+.5,.4,.04,7000); },
  complete(){ const t=ctx.currentTime; const mel=[72,76,79,84,79,84,88]; const tt=[0,.11,.22,.33,.5,.6,.72];
    mel.forEach((m,i)=>tone(m,t+tt[i],{dur:i===mel.length-1?.9:.2,vol:.34})); [60,67].forEach(m=>tone(m,t+.72,{dur:1,vol:.18,bright:0})); },
  streak(){ const t=ctx.currentTime; noise(t,.35,.06,900); [67,74,79,86].forEach((m,i)=>tone(m,t+.1+i*.08,{dur:.35,vol:.28})); },
  open(){ const t=ctx.currentTime; tone(67,t,{dur:.1,vol:.18,glide:5}); },
};

function play(name){
  if(!enabled) return;
  if(!ensure() || !SFX[name]) return;
  try{ SFX[name](); }catch(e){}
}
function haptic(p){ try{ if(enabled && navigator.vibrate) navigator.vibrate(p); }catch(e){} }

window.K_SOUND = {
  play, haptic,
  get volume(){ return VOL; },
  setVolume(v){ VOL = Math.max(0, Math.min(1, +v || 0)); try{ localStorage.setItem('icl.soundVol', String(VOL)); }catch(e){} if(master) master.gain.value = .55 * VOL; },
  get enabled(){ return enabled; },
  set(v){ enabled = !!v; try{ localStorage.setItem('icl.sound', enabled ? 'on' : 'off'); }catch(e){} if(enabled) play('select'); },
  /* Voz para el audio del ejercicio: síntesis del navegador (gratis). En producción: mp3 de Edge TTS existentes. */
  speak(text, onEnd){
    try{
      const u = new SpeechSynthesisUtterance(text); u.lang='en-US'; u.rate=.9;
      const v = speechSynthesis.getVoices().find(v=>/en-US/.test(v.lang) && /(Ava|Jenny|Aria|Samantha|Google US)/i.test(v.name)) || speechSynthesis.getVoices().find(v=>/^en/.test(v.lang));
      if(v) u.voice = v;
      u.onend = onEnd || null; u.onerror = onEnd || null;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }catch(e){ onEnd && onEnd(); }
  }
};
})();
