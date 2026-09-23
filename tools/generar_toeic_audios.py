"""
generar_toeic_audios.py
-----------------------
Genera los 40 audios de la seccion "Preparacion TOEIC" (solo miembros):
Listening (Partes 2, 3 y 4) y las preguntas habladas de Speaking.

Lee las filas de lista_audios.csv cuyo archivo empieza con
"audio/toeic/" (el CSV sigue siendo la unica lista oficial de audios),
y los genera con voces de Microsoft Edge (gratis) de forma que suenen
lo mas humano posible:

  - CONVERSACIONES CON 2 VOCES: si la tercera columna del CSV tiene
    dos voces separadas por "|", cada linea del texto (las que empiezan
    con "—") la dice una persona distinta, alternando.
  - PAUSAS NATURALES entre una persona y otra (0.6 segundos), en lugar
    de pegar las voces sin respirar como hace el script general.
  - En Listening Parte 2 (archivos l-p2-...) tambien hace una pausa
    entre la pregunta y cada respuesta (A), (B) y (C), como en el
    examen real.
  - ACENTOS DEL TOEIC REAL: el examen usa voces de Estados Unidos,
    Reino Unido, Canada y Australia. Las filas ya traen esa mezcla
    (por ejemplo en-GB-RyanNeural, en-CA-ClaraNeural,
    en-AU-NatashaNeural) junto con las voces mas naturales de Estados
    Unidos (Ava, Andrew, Emma y Brian Multilingual).
  - Si Microsoft cambia o quita alguna voz, el script NO se detiene:
    usa automaticamente una voz natural de respaldo del mismo genero
    y te avisa.
  - Si un audio ya existe, lo salta (asi puedes volver a correrlo si
    algo falla a la mitad sin repetir todo). Para regenerarlos todos:
        python generar_toeic_audios.py --todos

COMO USARLO:
1. Si ya usas generar_audios.py, ya tienes todo instalado. Si no:
       pip install -U edge-tts
2. Abre la terminal (CMD) en la carpeta "tools" del proyecto.
3. Ejecuta:
       python generar_toeic_audios.py
4. Al final vas a ver un resumen. Escucha 2 o 3 conversaciones
   (por ejemplo audio/toeic/l-p3-01.mp3) para confirmar que se oyen
   dos personas distintas, y haz el commit y push de siempre.

Tambien puedes generar solo algunos archivos:
       python generar_toeic_audios.py audio/toeic/l-p3-01.mp3 audio/toeic/l-p2-05.mp3
"""

import asyncio
import csv
import os
import re
import sys

try:
    import edge_tts
except ImportError:
    print("Falta instalar la herramienta. Ejecuta primero:")
    print("    pip install -U edge-tts")
    sys.exit(1)

AQUI = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(AQUI, "lista_audios.csv")
PROJECT_ROOT = os.path.dirname(AQUI)
SILENCIO = os.path.join(AQUI, "silencio_600ms.mp3")
PREFIJO = "audio/toeic/"
INTENTOS = 3

# Voces de respaldo (las mas naturales) si alguna voz ya no existe.
RESPALDO_MUJER = "en-US-AvaMultilingualNeural"
RESPALDO_HOMBRE = "en-US-AndrewMultilingualNeural"
VOCES_HOMBRE = ("Andrew", "Brian", "Ryan", "Liam", "William", "Guy", "Christopher", "Eric", "Roger", "Steffan", "Thomas")


def respaldo_de(voz):
    return RESPALDO_HOMBRE if any(n in voz for n in VOCES_HOMBRE) else RESPALDO_MUJER


async def tts_bytes(texto, voz):
    """Devuelve el mp3 de un fragmento. Reintenta y, si la voz falla, usa el respaldo."""
    ultimo = None
    for voz_actual in (voz, respaldo_de(voz)):
        for intento in range(INTENTOS):
            try:
                datos = bytearray()
                async for chunk in edge_tts.Communicate(texto, voz_actual).stream():
                    if chunk["type"] == "audio":
                        datos.extend(chunk["data"])
                if datos:
                    if voz_actual != voz:
                        print(f"    [AVISO] La voz {voz} no respondio; se uso {voz_actual}.")
                    return bytes(datos)
                raise RuntimeError("Microsoft no devolvio audio")
            except Exception as e:
                ultimo = e
                await asyncio.sleep(1.5)
    raise ultimo


