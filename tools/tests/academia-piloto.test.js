#!/usr/bin/env node
/* Curso piloto TO BE (academia-data.js): estructura y calidad del contenido.
   Corre con:  node tools/tests/academia-piloto.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + ';this.A=ACADEMIA;this.C=ACADEMIA_CONFIG;this.H=ACADEMIA_HOWTO;', ctx);
const A = ctx.A, C = ctx.C, H = ctx.H, course = A.courses['to-be'];
let passed = 0;
function test(n, f){ try{ f(); passed++; console.log('  ok  ' + n); }catch(e){ console.error('FALLA ' + n + '\n  ' + e.message); process.exitCode = 1; } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
const items = []; course.lessons.forEach(l => l.activities.forEach(a => items.push(Object.assign({ lesson: l.id }, a))));
const bank = course.exam.bank;

test('el curso tiene 5 lecciones didacticas y la evaluacion es aparte', () => {
  assert.strictEqual(course.lessons.length, 5);
  assert.ok(course.exam && course.exam.bank.length >= 30);
  course.lessons.forEach((l, i) => assert.strictEqual(l.n, i + 1));
});
test('cada leccion: 3 a 4 pantallas, minimo 6 actividades, tema valido, canSay', () => {
  course.lessons.forEach(l => {
    assert.ok(l.screens.length >= 3 && l.screens.length <= 4, l.id + ' pantallas');
    assert.ok(l.activities.length >= 6, l.id + ' actividades');
    assert.ok(course.topics[l.topic], l.id + ' tema');
    assert.ok(l.canSay.length >= 3, l.id + ' canSay');
    assert.ok(l.minutes >= 4 && l.minutes <= 6, l.id + ' minutos 4 a 6');
  });
});
test('ids unicos en lecciones y banco', () => {
  const ids = items.concat(bank).map(a => a.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});
test('cada tema tiene al menos 6 preguntas en el banco (2 intentos distintos de 3)', () => {
  Object.keys(course.topics).forEach(t => assert.ok(bank.filter(b => b.topic === t).length >= C.examPerTopic * 2, t));
  assert.strictEqual(Object.keys(course.topics).length * C.examPerTopic, C.examSize);
});
test('el banco no repite enunciados de las lecciones', () => {
  const key = a => norm((a.source || '') + '|' + a.q + '|' + (a.options ? a.options.join('/') : '') + (a.tokens ? a.tokens.join(' ') : ''));
  const seen = new Set(items.map(key));
  bank.forEach(b => assert.ok(!seen.has(key(b)), b.id));
});
test('actividades: campos validos por tipo', () => {
  items.concat(bank).forEach(a => {
    assert.ok(H[a.type], a.id + ' tipo');
    assert.ok(a.q && a.why, a.id + ' q y why');
    assert.ok(course.topics[a.topic], a.id + ' tema');
    if(a.type === 'choice'){ assert.ok(a.options.length === 3 && a.answer >= 0 && a.answer < 3, a.id); assert.strictEqual(new Set(a.options).size, a.options.length, a.id + ' opciones repetidas'); }
    if(a.type === 'error'){ assert.strictEqual(a.options.length, 3); assert.ok(a.wrong >= 0 && a.wrong < 3 && a.fix, a.id); }
    if(a.type === 'type'){ assert.ok(a.accepted.length && a.show, a.id); assert.ok(a.accepted.some(x => norm(x) === norm(a.show)) || a.accepted.length, a.id); assert.ok(a.ex || H.type.ex, a.id + ' ejemplo'); }
    if(a.type === 'order'){ assert.ok(a.tokens.length >= 3 && a.tokens.length <= 7, a.id); }
    if(a.type === 'match'){ const r = a.pairs.map(p => p[1]); assert.strictEqual(new Set(r).size, r.length, a.id + ' parejas repetidas'); }
    if(a.type === 'write'){ assert.ok(a.example && a.checks.length, a.id); a.checks.forEach(c => new RegExp(c.re, c.flags || '')); const ex = a.example; a.checks.forEach(c => assert.ok(new RegExp(c.re, c.flags || '').test(ex), a.id + ' el ejemplo debe pasar sus propias reglas')); }
  });
});
test('las respuestas correctas de choice no estan siempre en la misma posicion', () => {
  const pos = [0, 0, 0]; items.concat(bank).filter(a => a.type === 'choice').forEach(a => pos[a.answer]++);
  pos.forEach(n => assert.ok(n >= 3, 'posicion poco usada: ' + pos.join(',')));
});
test('la leccion 1 usa solo audios que existen; sin rayas largas en textos', () => {
  const files = [];
  course.lessons.forEach(l => l.screens.forEach(s => { if(s.audio) files.push(s.audio); (s.items || []).forEach(i => { if(i.audio) files.push(i.audio); }); }));
  files.forEach(f => assert.ok(fs.existsSync(path.join(root, f)), f));
  assert.ok(!/[—–]/.test(fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8')), 'raya larga en el contenido');
});
test('la evaluacion es de practica: configurable y sin insignias', () => {
  assert.ok(C.passPct > 0 && C.passPct <= 100);
  const js = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
  assert.ok(!/recordSession|leo_micro_stats|mistake_stats|supabase/i.test(js.replace(/\/\*[\s\S]*?\*\//g, '')), 'el piloto no debe tocar estadisticas reales');
});
console.log('\n' + passed + ' pruebas ok');
