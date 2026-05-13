import { sequelize } from '../../config/database.js';
import { DataTypes } from 'sequelize';

export const name = '04_add_newsletter_confirmation';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('📦 Ajout des champs de confirmation newsletter...');
  
  await queryInterface.addColumn('newsletter_subscriber', 'confirmed', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });
  
  await queryInterface.addColumn('newsletter_subscriber', 'confirmation_token', {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true
  });
  
  await queryInterface.addColumn('newsletter_subscriber', 'confirmed_at', {
    type: DataTypes.DATE,
    allowNull: true
  });
  
  console.log('✅ Migration 04 terminée');
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Rollback des champs de confirmation newsletter...');
  
  await queryInterface.removeColumn('newsletter_subscriber', 'confirmed_at');
  await queryInterface.removeColumn('newsletter_subscriber', 'confirmation_token');
  await queryInterface.removeColumn('newsletter_subscriber', 'confirmed');
  
  console.log('✅ Rollback 04 terminé');
}
