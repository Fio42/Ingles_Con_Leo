"""Genera un dialogo de dos voces con Kokoro TTS (local, gratis, sin internet).

Uso (desde la carpeta tools, con el entorno de .kokoro-env):
    python generar_dialogo_kokoro.py audio/articulos/ingles-reuniones-trabajo/dialogo-reunion.mp3

Lee el texto de lista_audios.csv (las lineas que empiezan con "— ").
Los turnos impares los dice la voz 1 (Maria) y los pares la voz 2 (Tom).
No toca generar_audios.py ni los demas audios.
"""
import csv, os, sys
import numpy as np
import lameenc
from kokoro_onnx import Kokoro

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
CSV_FILE = os.path.join(AQUI, "lista_audios.csv")
MODELO = os.path.join(AQUI, ".kokoro-models", "kokoro-v1.0.onnx")
VOCES = os.path.join(AQUI, ".kokoro-models", "voices-v1.0.bin")
VOZ_1 = "af_heart"    # Maria, mujer estadounidense
VOZ_2 = "am_michael"  # Tom, hombre estadounidense
PAUSA = 0.35          # segundos entre turnos


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    ruta = sys.argv[1].replace("\\", "/")
    texto = None
    voz_csv = ""
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        for fila in csv.reader(f):
            if fila and fila[0].strip() == ruta:
                texto = fila[1]
                voz_csv = fila[2] if len(fila) > 2 else ""
    if texto is None:
        print("No encuentro esa ruta en lista_audios.csv:", ruta)
        return 1
    turnos = [l.lstrip("—").strip() for l in texto.split("\n") if l.strip()]
    # Si la fila del CSV pone primero la voz masculina (Andrew), se intercambian.
    voz1, voz2 = VOZ_1, VOZ_2
    if voz_csv.split("|")[0].strip().lower().find("andrew") != -1:
        voz1, voz2 = VOZ_2, VOZ_1
    kokoro = Kokoro(MODELO, VOCES)
    partes, sr = [], 24000
    for i, t in enumerate(turnos):
        voz = voz1 if i % 2 == 0 else voz2
        samples, sr = kokoro.create(t, voice=voz, speed=0.95, lang="en-us")
        partes.append(samples)
        partes.append(np.zeros(int(sr * PAUSA), dtype=np.float32))
        print(f"turno {i + 1}/{len(turnos)} ({voz}): {len(samples) / sr:.1f}s")
    audio = np.concatenate(partes[:-1])
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(96)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    mp3 = enc.encode(pcm.tobytes()) + enc.flush()
    destino = os.path.join(RAIZ, ruta)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "wb") as f:
        f.write(mp3)
    print(f"Listo: {destino} ({len(mp3) / 1024:.0f} KB, {len(audio) / sr:.1f}s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
