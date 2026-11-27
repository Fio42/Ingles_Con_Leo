/* GENERADO por tools/v2/portar_v3.py (arte del prototipo v3). No editar a mano. */
/* =========================================================
   Inglés con Leo 2.0 · Arte en SVG (v2)
   Iconos, navegación de dos estados, stickers, emblemas de curso,
   cofres por nivel, colección de insignias, ilustraciones y avatar por capas.
   Contorno de tinta = var(--k-illus-outline). Todo se adapta al tema.
   ========================================================= */
(function(){
const O = 'var(--k-illus-outline)';

/* ---------- Iconos de interfaz (línea) ---------- */
const L = (d, extra='') => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const UI = {
  home: L('<path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.5 9v10.2c0 .7.5 1.2 1.2 1.2h3.6v-5.6h3.4v5.6h3.6c.7 0 1.2-.5 1.2-1.2V9"/>'),
  map: L('<path d="M9 4 3.8 6.1v13.8L9 17.8l6 2.2 5.2-2.1V4.1L15 6.2 9 4Z"/><path d="M9 4v13.8M15 6.2V20"/>'),
  practice: L('<path d="M14.5 4.5 19.5 9.5 9 20H4v-5L14.5 4.5Z"/><path d="m12.5 6.5 5 5"/>'),
  chart: L('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  user: L('<circle cx="12" cy="8.2" r="4.2"/><path d="M4 20.5c1.3-3.8 4.3-5.6 8-5.6s6.7 1.8 8 5.6"/>'),
  chat: L('<path d="M20.5 12c0 4.1-3.8 7.3-8.5 7.3-1.3 0-2.5-.2-3.6-.7L3.5 20l1.3-3.7C4 15.1 3.5 13.6 3.5 12c0-4 3.8-7.3 8.5-7.3s8.5 3.3 8.5 7.3Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="3"/>'),
  close: L('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: L('<path d="m4.5 12.5 4.8 4.8L19.5 7"/>', 'stroke-width="3"'),
  x: L('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 'stroke-width="3"'),
  speaker: L('<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4v-5Z" fill="currentColor"/><path d="M16 9c1.2 1.6 1.2 4.4 0 6M18.8 6.5c2.6 3 2.6 8 0 11"/>'),
  soundOff: L('<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4v-5Z" fill="currentColor"/><path d="m16.5 9.5 5 5M21.5 9.5l-5 5"/>'),
  sun: L('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
  moon: L('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
  auto: L('<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>'),
  chevron: L('<path d="m9 5 7 7-7 7"/>'),
  down: L('<path d="m5 9 7 7 7-7"/>'),
  back: L('<path d="M15 5 8 12l7 7"/>'),
  lock: L('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  refresh: L('<path d="M20 11a8 8 0 0 0-14.3-4.5L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.5L20 15.5"/><path d="M20 20v-4.5h-4.5"/>'),
  wand: L('<path d="m4 20 11-11M14 4l1 2.5L17.5 7.5 15 8.5 14 11l-1-2.5L10.5 7.5 13 6.5 14 4ZM19 12l.6 1.4L21 14l-1.4.6L19 16l-.6-1.4L17 14l1.4-.6L19 12Z"/>'),
  send: L('<path d="M4 12 20 4l-4 16-4-6.5L4 12Z"/><path d="m12 13.5 8-9.5"/>'),
  play: L('<path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor"/>'),
  sparkle: L('<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" fill="currentColor"/>'),
  clockLine: L('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  info: L('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01" stroke-width="2.6"/>'),
  gallery: L('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
};

/* ---------- Navegación de dos estados: línea inactiva, rellena + tinta activa ---------- */
const N = (shape, detail='') => `<svg class="ico nav-ico" viewBox="0 0 32 32" aria-hidden="true"><g class="nav-ico__body" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${shape}</g><g class="nav-ico__detail" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${detail}</g></svg>`;
const NAV_ICO = {
  inicio: N('<path d="M5 14.5 16 5.5l11 9V26a1.5 1.5 0 0 1-1.5 1.5h-19A1.5 1.5 0 0 1 5 26V14.5Z"/>', '<path d="M13 27.5v-7h6v7"/>'),
  academia: N('<path d="M4.5 8.5 11.5 5l9 3.5 7-3.5v19l-7 3.5-9-3.5-7 3.5v-19Z"/>', '<path d="M11.5 5v19M20.5 8.5v19"/><path d="M14.5 14.5l2.5 2.5M17 14.5l-2.5 2.5" stroke-width="2"/>'),
  desafios: N('<path d="M5 13c0-4.5 4.5-7.5 11-7.5S27 8.5 27 13v2H5v-2Z"/><rect x="5" y="14" width="22" height="13" rx="2.5"/>', '<path d="M5 16.5h22"/><rect x="13.5" y="13" width="5" height="7" rx="1.5"/>'),
  progreso: N('<rect x="4.5" y="15" width="6" height="12" rx="2"/><rect x="13" y="9" width="6" height="18" rx="2"/><rect x="21.5" y="4.5" width="6" height="22.5" rx="2"/>', ''),
  perfil: N('<circle cx="16" cy="11" r="6.5"/><path d="M4.5 28c1.5-6 6-9 11.5-9s10 3 11.5 9H4.5Z"/>', ''),
  ai: N('<path d="M27 15.5c0 5.8-4.9 10-11 10-1.7 0-3.3-.3-4.7-.9L5 26.5l1.8-4.8A9.6 9.6 0 0 1 5 15.5c0-5.8 4.9-10 11-10s11 4.2 11 10Z"/>', '<path d="M11 15.5h.01M16 15.5h.01M21 15.5h.01" stroke-width="3.4"/>'),
  practicar: N('<path d="M19.5 5.5 26.5 12.5 12 27H5v-7L19.5 5.5Z"/>', '<path d="m16.5 8.5 7 7"/>'),
};

/* ---------- Stickers ---------- */
const S = (inner, vb='0 0 48 48') => `<svg class="ico" viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
const STK = {
  flame: S(`<path d="M24 4c2 8 12 11 12 23a12 12 0 0 1-24 0c0-6 3-9 6-12 0 4 1.5 6 3.5 7C21 15 21 9 24 4Z" fill="var(--k-streak)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M24 26c1.2 3 5 4 5 8.5a5 5 0 0 1-10 0c0-3 2-4.5 3-6 .4 1.4 1.2 2 2 2-.6-1.6-.6-3 0-4.5Z" fill="var(--k-xp)"/>`),
  flameOff: S(`<path d="M24 4c2 8 12 11 12 23a12 12 0 0 1-24 0c0-6 3-9 6-12 0 4 1.5 6 3.5 7C21 15 21 9 24 4Z" fill="var(--k-surface-3)" stroke="var(--k-line-strong)" stroke-width="3" stroke-linejoin="round"/>`),
  bolt: S(`<path d="M27 3 9 27h12l-3 18 19-25H25l2-17Z" fill="var(--k-xp)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M24.5 9 16 22" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`),
  target: S(`<circle cx="24" cy="24" r="19" fill="var(--k-bad)" stroke="${O}" stroke-width="3"/><circle cx="24" cy="24" r="12" fill="#fff"/><circle cx="24" cy="24" r="6" fill="var(--k-bad)"/><path d="m24 24 15-15M33 6l1 5 5 1" stroke="${O}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  book: S(`<path d="M6 10c6-2 12-1 18 3 6-4 12-5 18-3v28c-6-2-12-1-18 3-6-4-12-5-18-3V10Z" fill="var(--k-brand)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M24 13v28" stroke="${O}" stroke-width="3"/><path d="M10 15c4-1 7-.5 10 1M28 16c3-1.5 6-2 10-1" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round"/>`),
  mend: S(`<circle cx="24" cy="24" r="19" fill="var(--k-mend)" stroke="${O}" stroke-width="3"/><path d="M15 25.5c0-5 4-9 9-9 2.6 0 5 1.1 6.6 3" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="m31.5 14.5-.6 6-6-.8" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="m18 30 4 4 8-9" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  combo: S(`<path d="M8 30 20 6h10l-6 14h14L18 44l4-14H8Z" fill="var(--k-streak)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`),
  ear: S(`<circle cx="24" cy="24" r="19" fill="var(--k-info)" stroke="${O}" stroke-width="3"/><path d="M17 20a7 7 0 0 1 14 0c0 5-5 5-5 10a4 4 0 0 1-7 2.5" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M21 21a3 3 0 0 1 6 0" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>`),
  clock: S(`<circle cx="24" cy="25" r="18" fill="var(--k-ok)" stroke="${O}" stroke-width="3"/><circle cx="24" cy="25" r="12" fill="#fff"/><path d="M24 18v7l5 3" stroke="${O}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M19 4h10" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`),
  trophy: S(`<path d="M14 6h20v12a10 10 0 0 1-20 0V6Z" fill="var(--k-xp)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M14 10H7c0 7 3 10 8 10M34 10h7c0 7-3 10-8 10" stroke="${O}" stroke-width="3" fill="none"/><path d="M21 28h6v6h-6zM15 42c0-5 4-8 9-8s9 3 9 8H15Z" fill="var(--k-xp)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M19 10v7" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`),
  rush: S(`<circle cx="24" cy="24" r="19" fill="var(--k-bad)" stroke="${O}" stroke-width="3"/><path d="M26 10 16 26h8l-2 12 10-16h-8l2-12Z" fill="var(--k-xp)" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`),
  grad: S(`<path d="M3 18 24 9l21 9-21 9L3 18Z" fill="var(--k-award)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M12 22v9c3 3 7 4 12 4s9-1 12-4v-9" fill="var(--k-award)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M41 19v10" stroke="${O}" stroke-width="3" stroke-linecap="round"/><circle cx="41" cy="31" r="2.5" fill="var(--k-xp)" stroke="${O}" stroke-width="2"/>`),
  bulb: S(`<path d="M24 5a13 13 0 0 0-8 23c1.5 1.3 2 3 2 5h12c0-2 .5-3.7 2-5a13 13 0 0 0-8-23Z" fill="var(--k-xp)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M18 38h12M20 43h8" stroke="${O}" stroke-width="3" stroke-linecap="round"/><path d="M19 14a7 7 0 0 1 5-3" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`),
  pen: S(`<circle cx="24" cy="24" r="19" fill="var(--k-award)" stroke="${O}" stroke-width="3"/><path d="m28 13 7 7-13 13h-7v-7l13-13Z" fill="#fff" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`),
  mic: S(`<circle cx="24" cy="24" r="19" fill="var(--k-streak)" stroke="${O}" stroke-width="3"/><rect x="19" y="11" width="10" height="17" rx="5" fill="#fff" stroke="${O}" stroke-width="2.5"/><path d="M15 23a9 9 0 0 0 18 0M24 32v5" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>`),
  abc: S(`<circle cx="24" cy="24" r="19" fill="var(--k-ok)" stroke="${O}" stroke-width="3"/><text x="24" y="30" text-anchor="middle" font-family="Baloo 2 V2,system-ui" font-weight="800" font-size="16" fill="#fff">abc</text>`),
  flag: S(`<path d="M12 44V5" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/><path d="M13 7c8-4 13 4 22 0v18c-9 4-14-4-22 0V7Z" fill="var(--k-bad)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`),
  calendar: S(`<rect x="6" y="9" width="36" height="33" rx="5" fill="#fff" stroke="${O}" stroke-width="3"/><path d="M6 14a5 5 0 0 1 5-5h26a5 5 0 0 1 5 5v5H6v-5Z" fill="var(--k-bad)" stroke="${O}" stroke-width="3"/><path d="M15 5v8M33 5v8" stroke="${O}" stroke-width="3" stroke-linecap="round"/><path d="m17 30 5 5 9-10" stroke="var(--k-ok)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
};

/* ---------- Cofres con personalidad: madera, plata, oro ---------- */
const CHEST_T = {
  wood:  {body:'#C9824A', dark:'#8E5428', band:'#6B7280', gem:'var(--k-xp)'},
  silver:{body:'#AEB8CC', dark:'#7B879F', band:'#4B5568', gem:'var(--k-info)'},
  gold:  {body:'#FFC94A', dark:'#D9951A', band:'#9A5B00', gem:'var(--k-bad)'},
};
function chest(tier='wood', open=false, size=64){
  const c = CHEST_T[tier];
  const lid = open
    ? `<g transform="rotate(-18 14 34)"><path d="M10 34c0-12 9-20 30-20s30 8 30 20v4H10v-4Z" fill="${c.body}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M16 30c2-7 9-11 20-12" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M36 14v24M44 14v24" stroke="${c.band}" stroke-width="4"/></g>`
    : `<path d="M10 40c0-12 9-20 30-20s30 8 30 20v4H10v-4Z" fill="${c.body}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M17 36c2-7 9-11 20-12" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M33 21v23M47 21v23" stroke="${c.band}" stroke-width="4"/>`;
  const glow = open ? `<g class="chest-glow"><path d="M40 40 22 4h36Z" fill="var(--k-xp)" opacity=".35"/><circle cx="30" cy="34" r="6" fill="var(--k-xp)" stroke="${O}" stroke-width="2.5"/><circle cx="44" cy="30" r="7" fill="var(--k-xp)" stroke="${O}" stroke-width="2.5"/><circle cx="52" cy="37" r="5" fill="#fff" stroke="${O}" stroke-width="2.5"/><path d="M40 8v6M28 12l3 4M52 12l-3 4" stroke="var(--k-xp)" stroke-width="3.5" stroke-linecap="round"/></g>` : '';
  return `<svg class="chest chest--${tier}" viewBox="0 0 80 72" width="${size}" height="${size*0.9}" aria-hidden="true">
    <ellipse cx="40" cy="68" rx="30" ry="4" fill="var(--k-surface-3)"/>
    ${glow}
    <rect x="10" y="40" width="60" height="26" rx="4" fill="${c.body}" stroke="${O}" stroke-width="3.5"/>
    <path d="M10 46h60" stroke="${O}" stroke-width="3"/>
    <path d="M14 62h52" stroke="${c.dark}" stroke-width="4" stroke-linecap="round"/>
    <path d="M33 40v26M47 40v26" stroke="${c.band}" stroke-width="4"/>
    ${lid}
    ${open?'':`<rect x="34" y="36" width="12" height="15" rx="3" fill="${c.gem}" stroke="${O}" stroke-width="3"/><circle cx="40" cy="43" r="2" fill="${O}"/>`}
  </svg>`;
}

/* ---------- Emblemas de curso (identidad gráfica por curso) ---------- */
const COURSE_ART = {
  'to-be':             {glyph:'be',   c:'#2D4BF0'},
  'pronombres':        {glyph:'I',    c:'#7656F5'},
  'articulos':         {glyph:'a/an', c:'#0EA396'},
  'posesivos':         {glyph:'my',   c:'#EE4B3A'},
  'there-is-are':      {glyph:'there',c:'#1C93D6'},
  'can':               {glyph:'can',  c:'#14B26A'},
  'presente-simple':   {glyph:'-s',   c:'#FF7A1A'},
  'do-does':           {glyph:'do?',  c:'#2D4BF0'},
  'in-on-at':          {glyph:'in',   c:'#7656F5'},
  'wh':                {glyph:'wh?',  c:'#EE4B3A'},
  'presente-continuo': {glyph:'-ing', c:'#0EA396'},
};
const SHAPES = {
  circle:'M40 6a34 34 0 1 1 0 68 34 34 0 0 1 0-68Z',
  hex:'M40 4 72 22v36L40 76 8 58V22Z',
  shield:'M40 4c11 6 22 8 32 8v28c0 19-15 30-32 36C23 70 8 59 8 40V12c10 0 21-2 32-8Z',
  star:'M40 3l9 9 13-2 2 13 11 8-7 11 3 13-13 3-6 12-12-6-12 6-6-12-13-3 3-13-7-11 11-8 2-13 13 2Z',
  rosette:'M40 4l7 6 9-2 4 8 9 3-1 9 6 7-6 7 1 9-9 3-4 8-9-2-7 6-7-6-9 2-4-8-9-3 1-9-6-7 6-7-1-9 9-3 4-8 9 2Z',
};
function emblem(key, {shape='circle', locked=false, size=64, ribbon=false}={}){
  const a = COURSE_ART[key]; const fill = locked ? 'var(--k-surface-3)' : a.c;
  const fs = a.glyph.length > 3 ? 18 : a.glyph.length > 2 ? 22 : 28;
  return `<svg class="emblem ${locked?'is-locked':''}" viewBox="0 0 80 ${ribbon?92:80}" width="${size}" height="${size*(ribbon?92:80)/80}" aria-hidden="true">
    ${ribbon?`<path d="M24 62 18 88l10-5 6 8 6-20M56 62l6 26-10-5-6 8-6-20" fill="var(--k-xp)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`:''}
    <path d="${SHAPES[shape]}" fill="${fill}" stroke="${locked?'var(--k-line-strong)':O}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="${SHAPES[shape]}" fill="none" stroke="#fff" stroke-opacity="${locked?0:.35}" stroke-width="3" transform="translate(40 40) scale(.78) translate(-40 -40)"/>
    <text x="40" y="${40+fs*0.36}" text-anchor="middle" font-family="Baloo 2 V2,system-ui" font-weight="800" font-size="${fs}" fill="${locked?'var(--k-text-3)':'#fff'}" ${locked?'':`stroke="${O}" stroke-width="1.4" paint-order="stroke"`}>${a.glyph}</text>
  </svg>`;
}

/* ---------- Insignias generales ---------- */
const TIER = {bronze:'#D08A4E', silver:'#B9C2D3', gold:'#FFC94A'};
function medal(shape, fill, inner, {tier=null, locked=false}={}){
  const rim = tier ? `<path d="${SHAPES[shape]}" fill="none" stroke="${TIER[tier]}" stroke-width="5" transform="translate(40 40) scale(.9) translate(-40 -40)"/>` : '';
  return `<svg class="badge__art" viewBox="0 0 80 90" aria-hidden="true">
    <path d="M24 62 18 86l10-5 6 8 6-18M56 62l6 24-10-5-6 8-6-18" fill="${locked?'var(--k-surface-3)':'var(--k-bad)'}" stroke="${locked?'var(--k-line-strong)':O}" stroke-width="3" stroke-linejoin="round"/>
    <path d="${SHAPES[shape]}" fill="${locked?'var(--k-surface-3)':fill}" stroke="${locked?'var(--k-line-strong)':O}" stroke-width="3.5" stroke-linejoin="round"/>
    ${locked?'':rim}
    <g ${locked?'opacity=".35" style="filter:grayscale(1)"':''}>${inner}</g>
  </svg>`;
}
const W = '#fff';
const GLYPH = {
  check:`<path d="M28 41l8 8 16-17" stroke="${W}" stroke-width="6.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  flame:(n)=>`<path d="M40 18c2 7 11 10 11 21a11 11 0 0 1-22 0c0-5 3-8 5-10 0 4 1.5 5 3 6-1-6 0-11 3-17Z" fill="${W}" stroke="${O}" stroke-width="2.5"/><text x="40" y="48" text-anchor="middle" font-family="Baloo 2 V2,system-ui" font-weight="800" font-size="13" fill="${O}">${n}</text>`,
  bolt:`<path d="M43 20 30 42h9l-3 16 14-23h-9l2-15Z" fill="${W}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`,
  mend:`<path d="M27 42c0-7 6-13 13-13 3.6 0 7 1.5 9.3 4" stroke="${W}" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="m51 27-1 8-8-1M32 48l6 6 11-12" stroke="${W}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  ear:`<path d="M31 35a9 9 0 0 1 18 0c0 7-7 7-7 13a5 5 0 0 1-9 2.5" stroke="${W}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`,
  star:`<path d="m40 22 5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z" fill="${W}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`,
  sun:`<circle cx="40" cy="40" r="9" fill="${W}" stroke="${O}" stroke-width="2.5"/><path d="M40 22v5M40 53v5M22 40h5M53 40h5M27 27l3.5 3.5M49.5 49.5 53 53M27 53l3.5-3.5M49.5 30.5 53 27" stroke="${W}" stroke-width="4" stroke-linecap="round"/>`,
};
/* Colección coherente con el estado ficticio: 6 cursos completados => 6 emblemas de curso */
const BADGES = {
  first:   {group:'Hábito', name:'Primera misión', desc:'Completa tu primera misión de Inglés con Leo 2.0.', target:1, svg:(l)=>medal('circle','var(--k-brand)',GLYPH.check,{locked:l})},
  streak3: {group:'Hábito', name:'Racha de 3', desc:'Tres días seguidos aprendiendo.', target:3, unit:'días', svg:(l)=>medal('shield','var(--k-streak)',GLYPH.flame(3),{tier:'bronze',locked:l})},
  streak7: {group:'Hábito', name:'Racha de 7', desc:'Una semana completa de hábito.', target:7, unit:'días', svg:(l)=>medal('shield','var(--k-streak)',GLYPH.flame(7),{tier:'silver',locked:l})},
  streak30:{group:'Hábito', name:'Racha de 30', desc:'Un mes entero. Esto ya es parte de ti.', target:30, unit:'días', svg:(l)=>medal('shield','var(--k-streak)',GLYPH.flame(30),{tier:'gold',locked:l})},
  mender10:{group:'Método Leo', name:'Superador I', desc:'Supera 10 errores con el Método Leo.', target:10, unit:'errores', svg:(l)=>medal('hex','var(--k-mend)',GLYPH.mend,{tier:'bronze',locked:l})},
  mender20:{group:'Método Leo', name:'Superador II', desc:'Supera 20 errores con el Método Leo.', target:20, unit:'errores', svg:(l)=>medal('hex','var(--k-mend)',GLYPH.mend,{tier:'silver',locked:l})},
  mender50:{group:'Método Leo', name:'Superador III', desc:'Supera 50 errores con el Método Leo.', target:50, unit:'errores', svg:(l)=>medal('hex','var(--k-mend)',GLYPH.mend,{tier:'gold',locked:l})},
  combo5:  {group:'Habilidad', name:'Combo ×5', desc:'Cinco aciertos seguidos en una misión.', target:5, unit:'aciertos', svg:(l)=>medal('star','var(--k-xp)',GLYPH.bolt,{locked:l})},
  ear:     {group:'Habilidad', name:'Oído fino', desc:'Completa 10 ejercicios de listening.', target:10, unit:'ejercicios', svg:(l)=>medal('circle','var(--k-info)',GLYPH.ear,{locked:l})},
  early:   {group:'Habilidad', name:'Madrugador', desc:'Practica antes de las 8 a. m.', target:1, svg:(l)=>medal('rosette','var(--k-award)',GLYPH.sun,{locked:l})},
};

/* ---------- Ilustraciones del ejercicio 2 ---------- */
const ILLUS = {
  umbrella:`<svg class="option__art" viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="110" rx="34" ry="5" fill="var(--k-surface-3)"/><path d="M14 58C14 32 35 14 60 14s46 18 46 44c-5-5-10-5-15 0-5-5-11-5-16 0-5-5-10-5-15 0-5-5-11-5-16 0-5-5-10-5-15 0-5-5-10-5-15 0Z" fill="var(--k-bad)" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M60 14c-10 10-15 26-15 44M60 14c10 10 15 26 15 44" stroke="${O}" stroke-width="3.5" fill="none"/><path d="M28 40c4-8 10-13 18-16" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M60 58v36c0 7-10 7-10 0" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="60" cy="11" r="4" fill="var(--k-xp)" stroke="${O}" stroke-width="3"/></svg>`,
  backpack:`<svg class="option__art" viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="110" rx="34" ry="5" fill="var(--k-surface-3)"/><path d="M45 26c0-10 30-10 30 0" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="26" y="26" width="68" height="78" rx="22" fill="var(--k-brand)" stroke="${O}" stroke-width="4"/><path d="M34 50c0-6 4-12 10-14" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="38" y="62" width="44" height="32" rx="10" fill="var(--k-xp)" stroke="${O}" stroke-width="4"/><path d="M38 74h44" stroke="${O}" stroke-width="3.5"/><rect x="55" y="70" width="10" height="8" rx="2" fill="#fff" stroke="${O}" stroke-width="3"/></svg>`,
  clock:`<svg class="option__art" viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="110" rx="34" ry="5" fill="var(--k-surface-3)"/><path d="M28 24 18 34M92 24l10 10" stroke="${O}" stroke-width="5" stroke-linecap="round"/><circle cx="27" cy="25" r="10" fill="var(--k-xp)" stroke="${O}" stroke-width="4"/><circle cx="93" cy="25" r="10" fill="var(--k-xp)" stroke="${O}" stroke-width="4"/><path d="M36 96l-6 10M84 96l6 10" stroke="${O}" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="62" r="38" fill="var(--k-ok)" stroke="${O}" stroke-width="4"/><circle cx="60" cy="62" r="28" fill="#fff" stroke="${O}" stroke-width="3.5"/><path d="M60 44v18l12 8" stroke="${O}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="60" cy="62" r="3.5" fill="${O}"/><path d="M38 42c3-5 7-8 12-10" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`,
};

/* ---------- Paisaje de etapa (Academia) ---------- */
function landscape(color, done){
  return `<svg class="stage__land" viewBox="0 0 360 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <circle cx="300" cy="38" r="18" fill="#fff" opacity=".35"/>
    <path d="M0 92c40-30 80-38 120-22s70 10 110-12 90-18 130 6v56H0Z" fill="#fff" opacity=".16"/>
    <path d="M0 104c50-22 95-18 140-6s90 10 140-8 60-8 80-2v32H0Z" fill="#fff" opacity=".22"/>
    <g transform="translate(250 54)"><path d="M6 46V2" stroke="${O}" stroke-width="3" stroke-linecap="round"/><path d="M7 4c7-3 11 3 19 0v14c-8 3-12-3-19 0Z" fill="${done?'var(--k-xp)':'#fff'}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/></g>
    <g fill="#fff" opacity=".5"><circle cx="40" cy="30" r="2"/><circle cx="90" cy="18" r="1.6"/><circle cx="150" cy="34" r="2"/><circle cx="200" cy="14" r="1.4"/></g>
  </svg>`;
}

/* ---------- Avatar del alumno v2: capas SVG con estilo de cómic con tinta ---------- */
const SKIN = ['#F7D7BC','#EDB98F','#D19A6A','#9C6644','#6B4430'];
const SKIN_SH = ['#E9BE9C','#D99E72','#B57F52','#7F5034','#533324'];
const HAIR_C = ['#1F1A1A','#5A3420','#A86B32','#E0BC72','#C5432E'];
const EYE_C = ['#3B2416','#2F6B4F','#2D5FA8'];
const OUTFIT = [
  {name:'Camiseta', fill:'var(--k-mend)', type:'tee'},
  {name:'Sudadera', fill:'var(--k-brand)', type:'hoodie'},
  {name:'Camisa', fill:'#FFFFFF', type:'shirt'},
  {name:'Suéter', fill:'var(--k-streak)', type:'tee'},
];
const BGS = ['var(--k-brand-tint)','var(--k-mend-tint)','var(--k-xp-tint)','var(--k-award-tint)','var(--k-bad-tint)'];
function avatarSVG(o={}){
  const a = Object.assign({skin:1,hair:0,hairColor:0,eyes:0,outfit:0,glasses:0,acc:0,mood:'smile',bg:0},o);
  const sk=SKIN[a.skin], sh=SKIN_SH[a.skin], hc=HAIR_C[a.hairColor], ec=EYE_C[a.eyes], of=OUTFIT[a.outfit];
  const sw = 2.2;
  const back = [
    '',
    `<path d="M26 50c-4 18-2 32 2 44h44c4-12 6-26 2-44Z" fill="${hc}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/>`,
    '',
    `<circle cx="74" cy="30" r="9" fill="${hc}" stroke="${O}" stroke-width="${sw}"/>`,
  ][a.hair];
  const front = [
    // 0 rizado corto (eco del estilo de Leo, sin ser Leo)
    `<path d="M29 46c-4-14 4-26 21-27 17 1 25 13 21 27-2-6-6-9-9-10-3 4-9 5-14 4-5 2-10 2-13-2-3 2-5 5-6 8Z" fill="${hc}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M35 26c3-3 6-4 9-4M52 23c4 0 8 2 10 5" stroke="#fff" stroke-opacity=".25" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
    // 1 largo con raya
    `<path d="M28 50c-2-18 6-30 22-30s24 12 22 30c-3-9-8-15-15-17-4 4-14 9-26 12 0 2-2 3-3 5Z" fill="${hc}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/>`,
    // 2 rapado / fade
    `<path d="M31 44c0-14 8-22 19-22s19 8 19 22c-2-5-8-9-19-9s-17 4-19 9Z" fill="${hc}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/>`,
    // 3 coleta
    `<path d="M29 48c-3-16 6-27 21-27s24 11 21 27c-4-8-12-12-21-12s-16 4-21 12Z" fill="${hc}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/>`,
  ][a.hair];
  const clothes = {
    tee:`<path d="M16 104c2-16 14-24 34-24s32 8 34 24Z" fill="${of.fill}" stroke="${O}" stroke-width="${sw}"/><path d="M42 81c2 5 14 5 16 0" stroke="${O}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`,
    hoodie:`<path d="M14 104c2-17 14-26 36-26s34 9 36 26Z" fill="${of.fill}" stroke="${O}" stroke-width="${sw}"/><path d="M36 79c2 9 26 9 28 0" fill="none" stroke="${O}" stroke-width="${sw}"/><path d="M45 86v10M55 86v10" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`,
    shirt:`<path d="M16 104c2-16 14-24 34-24s32 8 34 24Z" fill="#fff" stroke="${O}" stroke-width="${sw}"/><path d="M50 82v22" stroke="${O}" stroke-width="2"/><path d="M41 80l9 7 9-7-3-4H44Z" fill="var(--k-brand-tint)" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"/>`,
  }[of.type];
  const mouths = {
    smile:`<path d="M43 63c4 4 10 4 14 0" stroke="${O}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    grin:`<path d="M42 61h16c0 6-3.5 8.5-8 8.5S42 67 42 61Z" fill="#fff" stroke="${O}" stroke-width="2.4" stroke-linejoin="round"/>`,
    calm:`<path d="M45 64h10" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>`,
  };
  const glasses = [
    '',
    `<g fill="none" stroke="${O}" stroke-width="2.4"><circle cx="42" cy="52" r="6.5"/><circle cx="58" cy="52" r="6.5"/><path d="M48.5 52h3M35.5 51l-4-1M64.5 51l4-1"/></g>`,
    `<g fill="rgba(255,255,255,.15)" stroke="${O}" stroke-width="2.4"><rect x="34" y="47" width="14" height="10" rx="3"/><rect x="52" y="47" width="14" height="10" rx="3"/><path d="M48 51h4" fill="none"/></g>`,
  ][a.glasses];
  const acc = [
    '',
    `<path d="M27 52c0-16 10-26 23-26s23 10 23 26" fill="none" stroke="${O}" stroke-width="4"/><rect x="21" y="48" width="9" height="15" rx="4" fill="var(--k-bad)" stroke="${O}" stroke-width="${sw}"/><rect x="70" y="48" width="9" height="15" rx="4" fill="var(--k-bad)" stroke="${O}" stroke-width="${sw}"/>`,
    `<path d="M28 40c0-12 10-18 22-18s22 6 22 18Z" fill="var(--k-award)" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M50 40h28c0 4-6 5-28 5Z" fill="var(--k-award)" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/>`,
  ][a.acc];
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" fill="${BGS[a.bg]}"/>
    <circle cx="50" cy="46" r="34" fill="#fff" opacity=".28"/>
    ${back}
    ${clothes}
    <path d="M22 104c3-12 12-18 24-20" stroke="#000" stroke-opacity=".08" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M44 70h12v12c-3 3-9 3-12 0Z" fill="${sk}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="M44.5 72c3 2.5 8 2.5 11 0v4c-3 2-8 2-11 0Z" fill="${sh}" opacity=".8"/>
    <ellipse cx="31" cy="53" rx="4.5" ry="6.5" fill="${sk}" stroke="${O}" stroke-width="${sw}"/>
    <ellipse cx="69" cy="53" rx="4.5" ry="6.5" fill="${sk}" stroke="${O}" stroke-width="${sw}"/>
    <path d="M30.5 50.5c1.5.5 2 2.5 1.2 4.5M69.5 50.5c-1.5.5-2 2.5-1.2 4.5" stroke="${sh}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M31 49c0-15 8-23 19-23s19 8 19 23c0 13-8 24-19 24S31 62 31 49Z" fill="${sk}" stroke="${O}" stroke-width="${sw}"/>
    <path d="M60 68c5-4 8-10 8.6-17-1.8 7-5.5 12.5-10.6 15.5Z" fill="${sh}" opacity=".55"/>
    ${front}
    <path d="M${a.hair===2?33:32} 44c2-3 3.5-5 5.5-6.5" stroke="#fff" stroke-opacity=".28" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <ellipse cx="42" cy="52" rx="3.8" ry="4.4" fill="#fff" stroke="${O}" stroke-width="1.5"/><ellipse cx="58" cy="52" rx="3.8" ry="4.4" fill="#fff" stroke="${O}" stroke-width="1.5"/>
    <circle cx="42.6" cy="52.8" r="2.7" fill="${ec}"/><circle cx="58.6" cy="52.8" r="2.7" fill="${ec}"/>
    <circle cx="42.6" cy="52.8" r="1.2" fill="#1B2030"/><circle cx="58.6" cy="52.8" r="1.2" fill="#1B2030"/>
    <circle cx="43.6" cy="51.5" r="1" fill="#fff"/><circle cx="59.6" cy="51.5" r="1" fill="#fff"/>
    <path d="M37 45.3c2.6-2.1 6.2-2.3 8.6-1.1M54.4 44.2c2.6-1.2 6.2-1 8.6 1.1" stroke="${hc==='#E0BC72'?'#8A6A35':O}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M49.6 55c-.3 2-1.2 3.3-2.6 3.9 1 .5 2.4.5 3.4-.1" stroke="${O}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <ellipse cx="37" cy="60" rx="3.6" ry="2.2" fill="#F28B7A" opacity=".35"/><ellipse cx="63" cy="60" rx="3.6" ry="2.2" fill="#F28B7A" opacity=".35"/>
    ${mouths[a.mood]}${glasses}${acc}
  </svg>`;
}

/* ---------- v3: familia de iconos en "baldosa" (habilidades, desafíos, actividades) ----------
   Una sola gramática visual: cuadrado redondeado del color semántico, contorno de tinta fino,
   brillo superior y glifo blanco. Así habilidades, desafíos y progreso hablan el mismo idioma. */
const TILE = (fill, glyph) => `<svg class="ico tile-ico" viewBox="0 0 48 48" aria-hidden="true">
  <rect x="3" y="5" width="42" height="40" rx="12" fill="color-mix(in srgb, ${fill} 70%, #000)"/>
  <rect x="3" y="3" width="42" height="40" rx="12" fill="${fill}" stroke="${O}" stroke-width="2"/>
  <path d="M11 9h22" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
  <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${glyph}</g></svg>`;
const ICO = {
  grammar: TILE('var(--k-brand)', `<path d="M13 32 19.5 14h1L27 32M15.5 26h9"/><path d="M34 24v8M34 24c-2.5-1-5-.4-5 2.2 0 2.6 2.6 3.4 5 2"/>`),
  vocab:   TILE('var(--k-ok)', `<rect x="12" y="13" width="16" height="20" rx="3"/><path d="M32 16h2a2 2 0 0 1 2 2v14a3 3 0 0 1-3 3H21"/><path d="M16 27l4-9 4 9M17.5 24h5"/>`),
  listen:  TILE('var(--k-info)', `<path d="M13 28v-4a11 11 0 0 1 22 0v4"/><rect x="11" y="26" width="6" height="9" rx="2.5" fill="#fff"/><rect x="31" y="26" width="6" height="9" rx="2.5" fill="#fff"/>`),
  speak:   TILE('var(--k-streak)', `<rect x="18" y="11" width="9" height="15" rx="4.5" fill="#fff"/><path d="M14 23a8.5 8.5 0 0 0 17 0M22.5 31.5V35"/><path d="M34 17c1.5 2 1.5 6 0 8"/>`),
  write:   TILE('var(--k-award)', `<path d="M27 12l6 6-12 12h-6v-6l12-12Z"/><path d="M12 35h24"/>`),
  read:    TILE('var(--k-c-marker-600)', `<path d="M24 16c-4-3-8-3.5-12-2.5v18c4-1 8-.5 12 2.5 4-3 8-3.5 12-2.5v-18c-4-1-8-.5-12 2.5Z"/><path d="M24 16v18"/>`),
  lesson:  TILE('var(--k-brand)', `<path d="M14 13h16a4 4 0 0 1 4 4v17H18a4 4 0 0 1-4-4V13Z"/><path d="M14 30a4 4 0 0 1 4-4h16M20 19h8"/>`),
  time:    TILE('var(--k-ok)', `<circle cx="24" cy="24.5" r="10"/><path d="M24 19v6l4 2.5"/>`),
  mend:    TILE('var(--k-mend)', `<path d="M15 25a9 9 0 0 1 15.5-6.2"/><path d="m31.5 13.5-.6 5.8-5.8-.7"/><path d="m18 28 4 4 8-8.5"/>`),
  days:    TILE('var(--k-streak)', `<rect x="12" y="14" width="24" height="20" rx="4"/><path d="M12 20h24M18 11v5M30 11v5"/><path d="m19 27 3 3 6-6"/>`),
  rush:    TILE('var(--k-bad)', `<path d="M26 11 16 26h8l-2 11 10-15h-8l2-11Z" fill="#fff"/>`),
  xp:      TILE('var(--k-c-marker-600)', `<path d="M26 11 16 26h8l-2 11 10-15h-8l2-11Z" fill="#fff"/>`),
  target:  TILE('var(--k-bad)', `<circle cx="24" cy="24" r="10"/><circle cx="24" cy="24" r="4.5"/><path d="M24 24l9-9"/>`),
  level:   TILE('var(--k-award)', `<path d="M15 33V25M22 33V19M29 33V14M36 33H12"/>`),
};

window.K_ART = { ICO, TILE, UI, NAV_ICO, STK, chest, emblem, COURSE_ART, BADGES, medal, ILLUS, landscape, avatarSVG, SKIN, HAIR_C, EYE_C, OUTFIT, BGS };
})();
