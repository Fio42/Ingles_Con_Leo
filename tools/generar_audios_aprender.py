"""Genera los audios del Modo aprender con Kokoro TTS (local, gratis, sin internet).

Lee las lecciones de aprender-data.js (la misma fuente que usa la pagina), asi que no hay CSV que mantener.
Es independiente de generar_audios.py (Edge TTS) y de generar_audios_kokoro.py: no toca esos audios.

Que genera (carpeta audio/aprender/):
  <leccion>/exp-01.mp3 ... exp-04.mp3   explicacion en español de cada pantalla
  <leccion>/ej-NN.mp3                   cada ejemplo en inglés (los que ya tienen mp3 en audio/articulos/ se reutilizan)
  fin.mp3                               "¡Muy bien! Ahora puedes practicar lo que aprendiste."

Idiomas: las explicaciones mezclan español e inglés. Cada trozo se lee con su propia voz y su propio idioma
(español: ef_dora, ingles: af_heart), para que palabras como "does" no suenen con acento español.
Los ejemplos van con af_heart (la misma voz de los audios de contracciones).

Uso (desde la carpeta inglesconLeo):
    python tools/generar_audios_aprender.py            # solo crea los que faltan
    python tools/generar_audios_aprender.py --force    # regenera todos (por ejemplo, tras cambiar un texto)
Requiere: pip install kokoro-onnx lameenc  y los modelos en tools/.kokoro-models (o la variable KOKORO_DIR):
    kokoro-v1.0.onnx y voices-v1.0.bin, de github.com/thewh1teagle/kokoro-onnx (release model-files-v1.0).
Necesita Node.js para leer aprender-data.js.
"""
import json, os, re, subprocess, sys
import numpy as np
import lameenc
from kokoro_onnx import Kokoro

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.environ.get("APRENDER_RAIZ") or os.path.dirname(AQUI)
MODELOS = os.environ.get("KOKORO_DIR") or os.path.join(AQUI, ".kokoro-models")
VOZ_ES, VOZ_EN = "ef_dora", "af_heart"
VEL_ES, VEL_EN_EXPLICACION, VEL_EJEMPLO = 0.95, 0.9, 0.92
PAUSA_PARTES = 0.08
RMS_OBJETIVO = 0.07


def a_mp3(samples, sr):
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(96)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm.tobytes()) + enc.flush()


def leer_lecciones():
    js = ("const D=require(%s);const out=D.APRENDER_LESSONS.map(l=>({id:l.id,"
          "exp:l.screens.map((s,i)=>({path:D.aprenderExplainAudio(l.id,i),say:s.say})),"
          "items:[].concat(...D.aprenderResolveItems(l)).map(it=>({path:it.audio,en:it.en,existing:it.existing}))}));"
          "console.log(JSON.stringify(out));") % json.dumps(os.path.join(RAIZ, "aprender-data.js"))
    return json.loads(subprocess.check_output(["node", "-e", js], text=True, encoding="utf-8"))


def partes(say):
    """'Con {{I}} usamos {{am}}.' -> [('es','Con '),('en','I'),('es',' usamos '),('en','am'),('es','.')]"""
    out, pos = [], 0
    for m in re.finditer(r"\{\{(.+?)\}\}", say):
        if m.start() > pos:
            out.append(("es", say[pos:m.start()]))
        out.append(("en", m.group(1)))
        pos = m.end()
    if pos < len(say):
        out.append(("es", say[pos:]))
    return [(l, t) for l, t in out if re.search(r"\w", t)]


def normalizar(x):
    rms = float(np.sqrt(np.mean(np.square(x)))) or 1.0
    return x * (RMS_OBJETIVO / rms)


def main():
    force = "--force" in sys.argv[1:]
    k = Kokoro(os.path.join(MODELOS, "kokoro-v1.0.onnx"), os.path.join(MODELOS, "voices-v1.0.bin"))
    trabajos = []   # (ruta, funcion que devuelve (samples, sr))
    for l in leer_lecciones():
        for e in l["exp"]:
            trabajos.append((e["path"], ("explicacion", e["say"])))
        for it in l["items"]:
            if not it["existing"]:
                trabajos.append((it["path"], ("ejemplo", it["en"])))
    trabajos.append(("audio/aprender/fin.mp3", ("explicacion", "¡Muy bien! Ahora puedes practicar lo que aprendiste.")))
    hechos = saltados = 0
    for ruta, (tipo, texto) in trabajos:
        destino = os.path.join(RAIZ, ruta)
        if os.path.exists(destino) and not force:
            saltados += 1
            continue
        sr, trozos = 24000, []
        if tipo == "ejemplo":
            s, sr = k.create(texto, voice=VOZ_EN, speed=VEL_EJEMPLO, lang="en-us")
            trozos.append(s)
        else:
            for i, (idioma, t) in enumerate(partes(texto)):
                if idioma == "es":
                    s, sr = k.create(t.strip(), voice=VOZ_ES, speed=VEL_ES, lang="es")
                else:
                    s, sr = k.create(t.strip(), voice=VOZ_EN, speed=VEL_EN_EXPLICACION, lang="en-us")
                if i:
                    trozos.append(np.zeros(int(sr * PAUSA_PARTES), dtype=np.float32))
                trozos.append(normalizar(s))
        audio = np.concatenate(trozos + [np.zeros(int(sr * 0.15), dtype=np.float32)])
        pico = float(np.max(np.abs(audio))) or 1.0
        if pico > 0.92:
            audio = audio * (0.92 / pico)
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, "wb") as f:
            f.write(a_mp3(audio, sr))
        hechos += 1
        print("[OK] %s  %.1fs" % (ruta, len(audio) / sr))
    print("Listo: %d creados, %d ya existian." % (hechos, saltados))


if __name__ == "__main__":
    main()
