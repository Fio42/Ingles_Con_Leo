#!/usr/bin/env node
/* Correos recurrentes para cuentas gratis inactivas (long_term), reescritos el 2026-11-17.
   Ejecuta el CODIGO REAL de upgrade-nudge-emails.ts (transpilado) contra una base de datos y un Resend falsos.
   Verifica: orden y asuntos de los 7 correos, un solo boton por correo, URLs finales (rutas existentes, habilidad/tema
   prometidos, etiquetas UTM sin datos personales), membresia solo en el correo 7, saludo personalizado, pie de baja,
   avance de quienes ya estan en la secuencia, intervalo de 14 dias y filtros de envio.
   Vistas previas: PREVIEW_DIR=<carpeta> node tools/tests/long-term-correos.test.js */
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..', '..');
const ts = require(path.join(root, 'node_modules', 'typescript'));
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

let passed = 0, failed = 0; const queue = [];
function test(name, fn){ queue.push({ name, fn }); }

/* ---------------- reloj y base de datos falsos ---------------- */
const H = 3600000;
const state = { now: Date.parse('2026-10-08T18:00:00.000Z'), db: { profiles: [], progress_sessions: [] }, mails: [], resendFail: false };
class FakeDate extends Date {
  constructor(...a){ if(a.length === 0) super(state.now); else super(...a); }
  static now(){ return state.now; }
}
const iso = ms => new Date(ms).toISOString();
const ago = h => iso(state.now - h * H);

