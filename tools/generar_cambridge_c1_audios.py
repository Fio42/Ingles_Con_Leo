"""
generar_cambridge_c1_audios.py
-------------------------------
Genera UNICAMENTE los 24 audios nuevos de la seccion Cambridge English
C1 Advanced (Listening y Speaking). NO toca ninguno de los audios que
ya existen en el resto de la plataforma (mas de 380 archivos, incluido
todo B2 First y las clases interactivas): este script solo le pide a
generar_audios.py que genere esta lista puntual, nada mas.

Los dialogos de dos personas (shortExtract y longInterview) usan DOS
voces distintas, y los monologos y las preguntas del examinador
(sentenceCompletion, multipleMatching, interview, furtherDiscussion)
usan una sola voz. Ambas son las voces "Multilingual" de Microsoft,
las mas naturales y menos roboticas de las que hay disponibles gratis
(mas detalles en generar_audios.py).

COMO USARLO:
1. Si ya usas generar_audios.py normalmente, ya tienes todo instalado.
   Si no, instala la libreria una sola vez:
       pip install -U edge-tts
2. Abre la Terminal / simbolo del sistema (CMD) en la carpeta "tools"
   de tu proyecto (la misma carpeta donde esta este archivo).
3. Ejecuta:
       python generar_cambridge_c1_audios.py
4. Espera a que termine (24 audios, deberia tardar uno o dos minutos).
   Vas a ver "[OK] ..." por cada archivo.
5. Escucha algunos para confirmar que suenan bien, y listo: haz el
   commit y push de siempre.

Si algo falla a la mitad, puedes volver a correr este mismo comando
las veces que quieras: solo vuelve a generar estos 24 archivos, nunca
los demas.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/cambridge-c1/c1-se-1.mp3",
    "audio/cambridge-c1/c1-se-2.mp3",
    "audio/cambridge-c1/c1-se-3.mp3",
    "audio/cambridge-c1/c1-se-4.mp3",
    "audio/cambridge-c1/c1-sc-1.mp3",
    "audio/cambridge-c1/c1-sc-2.mp3",
    "audio/cambridge-c1/c1-sc-3.mp3",
    "audio/cambridge-c1/c1-sc-4.mp3",
    "audio/cambridge-c1/c1-mm-1.mp3",
    "audio/cambridge-c1/c1-mm-2.mp3",
    "audio/cambridge-c1/c1-mm-3.mp3",
    "audio/cambridge-c1/c1-mm-4.mp3",
    "audio/cambridge-c1/c1-li-1.mp3",
    "audio/cambridge-c1/c1-li-2.mp3",
    "audio/cambridge-c1/c1-li-3.mp3",
    "audio/cambridge-c1/c1-li-4.mp3",
    "audio/cambridge-c1/c1-p1-1.mp3",
    "audio/cambridge-c1/c1-p1-2.mp3",
    "audio/cambridge-c1/c1-p1-3.mp3",
    "audio/cambridge-c1/c1-p1-4.mp3",
    "audio/cambridge-c1/c1-p4-1.mp3",
    "audio/cambridge-c1/c1-p4-2.mp3",
    "audio/cambridge-c1/c1-p4-3.mp3",
    "audio/cambridge-c1/c1-p4-4.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (Cambridge C1 Advanced)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
