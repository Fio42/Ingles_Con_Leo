#!/usr/bin/env node
/* PRUEBA DE ACEPTACION del piloto de conexiones (no compara contra una linea base: exige que cada boton CUMPLA lo que dice).
   Seis temas del piloto, los cuatro niveles guardados posibles y las tres clases de usuario que aplican a cada camino.
   Corre con:  node tools/tests/piloto-conexiones.test.js   (desde la carpeta inglesconLeo)
   Para cada tema y nivel guardado de un MIEMBRO construye el boton "Practicar <tema>" con el codigo real de app.js, arma la sesion del Plan
   como lo hace el navegador, y exige:
     1. Si el texto del boton nombra el tema, TODOS los ejercicios de foco son de ese tema (se comprueba con el indice real de ejercicios).
     2. Si los ejercicios vienen de otro nivel: la sesion lo avisa, cada ejercicio queda marcado con su nivel real (cl) y el nivel guardado,
        el perfil y el progreso NO cambian.
     3. Si no hay ejercicios de ese tema en ningun nivel (o el tema no tiene familia): el texto del boton ya NO nombra el tema como si hubiera practica.
     4. La sesion tiene ejercicios y no se rompe con ninguna duracion (corta, media y larga). */
'use strict';
const { A, store, reset } = require('./lib/cargar-app');
const PILOTO = ['by-until', 'presente-simple', 'your-vs-youre', 'cuantificadores', 'question-tags', 'vocab-confusas'];
const fails = []; let checks = 0;
const ok = (cond, msg) => { checks++; if(!cond) fails.push(msg); };

function temaOf(entry){ const f = A.getDiagItemIndex().get(entry.item.id); return f ? A.diagTemaIdForFound(f) : null; }
function snapshot(){ return JSON.stringify(store); }

