r"""
generar_audios_ingles_basico.py
-------------------------------
Genera UNICAMENTE los 5 audios nuevos de la guia "Ingles basico para
principiantes: vocabulario y frases con pronunciacion":
   saludos.mp3, presentarte.mp3, preguntas.mp3, comida-compras.mp3 y
   direcciones.mp3 (voz en-US-AvaMultilingualNeural).

NO toca ningun otro audio del sitio: solo le pide a generar_audios.py
que genere esas cinco filas puntuales del CSV.

COMO USARLO (desde la raiz del proyecto, sin entrar a "tools"):
       python tools\generar_audios_ingles_basico.py

Resultado esperado: "5 audio(s) generado(s), 0 con problema".
Si algun audio falla con "No audio was received", vuelve a ejecutar el
mismo comando: solo regenera estos cinco.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/articulos/vocabulario-basico/saludos.mp3",
    "audio/articulos/vocabulario-basico/presentarte.mp3",
    "audio/articulos/vocabulario-basico/preguntas.mp3",
    "audio/articulos/vocabulario-basico/comida-compras.mp3",
    "audio/articulos/vocabulario-basico/direcciones.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (ingles basico)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
