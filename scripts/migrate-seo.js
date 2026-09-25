import { sequelize } from '../config/database.js';
import { up } from '../migrations/13.article-seo.js';
// Explicit opt-in; never runs the historical migration chain.
if (!process.argv.includes('--apply')) {
  console.log('Aucune modification. Après sauvegarde et revue : node scripts/migrate-seo.js --apply');
} else {
  try { await up(sequelize); console.log('Migration SEO additive terminée.'); }
  catch (error) { console.error('Migration SEO arrêtée sans suppression :', error.name); process.exitCode = 1; }
  finally { await sequelize.close(); }
}
