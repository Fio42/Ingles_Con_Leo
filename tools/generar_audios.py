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
3. Ejecuta este comando UNA sola vez para instalar la herramienta:
       pip install edge-tts
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

VOCES DISPONIBLES (puedes dejarlo vacio para usar la voz por defecto):
   en-US-AriaNeural    (mujer, US, natural)
   en-US-GuyNeural     (hombre, US)
   en-GB-SoniaNeural   (mujer, UK)
   en-GB-RyanNeural    (hombre, UK)
Puedes escribir cualquiera de estas en la tercera columna del CSV si
quieres variar la voz de un audio en particular.
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
VOZ_POR_DEFECTO = "en-US-AriaNeural"


async def generar_uno(texto, ruta_salida, voz):
    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    communicate = edge_tts.Communicate(texto, voz)
    await communicate.save(ruta_salida)


async def main():
    if not os.path.exists(CSV_FILE):
        print(f"No encuentro el archivo {CSV_FILE}")
        print("Crea 'lista_audios.csv' en la misma carpeta que este script.")
        return

    solicitados = set(sys.argv[1:])
    filas = []
    with open(CSV_FILE, newline="", encoding="utf-8") as f:
        lector = csv.reader(f)
        for i, fila in enumerate(lector):
            if i == 0 and fila and fila[0].strip().lower() in ("archivo", "filename"):
                continue  # saltar encabezado si existe
            if not fila or not fila[0].strip():
                continue
            archivo = fila[0].strip()
            if solicitados and archivo not in solicitados:
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
            await generar_uno(texto, ruta_salida, voz)
            print(f"[OK] {archivo}  <-  \"{texto}\"  ({voz})")
            ok += 1
        except Exception as e:
            print(f"[ERROR] {archivo}: {e}")
            error += 1

    print(f"\nListo. {ok} audio(s) generado(s), {error} con problema.")


if __name__ == "__main__":
    asyncio.run(main())
