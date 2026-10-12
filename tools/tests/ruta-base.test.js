#!/usr/bin/env node
/* Ruta base de Principiante y Fácil (7 microtemas activos):
     To be (tobe-am-is-are)
     Presente simple (ps-tercera-persona-s, ps-negativa-dont-doesnt, ps-adverbios-frecuencia)
     Do / does (dodoes-elegir-sujeto)
     Can / can't (can-verbo-base)
     A / an (a-an-sonido)
   Y las clases ya escritas que se conectaron a su tema (presente continuo, comparativos, gerundio e infinitivo, verbos modales, artículos a / an).
   Corre con:  node tools/tests/ruta-base.test.js   (desde la carpeta inglesconLeo)

   Comprueba el contenido (reglas de un microtema activo, sin oraciones repetidas, respuestas repartidas), que lo que ya existía no cambió
   (ids, texto, tamaño del banco), que cada recomendación lleva a una clase y una sección que existen, que la comprobación está aislada,
   que las sesiones y el Plan conservan su tamaño, que los usuarios gratis no reciben nada nuevo y que el flujo
   error -> recomendación -> refuerzo -> comprobación -> dominio funciona en cada microtema. Usa los archivos REALES. */
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
let seed = Number(process.env.RUTA_SEED || 20261012);
T.ctx.__rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
vm.runInContext('Math.random = function(){ return __rng(); };', T.ctx);
const real = lib.loadSite(root);
const plain = o => JSON.parse(JSON.stringify(o));
let passed = 0;
function test(name, fn){
  try{ Object.keys(store).forEach(k => delete store[k]); fn(); passed++; console.log('  ok  ' + name); }
  catch(e){ console.error('FALLA ' + name + '\n  ' + (e && e.message)); process.exitCode = 1; }
}

// microtema -> { tema, recurso esperado }
const MICROS = {
  'tobe-am-is-are':          { tema:'to-be-presente',  lesson:['articulo-verbo-to-be.html', 'forma-afirmativa'] },
  'ps-tercera-persona-s':    { tema:'presente-simple', lesson:['articulo-presente-simple.html', 'forma-afirmativa'] },
  'ps-negativa-dont-doesnt': { tema:'presente-simple', lesson:['articulo-presente-simple.html', 'forma-negativa'] },
  'ps-adverbios-frecuencia': { tema:'presente-simple', lesson:['articulo-presente-simple.html', 'adverbios'] },
  'dodoes-elegir-sujeto':    { tema:'do-does',         lesson:['articulo-do-vs-does.html', 'do-o-does'] },
  'can-verbo-base':          { tema:'can-cant',        lesson:['articulo-verbos-modales.html', 'forma-basica'] },
  'a-an-sonido':             { tema:'a-an',            lesson:['articulo-articulos-a-an-the.html', 'a-an-sonido'] }
};
const IDS = Object.keys(MICROS);
const NEW_PRACTICE = /^g-facil-(ps3|psneg|freqpos|cancant|aan)-\d+$/;
const NEW_CHECK = /^g-chk-(tobe|dd|can|aan|ps3|psneg|freq)-\d+$/;
const practiceOf = micro => real.practice.filter(r => r.item.micro === micro);
const levelsOf = micro => Array.from(new Set(practiceOf(micro).map(r => r.level)));
const html = f => fs.readFileSync(path.join(root, f), 'utf8');

console.log('Contenido de los 7 microtemas');
test('los 7 microtemas están activos, en su tema, con su clase y la sección exacta que existe de verdad', () => {
  IDS.forEach(id => {
    assert.strictEqual(real.microById[id].active, true, id); assert.strictEqual(real.microById[id].tema, MICROS[id].tema, id); assert.strictEqual(T.microIsActive(id), true, id);
    const [file, anchor] = MICROS[id].lesson, res = lib.resourcesOf(real, id);
    assert.deepStrictEqual([res.lesson.article, res.lesson.anchor], [file, anchor], id);
    assert.ok(fs.existsSync(path.join(root, file)), file + ' existe');
    assert.ok(html(file).indexOf('id="' + anchor + '"') !== -1, file + ' no tiene la sección #' + anchor);
  });
});

