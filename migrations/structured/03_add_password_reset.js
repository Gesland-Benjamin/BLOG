import { sequelize } from '../../config/database.js';
import { DataTypes } from 'sequelize';

export const name = '03_add_password_reset';

export async function up() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('📦 Ajout des champs de réinitialisation de mot de passe...');
  
  await queryInterface.addColumn('USER', 'reset_token', {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true
  });
  
  await queryInterface.addColumn('USER', 'reset_token_expiry', {
    type: DataTypes.DATE,
    allowNull: true
  });
  
  console.log('✅ Migration 03 terminée');
}

export async function down() {
  const queryInterface = sequelize.getQueryInterface();
  
  console.log('🔄 Rollback des champs de réinitialisation...');
  
  await queryInterface.removeColumn('USER', 'reset_token_expiry');
  await queryInterface.removeColumn('USER', 'reset_token');
  
  console.log('✅ Rollback 03 terminé');
}