function getCol(row, col){
  if(col.includes('->>')){ const [c, k] = col.split('->>'); const o = row[c]; return o && o[k] !== undefined ? o[k] : null; }
  return row[col] === undefined ? null : row[col];
}
function cmp(a, b){
  const isoLike = v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v);
  if(isoLike(a) && isoLike(b)) return Date.parse(a) - Date.parse(b);
  return a < b ? -1 : a > b ? 1 : 0;
}
function evalOp(row, col, op, val){
  const v = getCol(row, col);
  switch(op){
    case 'is': return val === 'null' ? v === null : String(v) === val;
    case 'eq': return v !== null && String(v) === val;
    case 'neq': return v !== null && String(v) !== val;
    case 'lt': return v !== null && cmp(v, val) < 0;
    case 'lte': return v !== null && cmp(v, val) <= 0;
    case 'gt': return v !== null && cmp(v, val) > 0;
    case 'gte': return v !== null && cmp(v, val) >= 0;
  }
  throw new Error('op no soportado ' + op);
}
function splitTop(s){ const out = []; let d = 0, cur = ''; for(const ch of s){ if(ch === '(') d++; if(ch === ')') d--; if(ch === ',' && d === 0){ out.push(cur); cur = ''; } else cur += ch; } if(cur) out.push(cur); return out; }
function evalTerm(row, t){
  let m = t.match(/^(and|or)\((.*)\)$/s);
  if(m){ const parts = splitTop(m[2]).map(x => evalTerm(row, x)); return m[1] === 'and' ? parts.every(Boolean) : parts.some(Boolean); }
  const i = t.indexOf('.'), j = t.indexOf('.', i + 1);
  return evalOp(row, t.slice(0, i), t.slice(i + 1, j), t.slice(j + 1));
}
function makeSupabase(extra){
  return {
    rpc: async (name, args) => name === 'internal_secret_ok' ? { data: args.p_secret === 'ok', error: null } : { data: null, error: null },
    auth: { getUser: async tok => tok === 'tok' ? { data: { user: { id: (extra && extra.userId) || 'u1', email: 'a@x.com' } }, error: null } : { data: null, error: { message: 'bad' } } },
    from(table){
      const rows = state.db[table] || (state.db[table] = []);
      const filters = []; let upd = null, order = null, lim = null, rng = null, wantRows = false;
      const b = {
        select(){ wantRows = true; return b; },
        update(p){ upd = p; return b; },
        eq(c, v){ filters.push(r => getCol(r, c) !== null && String(getCol(r, c)) === String(v)); return b; },
        is(c, v){ filters.push(r => v === null ? getCol(r, c) === null : getCol(r, c) === v); return b; },
        not(c, op, v){ filters.push(r => !(op === 'is' && v === null ? getCol(r, c) === null : false)); return b; },
        gte(c, v){ filters.push(r => evalOp(r, c, 'gte', v)); return b; },
        lte(c, v){ filters.push(r => evalOp(r, c, 'lte', v)); return b; },
        lt(c, v){ filters.push(r => evalOp(r, c, 'lt', v)); return b; },
        or(s){ filters.push(r => splitTop(s).some(t => evalTerm(r, t))); return b; },
        order(c, o){ order = { c, asc: !o || o.ascending !== false }; return b; },
        limit(n){ lim = n; return b; },
        range(a, z){ rng = [a, z]; return b; },
        async maybeSingle(){ const r = await run(); return { data: (r.data || [])[0] || null, error: null }; },
        then(res, rej){ return run().then(res, rej); },
      };
      async function run(){
        let hit = rows.filter(r => filters.every(f => f(r)));
        if(upd){ for(const r of hit) Object.assign(r, JSON.parse(JSON.stringify(upd))); return { data: wantRows ? hit.map(r => ({ id: r.id })) : null, error: null }; }
        if(order) hit = hit.slice().sort((x, y) => (cmp(getCol(x, order.c), getCol(y, order.c))) * (order.asc ? 1 : -1));
        if(rng) hit = hit.slice(rng[0], rng[1] + 1);
        if(lim !== null) hit = hit.slice(0, lim);
        return { data: JSON.parse(JSON.stringify(hit)), error: null };
      }
      return b;
    },
  };
}
function loadTs(file, extra){
  extra = extra || {};
  let src = read('supabase_functions/' + file).replace(/^import .*createClient.*$/m, '');
  // La reactivación de miembros importa sus reglas de member-reactivation-core.mjs:
  // se inyectan como un objeto RC dentro del mismo contexto.
  if(/^import \* as RC /m.test(src)){
    const core = read('supabase_functions/member-reactivation-core.mjs');
    const names = [...core.matchAll(/^export (?:function|const) (\w+)/gm)].map(m => m[1]);
    src = src.replace(/^import \* as RC .*$/m, '');
    src = 'const RC = (() => {\n' + core.replace(/^export /gm, '') + '\nreturn { ' + names.join(', ') + ' };\n})();\n' + src;
  }
  const js = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const served = [];
  const sb = makeSupabase(extra);
  const ctx = {
    exports: {}, console: { log(){}, error(){}, warn(){} }, crypto: globalThis.crypto, TextEncoder, Request, Response, URL, JSON, Promise, Set, Map, Math, Number, String, Array, Object, parseInt, Date: FakeDate,
    setTimeout, clearTimeout, createClient: () => sb, AbortSignal, btoa, encodeURIComponent,
    Deno: { env: { get: k => (extra.env || {})[k] || 'x' }, serve: fn => { served.push(fn); } },
    fetch: extra.fetch || (async (url, init) => {
      if(String(url).includes('resend.com')){
        if(state.resendFail) return { ok: false, status: 500, text: async () => 'boom' };
        const body = JSON.parse(init.body); state.mails.push({ to: body.to[0], subject: body.subject, html: body.html, reply_to: body.reply_to, headers: body.headers });
        return { ok: true, status: 200, text: async () => '' };
      }
      return { ok: true, status: 200, text: async () => '', json: async () => ({ init_point: 'https://pay/x', url: 'https://pay/x', id: 'X', access_token: 't', links: [{ rel: 'approve', href: 'https://pay/x' }] }) };
    }),
  };
  vm.createContext(ctx); vm.runInContext(js, ctx, { filename: file });
  return { handler: served[0], ctx };
}

const NUDGE = loadTs('upgrade-nudge-emails.ts');
const callCron = (m) => m.handler(new Request('https://x/f', { method: 'POST', headers: { 'x-internal-secret': 'ok' }, body: '{}' }));

