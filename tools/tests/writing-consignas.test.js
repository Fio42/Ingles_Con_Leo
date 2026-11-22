#!/usr/bin/env node
/* Writing: la consigna explica que escribir en cada hueco y lo que se corrige coincide con lo que se pidio.
   Usa data.js y app.js REALES (navegador simulado, sin red).
   Corre con:  node tools/tests/writing-consignas.test.js   (desde la carpeta inglesconLeo)

   Lo que se protege (todos los niveles):
   1. La pista (item.hint) se muestra SIEMPRE antes de responder y no es solo la plantilla repetida ("Estructura esperada: ___ is ___ than ___").
   2. Principiante y Facil: cada ejercicio con huecos trae en la pista un ejemplo completo ("Ejemplo: ...") distinto al que se ve al corregir,
      y ese ejemplo pasa la correccion del propio ejercicio (la pista nunca ensena algo que se rechaza).
   3. Todo ejemplo de la correccion pasa la correccion.
   4. Si la consigna pide "more", la pista habla de "more", el patron exige "more" y el ejemplo lo usa.
   5. Respuestas naturales que la consigna permite no se rechazan (the guitar, 7 o'clock, twenty, more expensive, isn't she?...).
   6. Respuestas que NO cumplen lo pedido se siguen rechazando (stronger cuando se pidio "more", "I have a car" como presente perfecto). */
'use strict';
const { A } = require('./lib/cargar-app');
const assert = require('assert');
let passed = 0, failed = 0;
function test(name, fn){ try{ fn(); passed++; console.log('  ok  ' + name); }catch(e){ failed++; console.log('  FAIL ' + name + '\n       ' + String((e && e.message) || e).split('\n').slice(0, 6).join('\n       ')); } }

const items = [];
Object.keys(A.WRITING_BANK).forEach(lv => A.WRITING_BANK[lv].forEach(v => v.forEach(it => items.push(Object.assign({ lv }, it)))));
const byId = id => { const it = items.find(i => i.id === id); assert(it, 'no existe ' + id); return it; };
const hasBlank = it => /___/.test(it.prompt) || /___/.test(it.hint);
const exampleInHint = it => { const m = /Ejemplo:\s*(.+)$/.exec(it.hint); return m ? m[1].trim() : null; };
const ok = (id, text) => A.evaluateWritingAnswer(text, byId(id)).isOk;

console.log('Writing (consignas claras: ' + items.length + ' ejercicios)');

test('hay ejercicios en los 4 niveles', () => {
  ['principiante', 'facil', 'medio', 'avanzado'].forEach(lv => assert(items.some(i => i.lv === lv), 'sin ejercicios en ' + lv));
});

test('1. la pista se muestra siempre antes de responder', () => {
  const bad = items.filter(it => { const h = A.writingPreHintHtml(it); return !/class="writing-pre-hint"/.test(h) || !/<b>Pista:<\/b>/.test(h); }).map(i => i.id);
  assert.deepStrictEqual(bad, []);
});

