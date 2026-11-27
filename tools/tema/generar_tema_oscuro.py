"""Tema oscuro GLOBAL de Inglés con Leo 2.0 (todas las páginas cargan style.css).

Escribe, entre marcadores, un bloque al final de style.css:
  1. Tokens: el sitio ya usa variables (--paper, --ink, --blue...). En oscuro reciben los
     valores 2.0; se añaden los tokens --v2-* para claro y oscuro.
  2. Equivalencias automáticas para colores FIJOS (no variables) de style.css, glosario.css,
     aprender.css, video-guia.css, chatbot.css y de los <style> de cada página .html:
       - fondos claros (blanco, #f..., translúcidos)  -> superficies oscuras 2.0
       - textos muy oscuros (sobre fondos claros)    -> tinta clara
       - bordes claros                               -> línea oscura
     Se decide por luminancia real del color, no por nombres.
  3. Estilos en línea (style="background:#fff") vía selectores de atributo.

Oscuro es el predeterminado: todo se aplica con html:not([data-theme="light"]). Sin JavaScript
el sitio ya se ve oscuro (sin destellos y sin ocultar nada a buscadores).
No cambia contenido, estructura, textos, enlaces ni metadatos.

Uso (desde inglesconLeo):  python tools/tema/generar_tema_oscuro.py
"""
import os, re, glob

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = 'html:not([data-theme="light"])'
CSS = ['style.css', 'glosario/glosario.css', 'aprender.css', 'video-guia.css', 'chatbot.css']
INI, FIN = '/* ===== TEMA 2.0 (generado por tools/tema/generar_tema_oscuro.py, no editar a mano) ===== */', '/* ===== FIN TEMA 2.0 ===== */'