PILOTO.forEach(id => {
  const tema = A.TEMA_BY_ID[id];
  ok(!!tema, id + ': el tema existe en temas.js');
  if(!tema) return;
  A.LEVELS.forEach(level => {
    reset(); A.saveProfile({ level });
    const antes = snapshot();
    const c = A.contentForTema(id);
    const where = id + ' / nivel guardado ' + level + ' -> ';
    ok(c && c.practiceHref && c.practiceLabel && c.practiceKind, where + 'contentForTema entrega href, texto y clase de practica');
    if(!c) return;
    const nombraElTema = c.practiceLabel === 'Practicar ' + tema.label;
    // 3. honestidad del texto
    if(c.practiceKind === 'general' || c.practiceKind === 'familia')
      ok(!nombraElTema, where + 'sin ejercicios de este tema, el texto "' + c.practiceLabel + '" no debe prometer practicar el tema');
    else ok(nombraElTema, where + 'con ejercicios del tema, el texto nombra el tema');
    // la clase real de practica coincide con lo que existe
    const existeEnNivel = A.temaHasItemsAt(id, level), cercano = A.nearestLevelWithTema(id, level);
    if(tema.skill !== 'vocabulary' && tema.skill !== 'listening'){
      const esperado = !tema.family ? 'general' : existeEnNivel ? 'tema' : cercano ? 'otro-nivel' : A.familyHasItemsAt(tema.family, level) ? 'familia' : 'general';
      ok(c.practiceKind === esperado, where + 'clase de practica ' + c.practiceKind + ' (esperada ' + esperado + ')');
    }
    if(c.practiceKind !== 'tema' && c.practiceKind !== 'otro-nivel') return;
    // 1 y 2. la sesion real
    const q = new URLSearchParams(c.practiceHref.split('?')[1] || '');
    ok(/^plan-estudio\.html/.test(c.practiceHref) && q.get('tema') === id, where + 'el boton lleva al Plan con ?tema=' + id);
    [5, 9, 15].forEach(n => {
      for(let rep = 0; rep < 6; rep++){
        const sel = A.computePlanSelection(level, n, { focusFamily: q.get('foco') || undefined, focusTema: q.get('tema') });
        const w = where + 'duracion ' + n + ': ';
        ok(!!sel.focus && sel.focus.temaId === id, w + 'la seleccion enfoca el tema pedido');
        if(!sel.focus) continue;
        const contentLevel = A.resolvePlanContentLevel(level, 'recommended');
        const pool = A.buildPlanPool(contentLevel, sel);
        const foco = pool.filter(e => e.focusLabel !== undefined);
        // "Practicar este tema" = SOLO ese tema: ni relleno con otros temas ni errores o habilidades ajenas para llegar a un numero.
        const skillKey = tema.skill === 'vocabulary' ? 'vocabulario' : tema.skill === 'listening' ? 'listening' : 'gramatica';
        const disponibles = A.pickTemaOnlyItems(skillKey, cercano && !existeEnNivel ? cercano : level, id, 100000).length;
        ok(pool.length === foco.length && pool.every(e => e.focusTemaOnly), w + 'la sesion es solo del tema: ' + pool.length + ' ejercicios, ninguno ajeno (' + (pool.length - foco.length) + ' de relleno)');
        ok(pool.length === Math.min(n, disponibles), w + 'largo = min(duracion ' + n + ', disponibles ' + disponibles + ') y no mas');
        ok(sel.focus.temaOnly === true && !foco.some(e => e.focusFamilyFill), w + 'sin marca de relleno de familia');
        if(disponibles < n && pool.length) ok(/todos los que hay de este tema/.test(A.planHonestNoteHtml(pool[0], level, 0)), w + 'si hay pocos, el primer ejercicio lo dice desde el principio');
        ok(foco.length >= 1, w + 'hay al menos un ejercicio de foco');
        ok(foco.some(e => (e.kind === 'grammar' ? temaOf(e) : e.focusTema) === id), w + 'al menos un ejercicio es realmente del tema');
        ok(pool.length > 0, w + 'la sesion no esta vacia');
        let delTema = 0;
        foco.forEach(e => {
          const t = e.kind === 'grammar' ? temaOf(e) : (e.focusTema || null);
          if(t === id) delTema++;
          else if(false){
            // Completa con la familia SOLO si lo dice: el ejercicio queda marcado y la sesion lo avisa.
            ok(/misma familia/.test(A.planHonestNoteHtml(e, level)), w + 'el ejercicio ' + e.item.id + ' (de ' + t + ') completa con la familia y la sesion lo avisa');
          } else ok(false, w + 'el ejercicio ' + e.item.id + ' no es del tema ' + id + ' (es de ' + t + ') y no esta marcado como relleno de familia');
          if(c.practiceKind === 'otro-nivel'){
            ok(e.cl && e.cl !== level && e.cl === cercano, w + 'ejercicio ' + e.item.id + ' marcado con su nivel real (' + e.cl + ')');
            const enBanco = A.GRAMMAR_BANK[e.cl].some(v => v.some(g => g.items.some(it => it.id === e.item.id)));
            ok(enBanco, w + 'el ejercicio ' + e.item.id + ' existe de verdad en el banco ' + e.cl);
            ok(/Tu nivel guardado no cambia/.test(A.planHonestNoteHtml(e, level)), w + 'la sesion avisa que usa otro nivel y que el guardado no cambia');
          }
        });
      }
    });
    // 2. nada se escribio ni se cambio el nivel
    ok(A.getUserLevel() === level, where + 'el nivel guardado sigue siendo ' + level);
    ok(snapshot() === antes, where + 'armar la sesion no escribio nada en el almacenamiento (perfil y progreso intactos)');
  });
});

