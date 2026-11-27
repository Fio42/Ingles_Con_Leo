# Riso por capas: a partir de las ilustraciones originales exporta capas reutilizables (sin redibujar).
import numpy as np, json, os, math
from PIL import Image
from scipy import ndimage
import animar as A
OUT='/home/claude/riso/capas'; os.makedirs(OUT, exist_ok=True)
def guardar(arr, nombre, q=88):
    f=arr.copy(); al=np.clip(f[...,3:4],1e-6,1); f[...,:3]=np.where(f[...,3:4]>1e-4,f[...,:3]/al,0)
    im=Image.fromarray((np.clip(f,0,1)*255).astype(np.uint8),'RGBA')
    im.save(f'{OUT}/{nombre}.webp',quality=q,method=6); im.save(f'{OUT}/{nombre}.png'); return im.size
info={}
W,H=380,460
for pose in ['neutro','saludo','guino','pensando']:
    a=A.lienzo(A.cargar(pose),W,H)
    ys,xs=np.where(a[...,3]>0.3); top,bot,left,right=ys.min(),ys.max(),xs.min(),xs.max()
    d={'w':W,'h':H,'caja':[int(left),int(top),int(right),int(bot)]}
    # mascara de llamas (escala de grises) para el filtro de desplazamiento
    m=A.mascara_llamas(a); Image.fromarray((np.clip(m,0,1)*255).astype(np.uint8),'L').save(f'{OUT}/{pose}-mascara-llamas.png')
    if pose=='saludo' or pose=='guino':
        # Brazo/mano: polígono trazado a mano sobre la ilustración (no toca la cara ni los audífonos)
        from PIL import ImageDraw
        poli = [(296,226),(366,230),(366,302),(332,320),(302,332),(276,322),(274,302),(290,286),(296,262)] if pose=='saludo' else \
               [(306,238),(358,246),(358,338),(330,350),(296,354),(280,340),(286,300),(304,288)]
        piv = (285,318) if pose=='saludo' else (300,332)
        mk = Image.new('L',(W,H),0); ImageDraw.Draw(mk).polygon(poli,fill=255)
        zona = (np.array(mk)>0) & (a[...,3]>0.02)
        soft = ndimage.gaussian_filter(zona.astype(np.float32),0.7)[...,None]
        guardar(a*(1-soft),f'{pose}-cuerpo'); guardar(a*soft,f'{pose}-mano')
        d['pivote']=[piv[0],piv[1]]
    guardar(a,pose)
    if pose in ('neutro','saludo','pensando'):
        caj=A.ojos(a)
        if len(caj)==2:
            cerr=A.parpado(a,caj,1.0); dif=np.abs(cerr-a).sum(2)>0.02
            lid=cerr*dif[...,None]; guardar(lid,f'{pose}-parpados',q=92)
            d['ojos']=[[int(v) for v in c] for c in caj]
    info[pose]=d
json.dump(info,open(f'{OUT}/riso-capas.json','w'),indent=1); print(json.dumps(info))
