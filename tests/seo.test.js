import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ejs from 'ejs';
import express from 'express';
import { Sequelize, DataTypes, Op, literal } from 'sequelize';
import * as seo from '../utils/seo.js';
import * as security from '../utils/security.js';
import * as formatting from '../public/js/article-format.js';
import * as content from '../public/js/article-content.js';
import * as pagination from '../utils/pagination.js';
import * as dates from '../utils/date.js';
import * as video from '../utils/videoHelper.js';
import { up } from '../migrations/13.article-seo.js';
import { articleSchema } from '../validators/schemas.js';

process.env.APP_URL = 'https://blog.example';
process.env.EMI_AUTHOR_EMAIL = 'emi@example.test';
const record = { id: 35, slug: 'arretons-de-tout-normaliser-35', title: 'Arrêtons de tout normaliser',
  content: 'Introduction historique.\n\n## Première partie\nUn **texte**.\n\n### Détail\nUne précision.\n\n## Suite\nLa suite.',
  created_at: new Date('2020-02-03T12:00:00Z'), updated_at: new Date('2022-04-05T09:00:00Z'),
  published_at: null, is_published: true, image: '/uploads/ancienne.jpg', image_inline: null,
  categorieId: 2, userId: 7, categorie: { id: 2, name: 'Bien-être & beauté' }, author: { id: 7, name: 'Émilie', email: 'emi@example.test' } };
const draft = { ...record, id: 36, slug: 'brouillon-prive', is_published: false };
const rows = [record, draft];
const Article = {
  findOne: async ({ where }) => rows.find(a => a.is_published && (where.id ? String(a.id) === String(where.id) : a.slug === where.slug)),
  findByPk: async id => rows.find(a => a.is_published && a.id === Number(id)),
  findAll: async () => rows.filter(a => a.is_published), count: async () => rows.filter(a => a.is_published).length,
  unscoped() { return this; }
};
const User = { findOne: async () => record.author };
const Categorie = { findAll: async () => [record.categorie] };
const Commentaire = { count: async () => 0, findAll: async () => [] };
async function mockedModule(file, stubs) {
  const module = new vm.SourceTextModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { identifier: file });
  await module.link(async name => {
    assert.ok(name in stubs, `Import non autorisé : ${name}`);
    const values = stubs[name];
    return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); });
  });
  await module.evaluate(); return module.namespace;
}
const helpers = {
  '../utils/seo.js': seo, '../utils/security.js': security,
  '../models/Article.model.js': { default: Article }, '../models/User.model.js': { default: User },
  '../models/Categorie.model.js': { default: Categorie }, '../public/js/article-format.js': formatting,
  '../utils/pagination.js': pagination
};
const controller = await mockedModule('../controllers/article-controller.js', {
  ...helpers, '../public/js/article-content.js': content,
  '../services/articleImage.js': { articleImageDimensions: async () => null, articleImageSrcset: async () => '' },
  '../config/database.js': { default: {} }, '../models/Commentaire.model.js': { default: Commentaire },
  '../models/ArticleLike.model.js': { default: { findOne: async () => null } },
  sequelize: { Op, literal }, '../services/imageHelper.js': { generateOpenGraphImage: () => '' },
  '../utils/videoHelper.js': video, '../utils/date.js': dates
});
const feeds = await mockedModule('../controllers/sitemap-rss-controller.js', helpers);
const baseLocals = { csrfToken: 'test-csrf', cspNonce: 'test-nonce', user: null, categories: [], message: null,
  articlePath: seo.articlePath, jsonLd: seo.jsonLd, errors: [], formData: {}, googleVerification: '' };
function response() {
  return { locals: { seo: {} }, statusCode: 200, status(code) { this.statusCode = code; return this; },
    type(type) { this.contentType = type; return this; }, send(body) { this.body = body; return this; },
    render(view, data) { this.view = view; this.data = data; return this; },
    redirect(code, url) { this.statusCode = code; this.url = url; return this; } };
}
const request = id => ({ params: { id }, query: {}, headers: {}, ip: '127.0.0.1' });

