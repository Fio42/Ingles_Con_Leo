#!/usr/bin/env node
/* Mapa de conexiones del sitio (documentacion viva).
   Solo LEE el sitio; escribe unicamente INVENTARIO_CONEXIONES.csv, INVENTARIO_TEMAS.csv y los bloques GENERADO de
   MAPA_CONEXIONES.md y PLAN_CONEXIONES.md. No toca practica, motores, pagos ni limites.

   Uso (desde la carpeta inglesconLeo):
     node tools/conexiones/auditar.js            comprueba (no escribe): falla si algo quedo desactualizado o roto
     node tools/conexiones/auditar.js --write    regenera los archivos generados
   Que verifica solo (sin navegador):
     - cada enlace estatico de los HTML apunta a un archivo, carpeta y ancla que existen
     - cada tema de temas.js: su clase y su ficha existen y estan en el sitemap; su curso existe y esta abierto en el codigo
     - cuantos ejercicios gratis / solo de miembros tiene cada tema, por nivel (data.js + MEMBERS_ONLY_VARIANT_INDEX de app.js)
     - cada destino dinamico de destinos-dinamicos.json sigue existiendo en su archivo (la 'aguja')
   Lo que NO puede verificar sin navegador: que un clic termine donde dice (se marca como 'codigo' o 'navegador' en el inventario). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const WRITE = process.argv.includes('--write');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));
const problems = [];       // cosas que hacen fallar --check

/* ---------- 1. Datos reales del sitio ---------- */
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(read('data.js') + '\n;this.__D = { GRAMMAR_BANK, VOCAB_BANK, LISTENING_BANK, WRITING_BANK };', ctx);
vm.runInContext(read('temas.js') + '\n;this.__T = { TEMAS, TEMA_BY_ID, temaForTopic, temaForVocabItem, temaForListeningItem, temaForWritingItem, ACADEMIA_COURSE_BY_TEMA, ARTICLE_QUIZ_CATALOG, canonicalTemaId };', ctx);
const D = ctx.__D, T = ctx.__T;
const appSrc = read('app.js');
const literal = (src, name) => { const m = src.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\});')); if(!m) throw new Error('No encuentro ' + name); return vm.runInNewContext('(' + m[1] + ')'); };
const MO = literal(appSrc, 'MEMBERS_ONLY_VARIANT_INDEX');
const SAMPLE = literal(appSrc, 'FREE_SAMPLE_IDS');
const LABELS = literal(read('tools/generar_mini_lecciones.js'), 'LABELS');
const MINI = vm.runInNewContext(read('mini-lecciones.js') + ';MINI_LESSONS');
const CURSOS = vm.runInNewContext(read('academia-cursos.js') + ';ACADEMIA_CURSOS').courses;
const sitemap = read('sitemap.xml');
const inSitemap = file => sitemap.indexOf('/' + file + '</loc>') !== -1;
const LEVELS = ['principiante', 'facil', 'medio', 'avanzado'];

/* ---------- 2. Matriz por tema ---------- */
const stats = {};   // temaId -> { free:{lvl:n}, member:{lvl:n}, all:{lvl:n} }  (free incluye la muestra gratis de Do/Does)
const bump = (tid, lvl, kind, n) => { if(!tid) return; const s = stats[tid] || (stats[tid] = { free: {}, member: {}, all: {} }); s[kind][lvl] = (s[kind][lvl] || 0) + n; };
function addItems(skillKey, lvl, vi, tid, n, sampleHit){
  const blocked = ((MO[skillKey] || {})[lvl] || []).indexOf(vi) !== -1;
  if(!blocked || sampleHit) bump(tid, lvl, 'free', n); else bump(tid, lvl, 'member', n);
  bump(tid, lvl, 'all', n);
}
Object.keys(D.GRAMMAR_BANK).forEach(lvl => D.GRAMMAR_BANK[lvl].forEach((variant, vi) => variant.forEach(g => {
  const t = T.temaForTopic(g.topic); if(!t) return;
  g.items.forEach(it => addItems('gramatica', lvl, vi, t.id, 1, (SAMPLE[lvl] || []).indexOf(it.id) !== -1));
})));
[['vocabulario', D.VOCAB_BANK, T.temaForVocabItem], ['listening', D.LISTENING_BANK, T.temaForListeningItem], ['writing', D.WRITING_BANK, T.temaForWritingItem]].forEach(([sk, bank, fn]) => {
  Object.keys(bank).forEach(lvl => bank[lvl].forEach((variant, vi) => variant.forEach(it => { const t = fn(it.id); if(t) addItems(sk, lvl, vi, t.id, 1, false); })));
});
const fmt = o => LEVELS.filter(l => o[l]).map(l => l + ':' + o[l]).join(' ') || '-';
const sum = o => Object.keys(o).reduce((a, k) => a + o[k], 0);
const cardLabels = {};
MINI.forEach(m => { cardLabels[m[0]] = true; });
const labelOfTopic = tp => LABELS[tp] || tp.replace(/\s*\(.*\)/, '');
function temaHasCard(t){ return (t.topics || []).some(tp => cardLabels[labelOfTopic(tp)]); }

