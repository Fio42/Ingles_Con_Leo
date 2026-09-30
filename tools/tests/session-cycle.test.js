#!/usr/bin/env node
/* Pruebas del mazo barajado de sesiones de Miembros (app.js).
   Corre con:  node tools/tests/session-cycle.test.js   (desde la carpeta inglesconLeo)
   Carga el codigo REAL de app.js (solo las funciones del mazo) y los bancos REALES de data.js. */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function extractFn(name){
  const i = appSrc.indexOf('function ' + name + '(');
  assert(i >= 0, 'no se encontro ' + name);
  let j = i + appSrc.slice(i).search(/\)\s*\{/), depth = 0;
  j = appSrc.indexOf('{', j);
  for(; j < appSrc.length; j++){
    if(appSrc[j] === '{') depth++;
    else if(appSrc[j] === '}'){ depth--; if(!depth) break; }
  }
  return appSrc.slice(i, j + 1);
}
const cycleBlock = appSrc.slice(appSrc.indexOf('/* CYCLE-START */'), appSrc.indexOf('/* CYCLE-END */'));
const code = ['flattenVariant','variantTopicLabels','shuffleArray','rebuildPoolFromVariantIdxs','topicsOfPool','resolveMemberPool']
  .map(extractFn).join('\n') + '\n' + cycleBlock;

// random con semilla para que las pruebas sean repetibles
let seed = 12345;
const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const ctx = { console, Math: Object.assign(Object.create(Math), { random: rng }) };
ctx.SESSION_LENGTHS = { corta:{items:5}, media:{items:9}, larga:{items:15} };
ctx.__len = 'media';
ctx.getSessionLength = () => ctx.__len;
ctx.__progress = { sessions: [] };
ctx.loadProgress = () => ctx.__progress;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') +
  '\n;this.BANKS={gramatica:GRAMMAR_BANK,vocabulario:VOCAB_BANK,listening:LISTENING_BANK,speaking:SPEAKING_BANK,writing:WRITING_BANK,lectura:READING_BANK}', ctx);
vm.runInContext(code, ctx);
const { resolveMemberPool, memberBankItems, computeCycleState } = vm.runInContext('({resolveMemberPool,memberBankItems,computeCycleState})', ctx);

