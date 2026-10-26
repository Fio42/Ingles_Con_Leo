#!/usr/bin/env node
/* Comprobacion de interruptores ANTES de publicar. No toca nada: solo lee el codigo.
   node tools/prelanzamiento.js --off   => el commit a publicar NO enciende la academia (publicacion segura)
   node tools/prelanzamiento.js --on    => el commit de encendido tiene los tres interruptores del codigo en true
   (academia_courses.enabled vive en Supabase: se comprueba con supabase/verify/academia_verificacion.sql) */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const want = process.argv.includes('--on');
const sw = {
  'PUBLIC (academia-lanzamiento.js)': /var PUBLIC = true;/.test(rd('academia-lanzamiento.js')),
  'CLOUD_ON (academia-boot.js)': /var CLOUD_ON = true;/.test(rd('academia-boot.js')),
  'ACADEMIA_MOTOR.enabled (academia-motor.js)': /var M = \{ enabled: true,/.test(rd('academia-motor.js'))
};
let bad = 0;
Object.keys(sw).forEach(k => { const ok = sw[k] === want; if(!ok) bad++; console.log((ok ? ' ok  ' : 'MAL  ') + k + ' = ' + sw[k] + (ok ? '' : '  (esperado ' + want + ')')); });
const tracked = cp.execSync('git ls-files', { cwd: root }).toString().split('\n');
const priv = tracked.filter(f => /^private\//.test(f) || /seed-academia-examen/.test(f));
if(priv.length){ bad++; console.log('MAL  archivos privados en git: ' + priv.join(', ')); } else console.log(' ok  banco de examen y respuestas fuera de git');
try{ cp.execSync('node tools/generar_academia_motor.js --check', { cwd: root, stdio: 'pipe', env: Object.assign({}, process.env, { ACADEMIA_MOTOR_ENABLED: want ? '1' : '0' }) }); console.log(' ok  academia-motor.js al dia'); }catch(e){ bad++; console.log('MAL  academia-motor.js desactualizado'); }
const mig = rd('supabase/migrations/20261026120000_academia_integracion.sql');
if(/insert into public\.academia_courses[^;]*false/.test(mig) && !/enabled\s*=\s*true/.test(mig)) console.log(' ok  la migracion deja el curso apagado'); else { bad++; console.log('MAL  la migracion no deja el curso apagado'); }
const wf = fs.existsSync(path.join(root, '.github/workflows')) ? fs.readdirSync(path.join(root, '.github/workflows')).map(f => rd('.github/workflows/' + f)).join('\n') : '';
if(/db push|supabase.*migration|functions deploy/i.test(wf)){ bad++; console.log('MAL  un workflow podria aplicar migraciones solo'); } else console.log(' ok  ningun workflow aplica migraciones ni funciones solo');
console.log(bad ? '\nNO publicar: ' + bad + ' problema(s)' : '\nTodo en orden para ' + (want ? 'ENCENDER' : 'publicar con la academia apagada'));
process.exit(bad ? 1 : 0);
