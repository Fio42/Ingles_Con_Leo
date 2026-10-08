"""Genera los audios del Lote SEO 3 sin sobrescribir archivos existentes.

Requiere edge-tts (ya usado por generar_audios_miembros.py). Los diálogos se
componen con voces US distintas para que cada personaje conserve su voz.
"""
import asyncio
import os
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent
ARIA = "en-US-AriaNeural"
GUY = "en-US-GuyNeural"

SINGLE = [
    ("audio/articulos/pronunciacion-ingles/frase-01.mp3", "Think about this: three thin threads.", ARIA),
    ("audio/articulos/pronunciacion-ingles/frase-02.mp3", "I need a seat, not a sheet.", ARIA),
    ("audio/articulos/pronunciacion-ingles/frase-03.mp3", "I worked late, but I played soccer.", ARIA),
    ("audio/articulos/pronunciacion-ingles/frase-04.mp3", "She lives near the park and watches movies.", ARIA),
    ("audio/articulos/pronunciacion-ingles/frase-05.mp3", "The comfortable vegetable is in the refrigerator.", ARIA),
    ("audio/articulos/pronunciacion-ingles/frase-06.mp3", "Can you hear the difference: ship or sheep?", ARIA),
    ("audio/articulos/listening-a1/a1-routine.mp3", "Hi, I'm Daniel. I get up at seven every day. I have coffee and toast for breakfast. Then I walk to work. I work at a small bookstore. After work, I cook dinner and call my sister.", GUY),
]

DIALOGUES = [
    ("audio/articulos/listening-a1/a1-coffee-shop.mp3", [
        (ARIA, "Hi! Can I have a small coffee, please?"),
        (GUY, "Sure. Would you like milk?"),
        (ARIA, "Yes, please. And a cheese sandwich."),
        (GUY, "No problem. That is six dollars."),
    ]),
    ("audio/articulos/listening-a1/a1-directions.mp3", [
        (GUY, "Excuse me, where is the library?"),
        (ARIA, "It is on Pine Street, next to the bank."),
        (GUY, "Is it far from here?"),
        (ARIA, "No. Walk two blocks and turn left."),
    ]),
]

async def speak(path: Path, text: str, voice: str):
    communicate = edge_tts.Communicate(text, voice, rate="-8%")
    await communicate.save(str(path))

async def make_single(relative: str, text: str, voice: str):
    target = ROOT / relative
    if target.exists():
        print(f"SKIP (exists): {relative}")
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    await speak(target, text, voice)
    print(f"OK: {relative}")

async def make_dialogue(relative: str, lines):
    target = ROOT / relative
    if target.exists():
        print(f"SKIP (exists): {relative}")
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as folder:
        parts = []
        for index, (voice, text) in enumerate(lines):
            part = Path(folder) / f"part-{index}.mp3"
            await speak(part, text, voice)
            parts.append(part)
        # MP3 frames can be joined directly; this preserves the chosen voice per turn.
        with target.open("xb") as output:
            for part in parts:
                output.write(part.read_bytes())
    print(f"OK: {relative}")

async def main():
    for item in SINGLE:
        await make_single(*item)
    for relative, lines in DIALOGUES:
        await make_dialogue(relative, lines)

if __name__ == "__main__":
    asyncio.run(main())