test('cada microtema: >=6 de práctica con >=2 tipos y 6 de comprobación (2 rondas de 3)', () => {
  const stats = lib.microStats(real);
  IDS.forEach(id => {
    assert.ok(stats[id].practice.length >= 6, id + ': práctica ' + stats[id].practice.length);
    assert.ok(new Set(stats[id].practice.map(r => r.item.type)).size >= 2, id + ': tipos');
    assert.strictEqual(stats[id].check.length, 6, id + ': comprobación');
  });
});

test('las reglas de microtemas activos pasan completas (comprobación distinta a la práctica, ids bloqueados)', () => {
  assert.deepStrictEqual(lib.validate(real), []);
  IDS.forEach(id => assert.ok(real.lock.ids.indexOf(id) !== -1, id + ' está en el candado de ids'));
});

test('ejercicios nuevos: 18 de práctica y 42 de comprobación, ids únicos en todo el sitio y sin raya larga', () => {
  const np = real.practice.filter(r => NEW_PRACTICE.test(r.item.id)), nc = real.check.filter(c => NEW_CHECK.test(c.id));
  assert.strictEqual(np.length, 18);
  assert.strictEqual(nc.length, 42);
  const ids = real.practice.map(r => r.item.id).concat(real.check.map(c => c.id));
  assert.strictEqual(new Set(ids).size, ids.length, 'ids repetidos');
  np.map(r => r.item).concat(nc).forEach(it => {
    const txt = JSON.stringify([it.prompt, it.sentence, it.wrong, it.right, it.explain, it.translation, it.examples]);
    assert.ok(!/—/.test(txt), it.id + ' usa raya larga');
    assert.ok(IDS.indexOf(it.micro) !== -1, it.id + ': micro inválido');
    assert.ok(it.translation && it.explain && it.examples.length === 2, it.id + ': falta traducción, explicación o 2 ejemplos');
  });
});

test('ninguna oración en inglés se repite entre los ejercicios nuevos ni con los que ya existían', () => {
  const sentenceOf = it => it.type === 'fill' ? it.sentence.map(w => w === '___' ? it.correct : w).join(' ')
    : it.type === 'error' ? it.right : it.prompt.replace('___', it.options[it.correct]);
  const norm = s => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const real1 = i => i.type !== 'choice' || i.prompt.indexOf('___') !== -1;        // "Which sentence is correct?" no es una oración
  const mine = real.practice.map(r => r.item).filter(i => NEW_PRACTICE.test(i.id)).concat(real.check.filter(c => NEW_CHECK.test(c.id))).filter(real1);
  const others = real.practice.map(r => r.item).filter(i => !NEW_PRACTICE.test(i.id)).concat(real.check.filter(c => !NEW_CHECK.test(c.id))).filter(real1);
  const otherSet = new Set(others.map(i => norm(sentenceOf(i))));
  const seen = new Map();
  mine.forEach(i => {
    const s = norm(sentenceOf(i));
    assert.ok(!seen.has(s), i.id + ' repite la oración de ' + seen.get(s));
    assert.ok(!otherSet.has(s), i.id + ' repite una oración que ya existía: ' + s);
    seen.set(s, i.id);
  });
});

test('las respuestas correctas de los ejercicios nuevos de opción múltiple no se concentran en una posición', () => {
  const pos = [0, 0, 0];
  real.practice.map(r => r.item).concat(real.check).filter(it => (NEW_PRACTICE.test(it.id) || NEW_CHECK.test(it.id)) && it.type === 'choice').forEach(it => { pos[it.correct]++; });
  const total = pos[0] + pos[1] + pos[2];
  assert.ok(total >= 20);
  pos.forEach((n, i) => assert.ok(n / total <= 0.5, 'la opción ' + i + ' concentra ' + n + ' de ' + total + ': ' + pos));
});

