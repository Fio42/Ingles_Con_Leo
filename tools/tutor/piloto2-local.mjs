// Riso · piloto 2 LOCAL (sin Gemma, 0 neuronas). Corre las 20 preguntas de tools/tutor/piloto2-preguntas.md por el motor
// real (navegador) y por la lógica real del servidor (riso-chat.mjs) con el modelo simulado. Comprueba:
//   - que cada respuesta sin IA sale de la ficha o herramienta esperada (nunca de otro tema);
//   - qué viajaría a Gemma en las que necesitan IA (historial, contexto, tokens estimados);
//   - que en el ejercicio «encuentra el error» Riso recibe ACERTÓ/FALLÓ igual que la academia;
//   - identidad (nunca profesor ni tutor) y que no se recomiendan recursos.
// Uso: node tools/tutor/piloto2-local.mjs  (escribe el detalle en JSON en la salida estándar)
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const path = require('path'), fs = require('fs')
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..')
globalThis.window = globalThis
const K = require(path.join(root, 'riso/tutor/conocimiento.js'))
const T = require(path.join(root, 'riso/tutor/riso-tutor.js'))
const S = await import(path.join(root, 'supabase/functions/leo-ai/riso-chat.mjs'))
const indice = JSON.parse(fs.readFileSync(path.join(root, 'supabase/functions/leo-ai/riso-ejercicios.json'), 'utf8'))

const ESPERADO = { 1: 'make-do', 2: 'glosario:much-vs-many', 3: 'there-is-are', 4: 'presente-continuo-futuro', 5: 'be-used-to', 6: 'ia', 7: 'presente-perfecto',
  8: 'pronunciacion:thought', 9: 'ia', 10: 'sonido-th', 11: 'will-would', 12: 'people', 13: 'ia', 14: 'ia', 15: 'ia', 16: 'presente-perfecto', 17: 'ia', 20: 'soporte' }
const PREG = ['¿Qué diferencia hay entre «make» y «do»?', '¿Hay alguna diferencia entre much y many?', '¿Cómo se dice «hay» en inglés?',
  '¿Cuándo se usa el presente continuo para el futuro?', '¿Qué significa «used to» y en qué se diferencia de «be used to»?', '¿Qué es el presente perfecto? ¿Y cuándo uso since?',
  '¿Se puede usar el presente perfecto con this week?', '¿Cómo se pronuncia «thought»?', '¿Cómo se pronuncia «comfortable»?', '¿Cómo se pronuncia el sonido «th»?',
  '¿Cuándo uso «would» y cuándo «will»?', '¿Por qué «people» va con «are»?', '¿Cómo se dice «sobremesa» en inglés?', '¿Cómo se dice «tengo hambre»?', '¿Y de forma más educada?',
  'Explícame el presente perfecto', 'Dame otro ejemplo']

let t0 = 0; const enviados = []
T.CONFIG.cuotaDiaria.miembro = 60
const tutor = T.crear({ conocimiento: K, plan: 'miembro', ahora: () => (t0 += 20000),
  generar: p => { enviados.push(p); return Promise.resolve({ texto: '(respuesta de Gemma: no se llamó en la prueba local)' }) } })
const filas = []
for (let i = 0; i < PREG.length; i++) {
  const n = i + 1, antes = enviados.length
  const r = await tutor.preguntar(PREG[i])
  const fila = { n, pregunta: PREG[i], categoria: T.categoria(r), id: r.id || (r.termino ? 'glosario:' + String(r.ref || '').split('/')[1] : r.tipo === 'pronunciacion' ? 'pronunciacion:' + String(r.ref || '').split('/')[1] : r.tipo), respuesta: r.capa === 5 ? null : r.texto, ejemplo: (r.ej && r.ej[0]) ? r.ej[0].join(' / ') : '', guia: r.ref || '' }
  if (enviados.length > antes) {
    const p = enviados[enviados.length - 1]
    const ent = S.validarEntrada({ pregunta: p.pregunta, request_id: 'piloto2local' + n, historial: p.historial })
    const msgs = S.construirMensajes(ent.pregunta, ent.historial, null)
    fila.ia = { historialMensajes: ent.historial.length, ejemploPrevioEnHistorial: ent.historial.some(m => /Ejemplo mostrado:/.test(m.texto)), neuronasEstimadas: S.estimarNeuronas(msgs) }
  }
  const esp = ESPERADO[n]
  fila.correcto = esp === 'ia' ? fila.categoria === 'ia' : esp === 'soporte' ? r.tipo === 'soporte' : esp.startsWith('glosario:') ? fila.id === esp : esp.startsWith('pronunciacion:') ? fila.id === esp : r.id === esp
  filas.push(fila)
}
// 18 y 19: ejercicio «encuentra el error» con la lógica REAL del servidor (índice + regla de la práctica), modelo simulado.
const ej = 'g-medio-ppf-3', x = indice[ej], palabraBien = String(x.s[0])   // tocar la palabra marcada = acierto
const ctx = S.resolverContexto({ itemId: ej, respuestaAlumno: palabraBien }, indice)
const capturado = []
const deps = { rpc: async (fn) => fn === 'riso_chat_status' ? { data: { enabled: true } } : fn === 'riso_intento_valido' ? { data: true } : fn === 'riso_chat_reserve' ? { data: { status: 'ok' } } : { data: { status: 'ok' } },
  llamarModelo: async (m) => { capturado.push(m); return { ok: true, raw: JSON.stringify({ texto: 'Respuesta simulada de Gemma.', ejemplo_en: '', ejemplo_es: '' }), usage: { input: 500, output: 90 } } },
  obtenerIndice: async () => indice, ahora: () => Date.now(), log: () => {} }
for (const [n, q] of [[18, '¿Por qué está bien mi respuesta?'], [19, '¿Hay alguna excepción?']]) {
  await S.procesarChat('u-prueba', { pregunta: q, request_id: 'piloto2ej' + n, contexto: { itemId: ej, respuestaAlumno: palabraBien } }, deps)
  const user = capturado[capturado.length - 1][1].content
  filas.push({ n, pregunta: q + ' (ejercicio «' + x.e + '», tocó «' + x.p[x.s[0]] + '»)', categoria: 'ia', id: 'ejercicio', respuesta: null,
    ia: { contextoDelServidor: user.split('\n\n')[0], neuronasEstimadas: S.estimarNeuronas(capturado[capturado.length - 1]) }, correcto: ctx.ok && ctx.ctx.acerto === true && /y ACERTÓ/.test(user) })
}
const r20 = await tutor.preguntar('Me cobraron dos veces la membresía')
filas.push({ n: 20, pregunta: 'Me cobraron dos veces la membresía', categoria: T.categoria(r20), id: r20.tipo, respuesta: r20.texto, correcto: r20.tipo === 'soporte' })
filas.sort((a, b) => a.n - b.n)
const reglas = S.RISO_REGLAS
const identidadOk = /asistente inteligente de Inglés con Leo/.test(reglas) && /Nunca te presentes como profesor, tutor ni maestro/.test(reglas) && /No menciones a Profe Leo salvo/.test(reglas)
const sinRecursos = filas.filter(f => f.respuesta).every(f => !/te recomiendo (escuchar|ver)|descarga|app /i.test(f.respuesta))
const cuenta = filas.reduce((a, f) => (a[f.categoria] = (a[f.categoria] || 0) + 1, a), {})
console.log(JSON.stringify({ filas, cuenta, correctas: filas.filter(f => f.correcto).length, total: filas.length, identidadOk, sinRecursos, saludo: T.CONFIG.saludo }, null, 1))
