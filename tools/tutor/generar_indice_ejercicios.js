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
const out = {}, malos = [];
// Explicación que el alumno YA vio en la corrección (texto plano, recortado): Riso la recibe para no repetirla y aportar algo nuevo.
const plano = h => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
for (const lv in ctx.G) for (const v of ctx.G[lv]) for (const t of v) for (const it of t.items) {
  let e, o, c;
  if (it.type === 'choice') { e = it.prompt; o = it.options; c = it.options[it.correct]; }
  else if (it.type === 'fill') { e = it.sentence.join(' ').replace(/ ([?.!,])/g, '$1'); o = it.bank; c = it.correct; }
  else if (it.type === 'error') {
    // Mismo ejercicio y misma regla que la práctica real (app.js, renderGrammarItemInto, tipo 'error'): el alumno TOCA la
    // palabra incorrecta de la frase; acierta si el índice tocado cae dentro de wrongWord, comparando palabras sin
    // signos de puntuación. La respuesta del alumno viaja como el índice de la palabra tocada ("0", "1", ...).
    const tok = it.wrong.split(' '), limpio = tok.map(w => w.replace(/[.,?!]/g, ''));
    const ww = it.wrongWord ? it.wrongWord.split(' ') : [];
    let ini = -1;
    for (let i = 0; ww.length && i <= limpio.length - ww.length; i++) if (limpio.slice(i, i + ww.length).join(' ') === it.wrongWord) { ini = i; break; }
    if (ini < 0) { malos.push(it.id); continue; }
    out[it.id] = { t: t.topic, k: 'error', e: it.wrong, p: tok, s: [ini, ini + ww.length - 1], c: it.wrongWord, f: it.right, x: plano(it.explain) };
    continue;
  }
  else continue;
  out[it.id] = { t: t.topic, e, o, c, x: plano(it.explain) };
}
const dir = path.join(root, 'supabase/functions/leo-ai');
fs.writeFileSync(path.join(dir, 'riso-ejercicios.json'), JSON.stringify(out));
fs.copyFileSync(path.join(root, 'riso/tutor/riso-tutor.js'), path.join(dir, 'riso-motor.js'));
if (malos.length) { console.error('ejercicios de error sin palabra marcable:', malos.join(', ')); process.exitCode = 1; }
console.log('ejercicios', Object.keys(out).length, 'bytes', fs.statSync(path.join(dir, 'riso-ejercicios.json')).size);
