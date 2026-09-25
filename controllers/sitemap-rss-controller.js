import { safeLog, appUrl } from '../utils/security.js';
import { articlePath, isoDate } from '../utils/seo.js';
import { articlePlainText } from '../public/js/article-format.js';
import Article from '../models/Article.model.js';
import Categorie from '../models/Categorie.model.js';
import User from '../models/User.model.js';

export const escapeXml = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const chunkSize = 1000;
export async function generateSitemap(req, res) {
  try {
    const base = appUrl();
    const count = await Article.count(); // Default scope excludes drafts everywhere.
    const chunks = Math.max(1, Math.ceil(count / chunkSize));
    if (!req.query.page && chunks > 1) {
      const xml = Array.from({ length: chunks }, (_, i) => `<sitemap><loc>${escapeXml(`${base}/sitemap.xml?page=${i + 1}`)}</loc></sitemap>`).join('');
      return res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</sitemapindex>`);
    }
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isInteger(page) || page < 1 || page > chunks) return res.status(404).send('Sitemap introuvable');
    const articles = await Article.findAll({ attributes: ['id', 'slug', 'updated_at', 'created_at', 'published_at'], order: [['id', 'ASC']], limit: chunkSize, offset: (page - 1) * chunkSize });
    const urls = [];
    if (page === 1) {
      urls.push(...['/', '/article', '/a-propos', '/renseignements', '/mentions-legales'].map(path => ({ path })));
      const categories = await Categorie.findAll({ attributes: ['id', 'name'], include: [{ model: Article, as: 'categoryArticles', attributes: [], required: true }], order: [['name', 'ASC']] });
      urls.push(...categories.map(category => ({ path: `/article/categorie/${encodeURIComponent(category.name)}` })));
      const where = process.env.EMI_AUTHOR_ID ? { id: process.env.EMI_AUTHOR_ID } : process.env.EMI_AUTHOR_EMAIL ? { email: process.env.EMI_AUTHOR_EMAIL } : null;
      if (where && await User.findOne({ where, attributes: ['id'] })) urls.push({ path: '/auteur/emilie' });
    }
    urls.push(...articles.map(article => ({ path: articlePath(article), modified: isoDate(article.updated_at || article.published_at || article.created_at) })));
    const xml = urls.map(url => `<url><loc>${escapeXml(base + url.path)}</loc>${url.modified ? `<lastmod>${url.modified}</lastmod>` : ''}</url>`).join('');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`);
  } catch (error) { safeLog(error); res.status(500).send('Erreur sitemap'); }
}
async function feedArticles(req) {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return Article.findAll({ attributes: ['id', 'slug', 'title', 'content', 'created_at', 'published_at', 'updated_at'], order: [['created_at', 'DESC']], limit });
}
export async function generateRssFeed(req, res) {
  try {
    const articles = await feedArticles(req), base = appUrl();
    const items = articles.map(article => {
      const published = isoDate(article.published_at || article.created_at);
      return `<item><title>${escapeXml(article.title)}</title><link>${escapeXml(base + articlePath(article))}</link><guid isPermaLink="true">${escapeXml(`${base}/article/${article.id}`)}</guid>${published ? `<pubDate>${new Date(published).toUTCString()}</pubDate>` : ''}<description>${escapeXml(articlePlainText(article.content).slice(0, 500))}</description></item>`;
    }).join('');
    res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Emi’Pulse</title><link>${escapeXml(base)}</link><description>Les derniers articles d’Emi’Pulse</description>${items}</channel></rss>`);
  } catch (error) { safeLog(error); res.status(500).send('Erreur RSS'); }
}
export async function generateAtomFeed(req, res) {
  try {
    const articles = await feedArticles(req), base = appUrl();
    const entries = articles.map(article => {
      const updated = isoDate(article.updated_at || article.published_at || article.created_at);
      if (!updated) return ''; // Do not fabricate an article date required by Atom.
      return `<entry><title>${escapeXml(article.title)}</title><link href="${escapeXml(base + articlePath(article))}"/><id>${escapeXml(`${base}/article/${article.id}`)}</id><updated>${updated}</updated><summary>${escapeXml(articlePlainText(article.content).slice(0, 500))}</summary></entry>`;
    }).join('');
    const updated = articles.map(a => isoDate(a.updated_at || a.created_at)).filter(Boolean).sort().at(-1) || new Date().toISOString();
    res.type('application/atom+xml').send(`<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Emi’Pulse</title><link href="${escapeXml(base)}"/><id>${escapeXml(base)}</id><updated>${updated}</updated><author><name>Emi’Pulse</name></author>${entries}</feed>`);
  } catch (error) { safeLog(error); res.status(500).send('Erreur Atom'); }
}