def partir_turnos(texto):
    lineas = [l.strip() for l in texto.split("\n") if l.strip()]
    return [l.lstrip("—").strip() if l.startswith("—") else l for l in lineas]


def partir_opciones_parte2(linea):
    # "A. ... B. ... C. ..." -> ["A. ...", "B. ...", "C. ..."]
    partes = re.split(r"\s+(?=[BC]\.\s)", linea)
    return [p.strip() for p in partes if p.strip()]


async def generar(archivo, texto, voces_txt, silencio):
    voces = [v.strip() for v in voces_txt.split("|") if v.strip()] or [RESPALDO_MUJER]
    turnos = partir_turnos(texto) if len(voces) > 1 else [texto.replace("\n", " ")]
    es_parte2 = "/l-p2-" in archivo
    segmentos = []  # (texto, voz)
    for i, turno in enumerate(turnos):
        voz = voces[i % len(voces)]
        if es_parte2 and i > 0:
            for opcion in partir_opciones_parte2(turno):
                segmentos.append((opcion, voz))
        else:
            segmentos.append((turno, voz))

    salida = bytearray()
    for j, (frag, voz) in enumerate(segmentos):
        if j > 0 and silencio:
            salida.extend(silencio)
        salida.extend(await tts_bytes(frag, voz))

    ruta = os.path.join(PROJECT_ROOT, archivo)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "wb") as f:
        f.write(salida)
    return len(segmentos), len(set(v for _, v in segmentos))


async def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    todos = "--todos" in sys.argv
    pedidos = {a.replace("\\", "/") for a in args}

    silencio = b""
    if os.path.exists(SILENCIO):
        with open(SILENCIO, "rb") as f:
            silencio = f.read()
    else:
        print("[AVISO] No encontre silencio_600ms.mp3: los audios se generaran sin pausas.")

    filas = []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        for fila in csv.reader(f):
            if not fila or not fila[0].strip().startswith(PREFIJO):
                continue
            archivo = fila[0].strip()
            if pedidos and archivo not in pedidos:
                continue
            texto = fila[1].strip() if len(fila) > 1 else ""
            voz = fila[2].strip() if len(fila) > 2 else ""
            filas.append((archivo, texto, voz))

    if not filas:
        print("No encontre filas de audio/toeic/ en lista_audios.csv")
        return

    print(f"Audios TOEIC en la lista: {len(filas)}\n")
    hechos = saltados = errores = 0
    for archivo, texto, voz in filas:
        ruta = os.path.join(PROJECT_ROOT, archivo)
        if not todos and not pedidos and os.path.exists(ruta) and os.path.getsize(ruta) > 2000:
            saltados += 1
            continue
        try:
            n_seg, n_voces = await generar(archivo, texto, voz, silencio)
            detalle = f"{n_voces} voces" if n_voces > 1 else "1 voz"
            print(f"[OK] {archivo}  ({detalle}, {n_seg} partes)")
            hechos += 1
        except Exception as e:
            print(f"[ERROR] {archivo}: {e}")
            errores += 1

    # Revision final: que todos existan y no esten vacios.
    faltan = [a for a, _, _ in filas if not os.path.exists(os.path.join(PROJECT_ROOT, a)) or os.path.getsize(os.path.join(PROJECT_ROOT, a)) < 2000]
    print(f"\nListo. Generados: {hechos}. Ya existian: {saltados}. Con error: {errores}.")
    if faltan:
        print("Estos audios faltan o quedaron vacios (vuelve a correr el script):")
        for a in faltan:
            print("   ", a)
    else:
        print("Todos los audios TOEIC estan completos.")


if __name__ == "__main__":
    asyncio.run(main())
