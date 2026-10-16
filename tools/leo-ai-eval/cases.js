/* 32 errores REALES del banco de ejercicios (ids de data.js). "wrong" = la opción/palabra que el alumno eligió (incorrecta).
   tag: clear = error claro; plausible = la opción incorrecta parece razonable; multi = en otro contexto/registro puede ser válida. */
module.exports = [
  { id:'g-medio-pp-1', wrong:0, tag:'multi', tema:'tiempos' },        // "already started": el caso reportado por Leo
  { id:'g-medio-pp-1', wrong:2, tag:'plausible', tema:'tiempos' },     // "has already started"
  { id:'g-facil-m400-1', wrong:0, tag:'plausible', tema:'condicionales' },
  { id:'g-facil-m400-3', wrong:0, tag:'plausible', tema:'preposiciones' }, // for / since
  { id:'g-medio-pps-1', wrong:0, tag:'plausible', tema:'tiempos' },
  { id:'g-medio-pps-1', wrong:2, tag:'plausible', tema:'tiempos' },
  { id:'g-medio-rep-1', wrong:0, tag:'multi', tema:'tiempos' },        // "She said she is tired": válido si sigue siendo cierto
  { id:'g-medio4-pass-1', wrong:2, tag:'clear', tema:'estructuras' },
  { id:'g-medio5-fut-1', wrong:0, tag:'multi', tema:'tiempos' },       // will / am going to
  { id:'g-medio5-ger-1', wrong:1, tag:'clear', tema:'estructuras' },
  { id:'g-medio6-phr-1', wrong:1, tag:'clear', tema:'vocabulario' },
  { id:'g-medio7-quant-1', wrong:1, tag:'clear', tema:'estructuras' },
  { id:'g-medio8-affecteffect-1', wrong:1, tag:'plausible', tema:'vocabulario' },
  { id:'g-medio10-1', wrong:1, tag:'plausible', tema:'vocabulario' },
  { id:'g-medio9-despalth-1', wrong:1, tag:'clear', tema:'estructuras' },
  { id:'g-medio-mnt-1', wrong:0, tag:'plausible', tema:'estructuras' },
  { id:'g-medio-m200-aslike-1', wrong:1, tag:'plausible', tema:'preposiciones' },
  { id:'g-medio-m200-byuntilwork-1', wrong:1, tag:'plausible', tema:'preposiciones' },
  { id:'g-medio-m400-1', wrong:0, tag:'clear', tema:'condicionales' },
  { id:'g-avz-c3-1', wrong:0, tag:'clear', tema:'condicionales' },
  { id:'g-avz-prep2-1', wrong:0, tag:'plausible', tema:'preposiciones' },
  { id:'g-avz4-mix-1', wrong:1, tag:'plausible', tema:'condicionales' }, // would have been: razonable
  { id:'g-principiante-m500-thereis-4', wrong:0, tag:'clear', tema:'estructuras' },
  { id:'g-facil-art-1', wrong:0, tag:'clear', tema:'artículos' },
  { id:'g-facil-aan-1', wrong:1, tag:'plausible', tema:'artículos' },
  { id:'g-facil-prep-1', wrong:0, tag:'plausible', tema:'preposiciones' },
  { id:'g-facil-iol-1', wrong:0, tag:'multi', tema:'preposiciones' },   // on / in un apartamento
  { id:'g-facil9-muchmany-1', wrong:1, tag:'clear', tema:'estructuras' },
  { id:'g-medio-pp-2', wrong:0, tag:'plausible', tema:'tiempos' },      // fill: has / had
  { id:'g-medio-pps-2', wrong:1, tag:'multi', tema:'tiempos' },         // fill: did
  { id:'v-facil-8', wrong:1, tag:'plausible', tema:'vocabulario' },     // borrow / lend
  { id:'v-medio-8', wrong:1, tag:'clear', tema:'vocabulario' }
];
