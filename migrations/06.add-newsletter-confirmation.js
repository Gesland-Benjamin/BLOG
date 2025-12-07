import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';

async function addNewsletterConfirmationFields() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('📧 Ajout des champs de confirmation à newsletter_subscriber...');
    
    // Ajouter le champ confirmed (statut de confirmation)
    await queryInterface.addColumn('newsletter_subscriber', 'confirmed', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    // Ajouter le token de confirmation
    await queryInterface.addColumn('newsletter_subscriber', 'confirmation_token', {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true
    });
    
    // Ajouter la date de confirmation
    await queryInterface.addColumn('newsletter_subscriber', 'confirmed_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    
    console.log('✅ Champs de confirmation ajoutés avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des champs:', error);
    throw error;
  }
}

// Exécuter la migration
addNewsletterConfirmationFields()
  .then(() => {
    console.log('✅ Migration terminée');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  });