test('URLs historiques 301, slug 200, article absent et brouillon 404 (contrôleur réel)', async () => {
  const old = response(); await controller.getArticleById(request('35'), old);
  assert.equal(old.statusCode, 301); assert.equal(old.url, '/article/' + record.slug);
  const result = response(); await controller.getArticleById(request(record.slug), result);
  assert.equal(result.statusCode, 200); assert.equal(result.view, 'article-detail');
  assert.equal(result.data.article.contenu, record.content);
  assert.equal(result.data.article.image, record.image);
  for (const key of ['999', 'inexistant', '36', draft.slug]) {
    const missing = response(); await controller.getArticleById(request(key), missing); assert.equal(missing.statusCode, 404);
  }
});
test('rendu article : canonical, seul H1, auteur, vraies dates, OG, Twitter, JSON-LD et sommaire', async () => {
  const result = response(); await controller.getArticleById(request(record.slug), result);
  const html = await ejs.renderFile('views/article-detail.ejs', { ...baseLocals, ...result.data });
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /rel="canonical" href="https:\/\/blog.example\/article\/arretons-de-tout-normaliser-35"/);
  assert.match(html, /Par <strong>Émilie<\/strong>/);
  assert.ok(!html.includes('/auteur/emilie'));
  assert.ok(!html.includes('À propos d’Emi'));
  assert.match(html, /fetchpriority="high"/);
  assert.match(html, /property="og:image" content="https:\/\/blog.example\/uploads\/ancienne.jpg"/);
  assert.match(html, /name="twitter:image"/);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  const blog = schemas.find(schema => schema['@type'] === 'BlogPosting');
  assert.equal(blog.author.name, 'Émilie'); assert.equal(blog.datePublished, '2020-02-03T12:00:00.000Z');
  assert.equal(blog.dateModified, '2022-04-05T09:00:00.000Z'); assert.equal(blog.headline, record.title);
  assert.equal(schemas[1]['@type'], 'BreadcrumbList');
  assert.match(html, /href="#section-premiere-partie"/);
  assert.equal(result.data.article.date_publication_iso, blog.datePublished);
});
test('titre/description manuels, fallback ancien article et aucune date/auteur inventés', () => {
  const fallback = seo.articleSeo(record); assert.equal(fallback.title, record.title); assert.ok(fallback.description.includes('Introduction'));
  const custom = seo.articleSeo({ ...record, seo_title: 'Titre SEO distinct', meta_description: 'Description personnelle.' });
  assert.equal(custom.title, 'Titre SEO distinct'); assert.equal(custom.description, 'Description personnelle.');
  assert.equal(custom.schema.headline, record.title);
  const minimal = seo.articleSeo({ id: 1, title: 'Titre', content: '' });
  assert.equal(minimal.description, 'Titre'); assert.equal(minimal.schema.author, undefined);
  assert.equal(minimal.schema.datePublished, undefined); assert.equal(minimal.schema.dateModified, undefined);
  const payload = '</script><script>alert(1)</script>';
  assert.ok(!seo.jsonLd({ headline: payload }).includes('<'));
  assert.equal(JSON.parse(seo.jsonLd({ headline: payload })).headline, payload);
});
test('slugs français, collisions et stabilité au changement de titre', async () => {
  assert.equal(seo.slugify('À l’Œuvre ! Ça, c’est Émilie'), 'a-l-oeuvre-ca-c-est-emilie');
  assert.equal(seo.slugify('!!!'), 'article');
  const slugs = new Set(Array.from({ length: 1000 }, () => seo.newSlug('Même titre'))); assert.equal(slugs.size, 1000);
  const db = new Sequelize('test', 'test', 'test', { dialect: 'mysql', logging: false });
  let options, query;
  db.query = async (_sql, opts) => { options = opts; query = _sql; return []; }; // No network or database.
  const { default: Model } = await mockedModule('../models/Article.model.js', { sequelize: { DataTypes }, '../config/database.js': { default: db }, '../utils/seo.js': seo });
  assert.equal(Model.rawAttributes.slug.unique, true);
  const fresh = Model.build({ title: 'Test', content: 'Contenu', userId: 1, categorieId: 1 });
  await Model.runHooks('beforeValidate', fresh); assert.match(fresh.slug, /^test-/); assert.ok(fresh.published_at);
  const old = Model.build({ ...record, title: 'Nouveau titre' }, { isNewRecord: false });
  await Model.runHooks('beforeValidate', old); assert.equal(old.slug, record.slug); assert.equal(old.published_at, null);
  await Model.findAll(); assert.match(query, /`Article`\.`is_published` = true/);
  await Model.unscoped().findAll(); assert.equal(options.where, undefined);
  const privateArticle = Model.build({ title: 'Brouillon', is_published: false });
  await Model.runHooks('beforeValidate', privateArticle); assert.equal(privateArticle.published_at, undefined);
  await db.close();
});
test('sitemap XML : URLs publiques, dates historiques et exclusion brouillons', async () => {
  const res = response(); await feeds.generateSitemap({ query: {} }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.contentType, 'application/xml');
  assert.ok(res.body.includes(record.slug)); assert.ok(!res.body.includes(draft.slug));
  assert.ok(!res.body.includes('/admin')); assert.ok(!res.body.includes('/article/35<'));
  assert.ok(res.body.includes('<lastmod>2022-04-05T09:00:00.000Z</lastmod>'));
  assert.ok(!res.body.includes('/a-propos')); assert.ok(!res.body.includes('/auteur/emilie'));
  for (const handler of [feeds.generateRssFeed, feeds.generateAtomFeed]) {
    const result = response(); await handler({ query: {} }, result); assert.equal(result.statusCode, 200);
    assert.ok(result.body.includes(record.slug)); assert.ok(!result.body.includes(draft.slug)); assert.ok(!result.body.includes('Invalid Date'));
  }
});
test('sitemap index et bornes de pagination', async () => {
  const count = Article.count; Article.count = async () => 1001;
  try {
    const res = response(); await feeds.generateSitemap({ query: {} }, res); assert.match(res.body, /<sitemapindex/); assert.match(res.body, /page=2/);
    const invalid = response(); await feeds.generateSitemap({ query: { page: '3' } }, invalid); assert.equal(invalid.statusCode, 404);
  } finally { Article.count = count; }
});
test('canonical paginée, recherche privée, tokens réels et URLs sans paramètres de suivi', () => {
  for (const [path, query, expected] of [['/article/categorie/Beauté', { page: '2', utm_source: 'x' }, '/article/categorie/Beauté?page=2'], ['/article/test', { page: '2' }, '/article/test']]) {
    const res = response(); seo.seoLocals({ path, query }, res, () => {}); assert.equal(res.locals.seo.canonical, process.env.APP_URL + expected);
  }
  const res = response(); seo.seoLocals({ path: '/admin/articles/new', query: {} }, res, () => {}); assert.equal(res.locals.seo.noindex, true);
  assert.equal(pagination.createPaginationData(40, 2, 10, '/search?q=emi').next_url, '/search?q=emi&page=3');
});
test('contenu : HTML échappé, liens internes limités, ancres stables, pas de H1 injecté', () => {
  const rendered = content.renderArticleContent('## Énergie\n\nTexte\n\n## Énergie\n\n[Lire](/article/test)\n\n[Mal](javascript:alert(1))\n\n<h1>Attaque</h1>');
  assert.equal(rendered.toc[0].id, 'section-energie'); assert.equal(rendered.toc[1].id, 'section-energie-2');
  assert.ok(rendered.html.includes('<a href="/article/test">Lire</a>')); assert.ok(!rendered.html.includes('<h1>'));
  assert.ok(!rendered.html.includes('href="javascript:')); assert.equal(content.renderArticleContent('## Court\nTexte').toc.length, 0);
  assert.equal(content.renderArticleContent('Ancien **texte**\nligne.').html, '<p>Ancien <strong>texte</strong><br>ligne.</p>');
});
test('migration additive relançable : champs existants, contenus et dates préservés, collision gérée', async () => {
  const columns = { id: {}, title: {}, created_at: {}, updated_at: {}, image_alt: {} }, indexes = [], calls = [];
  const old = { id: 35, title: 'Été', slug: null, content: 'Précieux', created_at: '2020', updated_at: '2022' };
  let collision = true;
  const qi = { describeTable: async () => columns, addColumn: async (_table, name, value) => { calls.push(name); columns[name] = value; },
    showIndex: async () => indexes, addIndex: async () => indexes.push({ unique: true, fields: [{ attribute: 'slug' }] }) };
  const db = { getQueryInterface: () => qi, query: async (sql, { replacements }) => {
    assert.ok(!/\b(DROP|DELETE|TRUNCATE|ALTER)\b/i.test(sql));
    if (sql.startsWith('SELECT')) return [[...(old.slug ? [] : [old])]];
    assert.match(sql, /updated_at = updated_at/); assert.match(sql, /slug IS NULL OR slug =/);
    if (collision) { collision = false; const error = new Error(); error.name = 'SequelizeUniqueConstraintError'; throw error; }
    old.slug = replacements[0]; return [1];
  } };
  await up(db); await up(db);
  assert.equal(old.slug, 'ete-35-1'); assert.equal(old.content, 'Précieux'); assert.equal(old.created_at, '2020'); assert.equal(old.updated_at, '2022');
  assert.equal(calls.filter(name => name === 'slug').length, 1); assert.ok(!calls.includes('image_alt')); assert.equal(indexes.length, 1);
  assert.equal(columns.is_published.defaultValue, true);
});
test('formulaire accepte les champs facultatifs et refuse liens liés hors limites', () => {
  const value = { title: 'Ancien titre', content: 'Texte '.repeat(20), categorieId: 1 };
  assert.equal(articleSchema.validate(value).error, undefined);
  assert.equal(articleSchema.validate({ ...value, seo_title: '', meta_description: '', is_published: 'false', related_article_ids: '35' }).error, undefined);
  assert.ok(articleSchema.validate({ ...value, related_article_ids: [1, 2, 3, 4, 5, 6] }).error);
});
test('pages publiques et administration : rendu avec les nouveaux locals', async () => {
  const data = { ...baseLocals, seo: seo.articleSeo(record), author: record.author, articles: [record], pagination: pagination.createPaginationData(1, 1, 9, '/auteur/emilie'), baseUrl: '/auteur/emilie',
    article: record, linkArticles: [record], isEditing: true, ogImageTags: '', articlesParCategorie: [], recentPosts: [], featuredArticle: null, carouselItems: [], topLikedSections: [], archiveMonths: [] };
  for (const name of ['404', 'new-article', 'index', 'article']) {
    const html = await ejs.renderFile(`views/${name}.ejs`, { ...data, ...(name === 'article' ? { article: undefined } : {}) }); assert.ok(html.includes('</html>'), name);
  }
});

