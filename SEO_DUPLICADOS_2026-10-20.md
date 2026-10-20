# Pares espejo del glosario: analisis y recomendacion (2026-10-20)

Estado: SOLO DOCUMENTADO. No se cambio ninguna URL, canonical ni sitemap por este tema. Requiere decision de Leo.

## Datos (texto principal de cada ficha, similitud por palabras)
| Par | Similitud | Palabras | Plantilla | Enlaces entrantes (articulos y fichas) | Veredicto |
|---|---|---|---|---|---|
| borrow-vs-lend / lend-vs-borrow | 0,33 | 175 / 146 | no / si | 1 / 0 | Casi duplicados en tema, textos distintos. |
| complement-vs-compliment / compliment-vs-complement | 0,73 | 140 / 149 | si / si | 0 / 0 | Duplicado real. |
| expect-vs-wait / wait-vs-expect | 0,77 | 148 / 148 | si / si | 0 / 0 | Duplicado real. |
| farther-vs-further / further-vs-farther | 0,72 | 148 / 150 | si / si | 0 / 0 | Duplicado real. |
| job-vs-work / work-vs-job | 0,69 | 159 / 152 | si / si | 0 / 0 | Duplicado real. |
| lose-vs-miss / miss-vs-lose | 0,73 | 156 / 156 | si / si | 0 / 0 | Duplicado real. |
| rob-vs-steal / steal-vs-rob | 0,77 | 142 / 151 | si / si | 0 / 0 | Duplicado real. |
| than-vs-then / then-vs-than | 0,25 | 146 / 317 | si / no | 0 / 1 | Misma duda; `then-vs-than` es mucho mas completa. |

Search Console (28 dias, revisado el 2026-10-20): 3 de las 16 URLs ya tienen impresiones: `than-vs-then` (24 imp, pos 37,9), `lose-vs-miss` (17 imp, pos 11,7) y `borrow-vs-lend` (17 imp, pos 54,1). Ninguna tiene clics. Las otras 13 no aparecen con impresiones.

## Recomendacion (para decidir por separado)
1. Los 6 pares de plantilla (similitud 0,69-0,77): elegir UNA URL principal por par y dejar la otra con `rel="canonical"` hacia la principal y fuera del sitemap. La pagina secundaria sigue existiendo y enlazando; no se borra ni se redirige. Principal sugerida: la primera de cada fila de la tabla; en `lose-vs-miss` y `borrow-vs-lend` coincide con la que ya tiene impresiones.
2. `borrow-vs-lend` y `lend-vs-borrow`: el texto es distinto y ya hay una ficha manual. Opcion: dejar `borrow-vs-lend` como principal (manual, 1 enlace entrante) y canonicalizar la otra, copiando a la principal el ejemplo de `lend-vs-borrow` si aporta.
3. `than-vs-then` / `then-vs-than`: `than-vs-then` es la que ya recibe impresiones (24), pero es de plantilla; `then-vs-than` es la completa (317 palabras, 1 enlace entrante). Lo seguro: dejar `than-vs-then` como principal y pasarle antes el contenido de `then-vs-than`; solo despues canonicalizar la otra.
4. Actualizar los enlaces del hub y de las fichas para que apunten a la principal.

## Impacto y riesgos
- Impacto esperado: pequeno hoy (ninguna tiene clics; solo 3 tienen impresiones); sirve para no dispersar senales y reducir 8 URLs casi vacias del sitemap.
- Riesgo: bajo. Si Google ya hubiese indexado la secundaria, el canonical es una sugerencia, no una orden; hay que revisar en Search Console a los 14-30 dias.
- No usar redirecciones 301: GitHub Pages no las admite a nivel de servidor y una redireccion por meta refresh no es lo recomendable.
- Antes de hacerlo: volver a revisar en Search Console cuales de las 16 URLs tienen impresiones y no tocar la que ya las recibe sin pasarle antes el mejor contenido.
