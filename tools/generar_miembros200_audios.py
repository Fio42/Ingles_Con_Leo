"""
generar_miembros200_audios.py
-------------------------------
Genera UNICAMENTE los 28 audios nuevos de los 100 ejercicios nuevos
("miembros200"): un mix de Listening y Speaking repartido en los 4
niveles (principiante, facil, medio, avanzado). Gramatica, Vocabulario,
Reading y Writing no necesitan audio, asi que no aparecen aqui.

Estos ejercicios se agregaron directamente a los bancos que ya usan
tanto la pagina de practica gratis como las paginas completas de
miembros (Gramatica, Vocabulario, Listening, Reading, Writing,
Speaking): no hizo falta tocar el sistema de sesiones, duracion ni
"continuar donde te quedaste", todo eso ya funciona automaticamente
igual que con el resto del contenido.

Usan la misma voz por defecto (Jenny) que el resto de Listening y
Speaking en todos los niveles, para que no se note la diferencia al
mezclarse con los ejercicios que ya existian.

NO toca ninguno de los mas de 400 audios que ya existen en el resto
de la plataforma: este script solo le pide a generar_audios.py que
genere esta lista puntual, nada mas.

COMO USARLO:
1. Si ya usas generar_audios.py normalmente, ya tienes todo instalado.
   Si no, instala la libreria una sola vez:
       pip install -U edge-tts
2. Abre la Terminal / simbolo del sistema (CMD) en la carpeta "tools"
   de tu proyecto (la misma carpeta donde esta este archivo).
3. Ejecuta:
       python generar_miembros200_audios.py
4. Espera a que termine (28 audios, deberia tardar uno o dos minutos).
   Vas a ver "[OK] ..." por cada archivo.
5. Escucha algunos para confirmar que suenan bien, y listo: haz el
   commit y push de siempre.

Si algo falla a la mitad, puedes volver a correr este mismo comando
las veces que quieras: solo vuelve a generar estos 28 archivos, nunca
los demas.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/miembros200/l-principiante-m200-1.mp3",
    "audio/miembros200/l-principiante-m200-2.mp3",
    "audio/miembros200/l-principiante-m200-3.mp3",
    "audio/miembros200/l-principiante-m200-4.mp3",
    "audio/miembros200/l-principiante-m200-5.mp3",
    "audio/miembros200/l-principiante-m200-6.mp3",
    "audio/miembros200/l-facil-m200-1.mp3",
    "audio/miembros200/l-facil-m200-2.mp3",
    "audio/miembros200/l-facil-m200-3.mp3",
    "audio/miembros200/l-facil-m200-4.mp3",
    "audio/miembros200/l-facil-m200-5.mp3",
    "audio/miembros200/l-medio-m200-1.mp3",
    "audio/miembros200/l-medio-m200-2.mp3",
    "audio/miembros200/l-medio-m200-3.mp3",
    "audio/miembros200/l-avanzado-m200-1.mp3",
    "audio/miembros200/l-avanzado-m200-2.mp3",
    "audio/miembros200/s-principiante-m200-1.mp3",
    "audio/miembros200/s-principiante-m200-2.mp3",
    "audio/miembros200/s-principiante-m200-3.mp3",
    "audio/miembros200/s-principiante-m200-4.mp3",
    "audio/miembros200/s-principiante-m200-5.mp3",
    "audio/miembros200/s-facil-m200-1.mp3",
    "audio/miembros200/s-facil-m200-2.mp3",
    "audio/miembros200/s-facil-m200-3.mp3",
    "audio/miembros200/s-facil-m200-4.mp3",
    "audio/miembros200/s-medio-m200-1.mp3",
    "audio/miembros200/s-medio-m200-2.mp3",
    "audio/miembros200/s-avanzado-m200-1.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (100 ejercicios nuevos)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
