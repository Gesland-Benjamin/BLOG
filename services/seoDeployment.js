// Explicitly limited to the SEO migration; no historical migration runner.
import { up } from '../migrations/13.article-seo.js';

export async function checkSeoSchema(db) {
  const qi = db.getQueryInterface();
  const columns = await qi.describeTable('articles');
  const required = ['slug', 'seo_title', 'meta_description', 'image_alt', 'is_published', 'published_at', 'related_article_ids'];
  if (required.some(name => !columns[name])) return false;
  const indexes = await qi.showIndex('articles');
  if (!indexes.some(index => index.unique && index.fields.length === 1 && index.fields[0].attribute === 'slug')) return false;
  const [rows] = await db.query("SELECT COUNT(*) AS missing FROM articles WHERE slug IS NULL OR slug = ''");
  return Number(rows[0].missing) === 0;
}

export async function prepareSeoDeployment(db, { enabled = process.env.SEO_MIGRATION_ON_START === '1', migrate = up, log = console.log } = {}) {
  // A completed migration is never replayed, even if the switch is left enabled.
  if (await checkSeoSchema(db)) {
    log('[SEO] Schéma prêt. Aucune migration exécutée.');
    return;
  }
  if (!enabled) {
    const error = new Error('Migration SEO nécessaire avant le démarrage. Voir docs/seo/hostinger-sans-ssh.md.');
    error.code = 'SEO_SCHEMA_NOT_READY';
    throw error;
  }
  log('[SEO] Migration additive 13 : démarrage.');
  await migrate(db);
  if (!await checkSeoSchema(db)) {
    const error = new Error('Migration SEO incomplète ; démarrage interrompu.');
    error.code = 'SEO_MIGRATION_INCOMPLETE';
    throw error;
  }
  log('[SEO] Migration additive 13 terminée ; schéma vérifié.');
}
