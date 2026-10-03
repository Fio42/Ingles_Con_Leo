// ============================================================
// Inglés con Leo — Edge Function: report-error
//
// Entrada PÚBLICA del registro central de errores (error-monitor.js la
// llama desde el navegador). Se despliega SIN verify_jwt: los errores de
// login ocurren sin sesión. Por eso aquí se valida y limita todo:
//   * solo acepta Origin del sitio (inglesconleo.com), cuerpo <= 4 KB,
//     y descarta bots;
//   * límite por IP (30/hora; la IP se guarda solo como hash, y solo
//     dentro del contador de límites, que se borra solo);
//   * lista blanca de campos: nada de texto libre ni objetos de contexto;
//   * limpia de nuevo mensajes y stack (emails, tokens, JWT, URLs con
//     query, UUID, números largos, textos largos entre comillas);
//   * la severidad la decide el SERVIDOR (el navegador nunca puede mandar
//     'critical'), y el fingerprint también (el navegador no lo controla);
//   * los topes globales, la deduplicación y los avisos por correo viven
//     en la base (log_app_error en error-monitoring.sql).
// SIEMPRE responde 204, pase lo que pase (no le da pistas a nadie) y
// jamás se reporta a sí misma: cualquier fallo solo va a console.error.
//
// Variables: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (ya vienen puestas).
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const env = (k: string) => Deno.env.get(k) || ''
const SUPABASE_URL = env('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY')

const ALLOWED_ORIGINS = ['https://inglesconleo.com', 'https://www.inglesconleo.com']
// Solo estos tipos pueden venir del navegador. Los de servidor (payment,
// webhook, email, edge_function) no se aceptan por aquí: nadie desde afuera
// puede inventar un aviso de pago.
const CLIENT_KINDS = ['js_error', 'promise', 'resource', 'network', 'leo_ai', 'audio', 'auth', 'exercise', 'membership', 'other']
const MAX_BODY = 4096
const IP_LIMIT = 30
const IP_WINDOW_SECONDS = 3600
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|phantom|puppeteer|playwright|curl|wget|python-requests|httpclient/i

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ---------- Limpieza de texto (mismas reglas, mismo orden que error-monitor.js y que app_error_clean en SQL) ----------
export function cleanText(input: unknown, max = 300): string {
  try {
    let s = String(input == null ? '' : input)
    s = s.replace(/"[^"\n]{41,}"/g, '"[text]"').replace(/'[^'\n]{41,}'/g, "'[text]'")
    s = s.replace(/[?#][^\s"')\]]+/g, '')
    s = s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]')
    s = s.replace(/(?:\d[ -]?){13,19}/g, '[num]')
    s = s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    s = s.replace(/eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}(?:\.[A-Za-z0-9_-]*)?/g, '[jwt]')
    s = s.replace(/Bearer\s+\S+/gi, 'Bearer [token]')
    s = s.replace(/(apikey|api_key|access_token|refresh_token|token|password|passwd|secret|authorization)(["']?\s*[=:]\s*)["']?[^\s&"',;)]+/gi, '$1$2[redacted]')
    s = s.replace(/(?:sb_(?:publishable|secret)|sk_(?:live|test)|pk_(?:live|test)|rk_(?:live|test)|whsec)_[A-Za-z0-9]+/g, '[key]')
    s = s.replace(/\d{6,}/g, '[num]')
    s = s.replace(/[A-Za-z0-9_-]{32,}/g, '[token]')
    return s.replace(/\s+/g, ' ').trim().slice(0, max)
  } catch (_) {
    return ''
  }
}

// ---------- Fingerprint ----------
// Mismo error = mismo fingerprint aunque cambien ids, números, líneas de
// código o la versión del sitio (la release NO entra a propósito).
export function normalizeForFingerprint(s: string): string {
  return String(s || '')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '#')
    .replace(/0x[0-9a-f]+/gi, '#')
    // Se conservan los nombres cortos entre comillas (ej. "reading 'foo'"): son lo que distingue un bug de otro.
    .replace(/"[^"]*"|'[^']*'/g, (m) => (/^["'][A-Za-z_$][\w$.-]{0,40}["']$/.test(m) ? m : '"#"'))
    .replace(/\[(?:email|jwt|token|id|num|text|redacted)\]/g, '#')
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

// "fn (app.js:12:34)" -> "fn app.js" (sin línea ni columna).
export function frameKey(stackTop: string): string {
  const first = String(stackTop || '').split('\n')[0] || ''
  const m = first.match(/^(.*?)\s*\(([^:()]+):\d+:\d+\)$/)
  return m ? `${m[1]} ${m[2]}` : first.replace(/:\d+/g, '')
}

export async function fingerprint(kind: string, section: string, message: string, code: string, stackTop: string): Promise<string> {
  const base = [kind, section, code || '', normalizeForFingerprint(message), frameKey(stackTop)].join('|')
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base))
  return Array.from(new Uint8Array(buf)).slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// La severidad la decide el servidor, nunca el navegador.
export function severityFor(kind: string, code: string): string {
  if (kind === 'js_error' || kind === 'promise') return 'error'
  if (kind === 'resource' || kind === 'audio' || kind === 'other') return 'warning'
  if (kind === 'network') return /^http_5\d\d$/.test(code || '') ? 'warning' : 'info'
  return 'error' // leo_ai, auth, exercise, membership
}

