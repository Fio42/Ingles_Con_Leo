"""
generar_clases_nuevas.py
-------------------------
Genera UNICAMENTE los audios de las 6 clases interactivas nuevas que se
acaban de agregar:
  - Migracion y aduana
  - Pedir direcciones
  - Taxi / Uber
  - En el medico
  - Small talk
  - Atencion al cliente

Son 42 archivos en total (5 frases + 1 dialogo + 1 audio de "habla" por
cada una de las 6 clases). NO toca ninguno de los audios que ya existen
en el resto de la plataforma (mas de 250 archivos): este script solo le
pide a generar_audios.py que genere esta lista puntual, nada mas.

Los dialogos usan DOS voces distintas (una para cada persona que habla),
y las frases sueltas y el audio de "habla" usan una sola voz. Ambas son
las voces "Multilingual" de Microsoft, que son las mas naturales y menos
roboticas de las que hay disponibles gratis (mas detalles en
generar_audios.py).

COMO USARLO:
1. Si ya usas generar_audios.py normalmente, ya tienes todo instalado.
   Si no, instala la libreria una sola vez:
       pip install -U edge-tts
2. Abre la Terminal / simbolo del sistema (CMD) en la carpeta "tools"
   de tu proyecto (la misma carpeta donde esta este archivo).
3. Ejecuta:
       python generar_clases_nuevas.py
4. Espera a que termine (unos 42 audios, deberia tardar uno o dos
   minutos). Vas a ver "[OK] ..." por cada archivo.
5. Escucha algunos para confirmar que suenan bien, y listo: haz el
   commit y push de siempre.

Si algo falla a la mitad, puedes volver a correr este mismo comando
las veces que quieras: solo vuelve a generar estos 42 archivos, nunca
los demas.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/clases/frases/immigration-1.mp3",
    "audio/clases/frases/immigration-2.mp3",
    "audio/clases/frases/immigration-3.mp3",
    "audio/clases/frases/immigration-4.mp3",
    "audio/clases/frases/immigration-5.mp3",
    "audio/clases/migracion-listening.mp3",
    "audio/clases/migracion-speaking.mp3",
    "audio/clases/frases/directions-1.mp3",
    "audio/clases/frases/directions-2.mp3",
    "audio/clases/frases/directions-3.mp3",
    "audio/clases/frases/directions-4.mp3",
    "audio/clases/frases/directions-5.mp3",
    "audio/clases/direcciones-listening.mp3",
    "audio/clases/direcciones-speaking.mp3",
    "audio/clases/frases/taxi-uber-1.mp3",
    "audio/clases/frases/taxi-uber-2.mp3",
    "audio/clases/frases/taxi-uber-3.mp3",
    "audio/clases/frases/taxi-uber-4.mp3",
    "audio/clases/frases/taxi-uber-5.mp3",
    "audio/clases/taxi-listening.mp3",
    "audio/clases/taxi-speaking.mp3",
    "audio/clases/frases/doctor-1.mp3",
    "audio/clases/frases/doctor-2.mp3",
    "audio/clases/frases/doctor-3.mp3",
    "audio/clases/frases/doctor-4.mp3",
    "audio/clases/frases/doctor-5.mp3",
    "audio/clases/medico-listening.mp3",
    "audio/clases/medico-speaking.mp3",
    "audio/clases/frases/small-talk-1.mp3",
    "audio/clases/frases/small-talk-2.mp3",
    "audio/clases/frases/small-talk-3.mp3",
    "audio/clases/frases/small-talk-4.mp3",
    "audio/clases/frases/small-talk-5.mp3",
    "audio/clases/small-talk-listening.mp3",
    "audio/clases/small-talk-speaking.mp3",
    "audio/clases/frases/customer-service-1.mp3",
    "audio/clases/frases/customer-service-2.mp3",
    "audio/clases/frases/customer-service-3.mp3",
    "audio/clases/frases/customer-service-4.mp3",
    "audio/clases/frases/customer-service-5.mp3",
    "audio/clases/atencion-cliente-listening.mp3",
    "audio/clases/atencion-cliente-speaking.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (6 clases nuevas)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
