// ============================================================
// Inglés con Leo — Edge Function: submit-survey
//
// La llama la página encuesta.html cuando alguien envía sus
// respuestas. NO requiere sesión iniciada: identifica a la persona
// por el "token" que trae el link del correo (ver
// survey-15d-email.ts), que se guardó en profiles.survey_15d_token.
//
// Guarda la respuesta en survey_responses (tabla nueva, ver
// supabase_schema.sql). Si esa persona ya había respondido antes
// (por ejemplo si vuelve a abrir el link), no crea una fila
// duplicada: actualiza la que ya tenía.
//
// Variables de entorno (Supabase -> Edge Functions -> Secrets):
//   SUPABASE_URL               (ya viene puesta sola)
//   SUPABASE_SERVICE_ROLE_KEY  la misma "service_role" key que usan
//                              los webhooks de pago y las demás
//                              funciones de correo.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Los mismos valores que puede mandar el formulario de encuesta.html,
// para no guardar cualquier texto suelto en las columnas cerradas.
const VALID_Q1 = ['muy_util', 'util', 'mas_o_menos', 'poco_util']
const VALID_Q2 = ['practica', 'clases', 'listening', 'speaking', 'writing', 'progreso', 'otra']
const VALID_Q3 = ['mas_ejercicios', 'mas_clases', 'mas_listening', 'mas_speaking', 'mas_juegos', 'mejor_progreso', 'conforme']

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => null)
    const token = body && typeof body.token === 'string' ? body.token.trim() : ''
    if (!token) return json({ error: 'missing_token' }, 400)

    const q1 = VALID_Q1.includes(body.q1) ? body.q1 : null
    const q2 = VALID_Q2.includes(body.q2) ? body.q2 : null
    const q3 = VALID_Q3.includes(body.q3) ? body.q3 : null
    // Respuesta abierta: texto libre, con un tope de longitud generoso
    // para que nadie pueda mandar algo gigante por error o a propósito.
    const q4raw = typeof body.q4 === 'string' ? body.q4.trim() : ''
    const q4 = q4raw ? q4raw.slice(0, 2000) : null

    if (!q1 || !q2 || !q3) {
      return json({ error: 'missing_answers' }, 400)
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('survey_15d_token', token)
      .maybeSingle()
    if (profErr) console.error('Error buscando perfil por token:', profErr)
    if (!profile) return json({ error: 'invalid_token' }, 404)

    const { error: upsertErr } = await supabase
      .from('survey_responses')
      .upsert(
        {
          user_id: profile.id,
          email: profile.email,
          q1_satisfaccion: q1,
          q2_mas_usado: q2,
          q3_mejorar: q3,
          q4_comentario: q4,
        },
        { onConflict: 'user_id' }
      )
    if (upsertErr) {
      console.error('Error guardando respuesta de encuesta:', upsertErr)
      return json({ error: 'save_failed' }, 500)
    }

    return json({ ok: true }, 200)
  } catch (e) {
    console.error(e)
    return json({ error: 'server_error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