test('cada ejercicio nuevo está bien armado: una sola respuesta correcta, el hueco existe y el error trae su corrección', () => {
  real.practice.map(r => r.item).concat(real.check).filter(it => NEW_PRACTICE.test(it.id) || NEW_CHECK.test(it.id)).forEach(it => {
    if(it.type === 'choice'){
      assert.strictEqual(it.options.length, 3, it.id); assert.strictEqual(new Set(it.options).size, 3, it.id + ': opciones repetidas');
      assert.ok(Number.isInteger(it.correct) && it.correct >= 0 && it.correct < 3, it.id);
      if(it.prompt.indexOf('___') !== -1) assert.strictEqual(it.prompt.split('___').length, 2, it.id);
    } else if(it.type === 'fill'){
      assert.strictEqual(it.sentence[it.blankIndex], '___', it.id + ': blankIndex');
      assert.strictEqual(it.sentence.filter(w => w === '___').length, 1, it.id);
      assert.strictEqual(it.bank.length, 3, it.id); assert.strictEqual(new Set(it.bank).size, 3, it.id); assert.ok(it.bank.indexOf(it.correct) !== -1, it.id + ': la correcta no está en el banco');
    } else if(it.type === 'error'){
      assert.ok(it.wrong.indexOf(it.wrongWord) !== -1, it.id + ': wrongWord no está en la frase');
      assert.strictEqual(it.wrong.replace(it.wrongWord, it.rightWord), it.right, it.id + ': aplicar la corrección no da la frase correcta');
      const clean = x => x.split(' ').map(w => w.replace(/[.,?!]/g, ''));
      const find = (sentence, word) => { const c = clean(sentence), w = word.split(' '); const hits = []; for(let i = 0; i <= c.length - w.length; i++){ if(c.slice(i, i + w.length).join(' ') === word) hits.push(i); } return hits; };
      assert.strictEqual(find(it.wrong, it.wrongWord).length, 1, it.id + ': wrongWord debe aparecer una sola vez como palabras completas');
      assert.strictEqual(find(it.right, it.rightWord).length, 1, it.id + ': rightWord debe aparecer una sola vez como palabras completas');
    } else assert.fail(it.id + ': tipo ' + it.type);
  });
});

console.log('\nLo que ya existía no cambió');
test('los 29 ejercicios que ya existían conservan su id y su texto y solo ganaron la etiqueta micro', () => {
  const retag = {
    'tobe-am-is-are':['g-principiante6-5','g-principiante6-6','g-principiante6-7','g-principiante6-8','g-principiante-m200-tobe-1','g-principiante-m200-tobe-2','g-principiante-m200-tobe-3','g-principiante-m200-tobe-4','g-principiante-m400-3'],
    'dodoes-elegir-sujeto':['g-principiante5-dodoes-1','g-principiante5-dodoes-2','g-principiante5-dodoes-3','g-principiante5-dodoes-4','g-facil7-dodoes-1','g-facil7-dodoes-2','g-facil7-dodoes-3','g-facil7-dodoes-4'],
    'ps-adverbios-frecuencia':['g-facil4-freq-1','g-facil4-freq-2','g-facil4-freq-3','g-facil4-freq-4'],
    'can-verbo-base':['g-facil5-can-1','g-facil5-can-2','g-facil5-can-3','g-facil5-can-4'],
    'a-an-sonido':['g-facil-art-1','g-facil-art-2','g-facil-art-3','g-facil-art-4'] };
  let n = 0;
  Object.keys(retag).forEach(m => retag[m].forEach(id => { const r = real.practice.find(x => x.item.id === id); assert.ok(r, id + ' desapareció'); assert.strictEqual(r.item.micro, m, id); n++; }));
  assert.strictEqual(n, 29);
  const first = id => real.practice.find(x => x.item.id === id).item;
  assert.strictEqual(first('g-principiante6-5').prompt, 'She ___ my sister.');
  assert.strictEqual(first('g-facil4-freq-4').wrong, 'She never is late.');
  assert.strictEqual(first('g-facil-art-4').wrong, 'I need a hour to finish.');
  assert.strictEqual(first('g-facil5-can-4').wrong, 'She can to sing very well.');
  assert.strictEqual(first('g-principiante5-dodoes-4').wrong, 'Does you like pizza?');
  assert.ok(!first('g-principiante-m400-1').micro && !first('g-principiante-m400-2').micro, 'there are / has no son de am-is-are');
  assert.ok(!first('g-facil-tobe-3').micro, '"Presente simple y to be" no se etiquetó: es otro tema');
});