const temaRows = T.TEMAS.map(t => {
  const s = stats[t.id] || { free: {}, member: {}, all: {} };
  const course = T.ACADEMIA_COURSE_BY_TEMA[t.id] || null;
  const slug = t.article ? t.article.replace(/^articulo-/, '').replace(/\.html$/, '') : null;
  const quiz = slug && T.ARTICLE_QUIZ_CATALOG[slug] && T.ARTICLE_QUIZ_CATALOG[slug].tema === t.id ? sum(T.ARTICLE_QUIZ_CATALOG[slug].quizzes) : 0;
  const claseOk = t.article ? exists(t.article) : null;
  const glosOk = t.glossary ? exists('glosario/' + t.glossary + '/index.html') : null;
  if(t.article && !claseOk) problems.push('Tema ' + t.id + ': la clase ' + t.article + ' no existe');
  if(t.glossary && !glosOk) problems.push('Tema ' + t.id + ': la ficha glosario/' + t.glossary + ' no existe');
  if(t.article && claseOk && !inSitemap(t.article)) problems.push('Tema ' + t.id + ': ' + t.article + ' no esta en sitemap.xml');
  if(course && !CURSOS[course.course]) problems.push('Tema ' + t.id + ': el curso ' + course.course + ' no existe en academia-cursos.js');
  const memberLevels = LEVELS.filter(l => s.all[l]);
  const freeN = sum(s.free), memberN = sum(s.member), allN = sum(s.all);
  const gram = !t.skill || t.skill === 'grammar';
  let practicaMiembros, estadoMiembros;
  if(!allN){ practicaMiembros = '(sin ejercicios)'; estadoMiembros = 'por_construir'; }
  else if(gram && !t.family){ practicaMiembros = 'gramatica.html (el tema no tiene familia)'; estadoMiembros = 'enlace_incorrecto'; }
  else {
    practicaMiembros = gram ? 'plan-estudio.html?foco=' + t.family + '&tema=' + t.id + '&empezar=1' : 'plan-estudio.html?tema=' + t.id + '&empezar=1';
    // Con ejercicios en algun nivel, el Plan los ofrece: en los demas niveles usa el nivel mas cercano SIN cambiar el nivel guardado y lo avisa
    // (app.js: nearestLevelWithTema, planHonestNoteHtml; lo exige tools/tests/piloto-conexiones.test.js).
    estadoMiembros = 'verificado';
    if(memberLevels.length < LEVELS.length) practicaMiembros += '  [niveles sin ejercicios: usa el nivel mas cercano y avisa]';
  }
  // Con ejercicios gratis, practica.html?skill=grammar|vocabulary|listening&tema=<id> existe (app.js: focusTema, freeTemaItems, freeLevelForTema; lo exigen piloto-conexiones y refuerzo-exacto).
  const urlSkill = gram ? 'grammar' : t.skill;
  const estadoGratis = freeN ? 'verificado' : (memberN ? 'solo_miembros' : 'por_construir');
  const falta = [];
  if(!t.article && !t.glossary) falta.push('explicacion (ni clase ni ficha)');
  if(!allN) falta.push('ejercicios');
  if(allN && gram && !t.family) falta.push('familia en temas.js');
  return {
    tema_id: t.id, etiqueta: t.label, habilidad: t.skill || 'grammar', familia: t.family || '',
    clase: t.article || '', clase_ok: t.article ? (claseOk ? 'si' : 'NO EXISTE') : '', glosario: t.glossary || '', glosario_ok: t.glossary ? (glosOk ? 'si' : 'NO EXISTE') : '',
    curso: course ? course.course : '', curso_abierto_codigo: course ? (CURSOS[course.course] && CURSOS[course.course].open ? 'si' : 'no') : '',
    quiz_articulo: quiz || '', micros_activos: (t.micros || []).filter(m => m.active).length || '',
    ejercicios_gratis: fmt(s.free), ejercicios_solo_miembros: fmt(s.member), niveles_miembro: memberLevels.join(' ') || '-',
    tarjeta_inicio: temaHasCard(t) ? 'si' : 'no',
    practica_miembros: practicaMiembros, estado_miembros: estadoMiembros,
    practica_gratis: freeN ? 'practica.html?skill=' + urlSkill + '&tema=' + t.id + '  [avisa si el tema esta en otro nivel]' : '(sin ejercicios gratis)', estado_gratis: estadoGratis,
    falta: falta.join('; ')
  };
});