TOKENS = """
:root{
  --v2-bg:var(--paper); --v2-surface:#FFFFFF; --v2-surface-2:#F3EEE4; --v2-surface-3:#E9E2D4;
  --v2-text:var(--ink); --v2-text-2:var(--ink-soft); --v2-text-3:#7A8090;
  --v2-line:#ECE5D8; --v2-line-strong:#DCD2C0;
  --v2-brand:var(--blue); --v2-brand-lip:#172B9E; --v2-brand-tint:var(--blue-tint); --v2-brand-text:#1F37C9;
  --v2-xp:#FFC23A; --v2-xp-lip:#E29A00; --v2-xp-tint:#FFF3D1; --v2-xp-text:#8A5A00;
  --v2-streak:#FF7A1A; --v2-streak-tint:#FFE9D8; --v2-streak-text:#B04A00;
  --v2-ok:#14B26A; --v2-ok-lip:#0C8A50; --v2-ok-tint:#E1F7EC; --v2-ok-text:#0A7444;
  --v2-bad:#EE4B3A; --v2-bad-lip:#BF3324; --v2-bad-tint:#FDE7E3; --v2-bad-text:#AE2C1E;
  --v2-mend:#0EA396; --v2-mend-lip:#0A7C72; --v2-mend-tint:#DCF4F1; --v2-mend-text:#07695F;
  --v2-award:#7656F5; --v2-award-tint:#EEE9FF; --v2-award-text:#4C2FC0;
  --v2-card-shadow:0 1px 2px rgba(27,32,48,.05),0 6px 20px -10px rgba(27,32,48,.16);
  --v2-lip:4px; --v2-ease:cubic-bezier(.2,.8,.2,1);
  --v2-font-display:'Baloo 2 V2','Baloo 2','Baloo Fallback',system-ui,sans-serif;
  --v2-font-body:'Nunito',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
}
%(P)s{
  --paper:#0B0F1A; --paper-dim:#141A29;
  --ink:#EEF0F7; --ink-soft:#AAB1C4; --ink-faint:#9199AE;
  --blue:#5B74FF; --blue-deep:#4D66FF; --blue-tint:#1D2550;
  --amber:#FFC94A; --amber-tint:#3A2F12;
  --coral:#FF6655; --coral-tint:#3A1A17;
  --green:#25C27C; --green-tint:#10301F;
  --violet:#8E74FF; --violet-deep:#BFB0FF; --violet-tint:#251E47;
  --teal:#1FBFB2; --teal-deep:#59E0D5; --teal-tint:#0F2F2E;
  --gold:#FFD772; --gold-deep:#FFD772; --gold-tint:#3A2F12;
  --line:#222A3F;
  --shadow:0 1px 0 rgba(255,255,255,.03) inset,0 10px 30px -14px rgba(0,0,0,.8);
  --v2-surface:#141A29; --v2-surface-2:#1A2134; --v2-surface-3:#242D45;
  --v2-text-3:#737B92; --v2-line:#222A3F; --v2-line-strong:#323C58;
  --v2-brand-lip:#2638B8; --v2-brand-text:#9AABFF;
  --v2-xp:#FFC94A; --v2-xp-lip:#C98A00; --v2-xp-tint:#3A2F12; --v2-xp-text:#FFD772;
  --v2-streak:#FF8A33; --v2-streak-tint:#3A2414; --v2-streak-text:#FFAE70;
  --v2-ok:#25C27C; --v2-ok-lip:#118551; --v2-ok-tint:#10301F; --v2-ok-text:#5BE3A5;
  --v2-bad:#FF6655; --v2-bad-lip:#B23426; --v2-bad-tint:#3A1A17; --v2-bad-text:#FF9A8E;
  --v2-mend:#1FBFB2; --v2-mend-lip:#0A7F76; --v2-mend-tint:#0F2F2E; --v2-mend-text:#59E0D5;
  --v2-award:#8E74FF; --v2-award-tint:#251E47; --v2-award-text:#BFB0FF;
  --v2-card-shadow:0 1px 0 rgba(255,255,255,.03) inset,0 10px 30px -14px rgba(0,0,0,.8);
  color-scheme:dark;
}
/* Selector de tema en la cabecera pública (tema.js) */
.tema-wrap{position:relative;display:flex;align-items:center;margin-left:auto;margin-right:8px}
.tema-btn{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;border:1px solid var(--line);background:transparent;color:var(--ink-soft);cursor:pointer;padding:0}
.tema-btn:hover{color:var(--ink);border-color:var(--ink-faint)}
.tema-pop{position:absolute;right:0;top:48px;z-index:80;min-width:160px;padding:6px;border-radius:14px;background:var(--v2-surface);border:1px solid var(--v2-line-strong);box-shadow:0 18px 40px -12px rgba(0,0,0,.45)}
.tema-pop button{display:block;width:100%%;text-align:left;padding:10px 12px;border:0;background:none;border-radius:10px;font:inherit;font-weight:700;color:var(--ink);cursor:pointer}
.tema-pop button:hover{background:var(--v2-surface-2)}
.tema-pop button[aria-checked="true"]{background:var(--blue-tint);color:var(--blue)}
%(P)s img.logo-mark{filter:none}
%(P)s ::placeholder{color:#737B92}
%(P)s input:not([type=checkbox]):not([type=radio]):not([type=range]),%(P)s select,%(P)s textarea{background-color:var(--v2-surface-2);color:var(--ink);border-color:var(--v2-line-strong)}
%(P)s [style*="background:#fff"],%(P)s [style*="background: #fff"],%(P)s [style*="background:white"],%(P)s [style*="background-color:#fff"]{background-color:var(--v2-surface)!important}
%(P)s [style*="color:#1"],%(P)s [style*="color: #1"],%(P)s [style*="color:#2"],%(P)s [style*="color:#3"]{color:var(--ink)!important}
""" % {'P': P}

HEX = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')
RGBA = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)')
WHITE = re.compile(r'(?<![-\w])white\b', re.I)

def lum(r, g, b):
    f = lambda c: (c / 255) / 12.92 if c / 255 <= .03928 else (((c / 255) + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)

def colors(v):
    out = []
    for m in HEX.finditer(v):
        h = m.group(1); h = ''.join(c * 2 for c in h) if len(h) == 3 else h
        out.append((lum(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)), 1.0))
    for m in RGBA.finditer(v):
        out.append((lum(int(m.group(1)), int(m.group(2)), int(m.group(3))), float(m.group(4)) if m.group(4) else 1.0))
    if WHITE.search(v): out.append((1.0, 1.0))
    return out

