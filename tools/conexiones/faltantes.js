#!/usr/bin/env node
/* Refuerzos que faltan: temas donde un error NO tiene hoy una explicacion o practica exacta que ofrecer.
   El sitio omite esa recomendacion (no manda a una pagina general); aqui queda apuntado que habria que crear.
   Fuente: INVENTARIO_TEMAS.csv (generado por auditar.js) + ejemplos reales de data.js.
   Corre con:  node tools/conexiones/faltantes.js --write   (regenera REFUERZOS_FALTANTES.md)
               node tools/conexiones/faltantes.js            (solo comprueba que este al dia) */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/^﻿/, '');
function parseCsv(text){
  const rows = []; let row = [], cur = '', q = false;
  for(let i = 0; i < text.length; i++){
    const c = text[i];
    if(q){ if(c === '"'){ if(text[i+1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; }
    else if(c === '"') q = true;
    else if(c === ','){ row.push(cur); cur = ''; }
    else if(c === '\n'){ row.push(cur); rows.push(row); row = []; cur = ''; }
    else if(c !== '\r') cur += c;
  }
  if(cur || row.length){ row.push(cur); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(read('data.js') + '\n;this.GB = GRAMMAR_BANK;', ctx);
vm.runInContext(read('temas.js') + '\n;this.TT = TEMAS; this.tft = temaForTopic;', ctx);
const temaOfTopic = topic => ctx.tft(topic);

// Un ejemplo real del tema: oracion con la respuesta correcta y una opcion equivocada (si el ejercicio la trae).
function exampleFor(temaId){
  let found = null;
  ['principiante', 'facil', 'medio', 'avanzado'].forEach(l => (ctx.GB[l] || []).forEach(v => v.forEach(b => {
    if(found) return;
    const t = temaOfTopic(b.topic); if(!t || t.id !== temaId) return;
    const it = b.items.find(x => (x.type === 'fill' && Array.isArray(x.sentence) && x.correct) || (x.type === 'choice' && x.prompt && Array.isArray(x.options) && Number.isInteger(x.correct))) || null;
    if(!it) return;
    let fix, ok, bad;
    if(it.type === 'fill'){
      fix = it.sentence.join(' ').replace(/ ([.,?!])/g, '$1'); ok = it.correct;
      bad = (it.bank || []).find(x => x !== it.correct);
    } else {
      fix = it.prompt; ok = it.options[it.correct];
      bad = it.options.find((x, i) => i !== it.correct);
    }
    found = { level: l, id: it.id, ok: fix.replace('___', ok), bad: bad ? fix.replace('___', bad) : null };
  })));
  return found;
}
function build(){
  const rows = parseCsv(read('INVENTARIO_TEMAS.csv')).filter(r => r.habilidad === 'grammar');
  const n = s => { const m = String(s || '').match(/\d+/g); return m ? m.reduce((a, b) => a + Number(b), 0) : 0; };
  const paraguas = new Set((read('temas.js').match(/id:'([a-z0-9-]+)',\s*merges:/g) || []).map(m => m.match(/'([^']+)'/)[1]));
  const sinExpl = [], sinGratis = [], sinFamilia = [], sinEjercicios = [];
  rows.forEach(r => {
    const gratis = n(r.ejercicios_gratis), miembros = n(r.ejercicios_solo_miembros);
    const sinExp = !r.clase && !r.glosario;
    const total = gratis + miembros;
    // Un tema paraguas (merges) no tiene ejercicios propios: viven en los temas antiguos que absorbe y en sus microtemas.
    if(!total && !paraguas.has(r.tema_id)){ sinEjercicios.push(r); return; }
    if(!total) return;
    if(sinExp) sinExpl.push(r);
    if(!gratis) sinGratis.push(r);
    if(!r.familia && /gramatica\.html/.test(r.practica_miembros || '')) sinFamilia.push(r);
  });
  const ex = id => { const e = exampleFor(id); return e && e.ok ? (e.bad ? '`' + e.bad + '` (opcion equivocada) / `' + e.ok + '` (correcta)' : '`' + e.ok + '`') : '(ver el banco de data.js)'; };
  const L = [];
  L.push('# Refuerzos que faltan', '');
  L.push('Generado por `node tools/conexiones/faltantes.js --write`. No editar a mano.', '');
  L.push('Cuando un alumno se equivoca, el sitio solo le recomienda recursos que existen y que resuelven ese tema: la clase o ficha del tema, su practica propia y su curso publicado. Si falta el recurso exacto, esa recomendacion se omite (no se manda a una pagina general). Esta lista dice que habria que crear para que ese error tenga refuerzo.', '');
  L.push('Alcance: solo gramatica. Vocabulario y listening tienen su propia seccion de practica y se explican con fichas del glosario por pareja de palabras (ver `INVENTARIO_TEMAS.csv`).', '');
  L.push('## 1. Falta una explicacion (ni clase ni ficha del glosario)', '');
  L.push('Hoy el error de estos temas no ofrece "Ver la clase". Recurso a crear: una ficha corta en `/glosario/<tema>/` (no hace falta una clase completa) y enlazarla en `temas.js` (`glossary`).', '');
  L.push('| Tema | Ejercicios | Ejemplo de un ejercicio | Recurso a crear |', '|---|---|---|---|');
  if(!sinExpl.length) L.push('', 'Ninguno: todos los temas con ejercicios tienen clase o ficha.');
  sinExpl.forEach(r => { const e = exampleFor(r.tema_id); L.push('| `' + r.tema_id + '` | ' + (n(r.ejercicios_gratis) + n(r.ejercicios_solo_miembros)) + ' | ' + ex(r.tema_id) + ' | Ficha de glosario "' + r.etiqueta + '" |'); });
  L.push('', '## 2. Falta practica gratis del tema (todo es solo de Miembros)', '');
  const exclusivos = sinGratis.filter(r => /plan-estudio\.html/.test(r.practica_miembros || ''));
  const soloGeneral = sinGratis.filter(r => !/plan-estudio\.html/.test(r.practica_miembros || ''));
  L.push('Resumen de los ' + sinGratis.length + ' temas: ' + exclusivos.length + ' tienen practica EXCLUSIVA para Miembros (hay ejercicios y el Plan abre una practica enfocada en el tema, verificado) y ' + soloGeneral.length + ' carecen de practica propia tambien para Miembros. Ninguno esta sin ejercicios: lo que falta es la version gratis.', '');
  L.push('A visitantes y cuentas gratis el resumen les ofrece la explicacion, pero no "Practicar este tema". Recurso a crear: una muestra fija de 6 ejercicios abiertos (como ya existe para Do/Does). Es una decision de monetizacion de Leo.', '');
  L.push('| Tema | Ejercicios de Miembros (nivel) | Practica de Miembros | Practica gratis | Ejemplo de un ejercicio | Recurso a crear |', '|---|---|---|---|---|---|');
  sinGratis.forEach(r => L.push('| `' + r.tema_id + '` | ' + n(r.ejercicios_solo_miembros) + ' (' + (r.niveles_miembro || '-') + ') | ' + (/plan-estudio\.html/.test(r.practica_miembros || '') ? 'Exclusiva: Plan enfocado en el tema' : 'Solo la general') + ' | Ninguna | ' + ex(r.tema_id) + ' | Muestra gratis de 6 ejercicios |'));
  L.push('', '## 3. Practica de Miembros sin familia (el Plan no puede enfocar el tema)', '');
  L.push('Estos temas tienen ejercicios, pero no pertenecen a ninguna familia del diagnostico, asi que el Plan no puede abrir una practica solo de ese tema y el resumen no ofrece "Practicar". Recurso a crear: asignar una familia en `temas.js` (toca el diagnostico: se prueba aparte).', '');
  L.push('| Tema | Ejercicios | Ejemplo de un ejercicio |', '|---|---|---|');
  sinFamilia.forEach(r => L.push('| `' + r.tema_id + '` | ' + (n(r.ejercicios_gratis) + n(r.ejercicios_solo_miembros)) + ' | ' + ex(r.tema_id) + ' |'));
  const sinRutaSkill = parseCsv(read('INVENTARIO_TEMAS.csv')).filter(r => r.habilidad !== 'grammar' && r.estado_gratis === 'recurso_sin_conectar');
  L.push('', '## 4. Vocabulario y listening: ejercicios gratis sin ruta por tema', '');
  L.push('La practica gratis por tema (`practica.html?skill=grammar&tema=<id>`) solo existe en gramatica. Estos temas tienen ejercicios gratis, pero el resumen de errores no puede abrir una practica solo de ese tema: ofrece su explicacion (ficha por pareja de palabras) y no un boton de practica. Recurso a crear: la misma ruta `?skill=vocabulary&tema=<id>` y `?skill=listening&tema=<id>` en `initFreePractice` (app.js).', '');
  sinRutaSkill.forEach(r => L.push('- `' + r.tema_id + '` (' + r.habilidad + '): ' + (n(r.ejercicios_gratis)) + ' ejercicios gratis'));
  L.push('', '## 5. Sin ejercicios en ningun nivel', '');
  if(!sinEjercicios.length) L.push('Ninguno. (`cuantificadores` es un tema paraguas: sus ejercicios viven en much-many, some-any, little-few, fewer-vs-less y contables-incontables, y en sus microtemas a-lot-of y some-any-pregunta-oferta, ya activos.)');
  sinEjercicios.forEach(r => L.push('- `' + r.tema_id + '` (' + r.etiqueta + '): crear ejercicios antes que cualquier refuerzo.'));
  L.push('');
  return L.join('\n');
}
const out = build(), file = path.join(root, 'REFUERZOS_FALTANTES.md');
if(process.argv.includes('--write')){ fs.writeFileSync(file, out); console.log('REFUERZOS_FALTANTES.md escrito'); }
else{
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : '';
  if(cur !== out){ console.error('REFUERZOS_FALTANTES.md esta desactualizado: corre  node tools/conexiones/faltantes.js --write'); process.exit(1); }
  console.log('OK: REFUERZOS_FALTANTES.md al dia');
}
