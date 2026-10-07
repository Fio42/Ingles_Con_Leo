# QA E2E del sistema adaptativo

Sin dependencias y sin red: ejecuta el `app.js`, `backend.js`, `data.js` y `temas.js` REALES contra una nube simulada
(profiles + progress_sessions + llamadas a mistake_stats, con los permisos de columna de Supabase). Dos "navegadores"
independientes (su propio localStorage) comparten la misma cuenta.

## Comandos
```bash
node tools/e2e/run-all.js                              # informe completo (microtemas activos + regresiones + suite del repo)
node tools/e2e/test-microtema.js cond-1-probable       # un microtema
node tools/e2e/test-microtema.js --all-active          # todos los que tengan active:true en temas.js
node tools/e2e/regresiones.js                          # invitados, onboarding/nivel, inactivos, IDs, migracion de senales, diagnostico, session-cycle
node tools/e2e/simulate-flow.js                        # simulador abstracto de POLITICAS de preparacion para comprobar (A/B/C/D/E/F)
node tools/e2e/simulate-real.js cond-1-probable        # lo mismo con la IMPLEMENTACION REAL (applyMicroResults, microFlowState, pickCheckItems)
```

## Microtema nuevo
No hay que escribir un test. Al poner `active:true` en `temas.js`, `--all-active` y `run-all.js` lo recorren solos:
3 fallos distintos -> microdebilidad -> recomendacion -> refuerzo (con un fallo accidental) -> comprobacion con 3 checks
ineditos -> dominio -> no repeticion -> segundo navegador. Nivel, ejercicios, checks y URL de foco salen de los datos.
Excepciones (nivel, fallos requeridos) en `micros.config.json`.

## Que verifica por microtema (campos internos incluidos)
`m`, `w`, `t`, `f`, `o` en cada resultado; `wi` (3 IDs distintos), `wk`, `pr`, `pc`, `ck`, `lc`; que los checks nunca salgan como
practica (120 sesiones normales + 10 del Plan con foco), que nunca lleguen a mistake_stats, que no se repitan al recargar
ni en un segundo navegador, y los desenlaces 3/3, 2/3 y 1/3.

## Reglas que el E2E exige a cada microtema activo
- >=6 ejercicios de practica en su nivel, >=2 tipos, recurso con ancla y **>=6 de comprobacion (2 rondas inéditas de 3)**.
- Preparacion para comprobar: >=5 respuestas de refuerzo, >=4 ejercicios distintos, >=4 de las ultimas 5 al primer intento y >=70 % acumulado. Nunca solo por cantidad.
- Tras fallar la 1ª ronda el alumno vuelve a refuerzo y la 2ª ronda solo se ofrece cuando vuelve a estar preparado; sin reciclaje de checks vistos.

## Decisiones futuras (no tocar sin datos reales)
- Revisar si **3/3 = dominio** es demasiado estricto: con 3 ítems incluso un alumno de 90 % falla el 3/3 al primer intento ~27 % de las veces (ver simulate-real.js).
- Reciclaje de checks vistos con enfriamiento: mecanismo de reserva, solo si los datos muestran que el banco de 6 no basta.

## Prueba contra produccion con la cuenta QA (capa manual, sin guardar credenciales)
La contrasena la escribe SIEMPRE una persona. Nunca se guarda en el repositorio.
1. Abre un navegador de pruebas, entra a inglesconleo.com con la cuenta QA y completa el login a mano.
2. Si se usa Playwright (requiere `npm i -D playwright` y descargar navegadores, pedir aprobacion), guarda la sesion en
   `tools/e2e/.auth/qa.storageState.json` (ya esta en .gitignore) y reutilizala en cada corrida.
3. Cada paso de produccion usa las URLs de foco que imprime `test-microtema.js`.

## Reset de la cuenta QA (PLANTILLA: NO ejecutar sin aprobacion)
Los datos de la cuenta QA NO viven en el repositorio: se configuran localmente (variables de entorno o un archivo ignorado por Git):
```
QA_EMAIL=<cuenta QA>
QA_USER_ID=<uuid QA>      # se obtiene con una consulta de solo lectura a auth.users filtrando por QA_EMAIL
```
Siempre filtrar por ESE user_id (nunca por email suelto ni sin filtro) y contar antes de borrar:
```sql
-- 0) comprobar primero (solo lectura)
select count(*) from public.progress_sessions where user_id = '<QA_USER_ID>';
select count(*) from public.mistake_stats     where user_id = '<QA_USER_ID>';
-- 1) limpieza (solo tras aprobacion expresa)
delete from public.progress_sessions where user_id = '<QA_USER_ID>';
delete from public.mistake_stats     where user_id = '<QA_USER_ID>';
```
El estado local (leo_progress_v2, leo_micro_stats_v1, leo_check_seen_v1, leo_derived_meta_v1) se borra en el navegador de prueba.

Nunca se guardan en Git: contrasena, cookies, tokens ni storageState (`tools/e2e/.auth/` y `*.storageState.json` estan en .gitignore).
