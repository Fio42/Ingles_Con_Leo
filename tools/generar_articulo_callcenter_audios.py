"""
generar_articulo_callcenter_audios.py
---------------------------------------
Genera UNICAMENTE los 4 audios nuevos del articulo "Entrevista de
trabajo en ingles para call center": la mini llamada de ejemplo con
dos voces (cliente y agente), en la seccion "Escucha una llamada de
ejemplo".

Usa dos voces distintas y naturales, alternando entre cliente y
agente, para que se note que son dos personas distintas:
   en-US-AndrewMultilingualNeural (hombre) -> lineas del cliente
   en-US-AvaMultilingualNeural    (mujer)  -> lineas del agente

NO toca ningun otro audio del sitio: este script solo le pide a
generar_audios.py que genere esta lista puntual, nada mas.

COMO USARLO:
1. Si ya usas generar_audios.py normalmente, ya tienes todo instalado.
   Si no, instala la libreria una sola vez:
       pip install -U edge-tts
2. Abre la Terminal / simbolo del sistema (CMD) en la carpeta "tools"
   de tu proyecto (la misma carpeta donde esta este archivo).
3. Ejecuta:
       python generar_articulo_callcenter_audios.py
4. Espera a que termine (4 audios, deberia tardar unos segundos).
5. Escucha los 4 para confirmar que se nota que son dos voces
   distintas, y listo: haz el commit y push de siempre.

Si algo falla a la mitad, puedes volver a correr este mismo comando
las veces que quieras: solo vuelve a generar estos 4 archivos, nunca
los demas.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/articulos/entrevista-call-center/frase-01.mp3",
    "audio/articulos/entrevista-call-center/frase-02.mp3",
    "audio/articulos/entrevista-call-center/frase-03.mp3",
    "audio/articulos/entrevista-call-center/frase-04.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (articulo de call center)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