test('el banco de práctica solo creció en 18 ejercicios (454 -> 472) y ninguna etiqueta existente cambió de nombre', () => {
  assert.strictEqual(real.practice.length, 472);
  const topics = new Set(real.practice.map(r => r.topic));
  ['Presente simple y "to be"', 'Adverbios de frecuencia (always / usually / sometimes / never)', 'Do / Does', 'Preguntas con Do/Does en presente simple', 'Is / Are (singular y plural)',
    'Verbo "to be": am / is / are', 'Can / Can\'t (habilidad)', 'A / An'].forEach(t => assert.ok(topics.has(t), 'desapareció la etiqueta ' + t));
});

test('los bloques nuevos pertenecen a su tema y a la misma familia del diagnóstico que el tema', () => {
  const blocks = {
    'Presente simple: la -s de he / she / it':'presente-simple', 'Presente simple: don\'t y doesn\'t':'presente-simple', 'Adverbios de frecuencia: dónde van':'presente-simple',
    'Can / Can\'t: después va el verbo base':'can-cant', 'A / An: depende del sonido':'a-an' };
  Object.keys(blocks).forEach(topic => {
    const t = real.temaByTopic[topic];
    assert.ok(t && t.id === blocks[topic], topic + ' -> ' + (t && t.id));
    assert.ok(real.practice.some(r => r.topic === topic), topic + ': ningún bloque lo usa');
    assert.strictEqual(T.diagFamilyForTopic(topic).id, t.family, topic + ': familia del diagnóstico');
  });
});

