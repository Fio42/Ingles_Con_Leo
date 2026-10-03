"""Convierte los WAV de Leo (audio/leo/originales o una carpeta) a MP3 web:
mono, ~64 kbps, normalizados a -18 LUFS con techo true peak -2 dBTP (loudnorm de 2 pasadas).
Uso: python tools/preparar_audios_leo.py <carpeta_con_wavs>"""
import sys, json, re, subprocess, pathlib
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
NOMBRES = ['bienvenida','vas-mejorando','sigue-tema','buen-trabajo','puedes-mejorar','casi-dominas','repasa-antes']
src = pathlib.Path(sys.argv[1]); dst = pathlib.Path(__file__).resolve().parent.parent / 'audio' / 'leo'
T = 'I=-18:TP=-2:LRA=11'
def run(args): return subprocess.run([FF,'-hide_banner','-nostats']+args, capture_output=True, text=True)
for n in NOMBRES:
    wav = src / f'{n}.wav'
    r = run(['-i',str(wav),'-af',f'loudnorm={T}:print_format=json','-f','null','-'])
    m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S).group(0))
    af = (f"loudnorm={T}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,alimiter=limit=0.79:level=disabled")
    out = dst / f'{n}.mp3'
    r = run(['-y','-i',str(wav),'-af',af,'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','64k',str(out)])
    # verificacion sobre el MP3 final
    v = run(['-i',str(out),'-af','loudnorm=I=-18:TP=-2:LRA=11:print_format=json','-f','null','-'])
    o = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', v.stderr, re.S).group(0))
    print(f"{n}: entrada {m['input_i']} LUFS / {m['input_tp']} dBTP -> salida {o['input_i']} LUFS / {o['input_tp']} dBTP, {out.stat().st_size} bytes")