test('HTTP : router articles, sitemap et robots sans connexion à une base', async t => {
  const route = await mockedModule('../routes/article.js', {
    express: { Router: express.Router }, '../controllers/article-controller.js': controller,
    '../middleware/validate.js': { validateRequest: () => (_req, _res, next) => next() },
    '../validators/schemas.js': { commentSchema: {} },
    '../middleware/rateLimit.js': { likeRateLimit: (_req, _res, next) => next(), commentRateLimit: (_req, _res, next) => next() }
  });
  const app = express(); app.set('view engine', 'ejs'); app.set('views', 'views');
  app.use((_req, res, next) => { Object.assign(res.locals, baseLocals); next(); });
  app.use(seo.seoLocals); app.use('/article', route.default);
  app.get('/sitemap.xml', feeds.generateSitemap); app.get('/robots.txt', seo.robotsTxt);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const old = await fetch(base + '/article/35', { redirect: 'manual' });
  assert.equal(old.status, 301); assert.equal(old.headers.get('location'), seo.articlePath(record));
  const canonical = await fetch(base + seo.articlePath(record)); assert.equal(canonical.status, 200); assert.match(await canonical.text(), /BlogPosting/);
  for (const key of ['999', draft.slug]) assert.equal((await fetch(base + '/article/' + key)).status, 404);
  const sitemap = await fetch(base + '/sitemap.xml'); assert.equal(sitemap.status, 200); assert.match(sitemap.headers.get('content-type'), /application\/xml/);
  const robots = await fetch(base + '/robots.txt'); assert.equal(robots.status, 200); assert.match(await robots.text(), /Sitemap: https:\/\/blog.example\/sitemap.xml/);
});

