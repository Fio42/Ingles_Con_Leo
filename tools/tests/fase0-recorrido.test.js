/* Fase 0 (recorrido del alumno): el porqué de la recomendación sale de datos reales, el registro abre en modo registro,
   el visitante de miembros.html ve los enlaces públicos y la invitación de la cuenta gratis usa sus datos. Sin red ni navegador. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let p = 0, f = 0;
function test(name, fn){ try{ fn(); p++; console.log('  ok   ' + name); }catch(e){ f++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)); } }

function loadV2D(sessions, today){
  const ctx = { window: { ICL_V2: { enabled: true } }, document: {}, localStorage: { getItem(){ return null; }, setItem(){} },
    loadProgress: () => ({ sessions }), MISTAKE_PRIORITY: { QUICK_REVIEW_SIZE: 10 }, mistakeScore: e => e.fail_count, Date: class extends Date {
      constructor(...a){ if(a.length) super(...a); else super(today); } static now(){ return new Date(today).getTime(); } } };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  vm.runInContext(read('v2/v2-data.js').replace('window.V2D =', 'window.V2D = this.V2D ='), Object.assign(ctx, { window: ctx.window }));
  return ctx.window.V2D;
}
const HOY = '2026-11-27T15:00:00';

test('Curso a medias: dice cuándo lo practicó (hoy, ayer, hace N días)', () => {
  const V = loadV2D([], HOY);
  assert.strictEqual(V.whyCourse({ c: { lastDay: '2026-11-26' }, state: 'continue' }), 'Por qué: es el curso que llevas a medias: lo practicaste ayer.');
  assert.strictEqual(V.whyCourse({ c: { lastDay: '2026-11-20' }, state: 'continue' }), 'Por qué: es el curso que llevas a medias: lo dejaste hace 7 días.');
  assert.strictEqual(V.whyCourse({ c: { lastDay: '' }, state: 'continue' }), 'Por qué: es el curso que llevas a medias.');
});
test('Curso nuevo: primero de la ruta o el que sigue a uno terminado', () => {
  const V = loadV2D([], HOY);
  const a = { title: 'TO BE', finished: true }, b = { title: 'Pronombres' };
  assert.strictEqual(V.whyCourse({ c: a, state: 'start' }, [a, b]), 'Por qué: es el primer curso de la ruta de la Academia.');
  assert.strictEqual(V.whyCourse({ c: b, state: 'start' }, [a, b]), 'Por qué: sigue en la ruta después de «TO BE», que ya completaste.');
});
test('Sesión recomendada: errores pendientes con su tema y la habilidad más floja (con 8 respuestas o más)', () => {
  const res = n => Array.from({ length: 10 }, (_, i) => ({ isCorrect: i < n }));
  const V = loadV2D([{ skill: 'listening', date: '2026-11-25', results: res(5) }, { skill: 'gramatica', date: '2026-11-25', results: res(9) }], HOY);
  const mis = { active: [{ topic: 'There / Their', fails: 2, kind: 'gramatica' }, { topic: 'There / Their', fails: 1, kind: 'gramatica' }, { topic: 'To be', fails: 1, kind: 'gramatica' }] };
  assert.strictEqual(V.whyPlan(mis, 'Fácil A1-A2'), 'Por qué: tienes 3 errores pendientes de «There / Their» y Listening va en 50 % de aciertos este mes.');
  assert.strictEqual(loadV2D([], HOY).whyPlan({ active: [] }, 'Fácil A1-A2'), 'Por qué: es tu punto de partida en Fácil A1-A2; cada sesión se ajusta a tus errores.');
});
test('Registro: ?modo=registro abre el formulario de cuenta nueva con título propio y la entrada a la vista', () => {
  const h = read('miembros.html');
  assert(/get\('modo'\) === 'registro'\) authMode = 'signup'/.test(h));
  assert(/id="authTitle"/.test(h) && /Crea tu cuenta gratis/.test(h) && /Inicia sesión/.test(h) && /new-password/.test(h));
  ['articulo-pasado-continuo.html', 'articulo-hora-en-ingles.html', 'articulo-pronombres-personales-ingles.html'].forEach(n =>
    assert(/miembros\.html\?modo=registro&amp;volver=[a-z-]+\.html">crea tu cuenta/.test(read(n)), n));
});
test('miembros.html sin sesión: mismos enlaces que la portada; con sesión, los del alumno', () => {
  const h = read('miembros.html'), idx = read('index.html');
  const links = s => [...s.matchAll(/href="([^"]+)"[^>]*>([^<]+)</g)].map(m => m[1] + '|' + m[2]).join(',').replace('class="current"', '');
  const pub = h.match(/<nav class="nav-links nav-links--publica"[^>]*>([\s\S]*?)<\/nav>/)[1];
  const home = idx.match(/<nav class="nav-links">([\s\S]*?)<\/nav>/)[1];
  assert.strictEqual(links(pub), links(home));
  assert(/html:not\(\.icl-visitante\) \.nav-links--publica,html\.icl-visitante \.nav-links--miembro\{display:none!important\}/.test(read('style.css')));
});
test('Invitación de la cuenta gratis: datos reales, 3 beneficios y el resto plegado; mismo botón y mismo evento', () => {
  const a = read('app.js');
  assert(/function freeWallFacts\(\)/.test(a) && /En tu cuenta ya tienes/.test(a) && /Ver todo lo que incluye/.test(a));
  const top = a.slice(a.indexOf('const top3 = ['), a.indexOf('const rest = ['));
  assert(/Leo AI<\/strong>/.test(top) && /Método Leo/.test(top), 'Leo AI entre los beneficios principales');
  assert(/miembros\.html\?pagar=1" class="btn btn-primary" onclick="trackLeoEvent\('membership_cta_clicked'\)">Seguir practicando sin límite/.test(a));
});
test('Registro compacto: "¿Cómo nos conociste?" es opcional y se sigue enviando cuando se elige', () => {
  const h = read('miembros.html'), be = read('backend.js');
  assert(/¿Cómo nos conociste\? \(opcional\)/.test(h));
  assert(/signUp\(email, password, heardFromInput \? heardFromInput\.value : ''\)/.test(h));
  assert(/if\(heardFrom && \/\^\[a-z\]\{2,20\}\$\/\.test\(heardFrom\)\) creds\.options = \{ data: \{ heard_from: heardFrom \} \}/.test(be));
  assert(/@media \(max-width:600px\)\{\s*#gate\.gate-shell/.test(read('style.css')));
});
test('Test de nivel con la tipografía de la academia', () => {
  assert(/<main class="icl-tipo-v2">/.test(read('test-de-nivel-de-ingles.html')));
  assert(/main\.icl-tipo-v2\{font-family:var\(--v2-font-body\)\}/.test(read('style.css')));
});
test('Sin rayas largas en los textos nuevos', () => {
  const a = read('app.js'), d = read('v2/v2-data.js');
  const nuevo = a.slice(a.indexOf('function freeWallFacts'), a.indexOf('trackGuestFirstSession();'));
  assert(!/—/.test(nuevo) && !/—/.test(d.slice(d.indexOf('Fase 0'))));
});
console.log('\n' + p + ' pass, ' + f + ' fail'); process.exit(f ? 1 : 0);
