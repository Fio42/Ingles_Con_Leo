# Riso: genera las animaciones de los 4 estados a partir de las ilustraciones originales (sin redibujar al personaje).
# Capas por máscara: llamas (ondulan), cuerpo (respira), párpados (parpadeo), brazo (saludo), mano (pulgar).
import numpy as np, json, os, math
from PIL import Image
from scipy import ndimage

FPS = 24
OUT = '/home/claude/riso/out'
os.makedirs(OUT, exist_ok=True)

def cargar(n):
    a = np.array(Image.open(f'/home/claude/riso/limpio_{n}.png').convert('RGBA')).astype(np.float32) / 255
    a[..., :3] *= a[..., 3:4]            # premultiplicado: sin halos al deformar
    return a

def lienzo(a, W=380, H=460):
    h, w = a.shape[:2]
    c = np.zeros((H, W, 4), np.float32)
    x0 = (W - w) // 2; y0 = H - h - 6
    c[y0:y0 + h, x0:x0 + w] = a
    return c

def hsv_mask(a):
    rgb = np.where(a[..., 3:4] > 1e-3, a[..., :3] / np.maximum(a[..., 3:4], 1e-3), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(2); mn = rgb.min(2); sat = (mx - mn) / (mx + 1e-6)
    calido = (r > 0.55) & (r >= g) & (g >= b - 0.05) & (sat > 0.45) & (a[..., 3] > 0.3)
    return calido, rgb

def mascara_llamas(a, extra_lados=True):
    H, W = a.shape[:2]
    calido, rgb = hsv_mask(a)
    ys, xs = np.where(a[..., 3] > 0.3); top, bot = ys.min(), ys.max(); hh = bot - top
    left, right = xs.min(), xs.max(); ww = right - left
    yy, xx = np.mgrid[0:H, 0:W]
    rel = (yy - top) / hh
    m = np.clip((0.33 - rel) / 0.16, 0, 1)                 # fuerte arriba, se apaga antes de las cejas
    if extra_lados:
        relx = (xx - left) / ww
        lado = np.clip((0.16 - relx) / 0.1, 0, 1) * np.clip((0.58 - rel) / 0.12, 0, 1)
        m = np.maximum(m, lado * 0.8)
    m = m * calido
    m = ndimage.gaussian_filter(m.astype(np.float32), 2.2)
    return m

def warp(a, dx, dy):
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    out = np.empty_like(a)
    for c in range(4):
        out[..., c] = ndimage.map_coordinates(a[..., c], [yy - dy, xx - dx], order=1, mode='constant')
    return out

def ruido_llamas(H, W, t, amp, sem=0):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    w1, w2 = 2 * math.pi * 1.6, 2 * math.pi * 2.3
    dx = amp * (0.6 * np.sin(yy / 23.0 + w1 * t + sem) + 0.4 * np.sin(yy / 11.0 - xx / 31.0 + w2 * t + 1.7 + sem))
    dy = amp * 0.55 * (np.sin(xx / 27.0 + w1 * t * 1.1 + 0.6 + sem) + 0.5 * np.sin((xx + yy) / 15.0 + w2 * t))
    return dx, dy

def escala(a, sx, sy, cx, cy, ang=0.0):
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    c, s = math.cos(-ang), math.sin(-ang)
    x = xx - cx; y = yy - cy
    xr = (c * x - s * y) / sx + cx; yr = (s * x + c * y) / sy + cy
    out = np.empty_like(a)
    for k in range(4): out[..., k] = ndimage.map_coordinates(a[..., k], [yr, xr], order=1, mode='constant')
    return out

def ojos(a):
    """Cajas de los ojos: zonas muy oscuras en la franja de la cara."""
    _, rgb = hsv_mask(a)
    H, W = a.shape[:2]
    ys, xs = np.where(a[..., 3] > 0.3); top, bot = ys.min(), ys.max(); hh = bot - top
    yy, xx = np.mgrid[0:H, 0:W]
    banda = ((yy - top) / hh > 0.28) & ((yy - top) / hh < 0.55)
    left, right = xs.min(), xs.max(); ww = right - left
    centro = ((xx - left) / ww > 0.22) & ((xx - left) / ww < 0.86)
    osc = (rgb.max(2) < 0.40) & (rgb[..., 0] > rgb[..., 2] + 0.04) & (rgb[..., 0] >= rgb[..., 1]) & banda & centro & (a[..., 3] > 0.8)
    lab, n = ndimage.label(osc)
    if n < 2: return []
    sizes = ndimage.sum(osc, lab, range(1, n + 1)); idx = np.argsort(sizes)[::-1][:2] + 1
    cajas = []
    for i in idx:
        sl = ndimage.find_objects(lab)[i - 1]
        cajas.append((sl[0].start, sl[0].stop, sl[1].start, sl[1].stop))
    return cajas

def parpado(a, cajas, p):
    """p: 0 abierto, 1 cerrado. El párpado se rellena con la piel de alrededor (interpolada por filas, respeta el degradado)
    y el ojo cerrado se dibuja como una curva suave, como en las poses originales."""
    if p <= 0: return a
    b = a.copy(); H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    for (y0, y1, x0, x1) in cajas:
        cy = (y0 + y1) / 2; cx = (x0 + x1) / 2; ry = (y1 - y0) / 2 + 6; rx = (x1 - x0) / 2 + 5
        d = ((yy - cy) / ry) ** 2 + ((xx - cx) / rx) ** 2
        borde = cy - ry + 2 * ry * p
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            if y < 0 or y >= H or y > borde: continue
            fila = d[y] <= 1.0
            if not fila.any(): continue
            xsr = np.where(fila)[0]; xl, xr = max(0, xsr.min() - 3), min(W - 1, xsr.max() + 3)
            cl, cr = a[y, xl].copy(), a[y, xr].copy()
            t = (np.arange(xl, xr + 1) - xl) / max(1, xr - xl)
            fill = cl[None, :] * (1 - t[:, None]) + cr[None, :] * t[:, None]
            k = np.clip((1.0 - d[y, xl:xr + 1]) * 6, 0, 1)[:, None]
            b[y, xl:xr + 1] = b[y, xl:xr + 1] * (1 - k) + fill * k
        if p > 0.6:
            # curva del ojo cerrado (hacia abajo, suave)
            xs = np.linspace(cx - rx * 0.78, cx + rx * 0.78, 160)
            ys = cy + 0.10 * ry + 0.28 * ry * (1 - ((xs - cx) / (rx * 0.78)) ** 2)
            grosor = max(2.2, ry * 0.11)
            for (xc, yc) in zip(xs, ys):
                dd = np.sqrt((xx - xc) ** 2 + (yy - yc) ** 2)
                k = np.clip(grosor - dd, 0, 1)[..., None] * min(1, (p - 0.6) / 0.4)
                b = b * (1 - k) + np.array([0.30, 0.15, 0.06, 1.0]) * k
    return b

def guardar(nombre, frames, extra=None):
    ims = []
    for f in frames:
        f = f.copy(); al = np.clip(f[..., 3:4], 1e-6, 1)
        f[..., :3] = np.where(f[..., 3:4] > 1e-4, f[..., :3] / al, 0)
        ims.append(Image.fromarray((np.clip(f, 0, 1) * 255).astype(np.uint8), 'RGBA'))
    ims[0].save(f'{OUT}/riso-{nombre}.webp', save_all=True, append_images=ims[1:], duration=round(1000 / FPS), loop=0, quality=82, method=6, lossless=False)
    ims[0].save(f'{OUT}/riso-{nombre}-quieto.webp', quality=90, method=6)
    ims[0].save(f'{OUT}/riso-{nombre}.png')
    print(nombre, len(ims), os.path.getsize(f'{OUT}/riso-{nombre}.webp') // 1024, 'KB')

def base_loop(n, dur, amp=3.2, respira=0.010, parpadeo_en=None, extra=None, sway=0.0):
    a = lienzo(cargar(n)); H, W = a.shape[:2]
    m = mascara_llamas(a); caj = ojos(a) if parpadeo_en is not None else []
    ys, xs = np.where(a[..., 3] > 0.3); cx = (xs.min() + xs.max()) / 2; cy = ys.max()
    frames = []; N = int(dur * FPS)
    for i in range(N):
        t = i / FPS; ph = 2 * math.pi * t / dur
        dx, dy = ruido_llamas(H, W, t * (2.0 / dur) * (dur / 2.0), amp)
        f = warp(a, dx * m, dy * m)
        if extra: f = extra(f, t, ph)
        if parpadeo_en is not None:
            k = (t - parpadeo_en) * FPS
            p = {0: 0.45, 1: 1.0, 2: 1.0, 3: 0.5}.get(int(round(k)), 0) if -0.5 < k < 3.5 else 0
            f = parpado(f, caj, p)
        s = math.sin(ph)
        f = escala(f, 1 - respira * 0.5 * s, 1 + respira * s, cx, cy, sway * math.sin(ph))
        frames.append(f)
    return frames

def brazo(n, region, pivote, ang_fn, dur, amp=3.0, parpadeo_en=None):
    a = lienzo(cargar(n)); H, W = a.shape[:2]
    ys, xs = np.where(a[..., 3] > 0.3); top, bot, left, right = ys.min(), ys.max(), xs.min(), xs.max(); hh, ww = bot - top, right - left
    yy, xx = np.mgrid[0:H, 0:W]
    calido, _ = hsv_mask(a)
    rx0, rx1, ry0, ry1 = region
    zona = ((xx - left) / ww > rx0) & ((xx - left) / ww < rx1) & ((yy - top) / hh > ry0) & ((yy - top) / hh < ry1) & calido
    zona = ndimage.binary_closing(zona, iterations=2)
    lab, nn = ndimage.label(zona)
    if nn: zona = lab == (np.argmax(ndimage.sum(zona, lab, range(1, nn + 1))) + 1)
    soft = ndimage.gaussian_filter(zona.astype(np.float32), 1.0)[..., None]
    capa = a * soft; cuerpo = a * (1 - soft)
    px, py = left + pivote[0] * ww, top + pivote[1] * hh
    m = mascara_llamas(a); caj = ojos(a) if parpadeo_en is not None else []
    frames = []; N = int(dur * FPS)
    for i in range(N):
        t = i / FPS
        ang = ang_fn(t)
        cap = escala(capa, 1, 1, px, py, ang)
        f = cuerpo * (1 - cap[..., 3:4]) + cap
        dx, dy = ruido_llamas(H, W, t, amp)
        f = warp(f, dx * m, dy * m)
        if parpadeo_en is not None:
            k = (t - parpadeo_en) * FPS
            p = {0: 0.45, 1: 1.0, 2: 1.0, 3: 0.5}.get(int(round(k)), 0) if -0.5 < k < 3.5 else 0
            f = parpado(f, caj, p)
        s = math.sin(2 * math.pi * t / dur)
        f = escala(f, 1 - 0.004 * s, 1 + 0.008 * s, (left + right) / 2, bot)
        frames.append(f)
    return frames

if __name__ == '__main__':
    import sys
    cual = sys.argv[1:] or ['neutro', 'saludo', 'celebracion', 'pensando']
    if 'neutro' in cual: guardar('neutro', base_loop('neutro', 3.0, amp=3.0, respira=0.010, parpadeo_en=2.1))
    if 'saludo' in cual:
        def ang(t):  # dos saludos y pausa (loop de 2,5 s)
            if t < 1.4: return math.radians(9) * math.sin(2 * math.pi * t / 0.7)
            return 0.0
        guardar('saludo', brazo('saludo', (0.70, 1.05, 0.33, 0.78), (0.80, 0.70), ang, 2.5, parpadeo_en=1.9))
    if 'celebracion' in cual:
        def ang2(t):  # el pulgar "empuja" una vez por ciclo
            k = (t % 2.0)
            return -math.radians(7) * math.sin(math.pi * min(1, k / 0.45)) if k < 0.45 else 0.0
        guardar('celebracion', brazo('guino', (0.72, 1.05, 0.38, 0.82), (0.84, 0.74), ang2, 2.0))
    if 'pensando' in cual: guardar('pensando', base_loop('pensando', 3.0, amp=2.6, respira=0.006, parpadeo_en=1.4, sway=math.radians(1.3)))
