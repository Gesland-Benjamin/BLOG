import test from 'node:test';
import assert from 'node:assert/strict';

test('trame : insertion sans écrasement, aperçu des listes et conseil de personnalisation', async () => {
  const handlers = {}, buttons = {};
  const content = {
    value: 'Texte personnel à conserver', selectionStart: 6, selectionEnd: 15,
    setRangeText(value, start, end) { this.value = this.value.slice(0, start) + value + this.value.slice(end); },
    addEventListener(name, fn) { handlers[name] = fn; },
    dispatchEvent(event) { handlers[event.type]?.(event); }, focus() {}
  };
  const template = { addEventListener(name, fn) { buttons[name] = fn; } };
  const feedback = { setAttribute() {} };
  const preview = { parentElement: { hidden: true } };
  const toolbar = { addEventListener() {} };
  globalThis.document = {
    getElementById(id) { return { content, 'insert-article-template': template, 'article-content-preview': preview, 'article-writing-feedback': feedback }[id] || null; },
    querySelector() { return toolbar; }
  };
  try {
    await import('../public/js/article-editor.js');
    buttons.click();
    assert.ok(content.value.startsWith('Texte '));
    assert.ok(content.value.endsWith('personnel à conserver'));
    assert.match(preview.innerHTML, /<ul><li>/);
    assert.match(preview.innerHTML, /<h2 /);
    assert.match(feedback.textContent, /personnaliser/);
    content.value = '### Sous-section isolée\n- un\n- deux';
    content.dispatchEvent(new Event('input'));
    assert.match(feedback.textContent, /Ajoutez une section H2/);
  } finally { delete globalThis.document; }
});
