import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const name = "09_add_article_video";

export async function up() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await queryInterface.addColumn('articles', 'video', {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      after: 'image'
    });
    console.log('✅ Colonne video ajoutée à la table articles');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate column') || error.message.includes('Unknown column')) {
      console.log('ℹ️  La colonne video existe probablement déjà');
    } else {
      throw error;
    }
  }
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await queryInterface.removeColumn('articles', 'video');
    console.log('✅ Colonne video supprimée de la table articles');
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('Unknown column')) {
      console.log('ℹ️  La colonne video n\'existe pas');
    } else {
      throw error;
    }
  }
}
