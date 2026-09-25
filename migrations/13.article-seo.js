// Dedicated additive migration. Importing this module never connects or writes.
import { DataTypes } from 'sequelize';
import { slugify } from '../utils/seo.js';
export async function up(db) {
  const qi = db.getQueryInterface();
  const table = await qi.describeTable('articles');
  for (const name of ['id', 'title', 'created_at', 'updated_at']) {
    if (!table[name]) throw new Error(`Schéma inattendu : articles.${name} absent. Aucune colonne ajoutée.`);
  }
  const ambiguous = ['status', 'statut', 'published', 'seoTitle', 'metaDescription', 'publishedAt', 'date_publication'];
  if (ambiguous.some(name => table[name])) throw new Error('Champs historiques à examiner avant migration SEO. Aucune colonne ajoutée.');
  const dialect = db.getDialect?.();
  if (dialect === 'mysql' || dialect === 'postgres') {
    const triggerQuery = dialect === 'mysql'
      ? "SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE EVENT_OBJECT_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'articles'"
      : "SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = current_schema() AND event_object_table = 'articles'";
    const [triggers] = await db.query(triggerQuery);
    if (triggers.length) throw new Error('Triggers articles à examiner avant le backfill. Aucune colonne ajoutée.');
  }
  const columns = {
    slug: { type: DataTypes.STRING(255), allowNull: true },
    seo_title: { type: DataTypes.STRING(255), allowNull: true },
    meta_description: { type: DataTypes.STRING(320), allowNull: true },
    image_alt: { type: DataTypes.STRING(255), allowNull: true },
    is_published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    published_at: { type: DataTypes.DATE, allowNull: true },
    related_article_ids: { type: DataTypes.JSON, allowNull: true }
  };
  for (const [name, definition] of Object.entries(columns)) {
    if (!table[name]) await qi.addColumn('articles', name, definition);
  }
  const indexes = await qi.showIndex('articles');
  if (!indexes.some(index => index.unique && index.fields.length === 1 && index.fields[0].attribute === 'slug')) {
    // Existing duplicate values cause a safe failure, never an overwrite.
    await qi.addIndex('articles', ['slug'], { unique: true, name: 'articles_slug_unique' });
  }
  let lastId = 0;
  for (;;) {
    const [rows] = await db.query('SELECT id, title FROM articles WHERE id > ? AND (slug IS NULL OR slug = ?) ORDER BY id LIMIT 200', { replacements: [lastId, ''] });
    if (!rows.length) break;
    for (const row of rows) {
      const base = `${slugify(row.title)}-${row.id}`;
      let suffix = 0;
      for (;;) {
        const slug = suffix ? `${base}-${suffix}` : base;
        try {
          // Explicit self-assignment also preserves MySQL ON UPDATE timestamps.
          await db.query('UPDATE articles SET slug = ?, updated_at = updated_at WHERE id = ? AND (slug IS NULL OR slug = ?)', { replacements: [slug, row.id, ''] });
          break;
        } catch (error) {
          if (error.name !== 'SequelizeUniqueConstraintError' || ++suffix > 100) throw error;
        }
      }
      lastId = row.id;
    }
  }
}
// No destructive reverse migration: roll back application code, retain columns.