/* ---------- 3. Enlaces estaticos en HTML ---------- */
const SKIP = new Set(['node_modules', '_to_delete', 'Claude outputs', 'private', 'docs', 'supabase', 'supabase_functions', 'tools', 'audio', 'assets', 'fb', 'ig', 'tt', 'yt']);
const htmlFiles = [];
(function walk(dir){
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach(e => {
    const rel = dir ? dir + '/' + e.name : e.name;
    if(e.isDirectory()){ if(!SKIP.has(e.name) && e.name[0] !== '.') walk(rel); }
    else if(e.name.endsWith('.html')) htmlFiles.push(rel);
  });
})('');
htmlFiles.sort();
// Paginas de miembros = las que llaman a guardMemberPage() (se detectan solas; asi no se desactualiza)
const MEMBER_PAGES = new Set(htmlFiles.filter(f => !f.includes('/') && /guardMemberPage\(/.test(read(f))));
const MEMBER_ORIGIN = new Set(Array.from(MEMBER_PAGES).concat(['miembros.html', 'academia.html', 'aprender.html', 'juego.html']));
const GRANULAR = new Set(['practica', 'practica_miembros', 'plan', 'academia', 'academia_venta', 'pagina_miembros', 'miembros', 'test', 'ejercicios', 'libro']);
const decode = s => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&rarr;/g, '→').replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);
const idCache = {};
function pageHasId(file, id){
  if(!(file in idCache)) idCache[file] = exists(file) ? read(file) : '';
  return new RegExp('(?:id|name)\\s*=\\s*["\']' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']').test(idCache[file]);
}
function resolve(origin, href){
  let h = href.trim().replace(/&amp;/g, '&').replace(/^https?:\/\/(www\.)?inglesconleo\.com/i, '');
  if(/^(https?:|mailto:|tel:|javascript:|data:|sms:|whatsapp:|\/\/)/i.test(h)) return null;
  let hash = '', query = '';
  const hi = h.indexOf('#'); if(hi !== -1){ hash = h.slice(hi + 1); h = h.slice(0, hi); }
  const qi = h.indexOf('?'); if(qi !== -1){ query = h.slice(qi + 1); h = h.slice(0, qi); }
  let p;
  if(h === '') p = origin;
  else if(h[0] === '/') p = h.slice(1);
  else p = path.posix.normalize(path.posix.join(path.posix.dirname(origin), h));
  if(p === '' || p === '.') p = 'index.html';
  if(p.endsWith('/')) p += 'index.html';
  else if(!path.posix.extname(p) && fs.existsSync(path.join(root, p)) && fs.statSync(path.join(root, p)).isDirectory()) p += '/index.html';
  return { path: p, query, hash };
}
function destType(p){
  const f = p.split('/').pop();
  if(f === 'practica.html') return 'practica';
  if(f === 'practica-miembros.html') return 'practica_miembros';
  if(f === 'plan-estudio.html') return 'plan';
  if(f === 'academia.html') return 'academia';
  if(f === 'academia-de-ingles.html') return 'academia_venta';
  if(f === 'miembros.html') return 'miembros';
  if(MEMBER_PAGES.has(f)) return 'pagina_miembros';
  if(/^test-de-nivel/.test(f)) return 'test';
  if(/^ejercicios-/.test(f)) return 'ejercicios';
  if(/^libro-/.test(f)) return 'libro';
  if(/^articulo-/.test(f)) return 'articulo';
  if(/^glosario/.test(p)) return 'glosario';
  return 'otro';
}
const isFicha = f => /^glosario\/[^/]+\/index\.html$/.test(f);
const groupOf = f => /^articulo-/.test(f) ? 'art' : (isFicha(f) ? 'glo' : null);
const nArt = htmlFiles.filter(f => groupOf(f) === 'art').length, nGlo = htmlFiles.filter(f => groupOf(f) === 'glo').length;
const linkRows = new Map();
function addLink(originName, file, text, href, memberOnlyBlock){
  const r = resolve(file, href); if(!r) return;
  const type = destType(r.path);
  const targetOk = exists(r.path);
  let anchorBad = false;
  if(r.hash && targetOk && r.path.endsWith('.html') && r.hash[0] !== '/' && !pageHasId(r.path, r.hash)) anchorBad = true;
  if(!r.hash && !r.query && r.path === file) return;
  const broken = !targetOk || anchorBad;
  if(!GRANULAR.has(type) && !broken){
    const key = originName + '|agregado|' + type;
    const row = linkRows.get(key) || { origen: originName, texto: '(enlaces de lectura a ' + type + ')', destino: type === 'articulo' ? 'articulo-*.html' : type === 'glosario' ? 'glosario/*/' : '(otros)', tema: '', acceso: 'todos', estado: 'verificado', paginas: new Set(), verificacion: 'escaner', nota: 'Todos los destinos y anclas existen (comprobado)' };
    row.paginas.add(file); linkRows.set(key, row); return;
  }
  const full = r.path + (r.query ? '?' + r.query : '') + (r.hash ? '#' + r.hash : '');
  const q = new URLSearchParams(r.query);
  const temaId = q.get('tema') || '';
  let estado = 'verificado', nota = '', acceso = MEMBER_PAGES.has(r.path.split('/').pop()) ? 'solo_miembros' : 'todos';
  const promiseTema = /practic\w*\s+(este\s+)?tema/i.test(text);
  if(!targetOk){ estado = 'enlace_incorrecto'; nota = 'el destino no existe'; }
  else if(anchorBad){ estado = 'enlace_incorrecto'; nota = 'el ancla #' + r.hash + ' no existe en el destino'; }
  else if(type === 'academia' && r.hash.indexOf('/curso/') === 0){
    const cid = r.hash.split('/')[2]; acceso = 'solo_miembros';
    if(!CURSOS[cid]){ estado = 'enlace_incorrecto'; nota = 'el curso no existe'; }
    else if(!CURSOS[cid].open){ estado = 'enlace_incorrecto'; nota = 'el curso esta cerrado en el codigo'; }
    else estado = /demo/.test(r.hash) ? 'verificado' : 'solo_miembros';
  }
  else if(promiseTema && type === 'practica' && !temaId){ estado = 'enlace_incorrecto'; nota = 'promete un tema y abre la practica general'; }
  else if(type === 'practica' && temaId){
    // practica.html?skill=grammar|vocabulary|listening&tema=<id>: practica gratis de ESE tema. Solo vale si el tema existe y tiene ejercicios gratis (si no, el aviso diria que no hay).
    const tt = T.TEMA_BY_ID[temaId], st = stats[temaId];
    if(!tt){ estado = 'enlace_incorrecto'; nota = 'el tema ' + temaId + ' no existe en temas.js'; }
    else if(q.get('skill') !== (tt.skill === 'vocabulary' || tt.skill === 'listening' ? tt.skill : 'grammar')){ estado = 'enlace_incorrecto'; nota = 'el tema ' + temaId + ' no pertenece a la practica ' + q.get('skill'); }
    else if(!st || !sum(st.free)){ estado = 'enlace_incorrecto'; nota = 'el tema ' + temaId + ' no tiene ejercicios gratis'; }
    else nota = 'abre la practica gratis de ese tema';
  }
  else if(type === 'practica' || type === 'practica_miembros'){ estado = 'general_intencional'; nota = promiseTema ? '' : 'el texto no promete un tema'; }
  else if(type === 'plan' || type === 'pagina_miembros'){
    const tt = temaId ? T.TEMA_BY_ID[temaId] : null;
    if(temaId && !tt){ estado = 'enlace_incorrecto'; nota = 'el tema ' + temaId + ' no existe en temas.js'; }
    else if(tt && q.get('foco') && tt.family && q.get('foco') !== tt.family){ estado = 'enlace_incorrecto'; nota = 'la familia ' + q.get('foco') + ' no es la de ' + temaId + ' (' + tt.family + ')'; }
    else {
      estado = 'solo_miembros';
      if(!MEMBER_ORIGIN.has(file) && !memberOnlyBlock){ estado = 'enlace_incorrecto'; nota = 'pagina publica enlaza a pagina de miembros: un visitante termina en miembros.html sin explicacion'; }
    }
  }
  const templ = (type === 'plan' && temaId && T.TEMA_BY_ID[temaId] && estado !== 'enlace_incorrecto');   // se agrupa por plantilla: el tema cambia ficha a ficha
  const shown = templ ? 'plan-estudio.html?foco=<familia>&tema=<tema>' + (q.get('empezar') ? '&empezar=1' : '') : full;
  const key = originName + '|' + text + '|' + shown;
  const row = linkRows.get(key) || { origen: originName, texto: text, destino: shown, tema: templ ? '(uno por pagina)' : temaId, acceso, estado, paginas: new Set(), verificacion: 'escaner', nota };
  row.paginas.add(file); linkRows.set(key, row);
  if(!targetOk || anchorBad || estado === 'enlace_incorrecto' && /no existe en temas|no es la de/.test(nota)) problems.push('Enlace roto en ' + file + ': "' + text + '" -> ' + full + ' (' + nota + ')');
}
htmlFiles.forEach(file => {
  let html = read(file); idCache[file] = html;
  const g = groupOf(file);
  const originName = g === 'art' ? 'ARTICULOS (plantilla, ' + nArt + ' paginas)' : g === 'glo' ? 'GLOSARIO (fichas, ' + nGlo + ' paginas)' : file;
  const scan = (src, name, memberOnly) => {
    let m; const re = /<a\b[^>]*?\bhref\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    while((m = re.exec(src))) addLink(name, file, decode(m[2]) || '(sin texto)', m[1], memberOnly);
    const rb = /<button\b[^>]*onclick="[^"]*location\.href\s*=\s*'([^']*)'[^"]*"[^>]*>([\s\S]*?)<\/button>/gi;
    while((m = rb.exec(src))) addLink(name, file, decode(m[2]) || '(sin texto)', m[1], memberOnly);
  };
  const chrome = [];
  html = html.replace(/<(nav|footer|header)\b[\s\S]*?<\/\1>/gi, m => { chrome.push(m); return ' '; });
  html = html.replace(/<div class="gl-tema"[^>]*hidden>[\s\S]*?<\/div>\s*<\/div>/gi, m => { scan(m, 'GLOSARIO (bloque solo para miembros)', true); return ' '; });
  scan(html, originName, false);
  if(file === 'index.html') chrome.forEach(c => scan(c, 'NAVEGACION (cabecera, pie y barra movil)', false));
});
const linkList = Array.from(linkRows.values()).sort((a, b) => (a.origen + a.destino).localeCompare(b.origen + b.destino));

