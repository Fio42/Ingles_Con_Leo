/* Reglas y reporte de MICROTEMAS (sin dependencias; solo lectura).
   La usan tools/tests/micros.test.js y tools/micros-report.js.

   Modelo:  familia -> tema -> microtema -> ejercicios -> recurso -> comprobación
   - temas.js: cada tema declara sus `micros` (con su recurso opcional) y, si absorbe a otros
     temas antiguos, `merges`.
   - data.js: cada ejercicio solo dice `micro:'<id>'`. Práctica = GRAMMAR_BANK;
     comprobación = GRAMMAR_CHECK_BANK (banco aparte).
   Progresivo: un microtema DECLARADO solo debe ser coherente; uno con `active:true` además
   debe cumplir las reglas de ACTIVE. Los ejercicios sin `micro` siguen como siempre. */
const fs = require('fs'), vm = require('vm'), path = require('path');

const ACTIVE = { MIN_PRACTICE: 6, MIN_CHECK: 6, MIN_TYPES: 2, MAX_SIMILARITY: 0.8 };   // MIN_CHECK 6 = dos rondas inéditas de 3
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const textOf = it => norm(it.prompt != null ? it.prompt : (it.type === 'fill' && Array.isArray(it.sentence)) ? it.sentence.join(' ') : it.wrong);
function similarity(a, b){
  const A = new Set(a.split(' ').filter(w => w.length > 1)), B = new Set(b.split(' ').filter(w => w.length > 1));
  if(!A.size || !B.size) return 0;
  let inter = 0; A.forEach(w => { if(B.has(w)) inter++; });
  return inter / (A.size + B.size - inter);
}

// Carga el sitio real (data.js + temas.js) en un contexto aislado.
function loadSite(root){
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'temas.js'), 'utf8')
    + '\n;this.__s = { TEMAS, G:GRAMMAR_BANK, CHECK: typeof GRAMMAR_CHECK_BANK === \'undefined\' ? [] : GRAMMAR_CHECK_BANK };', ctx);
  const files = new Set(fs.readdirSync(root));
  const glossaryOk = slug => fs.existsSync(path.join(root, 'glosario', slug, 'index.html'));
  let lock = { ids: [] };
  try{ lock = JSON.parse(fs.readFileSync(path.join(root, 'tools', 'tests', 'micro-ids.lock.json'), 'utf8')); }catch(e){}
  const articleHas = (file, anchor) => { try{ return fs.readFileSync(path.join(root, file), 'utf8').indexOf('id="' + anchor + '"') !== -1; }catch(e){ return false; } };
  return buildSite({ TEMAS: ctx.__s.TEMAS, G: ctx.__s.G, CHECK: ctx.__s.CHECK, files, glossaryOk, articleHas, lock });
}

// Arma los índices a partir de datos (también sirve para casos de prueba pequeños).
function buildSite({ TEMAS, G, CHECK, files, glossaryOk, articleHas, lock }){
  const temaById = {}, temaByTopic = {}, microById = {}, mergedInto = {};
  TEMAS.forEach(t => { temaById[t.id] = t; (t.topics || []).forEach(tp => { temaByTopic[tp] = t; }); });
  const dupMicroIds = [];
  TEMAS.forEach(t => (t.micros || []).forEach(m => {
    if(microById[m.id]) dupMicroIds.push(m.id);
    microById[m.id] = Object.assign({}, m, { tema: t.id });
  }));
  TEMAS.forEach(t => (t.merges || []).forEach(id => { mergedInto[id] = t.id; }));
  const practice = [];
  Object.keys(G || {}).forEach(level => G[level].forEach(variant => variant.forEach(block => block.items.forEach(item => {
    practice.push({ level, topic: block.topic, item });
  }))));
  return { TEMAS, temaById, temaByTopic, microById, mergedInto, dupMicroIds, practice, check: CHECK || [], files: files || new Set(), glossaryOk: glossaryOk || (() => true), articleHas: articleHas || (() => true), lock: lock || { ids: [] } };
}

const canonical = (site, id) => site.mergedInto[id] || id;

function resourcesOf(site, microId){
  const m = site.microById[microId];
  if(!m) return null;
  const t = site.temaById[m.tema];
  return { lesson: m.lesson || (t.article ? { article: t.article } : null), glossary: m.glossary || t.glossary || null };
}

// ¿Qué tiene cada microtema? (insumo del reporte y de las reglas ACTIVE)
function microStats(site){
  const out = {};
  Object.keys(site.microById).forEach(id => { out[id] = { practice: [], check: [] }; });
  site.practice.forEach(r => { if(r.item.micro && out[r.item.micro]) out[r.item.micro].practice.push(r); });
  site.check.forEach(it => { if(it && it.micro && out[it.micro]) out[it.micro].check.push(it); });
  return out;
}

