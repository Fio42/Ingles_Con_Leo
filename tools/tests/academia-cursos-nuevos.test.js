/* Cursos 9, 10 y 11 (Wh-questions, Presente continuo, In / On / At): integracion OCULTA. Genericos: revisa cada curso que exista. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const IDS = ['wh', 'presente-continuo', 'in-on-at'];
let ok = 0, bad = 0;
function test(name, fn){ try{ fn(); ok++; console.log('  ok  ' + name); }catch(e){ bad++; console.log('  FALLA ' + name + '\n  ' + (e && e.message)); } }
const A = vm.runInNewContext(read('academia-data.js') + ';ACADEMIA');
const M = vm.runInNewContext(read('academia-motor.js') + ';ACADEMIA_MOTOR');
const CU = vm.runInNewContext(read('academia-cursos.js') + ';ACADEMIA_CURSOS');
const js = read('academia.js');
console.log('Cursos nuevos (ocultos)');
IDS.forEach(id => {
  const c = A.courses[id];
  if(!c){ console.log('  (curso ' + id + ' aun no integrado: se omite)'); return; }
  test(id + ': esqueleto publico protegido, 5 lecciones x 8 ejercicios, 30 de practica, sin contenido', () => {
    assert.strictEqual(c.protected, true); assert.strictEqual(c.lessons.length, 5);
    c.lessons.forEach(l => { assert.strictEqual(l.activityIds.length, 8, 'leccion ' + l.n); assert(!l.activities || !l.activities.length, 'sin contenido en el esqueleto'); });
    assert.strictEqual(c.exam.practiceIds.length, 30); assert.deepStrictEqual(Array.from(c.exam.bank || []), []);
    assert(!/"correct"|"answer"/.test(JSON.stringify(c)), 'sin respuestas en lo publico');
  });
  test(id + ': OCULTO (ruta soon, puente y listado cerrados) y en la lista de cursos de academia.js', () => {
    const r = A.route.courses.find(x => x.id === id); assert(r && r.soon === true, 'soon en la ruta');
    assert.strictEqual(M.courses[id].open, false); assert.strictEqual(CU.courses[id].open, false);
    assert(new RegExp("'" + id + "'[,\\]]").test(js.split('SHELL.apps[id] = makeApp(id)')[0].slice(-400)), 'esta en la lista de academia.js');
  });
  test(id + ': migracion APAGADA y seeds solo de este curso', () => {
    const f = fs.readdirSync(path.join(root, 'supabase/migrations')).find(n => n.includes('academia_curso_' + id.replace(/-/g, '_')));
    assert(f, 'hay migracion'); const sql = read('supabase/migrations/' + f);
    assert(/values \('[a-z-]+', '[^']+', false,/.test(sql), 'enabled=false'); assert(!/enabled = true|drop |delete |truncate /i.test(sql.replace(/^--.*$/mg, '')));
  });
  const priv = path.join(root, 'private');
  if(fs.existsSync(path.join(priv, 'contenido', id + '.audio.json'))){
    test(id + ': audio privado: cada texto tiene su mp3 no vacio y no sobran', () => {
      const map = JSON.parse(fs.readFileSync(path.join(priv, 'contenido', id + '.audio.json'), 'utf8')); const used = new Set();
      Object.keys(map).forEach(t => { const f = path.join(priv, 'audio', map[t]); assert(fs.existsSync(f) && fs.statSync(f).size > 3000, 'falta ' + t); used.add(path.basename(map[t])); });
      fs.readdirSync(path.join(priv, 'audio', id)).filter(n => n.endsWith('.mp3')).forEach(n => assert(used.has(n), 'sobra ' + n));
    });
  }
});
console.log('\n' + ok + ' pruebas ok' + (bad ? ', ' + bad + ' FALLARON' : '')); process.exit(bad ? 1 : 0);
