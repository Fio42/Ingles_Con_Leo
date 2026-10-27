#!/usr/bin/env node
/* Inicio del alumno: regla "Continuar curso" (inicio-alumno.js) y contrato de la navegación. Sin red.
   Corre con:  node tools/tests/inicio-alumno.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const IA = require(path.join(root, 'inicio-alumno.js'));
let p = 0, f = 0;
const pend = [];
function test(n, fn){ try{ const r = fn(); if(r && r.then){ pend.push(r.then(() => { p++; console.log('  ok   ' + n); }, e => { f++; console.log('  FAIL ' + n + '\n       ' + e.message); })); } else { p++; console.log('  ok   ' + n); } }catch(e){ f++; console.log('  FAIL ' + n + '\n       ' + e.message); } }
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

/* ---- Fuente real: servidor (academia_progress / academia_courses) ---- */
const fakeClient = (prog, enabled, opts) => ({ from: t => ({ select: async () => {
  if(opts && opts.fail) return { error: { message: 'net' }, data: null };
  if(t === 'academia_progress') return { error: null, data: Object.keys(prog).map(k => ({ course_id: k, state: prog[k] })) };
  return enabled === 'error' ? { error: { message: 'x' }, data: null } : { error: null, data: Object.keys(enabled).map(k => ({ course_id: k, enabled: enabled[k] })) };
} }) });
const deps = (o, storage) => ({ motor: CUR, storage: storage || mk({}), client: fakeClient(o.prog || {}, o.enabled || { 'to-be': true, pronombres: true }, o), getSession: async () => (o.anon ? null : { user: { id: 'u1' } }) });
const av = async o => IA.view((await IA.loadServer(deps(o, o.storage))).courses || []);
test('Servidor: el avance sale de academia_progress de la cuenta, no del navegador', async () => {
  const v = await av({ prog: { 'to-be': st(2, ['2026-10-26']) }, storage: mk({ leo_academia_v1_pronombres: st(4, ['2026-10-27']) }) });
  assert.strictEqual(v.course.id, 'to-be', 'el avance local de OTRA cuenta no cuenta'); assert.strictEqual(v.meta, 'Lección 3 de 5');
});
test('Servidor: curso apagado en la base (enabled=false) no se ofrece aunque el código lo tenga abierto', async () => {
  const v = await av({ prog: { 'to-be': st(1, ['2026-10-26']), pronombres: st(2, ['2026-10-27']) }, enabled: { 'to-be': true, pronombres: false } });
  assert.strictEqual(v.course.id, 'to-be');
});
test('Servidor: sin sesión o con error de red no se inventan cifras (resultado no confiable)', async () => {
  assert.strictEqual((await IA.loadServer(deps({ anon: true }))).ok, false);
  assert.strictEqual((await IA.loadServer(deps({ fail: true }))).ok, false);
});
test('Servidor: si la lista de cursos de la base falla, no se filtra por enabled (usa el código)', async () => {
  const r = await IA.loadServer(deps({ prog: { 'to-be': st(1, ['2026-10-26']) }, enabled: 'error' }));
  assert(r.ok && r.courses.length === 2);
});
test('Cola pendiente de ESTA cuenta: se toma lo más avanzado entre servidor y local (justo tras terminar una lección)', async () => {
  const storage = { getItem: k => ({ 'leo_academia_cola_v1:u1:to-be': JSON.stringify({ sessions: [{}] }), leo_academia_piloto_v1: JSON.stringify(st(3, ['2026-10-27'])) })[k] || null };
  const v = await av({ prog: { 'to-be': st(2, ['2026-10-26']) }, storage });
  assert.strictEqual(v.meta, 'Lección 4 de 5');
  const sinCola = await av({ prog: { 'to-be': st(2, ['2026-10-26']) }, storage: { getItem: k => (k === 'leo_academia_piloto_v1' ? JSON.stringify(st(3, ['2026-10-27'])) : null) } });
  assert.strictEqual(sinCola.meta, 'Lección 3 de 5', 'sin cola propia, el local no se usa');
});
test('Cuenta sin filas de progreso: todos "Sin empezar"; la tarjeta no ofrece "Continuar"', async () => {
  const v = await av({ prog: {} }); assert.strictEqual(v.state, 'start');
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
Promise.all(pend).then(() => { console.log('\n' + p + ' pass, ' + f + ' fail'); process.exit(f ? 1 : 0); });
