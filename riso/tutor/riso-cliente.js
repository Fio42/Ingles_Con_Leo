/* Riso · adaptador real de la capa 5 (navegador → Edge Function leo-ai, modo "chat"). Lo usa riso.html (página del piloto); la academia usa riso/riso-academia.js.
   Reutiliza askLeoAI de backend.js: misma sesión, mismo request_id en los reintentos y mismo manejo de errores.
   Solo envía la pregunta, el historial ENVIABLE (sin mensajes bloqueados) y, en modo ejercicio, el id del ejercicio y la
   respuesta elegida: el enunciado y la respuesta correcta los pone el servidor.
   Uso: RisoTutor.crear({ plan, generar: RisoTutor.generarConServidor(window.LeoBackend) }) */
(function (root) {
  'use strict';
  function generarConServidor(backend) {
    return function (p) {
      if (!backend || typeof backend.askLeoAI !== 'function') return Promise.reject(new Error('disabled'));
      var ctx = p.contexto && p.contexto.itemId ? { itemId: p.contexto.itemId, respuestaAlumno: p.contexto.respuestaAlumno || '' } : null;
      return backend.askLeoAI({ mode: 'chat', pregunta: p.pregunta, historial: p.historial, contexto: ctx }).then(function (r) {
        if (!r || !r.ok || !r.answer || typeof r.answer.texto !== 'string') throw new Error((r && r.reason) || 'error');
        var a = r.answer;
        return { texto: a.texto, ej: a.ejemplo_en ? [[a.ejemplo_en, a.ejemplo_es || '']] : [], metrica: a.metrica || null };
      });
    };
  }
  if (root.RisoTutor) root.RisoTutor.generarConServidor = generarConServidor;
  if (typeof module !== 'undefined') module.exports = { generarConServidor: generarConServidor };
})(typeof window !== 'undefined' ? window : globalThis);
