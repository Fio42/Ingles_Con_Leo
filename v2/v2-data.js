/* =========================================================
   Inglés con Leo 2.0 · Datos para la interfaz (solo LECTURA)
   Reúne lo que ya existe, sin cálculos nuevos de aprendizaje:
     - Sesiones y racha: loadProgress() / computeStreak() de app.js
       (las sesiones ya sincronizadas desde progress_sessions).
     - Academia: InicioAlumno.loadServer() (academia_progress + academia_courses).
     - Insignias: academia_badges (lectura propia, RLS). Las entrega el servidor.
     - Método Leo: LeoBackend.getMistakeStats() (mistake_stats; las reglas
       2 aciertos = recuperado y 4 = dominado las aplica la base).
   Nunca escribe en la base, nunca inventa cifras: si algo no se puede
   leer, devuelve null y la pantalla muestra un estado neutro.
   ========================================================= */
(function(){
  if(!window.ICL_V2 || !window.ICL_V2.enabled) return;
  var LB = function(){ try{ return (typeof LeoBackend !== 'undefined') ? LeoBackend : null; }catch(e){ return null; } };
  var pad = function(n){ return ('0' + n).slice(-2); };
  var ymd = function(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var GOAL_KEY = 'icl.metaMin';

  /* Meta diaria en minutos: preferencia de presentación de este dispositivo (no es un dato de aprendizaje). */
  function goal(){ try{ var g = parseInt(localStorage.getItem(GOAL_KEY), 10); return [5, 10, 15, 20].indexOf(g) >= 0 ? g : 10; }catch(e){ return 10; } }
  function setGoal(g){ try{ localStorage.setItem(GOAL_KEY, String(g)); }catch(e){} }

  function sessions(){
    try{ return (typeof loadProgress === 'function' ? loadProgress().sessions : []) || []; }catch(e){ return []; }
  }
  function minutesOf(s){ return (typeof sessionMs === 'function' ? sessionMs(s) : Math.max(0, +s.durationMs || 0)) / 60000; }
  function graded(list){ var n = 0, ok = 0; list.forEach(function(s){ (s.results || []).forEach(function(r){ if(r && (r.isCorrect === true || r.isCorrect === false)){ n++; if(r.isCorrect) ok++; } }); }); return { n: n, ok: ok, pct: n ? Math.round(ok / n * 100) : null }; }

  /* Lunes de la semana de d */
  function monday(d){ var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); var k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); return x; }

  function practice(){
    var all = sessions().filter(function(s){ return s && s.skill !== 'check'; });
    var now = new Date(), today = ymd(now), mon = monday(now);
    var week = [0, 0, 0, 0, 0, 0, 0], weekDays = [0, 0, 0, 0, 0, 0, 0], todayMin = 0;
    var weekList = [], last7 = [], cut7 = new Date(now.getTime() - 7 * 86400000), weekEstimated = 0;
    all.forEach(function(s){
      var d = s.date ? new Date(s.date + 'T12:00:00') : null; if(!d) return;
      var m = minutesOf(s);
      if(s.date === today) todayMin += m;
      var idx = Math.floor((d - mon) / 86400000);
      if(idx >= 0 && idx < 7){ week[idx] += m; weekDays[idx] = 1; weekList.push(s); if(typeof sessionTimeEstimated === 'function' && sessionTimeEstimated(s)) weekEstimated++; }
      if(d >= cut7) last7.push(s);
    });
    /* Aciertos por semana (6 semanas, la última es la actual) */
    var weeks = [];
    for(var w = 5; w >= 0; w--){
      var a = new Date(mon); a.setDate(a.getDate() - w * 7); var b = new Date(a); b.setDate(b.getDate() + 7);
      var ws = all.filter(function(s){ var d = new Date(s.date + 'T12:00:00'); return d >= a && d < b; });
      weeks.push({ from: a, g: graded(ws), min: ws.reduce(function(t, s){ return t + minutesOf(s); }, 0) });
    }
    var streak = 0, streakDates = [];
    try{ streak = typeof computeStreak === 'function' ? computeStreak() : 0; streakDates = typeof computeActiveStreakDates === 'function' ? computeActiveStreakDates() : []; }catch(e){}
    var best = 0, run = 0, set = {}; all.forEach(function(s){ set[s.date] = 1; });
    Object.keys(set).sort().forEach(function(k, i, arr){
      if(i && (new Date(k + 'T12:00:00') - new Date(arr[i - 1] + 'T12:00:00')) / 86400000 === 1) run++; else run = 1;
      if(run > best) best = run;
    });
    return {
      any: all.length > 0, todayMin: Math.round(todayMin), goal: goal(), practicedToday: !!set[today],
      week: week.map(function(m){ return Math.round(m); }), weekDays: weekDays, todayIdx: (now.getDay() + 6) % 7,
      weekMin: Math.round(week.reduce(function(a, b){ return a + b; }, 0)), weekDaysCount: weekDays.reduce(function(a, b){ return a + b; }, 0),
      acc7: graded(last7), accWeek: graded(weekList), weeks: weeks, streak: streak, streakDates: streakDates, bestStreak: Math.max(best, streak),
      sessionsCount: all.length, weekEstimated: weekEstimated
    };
  }

  /* Texto legible de un ejercicio fallado (si el banco está cargado en la página) */
  var IDX = null;
  function itemLabel(id){
    if(!IDX){
      IDX = {};
      try{
        [typeof GRAMMAR_BANK !== 'undefined' ? GRAMMAR_BANK : null].forEach(function(B){
          if(!B) return;
          Object.keys(B).forEach(function(l){ (B[l] || []).forEach(function(v){ (v || []).forEach(function(t){ (t.items || []).forEach(function(it){ var t = it.prompt || it.sentence || it.question || ''; if(Array.isArray(t)) t = t.join(' ').replace(/ ([.,?!])/g, '$1'); if(!t && Array.isArray(it.tokens)) t = it.tokens.join(' '); IDX[it.id] = String(t); }); }); }); });
        });
        if(typeof VOCAB_BANK !== 'undefined') Object.keys(VOCAB_BANK).forEach(function(l){ (VOCAB_BANK[l] || []).forEach(function(v){ (v || []).forEach(function(it){ IDX[it.id] = it.word ? it.word + ' = ' + (it.translation || '') : ''; }); }); });
      }catch(e){}
    }
    var t = String(IDX[id] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return t.length > 64 ? t.slice(0, 61) + '...' : t;
  }

  function mistakes(){
    var lb = LB(); if(!lb || !lb.getMistakeStats) return Promise.resolve(null);
    return Promise.resolve(lb.getMistakeStats()).then(function(rows){
      if(!Array.isArray(rows)) return null;
      var by = { active: [], recovered: [], mastered: [] };
      rows.forEach(function(r){ (by[r.status] || by.active).push({ id: r.item_id, topic: r.topic || 'Práctica', streak: r.correct_streak | 0, fails: r.fail_count | 0, kind: r.kind, recoveredAt: r.recovered_at, seen: r.last_seen_at, label: itemLabel(r.item_id) }); });
      by.active.sort(function(a, b){ return b.fails - a.fails || String(b.seen).localeCompare(String(a.seen)); });
      var weekAgo = Date.now() - 7 * 86400000;
      return { active: by.active, recovered: by.recovered, mastered: by.mastered, total: rows.length,
        recoveredWeek: rows.filter(function(r){ return r.recovered_at && new Date(r.recovered_at).getTime() >= weekAgo; }).length };
    }, function(){ return null; });
  }

  function academy(){
    try{
      if(!window.InicioAlumno) return Promise.resolve(null);
      var deps = InicioAlumno.depsFromPage(); if(!deps) return Promise.resolve(null);
      return InicioAlumno.loadServer(deps).then(function(r){ return r && r.ok ? r.courses : null; }, function(){ return null; });
    }catch(e){ return Promise.resolve(null); }
  }
  function badges(){
    var lb = LB(); if(!lb || !lb.getClient || !lb.getClient()) return Promise.resolve(null);
    return Promise.resolve(lb.getSession()).then(function(s){
      if(!s || !s.user) return null;
      return lb.getClient().from('academia_badges').select('course_id,awarded_at,score_pct').eq('user_id', s.user.id).then(function(r){ return r.error ? null : (r.data || []); });
    }).catch(function(){ return null; });
  }
  function name(){
    try{
      var p = typeof getProfile === 'function' ? getProfile() : null;
      if(p && p.name) return String(p.name).split(' ')[0];
    }catch(e){}
    var n = document.getElementById('navProfileName'); var t = n && n.textContent.trim();
    return t && t !== 'Cuenta' ? t.split(' ')[0] : '';
  }
  /* Cursos en el orden real de la ruta (ACADEMIA_CURSOS, generado desde el motor) */
  function courseOrder(){ try{ return Object.keys(ACADEMIA_CURSOS.courses); }catch(e){ return []; } }

  /* Los errores que trabaja el "Repaso rápido": mismos filtros y orden que buildMistakesPool(mode 'rapido') en app.js
     (sin lectura ni artículos, por prioridad mistakeScore, hasta QUICK_REVIEW_SIZE). Solo lectura. */
  function quickReview(active){
    var size = 10; try{ size = MISTAKE_PRIORITY.QUICK_REVIEW_SIZE || 10; }catch(e){}
    var sc = function(e){ try{ return mistakeScore({ fail_count: e.fails, last_seen_at: e.seen, correct_streak: e.streak }); }catch(err){ return e.fails; } };
    return (active || []).filter(function(e){ return e.kind !== 'reading' && e.kind !== 'article'; })
      .map(function(e){ return { e: e, s: sc(e) }; }).sort(function(a, b){ return b.s - a.s; }).slice(0, size).map(function(x){ return x.e; });
  }
  window.V2D = { quickReview: quickReview, practice: practice, mistakes: mistakes, academy: academy, badges: badges, name: name, goal: goal, setGoal: setGoal, courseOrder: courseOrder, itemLabel: itemLabel, ymd: ymd };
})();
