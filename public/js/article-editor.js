import { renderArticleContent } from './article-content.js';
import { formatArticleText } from './article-format.js';

const content = document.getElementById('content');
const toolbar = document.querySelector('.article-format-toolbar');
const preview = document.getElementById('article-content-preview');

if (content && toolbar && preview) {
  const updatePreview = () => {
    preview.innerHTML = /^(?:#{2,3} |[-*] |\d+\. )|\]\(\/article\//m.test(content.value) ? renderArticleContent(content.value).html : formatArticleText(content.value);
    const feedback = document.getElementById('article-writing-feedback');
    if (feedback?.setAttribute) {
      const words = content.value.trim().split(/\s+/).filter(Boolean).length;
      const tips = [];
      if (/^#\s/m.test(content.value)) tips.push('Utilisez ## pour les sections : le titre principal est déjà affiché.');
      if (/^###\s/m.test(content.value) && !/^##\s/m.test(content.value)) tips.push('Ajoutez une section H2 avant vos sous-sections H3.');
      if (!/\]\(\/article\//.test(content.value)) tips.push('Pensez à un lien vers un article qui complète votre propos.');
      if (/\[(?:Votre|Une|Présentez|Répondez|Racontez|Invitez|Ajoutez)/.test(content.value)) tips.push('Il reste des indications de la trame à personnaliser.');
      feedback.textContent = `${words} mots. ${tips.join(' ')}`;
    }
  };

  function format(marker) {
    let start = content.selectionStart;
    let end = content.selectionEnd;
    const selected = content.value.slice(start, end);
    const wrapped = start >= marker.length &&
      content.value.slice(start - marker.length, start) === marker &&
      content.value.slice(end, end + marker.length) === marker;

    if (wrapped) {
      content.setRangeText(selected, start - marker.length, end + marker.length, 'select');
    } else {
      const text = selected || 'votre texte';
      content.setRangeText(marker + text + marker, start, end, 'select');
      start += marker.length;
      content.setSelectionRange(start, start + text.length);
    }
    content.focus();
    content.dispatchEvent(new Event('input', { bubbles: true }));
  }

  toolbar.addEventListener('click', event => {
    const button = event.target.closest('[data-format]');
    if (button) format(button.dataset.format);
  });
  content.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && ['b', 'i'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      format(event.key.toLowerCase() === 'b' ? '**' : '_');
    }
  });
  content.addEventListener('input', updatePreview);
  toolbar.hidden = false;
  preview.parentElement.hidden = false;
  updatePreview();
}

const insertLink = document.getElementById('insert-article-link');
insertLink?.addEventListener?.('click', () => {
  const select = document.getElementById('internal-article');
  if (!select?.value || !content) return;
  const label = select.options[select.selectedIndex].textContent.replace(/[\[\]\r\n]/g, '');
  content.setRangeText(`[${label}](${select.value})`, content.selectionStart, content.selectionEnd, 'end');
  content.dispatchEvent(new Event('input', { bubbles: true }));
  content.focus();
});

document.getElementById('insert-article-template')?.addEventListener?.('click', () => {
  if (!content) return;
  const template = '\n\n[Présentez en quelques phrases la question et ce que vous allez partager.]\n\n## [Votre première grande idée]\n\n[Répondez à la question avec votre expérience et un exemple concret.]\n\n### [Une précision utile]\n\n[Ajoutez une nuance ou un conseil.]\n\n## [Votre deuxième grande idée]\n\n- [Une première piste concrète]\n- [Une deuxième piste concrète]\n\n## Ce que j’en retiens\n\n[Racontez ce qui vous semble essentiel, avec vos mots.]\n\n[Invitez vos lecteurs à partager leur expérience ou à poursuivre la lecture. Insérez un lien avec le sélecteur d’articles.]\n';
  // Insert only: even a selected passage is preserved.
  content.setRangeText(template, content.selectionStart, content.selectionStart, 'end');
  content.dispatchEvent(new Event('input', { bubbles: true }));
  content.focus();
});
