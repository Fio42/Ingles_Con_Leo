"""Genera audios cortos con Kokoro TTS (local, gratis, sin internet).

Lee tools/lista_audios_kokoro.csv (archivo,texto,voz). Es independiente de
generar_audios.py (Edge TTS) y de lista_audios.csv: no toca esos audios.

Uso:
    python generar_audios_kokoro.py                      # solo crea los que faltan
    python generar_audios_kokoro.py audio/articulos/contracciones-ingles/
    python generar_audios_kokoro.py --force <ruta o carpeta>   # regenera

En la columna texto, el simbolo | separa partes con una pausa de 0,35 s
(se usa en verbos irregulares: base|pasado|participio).
Modelos: carpeta tools/.kokoro-models o la ruta de la variable KOKORO_DIR
(kokoro-v1.0.onnx y voices-v1.0.bin, de github.com/thewh1teagle/kokoro-onnx).
Requiere: pip install kokoro-onnx lameenc
"""
import csv, os, sys
import numpy as np
import lameenc
from kokoro_onnx import Kokoro

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
CSV_FILE = os.path.join(AQUI, "lista_audios_kokoro.csv")
MODELOS = os.environ.get("KOKORO_DIR") or os.path.join(AQUI, ".kokoro-models")
PAUSA = 0.35
VELOCIDAD = 0.95


def a_mp3(samples, sr):
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(96)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    return enc.encode(pcm.tobytes()) + enc.flush()


def main():
    args = [a for a in sys.argv[1:] if a != "--force"]
    force = "--force" in sys.argv[1:]
    pedidos = [a.replace("\\", "/") for a in args]
    filas = []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        for i, fila in enumerate(csv.reader(f)):
            if i == 0 or not fila or not fila[0].strip():
                continue
            ruta = fila[0].strip()
            if pedidos and not any(ruta == p or (p.endswith("/") and ruta.startswith(p)) for p in pedidos):
                continue
            filas.append((ruta, fila[1], (fila[2] if len(fila) > 2 and fila[2] else "af_heart")))
    kokoro = Kokoro(os.path.join(MODELOS, "kokoro-v1.0.onnx"), os.path.join(MODELOS, "voices-v1.0.bin"))
    hechos = saltados = 0
    for ruta, texto, voz in filas:
        destino = os.path.join(RAIZ, ruta)
        if os.path.exists(destino) and not force:
            saltados += 1
            continue
        partes = []
        sr = 24000
        for k, trozo in enumerate(texto.split("|")):
            samples, sr = kokoro.create(trozo.strip(), voice=voz, speed=VELOCIDAD, lang="en-us")
            if k:
                partes.append(np.zeros(int(sr * PAUSA), dtype=np.float32))
            partes.append(samples)
        audio = np.concatenate(partes)
        pico = float(np.max(np.abs(audio))) or 1.0
        audio = audio * min(1.0, 0.9 / pico) if pico > 0.9 else audio
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, "wb") as f:
            f.write(a_mp3(audio, sr))
        hechos += 1
        print(f"[OK] {ruta}  {len(audio) / sr:.1f}s  ({voz})")
    print(f"Listo: {hechos} creados, {saltados} ya existian.")


if __name__ == "__main__":
    main()