/* ---------------- datos del contrato ---------------- */
const SITE = 'https://inglesconleo.com';
const SUBJECTS = [
  '¿Cómo dices «ya voy en camino» en inglés?',
  '¿Worked se pronuncia «work-ed»?',
  '¿Yesterday I go o Yesterday I went?',
  '¿Make o do a decision?',
  'Qué decir cuando te preguntan «Tell me about yourself»',
  '¿In, on o at 7 p.m.?',
  '¿Por qué decimos I didn’t go?',
];
const BUTTONS = [
  'Hacer un ejercicio gratis',
  'Hacer una práctica de listening',
  'Practicar gramática gratis',
  'Hacer otro ejercicio de gramática',
  'Ver más ejemplos de entrevista',
  'Practicar gramática gratis',
  'Hacer un ejercicio gratis',
];
const PATHS = ['/practica.html', '/practica.html', '/practica.html', '/practica.html', '/articulo-entrevista-trabajo-ingles.html', '/practica.html', '/practica.html'];
const SKILLS = [null, 'listening', 'grammar', 'grammar', null, 'grammar', null];
const TEMAS = [null, null, 'verbos-irregulares', null, null, null, null];

const BASE_LIFE = { welcome: iso(0), day1: 'skipped', day3: 'skipped', day5: 'skipped', reactivation_day14: 'skipped', final_onboarding: iso(0), membership_intro: 'skipped', abandoned_signup: 'skipped', active_free_pitch: 'skipped' };
function user(over, life){
  return Object.assign({
    id: 'u1', email: 'a@x.com', is_member: false, created_at: ago(24 * 100), last_seen_at: ago(24 * 60), checkout_started_at: null,
    free_daily_count: 0, free_daily_date: null, free_last_practice_at: null, free_first_exercise_at: null, free_daily_limit_reached_at: null,
    lifecycle_emails: Object.assign({}, BASE_LIFE, { welcome: ago(24 * 100), final_onboarding: ago(24 * 70) }, life || {}),
    last_marketing_email_at: null, email_invalid: false, email_opt_out_at: null, display_name: 'Ana',
  }, over || {});
}
function reset(mk){ state.now = Date.parse('2026-11-17T18:00:00.000Z'); state.db.profiles = mk ? mk() : []; state.db.progress_sessions = []; state.mails = []; state.resendFail = false; }
const P = () => state.db.profiles[0];
const PREVIEW_DIR = process.env.PREVIEW_DIR || '';
const previews = [];

/* temas y ejercicios gratis reales (data.js + temas.js + app.js) */
function realApp(){
  const store = {}; const noop = () => {};
  function node(tag){ const n = { tagName: tag, children: [], style: {}, className: '', dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, setAttribute: noop, addEventListener: noop, appendChild(c){ n.children.push(c); return c; }, querySelector: () => null, querySelectorAll: () => [] }; let h = ''; Object.defineProperty(n, 'innerHTML', { get(){ return h; }, set(v){ h = String(v); } }); return n; }
  const c = { console, Math, Date, JSON, Map, Set, Array, Object, String, Number, Promise, setTimeout, clearTimeout, URLSearchParams,
    localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, key: i => Object.keys(store)[i], get length(){ return Object.keys(store).length; } },
    document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, readyState: 'complete', body: node('body'), documentElement: node('html'), createElement: node },
    location: { hash: '', search: '', pathname: '/' }, navigator: { userAgent: 'node' }, addEventListener: noop,
    MutationObserver: function(){ return { observe: noop }; }, IntersectionObserver: function(){ return { observe: noop }; }, matchMedia: () => ({ matches: false, addEventListener: noop }) };
  c.window = c; vm.createContext(c);
  vm.runInContext(read('data.js'), c); vm.runInContext(read('temas.js'), c);
  vm.runInContext(read('app.js') + '\n;this.__t = { freeGrammarItemsOfTema, LEVELS, TEMA_BY_ID };', c);
  return c.__t;
}

