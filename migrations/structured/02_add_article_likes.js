import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';

export const name = '02_add_article_likes';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('📦 Ajout du champ likes aux articles...');
  
  await queryInterface.addColumn('article', 'likes', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  });
  
  console.log('✅ Migration 02 terminée');
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Rollback du champ likes...');
  
  await queryInterface.removeColumn('article', 'likes');
  
  console.log('✅ Rollback 02 terminé');
}
