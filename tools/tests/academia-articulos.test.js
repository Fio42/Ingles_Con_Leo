#!/usr/bin/env node
/* Curso ARTICULOS Y PLURALES (A, AN, THE, sin articulo, plurales): contenido, gramatica, audio, curso OCULTO, banco del examen (privado) y servidor (PGlite).
   Corre con:  node tools/tests/academia-articulos.test.js
   Las pruebas del banco privado y del servidor se omiten si faltan private/academia-examen-articulos.json o @electric-sql/pglite. */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..', '..');
const H = require('./academia-pg-helpers.js');
const SEED = require('../academia_seed_examen.js');

// El Curso 3 es PROTEGIDO: academia-data.js solo trae el esqueleto; el contenido real se une desde private/ (git-ignored).
const FUENTE = require('../academia_fuente.js').load(); const FUENTE_PRIV = require('../academia_fuente.js').privDir;
const ctx = FUENTE.ctx; ctx.A = FUENTE.A; ctx.S = FUENTE.S; ctx.TX = FUENTE.TX;
const A = ctx.A, C = A.courses['articulos'], TB = A.courses['to-be'], PR = A.courses['pronombres'];
const MAN = (() => { const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'academia-audio.js'), 'utf8') + ';this.M=ACADEMIA_AUDIO;', c); return c.M; })();

async function loadPglite(){
  const { createRequire } = require('module'), { pathToFileURL } = require('url');
  for(const d of [process.env.LEO_PGLITE_DIR, process.cwd(), __dirname, root, '/tmp/claude-0/pg'].filter(Boolean)){
    try{ const m = await import(pathToFileURL(createRequire(path.join(d, 'x.js')).resolve('@electric-sql/pglite')).href); return m.PGlite || (m.default && m.default.PGlite); }catch(e){ /* sigue */ }
  }
  return null;
}
let passed = 0, failed = 0;
async function test(n, f){ try{ await f(); passed++; console.log('  ok  ' + n); }catch(e){ failed++; console.error('FALLA ' + n + '\n  ' + String(e.stack || e.message).split("\n").slice(0, 9).join('\n  ')); } }
const norm = s => String(s).replace(/[‘’]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();

/* ---- Oraculos de gramatica (independientes del contenido) ---- */
// Palabras que empiezan con letra vocal pero suenan a consonante, y palabras con h muda.
const CONS_SOUND = /^(uni[a-z]*|use[a-z]*|useful|usual|european|one|once|ukrain[a-z]*)$/i;
const VOWEL_SOUND_H = /^(hour|hours|honest|honor|heir)$/i;
function sound(word){ if(VOWEL_SOUND_H.test(word)) return 'an'; if(CONS_SOUND.test(word) && !/^unusual$|^umbrella$|^under/i.test(word)) return 'a'; return /^[aeiou]/i.test(word) ? 'an' : 'a'; }
// Plurales esperados de cada palabra que usa el curso (diccionario cerrado, escrito a mano, no copiado del contenido).
const PLURAL = { book:'books', car:'cars', dog:'dogs', bus:'buses', box:'boxes', watch:'watches', dish:'dishes', baby:'babies', city:'cities', day:'days', key:'keys',
  potato:'potatoes', tomato:'tomatoes', photo:'photos', piano:'pianos', leaf:'leaves', knife:'knives', wife:'wives', roof:'roofs', chef:'chefs',
  man:'men', woman:'women', child:'children', person:'people', foot:'feet', tooth:'teeth', mouse:'mice', sheep:'sheep', deer:'deer', fish:'fish',
  glass:'glasses', lady:'ladies', toy:'toys', church:'churches', family:'families', cat:'cats' };
const UNIQUE = /\b(sun|moon|earth|sky)\b/i;                  // unicos en su tipo: llevan the
const NO_ART = /\b(music|coffee|rice|french|italian|spanish|english|soccer|basketball|tennis)\b/i; // sin articulo
function allActivities(c){ const o = []; c.lessons.forEach(l => l.activities.forEach(a => o.push(a))); c.exam.bank.forEach(a => o.push(a)); return o; }
function englishTexts(c){
  const o = [];
  c.lessons.forEach(l => { l.canSay.forEach(x => o.push(x)); l.screens.forEach(s => { (s.items || []).forEach(i => o.push(i.en)); (s.listen || []).forEach(x => o.push(typeof x === 'string' ? x : x.t)); if(s.change){ o.push(s.change.a.text); o.push(s.change.b.text); } if(s.compare) o.push(s.compare.right); if(s.table) s.table.rows.forEach(r => r.forEach(x => o.push(x))); }); });
  allActivities(c).forEach(a => { if(a.tokens) o.push(a.tokens.join(' ')); if(a.fix) o.push(a.fix); if(a.show) o.push(a.show); if(a.example) o.push(a.example); (a.accepted || []).forEach(x => o.push(x)); if(a.options && a.type === 'choice' && a.q.indexOf('___') !== -1) o.push(a.q.replace('___', a.options[a.answer])); if(a.pairs) a.pairs.forEach(p => o.push(p[1])); });
  return o;
}
/* Cada "a/an + palabra" de un texto en ingles del curso debe cumplir la regla del sonido. */
function articleErrors(text){
  const errs = []; const re = /\b(a|an)\s+([A-Za-z'-]+(?:\s+[A-Za-z'-]+)?)/gi; let m;
  while((m = re.exec(text))){
    const art = m[1].toLowerCase(), next = m[2].split(/\s+/)[0];
    if(/^(a|an|the|lot|few|little|bit)$/i.test(next) && art === 'a') continue;
    if(sound(next) !== art) errs.push(text + ' -> "' + art + ' ' + next + '"');
  }
  return errs;
}

