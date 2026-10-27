# Prueba controlada en producción con una cuenta de prueba tuya

Solo cuentas tuyas de prueba, nunca de clientes. Se hace justo después de aplicar la migración y antes de publicar el frontend.

## A. Prueba de servidor (no guarda nada)
1. En el SQL Editor, abrir `supabase/verify/academia_demo_independiente_prueba.sql`, cambiar `TU_CORREO_DE_PRUEBA@example.com` por el correo de tu cuenta de prueba y correrlo.
2. Resultado esperado: Supabase muestra un error con el texto `RESULTADO (nada se guardo): [...]` y los 11 pasos en `true`:
   límite 6/6 con demo disponible; la demo empieza con el límite agotado; reanudar no cobra; un contador o fecha falsos no cambian nada; demo usada se bloquea; estado final correcto; curso sin demo y curso inexistente cerrados; el contador diario sigue en 6; el miembro no gasta demo; `anon` bloqueado.
3. Ese error es a propósito: deshace todo. Si algún paso sale `false`, no publicar y avisarme.

## B. Prueba en pantalla (con sesión real, cuenta de prueba NO miembro)
Después de publicar el frontend (o antes, si se prueba con una vista previa local):
| Paso | Qué hacer | Resultado esperado |
|---|---|---|
| 1 | Iniciar sesión | Entra a su panel sin errores |
| 2 | Abrir Academia | Muestra TO BE y "Probar TO BE gratis" |
| 3 | Abrir Practicar | Práctica gratis normal |
| 4 | Hacer 6 ejercicios gratis | Aviso "Completaste tus 6 ejercicios", botón de membresía de $2 y debajo la invitación a TO BE |
| 5 | "Probar la Academia gratis" | Abre la demo aunque el límite esté agotado |
| 6 | Terminar la demo (explicación y 3 ejercicios) | Final de la demo; el contador de hoy sigue en 6 |
| 7 | Volver al aviso del límite y a Academia | La invitación ya no aparece; dice "Ya hiciste tu prueba gratis" |
| 8 | Borrar datos del navegador y repetir | Sigue bloqueada (lo decide el servidor) |
| 9 | Mi progreso | El curso muestra solo la demo hecha, sin lecciones completas ni insignias |

Al terminar, para dejar la cuenta de prueba como nueva (solo la tuya):
`delete from public.academia_progress where user_id = (select id from auth.users where email = 'TU_CORREO_DE_PRUEBA@example.com') and course_id = 'to-be';`
