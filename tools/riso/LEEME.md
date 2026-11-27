# Riso · identidad visual y primeras animaciones (27 nov 2026)

Estado: demostración local (`tools/riso-demo/index.html`), sin publicar y sin usar todavía en la academia.

## Qué se hizo

- Se respetó el diseño entregado: no se redibujó ni se sustituyó al personaje. Las capas salen de `riso-poses-original.png` (las 4 poses con fondo ya transparente). La imagen con el nombre «Riso» no se usa en el personaje (regla: sin texto incorporado).
- Se quitó la sombra del suelo (en tema oscuro se veía como una mancha) y la burbuja de pensamiento, que se dibuja aparte para poder animar sus puntos.
- 4 estados: **neutro** (imagen principal, ambos ojos abiertos), **bienvenida** (saludo con la mano + entrada corta), **celebración** (guiño + pulgar arriba + pequeño salto), **pensando** (balanceo leve + burbuja con puntos).
- Movimiento: las llamas ondulan con un filtro SVG que solo actúa en la zona de llamas (máscara por pose); el cuerpo respira; parpadea con párpados generados a partir de la piel de la ilustración; la mano del saludo y la del pulgar son capas separadas que giran sobre el codo o la muñeca.
- Fondo transparente, sin líneas decorativas, compatible con tema claro y oscuro. Con «reducir movimiento» queda quieto (también se detiene cuando no está en pantalla).
- Nombre visible en una sola constante: `RISO_CONFIG.nombre = 'Riso'` (riso.js).

## Tecnología elegida y alternativas evaluadas

| Opción | Resultado | Decisión |
| --- | --- | --- |
| Capas WebP + CSS + filtro SVG (actual) | 9 capas, unos 160 KB para los 4 estados juntos; fluida y nítida; se amplía añadiendo capas | Elegida para esta fase |
| Secuencia de cuadros (WebP animado / sprites) | Medido: 1,2 a 1,9 MB por estado a 24 fps | Descartada por peso en el teléfono |
| Lottie | Necesita el personaje en vectores; con mapas de bits pesa y pierde calidad | No aplica con el arte actual |
| Rive | La mejor opción profesional a largo plazo (máquina de estados, transiciones naturales, unos 150 KB de motor) | Recomendada cuando haya arte vectorial por capas |

## Archivos

- `riso/riso.js`, `riso/riso.css`: componente (`Riso.montar(el, {estado, alto})`, `.estado('celebracion')`, `.quieto(true)`).
- `riso/img/`: capas WebP (figura o cuerpo, mano, párpados) y máscaras de llamas por pose.
- `tools/riso/animar.py`, `tools/riso/capas.py`: generan las capas desde las ilustraciones originales.
- `tools/riso-demo/index.html`: demostración (estados, transición, tamaños, ejemplos de uso en el tutor y en un logro).

## Qué pedir al ilustrador para animaciones profesionales

1. Archivo por capas (SVG o PSD) del personaje neutro: llama superior, llamas laterales, cabeza, ojos abiertos, párpados cerrados, cejas, boca (2 o 3 formas), mejillas, audífonos (diadema y cada auricular), sudadera, cada brazo en 2 partes y cada mano, piernas.
2. Manos sueltas: abierta (saludo), pulgar arriba, mano en la barbilla (pensando).
3. PNG transparentes de cada pose a 1200 px de alto o más (las poses pequeñas de la hoja miden unos 410 px de alto).
4. Futuras expresiones: sorpresa, ánimo tras un error, escuchando (con un auricular resaltado), escribiendo.

## Limitaciones de esta versión

- El parpadeo y los cortes de los brazos se generaron a partir de la ilustración plana: a 2x de zoom se nota alguna imperfección mínima en el borde del ojo durante el parpadeo (dura 0,12 s).
- Las poses de saludo, guiño y pensando tienen menos resolución que la neutra; se ven nítidas hasta unos 200 px de alto.
