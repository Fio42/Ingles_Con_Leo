#!/usr/bin/env node
// Genera supabase/functions/leo-ai/riso-ejercicios.json: índice SERVIDOR de los ejercicios de práctica (GRAMMAR_BANK)
// para validar el modo "sobre el ejercicio" de Riso. El navegador solo manda el id del ejercicio y la respuesta elegida;
// el enunciado y la respuesta correcta salen de aquí, no del navegador. Las evaluaciones de la Academia NO están en el
// índice, así que Riso no puede usarse con ellas.
// También copia el motor del tutor junto a la función (riso-motor.js) para repetir el filtro en el servidor.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const ctx = { window: {}, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8') + ';this.G = GRAMMAR_BANK;', ctx);
const out = {};
for (const lv in ctx.G) for (const v of ctx.G[lv]) for (const t of v) for (const it of t.items) {
  let e, o, c;
  if (it.type === 'choice') { e = it.prompt; o = it.options; c = it.options[it.correct]; }
  else if (it.type === 'fill') { e = it.sentence.join(' ').replace(/ ([?.!,])/g, '$1'); o = it.bank; c = it.correct; }
  else if (it.type === 'error') { e = it.wrong; o = [it.wrongWord, it.rightWord]; c = it.right; }
  else continue;
  out[it.id] = { t: t.topic, e, o, c };
}
const dir = path.join(root, 'supabase/functions/leo-ai');
fs.writeFileSync(path.join(dir, 'riso-ejercicios.json'), JSON.stringify(out));
fs.copyFileSync(path.join(root, 'riso/tutor/riso-tutor.js'), path.join(dir, 'riso-motor.js'));
// Lista de ejercicios para la base (riso_items): solo ids y opciones, sin enunciados ni respuestas correctas.
const q = (x) => "'" + String(x).replace(/'/g, "''") + "'";
const filas = Object.entries(out).map(([id, it]) => '(' + q(id) + ', array[' + it.o.map(q).join(', ') + ']::text[])');
fs.writeFileSync(path.join(root, 'supabase/pendientes/20261128b_riso_items.sql'),
  '-- Generado por tools/tutor/generar_indice_ejercicios.js. PENDIENTE, NO EJECUTADO. Va después de 20261128_riso_chat_piloto.sql.\n' +
  '-- Ejercicios de práctica en los que se puede usar «Pregúntale a Riso sobre este ejercicio» (sin evaluaciones de la Academia).\n' +
  'insert into public.riso_items (id, opciones) values\n' + filas.join(',\n') + '\non conflict (id) do update set opciones = excluded.opciones;\n');
console.log('ejercicios', Object.keys(out).length, 'bytes', fs.statSync(path.join(dir, 'riso-ejercicios.json')).size);
