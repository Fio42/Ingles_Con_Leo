-- Marcar como email_invalid las 5 cuentas con correo que no puede recibir mensajes.
-- PREPARADO, NO EJECUTADO. Solo se corre con autorizacion de Leo, en Supabase -> SQL Editor.
-- No cambia ningun correo, no borra nada, no toca baja, pagos ni membresia.
-- Las cuentas se identifican por id (3 direcciones suprimidas por Resend: 2 rebotes y 1 queja,
-- y 2 con el dominio mal escrito que rebotaron repetidamente). Ninguna es miembro ni tiene Stripe,
-- asi que no afecta avisos de pago. La recuperacion de contrasena no mira esta marca.

-- 1) ANTES: deben salir exactamente 5 filas, todas con email_invalid = false.
select id, is_member, email_invalid, email_invalid_at, (email_opt_out_at is not null) as baja
from public.profiles
where id in (
  '6d8924de-95ee-4718-b27d-0f4963fad7c3',
  'b7f72ec4-97c6-4426-acca-10bc44433187',
  '2f398df9-5101-4c86-aca2-d8e63cf03549',
  'aa229908-70ea-42f6-ac47-8bf87afce82f',
  '3d99d900-4cd6-4da2-aca3-f39beb49ced0'
);

-- 2) CAMBIO (corre solo si el paso 1 mostro 5 filas): maximo 5 filas, solo las que aun no estan marcadas.
update public.profiles
set email_invalid = true, email_invalid_at = now()
where email_invalid = false
  and id in (
  '6d8924de-95ee-4718-b27d-0f4963fad7c3',
  'b7f72ec4-97c6-4426-acca-10bc44433187',
  '2f398df9-5101-4c86-aca2-d8e63cf03549',
  'aa229908-70ea-42f6-ac47-8bf87afce82f',
  '3d99d900-4cd6-4da2-aca3-f39beb49ced0'
);
-- Debe decir: "Success. 5 rows affected" (si dice otra cifra, no sigas y avisame).

-- 3) DESPUES: las 5 filas con email_invalid = true y fecha de hoy; en todo el sitio deben ser exactamente 5.
select count(*) filter (where email_invalid) as invalidos_total,
       count(*) filter (where email_invalid and id in (
         '6d8924de-95ee-4718-b27d-0f4963fad7c3','b7f72ec4-97c6-4426-acca-10bc44433187',
         '2f398df9-5101-4c86-aca2-d8e63cf03549','aa229908-70ea-42f6-ac47-8bf87afce82f',
         '3d99d900-4cd6-4da2-aca3-f39beb49ced0')) as invalidos_de_las_5
from public.profiles;

-- DESHACER (solo si hiciera falta):
-- update public.profiles set email_invalid = false, email_invalid_at = null
-- where id in ('6d8924de-95ee-4718-b27d-0f4963fad7c3','b7f72ec4-97c6-4426-acca-10bc44433187',
--   '2f398df9-5101-4c86-aca2-d8e63cf03549','aa229908-70ea-42f6-ac47-8bf87afce82f','3d99d900-4cd6-4da2-aca3-f39beb49ced0');
