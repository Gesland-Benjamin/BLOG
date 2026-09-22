import test from 'node:test';
import assert from 'node:assert/strict';
import { formatArticleText, articlePlainText } from '../public/js/article-format.js';

test('gras, italique et styles combinés', () => {
  assert.equal(formatArticleText('**Bonjour** _vous_'), '<strong>Bonjour</strong> <em>vous</em>');
  assert.equal(formatArticleText('**_Bonjour_**'), '<strong><em>Bonjour</em></strong>');
  assert.equal(formatArticleText('_**Bonjour**_'), '<em><strong>Bonjour</strong></em>');
});

test('texte existant, images inline et marqueurs incomplets conservés', () => {
  const text = 'Un texte\navec [[IMAGE_INLINE]] et fichier_test_photo.\n\n**incomplet';
  assert.equal(formatArticleText(text), text);
  assert.equal(formatArticleText('**un\n\ndeux**'), '**un\n\ndeux**');
});

test('HTML malveillant échappé, y compris dans la mise en forme', () => {
  assert.equal(formatArticleText('**<script>alert("x")</script>**'), '<strong>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</strong>');
  assert.equal(formatArticleText('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});

test('extraits sans marqueurs, texte et entités préservés', () => {
  assert.equal(articlePlainText('**_Bonjour_** & <monde>'), 'Bonjour & <monde>');
  assert.equal(articlePlainText('&lt;script&gt;'), '&lt;script&gt;');
});

test('boutons : sélection, combinaison, retrait et aperçu', async () => {
  const handlers = {};
  const content = {
    value: 'Bonjour', selectionStart: 0, selectionEnd: 7,
    setRangeText(text, start, end) {
      this.value = this.value.slice(0, start) + text + this.value.slice(end);
      this.setSelectionRange(start, start + text.length);
    },
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
    focus() {},
    addEventListener(name, handler) { handlers[name] = handler; },
    dispatchEvent(event) { handlers[event.type]?.(event); }
  };
  const toolbar = { addEventListener(name, handler) { handlers.click = handler; } };
  const preview = { parentElement: { hidden: true } };
  globalThis.document = {
    getElementById(id) { return id === 'content' ? content : preview; },
    querySelector() { return toolbar; }
  };
  try {
    await import('../public/js/article-editor.js');
    const click = marker => handlers.click({ target: { closest() { return { dataset: { format: marker } }; } } });
    click('**');
    assert.equal(content.value, '**Bonjour**');
    click('_');
    assert.equal(preview.innerHTML, '<strong><em>Bonjour</em></strong>');
    click('_');
    click('**');
    assert.equal(content.value, 'Bonjour');
    handlers.keydown({ ctrlKey: true, key: 'i', preventDefault() {} });
    assert.equal(content.value, '_Bonjour_');
  } finally {
    delete globalThis.document;
  }
});
