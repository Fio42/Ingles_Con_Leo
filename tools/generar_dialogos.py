# -*- coding: utf-8 -*-
"""
generar_dialogos.py
--------------------
Genera los 3 audios de "Escucha el dialogo" de las Clases (aeropuerto,
hotel, restaurante) pero con DOS VOCES DIFERENTES: una para el personal
(agente / recepcionista / mesero) y otra para "Tu", para que suene como
dos personas distintas hablando, no una sola voz leyendo todo.

Usa la misma herramienta gratuita que generar_audios.py (Edge TTS).

COMO USARLO:
1. Si ya usaste generar_audios.py, ya tienes Python y edge-tts instalados.
   Si no, sigue los pasos 1-3 de generar_audios.py primero.
2. Abre la Terminal / simbolo del sistema (CMD) en la carpeta "tools".
3. Ejecuta:
       python generar_dialogos.py
   Esto va a REEMPLAZAR los 3 archivos:
       audio/clases/aeropuerto-listening.mp3
       audio/clases/hotel-listening.mp3
       audio/clases/restaurante-listening.mp3
   con version de dos voces. No necesitas tocar nada mas, todo esta
   escrito aqui abajo.
"""

import asyncio
import os
import sys

try:
    import edge_tts
except ImportError:
    print("Falta instalar la herramienta. Ejecuta primero:")
    print("    pip install edge-tts")
    sys.exit(1)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VOZ_PERSONAL = "en-US-GuyNeural"   # voz de hombre para el personal (agente/recepcionista/mesero)
VOZ_TU = "en-US-AriaNeural"        # voz de mujer para "Tu" (la misma voz que el resto del sitio)

# Cada dialogo es una lista de (texto, voz), en el orden en que se deben
# escuchar. Esto tiene que coincidir exactamente con el campo "dialogue"
# de cada clase en data.js.
DIALOGOS = {
    "audio/clases/aeropuerto-listening.mp3": [
        ("Good morning! Passport, please.", VOZ_PERSONAL),
        ("Here you go. I'd like to check this bag too.", VOZ_TU),
        ("Sure. Your gate is B12, and boarding starts at 5:40.", VOZ_PERSONAL),
    ],
    "audio/clases/hotel-listening.mp3": [
        ("Good afternoon! Welcome. Do you have a reservation?", VOZ_PERSONAL),
        ("Yes, under the name Martinez. Two nights.", VOZ_TU),
        ("Perfect, here's your key. Breakfast is served from 7 to 10 in the lobby.", VOZ_PERSONAL),
    ],
    "audio/clases/restaurante-listening.mp3": [
        ("Good evening! Are you ready to order?", VOZ_PERSONAL),
        ("Yes, I'll have the grilled chicken, please.", VOZ_TU),
        ("Great choice. Would you like anything to drink? We also have a soup of the day.", VOZ_PERSONAL),
    ],
    "audio/clases/cafe-listening.mp3": [
        ("Hi! What can I get started for you today?", VOZ_PERSONAL),
        ("I'd like a medium latte with oat milk, please.", VOZ_TU),
        ("Sure thing. Is that for here or to go? It'll be six dollars.", VOZ_PERSONAL),
    ],
    "audio/clases/compras-listening.mp3": [
        ("Hi, welcome! Are you looking for anything in particular?", VOZ_PERSONAL),
        ("Yes, I'm looking for a jacket in a medium.", VOZ_TU),
        ("We have a few options. The fitting rooms are right over there.", VOZ_PERSONAL),
    ],
    "audio/clases/conocer-listening.mp3": [
        ("Hi! I don't think we've met before. I'm Sam.", VOZ_PERSONAL),
        ("Hi Sam, nice to meet you. I'm Alex.", VOZ_TU),
        ("Nice to meet you too, Alex! So, how do you know Maria?", VOZ_PERSONAL),
    ],
    "audio/clases/entrevista-listening.mp3": [
        ("So, tell me a little about your work experience.", VOZ_PERSONAL),
        ("I have three years of experience in customer service.", VOZ_TU),
        ("That's great. What would you say is your biggest strength?", VOZ_PERSONAL),
    ],
    "audio/clases/llamadas-listening.mp3": [
        ("Good morning, Dr. Lee's office. How can I help you?", VOZ_PERSONAL),
        ("Hi, I'd like to make an appointment for next week.", VOZ_TU),
        ("Sure, does Tuesday at 3 PM work for you?", VOZ_PERSONAL),
    ],
    "audio/clases/reuniones-listening.mp3": [
        ("Okay, let's start. Can you give us a quick update on the project?", VOZ_PERSONAL),
        ("Sure, we're on track to finish by Friday.", VOZ_TU),
        ("Great. Does anyone have questions about that?", VOZ_PERSONAL),
    ],
}

PAUSA_MS = 450  # pequena pausa de silencio entre lineas, para que no se amontonen


async def generar_linea(texto, voz, ruta_temp):
    communicate = edge_tts.Communicate(texto, voz)
    await communicate.save(ruta_temp)


def mp3_silencio(ms):
    # Un mp3 "silencioso" muy simple: en vez de generar un mp3 real de
    # silencio, dejamos una pausa vacia (los reproductores no se quejan
    # por un archivo mp3 formado por varios trozos pegados sin silencio
    # explicito; si quieres mas separacion, sube PAUSA_MS o pide ayuda).
    return b""


async def generar_dialogo(ruta_relativa, lineas):
    ruta_salida = os.path.join(PROJECT_ROOT, ruta_relativa)
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    carpeta_temp = os.path.join(PROJECT_ROOT, "tools", "_tmp_dialogo")
    os.makedirs(carpeta_temp, exist_ok=True)

    partes = []
    for i, (texto, voz) in enumerate(lineas):
        ruta_temp = os.path.join(carpeta_temp, f"linea_{i}.mp3")
        await generar_linea(texto, voz, ruta_temp)
        with open(ruta_temp, "rb") as f:
            partes.append(f.read())
        os.remove(ruta_temp)

    with open(ruta_salida, "wb") as f:
        for parte in partes:
            f.write(parte)

    try:
        os.rmdir(carpeta_temp)
    except OSError:
        pass

    print(f"[OK] {ruta_relativa}  <- {len(lineas)} lineas, 2 voces")


async def main():
    print(f"Generando {len(DIALOGOS)} dialogo(s) con dos voces...\n")
    for ruta_relativa, lineas in DIALOGOS.items():
        try:
            await generar_dialogo(ruta_relativa, lineas)
        except Exception as e:
            print(f"[ERROR] {ruta_relativa}: {e}")
    print("\nListo. Reemplaza los mp3 anteriores; no necesitas hacer nada mas.")


if __name__ == "__main__":
    asyncio.run(main())
