"""
generar_audios_articulos_lote2.py
Genera los 6 audios de la guia "Articulos en ingles: a, an, the" (voz US Ava).
Reutiliza generar_audios.py y los textos de lista_audios.csv. NO sobrescribe
audios que ya existen (usa --forzar si de verdad quieres rehacerlos).

Instalacion (una vez):   pip install -U edge-tts
Comando (desde la carpeta inglesconLeo):
    python tools/generar_audios_articulos_lote2.py
Rehacer todos:           python tools/generar_audios_articulos_lote2.py --forzar
Archivos: audio/articulos/articulos-a-an-the/frase-01.mp3 ... frase-06.mp3
"""
import asyncio, csv, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generar_audios as g

PREFIJO = "audio/articulos/articulos-a-an-the/"

async def main():
    forzar = "--forzar" in sys.argv
    with open(g.CSV_FILE, newline="", encoding="utf-8") as f:
        filas = [r for r in csv.reader(f) if r and r[0].strip().startswith(PREFIJO)]
    if len(filas) != 6:
        print("Se esperaban 6 filas en lista_audios.csv y hay", len(filas)); return
    ok = saltados = errores = 0
    for r in filas:
        archivo, texto = r[0].strip(), r[1].strip()
        voz = r[2].strip() if len(r) > 2 and r[2].strip() else g.VOZ_POR_DEFECTO
        ruta = os.path.join(g.PROJECT_ROOT, archivo)
        if os.path.exists(ruta) and not forzar:
            print(f"[YA EXISTE, NO SE TOCA] {archivo}"); saltados += 1; continue
        try:
            await g.generar_uno(texto, ruta, voz)
            print(f'[OK] {archivo}  <-  "{texto}"'); ok += 1
        except Exception as e:
            print(f"[ERROR] {archivo}: {e}"); errores += 1
    print(f"\nListo: {ok} generados, {saltados} ya existian, {errores} con error.")

if __name__ == "__main__":
    asyncio.run(main())
