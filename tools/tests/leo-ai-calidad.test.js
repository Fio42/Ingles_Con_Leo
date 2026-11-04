// Leo AI explain: el ejemplo no se duplica dentro de la explicación y el 2.º intento cambia de enfoque.
const assert = require('assert'), path = require('path');
const { loadServer } = require(path.join(__dirname, "..", "leo-ai-eval", "lib.js"));
function root0(){ return path.join(__dirname, '..', '..'); }
const S = loadServer(path.join(root0(), 'supabase_functions', 'leo-ai.ts'));
let n = 0;
function t(name, fn){ fn(); n++; console.log('  ok  ' + name); }
console.log('Leo AI calidad (servidor)');
t('stripInlineExample quita "Example: ... | traducción" y nombres de campos de la explicación', () => {
  assert.strictEqual(S.stripInlineExample("Usa 'an' antes de sonido de vocal. Example: I will arrive in an hour. | Llegaré en una hora."), "Usa 'an' antes de sonido de vocal.");
  assert.strictEqual(S.stripInlineExample("Piensa en el resultado. example_en: The medicine has a good effect."), "Piensa en el resultado.");
  assert.strictEqual(S.stripInlineExample("Texto normal sin ejemplo."), "Texto normal sin ejemplo.");
  assert.strictEqual(S.stripInlineExample("Por ejemplo, con años se usa since."), "Por ejemplo, con años se usa since."); // "Por ejemplo," no es el marcador
});
t('validateOutput(explain) entrega la explicación limpia y conserva example_en/example_es', () => {
  const chk = { base: '', shown: [], skill: 'grammar', correct: 'an', chosen: 'a', failed: true, question: 'I saw ___ elephant.' };
  const out = S.validateOutput('explain', { explanation: "Recuerda que 'hour' empieza con h muda, por eso lleva 'an'. Example: I will arrive in an hour. | Llegaré en una hora.", example_en: 'I will arrive in an hour.', example_es: 'Llegaré en una hora.' }, [], chk);
  assert(out && !/Example|Llegaré/.test(out.explanation), JSON.stringify(out));
  assert.strictEqual(out.example_en, 'I will arrive in an hour.');
});
t('si tras limpiar la explicación queda vacía/corta, es mala salida (null)', () => {
  assert.strictEqual(S.validateOutput('explain', { explanation: 'Example: He had left. | Se había ido.', example_en: 'He had left.', example_es: 'Se había ido.' }, [], undefined), null);
});
t('hasShapeTrick descarta "palabras que terminan en s" como truco y deja pasar usos legítimos', () => {
  assert.strictEqual(S.hasShapeTrick("Piensa que 'many' acompaña a palabras que terminan en 's' cuando son plurales."), true);
  assert.strictEqual(S.hasShapeTrick('Los verbos regulares terminan en -ed en pasado.'), false);
  assert.strictEqual(S.hasShapeTrick('Usa many con sustantivos que se pueden contar.'), false);
  const chk = { base: '', shown: [], skill: 'grammar', correct: 'many', chosen: 'much', failed: true, question: 'I have ___ books.' };
  assert.strictEqual(S.validateOutput('explain', { explanation: "Como 'books' tiene esa 's' al final, necesitas usar many; termina en 's' y por eso es plural.", example_en: '', example_es: '' }, [], chk), null);
});
console.log(n + ' pruebas pasaron');