// Mensajes que son ruido y no se guardan (también se filtran en el navegador).
const NOISE = /ResizeObserver loop|^Script error\.?$|Non-Error promise rejection captured|(?:chrome|moz|safari(?:-web)?)-extension:\/\//i

export type ClientEvent = {
  kind: string; section: string; message: string; name: string | null; stack: string | null; code: string | null
  release: string | null; browser: string | null; platform: string | null; sample: Record<string, unknown> | null
}

// Valida y reconstruye el evento SOLO con campos conocidos.
export function buildEvent(raw: any): ClientEvent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const kind = String(raw.kind || '')
  if (!CLIENT_KINDS.includes(kind)) return null
  const section = /^[a-z0-9_-]{1,40}$/.test(String(raw.section || '').toLowerCase()) ? String(raw.section).toLowerCase() : 'unknown'
  const message = cleanText(raw.message, kind === 'js_error' || kind === 'promise' ? 200 : 300)
  const code = /^[a-z0-9_.:-]{1,30}$/i.test(String(raw.code || '')) ? String(raw.code).toLowerCase() : null
  if (!message && !code) return null
  const stackLines = (Array.isArray(raw.stack) ? raw.stack : String(raw.stack || '').split('\n')).slice(0, 3).map((l: unknown) => cleanText(l, 120)).filter(Boolean)
  const stack = stackLines.length ? stackLines.join('\n').slice(0, 400) : null
  if (NOISE.test(message) || (stack && NOISE.test(stack))) return null
  const name = /^[A-Za-z][A-Za-z0-9_$.]{0,39}$/.test(String(raw.name || '')) ? String(raw.name) : null
  const release = /^[A-Za-z0-9._-]{1,30}$/.test(String(raw.release || '')) ? String(raw.release) : null
  const safeLabel = (v: unknown) => {
    const t = cleanText(String(v || '').replace(/[^A-Za-z0-9 ._()/+-]/g, ''), 40)
    return t || null
  }
  const s = raw.sample && typeof raw.sample === 'object' ? raw.sample : {}
  const sample: Record<string, unknown> = {}
  if (typeof s.online === 'boolean') sample.online = s.online
  if (typeof s.logged_in === 'boolean') sample.logged_in = s.logged_in
  if (typeof s.member === 'boolean') sample.member = s.member
  if (Number.isInteger(s.status) && s.status >= 100 && s.status <= 599) sample.status = s.status
  if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(String(s.method))) sample.method = String(s.method)
  return { kind, section, message, name, stack, code, release, browser: safeLabel(raw.browser), platform: safeLabel(raw.platform), sample: Object.keys(sample).length ? sample : null }
}

async function ipHash(req: Request, salt: string): Promise<string> {
  const fwd = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
  const ip = req.headers.get('cf-connecting-ip') || fwd || 'unknown'
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + ip))
  return Array.from(new Uint8Array(buf)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

type Deps = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }>; salt: string }

function respond(origin: string | null): Response {
  const headers: Record<string, string> = { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Vary': 'Origin' }
  if (origin && ALLOWED_ORIGINS.includes(origin)) headers['Access-Control-Allow-Origin'] = origin
  return new Response(null, { status: 204, headers })
}

// Todo el flujo. SIEMPRE devuelve 204 y nunca lanza.
export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  const origin = req.headers.get('origin')
  try {
    if (req.method !== 'POST') return respond(origin)
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return respond(origin)
    if (BOT_UA.test(req.headers.get('user-agent') || '')) return respond(origin)
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY) return respond(origin)
    const text = await req.text()
    if (text.length > MAX_BODY) return respond(origin)

    // Límite por IP (hasheada) ANTES de cualquier otra cosa.
    const hit = await deps.rpc('err_rate_hit', { p_bucket: 'ip:' + (await ipHash(req, deps.salt)), p_limit: IP_LIMIT, p_window: IP_WINDOW_SECONDS })
    if (hit.error || hit.data !== true) return respond(origin)

    let raw: any = null
    try { raw = JSON.parse(text) } catch (_) { return respond(origin) }
    const ev = buildEvent(raw)
    if (!ev) return respond(origin)

    const fp = await fingerprint(ev.kind, ev.section, ev.message, ev.code || '', ev.stack || '')
    const r = await deps.rpc('log_app_error', {
      p_fp: fp, p_kind: ev.kind, p_source: 'client', p_severity: severityFor(ev.kind, ev.code || ''), p_section: ev.section,
      p_message: ev.message, p_error_name: ev.name, p_stack_top: ev.stack, p_code: ev.code, p_release: ev.release,
      p_browser: ev.browser, p_platform: ev.platform, p_sample: ev.sample,
    })
    if (r.error) console.error('report-error: log_app_error fallo:', r.error.message) // solo consola, nunca se reporta a sí misma
  } catch (e) {
    console.error('report-error:', e)
  }
  return respond(origin)
}

Deno.serve((req: Request) => handleRequest(req, { rpc: (name, args) => supabase.rpc(name, args) as any, salt: SUPABASE_SERVICE_ROLE_KEY }))
