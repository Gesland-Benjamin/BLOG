import { sequelize } from '../config/database.js';
import { up } from './05.add-password-reset.js';

async function runMigration() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_LOCAL_MIGRATIONS !== 'yes' || !['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST || 'localhost')) {
    throw new Error('Migration automatique refusée : environnement local explicitement autorisé requis.');
  }
  try {
    await up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migration terminée avec succès');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration();