/* ---------- Tarjeta del inicio ("Siguiente refuerzo") y practica gratis por tema ---------- */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { root, read, run } = require('./lib/cargar-app');
const MINI = vm.runInNewContext(read('mini-lecciones.js') + ';MINI_LESSONS');
const blockedOf = l => (A.MEMBERS_ONLY_VARIANT_INDEX.gramatica[l] || []);
ok(MINI.length > 0 && MINI.every(r => r.length === 5), 'mini-lecciones.js: cada tarjeta trae etiqueta, explicacion, tema, clase de boton y destino');
MINI.forEach(r => {
  const [label, tip, id, kind, href] = r, w = 'tarjeta "' + label + '" -> ';
  ok(!!tip, w + 'tiene explicacion (no sale una tarjeta vacia)');
  const hayGratis = !!id && A.LEVELS.some(l => A.freeGrammarItemsOfTema(l, id).length > 0);
  const t = A.TEMA_BY_ID[id];
  if(kind === 'tema'){
    ok(hayGratis, w + 'promete practicar el tema "' + id + '" y SI hay ejercicios gratis de ese tema');
    ok(href === 'practica.html?skill=grammar&tema=' + id, w + 'el destino lleva el tema (' + href + ')');
    // lo que se abre de verdad: la sesion gratis de ese tema solo trae ejercicios de ese tema
    A.LEVELS.forEach(l => A.freeGrammarItemsOfTema(l, id).forEach(it => ok(A.diagTemaIdForFound({ kind: 'grammar', item: it, topic: it.topic }) === id, w + 'ejercicio gratis ' + it.id + ' es del tema ' + id)));
  } else if(kind === 'clase'){
    ok(!hayGratis, w + 'si hubiera practica gratis de ese tema, el boton la ofreceria');
    const file = href.charAt(0) === '/' ? path.join(root, href.slice(1), 'index.html') : path.join(root, href);
    ok(fs.existsSync(file), w + 'la explicacion existe (' + href + ')');
    ok(t && (t.article === href || '/glosario/' + t.glossary + '/' === href), w + 'la explicacion es la del tema ' + id);
  } else if(kind === 'general'){
    ok(!hayGratis && (!t || (!t.article && !t.glossary)), w + 'boton general solo si no hay practica gratis ni explicacion del tema');
    ok(href === 'practica.html?skill=grammar', w + 'el destino es la practica general de gramatica');
  } else ok(false, w + 'clase de boton desconocida: ' + kind);
});
// El boton de index.html (por defecto, antes de que cargue el JS) tambien dice la verdad
const idx = read('index.html'); const m = idx.match(/<a href="([^"]+)" class="hero-v2-card-link">([^<]+)</);
ok(!!m, 'index.html: existe el boton de la tarjeta');
if(m){ const tm = /[?&]tema=([\w-]+)/.exec(m[1]); ok(!!tm && A.LEVELS.some(l => A.freeGrammarItemsOfTema(l, tm[1]).length > 0) && /Practicar este tema/.test(m[2]), 'index.html: el boton por defecto promete un tema y ese tema tiene practica gratis'); }

// Practica gratis: reutiliza el mismo criterio de "gratis" (variantes no reservadas + muestra fija) y no abre nada de miembros
['by-until', 'presente-simple', 'question-tags', 'your-vs-youre', 'cuantificadores'].forEach(id => A.LEVELS.forEach(l => {
  const items = A.freeGrammarItemsOfTema(l, id), w = 'gratis ' + id + '/' + l + ': ';
  const permitidos = new Set(); A.GRAMMAR_BANK[l].forEach((v, vi) => v.forEach(g => g.items.forEach(it => { if(blockedOf(l).indexOf(vi) === -1 || (A.FREE_SAMPLE_IDS[l] || []).indexOf(it.id) !== -1) permitidos.add(it.id); })));
  items.forEach(it => ok(permitidos.has(it.id), w + it.id + ' es gratis de verdad (no es de variante reservada a miembros)'));
  ok(items.length === 0 || /Practicas solo ejercicios/.test(A.freeTemaNoteHtml(id, l, l, items.length)), w + 'el aviso dice que solo son de ese tema');
  ok(items.length > 0 || /Todav[ií]a no hay ejercicios gratis/.test(A.freeTemaNoteHtml(id, l, l, 0)), w + 'sin ejercicios gratis lo dice y no los inventa');
}));
ok(A.freeLevelForTema('question-tags', 'facil') === 'medio', 'question-tags: pedido en Facil, el nivel gratis mas cercano es Medio');
ok(/No hay ejercicios gratis de este tema en el nivel F/.test(A.freeTemaNoteHtml('question-tags', 'medio', 'facil', 5)), 'question-tags: avisa del cambio de nivel');
ok(A.freeLevelForTema('your-vs-youre', 'facil') === null, 'your-vs-youre: no hay ejercicios gratis en ningun nivel');

// Limite diario: la sesion de un tema pasa por el mismo recorte que la practica de siempre
run("_leoAccessTier = 'free'; getFreeAcctExerciseCount = () => FREE_USER_DAILY_LIMIT - 3;");
const pool8 = A.freeGrammarItemsOfTema('facil', 'presente-simple');
ok(run('freeSessionCap').call(null, pool8.slice()).length === 3, 'limite diario: con 3 ejercicios disponibles hoy, la sesion de un tema se recorta a 3');
run("_leoAccessTier = 'guest'");

if(fails.length){ console.error('FALLA piloto-conexiones (' + fails.length + ' de ' + checks + '):\n  ' + fails.slice(0, 25).join('\n  ')); process.exit(1); }
console.log('piloto-conexiones (miembros, tarjeta y practica gratis): ' + checks + ' comprobaciones, 6 temas x 4 niveles guardados, todas bien');