test('édition : SEO manuel, images, slug et dates historiques conservés ; première publication du brouillon', async () => {
  let current, saved;
  const model = { unscoped() { return this; }, findByPk: async () => current };
  const mod = await mockedModule('../controllers/admin-article-controller.js', {
    ...helpers, '../models/Article.model.js': { default: model },
    '../services/image.js': { deleteProcessedImages: async () => { throw new Error('Ne doit pas supprimer les images'); } },
    path: { default: { dirname: () => '.' } }, url: { fileURLToPath: () => '.' },
    '../utils/videoHelper.js': video,
    '../utils/uploadPaths.js': { getImageBaseName: () => null, getUploadsDir: () => '/unused' }
  });
  const run = async values => {
    saved = null;
    const req = { params: { id: '35' }, body: { title: 'Nouveau titre', content: record.content, categorieId: 2, ...values } };
    await mod.updateArticle(req, response()); assert.ok(saved); return saved;
  };
  current = { ...record, meta_description: 'Ne pas écraser', update: async value => { saved = value; Object.assign(current, value); } };
  await run({ is_published: 'false' });
  assert.equal(saved.published_at, record.created_at); assert.equal(saved.image, record.image); assert.equal(saved.image_inline, null);
  assert.equal(current.slug, record.slug); assert.equal(current.meta_description, 'Ne pas écraser');
  await run({ is_published: 'true' }); assert.equal(current.published_at, record.created_at);
  current = { ...draft, published_at: null, update: async value => { saved = value; Object.assign(current, value); } };
  await run({ is_published: 'true', seo_title: 'SEO', meta_description: 'Manuelle' });
  assert.ok(saved.published_at instanceof Date); assert.equal(saved.meta_description, 'Manuelle'); assert.equal(saved.seo_title, 'SEO');
});

