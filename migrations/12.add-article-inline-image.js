import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';

async function migrateUp() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Vérifier si la colonne existe déjà
    const table = await queryInterface.describeTable('articles');
    if (!table.image_inline) {
      await queryInterface.addColumn('articles', 'image_inline', {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Colonne image_inline ajoutée à la table articles');
    } else {
      console.log('ℹ️  La colonne image_inline existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

async function migrateDown() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    await queryInterface.removeColumn('articles', 'image_inline');
    console.log('✅ Colonne image_inline supprimée de la table articles');
  } catch (error) {
    console.error('❌ Erreur lors de la migration inverse:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Execute migration if this file is run directly
const args = process.argv.slice(2);
const action = args[0] || 'up';

if (action === 'up') {
  migrateUp().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
} else if (action === 'down') {
  migrateDown().catch((error) => {
    console.error('Rollback failed:', error);
    process.exit(1);
  });
}