def reglas(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, pila, buf = [], [], ''
    for c in css:
        if c == '{': pila.append(buf.strip()); buf = ''
        elif c == '}':
            if pila:
                sel = pila.pop()
                en_print = any(x.startswith('@media') and 'print' in x for x in pila)
                if not sel.startswith('@') and buf.strip() and not en_print: out.append((sel, buf))
            buf = ''
        else: buf += c
    return out

def decls(body):
    for d in body.split(';'):
        if ':' in d:
            k, v = d.split(':', 1); yield k.strip().lower(), v.strip()

def prefijo(sel, de_pagina=False):
    res = []
    for p in [x.strip() for x in sel.split(',') if x.strip()]:
        # Un <style> de una pagina no debe volverse global: solo se aceptan selectores con clase o id.
        if de_pagina and not re.search(r'[.#]', p): continue
        if re.match(r'^(from|to|\d+%)$', p): return None
        if p in (':root', 'html', 'body', '*'): continue
        if 'data-theme' in p or p.startswith('html.v2') or '.k-' in p or p.startswith('.v2-'): continue
        res.append(P + ' ' + p)
    return ',\n'.join(res) if res else None

def analizar(css, de_pagina=False):
    grupos = {}
    def add(k, sel): grupos.setdefault(k, []).append(sel)
    for sel, body in reglas(css):
        p = prefijo(sel, de_pagina)
        if not p: continue
        ds = dict(decls(body))
        bgv = ' '.join(v for k, v in ds.items() if k in ('background', 'background-color', 'background-image'))
        bgc = colors(bgv) if bgv else []
        light_bg = bool(bgc) and all(l > .80 for l, a in bgc if a >= .5) and any(l > .80 for l, a in bgc)
        transl = bool(bgc) and all(l > .80 and a < .5 for l, a in bgc)
        dark_bg = any(l < .35 and a >= .5 for l, a in bgc)
        if light_bg:
            pure = all(l > .97 for l, a in bgc)
            add('bg_surface' if pure else 'bg_surface2', p)
        elif transl:
            add('bg_transl', p)
        col = ds.get('color')
        if col and 'var(' not in col:
            cc = colors(col)
            if cc and all(l < .12 for l, a in cc) and not (bgc and not light_bg and not transl):
                add('txt', p)
        for k, v in ds.items():
            if (k.startswith('border') or k == 'outline') and 'var(' not in v:
                cc = colors(v)
                if cc and all(l > .70 for l, a in cc):
                    add('borde', p); break
    return grupos

REGLA = {
    'bg_surface': '{background-color:var(--v2-surface)!important;background-image:none!important}',
    'bg_surface2': '{background-color:var(--v2-surface-2)!important;background-image:none!important}',
    'bg_transl': '{background-color:color-mix(in srgb,var(--paper) 88%,transparent)!important}',
    'txt': '{color:var(--ink)!important}',
    'borde': '{border-color:var(--v2-line)!important}',
}

AJUSTES = '''/* ---- ajustes puntuales de contraste (revisados a mano) ---- */
%(P)s .libro-demo .no{color:var(--v2-bad-text)!important}
%(P)s .libro-demo .si{color:var(--v2-ok-text)!important}
%(P)s .libro-final{background:#2A3DB8!important}
%(P)s .libro-final small{color:#DDE3FF!important}
%(P)s .cp-btn-wa{background:#138A50!important}
/* cabecera: con el selector de tema hay un boton mas; se compacta un poco para que el logo no toque el menu */
.nav .logo{margin-right:18px}
.wrap.nav{padding-left:20px;padding-right:20px}
@media(min-width:1100px) and (max-width:1279px){html.ac-live .nav-links{gap:11px;font-size:.86rem}.nav .logo{margin-right:10px}}
@media(min-width:1280px) and (max-width:1399px){html.ac-live .nav-links{gap:14px;font-size:.9rem}}
@media(min-width:1400px) and (max-width:1599px){html.ac-live .nav-links{gap:20px}}
.tema-wrap{padding-left:12px}
@media(min-width:900px) and (max-width:1099px){.nav-links{gap:12px!important;font-size:.86rem!important}}
''' % {'P': 'html:not([data-theme="light"])'}

FUENTES = """/* Tipografia 2.0 (la misma de la academia, servida desde v2/fonts). Solo se descarga donde se usa. */
@font-face{font-family:'Nunito';font-style:normal;font-weight:600;font-display:swap;src:url(v2/fonts/nunito-latin-600-normal.woff2) format('woff2')}
@font-face{font-family:'Nunito';font-style:normal;font-weight:700;font-display:swap;src:url(v2/fonts/nunito-latin-700-normal.woff2) format('woff2')}
@font-face{font-family:'Nunito';font-style:normal;font-weight:800;font-display:swap;src:url(v2/fonts/nunito-latin-800-normal.woff2) format('woff2')}
@font-face{font-family:'Nunito';font-style:normal;font-weight:900;font-display:swap;src:url(v2/fonts/nunito-latin-900-normal.woff2) format('woff2')}
@font-face{font-family:'Baloo 2 V2';font-style:normal;font-weight:700;font-display:swap;src:url(v2/fonts/baloo-2-latin-700-normal.woff2) format('woff2')}
@font-face{font-family:'Baloo 2 V2';font-style:normal;font-weight:800;font-display:swap;src:url(v2/fonts/baloo-2-latin-800-normal.woff2) format('woff2')}
"""

def practica_v2():
    """Ejercicios de Practicar gratis con la misma presentacion que los de miembros:
    se copian de v2/v2-lecciones.css las reglas del motor de ejercicios (.option, .feedback, fichas...)
    cambiando 'html.v2 ' por '#practicaMain '. Asi ambas quedan siempre iguales."""
    css = re.sub(r'/\*.*?\*/', '', open(os.path.join(RAIZ, 'v2', 'v2-lecciones.css'), encoding='utf-8').read(), flags=re.S)
    bloques, prof, ini = [], 0, 0
    for j, ch in enumerate(css):
        if ch == '{': prof += 1
        elif ch == '}':
            prof -= 1
            if prof == 0: bloques.append(css[ini:j + 1].strip()); ini = j + 1
    motor = r'\.(option|feedback|word-chip|error-word|session-progress|session-card|practice-prompt|next-row|blank-slot)\b'
    def filtra(sel): return [x.strip() for x in sel.split(',') if x.strip().startswith('html.v2 ') and re.search(motor, x)]
    out = []
    for b in bloques:
        cab = b.split('{', 1)[0]
        if cab.startswith('@keyframes'): out.append(b); continue
        if cab.startswith('@media'):
            dentro = [(','.join(filtra(sel)), cuerpo) for sel, cuerpo in re.findall(r'([^{}]+)\{([^{}]*)\}', b[b.index('{') + 1:-1]) if filtra(sel)]
            if dentro: out.append(cab + '{' + ''.join(x + '{' + c + '}' for x, c in dentro) + '}')
            continue
        f = filtra(cab)
        if f: out.append(','.join(f) + '{' + b.split('{', 1)[1])
    extra = """#practicaMain,.hm{font-family:var(--v2-font-body)}
#practicaMain h1,#practicaMain h2,#practicaMain h3,.hm h1,.hm h2,.hm h3{font-family:var(--v2-font-display);font-weight:800}
#practicaMain .level-card{border:2px solid var(--v2-line-strong);box-shadow:0 4px 0 var(--v2-line-strong)}
#practicaMain .level-card[aria-pressed="true"]{border-color:var(--tone);box-shadow:0 4px 0 var(--tone)}
#practicaMain .level-card:active{transform:translateY(4px);box-shadow:none}
#practicaMain .skill-tab-btn{border-radius:14px;border:2px solid var(--v2-line-strong);box-shadow:0 3px 0 var(--v2-line-strong);font-weight:800;margin-bottom:3px}
#practicaMain .skill-tab-btn.active,#practicaMain .skill-tab-btn[aria-selected="true"]{border-color:var(--v2-brand);box-shadow:0 3px 0 var(--v2-brand)}
#practicaMain .btn-primary{border-radius:16px;box-shadow:0 4px 0 var(--v2-brand-lip);font-weight:800}
#practicaMain .btn-primary:active{transform:translateY(4px);box-shadow:none}
#practicaMain .skill-section{border-radius:22px}"""
    return '/* ---- Practicar gratis 2.0 (copiado de v2/v2-lecciones.css) ---- */\n' + '\n'.join(out).replace('html.v2 ', '#practicaMain ') + '\n' + extra

def main():
    total, partes = 0, [INI, TOKENS, FUENTES, practica_v2()]
    fuentes = [(f, open(os.path.join(RAIZ, f), encoding='utf-8').read()) for f in CSS if os.path.isfile(os.path.join(RAIZ, f))]
    for h in sorted(glob.glob(os.path.join(RAIZ, '*.html'))):
        s = open(h, encoding='utf-8', errors='replace').read()
        bloques = re.findall(r'<style[^>]*>(.*?)</style>', s, re.S)
        if bloques: fuentes.append((os.path.basename(h), '\n'.join(bloques)))
    for nombre, css in fuentes:
        if nombre == 'style.css' and INI in css: css = css.split(INI)[0]
        g = analizar(css, nombre.endswith('.html'))
        if not g: continue
        partes.append('/* ---- %s ---- */' % nombre)
        for k in ('bg_surface', 'bg_surface2', 'bg_transl', 'txt', 'borde'):
            if g.get(k):
                partes.append(',\n'.join(g[k]) + REGLA[k]); total += len(g[k])
    partes.append(AJUSTES)
    partes.append(FIN)
    ruta = os.path.join(RAIZ, 'style.css')
    s = open(ruta, encoding='utf-8').read()
    if INI in s: s = s.split(INI)[0].rstrip() + '\n'
    open(ruta, 'w', encoding='utf-8', newline='').write(s + '\n' + '\n'.join(partes) + '\n')
    print('Tema oscuro global: %d reglas de equivalencia en style.css' % total)

if __name__ == '__main__':
    main()
