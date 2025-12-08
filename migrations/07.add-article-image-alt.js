import { sequelize } from '../config/database.js';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Vérifier si la colonne existe déjà
    const table = await queryInterface.describeTable('article');
    
    if (!table.image_alt) {
      await queryInterface.addColumn('article', 'image_alt', {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      });
      console.log('Colonne image_alt ajoutée à la table article');
    } else {
      console.log('Colonne image_alt existe déjà');
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la colonne image_alt:', error);
    throw error;
  }
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    await queryInterface.removeColumn('article', 'image_alt');
    console.log('Colonne image_alt supprimée de la table article');
  } catch (error) {
    console.error('Erreur lors de la suppression de la colonne image_alt:', error);
    throw error;
  }
}