// Todas las violaciones, como textos. Vacío = todo en regla.
function validate(site){
  const errs = [];
  const err = m => errs.push(m);
  const stats = microStats(site);

  // ---- DECLARADOS: coherencia (aplica a todos, activos o no) ----
  site.dupMicroIds.forEach(id => err('microtema repetido: ' + id));
  Object.keys(site.microById).forEach(id => {
    const m = site.microById[id];
    if(!ID_RE.test(id)) err(id + ': el id debe ser kebab-case en minúsculas');
    if(site.temaById[id]) err(id + ': no puede llamarse igual que un tema');
    (m.prereq || []).forEach(p => {
      if(!site.microById[p]) err(id + ': prereq inexistente ' + p);
      else if(site.microById[p].tema !== m.tema) err(id + ': su prereq ' + p + ' es de otro tema');
      else if(p === id) err(id + ' se pide a sí mismo');
    });
    const visit = (cur, trail) => {
      if(trail.indexOf(cur) !== -1){ err('ciclo de prerrequisitos: ' + trail.concat(cur).join(' > ')); return; }
      ((site.microById[cur] || {}).prereq || []).forEach(p => { if(site.microById[p]) visit(p, trail.concat(cur)); });
    };
    visit(id, []);
    if(m.lesson){
      if(!m.lesson.article || !site.files.has(m.lesson.article)) err(id + ': la clase ' + (m.lesson.article || '(vacía)') + ' no existe');
      else if(m.lesson.anchor && !site.articleHas(m.lesson.article, m.lesson.anchor)) err(id + ': la clase ' + m.lesson.article + ' no tiene la sección id="' + m.lesson.anchor + '"');
    }
    if(m.glossary && !site.glossaryOk(m.glossary)) err(id + ': no existe /glosario/' + m.glossary + '/');
  });
  site.TEMAS.forEach(t => (t.merges || []).forEach(old => {
    if(!site.temaById[old]) err(t.id + ' absorbe un tema que no existe: ' + old);
    else if(old === t.id) err(t.id + ' se absorbe a sí mismo');
    else if((site.temaById[old].merges || []).length) err(old + ' absorbe temas y a la vez es absorbido por ' + t.id + ' (sin cadenas)');
  }));
  const mergers = {};
  site.TEMAS.forEach(t => (t.merges || []).forEach(old => { (mergers[old] = mergers[old] || []).push(t.id); }));
  Object.keys(mergers).forEach(old => { if(mergers[old].length > 1) err(old + ' lo absorben varios temas: ' + mergers[old].join(', ')); });

  // ---- EJERCICIOS: referencian un microtema que existe y pertenece a su tema ----
  const seenIds = {};
  site.practice.forEach(({ topic, item }) => {
    seenIds[item.id] = 'práctica';
    if(!item.micro) return;                                    // sin migrar: comportamiento de siempre
    const m = site.microById[item.micro];
    if(!m){ err(item.id + ': micro "' + item.micro + '" no está declarado en temas.js'); return; }
    const t = site.temaByTopic[topic];
    if(!t){ err(item.id + ': tiene micro pero su bloque "' + topic + '" no pertenece a ningún tema'); return; }
    if(canonical(site, t.id) !== m.tema) err(item.id + ': el micro "' + item.micro + '" es del tema ' + m.tema + ' pero el bloque "' + topic + '" es de ' + t.id);
  });
  site.check.forEach(it => {
    if(!it || !it.id){ err('hay un ejercicio de comprobación sin id'); return; }
    if(seenIds[it.id]) err(it.id + ': está en práctica Y en comprobación (la comprobación no puede haber salido como práctica)');
    seenIds[it.id] = 'comprobación';
    if(!it.micro) err(it.id + ': la comprobación necesita micro');
    else if(!site.microById[it.micro]) err(it.id + ': micro "' + it.micro + '" no está declarado en temas.js');
    if(['choice', 'fill', 'error'].indexOf(it.type) === -1) err(it.id + ': tipo inválido ' + it.type);
    if(!it.explain) err(it.id + ': sin explain');
  });
  // la comprobación no puede repetir palabra por palabra NINGÚN ejercicio de práctica (de cualquier microtema)
  const practiceTexts = {};
  site.practice.forEach(({ item }) => { practiceTexts[textOf(item)] = item.id; });
  site.check.forEach(it => { if(it && it.id && it.type){ const hit = practiceTexts[textOf(it)]; if(hit) err(it.id + ': repite palabra por palabra a la práctica ' + hit); } });
  const checkIds = site.check.map(c => c && c.id);
  checkIds.forEach((id, i) => { if(id && checkIds.indexOf(id) !== i) err(id + ': id de comprobación repetido'); });

  // ---- ACTIVOS: lo que hace falta para recomendarlos ----
  Object.keys(site.microById).forEach(id => {
    const m = site.microById[id];
    if(!m.active) return;
    const s = stats[id];
    if(s.practice.length < ACTIVE.MIN_PRACTICE) err(id + ' (activo): ' + s.practice.length + ' ejercicios de práctica, mínimo ' + ACTIVE.MIN_PRACTICE);
    if(s.check.length < ACTIVE.MIN_CHECK) err(id + ' (activo): ' + s.check.length + ' ejercicios de comprobación, mínimo ' + ACTIVE.MIN_CHECK);
    const types = new Set(s.practice.map(r => r.item.type));
    if(types.size < ACTIVE.MIN_TYPES) err(id + ' (activo): la práctica usa ' + types.size + ' tipo(s) de ejercicio, mínimo ' + ACTIVE.MIN_TYPES);
    const res = resourcesOf(site, id);
    if(!res || (!res.lesson && !res.glossary)) err(id + ' (activo): sin recurso (ni clase ni glosario, propios ni del tema)');
    // la comprobación mide generalización: nada de repetir la práctica
    s.check.forEach(c => {
      const tc = textOf(c);
      s.practice.forEach(({ item }) => {
        const sim = similarity(tc, textOf(item));
        if(tc === textOf(item) || sim >= ACTIVE.MAX_SIMILARITY) err(id + ' (activo): la comprobación ' + c.id + ' se parece demasiado a la práctica ' + item.id + ' (' + sim.toFixed(2) + ')');
      });
    });
  });

  // ---- ESTABILIDAD DE IDS ----
  const lockIds = (site.lock && site.lock.ids) || [];
  lockIds.forEach(id => { if(!site.microById[id]) err('el microtema "' + id + '" está en micro-ids.lock.json y ya no existe: los ids no se renombran ni se borran (hay progreso asociado)'); });
  Object.keys(site.microById).forEach(id => {
    const used = site.microById[id].active || stats[id].practice.length || stats[id].check.length;
    if(used && lockIds.indexOf(id) === -1) err('el microtema "' + id + '" ya se usa pero no está en tools/tests/micro-ids.lock.json (corre: node tools/micros-report.js --lock)');
  });
  return errs;
}

