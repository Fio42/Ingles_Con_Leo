#!/usr/bin/env node
/* Inicio del alumno: regla "Continuar curso" (inicio-alumno.js) y contrato de la navegación. Sin red.
   Corre con:  node tools/tests/inicio-alumno.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const IA = require(path.join(root, 'inicio-alumno.js'));
let p = 0, f = 0;
function test(n, fn){ try{ fn(); p++; console.log('  ok   ' + n); }catch(e){ f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }
const CUR = { enabled: true, courses: { 'to-be': { title: 'TO BE', open: true, lessons: 5 }, 'pronombres': { title: 'Pronombres', open: true, lessons: 5 }, 'futuro': { title: 'Oculto', open: false, lessons: 5 } } };
const mk = o => ({ getItem: k => (k in o ? JSON.stringify(o[k]) : null) });
const st = (done, days, resume) => { const l = {}; for(let i = 1; i <= done; i++) l['l' + i] = { done: true }; return { lessons: l, days: days || [], resume: resume || {} }; };

test('Cursos ocultos (open:false) o motor apagado nunca aparecen', () => {
  assert.deepStrictEqual(IA.list(CUR, mk({})).map(c => c.id), ['to-be', 'pronombres']);
  assert.deepStrictEqual(IA.list({ enabled: false, courses: CUR.courses }, mk({})), []);
  assert.deepStrictEqual(IA.list(undefined, mk({})), []);
});
test('Nadie empezó: "Ir a la Academia", sin barra y sin nombrar un curso', () => {
  const v = IA.view(IA.list(CUR, mk({})));
  assert.strictEqual(v.state, 'start'); assert.strictEqual(v.cta, 'Ir a la Academia'); assert.strictEqual(v.pct, null); assert.strictEqual(v.href, 'academia.html');
});
test('Un curso empezado: "Continuar curso", lección siguiente y porcentaje real', () => {
  const v = IA.view(IA.list(CUR, mk({ leo_academia_piloto_v1: st(2, ['2026-10-20']) })));
  assert.strictEqual(v.state, 'continue'); assert.strictEqual(v.cta, 'Continuar curso'); assert.strictEqual(v.meta, 'Lección 3 de 5'); assert.strictEqual(v.pct, 40);
  assert.strictEqual(v.href, 'academia.html#/curso/to-be');
});
test('Varios empezados: gana el de actividad más reciente (no se asume TO BE)', () => {
  const v = IA.view(IA.list(CUR, mk({ leo_academia_piloto_v1: st(3, ['2026-10-10']), leo_academia_v1_pronombres: st(1, ['2026-10-25']) })));
  assert.strictEqual(v.course.id, 'pronombres'); assert.strictEqual(v.meta, 'Lección 2 de 5');
});
test('Empate de día: más lecciones hechas; luego el primero', () => {
  let v = IA.view(IA.list(CUR, mk({ leo_academia_piloto_v1: st(1, ['2026-10-25']), leo_academia_v1_pronombres: st(2, ['2026-10-25']) })));
  assert.strictEqual(v.course.id, 'pronombres');
  v = IA.view(IA.list(CUR, mk({ leo_academia_piloto_v1: st(1, ['2026-10-25']), leo_academia_v1_pronombres: st(1, ['2026-10-25']) })));
  assert.strictEqual(v.course.id, 'to-be');
});
test('Sesión a medias cuenta como empezado; curso terminado no se "continúa"', () => {
  const a = IA.view(IA.list(CUR, mk({ leo_academia_v1_pronombres: st(0, [], { l1: { i: 2 } }) })));
  assert.strictEqual(a.course.id, 'pronombres'); assert.strictEqual(a.meta, 'Lección 1 de 5');
  const b = IA.view(IA.list(CUR, mk({ leo_academia_piloto_v1: st(5, ['2026-10-25']), leo_academia_v1_pronombres: st(1, ['2026-10-01']) })));
  assert.strictEqual(b.course.id, 'pronombres', 'se salta el terminado');
});
test('Todos terminados: sin barra engañosa de "continuar"', () => {
  const v = IA.view(IA.list(CUR, mk({ leo_academia_piloto_v1: st(5, ['2026-10-25']), leo_academia_v1_pronombres: st(5, ['2026-10-26']) })));
  assert.strictEqual(v.state, 'finished'); assert.strictEqual(v.cta, 'Ir a la Academia');
});
test('Datos corruptos o parciales no rompen nada', () => {
  const bad = { getItem: k => (k === 'leo_academia_piloto_v1' ? '{no json' : '"texto"') };
  assert.strictEqual(IA.view(IA.list(CUR, bad)).state, 'start');
  assert.strictEqual(IA.view(IA.list(CUR, mk({ leo_academia_piloto_v1: {} }))).state, 'start');
});
test('Nunca más de 100 % ni negativo, aunque el estado traiga lecciones de más', () => {
  const s = IA.summarize('to-be', { title: 'x', lessons: 5 }, st(9, ['2026-10-01']));
  assert(s.done <= 5 && s.finished);
});
const PRIV = ['miembros', 'plan-estudio', 'errores', 'aprender', 'clases', 'practica-miembros', 'progreso'];
test('Las 7 páginas del alumno comparten header, barra móvil y pie con los mismos destinos', () => {
  const sig = h => ({
    nav: [...h.match(/<nav class="nav-links">[\s\S]*?<\/nav>/)[0].matchAll(/href="([^"]+)"[^>]*>([^<]+)</g)].map(m => m[1] + '|' + m[2]).join(','),
    mob: [...h.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)[0].matchAll(/href='([^']+)'[^>]*>[\s\S]*?<\/svg>\s*([^<\s][^<]*)/g)].map(m => m[1] + '|' + m[2].trim()).join(','),
    foot: [...h.match(/<div class="foot-links">[\s\S]*?<\/div>/)[0].matchAll(/href="([^"]+)"[^>]*>([^<]+)</g)].map(m => m[1] + '|' + m[2]).join(',')
  });
  const s0 = sig(read('miembros.html'));
  assert(/Inicio/.test(s0.nav) && /Mi progreso/.test(s0.nav) && /Academia/.test(s0.nav) && /Practicar/.test(s0.nav));
  assert.strictEqual(s0.mob.split(',').length, 5);
  PRIV.forEach(n => { const s = sig(read(n + '.html')); assert.deepStrictEqual(s, s0, n); });
});
test('Cada página marca su sección actual; ninguna pierde su enlace de cuenta', () => {
  const cur = { miembros: 'Inicio', progreso: 'Mi progreso', 'practica-miembros': 'Practicar', 'plan-estudio': 'Practicar', errores: 'Practicar', aprender: 'Practicar', clases: 'Practicar' };
  PRIV.forEach(n => { const h = read(n + '.html'); const m = h.match(/<nav class="nav-links">[\s\S]*?<\/nav>/)[0].match(/class="current">([^<]+)</); assert(m && m[1] === cur[n], n); assert(/navManageSubBtn/.test(h) && /Cerrar sesión/.test(h), n + ' cuenta'); });
});
test('El panel conserva todas las herramientas (ninguna se pierde): destinos alcanzables desde Inicio + Practicar', () => {
  const all = read('miembros.html') + read('practica-miembros.html');
  ['plan-estudio.html', 'errores.html', 'aprender.html', 'clases.html', 'juego.html', 'toefl.html', 'ielts.html', 'toeic.html', 'cambridge.html', 'lectura.html', 'progreso.html', 'articulos.html', 'academia.html'].forEach(h => assert(all.includes('href="' + h), h));
  ['mistakesSection', 'dailyChallengeBody', 'skillTabs', 'levelSelector'].forEach(id => assert(read('practica-miembros.html').includes('id="' + id + '"'), id));
});
test('Sin rayas largas en los textos nuevos y el Inicio no repite "Nuevo"/"Recomendado"', () => {
  const h = read('miembros.html'), mem = h.slice(h.indexOf('id="memberContent"'), h.indexOf('<footer'));
  assert(!/—/.test(read('inicio-alumno.js')) && (mem.match(/>Nuevo</g) || []).length <= 1 && !/Recomendado/.test(mem));
});
console.log('\n' + p + ' pass, ' + f + ' fail'); process.exit(f ? 1 : 0);
