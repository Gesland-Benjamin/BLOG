import { sequelize } from '../config/database.js';
import { up } from './05.add-password-reset.js';

async function runMigration() {
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
