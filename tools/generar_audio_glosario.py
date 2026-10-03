"""
generar_audio_glosario.py
-------------------------
Genera los audios del GLOSARIO (audio/glosario/<termino>.mp3) con voces
gratuitas de Microsoft (Edge TTS), inglés de Estados Unidos:
  - Frases de ejemplo: una voz (en-US-AvaMultilingualNeural).
  - Mini conversaciones: dos voces fijas (Ava = persona A, Andrew = persona B).

Lee la lista tools/glosario/audio_manifest.json, que crea
`node tools/generar_glosario.js` a partir de los términos del glosario.

COMANDOS (desde la carpeta inglesconLeo):
    python tools/generar_audio_glosario.py --all
        genera todos los audios que faltan (los que ya existen se saltan)
    python tools/generar_audio_glosario.py --term would-rather
        genera solo ese término (frases y conversación si la tiene)
    python tools/generar_audio_glosario.py --list
        muestra qué audios faltan, sin generar nada
    Agrega --force para volver a generar aunque el archivo ya exista.

Al terminar, vuelve a construir las páginas con `node tools/generar_glosario.js`
(si Node está instalado lo hace solo) para que aparezca el botón "Escuchar".
Los errores quedan en tools/glosario/audio_errores.log.
"""
import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
MANIFIESTO = os.path.join(AQUI, "glosario", "audio_manifest.json")
LOG = os.path.join(AQUI, "glosario", "audio_errores.log")

sys.path.insert(0, AQUI)
# Reutiliza el motor que ya usa el resto del sitio (reintentos + dos voces).
from generar_audios import generar_uno, generar_dialogo  # noqa: E402


def cargar():
    if not os.path.exists(MANIFIESTO):
        print("No encuentro la lista de audios. Ejecuta primero:")
        print("    node tools/generar_glosario.js")
        sys.exit(1)
    with open(MANIFIESTO, encoding="utf-8") as f:
        return json.load(f)


def registrar_error(item, error):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"{datetime.now():%Y-%m-%d %H:%M} {item['file']}: {error}\n")


async def generar(item):
    salida = os.path.join(RAIZ, item["file"])
    if "|" in item["voice"]:
        v1, v2 = [v.strip() for v in item["voice"].split("|", 1)]
        await generar_dialogo(item["text"], salida, v1, v2)
    else:
        await generar_uno(item["text"], salida, item["voice"])


async def main():
    ap = argparse.ArgumentParser(description="Audios del glosario de Inglés con Leo")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--all", action="store_true", help="todos los que faltan")
    g.add_argument("--term", metavar="SLUG", help="un término, por ejemplo would-rather")
    g.add_argument("--list", action="store_true", help="solo mostrar los que faltan")
    ap.add_argument("--force", action="store_true", help="regenerar aunque ya exista")
    args = ap.parse_args()

    items = cargar()
    if args.term:
        items = [i for i in items if i["term"] == args.term]
        if not items:
            print(f"No existe el término '{args.term}' en la lista.")
            sys.exit(1)

    def existe(i):
        return os.path.exists(os.path.join(RAIZ, i["file"]))

    pendientes = items if args.force else [i for i in items if not existe(i)]

    if args.list:
        print(f"{len(pendientes)} audio(s) pendientes de {len(items)}:")
        for i in pendientes:
            print("  ", i["file"])
        return
    if not pendientes:
        print("No hay audios pendientes.")
        return

    print(f"Generando {len(pendientes)} audio(s)...\n")
    ok = err = 0
    for i in pendientes:
        try:
            await generar(i)
            print(f"[OK] {i['file']}")
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"[ERROR] {i['file']}: {e}")
            registrar_error(i, e)
            err += 1
    print(f"\nListo. {ok} generado(s), {err} con error.")
    if err:
        print(f"Detalle en {LOG}")

    node = shutil.which("node")
    if ok and node:
        subprocess.run([node, os.path.join(AQUI, "generar_glosario.js")], cwd=RAIZ, check=False)
    elif ok:
        print("Falta ejecutar: node tools/generar_glosario.js")


if __name__ == "__main__":
    asyncio.run(main())
