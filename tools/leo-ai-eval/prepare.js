#!/usr/bin/env node
/* Arma los 32 pedidos ANTES (baseline) y DESPUÉS (código vigente) con el app.js y el leo-ai.ts reales y los guarda en
   tools/leo-ai-eval/out/cases.json. NO llama a ninguna IA. Muestra cuánto crece el pedido (neurons de entrada).
     node tools/leo-ai-eval/prepare.js */
const fs = require('fs'), path = require('path');
const { root, loadApp, loadServer, findItem } = require('./lib');
const cases = require('./cases');
const app = loadApp();
const before = loadServer(path.join(__dirname, 'baseline', 'leo-ai.before-2026-10-15.ts'));
const after = loadServer(path.join(root, 'supabase_functions', 'leo-ai.ts'));
const out = []; let tb = 0, ta = 0;
for(const c of cases){
  const f = findItem(app, c.id); if(!f) throw new Error('no existe ' + c.id);
  const it = f.it; let userAnswer;
  if(f.kind === 'vocab') userAnswer = it.quiz.options[c.wrong];
  else if(it.type === 'choice') userAnswer = it.options[c.wrong];
  else if(it.type === 'fill') userAnswer = it.bank[c.wrong];
  else userAnswer = it.wrongWord;
  const payload = app.buildLeoAiPayload({ kind:f.kind, item:it, userAnswer, isCorrect:false });
  if(!payload) throw new Error('sin payload ' + c.id);
  const oldPayload = JSON.parse(JSON.stringify(payload)); delete oldPayload.shownExamples;   // el baseline no mandaba los ejemplos mostrados
  const pb = before.buildPrompt('explain', oldPayload), pa = after.buildPrompt('explain', payload);
  tb += (pb.rules.length + pb.text.length); ta += (pa.rules.length + pa.text.length);
  out.push({ n: out.length + 1, ...c, topic: f.topic || ('Vocab: ' + it.word), question: payload.question, student: payload.studentAnswer, correct: payload.correctAnswer,
    base: payload.baseExplanation, shown: payload.shownExamples || [],
    before: { rules: pb.rules, text: pb.text }, after: { rules: pa.rules, text: pa.text, check: pa.check } });
}
fs.mkdirSync(path.join(__dirname, 'out'), { recursive:true });
fs.writeFileSync(path.join(__dirname, 'out', 'cases.json'), JSON.stringify(out, null, 1));
const nb = (tb / 3.6) * 9091 / 1e6 / out.length, na = (ta / 3.6) * 9091 / 1e6 / out.length;
console.log(out.length + ' casos. Caracteres de entrada por pedido: antes ' + Math.round(tb / out.length) + ', despues ' + Math.round(ta / out.length)
  + ' (~' + nb.toFixed(1) + ' -> ~' + na.toFixed(1) + ' neurons de ENTRADA por pedido (estimado); la salida sigue topada en 220 tokens).');