let passed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); } catch(e){ console.log('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; } }

// Simula una sesion completa como hace la app: arma el pool, "termina" y registra results.
let clock = 1;
function playSession(skill, level, bankLevel, progress){
  ctx.__progress = progress;
  const r = resolveMemberPool({ skill, level, bankLevel, saved: null });
  progress.sessions.push({ skill, level, startedAt: clock++, results: r.pool.map(i => ({ itemId: i.id, isCorrect: true })) });
  return r.pool.map(i => i.id);
}

console.log('Mazo barajado de Miembros');
test('nunca repite hasta agotar el banco, en todos los bancos reales y las 3 duraciones', () => {
  for(const [skill, bank] of Object.entries(ctx.BANKS)){
    for(const level of Object.keys(bank)){
      for(const len of ['corta','media','larga']){
        ctx.__len = len;
        const items = memberBankItems(skill, bank[level]);
        const size = items.length, progress = { sessions: [] };
        const seen = [];
        while(seen.length < size){
          const ids = playSession(skill, level, bank[level], progress);
          assert.strictEqual(new Set(ids).size, ids.length, 'repetido dentro de la sesion');
          ids.forEach(id => seen.push(id));
        }
        const firstCycle = seen.slice(0, size);
        assert.strictEqual(new Set(firstCycle).size, size, skill + '/' + level + '/' + len + ': se repitio algo antes de agotar el banco');
        assert.deepStrictEqual(new Set(firstCycle), new Set(items.map(i => i.id)), 'el ciclo no cubrio todo el banco');
      }
    }
  }
});

test('el ciclo siguiente tambien recorre todo sin repetir (3 ciclos seguidos)', () => {
  ctx.__len = 'media';
  const bank = ctx.BANKS.vocabulario.medio, size = memberBankItems('vocabulario', bank).length;
  const progress = { sessions: [] }, all = [];
  while(all.length < size * 3) playSession('vocabulario', 'medio', bank, progress).forEach(id => all.push(id));
  // los limites de ciclo caen a mitad de sesion, asi que se revisa por ventanas del tamano del banco
  for(let c = 0; c < 3; c++){
    const win = all.slice(c * size, (c + 1) * size);
    assert.strictEqual(new Set(win).size, size, 'ciclo ' + (c + 1) + ' con repetidos');
  }
});

test('al empezar un ciclo nuevo no abre con los ultimos vistos del ciclo anterior', () => {
  ctx.__len = 'corta';
  const bank = ctx.BANKS.speaking.facil, size = memberBankItems('speaking', bank).length; // 40, multiplo de 5
  assert.strictEqual(size % 5, 0);
  let violations = 0;
  for(let trial = 0; trial < 30; trial++){
    const progress = { sessions: [] }, all = [];
    while(all.length < size) playSession('speaking', 'facil', bank, progress).forEach(id => all.push(id));
    const tail = new Set(all.slice(-5));
    const next = playSession('speaking', 'facil', bank, progress);
    if(next.some(id => tail.has(id))) violations++;
  }
  assert.strictEqual(violations, 0, 'hubo ' + violations + ' ciclos que abrieron con ejercicios del final del ciclo anterior');
});

test('ejercicios nuevos en el banco entran al ciclo en curso sin reiniciar el progreso', () => {
  ctx.__len = 'corta';
  const bank = ctx.BANKS.writing.principiante.map(v => v.slice());
  const progress = { sessions: [] };
  const first = playSession('writing', 'principiante', bank, progress);
  const extra = Object.assign({}, bank[0][0], { id: 'writing-NUEVO-1' });
  bank.push([extra]);
  const all = [];
  const size = memberBankItems('writing', bank).length;
  while(first.length + all.length < size) playSession('writing', 'principiante', bank, progress).forEach(id => all.push(id));
  assert(all.includes('writing-NUEVO-1') || first.includes('writing-NUEVO-1'), 'el ejercicio nuevo nunca salio');
  const firstCycle = first.concat(all).slice(0, size);
  assert.strictEqual(new Set(firstCycle).size, size, 'hubo repetidos al agregar un ejercicio');
});

test('cada nivel y cada habilidad llevan su propio ciclo', () => {
  ctx.__len = 'larga';
  const progress = { sessions: [] };
  const a = playSession('gramatica', 'facil', ctx.BANKS.gramatica.facil, progress);
  const itemsMedio = memberBankItems('gramatica', ctx.BANKS.gramatica.medio);
  assert.strictEqual(computeCycleState(progress, itemsMedio.map(i => i.id), 3).seen.size, 0, 'el nivel medio heredo progreso de facil');
  const itemsVocab = memberBankItems('vocabulario', ctx.BANKS.vocabulario.facil);
  assert.strictEqual(computeCycleState(progress, itemsVocab.map(i => i.id), 3).seen.size, 0, 'vocabulario heredo gramatica');
  assert.strictEqual(a.length, 15);
});

test('ejercicios hechos en otras sesiones (Mixto, Plan, repaso) tambien cuentan y un repaso deliberado no rompe el ciclo', () => {
  ctx.__len = 'corta';
  const bank = ctx.BANKS.vocabulario.principiante;
  const items = memberBankItems('vocabulario', bank);
  const progress = { sessions: [
    { skill: 'mixto', level: 'principiante', startedAt: 1, results: [{ itemId: items[0].id, skill: 'vocabulario' }, { itemId: items[0].id, skill: 'vocabulario' }, { itemId: items[1].id }] },
    { skill: 'errores', level: 'principiante', startedAt: 2, results: [{ itemId: items[0].id }] }
  ] };
  const st = computeCycleState(progress, items.map(i => i.id), 3);
  assert.strictEqual(st.seen.size, 2);
  ctx.__progress = progress;
  const ids = resolveMemberPool({ skill: 'vocabulario', level: 'principiante', bankLevel: bank, saved: null }).pool.map(i => i.id);
  assert(!ids.includes(items[0].id) && !ids.includes(items[1].id), 'repitio ejercicios ya completados');
});

test('fallback: banco mas chico que la sesion, o vacio, no rompe ni repite', () => {
  ctx.__len = 'larga';
  ctx.__progress = { sessions: [] };
  const small = [[{ id: 's1' }, { id: 's2' }, { id: 's3' }]];
  const r = resolveMemberPool({ skill: 'speaking', level: 'x', bankLevel: small, saved: null });
  assert.strictEqual(r.pool.length, 3);
  assert.strictEqual(new Set(r.pool.map(i => i.id)).size, 3);
  const empty = resolveMemberPool({ skill: 'speaking', level: 'x', bankLevel: [], saved: null });
  assert.strictEqual(empty.pool.length, 0);
  const progress = { sessions: [] };
  for(let i = 0; i < 4; i++) assert.strictEqual(playSession('speaking', 'x', small, progress).length, 3);
});

test('retomar una sesion a medias reconstruye exactamente los mismos ejercicios y orden', () => {
  ctx.__len = 'media';
  ctx.__progress = { sessions: [] };
  const bank = ctx.BANKS.listening.medio;
  const r = resolveMemberPool({ skill: 'listening', level: 'medio', bankLevel: bank, saved: null });
  const saved = { variantIdxs: r.variantIdxs, itemIds: r.itemIds, total: r.pool.length, idx: 2, results: [], startedAt: 5 };
  const again = resolveMemberPool({ skill: 'listening', level: 'medio', bankLevel: bank, saved });
  assert.strictEqual(again.resumed, true);
  assert.deepStrictEqual(again.pool.map(i => i.id), r.pool.map(i => i.id));
  // si el banco cambio y ya no coincide, arma una sesion nueva y avisa con resumed=false
  const broken = Object.assign({}, saved, { itemIds: saved.itemIds.concat(['ya-no-existe']), total: saved.total + 1 });
  const fresh = resolveMemberPool({ skill: 'listening', level: 'medio', bankLevel: bank, saved: broken });
  assert.strictEqual(fresh.resumed, false);
  assert(fresh.pool.length > 0);
});

test('sesiones guardadas con la version anterior (variantIdxs) se siguen pudiendo retomar', () => {
  ctx.__len = 'media';
  const bank = ctx.BANKS.writing.facil;
  const legacy = { variantIdxs: [0, 1, 2], total: 6, idx: 1, results: [], startedAt: 1 };
  const r = resolveMemberPool({ skill: 'writing', level: 'facil', bankLevel: bank, saved: legacy });
  assert.strictEqual(r.resumed, true);
  assert.strictEqual(r.pool.length, 6);
});


test('Gramatica: cada sesion usa pocos temas (no peor que antes) y los temas se terminan juntos', () => {
  for(const level of Object.keys(ctx.BANKS.gramatica)){
    for(const [len, maxTopics] of [['corta', 3], ['media', 4], ['larga', 6]]){
      ctx.__len = len;
      const bank = ctx.BANKS.gramatica[level];
      const items = memberBankItems('gramatica', bank);
      const progress = { sessions: [] };
      const topicSessions = new Map(); // tema -> indices de sesion en que aparecio (primer ciclo)
      let count = 0, s = 0;
      while(count < items.length){
        ctx.__progress = progress;
        const r = resolveMemberPool({ skill: 'gramatica', level, bankLevel: bank, saved: null });
        const topics = new Set(r.pool.map(i => i.topic));
        assert(topics.size <= maxTopics, level + '/' + len + ': una sesion mezclo ' + topics.size + ' temas (max ' + maxTopics + ')');
        if(count + r.pool.length <= items.length) topics.forEach(tp => { if(!topicSessions.has(tp)) topicSessions.set(tp, []); topicSessions.get(tp).push(s); });
        progress.sessions.push({ skill: 'gramatica', level, startedAt: clock++, results: r.pool.map(i => ({ itemId: i.id })) });
        count += r.pool.length; s++;
      }
      // un tema nunca se reparte en mas de 2 sesiones seguidas (sesiones cortas parten un tema de 4 en 2)
      topicSessions.forEach((arr, tp) => assert(arr.length <= 2 && arr[arr.length - 1] - arr[0] <= 1, level + '/' + len + ': el tema "' + tp + '" quedo repartido en sesiones ' + arr.join(',')));
    }
  }
});

console.log(passed + ' pruebas pasaron' + (process.exitCode ? ' (hay fallas)' : ''));