// Reporte de cobertura: tema -> microtema -> ejercicios -> tipos -> comprobación -> recurso -> huecos.
function report(site){
  const stats = microStats(site);
  const rows = [];
  const gaps = (id, m) => {
    const s = stats[id], g = [];
    const res = resourcesOf(site, id);
    if(s.practice.length < ACTIVE.MIN_PRACTICE) g.push('faltan ' + (ACTIVE.MIN_PRACTICE - s.practice.length) + ' de práctica');
    if(s.check.length < ACTIVE.MIN_CHECK) g.push('faltan ' + (ACTIVE.MIN_CHECK - s.check.length) + ' de comprobación');
    if(new Set(s.practice.map(r => r.item.type)).size < ACTIVE.MIN_TYPES) g.push('1 solo tipo de ejercicio');
    if(!res || (!res.lesson && !res.glossary)) g.push('sin clase ni glosario');
    return g;
  };
  site.TEMAS.filter(t => (t.micros || []).length).forEach(t => {
    (t.micros || []).forEach(m => {
      const s = stats[m.id], res = resourcesOf(site, m.id);
      rows.push({
        tema: t.id, micro: m.id, estado: m.active ? 'ACTIVO' : 'declarado',
        practica: s.practice.length, tipos: [...new Set(s.practice.map(r => r.item.type))].join('/') || '-',
        comprobacion: s.check.length,
        clase: res && res.lesson ? (m.lesson ? 'propia' : 'del tema') : '-',
        glosario: res && res.glossary ? (m.glossary ? 'propio' : 'del tema') : '-',
        huecos: gaps(m.id, m)
      });
    });
  });
  const untagged = [];
  site.TEMAS.filter(t => (t.micros || []).length).forEach(t => {
    const owned = new Set([t.id].concat(t.merges || []));
    const n = site.practice.filter(r => !r.item.micro && site.temaByTopic[r.topic] && owned.has(site.temaByTopic[r.topic].id)).length;
    if(n) untagged.push({ tema: t.id, ejerciciosSinMicro: n });
  });
  return { rows, untagged, temasConMicros: site.TEMAS.filter(t => (t.micros || []).length).length, temasTotal: site.TEMAS.length };
}

module.exports = { ACTIVE, loadSite, buildSite, validate, report, microStats, resourcesOf, canonical, textOf, similarity };
