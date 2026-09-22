// Données HTML séparées du code : aucune interpolation dans un handler inline.
document.addEventListener('submit', event => {
  const message = event.submitter?.dataset.confirm || event.target.dataset.confirm;
  if (message && !window.confirm(message)) event.preventDefault();
});
document.addEventListener('click', event => {
  if (event.target.closest('[data-reload]')) return window.location.reload();
  const button = event.target.closest('[data-delete-file], [data-clean-orphans]');
  if (!button) return;
  if (!window.confirm('Confirmer cette opération sur les médias ?')) return;
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = button.hasAttribute('data-clean-orphans') ? '/admin/medias/clean-orphans' : `/admin/medias/${encodeURIComponent(button.dataset.deleteFile)}?_method=DELETE`;
  const token = document.createElement('input');
  token.type = 'hidden'; token.name = '_csrf';
  token.value = document.querySelector('meta[name="csrf-token"]').content;
  form.append(token); document.body.append(form); form.submit();
});
