# Enlaces para tus videos (video -> tema -> ejercicios)

Pega el enlace de cada video en la descripcion o el enlace de tu perfil cuando publiques. Cambia `RED` por `youtube`, `instagram`, `tiktok` o `facebook`. Asi GA4 muestra de que red llegaron y a que tema.

Formato: `https://inglesconleo.com/<destino>&utm_source=RED&utm_medium=video&utm_campaign=<tema>`

| Video | Destino (con ejercicios gratis y el video dentro) | utm_campaign |
|---|---|---|
| In, On y At | `practica.html?skill=grammar&tema=in-on-at` | in-on-at |
| Then vs Than | `practica.html?skill=grammar&tema=then-vs-than` | then-vs-than |
| A vs An | `practica.html?skill=grammar&tema=a-an` | a-an |
| am, is, are | `practica.html?skill=grammar&tema=to-be-presente` | to-be-presente |
| Quiet vs Quite / Advice | `practica.html?skill=grammar&tema=palabras-parecidas` | palabras-parecidas |

Videos sin ejercicios gratis del tema (llevan a la explicacion): To vs Too `glosario/to-vs-too-vs-two/`, Remember vs Remind `glosario/remember-vs-remind/`, Rise vs Raise `glosario/raise-vs-rise/`, Wrote vs Written `articulo-verbos-irregulares.html`. Para estos usa `?utm_source=RED&utm_medium=video&utm_campaign=<tema>` (con `?`, porque no tienen parametros).

Ejemplo completo: `https://inglesconleo.com/practica.html?skill=grammar&tema=then-vs-than&utm_source=tiktok&utm_medium=video&utm_campaign=then-vs-than`

Videos nuevos: agrega una linea en `video-tema.js` (lista VIDEOS) y aparece solo en la galeria y en la practica de su tema.
