#!/usr/bin/env node
/* Tarjeta de feedback de Miembros: contrato del codigo (sin red ni navegador).
   El comportamiento en navegador (movil 2x5, enviar, Ahora no, no competir) se verifico con Chromium real;
   la logica de base de datos esta en member-feedback-sql.test.js (PGlite, si esta instalado). */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const app = read('app.js'), css = read('style.css'), html = read('miembros.html'), backend = read('backend.js');
const sqlm = read('supabase/migrations/20261008190000_member_feedback.sql');
const card = app.slice(app.indexOf('const FEEDBACK_CARD_KEY'), app.indexOf('PÁGINA DE PROGRESO (progreso.html)'));
let p = 0, f = 0;
function test(n, fn){ try { fn(); p++; console.log('  ok   ' + n); } catch(e){ f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }

test('La tarjeta existe en el panel, justo despues de la sugerencia de nivel, y se inicia una vez', () => {
  assert(/id="levelSuggest" hidden><\/div>\n\s*<div class="fb-wrap" id="feedbackCard" hidden><\/div>/.test(html));
  assert(/renderFeedbackCard\(document\.getElementById\('feedbackCard'\), \['levelSuggest', 'dashAnnounce'\]\)/.test(html));
  assert(/el\.dataset\.fbInit/.test(card));
});
test('Sin popup ni modal', () => { assert(!/role="dialog"|aria-modal|position:\s*fixed/.test(card + css.slice(css.indexOf('.fb-wrap'), css.indexOf('.fb-wrap') + 2200))); });
test('Texto plano: el comentario nunca se inserta como HTML', () => {
  assert(/txt\.value/.test(card)); assert(!/innerHTML\s*\+?=\s*[^;]*txt\.value/.test(card));
});
test('No pide nombre ni email y no manda datos de contexto desde el navegador', () => {
  assert(!/email|nombre|display_name/i.test(card.replace(/Inglés con Leo/g, '')));
  assert(/submitMemberFeedback\(score, /.test(card) && !/submitMemberFeedback\(score, [^)]*level/.test(card));
});
test('Textos exactos pedidos', () => {
  for(const t of ['¿Qué mejorarías o qué te está gustando más?', 'Enviar', 'Ahora no', 'Gracias por ayudarme a mejorar']) assert(card.includes(t), t);
  assert(!/—/.test(card));
});
test('Limite de comentario coincide: 600 en pagina y en la base', () => { assert(/MAX_COMMENT: 600/.test(card)); assert(/char_length\(comment\) <= 600/.test(sqlm) && /char_length\(v_comment\) > 600/.test(sqlm)); });
test('Calendario coincide con lo aprobado (7 dias local; 7/30/90 y 90 tras responder en la base)', () => {
  assert(/LATER_MS: 7 \* 86400000/.test(card) && /ANSWERED_MS: 90 \* 86400000/.test(card));
  assert(/interval '5 days'/.test(sqlm) && /limit 3\) s/.test(sqlm) && /interval '7 days'/.test(sqlm) && /interval '30 days'/.test(sqlm));
  assert((sqlm.match(/interval '90 days'/g) || []).length >= 3);
});
test('Movil: 2 filas de 5 con botones de al menos 44 px', () => {
  assert(/@media \(max-width:560px\)\{\s*\.fb-scale\{grid-template-columns:repeat\(5,/.test(css));
  assert(/\.fb-num\{min-height:46px/.test(css));
});
test('Discreta frente a la sugerencia de nivel (borde fino, no azul)', () => {
  assert(/\.fb-card\{background:#fff;border:1px solid var\(--line\)/.test(css));
});
test('Backend: solo llama funciones de la base y nunca lanza error', () => {
  for(const fn of ['member_feedback_status', 'submit_member_feedback', 'dismiss_member_feedback']) assert(backend.includes("rpc('" + fn + "'"), fn);
  assert(/feedbackCardStatus, submitMemberFeedback, dismissMemberFeedback/.test(backend));
});
test('Base: RLS activa, sin escritura directa, funciones solo para usuarios con sesion', () => {
  assert(/alter table public\.member_feedback enable row level security/.test(sqlm) && /alter table public\.member_feedback_state enable row level security/.test(sqlm));
  assert(/revoke all on public\.member_feedback from anon, authenticated/.test(sqlm) && /grant select on public\.member_feedback to authenticated/.test(sqlm));
  assert(!/grant (insert|update|delete)/.test(sqlm));
  assert((sqlm.match(/security definer\nset search_path = public, pg_temp/g) || []).length === 4);
  assert(/revoke all on function public\._member_feedback_status\(uuid\) from public, anon, authenticated/.test(sqlm));
  assert(!/plan|email|name/i.test(sqlm.slice(sqlm.indexOf('create table if not exists public.member_feedback ('), sqlm.indexOf('create index'))));
});
test('Version de recursos subida en todas las paginas', () => {
  for(const f2 of fs.readdirSync(root).filter(x => x.endsWith('.html'))){
    const h = fs.readFileSync(path.join(root, f2), 'utf8');
    assert(!/app\.js\?v=20261008a|backend\.js\?v=20261007b|style\.css\?v=20261008a/.test(h), f2);
  }
});
console.log(`\n${p} ok, ${f} fallaron`); process.exit(f ? 1 : 0);
