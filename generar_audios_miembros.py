"""
Genera los 16 audios nuevos de Listening para los ejercicios de Miembros.

Que hace este script:
  - Usa una voz de Microsoft Edge (gratis, sin necesidad de cuenta ni API key)
    para leer cada oracion en ingles y guardarla como archivo .mp3.
  - Crea los archivos exactamente con el nombre y en la carpeta que ya usa
    la pagina (audio/a0/, audio/a1/, audio/b1/, audio/c1/), listos para
    hacer commit y push.

Como usarlo (en la carpeta del proyecto, la misma donde esta data.js):

  1) Instalar la libreria (una sola vez):
       pip install edge-tts

  2) Ejecutar el script:
       python generar_audios_miembros.py

  Eso es todo. Al terminar deberias ver 16 archivos nuevos dentro de
  audio\\a0, audio\\a1, audio\\b1 y audio\\c1.

Si algo falla:
  - Si dice "pip no se reconoce", intenta con: py -m pip install edge-tts
  - Si dice "python no se reconoce", intenta con: py generar_audios_miembros.py
  - Necesitas conexion a internet (Edge genera el audio en la nube de Microsoft,
    pero es gratis y no pide ninguna cuenta ni tarjeta).
"""

import asyncio
import os
import sys

try:
    import edge_tts
except ImportError:
    print("Falta instalar la libreria 'edge-tts'.")
    print("Ejecuta primero:  pip install edge-tts")
    sys.exit(1)

# Voz en ingles, clara y neutral (funciona bien para todos los niveles).
# Otras opciones si quieres variar la voz: "en-US-GuyNeural" (hombre),
# "en-GB-SoniaNeural" (acento britanico).
VOICE = "en-US-AriaNeural"

# Un poco mas lento que el ritmo normal, para que se entienda mejor
# (mismo criterio que usarias grabando tu mismo para principiantes).
RATE = "-10%"

# Cada entrada: (ruta del archivo, texto a leer)
AUDIOS = [
    # --- Principiante (a0) ---
    ("audio/a0/a0listening-020.mp3", "Can I borrow your pen, please?"),
    ("audio/a0/a0listening-021.mp3", "Please bring your book to school tomorrow."),
    ("audio/a0/a0listening-022.mp3", "Does she work on Saturdays?"),
    ("audio/a0/a0listening-023.mp3", "I can hear music, but I am not really listening to it."),

    # --- Facil (a1) ---
    ("audio/a1/a1listening-039.mp3", "She made a beautiful cake for the party."),
    ("audio/a1/a1listening-040.mp3", "We watched a movie at home last night."),
    ("audio/a1/a1listening-041.mp3", "I have a new job at a hospital."),
    ("audio/a1/a1listening-042.mp3", "He doesn't have much time this week."),

    # --- Medio (b1) ---
    ("audio/b1/b1listening-028.mp3", "Actually, I don't agree with that plan."),
    ("audio/b1/b1listening-029.mp3", "Despite the traffic, we arrived on time."),
    ("audio/b1/b1listening-030.mp3", "I felt so embarrassed when I forgot her name."),
    ("audio/b1/b1listening-031.mp3", "Can you assist me with this heavy box?"),

    # --- Avanzado (c1) ---
    ("audio/c1/c1listening-028.mp3", "Whom did they choose for the position?"),
    ("audio/c1/c1listening-029.mp3", "Whereas John prefers mornings, his sister prefers evenings."),
    ("audio/c1/c1listening-030.mp3", "I assume you have already read the report."),
    ("audio/c1/c1listening-031.mp3", "She was very discreet about her plans."),
]


async def generate_one(path: str, text: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(path)
    print(f"  OK -> {path}")


async def main():
    print(f"Generando {len(AUDIOS)} audios nuevos...\n")
    for path, text in AUDIOS:
        try:
            await generate_one(path, text)
        except Exception as e:
            print(f"  ERROR con {path}: {e}")
    print("\nListo. Revisa las carpetas audio/a0, audio/a1, audio/b1 y audio/c1.")
    print("Cuando confirmes que suenan bien, haz el commit y push de siempre.")


if __name__ == "__main__":
    asyncio.run(main())
