export function toDateObject(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, locale = 'fr-FR', options) {
  const date = toDateObject(value);

  if (!date) return '';

  return date.toLocaleDateString(locale, options);
}