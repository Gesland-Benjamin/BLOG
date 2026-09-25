import { formatArticleText, articlePlainText } from './article-format.js';

function inline(text) {
  return formatArticleText(text).replace(/\[([^\]\n]+)\]\((\/article\/[a-zA-Z0-9-]+)\)/g, '<a href="$2">$1</a>');
}
export function renderArticleContent(value = '') {
  const toc = [], seen = new Map();
  const blocks = String(value).replace(/\[\[IMAGE_INLINE\]\]/g, '\n\n[[IMAGE_INLINE]]\n\n').split(/\n\s*\n/);
  const html = blocks.map(block => {
    const output = [], paragraph = [];
    let listType = null, listItems = [];
    const flushList = () => {
      if (listType) output.push(`<${listType}>${listItems.map(item => `<li>${inline(item)}</li>`).join('')}</${listType}>`);
      listType = null; listItems = [];
    };
    const flush = () => { if (paragraph.length) output.push(`<p>${inline(paragraph.splice(0).join('\n')).replace(/\n/g, '<br>')}</p>`); };
    for (const line of block.trim().split('\n')) {
      const list = /^(?:[-*]\s+|\d+\.\s+)(.+)$/.exec(line);
      if (list) {
        flush();
        const type = /^\d/.test(line) ? 'ol' : 'ul';
        if (listType !== type) flushList();
        listType = type; listItems.push(list[1]);
        continue;
      }
      flushList();
      const heading = /^(#{2,3})\s+(.+)$/.exec(line);
      if (!heading) { if (line) paragraph.push(line); continue; }
      flush();
      const label = articlePlainText(heading[2]);
      const base = 'section-' + (label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'titre');
      const count = (seen.get(base) || 0) + 1; seen.set(base, count);
      const id = base + (count > 1 ? `-${count}` : '');
      const level = heading[1].length;
      if (level === 2) toc.push({ id, label });
      output.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`);
    }
    flush(); flushList();
    return output.join('');
  }).join('');
  return { html, toc: toc.length >= 2 ? toc : [] };
}
