/* Aplica la navegación del área del alumno (Inicio | Academia | Practicar | Mi progreso | Aprende inglés)
   al header, a la barra inferior del móvil y al pie de las páginas privadas. Idempotente. */
const fs = require('fs');
const PAGES = {
  'miembros.html': 'inicio', 'plan-estudio.html': 'practicar', 'errores.html': 'practicar', 'aprender.html': 'practicar',
  'clases.html': 'practicar', 'practica-miembros.html': 'practicar', 'progreso.html': 'progreso'
};
const ICON = {
  inicio: '<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  academia: '<path d="M12 4L2 9l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6 11.5V16c0 1.2 2.7 3 6 3s6-1.8 6-3v-4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  practicar: '<path d="M5 13l3 3 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>',
  progreso: '<path d="M4 19h16M7 19V10M12 19V5M17 19v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  aprender: '<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 9h8M8 13h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
};
for(const [file, cur] of Object.entries(PAGES)){
  let h = fs.readFileSync(file, 'utf8');
  const c = k => k === cur ? ' class="current"' : '';
  const nav = `<nav class="nav-links">
      <a href="miembros.html"${c('inicio')}>Inicio</a>
      <a href="academia.html" class="ac-live-only">Academia</a>
      <a href="practica.html"${c('practicar')}>Practicar</a>
      <a href="progreso.html"${c('progreso')}>Mi progreso</a>
      <a href="articulos.html">Aprende inglés</a>
      <a href="clases-particulares.html">Clases particulares</a>
      <a href="index.html#contacto">Contacto</a>
    </nav>`;
  const n1 = h.replace(/<nav class="nav-links">[\s\S]*?<\/nav>/, nav);
  const m = (k, href, label) => `  <button class="mnav-item${k === cur ? ' active' : ''}" onclick="location.href='${href}'"${k === cur ? ' aria-current="page"' : ''}>
    <svg viewBox="0 0 24 24" fill="none">${ICON[k]}</svg>
    ${label}
  </button>`;
  const mob = `<nav class="mobile-nav" aria-label="Navegación principal">
${m('inicio','miembros.html','Inicio')}
${m('academia','academia.html','Academia')}
${m('practicar','practica.html','Practicar')}
${m('progreso','progreso.html','Progreso')}
${m('aprender','articulos.html','Aprende')}
</nav>`;
  const n2 = n1.replace(/<nav class="mobile-nav">[\s\S]*?<\/nav>/, mob);
  let n3 = n2.replace(/(<div class="foot-links">[\s\S]*?)<\/div>/, (all, pre) => `<div class="foot-links">
      <a href="miembros.html">Inicio</a>
      <a href="academia.html">Academia</a>
      <a href="practica.html">Practicar</a>
      <a href="progreso.html">Mi progreso</a>
      <a href="articulos.html">Aprende inglés</a>
      <a href="clases-particulares.html">Clases con Leo</a>
      <a href="privacidad.html">Privacidad</a>
    </div>`);
  if(n3 === h) console.log('sin cambios', file); else { fs.writeFileSync(file, n3); console.log('ok', file); }
}
