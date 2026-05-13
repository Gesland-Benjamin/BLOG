import { sequelize } from '../../config/database.js';

export const name = '08_fix_article_likes_user_fk';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('📦 Correction de la clé étrangère article_likes.user_id -> users.id...');

  try {
    await queryInterface.removeConstraint('article_likes', 'article_likes_ibfk_2');
    console.log('  ✅ Ancienne contrainte supprimée');
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('does not exist') && !message.includes('unknown constraint')) {
      throw error;
    }
    console.log('  ℹ️  Ancienne contrainte absente ou déjà supprimée');
  }

  await queryInterface.addConstraint('article_likes', {
    fields: ['user_id'],
    type: 'foreign key',
    name: 'article_likes_user_id_fk',
    references: {
      table: 'users',
      field: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  console.log('✅ Clé étrangère article_likes.user_id corrigée vers users.id');
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('🔄 Restauration de la clé étrangère article_likes.user_id -> USER.id...');

  try {
    await queryInterface.removeConstraint('article_likes', 'article_likes_user_id_fk');
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('does not exist') && !message.includes('unknown constraint')) {
      throw error;
    }
  }

  await queryInterface.addConstraint('article_likes', {
    fields: ['user_id'],
    type: 'foreign key',
    name: 'article_likes_ibfk_2',
    references: {
      table: 'USER',
      field: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  console.log('✅ Clé étrangère restaurée');
}