/* ---------- 4. Destinos dinamicos (curados) ---------- */
const dyn = JSON.parse(read('tools/conexiones/destinos-dinamicos.json')).entradas;
dyn.forEach(d => { if(!exists(d.archivo) || read(d.archivo).indexOf(d.aguja) === -1) problems.push('Destino dinamico ' + d.id + ' desactualizado: ya no existe "' + d.aguja + '" en ' + d.archivo); });

/* ---------- 5. Salidas ---------- */
const csvCell = v => '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
const csv = (cols, rows) => '﻿' + [cols.map(csvCell).join(',')].concat(rows.map(r => cols.map(c => csvCell(r[c])).join(','))).join('\r\n') + '\r\n';
const linkCols = ['id', 'tipo', 'origen', 'texto_boton', 'tema', 'destino_real', 'destino_esperado', 'acceso', 'estado', 'paginas', 'verificacion', 'nota'];
const invRows = [];
linkList.forEach((r, i) => invRows.push({ id: 'E' + String(i + 1).padStart(3, '0'), tipo: 'HTML', origen: r.origen, texto_boton: r.texto, tema: r.tema, destino_real: r.destino,
  destino_esperado: r.estado === 'enlace_incorrecto' ? '(ver nota)' : r.destino, acceso: r.acceso, estado: r.estado, paginas: r.paginas.size, verificacion: r.verificacion, nota: r.nota }));
