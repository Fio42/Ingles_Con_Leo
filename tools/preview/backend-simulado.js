/* VISTA PREVIA LOCAL: reemplaza a backend.js SOLO cuando se abre el sitio con tools/preview/servidor-preview.py (o .js).
   No hay red, no hay Supabase, no se toca produccion. Simula las tres clases de persona:
     ?as=visitante | ?as=gratis | ?as=miembro     (se recuerda en este navegador; la barrita de abajo lo cambia)
   Los datos de progreso viven en el localStorage de localhost, nunca en la nube. Nada de esto se publica. */
const LeoBackend = (function(){
  const KEY = 'leo_prev_tier';
  try{ const q = new URLSearchParams(location.search).get('as'); if(q && ['visitante', 'gratis', 'miembro'].indexOf(q) !== -1) localStorage.setItem(KEY, q); }catch(e){}
  const tier = () => { try{ return localStorage.getItem(KEY) || 'visitante'; }catch(e){ return 'visitante'; } };
  const prof = () => tier() === 'miembro' ? { id: 'prev-miembro', is_member: true, display_name: 'Miembro de prueba', email: 'miembro@prueba.local' }
    : tier() === 'gratis' ? { id: 'prev-gratis', is_member: false, display_name: 'Cuenta gratis de prueba', email: 'gratis@prueba.local' } : null;
  const ok = v => Promise.resolve(v);
  const api = {
    isConfigured: () => true,
    getClient: () => null,
    getSession: () => ok(prof() ? { access_token: 'prueba', user: { id: prof().id, email: prof().email } } : null),
    getMemberProfile: () => ok(prof()),
    requireMemberAsync: async function(){ const p = prof(); if(p && p.is_member) return true; window.location.href = 'miembros.html'; return false; },   // misma logica que backend.js
    syncProgressFromCloud: () => ok(null), pushSession: () => ok(true), pushFreeSession: () => ok('ok'),
    bumpFreeDailyCount: count => ok(count),
    getLatestSessionLevel: () => ok(null), saveProfileToCloud: () => ok(true), saveDisplayName: () => ok(true),
    getMistakeStats: () => ok([]), applyMistakeResults: () => ok(true),
    getLeoAiTrial: () => ok(null), askLeoAI: () => ok({ ok: false, error: 'preview' }),
    feedbackCardStatus: () => ok(null), academiaDemoOffer: () => ok(null),
    getArticleComments: () => ok([]), postArticleComment: () => ok({ ok: false }), deleteArticleComment: () => ok(false),
    submitMemberFeedback: () => ok(true), dismissMemberFeedback: () => ok(true), submitLeobotReport: () => ok(true),
    signOut: async function(){ try{ localStorage.setItem(KEY, 'visitante'); }catch(e){} },
    signUp: () => ok({ ok: false }), signInWithPassword: () => ok({ ok: false }), signInWithGoogle: () => ok({ ok: false }), signInWithGoogleIdToken: () => ok({ ok: false }),
    sendPasswordReset: () => ok({ ok: false }), updatePassword: () => ok({ ok: false }), onPasswordRecovery: () => {},
    startCheckout: () => ok({ ok: false }), startStripeCheckout: () => ok({ ok: false }), startPaypalCheckout: () => ok({ ok: false }), markPurchaseIntent: () => ok(true)
  };
  // Cualquier otra funcion de la nube que alguna pagina llame: responde vacio en vez de romper.
  const proxy = new Proxy(api, { get: (t, k) => (k in t) ? t[k] : (typeof k === 'string' ? (() => ok(null)) : undefined) });
  function badge(){
    try{
      if(document.getElementById('leoPrevBadge')) return;
      const t = tier(), b = document.createElement('div'); b.id = 'leoPrevBadge';
      b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#111;color:#fff;font:12px/1.3 system-ui,sans-serif;padding:4px 6px;display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;opacity:.92';
      b.innerHTML = '<b>VISTA PREVIA</b> sin nube: ' + ['visitante', 'gratis', 'miembro'].map(x => '<a href="#" data-as="' + x + '" style="color:' + (x === t ? '#7CFC9A' : '#bbb') + ';font-weight:' + (x === t ? '700' : '400') + ';text-decoration:underline;padding:2px 4px">' + x + '</a>').join(' ');
      b.addEventListener('click', e => { const a = e.target.closest('[data-as]'); if(!a) return; e.preventDefault(); try{ localStorage.setItem(KEY, a.dataset.as); }catch(err){} location.reload(); });
      document.body.appendChild(b);
    }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', badge); else badge();
  return proxy;
})();
function guardMemberPage(startFn){
  LeoBackend.requireMemberAsync().then(function(ok){
    if(ok){ window.__leoMemberVerified = true; startFn(); if(typeof initMemberHeader === 'function') initMemberHeader(); }
  });
}