test('transition : article historique sans slug reste accessible, sans toucher à la donnée', async () => {
  const savedSlug = record.slug;
  try {
    record.slug = null;
    const res = response(); await controller.getArticleById(request('35'), res);
    assert.equal(res.statusCode, 200); assert.equal(res.data.seo.canonical, 'https://blog.example/article/35');
    assert.equal(record.slug, null);
  } finally { record.slug = savedSlug; }
});
test('migration refuse schéma ambigu et triggers avant la première écriture', async () => {
  for (const mode of ['schema', 'trigger']) {
    const table = { id: {}, title: {}, created_at: {}, updated_at: {}, ...(mode === 'schema' ? { statut: {} } : {}) };
    let writes = 0;
    const db = { getDialect: () => 'mysql', getQueryInterface: () => ({ describeTable: async () => table, addColumn: async () => writes++ }),
      query: async sql => { assert.match(sql, /^SELECT/); return [[{ TRIGGER_NAME: 'unknown' }]]; } };
    await assert.rejects(() => up(db)); assert.equal(writes, 0);
  }
});

test('images locales : dimensions et srcset réels, images anciennes/absentes préservées', async () => {
  const { default: sharp } = await import('sharp');
  const { default: os } = await import('node:os');
  const path = await import('node:path');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'emipulse-dimensions-'));
  const previous = process.env.STATIC_DIR; process.env.STATIC_DIR = directory;
  const { articleImageDimensions, articleImageSrcset } = await import('../services/articleImage.js');
  try {
    await sharp({ create: { width: 250, height: 100, channels: 3, background: '#fff' } }).webp().toFile(path.join(directory, 'test_md.webp'));
    await sharp({ create: { width: 500, height: 200, channels: 3, background: '#fff' } }).webp().toFile(path.join(directory, 'test_lg.webp'));
    const dimensions = await articleImageDimensions('/uploads/test_md.webp'); assert.deepEqual(dimensions, { width: 250, height: 100 });
    assert.equal(await articleImageSrcset('/uploads/test_md.webp', dimensions), '/uploads/test_md.webp 250w, /uploads/test_lg.webp 500w');
    assert.equal(await articleImageDimensions('/uploads/absente.jpg'), null);
    assert.equal(await articleImageDimensions('https://example.test/image.jpg'), null);
    assert.equal(await articleImageDimensions('/uploads/../private.jpg'), null);
    assert.equal(await articleImageSrcset('/uploads/ancienne.jpg', dimensions), '');
  } finally {
    if (previous === undefined) delete process.env.STATIC_DIR; else process.env.STATIC_DIR = previous;
    fs.rmSync(directory, { recursive: true }); // This test's newly created directory only.
  }
});