dyn.forEach(d => invRows.push({ id: d.id, tipo: d.tipo, origen: d.origen, texto_boton: d.texto, tema: d.tema, destino_real: d.destino_real, destino_esperado: d.destino_esperado, acceso: d.acceso, estado: d.estado, paginas: '', verificacion: d.verificacion, nota: d.nota }));
const temaCols = Object.keys(temaRows[0]);
const outputs = { 'INVENTARIO_CONEXIONES.csv': csv(linkCols, invRows), 'INVENTARIO_TEMAS.csv': csv(temaCols, temaRows) };

const count = (rows, f) => rows.reduce((m, r) => { const k = f(r); m[k] = (m[k] || 0) + 1; return m; }, {});
const ES = ['verificado', 'parcial', 'enlace_incorrecto', 'recurso_sin_conectar', 'por_construir', 'solo_miembros', 'general_intencional'];
const cT = count(temaRows, r => r.estado_miembros), cG = count(temaRows, r => r.estado_gratis), cL = count(invRows, r => r.estado);
const tbl = (head, rows) => '| ' + head.join(' | ') + ' |\n|' + head.map(() => '---').join('|') + '|\n' + rows.map(r => '| ' + r.join(' | ') + ' |').join('\n');
const freeTemas = temaRows.filter(r => r.estado_gratis === 'recurso_sin_conectar').length;
const memberOnlyTemas = temaRows.filter(r => r.estado_gratis === 'solo_miembros').length;
const freeOfTopic = tp => { const t = T.temaForTopic(tp); return !!(t && stats[t.id] && sum(stats[t.id].free)); };
const allTopics = Object.keys(D.GRAMMAR_BANK).reduce((a, l) => a.concat(D.GRAMMAR_BANK[l].reduce((b, v) => b.concat(v.map(g => g.topic)), [])), []);
// Una tarjeta del inicio es "gratis" si algun tema gramatical con ese nombre corto tiene ejercicios gratis.
const cardFree = MINI.map(m => allTopics.some(tp => labelOfTopic(tp) === m[0] && freeOfTopic(tp)));
const cardsFree = cardFree.filter(Boolean).length;
const labelFree = {};
Object.keys(D.GRAMMAR_BANK).forEach(l => D.GRAMMAR_BANK[l].forEach((v, vi) => v.forEach(g => { const blocked = ((MO.gramatica || {})[l] || []).indexOf(vi) !== -1; const n = g.items.filter(it => !blocked || (SAMPLE[l] || []).indexOf(it.id) !== -1).length; if(n) labelFree[labelOfTopic(g.topic)] = true; })));
const cardsFreeExact = MINI.filter(m => labelFree[m[0]]).length;
// Que abre el boton de cada tarjeta (mini-lecciones.js, columna 4): tema | clase | general. Un boton 'tema' exige practica gratis de ESE tema.
const cardKinds = {}; MINI.forEach(m => { cardKinds[m[3]] = (cardKinds[m[3]] || 0) + 1; });
MINI.forEach(m => { if(m[3] === 'tema' && !(stats[m[2]] && sum(stats[m[2]].free))) problems.push('Tarjeta "' + m[0] + '": el boton promete practicar el tema ' + m[2] + ' y ese tema no tiene ejercicios gratis'); });
const gaps = temaRows.filter(r => r.niveles_miembro !== '-' && r.niveles_miembro.split(' ').length < LEVELS.length).length;
// Prioridad de los temas sin clase ni ficha: no se crea contenido por crearlo; primero lo que mas se promete y mas se practica.
const cardsOfTema = {}; MINI.forEach(m => { if(m[2]) cardsOfTema[m[2]] = (cardsOfTema[m[2]] || 0) + 1; });
const sinExplicacion = temaRows.filter(r => !r.clase && !r.glosario).map(r => {
  const total = stats[r.tema_id] ? sum(stats[r.tema_id].all) : 0, gram = !r.habilidad || r.habilidad === 'grammar';
  const score = (cardsOfTema[r.tema_id] || 0) * 3 + (gram ? 2 : 0) + Math.min(total, 40) / 10 + (total ? 0 : -5);
  const nivel = !total ? 'Ninguna (primero faltan ejercicios)' : (cardsOfTema[r.tema_id] && gram) ? 'Alta' : gram ? 'Media' : 'Baja (su propia seccion ya practica el tema)';
  return { id: r.tema_id, tarjetas: cardsOfTema[r.tema_id] || 0, ejercicios: total, nivel, score };
}).sort((a, b) => b.score - a.score);
const blocks = {
  resumen: tbl(['Estado', 'Enlaces y destinos (INVENTARIO_CONEXIONES.csv)', 'Temas: practica de miembros', 'Temas: practica gratis'], ES.map(e => [e, cL[e] || 0, cT[e] || 0, cG[e] || 0])) +
    '\n\n' + temaRows.length + ' temas en temas.js. ' + invRows.length + ' filas de enlaces: ' + linkList.length + ' agrupadas desde ' + htmlFiles.length + ' paginas HTML y ' + dyn.length + ' destinos dinamicos o redirecciones curados.',
  cifras: '- Temas de temas.js: ' + temaRows.length + '. Con ejercicios gratis: ' + freeTemas + '. Solo con ejercicios de Miembros: ' + memberOnlyTemas + '. Sin ejercicios: ' + (cG.por_construir || 0) + '.\n' +
    '- Temas cuya practica de miembros existe solo en algunos niveles (en los demas el Plan usa el nivel mas cercano y lo avisa, sin cambiar el nivel guardado): ' + gaps + ' de ' + temaRows.length + '.\n' +
    '- Tarjetas del inicio (mini-lecciones.js): ' + MINI.length + '. Con ejercicios gratis del mismo tema (nivel tema): ' + cardsFree + '; del mismo tema exacto (mismo nombre de la tarjeta): ' + cardsFreeExact + '. Sin ningun ejercicio gratis del tema exacto: ' + (MINI.length - cardsFreeExact) + '.\n' +
    '- Que abre el boton de cada tarjeta del inicio: ' + Object.keys(cardKinds).map(k => k + ' ' + cardKinds[k]).join(', ') + ' (tema = practica gratis de ese tema; clase = su explicacion; general = practica de gramatica en general, y el texto del boton lo dice).\n' +
    '- Enlaces HTML con destino o ancla inexistente: ' + invRows.filter(r => r.tipo === 'HTML' && /no existe/.test(r.nota)).length + '. Enlaces HTML que prometen un tema y abren la practica general: ' + invRows.filter(r => r.tipo === 'HTML' && /^promete un tema/.test(r.nota)).length + '. Paginas publicas que enlazan a paginas de miembros sin explicarlo: ' + invRows.filter(r => r.tipo === 'HTML' && /pagina publica enlaza/.test(r.nota)).length + '.\n' +
    '- Temas con 6 ejercicios gratis o menos (una sesion gratis normal es de 6 a 8): ' + temaRows.filter(r => stats[r.tema_id] && sum(stats[r.tema_id].free) > 0 && sum(stats[r.tema_id].free) <= 6).length + '. Temas con ejercicios gratis en un solo nivel: ' + temaRows.filter(r => stats[r.tema_id] && Object.keys(stats[r.tema_id].free).length === 1).length + '.\n' +
    '- Temas sin clase ni ficha del glosario (no hay explicacion que ofrecer): ' + temaRows.filter(r => !r.clase && !r.glosario).length + '. Temas con clase: ' + temaRows.filter(r => r.clase).length + '. Con ficha: ' + temaRows.filter(r => r.glosario).length + '.',
  prioridad: tbl(['Tema', 'Tarjetas del inicio que lo prometen', 'Ejercicios', 'Prioridad de una explicacion'], sinExplicacion.map(x => ['`' + x.id + '`', x.tarjetas, x.ejercicios, x.nivel])) + '\n\nCriterio: primero los temas de gramatica que una tarjeta del inicio ya promete y que tienen ejercicios; el tamano recomendado es una ficha corta del glosario, no una clase completa. Vocabulario y listening tienen su propia seccion.',
  faltantes: [
    '- Sin clase ni ficha (' + temaRows.filter(r => !r.clase && !r.glosario).length + '): ' + temaRows.filter(r => !r.clase && !r.glosario).map(r => '`' + r.tema_id + '`').join(', '),
    '- Sin ejercicios (' + temaRows.filter(r => r.estado_miembros === 'por_construir').length + '): ' + temaRows.filter(r => r.estado_miembros === 'por_construir').map(r => '`' + r.tema_id + '`').join(', '),
    '- Gramatica con ejercicios pero sin familia en temas.js, asi que el Plan no puede enfocarlos (' + temaRows.filter(r => r.estado_miembros === 'enlace_incorrecto').length + '): ' + temaRows.filter(r => r.estado_miembros === 'enlace_incorrecto').map(r => '`' + r.tema_id + '`').join(', '),
    '- Solo con ejercicios de Miembros, nada gratis (' + temaRows.filter(r => r.estado_gratis === 'solo_miembros').length + '): ' + temaRows.filter(r => r.estado_gratis === 'solo_miembros').map(r => '`' + r.tema_id + '`').join(', '),
    '- Con curso en el codigo pero cerrado: ' + (temaRows.filter(r => r.curso && r.curso_abierto_codigo !== 'si').map(r => '`' + r.tema_id + '`').join(', ') || 'ninguno')
  ].join('\n'),
  matriz: tbl(['Tema', 'Hab.', 'Clase', 'Ficha', 'Curso', 'Quiz', 'Gratis (por nivel)', 'Solo miembros', 'Miembros', 'Gratis', 'Falta'],
    temaRows.map(r => ['`' + r.tema_id + '`', r.habilidad.slice(0, 4), r.clase ? 'si' : '-', r.glosario ? 'si' : '-', r.curso ? (r.curso_abierto_codigo === 'si' ? r.curso : r.curso + ' (cerrado)') : '-', r.quiz_articulo || '-', r.ejercicios_gratis, r.ejercicios_solo_miembros, r.estado_miembros, r.estado_gratis, r.falta || '-'])),
  diagrama: (function(){
    const nid = s => 'n_' + String(s).replace(/[^a-zA-Z0-9]/g, '_');
    const lines = ['```mermaid', 'flowchart LR'];
    temaRows.filter(r => r.curso || r.quiz_articulo).forEach(r => {
      const T0 = nid('t' + r.tema_id);
      lines.push('  ' + T0 + '["' + r.etiqueta.replace(/"/g, "'").slice(0, 38) + '"]:::tema');
      if(r.clase) lines.push('  ' + T0 + ' --> ' + nid('c' + r.tema_id) + '["clase"]:::ok');
      if(r.glosario) lines.push('  ' + T0 + ' --> ' + nid('g' + r.tema_id) + '["ficha"]:::ok');
      if(r.quiz_articulo) lines.push('  ' + T0 + ' --> ' + nid('q' + r.tema_id) + '["quiz ' + r.quiz_articulo + ' preg."]:::ok');
      if(r.curso) lines.push('  ' + T0 + ' --> ' + nid('k' + r.tema_id) + '["curso ' + r.curso + (r.curso_abierto_codigo === 'si' ? '' : ' (cerrado)') + '"]:::' + (r.curso_abierto_codigo === 'si' ? 'miembros' : 'bad'));
      lines.push('  ' + T0 + ' -.-> ' + nid('p' + r.tema_id) + '["Miembros: ' + r.estado_miembros + '"]:::' + (r.estado_miembros === 'verificado' ? 'ok' : 'warn'));
      lines.push('  ' + T0 + ' -.-> ' + nid('f' + r.tema_id) + '["Gratis: ' + r.estado_gratis + '"]:::' + (r.estado_gratis === 'solo_miembros' ? 'miembros' : 'warn'));
    });
    lines.push('  classDef tema fill:#e8edff,stroke:#253ecc,color:#111', '  classDef ok fill:#e6f6ea,stroke:#2e7d32,color:#111', '  classDef warn fill:#fff4d6,stroke:#b26a00,color:#111', '  classDef miembros fill:#efe6ff,stroke:#6a3fb5,color:#111', '  classDef bad fill:#fde4e4,stroke:#c62828,color:#111', '```');
    return lines.join('\n');
  })()
};
['MAPA_CONEXIONES.md', 'PLAN_CONEXIONES.md'].forEach(f => {
  if(!exists(f)){ problems.push(f + ' no existe'); return; }
  let src = read(f);
  Object.keys(blocks).forEach(name => {
    const re = new RegExp('(<!-- GENERADO:' + name + ' -->)[\\s\\S]*?(<!-- /GENERADO:' + name + ' -->)');
    if(re.test(src)) src = src.replace(re, (m, a, b) => a + '\n' + blocks[name] + '\n' + b);
  });
  outputs[f] = src;
});
Object.keys(outputs).forEach(f => {
  const cur = exists(f) ? read(f) : null;
  if(WRITE){ if(cur !== outputs[f]){ fs.writeFileSync(path.join(root, f), outputs[f]); console.log('escrito  ' + f); } else console.log('sin cambios ' + f); }
  else if(cur !== outputs[f]) problems.push(f + ' esta desactualizado: corre  node tools/conexiones/auditar.js --write');
});
console.log('Temas: ' + temaRows.length + ' | filas de enlaces: ' + invRows.length + ' | paginas HTML: ' + htmlFiles.length);
console.log('Estados (enlaces): ' + JSON.stringify(cL));
console.log('Estados (temas, miembros): ' + JSON.stringify(cT) + ' | (gratis): ' + JSON.stringify(cG));
console.log(blocks.cifras);
if(problems.length){ console.log('\nPROBLEMAS (' + problems.length + '):'); problems.slice(0, 60).forEach(p => console.log(' - ' + p)); if(problems.length > 60) console.log(' ... y ' + (problems.length - 60) + ' mas'); process.exit(1); }
console.log('OK: sin problemas.');
