import { sequelize } from '../../config/database.js';
import { DataTypes } from 'sequelize';

export const name = '06_create_article_likes_table';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('📦 Création de la table article_likes...');

  await queryInterface.createTable('article_likes', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    article_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'articles', key: 'id' },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    },
    ip: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  console.log('✅ Table article_likes créée');
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('🔄 Suppression de la table article_likes...');
  await queryInterface.dropTable('article_likes');
  console.log('✅ Table article_likes supprimée');
}
