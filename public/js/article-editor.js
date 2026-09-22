import { formatArticleText } from './article-format.js';

const content = document.getElementById('content');
const toolbar = document.querySelector('.article-format-toolbar');
const preview = document.getElementById('article-content-preview');

if (content && toolbar && preview) {
  const updatePreview = () => {
    preview.innerHTML = formatArticleText(content.value);
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
