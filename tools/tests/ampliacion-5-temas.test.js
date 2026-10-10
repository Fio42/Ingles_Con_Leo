#!/usr/bin/env node
/* Ampliación del refuerzo adaptativo a 5 temas (12 microtemas activos):
     Presente perfecto vs pasado simple (pp-experiencia-sin-fecha, pasado-fecha-terminada)
     Since / For                        (since-for-eleccion, since-for-presente-perfecto)
     Cuantificadores                    (much-many-contable-incontable, little-few-matiz, some-any-afirm-neg, fewer-less)
     Modales de obligación              (mustn't vs don't have to, obligación vs consejo)
     In / On / At                       (in-on-at-tiempo, in-on-at-lugar)
   Corre con:  node tools/tests/ampliacion-5-temas.test.js   (desde la carpeta inglesconLeo)

   Comprueba el contenido (reglas de un microtema activo), que lo que ya existía no cambió (ids, microtemas, tamaño del banco),
   que la comprobación está aislada, que las sesiones y el Plan conservan su tamaño, que los usuarios gratis no reciben nada
   nuevo y que el flujo error -> recomendación -> refuerzo -> comprobación funciona en cada microtema. Usa los archivos REALES. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const lib = require('../micros-lib');
const root = path.join(__dirname, '..', '..');

const store = {};
const noop = () => {};
const el = () => { let html = ''; return { style:{}, classList:{ add:noop, remove:noop, toggle:noop, contains:()=>false }, setAttribute:noop, appendChild:noop, addEventListener:noop,
  set innerHTML(v){ html = String(v); }, get innerHTML(){ return html; }, get textContent(){ return html.replace(/<[^>]*>/g, ''); } }; };
function makeCtx(){
  const ctx = {
    console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage:{ getItem:k=> k in store ? store[k] : null, setItem:(k,v)=>{ store[k] = String(v); }, removeItem:k=>{ delete store[k]; } },
    document:{ addEventListener:noop, querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, readyState:'complete', body: el(), documentElement: el(), createElement: el },
    location:{ hash:'', search:'', pathname:'/' }, navigator:{ userAgent:'node' }, addEventListener:noop,
    MutationObserver:function(){ return { observe:noop }; }, IntersectionObserver:function(){ return { observe:noop }; },
    matchMedia:()=>({ matches:false, addEventListener:noop })
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'temas.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8') + `
;this.__t = { resolveMemberPool, memberBankItems, SESSION_LENGTHS, SESSION_LENGTH_KEY, PROGRESS_KEY, MEMBERS_ONLY_VARIANT_INDEX, diagFamilyForTopic,
  computePlanSelection, buildPlanPool, getMistakesItemIndex, recordSession, loadProgress, microCheckStart, microFlowState, microStatsAll, microIsActive,
  microDiagActions, microHasItemsAt, microLessonHref, microQuickHref, microExplainLabel,
  MICRO_STATS_KEY, CHECK_SEEN_KEY, G:GRAMMAR_BANK, CHECK:GRAMMAR_CHECK_BANK, TEMA_BY_ID, MICRO_BY_ID, microResources };`, ctx);
  ctx.__t.ctx = ctx;
  return ctx.__t;
}
const T = makeCtx();
let seed = Number(process.env.AMPL_SEED || 20261010);
T.ctx.__rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
vm.runInContext('Math.random = function(){ return __rng(); };', T.ctx);
const real = lib.loadSite(root);
const plain = o => JSON.parse(JSON.stringify(o));
let passed = 0;
function test(name, fn){
  try{ Object.keys(store).forEach(k => delete store[k]); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; }
}

// microtema -> { tema, recurso esperado, familia del diagnóstico }
const MICROS = {
  'pp-experiencia-sin-fecha':          { tema:'present-perfect-vs-past', lesson:['articulo-presente-perfecto.html', 'already-yet-just'] },
  'pasado-fecha-terminada':            { tema:'present-perfect-vs-past', lesson:['articulo-presente-perfecto.html', 'vs-pasado-simple'] },
  'since-for-eleccion':                { tema:'since-for',              lesson:['articulo-presente-perfecto.html', 'for-since'] },
  'since-for-presente-perfecto':       { tema:'since-for',              lesson:['articulo-presente-perfecto.html', 'errores'] },
  'much-many-contable-incontable':     { tema:'cuantificadores',        glossary:'much-vs-many' },
  'little-few-matiz':                  { tema:'cuantificadores',        glossary:'little-vs-a-little' },
  'some-any-afirm-neg':                { tema:'cuantificadores',        glossary:'any-vs-some' },
  'fewer-less':                        { tema:'cuantificadores',        glossary:'fewer-vs-less' },
  'mustnt-vs-dont-have-to':            { tema:'modales-obligacion',     glossary:'mustnt-vs-dont-have-to' },
  'obligacion-vs-consejo':             { tema:'modales-obligacion',     glossary:'should' },
  'in-on-at-tiempo':                   { tema:'in-on-at',               lesson:['articulo-in-on-at.html', 'tiempo'] },
  'in-on-at-lugar':                    { tema:'in-on-at',               lesson:['articulo-in-on-at.html', 'lugar'] }
};
const IDS = Object.keys(MICROS);
const NEW_PRACTICE = /^g-(medio|facil)-(ppe|ppf|sfe|sfp|fl|ms|mnt|iot|iol|sa)-\d+$/;
const NEW_CHECK = /^g-chk-(ppe|ppf|sfe|sfp|mm|lf|sa|fl|mnt|ms|iot|iol)-\d+$/;
const practiceOf = micro => real.practice.filter(r => r.item.micro === micro);
const levelsOf = micro => Array.from(new Set(practiceOf(micro).map(r => r.level)));

console.log('Contenido de los 12 microtemas');
test('los 12 microtemas están activos, en su tema, y los que siguen declarados no se activaron', () => {
  IDS.forEach(id => { assert.strictEqual(real.microById[id].active, true, id); assert.strictEqual(real.microById[id].tema, MICROS[id].tema, id); assert.strictEqual(T.microIsActive(id), true, id); });
  ['cond-3-pasado-irreal', 'cond-mixto', 'a-lot-of', 'some-any-pregunta-oferta'].forEach(id => assert.ok(!real.microById[id].active, id + ' no debe estar activo'));
});

test('cada microtema: >=6 de práctica con >=2 tipos, 6 de comprobación (2 rondas de 3) y su recurso real', () => {
  const stats = lib.microStats(real);
  IDS.forEach(id => {
    assert.ok(stats[id].practice.length >= 6, id + ': práctica ' + stats[id].practice.length);
    assert.ok(new Set(stats[id].practice.map(r => r.item.type)).size >= 2, id + ': tipos');
    assert.strictEqual(stats[id].check.length, 6, id + ': comprobación');
    const res = lib.resourcesOf(real, id), want = MICROS[id];
    if(want.lesson){ assert.deepStrictEqual([res.lesson.article, res.lesson.anchor], want.lesson, id + ': clase'); }
    if(want.glossary){ assert.strictEqual(res.glossary, want.glossary, id + ': glosario'); assert.ok(fs.existsSync(path.join(root, 'glosario', want.glossary, 'index.html')), id + ': el glosario existe'); }
  });
});

test('las reglas de microtemas activos pasan completas (comprobación distinta a la práctica, ids bloqueados)', () => {
  assert.deepStrictEqual(lib.validate(real), []);
  IDS.forEach(id => assert.ok(real.lock.ids.indexOf(id) !== -1, id + ' está en el candado de ids'));
});

test('ejercicios nuevos: 38 de práctica y 72 de comprobación, ids únicos en todo el sitio y sin raya larga en el texto', () => {
  const np = real.practice.filter(r => NEW_PRACTICE.test(r.item.id)), nc = real.check.filter(c => NEW_CHECK.test(c.id));
  assert.strictEqual(np.length, 38);
  assert.strictEqual(nc.length, 72);
  const ids = real.practice.map(r => r.item.id).concat(real.check.map(c => c.id));
  assert.strictEqual(new Set(ids).size, ids.length, 'ids repetidos');
  np.map(r => r.item).concat(nc).forEach(it => {
    const txt = JSON.stringify([it.prompt, it.sentence, it.wrong, it.right, it.explain, it.translation, it.examples]);
    assert.ok(!/—/.test(txt), it.id + ' usa raya larga');
    assert.ok(IDS.indexOf(it.micro) !== -1, it.id + ': micro inválido');
    assert.ok(it.translation && it.explain && it.examples.length === 2, it.id + ': falta traducción, explicación o 2 ejemplos');
  });
});

test('cada ejercicio nuevo está bien armado: una sola respuesta correcta, el hueco existe y el error trae su corrección', () => {
  real.practice.map(r => r.item).concat(real.check).filter(it => NEW_PRACTICE.test(it.id) || NEW_CHECK.test(it.id)).forEach(it => {
    if(it.type === 'choice'){
      assert.ok(it.prompt.indexOf('___') !== -1, it.id + ': sin hueco');
      assert.strictEqual(it.options.length, 3, it.id); assert.strictEqual(new Set(it.options).size, 3, it.id + ': opciones repetidas');
      assert.ok(Number.isInteger(it.correct) && it.correct >= 0 && it.correct < 3, it.id);
    } else if(it.type === 'fill'){
      assert.strictEqual(it.sentence[it.blankIndex], '___', it.id + ': blankIndex');
      assert.strictEqual(it.sentence.filter(w => w === '___').length, 1, it.id);
      assert.strictEqual(it.bank.length, 3, it.id); assert.strictEqual(new Set(it.bank).size, 3, it.id); assert.ok(it.bank.indexOf(it.correct) !== -1, it.id + ': la correcta no está en el banco');
    } else if(it.type === 'error'){
      assert.ok(it.wrong.indexOf(it.wrongWord) !== -1, it.id + ': wrongWord no está en la frase');
      assert.ok(it.right.indexOf(it.rightWord) !== -1, it.id + ': rightWord no está en la corrección');
      assert.strictEqual(it.wrong.replace(it.wrongWord, it.rightWord), it.right, it.id + ': aplicar la corrección no da la frase correcta');
      // igual que el dibujo del ejercicio (renderGrammarItemInto): la palabra errónea se encuentra por palabras exactas, sin puntuación, una sola vez
      const clean = x => x.split(' ').map(w => w.replace(/[.,?!]/g, ''));
      const find = (sentence, word) => { const c = clean(sentence), w = word.split(' '); const hits = []; for(let i = 0; i <= c.length - w.length; i++){ if(c.slice(i, i + w.length).join(' ') === word) hits.push(i); } return hits; };
      assert.strictEqual(find(it.wrong, it.wrongWord).length, 1, it.id + ': wrongWord debe aparecer una sola vez como palabras completas');
      assert.strictEqual(find(it.right, it.rightWord).length, 1, it.id + ': rightWord debe aparecer una sola vez como palabras completas');
    } else assert.fail(it.id + ': tipo ' + it.type);
  });
});

console.log('\nLo que ya existía no cambió');
test('los 15 ejercicios que ya existían conservan su id, su texto y solo ganaron la etiqueta micro', () => {
  const retag = { 'g-medio-pps-1':'pasado-fecha-terminada', 'g-medio-pps-4':'pasado-fecha-terminada', 'g-medio-pps-2':'pp-experiencia-sin-fecha', 'g-medio-pps-3':'pp-experiencia-sin-fecha',
    'g-medio-sf-1':'since-for-eleccion', 'g-medio-sf-2':'since-for-eleccion', 'g-medio-sf-3':'since-for-eleccion', 'g-medio-sf-4':'since-for-eleccion',
    'g-medio4-mod-1':'obligacion-vs-consejo', 'g-medio4-mod-2':'obligacion-vs-consejo', 'g-medio4-mod-3':'mustnt-vs-dont-have-to',
    'g-facil-prep-1':'in-on-at-lugar', 'g-facil-prep-2':'in-on-at-lugar', 'g-facil-prep-3':'in-on-at-tiempo', 'g-facil-prep-4':'in-on-at-tiempo' };
  Object.keys(retag).forEach(id => { const r = real.practice.find(x => x.item.id === id); assert.ok(r, id + ' desapareció'); assert.strictEqual(r.item.micro, retag[id], id); });
  const first = id => real.practice.find(x => x.item.id === id).item;
  assert.strictEqual(first('g-medio-pps-1').prompt, 'I ___ to Paris last year.');
  assert.strictEqual(first('g-medio-sf-4').wrong, "I've known him since five years.");
  assert.strictEqual(first('g-facil-prep-4').wrong, 'My birthday is in Monday.');
  assert.ok(!first('g-medio4-mod-4').micro, 'mod-4 (must to) no se etiquetó: no es obligación vs consejo');
});

test('el banco de práctica solo creció en 38 ejercicios (416 -> 454) y ninguna etiqueta existente cambió de nombre', () => {
  assert.strictEqual(real.practice.length, 454);
  const topics = new Set(real.practice.map(r => r.topic));
  ['Present Perfect vs Past Simple', 'Since / For', 'In / On / At', 'Some / Any', '"Fewer" vs "Less"', 'Much / Many', 'A little / Little / A few / Few',
    'Verbos modales de obligación (must / have to / should)', 'Cuantificadores (a lot of / much / many / few / little)'].forEach(t => assert.ok(topics.has(t), 'desapareció la etiqueta ' + t));
});

test('los bloques nuevos pertenecen a su tema y a la misma familia del diagnóstico que el tema', () => {
  const blocks = {
    'Presente perfecto: experiencias sin fecha':'present-perfect-vs-past', 'Presente perfecto o pasado simple: con fecha terminada':'present-perfect-vs-past',
    'Since / For: elegir bien':'since-for', 'Since / For con presente perfecto':'since-for', 'Fewer y less en frases':'fewer-vs-less',
    'Some / Any en frases afirmativas y negativas':'some-any', 'Verbos modales: must, mustn\'t y don\'t have to':'modales-obligacion',
    'Verbos modales: obligación (must / have to) vs consejo (should)':'modales-obligacion',
    'In / On / At con tiempo (horas, días, meses)':'in-on-at', 'In / On / At con lugares':'in-on-at' };
  Object.keys(blocks).forEach(topic => {
    const t = real.temaByTopic[topic];
    assert.ok(t && t.id === blocks[topic], topic + ' -> ' + (t && t.id));
    assert.ok(real.practice.some(r => r.topic === topic), topic + ': ningún bloque lo usa');
    assert.strictEqual(T.diagFamilyForTopic(topic).id, t.family, topic + ': familia del diagnóstico');
  });
});

test('los demás temas con microtemas siguen igual (Futuro y Condicionales conservan 6 de práctica y 6 de comprobación)', () => {
  const stats = lib.microStats(real);
  ['will-decision-espontanea', 'going-to-plan-decidido', 'going-to-evidencia', 'will-forma-verbo-base', 'cond-1-probable', 'cond-2-imaginario'].forEach(id => {
    assert.ok(stats[id].practice.length >= 6 && stats[id].check.length === 6, id);
  });
});

console.log('\nLas clases y glosarios no regalan la comprobación');
test('ningún ejercicio de comprobación (ni su respuesta) aparece escrito en la clase o el glosario de su microtema', () => {
  const norm = s => s.toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const pages = {};
  const pageOf = id => { const r = lib.resourcesOf(real, id); const out = [];
    if(r.lesson) out.push(norm(fs.readFileSync(path.join(root, r.lesson.article), 'utf8')));
    if(r.glossary) out.push(norm(fs.readFileSync(path.join(root, 'glosario', r.glossary, 'index.html'), 'utf8')));
    return out; };
  real.check.filter(c => NEW_CHECK.test(c.id)).forEach(c => {
    const texts = pages[c.micro] || (pages[c.micro] = pageOf(c.micro));
    texts.forEach(page => {
      assert.ok(page.indexOf(lib.textOf(c)) === -1, c.id + ' aparece en su recurso');
      if(c.right) assert.ok(page.indexOf(norm(c.right)) === -1, c.id + ': su respuesta está en su recurso');
    });
  });
});

console.log('\nSesiones, Plan y usuarios gratis');
function runCycle(level, len){
  store[T.SESSION_LENGTH_KEY] = len;
  const sessions = [], perTopic = [], progress = { sessions: [], lastActivity: null };
  const total = T.memberBankItems('gramatica', T.G[level]).length;
  let seen = 0, guard = 0;
  while(seen < total && guard++ < 400){
    store[T.PROGRESS_KEY] = JSON.stringify(progress);
    const r = T.resolveMemberPool({ skill:'gramatica', level, bankLevel:T.G[level], saved:null });
    const ids = r.pool.map(i => i.id);
    perTopic.push(r.pool.reduce((m, i) => { if(NEW_PRACTICE.test(i.id)) m[i.topic] = (m[i.topic] || 0) + 1; return m; }, {}));
    progress.sessions.push({ skill:'gramatica', level, topics:[], date:'2026-10-10', startedAt: guard, durationMs:1, results: ids.map(id => ({ itemId:id, isCorrect:true })) });
    sessions.push(ids); seen += ids.length;
  }
  return { sessions, total, perTopic };
}
['facil', 'medio'].forEach(level => ['corta', 'media', 'larga'].forEach(len => {
  test(level + '/' + len + ': la sesión conserva su tamaño, sin repetidos, y los bloques nuevos no la llenan', () => {
    const want = T.SESSION_LENGTHS[len].items;
    const { sessions, perTopic } = runCycle(level, len);
    sessions.slice(0, -1).forEach((s, i) => assert.strictEqual(s.length, want, 'la sesión ' + (i + 1) + ' tiene ' + s.length));
    const flat = [].concat(...sessions.slice(0, -1));
    assert.strictEqual(new Set(flat).size, flat.length, 'se repitió un ejercicio dentro del ciclo');
    // cada bloque nuevo tiene 2 a 6 ejercicios: ningún bloque llena una sesión por sí solo (la sesión larga lleva 15)
    perTopic.forEach(m => Object.keys(m).forEach(tp => assert.ok(m[tp] <= 6, 'el bloque "' + tp + '" puso ' + m[tp] + ' ejercicios en una sesión')));
  });
}));

IDS.forEach(m => {
  levelsOf(m).forEach(level => {
    test(m + ' @' + level + ': el Plan con foco en el microtema respeta la duración y trae ejercicios de ese microtema', () => {
      ['corta', 'media', 'larga'].forEach(len => {
        const want = T.SESSION_LENGTHS[len].items;
        store[T.SESSION_LENGTH_KEY] = len;
        const sel = T.computePlanSelection(level, want, { focusMicro: m });
        const pool = T.buildPlanPool(level, sel);
        assert.strictEqual(pool.length, want, len + ': el Plan armó ' + pool.length);
        assert.ok(pool.some(e => e.item && e.item.micro === m), len + ': ningún ejercicio del microtema');
      });
    });
  });
});

test('usuarios gratis: ningún ejercicio nuevo cae en una variante que ellos puedan recibir', () => {
  ['facil', 'medio'].forEach(level => {
    const memberOnly = new Set(T.MEMBERS_ONLY_VARIANT_INDEX.gramatica[level]);
    T.G[level].forEach((variant, vi) => variant.forEach(block => block.items.forEach(item => {
      if(NEW_PRACTICE.test(item.id)) assert.ok(memberOnly.has(vi), item.id + ' está en ' + level + '[' + vi + '], que no es solo de miembros');
    })));
  });
});

console.log('\nLa comprobación está aislada y el flujo funciona en cada microtema');
test('ningún ejercicio de comprobación está en los bancos de práctica ni en el índice de errores', () => {
  const index = T.getMistakesItemIndex();
  const mine = T.CHECK.filter(c => NEW_CHECK.test(c.id));
  assert.strictEqual(mine.length, 72);
  Object.keys(T.G).forEach(l => T.memberBankItems('gramatica', T.G[l]).forEach(i => assert.ok(!mine.some(c => c.id === i.id), i.id + ' en práctica')));
  mine.forEach(c => assert.strictEqual(index.has(c.id), false, c.id + ' entró al índice de errores'));
});

const fail = (level, id, t) => T.recordSession({ skill:'gramatica', level, topics:[], startedAt: t, results:[{ itemId:id, isCorrect:false }] });
const okAns = (level, ids, t) => T.recordSession({ skill:'gramatica', level, topics:[], startedAt: t, results: ids.map(id => ({ itemId:id, isCorrect:true })) });
const flow = m => T.microFlowState(m, T.microStatsAll()[m]).state;

IDS.forEach(m => {
  test(m + ': error -> recomendación con su recurso -> refuerzo -> comprobación con ejercicios inéditos -> dominio -> no se repiten', () => {
    const level = levelsOf(m).sort((a, b) => practiceOf(m).filter(r => r.level === b).length - practiceOf(m).filter(r => r.level === a).length)[0];
    const ids = practiceOf(m).map(r => r.item.id), checks = T.CHECK.filter(c => c.micro === m).map(c => c.id);
    assert.ok(T.microHasItemsAt(m, level), 'tiene ejercicios en ' + level);
    assert.strictEqual(T.microCheckStart(m).items, null, 'sin historial no comprueba');
    let t = 1000;
    fail(level, ids[0], t++); fail(level, ids[1], t++);
    assert.strictEqual(flow(m), 'sin-alerta', '2 fallos distintos todavía no es debilidad');
    assert.strictEqual(T.microDiagActions(level).filter(a => a.micro === m).length, 0, 'aún no se recomienda');
    fail(level, ids[2], t++);
    assert.strictEqual(flow(m), 'debil');
    // la recomendación nombra el concepto exacto y enlaza a la práctica enfocada y a su explicación
    const act = T.microDiagActions(level).find(a => a.micro === m);
    assert.ok(act, 'debe recomendar el microtema');
    assert.ok(act.title.indexOf(real.microById[m].label) !== -1, 'nombra el concepto: ' + act.title);
    assert.ok(act.href.indexOf('micro=' + encodeURIComponent(m)) !== -1, 'la práctica enfocada lleva el microtema: ' + act.href);
    const want = MICROS[m];
    assert.ok(act.article, 'la recomendación trae enlace a la explicación');
    if(want.lesson){ assert.ok(act.article.indexOf(want.lesson[0]) === 0 && act.article.slice(-('#' + want.lesson[1]).length) === '#' + want.lesson[1], act.article); assert.strictEqual(act.articleLabel, 'Ver la clase'); }
    else { assert.strictEqual(act.article.indexOf('/glosario/' + want.glossary + '/'), 0, act.article); assert.strictEqual(act.articleLabel, 'Ver explicación rápida'); }
    assert.strictEqual(T.microCheckStart(m).reason, 'no-toca', 'con debilidad pero sin refuerzo aún no toca comprobar');
    okAns(level, ids.slice(0, 4), t++); assert.strictEqual(flow(m), 'debil');
    okAns(level, ids.slice(4, 6), t++);
    assert.strictEqual(flow(m), 'listo-comprobar');
    assert.strictEqual(T.microDiagActions(level).find(a => a.micro === m).microState, 'listo-comprobar');
    const st = T.microCheckStart(m);
    assert.ok(st.items && st.items.length === 3, 'ofrece 3 ejercicios');
    st.items.forEach(it => assert.ok(checks.indexOf(it.id) !== -1, it.id + ' es de comprobación'));
    assert.strictEqual(new Set(st.items.map(i => i.id)).size, 3);
    T.recordSession({ skill:'check', level, topics:[], startedAt: t++, results: st.items.map(i => ({ itemId:i.id, isCorrect:true })) });
    assert.strictEqual(flow(m), 'recuperado');
    assert.strictEqual(T.microDiagActions(level).filter(a => a.micro === m).length, 0, 'recuperado: ya no se recomienda');
    const again = T.microCheckStart(m);
    assert.strictEqual(again.items, null, 'ya los vio: no se repiten');
    const seen = JSON.parse(store[T.CHECK_SEEN_KEY]);
    st.items.forEach(it => assert.strictEqual(seen[it.id], 1, it.id + ' quedó como visto'));
    assert.strictEqual(Object.keys(seen).length, 3, 'solo los 3 servidos: la otra ronda sigue inédita');
  });
});

test('un microtema que no se activó (a-lot-of, some-any-pregunta-oferta) no recomienda ni comprueba nada aunque haya errores', () => {
  ['a-lot-of', 'some-any-pregunta-oferta'].forEach(m => {
    const rows = practiceOf(m);
    rows.forEach((r, i) => T.recordSession({ skill:'gramatica', level:r.level, topics:[], startedAt: 10 + i, results:[{ itemId:r.item.id, isCorrect:false }] }));
    rows.map(r => r.level).forEach(lv => assert.strictEqual(T.microDiagActions(lv).filter(a => a.micro === m).length, 0, m));
    assert.strictEqual(T.microCheckStart(m).items, null);
  });
});

test('un alumno de otro nivel no recibe una recomendación sin ejercicios en su nivel (in/on/at es solo Fácil, modales solo Medio)', () => {
  ['in-on-at-tiempo', 'in-on-at-lugar'].forEach(m => { assert.deepStrictEqual(levelsOf(m), ['facil'], m); assert.strictEqual(T.microHasItemsAt(m, 'medio'), false); });
  ['mustnt-vs-dont-have-to', 'obligacion-vs-consejo'].forEach(m => { assert.deepStrictEqual(levelsOf(m), ['medio'], m); assert.strictEqual(T.microHasItemsAt(m, 'facil'), false); });
});

console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : ''));