/* ---------------- 1. orden, asuntos y avance ---------------- */
for(let i = 0; i < 7; i++){
  test(`Correo ${i + 1}: lo recibe quien lleva ${i} enviados, sale solo uno y el avance pasa a ${i + 1}`, async () => {
    reset(() => [user({}, i ? { long_term_count: String(i), long_term: ago(24 * 15) } : { long_term_count: '0' })]);
    await callCron(NUDGE);
    assert.strictEqual(state.mails.length, 1);
    assert.strictEqual(state.mails[0].subject, SUBJECTS[i]);
    assert.strictEqual(P().lifecycle_emails.long_term_count, String(i + 1));
    assert(P().lifecycle_emails.long_term, 'queda registrada la fecha del envio');
    await callCron(NUDGE); assert.strictEqual(state.mails.length, 1, 'una segunda pasada no lo repite');
    previews[i] = state.mails[0];
  });
}
test('Despues del correo 7 la secuencia se detiene sola (no da la vuelta)', async () => {
  reset(() => [user({}, { long_term_count: '7', long_term: ago(24 * 20) })]); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
});

/* ---------------- 2. contenido de cada correo ---------------- */
function cta(html){
  return [...html.matchAll(/<a href="([^"]+)"[^>]*background-color:#253ECC[^>]*>\s*([^<]*?)\s*<\/a>/g)];
}
for(let i = 0; i < 7; i++){
  test(`Correo ${i + 1}: un solo boton, texto y URL final correctos, sin datos personales`, () => {
    const m = previews[i]; assert(m, 'el correo se genero en la prueba anterior');
    const btns = cta(m.html); assert.strictEqual(btns.length, 1, 'exactamente un boton principal');
    assert.strictEqual(btns[0][2], BUTTONS[i] + ' →');
    const u = new URL(btns[0][1].replace(/&amp;/g, '&'));
    assert.strictEqual(u.origin, SITE); assert.strictEqual(u.pathname, PATHS[i]);
    assert(fs.existsSync(path.join(root, u.pathname.slice(1))), 'la pagina existe: ' + u.pathname);
    assert.strictEqual(u.searchParams.get('skill'), SKILLS[i]);
    assert.strictEqual(u.searchParams.get('tema'), TEMAS[i]);
    assert.strictEqual(u.searchParams.get('utm_source'), 'email'); assert.strictEqual(u.searchParams.get('utm_medium'), 'email');
    assert.strictEqual(u.searchParams.get('utm_campaign'), 'reactivacion_gratis');
    assert.strictEqual(u.searchParams.get('utm_content'), 'lt_0' + (i + 1));
    const permitidos = new Set(['skill', 'tema', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content']);
    for(const k of u.searchParams.keys()) assert(permitidos.has(k), 'parametro inesperado: ' + k);
    assert(!/@|u1|a@x/.test(u.search), 'la URL no lleva correo ni id');
    previews[i].url = u.href;
  });
  test(`Correo ${i + 1}: saludo con nombre, pie de baja, sin guiones largos y membresia solo en el 7`, () => {
    const h = previews[i].html;
    assert(h.includes('¡Hola, Ana! 👋'), 'saludo personalizado');
    assert(h.includes('Ya no quiero recibir estos correos'), 'pie de baja de la plantilla comun');
    assert(!h.includes('—'), 'sin guion largo');
    const vendeMembresia = /membres|\$\s?2|Leo AI/i.test(h);
    assert.strictEqual(vendeMembresia, i === 6, i === 6 ? 'el correo 7 presenta Leo AI' : 'solo el correo 7 menciona la membresia');
    assert(!/miembros\.html/.test(h), 'ningun enlace a la pagina de membresia');
    assert.strictEqual((h.match(/<a /g) || []).length, 2, 'solo el boton y el enlace de baja');
  });
}
test('Habilidades y temas que prometen los botones existen y tienen ejercicios gratis', () => {
  const A = realApp();
  assert(/SKILL_URL_TO_KEY = \{ grammar:'gramatica'[^}]*listening:'listening'/.test(read('app.js')), 'app.js entiende ?skill=grammar y ?skill=listening');
  for(const t of TEMAS.filter(Boolean)){
    assert(A.TEMA_BY_ID[t], 'tema ' + t);
    const n = A.LEVELS.reduce((acc, l) => acc + A.freeGrammarItemsOfTema(l, t).length, 0);
    assert(n > 0, 'hay ejercicios gratis del tema ' + t + ' (' + n + ')');
  }
});
test('Las etiquetas UTM sobreviven en practica.html: solo se quita ?cuenta=, se conserva la query y GA4 se carga', () => {
  const h = read('practica.html');
  assert(/restoQuery\.delete\('cuenta'\)/.test(h) && !/restoQuery\.delete\('utm/.test(h) && !/\.delete\('(skill|tema)'\)/.test(h));
  assert(/'practica-miembros\.html' \+ window\.location\.search/.test(h), 'la redireccion de miembros conserva toda la query');
  assert(/gtag\('config', 'G-0DRL810MYR'\)/.test(h), 'GA4 en practica.html');
  assert(/gtag\('config', 'G-0DRL810MYR'\)/.test(read('articulo-entrevista-trabajo-ingles.html')), 'GA4 en el articulo');
});

/* ---------------- 3. lo que NO debe cambiar ---------------- */
test('Intervalo de 14 dias: a los 13 no sale, a los 14 si', async () => {
  reset(() => [user({}, { long_term_count: '2', long_term: ago(24 * 13) })]); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
  reset(() => [user({}, { long_term_count: '2', long_term: ago(24 * 14 + 1) })]); await callCron(NUDGE); assert.strictEqual(state.mails.length, 1); assert.strictEqual(state.mails[0].subject, SUBJECTS[2]);
});
test('Filtros: baja, correo invalido, miembro y mas de 180 dias sin entrar NO reciben el correo', async () => {
  for(const over of [{ email_opt_out_at: iso(state.now) }, { email_invalid: true }, { is_member: true }, { last_seen_at: ago(24 * 200) }]){
    reset(() => [user(over, { long_term_count: '0' })]); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0, JSON.stringify(over));
  }
});
test('Sin enviar entre la 1:00 y las 7:59 de Cancun', async () => {
  reset(() => [user({}, { long_term_count: '0' })]); state.now = Date.parse('2026-11-17T10:00:00.000Z'); await callCron(NUDGE); assert.strictEqual(state.mails.length, 0);
});
test('Las dos copias de la funcion siguen identicas, intervalo y limite de 180 dias intactos, 7 correos', () => {
  assert.strictEqual(read('supabase_functions/upgrade-nudge-emails.ts').replace(/\r/g, ''), read('supabase/functions/upgrade-nudge-emails/index.ts').replace(/\r/g, ''));
  const s = read('supabase_functions/upgrade-nudge-emails.ts');
  assert(/const LONG_TERM_INTERVAL_DAYS = 14/.test(s) && /const LONG_TERM_SUNSET_DAYS = 180/.test(s));
  const a = s.indexOf('const LONG_TERM_EMAILS'); const lt = s.slice(a, s.indexOf('\n]', a));
  assert.strictEqual((lt.match(/subject:/g) || []).length, 7);
});

(async () => {
  for(const t of queue){
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch(e){ failed++; console.log('  FAIL ' + t.name + '\n       ' + (e && e.message || e)); }
  }
  if(PREVIEW_DIR){
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    previews.forEach((m, i) => { if(m) fs.writeFileSync(path.join(PREVIEW_DIR, 'lt_0' + (i + 1) + '.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + m.subject.replace(/</g, '&lt;') + '</title>' + m.html); });
    fs.writeFileSync(path.join(PREVIEW_DIR, 'urls.json'), JSON.stringify(previews.map((m, i) => m && ({ n: i + 1, subject: m.subject, url: m.url })), null, 1));
  }
  console.log(`\n${passed} ok, ${failed} fallaron`);
  process.exit(failed ? 1 : 0);
})();