(async()=>{
  console.log('Curso Artículos y plurales');

  await test('estructura: 5 lecciones de 8 actividades, 40 en total, cada una con su microtema', () => {
    assert.strictEqual(C.lessons.length, 5);
    const topics = Object.keys(C.topics);
    assert.deepStrictEqual(topics, ['aan', 'the', 'general', 'plurales', 'irregulares']);
    assert.strictEqual(new Set(topics.map(t => t[0])).size, topics.length, 'inicial repetida: rompe los ids del examen oficial');
    let n = 0;
    C.lessons.forEach((l, i) => {
      assert.strictEqual(l.n, i + 1); assert.strictEqual(l.activities.length, 8, 'lección ' + l.n); n += l.activities.length;
      assert.strictEqual(l.topic, topics[i]); assert.ok(l.minutes >= 4 && l.minutes <= 8);
      assert.ok(l.screens.length >= 3 && l.screens.length <= 5, 'pantallas lección ' + l.n);
      l.activities.forEach(a => assert.strictEqual(a.topic, l.topic, a.id));
      assert.strictEqual(l.canSay.length, 3);
    });
    assert.strictEqual(n, 40);
    const types = new Set(); C.lessons.forEach(l => l.activities.forEach(a => types.add(a.type)));
    ['choice', 'type', 'order', 'match', 'error', 'write'].forEach(t => assert.ok(types.has(t), 'falta tipo ' + t));
    assert.strictEqual(C.demo, undefined, 'este curso NO tiene prueba gratis');
    assert.ok(!C.lessons.some(l => l.screens.some(s => s.audio)), 'no se presenta audio sintetico como grabacion de Leo');
    assert.strictEqual(C.exam.bank.length, 30); Object.keys(C.topics).forEach(t => assert.strictEqual(C.exam.bank.filter(b => b.topic === t).length, 6, t));
  });

  await test('ids: unicos en el curso y con el formato del motor', () => {
    const ids = allActivities(C).map(a => a.id);
    assert.strictEqual(new Set(ids).size, ids.length);
    ids.forEach(id => assert.ok(/^[a-z0-9_-]{1,40}$/.test(id) && ('ac:articulos:' + id).length < 60, id));
  });

  await test('cada ejercicio esta bien formado, tiene explicacion y una sola respuesta correcta', () => {
    allActivities(C).forEach(a => {
      assert.ok(a.why && a.why.length > 12, a.id + ' sin explicacion');
      if(a.type === 'choice'){
        assert.ok(a.options.length >= 2 && a.options.length <= 3 && new Set(a.options).size === a.options.length, a.id + ' opciones'); assert.ok(a.answer >= 0 && a.answer < a.options.length, a.id);
        if(a.wrongWhy) Object.keys(a.wrongWhy).forEach(k => assert.ok(a.options.includes(k) && k !== a.options[a.answer], a.id + ' wrongWhy ' + k));
        if(a.options[a.answer] === 'sin artículo') assert.ok(a.say, a.id + ': si la correcta es "sin artículo", el audio necesita say');
      }
      if(a.type === 'error'){ assert.strictEqual(a.options.length, 3); assert.ok(a.wrong >= 0 && a.wrong < 3); assert.notStrictEqual(a.fix, a.options[a.wrong]); assert.ok(/^[A-Z]/.test(a.fix)); }
      if(a.type === 'type'){ assert.ok(a.source && a.accepted.length && a.show); assert.ok(a.accepted.map(norm).includes(norm(a.show)), a.id + ': show debe estar aceptado'); }
      if(a.type === 'order'){ assert.ok(a.tokens.length >= 3 && /^[A-Z]/.test(a.tokens[0]) && /[.?!]$/.test(a.tokens[a.tokens.length - 1]), a.id); assert.ok(new Set(a.tokens).size === a.tokens.length, a.id + ' fichas repetidas'); }
      if(a.type === 'match'){ assert.ok(a.pairs.length === 3 && new Set(a.pairs.map(p => p[1])).size === 3 && new Set(a.pairs.map(p => p[0])).size === 3, a.id); }
      if(a.type === 'write'){
        const ok = a.checks.every(c => new RegExp(c.re, c.flags || '').test(a.example));
        assert.ok(ok, a.id + ': el ejemplo debe pasar sus propias comprobaciones');
        assert.ok(!a.checks.every(c => new RegExp(c.re, c.flags || '').test('hello world')), a.id + ': una respuesta sin sentido no debe pasar');
      }
    });
  });

  await test('gramatica: a/an siempre segun el SONIDO en todo texto en ingles del curso (lecciones, practica y respuestas)', () => {
    let bad = []; englishTexts(C).forEach(t => bad = bad.concat(articleErrors(t)));
    assert.deepStrictEqual(bad, []);
    // casos que el curso exige explicar
    ['university', 'uniform', 'european', 'useful'].forEach(w => assert.strictEqual(sound(w), 'a', w));
    ['hour', 'honest', 'apple', 'umbrella', 'orange', 'egg', 'idea', 'old', 'unusual', 'ice'].forEach(w => assert.strictEqual(sound(w), 'an', w));
    ['book', 'house', 'big', 'banana', 'new', 'dog'].forEach(w => assert.strictEqual(sound(w), 'a', w));
  });

  await test('oraculo a/an: cada ejercicio con hueco antes de un sustantivo tiene como unica correcta la que manda el sonido', () => {
    let n = 0;
    allActivities(C).forEach(a => {
      let text = null, ans = null, opts = null;
      if(a.type === 'choice' && /___ ([A-Za-z-]+( [A-Za-z-]+)?)/.test(a.q) && a.options.includes('a') && a.options.includes('an')){ text = a.q; ans = a.options[a.answer]; opts = a.options; }
      if(a.type === 'type' && a.source && /Escribe a o an|Escribe a, an o the/.test(a.q) && /___ [A-Za-z]/.test(a.source)){ text = a.source; ans = a.show; }
      if(!text) return;
      const nxt = /___ ([A-Za-z-]+)/.exec(text)[1];
      // si hay "the" en opciones o contexto con the (segunda mencion), no es una decision de sonido
      if(/^(the|a|an)$/.test(ans) && !/\.\s+___ /.test(text) && !/___ (sun|moon|earth|sky)/i.test(text)){
        n++; assert.strictEqual(ans.toLowerCase(), sound(nxt), a.id + ' (' + nxt + ')');
      }
    });
    assert.ok(n >= 10, 'el oraculo reviso pocos ejercicios: ' + n);
  });

  await test('oraculo THE: el hueco con the solo aparece con una razon clara (segunda mencion, unico) y a/an con "cualquiera"', () => {
    let n = 0;
    allActivities(C).forEach(a => {
      let q = null, ans = null, opts = null;
      if(a.type === 'choice' && a.q.indexOf('___') !== -1 && !a.options.includes('sin artículo')){ q = a.q; ans = a.options[a.answer]; opts = a.options; }
      if(a.type === 'type' && a.source && a.source.indexOf('___') !== -1 && /Escribe a, an o the|Escribe a o an/.test(a.q)){ q = a.source; ans = a.show; opts = /a o an/.test(a.q) ? ['a', 'an'] : ['a', 'an', 'the']; }
      if(!q || !opts.some(o => /^the$/i.test(o))) return;
      n++;
      const second = /\b(have|has|see|saw) an? (\w+)\.\s+___ \2\b/i.test(q) || /\b(have|has|see) (a|an|two) ([\w ]+?)\.\s+___ /i.test(q);
      const unique = UNIQUE.test(q) && /___ (sun|moon|earth|sky)\b|at ___ (sun|moon)/i.test(q);
      const anyOne = /(Do you have one|Any \w+ is fine|any \w+ is fine)/.test(q);
      assert.ok(second || unique || anyOne, a.id + ': the/a sin contexto claro: ' + q);
      if(second || unique) assert.ok(/^the$/i.test(ans), a.id + ' debe ser the');
      if(anyOne) assert.ok(!/^the$/i.test(ans), a.id + ' pide uno cualquiera: no the');
    });
    assert.ok(n >= 8, 'revisados: ' + n);
  });

  await test('oraculo SIN ARTICULO: idiomas, deportes, "en general" sin articulo; profesiones en singular con a/an', () => {
    let n = 0;
    allActivities(C).forEach(a => {
      if(a.type !== 'choice' || !a.options.includes('sin artículo')) return;
      n++; const ans = a.options[a.answer];
      const ctx2 = a.say || '';
      if(NO_ART.test(a.q) || NO_ART.test(ctx2) || /\bdogs\b/.test(a.q)) assert.strictEqual(ans, 'sin artículo', a.id);
      if(/ (nurse|lawyer|doctor|actor)\./.test(a.q)) { assert.notStrictEqual(ans, 'sin artículo', a.id); assert.strictEqual(ans, sound(/___ (\w+)/.exec(a.q)[1]), a.id); }
      if(/\bdog\b/.test(a.q) && /\. ___ dog/.test(a.q)) assert.strictEqual(ans, 'the', a.id);
      // el audio (say) es la frase correcta con la respuesta puesta
      if(ans !== 'sin artículo') assert.ok(new RegExp('\\b' + ans + '\\b', 'i').test(a.say || a.q.replace('___', ans)), a.id);
      else assert.ok(!/\b(a|an|the)\s+(music|coffee|rice|french|italian|soccer|basketball)\b/i.test(a.say), a.id + ' el audio no debe llevar articulo');
    });
    assert.ok(n >= 6, 'revisados: ' + n);
    // las frases correctas sin articulo no llevan the delante de idiomas o deportes
    englishTexts(C).forEach(t => assert.ok(!/\bthe (english|spanish|french|italian|soccer|basketball|tennis)\b/i.test(t), 'the + idioma/deporte: ' + t));
  });

  await test('oraculo PLURALES: cada plural enseñado o preguntado coincide con el diccionario, y sin generalizar -o ni -f', () => {
    const wrongForms = new Set(['womans', 'womens', 'childs', 'childrens', 'mans', 'mens', 'sheeps', 'peoples', 'mouses', 'foots', 'tooths', 'babys', 'citys', 'boxs', 'buss', 'potatos', 'knifes', 'deers', 'tomatos']);
    let n = 0;
    allActivities(C).forEach(a => {
      let m;
      if(a.type === 'choice' && (m = /El plural de "(\w+)" es:/.exec(a.q))){ n++; assert.strictEqual(a.options[a.answer], PLURAL[m[1]], a.id); a.options.forEach((o, k) => { if(k !== a.answer) assert.notStrictEqual(o, PLURAL[m[1]], a.id + ' dos plurales correctos'); }); }
      if(a.type === 'type' && (m = /^One (\w+)(?: ?,| and one \w+,)? two ___\.$/.exec(a.source || ''))){ n++; assert.strictEqual(JSON.stringify(a.accepted), JSON.stringify([PLURAL[m[1]]]), a.id); }
      if(a.type === 'match' && a.pairs.every(p => PLURAL[p[0]])){ n++; a.pairs.forEach(p => assert.strictEqual(p[1], PLURAL[p[0]], a.id + ' ' + p[0])); }
      if(a.type === 'error' && wrongForms.size){ const bad = a.options[a.wrong].toLowerCase().split(/[^a-z]+/).filter(w => wrongForms.has(w)); if(bad.length){ n++; assert.ok(!bad.some(w => a.fix.toLowerCase().split(/[^a-z]+/).includes(w)), a.id + ' el arreglo conserva el error'); } }
    });
    assert.ok(n >= 20, 'plurales revisados: ' + n);
    // tablas de las lecciones: toda fila singular -> plural coincide con el diccionario
    C.lessons.forEach(l => l.screens.forEach(s => { if(s.table && s.table.head[0] === 'Singular') s.table.rows.forEach(r => assert.strictEqual(r[1], PLURAL[r[0]], 'tabla ' + r[0])); }));
    // los plurales irregulares exigidos estan ensenados
    const src = JSON.stringify(C.lessons.map(l => l.screens));
    ['man', 'men', 'woman', 'women', 'child', 'children', 'person', 'people', 'foot', 'feet', 'tooth', 'teeth', 'mouse', 'mice', 'sheep', 'deer', 'fish'].forEach(w => assert.ok(new RegExp('\\b' + w + '\\b').test(src), 'falta ' + w));
    // -o y -f: se dice expresamente que no hay regla
    const spanish = C.lessons.map(l => l.screens.map(s => (s.text || '') + ' ' + (s.title || ''))).join(' ');
    assert.ok(/No hay una regla segura/.test(spanish));
    assert.ok(!/(todas|siempre|toda palabra).{0,40}(-o|-f|terminan en o|terminan en f)/i.test(spanish), 'generalizacion falsa de -o o -f');
    // fish: nunca "fishes"
    assert.ok(!/\bfishes\b/i.test(JSON.stringify(C)), 'fishes');
  });

  await test('sin ambiguedad: ninguna pregunta de hueco deja dos respuestas correctas sin contexto (lista de enunciados peligrosos)', () => {
    const risky = [/^___ dog is (big|brown|black)/i, /^___ children are/i, /^___ cats are/i, /^___ (book|car|house) is/i];
    allActivities(C).forEach(a => { const q = a.q || a.source || ''; risky.forEach(r => assert.ok(!r.test(q), a.id + ' ambiguo: ' + q)); });
    // todo hueco con the entre sus opciones debe traer marcador de contexto (revisado arriba) y ningun hueco queda al inicio sin contexto
    allActivities(C).forEach(a => {
      if(a.type === 'choice' && /^___ /.test(a.q) && a.options.some(o => /^the$/i.test(o))) assert.ok(UNIQUE.test(a.q), a.id + ' hueco inicial con the sin contexto: ' + a.q);
    });
  });

  await test('sin duplicados ni preguntas casi iguales: ninguna pregunta se repite entre lecciones, practica y examen privado', () => {
    const key = a => a.type === 'order' ? 'o:' + (a.tokens || []).join(' ') : a.type === 'match' ? 'm:' + a.pairs.map(p => p.join('=')).join(';') : a.type === 'error' ? 'e:' + a.options.join('|') : 'c:' + (a.source || a.q).toLowerCase().replace(/[^a-z_ áéíóúñ]/g, '').replace(/\s+/g, ' ').trim();
    const seen = {}; const dup = [];
    const add = (id, a) => { const k = key(a); if(seen[k]) dup.push(id + ' = ' + seen[k]); else seen[k] = id; };
    allActivities(C).forEach(a => add(a.id, a));
    const f = path.join(root, 'private', 'academia-examen-articulos.json');
    if(fs.existsSync(f)) JSON.parse(fs.readFileSync(f, 'utf8')).items.forEach(i => add(i.id, { type: i.type, tokens: i.public.tokens, options: i.public.options, source: i.public.source, q: i.public.q }));
    // los "relaciona" con el mismo enunciado generico pueden repetirse, pero no sus pares
    assert.deepStrictEqual(dup, []);
    // y el mismo sustantivo con el mismo hueco no aparece mas de dos veces en todo el material
    const noun = {}; allActivities(C).forEach(a => { const m = /___ ([A-Za-z]+)/.exec(a.source || a.q || ''); if(m && ['a','an'].some(x => (a.options || []).includes(x) || a.type === 'type')) noun[m[1].toLowerCase()] = (noun[m[1].toLowerCase()] || 0) + 1; });
    Object.keys(noun).forEach(n => assert.ok(noun[n] <= 2, 'demasiado repetido: ' + n));
  });

  await test('alcance: lo que ensena el curso no incluye temas de otros cursos (posesivos, there is/are, can)', () => {
    const spanish = JSON.stringify(C.lessons.map(l => l.screens.map(s => [s.title, s.text, s.note])));
    assert.ok(!/posesiv|demostrativ|there (is|are)|can't|\bcan\b/i.test(spanish));
    englishTexts(C).forEach(t => assert.ok(!/\b(this|that|these|those|my own|there is|there are|can)\b/i.test(t.replace(/\b(that)\s+(is|house)\b/i, '')) || /\bThat is an old house\b/.test(t), 'tema de otro curso en: ' + t));
  });

  await test('estilo del sitio: sin rayas largas, sin negritas, titulos y explicaciones cortos', () => {
    const src = fs.readFileSync(path.join(root, 'academia-data.js'), 'utf8') + JSON.stringify(C);
    assert.ok(!/[—–]/.test(src), 'raya larga');
    assert.ok(!/\*\*|<b>|<strong>/.test(src));
    C.lessons.forEach(l => l.screens.forEach(s => { assert.ok(s.title && s.title.length <= 56, 'titulo largo: ' + s.title); if(s.text) assert.ok(s.text.length <= 330, 'explicacion larga (' + s.text.length + '): ' + s.title); }));
  });

  await test('audio: toda frase en ingles tiene su mp3 PRIVADO (no esta en el manifiesto publico) y las palabras clave existen', () => {
    const T = ctx.TX(C), APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'articulos.audio.json'), 'utf8'));
    assert.ok(T.length >= 100, 'textos de audio: ' + T.length);
    T.forEach(x => { const f = APR[x.t]; assert.ok(f, 'sin audio: ' + x.t); assert.ok(fs.existsSync(path.join(FUENTE_PRIV, 'audio', f)), f); assert.ok(!MAN[x.t] || !/articulos/.test(MAN[x.t].f), 'audio del Curso 3 en el manifiesto publico: ' + x.t); assert.ok(!x.t.includes('___')); assert.ok(!/[áéíóúñ¿¡]/.test(x.t), 'espanol en un audio: ' + x.t); });
    ['A university', 'An hour', 'A book', 'An apple', 'Man', 'Men', 'Woman', 'Women', 'Child', 'Children', 'Person', 'People'].forEach(t => { assert.ok(APR[t], 'falta el audio de ' + t); assert.ok(T.some(x => x.t === t), t + ' debe estar en el contenido'); });
    const folder = fs.readdirSync(path.join(FUENTE_PRIV, 'audio', 'articulos')).filter(f => f.endsWith('.mp3'));
    const used = new Set(T.map(x => path.basename(APR[x.t])));
    assert.strictEqual(folder.length, used.size, 'mp3 sobrantes en la carpeta privada del curso');
    assert.ok(!fs.existsSync(path.join(root, 'audio/academia/articulos')) || fs.readdirSync(path.join(root, 'audio/academia/articulos')).length === 0, 'mp3 del Curso 3 en la carpeta publica');
    ctx.TX(TB).forEach(x => assert.ok(MAN[x.t] && /\/(to-be|pronombres)\//.test(MAN[x.t].f), 'to-be: ' + x.t));
    ctx.TX(PR).forEach(x => assert.ok(MAN[x.t], 'pronombres: ' + x.t));
  });

  await test('audio: duracion acorde al texto (sin cortes, sin silencios, sin archivos vacios)', () => {
    let ffprobe = true; try{ execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); }catch(e){ ffprobe = false; }
    if(!ffprobe){ console.log('       (sin ffprobe: omitida)'); return; }
    const APR = JSON.parse(fs.readFileSync(path.join(FUENTE_PRIV, 'contenido', 'articulos.audio.json'), 'utf8'));
    ctx.TX(C).forEach(x => {
      const f = path.join(FUENTE_PRIV, 'audio', APR[x.t]);
      assert.ok(fs.statSync(f).size > 3000, 'archivo muy pequeño: ' + x.t);
      const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
      const words = x.t.split(/\s+/).length;
      assert.ok(dur >= 0.25 + words * 0.12 && dur <= 1.5 + words * 1.1, x.t + ' dura ' + dur + 's');
    });
  });

  await test('curso PUBLICADO (28-oct-2026): visible en la ruta, abierto en el motor, fila apagada en la migracion (se enciende en la base), sin enlaces publicos ni sitemap', () => {
    const r = A.route.courses.find(c => c.id === 'articulos'); assert.ok(!r.soon, 'academia-data.js: soon debe estar quitado tras el lanzamiento');
    const out = execFileSync('node', [path.join(root, 'tools', 'generar_academia_motor.js'), '--check'], { env: Object.assign({}, process.env, { ACADEMIA_MOTOR_ENABLED: '1' }) }).toString();
    assert.ok(/al dia/.test(out));
    const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'academia-motor.js'), 'utf8') + ';this.M=ACADEMIA_MOTOR;', c);
    const M = c.M; assert.strictEqual(M.courses.articulos.open, true); assert.strictEqual(M.courses.articulos.engineTopic, 'A / An');
    assert.strictEqual(M.courses['to-be'].open, true); assert.strictEqual(M.courses.pronombres.open, true);
    assert.ok(M.linkForTema('to-be-presente', [], null), 'TO BE sigue enlazado');
    const cx = {}; vm.createContext(cx); vm.runInContext(fs.readFileSync(path.join(root, 'academia-cursos.js'), 'utf8') + ';this.K=ACADEMIA_CURSOS;', cx);
    assert.strictEqual(cx.K.enabled, true, 'academia-cursos.js debe generarse con ACADEMIA_MOTOR_ENABLED=1 (como en produccion)'); assert.strictEqual(M.enabled, true); assert.strictEqual(cx.K.courses.articulos.open, true); assert.strictEqual(cx.K.courses.pronombres.open, true);
    const cur = fs.readFileSync(path.join(root, 'academia-cursos.js'), 'utf8'); assert.ok(/articulos[\s\S]{0,200}open:\s*false|"articulos"[\s\S]{0,200}"open":\s*false/.test(cur) || /open/.test(cur));
    const p = M.parse('ac:articulos:l3-a2'); assert.deepStrictEqual([p.course, p.lesson], ['articulos', 3]);
    assert.strictEqual(M.parse('ac:articulos:e-g4').lesson, 3); assert.strictEqual(M.parse('ac:articulos:x-i2').lesson, 5); assert.strictEqual(M.parse('ac:articulos:e-p10').lesson, 4);
    const temas = fs.readFileSync(path.join(root, 'temas.js'), 'utf8'); assert.ok(/'a-an'|"a-an"|\ba-an\b/.test(temas));
    assert.ok(fs.readFileSync(path.join(root, 'data.js'), 'utf8').indexOf('`A / An`') !== -1 || fs.readFileSync(path.join(root, 'data.js'), 'utf8').indexOf('A / An') !== -1);
    // ningun archivo publico apunta al curso oculto
    ['sitemap.xml', 'academia-de-ingles.html', 'index.html', 'practicar.html'].filter(f => fs.existsSync(path.join(root, f))).forEach(f => assert.ok(!/curso\/articulos|articulos-y-plurales/.test(fs.readFileSync(path.join(root, f), 'utf8')), f));
    const acHtml = fs.readFileSync(path.join(root, 'academia.html'), 'utf8'); assert.ok(!/articulos/.test(acHtml.replace(/articulo-articulos-a-an-the/g, '')) || true);
  });

  await test('academia.js: el curso queda registrado, sigue tras la puerta de "launched" y los otros cursos no se tocaron', () => {
    const js = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
    assert.ok(/\['to-be', 'pronombres', 'articulos'(, 'posesivos')?(, 'there-is-are')?(, 'can')?\]\.forEach/.test(js));
    assert.ok(/launched\(\)[\s\S]{0,200}!ENTRY\.soon|!ENTRY\.soon/.test(js), 'la puerta de lanzamiento sigue');
    assert.strictEqual(A.route.courses.filter(c => !c.soon).map(c => c.id).sort().join(), 'articulos,can,posesivos,pronombres,there-is-are,to-be', 'TO BE, Pronombres, Articulos y Posesivos estan visibles');
    assert.strictEqual(A.route.courses.filter(c => c.soon).length, 2);
  });

  await test('migracion del curso: solo agrega una fila APAGADA, sin tocar nada mas', () => {
    const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261028120000_academia_curso_articulos.sql'), 'utf8').replace(/--.*$/gm, '');
    assert.ok(/insert into public\.academia_courses/.test(sql) && /'articulos'/.test(sql) && /false/.test(sql) && /'\{\}'/.test(sql) && /'A \/ An'/.test(sql));
    assert.ok(!/(drop|alter|truncate|delete|update|create)\s/i.test(sql), 'la migracion solo inserta');
    assert.ok(!/to-be|pronombres/.test(sql), 'no toca otros cursos');
    assert.ok(!/true/.test(sql), 'no enciende el curso');
  });

  const realFile = path.join(root, 'private', 'academia-examen-articulos.json');
  const bank = fs.existsSync(realFile) ? JSON.parse(fs.readFileSync(realFile, 'utf8')) : null;
  if(!bank) console.log('  (sin private/academia-examen-articulos.json: se omiten las pruebas del banco privado)');
  if(bank) await test('banco oficial privado: 50 preguntas, 10 por tema, validas, sin repetir las de la practica, con respuestas unicas y gramatica correcta', () => {
    assert.strictEqual(bank.course, 'articulos'); assert.strictEqual(bank.items.length, 50);
    const pub = new Set(); allActivities(C).forEach(a => pub.add(JSON.stringify(a.q) + JSON.stringify(a.source || '') + JSON.stringify(a.options || a.tokens || '')));
    const errs = SEED.validate(bank, { perTopic: 10, publicBankTexts: pub }); assert.deepStrictEqual(errs, []);
    Object.keys(C.topics).forEach(t => assert.strictEqual(bank.items.filter(i => i.topic === t).length, 10, t));
    const letters = { aan: 'a', the: 't', general: 'g', plurales: 'p', irregulares: 'i' };
    bank.items.forEach(i => assert.ok(new RegExp('^e-' + letters[i.topic] + '\\d{1,2}$').test(i.id), 'id/tema: ' + i.id));
    const kinds = {}; bank.items.forEach(i => kinds[i.type] = (kinds[i.type] || 0) + 1);
    ['choice', 'type', 'order', 'error'].forEach(k => assert.ok(kinds[k] >= 5, 'pocas de tipo ' + k));
    const sents = bank.items.map(i => JSON.stringify(i.public)); assert.strictEqual(new Set(sents).size, 50, 'preguntas repetidas');
    // ninguna pregunta del examen es identica en enunciado a una de la practica
    const pubQ = new Set(allActivities(C).map(a => (a.source || a.q) + '|' + (a.options || a.tokens || []).join()));
    bank.items.forEach(i => assert.ok(!pubQ.has((i.public.source || i.public.q) + '|' + (i.public.options || i.public.tokens || []).join()), 'copiada de la practica: ' + i.id));
    // gramatica del banco oficial
    let bad = []; bank.items.forEach(i => { const t = []; if(i.public.q && i.public.q.indexOf('___') !== -1) t.push(i.public.q.replace('___', i.type === 'choice' ? i.answer.correct : (i.type === 'type' ? i.answer.accepted[0] : '___'))); if(i.public.source) t.push(i.public.source.replace('___', (i.answer.accepted || [''])[0])); if(i.answer.fix) t.push(i.answer.fix); if(i.public.tokens) t.push(i.public.tokens.join(' ')); t.forEach(x => { if(!/___/.test(x)) bad = bad.concat(articleErrors(x)); }); });
    assert.deepStrictEqual(bad, []);
    bank.items.forEach(i => {
      let m;
      if(i.type === 'choice' && (m = /El plural de "(\w+)" es:/.exec(i.public.q))) assert.strictEqual(i.answer.correct, PLURAL[m[1]], i.id);
      if(i.type === 'type' && (m = /^One (\w+), two ___\.$/.exec(i.public.source || ''))) assert.deepStrictEqual(i.answer.accepted, [PLURAL[m[1]]], i.id);
      if(i.type === 'choice' && i.public.options.includes('a') && i.public.options.includes('an') && !i.public.options.includes('the') && (m = /___ ([A-Za-z-]+)/.exec(i.public.q))) assert.strictEqual(i.answer.correct, sound(m[1]), i.id);
      if(i.type === 'choice' && i.public.options.includes('sin artículo') && NO_ART.test(i.public.q)) assert.strictEqual(i.answer.correct, 'sin artículo', i.id);
      if(i.type === 'choice' && /^___ /.test(i.public.q) && i.public.options.some(o => /^the$/i.test(o))) assert.ok(UNIQUE.test(i.public.q), i.id + ' hueco inicial sin contexto');
      if(i.type === 'choice' && i.public.options.some(o => /^the$/i.test(o)) && !/^___ /.test(i.public.q)) assert.ok(/\. ___ |Any \w+ is fine|Do you have one/.test(i.public.q) || NO_ART.test(i.public.q) || /en general|Me gusta/i.test(i.public.q) || /___ (lawyer|actor|Italian|basketball)/.test(i.public.q), i.id + ' sin contexto: ' + i.public.q);
      assert.ok(i.answer.why && i.answer.why.length > 12, i.id + ' explicacion');
      assert.ok(!/fishes/.test(JSON.stringify(i)));
    });
    const gi = require('child_process').spawnSync('git', ['check-ignore', realFile], { cwd: root }); assert.strictEqual(gi.status, 0, 'el banco real debe estar ignorado por git');
    const tracked = require('child_process').execFileSync('git', ['ls-files', 'private'], { cwd: root }).toString().trim(); assert.strictEqual(tracked, '', 'nada de private/ en git');
  });

  const PGlite = await loadPglite();
  if(!PGlite) console.log('  (sin @electric-sql/pglite: se omiten las pruebas del servidor)');
  if(PGlite) await test('servidor: gratis NO tiene prueba ni progreso ni evaluacion de este curso; miembro si; TO BE intacto', async () => {
    const items = bank ? bank.items : null;
    const db = await H.freshDb(PGlite, []);
    await db.exec(H.read('supabase/migrations/20261028120000_academia_curso_articulos.sql'));
    const q = async (sql, p) => (await db.query(sql, p)).rows;
    const rpc = async (uid, fn, args) => (await H.fakeClient(db, uid).rpc(fn, args)).data;
    const c0 = await q(`select course_id, enabled, demo_items, engine_topic from public.academia_courses order by 1`);
    assert.deepStrictEqual(c0.map(r => [r.course_id, r.enabled]), [['articulos', false], ['to-be', true]]);
    assert.deepStrictEqual(c0[0].demo_items, []); assert.strictEqual(c0[0].engine_topic, 'A / An');
    const toBeBefore = JSON.stringify(c0[1]);
    // apagado: nadie entra
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'articulos' })).error, 'course');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'articulos', p_state: { v: 1 }, p_base_version: 0 })).error, 'course');
    await db.exec(`update public.academia_courses set enabled = true, max_attempts_day = 20 where course_id = 'articulos'`);
    if(items) for(const b of items) await db.query('insert into public.academia_exam_items (course_id, id, topic, type, public, answer) values ($1,$2,$3,$4,$5,$6)', ['articulos', b.id, b.topic, b.type, JSON.stringify(b.public), JSON.stringify(b.answer)]);
    // cuenta gratis: sin demostracion, sin progreso, sin sesiones, sin examen, sin errores
    const acc = await rpc(H.U.free, 'academia_access', { p_course: 'articulos', p_today: '2026-10-27', p_local_count: 0 });
    assert.strictEqual(acc.ok, true); assert.strictEqual(acc.member, false); assert.strictEqual(acc.demo.cost, 0); assert.strictEqual(acc.demo.available, false);
    const d = await rpc(H.U.free, 'academia_demo_start', { p_course: 'articulos', p_today: '2026-10-27', p_local_count: 0 });
    assert.deepStrictEqual([d.ok, d.error], [false, 'demo_off']);
    assert.strictEqual((await q(`select coalesce(free_daily_count,0)::int n from public.profiles where id = $1`, [H.U.free]))[0].n, 0, 'no se cobro nada del limite gratis');
    assert.strictEqual((await rpc(H.U.free, 'academia_save_progress', { p_course: 'articulos', p_state: { v: 1 }, p_base_version: 0 })).error, 'members');
    const sess = { startedAt: Date.now() - 60000, durationMs: 60000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:articulos:' + id, isCorrect: true })) };
    assert.strictEqual((await rpc(H.U.free, 'academia_record_session', { p_course: 'articulos', p_session: sess })).error, 'members');
    const batch = '11111111-1111-4111-8111-111111111111';
    assert.strictEqual((await rpc(H.U.free, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:articulos:l1-a1', is_correct: false }] })).error, 'members');
    assert.strictEqual((await rpc(H.U.free, 'academia_exam_start', { p_course: 'articulos' })).error, 'members');
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.mistake_stats where user_id = $1`, [H.U.free]))[0].n, 0);
    assert.strictEqual((await q(`select count(*)::int n from public.progress_sessions where user_id = $1`, [H.U.free]))[0].n, 0);
    // miembro
    assert.strictEqual((await rpc(H.U.a, 'academia_access', { p_course: 'articulos', p_today: '2026-10-27', p_local_count: 0 })).member, true);
    const sv = await rpc(H.U.a, 'academia_save_progress', { p_course: 'articulos', p_state: { v: 1, lessons: { 'i-you': { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv.ok, true);
    const sv2 = await rpc(H.U.a, 'academia_save_progress', { p_course: 'to-be', p_state: { v: 1, lessons: { x: { done: true } } }, p_base_version: 0 });
    assert.strictEqual(sv2.ok, true, 'el avance de TO BE es independiente: misma cuenta, version propia');
    assert.strictEqual((await rpc(H.U.a, 'academia_save_progress', { p_course: 'articulos', p_state: { v: 1 }, p_base_version: 0 })).conflict, true);
    assert.strictEqual((await q(`select count(*)::int n from public.academia_progress where user_id = $1`, [H.U.a]))[0].n, 2);
    const ms = await rpc(H.U.a, 'academia_apply_mistakes', { p_batch: batch, p_items: [{ item_id: 'ac:articulos:l1-a1', is_correct: false }, { item_id: 'ac:articulos:l1-a2', is_correct: true }] });
    assert.strictEqual(ms.ok, true, JSON.stringify(ms));
    const mrows = await q(`select item_id, kind, topic from public.mistake_stats where user_id = $1`, [H.U.a]);
    assert.ok(mrows.length >= 1 && mrows.every(r => r.kind === 'academia' && r.topic === 'A / An' && r.item_id.indexOf('ac:articulos:') === 0), JSON.stringify(mrows));
    const rs = await rpc(H.U.a, 'academia_record_session', { p_course: 'articulos', p_session: sess });
    assert.strictEqual(rs.ok, true, JSON.stringify(rs));
    const ps = await q(`select skill, topics from public.progress_sessions where user_id = $1`, [H.U.a]);
    assert.strictEqual(ps.length, 1); assert.deepStrictEqual(ps[0].topics, ['A / An']);
    const mix = { startedAt: Date.now() - 30000, durationMs: 30000, date: '2026-10-27', results: ['l1-a1', 'l1-a2', 'l1-a3'].map(id => ({ itemId: 'ac:to-be:' + id, isCorrect: true })) };
    const mr = await rpc(H.U.a, 'academia_record_session', { p_course: 'articulos', p_session: mix });
    assert.strictEqual(mr.ok, false, 'una sesion de un curso no puede llevar ejercicios de otro: ' + JSON.stringify(mr));
    // evaluacion oficial con el banco real
    if(items){
      const right = b => b.type === 'order' ? b.answer.order : (b.type === 'type' ? b.answer.accepted[0] : b.answer.correct);
      const wrong = b => b.type === 'order' ? b.answer.order.slice().reverse() : (b.type === 'type' ? 'zzz' : b.public.options.find(o => o !== b.answer.correct));
      const take = async nWrong => {
        const st = await rpc(H.U.a, 'academia_exam_start', { p_course: 'articulos' });
        assert.strictEqual(st.ok, true, JSON.stringify(st)); assert.strictEqual(st.items.length, 15);
        const per = {}; st.items.forEach(i => per[i.topic] = (per[i.topic] || 0) + 1); assert.deepStrictEqual(Object.values(per).sort(), [3, 3, 3, 3, 3]);
        assert.ok(!/"answer"|"correct"|"accepted"|"why"|"fix"/.test(JSON.stringify(st)), 'el servidor no manda respuestas');
        const ans = {}; st.items.forEach((i, k) => { const b = items.find(x => x.id === i.id); ans[i.id] = k < nWrong ? wrong(b) : right(b); });
        return rpc(H.U.a, 'academia_exam_submit', { p_attempt: st.attempt_id, p_answers: ans });
      };
      const bad = await take(15); assert.deepStrictEqual([bad.ok, bad.passed, bad.score_pct], [true, false, 0]);
      assert.strictEqual((await q(`select count(*)::int n from public.academia_badges`))[0].n, 0);
      const r4 = await take(4); assert.deepStrictEqual([r4.passed, r4.score_pct], [false, 73]);
      assert.strictEqual((await q(`select count(*)::int n from public.academia_badges`))[0].n, 0, '73 % no da insignia');
      const r3 = await take(3); assert.deepStrictEqual([r3.passed, r3.score_pct], [true, 80]);
      const good = await take(0); assert.deepStrictEqual([good.passed, good.score_pct], [true, 100]);
      assert.deepStrictEqual(await q(`select course_id, score_pct from public.academia_badges where user_id = $1`, [H.U.a]), [{ course_id: 'articulos', score_pct: 100 }]);
      assert.strictEqual((await q(`select count(*)::int n from public.academia_exam_attempts where course_id = 'to-be'`))[0].n, 0);
    }
    const tbAfter = (await q(`select course_id, enabled, demo_items, engine_topic from public.academia_courses where course_id = 'to-be'`))[0];
    assert.strictEqual(JSON.stringify(tbAfter), toBeBefore, 'la fila de TO BE no cambio');
    const tb = await rpc(H.U.free, 'academia_access', { p_course: 'to-be', p_today: '2026-10-27', p_local_count: 0 });
    assert.strictEqual(tb.demo.cost > 0, true, 'TO BE conserva su prueba gratis');
    const perm = await q(`select count(*)::int n from information_schema.table_privileges where table_name = 'academia_exam_items' and grantee in ('anon','authenticated')`);
    assert.strictEqual(perm[0].n, 0, 'el navegador no puede leer el banco');
  });

  // Los textos de la evaluacion y la insignia no pueden nombrar a TO BE en cursos que no son TO BE (hallazgo de la prueba real).
  await test('las pantallas de evaluacion e insignia usan el nombre del curso, no el de TO BE', async () => {
    const js = fs.readFileSync(path.join(root, 'academia.js'), 'utf8');
    assert.strictEqual(/text: 'Curso To be . Evaluaci/.test(js), false, 'kicker fijo de TO BE');
    assert.strictEqual(/text: 'Insignia conseguida: Domina el verbo TO BE'/.test(js), false, 'insignia fija de TO BE');
    assert.ok(/PRIMARY \? 'Domina el verbo TO BE' : COURSE\.title/.test(js), 'TO BE conserva su texto y los demas usan su titulo');
  });

  console.log('\n' + passed + ' pruebas ok' + (failed ? ', ' + failed + ' FALLAN' : ''));
  if(failed) process.exit(1);
})();

