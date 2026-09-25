import { randomUUID } from 'node:crypto';
import { appUrl } from './security.js';
import { articlePlainText } from '../public/js/article-format.js';

export function slugify(value) {
  return String(value || '').toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 170).replace(/-$/g, '') || 'article';
}
// A unique index remains the final authority, including concurrent requests.
export const newSlug = title => `${slugify(title)}-${randomUUID()}`;
export const articlePath = article => `/article/${encodeURIComponent(article.slug || article.id)}`;
export function isoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
export const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export function authorPath(author) {
  return author && ((process.env.EMI_AUTHOR_ID && String(author.id) === process.env.EMI_AUTHOR_ID) || (process.env.EMI_AUTHOR_EMAIL && author.email?.toLowerCase() === process.env.EMI_AUTHOR_EMAIL.toLowerCase())) ? '/auteur/emilie' : null;
}
export function articleSeo(article) {
  const canonical = appUrl() + articlePath(article);
  const description = article.meta_description?.trim() || articlePlainText(article.content || '')
    .replace(/\[\[IMAGE_INLINE\]\]/g, '').replace(/^#{2,3}\s+/gm, '').replace(/\s+/g, ' ').trim().slice(0, 160) || article.title;
  let image = appUrl() + '/logo%203.png';
  try {
    const candidate = new URL(article.image || '/logo%203.png', appUrl());
    if (['https:', 'http:'].includes(candidate.protocol)) image = candidate.href;
  } catch { /* Invalid legacy image URLs fall back without breaking the page. */ }
  const published = isoDate(article.published_at || article.created_at);
  const modified = isoDate(article.updated_at);
  const authorUrl = authorPath(article.author);
  const schema = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title,
    description, image, mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    ...(published ? { datePublished: published } : {}), ...(modified ? { dateModified: modified } : {}),
    ...(article.author?.name ? { author: { '@type': 'Person', name: article.author.name,
      ...(authorUrl ? { url: appUrl() + authorUrl } : {}) } } : {}),
    publisher: { '@type': 'Organization', name: "Emi'Pulse", url: appUrl() }
  };
  return { title: article.seo_title?.trim() || article.title, description, canonical, image, type: 'article', schema, published, modified };
}
export function breadcrumbSchema(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({
    '@type': 'ListItem', position: index + 1, name: item.name, item: appUrl() + item.path
  })) };
}
export function seoLocals(req, res, next) {
  const page = /^\d+$/.test(req.query.page || '') ? Math.max(1, Math.min(10000, Number(req.query.page))) : 1;
  const path = req.path.replace(/\/$/, '') || '/';
  const paginated = /^\/(article\/categorie\/|archive\/|auteur\/)/.test(path);
  res.locals.seo = {
    title: ({ '/': 'Accueil', '/article': 'Articles', '/a-propos': 'Qui est Emi ?', '/auteur/emilie': 'Émilie', '/renseignements': 'Contact', '/mentions-legales': 'Mentions légales' })[path] || "Emi'Pulse",
    description: "Les articles et les partages d’Emi sur Emi’Pulse.",
    canonical: appUrl() + path + (paginated && page > 1 ? `?page=${page}` : ''),
    image: appUrl() + '/logo%203.png', type: 'website',
    noindex: /^\/(admin|auth|register|newsletter|search)(\/|$)/.test(path) || Boolean(req.query.search),
  };
  res.locals.articlePath = articlePath;
  res.locals.jsonLd = jsonLd;
  res.locals.googleVerification = process.env.GOOGLE_SITE_VERIFICATION || '';
  next();
}

export function robotsTxt(req, res) {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /uploads/tmp/\nSitemap: ${appUrl()}/sitemap.xml\n`);
}
