r"""
generar_audios_abecedario.py
---------------------------------
Genera UNICAMENTE los 32 audios nuevos de la guia "Abecedario en ingles":
   26 letras (letra-a.mp3 ... letra-z.mp3), el abecedario completo,
   la Z britanica (zed.mp3) y 4 ejemplos de deletreo (voz Jenny).

NO toca ningun otro audio del sitio: solo le pide a generar_audios.py
que genere esas filas puntuales del CSV.

COMO USARLO (desde la raiz del proyecto, sin entrar a "tools"):
       python tools\generar_audios_abecedario.py

Resultado esperado: "32 audio(s) generado(s), 0 con problema".
Si algun archivo falla con "No audio was received", vuelve a ejecutar el mismo
comando hasta que no quede ninguno con problema.
"""

import os
import subprocess
import sys

ARCHIVOS_NUEVOS = [
    "audio/articulos/abecedario/letra-a.mp3",
    "audio/articulos/abecedario/letra-b.mp3",
    "audio/articulos/abecedario/letra-c.mp3",
    "audio/articulos/abecedario/letra-d.mp3",
    "audio/articulos/abecedario/letra-e.mp3",
    "audio/articulos/abecedario/letra-f.mp3",
    "audio/articulos/abecedario/letra-g.mp3",
    "audio/articulos/abecedario/letra-h.mp3",
    "audio/articulos/abecedario/letra-i.mp3",
    "audio/articulos/abecedario/letra-j.mp3",
    "audio/articulos/abecedario/letra-k.mp3",
    "audio/articulos/abecedario/letra-l.mp3",
    "audio/articulos/abecedario/letra-m.mp3",
    "audio/articulos/abecedario/letra-n.mp3",
    "audio/articulos/abecedario/letra-o.mp3",
    "audio/articulos/abecedario/letra-p.mp3",
    "audio/articulos/abecedario/letra-q.mp3",
    "audio/articulos/abecedario/letra-r.mp3",
    "audio/articulos/abecedario/letra-s.mp3",
    "audio/articulos/abecedario/letra-t.mp3",
    "audio/articulos/abecedario/letra-u.mp3",
    "audio/articulos/abecedario/letra-v.mp3",
    "audio/articulos/abecedario/letra-w.mp3",
    "audio/articulos/abecedario/letra-x.mp3",
    "audio/articulos/abecedario/letra-y.mp3",
    "audio/articulos/abecedario/letra-z.mp3",
    "audio/articulos/abecedario/abecedario-completo.mp3",
    "audio/articulos/abecedario/zed.mp3",
    "audio/articulos/abecedario/deletrear-nombre.mp3",
    "audio/articulos/abecedario/deletrear-apellido.mp3",
    "audio/articulos/abecedario/deletrear-correo.mp3",
    "audio/articulos/abecedario/deletrear-pedido.mp3",
]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    generar_audios_path = os.path.join(script_dir, "generar_audios.py")
    if not os.path.exists(generar_audios_path):
        print("No encuentro generar_audios.py en esta carpeta.")
        print("Este script debe estar en la misma carpeta 'tools' que generar_audios.py.")
        sys.exit(1)

    print(f"Generando {len(ARCHIVOS_NUEVOS)} audios nuevos (abecedario)...\n")
    resultado = subprocess.run([sys.executable, generar_audios_path] + ARCHIVOS_NUEVOS)
    sys.exit(resultado.returncode)


if __name__ == "__main__":
    main()
