/* Lee de app.js la regla de que ejercicios son EXCLUSIVOS de Miembros (bloque entre ACCESS-START y ACCESS-END) y la aplica a
   los bancos de data.js. Asi las herramientas de tools/ usan la misma regla que el sitio, sin copiarla.
   Uso:  const { membersOnlyIndex } = require('./lib/acceso');   membersOnlyIndex(root)  ->  { gramatica: { facil: [indices] ... } ...}
   Tambien: loadAccess(root) devuelve { MEMBERS_ONLY_VARIANT_INDEX, MEMBERS_ONLY_BATCHES, isMembersOnlyVariant, ... } y el contexto con los bancos. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
function loadAccess(root, extra){
  const appSrc = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const a = appSrc.indexOf('/* ACCESS-START */'), b = appSrc.indexOf('/* ACCESS-END */');
  if(a < 0 || b < 0) throw new Error('No encuentro el bloque ACCESS-START / ACCESS-END en app.js');
  const ctx = Object.assign({ console }, extra || {}); vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
  vm.runInContext(appSrc.slice(a, b) + '\n;this.__acc = { MEMBERS_ONLY_VARIANT_INDEX, MEMBERS_ONLY_BATCHES, MEMBERS_ONLY_LEGACY_VARIANT_IDS, isMembersOnlyVariant, variantExerciseIds };', ctx);
  return Object.assign({ ctx }, ctx.__acc);
}
function membersOnlyIndex(root){
  const o = loadAccess(root).MEMBERS_ONLY_VARIANT_INDEX, out = {};
  Object.keys(o).forEach(s => { out[s] = {}; Object.keys(o[s]).forEach(l => { out[s][l] = o[s][l].slice(); }); });
  return out;
}
module.exports = { loadAccess, membersOnlyIndex };
