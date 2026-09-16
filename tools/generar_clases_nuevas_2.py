"""
generar_clases_nuevas_2.py
----------------------------
Genera UNICAMENTE los audios de las 9 clases interactivas nuevas que se
acaban de agregar (la segunda tanda, despues de las primeras 6):
  - Una emergencia
  - Transporte publico
  - Supermercado
  - Devolver o cambiar un producto
  - Escribir y responder emails
  - Dar una presentacion
  - Hablar con un cliente
  - Explicar un problema en el trabajo
  - Pedir mas tiempo / negociar una fecha limite

Son 63 archivos en total (5 frases + 1 dialogo + 1 audio de "habla" por
cada una de las 9 clases). NO toca ninguno de los audios que ya existen
en el resto de la plataforma (mas de 350 archivos, incluidas las primeras
6 clases nuevas de la tanda anterior): este script solo le pide a
generar_audios.py que genere esta lista puntual, nada mas.

Los dialogos usan DOS voces distintas (una para cada persona que habla),
y las frases sueltas y el audio de "habla" usan una sola voz. Ambas son
las voces "Multilingual" de Microsoft, las mas naturales y menos
roboticas de las que hay disponibles gratis (mas detalles en
generar_audios.py).

COMO USARLO:
1. Si ya usas generar_audios.py normalmente, ya tienes todo instalado.
   Si no, instala la libreria una sola vez:
       pip install -U edge-tts
2. Abre la Terminal / simbolo del sistema (CMD) en la carpeta "tools"
   de tu proyecto (la misma carpeta donde esta este archivo).
3. Ejecuta:
       python generar_clases_nuevas_2.py
4. Espera a que termine (63 audios, deberia tardar unos dos o tres
   minutos). Vas a ver "[OK] ..." por cada archivo.
5. Escucha algunos para confirmar que suenan bien, y listo: haz el
   commit y push de siempre.

Si algo falla a la mitad, puedes volver a correr este mismo comando
las veces que quieras: solo vuelve a generar estos 63 archivos, nunca
los demas.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/clases/frases/emergency-1.mp3",
    "audio/clases/frases/emergency-2.mp3",
    "audio/clases/frases/emergency-3.mp3",
    "audio/clases/frases/emergency-4.mp3",
    "audio/clases/frases/emergency-5.mp3",
    "audio/clases/emergencia-listening.mp3",
    "audio/clases/emergencia-speaking.mp3",
    "audio/clases/frases/public-transport-1.mp3",
    "audio/clases/frases/public-transport-2.mp3",
    "audio/clases/frases/public-transport-3.mp3",
    "audio/clases/frases/public-transport-4.mp3",
    "audio/clases/frases/public-transport-5.mp3",
    "audio/clases/transporte-listening.mp3",
    "audio/clases/transporte-speaking.mp3",
    "audio/clases/frases/supermarket-1.mp3",
    "audio/clases/frases/supermarket-2.mp3",
    "audio/clases/frases/supermarket-3.mp3",
    "audio/clases/frases/supermarket-4.mp3",
    "audio/clases/frases/supermarket-5.mp3",
    "audio/clases/supermercado-listening.mp3",
    "audio/clases/supermercado-speaking.mp3",
    "audio/clases/frases/return-product-1.mp3",
    "audio/clases/frases/return-product-2.mp3",
    "audio/clases/frases/return-product-3.mp3",
    "audio/clases/frases/return-product-4.mp3",
    "audio/clases/frases/return-product-5.mp3",
    "audio/clases/devolucion-listening.mp3",
    "audio/clases/devolucion-speaking.mp3",
    "audio/clases/frases/work-emails-1.mp3",
    "audio/clases/frases/work-emails-2.mp3",
    "audio/clases/frases/work-emails-3.mp3",
    "audio/clases/frases/work-emails-4.mp3",
    "audio/clases/frases/work-emails-5.mp3",
    "audio/clases/emails-listening.mp3",
    "audio/clases/emails-speaking.mp3",
    "audio/clases/frases/presentation-1.mp3",
    "audio/clases/frases/presentation-2.mp3",
    "audio/clases/frases/presentation-3.mp3",
    "audio/clases/frases/presentation-4.mp3",
    "audio/clases/frases/presentation-5.mp3",
    "audio/clases/presentacion-listening.mp3",
    "audio/clases/presentacion-speaking.mp3",
    "audio/clases/frases/client-meeting-1.mp3",
    "audio/clases/frases/client-meeting-2.mp3",
    "audio/clases/frases/client-meeting-3.mp3",
    "audio/clases/frases/client-meeting-4.mp3",
    "audio/clases/frases/client-meeting-5.mp3",
    "audio/clases/cliente-listening.mp3",
    "audio/clases/cliente-speaking.mp3",
    "audio/clases/frases/work-problem-1.mp3",
    "audio/clases/frases/work-problem-2.mp3",
    "audio/clases/frases/work-problem-3.mp3",
    "audio/clases/frases/work-problem-4.mp3",
    "audio/clases/frases/work-problem-5.mp3",
    "audio/clases/problema-listening.mp3",
    "audio/clases/problema-speaking.mp3",
    "audio/clases/frases/negotiate-deadline-1.mp3",
    "audio/clases/frases/negotiate-deadline-2.mp3",
    "audio/clases/frases/negotiate-deadline-3.mp3",
    "audio/clases/frases/negotiate-deadline-4.mp3",
    "audio/clases/frases/negotiate-deadline-5.mp3",
    "audio/clases/fecha-limite-listening.mp3",
    "audio/clases/fecha-limite-speaking.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (9 clases nuevas)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
