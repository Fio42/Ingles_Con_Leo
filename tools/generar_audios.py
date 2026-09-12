"""
generar_audios.py
------------------
Genera automaticamente los mp3 de listening/speaking para Ingles con Leo
usando voces gratuitas de Microsoft (Edge TTS), sin necesidad de grabar
nada a mano ni usar la pagina web de text-to-speech.

COMO USARLO (una sola vez para preparar todo):
1. Instala Python si no lo tienes: https://www.python.org/downloads/
   (al instalar, marca la casilla "Add Python to PATH")
2. Abre la Terminal / simbolo del sistema (CMD) en la carpeta "tools"
   de tu proyecto (donde esta este archivo).
3. Ejecuta este comando UNA sola vez para instalar la herramienta
   (o para actualizarla si ya la tenias, asi tienes las voces mas nuevas):
       pip install -U edge-tts
4. Cada vez que quieras generar audios nuevos:
   - Abre/edita el archivo "lista_audios.csv" (en la misma carpeta).
   - Cada fila tiene: nombre_de_archivo , texto_en_ingles , voz(opcional)
   - Guarda el CSV.
   - Ejecuta:
       python generar_audios.py
   Los mp3 apareceran automaticamente dentro de la carpeta audio/
   de tu proyecto, ya con el nombre correcto.

   Si solo quieres generar una fila concreta sin reemplazar los otros
   audios del CSV, agrega su ruta al final. Por ejemplo:
       python generar_audios.py audio/clases/farmacia-speaking.mp3

   Para generar todas las frases clave de las Clases con la voz Jenny:
       python generar_audios.py audio/clases/frases/

VOCES DISPONIBLES (puedes dejarlo vacio para usar la voz por defecto):
   en-US-JennyNeural              (mujer, US, la que se usa por defecto)
   en-US-AvaMultilingualNeural    (mujer, US, la mas natural, menos robotica)
   en-US-AndrewMultilingualNeural (hombre, US, la mas natural, menos robotica)
   en-US-GuyNeural                (hombre, US)
   en-GB-SoniaNeural              (mujer, UK)
   en-GB-RyanNeural               (hombre, UK)
Puedes escribir cualquiera de estas en la tercera columna del CSV si
quieres variar la voz de un audio en particular.

AUDIOS DE CONVERSACION CON DOS VOCES (hombre y mujer):
   Si el texto de una fila tiene varias lineas (cada una empezando con
   un guion largo "—", una por cada persona que habla), puedes poner
   DOS voces en la tercera columna separadas por "|", por ejemplo:
       en-US-AvaMultilingualNeural|en-US-AndrewMultilingualNeural
   Esto hace que la primera persona hable con la primera voz, la
   segunda persona con la segunda voz, y así se van alternando. El
   resultado es un solo archivo mp3 con las dos voces, como una
   conversacion real. Si dejas solo una voz (o la dejas vacia), todo
   el audio se lee con una sola voz, como antes.
"""

import asyncio
import csv
import os
import sys

try:
    import edge_tts
except ImportError:
    print("Falta instalar la herramienta. Ejecuta primero:")
    print("    pip install edge-tts")
    sys.exit(1)

# --- Configuracion ---
CSV_FILE = os.path.join(os.path.dirname(__file__), "lista_audios.csv")
# Carpeta raiz del proyecto = un nivel arriba de esta carpeta "tools"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Jenny suena más conversacional que la voz anterior (Aria) y será la
# predeterminada para todo audio NUEVO. Los MP3 existentes no cambian.
VOZ_POR_DEFECTO = "en-US-JennyNeural"
# Reintentos si Microsoft falla momentaneamente al generar un audio.
INTENTOS_POR_AUDIO = 3


async def generar_uno(texto, ruta_salida, voz, intentos=INTENTOS_POR_AUDIO):
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    ultimo_error = None
    for intento in range(intentos):
        try:
            communicate = edge_tts.Communicate(texto, voz)
            await communicate.save(ruta_salida)
            return
        except Exception as e:
            ultimo_error = e
            if intento < intentos - 1:
                await asyncio.sleep(1.5)
    raise ultimo_error


async def generar_dialogo(texto, ruta_salida, voz1, voz2):
    """Genera un audio de conversacion alternando dos voces, una por
    cada linea del texto (cada linea = una persona hablando)."""
    lineas = [l.strip() for l in texto.split("\n") if l.strip()]
    # Quita el guion largo "—" del inicio de cada linea si esta presente.
    lineas = [l.lstrip("—").strip() if l.startswith("—") else l for l in lineas]
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)

    tmp_paths = []
    try:
        for i, linea in enumerate(lineas):
            voz_turno = voz1 if i % 2 == 0 else voz2
            tmp_path = f"{ruta_salida}.tmp{i}.mp3"
            await generar_uno(linea, tmp_path, voz_turno)
            tmp_paths.append(tmp_path)

        # Une los audios de cada turno en un solo archivo final.
        with open(ruta_salida, "wb") as final:
            for tmp_path in tmp_paths:
                with open(tmp_path, "rb") as parte:
                    final.write(parte.read())
    finally:
        for tmp_path in tmp_paths:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


async def main():
    if not os.path.exists(CSV_FILE):
        print(f"No encuentro el archivo {CSV_FILE}")
        print("Crea 'lista_audios.csv' en la misma carpeta que este script.")
        return

    # Una ruta exacta genera solo ese audio. Una ruta terminada en / sirve
    # como grupo, por ejemplo audio/clases/frases/ para las frases clave.
    solicitados = {ruta.replace("\\", "/") for ruta in sys.argv[1:]}
    filas = []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        lector = csv.reader(f)
        for i, fila in enumerate(lector):
            if i == 0 and fila and fila[0].strip().lower() in ("archivo", "filename"):
                continue  # saltar encabezado si existe
            if not fila or not fila[0].strip():
                continue
            archivo = fila[0].strip()
            coincide = any(
                archivo == solicitado or
                (solicitado.endswith('/') and archivo.startswith(solicitado))
                for solicitado in solicitados
            )
            if solicitados and not coincide:
                continue
            texto = fila[1].strip() if len(fila) > 1 else ""
            voz = fila[2].strip() if len(fila) > 2 and fila[2].strip() else VOZ_POR_DEFECTO
            filas.append((archivo, texto, voz))

    if not filas:
        if solicitados:
            print("No encontré audios con esas rutas en lista_audios.csv")
            return
        print("El CSV esta vacio. Agrega filas como:")
        print("audio/a1/a1listening-005.mp3,I go to the market every Sunday.,")
        return

    print(f"Generando {len(filas)} audio(s)...\n")
    ok, error = 0, 0
    for archivo, texto, voz in filas:
        if not texto:
            print(f"[SALTADO] {archivo} no tiene texto en la segunda columna")
            error += 1
            continue
        ruta_salida = os.path.join(PROJECT_ROOT, archivo)
        try:
            if "|" in voz:
                voz1, voz2 = [v.strip() for v in voz.split("|", 1)]
                await generar_dialogo(texto, ruta_salida, voz1, voz2)
                print(f"[OK] {archivo}  <-  conversacion de 2 voces ({voz1} / {voz2})")
            else:
                await generar_uno(texto, ruta_salida, voz)
                print(f"[OK] {archivo}  <-  \"{texto}\"  ({voz})")
            ok += 1
        except Exception as e:
            print(f"[ERROR] {archivo}: {e}")
            error += 1

    print(f"\nListo. {ok} audio(s) generado(s), {error} con problema.")


if __name__ == "__main__":
    asyncio.run(main())
