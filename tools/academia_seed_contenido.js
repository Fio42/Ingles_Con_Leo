#!/usr/bin/env node
// Genera la semilla SQL del contenido premium de un curso desde private/contenido/<curso>.json.
// La semilla se escribe en private/ (git-ignored): NUNCA va al repositorio publico ni al despliegue.
// Uso: node tools/academia_seed_contenido.js articulos
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const priv = process.env.LEO_PRIVATE_DIR || path.join(root, 'private');
const id = process.argv[2];
if (!/^[a-z0-9-]{2,40}$/.test(id || '')) { console.error('Uso: node tools/academia_seed_contenido.js <curso>'); process.exit(1); }
const src = path.join(priv, 'contenido', id + '.json');
if (!fs.existsSync(src)) { console.error('No existe ' + src); process.exit(1); }
const content = JSON.parse(fs.readFileSync(src, 'utf8'));
const audioF = path.join(priv, 'contenido', id + '.audio.json');
if (fs.existsSync(audioF)) content.audio = JSON.parse(fs.readFileSync(audioF, 'utf8'));
if (content.course !== id) { console.error('El archivo no corresponde al curso ' + id); process.exit(1); }
const json = JSON.stringify(content).replace(/'/g, "''");
const sql = `-- Semilla PRIVADA del contenido de '${id}'. No subir al repositorio.\n` +
  `insert into public.academia_content (course_id, version, content) values ('${id}', ${content.version || 1}, '${json}'::jsonb)\n` +
  `on conflict (course_id) do update set version = excluded.version, content = excluded.content, updated_at = now();\n`;
const out = path.join(priv, `seed-academia-contenido-${id}.sql`);
fs.writeFileSync(out, sql);
console.log('Escrito ' + out + ' (' + sql.length + ' bytes)');
