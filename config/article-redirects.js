// Optional legacy slug → current slug mapping, reviewed in source control.
// No database update. Keep existing article slugs stable whenever possible.
// Example: 'ancien-titre-35': 'titre-actuel-35'
export const articleRedirects = Object.freeze({});

export function resolveArticleSlug(slug) {
  const target = Object.hasOwn(articleRedirects, slug) ? articleRedirects[slug] : slug;
  return typeof target === 'string' && /^[a-z0-9-]+$/.test(target) ? target : slug;
}
