# Plan: Spanish by Leo (clon de Inglés con Leo)

Base: commit `1650fa9` de Inglés con Leo. Misma estructura, mismo diseño, mismo sistema de miembros. Cambia el idioma que se enseña y el público (angloparlantes que aprenden español).

## 1. Copiar el proyecto (lo haces tú, 5 min)

Proyecto aparte, NO una rama de este repo. Así un cambio en uno nunca rompe el otro.

```bash
cd C:/Users/fiocc/OneDrive/Desktop
git clone inglesconLeo spanishbyLeo
```

Luego crea en GitHub el repo vacío `Fio42/Spanish_By_Leo` y conéctalo:

```bash
cd C:/Users/fiocc/OneDrive/Desktop/spanishbyLeo
git remote set-url origin https://github.com/Fio42/Spanish_By_Leo.git
git push -u origin main
```

(`node_modules` no viene en el clon; se reinstala con `npm install` si hace falta.)

**ANTES de publicar nada (GitHub Pages) en el clon:** cambia `CNAME` y las claves de `backend.js`. Si no, el clon apunta al Supabase y dominio reales de Inglés con Leo y escribiría usuarios en tu base actual. Deja Pages desactivado hasta terminar el paso 3.

## 2. El DEVLOG

- Renombrar `DEVLOG.txt` a `DEVLOG_inglesconleo.txt`: queda como manual de cómo está hecho todo (Claude lo lee para entender la base sin gastar tokens explorando).
- Crear un `DEVLOG.txt` nuevo que empiece con: "Clonado de Inglés con Leo (commit 1650fa9) el AAAA-MM-DD. Ver DEVLOG_inglesconleo.txt para la historia de la base."
- Cuando arregles algo de la base (bug de app.js, estilo, etc.) en un sitio, anótalo en el DEVLOG del otro como "pendiente portar".

## 3. Cosas que NO se pueden compartir (cuentas nuevas)

| Qué | Dónde está | Acción |
|---|---|---|
| Dominio | `CNAME` | spanishbyleo.com |
| Supabase (usuarios, pagos, Leo AI) | URL/keys en `backend.js`, `supabase_schema.sql`, `supabase_functions/` | Proyecto Supabase nuevo, correr el schema, redeploy de funciones |
| Pagos | `stripe-*`, `paypal-*`, `mp-*`, `create-checkout.ts` | Productos/precios nuevos (probablemente en USD; Mercado Pago quizá sobra) |
| Correos | `resend-webhook`, `*-email.ts` | Remitente/dominio nuevo en Resend |
| Meta Pixel | `meta-pixel.js` | Pixel nuevo o quitarlo |
| IndexNow | `41c1350951...txt`, `.github/workflows/indexnow.yml` | Llave nueva |
| Redes | carpetas `fb ig tt yt`, enlaces del footer | Cuentas nuevas o ocultar |
| SEO | canonicals, `sitemap.xml`, `robots.txt` | Cambiar dominio en todos |

## 4. Contenido a reemplazar (lo grande)

- Interfaz en inglés (explicaciones para el alumno), contenido a aprender en español.
- `data.js`, `juego-data.js`, `mini-lecciones.js`: bancos de gramática, vocabulario, listening, speaking, writing.
- Exámenes: TOEFL/IELTS/TOEIC/Cambridge pasan a DELE (A1-C2) y SIELE. Decidir si se borran o se adaptan.
- `articulo-*.html`: artículos nuevos (ser vs estar, por vs para, subjuntivo, pretérito vs imperfecto...).
- `audio/`: regenerar con los scripts de `tools/` usando voz TTS en español.
- LeoBot (`chatbot.js`) y prompt de Leo AI (`supabase_functions/leo-ai.ts`).
- Textos de index, sobre-leo, clases, precios, privacidad, baja, correos.

## 5. Prompt para pegarle a Claude en el proyecto nuevo

> Este proyecto es un clon de Inglés con Leo (lee DEVLOG_inglesconleo.txt y Claude outputs/PLAN_SPANISHBYLEO.md). Lo estamos convirtiendo en Spanish by Leo: enseña español a angloparlantes, interfaz en inglés. Mantén toda la estructura, diseño y lógica. Empecemos por el paso [N] del plan. Anota lo que hagas en DEVLOG.txt.

Orden recomendado: 3 (cuentas e infraestructura) → textos de index y navegación → `data.js` → audios → artículos → exámenes.
