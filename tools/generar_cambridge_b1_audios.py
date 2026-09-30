"""
generar_cambridge_b1_audios.py
-------------------------------
Genera UNICAMENTE los 28 audios nuevos de Cambridge English B1
Preliminary (Listening y Speaking). No toca ningun otro audio.

Los dialogos usan DOS voces reales que se alternan: mujer
(en-US-AvaMultilingualNeural) y hombre (en-US-AndrewMultilingualNeural),
ambas de Estados Unidos y las mas naturales disponibles. Los monologos y
las preguntas del examinador usan una sola voz (Ava).

COMO USARLO (desde la carpeta "tools"):
    pip install -U edge-tts
    python generar_cambridge_b1_audios.py
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/cambridge-b1/b1-se-1.mp3",
    "audio/cambridge-b1/b1-se-2.mp3",
    "audio/cambridge-b1/b1-se-3.mp3",
    "audio/cambridge-b1/b1-se-4.mp3",
    "audio/cambridge-b1/b1-se-5.mp3",
    "audio/cambridge-b1/b1-se-6.mp3",
    "audio/cambridge-b1/b1-li-1.mp3",
    "audio/cambridge-b1/b1-li-2.mp3",
    "audio/cambridge-b1/b1-li-3.mp3",
    "audio/cambridge-b1/b1-li-4.mp3",
    "audio/cambridge-b1/b1-sc-1.mp3",
    "audio/cambridge-b1/b1-sc-2.mp3",
    "audio/cambridge-b1/b1-sc-3.mp3",
    "audio/cambridge-b1/b1-sc-4.mp3",
    "audio/cambridge-b1/b1-sc-5.mp3",
    "audio/cambridge-b1/b1-mm-1.mp3",
    "audio/cambridge-b1/b1-mm-2.mp3",
    "audio/cambridge-b1/b1-mm-3.mp3",
    "audio/cambridge-b1/b1-mm-4.mp3",
    "audio/cambridge-b1/b1-p1-1.mp3",
    "audio/cambridge-b1/b1-p1-2.mp3",
    "audio/cambridge-b1/b1-p1-3.mp3",
    "audio/cambridge-b1/b1-p1-4.mp3",
    "audio/cambridge-b1/b1-p1-5.mp3",
    "audio/cambridge-b1/b1-p4-1.mp3",
    "audio/cambridge-b1/b1-p4-2.mp3",
    "audio/cambridge-b1/b1-p4-3.mp3",
    "audio/cambridge-b1/b1-p4-4.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        sys.exit(1)
    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (Cambridge B1 Preliminary)...")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
