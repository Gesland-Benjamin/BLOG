import { sequelize } from '../../config/database.js';
import { DataTypes } from 'sequelize';

export const name = '07_fix_article_likes_fk';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('📦 Correction de la clé étrangère article_likes -> articles...');

  try {
    await queryInterface.removeConstraint('article_likes', 'article_likes_ibfk_1');
    console.log('  ✅ Ancienne contrainte supprimée');
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('does not exist') && !message.includes('unknown constraint')) {
      throw error;
    }
    console.log('  ℹ️  Ancienne contrainte absente ou déjà supprimée');
  }

  await queryInterface.addConstraint('article_likes', {
    fields: ['article_id'],
    type: 'foreign key',
    name: 'article_likes_article_id_fk',
    references: {
      table: 'articles',
      field: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  console.log('✅ Clé étrangère corrigée vers articles.id');
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('🔄 Restauration de la clé étrangère article_likes -> article...');

  try {
    await queryInterface.removeConstraint('article_likes', 'article_likes_article_id_fk');
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('does not exist') && !message.includes('unknown constraint')) {
      throw error;
    }
  }

  await queryInterface.addConstraint('article_likes', {
    fields: ['article_id'],
    type: 'foreign key',
    name: 'article_likes_ibfk_1',
    references: {
      table: 'article',
      field: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });

  console.log('✅ Clé étrangère restaurée');
}