test('1. la pista no es solo la plantilla repetida', () => {
  const norm = t => String(t).toLowerCase().replace(/[“”"'‘’.,;:!?_…]/g, '').replace(/\s+/g, ' ').trim();
  const bad = items.filter(it => {
    const h = String(it.hint).trim();
    if(/^Estructura esperada:\s*[“"][^”"]*[”"]\.?$/i.test(h)) return true;           // solo la plantilla
    const q = h.match(/[“"]([^”"]+)[”"]/);
    return !!(q && norm(h.replace(/^Estructura esperada:\s*/i, '')) === norm(q[1]));       // la pista es solo una cita
  }).map(i => i.id);
  assert.deepStrictEqual(bad, []);
});

test('1. con huecos, la pista dice que va en ellos (tiene mas texto que la plantilla)', () => {
  const bad = items.filter(it => hasBlank(it) && String(it.hint).replace(/[“"][^”"]*[”"]/g, '').replace(/___/g, '').trim().length < 40).map(i => i.id);
  assert.deepStrictEqual(bad, []);
});

test('2. principiante y facil con huecos: la pista trae un ejemplo completo y distinto al de la correccion', () => {
  const lv = it => it.lv === 'principiante' || it.lv === 'facil';
  const sin = items.filter(it => lv(it) && hasBlank(it) && !exampleInHint(it)).map(i => i.id);
  assert.deepStrictEqual(sin, [], 'sin ejemplo en la pista');
  const igual = items.filter(it => lv(it) && exampleInHint(it) && exampleInHint(it).toLowerCase() === String(it.example.en).toLowerCase()).map(i => i.id);
  assert.deepStrictEqual(igual, [], 'el ejemplo de la pista es el mismo de la correccion');
});

test('2. el ejemplo de la pista pasa la correccion del propio ejercicio', () => {
  const bad = items.filter(it => exampleInHint(it) && !A.evaluateWritingAnswer(exampleInHint(it), it).isOk).map(i => i.id + ' -> ' + exampleInHint(i));
  assert.deepStrictEqual(bad, []);
});

test('3. el ejemplo de la correccion pasa la correccion', () => {
  const bad = items.filter(it => !A.evaluateWritingAnswer(it.example.en, it).isOk).map(i => i.id + ' -> ' + i.example.en);
  assert.deepStrictEqual(bad, []);
});

test('4. "more": consigna, pista, patron y ejemplo hablan de lo mismo', () => {
  const asks = items.filter(it => /is more ___ than|is more\b.*\bthan/i.test(it.prompt));
  assert(asks.length >= 2, 'no se encontraron las consignas con more');
  asks.forEach(it => {
    assert(/more/i.test(it.hint), it.id + ': la pista no menciona more: ' + it.hint);
    assert(/\bmore\b/.test(it.checkPattern), it.id + ': el patron no exige more');
    assert(/\bmore\b/i.test(it.example.en), it.id + ': el ejemplo no usa more: ' + it.example.en);
    assert(/\bmore\b/i.test(exampleInHint(it) || ''), it.id + ': el ejemplo de la pista no usa more');
    assert(!/-er\b/.test(it.checklist.join(' ')) || /more/.test(it.checklist.join(' ')), it.id + ': la lista habla de -er');
  });
});

test('4. w-facil8-2: la consigna y la pista ya no se contradicen', () => {
  const it = byId('w-facil8-2');
  assert(/___ is more ___ than ___/.test(it.prompt));
  assert(/is more/.test(it.hint) && /adjetivo/.test(it.hint));
});

test('5. respuestas naturales permitidas por la consigna', () => {
  const casos = [
    ['w-facil8-2', 'Pizza is more delicious than salad.'], ['w-facil10-3', 'Chess is more difficult than checkers.'],
    ['w-facil-m200-2', 'A phone is more expensive than a book.'], ['w-facil-m200-2', 'My sister is taller than me.'],
    ['w-facil7-4', 'A horse is faster than a dog.'], ['w-facil3-2', 'Tea is more popular than coffee.'], ['w-facil6-1', 'A rabbit is faster than a turtle.'],
    ['w-principiante4-2', 'She plays the guitar well.'], ['w-principiante4-2', 'He sings well.'],
    ['w-principiante3-4', 'I am twenty years old.'], ['w-principiante3-4', 'I am 25 years old.'], ['w-principiante3-4', 'I am thirty-five years old.'],
    ['w-principiante6-5', "It is 7 o'clock."], ['w-principiante-m200-5', 'It is 11 oclock.'],
    ['w-principiante-3', 'I have 2 brothers.'], ['w-principiante2-2', 'I have 4 books.'],
    ['w-principiante6-8', 'I feel good.'], ['w-principiante4-3', 'It is warm today.'], ['w-principiante6-1', 'I like the color grey.'],
    ['w-facil10-7', 'I work as an engineer.'], ['w-facil10-7', 'I study biology.'],
    ['w-medio-m100-1', "She is tall, isn't she?"], ['w-medio-m100-1', "You like pizza, don't you?"], ['w-medio-m100-1', "They live here, don't they?"],
    ['w-medio2-3', 'She enjoys cooking on weekends.'], ['w-medio2-3', 'He hated waiting in line.'],
    ['w-avz5-3', 'She told me she had already left.'], ['w-avz-4', 'The window was stolen last night.'], ['w-avanzado-m100-1', 'The door must be locked at night.'],
    ['w-medio-2', 'They had left before I arrived.'], ['w-medio-2', 'She had gone home early.'],
    ['w-medio2-1', 'I have tried sushi.'], ["w-medio2-1", "I've been to Peru."], ['w-medio10-3', 'I have learned to cook.'], ['w-medio10-3', "I've written two books."]
  ];
  const bad = casos.filter(([id, t]) => !ok(id, t)).map(([id, t]) => id + ' -> ' + t);
  assert.deepStrictEqual(bad, []);
});

test('6. lo que no cumple lo pedido se sigue rechazando', () => {
  const casos = [
    ['w-facil8-2', 'Coffee is stronger than tea.'], ['w-facil10-3', 'Coffee is stronger than tea.'],
    ['w-medio10-3', 'I have a car.'], ['w-medio2-1', 'I have a dog.'],
    ['w-principiante3-4', 'I am happy years old.'], ['w-principiante6-5', 'It is blue o\'clock.'],
    ['w-facil-m200-2', 'My sister is tall than me.'], ['w-medio-m100-1', 'You like pizza, am I?']
  ];
  const bad = casos.filter(([id, t]) => ok(id, t)).map(([id, t]) => id + ' -> ' + t);
  assert.deepStrictEqual(bad, []);
});

test('6. al fallar con "stronger" la pista dice que falta more', () => {
  const r = A.evaluateWritingAnswer('Coffee is stronger than tea.', byId('w-facil8-2'));
  assert.strictEqual(r.isOk, false);
  assert(/is more/.test(r.hint) && /sin -er/.test(r.hint), r.hint);
});

test('concordancia en el ejercicio de gerundio: She enjoys / They enjoy si, They enjoys / He enjoy no', () => {
  ['w-medio2-3', 'w-medio5-2'].forEach(id => {
    ['She enjoys cooking.', 'They enjoy cooking.', 'I enjoy reading.', 'My sister enjoys painting.'].forEach(t => assert(ok(id, t), id + ' deberia aceptar: ' + t));
    ['They enjoys cooking.', 'He enjoy cooking.', 'We enjoys swimming.'].forEach(t => assert(!ok(id, t), id + ' deberia rechazar: ' + t));
  });
  const r = A.evaluateWritingAnswer('They enjoys cooking.', byId('w-medio2-3'));
  assert(/concordancia/.test(r.hint) && /They enjoy/.test(r.hint), r.hint);
});

test('more: acepta "more interesting" y rechaza "more stronger" / "more bigger" (todos los ejercicios con more)', () => {
  ['w-facil8-2', 'w-facil10-3', 'w-facil3-2', 'w-facil-m200-2', 'w-medio-4'].forEach(id => {
    ['This book is more interesting than that one.', 'Tea is more bitter than milk.'].forEach(t => assert(ok(id, t), id + ' deberia aceptar: ' + t));
    ['Coffee is more stronger than tea.', 'A car is more bigger than a bike.'].forEach(t => assert(!ok(id, t), id + ' deberia rechazar: ' + t));
  });
  const r = A.evaluateWritingAnswer('Coffee is more stronger than tea.', byId('w-facil8-2'));
  assert(/no more stronger/.test(r.hint), r.hint);
});

test('w-avanzado-m300-2: la consigna ya no dice "condicional tipo 3" para un modal perfecto', () => {
  assert(!/condicional tipo 3/i.test(byId('w-avanzado-m300-2').prompt));
});

console.log('\n  ' + passed + ' ok, ' + failed + ' con fallo');
process.exit(failed ? 1 : 0);