test('las clases conectadas corresponden de verdad a su tema y cargan los scripts de miembros', () => {
  const WANT = {
    'presente-continuo':      { file:'articulo-presente-continuo.html',            keys:['presente continuo', '-ing'] },
    'comparativos':           { file:'articulo-comparativos-y-superlativos.html',  keys:['comparativo', 'than', 'as ... as'] },
    'gerundios-infinitivos':  { file:'articulo-gerundio-e-infinitivo.html',        keys:['gerundio', 'infinitivo', 'to +'] },
    'can-cant':               { file:'articulo-verbos-modales.html',               keys:['can', 'habilidad', "can't"] },
    'modales-posibilidad':    { file:'articulo-verbos-modales.html',               keys:['may', 'might', 'posibilidad'] },
    'a-an':                   { file:'articulo-articulos-a-an-the.html',           keys:['a y an', 'sonido', ' an '] }
  };
  Object.keys(WANT).forEach(id => {
    const w = WANT[id], t = real.temaById[id];
    assert.strictEqual(t.article, w.file, id);
    const h = html(w.file), low = h.toLowerCase();
    w.keys.forEach(k => assert.ok(low.indexOf(k) !== -1, id + ': la clase no menciona "' + k + '"'));
    assert.ok(/<script src="temas\.js\?v=/.test(h) && /<script src="backend\.js\?v=/.test(h) && /<script src="app\.js\?v=/.test(h), w.file + ' sin los scripts de miembros');
    assert.ok(h.indexOf('temas.js') < h.indexOf('app.js?v='), w.file + ': temas.js antes de app.js');
    assert.ok(h.indexOf('article-body') !== -1, w.file + ': sin article-body');
  });
  // lo que NO se conectó a propósito
  assert.strictEqual(real.temaById['pronombres'].article, null, 'pronombres incluye pronombres objeto, que la clase no cubre');
  assert.strictEqual(real.temaById['modales-obligacion'].article, null, 'sus microtemas ya apuntan a una explicación más precisa');
  assert.strictEqual(real.temaById['question-words'].article, null);
});

test('el glosario de a / an ofrece la clase conectada y sigue ofreciendo la práctica', () => {
  const g = html('glosario/a-vs-an/index.html');
  assert.ok(g.indexOf('href="/articulo-articulos-a-an-the.html?tema=a-an&amp;via=rec"') !== -1);
  assert.ok(g.indexOf('href="/plan-estudio.html?foco=demostrativos&amp;tema=a-an&amp;empezar=1"') !== -1);
});

test('las demás clases ya conectadas siguen igual', () => {
  [['presente-simple', 'articulo-presente-simple.html'], ['do-does', 'articulo-do-vs-does.html'], ['to-be-presente', 'articulo-verbo-to-be.html'], ['was-were', 'articulo-verbo-to-be.html']]
    .forEach(([id, f]) => assert.strictEqual(real.temaById[id].article, f, id));
});

console.log('\nLas clases y glosarios no regalan la comprobación');
test('ningún ejercicio de comprobación (ni su respuesta) aparece escrito en la clase o el glosario de su microtema', () => {
  const norm = s => s.toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const pages = {};
  const pageOf = id => { const r = lib.resourcesOf(real, id); const out = [];
    if(r.lesson) out.push(norm(html(r.lesson.article)));
    if(r.glossary) out.push(norm(html('glosario/' + r.glossary + '/index.html')));
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
    progress.sessions.push({ skill:'gramatica', level, topics:[], date:'2026-10-12', startedAt: guard, durationMs:1, results: ids.map(id => ({ itemId:id, isCorrect:true })) });
    sessions.push(ids); seen += ids.length;
  }
  return { sessions, total, perTopic };
}
['principiante', 'facil'].forEach(level => ['corta', 'media', 'larga'].forEach(len => {
  test(level + '/' + len + ': la sesión conserva su tamaño, sin repetidos, y los bloques nuevos no la llenan', () => {
    const want = T.SESSION_LENGTHS[len].items;
    const { sessions, perTopic } = runCycle(level, len);
    sessions.slice(0, -1).forEach((s, i) => assert.strictEqual(s.length, want, 'la sesión ' + (i + 1) + ' tiene ' + s.length));
    const flat = [].concat(...sessions.slice(0, -1));
    assert.strictEqual(new Set(flat).size, flat.length, 'se repitió un ejercicio dentro del ciclo');
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
  ['principiante', 'facil'].forEach(level => {
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
  assert.strictEqual(mine.length, 42);
  Object.keys(T.G).forEach(l => T.memberBankItems('gramatica', T.G[l]).forEach(i => assert.ok(!mine.some(c => c.id === i.id), i.id + ' en práctica')));
  mine.forEach(c => assert.strictEqual(index.has(c.id), false, c.id + ' entró al índice de errores'));
});

const fail = (level, id, t) => T.recordSession({ skill:'gramatica', level, topics:[], startedAt: t, results:[{ itemId:id, isCorrect:false }] });
const okAns = (level, ids, t) => T.recordSession({ skill:'gramatica', level, topics:[], startedAt: t, results: ids.map(id => ({ itemId:id, isCorrect:true })) });
const flow = m => T.microFlowState(m, T.microStatsAll()[m]).state;

IDS.forEach(m => {
  test(m + ': error -> recomendación con su clase exacta -> refuerzo -> comprobación con ejercicios inéditos -> dominio -> no se repiten', () => {
    const level = levelsOf(m).sort((a, b) => practiceOf(m).filter(r => r.level === b).length - practiceOf(m).filter(r => r.level === a).length)[0];
    const ids = practiceOf(m).filter(r => r.level === level).map(r => r.item.id), checks = T.CHECK.filter(c => c.micro === m).map(c => c.id);
    assert.ok(ids.length >= 4, 'el nivel ' + level + ' tiene al menos 4 ejercicios del microtema');
    assert.ok(T.microHasItemsAt(m, level), 'tiene ejercicios en ' + level);
    assert.strictEqual(T.microCheckStart(m).items, null, 'sin historial no comprueba');
    let t = 1000;
    fail(level, ids[0], t++); fail(level, ids[1], t++);
    assert.strictEqual(flow(m), 'sin-alerta', '2 fallos distintos todavía no es debilidad');
    assert.strictEqual(T.microDiagActions(level).filter(a => a.micro === m).length, 0, 'aún no se recomienda');
    fail(level, ids[2], t++);
    assert.strictEqual(flow(m), 'debil');
    const act = T.microDiagActions(level).find(a => a.micro === m);
    assert.ok(act, 'debe recomendar el microtema');
    assert.ok(act.title.indexOf(real.microById[m].label) !== -1, 'nombra el concepto: ' + act.title);
    assert.ok(act.href.indexOf('micro=' + encodeURIComponent(m)) !== -1, 'la práctica enfocada lleva el microtema: ' + act.href);
    const want = MICROS[m];
    assert.ok(act.article && act.article.indexOf(want.lesson[0]) === 0 && act.article.slice(-('#' + want.lesson[1]).length) === '#' + want.lesson[1], act.article);
    assert.strictEqual(act.articleLabel, 'Ver la clase');
    // el enlace de la recomendación lleva a un archivo y a una sección que existen
    const file = act.article.split('?')[0].split('#')[0], hash = act.article.split('#')[1];
    assert.ok(fs.existsSync(path.join(root, file)) && html(file).indexOf('id="' + hash + '"') !== -1, 'el destino existe: ' + act.article);
    assert.strictEqual(T.microCheckStart(m).reason, 'no-toca', 'con debilidad pero sin refuerzo aún no toca comprobar');
    const reinforce = ids.concat(ids).slice(0, 6);
    okAns(level, reinforce.slice(0, 4), t++); assert.strictEqual(flow(m), 'debil');
    okAns(level, reinforce.slice(4, 6), t++);
    assert.strictEqual(flow(m), 'listo-comprobar');
    assert.strictEqual(T.microDiagActions(level).find(a => a.micro === m).microState, 'listo-comprobar');
    const st = T.microCheckStart(m);
    assert.ok(st.items && st.items.length === 3, 'ofrece 3 ejercicios');
    st.items.forEach(it => assert.ok(checks.indexOf(it.id) !== -1, it.id + ' es de comprobación'));
    assert.strictEqual(new Set(st.items.map(i => i.id)).size, 3);
    T.recordSession({ skill:'check', level, topics:[], startedAt: t++, results: st.items.map(i => ({ itemId:i.id, isCorrect:true })) });
    assert.strictEqual(flow(m), 'recuperado');
    assert.strictEqual(T.microDiagActions(level).filter(a => a.micro === m).length, 0, 'recuperado: ya no se recomienda');
    assert.strictEqual(T.microCheckStart(m).items, null, 'ya los vio: no se repiten');
    const seen = JSON.parse(store[T.CHECK_SEEN_KEY]);
    st.items.forEach(it => assert.strictEqual(seen[it.id], 1, it.id + ' quedó como visto'));
    assert.strictEqual(Object.keys(seen).length, 3, 'solo los 3 servidos: la otra ronda sigue inédita');
  });
});

test('un alumno de otro nivel no recibe una recomendación sin ejercicios en su nivel (to be solo Principiante; presente simple, can y a/an solo Fácil)', () => {
  assert.deepStrictEqual(levelsOf('tobe-am-is-are'), ['principiante']);
  ['ps-tercera-persona-s', 'ps-negativa-dont-doesnt', 'ps-adverbios-frecuencia', 'can-verbo-base', 'a-an-sonido'].forEach(m => {
    assert.deepStrictEqual(levelsOf(m), ['facil'], m);
    assert.strictEqual(T.microHasItemsAt(m, 'principiante'), false, m); assert.strictEqual(T.microHasItemsAt(m, 'medio'), false, m);
  });
  assert.deepStrictEqual(levelsOf('dodoes-elegir-sujeto').sort(), ['facil', 'principiante']);
  assert.strictEqual(T.microHasItemsAt('tobe-am-is-are', 'facil'), false);
});

console.log('\n' + passed + ' pruebas correctas' + (process.exitCode ? ' (hay fallas)' : ''));
