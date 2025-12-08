import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';

async function migrateUp() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Vérifier si les colonnes existent déjà
    const table = await queryInterface.describeTable('commentaire');
    
    if (!table.parent_id) {
      await queryInterface.addColumn('commentaire', 'parent_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'commentaire',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      console.log('✅ Colonne parent_id ajoutée à la table commentaire');
    } else {
      console.log('ℹ️  La colonne parent_id existe déjà');
    }
    
    if (!table.is_admin_reply) {
      await queryInterface.addColumn('commentaire', 'is_admin_reply', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✅ Colonne is_admin_reply ajoutée à la table commentaire');
    } else {
      console.log('ℹ️  La colonne is_admin_reply existe déjà');
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
    await queryInterface.removeColumn('commentaire', 'is_admin_reply');
    console.log('✅ Colonne is_admin_reply supprimée de la table commentaire');
    
    await queryInterface.removeColumn('commentaire', 'parent_id');
    console.log('✅ Colonne parent_id supprimée de la table commentaire');
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
