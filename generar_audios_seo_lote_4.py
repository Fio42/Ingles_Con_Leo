"""Genera audio US para Lote SEO 4; nunca sobrescribe archivos existentes."""
import asyncio, tempfile
from pathlib import Path
import edge_tts
ROOT=Path(__file__).resolve().parent; ARIA='en-US-AriaNeural'; GUY='en-US-GuyNeural'
D=[('audio/articulos/ingles-aeropuerto/check-in.mp3',[(ARIA,'Good morning. May I see your passport, please?'),(GUY,'Sure. Here you are.'),(ARIA,'Are you checking any bags?'),(GUY,'Yes, one suitcase.'),(ARIA,'Great. Your gate is B twelve. Boarding starts at two thirty.')]),('audio/articulos/ingles-aeropuerto/announcement.mp3',[(ARIA,'Attention passengers: flight four twenty to Miami is delayed by forty minutes. The new departure time is five ten.')]),('audio/articulos/ingles-restaurante/dialogo.mp3',[(GUY,'Good evening. Do you have a reservation?'),(ARIA,'No, but could we have a table for two, please?'),(GUY,'Of course. Here are the menus. Would you like something to drink?'),(ARIA,'I would like water, please. Is the chicken spicy?'),(GUY,'It is a little spicy, but we can make it mild.'),(ARIA,'Perfect. I will have the chicken, please.')]),('audio/articulos/ingles-restaurante/check.mp3',[(ARIA,'Could we have the check, please?'),(GUY,'Certainly. I will bring it right over.')])]
async def speak(p,t,v): await edge_tts.Communicate(t,v,rate='-5%').save(str(p))
async def make(rel,lines):
 p=ROOT/rel
 if p.exists(): print('SKIP',rel); return
 p.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory() as d:
  parts=[]
  for i,(v,t) in enumerate(lines): q=Path(d)/f'{i}.mp3'; await speak(q,t,v); parts.append(q)
  with p.open('xb') as o:
   for q in parts:o.write(q.read_bytes())
 print('OK',rel)
async def main():
 for x in D: await make(*x)
asyncio.run(main())
