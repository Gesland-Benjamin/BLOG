import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';

async function migrateUp() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Vérifier si la colonne existe déjà
    const table = await queryInterface.describeTable('article');
    if (!table.video) {
      await queryInterface.addColumn('article', 'video', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Colonne video ajoutée à la table article');
    } else {
      console.log('ℹ️  La colonne video existe déjà');
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
    await queryInterface.removeColumn('article', 'video');
    console.log('✅ Colonne video supprimée de la table article');
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
