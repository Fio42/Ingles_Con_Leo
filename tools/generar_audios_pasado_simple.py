r"""
generar_audios_pasado_simple.py
---------------------------------
Genera UNICAMENTE el audio nuevo de la guia "Pasado simple en ingles":
   pronunciacion-ed.mp3 -> 9 verbos con las tres pronunciaciones de -ed (voz Ava)
   ejemplos.mp3         -> 10 frases en pasado simple (voz Ava)

NO toca ningun otro audio del sitio: solo le pide a generar_audios.py
que genere esas dos filas puntuales del CSV.

COMO USARLO (desde la raiz del proyecto, sin entrar a "tools"):
       python tools\generar_audios_pasado_simple.py

Resultado esperado: "2 audio(s) generado(s), 0 con problema".
Si falla con "No audio was received", vuelve a ejecutar el mismo comando.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/articulos/pasado-simple/pronunciacion-ed.mp3",
    "audio/articulos/pasado-simple/ejemplos.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (pasado simple)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
