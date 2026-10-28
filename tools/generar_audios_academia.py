"""Genera los audios en ingles de la Academia (todos los cursos) con Kokoro TTS: local, gratis, sin internet.

Fuente unica: academiaAudioTexts() de academia-data.js (los textos que la pagina muestra con boton de audio).
Asi el audio SIEMPRE corresponde al texto mostrado. Escribe tambien academia-audio.js (texto -> archivo),
que es lo que lee la pagina para decidir que boton mostrar.

Voces (las mismas de los articulos): f = af_heart (todas las frases), m = am_michael (segundo hablante de un dialogo).
Velocidad 0.9, pensada para principiantes. Las grabaciones de Leo (audio/aprender/to-be/exp-*.mp3) no se tocan.

Uso (desde la raiz del repo):
    python tools/generar_audios_academia.py            # crea solo los que faltan y limpia los que ya no se usan
    python tools/generar_audios_academia.py --force    # regenera todos
Requiere: pip install kokoro-onnx lameenc, Node.js y los modelos en tools/.kokoro-models o KOKORO_DIR.
"""
import hashlib, json, os, subprocess, sys
import numpy as np
import lameenc
from kokoro_onnx import Kokoro

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
MODELOS = os.environ.get("KOKORO_DIR") or os.path.join(AQUI, ".kokoro-models")
VOCES = {"f": "af_heart", "m": "am_michael"}
VELOCIDAD = 0.9
RMS_OBJETIVO = 0.07
CURSOS = os.environ.get("ACADEMIA_CURSOS", "to-be,pronombres,articulos").split(",")


def textos(curso):
    """Devuelve (protegido, textos). Un curso protegido (protected:true) trae su contenido de private/contenido/<curso>.json
    (tools/academia_fuente.js); si ese archivo no existe se omite."""
    js = ("const F=require(%s);const r=F.load();const c=r.A.courses[%s];"
          "console.log(JSON.stringify({p:!!c.protected,h:!!c.hydrated,l:c.hydrated?r.TX(c):[]}));") % (
        json.dumps(os.path.join(AQUI, "academia_fuente.js")), json.dumps(curso))
    r = json.loads(subprocess.check_output(["node", "-e", js], text=True, encoding="utf-8"))
    return r["p"], r["h"], r["l"]


def nombre(voz, texto):
    return hashlib.sha1((voz + "|" + texto).encode("utf-8")).hexdigest()[:10] + ".mp3"


def a_mp3(samples, sr):
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(96); enc.set_in_sample_rate(sr); enc.set_channels(1); enc.set_quality(2)
    return enc.encode(pcm.tobytes()) + enc.flush()


def main():
    force = "--force" in sys.argv[1:]
    k = Kokoro(os.path.join(MODELOS, "kokoro-v1.0.onnx"), os.path.join(MODELOS, "voices-v1.0.bin"))
    manifest, hechos, total = {}, 0, 0
    usados_por_curso = {}
    for curso in CURSOS:
        protegido, hidratado, lista = textos(curso)
        if protegido and not hidratado:
            print("[omitido] %s es un curso protegido y falta private/contenido/%s.json" % (curso, curso)); continue
        # Curso PROTEGIDO: sus mp3 NO van a audio/academia (publico) sino a private/audio/<curso> (se suben al almacenamiento privado)
        # y su texto->archivo NO entra en academia-audio.js (publico): va en private/contenido/<curso>.audio.json y lo entrega el servidor.
        carpeta = ("private/audio/" if protegido else "audio/academia/") + curso
        destino_dir = os.path.join(RAIZ, carpeta)
        os.makedirs(destino_dir, exist_ok=True)
        usados = usados_por_curso.setdefault(carpeta, set())
        privado = {}
        for it in lista:
            t, v = it["t"], it["v"]
            if not protegido and t in manifest:   # un texto que ya tiene audio (de otro curso) se reutiliza: el audio no cambia
                continue
            total += 1
            f = nombre(v, t)
            usados.add(f)
            ruta = os.path.join(destino_dir, f)
            if protegido: privado[t] = curso + "/" + f
            else: manifest[t] = {"f": carpeta + "/" + f, "v": v}
            if os.path.exists(ruta) and not force:
                continue
            s, sr = k.create(t, voice=VOCES[v], speed=VELOCIDAD, lang="en-us")
            rms = float(np.sqrt(np.mean(np.square(s)))) or 1.0
            s = s * (RMS_OBJETIVO / rms)
            pico = float(np.max(np.abs(s))) or 1.0
            if pico > 0.92:
                s = s * (0.92 / pico)
            audio = np.concatenate([np.zeros(int(sr * 0.05), dtype=np.float32), s, np.zeros(int(sr * 0.2), dtype=np.float32)])
            with open(ruta, "wb") as fh:
                fh.write(a_mp3(audio, sr))
            hechos += 1
            print("[OK] %-45s %.1fs" % (t[:45], len(audio) / sr))
        if protegido:
            with open(os.path.join(RAIZ, "private", "contenido", curso + ".audio.json"), "w", encoding="utf-8") as fh:
                json.dump(privado, fh, ensure_ascii=False, indent=1)
    for carpeta, usados in usados_por_curso.items():
        d = os.path.join(RAIZ, carpeta)
        for viejo in os.listdir(d):
            if viejo.endswith(".mp3") and viejo not in usados:
                os.remove(os.path.join(d, viejo)); print("[quitado] " + viejo)
    with open(os.path.join(RAIZ, "academia-audio.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Generado por tools/generar_audios_academia.py. No editar a mano. */\nvar ACADEMIA_AUDIO = "
                 + json.dumps(manifest, ensure_ascii=False, indent=1) + ";\n")
    print("Listo: %d creados, %d textos en total." % (hechos, total))


if __name__ == "__main__":
    main()
