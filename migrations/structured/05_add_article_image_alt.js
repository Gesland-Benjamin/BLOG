import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const name = "add_article_image_alt";

/**
 * Migration pour ajouter le champ image_alt à la table article
 * Permet de stocker un texte alternatif descriptif pour les images
 */
export async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    await queryInterface.addColumn('article', 'image_alt', {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      after: 'image'
    });
    
    console.log('✅ Colonne image_alt ajoutée à la table article');
  } catch (error) {
    // La colonne existe peut-être déjà
    if (error.message.includes('already exists') || error.message.includes('Duplicate column')) {
      console.log('ℹ️  La colonne image_alt existe déjà');
    } else {
      throw error;
    }
  }
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    await queryInterface.removeColumn('article', 'image_alt');
    console.log('✅ Colonne image_alt supprimée de la table article');
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('Unknown column')) {
      console.log('ℹ️  La colonne image_alt n\'existe pas');
    } else {
      throw error;
    }
  }
}
